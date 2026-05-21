'use strict';

function phachongantrom() {
    const kieu = document.createElement('style');
    kieu.innerHTML = `* { user-select: text !important; }`;
    document.head.appendChild(kieu);
    ['contextmenu', 'copy', 'cut', 'paste'].forEach(ev => {
        document.addEventListener(ev, e => e.stopPropagation(), true);
    });
}
phachongantrom();

let tudienhientai = [];
chrome.storage.local.get('customDict', d => { tudienhientai = d.customDict || []; });

const tonghopam = window.speechSynthesis;
let maydoc = 'auto';
let dangphat = false;
let dangtamdung = false;
let tudongchuyenchuong = true;
let tocdohientai = 1.0;
let amluonghientai = 1.0;
let chisogionghientai = -1;
let cacgionghienuy = [];
let khoaapi = { fpt_key: '', azure_key: '', azure_region: 'southeastasia' };
let cacdoanweb = [];
let chisodoanweb = 0;
let phatngonhientai = null;
let amthanhhientai = null;
let cacdoanamthanh = [];
let chisoamthanh = 0;
let giaydatroi = 0;
let mahengiongu = null;
let batphimtat = true;
let doctentruyen = true;
let doctenchuong = true;
let cauhinhdungtuychon = null;
let dabamdung = false;
let dachuongdung = false;
let doandaluu = 0;
let thoigiandatroichinhxac = 0;
let tickcuoicung = Date.now();
let mahengionhaydoan = null;
let idluotphat = 0;
let dadatcaidat = false;
let solanloilientuc = 0;
const NGUONGDUPPHONG = 2;
let dangthumominiplayer = false;
let chedominiplayer = 'chapter';
let thoigianngh = { comma: 300, dot: 800, para: 1200 };
let caccachedaluu = [];

const henkiemdb = new Promise((resolve, reject) => {
    const yeucau = indexedDB.open('STV_TTS_Cache', 1);
    yeucau.onupgradeneeded = (e) => {
        e.target.result.createObjectStore('audioBlobs');
    };
    yeucau.onsuccess = (e) => resolve(e.target.result);
    yeucau.onerror = (e) => reject(e);
});

async function luuamthanhdb(khoa, blob) {
    const db = await henkiemdb;
    return new Promise((resolve) => {
        const tx = db.transaction('audioBlobs', 'readwrite');
        tx.objectStore('audioBlobs').put(blob, khoa);
        tx.oncomplete = () => {
            if (!caccachedaluu.includes(khoa)) caccachedaluu.push(khoa);
            resolve();
        };
    });
}

async function layamthanhdb(khoa) {
    const db = await henkiemdb;
    return new Promise((resolve) => {
        const tx = db.transaction('audioBlobs', 'readonly');
        const req = tx.objectStore('audioBlobs').get(khoa);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
    });
}

async function xoacsdl() {
    const db = await henkiemdb;
    return new Promise((resolve) => {
        const tx = db.transaction('audioBlobs', 'readwrite');
        const store = tx.objectStore('audioBlobs');

        caccachedaluu.forEach(khoa => store.delete(khoa));

        tx.oncomplete = () => {
            caccachedaluu = [];
            resolve();
        };
    });
}

function thoatregex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function lamtranhvanban(vanban) {
    if (!vanban) return '';
    let txt = vanban
        .replace(/Đang tải nội dung chương\.\.\./gi, '')
        .replace(/@Bạn đang đọc bản lưu.*/gi, '')
        .replace(/@Thực hiện bởi Sáng Tác Việt.*/gi, '')
        .trim();
    if (tudienhientai.length > 0) {
        const danhsachquytac = tudienhientai.slice(0, 50);
        for (const quytac of danhsachquytac) {
            try {
                const thaytheantoan = quytac.replace.replace(/\$/g, '$$$$');
                txt = txt.replace(new RegExp(thoatregex(quytac.origin), 'gi'), thaytheantoan);
            } catch (e) { }
        }
    }
    return txt;
}

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
            baocacdong(khung);
            khung.dataset.ttsPrepared = 'true';
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
    const ketqua = cacdoan.filter(c => c.trim().length > 0);
    return ketqua.length > 0 ? ketqua : [vanban];
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
    debounceluutrangthai();
    capnhatminiplayer();
}

function taomakhoa(vanban) {
    const sach = vanban.replace(/\s+/g, '');
    let hash = 5381;
    for (let i = 0; i < sach.length; i++) hash = ((hash << 5) + hash) ^ sach.charCodeAt(i);
    return (hash >>> 0).toString(36) + '_' + sach.length;
}

const bondemurl = new Map();
let audioCtx = null;
const audioSourceMap = new WeakMap();

function layAudioContext() {
    if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return null; }
    }
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
}

function ketnoiNormalize(amthanh) {
    try {
        const ctx = layAudioContext();
        if (audioSourceMap.has(amthanh)) return audioSourceMap.get(amthanh);
        const source = ctx.createMediaElementSource(amthanh);
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -18;
        compressor.knee.value = 30;
        compressor.ratio.value = 10;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        const gainNode = ctx.createGain();
        gainNode.gain.value = amluonghientai;
        source.connect(compressor);
        compressor.connect(gainNode);
        gainNode.connect(ctx.destination);
        audioSourceMap.set(amthanh, gainNode);
        return gainNode;
    } catch(e) { return null; }
}

function xoabondemurl() {
    bondemurl.forEach(url => URL.revokeObjectURL(url));
    bondemurl.clear();
}

async function layamthanhtubackground(vanban, maydoc, chisogiong, tocdo) {
    return new Promise((resolve, reject) => {
        const mayeucau = Math.random().toString(36);
        chrome.runtime.sendMessage({ action: 'fetchAudio', vanban, maydoc, chisogiong, tocdo, mayeucau }, phanhoi => {
            if (phanhoi.error) reject(new Error(phanhoi.error));
            else if (phanhoi.dulieublob) {
                const dulieublob = new Blob([new Uint8Array(phanhoi.dulieublob)]);
                resolve(dulieublob);
            } else reject(new Error('No data'));
        });
    });
}

async function layamthanhtuapi(vanban, congcudoc, solanth = 3) {
    const cacheKey = taomakhoa(vanban);
    const cachedBlob = await layamthanhdb(cacheKey);
    if (cachedBlob) {
        if (!bondemurl.has(cacheKey)) bondemurl.set(cacheKey, URL.createObjectURL(cachedBlob));
        return bondemurl.get(cacheKey);
    }
    const ketqua = await layamthanhtubackground(vanban, congcudoc, chisogionghientai, tocdohientai);
    if (ketqua instanceof Blob) {
        await luuamthanhdb(cacheKey, ketqua);
        const url = URL.createObjectURL(ketqua);
        bondemurl.set(cacheKey, url);
        return url;
    }
    return ketqua;
}

async function taitruocchuongsau() {
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
        let cacdoantext = [];
        const themtext = (txt) => {
            txt = lamtranhvanban(txt);
            if (txt.length > 0) {
                const chunks = chiadoanvanban(txt, maydoc === 'fpt' ? 2000 : 1000);
                cacdoantext.push(...chunks);
            }
        };
        if (doctentruyen) {
            let nut = doc.getElementById('booknameholder') || doc.getElementById('book_name2');
            if (nut) themtext(nut.textContent);
        }
        if (doctenchuong) {
            let nut = doc.getElementById('bookchapnameholder');
            if (nut) themtext(nut.textContent);
        }
        const cackhung = doc.querySelectorAll('.contentbox');
        cackhung.forEach(khung => {
            let clone = khung.cloneNode(true);
            clone.innerHTML = clone.innerHTML.replace(/<br\s*[\/]?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n");
            themtext(clone.textContent);
        });
        await xoacsdl();
        xoabondemurl();
        for (let i = 0; i < Math.min(2, cacdoantext.length); i++) {
            const text = cacdoantext[i];
            const khoa = taomakhoa(text);
            let ketqua = await layamthanhtubackground(text, maydoc, chisogionghientai, tocdohientai);
            if (ketqua instanceof Blob) {
                await luuamthanhdb(khoa, ketqua);
            } else if (ketqua && ketqua.startsWith('blob:')) {
                const b = await fetch(ketqua).then(r => r.blob());
                await luuamthanhdb(khoa, b);
            }
        }
    } catch (e) { }
}

function duptrongweb(lydo) {
    if (maydoc === 'web' || maydoc === 'auto') return;
    const congcucu = maydoc;
    maydoc = 'web';
    solanloilientuc = 0;
    hienthithongbao(`⚠️ ${lydo} - Đã chuyển sang Web Speech`);
    chrome.runtime.sendMessage({ action: 'engineFallback', from: congcucu });
    if (amthanhhientai) { amthanhhientai.pause(); amthanhhientai.src = ''; amthanhhientai = null; }
    cacdoanweb = [];
    chuanbingam();
    if (dangphat && !dangtamdung) phatdoanweb();
}

async function phatdoanamthanh(boquanghi = false) {
    if (!dangphat || dangtamdung) return;
    if (chisoamthanh >= cacdoanamthanh.length) {
        dangphat = false;
        xulyketthucchuong();
        return;
    }
    let idht = idluotphat;

    let delay = 0;
    if (!boquanghi && chisoamthanh > 0) {
        const doantruoc = cacdoanamthanh[chisoamthanh - 1].text.trim();
        if (doantruoc.match(/[,;]$/)) delay = thoigianngh.comma;
        else if (doantruoc.match(/[.!?…:]$/)) delay = thoigianngh.dot;
        else delay = thoigianngh.para;
    }
    if (delay > 0) {
        setTimeout(() => {
            if (idht !== idluotphat) return;
            phatdoanamthanh(true);
        }, delay);
        return;
    }
    if (amthanhhientai) {
        amthanhhientai.pause();
        amthanhhientai.src = '';
        amthanhhientai = null;
    }
    const doan = cacdoanamthanh[chisoamthanh];
    capnhatnoibat(chisoamthanh, cacdoanamthanh);
    if (!doan.url) {
        try {
            document.body.style.cursor = 'wait';
            doan.url = await layamthanhtuapi(doan.text, maydoc);
            if (idht !== idluotphat) {
                if (doan.url && doan.url.startsWith('blob:')) {
                    URL.revokeObjectURL(doan.url);
                    bondemurl.delete(taomakhoa(doan.text));
                }
                return;
            }
            document.body.style.cursor = 'default';
        } catch (err) {
            document.body.style.cursor = 'default';
            if (idht === idluotphat) {
                solanloilientuc++;
                if (solanloilientuc >= NGUONGDUPPHONG) {
                    duptrongweb('API lỗi liên tục');
                    return;
                }
                chisoamthanh++;
                setTimeout(() => phatdoanamthanh(true), 100);
            }
            return;
        }
    }
    if (idht !== idluotphat) return;
    const amthanh = new Audio(doan.url);
    amthanhhientai = amthanh;
    const gainNode = ketnoiNormalize(amthanh);
    if (gainNode) gainNode.gain.value = amluonghientai;
    else amthanh.volume = amluonghientai;
    amthanh.playbackRate = tocdohientai;
    solanloilientuc = 0;
    const SOLUONGPREFETCH = 3;
    for (let i = 1; i <= SOLUONGPREFETCH; i++) {
        let idx = chisoamthanh + i;
        if (idx < cacdoanamthanh.length && !cacdoanamthanh[idx].url && !cacdoanamthanh[idx].isFetching) {
            cacdoanamthanh[idx].isFetching = true;
            const idhtPrefetch = idluotphat;
            layamthanhtuapi(cacdoanamthanh[idx].text, maydoc)
                .then(url => {
                    if (idhtPrefetch === idluotphat) {
                        cacdoanamthanh[idx].url = url;
                    }
                    cacdoanamthanh[idx].isFetching = false;
                })
                .catch(() => { cacdoanamthanh[idx].isFetching = false; });
        }
    }
    if (chisoamthanh >= cacdoanamthanh.length * 0.8 && !window.isPrefetchingNext) {
        window.isPrefetchingNext = true;
        taitruocchuongsau();
    }
    amthanh.onended = () => {
        if (doan.url && doan.url.startsWith('blob:')) { URL.revokeObjectURL(doan.url); bondemurl.delete(taomakhoa(doan.text)); doan.url = null; }
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
    cacdoanamthanh.forEach(c => {
        if (c.url && c.url.startsWith('blob:')) {
            URL.revokeObjectURL(c.url);
            bondemurl.delete(taomakhoa(c.text));
            c.url = null;
        }
    });
    cacdoanamthanh = [];
    chisoamthanh = 0;
    document.querySelectorAll('.tts-reading').forEach(el => el.classList.remove('tts-reading'));
}

function huyphatngonantoan() { if (tonghopam.paused) tonghopam.resume(); tonghopam.cancel(); }

function dungtrinhdocweb() {
    huyphatngonantoan();
    phatngonhientai = null;
    cacdoanweb = [];
    chisodoanweb = 0;
    document.querySelectorAll('.tts-reading').forEach(el => el.classList.remove('tts-reading'));
}

async function phatdoanweb(boquanghi = false) {
    if (!dangphat || dangtamdung) return;
    if (chisodoanweb >= cacdoanweb.length) { dangphat = false; xulyketthucchuong(); return; }
    let delay = 0;
    if (!boquanghi && chisodoanweb > 0) {
        const doantruoc = cacdoanweb[chisodoanweb - 1].text.trim();
        if (doantruoc.match(/[,;]$/)) delay = thoigianngh.comma;
        else if (doantruoc.match(/[.!?…:]$/)) delay = thoigianngh.dot;
        else delay = thoigianngh.para;
    }
    if (delay > 0) {
        setTimeout(() => phatdoanweb(true), delay);
        return;
    }
    huyphatngonantoan();
    capnhatnoibat(chisodoanweb, cacdoanweb);
    let idht = idluotphat;
    if (cacgionghienuy.length === 0) {
        cacgionghienuy = await taicacgiong();
    }
    if (idht !== idluotphat) return;
    const doan = cacdoanweb[chisodoanweb];
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
    phatngon.onend = () => { if (phatngonhientai !== phatngon) return; chisodoanweb++; if (dangphat && !dangtamdung) phatdoanweb(false); };
    phatngon.onerror = (e) => { if (e.error === 'interrupted' || e.error === 'canceled') return; if (dangphat && !dangtamdung) { chisodoanweb++; phatdoanweb(true); } };
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

function chuanbingam() {
    window.isPrefetchingNext = false;
    const congcu = maydoc === 'auto' || maydoc === 'google' ? 'web' : maydoc;
    if (congcu === 'web' && cacdoanweb.length > 0) return true;
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
        cacdoanweb = taocacdoanmaydoc(cacnutdoan, 300);
        if (doandaluu > 0) {
            chisodoanweb = Math.min(doandaluu, Math.max(0, cacdoanweb.length - 1));
            doandaluu = 0;
        } else if (cacdoanamthanh.length > 0 && chisoamthanh > 0) {
            chisodoanweb = Math.floor((chisoamthanh / cacdoanamthanh.length) * cacdoanweb.length) || 0;
        } else { chisodoanweb = 0; }
        capnhatnoibat(chisodoanweb, cacdoanweb);
    } else {
        cacdoanamthanh = taocacdoanmaydoc(cacnutdoan, congcu === 'fpt' ? 2000 : 1000).map(c => ({ ...c, url: null }));
        if (doandaluu > 0) {
            chisoamthanh = Math.min(doandaluu, Math.max(0, cacdoanamthanh.length - 1));
            doandaluu = 0;
        } else if (cacdoanweb.length > 0 && chisodoanweb > 0) {
            chisoamthanh = Math.floor((chisodoanweb / cacdoanweb.length) * cacdoanamthanh.length) || 0;
        } else { chisoamthanh = 0; }
        capnhatnoibat(chisoamthanh, cacdoanamthanh);
    }
    return true;
}

function batdaudoc() {
    taominiplayer();
    if (!chuanbingam()) { dangphat = false; return; }
    dangphat = true; dangtamdung = false;
    const congcu = maydoc === 'auto' || maydoc === 'google' ? 'web' : maydoc;
    if (congcu === 'web') phatdoanweb();
    else phatdoanamthanh();
}

function chuyendoiphat(tuychon = {}) {
    if (tuychon.speed !== undefined) tocdohientai = tuychon.speed;
    if (tuychon.volume !== undefined) amluonghientai = tuychon.volume;
    if (tuychon.voiceIndex !== undefined) chisogionghientai = tuychon.voiceIndex;
    const congcu = (maydoc === 'auto' || maydoc === 'google') ? 'web' : maydoc;
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
    capnhatminiplayer();
    return true;
}

function dungtatca() {
    idluotphat++;
    dungtrinhdocweb(); dungamthanh();
    dangphat = false; dangtamdung = false;
    giaydatroi = 0; thoigiandatroichinhxac = 0;
    capnhatminiplayer();
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
                if (cauhinhdungtuychon?.operator === 'and') {
                    dachuongdung = true;
                    if (!dabamdung) {
                        hienthithongbao('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg><span>Đã đủ số chương, đang chờ đủ thời gian...</span>');
                        setTimeout(() => bamchuongsau(true), 1200);
                        return;
                    }
                    cauhinhdungtuychon = null; dabamdung = false;
                    chrome.storage.local.remove([
                        'stopTime',
                        'stopChapters',
                        'sleepTargetTimestamp',
                        'stopRealtimeTarget',
                        'customStopConfig',
                        'stopAfterChapters'
                    ]); if (mahengiongu) { clearTimeout(mahengiongu); mahengiongu = null; }
                }
                dungtatca();
                hienthithongbao('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg><span>Đã dừng sau khi hoàn thành số chương hẹn trước!</span>');
            } else {
                chrome.storage.local.set({ stopAfterChapters: conlai - 1 }, () => setTimeout(() => bamchuongsau(true), 1200));
            }
        } else setTimeout(() => bamchuongsau(true), 1200);
    });
}

function bamchuongsau(latudong = false) {
    dungtatca();
    if (latudong) chrome.storage.local.set({ autoStartOnLoad: true, speed: tocdohientai, volume: amluonghientai, voiceIndex: chisogionghientai });
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

function xulynhaydoan(hanhdong, giatri) {
    chuanbingam();
    const congcu = (maydoc === 'auto' || maydoc === 'google') ? 'web' : maydoc;
    idluotphat++;
    if (congcu === 'web') {
        if (hanhdong === 'sau' && chisodoanweb < cacdoanweb.length - 1) chisodoanweb++;
        else if (hanhdong === 'truoc' && chisodoanweb > 0) chisodoanweb--;
        else if (hanhdong === 'nhay') chisodoanweb = Math.min(Math.max(0, giatri - 1), Math.max(0, cacdoanweb.length - 1));
        huyphatngonantoan();
        capnhatnoibat(chisodoanweb, cacdoanweb);
    } else {
        if (hanhdong === 'sau' && chisoamthanh < cacdoanamthanh.length - 1) chisoamthanh++;
        else if (hanhdong === 'truoc' && chisoamthanh > 0) chisoamthanh--;
        else if (hanhdong === 'nhay') chisoamthanh = Math.min(Math.max(0, giatri - 1), Math.max(0, cacdoanamthanh.length - 1));
        if (amthanhhientai) { amthanhhientai.pause(); amthanhhientai = null; }
        capnhatnoibat(chisoamthanh, cacdoanamthanh);
    }
    if (dangphat && !dangtamdung) {
        if (mahengionhaydoan) clearTimeout(mahengionhaydoan);
        mahengionhaydoan = setTimeout(() => {
            if (congcu === 'web') phatdoanweb(true);
            else phatdoanamthanh(true);
        }, 250);
    }
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

let timerluu = null;

function debounceluutrangthai() {
    if (timerluu) clearTimeout(timerluu);
    timerluu = setTimeout(luutrangthaitienhat, 1000);
}

function luutrangthaitienhat() {
    const congcu = maydoc === 'auto' || maydoc === 'google' ? 'web' : maydoc;
    const cur = (congcu === 'web' ? chisodoanweb : chisoamthanh) + 1;
    const tot = congcu === 'web' ? cacdoanweb.length : cacdoanamthanh.length;
    let tentruyen = document.getElementById('booknameholder')?.innerText.trim()
        || document.getElementById('book_name2')?.innerText.trim()
        || document.querySelector('h1')?.innerText.trim() || '';
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
        let danhsach = data.readingList || [];
        let idx = danhsach.findIndex(i =>
            (i.title || '').trim().toLowerCase() === (tentruyen || '').trim().toLowerCase()
        );
        if (idx !== -1) {
            let capnhat = false;
            if (danhsach[idx].url !== window.location.href) { danhsach[idx].url = window.location.href; capnhat = true; }
            if (danhsach[idx].chap !== tenchuong) { danhsach[idx].chap = tenchuong; capnhat = true; }
            if (danhsach[idx].chunkIndex !== cur || danhsach[idx].chunkTotal !== tot) {
                danhsach[idx].chunkIndex = cur; danhsach[idx].chunkTotal = tot; capnhat = true;
            }
            if (capnhat) chrome.storage.local.set({ readingList: danhsach });
        }
    });
}

function taominiplayer() {
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
        chedominiplayer = chedominiplayer === 'chapter' ? 'chunk' : 'chapter';
        chrome.storage.local.set({ miniPlayerMode: chedominiplayer });
        capnhatminiplayer();
    });

    document.getElementById('stv-mp-prev').addEventListener('click', e => {
        e.stopPropagation();
        if (chedominiplayer === 'chapter') bamchuongtruoc();
        else xulynhaydoan('truoc');
    });

    document.getElementById('stv-mp-next').addEventListener('click', e => {
        e.stopPropagation();
        if (chedominiplayer === 'chapter') bamchuongsau();
        else xulynhaydoan('sau');
    });

    document.getElementById('stv-mp-minimize').addEventListener('click', e => {
        e.stopPropagation();
        dangthumominiplayer = true;
        chrome.storage.local.set({ isMiniPlayerMinimized: true });
        capnhatminiplayer();
    });

    bubble.addEventListener('click', () => {
        dangthumominiplayer = false;
        chrome.storage.local.set({ isMiniPlayerMinimized: false });
        capnhatminiplayer();
    });

    let dangkeo = false, dx, dy, tral, trab;
    const handle = document.getElementById('stv-mp-drag-handle');

    function khibaodaukeo(e) {
        dangkeo = true;
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        const r = player.getBoundingClientRect();
        dx = cx; dy = cy;
        tral = r.left;
        trab = window.innerHeight - r.bottom;
        e.preventDefault();
    }
    function khidangkeo(e) {
        if (!dangkeo) return;
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        const newL = Math.max(0, Math.min(window.innerWidth - player.offsetWidth, tral + (cx - dx)));
        const newB = Math.max(0, Math.min(window.innerHeight - player.offsetHeight, trab - (cy - dy)));
        player.style.left = newL + 'px';
        player.style.bottom = newB + 'px';
        player.style.right = 'auto';
        bubble.style.left = newL + 'px';
        bubble.style.bottom = newB + 'px';
        bubble.style.right = 'auto';
    }
    function khiketthuckeo() { dangkeo = false; }

    handle.addEventListener('mousedown', khibaodaukeo);
    handle.addEventListener('touchstart', khibaodaukeo, { passive: false });
    document.addEventListener('mousemove', khidangkeo);
    document.addEventListener('touchmove', khidangkeo, { passive: false });
    document.addEventListener('mouseup', khiketthuckeo);
    document.addEventListener('touchend', khiketthuckeo);
    window.addEventListener('contextmenu', e => {
        if (e.target.closest('#stv-mini-player, #stv-mini-bubble')) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);
}

function capnhatminiplayer() {
    const player = document.getElementById('stv-mini-player');
    const bubble = document.getElementById('stv-mini-bubble');
    if (!player || !bubble) return;

    const contentBox = document.querySelector('.contentbox');
    const coMaHoa = document.getElementById('stv-obfuscation-warning');
    if (!contentBox && !coMaHoa) {
        player.classList.add('stv-mp-hidden');
        bubble.classList.add('stv-mp-hidden');
        return;
    }

    const congcu = maydoc === 'auto' || maydoc === 'google' ? 'web' : maydoc;
    const tongdoan = congcu === 'web' ? cacdoanweb.length : cacdoanamthanh.length;
    const doanhientai = (congcu === 'web' ? chisodoanweb : chisoamthanh) + 1;
    const danghoatdong = dangphat || dangtamdung;
    const dangphatht = dangphat && !dangtamdung;

    const chapSrc = document.getElementById('bookchapnameholder');
    const chapEl = document.getElementById('stv-mp-chap');
    if (chapEl && chapSrc) chapEl.textContent = chapSrc.innerText.trim() || 'Đang đọc...';

    const fill = document.getElementById('stv-mp-bar-fill');
    const txt = document.getElementById('stv-mp-progress-txt');
    if (fill) fill.style.width = tongdoan > 0 ? Math.round((doanhientai / tongdoan) * 100) + '%' : '0%';
    if (txt) txt.textContent = tongdoan > 0 ? `${doanhientai}/${tongdoan}` : '—';

    const iPlay = document.getElementById('stv-mp-icon-play');
    const iPause = document.getElementById('stv-mp-icon-pause');
    if (iPlay && iPause) {
        iPlay.style.display = dangphatht ? 'none' : 'block';
        iPause.style.display = dangphatht ? 'block' : 'none';
    }

    const btnMode = document.getElementById('stv-mp-mode');
    if (btnMode) {
        btnMode.textContent = chedominiplayer === 'chapter' ? 'CHƯƠNG' : 'ĐOẠN';
        btnMode.style.color = chedominiplayer === 'chapter' ? '#e8e6f0' : '#e8a045';
        btnMode.style.borderColor = chedominiplayer === 'chapter' ? '#2e2c45' : 'rgba(232,160,69,0.5)';
        btnMode.style.background = chedominiplayer === 'chapter' ? 'rgba(255,255,255,0.04)' : 'rgba(232,160,69,0.1)';
    }

    const btnPrev = document.getElementById('stv-mp-prev');
    const btnNext = document.getElementById('stv-mp-next');
    if (btnPrev && btnNext) {
        btnPrev.title = chedominiplayer === 'chapter' ? 'Chương trước' : 'Đoạn trước';
        btnNext.title = chedominiplayer === 'chapter' ? 'Chương sau' : 'Đoạn sau';
    }

    if (dangthumominiplayer) {
        player.classList.add('stv-mp-hidden');
        bubble.classList.remove('stv-mp-hidden');
        if (dangphatht) bubble.classList.add('stv-playing');
        else bubble.classList.remove('stv-playing');
    } else {
        player.classList.remove('stv-mp-hidden');
        bubble.classList.add('stv-mp-hidden');
        const dot = document.getElementById('stv-mp-dot');
        if (dot) {
            if (dangphatht) dot.className = 'stv-mp-status-dot';
            else if (danghoatdong) dot.className = 'stv-mp-status-dot paused';
            else dot.className = 'stv-mp-status-dot stopped';
        }
    }
}

chrome.runtime.onMessage.addListener((yeucau, _nguoigui, phanhoi) => {
    const congcu = (maydoc === 'auto' || maydoc === 'google') ? 'web' : maydoc;
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
            if (congcu === 'web' && dangphat && !dangtamdung) { phatngonhientai = null; huyphatngonantoan(); idluotphat++; phatdoanweb(); }
            if (amthanhhientai) amthanhhientai.playbackRate = tocdohientai;
            trave(); break;
        case 'setVolume':
            amluonghientai = yeucau.value;
            if (amthanhhientai) {
                const gn = audioSourceMap.get(amthanhhientai);
                if (gn) gn.gain.value = amluonghientai;
                else amthanhhientai.volume = amluonghientai;
            }
            trave(); break;
        case 'setEngine': {
            const congcucu = maydoc === 'auto' ? 'web' : maydoc;
            maydoc = yeucau.value || 'auto';
            chrome.storage.sync.set({ maydoc });
            const congcumoi = maydoc === 'auto' ? 'web' : maydoc;
            if (congcucu !== congcumoi) {
                idluotphat++;
                if (congcumoi === 'web') cacdoanweb = [];
                else cacdoanamthanh = [];
                if (dangphat || dangtamdung) {
                    huyphatngonantoan();
                    if (amthanhhientai) { amthanhhientai.pause(); amthanhhientai.src = ''; amthanhhientai = null; }
                    chuanbingam();
                    if (dangphat && !dangtamdung) {
                        if (congcumoi === 'web') phatdoanweb();
                        else phatdoanamthanh();
                    }
                }
            }
            trave(); break;
        }
        case 'setVoice':
            if (String(chisogionghientai) === String(yeucau.value)) { trave(); break; }
            chisogionghientai = yeucau.value;
            if (dangphat || dangtamdung) {
                const dangphatcu = dangphat;
                huyphatngonantoan();
                if (amthanhhientai) { amthanhhientai.pause(); amthanhhientai.src = ''; amthanhhientai = null; }
                cacdoanamthanh.forEach(c => { if (c.url && c.url.startsWith('blob:')) URL.revokeObjectURL(c.url); c.url = null; });
                if (dangphatcu) {
                    idluotphat++;
                    const congcuht = maydoc === 'auto' ? 'web' : maydoc;
                    if (congcuht === 'web') phatdoanweb();
                    else phatdoanamthanh();
                } else {
                    dangtamdung = true;
                    const congcuht = maydoc === 'auto' ? 'web' : maydoc;
                    capnhatnoibat(congcuht === 'web' ? chisodoanweb : chisoamthanh, congcuht === 'web' ? cacdoanweb : cacdoanamthanh);
                }
            }
            trave(); break;
        case 'setPauses': thoigianngh = yeucau; trave(); break;
        case 'setApiKeys': Object.assign(khoaapi, yeucau); chrome.storage.local.set(yeucau); trave(); break;
        case 'setSleepTimer':
            if (mahengiongu) clearTimeout(mahengiongu);
            dabamdung = false;
            if (yeucau.minutes > 0) {
                const msngu = yeucau.minutes * 60 * 1000;
                chrome.storage.local.set({ sleepTargetTimestamp: Date.now() + msngu });
                mahengiongu = setTimeout(() => {
                    chrome.storage.local.remove('sleepTargetTimestamp');
                    if (cauhinhdungtuychon?.operator === 'and') {
                        dabamdung = true;
                        if (!dachuongdung) {
                            hienthithongbao('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Đã đủ thời gian, đang chờ đủ số chương...</span>');
                            return;
                        }
                        cauhinhdungtuychon = null; dachuongdung = false;
                        chrome.storage.local.remove(['customStopConfig', 'stopAfterChapters']);
                    }
                    dungtatca();
                }, msngu);
            } else chrome.storage.local.remove('sleepTargetTimestamp');
            trave(); break;
        case 'setStopChapters':
            dachuongdung = false;
            if (yeucau.count > 0) chrome.storage.local.set({ stopAfterChapters: yeucau.count });
            else chrome.storage.local.remove('stopAfterChapters');
            trave(); break;
        case 'setCustomStop':
            cauhinhdungtuychon = yeucau.config || null;
            dabamdung = false; dachuongdung = false;
            if (cauhinhdungtuychon) chrome.storage.local.set({ customStopConfig: cauhinhdungtuychon });
            else chrome.storage.local.remove('customStopConfig');
            trave(); break;
        case 'getInfo':
            (async () => {
                chuanbingam();
                let tentruyen = document.getElementById('booknameholder')?.innerText.trim() || document.getElementById('book_name2')?.innerText.trim() || document.querySelector('h1')?.innerText.trim() || '';
                let tenchuong = document.getElementById('bookchapnameholder')?.innerText.trim() || '';
                let duongdananh = await layvathuanhbia() || '';
                const p = window.location.pathname.split('/').filter(Boolean);
                const duongdantruyen = p.length >= 4 ? `${window.location.origin}/${p[0]}/${p[1]}/${p[2]}/${p[3]}/` : window.location.href;
                const tongdoan = congcu === 'web' ? cacdoanweb.length : cacdoanamthanh.length;
                const doanhientai = congcu === 'web' ? chisodoanweb : chisoamthanh;
                if (!dangphat && !dangtamdung && tongdoan > 0) capnhatnoibat(doanhientai, congcu === 'web' ? cacdoanweb : cacdoanamthanh);
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
        case 'getStatus': {
            chuanbingam();
            const tongdoan = congcu === 'web' ? cacdoanweb.length : cacdoanamthanh.length;
            const doanhientai = congcu === 'web' ? chisodoanweb : chisoamthanh;
            trave({ progress: tongdoan > 0 ? { current: doanhientai + 1, total: tongdoan } : null, elapsed: giaydatroi });
            break;
        }
    }
    return false;
});

chrome.storage.local.get([
    'autoStartOnLoad', 'sleepTargetTimestamp', 'readingList', 'customStopConfig', 'isMiniPlayerMinimized', 'miniPlayerMode'
], localData => {
    if (localData.isMiniPlayerMinimized !== undefined) dangthumominiplayer = localData.isMiniPlayerMinimized;
    if (localData.miniPlayerMode) chedominiplayer = localData.miniPlayerMode;

    let tentruyen = document.getElementById('booknameholder')?.innerText.trim() || document.getElementById('book_name2')?.innerText.trim() || document.querySelector('h1')?.innerText.trim() || '';
    let danhsach = localData.readingList || [];
    let muc = danhsach.find(i => (i.title || '').trim().toLowerCase() === (tentruyen || '').trim().toLowerCase());
    if (muc && muc.url === window.location.href && muc.chunkIndex > 1) doandaluu = muc.chunkIndex - 1;

    if (localData.customStopConfig) cauhinhdungtuychon = localData.customStopConfig;

    if (localData.sleepTargetTimestamp) {
        const conlai = localData.sleepTargetTimestamp - Date.now();
        if (conlai > 0) mahengiongu = setTimeout(() => { dungtatca(); chrome.storage.local.remove('sleepTargetTimestamp'); }, conlai);
        else chrome.storage.local.remove('sleepTargetTimestamp');
    }

    if (localData.autoStartOnLoad) {
        chrome.storage.local.remove('autoStartOnLoad');
        let thulai = 20;
        const kiemtrasansang = setInterval(() => {
            if (chuanbinoidung().length >= 5 || --thulai <= 0) {
                clearInterval(kiemtrasansang);
                batdaudoc();
            }
        }, 1000);
    }
    setTimeout(kiemtramahoa, 1500);
});

chrome.storage.sync.get([
    'speed', 'volume', 'voiceIndex', 'maydoc',
    'tudongchuyenchuong', 'batphimtat', 'doctentruyen', 'doctenchuong', 'customDict', 'smartPauses'
], syncData => {
    Object.assign(khoaapi, syncData);
    if (syncData.smartPauses) thoigianngh = syncData.smartPauses;
    maydoc = syncData.maydoc || 'auto';
    if (syncData.speed !== undefined) tocdohientai = syncData.speed;
    if (syncData.volume !== undefined) amluonghientai = syncData.volume;
    if (syncData.voiceIndex !== undefined) chisogionghientai = syncData.voiceIndex;
    tudongchuyenchuong = syncData.tudongchuyenchuong !== undefined ? syncData.tudongchuyenchuong : true;
    batphimtat = syncData.batphimtat !== undefined ? syncData.batphimtat : true;
    doctentruyen = syncData.doctentruyen !== undefined ? syncData.doctentruyen : true;
    doctenchuong = syncData.doctenchuong !== undefined ? syncData.doctenchuong : true;
    dadatcaidat = true;
});

chrome.storage.local.get(['fpt_key', 'azure_key', 'azure_region'], localKeyData => {
    Object.assign(khoaapi, localKeyData);
});

chrome.storage.onChanged.addListener((thaydoi, vungchon) => {
    let canchuanbilai = false;
    if (vungchon === 'local') {
        if (thaydoi.customDict) {
            tudienhientai = thaydoi.customDict.newValue;
            canchuanbilai = true;
        }
    }
    if (vungchon === 'sync') {
        if (thaydoi.batphimtat) batphimtat = thaydoi.batphimtat.newValue;
        if (thaydoi.doctentruyen !== undefined || thaydoi.doctenchuong !== undefined) {
            if (thaydoi.doctentruyen !== undefined) doctentruyen = thaydoi.doctentruyen.newValue;
            if (thaydoi.doctenchuong !== undefined) doctenchuong = thaydoi.doctenchuong.newValue;
            canchuanbilai = true;
        }
    }

    if (canchuanbilai) {
        idluotphat++;
        const nuttruyen = document.getElementById('booknameholder') || document.getElementById('book_name2');
        if (nuttruyen) nuttruyen.classList.remove('tts-chunk');
        const nutchuong = document.getElementById('bookchapnameholder');
        if (nutchuong) nutchuong.classList.remove('tts-chunk');
        
        cacdoanweb = [];
        cacdoanamthanh = [];
        document.querySelectorAll('.contentbox').forEach(k => {
            delete k.dataset.extTtsDone;
        });
        
        const dangphattruocdo = dangphat;
        const dangtamdungtruocdo = dangtamdung;
        
        if (dangphat || dangtamdung) {
            huyphatngonantoan();
            if (amthanhhientai) { amthanhhientai.pause(); amthanhhientai.src = ''; amthanhhientai = null; }
        }
        
        chuanbingam();
        const congcu = maydoc === 'auto' || maydoc === 'google' ? 'web' : maydoc;
        capnhatnoibat(congcu === 'web' ? chisodoanweb : chisoamthanh, congcu === 'web' ? cacdoanweb : cacdoanamthanh);
        
        if (dangphattruocdo && !dangtamdungtruocdo) {
            if (congcu === 'web') phatdoanweb();
            else phatdoanamthanh();
        }
    }
});

document.addEventListener('keydown', e => {
    if (!batphimtat) return;
    if (!dadatcaidat) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable || e.isComposing || e.target.closest('[contenteditable="true"], [role="textbox"]')) return;
    if (e.target.closest && e.target.closest('#stv-mini-player, #stv-mini-bubble')) return;
    switch (e.key.toLowerCase()) {
        case 'k': e.preventDefault(); chuyendoiphat(); break;
        case 'arrowleft': e.preventDefault(); bamchuongtruoc(); break;
        case 'arrowright': e.preventDefault(); bamchuongsau(); break;
        case 'r': e.preventDefault(); doclaichuong(); break;
        case 'escape': e.preventDefault(); dungtatca(); break;
    }
});

setInterval(() => {
    const baygio = Date.now();
    if (dangphat && !dangtamdung) {
        thoigiandatroichinhxac += (baygio - tickcuoicung) / 1000;
        giaydatroi = Math.floor(thoigiandatroichinhxac);
    }
    tickcuoicung = baygio;
}, 1000);

taominiplayer();

let solanthu = 0;
const MAX_THU = 40;

let chostv = setInterval(() => {
    const el = document.querySelector('.contentbox');

    if (el && !el.innerText.includes('Đang tải nội dung') && el.innerText.trim().length >= 50) {
        clearInterval(chostv);
        chuanbingam();
        capnhatminiplayer();
    } else {
        solanthu++;
        if (solanthu >= MAX_THU) {
            clearInterval(chostv);
            console.warn("Auto Đọc STV: Quá thời gian tải truyện hoặc không tìm thấy thẻ chứa nội dung.");
            chuanbingam();
            capnhatminiplayer();
        }
    }
}, 500);