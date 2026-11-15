'use strict';

// Chuyển đổi, nén và đồng bộ lưu trữ DocTruyenSTV_v2

// === Danh mục khóa và hằng số ===

export const PHIEN_BAN_CHUAN = '0.4.1';

export const PHIEN_BAN_PHAN_BO_LUU_TRU = 5;

// Khóa đồng bộ storage.sync, trừ customDict
export const CAC_KHOA_DONG_BO_CHUAN = [
    'speed',
    'volume',
    'tudongchuyenchuong',
    'giao_dien_chu_de',
    'doctentruyen',
    'doctenchuong',
    'pauseComma',
    'pauseDot',
    'pausePara',
    'batphimtat',
    'customShortcuts',
    'customStopConfig',
    'stopAfterChapters',
    'stopTime',
    'stopRealtimeTarget',
    'maydoc',
    'voiceIndex',
    'voiceName',
    'thayNhanhWeb',
    'hien_chuong_thong_bao',
    'miniPlayerMode',
    'isMiniPlayerMinimized',
    'miniPlayerPos',
    'mpLeft',
    'mpBottom'
];

// Khóa chỉ lưu cục bộ, không đồng bộ sync
export const KHOA_CHI_CUC_BO = [
    'readingList',
    'customDict',
    'customEngines',
    'fpt_key',
    'azure_key',
    'azure_region',
    'gcp_key',
    'sleepTargetTimestamp',
    'last_active_state',
    'stv_tab_dang_phat',
    'moc_thong_bao_da_doc',
    'co_tin_moi_thong_bao',
    'noi_dung_thong_bao_cache',
    'moc_thong_bao_cache',
    'phien_ban_du_lieu',
    'phien_ban_phan_bo_luu_tru',
    'xem_truoc_v042',
    'can_xoa_cache_tts'
];

// Khóa hợp lệ của bộ nhớ cục bộ storage.local
export const CAC_KHOA_CUC_BO_CHUAN = [
    'readingList',
    'customDict',
    'customEngines',
    'fpt_key',
    'azure_key',
    'azure_region',
    'gcp_key',
    'moc_thong_bao_da_doc',
    'phien_ban_du_lieu',
    'phien_ban_phan_bo_luu_tru',
    'xem_truoc_v042',
    ...CAC_KHOA_DONG_BO_CHUAN
];

export const PHIM_TAT_MAC_DINH = {
    playPause: 'K',
    replay: 'R',
    prevChap: 'ArrowLeft',
    nextChap: 'ArrowRight',
    volUp: 'ArrowUp',
    volDown: 'ArrowDown',
    speedUp: ']',
    speedDown: '[',
    nextSeg: '.',
    prevSeg: ','
};

const QUY_TAC_MAC_DINH_SO = {
    speed: { mac_dinh: 1, nguyen: false },
    volume: { mac_dinh: 1, nguyen: false },
    pauseComma: { mac_dinh: 300, nguyen: true },
    pauseDot: { mac_dinh: 800, nguyen: true },
    pausePara: { mac_dinh: 1200, nguyen: true },
    voiceIndex: { mac_dinh: 0, nguyen: true }
};

const TAP_BOOL_MAC_DINH_BAT = new Set([
    'tudongchuyenchuong',
    'doctentruyen',
    'doctenchuong',
    'batphimtat',
    'hien_chuong_thong_bao'
]);

const TAP_BOOL_MAC_DINH_TAT = new Set([
    'isMiniPlayerMinimized',
    'co_tin_moi_thong_bao'
]);

const KHOA_XOA_NEU_RONG = new Set([
    'voiceName',
    'fpt_key',
    'azure_key',
    'azure_region',
    'gcp_key',
    'moc_thong_bao_cache',
    'moc_thong_bao_da_doc',
    'noi_dung_thong_bao_cache',
    'mpLeft',
    'mpBottom',
    'stopRealtimeTarget'
]);

// === Giải mã và nén khóa lưu trữ ===

export function giai_ma_bool(gia_tri, mac_dinh = false) {
    if (gia_tri === undefined || gia_tri === null) return mac_dinh;
    if (gia_tri === false || gia_tri === 0 || gia_tri === '0' || gia_tri === 'false') return false;
    return Boolean(gia_tri);
}

export function giai_ma_chu_de(gia_tri) {
    if (gia_tri === 'light' || gia_tri === 'sang' || gia_tri === 1 || gia_tri === '1') return 'light';
    if (gia_tri === 'dark' || gia_tri === 'toi' || gia_tri === 0 || gia_tri === '0') return 'dark';
    return null;
}

export function giai_ma_thay_nhanh_web(gia_tri) {
    if (gia_tri === 2 || gia_tri === '2' || gia_tri === 'extreme' || gia_tri === 'cuc_do') return 'extreme';
    if (gia_tri === 1 || gia_tri === '1' || gia_tri === true || gia_tri === 'true' || gia_tri === 'on' || gia_tri === 'bat') return 'on';
    return 'off';
}

export function giai_ma_che_do_mini_player(gia_tri) {
    return (gia_tri === 1 || gia_tri === '1' || gia_tri === 'chunk' || gia_tri === 'doan') ? 'chunk' : 'chapter';
}

export function giai_ma_phim_tat(gia_tri) {
    if (gia_tri && typeof gia_tri === 'object' && !Array.isArray(gia_tri)) {
        return { ...PHIM_TAT_MAC_DINH, ...gia_tri };
    }
    return { ...PHIM_TAT_MAC_DINH };
}

// Nén cờ 0/1 và bỏ giá trị mặc định khi lưu
export function nen_gia_tri_khoa(khoa, gia_tri) {
    if (gia_tri === undefined || gia_tri === null) return undefined;
    if (khoa === 'smartPauses') return undefined;

    if (QUY_TAC_MAC_DINH_SO[khoa]) {
        const quy_tac = QUY_TAC_MAC_DINH_SO[khoa];
        const so = quy_tac.nguyen ? parseInt(gia_tri, 10) : Number(gia_tri);
        if (!Number.isFinite(so) || so === quy_tac.mac_dinh) return undefined;
        return so;
    }

    if (TAP_BOOL_MAC_DINH_BAT.has(khoa)) {
        return giai_ma_bool(gia_tri, true) ? undefined : 0;
    }

    if (TAP_BOOL_MAC_DINH_TAT.has(khoa)) {
        return giai_ma_bool(gia_tri, false) ? 1 : undefined;
    }

    if (khoa === 'giao_dien_chu_de') {
        const cd = giai_ma_chu_de(gia_tri);
        return cd === 'light' ? 1 : (cd === 'dark' ? 0 : undefined);
    }

    if (khoa === 'thayNhanhWeb') {
        const tn = giai_ma_thay_nhanh_web(gia_tri);
        return tn === 'on' ? 1 : (tn === 'extreme' ? 2 : undefined);
    }

    if (khoa === 'miniPlayerMode') {
        return giai_ma_che_do_mini_player(gia_tri) === 'chunk' ? 1 : undefined;
    }

    if (khoa === 'maydoc') {
        const md = String(gia_tri || '').trim();
        return (!md || md === 'web' || md === 'auto') ? undefined : md;
    }

    if (khoa === 'customShortcuts') {
        if (!gia_tri || typeof gia_tri !== 'object' || Array.isArray(gia_tri)) return undefined;
        const da_sua = {};
        for (const [ten_phim, phim_mac_dinh] of Object.entries(PHIM_TAT_MAC_DINH)) {
            if (gia_tri[ten_phim] !== undefined && gia_tri[ten_phim] !== phim_mac_dinh) {
                da_sua[ten_phim] = gia_tri[ten_phim];
            }
        }
        return Object.keys(da_sua).length > 0 ? da_sua : undefined;
    }

    if (khoa === 'stopAfterChapters' || khoa === 'stopTime') {
        const so = Number(gia_tri);
        return (Number.isFinite(so) && so > 0) ? so : undefined;
    }

    if (khoa === 'xem_truoc_v042') {
        if (!gia_tri || typeof gia_tri !== 'object' || Array.isArray(gia_tri)) return undefined;
        return Object.keys(gia_tri).length > 0 ? gia_tri : undefined;
    }

    if (khoa === 'readingList' || khoa === 'customDict' || khoa === 'customEngines') {
        return (Array.isArray(gia_tri) && gia_tri.length > 0) ? gia_tri : undefined;
    }

    if (KHOA_XOA_NEU_RONG.has(khoa)) {
        return gia_tri ? gia_tri : undefined;
    }

    return gia_tri;
}

export function nen_tap_du_lieu(du_lieu_obj) {
    const du_lieu_ghi = {};
    const khoa_xoa = [];
    if (!du_lieu_obj || typeof du_lieu_obj !== 'object') {
        return { du_lieu_ghi, khoa_xoa };
    }
    for (const [khoa, gia_tri] of Object.entries(du_lieu_obj)) {
        const v_nen = nen_gia_tri_khoa(khoa, gia_tri);
        if (v_nen === undefined) {
            khoa_xoa.push(khoa);
        } else {
            du_lieu_ghi[khoa] = v_nen;
        }
    }
    return { du_lieu_ghi, khoa_xoa };
}

// === Chuẩn hóa truyện và động cơ ===

// So sánh hai chuỗi phiên bản semver
export function so_sanh_phien_ban(phien_ban_1, phien_ban_2) {
    if (!phien_ban_1 && !phien_ban_2) return 0;
    if (!phien_ban_1) return -1;
    if (!phien_ban_2) return 1;
    const phan_1 = String(phien_ban_1).split('.').map(n => parseInt(n, 10) || 0);
    const phan_2 = String(phien_ban_2).split('.').map(n => parseInt(n, 10) || 0);
    const do_dai = Math.max(phan_1.length, phan_2.length);
    for (let i = 0; i < do_dai; i++) {
        const so_1 = phan_1[i] || 0;
        const so_2 = phan_2[i] || 0;
        if (so_1 > so_2) return 1;
        if (so_1 < so_2) return -1;
    }
    return 0;
}

// Chuẩn hóa mục truyện sang cấu trúc nội bộ
export function chuan_hoa_muc_truyen(truyen_tho) {
    if (!truyen_tho || typeof truyen_tho !== 'object') return null;
    const tieu_de = String(truyen_tho.title || truyen_tho.ten_truyen || truyen_tho.tieu_de || '').trim();
    if (!tieu_de) return null;

    let thoi_gian_luu = truyen_tho.savedAt || truyen_tho.saved_at || truyen_tho.ngay_luu || null;
    let moc_thoi_gian = truyen_tho.timestamp || null;

    if (!moc_thoi_gian && thoi_gian_luu) {
        const d = new Date(thoi_gian_luu).getTime();
        if (!isNaN(d)) moc_thoi_gian = d;
    }
    if (!moc_thoi_gian) moc_thoi_gian = Date.now();
    if (!thoi_gian_luu) thoi_gian_luu = new Date(moc_thoi_gian).toISOString();

    let chi_so_doan = truyen_tho.chunkIndex !== undefined
        ? truyen_tho.chunkIndex
        : (truyen_tho.chunk_index !== undefined ? truyen_tho.chunk_index : (truyen_tho.doan_dang_doc !== undefined ? truyen_tho.doan_dang_doc : 0));
    if (chi_so_doan === null || isNaN(chi_so_doan) || chi_so_doan < 0) chi_so_doan = 0;

    let tong_so_doan = truyen_tho.chunkTotal !== undefined
        ? truyen_tho.chunkTotal
        : (truyen_tho.chunk_total !== undefined ? truyen_tho.chunk_total : (truyen_tho.tong_so_doan !== undefined ? truyen_tho.tong_so_doan : null));
    if (tong_so_doan !== null && (isNaN(tong_so_doan) || tong_so_doan < 0)) tong_so_doan = null;

    const ket_qua = {
        title: tieu_de,
        url: truyen_tho.url || truyen_tho.duong_dan || '',
        imgUrl: truyen_tho.imgUrl || truyen_tho.img_url || truyen_tho.anh_bia || '',
        chap: truyen_tho.chap || truyen_tho.ten_chuong || '',
        savedAt: thoi_gian_luu,
        timestamp: moc_thoi_gian,
        chunkIndex: chi_so_doan,
        chunkTotal: tong_so_doan
    };
    const tac_gia_tho = truyen_tho.author || truyen_tho.tac_gia;
    const tac_gia = typeof tac_gia_tho === 'string' ? tac_gia_tho.trim() : '';
    if (tac_gia) ket_qua.author = tac_gia;
    const thong_ke = truyen_tho.stats || truyen_tho.thong_ke;
    if (thong_ke && typeof thong_ke === 'object' && !Array.isArray(thong_ke)) {
        ket_qua.stats = { ...thong_ke };
    }
    return ket_qua;
}

// Chuẩn hóa toàn bộ danh sách truyện đọc
export function chuan_hoa_danh_sach_truyen(danh_sach_tho) {
    if (!Array.isArray(danh_sach_tho)) return [];
    const ket_qua = [];
    for (const item of danh_sach_tho) {
        const item_chuan = chuan_hoa_muc_truyen(item);
        if (item_chuan) ket_qua.push(item_chuan);
    }
    return ket_qua;
}

const DANH_SACH_LOAI_DONG_CO = [
    'fpt', 'azure', 'gcp', 'gemini', 'zalo', 'vnpt',
    'cartesia', 'elevenlabs', 'fish', 'viettel', 'vieneu'
];

// Chuẩn hóa động cơ TTS và gỡ bí danh cũ
export function chuan_hoa_dong_co_tuy_chinh(muc) {
    if (!muc || typeof muc !== 'object' || Array.isArray(muc)) return null;

    const ma = String(muc.id || muc.ma || '').trim();
    const ten = String(muc.name || muc.ten || '').trim();
    const url_chuan = String(muc.url || muc.endpoint || muc.duong_dan || '').trim();
    const khoa_api = String(muc.apiKey || muc.khoa_api || muc.key || '').trim();
    const ma_token = String(muc.ma_token || '').trim();
    const khoa_token = String(muc.khoa_token || '').trim();
    if (!ma && !ten && !url_chuan && !khoa_api && !ma_token && !khoa_token) return null;

    let loai = String(muc.type || muc.loai || '').trim().toLowerCase();
    if (!loai) {
        const loai_tu_ma = DANH_SACH_LOAI_DONG_CO.find((l) => ma.startsWith(`${l}_`));
        if (loai_tu_ma) loai = loai_tu_ma;
        else if (url_chuan || ma.startsWith('khac_') || ma.startsWith('custom_')) loai = 'custom';
    }

    const ket_qua = {};
    if (ma) ket_qua.id = ma;
    if (ten) ket_qua.name = ten;
    if (loai) ket_qua.type = loai;

    const la_dong_co_http = loai !== 'vieneu' && (
        loai === 'custom' || Boolean(url_chuan)
        || muc.mau_noi_dung !== undefined || muc.than_mau !== undefined || muc.bodyTemplate !== undefined
        || muc.duong_dan_am_thanh !== undefined || muc.duong_dan_phan_hoi !== undefined || muc.responsePath !== undefined || muc.audioPath !== undefined
    );

    if (la_dong_co_http) {
        ket_qua.url = url_chuan;
        const phuong_thuc = String(muc.method || muc.phuong_thuc || 'POST').trim().toUpperCase();
        ket_qua.method = phuong_thuc || 'POST';

        const tieu_de_tho = muc.headers !== undefined ? muc.headers : muc.tieu_de_http;
        if (tieu_de_tho && typeof tieu_de_tho === 'object' && !Array.isArray(tieu_de_tho)) {
            ket_qua.headers = Object.keys(tieu_de_tho).length > 0 ? JSON.stringify(tieu_de_tho) : '';
        } else {
            ket_qua.headers = typeof tieu_de_tho === 'string' ? tieu_de_tho.trim() : '';
        }

        const mau_tho = muc.mau_noi_dung !== undefined
            ? muc.mau_noi_dung
            : (muc.than_mau !== undefined ? muc.than_mau : muc.bodyTemplate);
        if (mau_tho && typeof mau_tho === 'object') {
            ket_qua.mau_noi_dung = JSON.stringify(mau_tho);
        } else {
            ket_qua.mau_noi_dung = (mau_tho !== undefined && mau_tho !== null) ? String(mau_tho) : '';
        }

        ket_qua.duong_dan_am_thanh = String(
            muc.duong_dan_am_thanh || muc.duong_dan_phan_hoi || muc.responsePath || muc.audioPath || ''
        ).trim();
    } else if (url_chuan) {
        ket_qua.url = url_chuan;
    }

    if (khoa_api) ket_qua.apiKey = khoa_api;
    if (ma_token) ket_qua.ma_token = ma_token;
    if (khoa_token) ket_qua.khoa_token = khoa_token;

    const ma_model = String(muc.ma_model || '').trim();
    if (ma_model) ket_qua.ma_model = ma_model;
    const ma_giong = String(muc.ma_giong || '').trim();
    if (ma_giong) ket_qua.ma_giong = ma_giong;

    if (Array.isArray(muc.voices) && muc.voices.length > 0) {
        ket_qua.voices = muc.voices.slice(0, 60).map((g) => {
            if (typeof g === 'string') return { id: g.trim(), ten: g.trim() };
            return { id: String(g.id || '').trim(), ten: String(g.ten || g.name || g.id || '').trim() };
        }).filter((g) => g.id);
    }

    const vung_tho = String(muc.region || muc.vung || '').trim();
    const vung = loai === 'azure' ? vung_tho.toLowerCase().replace(/\s+/g, '') : vung_tho;
    if (vung) ket_qua.region = vung;
    if (muc.isQuotaExceeded) ket_qua.isQuotaExceeded = true;

    return ket_qua;
}

// === Di trú dữ liệu giữa các phiên bản ===

function doc_gia_tri_uu_tien(nguon_chinh, nguon_phu, khoa) {
    if (nguon_chinh && nguon_chinh[khoa] !== undefined) return nguon_chinh[khoa];
    if (nguon_phu && nguon_phu[khoa] !== undefined) return nguon_phu[khoa];
    return undefined;
}

// Gom khóa xem trước v0.4.2 rời về đối tượng chung
function trich_xuat_xem_truoc_v042(nguon_chinh, nguon_phu) {
    const goc = doc_gia_tri_uu_tien(nguon_chinh, nguon_phu, 'xem_truoc_v042');
    const ket_qua = (goc && typeof goc === 'object' && !Array.isArray(goc)) ? { ...goc } : {};
    const khoa_xem_truoc = ['cai_dat_ten_mien', 'tu_dong_cuon_trang', 'tu_dong_vuot_captcha', 'mau_chu_doc', 'mau_nen_doc', 'do_mo_nen_doc'];
    for (const k of khoa_xem_truoc) {
        if (ket_qua[k] !== undefined) continue;
        const gt = doc_gia_tri_uu_tien(nguon_chinh, nguon_phu, k);
        if (gt !== undefined) ket_qua[k] = gt;
    }
    return Object.keys(ket_qua).length > 0 ? ket_qua : undefined;
}

function chuan_hoa_cai_dat_bo_sung(ket_qua, nguon_chinh, nguon_phu) {
    const gan_nen = (khoa, gia_tri_tho) => {
        const v_nen = nen_gia_tri_khoa(khoa, gia_tri_tho);
        if (v_nen !== undefined) ket_qua[khoa] = v_nen;
    };

    const khoa_bo_sung = [
        'maydoc',
        'voiceIndex',
        'voiceName',
        'thayNhanhWeb',
        'hien_chuong_thong_bao',
        'miniPlayerMode',
        'isMiniPlayerMinimized',
        'miniPlayerPos',
        'mpLeft',
        'mpBottom'
    ];
    for (const khoa of khoa_bo_sung) {
        gan_nen(khoa, doc_gia_tri_uu_tien(nguon_chinh, nguon_phu, khoa));
    }
}

// Chuyển đổi cấu hình sync 0.4.0 sang 0.4.1
export function chuyen_doi_dong_bo_040_sang_041(du_lieu_dong_bo_tho, du_lieu_cuc_bo_tho = {}) {
    const nguon = du_lieu_dong_bo_tho && typeof du_lieu_dong_bo_tho === 'object' ? du_lieu_dong_bo_tho : {};
    const nguon_bo_sung = du_lieu_cuc_bo_tho && typeof du_lieu_cuc_bo_tho === 'object' ? du_lieu_cuc_bo_tho : {};
    const ket_qua = {};

    const gan_nen = (khoa, gia_tri_tho) => {
        const v_nen = nen_gia_tri_khoa(khoa, gia_tri_tho);
        if (v_nen !== undefined) ket_qua[khoa] = v_nen;
    };

    const khoa_don = [
        'speed',
        'volume',
        'tudongchuyenchuong',
        'doctentruyen',
        'doctenchuong',
        'batphimtat',
        'giao_dien_chu_de',
        'customShortcuts',
        'customStopConfig',
        'stopAfterChapters',
        'stopTime',
        'stopRealtimeTarget'
    ];
    for (const khoa of khoa_don) {
        gan_nen(khoa, doc_gia_tri_uu_tien(nguon, nguon_bo_sung, khoa));
    }

    // Di trú khoảng nghỉ từ smartPauses bản 0.4.0
    const tho_phay = doc_gia_tri_uu_tien(nguon, nguon_bo_sung, 'pauseComma');
    const tho_cham = doc_gia_tri_uu_tien(nguon, nguon_bo_sung, 'pauseDot');
    const tho_doan = doc_gia_tri_uu_tien(nguon, nguon_bo_sung, 'pausePara');
    const tho_tm = doc_gia_tri_uu_tien(nguon, nguon_bo_sung, 'smartPauses');
    const gia_tri_phay = tho_phay !== undefined ? parseInt(tho_phay, 10) : undefined;
    const gia_tri_cham = tho_cham !== undefined ? parseInt(tho_cham, 10) : undefined;
    const gia_tri_doan = tho_doan !== undefined ? parseInt(tho_doan, 10) : undefined;
    const gia_tri_thong_minh = tho_tm !== undefined ? parseInt(tho_tm, 10) : undefined;

    if (gia_tri_phay !== undefined && !isNaN(gia_tri_phay)) {
        gan_nen('pauseComma', gia_tri_phay);
    } else if (gia_tri_thong_minh !== undefined && !isNaN(gia_tri_thong_minh) && gia_tri_thong_minh <= 500) {
        // Khôi phục dấu phẩy từ smartPauses
        gan_nen('pauseComma', gia_tri_thong_minh);
    }

    if (gia_tri_cham !== undefined && !isNaN(gia_tri_cham)) {
        gan_nen('pauseDot', gia_tri_cham);
    }

    if (gia_tri_doan !== undefined && !isNaN(gia_tri_doan)) {
        gan_nen('pausePara', gia_tri_doan);
    } else if (gia_tri_thong_minh !== undefined && !isNaN(gia_tri_thong_minh) && gia_tri_thong_minh > 500) {
        gan_nen('pausePara', gia_tri_thong_minh);
    }

    chuan_hoa_cai_dat_bo_sung(ket_qua, nguon, nguon_bo_sung);

    return ket_qua;
}

// Chuyển đổi dữ liệu cục bộ 0.4.0 sang 0.4.1
export function chuyen_doi_cuc_bo_040_sang_041(du_lieu_cuc_bo_tho, du_lieu_dong_bo_tho = {}) {
    const nguon = du_lieu_cuc_bo_tho && typeof du_lieu_cuc_bo_tho === 'object' ? du_lieu_cuc_bo_tho : {};
    const nguon_bo_sung = du_lieu_dong_bo_tho && typeof du_lieu_dong_bo_tho === 'object' ? du_lieu_dong_bo_tho : {};
    const ket_qua = {};

    // Chuẩn hóa danh sách truyện nếu không rỗng
    if (Array.isArray(nguon.readingList)) {
        const ds_chuan = chuan_hoa_danh_sach_truyen(nguon.readingList);
        if (ds_chuan.length > 0) ket_qua.readingList = ds_chuan;
    }

    // Lưu customDict vào local nếu không rỗng
    const tu_dien_tho = Array.isArray(nguon.customDict) ? nguon.customDict : nguon_bo_sung.customDict;
    if (Array.isArray(tu_dien_tho)) {
        const tu_dien_sach = tu_dien_tho.filter(muc => {
            if (Array.isArray(muc) && muc.length >= 2 && typeof muc[0] === 'string') return true;
            if (muc && typeof muc === 'object' && (muc.tu_goc || muc.tuGoc) && (muc.tu_thay_the !== undefined || muc.tuThayThe !== undefined)) return true;
            return false;
        }).map(muc => {
            if (Array.isArray(muc)) return [muc[0], muc[1]];
            return [muc.tu_goc || muc.tuGoc, muc.tu_thay_the !== undefined ? muc.tu_thay_the : muc.tuThayThe];
        });
        if (tu_dien_sach.length > 0) ket_qua.customDict = tu_dien_sach;
    }

    // Chuẩn hóa và lưu danh sách động cơ tùy chỉnh
    if (Array.isArray(nguon.customEngines)) {
        const dong_co_sach = nguon.customEngines.map(chuan_hoa_dong_co_tuy_chinh).filter(Boolean);
        if (dong_co_sach.length > 0) ket_qua.customEngines = dong_co_sach;
    }

    // Giữ nguyên các khóa API nếu đã cấu hình
    if (nguon.fpt_key) ket_qua.fpt_key = nguon.fpt_key;
    if (nguon.azure_key) ket_qua.azure_key = nguon.azure_key;
    if (nguon.azure_region) ket_qua.azure_region = nguon.azure_region;
    if (nguon.gcp_key) ket_qua.gcp_key = nguon.gcp_key;

    if (typeof nguon.moc_thong_bao_da_doc === 'string' && nguon.moc_thong_bao_da_doc) {
        ket_qua.moc_thong_bao_da_doc = nguon.moc_thong_bao_da_doc;
    }

    // Giữ lại gói xem trước v0.4.2 ở local
    const xem_truoc = trich_xuat_xem_truoc_v042(nguon, nguon_bo_sung);
    if (xem_truoc) {
        ket_qua.xem_truoc_v042 = xem_truoc;
    }

    // Gộp cài đặt sync vào local làm bản sao
    Object.assign(ket_qua, chuyen_doi_dong_bo_040_sang_041(nguon_bo_sung, nguon));

    // Đánh dấu phiên bản dữ liệu và phân bổ lưu trữ
    ket_qua.phien_ban_du_lieu = PHIEN_BAN_CHUAN;
    ket_qua.phien_ban_phan_bo_luu_tru = PHIEN_BAN_PHAN_BO_LUU_TRU;

    return ket_qua;
}

// Bọc chrome.storage kiểm tra lastError
function goi_luu_tru_bat_dong_bo(thuc_thi) {
    return new Promise((resolve, reject) => {
        try {
            thuc_thi(() => {
                const loi = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime.lastError : null;
                if (loi) reject(new Error(loi.message || String(loi)));
                else resolve();
            });
        } catch (err) {
            reject(err);
        }
    });
}

function luu_va_don_dep_storage(cuc_bo_ghi, dong_bo_ghi, khoa_xoa_cuc_bo, khoa_xoa_dong_bo) {
    const buoc_ghi = [];
    if (cuc_bo_ghi && Object.keys(cuc_bo_ghi).length > 0) {
        buoc_ghi.push(goi_luu_tru_bat_dong_bo(ham_goi_lai => chrome.storage.local.set(cuc_bo_ghi, ham_goi_lai)));
    }
    if (dong_bo_ghi && Object.keys(dong_bo_ghi).length > 0 && chrome.storage.sync) {
        buoc_ghi.push(goi_luu_tru_bat_dong_bo(ham_goi_lai => chrome.storage.sync.set(dong_bo_ghi, ham_goi_lai)));
    }

    return Promise.all(buoc_ghi).then(() => {
        const buoc_xoa = [];
        if (khoa_xoa_cuc_bo && khoa_xoa_cuc_bo.length > 0) {
            buoc_xoa.push(goi_luu_tru_bat_dong_bo(ham_goi_lai => chrome.storage.local.remove(khoa_xoa_cuc_bo, ham_goi_lai)));
        }
        if (khoa_xoa_dong_bo && khoa_xoa_dong_bo.length > 0 && chrome.storage.sync) {
            buoc_xoa.push(goi_luu_tru_bat_dong_bo(ham_goi_lai => chrome.storage.sync.remove(khoa_xoa_dong_bo, ham_goi_lai)));
        }
        return Promise.all(buoc_xoa);
    });
}

// Ghi đè sync/local, giữ khóa cục bộ khỏi sync
export async function ghi_de_du_lieu_nhap(
    du_lieu_cuc_bo = {},
    du_lieu_dong_bo = {},
    { xoa_khoa_dong_bo_thieu = true, xoa_tu_dien_neu_thieu = false, xoa_danh_sach_rong_neu_thieu = false } = {}
) {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;

    const nguon_cuc_bo = (du_lieu_cuc_bo && typeof du_lieu_cuc_bo === 'object') ? { ...du_lieu_cuc_bo } : {};
    const { du_lieu_ghi: cuc_bo_ghi, khoa_xoa: khoa_xoa_cuc_bo } = nen_tap_du_lieu(nguon_cuc_bo);
    const dong_bo_ghi = {};
    const tap_chi_cuc_bo = new Set(KHOA_CHI_CUC_BO);
    const khoa_xoa_dong_bo = [
        ...KHOA_CHI_CUC_BO,
        'smartPauses',
        'cai_dat_ten_mien',
        'tu_dong_cuon_trang',
        'tu_dong_vuot_captcha',
        'mau_chu_doc',
        'mau_nen_doc',
        'do_mo_nen_doc'
    ];

    if (!khoa_xoa_cuc_bo.includes('smartPauses')) {
        khoa_xoa_cuc_bo.push('smartPauses');
    }
    if ((xoa_tu_dien_neu_thieu || xoa_danh_sach_rong_neu_thieu)
        && !Object.prototype.hasOwnProperty.call(cuc_bo_ghi, 'customDict')
        && !khoa_xoa_cuc_bo.includes('customDict')) {
        khoa_xoa_cuc_bo.push('customDict');
    }
    if (xoa_danh_sach_rong_neu_thieu) {
        for (const k of ['readingList', 'customEngines', 'last_active_state']) {
            if (!Object.prototype.hasOwnProperty.call(cuc_bo_ghi, k) && !khoa_xoa_cuc_bo.includes(k)) {
                khoa_xoa_cuc_bo.push(k);
            }
        }
    }

    for (const khoa of CAC_KHOA_DONG_BO_CHUAN) {
        if (khoa === 'smartPauses' || tap_chi_cuc_bo.has(khoa)) continue;
        const gia_tri = (du_lieu_dong_bo && du_lieu_dong_bo[khoa] !== undefined)
            ? du_lieu_dong_bo[khoa]
            : nguon_cuc_bo[khoa];
        const v_nen = nen_gia_tri_khoa(khoa, gia_tri);
        if (v_nen !== undefined) {
            dong_bo_ghi[khoa] = v_nen;
            cuc_bo_ghi[khoa] = v_nen;
        } else if (xoa_khoa_dong_bo_thieu || gia_tri !== undefined) {
            khoa_xoa_dong_bo.push(khoa);
            delete cuc_bo_ghi[khoa];
            if (!khoa_xoa_cuc_bo.includes(khoa)) khoa_xoa_cuc_bo.push(khoa);
        }
    }

    await luu_va_don_dep_storage(cuc_bo_ghi, dong_bo_ghi, khoa_xoa_cuc_bo, khoa_xoa_dong_bo);
}

// Khóa tuần tự đọc-sửa-ghi readingList đa ngữ cảnh
let hang_doi_khoa_danh_sach = Promise.resolve();
export async function thuc_thi_khoa_danh_sach_doc(ham_xu_ly) {
    if (typeof ham_xu_ly !== 'function') return undefined;
    if (typeof navigator !== 'undefined' && navigator.locks && typeof navigator.locks.request === 'function') {
        return navigator.locks.request('stv_khoa_danh_sach_doc', async () => ham_xu_ly());
    }
    const luot_chay = hang_doi_khoa_danh_sach.then(() => ham_xu_ly(), () => ham_xu_ly());
    hang_doi_khoa_danh_sach = luot_chay.catch(() => {});
    return luot_chay;
}

// === Xuất và nhập sao lưu JSON ===

// Che thông tin nhạy cảm của động cơ khi xuất
export function lam_sach_dong_co_xuat(dong_co) {
    if (!dong_co || typeof dong_co !== 'object') return dong_co;
    const ban_sao = { ...dong_co };
    delete ban_sao.key;
    delete ban_sao.apiKey;
    delete ban_sao.khoa_api;
    delete ban_sao.ma_token;
    delete ban_sao.khoa_token;
    delete ban_sao.secret;
    delete ban_sao.token;
    delete ban_sao.password;

    const ten_truong_nhay_cam = /^(authorization|proxy-authorization|x-api-key|api-key|apikey|ocp-apim-subscription-key|x-goog-api-key|x-auth-token|token|token-id|token-key|xi-api-key|cookie)$/i;
    if (ban_sao.headers && typeof ban_sao.headers === 'object' && !Array.isArray(ban_sao.headers)) {
        const truong_http_sach = {};
        for (const [k, v] of Object.entries(ban_sao.headers)) {
            truong_http_sach[k] = ten_truong_nhay_cam.test(k) ? '***' : v;
        }
        ban_sao.headers = truong_http_sach;
    } else if (typeof ban_sao.headers === 'string' && ban_sao.headers.trim().startsWith('{')) {
        try {
            const du_lieu_json = JSON.parse(ban_sao.headers);
            if (du_lieu_json && typeof du_lieu_json === 'object' && !Array.isArray(du_lieu_json)) {
                for (const k of Object.keys(du_lieu_json)) {
                    if (ten_truong_nhay_cam.test(k)) du_lieu_json[k] = '***';
                }
                ban_sao.headers = JSON.stringify(du_lieu_json);
            }
        } catch (err) {
            // Giữ nguyên nếu chuỗi headers không phải JSON hợp lệ
        }
    }
    return ban_sao;
}

function phan_tich_json_an_toan_cho_xuat(gia_tri_tho, mac_dinh) {
    if (gia_tri_tho && typeof gia_tri_tho === 'object') return gia_tri_tho;
    if (typeof gia_tri_tho !== 'string') return mac_dinh;
    const chuoi = gia_tri_tho.trim();
    if (!chuoi) return mac_dinh;
    if (chuoi.startsWith('{') || chuoi.startsWith('[')) {
        try {
            return JSON.parse(chuoi);
        } catch (err) {
            return chuoi;
        }
    }
    return chuoi;
}

// Tạo gói JSON sao lưu DocTruyenSTV_v2 sạch cache
export function tao_goi_du_lieu_xuat(dl_cuc_bo = {}, dl_dong_bo = {}, phien_ban = PHIEN_BAN_CHUAN) {
    const pb = phien_ban || ((typeof chrome !== 'undefined' && chrome.runtime?.getManifest) ? chrome.runtime.getManifest().version : PHIEN_BAN_CHUAN);
    const cuc_bo = (dl_cuc_bo && typeof dl_cuc_bo === 'object') ? dl_cuc_bo : {};
    const dong_bo = (dl_dong_bo && typeof dl_dong_bo === 'object') ? dl_dong_bo : {};
    const nguon = { ...cuc_bo, ...dong_bo };

    const chu_de = giai_ma_chu_de(nguon.giao_dien_chu_de);
    const tn = giai_ma_thay_nhanh_web(nguon.thayNhanhWeb);
    const thay_nhanh_chu = tn === 'extreme' ? 'cuc_do' : (tn === 'on' ? 'bat' : 'tat');
    const che_do_mp = giai_ma_che_do_mini_player(nguon.miniPlayerMode) === 'chunk' ? 'doan' : 'chuong';

    const chi_so_tho = nguon.voiceIndex !== undefined ? parseInt(nguon.voiceIndex, 10) : 0;
    const nghi_phay_tho = nguon.pauseComma !== undefined ? parseInt(nguon.pauseComma, 10) : 300;
    const nghi_cham_tho = nguon.pauseDot !== undefined ? parseInt(nguon.pauseDot, 10) : 800;
    const gia_tri_nghi_doan = nguon.pausePara !== undefined ? nguon.pausePara : nguon.smartPauses;
    const nghi_doan_tho = gia_tri_nghi_doan !== undefined ? parseInt(gia_tri_nghi_doan, 10) : 1200;

    const cai_dat_chung = {
        giao_dien_chu_de: chu_de === 'light' ? 'sang' : 'toi',
        may_doc: String(nguon.maydoc || 'web'),
        chi_so_giong: (Number.isFinite(chi_so_tho) && chi_so_tho >= 0) ? chi_so_tho : 0,
        ten_giong_doc: String(nguon.voiceName || ''),
        toc_do: (nguon.speed !== undefined && Number.isFinite(Number(nguon.speed))) ? Number(nguon.speed) : 1.0,
        am_luong: (nguon.volume !== undefined && Number.isFinite(Number(nguon.volume))) ? Number(nguon.volume) : 1.0,
        nghi_dau_phay_ms: (Number.isFinite(nghi_phay_tho) && nghi_phay_tho >= 0) ? nghi_phay_tho : 300,
        nghi_dau_cham_ms: (Number.isFinite(nghi_cham_tho) && nghi_cham_tho >= 0) ? nghi_cham_tho : 800,
        nghi_xuong_dong_ms: (Number.isFinite(nghi_doan_tho) && nghi_doan_tho >= 0) ? nghi_doan_tho : 1200,
        tu_dong_chuyen_chuong: giai_ma_bool(nguon.tudongchuyenchuong, true),
        doc_ten_truyen: giai_ma_bool(nguon.doctentruyen, true),
        doc_ten_chuong: giai_ma_bool(nguon.doctenchuong, true),
        bat_phim_tat: giai_ma_bool(nguon.batphimtat, true),
        hien_chuong_thong_bao: giai_ma_bool(nguon.hien_chuong_thong_bao, true),
        thay_nhanh_web: thay_nhanh_chu,
        che_do_trinh_phat_nho: che_do_mp
    };
    if (nguon.azure_region) cai_dat_chung.vung_azure = String(nguon.azure_region);
    if (nguon.customShortcuts && typeof nguon.customShortcuts === 'object' && !Array.isArray(nguon.customShortcuts) && Object.keys(nguon.customShortcuts).length > 0) {
        cai_dat_chung.phim_tat = { ...nguon.customShortcuts };
    }

    const hen_gio_dung = {};
    if (Number(nguon.stopAfterChapters) > 0) hen_gio_dung.sau_so_chuong = Number(nguon.stopAfterChapters);
    if (Number(nguon.stopTime) > 0) hen_gio_dung.phut_dung = Number(nguon.stopTime);
    if (nguon.stopRealtimeTarget) hen_gio_dung.moc_thoi_gian = String(nguon.stopRealtimeTarget);
    if (nguon.customStopConfig !== undefined && nguon.customStopConfig !== null) {
        hen_gio_dung.tuy_chinh = nguon.customStopConfig;
    }

    const ds_tu_dien_tho = Array.isArray(cuc_bo.customDict) ? cuc_bo.customDict : (Array.isArray(nguon.customDict) ? nguon.customDict : []);
    const tu_dien_phat_am = [];
    for (const muc of ds_tu_dien_tho) {
        if (Array.isArray(muc) && muc.length >= 2) {
            tu_dien_phat_am.push({ tu_goc: String(muc[0] ?? ''), doc_thanh: String(muc[1] ?? '') });
        } else if (muc && typeof muc === 'object' && (muc.tu_goc !== undefined || muc.tuGoc !== undefined)) {
            tu_dien_phat_am.push({
                tu_goc: String(muc.tu_goc ?? muc.tuGoc ?? ''),
                doc_thanh: String(muc.doc_thanh ?? muc.tu_thay_the ?? muc.tuThayThe ?? '')
            });
        }
    }

    const ds_truyen_chuan = chuan_hoa_danh_sach_truyen(Array.isArray(cuc_bo.readingList) ? cuc_bo.readingList : nguon.readingList);
    const danh_sach_truyen = ds_truyen_chuan.map(t => {
        const muc_xuat = {
            ten_truyen: t.title,
            ten_chuong: t.chap || '',
            doan_dang_doc: t.chunkIndex ?? 0,
            duong_dan: t.url || ''
        };
        if (t.chunkTotal !== null && t.chunkTotal !== undefined) muc_xuat.tong_so_doan = t.chunkTotal;
        if (t.imgUrl) muc_xuat.anh_bia = t.imgUrl;
        if (t.author) muc_xuat.tac_gia = t.author;
        if (t.savedAt) muc_xuat.ngay_luu = t.savedAt;
        if (t.stats) muc_xuat.thong_ke = { ...t.stats };
        return muc_xuat;
    });

    const ds_dong_co_tho = Array.isArray(cuc_bo.customEngines) ? cuc_bo.customEngines : (Array.isArray(nguon.customEngines) ? nguon.customEngines : []);
    const dong_co_tuy_chinh = [];
    for (const dc_tho of ds_dong_co_tho) {
        const dc_chuan = chuan_hoa_dong_co_tuy_chinh(dc_tho);
        if (!dc_chuan) continue;
        const dc_sach = lam_sach_dong_co_xuat(dc_chuan);
        const muc_dc = {
            ma: dc_sach.id || '',
            ten: dc_sach.name || ''
        };
        if (dc_sach.type) muc_dc.loai = dc_sach.type;
        const la_http = dc_sach.type === 'custom' || (dc_sach.type !== 'vieneu' && Boolean(dc_sach.url));
        if (la_http) {
            muc_dc.duong_dan = dc_sach.url || '';
            muc_dc.phuong_thuc = (dc_sach.method || 'POST').toUpperCase();
            const tieu_de_http = phan_tich_json_an_toan_cho_xuat(dc_sach.headers, {});
            muc_dc.tieu_de_http = (tieu_de_http && typeof tieu_de_http === 'object' && !Array.isArray(tieu_de_http)) ? tieu_de_http : {};
            muc_dc.mau_noi_dung = phan_tich_json_an_toan_cho_xuat(dc_sach.mau_noi_dung, '');
            muc_dc.duong_dan_am_thanh = dc_sach.duong_dan_am_thanh || '';
        } else if (dc_sach.url) {
            muc_dc.duong_dan = dc_sach.url;
        }
        if (dc_sach.ma_model) muc_dc.ma_model = dc_sach.ma_model;
        if (dc_sach.ma_giong) muc_dc.ma_giong = dc_sach.ma_giong;
        if (Array.isArray(dc_sach.voices) && dc_sach.voices.length > 0) muc_dc.voices = dc_sach.voices;
        if (dc_sach.region) muc_dc.vung = dc_sach.region;
        dong_co_tuy_chinh.push(muc_dc);
    }

    const goi_xuat = {
        dinh_dang_sao_luu: 'DocTruyenSTV_v2',
        phien_ban: pb,
        ngay_xuat: new Date().toISOString(),
        cai_dat_chung
    };
    if (Object.keys(hen_gio_dung).length > 0) goi_xuat.hen_gio_dung = hen_gio_dung;
    if (nguon.xem_truoc_v042 && typeof nguon.xem_truoc_v042 === 'object' && !Array.isArray(nguon.xem_truoc_v042) && Object.keys(nguon.xem_truoc_v042).length > 0) {
        goi_xuat.xem_truoc_v042 = { ...nguon.xem_truoc_v042 };
    }
    goi_xuat.tu_dien_phat_am = tu_dien_phat_am;
    goi_xuat.danh_sach_truyen = danh_sach_truyen;
    goi_xuat.dong_co_tuy_chinh = dong_co_tuy_chinh;
    return goi_xuat;
}

// Tạo data URI JSON an toàn trên Edge
export function tao_data_uri_json(du_lieu_obj, gioi_han_byte = 1048576) {
    const chuoi_json = JSON.stringify(du_lieu_obj, null, 2);
    if (typeof TextEncoder !== 'function' || typeof btoa !== 'function') {
        return { url_tai: null, chuoi_json, kich_thuoc: chuoi_json.length };
    }
    const mang_byte = new TextEncoder().encode(chuoi_json);
    const kich_thuoc = mang_byte.length;
    if (kich_thuoc > gioi_han_byte) {
        return { url_tai: null, chuoi_json, kich_thuoc };
    }
    try {
        const buoc_nhay = 8192;
        let chuoi_nhi_phan = '';
        for (let vi_tri = 0; vi_tri < kich_thuoc; vi_tri += buoc_nhay) {
            chuoi_nhi_phan += String.fromCharCode(...mang_byte.subarray(vi_tri, vi_tri + buoc_nhay));
        }
        return {
            url_tai: `data:application/json;charset=utf-8;base64,${btoa(chuoi_nhi_phan)}`,
            chuoi_json,
            kich_thuoc
        };
    } catch (loi) {
        console.warn('[DocTruyenSTV] Lỗi mã hóa base64 khi xuất JSON:', loi);
        return { url_tai: null, chuoi_json, kich_thuoc };
    }
}

// Tải JSON qua data URI hoặc blob fallback
export async function tai_xuong_json(du_lieu_obj, ten_tep) {
    if (typeof document === 'undefined' || !document.body) {
        return { thanh_cong: false, phuong_thuc: 'khong_co_dom' };
    }
    const { url_tai: url_du_lieu, chuoi_json, kich_thuoc } = tao_data_uri_json(du_lieu_obj, 1048576);
    const tep_blob = url_du_lieu
        ? null
        : new Blob([chuoi_json], { type: 'application/json;charset=utf-8' });
    const kich_thuoc_tep = url_du_lieu ? kich_thuoc : tep_blob.size;
    let url_tai = url_du_lieu || '';
    let la_url_blob = false;
    const phuong_thuc = url_du_lieu ? 'data' : 'blob';

    if (!url_tai) {
        url_tai = URL.createObjectURL(tep_blob);
        la_url_blob = true;
    }

    const the_a = document.createElement('a');
    the_a.href = url_tai;
    the_a.download = ten_tep;
    the_a.style.display = 'none';
    document.body.appendChild(the_a);
    try {
        the_a.click();
    } finally {
        the_a.remove();
        if (la_url_blob) {
            setTimeout(() => URL.revokeObjectURL(url_tai), 60000);
        }
    }
    return { thanh_cong: true, phuong_thuc, kich_thuoc: kich_thuoc_tep };
}

let tien_trinh_khoi_chay = null;

// Kiểm tra và di trú lưu trữ khi khởi chạy
export async function chuyen_doi_du_lieu_khoi_chay() {
    if (tien_trinh_khoi_chay) return tien_trinh_khoi_chay;

    const thuc_thi_chuyen_doi = () => new Promise((resolve) => {
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
            resolve({ da_chuyen_doi: false, ly_do: 'Khong_co_chrome_storage' });
            return;
        }

        chrome.storage.local.get(null, dl_cuc_bo => {
            const da_chuan_hoa_041 = Boolean(
                dl_cuc_bo && dl_cuc_bo.phien_ban_du_lieu && so_sanh_phien_ban(dl_cuc_bo.phien_ban_du_lieu, PHIEN_BAN_CHUAN) >= 0
            );
            const da_phan_bo_moi = Boolean(
                dl_cuc_bo && typeof dl_cuc_bo.phien_ban_phan_bo_luu_tru === 'number'
                && dl_cuc_bo.phien_ban_phan_bo_luu_tru >= PHIEN_BAN_PHAN_BO_LUU_TRU
            );

            // Bỏ qua nếu đã đạt phân bổ lưu trữ hiện tại
            if (da_chuan_hoa_041 && da_phan_bo_moi) {
                resolve({ da_chuyen_doi: false, ly_do: 'Da_chuan_hoa_truoc_do' });
                return;
            }

            const khoa_xem_truoc_le = ['cai_dat_ten_mien', 'tu_dong_cuon_trang', 'tu_dong_vuot_captcha', 'mau_chu_doc', 'mau_nen_doc', 'do_mo_nen_doc'];

            const xu_ly_sync = dl_dong_bo => {
                if (!da_chuan_hoa_041) {
                    const cuc_bo_moi = chuyen_doi_cuc_bo_040_sang_041(dl_cuc_bo, dl_dong_bo);
                    const dong_bo_moi = chuyen_doi_dong_bo_040_sang_041(dl_dong_bo, dl_cuc_bo);
                    // Dọn cache nội bộ và smartPauses cũ
                    const khoa_xoa_cuc_bo = ['co_tin_moi_thong_bao', 'moc_thong_bao_cache', 'smartPauses', ...khoa_xem_truoc_le]
                        .filter(k => dl_cuc_bo && dl_cuc_bo[k] !== undefined);
                    const khoa_xoa_dong_bo = [];
                    if (dl_dong_bo && dl_dong_bo.customDict !== undefined && (cuc_bo_moi.customDict || dl_cuc_bo?.customDict)) {
                        khoa_xoa_dong_bo.push('customDict');
                    }
                    if (dl_dong_bo && dl_dong_bo.smartPauses !== undefined) {
                        khoa_xoa_dong_bo.push('smartPauses');
                    }
                    for (const k of khoa_xem_truoc_le) {
                        if (dl_dong_bo && dl_dong_bo[k] !== undefined) khoa_xoa_dong_bo.push(k);
                    }

                    luu_va_don_dep_storage(cuc_bo_moi, dong_bo_moi, khoa_xoa_cuc_bo, khoa_xoa_dong_bo).then(() => {
                        resolve({ da_chuyen_doi: true, phien_ban_moi: PHIEN_BAN_CHUAN });
                    }).catch(err => {
                        resolve({ da_chuyen_doi: false, loi: err });
                    });
                    return;
                }

                // Nâng cấp phân bổ lưu trữ và dọn khóa cũ
                const cuc_bo_cap_nhat = { phien_ban_phan_bo_luu_tru: PHIEN_BAN_PHAN_BO_LUU_TRU };
                const dong_bo_cap_nhat = {};
                const khoa_xoa_cuc_bo = ['co_tin_moi_thong_bao', 'moc_thong_bao_cache', 'smartPauses', ...khoa_xem_truoc_le]
                    .filter(k => dl_cuc_bo && dl_cuc_bo[k] !== undefined);
                const khoa_xoa_dong_bo = [];
                if (dl_dong_bo && dl_dong_bo.smartPauses !== undefined) khoa_xoa_dong_bo.push('smartPauses');
                for (const k of khoa_xem_truoc_le) {
                    if (dl_dong_bo && dl_dong_bo[k] !== undefined) khoa_xoa_dong_bo.push(k);
                }

                // Bảo toàn customDict nếu trước đó nằm nhầm ở sync
                if (dl_dong_bo && Array.isArray(dl_dong_bo.customDict) && dl_dong_bo.customDict.length > 0) {
                    if (!dl_cuc_bo || !Array.isArray(dl_cuc_bo.customDict) || dl_cuc_bo.customDict.length === 0) {
                        cuc_bo_cap_nhat.customDict = dl_dong_bo.customDict;
                    }
                    khoa_xoa_dong_bo.push('customDict');
                }

                // Chuẩn hóa danh sách động cơ còn bí danh cũ
                if (dl_cuc_bo && Array.isArray(dl_cuc_bo.customEngines)) {
                    const dong_co_chuan = dl_cuc_bo.customEngines.map(chuan_hoa_dong_co_tuy_chinh).filter(Boolean);
                    if (dong_co_chuan.length === 0) {
                        khoa_xoa_cuc_bo.push('customEngines');
                    } else if (JSON.stringify(dong_co_chuan) !== JSON.stringify(dl_cuc_bo.customEngines)) {
                        cuc_bo_cap_nhat.customEngines = dong_co_chuan;
                    }
                }

                // Gom cấu hình xem trước v0.4.2 rời về cục bộ
                const xem_truoc = trich_xuat_xem_truoc_v042(dl_cuc_bo, dl_dong_bo);
                if (xem_truoc && (!dl_cuc_bo || !dl_cuc_bo.xem_truoc_v042)) {
                    cuc_bo_cap_nhat.xem_truoc_v042 = xem_truoc;
                }

                // Chỉ khôi phục pausePara khi phân bổ < 4
                const phien_ban_phan_bo_cu = typeof dl_cuc_bo?.phien_ban_phan_bo_luu_tru === 'number' ? dl_cuc_bo.phien_ban_phan_bo_luu_tru : 0;
                const pause_para_goc = doc_gia_tri_uu_tien(dl_dong_bo, dl_cuc_bo, 'pausePara');
                const smart_pauses_goc = doc_gia_tri_uu_tien(dl_dong_bo, dl_cuc_bo, 'smartPauses');

                for (const k of CAC_KHOA_DONG_BO_CHUAN) {
                    let gia_tri_goc = doc_gia_tri_uu_tien(dl_dong_bo, dl_cuc_bo, k);
                    if (k === 'pausePara' && gia_tri_goc === undefined && smart_pauses_goc !== undefined && phien_ban_phan_bo_cu < 4) {
                        gia_tri_goc = smart_pauses_goc;
                    }
                    if (gia_tri_goc === undefined && k !== 'pausePara') continue;
                    if (gia_tri_goc === undefined && pause_para_goc === undefined && (smart_pauses_goc === undefined || phien_ban_phan_bo_cu >= 4)) continue;

                    const gia_tri_nen = nen_gia_tri_khoa(k, gia_tri_goc);
                    if (gia_tri_nen !== undefined) {
                        if (!dl_dong_bo || JSON.stringify(dl_dong_bo[k]) !== JSON.stringify(gia_tri_nen)) {
                            dong_bo_cap_nhat[k] = gia_tri_nen;
                        }
                        if (!dl_cuc_bo || JSON.stringify(dl_cuc_bo[k]) !== JSON.stringify(gia_tri_nen)) {
                            cuc_bo_cap_nhat[k] = gia_tri_nen;
                        }
                    }
                }

                luu_va_don_dep_storage(cuc_bo_cap_nhat, dong_bo_cap_nhat, khoa_xoa_cuc_bo, khoa_xoa_dong_bo).then(() => {
                    resolve({ da_chuyen_doi: true, phien_ban_moi: PHIEN_BAN_CHUAN, da_can_bang_luu_tru: true });
                }).catch(err => {
                    resolve({ da_chuyen_doi: false, loi: err });
                });
            };

            if (chrome.storage.sync) {
                chrome.storage.sync.get(null, xu_ly_sync);
            } else {
                xu_ly_sync({});
            }
        });
    });

    tien_trinh_khoi_chay = (typeof navigator !== 'undefined' && navigator.locks && typeof navigator.locks.request === 'function')
        ? navigator.locks.request('stv_khoa_chuyen_doi', thuc_thi_chuyen_doi)
        : thuc_thi_chuyen_doi();

    return tien_trinh_khoi_chay.finally(() => {
        tien_trinh_khoi_chay = null;
    });
}

// Kiểm tra kiểu dữ liệu khi nhập JSON bản cũ
function thu_thap_loi_kieu_nhap(nguon_chinh, nguon_phu = {}) {
    const cac_muc_loi = [];
    const ghi_loi = (ten_khoa) => {
        if (!cac_muc_loi.includes(ten_khoa)) cac_muc_loi.push(ten_khoa);
    };

    const khoa_mang = ['readingList', 'customDict', 'customEngines'];
    for (const k of khoa_mang) {
        const v = doc_gia_tri_uu_tien(nguon_chinh, nguon_phu, k);
        if (v !== undefined && !Array.isArray(v)) {
            ghi_loi(k);
        }
    }

    const khoa_doi_tuong = ['customShortcuts', 'customStopConfig', 'xem_truoc_v042'];
    for (const k of khoa_doi_tuong) {
        const v = doc_gia_tri_uu_tien(nguon_chinh, nguon_phu, k);
        if (v !== undefined && (!v || typeof v !== 'object' || Array.isArray(v))) {
            ghi_loi(k);
        }
    }

    const khoa_so = ['speed', 'volume', 'pauseComma', 'pauseDot', 'pausePara', 'voiceIndex'];
    for (const k of khoa_so) {
        const v = doc_gia_tri_uu_tien(nguon_chinh, nguon_phu, k);
        if (v !== undefined && (v === '' || typeof v === 'boolean' || typeof v === 'object' || !Number.isFinite(Number(v)))) {
            ghi_loi(k);
        }
    }

    return cac_muc_loi;
}

function chuyen_doi_nhap_v041(du_lieu_tho) {
    const cac_muc_loi = [];
    const ghi_loi = (ten) => { if (!cac_muc_loi.includes(ten)) cac_muc_loi.push(ten); };

    if (du_lieu_tho.cai_dat_chung !== undefined && (!du_lieu_tho.cai_dat_chung || typeof du_lieu_tho.cai_dat_chung !== 'object' || Array.isArray(du_lieu_tho.cai_dat_chung))) {
        ghi_loi('cai_dat_chung');
    }
    if (du_lieu_tho.hen_gio_dung !== undefined && (!du_lieu_tho.hen_gio_dung || typeof du_lieu_tho.hen_gio_dung !== 'object' || Array.isArray(du_lieu_tho.hen_gio_dung))) {
        ghi_loi('hen_gio_dung');
    }
    if (du_lieu_tho.xem_truoc_v042 !== undefined && (!du_lieu_tho.xem_truoc_v042 || typeof du_lieu_tho.xem_truoc_v042 !== 'object' || Array.isArray(du_lieu_tho.xem_truoc_v042))) {
        ghi_loi('xem_truoc_v042');
    }
    for (const [k_xuat, k_noi_bo] of [['tu_dien_phat_am', 'customDict'], ['danh_sach_truyen', 'readingList'], ['dong_co_tuy_chinh', 'customEngines']]) {
        if (du_lieu_tho[k_xuat] !== undefined && !Array.isArray(du_lieu_tho[k_xuat])) {
            ghi_loi(k_noi_bo);
        }
    }

    const cd = (!cac_muc_loi.includes('cai_dat_chung') && du_lieu_tho.cai_dat_chung) ? du_lieu_tho.cai_dat_chung : {};
    const hg = (!cac_muc_loi.includes('hen_gio_dung') && du_lieu_tho.hen_gio_dung) ? du_lieu_tho.hen_gio_dung : {};
    const nguon_chuan = {};

    const anh_xa_so = [
        ['chi_so_giong', 'voiceIndex'],
        ['toc_do', 'speed'],
        ['am_luong', 'volume'],
        ['nghi_dau_phay_ms', 'pauseComma'],
        ['nghi_dau_cham_ms', 'pauseDot'],
        ['nghi_xuong_dong_ms', 'pausePara']
    ];
    for (const [k_xuat, k_noi_bo] of anh_xa_so) {
        const v = cd[k_xuat];
        if (v !== undefined) {
            if (v === '' || typeof v === 'boolean' || typeof v === 'object' || !Number.isFinite(Number(v))) {
                ghi_loi(k_noi_bo);
            } else {
                nguon_chuan[k_noi_bo] = Number(v);
            }
        }
    }

    if (cd.giao_dien_chu_de !== undefined) nguon_chuan.giao_dien_chu_de = cd.giao_dien_chu_de;
    if (cd.may_doc !== undefined) nguon_chuan.maydoc = String(cd.may_doc);
    if (cd.ten_giong_doc !== undefined) nguon_chuan.voiceName = String(cd.ten_giong_doc);
    if (cd.tu_dong_chuyen_chuong !== undefined) nguon_chuan.tudongchuyenchuong = cd.tu_dong_chuyen_chuong;
    if (cd.doc_ten_truyen !== undefined) nguon_chuan.doctentruyen = cd.doc_ten_truyen;
    if (cd.doc_ten_chuong !== undefined) nguon_chuan.doctenchuong = cd.doc_ten_chuong;
    if (cd.bat_phim_tat !== undefined) nguon_chuan.batphimtat = cd.bat_phim_tat;
    if (cd.hien_chuong_thong_bao !== undefined) nguon_chuan.hien_chuong_thong_bao = cd.hien_chuong_thong_bao;
    if (cd.thay_nhanh_web !== undefined) nguon_chuan.thayNhanhWeb = cd.thay_nhanh_web;
    if (cd.che_do_trinh_phat_nho !== undefined) nguon_chuan.miniPlayerMode = cd.che_do_trinh_phat_nho;
    if (cd.vung_azure !== undefined) nguon_chuan.azure_region = String(cd.vung_azure);
    if (cd.phim_tat !== undefined) {
        if (!cd.phim_tat || typeof cd.phim_tat !== 'object' || Array.isArray(cd.phim_tat)) ghi_loi('customShortcuts');
        else nguon_chuan.customShortcuts = cd.phim_tat;
    }

    if (hg.sau_so_chuong !== undefined) nguon_chuan.stopAfterChapters = hg.sau_so_chuong;
    if (hg.phut_dung !== undefined) nguon_chuan.stopTime = hg.phut_dung;
    if (hg.moc_thoi_gian !== undefined) nguon_chuan.stopRealtimeTarget = hg.moc_thoi_gian;
    if (hg.tuy_chinh !== undefined) nguon_chuan.customStopConfig = hg.tuy_chinh;

    if (!cac_muc_loi.includes('xem_truoc_v042') && du_lieu_tho.xem_truoc_v042) {
        nguon_chuan.xem_truoc_v042 = { ...du_lieu_tho.xem_truoc_v042 };
    }

    if (!cac_muc_loi.includes('customDict') && Array.isArray(du_lieu_tho.tu_dien_phat_am)) {
        nguon_chuan.customDict = du_lieu_tho.tu_dien_phat_am
            .map(m => {
                if (Array.isArray(m) && m.length >= 2) return [String(m[0] ?? ''), String(m[1] ?? '')];
                if (m && typeof m === 'object' && (m.tu_goc !== undefined || m.tuGoc !== undefined)) {
                    return [String(m.tu_goc ?? m.tuGoc ?? ''), String(m.doc_thanh ?? m.tu_thay_the ?? m.tuThayThe ?? '')];
                }
                return null;
            })
            .filter(m => m && m[0] !== '');
    }

    if (!cac_muc_loi.includes('readingList') && Array.isArray(du_lieu_tho.danh_sach_truyen)) {
        nguon_chuan.readingList = chuan_hoa_danh_sach_truyen(du_lieu_tho.danh_sach_truyen);
    }

    if (!cac_muc_loi.includes('customEngines') && Array.isArray(du_lieu_tho.dong_co_tuy_chinh)) {
        nguon_chuan.customEngines = du_lieu_tho.dong_co_tuy_chinh.map(chuan_hoa_dong_co_tuy_chinh).filter(Boolean);
    }

    const cuc_bo_hop_le = {};
    for (const khoa of CAC_KHOA_CUC_BO_CHUAN) {
        const v_nen = nen_gia_tri_khoa(khoa, nguon_chuan[khoa]);
        if (v_nen !== undefined) cuc_bo_hop_le[khoa] = v_nen;
    }
    const dong_bo_hop_le = {};
    for (const khoa of CAC_KHOA_DONG_BO_CHUAN) {
        const v_nen = nen_gia_tri_khoa(khoa, nguon_chuan[khoa]);
        if (v_nen !== undefined) dong_bo_hop_le[khoa] = v_nen;
    }

    Object.assign(cuc_bo_hop_le, dong_bo_hop_le);
    cuc_bo_hop_le.phien_ban_du_lieu = PHIEN_BAN_CHUAN;
    cuc_bo_hop_le.phien_ban_phan_bo_luu_tru = PHIEN_BAN_PHAN_BO_LUU_TRU;

    return {
        phien_ban: du_lieu_tho.phien_ban || PHIEN_BAN_CHUAN,
        dinh_dang_sao_luu: 'DocTruyenSTV_v2',
        local: cuc_bo_hop_le,
        sync: dong_bo_hop_le,
        da_chuyen_doi: false,
        cac_muc_loi
    };
}

// Chuyển đổi gói JSON nhập sang phân tầng v0.4.1
export function chuyen_doi_du_lieu_nhap(du_lieu_tho) {
    if (!du_lieu_tho || typeof du_lieu_tho !== 'object' || Array.isArray(du_lieu_tho)) {
        throw new Error('Dữ liệu JSON không hợp lệ');
    }

    const la_goi_chuan = du_lieu_tho.dinh_dang_sao_luu === 'DocTruyenSTV_v2'
        || du_lieu_tho.dinh_dang_sao_luu === 'chuyen_doi_v0.4.1'
        || (!du_lieu_tho.local && !du_lieu_tho.cuc_bo && !du_lieu_tho.sync && !du_lieu_tho.dong_bo
            && (du_lieu_tho.cai_dat_chung !== undefined || du_lieu_tho.tu_dien_phat_am !== undefined || du_lieu_tho.danh_sach_truyen !== undefined || du_lieu_tho.dong_co_tuy_chinh !== undefined));
    if (la_goi_chuan) {
        return chuyen_doi_nhap_v041(du_lieu_tho);
    }

    const phien_ban = du_lieu_tho.phien_ban || du_lieu_tho.phienBan;
    const co_phan_tang = Boolean(du_lieu_tho.local || du_lieu_tho.cuc_bo || du_lieu_tho.sync || du_lieu_tho.dong_bo);

    // Nén dữ liệu nếu tệp đã phân tầng
    if (phien_ban && so_sanh_phien_ban(phien_ban, PHIEN_BAN_CHUAN) >= 0 && co_phan_tang) {
        const nguon_cuc_bo = du_lieu_tho.local || du_lieu_tho.cuc_bo || {};
        const nguon_dong_bo = du_lieu_tho.sync || du_lieu_tho.dong_bo || {};
        const cac_muc_loi = thu_thap_loi_kieu_nhap(nguon_cuc_bo, nguon_dong_bo);
        const tap_loi = new Set(cac_muc_loi);

        const cuc_bo_hop_le = {};
        for (const khoa of CAC_KHOA_CUC_BO_CHUAN) {
            if (khoa === 'smartPauses' || tap_loi.has(khoa)) continue;
            if (khoa === 'xem_truoc_v042') {
                const xem_truoc = trich_xuat_xem_truoc_v042(nguon_cuc_bo, nguon_dong_bo);
                if (xem_truoc) cuc_bo_hop_le.xem_truoc_v042 = xem_truoc;
                continue;
            }
            let gia_tri = doc_gia_tri_uu_tien(nguon_cuc_bo, nguon_dong_bo, khoa);
            if (khoa === 'pausePara' && gia_tri === undefined) {
                gia_tri = doc_gia_tri_uu_tien(nguon_cuc_bo, nguon_dong_bo, 'smartPauses');
            }
            if (khoa === 'readingList' && Array.isArray(gia_tri)) {
                gia_tri = chuan_hoa_danh_sach_truyen(gia_tri);
            }
            if (khoa === 'customEngines' && Array.isArray(gia_tri)) {
                gia_tri = gia_tri.map(chuan_hoa_dong_co_tuy_chinh).filter(Boolean);
            }
            const v_nen = nen_gia_tri_khoa(khoa, gia_tri);
            if (v_nen !== undefined) cuc_bo_hop_le[khoa] = v_nen;
        }

        const dong_bo_hop_le = {};
        for (const khoa of CAC_KHOA_DONG_BO_CHUAN) {
            if (khoa === 'smartPauses' || tap_loi.has(khoa)) continue;
            let gia_tri = doc_gia_tri_uu_tien(nguon_dong_bo, nguon_cuc_bo, khoa);
            if (khoa === 'pausePara' && gia_tri === undefined) {
                gia_tri = doc_gia_tri_uu_tien(nguon_dong_bo, nguon_cuc_bo, 'smartPauses');
            }
            const v_nen = nen_gia_tri_khoa(khoa, gia_tri);
            if (v_nen !== undefined) dong_bo_hop_le[khoa] = v_nen;
        }

        // Bảo đảm local luôn giữ bản sao của sync
        Object.assign(cuc_bo_hop_le, dong_bo_hop_le);
        cuc_bo_hop_le.phien_ban_du_lieu = PHIEN_BAN_CHUAN;
        cuc_bo_hop_le.phien_ban_phan_bo_luu_tru = PHIEN_BAN_PHAN_BO_LUU_TRU;

        return {
            phien_ban: phien_ban,
            local: cuc_bo_hop_le,
            sync: dong_bo_hop_le,
            da_chuyen_doi: false,
            cac_muc_loi
        };
    }

    // Bóc tách và di trú nếu là tệp bản cũ
    const nguon_phang = du_lieu_tho.local ? { ...du_lieu_tho.local, ...(du_lieu_tho.sync || {}) } : du_lieu_tho;
    const cac_muc_loi = thu_thap_loi_kieu_nhap(nguon_phang);
    const tap_loi = new Set(cac_muc_loi);

    const cuc_bo_chuan = chuyen_doi_cuc_bo_040_sang_041(nguon_phang);
    const dong_bo_chuan = chuyen_doi_dong_bo_040_sang_041(nguon_phang);

    // Lọc bỏ khóa lạ hoặc khóa sai kiểu
    const cuc_bo_cuoi_cung = {};
    for (const khoa of CAC_KHOA_CUC_BO_CHUAN) {
        if (!tap_loi.has(khoa) && cuc_bo_chuan[khoa] !== undefined) cuc_bo_cuoi_cung[khoa] = cuc_bo_chuan[khoa];
    }

    const dong_bo_cuoi_cung = {};
    for (const khoa of CAC_KHOA_DONG_BO_CHUAN) {
        if (!tap_loi.has(khoa) && dong_bo_chuan[khoa] !== undefined) dong_bo_cuoi_cung[khoa] = dong_bo_chuan[khoa];
    }
    Object.assign(cuc_bo_cuoi_cung, dong_bo_cuoi_cung);

    return {
        phien_ban: PHIEN_BAN_CHUAN,
        local: cuc_bo_cuoi_cung,
        sync: dong_bo_cuoi_cung,
        da_chuyen_doi: true,
        cac_muc_loi
    };
}

// === Xuất đối tượng toàn cục ===

// Gắn lên phạm vi toàn cục
if (typeof self !== 'undefined') {
    self.DocTruyenSTV_ChuyenDoi = {
        PHIEN_BAN_CHUAN,
        PHIEN_BAN_PHAN_BO_LUU_TRU,
        KHOA_CHI_CUC_BO,
        CAC_KHOA_CUC_BO_CHUAN,
        CAC_KHOA_DONG_BO_CHUAN,
        PHIM_TAT_MAC_DINH,
        giai_ma_bool,
        giai_ma_chu_de,
        giai_ma_thay_nhanh_web,
        giai_ma_che_do_mini_player,
        giai_ma_phim_tat,
        nen_gia_tri_khoa,
        nen_tap_du_lieu,
        so_sanh_phien_ban,
        chuan_hoa_muc_truyen,
        chuan_hoa_danh_sach_truyen,
        chuan_hoa_dong_co_tuy_chinh,
        chuyen_doi_dong_bo_040_sang_041,
        chuyen_doi_cuc_bo_040_sang_041,
        chuyen_doi_du_lieu_khoi_chay,
        chuyen_doi_du_lieu_nhap,
        ghi_de_du_lieu_nhap,
        thuc_thi_khoa_danh_sach_doc,
        lam_sach_dong_co_xuat,
        tao_goi_du_lieu_xuat,
        tai_xuong_json
    };
}
