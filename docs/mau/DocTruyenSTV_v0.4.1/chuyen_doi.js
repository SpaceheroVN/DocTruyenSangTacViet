'use strict';

// Chuyển đổi và tương thích ngược dữ liệu giữa các phiên bản tiện ích

export const PHIEN_BAN_CHUAN = '0.4.1';

// Danh sách khóa hợp lệ của bộ nhớ cục bộ (storage.local)
export const CAC_KHOA_CUC_BO_CHUAN = [
    'readingList',
    'customDict',
    'customEngines',
    'fpt_key',
    'azure_key',
    'azure_region',
    'gcp_key',
    'miniPlayerMode',
    'isMiniPlayerMinimized',
    'miniPlayerPos',
    'customShortcuts',
    'customStopConfig',
    'stopAfterChapters',
    'stopTime',
    'stopRealtimeTarget',
    'giao_dien_chu_de',
    'phien_ban_du_lieu'
];

// Danh sách khóa hợp lệ của bộ nhớ đồng bộ (storage.sync)
export const CAC_KHOA_DONG_BO_CHUAN = [
    'maydoc',
    'speed',
    'volume',
    'voiceIndex',
    'voiceName',
    'tudongchuyenchuong',
    'smartPauses',
    'pauseComma',
    'pauseDot',
    'pausePara',
    'doctentruyen',
    'doctenchuong',
    'batphimtat',
    'thayNhanhWeb'
];

// Giá trị mặc định cho cấu hình đồng bộ
export const MAC_DINH_DONG_BO = {
    maydoc: 'auto',
    speed: 1.0,
    volume: 1.0,
    voiceIndex: 0,
    voiceName: '',
    tudongchuyenchuong: true,
    pauseComma: 300,
    pauseDot: 800,
    pausePara: 1200,
    smartPauses: 1200,
    doctentruyen: true,
    doctenchuong: true,
    batphimtat: true,
    thayNhanhWeb: 'off'
};

// So sánh hai chuỗi phiên bản dạng semver (-1, 0, 1)
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

// Chuẩn hóa một mục truyện từ định dạng cũ sang chuẩn hiện tại
export function chuan_hoa_muc_truyen(truyen_tho) {
    if (!truyen_tho || typeof truyen_tho !== 'object') return null;
    const tieu_de = (truyen_tho.title || truyen_tho.tieu_de || '').trim();
    if (!tieu_de) return null;

    let thoi_gian_luu = truyen_tho.savedAt || truyen_tho.saved_at || null;
    let moc_thoi_gian = truyen_tho.timestamp || null;

    if (!moc_thoi_gian && thoi_gian_luu) {
        const d = new Date(thoi_gian_luu).getTime();
        if (!isNaN(d)) moc_thoi_gian = d;
    }
    if (!moc_thoi_gian) moc_thoi_gian = Date.now();
    if (!thoi_gian_luu) thoi_gian_luu = new Date(moc_thoi_gian).toISOString();

    let chi_so_doan = truyen_tho.chunkIndex !== undefined ? truyen_tho.chunkIndex : (truyen_tho.chunk_index !== undefined ? truyen_tho.chunk_index : 0);
    if (chi_so_doan === null || isNaN(chi_so_doan) || chi_so_doan < 0) chi_so_doan = 0;

    let tong_so_doan = truyen_tho.chunkTotal !== undefined ? truyen_tho.chunkTotal : (truyen_tho.chunk_total !== undefined ? truyen_tho.chunk_total : null);
    if (tong_so_doan !== null && (isNaN(tong_so_doan) || tong_so_doan < 0)) tong_so_doan = null;

    return {
        title: tieu_de,
        url: truyen_tho.url || '',
        imgUrl: truyen_tho.imgUrl || truyen_tho.img_url || '',
        chap: truyen_tho.chap || '',
        savedAt: thoi_gian_luu,
        timestamp: moc_thoi_gian,
        chunkIndex: chi_so_doan,
        chunkTotal: tong_so_doan
    };
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

// Chuyển đổi dữ liệu đồng bộ từ bản 0.4.0 sang 0.4.1
export function chuyen_doi_dong_bo_040_sang_041(du_lieu_dong_bo_tho) {
    const nguon = du_lieu_dong_bo_tho && typeof du_lieu_dong_bo_tho === 'object' ? du_lieu_dong_bo_tho : {};
    const ket_qua = { ...MAC_DINH_DONG_BO };

    // Sao chép các giá trị hợp lệ đã lưu
    if (nguon.maydoc !== undefined) ket_qua.maydoc = nguon.maydoc;
    if (nguon.speed !== undefined && !isNaN(nguon.speed)) ket_qua.speed = nguon.speed;
    if (nguon.volume !== undefined && !isNaN(nguon.volume)) ket_qua.volume = nguon.volume;
    if (nguon.voiceIndex !== undefined && !isNaN(nguon.voiceIndex)) ket_qua.voiceIndex = parseInt(nguon.voiceIndex, 10);
    if (nguon.voiceName !== undefined) ket_qua.voiceName = String(nguon.voiceName);
    if (nguon.tudongchuyenchuong !== undefined) ket_qua.tudongchuyenchuong = Boolean(nguon.tudongchuyenchuong);
    if (nguon.doctentruyen !== undefined) ket_qua.doctentruyen = Boolean(nguon.doctentruyen);
    if (nguon.doctenchuong !== undefined) ket_qua.doctenchuong = Boolean(nguon.doctenchuong);
    if (nguon.batphimtat !== undefined) ket_qua.batphimtat = Boolean(nguon.batphimtat);

    // Chuẩn hóa trạng thái thay thế nhanh web
    if (nguon.thayNhanhWeb === true || nguon.thayNhanhWeb === 'on') {
        ket_qua.thayNhanhWeb = 'on';
    } else {
        ket_qua.thayNhanhWeb = 'off';
    }

    // Xử lý khoảng nghỉ và bù trừ lỗi lưu nhầm dấu phẩy vào smartPauses ở bản 0.4.0
    let gia_tri_phay = nguon.pauseComma !== undefined ? parseInt(nguon.pauseComma, 10) : undefined;
    let gia_tri_cham = nguon.pauseDot !== undefined ? parseInt(nguon.pauseDot, 10) : undefined;
    let gia_tri_doan = nguon.pausePara !== undefined ? parseInt(nguon.pausePara, 10) : undefined;
    let gia_tri_thong_minh = nguon.smartPauses !== undefined ? parseInt(nguon.smartPauses, 10) : undefined;

    if (gia_tri_phay !== undefined && !isNaN(gia_tri_phay)) {
        ket_qua.pauseComma = gia_tri_phay;
    } else if (gia_tri_thong_minh !== undefined && !isNaN(gia_tri_thong_minh) && gia_tri_thong_minh <= 500) {
        // Khôi phục giá trị dấu phẩy từ smartPauses cũ
        ket_qua.pauseComma = gia_tri_thong_minh;
    } else {
        ket_qua.pauseComma = MAC_DINH_DONG_BO.pauseComma;
    }

    if (gia_tri_cham !== undefined && !isNaN(gia_tri_cham)) {
        ket_qua.pauseDot = gia_tri_cham;
    } else {
        ket_qua.pauseDot = MAC_DINH_DONG_BO.pauseDot;
    }

    if (gia_tri_doan !== undefined && !isNaN(gia_tri_doan)) {
        ket_qua.pausePara = gia_tri_doan;
    } else if (gia_tri_thong_minh !== undefined && !isNaN(gia_tri_thong_minh) && gia_tri_thong_minh > 500) {
        ket_qua.pausePara = gia_tri_thong_minh;
    } else {
        ket_qua.pausePara = MAC_DINH_DONG_BO.pausePara;
    }

    ket_qua.smartPauses = ket_qua.pausePara;

    return ket_qua;
}

// Chuyển đổi dữ liệu cục bộ từ bản 0.4.0 sang 0.4.1
export function chuyen_doi_cuc_bo_040_sang_041(du_lieu_cuc_bo_tho) {
    const nguon = du_lieu_cuc_bo_tho && typeof du_lieu_cuc_bo_tho === 'object' ? du_lieu_cuc_bo_tho : {};
    const ket_qua = {};

    // Chuẩn hóa danh sách truyện đọc
    if (Array.isArray(nguon.readingList)) {
        ket_qua.readingList = chuan_hoa_danh_sach_truyen(nguon.readingList);
    } else {
        ket_qua.readingList = [];
    }

    // Giữ lại từ điển tùy chỉnh hợp lệ (hỗ trợ cả dạng mảng [tu_goc, tu_thay_the] và dạng đối tượng)
    if (Array.isArray(nguon.customDict)) {
        ket_qua.customDict = nguon.customDict.filter(muc => {
            if (Array.isArray(muc) && muc.length >= 2 && typeof muc[0] === 'string') return true;
            if (muc && typeof muc === 'object' && muc.tuGoc && muc.tuThayThe !== undefined) return true;
            return false;
        }).map(muc => Array.isArray(muc) ? [muc[0], muc[1]] : [muc.tuGoc, muc.tuThayThe]);
    } else {
        ket_qua.customDict = [];
    }

    // Giữ lại động cơ tùy chỉnh hợp lệ
    if (Array.isArray(nguon.customEngines)) {
        ket_qua.customEngines = nguon.customEngines.filter(item => item && item.id && item.name);
    } else {
        ket_qua.customEngines = [];
    }

    // Giữ nguyên các khóa API nếu đã cấu hình
    if (nguon.fpt_key) ket_qua.fpt_key = nguon.fpt_key;
    if (nguon.azure_key) ket_qua.azure_key = nguon.azure_key;
    if (nguon.azure_region) ket_qua.azure_region = nguon.azure_region;
    if (nguon.gcp_key) ket_qua.gcp_key = nguon.gcp_key;

    // Giữ nguyên cấu hình giao diện thu nhỏ và hẹn giờ dừng
    if (nguon.miniPlayerMode) ket_qua.miniPlayerMode = nguon.miniPlayerMode;
    if (nguon.isMiniPlayerMinimized !== undefined) ket_qua.isMiniPlayerMinimized = nguon.isMiniPlayerMinimized;
    if (nguon.miniPlayerPos) ket_qua.miniPlayerPos = nguon.miniPlayerPos;
    if (nguon.customShortcuts) ket_qua.customShortcuts = nguon.customShortcuts;
    if (nguon.customStopConfig) ket_qua.customStopConfig = nguon.customStopConfig;
    if (nguon.stopAfterChapters !== undefined) ket_qua.stopAfterChapters = nguon.stopAfterChapters;
    if (nguon.stopTime !== undefined) ket_qua.stopTime = nguon.stopTime;
    if (nguon.stopRealtimeTarget !== undefined) ket_qua.stopRealtimeTarget = nguon.stopRealtimeTarget;

    // Khởi tạo chủ đề giao diện sáng hoặc tối theo hệ thống nếu chưa có
    if (nguon.giao_dien_chu_de === 'light' || nguon.giao_dien_chu_de === 'dark') {
        ket_qua.giao_dien_chu_de = nguon.giao_dien_chu_de;
    } else {
        const la_sang = (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
        ket_qua.giao_dien_chu_de = la_sang ? 'light' : 'dark';
    }

    // Ghi nhận cờ phiên bản dữ liệu đã chuẩn hóa
    ket_qua.phien_ban_du_lieu = PHIEN_BAN_CHUAN;

    return ket_qua;
}

// Kiểm tra dữ liệu đã đạt chuẩn phiên bản hiện tại hay chưa
export function la_du_lieu_chuan_hien_tai(du_lieu) {
    if (!du_lieu || typeof du_lieu !== 'object') return false;
    const phien_ban = du_lieu.phien_ban || du_lieu.phienBan || du_lieu.phien_ban_du_lieu;
    if (!phien_ban) return false;
    return so_sanh_phien_ban(phien_ban, PHIEN_BAN_CHUAN) >= 0;
}

// Tự động kiểm tra và nâng cấp dữ liệu lưu trữ khi khởi chạy tiện ích
export async function chuyen_doi_du_lieu_khoi_chay() {
    return new Promise((resolve) => {
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
            resolve({ da_chuyen_doi: false, ly_do: 'Khong_co_chrome_storage' });
            return;
        }

        chrome.storage.local.get(null, dl_cuc_bo => {
            // Bỏ qua nếu dữ liệu đã được chuẩn hóa trước đó
            if (dl_cuc_bo && dl_cuc_bo.phien_ban_du_lieu && so_sanh_phien_ban(dl_cuc_bo.phien_ban_du_lieu, PHIEN_BAN_CHUAN) >= 0) {
                resolve({ da_chuyen_doi: false, ly_do: 'Da_chuan_hoa_truoc_do' });
                return;
            }

            chrome.storage.sync.get(null, dl_dong_bo => {
                // Nâng cấp đồng thời dữ liệu cục bộ và dữ liệu đồng bộ
                const cuc_bo_moi = chuyen_doi_cuc_bo_040_sang_041(dl_cuc_bo);
                const dong_bo_moi = chuyen_doi_dong_bo_040_sang_041(dl_dong_bo);

                const cong_viec = [];
                cong_viec.push(new Promise(res => chrome.storage.local.set(cuc_bo_moi, res)));
                cong_viec.push(new Promise(res => chrome.storage.sync.set(dong_bo_moi, res)));

                Promise.all(cong_viec).then(() => {
                    resolve({ da_chuyen_doi: true, phien_ban_moi: PHIEN_BAN_CHUAN });
                }).catch(err => {
                    resolve({ da_chuyen_doi: false, loi: err });
                });
            });
        });
    });
}

// Chuyển đổi dữ liệu từ tệp sao lưu JSON khi nhập dữ liệu
export function chuyen_doi_du_lieu_nhap(du_lieu_tho) {
    if (!du_lieu_tho || typeof du_lieu_tho !== 'object') {
        throw new Error('Dữ liệu JSON không hợp lệ');
    }

    const phien_ban = du_lieu_tho.phien_ban || du_lieu_tho.phienBan;
    const co_phan_tang = Boolean(du_lieu_tho.local || du_lieu_tho.cuc_bo);

    // Giữ nguyên dữ liệu nếu tệp đã đúng chuẩn hiện tại
    if (phien_ban && so_sanh_phien_ban(phien_ban, PHIEN_BAN_CHUAN) >= 0 && co_phan_tang) {
        const nguon_cuc_bo = du_lieu_tho.local || du_lieu_tho.cuc_bo || {};
        const nguon_dong_bo = du_lieu_tho.sync || du_lieu_tho.dong_bo || {};

        const cuc_bo_hop_le = {};
        for (const khoa of CAC_KHOA_CUC_BO_CHUAN) {
            if (nguon_cuc_bo[khoa] !== undefined) cuc_bo_hop_le[khoa] = nguon_cuc_bo[khoa];
        }
        if (cuc_bo_hop_le.readingList && !Array.isArray(cuc_bo_hop_le.readingList)) {
            delete cuc_bo_hop_le.readingList;
        }
        if (cuc_bo_hop_le.customDict && !Array.isArray(cuc_bo_hop_le.customDict)) {
            delete cuc_bo_hop_le.customDict;
        }
        if (cuc_bo_hop_le.customEngines && !Array.isArray(cuc_bo_hop_le.customEngines)) {
            delete cuc_bo_hop_le.customEngines;
        }

        const dong_bo_hop_le = {};
        for (const khoa of CAC_KHOA_DONG_BO_CHUAN) {
            if (nguon_dong_bo[khoa] !== undefined) dong_bo_hop_le[khoa] = nguon_dong_bo[khoa];
        }

        return {
            phien_ban: phien_ban,
            local: cuc_bo_hop_le,
            sync: dong_bo_hop_le,
            da_chuyen_doi: false
        };
    }

    // Tự động bóc tách và nâng cấp nếu tệp sao lưu từ bản cũ
    const nguon_phang = du_lieu_tho.local ? { ...du_lieu_tho.local, ...(du_lieu_tho.sync || {}) } : du_lieu_tho;

    const cuc_bo_chuan = chuyen_doi_cuc_bo_040_sang_041(nguon_phang);
    const dong_bo_chuan = chuyen_doi_dong_bo_040_sang_041(nguon_phang);

    // Chỉ giữ lại các khóa thuộc danh mục chuẩn
    const cuc_bo_cuoi_cung = {};
    for (const khoa of CAC_KHOA_CUC_BO_CHUAN) {
        if (cuc_bo_chuan[khoa] !== undefined) cuc_bo_cuoi_cung[khoa] = cuc_bo_chuan[khoa];
    }

    const dong_bo_cuoi_cung = {};
    for (const khoa of CAC_KHOA_DONG_BO_CHUAN) {
        if (dong_bo_chuan[khoa] !== undefined) dong_bo_cuoi_cung[khoa] = dong_bo_chuan[khoa];
    }

    return {
        phien_ban: PHIEN_BAN_CHUAN,
        local: cuc_bo_cuoi_cung,
        sync: dong_bo_cuoi_cung,
        da_chuyen_doi: true
    };
}

// Hỗ trợ truy cập qua biến toàn cục khi cần thiết
if (typeof self !== 'undefined') {
    self.DocTruyenSTV_ChuyenDoi = {
        PHIEN_BAN_CHUAN,
        CAC_KHOA_CUC_BO_CHUAN,
        CAC_KHOA_DONG_BO_CHUAN,
        MAC_DINH_DONG_BO,
        so_sanh_phien_ban,
        chuan_hoa_muc_truyen,
        chuan_hoa_danh_sach_truyen,
        chuyen_doi_dong_bo_040_sang_041,
        chuyen_doi_cuc_bo_040_sang_041,
        la_du_lieu_chuan_hien_tai,
        chuyen_doi_du_lieu_khoi_chay,
        chuyen_doi_du_lieu_nhap
    };
}
