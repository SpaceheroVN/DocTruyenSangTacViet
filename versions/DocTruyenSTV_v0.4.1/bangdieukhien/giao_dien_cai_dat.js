import { cau_hinh } from './quan_ly_cau_hinh.js';
import { dieu_khien_trinh_phat } from './dieu_khien_trinh_phat.js';
import { hien_thong_bao, hien_xac_nhan } from './tien_ich.js';

export const giao_dien_cai_dat = {
    khoi_tao() {
        this.khoi_tao_cau_hinh_giao_dien();
        this.khoi_tao_tuy_chon();
        this.khoi_tao_tu_dong_dung();
        this.khoi_tao_dong_ho_tron();
        this.khoi_tao_tu_dien();
        this.gan_su_kien_cai_dat();
        this.gan_su_kien_phim_tat();
    },
    

    khoi_tao_cau_hinh_giao_dien() {
        const dien_gia_tri = (id, khoa, la_dong_bo = true, loai = 'value', mac_dinh = undefined) => {
            let gia_tri = cau_hinh.lay(khoa, la_dong_bo);
            if (gia_tri === undefined && mac_dinh !== undefined) gia_tri = mac_dinh;
            const phan_tu = document.getElementById(id);
            if (!phan_tu || gia_tri === undefined) return;
            if (loai === 'value') phan_tu.value = gia_tri;
            else if (loai === 'checked') phan_tu.checked = gia_tri;
        };

        dien_gia_tri('speed-slider', 'speed', true);
        dien_gia_tri('vol-slider', 'volume', true);
        dien_gia_tri('engine-select', 'maydoc', true);
        dien_gia_tri('voice-select', 'voiceIndex', true);
        dien_gia_tri('chk-autonext', 'tudongchuyenchuong', true, 'checked');
        dien_gia_tri('chk-shortcuts', 'batphimtat', true, 'checked');
        dien_gia_tri('chk-read-book', 'doctentruyen', true, 'checked');
        dien_gia_tri('chk-read-chap', 'doctenchuong', true, 'checked');
        dien_gia_tri('select-auto-fallback', 'thayNhanhWeb', true);
        dien_gia_tri('pause-comma', 'pauseComma', true, 'value', 300);
        dien_gia_tri('pause-dot', 'pauseDot', true, 'value', 800);
        dien_gia_tri('pause-para', 'pausePara', true, 'value', cau_hinh.lay('smartPauses', true) || 1200);

        const the_gia_tri_toc_do = document.getElementById('speed-val');
        const the_thanh_truot_toc_do = document.getElementById('speed-slider');
        if (the_gia_tri_toc_do && the_thanh_truot_toc_do) the_gia_tri_toc_do.textContent = the_thanh_truot_toc_do.value + 'x';

        const the_gia_tri_am_luong = document.getElementById('vol-val');
        const the_thanh_truot_am_luong = document.getElementById('vol-slider');
        if (the_gia_tri_am_luong && the_thanh_truot_am_luong) the_gia_tri_am_luong.textContent = Math.round(the_thanh_truot_am_luong.value * 100) + '%';
    },

    gan_su_kien_cai_dat() {
        const gan_dau_vao = (id, khoa, la_dong_bo = true, loai = 'value') => {
            const phan_tu = document.getElementById(id);
            if (!phan_tu) return;
            phan_tu.addEventListener('change', (e) => {
                let gia_tri = loai === 'checked' ? e.target.checked : (loai === 'number' ? parseFloat(e.target.value) : e.target.value);
                if (loai === 'number' && (isNaN(gia_tri) || gia_tri < 0)) { gia_tri = 0; e.target.value = 0; }
                cau_hinh.dat(khoa, gia_tri, la_dong_bo, true);
                dieu_khien_trinh_phat.gui_lenh('capNhatCaiDat', { [khoa]: gia_tri });
            });
        };

        const the_toc_do = document.getElementById('speed-slider');
        const the_am_luong = document.getElementById('vol-slider');

        if (the_toc_do) {
            the_toc_do.addEventListener('input', (e) => {
                document.getElementById('speed-val').textContent = e.target.value + 'x';
            });
            the_toc_do.addEventListener('change', (e) => {
                cau_hinh.dat('speed', parseFloat(e.target.value), true);
                dieu_khien_trinh_phat.gui_lenh('capNhatCaiDat', { speed: parseFloat(e.target.value) });
            });
        }

        if (the_am_luong) {
            the_am_luong.addEventListener('input', (e) => {
                document.getElementById('vol-val').textContent = Math.round(e.target.value * 100) + '%';
            });
            the_am_luong.addEventListener('change', (e) => {
                cau_hinh.dat('volume', parseFloat(e.target.value), true);
                dieu_khien_trinh_phat.gui_lenh('capNhatCaiDat', { volume: parseFloat(e.target.value) });
            });
        }

        const the_chon_giong = document.getElementById('voice-select');
        if (the_chon_giong) {
            the_chon_giong.addEventListener('change', (e) => {
                const chi_so = parseInt(e.target.value, 10);
                const tuy_chon_duoc_chon = e.target.options[e.target.selectedIndex];
                const chu_giong = tuy_chon_duoc_chon ? tuy_chon_duoc_chon.text : 'Mặc định';
                const ten_giong_day_du = tuy_chon_duoc_chon ? (tuy_chon_duoc_chon.getAttribute('data-voice-name') || chu_giong) : '';

                // Bảo vệ chống ghi đè: Tuyệt đối không bao giờ lưu giọng ngoại ngữ (David, Zira...)
                const ten_thuong = (ten_giong_day_du || chu_giong).toLowerCase();
                const la_giong_ngoai = ten_thuong.includes('david') || ten_thuong.includes('zira') || ten_thuong.includes('english');
                if (la_giong_ngoai) {
                    return; // Bỏ qua, giữ nguyên giọng tiếng Việt chuẩn
                }

                if (!isNaN(chi_so)) cau_hinh.dat('voiceIndex', chi_so, true, true);
                if (ten_giong_day_du) cau_hinh.dat('voiceName', ten_giong_day_du, true, true);

                const the_thong_tin = document.getElementById('info-voice');
                if (the_thong_tin) the_thong_tin.textContent = chu_giong;
                const van_ban_giong_tuy_chinh = document.getElementById('custom-voice-text');
                if (van_ban_giong_tuy_chinh) van_ban_giong_tuy_chinh.textContent = chu_giong;
                dieu_khien_trinh_phat.gui_lenh('doiGiongDoc', { voiceIndex: chi_so, voiceName: ten_giong_day_du });
            });
        }
        gan_dau_vao('chk-autonext', 'tudongchuyenchuong', true, 'checked');
        gan_dau_vao('chk-shortcuts', 'batphimtat', true, 'checked');
        gan_dau_vao('chk-read-book', 'doctentruyen', true, 'checked');
        gan_dau_vao('chk-read-chap', 'doctenchuong', true, 'checked');
        gan_dau_vao('select-auto-fallback', 'thayNhanhWeb', true);

        // Thiết lập các khoảng nghỉ dấu phẩy, dấu chấm và xuống dòng
        const thiet_lap_o_nghi = (ma_o, khoa_cau_hinh, kem_khoa_thong_minh = false) => {
            const the_nhap = document.getElementById(ma_o);
            if (!the_nhap) return;
            const gia_tri_nho_nhat = parseInt(the_nhap.getAttribute('min'), 10) || 0;
            const luu_gia_tri = (e) => {
                let gia_tri = parseFloat(the_nhap.value);
                if (isNaN(gia_tri) || gia_tri < gia_tri_nho_nhat) {
                    gia_tri = gia_tri_nho_nhat;
                    if (e && e.type === 'change') {
                        the_nhap.value = gia_tri_nho_nhat;
                        if (gia_tri_nho_nhat > 0) {
                            hien_thong_bao(`Khoảng nghỉ tối thiểu là ${gia_tri_nho_nhat}ms để chống nuốt đoạn trình duyệt`, 'warning');
                        }
                    }
                }
                cau_hinh.dat(khoa_cau_hinh, gia_tri, true, true);
                if (kem_khoa_thong_minh) {
                    cau_hinh.dat('smartPauses', gia_tri, true, true);
                    dieu_khien_trinh_phat.gui_lenh('capNhatCaiDat', { [khoa_cau_hinh]: gia_tri, smartPauses: gia_tri });
                } else {
                    dieu_khien_trinh_phat.gui_lenh('capNhatCaiDat', { [khoa_cau_hinh]: gia_tri });
                }
            };
            the_nhap.addEventListener('change', luu_gia_tri);
            the_nhap.addEventListener('input', luu_gia_tri);
        };
        thiet_lap_o_nghi('pause-comma', 'pauseComma');
        thiet_lap_o_nghi('pause-dot', 'pauseDot');
        thiet_lap_o_nghi('pause-para', 'pausePara', true);

        const the_chon_dong_co = document.getElementById('engine-select');

        if (the_chon_dong_co) {
            the_chon_dong_co.addEventListener('change', (e) => {
                const congcu = e.target.value;
                cau_hinh.dat('maydoc', congcu, true, true);
                const ds_dong_co = cau_hinh.lay('customEngines', false) || [];
                const dong_co_khop = ds_dong_co.find(d => d.id === congcu);
                if (dong_co_khop && dong_co_khop.isQuotaExceeded) {
                    dong_co_khop.isQuotaExceeded = false;
                    cau_hinh.dat('customEngines', ds_dong_co, false);
                }
                dieu_khien_trinh_phat.gui_lenh('capNhatCaiDat', { maydoc: congcu });
                dieu_khien_trinh_phat.cap_nhat_giao_dien_engine(congcu);

                const the_thanh_truot_am_luong = document.getElementById('vol-slider');
                if (thanh_truot_am_luong) {
                    const am_luong_toi_da = (congcu === 'web' || congcu === 'auto') ? 1.0 : 2.0;
                    thanh_truot_am_luong.max = am_luong_toi_da;
                    if (parseFloat(thanh_truot_am_luong.value) > am_luong_toi_da) {
                        thanh_truot_am_luong.value = am_luong_toi_da;
                        const the_gia_tri_am_luong = document.getElementById('vol-val');
                        if (gia_tri_am_luong) gia_tri_am_luong.textContent = Math.round(am_luong_toi_da * 100) + '%';
                        cau_hinh.dat('volume', am_luong_toi_da, true);
                        dieu_khien_trinh_phat.gui_lenh('capNhatCaiDat');
                    }
                }
            });
            setTimeout(() => {
                const gia_tri_may_doc = cau_hinh.lay('maydoc', true) || 'web';
                the_chon_dong_co.value = gia_tri_may_doc;
                dieu_khien_trinh_phat.cap_nhat_giao_dien_engine(gia_tri_may_doc);
            }, 100);
        }

        const nut_tat_tieng = document.getElementById('btn-mute');
        if (nut_tat_tieng && the_am_luong) {
            nut_tat_tieng.addEventListener('click', () => {
                if (parseFloat(the_am_luong.value) > 0) {
                    this.am_luong_truoc = parseFloat(the_am_luong.value);
                    the_am_luong.value = 0;
                } else {
                    the_am_luong.value = this.am_luong_truoc || 1;
                }
                the_am_luong.dispatchEvent(new Event('input'));
                the_am_luong.dispatchEvent(new Event('change'));
            });
        }

        document.querySelectorAll('.pause-step-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = document.getElementById(btn.dataset.target);
                if (!input) return;
                const delta = parseInt(btn.dataset.delta, 10);
                const gia_tri_nho_nhat = parseInt(input.getAttribute('min'), 10) || 0;
                const hien_tai = parseInt(input.value, 10) || 0;
                let tiep_theo;
                if (delta < 0) {
                    if (hien_tai <= gia_tri_nho_nhat) {
                        tiep_theo = gia_tri_nho_nhat;
                    } else if (hien_tai - 100 < gia_tri_nho_nhat) {
                        tiep_theo = gia_tri_nho_nhat;
                    } else {
                        tiep_theo = hien_tai + delta;
                    }
                } else {
                    if (hien_tai === gia_tri_nho_nhat && gia_tri_nho_nhat % 100 !== 0) {
                        tiep_theo = Math.ceil(gia_tri_nho_nhat / 100) * 100;
                    } else {
                        tiep_theo = hien_tai + delta;
                    }
                }
                input.value = Math.max(gia_tri_nho_nhat, tiep_theo);
                input.dispatchEvent(new Event('input'));
                input.dispatchEvent(new Event('change'));
            });
        });

        const nut_khoi_phuc_ngat_nghi = document.getElementById('btn-reset-pause-defaults');
        if (nut_khoi_phuc_ngat_nghi) {
            nut_khoi_phuc_ngat_nghi.addEventListener('click', () => {
                const mac_dinh = {
                    'pause-comma': 300,
                    'pause-dot': 800,
                    'pause-para': 1200
                };
                Object.entries(mac_dinh).forEach(([ma_o, gia_tri]) => {
                    const the_nhap = document.getElementById(ma_o);
                    if (the_nhap) {
                        the_nhap.value = gia_tri;
                        the_nhap.dispatchEvent(new Event('input'));
                        the_nhap.dispatchEvent(new Event('change'));
                    }
                });
                hien_thong_bao('Đã khôi phục khoảng nghỉ mặc định', 'success');
            });
        }

        const nut_ghi_chu = document.getElementById('btn-show-pause-note');
        const noi_dung_ghi_chu = document.getElementById('pause-note-content');
        if (nut_ghi_chu && noi_dung_ghi_chu) {
            nut_ghi_chu.addEventListener('click', (e) => {
                e.stopPropagation();
                const dang_an = noi_dung_ghi_chu.style.display === 'none';
                noi_dung_ghi_chu.style.display = dang_an ? 'block' : 'none';
                const ma_bieu_tuong = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
                nut_ghi_chu.innerHTML = dang_an ? `${ma_bieu_tuong} Ẩn lưu ý` : `${ma_bieu_tuong} Xem lưu ý`;
            });
        }
    },

    hien_thi_tu_dien() {
        const danh_sach_tu_dien = document.getElementById('dict-list');
        if (!danh_sach_tu_dien) return;
        const dict = cau_hinh.lay('customDict', false) || [];
        danh_sach_tu_dien.innerHTML = '';
        if (dict.length === 0) {
            danh_sach_tu_dien.innerHTML = '<div style="font-size: 11px; color: var(--text-muted); text-align: center; padding: 10px 0; font-style: italic;">Chưa có quy tắc nào</div>';
            return;
        }

        dict.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'dict-item-row';
            const esc = (s) => (s || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
            div.innerHTML = `
                <div style="flex: 1; min-width: 0; font-size: 11px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600;" title="${esc(item[0])}">${esc(item[0])}</div>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; opacity: 0.7;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                <div style="flex: 1; min-width: 0; font-size: 11px; color: var(--accent2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600;" title="${esc(item[1])}">${esc(item[1])}</div>
                <div style="width: 44px; display: flex; justify-content: flex-end; flex-shrink: 0;">
                    <button class="btn-ctrl btn-sm btn-del-dict" data-idx="${index}" title="Xóa quy tắc">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                </div>
            `;
            danh_sach_tu_dien.appendChild(div);
        });

        danh_sach_tu_dien.querySelectorAll('.btn-del-dict').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
                let currentDict = cau_hinh.lay('customDict', false) || [];
                currentDict.splice(idx, 1);
                cau_hinh.luu_tu_dien(currentDict);
                this.hien_thi_tu_dien();
                hien_thong_bao('Đã xóa quy tắc!', 'success');
            });
        });
    },

    khoi_tao_tu_dien() {
        this.hien_thi_tu_dien();
        const nut_them_tu_dien = document.getElementById('btn-add-dict');
        if (nut_them_tu_dien) {
            nut_them_tu_dien.addEventListener('click', () => {
                const o_tu_goc = document.getElementById('dict-origin');
                const o_tu_thay_the = document.getElementById('dict-replace');
                if (!o_tu_goc || !o_tu_thay_the) return;
                const origin = o_tu_goc.value.trim();
                const replace = o_tu_thay_the.value.trim();
                if (!origin) {
                    hien_thong_bao('Vui lòng nhập từ lỗi cần sửa!', 'warning');
                    return;
                }
                let dict = cau_hinh.lay('customDict', false) || [];
                const idx = dict.findIndex(item => item[0].toLowerCase() === origin.toLowerCase());
                if (idx !== -1) dict[idx][1] = replace;
                else dict.push([origin, replace]);

                cau_hinh.luu_tu_dien(dict);
                o_tu_goc.value = '';
                o_tu_thay_the.value = '';
                this.hien_thi_tu_dien();
                hien_thong_bao('Đã lưu quy tắc thành công!', 'success');
            });
        }
    },

    khoi_tao_tuy_chon() {
        document.addEventListener('click', (e) => {
            const trong_vung = e.target.closest('.custom-select-container');
            if (!trong_vung) {
                document.querySelectorAll('.custom-select-dropdown').forEach(d => d.classList.remove('show'));
                return;
            }
            const nut_bam = e.target.closest('.custom-select-trigger');
            if (nut_bam) {
                const hop_chua = nut_bam.closest('.custom-select-container');
                const danh_sach = hop_chua.querySelector('.custom-select-dropdown');
                document.querySelectorAll('.custom-select-dropdown').forEach(d => {
                    if (d !== danh_sach) d.classList.remove('show');
                });
                if (danh_sach) danh_sach.classList.toggle('show');
            }
        });

        this.cai_dat_o_chon_tinh('custom-left-type', 'text-left-type', 'dropdown-left-type');
        this.cai_dat_o_chon_tinh('custom-right-type', 'text-right-type', 'dropdown-right-type');
        this.cai_dat_o_chon_tinh('custom-operator', 'text-operator', 'dropdown-operator');

        const the_chon_dong_co = document.getElementById('engine-select');
        if (the_chon_dong_co) {
            the_chon_dong_co.addEventListener('change', () => this.hien_thi_danh_sach_dong_co());
            the_chon_dong_co._cap_nhat_giao_dien = () => this.hien_thi_danh_sach_dong_co();
        }
        this.hien_thi_danh_sach_dong_co();
        this.cai_dat_o_chon_tinh('select-auto-stop', 'custom-autostop-text', 'custom-autostop-dropdown', true);
        this.cai_dat_o_chon_tinh('voice-select', 'custom-voice-text', 'custom-voice-dropdown', true);
        const the_phan_doan_du_phong = document.getElementById('fallback-seg');
        const the_chon_du_phong = document.getElementById('select-auto-fallback');
        if (the_phan_doan_du_phong && the_chon_du_phong) {
            const cap_nhat_phan_doan = () => {
                const val = the_chon_du_phong.value;
                the_phan_doan_du_phong.setAttribute('data-val', val);
                the_phan_doan_du_phong.querySelectorAll('.seg-item').forEach(item => {
                    if (item.dataset.val === val) item.classList.add('active');
                    else item.classList.remove('active');
                });
            };
            the_chon_du_phong.addEventListener('change', cap_nhat_phan_doan);
            the_chon_du_phong._cap_nhat_giao_dien = cap_nhat_phan_doan;
            
            the_phan_doan_du_phong.querySelectorAll('.seg-item').forEach(item => {
                item.addEventListener('click', () => {
                    the_chon_du_phong.value = item.dataset.val;
                    the_chon_du_phong.dispatchEvent(new Event('change'));
                });
            });
            setTimeout(cap_nhat_phan_doan, 50);
        }
        
        const btnDeleteEngine = document.getElementById('btn-delete-engine');
        if (btnDeleteEngine) {
            btnDeleteEngine.addEventListener('click', () => this.xoa_dong_co_hien_tai());
        }
    },

    cai_dat_o_chon_tinh(id_chon_goc, id_van_ban, id_khung_chon, them_id_van_ban = false) {
        const o_chon_goc = document.getElementById(id_chon_goc);
        const khung_chon = document.getElementById(id_khung_chon);
        let van_ban_hien_thi = document.getElementById(id_van_ban);

        if (them_id_van_ban && !van_ban_hien_thi && o_chon_goc && khung_chon) {
            const hop_chua = khung_chon.closest('.custom-select-container');
            if (hop_chua) {
                const trigger = hop_chua.querySelector('.custom-select-trigger');
                if (trigger) {
                    if (trigger.querySelector('span')) van_ban_hien_thi = trigger.querySelector('span');
                    else {
                        trigger.innerHTML = `<span id="${id_van_ban}"></span>`;
                        van_ban_hien_thi = document.getElementById(id_van_ban);
                    }
                }
            }
        }

        if (!o_chon_goc || !khung_chon || !van_ban_hien_thi) return;

        const capNhat = () => {
            khung_chon.innerHTML = '';
            const lua_chon_da_chon = o_chon_goc.options[o_chon_goc.selectedIndex];
            if (lua_chon_da_chon) van_ban_hien_thi.textContent = lua_chon_da_chon.textContent;

            Array.from(o_chon_goc.children).forEach(con => {
                if (con.tagName === 'OPTGROUP') {
                    const nhom = document.createElement('div');
                    nhom.className = 'custom-optgroup';
                    nhom.textContent = con.label;
                    khung_chon.appendChild(nhom);
                    Array.from(con.children).forEach(opt => {
                        khung_chon.appendChild(this.tao_muc(opt, true, o_chon_goc, khung_chon));
                    });
                } else if (con.tagName === 'OPTION') {
                    khung_chon.appendChild(this.tao_muc(con, false, o_chon_goc, khung_chon));
                }
            });
        };

        o_chon_goc.addEventListener('change', capNhat);
        o_chon_goc._cap_nhat_giao_dien = capNhat;
        capNhat();
    },

    tao_muc(opt, co_thut_le, o_chon_goc, khung_chon) {
        const muc = document.createElement('div');
        muc.className = 'custom-option';
        if (co_thut_le) muc.style.paddingLeft = '24px';
        if (opt.selected) muc.classList.add('selected');
        if (opt.disabled) muc.classList.add('disabled');
        muc.textContent = opt.textContent;
        muc.addEventListener('click', (e) => {
            e.stopPropagation();
            if (opt.disabled) return;
            o_chon_goc.value = opt.value;
            o_chon_goc.dispatchEvent(new Event('change'));
            khung_chon.classList.remove('show');
        });
        return muc;
    },

    cap_nhat_giao_dien(id_chon_goc) {
        const o_chon_goc = document.getElementById(id_chon_goc);
        if (o_chon_goc && typeof o_chon_goc._cap_nhat_giao_dien === 'function') {
            o_chon_goc._cap_nhat_giao_dien();
        }
    },

    hien_thi_danh_sach_dong_co() {
        const the_chon_dong_co = document.getElementById('engine-select');
        const khung_chon = document.getElementById('custom-engine-dropdown');
        let van_ban_hien_thi = document.getElementById('custom-engine-text');

        if (!the_chon_dong_co || !khung_chon) return;

        if (!van_ban_hien_thi) {
            const hop_chua = khung_chon.closest('.custom-select-container');
            if (hop_chua) {
                const trigger = hop_chua.querySelector('.custom-select-trigger');
                if (trigger) {
                    if (trigger.querySelector('span')) van_ban_hien_thi = trigger.querySelector('span');
                    else {
                        trigger.innerHTML = `<span id="custom-engine-text"></span>`;
                        van_ban_hien_thi = document.getElementById('custom-engine-text');
                    }
                }
            }
        }

        khung_chon.innerHTML = '';
        
        const customEngines = cau_hinh.lay('customEngines', false) || [];
        customEngines.forEach(engine => {
            if (!Array.from(the_chon_dong_co.options).find(o => o.value === engine.id)) {
                const opt = document.createElement('option');
                opt.value = engine.id;
                opt.textContent = engine.isQuotaExceeded ? `${engine.name} - Đã hết` : engine.name;
                the_chon_dong_co.appendChild(opt);
            }
        });

        const lua_chon_da_chon = the_chon_dong_co.options[the_chon_dong_co.selectedIndex];
        if (lua_chon_da_chon && van_ban_hien_thi) van_ban_hien_thi.textContent = lua_chon_da_chon.textContent;

        const btnDelete = document.getElementById('btn-delete-engine');
        if (btnDelete) {
            btnDelete.style.display = (the_chon_dong_co.value && the_chon_dong_co.value !== 'web') ? 'flex' : 'none';
        }

        Array.from(the_chon_dong_co.children).forEach(con => {
            if (con.tagName === 'OPTGROUP') {
                const nhom = document.createElement('div');
                nhom.className = 'custom-optgroup';
                nhom.textContent = con.label;
                khung_chon.appendChild(nhom);
                Array.from(con.children).forEach(opt => {
                    khung_chon.appendChild(this.tao_muc(opt, true, the_chon_dong_co, khung_chon));
                });
            } else if (con.tagName === 'OPTION' && !con.value.startsWith('khac_')) {
                khung_chon.appendChild(this.tao_muc(con, false, the_chon_dong_co, khung_chon));
            }
        });

        const trueCustomEngines = customEngines.filter(e => e.id.startsWith('khac_'));
        if (trueCustomEngines.length > 0) {
            const nhomCustom = document.createElement('div');
            nhomCustom.className = 'custom-optgroup';
            nhomCustom.textContent = 'Nguồn đọc khác';
            khung_chon.appendChild(nhomCustom);

            trueCustomEngines.forEach(engine => {
                const opt = Array.from(the_chon_dong_co.options).find(o => o.value === engine.id);
                if (opt) khung_chon.appendChild(this.tao_muc(opt, true, the_chon_dong_co, khung_chon));
            });
        }

        const btnAdd = document.createElement('div');
        btnAdd.className = 'custom-option';
        btnAdd.style.color = 'var(--accent)';
        btnAdd.style.fontWeight = 'bold';
        btnAdd.style.textAlign = 'center';
        btnAdd.style.marginTop = '6px';
        btnAdd.style.paddingTop = '10px';
        btnAdd.style.borderTop = '1px solid rgba(232, 160, 69, 0.2)';
        btnAdd.style.display = 'flex';
        btnAdd.style.alignItems = 'center';
        btnAdd.style.justifyContent = 'center';
        btnAdd.style.gap = '6px';
        btnAdd.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Thêm Nguồn Đọc Mới';
        btnAdd.addEventListener('click', (e) => {
            e.stopPropagation();
            khung_chon.classList.remove('show');
            this.hien_bang_them_dong_co();
        });
        khung_chon.appendChild(btnAdd);
    },

    hien_bang_them_dong_co() {
        let panel = document.getElementById('modal-add-engine');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'modal-add-engine';
            panel.className = 'modal-overlay';
            panel.innerHTML = `
                <div class="modal">
                    <div class="modal-title" style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Thêm Nguồn Đọc API</span>
                        <a href="huong_dan.html" target="_blank" title="Xem Hướng dẫn cấu hình API" style="color: var(--accent); opacity: 0.8; transition: opacity 0.2s; display: flex; align-items: center;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.8">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        </a>
                    </div>
                    <div class="modal-body" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                        <div id="ce-type-container" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 4px; scroll-behavior: smooth;">
                            <style>
                                #ce-type-container::-webkit-scrollbar { height: 4px; }
                                #ce-type-container::-webkit-scrollbar-track { background: var(--surface); border-radius: 4px; }
                                #ce-type-container::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
                                #ce-type-container::-webkit-scrollbar-thumb:hover { background: var(--accent); }
                                .ce-type-btn { flex: 0 0 auto; padding: 6px 14px; font-size: 11px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface2); color: var(--text); cursor: pointer; white-space: nowrap; transition: all 0.2s; }
                                .ce-type-btn:hover:not(.active) { border-color: var(--accent); color: var(--accent); }
                                #ce-btn-save:hover { background: var(--accent) !important; color: #ffffff !important; }
                                .ce-input { width: 100%; padding: 8px 12px; font-size: 11px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text); outline: none; transition: all 0.2s; box-sizing: border-box; }
                                input.ce-input { text-overflow: ellipsis; }
                                .ce-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(232, 160, 69, 0.2); text-overflow: clip; }
                                input[type="password"]::-ms-reveal, input[type="password"]::-ms-clear { display: none !important; }
                            </style>
                            <div class="ce-type-btn active" data-type="fpt" style="border-color: var(--accent); background: rgba(232, 160, 69, 0.1); color: var(--accent);">FPT.AI TTS</div>
                            <div class="ce-type-btn" data-type="azure">Microsoft Azure</div>
                            <div class="ce-type-btn" data-type="gcp">Google Cloud</div>
                            <div class="ce-type-btn" data-type="custom">Khác</div>
                        </div>
                        <input type="hidden" id="ce-type" value="fpt">
                        <input type="text" id="ce-name" class="ce-input" placeholder="Tên Nguồn (VD: Zalo TTS)" title="Tên Nguồn (VD: Zalo TTS)">
                        
                        <!-- Dành cho Custom -->
                        <div id="ce-custom-fields" style="display: flex; flex-direction: column; gap: 8px;">
                            <input type="text" id="ce-url" class="ce-input" placeholder="API URL" title="API URL">
                            <div class="custom-select-container" style="width: 100%;">
                                <select id="ce-method" style="display: none;">
                                    <option value="POST">POST</option>
                                    <option value="GET">GET</option>
                                </select>
                                <div class="custom-select-trigger ce-input" style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; margin: 0;">
                                    <span id="ce-method-text">POST</span>
                                    <div class="arrow"></div>
                                </div>
                                <div class="custom-select-dropdown" id="ce-method-dropdown" style="width: 100%;"></div>
                            </div>
                            <textarea id="ce-headers" class="ce-input" placeholder="Headers JSON" title='Ví dụ: {"Authorization": "Bearer XXX"}' style="height: 34px; min-height: 34px; resize: none; font-family: monospace; overflow: hidden;"></textarea>
                            <textarea id="ce-body" class="ce-input" placeholder="Body Template" title='Ví dụ: {"text": "{{van_ban}}"}' style="height: 34px; min-height: 34px; resize: none; font-family: monospace; overflow: hidden;"></textarea>
                            <input type="text" id="ce-audiopath" class="ce-input" placeholder="Audio Path (Để trống = Blob)" title="Đường dẫn đến file Audio trong JSON trả về (VD: data.audioUrl). Để trống nếu API trả trực tiếp file Blob.">
                        </div>
                        
                        <!-- Dành cho Premium API -->
                        <div id="ce-premium-fields" style="display: none; flex-direction: column; gap: 8px;">
                            <div style="position: relative; width: 100%;">
                                <input type="password" id="ce-api-key" class="ce-input" placeholder="Nhập API Key vào đây..." title="Nhập API Key vào đây..." style="width: 100%; padding-right: 32px;">
                                <div id="ce-toggle-key-visibility" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center;" title="Hiện/Ẩn API Key">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                </div>
                            </div>
                            <input type="text" id="ce-api-region" class="ce-input" placeholder="Azure Region (VD: southeastasia)" title="Azure Region (VD: southeastasia)" style="display: none;">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="ce-btn-cancel" class="btn-ctrl btn-sm" style="flex: 1; height: 28px; font-size: 11px;">Hủy</button>
                        <button id="ce-btn-save" class="btn-ctrl btn-sm" style="flex: 1; height: 28px; font-size: 11px; color: var(--accent); border-color: var(--accent);">Thêm</button>
                    </div>
                </div>
            `;
            document.body.appendChild(panel);
            
            const toggleKey = document.getElementById('ce-toggle-key-visibility');
            const keyInputEl = document.getElementById('ce-api-key');
            if (toggleKey && keyInputEl) {
                toggleKey.addEventListener('click', () => {
                    const t = keyInputEl.getAttribute('type') === 'password' ? 'text' : 'password';
                    keyInputEl.setAttribute('type', t);
                    if (t === 'text') {
                        toggleKey.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
                    } else {
                        toggleKey.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
                    }
                });
            }

            this.cai_dat_o_chon_tinh('ce-method', 'ce-method-text', 'ce-method-dropdown');
            
            ['ce-headers', 'ce-body'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.addEventListener('input', function() {
                        this.style.height = '34px';
                        this.style.height = (this.scrollHeight + 2) + 'px';
                    });
                }
            });
            
            const khung_chua_loai = document.getElementById('ce-type-container');
            if (khung_chua_loai) {
                khung_chua_loai.addEventListener('wheel', (e) => {
                    if (e.deltaY !== 0) {
                        e.preventDefault();
                        khung_chua_loai.scrollLeft += e.deltaY;
                    }
                });
            }

            const cac_nut_loai = panel.querySelectorAll('.ce-type-btn');
            const loai_an = document.getElementById('ce-type');
            
            const cap_nhat_chon_loai = (type) => {
                loai_an.value = type;
                
                cac_nut_loai.forEach(btn => {
                    if (btn.dataset.type === type) {
                        btn.classList.add('active');
                        btn.style.borderColor = 'var(--accent)';
                        btn.style.background = 'rgba(232, 160, 69, 0.1)';
                        btn.style.color = 'var(--accent)';
                        try {
                            const container = document.getElementById('ce-type-container');
                            const vi_tri_trai_tuong_doi = btn.getBoundingClientRect().left - container.getBoundingClientRect().left + container.scrollLeft;
                            const vi_tri_cuon = vi_tri_trai_tuong_doi - (container.clientWidth / 2) + (btn.clientWidth / 2);
                            const start = container.scrollLeft;
                            const change = vi_tri_cuon - start;
                            const duration = 250;
                            let thoi_gian_bat_dau = null;
                            const cuon_chuyen_dong = (currentTime) => {
                                if (!thoi_gian_bat_dau) thoi_gian_bat_dau = currentTime;
                                const thoi_gian_da_qua = currentTime - thoi_gian_bat_dau;
                                const progress = Math.min(thoi_gian_da_qua / duration, 1);
                                const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                                container.scrollLeft = start + change * ease;
                                if (thoi_gian_da_qua < duration) requestAnimationFrame(cuon_chuyen_dong);
                            };
                            requestAnimationFrame(cuon_chuyen_dong);
                        } catch(e) {}
                    } else {
                        btn.classList.remove('active');
                        btn.style.borderColor = 'var(--border)';
                        btn.style.background = 'var(--surface2)';
                        btn.style.color = 'var(--text)';
                    }
                });

                const cac_truong_tuy_chinh = document.getElementById('ce-custom-fields');
                const cac_truong_cao_cap = document.getElementById('ce-premium-fields');
                const o_nhap_ten = document.getElementById('ce-name');
                const o_nhap_khu_vuc = document.getElementById('ce-api-region');
                const o_nhap_khoa = document.getElementById('ce-api-key');
                
                if (type === 'custom') {
                    cac_truong_tuy_chinh.style.display = 'flex';
                    cac_truong_cao_cap.style.display = 'none';
                    o_nhap_ten.value = '';
                } else {
                    cac_truong_tuy_chinh.style.display = 'none';
                    cac_truong_cao_cap.style.display = 'flex';
                    if (type === 'fpt') { o_nhap_ten.value = 'FPT.AI TTS'; o_nhap_khoa.placeholder = 'Nhập FPT API Key...'; o_nhap_khoa.value = ''; }
                    if (type === 'azure') { o_nhap_ten.value = 'Microsoft Azure TTS'; o_nhap_khoa.placeholder = 'Nhập Azure Subscription Key...'; o_nhap_khoa.value = ''; }
                    if (type === 'gcp') { o_nhap_ten.value = 'Google Cloud TTS'; o_nhap_khoa.placeholder = 'Nhập Google Cloud API Key...'; o_nhap_khoa.value = ''; }
                    o_nhap_khu_vuc.style.display = type === 'azure' ? 'block' : 'none';
                    if (type === 'azure') o_nhap_khu_vuc.value = '';
                }
            };

            cac_nut_loai.forEach(btn => {
                btn.addEventListener('click', () => cap_nhat_chon_loai(btn.dataset.type));
            });

            loai_an.addEventListener('change', () => cap_nhat_chon_loai(loai_an.value));
            
            document.getElementById('ce-btn-cancel').addEventListener('click', () => panel.classList.remove('show'));
            document.getElementById('ce-btn-save').addEventListener('click', () => this.xac_nhan_them_dong_co());
        }
        document.getElementById('ce-api-key').value = '';
        document.getElementById('ce-api-region').value = '';
        document.getElementById('ce-url').value = '';
        document.getElementById('ce-headers').value = '';
        document.getElementById('ce-body').value = '';
        document.getElementById('ce-audiopath').value = '';

        panel.classList.add('show');
        document.getElementById('ce-type').value = 'fpt';
        document.getElementById('ce-type').dispatchEvent(new Event('change'));
        document.getElementById('ce-api-key').focus();
    },

    async xac_nhan_them_dong_co() {
        const type = document.getElementById('ce-type').value;
        const name = document.getElementById('ce-name').value.trim();
        const customEngines = cau_hinh.lay('customEngines', false) || [];
        const nut_luu = document.getElementById('ce-btn-save');
        
        let id_dong_co = '';

        if (!name) {
            hien_thong_bao('Vui lòng nhập Tên nguồn đọc', 'warning');
            return;
        }

        if (customEngines.find(e => e.name.toLowerCase() === name.toLowerCase() && e.id !== type)) {
            hien_thong_bao('Tên nguồn đọc đã tồn tại', 'warning');
            return;
        }

        if (type === 'custom') {
            const url = document.getElementById('ce-url').value.trim();
            const method = document.getElementById('ce-method').value;
            const headers = document.getElementById('ce-headers').value.trim();
            const mau_noi_dung = document.getElementById('ce-body').value.trim();
            const duong_dan_am_thanh = document.getElementById('ce-audiopath').value.trim();

            if (!url) {
                hien_thong_bao('Vui lòng nhập URL', 'warning');
                return;
            }

            if (headers) {
                try { JSON.parse(headers); } catch (e) {
                    hien_thong_bao('Headers phải là JSON hợp lệ', 'warning');
                    return;
                }
            }

            id_dong_co = 'khac_' + Date.now().toString();
            const engine = {
                id: id_dong_co,
                name, url, method, headers, mau_noi_dung, duong_dan_am_thanh, type: 'custom'
            };
            customEngines.push(engine);
        } else {
            const key = document.getElementById('ce-api-key').value.trim();
            if (!key) {
                hien_thong_bao('Vui lòng nhập API Key', 'warning');
                return;
            }
            
            const region = type === 'azure' ? (document.getElementById('ce-api-region').value.trim() || 'southeastasia') : '';
            
            nut_luu.disabled = true;
            nut_luu.textContent = 'Đang kiểm tra...';
            try {
                let hop_le = false;
                if (type === 'fpt') {
                    const res = await fetch('https://api.fpt.ai/hmi/tts/v5', {
                        method: 'POST',
                        headers: { 'api-key': key, 'voice': 'banmai', 'speed': '0' },
                        body: 'kiểm tra'
                    });
                    const duLieu = await res.json().catch(() => null);
                    if (res.ok && duLieu && !duLieu.error) hop_le = true;
                } else if (type === 'azure') {
                    const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
                        method: 'POST',
                        headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3' },
                        body: `<speak version='1.0' xml:lang='vi-VN'><voice name='vi-VN-HoaiMyNeural'><prosody rate='1'>kiểm tra</prosody></voice></speak>`
                    });
                    if (res.ok) hop_le = true;
                } else if (type === 'gcp') {
                    const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key },
                        body: JSON.stringify({ input: { text: "kiểm tra" }, voice: { languageCode: 'vi-VN', name: 'vi-VN-Wavenet-A' }, audioConfig: { audioEncoding: 'MP3', speakingRate: 1 } })
                    });
                    if (res.ok) hop_le = true;
                }

                if (!hop_le) {
                    hien_thong_bao('API Key không hợp lệ hoặc đã hết hạn ngạch', 'warning');
                    nut_luu.disabled = false;
                    nut_luu.textContent = 'Thêm';
                    return;
                }
            } catch(e) {
                hien_thong_bao('Lỗi kết nối kiểm tra API Key', 'warning');
                nut_luu.disabled = false;
                nut_luu.textContent = 'Thêm';
                return;
            }
            
            nut_luu.disabled = false;
            nut_luu.textContent = 'Thêm';
            
            id_dong_co = type + '_' + Date.now().toString();
            const engine = { id: id_dong_co, name, type, apiKey: key };

            if (type === 'azure') {
                engine.region = region;
            }
            
            customEngines.push(engine);
        }

        cau_hinh.dat('customEngines', customEngines, false);

        document.getElementById('modal-add-engine').classList.remove('show');
        
        this.hien_thi_danh_sach_dong_co();
        
        const the_chon_dong_co = document.getElementById('engine-select');
        the_chon_dong_co.value = id_dong_co;
        the_chon_dong_co.dispatchEvent(new Event('change'));
        
        hien_thong_bao('Đã thêm nguồn đọc mới', 'success');
    },

    xoa_dong_co_hien_tai() {
        const the_chon_dong_co = document.getElementById('engine-select');
        const idXoa = the_chon_dong_co.value;
        if (!idXoa || idXoa === 'web') return;

        hien_xac_nhan('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa nguồn đọc này không?', () => {
            let customEngines = cau_hinh.lay('customEngines', false) || [];
            customEngines = customEngines.filter(e => e.id !== idXoa);
            cau_hinh.dat('customEngines', customEngines, false);

            if (idXoa.startsWith('fpt_')) cau_hinh.dat('fpt_key', '', false);
            else if (idXoa.startsWith('azure_')) { cau_hinh.dat('azure_key', '', false); cau_hinh.dat('azure_region', '', false); }
            else if (idXoa.startsWith('gcp_')) cau_hinh.dat('gcp_key', '', false);

            const optNode = Array.from(the_chon_dong_co.options).find(o => o.value === idXoa);
            if (optNode) optNode.remove();

            the_chon_dong_co.value = 'web';
            the_chon_dong_co.dispatchEvent(new Event('change'));
            hien_thong_bao('Đã xóa nguồn đọc', 'success');
        });
    },

    khoi_tao_tu_dong_dung() {
        this.gio_val_vt = 0;
        this.phut_val_vt = 0;
        this.la_dau_cong = true;
        this.bo_qua_thong_bao = false;

        this.gan_su_kien_am_pm();
        this.gan_su_kien_menu_auto_stop();
        this.gan_su_kien_cac_nut_ap_dung();
        this.gan_su_kien_phim_nhanh();

        const nutDauHieu = document.getElementById('btn-toggle-sign');
        if (nutDauHieu) {
            nutDauHieu.addEventListener('click', () => {
                this.la_dau_cong = !this.la_dau_cong;
                nutDauHieu.textContent = this.la_dau_cong ? '+' : '-';
                nutDauHieu.style.color = this.la_dau_cong ? 'var(--accent)' : 'var(--danger)';
                nutDauHieu.style.borderColor = this.la_dau_cong ? 'var(--accent)' : 'var(--danger)';
            });
        }

        this.tao_input_dieu_kien('custom-left-input', '');
        this.tao_input_dieu_kien('custom-right-input', '');

        this.tai_lai_du_lieu_tu_dong_dung();
    },

    tai_lai_du_lieu_may_doc() {
        const the_chon_dong_co = document.getElementById('engine-select');
        if (the_chon_dong_co) {
            the_chon_dong_co.value = cau_hinh.lay('maydoc', true) || 'web';
            the_chon_dong_co.dispatchEvent(new Event('change'));

            const customText = document.getElementById('custom-engine-text');
            if (customText) {
                const opt = the_chon_dong_co.options[the_chon_dong_co.selectedIndex];
                if (opt) customText.textContent = opt.text;
            }
        }
    },

    tai_lai_du_lieu_tu_dong_dung() {
        chrome.storage.local.get(['stopTime', 'stopRealtimeTarget', 'stopAfterChapters', 'customStopConfig'], data => {
            const selectAutoStop = document.getElementById('select-auto-stop');
            if (!selectAutoStop) return;

            if (data.stopRealtimeTarget) selectAutoStop.value = 'realtime';
            else if (data.stopAfterChapters) selectAutoStop.value = 'chapters';
            else if (data.customStopConfig) selectAutoStop.value = 'custom';
            else if (data.stopTime) selectAutoStop.value = 'time';
            else selectAutoStop.value = 'off';

            this.cap_nhat_giao_dien('select-auto-stop');

            this.bo_qua_thong_bao = true;
            selectAutoStop.dispatchEvent(new Event('change'));
            this.bo_qua_thong_bao = false;
        });
    },

    cap_nhat_gia_tri_vt(kieu, gt) {
        if (kieu === 'hour') this.gio_val_vt = Math.min(23, Math.max(0, gt));
        if (kieu === 'minute') this.phut_val_vt = Math.min(59, Math.max(0, gt));

        const nut_gio = document.getElementById('hour-handle');
        const nut_phut = document.getElementById('minute-handle');
        const so_gio = document.getElementById('digit-hours');
        const so_phut = document.getElementById('digit-minutes');
        const tien_trinh_gio = document.getElementById('hour-progress');
        const tien_trinh_phut = document.getElementById('minute-progress');
        if (!nut_gio || !nut_phut) return;
        // Bán kính: giờ ở trong (58px), phút ở ngoài (92px)
        const CENTER = 120, ban_kinh_gio = 58, ban_kinh_phut = 92;

        function dat_vi_tri(handle, ban_kinh, deg) {
            const rad = (deg - 90) * (Math.PI / 180);
            handle.setAttribute('cx', CENTER + ban_kinh * Math.cos(rad));
            handle.setAttribute('cy', CENTER + ban_kinh * Math.sin(rad));
        }
        function dat_tien_trinh(progress, ban_kinh, deg) {
            const c = 2 * Math.PI * ban_kinh;
            progress.style.strokeDasharray = `${c * (deg / 360)}, ${c}`;
        }

        const lay_12_gio = (h24) => { const h = h24 % 12; return h === 0 ? 12 : h; };

        if (kieu === 'hour') {
            if (so_gio) {
                const hienthi = lay_12_gio(this.gio_val_vt);
                so_gio.textContent = String(hienthi).padStart(2, '0');
            }
            const deg = (360 / 12) * (lay_12_gio(this.gio_val_vt) % 12);
            dat_vi_tri(nut_gio, ban_kinh_gio, deg);
            dat_tien_trinh(tien_trinh_gio, ban_kinh_gio, deg);
        } else {
            if (so_phut) so_phut.textContent = String(this.phut_val_vt).padStart(2, '0');
            const deg = (360 / 60) * this.phut_val_vt;
            dat_vi_tri(nut_phut, ban_kinh_phut, deg);
            dat_tien_trinh(tien_trinh_phut, ban_kinh_phut, deg);
        }

        const ampm = this.gio_val_vt >= 12 ? 'CH' : 'SA';
        const chu_ampm = document.getElementById('ampm-text');
        if (chu_ampm) chu_ampm.textContent = ampm;
        document.querySelectorAll('#ampm-dropdown .custom-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.val === ampm);
        });
    },

    khoi_tao_dong_ho_tron() {
        const nut_gio = document.getElementById('hour-handle');
        const nut_phut = document.getElementById('minute-handle');
        if (!nut_gio || !nut_phut) return;

        const CENTER = 120, ban_kinh_gio = 58, ban_kinh_phut = 92;

        // Vạch chia giờ (12 mốc bên trong)
        const nhom_gio = document.getElementById('hour-ticks');
        if (nhom_gio) {
            nhom_gio.innerHTML = '';
            for (let i = 0; i < 12; i++) {
                const deg = i * 30 - 90, rad = deg * Math.PI / 180;
                const outer = ban_kinh_gio + 5, inner = ban_kinh_gio - 5;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', CENTER + outer * Math.cos(rad));
                line.setAttribute('y1', CENTER + outer * Math.sin(rad));
                line.setAttribute('x2', CENTER + inner * Math.cos(rad));
                line.setAttribute('y2', CENTER + inner * Math.sin(rad));
                line.setAttribute('class', 'tick-mark hour-tick');
                nhom_gio.appendChild(line);
            }
        }

        // Vạch chia phút (60 mốc bên ngoài)
        const nhom_phut = document.getElementById('minute-ticks');
        if (nhom_phut) {
            nhom_phut.innerHTML = '';
            for (let i = 0; i < 60; i++) {
                const deg = i * 6 - 90, rad = deg * Math.PI / 180;
                const lon = i % 5 === 0;
                const outer = ban_kinh_phut + (lon ? 6 : 3), inner = ban_kinh_phut - (lon ? 6 : 3);
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', CENTER + outer * Math.cos(rad));
                line.setAttribute('y1', CENTER + outer * Math.sin(rad));
                line.setAttribute('x2', CENTER + inner * Math.cos(rad));
                line.setAttribute('y2', CENTER + inner * Math.sin(rad));
                line.setAttribute('class', 'tick-mark' + (lon ? ' major' : ''));
                nhom_phut.appendChild(line);
            }
        }

        const lay_12_gio = (h24) => { const h = h24 % 12; return h === 0 ? 12 : h; };
        const doi_24_gio = (h12, ampm) => {
            if (ampm === 'SA') return h12 === 12 ? 0 : h12;
            return h12 === 12 ? 12 : h12 + 12;
        };
        const lay_ampm_hien_tai = () => document.getElementById('ampm-text')?.textContent || 'SA';

        const so_gio = document.getElementById('digit-hours');
        const so_phut = document.getElementById('digit-minutes');
        if (so_gio && so_phut) {
            const bat_dau_nhap = (digitEl, type) => {
                digitEl.classList.add('editing');
                let dem = '';
                const xu_ly_phim = (e) => {
                    const key = e.key;
                    if (key >= '0' && key <= '9') {
                        dem += key;
                        digitEl.textContent = dem.length === 1 ? '0' + key : dem.slice(-2);
                        if (dem.length >= 2) {
                            let num = parseInt(dem.slice(-2));
                            if (type === 'hour') {
                                num = Math.max(1, Math.min(12, num));
                                this.cap_nhat_gia_tri_vt('hour', doi_24_gio(num, lay_ampm_hien_tai()));
                            } else {
                                num = Math.min(59, num);
                                this.cap_nhat_gia_tri_vt('minute', num);
                            }
                            dem = '';
                            digitEl.classList.remove('editing');
                            if (type === 'hour') setTimeout(() => bat_dau_nhap(so_phut, 'minute'), 60);
                            document.removeEventListener('keydown', xu_ly_phim);
                            document.removeEventListener('mousedown', nhan_ra_ngoai);
                        }
                    } else if (key === 'Backspace') {
                        dem = dem.slice(0, -1);
                        if (!dem) digitEl.textContent = type === 'hour'
                            ? String(lay_12_gio(this.gio_val_vt)).padStart(2, '0')
                            : String(this.phut_val_vt).padStart(2, '0');
                    } else if (['Enter', 'Tab', 'Escape'].includes(key)) {
                        const num = dem ? parseInt(dem) : (type === 'hour' ? lay_12_gio(this.gio_val_vt) : this.phut_val_vt);
                        if (type === 'hour') this.cap_nhat_gia_tri_vt('hour', doi_24_gio(Math.max(1, Math.min(12, num)), lay_ampm_hien_tai()));
                        else this.cap_nhat_gia_tri_vt('minute', Math.min(59, num));
                        dem = '';
                        digitEl.classList.remove('editing');
                        document.removeEventListener('keydown', xu_ly_phim);
                        document.removeEventListener('mousedown', nhan_ra_ngoai);
                    }
                };
                const nhan_ra_ngoai = (e) => {
                    if (e.target !== digitEl) {
                        const num = dem ? parseInt(dem) : (type === 'hour' ? lay_12_gio(this.gio_val_vt) : this.phut_val_vt);
                        if (type === 'hour') this.cap_nhat_gia_tri_vt('hour', doi_24_gio(Math.max(1, Math.min(12, num)), lay_ampm_hien_tai()));
                        else this.cap_nhat_gia_tri_vt('minute', Math.min(59, num));
                        dem = '';
                        digitEl.classList.remove('editing');
                        document.removeEventListener('keydown', xu_ly_phim);
                        document.removeEventListener('mousedown', nhan_ra_ngoai);
                    }
                };
                document.addEventListener('keydown', xu_ly_phim);
                setTimeout(() => document.addEventListener('mousedown', nhan_ra_ngoai), 0);
            };
            so_gio.addEventListener('click', () => bat_dau_nhap(so_gio, 'hour'));
            so_phut.addEventListener('click', () => bat_dau_nhap(so_phut, 'minute'));
            so_gio.addEventListener('wheel', (e) => {
                e.preventDefault();
                const cur12h = lay_12_gio(this.gio_val_vt);
                const next12h = ((cur12h - 1 + (e.deltaY < 0 ? 1 : -1) + 12) % 12) + 1;
                this.cap_nhat_gia_tri_vt('hour', doi_24_gio(next12h, lay_ampm_hien_tai()));
            }, { passive: false });
            so_phut.addEventListener('wheel', (e) => {
                e.preventDefault();
                this.cap_nhat_gia_tri_vt('minute', (this.phut_val_vt + (e.deltaY < 0 ? 1 : -1) + 60) % 60);
            }, { passive: false });
        }

        const svgEl = document.getElementById('circular-clock-svg') || nut_gio.ownerSVGElement;
        const tien_trinh_gio = document.getElementById('hour-progress');
        const tien_trinh_phut = document.getElementById('minute-progress');

        const cap_nhat_theo_toa_do = (clientX, clientY, kieu) => {
            const r = svgEl.getBoundingClientRect();
            const sx = 240 / r.width, sy = 240 / r.height;
            const mx = (clientX - r.left) * sx, my = (clientY - r.top) * sy;
            const deg = (Math.atan2(my - CENTER, mx - CENTER) * (180 / Math.PI) + 90 + 360) % 360;

            if (kieu === 'hour') {
                const buoc = Math.round(deg / (360 / 12));
                const h12 = buoc === 0 ? 12 : buoc;
                this.cap_nhat_gia_tri_vt('hour', doi_24_gio(h12, lay_ampm_hien_tai()));
            } else {
                const phut_moi = Math.round(deg / (360 / 60)) % 60;
                this.cap_nhat_gia_tri_vt('minute', phut_moi);
            }
        };

        const bat_dau_keo = (clientX, clientY, kieu_uu_tien) => {
            const r = svgEl.getBoundingClientRect();
            const sx = 240 / r.width, sy = 240 / r.height;
            const mx = (clientX - r.left) * sx, my = (clientY - r.top) * sy;
            const dist = Math.hypot(mx - CENTER, my - CENTER);

            // Bán kính <= 75px tương tác vòng giờ bên trong, > 75px tương tác vòng phút bên ngoài
            let kieu = kieu_uu_tien;
            if (!kieu) {
                kieu = dist <= 75 ? 'hour' : 'minute';
            }

            const handle = kieu === 'hour' ? nut_gio : nut_phut;
            const progress = kieu === 'hour' ? tien_trinh_gio : tien_trinh_phut;

            handle.classList.add('dragging');
            if (progress) progress.classList.add('dragging');

            cap_nhat_theo_toa_do(clientX, clientY, kieu);

            const khi_di_chuyen = (e) => {
                const cx = e.touches ? e.touches[0].clientX : e.clientX;
                const cy = e.touches ? e.touches[0].clientY : e.clientY;
                cap_nhat_theo_toa_do(cx, cy, kieu);
            };

            const khi_ket_thuc = () => {
                handle.classList.remove('dragging');
                if (progress) progress.classList.remove('dragging');
                window.removeEventListener('mousemove', khi_di_chuyen);
                window.removeEventListener('mouseup', khi_ket_thuc);
                window.removeEventListener('touchmove', khi_di_chuyen);
                window.removeEventListener('touchend', khi_ket_thuc);
            };

            window.addEventListener('mousemove', khi_di_chuyen);
            window.addEventListener('mouseup', khi_ket_thuc);
            window.addEventListener('touchmove', khi_di_chuyen, { passive: false });
            window.addEventListener('touchend', khi_ket_thuc);
        };

        nut_gio.addEventListener('mousedown', (e) => { e.preventDefault(); bat_dau_keo(e.clientX, e.clientY, 'hour'); });
        nut_gio.addEventListener('touchstart', (e) => { e.preventDefault(); bat_dau_keo(e.touches[0].clientX, e.touches[0].clientY, 'hour'); }, { passive: false });

        nut_phut.addEventListener('mousedown', (e) => { e.preventDefault(); bat_dau_keo(e.clientX, e.clientY, 'minute'); });
        nut_phut.addEventListener('touchstart', (e) => { e.preventDefault(); bat_dau_keo(e.touches[0].clientX, e.touches[0].clientY, 'minute'); }, { passive: false });

        svgEl.addEventListener('mousedown', (e) => {
            if (e.target === nut_gio || e.target === nut_phut) return;
            e.preventDefault();
            bat_dau_keo(e.clientX, e.clientY, null);
        });
        svgEl.addEventListener('touchstart', (e) => {
            if (e.target === nut_gio || e.target === nut_phut) return;
            e.preventDefault();
            bat_dau_keo(e.touches[0].clientX, e.touches[0].clientY, null);
        }, { passive: false });

        this.cap_nhat_gia_tri_vt('hour', this.gio_val_vt);
        this.cap_nhat_gia_tri_vt('minute', this.phut_val_vt);
    },

    gan_su_kien_am_pm() {
        const khung_chua_ampm = document.getElementById('ampm-container');
        if (khung_chua_ampm) {
            khung_chua_ampm.addEventListener('click', (e) => {
                const opt = e.target.closest('.custom-option');
                if (opt) {
                    const isPM = opt.dataset.val === 'CH';
                    if (isPM && this.gio_val_vt < 12) this.gio_val_vt += 12;
                    else if (!isPM && this.gio_val_vt >= 12) this.gio_val_vt -= 12;
                    this.cap_nhat_gia_tri_vt('hour', this.gio_val_vt);
                    const dropdown = document.getElementById('ampm-dropdown');
                    if (dropdown) dropdown.classList.remove('show');
                }
            });
        }
    },

    an_tat_nhom_tu_dong_dung() {
        const cacNhom = [
            document.getElementById('group-stop-time'),
            document.getElementById('group-stop-realtime'),
            document.getElementById('group-stop-chapters'),
            document.getElementById('group-stop-custom')
        ];
        cacNhom.forEach(nhom => { if (nhom) nhom.style.display = 'none'; });
    },

    gan_su_kien_menu_auto_stop() {
        const selectAutoStop = document.getElementById('select-auto-stop');
        if (!selectAutoStop) return;

        selectAutoStop.addEventListener('change', (e) => {
            const v = e.target.value;
            this.an_tat_nhom_tu_dong_dung();

            if (v === 'time') {
                const n = document.getElementById('group-stop-time');
                if (n) {
                    n.style.display = 'flex';
                    chrome.storage.local.get('stopTime', d => {
                        let h = 0, m = 30;
                        if (d.stopTime) {
                            h = Math.floor(d.stopTime / 60);
                            m = d.stopTime % 60;
                        }
                        const hInput = document.getElementById('input-stop-hours');
                        const mInput = document.getElementById('input-stop-minutes');
                        if (hInput) hInput.value = h;
                        if (mInput) mInput.value = m;
                    });
                }
            } else if (v === 'chapters') {
                const n = document.getElementById('group-stop-chapters');
                if (n) {
                    n.style.display = 'flex';
                    chrome.storage.local.get('stopAfterChapters', d => {
                        const cInput = document.getElementById('input-stop-chapters');
                        if (cInput) cInput.value = d.stopAfterChapters || 1;
                    });
                }
            } else if (v === 'realtime') {
                const n = document.getElementById('group-stop-realtime');
                if (n) {
                    n.style.display = 'flex';
                    chrome.storage.local.get('stopRealtimeTarget', d => {
                        let mucTieuGio = 12, mucTieuPhut = 0;
                        if (d.stopRealtimeTarget) {
                            const [hStr, mStr] = d.stopRealtimeTarget.split(':');
                            mucTieuGio = parseInt(hStr) || 12;
                            mucTieuPhut = parseInt(mStr) || 0;
                        } else {
                            const bayGio = new Date();
                            mucTieuGio = bayGio.getHours();
                            mucTieuPhut = bayGio.getMinutes();
                        }
                        this.cap_nhat_gia_tri_vt('hour', mucTieuGio);
                        this.cap_nhat_gia_tri_vt('minute', mucTieuPhut);

                    });
                }
            } else if (v === 'custom') {
                const n = document.getElementById('group-stop-custom');
                if (n) {
                    n.style.display = 'flex';
                    chrome.storage.local.get('customStopConfig', d => {
                        if (d.customStopConfig) {
                            const op = document.getElementById('custom-operator');
                            if (op) op.value = d.customStopConfig.operator || 'AND';
                            const lt = document.getElementById('custom-left-type');
                            if (lt) { lt.value = d.customStopConfig.left?.type || 'time'; lt.dispatchEvent(new Event('change')); }
                            const rt = document.getElementById('custom-right-type');
                            if (rt) { rt.value = d.customStopConfig.right?.type || 'chapters'; rt.dispatchEvent(new Event('change')); }
                            setTimeout(() => {
                                const li = document.getElementById('custom-left-input');
                                const ri = document.getElementById('custom-right-input');
                                const fill = (container, conf) => {
                                    if (!container || !conf) return;
                                    if (conf.type === 'time') {
                                        const hc = container.querySelector('.cc-hours');
                                        const mc = container.querySelector('.cc-minutes');
                                        if (hc) hc.value = Math.floor(conf.minutes / 60);
                                        if (mc) mc.value = conf.minutes % 60;
                                    } else if (conf.type === 'realtime') {
                                        const tc = container.querySelector('.cc-time');
                                        if (tc) tc.value = conf.displayTime;
                                    } else if (conf.type === 'chapters') {
                                        const cc = container.querySelector('.cc-chapters');
                                        if (cc) cc.value = conf.count;
                                    }
                                };
                                fill(li, d.customStopConfig.left);
                                fill(ri, d.customStopConfig.right);
                            }, 50);
                        }
                    });
                }
            } else if (v === 'off') {
                dieu_khien_trinh_phat.gui_lenh('henGioNgu', { minutes: 0 });
                dieu_khien_trinh_phat.gui_lenh('dungSauChuong', { count: 0 });
                dieu_khien_trinh_phat.gui_lenh('dungTuyChinh', { config: null });
                chrome.storage.local.remove(['stopTime', 'sleepTargetTimestamp', 'stopRealtimeTarget', 'customStopConfig', 'stopAfterChapters']);
                if (!this.bo_qua_thong_bao) hien_thong_bao('Đã tắt tự động dừng', 'info');
            }
        });

        const customLeftType = document.getElementById('custom-left-type');
        const customRightType = document.getElementById('custom-right-type');

        const cap_nhat_khoa_tuy_chinh = () => {
            if (!customLeftType || !customRightType) return;
            const leftVal = customLeftType.value;
            const rightVal = customRightType.value;

            Array.from(customLeftType.options).forEach(opt => {
                if (opt.value && opt.value !== '' && opt.value === rightVal) opt.disabled = true;
                else opt.disabled = false;
            });
            Array.from(customRightType.options).forEach(opt => {
                if (opt.value && opt.value !== '' && opt.value === leftVal) opt.disabled = true;
                else opt.disabled = false;
            });

            if (customLeftType._cap_nhat_giao_dien) customLeftType._cap_nhat_giao_dien();
            if (customRightType._cap_nhat_giao_dien) customRightType._cap_nhat_giao_dien();
        };

        if (customLeftType) customLeftType.addEventListener('change', e => {
            this.tao_input_dieu_kien('custom-left-input', e.target.value);
            cap_nhat_khoa_tuy_chinh();
        });
        if (customRightType) customRightType.addEventListener('change', e => {
            this.tao_input_dieu_kien('custom-right-input', e.target.value);
            cap_nhat_khoa_tuy_chinh();
        });
    },

    gan_su_kien_phim_tat() {
        const btnSettings = document.getElementById('btn-shortcuts-settings');
        const dropdown = document.getElementById('shortcuts-dropdown');
        if (btnSettings && dropdown) {
            btnSettings.addEventListener('click', () => {
                const mo_ra = dropdown.style.display === 'none';
                dropdown.style.display = mo_ra ? 'flex' : 'none';
                btnSettings.classList.toggle('active', mo_ra);
            });

            const defaultShortcuts = {
                playPause: 'K',
                replay: 'R',
                prevChap: 'ArrowLeft',
                nextChap: 'ArrowRight',
                volUp: 'ArrowUp',
                volDown: 'ArrowDown',
                speedUp: ']',
                speedDown: '[',
                nextSeg: '.',
                prevSeg: ','
            };

            const inputs = {
                playPause: document.getElementById('shortcut-play-pause'),
                replay: document.getElementById('shortcut-replay'),
                prevChap: document.getElementById('shortcut-prev-chap'),
                nextChap: document.getElementById('shortcut-next-chap'),
                volUp: document.getElementById('shortcut-vol-up'),
                volDown: document.getElementById('shortcut-vol-down'),
                speedUp: document.getElementById('shortcut-speed-up'),
                speedDown: document.getElementById('shortcut-speed-down'),
                nextSeg: document.getElementById('shortcut-next-seg'),
                prevSeg: document.getElementById('shortcut-prev-seg')
            };

            const hien_thi_phim = (key) => {
                if (!key) return '';
                
                const parts = key.split('+');
                return parts.map((part, index) => {
                    let kHtml = '';
                    if (part === 'ArrowUp') kHtml = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;
                    else if (part === 'ArrowDown') kHtml = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>`;
                    else if (part === 'ArrowLeft') kHtml = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`;
                    else if (part === 'ArrowRight') kHtml = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
                    else {
                        kHtml = part;
                        if (part === ',' || part === '.') {
                            return `<span style="font-size: 15px; font-weight: 900; line-height: 1; padding-bottom: 4px; display: inline-block;">${kHtml}</span>`;
                        }
                    }
                    if (index < parts.length - 1) return `<span>${kHtml}</span> <span style="font-size:11px; opacity:0.6">+</span> `;
                    return `<span>${kHtml}</span>`;
                }).join('');
            };

            chrome.storage.local.get('customShortcuts', data => {
                const shortcuts = data.customShortcuts || defaultShortcuts;
                if (inputs.playPause) { inputs.playPause.dataset.key = shortcuts.playPause || defaultShortcuts.playPause; inputs.playPause.innerHTML = hien_thi_phim(inputs.playPause.dataset.key); }
                if (inputs.replay) { inputs.replay.dataset.key = shortcuts.replay || defaultShortcuts.replay; inputs.replay.innerHTML = hien_thi_phim(inputs.replay.dataset.key); }
                if (inputs.prevChap) { inputs.prevChap.dataset.key = shortcuts.prevChap || defaultShortcuts.prevChap; inputs.prevChap.innerHTML = hien_thi_phim(inputs.prevChap.dataset.key); }
                if (inputs.nextChap) { inputs.nextChap.dataset.key = shortcuts.nextChap || defaultShortcuts.nextChap; inputs.nextChap.innerHTML = hien_thi_phim(inputs.nextChap.dataset.key); }
                if (inputs.volUp) { inputs.volUp.dataset.key = shortcuts.volUp || defaultShortcuts.volUp; inputs.volUp.innerHTML = hien_thi_phim(inputs.volUp.dataset.key); }
                if (inputs.volDown) { inputs.volDown.dataset.key = shortcuts.volDown || defaultShortcuts.volDown; inputs.volDown.innerHTML = hien_thi_phim(inputs.volDown.dataset.key); }
                if (inputs.speedUp) { inputs.speedUp.dataset.key = shortcuts.speedUp || defaultShortcuts.speedUp; inputs.speedUp.innerHTML = hien_thi_phim(inputs.speedUp.dataset.key); }
                if (inputs.speedDown) { inputs.speedDown.dataset.key = shortcuts.speedDown || defaultShortcuts.speedDown; inputs.speedDown.innerHTML = hien_thi_phim(inputs.speedDown.dataset.key); }
                if (inputs.nextSeg) { inputs.nextSeg.dataset.key = shortcuts.nextSeg || defaultShortcuts.nextSeg; inputs.nextSeg.innerHTML = hien_thi_phim(inputs.nextSeg.dataset.key); }
                if (inputs.prevSeg) { inputs.prevSeg.dataset.key = shortcuts.prevSeg || defaultShortcuts.prevSeg; inputs.prevSeg.innerHTML = hien_thi_phim(inputs.prevSeg.dataset.key); }
            });

            const thiet_lap_o_nhap = (keyName) => {
                const el = inputs[keyName];
                if (!el) return;

                el.addEventListener('focus', () => {
                    el.innerHTML = '...';
                });

                el.addEventListener('blur', () => {
                    el.innerHTML = hien_thi_phim(el.dataset.key);
                });

                el.addEventListener('keydown', e => {
                    e.preventDefault();
                    let key = e.key;
                    if (key === 'Escape') {
                        el.blur();
                        return;
                    }
                    if (key === ' ') key = 'Space';
                    if (key.length === 1) key = key.toUpperCase();
                    if (['Control', 'Alt', 'Shift', 'Meta', 'Tab'].includes(key)) return;
                    
                    let keyStr = key;
                    if (e.ctrlKey) keyStr = 'Ctrl+' + keyStr;
                    if (e.altKey) keyStr = 'Alt+' + keyStr;
                    if (e.shiftKey && keyStr.length > 1 && !keyStr.includes('+')) keyStr = 'Shift+' + keyStr;

                    el.dataset.key = keyStr;
                    el.innerHTML = hien_thi_phim(keyStr);
                    el.blur();

                    chrome.storage.local.get('customShortcuts', data => {
                        const shortcuts = data.customShortcuts || defaultShortcuts;
                        shortcuts[keyName] = keyStr;
                        chrome.storage.local.set({ customShortcuts: shortcuts }, () => {
                            hien_thong_bao('Đã lưu phím tắt', 'success');
                        });
                    });
                });
            };

            thiet_lap_o_nhap('playPause');
            thiet_lap_o_nhap('replay');
            thiet_lap_o_nhap('prevChap');
            thiet_lap_o_nhap('nextChap');
            thiet_lap_o_nhap('volUp');
            thiet_lap_o_nhap('volDown');
            thiet_lap_o_nhap('speedUp');
            thiet_lap_o_nhap('speedDown');
            thiet_lap_o_nhap('nextSeg');
            thiet_lap_o_nhap('prevSeg');
        }
    },

    tao_input_dieu_kien(containerid, kieu) {
        const container = document.getElementById(containerid);
        if (!container) return;
        container.innerHTML = '';
        if (kieu === 'time') container.innerHTML = `<input type="number" value="0" min="0" style="width:34px;" class="auto-stop-input cc-hours"><span class="auto-stop-unit">giờ</span><input type="number" value="30" min="0" max="59" style="width:34px;" class="auto-stop-input cc-minutes"><span class="auto-stop-unit">phút</span>`;
        else if (kieu === 'realtime') container.innerHTML = `<input type="time" class="auto-stop-input cc-time" style="width:105px; padding: 2px 4px; border: 1px solid var(--border); border-radius: 4px; background: var(--surface); color: var(--accent); outline: none; font-size: 11px;">`;
        else if (kieu === 'chapters') container.innerHTML = `<input type="number" value="1" min="1" style="width:46px;" class="auto-stop-input cc-chapters"><span class="auto-stop-unit">chương</span>`;
    },

    doc_gia_tri_dieu_kien(prefix) {
        const kieuElem = document.getElementById(`custom-${prefix}-type`);
        const kieu = kieuElem ? kieuElem.value : null;
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
    },

    gan_su_kien_phim_nhanh() {
        document.querySelectorAll('.preset-time').forEach(btn => {
            btn.addEventListener('click', () => {
                const luongThoiGian = parseInt(btn.dataset.min) || 0;
                let gio = parseInt(document.getElementById('input-stop-hours').value) || 0;
                let phut = parseInt(document.getElementById('input-stop-minutes').value) || 0;
                let tongPhut = gio * 60 + phut;

                if (this.la_dau_cong) tongPhut += luongThoiGian;
                else { tongPhut -= luongThoiGian; if (tongPhut < 0) tongPhut = 0; }

                document.getElementById('input-stop-hours').value = Math.floor(tongPhut / 60);
                document.getElementById('input-stop-minutes').value = tongPhut % 60;
            });
        });
    },

    gan_su_kien_cac_nut_ap_dung() {
        const btnTime = document.getElementById('btn-apply-stop-time');
        if (btnTime) btnTime.addEventListener('click', () => {
            const gio = parseInt(document.getElementById('input-stop-hours').value) || 0;
            const phut = parseInt(document.getElementById('input-stop-minutes').value) || 0;
            const tongPhut = gio * 60 + phut;
            if (tongPhut <= 0) { hien_thong_bao('Vui lòng nhập thời gian lớn hơn 0', 'warning'); return; }
            chrome.storage.local.remove(['stopRealtimeTarget', 'stopAfterChapters', 'customStopConfig'], () => {
                dieu_khien_trinh_phat.gui_lenh('henGioNgu', { minutes: tongPhut });
                dieu_khien_trinh_phat.gui_lenh('dungSauChuong', { count: 0 });
                chrome.storage.local.set({ stopTime: tongPhut });
                const moTa = gio > 0 ? `${gio}g${phut > 0 ? ` ${phut}p` : ''}` : `${phut} phút`;
                hien_thong_bao(`Sẽ dừng sau ${moTa}`, 'success');
            });
        });

        const btnRealtime = document.getElementById('btn-apply-stop-realtime');
        if (btnRealtime) btnRealtime.addEventListener('click', () => {
            let h24 = this.gio_val_vt;
            let m = this.phut_val_vt;
            const gioTruc = `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            const bayGio = new Date();
            const mucTieu = new Date();
            mucTieu.setHours(h24, m, 0, 0);
            if (mucTieu <= bayGio) mucTieu.setDate(mucTieu.getDate() + 1);

            const tongPhut = Math.ceil((mucTieu - bayGio) / 60000);
            chrome.storage.local.remove(['stopTime', 'stopAfterChapters', 'customStopConfig'], () => {
                dieu_khien_trinh_phat.gui_lenh('henGioNgu', { minutes: tongPhut });
                dieu_khien_trinh_phat.gui_lenh('dungSauChuong', { count: 0 });
                chrome.storage.local.set({ stopRealtimeTarget: gioTruc, stopTime: tongPhut });
                hien_thong_bao(`Sẽ dừng lúc ${gioTruc}`, 'success');
            });
        });

        const btnChapters = document.getElementById('btn-apply-stop-chapters');
        if (btnChapters) btnChapters.addEventListener('click', () => {
            const soChuong = parseInt(document.getElementById('input-stop-chapters').value);
            if (isNaN(soChuong) || soChuong <= 0) return;
            chrome.storage.local.remove(['stopTime', 'stopRealtimeTarget', 'customStopConfig'], () => {
                dieu_khien_trinh_phat.gui_lenh('henGioNgu', { minutes: 0 });
                dieu_khien_trinh_phat.gui_lenh('dungSauChuong', { count: soChuong });
                chrome.storage.local.set({ stopAfterChapters: soChuong });
                hien_thong_bao(`Sẽ dừng sau ${soChuong} chương nữa`, 'success');
            });
        });

        const btnCustom = document.getElementById('btn-apply-stop-custom');
        if (btnCustom) btnCustom.addEventListener('click', () => {
            const trai = this.doc_gia_tri_dieu_kien('left');
            const phai = this.doc_gia_tri_dieu_kien('right');
            const opElem = document.getElementById('custom-operator');
            const op = opElem ? opElem.value.toLowerCase() : 'or';

            if (!trai && !phai) { hien_thong_bao('Vui lòng chọn ít nhất một điều kiện hợp lệ', 'warning'); return; }
            if (trai && phai && trai.type === phai.type) { hien_thong_bao('Vui lòng chọn 2 điều kiện khác loại nhau', 'warning'); return; }

            const config = { operator: op, left: trai, right: phai };
            chrome.storage.local.remove(['stopTime', 'stopRealtimeTarget', 'stopAfterChapters'], () => {
                dieu_khien_trinh_phat.gui_lenh('dungTuyChinh', { config });
                const cacDk = [trai, phai].filter(Boolean);
                const dkTime = cacDk.find(c => c.type === 'time' || c.type === 'realtime');
                const dkChuong = cacDk.find(c => c.type === 'chapters');

                dieu_khien_trinh_phat.gui_lenh('henGioNgu', { minutes: dkTime ? dkTime.minutes : 0 });
                dieu_khien_trinh_phat.gui_lenh('dungSauChuong', { count: dkChuong ? dkChuong.count : 0 });

                const moTa = cacDk.map(c => {
                    if (c.type === 'time') {
                        const g = Math.floor(c.minutes / 60);
                        const p = c.minutes % 60;
                        return g > 0 ? `${g}g${p > 0 ? ` ${p}p` : ''}` : `${p}p`;
                    }
                    if (c.type === 'realtime') return `lúc ${c.displayTime}`;
                    if (c.type === 'chapters') return `${c.count} chương`;
                    return '';
                }).join(op === 'and' ? ' VÀ ' : ' HOẶC ');

                hien_thong_bao(`Sẽ dừng: ${moTa}`, 'success');
                chrome.storage.local.set({ customStopConfig: config });
            });
        });
    }
};
