// Điểm khởi tạo popup, chủ đề và mô-đun điều khiển
import { cau_hinh } from './quan_ly_cau_hinh.js';
import { dieu_khien_trinh_phat } from './dieu_khien_trinh_phat.js';
import { quan_ly_thu_vien } from './quan_ly_thu_vien.js';
import { giao_dien_cai_dat } from './giao_dien_cai_dat.js';
import { quan_ly_thong_bao } from './thong_bao.js';
import { chuyen_doi_du_lieu_khoi_chay, giai_ma_chu_de } from '../chuyen_doi.js';

// === Chủ đề và khởi tạo ===

// Khởi tạo chủ đề theo hệ thống hoặc cấu hình
export function khoi_tao_chu_de(dat_lai_mac_dinh = false) {
    const truy_van_mau = window.matchMedia('(prefers-color-scheme: light)');
    const ap_dung_chu_de = (chu_de) => {
        document.documentElement.setAttribute('data-theme', chu_de);
        try {
            localStorage.setItem('stv_theme_cache', chu_de);
        } catch (_) {
            // Bỏ qua nếu không lưu được cache chủ đề
        }
        const nut_doi_chu_de = document.getElementById('btn-toggle-theme');
        if (nut_doi_chu_de) {
            nut_doi_chu_de.title = chu_de === 'light' ? 'Chuyển sang chế độ Tối' : 'Chuyển sang chế độ Sáng';
        }
    };

    let chu_de_hien_tai = null;
    if (dat_lai_mac_dinh) {
        chu_de_hien_tai = truy_van_mau.matches ? 'light' : 'dark';
        if (cau_hinh && cau_hinh.xoa_nhieu_dong_bo) {
            cau_hinh.xoa_nhieu_dong_bo(['giao_dien_chu_de']);
        }
    } else {
        const chu_de_da_luu = cau_hinh ? giai_ma_chu_de(cau_hinh.lay('giao_dien_chu_de', true)) : null;
        chu_de_hien_tai = chu_de_da_luu || (truy_van_mau.matches ? 'light' : 'dark');
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
                cau_hinh.dat('giao_dien_chu_de', chu_de_moi, true, true);
            }
            if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
                chrome.tabs.query({ active: true, currentWindow: true }, (cac_tab) => {
                    if (cac_tab && cac_tab[0] && cac_tab[0].id) {
                        chrome.tabs.sendMessage(cac_tab[0].id, {
                            hanhDong: 'doiChuDe',
                            hanh_dong: 'doi_chu_de',
                            chuDe: chu_de_moi,
                            chu_de: chu_de_moi
                        }).catch(() => {});
                    }
                });
            }
        });

        truy_van_mau.addEventListener('change', (e) => {
            const chu_de_da_luu = cau_hinh ? giai_ma_chu_de(cau_hinh.lay('giao_dien_chu_de', true)) : null;
            if (!chu_de_da_luu) {
                ap_dung_chu_de(e.matches ? 'light' : 'dark');
            }
        });

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
            chrome.storage.onChanged.addListener((thay_doi, vung_chon) => {
                if ((vung_chon === 'sync' || vung_chon === 'local') && thay_doi.giao_dien_chu_de) {
                    const chu_de_moi = giai_ma_chu_de(thay_doi.giao_dien_chu_de.newValue)
                        || (truy_van_mau.matches ? 'light' : 'dark');
                    ap_dung_chu_de(chu_de_moi);
                }
            });
        }
    }
}

window.DocTruyenSTV_Ext = window.DocTruyenSTV_Ext || {};
window.DocTruyenSTV_Ext.khoi_tao_chu_de = khoi_tao_chu_de;

// Khởi tạo giao diện popup
document.addEventListener('DOMContentLoaded', async () => {
    await chuyen_doi_du_lieu_khoi_chay();
    await cau_hinh.khoi_tao();
    khoi_tao_chu_de();
    quan_ly_thu_vien.khoi_tao();
    giao_dien_cai_dat.khoi_tao();
    dieu_khien_trinh_phat.khoi_tao();
    quan_ly_thong_bao.khoi_tao();
});

// Lưu ngay khi đóng popup, giữ TTS nền
window.addEventListener('pagehide', () => {
    cau_hinh.luu_ngay_lap_tuc();
});
