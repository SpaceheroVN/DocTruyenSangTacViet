// Quản lý lưu trữ cấu hình hệ thống
export const CauHinh = {
    du_lieu_dong_bo: {},
    du_lieu_cuc_bo: {},
    _dong_ho_dong_bo: null,
    _dong_ho_cuc_bo: null,
    _khoa_cho_dong_bo: new Set(),
    _khoa_cho_cuc_bo: new Set(),

    async khoi_tao() {
        return Promise.all([
            new Promise(dong_y => {
                chrome.storage.sync.get(null, du_lieu => {
                    this.du_lieu_dong_bo = du_lieu || {};
                    dong_y();
                });
            }),
            new Promise(dong_y => {
                chrome.storage.local.get(null, du_lieu => {
                    this.du_lieu_cuc_bo = du_lieu || {};
                    if (!this.du_lieu_cuc_bo.customEngines) this.du_lieu_cuc_bo.customEngines = [];
                    dong_y();
                });
            })
        ]);
    },

    lay(khoa, la_dong_bo = true) {
        return la_dong_bo ? this.du_lieu_dong_bo[khoa] : this.du_lieu_cuc_bo[khoa];
    },

    dat(khoa, gia_tri, la_dong_bo = true, ngay_lap_tuc = false) {
        if (la_dong_bo) {
            this.du_lieu_dong_bo[khoa] = gia_tri;
            this._khoa_cho_dong_bo.add(khoa);
            clearTimeout(this._dong_ho_dong_bo);
            if (ngay_lap_tuc || khoa === 'voiceIndex' || khoa === 'voiceName' || khoa === 'maydoc' || khoa === 'pauseComma' || khoa === 'pauseDot' || khoa === 'pausePara') {
                const du_lieu_luu = {};
                for (const k of this._khoa_cho_dong_bo) du_lieu_luu[k] = this.du_lieu_dong_bo[k];
                this._khoa_cho_dong_bo.clear();
                chrome.storage.sync.set(du_lieu_luu);
            } else {
                this._dong_ho_dong_bo = setTimeout(() => {
                    const du_lieu_luu = {};
                    for (const k of this._khoa_cho_dong_bo) du_lieu_luu[k] = this.du_lieu_dong_bo[k];
                    this._khoa_cho_dong_bo.clear();
                    chrome.storage.sync.set(du_lieu_luu);
                }, 300);
            }
        } else {
            this.du_lieu_cuc_bo[khoa] = gia_tri;
            this._khoa_cho_cuc_bo.add(khoa);
            clearTimeout(this._dong_ho_cuc_bo);
            if (ngay_lap_tuc) {
                const du_lieu_luu = {};
                for (const k of this._khoa_cho_cuc_bo) du_lieu_luu[k] = this.du_lieu_cuc_bo[k];
                this._khoa_cho_cuc_bo.clear();
                chrome.storage.local.set(du_lieu_luu);
            } else {
                this._dong_ho_cuc_bo = setTimeout(() => {
                    const du_lieu_luu = {};
                    for (const k of this._khoa_cho_cuc_bo) du_lieu_luu[k] = this.du_lieu_cuc_bo[k];
                    this._khoa_cho_cuc_bo.clear();
                    chrome.storage.local.set(du_lieu_luu);
                }, 300);
            }
        }
    },

    luu_ngay_lap_tuc() {
        if (this._khoa_cho_dong_bo.size > 0) {
            clearTimeout(this._dong_ho_dong_bo);
            const du_lieu_luu = {};
            for (const k of this._khoa_cho_dong_bo) du_lieu_luu[k] = this.du_lieu_dong_bo[k];
            this._khoa_cho_dong_bo.clear();
            chrome.storage.sync.set(du_lieu_luu);
        }
        if (this._khoa_cho_cuc_bo.size > 0) {
            clearTimeout(this._dong_ho_cuc_bo);
            const du_lieu_luu = {};
            for (const k of this._khoa_cho_cuc_bo) du_lieu_luu[k] = this.du_lieu_cuc_bo[k];
            this._khoa_cho_cuc_bo.clear();
            chrome.storage.local.set(du_lieu_luu);
        }
    },

    luu_tu_dien(tu_dien) {
        this.du_lieu_cuc_bo.customDict = tu_dien;
        chrome.storage.local.set({ customDict: tu_dien });
    }
};
