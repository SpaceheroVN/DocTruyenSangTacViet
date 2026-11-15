// Quản lý cấu hình popup và ghi kép sync/local

import { CAC_KHOA_DONG_BO_CHUAN, nen_gia_tri_khoa, nen_tap_du_lieu } from '../chuyen_doi.js';

// === Hằng số và bộ đệm ===

const TAP_KHOA_DONG_BO = new Set(CAC_KHOA_DONG_BO_CHUAN);
const KHOA_LUU_NGAY_DONG_BO = new Set([
    'giao_dien_chu_de', 'pauseComma', 'pauseDot', 'pausePara',
    'maydoc', 'voiceIndex', 'voiceName', 'speed', 'volume', 'thayNhanhWeb', 'hien_chuong_thong_bao'
]);

export const cau_hinh = {
    du_lieu_dong_bo: {},
    du_lieu_cuc_bo: {},
    _dong_ho_dong_bo: null,
    _dong_ho_cuc_bo: null,
    _khoa_cho_dong_bo: new Set(),
    _khoa_xoa_dong_bo: new Set(),
    _khoa_cho_cuc_bo: new Set(),
    _khoa_xoa_cuc_bo: new Set(),

    // === Khởi tạo và đồng bộ ===

    async khoi_tao() {
        return Promise.all([
            new Promise(dong_y => {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                    chrome.storage.sync.get(null, du_lieu => {
                        this.du_lieu_dong_bo = du_lieu || {};
                        dong_y();
                    });
                } else {
                    this.du_lieu_dong_bo = {};
                    dong_y();
                }
            }),
            new Promise(dong_y => {
                chrome.storage.local.get(null, du_lieu => {
                    this.du_lieu_cuc_bo = du_lieu || {};
                    if (!this.du_lieu_cuc_bo.customEngines) this.du_lieu_cuc_bo.customEngines = [];
                    dong_y();
                });
            })
        ]).then(() => {
            // Xóa smartPauses cũ tránh ghi đè pausePara
            if (this.du_lieu_cuc_bo.phien_ban_du_lieu) {
                const can_xoa_cuc_bo_cu = this.du_lieu_cuc_bo.smartPauses !== undefined;
                const can_xoa_dong_bo_cu = this.du_lieu_dong_bo.smartPauses !== undefined;
                delete this.du_lieu_cuc_bo.smartPauses;
                delete this.du_lieu_dong_bo.smartPauses;
                if (can_xoa_cuc_bo_cu) chrome.storage.local.remove('smartPauses');
                if (can_xoa_dong_bo_cu && typeof chrome !== 'undefined' && chrome.storage?.sync) {
                    chrome.storage.sync.remove('smartPauses');
                }
            }

            // Kéo bản sao sync xuống local khi sai khác
            const can_bo_sung_cuc_bo = {};
            for (const k of Object.keys(this.du_lieu_dong_bo)) {
                if (!TAP_KHOA_DONG_BO.has(k)) continue;
                const val = this.du_lieu_dong_bo[k];
                if (val !== undefined && JSON.stringify(this.du_lieu_cuc_bo[k]) !== JSON.stringify(val)) {
                    this.du_lieu_cuc_bo[k] = val;
                    can_bo_sung_cuc_bo[k] = val;
                }
            }
            if (Object.keys(can_bo_sung_cuc_bo).length > 0) {
                chrome.storage.local.set(can_bo_sung_cuc_bo);
            }
        });
    },

    // === Đọc, ghi và xếp hàng ===

    _ghi_vung_dong_bo(du_lieu_luu, ham_xong, khoa_xoa = []) {
        const buoc = [];
        if (du_lieu_luu && Object.keys(du_lieu_luu).length > 0) {
            buoc.push(new Promise(res => chrome.storage.local.set(du_lieu_luu, res)));
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                buoc.push(new Promise(res => chrome.storage.sync.set(du_lieu_luu, res)));
            }
        }
        if (Array.isArray(khoa_xoa) && khoa_xoa.length > 0) {
            buoc.push(new Promise(res => chrome.storage.local.remove(khoa_xoa, res)));
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                buoc.push(new Promise(res => chrome.storage.sync.remove(khoa_xoa, res)));
            }
        }
        return Promise.all(buoc).then(() => {
            if (typeof ham_xong === 'function') ham_xong();
        });
    },

    _ghi_vung_cuc_bo(du_lieu_luu, khoa_xoa = []) {
        if (du_lieu_luu && Object.keys(du_lieu_luu).length > 0) {
            chrome.storage.local.set(du_lieu_luu);
        }
        if (Array.isArray(khoa_xoa) && khoa_xoa.length > 0) {
            chrome.storage.local.remove(khoa_xoa);
        }
    },

    lay(khoa, la_dong_bo = true) {
        if (la_dong_bo) {
            return this.du_lieu_dong_bo[khoa] !== undefined ? this.du_lieu_dong_bo[khoa] : this.du_lieu_cuc_bo[khoa];
        }
        return this.du_lieu_cuc_bo[khoa];
    },

    _xa_hang_cho_dong_bo() {
        const du_lieu_luu = {};
        for (const khoa_cho of this._khoa_cho_dong_bo) {
            if (this.du_lieu_dong_bo[khoa_cho] !== undefined) {
                du_lieu_luu[khoa_cho] = this.du_lieu_dong_bo[khoa_cho];
            }
        }
        const khoa_xoa = Array.from(this._khoa_xoa_dong_bo);
        this._khoa_cho_dong_bo.clear();
        this._khoa_xoa_dong_bo.clear();
        if (Object.keys(du_lieu_luu).length > 0 || khoa_xoa.length > 0) {
            this._ghi_vung_dong_bo(du_lieu_luu, undefined, khoa_xoa);
        }
    },

    _xa_hang_cho_cuc_bo() {
        const du_lieu_luu = {};
        for (const khoa_cho of this._khoa_cho_cuc_bo) {
            if (this.du_lieu_cuc_bo[khoa_cho] !== undefined) {
                du_lieu_luu[khoa_cho] = this.du_lieu_cuc_bo[khoa_cho];
            }
        }
        const khoa_xoa = Array.from(this._khoa_xoa_cuc_bo);
        this._khoa_cho_cuc_bo.clear();
        this._khoa_xoa_cuc_bo.clear();
        this._ghi_vung_cuc_bo(du_lieu_luu, khoa_xoa);
    },

    dat(khoa, gia_tri, la_dong_bo = true, ngay_lap_tuc = false) {
        const gia_tri_nen = nen_gia_tri_khoa(khoa, gia_tri);
        if (la_dong_bo) {
            if (khoa === 'pausePara' && (this.du_lieu_dong_bo.smartPauses !== undefined || this.du_lieu_cuc_bo.smartPauses !== undefined)) {
                delete this.du_lieu_dong_bo.smartPauses;
                delete this.du_lieu_cuc_bo.smartPauses;
                this._khoa_xoa_dong_bo.add('smartPauses');
            }
            if (gia_tri_nen === undefined) {
                delete this.du_lieu_dong_bo[khoa];
                delete this.du_lieu_cuc_bo[khoa];
                this._khoa_cho_dong_bo.delete(khoa);
                this._khoa_xoa_dong_bo.add(khoa);
            } else {
                this.du_lieu_dong_bo[khoa] = gia_tri_nen;
                this.du_lieu_cuc_bo[khoa] = gia_tri_nen;
                this._khoa_xoa_dong_bo.delete(khoa);
                this._khoa_cho_dong_bo.add(khoa);
            }
            clearTimeout(this._dong_ho_dong_bo);
            if (ngay_lap_tuc || KHOA_LUU_NGAY_DONG_BO.has(khoa)) {
                this._xa_hang_cho_dong_bo();
            } else {
                this._dong_ho_dong_bo = setTimeout(() => this._xa_hang_cho_dong_bo(), 300);
            }
        } else {
            if (gia_tri_nen === undefined) {
                delete this.du_lieu_cuc_bo[khoa];
                this._khoa_cho_cuc_bo.delete(khoa);
                this._khoa_xoa_cuc_bo.add(khoa);
            } else {
                this.du_lieu_cuc_bo[khoa] = gia_tri_nen;
                this._khoa_xoa_cuc_bo.delete(khoa);
                this._khoa_cho_cuc_bo.add(khoa);
            }
            clearTimeout(this._dong_ho_cuc_bo);
            if (ngay_lap_tuc) {
                this._xa_hang_cho_cuc_bo();
            } else {
                this._dong_ho_cuc_bo = setTimeout(() => this._xa_hang_cho_cuc_bo(), 300);
            }
        }
    },

    dat_nhieu_dong_bo(du_lieu_obj, ham_xong) {
        if (!du_lieu_obj || typeof du_lieu_obj !== 'object') {
            if (typeof ham_xong === 'function') ham_xong();
            return Promise.resolve();
        }
        const { du_lieu_ghi, khoa_xoa } = nen_tap_du_lieu(du_lieu_obj);
        if (Object.prototype.hasOwnProperty.call(du_lieu_obj, 'pausePara')
            && (this.du_lieu_dong_bo.smartPauses !== undefined || this.du_lieu_cuc_bo.smartPauses !== undefined)) {
            delete this.du_lieu_dong_bo.smartPauses;
            delete this.du_lieu_cuc_bo.smartPauses;
            if (!khoa_xoa.includes('smartPauses')) khoa_xoa.push('smartPauses');
        }
        for (const [k, v] of Object.entries(du_lieu_ghi)) {
            this.du_lieu_dong_bo[k] = v;
            this.du_lieu_cuc_bo[k] = v;
            this._khoa_cho_dong_bo.delete(k);
            this._khoa_xoa_dong_bo.delete(k);
        }
        for (const k of khoa_xoa) {
            delete this.du_lieu_dong_bo[k];
            delete this.du_lieu_cuc_bo[k];
            this._khoa_cho_dong_bo.delete(k);
            this._khoa_xoa_dong_bo.delete(k);
        }
        return this._ghi_vung_dong_bo(du_lieu_ghi, ham_xong, khoa_xoa);
    },

    xoa_nhieu_dong_bo(danh_sach_khoa, ham_xong) {
        const mang = Array.isArray(danh_sach_khoa) ? danh_sach_khoa : [danh_sach_khoa];
        for (const k of mang) {
            delete this.du_lieu_dong_bo[k];
            delete this.du_lieu_cuc_bo[k];
            this._khoa_cho_dong_bo.delete(k);
            this._khoa_xoa_dong_bo.delete(k);
        }
        const buoc = [new Promise(res => chrome.storage.local.remove(mang, res))];
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            buoc.push(new Promise(res => chrome.storage.sync.remove(mang, res)));
        }
        return Promise.all(buoc).then(() => {
            if (typeof ham_xong === 'function') ham_xong();
        });
    },

    luu_ngay_lap_tuc() {
        if (this._khoa_cho_dong_bo.size > 0 || this._khoa_xoa_dong_bo.size > 0) {
            clearTimeout(this._dong_ho_dong_bo);
            this._xa_hang_cho_dong_bo();
        }
        if (this._khoa_cho_cuc_bo.size > 0 || this._khoa_xoa_cuc_bo.size > 0) {
            clearTimeout(this._dong_ho_cuc_bo);
            this._xa_hang_cho_cuc_bo();
        }
    },

    luu_tu_dien(tu_dien) {
        if (!Array.isArray(tu_dien) || tu_dien.length === 0) {
            delete this.du_lieu_cuc_bo.customDict;
            chrome.storage.local.remove('customDict');
            return;
        }
        this.du_lieu_cuc_bo.customDict = tu_dien;
        chrome.storage.local.set({ customDict: tu_dien });
    }
};
