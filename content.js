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
let enableShortcuts = true;
let readBookTitle = true;
let readChapTitle = true;
let savedChunkToResume = 0;
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
    if (readBookTitle && bookEl && !bookEl.classList.contains('tts-chunk')) addNode(bookEl, bookEl.innerText);
    const chapEl = document.getElementById('bookchapnameholder');
    if (readChapTitle && chapEl && !chapEl.classList.contains('tts-chunk')) addNode(chapEl, chapEl.innerText);
    const boxes = document.querySelectorAll('.contentbox');
    boxes.forEach(box => {
        const rawText = cleanText(box.innerText);
        if (rawText.length < 50) return;
        if (!box.dataset.extTtsDone) {
            box.dataset.extTtsDone = 'true';
            if (box.dataset.ttsPrepared) {
                box.querySelectorAll('.tts-chunk').forEach(span => {
                    const space = document.createTextNode(' ');
                    span.parentNode.insertBefore(space, span.nextSibling);
                    while (span.firstChild) span.parentNode.insertBefore(span.firstChild, span);
                    span.remove();
                });
            }
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
                        if (node.nodeType === 3 && !node.textContent.replace(/\u200B/g, '').trim()) {
                            if (currentSpan) currentSpan.appendChild(node);
                            return;
                        }
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
    saveProgressState();
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
        if (chunk.url && chunk.url.startsWith('blob:')) { URL.revokeObjectURL(chunk.url); chunk.url = null; }
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
            isPlaying = false; isPaused = true;
            chrome.runtime.sendMessage({ action: 'autoplayBlocked' });
            return;
        }
        audioIndex++;
        setTimeout(playAudioChunk, 300);
    });
}
function stopAudio() {
    if (currentAudio) { currentAudio.pause(); currentAudio.src = ''; currentAudio = null; }
    audioChunks.forEach(c => { if (c.url && c.url.startsWith('blob:')) URL.revokeObjectURL(c.url); });
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
async function playWsChunk() {
    if (!isPlaying || isPaused) return;
    if (wsIndex >= wsChunks.length) { isPlaying = false; handleChapterFinished(); return; }
    safeCancelWebSpeech();
    updateHighlight(wsIndex, wsChunks);
    if (availableVoices.length === 0) {
        await loadVoices();
    }
    const chunkObj = wsChunks[wsIndex];
    const utt = new SpeechSynthesisUtterance(chunkObj.text);
    utt.lang = 'vi-VN';
    utt.rate = Math.min(Math.max(currentSpeed, 0.1), 10);
    utt.volume = currentVolume;
    let selectedVoice = null;
    if (typeof currentVoiceIndex === 'string' && currentVoiceIndex.length > 5) {
        selectedVoice = availableVoices.find(v => v.name === currentVoiceIndex);
    } else if (currentVoiceIndex >= 0 && availableVoices[currentVoiceIndex]) {
        selectedVoice = availableVoices[currentVoiceIndex];
    }
    if (selectedVoice) {
        utt.voice = selectedVoice;
    } else {
        const vi = availableVoices.find(v => v.lang && v.lang.startsWith('vi'));
        if (vi) utt.voice = vi;
    }
    currentUtt = utt;
    utt.onend = () => { if (currentUtt !== utt) return; wsIndex++; if (isPlaying && !isPaused) playWsChunk(); };
    utt.onerror = (e) => { if (e.error === 'interrupted' || e.error === 'canceled') return; if (isPlaying && !isPaused) { wsIndex++; playWsChunk(); } };
    synth.speak(utt);
}
function checkObfuscation() {
    if (document.getElementById('stv-obfuscation-warning')) return true;
    const boxes = document.querySelectorAll('.contentbox');
    let hasObfuscation = false;
    for (let box of boxes) {
        if (/[\uE000-\uF8FF]/.test(box.textContent)) { hasObfuscation = true; break; }
    }
    if (hasObfuscation) {
        let warning = document.createElement('div');
        warning.id = 'stv-obfuscation-warning';
        warning.style.cssText = "background: #ff4d4f; color: white; padding: 12px; text-align: center; font-weight: bold; font-family: sans-serif; border-radius: 6px; margin: 15px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; gap: 8px;";
        warning.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-triangle-alert"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg><span>Cảnh báo: Chương truyện này đã bị mã hóa nội dung bằng custom font! Tiện ích có thể không đọc hoặc copy được chính xác văn bản gốc.</span>`;
        if (boxes.length > 0) boxes[0].parentNode.insertBefore(warning, boxes[0]);
        return true;
    }
    return false;
}
function prepareSilent() {
    const engine = ttsEngine === 'auto' || ttsEngine === 'google' ? 'web' : ttsEngine;
    if (engine === 'web' && wsChunks.length > 0) return true;
    if (engine !== 'web' && audioChunks.length > 0) return true;
    let chunkNodes = [];
    if (checkObfuscation()) {
        window.obfuscationBlocked = true;
        const warningEl = document.getElementById('stv-obfuscation-warning');
        if (warningEl && !warningEl.classList.contains('tts-chunk')) warningEl.classList.add('tts-chunk');
        chunkNodes = [{ id: 'stv-obfuscation-warning', text: "Cảnh báo: Chương truyện này đã bị mã hóa nội dung bằng custom font! Tiện ích có thể không đọc hoặc copy được chính xác văn bản gốc.", el: warningEl }];
    } else {
        window.obfuscationBlocked = false;
        const el = document.querySelector('.contentbox');
        if (!el || el.innerText.trim().length < 50) return false;
        chunkNodes = prepareStoryContent();
        if (!chunkNodes.length) return false;
    }
    if (engine === 'web') {
        wsChunks = buildEngineChunks(chunkNodes, 300);
        if (savedChunkToResume > 0) {
            wsIndex = Math.min(savedChunkToResume, Math.max(0, wsChunks.length - 1));
            savedChunkToResume = 0;
        } else if (audioChunks.length > 0 && audioIndex > 0) {
            wsIndex = Math.floor((audioIndex / audioChunks.length) * wsChunks.length) || 0;
        } else { wsIndex = 0; }
        updateHighlight(wsIndex, wsChunks);
    } else {
        audioChunks = buildEngineChunks(chunkNodes, engine === 'fpt' ? 500 : 1000).map(c => ({ ...c, url: null }));
        if (savedChunkToResume > 0) {
            audioIndex = Math.min(savedChunkToResume, Math.max(0, audioChunks.length - 1));
            savedChunkToResume = 0;
        } else if (wsChunks.length > 0 && wsIndex > 0) {
            audioIndex = Math.floor((wsIndex / wsChunks.length) * audioChunks.length) || 0;
        } else { audioIndex = 0; }
        updateHighlight(audioIndex, audioChunks);
    }
    return true;
}
function startReading() {
    if (!prepareSilent()) { isPlaying = false; return; }
    isPlaying = true; isPaused = false;
    const engine = ttsEngine === 'auto' || ttsEngine === 'google' ? 'web' : ttsEngine;
    if (engine === 'web') playWsChunk();
    else playAudioChunk();
}
function togglePlay(opts = {}) {
    if (opts.speed !== undefined) currentSpeed = opts.speed;
    if (opts.volume !== undefined) currentVolume = opts.volume;
    if (opts.voiceIndex !== undefined) currentVoiceIndex = opts.voiceIndex;
    const engine = ttsEngine === 'auto' ? 'web' : ttsEngine;
    if (isPlaying && !isPaused) {
        if (engine === 'web') synth.pause(); else if (currentAudio) currentAudio.pause();
        isPlaying = false; isPaused = true;
    } else if (isPaused) {
        isPlaying = true; isPaused = false;
        if (engine === 'web') {
            if (synth.paused) synth.resume(); else playWsChunk();
        } else if (currentAudio) {
            currentAudio.play().catch(err => {
                if (err.name === 'NotAllowedError') {
                    isPlaying = false; isPaused = true;
                    chrome.runtime.sendMessage({ action: 'autoplayBlocked' });
                } else playAudioChunk();
            });
        } else if (audioChunks.length > 0) playAudioChunk();
        else { startReading(); }
    } else {
        startReading();
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
    if (document.getElementById('stv-obfuscation-warning') || checkObfuscation()) {
        stopAll();
        return;
    }
    if (!autoNext) { stopAll(); return; }
    chrome.storage.local.get(['stopAfterChapters'], data => {
        const remaining = data.stopAfterChapters;
        if (remaining !== undefined && remaining !== null && remaining > 0) {
            if (remaining <= 1) {
                stopAll();
                chrome.storage.local.remove('stopAfterChapters');
                showContentToast('🎯 Đã dừng sau khi hoàn thành số chương hẹn trước!');
            } else {
                chrome.storage.local.set({ stopAfterChapters: remaining - 1 }, () => setTimeout(() => clickNextChapter(true), 1200));
            }
        } else setTimeout(() => clickNextChapter(true), 1200);
    });
}
function clickNextChapter(isAuto = false) {
    stopAll();
    if (isAuto) chrome.storage.local.set({ autoStartOnLoad: true, savedSpeed: currentSpeed, savedVolume: currentVolume, savedVoiceIndex: currentVoiceIndex, savedEngine: ttsEngine });
    else chrome.storage.local.remove('autoStartOnLoad');
    const selectors = ['#navnexttop', '#navnextbot', '#navnext', '#nav_next', '#btnnext', '#btn_next', '.btn-next-chapter', 'a.next', '.chapter-next a', '[data-nav="next"]'];
    for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) { el.click(); return; }
    }
    const links = document.querySelectorAll('a, button');
    const nextKeywords = ['chương sau', 'chương tiếp', 'tiếp theo', 'next'];
    for (const el of links) {
        const text = (el.innerText || '').toLowerCase().trim();
        if (nextKeywords.some(kw => text.includes(kw)) && text.length < 25) { el.click(); return; }
    }
    showContentToast('⚠ Không tìm thấy nút chuyển chương. Có thể đã hết truyện.');
}
function clickPrevChapter() {
    stopAll();
    chrome.storage.local.remove('autoStartOnLoad');
    let foundEl = null;
    const selectors = ['#navprevtop', '#navprevbot', '#navprev', '#nav_prev', '#btnprev', '#btn_prev', '.btn-prev-chapter', 'a.prev', '.chapter-prev a', '[data-nav="prev"]'];
    for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) { foundEl = el; break; }
    }
    if (!foundEl) {
        const links = document.querySelectorAll('a, button');
        const prevKeywords = ['chương trước', 'trước đó', 'prev'];
        for (const el of links) {
            const text = (el.innerText || '').toLowerCase().trim();
            if (prevKeywords.some(kw => text.includes(kw)) && text.length < 25) { foundEl = el; break; }
        }
    }
    if (foundEl) {
        const href = foundEl.getAttribute('href');
        let centerHref = null;
        const centerSelectors = ['#navcentertop', '#navcenterbot', '#navcenter', '.chapter-list'];
        for (const sel of centerSelectors) {
            const cel = document.querySelector(sel);
            if (cel && cel.getAttribute('href')) { centerHref = cel.getAttribute('href'); break; }
        }
        if (!centerHref) {
            const allLinks = document.querySelectorAll('a');
            for (const el of allLinks) {
                if ((el.innerText || '').toLowerCase().includes('mục lục') && el.getAttribute('href')) { centerHref = el.getAttribute('href'); break; }
            }
        }
        if (href && (href.endsWith('/0/') || href.endsWith('/0') || (centerHref && href === centerHref))) {
            showContentToast('⚠ Đây là chương thấp nhất rồi!'); return;
        }
        foundEl.click(); return;
    }
    showContentToast('⚠ Không tìm thấy nút chuyển chương trước.');
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
function ensureChunks() {
    const engine = ttsEngine === 'auto' || ttsEngine === 'google' ? 'web' : ttsEngine;
    if (engine === 'web' && wsChunks.length > 0) return;
    if (engine !== 'web' && audioChunks.length > 0) return;
    let chunkNodes = [];
    if (checkObfuscation()) {
        const warningEl = document.getElementById('stv-obfuscation-warning');
        chunkNodes = [{ id: 'stv-obfuscation-warning', text: "Cảnh báo: Chương truyện này đã bị mã hóa nội dung bằng custom font! Tiện ích có thể không đọc hoặc copy được chính xác văn bản gốc.", el: warningEl }];
    } else {
        const el = document.querySelector('.contentbox');
        if (!el || el.innerText.trim().length < 50) return;
        chunkNodes = prepareStoryContent();
    }
    if (engine === 'web') {
        wsChunks = buildEngineChunks(chunkNodes, 300);
        if (savedChunkToResume > 0) { wsIndex = Math.min(savedChunkToResume, Math.max(0, wsChunks.length - 1)); savedChunkToResume = 0; }
    } else {
        audioChunks = buildEngineChunks(chunkNodes, engine === 'fpt' ? 500 : 1000).map(c => ({ ...c, url: null }));
        if (savedChunkToResume > 0) { audioIndex = Math.min(savedChunkToResume, Math.max(0, audioChunks.length - 1)); savedChunkToResume = 0; }
    }
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
            ensureChunks();
            if (engine === 'web') { if (wsIndex < wsChunks.length - 1) { wsIndex++; if (isPlaying && !isPaused) playWsChunk(); else { safeCancelWebSpeech(); updateHighlight(wsIndex, wsChunks); } } }
            else { if (audioIndex < audioChunks.length - 1) { audioIndex++; if (isPlaying && !isPaused) playAudioChunk(); else { if (currentAudio) { currentAudio.pause(); currentAudio = null; } updateHighlight(audioIndex, audioChunks); } } }
            reply(); break;
        case 'prevChunk':
            ensureChunks();
            if (engine === 'web') { if (wsIndex > 0) { wsIndex--; if (isPlaying && !isPaused) playWsChunk(); else { safeCancelWebSpeech(); updateHighlight(wsIndex, wsChunks); } } }
            else { if (audioIndex > 0) { audioIndex--; if (isPlaying && !isPaused) playAudioChunk(); else { if (currentAudio) { currentAudio.pause(); currentAudio = null; } updateHighlight(audioIndex, audioChunks); } } }
            reply(); break;
        case 'jumpToChunk':
            ensureChunks();
            const tIdx = Math.max(0, req.value - 1);
            if (engine === 'web') { wsIndex = Math.min(tIdx, Math.max(0, wsChunks.length - 1)); if (isPlaying && !isPaused) playWsChunk(); else { safeCancelWebSpeech(); updateHighlight(wsIndex, wsChunks); } }
            else { audioIndex = Math.min(tIdx, Math.max(0, audioChunks.length - 1)); if (isPlaying && !isPaused) playAudioChunk(); else { if (currentAudio) { currentAudio.pause(); currentAudio = null; } updateHighlight(audioIndex, audioChunks); } }
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
                ensureChunks();
                let bookTitle = document.getElementById('booknameholder')?.innerText.trim() || document.getElementById('book_name2')?.innerText.trim() || document.querySelector('h1')?.innerText.trim() || '';
                let chapTitle = document.getElementById('bookchapnameholder')?.innerText.trim() || '';
                let imgUrl = await fetchAndCacheCover() || '';
                const p = window.location.pathname.split('/').filter(Boolean);
                const bookUrl = p.length >= 4 ? `${window.location.origin}/${p[0]}/${p[1]}/${p[2]}/${p[3]}/` : window.location.href;
                const tot = engine === 'web' ? wsChunks.length : audioChunks.length;
                const cur = engine === 'web' ? wsIndex : audioIndex;
                if (!isPlaying && !isPaused && tot > 0) updateHighlight(cur, engine === 'web' ? wsChunks : audioChunks);
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
            ensureChunks();
            const tot = engine === 'web' ? wsChunks.length : audioChunks.length;
            const cur = engine === 'web' ? wsIndex : audioIndex;
            sendResponse({ isPlaying, isPaused, ttsEngine: engine, progress: tot > 0 ? { current: cur + 1, total: tot } : null, elapsed: elapsedSeconds });
            break;
    }
    return false;
});
chrome.storage.local.get([
    'autoStartOnLoad', 'savedSpeed', 'savedVolume', 'savedVoiceIndex',
    'savedEngine', 'ttsEngine', 'fpt_key', 'azure_key', 'azure_region',
    'autoNext', 'sleepTargetTimestamp',
    'enableShortcuts', 'readBookTitle', 'readChapTitle', 'readingList'
], data => {
    let bookTitle = document.getElementById('booknameholder')?.innerText.trim() || document.getElementById('book_name2')?.innerText.trim() || document.querySelector('h1')?.innerText.trim() || '';
    let list = data.readingList || [];
    let item = list.find(i => i.title === bookTitle);
    if (item && item.url === window.location.href && item.chunkIndex > 1) {
        savedChunkToResume = item.chunkIndex - 1;
    }
    Object.assign(apiKeys, data);
    ttsEngine = data.savedEngine || data.ttsEngine || 'auto';
    if (data.savedSpeed !== undefined) currentSpeed = data.savedSpeed;
    if (data.savedVolume !== undefined) currentVolume = data.savedVolume;
    if (data.savedVoiceIndex !== undefined) currentVoiceIndex = data.savedVoiceIndex;
    autoNext = data.autoNext !== undefined ? data.autoNext : true;
    enableShortcuts = data.enableShortcuts !== undefined ? data.enableShortcuts : true;
    readBookTitle = data.readBookTitle !== undefined ? data.readBookTitle : true;
    readChapTitle = data.readChapTitle !== undefined ? data.readChapTitle : true;
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
    setTimeout(checkObfuscation, 1500);
});
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.enableShortcuts) enableShortcuts = changes.enableShortcuts.newValue;
        if (changes.readBookTitle !== undefined || changes.readChapTitle !== undefined) {
            if (changes.readBookTitle !== undefined) readBookTitle = changes.readBookTitle.newValue;
            if (changes.readChapTitle !== undefined) readChapTitle = changes.readChapTitle.newValue;
            const bookEl = document.getElementById('booknameholder') || document.getElementById('book_name2');
            if (bookEl) bookEl.classList.remove('tts-chunk');
            const chapEl = document.getElementById('bookchapnameholder');
            if (chapEl) chapEl.classList.remove('tts-chunk');
            wsChunks = [];
            audioChunks = [];
            ensureChunks();
            const engine = ttsEngine === 'auto' || ttsEngine === 'google' ? 'web' : ttsEngine;
            updateHighlight(engine === 'web' ? wsIndex : audioIndex, engine === 'web' ? wsChunks : audioChunks);
        }
    }
});
document.addEventListener('keydown', e => {
    if (!enableShortcuts) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable || e.isComposing) return;
    switch (e.key.toLowerCase()) {
        case 'k': e.preventDefault(); togglePlay(); break;
        case 'arrowleft': e.preventDefault(); clickPrevChapter(); break;
        case 'arrowright': e.preventDefault(); clickNextChapter(); break;
        case 'r': e.preventDefault(); replayChap(); break;
        case 'escape': e.preventDefault(); stopAll(); break;
    }
});
function saveProgressState() {
    const engine = ttsEngine === 'auto' || ttsEngine === 'google' ? 'web' : ttsEngine;
    const cur = (engine === 'web' ? wsIndex : audioIndex) + 1;
    const tot = engine === 'web' ? wsChunks.length : audioChunks.length;
    let bookTitle = document.getElementById('booknameholder')?.innerText.trim() || document.getElementById('book_name2')?.innerText.trim() || document.querySelector('h1')?.innerText.trim() || '';
    let chapTitle = document.getElementById('bookchapnameholder')?.innerText.trim() || '';
    if (!bookTitle || tot === 0) return;
    chrome.storage.local.set({
        last_active_state: {
            bookTitle, chapTitle, pageUrl: window.location.href,
            progress: { current: cur, total: tot },
            isPlaying, isPaused, ttsEngine: engine
        }
    });
    chrome.storage.local.get('readingList', data => {
        let list = data.readingList || [];
        let idx = list.findIndex(i => i.title === bookTitle);
        if (idx !== -1) {
            let updated = false;
            if (list[idx].url !== window.location.href) { list[idx].url = window.location.href; updated = true; }
            if (list[idx].chap !== chapTitle) { list[idx].chap = chapTitle; updated = true; }
            if (list[idx].chunkIndex !== cur || list[idx].chunkTotal !== tot) {
                list[idx].chunkIndex = cur;
                list[idx].chunkTotal = tot;
                updated = true;
            }
            if (updated) chrome.storage.local.set({ readingList: list });
        }
    });
}