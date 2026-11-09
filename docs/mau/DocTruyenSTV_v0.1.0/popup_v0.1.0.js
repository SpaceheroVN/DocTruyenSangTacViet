'use strict';
const ANH_BIA_DU_PHONG = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='54' height='78' viewBox='0 0 24 24' fill='none' stroke='%237a7896' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3.6 3.6A2 2 0 0 1 5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-.59 1.41'/%3E%3Cpath d='M3 8.7V19a2 2 0 0 0 2 2h10.3'/%3E%3Cpath d='m2 2 20 20'/%3E%3Cpath d='M13 13a3 3 0 1 0 0-6H9v2'/%3E%3Cpath d='M9 17v-2.3'/%3E%3C/svg%3E";
const SVG_PHAT = `<polygon points="5 3 19 12 5 21 5 3"/>`;
const SVG_TAM_DUNG = `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`;
const SVG_DAU_TRANG = `<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>`;
const SVG_DAU_TRANG_DA_CHON = `<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/><polyline points="9 10 12 13 15 7"/>`;
const SVG_LUU = `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>`;
const SVG_KIEM_TRA = `<polyline points="20 6 9 17 4 12"/>`;

let khoangThoiGianBoDem = null;
let giayBoDem = 0;
let trangThaiCuoiCung = { isPlaying: false, isPaused: false };
let khoangThoiGianThamDo = null;
let duLieuTruyenHienTai = null;
let idTheDangDoc = null;

async function guiToiThe(idThe, lenh, them = {}) {
    return new Promise(resolve => {
        chrome.tabs.sendMessage(idThe, { action: lenh, ...them }, phanHoi => {
            void chrome.runtime.lastError;
            resolve(phanHoi);
        });
    });
}

async function guiLenh(lenh, them = {}) {
    if (idTheDangDoc) {
        const phanHoi = await guiToiThe(idTheDangDoc, lenh, them);
        if (phanHoi !== undefined) return phanHoi;
        idTheDangDoc = null;
    }

    const cacTheStv = await chrome.tabs.query({ url: ['*://sangtacviet.com/*', '*://www.sangtacviet.com/*'] });

    if (cacTheStv.length > 0) {
        let theDangHoatDong = null;
        let theDuPhong = null;
        for (const the of cacTheStv) {
            const trangThai = await guiToiThe(the.id, 'getStatus');
            if (trangThai) {
                if (!theDuPhong) theDuPhong = the;
                if (trangThai.isPlaying || trangThai.isPaused) { theDangHoatDong = the; break; }
            }
        }
        const theMucTieu = theDangHoatDong || theDuPhong;
        if (theMucTieu) {
            idTheDangDoc = theMucTieu.id;
            return await guiToiThe(theMucTieu.id, lenh, them);
        }
    }

    const cacTheHienTai = await chrome.tabs.query({ active: true, currentWindow: true });
    if (cacTheHienTai.length > 0) return await guiToiThe(cacTheHienTai[0].id, lenh, them);

    return null;
}

let thoiGianChoThongBao = null;
function hienThongBao(thongDiep, loai = 'info') {
    const thongBao = document.getElementById('toast');
    if (!thongBao) return;
    let iconSvg = '';
    if (loai === 'success') iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    if (loai === 'info') iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    if (loai === 'warning') iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    thongBao.innerHTML = `${iconSvg} <span>${thongDiep}</span>`;
    thongBao.className = `toast toast-${loai} show`;
    clearTimeout(thoiGianChoThongBao);
    thoiGianChoThongBao = setTimeout(() => thongBao.classList.remove('show'), 2800);
}

function batDauBoDem() {
    if (khoangThoiGianBoDem) return;
    khoangThoiGianBoDem = setInterval(() => { giayBoDem++; capNhatHienThiBoDem(); }, 1000);
}

function tamDungBoDem() {
    clearInterval(khoangThoiGianBoDem);
    khoangThoiGianBoDem = null;
}

function datLaiBoDem() {
    tamDungBoDem();
    giayBoDem = 0;
    capNhatHienThiBoDem();
}

function capNhatHienThiBoDem() {
    const phut = String(Math.floor(giayBoDem / 60)).padStart(2, '0');
    const giay = String(giayBoDem % 60).padStart(2, '0');
    const thanhPhanBoDem = document.getElementById('timer-text');
    if (thanhPhanBoDem) thanhPhanBoDem.textContent = `${phut}:${giay}`;
}

function thietLapTrangThaiPhat(dangPhat, dangTamDung = false) {
    trangThaiCuoiCung = { isPlaying: dangPhat, isPaused: dangTamDung };
    const diem = document.getElementById('status-dot');
    const vanBanTrangThai = document.getElementById('status-text');
    const bieuTuong = document.getElementById('btn-play-icon');
    const vanBanNut = document.getElementById('btn-play-text');
    if (diem) diem.className = 'status-dot';

    if (dangPhat) {
        const canhBaoTuongTac = document.getElementById('interaction-warning');
        if (canhBaoTuongTac) canhBaoTuongTac.style.display = 'none';
        if (diem) diem.classList.add('playing');
        if (vanBanTrangThai) vanBanTrangThai.textContent = 'Đang đọc...';
        if (bieuTuong) bieuTuong.innerHTML = SVG_TAM_DUNG;
        if (vanBanNut) vanBanNut.textContent = 'Dừng';
        batDauBoDem();
    } else if (dangTamDung) {
        if (diem) diem.classList.add('paused');
        if (vanBanTrangThai) vanBanTrangThai.textContent = 'Đang tạm dừng';
        if (bieuTuong) bieuTuong.innerHTML = SVG_PHAT;
        if (vanBanNut) vanBanNut.textContent = 'Tiếp tục';
        tamDungBoDem();
    } else {
        if (vanBanTrangThai) vanBanTrangThai.textContent = 'Sẵn sàng';
        if (bieuTuong) bieuTuong.innerHTML = SVG_PHAT;
        if (vanBanNut) vanBanNut.textContent = 'Nghe';
        tamDungBoDem();
    }
}

function capNhatTienDo(tienDo) {
    const el = document.getElementById('progress-text');
    if (!el) return;
    el.textContent = (tienDo && tienDo.total > 0) ? `${tienDo.current}/${tienDo.total}` : '0/0';
}

function capNhatHuyHieuTts(dongCo) {
    const huyHieu = document.getElementById('tts-badge');
    if (!huyHieu) return;
    const banDo = {
        web: ['Web TTS', 'var(--success)', 'var(--success)'],
        fpt: ['FPT.AI', 'var(--accent2)', 'var(--accent2)'],
        azure: ['Azure TTS', 'var(--accent)', 'var(--accent)'],
        google: ['Google', 'var(--success)', 'var(--success)'],
        gcp: ['GCP TTS', 'var(--success)', 'var(--success)'],
    };
    const [nhan, vien, mau] = banDo[dongCo] || banDo.web;
    huyHieu.textContent = nhan;
    huyHieu.style.borderColor = vien;
    huyHieu.style.color = mau;
}

async function thamDoTrangThai() {
    const phanHoi = await guiLenh('getStatus');
    if (!phanHoi) return;
    const { isPlaying, isPaused, progress, ttsEngine, elapsed } = phanHoi;
    if (elapsed !== undefined && Math.abs(giayBoDem - elapsed) > 2) {
        giayBoDem = elapsed;
        capNhatHienThiBoDem();
    }
    if (isPlaying !== trangThaiCuoiCung.isPlaying || isPaused !== trangThaiCuoiCung.isPaused) {
        thietLapTrangThaiPhat(isPlaying, isPaused);
        if (!isPlaying && !isPaused) datLaiBoDem();
    }
    if (ttsEngine) capNhatHuyHieuTts(ttsEngine);
    capNhatTienDo(progress);
}

function batDauThamDo() {
    if (khoangThoiGianThamDo) return;
    khoangThoiGianThamDo = setInterval(thamDoTrangThai, 1500);
}

function dungThamDo() {
    clearInterval(khoangThoiGianThamDo);
    khoangThoiGianThamDo = null;
}

chrome.runtime.onMessage.addListener((yeuCau) => {
    if (yeuCau.action === 'autoplayBlocked') {
        const canhBaoTuongTac = document.getElementById('interaction-warning');
        if (canhBaoTuongTac) canhBaoTuongTac.style.display = 'block';
        thietLapTrangThaiPhat(false);
        datLaiBoDem();
        capNhatTienDo(null);
    }
});

document.getElementById('btn-play').addEventListener('click', async () => {
    const canhBaoTuongTac = document.getElementById('interaction-warning');
    if (canhBaoTuongTac) canhBaoTuongTac.style.display = 'none';
    const phanHoi = await guiLenh('togglePlay', {
        speed: parseFloat(document.getElementById('speed-slider').value),
        volume: parseFloat(document.getElementById('vol-slider').value),
        voiceIndex: parseInt(document.getElementById('voice-select').value) || 0
    });
    if (phanHoi) {
        thietLapTrangThaiPhat(phanHoi.isPlaying, phanHoi.isPaused);
    } else {
        hienThongBao('Không tìm thấy nội dung truyện. Hãy mở trang đọc truyện trước.', 'warning');
    }
});

document.getElementById('btn-stop').addEventListener('click', async () => {
    await guiLenh('stopPlay');
    thietLapTrangThaiPhat(false);
    datLaiBoDem();
    capNhatTienDo(null);
});

document.getElementById('btn-next').addEventListener('click', async () => {
    await guiLenh('nextChap');
    datLaiBoDem();
    capNhatTienDo(null);
    hienThongBao('Đang chuyển chương sau...', 'info');
});

document.getElementById('btn-prev').addEventListener('click', async () => {
    await guiLenh('prevChap');
    datLaiBoDem();
    capNhatTienDo(null);
    hienThongBao('Đang chuyển chương trước...', 'info');
});

document.getElementById('btn-prev-chunk').addEventListener('click', async () => {
    await guiLenh('prevChunk');
    thamDoTrangThai();
});

document.getElementById('btn-next-chunk').addEventListener('click', async () => {
    await guiLenh('nextChunk');
    thamDoTrangThai();
});

document.getElementById('btn-replay').addEventListener('click', async () => {
    const canhBaoTuongTac = document.getElementById('interaction-warning');
    if (canhBaoTuongTac) canhBaoTuongTac.style.display = 'none';
    const phanHoi = await guiLenh('replayChap', {
        speed: parseFloat(document.getElementById('speed-slider').value),
        volume: parseFloat(document.getElementById('vol-slider').value),
        voiceIndex: parseInt(document.getElementById('voice-select').value) || 0
    });
    datLaiBoDem();
    if (phanHoi) thietLapTrangThaiPhat(true);
    hienThongBao('Đọc lại chương này', 'info');
});

const kiemTraTuDongTiepTheo = document.getElementById('chk-autonext');
chrome.storage.local.get('autoNext', duLieu => {
    const giaTri = duLieu.autoNext !== undefined ? duLieu.autoNext : true;
    if (kiemTraTuDongTiepTheo) kiemTraTuDongTiepTheo.checked = giaTri;
    guiLenh('setAuto', { value: giaTri });
});
if (kiemTraTuDongTiepTheo) {
    kiemTraTuDongTiepTheo.addEventListener('change', e => {
        const giaTri = e.target.checked;
        guiLenh('setAuto', { value: giaTri });
        chrome.storage.local.set({ autoNext: giaTri });
    });
}

const thanhTruocTocDo = document.getElementById('speed-slider');
const giaTriTocDo = document.getElementById('speed-val');
if (thanhTruocTocDo) {
    thanhTruocTocDo.addEventListener('input', () => {
        const v = parseFloat(thanhTruocTocDo.value).toFixed(1);
        if (giaTriTocDo) giaTriTocDo.textContent = `${v}×`;
        guiLenh('setSpeed', { value: parseFloat(v) });
        chrome.storage.local.set({ speed: parseFloat(v) });
    });
}

const thanhTruocAmLuong = document.getElementById('vol-slider');
const giaTriAmLuong = document.getElementById('vol-val');
if (thanhTruocAmLuong) {
    thanhTruocAmLuong.addEventListener('input', () => {
        const v = parseFloat(thanhTruocAmLuong.value);
        if (giaTriAmLuong) giaTriAmLuong.textContent = `${Math.round(v * 100)}%`;
        guiLenh('setVolume', { value: v });
        chrome.storage.local.set({ volume: v });
    });
}

async function taiCacGiong() {
    const phanHoi = await guiLenh('getVoices');
    if (!phanHoi) return;
    const dongCoHienTai = document.getElementById('engine-select').value;
    const goiYGiong = document.getElementById('voice-hint');
    if (dongCoHienTai !== 'web' && dongCoHienTai !== 'auto') {
        if (goiYGiong) goiYGiong.style.display = 'none';
        return;
    }
    const chon = document.getElementById('voice-select');
    if (!chon) return;
    chon.innerHTML = '<option value="-1">Giọng mặc định</option>';
    (phanHoi.voices || []).forEach(v => {
        const tuyChon = document.createElement('option');
        tuyChon.value = v.index;
        tuyChon.textContent = v.name;
        chon.appendChild(tuyChon);
    });
    if (goiYGiong) goiYGiong.style.display = phanHoi.hasVi ? 'none' : 'block';
    capNhatHuyHieuTts(phanHoi.hasVi ? 'web' : 'google');
    chrome.storage.local.get('voiceIndex', duLieu => {
        if (duLieu.voiceIndex !== undefined) {
            let coGiaTri = false;
            for (let i = 0; i < chon.options.length; i++) {
                if (chon.options[i].value == duLieu.voiceIndex) { chon.selectedIndex = i; coGiaTri = true; break; }
            }
            if (!coGiaTri) chon.selectedIndex = 0;
            const tuyChon = chon.options[chon.selectedIndex];
            if (tuyChon) {
                const thongTinGiong = document.getElementById('info-voice');
                if (thongTinGiong) thongTinGiong.textContent = tuyChon.textContent;
            }
        }
    });
}

document.getElementById('voice-select').addEventListener('change', e => {
    const chiSo = parseInt(e.target.value);
    guiLenh('setVoice', { value: chiSo });
    chrome.storage.local.set({ voiceIndex: chiSo });
    const tuyChon = e.target.options[e.target.selectedIndex];
    const thongTinGiong = document.getElementById('info-voice');
    if (thongTinGiong) thongTinGiong.textContent = tuyChon?.textContent || 'Mặc định';
});

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const bang = document.getElementById(`panel-${tab.dataset.tab}`);
        if (bang) bang.classList.add('active');
    });
});

function taiDanhSachDoc() {
    chrome.storage.local.get('readingList', duLieu => {
        const danhSach = duLieu.readingList || [];
        hienThiDanhSachDoc(danhSach);
        const demThongTin = document.getElementById('info-count');
        if (demThongTin) demThongTin.textContent = `${danhSach.length} truyện`;
    });
}

function hienThiDanhSachDoc(danhSach) {
    const vungChua = document.getElementById('list-container');
    if (!vungChua) return;
    if (!danhSach.length) {
        vungChua.innerHTML = '<div class="list-empty">Chưa có truyện nào được lưu.<br><small style="color:#555">Nhấn <strong style="color:var(--accent)">Lưu</strong> để thêm truyện đang mở.</small></div>';
        return;
    }
    vungChua.innerHTML = danhSach.map((truyen, i) => `
        <div class="list-item" data-index="${i}" title="Nhấn để mở truyện này">
            <img class="list-thumb" src="${truyen.imgUrl || ANH_BIA_DU_PHONG}" alt="">
            <div class="list-info">
                <div class="list-name">${thoatHtml(truyen.title)}</div>
                <div class="list-chap">${thoatHtml(truyen.chap || 'Chưa xác định chương')}</div>
                ${truyen.url ? '<div class="list-date" style="font-size:9px;color:#555;margin-top:1px">Nhấn để tiếp tục đọc</div>' : ''}
            </div>
            <button class="btn-remove" data-index="${i}" title="Xoá khỏi danh sách">✕</button>
        </div>
    `).join('');
    vungChua.querySelectorAll('.list-thumb').forEach(anh => {
        anh.addEventListener('error', function () { this.src = ANH_BIA_DU_PHONG; }, { once: true });
        if (anh.complete && anh.naturalHeight === 0) anh.src = ANH_BIA_DU_PHONG;
    });
    vungChua.querySelectorAll('.btn-remove').forEach(nut => {
        nut.addEventListener('click', e => { e.stopPropagation(); xoaKhoiDanhSach(parseInt(nut.dataset.index)); });
    });
    vungChua.querySelectorAll('.list-item').forEach(muc => {
        muc.style.cursor = 'pointer';
        muc.addEventListener('click', () => {
            const chiSo = parseInt(muc.dataset.index);
            chrome.storage.local.get('readingList', duLieu => {
                const truyen = (duLieu.readingList || [])[chiSo];
                if (truyen?.url) chrome.tabs.create({ url: truyen.url });
                else hienThongBao('URL không được lưu cho truyện này', 'warning');
            });
        });
    });
}

function thoatHtml(chuoi) {
    return String(chuoi).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function xoaKhoiDanhSach(chiSo) {
    chrome.storage.local.get('readingList', duLieu => {
        const danhSach = duLieu.readingList || [];
        danhSach.splice(chiSo, 1);
        chrome.storage.local.set({ readingList: danhSach }, () => {
            hienThiDanhSachDoc(danhSach);
            const demThongTin = document.getElementById('info-count');
            if (demThongTin) demThongTin.textContent = `${danhSach.length} truyện`;
            if (duLieuTruyenHienTai) {
                const vanDuocLuu = danhSach.some(t => t.title === duLieuTruyenHienTai.bookTitle);
                thietLapTrangThaiLuu(vanDuocLuu);
            }
        });
    });
}

const nutLuu = document.getElementById('btn-save');
if (nutLuu) {
    nutLuu.addEventListener('click', () => {
        if (!duLieuTruyenHienTai) { hienThongBao('Không có truyện nào đang mở', 'warning'); return; }
        chrome.storage.local.get('readingList', duLieu => {
            const danhSach = duLieu.readingList || [];
            const chiSoHienCo = danhSach.findIndex(t => t.title === duLieuTruyenHienTai.bookTitle);
            if (chiSoHienCo !== -1) {
                danhSach.splice(chiSoHienCo, 1);
                chrome.storage.local.set({ readingList: danhSach }, () => {
                    hienThiDanhSachDoc(danhSach);
                    thietLapTrangThaiLuu(false);
                    const demThongTin = document.getElementById('info-count');
                    if (demThongTin) demThongTin.textContent = `${danhSach.length} truyện`;
                    hienThongBao('Đã bỏ lưu truyện', 'info');
                });
            } else {
                danhSach.push({
                    title: duLieuTruyenHienTai.bookTitle,
                    chap: duLieuTruyenHienTai.chapTitle,
                    imgUrl: duLieuTruyenHienTai.imgUrl,
                    url: duLieuTruyenHienTai.pageUrl,
                    savedAt: new Date().toLocaleDateString('vi-VN')
                });
                chrome.storage.local.set({ readingList: danhSach }, () => {
                    hienThiDanhSachDoc(danhSach);
                    thietLapTrangThaiLuu(true);
                    const demThongTin = document.getElementById('info-count');
                    if (demThongTin) demThongTin.textContent = `${danhSach.length} truyện`;
                    hienThongBao('Đã lưu truyện thành công!', 'success');
                });
            }
        });
    });
}

function thietLapTrangThaiLuu(daLuu) {
    const bieuTuongLuu = document.getElementById('save-icon');
    const vanBanLuu = document.getElementById('save-text');
    const nutLuu = document.getElementById('btn-save');
    if (nutLuu) nutLuu.className = `btn-save${daLuu ? ' saved' : ''}`;
    if (bieuTuongLuu) bieuTuongLuu.innerHTML = daLuu ? SVG_DAU_TRANG_DA_CHON : SVG_DAU_TRANG;
    if (vanBanLuu) vanBanLuu.textContent = daLuu ? 'Đã lưu' : 'Lưu';
}

const nutXoaTatCa = document.getElementById('btn-clear-all');
if (nutXoaTatCa) {
    nutXoaTatCa.addEventListener('click', () => {
        if (!confirm('Xoá toàn bộ danh sách đọc?')) return;
        chrome.storage.local.set({ readingList: [] }, () => {
            hienThiDanhSachDoc([]);
            const demThongTin = document.getElementById('info-count');
            if (demThongTin) demThongTin.textContent = '0 truyện';
            thietLapTrangThaiLuu(false);
            hienThongBao('Đã xoá toàn bộ danh sách', 'info');
        });
    });
}

const chonDongCo = document.getElementById('engine-select');
const vungCaiDatApi = document.getElementById('api-settings-box');
const oNhapKhoaApi = document.getElementById('api-key-input');
const oNhapKhuVucApi = document.getElementById('api-region-input');
const nutLuuApi = document.getElementById('btn-save-api');

if (chonDongCo) {
    chonDongCo.addEventListener('change', e => {
        const giaTri = e.target.value;
        const canKhoa = ['fpt', 'azure', 'gcp'].includes(giaTri);
        if (vungCaiDatApi) vungCaiDatApi.style.display = canKhoa ? 'block' : 'none';
        if (oNhapKhuVucApi) oNhapKhuVucApi.style.display = giaTri === 'azure' ? 'block' : 'none';
        const goiY = { fpt: 'Nhập FPT.AI API Key...', azure: 'Nhập Azure Subscription Key...' };
        if (goiY[giaTri] && oNhapKhoaApi) oNhapKhoaApi.placeholder = goiY[giaTri];
        guiLenh('setEngine', { value: giaTri });
        chrome.storage.local.set({ ttsEngine: giaTri });
        capNhatHuyHieuTts(giaTri);
        const chonGiong = document.getElementById('voice-select');
        const goiYGiong = document.getElementById('voice-hint');
        if (chonGiong) chonGiong.disabled = false;
        if (giaTri === 'web' || giaTri === 'auto') {
            taiCacGiong();
        } else if (giaTri === 'fpt') {
            if (chonGiong) chonGiong.innerHTML = `
                <option value="0">Ban Mai (Nữ Miền Bắc)</option>
                <option value="1">Lê Minh (Nam Miền Bắc)</option>
                <option value="2">Thu Minh (Nữ Miền Bắc)</option>
                <option value="3">Mỹ An (Nữ Miền Trung)</option>
                <option value="4">Gia Huy (Nam Miền Trung)</option>
                <option value="5">Lan Nhi (Nữ Miền Nam)</option>
                <option value="6">Linh San (Nữ Miền Nam)</option>
            `;
            if (goiYGiong) goiYGiong.style.display = 'none';
        } else if (giaTri === 'azure') {
            if (chonGiong) chonGiong.innerHTML = `
                <option value="0">Hoài My (Nữ)</option>
                <option value="1">Nam Minh (Nam)</option>
            `;
            if (goiYGiong) goiYGiong.style.display = 'none';
        }
        if (canKhoa) {
            chrome.storage.local.get([`${giaTri}_key`, 'azure_region'], duLieu => {
                if (oNhapKhoaApi) oNhapKhoaApi.value = duLieu[`${giaTri}_key`] || '';
                if (giaTri === 'azure' && oNhapKhuVucApi) oNhapKhuVucApi.value = duLieu.azure_region || '';
            });
        }
    });
}

if (nutLuuApi) {
    nutLuuApi.addEventListener('click', () => {
        const giaTri = chonDongCo.value;
        const khoa = oNhapKhoaApi.value.trim();
        const khuVuc = oNhapKhuVucApi.value.trim();
        if (!khoa) { hienThongBao('Vui lòng nhập API Key', 'warning'); return; }
        const duLieuLuu = { [`${giaTri}_key`]: khoa };
        if (giaTri === 'azure') duLieuLuu['azure_region'] = khuVuc;
        chrome.storage.local.set(duLieuLuu, () => {
            const bieuTuong = document.getElementById('btn-save-api-icon');
            const nhanVanBan = document.getElementById('btn-save-api-text');
            if (bieuTuong) bieuTuong.innerHTML = SVG_KIEM_TRA;
            if (nhanVanBan) nhanVanBan.textContent = 'Đã lưu!';
            setTimeout(() => {
                if (bieuTuong) bieuTuong.innerHTML = SVG_LUU;
                if (nhanVanBan) nhanVanBan.textContent = 'Lưu API Key';
            }, 2000);
            guiLenh('setApiKeys', duLieuLuu);
            hienThongBao('Đã lưu API Key thành công!', 'success');
        });
    });
}

const anhBia = document.getElementById('cover-img');
if (anhBia) {
    anhBia.onerror = () => { anhBia.onerror = null; anhBia.src = ANH_BIA_DU_PHONG; };
}

async function khoiTaoPopup() {
    chrome.storage.local.get(['speed', 'volume', 'voiceIndex', 'ttsEngine'], duLieu => {
        if (duLieu.speed !== undefined) {
            const thanhTocDo = document.getElementById('speed-slider');
            const vanBanTocDo = document.getElementById('speed-val');
            if (thanhTocDo) thanhTocDo.value = duLieu.speed;
            if (vanBanTocDo) vanBanTocDo.textContent = `${parseFloat(duLieu.speed).toFixed(1)}×`;
        }
        if (duLieu.volume !== undefined) {
            const thanhAmLuong = document.getElementById('vol-slider');
            const vanBanAmLuong = document.getElementById('vol-val');
            if (thanhAmLuong) thanhAmLuong.value = duLieu.volume;
            if (vanBanAmLuong) vanBanAmLuong.textContent = `${Math.round(duLieu.volume * 100)}%`;
        }
        if (duLieu.ttsEngine) {
            const chonDongCo = document.getElementById('engine-select');
            if (chonDongCo) {
                chonDongCo.value = duLieu.ttsEngine;
                chonDongCo.dispatchEvent(new Event('change'));
            }
        }
    });

    const phanHoi = await guiLenh('getInfo');
    if (!phanHoi || !phanHoi.bookTitle) {
        const vanBanTrangThai = document.getElementById('status-text');
        const tieuDeHienTai = document.getElementById('current-title');
        const anhBia = document.getElementById('cover-img');
        if (vanBanTrangThai) vanBanTrangThai.textContent = '⚠ Mở trang STV trước';
        if (tieuDeHienTai) tieuDeHienTai.textContent = 'Chưa mở trang đọc truyện';
        if (anhBia) anhBia.src = ANH_BIA_DU_PHONG;
        return;
    }

    duLieuTruyenHienTai = { ...phanHoi, pageUrl: phanHoi.pageUrl || phanHoi.bookUrl };

    chrome.storage.local.get('readingList', duLieu => {
        let danhSach = duLieu.readingList || [];
        const chiSoDaLuu = danhSach.findIndex(t => t.title.trim().toLowerCase() === phanHoi.bookTitle.trim().toLowerCase());

        const anhBia = document.getElementById('cover-img');
        if (!phanHoi.imgUrl) {
            if (anhBia) {
                anhBia.src = (chiSoDaLuu !== -1 && danhSach[chiSoDaLuu].imgUrl) ? danhSach[chiSoDaLuu].imgUrl : ANH_BIA_DU_PHONG;
                anhBia.style.display = 'block';
            }
        } else {
            if (anhBia) anhBia.src = phanHoi.imgUrl;
        }

        if (chiSoDaLuu !== -1) {
            thietLapTrangThaiLuu(true);
            let daCapNhat = false;
            if (duLieuTruyenHienTai.pageUrl && danhSach[chiSoDaLuu].url !== duLieuTruyenHienTai.pageUrl) { danhSach[chiSoDaLuu].url = duLieuTruyenHienTai.pageUrl; daCapNhat = true; }
            if (phanHoi.chapTitle && danhSach[chiSoDaLuu].chap !== phanHoi.chapTitle) { danhSach[chiSoDaLuu].chap = phanHoi.chapTitle; daCapNhat = true; }
            if (phanHoi.imgUrl && danhSach[chiSoDaLuu].imgUrl !== phanHoi.imgUrl) { danhSach[chiSoDaLuu].imgUrl = phanHoi.imgUrl; daCapNhat = true; }
            if (daCapNhat) chrome.storage.local.set({ readingList: danhSach }, () => hienThiDanhSachDoc(danhSach));
        }
    });

    if (phanHoi.bookTitle) {
        const tieuDeHienTai = document.getElementById('current-title');
        if (tieuDeHienTai) tieuDeHienTai.textContent = phanHoi.bookTitle;
    }
    if (phanHoi.chapTitle) {
        const chuongHienTai = document.getElementById('current-chap');
        if (chuongHienTai) chuongHienTai.textContent = phanHoi.chapTitle;
    }
    if (phanHoi.bookUrl) {
        const moTrangTruyen = () => window.open(phanHoi.bookUrl, '_blank');
        const anhBia = document.getElementById('cover-img');
        if (anhBia) {
            anhBia.style.cursor = 'pointer';
            anhBia.title = 'Nhấn để mở trang thông tin truyện';
            anhBia.addEventListener('click', moTrangTruyen);
        }
        const tieuDeEl = document.getElementById('current-title');
        if (tieuDeEl) {
            tieuDeEl.style.cursor = 'pointer';
            tieuDeEl.title = 'Nhấn để mở trang thông tin truyện';
            tieuDeEl.addEventListener('click', moTrangTruyen);
        }
    }
    if (phanHoi.ttsEngine) capNhatHuyHieuTts(phanHoi.ttsEngine);
    if (phanHoi.elapsed !== undefined) { giayBoDem = phanHoi.elapsed; capNhatHienThiBoDem(); }
    thietLapTrangThaiPhat(phanHoi.isPlaying, phanHoi.isPaused);
    if (phanHoi.isPlaying) batDauBoDem();
    batDauThamDo();
    setTimeout(taiCacGiong, 300);
}

khoiTaoPopup();
taiDanhSachDoc();

document.addEventListener('visibilitychange', () => {
    if (document.hidden) dungThamDo();
    else batDauThamDo();
});

document.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    switch (e.key.toLowerCase()) {
        case 'k': e.preventDefault(); document.getElementById('btn-play').click(); break;
        case 'arrowleft': e.preventDefault(); document.getElementById('btn-prev').click(); break;
        case 'arrowright': e.preventDefault(); document.getElementById('btn-next').click(); break;
        case 'r': e.preventDefault(); document.getElementById('btn-replay').click(); break;
        case 'escape': e.preventDefault(); document.getElementById('btn-stop').click(); break;
    }
});