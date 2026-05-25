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
                return {
                    regex: new RegExp(this.thoatKyTuRegex(quyTac.origin), 'gi'),
                    thayThe: quyTac.replace.replace(/\$/g, '$$$$')
                };
            } catch(l) { return null; }
        }).filter(Boolean);
    },

    thoatKyTuRegex(chuoi) {
        return chuoi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    anToanUrl(url) {
        const u = String(url).trim();
        if (/^(https?|data):/i.test(u)) return u;
        return 'https://sangtacviet.com/homepage/img/sangtacviet-logo.png';
    },

    layKetNoiDB() {
        return new Promise((dongY, tuChoi) => {
            const yeuCau = indexedDB.open('STV_TTS_Cache', 1);
            yeuCau.onupgradeneeded = (suKien) => {
                if (!suKien.target.result.objectStoreNames.contains('audioBlobs')) {
                    suKien.target.result.createObjectStore('audioBlobs');
                }
            };
            yeuCau.onsuccess = (suKien) => dongY(suKien.target.result);
            yeuCau.onerror = (suKien) => tuChoi(suKien);
        });
    },

    async luuAmThanh(khoa, blob) {
        try {
            const db = await this.layKetNoiDB();
            return await new Promise((dongY, tuChoi) => {
                const giaoDich = db.transaction('audioBlobs', 'readwrite');
                giaoDich.objectStore('audioBlobs').put({ blob: blob, timestamp: Date.now() }, khoa);
                giaoDich.oncomplete = () => {
                    db.close();
                    if (!this.boNhoDemDB.includes(khoa)) {
                        this.boNhoDemDB.push(khoa);
                        sessionStorage.setItem('STV_bo_nho_dem_db', JSON.stringify(this.boNhoDemDB));
                    }
                    dongY();
                };
                giaoDich.onerror = (suKien) => { db.close(); tuChoi(suKien.target.error); };
            });
        } catch (l) { console.warn('Lỗi ghi IDB:', l); }
    },

    async layAmThanh(khoa) {
        let db;
        try {
            db = await this.layKetNoiDB();
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
        finally { if (db) db.close(); }
    },

    async donDepCacheCu() {
        let db;
        try {
            db = await this.layKetNoiDB();
            return await new Promise((dongY) => {
                const giaoDich = db.transaction('audioBlobs', 'readwrite');
                const khoChua = giaoDich.objectStore('audioBlobs');
                const yeuCau = khoChua.openCursor();
                const bayGio = Date.now();
                const thoiGianHetHan = 12 * 60 * 60 * 1000;
                
                yeuCau.onsuccess = (suKien) => {
                    const conTro = suKien.target.result;
                    if (conTro) {
                        const giaTri = conTro.value;
                        if (!(giaTri instanceof Blob) && giaTri.timestamp) {
                            if (bayGio - giaTri.timestamp > thoiGianHetHan) conTro.delete();
                        }
                        conTro.continue();
                    } else {
                        dongY();
                    }
                };
                yeuCau.onerror = () => dongY();
            });
        } catch (l) {}
        finally { if (db) db.close(); }
    },

    async xoaToanBoDuLieu() {
        let db;
        try {
            db = await this.layKetNoiDB();
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
        finally { if (db) db.close(); }
    },

    async layAnhBia() {
        const duongDan = window.location.pathname.split('/').filter(Boolean);
        if (duongDan.length < 4 || duongDan[0] !== 'truyen') return null;
        const khoa = `bia_${duongDan[3]}`;
        
        return new Promise(dongY => {
            chrome.storage.local.get(khoa, async duLieu => {
                if (duLieu[khoa] && duLieu[khoa].startsWith('http')) { dongY(duLieu[khoa]); return; }
                try {
                    const boDieuKhien = new AbortController();
                    const dongHo = setTimeout(() => boDieuKhien.abort(), 3000);
                    const phanHoi = await fetch(`/${duongDan[0]}/${duongDan[1]}/${duongDan[2]}/${duongDan[3]}/`, { signal: boDieuKhien.signal });
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
                        chrome.storage.local.set({ [khoa]: duongDanAnh });
                        dongY(duongDanAnh);
                    } else dongY(null);
                } catch { dongY(null); }
            });
        });
    },

    async luuTienTrinhDoc(trangThai) {
        if (!trangThai.tenTruyen || trangThai.tongSoDoan === 0) return;

        const duLieuGoc = {
            isPlaying: trangThai.dangPhat,
            isPaused: trangThai.dangTamDung,
            engine: trangThai.congCu,
            progress: { current: trangThai.tienDoHienTai, total: trangThai.tongSoDoan },
            bookTitle: trangThai.tenTruyen,
            chapTitle: trangThai.tenChuong,
            pageUrl: trangThai.duongDanTrang
        };
        chrome.storage.local.set({ last_active_state: duLieuGoc });

        if (this.dangLuuTrangThai) {
            this.dangChoLuu = true;
            return;
        }

        this.dangLuuTrangThai = true;
        try {
            await this._thucHienLuuDanhSach(duLieuGoc);
        } catch (l) {
        } finally {
            this.dangLuuTrangThai = false;
            if (this.dangChoLuu) {
                this.dangChoLuu = false;
                this.luuTienTrinhDoc(trangThai);
            }
        }
    },

    _thucHienLuuDanhSach(duLieuGoc) {
        return new Promise(dongY => {
            if (this._debounceTimer) clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => {
                chrome.storage.local.get('readingList', duLieu => {
                    let danhSach = duLieu.readingList || [];
                    let viTri = danhSach.findIndex(i => (i.title || '').trim().toLowerCase() === (duLieuGoc.bookTitle || '').trim().toLowerCase());
                    
                    if (viTri !== -1) {
                        let canCapNhat = false;
                        if (danhSach[viTri].url !== duLieuGoc.pageUrl) { danhSach[viTri].url = duLieuGoc.pageUrl; canCapNhat = true; }
                        if (danhSach[viTri].chap !== duLieuGoc.chapTitle) { danhSach[viTri].chap = duLieuGoc.chapTitle; canCapNhat = true; }
                        if (danhSach[viTri].chunkIndex !== duLieuGoc.progress.current || danhSach[viTri].chunkTotal !== duLieuGoc.progress.total) {
                            danhSach[viTri].chunkIndex = duLieuGoc.progress.current;
                            danhSach[viTri].chunkTotal = duLieuGoc.progress.total;
                            canCapNhat = true;
                        }
                        
                        if (canCapNhat) chrome.storage.local.set({ readingList: danhSach }, dongY);
                        else dongY();
                    } else dongY();
                });
            }, 3000);
        });
    }
};
