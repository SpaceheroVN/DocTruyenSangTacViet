// Danh sách truyện đọc, dung lượng và sao lưu
import { cau_hinh } from './quan_ly_cau_hinh.js';
import { giao_dien_cai_dat } from './giao_dien_cai_dat.js';
import { dieu_khien_trinh_phat } from './dieu_khien_trinh_phat.js';
import { quan_ly_thong_bao } from './thong_bao.js';
import { hien_thong_bao, hien_xac_nhan } from './tien_ich.js';
import {
    chuyen_doi_du_lieu_nhap,
    chuan_hoa_danh_sach_truyen,
    ghi_de_du_lieu_nhap,
    giai_ma_bool,
    giai_ma_chu_de,
    giai_ma_che_do_mini_player,
    CAC_KHOA_DONG_BO_CHUAN,
    thuc_thi_khoa_danh_sach_doc,
    tao_goi_du_lieu_xuat,
    tao_data_uri_json,
    tai_xuong_json
} from '../chuyen_doi.js';

// Cuộn chữ Ping-Pong đồng bộ khi hover
class NhomMarqueeDongBo {
    constructor(the_item) {
        this.the_item = the_item;
        this.khung_tieu_de = the_item.querySelector('.marquee-track[data-type="title"]');
        this.chu_tieu_de = the_item.querySelector('.marquee-text.list-name');
        this.khung_chuong = the_item.querySelector('.marquee-track[data-type="chap"]');
        this.chu_chuong = the_item.querySelector('.marquee-text.list-chap');

        this._da_huy = false;
        this._dang_chay = false;
        this._dang_hover = false;
        this._id_hen_gio = null;
        this._giai_quyet_cho = null;
        this._danh_sach_huy_cuon = [];
        this._id_reset_transition = null;

        this.do_trang_tieu_de = 0;
        this.do_trang_chuong = 0;
        this.thoi_luong_tieu_de = 0;
        this.thoi_luong_chuong = 0;

        // Chỉ chạy khi rê chuột vào mục truyện
        this._xu_ly_mouse_enter = () => this.khi_hover_vao();
        this._xu_ly_mouse_leave = () => this.khi_roi_khoi();
        this.the_item.addEventListener('mouseenter', this._xu_ly_mouse_enter);
        this.the_item.addEventListener('mouseleave', this._xu_ly_mouse_leave);
    }

    khi_hover_vao() {
        if (this._da_huy) return;
        this._dang_hover = true;
        this.bat_dau();
    }

    khi_roi_khoi() {
        if (this._da_huy) return;
        this._dang_hover = false;
        this.dung(true);
    }

    tinh_toan() {
        if (!this.khung_tieu_de || !this.chu_tieu_de || !this.khung_chuong || !this.chu_chuong) return false;

        const rong_khung_tieu_de = this.khung_tieu_de.clientWidth;
        const rong_chu_tieu_de = this.chu_tieu_de.scrollWidth;
        const rong_khung_chuong = this.khung_chuong.clientWidth;
        const rong_chu_chuong = this.chu_chuong.scrollWidth;

        // Bỏ qua tính nếu phần tử chưa hiển thị
        if (rong_khung_tieu_de <= 0) return false;

        this.do_trang_tieu_de = Math.max(0, rong_chu_tieu_de - rong_khung_tieu_de);
        this.do_trang_chuong = Math.max(0, rong_chu_chuong - rong_khung_chuong);

        const tieu_de_trang = this.do_trang_tieu_de > 2;
        const chuong_trang = this.do_trang_chuong > 2;

        if (tieu_de_trang) {
            const so_ky_tu = Math.max(1, (this.chu_tieu_de.textContent || '').trim().length);
            const px_moi_ky_tu = rong_chu_tieu_de / so_ky_tu;
            const so_ky_tu_trang = Math.max(1, Math.round(this.do_trang_tieu_de / px_moi_ky_tu));
            // Tốc độ 150ms cho mỗi ký tự tràn
            this.thoi_luong_tieu_de = Math.round(so_ky_tu_trang * 150);
            this.khung_tieu_de.classList.add('has-overflow');
        } else {
            this.do_trang_tieu_de = 0;
            this.thoi_luong_tieu_de = 0;
            this.khung_tieu_de.classList.remove('has-overflow', 'is-scrolling', 'is-at-end');
            this.chu_tieu_de.style.transform = '';
            this.chu_tieu_de.style.transition = '';
        }

        if (chuong_trang) {
            const so_ky_tu = Math.max(1, (this.chu_chuong.textContent || '').trim().length);
            const px_moi_ky_tu = rong_chu_chuong / so_ky_tu;
            const so_ky_tu_trang = Math.max(1, Math.round(this.do_trang_chuong / px_moi_ky_tu));
            // Tốc độ 150ms cho mỗi ký tự tràn
            this.thoi_luong_chuong = Math.round(so_ky_tu_trang * 150);
            this.khung_chuong.classList.add('has-overflow');
        } else {
            this.do_trang_chuong = 0;
            this.thoi_luong_chuong = 0;
            this.khung_chuong.classList.remove('has-overflow', 'is-scrolling', 'is-at-end');
            this.chu_chuong.style.transform = '';
            this.chu_chuong.style.transition = '';
        }

        return tieu_de_trang || chuong_trang;
    }

    bat_dau() {
        if (this._da_huy || !this._dang_hover || this._dang_chay) return;
        const co_chuyen_dong = this.tinh_toan();
        if (!co_chuyen_dong) return;

        this._dang_chay = true;
        this._chay_chu_trinh();
    }

    _cho(ms) {
        return new Promise(resolve => {
            this._giai_quyet_cho = resolve;
            this._id_hen_gio = setTimeout(() => {
                this._id_hen_gio = null;
                this._giai_quyet_cho = null;
                resolve();
            }, ms);
        });
    }

    _cuon(el, khung, x, thoi_luong) {
        return new Promise(resolve => {
            if (this._da_huy || !this._dang_chay || !this._dang_hover) return resolve();
            if (thoi_luong > 0) {
                khung.classList.add('is-scrolling');
                khung.classList.remove('is-at-end');
                el.style.transition = `transform ${thoi_luong}ms linear`;
                el.style.transform = `translateX(${x}px)`;

                let da_xong = false;
                const ket_thuc = () => {
                    if (da_xong) return;
                    da_xong = true;
                    el.removeEventListener('transitionend', ket_thuc);
                    if (x < 0) {
                        khung.classList.remove('is-scrolling');
                        khung.classList.add('is-at-end');
                    } else {
                        khung.classList.remove('is-scrolling', 'is-at-end');
                    }
                    resolve();
                };

                el.addEventListener('transitionend', ket_thuc, { once: true });
                const timer_id = setTimeout(ket_thuc, thoi_luong + 50);

                // Ngắt sớm và dọn listener khi rời chuột
                this._danh_sach_huy_cuon.push(() => {
                    if (!da_xong) {
                        da_xong = true;
                        clearTimeout(timer_id);
                        el.removeEventListener('transitionend', ket_thuc);
                        resolve();
                    }
                });
            } else {
                el.style.transition = 'none';
                el.style.transform = `translateX(${x}px)`;
                khung.classList.remove('is-scrolling', 'is-at-end');
                resolve();
            }
        });
    }

    async _chay_chu_trinh() {
        while (this._dang_chay && this._dang_hover && !this._da_huy) {
            // Chờ 1500ms tại vị trí 0 trước khi cuộn
            await this._cho(1500);
            if (!this._dang_chay || !this._dang_hover || this._da_huy) break;

            const cuon_tieu_de = this.do_trang_tieu_de > 0;
            const cuon_chuong = this.do_trang_chuong > 0;
            if (!cuon_tieu_de && !cuon_chuong) break;

            // Cuộn đồng thời sang trái đến -do_trang
            const loi_hua_tien = [];
            if (cuon_tieu_de) {
                loi_hua_tien.push(this._cuon(this.chu_tieu_de, this.khung_tieu_de, -this.do_trang_tieu_de, this.thoi_luong_tieu_de));
            }
            if (cuon_chuong) {
                loi_hua_tien.push(this._cuon(this.chu_chuong, this.khung_chuong, -this.do_trang_chuong, this.thoi_luong_chuong));
            }

            // Chờ cả hai cùng chạm đích mới tiếp tục
            await Promise.all(loi_hua_tien);
            if (!this._dang_chay || !this._dang_hover || this._da_huy) break;

            // Chờ 1500ms ở cuối trước khi cuộn ngược
            await this._cho(1500);
            if (!this._dang_chay || !this._dang_hover || this._da_huy) break;

            // Chạy ngược lại về điểm xuất phát ban đầu
            const loi_hua_lui = [];
            if (cuon_tieu_de) {
                loi_hua_lui.push(this._cuon(this.chu_tieu_de, this.khung_tieu_de, 0, this.thoi_luong_tieu_de));
            }
            if (cuon_chuong) {
                loi_hua_lui.push(this._cuon(this.chu_chuong, this.khung_chuong, 0, this.thoi_luong_chuong));
            }

            // Chờ cả hai cùng về đến điểm xuất phát
            await Promise.all(loi_hua_lui);
            if (!this._dang_chay || !this._dang_hover || this._da_huy) break;

            // Nghỉ 1500ms rồi lặp lại nếu còn hover
        }
    }

    dung(muot_ma = true) {
        this._dang_chay = false;

        if (this._id_hen_gio) {
            clearTimeout(this._id_hen_gio);
            this._id_hen_gio = null;
        }
        if (this._giai_quyet_cho) {
            const giai_quyet = this._giai_quyet_cho;
            this._giai_quyet_cho = null;
            giai_quyet();
        }
        if (this._danh_sach_huy_cuon && this._danh_sach_huy_cuon.length > 0) {
            const danh_sach = [...this._danh_sach_huy_cuon];
            this._danh_sach_huy_cuon = [];
            danh_sach.forEach(fn => fn());
        }

        if (this._id_reset_transition) {
            clearTimeout(this._id_reset_transition);
            this._id_reset_transition = null;
        }

        if (muot_ma) {
            // Lướt êm ái về vị trí ban đầu trong 0.25s
            if (this.chu_tieu_de) {
                this.chu_tieu_de.style.transition = 'transform 0.25s ease-out';
                this.chu_tieu_de.style.transform = 'translateX(0px)';
            }
            if (this.chu_chuong) {
                this.chu_chuong.style.transition = 'transform 0.25s ease-out';
                this.chu_chuong.style.transform = 'translateX(0px)';
            }
            this._id_reset_transition = setTimeout(() => {
                if (!this._dang_hover) {
                    if (this.chu_tieu_de) this.chu_tieu_de.style.transition = '';
                    if (this.chu_chuong) this.chu_chuong.style.transition = '';
                }
            }, 260);
        } else {
            if (this.chu_tieu_de) {
                this.chu_tieu_de.style.transition = 'none';
                this.chu_tieu_de.style.transform = 'translateX(0px)';
            }
            if (this.chu_chuong) {
                this.chu_chuong.style.transition = 'none';
                this.chu_chuong.style.transform = 'translateX(0px)';
            }
        }

        if (this.khung_tieu_de) this.khung_tieu_de.classList.remove('is-scrolling', 'is-at-end');
        if (this.khung_chuong) this.khung_chuong.classList.remove('is-scrolling', 'is-at-end');
    }

    huy() {
        this._da_huy = true;
        this._dang_hover = false;
        if (this.the_item) {
            this.the_item.removeEventListener('mouseenter', this._xu_ly_mouse_enter);
            this.the_item.removeEventListener('mouseleave', this._xu_ly_mouse_leave);
        }
        this.dung(false);
    }
}

export const quan_ly_thu_vien = {
    danh_sach_doc: [],
    che_do_sap_xep: 'recent',
    danh_sach_marquee: [],
    _da_gan_quan_sat_panel: false,
    _che_do_nhap_du_lieu: 'toan_bo',

    url_an_toan(url) {
        if (!url || typeof url !== 'string') return '';
        try {
            const parsed = new URL(url.trim());
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href;
            return '';
        } catch (e) { return ''; }
    },

    async khoi_tao() {
        this.gan_quan_sat_panel();
        this.tai_danh_sach_doc();
        this.gan_su_kien_thu_vien();
        this.cap_nhat_dung_luong();
    },

    gan_quan_sat_panel() {
        if (this._da_gan_quan_sat_panel) return;
        this._da_gan_quan_sat_panel = true;

        const panel = document.getElementById('panel-reading-list');
        if (!panel) return;

        if (window.ResizeObserver) {
            const observer = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    if (entry.contentRect.width > 50) {
                        this.kich_hoat_marquee();
                    } else {
                        this.tam_dung_marquee();
                    }
                }
            });
            observer.observe(panel);
        }
    },

    huy_toan_bo_marquee() {
        if (this.danh_sach_marquee && this.danh_sach_marquee.length > 0) {
            this.danh_sach_marquee.forEach(m => m.huy());
            this.danh_sach_marquee = [];
        }
    },

    kich_hoat_marquee() {
        if (this.danh_sach_marquee && this.danh_sach_marquee.length > 0) {
            requestAnimationFrame(() => {
                this.danh_sach_marquee.forEach(m => {
                    m.tinh_toan();
                    if (m._dang_hover) m.bat_dau();
                });
            });
        }
    },

    tam_dung_marquee() {
        if (this.danh_sach_marquee && this.danh_sach_marquee.length > 0) {
            this.danh_sach_marquee.forEach(m => m.dung(false));
        }
    },

    // Sắp xếp và nạp danh sách truyện từ local
    sap_xep_danh_sach(danh_sach) {
        const mang = [...danh_sach];
        if (this.che_do_sap_xep === 'az') mang.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'vi'));
        else if (this.che_do_sap_xep === 'chapters') mang.sort((a, b) => (b.chunkTotal || 0) - (a.chunkTotal || 0));
        else mang.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        return mang;
    },

    tai_danh_sach_doc() {
        chrome.storage.local.get('readingList', d => {
            this.danh_sach_doc = d.readingList || [];
            this.hien_thi_danh_sach(this.sap_xep_danh_sach(this.danh_sach_doc));
            const so_luong = document.getElementById('info-count');
            if (so_luong) so_luong.textContent = `${this.danh_sach_doc.length} truyện`;
        });
    },

    hien_thi_danh_sach(danh_sach) {
        this.huy_toan_bo_marquee();

        const vung_danh_sach = document.getElementById('list-container');
        if (!vung_danh_sach) return;
        if (!danh_sach.length) {
            vung_danh_sach.innerHTML = '<div class="list-empty">Chưa có truyện nào được lưu.</div>';
            return;
        }

        const ANH_KHUYET = 'icons/icon128.png';
        const fragment = document.createDocumentFragment();

        danh_sach.forEach((m, index) => {
            let mau_ngay = 'var(--text-muted)';
            let text_ngay = m.savedAt || '';
            if (m.timestamp) {
                const so_ngay = (Date.now() - m.timestamp) / (1000 * 60 * 60 * 24);
                if (so_ngay > 60) mau_ngay = '#888888';
                else if (so_ngay > 30) mau_ngay = 'var(--danger)';
                else if (so_ngay > 15) mau_ngay = 'var(--warning)';
                if (!text_ngay) text_ngay = new Date(m.timestamp).toLocaleDateString('vi-VN');
            }
            if (!text_ngay) text_ngay = new Date().toLocaleDateString('vi-VN');

            const anh_an_toan = this.url_an_toan(m.imgUrl) || ANH_KHUYET;

            const the_item = document.createElement('div');
            the_item.className = 'list-item';
            the_item.dataset.url = m.url || '';
            the_item.id = `list-item-${index}`;
            the_item.title = 'Nhấn để mở truyện';

            // Cột 1: Ảnh đại diện truyện
            const cot_anh = document.createElement('div');
            cot_anh.className = 'list-col-thumb';
            const img = document.createElement('img');
            img.className = 'list-thumb';
            img.src = anh_an_toan;
            img.alt = '';
            img.referrerPolicy = 'no-referrer';
            img.onerror = () => { img.src = ANH_KHUYET; };
            cot_anh.appendChild(img);
            the_item.appendChild(cot_anh);

            // Cột 2: Tên truyện, chương và đoạn đọc
            const cot_thong_tin = document.createElement('div');
            cot_thong_tin.className = 'list-col-info';

            // Hàng 1: Tên truyện
            const hang_tieu_de = document.createElement('div');
            hang_tieu_de.className = 'list-row list-row-title';
            const khung_tieu_de = document.createElement('div');
            khung_tieu_de.className = 'marquee-track';
            khung_tieu_de.dataset.type = 'title';
            const text_tieu_de = document.createElement('span');
            text_tieu_de.className = 'marquee-text list-name list-name-text';
            const tieu_de_day_du = (m.title || '').trim();
            text_tieu_de.textContent = tieu_de_day_du || 'Không có tên';
            text_tieu_de.title = tieu_de_day_du || 'Chưa rõ';
            khung_tieu_de.appendChild(text_tieu_de);
            hang_tieu_de.appendChild(khung_tieu_de);
            cot_thong_tin.appendChild(hang_tieu_de);

            // Hàng 2: Tên chương hiện tại
            const hang_chuong = document.createElement('div');
            hang_chuong.className = 'list-row list-row-chap';
            const khung_chuong = document.createElement('div');
            khung_chuong.className = 'marquee-track';
            khung_chuong.dataset.type = 'chap';
            const text_chuong = document.createElement('span');
            text_chuong.className = 'marquee-text list-chap list-chap-text';
            const chuong_chuan = (m.chap && m.chap !== '...' && m.chap !== 'Chưa đọc chương nào') ? m.chap : 'Chưa đọc';
            text_chuong.textContent = chuong_chuan;
            text_chuong.title = (chuong_chuan && chuong_chuan !== 'Chưa đọc') ? chuong_chuan : 'Chưa rõ';
            khung_chuong.appendChild(text_chuong);
            hang_chuong.appendChild(khung_chuong);
            cot_thong_tin.appendChild(hang_chuong);

            // Hàng 3: Đoạn đọc hiện tại
            const hang_doan = document.createElement('div');
            hang_doan.className = 'list-row list-row-chunk';
            const huy_hieu_doan = document.createElement('span');
            huy_hieu_doan.className = 'list-chunk-badge';
            const co_doan = (m.chunkIndex && Number(m.chunkIndex) > 0 && chuong_chuan !== 'Chưa đọc');
            const nhan_doan = co_doan ? `Đoạn ${m.chunkIndex}` : 'Chưa xác định';
            huy_hieu_doan.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;"><polygon points="6 3 20 12 6 21 6 3" fill="currentColor"/></svg>${nhan_doan}`;
            hang_doan.appendChild(huy_hieu_doan);
            cot_thong_tin.appendChild(hang_doan);

            the_item.appendChild(cot_thong_tin);

            // Cột 3: Ngày tháng năm xem
            const cot_ngay = document.createElement('div');
            cot_ngay.className = 'list-col-date';
            const span_ngay = document.createElement('span');
            span_ngay.className = 'list-date-text';
            span_ngay.style.color = mau_ngay;
            span_ngay.textContent = text_ngay;
            cot_ngay.appendChild(span_ngay);
            the_item.appendChild(cot_ngay);

            // Cột 4: Nút X xóa truyện
            const cot_hanh_dong = document.createElement('div');
            cot_hanh_dong.className = 'list-col-action';
            const nut_xoa = document.createElement('button');
            nut_xoa.className = 'btn-remove';
            nut_xoa.dataset.title = m.title || '';
            nut_xoa.title = 'Xóa khỏi danh sách';
            nut_xoa.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
            cot_hanh_dong.appendChild(nut_xoa);
            the_item.appendChild(cot_hanh_dong);

            fragment.appendChild(the_item);

            // Gắn nhóm Marquee đồng bộ
            const nhom_marquee = new NhomMarqueeDongBo(the_item);
            this.danh_sach_marquee.push(nhom_marquee);
        });

        vung_danh_sach.replaceChildren(fragment);
        this.kich_hoat_marquee();

        if (!this._da_gan_su_kien_danh_sach) {
            this._da_gan_su_kien_danh_sach = true;
            vung_danh_sach.addEventListener('click', (e) => {
                const nut_xoa = e.target.closest('.btn-remove');
                if (nut_xoa) {
                    e.stopPropagation();
                    this.xoa_khoi_danh_sach(nut_xoa.dataset.title);
                    return;
                }
                const the_item = e.target.closest('.list-item');
                if (the_item) {
                    const url = the_item.dataset.url;
                    if (url && /^https?:\/\//.test(url)) window.open(url, '_blank');
                }
            });
        }
    },

    // Xóa truyện và đồng bộ nút Lưu
    xoa_khoi_danh_sach(tieu_de) {
        thuc_thi_khoa_danh_sach_doc(() => new Promise(hoan_tat => {
            chrome.storage.local.get('readingList', d => {
                const mang = (d && Array.isArray(d.readingList)) ? [...d.readingList] : [];
                const vi_tri = mang.findIndex(m => m.title === tieu_de);
                if (vi_tri !== -1) mang.splice(vi_tri, 1);
                chrome.storage.local.set({ readingList: mang }, () => {
                    this.danh_sach_doc = mang;
                    this.tai_danh_sach_doc();
                    if (dieu_khien_trinh_phat.thong_tin_truyen_hien_tai &&
                        (dieu_khien_trinh_phat.thong_tin_truyen_hien_tai.bookTitle || '').trim().toLowerCase() === (tieu_de || '').trim().toLowerCase()) {
                        dieu_khien_trinh_phat.dat_trang_thai_luu(false);
                    }
                    this.cap_nhat_dung_luong();
                    hien_thong_bao('Đã xóa khỏi thư viện', 'success');
                    hoan_tat();
                });
            });
        }));
    },

    _dinh_dang_dung_luong(bytes, han_muc_bytes, luon_dung_kb = false) {
        const da_dung_kb = bytes / 1024;
        const han_muc_kb = han_muc_bytes / 1024;
        if (luon_dung_kb) {
            const text_da_dung = bytes === 0
                ? '0'
                : (da_dung_kb < 10 ? da_dung_kb.toFixed(2) : da_dung_kb.toFixed(1));
            const text_han_muc = han_muc_kb >= 1024
                ? Math.round(han_muc_kb).toLocaleString('en-US')
                : han_muc_kb.toFixed(0);
            return `${text_da_dung} / ${text_han_muc} KB`;
        }
        const tong_mb = (han_muc_bytes / (1024 * 1024)).toFixed(2);
        if (bytes < 1024 * 1024) {
            const text_kb = bytes === 0
                ? '0'
                : (da_dung_kb < 10 ? da_dung_kb.toFixed(2) : (da_dung_kb < 100 ? da_dung_kb.toFixed(1) : Math.round(da_dung_kb).toString()));
            return `${text_kb} KB / ${tong_mb} MB`;
        }
        const da_dung_mb = (bytes / (1024 * 1024)).toFixed(2);
        return `${da_dung_mb} / ${tong_mb} MB`;
    },

    _cap_nhat_mot_thanh_dung_luong({ vung_luu, han_muc_mac_dinh, id_chu, id_thanh, id_canh_bao, luon_dung_kb = false }) {
        if (!vung_luu || !vung_luu.getBytesInUse) return;
        vung_luu.getBytesInUse(null, bytes => {
            if (chrome.runtime && chrome.runtime.lastError) return;
            const so_byte = typeof bytes === 'number' ? bytes : 0;
            const han_muc_bytes = vung_luu.QUOTA_BYTES || han_muc_mac_dinh;
            const ty_le_that = han_muc_bytes > 0 ? (so_byte / han_muc_bytes) * 100 : 0;
            const do_rong_bar = so_byte > 0 ? Math.min(100, Math.max(1.5, ty_le_that)) : 0;

            const text_el = document.getElementById(id_chu);
            if (text_el) {
                text_el.textContent = this._dinh_dang_dung_luong(so_byte, han_muc_bytes, luon_dung_kb);
                const kb_hien_tai = (so_byte / 1024).toFixed(2);
                const kb_han_muc = Math.round(han_muc_bytes / 1024).toLocaleString('vi-VN');
                text_el.title = `${so_byte.toLocaleString('vi-VN')} bytes (${kb_hien_tai} / ${kb_han_muc} KB · ${ty_le_that.toFixed(2)}%)`;
            }

            const bar_el = document.getElementById(id_thanh);
            if (bar_el) {
                bar_el.style.width = `${do_rong_bar}%`;
                if (ty_le_that >= 90) bar_el.style.background = 'var(--danger)';
                else if (ty_le_that >= 70) bar_el.style.background = 'var(--warning)';
                else bar_el.style.background = 'var(--success)';
            }

            const warning_el = document.getElementById(id_canh_bao);
            if (warning_el) {
                warning_el.style.display = ty_le_that >= 90 ? 'block' : 'none';
            }
        });
    },

    _tinh_byte_nhom(du_lieu, danh_sach_khoa) {
        if (!du_lieu || !danh_sach_khoa) return 0;
        if (!this._bo_ma_utf8) this._bo_ma_utf8 = new TextEncoder();
        let tong = 0;
        for (const khoa of danh_sach_khoa) {
            if (du_lieu[khoa] !== undefined) {
                try {
                    tong += this._bo_ma_utf8.encode(khoa + JSON.stringify(du_lieu[khoa])).length;
                } catch (_) { }
            }
        }
        return tong;
    },

    _dinh_dang_byte_ngan(bytes) {
        if (!bytes || bytes <= 0) return '0 B';
        if (bytes < 1024) return `${bytes} B`;
        const kb = bytes / 1024;
        if (kb < 1024) {
            return `${kb < 10 ? kb.toFixed(2) : (kb < 100 ? kb.toFixed(1) : Math.round(kb))} KB`;
        }
        return `${(kb / 1024).toFixed(2)} MB`;
    },

    _render_chi_tiet_luu_tru(khung, mo_ta_chung, cac_muc) {
        if (!khung) return;
        khung.replaceChildren();

        const tieu_de = document.createElement('div');
        tieu_de.className = 'storage-details-summary';
        tieu_de.textContent = mo_ta_chung;
        khung.appendChild(tieu_de);

        const danh_sach = document.createElement('div');
        danh_sach.className = 'storage-details-list';

        for (const muc of cac_muc) {
            const dong = document.createElement('div');
            dong.className = 'storage-details-item';

            const chinh = document.createElement('div');
            chinh.className = 'storage-details-main';

            const ten = document.createElement('span');
            ten.className = 'storage-details-name';
            ten.textContent = muc.ten;
            chinh.appendChild(ten);

            if (muc.mo_ta) {
                const phu = document.createElement('span');
                phu.className = 'storage-details-desc';
                phu.textContent = `· ${muc.mo_ta}`;
                chinh.appendChild(phu);
            }

            const kich_thuoc = document.createElement('span');
            kich_thuoc.className = 'storage-details-size';
            kich_thuoc.textContent = this._dinh_dang_byte_ngan(muc.so_byte);

            dong.appendChild(chinh);
            dong.appendChild(kich_thuoc);
            danh_sach.appendChild(dong);
        }

        khung.appendChild(danh_sach);
    },

    _mo_ta_hen_dung(d) {
        if (d.customStopConfig) return 'tùy chỉnh';
        if (d.stopRealtimeTarget) return `lúc ${d.stopRealtimeTarget}`;
        if (d.stopAfterChapters) return `sau ${d.stopAfterChapters} chương`;
        if (d.stopTime) return `sau ${d.stopTime} phút`;
        return 'chưa đặt';
    },

    _mo_ta_may_doc_giong(d) {
        const ten_may_doc = (!d.maydoc || d.maydoc === 'web')
            ? 'Web TTS'
            : (d.maydoc === 'auto' ? 'Tự động' : d.maydoc);
        return d.voiceName ? `${ten_may_doc}, ${d.voiceName}` : ten_may_doc;
    },

    // Hiện chi tiết dữ liệu trong sync
    _cap_nhat_chi_tiet_dong_bo() {
        const khung = document.getElementById('sync-storage-details');
        if (!khung || !chrome.storage || !chrome.storage.sync) return;

        const hien_thi_chi_tiet = (du_lieu) => {
            const d = du_lieu || {};

            const toc_do = d.speed !== undefined ? d.speed : 1;
            const am_luong = Math.round((d.volume !== undefined ? d.volume : 1) * 100);
            const chu_de_ma = giai_ma_chu_de(d.giao_dien_chu_de);
            const chu_de = chu_de_ma === 'light' ? 'Sáng' : (chu_de_ma === 'dark' ? 'Tối' : 'Theo hệ thống');
            const nghi_phay = d.pauseComma !== undefined ? d.pauseComma : 300;
            const nghi_cham = d.pauseDot !== undefined ? d.pauseDot : 800;
            const nghi_doan = d.pausePara !== undefined ? d.pausePara : (d.smartPauses !== undefined ? d.smartPauses : 1200);
            const tu_qua_chuong = giai_ma_bool(d.tudongchuyenchuong, true) ? 'Bật' : 'Tắt';
            const doc_ten_truyen = giai_ma_bool(d.doctentruyen, true) ? 'Bật' : 'Tắt';
            const doc_ten_chuong = giai_ma_bool(d.doctenchuong, true) ? 'Bật' : 'Tắt';
            const phim_tat = giai_ma_bool(d.batphimtat, true) ? 'Bật' : 'Tắt';
            const mo_ta_cong_cu = `Phím tắt ${phim_tat}${d.customShortcuts ? ' (đã sửa)' : ''}, dừng: ${this._mo_ta_hen_dung(d)}`;
            const che_do_mini_ma = giai_ma_che_do_mini_player(d.miniPlayerMode);
            const che_do_mini = che_do_mini_ma === 'chunk' ? 'chunk' : 'Mặc định';
            const da_thu_nho_mini = giai_ma_bool(d.isMiniPlayerMinimized, false);
            const hien_chuong = giai_ma_bool(d.hien_chuong_thong_bao, true) ? 'bật' : 'tắt';
            const mo_ta_mini = `${che_do_mini}${da_thu_nho_mini ? ', thu nhỏ' : ''}, chuông ${hien_chuong}`;

            const cac_muc = [
                { ten: 'Tốc độ phát', mo_ta: `${toc_do}x`, so_byte: this._tinh_byte_nhom(d, ['speed']) },
                { ten: 'Âm lượng', mo_ta: `${am_luong}%`, so_byte: this._tinh_byte_nhom(d, ['volume']) },
                { ten: 'Tự qua chương', mo_ta: tu_qua_chuong, so_byte: this._tinh_byte_nhom(d, ['tudongchuyenchuong']) },
                { ten: 'Chủ đề giao diện', mo_ta: chu_de, so_byte: this._tinh_byte_nhom(d, ['giao_dien_chu_de']) },
                { ten: 'Đọc tên truyện / chương', mo_ta: `${doc_ten_truyen} / ${doc_ten_chuong}`, so_byte: this._tinh_byte_nhom(d, ['doctentruyen', 'doctenchuong']) },
                { ten: 'Khoảng nghỉ', mo_ta: `${nghi_phay} / ${nghi_cham} / ${nghi_doan} ms`, so_byte: this._tinh_byte_nhom(d, ['pauseComma', 'pauseDot', 'pausePara', 'smartPauses']) },
                { ten: 'Máy đọc & giọng đọc', mo_ta: this._mo_ta_may_doc_giong(d), so_byte: this._tinh_byte_nhom(d, ['maydoc', 'voiceIndex', 'voiceName', 'thayNhanhWeb']) },
                { ten: 'Công cụ nhanh', mo_ta: mo_ta_cong_cu, so_byte: this._tinh_byte_nhom(d, ['batphimtat', 'customShortcuts', 'customStopConfig', 'stopTime', 'stopRealtimeTarget', 'stopAfterChapters']) },
                { ten: 'Mini player & thông báo', mo_ta: mo_ta_mini, so_byte: this._tinh_byte_nhom(d, ['miniPlayerMode', 'isMiniPlayerMinimized', 'miniPlayerPos', 'mpLeft', 'mpBottom', 'hien_chuong_thong_bao']) }
            ];

            const tap_khoa_chuan = new Set(CAC_KHOA_DONG_BO_CHUAN);
            const khoa_khac = Object.keys(d).filter(k => !tap_khoa_chuan.has(k));
            if (khoa_khac.length > 0) {
                cac_muc.push({
                    ten: 'Dữ liệu khác',
                    mo_ta: `${khoa_khac.length} mục`,
                    so_byte: this._tinh_byte_nhom(d, khoa_khac)
                });
            }

            this._render_chi_tiet_luu_tru(khung, 'Đồng bộ toàn bộ cài đặt (trừ quy tắc phát âm & xem trước v0.4.2):', cac_muc);
        };

        if (cau_hinh && Object.keys(cau_hinh.du_lieu_dong_bo || {}).length > 0) {
            hien_thi_chi_tiet(cau_hinh.du_lieu_dong_bo);
            return;
        }

        chrome.storage.sync.get(null, du_lieu => {
            if (chrome.runtime && chrome.runtime.lastError) return;
            hien_thi_chi_tiet(du_lieu);
        });
    },

    _cap_nhat_chi_tiet_cuc_bo() {
        const khung = document.getElementById('local-storage-details');
        if (!khung || !chrome.storage || !chrome.storage.local) return;

        const hien_thi_cuc_bo = (du_lieu) => {
            const d = du_lieu || {};
            const tat_ca_khoa = Object.keys(d);

            const ds_truyen = Array.isArray(d.readingList) ? d.readingList : [];
            const khoa_meta = tat_ca_khoa.filter(k => k.startsWith('meta_') || k.startsWith('bia_'));
            const khoa_truyen = ['readingList', 'last_active_state', 'stv_tab_dang_phat', ...khoa_meta];

            const khoa_api = ['customEngines', 'fpt_key', 'azure_key', 'azure_region', 'gcp_key'];
            const so_key = ['fpt_key', 'azure_key', 'gcp_key'].filter(k => Boolean(d[k])).length;
            const so_nguon = Array.isArray(d.customEngines) ? d.customEngines.length : 0;
            const phan_mo_ta_api = [];
            if (so_key > 0) phan_mo_ta_api.push(`${so_key} API key`);
            if (so_nguon > 0) phan_mo_ta_api.push(`${so_nguon} nguồn`);

            const khoa_tu_dien = ['customDict'];
            const so_tu = Array.isArray(d.customDict) ? d.customDict.length : 0;

            const khoa_xem_truoc = ['xem_truoc_v042'];
            const xem_truoc = (d.xem_truoc_v042 && typeof d.xem_truoc_v042 === 'object') ? d.xem_truoc_v042 : null;
            const mo_ta_xem_truoc = xem_truoc
                ? `${xem_truoc.cai_dat_ten_mien || 'sangtacviet.com'}, tách khỏi sync`
                : 'Chưa thiết lập';

            const tap_dong_bo_hien_hanh = CAC_KHOA_DONG_BO_CHUAN.filter(k => k !== 'smartPauses');
            const khoa_dong_bo_trong_may = tap_dong_bo_hien_hanh.filter(k => d[k] !== undefined);
            const tap_da_xep = new Set([...khoa_truyen, ...khoa_api, ...khoa_tu_dien, ...khoa_xem_truoc, ...CAC_KHOA_DONG_BO_CHUAN]);
            const khoa_con_lai = tat_ca_khoa.filter(k => !tap_da_xep.has(k));

            const cac_muc = [
                {
                    ten: 'Truyện & tiến độ đọc',
                    mo_ta: khoa_meta.length > 0 ? `${ds_truyen.length} truyện, ${khoa_meta.length} dữ liệu kèm` : `${ds_truyen.length} truyện`,
                    so_byte: this._tinh_byte_nhom(d, khoa_truyen)
                },
                {
                    ten: 'Quy tắc phát âm',
                    mo_ta: `${so_tu} mục (chỉ lưu cục bộ)`,
                    so_byte: this._tinh_byte_nhom(d, khoa_tu_dien)
                },
                {
                    ten: 'API Key & nguồn TTS',
                    mo_ta: phan_mo_ta_api.length > 0 ? phan_mo_ta_api.join(', ') : 'Chưa lưu',
                    so_byte: this._tinh_byte_nhom(d, khoa_api)
                },
                {
                    ten: 'Bản sao cài đặt đồng bộ',
                    mo_ta: `${khoa_dong_bo_trong_may.length} / ${tap_dong_bo_hien_hanh.length} mục`,
                    so_byte: this._tinh_byte_nhom(d, CAC_KHOA_DONG_BO_CHUAN)
                }
            ];

            if (d.xem_truoc_v042 !== undefined) {
                cac_muc.push({
                    ten: 'Xem trước v0.4.2 (chỉ cục bộ)',
                    mo_ta: mo_ta_xem_truoc,
                    so_byte: this._tinh_byte_nhom(d, khoa_xem_truoc)
                });
            }

            cac_muc.push({
                ten: 'Bộ nhớ đệm & hệ thống',
                mo_ta: `${khoa_con_lai.length} mục (hẹn giờ, cache thông báo, phiên bản)`,
                so_byte: this._tinh_byte_nhom(d, khoa_con_lai)
            });

            this._render_chi_tiet_luu_tru(khung, 'Lưu trữ toàn bộ dữ liệu trên thiết bị này:', cac_muc);
        };

        if (cau_hinh && Object.keys(cau_hinh.du_lieu_cuc_bo || {}).length > 0) {
            hien_thi_cuc_bo(cau_hinh.du_lieu_cuc_bo);
            return;
        }

        chrome.storage.local.get(null, du_lieu => {
            if (chrome.runtime && chrome.runtime.lastError) return;
            hien_thi_cuc_bo(du_lieu);
        });
    },

    _gan_su_kien_chi_tiet_luu_tru() {
        const cac_nhom = [
            { id_nut: 'btn-toggle-sync-details', id_khung: 'sync-storage-details', tai: () => this._cap_nhat_chi_tiet_dong_bo() },
            { id_nut: 'btn-toggle-local-details', id_khung: 'local-storage-details', tai: () => this._cap_nhat_chi_tiet_cuc_bo() }
        ];
        for (const nhom of cac_nhom) {
            const nut = document.getElementById(nhom.id_nut);
            const khung = document.getElementById(nhom.id_khung);
            if (!nut || !khung) continue;
            nut.addEventListener('click', () => {
                const se_mo = khung.hidden;
                khung.hidden = !se_mo;
                nut.setAttribute('aria-expanded', se_mo ? 'true' : 'false');
                if (se_mo) {
                    nhom.tai();
                    requestAnimationFrame(() => {
                        khung.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                    });
                }
            });
        }
    },

    // Cập nhật thanh dung lượng local/sync
    cap_nhat_dung_luong() {
        this._cap_nhat_mot_thanh_dung_luong({
            vung_luu: chrome.storage && chrome.storage.sync,
            han_muc_mac_dinh: 102400,
            id_chu: 'sync-storage-usage-text',
            id_thanh: 'sync-storage-usage-bar',
            id_canh_bao: 'sync-storage-warning',
            luon_dung_kb: true
        });
        this._cap_nhat_mot_thanh_dung_luong({
            vung_luu: chrome.storage && chrome.storage.local,
            han_muc_mac_dinh: 10485760,
            id_chu: 'storage-usage-text',
            id_thanh: 'storage-usage-bar',
            id_canh_bao: 'storage-warning',
            luon_dung_kb: false
        });

        const khung_sync = document.getElementById('sync-storage-details');
        if (khung_sync && !khung_sync.hidden) this._cap_nhat_chi_tiet_dong_bo();
        const khung_local = document.getElementById('local-storage-details');
        if (khung_local && !khung_local.hidden) this._cap_nhat_chi_tiet_cuc_bo();
    },

    mo_hop_thoai_nhap_du_lieu() {
        const hop_thoai = document.getElementById('import-options-modal');
        if (!hop_thoai) {
            const file_input = document.getElementById('import-file-input');
            if (file_input) file_input.click();
            return;
        }
        const khung_ket_qua = document.getElementById('import-result-banner');
        if (khung_ket_qua) {
            khung_ket_qua.style.display = 'none';
            khung_ket_qua.textContent = '';
        }
        hop_thoai.classList.add('show');
    },

    dong_hop_thoai_nhap_du_lieu() {
        const hop_thoai = document.getElementById('import-options-modal');
        if (hop_thoai) hop_thoai.classList.remove('show');
    },

    hien_ket_qua_nhap_api(so_api_moi, danh_sach_trung) {
        const hop_thoai = document.getElementById('import-options-modal');
        const khung_ket_qua = document.getElementById('import-result-banner');
        if (!hop_thoai || !khung_ket_qua) return;

        khung_ket_qua.textContent = '';

        const tieu_de = document.createElement('div');
        tieu_de.className = 'import-result-title';
        tieu_de.textContent = so_api_moi > 0
            ? `Đã nhập ${so_api_moi} API mới. Có ${danh_sach_trung.length} API bị trùng (đã giữ nguyên bản cũ):`
            : `Không có API mới nào được thêm. Phát hiện ${danh_sach_trung.length} API bị trùng:`;
        khung_ket_qua.appendChild(tieu_de);

        const danh_sach_ul = document.createElement('ul');
        danh_sach_ul.className = 'import-result-list';
        danh_sach_trung.forEach(ten_api => {
            const li = document.createElement('li');
            li.textContent = ten_api;
            danh_sach_ul.appendChild(li);
        });
        khung_ket_qua.appendChild(danh_sach_ul);

        khung_ket_qua.style.display = 'block';
        hop_thoai.classList.add('show');
    },

    async _lam_moi_sau_nhap({ cap_nhat_truyen = false, cap_nhat_cai_dat = false, cap_nhat_api = false } = {}) {
        if (typeof cau_hinh !== 'undefined' && cau_hinh.khoi_tao) {
            await cau_hinh.khoi_tao();
        }
        if (cap_nhat_cai_dat) {
            if (window.DocTruyenSTV_Ext && window.DocTruyenSTV_Ext.khoi_tao_chu_de) {
                window.DocTruyenSTV_Ext.khoi_tao_chu_de(false);
            }
            const chu_de_moi = cau_hinh ? giai_ma_chu_de(cau_hinh.lay('giao_dien_chu_de', true)) : null;
            const chu_de_hieu_luc = chu_de_moi || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
            if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
                chrome.tabs.query({ active: true, currentWindow: true }, (cac_tab) => {
                    if (cac_tab && cac_tab[0] && cac_tab[0].id) {
                        chrome.tabs.sendMessage(cac_tab[0].id, {
                            hanhDong: 'doiChuDe',
                            hanh_dong: 'doi_chu_de',
                            chuDe: chu_de_hieu_luc,
                            chu_de: chu_de_hieu_luc
                        }).catch(() => { });
                    }
                });
            }
            if (typeof giao_dien_cai_dat !== 'undefined') {
                if (typeof giao_dien_cai_dat.lam_moi_giao_dien_cai_dat === 'function') {
                    giao_dien_cai_dat.lam_moi_giao_dien_cai_dat();
                } else if (typeof giao_dien_cai_dat.hien_thi_danh_sach_dong_co === 'function') {
                    giao_dien_cai_dat.hien_thi_danh_sach_dong_co();
                }
            }
            if (quan_ly_thong_bao && typeof quan_ly_thong_bao.khoi_tao === 'function') {
                quan_ly_thong_bao.khoi_tao();
            }
        } else if (cap_nhat_api) {
            if (typeof giao_dien_cai_dat !== 'undefined' && typeof giao_dien_cai_dat.hien_thi_danh_sach_dong_co === 'function') {
                giao_dien_cai_dat.hien_thi_danh_sach_dong_co();
            }
        }
        if (cap_nhat_truyen) {
            await new Promise(res => {
                chrome.storage.local.get('readingList', d => {
                    this.danh_sach_doc = d.readingList || [];
                    this.hien_thi_danh_sach(this.sap_xep_danh_sach(this.danh_sach_doc));
                    const so_luong = document.getElementById('info-count');
                    if (so_luong) so_luong.textContent = `${this.danh_sach_doc.length} truyện`;
                    if (dieu_khien_trinh_phat && dieu_khien_trinh_phat.thong_tin_truyen_hien_tai) {
                        const ten_hien_tai = (dieu_khien_trinh_phat.thong_tin_truyen_hien_tai.bookTitle || '').trim().toLowerCase();
                        if (ten_hien_tai) {
                            const da_luu = this.danh_sach_doc.some(i => (i.title || '').trim().toLowerCase() === ten_hien_tai);
                            dieu_khien_trinh_phat.dat_trang_thai_luu(da_luu);
                        }
                    }
                    res();
                });
            });
        }
        this.cap_nhat_dung_luong();
    },

    _khoa_nhan_dien_truyen(truyen) {
        const ten = (truyen && truyen.title ? String(truyen.title) : '').trim().toLowerCase().replace(/\s+/g, ' ');
        const url = (truyen && truyen.url ? String(truyen.url) : '').trim();
        let ma_sach = '';
        let duong_dan_chuong = '';
        if (url) {
            const khop = url.match(/\/truyen\/([^/?#]+\/\d+\/\d+)(?:\/([^/?#]+))?/i);
            if (khop) {
                ma_sach = khop[1].toLowerCase();
                duong_dan_chuong = (khop[2] || '').trim().toLowerCase();
            }
        }
        return { ten, ma_sach, duong_dan_chuong, url };
    },

    _chuan_hoa_ten_chuong_so_sanh(chap) {
        const txt = (chap || '').trim().toLowerCase().replace(/\s+/g, ' ');
        if (!txt || txt === '...' || txt === 'chưa đọc chương nào' || txt === 'chưa đọc') return '';
        return txt;
    },

    _la_tien_do_truyen_khac(cu, moi) {
        const doan_cu = parseInt(cu && cu.chunkIndex, 10) || 0;
        const doan_moi = parseInt(moi && moi.chunkIndex, 10) || 0;
        if (doan_cu !== doan_moi) return true;

        if (this._chuan_hoa_ten_chuong_so_sanh(cu && cu.chap) !== this._chuan_hoa_ten_chuong_so_sanh(moi && moi.chap)) {
            return true;
        }

        const khoa_cu = this._khoa_nhan_dien_truyen(cu);
        const khoa_moi = this._khoa_nhan_dien_truyen(moi);
        if (khoa_cu.ma_sach || khoa_moi.ma_sach) {
            return khoa_cu.duong_dan_chuong !== khoa_moi.duong_dan_chuong;
        }
        return Boolean((khoa_cu.url || khoa_moi.url) && khoa_cu.url !== khoa_moi.url);
    },

    // Nhập mới hoặc cập nhật tiến độ truyện
    async _nhap_truyen_moi(du_lieu_tho) {
        const gia_tri_danh_sach_tho = du_lieu_tho.local && du_lieu_tho.local.readingList !== undefined
            ? du_lieu_tho.local.readingList
            : (du_lieu_tho.cuc_bo && du_lieu_tho.cuc_bo.readingList !== undefined
                ? du_lieu_tho.cuc_bo.readingList
                : (du_lieu_tho.danh_sach_truyen !== undefined
                    ? du_lieu_tho.danh_sach_truyen
                    : du_lieu_tho.readingList));

        if (gia_tri_danh_sach_tho !== undefined && !Array.isArray(gia_tri_danh_sach_tho)) {
            this.dong_hop_thoai_nhap_du_lieu();
            hien_thong_bao('Từ chối nhập: danh sách truyện sai định dạng (cần dạng mảng)', 'error');
            return;
        }
        const mang_tho = Array.isArray(gia_tri_danh_sach_tho) ? gia_tri_danh_sach_tho : [];

        const ds_nhap = chuan_hoa_danh_sach_truyen(mang_tho);
        if (ds_nhap.length === 0) {
            this.dong_hop_thoai_nhap_du_lieu();
            hien_thong_bao('Tệp không chứa truyện nào để nhập', 'warning');
            return;
        }

        const { so_them_moi, so_cap_nhat } = await thuc_thi_khoa_danh_sach_doc(async () => {
            const ds_hien_tai = await new Promise(res => {
                chrome.storage.local.get('readingList', d => res(Array.isArray(d.readingList) ? d.readingList : []));
            });
            const ds_ket_qua = [...ds_hien_tai];
            let dem_them = 0;
            let dem_cap_nhat = 0;

            for (const truyen_moi of ds_nhap) {
                const kc_moi = this._khoa_nhan_dien_truyen(truyen_moi);
                const vi_tri = ds_ket_qua.findIndex(item => {
                    const kc_cu = this._khoa_nhan_dien_truyen(item);
                    return (kc_cu.ten && kc_cu.ten === kc_moi.ten)
                        || (kc_cu.ma_sach && kc_moi.ma_sach && kc_cu.ma_sach === kc_moi.ma_sach);
                });

                if (vi_tri === -1) {
                    ds_ket_qua.push(truyen_moi);
                    dem_them++;
                } else if (this._la_tien_do_truyen_khac(ds_ket_qua[vi_tri], truyen_moi)) {
                    ds_ket_qua[vi_tri] = {
                        ...truyen_moi,
                        imgUrl: truyen_moi.imgUrl || ds_ket_qua[vi_tri].imgUrl || ''
                    };
                    dem_cap_nhat++;
                }
            }

            if (dem_them > 0 || dem_cap_nhat > 0) {
                await new Promise(res => chrome.storage.local.set({ readingList: ds_ket_qua }, res));
            }
            return { so_them_moi: dem_them, so_cap_nhat: dem_cap_nhat };
        });

        await this._lam_moi_sau_nhap({ cap_nhat_truyen: true });
        this.dong_hop_thoai_nhap_du_lieu();

        if (so_them_moi > 0 && so_cap_nhat > 0) {
            hien_thong_bao(`Đã nhập ${so_them_moi} truyện mới, cập nhật ${so_cap_nhat} truyện`, 'success');
        } else if (so_them_moi > 0) {
            hien_thong_bao(`Đã nhập ${so_them_moi} truyện mới thành công!`, 'success');
        } else if (so_cap_nhat > 0) {
            hien_thong_bao(`Đã ghi đè tiến độ mới cho ${so_cap_nhat} truyện`, 'success');
        } else {
            hien_thong_bao('Không có truyện hoặc tiến độ đọc mới nào để cập nhật', 'info');
        }
    },

    async _nhap_cai_dat(du_lieu_tho, ket_qua_chuyen_doi) {
        const nguon_cuc_bo_tho = (du_lieu_tho.local || du_lieu_tho.cuc_bo || du_lieu_tho) || {};
        const nguon_dong_bo_tho = (du_lieu_tho.sync || du_lieu_tho.dong_bo || du_lieu_tho) || {};
        const cuc_bo_sach = ket_qua_chuyen_doi.local || {};
        const dong_bo_sach = ket_qua_chuyen_doi.sync || {};
        const la_goi_chuan = Boolean(
            du_lieu_tho.dinh_dang_sao_luu === 'DocTruyenSTV_v2'
            || du_lieu_tho.dinh_dang_sao_luu === 'chuyen_doi_v0.4.1'
            || (!du_lieu_tho.local && !du_lieu_tho.cuc_bo && !du_lieu_tho.sync && !du_lieu_tho.dong_bo
                && (du_lieu_tho.cai_dat_chung !== undefined || du_lieu_tho.hen_gio_dung !== undefined || du_lieu_tho.tu_dien_phat_am !== undefined))
        );

        const cuc_bo_cai_dat = {};
        if ((nguon_cuc_bo_tho.customDict !== undefined || (la_goi_chuan && du_lieu_tho.tu_dien_phat_am !== undefined)) && cuc_bo_sach.customDict !== undefined) {
            cuc_bo_cai_dat.customDict = cuc_bo_sach.customDict;
        }
        if (cuc_bo_sach.xem_truoc_v042 !== undefined) {
            cuc_bo_cai_dat.xem_truoc_v042 = cuc_bo_sach.xem_truoc_v042;
        }

        const dong_bo_cai_dat = {};
        for (const khoa of CAC_KHOA_DONG_BO_CHUAN) {
            const co_nguon_goc = (la_goi_chuan && dong_bo_sach[khoa] !== undefined)
                || nguon_dong_bo_tho[khoa] !== undefined
                || nguon_cuc_bo_tho[khoa] !== undefined
                || ((khoa === 'pauseComma' || khoa === 'pausePara')
                    && (nguon_dong_bo_tho.smartPauses !== undefined || nguon_cuc_bo_tho.smartPauses !== undefined));
            if (co_nguon_goc && dong_bo_sach[khoa] !== undefined) {
                dong_bo_cai_dat[khoa] = dong_bo_sach[khoa];
            }
        }

        const co_ban_sao_cai_dat = Boolean(
            du_lieu_tho && typeof du_lieu_tho === 'object'
            && (du_lieu_tho.sync !== undefined || du_lieu_tho.dong_bo !== undefined || du_lieu_tho.phien_ban || du_lieu_tho.phienBan || la_goi_chuan)
        );
        if (!co_ban_sao_cai_dat && Object.keys(cuc_bo_cai_dat).length === 0 && Object.keys(dong_bo_cai_dat).length === 0) {
            this.dong_hop_thoai_nhap_du_lieu();
            hien_thong_bao('Không tìm thấy dữ liệu cài đặt nào trong tệp', 'warning');
            return;
        }

        await ghi_de_du_lieu_nhap(cuc_bo_cai_dat, dong_bo_cai_dat, {
            xoa_khoa_dong_bo_thieu: true,
            xoa_tu_dien_neu_thieu: true
        });

        await this._lam_moi_sau_nhap({ cap_nhat_cai_dat: true });
        this.dong_hop_thoai_nhap_du_lieu();
        hien_thong_bao('Đã nhập cài đặt thành công!', 'success');
    },

    _chuan_hoa_dong_co_api(muc, thu_tu) {
        if (!muc || typeof muc !== 'object') return null;
        const ten = (muc.name || '').trim();
        const url = (muc.url || muc.endpoint || '').trim();
        const khoa = (muc.apiKey || muc.khoa_api || muc.key || '').trim();
        const ma_token = (muc.ma_token || '').trim();
        const khoa_token = (muc.khoa_token || '').trim();
        if (!ten && !url && !khoa && !ma_token && !khoa_token) return null;

        const ds_loai_chinh = [
            'fpt', 'azure', 'gcp', 'gemini', 'zalo', 'vnpt',
            'cartesia', 'elevenlabs', 'fish', 'viettel', 'vieneu'
        ];
        const id_cu = muc.id ? String(muc.id).trim() : '';
        let loai = (muc.type || '').trim().toLowerCase();
        if (!loai) {
            loai = ds_loai_chinh.find((l) => id_cu.startsWith(`${l}_`)) || 'custom';
        }

        const tien_to = ds_loai_chinh.includes(loai) ? loai : 'khac';
        const ban_chuan = {
            ...muc,
            id: id_cu || `${tien_to}_${Date.now()}_${thu_tu}`,
            name: ten || url || id_cu || `API ${thu_tu + 1}`,
            type: loai
        };
        if (khoa && !ban_chuan.apiKey && !ban_chuan.khoa_api) {
            ban_chuan.apiKey = khoa;
        }
        return ban_chuan;
    },

    _trich_xuat_khoa_api(dong_co) {
        const loai = (dong_co && dong_co.type ? String(dong_co.type) : '').trim().toLowerCase();
        return {
            id: dong_co && dong_co.id ? String(dong_co.id).trim() : '',
            ten: (dong_co && dong_co.name ? String(dong_co.name) : '').trim().toLowerCase(),
            loai: loai || 'custom',
            url: (dong_co && (dong_co.url || dong_co.endpoint) ? String(dong_co.url || dong_co.endpoint) : '').trim().replace(/\/+$/, '').toLowerCase(),
            method: (dong_co && dong_co.method ? String(dong_co.method) : 'POST').trim().toUpperCase(),
            khoa: (dong_co && (dong_co.apiKey || dong_co.khoa_api || dong_co.key) ? String(dong_co.apiKey || dong_co.khoa_api || dong_co.key) : '').trim()
        };
    },

    _la_api_trung(ung_vien, danh_sach) {
        const m = this._trich_xuat_khoa_api(ung_vien);
        return danh_sach.some(cu => {
            const c = this._trich_xuat_khoa_api(cu);
            if (m.id && c.id === m.id) return true;
            if (m.ten && c.ten === m.ten) return true;
            if (m.loai === 'custom' && c.loai === 'custom' && m.url && c.url === m.url && m.method === c.method) return true;
            if (m.loai === 'vieneu' && c.loai === 'vieneu' && m.url && c.url === m.url) return true;
            if (m.loai !== 'custom' && c.loai === m.loai && m.khoa && c.khoa === m.khoa) return true;
            return false;
        });
    },

    // Nhập và gộp động cơ TTS tùy chỉnh
    async _nhap_api_moi(du_lieu_tho) {
        const nguon_cuc_bo = (du_lieu_tho.local || du_lieu_tho.cuc_bo || du_lieu_tho) || {};
        if (du_lieu_tho.dong_co_tuy_chinh !== undefined && !Array.isArray(du_lieu_tho.dong_co_tuy_chinh)) {
            this.dong_hop_thoai_nhap_du_lieu();
            hien_thong_bao('Từ chối nhập: trường dong_co_tuy_chinh sai định dạng (cần dạng mảng)', 'error');
            return;
        }
        let du_lieu_chuan_v041 = null;
        if (du_lieu_tho.dong_co_tuy_chinh !== undefined || (du_lieu_tho.cai_dat_chung && typeof du_lieu_tho.cai_dat_chung === 'object' && !Array.isArray(du_lieu_tho.cai_dat_chung))) {
            du_lieu_chuan_v041 = chuyen_doi_du_lieu_nhap({
                dinh_dang_sao_luu: 'DocTruyenSTV_v2',
                dong_co_tuy_chinh: du_lieu_tho.dong_co_tuy_chinh,
                cai_dat_chung: du_lieu_tho.cai_dat_chung || {}
            }).local || {};
        }
        const gia_tri_dong_co_tho = (du_lieu_chuan_v041 && du_lieu_tho.dong_co_tuy_chinh !== undefined)
            ? du_lieu_chuan_v041.customEngines
            : (nguon_cuc_bo.customEngines !== undefined ? nguon_cuc_bo.customEngines : du_lieu_tho.customEngines);
        if (gia_tri_dong_co_tho !== undefined && !Array.isArray(gia_tri_dong_co_tho)) {
            this.dong_hop_thoai_nhap_du_lieu();
            hien_thong_bao('Từ chối nhập: trường customEngines sai định dạng (cần dạng mảng)', 'error');
            return;
        }
        const mang_api_tho = Array.isArray(gia_tri_dong_co_tho) ? gia_tri_dong_co_tho : [];
        const nguon_khoa_le = du_lieu_chuan_v041 ? { ...nguon_cuc_bo, ...du_lieu_chuan_v041 } : nguon_cuc_bo;

        const khoa_le_nhap = [
            ['fpt_key', 'fpt', 'FPT.AI API Key (mặc định)'],
            ['azure_key', 'azure', 'Azure API Key (mặc định)'],
            ['gcp_key', 'gcp', 'Google Cloud API Key (mặc định)']
        ];
        const co_khoa_le = khoa_le_nhap.some(([k]) => typeof nguon_khoa_le[k] === 'string' && nguon_khoa_le[k].trim() !== '');

        if (mang_api_tho.length === 0 && !co_khoa_le) {
            this.dong_hop_thoai_nhap_du_lieu();
            hien_thong_bao('Tệp không chứa cấu hình API nào để nhập', 'warning');
            return;
        }

        const du_lieu_hien_tai = await new Promise(res => {
            chrome.storage.local.get(['customEngines', 'fpt_key', 'azure_key', 'azure_region', 'gcp_key'], res);
        });

        const ds_hien_tai = Array.isArray(du_lieu_hien_tai.customEngines) ? [...du_lieu_hien_tai.customEngines] : [];
        const ds_trung = [];
        const ten_trung_set = new Set();
        const ghi_nhan_trung = (nhan) => {
            if (!ten_trung_set.has(nhan)) {
                ten_trung_set.add(nhan);
                ds_trung.push(nhan);
            }
        };

        let so_api_moi = 0;
        mang_api_tho.forEach((muc, idx) => {
            const ban_chuan = this._chuan_hoa_dong_co_api(muc, idx);
            if (!ban_chuan) return;
            if (this._la_api_trung(ban_chuan, ds_hien_tai)) {
                ghi_nhan_trung(ban_chuan.name || ban_chuan.id);
                return;
            }
            ds_hien_tai.push(ban_chuan);
            so_api_moi++;
        });

        const du_lieu_ghi = {};
        khoa_le_nhap.forEach(([ten_khoa, loai, nhan]) => {
            const gia_tri_nhap = typeof nguon_khoa_le[ten_khoa] === 'string' ? nguon_khoa_le[ten_khoa].trim() : '';
            if (!gia_tri_nhap) return;
            const gia_tri_cu = typeof du_lieu_hien_tai[ten_khoa] === 'string' ? du_lieu_hien_tai[ten_khoa].trim() : '';
            const trung_trong_danh_sach = ds_hien_tai.some(e => e.type === loai && (e.apiKey || e.khoa_api || e.key || '').trim() === gia_tri_nhap);
            if (gia_tri_cu || trung_trong_danh_sach) {
                ghi_nhan_trung(nhan);
            } else {
                du_lieu_ghi[ten_khoa] = gia_tri_nhap;
                if (ten_khoa === 'azure_key' && typeof nguon_khoa_le.azure_region === 'string' && nguon_khoa_le.azure_region.trim()) {
                    du_lieu_ghi.azure_region = nguon_khoa_le.azure_region.trim();
                }
                so_api_moi++;
            }
        });

        if (so_api_moi > 0) {
            du_lieu_ghi.customEngines = ds_hien_tai;
            await new Promise(res => chrome.storage.local.set(du_lieu_ghi, res));
            await this._lam_moi_sau_nhap({ cap_nhat_api: true });
        }

        if (ds_trung.length > 0) {
            const thong_bao = so_api_moi > 0
                ? `Đã nhập ${so_api_moi} API mới (trùng ${ds_trung.length} API)`
                : `Phát hiện ${ds_trung.length} API bị trùng`;
            hien_thong_bao(thong_bao, 'warning');
            this.hien_ket_qua_nhap_api(so_api_moi, ds_trung);
        } else if (so_api_moi > 0) {
            this.dong_hop_thoai_nhap_du_lieu();
            hien_thong_bao(`Đã nhập ${so_api_moi} API mới thành công!`, 'success');
        } else {
            this.dong_hop_thoai_nhap_du_lieu();
            hien_thong_bao('Không tìm thấy API hợp lệ để nhập', 'warning');
        }
    },

    // === Nhập và xuất tệp sao lưu ===

    async _nhap_toan_bo(ket_qua_chuyen_doi) {
        const cuc_bo_sach = ket_qua_chuyen_doi.local || {};
        const dong_bo_sach = ket_qua_chuyen_doi.sync || {};

        if (Object.keys(cuc_bo_sach).length === 0 && Object.keys(dong_bo_sach).length === 0) {
            this.dong_hop_thoai_nhap_du_lieu();
            hien_thong_bao('File không chứa dữ liệu hợp lệ', 'warning');
            return;
        }

        await ghi_de_du_lieu_nhap(cuc_bo_sach, dong_bo_sach, {
            xoa_khoa_dong_bo_thieu: true,
            xoa_tu_dien_neu_thieu: true,
            xoa_danh_sach_rong_neu_thieu: true
        });
        await this._lam_moi_sau_nhap({ cap_nhat_truyen: true, cap_nhat_cai_dat: true, cap_nhat_api: true });
        this.dong_hop_thoai_nhap_du_lieu();

        const thong_diep = ket_qua_chuyen_doi.da_chuyen_doi
            ? 'Đã chuyển đổi và phục hồi dữ liệu từ bản cũ thành công!'
            : 'Đã phục hồi toàn bộ dữ liệu thành công!';
        hien_thong_bao(thong_diep, 'success');
    },

    // Xuất sao lưu nền rồi đóng cửa sổ nổi
    xuat_du_lieu() {
        if (typeof chrome === 'undefined' || !chrome.storage) {
            hien_thong_bao('Không thể truy cập bộ nhớ tiện ích', 'error');
            return;
        }
        chrome.storage.local.get(null, dl_cuc_bo => {
            chrome.storage.sync.get(null, async dl_dong_bo => {
                const phien_ban = (chrome.runtime && typeof chrome.runtime.getManifest === 'function')
                    ? chrome.runtime.getManifest().version
                    : '0.4.1';
                const du_lieu_xuat = tao_goi_du_lieu_xuat(
                    dl_cuc_bo,
                    dl_dong_bo,
                    phien_ban
                );
                const ten_tep = `DocTruyenSTV_Backup_${new Date().toISOString().slice(0, 10)}.json`;
                const { url_tai } = tao_data_uri_json(du_lieu_xuat);
                if (url_tai && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                    const da_gui_nen = await new Promise(resolve => {
                        let da_xong = false;
                        const chot = kq => {
                            if (da_xong) return;
                            da_xong = true;
                            clearTimeout(hen_gio_gui);
                            resolve(kq);
                        };
                        const hen_gio_gui = setTimeout(() => chot(false), 1500);
                        try {
                            chrome.runtime.sendMessage(
                                {
                                    hanhDong: 'xuatDuLieuSaoLuu',
                                    url: url_tai,
                                    ten_tep,
                                    cho_ms: 250
                                },
                                phan_hoi => {
                                    const loi = chrome.runtime.lastError;
                                    chot(Boolean(!loi && phan_hoi && phan_hoi.ok));
                                }
                            );
                        } catch (loi) {
                            chot(false);
                        }
                    });
                    if (da_gui_nen) {
                        if (typeof window !== 'undefined' && typeof window.close === 'function') {
                            window.close();
                        }
                        return;
                    }
                }
                await tai_xuong_json(du_lieu_xuat, ten_tep);
                hien_thong_bao('Đã xuất dữ liệu sao lưu', 'success');
            });
        });
    },

    nhap_du_lieu(e) {
        const file = e.target.files[0];
        if (!file) return;
        const che_do = this._che_do_nhap_du_lieu || 'toan_bo';

        file.text().then(async text => {
            try {
                const du_lieu = JSON.parse(text);
                if (typeof du_lieu !== 'object' || du_lieu === null || Array.isArray(du_lieu)) {
                    throw new Error('File không hợp lệ');
                }

                if (che_do === 'truyen') {
                    await this._nhap_truyen_moi(du_lieu);
                } else if (che_do === 'api') {
                    await this._nhap_api_moi(du_lieu);
                } else {
                    const ket_qua_chuyen_doi = chuyen_doi_du_lieu_nhap(du_lieu);
                    if (Array.isArray(ket_qua_chuyen_doi.cac_muc_loi) && ket_qua_chuyen_doi.cac_muc_loi.length > 0) {
                        this.dong_hop_thoai_nhap_du_lieu();
                        hien_thong_bao(`Từ chối nhập vì sai kiểu dữ liệu ở: ${ket_qua_chuyen_doi.cac_muc_loi.join(', ')}`, 'error');
                        return;
                    }
                    if (che_do === 'cai_dat') {
                        await this._nhap_cai_dat(du_lieu, ket_qua_chuyen_doi);
                    } else {
                        await this._nhap_toan_bo(ket_qua_chuyen_doi);
                    }
                }
            } catch (err) {
                hien_thong_bao('File không hợp lệ hoặc bị lỗi cú pháp', 'error');
            }
            e.target.value = '';
        }).catch(() => {
            hien_thong_bao('Lỗi đọc file', 'error');
            e.target.value = '';
        });
    },

    gan_su_kien_thu_vien() {
        const list_search = document.getElementById('list-search');
        if (list_search) {
            let search_timeout = null;
            list_search.addEventListener('input', e => {
                if (search_timeout) clearTimeout(search_timeout);
                search_timeout = setTimeout(() => {
                    const tu_khoa = e.target.value.trim().toLowerCase();
                    const vung_danh_sach = document.getElementById('list-container');
                    if (!vung_danh_sach) return;
                    const cac_muc = vung_danh_sach.querySelectorAll('.list-item');
                    if (!tu_khoa) {
                        cac_muc.forEach(muc => muc.style.display = 'flex');
                        this.kich_hoat_marquee();
                        return;
                    }
                    cac_muc.forEach(muc => {
                        const ten = (muc.querySelector('.list-name')?.textContent || '').toLowerCase();
                        const chuong = (muc.querySelector('.list-chap')?.textContent || '').toLowerCase();
                        if (ten.includes(tu_khoa) || chuong.includes(tu_khoa)) {
                            muc.style.display = 'flex';
                            muc.classList.remove('hidden-by-search');
                        } else {
                            muc.style.display = 'none';
                            muc.classList.add('hidden-by-search');
                        }
                    });
                    this.kich_hoat_marquee();
                }, 200);
            });
        }

        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.che_do_sap_xep = btn.dataset.sort;
                this.hien_thi_danh_sach(this.sap_xep_danh_sach(this.danh_sach_doc));
            });
        });

        const btn_export = document.getElementById('btn-export-data');
        if (btn_export) btn_export.addEventListener('click', () => this.xuat_du_lieu());

        const file_input = document.getElementById('import-file-input');
        if (file_input) file_input.addEventListener('change', (e) => this.nhap_du_lieu(e));

        const btn_import = document.getElementById('btn-import-data');
        if (btn_import) btn_import.addEventListener('click', () => this.mo_hop_thoai_nhap_du_lieu());

        if (!this._da_lang_nghe_dung_luong && chrome.storage && chrome.storage.onChanged) {
            this._da_lang_nghe_dung_luong = true;
            let hen_gio_cap_nhat_dung_luong = null;
            chrome.storage.onChanged.addListener((_, vung_luu) => {
                if (vung_luu !== 'local' && vung_luu !== 'sync') return;
                clearTimeout(hen_gio_cap_nhat_dung_luong);
                hen_gio_cap_nhat_dung_luong = setTimeout(() => this.cap_nhat_dung_luong(), 120);
            });
        }

        this._gan_su_kien_chi_tiet_luu_tru();

        const hop_thoai_nhap = document.getElementById('import-options-modal');
        if (hop_thoai_nhap) {
            const nut_dong_x = document.getElementById('import-modal-close');
            const nut_dong_chan = document.getElementById('import-modal-cancel');
            if (nut_dong_x) nut_dong_x.addEventListener('click', () => this.dong_hop_thoai_nhap_du_lieu());
            if (nut_dong_chan) nut_dong_chan.addEventListener('click', () => this.dong_hop_thoai_nhap_du_lieu());

            hop_thoai_nhap.addEventListener('click', (e) => {
                if (e.target === hop_thoai_nhap) this.dong_hop_thoai_nhap_du_lieu();
            });

            hop_thoai_nhap.querySelectorAll('.import-option-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this._che_do_nhap_du_lieu = btn.dataset.importMode || 'toan_bo';
                    if (file_input) {
                        file_input.value = '';
                        file_input.click();
                    }
                });
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && hop_thoai_nhap.classList.contains('show')) {
                    this.dong_hop_thoai_nhap_du_lieu();
                }
            });
        }

        const btn_clear = document.getElementById('btn-clear-all');
        if (btn_clear) btn_clear.addEventListener('click', () => {
            hien_xac_nhan(
                'Xác nhận xóa toàn bộ dữ liệu',
                'Hành động này sẽ xóa vĩnh viễn:\n• Danh sách truyện đã lưu\n• Từ điển tùy chỉnh\n• Toàn bộ cài đặt\n\n(API Key của bạn vẫn sẽ được giữ lại!)',
                async (trang_thai) => {
                    const xoa_dong_bo = trang_thai ? Boolean(trang_thai.da_tich) : true;
                    const khoa_giu_lai = new Set(['customEngines', 'fpt_key', 'azure_key', 'azure_region', 'gcp_key', 'phien_ban_du_lieu', 'phien_ban_phan_bo_luu_tru']);
                    const dl_hien_tai = await new Promise(res => chrome.storage.local.get(null, dl => res(dl || {})));
                    const keys_to_remove = Object.keys(dl_hien_tai).filter(k => !khoa_giu_lai.has(k));
                    if (keys_to_remove.length > 0) {
                        await new Promise(res => chrome.storage.local.remove(keys_to_remove, res));
                    }
                    if (xoa_dong_bo && chrome.storage && chrome.storage.sync) {
                        await new Promise(res => chrome.storage.sync.clear(res));
                    }

                    // Dọn cache IndexedDB và đặt cờ xóa dự phòng
                    await new Promise(res => chrome.storage.local.set({ can_xoa_cache_tts: 1 }, res));
                    try {
                        const ds_tab = await chrome.tabs.query({ url: ['*://*.sangtacviet.com/*'] });
                        let da_xoa_tab = false;
                        await Promise.all((ds_tab || []).map(t => new Promise(da_xong => {
                            chrome.tabs.sendMessage(t.id, { hanhDong: 'xoaCacheAmThanh' }, phan_hoi => {
                                if (!chrome.runtime.lastError && phan_hoi && phan_hoi.success) da_xoa_tab = true;
                                da_xong();
                            });
                        })));
                        if (da_xoa_tab && ds_tab.length === 1) {
                            await new Promise(res => chrome.storage.local.remove('can_xoa_cache_tts', res));
                        }
                    } catch (_) { }

                    if (typeof cau_hinh !== 'undefined' && cau_hinh.khoi_tao) {
                        await cau_hinh.khoi_tao();
                    }
                    if (window.DocTruyenSTV_Ext && window.DocTruyenSTV_Ext.khoi_tao_chu_de) {
                        window.DocTruyenSTV_Ext.khoi_tao_chu_de(xoa_dong_bo);
                    }
                    if (typeof giao_dien_cai_dat !== 'undefined') {
                        if (typeof giao_dien_cai_dat.lam_moi_giao_dien_cai_dat === 'function') {
                            giao_dien_cai_dat.lam_moi_giao_dien_cai_dat();
                        }
                        if (typeof giao_dien_cai_dat.hien_thi_danh_sach_dong_co === 'function') {
                            giao_dien_cai_dat.hien_thi_danh_sach_dong_co();
                        }
                    }
                    if (quan_ly_thong_bao && typeof quan_ly_thong_bao.dat_lai_sau_khi_xoa === 'function') {
                        quan_ly_thong_bao.dat_lai_sau_khi_xoa();
                    }
                    this.tai_danh_sach_doc();
                    this.cap_nhat_dung_luong();

                    // Làm mới tab Trình phát ở Trang chủ
                    if (dieu_khien_trinh_phat) {
                        dieu_khien_trinh_phat.dat_trang_thai_luu(false);
                        if (typeof dieu_khien_trinh_phat.yeu_cau_trang_thai_ban_dau === 'function') {
                            dieu_khien_trinh_phat.yeu_cau_trang_thai_ban_dau();
                        }
                    }
                    const the_dem_thong_tin = document.getElementById('info-count');
                    if (the_dem_thong_tin) the_dem_thong_tin.textContent = '0 truyện';

                    hien_thong_bao(
                        xoa_dong_bo ? 'Đã xóa trắng dữ liệu' : 'Đã xóa dữ liệu trên máy',
                        'success'
                    );
                },
                {
                    checkboxLabel: 'Xóa dữ liệu đồng bộ',
                    checkboxChecked: false,
                    footerWarning: 'Không thể hoàn tác!'
                }
            );
        });
    }
};
