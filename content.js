'use strict';
const synth = window.speechSynthesis;
let ttsEngine = 'auto';
let isPlaying = false;
let isPaused = false;
let autoNext = true;
let currentSpeed = 1.0;
let currentVolume = 1.0;
let currentVoiceIndex = -1;
let availableVoices = [];
let apiKeys = { fpt_key: '', azure_key: '', azure_region: 'southeastasia', gcp_key: '' };

let wsChunks = [];
let wsIndex = 0;
let currentUtt = null;

let currentAudio = null;
let audioChunks = [];
let audioIndex = 0;
let blobUrls = [];
let elapsedSeconds = 0;
let isFetchingChunks = false;

setInterval(() => {
    if (isPlaying && !isPaused) elapsedSeconds++;
}, 1000);

function loadVoices() {
    availableVoices = synth.getVoices();
    if (!availableVoices.length) {
        synth.addEventListener('voiceschanged', () => { availableVoices = synth.getVoices(); }, { once: true });
    }
}
loadVoices();

function hasVietnameseVoice() {
    return availableVoices.some(v => v.lang && v.lang.startsWith('vi'));
}

async function fetchAndCacheCover() {
    const p = window.location.pathname.split('/').filter(Boolean);
    if (p.length < 4 || p[0] !== 'truyen') return null;
    const bookPath = `/${p[0]}/${p[1]}/${p[2]}/${p[3]}/`;
    const key = `cover_${p[3]}`;

    return new Promise(resolve => {
        chrome.storage.local.get(key, async data => {
            if (data[key] && data[key].startsWith('http')) { resolve(data[key]); return; }
            try {
                const resp = await fetch(bookPath);
                const html = await resp.text();
                const doc = new DOMParser().parseFromString(html, 'text/html');
                let img = doc.querySelector('#thumb-prop') ||
                          doc.querySelector('#book_img') ||
                          doc.querySelector('.book-thumb img') ||
                          doc.querySelector('.book-cover img') ||
                          doc.querySelector('.itembox img') ||
                          doc.querySelector('meta[property="og:image"]');
                let src = img?.getAttribute('src') || img?.getAttribute('content');
                if (src) {
                    if (src.startsWith('/')) src = window.location.origin + src;
                    else if (!src.startsWith('http')) src = window.location.origin + '/' + src;
                    chrome.storage.local.set({ [key]: src });
                    resolve(src);
                } else {
                    resolve(null);
                }
            } catch { resolve(null); }
        });
    });
}

function injectStyles() {
    if (!document.getElementById('tts-styles')) {
        const style = document.createElement('style');
        style.id = 'tts-styles';
        style.textContent = `
            .tts-reading {
                background-color: rgba(232, 160, 69, 0.35) !important;
                border-radius: 4px;
                box-shadow: 0 0 0 2px rgba(232, 160, 69, 0.35) !important;
                transition: background-color 0.2s, box-shadow 0.2s;
                color: inherit !important;
            }
        `;
        document.head.appendChild(style);
    }
}

function prepareStoryContent() {
    injectStyles();
    let chunkNodes = [];
    let chunkIdCounter = 0;

    const addNode = (node, text) => {
        text = text.replace(/Đang tải nội dung chương\.\.\./gi, '').trim();
        if (text.length > 0) {
            if (!node.id) {
                node.id = `tts-chunk-t-${chunkIdCounter++}`;
            }
            node.classList.add('tts-chunk');
            chunkNodes.push({ id: node.id, text, el: node });
        }
    };

    const bookEl = document.getElementById('booknameholder') || document.getElementById('book_name2');
    if (bookEl && !bookEl.classList.contains('tts-chunk')) addNode(bookEl, bookEl.innerText);

    const chapEl = document.getElementById('bookchapnameholder');
    if (chapEl && !chapEl.classList.contains('tts-chunk')) addNode(chapEl, chapEl.innerText);

    const boxes = document.querySelectorAll('.contentbox');
    boxes.forEach(box => {
        const rawText = box.innerText.replace(/Đang tải nội dung chương\.\.\./gi, '').trim();
        const hasRealContent = rawText.length > 50;

        if (!box.dataset.ttsPrepared) {
            if (!hasRealContent) {
                return;
            }
            box.dataset.ttsPrepared = 'true';
            box.innerHTML = box.innerHTML.replace(/@Bạn đang đọc bản lưu[^\n<]*/gi, '');
            let html = box.innerHTML;
            let segments = html.split(/<br\s*\/?>|<\/?p[^>]*>|<\/?div[^>]*>|<\/?hr[^>]*>/i);
            let newHtml = segments.map((seg, i) => {
                if (seg.replace(/<[^>]*>/g, '').trim() === '') return seg;
                if (seg.includes('tts-chunk')) return seg;
                return `<span class="tts-chunk" id="tts-c-${Date.now()}-${i}">${seg}</span>`;
            }).join('<br><br>');
            box.innerHTML = newHtml;
        }
        box.querySelectorAll('.tts-chunk').forEach(span => {
            let txt = span.innerText || span.textContent || '';
            txt = txt.replace(/Đang tải nội dung chương\.\.\./gi, '').trim();
            if (txt.length > 2) {
                chunkNodes.push({ id: span.id, text: txt, el: span });
            }
        });
    });

    return chunkNodes;
}

function isContentReady() {
    const el = document.querySelector('.contentbox');
    if (!el) return false;
    const raw = el.innerText.replace(/@Bạn đang đọc bản lưu[^\n]*/g, '').trim();
    return raw.length > 50;
}

function splitTextToMaxLen(text, maxLen) {
    const chunks = [];
    const sentences = text.split(/(?<=[.!?。])\s+/);
    let current = '';
    for (const s of sentences) {
        if (!s.trim()) continue;
        if ((current + ' ' + s).trim().length <= maxLen) {
            current = (current + ' ' + s).trim();
        } else {
            if (current) chunks.push(current);
            if (s.length > maxLen) {
                const parts = s.split(/(?<=[,;:])\s+/);
                let sub = '';
                for (const p of parts) {
                    if ((sub + ' ' + p).trim().length <= maxLen) {
                        sub = (sub + ' ' + p).trim();
                    } else {
                        if (sub) chunks.push(sub);
                        for (let i = 0; i < p.length; i += maxLen) {
                            chunks.push(p.slice(i, i + maxLen));
                        }
                        sub = '';
                    }
                }
                if (sub) chunks.push(sub);
            } else {
                current = s.trim();
            }
        }
    }
    if (current) chunks.push(current);
    return chunks.length ? chunks : [text];
}

function buildEngineChunks(chunkNodes, maxLen) {
    let engineChunks = [];
    for (const node of chunkNodes) {
        const chunks = splitTextToMaxLen(node.text, maxLen);
        for (const c of chunks) {
            engineChunks.push({ text: c, el: node.el });
        }
    }
    return engineChunks;
}

function updateHighlight(index, chunksArray) {
    document.querySelectorAll('.tts-reading').forEach(el => el.classList.remove('tts-reading'));
    if (index >= 0 && index < chunksArray.length) {
        const el = chunksArray[index].el;
        if (el) {
            el.classList.add('tts-reading');
            if (isPlaying && !isPaused) {
                const rect = el.getBoundingClientRect();
                const inView = (rect.top >= 80 && rect.bottom <= window.innerHeight - 80);
                if (!inView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
}

async function getBookInfo() {
    let bookTitle = document.getElementById('booknameholder')?.innerText.trim() ||
                    document.getElementById('book_name2')?.innerText.trim() ||
                    document.querySelector('h1')?.innerText.trim() || '';
    let chapTitle = document.getElementById('bookchapnameholder')?.innerText.trim() || '';
    let imgUrl = '';

    const thumbImg = document.getElementById('thumb-prop');
    if (thumbImg?.src) {
        imgUrl = thumbImg.src;
    } else {
        for (const sel of ['img#book_img', 'img.book-cover', '.book-thumb img', 'img[src*="thumb"]', 'img[src*="cover"]']) {
            const el = document.querySelector(sel);
            let rawSrc = el?.getAttribute('src');
            if (rawSrc) {
                if (rawSrc.startsWith('/')) rawSrc = window.location.origin + rawSrc;
                else if (!rawSrc.startsWith('http')) rawSrc = window.location.origin + '/' + rawSrc;
                imgUrl = rawSrc;
                break;
            }
        }
    }

    const effectiveEngine = resolveEngine();
    const totalChunks = effectiveEngine === 'web' ? wsChunks.length : audioChunks.length;
    const curIdx = effectiveEngine === 'web' ? wsIndex : audioIndex;
    const p = window.location.pathname.split('/').filter(Boolean);
    const bookUrl = p.length >= 4 ? `${window.location.origin}/${p[0]}/${p[1]}/${p[2]}/${p[3]}/` : window.location.href;

    return {
        bookTitle, chapTitle, imgUrl, bookUrl,
        pageUrl: window.location.href,
        isPlaying, isPaused,
        ttsEngine: effectiveEngine,
        progress: totalChunks > 0 ? { current: curIdx + 1, total: totalChunks } : null
    };
}

function stopWebSpeech() {
    synth.cancel();
    currentUtt = null;
    wsChunks = [];
    wsIndex = 0;
    document.querySelectorAll('.tts-reading').forEach(el => el.classList.remove('tts-reading'));
}

function playWsChunk() {
    if (!isPlaying || isPaused) return;
    if (wsIndex >= wsChunks.length) {
        isPlaying = false;
        if (autoNext) setTimeout(clickNextChapter, 1200);
        return;
    }
    synth.cancel();
    updateHighlight(wsIndex, wsChunks);

    const chunkObj = wsChunks[wsIndex];
    const utt = new SpeechSynthesisUtterance(chunkObj.text);
    utt.lang = 'vi-VN';
    utt.rate = Math.min(Math.max(currentSpeed, 0.1), 10);
    utt.volume = currentVolume;

    if (currentVoiceIndex >= 0 && availableVoices[currentVoiceIndex]) {
        utt.voice = availableVoices[currentVoiceIndex];
    } else {
        const vi = availableVoices.find(v => v.lang && v.lang.startsWith('vi'));
        if (vi) utt.voice = vi;
    }
    currentUtt = utt;
    utt.onend = () => {
        if (currentUtt !== utt) return;
        wsIndex++;
        if (isPlaying && !isPaused) playWsChunk();
    };
    utt.onerror = (e) => {
        if (e.error === 'interrupted' || e.error === 'canceled') return;
        if (isPlaying && !isPaused) { wsIndex++; playWsChunk(); }
    };
    synth.speak(utt);
}

function startWebSpeech(chunkNodes) {
    stopWebSpeech();
    ttsEngine = 'web';
    wsChunks = buildEngineChunks(chunkNodes, 300);
    wsIndex = 0;
    isPlaying = true;
    isPaused = false;
    playWsChunk();
}

function stopAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
        currentAudio = null;
    }
    blobUrls.forEach(url => { try { URL.revokeObjectURL(url); } catch {} });
    blobUrls = [];
    audioChunks = [];
    audioIndex = 0;
    document.querySelectorAll('.tts-reading').forEach(el => el.classList.remove('tts-reading'));
}

function playAudioChunk() {
    if (!isPlaying || isPaused) return;
    if (audioIndex >= audioChunks.length) {
        if (isFetchingChunks) {
            if (isPlaying && !isPaused) setTimeout(playAudioChunk, 500);
            return;
        }
        if (audioChunks.length > 0) {
            isPlaying = false;
            if (autoNext) setTimeout(clickNextChapter, 1200);
        }
        return;
    }
    if (currentAudio) currentAudio.pause();

    const chunk = audioChunks[audioIndex];
    updateHighlight(audioIndex, audioChunks);

    const url = chunk.url || `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=${encodeURIComponent(chunk.text)}`;
    const audio = new Audio(url);
    currentAudio = audio;
    audio.volume = currentVolume;
    audio.playbackRate = Math.min(Math.max(currentSpeed, 0.5), 4.0);

    audio.onended = () => {
        if (currentAudio !== audio) return;
        audioIndex++;
        if (isPlaying && !isPaused) playAudioChunk();
    };
    audio.onerror = () => {
        if (currentAudio !== audio) return;
        audioIndex++;
        if (isPlaying && !isPaused) setTimeout(playAudioChunk, 300);
    };
    audio.play().catch(err => {
        if (currentAudio !== audio) return;
        if (err.name === 'NotAllowedError') {
            isPlaying = false;
            isPaused = true;
            chrome.runtime.sendMessage({ action: 'autoplayBlocked' });
            return;
        }
        audioIndex++;
        if (isPlaying && !isPaused) setTimeout(playAudioChunk, 300);
    });
}

function startGoogleTTS(chunkNodes) {
    stopAudio();
    ttsEngine = 'google';
    audioChunks = buildEngineChunks(chunkNodes, 150);
    audioIndex = 0;
    isPlaying = true;
    isPaused = false;
    isFetchingChunks = false;
    playAudioChunk();
}

async function startFptTTS(chunkNodes) {
    const key = apiKeys.fpt_key;
    if (!key) { startWebSpeech(chunkNodes); return; }
    stopAudio(); stopWebSpeech();
    ttsEngine = 'fpt';
    isPlaying = true;
    isPaused = false;
    audioIndex = 0;
    audioChunks = [];

    const fptVoices = ['banmai', 'leminh', 'thuminh', 'myan', 'giahuy', 'lannhi', 'linhsan'];
    const selectedVoice = fptVoices[currentVoiceIndex] || 'banmai';
    const engineChunks = buildEngineChunks(chunkNodes, 500);
    let firstPlay = false;
    isFetchingChunks = true;

    for (const chunk of engineChunks) {
        if (!isPlaying) break;
        try {
            const resp = await fetch('https://api.fpt.ai/hmi/tts/v5', {
                method: 'POST',
                headers: { 'api-key': key, 'speed': '0', 'voice': selectedVoice },
                body: chunk.text
            });
            if (!resp.ok) continue;
            const data = await resp.json();
            if (data.error || !data.audiourl) continue;
            
            audioChunks.push({ text: chunk.text, el: chunk.el, url: data.audiourl });
            if (!firstPlay) { firstPlay = true; playAudioChunk(); }
        } catch {}
    }
    isFetchingChunks = false;
    if (audioChunks.length === 0) startWebSpeech(chunkNodes);
}

async function startAzureTTS(chunkNodes) {
    const key = apiKeys.azure_key;
    const region = apiKeys.azure_region || 'southeastasia';
    if (!key) { startWebSpeech(chunkNodes); return; }
    stopAudio(); stopWebSpeech();
    ttsEngine = 'azure';
    isPlaying = true;
    isPaused = false;
    audioIndex = 0;
    audioChunks = [];

    const azureVoices = ['vi-VN-HoaiMyNeural', 'vi-VN-NamMinhNeural'];
    const selectedVoice = azureVoices[currentVoiceIndex] || 'vi-VN-HoaiMyNeural';

    const escXml = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const toSSML = t =>
        `<speak version='1.0' xml:lang='vi-VN'>` +
        `<voice xml:lang='vi-VN' name='${selectedVoice}'>` +
        `<prosody rate="${currentSpeed >= 1 ? '+' + Math.round((currentSpeed-1)*100) + '%' : '-' + Math.round((1-currentSpeed)*100) + '%'}">` +
        escXml(t) + `</prosody></voice></speak>`;

    const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const engineChunks = buildEngineChunks(chunkNodes, 1000);
    let firstPlay = false;
    isFetchingChunks = true;

    for (const chunk of engineChunks) {
        if (!isPlaying) break;
        try {
            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': key,
                    'Content-Type': 'application/ssml+xml',
                    'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
                    'User-Agent': 'STV-Reader/1.0'
                },
                body: toSSML(chunk.text)
            });
            if (!resp.ok) continue;
            const blob = await resp.blob();
            const blobUrl = URL.createObjectURL(blob);
            blobUrls.push(blobUrl);
            audioChunks.push({ text: chunk.text, el: chunk.el, url: blobUrl });
            if (!firstPlay) { firstPlay = true; playAudioChunk(); }
        } catch {}
    }
    isFetchingChunks = false;
    if (audioChunks.length === 0) startWebSpeech(chunkNodes);
}

async function startGcpTTS(chunkNodes) {
    const key = apiKeys.gcp_key;
    if (!key) { startWebSpeech(chunkNodes); return; }
    stopAudio(); stopWebSpeech();
    ttsEngine = 'gcp';
    isPlaying = true;
    isPaused = false;
    audioIndex = 0;
    audioChunks = [];

    const engineChunks = buildEngineChunks(chunkNodes, 1500);
    let firstPlay = false;
    isFetchingChunks = true;

    for (const chunk of engineChunks) {
        if (!isPlaying) break;
        try {
            const resp = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: { text: chunk.text },
                    voice: { languageCode: 'vi-VN', name: 'vi-VN-Standard-A' },
                    audioConfig: { audioEncoding: 'MP3', speakingRate: currentSpeed }
                })
            });
            if (!resp.ok) continue;
            const data = await resp.json();
            if (!data.audioContent) continue;
            const blobResp = await fetch(`data:audio/mp3;base64,${data.audioContent}`);
            const blob = await blobResp.blob();
            const blobUrl = URL.createObjectURL(blob);
            blobUrls.push(blobUrl);
            audioChunks.push({ text: chunk.text, el: chunk.el, url: blobUrl });
            if (!firstPlay) { firstPlay = true; playAudioChunk(); }
        } catch {}
    }
    isFetchingChunks = false;
    if (audioChunks.length === 0) startWebSpeech(chunkNodes);
}

function resolveEngine() {
    if (ttsEngine === 'auto') {
        return (currentVoiceIndex >= 0 || hasVietnameseVoice()) ? 'web' : 'google';
    }
    return ttsEngine;
}

function startReading() {
    if (!isContentReady()) { isPlaying = false; return; }
    const chunkNodes = prepareStoryContent();
    if (!chunkNodes.length) { isPlaying = false; return; }

    switch (resolveEngine()) {
        case 'web':    startWebSpeech(chunkNodes); break;
        case 'google': startGoogleTTS(chunkNodes); break;
        case 'fpt':    startFptTTS(chunkNodes);    break;
        case 'azure':  startAzureTTS(chunkNodes);  break;
        case 'gcp':    startGcpTTS(chunkNodes);    break;
        default:       startWebSpeech(chunkNodes);
    }
}

function togglePlay(opts = {}) {
    if (opts.speed !== undefined) currentSpeed = opts.speed;
    if (opts.volume !== undefined) currentVolume = opts.volume;
    if (opts.voiceIndex !== undefined) currentVoiceIndex = opts.voiceIndex;
    const engine = resolveEngine();
    if (isPlaying && !isPaused) {
        if (engine === 'web') {
            synth.pause();
        } else if (currentAudio) {
            currentAudio.pause();
        }
        isPlaying = false;
        isPaused = true;
    } else if (isPaused) {
        if (engine === 'web') {
            if (synth.paused) {
                synth.resume();
            } else {
                playWsChunk();
            }
            isPlaying = true;
            isPaused = false;
        } else if (currentAudio) {
            currentAudio.play().then(() => {
                isPlaying = true;
                isPaused = false;
            }).catch(err => {
                if (err.name === 'NotAllowedError') {
                    isPlaying = false;
                    isPaused = true;
                    chrome.runtime.sendMessage({ action: 'autoplayBlocked' });
                    return;
                }
                isPlaying = true;
                isPaused = false;
                playAudioChunk();
            });
        } else if (audioChunks.length > 0) {
            isPlaying = true;
            isPaused = false;
            playAudioChunk();
        } else {
            stopAll();
            startReading();
            return;
        }
    } else {
        stopAll();
        startReading();
    }
    return true;
}

function stopAll() {
    stopWebSpeech();
    stopAudio();
    isPlaying = false;
    isPaused = false;
    elapsedSeconds = 0;
}

function replayChap(opts = {}) {
    if (opts.speed !== undefined) currentSpeed = opts.speed;
    if (opts.volume !== undefined) currentVolume = opts.volume;
    if (opts.voiceIndex !== undefined) currentVoiceIndex = opts.voiceIndex;
    stopAll();
    setTimeout(startReading, 150);
}

function getCurrentChapterNumber() {
    const chapTitle = document.getElementById('bookchapnameholder')?.innerText.trim() || '';
    const titleMatch = chapTitle.match(/chương\s*(\d+)/i);
    if (titleMatch) return parseInt(titleMatch[1]);
    const p = window.location.pathname.split('/').filter(Boolean);
    if (p.length >= 5) { 
        const n = parseInt(p[p.length - 1]); 
        if (!isNaN(n) && n < 100000) return n; 
    }
    return NaN;
}

function clickNextChapter() {
    stopAll();
    chrome.storage.local.set({
        autoStartOnLoad: true,
        savedSpeed: currentSpeed,
        savedVolume: currentVolume,
        savedVoiceIndex: currentVoiceIndex,
        savedEngine: ttsEngine
    });
    for (const sel of ['#navnext', '#nav_next', '#btnnext', '#btn_next', '.btn-next-chapter', 'a.next', '.chapter-next a', '[data-nav="next"]']) {
        const el = document.querySelector(sel);
        if (el) { el.click(); return; }
    }
    for (const link of document.querySelectorAll('a')) {
        if (/chương\s*sau|tiếp\s*theo|next\s*chapter/i.test(link.innerText)) {
            link.click(); return;
        }
    }
}

function clickPrevChapter() {
    const chapNum = getCurrentChapterNumber();
    if (!isNaN(chapNum) && chapNum <= 1) {
        showContentToast('Đây là chương đầu tiên rồi!');
        return;
    }
    stopAll();
    for (const sel of ['#navprev', '#nav_prev', '#btnprev', '#btn_prev', '.btn-prev-chapter', 'a.prev', '.chapter-prev a', '[data-nav="prev"]']) {
        const el = document.querySelector(sel);
        if (el) { el.click(); return; }
    }
    for (const link of document.querySelectorAll('a')) {
        if (/chương\s*trước|quay\s*lại|prev\s*chapter/i.test(link.innerText)) {
            link.click(); return;
        }
    }
}

function showContentToast(msg) {
    let toast = document.getElementById('stv-tts-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'stv-tts-toast';
        toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:var(--accent, #e8a045);color:#fff;padding:8px 16px;border-radius:20px;z-index:999999;font-size:14px;font-family:sans-serif;pointer-events:none;transition:opacity 0.3s;box-shadow:0 4px 10px rgba(0,0,0,0.3);';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast.timeout);
    toast.timeout = setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

let _autoStartGen = 0;
function autoStartWhenReady(retries = 30) {
    const gen = ++_autoStartGen;
    _doAutoStart(gen, retries);
}
function _doAutoStart(gen, retries) {
    if (gen !== _autoStartGen) return;
    const chunkNodes = prepareStoryContent();
    if (chunkNodes.length >= 5) {
        const toast = document.getElementById('stv-tts-toast');
        if (toast) toast.style.opacity = '0';
        startReading();
    } else if (retries > 0) {
        if (retries <= 28) showContentToast('Hình như chương chưa tải xong! Đang chờ...');
        setTimeout(() => _doAutoStart(gen, retries - 1), 1000);
    } else {
        startReading();
    }
}

chrome.storage.local.get(
    ['autoStartOnLoad', 'savedSpeed', 'savedVolume', 'savedVoiceIndex', 'savedEngine',
     'ttsEngine', 'fpt_key', 'azure_key', 'azure_region', 'gcp_key'],
    data => {
        apiKeys.fpt_key = data.fpt_key || '';
        apiKeys.azure_key = data.azure_key || '';
        apiKeys.azure_region = data.azure_region || 'southeastasia';
        apiKeys.gcp_key = data.gcp_key || '';
        if (data.savedEngine) ttsEngine = data.savedEngine;
        else if (data.ttsEngine) ttsEngine = data.ttsEngine;
        if (!data.autoStartOnLoad) return;
        chrome.storage.local.remove('autoStartOnLoad');
        if (data.savedSpeed !== undefined) currentSpeed = data.savedSpeed;
        if (data.savedVolume !== undefined) currentVolume = data.savedVolume;
        if (data.savedVoiceIndex !== undefined) currentVoiceIndex = data.savedVoiceIndex;
        autoNext = true;
        autoStartWhenReady();
    }
);

window.addEventListener('beforeunload', () => { stopAll(); });

document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    if (!isPlaying || isPaused) return;
    const engine = resolveEngine();
    if (engine === 'web') {
        if (synth.paused) {
            synth.resume();
        } else if (!synth.speaking && !synth.pending) {
            playWsChunk();
        }
    } else if (currentAudio) {
        if (currentAudio.paused) {
            currentAudio.play().catch(() => playAudioChunk());
        }
    } else {
        playAudioChunk();
    }
});

document.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if (e.isComposing || e.keyCode === 229) return;
    switch (e.key.toLowerCase()) {
        case 'k':          e.preventDefault(); togglePlay(); break;
        case 'arrowleft':  e.preventDefault(); clickPrevChapter(); break;
        case 'arrowright': e.preventDefault(); clickNextChapter(); break;
        case 'r':          e.preventDefault(); replayChap(); break;
        case 'escape':     e.preventDefault(); stopAll(); break;
    }
});

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
    const reply = (extra = {}) => sendResponse({ isPlaying, isPaused, ttsEngine: resolveEngine(), ...extra });
    switch (req.action) {
        case 'togglePlay':
            togglePlay(req);
            reply();
            break;
        case 'stopPlay':
            stopAll();
            reply();
            break;
        case 'replayChap':
            replayChap(req);
            reply({ isPlaying: true, isPaused: false });
            break;
        case 'nextChap':
            clickNextChapter();
            reply();
            break;
        case 'prevChap':
            clickPrevChapter();
            reply();
            break;
        case 'nextChunk':
            if (resolveEngine() === 'web') {
                if (wsIndex < wsChunks.length - 1) {
                    wsIndex++;
                    if (isPlaying && !isPaused) playWsChunk();
                    else { synth.cancel(); updateHighlight(wsIndex, wsChunks); }
                }
            } else {
                if (audioIndex < audioChunks.length - 1) {
                    audioIndex++;
                    if (isPlaying && !isPaused) playAudioChunk();
                    else {
                        if (currentAudio) { currentAudio.pause(); currentAudio.src = ''; currentAudio = null; }
                        updateHighlight(audioIndex, audioChunks);
                    }
                }
            }
            reply();
            break;
        case 'prevChunk':
            if (resolveEngine() === 'web') {
                if (wsIndex > 0) {
                    wsIndex--;
                    if (isPlaying && !isPaused) playWsChunk();
                    else { synth.cancel(); updateHighlight(wsIndex, wsChunks); }
                }
            } else {
                if (audioIndex > 0) {
                    audioIndex--;
                    if (isPlaying && !isPaused) playAudioChunk();
                    else {
                        if (currentAudio) { currentAudio.pause(); currentAudio.src = ''; currentAudio = null; }
                        updateHighlight(audioIndex, audioChunks);
                    }
                }
            }
            reply();
            break;
        case 'setAuto':
            autoNext = req.value;
            reply();
            break;
        case 'setSpeed':
            currentSpeed = req.value;
            if (currentAudio) currentAudio.playbackRate = Math.min(Math.max(currentSpeed, 0.5), 4.0);
            else if (resolveEngine() === 'web' && isPlaying && !isPaused && currentUtt) {
                currentUtt = null;
                synth.cancel();
                playWsChunk();
            }
            reply();
            break;
        case 'setVolume':
            currentVolume = req.value;
            if (currentAudio) currentAudio.volume = currentVolume;
            reply();
            break;
        case 'setVoice':
            currentVoiceIndex = req.value;
            if (isPlaying || isPaused) replayChap({ voiceIndex: currentVoiceIndex });
            reply();
            break;
        case 'setEngine':
            ttsEngine = req.value || 'auto';
            chrome.storage.local.set({ ttsEngine });
            reply();
            break;
        case 'setApiKeys': {
            const d = { ...req };
            delete d.action;
            Object.assign(apiKeys, d);
            chrome.storage.local.set(d);
            reply();
            break;
        }
        case 'getInfo':
            getBookInfo().then(info => sendResponse({ ...info, elapsed: elapsedSeconds }));
            return true;
        case 'getVoices':
            loadVoices();
            let viVoices = [];
            availableVoices.forEach((v, i) => {
                if (v.lang && v.lang.startsWith('vi')) viVoices.push({ name: v.name, lang: v.lang, index: i });
            });
            sendResponse({ voices: viVoices, hasVi: viVoices.length > 0 });
            break;
        case 'getStatus':
            sendResponse({
                isPlaying, isPaused,
                ttsEngine: resolveEngine(),
                progress: {
                    current: resolveEngine() === 'web' ? wsIndex + 1 : audioIndex + 1,
                    total:   resolveEngine() === 'web' ? wsChunks.length : audioChunks.length
                },
                elapsed: elapsedSeconds
            });
            break;
    }
    return false;
});