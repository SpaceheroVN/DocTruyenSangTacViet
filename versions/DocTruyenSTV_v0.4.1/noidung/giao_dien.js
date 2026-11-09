'use strict';
var DocTruyenSTV_Ext = window.DocTruyenSTV_Ext || {};

DocTruyenSTV_Ext.GiaoDienSTV = {
    dang_thu_nho_mini_player: false,
    che_do_mini_player: 'chapter',
    _the_boi_den_truoc: null,
    get _theBoiDenTruoc() { return this._the_boi_den_truoc; },
    set _theBoiDenTruoc(v) { this._the_boi_den_truoc = v; },

    them_phong_cach() {
        if (!document.getElementById('tts-styles')) {
            const style = document.createElement('style');
            style.id = 'tts-styles';
            style.textContent = `.tts-reading { background-color: rgba(232, 160, 69, 0.35) !important; border-radius: 4px; box-shadow: 0 0 0 2px rgba(232, 160, 69, 0.35) !important; transition: background-color 0.2s, box-shadow 0.2s; color: inherit !important; }`;
            document.head.appendChild(style);
        }
    },

    boi_den_doan(chi_so, danh_sach_doan, dang_phat, dang_tam_dung) {
        if (this._the_boi_den_truoc) {
            this._the_boi_den_truoc.classList.remove('tts-reading');
            this._the_boi_den_truoc = null;
        }
        if (chi_so >= 0 && chi_so < danh_sach_doan.length && danh_sach_doan[chi_so].el) {
            const el = danh_sach_doan[chi_so].el;
            el.classList.add('tts-reading');
            this._the_boi_den_truoc = el;
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
        if (this._the_boi_den_truoc) {
            this._the_boi_den_truoc.classList.remove('tts-reading');
            this._the_boi_den_truoc = null;
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

            /* Cửa sổ xem ảnh bìa (Lightbox) */
            #stv-image-lightbox {
                position: fixed; inset: 0; z-index: 2147483647;
                display: flex; align-items: center; justify-content: center;
                padding: 24px; box-sizing: border-box;
                opacity: 0; transition: opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
                background: rgba(8, 7, 14, 0.82);
            }
            #stv-image-lightbox[data-theme="light"] {
                background: rgba(18, 14, 28, 0.65);
            }

            #stv-image-lightbox .stv-lb-dialog {
                max-width: 92vw; max-height: 92vh;
                display: flex; flex-direction: column; overflow: hidden;
                border-radius: 16px;
                transform: scale(0.92) translateY(10px);
                transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, color 0.25s ease;
                background: linear-gradient(145deg, #181528 0%, #100e1c 100%);
                color: #f0edf7;
                border: 1.5px solid rgba(232, 160, 69, 0.35);
                box-shadow: 0 28px 75px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(232, 160, 69, 0.25), 0 0 35px rgba(232, 160, 69, 0.2);
            }
            #stv-image-lightbox[data-theme="light"] .stv-lb-dialog {
                background: linear-gradient(145deg, #ffffff 0%, #f6f5fb 100%);
                color: #1e1b2e;
                border: 1.5px solid rgba(234, 88, 12, 0.35);
                box-shadow: 0 28px 75px rgba(24, 21, 40, 0.28), 0 0 0 1px rgba(234, 88, 12, 0.2), 0 0 30px rgba(234, 88, 12, 0.15);
            }

            #stv-image-lightbox .stv-lb-header {
                padding: 13px 20px;
                display: flex; align-items: center; justify-content: space-between;
                gap: 16px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                background: rgba(232, 160, 69, 0.04);
                transition: background 0.25s ease, border-color 0.25s ease;
            }
            #stv-image-lightbox[data-theme="light"] .stv-lb-header {
                border-bottom: 1px solid rgba(24, 21, 40, 0.08);
                background: rgba(234, 88, 12, 0.04);
            }

            #stv-image-lightbox .stv-lb-title {
                font-size: 15px; font-weight: 700;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                display: flex; align-items: center; gap: 8px;
                color: #ffffff;
                transition: color 0.25s ease;
            }
            #stv-image-lightbox[data-theme="light"] .stv-lb-title {
                color: #181528;
            }
            #stv-image-lightbox .stv-lb-title svg {
                flex-shrink: 0;
                stroke: #e8a045;
                transition: stroke 0.25s ease;
            }
            #stv-image-lightbox[data-theme="light"] .stv-lb-title svg {
                stroke: #ea580c;
            }

            #stv-image-lightbox .stv-lb-close {
                width: 30px; height: 30px; border-radius: 8px; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #a09cb0;
                transition: all 0.18s ease; flex-shrink: 0;
            }
            #stv-image-lightbox[data-theme="light"] .stv-lb-close {
                background: rgba(0, 0, 0, 0.05);
                border: 1px solid rgba(0, 0, 0, 0.08);
                color: #5a566f;
            }
            #stv-image-lightbox .stv-lb-close:hover {
                background: rgba(239, 68, 68, 0.18) !important;
                border-color: rgba(239, 68, 68, 0.5) !important;
                color: #ef4444 !important;
                transform: rotate(90deg);
            }

            #stv-image-lightbox .stv-lb-body {
                padding: 20px;
                display: flex; align-items: center; justify-content: center;
                overflow: auto; flex: 1; min-height: 200px;
                background: rgba(0, 0, 0, 0.45);
                transition: background 0.25s ease;
            }
            #stv-image-lightbox[data-theme="light"] .stv-lb-body {
                background: #ece8f5;
            }

            #stv-image-lightbox .stv-lb-img {
                max-height: calc(85vh - 140px);
                max-width: 100%; object-fit: contain; display: block;
                border-radius: 10px;
                box-shadow: 0 10px 38px rgba(0, 0, 0, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: box-shadow 0.25s ease, border-color 0.25s ease;
            }
            #stv-image-lightbox[data-theme="light"] .stv-lb-img {
                box-shadow: 0 10px 32px rgba(24, 21, 40, 0.22);
                border: 1px solid rgba(234, 88, 12, 0.2);
            }

            #stv-image-lightbox .stv-lb-footer {
                padding: 14px 20px;
                display: flex; align-items: center; justify-content: flex-end;
                gap: 12px;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                background: #12101e;
                transition: background 0.25s ease, border-color 0.25s ease;
            }
            #stv-image-lightbox[data-theme="light"] .stv-lb-footer {
                border-top: 1px solid rgba(24, 21, 40, 0.08);
                background: #fdfcff;
            }

            #stv-image-lightbox .stv-lb-btn-tab {
                display: inline-flex; align-items: center; gap: 7px;
                padding: 9px 16px; border-radius: 9px;
                font-size: 13px; font-weight: 600; text-decoration: none;
                cursor: pointer;
                background: rgba(255, 255, 255, 0.07);
                color: #d0cce0;
                border: 1.5px solid rgba(255, 255, 255, 0.14);
                transition: all 0.18s ease;
            }
            #stv-image-lightbox .stv-lb-btn-tab:hover {
                background: rgba(255, 255, 255, 0.16);
                border-color: #e8a045;
                color: #ffffff;
                transform: translateY(-1px);
                box-shadow: 0 4px 14px rgba(232, 160, 69, 0.25);
            }
            #stv-image-lightbox[data-theme="light"] .stv-lb-btn-tab {
                background: #ffffff;
                color: #2e2a42;
                border: 1.5px solid #d8d3e6;
                box-shadow: 0 2px 6px rgba(0,0,0,0.05);
            }
            #stv-image-lightbox[data-theme="light"] .stv-lb-btn-tab:hover {
                background: #f3f0fa;
                border-color: #ea580c;
                color: #ea580c;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(234, 88, 12, 0.2);
            }

            #stv-image-lightbox .stv-lb-btn-dl {
                display: inline-flex; align-items: center; gap: 8px;
                padding: 9px 20px; border-radius: 9px;
                color: #ffffff; font-size: 13px; font-weight: 700;
                border: none; cursor: pointer;
                background: linear-gradient(135deg, #e8a045 0%, #c45c8a 100%);
                box-shadow: 0 4px 16px rgba(232, 160, 69, 0.45);
                transition: all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            #stv-image-lightbox .stv-lb-btn-dl:hover {
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 6px 24px rgba(232, 160, 69, 0.62);
                filter: brightness(1.06);
            }
            #stv-image-lightbox[data-theme="light"] .stv-lb-btn-dl {
                background: linear-gradient(135deg, #ea580c 0%, #db2777 100%);
                box-shadow: 0 4px 16px rgba(234, 88, 12, 0.42);
            }
            #stv-image-lightbox[data-theme="light"] .stv-lb-btn-dl:hover {
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 6px 22px rgba(234, 88, 12, 0.58);
                filter: brightness(1.06);
            }
            #stv-image-lightbox .stv-lb-btn-dl:active {
                transform: translateY(1px) scale(0.97) !important;
            }
        `;
        document.head.appendChild(style);

        const trinh_phat = document.createElement('div');
        trinh_phat.id = 'stv-mini-player';
        trinh_phat.classList.add('stv-mp-hidden');
        trinh_phat.innerHTML = `
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
        document.body.appendChild(trinh_phat);

        const bong_bong = document.createElement('div');
        bong_bong.id = 'stv-mini-bubble';
        bong_bong.classList.add('stv-mp-hidden');
        bong_bong.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>';
        document.body.appendChild(bong_bong);

        if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
            try {
                chrome.storage.local.get(['mpLeft', 'mpBottom', 'giao_dien_chu_de'], du_lieu => {
                    if (!du_lieu) return;
                    if (du_lieu.mpLeft !== undefined) {
                        trinh_phat.style.left = du_lieu.mpLeft;
                        bong_bong.style.left = du_lieu.mpLeft;
                        trinh_phat.style.right = 'auto';
                        bong_bong.style.right = 'auto';
                    }
                    if (du_lieu.mpBottom !== undefined) {
                        trinh_phat.style.bottom = du_lieu.mpBottom;
                        bong_bong.style.bottom = du_lieu.mpBottom;
                    }
                    const chu_de = du_lieu.giao_dien_chu_de || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
                    trinh_phat.setAttribute('data-theme', chu_de);
                    bong_bong.setAttribute('data-theme', chu_de);
                });
            } catch (_) {}
        }

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
            if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                try { chrome.storage.local.set({ miniPlayerMode: this.che_do_mini_player }); } catch (_) {}
            }
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
            if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                try { chrome.storage.local.set({ isMiniPlayerMinimized: true }); } catch (_) {}
            }
            this.cap_nhat_bang_dieu_khien(DocTruyenSTV_Ext.TrinhPhatAmThanh.lay_chi_so_hien_tai(), DocTruyenSTV_Ext.TrinhPhatAmThanh.lay_tong_so_doan(), DocTruyenSTV_Ext.TrinhPhatAmThanh.dang_phat, DocTruyenSTV_Ext.TrinhPhatAmThanh.dang_tam_dung);
        });

        document.getElementById('stv-mini-bubble').addEventListener('click', () => {
            this.dang_thu_nho_mini_player = false;
            if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                try { chrome.storage.local.set({ isMiniPlayerMinimized: false }); } catch (_) {}
            }
            this.cap_nhat_bang_dieu_khien(DocTruyenSTV_Ext.TrinhPhatAmThanh.lay_chi_so_hien_tai(), DocTruyenSTV_Ext.TrinhPhatAmThanh.lay_tong_so_doan(), DocTruyenSTV_Ext.TrinhPhatAmThanh.dang_phat, DocTruyenSTV_Ext.TrinhPhatAmThanh.dang_tam_dung);
        });

        let dang_keo = false, toa_do_x_dau, toa_do_y_dau, vi_tri_trai_dau, vi_tri_duoi_dau;
        const tay_cam = document.getElementById('stv-mp-drag-handle');
        const bang_dieu_khien = document.getElementById('stv-mini-player');
        const bong_bong = document.getElementById('stv-mini-bubble');

        const bat_dau_keo = (e) => {
            dang_keo = true;
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            const cy = e.touches ? e.touches[0].clientY : e.clientY;
            const r = bang_dieu_khien.getBoundingClientRect();
            toa_do_x_dau = cx; toa_do_y_dau = cy;
            vi_tri_trai_dau = r.left;
            vi_tri_duoi_dau = window.innerHeight - r.bottom;
            e.preventDefault();
        };

        const khi_keo = (e) => {
            if (!dang_keo) return;
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            const cy = e.touches ? e.touches[0].clientY : e.clientY;
            const vi_tri_trai_moi = Math.max(0, Math.min(window.innerWidth - bang_dieu_khien.offsetWidth, vi_tri_trai_dau + (cx - toa_do_x_dau)));
            const vi_tri_duoi_moi = Math.max(0, Math.min(window.innerHeight - bang_dieu_khien.offsetHeight, vi_tri_duoi_dau - (cy - toa_do_y_dau)));
            bang_dieu_khien.style.left = vi_tri_trai_moi + 'px';
            bang_dieu_khien.style.bottom = vi_tri_duoi_moi + 'px';
            bang_dieu_khien.style.right = 'auto';
            bong_bong.style.left = vi_tri_trai_moi + 'px';
            bong_bong.style.bottom = vi_tri_duoi_moi + 'px';
            bong_bong.style.right = 'auto';
        };

        const ket_thuc_keo = () => {
            if (dang_keo) {
                dang_keo = false;
                if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                    try {
                        chrome.storage.local.set({ 
                            mpLeft: bang_dieu_khien.style.left, 
                            mpBottom: bang_dieu_khien.style.bottom 
                        });
                    } catch (_) {}
                }
            }
        };

        tay_cam.addEventListener('mousedown', bat_dau_keo);
        tay_cam.addEventListener('touchstart', bat_dau_keo, { passive: false });
        document.addEventListener('mousemove', khi_keo);
        document.addEventListener('touchmove', khi_keo, { passive: false });
        document.addEventListener('mouseup', ket_thuc_keo);
        document.addEventListener('touchend', ket_thuc_keo);
    },

    cap_nhat_bang_dieu_khien(chi_so_hien_tai, tong_so_doan, dang_phat, dang_tam_dung, dang_tai = false) {
        const bang_dieu_khien = document.getElementById('stv-mini-player');
        const bong_bong = document.getElementById('stv-mini-bubble');
        if (!bang_dieu_khien || !bong_bong) return;

        const the_chua = DocTruyenSTV_Ext.PhanTichSTV.tim_khung_noi_dung_hien_tai() || document.querySelector('.contentbox');
        const co_canh_bao = document.getElementById('stv-canhbao-mahoa');
        
        if (!the_chua && !co_canh_bao) {
            bang_dieu_khien.classList.add('stv-mp-hidden');
            bong_bong.classList.add('stv-mp-hidden');
            return;
        }

        const dang_phat_thuc_su = dang_phat && !dang_tam_dung;
        const dang_hoat_dong = dang_phat || dang_tam_dung;

        const nguon_chuong = document.getElementById('bookchapnameholder');
        const the_chuong = document.getElementById('stv-mp-chap');
        if (the_chuong) {
            let noi_dung_hien_thi = '';
            if (DocTruyenSTV_Ext.TrinhPhatAmThanh.cac_doan && DocTruyenSTV_Ext.TrinhPhatAmThanh.cac_doan[chi_so_hien_tai]) {
                noi_dung_hien_thi = DocTruyenSTV_Ext.TrinhPhatAmThanh.cac_doan[chi_so_hien_tai].text;
            }
            if (!noi_dung_hien_thi || noi_dung_hien_thi.length < 5) {
                noi_dung_hien_thi = (nguon_chuong ? nguon_chuong.innerText.trim() : '');
            }
            if (noi_dung_hien_thi === '-' || !noi_dung_hien_thi) noi_dung_hien_thi = 'Đang tải nội dung...';
            
            noi_dung_hien_thi = noi_dung_hien_thi.replace(/Sáng Tác Việt Chấm Cơm/gi, 'sangtacviet.com');
            
            the_chuong.textContent = noi_dung_hien_thi;
        }

        const thanh_day = document.getElementById('stv-mp-bar-fill');
        const the_tien_do = document.getElementById('stv-mp-progress-txt');
        if (thanh_day) thanh_day.style.width = tong_so_doan > 0 ? Math.round(((chi_so_hien_tai + 1) / tong_so_doan) * 100) + '%' : '0%';
        if (the_tien_do) the_tien_do.textContent = tong_so_doan > 0 ? `${chi_so_hien_tai + 1}/${tong_so_doan}` : '—';

        const bieu_tuong_phat = document.getElementById('stv-mp-icon-play');
        const bieu_tuong_tam_dung = document.getElementById('stv-mp-icon-pause');
        const bieu_tuong_dang_tai = document.getElementById('stv-mp-icon-loading');
        if (bieu_tuong_phat && bieu_tuong_tam_dung && bieu_tuong_dang_tai) {
            if (dang_tai) {
                bieu_tuong_dang_tai.style.display = 'block';
                bieu_tuong_phat.style.display = 'none';
                bieu_tuong_tam_dung.style.display = 'none';
            } else {
                bieu_tuong_dang_tai.style.display = 'none';
                bieu_tuong_phat.style.display = dang_phat_thuc_su ? 'none' : 'block';
                bieu_tuong_tam_dung.style.display = dang_phat_thuc_su ? 'block' : 'none';
            }
        }

        const nut_che_do = document.getElementById('stv-mp-mode');
        if (nut_che_do) {
            nut_che_do.textContent = this.che_do_mini_player === 'chapter' ? 'CHƯƠNG' : 'ĐOẠN';
            nut_che_do.style.color = this.che_do_mini_player === 'chapter' ? '#e8e6f0' : '#e8a045';
            nut_che_do.style.borderColor = this.che_do_mini_player === 'chapter' ? '#2e2c45' : 'rgba(232,160,69,0.5)';
            nut_che_do.style.background = this.che_do_mini_player === 'chapter' ? 'rgba(255,255,255,0.04)' : 'rgba(232,160,69,0.1)';
        }

        const the_cong_cu = document.getElementById('stv-mp-engine-badge');
        if (the_cong_cu) {
            let chuoi_cong_cu = DocTruyenSTV_Ext.TrinhPhatAmThanh.lay_cong_cu_thuc_te();
            if (chuoi_cong_cu === 'web') {
                the_cong_cu.textContent = 'WEB';
            } else if (chuoi_cong_cu.startsWith('fpt_') || chuoi_cong_cu.startsWith('azure_') || chuoi_cong_cu.startsWith('gcp_') || chuoi_cong_cu.startsWith('khac_') || /^\d{13}$/.test(chuoi_cong_cu)) {
                if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                    try {
                        chrome.storage.local.get('customEngines', (du_lieu) => {
                            let engines = (du_lieu && du_lieu.customEngines) || [];
                            let engine = engines.find(e => String(e.id) === String(chuoi_cong_cu));
                            if (engine && engine.name) {
                                the_cong_cu.textContent = engine.name.toUpperCase();
                            } else {
                                the_cong_cu.textContent = chuoi_cong_cu.toUpperCase();
                            }
                        });
                    } catch (_) {
                        the_cong_cu.textContent = chuoi_cong_cu.toUpperCase();
                    }
                } else {
                    the_cong_cu.textContent = chuoi_cong_cu.toUpperCase();
                }
            } else {
                the_cong_cu.textContent = chuoi_cong_cu.toUpperCase();
            }
        }

        if (this.dang_thu_nho_mini_player) {
            bang_dieu_khien.classList.add('stv-mp-hidden');
            bong_bong.classList.remove('stv-mp-hidden');
            if (dang_phat_thuc_su) bong_bong.classList.add('stv-playing');
            else bong_bong.classList.remove('stv-playing');
        } else {
            bang_dieu_khien.classList.remove('stv-mp-hidden');
            bong_bong.classList.add('stv-mp-hidden');
            const cham_trang_thai = document.getElementById('stv-mp-dot');
            if (cham_trang_thai) {
                if (dang_phat_thuc_su) cham_trang_thai.className = 'stv-mp-status-dot';
                else if (dang_hoat_dong) cham_trang_thai.className = 'stv-mp-status-dot paused';
                else cham_trang_thai.className = 'stv-mp-status-dot stopped';
            }
        }

        const nut_phat = document.getElementById('stv-mp-playpause');
        if (nut_phat) {
            const tab_khac = DocTruyenSTV_Ext.TrinhPhatAmThanh ? DocTruyenSTV_Ext.TrinhPhatAmThanh.thong_tin_tab_khac_dang_phat : null;
            if (tab_khac) {
                nut_phat.classList.add('stv-mp-locked');
                nut_phat.title = this.tao_chuoi_tooltip_khoa_tab(tab_khac);
            } else {
                nut_phat.classList.remove('stv-mp-locked');
                nut_phat.title = 'Phát / Dừng';
            }
        }
    },

    tao_thong_bao_khoa_tab(tab_dang_phat) {
        const dong1 = 'Đang có trang truyện khác đang phát!';
        if (!tab_dang_phat || !tab_dang_phat.tenTruyen) return dong1;
        const dong2 = tab_dang_phat.tenChuong
            ? `${tab_dang_phat.tenTruyen}: ${tab_dang_phat.tenChuong} đang phát...`
            : `${tab_dang_phat.tenTruyen} đang phát...`;
        return `${dong1}\n${dong2}`;
    },

    tao_chuoi_tooltip_khoa_tab(tab_dang_phat) {
        if (!tab_dang_phat || !tab_dang_phat.tenTruyen) return 'Đang có truyện khác đang phát...';
        return tab_dang_phat.tenChuong
            ? `${tab_dang_phat.tenTruyen}: ${tab_dang_phat.tenChuong} đang phát...`
            : `${tab_dang_phat.tenTruyen} đang phát...`;
    },

    cap_nhat_khoa_tab_khac(tab_dang_phat) {
        const nut_phat = document.getElementById('stv-mp-playpause');
        if (!nut_phat) return;
        if (tab_dang_phat) {
            nut_phat.classList.add('stv-mp-locked');
            nut_phat.title = this.tao_chuoi_tooltip_khoa_tab(tab_dang_phat);
        } else {
            nut_phat.classList.remove('stv-mp-locked');
            nut_phat.title = 'Phát / Dừng';
        }
    },

    hien_thong_bao_toast(tin_nhan) {
        if (DocTruyenSTV_Ext.ChinhSTV && typeof DocTruyenSTV_Ext.ChinhSTV.hien_thong_bao_toast === 'function') {
            DocTruyenSTV_Ext.ChinhSTV.hien_thong_bao_toast(tin_nhan);
        }
    }
};

DocTruyenSTV_Ext.ChinhSTV = {
    bat_phim_tat: true,
    get batPhimTat() { return this.bat_phim_tat; },
    set batPhimTat(v) { this.bat_phim_tat = v; },

    thoi_diem_dung_ngu: null,
    get thoiDiemDungNgu() { return this.thoi_diem_dung_ngu; },
    set thoiDiemDungNgu(v) { this.thoi_diem_dung_ngu = v; },

    id_dong_ho_ngu: null,
    get idDongHoNgu() { return this.id_dong_ho_ngu; },
    set idDongHoNgu(v) { this.id_dong_ho_ngu = v; },

    dung_sau_chuong: 0,
    get dungSauChuong() { return this.dung_sau_chuong; },
    set dungSauChuong(v) { this.dung_sau_chuong = v; },

    cau_hinh_dung_tuy_chon: null,
    get cauHinhDungTuyChon() { return this.cau_hinh_dung_tuy_chon; },
    set cauHinhDungTuyChon(v) { this.cau_hinh_dung_tuy_chon = v; },

    _dong_ho_luu_dong_bo: null,
    _du_lieu_cho_dong_bo: {},

    luu_dong_bo_hoan(khoa, gia_tri) {
        this._du_lieu_cho_dong_bo[khoa] = gia_tri;
        if (this._dong_ho_luu_dong_bo) clearTimeout(this._dong_ho_luu_dong_bo);
        this._dong_ho_luu_dong_bo = setTimeout(() => {
            const du_lieu_luu = { ...this._du_lieu_cho_dong_bo };
            this._du_lieu_cho_dong_bo = {};
            this._dong_ho_luu_dong_bo = null;
            if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                try {
                    chrome.storage.sync.set(du_lieu_luu);
                } catch (_) {}
            }
        }, 350);
    },

    cap_nhat_chu_de(chu_de_moi) {
        const mp = document.getElementById('stv-mini-player');
        const mb = document.getElementById('stv-mini-bubble');
        const lb = document.getElementById('stv-image-lightbox');
        if (mp) mp.setAttribute('data-theme', chu_de_moi);
        if (mb) mb.setAttribute('data-theme', chu_de_moi);
        if (lb) lb.setAttribute('data-theme', chu_de_moi);
    },

    cap_nhat_bang_dieu_khien(chi_so_hien_tai, tong_so_doan, dang_phat, dang_tam_dung, dang_tai = false) {
        if (DocTruyenSTV_Ext.GiaoDienSTV && typeof DocTruyenSTV_Ext.GiaoDienSTV.cap_nhat_bang_dieu_khien === 'function') {
            DocTruyenSTV_Ext.GiaoDienSTV.cap_nhat_bang_dieu_khien(chi_so_hien_tai, tong_so_doan, dang_phat, dang_tam_dung, dang_tai);
        }
    },
    
    da_san_sang: false,
    get daSanSang() { return this.da_san_sang; },
    set daSanSang(v) { this.da_san_sang = v; },

    phim_tat_tuy_chinh: { 
        playPause: 'K', replay: 'R', prevChap: 'ArrowLeft', nextChap: 'ArrowRight',
        volUp: 'ArrowUp', volDown: 'ArrowDown', speedUp: ']', speedDown: '[', nextSeg: '.', prevSeg: ',' 
    },
    get phimTatTCH() { return this.phim_tat_tuy_chinh; },
    set phimTatTCH(v) { this.phim_tat_tuy_chinh = v; },

    async khoi_tao() {
        if (!DocTruyenSTV_Ext.la_ngu_canh_hop_le()) return;
        try {
            await DocTruyenSTV_Ext.LuuTruSTV.khoi_tao();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.khoi_tao();
            DocTruyenSTV_Ext.GiaoDienSTV.tao_bang_dieu_khien();
            
            setTimeout(() => {
                if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                    DocTruyenSTV_Ext.LuuTruSTV.don_dep_cache_cu();
                }
            }, 3000);

            chrome.storage.local.get(['customShortcuts', 'customStopConfig', 'stopAfterChapters'], du_lieu => {
                if (!du_lieu) return;
                if (du_lieu.customShortcuts) this.phim_tat_tuy_chinh = du_lieu.customShortcuts;
                if (du_lieu.customStopConfig) this.cau_hinh_dung_tuy_chon = du_lieu.customStopConfig;
                if (du_lieu.stopAfterChapters !== undefined) this.dung_sau_chuong = du_lieu.stopAfterChapters;
                
                if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                    chrome.storage.sync.get(['batphimtat'], du_lieu_dong_bo => {
                        if (du_lieu_dong_bo && du_lieu_dong_bo.batphimtat !== undefined) this.bat_phim_tat = du_lieu_dong_bo.batphimtat;
                        document.addEventListener('keydown', su_kien => this.xu_ly_phim_tat(su_kien));
                    });
                }
            });
        } catch (_) {}

        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
            if (!DocTruyenSTV_Ext.la_ngu_canh_hop_le()) return;
            try {
                chrome.storage.local.get(['giao_dien_chu_de'], du_lieu => {
                    if (du_lieu && !du_lieu.giao_dien_chu_de) {
                        this.cap_nhat_chu_de(e.matches ? 'light' : 'dark');
                    }
                });
            } catch (_) {}
        });

        if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
            chrome.storage.onChanged.addListener((thay_doi, vung_chon) => {
                if (vung_chon === 'sync' && thay_doi.batphimtat) {
                    this.bat_phim_tat = thay_doi.batphimtat.newValue;
                }
                if (vung_chon === 'local') {
                    if (thay_doi.giao_dien_chu_de) {
                        const chu_de_moi = thay_doi.giao_dien_chu_de.newValue || 'dark';
                        this.cap_nhat_chu_de(chu_de_moi);
                    }
                    if (thay_doi.customDict) {
                        DocTruyenSTV_Ext.LuuTruSTV.cap_nhat_tu_dien(thay_doi.customDict.newValue || []);
                        DocTruyenSTV_Ext.TrinhPhatAmThanh.cap_nhat_tu_dien_dong();
                    }
                    if (thay_doi.customStopConfig) this.cau_hinh_dung_tuy_chon = thay_doi.customStopConfig.newValue;
                    if (thay_doi.customShortcuts) this.phim_tat_tuy_chinh = thay_doi.customShortcuts.newValue;
                    if (thay_doi.stopAfterChapters !== undefined) this.dung_sau_chuong = thay_doi.stopAfterChapters.newValue || 0;
                }
            });

            chrome.runtime.onMessage.addListener((tin_nhan, nguoi_gui, gui_phan_hoi) => {
                this.xu_ly_tin_nhan(tin_nhan, gui_phan_hoi);
                return true;
            });
        }
        
        window.addEventListener('pagehide', () => {
            try {
                if (!DocTruyenSTV_Ext.la_ngu_canh_hop_le()) return;
                if (DocTruyenSTV_Ext.LuuTruSTV && DocTruyenSTV_Ext.LuuTruSTV.flush_luu_danh_sach_ngay) {
                    DocTruyenSTV_Ext.LuuTruSTV.flush_luu_danh_sach_ngay();
                }
                DocTruyenSTV_Ext.TrinhPhatAmThanh.dung_phat();
                if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
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
        this.da_san_sang = true;
    },

    // Quan sát thay đổi nội dung trong trang (khi STV tải chương động bằng AJAX)
    thiet_lap_quan_sat_noi_dung() {
        const muc_tieu = document.getElementById('content-container') || document.body;
        if (!muc_tieu) return;
        let dong_ho_hoan = null;
        const observer = new MutationObserver(() => {
            if (dong_ho_hoan) clearTimeout(dong_ho_hoan);
            dong_ho_hoan = setTimeout(() => {
                const khung_hop_le = DocTruyenSTV_Ext.PhanTichSTV.tim_khung_noi_dung_hien_tai();
                if (khung_hop_le) {
                    const _pt = DocTruyenSTV_Ext.TrinhPhatAmThanh;
                    const so_doan = _pt._cac_the_da_luu ? _pt._cac_the_da_luu.filter(t => !(t.la_ten_truyen || t.isTenTruyen) && !(t.la_ten_chuong || t.isTenChuong)).length : 0;
                    if (!_pt.cac_doan || _pt.cac_doan.length === 0 || so_doan <= 1) {
                        _pt.chuan_bi_cac_doan();
                        DocTruyenSTV_Ext.PhanTichSTV.kiem_tra_ma_hoa();
                        DocTruyenSTV_Ext.GiaoDienSTV.cap_nhat_bang_dieu_khien(_pt.chi_so_hien_tai, _pt.cac_doan.length, _pt.dang_phat, _pt.dang_tam_dung);
                    }
                }
            }, 300);
        });
        observer.observe(muc_tieu, { childList: true, subtree: true });
    },

    // Xử lý dừng phát khi hết giờ hẹn
    _xu_ly_khi_het_gio_ngu() {
        if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
            try { chrome.storage.local.remove('sleepTargetTimestamp'); } catch (_) {}
        }
        if (this.cau_hinh_dung_tuy_chon && this.cau_hinh_dung_tuy_chon.operator === 'and') {
            const dk_chuong = [this.cau_hinh_dung_tuy_chon.left, this.cau_hinh_dung_tuy_chon.right].find(c => c && c.type === 'chapters');
            if (dk_chuong && this.dung_sau_chuong > 0) return;
        }
        DocTruyenSTV_Ext.TrinhPhatAmThanh.dung_phat();
        if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
            try { chrome.storage.local.remove(['customStopConfig', 'stopTime', 'stopRealtimeTarget', 'stopAfterChapters']); } catch (_) {}
        }
    },

    xu_ly_tin_nhan(tin_nhan, gui_phan_hoi) {
        if (tin_nhan.hanhDong === 'daoTrangThaiPhat') {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.dao_trang_thai_phat();
            gui_phan_hoi({ success: true });
        } else if (tin_nhan.hanhDong === 'dungPhat') {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.dung_phat();
            gui_phan_hoi({ success: true });
        } else if (tin_nhan.hanhDong === 'chuongTiep') {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.phat_chuong_tiep_theo();
            gui_phan_hoi({ success: true });
        } else if (tin_nhan.hanhDong === 'chuongTruoc') {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.phat_chuong_truoc();
            gui_phan_hoi({ success: true });
        } else if (tin_nhan.hanhDong === 'phatLai') {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.dung_phat();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.bat_dau_phat(0);
            gui_phan_hoi({ success: true });
        } else if (tin_nhan.hanhDong === 'capNhatCaiDat') {
            if (tin_nhan.voiceIndex !== undefined) {
                DocTruyenSTV_Ext.TrinhPhatAmThanh.cap_nhat_chi_so_giong(tin_nhan.voiceIndex, tin_nhan.voiceName);
            }
            if (tin_nhan.pauseComma !== undefined) {
                DocTruyenSTV_Ext.TrinhPhatAmThanh.thoi_gian_nghi_phay = tin_nhan.pauseComma;
            }
            if (tin_nhan.pauseDot !== undefined) {
                DocTruyenSTV_Ext.TrinhPhatAmThanh.thoi_gian_nghi_cham = tin_nhan.pauseDot;
            }
            if (tin_nhan.pausePara !== undefined) {
                DocTruyenSTV_Ext.TrinhPhatAmThanh.thoi_gian_nghi_xuong_dong = tin_nhan.pausePara;
                DocTruyenSTV_Ext.TrinhPhatAmThanh.thoi_gian_nghi = tin_nhan.pausePara;
            }
            gui_phan_hoi({ success: true });
        } else if (tin_nhan.hanhDong === 'doiGiongDoc') {
            if (tin_nhan.voiceIndex !== undefined) {
                DocTruyenSTV_Ext.TrinhPhatAmThanh.cap_nhat_chi_so_giong(tin_nhan.voiceIndex, tin_nhan.voiceName);
            }
            gui_phan_hoi({ success: true });
        } else if (tin_nhan.hanhDong === 'henGioNgu') {
            if (this.id_dong_ho_ngu) clearTimeout(this.id_dong_ho_ngu);
            if (tin_nhan.minutes > 0) {
                this.thoi_diem_dung_ngu = Date.now() + tin_nhan.minutes * 60000;
                if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                    try { chrome.storage.local.set({ sleepTargetTimestamp: this.thoi_diem_dung_ngu }); } catch (_) {}
                }
                this.id_dong_ho_ngu = setTimeout(() => {
                    this._xu_ly_khi_het_gio_ngu();
                }, tin_nhan.minutes * 60000);
            } else {
                if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                    try { chrome.storage.local.remove('sleepTargetTimestamp'); } catch (_) {}
                }
            }
            gui_phan_hoi({ success: true });
        } else if (tin_nhan.hanhDong === 'dungSauChuong') {
            this.dung_sau_chuong = tin_nhan.count || 0;
            if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                try {
                    if (this.dung_sau_chuong > 0) chrome.storage.local.set({ stopAfterChapters: this.dung_sau_chuong });
                    else chrome.storage.local.remove('stopAfterChapters');
                } catch (_) {}
            }
            gui_phan_hoi({ success: true });
        } else if (tin_nhan.hanhDong === 'dungTuyChinh') {
            this.cau_hinh_dung_tuy_chon = tin_nhan.config || null;
            if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                try {
                    if (this.cau_hinh_dung_tuy_chon) chrome.storage.local.set({ customStopConfig: this.cau_hinh_dung_tuy_chon });
                    else chrome.storage.local.remove('customStopConfig');
                } catch (_) {}
            }
            gui_phan_hoi({ success: true });
        } else if (tin_nhan.hanhDong === 'layThongTin') {
            const ten_truyen = document.getElementById('booknameholder')?.innerText.trim() || document.querySelector('h1')?.innerText.trim() || '';
            const ten_chuong = document.getElementById('bookchapnameholder')?.innerText.trim() || '';
            const p = window.location.pathname.split('/').filter(Boolean);
            const duong_dan_truyen = p.length >= 4 ? `${window.location.origin}/${p[0]}/${p[1]}/${p[2]}/${p[3]}/` : window.location.href;
            
            let thong_ke = null;
            if (!ten_chuong) {
                const cac_phan_tu_thong_ke = document.querySelectorAll('.blk-item');
                if (cac_phan_tu_thong_ke.length >= 2) {
                    let view = '', like = '', status = '';
                    cac_phan_tu_thong_ke.forEach(el => {
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
                    thong_ke = { view, like, status };
                }
            }
            
            const _pt = DocTruyenSTV_Ext.TrinhPhatAmThanh;
            // Tìm khung nội dung thực sự có chữ của chương (bỏ qua khung đang tải)
            const khung_hop_le = DocTruyenSTV_Ext.PhanTichSTV.tim_khung_noi_dung_hien_tai();
            const co_noi_dung_that = Boolean(khung_hop_le);

            const so_doan_noi_dung = _pt._cac_the_da_luu ? _pt._cac_the_da_luu.filter(t => !(t.la_ten_truyen || t.isTenTruyen) && !(t.la_ten_chuong || t.isTenChuong)).length : 0;
            if (ten_chuong && co_noi_dung_that && (!_pt.cac_doan || _pt.cac_doan.length === 0 || so_doan_noi_dung <= 1)) {
                _pt.chuan_bi_cac_doan();
            }
            gui_phan_hoi({ 
                bookTitle: ten_truyen, ten_truyen: ten_truyen, chapTitle: ten_chuong, ten_chuong: ten_chuong, stats: thong_ke, thong_ke: thong_ke, imgUrl: '', bookUrl: duong_dan_truyen, duong_dan_truyen: duong_dan_truyen, pageUrl: window.location.href, 
                isPlaying: _pt.dang_phat, 
                dang_phat: _pt.dang_phat,
                isPaused: _pt.dang_tam_dung, 
                dang_tam_dung: _pt.dang_tam_dung,
                isBuffering: _pt.dang_tai,
                dang_tai: _pt.dang_tai,
                ttsEngine: _pt.cong_cu, 
                cong_cu: _pt.cong_cu,
                progress: (_pt.cac_doan && _pt.cac_doan.length > 0) ? { current: _pt.chi_so_hien_tai + 1, total: _pt.cac_doan.length } : null,
                tien_trinh: (_pt.cac_doan && _pt.cac_doan.length > 0) ? { hien_tai: _pt.chi_so_hien_tai + 1, tong_so: _pt.cac_doan.length } : null,
                absoluteProgress: _pt._cac_the_da_luu ? { current: _pt.lay_chi_so_toan_cuc() + 1 } : ((_pt.cac_doan && _pt.cac_doan.length > 0) ? { current: _pt.chi_so_hien_tai + 1 } : null),
                tien_trinh_tuyet_doi: _pt._cac_the_da_luu ? { hien_tai: _pt.lay_chi_so_toan_cuc() + 1 } : ((_pt.cac_doan && _pt.cac_doan.length > 0) ? { hien_tai: _pt.chi_so_hien_tai + 1 } : null)
            });
            
            DocTruyenSTV_Ext.LuuTruSTV.lay_anh_bia().then(duong_dan_anh => {
                if (duong_dan_anh && DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                    try {
                        chrome.runtime.sendMessage({ hanhDong: 'capNhatAnhBia', imgUrl: duong_dan_anh, duong_dan_anh: duong_dan_anh }, () => {
                            if (chrome.runtime?.lastError) {  }
                        });
                    } catch (_) {}
                }
            }).catch(() => {});
        } else if (tin_nhan.hanhDong === 'layTrangThai') {
            const _pt = DocTruyenSTV_Ext.TrinhPhatAmThanh;
            gui_phan_hoi({
                isPlaying: _pt.dang_phat,
                dang_phat: _pt.dang_phat,
                isPaused: _pt.dang_tam_dung,
                dang_tam_dung: _pt.dang_tam_dung,
                isBuffering: _pt.dang_tai,
                dang_tai: _pt.dang_tai,
                ttsEngine: _pt.cong_cu,
                cong_cu: _pt.cong_cu,
                progress: _pt.cac_doan.length > 0 ? { current: _pt.chi_so_hien_tai + 1, total: _pt.cac_doan.length } : null,
                tien_trinh: _pt.cac_doan.length > 0 ? { hien_tai: _pt.chi_so_hien_tai + 1, tong_so: _pt.cac_doan.length } : null
            });
        } else if (tin_nhan.hanhDong === 'layGiongDoc') {
            let cac_giong = window.speechSynthesis.getVoices();
            if (cac_giong.length === 0) {
                setTimeout(() => {
                    cac_giong = window.speechSynthesis.getVoices();
                    this._phan_hoi_giong(cac_giong, gui_phan_hoi);
                }, 500);
                return true;
            } else {
                this._phan_hoi_giong(cac_giong, gui_phan_hoi);
            }
        } else if (tin_nhan.hanhDong === 'doanTiep') {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.nhay_doan('tiep');
            gui_phan_hoi({ success: true });
        } else if (tin_nhan.hanhDong === 'doanTruoc') {
            DocTruyenSTV_Ext.TrinhPhatAmThanh.nhay_doan('truoc');
            gui_phan_hoi({ success: true });
        } else if (tin_nhan.hanhDong === 'nhayDenDoan') {
            const chi_so = Number(tin_nhan.chi_so);
            if (!isNaN(chi_so) && chi_so >= 0 && chi_so < DocTruyenSTV_Ext.TrinhPhatAmThanh.cac_doan.length) {
                DocTruyenSTV_Ext.TrinhPhatAmThanh.bat_dau_phat(chi_so);
            }
            gui_phan_hoi({ success: true });
        } else if (tin_nhan.hanhDong === 'moModalXemAnh') {
            this.hien_thi_modal_xem_anh(tin_nhan.duongDanAnh || tin_nhan.duong_dan_anh, tin_nhan.tenTruyen || tin_nhan.ten_truyen, tin_nhan.chuDe || tin_nhan.chu_de);
            gui_phan_hoi({ success: true });
        } else if (tin_nhan.hanhDong === 'doiChuDe' || tin_nhan.hanh_dong === 'doi_chu_de') {
            const chu_de_moi = tin_nhan.chuDe || tin_nhan.chu_de || 'dark';
            this.cap_nhat_chu_de(chu_de_moi);
            gui_phan_hoi({ success: true });
        }
    },

    // Hiển thị cửa sổ Lightbox xem chi tiết ảnh bìa truyện ra giữa màn hình ngoài trang web (hỗ trợ cả Dark & Light Theme)
    hien_thi_modal_xem_anh(duong_dan_anh, ten_truyen, chu_de) {
        if (!duong_dan_anh || duong_dan_anh.includes('icon128.png')) return;
        
        let cu = document.getElementById('stv-image-lightbox');
        if (cu) cu.remove();

        const mp = document.getElementById('stv-mini-player');
        const chu_de_hien_tai = chu_de || (mp ? mp.getAttribute('data-theme') : null) || (document.documentElement.getAttribute('data-theme') === 'light' || window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

        const overlay = document.createElement('div');
        overlay.id = 'stv-image-lightbox';
        overlay.setAttribute('data-theme', chu_de_hien_tai);

        const dialog = document.createElement('div');
        dialog.className = 'stv-lb-dialog';

        const tieu_de_an_toan = (ten_truyen || 'Ảnh bìa truyện').trim();

        // Phần đầu hộp thoại hiển thị ảnh bìa
        const header = document.createElement('div');
        header.className = 'stv-lb-header';

        const the_tieu_de = document.createElement('div');
        the_tieu_de.className = 'stv-lb-title';
        the_tieu_de.innerHTML = `
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
            <span style="overflow: hidden; text-overflow: ellipsis;">${tieu_de_an_toan}</span>
        `;
        header.appendChild(the_tieu_de);

        const nut_dong = document.createElement('button');
        nut_dong.className = 'stv-lb-close';
        nut_dong.title = 'Đóng (ESC)';
        nut_dong.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        header.appendChild(nut_dong);
        dialog.appendChild(header);

        // Body chứa ảnh
        const body = document.createElement('div');
        body.className = 'stv-lb-body';

        const img = document.createElement('img');
        img.className = 'stv-lb-img';
        img.src = duong_dan_anh;
        img.alt = tieu_de_an_toan;
        img.referrerPolicy = 'no-referrer';
        body.appendChild(img);
        dialog.appendChild(body);

        // Footer chứa nút Tải về, Mở tab mới
        const footer = document.createElement('div');
        footer.className = 'stv-lb-footer';

        // Nút mở tab mới
        const nut_mo_tab = document.createElement('a');
        nut_mo_tab.className = 'stv-lb-btn-tab';
        nut_mo_tab.href = duong_dan_anh;
        nut_mo_tab.target = '_blank';
        nut_mo_tab.rel = 'noopener noreferrer';
        nut_mo_tab.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Mở tab mới
        `;
        footer.appendChild(nut_mo_tab);

        // Nút Tải ảnh về
        const nut_tai_ve = document.createElement('button');
        nut_tai_ve.className = 'stv-lb-btn-dl';
        nut_tai_ve.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Tải ảnh về
        `;

        nut_tai_ve.addEventListener('click', async (e) => {
            e.stopPropagation();
            const bieu_tuong_goc = nut_tai_ve.innerHTML;
            nut_tai_ve.innerHTML = `
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="animation: stv-spin 1s linear infinite;">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Đang tải...
            `;
            try {
                const res = await fetch(duong_dan_anh);
                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                const ten_tep = tieu_de_an_toan.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60) + '.jpg';
                a.download = ten_tep;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
                
                nut_tai_ve.innerHTML = `
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Đã lưu ảnh!
                `;
                setTimeout(() => { nut_tai_ve.innerHTML = bieu_tuong_goc; }, 2000);
            } catch (err) {
                // Fallback nếu chặn CORS
                const a = document.createElement('a');
                a.href = duong_dan_anh;
                const ten_tep = tieu_de_an_toan.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60) + '.jpg';
                a.download = ten_tep;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                a.remove();
                nut_tai_ve.innerHTML = bieu_tuong_goc;
            }
        });

        footer.appendChild(nut_tai_ve);
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
        nut_dong.addEventListener('click', dong_hop_thoai);
    },

    _phan_hoi_giong(cac_giong, gui_phan_hoi) {
        let mang = cac_giong.map((v, i) => ({ name: v.name, lang: v.lang || 'unknown', index: i }));
        const mang_vi = mang.filter(v => v.lang.startsWith('vi'));
        if (mang_vi.length > 0) mang = mang_vi;
        
        mang.sort((a, b) => {
            const a_tu_nhien = a.name.includes('Online') || a.name.includes('Natural');
            const b_tu_nhien = b.name.includes('Online') || b.name.includes('Natural');
            if (a_tu_nhien && !b_tu_nhien) return -1;
            if (!a_tu_nhien && b_tu_nhien) return 1;
            const a_tieng_viet = a.lang.startsWith('vi');
            const b_tieng_viet = b.lang.startsWith('vi');
            if (a_tieng_viet && !b_tieng_viet) return -1;
            if (!a_tieng_viet && b_tieng_viet) return 1;
            return a.name.localeCompare(b.name);
        });
        gui_phan_hoi({ voices: mang, hasVi: mang.some(v => v.lang.startsWith('vi')) });
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
        if (this._dong_ho_thong_bao) clearTimeout(this._dong_ho_thong_bao);
        this._dong_ho_thong_bao = setTimeout(() => {
            if (toast) toast.style.opacity = '0';
        }, 2500);
    },

    xu_ly_phim_tat(su_kien) {
        if (!this.bat_phim_tat) return;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(su_kien.target.tagName) || su_kien.target.isContentEditable || su_kien.isComposing) return;
        if (su_kien.target.closest && su_kien.target.closest('#stv-mini-player, #stv-mini-bubble')) return;
        
        let key = su_kien.key;
        if (key === ' ') key = 'Space';
        if (key.length === 1) key = key.toUpperCase();
        
        let chuoi_phim = key;
        if (su_kien.ctrlKey) chuoi_phim = 'Ctrl+' + chuoi_phim;
        if (su_kien.altKey) chuoi_phim = 'Alt+' + chuoi_phim;
        if (su_kien.shiftKey && chuoi_phim.length > 1 && !chuoi_phim.includes('+')) chuoi_phim = 'Shift+' + chuoi_phim;
        
        if (chuoi_phim === 'Escape') {
            su_kien.preventDefault();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.dung_phat();
            return;
        }
        
        if (chuoi_phim === 'Space' || chuoi_phim === this.phim_tat_tuy_chinh.playPause) {
            su_kien.preventDefault();
            if (DocTruyenSTV_Ext.TrinhPhatAmThanh && DocTruyenSTV_Ext.TrinhPhatAmThanh.thong_tin_tab_khac_dang_phat) {
                const thong_bao = DocTruyenSTV_Ext.GiaoDienSTV && typeof DocTruyenSTV_Ext.GiaoDienSTV.tao_thong_bao_khoa_tab === 'function'
                    ? DocTruyenSTV_Ext.GiaoDienSTV.tao_thong_bao_khoa_tab(DocTruyenSTV_Ext.TrinhPhatAmThanh.thong_tin_tab_khac_dang_phat)
                    : 'Đang có trang truyện khác đang phát!';
                this.hien_thong_bao_toast(thong_bao);
                return;
            }
            DocTruyenSTV_Ext.TrinhPhatAmThanh.dao_trang_thai_phat();
        } else if (chuoi_phim === this.phim_tat_tuy_chinh.prevChap) {
            su_kien.preventDefault();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.phat_chuong_truoc();
            this.hien_thong_bao_toast('Đang chuyển chương trước...');
        } else if (chuoi_phim === this.phim_tat_tuy_chinh.nextChap) {
            su_kien.preventDefault();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.phat_chuong_tiep_theo();
            this.hien_thong_bao_toast('Đang chuyển chương sau...');
        } else if (chuoi_phim === this.phim_tat_tuy_chinh.speedDown) {
            su_kien.preventDefault();
            const pt = DocTruyenSTV_Ext.TrinhPhatAmThanh;
            let s = Math.round(((pt && pt.toc_do !== undefined ? pt.toc_do : 1) - 0.1) * 10) / 10;
            if (s < 0.1) s = 0.1;
            if (pt) pt.toc_do = s;
            this.luu_dong_bo_hoan('speed', s);
            this.hien_thong_bao_toast(`Tốc độ: ${s}x`);
        } else if (chuoi_phim === this.phim_tat_tuy_chinh.speedUp) {
            su_kien.preventDefault();
            const pt = DocTruyenSTV_Ext.TrinhPhatAmThanh;
            let s = Math.round(((pt && pt.toc_do !== undefined ? pt.toc_do : 1) + 0.1) * 10) / 10;
            if (s > 3.0) s = 3.0;
            if (pt) pt.toc_do = s;
            this.luu_dong_bo_hoan('speed', s);
            this.hien_thong_bao_toast(`Tốc độ: ${s}x`);
        } else if (chuoi_phim === this.phim_tat_tuy_chinh.replay) {
            su_kien.preventDefault();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.dung_phat();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.bat_dau_phat(0);
        } else if (chuoi_phim === this.phim_tat_tuy_chinh.volUp) {
            su_kien.preventDefault();
            const pt = DocTruyenSTV_Ext.TrinhPhatAmThanh;
            let v = Math.round(((pt && pt.am_luong !== undefined ? pt.am_luong : 1) + 0.1) * 10) / 10;
            let c = pt ? pt.lay_cong_cu_thuc_te() : 'web';
            const am_luong_toi_da = (c === 'web' || c === 'auto') ? 1.0 : 2.0;
            if (v > am_luong_toi_da) v = am_luong_toi_da;
            if (pt) {
                pt.am_luong = v;
                if (pt.nut_khuech_dai && pt.nut_khuech_dai.gain) pt.nut_khuech_dai.gain.value = v;
            }
            this.luu_dong_bo_hoan('volume', v);
            this.hien_thong_bao_toast(`Âm lượng: ${Math.round(v * 100)}%`);
        } else if (chuoi_phim === this.phim_tat_tuy_chinh.volDown) {
            su_kien.preventDefault();
            const pt = DocTruyenSTV_Ext.TrinhPhatAmThanh;
            let v = Math.round(((pt && pt.am_luong !== undefined ? pt.am_luong : 1) - 0.1) * 10) / 10;
            if (v < 0) v = 0;
            if (pt) {
                pt.am_luong = v;
                if (pt.nut_khuech_dai && pt.nut_khuech_dai.gain) pt.nut_khuech_dai.gain.value = v;
            }
            this.luu_dong_bo_hoan('volume', v);
            this.hien_thong_bao_toast(`Âm lượng: ${Math.round(v * 100)}%`);
        } else if (chuoi_phim === this.phim_tat_tuy_chinh.nextSeg) {
            su_kien.preventDefault();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.nhay_doan('tiep');
            const pt = DocTruyenSTV_Ext.TrinhPhatAmThanh;
            if (pt.cac_doan && pt.cac_doan.length > 0) {
                this.hien_thong_bao_toast(`Đã chuyển đến đoạn ${Math.min(pt.chi_so_hien_tai + 1, pt.cac_doan.length)} / ${pt.cac_doan.length}`);
            }
        } else if (chuoi_phim === this.phim_tat_tuy_chinh.prevSeg) {
            su_kien.preventDefault();
            DocTruyenSTV_Ext.TrinhPhatAmThanh.nhay_doan('truoc');
            const pt = DocTruyenSTV_Ext.TrinhPhatAmThanh;
            if (pt.cac_doan && pt.cac_doan.length > 0) {
                this.hien_thong_bao_toast(`Đã chuyển đến đoạn ${Math.max(pt.chi_so_hien_tai + 1, 1)} / ${pt.cac_doan.length}`);
            }
        }
    },

    kiem_tra_tu_dong_phat() {
        if (!DocTruyenSTV_Ext.la_ngu_canh_hop_le()) return;
        try {
            chrome.storage.local.get(['customStopConfig', 'sleepTargetTimestamp', 'stopAfterChapters'], du_lieu => {
                if (!du_lieu) return;
                if (du_lieu.customStopConfig) this.cau_hinh_dung_tuy_chon = du_lieu.customStopConfig;
                if (du_lieu.stopAfterChapters !== undefined) this.dung_sau_chuong = du_lieu.stopAfterChapters;
                
                if (du_lieu.sleepTargetTimestamp) {
                    const con_lai = du_lieu.sleepTargetTimestamp - Date.now();
                    if (con_lai > 0) {
                        this.id_dong_ho_ngu = setTimeout(() => this._xu_ly_khi_het_gio_ngu(), con_lai);
                    } else {
                        this._xu_ly_khi_het_gio_ngu();
                    }
                }

                const cho_noi_dung = (ham_goi_lai) => {
                    let da_goi = false;
                    const kiem_tra = () => {
                        return Boolean(DocTruyenSTV_Ext.PhanTichSTV.tim_khung_noi_dung_hien_tai());
                    };
                    
                    const thu_goi = () => {
                        if (!da_goi && kiem_tra()) {
                            da_goi = true;
                            if (id_dong_ho) clearInterval(id_dong_ho);
                            ham_goi_lai();
                        }
                    };

                    // Kích hoạt ngay lập tức nếu khung nội dung đã có sẵn trong DOM
                    if (kiem_tra()) {
                        da_goi = true;
                        ham_goi_lai();
                        return;
                    }

                    const id_dong_ho = setInterval(() => {
                        if (!da_goi) thu_goi();
                        else clearInterval(id_dong_ho);
                    }, 200);

                    setTimeout(() => { 
                        if (!da_goi) { 
                            da_goi = true; 
                            clearInterval(id_dong_ho); 
                            ham_goi_lai(); 
                        } 
                    }, 8000);
                };

                if (sessionStorage.getItem('autoStartOnLoad') === 'true') {
                    sessionStorage.removeItem('autoStartOnLoad');
                    
                    cho_noi_dung(() => {
                        if (this.dung_sau_chuong > 0) {
                            this.dung_sau_chuong--;
                            if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                                try { chrome.storage.local.set({ stopAfterChapters: this.dung_sau_chuong }); } catch (_) {}
                            }
                            if (this.dung_sau_chuong === 0) {
                                if (this.cau_hinh_dung_tuy_chon && this.cau_hinh_dung_tuy_chon.operator === 'and') {
                                    const dk_thoi_gian = [this.cau_hinh_dung_tuy_chon.left, this.cau_hinh_dung_tuy_chon.right].find(c => c && (c.type === 'time' || c.type === 'realtime'));
                                    if (dk_thoi_gian && du_lieu.sleepTargetTimestamp && Date.now() < du_lieu.sleepTargetTimestamp) {
                                        // Vẫn còn thời gian hẹn
                                    } else {
                                        DocTruyenSTV_Ext.TrinhPhatAmThanh.dung_phat();
                                        if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                                            try { chrome.storage.local.remove(['customStopConfig', 'stopTime', 'stopRealtimeTarget', 'stopAfterChapters']); } catch (_) {}
                                        }
                                        return;
                                    }
                                } else {
                                    DocTruyenSTV_Ext.TrinhPhatAmThanh.dung_phat();
                                    if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                                        try { chrome.storage.local.remove(['customStopConfig', 'stopTime', 'stopRealtimeTarget', 'stopAfterChapters']); } catch (_) {}
                                    }
                                    return;
                                }
                            }
                        }
                        
                        DocTruyenSTV_Ext.TrinhPhatAmThanh.chuan_bi_cac_doan();
                        DocTruyenSTV_Ext.PhanTichSTV.kiem_tra_ma_hoa();
                        
                        let tu_vi_tri = 0;
                        if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                            try {
                                chrome.storage.local.get('readingList', ds_du_lieu => {
                                    let danh_sach = (ds_du_lieu && ds_du_lieu.readingList) || [];
                                    let tieu_de = document.getElementById('booknameholder')?.innerText.trim();
                                    let muc_truyen = danh_sach.find(i => (i.title || '').trim().toLowerCase() === (tieu_de || '').trim().toLowerCase());
                                    const url_khop = muc_truyen && muc_truyen.url && (
                                        muc_truyen.url === window.location.href ||
                                        new URL(muc_truyen.url).pathname === window.location.pathname
                                    );
                                    if (url_khop && muc_truyen.chunkIndex > 1) {
                                        tu_vi_tri = DocTruyenSTV_Ext.TrinhPhatAmThanh.tinh_chi_so_thuc(muc_truyen.chunkIndex - 1);
                                    }
                                    DocTruyenSTV_Ext.TrinhPhatAmThanh.bat_dau_phat(tu_vi_tri);
                                });
                            } catch (_) {
                                DocTruyenSTV_Ext.TrinhPhatAmThanh.bat_dau_phat(0);
                            }
                        } else {
                            DocTruyenSTV_Ext.TrinhPhatAmThanh.bat_dau_phat(0);
                        }
                    });
                } else {
                    cho_noi_dung(() => {
                        DocTruyenSTV_Ext.TrinhPhatAmThanh.chuan_bi_cac_doan();
                        DocTruyenSTV_Ext.PhanTichSTV.kiem_tra_ma_hoa();

                        if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                            try {
                                chrome.storage.local.get('readingList', ds_du_lieu => {
                                    const danh_sach = (ds_du_lieu && ds_du_lieu.readingList) || [];
                                    const tieu_de = document.getElementById('booknameholder')?.innerText.trim();
                                    const muc_truyen = danh_sach.find(i => (i.title || '').trim().toLowerCase() === (tieu_de || '').trim().toLowerCase());
                                    const url_khop = muc_truyen && muc_truyen.url && (
                                        muc_truyen.url === window.location.href ||
                                        new URL(muc_truyen.url).pathname === window.location.pathname
                                    );
                                    let vi_tri_khoi_phuc = 0;
                                    if (url_khop && muc_truyen.chunkIndex > 1) {
                                        vi_tri_khoi_phuc = DocTruyenSTV_Ext.TrinhPhatAmThanh.tinh_chi_so_thuc(muc_truyen.chunkIndex - 1);
                                    }
                                    DocTruyenSTV_Ext.TrinhPhatAmThanh.chi_so_hien_tai = vi_tri_khoi_phuc;
                                    DocTruyenSTV_Ext.GiaoDienSTV.cap_nhat_bang_dieu_khien(vi_tri_khoi_phuc, DocTruyenSTV_Ext.TrinhPhatAmThanh.cac_doan.length, false, false);
                                    if (vi_tri_khoi_phuc > 0) {
                                        DocTruyenSTV_Ext.GiaoDienSTV.boi_den_doan(vi_tri_khoi_phuc, DocTruyenSTV_Ext.TrinhPhatAmThanh.cac_doan, false, false);
                                    }
                                });
                            } catch (_) {}
                        }
                    });
                }
            });
        } catch (_) {}
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DocTruyenSTV_Ext.ChinhSTV.khoi_tao());
} else {
    DocTruyenSTV_Ext.ChinhSTV.khoi_tao();
}

