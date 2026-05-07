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
let apiKeys = { fpt_key: '', azure_key: '', azure_region: 'southeastasia' };

let wsChunks = [];
let wsIndex = 0;
let currentUtt = null;

let currentAudio = null;
let audioChunks = [];
let audioIndex = 0;
let elapsedSeconds = 0;
let sleepTimerId = null;



let exactElapsed = 0;
let lastTick = Date.now();

function cleanText(text) {
    if (!text) return '';
    return text
        .replace(/Đang tải nội dung chương\.\.\./gi, '')
        .replace(/@Bạn đang đọc bản lưu.*/gi, '')
        .replace(/@Thực hiện bởi Sáng Tác Việt.*/gi, '')
        .trim();
}

setInterval(() => {
    const now = Date.now();
    if (isPlaying && !isPaused) {
        exactElapsed += (now - lastTick) / 1000;
        elapsedSeconds = Math.floor(exactElapsed);
    }
    lastTick = now;
}, 1000);



function loadVoices() {
    return new Promise(resolve => {
        availableVoices = synth.getVoices();
        if (availableVoices.length) {
            resolve(availableVoices);
            return;
        }
        synth.addEventListener('voiceschanged', () => {
            availableVoices = synth.getVoices();
            resolve(availableVoices);
        }, { once: true });

        setTimeout(() => resolve(synth.getVoices()), 1000);
    });
}
loadVoices();



async function fetchAndCacheCover() {
    const p = window.location.pathname.split('/').filter(Boolean);
    if (p.length < 4 || p[0] !== 'truyen') return null;
    const key = `cover_${p[3]}`;

    return new Promise(resolve => {
        chrome.storage.local.get(key, async data => {
            if (data[key] && data[key].startsWith('http')) { resolve(data[key]); return; }
            try {
                const resp = await fetch(`/${p[0]}/${p[1]}/${p[2]}/${p[3]}/`);
                const html = await resp.text();
                const doc = new DOMParser().parseFromString(html, 'text/html');
                let src = '';
                for (const sel of ['#thumb-prop', '#book_img', '.book-thumb img', '.book-cover img', '.itembox img', 'meta[property="og:image"]']) {
                    const img = doc.querySelector(sel);
                    const rawSrc = img?.getAttribute('src') || img?.getAttribute('content');
                    if (rawSrc && rawSrc.trim()) { src = rawSrc.trim(); break; }
                }
                if (src) {
                    if (src.startsWith('/')) src = window.location.origin + src;
                    else if (!src.startsWith('http')) src = window.location.origin + '/' + src;
                    chrome.storage.local.set({ [key]: src });
                    resolve(src);
                } else resolve(null);
            } catch { resolve(null); }
        });
    });
}

function injectStyles() {
    if (!document.getElementById('tts-styles')) {
        const style = document.createElement('style');
        style.id = 'tts-styles';
        style.textContent = `.tts-reading { background-color: rgba(232, 160, 69, 0.35) !important; border-radius: 4px; box-shadow: 0 0 0 2px rgba(232, 160, 69, 0.35) !important; transition: background-color 0.2s, box-shadow 0.2s; color: inherit !important; }`;
        document.head.appendChild(style);
    }
}

function prepareStoryContent() {
    injectStyles();
    let chunkNodes = [];
    let chunkIdCounter = 0;

    const addNode = (node, text) => {
        text = cleanText(text);
        if (text.length > 0) {
            if (!node.id) node.id = `tts-chunk-t-${chunkIdCounter++}`;
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
        const rawText = cleanText(box.innerText);
        if (rawText.length < 50) return;

        if (!box.dataset.ttsPrepared) {
            box.dataset.ttsPrepared = 'true';



            function wrapLineNodes(container) {
                let currentSpan = null;
                const nodes = Array.from(container.childNodes);

                nodes.forEach(node => {
                    if (['BR', 'DIV', 'P', 'H1', 'H2', 'H3', 'HR', 'TABLE', 'UL', 'LI'].includes(node.nodeName)) {
                        currentSpan = null;
                        if (node.nodeType === 1 && !['BR', 'HR'].includes(node.nodeName)) {
                            wrapLineNodes(node);
                        }
                    } else {
                        if (['SCRIPT', 'STYLE'].includes(node.nodeName)) return;
                        if (node.nodeType === 3 && !node.textContent.replace(/\u200B/g, '').trim()) return;

                        if (!currentSpan) {
                            currentSpan = document.createElement('span');
                            currentSpan.className = 'tts-chunk';
                            currentSpan.id = `tts-c-${chunkIdCounter++}`;
                            container.insertBefore(currentSpan, node);
                        }


                        currentSpan.appendChild(node);
                    }
                });
            }

            wrapLineNodes(box);
        }



        box.querySelectorAll('.tts-chunk').forEach(span => {
            let txt = cleanText(span.innerText || span.textContent || '');
            if (txt.length > 2) chunkNodes.push({ id: span.id, text: txt, el: span });
        });
    });
    return chunkNodes;
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
                    if ((sub + ' ' + p).trim().length <= maxLen) sub = (sub + ' ' + p).trim();
                    else {
                        if (sub) chunks.push(sub);
                        sub = '';
                        let remaining = p;
                        while (remaining.length > maxLen) {
                            let cutIndex = remaining.lastIndexOf(' ', maxLen);
                            if (cutIndex <= 0) cutIndex = maxLen;
                            chunks.push(remaining.slice(0, cutIndex));
                            remaining = remaining.slice(cutIndex).trim();
                        }
                        if (remaining) chunks.push(remaining);
                    }
                }
                if (sub) chunks.push(sub);
            } else { current = s.trim(); }
        }
    }
    if (current) chunks.push(current);
    return chunks.filter(c => c.trim().length > 0) || [text];
}

function buildEngineChunks(chunkNodes, maxLen) {
    let engineChunks = [];
    for (const node of chunkNodes) {
        const chunks = splitTextToMaxLen(node.text, maxLen);
        for (const c of chunks) engineChunks.push({ text: c, el: node.el });
    }
    return engineChunks;
}

function updateHighlight(index, chunksArray) {
    document.querySelectorAll('.tts-reading').forEach(el => el.classList.remove('tts-reading'));
    if (index >= 0 && index < chunksArray.length && chunksArray[index].el) {
        const el = chunksArray[index].el;
        el.classList.add('tts-reading');
        if (isPlaying && !isPaused) {
            const rect = el.getBoundingClientRect();
            if (rect.top < 80 || rect.bottom > window.innerHeight - 80) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
}




async function fetchAudioFromAPI(text, engine) {
    if (engine === 'fpt') {
        const fptVoices = ['banmai', 'leminh', 'thuminh', 'myan', 'giahuy', 'lannhi', 'linhsan'];
        const selectedVoice = fptVoices[currentVoiceIndex] || 'banmai';
        let fptSpeed = '0';
        if (currentSpeed > 1) fptSpeed = String(Math.min(3, Math.round((currentSpeed - 1) * 2)));
        else if (currentSpeed < 1) fptSpeed = String(Math.max(-3, Math.round((currentSpeed - 1) * 2)));

        const resp = await fetch('https://api.fpt.ai/hmi/tts/v5', {
            method: 'POST',
            headers: { 'api-key': apiKeys.fpt_key, 'speed': fptSpeed, 'voice': selectedVoice },
            body: text
        });
        if (!resp.ok) throw new Error('FPT API Error');
        const data = await resp.json();
        return data.audiourl;
    }
    else if (engine === 'azure') {
        const azureVoices = ['vi-VN-HoaiMyNeural', 'vi-VN-NamMinhNeural'];
        const selectedVoice = azureVoices[currentVoiceIndex] || 'vi-VN-HoaiMyNeural';
        const region = apiKeys.azure_region || 'southeastasia';

        const escXml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        const ssml = `<speak version='1.0' xml:lang='vi-VN'><voice xml:lang='vi-VN' name='${selectedVoice}'><prosody rate="${currentSpeed >= 1 ? '+' + Math.round((currentSpeed - 1) * 100) + '%' : '-' + Math.round((1 - currentSpeed) * 100) + '%'}">${escXml(text)}</prosody></voice></speak>`;

        const resp = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': apiKeys.azure_key,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
            },
            body: ssml
        });
        if (!resp.ok) throw new Error('Azure API Error');
        const blob = await resp.blob();
        return URL.createObjectURL(blob);
    }
    return null;
}

async function playAudioChunk() {
    if (!isPlaying || isPaused) return;

    if (audioIndex >= audioChunks.length) {
        isPlaying = false;
        handleChapterFinished();
        return;
    }

    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    const chunk = audioChunks[audioIndex];
    updateHighlight(audioIndex, audioChunks);



    if (!chunk.url) {
        try {
            document.body.style.cursor = 'wait';
            chunk.url = await fetchAudioFromAPI(chunk.text, ttsEngine);
            document.body.style.cursor = 'default';
        } catch (err) {
            console.error("API Lỗi, bỏ qua đoạn này:", err);
            document.body.style.cursor = 'default';
            audioIndex++;
            setTimeout(playAudioChunk, 100);
            return;
        }
    }



    if (audioIndex + 1 < audioChunks.length && !audioChunks[audioIndex + 1].url) {
        fetchAudioFromAPI(audioChunks[audioIndex + 1].text, ttsEngine)
            .then(url => { audioChunks[audioIndex + 1].url = url; })
            .catch(() => { });
    }

    const audio = new Audio(chunk.url);
    currentAudio = audio;



    audio.volume = currentVolume;

    audio.onended = () => {


        if (chunk.url && chunk.url.startsWith('blob:')) {
            URL.revokeObjectURL(chunk.url);
            chunk.url = null;
        }
        if (currentAudio !== audio) return;
        audioIndex++;
        if (isPlaying && !isPaused) setTimeout(playAudioChunk, 50);
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
        setTimeout(playAudioChunk, 300);
    });
}

function stopAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
        currentAudio = null;
    }


    audioChunks.forEach(c => {
        if (c.url && c.url.startsWith('blob:')) URL.revokeObjectURL(c.url);
    });
    audioChunks = [];
    audioIndex = 0;
    document.querySelectorAll('.tts-reading').forEach(el => el.classList.remove('tts-reading'));
}



function safeCancelWebSpeech() { if (synth.paused) synth.resume(); synth.cancel(); }

function stopWebSpeech() {
    safeCancelWebSpeech();
    currentUtt = null;
    wsChunks = [];
    wsIndex = 0;
    document.querySelectorAll('.tts-reading').forEach(el => el.classList.remove('tts-reading'));
}

function playWsChunk() {
    if (!isPlaying || isPaused) return;
    if (wsIndex >= wsChunks.length) { isPlaying = false; handleChapterFinished(); return; }
    safeCancelWebSpeech();
    updateHighlight(wsIndex, wsChunks);

    const chunkObj = wsChunks[wsIndex];
    const utt = new SpeechSynthesisUtterance(chunkObj.text);
    utt.lang = 'vi-VN';
    utt.rate = Math.min(Math.max(currentSpeed, 0.1), 10);
    utt.volume = currentVolume;

    if (currentVoiceIndex >= 0 && availableVoices[currentVoiceIndex]) utt.voice = availableVoices[currentVoiceIndex];
    else {
        const vi = availableVoices.find(v => v.lang && v.lang.startsWith('vi'));
        if (vi) utt.voice = vi;
    }
    currentUtt = utt;
    utt.onend = () => { if (currentUtt !== utt) return; wsIndex++; if (isPlaying && !isPaused) playWsChunk(); };
    utt.onerror = (e) => { if (e.error === 'interrupted' || e.error === 'canceled') return; if (isPlaying && !isPaused) { wsIndex++; playWsChunk(); } };
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

function startAPI_TTS(chunkNodes, engine) {
    const key = engine === 'fpt' ? apiKeys.fpt_key : apiKeys.azure_key;
    if (!key) { startWebSpeech(chunkNodes); return; }

    stopAudio(); stopWebSpeech();
    ttsEngine = engine;
    isPlaying = true;
    isPaused = false;
    audioIndex = 0;



    audioChunks = buildEngineChunks(chunkNodes, engine === 'fpt' ? 500 : 1000).map(c => ({ ...c, url: null }));

    if (audioChunks.length === 0) {
        startWebSpeech(chunkNodes);
    } else {
        playAudioChunk();
    }
}


function startReading() {
    const el = document.querySelector('.contentbox');
    if (!el || el.innerText.trim().length < 50) { isPlaying = false; return; }

    const chunkNodes = prepareStoryContent();
    if (!chunkNodes.length) { isPlaying = false; return; }

    const engine = ttsEngine === 'auto' || ttsEngine === 'google' ? 'web' : ttsEngine;
    if (engine === 'web') startWebSpeech(chunkNodes);
    else startAPI_TTS(chunkNodes, engine);
}



function togglePlay(opts = {}) {
    if (opts.speed !== undefined) currentSpeed = opts.speed;
    if (opts.volume !== undefined) currentVolume = opts.volume;
    if (opts.voiceIndex !== undefined) currentVoiceIndex = opts.voiceIndex;
    const engine = ttsEngine === 'auto' ? 'web' : ttsEngine;

    if (isPlaying && !isPaused) {
        if (engine === 'web') synth.pause();
        else if (currentAudio) currentAudio.pause();
        isPlaying = false; isPaused = true;
    } else if (isPaused) {
        isPlaying = true; isPaused = false;
        if (engine === 'web') {
            if (synth.paused) synth.resume();
            else playWsChunk();
        } else if (currentAudio) {
            currentAudio.play().catch(err => {
                if (err.name === 'NotAllowedError') {
                    isPlaying = false; isPaused = true;
                    chrome.runtime.sendMessage({ action: 'autoplayBlocked' });
                } else playAudioChunk();
            });
        } else if (audioChunks.length > 0) playAudioChunk();
        else { stopAll(); startReading(); }
    } else {
        stopAll(); startReading();
    }
    return true;
}

function stopAll() {
    stopWebSpeech(); stopAudio();
    isPlaying = false; isPaused = false;
    elapsedSeconds = 0; exactElapsed = 0;
}

function replayChap(opts = {}) {
    stopAll();
    if (opts.speed !== undefined) currentSpeed = opts.speed;
    if (opts.volume !== undefined) currentVolume = opts.volume;
    if (opts.voiceIndex !== undefined) currentVoiceIndex = opts.voiceIndex;
    setTimeout(startReading, 150);
}

function handleChapterFinished() {
    if (!autoNext) { stopAll(); return; }
    chrome.storage.local.get(['stopAfterChapters'], data => {
        const remaining = data.stopAfterChapters;
        if (remaining !== undefined && remaining !== null && remaining > 0) {
            if (remaining <= 1) {
                stopAll();
                chrome.storage.local.remove('stopAfterChapters');
                showContentToast('🎯 Đã dừng sau khi hoàn thành số chương hẹn trước!');
            } else {
                chrome.storage.local.set({ stopAfterChapters: remaining - 1 }, () => setTimeout(clickNextChapter, 1200));
            }
        } else setTimeout(clickNextChapter, 1200);
    });
}

function clickNextChapter() {
    stopAll();
    chrome.storage.local.set({ autoStartOnLoad: true, savedSpeed: currentSpeed, savedVolume: currentVolume, savedVoiceIndex: currentVoiceIndex, savedEngine: ttsEngine });
    for (const sel of ['#navnext', '#nav_next', '#btnnext', '#btn_next', '.btn-next-chapter', 'a.next', '.chapter-next a', '[data-nav="next"]']) {
        const el = document.querySelector(sel);
        if (el) { el.click(); return; }
    }
    showContentToast('⚠ Không tìm thấy nút chuyển chương. Có thể đã hết truyện.');
}

function clickPrevChapter() {
    stopAll();
    for (const sel of ['#navprev', '#nav_prev', '#btnprev', '#btn_prev', '.btn-prev-chapter', 'a.prev', '.chapter-prev a', '[data-nav="prev"]']) {
        const el = document.querySelector(sel);
        if (el) { el.click(); return; }
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
    toast.textContent = msg; toast.style.opacity = '1';
    clearTimeout(toast.timeout);
    toast.timeout = setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}



chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
    const engine = ttsEngine === 'auto' ? 'web' : ttsEngine;
    const reply = (extra = {}) => sendResponse({ isPlaying, isPaused, ttsEngine: engine, ...extra });

    switch (req.action) {
        case 'togglePlay': togglePlay(req); reply(); break;
        case 'stopPlay': stopAll(); reply(); break;
        case 'replayChap': replayChap(req); reply({ isPlaying: true, isPaused: false }); break;
        case 'nextChap': clickNextChapter(); reply(); break;
        case 'prevChap': clickPrevChapter(); reply(); break;
        case 'nextChunk':
            if (engine === 'web') { if (wsIndex < wsChunks.length - 1) { wsIndex++; if (isPlaying && !isPaused) playWsChunk(); else { safeCancelWebSpeech(); updateHighlight(wsIndex, wsChunks); } } }
            else { if (audioIndex < audioChunks.length - 1) { audioIndex++; if (isPlaying && !isPaused) playAudioChunk(); else { if (currentAudio) { currentAudio.pause(); currentAudio = null; } updateHighlight(audioIndex, audioChunks); } } }
            reply(); break;
        case 'prevChunk':
            if (engine === 'web') { if (wsIndex > 0) { wsIndex--; if (isPlaying && !isPaused) playWsChunk(); else { safeCancelWebSpeech(); updateHighlight(wsIndex, wsChunks); } } }
            else { if (audioIndex > 0) { audioIndex--; if (isPlaying && !isPaused) playAudioChunk(); else { if (currentAudio) { currentAudio.pause(); currentAudio = null; } updateHighlight(audioIndex, audioChunks); } } }
            reply(); break;
        case 'jumpToChunk':
            const tIdx = Math.max(0, req.value - 1);
            if (engine === 'web') { wsIndex = Math.min(tIdx, wsChunks.length - 1); if (isPlaying && !isPaused) playWsChunk(); else { safeCancelWebSpeech(); updateHighlight(wsIndex, wsChunks); } }
            else { audioIndex = Math.min(tIdx, audioChunks.length - 1); if (isPlaying && !isPaused) playAudioChunk(); else { if (currentAudio) { currentAudio.pause(); currentAudio = null; } updateHighlight(audioIndex, audioChunks); } }
            reply(); break;
        case 'setAuto': autoNext = req.value; reply(); break;
        case 'setSpeed': currentSpeed = req.value; if (engine === 'web' && isPlaying && !isPaused) { currentUtt = null; safeCancelWebSpeech(); playWsChunk(); } reply(); break;
        case 'setVolume': currentVolume = req.value; if (currentAudio) currentAudio.volume = currentVolume; reply(); break;
        case 'setVoice': currentVoiceIndex = req.value; if (isPlaying || isPaused) replayChap({ voiceIndex: currentVoiceIndex }); reply(); break;
        case 'setEngine': ttsEngine = req.value || 'auto'; chrome.storage.local.set({ ttsEngine }); reply(); break;
        case 'setApiKeys': Object.assign(apiKeys, req); chrome.storage.local.set(req); reply(); break;
        case 'setSleepTimer':
            if (sleepTimerId) clearTimeout(sleepTimerId);
            if (req.minutes > 0) {
                chrome.storage.local.set({ sleepTargetTimestamp: Date.now() + (req.minutes * 60 * 1000) });
                sleepTimerId = setTimeout(() => { stopAll(); chrome.storage.local.remove('sleepTargetTimestamp'); }, req.minutes * 60 * 1000);
            } else chrome.storage.local.remove('sleepTargetTimestamp');
            reply(); break;
        case 'setStopChapters':
            if (req.count > 0) chrome.storage.local.set({ stopAfterChapters: req.count });
            else chrome.storage.local.remove('stopAfterChapters');
            reply(); break;
        case 'getInfo':
            (async () => {
                let bookTitle = document.getElementById('booknameholder')?.innerText.trim() || document.getElementById('book_name2')?.innerText.trim() || document.querySelector('h1')?.innerText.trim() || '';
                let chapTitle = document.getElementById('bookchapnameholder')?.innerText.trim() || '';
                let imgUrl = await fetchAndCacheCover() || '';
                const p = window.location.pathname.split('/').filter(Boolean);
                const bookUrl = p.length >= 4 ? `${window.location.origin}/${p[0]}/${p[1]}/${p[2]}/${p[3]}/` : window.location.href;
                const tot = engine === 'web' ? wsChunks.length : audioChunks.length;
                const cur = engine === 'web' ? wsIndex : audioIndex;
                sendResponse({ bookTitle, chapTitle, imgUrl, bookUrl, pageUrl: window.location.href, isPlaying, isPaused, ttsEngine: engine, progress: tot > 0 ? { current: cur + 1, total: tot } : null, elapsed: elapsedSeconds });
            })();
            return true;
        case 'getVoices':
            loadVoices().then(voices => {
                const arr = voices.map((v, i) => ({ name: v.name, lang: v.lang || 'unknown', index: i })).sort((a, b) => {
                    const aVi = a.lang.startsWith('vi'); const bVi = b.lang.startsWith('vi');
                    if (aVi && !bVi) return -1; if (!aVi && bVi) return 1; return a.lang.localeCompare(b.lang);
                });
                sendResponse({ voices: arr, hasVi: arr.some(v => v.lang.startsWith('vi')) });
            });
            return true;
        case 'getStatus':
            sendResponse({ isPlaying, isPaused, ttsEngine: engine, progress: { current: (engine === 'web' ? wsIndex : audioIndex) + 1, total: engine === 'web' ? wsChunks.length : audioChunks.length }, elapsed: elapsedSeconds });
            break;
    }
    return false;
});



chrome.storage.local.get(['autoStartOnLoad', 'savedSpeed', 'savedVolume', 'savedVoiceIndex', 'savedEngine', 'ttsEngine', 'fpt_key', 'azure_key', 'azure_region', 'autoNext', 'sleepTargetTimestamp'], data => {
    Object.assign(apiKeys, data);
    ttsEngine = data.savedEngine || data.ttsEngine || 'auto';
    if (data.savedSpeed !== undefined) currentSpeed = data.savedSpeed;
    if (data.savedVolume !== undefined) currentVolume = data.savedVolume;
    if (data.savedVoiceIndex !== undefined) currentVoiceIndex = data.savedVoiceIndex;
    autoNext = data.autoNext !== undefined ? data.autoNext : true;

    if (data.sleepTargetTimestamp) {
        const remaining = data.sleepTargetTimestamp - Date.now();
        if (remaining > 0) sleepTimerId = setTimeout(() => { stopAll(); chrome.storage.local.remove('sleepTargetTimestamp'); }, remaining);
        else chrome.storage.local.remove('sleepTargetTimestamp');
    }

    if (data.autoStartOnLoad) {
        chrome.storage.local.remove('autoStartOnLoad');
        let retries = 20;
        const checkReady = setInterval(() => {
            if (prepareStoryContent().length >= 5 || --retries <= 0) {
                clearInterval(checkReady);
                startReading();
            }
        }, 1000);
    }
});

document.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable || e.isComposing) return;
    switch (e.key.toLowerCase()) {
        case 'k': e.preventDefault(); togglePlay(); break;
        case 'arrowleft': e.preventDefault(); clickPrevChapter(); break;
        case 'arrowright': e.preventDefault(); clickNextChapter(); break;
        case 'r': e.preventDefault(); replayChap(); break;
        case 'escape': e.preventDefault(); stopAll(); break;
    }
});