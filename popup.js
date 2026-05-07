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
let currentReadingList = [];
let lastVolume = 1.0;
async function sendToTab(tabId, cmd, extra = {}) {
    return new Promise(resolve => {
        chrome.tabs.sendMessage(tabId, { action: cmd, ...extra }, resp => {
            void chrome.runtime.lastError;
            resolve(resp);
        });
    });
}
async function sendCommand(cmd, extra = {}) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab && activeTab.url && activeTab.url.includes('sangtacviet.com')) {
        const resp = await sendToTab(activeTab.id, cmd, extra);
        if (resp) return resp;
    }
    let tabs = await chrome.tabs.query({ url: "*://*.sangtacviet.com/*" });
    if (tabs.length === 0) return { noTab: true };
    tabs.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
    const storyTabs = tabs.filter(t => t.url.includes('/truyen/'));
    const candidateTabs = storyTabs.length > 0 ? storyTabs : tabs;
    for (const tab of candidateTabs) {
        const resp = await sendToTab(tab.id, cmd, extra);
        if (resp && resp.bookTitle) return resp;
    }
    return sendToTab(tabs[0].id, cmd, extra);
}
let toastTimeout = null;
function showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    let iconSvg = '';
    if (type === 'success') iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    if (type === 'info') iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
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
    const dot = document.getElementById('status-dot');
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
    const input = document.getElementById('progress-input');
    const total = document.getElementById('progress-total');
    const barFill = document.getElementById('progress-bar-fill');
    const percentEl = document.getElementById('progress-percent');
    if (progress && progress.total > 0) {
        if (input && document.activeElement !== input) input.value = progress.current;
        if (total) total.textContent = progress.total;
        const pct = Math.round((progress.current / progress.total) * 100);
        if (barFill) barFill.style.width = pct + '%';
        if (percentEl) percentEl.textContent = pct + '%';
    } else {
        if (input && document.activeElement !== input) input.value = 0;
        if (total) total.textContent = 0;
        if (barFill) barFill.style.width = '0%';
        if (percentEl) percentEl.textContent = '0%';
    }
}
function updateTtsBadge(engine) {
    const badge = document.getElementById('tts-badge');
    const footerSpan = document.getElementById('footer-engine');
    if (!badge) return;
    const map = {
        web: ['Web TTS', 'var(--success)', 'var(--success)', 'Web Speech API'],
        fpt: ['FPT.AI', 'var(--accent2)', 'var(--accent2)', 'FPT.AI TTS'],
        azure: ['Azure TTS', 'var(--accent)', 'var(--accent)', 'Microsoft Azure'],
    };
    const [label, border, color, footerName] = map[engine] || map.web;
    badge.textContent = label;
    badge.style.borderColor = border;
    badge.style.color = color;
    if (footerSpan) {
        footerSpan.textContent = footerName;
        footerSpan.style.color = color;
    }
}
async function pollStatus() {
    const resp = await sendCommand('getStatus');
    if (!resp || resp.noTab) {
        document.getElementById('book-empty-state').style.display = 'block';
        document.getElementById('book-meta').style.display = 'none';
        document.getElementById('cover-img').style.display = 'none';
        document.querySelector('.controls').style.display = 'none';
        document.querySelector('.status-bar').style.display = 'none';
        stopPolling();
        return;
    }
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
    const v = document.getElementById('voice-select').value;
    const resp = await sendCommand('togglePlay', {
        speed: parseFloat(document.getElementById('speed-slider').value),
        volume: parseFloat(document.getElementById('vol-slider').value),
        voiceIndex: isNaN(v) ? v : parseInt(v)
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
document.getElementById('progress-input').addEventListener('change', async (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    const total = parseInt(document.getElementById('progress-total').textContent) || 1;
    if (val > total) val = total;
    await sendCommand('jumpToChunk', { value: val });
    pollStatus();
});
document.getElementById('btn-replay').addEventListener('click', async () => {
    document.getElementById('interaction-warning').style.display = 'none';
    const v = document.getElementById('voice-select').value;
    const resp = await sendCommand('replayChap', {
        speed: parseFloat(document.getElementById('speed-slider').value),
        volume: parseFloat(document.getElementById('vol-slider').value),
        voiceIndex: isNaN(v) ? v : parseInt(v)
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
const speedVal = document.getElementById('speed-val');
speedSlider.addEventListener('input', () => {
    const v = parseFloat(speedSlider.value).toFixed(1);
    speedVal.textContent = `${v}×`;
    sendCommand('setSpeed', { value: parseFloat(v) });
    chrome.storage.local.set({ speed: parseFloat(v) });
});
const volSlider = document.getElementById('vol-slider');
const volVal = document.getElementById('vol-val');
volSlider.addEventListener('input', () => {
    const v = parseFloat(volSlider.value);
    volVal.textContent = `${Math.round(v * 100)}%`;
    sendCommand('setVolume', { value: v });
    chrome.storage.local.set({ volume: v });
});
document.getElementById('btn-mute').addEventListener('click', () => {
    const vol = parseFloat(volSlider.value);
    const muteIcon = document.getElementById('mute-icon');
    if (vol > 0) {
        lastVolume = vol;
        volSlider.value = 0;
        muteIcon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
    } else {
        volSlider.value = lastVolume || 1.0;
        muteIcon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>';
    }
    volSlider.dispatchEvent(new Event('input'));
});
async function loadVoices() {
    const currentEngine = document.getElementById('engine-select').value;
    const voiceHint = document.getElementById('voice-hint');
    if (currentEngine !== 'web' && currentEngine !== 'auto') {
        if (voiceHint) voiceHint.style.display = 'none';
        return;
    }
    const resp = await sendCommand('getVoices');
    if (!resp || !resp.voices) return;
    const sel = document.getElementById('voice-select');
    sel.innerHTML = '';
    const viVoices = resp.voices.filter(v => v.lang && v.lang.startsWith('vi'));
    let hoaiMyIndex = -1;
    let firstViIndex = -1;
    if (viVoices.length > 0) {
        viVoices.forEach((v, idx) => {
            const opt = document.createElement('option');
            opt.value = v.name;
            let shortName = v.name
                .replace(/\s*-\s*Vietnamese\s*\(Vietnam\)/gi, '')
                .replace(/\s*Online\s*\(Natural\)/gi, '')
                .replace(/Microsoft/gi, 'MS')
                .replace(/Google/gi, 'GG')
                .trim();
            opt.textContent = shortName;
            sel.appendChild(opt);
            if (shortName.includes('Hoài My')) hoaiMyIndex = v.name;
            if (idx === 0) firstViIndex = v.name;
        });
    }
    if (voiceHint) voiceHint.style.display = viVoices.length > 0 ? 'none' : 'block';

    chrome.storage.local.get('voiceIndex', d => {
        let targetIndex = d.voiceIndex;
        if (targetIndex === undefined || targetIndex === -1) {
            targetIndex = (hoaiMyIndex !== -1) ? hoaiMyIndex : firstViIndex;
        }
        let hasValue = false;
        for (let i = 0; i < sel.options.length; i++) {
            if (sel.options[i].value == targetIndex) {
                sel.selectedIndex = i;
                hasValue = true;
                break;
            }
        }
        if (!hasValue && sel.options.length > 0) {
            sel.selectedIndex = 0;
            targetIndex = sel.options[0].value;
        }
        const opt = sel.options[sel.selectedIndex];
        if (opt) {
            document.getElementById('info-voice').textContent = opt.textContent;
            if (d.voiceIndex != targetIndex && targetIndex !== -1) {
                chrome.storage.local.set({ voiceIndex: targetIndex });
                sendCommand('setVoice', { value: targetIndex });
            }
        }
        renderCustomDropdown();
    });
}
document.getElementById('voice-select').addEventListener('change', e => {
    const val = e.target.value;
    const idx = isNaN(val) ? val : parseInt(val);

    sendCommand('setVoice', { value: idx });
    chrome.storage.local.set({ voiceIndex: idx });
    const opt = e.target.options[e.target.selectedIndex];
    document.getElementById('info-voice').textContent = opt?.textContent || 'Mặc định';
});
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const targetPanel = document.getElementById(`panel-${tab.dataset.tab}`);
        const isAlreadyActive = targetPanel && targetPanel.classList.contains('active');
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        if (isAlreadyActive && tab.dataset.tab !== 'main') {
            document.getElementById('panel-main').classList.add('active');
        } else {
            tab.classList.add('active');
            if (targetPanel) targetPanel.classList.add('active');
        }
    });
});
function loadReadingList() {
    chrome.storage.local.get('readingList', data => {
        currentReadingList = data.readingList || [];
        renderReadingList(currentReadingList);
        document.getElementById('info-count').textContent = `${currentReadingList.length} truyện`;
    });
}
document.getElementById('list-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
        renderReadingList(currentReadingList);
    } else {
        const filtered = currentReadingList.filter(i =>
            i.title.toLowerCase().includes(q) || (i.chap && i.chap.toLowerCase().includes(q))
        );
        renderReadingList(filtered);
    }
});
function renderReadingList(list) {
    const container = document.getElementById('list-container');
    if (!list.length) {
        container.innerHTML = '<div class="list-empty">Chưa có truyện nào được lưu.<br><small style="color:#555">Nhấn <strong style="color:var(--accent)">Lưu</strong> để thêm truyện đang mở.</small></div>';
        return;
    }
    container.innerHTML = list.map((item, i) => `
        <div class="list-item" data-title="${escHtml(item.title)}" title="Nhấn để mở truyện này">
            <img class="list-thumb" src="${item.imgUrl || FALLBACK_COVER}" alt="">
            <div class="list-info">
                <div class="list-name">${escHtml(item.title)}</div>
                <div class="list-chap">
                    ${escHtml(item.chap || 'Chưa xác định chương')}
                    <span style="color:var(--accent); font-weight: 500;">
                        ${item.chunkIndex && item.chunkTotal ? `(Đoạn ${item.chunkIndex}/${item.chunkTotal})` : ''}
                    </span>
                </div>
                ${item.url ? '<div class="list-date" style="font-size:9px;color:#555;margin-top:1px">Nhấn để tiếp tục đọc</div>' : ''}
            </div>
            <button class="btn-remove" data-title="${escHtml(item.title)}" title="Xoá khỏi danh sách">✕</button>
        </div>
    `).join('');
    container.querySelectorAll('.list-thumb').forEach(img => {
        img.addEventListener('error', function () { this.src = FALLBACK_COVER; }, { once: true });
        if (img.complete && img.naturalHeight === 0) img.src = FALLBACK_COVER;
    });
    container.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', e => { e.stopPropagation(); removeFromList(btn.dataset.title); });
    });
    container.querySelectorAll('.list-item').forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            const title = item.dataset.title;
            chrome.storage.local.get('readingList', data => {
                const entry = (data.readingList || []).find(e => e.title === title);
                if (entry?.url) chrome.tabs.create({ url: entry.url });
                else showToast('URL không được lưu cho truyện này', 'warning');
            });
        });
    });
}
function escHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function removeFromList(title) {
    chrome.storage.local.get('readingList', data => {
        const list = data.readingList || [];
        const idx = list.findIndex(i => i.title === title);
        if (idx === -1) return;
        list.splice(idx, 1);
        chrome.storage.local.set({ readingList: list }, () => {
            currentReadingList = list;
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
                title: currentBookData.bookTitle,
                chap: currentBookData.chapTitle,
                imgUrl: currentBookData.imgUrl,
                url: currentBookData.pageUrl,
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
    const modal = document.getElementById('confirm-modal');
    document.getElementById('modal-title').textContent = 'Xoá tất cả dữ liệu';
    document.getElementById('modal-body').textContent = 'Thao tác này sẽ xoá TẤT CẢ dữ liệu: danh sách đọc, API Key, cài đặt tốc độ, âm lượng, giọng đọc... Bạn có chắc chắn?';
    modal.classList.add('show');
    const onConfirm = () => {
        chrome.storage.local.clear(() => {
            currentReadingList = [];
            renderReadingList([]);
            document.getElementById('info-count').textContent = '0 truyện';
            setSaveState(false);
            speedSlider.value = 1.0; speedVal.textContent = '1.0×';
            volSlider.value = 1; volVal.textContent = '100%';
            engineSelect.value = 'web';
            apiSettingsBox.style.display = 'none';
            apiKeyInput.value = '';
            apiRegionInput.value = '';
            document.getElementById('voice-select').innerHTML = '<option value="-1">Giọng mặc định</option>';
            document.getElementById('select-auto-stop').value = 'off';
            document.getElementById('group-stop-time').style.display = 'none';
            document.getElementById('group-stop-chapters').style.display = 'none';
            updateTtsBadge('web');
            sendCommand('stopPlay');
            showToast('Đã xoá toàn bộ dữ liệu extension', 'info');
        });
        modal.classList.remove('show');
        cleanup();
    };
    const onCancel = () => {
        modal.classList.remove('show');
        cleanup();
    };
    const cleanup = () => {
        document.getElementById('modal-confirm').removeEventListener('click', onConfirm);
        document.getElementById('modal-cancel').removeEventListener('click', onCancel);
        modal.removeEventListener('click', onOverlayClick);
    };
    const onOverlayClick = (e) => {
        if (e.target === modal) onCancel();
    };
    document.getElementById('modal-confirm').addEventListener('click', onConfirm);
    document.getElementById('modal-cancel').addEventListener('click', onCancel);
    modal.addEventListener('click', onOverlayClick);
});
document.getElementById('btn-open-stv').addEventListener('click', () => {
    window.open('https://sangtacviet.com', '_blank');
});
const engineSelect = document.getElementById('engine-select');
const apiSettingsBox = document.getElementById('api-settings-box');
const apiKeyInput = document.getElementById('api-key-input');
const apiRegionInput = document.getElementById('api-region-input');
const btnSaveApi = document.getElementById('btn-save-api');
engineSelect.addEventListener('change', e => {
    const val = e.target.value;
    const needsKey = ['fpt', 'azure'].includes(val);
    apiSettingsBox.style.display = needsKey ? 'block' : 'none';
    apiRegionInput.style.display = val === 'azure' ? 'block' : 'none';
    const placeholders = { fpt: 'Nhập FPT.AI API Key...', azure: 'Nhập Azure Subscription Key...' };
    if (placeholders[val]) apiKeyInput.placeholder = placeholders[val];
    sendCommand('setEngine', { value: val });
    chrome.storage.local.set({ ttsEngine: val });
    updateTtsBadge(val);
    const voiceSelect = document.getElementById('voice-select');
    const voiceHint = document.getElementById('voice-hint');
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
        renderCustomDropdown();
    } else if (val === 'azure') {
        voiceSelect.innerHTML = `
            <option value="0">Hoài My (Nữ)</option>
            <option value="1">Nam Minh (Nam)</option>
        `;
        if (voiceHint) voiceHint.style.display = 'none';
        renderCustomDropdown();
    }
    if (needsKey) {
        chrome.storage.local.get([`${val}_key`, 'azure_region'], d => {
            apiKeyInput.value = d[`${val}_key`] || '';
            if (val === 'azure') apiRegionInput.value = d.azure_region || '';
        });
    }
});
btnSaveApi.addEventListener('click', () => {
    const val = engineSelect.value;
    const key = apiKeyInput.value.trim();
    const region = apiRegionInput.value.trim();
    if (!key) { showToast('Vui lòng nhập API Key', 'warning'); return; }
    const saveData = { [`${val}_key`]: key };
    if (val === 'azure') saveData['azure_region'] = region;
    chrome.storage.local.set(saveData, () => {
        const icon = document.getElementById('btn-save-api-icon');
        const textLabel = document.getElementById('btn-save-api-text');
        icon.innerHTML = SVG_CHECK;
        textLabel.textContent = 'Đã lưu!';
        setTimeout(() => { icon.innerHTML = SVG_SAVE; textLabel.textContent = 'Lưu API Key'; }, 2000);
        sendCommand('setApiKeys', saveData);
        showToast('Đã lưu API Key thành công!', 'success');
    });
});
document.getElementById('btn-test-api').addEventListener('click', async () => {
    const val = engineSelect.value;
    const key = apiKeyInput.value.trim();
    if (!key) { showToast('Vui lòng nhập API Key để thử', 'warning'); return; }
    const btn = document.getElementById('btn-test-api');
    const oldTxt = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Đang thử...';
    try {
        let success = false;
        if (val === 'fpt') {
            const r = await fetch('https://api.fpt.ai/hmi/tts/v5', {
                method: 'POST', headers: { 'api-key': key }, body: 'Kiểm tra'
            });
            success = r.ok;
        } else if (val === 'azure') {
            const region = apiRegionInput.value.trim() || 'southeastasia';
            if (!apiRegionInput.value.trim()) {
                showToast('Region trống, sử dụng mặc định: southeastasia', 'info');
            }
            const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
                method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3' },
                body: `<speak version='1.0' xml:lang='vi-VN'><voice xml:lang='vi-VN' name='vi-VN-HoaiMyNeural'>Kiểm tra</voice></speak>`
            });
            success = r.ok;
        }
        if (success) showToast('API Key hoạt động tốt!', 'success');
        else showToast('API Key không hợp lệ hoặc hết hạn', 'warning');
    } catch (e) {
        showToast('Lỗi kết nối API', 'warning');
    } finally {
        btn.disabled = false;
        btn.textContent = oldTxt;
    }
});
const selectAutoStop = document.getElementById('select-auto-stop');
const groupStopTime = document.getElementById('group-stop-time');
const groupStopChapters = document.getElementById('group-stop-chapters');
selectAutoStop.addEventListener('change', () => {
    const val = selectAutoStop.value;
    groupStopTime.style.display = (val === 'time') ? 'flex' : 'none';
    groupStopChapters.style.display = (val === 'chapters') ? 'flex' : 'none';
    if (val === 'off') {
        sendCommand('setSleepTimer', { minutes: 0 });
        sendCommand('setStopChapters', { count: 0 });
        chrome.storage.local.remove(['stopTime', 'stopChapters', 'sleepTargetTimestamp']);
        showToast('Đã tắt tự động dừng', 'info');
    }
});
document.getElementById('btn-apply-stop-time').addEventListener('click', () => {
    const mins = parseInt(document.getElementById('input-stop-time').value);
    if (isNaN(mins) || mins <= 0) return;
    sendCommand('setSleepTimer', { minutes: mins });
    chrome.storage.local.set({ stopTime: mins });
    showToast(`Sẽ dừng sau ${mins} phút`, 'success');
});
document.getElementById('btn-apply-stop-chapters').addEventListener('click', () => {
    const count = parseInt(document.getElementById('input-stop-chapters').value);
    if (isNaN(count) || count <= 0) return;
    sendCommand('setStopChapters', { count: count });
    chrome.storage.local.set({ stopAfterChapters: count });
    showToast(`Sẽ dừng sau ${count} chương`, 'success');
});
const coverImg = document.getElementById('cover-img');
coverImg.onerror = () => { coverImg.onerror = null; coverImg.src = FALLBACK_COVER; };
async function initPopup() {
    document.getElementById('version-badge').textContent = 'v' + chrome.runtime.getManifest().version;
    const tabs = await chrome.tabs.query({ url: "*://*.sangtacviet.com/*" });
    const hasStvTab = tabs.length > 0;
    if (!hasStvTab) {
        chrome.storage.local.remove('last_active_state');
        document.getElementById('status-text').textContent = '⚠ Mở trang STV trước';
        document.getElementById('current-title').textContent = 'Chưa mở trang sangtacviet.com';
        document.getElementById('current-chap').textContent = '—';
        document.getElementById('cover-img').style.display = 'none';
        document.getElementById('book-empty-state').style.display = 'block';
        document.getElementById('book-meta').style.display = 'none';
        document.querySelector('.controls').style.display = 'none';
        document.querySelector('.status-bar').style.display = 'none';
    } else {
        chrome.storage.local.get(['last_active_state'], d => {
            if (d.last_active_state) {
                const s = d.last_active_state;
                document.getElementById('book-empty-state').style.display = 'none';
                document.getElementById('book-meta').style.display = 'block';
                document.getElementById('cover-img').style.display = 'block';
                document.getElementById('current-title').textContent = s.bookTitle;
                document.getElementById('current-chap').textContent = s.chapTitle;
                document.getElementById('current-chap').style.display = 'block';
                document.getElementById('btn-save').style.display = 'flex';
                document.querySelector('.controls').style.display = 'flex';
                document.querySelector('.status-bar').style.display = 'flex';
                updateProgress(s.progress);
                setPlayingState(s.isPlaying, s.isPaused);
                if (s.ttsEngine) updateTtsBadge(s.ttsEngine);
            }
        });
    }
    chrome.storage.local.get([
        'speed', 'volume', 'voiceIndex', 'ttsEngine',
        'enableShortcuts', 'readBookTitle', 'readChapTitle'
    ], d => {
        if (d.speed !== undefined) { speedSlider.value = d.speed; speedVal.textContent = `${parseFloat(d.speed).toFixed(1)}×`; }
        if (d.volume !== undefined) { volSlider.value = d.volume; volVal.textContent = `${Math.round(d.volume * 100)}%`; }
        if (d.ttsEngine) {
            engineSelect.value = d.ttsEngine;
            setTimeout(() => engineSelect.dispatchEvent(new Event('change')), 350);
        }
        if (d.enableShortcuts !== undefined) document.getElementById('chk-shortcuts').checked = d.enableShortcuts;
        if (d.readBookTitle !== undefined) document.getElementById('chk-read-book').checked = d.readBookTitle;
        if (d.readChapTitle !== undefined) document.getElementById('chk-read-chap').checked = d.readChapTitle;
        chrome.storage.local.get(['stopTime', 'stopChapters', 'sleepTargetTimestamp'], data => {
            const selectAutoStop = document.getElementById('select-auto-stop');
            const groupStopTime = document.getElementById('group-stop-time');
            const groupStopChapters = document.getElementById('group-stop-chapters');
            if (data.sleepTargetTimestamp || data.stopTime) {
                selectAutoStop.value = 'time';
                groupStopTime.style.display = 'flex';
                if (data.stopTime) document.getElementById('input-stop-time').value = data.stopTime;
            } else if (data.stopChapters) {
                selectAutoStop.value = 'chapters';
                groupStopChapters.style.display = 'flex';
                document.getElementById('input-stop-chapters').value = data.stopChapters;
            }
        });
    });
    if (!hasStvTab) return;
    let resp = await sendCommand('getInfo');
    const emptyState = document.getElementById('book-empty-state');
    const bookMeta = document.getElementById('book-meta');
    const btnOpenSTV = document.getElementById('btn-open-stv');
    if (!resp || resp.noTab) {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && activeTab.url && activeTab.url.includes('sangtacviet.com')) {
            await new Promise(r => setTimeout(r, 800));
            resp = await sendCommand('getInfo');
        }
    }
    if (!resp || resp.noTab) {
        chrome.storage.local.remove('last_active_state');
        document.getElementById('status-text').textContent = '⚠ Mở trang STV trước';
        document.getElementById('current-title').textContent = 'Chưa mở trang sangtacviet.com';
        document.getElementById('current-chap').textContent = '—';
        document.getElementById('cover-img').style.display = 'none';
        emptyState.style.display = 'block';
        bookMeta.style.display = 'none';
        btnOpenSTV.textContent = 'Mở trang sangtacviet.com ngay!';
        document.querySelector('.controls').style.display = 'none';
        document.querySelector('.status-bar').style.display = 'none';
        return;
    }
    if (!resp.bookTitle) {
        document.getElementById('status-text').textContent = '⚠ Chọn một truyện để đọc';
        document.getElementById('current-title').textContent = 'Đang ở trang chủ / tìm kiếm';
        document.getElementById('current-chap').textContent = '—';
        document.getElementById('current-chap').style.display = 'none';
        document.getElementById('btn-save').style.display = 'none';
        document.getElementById('cover-img').style.display = 'none';
        emptyState.style.display = 'none';
        bookMeta.style.display = 'block';
        document.querySelector('.controls').style.display = 'none';
        document.querySelector('.status-bar').style.display = 'none';
        return;
    }
    emptyState.style.display = 'none';
    bookMeta.style.display = 'block';
    document.getElementById('cover-img').style.display = 'block';
    document.getElementById('current-chap').style.display = 'block';
    document.getElementById('btn-save').style.display = 'flex';
    document.querySelector('.controls').style.display = 'flex';
    document.querySelector('.status-bar').style.display = 'flex';
    currentBookData = { ...resp, pageUrl: resp.pageUrl || resp.bookUrl };
    chrome.storage.local.get('readingList', data => {
        let list = data.readingList || [];
        const savedIdx = list.findIndex(i => i.title.trim().toLowerCase() === resp.bookTitle.trim().toLowerCase());
        if (!resp.imgUrl) {
            coverImg.src = (savedIdx !== -1 && list[savedIdx].imgUrl) ? list[savedIdx].imgUrl : FALLBACK_COVER;
        } else {
            coverImg.src = resp.imgUrl;
        }
        coverImg.style.display = 'block';
        if (savedIdx !== -1) {
            setSaveState(true);
            let isUpdated = false;
            if (currentBookData.pageUrl && list[savedIdx].url !== currentBookData.pageUrl) { list[savedIdx].url = currentBookData.pageUrl; isUpdated = true; }
            if (resp.chapTitle && list[savedIdx].chap !== resp.chapTitle) { list[savedIdx].chap = resp.chapTitle; isUpdated = true; }
            if (resp.imgUrl && list[savedIdx].imgUrl !== resp.imgUrl) { list[savedIdx].imgUrl = resp.imgUrl; isUpdated = true; }
            if (isUpdated) chrome.storage.local.set({ readingList: list }, () => renderReadingList(list));
        }
    });
    if (resp.bookTitle) document.getElementById('current-title').textContent = resp.bookTitle;
    if (resp.chapTitle) document.getElementById('current-chap').textContent = resp.chapTitle;
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
    if (document.querySelector('.controls').style.display === 'none') return;
    switch (e.key.toLowerCase()) {
        case 'k': e.preventDefault(); document.getElementById('btn-play').click(); break;
        case 'arrowleft': e.preventDefault(); document.getElementById('btn-prev').click(); break;
        case 'arrowright': e.preventDefault(); document.getElementById('btn-next').click(); break;
        case 'r': e.preventDefault(); document.getElementById('btn-replay').click(); break;
        case 'escape': e.preventDefault(); document.getElementById('btn-stop').click(); break;
    }
});
function renderCustomDropdown() {
    const nativeSelect = document.getElementById('voice-select');
    const trigger = document.getElementById('custom-voice-trigger');
    const dropdown = document.getElementById('custom-voice-dropdown');
    const textSpan = document.getElementById('custom-voice-text');
    if (!nativeSelect || !trigger || !dropdown) return;
    dropdown.innerHTML = '';
    const selectedOpt = nativeSelect.options[nativeSelect.selectedIndex];
    if (selectedOpt) {
        textSpan.textContent = selectedOpt.textContent;
    } else {
        textSpan.textContent = 'Chưa tải được giọng';
    }
    Array.from(nativeSelect.options).forEach(opt => {
        const item = document.createElement('div');
        item.className = 'custom-option';
        if (opt.selected) item.classList.add('selected');
        item.textContent = opt.textContent;
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            nativeSelect.value = opt.value;
            nativeSelect.dispatchEvent(new Event('change'));
            textSpan.textContent = opt.textContent;
            dropdown.querySelectorAll('.custom-option').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            dropdown.classList.remove('show');
        });
        dropdown.appendChild(item);
    });
}
function setupStaticCustomDropdown(selectId, textId, dropdownId) {
    const nativeSelect = document.getElementById(selectId);
    const dropdown = document.getElementById(dropdownId);
    const textSpan = document.getElementById(textId);
    if (!nativeSelect || !dropdown || !textSpan) return;
    function update() {
        dropdown.innerHTML = '';
        const selectedOpt = nativeSelect.options[nativeSelect.selectedIndex];
        if (selectedOpt) textSpan.textContent = selectedOpt.textContent;
        Array.from(nativeSelect.children).forEach(child => {
            if (child.tagName === 'OPTGROUP') {
                const grp = document.createElement('div');
                grp.className = 'custom-optgroup';
                grp.textContent = child.label;
                dropdown.appendChild(grp);
                Array.from(child.children).forEach(opt => {
                    dropdown.appendChild(createItem(opt, true));
                });
            } else if (child.tagName === 'OPTION') {
                dropdown.appendChild(createItem(child, false));
            }
        });
    }
    function createItem(opt, isIndented) {
        const item = document.createElement('div');
        item.className = 'custom-option';
        if (isIndented) item.style.paddingLeft = '24px';
        if (opt.selected) item.classList.add('selected');
        item.textContent = opt.textContent;
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            nativeSelect.value = opt.value;
            nativeSelect.dispatchEvent(new Event('change'));
            dropdown.classList.remove('show');
        });
        return item;
    }
    nativeSelect.addEventListener('change', update);
    update();
}
setupStaticCustomDropdown('engine-select', 'custom-engine-text', 'custom-engine-dropdown');
setupStaticCustomDropdown('select-auto-stop', 'custom-autostop-text', 'custom-autostop-dropdown');
document.addEventListener('click', (e) => {
    const isClickInside = e.target.closest('.custom-select-container');
    if (!isClickInside) {
        document.querySelectorAll('.custom-select-dropdown').forEach(d => d.classList.remove('show'));
        return;
    }
    const trigger = e.target.closest('.custom-select-trigger');
    if (trigger) {
        const container = trigger.closest('.custom-select-container');
        const dropdown = container.querySelector('.custom-select-dropdown');
        document.querySelectorAll('.custom-select-dropdown').forEach(d => {
            if (d !== dropdown) d.classList.remove('show');
        });
        if (dropdown) dropdown.classList.toggle('show');
    }
});
['chk-shortcuts', 'chk-read-book', 'chk-read-chap'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('change', e => {
            const key = id === 'chk-shortcuts' ? 'enableShortcuts' : (id === 'chk-read-book' ? 'readBookTitle' : 'readChapTitle');
            chrome.storage.local.set({ [key]: e.target.checked });
        });
    }
});