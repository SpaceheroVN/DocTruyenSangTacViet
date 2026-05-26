export const CauHinh = {
    duLieuDongBo: {},
    duLieuCucBo: {},
    _syncTimeout: null,
    _localTimeout: null,
    _pendingSyncKeys: new Set(),
    _pendingLocalKeys: new Set(),

    async khoiTao() {
        return Promise.all([
            new Promise(dongY => {
                chrome.storage.sync.get(null, duLieu => {
                    this.duLieuDongBo = duLieu;
                    dongY();
                });
            }),
            new Promise(dongY => {
                chrome.storage.local.get(null, duLieu => {
                    this.duLieuCucBo = duLieu;
                    dongY();
                });
            })
        ]);
    },

    lay(khoa, laDongBo = true) {
        return laDongBo ? this.duLieuDongBo[khoa] : this.duLieuCucBo[khoa];
    },

    dat(khoa, giaTri, laDongBo = true) {
        if (laDongBo) {
            this.duLieuDongBo[khoa] = giaTri;
            this._pendingSyncKeys.add(khoa);
            if (this._syncTimeout) clearTimeout(this._syncTimeout);
            this._syncTimeout = setTimeout(() => {
                const data = {};
                this._pendingSyncKeys.forEach(k => data[k] = this.duLieuDongBo[k]);
                chrome.storage.sync.set(data);
                this._pendingSyncKeys.clear();
            }, 300);
        } else {
            this.duLieuCucBo[khoa] = giaTri;
            this._pendingLocalKeys.add(khoa);
            if (this._localTimeout) clearTimeout(this._localTimeout);
            this._localTimeout = setTimeout(() => {
                const data = {};
                this._pendingLocalKeys.forEach(k => data[k] = this.duLieuCucBo[k]);
                chrome.storage.local.set(data);
                this._pendingLocalKeys.clear();
            }, 300);
        }
    },

    luuTuDien(tuDien) {
        this.duLieuCucBo.customDict = tuDien;
        chrome.storage.local.set({ customDict: tuDien });
        chrome.storage.sync.set({ customDict: tuDien });
    }
};
