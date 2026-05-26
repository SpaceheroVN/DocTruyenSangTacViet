'use strict';

const cac_tien_trinh_dang_tai = new Map();

self.addEventListener('activate', () => {
    for (const [maYeuCau, duLieu] of cac_tien_trinh_dang_tai.entries()) {
        if (duLieu.bo_dieu_khien) duLieu.bo_dieu_khien.abort();
    }
    cac_tien_trinh_dang_tai.clear();
});

const tre_co_huy = (ms, tin_hieu) => new Promise((dong_y, tu_choi) => {
    if (tin_hieu.aborted) return tu_choi(new DOMException('DaHuy', 'AbortError'));
    let dong_ho;
    const khi_huy = () => {
        clearTimeout(dong_ho);
        tu_choi(new DOMException('DaHuy', 'AbortError'));
    };
    dong_ho = setTimeout(() => {
        tin_hieu.removeEventListener('abort', khi_huy);
        dong_y();
    }, ms);
    tin_hieu.addEventListener('abort', khi_huy, { once: true });
});

async function tai_tu_fpt(van_ban, cau_hinh, tin_hieu_huy) {
    const cac_giong = ['banmai', 'leminh', 'thuminh', 'myan', 'giahuy', 'lannhi', 'linhsan'];
    const giong = cac_giong[cau_hinh.chi_so_giong] || 'banmai';
    const muc_toc_do = cau_hinh.toc_do > 1 ? 1 : (cau_hinh.toc_do < 1 ? -1 : 0);
    
    const phan_hoi = await fetch('https://api.fpt.ai/hmi/tts/v5', {
        method: 'POST',
        headers: { 'api-key': cau_hinh.khoa_fpt, 'voice': giong, 'speed': muc_toc_do.toString() },
        body: van_ban,
        signal: tin_hieu_huy
    });
    
    if (!phan_hoi.ok) throw new Error('Lỗi FPT');
    const ket_qua = await phan_hoi.json();
    if (ket_qua.error) throw new Error(ket_qua.message);
    
    for (let i = 0; i < 10; i++) {
        await tre_co_huy(3000, tin_hieu_huy);
        const kiem_tra = await fetch(ket_qua.async, { signal: tin_hieu_huy }).catch(e => {
            if (e.name === 'AbortError') throw e;
            throw new Error('Lỗi mạng FPT: ' + e.message);
        });
        if (kiem_tra.ok) {
            const loai_noi_dung = kiem_tra.headers.get('Content-Type') || '';
            if (loai_noi_dung.includes('audio')) {
                if (tin_hieu_huy.aborted) throw new DOMException('DaHuy', 'AbortError');
                return await kiem_tra.blob();
            }
            if (loai_noi_dung.includes('json')) {
                const json_body = await kiem_tra.json();
                if (json_body.message && json_body.message.toLowerCase().includes('processing')) {
                    continue;
                }
                throw new Error('Lỗi FPT: ' + (json_body.message || 'Lỗi không xác định'));
            } else if (!loai_noi_dung.includes('audio')) {
                throw new Error('FPT trả về định dạng không hợp lệ: ' + loai_noi_dung);
            }
            await kiem_tra.arrayBuffer(); 
        }
    }
    throw new Error('Hết thời gian chờ FPT render');
}

async function tai_tu_gcp(van_ban, cau_hinh, tin_hieu_huy) {
    const cac_giong = ['vi-VN-Wavenet-A', 'vi-VN-Wavenet-B', 'vi-VN-Wavenet-C', 'vi-VN-Wavenet-D', 'vi-VN-Standard-A', 'vi-VN-Standard-B', 'vi-VN-Standard-C', 'vi-VN-Standard-D'];
    const giong = cac_giong[cau_hinh.chi_so_giong] || 'vi-VN-Wavenet-A';
    const toc_do_an_toan = Number(cau_hinh.toc_do) || 1;
    
    const body = {
        input: { text: van_ban },
        voice: { languageCode: 'vi-VN', name: giong },
        audioConfig: { audioEncoding: 'MP3', speakingRate: toc_do_an_toan }
    };
    
    const phan_hoi = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${cau_hinh.khoa_gcp}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: tin_hieu_huy
    });
    
    if (!phan_hoi.ok) throw new Error('Lỗi Google Cloud TTS');
    const ket_qua = await phan_hoi.json();
    if (!ket_qua.audioContent) throw new Error('Không nhận được audio từ Google Cloud');
    
    const kytu = atob(ket_qua.audioContent);
    const arr = new Uint8Array(kytu.length);
    for (let i = 0; i < kytu.length; i++) arr[i] = kytu.charCodeAt(i);
    return new Blob([arr], { type: 'audio/mp3' });
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
    
    if (!phan_hoi.ok) throw new Error('Lỗi Azure');
    return await phan_hoi.blob();
}

async function lay_cau_hinh_api() {
    const du_lieu = await chrome.storage.local.get(['fpt_key', 'azure_key', 'azure_region', 'gcp_key']);
    return {
        khoa_fpt: (du_lieu.fpt_key || '').replace(/[^a-zA-Z0-9\-_]/g, ''),
        khoa_azure: (du_lieu.azure_key || '').replace(/[^a-zA-Z0-9\-_]/g, ''),
        vung_azure: du_lieu.azure_region || 'southeastasia',
        khoa_gcp: (du_lieu.gcp_key || '').replace(/[^a-zA-Z0-9\-_]/g, '')
    };
}

async function tai_am_thanh(van_ban, cong_cu, chi_so_giong, toc_do, tin_hieu_huy) {
    const cau_hinh = await lay_cau_hinh_api();
    cau_hinh.chi_so_giong = chi_so_giong;
    cau_hinh.toc_do = toc_do;
    
    if (cong_cu === 'fpt') return await tai_tu_fpt(van_ban, cau_hinh, tin_hieu_huy);
    if (cong_cu === 'azure') return await tai_tu_azure(van_ban, cau_hinh, tin_hieu_huy);
    if (cong_cu === 'gcp') return await tai_tu_gcp(van_ban, cau_hinh, tin_hieu_huy);
    throw new Error('Công cụ không hợp lệ');
}

function gui_phan_hoi_an_toan(ham_gui, du_lieu) {
    try {
        ham_gui(du_lieu);
    } catch(e) {}
}

chrome.runtime.onMessage.addListener((tin_nhan, nguoi_gui, gui_phan_hoi) => {
    if (nguoi_gui.tab && !nguoi_gui.tab.url.includes("sangtacviet.com")) return false;

    if (tin_nhan.hanhDong === 'taiAmThanh') {
        const { vanBan, congCu, chiSoGiong, tocDo, maYeuCau, khoaCache } = tin_nhan;
        if (typeof vanBan !== 'string' || vanBan.length > 5000) {
            gui_phan_hoi_an_toan(gui_phan_hoi, { error: 'Đoạn văn quá dài', maYeuCau });
            return true;
        }
        
        if (cac_tien_trinh_dang_tai.has(maYeuCau)) {
            cac_tien_trinh_dang_tai.get(maYeuCau).bo_dieu_khien.abort();
        }
        const bo_dieu_khien = new AbortController();
        cac_tien_trinh_dang_tai.set(maYeuCau, { bo_dieu_khien, id_the: nguoi_gui.tab?.id });

        (async () => {
            try {
                const audio_blob = await tai_am_thanh(vanBan, congCu, chiSoGiong, tocDo, bo_dieu_khien.signal);
                if (bo_dieu_khien.signal.aborted) throw new DOMException('DaHuy', 'AbortError');
                
                if (!khoaCache) {
                    gui_phan_hoi_an_toan(gui_phan_hoi, { error: 'Thiếu khóa cache', maYeuCau });
                    return;
                }
                
                const db = await mo_co_so_du_lieu();
                await luu_vao_db(db, khoaCache, audio_blob);
                gui_phan_hoi_an_toan(gui_phan_hoi, { success: true, maYeuCau });
            } catch(l) {
                gui_phan_hoi_an_toan(gui_phan_hoi, { error: l.message, biHuy: l.name === 'AbortError', maYeuCau });
            } finally {
                if (cac_tien_trinh_dang_tai.get(maYeuCau)?.bo_dieu_khien === bo_dieu_khien) {
                    cac_tien_trinh_dang_tai.delete(maYeuCau);
                }
            }
        })();
        
        return true; 
    } else if (tin_nhan.hanhDong === 'huyTaiAmThanh') {
        const { maYeuCau } = tin_nhan;
        if (maYeuCau && cac_tien_trinh_dang_tai.has(maYeuCau)) {
            cac_tien_trinh_dang_tai.get(maYeuCau).bo_dieu_khien.abort();
            cac_tien_trinh_dang_tai.delete(maYeuCau);
        }
    } else if (tin_nhan.hanhDong === 'huyTatCa') {
        const id_the_nguoi_gui = nguoi_gui.tab?.id;
        if (id_the_nguoi_gui) {
            for (const [ma_yeu_cau, du_lieu] of cac_tien_trinh_dang_tai.entries()) {
                if (du_lieu.id_the === id_the_nguoi_gui) {
                    du_lieu.bo_dieu_khien.abort();
                    cac_tien_trinh_dang_tai.delete(ma_yeu_cau);
                }
            }
        }
    }
});

chrome.tabs.onRemoved.addListener((id_the) => {
    for (const [ma_yeu_cau, du_lieu] of cac_tien_trinh_dang_tai.entries()) {
        if (du_lieu.id_the === id_the) {
            du_lieu.bo_dieu_khien.abort();
            cac_tien_trinh_dang_tai.delete(ma_yeu_cau);
        }
    }
});

chrome.tabs.onUpdated.addListener((id_the, thong_tin) => {
    if (thong_tin.status === 'loading' || thong_tin.url) {
        for (const [ma_yeu_cau, du_lieu] of cac_tien_trinh_dang_tai.entries()) {
            if (du_lieu.id_the === id_the) {
                du_lieu.bo_dieu_khien.abort();
                cac_tien_trinh_dang_tai.delete(ma_yeu_cau);
            }
        }
    }
});

let _db_instance = null;

function mo_co_so_du_lieu() {
    if (_db_instance) return Promise.resolve(_db_instance);
    return new Promise((dong_y, tu_choi) => {
        const yeu_cau = indexedDB.open('STV_TTS_Cache', 1);
        yeu_cau.onupgradeneeded = (su_kien) => {
            if (!su_kien.target.result.objectStoreNames.contains('audioBlobs')) {
                su_kien.target.result.createObjectStore('audioBlobs');
            }
        };
        yeu_cau.onsuccess = (su_kien) => {
            _db_instance = su_kien.target.result;
            _db_instance.onclose = () => { _db_instance = null; };
            dong_y(_db_instance);
        };
        yeu_cau.onerror = (su_kien) => tu_choi(su_kien.target.error);
    });
}

function luu_vao_db(db, khoa, blob) {
    return new Promise((dong_y, tu_choi) => {
        const giao_dich = db.transaction('audioBlobs', 'readwrite');
        giao_dich.objectStore('audioBlobs').put({ blob: blob, timestamp: Date.now() }, khoa);
        giao_dich.oncomplete = () => dong_y();
        giao_dich.onerror = (su_kien) => tu_choi(su_kien.target.error);
    });
}
