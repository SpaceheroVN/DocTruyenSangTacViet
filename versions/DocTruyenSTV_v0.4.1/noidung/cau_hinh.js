'use strict';
var DocTruyenSTV_Ext = window.DocTruyenSTV_Ext || {};

// Quản lý từ điển, cache âm thanh IndexedDB và tiến trình đọc
DocTruyenSTV_Ext.LuuTruSTV = {
    tu_dien_tuy_chinh: [],
    tu_dien_da_bien_dich: [],
    _dong_ho_cho: null,
    _du_lieu_luu_cho: null,

    async khoi_tao() {
        return new Promise(dong_y => {
            chrome.storage.local.get('customDict', du_lieu => {
                this.tu_dien_tuy_chinh = du_lieu.customDict || [];
                this.cap_nhat_tu_dien(this.tu_dien_tuy_chinh);
                dong_y();
            });
        });
    },

    cap_nhat_tu_dien(tu_dien) {
        if (!Array.isArray(tu_dien)) return;
        this.tu_dien_da_bien_dich = tu_dien.map(quy_tac => {
            try {
                if (!quy_tac || !quy_tac[0] || typeof quy_tac[0] !== 'string') return null;
                const tu_goc = quy_tac[0].trim();
                if (!tu_goc) return null;
                const bat_dau_dau = tu_goc.startsWith('^');
                const ket_thuc_duoi = tu_goc.endsWith('$');
                const tu_da_cat = tu_goc.slice(bat_dau_dau ? 1 : 0, ket_thuc_duoi ? -1 : undefined).trim();
                if (!tu_da_cat) return null;
                let the_hien_re = this.thoat_ky_tu_regex(tu_da_cat);

                if (bat_dau_dau && ket_thuc_duoi) {
                    the_hien_re = '^' + the_hien_re + '$';
                } else if (bat_dau_dau) {
                    the_hien_re = '^' + the_hien_re + '(?=[^\\p{L}\\p{N}_]|$)';
                } else if (ket_thuc_duoi) {
                    the_hien_re = '(^|[^\\p{L}\\p{N}_])' + the_hien_re + '$';
                } else {
                    the_hien_re = '(^|[^\\p{L}\\p{N}_])' + the_hien_re + '(?=[^\\p{L}\\p{N}_]|$)';
                }
                return {
                    regex: new RegExp(the_hien_re, 'giu'),
                    thayThe: (bat_dau_dau ? '' : '$1') + (quy_tac[1] || '').replace(/\$/g, '$$$$')
                };
            } catch(l) { return null; }
        }).filter(Boolean);
    },

    thoat_ky_tu_regex(chuoi) {
        return chuoi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    _db_instance: null,

    lay_ket_noi_db() {
        if (this._db_instance) return Promise.resolve(this._db_instance);
        return new Promise((dong_y, tu_choi) => {
            const yeu_cau = indexedDB.open('STV_TTS_Cache', 1);
            yeu_cau.onupgradeneeded = (su_kien) => {
                if (!su_kien.target.result.objectStoreNames.contains('audioBlobs')) {
                    su_kien.target.result.createObjectStore('audioBlobs');
                }
            };
            yeu_cau.onsuccess = (su_kien) => {
                this._db_instance = su_kien.target.result;
                this._db_instance.onclose = () => { this._db_instance = null; };
                dong_y(this._db_instance);
            };
            yeu_cau.onerror = (su_kien) => tu_choi(su_kien.target.error);
        });
    },

    async luu_am_thanh(khoa, blob) {
        try {
            const db = await this.lay_ket_noi_db();
            return await new Promise((dong_y, tu_choi) => {
                const giao_dich = db.transaction('audioBlobs', 'readwrite');
                giao_dich.objectStore('audioBlobs').put({ blob: blob, timestamp: Date.now() }, khoa);
                giao_dich.oncomplete = () => dong_y();
                giao_dich.onerror = (su_kien) => tu_choi(su_kien.target.error);
            });
        } catch (l) { console.warn('Lỗi ghi IDB:', l); }
    },

    async lay_am_thanh(khoa) {
        try {
            const db = await this.lay_ket_noi_db();
            return await new Promise((dong_y) => {
                const giao_dich = db.transaction('audioBlobs', 'readonly');
                const yeu_cau = giao_dich.objectStore('audioBlobs').get(khoa);
                yeu_cau.onsuccess = () => {
                    if (!yeu_cau.result) dong_y(null);
                    else dong_y(yeu_cau.result instanceof Blob ? yeu_cau.result : yeu_cau.result.blob);
                };
                yeu_cau.onerror = () => dong_y(null);
            });
        } catch (l) { return null; }
    },

    async don_dep_cache_cu() {
        const lan_cuoi = localStorage.getItem('STV_last_cleanup');
        const bay_gio = Date.now();
        if (lan_cuoi && bay_gio - parseInt(lan_cuoi) < 12 * 60 * 60 * 1000) return;
        localStorage.setItem('STV_last_cleanup', bay_gio.toString());
        try {
            const db = await this.lay_ket_noi_db();
            return await new Promise((dong_y) => {
                const giao_dich = db.transaction('audioBlobs', 'readwrite');
                const kho_chua = giao_dich.objectStore('audioBlobs');
                const yeu_cau = kho_chua.openCursor();
                const thoi_gian_het_han = 12 * 60 * 60 * 1000;
                let tat_ca_ban_ghi = [];
                
                yeu_cau.onsuccess = (su_kien) => {
                    const con_tro = su_kien.target.result;
                    if (con_tro) {
                        const gia_tri = con_tro.value;
                        if (gia_tri instanceof Blob) {
                            con_tro.delete();
                        } else if (gia_tri && gia_tri.timestamp) {
                            if (bay_gio - gia_tri.timestamp > thoi_gian_het_han) {
                                con_tro.delete();
                            } else {
                                tat_ca_ban_ghi.push({ khoa: con_tro.key, thoi_gian: gia_tri.timestamp });
                            }
                        }
                        con_tro.continue();
                    } else {
                        if (tat_ca_ban_ghi.length > 500) {
                            tat_ca_ban_ghi.sort((a, b) => a.thoi_gian - b.thoi_gian);
                            const so_luong_can_xoa = tat_ca_ban_ghi.length - 500;
                            for (let i = 0; i < so_luong_can_xoa; i++) {
                                kho_chua.delete(tat_ca_ban_ghi[i].khoa);
                            }
                        }
                        dong_y();
                    }
                };
                yeu_cau.onerror = () => dong_y();
            });
        } catch (l) {}
    },

    async lay_anh_bia() {
        let link_truyen = '';
        const the_ten_truyen = document.getElementById('booknameholder');
        if (the_ten_truyen && the_ten_truyen.getAttribute('href')) {
            link_truyen = the_ten_truyen.getAttribute('href');
        } else {
            const duong_dan = window.location.pathname.split('/').filter(Boolean);
            if (duong_dan.length >= 4 && duong_dan[0] === 'truyen') {
                link_truyen = `/${duong_dan[0]}/${duong_dan[1]}/${duong_dan[2]}/${duong_dan[3]}/`;
            }
        }
        
        if (!link_truyen) return null;

        const parts = link_truyen.split('/').filter(Boolean);
        if (parts.length < 4) return null;
        const id_truyen = parts[3];
        const khoa = `bia_${id_truyen}`;
        const khoa_cu = `cover_${id_truyen}`;
        
        return new Promise(dong_y => {
            chrome.storage.local.get([khoa, khoa_cu], async du_lieu => {
                if (du_lieu[khoa] && du_lieu[khoa].startsWith('http')) { dong_y(du_lieu[khoa]); return; }
                if (du_lieu[khoa_cu] && du_lieu[khoa_cu].startsWith('http')) {
                    chrome.storage.local.set({ [khoa]: du_lieu[khoa_cu] });
                    dong_y(du_lieu[khoa_cu]);
                    return;
                }
                try {
                    const bo_dieu_khien = new AbortController();
                    const dong_ho = setTimeout(() => bo_dieu_khien.abort(), 15000);
                    const phan_hoi = await fetch(link_truyen, { signal: bo_dieu_khien.signal });
                    const html = await phan_hoi.text();
                    clearTimeout(dong_ho);
                    
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    let duong_dan_anh = '';
                    const danh_sach_the = ['#thumb-prop', '#book_img', '.book-thumb img', '.book-cover img', '.itembox img', 'meta[property="og:image"]'];
                    for (const the of danh_sach_the) {
                        const anh = doc.querySelector(the);
                        const link_goc = anh?.getAttribute('src') || anh?.getAttribute('content');
                        if (link_goc && link_goc.trim()) { duong_dan_anh = link_goc.trim(); break; }
                    }
                    
                    if (duong_dan_anh) {
                        if (duong_dan_anh.startsWith('//')) duong_dan_anh = window.location.protocol + duong_dan_anh;
                        else if (duong_dan_anh.startsWith('/')) duong_dan_anh = window.location.origin + duong_dan_anh;
                        else if (!duong_dan_anh.startsWith('http')) duong_dan_anh = window.location.origin + '/' + duong_dan_anh;
                        
                        if (duong_dan_anh.toLowerCase().startsWith('http://')) {
                            duong_dan_anh = 'https://' + duong_dan_anh.substring(7);
                        }

                        chrome.storage.local.set({ [khoa]: duong_dan_anh });
                        dong_y(duong_dan_anh);
                    } else dong_y(null);
                } catch { dong_y(null); }
            });
        });
    },

    async luu_tien_trinh_doc(trang_thai) {
        if (!trang_thai.tenTruyen || trang_thai.tongSoDoan === 0) return;

        const chunk_hien_tai = trang_thai.chiSoTuyetDoi || trang_thai.tienDoHienTai;

        const du_lieu_goc = {
            isPlaying: trang_thai.dang_phat !== undefined ? trang_thai.dang_phat : trang_thai.dangPhat,
            isPaused: trang_thai.dang_tam_dung !== undefined ? trang_thai.dang_tam_dung : trang_thai.dangTamDung,
            engine: trang_thai.cong_cu || trang_thai.congCu,
            progress: { current: chunk_hien_tai, total: trang_thai.tong_so_doan || trang_thai.tongSoDoan },
            bookTitle: trang_thai.tenTruyen,
            chapTitle: trang_thai.tenChuong,
            pageUrl: trang_thai.duongDanTrang
        };
        chrome.storage.local.set({ last_active_state: du_lieu_goc });

        this._thuc_hien_luu_danh_sach(du_lieu_goc);
    },

    _thuc_hien_luu_danh_sach(du_lieu_goc) {
        this._du_lieu_luu_cho = du_lieu_goc;
        if (this._dong_ho_cho) {
            clearTimeout(this._dong_ho_cho);
        }
        this._dong_ho_cho = setTimeout(() => {
            this.flush_luu_danh_sach_ngay();
        }, 3000);
    },

    flush_luu_danh_sach_ngay() {
        if (this._dong_ho_cho) {
            clearTimeout(this._dong_ho_cho);
            this._dong_ho_cho = null;
        }
        const du_lieu_goc = this._du_lieu_luu_cho;
        if (!du_lieu_goc || !du_lieu_goc.bookTitle) return;
        this._du_lieu_luu_cho = null;

        try {
            chrome.storage.local.get('readingList', du_lieu => {
                let danh_sach = du_lieu.readingList || [];
                let vi_tri = danh_sach.findIndex(i => (i.title || '').trim().toLowerCase() === (du_lieu_goc.bookTitle || '').trim().toLowerCase());
                
                if (vi_tri !== -1) {
                    let can_cap_nhat = false;
                    if (danh_sach[vi_tri].url !== du_lieu_goc.pageUrl) { danh_sach[vi_tri].url = du_lieu_goc.pageUrl; can_cap_nhat = true; }
                    if (danh_sach[vi_tri].chap !== du_lieu_goc.chapTitle) { danh_sach[vi_tri].chap = du_lieu_goc.chapTitle; can_cap_nhat = true; }
                    const chunk_moi = du_lieu_goc.progress ? du_lieu_goc.progress.current : null;
                    if (chunk_moi !== null && danh_sach[vi_tri].chunkIndex !== chunk_moi) {
                        danh_sach[vi_tri].chunkIndex = chunk_moi;
                        can_cap_nhat = true;
                    }
                    
                    if (can_cap_nhat) chrome.storage.local.set({ readingList: danh_sach });
                }
            });
        } catch (e) {}
    }
};
