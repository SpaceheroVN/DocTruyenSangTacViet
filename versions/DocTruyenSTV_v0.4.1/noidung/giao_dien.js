'use strict';
var DocTruyenSTV_Ext = window.DocTruyenSTV_Ext || {};

DocTruyenSTV_Ext.GiaoDienSTV = {
    dang_thu_nho_mini_player: false,
    che_do_mini_player: 'chapter',
    _theBoiDenTruoc: null,

    them_phong_cach() {
        if (!document.getElementById('tts-styles')) {
            const style = document.createElement('style');
            style.id = 'tts-styles';
            style.textContent = `.tts-reading { background-color: rgba(232, 160, 69, 0.35) !important; border-radius: 4px; box-shadow: 0 0 0 2px rgba(232, 160, 69, 0.35) !important; transition: background-color 0.2s, box-shadow 0.2s; color: inherit !important; }`;
            document.head.appendChild(style);
        }
    },

    boi_den_doan(chi_so, danh_sach_doan, dang_phat, dang_tam_dung) {
        if (this._theBoiDenTruoc) {
            this._theBoiDenTruoc.classList.remove('tts-reading');
            this._theBoiDenTruoc = null;
        }
        if (chi_so >= 0 && chi_so < danh_sach_doan.length && danh_sach_doan[chi_so].el) {
            const el = danh_sach_doan[chi_so].el;
            el.classList.add('tts-reading');
            this._theBoiDenTruoc = el;
            if (dang_phat && !dang_tam_dung) {
                const observer = new IntersectionObserver(entries => {
                    if (!entries[0].isIntersecting) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    observer.disconnect();
                }, { rootMargin: '-80px 0px -80px 0px' });
                observer.observe(el);
            }
        }
        
        DocTruyenSTV_Ext.TrinhPhatAmThanh.luu_trang_thai_chong_doi();
        this.cap_nhat_bang_dieu_khien(chi_so, danh_sach_doan.length, dang_phat, dang_tam_dung);
        DocTruyenSTV_Ext.TrinhPhatAmThanh.phat_tin_nhan_trang_thai();
    },

    xoa_boi_den() {
        if (this._theBoiDenTruoc) {
            this._theBoiDenTruoc.classList.remove('tts-reading');
            this._theBoiDenTruoc = null;
        }
    },

    hien_thi_thong_bao(tin_nhan) {
        let thong_bao = document.getElementById('stv-tts-toast');
        if (!thong_bao) {
            thong_bao = document.createElement('div');
            thong_bao.id = 'stv-tts-toast';
            thong_bao.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:var(--accent, #e8a045);color:#fff;padding:8px 16px;border-radius:20px;z-index:999999;font-size:14px;font-family:sans-serif;pointer-events:none;transition:opacity 0.3s;box-shadow:0 4px 10px rgba(0,0,0,0.3);display:flex;align-items:center;gap:6px;';
            document.body.appendChild(thong_bao);
        }
        thong_bao.textContent = tin_nhan;
        thong_bao.style.opacity = '1';
        clearTimeout(thong_bao.timeout);
        thong_bao.timeout = setTimeout(() => { thong_bao.style.opacity = '0'; }, 2000);
    },

    tao_bang_dieu_khien() {
        if (document.getElementById('stv-mini-player')) return;

        const style = document.createElement('style');
        style.id = 'stv-mini-player-styles';
        style.textContent = `
            #stv-mini-player * { outline: none !important; box-sizing: border-box; }
            #stv-mini-player {
                position: fixed; bottom: 20px; left: 14px; width: 282px;
                border-radius: 14px;
                z-index: 2147483646; font-family: 'Be Vietnam Pro', system-ui, -apple-system, sans-serif;
                font-size: 12px; user-select: none;
                backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
                transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
                overflow: hidden;
            }
            #stv-mini-player.stv-mp-hidden { opacity: 0; transform: translateY(16px) scale(0.96); pointer-events: none; }
            #stv-mini-player .stv-mp-drag { padding: 9px 12px 5px 12px; cursor: grab; display: flex; align-items: center; gap: 7px; }
            #stv-mini-player .stv-mp-drag:active { cursor: grabbing; }
            #stv-mini-player .stv-mp-lbl { flex: 1; font-size: 9.5px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            #stv-mini-player .stv-mp-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981; flex-shrink: 0; box-shadow: 0 0 6px rgba(16, 185, 129, 0.5); transition: background 0.3s, box-shadow 0.3s; }
            #stv-mini-player .stv-mp-status-dot.paused { background: #f59e0b; box-shadow: 0 0 6px rgba(245, 158, 11, 0.5); }
            #stv-mini-player .stv-mp-status-dot.stopped { background: #8b89a3; box-shadow: none; }
            #stv-mini-player .stv-mp-min-btn { background: none; border: none; cursor: pointer; padding: 3px; display: flex; align-items: center; justify-content: center; border-radius: 5px; transition: all 0.2s ease; flex-shrink: 0; }
            #stv-mini-player .stv-mp-chap { padding: 0 12px 7px; font-size: 11.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            #stv-mini-player .stv-mp-bar-wrap { padding: 0 12px; margin-bottom: 9px; }
            #stv-mini-player .stv-mp-bar-bg { height: 3.5px; border-radius: 99px; overflow: hidden; }
            #stv-mini-player .stv-mp-bar-fill { height: 100%; border-radius: 99px; width: 0%; transition: width 0.35s ease; }
            #stv-mini-player .stv-mp-controls { display: flex; align-items: center; padding: 2px 10px 10px; gap: 5px; }
            #stv-mini-player .stv-mp-btn { cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); padding: 0; flex-shrink: 0; }
            #stv-mini-player .stv-mp-btn svg { pointer-events: none; }
            #stv-mini-player .stv-mp-btn:active { transform: scale(0.93) !important; }
            #stv-mini-player .stv-mp-btn-sm { width: 29px; height: 29px; border-radius: 8px; }
            #stv-mini-player .stv-mp-btn-play { width: 38px; height: 38px; border-radius: 50%; border: none !important; cursor: pointer; }
            #stv-mini-player .stv-mp-right { flex: 1; display: flex; align-items: center; justify-content: flex-end; gap: 5px; overflow: hidden; }
            #stv-mini-player .stv-mp-progress-txt { font-size: 10px; font-variant-numeric: tabular-nums; white-space: nowrap; flex-shrink: 0; font-weight: 600; }
            #stv-mini-player .stv-mp-engine-badge { max-width: 65px; overflow: hidden; text-overflow: ellipsis; font-size: 8.5px; font-weight: 700; border-radius: 5px; padding: 2px 6px; letter-spacing: 0.5px; white-space: nowrap; flex-shrink: 1; text-transform: uppercase; }
            
            /* Theme Tối (Dark) */
            #stv-mini-player,
            #stv-mini-player[data-theme="dark"] {
                background: linear-gradient(145deg, rgba(26, 25, 41, 0.94) 0%, rgba(16, 15, 26, 0.96) 100%) !important;
                border: 1.5px solid rgba(232, 160, 69, 0.3) !important;
                box-shadow: 0 12px 36px rgba(0, 0, 0, 0.65), 0 0 16px rgba(232, 160, 69, 0.16) !important;
                color: #f1eff8 !important;
            }
            #stv-mini-player .stv-mp-lbl, #stv-mini-player[data-theme="dark"] .stv-mp-lbl { color: #8e8ca8 !important; }
            #stv-mini-player .stv-mp-min-btn, #stv-mini-player[data-theme="dark"] .stv-mp-min-btn { color: #8e8ca8 !important; }
            #stv-mini-player .stv-mp-min-btn:hover, #stv-mini-player[data-theme="dark"] .stv-mp-min-btn:hover { color: #fbbf24 !important; background: rgba(232, 160, 69, 0.16) !important; transform: scale(1.12); }
            #stv-mini-player .stv-mp-chap, #stv-mini-player[data-theme="dark"] .stv-mp-chap { color: #ffffff !important; }
            #stv-mini-player .stv-mp-bar-bg, #stv-mini-player[data-theme="dark"] .stv-mp-bar-bg { background: rgba(255, 255, 255, 0.08) !important; }
            #stv-mini-player .stv-mp-bar-fill, #stv-mini-player[data-theme="dark"] .stv-mp-bar-fill { background: linear-gradient(90deg, #f59e0b, #ec4899) !important; box-shadow: 0 0 8px rgba(245, 158, 11, 0.5); }
            
            #stv-mini-player #stv-mp-mode, #stv-mini-player[data-theme="dark"] #stv-mp-mode {
                height: 29px !important; padding: 0 9px !important; font-size: 10px !important; font-weight: 700 !important;
                border-radius: 7px !important; background: rgba(232, 160, 69, 0.12) !important;
                border: 1px solid rgba(232, 160, 69, 0.35) !important; color: #fbbf24 !important;
            }
            #stv-mini-player #stv-mp-mode:hover, #stv-mini-player[data-theme="dark"] #stv-mp-mode:hover {
                background: linear-gradient(135deg, #e8a045 0%, #c45c8a 100%) !important;
                border-color: transparent !important; color: #ffffff !important;
                transform: translateY(-1.5px) !important; box-shadow: 0 4px 14px rgba(232, 160, 69, 0.45) !important;
            }

            #stv-mini-player .stv-mp-btn-sm, #stv-mini-player[data-theme="dark"] .stv-mp-btn-sm {
                background: rgba(255, 255, 255, 0.06) !important; border: 1px solid rgba(255, 255, 255, 0.12) !important; color: #e8e6f0 !important;
            }
            #stv-mini-player .stv-mp-btn-sm:hover, #stv-mini-player[data-theme="dark"] .stv-mp-btn-sm:hover {
                background: rgba(232, 160, 69, 0.2) !important; border-color: #f59e0b !important; color: #fbbf24 !important;
                transform: translateY(-1.5px) scale(1.08) !important; box-shadow: 0 4px 14px rgba(232, 160, 69, 0.35) !important;
            }

            #stv-mini-player .stv-mp-btn-play, #stv-mini-player[data-theme="dark"] .stv-mp-btn-play {
                background: linear-gradient(135deg, #f59e0b 0%, #ec4899 100%) !important;
                color: #ffffff !important; box-shadow: 0 4px 16px rgba(232, 160, 69, 0.5) !important;
            }
            #stv-mini-player .stv-mp-btn-play:hover, #stv-mini-player[data-theme="dark"] .stv-mp-btn-play:hover {
                background: linear-gradient(135deg, #fbbf24 0%, #f43f5e 100%) !important;
                transform: translateY(-1.5px) scale(1.1) !important;
                box-shadow: 0 6px 22px rgba(232, 160, 69, 0.7), 0 0 12px rgba(236, 72, 153, 0.4) !important;
                filter: brightness(1.06);
            }

            #stv-mini-player .stv-mp-progress-txt, #stv-mini-player[data-theme="dark"] .stv-mp-progress-txt { color: #9c99b6 !important; }
            #stv-mini-player .stv-mp-engine-badge, #stv-mini-player[data-theme="dark"] .stv-mp-engine-badge {
                background: rgba(232, 160, 69, 0.12) !important; border: 1px solid rgba(232, 160, 69, 0.35) !important; color: #fbbf24 !important;
            }

            /* Theme Sáng (Light) */
            #stv-mini-player[data-theme="light"] {
                background: linear-gradient(145deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 244, 252, 0.98) 100%) !important;
                border: 1.5px solid rgba(234, 88, 12, 0.32) !important;
                box-shadow: 0 12px 36px rgba(24, 21, 40, 0.16), 0 0 16px rgba(234, 88, 12, 0.14) !important;
                color: #1a1929 !important;
            }
            #stv-mini-player[data-theme="light"] .stv-mp-lbl { color: #6b6985 !important; }
            #stv-mini-player[data-theme="light"] .stv-mp-min-btn { color: #6b6985 !important; }
            #stv-mini-player[data-theme="light"] .stv-mp-min-btn:hover { color: #ea580c !important; background: rgba(234, 88, 12, 0.15) !important; transform: scale(1.12); }
            #stv-mini-player[data-theme="light"] .stv-mp-chap { color: #1e1b2e !important; }
            #stv-mini-player[data-theme="light"] .stv-mp-bar-bg { background: #e6e2f0 !important; }
            #stv-mini-player[data-theme="light"] .stv-mp-bar-fill { background: linear-gradient(90deg, #ea580c, #db2777) !important; box-shadow: 0 0 8px rgba(234, 88, 12, 0.4); }

            #stv-mini-player[data-theme="light"] #stv-mp-mode {
                height: 29px !important; padding: 0 9px !important; font-size: 10px !important; font-weight: 700 !important;
                border-radius: 7px !important; background: #fff7ed !important;
                border: 1px solid rgba(234, 88, 12, 0.35) !important; color: #ea580c !important;
            }
            #stv-mini-player[data-theme="light"] #stv-mp-mode:hover {
                background: linear-gradient(135deg, #ea580c 0%, #db2777 100%) !important;
                border-color: transparent !important; color: #ffffff !important;
                transform: translateY(-1.5px) !important; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.4) !important;
            }

            #stv-mini-player[data-theme="light"] .stv-mp-btn-sm {
                background: #ffffff !important; border: 1px solid #dcd8ea !important; color: #2e2a42 !important;
                box-shadow: 0 1px 3px rgba(24, 21, 40, 0.05) !important;
            }
            #stv-mini-player[data-theme="light"] .stv-mp-btn-sm:hover {
                background: #fff7ed !important; border-color: #ea580c !important; color: #ea580c !important;
                transform: translateY(-1.5px) scale(1.08) !important; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.28) !important;
            }

            #stv-mini-player[data-theme="light"] .stv-mp-btn-play {
                background: linear-gradient(135deg, #ea580c 0%, #db2777 100%) !important;
                color: #ffffff !important; box-shadow: 0 4px 16px rgba(234, 88, 12, 0.45) !important;
            }
            #stv-mini-player[data-theme="light"] .stv-mp-btn-play:hover {
                background: linear-gradient(135deg, #f97316 0%, #e11d48 100%) !important;
                transform: translateY(-1.5px) scale(1.1) !important;
                box-shadow: 0 6px 22px rgba(234, 88, 12, 0.65), 0 0 12px rgba(219, 39, 119, 0.35) !important;
                filter: brightness(1.06);
            }

            #stv-mini-player .stv-mp-btn-play.stv-mp-locked,
            #stv-mini-player[data-theme="dark"] .stv-mp-btn-play.stv-mp-locked,
            #stv-mini-player[data-theme="light"] .stv-mp-btn-play.stv-mp-locked {
                opacity: 0.5 !important;
                filter: grayscale(0.7) !important;
                cursor: not-allowed !important;
                box-shadow: none !important;
                transform: none !important;
            }
            #stv-mini-player .stv-mp-btn-play.stv-mp-locked:hover,
            #stv-mini-player[data-theme="dark"] .stv-mp-btn-play.stv-mp-locked:hover,
            #stv-mini-player[data-theme="light"] .stv-mp-btn-play.stv-mp-locked:hover {
                transform: none !important;
                box-shadow: none !important;
                filter: grayscale(0.7) !important;
            }

            #stv-mini-player[data-theme="light"] .stv-mp-progress-txt { color: #6b6985 !important; }
            #stv-mini-player[data-theme="light"] .stv-mp-engine-badge {
                background: #fff7ed !important; border: 1px solid rgba(234, 88, 12, 0.3) !important; color: #ea580c !important;
            }

            /* Bong bóng thu nhỏ */
            #stv-mini-bubble {
                position: fixed; bottom: 20px; left: 14px; width: 46px; height: 46px;
                background: linear-gradient(135deg, #e8a045, #c45c8a); color: #ffffff;
                border-radius: 50%; box-shadow: 0 6px 22px rgba(232, 160, 69, 0.55);
                z-index: 2147483646; cursor: pointer; display: flex; align-items: center; justify-content: center;
                transition: opacity 0.25s, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s;
                border: 2px solid rgba(255, 255, 255, 0.2);
            }
            #stv-mini-bubble.stv-mp-hidden { opacity: 0; transform: scale(0.7); pointer-events: none; }
            #stv-mini-bubble:hover { transform: scale(1.12) translateY(-2px); box-shadow: 0 8px 28px rgba(232, 160, 69, 0.75); }
            #stv-mini-bubble:active { transform: scale(0.95); }
            #stv-mini-bubble[data-theme="light"] {
                background: linear-gradient(135deg, #ea580c, #db2777) !important;
                border-color: rgba(255, 255, 255, 0.4) !important;
                box-shadow: 0 6px 22px rgba(234, 88, 12, 0.45) !important;
            }
            #stv-mini-bubble[data-theme="light"]:hover {
                box-shadow: 0 8px 28px rgba(234, 88, 12, 0.65) !important;
            }
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

        chrome.storage.local.get(['mpLeft', 'mpBottom', 'giao_dien_chu_de'], data => {
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
            const chuDe = data.giao_dien_chu_de || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
            player.setAttribute('data-theme', chuDe);
            bubble.setAttribute('data-theme', chuDe);
        });

        this.gan_su_kien();
        if (DocTruyenSTV_Ext.TrinhPhatAmThanh) {
            this.cap_nhat_khoa_tab_khac(DocTruyenSTV_Ext.TrinhPhatAmThanh.thong_tin_tab_khac_dang_phat);
        }
    },

    gan_su_kien() {
        document.getElementById('stv-mp-playpause').addEventListener('click', e => {
            e.stopPropagation();
            if (DocTruyenSTV_Ext.TrinhPhatAmThanh && DocTruyenSTV_Ext.TrinhPhatAmThanh.thong_tin_tab_khac_dang_phat) {
                this.hien_thong_bao_toast(this.tao_thong_bao_khoa_tab(DocTruyenSTV_Ext.TrinhPhatAmThanh.thong_tin_tab_khac_dang_phat));
                return;
            }
            DocTruyenSTV_Ext.TrinhPhatAmThanh.dao_trang_thai_phat();
        });
        
        document.getElementById('stv-mp-mode').addEventListener('click', e => {
            e.stopPropagation();
            this.che_do_mini_player = this.che_do_mini_player === 'chapter' ? 'chunk' : 'chapter';
            chrome.storage.local.set({ miniPlayerMode: this.che_do_mini_player });
            this.cap_nhat_bang_dieu_khien(DocTruyenSTV_Ext.TrinhPhatAmThanh.lay_chi_so_hien_tai(), DocTruyenSTV_Ext.TrinhPhatAmThanh.lay_tong_so_doan(), DocTruyenSTV_Ext.TrinhPhatAmThanh.dang_phat, DocTruyenSTV_Ext.TrinhPhatAmThanh.dang_tam_dung);
        });

        document.getElementById('stv-mp-prev').addEventListener('click', e => {
            e.stopPropagation();
            if (this.che_do_mini_player === 'chapter') DocTruyenSTV_Ext.TrinhPhatAmThanh.phat_chuong_truoc();
            else DocTruyenSTV_Ext.TrinhPhatAmThanh.nhay_doan('truoc');
        });

        document.getElementById('stv-mp-next').addEventListener('click', e => {
            e.stopPropagation();
            if (this.che_do_mini_player === 'chapter') DocTruyenSTV_Ext.TrinhPhatAmThanh.phat_chuong_tiep_theo();
            else DocTruyenSTV_Ext.TrinhPhatAmThanh.nhay_doan('tiep');
        });

        document.getElementById('stv-mp-minimize').addEventListener('click', e => {
            e.stopPropagation();
            this.dang_thu_nho_mini_player = true;
            chrome.storage.local.set({ isMiniPlayerMinimized: true });
            this.cap_nhat_bang_dieu_khien(DocTruyenSTV_Ext.TrinhPhatAmThanh.lay_chi_so_hien_tai(), DocTruyenSTV_Ext.TrinhPhatAmThanh.lay_tong_so_doan(), DocTruyenSTV_Ext.TrinhPhatAmThanh.dang_phat, DocTruyenSTV_Ext.TrinhPhatAmThanh.dang_tam_dung);
        });

        document.getElementById('stv-mini-bubble').addEventListener('click', () => {
            this.dang_thu_nho_mini_player = false;
            chrome.storage.local.set({ isMiniPlayerMinimized: false });
            this.cap_nhat_bang_dieu_khien(DocTruyenSTV_Ext.TrinhPhatAmThanh.lay_chi_so_hien_tai(), DocTruyenSTV_Ext.TrinhPhatAmThanh.lay_tong_so_doan(), DocTruyenSTV_Ext.TrinhPhatAmThanh.dang_phat, DocTruyenSTV_Ext.TrinhPhatAmThanh.dang_tam_dung);
        });

        let dangKeo = false, startX, startY, startLeft, startBottom;
        const tayCam = document.getElementById('stv-mp-drag-handle');
        const bangDieuKhien = document.getElementById('stv-mini-player');
        const bongBong = document.getElementById('stv-mini-bubble');

        const bat_dau_keo = (e) => {
            dangKeo = true;
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            const cy = e.touches ? e.touches[0].clientY : e.clientY;
            const r = bangDieuKhien.getBoundingClientRect();
            startX = cx; startY = cy;
            startLeft = r.left;
            startBottom = window.innerHeight - r.bottom;
            e.preventDefault();
        };

        const khi_keo = (e) => {
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

        const ket_thuc_keo = () => {
            if (dangKeo) {
                dangKeo = false;
                chrome.storage.local.set({ 
                    mpLeft: bangDieuKhien.style.left, 
                    mpBottom: bangDieuKhien.style.bottom 
                });
            }
        };

        tayCam.addEventListener('mousedown', bat_dau_keo);
        tayCam.addEventListener('touchstart', bat_dau_keo, { passive: false });
        document.addEventListener('mousemove', khi_keo);
        document.addEventListener('touchmove', khi_keo, { passive: false });
        document.addEventListener('mouseup', ket_thuc_keo);
        document.addEventListener('touchend', ket_thuc_keo);
    },

    cap_nhat_bang_dieu_khien(chiSoHienTai, tongSoDoan, dang_phat, dang_tam_dung, dangTai = false) {
        const bangDieuKhien = document.getElementById('stv-mini-player');
        const bongBong = document.getElementById('stv-mini-bubble');
        if (!bangDieuKhien || !bongBong) return;

        const theChua = DocTruyenSTV_Ext.PhanTichSTV.tim_khung_noi_dung_hien_tai() || document.querySelector('.contentbox');
        const coCanhBao = document.getElementById('stv-canhbao-mahoa');
        
        if (!theChua && !coCanhBao) {
            bangDieuKhien.classList.add('stv-mp-hidden');
            bongBong.classList.add('stv-mp-hidden');
            return;
        }

        const dangPhatThucSu = dang_phat && !dang_tam_dung;
        const dangHoatDong = dang_phat || dang_tam_dung;

        const nguonChuong = document.getElementById('bookchapnameholder');
        const theChuong = document.getElementById('stv-mp-chap');
        if (theChuong) {
            let noiDungHienThi = '';
            if (DocTruyenSTV_Ext.TrinhPhatAmThanh.cac_doan && DocTruyenSTV_Ext.TrinhPhatAmThanh.cac_doan[chiSoHienTai]) {
                noiDungHienThi = DocTruyenSTV_Ext.TrinhPhatAmThanh.cac_doan[chiSoHienTai].text;
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
            nutCheDo.textContent = this.che_do_mini_player === 'chapter' ? 'CHƯƠNG' : 'ĐOẠN';
            nutCheDo.style.color = this.che_do_mini_player === 'chapter' ? '#e8e6f0' : '#e8a045';
            nutCheDo.style.borderColor = this.che_do_mini_player === 'chapter' ? '#2e2c45' : 'rgba(232,160,69,0.5)';
            nutCheDo.style.background = this.che_do_mini_player === 'chapter' ? 'rgba(255,255,255,0.04)' : 'rgba(232,160,69,0.1)';
        }

        const theCongCu = document.getElementById('stv-mp-engine-badge');
        if (theCongCu) {
            let congCuStr = DocTruyenSTV_Ext.TrinhPhatAmThanh.lay_cong_cu_thuc_te();
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

        if (this.dang_thu_nho_mini_player) {
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

        const btnPlay = document.getElementById('stv-mp-playpause');
        if (btnPlay) {
            const tabKhac = DocTruyenSTV_Ext.TrinhPhatAmThanh ? DocTruyenSTV_Ext.TrinhPhatAmThanh.thong_tin_tab_khac_dang_phat : null;
            if (tabKhac) {
                btnPlay.classList.add('stv-mp-locked');
                btnPlay.title = this.tao_chuoi_tooltip_khoa_tab(tabKhac);
            } else {
                btnPlay.classList.remove('stv-mp-locked');
                btnPlay.title = 'Phát / Dừng';
            }
        }
    },

    tao_thong_bao_khoa_tab(tabDangPhat) {
        const dong1 = 'Đang có trang truyện khác đang phát!';
        if (!tabDangPhat || !tabDangPhat.tenTruyen) return dong1;
        const dong2 = tabDangPhat.tenChuong
            ? `${tabDangPhat.tenTruyen}: ${tabDangPhat.tenChuong} đang phát...`
            : `${tabDangPhat.tenTruyen} đang phát...`;
        return `${dong1}\n${dong2}`;
    },

    tao_chuoi_tooltip_khoa_tab(tabDangPhat) {
        if (!tabDangPhat || !tabDangPhat.tenTruyen) return 'Đang có truyện khác đang phát...';
        return tabDangPhat.tenChuong
            ? `${tabDangPhat.tenTruyen}: ${tabDangPhat.tenChuong} đang phát...`
            : `${tabDangPhat.tenTruyen} đang phát...`;
    },

    cap_nhat_khoa_tab_khac(tabDangPhat) {
        const btnPlay = document.getElementById('stv-mp-playpause');
        if (!btnPlay) return;
        if (tabDangPhat) {
            btnPlay.classList.add('stv-mp-locked');
            btnPlay.title = this.tao_chuoi_tooltip_khoa_tab(tabDangPhat);
        } else {
            btnPlay.classList.remove('stv-mp-locked');
            btnPlay.title = 'Phát / Dừng';
        }
    },

    hien_thong_bao_toast(tin_nhan) {
        if (DocTruyenSTV_Ext.ChinhSTV && typeof DocTruyenSTV_Ext.ChinhSTV.hien_thong_bao_toast === 'function') {
            DocTruyenSTV_Ext.ChinhSTV.hien_thong_bao_toast(tin_nhan);
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

    async khoi_tao() {
        await DocTruyenSTV_Ext.LuuTruSTV.khoi_tao();
        DocTruyenSTV_Ext.TrinhPhatAmThanh.khoi_tao();
        DocTruyenSTV_Ext.GiaoDienSTV.tao_bang_dieu_khien();
        
        setTimeout(() => DocTruyenSTV_Ext.LuuTruSTV.don_dep_cache_cu(), 3000);

        this.phimTatTCH = { 
            playPause: 'K', replay: 'R', prevChap: 'ArrowLeft', nextChap: 'ArrowRight',
            volUp: 'ArrowUp', volDown: 'ArrowDown', speedUp: ']', speedDown: '[', nextSeg: '.', prevSeg: ',' 
        };

        chrome.storage.local.get(['customShortcuts', 'customStopConfig', 'stopAfterChapters'], duLieu => {
            if (duLieu.customShortcuts) this.phimTatTCH = duLieu.customShortcuts;
            if (duLieu.customStopConfig) this.cauHinhDungTuyChon = duLieu.customStopConfig;
            if (duLieu.stopAfterChapters !== undefined) this.dungSauChuong = duLieu.stopAfterChapters;
            
            chrome.storage.sync.get(['batphimtat'], syncData => {
                if (syncData.batphimtat !== undefined) this.batPhimTat = syncData.batphimtat;
                document.addEventListener('keydown', suKien => this.xu_ly_phim_tat(suKien));
            });
        });

        chrome.storage.onChanged.addListener((thayDoi, vungChon) => {
            if (vungChon === 'sync' && thayDoi.batphimtat) {
                this.batPhimTat = thayDoi.batphimtat.newValue;
            }
            if (vungChon === 'local') {
                if (thayDoi.giao_dien_chu_de) {
                    const chuDeMoi = thayDoi.giao_dien_chu_de.newValue || 'dark';
                    const mp = document.getElementById('stv-mini-player');
                    const mb = document.getElementById('stv-mini-bubble');
                    if (mp) mp.setAttribute('data-theme', chuDeMoi);
                    if (mb) mb.setAttribute('data-theme', chuDeMoi);
                }
                if (thayDoi.customDict) {
                    DocTruyenSTV_Ext.LuuTruSTV.cap_nhat_tu_dien(thayDoi.customDict.newValue || []);
                    DocTruyenSTV_Ext.TrinhPhatAmThanh.cap_nhat_tu_dien_dong();
                }
                if (thayDoi.customStopConfig) this.cauHinhDungTuyChon = thayDoi.customStopConfig.newValue;
                if (thayDoi.customShortcuts) this.phimTatTCH = thayDoi.customShortcuts.newValue;
                if (thayDoi.stopAfterChapters !== undefined) this.dungSauChuong = thayDoi.stopAfterChapters.newValue || 0;
            }
        });

        chrome.runtime.onMessage.addListener((tin_nhan, nguoiGui, guiPhanHoi) => {
            this.xu_ly_tin_nhan(tin_nhan, guiPhanHoi);
            return true;
        });
        
        window.addEventListener('pagehide', () => {
            try {
                if (DocTruyenSTV_Ext.LuuTruSTV && DocTruyenSTV_Ext.LuuTruSTV.flush_luu_danh_sach_ngay) {
                    DocTruyenSTV_Ext.LuuTruSTV.flush_luu_danh_sach_ngay();
                }
                DocTruyenSTV_Ext.TrinhPhatAmThanh.dung_phat();
                if (chrome.runtime && chrome.runtime.id) {
                    chrome.runtime.sendMessage({ hanhDong: 'huyTatCa' });
                    chrome.storage.local.set({ 
                        last_active_state: { isPlaying: false, isPaused: false } 
                    });
                }
            } catch (e) {
            }
        });

        this.kiem_tra_tu_dong_phat();
        this.thiet_lap_quan_sat_noi_dung();
        this.daSanSang = true;
    },

    // Quan sát thay đổi nội dung trong trang (khi STV tải chương động bằng AJAX)
    thiet_lap_quan_sat_noi_dung() {
        const mucTieu = document.getElementById('content-container') || document.body;
        if (!mucTieu) return;
        let debounceTimer = null;
        const observer = new MutationObserver(() => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const khungHopLe = DocTruyenSTV_Ext.PhanTichSTV.tim_khung_noi_dung_hien_tai();
                if (khungHopLe) {
                    const _pt = DocTruyenSTV_Ext.TrinhPhatAmThanh;
                    const soDoan = _pt._cacTheDaLuu ? _pt._cacTheDaLuu.filter(t => !t.isTenTruyen && !t.isTenChuong).length : 0;
                    if (!_pt.cac_doan || _pt.cac_doan.length === 0 || soDoan <= 1) {
                        _pt.chuan_bi_cac_doan();
                        DocTruyenSTV_Ext.PhanTichSTV.kiem_tra_ma_hoa();
                        this.cap_nhat_bang_dieu_khien(_pt.chi_so_hien_tai, _pt.cac_doan.length, _pt.dang_phat, _pt.dang_tam_dung);
                    }
                }
            }, 300);
        });
        observer.observe(mucTieu, { childList: true, subtree: true });
    },

    // Xử lý dừng phát khi hết giờ hẹn
    _xu_ly_khi_het_gio_ngu() {
        chrome.storage.local.remove('sleepTargetTimestamp');
        if (this.cauHinhDungTuyChon && this.cauHinhDungTuyChon.operator === 'and') {
            const dkChuong = [this.cauHinhDungTuyChon.left, this.cauHinhDungTuyChon.right].find(c => c && c.type === 'chapters');
            if (dkChuong && this.dungSauChuong > 0) return;
        }
        DocTruyenSTV_Ext.TrinhPhatAmThanh.dung_phat();
        chrome.storage.local.remove(['customStopConfig', 'stopTime', 'stopRealtimeTarget', 'stopAfterChapters']);
    },

    xu_ly_tin_nhan(tin_nhan, guiPhanHoi) {
        if (tin_nhan.hanhDong === 'daoTrangThaiPhat') {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.dao_trang_thai_phat();
            guiPhanHoi({ success: true });
        } else if (tin_nhan.hanhDong === 'dungPhat') {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.dung_phat();
            guiPhanHoi({ success: true });
        } else if (tin_nhan.hanhDong === 'chuongTiep') {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.phat_chuong_tiep_theo();
            guiPhanHoi({ success: true });
        } else if (tin_nhan.hanhDong === 'chuongTruoc') {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.phat_chuong_truoc();
            guiPhanHoi({ success: true });
        } else if (tin_nhan.hanhDong === 'phatLai') {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.dung_phat();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.bat_dau_phat(0);
            guiPhanHoi({ success: true });
        } else if (tin_nhan.hanhDong === 'capNhatCaiDat') {
            if (tin_nhan.voiceIndex !== undefined) {
                DocTruyenSTV_Ext.TrinhPhatAmThanh.cap_nhat_chi_so_giong(tin_nhan.voiceIndex, tin_nhan.voiceName);
            }
            if (tin_nhan.pauseComma !== undefined) {
                DocTruyenSTV_Ext.TrinhPhatAmThanh.thoi_gian_nghi_phay = tin_nhan.pauseComma;
                DocTruyenSTV_Ext.TrinhPhatAmThanh.thoi_gian_nghi_phay = tin_nhan.pauseComma;
            }
            if (tin_nhan.pauseDot !== undefined) {
                DocTruyenSTV_Ext.TrinhPhatAmThanh.thoi_gian_nghi_cham = tin_nhan.pauseDot;
                DocTruyenSTV_Ext.TrinhPhatAmThanh.thoi_gian_nghi_cham = tin_nhan.pauseDot;
            }
            if (tin_nhan.pausePara !== undefined) {
                DocTruyenSTV_Ext.TrinhPhatAmThanh.thoi_gian_nghi_xuong_dong = tin_nhan.pausePara;
                DocTruyenSTV_Ext.TrinhPhatAmThanh.thoi_gian_nghi_xuong_dong = tin_nhan.pausePara;
                DocTruyenSTV_Ext.TrinhPhatAmThanh.thoi_gian_nghi = tin_nhan.pausePara;
            }
            guiPhanHoi({ success: true });
        } else if (tin_nhan.hanhDong === 'doiGiongDoc') {
            if (tin_nhan.voiceIndex !== undefined) {
                DocTruyenSTV_Ext.TrinhPhatAmThanh.cap_nhat_chi_so_giong(tin_nhan.voiceIndex, tin_nhan.voiceName);
            }
            guiPhanHoi({ success: true });
        } else if (tin_nhan.hanhDong === 'henGioNgu') {
            if (this.idDongHoNgu) clearTimeout(this.idDongHoNgu);
            if (tin_nhan.minutes > 0) {
                this.thoiDiemDungNgu = Date.now() + tin_nhan.minutes * 60000;
                chrome.storage.local.set({ sleepTargetTimestamp: this.thoiDiemDungNgu });
                this.idDongHoNgu = setTimeout(() => {
                    this._xu_ly_khi_het_gio_ngu();
                }, tin_nhan.minutes * 60000);
            } else {
                chrome.storage.local.remove('sleepTargetTimestamp');
            }
            guiPhanHoi({ success: true });
        } else if (tin_nhan.hanhDong === 'dungSauChuong') {
            this.dungSauChuong = tin_nhan.count || 0;
            if (this.dungSauChuong > 0) chrome.storage.local.set({ stopAfterChapters: this.dungSauChuong });
            else chrome.storage.local.remove('stopAfterChapters');
            guiPhanHoi({ success: true });
        } else if (tin_nhan.hanhDong === 'dungTuyChinh') {
            this.cauHinhDungTuyChon = tin_nhan.config || null;
            if (this.cauHinhDungTuyChon) chrome.storage.local.set({ customStopConfig: this.cauHinhDungTuyChon });
            else chrome.storage.local.remove('customStopConfig');
            guiPhanHoi({ success: true });
        } else if (tin_nhan.hanhDong === 'layThongTin') {
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
            // Tìm khung nội dung thực sự có chữ của chương (bỏ qua khung đang tải)
            const khungHopLe = DocTruyenSTV_Ext.PhanTichSTV.tim_khung_noi_dung_hien_tai();
            const coNoiDungThat = Boolean(khungHopLe);

            const soDoanNoiDung = _pt._cacTheDaLuu ? _pt._cacTheDaLuu.filter(t => !t.isTenTruyen && !t.isTenChuong).length : 0;
            if (tenChuong && coNoiDungThat && (!_pt.cac_doan || _pt.cac_doan.length === 0 || soDoanNoiDung <= 1)) {
                _pt.chuan_bi_cac_doan();
            }
            guiPhanHoi({ 
                bookTitle: tenTruyen, chapTitle: tenChuong, stats: thongKe, imgUrl: '', bookUrl: linkTruyen, pageUrl: window.location.href, 
                isPlaying: _pt.dang_phat, 
                isPaused: _pt.dang_tam_dung, 
                isBuffering: _pt.dangTai,
                ttsEngine: _pt.congCu, 
                progress: (_pt.cac_doan && _pt.cac_doan.length > 0) ? { current: _pt.chi_so_hien_tai + 1, total: _pt.cac_doan.length } : null,
                absoluteProgress: _pt._cacTheDaLuu ? { current: _pt.lay_chi_so_toan_cuc() + 1 } : ((_pt.cac_doan && _pt.cac_doan.length > 0) ? { current: _pt.chi_so_hien_tai + 1 } : null)
            });
            
            DocTruyenSTV_Ext.LuuTruSTV.lay_anh_bia().then(linkAnh => {
                if (linkAnh) {
                    chrome.runtime.sendMessage({ hanhDong: 'capNhatAnhBia', imgUrl: linkAnh }, () => {
                        if (chrome.runtime.lastError) {  }
                    });
                }
            }).catch(() => {});
        } else if (tin_nhan.hanhDong === 'layTrangThai') {
            const _pt = DocTruyenSTV_Ext.TrinhPhatAmThanh;
            guiPhanHoi({
                isPlaying: _pt.dang_phat,
                isPaused: _pt.dang_tam_dung,
                isBuffering: _pt.dangTai,
                ttsEngine: _pt.congCu,
                progress: _pt.cac_doan.length > 0 ? { current: _pt.chi_so_hien_tai + 1, total: _pt.cac_doan.length } : null
            });
        } else if (tin_nhan.hanhDong === 'layGiongDoc') {
            let cacGiong = window.speechSynthesis.getVoices();
            if (cacGiong.length === 0) {
                setTimeout(() => {
                    cacGiong = window.speechSynthesis.getVoices();
                    this._phan_hoi_giong(cacGiong, guiPhanHoi);
                }, 500);
                return true;
            } else {
                this._phan_hoi_giong(cacGiong, guiPhanHoi);
            }
        } else if (tin_nhan.hanhDong === 'doanTiep') {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.nhay_doan('tiep');
            guiPhanHoi({ success: true });
        } else if (tin_nhan.hanhDong === 'doanTruoc') {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.nhay_doan('truoc');
            guiPhanHoi({ success: true });
        } else if (tin_nhan.hanhDong === 'nhayDenDoan') {
            const chi_so = Number(tin_nhan.chi_so);
            if (!isNaN(chi_so) && chi_so >= 0 && chi_so < DocTruyenSTV_Ext.TrinhPhatAmThanh.cac_doan.length) {
                DocTruyenSTV_Ext.TrinhPhatAmThanh.bat_dau_phat(chi_so);
            }
            guiPhanHoi({ success: true });
        } else if (tin_nhan.hanhDong === 'moModalXemAnh') {
            this.hien_thi_modal_xem_anh(tin_nhan.duongDanAnh, tin_nhan.tenTruyen, tin_nhan.chuDe);
            guiPhanHoi({ success: true });
        }
    },

    // Hiển thị cửa sổ Lightbox xem chi tiết ảnh bìa truyện ra giữa màn hình ngoài trang web (hỗ trợ cả Dark & Light Theme)
    hien_thi_modal_xem_anh(duongDanAnh, tenTruyen, chuDe) {
        if (!duongDanAnh || duongDanAnh.includes('icon128.png')) return;
        
        let cu = document.getElementById('stv-image-lightbox');
        if (cu) cu.remove();

        const laThemeSang = chuDe === 'light' || (!chuDe && (document.documentElement.getAttribute('data-theme') === 'light' || window.matchMedia('(prefers-color-scheme: light)').matches));

        const overlay = document.createElement('div');
        overlay.id = 'stv-image-lightbox';
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 2147483647;
            background: ${laThemeSang ? 'rgba(18, 14, 28, 0.65)' : 'rgba(8, 7, 14, 0.82)'};
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            display: flex; align-items: center; justify-content: center;
            padding: 24px; box-sizing: border-box;
            opacity: 0; transition: opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = laThemeSang ? `
            background: linear-gradient(145deg, #ffffff 0%, #f6f5fb 100%);
            color: #1e1b2e;
            border: 1.5px solid rgba(234, 88, 12, 0.35);
            border-radius: 16px;
            box-shadow: 0 28px 75px rgba(24, 21, 40, 0.28), 0 0 0 1px rgba(234, 88, 12, 0.2), 0 0 30px rgba(234, 88, 12, 0.15);
            max-width: 92vw;
            max-height: 92vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: scale(0.92) translateY(10px);
            transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
        ` : `
            background: linear-gradient(145deg, #181528 0%, #100e1c 100%);
            color: #f0edf7;
            border: 1.5px solid rgba(232, 160, 69, 0.35);
            border-radius: 16px;
            box-shadow: 0 28px 75px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(232, 160, 69, 0.25), 0 0 35px rgba(232, 160, 69, 0.2);
            max-width: 92vw;
            max-height: 92vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: scale(0.92) translateY(10px);
            transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
        `;

        const tieuDeAnToan = (tenTruyen || 'Ảnh bìa truyện').trim();

        // Phần đầu hộp thoại hiển thị ảnh bìa
        const header = document.createElement('div');
        header.style.cssText = laThemeSang ? `
            padding: 13px 20px;
            border-bottom: 1px solid rgba(24, 21, 40, 0.08);
            display: flex; align-items: center; justify-content: space-between;
            gap: 16px; background: rgba(234, 88, 12, 0.04);
        ` : `
            padding: 13px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            display: flex; align-items: center; justify-content: space-between;
            gap: 16px; background: rgba(232, 160, 69, 0.04);
        `;

        const titleSpan = document.createElement('div');
        titleSpan.style.cssText = `
            font-size: 15px; font-weight: 700; color: ${laThemeSang ? '#181528' : '#ffffff'};
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            display: flex; align-items: center; gap: 8px;
        `;
        titleSpan.innerHTML = `
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="${laThemeSang ? '#ea580c' : '#e8a045'}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
            <span style="overflow: hidden; text-overflow: ellipsis;">${tieuDeAnToan}</span>
        `;
        header.appendChild(titleSpan);

        const btnX = document.createElement('button');
        btnX.title = 'Đóng (ESC)';
        btnX.style.cssText = `
            background: ${laThemeSang ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)'};
            border: 1px solid ${laThemeSang ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)'};
            color: ${laThemeSang ? '#5a566f' : '#a09cb0'};
            width: 30px; height: 30px; border-radius: 8px; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.18s ease; flex-shrink: 0;
        `;
        btnX.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        btnX.onmouseenter = () => {
            btnX.style.background = 'rgba(239, 68, 68, 0.18)';
            btnX.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            btnX.style.color = '#ef4444';
            btnX.style.transform = 'rotate(90deg)';
        };
        btnX.onmouseleave = () => {
            btnX.style.background = laThemeSang ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)';
            btnX.style.borderColor = laThemeSang ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)';
            btnX.style.color = laThemeSang ? '#5a566f' : '#a09cb0';
            btnX.style.transform = 'none';
        };
        header.appendChild(btnX);
        dialog.appendChild(header);

        // Body chứa ảnh
        const body = document.createElement('div');
        body.style.cssText = `
            padding: 20px;
            background: ${laThemeSang ? '#ece8f5' : 'rgba(0, 0, 0, 0.45)'};
            display: flex; align-items: center; justify-content: center;
            overflow: auto; flex: 1; min-height: 200px;
        `;

        const img = document.createElement('img');
        img.src = duongDanAnh;
        img.alt = tieuDeAnToan;
        img.referrerPolicy = 'no-referrer';
        img.style.cssText = `
            max-height: calc(85vh - 140px);
            max-width: 100%;
            object-fit: contain;
            display: block;
            border-radius: 10px;
            box-shadow: ${laThemeSang ? '0 10px 32px rgba(24, 21, 40, 0.22)' : '0 10px 38px rgba(0, 0, 0, 0.7)'};
            border: 1px solid ${laThemeSang ? 'rgba(234, 88, 12, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
        `;
        body.appendChild(img);
        dialog.appendChild(body);

        // Footer chứa nút Tải về, Mở tab mới
        const footer = document.createElement('div');
        footer.style.cssText = laThemeSang ? `
            padding: 14px 20px;
            border-top: 1px solid rgba(24, 21, 40, 0.08);
            display: flex; align-items: center; justify-content: flex-end;
            gap: 12px; background: #fdfcff;
        ` : `
            padding: 14px 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            display: flex; align-items: center; justify-content: flex-end;
            gap: 12px; background: #12101e;
        `;

        // Nút mở tab mới
        const btnOpenTab = document.createElement('a');
        btnOpenTab.href = duongDanAnh;
        btnOpenTab.target = '_blank';
        btnOpenTab.rel = 'noopener noreferrer';
        btnOpenTab.style.cssText = laThemeSang ? `
            display: inline-flex; align-items: center; gap: 7px;
            padding: 9px 16px; border-radius: 9px;
            background: #ffffff;
            color: #2e2a42; font-size: 13px; font-weight: 600;
            text-decoration: none; border: 1.5px solid #d8d3e6;
            cursor: pointer; transition: all 0.18s ease;
            box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        ` : `
            display: inline-flex; align-items: center; gap: 7px;
            padding: 9px 16px; border-radius: 9px;
            background: rgba(255, 255, 255, 0.07);
            color: #d0cce0; font-size: 13px; font-weight: 600;
            text-decoration: none; border: 1.5px solid rgba(255, 255, 255, 0.14);
            cursor: pointer; transition: all 0.18s ease;
        `;
        btnOpenTab.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Mở tab mới
        `;
        if (laThemeSang) {
            btnOpenTab.onmouseenter = () => {
                btnOpenTab.style.background = '#f3f0fa';
                btnOpenTab.style.borderColor = '#ea580c';
                btnOpenTab.style.color = '#ea580c';
                btnOpenTab.style.transform = 'translateY(-1px)';
                btnOpenTab.style.boxShadow = '0 4px 12px rgba(234, 88, 12, 0.2)';
            };
            btnOpenTab.onmouseleave = () => {
                btnOpenTab.style.background = '#ffffff';
                btnOpenTab.style.borderColor = '#d8d3e6';
                btnOpenTab.style.color = '#2e2a42';
                btnOpenTab.style.transform = 'none';
                btnOpenTab.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)';
            };
        } else {
            btnOpenTab.onmouseenter = () => {
                btnOpenTab.style.background = 'rgba(255, 255, 255, 0.16)';
                btnOpenTab.style.borderColor = '#e8a045';
                btnOpenTab.style.color = '#ffffff';
                btnOpenTab.style.transform = 'translateY(-1px)';
                btnOpenTab.style.boxShadow = '0 4px 14px rgba(232, 160, 69, 0.25)';
            };
            btnOpenTab.onmouseleave = () => {
                btnOpenTab.style.background = 'rgba(255, 255, 255, 0.07)';
                btnOpenTab.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                btnOpenTab.style.color = '#d0cce0';
                btnOpenTab.style.transform = 'none';
                btnOpenTab.style.boxShadow = 'none';
            };
        }
        footer.appendChild(btnOpenTab);

        // Nút Tải ảnh về
        const btnDownload = document.createElement('button');
        btnDownload.style.cssText = laThemeSang ? `
            display: inline-flex; align-items: center; gap: 8px;
            padding: 9px 20px; border-radius: 9px;
            background: linear-gradient(135deg, #ea580c 0%, #db2777 100%);
            color: #ffffff; font-size: 13px; font-weight: 700;
            border: none; cursor: pointer;
            box-shadow: 0 4px 16px rgba(234, 88, 12, 0.42);
            transition: all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
        ` : `
            display: inline-flex; align-items: center; gap: 8px;
            padding: 9px 20px; border-radius: 9px;
            background: linear-gradient(135deg, #e8a045 0%, #c45c8a 100%);
            color: #ffffff; font-size: 13px; font-weight: 700;
            border: none; cursor: pointer;
            box-shadow: 0 4px 16px rgba(232, 160, 69, 0.45);
            transition: all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
        `;
        btnDownload.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Tải ảnh về
        `;
        btnDownload.onmouseenter = () => {
            btnDownload.style.transform = 'translateY(-2px) scale(1.02)';
            btnDownload.style.boxShadow = laThemeSang
                ? '0 6px 22px rgba(234, 88, 12, 0.58)'
                : '0 6px 24px rgba(232, 160, 69, 0.62)';
            btnDownload.style.filter = 'brightness(1.06)';
        };
        btnDownload.onmouseleave = () => {
            btnDownload.style.transform = 'none';
            btnDownload.style.boxShadow = laThemeSang
                ? '0 4px 16px rgba(234, 88, 12, 0.42)'
                : '0 4px 16px rgba(232, 160, 69, 0.45)';
            btnDownload.style.filter = 'none';
        };
        btnDownload.onmousedown = () => {
            btnDownload.style.transform = 'translateY(1px) scale(0.97)';
        };

        btnDownload.addEventListener('click', async (e) => {
            e.stopPropagation();
            const iconGoc = btnDownload.innerHTML;
            btnDownload.innerHTML = `
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="animation: stv-spin 1s linear infinite;">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Đang tải...
            `;
            try {
                const res = await fetch(duongDanAnh);
                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                const tenFile = tieuDeAnToan.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60) + '.jpg';
                a.download = tenFile;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
                
                btnDownload.innerHTML = `
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Đã lưu ảnh!
                `;
                setTimeout(() => { btnDownload.innerHTML = iconGoc; }, 2000);
            } catch (err) {
                // Fallback nếu chặn CORS
                const a = document.createElement('a');
                a.href = duongDanAnh;
                const tenFile = tieuDeAnToan.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60) + '.jpg';
                a.download = tenFile;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                a.remove();
                btnDownload.innerHTML = iconGoc;
            }
        });

        footer.appendChild(btnDownload);
        dialog.appendChild(footer);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Kích hoạt hoạt ảnh hiển thị
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            dialog.style.transform = 'scale(1)';
        });

        // Xử lý đóng modal
        const dong_hop_thoai = () => {
            overlay.style.opacity = '0';
            dialog.style.transform = 'scale(0.95)';
            setTimeout(() => {
                overlay.remove();
                document.removeEventListener('keydown', xu_ly_phim);
            }, 200);
        };

        const xu_ly_phim = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                dong_hop_thoai();
            }
        };
        document.addEventListener('keydown', xu_ly_phim);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) dong_hop_thoai();
        });
        btnX.addEventListener('click', dong_hop_thoai);
    },

    _phan_hoi_giong(cacGiong, guiPhanHoi) {
        let mang = cacGiong.map((v, i) => ({ name: v.name, lang: v.lang || 'unknown', index: i }));
        const mangVi = mang.filter(v => v.lang.startsWith('vi'));
        if (mangVi.length > 0) mang = mangVi;
        
        mang.sort((a, b) => {
            const aNatural = a.name.includes('Online') || a.name.includes('Natural');
            const bNatural = b.name.includes('Online') || b.name.includes('Natural');
            if (aNatural && !bNatural) return -1;
            if (!aNatural && bNatural) return 1;
            const aVi = a.lang.startsWith('vi');
            const bVi = b.lang.startsWith('vi');
            if (aVi && !bVi) return -1;
            if (!aVi && bVi) return 1;
            return a.name.localeCompare(b.name);
        });
        guiPhanHoi({ voices: mang, hasVi: mang.some(v => v.lang.startsWith('vi')) });
    },

    hien_thong_bao_toast(tin_nhan) {
        let toast = document.getElementById('stv-shortcut-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'stv-shortcut-toast';
            toast.style.cssText = 'position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.88); color: white; padding: 12px 24px; border-radius: 9px; font-size: 14.5px; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; pointer-events: none; transition: opacity 0.3s ease; box-shadow: 0 4px 16px rgba(0,0,0,0.35); font-weight: 500; text-align: center; white-space: pre-wrap; line-height: 1.5;';
            document.body.appendChild(toast);
        }
        toast.textContent = tin_nhan;
        toast.style.opacity = '1';
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            if (toast) toast.style.opacity = '0';
        }, 2500);
    },

    xu_ly_phim_tat(suKien) {
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
            DocTruyenSTV_Ext.TrinhPhatAmThanh.dung_phat();
            return;
        }
        
        if (keyStr === 'Space' || keyStr === this.phimTatTCH.playPause) {
            suKien.preventDefault();
            if (DocTruyenSTV_Ext.TrinhPhatAmThanh && DocTruyenSTV_Ext.TrinhPhatAmThanh.thong_tin_tab_khac_dang_phat) {
                const thong_bao = DocTruyenSTV_Ext.GiaoDienSTV && typeof DocTruyenSTV_Ext.GiaoDienSTV.tao_thong_bao_khoa_tab === 'function'
                    ? DocTruyenSTV_Ext.GiaoDienSTV.tao_thong_bao_khoa_tab(DocTruyenSTV_Ext.TrinhPhatAmThanh.thong_tin_tab_khac_dang_phat)
                    : 'Đang có trang truyện khác đang phát!';
                this.hien_thong_bao_toast(thong_bao);
                return;
            }
            DocTruyenSTV_Ext.TrinhPhatAmThanh.dao_trang_thai_phat();
        } else if (keyStr === this.phimTatTCH.prevChap) {
            suKien.preventDefault();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.phat_chuong_truoc();
            this.hien_thong_bao_toast('Đang chuyển chương trước...');
        } else if (keyStr === this.phimTatTCH.nextChap) {
            suKien.preventDefault();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.phat_chuong_tiep_theo();
            this.hien_thong_bao_toast('Đang chuyển chương sau...');
        } else if (keyStr === this.phimTatTCH.speedDown) {
            suKien.preventDefault();
            chrome.storage.sync.get(['speed'], data => {
                let s = Math.round(((data.speed !== undefined ? data.speed : 1) - 0.1) * 10) / 10;
                if (s < 0.1) s = 0.1;
                chrome.storage.sync.set({ speed: s });
                this.hien_thong_bao_toast(`Tốc độ: ${s}x`);
            });
        } else if (keyStr === this.phimTatTCH.speedUp) {
            suKien.preventDefault();
            chrome.storage.sync.get(['speed'], data => {
                let s = Math.round(((data.speed !== undefined ? data.speed : 1) + 0.1) * 10) / 10;
                if (s > 3.0) s = 3.0;
                chrome.storage.sync.set({ speed: s });
                this.hien_thong_bao_toast(`Tốc độ: ${s}x`);
            });
        } else if (keyStr === this.phimTatTCH.replay) {
            suKien.preventDefault();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.dung_phat();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.bat_dau_phat(0);
        } else if (keyStr === this.phimTatTCH.volUp) {
            suKien.preventDefault();
            chrome.storage.sync.get(['volume'], data => {
                let v = Math.round(((data.volume !== undefined ? data.volume : 1) + 0.1) * 10) / 10;
                let c = DocTruyenSTV_Ext.TrinhPhatAmThanh.lay_cong_cu_thuc_te();
                const maxVol = (c === 'web' || c === 'auto') ? 1.0 : 2.0;
                if (v > maxVol) v = maxVol;
                chrome.storage.sync.set({ volume: v });
                this.hien_thong_bao_toast(`Âm lượng: ${Math.round(v * 100)}%`);
            });
        } else if (keyStr === this.phimTatTCH.volDown) {
            suKien.preventDefault();
            chrome.storage.sync.get(['volume'], data => {
                let v = Math.round(((data.volume !== undefined ? data.volume : 1) - 0.1) * 10) / 10;
                if (v < 0) v = 0;
                chrome.storage.sync.set({ volume: v });
                this.hien_thong_bao_toast(`Âm lượng: ${Math.round(v * 100)}%`);
            });
        } else if (keyStr === this.phimTatTCH.nextSeg) {
            suKien.preventDefault();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.nhay_doan('tiep');
            const pt = DocTruyenSTV_Ext.TrinhPhatAmThanh;
            if (pt.cac_doan && pt.cac_doan.length > 0) {
                this.hien_thong_bao_toast(`Đã chuyển đến đoạn ${Math.min(pt.chi_so_hien_tai + 1, pt.cac_doan.length)} / ${pt.cac_doan.length}`);
            }
        } else if (keyStr === this.phimTatTCH.prevSeg) {
            suKien.preventDefault();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.nhay_doan('truoc');
            const pt = DocTruyenSTV_Ext.TrinhPhatAmThanh;
            if (pt.cac_doan && pt.cac_doan.length > 0) {
                this.hien_thong_bao_toast(`Đã chuyển đến đoạn ${Math.max(pt.chi_so_hien_tai + 1, 1)} / ${pt.cac_doan.length}`);
            }
        }
    },

    kiem_tra_tu_dong_phat() {
        chrome.storage.local.get(['customStopConfig', 'sleepTargetTimestamp', 'stopAfterChapters'], duLieu => {
            if (duLieu.customStopConfig) this.cauHinhDungTuyChon = duLieu.customStopConfig;
            if (duLieu.stopAfterChapters !== undefined) this.dungSauChuong = duLieu.stopAfterChapters;
            
            if (duLieu.sleepTargetTimestamp) {
                const conLai = duLieu.sleepTargetTimestamp - Date.now();
                if (conLai > 0) {
                    this.idDongHoNgu = setTimeout(() => this._xu_ly_khi_het_gio_ngu(), conLai);
                } else {
                    this._xu_ly_khi_het_gio_ngu();
                }
            }

            const cho_noi_dung = (callback) => {
                let daGoi = false;
                const kiem_tra = () => {
                    return Boolean(DocTruyenSTV_Ext.PhanTichSTV.tim_khung_noi_dung_hien_tai());
                };
                
                const thu_goi = () => {
                    if (!daGoi && kiem_tra()) {
                        daGoi = true;
                        if (timerId) clearInterval(timerId);
                        callback();
                    }
                };

                // Kích hoạt ngay lập tức nếu khung nội dung đã có sẵn trong DOM
                if (kiem_tra()) {
                    daGoi = true;
                    callback();
                    return;
                }

                const timerId = setInterval(() => {
                    if (!daGoi) thu_goi();
                    else clearInterval(timerId);
                }, 200);

                setTimeout(() => { 
                    if (!daGoi) { 
                        daGoi = true; 
                        clearInterval(timerId); 
                        callback(); 
                    } 
                }, 8000);
            };

            if (sessionStorage.getItem('autoStartOnLoad') === 'true') {
                sessionStorage.removeItem('autoStartOnLoad');
                
                cho_noi_dung(() => {
                    if (this.dungSauChuong > 0) {
                        this.dungSauChuong--;
                        chrome.storage.local.set({ stopAfterChapters: this.dungSauChuong });
                        if (this.dungSauChuong === 0) {
                            if (this.cauHinhDungTuyChon && this.cauHinhDungTuyChon.operator === 'and') {
                                const dkTime = [this.cauHinhDungTuyChon.left, this.cauHinhDungTuyChon.right].find(c => c && (c.type === 'time' || c.type === 'realtime'));
                                if (dkTime && duLieu.sleepTargetTimestamp && Date.now() < duLieu.sleepTargetTimestamp) {
                                    // Vẫn còn thời gian hẹn
                                } else {
                                    DocTruyenSTV_Ext.TrinhPhatAmThanh.dung_phat();
                                    chrome.storage.local.remove(['customStopConfig', 'stopTime', 'stopRealtimeTarget', 'stopAfterChapters']);
                                    return;
                                }
                            } else {
                                DocTruyenSTV_Ext.TrinhPhatAmThanh.dung_phat();
                                chrome.storage.local.remove(['customStopConfig', 'stopTime', 'stopRealtimeTarget', 'stopAfterChapters']);
                                return;
                            }
                        }
                    }
                    
                    DocTruyenSTV_Ext.TrinhPhatAmThanh.chuan_bi_cac_doan();
                    DocTruyenSTV_Ext.PhanTichSTV.kiem_tra_ma_hoa();
                    
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
                            tuViTri = DocTruyenSTV_Ext.TrinhPhatAmThanh.tinh_chi_so_thuc(muc.chunkIndex - 1);
                        }
                        DocTruyenSTV_Ext.TrinhPhatAmThanh.bat_dau_phat(tuViTri);
                    });
                });
            } else {
                cho_noi_dung(() => {
                    DocTruyenSTV_Ext.TrinhPhatAmThanh.chuan_bi_cac_doan();
                    DocTruyenSTV_Ext.PhanTichSTV.kiem_tra_ma_hoa();

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
                            viTriKhoiPhuc = DocTruyenSTV_Ext.TrinhPhatAmThanh.tinh_chi_so_thuc(muc.chunkIndex - 1);
                        }
                        DocTruyenSTV_Ext.TrinhPhatAmThanh.chi_so_hien_tai = viTriKhoiPhuc;
                        DocTruyenSTV_Ext.GiaoDienSTV.cap_nhat_bang_dieu_khien(viTriKhoiPhuc, DocTruyenSTV_Ext.TrinhPhatAmThanh.cac_doan.length, false, false);
                        if (viTriKhoiPhuc > 0) {
                            DocTruyenSTV_Ext.GiaoDienSTV.boi_den_doan(viTriKhoiPhuc, DocTruyenSTV_Ext.TrinhPhatAmThanh.cac_doan, false, false);
                        }
                    });
                });
            }
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DocTruyenSTV_Ext.ChinhSTV.khoi_tao());
} else {
    DocTruyenSTV_Ext.ChinhSTV.khoi_tao();
}

