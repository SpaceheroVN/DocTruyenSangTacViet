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
        if (this._theBoiDenTruoc) {
            this._theBoiDenTruoc.classList.remove('tts-reading');
            this._theBoiDenTruoc = null;
        }
        if (chiSo >= 0 && chiSo < danhSachDoan.length && danhSachDoan[chiSo].el) {
            const el = danhSachDoan[chiSo].el;
            el.classList.add('tts-reading');
            this._theBoiDenTruoc = el;
            if (dangPhat && !dangTamDung) {
                const observer = new IntersectionObserver(entries => {
                    if (!entries[0].isIntersecting) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    observer.disconnect();
                }, { rootMargin: '-80px 0px -80px 0px' });
                observer.observe(el);
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
            #stv-mini-player .stv-mp-progress-txt { font-size: 10px; color: #7a7896; font-variant-numeric: tabular-nums; white-space: nowrap; flex-shrink: 0; }
            #stv-mini-player .stv-mp-engine-badge { max-width: 65px; overflow: hidden; text-overflow: ellipsis; font-size: 8px; font-weight: 700; background: rgba(255,255,255,0.06); border: 1px solid #2e2c45; border-radius: 4px; padding: 1px 5px; color: #7a7896; letter-spacing: 0.4px; white-space: nowrap; flex-shrink: 1; }
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
            @keyframes stv-spin { 100% { transform: rotate(360deg); } }
            .stv-mp-spinner { animation: stv-spin 1s linear infinite; }
        `;
        document.head.appendChild(style);

        const player = document.createElement('div');
        player.id = 'stv-mini-player';
        player.classList.add('stv-mp-hidden');
        player.innerHTML = `
            <div class="stv-mp-drag" id="stv-mp-drag-handle">
                <span class="stv-mp-status-dot" id="stv-mp-dot"></span>
                <span class="stv-mp-lbl">Đọc Truyện Cho Sáng Tác Việt</span>
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
                    <svg id="stv-mp-icon-pause" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="display:none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    <svg id="stv-mp-icon-loading" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="stv-mp-spinner" style="display:none"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
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

        chrome.storage.local.get(['mpLeft', 'mpBottom'], data => {
            if (data.mpLeft !== undefined) {
                player.style.left = data.mpLeft;
                bubble.style.left = data.mpLeft;
                player.style.right = 'auto';
                bubble.style.right = 'auto';
            }
            if (data.mpBottom !== undefined) {
                player.style.bottom = data.mpBottom;
                bubble.style.bottom = data.mpBottom;
            }
        });

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

        const ketThucKeo = () => {
            if (dangKeo) {
                dangKeo = false;
                chrome.storage.local.set({ 
                    mpLeft: bangDieuKhien.style.left, 
                    mpBottom: bangDieuKhien.style.bottom 
                });
            }
        };

        tayCam.addEventListener('mousedown', batDauKeo);
        tayCam.addEventListener('touchstart', batDauKeo, { passive: false });
        document.addEventListener('mousemove', khiKeo);
        document.addEventListener('touchmove', khiKeo, { passive: false });
        document.addEventListener('mouseup', ketThucKeo);
        document.addEventListener('touchend', ketThucKeo);
    },

    capNhatBangDieuKhien(chiSoHienTai, tongSoDoan, dangPhat, dangTamDung, dangTai = false) {
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
        if (theChuong) {
            let noiDungHienThi = '';
            if (DocTruyenSTV_Ext.TrinhPhatAmThanh.cacDoan && DocTruyenSTV_Ext.TrinhPhatAmThanh.cacDoan[chiSoHienTai]) {
                noiDungHienThi = DocTruyenSTV_Ext.TrinhPhatAmThanh.cacDoan[chiSoHienTai].text;
            }
            if (!noiDungHienThi || noiDungHienThi.length < 5) {
                noiDungHienThi = (nguonChuong ? nguonChuong.innerText.trim() : '');
            }
            if (noiDungHienThi === '-' || !noiDungHienThi) noiDungHienThi = 'Đang tải nội dung...';
            
            noiDungHienThi = noiDungHienThi.replace(/Sáng Tác Việt Chấm Cơm/gi, 'sangtacviet.com');
            
            theChuong.textContent = noiDungHienThi;
        }

        const thanhDay = document.getElementById('stv-mp-bar-fill');
        const theTienDo = document.getElementById('stv-mp-progress-txt');
        if (thanhDay) thanhDay.style.width = tongSoDoan > 0 ? Math.round(((chiSoHienTai + 1) / tongSoDoan) * 100) + '%' : '0%';
        if (theTienDo) theTienDo.textContent = tongSoDoan > 0 ? `${chiSoHienTai + 1}/${tongSoDoan}` : '—';

        const iPlay = document.getElementById('stv-mp-icon-play');
        const iPause = document.getElementById('stv-mp-icon-pause');
        const iLoading = document.getElementById('stv-mp-icon-loading');
        if (iPlay && iPause && iLoading) {
            if (dangTai) {
                iLoading.style.display = 'block';
                iPlay.style.display = 'none';
                iPause.style.display = 'none';
            } else {
                iLoading.style.display = 'none';
                iPlay.style.display = dangPhatThucSu ? 'none' : 'block';
                iPause.style.display = dangPhatThucSu ? 'block' : 'none';
            }
        }

        const nutCheDo = document.getElementById('stv-mp-mode');
        if (nutCheDo) {
            nutCheDo.textContent = this.cheDoMiniPlayer === 'chapter' ? 'CHƯƠNG' : 'ĐOẠN';
            nutCheDo.style.color = this.cheDoMiniPlayer === 'chapter' ? '#e8e6f0' : '#e8a045';
            nutCheDo.style.borderColor = this.cheDoMiniPlayer === 'chapter' ? '#2e2c45' : 'rgba(232,160,69,0.5)';
            nutCheDo.style.background = this.cheDoMiniPlayer === 'chapter' ? 'rgba(255,255,255,0.04)' : 'rgba(232,160,69,0.1)';
        }

        const theCongCu = document.getElementById('stv-mp-engine-badge');
        if (theCongCu) {
            let congCuStr = DocTruyenSTV_Ext.TrinhPhatAmThanh.layCongCuThucTe();
            if (congCuStr === 'web') {
                theCongCu.textContent = 'WEB';
            } else if (congCuStr.startsWith('fpt_') || congCuStr.startsWith('azure_') || congCuStr.startsWith('gcp_') || congCuStr.startsWith('khac_') || /^\d{13}$/.test(congCuStr)) {
                chrome.storage.local.get('customEngines', (data) => {
                    let engines = data.customEngines || [];
                    let engine = engines.find(e => String(e.id) === String(congCuStr));
                    if (engine && engine.name) {
                        theCongCu.textContent = engine.name.toUpperCase();
                    } else {
                        theCongCu.textContent = congCuStr.toUpperCase();
                    }
                });
            } else {
                theCongCu.textContent = congCuStr.toUpperCase();
            }
        }

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
        
        setTimeout(() => DocTruyenSTV_Ext.LuuTruSTV.donDepCacheCu(), 3000);

        this.phimTatTCH = { 
            playPause: 'K', replay: 'R', prevChap: 'ArrowLeft', nextChap: 'ArrowRight',
            volUp: 'ArrowUp', volDown: 'ArrowDown', speedUp: ']', speedDown: '[', nextSeg: '.', prevSeg: ',' 
        };

        chrome.storage.local.get(['customShortcuts', 'customStopConfig'], duLieu => {
            if (duLieu.customShortcuts) this.phimTatTCH = duLieu.customShortcuts;
            if (duLieu.customStopConfig) this.cauHinhDungTuyChon = duLieu.customStopConfig;
            
            chrome.storage.sync.get(['batphimtat'], syncData => {
                if (syncData.batphimtat !== undefined) this.batPhimTat = syncData.batphimtat;
                document.addEventListener('keydown', suKien => this.xuLyPhimTat(suKien));
            });
        });

        chrome.storage.onChanged.addListener((thayDoi, vungChon) => {
            if (vungChon === 'sync' && thayDoi.batphimtat) {
                this.batPhimTat = thayDoi.batphimtat.newValue;
            }
            if (vungChon === 'local') {
                if (thayDoi.customDict) {
                    DocTruyenSTV_Ext.LuuTruSTV.capNhatTuDien(thayDoi.customDict.newValue || []);
                    DocTruyenSTV_Ext.TrinhPhatAmThanh.capNhatTuDienDong();
                }
                if (thayDoi.customStopConfig) this.cauHinhDungTuyChon = thayDoi.customStopConfig.newValue;
                if (thayDoi.customShortcuts) this.phimTatTCH = thayDoi.customShortcuts.newValue;
            }
        });

        chrome.runtime.onMessage.addListener((tinNhan, nguoiGui, guiPhanHoi) => {
            this.xuLyTinNhan(tinNhan, guiPhanHoi);
            return true;
        });
        
        window.addEventListener('pagehide', () => {
            try {
                DocTruyenSTV_Ext.TrinhPhatAmThanh.dungPhat();
                if (chrome.runtime && chrome.runtime.id) {
                    chrome.runtime.sendMessage({ hanhDong: 'huyTatCa' });
                    chrome.storage.local.set({ 
                        last_active_state: { isPlaying: false, isPaused: false } 
                    });
                }
            } catch (e) {
            }
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
            const tenTruyen = document.getElementById('booknameholder')?.innerText.trim() || document.querySelector('h1')?.innerText.trim() || '';
            const tenChuong = document.getElementById('bookchapnameholder')?.innerText.trim() || '';
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
            
            const _pt = DocTruyenSTV_Ext.TrinhPhatAmThanh;
            guiPhanHoi({ 
                bookTitle: tenTruyen, chapTitle: tenChuong, stats: thongKe, imgUrl: '', bookUrl: linkTruyen, pageUrl: window.location.href, 
                isPlaying: _pt.dangPhat, 
                isPaused: _pt.dangTamDung, 
                isBuffering: _pt.dangTai,
                ttsEngine: _pt.congCu, 
                progress: _pt.cacDoan.length > 0 ? { current: _pt.chiSoHienTai + 1, total: _pt.cacDoan.length } : null,
                absoluteProgress: _pt._cacTheDaLuu ? { current: _pt.layChiSoToanCuc() + 1 } : (_pt.cacDoan.length > 0 ? { current: _pt.chiSoHienTai + 1 } : null)
            });
            
            DocTruyenSTV_Ext.LuuTruSTV.layAnhBia().then(linkAnh => {
                if (linkAnh) {
                    chrome.runtime.sendMessage({ hanhDong: 'capNhatAnhBia', imgUrl: linkAnh }, () => {
                        if (chrome.runtime.lastError) {  }
                    });
                }
            }).catch(() => {});
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
        } else if (tinNhan.hanhDong === 'nhayDenDoan') {
            const chiSo = Number(tinNhan.chiSo);
            if (!isNaN(chiSo) && chiSo >= 0 && chiSo < DocTruyenSTV_Ext.TrinhPhatAmThanh.cacDoan.length) {
                DocTruyenSTV_Ext.TrinhPhatAmThanh.batDauPhat(chiSo);
            }
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

    hienThongBaoToast(tinNhan) {
        let toast = document.getElementById('stv-shortcut-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'stv-shortcut-toast';
            toast.style.cssText = 'position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.85); color: white; padding: 12px 24px; border-radius: 8px; font-size: 15px; z-index: 2147483647; font-family: sans-serif; pointer-events: none; transition: opacity 0.3s ease; box-shadow: 0 4px 16px rgba(0,0,0,0.3); font-weight: 500; text-align: center; white-space: pre-wrap;';
            document.body.appendChild(toast);
        }
        toast.textContent = tinNhan;
        toast.style.opacity = '1';
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            if (toast) toast.style.opacity = '0';
        }, 1500);
    },

    xuLyPhimTat(suKien) {
        if (!this.batPhimTat) return;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(suKien.target.tagName) || suKien.target.isContentEditable || suKien.isComposing) return;
        if (suKien.target.closest && suKien.target.closest('#stv-mini-player, #stv-mini-bubble')) return;
        
        let key = suKien.key;
        if (key === ' ') key = 'Space';
        if (key.length === 1) key = key.toUpperCase();
        
        let keyStr = key;
        if (suKien.ctrlKey) keyStr = 'Ctrl+' + keyStr;
        if (suKien.altKey) keyStr = 'Alt+' + keyStr;
        if (suKien.shiftKey && keyStr.length > 1 && !keyStr.includes('+')) keyStr = 'Shift+' + keyStr;
        
        if (keyStr === 'Escape') {
            suKien.preventDefault();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.dungPhat();
            return;
        }
        
        if (keyStr === 'Space' || keyStr === this.phimTatTCH.playPause) {
            suKien.preventDefault();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.daoTrangThaiPhat();
        } else if (keyStr === this.phimTatTCH.prevChap) {
            suKien.preventDefault();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.phatChuongTruoc();
            this.hienThongBaoToast('Đang chuyển chương trước...');
        } else if (keyStr === this.phimTatTCH.nextChap) {
            suKien.preventDefault();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.phatChuongTiepTheo();
            this.hienThongBaoToast('Đang chuyển chương sau...');
        } else if (keyStr === this.phimTatTCH.speedDown) {
            suKien.preventDefault();
            chrome.storage.sync.get(['speed'], data => {
                let s = Math.round(((data.speed !== undefined ? data.speed : 1) - 0.1) * 10) / 10;
                if (s < 0.1) s = 0.1;
                chrome.storage.sync.set({ speed: s });
                this.hienThongBaoToast(`Tốc độ: ${s}x`);
            });
        } else if (keyStr === this.phimTatTCH.speedUp) {
            suKien.preventDefault();
            chrome.storage.sync.get(['speed'], data => {
                let s = Math.round(((data.speed !== undefined ? data.speed : 1) + 0.1) * 10) / 10;
                if (s > 3.0) s = 3.0;
                chrome.storage.sync.set({ speed: s });
                this.hienThongBaoToast(`Tốc độ: ${s}x`);
            });
        } else if (keyStr === this.phimTatTCH.replay) {
            suKien.preventDefault();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.dungPhat();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.batDauPhat(0);
        } else if (keyStr === this.phimTatTCH.volUp) {
            suKien.preventDefault();
            chrome.storage.sync.get(['volume'], data => {
                let v = Math.round(((data.volume !== undefined ? data.volume : 1) + 0.1) * 10) / 10;
                let c = DocTruyenSTV_Ext.TrinhPhatAmThanh.layCongCuThucTe();
                const maxVol = (c === 'web' || c === 'auto') ? 1.0 : 2.0;
                if (v > maxVol) v = maxVol;
                chrome.storage.sync.set({ volume: v });
                this.hienThongBaoToast(`Âm lượng: ${Math.round(v * 100)}%`);
            });
        } else if (keyStr === this.phimTatTCH.volDown) {
            suKien.preventDefault();
            chrome.storage.sync.get(['volume'], data => {
                let v = Math.round(((data.volume !== undefined ? data.volume : 1) - 0.1) * 10) / 10;
                if (v < 0) v = 0;
                chrome.storage.sync.set({ volume: v });
                this.hienThongBaoToast(`Âm lượng: ${Math.round(v * 100)}%`);
            });
        } else if (keyStr === this.phimTatTCH.nextSeg) {
            suKien.preventDefault();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.nhayDoan('tiep');
            const pt = DocTruyenSTV_Ext.TrinhPhatAmThanh;
            if (pt.cacDoan && pt.cacDoan.length > 0) {
                this.hienThongBaoToast(`Đã chuyển đến đoạn ${Math.min(pt.chiSoHienTai + 1, pt.cacDoan.length)} / ${pt.cacDoan.length}`);
            }
        } else if (key === this.phimTatTCH.prevSeg) {
            suKien.preventDefault();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.nhayDoan('truoc');
            const pt = DocTruyenSTV_Ext.TrinhPhatAmThanh;
            if (pt.cacDoan && pt.cacDoan.length > 0) {
                this.hienThongBaoToast(`Đã chuyển đến đoạn ${Math.max(pt.chiSoHienTai + 1, 1)} / ${pt.cacDoan.length}`);
            }
        }
    },

    kiemTraTuDongPhat() {
        chrome.storage.local.get(['customStopConfig', 'sleepTargetTimestamp'], duLieu => {
            if (duLieu.customStopConfig) this.cauHinhDungTuyChon = duLieu.customStopConfig;
            
            if (duLieu.sleepTargetTimestamp) {
                const conLai = duLieu.sleepTargetTimestamp - Date.now();
                if (conLai > 0) this.idDongHoNgu = setTimeout(() => { DocTruyenSTV_Ext.TrinhPhatAmThanh.dungPhat(); chrome.storage.local.remove('sleepTargetTimestamp'); }, conLai);
                else chrome.storage.local.remove('sleepTargetTimestamp');
            }

            const doiNoiDung = (callback) => {
                let daGoi = false;
                const kiemTra = () => {
                    const el = document.querySelector('.contentbox');
                    const chuoiTho = el ? el.innerText.replace(/@Bạn đang đọc bản lưu.*/gi, '').trim() : '';
                    return (el && !el.innerText.includes('Đang tải nội dung') && chuoiTho.length > 50);
                };
                
                const thuGoi = () => {
                    if (!daGoi && kiemTra()) {
                        daGoi = true;
                        callback();
                    }
                };

                const timerId = setInterval(() => {
                    if (!daGoi) thuGoi();
                    else clearInterval(timerId);
                }, 500);
                
                setTimeout(() => { 
                    if(!daGoi) { daGoi = true; callback(); } 
                    clearInterval(timerId); 
                }, 15000);
            };

            if (sessionStorage.getItem('autoStartOnLoad') === 'true') {
                sessionStorage.removeItem('autoStartOnLoad');
                
                doiNoiDung(() => {
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
                        const urlKhop = muc && muc.url && (
                            muc.url === window.location.href ||
                            new URL(muc.url).pathname === window.location.pathname
                        );
                        if (urlKhop && muc.chunkIndex > 1) {
                            tuViTri = DocTruyenSTV_Ext.TrinhPhatAmThanh.tinhChiSoThuc(muc.chunkIndex - 1);
                        }
                        DocTruyenSTV_Ext.TrinhPhatAmThanh.batDauPhat(tuViTri);
                    });
                });
            } else {
                doiNoiDung(() => {
                    DocTruyenSTV_Ext.TrinhPhatAmThanh.chuanBiCacDoan();
                    DocTruyenSTV_Ext.PhanTichSTV.kiemTraMaHoa();

                    chrome.storage.local.get('readingList', dsDuLieu => {
                        const danhSach = dsDuLieu.readingList || [];
                        const tieuDe = document.getElementById('booknameholder')?.innerText.trim();
                        const muc = danhSach.find(i => (i.title || '').trim().toLowerCase() === (tieuDe || '').trim().toLowerCase());
                        const urlKhop = muc && muc.url && (
                            muc.url === window.location.href ||
                            new URL(muc.url).pathname === window.location.pathname
                        );
                        let viTriKhoiPhuc = 0;
                        if (urlKhop && muc.chunkIndex > 1) {
                            viTriKhoiPhuc = DocTruyenSTV_Ext.TrinhPhatAmThanh.tinhChiSoThuc(muc.chunkIndex - 1);
                        }
                        DocTruyenSTV_Ext.TrinhPhatAmThanh.chiSoHienTai = viTriKhoiPhuc;
                        DocTruyenSTV_Ext.GiaoDienSTV.capNhatBangDieuKhien(viTriKhoiPhuc, DocTruyenSTV_Ext.TrinhPhatAmThanh.cacDoan.length, false, false);
                        if (viTriKhoiPhuc > 0) {
                            DocTruyenSTV_Ext.GiaoDienSTV.boiDenDoan(viTriKhoiPhuc, DocTruyenSTV_Ext.TrinhPhatAmThanh.cacDoan, false, false);
                        }
                    });
                });
            }
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DocTruyenSTV_Ext.ChinhSTV.khoiTao());
} else {
    DocTruyenSTV_Ext.ChinhSTV.khoiTao();
}

