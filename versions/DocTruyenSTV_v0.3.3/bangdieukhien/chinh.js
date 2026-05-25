import { CauHinh } from './cau_hinh.js';
import { DieuKhienTrinhPhat } from './dieu_khien_trinh_phat.js';
import { QuanLyThuVien } from './quan_ly_thu_vien.js';
import { GiaoDienCaiDat } from './giao_dien_cai_dat.js';

document.addEventListener('DOMContentLoaded', async () => {
    await CauHinh.khoiTao();
    QuanLyThuVien.khoiTao();
    GiaoDienCaiDat.khoiTao();
    DieuKhienTrinhPhat.khoiTao();
});
