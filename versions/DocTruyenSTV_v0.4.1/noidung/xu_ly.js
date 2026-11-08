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
    chiSoGiong: undefined,
    tenGiongDoc: '',
    thoiGianNghi: 1200,
    thoiGianNghiPhay: 300,
    thoiGianNghiCham: 800,
    thoiGianNghiXuongDong: 1200,
    tuDongChuyenChuong: true,
    tabIdCuaToi: null,
    thongTinTabKhacDangPhat: null,

    cacDoan: [],
    chiSoHienTai: 0,

    doiTuongAmThanh: null,
    phatNgonHienTai: null,
    duongDanBoNhoDem: null,
    _preloadQueue: [],

    dongHoGiamSat: null,
    dongHoDuyTri: null,
    dongHoLuuTrangThai: null,
    idLuotPhat: 0,
    giayDaTroi: 0,
    dongHoThoiGian: null,

    // Cập nhật chỉ số giọng đọc và khôi phục bộ đệm âm thanh
    cap_nhat_chi_so_giong(chi_so_moi, ten_giong_moi) {
        const gia_tri = parseInt(chi_so_moi, 10);
        if (ten_giong_moi) {
            const ten_thuong = ten_giong_moi.toLowerCase();
            // Bảo vệ: Tuyệt đối không gán giọng ngoại ngữ (David, Zira, English) làm giọng mặc định
            if (!ten_thuong.includes('david') && !ten_thuong.includes('zira') && !ten_thuong.includes('english')) {
                this.tenGiongDoc = ten_giong_moi;
            }
        }
        if (!isNaN(gia_tri)) {
            if (this.chiSoGiong === gia_tri && !ten_giong_moi) return;
            this.chiSoGiong = gia_tri;
        }
        this._preloadQueue = [];
        if (this.dangPhat && !this.dangTamDung) {
            this.dung_phat();
            setTimeout(() => this.bat_dau_phat(this.chiSoHienTai), 200);
        } else if (this.dangPhat && this.dangTamDung) {
            this.huy_tai_api();
            this.huy_am_thanh_web();
            if (this.doiTuongAmThanh) {
                this.doiTuongAmThanh.onended = null;
                this.doiTuongAmThanh.pause();
                this.doiTuongAmThanh.src = '';
                this.doiTuongAmThanh = null;
            }
        }
    },

    // Lựa chọn giọng đọc Web TTS chuẩn tiếng Việt, tuyệt đối không dùng giọng nước ngoài khi máy có sẵn giọng tiếng Việt
    lay_giong_web_hieu_qua(ds_giong) {
        if (!ds_giong || ds_giong.length === 0) return null;

        const ds_giong_viet = ds_giong.filter(v => v.lang && v.lang.toLowerCase().startsWith('vi'));

        if (ds_giong_viet.length > 0) {
            // A. Ưu tiên khớp theo tên giọng nếu đã được người dùng chọn
            if (this.tenGiongDoc) {
                const giong_theo_ten = ds_giong_viet.find(v => v.name === this.tenGiongDoc || v.voiceURI === this.tenGiongDoc);
                if (giong_theo_ten) {
                    this.chiSoGiong = ds_giong.indexOf(giong_theo_ten);
                    return giong_theo_ten;
                }
            }

            // B. Kiểm tra nếu chỉ số hiện tại trỏ đúng vào một giọng tiếng Việt
            if (this.chiSoGiong !== undefined && ds_giong[this.chiSoGiong]) {
                const giong_hien_tai = ds_giong[this.chiSoGiong];
                if (giong_hien_tai.lang && giong_hien_tai.lang.toLowerCase().startsWith('vi')) {
                    this.tenGiongDoc = giong_hien_tai.name;
                    return giong_hien_tai;
                }
            }

            // C. Nếu chỉ số hiện tại trỏ vào giọng ngoại ngữ (ví dụ index 0 David / tiếng Anh do mặc định):
            // Tự động chuyển ngay sang giọng tiếng Việt chuẩn và chất lượng cao nhất:
            // Ưu tiên: MS Online / Natural (Hoài My, Nam Minh) -> Google vi-VN -> Microsoft vi-VN -> bất kỳ giọng tiếng Việt nào
            const giong_viet_chuan = ds_giong_viet.find(v => v.name.includes('Online') || v.name.includes('Natural')) ||
                ds_giong_viet.find(v => v.lang === 'vi-VN' && v.name.includes('Google')) ||
                ds_giong_viet.find(v => v.lang === 'vi-VN' && v.name.includes('Microsoft')) ||
                ds_giong_viet[0];

            if (giong_viet_chuan) {
                const chi_so_chuan = ds_giong.indexOf(giong_viet_chuan);
                this.chiSoGiong = chi_so_chuan;
                this.tenGiongDoc = giong_viet_chuan.name;
                try {
                    chrome.storage.sync.set({ voiceIndex: chi_so_chuan, voiceName: giong_viet_chuan.name });
                } catch (e) {}
                return giong_viet_chuan;
            }
        }

        // Tuyệt đối không tự ý gán giọng ngoại ngữ (David, Zira...) khi chưa có giọng tiếng Việt
        if (this.chiSoGiong !== undefined && ds_giong[this.chiSoGiong]) {
            const g = ds_giong[this.chiSoGiong];
            if (g.lang && g.lang.toLowerCase().startsWith('vi')) return g;
        }
        return null;
    },

    kiem_tra_tab_khac_dang_phat(duLieuTab) {
        if (duLieuTab && duLieuTab.isPlaying && duLieuTab.tabId && this.tabIdCuaToi && duLieuTab.tabId !== this.tabIdCuaToi) {
            this.thongTinTabKhacDangPhat = duLieuTab;
        } else {
            this.thongTinTabKhacDangPhat = null;
        }
        if (DocTruyenSTV_Ext.GiaoDienSTV && typeof DocTruyenSTV_Ext.GiaoDienSTV.cap_nhat_khoa_tab_khac === 'function') {
            DocTruyenSTV_Ext.GiaoDienSTV.cap_nhat_khoa_tab_khac(this.thongTinTabKhacDangPhat);
        }
    },

    khoi_tao() {
        try {
            chrome.runtime.sendMessage({ hanhDong: 'layTabIdHienTai' }, phanHoi => {
                if (phanHoi && phanHoi.tabId) {
                    this.tabIdCuaToi = phanHoi.tabId;
                    chrome.storage.local.get(['stv_tab_dang_phat'], duLieu => {
                        this.kiem_tra_tab_khac_dang_phat(duLieu.stv_tab_dang_phat);
                    });
                }
            });
        } catch (e) {}

        chrome.storage.sync.get(['maydoc', 'speed', 'volume', 'voiceIndex', 'voiceName', 'tudongchuyenchuong', 'smartPauses', 'pauseComma', 'pauseDot', 'pausePara', 'doctentruyen', 'doctenchuong', 'thayNhanhWeb'], duLieu => {
            this.congCu = duLieu.maydoc || 'auto';
            this.tocDo = duLieu.speed || 1.0;
            this.amLuong = duLieu.volume !== undefined ? duLieu.volume : 1.0;
            this.chiSoGiong = duLieu.voiceIndex !== undefined ? parseInt(duLieu.voiceIndex, 10) : undefined;
            this.tenGiongDoc = duLieu.voiceName || '';
            this.tuDongChuyenChuong = duLieu.tudongchuyenchuong !== undefined ? duLieu.tudongchuyenchuong : true;
            this.thoi_gian_nghi_phay = duLieu.pauseComma !== undefined ? duLieu.pauseComma : 300;
            this.thoi_gian_nghi_cham = duLieu.pauseDot !== undefined ? duLieu.pauseDot : 800;
            this.thoi_gian_nghi_xuong_dong = duLieu.pausePara !== undefined ? duLieu.pausePara : (duLieu.smartPauses !== undefined ? duLieu.smartPauses : 1200);
            this.thoiGianNghiPhay = this.thoi_gian_nghi_phay;
            this.thoiGianNghiCham = this.thoi_gian_nghi_cham;
            this.thoiGianNghiXuongDong = this.thoi_gian_nghi_xuong_dong;
            this.thoiGianNghi = this.thoi_gian_nghi_xuong_dong;
            this.docTenTruyen = duLieu.doctentruyen !== undefined ? duLieu.doctentruyen : true;
            this.docTenChuong = duLieu.doctenchuong !== undefined ? duLieu.doctenchuong : true;
            let val = duLieu.thayNhanhWeb;
            if (val === true) val = 'on';
            if (val === false) val = 'off';
            this.thayNhanhWeb = val || 'off';
        });

        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.addEventListener('voiceschanged', () => {
                const ds = window.speechSynthesis.getVoices();
                if (ds && ds.length > 0) {
                    this.lay_giong_web_hieu_qua(ds);
                }
            });
        }

        chrome.storage.onChanged.addListener((thayDoi, vungChon) => {
            if (vungChon === 'local' && thayDoi.stv_tab_dang_phat) {
                this.kiem_tra_tab_khac_dang_phat(thayDoi.stv_tab_dang_phat.newValue);
            }
            if (vungChon === 'sync') {
                if (thayDoi.maydoc) {
                    this.congCu = thayDoi.maydoc.newValue;
                    this.chuan_bi_cac_doan();
                    this.chiSoHienTai = Math.min(this.chiSoHienTai, Math.max(0, this.cacDoan.length - 1));
                    if (this.dangPhat && !this.dangTamDung) {
                        this.dung_phat();
                        setTimeout(() => this.bat_dau_phat(this.chiSoHienTai), 200);
                    } else if (this.dangPhat && this.dangTamDung) {
                        this.huy_tai_api();
                        this.huy_am_thanh_web();
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
                if (thayDoi.voiceIndex) {
                    this.cap_nhat_chi_so_giong(parseInt(thayDoi.voiceIndex.newValue, 10), thayDoi.voiceName ? thayDoi.voiceName.newValue : undefined);
                }
                if (thayDoi.voiceName) {
                    this.tenGiongDoc = thayDoi.voiceName.newValue;
                }
                if (thayDoi.tudongchuyenchuong) this.tuDongChuyenChuong = thayDoi.tudongchuyenchuong.newValue;
                if (thayDoi.pauseComma) {
                    this.thoi_gian_nghi_phay = thayDoi.pauseComma.newValue;
                    this.thoiGianNghiPhay = this.thoi_gian_nghi_phay;
                }
                if (thayDoi.pauseDot) {
                    this.thoi_gian_nghi_cham = thayDoi.pauseDot.newValue;
                    this.thoiGianNghiCham = this.thoi_gian_nghi_cham;
                }
                if (thayDoi.pausePara) {
                    this.thoi_gian_nghi_xuong_dong = thayDoi.pausePara.newValue;
                    this.thoiGianNghiXuongDong = this.thoi_gian_nghi_xuong_dong;
                    this.thoiGianNghi = this.thoi_gian_nghi_xuong_dong;
                }
                if (thayDoi.smartPauses && !thayDoi.pausePara) {
                    this.thoi_gian_nghi_xuong_dong = thayDoi.smartPauses.newValue;
                    this.thoiGianNghiXuongDong = this.thoi_gian_nghi_xuong_dong;
                    this.thoiGianNghi = this.thoi_gian_nghi_xuong_dong;
                }
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
                    this.chuan_bi_cac_doan();
                    if (doanHienTai) {
                        const viTriMoi = this.cacDoan.findIndex(d => d.text === doanHienTai);
                        if (viTriMoi !== -1) this.chiSoHienTai = viTriMoi;
                        else if (this.chiSoHienTai >= this.cacDoan.length) this.chiSoHienTai = Math.max(0, this.cacDoan.length - 1);
                    }
                    DocTruyenSTV_Ext.GiaoDienSTV.boi_den_doan(this.chiSoHienTai, this.cacDoan, this.dangPhat, this.dangTamDung);
                }
            }
        });

        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('a');
            if (btn && btn.href && btn.href.includes('/truyen/')) {
                if (btn.href !== window.location.href) {
                    this._cacTheDaLuu = null;
                    this.cacDoan = [];
                    setTimeout(() => {
                        this.chuan_bi_cac_doan();
                    }, 600);
                }
            }
        });

        window.addEventListener('popstate', () => {
            this._cacTheDaLuu = null;
            this.cacDoan = [];
            setTimeout(() => {
                this.chuan_bi_cac_doan();
            }, 300);
        });
    },

    lay_cong_cu_thuc_te() {
        if (this.dangPhatTamWeb) return 'web';
        if (this.congCu && this.congCu.startsWith('khac_')) return this.congCu;
        return (this.congCu === 'auto' || this.congCu === 'google') ? 'web' : this.congCu;
    },

    lay_tong_so_doan() {
        return this.cacDoan.length;
    },

    lay_chi_so_hien_tai() {
        return this.chiSoHienTai;
    },

    lay_chi_so_toan_cuc() {
        if (!this._cacTheDaLuu || this.cacDoan.length === 0) return this.chiSoHienTai;
        let offset = 0;
        const doDaiToiDa = this.lay_cong_cu_thuc_te() === 'web' ? 250 : 5000;
        if (!this.docTenTruyen) {
            let titleThe = this._cacTheDaLuu.find(t => t.isTenTruyen);
            if (titleThe) offset += DocTruyenSTV_Ext.PhanTichSTV.tao_danh_sach_phat([titleThe], doDaiToiDa).length;
        }
        if (!this.docTenChuong) {
            let chapThe = this._cacTheDaLuu.find(t => t.isTenChuong);
            if (chapThe) offset += DocTruyenSTV_Ext.PhanTichSTV.tao_danh_sach_phat([chapThe], doDaiToiDa).length;
        }
        return this.chiSoHienTai + offset;
    },

    tinh_chi_so_thuc(absoluteIndex) {
        if (!this._cacTheDaLuu) return absoluteIndex;
        let offset = 0;
        const doDaiToiDa = this.lay_cong_cu_thuc_te() === 'web' ? 250 : 5000;
        if (!this.docTenTruyen) {
            let titleThe = this._cacTheDaLuu.find(t => t.isTenTruyen);
            if (titleThe) offset += DocTruyenSTV_Ext.PhanTichSTV.tao_danh_sach_phat([titleThe], doDaiToiDa).length;
        }
        if (!this.docTenChuong) {
            let chapThe = this._cacTheDaLuu.find(t => t.isTenChuong);
            if (chapThe) offset += DocTruyenSTV_Ext.PhanTichSTV.tao_danh_sach_phat([chapThe], doDaiToiDa).length;
        }
        return Math.max(0, absoluteIndex - offset);
    },

    _debouncedTrangThai: null,
    phat_tin_nhan_trang_thai() {
        DocTruyenSTV_Ext.GiaoDienSTV.cap_nhat_bang_dieu_khien(this.chiSoHienTai, this.cacDoan.length, this.dangPhat, this.dangTamDung, this.dangTai);

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
                    absoluteProgress: this._cacTheDaLuu ? { current: this.lay_chi_so_toan_cuc() + 1 } : null
                }
            }, () => {
                if (chrome.runtime.lastError) { }
            });
        }, 200);
    },

    _cacTheDaLuu: null,

    chuan_bi_cac_doan() {
        const congCuThuc = this.lay_cong_cu_thuc_te();
        const doDaiToiDa = congCuThuc === 'web' ? 250 : 5000;

        const soDoanNoiDung = this._cacTheDaLuu ? this._cacTheDaLuu.filter(t => !t.isTenTruyen && !t.isTenChuong).length : 0;
        if (!this._cacTheDaLuu || this._cacTheDaLuu.length === 0 || soDoanNoiDung <= 1) {
            const cacTheMoi = DocTruyenSTV_Ext.PhanTichSTV.chuan_bi_noi_dung_the();
            if (cacTheMoi && cacTheMoi.length > 0) {
                this._cacTheDaLuu = cacTheMoi;
            }
        }

        let cacThe = (this._cacTheDaLuu || []).filter(t => {
            if (!this.docTenTruyen && t.isTenTruyen) return false;
            if (!this.docTenChuong && t.isTenChuong) return false;
            return true;
        });

        this.cacDoan = DocTruyenSTV_Ext.PhanTichSTV.tao_danh_sach_phat(cacThe, doDaiToiDa);
    },

    bat_dau_phat(tuViTri = null) {
        if (this.thongTinTabKhacDangPhat) {
            if (DocTruyenSTV_Ext.GiaoDienSTV && typeof DocTruyenSTV_Ext.GiaoDienSTV.taoThongBaoKhoaTab === 'function') {
                DocTruyenSTV_Ext.GiaoDienSTV.hien_thong_bao_toast(DocTruyenSTV_Ext.GiaoDienSTV.tao_thong_bao_khoa_tab(this.thongTinTabKhacDangPhat));
            } else if (DocTruyenSTV_Ext.GiaoDienSTV && typeof DocTruyenSTV_Ext.GiaoDienSTV.hienThongBaoToast === 'function') {
                DocTruyenSTV_Ext.GiaoDienSTV.hien_thong_bao_toast('Đang có trang truyện khác đang phát!');
            }
            return;
        }

        if (this._dongHoDebounceNhayDoan) {
            clearTimeout(this._dongHoDebounceNhayDoan);
            this._dongHoDebounceNhayDoan = null;
        }

        const btn = document.getElementById('stv-btn-retry-web');
        if (btn) btn.remove();

        const soDoanNoiDung = this._cacTheDaLuu ? this._cacTheDaLuu.filter(t => !t.isTenTruyen && !t.isTenChuong).length : 0;
        if (this.cacDoan.length === 0 || soDoanNoiDung <= 1) this.chuan_bi_cac_doan();
        if (this.cacDoan.length === 0) return;

        if (this.dongHoThoiGian) { clearInterval(this.dongHoThoiGian); this.dongHoThoiGian = null; }
        this.giayDaTroi = 0;
        this.dongHoThoiGian = setInterval(() => {
            if (this.dangPhat && !this.dangTamDung) {
                this.giayDaTroi++;
                this.phat_tin_nhan_trang_thai();
            }
        }, 1000);

        if (tuViTri !== null) {
            this.chiSoHienTai = Math.max(0, Math.min(Number(tuViTri) || 0, this.cacDoan.length - 1));
        }

        this.dangPhat = true;
        this.dangTamDung = false;
        this.idLuotPhat++;

        if (this.tabIdCuaToi) {
            let theTenTruyen = null;
            document.querySelectorAll('#booknameholder, #book_name2').forEach(el => {
                if ((el.innerText || el.textContent).trim().length > 0) theTenTruyen = el;
            });
            const tenTruyen = theTenTruyen ? (theTenTruyen.innerText || theTenTruyen.textContent).trim() : (document.querySelector('h1')?.innerText.trim() || document.title);

            let theTenChuong = null;
            document.querySelectorAll('#bookchapnameholder').forEach(el => {
                if ((el.innerText || el.textContent).trim().length > 0) theTenChuong = el;
            });
            let tenChuong = theTenChuong ? (theTenChuong.innerText || theTenChuong.textContent).trim() : '';
            if (!tenChuong && this._cacTheDaLuu) {
                const theCh = this._cacTheDaLuu.find(t => t.isTenChuong);
                if (theCh && theCh.text) tenChuong = theCh.text.trim();
            }
            if (!tenChuong && document.title && document.title.includes('/')) {
                const parts = document.title.split('/');
                if (parts.length > 1) tenChuong = parts[parts.length - 1].trim();
            }

            chrome.storage.local.set({
                stv_tab_dang_phat: {
                    tabId: this.tabIdCuaToi,
                    tenTruyen: tenTruyen || '',
                    tenChuong: tenChuong || '',
                    url: window.location.href,
                    isPlaying: true,
                    isPaused: false
                }
            });
        }

        this.phat_tin_nhan_trang_thai();

        const congCuThuc = this.lay_cong_cu_thuc_te();
        if (congCuThuc === 'web') this.phat_doan_web();
        else this.phatDoanAPI();
    },

    dung_phat() {
        if (this._dongHoDebounceNhayDoan) {
            clearTimeout(this._dongHoDebounceNhayDoan);
            this._dongHoDebounceNhayDoan = null;
        }

        const btn = document.getElementById('stv-btn-retry-web');
        if (btn) btn.remove();

        this.dangPhat = false;
        this.dangTamDung = false;
        this.dangTai = false;

        if (this.tabIdCuaToi) {
            chrome.storage.local.get(['stv_tab_dang_phat'], duLieu => {
                if (duLieu.stv_tab_dang_phat && duLieu.stv_tab_dang_phat.tabId === this.tabIdCuaToi) {
                    chrome.storage.local.remove('stv_tab_dang_phat');
                }
            });
        }

        this.idLuotPhat++;
        if (this.dongHoThoiGian) { clearInterval(this.dongHoThoiGian); this.dongHoThoiGian = null; }
        this.giayDaTroi = 0;
        this.huy_tai_api();
        this.huy_am_thanh_web();

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

        DocTruyenSTV_Ext.GiaoDienSTV.xoa_boi_den();
        this.phat_tin_nhan_trang_thai();
    },

    tam_dung_phat() {
        if (this._dongHoDebounceNhayDoan) {
            clearTimeout(this._dongHoDebounceNhayDoan);
            this._dongHoDebounceNhayDoan = null;
        }
        if (!this.dangPhat) return;
        this.dangTamDung = true;

        if (this.tabIdCuaToi) {
            chrome.storage.local.get(['stv_tab_dang_phat'], duLieu => {
                if (duLieu.stv_tab_dang_phat && duLieu.stv_tab_dang_phat.tabId === this.tabIdCuaToi) {
                    chrome.storage.local.set({
                        stv_tab_dang_phat: {
                            ...duLieu.stv_tab_dang_phat,
                            isPaused: true
                        }
                    });
                }
            });
        }

        this.phat_tin_nhan_trang_thai();

        if (this.lay_cong_cu_thuc_te() === 'web') {
            window.speechSynthesis.pause();
        } else {
            if (this.doiTuongAmThanh) this.doiTuongAmThanh.pause();
            DocTruyenSTV_Ext.QuanLyDongCoAmThanh.tam_dung();
        }
    },

    tiep_tuc_phat() {
        if (this.thongTinTabKhacDangPhat) {
            if (DocTruyenSTV_Ext.GiaoDienSTV && typeof DocTruyenSTV_Ext.GiaoDienSTV.taoThongBaoKhoaTab === 'function') {
                DocTruyenSTV_Ext.GiaoDienSTV.hien_thong_bao_toast(DocTruyenSTV_Ext.GiaoDienSTV.tao_thong_bao_khoa_tab(this.thongTinTabKhacDangPhat));
            } else if (DocTruyenSTV_Ext.GiaoDienSTV && typeof DocTruyenSTV_Ext.GiaoDienSTV.hienThongBaoToast === 'function') {
                DocTruyenSTV_Ext.GiaoDienSTV.hien_thong_bao_toast('Đang có trang truyện khác đang phát!');
            }
            return;
        }

        if (!this.dangPhat || !this.dangTamDung) return;

        const congCuThuc = this.lay_cong_cu_thuc_te();

        if (congCuThuc !== 'web' && (!this.doiTuongAmThanh || !this.doiTuongAmThanh.src)) {
            this.bat_dau_phat(this.chiSoHienTai);
            return;
        } else if (congCuThuc === 'web' && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
            this.bat_dau_phat(this.chiSoHienTai);
            return;
        }

        this.dangTamDung = false;

        if (this.tabIdCuaToi) {
            chrome.storage.local.get(['stv_tab_dang_phat'], duLieu => {
                if (duLieu.stv_tab_dang_phat && duLieu.stv_tab_dang_phat.tabId === this.tabIdCuaToi) {
                    chrome.storage.local.set({
                        stv_tab_dang_phat: {
                            ...duLieu.stv_tab_dang_phat,
                            isPaused: false
                        }
                    });
                }
            });
        }

        this.phat_tin_nhan_trang_thai();

        if (congCuThuc === 'web') {
            window.speechSynthesis.resume();
        } else {
            if (this.doiTuongAmThanh) this.doiTuongAmThanh.play();
            DocTruyenSTV_Ext.QuanLyDongCoAmThanh.tiep_tuc();
        }
    },

    cap_nhat_tu_dien_dong() {
        const chiSoCu = this.chiSoHienTai;
        const dangPhatTruocDo = this.dangPhat && !this.dangTamDung;

        this.huy_tai_api();

        if (this.dangPhat || this.dangTamDung) {
            this.huy_am_thanh_web();
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

        this.chuan_bi_cac_doan();
        DocTruyenSTV_Ext.GiaoDienSTV.boi_den_doan(
            Math.min(chiSoCu, Math.max(0, this.cacDoan.length - 1)),
            this.cacDoan, false, false
        );

        if (dangPhatTruocDo) {
            const viTriMoi = Math.min(chiSoCu, Math.max(0, this.cacDoan.length - 1));
            this.bat_dau_phat(viTriMoi);
        }
    },

    dao_trang_thai_phat() {
        if (this.thongTinTabKhacDangPhat) {
            if (DocTruyenSTV_Ext.GiaoDienSTV && typeof DocTruyenSTV_Ext.GiaoDienSTV.taoThongBaoKhoaTab === 'function') {
                DocTruyenSTV_Ext.GiaoDienSTV.hien_thong_bao_toast(DocTruyenSTV_Ext.GiaoDienSTV.tao_thong_bao_khoa_tab(this.thongTinTabKhacDangPhat));
            } else if (DocTruyenSTV_Ext.GiaoDienSTV && typeof DocTruyenSTV_Ext.GiaoDienSTV.hienThongBaoToast === 'function') {
                DocTruyenSTV_Ext.GiaoDienSTV.hien_thong_bao_toast('Đang có trang truyện khác đang phát!');
            }
            return;
        }
        if (!this.dangPhat) this.bat_dau_phat();
        else if (this.dangTamDung) this.tiep_tuc_phat();
        else this.tam_dung_phat();
    },

    _dongHoDebounceNhayDoan: null,

    nhay_doan(huong) {
        if (this.cacDoan.length === 0) return;
        let viTriTiep = huong === 'tiep' ? this.chiSoHienTai + 1 : this.chiSoHienTai - 1;

        if (viTriTiep >= this.cacDoan.length) {
            if (this.tuDongChuyenChuong) this.phat_chuong_tiep_theo();
            return;
        }
        if (viTriTiep < 0) {
            this.phat_chuong_truoc();
            return;
        }

        // Cập nhật chỉ số ngay lập tức để giao diện hiển thị ngay lập tức không trễ
        this.chiSoHienTai = viTriTiep;
        DocTruyenSTV_Ext.GiaoDienSTV.boi_den_doan(this.chiSoHienTai, this.cacDoan, this.dangPhat, this.dangTamDung);
        this.phat_tin_nhan_trang_thai();

        // Xóa bộ đếm debounce trước đó nếu đang chờ
        if (this._dongHoDebounceNhayDoan) {
            clearTimeout(this._dongHoDebounceNhayDoan);
            this._dongHoDebounceNhayDoan = null;
        }

        // Nếu người dùng đang phát thì ngắt âm thanh hiện tại và đặt delay 250ms chống spam Chromium SpeechSynthesis
        if (this.dangPhat && !this.dangTamDung) {
            this.idLuotPhat++;
            this.huy_tai_api();
            this.huy_am_thanh_web();
            if (this.doiTuongAmThanh) this.doiTuongAmThanh.pause();

            this._dongHoDebounceNhayDoan = setTimeout(() => {
                this._dongHoDebounceNhayDoan = null;
                if (!this.dangPhat || this.dangTamDung) return;
                const congCuThuc = this.lay_cong_cu_thuc_te();
                if (congCuThuc === 'web') this.phat_doan_web();
                else this.phatDoanAPI();
            }, 250);
        }
    },

    phat_chuong_tiep_theo() {
        if (DocTruyenSTV_Ext.LuuTruSTV && DocTruyenSTV_Ext.LuuTruSTV.don_dep_cache_cu) {
            DocTruyenSTV_Ext.LuuTruSTV.don_dep_cache_cu();
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
            this.dung_phat();
            DocTruyenSTV_Ext.GiaoDienSTV.hien_thi_thong_bao('Đang chuyển sang chương tiếp theo...');
            sessionStorage.setItem('autoStartOnLoad', 'true');
            nutTiep.click();
        } else {
            DocTruyenSTV_Ext.GiaoDienSTV.hien_thi_thong_bao('Không có chương tiếp theo');
            this.dung_phat();
        }
    },

    phat_chuong_truoc() {
        if (DocTruyenSTV_Ext.LuuTruSTV && DocTruyenSTV_Ext.LuuTruSTV.don_dep_cache_cu) {
            DocTruyenSTV_Ext.LuuTruSTV.don_dep_cache_cu();
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
            this.dung_phat();
            sessionStorage.setItem('autoStartOnLoad', 'true');
            nutTruoc.click();
        } else {
            DocTruyenSTV_Ext.GiaoDienSTV.hien_thi_thong_bao('Không có chương trước');
        }
    },


    _dongHoGiaiPhongKet: null,

    huy_am_thanh_web() {
        if (this._dongHoGiaiPhongKet) { clearTimeout(this._dongHoGiaiPhongKet); this._dongHoGiaiPhongKet = null; }
        if (this.dongHoGiamSat) { clearTimeout(this.dongHoGiamSat); this.dongHoGiamSat = null; }
        if (this.dongHoDuyTri) { clearInterval(this.dongHoDuyTri); this.dongHoDuyTri = null; }
        if (this.phatNgonHienTai) {
            this.phatNgonHienTai.onend = null;
            this.phatNgonHienTai.onerror = null;
            this.phatNgonHienTai.onstart = null;
        }
        window.speechSynthesis.cancel();
    },

    phat_doan_web(boQuaGhiChu = false) {
        const btnCu = document.getElementById('stv-btn-retry-web');
        if (btnCu) btnCu.remove();

        while (this.chiSoHienTai < this.cacDoan.length && !this.cacDoan[this.chiSoHienTai].text) {
            this.chiSoHienTai++;
        }

        if (!this.dangPhat || this.chiSoHienTai >= this.cacDoan.length) {
            if (this.chiSoHienTai >= this.cacDoan.length && this.tuDongChuyenChuong && this.dangPhat) this.phat_chuong_tiep_theo();
            else this.dung_phat();
            return;
        }

        const doan = this.cacDoan[this.chiSoHienTai];
        DocTruyenSTV_Ext.GiaoDienSTV.boi_den_doan(this.chiSoHienTai, this.cacDoan, this.dangPhat, this.dangTamDung);
        this.huy_am_thanh_web();

        const u = new SpeechSynthesisUtterance(doan.text);
        this.phatNgonHienTai = u;
        u.lang = 'vi-VN';
        u.rate = this.tocDo;
        u.pitch = 1.0;
        u.volume = Math.min(this.amLuong, 1.0);

        const ds_giong = window.speechSynthesis.getVoices();
        const co_giong_tieng_viet = ds_giong.some(v => v.lang && v.lang.startsWith('vi'));
        if (ds_giong.length > 0 && !co_giong_tieng_viet && !this._da_canh_bao_thieu_giong) {
            this._da_canh_bao_thieu_giong = true;
            DocTruyenSTV_Ext.GiaoDienSTV.hien_thi_thong_bao('Chưa phát hiện gói giọng đọc tiếng Việt trên máy/trình duyệt. Khuyên dùng API FPT hoặc Azure.');
        }

        const giong = this.lay_giong_web_hieu_qua(ds_giong);
        if (giong) u.voice = giong;

        const idLuot = this.idLuotPhat;

        u.onstart = () => {
            if (this.idLuotPhat !== idLuot) return;
            if (this._dongHoGiaiPhongKet) {
                clearTimeout(this._dongHoGiaiPhongKet);
                this._dongHoGiaiPhongKet = null;
            }
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
            this.huy_am_thanh_web();
            this.chiSoHienTai++;
            const thoi_gian_nghi_chuyen = Math.max(50, Number(this.thoiGianNghiXuongDong !== undefined ? this.thoiGianNghiXuongDong : (this.thoiGianNghi || 1200)));
            setTimeout(() => this.phat_doan_web(), thoi_gian_nghi_chuyen);
        };

        u.onerror = (l) => {
            if (this.idLuotPhat !== idLuot) return;
            this.huy_am_thanh_web();
            if (l.error !== 'canceled' && l.error !== 'interrupted') {
                this.chiSoHienTai++;
                this.phat_doan_web(true);
            }
        };

        const thoiGianDocUocTinh = Math.max(15000, Math.ceil((doan.text.length / Math.max(this.tocDo, 0.25)) * 200));
        this.dongHoGiamSat = setTimeout(() => {
            if (this.idLuotPhat !== idLuot) return;
            this.huy_am_thanh_web();
            this.phat_doan_web(true);
        }, thoiGianDocUocTinh);

        // Tự động giải phóng kẹt (watchdog) nếu sau 1200ms trình duyệt Chromium không gọi onstart
        if (this._dongHoGiaiPhongKet) clearTimeout(this._dongHoGiaiPhongKet);
        this._dongHoGiaiPhongKet = setTimeout(() => {
            this._dongHoGiaiPhongKet = null;
            if (this.idLuotPhat === idLuot && this.dangPhat && !this.dangTamDung) {
                window.speechSynthesis.cancel();
                window.speechSynthesis.resume();
                setTimeout(() => {
                    if (this.idLuotPhat === idLuot && this.dangPhat && !this.dangTamDung) {
                        this.phat_doan_web();
                    }
                }, 60);
            }
        }, 1200);

        if (this.dangTamDung) {
            window.speechSynthesis.pause();
        } else if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(u);
    },

    _hien_thi_nut_chuyen_web_tam_thoi(idLuot) {
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
                this._xoa_blob_cu();
                this.huy_tai_api();

                this._soLanRetryTimeout = 0;
                this.dangTai = false;
                this.phat_tin_nhan_trang_thai();
                this._phat_mot_doan_web_roi_quay_lai_fpt(luotMoi);
            };
            doan.el.appendChild(btn);
        }
    },


    huy_tai_api() {
        try {
            if (chrome.runtime && chrome.runtime.id) {
                chrome.runtime.sendMessage({ hanhDong: 'huyTatCa' });
            }
        } catch (e) {
        }
    },

    async taiAmThanhTrucTiep(vanBan, khoaCache) {
        const cacheBlob = await DocTruyenSTV_Ext.LuuTruSTV.lay_am_thanh(khoaCache);
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
            const blob = await fetch(`data:${phanHoi.audioType || 'audio/mpeg'};base64,${phanHoi.audioBase64}`).then(res => res.blob());
            DocTruyenSTV_Ext.LuuTruSTV.luu_am_thanh(khoaCache, blob).catch(() => { });
            return blob;
        }

        throw new Error('Background không trả về dữ liệu audio');
    },

    _xu_ly_loi_api(l, idLuot) {
        this.dangTai = false;
        this.phat_tin_nhan_trang_thai();

        if (this.idLuotPhat !== idLuot || !this.dangPhat) return true;
        if (l.name === 'AbortError') return true;

        const msg = (l.message || '').toLowerCase();
        console.error('[DocTruyenSTV] Lỗi API:', l);

        const laLoiKenh = msg.includes('message channel')
            || msg.includes('receiving end does not exist')
            || msg.includes('could not establish connection')
            || msg.includes('extension context');
        if (laLoiKenh) {
            if (msg.includes('extension context')) {
                console.warn('[DocTruyenSTV] Extension đã được cập nhật hoặc tải lại. Vui lòng F5 trang.');
                this.dung_phat();
                DocTruyenSTV_Ext.GiaoDienSTV.hien_thi_thong_bao('Extension đã cập nhật, vui lòng F5 tải lại trang', 'warning');
                return true;
            }
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
                this._xoa_blob_cu();
                this._phat_mot_doan_web_roi_quay_lai_fpt(idLuot);
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
        this._xoa_blob_cu();

        this.congCu = 'web';
        DocTruyenSTV_Ext.GiaoDienSTV.hien_thi_thong_bao(
            laLoiQuota ? 'Hết lượt API — tạm chuyển sang Web Speech'
                : 'Lỗi tải API — tạm chuyển sang Web Speech'
        );
        this.phat_doan_web();
        return true;
    },

    _phat_mot_doan_web_roi_quay_lai_fpt(idLuot) {
        if (this.idLuotPhat !== idLuot || !this.dangPhat) return;
        const doan = this.cacDoan[this.chiSoHienTai];
        if (!doan) return;

        this.huy_am_thanh_web();
        this.dangTai = false;
        this.dangPhatTamWeb = true;
        this.phat_tin_nhan_trang_thai();
        const u = new SpeechSynthesisUtterance(doan.text);
        u.lang = 'vi-VN';
        u.rate = this.tocDo;
        u.pitch = 1.0;
        u.volume = Math.min(this.amLuong, 1.0);
        const ds_giong = window.speechSynthesis.getVoices();
        const co_giong_tieng_viet = ds_giong.some(v => v.lang && v.lang.startsWith('vi'));
        if (ds_giong.length > 0 && !co_giong_tieng_viet && !this._da_canh_bao_thieu_giong) {
            this._da_canh_bao_thieu_giong = true;
            DocTruyenSTV_Ext.GiaoDienSTV.hien_thi_thong_bao('Chưa phát hiện gói giọng đọc tiếng Việt trên máy/trình duyệt. Khuyên dùng API FPT hoặc Azure.');
        }

        const giong = this.lay_giong_web_hieu_qua(ds_giong);
        if (giong) u.voice = giong;

        const thoat = () => {
            this.huy_am_thanh_web();
            this.dangPhatTamWeb = false;
            this.phat_tin_nhan_trang_thai();
            if (this.idLuotPhat !== idLuot || !this.dangPhat) return;
            this.chiSoHienTai++;
            const nghiXuongDong = Math.max(50, Number(this.thoiGianNghiXuongDong !== undefined ? this.thoiGianNghiXuongDong : (this.thoiGianNghi || 1200)));
            setTimeout(() => {
                if (this.idLuotPhat === idLuot && this.dangPhat) this.phatDoanAPI();
            }, nghiXuongDong);
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

    _xoa_blob_cu() {
        if (this.duongDanBoNhoDem) {
            URL.revokeObjectURL(this.duongDanBoNhoDem);
            this.duongDanBoNhoDem = null;
        }
    },

    _dam_bao_audio_el() {
        if (!this.doiTuongAmThanh) {
            const { bo_nguon, bo_chinh_am } = DocTruyenSTV_Ext.QuanLyDongCoAmThanh.lay_nguon();
            this.doiTuongAmThanh = new Audio();
            this._mediaSource = bo_nguon.createMediaElementSource(this.doiTuongAmThanh);
            this._mediaSource.connect(bo_chinh_am);
        }
        return this.doiTuongAmThanh;
    },

    _dam_bao_tai_truoc(idLuot, hienTaiDoan, hienTaiCau, soLuong) {
        if (this.idLuotPhat !== idLuot || !this.dangPhat) return;
        if (!this._preloadQueue) this._preloadQueue = [];
        
        this._preloadQueue = this._preloadQueue.filter(p => p.idLuot === idLuot);
        
        let duyetDoan = hienTaiDoan;
        let duyetCau = hienTaiCau;
        let cacCauHienTai = DocTruyenSTV_Ext.PhanTichSTV.chia_cau_nho(this.cacDoan[duyetDoan].text, 500);
        
        while (this._preloadQueue.length < soLuong) {
            duyetCau++;
            if (duyetCau >= cacCauHienTai.length) {
                duyetDoan++;
                while (duyetDoan < this.cacDoan.length && !this.cacDoan[duyetDoan].text) {
                    duyetDoan++;
                }
                if (duyetDoan >= this.cacDoan.length) break;
                cacCauHienTai = DocTruyenSTV_Ext.PhanTichSTV.chia_cau_nho(this.cacDoan[duyetDoan].text, 500);
                duyetCau = 0;
            }
            if (duyetCau >= cacCauHienTai.length) continue;
            
            const chuoi = cacCauHienTai[duyetCau];
            const daCo = this._preloadQueue.find(p => p.doanIndex === duyetDoan && p.cauIndex === duyetCau);
            if (!daCo) {
                const khoa = DocTruyenSTV_Ext.PhanTichSTV.tao_khoa_luu_tru(chuoi, this.congCu, this.chiSoGiong, this.tocDo);
                this._preloadQueue.push({
                    doanIndex: duyetDoan,
                    cauIndex: duyetCau,
                    idLuot: idLuot,
                    text: chuoi,
                    promise: this.taiAmThanhTrucTiep(chuoi, khoa).catch(e => ({ error: e }))
                });
            }
        }
    },

    async phatDoanAPI() {
        while (this.chiSoHienTai < this.cacDoan.length && !this.cacDoan[this.chiSoHienTai].text) {
            this.chiSoHienTai++;
        }

        if (!this.dangPhat || this.chiSoHienTai >= this.cacDoan.length) {
            if (this.chiSoHienTai >= this.cacDoan.length && this.tuDongChuyenChuong && this.dangPhat)
                this.phat_chuong_tiep_theo();
            else
                this.dung_phat();
            return;
        }

        const doan = this.cacDoan[this.chiSoHienTai];
        DocTruyenSTV_Ext.GiaoDienSTV.boi_den_doan(this.chiSoHienTai, this.cacDoan, this.dangPhat, this.dangTamDung);
        const idLuot = this.idLuotPhat;

        const btnCu = document.getElementById('stv-btn-retry-web');
        if (btnCu) btnCu.remove();
        this._hien_thi_nut_chuyen_web_tam_thoi(idLuot);

        const cacCau = DocTruyenSTV_Ext.PhanTichSTV.chia_cau_nho(doan.text, 500);

        for (let i = 0; i < cacCau.length; i++) {
            if (this.idLuotPhat !== idLuot || !this.dangPhat) return;

            const chuoi = cacCau[i];
            const khoa = DocTruyenSTV_Ext.PhanTichSTV.tao_khoa_luu_tru(chuoi, this.congCu, this.chiSoGiong, this.tocDo);

            this._dam_bao_tai_truoc(idLuot, this.chiSoHienTai, i, 2);

            let blob;
            try {
                let promiseTai;
                if (!this._preloadQueue) this._preloadQueue = [];
                const qIdx = this._preloadQueue.findIndex(p => p.doanIndex === this.chiSoHienTai && p.cauIndex === i && p.idLuot === idLuot);
                if (qIdx !== -1) {
                    promiseTai = this._preloadQueue[qIdx].promise;
                    this._preloadQueue.splice(qIdx, 1);
                } else {
                    promiseTai = this.taiAmThanhTrucTiep(chuoi, khoa);
                }

                let _loadingTimer = setTimeout(() => {
                    if (this.idLuotPhat === idLuot && this.dangPhat) {
                        this.dangTai = true;
                        this.phat_tin_nhan_trang_thai();
                    }
                }, 100);

                blob = await promiseTai;
                clearTimeout(_loadingTimer);
                
                if (blob && blob.error) throw blob.error;
            } catch (l) {
                const msg = (l.message || '').toLowerCase();
                const laLoiQuota = msg.includes('quota') || msg.includes('429') || msg.includes('401') || msg.includes('403') || msg.includes('unauthorized') || msg.includes('forbidden') || msg.includes('exceeded');
                const laLoiKenh = msg.includes('message channel') || msg.includes('receiving end does not exist') || msg.includes('could not establish connection') || msg.includes('extension context');
                
                if (laLoiQuota || laLoiKenh) {
                    this._xu_ly_loi_api(l, idLuot);
                    return;
                }

                const laLoiTimeout = msg.includes('hết thời gian') || msg.includes('timeout') || msg.includes('render');
                if (laLoiTimeout || this.thayNhanhWeb !== 'off') {
                    if (this.thayNhanhWeb === 'off') {
                        this._xu_ly_loi_api(l, idLuot);
                        return;
                    }
                    
                    console.warn(`[DocTruyenSTV] Lỗi nạp câu (đoạn ${this.chiSoHienTai}, câu ${i}) — dùng Web Speech thay thế:`, msg);
                    this.dangTai = false;
                    this.dangPhatTamWeb = true;
                    this.phat_tin_nhan_trang_thai();
                    
                    await new Promise((resolve) => {
                        const u = new SpeechSynthesisUtterance(chuoi);
                        u.lang = 'vi-VN';
                        u.rate = this.tocDo;
                        u.pitch = 1.0;
                        u.volume = Math.min(this.amLuong, 1.0);
                        const dsGiong = window.speechSynthesis.getVoices();
                        const giong = this.lay_giong_web_hieu_qua(dsGiong);
                        if (giong) u.voice = giong;
                        
                        let daResolve = false;
                        const ketThuc = () => { if (!daResolve) { daResolve = true; resolve(); } };
                        u.onend = ketThuc;
                        u.onerror = ketThuc;
                        window.speechSynthesis.speak(u);
                        
                        const checkCancel = setInterval(() => {
                            if (this.idLuotPhat !== idLuot || !this.dangPhat) {
                                clearInterval(checkCancel);
                                window.speechSynthesis.cancel();
                                ketThuc();
                            }
                        }, 200);
                        
                        const orgEnd = u.onend;
                        u.onend = () => { clearInterval(checkCancel); orgEnd(); };
                        const orgErr = u.onerror;
                        u.onerror = () => { clearInterval(checkCancel); orgErr(); };
                    });
                    
                    this.dangPhatTamWeb = false;
                    this.phat_tin_nhan_trang_thai();
                    
                    if (this.idLuotPhat !== idLuot || !this.dangPhat) return;
                    if (i < cacCau.length - 1) {
                        const nghi = chuoi.trim().endsWith(',') 
                            ? (this.thoiGianNghiPhay !== undefined ? this.thoiGianNghiPhay : 300)
                            : (this.thoiGianNghiCham !== undefined ? this.thoiGianNghiCham : (this.thoiGianNghi || 800));
                        if (nghi > 0) {
                            await new Promise(r => setTimeout(r, nghi));
                            if (this.idLuotPhat !== idLuot || !this.dangPhat) return;
                        }
                    }
                    continue;
                } else {
                    this._xu_ly_loi_api(l, idLuot);
                    return;
                }
            }

            if (this.idLuotPhat !== idLuot || !this.dangPhat) return;

            this.dangTai = false;
            this.phat_tin_nhan_trang_thai();

            this._xoa_blob_cu();
            this.duongDanBoNhoDem = URL.createObjectURL(blob);

            const { bo_chinh_am } = DocTruyenSTV_Ext.QuanLyDongCoAmThanh.lay_nguon();
            bo_chinh_am.gain.value = this.amLuong;

            const audio = this._dam_bao_audio_el();
            audio.onended = null;
            audio.pause();
            audio.src = this.duongDanBoNhoDem;
            audio.volume = Math.min(this.amLuong, 1.0);
            audio.playbackRate = this.tocDo;

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

            if (i < cacCau.length - 1) {
                const nghi = chuoi.trim().endsWith(',') 
                    ? (this.thoiGianNghiPhay !== undefined ? this.thoiGianNghiPhay : 300)
                    : (this.thoiGianNghiCham !== undefined ? this.thoiGianNghiCham : (this.thoiGianNghi || 800));
                if (nghi > 0) {
                    await new Promise(r => setTimeout(r, nghi));
                    if (this.idLuotPhat !== idLuot || !this.dangPhat) return;
                }
            }
        }

        this.chiSoHienTai++;
        const nghiXuongDong = Math.max(50, Number(this.thoiGianNghiXuongDong !== undefined ? this.thoiGianNghiXuongDong : (this.thoiGianNghi || 1200)));
        setTimeout(() => this.phatDoanAPI(), nghiXuongDong);
    },

    luu_trang_thai_chong_doi() {
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
                chiSoTuyetDoi: this.lay_chi_so_toan_cuc() + 1,
                tenTruyen: ten,
                tenChuong: chuong,
                duongDanTrang: window.location.href
            };

            DocTruyenSTV_Ext.LuuTruSTV.luu_tien_trinh_doc(trangThai).catch(e => console.log('Không thể lưu tiến trình:', e.message));
        }, 5000);
    }
};

DocTruyenSTV_Ext.PhanTichSTV = {
    lam_tranh_van_ban(vanBan) {
        if (!vanBan) return '';
        try {
            let txt = vanBan
                .replace(/Đang tải nội dung chương\.\.\./gi, '')
                .replace(/@Bạn đang đọc bản lưu.*/gi, '')
                .replace(/@Thực hiện bởi Sáng Tác Việt.*/gi, '')
                .replace(/Đọc trên (web|sangtacviet\.com) để có chất lượng dịch cao và ủng hộ website\./gi,
                    'Đọc trên Sáng Tác Việt Chấm Cơm để có chất lượng dịch cao và ủng hộ website.')
                .replace(/[\u200B-\u200D\uFEFF]/g, '')
                .replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            const tuDien = DocTruyenSTV_Ext.LuuTruSTV?.tu_dien_da_bien_dich || [];
            for (const quyTac of tuDien) {
                try {
                    if (quyTac && quyTac.regex && quyTac.thayThe !== undefined) {
                        txt = txt.replace(quyTac.regex, quyTac.thayThe);
                    }
                } catch (e) {}
            }
            return txt;
        } catch (err) {
            return String(vanBan || '').trim();
        }
    },

    kiem_tra_ma_hoa() {
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

    // Tìm khung nội dung hợp lệ (có chứa chữ thực sự, bỏ qua khung đang tải)
    tim_khung_noi_dung_hien_tai() {
        // 1. Kiểm tra theo ID chương trên URL nếu có (ví dụ: .../936098298/)
        const p = window.location.pathname.split('/').filter(Boolean);
        const cidHienTai = p.length >= 4 ? p[p.length - 1] : null;
        if (cidHienTai && /^\d+$/.test(cidHienTai)) {
            const khungTheoCid = document.querySelector(`.contentbox[cid="${cidHienTai}"], .contentbox[id*="${cidHienTai}"]`);
            if (khungTheoCid) {
                const txt = khungTheoCid.innerText || '';
                const coChunk = khungTheoCid.querySelectorAll('.tts-chunk').length > 1;
                const dangTai = txt.includes('Đang tải nội dung') || txt.includes('Đang tải...');
                const chuoiTho = this.lam_tranh_van_ban(txt);
                if ((coChunk || chuoiTho.length > 50) && !dangTai) {
                    return khungTheoCid;
                }
            }
        }

        // 2. Tìm trong #content-container hoặc toàn trang các khung có nội dung thực
        const cacKhung = document.querySelectorAll('#content-container .contentbox, .contentbox');
        for (const khung of cacKhung) {
            const txt = khung.innerText || '';
            const dangTai = txt.includes('Đang tải nội dung') || txt.includes('Đang tải...');
            if (dangTai) continue; // Bỏ qua khung đang tải nội dung
            const coChunk = khung.querySelectorAll('.tts-chunk').length > 1;
            const chuoiTho = this.lam_tranh_van_ban(txt);
            if (coChunk || chuoiTho.length > 50) {
                return khung;
            }
        }
        return null;
    },

    chuan_bi_noi_dung_the() {
        DocTruyenSTV_Ext.GiaoDienSTV.them_phong_cach();
        let danhSachThe = [];
        let idDemThe = 0;

        const themThe = (theNode, chuoi, thuocTinhThem = {}) => {
            chuoi = this.lam_tranh_van_ban(chuoi);
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

        // Ưu tiên khung nội dung thực sự có chữ của chương hiện tại
        const khungUuTien = this.tim_khung_noi_dung_hien_tai();
        let cacKhungNoidung = [];
        if (khungUuTien) {
            cacKhungNoidung = [khungUuTien];
        } else {
            const tatCa = document.querySelectorAll('#content-container .contentbox, .contentbox');
            tatCa.forEach(khung => {
                const txt = khung.innerText || '';
                if (txt.includes('Đang tải nội dung') || txt.includes('Đang tải...')) return;
                const coChunk = khung.querySelectorAll('.tts-chunk').length > 1;
                const chuoiTho = this.lam_tranh_van_ban(txt);
                if (coChunk || chuoiTho.length > 50) cacKhungNoidung.push(khung);
            });
        }

        cacKhungNoidung.forEach(khung => {
            const txtKhung = khung.innerText || '';
            if (txtKhung && (txtKhung.includes('Đang tải nội dung') || txtKhung.includes('Đang tải...'))) return;

            const soLuongTtsChunk = khung.querySelectorAll('.tts-chunk').length;
            const canBocLai = (!khung.dataset.extTtsDone || soLuongTtsChunk <= 1) && soLuongTtsChunk <= 1;
            if (canBocLai) {
                if (soLuongTtsChunk > 0) {
                    khung.querySelectorAll('.tts-chunk').forEach(theSpan => {
                        if (theSpan.id === 'bookchapnameholder' || theSpan.id === 'booknameholder' || theSpan.id === 'book_name2') return;
                        const khoangTrang = document.createTextNode(' ');
                        theSpan.parentNode.insertBefore(khoangTrang, theSpan.nextSibling);
                        while (theSpan.firstChild) theSpan.parentNode.insertBefore(theSpan.firstChild, theSpan);
                        theSpan.remove();
                    });
                }
                bocCacThe(khung);
            }

            let demDoanKhung = 0;
            khung.querySelectorAll('.tts-chunk').forEach(theSpan => {
                if (theSpan.id === 'bookchapnameholder' || theSpan.id === 'booknameholder' || theSpan.id === 'book_name2') return;
                let txt = this.lam_tranh_van_ban(theSpan.innerText || theSpan.textContent || '');
                if (txt.length > 2) {
                    danhSachThe.push({ id: theSpan.id, text: txt, el: theSpan });
                    demDoanKhung++;
                }
            });

            if (demDoanKhung > 1) {
                khung.dataset.extTtsDone = 'true';
                khung.dataset.ttsPrepared = 'true';
            }
        });

        return danhSachThe;
    },

    chia_cau_nho(vanBan, maxLen = 500) {
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

    chia_doan_van_ban(vanBan, doDaiToiDa) {
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

    tao_danh_sach_phat(danhSachThe, doDaiToiDa) {
        let danhSachCuoi = [];
        for (const the of danhSachThe) {
            const cacVanBan = this.chia_doan_van_ban(the.text, doDaiToiDa);
            for (const chuoi of cacVanBan) {
                danhSachCuoi.push({ text: chuoi, el: the.el });
            }
        }
        return danhSachCuoi;
    },

    tao_khoa_luu_tru(vanBan, congCu, chiSoGiong, tocDo) {
        const tho = vanBan.replace(/\s+/g, '') + `_${congCu}_${chiSoGiong}_${tocDo}`;
        let bam1 = 5381, bam2 = 0;
        for (let i = 0; i < tho.length; i++) {
            bam1 = ((bam1 << 5) + bam1) ^ tho.charCodeAt(i);
            bam2 = ((bam2 * 31) + tho.charCodeAt(i)) | 0;
        }
        return (bam1 >>> 0).toString(36) + '_' + (bam2 >>> 0).toString(36) + '_' + tho.length;
    }
};

window.addEventListener('pagehide', () => {
    if (DocTruyenSTV_Ext.TrinhPhatAmThanh && DocTruyenSTV_Ext.TrinhPhatAmThanh.tabIdCuaToi) {
        chrome.storage.local.get(['stv_tab_dang_phat'], duLieu => {
            if (duLieu.stv_tab_dang_phat && duLieu.stv_tab_dang_phat.tabId === DocTruyenSTV_Ext.TrinhPhatAmThanh.tabIdCuaToi) {
                chrome.storage.local.remove('stv_tab_dang_phat');
            }
        });
    }
});