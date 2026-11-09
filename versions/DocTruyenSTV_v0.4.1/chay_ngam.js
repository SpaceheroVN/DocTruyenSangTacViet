'use strict';

import { chuyen_doi_du_lieu_khoi_chay } from './chuyen_doi.js';

const cac_tien_trinh_dang_tai = new Map();

self.addEventListener('activate', () => {
    for (const [ma_yeu_cau, du_lieu] of cac_tien_trinh_dang_tai.entries()) {
        if (du_lieu.bo_dieu_khien) du_lieu.bo_dieu_khien.abort();
    }
    cac_tien_trinh_dang_tai.clear();
});

let _keepalive_interval = null;

function bat_dau_keepalive() {
    if (_keepalive_interval) return;
    _keepalive_interval = setInterval(() => {
        if (cac_tien_trinh_dang_tai.size === 0) {
            dung_keepalive();
        } else if (chrome.runtime && chrome.runtime.getPlatformInfo) {
            chrome.runtime.getPlatformInfo().catch(() => {});
        }
    }, 20000);
}

function dung_keepalive() {
    if (_keepalive_interval) {
        clearInterval(_keepalive_interval);
        _keepalive_interval = null;
    }
}

async function blob_sang_base64(blob) {
    const mang_buffer = await blob.arrayBuffer();
    const mang_byte = new Uint8Array(mang_buffer);
    const CHUNK = 8192;
    let binary = '';
    for (let i = 0; i < mang_byte.length; i += CHUNK) {
        binary += String.fromCharCode.apply(null, mang_byte.subarray(i, i + CHUNK));
    }
    return btoa(binary);
}

const ngu = (so_mili_giay, tin_hieu) => new Promise((dong_y, tu_choi) => {
    const khi_huy = () => {
        clearTimeout(dong_ho);
        tu_choi(new DOMException('DaHuy', 'AbortError'));
    };
    const dong_ho = setTimeout(() => {
        if (tin_hieu) tin_hieu.removeEventListener('abort', khi_huy);
        dong_y();
    }, so_mili_giay);
    if (tin_hieu) {
        if (tin_hieu.aborted) {
            clearTimeout(dong_ho);
            return tu_choi(new DOMException('DaHuy', 'AbortError'));
        }
        tin_hieu.addEventListener('abort', khi_huy);
    }
});

async function tai_tu_fpt(van_ban, cau_hinh, tin_hieu_huy, thay_nhanh_web) {
    const cac_giong = ['banmai', 'leminh', 'thuminh', 'myan', 'giahuy', 'lannhi', 'linhsan'];
    const giong = cac_giong[cau_hinh.chi_so_giong] || 'banmai';
    const toc_do_fpt = Math.max(-3, Math.min(3, Math.round((cau_hinh.toc_do - 1) * 3)));

    const phan_hoi = await fetch('https://api.fpt.ai/hsv2', {
        method: 'POST',
        headers: {
            'api-key': cau_hinh.khoa_fpt,
            'voice': giong,
            'speed': String(toc_do_fpt)
        },
        body: van_ban,
        signal: tin_hieu_huy
    });

    if (phan_hoi.status === 401 || phan_hoi.status === 403) throw new Error('Lỗi 401: Key FPT không hợp lệ');
    if (phan_hoi.status === 429) throw new Error('Lỗi 429: Hết hạn mức FPT (Quota Exceeded)');
    if (!phan_hoi.ok) throw new Error('Lỗi HTTP FPT: ' + phan_hoi.status);

    const ket_qua = await phan_hoi.json();
    if (ket_qua.error !== 0 && ket_qua.error !== '0') {
        throw new Error('Lỗi API FPT: ' + (ket_qua.message || 'Mã lỗi ' + ket_qua.error));
    }

    const duong_dan_am_thanh = ket_qua.async;
    if (!duong_dan_am_thanh) throw new Error('FPT không trả về link âm thanh async');

    const bat_dau = Date.now();
    let thoi_gian_toi_da = Math.max(16000, van_ban.length * 60);
    if (thay_nhanh_web === 'extreme') thoi_gian_toi_da = 1000;
    else if (thay_nhanh_web === 'on' || thay_nhanh_web === true) thoi_gian_toi_da = Math.max(7000, van_ban.length * 35);

    let do_tre = 350;

    while (Date.now() - bat_dau < thoi_gian_toi_da) {
        if (tin_hieu_huy.aborted) throw new DOMException('DaHuy', 'AbortError');
        await ngu(do_tre, tin_hieu_huy);

        const kiem_tra = await fetch(duong_dan_am_thanh, { signal: tin_hieu_huy });
        if (kiem_tra.ok) {
            const loai_noi_dung = kiem_tra.headers.get('content-type') || '';
            if (loai_noi_dung.includes('audio') || loai_noi_dung.includes('octet-stream')) {
                return await kiem_tra.blob();
            } else if (loai_noi_dung.includes('json') || loai_noi_dung.includes('text')) {
                const text_body = await kiem_tra.text();
                let json_body = {};
                try { json_body = JSON.parse(text_body); } catch(e) {}
                if (json_body.message && json_body.message.toLowerCase().includes('processing')) {
                    do_tre = Math.min(do_tre * 1.4, 2000);
                    continue;
                }
                throw new Error('Lỗi FPT: ' + (json_body.message || 'Lỗi không xác định'));
            } else {
                await kiem_tra.text();
                throw new Error('FPT trả về định dạng không hợp lệ: ' + loai_noi_dung);
            }
        } else if (kiem_tra.status === 404 || kiem_tra.status === 202 || kiem_tra.status === 503) {
            await kiem_tra.text();
            do_tre = Math.min(do_tre * 1.4, 2000);
            continue;
        } else {
            await kiem_tra.text();
            throw new Error('HTTP Error FPT: ' + kiem_tra.status);
        }
    }
    throw new Error('Hết thời gian chờ FPT render');
}

async function tai_tu_gcp(van_ban, cau_hinh, tin_hieu_huy) {
    const cac_giong = ['vi-VN-Neural2-A', 'vi-VN-Neural2-D', 'vi-VN-Wavenet-A', 'vi-VN-Wavenet-B', 'vi-VN-Wavenet-C', 'vi-VN-Wavenet-D', 'vi-VN-Standard-A', 'vi-VN-Standard-B', 'vi-VN-Standard-C', 'vi-VN-Standard-D'];
    const giong = cac_giong[cau_hinh.chi_so_giong] || 'vi-VN-Neural2-A';
    const toc_do_an_toan = Number(cau_hinh.toc_do) || 1;

    const body = {
        input: { text: van_ban },
        voice: { languageCode: 'vi-VN', name: giong },
        audioConfig: { audioEncoding: 'MP3', speakingRate: toc_do_an_toan }
    };

    const phan_hoi = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': cau_hinh.khoa_gcp
        },
        body: JSON.stringify(body),
        signal: tin_hieu_huy
    });

    if (!phan_hoi.ok) {
        const van_ban_loi = await phan_hoi.text().catch(() => '');
        throw new Error(`Lỗi Google Cloud TTS: ${phan_hoi.status} ${van_ban_loi}`);
    }
    const ket_qua = await phan_hoi.json();
    if (!ket_qua.audioContent) throw new Error('Không nhận được audio từ Google Cloud');

    const chuoi_nhi_phan = atob(ket_qua.audioContent);
    const do_dai = chuoi_nhi_phan.length;
    const cac_byte = new Uint8Array(do_dai);
    for (let i = 0; i < do_dai; i++) {
        cac_byte[i] = chuoi_nhi_phan.charCodeAt(i);
    }
    return new Blob([cac_byte], { type: 'audio/mp3' });
}

async function tai_tu_azure(van_ban, cau_hinh, tin_hieu_huy) {
    const cac_giong = ['vi-VN-HoaiMyNeural', 'vi-VN-NamMinhNeural'];
    const giong = cac_giong[cau_hinh.chi_so_giong] || 'vi-VN-HoaiMyNeural';
    const van_ban_an_toan = String(van_ban).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const toc_do_an_toan = Number(cau_hinh.toc_do) || 1;
    const ssml = `<speak version='1.0' xml:lang='vi-VN'><voice name='${giong}'><prosody rate='${toc_do_an_toan}'>${van_ban_an_toan}</prosody></voice></speak>`;
    const reg_vung = /^[a-z0-9-]{2,30}$/;
    const vung_an_toan = reg_vung.test(cau_hinh.vung_azure) ? cau_hinh.vung_azure : 'southeastasia';

    const phan_hoi = await fetch(`https://${vung_an_toan}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': cau_hinh.khoa_azure,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
        },
        body: ssml,
        signal: tin_hieu_huy
    });

    if (!phan_hoi.ok) {
        const van_ban_loi = await phan_hoi.text().catch(() => '');
        throw new Error(`Lỗi Azure TTS: ${phan_hoi.status} ${van_ban_loi}`);
    }
    return await phan_hoi.blob();
}

async function tai_tu_khac(van_ban, cau_hinh, tin_hieu_huy, id_cong_cu) {
    const dong_co = cau_hinh.customEngines.find(e => String(e.id) === String(id_cong_cu));
    if (!dong_co) throw new Error('Không tìm thấy cấu hình engine custom');

    const van_ban_an_toan = van_ban.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    const chuoi_than_mau = dong_co.than_mau || dong_co.bodyTemplate || '';
    let chuoi_than = chuoi_than_mau;
    chuoi_than = chuoi_than.replace(/\{\{van_ban\}\}/g, van_ban_an_toan);
    chuoi_than = chuoi_than.replace(/\{\{toc_do\}\}/g, cau_hinh.toc_do);
    chuoi_than = chuoi_than.replace(/\{\{chi_so_giong\}\}/g, cau_hinh.chi_so_giong);
    chuoi_than = chuoi_than.replace(/\{\{giong\}\}/g, cau_hinh.chi_so_giong);

    let doi_tuong_headers = {};
    if (dong_co.headers) {
        try { doi_tuong_headers = JSON.parse(dong_co.headers); } catch (e) { }
    }

    const phuong_thuc = (dong_co.method || 'POST').toUpperCase();
    const cac_tuy_chon = {
        method: phuong_thuc,
        headers: doi_tuong_headers,
        signal: tin_hieu_huy
    };
    if (phuong_thuc !== 'GET' && phuong_thuc !== 'HEAD' && chuoi_than) {
        cac_tuy_chon.body = chuoi_than;
    }

    const phan_hoi_res = await fetch(dong_co.endpoint, cac_tuy_chon);
    if (!phan_hoi_res.ok) {
        const van_ban_loi = await phan_hoi_res.text().catch(() => '');
        throw new Error(`Lỗi Custom TTS: ${phan_hoi_res.status} ${van_ban_loi}`);
    }

    const duong_dan_phan_hoi = dong_co.duong_dan_phan_hoi || dong_co.responsePath;
    if (duong_dan_phan_hoi) {
        const du_lieu_res = await phan_hoi_res.json();
        const cac_phan = duong_dan_phan_hoi.split('.');
        let gia_tri_tim = du_lieu_res;
        for (const phan_tu of cac_phan) {
            gia_tri_tim = gia_tri_tim ? gia_tri_tim[phan_tu] : undefined;
        }
        if (!gia_tri_tim) throw new Error(`Không tìm thấy dữ liệu theo responsePath: ${duong_dan_phan_hoi}`);

        if (gia_tri_tim.startsWith('http://') || gia_tri_tim.startsWith('https://')) {
            const phan_hoi_am_thanh = await fetch(gia_tri_tim, { signal: tin_hieu_huy });
            return await phan_hoi_am_thanh.blob();
        } else if (gia_tri_tim.startsWith('data:audio') || gia_tri_tim.length > 500) {
            const url_du_lieu = gia_tri_tim.startsWith('data:') ? gia_tri_tim : `data:audio/mp3;base64,${gia_tri_tim}`;
            const phan_hoi_tai = await fetch(url_du_lieu);
            return await phan_hoi_tai.blob();
        }
        throw new Error('Dữ liệu trả về không phải URL hoặc Base64 audio hợp lệ');
    } else {
        return await phan_hoi_res.blob();
    }
}

async function lay_cau_hinh_api() {
    const du_lieu = await chrome.storage.local.get(['fpt_key', 'azure_key', 'azure_region', 'gcp_key', 'customEngines']);
    return {
        khoa_fpt: (du_lieu.fpt_key || '').replace(/[\x00-\x1F\x7F\s]/g, '').slice(0, 200),
        khoa_azure: (du_lieu.azure_key || '').replace(/[\x00-\x1F\x7F\s]/g, '').slice(0, 200),
        vung_azure: du_lieu.azure_region || 'southeastasia',
        khoa_gcp: (du_lieu.gcp_key || '').replace(/[\x00-\x1F\x7F\s]/g, '').slice(0, 200),
        customEngines: du_lieu.customEngines || []
    };
}

async function tai_am_thanh(van_ban, cong_cu, chi_so_giong, toc_do, tin_hieu_huy, thay_nhanh_web) {
    const cau_hinh = await lay_cau_hinh_api();
    cau_hinh.chi_so_giong = parseInt(chi_so_giong, 10) || 0;
    cau_hinh.toc_do = toc_do;

    let tien_to_dong_co = cong_cu;
    if (cong_cu.startsWith('fpt_') || cong_cu.startsWith('azure_') || cong_cu.startsWith('gcp_')) {
        const dong_co = cau_hinh.customEngines.find(e => String(e.id) === String(cong_cu));
        if (dong_co) {
            tien_to_dong_co = dong_co.type;
            const khoa_api = dong_co.khoa_api || dong_co.apiKey;
            if (tien_to_dong_co === 'fpt') cau_hinh.khoa_fpt = khoa_api;
            if (tien_to_dong_co === 'azure') {
                cau_hinh.khoa_azure = khoa_api;
                if (dong_co.region) cau_hinh.vung_azure = dong_co.region;
            }
            if (tien_to_dong_co === 'gcp') cau_hinh.khoa_gcp = khoa_api;
        }
    }

    if (tien_to_dong_co === 'fpt') return await tai_tu_fpt(van_ban, cau_hinh, tin_hieu_huy, thay_nhanh_web);
    if (tien_to_dong_co === 'azure') return await tai_tu_azure(van_ban, cau_hinh, tin_hieu_huy);
    if (tien_to_dong_co === 'gcp') return await tai_tu_gcp(van_ban, cau_hinh, tin_hieu_huy);
    if (tien_to_dong_co.startsWith('khac_')) return await tai_tu_khac(van_ban, cau_hinh, tin_hieu_huy, cong_cu);
    throw new Error('Công cụ không hợp lệ');
}

function gui_phan_hoi_an_toan(ham_gui, du_lieu) {
    try {
        ham_gui(du_lieu);
    } catch (e) { }
}

// Hủy toàn bộ tiến trình tải âm thanh của một thẻ hoặc tất cả
function huy_tien_trinh_the(id_the_muc_tieu) {
    for (const [khoa, tt] of cac_tien_trinh_dang_tai.entries()) {
        if (!id_the_muc_tieu || tt.id_the === id_the_muc_tieu || id_the_muc_tieu === 'system') {
            try { tt.bo_dieu_khien.abort(); } catch (loi) { }
            cac_tien_trinh_dang_tai.delete(khoa);
        }
    }
    if (cac_tien_trinh_dang_tai.size === 0) dung_keepalive();
}

chrome.runtime.onMessage.addListener((tin_nhan, nguoi_gui, gui_phan_hoi) => {
    if (nguoi_gui.tab) {
        try {
            const hostname = new URL(nguoi_gui.tab.url).hostname;
            if (hostname !== 'sangtacviet.com' && !hostname.endsWith('.sangtacviet.com')) return false;
        } catch (e) { return false; }
    } else if (nguoi_gui.id !== chrome.runtime.id) {
        return false;
    }

    if (tin_nhan.hanhDong === 'taiAmThanh') {
        const van_ban = tin_nhan.van_ban !== undefined ? tin_nhan.van_ban : tin_nhan.vanBan;
        const cong_cu = tin_nhan.cong_cu || tin_nhan.congCu;
        const chi_so_giong = tin_nhan.chi_so_giong !== undefined ? tin_nhan.chi_so_giong : tin_nhan.chiSoGiong;
        const toc_do = tin_nhan.toc_do !== undefined ? tin_nhan.toc_do : tin_nhan.tocDo;
        const ma_yeu_cau = tin_nhan.ma_yeu_cau || tin_nhan.maYeuCau;
        const khoa_cache = tin_nhan.khoa_cache || tin_nhan.khoaCache;
        const thay_nhanh_web = tin_nhan.thay_nhanh_web !== undefined ? tin_nhan.thay_nhanh_web : tin_nhan.thayNhanhWeb;

        if (typeof van_ban !== 'string' || van_ban.length > 5000) {
            gui_phan_hoi_an_toan(gui_phan_hoi, { error: 'Đoạn văn quá dài', maYeuCau: ma_yeu_cau, ma_yeu_cau });
            return true;
        }

        const id_the = nguoi_gui.tab?.id || nguoi_gui.id || 'system';
        const bo_dieu_khien = new AbortController();
        const ma_dinh_danh = id_the + '_' + (ma_yeu_cau || Date.now());
        cac_tien_trinh_dang_tai.set(ma_dinh_danh, { bo_dieu_khien, id_the, maYeuCau: ma_yeu_cau, ma_yeu_cau });

        bat_dau_keepalive();

        (async () => {
            let dong_ho_het_gio = null;
            try {
                const tien_trinh_cho = new Promise((dong_y, tu_choi) => {
                    let thoi_gian_cho_toi_da = Math.max(18000, van_ban.length * 70);
                    if (thay_nhanh_web === 'extreme') thoi_gian_cho_toi_da = 1000;
                    else if (thay_nhanh_web === 'on' || thay_nhanh_web === true) thoi_gian_cho_toi_da = Math.max(8000, van_ban.length * 40);

                    dong_ho_het_gio = setTimeout(() => {
                        bo_dieu_khien.abort();
                        tu_choi(new Error('Hết thời gian API'));
                    }, thoi_gian_cho_toi_da);

                    tai_am_thanh(van_ban, cong_cu, chi_so_giong, toc_do, bo_dieu_khien.signal, thay_nhanh_web)
                        .then(dong_y)
                        .catch(tu_choi);
                });

                const audio_blob = await tien_trinh_cho;

                if (bo_dieu_khien.signal.aborted && audio_blob === undefined) throw new DOMException('DaHuy', 'AbortError');

                if (!khoa_cache) {
                    gui_phan_hoi_an_toan(gui_phan_hoi, { error: 'Thiếu khóa cache', maYeuCau: ma_yeu_cau, ma_yeu_cau });
                    return;
                }

                const am_thanh_base64 = await blob_sang_base64(audio_blob);
                gui_phan_hoi_an_toan(gui_phan_hoi, {
                    success: true,
                    maYeuCau: ma_yeu_cau,
                    ma_yeu_cau,
                    audioBase64: am_thanh_base64,
                    audio_base64: am_thanh_base64,
                    audioType: audio_blob.type || 'audio/mpeg',
                    audio_type: audio_blob.type || 'audio/mpeg'
                });
            } catch (l) {
                gui_phan_hoi_an_toan(gui_phan_hoi, {
                    error: l.message,
                    biHuy: l.name === 'AbortError',
                    bi_huy: l.name === 'AbortError',
                    maYeuCau: ma_yeu_cau,
                    ma_yeu_cau
                });
            } finally {
                if (dong_ho_het_gio) clearTimeout(dong_ho_het_gio);
                cac_tien_trinh_dang_tai.delete(ma_dinh_danh);
                if (cac_tien_trinh_dang_tai.size === 0) dung_keepalive();
            }
        })();

        return true;
    } else if (tin_nhan.hanhDong === 'layTabIdHienTai') {
        const id_the = nguoi_gui.tab ? nguoi_gui.tab.id : null;
        gui_phan_hoi({ tabId: id_the, id_the });
        return false;
    } else if (tin_nhan.hanhDong === 'huyTaiAmThanh' || tin_nhan.hanhDong === 'huyTatCa') {
        const id_the = nguoi_gui.tab?.id || nguoi_gui.id || 'system';
        huy_tien_trinh_the(id_the);
    }
});

chrome.tabs.onRemoved.addListener((id_the) => {
    huy_tien_trinh_the(id_the);
    chrome.storage.local.get(['stv_tab_dang_phat'], du_lieu => {
        if (du_lieu.stv_tab_dang_phat && (du_lieu.stv_tab_dang_phat.tabId === id_the || du_lieu.stv_tab_dang_phat.id_the === id_the)) {
            chrome.storage.local.remove('stv_tab_dang_phat');
        }
    });
});

chrome.tabs.onUpdated.addListener((id_the, thong_tin) => {
    if (thong_tin.status === 'loading' || thong_tin.url) {
        huy_tien_trinh_the(id_the);
        chrome.storage.local.get(['stv_tab_dang_phat'], du_lieu => {
            if (du_lieu.stv_tab_dang_phat && (du_lieu.stv_tab_dang_phat.tabId === id_the || du_lieu.stv_tab_dang_phat.id_the === id_the)) {
                chrome.storage.local.remove('stv_tab_dang_phat');
            }
        });
    }
});

// Quản lý chuyển đổi và tương thích ngược dữ liệu khi cài đặt hoặc nâng cấp
chrome.runtime.onInstalled.addListener(() => {
    chuyen_doi_du_lieu_khoi_chay();
});

chrome.runtime.onStartup.addListener(() => {
    chuyen_doi_du_lieu_khoi_chay();
});

chuyen_doi_du_lieu_khoi_chay();