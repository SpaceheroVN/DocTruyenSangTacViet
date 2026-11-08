import { CauHinh } from './quan_ly_cau_hinh.js';
import { GiaoDienCaiDat } from './giao_dien_cai_dat.js';
import { DieuKhienTrinhPhat } from './dieu_khien_trinh_phat.js';
import { hien_thong_bao, hien_xac_nhan } from './tien_ich.js';

// Quản lý hiệu ứng cuộn chữ Ping-Pong đồng bộ giữa Tên truyện và Tên chương khi Hover
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

        // Chỉ kích hoạt khi người dùng rê chuột (hover) vào truyện cụ thể đó
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

        // Nếu phần tử đang ẩn (chưa render layout trong DOM)
        if (rong_khung_tieu_de <= 0) return false;

        this.do_trang_tieu_de = Math.max(0, rong_chu_tieu_de - rong_khung_tieu_de);
        this.do_trang_chuong = Math.max(0, rong_chu_chuong - rong_khung_chuong);

        const tieu_de_trang = this.do_trang_tieu_de > 2;
        const chuong_trang = this.do_trang_chuong > 2;

        if (tieu_de_trang) {
            const so_ky_tu = Math.max(1, (this.chu_tieu_de.textContent || '').trim().length);
            const px_moi_ky_tu = rong_chu_tieu_de / so_ky_tu;
            const so_ky_tu_trang = Math.max(1, Math.round(this.do_trang_tieu_de / px_moi_ky_tu));
            // Tốc độ 0.15s (150ms) cho mỗi ký tự
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
            // Tốc độ 0.15s (150ms) cho mỗi ký tự
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

                // Cho phép dừng sớm và dọn dẹp listener khi unhover
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
            // Bước 1: Trạng thái ban đầu x = 0, chờ đúng 1.5s (1500ms) trước khi bắt đầu cuộn
            await this._cho(1500);
            if (!this._dang_chay || !this._dang_hover || this._da_huy) break;

            const cuon_tieu_de = this.do_trang_tieu_de > 0;
            const cuon_chuong = this.do_trang_chuong > 0;
            if (!cuon_tieu_de && !cuon_chuong) break;

            // Bước 2: Kích hoạt đồng thời từ phải qua trái (đến -do_trang)
            const loi_hua_tien = [];
            if (cuon_tieu_de) {
                loi_hua_tien.push(this._cuon(this.chu_tieu_de, this.khung_tieu_de, -this.do_trang_tieu_de, this.thoi_luong_tieu_de));
            }
            if (cuon_chuong) {
                loi_hua_tien.push(this._cuon(this.chu_chuong, this.khung_chuong, -this.do_trang_chuong, this.thoi_luong_chuong));
            }

            // Quy tắc đồng bộ: Thằng nào về trước chờ thằng kia, chỉ khi cả hai cùng tới đích mới tiếp tục
            await Promise.all(loi_hua_tien);
            if (!this._dang_chay || !this._dang_hover || this._da_huy) break;

            // Bước 3: Đã tới cuối, chờ 1.5s trước khi kích hoạt chạy ngược lại
            await this._cho(1500);
            if (!this._dang_chay || !this._dang_hover || this._da_huy) break;

            // Bước 4: Chạy ngược lại về điểm xuất phát x = 0
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

            // Sau khi về điểm xuất phát, vòng lặp quay lại Bước 1 (chờ 1.5s rồi lặp lại chu kỳ nếu vẫn hover)
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

export const QuanLyThuVien = {
    danh_sach_doc: [],
    che_do_sap_xep: 'recent',
    danh_sach_marquee: [],
    _da_gan_quan_sat_panel: false,

    url_an_toan(url) {
        if (!url || typeof url !== 'string') return '';
        try {
            const parsed = new URL(url.trim());
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href;
            return '';
        } catch(e) { return ''; }
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

            // Cột 2: Gồm 3 hàng: Tên truyện, Tên chương hiện tại, Đoạn đọc hiện tại
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
            text_tieu_de.textContent = m.title || 'Không có tên';
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
            text_chuong.textContent = m.chap || '...';
            khung_chuong.appendChild(text_chuong);
            hang_chuong.appendChild(khung_chuong);
            cot_thong_tin.appendChild(hang_chuong);

            // Hàng 3: Đoạn đọc hiện tại
            const hang_doan = document.createElement('div');
            hang_doan.className = 'list-row list-row-chunk';
            const huy_hieu_doan = document.createElement('span');
            huy_hieu_doan.className = 'list-chunk-badge';
            huy_hieu_doan.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;"><polygon points="6 3 20 12 6 21 6 3" fill="currentColor"/></svg>Đoạn ${m.chunkIndex || 1}`;
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

            // Ghi nhận nhóm Marquee đồng bộ cho phần tử
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

    xoa_khoi_danh_sach(tieu_de) {
        chrome.storage.local.get('readingList', d => {
            let mang = d.readingList || [];
            const vi_tri = mang.findIndex(m => m.title === tieu_de);
            if (vi_tri !== -1) mang.splice(vi_tri, 1);
            chrome.storage.local.set({ readingList: mang }, () => {
                this.danh_sach_doc = mang;
                this.tai_danh_sach_doc();
                if (DieuKhienTrinhPhat.thong_tin_truyen_hien_tai &&
                    (DieuKhienTrinhPhat.thong_tin_truyen_hien_tai.bookTitle || '').trim().toLowerCase() === (tieu_de || '').trim().toLowerCase()) {
                    DieuKhienTrinhPhat.dat_trang_thai_luu(false);
                }
                this.cap_nhat_dung_luong();
                hien_thong_bao('Đã xóa khỏi thư viện', 'success');
            });
        });
    },

    cap_nhat_dung_luong() {
        if (!chrome.storage.local.getBytesInUse) return;
        chrome.storage.local.getBytesInUse(null, bytes => {
            const da_dung_mb = (bytes / (1024 * 1024)).toFixed(2);
            const tong_mb = (chrome.storage.local.QUOTA_BYTES ? (chrome.storage.local.QUOTA_BYTES / (1024 * 1024)) : 5.0).toFixed(2);
            const phan_tram = Math.min(100, Math.round((bytes / (chrome.storage.local.QUOTA_BYTES || 5242880)) * 100));

            const storage_text = document.getElementById('storage-usage-text');
            if (storage_text) storage_text.textContent = `${da_dung_mb} / ${tong_mb}MB`;

            const storage_bar = document.getElementById('storage-usage-bar');
            if (storage_bar) {
                storage_bar.style.width = `${phan_tram}%`;
                if (phan_tram >= 90) storage_bar.style.background = 'var(--danger)';
                else if (phan_tram >= 70) storage_bar.style.background = 'var(--warning)';
                else storage_bar.style.background = 'var(--success)';
            }

            const storage_warning = document.getElementById('storage-warning');
            if (storage_warning) {
                storage_warning.style.display = phan_tram >= 90 ? 'block' : 'none';
            }
        });
    },

    xuat_du_lieu() {
        chrome.storage.local.get(null, dl_cuc_bo => {
            chrome.storage.sync.get(null, dl_dong_bo => {
                const cuc_bo_copy = { ...dl_cuc_bo };
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
                    phienBan: chrome.runtime.getManifest().version,
                    ngayXuat: new Date().toISOString(),
                    local: cuc_bo_copy,
                    sync: dl_dong_bo || {}
                };
                const blob = new Blob([JSON.stringify(du_lieu_xuat, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `DocTruyenSTV_Backup_${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                hien_thong_bao('Đã xuất dữ liệu sao lưu', 'success');
            });
        });
    },

    nhap_du_lieu(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const KHOA_CUC_BO_HOP_LE = ['readingList', 'customDict', 'customEngines', 'fpt_key', 'azure_key', 'azure_region', 'gcp_key', 'miniPlayerMode', 'isMiniPlayerMinimized', 'customShortcuts', 'customStopConfig', 'stopAfterChapters', 'giao_dien_chu_de'];
        const KHOA_DONG_BO_HOP_LE = ['speed', 'volume', 'pitch', 'voiceIndex', 'voiceName', 'maydoc', 'pauseComma', 'pauseDot', 'pausePara', 'autoNext', 'readingStyle', 'docTruoc', 'selectedLang'];
        
        file.text().then(text => {
            try {
                const dulieu = JSON.parse(text);
                if (typeof dulieu !== 'object' || dulieu === null) throw new Error('File hỏng');
                
                const du_lieu_cuc_bo = dulieu.local ? dulieu.local : dulieu;
                const du_lieu_dong_bo = dulieu.sync ? dulieu.sync : {};
                
                const cuc_bo_sach = {};
                for (const khoa of KHOA_CUC_BO_HOP_LE) {
                    if (du_lieu_cuc_bo[khoa] !== undefined) cuc_bo_sach[khoa] = du_lieu_cuc_bo[khoa];
                }
                if (cuc_bo_sach.readingList && !Array.isArray(cuc_bo_sach.readingList)) {
                    delete cuc_bo_sach.readingList;
                }
                if (cuc_bo_sach.customDict && !Array.isArray(cuc_bo_sach.customDict)) {
                    delete cuc_bo_sach.customDict;
                }
                if (cuc_bo_sach.customEngines && !Array.isArray(cuc_bo_sach.customEngines)) {
                    delete cuc_bo_sach.customEngines;
                }

                const dong_bo_sach = {};
                for (const khoa of KHOA_DONG_BO_HOP_LE) {
                    if (du_lieu_dong_bo[khoa] !== undefined) dong_bo_sach[khoa] = du_lieu_dong_bo[khoa];
                }
                
                if (Object.keys(cuc_bo_sach).length === 0 && Object.keys(dong_bo_sach).length === 0) {
                    hien_thong_bao('File không chứa dữ liệu hợp lệ', 'warning');
                    e.target.value = '';
                    return;
                }
                
                const cong_viec = [];
                if (Object.keys(cuc_bo_sach).length > 0) {
                    cong_viec.push(new Promise(res => chrome.storage.local.set(cuc_bo_sach, res)));
                }
                if (Object.keys(dong_bo_sach).length > 0) {
                    cong_viec.push(new Promise(res => chrome.storage.sync.set(dong_bo_sach, res)));
                }

                Promise.all(cong_viec).then(async () => {
                    if (typeof CauHinh !== 'undefined' && CauHinh.khoi_tao) {
                        await CauHinh.khoi_tao();
                    }
                    if (typeof GiaoDienCaiDat !== 'undefined' && GiaoDienCaiDat.taoKhungChonEngine) {
                        GiaoDienCaiDat.taoKhungChonEngine();
                    }
                    this.tai_danh_sach_doc();
                    this.cap_nhat_dung_luong();
                    hien_thong_bao('Đã phục hồi dữ liệu thành công!', 'success');
                });
            } catch (err) {
                hien_thong_bao('File không hợp lệ', 'error');
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
        if (btn_import && file_input) btn_import.addEventListener('click', () => file_input.click());

        const btn_clear = document.getElementById('btn-clear-all');
        if (btn_clear) btn_clear.addEventListener('click', () => {
            hien_xac_nhan(
                'Xác nhận xóa toàn bộ dữ liệu',
                'Hành động này sẽ xóa vĩnh viễn:\n• Danh sách truyện đã lưu\n• Từ điển tùy chỉnh\n• Toàn bộ cài đặt\n\n(API Key của bạn vẫn sẽ được giữ lại!)\n\nKhông thể hoàn tác!',
                () => {
                    const keys_to_remove = [
                        'readingList', 'customDict', 'stopTime', 'stopRealtimeTarget', 
                        'stopAfterChapters', 'customStopConfig', 'sleepTargetTimestamp',
                        'last_active_state', 'miniPlayerMode', 'isMiniPlayerMinimized', 'customShortcuts',
                        'giao_dien_chu_de'
                    ];
                    chrome.storage.local.remove(keys_to_remove, () => {
                        chrome.storage.sync.clear(async () => {
                            if (typeof CauHinh !== 'undefined' && CauHinh.khoi_tao) {
                                await CauHinh.khoi_tao();
                            }
                            if (window.DocTruyenSTV_Ext && window.DocTruyenSTV_Ext.khoi_tao_chu_de) {
                                window.DocTruyenSTV_Ext.khoi_tao_chu_de(true);
                            }
                            if (typeof GiaoDienCaiDat !== 'undefined' && GiaoDienCaiDat.taoKhungChonEngine) {
                                GiaoDienCaiDat.taoKhungChonEngine();
                            }
                            this.tai_danh_sach_doc();
                            this.cap_nhat_dung_luong();
                            hien_thong_bao('Đã xóa trắng dữ liệu', 'success');
                        });
                    });
                }
            );
        });
    }
};
