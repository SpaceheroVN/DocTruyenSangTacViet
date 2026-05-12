'use strict';

function breakAntiTheft() {
    const style = document.createElement('style');
    style.innerHTML = `* { user-select: text !important; }`;
    document.head.appendChild(style);
    ['contextmenu', 'copy', 'cut', 'paste'].forEach(ev => {
        document.addEventListener(ev, e => e.stopPropagation(), true);
    });
}
breakAntiTheft();

let tuDienHienTai = [];
chrome.storage.sync.get('customDict', d => { tuDienHienTai = d.customDict || []; });

const tonghopam = window.speechSynthesis;
let maydoc = 'auto';
let dangphat = false;
let dangtamdung = false;
let tudongchuyenchuong = true;
let tocdohientai = 1.0;
let amluonghientai = 1.0;
let chisogionghientai = -1;
let cacgionghienuy = [];
let khoa_api = { fpt_key: '', azure_key: '', azure_region: 'southeastasia' };
let cacdoan_ws = [];
let chisodoan_ws = 0;
let phatngonhientai = null;
let amthanhhientai = null;
let cacdoanamthanh = [];
let chisoamthanh = 0;
let giaydatroi = 0;
let mahengio_ngu = null;
let batphimtat = true;
let doctentruyen = true;
let doctenchuong = true;
let customStopConfig = null;
let timerFired = false;
let chaptersFired = false;
let doandaluu = 0;
let thoigiandatroichinhxac = 0;
let tickcuoicung = Date.now();
let mahengio_nhaydoan = null;
let luotphat_id = 0;
let caidatdatai = false;
let soLanLoiLienTuc = 0;
const NGUONG_FALLBACK = 2;
let isMiniPlayerMinimized = false;
let miniPlayerMode = 'chapter';
let thoiGianNghi = { comma: 300, dot: 800, para: 1200 };

const dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('STV_TTS_Cache', 1);
    request.onupgradeneeded = (e) => {
        e.target.result.createObjectStore('audioBlobs');
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e);
});

async function luuAudioVaoDB(key, blob) {
    const db = await dbPromise;
    return new Promise((resolve) => {
        const tx = db.transaction('audioBlobs', 'readwrite');
        tx.objectStore('audioBlobs').put(blob, key);
        tx.oncomplete = () => resolve();
    });
}

async function layAudioTuDB(key) {
    const db = await dbPromise;
    return new Promise((resolve) => {
        const tx = db.transaction('audioBlobs', 'readonly');
        const req = tx.objectStore('audioBlobs').get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
    });
}

async function xoaSachAudioDB() {
    const db = await dbPromise;
    return new Promise((resolve) => {
        const tx = db.transaction('audioBlobs', 'readwrite');
        tx.objectStore('audioBlobs').clear();
        tx.oncomplete = () => resolve();
    });
}

function lamtranhvanban(vanban) {
    if (!vanban) return '';
    let txt = vanban
        .replace(/Đang tải nội dung chương\.\.\./gi, '')
        .replace(/@Bạn đang đọc bản lưu.*/gi, '')
        .replace(/@Thực hiện bởi Sáng Tác Việt.*/gi, '')
        .trim();

    if (tuDienHienTai.length > 0) {
        tuDienHienTai.forEach(rule => {
            try {
                txt = txt.replace(new RegExp(rule.origin, 'gi'), rule.replace);
            } catch (e) { }
        });
    }
    return txt;
}

setInterval(() => {
    const baygio = Date.now();
    if (dangphat && !dangtamdung) {
        thoigiandatroichinhxac += (baygio - tickcuoicung) / 1000;
        giaydatroi = Math.floor(thoigiandatroichinhxac);
    }
    tickcuoicung = baygio;
}, 1000);

function taicacgiong() {
    return new Promise(resolve => {
        cacgionghienuy = tonghopam.getVoices();
        if (cacgionghienuy.length) {
            resolve(cacgionghienuy);
            return;
        }
        tonghopam.addEventListener('voiceschanged', () => {
            cacgionghienuy = tonghopam.getVoices();
            resolve(cacgionghienuy);
        }, { once: true });
        setTimeout(() => {
            cacgionghienuy = tonghopam.getVoices();
            resolve(cacgionghienuy);
        }, 1000);
    });
}
taicacgiong();

async function layvathuanhbia() {
    const p = window.location.pathname.split('/').filter(Boolean);
    if (p.length < 4 || p[0] !== 'truyen') return null;
    const khoa = `cover_${p[3]}`;
    return new Promise(resolve => {
        chrome.storage.local.get(khoa, async data => {
            if (data[khoa] && data[khoa].startsWith('http')) { resolve(data[khoa]); return; }
            try {
                const phanhoi = await fetch(`/${p[0]}/${p[1]}/${p[2]}/${p[3]}/`);
                const html = await phanhoi.text();
                const tailieu = new DOMParser().parseFromString(html, 'text/html');
                let nguon = '';
                for (const chon of ['#thumb-prop', '#book_img', '.book-thumb img', '.book-cover img', '.itembox img', 'meta[property="og:image"]']) {
                    const anh = tailieu.querySelector(chon);
                    const nguontho = anh?.getAttribute('src') || anh?.getAttribute('content');
                    if (nguontho && nguontho.trim()) { nguon = nguontho.trim(); break; }
                }
                if (nguon) {
                    if (nguon.startsWith('/')) nguon = window.location.origin + nguon;
                    else if (!nguon.startsWith('http')) nguon = window.location.origin + '/' + nguon;
                    chrome.storage.local.set({ [khoa]: nguon });
                    resolve(nguon);
                } else resolve(null);
            } catch { resolve(null); }
        });
    });
}

function themphongcach() {
    if (!document.getElementById('tts-styles')) {
        const kieu = document.createElement('style');
        kieu.id = 'tts-styles';
        kieu.textContent = `.tts-reading { background-color: rgba(232, 160, 69, 0.35) !important; border-radius: 4px; box-shadow: 0 0 0 2px rgba(232, 160, 69, 0.35) !important; transition: background-color 0.2s, box-shadow 0.2s; color: inherit !important; }`;
        document.head.appendChild(kieu);
    }
}

function chuanbinoidung() {
    themphongcach();
    let cacnutdoan = [];
    let demiddoan = 0;
    const themnut = (nut, vanban) => {
        vanban = lamtranhvanban(vanban);
        if (vanban.length > 0) {
            if (!nut.id) nut.id = `tts-chunk-t-${demiddoan++}`;
            nut.classList.add('tts-chunk');
            cacnutdoan.push({ id: nut.id, text: vanban, el: nut });
        }
    };

    const nuttruyen = document.getElementById('booknameholder') || document.getElementById('book_name2');
    if (doctentruyen && nuttruyen) themnut(nuttruyen, nuttruyen.innerText);

    const nutchuong = document.getElementById('bookchapnameholder');
    if (doctenchuong && nutchuong) themnut(nutchuong, nutchuong.innerText);

    const cackhung = document.querySelectorAll('.contentbox');
    cackhung.forEach(khung => {
        const vanbantho = lamtranhvanban(khung.innerText);
        if (vanbantho.length < 50) return;
        if (!khung.dataset.extTtsDone) {
            khung.dataset.extTtsDone = 'true';
            if (khung.dataset.ttsPrepared) {
                khung.querySelectorAll('.tts-chunk').forEach(thespan => {
                    const khoangcach = document.createTextNode(' ');
                    thespan.parentNode.insertBefore(khoangcach, thespan.nextSibling);
                    while (thespan.firstChild) thespan.parentNode.insertBefore(thespan.firstChild, thespan);
                    thespan.remove();
                });
            }
            function baocacdong(chua) {
                let thespanhientai = null;
                const cacnut = Array.from(chua.childNodes);
                cacnut.forEach(nut => {
                    if (['BR', 'DIV', 'P', 'H1', 'H2', 'H3', 'HR', 'TABLE', 'UL', 'LI'].includes(nut.nodeName)) {
                        thespanhientai = null;
                        if (nut.nodeType === 1 && !['BR', 'HR'].includes(nut.nodeName)) {
                            baocacdong(nut);
                        }
                    } else {
                        if (['SCRIPT', 'STYLE'].includes(nut.nodeName)) return;
                        if (nut.nodeType === 3 && !nut.textContent.replace(/\u200B/g, '').trim()) {
                            if (thespanhientai) thespanhientai.appendChild(nut);
                            return;
                        }
                        if (!thespanhientai) {
                            thespanhientai = document.createElement('span');
                            thespanhientai.className = 'tts-chunk';
                            thespanhientai.id = `tts-c-${demiddoan++}`;
                            chua.insertBefore(thespanhientai, nut);
                        }
                        thespanhientai.appendChild(nut);
                    }
                });
            }
            baocacdong(khung);
        }
        khung.querySelectorAll('.tts-chunk').forEach(thespan => {
            let txt = lamtranhvanban(thespan.innerText || thespan.textContent || '');
            if (txt.length > 2) cacnutdoan.push({ id: thespan.id, text: txt, el: thespan });
        });
    });
    return cacnutdoan;
}

function chiadoanvanban(vanban, dodaitoida) {
    const cacdoan = [];
    const caccau = vanban.split(/(?<=[.!?。])\s+/);
    let hientai = '';
    for (const cau of caccau) {
        if (!cau.trim()) continue;
        if ((hientai + ' ' + cau).trim().length <= dodaitoida) {
            hientai = (hientai + ' ' + cau).trim();
        } else {
            if (hientai) cacdoan.push(hientai);
            if (cau.length > dodaitoida) {
                const cacphan = cau.split(/(?<=[,;:])\s+/);
                let phanphu = '';
                for (const phan of cacphan) {
                    if ((phanphu + ' ' + phan).trim().length <= dodaitoida) phanphu = (phanphu + ' ' + phan).trim();
                    else {
                        if (phanphu) cacdoan.push(phanphu);
                        phanphu = '';
                        let conlai = phan;
                        while (conlai.length > dodaitoida) {
                            let vitricat = conlai.lastIndexOf(' ', dodaitoida);
                            if (vitricat <= 0) vitricat = dodaitoida;
                            cacdoan.push(conlai.slice(0, vitricat));
                            conlai = conlai.slice(vitricat).trim();
                        }
                        if (conlai) cacdoan.push(conlai);
                    }
                }
                if (phanphu) cacdoan.push(phanphu);
            } else { hientai = cau.trim(); }
        }
    }
    if (hientai) cacdoan.push(hientai);
    const ket_qua = cacdoan.filter(c => c.trim().length > 0);
    return ket_qua.length > 0 ? ket_qua : [vanban];
}

function taocacdoanmaydoc(cacnutdoan, dodaitoida) {
    let cacdoanmaydoc = [];
    for (const nut of cacnutdoan) {
        const cacdoan = chiadoanvanban(nut.text, dodaitoida);
        for (const d of cacdoan) cacdoanmaydoc.push({ text: d, el: nut.el });
    }
    return cacdoanmaydoc;
}

function capnhatnoibat(chiso, mangcacdoan) {
    document.querySelectorAll('.tts-reading').forEach(el => el.classList.remove('tts-reading'));
    if (chiso >= 0 && chiso < mangcacdoan.length && mangcacdoan[chiso].el) {
        const el = mangcacdoan[chiso].el;
        el.classList.add('tts-reading');
        if (dangphat && !dangtamdung) {
            const khunganh = el.getBoundingClientRect();
            if (khunganh.top < 80 || khunganh.bottom > window.innerHeight - 80) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
    luutrangthaitienhat_debounce();
    capnhatMiniPlayer();
}

function taoKeyCache(text) {
    const clean = text.replace(/\s+/g, '');
    let hash = 5381;
    for (let i = 0; i < clean.length; i++) hash = ((hash << 5) + hash) ^ clean.charCodeAt(i);
    return (hash >>> 0).toString(36) + '_' + clean.length;
}

async function layamthanhtuapi_raw(vanban, congcudoc, retries = 3) {
    try {
        if (congcudoc === 'fpt') {
            const tenCacGiong = ['banmai', 'leminh', 'thuminh', 'myan', 'giahuy', 'lannhi', 'linhsan'];
            const tenGiong = tenCacGiong[chisogionghientai] || 'banmai';
            const tocDoFpt = (tocdohientai > 1) ? 1 : (tocdohientai < 1 ? -1 : 0);

            const res = await fetch('https://api.fpt.ai/hmi/tts/v5', {
                method: 'POST',
                headers: { 'api-key': khoa_api.fpt_key, 'voice': tenGiong, 'speed': tocDoFpt.toString() },
                body: vanban
            });
            if (!res.ok) throw new Error('Lỗi FPT');
            const data = await res.json();
            if (data.error) throw new Error(data.message);

            for (let i = 0; i < 10; i++) {
                await new Promise(r => setTimeout(r, 1000));
                const check = await fetch(data.async);
                if (check.ok) return await check.blob();
            }
            throw new Error('FPT Timeout');

        } else if (congcudoc === 'azure') {
            const tenCacGiong = ['vi-VN-HoaiMyNeural', 'vi-VN-NamMinhNeural'];
            const tenGiong = tenCacGiong[chisogionghientai] || 'vi-VN-HoaiMyNeural';
            const textThoat = String(vanban).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const ssml = `<speak version='1.0' xml:lang='vi-VN'><voice xml:lang='vi-VN' name='${tenGiong}'><prosody rate='${tocdohientai}'>${textThoat}</prosody></voice></speak>`;

            const region = khoa_api.azure_region || 'southeastasia';
            const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': khoa_api.azure_key,
                    'Content-Type': 'application/ssml+xml',
                    'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
                },
                body: ssml
            });
            if (!res.ok) throw new Error('Lỗi Azure');
            return await res.blob();
        }
    } catch (err) {
        if (retries > 0) {
            await new Promise(r => setTimeout(r, 1000));
            return layamthanhtuapi_raw(vanban, congcudoc, retries - 1);
        }
        throw err;
    }
}

const _urlCache = new Map();

function xoaUrlCache() {
    _urlCache.forEach(url => URL.revokeObjectURL(url));
    _urlCache.clear();
}

async function layamthanhtuapi(vanban, congcudoc, retries = 3) {
    const cacheKey = taoKeyCache(vanban);
    const cachedBlob = await layAudioTuDB(cacheKey);
    if (cachedBlob) {
        if (!_urlCache.has(cacheKey)) _urlCache.set(cacheKey, URL.createObjectURL(cachedBlob));
        return _urlCache.get(cacheKey);
    }
    return layamthanhtuapi_raw(vanban, congcudoc, retries);
}

async function tienTaiChuongTiepTheo() {
    if (!tudongchuyenchuong || maydoc === 'web' || maydoc === 'auto') return;

    let timthay = null;
    const banchon = ['#navnexttop', '#navnextbot', '#navnext', '#nav_next', '#btnnext', '#btn_next', '.btn-next-chapter', 'a.next', '.chapter-next a', '[data-nav="next"]'];
    for (const chon of banchon) {
        const el = document.querySelector(chon);
        if (el && el.getAttribute('href') && !el.getAttribute('href').endsWith('/0/')) {
            timthay = el.getAttribute('href');
            break;
        }
    }
    if (!timthay) return;

    try {

        const res = await fetch(timthay);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        let cacDoanText = [];
        const themText = (txt) => {
            txt = lamtranhvanban(txt);
            if (txt.length > 0) {
                const chunks = chiadoanvanban(txt, maydoc === 'fpt' ? 2000 : 1000);
                cacDoanText.push(...chunks);
            }
        };

        if (doctentruyen) {
            let nut = doc.getElementById('booknameholder') || doc.getElementById('book_name2');
            if (nut) themText(nut.textContent);
        }
        if (doctenchuong) {
            let nut = doc.getElementById('bookchapnameholder');
            if (nut) themText(nut.textContent);
        }

        const cackhung = doc.querySelectorAll('.contentbox');
        cackhung.forEach(khung => {
            let clone = khung.cloneNode(true);
            clone.innerHTML = clone.innerHTML.replace(/<br\s*[\/]?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n");
            themText(clone.textContent);
        });

        await xoaSachAudioDB();
        xoaUrlCache();

        for (let i = 0; i < Math.min(2, cacDoanText.length); i++) {
            const text = cacDoanText[i];
            const key = taoKeyCache(text);

            let urlOrBlob = await layamthanhtuapi_raw(text, maydoc);

            if (urlOrBlob instanceof Blob) {
                await luuAudioVaoDB(key, urlOrBlob);
            } else if (urlOrBlob && urlOrBlob.startsWith('blob:')) {
                const b = await fetch(urlOrBlob).then(r => r.blob());
                await luuAudioVaoDB(key, b);
            }
        }

    } catch (e) {
    }
}

function fallbackVeWebSpeech(lyDo) {
    if (maydoc === 'web' || maydoc === 'auto') return;
    const engineCu = maydoc;
    maydoc = 'web';
    soLanLoiLienTuc = 0;
    hienthithongbao(`⚠️ ${lyDo} - Đã chuyển sang Web Speech`);
    chrome.runtime.sendMessage({ action: 'engineFallback', from: engineCu });
    if (amthanhhientai) { amthanhhientai.pause(); amthanhhientai.src = ''; amthanhhientai = null; }
    cacdoan_ws = [];
    chuanbi_ngam();
    if (dangphat && !dangtamdung) phatdoanweb();
}

async function phatdoanamthanh(boQuaNghi = false) {
    if (!dangphat || dangtamdung) return;
    if (chisoamthanh >= cacdoanamthanh.length) {
        dangphat = false;
        xulyketthucchuong();
        return;
    }

    let delay = 0;
    if (!boQuaNghi && chisoamthanh > 0) {
        const doanTruoc = cacdoanamthanh[chisoamthanh - 1].text.trim();
        if (doanTruoc.match(/[,;]$/)) delay = thoiGianNghi.comma;
        else if (doanTruoc.match(/[.!?…:]$/)) delay = thoiGianNghi.dot;
        else delay = thoiGianNghi.para;
    }

    if (delay > 0) {
        setTimeout(() => phatdoanamthanh(true), delay);
        return;
    }

    if (amthanhhientai) {
        amthanhhientai.pause();
        amthanhhientai.src = '';
        amthanhhientai = null;
    }
    const doan = cacdoanamthanh[chisoamthanh];
    capnhatnoibat(chisoamthanh, cacdoanamthanh);

    let id_hientai = luotphat_id;

    if (!doan.url) {
        try {
            document.body.style.cursor = 'wait';
            doan.url = await layamthanhtuapi(doan.text, maydoc);
            document.body.style.cursor = 'default';
        } catch (err) {
            document.body.style.cursor = 'default';
            if (id_hientai === luotphat_id) {
                soLanLoiLienTuc++;
                if (soLanLoiLienTuc >= NGUONG_FALLBACK) {
                    fallbackVeWebSpeech('API lỗi liên tục');
                    return;
                }
                chisoamthanh++;

                setTimeout(() => phatdoanamthanh(true), 100);
            }
            return;
        }
    }

    if (id_hientai !== luotphat_id) return;

    const amthanh = new Audio(doan.url);
    amthanhhientai = amthanh;
    amthanh.volume = amluonghientai;
    amthanh.playbackRate = tocdohientai;
    soLanLoiLienTuc = 0;

    const SO_LUONG_PREFETCH = 3;
    for (let i = 1; i <= SO_LUONG_PREFETCH; i++) {
        let idx = chisoamthanh + i;
        if (idx < cacdoanamthanh.length && !cacdoanamthanh[idx].url && !cacdoanamthanh[idx].isFetching) {
            cacdoanamthanh[idx].isFetching = true;
            layamthanhtuapi(cacdoanamthanh[idx].text, maydoc)
                .then(url => { cacdoanamthanh[idx].url = url; cacdoanamthanh[idx].isFetching = false; })
                .catch(() => { cacdoanamthanh[idx].isFetching = false; });
        }
    }

    if (chisoamthanh >= cacdoanamthanh.length * 0.8 && !window.isPrefetchingNext) {
        window.isPrefetchingNext = true;
        tienTaiChuongTiepTheo();
    }

    amthanh.onended = () => {
        if (doan.url && doan.url.startsWith('blob:')) { URL.revokeObjectURL(doan.url); doan.url = null; }
        if (amthanhhientai !== amthanh) return;
        chisoamthanh++;
        if (dangphat && !dangtamdung) setTimeout(() => phatdoanamthanh(false), 50);
    };
    amthanh.onerror = () => {
        if (amthanhhientai !== amthanh) return;
        chisoamthanh++;
        if (dangphat && !dangtamdung) setTimeout(() => phatdoanamthanh(true), 300);
    };
    amthanh.play().catch(err => {
        if (amthanhhientai !== amthanh) return;
        if (err.name === 'NotAllowedError') {
            dangphat = false; dangtamdung = true;
            chrome.runtime.sendMessage({ action: 'autoplayBlocked' });
            return;
        }
        chisoamthanh++;
        setTimeout(() => phatdoanamthanh(true), 300);
    });
}

function dungamthanh() {
    if (amthanhhientai) {
        amthanhhientai.pause();
        amthanhhientai.src = '';
        amthanhhientai = null;
    }
    cacdoanamthanh.forEach(c => { if (c.url && c.url.startsWith('blob:')) URL.revokeObjectURL(c.url); });
    cacdoanamthanh = [];
    chisoamthanh = 0;
    document.querySelectorAll('.tts-reading').forEach(el => el.classList.remove('tts-reading'));
}

function huyphatngonantoan() { if (tonghopam.paused) tonghopam.resume(); tonghopam.cancel(); }

function dungtrinhdocweb() {
    huyphatngonantoan();
    phatngonhientai = null;
    cacdoan_ws = [];
    chisodoan_ws = 0;
    document.querySelectorAll('.tts-reading').forEach(el => el.classList.remove('tts-reading'));
}

async function phatdoanweb(boQuaNghi = false) {
    if (!dangphat || dangtamdung) return;
    if (chisodoan_ws >= cacdoan_ws.length) { dangphat = false; xulyketthucchuong(); return; }

    let delay = 0;
    if (!boQuaNghi && chisodoan_ws > 0) {
        const doanTruoc = cacdoan_ws[chisodoan_ws - 1].text.trim();
        if (doanTruoc.match(/[,;]$/)) delay = thoiGianNghi.comma;
        else if (doanTruoc.match(/[.!?…:]$/)) delay = thoiGianNghi.dot;
        else delay = thoiGianNghi.para;
    }

    if (delay > 0) {
        setTimeout(() => phatdoanweb(true), delay);
        return;
    }

    huyphatngonantoan();
    capnhatnoibat(chisodoan_ws, cacdoan_ws);

    let id_hientai = luotphat_id;

    if (cacgionghienuy.length === 0) {
        cacgionghienuy = await taicacgiong();
    }

    if (id_hientai !== luotphat_id) return;

    const doan = cacdoan_ws[chisodoan_ws];
    const phatngon = new SpeechSynthesisUtterance(doan.text);
    phatngon.lang = 'vi-VN';
    phatngon.rate = Math.min(Math.max(tocdohientai, 0.1), 10);
    phatngon.volume = amluonghientai;
    let giongdachon = null;
    if (typeof chisogionghientai === 'string' && chisogionghientai.length > 5) {
        giongdachon = cacgionghienuy.find(v => v.name === chisogionghientai);
    } else if (chisogionghientai >= 0 && cacgionghienuy[chisogionghientai]) {
        giongdachon = cacgionghienuy[chisogionghientai];
    }
    if (giongdachon) {
        phatngon.voice = giongdachon;
    } else {
        const vi = cacgionghienuy.find(v => v.lang && v.lang.startsWith('vi'));
        if (vi) phatngon.voice = vi;
    }
    phatngonhientai = phatngon;

    phatngon.onend = () => { if (phatngonhientai !== phatngon) return; chisodoan_ws++; if (dangphat && !dangtamdung) phatdoanweb(false); };
    phatngon.onerror = (e) => { if (e.error === 'interrupted' || e.error === 'canceled') return; if (dangphat && !dangtamdung) { chisodoan_ws++; phatdoanweb(true); } };
    tonghopam.speak(phatngon);
}

function kiemtramahoa() {
    const cackhung = document.querySelectorAll('.contentbox');
    let co_mahoa = false;
    for (let khung of cackhung) {
        if (/[\uE000-\uF8FF]/.test(khung.textContent)) { co_mahoa = true; break; }
    }
    if (co_mahoa && !document.getElementById('stv-obfuscation-warning')) {
        let canhbao = document.createElement('div');
        canhbao.id = 'stv-obfuscation-warning';
        canhbao.style.cssText = "background: #ff4d4f; color: white; padding: 10px; text-align: center; font-weight: bold;";
        canhbao.innerText = "Cảnh báo: Chương này bị mã hóa Font! Máy sẽ không đọc chuẩn được.";
        if (cackhung[0]) cackhung[0].parentNode.insertBefore(canhbao, cackhung[0]);
    }
    return co_mahoa;
}
function chuanbi_ngam() {
    window.isPrefetchingNext = false;
    const congcu = maydoc === 'auto' || maydoc === 'google' ? 'web' : maydoc;
    if (congcu === 'web' && cacdoan_ws.length > 0) return true;
    if (congcu !== 'web' && cacdoanamthanh.length > 0) return true;
    let cacnutdoan = [];
    if (kiemtramahoa()) {
        window.obfuscationBlocked = true;
        const nutcanhbao = document.getElementById('stv-obfuscation-warning');
        if (nutcanhbao && !nutcanhbao.classList.contains('tts-chunk')) nutcanhbao.classList.add('tts-chunk');
        cacnutdoan = [{ id: 'stv-obfuscation-warning', text: "Cảnh báo: Chương truyện này đã bị mã hóa nội dung bằng custom font! Tiện ích có thể không đọc hoặc copy được chính xác văn bản gốc.", el: nutcanhbao }];
    } else {
        window.obfuscationBlocked = false;
        const el = document.querySelector('.contentbox');
        if (!el || el.innerText.includes('Đang tải nội dung') || el.innerText.trim().length < 50) return false;
        cacnutdoan = chuanbinoidung();
        if (!cacnutdoan.length) return false;
    }
    if (congcu === 'web') {
        cacdoan_ws = taocacdoanmaydoc(cacnutdoan, 300);
        if (doandaluu > 0) {
            chisodoan_ws = Math.min(doandaluu, Math.max(0, cacdoan_ws.length - 1));
            doandaluu = 0;
        } else if (cacdoanamthanh.length > 0 && chisoamthanh > 0) {
            chisodoan_ws = Math.floor((chisoamthanh / cacdoanamthanh.length) * cacdoan_ws.length) || 0;
        } else { chisodoan_ws = 0; }
        capnhatnoibat(chisodoan_ws, cacdoan_ws);
    } else {
        cacdoanamthanh = taocacdoanmaydoc(cacnutdoan, congcu === 'fpt' ? 2000 : 1000).map(c => ({ ...c, url: null }));
        if (doandaluu > 0) {
            chisoamthanh = Math.min(doandaluu, Math.max(0, cacdoanamthanh.length - 1));
            doandaluu = 0;
        } else if (cacdoan_ws.length > 0 && chisodoan_ws > 0) {
            chisoamthanh = Math.floor((chisodoan_ws / cacdoan_ws.length) * cacdoanamthanh.length) || 0;
        } else { chisoamthanh = 0; }
        capnhatnoibat(chisoamthanh, cacdoanamthanh);
    }
    return true;
}

function batdaudoc() {
    taoMiniPlayer();
    if (!chuanbi_ngam()) { dangphat = false; return; }
    dangphat = true; dangtamdung = false;
    const congcu = maydoc === 'auto' || maydoc === 'google' ? 'web' : maydoc;
    if (congcu === 'web') phatdoanweb();
    else phatdoanamthanh();
}

function chuyendoiphat(tuychon = {}) {
    if (tuychon.speed !== undefined) tocdohientai = tuychon.speed;
    if (tuychon.volume !== undefined) amluonghientai = tuychon.volume;
    if (tuychon.voiceIndex !== undefined) chisogionghientai = tuychon.voiceIndex;
    const congcu = maydoc === 'auto' ? 'web' : maydoc;
    if (dangphat && !dangtamdung) {
        if (congcu === 'web') tonghopam.pause(); else if (amthanhhientai) amthanhhientai.pause();
        dangphat = false; dangtamdung = true;
    } else if (dangtamdung) {
        dangphat = true; dangtamdung = false;
        if (congcu === 'web') {
            if (tonghopam.paused) tonghopam.resume(); else phatdoanweb();
        } else if (amthanhhientai) {
            amthanhhientai.play().catch(err => {
                if (err.name === 'NotAllowedError') {
                    dangphat = false; dangtamdung = true;
                    chrome.runtime.sendMessage({ action: 'autoplayBlocked' });
                } else phatdoanamthanh();
            });
        } else if (cacdoanamthanh.length > 0) phatdoanamthanh();
        else { batdaudoc(); }
    } else {
        batdaudoc();
    }
    const bubble = document.getElementById('stv-mini-bubble');
    if (bubble) bubble.classList.add('stv-mp-hidden');
    capnhatMiniPlayer();
    return true;
}

function dungtatca() {
    dungtrinhdocweb(); dungamthanh();
    dangphat = false; dangtamdung = false;
    giaydatroi = 0; thoigiandatroichinhxac = 0;
    capnhatMiniPlayer();
}

function doclaichuong(tuychon = {}) {
    dungtatca();
    if (tuychon.speed !== undefined) tocdohientai = tuychon.speed;
    if (tuychon.volume !== undefined) amluonghientai = tuychon.volume;
    if (tuychon.voiceIndex !== undefined) chisogionghientai = tuychon.voiceIndex;
    setTimeout(batdaudoc, 150);
}

function xulyketthucchuong() {
    if (document.getElementById('stv-obfuscation-warning') || kiemtramahoa()) {
        dungtatca();
        return;
    }
    if (!tudongchuyenchuong) { dungtatca(); return; }
    chrome.storage.local.get(['stopAfterChapters'], data => {
        const conlai = data.stopAfterChapters;
        if (conlai !== undefined && conlai !== null && conlai > 0) {
            if (conlai <= 1) {
                chrome.storage.local.remove('stopAfterChapters');
                if (customStopConfig?.operator === 'and') {
                    chaptersFired = true;
                    if (!timerFired) {
                        hienthithongbao('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg><span>Đã đủ số chương, đang chờ đủ thời gian...</span>');
                        setTimeout(() => bamchuongsau(true), 1200);
                        return;
                    }
                    customStopConfig = null; timerFired = false;
                    chrome.storage.local.remove(['customStopConfig', 'sleepTargetTimestamp']);
                    if (mahengio_ngu) { clearTimeout(mahengio_ngu); mahengio_ngu = null; }
                }
                dungtatca();
                hienthithongbao('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg><span>Đã dừng sau khi hoàn thành số chương hẹn trước!</span>');
            } else {
                chrome.storage.local.set({ stopAfterChapters: conlai - 1 }, () => setTimeout(() => bamchuongsau(true), 1200));
            }
        } else setTimeout(() => bamchuongsau(true), 1200);
    });
}

function bamchuongsau(laTudong = false) {
    dungtatca();
    if (laTudong) chrome.storage.local.set({ autoStartOnLoad: true, speed: tocdohientai, volume: amluonghientai, voiceIndex: chisogionghientai, savedEngine: maydoc });
    else chrome.storage.local.remove('autoStartOnLoad');
    const banchon = ['#navnexttop', '#navnextbot', '#navnext', '#nav_next', '#btnnext', '#btn_next', '.btn-next-chapter', 'a.next', '.chapter-next a', '[data-nav="next"]'];
    for (const chon of banchon) {
        const el = document.querySelector(chon);
        if (el) { el.click(); return; }
    }
    const caclienket = document.querySelectorAll('a, button');
    const tukhoatieptheo = ['chương sau', 'chương tiếp', 'tiếp theo', 'next'];
    for (const el of caclienket) {
        const vanban = (el.innerText || '').toLowerCase().trim();
        if (tukhoatieptheo.some(kw => vanban.includes(kw)) && vanban.length < 25) { el.click(); return; }
    }
    hienthithongbao('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span>Không tìm thấy nút chuyển chương. Có thể đã hết truyện.</span>');
}

function bamchuongtruoc() {
    dungtatca();
    chrome.storage.local.remove('autoStartOnLoad');
    let timthay = null;
    const banchon = ['#navprevtop', '#navprevbot', '#navprev', '#nav_prev', '#btnprev', '#btn_prev', '.btn-prev-chapter', 'a.prev', '.chapter-prev a', '[data-nav="prev"]'];
    for (const chon of banchon) {
        const el = document.querySelector(chon);
        if (el) { timthay = el; break; }
    }
    if (!timthay) {
        const caclienket = document.querySelectorAll('a, button');
        const tukhoatruoc = ['chương trước', 'trước đó', 'prev'];
        for (const el of caclienket) {
            const vanban = (el.innerText || '').toLowerCase().trim();
            if (tukhoatruoc.some(kw => vanban.includes(kw)) && vanban.length < 25) { timthay = el; break; }
        }
    }
    if (timthay) {
        const duongdan = timthay.getAttribute('href');
        let duongdanchinh = null;
        const banchonchinh = ['#navcentertop', '#navcenterbot', '#navcenter', '.chapter-list'];
        for (const chon of banchonchinh) {
            const elchinh = document.querySelector(chon);
            if (elchinh && elchinh.getAttribute('href')) { duongdanchinh = elchinh.getAttribute('href'); break; }
        }
        if (!duongdanchinh) {
            const tatcalienket = document.querySelectorAll('a');
            for (const el of tatcalienket) {
                if ((el.innerText || '').toLowerCase().includes('mục lục') && el.getAttribute('href')) { duongdanchinh = el.getAttribute('href'); break; }
            }
        }
        if (duongdan && (duongdan.endsWith('/0/') || duongdan.endsWith('/0') || (duongdanchinh && duongdan === duongdanchinh))) {
            hienthithongbao('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span>Đây là chương thấp nhất rồi!</span>'); return;
        }
        timthay.click(); return;
    }
    hienthithongbao('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span>Không tìm thấy nút chuyển chương trước.</span>');
}

function hienthithongbao(thongdiep) {
    let thongbao = document.getElementById('stv-tts-toast');
    if (!thongbao) {
        thongbao = document.createElement('div');
        thongbao.id = 'stv-tts-toast';
        thongbao.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:var(--accent, #e8a045);color:#fff;padding:8px 16px;border-radius:20px;z-index:999999;font-size:14px;font-family:sans-serif;pointer-events:none;transition:opacity 0.3s;box-shadow:0 4px 10px rgba(0,0,0,0.3);display:flex;align-items:center;gap:6px;';
        document.body.appendChild(thongbao);
    }
    thongbao.innerHTML = thongdiep; thongbao.style.opacity = '1';
    clearTimeout(thongbao.timeout);
    thongbao.timeout = setTimeout(() => { thongbao.style.opacity = '0'; }, 2000);
}

function xulynhaydoan(hanhdong, giatri) {
    chuanbi_ngam();
    const congcu = maydoc === 'auto' ? 'web' : maydoc;
    luotphat_id++;

    if (congcu === 'web') {
        if (hanhdong === 'sau' && chisodoan_ws < cacdoan_ws.length - 1) chisodoan_ws++;
        else if (hanhdong === 'truoc' && chisodoan_ws > 0) chisodoan_ws--;
        else if (hanhdong === 'nhay') chisodoan_ws = Math.min(Math.max(0, giatri - 1), Math.max(0, cacdoan_ws.length - 1));
        huyphatngonantoan();
        capnhatnoibat(chisodoan_ws, cacdoan_ws);
    } else {
        if (hanhdong === 'sau' && chisoamthanh < cacdoanamthanh.length - 1) chisoamthanh++;
        else if (hanhdong === 'truoc' && chisoamthanh > 0) chisoamthanh--;
        else if (hanhdong === 'nhay') chisoamthanh = Math.min(Math.max(0, giatri - 1), Math.max(0, cacdoanamthanh.length - 1));
        if (amthanhhientai) { amthanhhientai.pause(); amthanhhientai = null; }
        capnhatnoibat(chisoamthanh, cacdoanamthanh);
    }

    if (dangphat && !dangtamdung) {
        if (mahengio_nhaydoan) clearTimeout(mahengio_nhaydoan);
        mahengio_nhaydoan = setTimeout(() => {
            if (congcu === 'web') phatdoanweb(true);
            else phatdoanamthanh(true);
        }, 250);
    }
}

chrome.runtime.onMessage.addListener((yeucau, _nguoigui, phanhoi) => {
    const congcu = maydoc === 'auto' ? 'web' : maydoc;
    const trave = (them = {}) => phanhoi({ isPlaying: dangphat, isPaused: dangtamdung, ttsEngine: congcu, ...them });

    switch (yeucau.action) {
        case 'togglePlay': chuyendoiphat(yeucau); trave(); break;
        case 'stopPlay': dungtatca(); trave(); break;
        case 'replayChap': doclaichuong(yeucau); trave({ isPlaying: true, isPaused: false }); break;
        case 'nextChap': bamchuongsau(); trave(); break;
        case 'prevChap': bamchuongtruoc(); trave(); break;
        case 'nextChunk':
        case 'doansau': xulynhaydoan('sau'); trave(); break;
        case 'prevChunk':
        case 'doantruoc': xulynhaydoan('truoc'); trave(); break;
        case 'jumpToChunk':
        case 'nhaydoan': xulynhaydoan('nhay', yeucau.value); trave(); break;
        case 'setAuto': tudongchuyenchuong = yeucau.value; trave(); break;
        case 'setSpeed':
            tocdohientai = yeucau.value;
            if (congcu === 'web' && dangphat && !dangtamdung) { phatngonhientai = null; huyphatngonantoan(); luotphat_id++; phatdoanweb(); }
            if (amthanhhientai) amthanhhientai.playbackRate = tocdohientai;
            trave(); break;
        case 'setVolume': amluonghientai = yeucau.value; if (amthanhhientai) amthanhhientai.volume = amluonghientai; trave(); break;
        case 'setEngine':
            const engineCu = maydoc === 'auto' ? 'web' : maydoc;
            maydoc = yeucau.value || 'auto';
            chrome.storage.local.set({ maydoc });
            const engineMoi = maydoc === 'auto' ? 'web' : maydoc;

            if (engineCu !== engineMoi) {
                if (engineMoi === 'web') cacdoan_ws = [];
                else cacdoanamthanh = [];

                if (dangphat || dangtamdung) {
                    huyphatngonantoan();
                    if (amthanhhientai) { amthanhhientai.pause(); amthanhhientai.src = ''; amthanhhientai = null; }
                    chuanbi_ngam();
                }
            }
            trave(); break;

        case 'setVoice':
            if (chisogionghientai == yeucau.value) {
                trave(); break;
            }
            chisogionghientai = yeucau.value;
            if (dangphat || dangtamdung) {
                const dangPhatCu = dangphat;
                huyphatngonantoan();
                if (amthanhhientai) { amthanhhientai.pause(); amthanhhientai.src = ''; amthanhhientai = null; }
                cacdoanamthanh.forEach(c => { if (c.url && c.url.startsWith('blob:')) URL.revokeObjectURL(c.url); c.url = null; });

                if (dangPhatCu) {
                    luotphat_id++;
                    const congcu = maydoc === 'auto' ? 'web' : maydoc;
                    if (congcu === 'web') phatdoanweb();
                    else phatdoanamthanh();
                } else {
                    dangtamdung = true;
                    const congcu = maydoc === 'auto' ? 'web' : maydoc;
                    capnhatnoibat(congcu === 'web' ? chisodoan_ws : chisoamthanh, congcu === 'web' ? cacdoan_ws : cacdoanamthanh);
                }
            }
            trave(); break;
        case 'setPauses': thoiGianNghi = yeucau; trave(); break;
        case 'setApiKeys': Object.assign(khoa_api, yeucau); chrome.storage.local.set(yeucau); trave(); break;
        case 'setSleepTimer':
            if (mahengio_ngu) clearTimeout(mahengio_ngu);
            timerFired = false;
            if (yeucau.minutes > 0) {
                const ms_ngu = yeucau.minutes * 60 * 1000;
                chrome.storage.local.set({ sleepTargetTimestamp: Date.now() + ms_ngu });
                mahengio_ngu = setTimeout(() => {
                    chrome.storage.local.remove('sleepTargetTimestamp');
                    if (customStopConfig?.operator === 'and') {
                        timerFired = true;
                        if (!chaptersFired) {
                            hienthithongbao('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Đã đủ thời gian, đang chờ đủ số chương...</span>');
                            return;
                        }
                        customStopConfig = null; chaptersFired = false;
                        chrome.storage.local.remove(['customStopConfig', 'stopAfterChapters']);
                    }
                    dungtatca();
                }, ms_ngu);
            } else chrome.storage.local.remove('sleepTargetTimestamp');
            trave(); break;
        case 'setStopChapters':
            chaptersFired = false;
            if (yeucau.count > 0) chrome.storage.local.set({ stopAfterChapters: yeucau.count });
            else chrome.storage.local.remove('stopAfterChapters');
            trave(); break;
        case 'setCustomStop':
            customStopConfig = yeucau.config || null;
            timerFired = false; chaptersFired = false;
            if (customStopConfig) chrome.storage.local.set({ customStopConfig });
            else chrome.storage.local.remove('customStopConfig');
            trave(); break;
        case 'getInfo':
            (async () => {
                chuanbi_ngam();
                let tentruyen = document.getElementById('booknameholder')?.innerText.trim() || document.getElementById('book_name2')?.innerText.trim() || document.querySelector('h1')?.innerText.trim() || '';
                let tenchuong = document.getElementById('bookchapnameholder')?.innerText.trim() || '';
                let duongdananh = await layvathuanhbia() || '';
                const p = window.location.pathname.split('/').filter(Boolean);
                const duongdantruyen = p.length >= 4 ? `${window.location.origin}/${p[0]}/${p[1]}/${p[2]}/${p[3]}/` : window.location.href;
                const tongdoan = congcu === 'web' ? cacdoan_ws.length : cacdoanamthanh.length;
                const doanhientai = congcu === 'web' ? chisodoan_ws : chisoamthanh;
                if (!dangphat && !dangtamdung && tongdoan > 0) capnhatnoibat(doanhientai, congcu === 'web' ? cacdoan_ws : cacdoanamthanh);
                phanhoi({ bookTitle: tentruyen, chapTitle: tenchuong, imgUrl: duongdananh, bookUrl: duongdantruyen, pageUrl: window.location.href, isPlaying: dangphat, isPaused: dangtamdung, ttsEngine: congcu, progress: tongdoan > 0 ? { current: doanhientai + 1, total: tongdoan } : null, elapsed: giaydatroi });
            })();
            return true;
        case 'getVoices':
            taicacgiong().then(voices => {
                const mang = voices.map((v, i) => ({ name: v.name, lang: v.lang || 'unknown', index: i })).sort((a, b) => {
                    const aVi = a.lang.startsWith('vi'); const bVi = b.lang.startsWith('vi');
                    if (aVi && !bVi) return -1; if (!aVi && bVi) return 1; return a.lang.localeCompare(b.lang);
                });
                phanhoi({ voices: mang, hasVi: mang.some(v => v.lang.startsWith('vi')) });
            });
            return true;
        case 'getStatus':
            chuanbi_ngam();
            const tongdoan = congcu === 'web' ? cacdoan_ws.length : cacdoanamthanh.length;
            const doanhientai = congcu === 'web' ? chisodoan_ws : chisoamthanh;
            trave({ progress: tongdoan > 0 ? { current: doanhientai + 1, total: tongdoan } : null, elapsed: giaydatroi });
            break;
    }
    return false;
});

chrome.storage.local.get([
    'autoStartOnLoad', 'sleepTargetTimestamp', 'readingList', 'customStopConfig', 'isMiniPlayerMinimized', 'miniPlayerMode'
], localData => {
    if (localData.isMiniPlayerMinimized !== undefined) {
        isMiniPlayerMinimized = localData.isMiniPlayerMinimized;
    }
    if (localData.miniPlayerMode) {
        miniPlayerMode = localData.miniPlayerMode;
    }
    let tentruyen = document.getElementById('booknameholder')?.innerText.trim() || document.getElementById('book_name2')?.innerText.trim() || document.querySelector('h1')?.innerText.trim() || '';
    let danh_sach = localData.readingList || [];
    let muc = danh_sach.find(i => (i.title || '').trim().toLowerCase() === (tentruyen || '').trim().toLowerCase());

    if (muc && muc.url === window.location.href && muc.chunkIndex > 1) {
        doandaluu = muc.chunkIndex - 1;
    }

    if (localData.customStopConfig) customStopConfig = localData.customStopConfig;

    if (localData.sleepTargetTimestamp) {
        const conlai = localData.sleepTargetTimestamp - Date.now();
        if (conlai > 0) mahengio_ngu = setTimeout(() => { dungtatca(); chrome.storage.local.remove('sleepTargetTimestamp'); }, conlai);
        else chrome.storage.local.remove('sleepTargetTimestamp');
    }

    if (localData.autoStartOnLoad) {
        chrome.storage.local.remove('autoStartOnLoad');
        let thu_lai = 20;
        const kiem_tra_san_sang = setInterval(() => {
            if (chuanbinoidung().length >= 5 || --thu_lai <= 0) {
                clearInterval(kiem_tra_san_sang);
                batdaudoc();
            }
        }, 1000);
    }
    setTimeout(kiemtramahoa, 1500);
});

chrome.storage.sync.get([
    'speed', 'volume', 'voiceIndex', 'savedEngine', 'maydoc',
    'fpt_key', 'azure_key', 'azure_region', 'tudongchuyenchuong',
    'batphimtat', 'doctentruyen', 'doctenchuong', 'customDict'
], syncData => {
    Object.assign(khoa_api, syncData);
    if (syncData.smartPauses) thoiGianNghi = syncData.smartPauses;
    maydoc = syncData.savedEngine || syncData.maydoc || 'auto';

    if (syncData.speed !== undefined) tocdohientai = syncData.speed;
    if (syncData.volume !== undefined) amluonghientai = syncData.volume;
    if (syncData.voiceIndex !== undefined) chisogionghientai = syncData.voiceIndex;

    tudongchuyenchuong = syncData.tudongchuyenchuong !== undefined ? syncData.tudongchuyenchuong : true;
    batphimtat = syncData.batphimtat !== undefined ? syncData.batphimtat : true;
    doctentruyen = syncData.doctentruyen !== undefined ? syncData.doctentruyen : true;
    doctenchuong = syncData.doctenchuong !== undefined ? syncData.doctenchuong : true;
    caidatdatai = true;
});

chrome.storage.onChanged.addListener((thay_doi, vung_chon) => {
    if (vung_chon === 'sync') {
        if (thay_doi.customDict) tuDienHienTai = thay_doi.customDict.newValue;
        if (thay_doi.batphimtat) batphimtat = thay_doi.batphimtat.newValue;
        if (thay_doi.doctentruyen !== undefined || thay_doi.doctenchuong !== undefined) {
            if (thay_doi.doctentruyen !== undefined) doctentruyen = thay_doi.doctentruyen.newValue;
            if (thay_doi.doctenchuong !== undefined) doctenchuong = thay_doi.doctenchuong.newValue;
            const nuttruyen = document.getElementById('booknameholder') || document.getElementById('book_name2');
            if (nuttruyen) nuttruyen.classList.remove('tts-chunk');
            const nutchuong = document.getElementById('bookchapnameholder');
            if (nutchuong) nutchuong.classList.remove('tts-chunk');
            cacdoan_ws = [];
            cacdoanamthanh = [];
            chuanbi_ngam();
            const congcu = maydoc === 'auto' || maydoc === 'google' ? 'web' : maydoc;
            capnhatnoibat(congcu === 'web' ? chisodoan_ws : chisoamthanh, congcu === 'web' ? cacdoan_ws : cacdoanamthanh);
        }
    }
});

document.addEventListener('keydown', e => {
    if (!batphimtat) return;
    if (!caidatdatai) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable || e.isComposing) return;
    if (e.target.closest && e.target.closest('#stv-mini-player, #stv-mini-bubble')) return;
    switch (e.key.toLowerCase()) {
        case 'k': e.preventDefault(); chuyendoiphat(); break;
        case 'arrowleft': e.preventDefault(); bamchuongtruoc(); break;
        case 'arrowright': e.preventDefault(); bamchuongsau(); break;
        case 'r': e.preventDefault(); doclaichuong(); break;
        case 'escape': e.preventDefault(); dungtatca(); break;
    }
});

let timer_luutrangthai = null;
function luutrangthaitienhat_debounce() {
    if (timer_luutrangthai) clearTimeout(timer_luutrangthai);
    timer_luutrangthai = setTimeout(luutrangthaitienhat, 1000);
}

function luutrangthaitienhat() {
    const congcu = maydoc === 'auto' || maydoc === 'google' ? 'web' : maydoc;
    const cur = (congcu === 'web' ? chisodoan_ws : chisoamthanh) + 1;
    const tot = congcu === 'web' ? cacdoan_ws.length : cacdoanamthanh.length;
    let tentruyen = document.getElementById('booknameholder')?.innerText.trim() || document.getElementById('book_name2')?.innerText.trim() || document.querySelector('h1')?.innerText.trim() || '';
    let tenchuong = document.getElementById('bookchapnameholder')?.innerText.trim() || '';
    if (!tentruyen || tot === 0) return;
    chrome.storage.local.set({
        last_active_state: {
            bookTitle: tentruyen, chapTitle: tenchuong, pageUrl: window.location.href,
            progress: { current: cur, total: tot },
            isPlaying: dangphat, isPaused: dangtamdung, ttsEngine: congcu
        }
    });
    chrome.storage.local.get('readingList', data => {
        let danh_sach = data.readingList || [];
        let idx = danh_sach.findIndex(i => (i.title || '').trim().toLowerCase() === (tentruyen || '').trim().toLowerCase());
        if (idx !== -1) {
            let cap_nhat = false;
            if (danh_sach[idx].url !== window.location.href) { danh_sach[idx].url = window.location.href; cap_nhat = true; }
            if (danh_sach[idx].chap !== tenchuong) { danh_sach[idx].chap = tenchuong; cap_nhat = true; }
            if (danh_sach[idx].chunkIndex !== cur || danh_sach[idx].chunkTotal !== tot) {
                danh_sach[idx].chunkIndex = cur;
                danh_sach[idx].chunkTotal = tot;
                cap_nhat = true;
            }
            if (cap_nhat) chrome.storage.local.set({ readingList: danh_sach });
        }
    });
}

function taoMiniPlayer() {
    if (document.getElementById('stv-mini-player')) return;

    const kieu = document.createElement('style');
    kieu.id = 'stv-mini-player-styles';
    kieu.textContent = `
        #stv-mini-player {
            position: fixed;
            bottom: 20px;
            left: 14px;
            width: 275px;
            background: linear-gradient(140deg, #1a1929 0%, #12111e 100%);
            border: 1px solid #2e2c45;
            border-radius: 14px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(232,160,69,0.08);
            z-index: 2147483646;
            font-family: 'Be Vietnam Pro', system-ui, -apple-system, sans-serif;
            font-size: 12px;
            color: #e8e6f0;
            user-select: none;
            transition: opacity 0.25s, transform 0.25s;
            overflow: hidden;
            -webkit-user-select: none;
        }
        #stv-mini-player, #stv-mini-player *, #stv-mini-bubble, #stv-mini-bubble * {
            user-select: none !important;
            -webkit-user-select: none !important;
        }
        #stv-mini-player.stv-mp-hidden {
            opacity: 0;
            transform: translateY(14px);
            pointer-events: none;
        }
        #stv-mini-player .stv-mp-drag {
            padding: 8px 10px 4px 12px;
            cursor: grab;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        #stv-mini-player .stv-mp-drag:active { cursor: grabbing; }
        #stv-mini-player .stv-mp-lbl {
            flex: 1;
            font-size: 9px;
            font-weight: 700;
            color: #7a7896;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        #stv-mini-player .stv-mp-status-dot {
            width: 6px; height: 6px;
            border-radius: 50%;
            background: #4caf86;
            flex-shrink: 0;
        }
        #stv-mini-player .stv-mp-status-dot.paused { background: #e8a045; }
        #stv-mini-player .stv-mp-status-dot.stopped { background: #7a7896; }
        #stv-mini-player .stv-mp-min-btn {
            background: none;
            border: none;
            color: #7a7896;
            cursor: pointer;
            padding: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: color 0.15s, background 0.15s;
            flex-shrink: 0;
        }
        #stv-mini-player .stv-mp-min-btn:hover { color: #e8a045; background: rgba(232,160,69,0.1); }
        #stv-mini-player .stv-mp-chap {
            padding: 0 12px 6px;
            font-size: 11px;
            font-weight: 500;
            color: #e8e6f0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.4;
        }
        #stv-mini-player .stv-mp-bar-wrap { padding: 0 12px; margin-bottom: 8px; }
        #stv-mini-player .stv-mp-bar-bg {
            height: 3px;
            background: #2e2c45;
            border-radius: 99px;
            overflow: hidden;
        }
        #stv-mini-player .stv-mp-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #e8a045, #c45c8a);
            border-radius: 99px;
            width: 0%;
            transition: width 0.4s ease;
        }
        #stv-mini-player .stv-mp-controls {
            display: flex;
            align-items: center;
            padding: 2px 10px 10px;
            gap: 4px;
        }
        #stv-mini-player .stv-mp-btn {
            background: rgba(255,255,255,0.04);
            border: 1px solid #2e2c45;
            color: #e8e6f0;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s;
            padding: 0;
            flex-shrink: 0;
        }
        #stv-mini-player .stv-mp-btn:hover {
            background: rgba(232,160,69,0.12);
            border-color: rgba(232,160,69,0.5);
            color: #e8a045;
        }
        #stv-mini-player .stv-mp-btn-sm { width: 28px; height: 28px; }
        #stv-mini-player .stv-mp-btn-play {
            width: 36px;
            height: 36px;
            background: #e8a045;
            border-color: #e8a045;
            color: #0f0e17;
            border-radius: 50%;
            box-shadow: 0 0 14px rgba(232,160,69,0.35);
        }
        #stv-mini-player .stv-mp-btn-play:hover {
            background: #f0b855;
            border-color: #f0b855;
            color: #0f0e17;
            transform: scale(1.07);
        }
        #stv-mini-player .stv-mp-right {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 5px;
            overflow: hidden;
        }
        #stv-mini-player .stv-mp-progress-txt {
            font-size: 10px;
            color: #7a7896;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
        }
        #stv-mini-player .stv-mp-engine-badge {
            font-size: 8px;
            font-weight: 700;
            background: rgba(255,255,255,0.06);
            border: 1px solid #2e2c45;
            border-radius: 4px;
            padding: 1px 5px;
            color: #7a7896;
            letter-spacing: 0.4px;
            white-space: nowrap;
        }

        #stv-mini-bubble {
            position: fixed;
            bottom: 20px;
            left: 14px;
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #e8a045, #c45c8a);
            color: #ffffff;
            border-radius: 50%;
            box-shadow: 0 4px 18px rgba(232,160,69,0.45);
            z-index: 2147483646;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: opacity 0.25s, transform 0.25s;
            border: 2px solid rgba(255,255,255,0.12);
        }
        #stv-mini-bubble.stv-mp-hidden {
            opacity: 0;
            transform: scale(0.75);
            pointer-events: none;
        }
        #stv-mini-bubble:hover { transform: scale(1.1); box-shadow: 0 6px 22px rgba(232,160,69,0.6); }
        @keyframes stv-pulse-bubble {
            0%, 100% { box-shadow: 0 4px 18px rgba(232,160,69,0.45); }
            50%        { box-shadow: 0 4px 26px rgba(232,160,69,0.75); }
        }
        #stv-mini-bubble.stv-playing { animation: stv-pulse-bubble 2s ease-in-out infinite; }
    `;
    document.head.appendChild(kieu);

    const player = document.createElement('div');
    player.id = 'stv-mini-player';
    player.classList.add('stv-mp-hidden');
    player.innerHTML = `
        <div class="stv-mp-drag" id="stv-mp-drag-handle">
            <span class="stv-mp-status-dot" id="stv-mp-dot"></span>
            <span class="stv-mp-lbl">Auto Đọc STV</span>
            <button class="stv-mp-min-btn" id="stv-mp-minimize" title="Thu nhỏ" tabindex="-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
            </button>
        </div>
        <div class="stv-mp-chap" id="stv-mp-chap">Đang tải...</div>
        <div class="stv-mp-bar-wrap">
            <div class="stv-mp-bar-bg"><div class="stv-mp-bar-fill" id="stv-mp-bar-fill"></div></div>
        </div>
        <div class="stv-mp-controls">
            <button class="stv-mp-btn" id="stv-mp-mode" title="Đổi chức năng Tới/Lùi (Chương hoặc Đoạn)" tabindex="-1" style="height: 28px; padding: 0 8px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.5px; flex-shrink: 0; min-width: 62px;">CHƯƠNG</button>

            <button class="stv-mp-btn stv-mp-btn-sm" id="stv-mp-prev" title="Lùi lại" tabindex="-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
            </button>

            <button class="stv-mp-btn stv-mp-btn-play" id="stv-mp-playpause" title="Phát / Dừng" tabindex="-1">
                <svg id="stv-mp-icon-play" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="display:none;margin-left:2px"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <svg id="stv-mp-icon-pause" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            </button>

            <button class="stv-mp-btn stv-mp-btn-sm" id="stv-mp-next" title="Tiếp theo" tabindex="-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
            </button>
            <div class="stv-mp-right">
                <span class="stv-mp-progress-txt" id="stv-mp-progress-txt">—</span>
                <span class="stv-mp-engine-badge" id="stv-mp-engine-badge">WEB</span>
            </div>
        </div>
    `;
    document.body.appendChild(player);

    const bubble = document.createElement('div');
    bubble.id = 'stv-mini-bubble';
    bubble.classList.add('stv-mp-hidden');
    bubble.title = 'Mở trình phát';
    bubble.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>';
    document.body.appendChild(bubble);

    document.getElementById('stv-mp-playpause').addEventListener('click', e => { e.stopPropagation(); chuyendoiphat(); });

    document.getElementById('stv-mp-mode').addEventListener('click', e => {
        e.stopPropagation();
        miniPlayerMode = miniPlayerMode === 'chapter' ? 'chunk' : 'chapter';
        chrome.storage.local.set({ miniPlayerMode });
        capnhatMiniPlayer();
    });

    document.getElementById('stv-mp-prev').addEventListener('click', e => {
        e.stopPropagation();
        if (miniPlayerMode === 'chapter') bamchuongtruoc();
        else xulynhaydoan('truoc');
    });

    document.getElementById('stv-mp-next').addEventListener('click', e => {
        e.stopPropagation();
        if (miniPlayerMode === 'chapter') bamchuongsau();
        else xulynhaydoan('sau');
    });
    document.getElementById('stv-mp-minimize').addEventListener('click', e => {
        e.stopPropagation();
        isMiniPlayerMinimized = true;
        chrome.storage.local.set({ isMiniPlayerMinimized: true });
        capnhatMiniPlayer();
    });
    bubble.addEventListener('click', () => {
        isMiniPlayerMinimized = false;
        chrome.storage.local.set({ isMiniPlayerMinimized: false });
        capnhatMiniPlayer();
    });

    let dragging = false, dX, dY, iL, iB;
    const handle = document.getElementById('stv-mp-drag-handle');

    function onDragStart(e) {
        dragging = true;
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        const r = player.getBoundingClientRect();
        dX = cx; dY = cy;
        iL = r.left;
        iB = window.innerHeight - r.bottom;
        e.preventDefault();
    }
    function onDragMove(e) {
        if (!dragging) return;
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        const newL = Math.max(0, Math.min(window.innerWidth - player.offsetWidth, iL + (cx - dX)));
        const newB = Math.max(0, Math.min(window.innerHeight - player.offsetHeight, iB - (cy - dY)));
        player.style.left = newL + 'px';
        player.style.bottom = newB + 'px';
        player.style.right = 'auto';
        bubble.style.left = newL + 'px';
        bubble.style.bottom = newB + 'px';
        bubble.style.right = 'auto';
    }
    function onDragEnd() { dragging = false; }

    handle.addEventListener('mousedown', onDragStart);
    handle.addEventListener('touchstart', onDragStart, { passive: false });
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchend', onDragEnd);
    window.addEventListener('contextmenu', e => {
        if (e.target.closest('#stv-mini-player, #stv-mini-bubble')) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);
}

function capnhatMiniPlayer() {
    const player = document.getElementById('stv-mini-player');
    const bubble = document.getElementById('stv-mini-bubble');
    if (!player || !bubble) return;

    const congcu = maydoc === 'auto' || maydoc === 'google' ? 'web' : maydoc;
    const total = congcu === 'web' ? cacdoan_ws.length : cacdoanamthanh.length;
    const current = (congcu === 'web' ? chisodoan_ws : chisoamthanh) + 1;
    const isActive = dangphat || dangtamdung;
    const isPlaying = dangphat && !dangtamdung;

    const chapSrc = document.getElementById('bookchapnameholder');
    const chapEl = document.getElementById('stv-mp-chap');
    if (chapEl && chapSrc) chapEl.textContent = chapSrc.innerText.trim() || 'Đang đọc...';

    const fill = document.getElementById('stv-mp-bar-fill');
    const txt = document.getElementById('stv-mp-progress-txt');
    if (fill) fill.style.width = total > 0 ? Math.round((current / total) * 100) + '%' : '0%';
    if (txt) txt.textContent = total > 0 ? `${current}/${total}` : '—';

    const iPlay = document.getElementById('stv-mp-icon-play');
    const iPause = document.getElementById('stv-mp-icon-pause');
    if (iPlay && iPause) {
        iPlay.style.display = isPlaying ? 'none' : 'block';
        iPause.style.display = isPlaying ? 'block' : 'none';
    }

    const btnMode = document.getElementById('stv-mp-mode');
    if (btnMode) {
        btnMode.textContent = miniPlayerMode === 'chapter' ? 'CHƯƠNG' : 'ĐOẠN';
        btnMode.style.color = miniPlayerMode === 'chapter' ? '#e8e6f0' : '#e8a045';
        btnMode.style.borderColor = miniPlayerMode === 'chapter' ? '#2e2c45' : 'rgba(232,160,69,0.5)';
        btnMode.style.background = miniPlayerMode === 'chapter' ? 'rgba(255,255,255,0.04)' : 'rgba(232,160,69,0.1)';
    }

    const btnPrev = document.getElementById('stv-mp-prev');
    const btnNext = document.getElementById('stv-mp-next');
    if (btnPrev && btnNext) {
        btnPrev.title = miniPlayerMode === 'chapter' ? 'Chương trước' : 'Đoạn trước';
        btnNext.title = miniPlayerMode === 'chapter' ? 'Chương sau' : 'Đoạn sau';
    }

    if (isMiniPlayerMinimized) {
        player.classList.add('stv-mp-hidden');
        bubble.classList.remove('stv-mp-hidden');
        if (isPlaying) bubble.classList.add('stv-playing');
        else bubble.classList.remove('stv-playing');
    } else {
        player.classList.remove('stv-mp-hidden');
        bubble.classList.add('stv-mp-hidden');
        const dot = document.getElementById('stv-mp-dot');
        if (dot) {
            if (isPlaying) dot.className = 'stv-mp-status-dot';
            else if (isActive) dot.className = 'stv-mp-status-dot paused';
            else dot.className = 'stv-mp-status-dot stopped';
        }
    }
}

taoMiniPlayer();

let choSTVTaiXong = setInterval(() => {
    const el = document.querySelector('.contentbox');
    if (el && !el.innerText.includes('Đang tải nội dung') && el.innerText.trim().length >= 50) {
        clearInterval(choSTVTaiXong);
        chuanbi_ngam();
        capnhatMiniPlayer();
    }
}, 500);
