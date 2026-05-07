'use strict';
const FALLBACK_COVER = 'icons/fallback-cover.svg';
const SVG_PLAY = `<polygon points="5 3 19 12 5 21 5 3"/>`;
const SVG_PAUSE = `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`;
const SVG_BOOKMARK = `<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>`;
const SVG_BOOKMARK_CHK = `<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/><polyline points="9 10 12 13 15 7"/>`;
const SVG_SAVE = `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>`;
const SVG_CHECK = `<polyline points="20 6 9 17 4 12"/>`;

let timerInterval = null;
let timerSeconds = 0;
let lastKnownState = { isPlaying: false, isPaused: false };
let pollInterval = null;
let currentBookData = null;
let readingTabId = null;

async function sendToTab(tabId, cmd, extra = {}) {
    return new Promise(resolve => {
        chrome.tabs.sendMessage(tabId, { action: cmd, ...extra }, resp => {
            void chrome.runtime.lastError;
            resolve(resp);
        });
    });
}

async function sendCommand(cmd, extra = {}) {
    if (readingTabId) {
        const resp = await sendToTab(readingTabId, cmd, extra);
        if (resp !== undefined) return resp;
        readingTabId = null;
    }

    const stvTabs = await chrome.tabs.query({ url: ['*://sangtacviet.com/*', '*://www.sangtacviet.com/*'] });

    if (stvTabs.length > 0) {
        let activeTab = null;
        let fallbackTab = null;
        for (const tab of stvTabs) {
            const status = await sendToTab(tab.id, 'getStatus');
            if (status) {
                if (!fallbackTab) fallbackTab = tab;
                if (status.isPlaying || status.isPaused) { activeTab = tab; break; }
            }
        }
        const targetTab = activeTab || fallbackTab;
        if (targetTab) {
            readingTabId = targetTab.id;
            return await sendToTab(targetTab.id, cmd, extra);
        }
    }

    const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTabs.length > 0) return await sendToTab(activeTabs[0].id, cmd, extra);

    return null;
}

let toastTimeout = null;
function showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    let iconSvg = '';
    if (type === 'success') iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    if (type === 'info')    iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    if (type === 'warning') iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    toast.innerHTML = `${iconSvg} <span>${msg}</span>`;
    toast.className = `toast toast-${type} show`;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
}

function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => { timerSeconds++; updateTimerDisplay(); }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function resetTimer() {
    pauseTimer();
    timerSeconds = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
    const s = String(timerSeconds % 60).padStart(2, '0');
    document.getElementById('timer-text').textContent = `${m}:${s}`;
}

function setPlayingState(playing, paused = false) {
    lastKnownState = { isPlaying: playing, isPaused: paused };
    const dot  = document.getElementById('status-dot');
    const stxt = document.getElementById('status-text');
    const icon = document.getElementById('btn-play-icon');
    const text = document.getElementById('btn-play-text');
    dot.className = 'status-dot';
    if (playing) {
        document.getElementById('interaction-warning').style.display = 'none';
        dot.classList.add('playing');
        stxt.textContent = 'Đang đọc...';
        icon.innerHTML = SVG_PAUSE;
        text.textContent = 'Dừng';
        startTimer();
    } else if (paused) {
        dot.classList.add('paused');
        stxt.textContent = 'Đang tạm dừng';
        icon.innerHTML = SVG_PLAY;
        text.textContent = 'Tiếp tục';
        pauseTimer();
    } else {
        stxt.textContent = 'Sẵn sàng';
        icon.innerHTML = SVG_PLAY;
        text.textContent = 'Nghe';
        pauseTimer();
    }
}

function updateProgress(progress) {
    const el = document.getElementById('progress-text');
    if (!el) return;
    el.textContent = (progress && progress.total > 0) ? `${progress.current}/${progress.total}` : '0/0';
}

function updateTtsBadge(engine) {
    const badge = document.getElementById('tts-badge');
    if (!badge) return;
    const map = {
        web:    ['Web TTS',  'var(--success)', 'var(--success)'],
        fpt:    ['FPT.AI',   'var(--accent2)', 'var(--accent2)'],
        azure:  ['Azure TTS','var(--accent)',  'var(--accent)'],
        google: ['Google',   'var(--success)', 'var(--success)'],
        gcp:    ['GCP TTS',  'var(--success)', 'var(--success)'],
    };
    const [label, border, color] = map[engine] || map.web;
    badge.textContent = label;
    badge.style.borderColor = border;
    badge.style.color = color;
}

async function pollStatus() {
    const resp = await sendCommand('getStatus');
    if (!resp) return;
    const { isPlaying, isPaused, progress, ttsEngine, elapsed } = resp;
    if (elapsed !== undefined && Math.abs(timerSeconds - elapsed) > 2) {
        timerSeconds = elapsed;
        updateTimerDisplay();
    }
    if (isPlaying !== lastKnownState.isPlaying || isPaused !== lastKnownState.isPaused) {
        setPlayingState(isPlaying, isPaused);
        if (!isPlaying && !isPaused) resetTimer();
    }
    if (ttsEngine) updateTtsBadge(ttsEngine);
    updateProgress(progress);
}

function startPolling() {
    if (pollInterval) return;
    pollInterval = setInterval(pollStatus, 1500);
}

function stopPolling() {
    clearInterval(pollInterval);
    pollInterval = null;
}

chrome.runtime.onMessage.addListener((req) => {
    if (req.action === 'autoplayBlocked') {
        document.getElementById('interaction-warning').style.display = 'block';
        setPlayingState(false);
        resetTimer();
        updateProgress(null);
    }
});

document.getElementById('btn-play').addEventListener('click', async () => {
    document.getElementById('interaction-warning').style.display = 'none';
    const resp = await sendCommand('togglePlay', {
        speed:      parseFloat(document.getElementById('speed-slider').value),
        volume:     parseFloat(document.getElementById('vol-slider').value),
        voiceIndex: parseInt(document.getElementById('voice-select').value) || 0
    });
    if (resp) {
        setPlayingState(resp.isPlaying, resp.isPaused);
    } else {
        showToast('Không tìm thấy nội dung truyện. Hãy mở trang đọc truyện trước.', 'warning');
    }
});

document.getElementById('btn-stop').addEventListener('click', async () => {
    await sendCommand('stopPlay');
    setPlayingState(false);
    resetTimer();
    updateProgress(null);
});

document.getElementById('btn-next').addEventListener('click', async () => {
    await sendCommand('nextChap');
    resetTimer();
    updateProgress(null);
    showToast('Đang chuyển chương sau...', 'info');
});

document.getElementById('btn-prev').addEventListener('click', async () => {
    await sendCommand('prevChap');
    resetTimer();
    updateProgress(null);
    showToast('Đang chuyển chương trước...', 'info');
});

document.getElementById('btn-prev-chunk').addEventListener('click', async () => {
    await sendCommand('prevChunk');
    pollStatus();
});

document.getElementById('btn-next-chunk').addEventListener('click', async () => {
    await sendCommand('nextChunk');
    pollStatus();
});

document.getElementById('btn-replay').addEventListener('click', async () => {
    document.getElementById('interaction-warning').style.display = 'none';
    const resp = await sendCommand('replayChap', {
        speed:      parseFloat(document.getElementById('speed-slider').value),
        volume:     parseFloat(document.getElementById('vol-slider').value),
        voiceIndex: parseInt(document.getElementById('voice-select').value) || 0
    });
    resetTimer();
    if (resp) setPlayingState(true);
    showToast('Đọc lại chương này', 'info');
});

const chkAutoNext = document.getElementById('chk-autonext');
chrome.storage.local.get('autoNext', d => {
    const val = d.autoNext !== undefined ? d.autoNext : true;
    chkAutoNext.checked = val;
    sendCommand('setAuto', { value: val });
});
chkAutoNext.addEventListener('change', e => {
    const val = e.target.checked;
    sendCommand('setAuto', { value: val });
    chrome.storage.local.set({ autoNext: val });
});

const speedSlider = document.getElementById('speed-slider');
const speedVal    = document.getElementById('speed-val');
speedSlider.addEventListener('input', () => {
    const v = parseFloat(speedSlider.value).toFixed(1);
    speedVal.textContent = `${v}×`;
    sendCommand('setSpeed', { value: parseFloat(v) });
    chrome.storage.local.set({ speed: parseFloat(v) });
});

const volSlider = document.getElementById('vol-slider');
const volVal    = document.getElementById('vol-val');
volSlider.addEventListener('input', () => {
    const v = parseFloat(volSlider.value);
    volVal.textContent = `${Math.round(v * 100)}%`;
    sendCommand('setVolume', { value: v });
    chrome.storage.local.set({ volume: v });
});

async function loadVoices() {
    const resp = await sendCommand('getVoices');
    if (!resp) return;
    const currentEngine = document.getElementById('engine-select').value;
    const voiceHint = document.getElementById('voice-hint');
    if (currentEngine !== 'web' && currentEngine !== 'auto') {
        if (voiceHint) voiceHint.style.display = 'none';
        return;
    }
    const sel = document.getElementById('voice-select');
    sel.innerHTML = '<option value="-1">Giọng mặc định</option>';
    (resp.voices || []).forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.index;
        opt.textContent = v.name;
        sel.appendChild(opt);
    });
    if (voiceHint) voiceHint.style.display = resp.hasVi ? 'none' : 'block';
    updateTtsBadge(resp.hasVi ? 'web' : 'google');
    chrome.storage.local.get('voiceIndex', d => {
        if (d.voiceIndex !== undefined) {
            let hasValue = false;
            for (let i = 0; i < sel.options.length; i++) {
                if (sel.options[i].value == d.voiceIndex) { sel.selectedIndex = i; hasValue = true; break; }
            }
            if (!hasValue) sel.selectedIndex = 0;
            const opt = sel.options[sel.selectedIndex];
            if (opt) document.getElementById('info-voice').textContent = opt.textContent;
        }
    });
}

document.getElementById('voice-select').addEventListener('change', e => {
    const idx = parseInt(e.target.value);
    sendCommand('setVoice', { value: idx });
    chrome.storage.local.set({ voiceIndex: idx });
    const opt = e.target.options[e.target.selectedIndex];
    document.getElementById('info-voice').textContent = opt?.textContent || 'Mặc định';
});

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
    });
});

function loadReadingList() {
    chrome.storage.local.get('readingList', data => {
        const list = data.readingList || [];
        renderReadingList(list);
        document.getElementById('info-count').textContent = `${list.length} truyện`;
    });
}

function renderReadingList(list) {
    const container = document.getElementById('list-container');
    if (!list.length) {
        container.innerHTML = '<div class="list-empty">Chưa có truyện nào được lưu.<br><small style="color:#555">Nhấn <strong style="color:var(--accent)">Lưu</strong> để thêm truyện đang mở.</small></div>';
        return;
    }
    container.innerHTML = list.map((item, i) => `
        <div class="list-item" data-index="${i}" title="Nhấn để mở truyện này">
            <img class="list-thumb" src="${item.imgUrl || FALLBACK_COVER}" alt="">
            <div class="list-info">
                <div class="list-name">${escHtml(item.title)}</div>
                <div class="list-chap">${escHtml(item.chap || 'Chưa xác định chương')}</div>
                ${item.url ? '<div class="list-date" style="font-size:9px;color:#555;margin-top:1px">Nhấn để tiếp tục đọc</div>' : ''}
            </div>
            <button class="btn-remove" data-index="${i}" title="Xoá khỏi danh sách">✕</button>
        </div>
    `).join('');
    container.querySelectorAll('.list-thumb').forEach(img => {
        img.addEventListener('error', function() { this.src = FALLBACK_COVER; }, { once: true });
        if (img.complete && img.naturalHeight === 0) img.src = FALLBACK_COVER;
    });
    container.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', e => { e.stopPropagation(); removeFromList(parseInt(btn.dataset.index)); });
    });
    container.querySelectorAll('.list-item').forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            const idx = parseInt(item.dataset.index);
            chrome.storage.local.get('readingList', data => {
                const entry = (data.readingList || [])[idx];
                if (entry?.url) chrome.tabs.create({ url: entry.url });
                else showToast('URL không được lưu cho truyện này', 'warning');
            });
        });
    });
}

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function removeFromList(index) {
    chrome.storage.local.get('readingList', data => {
        const list = data.readingList || [];
        list.splice(index, 1);
        chrome.storage.local.set({ readingList: list }, () => {
            renderReadingList(list);
            document.getElementById('info-count').textContent = `${list.length} truyện`;
            if (currentBookData) {
                const stillSaved = list.some(i => i.title === currentBookData.bookTitle);
                setSaveState(stillSaved);
            }
        });
    });
}

const btnSave = document.getElementById('btn-save');
btnSave.addEventListener('click', () => {
    if (!currentBookData) { showToast('Không có truyện nào đang mở', 'warning'); return; }
    chrome.storage.local.get('readingList', data => {
        const list = data.readingList || [];
        const existingIdx = list.findIndex(i => i.title === currentBookData.bookTitle);
        if (existingIdx !== -1) {
            list.splice(existingIdx, 1);
            chrome.storage.local.set({ readingList: list }, () => {
                renderReadingList(list);
                setSaveState(false);
                document.getElementById('info-count').textContent = `${list.length} truyện`;
                showToast('Đã bỏ lưu truyện', 'info');
            });
        } else {
            list.push({
                title:   currentBookData.bookTitle,
                chap:    currentBookData.chapTitle,
                imgUrl:  currentBookData.imgUrl,
                url:     currentBookData.pageUrl,
                savedAt: new Date().toLocaleDateString('vi-VN')
            });
            chrome.storage.local.set({ readingList: list }, () => {
                renderReadingList(list);
                setSaveState(true);
                document.getElementById('info-count').textContent = `${list.length} truyện`;
                showToast('Đã lưu truyện thành công!', 'success');
            });
        }
    });
});

function setSaveState(saved) {
    const saveIcon = document.getElementById('save-icon');
    const saveText = document.getElementById('save-text');
    btnSave.className = `btn-save${saved ? ' saved' : ''}`;
    saveIcon.innerHTML = saved ? SVG_BOOKMARK_CHK : SVG_BOOKMARK;
    saveText.textContent = saved ? 'Đã lưu' : 'Lưu';
}

document.getElementById('btn-clear-all').addEventListener('click', () => {
    if (!confirm('Xoá toàn bộ danh sách đọc?')) return;
    chrome.storage.local.set({ readingList: [] }, () => {
        renderReadingList([]);
        document.getElementById('info-count').textContent = '0 truyện';
        setSaveState(false);
        showToast('Đã xoá toàn bộ danh sách', 'info');
    });
});

const engineSelect    = document.getElementById('engine-select');
const apiSettingsBox  = document.getElementById('api-settings-box');
const apiKeyInput     = document.getElementById('api-key-input');
const apiRegionInput  = document.getElementById('api-region-input');
const btnSaveApi      = document.getElementById('btn-save-api');

engineSelect.addEventListener('change', e => {
    const val = e.target.value;
    const needsKey = ['fpt', 'azure', 'gcp'].includes(val);
    apiSettingsBox.style.display = needsKey ? 'block' : 'none';
    apiRegionInput.style.display = val === 'azure' ? 'block' : 'none';
    const placeholders = { fpt: 'Nhập FPT.AI API Key...', azure: 'Nhập Azure Subscription Key...' };
    if (placeholders[val]) apiKeyInput.placeholder = placeholders[val];
    sendCommand('setEngine', { value: val });
    chrome.storage.local.set({ ttsEngine: val });
    updateTtsBadge(val);
    const voiceSelect = document.getElementById('voice-select');
    const voiceHint   = document.getElementById('voice-hint');
    voiceSelect.disabled = false;
    if (val === 'web' || val === 'auto') {
        loadVoices();
    } else if (val === 'fpt') {
        voiceSelect.innerHTML = `
            <option value="0">Ban Mai (Nữ Miền Bắc)</option>
            <option value="1">Lê Minh (Nam Miền Bắc)</option>
            <option value="2">Thu Minh (Nữ Miền Bắc)</option>
            <option value="3">Mỹ An (Nữ Miền Trung)</option>
            <option value="4">Gia Huy (Nam Miền Trung)</option>
            <option value="5">Lan Nhi (Nữ Miền Nam)</option>
            <option value="6">Linh San (Nữ Miền Nam)</option>
        `;
        if (voiceHint) voiceHint.style.display = 'none';
    } else if (val === 'azure') {
        voiceSelect.innerHTML = `
            <option value="0">Hoài My (Nữ)</option>
            <option value="1">Nam Minh (Nam)</option>
        `;
        if (voiceHint) voiceHint.style.display = 'none';
    }
    if (needsKey) {
        chrome.storage.local.get([`${val}_key`, 'azure_region'], d => {
            apiKeyInput.value = d[`${val}_key`] || '';
            if (val === 'azure') apiRegionInput.value = d.azure_region || '';
        });
    }
});

btnSaveApi.addEventListener('click', () => {
    const val    = engineSelect.value;
    const key    = apiKeyInput.value.trim();
    const region = apiRegionInput.value.trim();
    if (!key) { showToast('Vui lòng nhập API Key', 'warning'); return; }
    const saveData = { [`${val}_key`]: key };
    if (val === 'azure') saveData['azure_region'] = region;
    chrome.storage.local.set(saveData, () => {
        const icon      = document.getElementById('btn-save-api-icon');
        const textLabel = document.getElementById('btn-save-api-text');
        icon.innerHTML = SVG_CHECK;
        textLabel.textContent = 'Đã lưu!';
        setTimeout(() => { icon.innerHTML = SVG_SAVE; textLabel.textContent = 'Lưu API Key'; }, 2000);
        sendCommand('setApiKeys', saveData);
        showToast('Đã lưu API Key thành công!', 'success');
    });
});

const coverImg = document.getElementById('cover-img');
coverImg.onerror = () => { coverImg.onerror = null; coverImg.src = FALLBACK_COVER; };

async function initPopup() {
    chrome.storage.local.get(['speed', 'volume', 'voiceIndex', 'ttsEngine'], d => {
        if (d.speed   !== undefined) { speedSlider.value = d.speed;   speedVal.textContent = `${parseFloat(d.speed).toFixed(1)}×`; }
        if (d.volume  !== undefined) { volSlider.value   = d.volume;  volVal.textContent   = `${Math.round(d.volume * 100)}%`; }
        if (d.ttsEngine) {
            engineSelect.value = d.ttsEngine;
            engineSelect.dispatchEvent(new Event('change'));
        }
    });

    const resp = await sendCommand('getInfo');
    if (!resp || !resp.bookTitle) {
        document.getElementById('status-text').textContent = '⚠ Mở trang STV trước';
        document.getElementById('current-title').textContent = 'Chưa mở trang đọc truyện';
        document.getElementById('cover-img').src = FALLBACK_COVER;
        return;
    }

    currentBookData = { ...resp, pageUrl: resp.pageUrl || resp.bookUrl };

    chrome.storage.local.get('readingList', data => {
        let list = data.readingList || [];
        const savedIdx = list.findIndex(i => i.title.trim().toLowerCase() === resp.bookTitle.trim().toLowerCase());

        if (!resp.imgUrl) {
            coverImg.src = (savedIdx !== -1 && list[savedIdx].imgUrl) ? list[savedIdx].imgUrl : FALLBACK_COVER;
            coverImg.style.display = 'block';
        } else {
            coverImg.src = resp.imgUrl;
        }

        if (savedIdx !== -1) {
            setSaveState(true);
            let isUpdated = false;
            if (currentBookData.pageUrl && list[savedIdx].url !== currentBookData.pageUrl)  { list[savedIdx].url    = currentBookData.pageUrl; isUpdated = true; }
            if (resp.chapTitle && list[savedIdx].chap !== resp.chapTitle)                    { list[savedIdx].chap   = resp.chapTitle;          isUpdated = true; }
            if (resp.imgUrl    && list[savedIdx].imgUrl !== resp.imgUrl)                     { list[savedIdx].imgUrl = resp.imgUrl;              isUpdated = true; }
            if (isUpdated) chrome.storage.local.set({ readingList: list }, () => renderReadingList(list));
        }
    });

    if (resp.bookTitle) document.getElementById('current-title').textContent = resp.bookTitle;
    if (resp.chapTitle) document.getElementById('current-chap').textContent  = resp.chapTitle;
    if (resp.bookUrl) {
        const openStoryPage = () => window.open(resp.bookUrl, '_blank');
        coverImg.style.cursor = 'pointer';
        coverImg.title = 'Nhấn để mở trang thông tin truyện';
        coverImg.addEventListener('click', openStoryPage);
        const titleEl = document.getElementById('current-title');
        titleEl.style.cursor = 'pointer';
        titleEl.title = 'Nhấn để mở trang thông tin truyện';
        titleEl.addEventListener('click', openStoryPage);
    }
    if (resp.ttsEngine) updateTtsBadge(resp.ttsEngine);
    if (resp.elapsed !== undefined) { timerSeconds = resp.elapsed; updateTimerDisplay(); }
    setPlayingState(resp.isPlaying, resp.isPaused);
    if (resp.isPlaying) startTimer();
    startPolling();
    setTimeout(loadVoices, 300);
}

initPopup();
loadReadingList();

document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopPolling();
    else startPolling();
});

document.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    switch (e.key.toLowerCase()) {
        case 'k':          e.preventDefault(); document.getElementById('btn-play').click();   break;
        case 'arrowleft':  e.preventDefault(); document.getElementById('btn-prev').click();   break;
        case 'arrowright': e.preventDefault(); document.getElementById('btn-next').click();   break;
        case 'r':          e.preventDefault(); document.getElementById('btn-replay').click(); break;
        case 'escape':     e.preventDefault(); document.getElementById('btn-stop').click();   break;
    }
});