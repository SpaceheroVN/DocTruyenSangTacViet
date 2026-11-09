import { cau_hinh } from './quan_ly_cau_hinh.js';
import { dieu_khien_trinh_phat } from './dieu_khien_trinh_phat.js';
import { quan_ly_thu_vien } from './quan_ly_thu_vien.js';
import { giao_dien_cai_dat } from './giao_dien_cai_dat.js';
import { chuyen_doi_du_lieu_khoi_chay } from '../chuyen_doi.js';

// Khởi tạo chủ đề sáng tối theo hệ thống hoặc thiết lập đã lưu
export function khoi_tao_chu_de(dat_lai_mac_dinh = false) {
    const truy_van_mau = window.matchMedia('(prefers-color-scheme: light)');
    const ap_dung_chu_de = (chu_de) => {
        document.documentElement.setAttribute('data-theme', chu_de);
        const nut_doi_chu_de = document.getElementById('btn-toggle-theme');
        if (nut_doi_chu_de) {
            nut_doi_chu_de.title = chu_de === 'light' ? 'Chuyển sang chế độ Tối' : 'Chuyển sang chế độ Sáng';
        }
        try {
            if (window.parent && window.parent !== window) {
                window.parent.__chu_de_hien_tai = chu_de;
                window.parent.postMessage({ type: 'STV_THEME_CHANGE', theme: chu_de }, '*');
            }
        } catch (_) {}
    };

    let chu_de_hien_tai = null;
    if (dat_lai_mac_dinh) {
        chu_de_hien_tai = truy_van_mau.matches ? 'light' : 'dark';
        if (cau_hinh && cau_hinh.dat) {
            cau_hinh.dat('giao_dien_chu_de', chu_de_hien_tai, false, true);
        }
    } else {
        const chu_de_da_luu = cau_hinh ? cau_hinh.lay('giao_dien_chu_de', false) : null;
        if (chu_de_da_luu === 'light' || chu_de_da_luu === 'dark') {
            chu_de_hien_tai = chu_de_da_luu;
        } else {
            chu_de_hien_tai = truy_van_mau.matches ? 'light' : 'dark';
            if (cau_hinh && cau_hinh.dat) {
                cau_hinh.dat('giao_dien_chu_de', chu_de_hien_tai, false, true);
            }
        }
    }
    ap_dung_chu_de(chu_de_hien_tai);

    const nut_doi_chu_de = document.getElementById('btn-toggle-theme');
    if (nut_doi_chu_de && !nut_doi_chu_de._da_gan_su_kien) {
        nut_doi_chu_de._da_gan_su_kien = true;
        nut_doi_chu_de.addEventListener('click', () => {
            const la_dang_sang = document.documentElement.getAttribute('data-theme') === 'light';
            const chu_de_moi = la_dang_sang ? 'dark' : 'light';
            ap_dung_chu_de(chu_de_moi);
            if (cau_hinh && cau_hinh.dat) {
                cau_hinh.dat('giao_dien_chu_de', chu_de_moi, false, true);
            }
        });

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
            chrome.storage.onChanged.addListener((thay_doi, vung_chon) => {
                if (vung_chon === 'local' && thay_doi.giao_dien_chu_de) {
                    const chu_de_moi = thay_doi.giao_dien_chu_de.newValue;
                    if (chu_de_moi) ap_dung_chu_de(chu_de_moi);
                }
            });
        }
    }
}

window.DocTruyenSTV_Ext = window.DocTruyenSTV_Ext || {};
window.DocTruyenSTV_Ext.khoi_tao_chu_de = khoi_tao_chu_de;

// Khởi tạo toàn bộ giao diện popup khi sẵn sàng
document.addEventListener('DOMContentLoaded', async () => {
    await chuyen_doi_du_lieu_khoi_chay();
    await cau_hinh.khoi_tao();
    khoi_tao_chu_de();
    quan_ly_thu_vien.khoi_tao();
    giao_dien_cai_dat.khoi_tao();
    dieu_khien_trinh_phat.khoi_tao();
});

// Lưu dữ liệu ngay lập tức khi đóng popup
window.addEventListener('pagehide', () => {
    cau_hinh.luu_ngay_lap_tuc();
    chrome.runtime.sendMessage({ hanhDong: 'huyTaiAmThanh' }).catch(() => {});
});
