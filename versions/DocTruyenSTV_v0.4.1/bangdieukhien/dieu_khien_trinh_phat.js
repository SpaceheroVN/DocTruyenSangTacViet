import { CauHinh } from './quan_ly_cau_hinh.js';
import { QuanLyThuVien } from './quan_ly_thu_vien.js';
import { GiaoDienCaiDat } from './giao_dien_cai_dat.js';
import { hien_thong_bao } from './tien_ich.js';

export const DieuKhienTrinhPhat = {
    id_tab_hien_tai: null,
    thong_tin_truyen_hien_tai: null,
    thong_tin_tab_khac_dang_phat: null,
    trang_thai_phat_hien_tai: null,

    async khoi_tao() {
        const versionBadge = document.getElementById('version-badge');
        if (versionBadge) versionBadge.textContent = 'v' + chrome.runtime.getManifest().version;

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const coverImg = document.getElementById('cover-img');
        if (coverImg) {
            coverImg.addEventListener('error', function() {
                if (this.src !== 'icons/icon128.png') {
                    this.src = 'icons/icon128.png';
                }
            });
        }

        if (tab && tab.url && tab.url.includes('sangtacviet.com')) {
            this.id_tab_hien_tai = tab.id;
            this.yeu_cau_trang_thai_ban_dau();
        } else {
            const btnOpenStv = document.getElementById('btn-open-stv');
            if (btnOpenStv) btnOpenStv.addEventListener('click', () => chrome.tabs.create({ url: 'https://sangtacviet.com/' }));
            
            const bookEmptyState = document.getElementById('book-empty-state');
            if (bookEmptyState) bookEmptyState.style.display = 'block';
            const bookMeta = document.getElementById('book-meta');
            if (bookMeta) bookMeta.style.display = 'none';
            const coverWrapper = document.getElementById('cover-wrapper');
            if (coverWrapper) coverWrapper.style.display = 'none';
            const coverImg = document.getElementById('cover-img');
            if (coverImg) coverImg.style.display = 'none';
            const controls = document.querySelector('.controls');
            if (controls) controls.style.display = 'none';
            const statusBar = document.querySelector('.status-bar');
            if (statusBar) statusBar.style.display = 'none';

            const engineHienTai = CauHinh.lay('maydoc') || 'web';
            this.cap_nhat_danh_sach_giong(engineHienTai);
            this.cap_nhat_giao_dien_engine(engineHienTai);
        }

        this.gan_su_kien();
        
        chrome.runtime.onMessage.addListener((tinNhan) => {
            if (tinNhan.hanhDong === 'thayDoiTrangThai' && tinNhan.trangThai) {
                this.cap_nhat_trang_thai_phat(tinNhan.trangThai);
            } else if (tinNhan.hanhDong === 'capNhatAnhBia' && tinNhan.imgUrl) {
                const coverImg = document.getElementById('cover-img');
                if (coverImg) coverImg.src = tinNhan.imgUrl;
                if (this.thong_tin_truyen_hien_tai) {
                    this.thong_tin_truyen_hien_tai.imgUrl = tinNhan.imgUrl;
                }
            }
        });

        chrome.storage.local.get(['stv_tab_dang_phat'], duLieu => {
            this.kiem_tra_khoa_tab_khac(duLieu.stv_tab_dang_phat);
        });

        chrome.storage.onChanged.addListener((thayDoi, vungChon) => {
            if (vungChon === 'local' && thayDoi.stv_tab_dang_phat) {
                this.kiem_tra_khoa_tab_khac(thayDoi.stv_tab_dang_phat.newValue);
            }
        });

        document.body.style.opacity = '1';
    },

    kiem_tra_khoa_tab_khac(tabDangPhat) {
        if (tabDangPhat && tabDangPhat.isPlaying && tabDangPhat.tabId && this.id_tab_hien_tai && tabDangPhat.tabId !== this.id_tab_hien_tai) {
            this.thong_tin_tab_khac_dang_phat = tabDangPhat;
            const btnPlay = document.getElementById('btn-play');
            if (btnPlay) {
                btnPlay.classList.add('tab-locked');
                let chuoiTooltip = 'Đang có truyện khác đang phát...';
                if (tabDangPhat.tenTruyen) {
                    chuoiTooltip = tabDangPhat.tenChuong
                        ? `${tabDangPhat.tenTruyen}: ${tabDangPhat.tenChuong} đang phát...`
                        : `${tabDangPhat.tenTruyen} đang phát...`;
                }
                btnPlay.title = chuoiTooltip;
            }
            const statusText = document.getElementById('status-text');
            if (statusText) {
                statusText.textContent = 'Khóa (Tab khác đang phát)';
                statusText.style.color = 'var(--text-muted)';
            }
            const statusIcon = document.getElementById('status-icon');
            if (statusIcon) {
                statusIcon.className = 'status-dot paused';
            }
        } else {
            this.thong_tin_tab_khac_dang_phat = null;
            const btnPlay = document.getElementById('btn-play');
            if (btnPlay) {
                btnPlay.classList.remove('tab-locked');
                btnPlay.title = 'Phát / Tạm dừng [K] hoặc [Space]';
            }
            if (this.trang_thai_phat_hien_tai) {
                this.cap_nhat_trang_thai_phat(this.trang_thai_phat_hien_tai);
            }
        }
    },

    // Đồng bộ danh sách giọng đọc theo từng công cụ
    cap_nhat_danh_sach_giong(ma_dong_co) {
        const the_chon = document.getElementById('voice-select');
        const the_thong_tin = document.getElementById('info-voice');
        const the_chu_giong_tuy_chinh = document.getElementById('custom-voice-text');
        if (!the_chon) return;
        const gia_tri_cu = CauHinh.lay('voiceIndex', true);

        const tao_danh_sach_lua_chon = (cac_giong) => {
            let chi_so_chon = parseInt(gia_tri_cu, 10);
            if (isNaN(chi_so_chon) || chi_so_chon < 0 || chi_so_chon >= cac_giong.length) {
                chi_so_chon = 0;
            }
            the_chon.innerHTML = cac_giong.map((ten, chi_so) => {
                const ten_an_toan = ten.replace(/[&<>"'`=\/]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[s]));
                return `<option value="${chi_so}" ${chi_so == chi_so_chon ? 'selected' : ''}>${ten_an_toan}</option>`;
            }).join('');
            the_chon.value = String(chi_so_chon);
            GiaoDienCaiDat.cap_nhat_giao_dien('voice-select');
            const lua_chon_hien_tai = the_chon.options[the_chon.selectedIndex];
            const ten_giong = lua_chon_hien_tai ? lua_chon_hien_tai.text : (cac_giong[0] || 'Mặc định');
            if (the_thong_tin) the_thong_tin.textContent = ten_giong;
            if (the_chu_giong_tuy_chinh) the_chu_giong_tuy_chinh.textContent = ten_giong;
        };

        if (ma_dong_co === 'web' || !ma_dong_co) {
            const nap_giong_web = (danh_sach_giong) => {
                if (!danh_sach_giong || danh_sach_giong.length === 0) {
                    tao_danh_sach_lua_chon(['Giọng mặc định hệ thống']);
                    return;
                }
                const co_giong_tieng_viet = danh_sach_giong.some(v => v.lang && v.lang.startsWith('vi'));
                if (!co_giong_tieng_viet && !this._da_canh_bao_thieu_giong_web) {
                    this._da_canh_bao_thieu_giong_web = true;
                    hien_thong_bao('Máy tính chưa có gói giọng tiếng Việt. Khuyên dùng API FPT hoặc Azure.', 'warning');
                }
                const ten_giong_luu = CauHinh.lay('voiceName', true);
                let chi_so_chon = parseInt(gia_tri_cu, 10);
                if (ten_giong_luu) {
                    const tim_theo_ten = danh_sach_giong.find(v => v.name === ten_giong_luu);
                    if (tim_theo_ten) chi_so_chon = tim_theo_ten.index;
                }
                const co_vi_tri = danh_sach_giong.some(v => v.index == chi_so_chon);
                if (!co_vi_tri) {
                    const chi_so_viet = danh_sach_giong.findIndex(v => v.lang && v.lang.startsWith('vi'));
                    chi_so_chon = chi_so_viet !== -1 ? danh_sach_giong[chi_so_viet].index : (danh_sach_giong[0] ? danh_sach_giong[0].index : 0);
                }
                the_chon.innerHTML = danh_sach_giong.map(v => {
                    let ten = v.name.replace(/ - Vietnamese \(Vietnam\)/i, '').replace(/ \(Vietnam\)/i, '').replace(/Microsoft /i, 'MS ').replace(/Google /i, 'GG ');
                    if (ten.length > 22) ten = ten.substring(0, 20) + '...';
                    const ten_an_toan = ten.replace(/[&<>"'`=\/]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[s]));
                    const chi_so_an_toan = String(v.index).replace(/[^0-9]/g, '');
                    const ten_goc_an_toan = (v.name || '').replace(/[&<>"'`=\/]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[s]));
                    return `<option value="${chi_so_an_toan}" data-voice-name="${ten_goc_an_toan}" ${chi_so_an_toan == chi_so_chon ? 'selected' : ''}>${ten_an_toan}</option>`;
                }).join('');
                the_chon.value = String(chi_so_chon);
                GiaoDienCaiDat.cap_nhat_giao_dien('voice-select');
                const lua_chon_hien_tai = the_chon.options[the_chon.selectedIndex];
                const ten_giong = lua_chon_hien_tai ? lua_chon_hien_tai.text : 'Mặc định';
                if (the_thong_tin) the_thong_tin.textContent = ten_giong;
                if (the_chu_giong_tuy_chinh) the_chu_giong_tuy_chinh.textContent = ten_giong;
            };

            if (this.id_tab_hien_tai) {
                chrome.tabs.sendMessage(this.id_tab_hien_tai, { hanhDong: 'layGiongDoc' }, phan_hoi => {
                    if (chrome.runtime.lastError || !phan_hoi || !phan_hoi.voices) {
                        this._nap_giong_web_fallback(nap_giong_web);
                    } else {
                        nap_giong_web(phan_hoi.voices);
                    }
                });
            } else {
                chrome.tabs.query({ url: '*://*.sangtacviet.com/*' }, tabs => {
                    const tabStv = (tabs && tabs.length > 0) ? tabs[0] : null;
                    if (tabStv && tabStv.id) {
                        chrome.tabs.sendMessage(tabStv.id, { hanhDong: 'layGiongDoc' }, phan_hoi => {
                            if (!chrome.runtime.lastError && phan_hoi && phan_hoi.voices && phan_hoi.voices.length > 0) {
                                nap_giong_web(phan_hoi.voices);
                                return;
                            }
                            this._nap_giong_web_fallback(nap_giong_web);
                        });
                    } else {
                        this._nap_giong_web_fallback(nap_giong_web);
                    }
                });
            }
        } else if (ma_dong_co.startsWith('fpt_') || ma_dong_co === 'fpt') {
            tao_danh_sach_lua_chon(['Ban Mai (Nữ miền Bắc)', 'Lê Minh (Nam miền Bắc)', 'Thu Minh (Nữ miền Bắc)', 'Mỹ An (Nữ miền Trung)', 'Gia Huy (Nam miền Trung)', 'Lan Nhi (Nữ miền Nam)', 'Linh San (Nữ miền Nam)']);
        } else if (ma_dong_co.startsWith('azure_') || ma_dong_co === 'azure') {
            tao_danh_sach_lua_chon(['Hoài My (Nữ)', 'Nam Minh (Nam)']);
        } else if (ma_dong_co.startsWith('gcp_') || ma_dong_co === 'gcp') {
            tao_danh_sach_lua_chon(['Neural2 A (Nữ)', 'Neural2 D (Nam)', 'Wavenet A (Nữ)', 'Wavenet B (Nam)', 'Wavenet C (Nữ)', 'Wavenet D (Nam)', 'Standard A (Nữ)', 'Standard B (Nam)', 'Standard C (Nữ)', 'Standard D (Nam)']);
        } else if (ma_dong_co.startsWith('khac_')) {
            const cac_dong_co = CauHinh.lay('customEngines', false) || [];
            const dong_co = cac_dong_co.find(e => String(e.id) === String(ma_dong_co));
            let danh_sach_ten_giong = [];
            if (dong_co && dong_co.voices && Array.isArray(dong_co.voices) && dong_co.voices.length > 0) {
                danh_sach_ten_giong = dong_co.voices;
            } else {
                danh_sach_ten_giong = Array.from({ length: 10 }, (_, i) => `Giọng đọc ${i + 1}`);
            }
            tao_danh_sach_lua_chon(danh_sach_ten_giong);
        } else {
            if (the_thong_tin) the_thong_tin.textContent = 'Mặc định';
            if (the_chu_giong_tuy_chinh) the_chu_giong_tuy_chinh.textContent = 'Mặc định';
        }
    },

    _nap_giong_web_fallback(nap_giong_web) {
        const giong_cuc_bo = (typeof window !== 'undefined' && window.speechSynthesis) ? window.speechSynthesis.getVoices().map((v, i) => ({ name: v.name, lang: v.lang, index: i })) : [];
        const giong_cuc_bo_viet = giong_cuc_bo.filter(v => v.lang && v.lang.startsWith('vi'));
        if (giong_cuc_bo_viet.length > 0) {
            nap_giong_web(giong_cuc_bo_viet);
        } else {
            const ten_luu = CauHinh.lay('voiceName', true);
            const chi_so_luu = parseInt(CauHinh.lay('voiceIndex', true), 10) || 0;
            if (ten_luu && !ten_luu.toLowerCase().includes('david') && !ten_luu.toLowerCase().includes('zira') && !ten_luu.toLowerCase().includes('english')) {
                nap_giong_web([{ name: ten_luu, lang: 'vi-VN', index: chi_so_luu }]);
            } else {
                nap_giong_web([{ name: 'MS Hoài My Online (Tự động)', lang: 'vi-VN', index: 0 }]);
            }
        }
    },

    yeu_cau_trang_thai_ban_dau() {
        if (!this.id_tab_hien_tai) return;
        chrome.tabs.sendMessage(this.id_tab_hien_tai, { hanhDong: 'layThongTin' }, phanHoi => {
            if (chrome.runtime.lastError) {
                hien_thong_bao('Không thể kết nối đến trang', 'warning');
                return;
            }
            if (phanHoi) this.cap_nhat_thong_tin_truyen(phanHoi);
        });
        
        const engineHienTai = CauHinh.lay('maydoc') || 'web';
        this.cap_nhat_danh_sach_giong(engineHienTai);
    },

    gui_lenh(hanh_dong, tham_so_them = {}) {
        if (!this.id_tab_hien_tai) return;
        chrome.tabs.sendMessage(this.id_tab_hien_tai, { hanhDong: hanh_dong, ...tham_so_them }, () => {
            if (chrome.runtime.lastError) {  }
        });
    },

    cap_nhat_giao_dien_engine(engineId) {
        if (!engineId) return;

        if (CauHinh && CauHinh.lay('maydoc', true) !== engineId) {
            CauHinh.dat('maydoc', engineId, true);
        }

        const badge = document.getElementById('tts-badge');
        const footerEngine = document.getElementById('footer-engine');
        const voiceTrigger = document.getElementById('custom-voice-trigger');
        
        let engineName = 'Web Speech API';
        let isWeb = true;
        let hasVoiceList = true;

        if (engineId === 'web') {
            engineName = 'Web TTS';
            if(footerEngine) footerEngine.textContent = 'Web Speech API';
        } else {
            isWeb = false;
            const customEngines = CauHinh.lay('customEngines', false) || [];
            const matched = customEngines.find(e => e.id === engineId);
            if (matched) {
                engineName = matched.name;
            } else if (engineId.startsWith('fpt_') || engineId === 'fpt') {
                engineName = 'FPT.AI TTS';
            } else if (engineId.startsWith('azure_') || engineId === 'azure') {
                engineName = 'Azure TTS';
            } else if (engineId.startsWith('gcp_') || engineId === 'gcp') {
                engineName = 'GCP TTS';
            } else {
                engineName = 'Custom TTS';
            }
            if(footerEngine) footerEngine.textContent = engineName;

            if (!engineId.startsWith('fpt') && !engineId.startsWith('azure') && !engineId.startsWith('gcp') && engineId !== 'web') {
                hasVoiceList = false;
            }
        }

        if (badge) badge.textContent = engineName;

        if (voiceTrigger && voiceTrigger.parentElement) {
            voiceTrigger.parentElement.style.display = hasVoiceList ? 'block' : 'none';
            const optionsRow = voiceTrigger.parentElement.parentElement;
            if (optionsRow && optionsRow.classList.contains('options-row')) {
                optionsRow.style.justifyContent = hasVoiceList ? 'flex-start' : 'flex-end';
            }
        }

        const engineSelect = document.getElementById('engine-select');
        if (engineSelect && engineSelect.value !== engineId) {
            engineSelect.value = engineId;
            if (GiaoDienCaiDat && typeof GiaoDienCaiDat.cap_nhat_giao_dien === 'function') {
                GiaoDienCaiDat.cap_nhat_giao_dien('engine-select');
            }
        }

        const volSlider = document.getElementById('vol-slider');
        if (volSlider) {
            const maxVol = (engineId === 'web' || engineId === 'auto') ? 1.0 : 2.0;
            volSlider.max = maxVol;
            if (parseFloat(volSlider.value) > maxVol) {
                volSlider.value = maxVol;
                const volVal = document.getElementById('vol-val');
                if (volVal) volVal.textContent = Math.round(maxVol * 100) + '%';
                if (CauHinh) CauHinh.dat('volume', maxVol, true);
                this.gui_lenh('capNhatCaiDat');
            }
            if (GiaoDienCaiDat && typeof GiaoDienCaiDat.cap_nhat_giao_dien === 'function') {
                GiaoDienCaiDat.cap_nhat_giao_dien('vol-slider');
            }
        }

        this.cap_nhat_danh_sach_giong(engineId);
    },

    cap_nhat_trang_thai_phat(trangThai) {
        if (!trangThai) return;
        this.trang_thai_phat_hien_tai = trangThai;

        const dangPhat = trangThai.isPlaying;
        const dangTamDung = trangThai.isPaused;
        const isBuffering = trangThai.isBuffering;
        const dangHoatDong = dangPhat && !dangTamDung;

        const elapsed = trangThai.elapsed || 0;
        const ptGio = Math.floor(elapsed / 3600);
        const ptPhut = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
        const ptGiay = (elapsed % 60).toString().padStart(2, '0');
        const timerText = document.getElementById('timer-text');
        if (timerText) {
            timerText.textContent = ptGio > 0 ? `${ptGio}:${ptPhut}:${ptGiay}` : `${ptPhut}:${ptGiay}`;
        }

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
            vanBanNut.textContent = trangThai.coDocDo ? 'Tiếp tục' : 'Nghe';
            chamTrangThai.className = 'status-dot';
            chuTrangThai.textContent = trangThai.coDocDo ? 'Đã lưu vị trí' : 'Sẵn sàng';
            chuTrangThai.style.color = 'var(--text-muted)';
        }

        // Nếu có tab khác đang phát truyện, luôn áp dụng trạng thái khóa cho nút phát
        if (this.thong_tin_tab_khac_dang_phat) {
            const btnPlay = document.getElementById('btn-play');
            if (btnPlay) {
                btnPlay.classList.add('tab-locked');
                const tabKhac = this.thong_tin_tab_khac_dang_phat;
                let chuoiTooltip = 'Đang có truyện khác đang phát...';
                if (tabKhac.tenTruyen) {
                    chuoiTooltip = tabKhac.tenChuong
                        ? `${tabKhac.tenTruyen}: ${tabKhac.tenChuong} đang phát...`
                        : `${tabKhac.tenTruyen} đang phát...`;
                }
                btnPlay.title = chuoiTooltip;
            }
            chamTrangThai.className = 'status-dot paused';
            chuTrangThai.textContent = 'Khóa (Tab khác đang phát)';
            chuTrangThai.style.color = 'var(--text-muted)';
        }

        if (trangThai.progress) {
            const input = document.getElementById('progress-input');
            const total = document.getElementById('progress-total');
            const bar = document.getElementById('progress-bar-fill') || document.getElementById('progress-bar');
            const percent = document.getElementById('progress-percent');
            if(input && !input.dataset.dangSua) input.value = trangThai.progress.current;
            if(total) total.textContent = trangThai.progress.total;
            if(bar && percent) {
                const phanTram = Math.round((trangThai.progress.current / trangThai.progress.total) * 100);
                bar.style.width = '100%';
                bar.style.transformOrigin = 'left';
                bar.style.transform = `scaleX(${trangThai.progress.current / trangThai.progress.total})`;
                percent.textContent = phanTram + '%';
            }
        }

        if (trangThai.engine && trangThai.engine !== this._engineHienTaiUI) {
            this._engineHienTaiUI = trangThai.engine;
            this.cap_nhat_giao_dien_engine(trangThai.engine);
        }
    },

    cap_nhat_thong_tin_truyen(thongTin) {
        if (!thongTin) return;
        this.thong_tin_truyen_hien_tai = thongTin;
        
        const laTrangChu = thongTin.pageUrl && !thongTin.pageUrl.includes('/truyen/');
        
        if (thongTin.bookTitle) {
            document.getElementById('current-title').textContent = thongTin.bookTitle;
            document.getElementById('current-chap').style.display = 'block';
            const coverWrapper = document.getElementById('cover-wrapper');
            if (coverWrapper) coverWrapper.style.display = 'block';
            document.getElementById('cover-img').style.display = 'block';
            document.getElementById('btn-save').style.display = 'flex';
            
            const laDangDocChuong = Boolean(thongTin.chapTitle);
            const controls = document.querySelector('.controls');
            if (controls) controls.style.display = (laDangDocChuong || thongTin.progress) ? 'flex' : 'none';
            const statusBar = document.querySelector('.status-bar');
            if (statusBar) statusBar.style.display = (laDangDocChuong || thongTin.progress) ? 'flex' : 'none';
        } else if (laTrangChu) {
            document.getElementById('current-title').textContent = 'Đang ở trang chủ / tìm kiếm';
            document.getElementById('current-chap').style.display = 'none';
            const coverWrapper = document.getElementById('cover-wrapper');
            if (coverWrapper) coverWrapper.style.display = 'none';
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
        
        if (thongTin.imgUrl) {
            document.getElementById('cover-img').src = thongTin.imgUrl;
        }
        
        if (QuanLyThuVien.danh_sach_doc) {
            chrome.storage.local.get('readingList', duLieu => {
                try {
                    const danhSach = duLieu.readingList || [];
                    const vt = danhSach.findIndex(i => (i.title || '').trim().toLowerCase() === (thongTin.bookTitle || '').trim().toLowerCase());
                    
                    if (!thongTin.imgUrl && vt !== -1 && danhSach[vt].imgUrl) {
                        document.getElementById('cover-img').src = danhSach[vt].imgUrl;
                    }

                    if (vt !== -1) {
                        this.dat_trang_thai_luu(true);
                        let daCapNhat = false;
                        const docHienTai = danhSach[vt];
                        if (thongTin.pageUrl && docHienTai.url !== thongTin.pageUrl) { docHienTai.url = thongTin.pageUrl; daCapNhat = true; }
                        if (thongTin.chapTitle && docHienTai.chap !== thongTin.chapTitle) { docHienTai.chap = thongTin.chapTitle; daCapNhat = true; }
                        if (thongTin.imgUrl && docHienTai.imgUrl !== thongTin.imgUrl) {
                            let safeImg = thongTin.imgUrl;
                            if (safeImg.startsWith('data:')) safeImg = '';
                            if (safeImg.toLowerCase().startsWith('http://')) safeImg = 'https://' + safeImg.substring(7);
                            docHienTai.imgUrl = safeImg;
                            daCapNhat = true;
                        }
                        const chunkMoi = (thongTin.absoluteProgress && thongTin.absoluteProgress.current)
                            ? thongTin.absoluteProgress.current
                            : (thongTin.progress && thongTin.progress.current ? thongTin.progress.current : null);
                        if (chunkMoi !== null && docHienTai.chunkIndex !== chunkMoi) {
                            docHienTai.chunkIndex = chunkMoi;
                            daCapNhat = true;
                        }
                        if (daCapNhat) {
                            chrome.storage.local.set({ readingList: danhSach }, () => {
                                QuanLyThuVien.danh_sach_doc = danhSach;
                                QuanLyThuVien.hien_thi_danh_sach(QuanLyThuVien.sap_xep_danh_sach(danhSach));
                            });
                        }
                    } else {
                        this.dat_trang_thai_luu(false);
                    }
                } catch (e) {
                    console.error('[DocTruyenSTV] Lỗi cập nhật thư viện:', e);
                }
            });
        }
        
        this.cap_nhat_trang_thai_phat({
            isPlaying: thongTin.isPlaying,
            isPaused: thongTin.isPaused,
            isBuffering: thongTin.isBuffering,
            engine: thongTin.ttsEngine,
            elapsed: thongTin.elapsed || 0,
            progress: thongTin.progress
        });
    },

    dat_trang_thai_luu(daLuu) {
        const nut = document.getElementById('btn-save');
        if (!nut) return;
        nut.className = `btn-save${daLuu ? ' saved' : ''}`;
        nut.innerHTML = daLuu ? 
            `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                <path d="m9 10 2 2 4-4"></path>
            </svg><span>Đã lưu</span>` : 
            `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg><span>Lưu</span>`;
    },

    gan_su_kien() {
        document.getElementById('btn-play')?.addEventListener('click', () => {
            if (this.thong_tin_tab_khac_dang_phat) {
                hien_thong_bao('Đang có truyện khác đang phát!', 'warning');
                return;
            }
            this.gui_lenh('daoTrangThaiPhat');
            const btnPlay = document.getElementById('btn-play');
            if (btnPlay) {
                btnPlay.classList.add('active');
                setTimeout(() => btnPlay.classList.remove('active'), 200);
            }
        });
        document.getElementById('btn-stop')?.addEventListener('click', () => this.gui_lenh('dungPhat'));
        document.getElementById('btn-next')?.addEventListener('click', () => this.gui_lenh('chuongTiep'));
        document.getElementById('btn-prev')?.addEventListener('click', () => this.gui_lenh('chuongTruoc'));
        document.getElementById('btn-replay')?.addEventListener('click', () => this.gui_lenh('phatLai'));

        // Xử lý xem chi tiết ảnh bìa truyện ngoài màn hình trang web
        const wrapper_anh_bia = document.getElementById('cover-wrapper');
        const the_anh_bia = document.getElementById('cover-img');
        if (wrapper_anh_bia) {
            wrapper_anh_bia.addEventListener('click', () => {
                const duong_dan_anh = the_anh_bia ? the_anh_bia.src : '';
                if (!duong_dan_anh || duong_dan_anh.includes('icon128.png')) {
                    hien_thong_bao('Chưa có ảnh bìa để phóng to', 'warning');
                    return;
                }
                const ten_truyen = (this.thong_tin_truyen_hien_tai && this.thong_tin_truyen_hien_tai.bookTitle)
                    ? this.thong_tin_truyen_hien_tai.bookTitle
                    : 'Ảnh bìa truyện';

                // Gửi tin nhắn đến tab hiện tại để mở modal Lightbox giữa trang web
                if (this.id_tab_hien_tai) {
                    const chu_de_hien_tai = document.documentElement.getAttribute('data-theme') || 'dark';
                    chrome.tabs.sendMessage(this.id_tab_hien_tai, {
                        hanhDong: 'moModalXemAnh',
                        duongDanAnh: duong_dan_anh,
                        tenTruyen: ten_truyen,
                        chuDe: chu_de_hien_tai
                    }, (phan_hoi) => {
                        if (chrome.runtime.lastError || !phan_hoi) {
                            // Fallback nếu trang không phải STV hoặc chưa inject script
                            window.open(duong_dan_anh, '_blank');
                        } else {
                            // Đóng popup extension để người dùng xem trọn vẹn modal giữa màn hình
                            setTimeout(() => window.close(), 80);
                        }
                    });
                } else {
                    window.open(duong_dan_anh, '_blank');
                }
            });
        }

        const btnSave = document.getElementById('btn-save');
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                const hienTai = this.thong_tin_truyen_hien_tai;
                if (!hienTai || !hienTai.bookTitle) {
                    hien_thong_bao('Không có truyện nào đang mở', 'warning');
                    return;
                }
                
                chrome.storage.local.get('readingList', duLieu => {
                    try {
                        const danhSach = duLieu.readingList || [];
                        const vitri = danhSach.findIndex(i => (i.title || '').trim().toLowerCase() === hienTai.bookTitle.trim().toLowerCase());
                        
                        if (vitri !== -1) {
                            danhSach.splice(vitri, 1);
                            chrome.storage.local.set({ readingList: danhSach }, () => {
                                QuanLyThuVien.danh_sach_doc = danhSach;
                                QuanLyThuVien.hien_thi_danh_sach(QuanLyThuVien.sap_xep_danh_sach(danhSach));
                                QuanLyThuVien.cap_nhat_dung_luong();
                                this.dat_trang_thai_luu(false);
                                const infoCount = document.getElementById('info-count');
                                if (infoCount) infoCount.textContent = `${danhSach.length} truyện`;
                                hien_thong_bao('Đã bỏ lưu truyện', 'info');
                            });
                        } else {
                            let safeImg = hienTai.imgUrl || '';
                            if (safeImg.startsWith('data:')) safeImg = '';
                            if (safeImg.toLowerCase().startsWith('http://')) safeImg = 'https://' + safeImg.substring(7);
                            danhSach.push({
                                title: hienTai.bookTitle,
                                url: hienTai.pageUrl || hienTai.bookUrl,
                                imgUrl: safeImg,
                                timestamp: Date.now(),
                                savedAt: new Date().toLocaleDateString('vi-VN'),
                                chap: hienTai.chapTitle || 'Chưa đọc chương nào',
                                chunkIndex: (hienTai.absoluteProgress && hienTai.absoluteProgress.current) ? hienTai.absoluteProgress.current : ((hienTai.progress && hienTai.progress.current) ? hienTai.progress.current : 0)
                            });
                            chrome.storage.local.set({ readingList: danhSach }, () => {
                                QuanLyThuVien.danh_sach_doc = danhSach;
                                QuanLyThuVien.hien_thi_danh_sach(QuanLyThuVien.sap_xep_danh_sach(danhSach));
                                QuanLyThuVien.cap_nhat_dung_luong();
                                this.dat_trang_thai_luu(true);
                                const infoCount = document.getElementById('info-count');
                                if (infoCount) infoCount.textContent = `${danhSach.length} truyện`;
                                hien_thong_bao('Đã lưu truyện thành công!', 'success');
                            });
                        }
                    } catch (e) {
                        console.error('[DocTruyenSTV] Lỗi lưu truyện:', e);
                    }
                });
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
                    if (QuanLyThuVien && QuanLyThuVien.tam_dung_marquee) {
                        QuanLyThuVien.tam_dung_marquee();
                    }
                } else {
                    e.currentTarget.classList.add('active');
                    const panel = document.getElementById('panel-' + e.currentTarget.dataset.tab);
                    if (panel) panel.classList.add('active');
                    if (e.currentTarget.dataset.tab === 'reading-list' && QuanLyThuVien && QuanLyThuVien.kich_hoat_marquee) {
                        QuanLyThuVien.kich_hoat_marquee();
                    } else if (QuanLyThuVien && QuanLyThuVien.tam_dung_marquee) {
                        QuanLyThuVien.tam_dung_marquee();
                    }
                }
                
                GiaoDienCaiDat.tai_lai_du_lieu_tu_dong_dung();
                GiaoDienCaiDat.tai_lai_du_lieu_may_doc();
            });
        });

        const modal = document.getElementById('confirm-modal');
        if (modal) {
            modal.addEventListener('click', e => { if(e.target === modal) modal.classList.remove('show'); });
        }

        document.addEventListener('contextmenu', e => { if (e.target.tagName !== 'INPUT') e.preventDefault(); });
        document.addEventListener('dragstart', e => { if (e.target.tagName !== 'INPUT') e.preventDefault(); });

        const btnNextChunk = document.getElementById('btn-next-chunk');
        if (btnNextChunk) {
            btnNextChunk.addEventListener('click', () => {
                const input = document.getElementById('progress-input');
                const totalEl = document.getElementById('progress-total');
                if (input && totalEl) {
                    const cur = parseInt(input.value, 10) || 0;
                    const tot = parseInt(totalEl.textContent, 10) || 0;
                    if (cur < tot) {
                        input.value = cur + 1;
                        const fill = document.getElementById('progress-bar-fill');
                        if (fill && tot > 0) fill.style.width = Math.round(((cur + 1) / tot) * 100) + '%';
                    }
                }
                this.gui_lenh('doanTiep');
            });
        }

        const btnPrevChunk = document.getElementById('btn-prev-chunk');
        if (btnPrevChunk) {
            btnPrevChunk.addEventListener('click', () => {
                const input = document.getElementById('progress-input');
                const totalEl = document.getElementById('progress-total');
                if (input && totalEl) {
                    const cur = parseInt(input.value, 10) || 0;
                    const tot = parseInt(totalEl.textContent, 10) || 0;
                    if (cur > 1) {
                        input.value = cur - 1;
                        const fill = document.getElementById('progress-bar-fill');
                        if (fill && tot > 0) fill.style.width = Math.round(((cur - 1) / tot) * 100) + '%';
                    }
                }
                this.gui_lenh('doanTruoc');
            });
        }

        const progressInput = document.getElementById('progress-input');
        if (progressInput) {
            progressInput.addEventListener('focus', () => { progressInput.dataset.dangSua = '1'; });
            progressInput.addEventListener('blur', () => { progressInput.dataset.dangSua = ''; });
            progressInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const val = parseInt(progressInput.value);
                    const total = parseInt(document.getElementById('progress-total')?.textContent || '0');
                    if (val >= 1 && val <= total) {
                        this.gui_lenh('nhayDenDoan', { chiSo: val - 1 });
                    }
                    progressInput.blur();
                }
            });
        }
    }
};
