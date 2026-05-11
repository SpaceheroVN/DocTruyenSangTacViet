'use strict';

chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const url = tabs[0]?.url || '';
    if (url.includes('sangtacviet.com') && !url.includes('/truyen/')) {
        const controls = document.querySelector('.controls');
        const statusBar = document.querySelector('.status-bar');
        if (controls) controls.style.display = 'none';
        if (statusBar) statusBar.style.display = 'none';
    }
});

const FALLBACK_COVER = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='54' height='78' viewBox='0 0 24 24' fill='none' stroke='%237a7896' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3.6 3.6A2 2 0 0 1 5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-.59 1.41'/%3E%3Cpath d='M3 8.7V19a2 2 0 0 0 2 2h10.3'/%3E%3Cpath d='m2 2 20 20'/%3E%3Cpath d='M13 13a3 3 0 1 0 0-6H9v2'/%3E%3Cpath d='M9 17v-2.3'/%3E%3C/svg%3E";
const SVG_PLAY = `<polygon points="5 3 19 12 5 21 5 3"/>`;
const SVG_PAUSE = `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`;
const SVG_BOOKMARK = `<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>`;
const SVG_BOOKMARK_CHK = `<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/><polyline points="9 10 12 13 15 7"/>`;
const SVG_SAVE = `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>`;
const SVG_CHECK = `<polyline points="20 6 9 17 4 12"/>`;
const svgCpt = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 3px; color: var(--warning);"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;

let mahengio_dongho = null;
let giaydongho = 0;
let trangthaicuoi = { isPlaying: false, isPaused: false };
let mahengio_capnhat = null;
let dulieutruyenhientai = null;
let danhsachdochientai = [];
let amluongtruoc = 1.0;

async function guitoithe(idthe, lenh, them = {}) {
    return new Promise(resolve => {
        chrome.tabs.sendMessage(idthe, { action: lenh, ...them }, phanhoi => {
            void chrome.runtime.lastError;
            resolve(phanhoi);
        });
    });
}

let id_the_stv_cached = null;

async function guilenh(lenh, them = {}) {
    if (id_the_stv_cached) {
        try {
            const phanhoi = await guitoithe(id_the_stv_cached, lenh, them);
            if (phanhoi && !phanhoi.noTab) return phanhoi;
        } catch (e) {
            id_the_stv_cached = null;
        }
    }

    const [the_danghoatdong] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (the_danghoatdong && the_danghoatdong.url && the_danghoatdong.url.includes('sangtacviet.com')) {
        const phanhoi = await guitoithe(the_danghoatdong.id, lenh, them);
        if (phanhoi) {
            id_the_stv_cached = the_danghoatdong.id;
            return phanhoi;
        }
    }

    let cacthe = await chrome.tabs.query({ url: "*://*.sangtacviet.com/*" });
    if (cacthe.length === 0) return { noTab: true };
    cacthe.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
    const the_truyen = cacthe.filter(t => t.url.includes('/truyen/'));
    const the_ungvien = the_truyen.length > 0 ? the_truyen : cacthe;

    for (const the of the_ungvien) {
        const phanhoi = await guitoithe(the.id, lenh, them);
        if (phanhoi && phanhoi.bookTitle) {
            id_the_stv_cached = the.id;
            return phanhoi;
        }
    }

    id_the_stv_cached = cacthe[0].id;
    return guitoithe(cacthe[0].id, lenh, them);
}

let mahengio_thongbao = null;
function hienthithongbao(thongdiep, kieu = 'info') {
    const thongbao = document.getElementById('toast');
    if (!thongbao) return;
    let iconSvg = '';
    if (kieu === 'success') iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    if (kieu === 'info') iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    if (kieu === 'warning') iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    thongbao.innerHTML = `${iconSvg} <span>${thongdiep}</span>`;
    thongbao.className = `toast toast-${kieu} show`;
    clearTimeout(mahengio_thongbao);
    mahengio_thongbao = setTimeout(() => thongbao.classList.remove('show'), 2800);
}

function batdaudongho() {
    if (mahengio_dongho) return;
    mahengio_dongho = setInterval(() => { giaydongho++; capnhatdongho(); }, 1000);
}

function tamdungdongho() {
    clearInterval(mahengio_dongho);
    mahengio_dongho = null;
}

function datlaidongho() {
    tamdungdongho();
    giaydongho = 0;
    capnhatdongho();
}

function capnhatdongho() {
    const phut = String(Math.floor(giaydongho / 60)).padStart(2, '0');
    const giay = String(giaydongho % 60).padStart(2, '0');
    document.getElementById('timer-text').textContent = `${phut}:${giay}`;
}

function dattrangthaiphat(dangphat, dangtamdung = false) {
    trangthaicuoi = { isPlaying: dangphat, isPaused: dangtamdung };
    const cham = document.getElementById('status-dot');
    const vanban_trangthai = document.getElementById('status-text');
    const bieu_tuong = document.getElementById('btn-play-icon');
    const vanban_nut = document.getElementById('btn-play-text');
    cham.className = 'status-dot';
    if (dangphat) {
        document.getElementById('interaction-warning').style.display = 'none';
        cham.classList.add('playing');
        vanban_trangthai.textContent = 'Đang đọc...';
        bieu_tuong.innerHTML = SVG_PAUSE;
        vanban_nut.textContent = 'Dừng';
        batdaudongho();
    } else if (dangtamdung) {
        cham.classList.add('paused');
        vanban_trangthai.textContent = 'Đang tạm dừng';
        bieu_tuong.innerHTML = SVG_PLAY;
        vanban_nut.textContent = 'Tiếp tục';
        tamdungdongho();
    } else {
        vanban_trangthai.textContent = 'Sẵn sàng';
        bieu_tuong.innerHTML = SVG_PLAY;
        vanban_nut.textContent = 'Nghe';
        tamdungdongho();
    }
}

function capnhattienhat(tienhat) {
    const o_nhap = document.getElementById('progress-input');
    const tong_so = document.getElementById('progress-total');
    const thanh_dien = document.getElementById('progress-bar-fill');
    const phan_tram = document.getElementById('progress-percent');
    if (tienhat && tienhat.total > 0) {
        if (o_nhap && document.activeElement !== o_nhap) o_nhap.value = tienhat.current;
        if (tong_so) tong_so.textContent = tienhat.total;
        const phantram = Math.round((tienhat.current / tienhat.total) * 100);
        if (thanh_dien) thanh_dien.style.width = phantram + '%';
        if (phan_tram) phan_tram.textContent = phantram + '%';
    } else {
        if (o_nhap && document.activeElement !== o_nhap) o_nhap.value = 0;
        if (tong_so) tong_so.textContent = 0;
        if (thanh_dien) thanh_dien.style.width = '0%';
        if (phan_tram) phan_tram.textContent = '0%';
    }
}

function capnhathuyhieu(congcu) {
    const huyhieu = document.getElementById('tts-badge');
    const vanban_duoitrang = document.getElementById('footer-engine');
    if (!huyhieu) return;
    const mangchuyendoi = {
        web: ['Web TTS', 'var(--success)', 'var(--success)', 'Web Speech API'],
        fpt: ['FPT.AI', 'var(--accent2)', 'var(--accent2)', 'FPT.AI TTS'],
        azure: ['Azure TTS', 'var(--accent)', 'var(--accent)', 'Microsoft Azure'],
    };
    const [nhan, vien, mau, ten_duoitrang] = mangchuyendoi[congcu] || mangchuyendoi.web;
    huyhieu.textContent = nhan;
    huyhieu.style.borderColor = vien;
    huyhieu.style.color = mau;
    if (vanban_duoitrang) {
        vanban_duoitrang.textContent = ten_duoitrang;
        vanban_duoitrang.style.color = mau;
    }
}

async function capnhattrangthai() {
    const phanhoi = await guilenh('getStatus');
    if (!phanhoi || phanhoi.noTab) {
        document.getElementById('book-empty-state').style.display = 'block';
        document.getElementById('book-meta').style.display = 'none';
        document.getElementById('cover-img').style.display = 'none';
        document.querySelector('.controls').style.display = 'none';
        document.querySelector('.status-bar').style.display = 'none';
        dungcapnhat();
        return;
    }
    const { isPlaying, isPaused, progress, ttsEngine, elapsed } = phanhoi;
    if (elapsed !== undefined && Math.abs(giaydongho - elapsed) > 2) {
        giaydongho = elapsed;
        capnhatdongho();
    }
    if (isPlaying !== trangthaicuoi.isPlaying || isPaused !== trangthaicuoi.isPaused) {
        dattrangthaiphat(isPlaying, isPaused);
        if (!isPlaying && !isPaused) datlaidongho();
    }
    if (ttsEngine) capnhathuyhieu(ttsEngine);
    capnhattienhat(progress);
}

function batdaucapnhat() {
    if (mahengio_capnhat) return;
    mahengio_capnhat = setInterval(capnhattrangthai, 1500);
}

function dungcapnhat() {
    clearInterval(mahengio_capnhat);
    mahengio_capnhat = null;
}

chrome.runtime.onMessage.addListener((yeucau) => {
    if (yeucau.action === 'autoplayBlocked') {
        document.getElementById('interaction-warning').style.display = 'block';
        dattrangthaiphat(false);
        datlaidongho();
        capnhattienhat(null);
    }
    if (yeucau.action === 'engineFallback') {
        const tenEngine = yeucau.from === 'fpt' ? 'FPT.AI' : 'Azure';
        hienthithongbao(`${tenEngine} lỗi! Đã tự chuyển sang Web Speech`, 'warning');
        capnhathuyhieu('web');
    }
});

document.getElementById('btn-play').addEventListener('click', async () => {
    document.getElementById('interaction-warning').style.display = 'none';
    const v = document.getElementById('voice-select').value;
    const phanhoi = await guilenh('togglePlay', {
        speed: parseFloat(document.getElementById('speed-slider').value),
        volume: parseFloat(document.getElementById('vol-slider').value),
        voiceIndex: isNaN(v) ? v : parseInt(v)
    });
    if (phanhoi) {
        dattrangthaiphat(phanhoi.isPlaying, phanhoi.isPaused);
    } else {
        hienthithongbao('Không tìm thấy nội dung truyện. Hãy mở trang đọc truyện trước.', 'warning');
    }
});

document.getElementById('btn-stop').addEventListener('click', async () => {
    await guilenh('stopPlay');
    dattrangthaiphat(false);
    datlaidongho();
    capnhattienhat(null);
});

document.getElementById('btn-next').addEventListener('click', async () => {
    await guilenh('nextChap');
    datlaidongho();
    capnhattienhat(null);
    hienthithongbao('Đang chuyển chương sau...', 'info');
});

document.getElementById('btn-prev').addEventListener('click', async () => {
    await guilenh('prevChap');
    datlaidongho();
    capnhattienhat(null);
    hienthithongbao('Đang chuyển chương trước...', 'info');
});

document.getElementById('btn-prev-chunk').addEventListener('click', async () => {
    await guilenh('prevChunk');
    capnhattrangthai();
});

document.getElementById('btn-next-chunk').addEventListener('click', async () => {
    await guilenh('nextChunk');
    capnhattrangthai();
});

document.getElementById('progress-input').addEventListener('change', async (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    const tong_so = parseInt(document.getElementById('progress-total').textContent) || 1;
    if (val > tong_so) val = tong_so;
    await guilenh('jumpToChunk', { value: val });
    capnhattrangthai();
});

document.getElementById('btn-replay').addEventListener('click', async () => {
    document.getElementById('interaction-warning').style.display = 'none';
    const v = document.getElementById('voice-select').value;
    const phanhoi = await guilenh('replayChap', {
        speed: parseFloat(document.getElementById('speed-slider').value),
        volume: parseFloat(document.getElementById('vol-slider').value),
        voiceIndex: isNaN(v) ? v : parseInt(v)
    });
    datlaidongho();
    if (phanhoi) dattrangthaiphat(true);
    hienthithongbao('Đọc lại chương này', 'info');
});

const chk_tudongchuong = document.getElementById('chk-autonext');
chrome.storage.sync.get('autoNext', d => {
    const gia_tri = d.autoNext !== undefined ? d.autoNext : true;
    chk_tudongchuong.checked = gia_tri;
    guilenh('setAuto', { value: gia_tri });
});
chk_tudongchuong.addEventListener('change', e => {
    const gia_tri = e.target.checked;
    guilenh('setAuto', { value: gia_tri });
    chrome.storage.sync.set({ autoNext: gia_tri });
});

const thanh_truot_toc_do = document.getElementById('speed-slider');
const van_ban_toc_do = document.getElementById('speed-val');
thanh_truot_toc_do.addEventListener('input', () => {
    const v = parseFloat(thanh_truot_toc_do.value).toFixed(1);
    van_ban_toc_do.textContent = `${v}×`;
    guilenh('setSpeed', { value: parseFloat(v) });
    chrome.storage.sync.set({ speed: parseFloat(v) });
});

const thanh_truot_am_luong = document.getElementById('vol-slider');
const van_ban_am_luong = document.getElementById('vol-val');
thanh_truot_am_luong.addEventListener('input', () => {
    const v = parseFloat(thanh_truot_am_luong.value);
    van_ban_am_luong.textContent = `${Math.round(v * 100)}%`;
    guilenh('setVolume', { value: v });
    chrome.storage.sync.set({ volume: v });
});

document.getElementById('btn-mute').addEventListener('click', () => {
    const am_luong = parseFloat(thanh_truot_am_luong.value);
    const bieu_tuong_tat_am = document.getElementById('mute-icon');
    if (am_luong > 0) {
        amluongtruoc = am_luong;
        thanh_truot_am_luong.value = 0;
        bieu_tuong_tat_am.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
    } else {
        thanh_truot_am_luong.value = amluongtruoc || 1.0;
        bieu_tuong_tat_am.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>';
    }
    thanh_truot_am_luong.dispatchEvent(new Event('input'));
});

async function taicacgiong() {
    const congcu_hientai = document.getElementById('engine-select').value;
    const goiy_giong = document.getElementById('voice-hint');
    if (congcu_hientai !== 'web' && congcu_hientai !== 'auto') {
        if (goiy_giong) goiy_giong.style.display = 'none';
        return;
    }
    const phanhoi = await guilenh('getVoices');
    if (!phanhoi || !phanhoi.voices) return;

    const o_chon_giong = document.getElementById('voice-select');
    o_chon_giong.innerHTML = '';
    const giong_viet = phanhoi.voices.filter(v => v.lang && v.lang.startsWith('vi'));

    let chiso_hoaimy = -1;
    let chiso_dautien = -1;

    if (giong_viet.length > 0) {
        giong_viet.forEach((v, idx) => {
            const opt = document.createElement('option');
            opt.value = v.name;
            let ten_ngan = v.name.replace(/\s*-\s*Vietnamese\s*\(Vietnam\)/gi, '').replace(/\s*Online\s*\(Natural\)/gi, '').replace(/Microsoft/gi, 'MS').replace(/Google/gi, 'GG').trim();
            opt.textContent = ten_ngan;
            o_chon_giong.appendChild(opt);
            if (ten_ngan.includes('Hoài My')) chiso_hoaimy = v.name;
            if (idx === 0) chiso_dautien = v.name;
        });
    }
    if (goiy_giong) goiy_giong.style.display = giong_viet.length > 0 ? 'none' : 'block';

    chrome.storage.local.get('voiceIndex', d => {
        let muctieu = d.voiceIndex;
        if (muctieu === undefined || muctieu === -1) {
            muctieu = (chiso_hoaimy !== -1) ? chiso_hoaimy : chiso_dautien;
        }
        let cogiati = false;
        for (let i = 0; i < o_chon_giong.options.length; i++) {
            if (o_chon_giong.options[i].value == muctieu) {
                o_chon_giong.selectedIndex = i;
                cogiati = true;
                break;
            }
        }
        if (!cogiati && o_chon_giong.options.length > 0) {
            o_chon_giong.selectedIndex = 0;
            muctieu = o_chon_giong.options[0].value;
        }
        const opt = o_chon_giong.options[o_chon_giong.selectedIndex];
        if (opt) {
            document.getElementById('info-voice').textContent = opt.textContent;
            chrome.storage.sync.set({ lastVoiceName: opt.textContent });
            if (d.voiceIndex != muctieu && muctieu !== -1) {
                chrome.storage.local.set({ voiceIndex: muctieu });
                guilenh('setVoice', { value: muctieu });
            }
        }
        hienthiochontuychinh();
    });
}

document.getElementById('voice-select').addEventListener('change', e => {
    const val = e.target.value;
    const idx = isNaN(val) ? val : parseInt(val);
    const opt = e.target.options[e.target.selectedIndex];
    const text = opt?.textContent || 'Mặc định';

    guilenh('setVoice', { value: idx });
    chrome.storage.sync.set({ voiceIndex: idx, lastVoiceName: text });

    document.getElementById('info-voice').textContent = text;
});

document.getElementById('engine-select').addEventListener('change', async (e) => {
    const congcu = e.target.value;
    const o_api = document.getElementById('api-settings-box');
    const input_region = document.getElementById('api-region-input');
    const input_key = document.getElementById('api-key-input');

    const can_key = ['fpt', 'azure'].includes(congcu);
    o_api.style.display = can_key ? 'block' : 'none';
    input_region.style.display = congcu === 'azure' ? 'block' : 'none';

    const placeholder_map = { fpt: 'Nhập FPT.AI API Key...', azure: 'Nhập Azure Subscription Key...' };
    if (placeholder_map[congcu]) input_key.placeholder = placeholder_map[congcu];

    await guilenh('setEngine', { value: congcu });

    if (!['fpt', 'azure'].includes(congcu)) {
        chrome.storage.sync.set({ maydoc: congcu });
    }
    capnhathuyhieu(congcu);

    const o_chon_giong = document.getElementById('voice-select');
    const goiy_giong = document.getElementById('voice-hint');
    o_chon_giong.disabled = false;

    if (congcu === 'web' || congcu === 'auto') {
        taicacgiong();
    } else {
        if (congcu === 'fpt') {
            o_chon_giong.innerHTML = `
                <option value="0">Ban Mai (Nữ Bắc)</option>
                <option value="1">Lê Minh (Nam Bắc)</option>
                <option value="2">Thu Minh (Nữ Bắc)</option>
                <option value="3">Mỹ An (Nữ Trung)</option>
                <option value="4">Gia Huy (Nam Trung)</option>
                <option value="5">Lan Nhi (Nữ Nam)</option>
                <option value="6">Linh San (Nữ Nam)</option>
            `;
        } else if (congcu === 'azure') {
            o_chon_giong.innerHTML = `
                <option value="0">Hoài My (Nữ)</option>
                <option value="1">Nam Minh (Nam)</option>
            `;
        }
        if (goiy_giong) goiy_giong.style.display = 'none';

        o_chon_giong.selectedIndex = 0;
        const chonGiong = parseInt(o_chon_giong.value) || 0;

        document.getElementById('info-voice').textContent = o_chon_giong.options[0].textContent;

        hienthiochontuychinh();

        chrome.storage.sync.set({ voiceIndex: chonGiong });
        guilenh('setVoice', { value: chonGiong });
    }

    if (can_key) {
        chrome.storage.local.get([`${congcu}_key`, 'azure_region'], d => {
            input_key.value = d[`${congcu}_key`] || '';
            if (congcu === 'azure') input_region.value = d.azure_region || '';
        });
    }
});

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const targetPanel = document.getElementById(`panel-${tab.dataset.tab}`);
        const isAlreadyActive = targetPanel && targetPanel.classList.contains('active');
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        if (isAlreadyActive && tab.dataset.tab !== 'main') {
            document.getElementById('panel-main').classList.add('active');

            chrome.storage.sync.get('maydoc', d => {
                const engineDaLuu = d.maydoc || 'web';
                const engineSelect = document.getElementById('engine-select');
                if (engineSelect.value !== engineDaLuu) {
                    engineSelect.value = engineDaLuu;
                    engineSelect.dispatchEvent(new Event('change'));
                }
                capnhathuyhieu(engineDaLuu);
            });
        } else {
            tab.classList.add('active');
            if (targetPanel) targetPanel.classList.add('active');


            if (tab.dataset.tab === 'settings') {
                chrome.storage.sync.get('maydoc', d => {
                    const engineSelect = document.getElementById('engine-select');
                    const engineDaLuu = d.maydoc || 'web';
                    if (engineSelect.value !== engineDaLuu) {
                        engineSelect.value = engineDaLuu;
                        engineSelect.dispatchEvent(new Event('change'));
                    } else {

                        const can_key = ['fpt', 'azure'].includes(engineDaLuu);
                        if (can_key) {
                            chrome.storage.local.get([`${engineDaLuu}_key`, 'azure_region'], d2 => {
                                document.getElementById('api-key-input').value = d2[`${engineDaLuu}_key`] || '';
                                if (engineDaLuu === 'azure') {
                                    document.getElementById('api-region-input').value = d2.azure_region || '';
                                }
                            });
                        }
                    }
                });
            }


            if (tab.dataset.tab === 'main') {
                chrome.storage.sync.get('maydoc', d => {
                    const engineDaLuu = d.maydoc || 'web';
                    const engineSelect = document.getElementById('engine-select');
                    if (engineSelect.value !== engineDaLuu) {
                        engineSelect.value = engineDaLuu;
                        engineSelect.dispatchEvent(new Event('change'));
                    }
                    capnhathuyhieu(engineDaLuu);
                });
            }
        }
    });
});

async function taidanhsachdoc() {
    chrome.storage.local.get('readingList', d => {
        danhsachdochientai = d.readingList || [];
        hienthidanhsachdoc(danhsachdochientai);
        document.getElementById('info-count').textContent = `${danhsachdochientai.length} truyện`;
    });
}

function thoathtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

document.getElementById('list-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
        hienthidanhsachdoc(danhsachdochientai);
    } else {
        const loc = danhsachdochientai.filter(i =>
            i.title.toLowerCase().includes(q) || (i.chap && i.chap.toLowerCase().includes(q))
        );
        hienthidanhsachdoc(loc);
    }
});

function hienthidanhsachdoc(danh_sach) {
    const vung_danh_sach = document.getElementById('list-container');
    if (!danh_sach.length) {
        vung_danh_sach.innerHTML = '<div class="list-empty">Chưa có truyện nào được lưu.<br><small style="color:#555">Nhấn <strong style="color:var(--accent)">Lưu</strong> để thêm truyện đang mở.</small></div>';
        return;
    }
    vung_danh_sach.innerHTML = danh_sach.map((m, i) => `
        <div class="list-item" data-title="${thoathtml(m.title)}" title="Nhấn để mở truyện này">
            <img class="list-thumb" src="${m.imgUrl || FALLBACK_COVER}" alt="">
            <div class="list-info">
                <div class="list-name">${thoathtml(m.title)}</div>
                <div class="list-chap">
                    ${thoathtml(m.chap || 'Chưa xác định chương')}
                    <span style="color:var(--accent); font-weight: 500;">
                        ${m.chunkIndex && m.chunkTotal ? `(Đoạn ${m.chunkIndex}/${m.chunkTotal})` : ''}
                    </span>
                </div>
                ${m.url ? '<div class="list-date" style="font-size:9px;color:#555;margin-top:1px">Nhấn để tiếp tục đọc</div>' : ''}
            </div>
            <button class="btn-remove" data-title="${thoathtml(m.title)}" title="Xoá khỏi danh sách">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
    `).join('');

    vung_danh_sach.querySelectorAll('.list-thumb').forEach(img => {
        img.addEventListener('error', function () { this.src = FALLBACK_COVER; }, { once: true });
        if (img.complete && img.naturalHeight === 0) img.src = FALLBACK_COVER;
    });

    vung_danh_sach.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            xoakhoidanhsach(btn.dataset.title);
        });
    });

    vung_danh_sach.querySelectorAll('.list-item').forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            const title = item.dataset.title;
            chrome.storage.local.get('readingList', data => {
                const entry = (data.readingList || []).find(e => (e.title || '').trim().toLowerCase() === (title || '').trim().toLowerCase());
                if (entry?.url) chrome.tabs.create({ url: entry.url });
                else hienthithongbao('URL không được lưu cho truyện này', 'warning');
            });
        });
    });
}

function xoakhoidanhsach(title) {
    chrome.storage.local.get('readingList', data => {
        const danh_sach = data.readingList || [];
        const vitri = danh_sach.findIndex(i => (i.title || '').trim().toLowerCase() === (title || '').trim().toLowerCase()); if (vitri === -1) return;
        danh_sach.splice(vitri, 1);
        chrome.storage.local.set({ readingList: danh_sach }, () => {
            danhsachdochientai = danh_sach;
            hienthidanhsachdoc(danh_sach);
            document.getElementById('info-count').textContent = `${danh_sach.length} truyện`;
            if (dulieutruyenhientai) {
                const van_luu = danh_sach.some(i => (i.title || '').trim().toLowerCase() === (dulieutruyenhientai.bookTitle || '').trim().toLowerCase());
                dattrangthailuu(van_luu);
            }
        });
    });
}

function dattrangthailuu(da_luu) {
    const nut = document.getElementById('btn-save');
    const bieu_tuong = document.getElementById('save-icon');
    const van_ban = document.getElementById('save-text');
    nut.className = `btn-save${da_luu ? ' saved' : ''}`;
    bieu_tuong.innerHTML = da_luu ? SVG_BOOKMARK_CHK : SVG_BOOKMARK;
    van_ban.textContent = da_luu ? 'Đã lưu' : 'Lưu';
}

document.getElementById('btn-save').addEventListener('click', () => {
    if (!dulieutruyenhientai) { hienthithongbao('Không có truyện nào đang mở', 'warning'); return; }
    chrome.storage.local.get('readingList', data => {
        const danh_sach = data.readingList || [];
        const vitri = danh_sach.findIndex(i => (i.title || '').trim().toLowerCase() === (dulieutruyenhientai.bookTitle || '').trim().toLowerCase()); if (vitri !== -1) {
            danh_sach.splice(vitri, 1);
            chrome.storage.local.set({ readingList: danh_sach }, () => {
                danhsachdochientai = danh_sach;
                hienthidanhsachdoc(danh_sach);
                dattrangthailuu(false);
                document.getElementById('info-count').textContent = `${danh_sach.length} truyện`;
                hienthithongbao('Đã bỏ lưu truyện', 'info');
            });
        } else {
            danh_sach.push({
                title: dulieutruyenhientai.bookTitle,
                chap: dulieutruyenhientai.chapTitle,
                imgUrl: dulieutruyenhientai.imgUrl,
                url: dulieutruyenhientai.pageUrl,
                chunkIndex: dulieutruyenhientai.progress ? dulieutruyenhientai.progress.current : null,
                chunkTotal: dulieutruyenhientai.progress ? dulieutruyenhientai.progress.total : null,
                savedAt: new Date().toLocaleDateString('vi-VN')
            });
            chrome.storage.local.set({ readingList: danh_sach }, () => {
                danhsachdochientai = danh_sach;
                hienthidanhsachdoc(danh_sach);
                dattrangthailuu(true);
                document.getElementById('info-count').textContent = `${danh_sach.length} truyện`;
                hienthithongbao('Đã lưu truyện thành công!', 'success');
            });
        }
    });
});

document.getElementById('btn-clear-all').addEventListener('click', () => {
    const modal = document.getElementById('confirm-modal');
    document.getElementById('modal-title').textContent = 'Xoá tất cả dữ liệu';
    document.getElementById('modal-body').textContent = 'Thao tác này sẽ xoá TẤT CẢ dữ liệu: danh sách đọc, API Key, cài đặt tốc độ, âm lượng, giọng đọc... Bạn có chắc chắn?';
    modal.classList.add('show');

    const onConfirm = () => {
        chrome.storage.local.clear(() => {
            danhsachdochientai = [];
            hienthidanhsachdoc([]);
            document.getElementById('info-count').textContent = '0 truyện';
            dattrangthailuu(false);

            document.getElementById('speed-slider').value = 1.0;
            document.getElementById('speed-val').textContent = '1.0×';
            document.getElementById('vol-slider').value = 1;
            document.getElementById('vol-val').textContent = '100%';

            const engineSelect = document.getElementById('engine-select');
            engineSelect.value = 'web';
            engineSelect.dispatchEvent(new Event('change'));

            document.getElementById('api-settings-box').style.display = 'none';
            document.getElementById('api-key-input').value = '';
            document.getElementById('api-region-input').value = '';

            const voiceSelect = document.getElementById('voice-select');
            voiceSelect.innerHTML = '<option value="-1">Giọng mặc định</option>';
            voiceSelect.dispatchEvent(new Event('change'));

            const autoStopSelect = document.getElementById('select-auto-stop');
            autoStopSelect.value = 'off';
            autoStopSelect.dispatchEvent(new Event('change'));

            const vanban_autostop = document.getElementById('custom-autostop-text');
            if (vanban_autostop) vanban_autostop.textContent = 'Không có';

            const _resetNow = new Date();
            gio_val_vt = _resetNow.getHours();
            phut_val_vt = _resetNow.getMinutes();
            capnhat_gia_tri_vt('hour', gio_val_vt);
            capnhat_gia_tri_vt('minute', phut_val_vt);

            antatcanhom_tudongdung();

            capnhathuyhieu('web');
            guilenh('stopPlay');
            hienthithongbao('Đã xoá toàn bộ dữ liệu tiện ích', 'info');
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

document.getElementById('btn-save-api').addEventListener('click', async () => {
    const congcu = document.getElementById('engine-select').value;
    const key = document.getElementById('api-key-input').value.trim();
    const region = document.getElementById('api-region-input').value.trim();
    if (!key) { hienthithongbao('Vui lòng nhập API Key', 'warning'); return; }

    const icon = document.getElementById('btn-save-api-icon');
    const textLabel = document.getElementById('btn-save-api-text');
    const nut = document.getElementById('btn-save-api');

    const luuKey = () => {
        const du_lieu = { [`${congcu}_key`]: key };
        if (congcu === 'azure') du_lieu['azure_region'] = region || 'southeastasia';
        chrome.storage.local.set(du_lieu, () => {
            guilenh('setApiKeys', du_lieu);
        });
    };

    nut.disabled = true;
    icon.innerHTML = `<line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>`;
    textLabel.textContent = 'Đang kiểm tra...';

    try {
        let thanhcong = false;
        if (congcu === 'fpt') {
            const r = await fetch('https://api.fpt.ai/hmi/tts/v5', {
                method: 'POST', headers: { 'api-key': key }, body: 'Kiểm tra'
            });
            thanhcong = r.ok;
        } else if (congcu === 'azure') {
            const regionVal = region || 'southeastasia';
            const r = await fetch(`https://${regionVal}.tts.speech.microsoft.com/cognitiveservices/v1`, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': key,
                    'Content-Type': 'application/ssml+xml',
                    'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
                },
                body: `<speak version='1.0' xml:lang='vi-VN'><voice xml:lang='vi-VN' name='vi-VN-HoaiMyNeural'>Kiểm tra</voice></speak>`
            });
            thanhcong = r.ok;
        }

        if (thanhcong) {
            luuKey();
            chrome.storage.sync.set({ maydoc: congcu });
            icon.innerHTML = SVG_CHECK;
            textLabel.textContent = 'Đã lưu!';
            hienthithongbao('API Key hợp lệ, đã lưu!', 'success');
            setTimeout(() => { icon.innerHTML = SVG_SAVE; textLabel.textContent = 'Lưu API Key'; }, 2000);
        } else {
            document.getElementById('api-key-input').value = '';
            icon.innerHTML = SVG_SAVE;
            textLabel.textContent = 'Lưu API Key';
            hienthithongbao('API Key không hợp lệ! Đã trở về nguồn đọc cũ.', 'warning');
            chrome.storage.sync.get('maydoc', d => {
                const engineCu = d.maydoc || 'web';
                const engineSelect = document.getElementById('engine-select');
                if (engineSelect.value !== engineCu) {
                    engineSelect.value = engineCu;
                    engineSelect.dispatchEvent(new Event('change'));
                } else {
                    guilenh('setEngine', { value: engineCu });
                    capnhathuyhieu(engineCu);
                }
            });
        }
    } catch (e) {

        luuKey();
        chrome.storage.sync.set({ maydoc: congcu });
        icon.innerHTML = SVG_CHECK;
        textLabel.textContent = 'Đã lưu!';
        hienthithongbao('Không thể xác minh (lỗi mạng), đã lưu key.', 'info');
        setTimeout(() => { icon.innerHTML = SVG_SAVE; textLabel.textContent = 'Lưu API Key'; }, 2000);
    } finally {
        nut.disabled = false;
    }
});

document.getElementById('btn-test-api').addEventListener('click', async () => {
    const congcu = document.getElementById('engine-select').value;
    const key = document.getElementById('api-key-input').value.trim();
    if (!key) { hienthithongbao('Vui lòng nhập API Key để thử', 'warning'); return; }

    const nut = document.getElementById('btn-test-api');
    const chu_cu = nut.textContent;
    nut.disabled = true;
    nut.textContent = 'Đang thử...';

    try {
        let thanhcong = false;
        if (congcu === 'fpt') {
            const r = await fetch('https://api.fpt.ai/hmi/tts/v5', {
                method: 'POST', headers: { 'api-key': key }, body: 'Kiểm tra'
            });
            thanhcong = r.ok;
        } else if (congcu === 'azure') {
            const region = document.getElementById('api-region-input').value.trim() || 'southeastasia';
            if (!document.getElementById('api-region-input').value.trim()) {
                hienthithongbao('Region trống, sử dụng mặc định: southeastasia', 'info');
            }
            const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
                method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3' },
                body: `<speak version='1.0' xml:lang='vi-VN'><voice xml:lang='vi-VN' name='vi-VN-HoaiMyNeural'>Kiểm tra</voice></speak>`
            });
            thanhcong = r.ok;
        }
        if (thanhcong) hienthithongbao('API Key hoạt động tốt!', 'success');
        else hienthithongbao('API Key không hợp lệ hoặc hết hạn', 'warning');
    } catch (e) {
        hienthithongbao('Lỗi kết nối API', 'warning');
    } finally {
        nut.disabled = false;
        nut.textContent = chu_cu;
    }
});

const chon_tudongdung = document.getElementById('select-auto-stop');
const nhom_thoigiandung = document.getElementById('group-stop-time');
const nhom_sochuongdung = document.getElementById('group-stop-chapters');
const nhom_thoigianthuc = document.getElementById('group-stop-realtime');
const nhom_tuychinhrieng = document.getElementById('group-stop-custom');

function antatcanhom_tudongdung() {
    [nhom_thoigiandung, nhom_sochuongdung, nhom_thoigianthuc, nhom_tuychinhrieng].forEach(n => { if (n) n.style.display = 'none'; });
}

chon_tudongdung.addEventListener('change', e => {
    const v = e.target.value;
    antatcanhom_tudongdung();
    if (v === 'time' && nhom_thoigiandung) nhom_thoigiandung.style.display = 'flex';
    else if (v === 'chapters' && nhom_sochuongdung) nhom_sochuongdung.style.display = 'flex';
    else if (v === 'realtime' && nhom_thoigianthuc) {
        nhom_thoigianthuc.style.display = 'flex';
        chrome.storage.local.get('stopRealtimeTarget', d => {
            if (!d.stopRealtimeTarget) {
                const _nowSwitch = new Date();
                gio_val_vt = _nowSwitch.getHours();
                phut_val_vt = _nowSwitch.getMinutes();
                capnhat_gia_tri_vt('hour', gio_val_vt);
                capnhat_gia_tri_vt('minute', phut_val_vt);
            }
        });
    }
    else if (v === 'custom' && nhom_tuychinhrieng) nhom_tuychinhrieng.style.display = 'flex';
    else if (v === 'off') {
        guilenh('setSleepTimer', { minutes: 0 });
        guilenh('setStopChapters', { count: 0 });
        guilenh('setCustomStop', { config: null });
        chrome.storage.local.remove(['stopTime', 'stopChapters', 'sleepTargetTimestamp', 'stopRealtimeTarget', 'customStopConfig', 'stopAfterChapters']);
        hienthithongbao('Đã tắt tự động dừng', 'info');
    }
});

document.getElementById('btn-apply-stop-time').addEventListener('click', () => {
    const gio = parseInt(document.getElementById('input-stop-hours').value) || 0;
    const phut = parseInt(document.getElementById('input-stop-minutes').value) || 0;
    const tongphut = gio * 60 + phut;
    if (tongphut <= 0) { hienthithongbao('Vui lòng nhập thời gian lớn hơn 0', 'warning'); return; }

    chrome.storage.local.remove(['stopRealtimeTarget', 'stopAfterChapters', 'customStopConfig'], () => {
        guilenh('setSleepTimer', { minutes: tongphut });
        guilenh('setStopChapters', { count: 0 });
        chrome.storage.local.set({ stopTime: tongphut });
        const mota = gio > 0 ? `${gio}g${phut > 0 ? ` ${phut}p` : ''}` : `${phut} phút`;
        hienthithongbao(`Sẽ dừng sau ${mota}`, 'success');
    });
});

let isAddSign = true;
const btnToggleSign = document.getElementById('btn-toggle-sign');

if (btnToggleSign) {
    btnToggleSign.addEventListener('click', () => {
        isAddSign = !isAddSign;
        btnToggleSign.textContent = isAddSign ? '+' : '-';
        btnToggleSign.style.color = isAddSign ? 'var(--accent)' : 'var(--danger)';
        btnToggleSign.style.borderColor = isAddSign ? 'var(--accent)' : 'var(--danger)';
    });
}

document.querySelectorAll('.preset-time').forEach(btn => {
    btn.addEventListener('click', () => {
        const luongThoiGian = parseInt(btn.dataset.min) || 0;
        let gio = parseInt(document.getElementById('input-stop-hours').value) || 0;
        let phut = parseInt(document.getElementById('input-stop-minutes').value) || 0;

        let tongPhut = gio * 60 + phut;

        if (isAddSign) {
            tongPhut += luongThoiGian;
        } else {
            tongPhut -= luongThoiGian;
            if (tongPhut < 0) tongPhut = 0;
        }

        gio = Math.floor(tongPhut / 60);
        phut = tongPhut % 60;

        document.getElementById('input-stop-hours').value = gio;
        document.getElementById('input-stop-minutes').value = phut;
    });
});

document.getElementById('btn-apply-stop-realtime').addEventListener('click', () => {
    const h24 = gio_val_vt;
    const m = phut_val_vt;
    const giotruc = `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const baygio = new Date(), muctieu = new Date();
    muctieu.setHours(h24, m, 0, 0);
    if (muctieu <= baygio) muctieu.setDate(muctieu.getDate() + 1);
    const tongphut = Math.ceil((muctieu - baygio) / 60000);

    chrome.storage.local.remove(['stopTime', 'stopAfterChapters', 'customStopConfig'], () => {
        guilenh('setSleepTimer', { minutes: tongphut });
        guilenh('setStopChapters', { count: 0 });
        chrome.storage.local.set({ stopRealtimeTarget: giotruc, stopTime: tongphut });
        hienthithongbao(`Sẽ dừng lúc ${giotruc}`, 'success');
    });
});

document.getElementById('btn-apply-stop-chapters').addEventListener('click', () => {
    const so_chuong = parseInt(document.getElementById('input-stop-chapters').value);
    if (isNaN(so_chuong) || so_chuong <= 0) return;

    chrome.storage.local.remove(['stopTime', 'stopRealtimeTarget', 'customStopConfig'], () => {
        guilenh('setSleepTimer', { minutes: 0 });
        guilenh('setStopChapters', { count: so_chuong });
        chrome.storage.local.set({ stopAfterChapters: so_chuong });
        hienthithongbao(`Sẽ dừng sau ${so_chuong} chương nữa`, 'success');
    });
});

function taoinput_dieukien(container_id, kieu) {
    const container = document.getElementById(container_id);
    if (!container) return;
    container.innerHTML = '';
    if (kieu === 'time') {
        container.innerHTML = `<input type="number" value="0" min="0" style="width:34px;" class="auto-stop-input cc-hours"><span class="auto-stop-unit">giờ</span><input type="number" value="30" min="0" max="59" style="width:34px;" class="auto-stop-input cc-minutes"><span class="auto-stop-unit">phút</span>`;
    } else if (kieu === 'realtime') {
        container.innerHTML = `<input type="time" id="select-realtime-picker" class="auto-stop-input cc-time" style="width:70px; padding: 2px 4px; border: 1px solid var(--border); border-radius: 4px; background: var(--surface); color: var(--accent); outline: none;">`;
    } else if (kieu === 'chapters') {
        container.innerHTML = `<input type="number" value="1" min="1" style="width:46px;" class="auto-stop-input cc-chapters"><span class="auto-stop-unit">chương</span>`;
    }
}

document.getElementById('custom-left-type').addEventListener('change', e => taoinput_dieukien('custom-left-input', e.target.value));
document.getElementById('custom-right-type').addEventListener('change', e => taoinput_dieukien('custom-right-input', e.target.value));

function docgiatri_dieukien(prefix) {
    const kieu = document.getElementById(`custom-${prefix}-type`).value;
    const container = document.getElementById(`custom-${prefix}-input`);
    if (!kieu || !container) return null;

    if (kieu === 'time') {
        const gio = parseInt(container.querySelector('.cc-hours')?.value) || 0;
        const phut = parseInt(container.querySelector('.cc-minutes')?.value) || 0;
        const total = gio * 60 + phut;
        return total > 0 ? { type: 'time', minutes: total } : null;
    } else if (kieu === 'realtime') {
        const val = container.querySelector('.cc-time')?.value;
        if (!val) return null;

        const [h, m] = val.split(':').map(Number);
        const target = new Date();
        target.setHours(h, m, 0, 0);
        if (target <= new Date()) target.setDate(target.getDate() + 1);

        const totalMins = Math.ceil((target - new Date()) / 60000);
        return { type: 'realtime', displayTime: val, minutes: totalMins };
    } else if (kieu === 'chapters') {
        const c = parseInt(container.querySelector('.cc-chapters')?.value);
        return c > 0 ? { type: 'chapters', count: c } : null;
    }
    return null;
}

document.getElementById('btn-apply-stop-custom').addEventListener('click', () => {
    const trai = docgiatri_dieukien('left');
    const phai = docgiatri_dieukien('right');
    const op = document.getElementById('custom-operator').value;

    if (!trai && !phai) { hienthithongbao('Vui lòng chọn ít nhất một điều kiện hợp lệ', 'warning'); return; }

    if (trai && phai && trai.type === phai.type) {
        hienthithongbao('Vui lòng chọn 2 điều kiện khác loại nhau', 'warning');
        return;
    }

    const config = { operator: op, left: trai, right: phai };
    chrome.storage.local.remove(['stopTime', 'stopRealtimeTarget', 'stopAfterChapters'], () => {
        guilenh('setCustomStop', { config });
        const cac_dk = [trai, phai].filter(Boolean);
        const dk_time = cac_dk.find(c => c.type === 'time' || c.type === 'realtime');
        const dk_chuong = cac_dk.find(c => c.type === 'chapters');

        if (dk_time) guilenh('setSleepTimer', { minutes: dk_time.minutes });
        else guilenh('setSleepTimer', { minutes: 0 });
        if (dk_chuong) guilenh('setStopChapters', { count: dk_chuong.count });
        else guilenh('setStopChapters', { count: 0 });

        const mota = cac_dk.map(c => {
            if (c.type === 'time') { const g = Math.floor(c.minutes / 60), p = c.minutes % 60; return g > 0 ? `${g}g${p > 0 ? ` ${p}p` : ''}` : `${p}p`; }
            if (c.type === 'realtime') return `lúc ${c.displayTime}`;
            if (c.type === 'chapters') return `${c.count} chương`;
            return '';
        }).join(op === 'and' ? ' VÀ ' : ' HOẶC ');

        hienthithongbao(`Sẽ dừng: ${mota}`, 'success');
        chrome.storage.local.set({ customStopConfig: config });
    });
});

const coverImg = document.getElementById('cover-img');
coverImg.onerror = () => { coverImg.onerror = null; coverImg.src = FALLBACK_COVER; };

async function khoitaopopup() {
    document.getElementById('version-badge').textContent = 'v' + chrome.runtime.getManifest().version;

    const [the_danghoatdong] = await chrome.tabs.query({ active: true, currentWindow: true });
    const dang_o_trang_chu = the_danghoatdong && the_danghoatdong.url && the_danghoatdong.url.includes('sangtacviet.com') && !the_danghoatdong.url.includes('/truyen/');
    const cacthe = await chrome.tabs.query({ url: "*://*.sangtacviet.com/*" });
    const co_the_stv = cacthe.length > 0;

    if (!co_the_stv) {
        chrome.storage.local.remove('last_active_state');
        document.getElementById('status-text').innerHTML = `${svgCpt} Mở trang STV trước`;
        document.getElementById('current-title').textContent = 'Chưa mở trang sangtacviet.com';
        document.getElementById('current-chap').textContent = '—';
        document.getElementById('cover-img').style.display = 'none';
        document.getElementById('book-empty-state').style.display = 'block';
        document.getElementById('book-meta').style.display = 'none';
        document.querySelector('.controls').style.display = 'none';
        document.querySelector('.status-bar').style.display = 'none';
    } else {
        chrome.storage.local.get(['last_active_state'], d => {
            if (d.last_active_state && !dang_o_trang_chu) {
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
                capnhattienhat(s.progress);
                dattrangthaiphat(s.isPlaying, s.isPaused);
                if (s.ttsEngine) capnhathuyhieu(s.ttsEngine);
            }
        });
    }

    chrome.storage.sync.get([
        'speed', 'volume', 'voiceIndex', 'maydoc',
        'batphimtat', 'doctentruyen', 'doctenchuong', 'lastVoiceName'
    ], d => {
        if (d.lastVoiceName) {
            const voiceTextEl = document.getElementById('custom-voice-text');
            if (voiceTextEl) voiceTextEl.textContent = d.lastVoiceName;
            const infoVoiceEl = document.getElementById('info-voice');
            if (infoVoiceEl) infoVoiceEl.textContent = d.lastVoiceName;
        }

        if (d.speed !== undefined) { thanh_truot_toc_do.value = d.speed; van_ban_toc_do.textContent = `${parseFloat(d.speed).toFixed(1)}×`; }
        if (d.volume !== undefined) { thanh_truot_am_luong.value = d.volume; van_ban_am_luong.textContent = `${Math.round(d.volume * 100)}%`; }
        const o_chon_may_doc = document.getElementById('engine-select');
        if (d.maydoc) {
            o_chon_may_doc.value = d.maydoc;
            setTimeout(() => o_chon_may_doc.dispatchEvent(new Event('change')), 350);
        }
        if (d.batphimtat !== undefined) document.getElementById('chk-shortcuts').checked = d.batphimtat;
        if (d.doctentruyen !== undefined) document.getElementById('chk-read-book').checked = d.doctentruyen;
        if (d.doctenchuong !== undefined) document.getElementById('chk-read-chap').checked = d.doctenchuong;

        chrome.storage.local.get(['stopTime', 'stopAfterChapters', 'sleepTargetTimestamp', 'stopRealtimeTarget', 'customStopConfig'], data => {
            antatcanhom_tudongdung();
            if (data.customStopConfig) {
                chon_tudongdung.value = 'custom';
                if (nhom_tuychinhrieng) nhom_tuychinhrieng.style.display = 'flex';
            } else if (data.stopRealtimeTarget) {
                chon_tudongdung.value = 'realtime';
                if (nhom_thoigianthuc) {
                    nhom_thoigianthuc.style.display = 'flex';
                    const [h, m] = data.stopRealtimeTarget.split(':');
                    if (typeof capnhat_gia_tri_vt === 'function') {
                        capnhat_gia_tri_vt('hour', parseInt(h));
                        capnhat_gia_tri_vt('minute', parseInt(m));
                    }
                }
            } else if (data.sleepTargetTimestamp || data.stopTime) {
                chon_tudongdung.value = 'time';
                if (nhom_thoigiandung) nhom_thoigiandung.style.display = 'flex';
                if (data.stopTime) {
                    const h = Math.floor(data.stopTime / 60), m = data.stopTime % 60;
                    document.getElementById('input-stop-hours').value = h;
                    document.getElementById('input-stop-minutes').value = m;
                }
            } else if (data.stopAfterChapters) {
                chon_tudongdung.value = 'chapters';
                if (nhom_sochuongdung) { nhom_sochuongdung.style.display = 'flex'; document.getElementById('input-stop-chapters').value = data.stopAfterChapters; }
            }
            const opt = chon_tudongdung.options[chon_tudongdung.selectedIndex];
            const vanban_text = document.getElementById('custom-autostop-text');
            if (opt && vanban_text) vanban_text.textContent = opt.textContent;
        });
    });

    if (!co_the_stv) return;

    let phanhoi = await guilenh('getInfo');
    const o_trong = document.getElementById('book-empty-state');
    const thongtin_truyen = document.getElementById('book-meta');
    const nut_mo_stv = document.getElementById('btn-open-stv');

    if (!phanhoi || phanhoi.noTab) {
        const [the_danghoatdong] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (the_danghoatdong && the_danghoatdong.url && the_danghoatdong.url.includes('sangtacviet.com')) {
            await new Promise(r => setTimeout(r, 800));
            phanhoi = await guilenh('getInfo');
        }
    }

    if (!phanhoi || phanhoi.noTab) {
        chrome.storage.local.remove('last_active_state');
        document.getElementById('status-text').innerHTML = `${svgCpt} Mở trang STV trước`;
        document.getElementById('current-title').textContent = 'Chưa mở trang sangtacviet.com';
        document.getElementById('current-chap').textContent = '—';
        document.getElementById('cover-img').style.display = 'none';
        o_trong.style.display = 'block';
        thongtin_truyen.style.display = 'none';
        nut_mo_stv.textContent = 'Mở trang sangtacviet.com ngay!';
        document.querySelector('.controls').style.display = 'none';
        document.querySelector('.status-bar').style.display = 'none';
        return;
    }

    if (!phanhoi.bookTitle) {
        document.getElementById('status-text').innerHTML = `${svgCpt} Chọn một truyện để đọc`;
        document.getElementById('current-title').textContent = 'Đang ở trang chủ / tìm kiếm';
        document.getElementById('current-chap').textContent = '—';
        document.getElementById('current-chap').style.display = 'none';
        document.getElementById('btn-save').style.display = 'none';
        document.getElementById('cover-img').style.display = 'none';
        o_trong.style.display = 'none';
        thongtin_truyen.style.display = 'block';
        document.querySelector('.controls').style.display = 'none';
        document.querySelector('.status-bar').style.display = 'none';
        return;
    }

    o_trong.style.display = 'none';
    thongtin_truyen.style.display = 'block';
    document.getElementById('cover-img').style.display = 'block';
    document.getElementById('current-chap').style.display = 'block';
    document.getElementById('btn-save').style.display = 'flex';
    document.querySelector('.controls').style.display = 'flex';
    document.querySelector('.status-bar').style.display = 'flex';

    dulieutruyenhientai = { ...phanhoi, pageUrl: phanhoi.pageUrl || phanhoi.bookUrl };

    chrome.storage.local.get('readingList', data => {
        let danh_sach = data.readingList || [];
        const muc_da_luu = danh_sach.findIndex(i => (i.title || '').trim().toLowerCase() === (phanhoi.bookTitle || '').trim().toLowerCase());

        if (!phanhoi.imgUrl) {
            coverImg.src = (muc_da_luu !== -1 && danh_sach[muc_da_luu].imgUrl) ? danh_sach[muc_da_luu].imgUrl : FALLBACK_COVER;
        } else {
            coverImg.src = phanhoi.imgUrl;
        }
        coverImg.style.display = 'block';

        if (muc_da_luu !== -1) {
            dattrangthailuu(true);
            let da_capnhat = false;
            if (dulieutruyenhientai.pageUrl && danh_sach[muc_da_luu].url !== dulieutruyenhientai.pageUrl) { danh_sach[muc_da_luu].url = dulieutruyenhientai.pageUrl; da_capnhat = true; }
            if (phanhoi.chapTitle && danh_sach[muc_da_luu].chap !== phanhoi.chapTitle) { danh_sach[muc_da_luu].chap = phanhoi.chapTitle; da_capnhat = true; }
            if (phanhoi.imgUrl && danh_sach[muc_da_luu].imgUrl !== phanhoi.imgUrl) { danh_sach[muc_da_luu].imgUrl = phanhoi.imgUrl; da_capnhat = true; }
            if (da_capnhat) chrome.storage.local.set({ readingList: danh_sach }, () => hienthidanhsachdoc(danh_sach));
        }
    });

    if (phanhoi.bookTitle) document.getElementById('current-title').textContent = phanhoi.bookTitle;
    if (phanhoi.chapTitle) document.getElementById('current-chap').textContent = phanhoi.chapTitle;

    if (phanhoi.bookUrl) {
        const mo_trang_truyen = () => window.open(phanhoi.bookUrl, '_blank');
        coverImg.style.cursor = 'pointer';
        coverImg.title = 'Nhấn để mở trang thông tin truyện';
        coverImg.addEventListener('click', mo_trang_truyen);
        const nut_tieu_de = document.getElementById('current-title');
        nut_tieu_de.style.cursor = 'pointer';
        nut_tieu_de.title = 'Nhấn để mở trang thông tin truyện';
        nut_tieu_de.addEventListener('click', mo_trang_truyen);
    }

    if (phanhoi.ttsEngine) capnhathuyhieu(phanhoi.ttsEngine);
    if (phanhoi.elapsed !== undefined) { giaydongho = phanhoi.elapsed; capnhatdongho(); }

    dattrangthaiphat(phanhoi.isPlaying, phanhoi.isPaused);
    if (phanhoi.isPlaying) batdaudongho();

    batdaucapnhat();
    setTimeout(taicacgiong, 300);
}

khoitaopopup().finally(() => {
    document.body.style.opacity = '1';
});
taidanhsachdoc();

document.addEventListener('visibilitychange', () => {
    if (document.hidden) dungcapnhat();
    else batdaucapnhat();
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

function hienthiochontuychinh() {
    const o_chon_goc = document.getElementById('voice-select');
    const nut_kich_hoat = document.getElementById('custom-voice-trigger');
    const khung_chon = document.getElementById('custom-voice-dropdown');
    const van_ban_hien_thi = document.getElementById('custom-voice-text');
    if (!o_chon_goc || !nut_kich_hoat || !khung_chon) return;
    khung_chon.innerHTML = '';
    const lua_chon_da_chon = o_chon_goc.options[o_chon_goc.selectedIndex];
    if (lua_chon_da_chon) {
        van_ban_hien_thi.textContent = lua_chon_da_chon.textContent;
    } else {
        van_ban_hien_thi.textContent = 'Chưa tải được giọng';
    }
    Array.from(o_chon_goc.options).forEach(opt => {
        const muc = document.createElement('div');
        muc.className = 'custom-option';
        if (opt.selected) muc.classList.add('selected');
        muc.textContent = opt.textContent;
        muc.addEventListener('click', (e) => {
            e.stopPropagation();
            o_chon_goc.value = opt.value;
            o_chon_goc.dispatchEvent(new Event('change'));
            van_ban_hien_thi.textContent = opt.textContent;
            khung_chon.querySelectorAll('.custom-option').forEach(el => el.classList.remove('selected'));
            muc.classList.add('selected');
            khung_chon.classList.remove('show');
        });
        khung_chon.appendChild(muc);
    });
}

function caidatochontinh(id_chon_goc, id_van_ban, id_khung_chon) {
    const o_chon_goc = document.getElementById(id_chon_goc);
    const khung_chon = document.getElementById(id_khung_chon);
    const van_ban_hien_thi = document.getElementById(id_van_ban);
    if (!o_chon_goc || !khung_chon || !van_ban_hien_thi) return;
    function cap_nhat() {
        khung_chon.innerHTML = '';
        const lua_chon_da_chon = o_chon_goc.options[o_chon_goc.selectedIndex];
        if (lua_chon_da_chon) van_ban_hien_thi.textContent = lua_chon_da_chon.textContent;
        Array.from(o_chon_goc.children).forEach(con => {
            if (con.tagName === 'OPTGROUP') {
                const nhom = document.createElement('div');
                nhom.className = 'custom-optgroup';
                nhom.textContent = con.label;
                khung_chon.appendChild(nhom);
                Array.from(con.children).forEach(opt => {
                    khung_chon.appendChild(tao_muc(opt, true));
                });
            } else if (con.tagName === 'OPTION') {
                khung_chon.appendChild(tao_muc(con, false));
            }
        });
    }
    function tao_muc(opt, co_thut_le) {
        const muc = document.createElement('div');
        muc.className = 'custom-option';
        if (co_thut_le) muc.style.paddingLeft = '24px';
        if (opt.selected) muc.classList.add('selected');
        muc.textContent = opt.textContent;
        muc.addEventListener('click', (e) => {
            e.stopPropagation();
            o_chon_goc.value = opt.value;
            o_chon_goc.dispatchEvent(new Event('change'));
            khung_chon.classList.remove('show');
        });
        return muc;
    }
    o_chon_goc.addEventListener('change', cap_nhat);
    cap_nhat();
}

caidatochontinh('custom-left-type', 'text-left-type', 'dropdown-left-type');
caidatochontinh('custom-right-type', 'text-right-type', 'dropdown-right-type');
caidatochontinh('custom-operator', 'text-operator', 'dropdown-operator');
caidatochontinh('engine-select', 'custom-engine-text', 'custom-engine-dropdown');
caidatochontinh('select-auto-stop', 'custom-autostop-text', 'custom-autostop-dropdown');

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
            const khoa = id === 'chk-shortcuts' ? 'batphimtat' : (id === 'chk-read-book' ? 'doctentruyen' : 'doctenchuong');
            chrome.storage.sync.set({ [khoa]: e.target.checked });
        });
    }
});
const _now = new Date();
let gio_val_vt = _now.getHours();
let phut_val_vt = _now.getMinutes();

function get12h(h24) { const h = h24 % 12; return h === 0 ? 12 : h; }
function to24h(h12, ampm) {
    if (ampm === 'AM') return h12 === 12 ? 0 : h12;
    return h12 === 12 ? 12 : h12 + 12;
}
function layAmPmHienTai() {
    return document.getElementById('ampm-text')?.textContent || 'AM';
}

function veTickMarks() {
    const CENTER = 95, HOUR_R = 82, MIN_R = 56;
    const hourTickGroup = document.getElementById('hour-ticks');
    if (hourTickGroup) {
        hourTickGroup.innerHTML = '';
        for (let i = 0; i < 60; i++) {
            const deg = i * 6 - 90, rad = deg * Math.PI / 180;
            const isMajor = i % 5 === 0;
            const outer = HOUR_R + 5, inner = HOUR_R - (isMajor ? 7 : 4);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', CENTER + outer * Math.cos(rad));
            line.setAttribute('y1', CENTER + outer * Math.sin(rad));
            line.setAttribute('x2', CENTER + inner * Math.cos(rad));
            line.setAttribute('y2', CENTER + inner * Math.sin(rad));
            line.setAttribute('class', 'tick-mark' + (isMajor ? ' major' : ''));
            hourTickGroup.appendChild(line);
        }
    }
    const minTickGroup = document.getElementById('minute-ticks');
    if (minTickGroup) {
        minTickGroup.innerHTML = '';
        for (let i = 0; i < 60; i++) {
            const deg = i * 6 - 90, rad = deg * Math.PI / 180;
            const isMajor = i % 15 === 0;
            const outer = MIN_R + 4, inner = MIN_R - (isMajor ? 6 : 3);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', CENTER + outer * Math.cos(rad));
            line.setAttribute('y1', CENTER + outer * Math.sin(rad));
            line.setAttribute('x2', CENTER + inner * Math.cos(rad));
            line.setAttribute('y2', CENTER + inner * Math.sin(rad));
            line.setAttribute('class', 'tick-mark' + (isMajor ? ' major' : ''));
            minTickGroup.appendChild(line);
        }
    }
}

function capnhat_ampm() {
    const ampm = gio_val_vt < 12 ? 'AM' : 'PM';
    const textEl = document.getElementById('ampm-text');
    if (textEl) textEl.textContent = ampm;
    document.querySelectorAll('#ampm-dropdown .custom-option').forEach(o => {
        o.classList.toggle('selected', o.dataset.val === ampm);
    });
}

function capnhat_gia_tri_vt(type, val) {
    const hourHandle = document.getElementById('hour-handle');
    const minuteHandle = document.getElementById('minute-handle');
    const digitH = document.getElementById('digit-hours');
    const digitM = document.getElementById('digit-minutes');
    const hourProgress = document.getElementById('hour-progress');
    const minuteProgress = document.getElementById('minute-progress');
    if (!hourHandle || !minuteHandle) return;

    const CENTER = 95, hourRadius = 82, minuteRadius = 56;

    function set_vi_tri(handle, radius, deg) {
        const rad = (deg - 90) * (Math.PI / 180);
        handle.setAttribute('cx', CENTER + radius * Math.cos(rad));
        handle.setAttribute('cy', CENTER + radius * Math.sin(rad));
    }
    function set_tien_trinh(progress, radius, deg) {
        const c = 2 * Math.PI * radius;
        progress.style.strokeDasharray = `${c * (deg / 360)}, ${c}`;
    }

    if (type === 'hour') {
        gio_val_vt = Math.min(23, Math.max(0, val));

        const isPM = gio_val_vt >= 12;

        const displayHour = isPM
            ? gio_val_vt
            : get12h(gio_val_vt);

        if (digitH) {
            const isPM = gio_val_vt >= 12;

            const displayHour = isPM
                ? gio_val_vt
                : get12h(gio_val_vt);

            digitH.textContent = String(displayHour).padStart(2, '0');
        }

        const deg = (360 / 12) * (get12h(gio_val_vt) % 12);

        set_vi_tri(hourHandle, hourRadius, deg);
        set_tien_trinh(hourProgress, hourRadius, deg);

        capnhat_ampm();
    } else {
        phut_val_vt = Math.min(59, Math.max(0, val));
        if (digitM) digitM.textContent = String(phut_val_vt).padStart(2, '0');
        const deg = (360 / 60) * phut_val_vt;
        set_vi_tri(minuteHandle, minuteRadius, deg);
        set_tien_trinh(minuteProgress, minuteRadius, deg);
    }
}

function caidatClickNhapSo() {
    const digitH = document.getElementById('digit-hours');
    const digitM = document.getElementById('digit-minutes');
    if (!digitH || !digitM) return;

    function batDauNhap(digitEl, type) {
        digitEl.classList.add('editing');
        const maxVal = type === 'hour' ? 12 : 59;
        let buf = '';

        const handler = (e) => {
            const key = e.key;
            if (key >= '0' && key <= '9') {
                buf += key;
                digitEl.textContent = buf.length === 1 ? '0' + key : buf.slice(-2);
                if (buf.length >= 2) {
                    let num = parseInt(buf.slice(-2));
                    if (type === 'hour') {
                        num = Math.max(1, Math.min(12, num));
                        capnhat_gia_tri_vt('hour', to24h(num, layAmPmHienTai()));
                    } else {
                        num = Math.min(59, num);
                        capnhat_gia_tri_vt('minute', num);
                    }
                    buf = '';
                    digitEl.classList.remove('editing');
                    if (type === 'hour') setTimeout(() => batDauNhap(digitM, 'minute'), 60);
                    document.removeEventListener('keydown', handler);
                    document.removeEventListener('mousedown', clickOut);
                }
            } else if (key === 'Backspace') {
                buf = buf.slice(0, -1);
                if (!buf) digitEl.textContent = type === 'hour'
                    ? String(get12h(gio_val_vt)).padStart(2, '0')
                    : String(phut_val_vt).padStart(2, '0');
            } else if (['Enter', 'Tab', 'Escape'].includes(key)) {
                const num = buf ? parseInt(buf) : (type === 'hour' ? get12h(gio_val_vt) : phut_val_vt);
                if (type === 'hour') capnhat_gia_tri_vt('hour', to24h(Math.max(1, Math.min(12, num)), layAmPmHienTai()));
                else capnhat_gia_tri_vt('minute', Math.min(59, num));
                buf = '';
                digitEl.classList.remove('editing');
                document.removeEventListener('keydown', handler);
                document.removeEventListener('mousedown', clickOut);
            }
        };

        const clickOut = (e) => {
            if (e.target !== digitEl) {
                const num = buf ? parseInt(buf) : (type === 'hour' ? get12h(gio_val_vt) : phut_val_vt);
                if (type === 'hour') capnhat_gia_tri_vt('hour', to24h(Math.max(1, Math.min(12, num)), layAmPmHienTai()));
                else capnhat_gia_tri_vt('minute', Math.min(59, num));
                buf = '';
                digitEl.classList.remove('editing');
                document.removeEventListener('keydown', handler);
                document.removeEventListener('mousedown', clickOut);
            }
        };

        document.addEventListener('keydown', handler);
        setTimeout(() => document.addEventListener('mousedown', clickOut), 0);
    }

    digitH.addEventListener('click', () => batDauNhap(digitH, 'hour'));
    digitM.addEventListener('click', () => batDauNhap(digitM, 'minute'));

    digitH.addEventListener('wheel', (e) => {
        e.preventDefault();
        const cur12h = get12h(gio_val_vt);
        const next12h = ((cur12h - 1 + (e.deltaY < 0 ? 1 : -1) + 12) % 12) + 1;
        capnhat_gia_tri_vt('hour', to24h(next12h, layAmPmHienTai()));
    }, { passive: false });
    digitM.addEventListener('wheel', (e) => {
        e.preventDefault();
        capnhat_gia_tri_vt('minute', (phut_val_vt + (e.deltaY < 0 ? 1 : -1) + 60) % 60);
    }, { passive: false });
}

function caidatDropdownAmPm() {
    document.querySelectorAll('#ampm-dropdown .custom-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const newAmpm = opt.dataset.val;
            const cur12h = get12h(gio_val_vt);
            document.querySelectorAll('#ampm-dropdown .custom-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            document.getElementById('ampm-text').textContent = newAmpm;
            document.getElementById('ampm-dropdown').classList.remove('show');
            const h24 = to24h(cur12h, newAmpm);
            capnhat_gia_tri_vt('hour', h24);
            capnhat_ampm();
        });
    });
}

setTimeout(() => {
    const hourHandle = document.getElementById('hour-handle');
    const minuteHandle = document.getElementById('minute-handle');
    if (!hourHandle || !minuteHandle) return;

    veTickMarks();
    caidatClickNhapSo();
    caidatDropdownAmPm();

    function layGocTuToaDo(clientX, clientY, svgEl, cx, cy) {
        const r = svgEl.getBoundingClientRect();
        const sx = 190 / r.width, sy = 190 / r.height;
        const mx = (clientX - r.left) * sx, my = (clientY - r.top) * sy;
        return (Math.atan2(my - cy, mx - cx) * (180 / Math.PI) + 90 + 360) % 360;
    }

    function khoitao_keo_nut(handle, ringType) {
        let isDragging = false;
        const svgEl = handle.ownerSVGElement;
        const CENTER = 95;

        const onMove = (clientX, clientY) => {
            const deg = layGocTuToaDo(clientX, clientY, svgEl, CENTER, CENTER);
            if (ringType === 'hour') {
                const step = Math.round(deg / (360 / 12));
                const h12 = step === 0 ? 12 : step;
                capnhat_gia_tri_vt('hour', to24h(h12, layAmPmHienTai()));
            } else {
                capnhat_gia_tri_vt('minute', Math.round(deg / (360 / 60)) % 60);
            }
        };

        handle.addEventListener('mousedown', (e) => { isDragging = true; handle.classList.add('dragging'); e.preventDefault(); });
        window.addEventListener('mousemove', (e) => { if (isDragging) onMove(e.clientX, e.clientY); });
        window.addEventListener('mouseup', () => { isDragging = false; handle.classList.remove('dragging'); });

        handle.addEventListener('touchstart', (e) => { isDragging = true; handle.classList.add('dragging'); e.preventDefault(); }, { passive: false });
        window.addEventListener('touchmove', (e) => { if (isDragging) onMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
        window.addEventListener('touchend', () => { isDragging = false; handle.classList.remove('dragging'); });
    }

    khoitao_keo_nut(hourHandle, 'hour');
    khoitao_keo_nut(minuteHandle, 'minute');

    capnhat_gia_tri_vt('hour', gio_val_vt);
    capnhat_gia_tri_vt('minute', phut_val_vt);
}, 500);

document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('copy', e => e.preventDefault());
document.addEventListener('cut', e => e.preventDefault());
document.addEventListener('dragstart', e => e.preventDefault());
document.addEventListener('keydown', e => {
    if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toUpperCase() === 'U') ||
        (e.ctrlKey && e.key.toUpperCase() === 'S')
    ) e.preventDefault();
});

document.getElementById('btn-export-data').addEventListener('click', () => {
    chrome.storage.local.get(null, data => {
        const backupData = {
            readingList: data.readingList || [],
            fpt_key: data.fpt_key || '',
            azure_key: data.azure_key || '',
            azure_region: data.azure_region || '',
            customDict: data.customDict || [],
            speed: data.speed,
            volume: data.volume,
            maydoc: data.maydoc
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AutoDocSTV_Backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        hienthithongbao('Đã tải xuống file sao lưu!', 'success');
    });
});

document.getElementById('btn-import-data').addEventListener('click', () => {
    document.getElementById('import-file-input').click();
});

document.getElementById('import-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const parsedData = JSON.parse(event.target.result);
            chrome.storage.local.set(parsedData, () => {
                hienthithongbao('Phục hồi dữ liệu thành công! Khởi động lại...', 'success');
                setTimeout(() => window.location.reload(), 1500);
            });
        } catch (err) {
            hienthithongbao('File backup không hợp lệ!', 'warning');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
});

let hienTaiDict = [];

function hienThiTuDien() {
    const listEl = document.getElementById('dict-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    if (hienTaiDict.length === 0) {
        listEl.innerHTML = '<div style="font-size: 10px; color: var(--text-muted); text-align: center; padding: 4px 0;">Chưa có từ nào được thêm.</div>';
        return;
    }

    hienTaiDict.forEach((rule, index) => {
        const item = document.createElement('div');
        item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; background: var(--surface); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border);';
        item.innerHTML = `
            <div style="font-size: 10.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <span style="color: var(--text);">${thoathtml(rule.origin)}</span> 
                <span style="color: var(--text-muted); margin: 0 4px;">→</span> 
                <span style="color: var(--accent2);">${thoathtml(rule.replace)}</span>
            </div>
            <button class="btn-remove-dict" data-index="${index}" style="background: none; border: none; color: var(--danger); cursor: pointer; padding: 2px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        `;
        listEl.appendChild(item);
    });

    document.querySelectorAll('.btn-remove-dict').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = e.currentTarget.dataset.index;
            hienTaiDict.splice(idx, 1);
            chrome.storage.sync.set({ customDict: hienTaiDict }, () => {
                hienThiTuDien();
                hienthithongbao('Đã xóa từ!', 'info');
            });
        });
    });
}

chrome.storage.sync.get('customDict', d => {
    hienTaiDict = d.customDict || [];
    hienThiTuDien();
});

document.getElementById('btn-add-dict').addEventListener('click', () => {
    const origin = document.getElementById('dict-origin').value.trim();
    const replace = document.getElementById('dict-replace').value.trim();

    if (!origin || !replace) {
        hienthithongbao('Vui lòng nhập đủ 2 ô!', 'warning');
        return;
    }

    const existIdx = hienTaiDict.findIndex(r => r.origin.toLowerCase() === origin.toLowerCase());
    if (existIdx !== -1) {
        hienTaiDict[existIdx].replace = replace;
    } else {
        hienTaiDict.unshift({ origin, replace });
    }

    chrome.storage.sync.set({ customDict: hienTaiDict }, () => {
        document.getElementById('dict-origin').value = '';
        document.getElementById('dict-replace').value = '';
        hienThiTuDien();
        hienthithongbao('Đã thêm vào từ điển!', 'success');
        guilenh('setEngine', { value: document.getElementById('engine-select').value });
    });
});