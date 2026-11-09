// Chuyển đổi giao diện sáng tối
function ap_dung_chu_de(chu_de) {
    document.documentElement.setAttribute('data-theme', chu_de);
    const nut_doi_chu_de = document.getElementById('btn-toggle-theme');
    if (nut_doi_chu_de) {
        nut_doi_chu_de.title = chu_de === 'light' ? 'Chuyển sang chế độ Tối' : 'Chuyển sang chế độ Sáng';
    }
}

function khoi_tao_chu_de_ngay() {
    const truy_van_mau = window.matchMedia('(prefers-color-scheme: light)');
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get('giao_dien_chu_de', (du_lieu) => {
            if (du_lieu && (du_lieu.giao_dien_chu_de === 'light' || du_lieu.giao_dien_chu_de === 'dark')) {
                ap_dung_chu_de(du_lieu.giao_dien_chu_de);
            } else {
                const mac_dinh = truy_van_mau.matches ? 'light' : 'dark';
                ap_dung_chu_de(mac_dinh);
                chrome.storage.local.set({ giao_dien_chu_de: mac_dinh });
            }
        });

        chrome.storage.onChanged.addListener((thay_doi, vung_chon) => {
            if (vung_chon === 'local' && thay_doi.giao_dien_chu_de) {
                const chu_de_moi = thay_doi.giao_dien_chu_de.newValue;
                if (chu_de_moi) ap_dung_chu_de(chu_de_moi);
                else {
                    const mac_dinh = truy_van_mau.matches ? 'light' : 'dark';
                    ap_dung_chu_de(mac_dinh);
                }
            }
        });
    } else {
        ap_dung_chu_de(truy_van_mau.matches ? 'light' : 'dark');
    }
}

khoi_tao_chu_de_ngay();

// Trạng thái xem trước v0.4.2
let da_mo_khoa_xem_truoc = false;

// Chuyển tab hiển thị
function chuyen_tab(ma_tab) {
    const danh_sach_nut_tab = document.querySelectorAll('.nav-item');
    const danh_sach_khung_noi_dung = document.querySelectorAll('.content-section');

    danh_sach_nut_tab.forEach(nut => {
        if (nut.getAttribute('data-tab') === ma_tab) {
            nut.classList.add('active');
        } else {
            nut.classList.remove('active');
        }
    });

    danh_sach_khung_noi_dung.forEach(khung => {
        if (khung.id === 'tab-' + ma_tab) {
            khung.classList.add('active');
        } else {
            khung.classList.remove('active');
        }
    });

    // Đồng bộ lớp phủ xem trước
    const lop_phu = document.getElementById('cai_dat-preview-overlay');
    if (lop_phu) {
        if (ma_tab === 'cai_dat' && !da_mo_khoa_xem_truoc) {
            lop_phu.style.display = 'flex';
            lop_phu.classList.remove('fade-out');
        } else {
            lop_phu.style.display = 'none';
        }
    }

    try {
        const hash_moi = '#' + ma_tab.replace('_', '-');
        if (window.location.hash !== hash_moi) {
            history.replaceState(null, '', hash_moi);
        }
    } catch (e) {}
}

// Điều hướng theo liên kết (hash)
function kiem_tra_hash_dieu_huong() {
    const hash = window.location.hash.toLowerCase();
    if (hash === '#huong-dan' || hash === '#huong_dan') {
        chuyen_tab('huong_dan');
    } else if (hash === '#info' || hash === '#thong-tin') {
        chuyen_tab('info');
    } else if (hash === '#cai-dat' || hash === '#cai_dat') {
        chuyen_tab('cai_dat');
    } else {
        // Mặc định tab cài đặt
        chuyen_tab('cai_dat');
    }
}

// Chuyển mã hex sang rgba
function hex_sang_rgba(hex, do_mo) {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
        clean = clean.split('').map(c => c + c).join('');
    }
    const r = parseInt(clean.substring(0, 2), 16) || 0;
    const g = parseInt(clean.substring(2, 4), 16) || 0;
    const b = parseInt(clean.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${do_mo})`;
}

// 1. Ô chọn tên miền
function khoi_tao_cai_dat_ten_mien() {
    const o_nhap_ten_mien = document.getElementById('domain-input');
    const nut_mo_danh_sach = document.getElementById('domain-dropdown-trigger');
    const menu_tuy_chon = document.getElementById('domain-options-menu');
    const wrap_combo = document.getElementById('domain-combo-wrap');
    if (!o_nhap_ten_mien || !menu_tuy_chon) return;

    const cac_muc_chon = menu_tuy_chon.querySelectorAll('.domain-opt-item');

    const dong_menu = () => menu_tuy_chon.classList.remove('show');
    const mo_menu = () => {
        if (o_nhap_ten_mien.disabled) return;
        menu_tuy_chon.classList.add('show');
    };

    // Tải dữ liệu đã lưu
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get('cai_dat_ten_mien', (du_lieu) => {
            if (du_lieu && du_lieu.cai_dat_ten_mien) {
                o_nhap_ten_mien.value = du_lieu.cai_dat_ten_mien;
                cap_nhat_muc_duoc_chon(du_lieu.cai_dat_ten_mien);
            }
        });
    }

    function cap_nhat_muc_duoc_chon(gia_tri) {
        cac_muc_chon.forEach(item => {
            if (item.getAttribute('data-value') === gia_tri) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    function luu_ten_mien(gia_tri) {
        if (o_nhap_ten_mien.disabled) return;
        const gia_tri_sach = gia_tri.trim().toLowerCase();
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ cai_dat_ten_mien: gia_tri_sach });
        }
    }

    if (nut_mo_danh_sach) {
        nut_mo_danh_sach.addEventListener('click', (e) => {
            e.stopPropagation();
            if (nut_mo_danh_sach.disabled || o_nhap_ten_mien.disabled) return;
            menu_tuy_chon.classList.toggle('show');
        });
    }

    o_nhap_ten_mien.addEventListener('focus', () => mo_menu());

    // Lọc danh sách khi gõ
    o_nhap_ten_mien.addEventListener('input', () => {
        if (o_nhap_ten_mien.disabled) return;
        const tu_khoa = o_nhap_ten_mien.value.trim().toLowerCase();
        mo_menu();
        cac_muc_chon.forEach(item => {
            const ten = item.getAttribute('data-value').toLowerCase();
            if (ten.includes(tu_khoa)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });

        const tieu_de_nhom = menu_tuy_chon.querySelectorAll('.domain-group-title');
        tieu_de_nhom.forEach(nhom => {
            if (tu_khoa) {
                let co_muc_hien = false;
                let tiep_theo = nhom.nextElementSibling;
                while (tiep_theo && !tiep_theo.classList.contains('domain-group-title')) {
                    if (tiep_theo.style.display !== 'none') co_muc_hien = true;
                    tiep_theo = tiep_theo.nextElementSibling;
                }
                nhom.style.display = co_muc_hien ? 'block' : 'none';
            } else {
                nhom.style.display = 'block';
            }
        });

        luu_ten_mien(o_nhap_ten_mien.value);
    });

    // Chọn tên miền
    cac_muc_chon.forEach(item => {
        item.addEventListener('click', () => {
            if (o_nhap_ten_mien.disabled) return;
            const gia_tri = item.getAttribute('data-value');
            o_nhap_ten_mien.value = gia_tri;
            cap_nhat_muc_duoc_chon(gia_tri);
            luu_ten_mien(gia_tri);
            dong_menu();
        });
    });

    // Đóng danh sách khi bấm ra ngoài
    document.addEventListener('click', (e) => {
        if (wrap_combo && !wrap_combo.contains(e.target)) {
            dong_menu();
        }
    });
}

// 2. Tùy biến màu sắc đọc truyện
function khoi_tao_tuy_bien_mau_sac() {
    const picker_mau_chu = document.getElementById('setting-text-color');
    const input_hex_chu = document.getElementById('setting-text-color-hex');
    const swatch_chu = document.getElementById('swatch-text-wrap');

    const picker_mau_nen = document.getElementById('setting-bg-color');
    const input_hex_nen = document.getElementById('setting-bg-color-hex');
    const slider_do_mo = document.getElementById('setting-bg-opacity');
    const nhan_do_mo = document.getElementById('bg-opacity-label');
    const swatch_nen = document.getElementById('swatch-bg-wrap');

    const cau_xem_truoc = document.getElementById('preview-active-sentence');
    const nut_dat_lai = document.getElementById('btn-reset-preview');

    if (!picker_mau_chu || !cau_xem_truoc) return;

    function cap_nhat_xem_truoc(luu_tru = true) {
        const mau_chu = picker_mau_chu.value || '#e8a045';
        const mau_nen = picker_mau_nen.value || '#e8a045';
        const do_mo_val = parseInt(slider_do_mo.value, 10) || 15;
        const do_mo_ty_le = do_mo_val / 100;

        cau_xem_truoc.style.color = mau_chu;
        cau_xem_truoc.style.backgroundColor = hex_sang_rgba(mau_nen, do_mo_ty_le);

        if (input_hex_chu) input_hex_chu.value = mau_chu.toUpperCase();
        if (swatch_chu) swatch_chu.style.backgroundColor = mau_chu;

        if (input_hex_nen) input_hex_nen.value = mau_nen.toUpperCase();
        if (swatch_nen) swatch_nen.style.backgroundColor = mau_nen;
        if (nhan_do_mo) nhan_do_mo.textContent = do_mo_val + '%';

        if (luu_tru && !picker_mau_chu.disabled && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({
                mau_chu_doc: mau_chu,
                mau_nen_doc: mau_nen,
                do_mo_nen_doc: do_mo_val
            });
        }
    }

    // Tải màu đã lưu
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['mau_chu_doc', 'mau_nen_doc', 'do_mo_nen_doc'], (du_lieu) => {
            if (du_lieu) {
                if (du_lieu.mau_chu_doc) picker_mau_chu.value = du_lieu.mau_chu_doc;
                if (du_lieu.mau_nen_doc) picker_mau_nen.value = du_lieu.mau_nen_doc;
                if (typeof du_lieu.do_mo_nen_doc === 'number') slider_do_mo.value = du_lieu.do_mo_nen_doc;
                cap_nhat_xem_truoc(false);
            }
        });
    }

    // Đổi màu chữ
    picker_mau_chu.addEventListener('input', () => cap_nhat_xem_truoc(true));
    if (input_hex_chu) {
        input_hex_chu.addEventListener('change', () => {
            if (picker_mau_chu.disabled) return;
            let val = input_hex_chu.value.trim();
            if (!val.startsWith('#')) val = '#' + val;
            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                picker_mau_chu.value = val;
                cap_nhat_xem_truoc(true);
            }
        });
    }

    // Đổi màu nền
    picker_mau_nen.addEventListener('input', () => cap_nhat_xem_truoc(true));
    if (input_hex_nen) {
        input_hex_nen.addEventListener('change', () => {
            if (picker_mau_nen.disabled) return;
            let val = input_hex_nen.value.trim();
            if (!val.startsWith('#')) val = '#' + val;
            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                picker_mau_nen.value = val;
                cap_nhat_xem_truoc(true);
            }
        });
    }
    if (slider_do_mo) {
        slider_do_mo.addEventListener('input', () => cap_nhat_xem_truoc(true));
    }

    // Bảng màu chữ có sẵn
    document.querySelectorAll('#text-color-presets .preset-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            if (dot.disabled || picker_mau_chu.disabled) return;
            document.querySelectorAll('#text-color-presets .preset-dot').forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            picker_mau_chu.value = dot.getAttribute('data-color');
            cap_nhat_xem_truoc(true);
        });
    });

    // Bảng màu nền có sẵn
    document.querySelectorAll('#bg-color-presets .preset-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            if (dot.disabled || picker_mau_nen.disabled) return;
            document.querySelectorAll('#bg-color-presets .preset-dot').forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            picker_mau_nen.value = dot.getAttribute('data-color');
            cap_nhat_xem_truoc(true);
        });
    });

    // Đặt lại màu chuẩn
    if (nut_dat_lai) {
        nut_dat_lai.addEventListener('click', () => {
            if (nut_dat_lai.disabled) return;
            picker_mau_chu.value = '#e8a045';
            picker_mau_nen.value = '#e8a045';
            slider_do_mo.value = 15;
            cap_nhat_xem_truoc(true);
        });
    }

    cap_nhat_xem_truoc(false);
}

// 3. Tự động hóa
function khoi_tao_chuyen_doi_tu_dong() {
    const nut_cuon_trang = document.getElementById('setting-auto-scroll');
    const nut_captcha = document.getElementById('setting-auto-captcha');

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['tu_dong_cuon_trang', 'tu_dong_vuot_captcha'], (du_lieu) => {
            if (du_lieu) {
                if (nut_cuon_trang && typeof du_lieu.tu_dong_cuon_trang === 'boolean') {
                    nut_cuon_trang.checked = du_lieu.tu_dong_cuon_trang;
                }
                if (nut_captcha && typeof du_lieu.tu_dong_vuot_captcha === 'boolean') {
                    nut_captcha.checked = du_lieu.tu_dong_vuot_captcha;
                }
            }
        });
    }

    if (nut_cuon_trang) {
        nut_cuon_trang.addEventListener('change', () => {
            if (nut_cuon_trang.disabled) return;
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ tu_dong_cuon_trang: nut_cuon_trang.checked });
            }
        });
    }

    if (nut_captcha) {
        nut_captcha.addEventListener('change', () => {
            if (nut_captcha.disabled) return;
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ tu_dong_vuot_captcha: nut_captcha.checked });
            }
        });
    }
}

// 4. Sao lưu và phục hồi dữ liệu
function khoi_tao_nhap_xuat_cai_dat() {
    const nut_xuat = document.getElementById('btn-export-settings');
    const nut_nhap = document.getElementById('btn-import-settings');
    const the_chon_tep = document.getElementById('input-import-settings-file');
    const thong_bao = document.getElementById('settings-toast-msg');

    function hien_thong_bao(noi_dung, loai = 'success') {
        if (!thong_bao) return;
        thong_bao.textContent = noi_dung;
        thong_bao.className = 'settings-toast-msg ' + loai;
        thong_bao.style.display = 'block';
        setTimeout(() => {
            thong_bao.style.display = 'none';
        }, 3500);
    }

    // Xuất dữ liệu sao lưu
    if (nut_xuat) {
        nut_xuat.addEventListener('click', () => {
            if (nut_xuat.disabled) return;
            if (typeof chrome === 'undefined' || !chrome.storage) {
                hien_thong_bao('Không thể truy cập bộ nhớ tiện ích', 'error');
                return;
            }

            chrome.storage.local.get(null, dl_cuc_bo => {
                chrome.storage.sync.get(null, dl_dong_bo => {
                    const cuc_bo_copy = { ...(dl_cuc_bo || {}) };
                    // Ẩn khóa API
                    delete cuc_bo_copy.fpt_key;
                    delete cuc_bo_copy.azure_key;
                    delete cuc_bo_copy.gcp_key;
                    if (Array.isArray(cuc_bo_copy.customEngines)) {
                        cuc_bo_copy.customEngines = cuc_bo_copy.customEngines.map(e => {
                            const engine_copy = { ...e };
                            delete engine_copy.key;
                            delete engine_copy.apiKey;
                            return engine_copy;
                        });
                    }

                    const du_lieu_xuat = {
                        phien_ban: (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) ? chrome.runtime.getManifest().version : '0.4.1',
                        phienBan: (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) ? chrome.runtime.getManifest().version : '0.4.1',
                        ngay_xuat: new Date().toISOString(),
                        ngayXuat: new Date().toISOString(),
                        local: cuc_bo_copy,
                        sync: dl_dong_bo || {}
                    };

                    const blob = new Blob([JSON.stringify(du_lieu_xuat, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `DocTruyenSTV_Backup_${new Date().toISOString().slice(0, 10)}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    hien_thong_bao('Đã xuất toàn bộ dữ liệu sao lưu thành công!', 'success');
                });
            });
        });
    }

    // Nhập dữ liệu sao lưu
    if (nut_nhap && the_chon_tep) {
        nut_nhap.addEventListener('click', () => {
            if (nut_nhap.disabled) return;
            the_chon_tep.value = '';
            the_chon_tep.click();
        });

        the_chon_tep.addEventListener('change', (e) => {
            if (nut_nhap.disabled) return;
            const tep = e.target.files?.[0];
            if (!tep) return;

            const reader = new FileReader();
            reader.onload = (su_kien) => {
                try {
                    const du_lieu = JSON.parse(su_kien.target.result);
                    if (typeof du_lieu !== 'object' || du_lieu === null) {
                        throw new Error('File không hợp lệ');
                    }

                    let cuc_bo_sach = du_lieu.local || du_lieu.cai_dat || {};
                    let dong_bo_sach = du_lieu.sync || {};

                    // Hỗ trợ định dạng cũ
                    if (!du_lieu.local && !du_lieu.sync && !du_lieu.cai_dat) {
                        cuc_bo_sach = { ...du_lieu };
                    }

                    const cong_viec = [];
                    if (Object.keys(cuc_bo_sach).length > 0 && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                        cong_viec.push(new Promise(res => chrome.storage.local.set(cuc_bo_sach, res)));
                    }
                    if (Object.keys(dong_bo_sach).length > 0 && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                        cong_viec.push(new Promise(res => chrome.storage.sync.set(dong_bo_sach, res)));
                    }

                    Promise.all(cong_viec).then(() => {
                        // Cập nhật giao diện
                        if (cuc_bo_sach.cai_dat_ten_mien) {
                            const o_mien = document.getElementById('domain-input');
                            if (o_mien) o_mien.value = cuc_bo_sach.cai_dat_ten_mien;
                        }
                        if (typeof cuc_bo_sach.tu_dong_cuon_trang === 'boolean') {
                            const nut_cuon = document.getElementById('setting-auto-scroll');
                            if (nut_cuon) nut_cuon.checked = cuc_bo_sach.tu_dong_cuon_trang;
                        }
                        if (typeof cuc_bo_sach.tu_dong_vuot_captcha === 'boolean') {
                            const nut_cap = document.getElementById('setting-auto-captcha');
                            if (nut_cap) nut_cap.checked = cuc_bo_sach.tu_dong_vuot_captcha;
                        }
                        if (cuc_bo_sach.mau_chu_doc) {
                            const pk_chu = document.getElementById('setting-text-color');
                            if (pk_chu) pk_chu.value = cuc_bo_sach.mau_chu_doc;
                        }
                        if (cuc_bo_sach.mau_nen_doc) {
                            const pk_nen = document.getElementById('setting-bg-color');
                            if (pk_nen) pk_nen.value = cuc_bo_sach.mau_nen_doc;
                        }
                        if (typeof cuc_bo_sach.do_mo_nen_doc === 'number') {
                            const sl_mo = document.getElementById('setting-bg-opacity');
                            if (sl_mo) sl_mo.value = cuc_bo_sach.do_mo_nen_doc;
                        }

                        // Cập nhật xem trước
                        const pk_chu = document.getElementById('setting-text-color');
                        if (pk_chu) pk_chu.dispatchEvent(new Event('input'));

                        hien_thong_bao('Đã phục hồi toàn bộ dữ liệu tiện ích thành công!', 'success');
                    }).catch(() => {
                        hien_thong_bao('Lỗi khi ghi dữ liệu sao lưu', 'error');
                    });
                } catch (loi) {
                    hien_thong_bao('Tệp sao lưu không hợp lệ hoặc bị lỗi cú pháp!', 'error');
                }
            };
            reader.readAsText(tep);
        });
    }
}

// 5. Chế độ xem trước v0.4.2
function khoi_tao_che_do_xem_truoc_v042() {
    const nut_mo_khoa = document.getElementById('btn-unlock-preview');
    const nut_khoa_lai = document.getElementById('btn-relock-preview');
    const lop_phu = document.getElementById('cai_dat-preview-overlay');
    const khung_noi_dung = document.getElementById('cai_dat-content-wrap');

    if (nut_mo_khoa && lop_phu && khung_noi_dung) {
        nut_mo_khoa.addEventListener('click', () => {
            da_mo_khoa_xem_truoc = true;
            lop_phu.classList.add('fade-out');
            khung_noi_dung.classList.remove('is-blurred');
            setTimeout(() => {
                lop_phu.style.display = 'none';
            }, 350);
        });
    }

    if (nut_khoa_lai && lop_phu && khung_noi_dung) {
        nut_khoa_lai.addEventListener('click', () => {
            da_mo_khoa_xem_truoc = false;
            lop_phu.style.display = 'flex';
            void lop_phu.offsetWidth; // Vẽ lại giao diện
            lop_phu.classList.remove('fade-out');
            khung_noi_dung.classList.add('is-blurred');
        });
    }
}

// Khởi tạo trang khi tải xong
document.addEventListener('DOMContentLoaded', () => {
    const chu_de_hien_tai = document.documentElement.getAttribute('data-theme');
    if (chu_de_hien_tai) ap_dung_chu_de(chu_de_hien_tai);

    const nut_doi_chu_de = document.getElementById('btn-toggle-theme');
    if (nut_doi_chu_de) {
        nut_doi_chu_de.addEventListener('click', () => {
            const la_dang_sang = document.documentElement.getAttribute('data-theme') === 'light';
            const chu_de_moi = la_dang_sang ? 'dark' : 'light';
            ap_dung_chu_de(chu_de_moi);
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ giao_dien_chu_de: chu_de_moi });
            }
        });
    }

    const danh_sach_nut_tab = document.querySelectorAll('.nav-item');
    danh_sach_nut_tab.forEach(nut_tab => {
        nut_tab.addEventListener('click', () => {
            chuyen_tab(nut_tab.getAttribute('data-tab'));
        });
    });

    window.addEventListener('hashchange', kiem_tra_hash_dieu_huong);
    kiem_tra_hash_dieu_huong();

    // Khởi tạo các mục cài đặt
    khoi_tao_che_do_xem_truoc_v042();
    khoi_tao_cai_dat_ten_mien();
    khoi_tao_tuy_bien_mau_sac();
    khoi_tao_chuyen_doi_tu_dong();
    khoi_tao_nhap_xuat_cai_dat();
});
