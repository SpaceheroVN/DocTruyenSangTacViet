'use strict';
var DocTruyenSTV_Ext = window.DocTruyenSTV_Ext || {};

DocTruyenSTV_Ext.LuuTruSTV = {
    boNhoDemDB: [],
    tuDienTuyChinh: [],
    tuDienDaBienDich: [],
    dangLuuTrangThai: false,
    dangChoLuu: false,

    async khoiTao() {
        try {
            this.boNhoDemDB = JSON.parse(sessionStorage.getItem('STV_bo_nho_dem_db') || '[]');
        } catch(l) {}
        
        return new Promise(dongY => {
            chrome.storage.local.get('customDict', duLieu => {
                this.tuDienTuyChinh = duLieu.customDict || [];
                this.capNhatTuDien(this.tuDienTuyChinh);
                dongY();
            });
        });
    },

    capNhatTuDien(tuDien) {
        this.tuDienDaBienDich = tuDien.slice(0, 50).map(quyTac => {
            try {
                let theHienRe = this.thoatKyTuRegex(quyTac[0]);
                if (!theHienRe.startsWith('^') && !theHienRe.endsWith('$')) {
                    theHienRe = '(^|[^\\p{L}\\p{N}_])' + theHienRe + '(?=[^\\p{L}\\p{N}_]|$)';
                }
                return {
                    regex: new RegExp(theHienRe, 'giu'),
                    thayThe: '$1' + quyTac[1].replace(/\$/g, '$$$$')
                };
            } catch(l) { return null; }
        }).filter(Boolean);
    },

    thoatKyTuRegex(chuoi) {
        return chuoi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    anToanUrl(url) {
        const u = String(url).trim();
        if (/^(https?:\/\/|data:image\/)/i.test(u)) return u;
        return 'https://sangtacviet.com/homepage/img/sangtacviet-logo.png';
    },

    _db_instance: null,

    layKetNoiDB() {
        if (this._db_instance) return Promise.resolve(this._db_instance);
        return new Promise((dongY, tuChoi) => {
            const yeuCau = indexedDB.open('STV_TTS_Cache', 1);
            yeuCau.onupgradeneeded = (suKien) => {
                if (!suKien.target.result.objectStoreNames.contains('audioBlobs')) {
                    suKien.target.result.createObjectStore('audioBlobs');
                }
            };
            yeuCau.onsuccess = (suKien) => {
                this._db_instance = suKien.target.result;
                this._db_instance.onclose = () => { this._db_instance = null; };
                dongY(this._db_instance);
            };
            yeuCau.onerror = (suKien) => tuChoi(suKien.target.error);
        });
    },

    async luuAmThanh(khoa, blob) {
        try {
            const db = await this.layKetNoiDB();
            return await new Promise((dongY, tuChoi) => {
                const giaoDich = db.transaction('audioBlobs', 'readwrite');
                giaoDich.objectStore('audioBlobs').put({ blob: blob, timestamp: Date.now() }, khoa);
                giaoDich.oncomplete = () => {
                    if (!this.boNhoDemDB.includes(khoa)) {
                        this.boNhoDemDB.push(khoa);
                        sessionStorage.setItem('STV_bo_nho_dem_db', JSON.stringify(this.boNhoDemDB));
                    }
                    dongY();
                };
                giaoDich.onerror = (suKien) => tuChoi(suKien.target.error);
            });
        } catch (l) { console.warn('Lỗi ghi IDB:', l); }
    },

    async layAmThanh(khoa) {
        try {
            const db = await this.layKetNoiDB();
            return await new Promise((dongY) => {
                const giaoDich = db.transaction('audioBlobs', 'readonly');
                const yeuCau = giaoDich.objectStore('audioBlobs').get(khoa);
                yeuCau.onsuccess = () => {
                    if (!yeuCau.result) dongY(null);
                    else dongY(yeuCau.result instanceof Blob ? yeuCau.result : yeuCau.result.blob);
                };
                yeuCau.onerror = () => dongY(null);
            });
        } catch (l) { return null; }
    },

    async donDepCacheCu() {
        try {
            const db = await this.layKetNoiDB();
            return await new Promise((dongY) => {
                const giaoDich = db.transaction('audioBlobs', 'readwrite');
                const khoChua = giaoDich.objectStore('audioBlobs');
                const yeuCau = khoChua.openCursor();
                const bayGio = Date.now();
                const thoiGianHetHan = 12 * 60 * 60 * 1000;
                let tatCaBanGhi = [];
                
                yeuCau.onsuccess = (suKien) => {
                    const conTro = suKien.target.result;
                    if (conTro) {
                        const giaTri = conTro.value;
                        if (!(giaTri instanceof Blob) && giaTri.timestamp) {
                            if (bayGio - giaTri.timestamp > thoiGianHetHan) {
                                conTro.delete();
                            } else {
                                tatCaBanGhi.push({ khoa: conTro.key, thoiGian: giaTri.timestamp });
                            }
                        }
                        conTro.continue();
                    } else {
                        if (tatCaBanGhi.length > 500) {
                            tatCaBanGhi.sort((a, b) => a.thoiGian - b.thoiGian);
                            const soLuongCanXoa = tatCaBanGhi.length - 500;
                            for (let i = 0; i < soLuongCanXoa; i++) {
                                khoChua.delete(tatCaBanGhi[i].khoa);
                            }
                        }
                        dongY();
                    }
                };
                yeuCau.onerror = () => dongY();
            });
        } catch (l) {}
    },

    async xoaToanBoDuLieu() {
        try {
            const db = await this.layKetNoiDB();
            return await new Promise((dongY) => {
                const giaoDich = db.transaction('audioBlobs', 'readwrite');
                giaoDich.objectStore('audioBlobs').clear();
                giaoDich.oncomplete = () => {
                    this.boNhoDemDB = [];
                    sessionStorage.removeItem('STV_bo_nho_dem_db');
                    dongY();
                };
                giaoDich.onerror = () => dongY();
            });
        } catch (l) {
            this.boNhoDemDB = [];
            sessionStorage.removeItem('STV_bo_nho_dem_db');
        }
    },

    async layAnhBia() {
        let linkTruyen = '';
        const theTenTruyen = document.getElementById('booknameholder');
        if (theTenTruyen && theTenTruyen.getAttribute('href')) {
            linkTruyen = theTenTruyen.getAttribute('href');
        } else {
            const duongDan = window.location.pathname.split('/').filter(Boolean);
            if (duongDan.length >= 4 && duongDan[0] === 'truyen') {
                linkTruyen = `/${duongDan[0]}/${duongDan[1]}/${duongDan[2]}/${duongDan[3]}/`;
            }
        }
        
        if (!linkTruyen) return null;

        const parts = linkTruyen.split('/').filter(Boolean);
        if (parts.length < 4) return null;
        const idTruyen = parts[3];
        const khoa = `bia_${idTruyen}`;
        const khoaCu = `cover_${idTruyen}`;
        
        return new Promise(dongY => {
            chrome.storage.local.get([khoa, khoaCu], async duLieu => {
                if (duLieu[khoa] && duLieu[khoa].startsWith('http')) { dongY(duLieu[khoa]); return; }
                if (duLieu[khoaCu] && duLieu[khoaCu].startsWith('http')) {
                    chrome.storage.local.set({ [khoa]: duLieu[khoaCu] });
                    dongY(duLieu[khoaCu]);
                    return;
                }
                try {
                    const boDieuKhien = new AbortController();
                    const dongHo = setTimeout(() => boDieuKhien.abort(), 15000);
                    const phanHoi = await fetch(linkTruyen, { signal: boDieuKhien.signal });
                    const html = await phanHoi.text();
                    clearTimeout(dongHo);
                    
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    let duongDanAnh = '';
                    const danhSachThe = ['#thumb-prop', '#book_img', '.book-thumb img', '.book-cover img', '.itembox img', 'meta[property="og:image"]'];
                    for (const the of danhSachThe) {
                        const anh = doc.querySelector(the);
                        const linkGoc = anh?.getAttribute('src') || anh?.getAttribute('content');
                        if (linkGoc && linkGoc.trim()) { duongDanAnh = linkGoc.trim(); break; }
                    }
                    
                    if (duongDanAnh) {
                        if (duongDanAnh.startsWith('//')) duongDanAnh = window.location.protocol + duongDanAnh;
                        else if (duongDanAnh.startsWith('/')) duongDanAnh = window.location.origin + duongDanAnh;
                        else if (!duongDanAnh.startsWith('http')) duongDanAnh = window.location.origin + '/' + duongDanAnh;
                        
                        if (duongDanAnh.toLowerCase().startsWith('http://')) {
                            duongDanAnh = 'https://' + duongDanAnh.substring(7);
                        }

                        chrome.storage.local.set({ [khoa]: duongDanAnh });
                        dongY(duongDanAnh);
                    } else dongY(null);
                } catch { dongY(null); }
            });
        });
    },

    async luuTienTrinhDoc(trangThai) {
        if (!trangThai.tenTruyen || trangThai.tongSoDoan === 0) return;

        const chunkHienTai = trangThai.chiSoTuyetDoi || trangThai.tienDoHienTai;

        const duLieuGoc = {
            isPlaying: trangThai.dangPhat,
            isPaused: trangThai.dangTamDung,
            engine: trangThai.congCu,
            progress: { current: chunkHienTai, total: trangThai.tongSoDoan },
            bookTitle: trangThai.tenTruyen,
            chapTitle: trangThai.tenChuong,
            pageUrl: trangThai.duongDanTrang
        };
        chrome.storage.local.set({ last_active_state: duLieuGoc });

        this._thucHienLuuDanhSach(duLieuGoc);
    },

    _thucHienLuuDanhSach(duLieuGoc) {
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }
        this._debounceTimer = setTimeout(() => {
            navigator.locks.request('stv_readingList_lock', () => {
                return new Promise(moKhoa => {
                    chrome.storage.local.get('readingList', duLieu => {
                        let danhSach = duLieu.readingList || [];
                        let viTri = danhSach.findIndex(i => (i.title || '').trim().toLowerCase() === (duLieuGoc.bookTitle || '').trim().toLowerCase());
                        
                        const hoanTat = () => { moKhoa(); };
                        
                        if (viTri !== -1) {
                            let canCapNhat = false;
                            if (danhSach[viTri].url !== duLieuGoc.pageUrl) { danhSach[viTri].url = duLieuGoc.pageUrl; canCapNhat = true; }
                            if (danhSach[viTri].chap !== duLieuGoc.chapTitle) { danhSach[viTri].chap = duLieuGoc.chapTitle; canCapNhat = true; }
                            const chunkMoi = duLieuGoc.progress.current;
                            if (danhSach[viTri].chunkIndex !== chunkMoi) {
                                danhSach[viTri].chunkIndex = chunkMoi;
                                canCapNhat = true;
                            }
                            
                            if (canCapNhat) chrome.storage.local.set({ readingList: danhSach }, hoanTat);
                            else hoanTat();
                        } else hoanTat();
                    });
                });
            });
        }, 3000);
    }
};
