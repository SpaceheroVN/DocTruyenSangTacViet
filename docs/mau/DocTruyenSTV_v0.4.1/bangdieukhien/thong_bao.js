// Thông báo GitHub, mở Lightbox hoặc modal popup
import { cau_hinh } from './quan_ly_cau_hinh.js';
import { giai_ma_bool } from '../chuyen_doi.js';

// === Hằng số thông báo ===
const DUONG_DAN_THONG_BAO_MOI = 'https://raw.githubusercontent.com/SpaceheroVN/DocTruyenSangTacViet/main/THONG_BAO.md';
const DUONG_DAN_TRANG_GITHUB_THONG_BAO = 'https://github.com/SpaceheroVN/DocTruyenSangTacViet/blob/main/THONG_BAO.md';

const KHOA_HIEN_CHUONG = 'hien_chuong_thong_bao';
const KHOA_MOC_DA_DOC = 'moc_thong_bao_da_doc';
const KHOA_CO_TIN_MOI_CACHE = 'co_tin_moi_thong_bao';
const KHOA_NOI_DUNG_CACHE = 'noi_dung_thong_bao_cache';
const KHOA_MOC_CACHE = 'moc_thong_bao_cache';
const THOI_GIAN_CHO_TAI_MS = 6000;

// Tiện ích giao diện từ hop_thoai_thong_bao.js
function lay_tien_ich_giao_dien() {
    return globalThis.DocTruyenSTV_ThongBaoUI || {};
}

// Tạo URL GitHub cho THONG_BAO.md theo phiên bản
function tao_duong_dan_thong_bao_phien_ban() {
    let phien_ban = '0.4.1';
    try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
            phien_ban = chrome.runtime.getManifest().version || phien_ban;
        }
    } catch (_) {}
    return `https://raw.githubusercontent.com/SpaceheroVN/DocTruyenSangTacViet/main/versions/DocTruyenSTV_v${phien_ban}/THONG_BAO.md`;
}

// Trích xuất mốc thời gian ở đầu file
export function trich_moc_cap_nhat(noi_dung) {
    const ui = lay_tien_ich_giao_dien();
    if (typeof ui.trich_moc_cap_nhat === 'function') {
        return ui.trich_moc_cap_nhat(noi_dung);
    }
    return '';
}

// Tạo mã nhận diện theo mốc hoặc nội dung
function lay_dau_nhan_dien(noi_dung, moc_thoi_gian) {
    const ui = lay_tien_ich_giao_dien();
    if (typeof ui.lay_dau_nhan_dien === 'function') {
        return ui.lay_dau_nhan_dien(noi_dung, moc_thoi_gian);
    }
    return moc_thoi_gian || String(noi_dung || '').trim().slice(0, 80);
}

// Tải văn bản qua HTTP GET không cache
async function tai_van_ban_url(duong_dan) {
    const bo_huy = new AbortController();
    const dong_ho_het_gio = setTimeout(() => bo_huy.abort(), THOI_GIAN_CHO_TAI_MS);
    try {
        const phan_hoi = await fetch(duong_dan, {
            cache: 'no-store',
            signal: bo_huy.signal
        });
        if (!phan_hoi.ok) {
            return { ok: false, status: phan_hoi.status, text: '' };
        }
        const van_ban = await phan_hoi.text();
        return { ok: true, status: phan_hoi.status, text: van_ban };
    } catch (_) {
        return { ok: false, status: 0, text: '' };
    } finally {
        clearTimeout(dong_ho_het_gio);
    }
}

// === Điều khiển thông báo popup ===
export const quan_ly_thong_bao = {
    luon_hien_chuong: true,
    co_tin_moi: false,
    noi_dung_hien_tai: '',
    moc_hien_tai: '',
    dang_tai: false,
    da_gan_su_kien: false,
    tien_trinh_tai: null,

    // Nạp trạng thái cache, gắn UI và kiểm tra ngầm
    khoi_tao() {
        const gia_tri_hien_chuong = cau_hinh.lay(KHOA_HIEN_CHUONG, true);
        // Mặc định bật nút chuông
        this.luon_hien_chuong = giai_ma_bool(gia_tri_hien_chuong, true);
        this.co_tin_moi = giai_ma_bool(cau_hinh.lay(KHOA_CO_TIN_MOI_CACHE, false), false);
        this.noi_dung_hien_tai = cau_hinh.lay(KHOA_NOI_DUNG_CACHE, false) || '';
        this.moc_hien_tai = cau_hinh.lay(KHOA_MOC_CACHE, false) || '';

        this.gan_su_kien();
        this.cap_nhat_giao_dien_chuong();
        this.kiem_tra_thong_bao_tu_github();
    },

    // Đặt lại mặc định khi xóa toàn bộ dữ liệu
    dat_lai_sau_khi_xoa() {
        this.luon_hien_chuong = true;
        this.co_tin_moi = false;
        this.noi_dung_hien_tai = '';
        this.moc_hien_tai = '';
        this.dong_hop_thoai();

        const cong_tac = document.getElementById('cong-tac-hien-chuong');
        if (cong_tac) cong_tac.checked = true;

        this.cap_nhat_giao_dien_chuong();
        return this.kiem_tra_thong_bao_tu_github(true);
    },

    // Tải song song 2 bản THONG_BAO.md để so sánh mốc
    async kiem_tra_thong_bao_tu_github(ep_tai_lai = false) {
        if (this.tien_trinh_tai && !ep_tai_lai) return this.tien_trinh_tai;

        const tac_vu = (async () => {
            this.dang_tai = true;
            try {
                const duong_dan_cu = tao_duong_dan_thong_bao_phien_ban();
                const [ket_qua_ngoai, ket_qua_trong] = await Promise.all([
                    tai_van_ban_url(DUONG_DAN_THONG_BAO_MOI),
                    tai_van_ban_url(duong_dan_cu)
                ]);

                if (!ket_qua_ngoai.ok || !ket_qua_ngoai.text.trim()) {
                    return;
                }

                const noi_dung_ngoai = ket_qua_ngoai.text;
                const moc_ngoai = trich_moc_cap_nhat(noi_dung_ngoai);
                const dau_ngoai = lay_dau_nhan_dien(noi_dung_ngoai, moc_ngoai);

                this.noi_dung_hien_tai = noi_dung_ngoai;
                this.moc_hien_tai = moc_ngoai;
                cau_hinh.dat(KHOA_NOI_DUNG_CACHE, noi_dung_ngoai, false, true);
                cau_hinh.dat(KHOA_MOC_CACHE, moc_ngoai, false, true);

                const dang_mo_hop_thoai = document.getElementById('hop-thoai-thong-bao')?.classList.contains('show');
                let khac_ban_version = false;
                if (ket_qua_trong.ok && ket_qua_trong.text.trim()) {
                    const moc_trong = trich_moc_cap_nhat(ket_qua_trong.text);
                    if (moc_ngoai && moc_trong) {
                        khac_ban_version = (moc_ngoai !== moc_trong);
                    } else {
                        khac_ban_version = (noi_dung_ngoai.trim() !== ket_qua_trong.text.trim());
                    }
                } else if (ket_qua_trong.status === 404) {
                    // Dự phòng nếu bản version chưa có file
                    khac_ban_version = true;
                } else {
                    // Mất mạng: giữ cache cũ, cập nhật modal nếu mở
                    if (dang_mo_hop_thoai) {
                        this.hien_thi_noi_dung_trong_modal();
                        this.danh_dau_da_doc();
                    }
                    return;
                }

                const dau_da_doc = cau_hinh.lay(KHOA_MOC_DA_DOC, false) || '';

                if (dang_mo_hop_thoai) {
                    this.hien_thi_noi_dung_trong_modal();
                    this.danh_dau_da_doc();
                } else {
                    this.co_tin_moi = Boolean(khac_ban_version && dau_da_doc !== dau_ngoai);
                    cau_hinh.dat(KHOA_CO_TIN_MOI_CACHE, this.co_tin_moi, false, true);
                    this.cap_nhat_giao_dien_chuong();
                }
            } finally {
                this.dang_tai = false;
                this.tien_trinh_tai = null;
                if (!this.noi_dung_hien_tai && document.getElementById('hop-thoai-thong-bao')?.classList.contains('show')) {
                    this.hien_thi_noi_dung_trong_modal();
                }
            }
        })();

        this.tien_trinh_tai = tac_vu;
        return tac_vu;
    },

    // Cập nhật nút chuông và chấm đỏ chân trang
    cap_nhat_giao_dien_chuong() {
        const nut_chuong = document.getElementById('nut-thong-bao');
        if (!nut_chuong) return;

        // Hiện nếu có tin mới hoặc đang bật chuông
        const can_hien = this.co_tin_moi || this.luon_hien_chuong;
        nut_chuong.style.display = can_hien ? 'flex' : 'none';
        nut_chuong.classList.toggle('co-tin-moi', Boolean(this.co_tin_moi));
        nut_chuong.title = this.co_tin_moi ? 'Có thông báo mới chưa đọc' : 'Xem thông báo';
    },

    // Đánh dấu đã đọc để tắt chấm đỏ
    danh_dau_da_doc() {
        if (this.noi_dung_hien_tai && this.noi_dung_hien_tai.trim()) {
            const dau_hien_tai = lay_dau_nhan_dien(this.noi_dung_hien_tai, this.moc_hien_tai);
            if (dau_hien_tai) {
                cau_hinh.dat(KHOA_MOC_DA_DOC, dau_hien_tai, false, true);
            }
        }
        this.co_tin_moi = false;
        cau_hinh.dat(KHOA_CO_TIN_MOI_CACHE, false, false, true);
        this.cap_nhat_giao_dien_chuong();
    },

    // === Nội dung và hộp thoại thông báo ===

    // Đổ Markdown hoặc trạng thái vào modal popup
    hien_thi_noi_dung_trong_modal() {
        const khung_noi_dung = document.getElementById('noi-dung-thong-bao');
        const nhan_cap_nhat = document.getElementById('nhan-cap-nhat-thong-bao');
        if (!khung_noi_dung) return;

        if (nhan_cap_nhat) {
            if (this.moc_hien_tai) {
                nhan_cap_nhat.textContent = `Cập nhật: ${this.moc_hien_tai}`;
                nhan_cap_nhat.style.display = 'inline-flex';
            } else {
                nhan_cap_nhat.textContent = '';
                nhan_cap_nhat.style.display = 'none';
            }
        }

        khung_noi_dung.textContent = '';
        if (this.noi_dung_hien_tai && this.noi_dung_hien_tai.trim()) {
            const hop_md = document.createElement('div');
            hop_md.className = 'noi-dung-markdown';
            const ui = lay_tien_ich_giao_dien();
            if (typeof ui.tao_noi_dung_markdown_dom === 'function') {
                hop_md.appendChild(ui.tao_noi_dung_markdown_dom(this.noi_dung_hien_tai));
            } else {
                hop_md.textContent = this.noi_dung_hien_tai;
            }
            khung_noi_dung.appendChild(hop_md);
        } else {
            const hop_tt = document.createElement('div');
            hop_tt.className = 'trang-thai-tai-thong-bao';
            if (this.dang_tai) {
                hop_tt.textContent = 'Đang tải thông báo từ GitHub...';
            } else {
                const p1 = document.createElement('p');
                p1.textContent = 'Hiện chưa thể tải thông báo từ GitHub.';
                const p2 = document.createElement('p');
                p2.appendChild(document.createTextNode('Vui lòng kiểm tra kết nối mạng hoặc xem trực tiếp tại '));
                const a = document.createElement('a');
                a.href = DUONG_DAN_TRANG_GITHUB_THONG_BAO;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.textContent = 'THONG_BAO.md trên GitHub';
                p2.appendChild(a);
                p2.appendChild(document.createTextNode('.'));
                hop_tt.appendChild(p1);
                hop_tt.appendChild(p2);
            }
            khung_noi_dung.appendChild(hop_tt);
        }
        khung_noi_dung.scrollTop = 0;
    },

    // Thử mở Lightbox giữa màn hình trên tab web
    async mo_lightbox_tren_tab_hien_tai(du_lieu_hien_thi) {
        try {
            if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.scripting || !chrome.tabs.query) {
                return false;
            }
            const [tab_hien_tai] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab_hien_tai || !tab_hien_tai.id || !tab_hien_tai.url || !/^https?:\/\//i.test(tab_hien_tai.url)) {
                return false;
            }

            await chrome.scripting.executeScript({
                target: { tabId: tab_hien_tai.id },
                files: ['noidung/hop_thoai_thong_bao.js']
            });
            await chrome.scripting.executeScript({
                target: { tabId: tab_hien_tai.id },
                func: (du_lieu) => {
                    if (globalThis.DocTruyenSTV_ThongBaoUI && typeof globalThis.DocTruyenSTV_ThongBaoUI.mo_lightbox_thong_bao === 'function') {
                        globalThis.DocTruyenSTV_ThongBaoUI.mo_lightbox_thong_bao(du_lieu);
                    }
                },
                args: [du_lieu_hien_thi]
            });
            return true;
        } catch (_) {
            return false;
        }
    },

    // Mở modal dự phòng khi tab không cho tiêm script
    mo_hop_thoai_du_phong() {
        const hop_thoai = document.getElementById('hop-thoai-thong-bao');
        if (!hop_thoai) return;

        const cong_tac = document.getElementById('cong-tac-hien-chuong');
        if (cong_tac) cong_tac.checked = this.luon_hien_chuong;

        document.documentElement.classList.add('dang-mo-thong-bao');
        document.body.classList.add('dang-mo-thong-bao');

        this.hien_thi_noi_dung_trong_modal();
        hop_thoai.classList.add('show');

        if (!this.noi_dung_hien_tai && !this.dang_tai) {
            this.kiem_tra_thong_bao_tu_github(true).then(() => {
                if (hop_thoai.classList.contains('show')) {
                    this.hien_thi_noi_dung_trong_modal();
                    if (this.noi_dung_hien_tai) this.danh_dau_da_doc();
                }
            });
            this.hien_thi_noi_dung_trong_modal();
        }
    },

    // Ưu tiên Lightbox ngoài trang, dự phòng modal popup
    async mo_hop_thoai() {
        // Tắt chấm đỏ ngay khi bấm xem
        if (this.co_tin_moi) {
            this.danh_dau_da_doc();
        }

        const du_lieu_hien_thi = {
            noi_dung_tho: this.noi_dung_hien_tai || '',
            moc_cap_nhat: this.moc_hien_tai || '',
            luon_hien_chuong: this.luon_hien_chuong,
            chu_de: document.documentElement.getAttribute('data-theme') || 'dark'
        };

        if (await this.mo_lightbox_tren_tab_hien_tai(du_lieu_hien_thi)) {
            setTimeout(() => window.close(), 80);
            return;
        }

        this.mo_hop_thoai_du_phong();
    },

    // Đóng modal popup và thu gọn khung
    dong_hop_thoai() {
        const hop_thoai = document.getElementById('hop-thoai-thong-bao');
        if (hop_thoai) hop_thoai.classList.remove('show');
        document.documentElement.classList.remove('dang-mo-thong-bao');
        document.body.classList.remove('dang-mo-thong-bao');
        this.cap_nhat_giao_dien_chuong();
    },

    // Gắn sự kiện nút chuông, đóng modal và công tắc
    gan_su_kien() {
        if (this.da_gan_su_kien) return;
        this.da_gan_su_kien = true;

        const nut_chuong = document.getElementById('nut-thong-bao');
        const hop_thoai = document.getElementById('hop-thoai-thong-bao');
        const nut_dong_x = document.getElementById('nut-dong-thong-bao-x');
        const nut_dong_chan = document.getElementById('nut-dong-thong-bao');
        const cong_tac = document.getElementById('cong-tac-hien-chuong');

        if (nut_chuong) {
            nut_chuong.addEventListener('click', () => this.mo_hop_thoai());
        }
        if (nut_dong_x) {
            nut_dong_x.addEventListener('click', () => this.dong_hop_thoai());
        }
        if (nut_dong_chan) {
            nut_dong_chan.addEventListener('click', () => this.dong_hop_thoai());
        }
        if (hop_thoai) {
            hop_thoai.addEventListener('click', (su_kien) => {
                if (su_kien.target === hop_thoai) this.dong_hop_thoai();
            });
        }
        if (cong_tac) {
            cong_tac.addEventListener('change', (su_kien) => {
                this.luon_hien_chuong = Boolean(su_kien.target.checked);
                cau_hinh.dat(KHOA_HIEN_CHUONG, this.luon_hien_chuong, true, true);
                this.cap_nhat_giao_dien_chuong();
            });
        }
        document.addEventListener('keydown', (su_kien) => {
            if (su_kien.key === 'Escape' && hop_thoai && hop_thoai.classList.contains('show')) {
                su_kien.preventDefault();
                this.dong_hop_thoai();
            }
        });
    }
};
