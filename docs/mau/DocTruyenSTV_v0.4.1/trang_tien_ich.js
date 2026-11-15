// Điều khiển trang Tiện ích, giao diện và sao lưu
import {
    chuyen_doi_du_lieu_khoi_chay,
    chuyen_doi_du_lieu_nhap,
    ghi_de_du_lieu_nhap,
    tao_goi_du_lieu_xuat,
    tai_xuong_json,
    nen_tap_du_lieu,
    giai_ma_bool,
    giai_ma_chu_de
} from './chuyen_doi.js';

// === Cấu hình dùng chung và chủ đề ===

function doc_cai_dat_hop_nhat(cac_khoa, xu_ly) {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
    const mang = Array.isArray(cac_khoa) ? cac_khoa : [cac_khoa];
    const doc_local = new Promise(res => chrome.storage.local.get(mang, d => res(d || {})));
    const doc_sync = chrome.storage.sync
        ? new Promise(res => chrome.storage.sync.get(mang, d => res(d || {})))
        : Promise.resolve({});
    Promise.all([doc_local, doc_sync]).then(([dl_cuc_bo, dl_dong_bo]) => {
        const ket_qua = { ...dl_cuc_bo };
        for (const [k, v] of Object.entries(dl_dong_bo)) {
            if (v !== undefined) ket_qua[k] = v;
        }
        xu_ly(ket_qua);
    });
}

// Ghi đồng thời local/sync và bỏ mặc định
function ghi_cai_dat_kep(du_lieu) {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local || !du_lieu || typeof du_lieu !== 'object') return;
    const { du_lieu_ghi, khoa_xoa } = nen_tap_du_lieu(du_lieu);
    if (Object.keys(du_lieu_ghi).length > 0) {
        chrome.storage.local.set(du_lieu_ghi);
        if (chrome.storage.sync) chrome.storage.sync.set(du_lieu_ghi);
    }
    if (khoa_xoa.length > 0) {
        chrome.storage.local.remove(khoa_xoa);
        if (chrome.storage.sync) chrome.storage.sync.remove(khoa_xoa);
    }
}

// Chuyển đổi giao diện sáng tối
function ap_dung_chu_de(chu_de) {
    document.documentElement.setAttribute('data-theme', chu_de);
    const nut_doi_chu_de = document.getElementById('btn-toggle-theme');
    if (nut_doi_chu_de) {
        nut_doi_chu_de.title = chu_de === 'light' ? 'Chuyển sang chế độ Tối' : 'Chuyển sang chế độ Sáng';
    }
}

// Nạp chủ đề ban đầu, không tự ghi đè storage
function khoi_tao_chu_de_ngay() {
    const truy_van_mau = window.matchMedia('(prefers-color-scheme: light)');
    const ap_dung_hieu_luc = (gia_tri) => {
        const da_chinh = giai_ma_chu_de(gia_tri);
        ap_dung_chu_de(da_chinh || (truy_van_mau.matches ? 'light' : 'dark'));
    };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        doc_cai_dat_hop_nhat('giao_dien_chu_de', (du_lieu) => {
            ap_dung_hieu_luc(du_lieu ? du_lieu.giao_dien_chu_de : undefined);
        });

        truy_van_mau.addEventListener('change', (e) => {
            doc_cai_dat_hop_nhat('giao_dien_chu_de', (du_lieu) => {
                if (!giai_ma_chu_de(du_lieu && du_lieu.giao_dien_chu_de)) {
                    ap_dung_chu_de(e.matches ? 'light' : 'dark');
                }
            });
        });

        chrome.storage.onChanged.addListener((thay_doi, vung_chon) => {
            if ((vung_chon === 'sync' || vung_chon === 'local') && thay_doi.giao_dien_chu_de) {
                ap_dung_hieu_luc(thay_doi.giao_dien_chu_de.newValue);
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
    } catch (e) { }
}

// Điều hướng theo liên kết hash trên URL
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

const CAC_KHOA_XEM_TRUOC_V042_CU = [
    'cai_dat_ten_mien',
    'tu_dong_cuon_trang',
    'tu_dong_vuot_captcha',
    'mau_chu_doc',
    'mau_nen_doc',
    'do_mo_nen_doc'
];

const MAU_BO_CHON_TRANG_PHU = {
    ten_mien: 'truyenfull.live',
    bo_chon_ten_truyen: 'a.truyen-title, h3.title',
    bo_chon_ten_chuong: 'a.chapter-title',
    bo_chon_noi_dung: '#chapter-c, .chapter-c',
    bo_chon_dieu_huong: '#prev_chap, #next_chap',
    html_mau: ''
};

// === Cấu hình bản xem trước v0.4.2 ===

let bo_nho_xem_truoc_v042 = {};
let ban_va_cho_luu_v042 = null;
let bo_hen_luu_v042 = null;

// Đọc gói xem trước v0.4.2 và dọn khóa rời cũ
function doc_xem_truoc_v042(xu_ly) {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
    const cac_khoa = ['xem_truoc_v042', ...CAC_KHOA_XEM_TRUOC_V042_CU];
    chrome.storage.local.get(cac_khoa, (d) => {
        const dl = d || {};
        const goc = (dl.xem_truoc_v042 && typeof dl.xem_truoc_v042 === 'object' && !Array.isArray(dl.xem_truoc_v042))
            ? { ...dl.xem_truoc_v042 }
            : {};
        const khoa_cu_ton_tai = [];
        for (const k of CAC_KHOA_XEM_TRUOC_V042_CU) {
            if (dl[k] !== undefined) khoa_cu_ton_tai.push(k);
            if (goc[k] === undefined && dl[k] !== undefined) {
                goc[k] = dl[k];
            }
        }
        bo_nho_xem_truoc_v042 = goc;
        if (khoa_cu_ton_tai.length > 0) {
            chrome.storage.local.set({ xem_truoc_v042: goc }, () => {
                chrome.storage.local.remove(khoa_cu_ton_tai);
            });
        }
        xu_ly(goc);
    });
}

// Ghi gói xem trước v0.4.2 kèm gom đợt
function luu_xem_truoc_v042(cap_nhat, tuy_chon = {}) {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local || !cap_nhat || typeof cap_nhat !== 'object') return;

    const hop_nhat_vao = (nen, ban_va) => {
        const ket_qua = { ...nen, ...ban_va };
        if (ban_va.cau_hinh_html_tuy_chinh && typeof ban_va.cau_hinh_html_tuy_chinh === 'object') {
            ket_qua.cau_hinh_html_tuy_chinh = {
                ...(nen.cau_hinh_html_tuy_chinh || {}),
                ...ban_va.cau_hinh_html_tuy_chinh
            };
        }
        return ket_qua;
    };

    bo_nho_xem_truoc_v042 = hop_nhat_vao(bo_nho_xem_truoc_v042, cap_nhat);
    ban_va_cho_luu_v042 = hop_nhat_vao(ban_va_cho_luu_v042 || {}, cap_nhat);

    const thuc_thi_ghi = () => {
        const ban_va_ghi = ban_va_cho_luu_v042;
        ban_va_cho_luu_v042 = null;
        bo_hen_luu_v042 = null;
        if (!ban_va_ghi) return;

        chrome.storage.local.get(['xem_truoc_v042'], (d) => {
            const hien_tai = (d && d.xem_truoc_v042 && typeof d.xem_truoc_v042 === 'object' && !Array.isArray(d.xem_truoc_v042))
                ? { ...d.xem_truoc_v042 }
                : {};
            const hop_nhat = hop_nhat_vao(hien_tai, ban_va_ghi);
            bo_nho_xem_truoc_v042 = hop_nhat;
            chrome.storage.local.set({ xem_truoc_v042: hop_nhat });
            chrome.storage.local.remove(CAC_KHOA_XEM_TRUOC_V042_CU);
            if (chrome.storage.sync) {
                chrome.storage.sync.remove(CAC_KHOA_XEM_TRUOC_V042_CU);
            }
        });
    };

    if (bo_hen_luu_v042) {
        clearTimeout(bo_hen_luu_v042);
        bo_hen_luu_v042 = null;
    }

    if (tuy_chon && tuy_chon.ngay_lap_tuc) {
        thuc_thi_ghi();
    } else {
        bo_hen_luu_v042 = setTimeout(thuc_thi_ghi, 250);
    }
}

function cap_nhat_khung_html_tuy_chinh(gia_tri, du_lieu_xem_truoc) {
    const khung = document.getElementById('khung-cau-hinh-ten-mien-khac');
    if (!khung) return;

    const tieu_de = document.getElementById('tieu-de-cau-hinh-ten-mien-khac');
    const o_mien_khac = document.getElementById('o-url-ten-mien-khac');
    const o_ten_truyen = document.getElementById('bo-chon-html-ten-truyen');
    const o_ten_chuong = document.getElementById('bo-chon-html-ten-chuong');
    const o_noi_dung = document.getElementById('bo-chon-html-noi-dung');
    const o_dieu_huong = document.getElementById('bo-chon-html-dieu-huong');
    const o_html_mau = document.getElementById('mau-html-tho');

    const ten_sach = String(gia_tri || '').trim().toLowerCase();
    if (!ten_sach || ten_sach === 'sangtacviet.com') {
        khung.style.display = 'none';
        return;
    }

    khung.style.display = 'flex';
    const la_trang_phu = ten_sach === 'truyenfull.live';
    const nguon_cau_hinh = la_trang_phu
        ? MAU_BO_CHON_TRANG_PHU
        : ((du_lieu_xem_truoc && du_lieu_xem_truoc.cau_hinh_html_tuy_chinh && typeof du_lieu_xem_truoc.cau_hinh_html_tuy_chinh === 'object')
            ? du_lieu_xem_truoc.cau_hinh_html_tuy_chinh
            : {});

    if (tieu_de) {
        tieu_de.textContent = la_trang_phu
            ? 'Bộ chọn tham chiếu cho truyenfull.live (Sườn v0.4.2)'
            : 'Cấu hình bóc tách HTML trang web khác (Sườn v0.4.2)';
    }
    if (o_mien_khac) {
        o_mien_khac.value = la_trang_phu ? MAU_BO_CHON_TRANG_PHU.ten_mien : (nguon_cau_hinh.ten_mien || (ten_sach !== 'khac' ? ten_sach : ''));
        o_mien_khac.readOnly = la_trang_phu;
    }
    if (o_ten_truyen) {
        o_ten_truyen.value = nguon_cau_hinh.bo_chon_ten_truyen || '';
        o_ten_truyen.readOnly = la_trang_phu;
    }
    if (o_ten_chuong) {
        o_ten_chuong.value = nguon_cau_hinh.bo_chon_ten_chuong || '';
        o_ten_chuong.readOnly = la_trang_phu;
    }
    if (o_noi_dung) {
        o_noi_dung.value = nguon_cau_hinh.bo_chon_noi_dung || '';
        o_noi_dung.readOnly = la_trang_phu;
    }
    if (o_dieu_huong) {
        o_dieu_huong.value = nguon_cau_hinh.bo_chon_dieu_huong || '';
        o_dieu_huong.readOnly = la_trang_phu;
    }
    if (o_html_mau) {
        o_html_mau.value = la_trang_phu ? '' : (nguon_cau_hinh.html_mau || '');
        o_html_mau.readOnly = la_trang_phu;
    }
}

// === Tên miền và cấu hình HTML ngoài ===

function khoi_tao_cai_dat_ten_mien(du_lieu_xem_truoc_san = null) {
        const o_nhap_ten_mien = document.getElementById('domain-input');
        const nut_mo_danh_sach = document.getElementById('domain-dropdown-trigger');
        const menu_tuy_chon = document.getElementById('domain-options-menu');
        const wrap_combo = document.getElementById('domain-combo-wrap');
        if (!o_nhap_ten_mien || !menu_tuy_chon) return;

        const cac_muc_chon = menu_tuy_chon.querySelectorAll('.domain-opt-item');
        const cac_truong_html_khac = [
            document.getElementById('o-url-ten-mien-khac'),
            document.getElementById('bo-chon-html-ten-truyen'),
            document.getElementById('bo-chon-html-ten-chuong'),
            document.getElementById('bo-chon-html-noi-dung'),
            document.getElementById('bo-chon-html-dieu-huong'),
            document.getElementById('mau-html-tho')
        ].filter(Boolean);

        const dong_menu = () => menu_tuy_chon.classList.remove('show');
        const mo_menu = () => {
            if (o_nhap_ten_mien.disabled) return;
            menu_tuy_chon.classList.add('show');
        };

        function cap_nhat_muc_duoc_chon(gia_tri) {
            cac_muc_chon.forEach(item => {
                if (item.getAttribute('data-value') === gia_tri) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        }

        const ap_dung_du_lieu_ten_mien = (du_lieu) => {
            const gia_tri = (du_lieu && du_lieu.cai_dat_ten_mien) || 'sangtacviet.com';
            o_nhap_ten_mien.value = gia_tri;
            cap_nhat_muc_duoc_chon(gia_tri);
            cap_nhat_khung_html_tuy_chinh(gia_tri, du_lieu);
        };

        if (du_lieu_xem_truoc_san && typeof du_lieu_xem_truoc_san === 'object') {
            ap_dung_du_lieu_ten_mien(du_lieu_xem_truoc_san);
        } else {
            doc_xem_truoc_v042(ap_dung_du_lieu_ten_mien);
        }

        function luu_ten_mien(gia_tri) {
            if (o_nhap_ten_mien.disabled) return;
            const gia_tri_sach = gia_tri.trim().toLowerCase();
            luu_xem_truoc_v042({ cai_dat_ten_mien: gia_tri_sach });
        }

        function luu_cau_hinh_html_khac() {
            if (o_nhap_ten_mien.disabled || o_nhap_ten_mien.value.trim().toLowerCase() === 'truyenfull.live') return;
            luu_xem_truoc_v042({
                cau_hinh_html_tuy_chinh: {
                    ten_mien: (document.getElementById('o-url-ten-mien-khac')?.value || '').trim().toLowerCase(),
                    bo_chon_ten_truyen: (document.getElementById('bo-chon-html-ten-truyen')?.value || '').trim(),
                    bo_chon_ten_chuong: (document.getElementById('bo-chon-html-ten-chuong')?.value || '').trim(),
                    bo_chon_noi_dung: (document.getElementById('bo-chon-html-noi-dung')?.value || '').trim(),
                    bo_chon_dieu_huong: (document.getElementById('bo-chon-html-dieu-huong')?.value || '').trim(),
                    html_mau: document.getElementById('mau-html-tho')?.value || ''
                }
            });
        }

        cac_truong_html_khac.forEach(truong => {
            truong.addEventListener('input', () => {
                if (truong.disabled || truong.readOnly) return;
                luu_cau_hinh_html_khac();
            });
        });

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

            cap_nhat_khung_html_tuy_chinh(o_nhap_ten_mien.value, bo_nho_xem_truoc_v042);
            luu_ten_mien(o_nhap_ten_mien.value);
        });

        // Chọn tên miền
        cac_muc_chon.forEach(item => {
            item.addEventListener('click', () => {
                if (o_nhap_ten_mien.disabled) return;
                const gia_tri = item.getAttribute('data-value');
                o_nhap_ten_mien.value = gia_tri;
                cap_nhat_muc_duoc_chon(gia_tri);
                cap_nhat_khung_html_tuy_chinh(gia_tri, bo_nho_xem_truoc_v042);
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

// === Tùy biến màu sắc khi đọc ===

function khoi_tao_tuy_bien_mau_sac(du_lieu_xem_truoc_san = null) {
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

                if (luu_tru && !picker_mau_chu.disabled) {
                    luu_xem_truoc_v042({
                        mau_chu_doc: mau_chu,
                        mau_nen_doc: mau_nen,
                        do_mo_nen_doc: do_mo_val
                    });
                }
            }

            // Nạp màu đã lưu từ gói xem trước
            const ap_dung_du_lieu_mau_sac = (du_lieu) => {
                if (du_lieu) {
                    if (du_lieu.mau_chu_doc) picker_mau_chu.value = du_lieu.mau_chu_doc;
                    if (du_lieu.mau_nen_doc) picker_mau_nen.value = du_lieu.mau_nen_doc;
                    if (typeof du_lieu.do_mo_nen_doc === 'number') slider_do_mo.value = du_lieu.do_mo_nen_doc;
                    cap_nhat_xem_truoc(false);
                }
            };

        if (du_lieu_xem_truoc_san && typeof du_lieu_xem_truoc_san === 'object') {
            ap_dung_du_lieu_mau_sac(du_lieu_xem_truoc_san);
        } else {
            doc_xem_truoc_v042(ap_dung_du_lieu_mau_sac);
        }

        // Màu chữ: input đổi UI, change mới lưu
        picker_mau_chu.addEventListener('input', () => cap_nhat_xem_truoc(false));
        picker_mau_chu.addEventListener('change', () => cap_nhat_xem_truoc(true));
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

        // Màu nền và độ mờ: tách xem trước và lưu
        picker_mau_nen.addEventListener('input', () => cap_nhat_xem_truoc(false));
        picker_mau_nen.addEventListener('change', () => cap_nhat_xem_truoc(true));
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
            slider_do_mo.addEventListener('input', () => cap_nhat_xem_truoc(false));
            slider_do_mo.addEventListener('change', () => cap_nhat_xem_truoc(true));
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

// === Tự động hóa khi đọc truyện ===

function khoi_tao_chuyen_doi_tu_dong(du_lieu_xem_truoc_san = null) {
    const nut_cuon_trang = document.getElementById('setting-auto-scroll');
    const nut_captcha = document.getElementById('setting-auto-captcha');

    const ap_dung_du_lieu_tu_dong = (du_lieu) => {
        if (du_lieu) {
            if (nut_cuon_trang) {
                nut_cuon_trang.checked = giai_ma_bool(du_lieu.tu_dong_cuon_trang, true);
            }
            if (nut_captcha) {
                nut_captcha.checked = giai_ma_bool(du_lieu.tu_dong_vuot_captcha, false);
            }
        }
    };

        if (du_lieu_xem_truoc_san && typeof du_lieu_xem_truoc_san === 'object') {
            ap_dung_du_lieu_tu_dong(du_lieu_xem_truoc_san);
        } else {
            doc_xem_truoc_v042(ap_dung_du_lieu_tu_dong);
        }

        if (nut_cuon_trang) {
            nut_cuon_trang.addEventListener('change', () => {
                if (nut_cuon_trang.disabled) return;
                luu_xem_truoc_v042({ tu_dong_cuon_trang: nut_cuon_trang.checked });
            });
        }

        if (nut_captcha) {
            nut_captcha.addEventListener('change', () => {
                if (nut_captcha.disabled) return;
                luu_xem_truoc_v042({ tu_dong_vuot_captcha: nut_captcha.checked });
            });
        }
    }

// === Sao lưu và khôi phục dữ liệu ===

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
                    chrome.storage.sync.get(null, async dl_dong_bo => {
                        const phien_ban = (typeof chrome !== 'undefined' && chrome.runtime?.getManifest)
                            ? chrome.runtime.getManifest().version
                            : '0.4.1';
                        const du_lieu_xuat = tao_goi_du_lieu_xuat(dl_cuc_bo, dl_dong_bo, phien_ban);
                        await tai_xuong_json(
                            du_lieu_xuat,
                            `DocTruyenSTV_Backup_${new Date().toISOString().slice(0, 10)}.json`
                        );
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
                reader.onload = async (su_kien) => {
                    try {
                        const du_lieu = JSON.parse(su_kien.target.result);
                        if (typeof du_lieu !== 'object' || du_lieu === null || Array.isArray(du_lieu)) {
                            throw new Error('File không hợp lệ');
                        }

                        const ket_qua_chuyen_doi = chuyen_doi_du_lieu_nhap(du_lieu);
                        if (Array.isArray(ket_qua_chuyen_doi.cac_muc_loi) && ket_qua_chuyen_doi.cac_muc_loi.length > 0) {
                            hien_thong_bao(`Từ chối nhập vì sai kiểu dữ liệu ở: ${ket_qua_chuyen_doi.cac_muc_loi.join(', ')}`, 'error');
                            return;
                        }
                        const cuc_bo_sach = ket_qua_chuyen_doi.local || {};
                        const dong_bo_sach = ket_qua_chuyen_doi.sync || {};

                        if (Object.keys(cuc_bo_sach).length === 0 && Object.keys(dong_bo_sach).length === 0) {
                            throw new Error('Không có dữ liệu hợp lệ');
                        }

                        await ghi_de_du_lieu_nhap(cuc_bo_sach, dong_bo_sach, {
                            xoa_khoa_dong_bo_thieu: true,
                            xoa_tu_dien_neu_thieu: true,
                            xoa_danh_sach_rong_neu_thieu: true
                        });

                        const chu_de_nhap = giai_ma_chu_de(dong_bo_sach.giao_dien_chu_de);
                        ap_dung_chu_de(chu_de_nhap || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));

                        // Nạp lại UI xem trước v0.4.2 sau khi nhập
                        const xem_truoc_nhap = (cuc_bo_sach.xem_truoc_v042 && typeof cuc_bo_sach.xem_truoc_v042 === 'object' && !Array.isArray(cuc_bo_sach.xem_truoc_v042))
                            ? cuc_bo_sach.xem_truoc_v042
                            : {};
                        bo_nho_xem_truoc_v042 = xem_truoc_nhap;
                        const ten_mien_nhap = xem_truoc_nhap.cai_dat_ten_mien || cuc_bo_sach.cai_dat_ten_mien || 'sangtacviet.com';
                        const o_mien = document.getElementById('domain-input');
                        if (o_mien) o_mien.value = ten_mien_nhap;
                        document.querySelectorAll('#domain-options-menu .domain-opt-item').forEach(item => {
                            item.classList.toggle('selected', item.getAttribute('data-value') === ten_mien_nhap);
                        });
                        cap_nhat_khung_html_tuy_chinh(ten_mien_nhap, xem_truoc_nhap);

                        const cuon_nhap = xem_truoc_nhap.tu_dong_cuon_trang !== undefined ? xem_truoc_nhap.tu_dong_cuon_trang : cuc_bo_sach.tu_dong_cuon_trang;
                        const vuot_ma_nhap = xem_truoc_nhap.tu_dong_vuot_captcha !== undefined ? xem_truoc_nhap.tu_dong_vuot_captcha : cuc_bo_sach.tu_dong_vuot_captcha;
                        const nut_cuon = document.getElementById('setting-auto-scroll');
                        if (nut_cuon) nut_cuon.checked = giai_ma_bool(cuon_nhap, true);
                        const nut_cap = document.getElementById('setting-auto-captcha');
                        if (nut_cap) nut_cap.checked = giai_ma_bool(vuot_ma_nhap, false);

                        const pk_chu = document.getElementById('setting-text-color');
                        if (pk_chu) pk_chu.value = xem_truoc_nhap.mau_chu_doc || cuc_bo_sach.mau_chu_doc || '#e8a045';
                        const pk_nen = document.getElementById('setting-bg-color');
                        if (pk_nen) pk_nen.value = xem_truoc_nhap.mau_nen_doc || cuc_bo_sach.mau_nen_doc || '#e8a045';
                        const sl_mo = document.getElementById('setting-bg-opacity');
                        const do_mo_nhap = xem_truoc_nhap.do_mo_nen_doc !== undefined ? xem_truoc_nhap.do_mo_nen_doc : cuc_bo_sach.do_mo_nen_doc;
                        if (sl_mo) sl_mo.value = typeof do_mo_nhap === 'number' ? do_mo_nhap : 15;

                        // Làm mới UI xem trước khi đổi độ mờ
                        if (pk_chu) pk_chu.dispatchEvent(new Event('input'));

                        hien_thong_bao('Đã phục hồi toàn bộ dữ liệu tiện ích thành công!', 'success');
                    } catch (loi) {
                        hien_thong_bao('Tệp sao lưu không hợp lệ hoặc bị lỗi cú pháp!', 'error');
                    }
                };
                reader.readAsText(tep);
            });
        }
    }

    // === Lớp phủ xem trước và khởi tạo ===

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
    document.addEventListener('DOMContentLoaded', async () => {
        await chuyen_doi_du_lieu_khoi_chay();

        const chu_de_hien_tai = document.documentElement.getAttribute('data-theme');
        if (chu_de_hien_tai) ap_dung_chu_de(chu_de_hien_tai);

        const nut_doi_chu_de = document.getElementById('btn-toggle-theme');
        if (nut_doi_chu_de) {
            nut_doi_chu_de.addEventListener('click', () => {
                const la_dang_sang = document.documentElement.getAttribute('data-theme') === 'light';
                const chu_de_moi = la_dang_sang ? 'dark' : 'light';
                ap_dung_chu_de(chu_de_moi);
                ghi_cai_dat_kep({ giao_dien_chu_de: chu_de_moi });
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

        // Nạp một lần cấu hình xem trước cho 3 nhóm
        khoi_tao_che_do_xem_truoc_v042();
        khoi_tao_nhap_xuat_cai_dat();
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            doc_xem_truoc_v042((du_lieu_xem_truoc) => {
                khoi_tao_cai_dat_ten_mien(du_lieu_xem_truoc);
                khoi_tao_tuy_bien_mau_sac(du_lieu_xem_truoc);
                khoi_tao_chuyen_doi_tu_dong(du_lieu_xem_truoc);
            });
        } else {
            khoi_tao_cai_dat_ten_mien({});
            khoi_tao_tuy_bien_mau_sac({});
            khoi_tao_chuyen_doi_tu_dong({});
        }
    });
