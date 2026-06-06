'use strict';

const cac_tien_trinh_dang_tai = new Map();

let _db_instance = null;
let _db_promise = null;

function mo_co_so_du_lieu() {
    if (_db_instance) return Promise.resolve(_db_instance);
    if (_db_promise) return _db_promise;

    _db_promise = new Promise((dong_y, tu_choi) => {
        const yeu_cau = indexedDB.open('STV_TTS_Cache', 1);
        yeu_cau.onupgradeneeded = (su_kien) => {
            if (!su_kien.target.result.objectStoreNames.contains('audioBlobs')) {
                su_kien.target.result.createObjectStore('audioBlobs');
            }
        };
        yeu_cau.onsuccess = (su_kien) => {
            _db_instance = su_kien.target.result;
            _db_instance.onclose = () => { _db_instance = null; _db_promise = null; };
            dong_y(_db_instance);
        };
        yeu_cau.onerror = (su_kien) => {
            _db_promise = null;
            tu_choi(su_kien.target.error);
        };
    });
    return _db_promise;
}

function luu_vao_db(db, khoa, blob) {
    return new Promise((dong_y, tu_choi) => {
        const giao_dich = db.transaction('audioBlobs', 'readwrite');
        giao_dich.objectStore('audioBlobs').put({ blob: blob, timestamp: Date.now() }, khoa);
        giao_dich.oncomplete = () => dong_y();
        giao_dich.onerror = (su_kien) => tu_choi(su_kien.target.error);
    });
}
self.addEventListener('activate', () => {
    for (const [maYeuCau, duLieu] of cac_tien_trinh_dang_tai.entries()) {
        if (duLieu.bo_dieu_khien) duLieu.bo_dieu_khien.abort();
    }
    cac_tien_trinh_dang_tai.clear();
});

const sleep = (ms, signal) => new Promise((resolve, reject) => {
    const onAbort = () => {
        clearTimeout(timeout);
        reject(new DOMException('DaHuy', 'AbortError'));
    };
    const timeout = setTimeout(() => {
        if (signal) signal.removeEventListener('abort', onAbort);
        resolve();
    }, ms);
    if (signal) {
        if (signal.aborted) return onAbort();
        signal.addEventListener('abort', onAbort, { once: true });
    }
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
    
    if (!phan_hoi.ok) throw new Error('Lỗi FPT: ' + phan_hoi.status);
    const ket_qua = await phan_hoi.json();
    if (ket_qua.error && ket_qua.error !== 0 && ket_qua.error !== '0') throw new Error(ket_qua.message || 'Lỗi FPT');
    if (ket_qua.success === 'false' || ket_qua.success === false) throw new Error(ket_qua.message || 'Lỗi FPT');
    
    let async_link = ket_qua.async;
    if (!async_link && ket_qua.success && ket_qua.message && ket_qua.message.startsWith('http')) {
        async_link = ket_qua.message;
    }
    if (!async_link) throw new Error('Không nhận được link audio từ FPT');
    
    for (let i = 0; i < 10; i++) {
        if (tin_hieu_huy.aborted) throw new DOMException('DaHuy', 'AbortError');
        const delay = Math.min(500 * Math.pow(1.5, i), 5000);
        await sleep(delay, tin_hieu_huy);
        const kiem_tra = await fetch(async_link, { signal: tin_hieu_huy }).catch(e => {
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
            } else {
                await kiem_tra.text();
                throw new Error('FPT trả về định dạng không hợp lệ: ' + loai_noi_dung);
            }
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
    
    if (!phan_hoi.ok) throw new Error('Lỗi Google Cloud TTS');
    const ket_qua = await phan_hoi.json();
    if (!ket_qua.audioContent) throw new Error('Không nhận được audio từ Google Cloud');
    
    const binaryStr = atob(ket_qua.audioContent);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'audio/mp3' });
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

async function tai_tu_khac(van_ban, cau_hinh, tin_hieu_huy, id_cong_cu) {
    const engine = cau_hinh.customEngines.find(e => String(e.id) === String(id_cong_cu));
    if (!engine) throw new Error('Không tìm thấy cấu hình engine custom');

    const van_ban_an_toan = van_ban.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    let bodyStr = engine.bodyTemplate || '';
    bodyStr = bodyStr.replace(/\{\{van_ban\}\}/g, van_ban_an_toan);
    bodyStr = bodyStr.replace(/\{\{toc_do\}\}/g, cau_hinh.toc_do);

    let headersObj = {};
    if (engine.headers) {
        try { headersObj = JSON.parse(engine.headers); } catch(e) {}
    }

    const options = {
        method: engine.method || 'POST',
        headers: headersObj,
        signal: tin_hieu_huy
    };
    if (engine.method !== 'GET' && engine.method !== 'HEAD' && bodyStr) {
        options.body = bodyStr;
    }

    const phan_hoi = await fetch(engine.url, options);
    if (!phan_hoi.ok) throw new Error(`Lỗi HTTP Custom API: ${phan_hoi.status}`);

    const audioPath = (engine.audioPath || '').trim();
    if (!audioPath) return await phan_hoi.blob();

    const ket_qua = await phan_hoi.json();
    let val = ket_qua;
    const parts = audioPath.split('.');
    for (const p of parts) {
        if (val === undefined || val === null) break;
        val = val[p];
    }

    if (!val) throw new Error('Không tìm thấy audio tại đường dẫn ' + audioPath);

    if (String(val).startsWith('http://') || String(val).startsWith('https://')) {
        const res2 = await fetch(val, { signal: tin_hieu_huy });
        if (!res2.ok) throw new Error('Lỗi tải audio từ URL: ' + res2.status);
        return await res2.blob();
    } else {
        let base64Data = String(val);
        if (base64Data.startsWith('data:')) base64Data = base64Data.split(',')[1];
        const binaryStr = atob(base64Data);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryStr.charCodeAt(i);
        return new Blob([bytes], { type: 'audio/mpeg' });
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

async function tai_am_thanh(van_ban, cong_cu, chi_so_giong, toc_do, tin_hieu_huy) {
    const cau_hinh = await lay_cau_hinh_api();
    cau_hinh.chi_so_giong = chi_so_giong;
    cau_hinh.toc_do = toc_do;
    
    let enginePrefix = cong_cu;
    if (cong_cu.startsWith('fpt_') || cong_cu.startsWith('azure_') || cong_cu.startsWith('gcp_')) {
        const engine = cau_hinh.customEngines.find(e => String(e.id) === String(cong_cu));
        if (engine) {
            enginePrefix = engine.type;
            if (enginePrefix === 'fpt') cau_hinh.khoa_fpt = engine.apiKey;
            if (enginePrefix === 'azure') {
                cau_hinh.khoa_azure = engine.apiKey;
                if (engine.region) cau_hinh.vung_azure = engine.region;
            }
            if (enginePrefix === 'gcp') cau_hinh.khoa_gcp = engine.apiKey;
        }
    }

    if (enginePrefix === 'fpt') return await tai_tu_fpt(van_ban, cau_hinh, tin_hieu_huy);
    if (enginePrefix === 'azure') return await tai_tu_azure(van_ban, cau_hinh, tin_hieu_huy);
    if (enginePrefix === 'gcp') return await tai_tu_gcp(van_ban, cau_hinh, tin_hieu_huy);
    if (enginePrefix.startsWith('khac_')) return await tai_tu_khac(van_ban, cau_hinh, tin_hieu_huy, cong_cu);
    throw new Error('Công cụ không hợp lệ');
}

function gui_phan_hoi_an_toan(ham_gui, du_lieu) {
    try {
        ham_gui(du_lieu);
    } catch(e) {}
}

chrome.runtime.onMessage.addListener((tin_nhan, nguoi_gui, gui_phan_hoi) => {
    if (nguoi_gui.tab) {
        try {
            if (!new URL(nguoi_gui.tab.url).hostname.endsWith('sangtacviet.com')) return false;
        } catch(e) { return false; }
    } else if (nguoi_gui.id !== chrome.runtime.id) {
        return false;
    }

    if (tin_nhan.hanhDong === 'taiAmThanh') {
        const { vanBan, congCu, chiSoGiong, tocDo, maYeuCau, khoaCache } = tin_nhan;
        if (typeof vanBan !== 'string' || vanBan.length > 5000) {
            gui_phan_hoi_an_toan(gui_phan_hoi, { error: 'Đoạn văn quá dài', maYeuCau });
            return true;
        }
        
        const id_the = nguoi_gui.tab?.id || nguoi_gui.id || 'system';
        if (cac_tien_trinh_dang_tai.has(id_the)) {
            cac_tien_trinh_dang_tai.get(id_the).bo_dieu_khien.abort();
        }
        const bo_dieu_khien = new AbortController();
        cac_tien_trinh_dang_tai.set(id_the, { bo_dieu_khien, maYeuCau: maYeuCau });

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
                if (cac_tien_trinh_dang_tai.get(id_the)?.bo_dieu_khien === bo_dieu_khien) {
                    cac_tien_trinh_dang_tai.delete(id_the);
                }
            }
        })();
        
        return true; 
    } else if (tin_nhan.hanhDong === 'huyTaiAmThanh') {
        const id_the = nguoi_gui.tab?.id || nguoi_gui.id || 'system';
        if (cac_tien_trinh_dang_tai.has(id_the)) {
            cac_tien_trinh_dang_tai.get(id_the).bo_dieu_khien.abort();
            cac_tien_trinh_dang_tai.delete(id_the);
        }
    } else if (tin_nhan.hanhDong === 'huyTatCa') {
        const id_the = nguoi_gui.tab?.id || nguoi_gui.id || 'system';
        if (cac_tien_trinh_dang_tai.has(id_the)) {
            cac_tien_trinh_dang_tai.get(id_the).bo_dieu_khien.abort();
            cac_tien_trinh_dang_tai.delete(id_the);
        }
    } else if (tin_nhan.hanhDong === 'thayDoiTrangThai' || tin_nhan.hanhDong === 'capNhatAnhBia') {
        chrome.runtime.sendMessage(tin_nhan).catch(() => {});
    }
});

chrome.tabs.onRemoved.addListener((id_the) => {
    if (cac_tien_trinh_dang_tai.has(id_the)) {
        cac_tien_trinh_dang_tai.get(id_the).bo_dieu_khien.abort();
        cac_tien_trinh_dang_tai.delete(id_the);
    }
});

chrome.tabs.onUpdated.addListener((id_the, thong_tin) => {
    if (thong_tin.status === 'loading' || thong_tin.url) {
        if (cac_tien_trinh_dang_tai.has(id_the)) {
            cac_tien_trinh_dang_tai.get(id_the).bo_dieu_khien.abort();
            cac_tien_trinh_dang_tai.delete(id_the);
        }
    }
});
