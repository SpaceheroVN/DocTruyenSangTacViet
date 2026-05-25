// bangdieukhien/dieu_khien_trinh_phat.js
import { CauHinh } from './cau_hinh.js';
import { QuanLyThuVien } from './quan_ly_thu_vien.js';
import { GiaoDienCaiDat } from './giao_dien_cai_dat.js';

export function showConfirm(tieuDe, noiDung, hanhDongXacNhan) {
    const modal = document.getElementById('confirm-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    const btnConfirm = document.getElementById('modal-confirm');
    const btnCancel = document.getElementById('modal-cancel');
    if (!modal || !title || !body || !btnConfirm || !btnCancel) return;

    title.textContent = tieuDe;
    body.textContent = noiDung;
    modal.style.display = 'flex';

    // Clone buttons to strip all previous listeners
    const btnConfirmMoi = btnConfirm.cloneNode(true);
    btnConfirm.replaceWith(btnConfirmMoi);
    const btnCancelMoi = btnCancel.cloneNode(true);
    btnCancel.replaceWith(btnCancelMoi);

    const dong = () => { modal.style.display = 'none'; };
    btnConfirmMoi.addEventListener('click', () => { dong(); hanhDongXacNhan(); }, { once: true });
    btnCancelMoi.addEventListener('click', dong, { once: true });
}

export function showToast(tinNhan, loai = 'info') {
    let thongBao = document.getElementById('toast');
    if (!thongBao) {
        thongBao = document.createElement('div');
        thongBao.id = 'toast';
        thongBao.className = 'toast';
        document.body.appendChild(thongBao);
    }
    
    thongBao.className = `toast show toast-${loai}`;
    let bieuTuong = '';
    if (loai === 'success') bieuTuong = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    else if (loai === 'warning') bieuTuong = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    
    thongBao.innerHTML = bieuTuong;
    const spanText = document.createElement('span');
    spanText.textContent = tinNhan;
    thongBao.appendChild(spanText);
    clearTimeout(thongBao.timeoutId);
    thongBao.timeoutId = setTimeout(() => { thongBao.classList.remove('show'); }, 2500);
}

export const DieuKhienTrinhPhat = {
    idTabHienTai: null,
    thongTinTruyenHienTai: null,

    async khoiTao() {
        const versionBadge = document.getElementById('version-badge');
        if (versionBadge) versionBadge.textContent = 'v' + chrome.runtime.getManifest().version;

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && tab.url.includes('sangtacviet.com')) {
            this.idTabHienTai = tab.id;
            this.yeuCauTrangThaiBanDau();
        } else {
            const btnOpenStv = document.getElementById('btn-open-stv');
            if (btnOpenStv) btnOpenStv.addEventListener('click', () => chrome.tabs.create({ url: 'https://sangtacviet.com/' }));
            
            const bookEmptyState = document.getElementById('book-empty-state');
            if (bookEmptyState) bookEmptyState.style.display = 'block';
            const bookMeta = document.getElementById('book-meta');
            if (bookMeta) bookMeta.style.display = 'none';
            const coverImg = document.getElementById('cover-img');
            if (coverImg) coverImg.style.display = 'none';
            const controls = document.querySelector('.controls');
            if (controls) controls.style.display = 'none';
            const statusBar = document.querySelector('.status-bar');
            if (statusBar) statusBar.style.display = 'none';
        }

        this.ganSuKien();
        
        chrome.runtime.onMessage.addListener((tinNhan) => {
            if (tinNhan.hanhDong === 'thayDoiTrangThai' && tinNhan.trangThai) {
                this.capNhatTrangThaiPhat(tinNhan.trangThai);
            }
        });

        document.body.style.opacity = '1';
    },

    yeuCauTrangThaiBanDau() {
        if (!this.idTabHienTai) return;
        chrome.tabs.sendMessage(this.idTabHienTai, { hanhDong: 'layThongTin' }, phanHoi => {
            if (chrome.runtime.lastError) {
                showToast('Không thể kết nối đến trang', 'warning');
                return;
            }
            if (phanHoi) this.capNhatThongTinTruyen(phanHoi);
        });
        
        chrome.tabs.sendMessage(this.idTabHienTai, { hanhDong: 'layGiongDoc' }, phanHoi => {
            if (chrome.runtime.lastError) return;
            if (phanHoi && phanHoi.voices) {
                const theChon = document.getElementById('voice-select');
                if (!theChon) return;
                const giaTriCu = CauHinh.lay('voiceIndex', true) || 0;
                theChon.innerHTML = phanHoi.voices.map(v => {
                    let ten = v.name.replace(/ - Vietnamese \(Vietnam\)/i, '').replace(/ \(Vietnam\)/i, '').replace(/Microsoft /i, 'MS ').replace(/Google /i, 'GG ');
                    if (ten.length > 22) ten = ten.substring(0, 20) + '...';
                    return `<option value="${v.index}" ${v.index == giaTriCu ? 'selected' : ''}>${ten}</option>`;
                }).join('');
                GiaoDienCaiDat.capNhatGiaoDien('voice-select');
            }
        });
    },

    guiLenh(hanhDong, thamSoThem = {}) {
        if (!this.idTabHienTai) return;
        chrome.tabs.sendMessage(this.idTabHienTai, { hanhDong: hanhDong, ...thamSoThem }, () => {
            if (chrome.runtime.lastError) { /* ignore */ }
        });
    },

    capNhatTrangThaiPhat(trangThai) {
        if (!trangThai) return;

        const dangPhat = trangThai.isPlaying;
        const dangTamDung = trangThai.isPaused;
        const isBuffering = trangThai.isBuffering;
        const dangHoatDong = dangPhat && !dangTamDung;

        const bieuTuong = document.getElementById('btn-play-icon');
        const vanBanNut = document.getElementById('btn-play-text');
        
        const SVG_PHAT = '<polygon points="5 3 19 12 5 21 5 3"/>';
        const SVG_TAMDUNG = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';

        const chamTrangThai = document.getElementById('status-dot');
        const chuTrangThai = document.getElementById('status-text');

        if (!bieuTuong || !vanBanNut || !chamTrangThai || !chuTrangThai) return;
        
        if (isBuffering) {
            bieuTuong.innerHTML = SVG_TAMDUNG;
            vanBanNut.textContent = 'Dừng';
            chamTrangThai.className = 'status-dot paused';
            chuTrangThai.textContent = 'Đang tải audio...';
            chuTrangThai.style.color = 'var(--warning)';
        } else if (dangHoatDong) {
            bieuTuong.innerHTML = SVG_TAMDUNG;
            vanBanNut.textContent = 'Dừng';
            chamTrangThai.className = 'status-dot playing';
            chuTrangThai.textContent = 'Đang đọc...';
            chuTrangThai.style.color = 'var(--success)';
        } else if (dangPhat && dangTamDung) {
            bieuTuong.innerHTML = SVG_PHAT;
            vanBanNut.textContent = 'Tiếp tục';
            chamTrangThai.className = 'status-dot paused';
            chuTrangThai.textContent = 'Đang tạm dừng';
            chuTrangThai.style.color = 'var(--accent)';
        } else {
            bieuTuong.innerHTML = SVG_PHAT;
            vanBanNut.textContent = 'Nghe';
            chamTrangThai.className = 'status-dot';
            chuTrangThai.textContent = 'Sẵn sàng';
            chuTrangThai.style.color = 'var(--text-muted)';
        }

        if (trangThai.progress) {
            const input = document.getElementById('progress-input');
            const total = document.getElementById('progress-total');
            const bar = document.getElementById('progress-bar');
            const percent = document.getElementById('progress-percent');
            if(input) input.value = trangThai.progress.current;
            if(total) total.textContent = trangThai.progress.total;
            if(bar && percent) {
                const phanTram = Math.round((trangThai.progress.current / trangThai.progress.total) * 100);
                bar.style.width = phanTram + '%';
                percent.textContent = phanTram + '%';
            }
        }
    },

    capNhatThongTinTruyen(thongTin) {
        if (!thongTin) return;
        this.thongTinTruyenHienTai = thongTin;
        
        const laTrangChu = thongTin.pageUrl && !thongTin.pageUrl.includes('/truyen/');
        
        if (thongTin.bookTitle) {
            document.getElementById('current-title').textContent = thongTin.bookTitle;
            document.getElementById('current-chap').style.display = 'block';
            document.getElementById('cover-img').style.display = 'block';
            document.getElementById('btn-save').style.display = 'flex';
            
            const controls = document.querySelector('.controls');
            if (controls) controls.style.display = thongTin.progress ? 'flex' : 'none';
            const statusBar = document.querySelector('.status-bar');
            if (statusBar) statusBar.style.display = thongTin.progress ? 'flex' : 'none';
        } else if (laTrangChu) {
            document.getElementById('current-title').textContent = 'Đang ở trang chủ / tìm kiếm';
            document.getElementById('current-chap').style.display = 'none';
            document.getElementById('cover-img').style.display = 'none';
            document.getElementById('btn-save').style.display = 'none';
            
            const controls = document.querySelector('.controls');
            if (controls) controls.style.display = 'none';
            const statusBar = document.querySelector('.status-bar');
            if (statusBar) statusBar.style.display = 'none';
        }
        
        const chapEl = document.getElementById('current-chap');
        if (thongTin.chapTitle) {
            chapEl.textContent = thongTin.chapTitle;
        } else if (thongTin.stats) {
            const container = document.createElement('div');
            container.style.cssText = 'display: flex; align-items: center; justify-content: flex-start; color: var(--text-muted); font-size: 11px;';
            
            if (thongTin.stats.view) {
                const span = document.createElement('span');
                span.style.cssText = 'margin-right: 12px; display: inline-flex; align-items: center;';
                span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
                const text = document.createTextNode(thongTin.stats.view);
                span.appendChild(text);
                container.appendChild(span);
            }
            if (thongTin.stats.like) {
                const span = document.createElement('span');
                span.style.cssText = 'margin-right: 12px; display: inline-flex; align-items: center;';
                span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>';
                const text = document.createTextNode(thongTin.stats.like);
                span.appendChild(text);
                container.appendChild(span);
            }
            if (thongTin.stats.status) {
                const span = document.createElement('span');
                if (thongTin.stats.status === 'Còn tiếp') {
                    span.style.cssText = 'display: inline-flex; align-items: center; color: var(--accent);';
                    span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
                } else {
                    span.style.cssText = 'display: inline-flex; align-items: center; color: #10b981;';
                    span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                }
                const text = document.createTextNode(thongTin.stats.status);
                span.appendChild(text);
                container.appendChild(span);
            }
            chapEl.innerHTML = '';
            chapEl.appendChild(container);
        } else {
            chapEl.textContent = '—';
        }
        
        if (thongTin.imgUrl) document.getElementById('cover-img').src = thongTin.imgUrl;
        
        if (QuanLyThuVien.danhSachDoc) {
            const danhSach = QuanLyThuVien.danhSachDoc;
            const vt = danhSach.findIndex(i => (i.title || '').trim().toLowerCase() === (thongTin.bookTitle || '').trim().toLowerCase());
            if (vt !== -1) {
                this.datTrangThaiLuu(true);
                let daCapNhat = false;
                const docHienTai = danhSach[vt];
                if (thongTin.pageUrl && docHienTai.url !== thongTin.pageUrl) { docHienTai.url = thongTin.pageUrl; daCapNhat = true; }
                if (thongTin.chapTitle && docHienTai.chap !== thongTin.chapTitle) { docHienTai.chap = thongTin.chapTitle; daCapNhat = true; }
                if (daCapNhat) {
                    chrome.storage.local.set({ readingList: danhSach }, () => {
                        QuanLyThuVien.hienThiDanhSach(QuanLyThuVien.sapXepDanhSach(danhSach));
                    });
                }
            } else {
                this.datTrangThaiLuu(false);
            }
        }
        
        this.capNhatTrangThaiPhat({
            isPlaying: thongTin.isPlaying,
            isPaused: thongTin.isPaused,
            isBuffering: thongTin.isBuffering,
            engine: thongTin.ttsEngine,
            progress: thongTin.progress
        });
    },

    datTrangThaiLuu(daLuu) {
        const nut = document.getElementById('btn-save');
        if (!nut) return;
        nut.className = `btn-save${daLuu ? ' saved' : ''}`;
        nut.innerHTML = daLuu ? 
            '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path><polyline points="9 11 12 14 22 4"></polyline></svg>Đã lưu' : 
            '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>Lưu';
    },

    ganSuKien() {
        document.getElementById('btn-play').addEventListener('click', () => {
            this.guiLenh('daoTrangThaiPhat');
            document.getElementById('btn-play').classList.add('active');
            setTimeout(() => document.getElementById('btn-play').classList.remove('active'), 200);
        });
        document.getElementById('btn-stop').addEventListener('click', () => this.guiLenh('dungPhat'));
        document.getElementById('btn-next').addEventListener('click', () => this.guiLenh('chuongTiep'));
        document.getElementById('btn-prev').addEventListener('click', () => this.guiLenh('chuongTruoc'));
        document.getElementById('btn-replay').addEventListener('click', () => this.guiLenh('phatLai'));

        const btnSave = document.getElementById('btn-save');
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                const hienTai = this.thongTinTruyenHienTai;
                if (!hienTai || !hienTai.bookTitle) {
                    showToast('Không có truyện nào đang mở', 'warning');
                    return;
                }
                
                const danhSach = QuanLyThuVien.danhSachDoc || [];
                const vitri = danhSach.findIndex(i => (i.title || '').trim().toLowerCase() === hienTai.bookTitle.trim().toLowerCase());
                
                if (vitri !== -1) {
                    danhSach.splice(vitri, 1);
                    chrome.storage.local.set({ readingList: danhSach }, () => {
                        QuanLyThuVien.danhSachDoc = danhSach;
                        QuanLyThuVien.hienThiDanhSach(QuanLyThuVien.sapXepDanhSach(danhSach));
                        this.datTrangThaiLuu(false);
                        const infoCount = document.getElementById('info-count');
                        if (infoCount) infoCount.textContent = `${danhSach.length} truyện`;
                        showToast('Đã bỏ lưu truyện', 'info');
                    });
                } else {
                    if (danhSach.length >= 50) danhSach.shift();
                    danhSach.push({
                        title: hienTai.bookTitle,
                        url: hienTai.pageUrl || hienTai.bookUrl,
                        imgUrl: hienTai.imgUrl,
                        timestamp: Date.now(),
                        savedAt: new Date().toLocaleDateString('vi-VN'),
                        chap: hienTai.chapTitle || 'Chưa đọc chương nào',
                        chunkIndex: (hienTai.progress && hienTai.progress.current) ? hienTai.progress.current : 0
                    });
                    chrome.storage.local.set({ readingList: danhSach }, () => {
                        QuanLyThuVien.danhSachDoc = danhSach;
                        QuanLyThuVien.hienThiDanhSach(QuanLyThuVien.sapXepDanhSach(danhSach));
                        this.datTrangThaiLuu(true);
                        const infoCount = document.getElementById('info-count');
                        if (infoCount) infoCount.textContent = `${danhSach.length} truyện`;
                        showToast('Đã lưu truyện thành công!', 'success');
                    });
                }
            });
        }

        document.querySelectorAll('.tab').forEach(nut => {
            nut.addEventListener('click', (e) => {
                const engineSelect = document.getElementById('engine-select');
                if (engineSelect && ['fpt', 'azure'].includes(engineSelect.value)) {
                    if (engineSelect.value !== CauHinh.lay('maydoc', true)) {
                        engineSelect.value = CauHinh.lay('maydoc', true) || 'web';
                        engineSelect.dispatchEvent(new Event('change'));
                    }
                }
                
                const dangActive = e.currentTarget.classList.contains('active');
                const laTabMain = e.currentTarget.dataset.tab === 'main';
                
                document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
                
                if (dangActive && !laTabMain) {
                    const nutMain = document.querySelector('.tab[data-tab="main"]');
                    if (nutMain) nutMain.classList.add('active');
                    const panelMain = document.getElementById('panel-main');
                    if (panelMain) panelMain.classList.add('active');
                } else {
                    e.currentTarget.classList.add('active');
                    const panel = document.getElementById('panel-' + e.currentTarget.dataset.tab);
                    if (panel) panel.classList.add('active');
                }
            });
        });

        const modal = document.getElementById('confirm-modal');
        if (modal) {
            modal.addEventListener('click', e => { if(e.target === modal) modal.style.display = 'none'; });
        }

        document.addEventListener('contextmenu', e => { if (e.target.tagName !== 'INPUT') e.preventDefault(); });
        document.addEventListener('dragstart', e => { if (e.target.tagName !== 'INPUT') e.preventDefault(); });

        const btnAddDict = document.getElementById('btn-add-dict');
        if (btnAddDict) btnAddDict.addEventListener('click', () => showToast('Đã lưu quy tắc (đang phát triển)', 'info'));
        
        const btnNextChunk = document.getElementById('btn-next-chunk');
        if (btnNextChunk) btnNextChunk.addEventListener('click', () => this.guiLenh('doanTiep'));
        const btnPrevChunk = document.getElementById('btn-prev-chunk');
        if (btnPrevChunk) btnPrevChunk.addEventListener('click', () => this.guiLenh('doanTruoc'));
    }
};
