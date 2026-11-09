import { cau_hinh } from './quan_ly_cau_hinh.js';
import { quan_ly_thu_vien } from './quan_ly_thu_vien.js';
import { giao_dien_cai_dat } from './giao_dien_cai_dat.js';
import { hien_thong_bao } from './tien_ich.js';

export const dieu_khien_trinh_phat = {
    id_tab_hien_tai: null,
    thong_tin_truyen_hien_tai: null,
    thong_tin_tab_khac_dang_phat: null,
    trang_thai_phat_hien_tai: null,

    async khoi_tao() {
        const the_phien_ban = document.getElementById('version-badge');
        if (the_phien_ban) the_phien_ban.textContent = 'v' + chrome.runtime.getManifest().version;

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const the_anh_bia = document.getElementById('cover-img');
        if (the_anh_bia) {
            the_anh_bia.addEventListener('error', function() {
                if (this.src !== 'icons/icon128.png') {
                    this.src = 'icons/icon128.png';
                }
            });
        }

        if (tab && tab.url && tab.url.includes('sangtacviet.com')) {
            this.id_tab_hien_tai = tab.id;
            this.yeu_cau_trang_thai_ban_dau();
        } else {
            const nut_mo_stv = document.getElementById('btn-open-stv');
            if (nut_mo_stv) nut_mo_stv.addEventListener('click', () => chrome.tabs.create({ url: 'https://sangtacviet.com/' }));
            
            const trang_thai_trong = document.getElementById('book-empty-state');
            if (trang_thai_trong) trang_thai_trong.style.display = 'block';
            const thong_tin_sach = document.getElementById('book-meta');
            if (thong_tin_sach) thong_tin_sach.style.display = 'none';
            const khung_anh_bia = document.getElementById('cover-wrapper');
            if (khung_anh_bia) khung_anh_bia.style.display = 'none';
            const the_anh_bia = document.getElementById('cover-img');
            if (the_anh_bia) the_anh_bia.style.display = 'none';
            const khung_dieu_khien = document.querySelector('.controls');
            if (khung_dieu_khien) khung_dieu_khien.style.display = 'none';
            const thanh_trang_thai = document.querySelector('.status-bar');
            if (thanh_trang_thai) thanh_trang_thai.style.display = 'none';

            const dong_co_hien_tai = cau_hinh.lay('maydoc') || 'web';
            this.cap_nhat_danh_sach_giong(dong_co_hien_tai);
            this.cap_nhat_giao_dien_engine(dong_co_hien_tai);
        }

        this.gan_su_kien();
        
        chrome.runtime.onMessage.addListener((tin_nhan) => {
            const hanh_dong = tin_nhan.hanhDong || tin_nhan.hanh_dong;
            if (hanh_dong === 'thayDoiTrangThai' && (tin_nhan.trangThai || tin_nhan.trang_thai)) {
                this.cap_nhat_trang_thai_phat(tin_nhan.trangThai || tin_nhan.trang_thai);
            } else if (hanh_dong === 'capNhatAnhBia' && (tin_nhan.imgUrl || tin_nhan.duong_dan_anh)) {
                const link_anh = tin_nhan.imgUrl || tin_nhan.duong_dan_anh;
                const the_anh_bia = document.getElementById('cover-img');
                if (the_anh_bia) the_anh_bia.src = link_anh;
                if (this.thong_tin_truyen_hien_tai) {
                    this.thong_tin_truyen_hien_tai.imgUrl = link_anh;
                    this.thong_tin_truyen_hien_tai.duong_dan_anh = link_anh;
                }
            }
        });

        chrome.storage.local.get(['stv_tab_dang_phat'], du_lieu => {
            this.kiem_tra_khoa_tab_khac(du_lieu.stv_tab_dang_phat);
        });

        chrome.storage.onChanged.addListener((thay_doi, vung_chon) => {
            if (vung_chon === 'local' && thay_doi.stv_tab_dang_phat) {
                this.kiem_tra_khoa_tab_khac(thay_doi.stv_tab_dang_phat.newValue);
            }
        });

        document.body.style.opacity = '1';
    },

    kiem_tra_khoa_tab_khac(tab_dang_phat) {
        const id_tab_phat = tab_dang_phat ? (tab_dang_phat.tabId || tab_dang_phat.id_the) : null;
        const dang_phat_that = tab_dang_phat ? (tab_dang_phat.isPlaying || tab_dang_phat.dang_phat) : false;
        if (tab_dang_phat && dang_phat_that && id_tab_phat && this.id_tab_hien_tai && id_tab_phat !== this.id_tab_hien_tai) {
            this.thong_tin_tab_khac_dang_phat = tab_dang_phat;
            const nut_phat = document.getElementById('btn-play');
            if (nut_phat) {
                nut_phat.classList.add('tab-locked');
                let chuoi_chu_thich = 'Đang có truyện khác đang phát...';
                const ten_truyen = tab_dang_phat.tenTruyen || tab_dang_phat.ten_truyen;
                const ten_chuong = tab_dang_phat.tenChuong || tab_dang_phat.ten_chuong;
                if (ten_truyen) {
                    chuoi_chu_thich = ten_chuong
                        ? `${ten_truyen}: ${ten_chuong} đang phát...`
                        : `${ten_truyen} đang phát...`;
                }
                nut_phat.title = chuoi_chu_thich;
            }
            const the_chu_trang_thai = document.getElementById('status-text');
            if (the_chu_trang_thai) {
                the_chu_trang_thai.textContent = 'Khóa (Tab khác đang phát)';
                the_chu_trang_thai.style.color = 'var(--text-muted)';
            }
            const the_bieu_tuong_trang_thai = document.getElementById('status-icon');
            if (the_bieu_tuong_trang_thai) {
                the_bieu_tuong_trang_thai.className = 'status-dot paused';
            }
        } else {
            this.thong_tin_tab_khac_dang_phat = null;
            const nut_phat = document.getElementById('btn-play');
            if (nut_phat) {
                nut_phat.classList.remove('tab-locked');
                nut_phat.title = 'Phát / Tạm dừng [K] hoặc [Space]';
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
        const gia_tri_cu = cau_hinh.lay('voiceIndex', true);

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
            giao_dien_cai_dat.cap_nhat_giao_dien('voice-select');
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
                const ten_giong_luu = cau_hinh.lay('voiceName', true);
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
                giao_dien_cai_dat.cap_nhat_giao_dien('voice-select');
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
            const cac_dong_co = cau_hinh.lay('customEngines', false) || [];
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
            const ten_luu = cau_hinh.lay('voiceName', true);
            const chi_so_luu = parseInt(cau_hinh.lay('voiceIndex', true), 10) || 0;
            if (ten_luu && !ten_luu.toLowerCase().includes('david') && !ten_luu.toLowerCase().includes('zira') && !ten_luu.toLowerCase().includes('english')) {
                nap_giong_web([{ name: ten_luu, lang: 'vi-VN', index: chi_so_luu }]);
            } else {
                nap_giong_web([{ name: 'MS Hoài My Online (Tự động)', lang: 'vi-VN', index: 0 }]);
            }
        }
    },

    yeu_cau_trang_thai_ban_dau() {
        if (!this.id_tab_hien_tai) return;
        chrome.tabs.sendMessage(this.id_tab_hien_tai, { hanhDong: 'layThongTin' }, phan_hoi => {
            if (chrome.runtime.lastError) {
                hien_thong_bao('Không thể kết nối đến trang', 'warning');
                return;
            }
            if (phan_hoi) this.cap_nhat_thong_tin_truyen(phan_hoi);
        });
        
        const dong_co_hien_tai = cau_hinh.lay('maydoc') || 'web';
        this.cap_nhat_danh_sach_giong(dong_co_hien_tai);
    },

    gui_lenh(hanh_dong, tham_so_them = {}) {
        if (!this.id_tab_hien_tai) return;
        chrome.tabs.sendMessage(this.id_tab_hien_tai, { hanhDong: hanh_dong, ...tham_so_them }, () => {
            if (chrome.runtime.lastError) {  }
        });
    },

    cap_nhat_giao_dien_engine(id_dong_co) {
        if (!id_dong_co) return;

        if (cau_hinh && cau_hinh.lay('maydoc', true) !== id_dong_co) {
            cau_hinh.dat('maydoc', id_dong_co, true);
        }

        const the_huy_hieu = document.getElementById('tts-badge');
        const the_dong_co_chan_trang = document.getElementById('footer-engine');
        const nut_kich_hoat_giong = document.getElementById('custom-voice-trigger');
        
        let ten_dong_co = 'Web Speech API';
        let la_web = true;
        let co_danh_sach_giong = true;

        if (id_dong_co === 'web') {
            ten_dong_co = 'Web TTS';
            if (the_dong_co_chan_trang) the_dong_co_chan_trang.textContent = 'Web Speech API';
        } else {
            la_web = false;
            const cac_dong_co_tuy_chinh = cau_hinh.lay('customEngines', false) || [];
            const dong_co_khop = cac_dong_co_tuy_chinh.find(e => e.id === id_dong_co);
            if (dong_co_khop) {
                ten_dong_co = dong_co_khop.name;
            } else if (id_dong_co.startsWith('fpt_') || id_dong_co === 'fpt') {
                ten_dong_co = 'FPT.AI TTS';
            } else if (id_dong_co.startsWith('azure_') || id_dong_co === 'azure') {
                ten_dong_co = 'Azure TTS';
            } else if (id_dong_co.startsWith('gcp_') || id_dong_co === 'gcp') {
                ten_dong_co = 'GCP TTS';
            } else {
                ten_dong_co = 'Custom TTS';
            }
            if (the_dong_co_chan_trang) the_dong_co_chan_trang.textContent = ten_dong_co;

            if (!id_dong_co.startsWith('fpt') && !id_dong_co.startsWith('azure') && !id_dong_co.startsWith('gcp') && id_dong_co !== 'web') {
                co_danh_sach_giong = false;
            }
        }

        if (the_huy_hieu) the_huy_hieu.textContent = ten_dong_co;

        if (nut_kich_hoat_giong && nut_kich_hoat_giong.parentElement) {
            nut_kich_hoat_giong.parentElement.style.display = co_danh_sach_giong ? 'block' : 'none';
            const hang_tuy_chon = nut_kich_hoat_giong.parentElement.parentElement;
            if (hang_tuy_chon && hang_tuy_chon.classList.contains('options-row')) {
                hang_tuy_chon.style.justifyContent = co_danh_sach_giong ? 'flex-start' : 'flex-end';
            }
        }

        const the_chon_dong_co = document.getElementById('engine-select');
        if (the_chon_dong_co && the_chon_dong_co.value !== id_dong_co) {
            the_chon_dong_co.value = id_dong_co;
            if (giao_dien_cai_dat && typeof giao_dien_cai_dat.cap_nhat_giao_dien === 'function') {
                giao_dien_cai_dat.cap_nhat_giao_dien('engine-select');
            }
        }

        const thanh_truot_am_luong = document.getElementById('vol-slider');
        if (thanh_truot_am_luong) {
            const am_luong_toi_da = (id_dong_co === 'web' || id_dong_co === 'auto') ? 1.0 : 2.0;
            thanh_truot_am_luong.max = am_luong_toi_da;
            if (parseFloat(thanh_truot_am_luong.value) > am_luong_toi_da) {
                thanh_truot_am_luong.value = am_luong_toi_da;
                const the_gia_tri = document.getElementById('vol-val');
                if (the_gia_tri) the_gia_tri.textContent = Math.round(am_luong_toi_da * 100) + '%';
                if (cau_hinh) cau_hinh.dat('volume', am_luong_toi_da, true);
                this.gui_lenh('capNhatCaiDat');
            }
            if (giao_dien_cai_dat && typeof giao_dien_cai_dat.cap_nhat_giao_dien === 'function') {
                giao_dien_cai_dat.cap_nhat_giao_dien('vol-slider');
            }
        }

        this.cap_nhat_danh_sach_giong(id_dong_co);
    },

    cap_nhat_trang_thai_phat(trang_thai) {
        if (!trang_thai) return;
        this.trang_thai_phat_hien_tai = trang_thai;

        const dang_phat = trang_thai.dang_phat !== undefined ? trang_thai.dang_phat : trang_thai.isPlaying;
        const dang_tam_dung = trang_thai.dang_tam_dung !== undefined ? trang_thai.dang_tam_dung : trang_thai.isPaused;
        const dang_dem = trang_thai.dang_dem !== undefined ? trang_thai.dang_dem : trang_thai.isBuffering;
        const dang_hoat_dong = dang_phat && !dang_tam_dung;

        const thoi_gian_troi_qua = trang_thai.thoi_gian_troi_qua || trang_thai.elapsed || 0;
        const pt_gio = Math.floor(thoi_gian_troi_qua / 3600);
        const pt_phut = Math.floor((thoi_gian_troi_qua % 3600) / 60).toString().padStart(2, '0');
        const pt_giay = (thoi_gian_troi_qua % 60).toString().padStart(2, '0');
        const the_chu_hen_gio = document.getElementById('timer-text');
        if (the_chu_hen_gio) {
            the_chu_hen_gio.textContent = pt_gio > 0 ? `${pt_gio}:${pt_phut}:${pt_giay}` : `${pt_phut}:${pt_giay}`;
        }

        const the_bieu_tuong = document.getElementById('btn-play-icon');
        const the_van_ban_nut = document.getElementById('btn-play-text');
        
        const SVG_PHAT = '<polygon points="5 3 19 12 5 21 5 3"/>';
        const SVG_TAMDUNG = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';

        const the_cham_trang_thai = document.getElementById('status-dot');
        const the_chu_trang_thai = document.getElementById('status-text');

        if (!the_bieu_tuong || !the_van_ban_nut || !the_cham_trang_thai || !the_chu_trang_thai) return;
        
        if (dang_dem) {
            the_bieu_tuong.innerHTML = SVG_TAMDUNG;
            the_van_ban_nut.textContent = 'Dừng';
            the_cham_trang_thai.className = 'status-dot paused';
            the_chu_trang_thai.textContent = 'Đang tải audio...';
            the_chu_trang_thai.style.color = 'var(--warning)';
        } else if (dang_hoat_dong) {
            the_bieu_tuong.innerHTML = SVG_TAMDUNG;
            the_van_ban_nut.textContent = 'Dừng';
            the_cham_trang_thai.className = 'status-dot playing';
            the_chu_trang_thai.textContent = 'Đang đọc...';
            the_chu_trang_thai.style.color = 'var(--success)';
        } else if (dang_phat && dang_tam_dung) {
            the_bieu_tuong.innerHTML = SVG_PHAT;
            the_van_ban_nut.textContent = 'Tiếp tục';
            the_cham_trang_thai.className = 'status-dot paused';
            the_chu_trang_thai.textContent = 'Đang tạm dừng';
            the_chu_trang_thai.style.color = 'var(--accent)';
        } else {
            the_bieu_tuong.innerHTML = SVG_PHAT;
            const co_doc_do = trang_thai.co_doc_do !== undefined ? trang_thai.co_doc_do : trang_thai.coDocDo;
            the_van_ban_nut.textContent = co_doc_do ? 'Tiếp tục' : 'Nghe';
            the_cham_trang_thai.className = 'status-dot';
            the_chu_trang_thai.textContent = co_doc_do ? 'Đã lưu vị trí' : 'Sẵn sàng';
            the_chu_trang_thai.style.color = 'var(--text-muted)';
        }

        // Nếu có tab khác đang phát truyện, luôn áp dụng trạng thái khóa cho nút phát
        if (this.thong_tin_tab_khac_dang_phat) {
            const nut_phat = document.getElementById('btn-play');
            if (nut_phat) {
                nut_phat.classList.add('tab-locked');
                const the_khac = this.thong_tin_tab_khac_dang_phat;
                let chuoi_chu_thich = 'Đang có truyện khác đang phát...';
                const ten_truyen = the_khac.tenTruyen || the_khac.ten_truyen;
                const ten_chuong = the_khac.tenChuong || the_khac.ten_chuong;
                if (ten_truyen) {
                    chuoi_chu_thich = ten_chuong
                        ? `${ten_truyen}: ${ten_chuong} đang phát...`
                        : `${ten_truyen} đang phát...`;
                }
                nut_phat.title = chuoi_chu_thich;
            }
            the_cham_trang_thai.className = 'status-dot paused';
            the_chu_trang_thai.textContent = 'Khóa (Tab khác đang phát)';
            the_chu_trang_thai.style.color = 'var(--text-muted)';
        }

        const tien_do = trang_thai.progress || trang_thai.tien_do;
        if (tien_do) {
            const the_nhap = document.getElementById('progress-input');
            const the_tong_so = document.getElementById('progress-total');
            const thanh_tien_trinh = document.getElementById('progress-bar-fill') || document.getElementById('progress-bar');
            const the_phan_tram = document.getElementById('progress-percent');
            const doan_hien_tai = tien_do.current !== undefined ? tien_do.current : tien_do.hien_tai;
            const tong_doan = tien_do.total !== undefined ? tien_do.total : tien_do.tong_so;
            if (the_nhap && !the_nhap.dataset.dang_sua) the_nhap.value = doan_hien_tai;
            if (the_tong_so) the_tong_so.textContent = tong_doan;
            if (thanh_tien_trinh && the_phan_tram && tong_doan > 0) {
                const phan_tram = Math.round((doan_hien_tai / tong_doan) * 100);
                thanh_tien_trinh.style.width = '100%';
                thanh_tien_trinh.style.transformOrigin = 'left';
                thanh_tien_trinh.style.transform = `scaleX(${doan_hien_tai / tong_doan})`;
                the_phan_tram.textContent = phan_tram + '%';
            }
        }

        const cong_cu = trang_thai.engine || trang_thai.cong_cu;
        if (cong_cu && cong_cu !== this._dong_co_hien_tai_giao_dien) {
            this._dong_co_hien_tai_giao_dien = cong_cu;
            this.cap_nhat_giao_dien_engine(cong_cu);
        }
    },

    cap_nhat_thong_tin_truyen(thong_tin) {
        if (!thong_tin) return;
        this.thong_tin_truyen_hien_tai = thong_tin;
        
        const duong_dan_trang = thong_tin.pageUrl || thong_tin.duong_dan_trang;
        const ten_truyen = thong_tin.bookTitle || thong_tin.ten_truyen;
        const ten_chuong = thong_tin.chapTitle || thong_tin.ten_chuong;
        const link_anh = thong_tin.imgUrl || thong_tin.duong_dan_anh;

        const la_trang_chu = duong_dan_trang && !duong_dan_trang.includes('/truyen/');
        
        if (ten_truyen) {
            document.getElementById('current-title').textContent = ten_truyen;
            document.getElementById('current-chap').style.display = 'block';
            const khung_anh_bia = document.getElementById('cover-wrapper');
            if (khung_anh_bia) khung_anh_bia.style.display = 'block';
            document.getElementById('cover-img').style.display = 'block';
            document.getElementById('btn-save').style.display = 'flex';
            
            const la_dang_doc_chuong = Boolean(ten_chuong);
            const khung_dieu_khien = document.querySelector('.controls');
            if (khung_dieu_khien) khung_dieu_khien.style.display = (la_dang_doc_chuong || thong_tin.progress || thong_tin.tien_do) ? 'flex' : 'none';
            const thanh_trang_thai = document.querySelector('.status-bar');
            if (thanh_trang_thai) thanh_trang_thai.style.display = (la_dang_doc_chuong || thong_tin.progress || thong_tin.tien_do) ? 'flex' : 'none';
        } else if (la_trang_chu) {
            document.getElementById('current-title').textContent = 'Đang ở trang chủ / tìm kiếm';
            document.getElementById('current-chap').style.display = 'none';
            const khung_anh_bia = document.getElementById('cover-wrapper');
            if (khung_anh_bia) khung_anh_bia.style.display = 'none';
            document.getElementById('cover-img').style.display = 'none';
            document.getElementById('btn-save').style.display = 'none';
            
            const khung_dieu_khien = document.querySelector('.controls');
            if (khung_dieu_khien) khung_dieu_khien.style.display = 'none';
            const thanh_trang_thai = document.querySelector('.status-bar');
            if (thanh_trang_thai) thanh_trang_thai.style.display = 'none';
        }
        
        const the_chuong = document.getElementById('current-chap');
        if (ten_chuong) {
            the_chuong.textContent = ten_chuong;
        } else if (thong_tin.stats) {
            const khung_chua = document.createElement('div');
            khung_chua.style.cssText = 'display: flex; align-items: center; justify-content: flex-start; color: var(--text-muted); font-size: 11px;';
            
            if (thong_tin.stats.view) {
                const the_span = document.createElement('span');
                the_span.style.cssText = 'margin-right: 12px; display: inline-flex; align-items: center;';
                the_span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
                const the_chu = document.createTextNode(thong_tin.stats.view);
                the_span.appendChild(the_chu);
                khung_chua.appendChild(the_span);
            }
            if (thong_tin.stats.like) {
                const the_span = document.createElement('span');
                the_span.style.cssText = 'margin-right: 12px; display: inline-flex; align-items: center;';
                the_span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>';
                const the_chu = document.createTextNode(thong_tin.stats.like);
                the_span.appendChild(the_chu);
                khung_chua.appendChild(the_span);
            }
            if (thong_tin.stats.status) {
                const the_span = document.createElement('span');
                if (thong_tin.stats.status === 'Còn tiếp') {
                    the_span.style.cssText = 'display: inline-flex; align-items: center; color: var(--accent);';
                    the_span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
                } else {
                    the_span.style.cssText = 'display: inline-flex; align-items: center; color: #10b981;';
                    the_span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                }
                const the_chu = document.createTextNode(thong_tin.stats.status);
                the_span.appendChild(the_chu);
                khung_chua.appendChild(the_span);
            }
            the_chuong.innerHTML = '';
            the_chuong.appendChild(khung_chua);
        } else {
            the_chuong.textContent = '—';
        }
        
        if (link_anh) {
            document.getElementById('cover-img').src = link_anh;
        }
        
        if (quan_ly_thu_vien.danh_sach_doc && ten_truyen) {
            chrome.storage.local.get('readingList', du_lieu => {
                try {
                    const danh_sach = du_lieu.readingList || [];
                    const vi_tri = danh_sach.findIndex(i => (i.title || '').trim().toLowerCase() === ten_truyen.trim().toLowerCase());
                    
                    if (!link_anh && vi_tri !== -1 && danh_sach[vi_tri].imgUrl) {
                        document.getElementById('cover-img').src = danh_sach[vi_tri].imgUrl;
                    }

                    if (vi_tri !== -1) {
                        this.dat_trang_thai_luu(true);
                        let da_cap_nhat = false;
                        const truyen_hien_tai = danh_sach[vi_tri];
                        if (duong_dan_trang && truyen_hien_tai.url !== duong_dan_trang) { truyen_hien_tai.url = duong_dan_trang; da_cap_nhat = true; }
                        if (ten_chuong && truyen_hien_tai.chap !== ten_chuong) { truyen_hien_tai.chap = ten_chuong; da_cap_nhat = true; }
                        if (link_anh && truyen_hien_tai.imgUrl !== link_anh) {
                            let anh_an_toan = link_anh;
                            if (anh_an_toan.startsWith('data:')) anh_an_toan = '';
                            if (anh_an_toan.toLowerCase().startsWith('http://')) anh_an_toan = 'https://' + anh_an_toan.substring(7);
                            truyen_hien_tai.imgUrl = anh_an_toan;
                            da_cap_nhat = true;
                        }
                        const tien_do_chuan = thong_tin.absoluteProgress || thong_tin.progress || thong_tin.tien_do;
                        const chunk_moi = (tien_do_chuan && (tien_do_chuan.current !== undefined ? tien_do_chuan.current : tien_do_chuan.hien_tai)) !== undefined
                            ? (tien_do_chuan.current !== undefined ? tien_do_chuan.current : tien_do_chuan.hien_tai)
                            : null;
                        if (chunk_moi !== null && truyen_hien_tai.chunkIndex !== chunk_moi) {
                            truyen_hien_tai.chunkIndex = chunk_moi;
                            da_cap_nhat = true;
                        }
                        if (da_cap_nhat) {
                            chrome.storage.local.set({ readingList: danh_sach }, () => {
                                quan_ly_thu_vien.danh_sach_doc = danh_sach;
                                quan_ly_thu_vien.hien_thi_danh_sach(quan_ly_thu_vien.sap_xep_danh_sach(danh_sach));
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
            isPlaying: thong_tin.isPlaying !== undefined ? thong_tin.isPlaying : thong_tin.dang_phat,
            isPaused: thong_tin.isPaused !== undefined ? thong_tin.isPaused : thong_tin.dang_tam_dung,
            isBuffering: thong_tin.isBuffering !== undefined ? thong_tin.isBuffering : thong_tin.dang_dem,
            engine: thong_tin.ttsEngine || thong_tin.engine || thong_tin.cong_cu,
            elapsed: thong_tin.elapsed || thong_tin.thoi_gian_troi_qua || 0,
            progress: thong_tin.progress || thong_tin.tien_do
        });
    },

    dat_trang_thai_luu(da_luu) {
        const nut = document.getElementById('btn-save');
        if (!nut) return;
        nut.className = `btn-save${da_luu ? ' saved' : ''}`;
        nut.innerHTML = da_luu ? 
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
            const nut_phat = document.getElementById('btn-play');
            if (nut_phat) {
                nut_phat.classList.add('active');
                setTimeout(() => nut_phat.classList.remove('active'), 200);
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
                const ten_truyen = (this.thong_tin_truyen_hien_tai && (this.thong_tin_truyen_hien_tai.ten_truyen || this.thong_tin_truyen_hien_tai.bookTitle))
                    ? (this.thong_tin_truyen_hien_tai.ten_truyen || this.thong_tin_truyen_hien_tai.bookTitle)
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

        const nut_luu = document.getElementById('btn-save');
        if (nut_luu) {
            nut_luu.addEventListener('click', () => {
                const hien_tai = this.thong_tin_truyen_hien_tai;
                const ten_truyen = hien_tai ? (hien_tai.ten_truyen || hien_tai.bookTitle) : null;
                if (!hien_tai || !ten_truyen) {
                    hien_thong_bao('Không có truyện nào đang mở', 'warning');
                    return;
                }
                
                chrome.storage.local.get('readingList', du_lieu => {
                    try {
                        const danh_sach = du_lieu.readingList || [];
                        const vi_tri = danh_sach.findIndex(i => (i.title || '').trim().toLowerCase() === ten_truyen.trim().toLowerCase());
                        
                        if (vi_tri !== -1) {
                            danh_sach.splice(vi_tri, 1);
                            chrome.storage.local.set({ readingList: danh_sach }, () => {
                                quan_ly_thu_vien.danh_sach_doc = danh_sach;
                                quan_ly_thu_vien.hien_thi_danh_sach(quan_ly_thu_vien.sap_xep_danh_sach(danh_sach));
                                quan_ly_thu_vien.cap_nhat_dung_luong();
                                this.dat_trang_thai_luu(false);
                                const the_dem_thong_tin = document.getElementById('info-count');
                                if (the_dem_thong_tin) the_dem_thong_tin.textContent = `${danh_sach.length} truyện`;
                                hien_thong_bao('Đã bỏ lưu truyện', 'info');
                            });
                        } else {
                            let anh_an_toan = (hien_tai.duong_dan_anh || hien_tai.imgUrl) || '';
                            if (anh_an_toan.startsWith('data:')) anh_an_toan = '';
                            if (anh_an_toan.toLowerCase().startsWith('http://')) anh_an_toan = 'https://' + anh_an_toan.substring(7);
                            const tien_do_chuan = hien_tai.absoluteProgress || hien_tai.progress || hien_tai.tien_do;
                            const chunk_so = (tien_do_chuan && (tien_do_chuan.current !== undefined ? tien_do_chuan.current : tien_do_chuan.hien_tai)) !== undefined
                                ? (tien_do_chuan.current !== undefined ? tien_do_chuan.current : tien_do_chuan.hien_tai)
                                : 0;
                            danh_sach.push({
                                title: ten_truyen,
                                url: hien_tai.duong_dan_trang || hien_tai.pageUrl || hien_tai.bookUrl || '',
                                imgUrl: anh_an_toan,
                                timestamp: Date.now(),
                                savedAt: new Date().toLocaleDateString('vi-VN'),
                                chap: hien_tai.ten_chuong || hien_tai.chapTitle || 'Chưa đọc chương nào',
                                chunkIndex: chunk_so
                            });
                            chrome.storage.local.set({ readingList: danh_sach }, () => {
                                quan_ly_thu_vien.danh_sach_doc = danh_sach;
                                quan_ly_thu_vien.hien_thi_danh_sach(quan_ly_thu_vien.sap_xep_danh_sach(danh_sach));
                                quan_ly_thu_vien.cap_nhat_dung_luong();
                                this.dat_trang_thai_luu(true);
                                const the_dem_thong_tin = document.getElementById('info-count');
                                if (the_dem_thong_tin) the_dem_thong_tin.textContent = `${danh_sach.length} truyện`;
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
                const the_chon_dong_co = document.getElementById('engine-select');
                if (the_chon_dong_co && ['fpt', 'azure'].includes(the_chon_dong_co.value)) {
                    if (the_chon_dong_co.value !== cau_hinh.lay('maydoc', true)) {
                        the_chon_dong_co.value = cau_hinh.lay('maydoc', true) || 'web';
                        the_chon_dong_co.dispatchEvent(new Event('change'));
                    }
                }
                
                const dang_hoat_dong = e.currentTarget.classList.contains('active');
                const la_tab_chinh = e.currentTarget.dataset.tab === 'main';
                
                document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
                
                if (dang_hoat_dong && !la_tab_chinh) {
                    const nut_chinh = document.querySelector('.tab[data-tab="main"]');
                    if (nut_chinh) nut_chinh.classList.add('active');
                    const khung_chinh = document.getElementById('panel-main');
                    if (khung_chinh) khung_chinh.classList.add('active');
                    if (quan_ly_thu_vien && quan_ly_thu_vien.tam_dung_marquee) {
                        quan_ly_thu_vien.tam_dung_marquee();
                    }
                } else {
                    e.currentTarget.classList.add('active');
                    const panel = document.getElementById('panel-' + e.currentTarget.dataset.tab);
                    if (panel) panel.classList.add('active');
                    if (e.currentTarget.dataset.tab === 'reading-list' && quan_ly_thu_vien && quan_ly_thu_vien.kich_hoat_marquee) {
                        quan_ly_thu_vien.kich_hoat_marquee();
                    } else if (quan_ly_thu_vien && quan_ly_thu_vien.tam_dung_marquee) {
                        quan_ly_thu_vien.tam_dung_marquee();
                    }
                }
                
                giao_dien_cai_dat.tai_lai_du_lieu_tu_dong_dung();
                giao_dien_cai_dat.tai_lai_du_lieu_may_doc();
            });
        });

        const khung_modal = document.getElementById('confirm-modal');
        if (khung_modal) {
            khung_modal.addEventListener('click', e => { if(e.target === khung_modal) khung_modal.classList.remove('show'); });
        }

        document.addEventListener('contextmenu', e => { if (e.target.tagName !== 'INPUT') e.preventDefault(); });
        document.addEventListener('dragstart', e => { if (e.target.tagName !== 'INPUT') e.preventDefault(); });

        const nut_chuyen_doan_sau = document.getElementById('btn-next-chunk');
        if (nut_chuyen_doan_sau) {
            nut_chuyen_doan_sau.addEventListener('click', () => {
                const the_nhap = document.getElementById('progress-input');
                const the_tong_so = document.getElementById('progress-total');
                if (the_nhap && the_tong_so) {
                    const hien_tai = parseInt(the_nhap.value, 10) || 0;
                    const tong_so = parseInt(the_tong_so.textContent, 10) || 0;
                    if (hien_tai < tong_so) {
                        the_nhap.value = hien_tai + 1;
                        const thanh_dien = document.getElementById('progress-bar-fill');
                        if (thanh_dien && tong_so > 0) thanh_dien.style.width = Math.round(((hien_tai + 1) / tong_so) * 100) + '%';
                    }
                }
                this.gui_lenh('doanTiep');
            });
        }

        const nut_chuyen_doan_truoc = document.getElementById('btn-prev-chunk');
        if (nut_chuyen_doan_truoc) {
            nut_chuyen_doan_truoc.addEventListener('click', () => {
                const the_nhap = document.getElementById('progress-input');
                const the_tong_so = document.getElementById('progress-total');
                if (the_nhap && the_tong_so) {
                    const hien_tai = parseInt(the_nhap.value, 10) || 0;
                    const tong_so = parseInt(the_tong_so.textContent, 10) || 0;
                    if (hien_tai > 1) {
                        the_nhap.value = hien_tai - 1;
                        const thanh_dien = document.getElementById('progress-bar-fill');
                        if (thanh_dien && tong_so > 0) thanh_dien.style.width = Math.round(((hien_tai - 1) / tong_so) * 100) + '%';
                    }
                }
                this.gui_lenh('doanTruoc');
            });
        }

        const thanh_tien_trinh = document.getElementById('progress-input');
        if (thanh_tien_trinh) {
            thanh_tien_trinh.addEventListener('focus', () => { thanh_tien_trinh.dataset.dang_sua = '1'; });
            thanh_tien_trinh.addEventListener('blur', () => { thanh_tien_trinh.dataset.dang_sua = ''; });
            thanh_tien_trinh.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const gia_tri = parseInt(thanh_tien_trinh.value, 10);
                    const tong_so = parseInt(document.getElementById('progress-total')?.textContent || '0', 10);
                    if (gia_tri >= 1 && gia_tri <= tong_so) {
                        this.gui_lenh('nhayDenDoan', { chi_so: gia_tri - 1 });
                    }
                    thanh_tien_trinh.blur();
                }
            });
        }
    }
};
