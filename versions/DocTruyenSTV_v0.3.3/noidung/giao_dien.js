// noidung/giaodien.js
'use strict';
var DocTruyenSTV_Ext = window.DocTruyenSTV_Ext || {};

DocTruyenSTV_Ext.GiaoDienSTV = {
    dangThuNhoMiniPlayer: false,
    cheDoMiniPlayer: 'chapter',
    _theBoiDenTruoc: null,

    themPhongCach() {
        if (!document.getElementById('tts-styles')) {
            const style = document.createElement('style');
            style.id = 'tts-styles';
            style.textContent = `.tts-reading { background-color: rgba(232, 160, 69, 0.35) !important; border-radius: 4px; box-shadow: 0 0 0 2px rgba(232, 160, 69, 0.35) !important; transition: background-color 0.2s, box-shadow 0.2s; color: inherit !important; }`;
            document.head.appendChild(style);
        }
    },

    boiDenDoan(chiSo, danhSachDoan, dangPhat, dangTamDung) {
        // Xóa class cũ chỉ trên element đã biết thay vì querySelectorAll
        if (this._theBoiDenTruoc) {
            this._theBoiDenTruoc.classList.remove('tts-reading');
            this._theBoiDenTruoc = null;
        }
        if (chiSo >= 0 && chiSo < danhSachDoan.length && danhSachDoan[chiSo].el) {
            const el = danhSachDoan[chiSo].el;
            el.classList.add('tts-reading');
            this._theBoiDenTruoc = el;
            if (dangPhat && !dangTamDung) {
                const rect = el.getBoundingClientRect();
                if (rect.top < 80 || rect.bottom > window.innerHeight - 80) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
        
        DocTruyenSTV_Ext.TrinhPhatAmThanh.luuTrangThaiChongDoi();
        this.capNhatBangDieuKhien(chiSo, danhSachDoan.length, dangPhat, dangTamDung);
        DocTruyenSTV_Ext.TrinhPhatAmThanh.PhatTinNhanTrangThai();
    },

    xoaBoiDen() {
        if (this._theBoiDenTruoc) {
            this._theBoiDenTruoc.classList.remove('tts-reading');
            this._theBoiDenTruoc = null;
        }
    },

    hienThiThongBao(tinNhan) {
        let thongBao = document.getElementById('stv-tts-toast');
        if (!thongBao) {
            thongBao = document.createElement('div');
            thongBao.id = 'stv-tts-toast';
            thongBao.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:var(--accent, #e8a045);color:#fff;padding:8px 16px;border-radius:20px;z-index:999999;font-size:14px;font-family:sans-serif;pointer-events:none;transition:opacity 0.3s;box-shadow:0 4px 10px rgba(0,0,0,0.3);display:flex;align-items:center;gap:6px;';
            document.body.appendChild(thongBao);
        }
        thongBao.textContent = tinNhan;
        thongBao.style.opacity = '1';
        clearTimeout(thongBao.timeout);
        thongBao.timeout = setTimeout(() => { thongBao.style.opacity = '0'; }, 2000);
    },

    taoBangDieuKhien() {
        if (document.getElementById('stv-mini-player')) return;

        const style = document.createElement('style');
        style.id = 'stv-mini-player-styles';
        style.textContent = `
            #stv-mini-player * { outline: none !important; }
            #stv-mini-player {
                position: fixed; bottom: 20px; left: 14px; width: 275px;
                background: linear-gradient(140deg, #1a1929 0%, #12111e 100%);
                border: 1px solid #2e2c45; border-radius: 14px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(232,160,69,0.08);
                z-index: 2147483646; font-family: 'Be Vietnam Pro', system-ui, -apple-system, sans-serif;
                font-size: 12px; color: #e8e6f0; user-select: none;
                transition: opacity 0.25s, transform 0.25s; overflow: hidden;
            }
            #stv-mini-player.stv-mp-hidden { opacity: 0; transform: translateY(14px); pointer-events: none; }
            #stv-mini-player .stv-mp-drag { padding: 8px 10px 4px 12px; cursor: grab; display: flex; align-items: center; gap: 6px; }
            #stv-mini-player .stv-mp-drag:active { cursor: grabbing; }
            #stv-mini-player .stv-mp-lbl { flex: 1; font-size: 9px; font-weight: 700; color: #7a7896; letter-spacing: 0.8px; text-transform: uppercase; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            #stv-mini-player .stv-mp-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #4caf86; flex-shrink: 0; }
            #stv-mini-player .stv-mp-status-dot.paused { background: #e8a045; }
            #stv-mini-player .stv-mp-status-dot.stopped { background: #7a7896; }
            #stv-mini-player .stv-mp-min-btn { background: none; border: none; color: #7a7896; cursor: pointer; padding: 2px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: color 0.15s, background 0.15s; flex-shrink: 0; }
            #stv-mini-player .stv-mp-min-btn:hover { color: #e8a045; background: rgba(232,160,69,0.1); }
            #stv-mini-player .stv-mp-chap { padding: 0 12px 6px; font-size: 11px; font-weight: 500; color: #e8e6f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            #stv-mini-player .stv-mp-bar-wrap { padding: 0 12px; margin-bottom: 8px; }
            #stv-mini-player .stv-mp-bar-bg { height: 3px; background: #2e2c45; border-radius: 99px; overflow: hidden; }
            #stv-mini-player .stv-mp-bar-fill { height: 100%; background: linear-gradient(90deg, #e8a045, #c45c8a); border-radius: 99px; width: 0%; transition: width 0.4s ease; }
            #stv-mini-player .stv-mp-controls { display: flex; align-items: center; padding: 2px 10px 10px; gap: 4px; }
            #stv-mini-player .stv-mp-btn { background: rgba(255,255,255,0.04); border: 1px solid #2e2c45; color: #e8e6f0; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; padding: 0; flex-shrink: 0; }
            #stv-mini-player .stv-mp-btn:hover { background: rgba(232,160,69,0.12); border-color: rgba(232,160,69,0.5); color: #e8a045; }
            #stv-mini-player .stv-mp-btn-sm { width: 28px; height: 28px; }
            #stv-mini-player .stv-mp-btn-play { width: 36px; height: 36px; background: #e8a045; border-color: #e8a045; color: #0f0e17; border-radius: 50%; box-shadow: 0 0 14px rgba(232,160,69,0.35); }
            #stv-mini-player .stv-mp-btn-play:hover { background: #f0b855; border-color: #f0b855; transform: scale(1.07); color: #ffffff !important; }
            #stv-mini-player .stv-mp-right { flex: 1; display: flex; align-items: center; justify-content: flex-end; gap: 5px; overflow: hidden; }
            #stv-mini-player .stv-mp-progress-txt { font-size: 10px; color: #7a7896; font-variant-numeric: tabular-nums; white-space: nowrap; }
            #stv-mini-player .stv-mp-engine-badge { font-size: 8px; font-weight: 700; background: rgba(255,255,255,0.06); border: 1px solid #2e2c45; border-radius: 4px; padding: 1px 5px; color: #7a7896; letter-spacing: 0.4px; white-space: nowrap; }
            #stv-mini-bubble {
                position: fixed; bottom: 20px; left: 14px; width: 44px; height: 44px;
                background: linear-gradient(135deg, #e8a045, #c45c8a); color: #ffffff;
                border-radius: 50%; box-shadow: 0 4px 18px rgba(232,160,69,0.45);
                z-index: 2147483646; cursor: pointer; display: flex; align-items: center; justify-content: center;
                transition: opacity 0.25s, transform 0.25s; border: 2px solid rgba(255,255,255,0.12);
            }
            #stv-mini-bubble.stv-mp-hidden { opacity: 0; transform: scale(0.75); pointer-events: none; }
            #stv-mini-bubble:hover { transform: scale(1.1); box-shadow: 0 6px 22px rgba(232,160,69,0.6); }
            @keyframes stv-pulse-bubble { 0%, 100% { box-shadow: 0 4px 18px rgba(232,160,69,0.45); } 50% { box-shadow: 0 4px 26px rgba(232,160,69,0.75); } }
            #stv-mini-bubble.stv-playing { animation: stv-pulse-bubble 2s ease-in-out infinite; }
        `;
        document.head.appendChild(style);

        const player = document.createElement('div');
        player.id = 'stv-mini-player';
        player.classList.add('stv-mp-hidden');
        player.innerHTML = `
            <div class="stv-mp-drag" id="stv-mp-drag-handle">
                <span class="stv-mp-status-dot" id="stv-mp-dot"></span>
                <span class="stv-mp-lbl">Auto Đọc STV</span>
                <button class="stv-mp-min-btn" id="stv-mp-minimize" title="Thu nhỏ">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
                </button>
            </div>
            <div class="stv-mp-chap" id="stv-mp-chap">Đang tải...</div>
            <div class="stv-mp-bar-wrap">
                <div class="stv-mp-bar-bg"><div class="stv-mp-bar-fill" id="stv-mp-bar-fill"></div></div>
            </div>
            <div class="stv-mp-controls">
                <button class="stv-mp-btn" id="stv-mp-mode" title="Đổi chức năng Tới/Lùi (Chương hoặc Đoạn)" style="height: 28px; padding: 0 8px; font-size: 10.5px; font-weight: 700; min-width: 62px;">CHƯƠNG</button>
                <button class="stv-mp-btn stv-mp-btn-sm" id="stv-mp-prev" title="Lùi lại">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
                </button>
                <button class="stv-mp-btn stv-mp-btn-play" id="stv-mp-playpause" title="Phát / Dừng">
                    <svg id="stv-mp-icon-play" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="display:none;margin-left:2px"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    <svg id="stv-mp-icon-pause" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                </button>
                <button class="stv-mp-btn stv-mp-btn-sm" id="stv-mp-next" title="Tiếp theo">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
                </button>
                <div class="stv-mp-right">
                    <span class="stv-mp-progress-txt" id="stv-mp-progress-txt">—</span>
                    <span class="stv-mp-engine-badge" id="stv-mp-engine-badge">WEB</span>
                </div>
            </div>
        `;
        document.body.appendChild(player);

        const bubble = document.createElement('div');
        bubble.id = 'stv-mini-bubble';
        bubble.classList.add('stv-mp-hidden');
        bubble.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>';
        document.body.appendChild(bubble);

        this.ganSuKien();
    },

    ganSuKien() {
        document.getElementById('stv-mp-playpause').addEventListener('click', e => { e.stopPropagation(); DocTruyenSTV_Ext.TrinhPhatAmThanh.daoTrangThaiPhat(); });
        
        document.getElementById('stv-mp-mode').addEventListener('click', e => {
            e.stopPropagation();
            this.cheDoMiniPlayer = this.cheDoMiniPlayer === 'chapter' ? 'chunk' : 'chapter';
            chrome.storage.local.set({ miniPlayerMode: this.cheDoMiniPlayer });
            this.capNhatBangDieuKhien(DocTruyenSTV_Ext.TrinhPhatAmThanh.layChiSoHienTai(), DocTruyenSTV_Ext.TrinhPhatAmThanh.layTongSoDoan(), DocTruyenSTV_Ext.TrinhPhatAmThanh.dangPhat, DocTruyenSTV_Ext.TrinhPhatAmThanh.dangTamDung);
        });

        document.getElementById('stv-mp-prev').addEventListener('click', e => {
            e.stopPropagation();
            if (this.cheDoMiniPlayer === 'chapter') DocTruyenSTV_Ext.TrinhPhatAmThanh.phatChuongTruoc();
            else DocTruyenSTV_Ext.TrinhPhatAmThanh.nhayDoan('truoc');
        });

        document.getElementById('stv-mp-next').addEventListener('click', e => {
            e.stopPropagation();
            if (this.cheDoMiniPlayer === 'chapter') DocTruyenSTV_Ext.TrinhPhatAmThanh.phatChuongTiepTheo();
            else DocTruyenSTV_Ext.TrinhPhatAmThanh.nhayDoan('tiep');
        });

        document.getElementById('stv-mp-minimize').addEventListener('click', e => {
            e.stopPropagation();
            this.dangThuNhoMiniPlayer = true;
            chrome.storage.local.set({ isMiniPlayerMinimized: true });
            this.capNhatBangDieuKhien(DocTruyenSTV_Ext.TrinhPhatAmThanh.layChiSoHienTai(), DocTruyenSTV_Ext.TrinhPhatAmThanh.layTongSoDoan(), DocTruyenSTV_Ext.TrinhPhatAmThanh.dangPhat, DocTruyenSTV_Ext.TrinhPhatAmThanh.dangTamDung);
        });

        document.getElementById('stv-mini-bubble').addEventListener('click', () => {
            this.dangThuNhoMiniPlayer = false;
            chrome.storage.local.set({ isMiniPlayerMinimized: false });
            this.capNhatBangDieuKhien(DocTruyenSTV_Ext.TrinhPhatAmThanh.layChiSoHienTai(), DocTruyenSTV_Ext.TrinhPhatAmThanh.layTongSoDoan(), DocTruyenSTV_Ext.TrinhPhatAmThanh.dangPhat, DocTruyenSTV_Ext.TrinhPhatAmThanh.dangTamDung);
        });

        // Drag functionality
        let dangKeo = false, startX, startY, startLeft, startBottom;
        const tayCam = document.getElementById('stv-mp-drag-handle');
        const bangDieuKhien = document.getElementById('stv-mini-player');
        const bongBong = document.getElementById('stv-mini-bubble');

        const batDauKeo = (e) => {
            dangKeo = true;
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            const cy = e.touches ? e.touches[0].clientY : e.clientY;
            const r = bangDieuKhien.getBoundingClientRect();
            startX = cx; startY = cy;
            startLeft = r.left;
            startBottom = window.innerHeight - r.bottom;
            e.preventDefault();
        };

        const khiKeo = (e) => {
            if (!dangKeo) return;
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            const cy = e.touches ? e.touches[0].clientY : e.clientY;
            const newL = Math.max(0, Math.min(window.innerWidth - bangDieuKhien.offsetWidth, startLeft + (cx - startX)));
            const newB = Math.max(0, Math.min(window.innerHeight - bangDieuKhien.offsetHeight, startBottom - (cy - startY)));
            bangDieuKhien.style.left = newL + 'px';
            bangDieuKhien.style.bottom = newB + 'px';
            bangDieuKhien.style.right = 'auto';
            bongBong.style.left = newL + 'px';
            bongBong.style.bottom = newB + 'px';
            bongBong.style.right = 'auto';
        };

        const ketThucKeo = () => { dangKeo = false; };

        tayCam.addEventListener('mousedown', batDauKeo);
        tayCam.addEventListener('touchstart', batDauKeo, { passive: false });
        document.addEventListener('mousemove', khiKeo);
        document.addEventListener('touchmove', khiKeo, { passive: false });
        document.addEventListener('mouseup', ketThucKeo);
        document.addEventListener('touchend', ketThucKeo);
    },

    capNhatBangDieuKhien(chiSoHienTai, tongSoDoan, dangPhat, dangTamDung) {
        const bangDieuKhien = document.getElementById('stv-mini-player');
        const bongBong = document.getElementById('stv-mini-bubble');
        if (!bangDieuKhien || !bongBong) return;

        const theChua = document.querySelector('.contentbox');
        const coCanhBao = document.getElementById('stv-canhbao-mahoa');
        
        if (!theChua && !coCanhBao) {
            bangDieuKhien.classList.add('stv-mp-hidden');
            bongBong.classList.add('stv-mp-hidden');
            return;
        }

        const dangPhatThucSu = dangPhat && !dangTamDung;
        const dangHoatDong = dangPhat || dangTamDung;

        const nguonChuong = document.getElementById('bookchapnameholder');
        const theChuong = document.getElementById('stv-mp-chap');
        if (theChuong && nguonChuong) {
            theChuong.textContent = nguonChuong.innerText.trim() || 'Đang đọc...';
        }

        const thanhDay = document.getElementById('stv-mp-bar-fill');
        const theTienDo = document.getElementById('stv-mp-progress-txt');
        if (thanhDay) thanhDay.style.width = tongSoDoan > 0 ? Math.round(((chiSoHienTai + 1) / tongSoDoan) * 100) + '%' : '0%';
        if (theTienDo) theTienDo.textContent = tongSoDoan > 0 ? `${chiSoHienTai + 1}/${tongSoDoan}` : '—';

        const iPlay = document.getElementById('stv-mp-icon-play');
        const iPause = document.getElementById('stv-mp-icon-pause');
        if (iPlay && iPause) {
            iPlay.style.display = dangPhatThucSu ? 'none' : 'block';
            iPause.style.display = dangPhatThucSu ? 'block' : 'none';
        }

        const nutCheDo = document.getElementById('stv-mp-mode');
        if (nutCheDo) {
            nutCheDo.textContent = this.cheDoMiniPlayer === 'chapter' ? 'CHƯƠNG' : 'ĐOẠN';
            nutCheDo.style.color = this.cheDoMiniPlayer === 'chapter' ? '#e8e6f0' : '#e8a045';
            nutCheDo.style.borderColor = this.cheDoMiniPlayer === 'chapter' ? '#2e2c45' : 'rgba(232,160,69,0.5)';
            nutCheDo.style.background = this.cheDoMiniPlayer === 'chapter' ? 'rgba(255,255,255,0.04)' : 'rgba(232,160,69,0.1)';
        }

        const theCongCu = document.getElementById('stv-mp-engine-badge');
        if (theCongCu) theCongCu.textContent = DocTruyenSTV_Ext.TrinhPhatAmThanh.layCongCuThucTe().toUpperCase();

        if (this.dangThuNhoMiniPlayer) {
            bangDieuKhien.classList.add('stv-mp-hidden');
            bongBong.classList.remove('stv-mp-hidden');
            if (dangPhatThucSu) bongBong.classList.add('stv-playing');
            else bongBong.classList.remove('stv-playing');
        } else {
            bangDieuKhien.classList.remove('stv-mp-hidden');
            bongBong.classList.add('stv-mp-hidden');
            const chamTrangThai = document.getElementById('stv-mp-dot');
            if (chamTrangThai) {
                if (dangPhatThucSu) chamTrangThai.className = 'stv-mp-status-dot';
                else if (dangHoatDong) chamTrangThai.className = 'stv-mp-status-dot paused';
                else chamTrangThai.className = 'stv-mp-status-dot stopped';
            }
        }
    }
};
// noidung/chinh.js
'use strict';
var DocTruyenSTV_Ext = window.DocTruyenSTV_Ext || {};

DocTruyenSTV_Ext.ChinhSTV = {
    batPhimTat: true,
    thoiDiemDungNgu: null,
    idDongHoNgu: null,
    dungSauChuong: 0,
    cauHinhDungTuyChon: null,
    
    daSanSang: false,

    async khoiTao() {
        await DocTruyenSTV_Ext.LuuTruSTV.khoiTao();
        DocTruyenSTV_Ext.TrinhPhatAmThanh.khoiTao();
        DocTruyenSTV_Ext.GiaoDienSTV.taoBangDieuKhien();
        
        // Dọn dẹp cache cũ (chạy ngầm)
        setTimeout(() => DocTruyenSTV_Ext.LuuTruSTV.donDepCacheCu(), 3000);

        chrome.storage.sync.get(['batphimtat'], duLieu => {
            if (duLieu.batphimtat !== undefined) this.batPhimTat = duLieu.batphimtat;
        });

        chrome.storage.onChanged.addListener((thayDoi, vungChon) => {
            if (vungChon === 'sync' && thayDoi.batphimtat) {
                this.batPhimTat = thayDoi.batphimtat.newValue;
            }
            if (vungChon === 'local') {
                if (thayDoi.customDict) DocTruyenSTV_Ext.LuuTruSTV.capNhatTuDien(thayDoi.customDict.newValue || []);
                if (thayDoi.customStopConfig) this.cauHinhDungTuyChon = thayDoi.customStopConfig.newValue;
            }
        });

        chrome.runtime.onMessage.addListener((tinNhan, nguoiGui, guiPhanHoi) => {
            this.xuLyTinNhan(tinNhan, guiPhanHoi);
            return true;
        });

        document.addEventListener('keydown', suKien => this.xuLyPhimTat(suKien));
        
        window.addEventListener('pagehide', () => {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.dungPhat();
            chrome.runtime.sendMessage({ hanhDong: 'huyTatCa' });
            chrome.storage.local.get('last_active_state', duLieu => {
                if (duLieu.last_active_state) {
                    duLieu.last_active_state.isPlaying = false;
                    chrome.storage.local.set({ last_active_state: duLieu.last_active_state });
                }
            });
        });

        this.kiemTraTuDongPhat();
        this.daSanSang = true;
    },

    xuLyTinNhan(tinNhan, guiPhanHoi) {
        if (tinNhan.hanhDong === 'daoTrangThaiPhat') {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.daoTrangThaiPhat();
            guiPhanHoi({ success: true });
        } else if (tinNhan.hanhDong === 'dungPhat') {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.dungPhat();
            guiPhanHoi({ success: true });
        } else if (tinNhan.hanhDong === 'chuongTiep') {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.phatChuongTiepTheo();
            guiPhanHoi({ success: true });
        } else if (tinNhan.hanhDong === 'chuongTruoc') {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.phatChuongTruoc();
            guiPhanHoi({ success: true });
        } else if (tinNhan.hanhDong === 'phatLai') {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.dungPhat();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.batDauPhat(0);
            guiPhanHoi({ success: true });
        } else if (tinNhan.hanhDong === 'capNhatCaiDat') {
            guiPhanHoi({ success: true });
        } else if (tinNhan.hanhDong === 'henGioNgu') {
            if (this.idDongHoNgu) clearTimeout(this.idDongHoNgu);
            if (tinNhan.minutes > 0) {
                this.thoiDiemDungNgu = Date.now() + tinNhan.minutes * 60000;
                chrome.storage.local.set({ sleepTargetTimestamp: this.thoiDiemDungNgu });
                this.idDongHoNgu = setTimeout(() => {
                    DocTruyenSTV_Ext.TrinhPhatAmThanh.dungPhat();
                    chrome.storage.local.remove('sleepTargetTimestamp');
                }, tinNhan.minutes * 60000);
            } else {
                chrome.storage.local.remove('sleepTargetTimestamp');
            }
            guiPhanHoi({ success: true });
        } else if (tinNhan.hanhDong === 'dungSauChuong') {
            this.dungSauChuong = tinNhan.count || 0;
            if (this.dungSauChuong > 0) chrome.storage.local.set({ stopAfterChapters: this.dungSauChuong });
            else chrome.storage.local.remove('stopAfterChapters');
            guiPhanHoi({ success: true });
        } else if (tinNhan.hanhDong === 'dungTuyChinh') {
            this.cauHinhDungTuyChon = tinNhan.config || null;
            if (this.cauHinhDungTuyChon) chrome.storage.local.set({ customStopConfig: this.cauHinhDungTuyChon });
            else chrome.storage.local.remove('customStopConfig');
            guiPhanHoi({ success: true });
        } else if (tinNhan.hanhDong === 'layThongTin') {
            (async () => {
                const tenTruyen = document.getElementById('booknameholder')?.innerText.trim() || document.querySelector('h1')?.innerText.trim() || '';
                const tenChuong = document.getElementById('bookchapnameholder')?.innerText.trim() || '';
                const linkAnh = await DocTruyenSTV_Ext.LuuTruSTV.layAnhBia() || '';
                const p = window.location.pathname.split('/').filter(Boolean);
                const linkTruyen = p.length >= 4 ? `${window.location.origin}/${p[0]}/${p[1]}/${p[2]}/${p[3]}/` : window.location.href;
                
                let thongKe = null;
                if (!tenChuong) {
                    const statsEl = document.querySelectorAll('.blk-item');
                    if (statsEl.length >= 2) {
                        let view = '', like = '', status = '';
                        statsEl.forEach(el => {
                            let text = el.textContent.trim().replace(/\s+/g, ' ');
                            if (el.querySelector('.fa-eye')) {
                                const num = text.replace(/[^\dKkMm\.,]/g, '');
                                if (num && !view) view = num;
                            }
                            else if (el.querySelector('.fa-thumbs-up')) {
                                const num = text.replace(/[^\dKkMm\.,]/g, '');
                                if (num && !like) like = num;
                            }
                            else if (el.querySelector('.fa-star-half-alt') || el.id === 'bookstatus') {
                                if (!status) {
                                    if (text.toLowerCase().includes('còn tiếp') || text.toLowerCase().includes('đang ra')) {
                                        status = 'Còn tiếp';
                                    } else {
                                        status = 'Hoàn thành';
                                    }
                                }
                            }
                        });
                        thongKe = { view, like, status };
                    }
                }
                
                guiPhanHoi({ 
                    bookTitle: tenTruyen, chapTitle: tenChuong, stats: thongKe, imgUrl: linkAnh, bookUrl: linkTruyen, pageUrl: window.location.href, 
                    isPlaying: DocTruyenSTV_Ext.TrinhPhatAmThanh.dangPhat, 
                    isPaused: DocTruyenSTV_Ext.TrinhPhatAmThanh.dangTamDung, 
                    isBuffering: DocTruyenSTV_Ext.TrinhPhatAmThanh.dangTai,
                    ttsEngine: DocTruyenSTV_Ext.TrinhPhatAmThanh.congCu, 
                    progress: DocTruyenSTV_Ext.TrinhPhatAmThanh.cacDoan.length > 0 ? { current: DocTruyenSTV_Ext.TrinhPhatAmThanh.chiSoHienTai + 1, total: DocTruyenSTV_Ext.TrinhPhatAmThanh.cacDoan.length } : null 
                });
            })();
        } else if (tinNhan.hanhDong === 'layGiongDoc') {
            let cacGiong = window.speechSynthesis.getVoices();
            if (cacGiong.length === 0) {
                setTimeout(() => {
                    cacGiong = window.speechSynthesis.getVoices();
                    this._phanHoiGiong(cacGiong, guiPhanHoi);
                }, 500);
            } else {
                this._phanHoiGiong(cacGiong, guiPhanHoi);
            }
        } else if (tinNhan.hanhDong === 'layTrangThai') {
            guiPhanHoi({
                isPlaying: DocTruyenSTV_Ext.TrinhPhatAmThanh.dangPhat,
                isPaused: DocTruyenSTV_Ext.TrinhPhatAmThanh.dangTamDung,
                isBuffering: DocTruyenSTV_Ext.TrinhPhatAmThanh.dangTai,
                ttsEngine: DocTruyenSTV_Ext.TrinhPhatAmThanh.congCu,
                progress: DocTruyenSTV_Ext.TrinhPhatAmThanh.cacDoan.length > 0 ? { current: DocTruyenSTV_Ext.TrinhPhatAmThanh.chiSoHienTai + 1, total: DocTruyenSTV_Ext.TrinhPhatAmThanh.cacDoan.length } : null
            });
        } else if (tinNhan.hanhDong === 'doanTiep') {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.nhayDoan('tiep');
            guiPhanHoi({ success: true });
        } else if (tinNhan.hanhDong === 'doanTruoc') {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.nhayDoan('truoc');
            guiPhanHoi({ success: true });
        }
    },

    _phanHoiGiong(cacGiong, guiPhanHoi) {
        let mang = cacGiong.map((v, i) => ({ name: v.name, lang: v.lang || 'unknown', index: i }));
        const mangVi = mang.filter(v => v.lang.startsWith('vi'));
        if (mangVi.length > 0) mang = mangVi;
        
        mang.sort((a, b) => {
            const aVi = a.lang.startsWith('vi');
            const bVi = b.lang.startsWith('vi');
            if (aVi && !bVi) return -1;
            if (!aVi && bVi) return 1;
            return a.name.localeCompare(b.name);
        });
        guiPhanHoi({ voices: mang, hasVi: mang.some(v => v.lang.startsWith('vi')) });
    },

    xuLyPhimTat(suKien) {
        if (!this.batPhimTat) return;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(suKien.target.tagName) || suKien.target.isContentEditable || suKien.isComposing) return;
        if (suKien.target.closest && suKien.target.closest('#stv-mini-player, #stv-mini-bubble')) return;
        
        switch (suKien.key.toLowerCase()) {
            case 'k': suKien.preventDefault(); DocTruyenSTV_Ext.TrinhPhatAmThanh.daoTrangThaiPhat(); break;
            case 'arrowleft': suKien.preventDefault(); DocTruyenSTV_Ext.TrinhPhatAmThanh.phatChuongTruoc(); break;
            case 'arrowright': suKien.preventDefault(); DocTruyenSTV_Ext.TrinhPhatAmThanh.phatChuongTiepTheo(); break;
            case 'r': suKien.preventDefault(); DocTruyenSTV_Ext.TrinhPhatAmThanh.dungPhat(); DocTruyenSTV_Ext.TrinhPhatAmThanh.batDauPhat(0); break;
            case 'escape': suKien.preventDefault(); DocTruyenSTV_Ext.TrinhPhatAmThanh.dungPhat(); break;
        }
    },

    kiemTraTuDongPhat() {
        chrome.storage.local.get(['autoStartOnLoad', 'customStopConfig', 'sleepTargetTimestamp'], duLieu => {
            if (duLieu.customStopConfig) this.cauHinhDungTuyChon = duLieu.customStopConfig;
            
            if (duLieu.sleepTargetTimestamp) {
                const conLai = duLieu.sleepTargetTimestamp - Date.now();
                if (conLai > 0) this.idDongHoNgu = setTimeout(() => { DocTruyenSTV_Ext.TrinhPhatAmThanh.dungPhat(); chrome.storage.local.remove('sleepTargetTimestamp'); }, conLai);
                else chrome.storage.local.remove('sleepTargetTimestamp');
            }

            if (duLieu.autoStartOnLoad) {
                chrome.storage.local.remove('autoStartOnLoad');
                
                let soLanKiem = 20;
                const dongHoKiem = setInterval(() => {
                    const theChua = document.querySelector('.contentbox');
                    if (theChua && !theChua.innerText.includes('Đang tải nội dung') && theChua.innerText.trim().length >= 50) {
                        clearInterval(dongHoKiem);
                        
                        if (this.dungSauChuong > 0) {
                            this.dungSauChuong--;
                            chrome.storage.local.set({ stopAfterChapters: this.dungSauChuong });
                            if (this.dungSauChuong === 0) return;
                        }
                        
                        DocTruyenSTV_Ext.TrinhPhatAmThanh.chuanBiCacDoan();
                        DocTruyenSTV_Ext.PhanTichSTV.kiemTraMaHoa();
                        
                        let tuViTri = 0;
                        chrome.storage.local.get('readingList', dsDuLieu => {
                            let danhSach = dsDuLieu.readingList || [];
                            let tieuDe = document.getElementById('booknameholder')?.innerText.trim();
                            let muc = danhSach.find(i => (i.title || '').trim().toLowerCase() === (tieuDe || '').trim().toLowerCase());
                            if (muc && muc.url === window.location.href && muc.chunkIndex > 1) {
                                tuViTri = muc.chunkIndex - 1;
                            }
                            DocTruyenSTV_Ext.TrinhPhatAmThanh.batDauPhat(tuViTri);
                        });
                        
                    } else if (--soLanKiem <= 0) {
                        clearInterval(dongHoKiem);
                    }
                }, 1000);
            } else {
                let soLanKiem = 40;
                const dongHoKiem = setInterval(() => {
                    const el = document.querySelector('.contentbox');
                    if (el && !el.innerText.includes('Đang tải nội dung') && el.innerText.trim().length >= 50) {
                        clearInterval(dongHoKiem);
                        DocTruyenSTV_Ext.TrinhPhatAmThanh.chuanBiCacDoan();
                        DocTruyenSTV_Ext.PhanTichSTV.kiemTraMaHoa();
                        DocTruyenSTV_Ext.GiaoDienSTV.capNhatBangDieuKhien(0, DocTruyenSTV_Ext.TrinhPhatAmThanh.cacDoan.length, false, false);
                    } else if (--soLanKiem <= 0) {
                        clearInterval(dongHoKiem);
                    }
                }, 500);
            }
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DocTruyenSTV_Ext.ChinhSTV.khoiTao());
} else {
    DocTruyenSTV_Ext.ChinhSTV.khoiTao();
}

