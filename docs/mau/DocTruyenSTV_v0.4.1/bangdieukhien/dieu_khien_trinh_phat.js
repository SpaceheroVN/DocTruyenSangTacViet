// Trình phát chính popup, đa tab và danh sách giọng
import { cau_hinh } from './quan_ly_cau_hinh.js';
import { quan_ly_thu_vien } from './quan_ly_thu_vien.js';
import { giao_dien_cai_dat } from './giao_dien_cai_dat.js';
import { hien_thong_bao } from './tien_ich.js';
import { giai_ma_bool, giai_ma_phim_tat, thuc_thi_khoa_danh_sach_doc } from '../chuyen_doi.js';

// === Khởi tạo trình phát ===
export const dieu_khien_trinh_phat = {
    id_tab_hien_tai: null,
    thong_tin_truyen_hien_tai: null,
    thong_tin_tab_khac_dang_phat: null,
    trang_thai_phat_hien_tai: null,
    thoi_diem_doi_dong_co_tay: 0,

    async khoi_tao() {
        const the_phien_ban = document.getElementById('version-badge');
        if (the_phien_ban) the_phien_ban.textContent = 'v' + chrome.runtime.getManifest().version;

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        const the_anh_bia = document.getElementById('cover-img');
        const khung_anh_bia = document.getElementById('cover-wrapper');
        if (the_anh_bia) {
            const hoan_tat_tai_anh = () => {
                the_anh_bia.classList.add('da-tai');
                if (khung_anh_bia) khung_anh_bia.classList.remove('dang-tai');
            };
            the_anh_bia.addEventListener('load', hoan_tat_tai_anh);
            the_anh_bia.addEventListener('error', function() {
                if (!this.src || !this.src.endsWith('icons/icon128.png')) {
                    this.src = 'icons/icon128.png';
                } else {
                    hoan_tat_tai_anh();
                }
            });
        }

        const co_trang_stv = Boolean(tab && tab.url && tab.url.includes('sangtacviet.com'));
        if (co_trang_stv) {
            this.id_tab_hien_tai = tab.id;
        } else {
            const nut_mo_stv = document.getElementById('btn-open-stv');
            if (nut_mo_stv) {
                const lay_ten_mien_luu = (xu_ly) => {
                    const chon_ten_mien_hop_le = (dl_cuc_bo = {}) => {
                        const xem_truoc = dl_cuc_bo.xem_truoc_v042;
                        let mien = (xem_truoc && xem_truoc.cai_dat_ten_mien) || dl_cuc_bo.cai_dat_ten_mien || '';
                        if (mien === 'khac') {
                            mien = (xem_truoc && xem_truoc.cau_hinh_html_tuy_chinh && xem_truoc.cau_hinh_html_tuy_chinh.ten_mien) || '';
                        }
                        mien = String(mien || '').trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
                        return mien || 'sangtacviet.com';
                    };
                    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                        chrome.storage.local.get(['xem_truoc_v042', 'cai_dat_ten_mien'], d => {
                            xu_ly(chon_ten_mien_hop_le(d || {}));
                        });
                    } else {
                        xu_ly(chon_ten_mien_hop_le(cau_hinh ? cau_hinh.du_lieu_cuc_bo : {}));
                    }
                };
                lay_ten_mien_luu((ten_mien) => {
                    nut_mo_stv.textContent = `Mở trang ${ten_mien} ngay!`;
                });
                nut_mo_stv.addEventListener('click', () => {
                    lay_ten_mien_luu((ten_mien) => {
                        const url_tho = ten_mien.startsWith('http') ? ten_mien : `https://${ten_mien}/`;
                        try {
                            const url_chuan = new URL(url_tho);
                            if (url_chuan.protocol === 'https:' || url_chuan.protocol === 'http:') {
                                chrome.tabs.create({ url: url_chuan.href });
                                return;
                            }
                        } catch (_) {}
                        chrome.tabs.create({ url: 'https://sangtacviet.com/' });
                    });
                });
            }

            const khung_the_sach = document.getElementById('book-card-content');
            if (khung_the_sach) khung_the_sach.classList.add('trang-thai-trong');
            const trang_thai_trong = document.getElementById('book-empty-state');
            if (trang_thai_trong) trang_thai_trong.style.display = 'block';
            const hang_tren = document.getElementById('book-top-row');
            if (hang_tren) hang_tren.style.display = 'none';
            const hang_hanh_dong = document.getElementById('book-actions-row');
            if (hang_hanh_dong) hang_hanh_dong.style.display = 'none';
            const khung_anh_bia_an = document.getElementById('cover-wrapper');
            if (khung_anh_bia_an) khung_anh_bia_an.style.display = 'none';
            const the_anh_bia_an = document.getElementById('cover-img');
            if (the_anh_bia_an) the_anh_bia_an.style.display = 'none';
            const nut_luu_an = document.getElementById('btn-save');
            if (nut_luu_an) nut_luu_an.style.display = 'none';
            const the_tac_gia_an = document.getElementById('current-author');
            if (the_tac_gia_an) the_tac_gia_an.style.display = 'none';
            const khung_thong_ke_an = document.getElementById('book-stats');
            if (khung_thong_ke_an) khung_thong_ke_an.style.display = 'none';
            const khung_dieu_khien = document.querySelector('.controls');
            if (khung_dieu_khien) khung_dieu_khien.style.display = 'none';
            const thanh_trang_thai = document.querySelector('.status-bar');
            if (thanh_trang_thai) thanh_trang_thai.style.display = 'none';

            const dong_co_hien_tai = cau_hinh.lay('maydoc', true) || 'web';
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
                const id_hien_tai = this.lay_id_truyen_tu_thong_tin(this.thong_tin_truyen_hien_tai);
                const id_gui = tin_nhan.bookId || tin_nhan.ma_truyen || '';
                if (!id_hien_tai || !id_gui || id_hien_tai === id_gui) {
                    this.dat_anh_bia(link_anh);
                    if (this.thong_tin_truyen_hien_tai) {
                        this.thong_tin_truyen_hien_tai.imgUrl = link_anh;
                        this.thong_tin_truyen_hien_tai.duong_dan_anh = link_anh;
                    }
                }
            } else if (hanh_dong === 'capNhatThongTinTruyenBoSung') {
                const hien_tai = this.thong_tin_truyen_hien_tai;
                if (!hien_tai) return;
                const id_hien_tai = this.lay_id_truyen_tu_thong_tin(hien_tai);
                const id_gui = tin_nhan.bookId || tin_nhan.ma_truyen || '';
                if (id_hien_tai && id_gui && id_hien_tai !== id_gui) return;

                const tac_gia_moi = (tin_nhan.author || tin_nhan.tac_gia || '').trim();
                const thong_ke_moi = tin_nhan.stats || tin_nhan.thong_ke || null;
                const co_chuong = Boolean(hien_tai.chapTitle || hien_tai.ten_chuong);

                if (tac_gia_moi) {
                    hien_tai.author = tac_gia_moi;
                    hien_tai.tac_gia = tac_gia_moi;
                    this.cap_nhat_hien_thi_tac_gia(tac_gia_moi);
                }
                if (thong_ke_moi) {
                    hien_tai.stats = thong_ke_moi;
                    hien_tai.thong_ke = thong_ke_moi;
                    this.cap_nhat_hien_thi_thong_ke(thong_ke_moi, co_chuong);
                }

                const ten_truyen = (hien_tai.bookTitle || hien_tai.ten_truyen || '').trim();
                if (tac_gia_moi && ten_truyen && quan_ly_thu_vien.danh_sach_doc) {
                    thuc_thi_khoa_danh_sach_doc(() => new Promise(hoan_tat => {
                        chrome.storage.local.get('readingList', du_lieu => {
                            const danh_sach = (du_lieu && du_lieu.readingList) || [];
                            const vi_tri = danh_sach.findIndex(i => (i.title || '').trim().toLowerCase() === ten_truyen.toLowerCase());
                            if (vi_tri !== -1 && danh_sach[vi_tri].author !== tac_gia_moi) {
                                danh_sach[vi_tri].author = tac_gia_moi;
                                chrome.storage.local.set({ readingList: danh_sach }, () => {
                                    quan_ly_thu_vien.danh_sach_doc = danh_sach;
                                    quan_ly_thu_vien.hien_thi_danh_sach(quan_ly_thu_vien.sap_xep_danh_sach(danh_sach));
                                    hoan_tat();
                                });
                            } else {
                                hoan_tat();
                            }
                        });
                    }));
                }
            }
        });

        this.cap_nhat_tooltip_phim_tat();

        const cho_trang_thai_ban_dau = co_trang_stv ? this.yeu_cau_trang_thai_ban_dau() : null;

        chrome.storage.local.get(['stv_tab_dang_phat'], du_lieu => {
            this.kiem_tra_khoa_tab_khac(du_lieu.stv_tab_dang_phat);
        });

        chrome.storage.onChanged.addListener((thay_doi, vung_chon) => {
            if (vung_chon === 'local' && thay_doi.stv_tab_dang_phat) {
                this.kiem_tra_khoa_tab_khac(thay_doi.stv_tab_dang_phat.newValue);
            }
            if ((vung_chon === 'sync' || vung_chon === 'local') && (thay_doi.customShortcuts || thay_doi.batphimtat)) {
                const dong_bo_cache = (khoa, gia_tri_moi) => {
                    if (!cau_hinh) return;
                    const dich = vung_chon === 'sync' ? cau_hinh.du_lieu_dong_bo : cau_hinh.du_lieu_cuc_bo;
                    if (gia_tri_moi === undefined) delete dich[khoa];
                    else dich[khoa] = gia_tri_moi;
                };
                if (thay_doi.customShortcuts) dong_bo_cache('customShortcuts', thay_doi.customShortcuts.newValue);
                if (thay_doi.batphimtat) dong_bo_cache('batphimtat', thay_doi.batphimtat.newValue);
                this.cap_nhat_tooltip_phim_tat();
            }
        });

        if (cho_trang_thai_ban_dau) {
            await Promise.race([
                cho_trang_thai_ban_dau,
                new Promise(giai_quyet => setTimeout(giai_quyet, 180))
            ]);
        }

        document.body.style.opacity = '1';
    },

    dat_anh_bia(duong_dan) {
        const the_anh_bia = document.getElementById('cover-img');
        const khung_anh_bia = document.getElementById('cover-wrapper');
        if (!the_anh_bia) return;

        let anh_dich = (duong_dan && String(duong_dan).trim()) ? String(duong_dan).trim() : 'icons/icon128.png';
        if (anh_dich.toLowerCase().startsWith('http://')) {
            anh_dich = 'https://' + anh_dich.substring(7);
        }
        if (the_anh_bia.getAttribute('src') === anh_dich && the_anh_bia.complete && the_anh_bia.naturalWidth > 0) {
            the_anh_bia.classList.add('da-tai');
            if (khung_anh_bia) khung_anh_bia.classList.remove('dang-tai');
            return;
        }

        the_anh_bia.classList.remove('da-tai');
        if (khung_anh_bia) khung_anh_bia.classList.add('dang-tai');
        the_anh_bia.src = anh_dich;
        if (the_anh_bia.complete && the_anh_bia.naturalWidth > 0) {
            the_anh_bia.classList.add('da-tai');
            if (khung_anh_bia) khung_anh_bia.classList.remove('dang-tai');
        }
    },

    // Rút gọn tên phím mũi tên cho tooltip
    dinh_dang_phim_tooltip(phim) {
        if (!phim) return '';
        const anh_xa_mui_ten = {
            ArrowLeft: '←',
            ArrowRight: '→',
            ArrowUp: '↑',
            ArrowDown: '↓'
        };
        return String(phim)
            .split('+')
            .map(phan => anh_xa_mui_ten[phan] || phan)
            .join('+');
    },

    // Cập nhật tooltip phím tắt ở Trang chủ
    cap_nhat_tooltip_phim_tat(phim_tat_truyen_vao = null) {
        const bat_phim_tat = cau_hinh ? giai_ma_bool(cau_hinh.lay('batphimtat', true), true) : true;
        const phim_tat = phim_tat_truyen_vao
            ? giai_ma_phim_tat(phim_tat_truyen_vao)
            : giai_ma_phim_tat(cau_hinh ? cau_hinh.lay('customShortcuts', true) : null);

        const danh_sach_nut = [
            { id: 'btn-prev-chunk', nhan: 'Lùi lại một đoạn', khoa: 'prevSeg', ngoac: 'tron' },
            { id: 'btn-next-chunk', nhan: 'Chuyển đoạn tiếp theo', khoa: 'nextSeg', ngoac: 'tron' },
            { id: 'btn-prev', nhan: 'Chương trước', khoa: 'prevChap', ngoac: 'vuong' },
            { id: 'btn-replay', nhan: 'Đọc lại từ đầu', khoa: 'replay', ngoac: 'vuong' },
            { id: 'btn-stop', nhan: 'Dừng hẳn', phim_co_dinh: 'Esc', ngoac: 'vuong' },
            { id: 'btn-next', nhan: 'Chương sau', khoa: 'nextChap', ngoac: 'vuong' }
        ];

        for (const muc of danh_sach_nut) {
            const el = document.getElementById(muc.id);
            if (!el) continue;
            if (!bat_phim_tat) {
                el.title = muc.nhan;
                continue;
            }
            const ky_hieu = this.dinh_dang_phim_tooltip(muc.phim_co_dinh || phim_tat[muc.khoa]);
            el.title = muc.ngoac === 'tron'
                ? `${muc.nhan} (${ky_hieu})`
                : `${muc.nhan}  [${ky_hieu}]`;
        }

        const nut_phat = document.getElementById('btn-play');
        if (nut_phat && !this.thong_tin_tab_khac_dang_phat) {
            if (!bat_phim_tat) {
                nut_phat.title = 'Phát / Tạm dừng';
            } else {
                const phim_phat = phim_tat.playPause || 'K';
                const ky_hieu_phat = this.dinh_dang_phim_tooltip(phim_phat);
                nut_phat.title = phim_phat === 'Space'
                    ? 'Phát / Tạm dừng [Space]'
                    : `Phát / Tạm dừng [${ky_hieu_phat}] hoặc [Space]`;
            }
        }

        const nhan_toc_do = document.querySelector('.label-speed');
        const thanh_toc_do = document.getElementById('speed-slider');
        const thanh_am_luong = document.getElementById('vol-slider');
        if (bat_phim_tat) {
            const tip_toc_do = `Tốc độ (Giảm [${this.dinh_dang_phim_tooltip(phim_tat.speedDown)}] / Tăng [${this.dinh_dang_phim_tooltip(phim_tat.speedUp)}])`;
            const tip_am_luong = `Âm lượng (Giảm [${this.dinh_dang_phim_tooltip(phim_tat.volDown)}] / Tăng [${this.dinh_dang_phim_tooltip(phim_tat.volUp)}])`;
            if (nhan_toc_do) nhan_toc_do.title = tip_toc_do;
            if (thanh_toc_do) thanh_toc_do.title = tip_toc_do;
            if (thanh_am_luong) thanh_am_luong.title = tip_am_luong;
        } else {
            if (nhan_toc_do) nhan_toc_do.removeAttribute('title');
            if (thanh_toc_do) thanh_toc_do.removeAttribute('title');
            if (thanh_am_luong) thanh_am_luong.removeAttribute('title');
        }
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
            }
            this.cap_nhat_tooltip_phim_tat();
            if (this.trang_thai_phat_hien_tai) {
                this.cap_nhat_trang_thai_phat(this.trang_thai_phat_hien_tai);
            }
        }
    },

    // Đồng bộ danh sách giọng theo công cụ
    cap_nhat_danh_sach_giong(ma_dong_co) {
        const the_chon = document.getElementById('voice-select');
        const the_thong_tin = document.getElementById('info-voice');
        const the_chu_giong_tuy_chinh = document.getElementById('custom-voice-text');
        if (!the_chon) return;
        const gia_tri_cu = cau_hinh.lay('voiceIndex', true);

        const gan_tooltip_giong = (nhan_giong_day_du) => {
            const gia_tri_tooltip = (nhan_giong_day_du || '').trim() || 'Chưa rõ';
            if (the_thong_tin) the_thong_tin.title = gia_tri_tooltip;
            if (the_chu_giong_tuy_chinh) the_chu_giong_tuy_chinh.title = gia_tri_tooltip;
            const nut_kich_hoat = document.getElementById('custom-voice-trigger');
            if (nut_kich_hoat) nut_kich_hoat.title = gia_tri_tooltip;
        };

        const tao_danh_sach_lua_chon = (cac_giong) => {
            let chi_so_chon = parseInt(gia_tri_cu, 10);
            const hop_le = !isNaN(chi_so_chon) && chi_so_chon >= 0 && chi_so_chon < cac_giong.length;
            if (!hop_le) {
                chi_so_chon = 0;
                cau_hinh.dat('voiceIndex', 0, true, true);
                cau_hinh.dat('voiceName', cac_giong[0] || '', true, true);
                this.gui_lenh('doiGiongDoc', { voiceIndex: 0, voiceName: cac_giong[0] || '' });
            } else if (!cau_hinh.lay('voiceName', true) && cac_giong[chi_so_chon]) {
                cau_hinh.dat('voiceName', cac_giong[chi_so_chon], true, true);
            }
            the_chon.innerHTML = cac_giong.map((ten, chi_so) => {
                const ten_an_toan = ten.replace(/[&<>"'`=\/]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[s]));
                return `<option value="${chi_so}" data-voice-name="${ten_an_toan}" title="${ten_an_toan}" ${chi_so == chi_so_chon ? 'selected' : ''}>${ten_an_toan}</option>`;
            }).join('');
            the_chon.value = String(chi_so_chon);
            giao_dien_cai_dat.cap_nhat_giao_dien('voice-select');
            const lua_chon_hien_tai = the_chon.options[the_chon.selectedIndex];
            const ten_giong = lua_chon_hien_tai ? lua_chon_hien_tai.text : (cac_giong[0] || 'Mặc định');
            const ten_giong_day_du = lua_chon_hien_tai ? (lua_chon_hien_tai.getAttribute('data-voice-name') || ten_giong) : ten_giong;
            if (the_thong_tin) the_thong_tin.textContent = ten_giong;
            if (the_chu_giong_tuy_chinh) the_chu_giong_tuy_chinh.textContent = ten_giong;
            gan_tooltip_giong(ten_giong_day_du);
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
                let da_khop_theo_ten = false;
                if (ten_giong_luu) {
                    const tim_theo_ten = danh_sach_giong.find(v => v.name === ten_giong_luu || (v.voiceURI && v.voiceURI === ten_giong_luu) || v.name.toLowerCase() === ten_giong_luu.toLowerCase());
                    if (tim_theo_ten) {
                        chi_so_chon = tim_theo_ten.index;
                        da_khop_theo_ten = true;
                    }
                }
                const muc_hien_tai = danh_sach_giong.find(v => v.index == chi_so_chon);
                const can_tu_chon_viet = !da_khop_theo_ten && (!muc_hien_tai || (!ten_giong_luu && !(muc_hien_tai.lang && muc_hien_tai.lang.toLowerCase().startsWith('vi'))));
                if (can_tu_chon_viet) {
                    const giong_viet_uu_tien = danh_sach_giong.find(v => v.lang && v.lang.toLowerCase().startsWith('vi') && (v.name.includes('Online') || v.name.includes('Natural')))
                        || danh_sach_giong.find(v => v.lang && v.lang.toLowerCase().startsWith('vi'));
                    if (giong_viet_uu_tien) {
                        chi_so_chon = giong_viet_uu_tien.index;
                        cau_hinh.dat('voiceIndex', chi_so_chon, true, true);
                        cau_hinh.dat('voiceName', giong_viet_uu_tien.name, true, true);
                        this.gui_lenh('doiGiongDoc', { voiceIndex: chi_so_chon, voiceName: giong_viet_uu_tien.name });
                    } else if (!muc_hien_tai) {
                        chi_so_chon = danh_sach_giong[0] ? danh_sach_giong[0].index : 0;
                    }
                }
                the_chon.innerHTML = danh_sach_giong.map(v => {
                    let ten = v.name.replace(/ - Vietnamese \(Vietnam\)/i, '').replace(/ \(Vietnam\)/i, '').replace(/Microsoft /i, 'MS ').replace(/Google /i, 'GG ');
                    if (ten.length > 22) ten = ten.substring(0, 20) + '...';
                    const ten_an_toan = ten.replace(/[&<>"'`=\/]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[s]));
                    const chi_so_an_toan = String(v.index).replace(/[^0-9]/g, '');
                    const ten_goc_an_toan = (v.name || '').replace(/[&<>"'`=\/]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[s]));
                    return `<option value="${chi_so_an_toan}" data-voice-name="${ten_goc_an_toan}" title="${ten_goc_an_toan || 'Chưa rõ'}" ${chi_so_an_toan == chi_so_chon ? 'selected' : ''}>${ten_an_toan}</option>`;
                }).join('');
                the_chon.value = String(chi_so_chon);
                giao_dien_cai_dat.cap_nhat_giao_dien('voice-select');
                const lua_chon_hien_tai = the_chon.options[the_chon.selectedIndex];
                const ten_giong = lua_chon_hien_tai ? lua_chon_hien_tai.text : 'Mặc định';
                const ten_giong_day_du = lua_chon_hien_tai ? (lua_chon_hien_tai.getAttribute('data-voice-name') || ten_giong) : ten_giong;
                if (the_thong_tin) the_thong_tin.textContent = ten_giong;
                if (the_chu_giong_tuy_chinh) the_chu_giong_tuy_chinh.textContent = ten_giong;
                gan_tooltip_giong(ten_giong_day_du);
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
        } else {
            const cac_dong_co = cau_hinh.lay('customEngines', false) || [];
            const dong_co = cac_dong_co.find(e => String(e.id) === String(ma_dong_co));
            const loai_dong_co = (dong_co?.type || ma_dong_co.split('_')[0] || '').toLowerCase();
            const bang_giong_mac_dinh = {
                fpt: ['Ban Mai (Nữ miền Bắc)', 'Lê Minh (Nam miền Bắc)', 'Thu Minh (Nữ miền Bắc)', 'Mỹ An (Nữ miền Trung)', 'Gia Huy (Nam miền Trung)', 'Lan Nhi (Nữ miền Nam)', 'Linh San (Nữ miền Nam)'],
                azure: ['Hoài My (Nữ)', 'Nam Minh (Nam)'],
                gcp: ['Neural2 A (Nữ)', 'Neural2 D (Nam)', 'Wavenet A (Nữ)', 'Wavenet B (Nam)', 'Wavenet C (Nữ)', 'Wavenet D (Nam)', 'Standard A (Nữ)', 'Standard B (Nam)', 'Standard C (Nữ)', 'Standard D (Nam)'],
                gemini: ['Kore (Rõ nét)', 'Aoede (Tự nhiên)', 'Puck (Nhanh nhẹn)', 'Charon (Trầm ấm)', 'Fenrir (Mạnh mẽ)', 'Zephyr (Nhẹ nhàng)', 'Leda (Dịu dàng)', 'Orus (Trang trọng)'],
                zalo: ['Nữ miền Nam 1', 'Nữ miền Bắc 1', 'Nam miền Nam', 'Nam miền Bắc', 'Nữ miền Bắc 2', 'Nữ miền Nam 2'],
                vnpt: ['Nữ miền Bắc', 'Nam miền Bắc', 'Nữ miền Trung', 'Nữ miền Nam', 'Nam miền Nam'],
                cartesia: ['Giọng mặc định (Tài khoản)'],
                elevenlabs: ['Rachel (Cơ bản)', 'Adam (Nam trầm)', 'Bella (Truyền cảm)', 'Josh (Nam tự nhiên)'],
                fish: ['Giọng mặc định (Fish S2.1)'],
                viettel: ['Quỳnh Anh (Nữ Bắc)', 'Phương Trang (Nữ Bắc)', 'Thảo Chi (Nữ Bắc)', 'Thanh Hà (Nữ Bắc)', 'Thanh Tùng (Nam Bắc)', 'Mai Ngọc (Nữ Trung)', 'Diễm My (Nữ Nam)', 'Phương Ly (Nữ Nam)', 'Thùy Dung (Nữ Nam)'],
                vieneu: ['Mai Anh (Mặc định)']
            };
            const bang_id_mac_dinh = {
                gemini: ['Kore', 'Aoede', 'Puck', 'Charon', 'Fenrir', 'Zephyr', 'Leda', 'Orus'],
                elevenlabs: ['21m00Tcm4TlvDq8ikWAM', 'pNInz6obpgDQGcFmaJgB', 'EXAVITQu4vr4xnSDxMaL', 'TxGEqnHWrfWFTfGW9XjX'],
                vieneu: ['Mai Anh']
            };

            if (dong_co && Array.isArray(dong_co.voices) && dong_co.voices.length > 0) {
                const ds_giong = dong_co.voices.map((g) => (typeof g === 'object' ? (g.ten || g.name || g.id || 'Mặc định') : String(g)));
                tao_danh_sach_lua_chon(ds_giong);
            } else if (bang_giong_mac_dinh[loai_dong_co]) {
                let ds_giong = [...bang_giong_mac_dinh[loai_dong_co]];
                const ma_rieng = dong_co && dong_co.ma_giong ? String(dong_co.ma_giong).trim() : '';
                if (ma_rieng) {
                    const ds_id_con = bang_id_mac_dinh[loai_dong_co] || [];
                    ds_giong = ds_giong.filter((_, idx) => ds_id_con[idx] !== ma_rieng);
                    if (loai_dong_co === 'cartesia') ds_giong = [`Giọng tùy chỉnh (${ma_rieng})`];
                    else ds_giong.unshift(`Giọng tùy chỉnh (${ma_rieng})`);
                }
                tao_danh_sach_lua_chon(ds_giong);
            } else if (ma_dong_co.startsWith('khac_')) {
                const danh_sach_ten_giong = Array.from({ length: 10 }, (_, i) => `Giọng đọc ${i + 1}`);
                tao_danh_sach_lua_chon(danh_sach_ten_giong);
            } else {
                if (the_thong_tin) the_thong_tin.textContent = 'Mặc định';
                if (the_chu_giong_tuy_chinh) the_chu_giong_tuy_chinh.textContent = 'Mặc định';
                gan_tooltip_giong('Chưa rõ');
            }
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
            if (ten_luu) {
                nap_giong_web([{ name: ten_luu, lang: 'vi-VN', index: chi_so_luu }]);
            } else {
                nap_giong_web([{ name: 'MS Hoài My Online (Tự động)', lang: 'vi-VN', index: 0 }]);
            }
        }
    },

    // === Đồng bộ động cơ và lệnh trang ===

    yeu_cau_trang_thai_ban_dau() {
        const dong_co_hien_tai = cau_hinh.lay('maydoc', true) || 'web';
        this.cap_nhat_danh_sach_giong(dong_co_hien_tai);

        if (!this.id_tab_hien_tai) return Promise.resolve();
        return new Promise((giai_quyet) => {
            chrome.tabs.sendMessage(this.id_tab_hien_tai, { hanhDong: 'layThongTin' }, phan_hoi => {
                if (chrome.runtime.lastError) {
                    hien_thong_bao('Không thể kết nối đến trang', 'warning');
                    giai_quyet();
                    return;
                }
                if (phan_hoi) this.cap_nhat_thong_tin_truyen(phan_hoi);
                giai_quyet();
            });
        });
    },

    gui_lenh(hanh_dong, tham_so_them = {}, phan_hoi_cb = null) {
        if (!this.id_tab_hien_tai) return;
        chrome.tabs.sendMessage(this.id_tab_hien_tai, { hanhDong: hanh_dong, ...tham_so_them }, (res) => {
            if (chrome.runtime.lastError) {  }
            if (typeof phan_hoi_cb === 'function') phan_hoi_cb(res);
        });
    },

    // --- Huy hiệu động cơ và trạng thái phát ---

    cap_nhat_giao_dien_engine(id_dong_co) {
        if (!id_dong_co) return;
        this._dong_co_hien_tai_giao_dien = id_dong_co;

        const the_huy_hieu = document.getElementById('tts-badge');
        const the_dong_co_chan_trang = document.getElementById('footer-engine');
        const nut_kich_hoat_giong = document.getElementById('custom-voice-trigger');
        
        let ten_dong_co = 'Web Speech API';
        let co_danh_sach_giong = true;

        if (id_dong_co === 'web') {
            ten_dong_co = 'Web TTS';
            if (the_dong_co_chan_trang) the_dong_co_chan_trang.textContent = 'Web Speech API';
        } else {
            const cac_dong_co_tuy_chinh = cau_hinh.lay('customEngines', false) || [];
            const dong_co_khop = cac_dong_co_tuy_chinh.find(e => e.id === id_dong_co);
            const bang_ten_mac_dinh = {
                fpt: 'FPT.AI TTS',
                azure: 'Azure TTS',
                gcp: 'GCP TTS',
                gemini: 'Gemini TTS',
                zalo: 'Zalo AI TTS',
                vnpt: 'VNPT SmartVoice',
                cartesia: 'Cartesia AI',
                elevenlabs: 'ElevenLabs',
                fish: 'Fish Audio',
                viettel: 'Viettel AI TTS',
                vieneu: 'VieNeu-TTS'
            };
            const loai_tu_id = (id_dong_co.split('_')[0] || '').toLowerCase();
            if (dong_co_khop) {
                ten_dong_co = dong_co_khop.name;
            } else if (bang_ten_mac_dinh[loai_tu_id]) {
                ten_dong_co = bang_ten_mac_dinh[loai_tu_id];
            } else {
                ten_dong_co = 'Custom TTS';
            }
            if (the_dong_co_chan_trang) the_dong_co_chan_trang.textContent = ten_dong_co;

            const ho_tro_giong = Boolean(dong_co_khop) || Boolean(bang_ten_mac_dinh[loai_tu_id]) || id_dong_co.startsWith('khac_');
            if (!ho_tro_giong && id_dong_co !== 'web') {
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
        if (the_chon_dong_co && Array.from(the_chon_dong_co.options).some(o => String(o.value) === String(id_dong_co))
            && the_chon_dong_co.value !== id_dong_co) {
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

    // === Giao diện phát và thông tin truyện ===

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
        
        const nut_phat = document.getElementById('btn-play');
        const cap_nhat_mau_nut_phat = (lop_trang_thai) => {
            if (!nut_phat) return;
            nut_phat.classList.remove('trang-thai-nghe', 'trang-thai-tam-dung', 'trang-thai-tiep-tuc');
            nut_phat.classList.add(lop_trang_thai);
        };

        if (dang_dem) {
            the_bieu_tuong.innerHTML = SVG_TAMDUNG;
            the_van_ban_nut.textContent = 'Tạm dừng';
            cap_nhat_mau_nut_phat('trang-thai-tam-dung');
            the_cham_trang_thai.className = 'status-dot paused';
            the_chu_trang_thai.textContent = 'Đang tải audio...';
            the_chu_trang_thai.style.color = 'var(--warning)';
        } else if (dang_hoat_dong) {
            the_bieu_tuong.innerHTML = SVG_TAMDUNG;
            the_van_ban_nut.textContent = 'Tạm dừng';
            cap_nhat_mau_nut_phat('trang-thai-tam-dung');
            the_cham_trang_thai.className = 'status-dot playing';
            the_chu_trang_thai.textContent = 'Đang đọc...';
            the_chu_trang_thai.style.color = 'var(--success)';
        } else if (dang_phat && dang_tam_dung) {
            the_bieu_tuong.innerHTML = SVG_PHAT;
            the_van_ban_nut.textContent = 'Tiếp tục';
            cap_nhat_mau_nut_phat('trang-thai-tiep-tuc');
            the_cham_trang_thai.className = 'status-dot paused';
            the_chu_trang_thai.textContent = 'Đang tạm dừng';
            the_chu_trang_thai.style.color = 'var(--accent)';
        } else {
            the_bieu_tuong.innerHTML = SVG_PHAT;
            const co_doc_do = trang_thai.co_doc_do !== undefined ? trang_thai.co_doc_do : trang_thai.coDocDo;
            the_van_ban_nut.textContent = co_doc_do ? 'Tiếp tục' : 'Nghe';
            cap_nhat_mau_nut_phat(co_doc_do ? 'trang-thai-tiep-tuc' : 'trang-thai-nghe');
            the_cham_trang_thai.className = 'status-dot';
            the_chu_trang_thai.textContent = co_doc_do ? 'Đã lưu vị trí' : 'Sẵn sàng';
            the_chu_trang_thai.style.color = 'var(--text-muted)';
        }

        // Khóa nút phát nếu tab khác đang phát
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
            const thanh_tien_trinh = document.getElementById('progress-bar-fill');
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
        const may_luu = (typeof cau_hinh !== 'undefined' && cau_hinh && cau_hinh.lay('maydoc', true)) || 'web';
        const vua_doi_thu_cong = this.thoi_diem_doi_dong_co_tay && (Date.now() - this.thoi_diem_doi_dong_co_tay < 1500);
        const la_du_phong_web = Boolean(trang_thai.tam_du_phong_web || (cong_cu === 'web' && may_luu && may_luu !== 'web' && may_luu !== 'auto'));
        // Tránh trạng thái tạm ghi đè lựa chọn nguồn đọc
        if (!vua_doi_thu_cong && cong_cu && !la_du_phong_web && cong_cu !== this._dong_co_hien_tai_giao_dien) {
            this.cap_nhat_giao_dien_engine(cong_cu);
        } else if (la_du_phong_web && dang_phat) {
            const the_huy_hieu = document.getElementById('tts-badge');
            if (the_huy_hieu) the_huy_hieu.textContent = 'Web TTS tạm';
        }
    },

    // === Đồng bộ thông tin truyện và nút Lưu ===

    cap_nhat_thong_tin_truyen(thong_tin) {
        if (!thong_tin) return;
        this.thong_tin_truyen_hien_tai = thong_tin;
        
        const duong_dan_trang = thong_tin.pageUrl || thong_tin.duong_dan_trang;
        const ten_truyen = thong_tin.bookTitle || thong_tin.ten_truyen;
        const ten_tac_gia = (thong_tin.author || thong_tin.tac_gia || '').trim();
        const ten_chuong = thong_tin.chapTitle || thong_tin.ten_chuong;
        const link_anh = thong_tin.imgUrl || thong_tin.duong_dan_anh;

        let so_doan_duong_dan = 0;
        if (duong_dan_trang) {
            try {
                so_doan_duong_dan = new URL(duong_dan_trang).pathname.split('/').filter(Boolean).length;
            } catch (_) {
                so_doan_duong_dan = 0;
            }
        }
        const la_trang_chu = duong_dan_trang && !duong_dan_trang.includes('/truyen/');
        const la_trang_gioi_thieu_stv = Boolean(
            duong_dan_trang &&
            duong_dan_trang.includes('/truyen/') &&
            !ten_chuong &&
            ((so_doan_duong_dan > 0 && so_doan_duong_dan <= 4) || thong_tin.stats)
        );
        
        if (ten_truyen) {
            const khung_the_sach = document.getElementById('book-card-content');
            if (khung_the_sach) khung_the_sach.classList.remove('trang-thai-trong');
            const trang_thai_trong = document.getElementById('book-empty-state');
            if (trang_thai_trong) trang_thai_trong.style.display = 'none';
            const hang_tren = document.getElementById('book-top-row');
            if (hang_tren) hang_tren.style.display = 'flex';
            const thong_tin_sach = document.getElementById('book-meta');
            if (thong_tin_sach) thong_tin_sach.style.display = 'block';
            const hang_hanh_dong = document.getElementById('book-actions-row');
            if (hang_hanh_dong) hang_hanh_dong.style.display = 'flex';
            document.getElementById('current-title').textContent = ten_truyen;
            this.cap_nhat_hien_thi_tac_gia(ten_tac_gia);
            const khung_anh_bia = document.getElementById('cover-wrapper');
            if (khung_anh_bia) khung_anh_bia.style.display = 'block';
            document.getElementById('cover-img').style.display = 'block';
            document.getElementById('btn-save').style.display = 'inline-flex';
            
            const la_dang_doc_chuong = Boolean(ten_chuong);
            const dang_hoat_dong = Boolean(thong_tin.isPlaying || thong_tin.dang_phat || thong_tin.isPaused || thong_tin.dang_tam_dung);
            const hien_dieu_khien = !la_trang_gioi_thieu_stv
                ? (la_dang_doc_chuong || thong_tin.progress || thong_tin.tien_do)
                : dang_hoat_dong;
            const khung_dieu_khien = document.querySelector('.controls');
            if (khung_dieu_khien) khung_dieu_khien.style.display = hien_dieu_khien ? 'flex' : 'none';
            const thanh_trang_thai = document.querySelector('.status-bar');
            if (thanh_trang_thai) thanh_trang_thai.style.display = hien_dieu_khien ? 'flex' : 'none';
        } else if (la_trang_chu) {
            const khung_the_sach = document.getElementById('book-card-content');
            if (khung_the_sach) khung_the_sach.classList.remove('trang-thai-trong');
            const trang_thai_trong = document.getElementById('book-empty-state');
            if (trang_thai_trong) trang_thai_trong.style.display = 'none';
            const hang_tren = document.getElementById('book-top-row');
            if (hang_tren) hang_tren.style.display = 'flex';
            const thong_tin_sach = document.getElementById('book-meta');
            if (thong_tin_sach) thong_tin_sach.style.display = 'block';
            const hang_hanh_dong = document.getElementById('book-actions-row');
            if (hang_hanh_dong) hang_hanh_dong.style.display = 'none';
            document.getElementById('current-title').textContent = 'Đang ở trang chủ / tìm kiếm';
            this.cap_nhat_hien_thi_tac_gia('');
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
        
        const the_tieu_de = document.getElementById('current-title');
        if (the_tieu_de) {
            the_tieu_de.title = (ten_truyen && ten_truyen.trim())
                ? ten_truyen.trim()
                : (la_trang_chu ? 'Đang ở trang chủ / tìm kiếm' : 'Chưa rõ');
        }

        const the_chuong = document.getElementById('current-chap');
        const thong_ke_ban_dau = thong_tin.stats || thong_tin.thong_ke || null;
        if (ten_chuong) {
            if (the_chuong) {
                the_chuong.style.display = 'block';
                the_chuong.textContent = ten_chuong;
                the_chuong.title = ten_chuong.trim() || 'Chưa rõ';
            }
        } else if (thong_ke_ban_dau) {
            if (the_chuong) {
                the_chuong.style.display = 'none';
                the_chuong.textContent = '';
                the_chuong.removeAttribute('title');
            }
        } else {
            if (the_chuong) {
                the_chuong.style.display = la_trang_chu ? 'none' : 'block';
                if (!la_trang_chu) {
                    the_chuong.textContent = '-';
                    the_chuong.title = 'Chưa rõ';
                }
            }
        }
        this.cap_nhat_hien_thi_thong_ke(la_trang_chu ? null : thong_ke_ban_dau, Boolean(ten_chuong));
        
        if (link_anh) {
            this.dat_anh_bia(link_anh);
        } else if (ten_truyen) {
            const khung_anh_bia = document.getElementById('cover-wrapper');
            if (khung_anh_bia) khung_anh_bia.classList.add('dang-tai');
        }
        
        const id_truyen = this.lay_id_truyen_tu_thong_tin(thong_tin);
        const khoa_meta = id_truyen ? `meta_${id_truyen}` : '';
        const khoa_bia = id_truyen ? `bia_${id_truyen}` : '';
        if (ten_truyen && (quan_ly_thu_vien.danh_sach_doc || khoa_meta || khoa_bia)) {
            const khoa_can_doc = ['readingList'];
            if (khoa_meta) khoa_can_doc.push(khoa_meta);
            if (khoa_bia) khoa_can_doc.push(khoa_bia);
            thuc_thi_khoa_danh_sach_doc(() => new Promise(hoan_tat => {
                chrome.storage.local.get(khoa_can_doc, du_lieu => {
                    try {
                        const meta_tho = khoa_meta && du_lieu ? du_lieu[khoa_meta] : null;
                        const meta_luu = (meta_tho && meta_tho.v === 2) ? meta_tho : null;
                        let tac_gia_hien_co = ten_tac_gia;
                        if (!tac_gia_hien_co && meta_luu && meta_luu.author) {
                            tac_gia_hien_co = meta_luu.author.trim();
                            if (tac_gia_hien_co) {
                                thong_tin.author = tac_gia_hien_co;
                                thong_tin.tac_gia = tac_gia_hien_co;
                                this.cap_nhat_hien_thi_tac_gia(tac_gia_hien_co);
                            }
                        }
                        if (!thong_ke_ban_dau && meta_luu && meta_luu.stats) {
                            thong_tin.stats = meta_luu.stats;
                            thong_tin.thong_ke = meta_luu.stats;
                            this.cap_nhat_hien_thi_thong_ke(meta_luu.stats, Boolean(ten_chuong));
                        }

                        const danh_sach = (du_lieu && du_lieu.readingList) || [];
                        const vi_tri = danh_sach.findIndex(i => (i.title || '').trim().toLowerCase() === ten_truyen.trim().toLowerCase());

                        // Lấy URL bìa mới nhất tránh ghi đè
                        const hien_tai_moi_nhat = this.thong_tin_truyen_hien_tai;
                        const cung_sach_hien_tai = Boolean(
                            hien_tai_moi_nhat && (
                                !id_truyen ||
                                this.lay_id_truyen_tu_thong_tin(hien_tai_moi_nhat) === id_truyen
                            )
                        );
                        const loc_anh_bia_hop_le = (url_tho) => {
                            const gia_tri = String(url_tho || '').trim();
                            if (!gia_tri) return '';
                            if (/^(?:data:|javascript:|blob:)/i.test(gia_tri)) return '';
                            if (/\/(?:favicon|default)\.[a-z0-9]+(?:[?#]|$)/i.test(gia_tri) || /icon128\.png/i.test(gia_tri)) return '';
                            return gia_tri.toLowerCase().startsWith('http://')
                                ? 'https://' + gia_tri.substring(7)
                                : gia_tri;
                        };
                        const anh_da_nhan = loc_anh_bia_hop_le(
                            (cung_sach_hien_tai && (hien_tai_moi_nhat.imgUrl || hien_tai_moi_nhat.duong_dan_anh)) || link_anh
                        );
                        const anh_cache_cuc_bo = loc_anh_bia_hop_le(
                            (khoa_bia && du_lieu && du_lieu[khoa_bia] && String(du_lieu[khoa_bia]).startsWith('http'))
                                ? String(du_lieu[khoa_bia])
                                : ''
                        );
                        const anh_thu_vien = loc_anh_bia_hop_le((vi_tri !== -1 && danh_sach[vi_tri].imgUrl) ? danh_sach[vi_tri].imgUrl : '');
                        const anh_uu_tien = anh_da_nhan || anh_cache_cuc_bo || anh_thu_vien;

                        if ((!link_anh || !loc_anh_bia_hop_le(link_anh)) && anh_uu_tien) {
                            this.dat_anh_bia(anh_uu_tien);
                            if (cung_sach_hien_tai) {
                                hien_tai_moi_nhat.imgUrl = anh_uu_tien;
                                hien_tai_moi_nhat.duong_dan_anh = anh_uu_tien;
                            }
                        } else if (!anh_uu_tien) {
                            this.dat_anh_bia('icons/icon128.png');
                        }

                        if (quan_ly_thu_vien.danh_sach_doc && vi_tri !== -1) {
                            this.dat_trang_thai_luu(true);
                            let da_cap_nhat = false;
                            const truyen_hien_tai = danh_sach[vi_tri];
                            if (tac_gia_hien_co && truyen_hien_tai.author !== tac_gia_hien_co) {
                                truyen_hien_tai.author = tac_gia_hien_co;
                                da_cap_nhat = true;
                            } else if (!tac_gia_hien_co && truyen_hien_tai.author) {
                                this.cap_nhat_hien_thi_tac_gia(truyen_hien_tai.author);
                            }
                            const la_trang_gioi_thieu_luu = !ten_chuong || (duong_dan_trang && duong_dan_trang.split('/').filter(Boolean).length <= 4);
                            if (!la_trang_gioi_thieu_luu) {
                                if (duong_dan_trang && truyen_hien_tai.url !== duong_dan_trang) { truyen_hien_tai.url = duong_dan_trang; da_cap_nhat = true; }
                                if (ten_chuong && truyen_hien_tai.chap !== ten_chuong) { truyen_hien_tai.chap = ten_chuong; da_cap_nhat = true; }
                            }
                            const anh_moi_cap_nhat = anh_da_nhan || anh_cache_cuc_bo;
                            if (anh_moi_cap_nhat && truyen_hien_tai.imgUrl !== anh_moi_cap_nhat) {
                                let anh_an_toan = anh_moi_cap_nhat;
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
                                    hoan_tat();
                                });
                                return;
                            }
                        } else if (quan_ly_thu_vien.danh_sach_doc) {
                            this.dat_trang_thai_luu(false);
                        }
                    } catch (e) {
                        console.error('[DocTruyenSTV] Lỗi cập nhật thư viện:', e);
                    }
                    hoan_tat();
                });
            }));
        }
        
        this.cap_nhat_trang_thai_phat({
            isPlaying: thong_tin.isPlaying !== undefined ? thong_tin.isPlaying : thong_tin.dang_phat,
            isPaused: thong_tin.isPaused !== undefined ? thong_tin.isPaused : thong_tin.dang_tam_dung,
            isBuffering: thong_tin.isBuffering !== undefined ? thong_tin.isBuffering : thong_tin.dang_dem,
            engine: thong_tin.ttsEngine || thong_tin.engine || thong_tin.cong_cu,
            tam_du_phong_web: Boolean(thong_tin.tam_du_phong_web),
            elapsed: thong_tin.elapsed || thong_tin.thoi_gian_troi_qua || 0,
            progress: thong_tin.progress || thong_tin.tien_do
        });
    },

    // === Hiển thị tác giả, thống kê và nút Lưu ===

    lay_id_truyen_tu_thong_tin(thong_tin) {
        if (!thong_tin) return '';
        if (thong_tin.bookId || thong_tin.ma_truyen) return String(thong_tin.bookId || thong_tin.ma_truyen);
        const link = thong_tin.bookUrl || thong_tin.duong_dan_truyen || thong_tin.pageUrl || thong_tin.duong_dan_trang || '';
        if (!link) return '';
        try {
            const parts = new URL(link, 'https://sangtacviet.com').pathname.split('/').filter(Boolean);
            return (parts[0] === 'truyen' && parts.length >= 4) ? parts[3] : '';
        } catch (_) {
            return '';
        }
    },

    cap_nhat_hien_thi_thong_ke(thong_ke, co_chuong = false) {
        const khung_thong_ke = document.getElementById('book-stats');
        if (!khung_thong_ke) return;
        khung_thong_ke.innerHTML = '';
        if (!thong_ke || (!thong_ke.view && !thong_ke.like && !thong_ke.status)) {
            khung_thong_ke.style.display = 'none';
            khung_thong_ke.removeAttribute('title');
            return;
        }
        const tao_muc_thong_ke = (svg_html, gia_tri, mau = '') => {
            if (!gia_tri) return;
            const the_span = document.createElement('span');
            the_span.className = 'book-stat-item';
            if (mau) the_span.style.color = mau;
            the_span.innerHTML = svg_html;
            the_span.appendChild(document.createTextNode(gia_tri));
            khung_thong_ke.appendChild(the_span);
        };
        tao_muc_thong_ke(
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
            thong_ke.view
        );
        tao_muc_thong_ke(
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>',
            thong_ke.like
        );
        if (thong_ke.status) {
            const la_con_tiep = thong_ke.status === 'Còn tiếp';
            const la_tam_ngung = thong_ke.status === 'Tạm ngưng';
            let icon_trang_thai = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            let mau_trang_thai = 'var(--success)';
            if (la_con_tiep) {
                icon_trang_thai = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
                mau_trang_thai = 'var(--accent)';
            } else if (la_tam_ngung) {
                icon_trang_thai = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
                mau_trang_thai = 'var(--warning)';
            }
            tao_muc_thong_ke(icon_trang_thai, thong_ke.status, mau_trang_thai);
        }
        khung_thong_ke.style.display = khung_thong_ke.childNodes.length > 0 ? 'flex' : 'none';
        khung_thong_ke.title = co_chuong ? 'Thông tin truyện' : 'Thông tin truyện (chưa mở chương)';
    },

    cap_nhat_hien_thi_tac_gia(ten_tac_gia) {
        const the_tac_gia = document.getElementById('current-author');
        const the_chu_tac_gia = document.getElementById('current-author-text');
        if (!the_tac_gia || !the_chu_tac_gia) return;
        const sach = (ten_tac_gia || '').trim();
        if (sach) {
            the_chu_tac_gia.textContent = sach;
            the_tac_gia.title = `Tác giả: ${sach}`;
            the_tac_gia.style.display = 'flex';
        } else {
            the_chu_tac_gia.textContent = '';
            the_tac_gia.removeAttribute('title');
            the_tac_gia.style.display = 'none';
        }
    },

    dat_trang_thai_luu(da_luu) {
        const nut = document.getElementById('btn-save');
        if (!nut) return;
        nut.className = `btn-save${da_luu ? ' saved' : ''}`;
        nut.innerHTML = da_luu ? 
            `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                <path d="m9 10 2 2 4-4"></path>
            </svg><span>Đã lưu</span>` : 
            `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg><span>Lưu</span>`;
    },

    // === Sự kiện điều khiển phát và nhảy đoạn ===

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
        document.getElementById('btn-next')?.addEventListener('click', () => {
            this.gui_lenh('chuongTiep', {}, phan_hoi => {
                if (phan_hoi && phan_hoi.thongBao) hien_thong_bao(phan_hoi.thongBao, 'info');
            });
        });
        document.getElementById('btn-prev')?.addEventListener('click', () => {
            this.gui_lenh('chuongTruoc', {}, phan_hoi => {
                if (phan_hoi && phan_hoi.thongBao) hien_thong_bao(phan_hoi.thongBao, 'info');
            });
        });
        document.getElementById('btn-replay')?.addEventListener('click', () => this.gui_lenh('phatLai'));

        // Mở Lightbox xem ảnh bìa ngoài trang
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

                // Gửi lệnh mở Lightbox tới tab
                if (this.id_tab_hien_tai) {
                    const chu_de_hien_tai = document.documentElement.getAttribute('data-theme') || 'dark';
                    chrome.tabs.sendMessage(this.id_tab_hien_tai, {
                        hanhDong: 'moModalXemAnh',
                        duongDanAnh: duong_dan_anh,
                        tenTruyen: ten_truyen,
                        chuDe: chu_de_hien_tai
                    }, (phan_hoi) => {
                        if (chrome.runtime.lastError || !phan_hoi) {
                            // Mở tab mới nếu chưa tiêm script
                            window.open(duong_dan_anh, '_blank');
                        } else {
                            // Đóng popup để xem modal giữa trang
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

                thuc_thi_khoa_danh_sach_doc(() => new Promise(hoan_tat => {
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
                                    hoan_tat();
                                });
                                return;
                            } else {
                                let anh_an_toan = String((hien_tai.duong_dan_anh || hien_tai.imgUrl) || '').trim();
                                if (/^(?:data:|javascript:|blob:)/i.test(anh_an_toan)
                                    || /\/(?:favicon|default)\.[a-z0-9]+(?:[?#]|$)/i.test(anh_an_toan)
                                    || /icon128\.png/i.test(anh_an_toan)) {
                                    anh_an_toan = '';
                                }
                                if (anh_an_toan.toLowerCase().startsWith('http://')) anh_an_toan = 'https://' + anh_an_toan.substring(7);
                                const tien_do_chuan = hien_tai.absoluteProgress || hien_tai.progress || hien_tai.tien_do;
                                const chunk_so = (tien_do_chuan && (tien_do_chuan.current !== undefined ? tien_do_chuan.current : tien_do_chuan.hien_tai)) !== undefined
                                    ? (tien_do_chuan.current !== undefined ? tien_do_chuan.current : tien_do_chuan.hien_tai)
                                    : 0;
                                const chuong_luu = (hien_tai.ten_chuong || hien_tai.chapTitle || '').trim() || 'Chưa đọc';
                                danh_sach.push({
                                    title: ten_truyen,
                                    author: (hien_tai.author || hien_tai.tac_gia || '').trim(),
                                    url: hien_tai.duong_dan_trang || hien_tai.pageUrl || hien_tai.bookUrl || '',
                                    imgUrl: anh_an_toan,
                                    timestamp: Date.now(),
                                    savedAt: new Date().toLocaleDateString('vi-VN'),
                                    chap: chuong_luu,
                                    chunkIndex: chuong_luu === 'Chưa đọc' ? 0 : chunk_so
                                });
                                chrome.storage.local.set({ readingList: danh_sach }, () => {
                                    quan_ly_thu_vien.danh_sach_doc = danh_sach;
                                    quan_ly_thu_vien.hien_thi_danh_sach(quan_ly_thu_vien.sap_xep_danh_sach(danh_sach));
                                    quan_ly_thu_vien.cap_nhat_dung_luong();
                                    this.dat_trang_thai_luu(true);
                                    const the_dem_thong_tin = document.getElementById('info-count');
                                    if (the_dem_thong_tin) the_dem_thong_tin.textContent = `${danh_sach.length} truyện`;
                                    hien_thong_bao('Đã lưu truyện thành công!', 'success');
                                    hoan_tat();
                                });
                                return;
                            }
                        } catch (e) {
                            console.error('[DocTruyenSTV] Lỗi lưu truyện:', e);
                        }
                        hoan_tat();
                    });
                }));
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
                        const gia_tri_moi = hien_tai + 1;
                        the_nhap.value = gia_tri_moi;
                        const thanh_dien = document.getElementById('progress-bar-fill');
                        const the_phan_tram = document.getElementById('progress-percent');
                        if (thanh_dien && tong_so > 0) {
                            const ty_le = Math.min(1, Math.max(0, gia_tri_moi / tong_so));
                            thanh_dien.style.width = '100%';
                            thanh_dien.style.transformOrigin = 'left';
                            thanh_dien.style.transform = `scaleX(${ty_le})`;
                            if (the_phan_tram) the_phan_tram.textContent = Math.round(ty_le * 100) + '%';
                        }
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
                        const gia_tri_moi = hien_tai - 1;
                        the_nhap.value = gia_tri_moi;
                        const thanh_dien = document.getElementById('progress-bar-fill');
                        const the_phan_tram = document.getElementById('progress-percent');
                        if (thanh_dien && tong_so > 0) {
                            const ty_le = Math.min(1, Math.max(0, gia_tri_moi / tong_so));
                            thanh_dien.style.width = '100%';
                            thanh_dien.style.transformOrigin = 'left';
                            thanh_dien.style.transform = `scaleX(${ty_le})`;
                            if (the_phan_tram) the_phan_tram.textContent = Math.round(ty_le * 100) + '%';
                        }
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
