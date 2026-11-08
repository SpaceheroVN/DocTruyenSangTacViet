// Tự động chuyển đổi chủ đề sáng tối theo thiết lập đã lưu hoặc hệ thống
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

// Khởi tạo tương tác nút và điều hướng các tab hướng dẫn
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
    const danh_sach_khung_noi_dung = document.querySelectorAll('.content-section');

    danh_sach_nut_tab.forEach(nut_tab => {
        nut_tab.addEventListener('click', () => {
            danh_sach_nut_tab.forEach(nut => nut.classList.remove('active'));
            danh_sach_khung_noi_dung.forEach(khung => khung.classList.remove('active'));

            nut_tab.classList.add('active');
            const ma_khung_dich = 'tab-' + nut_tab.getAttribute('data-tab');
            const khung_dich = document.getElementById(ma_khung_dich);
            if (khung_dich) khung_dich.classList.add('active');
        });
    });
});
