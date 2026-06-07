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
        chrome.storage.sync.get(['maydoc', 'speed', 'volume', 'voiceIndex', 'tudongchuyenchuong', 'smartPauses', 'doctentruyen', 'doctenchuong', 'thayNhanhWeb'], duLieu => {
            this.congCu = duLieu.maydoc || 'auto';
            this.tocDo = duLieu.speed || 1.0;
            this.amLuong = duLieu.volume !== undefined ? duLieu.volume : 1.0;
            this.chiSoGiong = duLieu.voiceIndex !== undefined ? parseInt(duLieu.voiceIndex, 10) : 0;
            this.tuDongChuyenChuong = duLieu.tudongchuyenchuong !== undefined ? duLieu.tudongchuyenchuong : true;
            this.thoiGianNghi = duLieu.smartPauses !== undefined ? duLieu.smartPauses : 1000;
            this.docTenTruyen = duLieu.doctentruyen !== undefined ? duLieu.doctentruyen : true;
            this.docTenChuong = duLieu.doctenchuong !== undefined ? duLieu.doctenchuong : true;
            let val = duLieu.thayNhanhWeb;
            if (val === true) val = 'on';
            if (val === false) val = 'off';
            this.thayNhanhWeb = val || 'off';
        });

        chrome.storage.onChanged.addListener((thayDoi, vungChon) => {
            if (vungChon === 'sync') {
                if (thayDoi.maydoc) {
                    this.congCu = thayDoi.maydoc.newValue;
                    if (this.dangPhat && !this.dangTamDung) {
                        this.dungPhat();
                        setTimeout(() => this.batDauPhat(this.chiSoHienTai), 200);
                    } else if (this.dangPhat && this.dangTamDung) {
                        this.huyTaiAPI();
                        this.huyAmThanhWeb();
                        if (this.doiTuongAmThanh) {
                            this.doiTuongAmThanh.onended = null;
                            this.doiTuongAmThanh.pause();
                            this.doiTuongAmThanh.src = '';
                            this.doiTuongAmThanh = null;
                        }
                    }
                }
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
                if (thayDoi.voiceIndex) this.chiSoGiong = parseInt(thayDoi.voiceIndex.newValue, 10);
                if (thayDoi.tudongchuyenchuong) this.tuDongChuyenchuong = thayDoi.tudongchuyenchuong.newValue;
                if (thayDoi.smartPauses) this.thoiGianNghi = thayDoi.smartPauses.newValue;
                if (thayDoi.thayNhanhWeb !== undefined) {
                    let val = thayDoi.thayNhanhWeb.newValue;
                    if (val === true) val = 'on';
                    if (val === false) val = 'off';
                    this.thayNhanhWeb = val || 'off';
                }
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
        if (this.dangPhatTamWeb) return 'web';
        if (this.congCu && this.congCu.startsWith('khac_')) return this.congCu;
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
        DocTruyenSTV_Ext.GiaoDienSTV.capNhatBangDieuKhien(this.chiSoHienTai, this.cacDoan.length, this.dangPhat, this.dangTamDung, this.dangTai);

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
                if (chrome.runtime.lastError) { }
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
        const btn = document.getElementById('stv-btn-retry-web');
        if (btn) btn.remove();

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
        const btn = document.getElementById('stv-btn-retry-web');
        if (btn) btn.remove();

        this.dangPhat = false;
        this.dangTamDung = false;
        this.dangTai = false;

        if (this._dongHoChuyenChuong) {
            clearTimeout(this._dongHoChuyenChuong);
            this._dongHoChuyenChuong = null;
        }
        this.idLuotPhat++;
        if (this.dongHoThoiGian) { clearInterval(this.dongHoThoiGian); this.dongHoThoiGian = null; }
        this.giayDaTroi = 0;
        this.huyTaiAPI();
        this.huyAmThanhWeb();

        if (this.doiTuongAmThanh) {
            this.doiTuongAmThanh.onended = null;
            this.doiTuongAmThanh.pause();
            this.doiTuongAmThanh.src = '';
            this.doiTuongAmThanh = null;
        }
        if (this._mediaSource) {
            this._mediaSource.disconnect();
            this._mediaSource = null;
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

        const congCuThuc = this.layCongCuThucTe();

        if (congCuThuc !== 'web' && (!this.doiTuongAmThanh || !this.doiTuongAmThanh.src)) {
            this.batDauPhat(this.chiSoHienTai);
            return;
        } else if (congCuThuc === 'web' && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
            this.batDauPhat(this.chiSoHienTai);
            return;
        }

        this.dangTamDung = false;
        this.PhatTinNhanTrangThai();

        if (congCuThuc === 'web') {
            window.speechSynthesis.resume();
        } else {
            if (this.doiTuongAmThanh) this.doiTuongAmThanh.play();
            DocTruyenSTV_Ext.QuanLyDongCoAmThanh.tiep_tuc();
        }
    },

    capNhatTuDienDong() {
        const chiSoCu = this.chiSoHienTai;
        const dangPhatTruocDo = this.dangPhat && !this.dangTamDung;

        this.huyTaiAPI();

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
            DocTruyenSTV_Ext.GiaoDienSTV.hienThiThongBao('Đang chuyển sang chương tiếp theo...');
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
            sessionStorage.setItem('autoStartOnLoad', 'true');
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

    phatDoanWeb(boQuaGhiChu = false) {
        const btnCu = document.getElementById('stv-btn-retry-web');
        if (btnCu) btnCu.remove();

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

        const dsGiong = window.speechSynthesis.getVoices();
        const giong = dsGiong.find(v => v.lang === 'vi-VN' && v.name.includes('Google')) ||
            dsGiong.find(v => v.lang === 'vi-VN' && v.name.includes('Microsoft'));
        if (giong) u.voice = giong;

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

    _hienThiNutChuyenWebTamThoi(idLuot) {
        const doan = this.cacDoan[this.chiSoHienTai];
        if (!doan || !doan.el) return;

        let btn = document.getElementById('stv-btn-retry-web');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'stv-btn-retry-web';
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>Web API tạm';
            btn.title = 'Bấm để đọc đoạn này bằng Web Speech, sau đó sẽ tự động quay lại API cao cấp';
            btn.style.cssText = 'display: inline-flex; align-items: center; margin-left: 12px; background: linear-gradient(135deg, #ff4d4f, #ff7875); color: #fff; border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; vertical-align: middle; box-shadow: 0 4px 10px rgba(255, 77, 79, 0.3); transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275); letter-spacing: 0.2px; user-select: none;';
            btn.onmouseover = () => {
                btn.style.transform = 'scale(1.06) translateY(-1px)';
                btn.style.boxShadow = '0 6px 14px rgba(255, 77, 79, 0.4)';
                btn.style.filter = 'brightness(1.08)';
            };
            btn.onmouseout = () => {
                btn.style.transform = 'scale(1) translateY(0)';
                btn.style.boxShadow = '0 4px 10px rgba(255, 77, 79, 0.3)';
                btn.style.filter = 'brightness(1)';
            };

            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                btn.remove();
                if (this.idLuotPhat !== idLuot || !this.dangPhat) return;

                this.idLuotPhat++;
                const luotMoi = this.idLuotPhat;

                if (this.doiTuongAmThanh) {
                    this.doiTuongAmThanh.onended = null;
                    this.doiTuongAmThanh.pause();
                }
                this._xoaBlobCu();
                this.huyTaiAPI();

                this._soLanRetryTimeout = 0;
                this.dangTai = false;
                this.PhatTinNhanTrangThai();
                this._phatMotDoanWebRoiQuayLaiFPT(luotMoi);
            };
            doan.el.appendChild(btn);
        }
    },


    huyTaiAPI() {
        try {
            if (chrome.runtime && chrome.runtime.id) {
                chrome.runtime.sendMessage({ hanhDong: 'huyTatCa' });
            }
        } catch (e) {
        }
    },

    async taiAmThanhTrucTiep(vanBan, khoaCache) {
        const cacheBlob = await DocTruyenSTV_Ext.LuuTruSTV.layAmThanh(khoaCache);
        if (cacheBlob) return cacheBlob;

        let phanHoi;
        try {
            phanHoi = await chrome.runtime.sendMessage({
                hanhDong: 'taiAmThanh',
                vanBan: vanBan,
                congCu: this.congCu,
                chiSoGiong: this.chiSoGiong,
                tocDo: this.tocDo,
                maYeuCau: Date.now().toString() + Math.random(),
                khoaCache: khoaCache,
                thayNhanhWeb: this.thayNhanhWeb
            });
        } catch (e) {
            throw e;
        }

        if (!phanHoi) throw new Error('Không nhận được phản hồi từ background');
        if (phanHoi.biHuy) throw new DOMException(phanHoi.error || 'DaHuy', 'AbortError');
        if (phanHoi.error) throw new Error(phanHoi.error);

        if (phanHoi.audioBase64) {
            const binaryStr = atob(phanHoi.audioBase64);
            const len = binaryStr.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binaryStr.charCodeAt(i);
            const blob = new Blob([bytes], { type: phanHoi.audioType || 'audio/mpeg' });
            DocTruyenSTV_Ext.LuuTruSTV.luuAmThanh(khoaCache, blob).catch(() => { });
            return blob;
        }

        throw new Error('Background không trả về dữ liệu audio');
    },

    _xuLyLoiAPI(l, idLuot) {
        this.dangTai = false;
        this.PhatTinNhanTrangThai();

        if (this.idLuotPhat !== idLuot || !this.dangPhat) return true;
        if (l.name === 'AbortError') return true;

        const msg = (l.message || '').toLowerCase();
        console.error('[DocTruyenSTV] Lỗi API:', l);

        const laLoiKenh = msg.includes('message channel')
            || msg.includes('receiving end does not exist')
            || msg.includes('could not establish connection')
            || msg.includes('extension context');
        if (laLoiKenh) {
            console.warn('[DocTruyenSTV] Lỗi kênh, retry sau 1s...');
            setTimeout(() => {
                if (this.idLuotPhat === idLuot && this.dangPhat) this.phatDoanAPI();
            }, 1000);
            return true;
        }

        const laLoiQuota = msg.includes('quota') || msg.includes('429')
            || msg.includes('401') || msg.includes('403')
            || msg.includes('unauthorized') || msg.includes('forbidden')
            || msg.includes('exceeded');

        if (laLoiQuota && this.congCu && this.congCu !== 'web') {
            chrome.storage.local.get('customEngines', (data) => {
                const engines = data.customEngines || [];
                const engine = engines.find(e => e.id === this.congCu);
                if (engine && !engine.isQuotaExceeded) {
                    engine.isQuotaExceeded = true;
                    chrome.storage.local.set({ customEngines: engines });
                }
            });
        } else {
            const laLoiTimeout = msg.includes('hết thời gian') || msg.includes('timeout') || msg.includes('render');
            if (laLoiTimeout || this.thayNhanhWeb !== 'off') {
                if (this.thayNhanhWeb === 'off') {
                    this._soLanRetryTimeout = (this._soLanRetryTimeout || 0) + 1;
                    if (this._soLanRetryTimeout <= 2) {
                        console.warn('[DocTruyenSTV] Lỗi API — sangtacviet.com, retry lần', this._soLanRetryTimeout);
                        setTimeout(() => {
                            if (this.idLuotPhat === idLuot && this.dangPhat) {
                                this.phatDoanAPI();
                            }
                        }, 1000);
                        return true;
                    }
                }
                
                this._soLanRetryTimeout = 0;
                console.warn('[DocTruyenSTV] Lỗi API — dùng Web Speech cho đoạn này rồi quay lại FPT');
                
                const btn = document.getElementById('stv-btn-retry-web');
                if (btn) btn.remove();

                if (this.doiTuongAmThanh) {
                    this.doiTuongAmThanh.onended = null;
                    this.doiTuongAmThanh.pause();
                    this.doiTuongAmThanh.src = '';
                }
                this._xoaBlobCu();
                this._phatMotDoanWebRoiQuayLaiFPT(idLuot);
                return true;
            }
        }
        this._soLanRetryTimeout = 0;

        if (this.doiTuongAmThanh) {
            this.doiTuongAmThanh.onended = null;
            this.doiTuongAmThanh.pause();
            this.doiTuongAmThanh.src = '';
            this.doiTuongAmThanh = null;
        }
        this._xoaBlobCu();

        this.congCu = 'web';
        chrome.storage.sync.set({ maydoc: 'web' });
        DocTruyenSTV_Ext.GiaoDienSTV.hienThiThongBao(
            laLoiQuota ? 'Hết lượt API — đã chuyển sang Web Speech'
                : 'Lỗi tải API — đã chuyển sang Web Speech'
        );
        this.phatDoanWeb();
        return true;
    },

    _phatMotDoanWebRoiQuayLaiFPT(idLuot) {
        if (this.idLuotPhat !== idLuot || !this.dangPhat) return;
        const doan = this.cacDoan[this.chiSoHienTai];
        if (!doan) return;

        this.huyAmThanhWeb();
        this.dangTai = false;
        this.dangPhatTamWeb = true;
        this.PhatTinNhanTrangThai();
        const u = new SpeechSynthesisUtterance(doan.text);
        u.lang = 'vi-VN';
        u.rate = this.tocDo;
        u.pitch = 1.0;
        u.volume = Math.min(this.amLuong, 1.0);
        const dsGiong = window.speechSynthesis.getVoices();
        const giong = dsGiong.find(v => v.lang === 'vi-VN' && v.name.includes('Google')) ||
            dsGiong.find(v => v.lang === 'vi-VN' && v.name.includes('Microsoft'));
        if (giong) u.voice = giong;

        const thoat = () => {
            this.huyAmThanhWeb();
            this.dangPhatTamWeb = false;
            this.PhatTinNhanTrangThai();
            if (this.idLuotPhat !== idLuot || !this.dangPhat) return;
            this.chiSoHienTai++;
            setTimeout(() => {
                if (this.idLuotPhat === idLuot && this.dangPhat) this.phatDoanAPI();
            }, this.thoiGianNghi);
        };

        u.onend = thoat;
        u.onerror = (e) => {
            if (e.error === 'canceled' || e.error === 'interrupted') return;
            thoat();
        };

        this.dongHoGiamSat = setTimeout(() => {
            if (this.idLuotPhat === idLuot) thoat();
        }, Math.max(15000, doan.text.length * 200));

        window.speechSynthesis.speak(u);
        this.phatNgonHienTai = u;
    },

    _xoaBlobCu() {
        if (this.duongDanBoNhoDem) {
            URL.revokeObjectURL(this.duongDanBoNhoDem);
            this.duongDanBoNhoDem = null;
        }
    },

    _damBaoAudioEl() {
        if (!this.doiTuongAmThanh) {
            const { bo_nguon, bo_chinh_am } = DocTruyenSTV_Ext.QuanLyDongCoAmThanh.lay_nguon();
            this.doiTuongAmThanh = new Audio();
            this._mediaSource = bo_nguon.createMediaElementSource(this.doiTuongAmThanh);
            this._mediaSource.connect(bo_chinh_am);
        }
        return this.doiTuongAmThanh;
    },

    async phatDoanAPI() {
        while (this.chiSoHienTai < this.cacDoan.length && !this.cacDoan[this.chiSoHienTai].text) {
            this.chiSoHienTai++;
        }

        if (!this.dangPhat || this.chiSoHienTai >= this.cacDoan.length) {
            if (this.chiSoHienTai >= this.cacDoan.length && this.tuDongChuyenChuong && this.dangPhat)
                this.phatChuongTiepTheo();
            else
                this.dungPhat();
            return;
        }

        const doan = this.cacDoan[this.chiSoHienTai];
        DocTruyenSTV_Ext.GiaoDienSTV.boiDenDoan(this.chiSoHienTai, this.cacDoan, this.dangPhat, this.dangTamDung);
        const idLuot = this.idLuotPhat;

        const btnCu = document.getElementById('stv-btn-retry-web');
        if (btnCu) btnCu.remove();
        this._hienThiNutChuyenWebTamThoi(idLuot);

        const cacCau = DocTruyenSTV_Ext.PhanTichSTV.chiaCauNho(doan.text, 500);

        for (let i = 0; i < cacCau.length; i++) {
            if (this.idLuotPhat !== idLuot || !this.dangPhat) return;

            const chuoi = cacCau[i];
            const khoa = DocTruyenSTV_Ext.PhanTichSTV.taoKhoaLuuTru(chuoi, this.congCu, this.chiSoGiong, this.tocDo);

            let blob;
            try {
                let promiseTai;
                if (this._preload && this._preload.doanIndex === this.chiSoHienTai && this._preload.cauIndex === i && this._preload.idLuot === idLuot) {
                    promiseTai = this._preload.promise;
                } else {
                    promiseTai = this.taiAmThanhTrucTiep(chuoi, khoa);
                }

                let _loadingTimer = setTimeout(() => {
                    if (this.idLuotPhat === idLuot && this.dangPhat) {
                        this.dangTai = true;
                        this.PhatTinNhanTrangThai();
                    }
                }, 100);

                blob = await promiseTai;
                clearTimeout(_loadingTimer);
                
                if (blob && blob.error) throw blob.error;
            } catch (l) {
                this._xuLyLoiAPI(l, idLuot);
                return;
            }

            if (this.idLuotPhat !== idLuot || !this.dangPhat) return;

            this.dangTai = false;
            this.PhatTinNhanTrangThai();

            this._xoaBlobCu();
            this.duongDanBoNhoDem = URL.createObjectURL(blob);

            const { bo_chinh_am } = DocTruyenSTV_Ext.QuanLyDongCoAmThanh.lay_nguon();
            bo_chinh_am.gain.value = this.amLuong;

            const audio = this._damBaoAudioEl();
            audio.onended = null;
            audio.pause();
            audio.src = this.duongDanBoNhoDem;
            audio.volume = Math.min(this.amLuong, 1.0);
            audio.playbackRate = this.tocDo;

            let nextDoanIndex = this.chiSoHienTai;
            let nextCauIndex = i + 1;
            let nextCauText = null;

            if (nextCauIndex < cacCau.length) {
                nextCauText = cacCau[nextCauIndex];
            } else {
                nextDoanIndex++;
                while (nextDoanIndex < this.cacDoan.length && !this.cacDoan[nextDoanIndex].text) {
                    nextDoanIndex++;
                }
                if (nextDoanIndex < this.cacDoan.length) {
                    const nextCacCau = DocTruyenSTV_Ext.PhanTichSTV.chiaCauNho(this.cacDoan[nextDoanIndex].text, 500);
                    if (nextCacCau.length > 0) {
                        nextCauText = nextCacCau[0];
                        nextCauIndex = 0; 
                    }
                }
            }

            if (nextCauText) {
                const nextKhoa = DocTruyenSTV_Ext.PhanTichSTV.taoKhoaLuuTru(nextCauText, this.congCu, this.chiSoGiong, this.tocDo);
                this._preload = {
                    doanIndex: nextDoanIndex,
                    cauIndex: nextCauIndex,
                    idLuot: idLuot,
                    promise: this.taiAmThanhTrucTiep(nextCauText, nextKhoa).catch(e => ({ error: e }))
                };
            }

            await new Promise((dongY) => {
                const guard = idLuot;
                audio.onended = () => {
                    audio.onended = null;
                    dongY();
                };
                audio.onerror = () => {
                    audio.onended = null;
                    dongY();
                };
                audio.play().then(() => {
                    if (this.dangTamDung) audio.pause();
                }).catch(() => dongY());

                const _check = setInterval(() => {
                    if (this.idLuotPhat !== guard) {
                        clearInterval(_check);
                        audio.onended = null;
                        dongY();
                    }
                }, 100);
                audio._guardInterval = _check;
            });

            if (audio._guardInterval) { clearInterval(audio._guardInterval); audio._guardInterval = null; }
            if (this.idLuotPhat !== idLuot || !this.dangPhat) return;

            if (i < cacCau.length - 1 && this.thoiGianNghi > 0) {
                await new Promise(r => setTimeout(r, this.thoiGianNghi));
                if (this.idLuotPhat !== idLuot || !this.dangPhat) return;
            }
        }

        this.chiSoHienTai++;
        setTimeout(() => this.phatDoanAPI(), this.thoiGianNghi);
    },

    luuTrangThaiChongDoi() {
        if (this.dongHoLuuTrangThai) clearTimeout(this.dongHoLuuTrangThai);
        this.dongHoLuuTrangThai = setTimeout(async () => {
            let theTenTruyen = null;
            document.querySelectorAll('#booknameholder, #book_name2').forEach(el => {
                if ((el.innerText || el.textContent).trim().length > 0) theTenTruyen = el;
            });
            const ten = theTenTruyen ? (theTenTruyen.innerText || theTenTruyen.textContent).trim() : '';

            let theTenChuong = null;
            document.querySelectorAll('#bookchapnameholder').forEach(el => {
                if ((el.innerText || el.textContent).trim().length > 0) theTenChuong = el;
            });
            const chuong = theTenChuong ? (theTenChuong.innerText || theTenChuong.textContent).trim() : '';
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

DocTruyenSTV_Ext.PhanTichSTV = {
    lamTranhVanBan(vanBan) {
        if (!vanBan) return '';
        let txt = vanBan
            .replace(/Đang tải nội dung chương\.\.\./gi, '')
            .replace(/@Bạn đang đọc bản lưu.*/gi, '')
            .replace(/@Thực hiện bởi Sáng Tác Việt.*/gi, '')
            .replace(/Đọc trên web để có chất lượng dịch cao và ủng hộ website\./gi,
                'Đọc trên Sáng Tác Việt Chấm Cơm để có chất lượng dịch cao và ủng hộ website.')
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, '')
            .replace(/\s+/g, ' ')
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

        let theTenTruyen = null;
        document.querySelectorAll('#booknameholder, #book_name2').forEach(el => {
            if ((el.innerText || el.textContent).trim().length > 0) theTenTruyen = el;
        });
        if (theTenTruyen) themThe(theTenTruyen, theTenTruyen.innerText || theTenTruyen.textContent, { isTenTruyen: true });

        let theTenChuong = null;
        document.querySelectorAll('#bookchapnameholder').forEach(el => {
            if ((el.innerText || el.textContent).trim().length > 0) theTenChuong = el;
        });
        if (theTenChuong) themThe(theTenChuong, theTenChuong.innerText || theTenChuong.textContent, { isTenChuong: true });

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
                    if (node.nodeType === 1 && (node.id === 'bookchapnameholder' || node.id === 'booknameholder' || node.id === 'book_name2')) return;
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
                        if (theSpan.id === 'bookchapnameholder' || theSpan.id === 'booknameholder' || theSpan.id === 'book_name2') return;
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
                if (theSpan.id === 'bookchapnameholder' || theSpan.id === 'booknameholder' || theSpan.id === 'book_name2') return;
                let txt = this.lamTranhVanBan(theSpan.innerText || theSpan.textContent || '');
                if (txt.length > 2) danhSachThe.push({ id: theSpan.id, text: txt, el: theSpan });
            });
        });

        return danhSachThe;
    },

    chiaCauNho(vanBan, maxLen = 500) {
        const txt = vanBan.replace(/\s+/g, ' ').trim();
        if (txt.length <= maxLen) return [txt];

        const ketQua = [];
        const cacManhChinh = txt.split(/(?<=[.!?。…]+["']?)\s+/);
        for (const manh of cacManhChinh) {
            if (!manh.trim()) continue;
            if (manh.length <= maxLen) {
                ketQua.push(manh.trim());
            } else {
                let con = manh.trim();
                while (con.length > maxLen) {
                    let cut = con.lastIndexOf(',', maxLen);
                    if (cut <= 0) cut = con.lastIndexOf(' ', maxLen);
                    if (cut <= 0) cut = maxLen;
                    
                    let piece = con.slice(0, cut + (con[cut] === ',' ? 1 : 0)).trim();
                    if (piece) ketQua.push(piece);
                    con = con.slice(cut + (con[cut] === ',' ? 1 : 0)).trim();
                }
                if (con) ketQua.push(con);
            }
        }
        return ketQua.filter(c => c.length > 0);
    },

    chiaDoanVanBan(vanBan, doDaiToiDa) {
        const cacDoan = [];
        const cacCau = vanBan.split(/(?<=[.!?。…]+["']?)\s+/);
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