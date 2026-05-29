'use strict';
var DocTruyenSTV_Ext = window.DocTruyenSTV_Ext || {};

DocTruyenSTV_Ext.QuanLyDongCoAmThanh = {
    bo_nguon: null,
    bo_chinh_am: null,
    lay_nguon() {
        if (!this.bo_nguon) {
            this.bo_nguon = new (window.AudioContext || window.webkitAudioContext)();
            this.bo_chinh_am = this.bo_nguon.createGain();
            this.bo_chinh_am.connect(this.bo_nguon.destination);
        }
        if (this.bo_nguon.state === 'suspended') this.bo_nguon.resume();
        return { bo_nguon: this.bo_nguon, bo_chinh_am: this.bo_chinh_am };
    },
    dong_nguon() {
        if (this.bo_nguon && this.bo_nguon.state === 'running') {
            this.bo_nguon.suspend();
        }
    },
    tam_dung() {
        if (this.bo_nguon && this.bo_nguon.state === 'running') this.bo_nguon.suspend();
    },
    tiep_tuc() {
        if (this.bo_nguon && this.bo_nguon.state === 'suspended') this.bo_nguon.resume();
    }
};

DocTruyenSTV_Ext.TrinhPhatAmThanh = {
    dangPhat: false,
    dangTamDung: false,
    dangTai: false,
    congCu: 'auto',
    tocDo: 1,
    amLuong: 1,
    chiSoGiong: 0,
    thoiGianNghi: 1000,
    tuDongChuyenChuong: true,

    cacDoan: [],
    chiSoHienTai: 0,
    
    doiTuongAmThanh: null,
    phatNgonHienTai: null,
    duongDanBoNhoDem: null,
    
    dongHoGiamSat: null,
    dongHoDuyTri: null,
    dongHoLuuTrangThai: null,
    idLuotPhat: 0,
    giayDaTroi: 0,
    dongHoThoiGian: null,

    khoiTao() {
        chrome.storage.sync.get(['speed', 'volume', 'voiceIndex', 'maydoc', 'tudongchuyenchuong', 'smartPauses', 'doctentruyen', 'doctenchuong'], duLieu => {
            this.tocDo = duLieu.speed !== undefined ? duLieu.speed : 1;
            this.amLuong = duLieu.volume !== undefined ? duLieu.volume : 1;
            this.chiSoGiong = duLieu.voiceIndex !== undefined ? duLieu.voiceIndex : 0;
            this.congCu = duLieu.maydoc || 'auto';
            this.tuDongChuyenChuong = duLieu.tudongchuyenchuong !== undefined ? duLieu.tudongchuyenchuong : true;
            this.thoiGianNghi = duLieu.smartPauses !== undefined ? duLieu.smartPauses : 1000;
            this.docTenTruyen = duLieu.doctentruyen !== undefined ? duLieu.doctentruyen : true;
            this.docTenChuong = duLieu.doctenchuong !== undefined ? duLieu.doctenchuong : true;
        });
        
        chrome.storage.onChanged.addListener((thayDoi, vungChon) => {
            if (vungChon === 'sync') {
                if (thayDoi.speed) {
                    this.tocDo = thayDoi.speed.newValue;
                    if (this.doiTuongAmThanh) this.doiTuongAmThanh.playbackRate = this.tocDo;
                }
                if (thayDoi.volume) {
                    this.amLuong = thayDoi.volume.newValue;
                    if (this.doiTuongAmThanh) this.doiTuongAmThanh.volume = Math.min(this.amLuong, 1.0);
                    if (DocTruyenSTV_Ext.QuanLyDongCoAmThanh && DocTruyenSTV_Ext.QuanLyDongCoAmThanh.bo_chinh_am) {
                        DocTruyenSTV_Ext.QuanLyDongCoAmThanh.bo_chinh_am.gain.value = this.amLuong;
                    }
                }
                if (thayDoi.maydoc) this.congCu = thayDoi.maydoc.newValue;
                if (thayDoi.voiceIndex) this.chiSoGiong = thayDoi.voiceIndex.newValue;
                if (thayDoi.tudongchuyenchuong) this.tuDongChuyenChuong = thayDoi.tudongchuyenchuong.newValue;
                if (thayDoi.smartPauses) this.thoiGianNghi = thayDoi.smartPauses.newValue;
                if (thayDoi.doctentruyen !== undefined || thayDoi.doctenchuong !== undefined) {
                    if (thayDoi.doctentruyen !== undefined) this.docTenTruyen = thayDoi.doctentruyen.newValue;
                    if (thayDoi.doctenchuong !== undefined) this.docTenChuong = thayDoi.doctenchuong.newValue;
                    
                    let doanHienTai = '';
                    if (this.cacDoan.length > 0 && this.chiSoHienTai < this.cacDoan.length) {
                        doanHienTai = this.cacDoan[this.chiSoHienTai].text;
                    }
                    this.chuanBiCacDoan();
                    if (doanHienTai) {
                        const viTriMoi = this.cacDoan.findIndex(d => d.text === doanHienTai);
                        if (viTriMoi !== -1) this.chiSoHienTai = viTriMoi;
                        else if (this.chiSoHienTai >= this.cacDoan.length) this.chiSoHienTai = Math.max(0, this.cacDoan.length - 1);
                    }
                    DocTruyenSTV_Ext.GiaoDienSTV.boiDenDoan(this.chiSoHienTai, this.cacDoan, this.dangPhat, this.dangTamDung);
                }
            }
        });
        
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('a');
            if (btn && btn.href && btn.href.includes('/truyen/')) {
                this._cacTheDaLuu = null;
                this.cacDoan = [];
            }
        });
    },

    layCongCuThucTe() {
        return (this.congCu === 'auto' || this.congCu === 'google') ? 'web' : this.congCu;
    },

    layTongSoDoan() {
        return this.cacDoan.length;
    },

    layChiSoHienTai() {
        return this.chiSoHienTai;
    },

    layChiSoToanCuc() {
        if (!this._cacTheDaLuu || this.cacDoan.length === 0) return this.chiSoHienTai;
        let offset = 0;
        const doDaiToiDa = this.layCongCuThucTe() === 'web' ? 250 : 5000;
        if (!this.docTenTruyen) {
            let titleThe = this._cacTheDaLuu.find(t => t.isTenTruyen);
            if (titleThe) offset += DocTruyenSTV_Ext.PhanTichSTV.taoDanhSachPhat([titleThe], doDaiToiDa).length;
        }
        if (!this.docTenChuong) {
            let chapThe = this._cacTheDaLuu.find(t => t.isTenChuong);
            if (chapThe) offset += DocTruyenSTV_Ext.PhanTichSTV.taoDanhSachPhat([chapThe], doDaiToiDa).length;
        }
        return this.chiSoHienTai + offset;
    },

    tinhChiSoThuc(absoluteIndex) {
        if (!this._cacTheDaLuu) return absoluteIndex;
        let offset = 0;
        const doDaiToiDa = this.layCongCuThucTe() === 'web' ? 250 : 5000;
        if (!this.docTenTruyen) {
            let titleThe = this._cacTheDaLuu.find(t => t.isTenTruyen);
            if (titleThe) offset += DocTruyenSTV_Ext.PhanTichSTV.taoDanhSachPhat([titleThe], doDaiToiDa).length;
        }
        if (!this.docTenChuong) {
            let chapThe = this._cacTheDaLuu.find(t => t.isTenChuong);
            if (chapThe) offset += DocTruyenSTV_Ext.PhanTichSTV.taoDanhSachPhat([chapThe], doDaiToiDa).length;
        }
        return Math.max(0, absoluteIndex - offset);
    },

    _debouncedTrangThai: null,
    PhatTinNhanTrangThai() {
        DocTruyenSTV_Ext.GiaoDienSTV.capNhatBangDieuKhien(this.chiSoHienTai, this.cacDoan.length, this.dangPhat, this.dangTamDung);
        
        if (this._debouncedTrangThai) return;
        this._debouncedTrangThai = setTimeout(() => {
            this._debouncedTrangThai = null;
            chrome.runtime.sendMessage({
                hanhDong: 'thayDoiTrangThai',
                trangThai: {
                    isPlaying: this.dangPhat,
                    isPaused: this.dangTamDung,
                    isBuffering: this.dangTai,
                    engine: this.congCu,
                    elapsed: this.giayDaTroi,
                    coDocDo: this.chiSoHienTai > 0,
                    progress: this.cacDoan.length > 0 ? { current: this.chiSoHienTai + 1, total: this.cacDoan.length } : null,
                    absoluteProgress: this._cacTheDaLuu ? { current: this.layChiSoToanCuc() + 1 } : null
                }
            }, () => {
                if (chrome.runtime.lastError) {  }
            });
        }, 200);
    },

    _cacTheDaLuu: null,

    chuanBiCacDoan() {
        const congCuThuc = this.layCongCuThucTe();
        const doDaiToiDa = congCuThuc === 'web' ? 250 : 5000;
        
        if (!this._cacTheDaLuu) {
            this._cacTheDaLuu = DocTruyenSTV_Ext.PhanTichSTV.chuanBiNoiDungThe();
        }
        
        let cacThe = this._cacTheDaLuu.filter(t => {
            if (!this.docTenTruyen && t.isTenTruyen) return false;
            if (!this.docTenChuong && t.isTenChuong) return false;
            return true;
        });
        
        this.cacDoan = DocTruyenSTV_Ext.PhanTichSTV.taoDanhSachPhat(cacThe, doDaiToiDa);
    },

    batDauPhat(tuViTri = null) {
        if (this.cacDoan.length === 0) this.chuanBiCacDoan();
        if (this.cacDoan.length === 0) return;
        
        if (this.dongHoThoiGian) { clearInterval(this.dongHoThoiGian); this.dongHoThoiGian = null; }
        this.giayDaTroi = 0;
        this.dongHoThoiGian = setInterval(() => {
            if (this.dangPhat && !this.dangTamDung) {
                this.giayDaTroi++;
                this.PhatTinNhanTrangThai();
            }
        }, 1000);
        
        if (tuViTri !== null) this.chiSoHienTai = tuViTri;
        
        this.dangPhat = true;
        this.dangTamDung = false;
        this.idLuotPhat++;
        this.PhatTinNhanTrangThai();

        const congCuThuc = this.layCongCuThucTe();
        if (congCuThuc === 'web') this.phatDoanWeb();
        else this.phatDoanAPI();
    },

    dungPhat() {
        this.dangPhat = false;
        this.dangTamDung = false;
        this.dangTai = false;
        this.idLuotPhat++;
        if (this.dongHoThoiGian) { clearInterval(this.dongHoThoiGian); this.dongHoThoiGian = null; }
        this.giayDaTroi = 0;
        this.huyTaiAPI();
        this.huyAmThanhWeb();
        
        if (this._mediaSource) {
            this._mediaSource.disconnect();
            this._mediaSource = null;
        }
        if (this.doiTuongAmThanh) {
            this.doiTuongAmThanh.pause();
            this.doiTuongAmThanh.src = '';
            this.doiTuongAmThanh = null;
        }
        DocTruyenSTV_Ext.QuanLyDongCoAmThanh.dong_nguon();
        if (this.duongDanBoNhoDem) {
            URL.revokeObjectURL(this.duongDanBoNhoDem);
            this.duongDanBoNhoDem = null;
        }
        
        DocTruyenSTV_Ext.GiaoDienSTV.xoaBoiDen();
        this.PhatTinNhanTrangThai();
    },

    tamDungPhat() {
        if (!this.dangPhat) return;
        this.dangTamDung = true;
        this.PhatTinNhanTrangThai();

        if (this.layCongCuThucTe() === 'web') {
            window.speechSynthesis.pause();
        } else {
            if (this.doiTuongAmThanh) this.doiTuongAmThanh.pause();
            DocTruyenSTV_Ext.QuanLyDongCoAmThanh.tam_dung();
        }
    },

    tiepTucPhat() {
        if (!this.dangPhat || !this.dangTamDung) return;
        this.dangTamDung = false;
        this.PhatTinNhanTrangThai();

        if (this.layCongCuThucTe() === 'web') {
            window.speechSynthesis.resume();
        } else {
            if (this.doiTuongAmThanh) this.doiTuongAmThanh.play();
            DocTruyenSTV_Ext.QuanLyDongCoAmThanh.tiep_tuc();
        }
    },

    capNhatTuDienDong() {
        const chiSoCu = this.chiSoHienTai;
        const dangPhatTruocDo = this.dangPhat && !this.dangTamDung;
        
        if (this.dangPhat || this.dangTamDung) {
            this.huyAmThanhWeb();
            if (this.doiTuongAmThanh) {
                this.doiTuongAmThanh.pause();
                this.doiTuongAmThanh.src = '';
            }
        }
        
        this._cacTheDaLuu = null;
        this.cacDoan = [];
        document.querySelectorAll('.contentbox').forEach(k => {
            delete k.dataset.extTtsDone;
        });
        
        this.chuanBiCacDoan();
        DocTruyenSTV_Ext.GiaoDienSTV.boiDenDoan(
            Math.min(chiSoCu, Math.max(0, this.cacDoan.length - 1)),
            this.cacDoan, false, false
        );
        
        if (dangPhatTruocDo) {
            const viTriMoi = Math.min(chiSoCu, Math.max(0, this.cacDoan.length - 1));
            this.batDauPhat(viTriMoi);
        }
    },

    daoTrangThaiPhat() {
        if (!this.dangPhat) this.batDauPhat();
        else if (this.dangTamDung) this.tiepTucPhat();
        else this.tamDungPhat();
    },

    nhayDoan(huong) {
        if (this.cacDoan.length === 0) return;
        let viTriTiep = huong === 'tiep' ? this.chiSoHienTai + 1 : this.chiSoHienTai - 1;
        if (viTriTiep >= 0 && viTriTiep < this.cacDoan.length) {
            this.batDauPhat(viTriTiep);
        } else if (viTriTiep >= this.cacDoan.length && this.tuDongChuyenChuong) {
            this.phatChuongTiepTheo();
        } else if (viTriTiep < 0) {
            this.phatChuongTruoc();
        }
    },

    phatChuongTiepTheo() {
        if (DocTruyenSTV_Ext.LuuTruSTV && DocTruyenSTV_Ext.LuuTruSTV.donDepCacheCu) {
            DocTruyenSTV_Ext.LuuTruSTV.donDepCacheCu();
        }
        const banChon = ['#navnexttop', '#navnextbot', '#navnext', '#nav_next', '#btnnext', '#btn_next', '.btn-next-chapter', 'a.next', '.chapter-next a', '[data-nav="next"]'];
        let nutTiep = null;
        for (const chon of banChon) {
            nutTiep = document.querySelector(chon);
            if (nutTiep) break;
        }
        if (!nutTiep) {
            const cacLienKet = Array.from(document.querySelectorAll('a, button'));
            nutTiep = cacLienKet.find(el => {
                const text = el.textContent.toLowerCase().trim();
                return text === 'chương sau' || text === 'chương tiếp' || text.includes('tiếp theo');
            });
        }
        
        if (nutTiep) {
            this.dungPhat();
            sessionStorage.setItem('autoStartOnLoad', 'true');
            nutTiep.click();
        } else {
            DocTruyenSTV_Ext.GiaoDienSTV.hienThiThongBao('Không có chương tiếp theo');
            this.dungPhat();
        }
    },

    phatChuongTruoc() {
        if (DocTruyenSTV_Ext.LuuTruSTV && DocTruyenSTV_Ext.LuuTruSTV.donDepCacheCu) {
            DocTruyenSTV_Ext.LuuTruSTV.donDepCacheCu();
        }
        const banChon = ['#navprevtop', '#navprevbot', '#navprev', '#nav_prev', '#btnprev', '#btn_prev', '.btn-prev-chapter', 'a.prev', '.chapter-prev a', '[data-nav="prev"]'];
        let nutTruoc = null;
        for (const chon of banChon) {
            nutTruoc = document.querySelector(chon);
            if (nutTruoc) break;
        }
        if (!nutTruoc) {
            const cacLienKet = Array.from(document.querySelectorAll('a, button'));
            nutTruoc = cacLienKet.find(el => {
                const text = el.textContent.toLowerCase().trim();
                return text === 'chương trước' || text.includes('trước đó');
            });
        }
        
        if (nutTruoc) {
            this.dungPhat();
            chrome.storage.local.set({ autoStartOnLoad: true });
            nutTruoc.click();
        } else {
            DocTruyenSTV_Ext.GiaoDienSTV.hienThiThongBao('Không có chương trước');
        }
    },

    
    huyAmThanhWeb() {
        if (this.dongHoGiamSat) { clearTimeout(this.dongHoGiamSat); this.dongHoGiamSat = null; }
        if (this.dongHoDuyTri) { clearInterval(this.dongHoDuyTri); this.dongHoDuyTri = null; }
        if (this.phatNgonHienTai) {
            this.phatNgonHienTai.onend = null;
            this.phatNgonHienTai.onerror = null;
            this.phatNgonHienTai.onstart = null;
        }
        window.speechSynthesis.cancel();
    },

    phatDoanWeb(batBuocThuLai = false) {
        while (this.chiSoHienTai < this.cacDoan.length && !this.cacDoan[this.chiSoHienTai].text) {
            this.chiSoHienTai++;
        }

        if (!this.dangPhat || this.chiSoHienTai >= this.cacDoan.length) {
            if (this.chiSoHienTai >= this.cacDoan.length && this.tuDongChuyenChuong && this.dangPhat) this.phatChuongTiepTheo();
            else this.dungPhat();
            return;
        }

        const doan = this.cacDoan[this.chiSoHienTai];
        DocTruyenSTV_Ext.GiaoDienSTV.boiDenDoan(this.chiSoHienTai, this.cacDoan, this.dangPhat, this.dangTamDung);
        this.huyAmThanhWeb();

        const u = new SpeechSynthesisUtterance(doan.text);
        this.phatNgonHienTai = u;
        u.lang = 'vi-VN';
        u.rate = this.tocDo;
        u.pitch = 1.0;
        u.volume = Math.min(this.amLuong, 1.0);

        window.speechSynthesis.getVoices().forEach(v => {
            if (v.lang === 'vi-VN' && (v.name.includes('Google') || v.name.includes('Microsoft'))) u.voice = v;
        });

        const idLuot = this.idLuotPhat;
        
        u.onstart = () => {
            if (this.idLuotPhat !== idLuot) return;
            if (this.dongHoGiamSat) clearTimeout(this.dongHoGiamSat);
            if (this.dongHoDuyTri) clearInterval(this.dongHoDuyTri);
            this.dongHoDuyTri = setInterval(() => {
                if (!this.dangTamDung) {
                    window.speechSynthesis.pause();
                    window.speechSynthesis.resume();
                }
            }, 10000);
        };

        u.onend = () => {
            if (this.idLuotPhat !== idLuot) return;
            this.huyAmThanhWeb();
            this.chiSoHienTai++;
            setTimeout(() => this.phatDoanWeb(), this.thoiGianNghi);
        };

        u.onerror = (l) => {
            if (this.idLuotPhat !== idLuot) return;
            this.huyAmThanhWeb();
            if (l.error !== 'canceled' && l.error !== 'interrupted') {
                this.chiSoHienTai++;
                this.phatDoanWeb(true);
            }
        };

        const thoiGianDocUocTinh = Math.max(15000, Math.ceil((doan.text.length / Math.max(this.tocDo, 0.25)) * 200));
        this.dongHoGiamSat = setTimeout(() => {
            if (this.idLuotPhat !== idLuot) return;
            this.huyAmThanhWeb();
            this.phatDoanWeb(true);
        }, thoiGianDocUocTinh);

        if (this.dangTamDung) window.speechSynthesis.pause();
        window.speechSynthesis.speak(u);
    },


    huyTaiAPI() {
        try {
            if (chrome.runtime && chrome.runtime.id) {
                chrome.runtime.sendMessage({ hanhDong: 'huyTatCa' });
            }
        } catch(e) {
        }
    },

    async taiAmThanhTrucTiep(vanBan, khoaCache) {
        const cacheBlob = await DocTruyenSTV_Ext.LuuTruSTV.layAmThanh(khoaCache);
        if (cacheBlob) return cacheBlob;

        try {
            const phanHoi = await chrome.runtime.sendMessage({
                hanhDong: 'taiAmThanh',
                vanBan: vanBan,
                congCu: this.congCu,
                chiSoGiong: this.chiSoGiong,
                tocDo: this.tocDo,
                maYeuCau: Date.now().toString() + Math.random(),
                khoaCache: khoaCache
            });
            if (phanHoi && phanHoi.error) {
                if (phanHoi.biHuy) throw new DOMException(phanHoi.error, 'AbortError');
                throw new Error(phanHoi.error);
            }
        } catch (e) {
            if (e.name === 'AbortError') throw e;
        }

        for (let i = 0; i < 20; i++) {
            const kq = await DocTruyenSTV_Ext.LuuTruSTV.layAmThanh(khoaCache);
            if (kq) return kq;
            if (this.huy) throw new DOMException('DaHuy', 'AbortError');
            await new Promise(r => setTimeout(r, 1000));
        }
        throw new Error("Tải âm thanh thất bại do quá thời gian chờ (Timeout)");
    },

    async phatDoanAPI() {
        while (this.chiSoHienTai < this.cacDoan.length && !this.cacDoan[this.chiSoHienTai].text) {
            this.chiSoHienTai++;
        }

        if (!this.dangPhat || this.chiSoHienTai >= this.cacDoan.length) {
            if (this.chiSoHienTai >= this.cacDoan.length && this.tuDongChuyenChuong && this.dangPhat) this.phatChuongTiepTheo();
            else this.dungPhat();
            return;
        }

        const doan = this.cacDoan[this.chiSoHienTai];
        DocTruyenSTV_Ext.GiaoDienSTV.boiDenDoan(this.chiSoHienTai, this.cacDoan, this.dangPhat, this.dangTamDung);
        const idLuot = this.idLuotPhat;

        try {
            this.dangTai = true;
            this.PhatTinNhanTrangThai();
            
            const khoaCache = DocTruyenSTV_Ext.PhanTichSTV.taoKhoaLuuTru(doan.text, this.congCu, this.chiSoGiong, this.tocDo);
            const blob = await this.taiAmThanhTrucTiep(doan.text, khoaCache);
            
            this.dangTai = false;
            this.PhatTinNhanTrangThai();
            
            if (this.idLuotPhat !== idLuot || !this.dangPhat) return;

            if (this.duongDanBoNhoDem) URL.revokeObjectURL(this.duongDanBoNhoDem);
            this.duongDanBoNhoDem = URL.createObjectURL(blob);

            const { bo_nguon, bo_chinh_am } = DocTruyenSTV_Ext.QuanLyDongCoAmThanh.lay_nguon();
            
            bo_chinh_am.gain.value = this.amLuong;

            if (!this.doiTuongAmThanh) {
                this.doiTuongAmThanh = new Audio();
            } else {
                this.doiTuongAmThanh.pause();
            }
            this.doiTuongAmThanh.src = this.duongDanBoNhoDem;
            this.doiTuongAmThanh.volume = Math.min(this.amLuong, 1.0);
            this.doiTuongAmThanh.playbackRate = this.tocDo;
            
            if (this.dangTamDung) this.doiTuongAmThanh.pause();
            
            this.doiTuongAmThanh.onended = () => {
                if (this.idLuotPhat !== idLuot) return;
                this.chiSoHienTai++;
                setTimeout(() => this.phatDoanAPI(), this.thoiGianNghi);
            };

            if (!this._mediaSource) {
                this._mediaSource = bo_nguon.createMediaElementSource(this.doiTuongAmThanh);
                this._mediaSource.connect(bo_chinh_am);
            }

            await this.doiTuongAmThanh.play();

            if (this.chiSoHienTai + 1 < this.cacDoan.length) {
                const idLuotHienTai = this.idLuotPhat;
                const vanBanTiep = this.cacDoan[this.chiSoHienTai + 1].text;
                if (vanBanTiep) {
                    const khoaTiep = DocTruyenSTV_Ext.PhanTichSTV.taoKhoaLuuTru(vanBanTiep, this.congCu, this.chiSoGiong, this.tocDo);
                    DocTruyenSTV_Ext.LuuTruSTV.layAmThanh(khoaTiep).then(cached => {
                        if (!cached && this.idLuotPhat === idLuotHienTai) {
                            this.taiAmThanhTrucTiep(vanBanTiep, khoaTiep).catch(()=>{});
                        }
                    }).catch(() => {});
                }
            }
        } catch(l) {
            this.dangTai = false;
            this.PhatTinNhanTrangThai();
            if (this.duongDanBoNhoDem) {
                URL.revokeObjectURL(this.duongDanBoNhoDem);
                this.duongDanBoNhoDem = null;
            }
            
            if (this.idLuotPhat !== idLuot || !this.dangPhat) return;
            if (l.name === 'AbortError') return;
            setTimeout(() => {
                if (this.idLuotPhat === idLuot && this.dangPhat) {
                    this.chiSoHienTai++;
                    this.phatDoanAPI();
                }
            }, 3000);
        }
    },

    luuTrangThaiChongDoi() {
        if (this.dongHoLuuTrangThai) clearTimeout(this.dongHoLuuTrangThai);
        this.dongHoLuuTrangThai = setTimeout(async () => {
            const ten = (document.getElementById('booknameholder')?.innerText || '').trim();
            const chuong = (document.getElementById('bookchapnameholder')?.innerText || '').trim();
            if (!ten) return;

            const trangThai = {
                dangPhat: this.dangPhat,
                dangTamDung: this.dangTamDung,
                congCu: this.congCu,
                tienDoHienTai: this.chiSoHienTai + 1,
                tongSoDoan: this.cacDoan.length,
                chiSoTuyetDoi: this.layChiSoToanCuc() + 1,
                tenTruyen: ten,
                tenChuong: chuong,
                duongDanTrang: window.location.href
            };
            
            DocTruyenSTV_Ext.LuuTruSTV.luuTienTrinhDoc(trangThai).catch(e => console.log('Không thể lưu tiến trình:', e.message));
        }, 5000);
    }
};


'use strict';
var DocTruyenSTV_Ext = window.DocTruyenSTV_Ext || {};

DocTruyenSTV_Ext.PhanTichSTV = {
    lamTranhVanBan(vanBan) {
        if (!vanBan) return '';
        let txt = vanBan
            .replace(/Đang tải nội dung chương\.\.\./gi, '')
            .replace(/@Bạn đang đọc bản lưu.*/gi, '')
            .replace(/@Thực hiện bởi Sáng Tác Việt.*/gi, '')
            .trim();
        
        const tuDien = DocTruyenSTV_Ext.LuuTruSTV?.tuDienDaBienDich || [];
        for (const quyTac of tuDien) {
            txt = txt.replace(quyTac.regex, quyTac.thayThe);
        }
        return txt;
    },

    kiemTraMaHoa() {
        const cacKhung = document.querySelectorAll('.contentbox');
        let biMaHoa = false;
        for (let khung of cacKhung) {
            if (/[\uE000-\uF8FF]/.test(khung.textContent)) { biMaHoa = true; break; }
        }
        
        if (biMaHoa && !document.getElementById('stv-canhbao-mahoa')) {
            let canhBao = document.createElement('div');
            canhBao.id = 'stv-canhbao-mahoa';
            canhBao.style.cssText = "background: #ff4d4f; color: white; padding: 10px; text-align: center; font-weight: bold;";
            canhBao.innerText = "Cảnh báo: Chương này bị mã hóa Font! Máy sẽ không đọc chuẩn được.";
            if (cacKhung[0]) cacKhung[0].parentNode.insertBefore(canhBao, cacKhung[0]);
        }
        return biMaHoa;
    },

    chuanBiNoiDungThe() {
        DocTruyenSTV_Ext.GiaoDienSTV.themPhongCach();
        let danhSachThe = [];
        let idDemThe = 0;

        const themThe = (theNode, chuoi, thuocTinhThem = {}) => {
            chuoi = this.lamTranhVanBan(chuoi);
            if (chuoi.length > 0) {
                if (!theNode.id) {
                    theNode.id = `tts-chunk-t-${idDemThe}`;
                    idDemThe++;
                }
                theNode.classList.add('tts-chunk');
                danhSachThe.push({ id: theNode.id, text: chuoi, el: theNode, ...thuocTinhThem });
            }
        };

        const theTenTruyen = document.getElementById('booknameholder') || document.getElementById('book_name2');
        if (theTenTruyen) themThe(theTenTruyen, theTenTruyen.innerText, { isTenTruyen: true });

        const theTenChuong = document.getElementById('bookchapnameholder');
        if (theTenChuong) themThe(theTenChuong, theTenChuong.innerText, { isTenChuong: true });

        const bocCacThe = (khungChua) => {
            let theSpanHienTai = null;
            const cacNode = Array.from(khungChua.childNodes);
            cacNode.forEach(node => {
                if (['BR', 'DIV', 'P', 'H1', 'H2', 'H3', 'HR', 'TABLE', 'UL', 'LI'].includes(node.nodeName)) {
                    theSpanHienTai = null;
                    if (node.nodeType === 1 && !['BR', 'HR'].includes(node.nodeName)) {
                        bocCacThe(node);
                    }
                } else {
                    if (['SCRIPT', 'STYLE'].includes(node.nodeName)) return;
                    if (node.nodeType === 3 && !node.textContent.replace(/\u200B/g, '').trim()) {
                        if (theSpanHienTai) theSpanHienTai.appendChild(node);
                        return;
                    }
                    if (!theSpanHienTai) {
                        theSpanHienTai = document.createElement('span');
                        theSpanHienTai.className = 'tts-chunk';
                        theSpanHienTai.id = `tts-c-${idDemThe}`;
                        idDemThe++;
                        khungChua.insertBefore(theSpanHienTai, node);
                    }
                    theSpanHienTai.appendChild(node);
                }
            });
        };

        const cacKhungNoidung = document.querySelectorAll('.contentbox');
        cacKhungNoidung.forEach(khung => {
            const chuoiTho = this.lamTranhVanBan(khung.innerText);
            if (chuoiTho.length < 50) return;
            
            const soLuongTtsChunk = khung.querySelectorAll('.tts-chunk').length;
            if (!khung.dataset.extTtsDone || soLuongTtsChunk === 0) {
                khung.dataset.extTtsDone = 'true';
                if (khung.dataset.ttsPrepared && soLuongTtsChunk > 0) {
                    khung.querySelectorAll('.tts-chunk').forEach(theSpan => {
                        const khoangTrang = document.createTextNode(' ');
                        theSpan.parentNode.insertBefore(khoangTrang, theSpan.nextSibling);
                        while (theSpan.firstChild) theSpan.parentNode.insertBefore(theSpan.firstChild, theSpan);
                        theSpan.remove();
                    });
                }
                bocCacThe(khung);
                khung.dataset.ttsPrepared = 'true';
            }
            
            khung.querySelectorAll('.tts-chunk').forEach(theSpan => {
                let txt = this.lamTranhVanBan(theSpan.innerText || theSpan.textContent || '');
                if (txt.length > 2) danhSachThe.push({ id: theSpan.id, text: txt, el: theSpan });
            });
        });
        
        return danhSachThe;
    },

    chiaDoanVanBan(vanBan, doDaiToiDa) {
        const cacDoan = [];
        const cacCau = vanBan.split(/(?<=[.!?。])\s+/);
        let hienTai = '';
        
        for (const cau of cacCau) {
            if (!cau.trim()) continue;
            if ((hienTai + ' ' + cau).trim().length <= doDaiToiDa) {
                hienTai = (hienTai + ' ' + cau).trim();
            } else {
                if (hienTai) cacDoan.push(hienTai);
                if (cau.length > doDaiToiDa) {
                    const cacPha = cau.split(/(?<=[,;:])\s+/);
                    let phaHienTai = '';
                    for (const pha of cacPha) {
                        if ((phaHienTai + ' ' + pha).trim().length <= doDaiToiDa) {
                            phaHienTai = (phaHienTai + ' ' + pha).trim();
                        } else {
                            if (phaHienTai) cacDoan.push(phaHienTai);
                            phaHienTai = '';
                            let phanConLai = pha;
                            while (phanConLai.length > doDaiToiDa) {
                                let diemCat = phanConLai.lastIndexOf(' ', doDaiToiDa);
                                if (diemCat <= 0) diemCat = doDaiToiDa;
                                cacDoan.push(phanConLai.slice(0, diemCat));
                                phanConLai = phanConLai.slice(diemCat).trim();
                            }
                            if (phanConLai) cacDoan.push(phanConLai);
                        }
                    }
                    if (phaHienTai) cacDoan.push(phaHienTai);
                } else { 
                    hienTai = cau.trim(); 
                }
            }
        }
        if (hienTai) cacDoan.push(hienTai);
        const ketQua = cacDoan.filter(c => c.trim().length > 0);
        return ketQua.length > 0 ? ketQua : [vanBan];
    },

    taoDanhSachPhat(danhSachThe, doDaiToiDa) {
        let danhSachCuoi = [];
        for (const the of danhSachThe) {
            const cacVanBan = this.chiaDoanVanBan(the.text, doDaiToiDa);
            for (const chuoi of cacVanBan) {
                danhSachCuoi.push({ text: chuoi, el: the.el });
            }
        }
        return danhSachCuoi;
    },
    
    taoKhoaLuuTru(vanBan, congCu, chiSoGiong, tocDo) {
        const tho = vanBan.replace(/\s+/g, '') + `_${congCu}_${chiSoGiong}_${tocDo}`;
        let bam1 = 5381, bam2 = 0;
        for (let i = 0; i < tho.length; i++) {
            bam1 = ((bam1 << 5) + bam1) ^ tho.charCodeAt(i);
            bam2 = ((bam2 * 31) + tho.charCodeAt(i)) | 0;
        }
        return (bam1 >>> 0).toString(36) + '_' + (bam2 >>> 0).toString(36) + '_' + tho.length;
    }
};
