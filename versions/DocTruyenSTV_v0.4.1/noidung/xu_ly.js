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
    dang_phat: false,
    dang_tam_dung: false,
    dang_tai: false,
    cong_cu: 'auto',
    toc_do: 1,
    am_luong: 1,
    chi_so_giong: undefined,
    ten_giong_doc: '',
    thoi_gian_nghi: 1200,
    thoi_gian_nghi_phay: 300,
    thoi_gian_nghi_cham: 800,
    thoi_gian_nghi_xuong_dong: 1200,
    tu_dong_chuyen_chuong: true,
    tab_id_cua_toi: null,
    thong_tin_tab_khac_dang_phat: null,

    cac_doan: [],
    chi_so_hien_tai: 0,

    doi_tuong_am_thanh: null,
    phat_ngon_hien_tai: null,
    duong_dan_bo_nho_dem: null,
    _preloadQueue: [],

    dong_ho_giam_sat: null,
    dong_ho_duy_tri: null,
    dong_ho_luu_trang_thai: null,
    id_luot_phat: 0,
    giay_da_troi: 0,
    dong_ho_thoi_gian: null,

    // Cập nhật chỉ số giọng đọc và khôi phục bộ đệm âm thanh
    cap_nhat_chi_so_giong(chi_so_moi, ten_giong_moi) {
        const gia_tri = parseInt(chi_so_moi, 10);
        if (ten_giong_moi) {
            const ten_thuong = ten_giong_moi.toLowerCase();
            // Bảo vệ: Tuyệt đối không gán giọng ngoại ngữ (David, Zira, English) làm giọng mặc định
            if (!ten_thuong.includes('david') && !ten_thuong.includes('zira') && !ten_thuong.includes('english')) {
                this.ten_giong_doc = ten_giong_moi;
            }
        }
        if (!isNaN(gia_tri)) {
            if (this.chi_so_giong === gia_tri && !ten_giong_moi) return;
            this.chi_so_giong = gia_tri;
        }
        this._preloadQueue = [];
        if (this.dang_phat && !this.dang_tam_dung) {
            this.dung_phat();
            setTimeout(() => this.bat_dau_phat(this.chi_so_hien_tai), 200);
        } else if (this.dang_phat && this.dang_tam_dung) {
            this.huy_tai_api();
            this.huy_am_thanh_web();
            if (this.doi_tuong_am_thanh) {
                this.doi_tuong_am_thanh.onended = null;
                this.doi_tuong_am_thanh.pause();
                this.doi_tuong_am_thanh.src = '';
                this.doi_tuong_am_thanh = null;
            }
        }
    },

    // Lựa chọn giọng đọc Web TTS chuẩn tiếng Việt, tuyệt đối không dùng giọng nước ngoài khi máy có sẵn giọng tiếng Việt
    lay_giong_web_hieu_qua(ds_giong) {
        if (!ds_giong || ds_giong.length === 0) return null;

        const ds_giong_viet = ds_giong.filter(v => v.lang && v.lang.toLowerCase().startsWith('vi'));

        if (ds_giong_viet.length > 0) {
            // A. Ưu tiên khớp theo tên giọng nếu đã được người dùng chọn
            if (this.ten_giong_doc) {
                const giong_theo_ten = ds_giong_viet.find(v => v.name === this.ten_giong_doc || v.voiceURI === this.ten_giong_doc);
                if (giong_theo_ten) {
                    this.chi_so_giong = ds_giong.indexOf(giong_theo_ten);
                    return giong_theo_ten;
                }
            }

            // B. Kiểm tra nếu chỉ số hiện tại trỏ đúng vào một giọng tiếng Việt
            if (this.chi_so_giong !== undefined && ds_giong[this.chi_so_giong]) {
                const giong_hien_tai = ds_giong[this.chi_so_giong];
                if (giong_hien_tai.lang && giong_hien_tai.lang.toLowerCase().startsWith('vi')) {
                    this.ten_giong_doc = giong_hien_tai.name;
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
                this.chi_so_giong = chi_so_chuan;
                this.ten_giong_doc = giong_viet_chuan.name;
                try {
                    chrome.storage.sync.set({ voiceIndex: chi_so_chuan, voiceName: giong_viet_chuan.name });
                } catch (e) {}
                return giong_viet_chuan;
            }
        }

        // Tuyệt đối không tự ý gán giọng ngoại ngữ (David, Zira...) khi chưa có giọng tiếng Việt
        if (this.chi_so_giong !== undefined && ds_giong[this.chi_so_giong]) {
            const g = ds_giong[this.chi_so_giong];
            if (g.lang && g.lang.toLowerCase().startsWith('vi')) return g;
        }
        return null;
    },

    kiem_tra_tab_khac_dang_phat(du_lieu_tab) {
        if (du_lieu_tab && du_lieu_tab.isPlaying && du_lieu_tab.tabId && this.tab_id_cua_toi && du_lieu_tab.tabId !== this.tab_id_cua_toi) {
            this.thong_tin_tab_khac_dang_phat = du_lieu_tab;
        } else {
            this.thong_tin_tab_khac_dang_phat = null;
        }
        if (DocTruyenSTV_Ext.GiaoDienSTV && typeof DocTruyenSTV_Ext.GiaoDienSTV.cap_nhat_khoa_tab_khac === 'function') {
            DocTruyenSTV_Ext.GiaoDienSTV.cap_nhat_khoa_tab_khac(this.thong_tin_tab_khac_dang_phat);
        }
    },

    khoi_tao() {
        if (!DocTruyenSTV_Ext.la_ngu_canh_hop_le()) return;
        try {
            chrome.runtime.sendMessage({ hanhDong: 'layTabIdHienTai' }, phan_hoi => {
                if (!DocTruyenSTV_Ext.la_ngu_canh_hop_le()) return;
                try {
                    if (phan_hoi && phan_hoi.tabId) {
                        this.tab_id_cua_toi = phan_hoi.tabId;
                        chrome.storage.local.get(['stv_tab_dang_phat'], duLieu => {
                            if (duLieu) this.kiem_tra_tab_khac_dang_phat(duLieu.stv_tab_dang_phat);
                        });
                    }
                } catch (_) {}
            });
        } catch (e) {}

        try {
            chrome.storage.sync.get(['maydoc', 'speed', 'volume', 'voiceIndex', 'voiceName', 'tudongchuyenchuong', 'smartPauses', 'pauseComma', 'pauseDot', 'pausePara', 'doctentruyen', 'doctenchuong', 'thayNhanhWeb'], duLieu => {
                if (!duLieu) return;
                this.cong_cu = duLieu.maydoc || 'auto';
                this.toc_do = duLieu.speed || 1.0;
                this.am_luong = duLieu.volume !== undefined ? duLieu.volume : 1.0;
                this.chi_so_giong = duLieu.voiceIndex !== undefined ? parseInt(duLieu.voiceIndex, 10) : undefined;
                this.ten_giong_doc = duLieu.voiceName || '';
                this.tu_dong_chuyen_chuong = duLieu.tudongchuyenchuong !== undefined ? duLieu.tudongchuyenchuong : true;
                this.thoi_gian_nghi_phay = duLieu.pauseComma !== undefined ? duLieu.pauseComma : 300;
                this.thoi_gian_nghi_cham = duLieu.pauseDot !== undefined ? duLieu.pauseDot : 800;
                this.thoi_gian_nghi_xuong_dong = duLieu.pausePara !== undefined ? duLieu.pausePara : (duLieu.smartPauses !== undefined ? duLieu.smartPauses : 1200);
                this.thoi_gian_nghi_phay = this.thoi_gian_nghi_phay;
                this.thoi_gian_nghi_cham = this.thoi_gian_nghi_cham;
                this.thoi_gian_nghi_xuong_dong = this.thoi_gian_nghi_xuong_dong;
                this.thoi_gian_nghi = this.thoi_gian_nghi_xuong_dong;
                this.doc_ten_truyen = duLieu.doctentruyen !== undefined ? duLieu.doctentruyen : true;
                this.doc_ten_chuong = duLieu.doctenchuong !== undefined ? duLieu.doctenchuong : true;
                let val = duLieu.thayNhanhWeb;
                if (val === true) val = 'on';
                if (val === false) val = 'off';
                this.thay_nhanh_web = val || 'off';
            });
        } catch (_) {}

        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.addEventListener('voiceschanged', () => {
                const ds = window.speechSynthesis.getVoices();
                if (ds && ds.length > 0) {
                    this.lay_giong_web_hieu_qua(ds);
                }
            });
        }

        chrome.storage.onChanged.addListener((thay_doi, vungChon) => {
            if (vungChon === 'local' && thay_doi.stv_tab_dang_phat) {
                this.kiem_tra_tab_khac_dang_phat(thay_doi.stv_tab_dang_phat.newValue);
            }
            if (vungChon === 'sync') {
                if (thay_doi.maydoc) {
                    this.cong_cu = thay_doi.maydoc.newValue;
                    this.chuan_bi_cac_doan();
                    this.chi_so_hien_tai = Math.min(this.chi_so_hien_tai, Math.max(0, this.cac_doan.length - 1));
                    if (this.dang_phat && !this.dang_tam_dung) {
                        this.dung_phat();
                        setTimeout(() => this.bat_dau_phat(this.chi_so_hien_tai), 200);
                    } else if (this.dang_phat && this.dang_tam_dung) {
                        this.huy_tai_api();
                        this.huy_am_thanh_web();
                        if (this.doi_tuong_am_thanh) {
                            this.doi_tuong_am_thanh.onended = null;
                            this.doi_tuong_am_thanh.pause();
                            this.doi_tuong_am_thanh.src = '';
                            this.doi_tuong_am_thanh = null;
                        }
                    }
                }
                if (thay_doi.speed) {
                    this.toc_do = thay_doi.speed.newValue;
                    if (this.doi_tuong_am_thanh) this.doi_tuong_am_thanh.playbackRate = this.toc_do;
                }
                if (thay_doi.volume) {
                    this.am_luong = thay_doi.volume.newValue;
                    if (this.doi_tuong_am_thanh) this.doi_tuong_am_thanh.volume = Math.min(this.am_luong, 1.0);
                    if (DocTruyenSTV_Ext.QuanLyDongCoAmThanh && DocTruyenSTV_Ext.QuanLyDongCoAmThanh.bo_chinh_am) {
                        DocTruyenSTV_Ext.QuanLyDongCoAmThanh.bo_chinh_am.gain.value = this.am_luong;
                    }
                }
                if (thay_doi.voiceIndex) {
                    this.cap_nhat_chi_so_giong(parseInt(thay_doi.voiceIndex.newValue, 10), thay_doi.voiceName ? thay_doi.voiceName.newValue : undefined);
                }
                if (thay_doi.voiceName) {
                    this.ten_giong_doc = thay_doi.voiceName.newValue;
                }
                if (thay_doi.tudongchuyenchuong) this.tu_dong_chuyen_chuong = thay_doi.tudongchuyenchuong.newValue;
                if (thay_doi.pauseComma) {
                    this.thoi_gian_nghi_phay = thay_doi.pauseComma.newValue;
                    this.thoi_gian_nghi_phay = this.thoi_gian_nghi_phay;
                }
                if (thay_doi.pauseDot) {
                    this.thoi_gian_nghi_cham = thay_doi.pauseDot.newValue;
                    this.thoi_gian_nghi_cham = this.thoi_gian_nghi_cham;
                }
                if (thay_doi.pausePara) {
                    this.thoi_gian_nghi_xuong_dong = thay_doi.pausePara.newValue;
                    this.thoi_gian_nghi_xuong_dong = this.thoi_gian_nghi_xuong_dong;
                    this.thoi_gian_nghi = this.thoi_gian_nghi_xuong_dong;
                }
                if (thay_doi.smartPauses && !thay_doi.pausePara) {
                    this.thoi_gian_nghi_xuong_dong = thay_doi.smartPauses.newValue;
                    this.thoi_gian_nghi_xuong_dong = this.thoi_gian_nghi_xuong_dong;
                    this.thoi_gian_nghi = this.thoi_gian_nghi_xuong_dong;
                }
                if (thay_doi.thayNhanhWeb !== undefined) {
                    let val = thay_doi.thayNhanhWeb.newValue;
                    if (val === true) val = 'on';
                    if (val === false) val = 'off';
                    this.thay_nhanh_web = val || 'off';
                }
                if (thay_doi.doctentruyen !== undefined || thay_doi.doctenchuong !== undefined) {
                    if (thay_doi.doctentruyen !== undefined) this.doc_ten_truyen = thay_doi.doctentruyen.newValue;
                    if (thay_doi.doctenchuong !== undefined) this.doc_ten_chuong = thay_doi.doctenchuong.newValue;

                    let doan_hien_tai = '';
                    if (this.cac_doan.length > 0 && this.chi_so_hien_tai < this.cac_doan.length) {
                        doan_hien_tai = this.cac_doan[this.chi_so_hien_tai].text;
                    }
                    this.chuan_bi_cac_doan();
                    if (doan_hien_tai) {
                        const vi_tri_moi = this.cac_doan.findIndex(d => d.text === doan_hien_tai);
                        if (vi_tri_moi !== -1) this.chi_so_hien_tai = vi_tri_moi;
                        else if (this.chi_so_hien_tai >= this.cac_doan.length) this.chi_so_hien_tai = Math.max(0, this.cac_doan.length - 1);
                    }
                    DocTruyenSTV_Ext.GiaoDienSTV.boi_den_doan(this.chi_so_hien_tai, this.cac_doan, this.dang_phat, this.dang_tam_dung);
                }
            }
        });

        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('a');
            if (btn && btn.href && btn.href.includes('/truyen/')) {
                if (btn.href !== window.location.href) {
                    this._cacTheDaLuu = null;
                    this.cac_doan = [];
                    setTimeout(() => {
                        this.chuan_bi_cac_doan();
                    }, 600);
                }
            }
        });

        window.addEventListener('popstate', () => {
            this._cacTheDaLuu = null;
            this.cac_doan = [];
            setTimeout(() => {
                this.chuan_bi_cac_doan();
            }, 300);
        });
    },

    lay_cong_cu_thuc_te() {
        if (this.dang_phat_tam_web) return 'web';
        if (this.cong_cu && this.cong_cu.startsWith('khac_')) return this.cong_cu;
        return (this.cong_cu === 'auto' || this.cong_cu === 'google') ? 'web' : this.cong_cu;
    },

    lay_tong_so_doan() {
        return this.cac_doan.length;
    },

    lay_chi_so_hien_tai() {
        return this.chi_so_hien_tai;
    },

    lay_chi_so_toan_cuc() {
        if (!this._cacTheDaLuu || this.cac_doan.length === 0) return this.chi_so_hien_tai;
        let offset = 0;
        const do_dai_toi_da = this.lay_cong_cu_thuc_te() === 'web' ? 250 : 5000;
        if (!this.doc_ten_truyen) {
            let the_tieu_de = this._cacTheDaLuu.find(t => t.isTenTruyen);
            if (the_tieu_de) offset += DocTruyenSTV_Ext.PhanTichSTV.tao_danh_sach_phat([the_tieu_de], do_dai_toi_da).length;
        }
        if (!this.doc_ten_chuong) {
            let the_chuong = this._cacTheDaLuu.find(t => t.isTenChuong);
            if (the_chuong) offset += DocTruyenSTV_Ext.PhanTichSTV.tao_danh_sach_phat([the_chuong], do_dai_toi_da).length;
        }
        return this.chi_so_hien_tai + offset;
    },

    tinh_chi_so_thuc(vi_tri_tuyet_doi) {
        if (!this._cacTheDaLuu) return vi_tri_tuyet_doi;
        let offset = 0;
        const do_dai_toi_da = this.lay_cong_cu_thuc_te() === 'web' ? 250 : 5000;
        if (!this.doc_ten_truyen) {
            let the_tieu_de = this._cacTheDaLuu.find(t => t.isTenTruyen);
            if (the_tieu_de) offset += DocTruyenSTV_Ext.PhanTichSTV.tao_danh_sach_phat([the_tieu_de], do_dai_toi_da).length;
        }
        if (!this.doc_ten_chuong) {
            let the_chuong = this._cacTheDaLuu.find(t => t.isTenChuong);
            if (the_chuong) offset += DocTruyenSTV_Ext.PhanTichSTV.tao_danh_sach_phat([the_chuong], do_dai_toi_da).length;
        }
        return Math.max(0, vi_tri_tuyet_doi - offset);
    },

    _debouncedTrangThai: null,
    phat_tin_nhan_trang_thai() {
        DocTruyenSTV_Ext.GiaoDienSTV.cap_nhat_bang_dieu_khien(this.chi_so_hien_tai, this.cac_doan.length, this.dang_phat, this.dang_tam_dung, this.dang_tai);

        if (this._debouncedTrangThai) return;
        this._debouncedTrangThai = setTimeout(() => {
            this._debouncedTrangThai = null;
            if (!DocTruyenSTV_Ext.la_ngu_canh_hop_le()) return;
            try {
                chrome.runtime.sendMessage({
                    hanhDong: 'thayDoiTrangThai',
                    trangThai: {
                        isPlaying: this.dang_phat,
                        isPaused: this.dang_tam_dung,
                        isBuffering: this.dang_tai,
                        engine: this.cong_cu,
                        elapsed: this.giay_da_troi,
                        coDocDo: this.chi_so_hien_tai > 0,
                        progress: this.cac_doan.length > 0 ? { current: this.chi_so_hien_tai + 1, total: this.cac_doan.length } : null,
                        tien_trinh_tuyet_doi: this._cacTheDaLuu ? { current: this.lay_chi_so_toan_cuc() + 1 } : null
                    }
                }, () => {
                    if (chrome.runtime?.lastError) { }
                });
            } catch (_) {}
        }, 200);
    },

    _cacTheDaLuu: null,

    chuan_bi_cac_doan() {
        const cong_cu_thuc = this.lay_cong_cu_thuc_te();
        const do_dai_toi_da = cong_cu_thuc === 'web' ? 250 : 5000;

        const so_doan_noi_dung = this._cacTheDaLuu ? this._cacTheDaLuu.filter(t => !t.isTenTruyen && !t.isTenChuong).length : 0;
        if (!this._cacTheDaLuu || this._cacTheDaLuu.length === 0 || so_doan_noi_dung <= 1) {
            const cacTheMoi = DocTruyenSTV_Ext.PhanTichSTV.chuan_bi_noi_dung_the();
            if (cacTheMoi && cacTheMoi.length > 0) {
                this._cacTheDaLuu = cacTheMoi;
            }
        }

        let cacThe = (this._cacTheDaLuu || []).filter(t => {
            if (!this.doc_ten_truyen && t.isTenTruyen) return false;
            if (!this.doc_ten_chuong && t.isTenChuong) return false;
            return true;
        });

        this.cac_doan = DocTruyenSTV_Ext.PhanTichSTV.tao_danh_sach_phat(cacThe, do_dai_toi_da);
    },

    bat_dau_phat(tu_vi_tri = null) {
        if (this.thong_tin_tab_khac_dang_phat) {
            if (DocTruyenSTV_Ext.GiaoDienSTV && typeof DocTruyenSTV_Ext.GiaoDienSTV.tao_thong_bao_khoa_tab === 'function') {
                DocTruyenSTV_Ext.GiaoDienSTV.hien_thong_bao_toast(DocTruyenSTV_Ext.GiaoDienSTV.tao_thong_bao_khoa_tab(this.thong_tin_tab_khac_dang_phat));
            } else if (DocTruyenSTV_Ext.GiaoDienSTV && typeof DocTruyenSTV_Ext.GiaoDienSTV.hien_thong_bao_toast === 'function') {
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

        const so_doan_noi_dung = this._cacTheDaLuu ? this._cacTheDaLuu.filter(t => !t.isTenTruyen && !t.isTenChuong).length : 0;
        if (this.cac_doan.length === 0 || so_doan_noi_dung <= 1) this.chuan_bi_cac_doan();
        if (this.cac_doan.length === 0) return;

        if (this.dong_ho_thoi_gian) { clearInterval(this.dong_ho_thoi_gian); this.dong_ho_thoi_gian = null; }
        this.giay_da_troi = 0;
        this.dong_ho_thoi_gian = setInterval(() => {
            if (this.dang_phat && !this.dang_tam_dung) {
                this.giay_da_troi++;
                this.phat_tin_nhan_trang_thai();
            }
        }, 1000);

        if (tu_vi_tri !== null) {
            this.chi_so_hien_tai = Math.max(0, Math.min(Number(tu_vi_tri) || 0, this.cac_doan.length - 1));
        }

        this.dang_phat = true;
        this.dang_tam_dung = false;
        this.id_luot_phat++;

        if (this.tab_id_cua_toi) {
            let the_ten_truyen = null;
            document.querySelectorAll('#booknameholder, #book_name2').forEach(el => {
                if ((el.innerText || el.textContent).trim().length > 0) the_ten_truyen = el;
            });
            const tenTruyen = the_ten_truyen ? (the_ten_truyen.innerText || the_ten_truyen.textContent).trim() : (document.querySelector('h1')?.innerText.trim() || document.title);

            let the_ten_chuong = null;
            document.querySelectorAll('#bookchapnameholder').forEach(el => {
                if ((el.innerText || el.textContent).trim().length > 0) the_ten_chuong = el;
            });
            let tenChuong = the_ten_chuong ? (the_ten_chuong.innerText || the_ten_chuong.textContent).trim() : '';
            if (!tenChuong && this._cacTheDaLuu) {
                const the_chuong = this._cacTheDaLuu.find(t => t.isTenChuong);
                if (the_chuong && the_chuong.text) tenChuong = the_chuong.text.trim();
            }
            if (!tenChuong && document.title && document.title.includes('/')) {
                const parts = document.title.split('/');
                if (parts.length > 1) tenChuong = parts[parts.length - 1].trim();
            }

            if (this.tab_id_cua_toi && DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                try {
                    chrome.storage.local.set({
                        stv_tab_dang_phat: {
                            tabId: this.tab_id_cua_toi,
                            tenTruyen: tenTruyen || '',
                            tenChuong: tenChuong || '',
                            url: window.location.href,
                            isPlaying: true,
                            isPaused: false
                        }
                    });
                } catch (_) {}
            }
        }

        this.phat_tin_nhan_trang_thai();

        const cong_cu_thuc = this.lay_cong_cu_thuc_te();
        if (cong_cu_thuc === 'web') this.phat_doan_web();
        else this.phat_doan_api();
    },

    dung_phat() {
        if (this._dong_ho_hoan_nhay_doan) {
            clearTimeout(this._dong_ho_hoan_nhay_doan);
            this._dong_ho_hoan_nhay_doan = null;
        }

        const btn = document.getElementById('stv-btn-retry-web');
        if (btn) btn.remove();

        this.dang_phat = false;
        this.dang_tam_dung = false;
        this.dang_tai = false;

        if (this.tab_id_cua_toi && DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
            try {
                chrome.storage.local.get(['stv_tab_dang_phat'], du_lieu => {
                    try {
                        if (du_lieu && du_lieu.stv_tab_dang_phat && du_lieu.stv_tab_dang_phat.tabId === this.tab_id_cua_toi) {
                            if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                                chrome.storage.local.remove('stv_tab_dang_phat');
                            }
                        }
                    } catch (_) {}
                });
            } catch (_) {}
        }

        this.id_luot_phat++;
        if (this.dong_ho_thoi_gian) { clearInterval(this.dong_ho_thoi_gian); this.dong_ho_thoi_gian = null; }
        this.giay_da_troi = 0;
        this.huy_tai_api();
        this.huy_am_thanh_web();

        if (this.doi_tuong_am_thanh) {
            this.doi_tuong_am_thanh.onended = null;
            this.doi_tuong_am_thanh.pause();
            this.doi_tuong_am_thanh.src = '';
            this.doi_tuong_am_thanh = null;
        }
        if (this._nguon_phat_media) {
            this._nguon_phat_media.disconnect();
            this._nguon_phat_media = null;
        }
        DocTruyenSTV_Ext.QuanLyDongCoAmThanh.dong_nguon();
        if (this.duong_dan_bo_nho_dem) {
            URL.revokeObjectURL(this.duong_dan_bo_nho_dem);
            this.duong_dan_bo_nho_dem = null;
        }

        DocTruyenSTV_Ext.GiaoDienSTV.xoa_boi_den();
        this.phat_tin_nhan_trang_thai();
    },

    tam_dung_phat() {
        if (this._dong_ho_hoan_nhay_doan) {
            clearTimeout(this._dong_ho_hoan_nhay_doan);
            this._dong_ho_hoan_nhay_doan = null;
        }
        if (!this.dang_phat) return;
        this.dang_tam_dung = true;

        if (this.tab_id_cua_toi && DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
            try {
                chrome.storage.local.get(['stv_tab_dang_phat'], du_lieu => {
                    try {
                        if (du_lieu && du_lieu.stv_tab_dang_phat && du_lieu.stv_tab_dang_phat.tabId === this.tab_id_cua_toi) {
                            if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                                chrome.storage.local.set({
                                    stv_tab_dang_phat: {
                                        ...du_lieu.stv_tab_dang_phat,
                                        isPaused: true,
                                        dang_tam_dung: true
                                    }
                                });
                            }
                        }
                    } catch (_) {}
                });
            } catch (_) {}
        }

        this.phat_tin_nhan_trang_thai();

        if (this.lay_cong_cu_thuc_te() === 'web') {
            window.speechSynthesis.pause();
        } else {
            if (this.doi_tuong_am_thanh) this.doi_tuong_am_thanh.pause();
            DocTruyenSTV_Ext.QuanLyDongCoAmThanh.tam_dung();
        }
    },

    tiep_tuc_phat() {
        if (this.thong_tin_tab_khac_dang_phat) {
            if (DocTruyenSTV_Ext.GiaoDienSTV && typeof DocTruyenSTV_Ext.GiaoDienSTV.tao_thong_bao_khoa_tab === 'function') {
                DocTruyenSTV_Ext.GiaoDienSTV.hien_thong_bao_toast(DocTruyenSTV_Ext.GiaoDienSTV.tao_thong_bao_khoa_tab(this.thong_tin_tab_khac_dang_phat));
            } else if (DocTruyenSTV_Ext.GiaoDienSTV && typeof DocTruyenSTV_Ext.GiaoDienSTV.hien_thong_bao_toast === 'function') {
                DocTruyenSTV_Ext.GiaoDienSTV.hien_thong_bao_toast('Đang có trang truyện khác đang phát!');
            }
            return;
        }

        if (!this.dang_phat || !this.dang_tam_dung) return;

        const cong_cu_thuc = this.lay_cong_cu_thuc_te();

        if (cong_cu_thuc !== 'web' && (!this.doi_tuong_am_thanh || !this.doi_tuong_am_thanh.src)) {
            this.bat_dau_phat(this.chi_so_hien_tai);
            return;
        } else if (cong_cu_thuc === 'web' && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
            this.bat_dau_phat(this.chi_so_hien_tai);
            return;
        }

        this.dang_tam_dung = false;

        if (this.tab_id_cua_toi && DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
            try {
                chrome.storage.local.get(['stv_tab_dang_phat'], du_lieu => {
                    try {
                        if (du_lieu && du_lieu.stv_tab_dang_phat && du_lieu.stv_tab_dang_phat.tabId === this.tab_id_cua_toi) {
                            if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                                chrome.storage.local.set({
                                    stv_tab_dang_phat: {
                                        ...du_lieu.stv_tab_dang_phat,
                                        isPaused: false,
                                        dang_tam_dung: false
                                    }
                                });
                            }
                        }
                    } catch (_) {}
                });
            } catch (_) {}
        }

        this.phat_tin_nhan_trang_thai();

        if (cong_cu_thuc === 'web') {
            window.speechSynthesis.resume();
        } else {
            if (this.doi_tuong_am_thanh) this.doi_tuong_am_thanh.play();
            DocTruyenSTV_Ext.QuanLyDongCoAmThanh.tiep_tuc();
        }
    },

    cap_nhat_tu_dien_dong() {
        const chi_so_cu = this.chi_so_hien_tai;
        const dang_phat_truoc_do = this.dang_phat && !this.dang_tam_dung;

        this.huy_tai_api();

        if (this.dang_phat || this.dang_tam_dung) {
            this.huy_am_thanh_web();
            if (this.doi_tuong_am_thanh) {
                this.doi_tuong_am_thanh.pause();
                this.doi_tuong_am_thanh.src = '';
            }
        }

        this._cac_the_da_luu = null;
        this.cac_doan = [];
        document.querySelectorAll('.contentbox').forEach(k => {
            delete k.dataset.extTtsDone;
        });

        this.chuan_bi_cac_doan();
        DocTruyenSTV_Ext.GiaoDienSTV.boi_den_doan(
            Math.min(chi_so_cu, Math.max(0, this.cac_doan.length - 1)),
            this.cac_doan, false, false
        );

        if (dang_phat_truoc_do) {
            const vi_tri_moi = Math.min(chi_so_cu, Math.max(0, this.cac_doan.length - 1));
            this.bat_dau_phat(vi_tri_moi);
        }
    },

    dao_trang_thai_phat() {
        if (this.thong_tin_tab_khac_dang_phat) {
            if (DocTruyenSTV_Ext.GiaoDienSTV && typeof DocTruyenSTV_Ext.GiaoDienSTV.tao_thong_bao_khoa_tab === 'function') {
                DocTruyenSTV_Ext.GiaoDienSTV.hien_thong_bao_toast(DocTruyenSTV_Ext.GiaoDienSTV.tao_thong_bao_khoa_tab(this.thong_tin_tab_khac_dang_phat));
            } else if (DocTruyenSTV_Ext.GiaoDienSTV && typeof DocTruyenSTV_Ext.GiaoDienSTV.hien_thong_bao_toast === 'function') {
                DocTruyenSTV_Ext.GiaoDienSTV.hien_thong_bao_toast('Đang có trang truyện khác đang phát!');
            }
            return;
        }
        if (!this.dang_phat) this.bat_dau_phat();
        else if (this.dang_tam_dung) this.tiep_tuc_phat();
        else this.tam_dung_phat();
    },

    _dong_ho_hoan_nhay_doan: null,
    get _dongHoDebounceNhayDoan() { return this._dong_ho_hoan_nhay_doan; },
    set _dongHoDebounceNhayDoan(v) { this._dong_ho_hoan_nhay_doan = v; },

    nhay_doan(huong) {
        if (this.cac_doan.length === 0) return;
        let vi_tri_tiep = huong === 'tiep' ? this.chi_so_hien_tai + 1 : this.chi_so_hien_tai - 1;

        if (vi_tri_tiep >= this.cac_doan.length) {
            if (this.tu_dong_chuyen_chuong) this.phat_chuong_tiep_theo();
            return;
        }
        if (vi_tri_tiep < 0) {
            this.phat_chuong_truoc();
            return;
        }

        // Cập nhật chỉ số ngay lập tức để giao diện hiển thị ngay lập tức không trễ
        this.chi_so_hien_tai = vi_tri_tiep;
        DocTruyenSTV_Ext.GiaoDienSTV.boi_den_doan(this.chi_so_hien_tai, this.cac_doan, this.dang_phat, this.dang_tam_dung);
        this.phat_tin_nhan_trang_thai();

        // Xóa bộ đếm debounce trước đó nếu đang chờ
        if (this._dong_ho_hoan_nhay_doan) {
            clearTimeout(this._dong_ho_hoan_nhay_doan);
            this._dong_ho_hoan_nhay_doan = null;
        }

        // Nếu người dùng đang phát thì ngắt âm thanh hiện tại và đặt delay 250ms chống spam Chromium SpeechSynthesis
        if (this.dang_phat && !this.dang_tam_dung) {
            this.id_luot_phat++;
            this.huy_tai_api();
            this.huy_am_thanh_web();
            if (this.doi_tuong_am_thanh) this.doi_tuong_am_thanh.pause();

            this._dong_ho_hoan_nhay_doan = setTimeout(() => {
                this._dong_ho_hoan_nhay_doan = null;
                if (!this.dang_phat || this.dang_tam_dung) return;
                const cong_cu_thuc = this.lay_cong_cu_thuc_te();
                if (cong_cu_thuc === 'web') this.phat_doan_web();
                else this.phat_doan_api();
            }, 250);
        }
    },

    phat_chuong_tiep_theo() {
        if (DocTruyenSTV_Ext.LuuTruSTV && DocTruyenSTV_Ext.LuuTruSTV.don_dep_cache_cu) {
            DocTruyenSTV_Ext.LuuTruSTV.don_dep_cache_cu();
        }
        const ban_chon = ['#navnexttop', '#navnextbot', '#navnext', '#nav_next', '#btnnext', '#btn_next', '.btn-next-chapter', 'a.next', '.chapter-next a', '[data-nav="next"]'];
        let nut_tiep = null;
        for (const chon of ban_chon) {
            nut_tiep = document.querySelector(chon);
            if (nut_tiep) break;
        }
        if (!nut_tiep) {
            const cac_lien_ket = Array.from(document.querySelectorAll('a, button'));
            nut_tiep = cac_lien_ket.find(el => {
                const text = el.textContent.toLowerCase().trim();
                return text === 'chương sau' || text === 'chương tiếp' || text.includes('tiếp theo');
            });
        }

        if (nut_tiep) {
            this.dung_phat();
            DocTruyenSTV_Ext.GiaoDienSTV.hien_thi_thong_bao('Đang chuyển sang chương tiếp theo...');
            sessionStorage.setItem('autoStartOnLoad', 'true');
            nut_tiep.click();
        } else {
            DocTruyenSTV_Ext.GiaoDienSTV.hien_thi_thong_bao('Không có chương tiếp theo');
            this.dung_phat();
        }
    },

    phat_chuong_truoc() {
        if (DocTruyenSTV_Ext.LuuTruSTV && DocTruyenSTV_Ext.LuuTruSTV.don_dep_cache_cu) {
            DocTruyenSTV_Ext.LuuTruSTV.don_dep_cache_cu();
        }
        const ban_chon = ['#navprevtop', '#navprevbot', '#navprev', '#nav_prev', '#btnprev', '#btn_prev', '.btn-prev-chapter', 'a.prev', '.chapter-prev a', '[data-nav="prev"]'];
        let nut_truoc = null;
        for (const chon of ban_chon) {
            nut_truoc = document.querySelector(chon);
            if (nut_truoc) break;
        }
        if (!nut_truoc) {
            const cac_lien_ket = Array.from(document.querySelectorAll('a, button'));
            nut_truoc = cac_lien_ket.find(el => {
                const text = el.textContent.toLowerCase().trim();
                return text === 'chương trước' || text.includes('trước đó');
            });
        }

        if (nut_truoc) {
            this.dung_phat();
            sessionStorage.setItem('autoStartOnLoad', 'true');
            nut_truoc.click();
        } else {
            DocTruyenSTV_Ext.GiaoDienSTV.hien_thi_thong_bao('Không có chương trước');
        }
    },

    _dong_ho_giai_phong_ket: null,
    get _dongHoGiaiPhongKet() { return this._dong_ho_giai_phong_ket; },
    set _dongHoGiaiPhongKet(v) { this._dong_ho_giai_phong_ket = v; },

    huy_am_thanh_web() {
        if (this._dong_ho_giai_phong_ket) { clearTimeout(this._dong_ho_giai_phong_ket); this._dong_ho_giai_phong_ket = null; }
        if (this.dong_ho_giam_sat) { clearTimeout(this.dong_ho_giam_sat); this.dong_ho_giam_sat = null; }
        if (this.dong_ho_duy_tri) { clearInterval(this.dong_ho_duy_tri); this.dong_ho_duy_tri = null; }
        if (this.phat_ngon_hien_tai) {
            this.phat_ngon_hien_tai.onend = null;
            this.phat_ngon_hien_tai.onerror = null;
            this.phat_ngon_hien_tai.onstart = null;
        }
        window.speechSynthesis.cancel();
    },

    phat_doan_web(bo_qua_ghi_chu = false) {
        const nut_cu = document.getElementById('stv-btn-retry-web');
        if (nut_cu) nut_cu.remove();

        while (this.chi_so_hien_tai < this.cac_doan.length && !this.cac_doan[this.chi_so_hien_tai].text) {
            this.chi_so_hien_tai++;
        }

        if (!this.dang_phat || this.chi_so_hien_tai >= this.cac_doan.length) {
            if (this.chi_so_hien_tai >= this.cac_doan.length && this.tu_dong_chuyen_chuong && this.dang_phat) this.phat_chuong_tiep_theo();
            else this.dung_phat();
            return;
        }

        const doan = this.cac_doan[this.chi_so_hien_tai];
        DocTruyenSTV_Ext.GiaoDienSTV.boi_den_doan(this.chi_so_hien_tai, this.cac_doan, this.dang_phat, this.dang_tam_dung);
        this.huy_am_thanh_web();

        const u = new SpeechSynthesisUtterance(doan.text);
        this.phat_ngon_hien_tai = u;
        u.lang = 'vi-VN';
        u.rate = this.toc_do;
        u.pitch = 1.0;
        u.volume = Math.min(this.am_luong, 1.0);

        const ds_giong = window.speechSynthesis.getVoices();
        const co_giong_tieng_viet = ds_giong.some(v => v.lang && v.lang.startsWith('vi'));
        if (ds_giong.length > 0 && !co_giong_tieng_viet && !this._da_canh_bao_thieu_giong) {
            this._da_canh_bao_thieu_giong = true;
            DocTruyenSTV_Ext.GiaoDienSTV.hien_thi_thong_bao('Chưa phát hiện gói giọng đọc tiếng Việt trên máy/trình duyệt. Khuyên dùng API FPT hoặc Azure.');
        }

        const giong = this.lay_giong_web_hieu_qua(ds_giong);
        if (giong) u.voice = giong;

        const id_luot = this.id_luot_phat;

        u.onstart = () => {
            if (this.id_luot_phat !== id_luot) return;
            if (this._dong_ho_giai_phong_ket) {
                clearTimeout(this._dong_ho_giai_phong_ket);
                this._dong_ho_giai_phong_ket = null;
            }
            if (this.dong_ho_giam_sat) clearTimeout(this.dong_ho_giam_sat);
            if (this.dong_ho_duy_tri) clearInterval(this.dong_ho_duy_tri);
            this.dong_ho_duy_tri = setInterval(() => {
                if (!this.dang_tam_dung) {
                    window.speechSynthesis.pause();
                    window.speechSynthesis.resume();
                }
            }, 10000);
        };

        u.onend = () => {
            if (this.id_luot_phat !== id_luot) return;
            this.huy_am_thanh_web();
            this.chi_so_hien_tai++;
            const thoi_gian_nghi_chuyen = Math.max(50, Number(this.thoi_gian_nghi_xuong_dong !== undefined ? this.thoi_gian_nghi_xuong_dong : (this.thoi_gian_nghi || 1200)));
            setTimeout(() => this.phat_doan_web(), thoi_gian_nghi_chuyen);
        };

        u.onerror = (l) => {
            if (this.id_luot_phat !== id_luot) return;
            this.huy_am_thanh_web();
            if (l.error !== 'canceled' && l.error !== 'interrupted') {
                this.chi_so_hien_tai++;
                this.phat_doan_web(true);
            }
        };

        const thoi_gian_doc_uoc_tinh = Math.max(15000, Math.ceil((doan.text.length / Math.max(this.toc_do, 0.25)) * 200));
        this.dong_ho_giam_sat = setTimeout(() => {
            if (this.id_luot_phat !== id_luot) return;
            this.huy_am_thanh_web();
            this.phat_doan_web(true);
        }, thoi_gian_doc_uoc_tinh);

        // Tự động giải phóng kẹt (watchdog) nếu sau 1200ms trình duyệt Chromium không gọi onstart
        if (this._dong_ho_giai_phong_ket) clearTimeout(this._dong_ho_giai_phong_ket);
        this._dong_ho_giai_phong_ket = setTimeout(() => {
            this._dong_ho_giai_phong_ket = null;
            if (this.id_luot_phat === id_luot && this.dang_phat && !this.dang_tam_dung) {
                window.speechSynthesis.cancel();
                window.speechSynthesis.resume();
                setTimeout(() => {
                    if (this.id_luot_phat === id_luot && this.dang_phat && !this.dang_tam_dung) {
                        this.phat_doan_web();
                    }
                }, 60);
            }
        }, 1200);

        if (this.dang_tam_dung) {
            window.speechSynthesis.pause();
        } else if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(u);
    },

    _hien_thi_nut_chuyen_web_tam_thoi(id_luot) {
        const doan = this.cac_doan[this.chi_so_hien_tai];
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
                if (this.id_luot_phat !== id_luot || !this.dang_phat) return;

                this.id_luot_phat++;
                const luot_moi = this.id_luot_phat;

                if (this.doi_tuong_am_thanh) {
                    this.doi_tuong_am_thanh.onended = null;
                    this.doi_tuong_am_thanh.pause();
                }
                this._xoa_blob_cu();
                this.huy_tai_api();

                this._so_lan_thu_lai = 0;
                this.dang_tai = false;
                this.phat_tin_nhan_trang_thai();
                this._phat_mot_doan_web_roi_quay_lai_fpt(luot_moi);
            };
            doan.el.appendChild(btn);
        }
    },


    huy_tai_api() {
        try {
            if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                chrome.runtime.sendMessage({ hanhDong: 'huyTatCa' });
            }
        } catch (e) {
        }
    },

    async tai_am_thanh_truc_tiep(van_ban, khoa_cache) {
        const blob_cache = await DocTruyenSTV_Ext.LuuTruSTV.lay_am_thanh(khoa_cache);
        if (blob_cache) return blob_cache;

        if (!DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
            throw new Error('Extension context invalidated');
        }

        let phan_hoi;
        try {
            phan_hoi = await chrome.runtime.sendMessage({
                hanhDong: 'taiAmThanh',
                vanBan: van_ban,
                van_ban: van_ban,
                congCu: this.cong_cu,
                cong_cu: this.cong_cu,
                chiSoGiong: this.chi_so_giong,
                chi_so_giong: this.chi_so_giong,
                tocDo: this.toc_do,
                toc_do: this.toc_do,
                maYeuCau: Date.now().toString() + Math.random(),
                ma_yeu_cau: Date.now().toString() + Math.random(),
                khoaCache: khoa_cache,
                khoa_cache: khoa_cache,
                thayNhanhWeb: this.thay_nhanh_web,
                thay_nhanh_web: this.thay_nhanh_web
            });
        } catch (e) {
            throw e;
        }

        if (!phan_hoi) throw new Error('Không nhận được phản hồi từ background');
        if (phan_hoi.biHuy || phan_hoi.bi_huy) throw new DOMException(phan_hoi.error || 'DaHuy', 'AbortError');
        if (phan_hoi.error) throw new Error(phan_hoi.error);

        const du_lieu_base64 = phan_hoi.audioBase64 || phan_hoi.audio_base64;
        if (du_lieu_base64) {
            const loai_am_thanh = phan_hoi.audioType || phan_hoi.audio_type || 'audio/mpeg';
            const blob = await fetch(`data:${loai_am_thanh};base64,${du_lieu_base64}`).then(res => res.blob());
            DocTruyenSTV_Ext.LuuTruSTV.luu_am_thanh(khoa_cache, blob).catch(() => { });
            return blob;
        }

        throw new Error('Background không trả về dữ liệu audio');
    },

    _xu_ly_loi_api(l, id_luot) {
        this.dang_tai = false;
        this.phat_tin_nhan_trang_thai();

        if (this.id_luot_phat !== id_luot || !this.dang_phat) return true;
        if (l.name === 'AbortError') return true;

        const msg = (l.message || '').toLowerCase();
        console.error('[DocTruyenSTV] Lỗi API:', l);

        const la_loi_kenh = msg.includes('message channel')
            || msg.includes('receiving end does not exist')
            || msg.includes('could not establish connection')
            || msg.includes('extension context');
        if (la_loi_kenh) {
            if (msg.includes('extension context') || !DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                console.warn('[DocTruyenSTV] Extension đã được cập nhật hoặc tải lại. Vui lòng F5 trang.');
                this.dang_phat = false;
                this.dang_tam_dung = false;
                this.dang_tai = false;
                this.huy_am_thanh_web();
                if (this.doi_tuong_am_thanh) {
                    this.doi_tuong_am_thanh.pause();
                    this.doi_tuong_am_thanh.src = '';
                    this.doi_tuong_am_thanh = null;
                }
                DocTruyenSTV_Ext.GiaoDienSTV.xoa_boi_den();
                DocTruyenSTV_Ext.GiaoDienSTV.cap_nhat_bang_dieu_khien(this.chi_so_hien_tai, this.cac_doan.length, false, false);
                DocTruyenSTV_Ext.GiaoDienSTV.hien_thi_thong_bao('Extension đã cập nhật, vui lòng F5 tải lại trang', 'warning');
                return true;
            }
            console.warn('[DocTruyenSTV] Lỗi kênh, retry sau 1s...');
            setTimeout(() => {
                if (this.id_luot_phat === id_luot && this.dang_phat) this.phat_doan_api();
            }, 1000);
            return true;
        }

        const la_loi_quota = msg.includes('quota') || msg.includes('429')
            || msg.includes('401') || msg.includes('403')
            || msg.includes('unauthorized') || msg.includes('forbidden')
            || msg.includes('exceeded');

        if (la_loi_quota && this.cong_cu && this.cong_cu !== 'web' && DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
            try {
                chrome.storage.local.get('customEngines', (data) => {
                    try {
                        const engines = (data && data.customEngines) || [];
                        const engine = engines.find(e => e.id === this.cong_cu);
                        if (engine && !engine.isQuotaExceeded) {
                            engine.isQuotaExceeded = true;
                            if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                                chrome.storage.local.set({ customEngines: engines });
                            }
                        }
                    } catch (_) {}
                });
            } catch (_) {}
        } else {
            const la_loi_timeout = msg.includes('hết thời gian') || msg.includes('timeout') || msg.includes('render');
            if (la_loi_timeout || this.thay_nhanh_web !== 'off') {
                if (this.thay_nhanh_web === 'off') {
                    this._so_lan_thu_lai = (this._so_lan_thu_lai || 0) + 1;
                    if (this._so_lan_thu_lai <= 2) {
                        console.warn('[DocTruyenSTV] Lỗi API — sangtacviet.com, retry lần', this._so_lan_thu_lai);
                        setTimeout(() => {
                            if (this.id_luot_phat === id_luot && this.dang_phat) {
                                this.phat_doan_api();
                            }
                        }, 1000);
                        return true;
                    }
                }
                
                this._so_lan_thu_lai = 0;
                console.warn('[DocTruyenSTV] Lỗi API — dùng Web Speech cho đoạn này rồi quay lại FPT');
                
                const btn = document.getElementById('stv-btn-retry-web');
                if (btn) btn.remove();

                if (this.doi_tuong_am_thanh) {
                    this.doi_tuong_am_thanh.onended = null;
                    this.doi_tuong_am_thanh.pause();
                    this.doi_tuong_am_thanh.src = '';
                }
                this._xoa_blob_cu();
                this._phat_mot_doan_web_roi_quay_lai_fpt(id_luot);
                return true;
            }
        }
        this._so_lan_thu_lai = 0;

        if (this.doi_tuong_am_thanh) {
            this.doi_tuong_am_thanh.onended = null;
            this.doi_tuong_am_thanh.pause();
            this.doi_tuong_am_thanh.src = '';
            this.doi_tuong_am_thanh = null;
        }
        this._xoa_blob_cu();

        this.cong_cu = 'web';
        DocTruyenSTV_Ext.GiaoDienSTV.hien_thi_thong_bao(
            la_loi_quota ? 'Hết lượt API — tạm chuyển sang Web Speech'
                : 'Lỗi tải API — tạm chuyển sang Web Speech'
        );
        this.phat_doan_web();
        return true;
    },

    _phat_mot_doan_web_roi_quay_lai_fpt(id_luot) {
        if (this.id_luot_phat !== id_luot || !this.dang_phat) return;
        const doan = this.cac_doan[this.chi_so_hien_tai];
        if (!doan) return;

        this.huy_am_thanh_web();
        this.dang_tai = false;
        this.dang_phat_tam_web = true;
        this.phat_tin_nhan_trang_thai();
        const u = new SpeechSynthesisUtterance(doan.text);
        u.lang = 'vi-VN';
        u.rate = this.toc_do;
        u.pitch = 1.0;
        u.volume = Math.min(this.am_luong, 1.0);
        const ds_giong = window.speechSynthesis.getVoices();
        const co_giong_tieng_viet = ds_giong.some(v => v.lang && v.lang.startsWith('vi'));
        if (ds_giong.length > 0 && !co_giong_tieng_viet && !this._da_canh_bao_thieu_giong) {
            this._da_canh_bao_thieu_giong = true;
            DocTruyenSTV_Ext.GiaoDienSTV.hien_thi_thong_bao('Chưa phát hiện gói giọng đọc tiếng Việt trên máy/trình duyệt. Khuyên dùng API FPT hoặc Azure.');
        }

        const giong = this.lay_giong_web_hieu_qua(ds_giong);
        if (giong) u.voice = giong;

        const ket_thuc_tam_web = () => {
            this.huy_am_thanh_web();
            this.dang_phat_tam_web = false;
            this.phat_tin_nhan_trang_thai();
            if (this.id_luot_phat !== id_luot || !this.dang_phat) return;
            this.chi_so_hien_tai++;
            const nghi_xuong_dong = Math.max(50, Number(this.thoi_gian_nghi_xuong_dong !== undefined ? this.thoi_gian_nghi_xuong_dong : (this.thoi_gian_nghi || 1200)));
            setTimeout(() => {
                if (this.id_luot_phat === id_luot && this.dang_phat) this.phat_doan_api();
            }, nghi_xuong_dong);
        };

        u.onend = ket_thuc_tam_web;
        u.onerror = (e) => {
            if (e.error === 'canceled' || e.error === 'interrupted') return;
            ket_thuc_tam_web();
        };

        this.dong_ho_giam_sat = setTimeout(() => {
            if (this.id_luot_phat === id_luot) ket_thuc_tam_web();
        }, Math.max(15000, doan.text.length * 200));

        window.speechSynthesis.speak(u);
        this.phat_ngon_hien_tai = u;
    },

    _xoa_blob_cu() {
        if (this.duong_dan_bo_nho_dem) {
            URL.revokeObjectURL(this.duong_dan_bo_nho_dem);
            this.duong_dan_bo_nho_dem = null;
        }
    },

    _dam_bao_audio_el() {
        if (!this.doi_tuong_am_thanh) {
            const { bo_nguon, bo_chinh_am } = DocTruyenSTV_Ext.QuanLyDongCoAmThanh.lay_nguon();
            this.doi_tuong_am_thanh = new Audio();
            this._nguon_phat_media = bo_nguon.createMediaElementSource(this.doi_tuong_am_thanh);
            this._nguon_phat_media.connect(bo_chinh_am);
        }
        return this.doi_tuong_am_thanh;
    },

    _dam_bao_tai_truoc(id_luot, hien_tai_doan, hien_tai_cau, so_luong) {
        if (this.id_luot_phat !== id_luot || !this.dang_phat) return;
        if (!this.hang_doi_tai_truoc) this.hang_doi_tai_truoc = [];
        
        this.hang_doi_tai_truoc = this.hang_doi_tai_truoc.filter(p => p.id_luot === id_luot);
        
        let duyet_doan = hien_tai_doan;
        let duyet_cau = hien_tai_cau;
        let cac_cau_hien_tai = DocTruyenSTV_Ext.PhanTichSTV.chia_cau_nho(this.cac_doan[duyet_doan].text, 500);
        
        while (this.hang_doi_tai_truoc.length < so_luong) {
            duyet_cau++;
            if (duyet_cau >= cac_cau_hien_tai.length) {
                duyet_doan++;
                while (duyet_doan < this.cac_doan.length && !this.cac_doan[duyet_doan].text) {
                    duyet_doan++;
                }
                if (duyet_doan >= this.cac_doan.length) break;
                cac_cau_hien_tai = DocTruyenSTV_Ext.PhanTichSTV.chia_cau_nho(this.cac_doan[duyet_doan].text, 500);
                duyet_cau = 0;
            }
            if (duyet_cau >= cac_cau_hien_tai.length) continue;
            
            const chuoi = cac_cau_hien_tai[duyet_cau];
            const da_co = this.hang_doi_tai_truoc.find(p => (p.chi_so_doan === duyet_doan || p.doanIndex === duyet_doan) && (p.chi_so_cau === duyet_cau || p.cauIndex === duyet_cau));
            if (!da_co) {
                const khoa = DocTruyenSTV_Ext.PhanTichSTV.tao_khoa_luu_tru(chuoi, this.cong_cu, this.chi_so_giong, this.toc_do);
                const tien_trinh = this.tai_am_thanh_truc_tiep(chuoi, khoa).catch(e => ({ error: e }));
                this.hang_doi_tai_truoc.push({
                    doanIndex: duyet_doan,
                    chi_so_doan: duyet_doan,
                    cauIndex: duyet_cau,
                    chi_so_cau: duyet_cau,
                    id_luot: id_luot,
                    text: chuoi,
                    van_ban: chuoi,
                    promise: tien_trinh,
                    tien_trinh_tai: tien_trinh
                });
            }
        }
    },

    async phat_doan_api() {
        while (this.chi_so_hien_tai < this.cac_doan.length && !this.cac_doan[this.chi_so_hien_tai].text) {
            this.chi_so_hien_tai++;
        }

        if (!this.dang_phat || this.chi_so_hien_tai >= this.cac_doan.length) {
            if (this.chi_so_hien_tai >= this.cac_doan.length && this.tu_dong_chuyen_chuong && this.dang_phat)
                this.phat_chuong_tiep_theo();
            else
                this.dung_phat();
            return;
        }

        const doan = this.cac_doan[this.chi_so_hien_tai];
        DocTruyenSTV_Ext.GiaoDienSTV.boi_den_doan(this.chi_so_hien_tai, this.cac_doan, this.dang_phat, this.dang_tam_dung);
        const id_luot = this.id_luot_phat;

        const nut_cu = document.getElementById('stv-btn-retry-web');
        if (nut_cu) nut_cu.remove();
        this._hien_thi_nut_chuyen_web_tam_thoi(id_luot);

        const cac_cau = DocTruyenSTV_Ext.PhanTichSTV.chia_cau_nho(doan.text, 500);

        for (let i = 0; i < cac_cau.length; i++) {
            if (this.id_luot_phat !== id_luot || !this.dang_phat) return;

            const chuoi = cac_cau[i];
            const khoa = DocTruyenSTV_Ext.PhanTichSTV.tao_khoa_luu_tru(chuoi, this.cong_cu, this.chi_so_giong, this.toc_do);

            this._dam_bao_tai_truoc(id_luot, this.chi_so_hien_tai, i, 2);

            let blob;
            try {
                let tien_trinh_tai;
                if (!this.hang_doi_tai_truoc) this.hang_doi_tai_truoc = [];
                const chi_so_hang_doi = this.hang_doi_tai_truoc.findIndex(p => (p.chi_so_doan === this.chi_so_hien_tai || p.doanIndex === this.chi_so_hien_tai) && (p.chi_so_cau === i || p.cauIndex === i) && p.id_luot === id_luot);
                if (chi_so_hang_doi !== -1) {
                    tien_trinh_tai = this.hang_doi_tai_truoc[chi_so_hang_doi].tien_trinh_tai || this.hang_doi_tai_truoc[chi_so_hang_doi].promise;
                    this.hang_doi_tai_truoc.splice(chi_so_hang_doi, 1);
                } else {
                    tien_trinh_tai = this.tai_am_thanh_truc_tiep(chuoi, khoa);
                }

                let _dong_ho_tai = setTimeout(() => {
                    if (this.id_luot_phat === id_luot && this.dang_phat) {
                        this.dang_tai = true;
                        this.phat_tin_nhan_trang_thai();
                    }
                }, 100);

                blob = await tien_trinh_tai;
                clearTimeout(_dong_ho_tai);
                
                if (blob && blob.error) throw blob.error;
            } catch (l) {
                const msg = (l.message || '').toLowerCase();
                const la_loi_quota = msg.includes('quota') || msg.includes('429') || msg.includes('401') || msg.includes('403') || msg.includes('unauthorized') || msg.includes('forbidden') || msg.includes('exceeded');
                const la_loi_kenh = msg.includes('message channel') || msg.includes('receiving end does not exist') || msg.includes('could not establish connection') || msg.includes('extension context');
                
                if (la_loi_quota || la_loi_kenh) {
                    this._xu_ly_loi_api(l, id_luot);
                    return;
                }

                const la_loi_timeout = msg.includes('hết thời gian') || msg.includes('timeout') || msg.includes('render');
                if (la_loi_timeout || this.thay_nhanh_web !== 'off') {
                    if (this.thay_nhanh_web === 'off') {
                        this._xu_ly_loi_api(l, id_luot);
                        return;
                    }
                    
                    console.warn(`[DocTruyenSTV] Lỗi nạp câu (đoạn ${this.chi_so_hien_tai}, câu ${i}) — dùng Web Speech thay thế:`, msg);
                    this.dang_tai = false;
                    this.dang_phat_tam_web = true;
                    this.phat_tin_nhan_trang_thai();
                    
                    await new Promise((dong_y) => {
                        const u = new SpeechSynthesisUtterance(chuoi);
                        u.lang = 'vi-VN';
                        u.rate = this.toc_do;
                        u.pitch = 1.0;
                        u.volume = Math.min(this.am_luong, 1.0);
                        const ds_giong = window.speechSynthesis.getVoices();
                        const giong = this.lay_giong_web_hieu_qua(ds_giong);
                        if (giong) u.voice = giong;
                        
                        let da_giai_quyet = false;
                        const ket_thuc_cau = () => { if (!da_giai_quyet) { da_giai_quyet = true; dong_y(); } };
                        u.onend = ket_thuc_cau;
                        u.onerror = ket_thuc_cau;
                        window.speechSynthesis.speak(u);
                        
                        const kiem_tra_huy = setInterval(() => {
                            if (this.id_luot_phat !== id_luot || !this.dang_phat) {
                                clearInterval(kiem_tra_huy);
                                window.speechSynthesis.cancel();
                                ket_thuc_cau();
                            }
                        }, 200);
                        
                        const xu_ly_onend_goc = u.onend;
                        u.onend = () => { clearInterval(kiem_tra_huy); xu_ly_onend_goc(); };
                        const xu_ly_onerror_goc = u.onerror;
                        u.onerror = () => { clearInterval(kiem_tra_huy); xu_ly_onerror_goc(); };
                    });
                    
                    this.dang_phat_tam_web = false;
                    this.phat_tin_nhan_trang_thai();
                    
                    if (this.id_luot_phat !== id_luot || !this.dang_phat) return;
                    if (i < cac_cau.length - 1) {
                        const nghi = chuoi.trim().endsWith(',') 
                            ? (this.thoi_gian_nghi_phay !== undefined ? this.thoi_gian_nghi_phay : 300)
                            : (this.thoi_gian_nghi_cham !== undefined ? this.thoi_gian_nghi_cham : (this.thoi_gian_nghi || 800));
                        if (nghi > 0) {
                            await new Promise(r => setTimeout(r, nghi));
                            if (this.id_luot_phat !== id_luot || !this.dang_phat) return;
                        }
                    }
                    continue;
                } else {
                    this._xu_ly_loi_api(l, id_luot);
                    return;
                }
            }

            if (this.id_luot_phat !== id_luot || !this.dang_phat) return;

            this.dang_tai = false;
            this.phat_tin_nhan_trang_thai();

            this._xoa_blob_cu();
            this.duong_dan_bo_nho_dem = URL.createObjectURL(blob);

            const { bo_chinh_am } = DocTruyenSTV_Ext.QuanLyDongCoAmThanh.lay_nguon();
            bo_chinh_am.gain.value = this.am_luong;

            const audio = this._dam_bao_audio_el();
            audio.onended = null;
            audio.pause();
            audio.src = this.duong_dan_bo_nho_dem;
            audio.volume = Math.min(this.am_luong, 1.0);
            audio.playbackRate = this.toc_do;

            await new Promise((dong_y) => {
                const guard = id_luot;
                audio.onended = () => {
                    audio.onended = null;
                    dong_y();
                };
                audio.onerror = () => {
                    audio.onended = null;
                    dong_y();
                };
                audio.play().then(() => {
                    if (this.dang_tam_dung) audio.pause();
                }).catch(() => dong_y());

                const _kiem_tra = setInterval(() => {
                    if (this.id_luot_phat !== guard) {
                        clearInterval(_kiem_tra);
                        audio.onended = null;
                        dong_y();
                    }
                }, 100);
                audio._dong_ho_bao_ve = _kiem_tra;
            });

            if (audio._dong_ho_bao_ve) { clearInterval(audio._dong_ho_bao_ve); audio._dong_ho_bao_ve = null; }
            if (this.id_luot_phat !== id_luot || !this.dang_phat) return;

            if (i < cac_cau.length - 1) {
                const nghi = chuoi.trim().endsWith(',') 
                    ? (this.thoi_gian_nghi_phay !== undefined ? this.thoi_gian_nghi_phay : 300)
                    : (this.thoi_gian_nghi_cham !== undefined ? this.thoi_gian_nghi_cham : (this.thoi_gian_nghi || 800));
                if (nghi > 0) {
                    await new Promise(r => setTimeout(r, nghi));
                    if (this.id_luot_phat !== id_luot || !this.dang_phat) return;
                }
            }
        }

        this.chi_so_hien_tai++;
        const nghi_xuong_dong = Math.max(50, Number(this.thoi_gian_nghi_xuong_dong !== undefined ? this.thoi_gian_nghi_xuong_dong : (this.thoi_gian_nghi || 1200)));
        setTimeout(() => this.phat_doan_api(), nghi_xuong_dong);
    },

    luu_trang_thai_chong_doi() {
        if (this.dong_ho_luu_trang_thai) clearTimeout(this.dong_ho_luu_trang_thai);
        this.dong_ho_luu_trang_thai = setTimeout(async () => {
            let the_ten_truyen = null;
            document.querySelectorAll('#booknameholder, #book_name2').forEach(el => {
                if ((el.innerText || el.textContent).trim().length > 0) the_ten_truyen = el;
            });
            const ten = the_ten_truyen ? (the_ten_truyen.innerText || the_ten_truyen.textContent).trim() : '';

            let the_ten_chuong = null;
            document.querySelectorAll('#bookchapnameholder').forEach(el => {
                if ((el.innerText || el.textContent).trim().length > 0) the_ten_chuong = el;
            });
            const chuong = the_ten_chuong ? (the_ten_chuong.innerText || the_ten_chuong.textContent).trim() : '';
            if (!ten) return;

            const trang_thai = {
                dangPhat: this.dang_phat,
                dang_phat: this.dang_phat,
                dangTamDung: this.dang_tam_dung,
                dang_tam_dung: this.dang_tam_dung,
                congCu: this.cong_cu,
                cong_cu: this.cong_cu,
                tienDoHienTai: this.chi_so_hien_tai + 1,
                tien_do_hien_tai: this.chi_so_hien_tai + 1,
                tongSoDoan: this.cac_doan.length,
                tong_so_doan: this.cac_doan.length,
                chiSoTuyetDoi: this.lay_chi_so_toan_cuc() + 1,
                chi_so_tuyet_doi: this.lay_chi_so_toan_cuc() + 1,
                tenTruyen: ten,
                ten_truyen: ten,
                tenChuong: chuong,
                ten_chuong: chuong,
                duongDanTrang: window.location.href,
                duong_dan_trang: window.location.href
            };

            DocTruyenSTV_Ext.LuuTruSTV.luu_tien_trinh_doc(trang_thai).catch(e => console.log('Không thể lưu tiến trình:', e.message));
        }, 5000);
    }
};

DocTruyenSTV_Ext.PhanTichSTV = {
    lam_tranh_van_ban(van_ban) {
        if (!van_ban) return '';
        try {
            let txt = van_ban
                .replace(/Đang tải nội dung chương\.\.\./gi, '')
                .replace(/@Bạn đang đọc bản lưu.*/gi, '')
                .replace(/@Thực hiện bởi Sáng Tác Việt.*/gi, '')
                .replace(/Đọc trên (web|sangtacviet\.com) để có chất lượng dịch cao và ủng hộ website\./gi,
                    'Đọc trên Sáng Tác Việt Chấm Cơm để có chất lượng dịch cao và ủng hộ website.')
                .replace(/[\u200B-\u200D\uFEFF]/g, '')
                .replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            const tu_dien = DocTruyenSTV_Ext.LuuTruSTV?.tu_dien_da_bien_dich || [];
            for (const quy_tac of tu_dien) {
                try {
                    const thay = (quy_tac && quy_tac.thay_the !== undefined) ? quy_tac.thay_the : (quy_tac ? quy_tac.thayThe : undefined);
                    if (quy_tac && quy_tac.regex && thay !== undefined) {
                        txt = txt.replace(quy_tac.regex, thay);
                    }
                } catch (e) {}
            }
            return txt;
        } catch (err) {
            return String(van_ban || '').trim();
        }
    },

    kiem_tra_ma_hoa() {
        const cac_khung = document.querySelectorAll('.contentbox');
        let bi_ma_hoa = false;
        for (let khung of cac_khung) {
            if (/[\uE000-\uF8FF]/.test(khung.textContent)) { bi_ma_hoa = true; break; }
        }

        if (bi_ma_hoa && !document.getElementById('stv-canhbao-mahoa')) {
            let canh_bao = document.createElement('div');
            canh_bao.id = 'stv-canhbao-mahoa';
            canh_bao.style.cssText = "background: #ff4d4f; color: white; padding: 10px; text-align: center; font-weight: bold;";
            canh_bao.innerText = "Cảnh báo: Chương này bị mã hóa Font! Máy sẽ không đọc chuẩn được.";
            if (cac_khung[0]) cac_khung[0].parentNode.insertBefore(canh_bao, cac_khung[0]);
        }
        return bi_ma_hoa;
    },

    // Tìm khung nội dung hợp lệ (có chứa chữ thực sự, bỏ qua khung đang tải)
    tim_khung_noi_dung_hien_tai() {
        // 1. Kiểm tra theo ID chương trên URL nếu có (ví dụ: .../936098298/)
        const p = window.location.pathname.split('/').filter(Boolean);
        const cid_hien_tai = p.length >= 4 ? p[p.length - 1] : null;
        if (cid_hien_tai && /^\d+$/.test(cid_hien_tai)) {
            const khung_theo_cid = document.querySelector(`.contentbox[cid="${cid_hien_tai}"], .contentbox[id*="${cid_hien_tai}"]`);
            if (khung_theo_cid) {
                const van_ban_khung = khung_theo_cid.innerText || '';
                const co_chunk = khung_theo_cid.querySelectorAll('.tts-chunk').length > 1;
                const dang_tai = van_ban_khung.includes('Đang tải nội dung') || van_ban_khung.includes('Đang tải...');
                const chuoi_tho = this.lam_tranh_van_ban(van_ban_khung);
                if ((co_chunk || chuoi_tho.length > 50) && !dang_tai) {
                    return khung_theo_cid;
                }
            }
        }

        // 2. Tìm trong #content-container hoặc toàn trang các khung có nội dung thực
        const cac_khung = document.querySelectorAll('#content-container .contentbox, .contentbox');
        for (const khung of cac_khung) {
            const van_ban_khung = khung.innerText || '';
            const dang_tai = van_ban_khung.includes('Đang tải nội dung') || van_ban_khung.includes('Đang tải...');
            if (dang_tai) continue; // Bỏ qua khung đang tải nội dung
            const co_chunk = khung.querySelectorAll('.tts-chunk').length > 1;
            const chuoi_tho = this.lam_tranh_van_ban(van_ban_khung);
            if (co_chunk || chuoi_tho.length > 50) {
                return khung;
            }
        }
        return null;
    },

    chuan_bi_noi_dung_the() {
        DocTruyenSTV_Ext.GiaoDienSTV.them_phong_cach();
        let danh_sach_the = [];
        let id_dem_the = 0;

        const them_the = (the_node, chuoi, thuoc_tinh_them = {}) => {
            chuoi = this.lam_tranh_van_ban(chuoi);
            if (chuoi.length > 0) {
                if (!the_node.id) {
                    the_node.id = `tts-chunk-t-${id_dem_the}`;
                    id_dem_the++;
                }
                the_node.classList.add('tts-chunk');
                danh_sach_the.push({ id: the_node.id, text: chuoi, el: the_node, ...thuoc_tinh_them });
            }
        };

        let the_ten_truyen = null;
        document.querySelectorAll('#booknameholder, #book_name2').forEach(el => {
            if ((el.innerText || el.textContent).trim().length > 0) the_ten_truyen = el;
        });
        if (the_ten_truyen) them_the(the_ten_truyen, the_ten_truyen.innerText || the_ten_truyen.textContent, { isTenTruyen: true, la_ten_truyen: true });

        let the_ten_chuong = null;
        document.querySelectorAll('#bookchapnameholder').forEach(el => {
            if ((el.innerText || el.textContent).trim().length > 0) the_ten_chuong = el;
        });
        if (the_ten_chuong) them_the(the_ten_chuong, the_ten_chuong.innerText || the_ten_chuong.textContent, { isTenChuong: true, la_ten_chuong: true });

        const boc_cac_the = (khung_chua) => {
            let the_span_hien_tai = null;
            const cac_node = Array.from(khung_chua.childNodes);
            cac_node.forEach(node => {
                if (['BR', 'DIV', 'P', 'H1', 'H2', 'H3', 'HR', 'TABLE', 'UL', 'LI'].includes(node.nodeName)) {
                    the_span_hien_tai = null;
                    if (node.nodeType === 1 && !['BR', 'HR'].includes(node.nodeName)) {
                        boc_cac_the(node);
                    }
                } else {
                    if (['SCRIPT', 'STYLE'].includes(node.nodeName)) return;
                    if (node.nodeType === 1 && (node.id === 'bookchapnameholder' || node.id === 'booknameholder' || node.id === 'book_name2')) return;
                    if (node.nodeType === 3 && !node.textContent.replace(/\u200B/g, '').trim()) {
                        if (the_span_hien_tai) the_span_hien_tai.appendChild(node);
                        return;
                    }
                    if (!the_span_hien_tai) {
                        the_span_hien_tai = document.createElement('span');
                        the_span_hien_tai.className = 'tts-chunk';
                        the_span_hien_tai.id = `tts-c-${id_dem_the}`;
                        id_dem_the++;
                        khung_chua.insertBefore(the_span_hien_tai, node);
                    }
                    the_span_hien_tai.appendChild(node);
                }
            });
        };

        // Ưu tiên khung nội dung thực sự có chữ của chương hiện tại
        const khung_uu_tien = this.tim_khung_noi_dung_hien_tai();
        let cac_khung_noi_dung = [];
        if (khung_uu_tien) {
            cac_khung_noi_dung = [khung_uu_tien];
        } else {
            const tat_ca = document.querySelectorAll('#content-container .contentbox, .contentbox');
            tat_ca.forEach(khung => {
                const van_ban_khung = khung.innerText || '';
                if (van_ban_khung.includes('Đang tải nội dung') || van_ban_khung.includes('Đang tải...')) return;
                const co_chunk = khung.querySelectorAll('.tts-chunk').length > 1;
                const chuoi_tho = this.lam_tranh_van_ban(van_ban_khung);
                if (co_chunk || chuoi_tho.length > 50) cac_khung_noi_dung.push(khung);
            });
        }

        cac_khung_noi_dung.forEach(khung => {
            const van_ban_khung = khung.innerText || '';
            if (van_ban_khung && (van_ban_khung.includes('Đang tải nội dung') || van_ban_khung.includes('Đang tải...'))) return;

            const so_luong_chunk_tts = khung.querySelectorAll('.tts-chunk').length;
            const can_boc_lai = (!khung.dataset.extTtsDone || so_luong_chunk_tts <= 1) && so_luong_chunk_tts <= 1;
            if (can_boc_lai) {
                if (so_luong_chunk_tts > 0) {
                    khung.querySelectorAll('.tts-chunk').forEach(the_span => {
                        if (the_span.id === 'bookchapnameholder' || the_span.id === 'booknameholder' || the_span.id === 'book_name2') return;
                        const khoang_trang = document.createTextNode(' ');
                        the_span.parentNode.insertBefore(khoang_trang, the_span.nextSibling);
                        while (the_span.firstChild) the_span.parentNode.insertBefore(the_span.firstChild, the_span);
                        the_span.remove();
                    });
                }
                boc_cac_the(khung);
            }

            let dem_doan_khung = 0;
            khung.querySelectorAll('.tts-chunk').forEach(the_span => {
                if (the_span.id === 'bookchapnameholder' || the_span.id === 'booknameholder' || the_span.id === 'book_name2') return;
                let txt = this.lam_tranh_van_ban(the_span.innerText || the_span.textContent || '');
                if (txt.length > 2) {
                    danh_sach_the.push({ id: the_span.id, text: txt, el: the_span });
                    dem_doan_khung++;
                }
            });

            if (dem_doan_khung > 1) {
                khung.dataset.extTtsDone = 'true';
                khung.dataset.ttsPrepared = 'true';
            }
        });

        return danh_sach_the;
    },

    chia_cau_nho(van_ban, do_dai_toi_da = 500) {
        const txt = van_ban.replace(/\s+/g, ' ').trim();
        if (txt.length <= do_dai_toi_da) return [txt];

        const ket_qua = [];
        const cac_manh_chinh = txt.split(/(?<=[.!?。…]+["']?)\s+/);
        for (const manh of cac_manh_chinh) {
            if (!manh.trim()) continue;
            if (manh.length <= do_dai_toi_da) {
                ket_qua.push(manh.trim());
            } else {
                let con = manh.trim();
                while (con.length > do_dai_toi_da) {
                    let cut = con.lastIndexOf(',', do_dai_toi_da);
                    if (cut <= 0) cut = con.lastIndexOf(' ', do_dai_toi_da);
                    if (cut <= 0) cut = do_dai_toi_da;
                    
                    let piece = con.slice(0, cut + (con[cut] === ',' ? 1 : 0)).trim();
                    if (piece) ket_qua.push(piece);
                    con = con.slice(cut + (con[cut] === ',' ? 1 : 0)).trim();
                }
                if (con) ket_qua.push(con);
            }
        }
        return ket_qua.filter(c => c.length > 0);
    },

    chia_doan_van_ban(van_ban, do_dai_toi_da) {
        const cac_doan = [];
        const cac_cau = van_ban.split(/(?<=[.!?。…]+["']?)\s+/);
        let hien_tai = '';

        for (const cau of cac_cau) {
            if (!cau.trim()) continue;
            if ((hien_tai + ' ' + cau).trim().length <= do_dai_toi_da) {
                hien_tai = (hien_tai + ' ' + cau).trim();
            } else {
                if (hien_tai) cac_doan.push(hien_tai);
                if (cau.length > do_dai_toi_da) {
                    const cac_pha = cau.split(/(?<=[,;:])\s+/);
                    let pha_hien_tai = '';
                    for (const pha of cac_pha) {
                        if ((pha_hien_tai + ' ' + pha).trim().length <= do_dai_toi_da) {
                            pha_hien_tai = (pha_hien_tai + ' ' + pha).trim();
                        } else {
                            if (pha_hien_tai) cac_doan.push(pha_hien_tai);
                            pha_hien_tai = '';
                            let phan_con_lai = pha;
                            while (phan_con_lai.length > do_dai_toi_da) {
                                let diem_cat = phan_con_lai.lastIndexOf(' ', do_dai_toi_da);
                                if (diem_cat <= 0) diem_cat = do_dai_toi_da;
                                cac_doan.push(phan_con_lai.slice(0, diem_cat));
                                phan_con_lai = phan_con_lai.slice(diem_cat).trim();
                            }
                            if (phan_con_lai) cac_doan.push(phan_con_lai);
                        }
                    }
                    if (pha_hien_tai) cac_doan.push(pha_hien_tai);
                } else {
                    hien_tai = cau.trim();
                }
            }
        }
        if (hien_tai) cac_doan.push(hien_tai);
        const ket_qua = cac_doan.filter(c => c.trim().length > 0);
        return ket_qua.length > 0 ? ket_qua : [van_ban];
    },

    tao_danh_sach_phat(danh_sach_the, do_dai_toi_da) {
        let danh_sach_cuoi = [];
        for (const the of danh_sach_the) {
            const cac_van_ban = this.chia_doan_van_ban(the.text, do_dai_toi_da);
            for (const chuoi of cac_van_ban) {
                danh_sach_cuoi.push({ text: chuoi, el: the.el });
            }
        }
        return danh_sach_cuoi;
    },

    tao_khoa_luu_tru(van_ban, cong_cu, chi_so_giong, toc_do) {
        const tho = van_ban.replace(/\s+/g, '') + `_${cong_cu}_${chi_so_giong}_${toc_do}`;
        let bam1 = 5381, bam2 = 0;
        for (let i = 0; i < tho.length; i++) {
            bam1 = ((bam1 << 5) + bam1) ^ tho.charCodeAt(i);
            bam2 = ((bam2 * 31) + tho.charCodeAt(i)) | 0;
        }
        return (bam1 >>> 0).toString(36) + '_' + (bam2 >>> 0).toString(36) + '_' + tho.length;
    }
};

window.addEventListener('pagehide', () => {
    try {
        if (!DocTruyenSTV_Ext.la_ngu_canh_hop_le()) return;
        if (DocTruyenSTV_Ext.TrinhPhatAmThanh && DocTruyenSTV_Ext.TrinhPhatAmThanh.tab_id_cua_toi) {
            chrome.storage.local.get(['stv_tab_dang_phat'], du_lieu => {
                try {
                    if (du_lieu && du_lieu.stv_tab_dang_phat && du_lieu.stv_tab_dang_phat.tabId === DocTruyenSTV_Ext.TrinhPhatAmThanh.tab_id_cua_toi) {
                        if (DocTruyenSTV_Ext.la_ngu_canh_hop_le()) {
                            chrome.storage.local.remove('stv_tab_dang_phat');
                        }
                    }
                } catch (_) {}
            });
        }
    } catch (_) {}
});