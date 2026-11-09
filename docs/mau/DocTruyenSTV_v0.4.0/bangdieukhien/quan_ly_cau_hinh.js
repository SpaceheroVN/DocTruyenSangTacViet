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
                    if (!this.duLieuCucBo.customEngines) this.duLieuCucBo.customEngines = [];
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
            clearTimeout(this._syncTimeout);
            this._syncTimeout = setTimeout(() => {
                const data = {};
                for (const k of this._pendingSyncKeys) data[k] = this.duLieuDongBo[k];
                this._pendingSyncKeys.clear();
                chrome.storage.sync.set(data);
            }, 300);
        } else {
            this.duLieuCucBo[khoa] = giaTri;
            this._pendingLocalKeys.add(khoa);
            clearTimeout(this._localTimeout);
            this._localTimeout = setTimeout(() => {
                const data = {};
                for (const k of this._pendingLocalKeys) data[k] = this.duLieuCucBo[k];
                this._pendingLocalKeys.clear();
                chrome.storage.local.set(data);
            }, 300);
        }
    },

    luuTuDien(tuDien) {
        this.duLieuCucBo.customDict = tuDien;
        chrome.storage.local.set({ customDict: tuDien });
    }
};