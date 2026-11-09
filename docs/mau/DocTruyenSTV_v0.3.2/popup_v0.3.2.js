'use strict';

const ANH_KHUYET = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='54' height='78' viewBox='0 0 24 24' fill='none' stroke='%237a7896' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3.6 3.6A2 2 0 0 1 5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-.59 1.41'/%3E%3Cpath d='M3 8.7V19a2 2 0 0 0 2 2h10.3'/%3E%3Cpath d='m2 2 20 20'/%3E%3Cpath d='M13 13a3 3 0 1 0 0-6H9v2'/%3E%3Cpath d='M9 17v-2.3'/%3E%3C/svg%3E";
const SVG_PHAT = `<polygon points="5 3 19 12 5 21 5 3"/>`;
const SVG_TAMDUNG = `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`;
const SVG_DANHSACH = `<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>`;
const SVG_DANHSACH_DA = `<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/><polyline points="9 10 12 13 15 7"/>`;
const SVG_LUU = `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>`;
const SVG_TICH = `<polyline points="20 6 9 17 4 12"/>`;
const svgcanhbao = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 3px; color: var(--warning);"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;


let mahengiodongho = null;
let giaydongho = 0;
let trangthaicuoi = { isPlaying: false, isPaused: false };
let mahengiocapnhat = null;
let mahengiothongbao = null;
let idthestvcache = null;
let dulieutruyenhientai = null;
let danhsachdochientai = [];
let amluongtruoc = 1.0;
let cheodosapxep = 'recent';
let ladaucong = true;
let tudienhientai = [];
const baygio = new Date();
let gio_val_vt = baygio.getHours();
let phut_val_vt = baygio.getMinutes();

async function guitoithe(idthe, lenh, them = {}) {
    return new Promise(resolve => {
        chrome.tabs.sendMessage(idthe, { action: lenh, ...them }, phanhoi => {
            void chrome.runtime.lastError;
            resolve(phanhoi);
        });
    });
}

async function guilenh(lenh, them = {}) {
    if (idthestvcache) {
        try {
            const phanhoi = await guitoithe(idthestvcache, lenh, them);
            if (phanhoi && !phanhoi.noTab) return phanhoi;
        } catch (e) {
            idthestvcache = null;
        }
    }
    const [thedanghoatdong] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (thedanghoatdong && thedanghoatdong.url && thedanghoatdong.url.includes('sangtacviet.com')) {
        const phanhoi = await guitoithe(thedanghoatdong.id, lenh, them);
        if (phanhoi) {
            idthestvcache = thedanghoatdong.id;
            return phanhoi;
        }
    }
    let cacthe = await chrome.tabs.query({ url: "*://*.sangtacviet.com/*" });
    if (cacthe.length === 0) return { noTab: true };
    cacthe.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
    const thetruyen = cacthe.filter(t => t.url.includes('/truyen/'));
    const theungvien = thetruyen.length > 0 ? thetruyen : cacthe;
    for (const the of theungvien) {
        const phanhoi = await guitoithe(the.id, lenh, them);
        if (phanhoi && phanhoi.bookTitle) {
            idthestvcache = the.id;
            return phanhoi;
        }
    }
    idthestvcache = cacthe[0].id;
    return guitoithe(cacthe[0].id, lenh, them);
}

function hienthithongbao(thongdiep, kieu = 'info') {
    const thongbao = document.getElementById('toast');
    if (!thongbao) return;
    let iconSvg = '';
    if (kieu === 'success') iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    if (kieu === 'info') iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    if (kieu === 'warning') iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    thongbao.innerHTML = `${iconSvg} <span>${thongdiep}</span>`;
    thongbao.className = `toast toast-${kieu} show`;
    clearTimeout(mahengiothongbao);
    mahengiothongbao = setTimeout(() => thongbao.classList.remove('show'), 2800);
}

function batdaudongho() {
    if (mahengiodongho) return;
    mahengiodongho = setInterval(() => { giaydongho++; capnhatdongho(); }, 1000);
}

function tamdungdongho() {
    clearInterval(mahengiodongho);
    mahengiodongho = null;
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
    const vantrantrangthai = document.getElementById('status-text');
    const bieutuong = document.getElementById('btn-play-icon');
    const vanbannut = document.getElementById('btn-play-text');
    cham.className = 'status-dot';
    if (dangphat) {
        document.getElementById('interaction-warning').style.display = 'none';
        cham.classList.add('playing');
        vantrantrangthai.textContent = 'Đang đọc...';
        bieutuong.innerHTML = SVG_TAMDUNG;
        vanbannut.textContent = 'Dừng';
        batdaudongho();
    } else if (dangtamdung) {
        cham.classList.add('paused');
        vantrantrangthai.textContent = 'Đang tạm dừng';
        bieutuong.innerHTML = SVG_PHAT;
        vanbannut.textContent = 'Tiếp tục';
        tamdungdongho();
    } else {
        vantrantrangthai.textContent = 'Sẵn sàng';
        bieutuong.innerHTML = SVG_PHAT;
        vanbannut.textContent = 'Nghe';
        tamdungdongho();
    }
}

function capnhattienhat(tienhat) {
    const onhap = document.getElementById('progress-input');
    const tongso = document.getElementById('progress-total');
    const thanhdien = document.getElementById('progress-bar-fill');
    const phantram = document.getElementById('progress-percent');
    if (tienhat && tienhat.total > 0) {
        if (onhap && document.activeElement !== onhap) onhap.value = tienhat.current;
        if (tongso) tongso.textContent = tienhat.total;
        const pt = Math.round((tienhat.current / tienhat.total) * 100);
        if (thanhdien) thanhdien.style.width = pt + '%';
        if (phantram) phantram.textContent = pt + '%';
    } else {
        if (onhap && document.activeElement !== onhap) onhap.value = 0;
        if (tongso) tongso.textContent = 0;
        if (thanhdien) thanhdien.style.width = '0%';
        if (phantram) phantram.textContent = '0%';
    }
}

function capnhathuyhieu(congcu) {
    const huyhieu = document.getElementById('tts-badge');
    const vanbanduoitrang = document.getElementById('footer-engine');
    if (!huyhieu) return;
    const mangchuyendoi = {
        web: ['Web TTS', 'var(--success)', 'var(--success)', 'Web Speech API'],
        fpt: ['FPT.AI', 'var(--accent2)', 'var(--accent2)', 'FPT.AI TTS'],
        azure: ['Azure TTS', 'var(--accent)', 'var(--accent)', 'Microsoft Azure'],
    };
    const [nhan, vien, mau, tenduoitrang] = mangchuyendoi[congcu] || mangchuyendoi.web;
    huyhieu.textContent = nhan;
    huyhieu.style.borderColor = vien;
    huyhieu.style.color = mau;
    if (vanbanduoitrang) {
        vanbanduoitrang.textContent = tenduoitrang;
        vanbanduoitrang.style.color = mau;
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
    if (mahengiocapnhat) return;
    mahengiocapnhat = setInterval(capnhattrangthai, 1500);
}

function dungcapnhat() {
    clearInterval(mahengiocapnhat);
    mahengiocapnhat = null;
}

function thoathtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\//g, '&#x2F;');
}

async function kiemtravalamsachdungluong() {
    if (!chrome.storage.local.getBytesInUse) return false;
    return new Promise(resolve => {
        chrome.storage.local.getBytesInUse(null, bytehientai => {
            const toida = 4.2 * 1024 * 1024;
            if (bytehientai < toida) return resolve(false);
            chrome.storage.local.get('readingList', data => {
                let danhsach = data.readingList || [];
                if (danhsach.length === 0) return resolve(false);
                danhsach.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                const truyencunhat = danhsach.shift();
                chrome.storage.local.set({ readingList: danhsach }, () => {
                    hienthithongbao(`Dung lượng gần đầy, đã tự động xoá "${truyencunhat.title}" để lưu truyện mới`, 'warning');
                    resolve(true);
                });
            });
        });
    });
}

function sapxepdanhsach(danhsach) {
    const arr = [...danhsach];
    if (cheodosapxep === 'az') {
        arr.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'vi'));
    } else if (cheodosapxep === 'chapters') {
        arr.sort((a, b) => (b.chunkTotal || 0) - (a.chunkTotal || 0));
    } else {
        arr.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }
    return arr;
}

function taidanhsachdoc() {
    chrome.storage.local.get('readingList', d => {
        danhsachdochientai = d.readingList || [];
        hienthidanhsachdoc(sapxepdanhsach(danhsachdochientai));
        document.getElementById('info-count').textContent = `${danhsachdochientai.length} truyện`;
    });
}

function dattrangthailuu(daluu) {
    const nut = document.getElementById('btn-save');
    const bieutuong = document.getElementById('save-icon');
    const vanban = document.getElementById('save-text');
    nut.className = `btn-save${daluu ? ' saved' : ''}`;
    bieutuong.innerHTML = daluu ? SVG_DANHSACH_DA : SVG_DANHSACH;
    vanban.textContent = daluu ? 'Đã lưu' : 'Lưu';
}

function hienthidanhsachdoc(danhsach) {
    const vungdanhsach = document.getElementById('list-container');
    capnhatdungluong();

    if (!danhsach.length) {
        vungdanhsach.innerHTML = '<div class="list-empty">Chưa có truyện nào được lưu.</div>';
        return;
    }
    vungdanhsach.innerHTML = danhsach.map((m) => {
        let maungay = 'var(--text-muted)';
        let textngay = m.savedAt || '';
        if (m.timestamp) {
            const songay = (Date.now() - m.timestamp) / (1000 * 60 * 60 * 24);
            if (songay > 60) maungay = '#888888';
            else if (songay > 30) maungay = 'var(--danger)';
            else if (songay > 15) maungay = 'var(--warning)';
            if (!textngay) textngay = new Date(m.timestamp).toLocaleDateString('vi-VN');
        }
        const htmlngay = textngay ? `<span style="color:${maungay}; font-size:9px; margin-right:6px;">${textngay}</span>` : '';
        return `
            <div class="list-item" data-title="${thoathtml(m.title)}" title="Nhấn để mở">
                <img class="list-thumb" src="${thoathtml(m.imgUrl || ANH_KHUYET)}" alt="">
                <div class="list-info">
                    <div class="list-name">${thoathtml(m.title)}</div>
                    <div class="list-chap">
                        ${thoathtml(m.chap || '...')}
                        <span style="color:var(--accent);">
                            ${m.chunkIndex ? `(Đoạn ${m.chunkIndex})` : ''}
                        </span>
                    </div>
                </div>
                ${htmlngay}
                <button class="btn-remove" data-title="${thoathtml(m.title)}">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>`;
    }).join('');
    document.querySelectorAll('.list-item').forEach((item, index) => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.btn-remove')) return;
            const muc = danhsach[index];
            if (muc && muc.url && /^https?:\/\//.test(muc.url)) window.open(muc.url, '_blank');
        });
    });
    document.querySelectorAll('.btn-remove').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            xoakhoidanhsach(btn.getAttribute('data-title'));
        });
    });
}

function xoakhoidanhsach(title) {
    chrome.storage.local.get('readingList', data => {
        const danhsach = data.readingList || [];
        const vitri = danhsach.findIndex(i => (i.title || '').trim().toLowerCase() === (title || '').trim().toLowerCase());
        if (vitri === -1) return;
        danhsach.splice(vitri, 1);
        chrome.storage.local.set({ readingList: danhsach }, () => {
            danhsachdochientai = danhsach;
            hienthidanhsachdoc(sapxepdanhsach(danhsach));
            document.getElementById('info-count').textContent = `${danhsach.length} truyện`;
            if (dulieutruyenhientai) {
                const vanluu = danhsach.some(i => (i.title || '').trim().toLowerCase() === (dulieutruyenhientai.bookTitle || '').trim().toLowerCase());
                dattrangthailuu(vanluu);
            }
        });
    });
}

function capnhatdungluong() {
    if (!chrome.storage.local.getBytesInUse) return;
    chrome.storage.local.getBytesInUse(null, (bytes) => {
        const MAX_BYTES = 4.111 * 1024 * 1024;
        const phantram = (bytes / MAX_BYTES) * 100;
        const kb = (bytes / 1024).toFixed(1);
        const maxKb = (MAX_BYTES / 1024).toFixed(0);

        const usageText = document.getElementById('storage-usage-text');
        const usageBar = document.getElementById('storage-usage-bar');
        const warning = document.getElementById('storage-warning');

        if (usageText) usageText.textContent = `${kb} KB / ${maxKb} KB`;

        if (usageBar) {
            usageBar.style.width = `${Math.min(100, phantram)}%`;
            usageBar.style.background = phantram > 85 ? 'var(--danger)' : (phantram > 60 ? 'var(--warning)' : 'var(--success)');
        }
        if (warning) warning.style.display = phantram > 85 ? 'block' : 'none';
    });
}

function hienthitudien() {
    const listEl = document.getElementById('dict-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    if (tudienhientai.length === 0) {
        listEl.innerHTML = '<div style="font-size: 10px; color: var(--text-muted); text-align: center; padding: 4px 0;">Chưa có từ nào được thêm.</div>';
        return;
    }
    tudienhientai.forEach((rule, index) => {
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
            const idx = parseInt(e.currentTarget.dataset.index, 10);
            tudienhientai.splice(idx, 1);
            chrome.storage.local.set({ customDict: tudienhientai }, () => {
                hienthitudien();
                hienthithongbao('Đã xóa từ!', 'info');
            });
        });
    });
}

function luukhoangnghi() {
    if (!onhapphay || !onhapcham || !onhapxuongdong) return;
    const khoangnghi = {
        comma: parseInt(onhapphay.value) || 300,
        dot: parseInt(onhapcham.value) || 800,
        para: parseInt(onhapxuongdong.value) || 1200
    };
    chrome.storage.sync.set({ smartPauses: khoangnghi });
    guilenh('setPauses', khoangnghi);
}

async function taicacgiong() {
    const conghientai = document.getElementById('engine-select').value;
    const goiygiong = document.getElementById('voice-hint');
    if (conghientai !== 'web' && conghientai !== 'auto') {
        if (goiygiong) goiygiong.style.display = 'none';
        return;
    }
    const phanhoi = await guilenh('getVoices');
    if (!phanhoi || !phanhoi.voices) return;
    const ochongiong = document.getElementById('voice-select');
    ochongiong.innerHTML = '';
    const giongviet = phanhoi.voices.filter(v => v.lang && v.lang.startsWith('vi'));
    let chisohoaimy = -1;
    let chisodautien = -1;
    if (giongviet.length > 0) {
        giongviet.forEach((v, idx) => {
            const opt = document.createElement('option');
            opt.value = v.name;
            let tenngan = v.name.replace(/\s*-\s*Vietnamese\s*\(Vietnam\)/gi, '').replace(/\s*Online\s*\(Natural\)/gi, '').replace(/Microsoft/gi, 'MS').replace(/Google/gi, 'GG').trim();
            opt.textContent = tenngan;
            ochongiong.appendChild(opt);
            if (tenngan.includes('Hoài My')) chisohoaimy = v.name;
            if (idx === 0) chisodautien = v.name;
        });
    }
    if (goiygiong) goiygiong.style.display = giongviet.length > 0 ? 'none' : 'block';
    chrome.storage.sync.get('voiceIndex', d => {
        let muctieu = d.voiceIndex;
        if (muctieu === undefined || muctieu === -1) {
            muctieu = (chisohoaimy !== -1) ? chisohoaimy : chisodautien;
        }
        let cogiati = false;
        for (let i = 0; i < ochongiong.options.length; i++) {
            if (ochongiong.options[i].value == muctieu) {
                ochongiong.selectedIndex = i;
                cogiati = true;
                break;
            }
        }
        if (!cogiati && ochongiong.options.length > 0) {
            ochongiong.selectedIndex = 0;
            muctieu = ochongiong.options[0].value;
        }
        const opt = ochongiong.options[ochongiong.selectedIndex];
        if (opt) {
            document.getElementById('info-voice').textContent = opt.textContent;
            chrome.storage.sync.set({ lastVoiceName: opt.textContent });
            if (d.voiceIndex !== muctieu && muctieu !== -1) {
                chrome.storage.sync.set({ voiceIndex: muctieu });
                guilenh('setVoice', { value: muctieu });
            }
        }
        hienthiochontuychinh();
    });
}

function hienthiochontuychinh() {
    const ochongoc = document.getElementById('voice-select');
    const nutkichhoat = document.getElementById('custom-voice-trigger');
    const khungchon = document.getElementById('custom-voice-dropdown');
    const vanbantr = document.getElementById('custom-voice-text');
    if (!ochongoc || !nutkichhoat || !khungchon) return;
    khungchon.innerHTML = '';
    const luachondachon = ochongoc.options[ochongoc.selectedIndex];
    if (luachondachon) {
        vanbantr.textContent = luachondachon.textContent;
    } else {
        vanbantr.textContent = 'Chưa tải được giọng';
    }
    Array.from(ochongoc.options).forEach(opt => {
        const muc = document.createElement('div');
        muc.className = 'custom-option';
        if (opt.selected) muc.classList.add('selected');
        muc.textContent = opt.textContent;
        muc.addEventListener('click', (e) => {
            e.stopPropagation();
            ochongoc.value = opt.value;
            ochongoc.dispatchEvent(new Event('change'));
            vanbantr.textContent = opt.textContent;
            khungchon.querySelectorAll('.custom-option').forEach(el => el.classList.remove('selected'));
            muc.classList.add('selected');
            khungchon.classList.remove('show');
        });
        khungchon.appendChild(muc);
    });
}

function caidatochontinh(idchongoc, idvanban, idkhungchon) {
    const ochongoc = document.getElementById(idchongoc);
    const khungchon = document.getElementById(idkhungchon);
    const vanbanhienthi = document.getElementById(idvanban);
    if (!ochongoc || !khungchon || !vanbanhienthi) return;
    function capnhat() {
        khungchon.innerHTML = '';
        const luachondachon = ochongoc.options[ochongoc.selectedIndex];
        if (luachondachon) vanbanhienthi.textContent = luachondachon.textContent;
        Array.from(ochongoc.children).forEach(con => {
            if (con.tagName === 'OPTGROUP') {
                const nhom = document.createElement('div');
                nhom.className = 'custom-optgroup';
                nhom.textContent = con.label;
                khungchon.appendChild(nhom);
                Array.from(con.children).forEach(opt => {
                    khungchon.appendChild(taomuc(opt, true));
                });
            } else if (con.tagName === 'OPTION') {
                khungchon.appendChild(taomuc(con, false));
            }
        });
    }
    function taomuc(opt, cothuttle) {
        const muc = document.createElement('div');
        muc.className = 'custom-option';
        if (cothuttle) muc.style.paddingLeft = '24px';
        if (opt.selected) muc.classList.add('selected');
        muc.textContent = opt.textContent;
        muc.addEventListener('click', (e) => {
            e.stopPropagation();
            ochongoc.value = opt.value;
            ochongoc.dispatchEvent(new Event('change'));
            khungchon.classList.remove('show');
        });
        return muc;
    }
    ochongoc.addEventListener('change', capnhat);
    capnhat();
}

function lay12gio(h24) {
    const h = h24 % 12;
    return h === 0 ? 12 : h;
}

function doi24gio(h12, ampm) {
    if (ampm === 'AM') return h12 === 12 ? 0 : h12;
    return h12 === 12 ? 12 : h12 + 12;
}

function layampmhientai() {
    return document.getElementById('ampm-text')?.textContent || 'AM';
}

function vedauvach() {
    const CENTER = 95, HOUR_R = 82, MIN_R = 56;
    const nhomgioch = document.getElementById('hour-ticks');
    if (nhomgioch) {
        nhomgioch.innerHTML = '';
        for (let i = 0; i < 60; i++) {
            const deg = i * 6 - 90, rad = deg * Math.PI / 180;
            const lon = i % 5 === 0;
            const outer = HOUR_R + 5, inner = HOUR_R - (lon ? 7 : 4);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', CENTER + outer * Math.cos(rad));
            line.setAttribute('y1', CENTER + outer * Math.sin(rad));
            line.setAttribute('x2', CENTER + inner * Math.cos(rad));
            line.setAttribute('y2', CENTER + inner * Math.sin(rad));
            line.setAttribute('class', 'tick-mark' + (lon ? ' major' : ''));
            nhomgioch.appendChild(line);
        }
    }
    const nhomphut = document.getElementById('minute-ticks');
    if (nhomphut) {
        nhomphut.innerHTML = '';
        for (let i = 0; i < 60; i++) {
            const deg = i * 6 - 90, rad = deg * Math.PI / 180;
            const lon = i % 15 === 0;
            const outer = MIN_R + 4, inner = MIN_R - (lon ? 6 : 3);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', CENTER + outer * Math.cos(rad));
            line.setAttribute('y1', CENTER + outer * Math.sin(rad));
            line.setAttribute('x2', CENTER + inner * Math.cos(rad));
            line.setAttribute('y2', CENTER + inner * Math.sin(rad));
            line.setAttribute('class', 'tick-mark' + (lon ? ' major' : ''));
            nhomphut.appendChild(line);
        }
    }
}

function capnhatampm() {
    const ampm = gio_val_vt < 12 ? 'AM' : 'PM';
    const textEl = document.getElementById('ampm-text');
    if (textEl) textEl.textContent = ampm;
    document.querySelectorAll('#ampm-dropdown .custom-option').forEach(o => {
        o.classList.toggle('selected', o.dataset.val === ampm);
    });
}

function capnhatgiatrivt(type, val) {
    const nutgio = document.getElementById('hour-handle');
    const nutphut = document.getElementById('minute-handle');
    const sogio = document.getElementById('digit-hours');
    const sophut = document.getElementById('digit-minutes');
    const tientringio = document.getElementById('hour-progress');
    const tientrinphut = document.getElementById('minute-progress');
    if (!nutgio || !nutphut) return;
    const CENTER = 95, bankingio = 82, bankinhphut = 56;

    function setvitri(handle, banhkinh, deg) {
        const rad = (deg - 90) * (Math.PI / 180);
        handle.setAttribute('cx', CENTER + banhkinh * Math.cos(rad));
        handle.setAttribute('cy', CENTER + banhkinh * Math.sin(rad));
    }
    function settientrinhtronh(progress, banhkinh, deg) {
        const c = 2 * Math.PI * banhkinh;
        progress.style.strokeDasharray = `${c * (deg / 360)}, ${c}`;
    }

    if (type === 'hour') {
        gio_val_vt = Math.min(23, Math.max(0, val));
        if (sogio) {
            const lapm = gio_val_vt >= 12;
            const hienthi = lapm ? gio_val_vt : lay12gio(gio_val_vt);
            sogio.textContent = String(hienthi).padStart(2, '0');
        }
        const deg = (360 / 12) * (lay12gio(gio_val_vt) % 12);
        setvitri(nutgio, bankingio, deg);
        settientrinhtronh(tientringio, bankingio, deg);
        capnhatampm();
    } else {
        phut_val_vt = Math.min(59, Math.max(0, val));
        if (sophut) sophut.textContent = String(phut_val_vt).padStart(2, '0');
        const deg = (360 / 60) * phut_val_vt;
        setvitri(nutphut, bankinhphut, deg);
        settientrinhtronh(tientrinphut, bankinhphut, deg);
    }
}

function caidatnhapso() {
    const sogio = document.getElementById('digit-hours');
    const sophut = document.getElementById('digit-minutes');
    if (!sogio || !sophut) return;

    function batdaunhap(digitEl, type) {
        digitEl.classList.add('editing');
        let dem = '';
        const xulyban = (e) => {
            const key = e.key;
            if (key >= '0' && key <= '9') {
                dem += key;
                digitEl.textContent = dem.length === 1 ? '0' + key : dem.slice(-2);
                if (dem.length >= 2) {
                    let num = parseInt(dem.slice(-2));
                    if (type === 'hour') {
                        num = Math.max(1, Math.min(12, num));
                        capnhatgiatrivt('hour', doi24gio(num, layampmhientai()));
                    } else {
                        num = Math.min(59, num);
                        capnhatgiatrivt('minute', num);
                    }
                    dem = '';
                    digitEl.classList.remove('editing');
                    if (type === 'hour') setTimeout(() => batdaunhap(sophut, 'minute'), 60);
                    document.removeEventListener('keydown', xulyban);
                    document.removeEventListener('mousedown', nhanrangoai);
                }
            } else if (key === 'Backspace') {
                dem = dem.slice(0, -1);
                if (!dem) digitEl.textContent = type === 'hour'
                    ? String(lay12gio(gio_val_vt)).padStart(2, '0')
                    : String(phut_val_vt).padStart(2, '0');
            } else if (['Enter', 'Tab', 'Escape'].includes(key)) {
                const num = dem ? parseInt(dem) : (type === 'hour' ? lay12gio(gio_val_vt) : phut_val_vt);
                if (type === 'hour') capnhatgiatrivt('hour', doi24gio(Math.max(1, Math.min(12, num)), layampmhientai()));
                else capnhatgiatrivt('minute', Math.min(59, num));
                dem = '';
                digitEl.classList.remove('editing');
                document.removeEventListener('keydown', xulyban);
                document.removeEventListener('mousedown', nhanrangoai);
            }
        };
        const nhanrangoai = (e) => {
            if (e.target !== digitEl) {
                const num = dem ? parseInt(dem) : (type === 'hour' ? lay12gio(gio_val_vt) : phut_val_vt);
                if (type === 'hour') capnhatgiatrivt('hour', doi24gio(Math.max(1, Math.min(12, num)), layampmhientai()));
                else capnhatgiatrivt('minute', Math.min(59, num));
                dem = '';
                digitEl.classList.remove('editing');
                document.removeEventListener('keydown', xulyban);
                document.removeEventListener('mousedown', nhanrangoai);
            }
        };
        document.addEventListener('keydown', xulyban);
        setTimeout(() => document.addEventListener('mousedown', nhanrangoai), 0);
    }

    sogio.addEventListener('click', () => batdaunhap(sogio, 'hour'));
    sophut.addEventListener('click', () => batdaunhap(sophut, 'minute'));
    sogio.addEventListener('wheel', (e) => {
        e.preventDefault();
        const cur12h = lay12gio(gio_val_vt);
        const next12h = ((cur12h - 1 + (e.deltaY < 0 ? 1 : -1) + 12) % 12) + 1;
        capnhatgiatrivt('hour', doi24gio(next12h, layampmhientai()));
    }, { passive: false });
    sophut.addEventListener('wheel', (e) => {
        e.preventDefault();
        capnhatgiatrivt('minute', (phut_val_vt + (e.deltaY < 0 ? 1 : -1) + 60) % 60);
    }, { passive: false });
}

function caidatdropdownampm() {
    document.querySelectorAll('#ampm-dropdown .custom-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const ampmMoi = opt.dataset.val;
            const cur12h = lay12gio(gio_val_vt);
            document.querySelectorAll('#ampm-dropdown .custom-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            document.getElementById('ampm-text').textContent = ampmMoi;
            document.getElementById('ampm-dropdown').classList.remove('show');
            capnhatgiatrivt('hour', doi24gio(cur12h, ampmMoi));
            capnhatampm();
        });
    });
}

function antatnhomtudongdung() {
    [chontudongdung_nhomgio, chontudongdung_nhomchuong, chontudongdung_nhomthuc, chontudongdung_nhomtuy].forEach(n => {
        if (n) n.style.display = 'none';
    });
}

function taoinputdieukien(containerid, kieu) {
    const container = document.getElementById(containerid);
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

function docgiatridieukien(prefix) {
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

async function khoitaopopup() {
    document.getElementById('version-badge').textContent = 'v' + chrome.runtime.getManifest().version;
    const [thedanghoatdong] = await chrome.tabs.query({ active: true, currentWindow: true });
    const dangotraanchu = thedanghoatdong && thedanghoatdong.url && thedanghoatdong.url.includes('sangtacviet.com') && !thedanghoatdong.url.includes('/truyen/');
    const cacthe = await chrome.tabs.query({ url: "*://*.sangtacviet.com/*" });
    const cothestv = cacthe.length > 0;

    if (!cothestv) {
        chrome.storage.local.remove('last_active_state');
        document.getElementById('status-text').innerHTML = `${svgcanhbao} Mở trang STV trước`;
        document.getElementById('current-title').textContent = 'Chưa mở trang sangtacviet.com';
        document.getElementById('current-chap').textContent = '—';
        document.getElementById('cover-img').style.display = 'none';
        document.getElementById('book-empty-state').style.display = 'block';
        document.getElementById('book-meta').style.display = 'none';
        document.querySelector('.controls').style.display = 'none';
        document.querySelector('.status-bar').style.display = 'none';
        document.body.style.opacity = '1';
    } else {
        chrome.storage.local.get(['last_active_state'], d => {
            if (d.last_active_state && !dangotraanchu) {
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
        'batphimtat', 'doctentruyen', 'doctenchuong', 'lastVoiceName', 'smartPauses'
    ], d => {
        if (d.lastVoiceName) {
            const voiceTextEl = document.getElementById('custom-voice-text');
            if (voiceTextEl) voiceTextEl.textContent = d.lastVoiceName;
            const infoVoiceEl = document.getElementById('info-voice');
            if (infoVoiceEl) infoVoiceEl.textContent = d.lastVoiceName;
        }
        if (d.speed !== undefined) { thanhtruottocdo.value = d.speed; vanbantocdo.textContent = `${parseFloat(d.speed).toFixed(1)}×`; }
        if (d.volume !== undefined) { thanhtruotamluong.value = d.volume; vanbanamluong.textContent = `${Math.round(d.volume * 100)}%`; }
        const ochonaydoc = document.getElementById('engine-select');
        if (d.maydoc) {
            ochonaydoc.value = d.maydoc;
            requestAnimationFrame(() => ochonaydoc.dispatchEvent(new Event('change')));
        }
        if (d.batphimtat !== undefined) document.getElementById('chk-shortcuts').checked = d.batphimtat;
        if (d.doctentruyen !== undefined) document.getElementById('chk-read-book').checked = d.doctentruyen;
        if (d.doctenchuong !== undefined) document.getElementById('chk-read-chap').checked = d.doctenchuong;
        if (d.smartPauses) {
            onhapphay.value = d.smartPauses.comma || 300;
            onhapcham.value = d.smartPauses.dot || 800;
            onhapxuongdong.value = d.smartPauses.para || 1200;
        }
        chrome.storage.local.get(['stopTime', 'stopAfterChapters', 'sleepTargetTimestamp', 'stopRealtimeTarget', 'customStopConfig'], data => {
            antatnhomtudongdung();
            if (data.customStopConfig) {
                chontudongdung.value = 'custom';
                if (chontudongdung_nhomtuy) chontudongdung_nhomtuy.style.display = 'flex';
            } else if (data.stopRealtimeTarget) {
                chontudongdung.value = 'realtime';
                if (chontudongdung_nhomthuc) {
                    chontudongdung_nhomthuc.style.display = 'flex';
                    const [h, m] = data.stopRealtimeTarget.split(':');
                    if (typeof capnhatgiatrivt === 'function') {
                        capnhatgiatrivt('hour', parseInt(h));
                        capnhatgiatrivt('minute', parseInt(m));
                    }
                }
            } else if (data.sleepTargetTimestamp || data.stopTime) {
                chontudongdung.value = 'time';
                if (chontudongdung_nhomgio) chontudongdung_nhomgio.style.display = 'flex';
                if (data.stopTime) {
                    const h = Math.floor(data.stopTime / 60), m = data.stopTime % 60;
                    document.getElementById('input-stop-hours').value = h;
                    document.getElementById('input-stop-minutes').value = m;
                }
            } else if (data.stopAfterChapters) {
                chontudongdung.value = 'chapters';
                if (chontudongdung_nhomchuong) {
                    chontudongdung_nhomchuong.style.display = 'flex';
                    document.getElementById('input-stop-chapters').value = data.stopAfterChapters;
                }
            }
            const opt = chontudongdung.options[chontudongdung.selectedIndex];
            const vanbanautostop = document.getElementById('custom-autostop-text');
            if (opt && vanbanautostop) vanbanautostop.textContent = opt.textContent;
        });
    });

    if (!cothestv) return;

    let phanhoi = await guilenh('getInfo');
    const otrang = document.getElementById('book-empty-state');
    const thongtintruyen = document.getElementById('book-meta');

    if (!phanhoi || phanhoi.noTab) {
        const [thedanghoatdong2] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (thedanghoatdong2 && thedanghoatdong2.url && thedanghoatdong2.url.includes('sangtacviet.com')) {
            await new Promise(r => setTimeout(r, 800));
            phanhoi = await guilenh('getInfo');
        }
    }

    if (!phanhoi || phanhoi.noTab) {
        chrome.storage.local.remove('last_active_state');
        document.getElementById('status-text').innerHTML = `${svgcanhbao} Mở trang STV trước`;
        document.getElementById('current-title').textContent = 'Chưa mở trang sangtacviet.com';
        document.getElementById('current-chap').textContent = '—';
        document.getElementById('cover-img').style.display = 'none';
        otrang.style.display = 'block';
        thongtintruyen.style.display = 'none';
        document.getElementById('btn-open-stv').textContent = 'Mở trang sangtacviet.com ngay!';
        document.querySelector('.controls').style.display = 'none';
        document.querySelector('.status-bar').style.display = 'none';
        document.body.style.opacity = '1';
        return;
    }

    if (!phanhoi.bookTitle) {
        document.getElementById('status-text').innerHTML = `${svgcanhbao} Chọn một truyện để đọc`;
        document.getElementById('current-title').textContent = 'Đang ở trang chủ / tìm kiếm';
        document.getElementById('current-chap').textContent = '—';
        document.getElementById('current-chap').style.display = 'none';
        document.getElementById('btn-save').style.display = 'none';
        document.getElementById('cover-img').style.display = 'none';
        otrang.style.display = 'none';
        thongtintruyen.style.display = 'block';
        document.querySelector('.controls').style.display = 'none';
        document.querySelector('.status-bar').style.display = 'none';
        document.body.style.opacity = '1';
        return;
    }

    otrang.style.display = 'none';
    thongtintruyen.style.display = 'block';
    document.getElementById('cover-img').style.display = 'block';
    document.getElementById('current-chap').style.display = 'block';
    document.getElementById('btn-save').style.display = 'flex';
    document.querySelector('.controls').style.display = 'flex';
    document.querySelector('.status-bar').style.display = 'flex';
    document.body.style.opacity = '1';

    dulieutruyenhientai = { ...phanhoi, pageUrl: phanhoi.pageUrl || phanhoi.bookUrl };

    chrome.storage.local.get('readingList', data => {
        let danhsach = data.readingList || [];
        const mucdal = danhsach.findIndex(i => (i.title || '').trim().toLowerCase() === (phanhoi.bookTitle || '').trim().toLowerCase());
        if (!phanhoi.imgUrl) {
            coverImg.src = (mucdal !== -1 && danhsach[mucdal].imgUrl) ? danhsach[mucdal].imgUrl : ANH_KHUYET;
        } else {
            coverImg.src = phanhoi.imgUrl;
        }
        coverImg.style.display = 'block';
        if (mucdal !== -1) {
            dattrangthailuu(true);
            let dacapnhat = false;
            if (dulieutruyenhientai.pageUrl && danhsach[mucdal].url !== dulieutruyenhientai.pageUrl) { danhsach[mucdal].url = dulieutruyenhientai.pageUrl; dacapnhat = true; }
            if (phanhoi.chapTitle && danhsach[mucdal].chap !== phanhoi.chapTitle) { danhsach[mucdal].chap = phanhoi.chapTitle; dacapnhat = true; }
            if (phanhoi.imgUrl && danhsach[mucdal].imgUrl !== phanhoi.imgUrl) { danhsach[mucdal].imgUrl = phanhoi.imgUrl; dacapnhat = true; }
            if (dacapnhat) chrome.storage.local.set({ readingList: danhsach }, () => hienthidanhsachdoc(sapxepdanhsach(danhsach)));
        }
    });

    if (phanhoi.bookTitle) document.getElementById('current-title').textContent = phanhoi.bookTitle;
    if (phanhoi.chapTitle) document.getElementById('current-chap').textContent = phanhoi.chapTitle;

    if (phanhoi.bookUrl) {
        const motrangtruyen = () => window.open(phanhoi.bookUrl, '_blank');
        coverImg.style.cursor = 'pointer';
        coverImg.title = 'Nhấn để mở trang thông tin truyện';
        coverImg.addEventListener('click', motrangtruyen);
        const nuttieude = document.getElementById('current-title');
        nuttieude.style.cursor = 'pointer';
        nuttieude.title = 'Nhấn để mở trang thông tin truyện';
        nuttieude.addEventListener('click', motrangtruyen);
    }

    if (phanhoi.ttsEngine) capnhathuyhieu(phanhoi.ttsEngine);
    if (phanhoi.elapsed !== undefined) { giaydongho = phanhoi.elapsed; capnhatdongho(); }
    dattrangthaiphat(phanhoi.isPlaying, phanhoi.isPaused);
    if (phanhoi.isPlaying) batdaudongho();
    batdaucapnhat();
    setTimeout(taicacgiong, 300);
}

const coverImg = document.getElementById('cover-img');
const thanhtruottocdo = document.getElementById('speed-slider');
const vanbantocdo = document.getElementById('speed-val');
const thanhtruotamluong = document.getElementById('vol-slider');
const vanbanamluong = document.getElementById('vol-val');
const chktudongchuong = document.getElementById('chk-autonext');
const chontudongdung = document.getElementById('select-auto-stop');
const chontudongdung_nhomgio = document.getElementById('group-stop-time');
const chontudongdung_nhomchuong = document.getElementById('group-stop-chapters');
const chontudongdung_nhomthuc = document.getElementById('group-stop-realtime');
const chontudongdung_nhomtuy = document.getElementById('group-stop-custom');
const onhapphay = document.getElementById('pause-comma');
const onhapcham = document.getElementById('pause-dot');
const onhapxuongdong = document.getElementById('pause-para');
const nutdauhieu = document.getElementById('btn-toggle-sign');

coverImg.onerror = () => { coverImg.onerror = null; coverImg.src = ANH_KHUYET; };

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
        speed: parseFloat(thanhtruottocdo.value),
        volume: parseFloat(thanhtruotamluong.value),
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

document.getElementById('btn-prev').addEventListener('click', async () => {
    await guilenh('prevChap');
    datlaidongho();
    capnhattienhat(null);
    hienthithongbao('Đang chuyển chương trước...', 'info');
});

document.getElementById('btn-next').addEventListener('click', async () => {
    await guilenh('nextChap');
    datlaidongho();
    capnhattienhat(null);
    hienthithongbao('Đang chuyển chương sau...', 'info');
});

document.getElementById('btn-prev-chunk').addEventListener('click', async () => {
    await guilenh('prevChunk');
    capnhattrangthai();
});

document.getElementById('btn-next-chunk').addEventListener('click', async () => {
    await guilenh('nextChunk');
    capnhattrangthai();
});

document.getElementById('btn-replay').addEventListener('click', async () => {
    document.getElementById('interaction-warning').style.display = 'none';
    const v = document.getElementById('voice-select').value;
    const phanhoi = await guilenh('replayChap', {
        speed: parseFloat(thanhtruottocdo.value),
        volume: parseFloat(thanhtruotamluong.value),
        voiceIndex: isNaN(v) ? v : parseInt(v)
    });
    datlaidongho();
    if (phanhoi) dattrangthaiphat(true);
    hienthithongbao('Đọc lại chương này', 'info');
});

document.getElementById('progress-input').addEventListener('change', async (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    const tongso = parseInt(document.getElementById('progress-total').textContent) || 1;
    if (val > tongso) val = tongso;
    await guilenh('jumpToChunk', { value: val });
    capnhattrangthai();
});

document.getElementById('btn-save').addEventListener('click', () => {
    if (!dulieutruyenhientai) { hienthithongbao('Không có truyện nào đang mở', 'warning'); return; }
    chrome.storage.local.get('readingList', data => {
        const danhsach = data.readingList || [];
        const vitri = danhsach.findIndex(i => (i.title || '').trim().toLowerCase() === (dulieutruyenhientai.bookTitle || '').trim().toLowerCase());
        if (vitri !== -1) {
            danhsach.splice(vitri, 1);
            chrome.storage.local.set({ readingList: danhsach }, () => {
                danhsachdochientai = danhsach;
                hienthidanhsachdoc(sapxepdanhsach(danhsach));
                dattrangthailuu(false);
                document.getElementById('info-count').textContent = `${danhsach.length} truyện`;
                hienthithongbao('Đã bỏ lưu truyện', 'info');
            });
        } else {
            kiemtravalamsachdungluong().then(() => {
                chrome.storage.local.get('readingList', d => {
                    let danhsach = d.readingList || [];
                    if (danhsach.length >= 50) danhsach.shift();
                    danhsach.push({
                        title: dulieutruyenhientai.bookTitle,
                        chap: dulieutruyenhientai.chapTitle,
                        imgUrl: dulieutruyenhientai.imgUrl,
                        url: dulieutruyenhientai.pageUrl,
                        chunkIndex: dulieutruyenhientai.progress ? dulieutruyenhientai.progress.current : null,
                        chunkTotal: dulieutruyenhientai.progress ? dulieutruyenhientai.progress.total : null,
                        savedAt: new Date().toLocaleDateString('vi-VN'),
                        timestamp: Date.now()
                    });
                    chrome.storage.local.set({ readingList: danhsach }, () => {
                        danhsachdochientai = danhsach;
                        hienthidanhsachdoc(sapxepdanhsach(danhsach));
                        dattrangthailuu(true);
                        document.getElementById('info-count').textContent = `${danhsach.length} truyện`;
                        hienthithongbao('Đã lưu truyện thành công!', 'success');
                    });
                });
            });
        }
    });
});

document.getElementById('btn-open-stv').addEventListener('click', () => {
    window.open('https://sangtacviet.com', '_blank');
});

thanhtruottocdo.addEventListener('input', () => {
    const v = parseFloat(thanhtruottocdo.value).toFixed(1);
    vanbantocdo.textContent = `${v}×`;
    guilenh('setSpeed', { value: parseFloat(v) });
    chrome.storage.sync.set({ speed: parseFloat(v) });
});

thanhtruotamluong.addEventListener('input', () => {
    const v = parseFloat(thanhtruotamluong.value);
    vanbanamluong.textContent = `${Math.round(v * 100)}%`;
    guilenh('setVolume', { value: v });
    chrome.storage.sync.set({ volume: v });
});

document.getElementById('btn-mute').addEventListener('click', () => {
    const amluong = parseFloat(thanhtruotamluong.value);
    const bieutuongtatam = document.getElementById('mute-icon');
    if (amluong > 0) {
        amluongtruoc = amluong;
        thanhtruotamluong.value = 0;
        bieutuongtatam.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
    } else {
        thanhtruotamluong.value = amluongtruoc || 1.0;
        bieutuongtatam.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>';
    }
    thanhtruotamluong.dispatchEvent(new Event('input'));
});

chrome.storage.sync.get('tudongchuyenchuong', d => {
    const giaTri = d.tudongchuyenchuong !== undefined ? d.tudongchuyenchuong : true;
    chktudongchuong.checked = giaTri;
    guilenh('setAuto', { value: giaTri });
});
chktudongchuong.addEventListener('change', e => {
    const giaTri = e.target.checked;
    guilenh('setAuto', { value: giaTri });
    chrome.storage.sync.set({ tudongchuyenchuong: giaTri });
});

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
    const oapi = document.getElementById('api-settings-box');
    const inputregion = document.getElementById('api-region-input');
    const inputkey = document.getElementById('api-key-input');
    const cankey = ['fpt', 'azure'].includes(congcu);
    oapi.style.display = cankey ? 'block' : 'none';
    inputregion.style.display = congcu === 'azure' ? 'block' : 'none';
    const placeholdermap = { fpt: 'Nhập FPT.AI API Key...', azure: 'Nhập Azure Subscription Key...' };
    if (placeholdermap[congcu]) inputkey.placeholder = placeholdermap[congcu];
    await guilenh('setEngine', { value: congcu });
    if (!['fpt', 'azure'].includes(congcu)) chrome.storage.sync.set({ maydoc: congcu });
    capnhathuyhieu(congcu);
    const ochongiong = document.getElementById('voice-select');
    const goiygiong = document.getElementById('voice-hint');
    ochongiong.disabled = false;
    if (congcu === 'web' || congcu === 'auto') {
        taicacgiong();
    } else {
        if (congcu === 'fpt') {
            ochongiong.innerHTML = `
                <option value="0">Ban Mai (Nữ Bắc)</option>
                <option value="1">Lê Minh (Nam Bắc)</option>
                <option value="2">Thu Minh (Nữ Bắc)</option>
                <option value="3">Mỹ An (Nữ Trung)</option>
                <option value="4">Gia Huy (Nam Trung)</option>
                <option value="5">Lan Nhi (Nữ Nam)</option>
                <option value="6">Linh San (Nữ Nam)</option>
            `;
        } else if (congcu === 'azure') {
            ochongiong.innerHTML = `
                <option value="0">Hoài My (Nữ)</option>
                <option value="1">Nam Minh (Nam)</option>
            `;
        }
        if (goiygiong) goiygiong.style.display = 'none';
        ochongiong.selectedIndex = 0;
        const chongiong = parseInt(ochongiong.value) || 0;
        document.getElementById('info-voice').textContent = ochongiong.options[0].textContent;
        hienthiochontuychinh();
        chrome.storage.sync.set({ voiceIndex: chongiong });
        guilenh('setVoice', { value: chongiong });
    }
    if (cankey) {
        chrome.storage.local.get([`${congcu}_key`, 'azure_region'], d => {
            inputkey.value = d[`${congcu}_key`] || '';
            if (congcu === 'azure') inputregion.value = d.azure_region || '';
        });
    }
});

document.getElementById('btn-save-api').addEventListener('click', async () => {
    const congcu = document.getElementById('engine-select').value;
    const key = document.getElementById('api-key-input').value.trim();
    const region = document.getElementById('api-region-input').value.trim();
    if (!key) { hienthithongbao('Vui lòng nhập API Key', 'warning'); return; }
    const icon = document.getElementById('btn-save-api-icon');
    const nhanlabel = document.getElementById('btn-save-api-text');
    const nut = document.getElementById('btn-save-api');
    const luukey = () => {
        const dulieu = { [`${congcu}_key`]: key };
        if (congcu === 'azure') dulieu['azure_region'] = region || 'southeastasia';
        chrome.storage.local.set(dulieu, () => { guilenh('setApiKeys', dulieu); });
    };
    nut.disabled = true;
    icon.innerHTML = `<line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>`;
    nhanlabel.textContent = 'Đang kiểm tra...';
    try {
        let thanhcong = false;
        if (congcu === 'fpt') {
            const r = await fetch('https://api.fpt.ai/hmi/tts/v5', { method: 'POST', headers: { 'api-key': key }, body: 'Kiểm tra' });
            thanhcong = r.ok;
        } else if (congcu === 'azure') {
            const REGION_PATTERN = /^[a-z0-9-]{2,30}$/;
            const regionVal = REGION_PATTERN.test(region) ? region : 'southeastasia';
            const r = await fetch(`https://${regionVal}.tts.speech.microsoft.com/cognitiveservices/v1`, {
                method: 'POST',
                headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3' },
                body: `<speak version='1.0' xml:lang='vi-VN'><voice xml:lang='vi-VN' name='vi-VN-HoaiMyNeural'>Kiểm tra</voice></speak>`
            });
            thanhcong = r.ok;
        }
        if (thanhcong) {
            luukey();
            chrome.storage.sync.set({ maydoc: congcu });
            icon.innerHTML = SVG_TICH;
            nhanlabel.textContent = 'Đã lưu!';
            hienthithongbao('API Key hợp lệ, đã lưu!', 'success');
            setTimeout(() => { icon.innerHTML = SVG_LUU; nhanlabel.textContent = 'Lưu API Key'; }, 2000);
        } else {
            document.getElementById('api-key-input').value = '';
            icon.innerHTML = SVG_LUU;
            nhanlabel.textContent = 'Lưu API Key';
            hienthithongbao('API Key không hợp lệ! Đã trở về nguồn đọc cũ.', 'warning');
            chrome.storage.sync.get('maydoc', d => {
                const enginecu = d.maydoc || 'web';
                const engineSelect = document.getElementById('engine-select');
                if (engineSelect.value !== enginecu) {
                    engineSelect.value = enginecu;
                    engineSelect.dispatchEvent(new Event('change'));
                } else {
                    guilenh('setEngine', { value: enginecu });
                    capnhathuyhieu(enginecu);
                }
            });
        }
    } catch (e) {
        const isNetworkError = e instanceof TypeError;
        if (isNetworkError) {
            luukey();
            chrome.storage.sync.set({ maydoc: congcu });
            icon.innerHTML = SVG_TICH;
            nhanlabel.textContent = 'Đã lưu!';
            hienthithongbao('Lỗi mạng khi xác minh — đã lưu key, hãy test lại sau.', 'warning');
            setTimeout(() => { icon.innerHTML = SVG_LUU; nhanlabel.textContent = 'Lưu API Key'; }, 2000);
        } else {
            icon.innerHTML = SVG_LUU;
            nhanlabel.textContent = 'Lưu API Key';
            hienthithongbao('Lỗi không xác định khi kiểm tra API Key.', 'warning');
        }
    } finally {
        nut.disabled = false;
    }
});

document.getElementById('btn-test-api').addEventListener('click', async () => {
    const congcu = document.getElementById('engine-select').value;
    const key = document.getElementById('api-key-input').value.trim();
    if (!key) { hienthithongbao('Vui lòng nhập API Key để thử', 'warning'); return; }
    const nut = document.getElementById('btn-test-api');
    const chhancu = nut.textContent;
    nut.disabled = true;
    nut.textContent = 'Đang thử...';
    try {
        let thanhcong = false;
        if (congcu === 'fpt') {
            const r = await fetch('https://api.fpt.ai/hmi/tts/v5', { method: 'POST', headers: { 'api-key': key }, body: 'Kiểm tra' });
            thanhcong = r.ok;
        } else if (congcu === 'azure') {
            const REGION_PATTERN = /^[a-z0-9-]{2,30}$/;
            const region = REGION_PATTERN.test(document.getElementById('api-region-input').value.trim())
                ? document.getElementById('api-region-input').value.trim()
                : 'southeastasia';
            if (!document.getElementById('api-region-input').value.trim()) hienthithongbao('Region trống, sử dụng mặc định: southeastasia', 'info');
            const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
                method: 'POST',
                headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3' },
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
        nut.textContent = chhancu;
    }
});

document.getElementById('btn-add-dict').addEventListener('click', () => {
    const goc = document.getElementById('dict-origin').value.trim();
    const thaythe = document.getElementById('dict-replace').value.trim();
    if (!goc || !thaythe) { hienthithongbao('Vui lòng nhập đủ 2 ô!', 'warning'); return; }
    if (tudienhientai.length >= 50 && tudienhientai.findIndex(r => r.origin.toLowerCase() === goc.toLowerCase()) === -1) {
        hienthithongbao('Chỉ được phép thêm tối đa 50 quy tắc. Vui lòng xóa bớt trước khi thêm mới.', 'warning');
        return;
    }
    const vitritontai = tudienhientai.findIndex(r => r.origin.toLowerCase() === goc.toLowerCase());
    if (vitritontai !== -1) {
        tudienhientai[vitritontai].replace = thaythe;
    } else {
        tudienhientai.unshift({ origin: goc, replace: thaythe });
    }
    chrome.storage.local.set({ customDict: tudienhientai }, () => {
        document.getElementById('dict-origin').value = '';
        document.getElementById('dict-replace').value = '';
        hienthitudien();
        hienthithongbao('Đã thêm vào từ điển!', 'success');
    });
});

document.getElementById('btn-export-data').addEventListener('click', () => {
    chrome.storage.sync.get(['customDict', 'speed', 'volume'], syncData => {
        chrome.storage.local.get(null, localData => {
            const backupData = {
                readingList: localData.readingList || [],
                fpt_key: localData.fpt_key || '',
                azure_key: localData.azure_key || '',
                azure_region: localData.azure_region || '',
                customDict: localData.customDict || syncData.customDict || [],
                speed: syncData.speed,
                volume: syncData.volume,
                maydoc: syncData.maydoc
            };
            hienthithongbao('File backup chứa API Key — không chia sẻ cho người khác!', 'warning');
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `AutoDocSTV_Backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setTimeout(() => hienthithongbao('Đã tải xuống file sao lưu!', 'success'), 3000);
        });
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
            chrome.storage.local.get('readingList', data => {
                let danhsachu = data.readingList || [];
                let danhsachnhap = parsedData.readingList || [];
                danhsachnhap.forEach(muc => {
                    const idx = danhsachu.findIndex(i => (i.title || '').trim().toLowerCase() === (muc.title || '').trim().toLowerCase());
                    if (idx === -1) {
                        danhsachu.push(muc);
                    } else {
                        if (muc.chunkIndex > danhsachu[idx].chunkIndex) danhsachu[idx] = muc;
                    }
                });
                parsedData.readingList = danhsachu;

                const { readingList, fpt_key, azure_key, azure_region, maydoc } = parsedData;
                const { customDict, speed, volume } = parsedData;
                chrome.storage.local.set({ readingList, fpt_key, azure_key, azure_region, maydoc, customDict }, () => {
                    chrome.storage.sync.set({ speed, volume, maydoc }, () => {
                        hienthithongbao('Phục hồi thành công! Đang tải lại...', 'success');
                        setTimeout(() => window.location.reload(), 1500);
                    });
                });
            });
        } catch (err) {
            hienthithongbao('File backup không hợp lệ!', 'warning');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
});

document.getElementById('btn-clear-all').addEventListener('click', () => {
    const modal = document.getElementById('confirm-modal');
    document.getElementById('modal-title').textContent = 'Xoá tất cả dữ liệu';
    document.getElementById('modal-body').textContent = 'Thao tác này sẽ xoá TẤT CẢ dữ liệu: danh sách đọc, API Key, cài đặt tốc độ, âm lượng, giọng đọc... Bạn có chắc chắn?';
    modal.classList.add('show');
    const onXacNhan = () => {
        chrome.storage.local.clear(() => {
            chrome.storage.sync.clear(() => {
                danhsachdochientai = [];
                hienthidanhsachdoc([]);
                document.getElementById('info-count').textContent = '0 truyện';
                dattrangthailuu(false);
                thanhtruottocdo.value = 1.0;
                vanbantocdo.textContent = '1.0×';
                thanhtruotamluong.value = 1;
                vanbanamluong.textContent = '100%';
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
                const vanbanautostop = document.getElementById('custom-autostop-text');
                if (vanbanautostop) vanbanautostop.textContent = 'Không có';
                const baygiomoi = new Date();
                gio_val_vt = baygiomoi.getHours();
                phut_val_vt = baygiomoi.getMinutes();
                capnhatgiatrivt('hour', gio_val_vt);
                capnhatgiatrivt('minute', phut_val_vt);
                antatnhomtudongdung();
                capnhathuyhieu('web');
                onhapphay.value = 300;
                onhapcham.value = 800;
                onhapxuongdong.value = 1200;
                guilenh('stopPlay');
                hienthithongbao('Đã xoá toàn bộ dữ liệu tiện ích', 'info');
                tudienhientai = [];
                hienthitudien();
            });
        });
        modal.classList.remove('show');
        dondepcleaup();
    };
    const onHuy = () => { modal.classList.remove('show'); dondepcleaup(); };
    const dondepcleaup = () => {
        document.getElementById('modal-confirm').removeEventListener('click', onXacNhan);
        document.getElementById('modal-cancel').removeEventListener('click', onHuy);
        modal.removeEventListener('click', nhannenmodal);
    };
    const nhannenmodal = (e) => { if (e.target === modal) onHuy(); };
    document.getElementById('modal-confirm').addEventListener('click', onXacNhan);
    document.getElementById('modal-cancel').addEventListener('click', onHuy);
    modal.addEventListener('click', nhannenmodal);
});

document.getElementById('list-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    const co = q ? danhsachdochientai.filter(i => i.title.toLowerCase().includes(q) || (i.chap && i.chap.toLowerCase().includes(q))) : danhsachdochientai;
    hienthidanhsachdoc(sapxepdanhsach(co));
});

document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        cheodosapxep = btn.dataset.sort;
        const q = document.getElementById('list-search').value.toLowerCase().trim();
        const co = q ? danhsachdochientai.filter(i => i.title.toLowerCase().includes(q) || (i.chap && i.chap.toLowerCase().includes(q))) : danhsachdochientai;
        hienthidanhsachdoc(sapxepdanhsach(co));
    });
});

function dongboEngine(callback) {
    chrome.storage.sync.get('maydoc', d => {
        const enginedaluu = d.maydoc || 'web';
        const engineSelect = document.getElementById('engine-select');
        if (engineSelect.value !== enginedaluu) {
            engineSelect.value = enginedaluu;
            engineSelect.dispatchEvent(new Event('change'));
        }
        capnhathuyhieu(enginedaluu);
        if (callback) callback(enginedaluu);
    });
}

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const panelmuctieu = document.getElementById(`panel-${tab.dataset.tab}`);
        const danhoatdong = panelmuctieu && panelmuctieu.classList.contains('active');
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        if (danhoatdong && tab.dataset.tab !== 'main') {
            document.getElementById('panel-main').classList.add('active');
            chrome.storage.sync.get('maydoc', d => {
                const enginedaluu = d.maydoc || 'web';
                const engineSelect = document.getElementById('engine-select');
                if (engineSelect.value !== enginedaluu) {
                    engineSelect.value = enginedaluu;
                    engineSelect.dispatchEvent(new Event('change'));
                }
                capnhathuyhieu(enginedaluu);
            });
        } else {
            tab.classList.add('active');
            if (panelmuctieu) panelmuctieu.classList.add('active');
            if (tab.dataset.tab === 'settings') {
                chrome.storage.sync.get('maydoc', d => {
                    const engineSelect = document.getElementById('engine-select');
                    const enginedaluu = d.maydoc || 'web';
                    if (engineSelect.value !== enginedaluu) {
                        engineSelect.value = enginedaluu;
                        engineSelect.dispatchEvent(new Event('change'));
                    } else {
                        const cankey = ['fpt', 'azure'].includes(enginedaluu);
                        if (cankey) {
                            chrome.storage.local.get([`${enginedaluu}_key`, 'azure_region'], d2 => {
                                document.getElementById('api-key-input').value = d2[`${enginedaluu}_key`] || '';
                                if (enginedaluu === 'azure') document.getElementById('api-region-input').value = d2.azure_region || '';
                            });
                        }
                    }
                });
                const noteContent = document.getElementById('pause-note-content');
                const btnNote = document.getElementById('btn-show-pause-note');

                if (noteContent) {
                    noteContent.style.display = 'none';
                    if (btnNote) btnNote.textContent = 'Xem lưu ý';
                }
            }
            if (tab.dataset.tab === 'main') {
                chrome.storage.sync.get('maydoc', d => {
                    const enginedaluu = d.maydoc || 'web';
                    const engineSelect = document.getElementById('engine-select');
                    if (engineSelect.value !== enginedaluu) {
                        engineSelect.value = enginedaluu;
                        engineSelect.dispatchEvent(new Event('change'));
                    }
                    capnhathuyhieu(enginedaluu);
                });
            }
        }
    });
});

chontudongdung.addEventListener('change', e => {
    const v = e.target.value;
    antatnhomtudongdung();
    if (v === 'time' && chontudongdung_nhomgio) chontudongdung_nhomgio.style.display = 'flex';
    else if (v === 'chapters' && chontudongdung_nhomchuong) chontudongdung_nhomchuong.style.display = 'flex';
    else if (v === 'realtime' && chontudongdung_nhomthuc) {
        chontudongdung_nhomthuc.style.display = 'flex';
        chrome.storage.local.get('stopRealtimeTarget', d => {
            if (!d.stopRealtimeTarget) {
                const baylicuoi = new Date();
                gio_val_vt = baylicuoi.getHours();
                phut_val_vt = baylicuoi.getMinutes();
                capnhatgiatrivt('hour', gio_val_vt);
                capnhatgiatrivt('minute', phut_val_vt);
            }
        });
    }
    else if (v === 'custom' && chontudongdung_nhomtuy) chontudongdung_nhomtuy.style.display = 'flex';
    else if (v === 'off') {
        guilenh('setSleepTimer', { minutes: 0 });
        guilenh('setStopChapters', { count: 0 });
        guilenh('setCustomStop', { config: null });
        chrome.storage.local.remove(['stopTime', 'sleepTargetTimestamp', 'stopRealtimeTarget', 'customStopConfig', 'stopAfterChapters']);
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

document.getElementById('btn-apply-stop-realtime').addEventListener('click', () => {
    const h24 = gio_val_vt;
    const m = phut_val_vt;
    const giotruc = `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const baygio2 = new Date(), muctieu = new Date();
    muctieu.setHours(h24, m, 0, 0);
    if (muctieu <= baygio2) muctieu.setDate(muctieu.getDate() + 1);
    const tongphut = Math.ceil((muctieu - baygio2) / 60000);
    chrome.storage.local.remove(['stopTime', 'stopAfterChapters', 'customStopConfig'], () => {
        guilenh('setSleepTimer', { minutes: tongphut });
        guilenh('setStopChapters', { count: 0 });
        chrome.storage.local.set({ stopRealtimeTarget: giotruc, stopTime: tongphut });
        hienthithongbao(`Sẽ dừng lúc ${giotruc}`, 'success');
    });
});

document.getElementById('btn-apply-stop-chapters').addEventListener('click', () => {
    const sochuong = parseInt(document.getElementById('input-stop-chapters').value);
    if (isNaN(sochuong) || sochuong <= 0) return;
    chrome.storage.local.remove(['stopTime', 'stopRealtimeTarget', 'customStopConfig'], () => {
        guilenh('setSleepTimer', { minutes: 0 });
        guilenh('setStopChapters', { count: sochuong });
        chrome.storage.local.set({ stopAfterChapters: sochuong });
        hienthithongbao(`Sẽ dừng sau ${sochuong} chương nữa`, 'success');
    });
});

if (nutdauhieu) {
    nutdauhieu.addEventListener('click', () => {
        ladaucong = !ladaucong;
        nutdauhieu.textContent = ladaucong ? '+' : '-';
        nutdauhieu.style.color = ladaucong ? 'var(--accent)' : 'var(--danger)';
        nutdauhieu.style.borderColor = ladaucong ? 'var(--accent)' : 'var(--danger)';
    });
}

document.querySelectorAll('.preset-time').forEach(btn => {
    btn.addEventListener('click', () => {
        const luongthoigian = parseInt(btn.dataset.min) || 0;
        let gio = parseInt(document.getElementById('input-stop-hours').value) || 0;
        let phut = parseInt(document.getElementById('input-stop-minutes').value) || 0;
        let tongphut = gio * 60 + phut;
        if (ladaucong) { tongphut += luongthoigian; } else { tongphut -= luongthoigian; if (tongphut < 0) tongphut = 0; }
        gio = Math.floor(tongphut / 60);
        phut = tongphut % 60;
        document.getElementById('input-stop-hours').value = gio;
        document.getElementById('input-stop-minutes').value = phut;
    });
});

document.getElementById('custom-left-type').addEventListener('change', e => taoinputdieukien('custom-left-input', e.target.value));
document.getElementById('custom-right-type').addEventListener('change', e => taoinputdieukien('custom-right-input', e.target.value));

document.getElementById('btn-apply-stop-custom').addEventListener('click', () => {
    const trai = docgiatridieukien('left');
    const phai = docgiatridieukien('right');
    const op = document.getElementById('custom-operator').value;
    if (!trai && !phai) { hienthithongbao('Vui lòng chọn ít nhất một điều kiện hợp lệ', 'warning'); return; }
    if (trai && phai && trai.type === phai.type) { hienthithongbao('Vui lòng chọn 2 điều kiện khác loại nhau', 'warning'); return; }
    const config = { operator: op, left: trai, right: phai };
    chrome.storage.local.remove(['stopTime', 'stopRealtimeTarget', 'stopAfterChapters'], () => {
        guilenh('setCustomStop', { config });
        const cacdk = [trai, phai].filter(Boolean);
        const dktime = cacdk.find(c => c.type === 'time' || c.type === 'realtime');
        const dkchuong = cacdk.find(c => c.type === 'chapters');
        if (dktime) guilenh('setSleepTimer', { minutes: dktime.minutes });
        else guilenh('setSleepTimer', { minutes: 0 });
        if (dkchuong) guilenh('setStopChapters', { count: dkchuong.count });
        else guilenh('setStopChapters', { count: 0 });
        const mota = cacdk.map(c => {
            if (c.type === 'time') { const g = Math.floor(c.minutes / 60), p = c.minutes % 60; return g > 0 ? `${g}g${p > 0 ? ` ${p}p` : ''}` : `${p}p`; }
            if (c.type === 'realtime') return `lúc ${c.displayTime}`;
            if (c.type === 'chapters') return `${c.count} chương`;
            return '';
        }).join(op === 'and' ? ' VÀ ' : ' HOẶC ');
        hienthithongbao(`Sẽ dừng: ${mota}`, 'success');
        chrome.storage.local.set({ customStopConfig: config });
    });
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

if (onhapphay && onhapcham && onhapxuongdong) {
    [onhapphay, onhapcham, onhapxuongdong].forEach(inp => {
        inp.addEventListener('change', luukhoangnghi);
    });
}

document.querySelectorAll('.pause-step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const delta = parseInt(btn.dataset.delta, 10);
        const newVal = Math.max(0, (parseInt(input.value, 10) || 0) + delta);
        input.value = newVal;
        luukhoangnghi();
    });
});

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

document.addEventListener('click', (e) => {
    const trongvung = e.target.closest('.custom-select-container');
    if (!trongvung) {
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

caidatochontinh('custom-left-type', 'text-left-type', 'dropdown-left-type');
caidatochontinh('custom-right-type', 'text-right-type', 'dropdown-right-type');
caidatochontinh('custom-operator', 'text-operator', 'dropdown-operator');
caidatochontinh('engine-select', 'custom-engine-text', 'custom-engine-dropdown');
caidatochontinh('select-auto-stop', 'custom-autostop-text', 'custom-autostop-dropdown');

chrome.storage.local.get('customDict', dulieudiaphuong => {
    if (dulieudiaphuong.customDict) {
        tudienhientai = dulieudiaphuong.customDict;
        hienthitudien();
    } else {
        chrome.storage.sync.get('customDict', d => {
            tudienhientai = d.customDict || [];
            hienthitudien();
            if (tudienhientai.length > 0) chrome.storage.local.set({ customDict: tudienhientai });
        });
    }
});

setTimeout(() => {
    const nutgio = document.getElementById('hour-handle');
    const nutphut = document.getElementById('minute-handle');
    if (!nutgio || !nutphut) return;
    vedauvach();
    caidatnhapso();
    caidatdropdownampm();

    function laygoctoadochuot(clientX, clientY, svgEl, cx, cy) {
        const r = svgEl.getBoundingClientRect();
        const sx = 190 / r.width, sy = 190 / r.height;
        const mx = (clientX - r.left) * sx, my = (clientY - r.top) * sy;
        return (Math.atan2(my - cy, mx - cx) * (180 / Math.PI) + 90 + 360) % 360;
    }

    function khoitaokeonut(handle, loaivong) {
        let dangkeo = false;
        const svgEl = handle.ownerSVGElement;
        const CENTER = 95;
        const khididichcuyen = (clientX, clientY) => {
            const deg = laygoctoadochuot(clientX, clientY, svgEl, CENTER, CENTER);
            if (loaivong === 'hour') {
                const step = Math.round(deg / (360 / 12));
                const h12 = step === 0 ? 12 : step;
                capnhatgiatrivt('hour', doi24gio(h12, layampmhientai()));
            } else {
                capnhatgiatrivt('minute', Math.round(deg / (360 / 60)) % 60);
            }
        };
        handle.addEventListener('mousedown', (e) => { dangkeo = true; handle.classList.add('dragging'); e.preventDefault(); });
        window.addEventListener('mousemove', (e) => { if (dangkeo) khididichcuyen(e.clientX, e.clientY); });
        window.addEventListener('mouseup', () => { dangkeo = false; handle.classList.remove('dragging'); });
        handle.addEventListener('touchstart', (e) => { dangkeo = true; handle.classList.add('dragging'); e.preventDefault(); }, { passive: false });
        window.addEventListener('touchmove', (e) => { if (dangkeo) khididichcuyen(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
        window.addEventListener('touchend', () => { dangkeo = false; handle.classList.remove('dragging'); });
    }

    khoitaokeonut(nutgio, 'hour');
    khoitaokeonut(nutphut, 'minute');
    capnhatgiatrivt('hour', gio_val_vt);
    capnhatgiatrivt('minute', phut_val_vt);
}, 500);

khoitaopopup().finally(() => {
    document.body.style.opacity = '1';
    const btnNote = document.getElementById('btn-show-pause-note');
    const noteContent = document.getElementById('pause-note-content');
    if (btnNote && noteContent) {
        btnNote.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = noteContent.style.display === 'none';
            noteContent.style.display = isHidden ? 'block' : 'none';
            btnNote.textContent = isHidden ? 'Đóng lưu ý' : 'Xem lưu ý';
        });
    }
});
taidanhsachdoc();