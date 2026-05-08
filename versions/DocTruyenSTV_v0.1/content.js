'use strict';
const boTongHop = window.speechSynthesis;
let dongCoTTS = 'auto';
let dangPhat = false;
let dangTamDung = false;
let tuDongTiepTheo = true;
let tocDoHienTai = 1.0;
let amLuongHienTai = 1.0;
let chiSoGiongHienTai = -1;
let cacGiongCoSan = [];
let cacKhoaApi = { fpt_key: '', azure_key: '', azure_region: 'southeastasia', gcp_key: '' };

let cacDoanWs = [];
let chiSoWs = 0;
let phatNgonHienTai = null;

let amThanhHienTai = null;
let cacDoanAmThanh = [];
let chiSoAmThanh = 0;
let cacUrlBlob = [];
let giayDaQua = 0;
let dangTaiCacDoan = false;

setInterval(() => {
    if (dangPhat && !dangTamDung) giayDaQua++;
}, 1000);

function taiCacGiong() {
    cacGiongCoSan = boTongHop.getVoices();
    if (!cacGiongCoSan.length) {
        boTongHop.addEventListener('voiceschanged', () => { cacGiongCoSan = boTongHop.getVoices(); }, { once: true });
    }
}
taiCacGiong();

function coGiongTiengViet() {
    return cacGiongCoSan.some(v => v.lang && v.lang.startsWith('vi'));
}

async function layVaLuuAnhBia() {
    const p = window.location.pathname.split('/').filter(Boolean);
    if (p.length < 4 || p[0] !== 'truyen') return null;
    const bookPath = `/${p[0]}/${p[1]}/${p[2]}/${p[3]}/`;
    const key = `cover_${p[3]}`;

    return new Promise(resolve => {
        chrome.storage.local.get(key, async data => {
            if (data[key] && data[key].startsWith('http')) { resolve(data[key]); return; }
            try {
                const resp = await fetch(bookPath);
                const html = await resp.text();
                const doc = new DOMParser().parseFromString(html, 'text/html');
                let img = doc.querySelector('#thumb-prop') ||
                          doc.querySelector('#book_img') ||
                          doc.querySelector('.book-thumb img') ||
                          doc.querySelector('.book-cover img') ||
                          doc.querySelector('.itembox img') ||
                          doc.querySelector('meta[property="og:image"]');
                let src = img?.getAttribute('src') || img?.getAttribute('content');
                if (src) {
                    if (src.startsWith('/')) src = window.location.origin + src;
                    else if (!src.startsWith('http')) src = window.location.origin + '/' + src;
                    chrome.storage.local.set({ [key]: src });
                    resolve(src);
                } else {
                    resolve(null);
                }
            } catch { resolve(null); }
        });
    });
}

function nhungPhongCach() {
    if (!document.getElementById('tts-styles')) {
        const style = document.createElement('style');
        style.id = 'tts-styles';
        style.textContent = `
            .tts-reading {
                background-color: rgba(232, 160, 69, 0.35) !important;
                border-radius: 4px;
                box-shadow: 0 0 0 2px rgba(232, 160, 69, 0.35) !important;
                transition: background-color 0.2s, box-shadow 0.2s;
                color: inherit !important;
            }
        `;
        document.head.appendChild(style);
    }
}

function chuanBiNoiDungTruyen() {
    nhungPhongCach();
    let nutDoan = [];
    let boDemIdDoan = 0;

    const themNut = (nut, vanBan) => {
        vanBan = vanBan.replace(/Đang tải nội dung chương\.\.\./gi, '').trim();
        if (vanBan.length > 0) {
            if (!nut.id) {
                nut.id = `tts-chunk-t-${boDemIdDoan++}`;
            }
            nut.classList.add('tts-chunk');
            nutDoan.push({ id: nut.id, text: vanBan, el: nut });
        }
    };

    const nutTenTruyen = document.getElementById('booknameholder') || document.getElementById('book_name2');
    if (nutTenTruyen && !nutTenTruyen.classList.contains('tts-chunk')) themNut(nutTenTruyen, nutTenTruyen.innerText);

    const nutTenChuong = document.getElementById('bookchapnameholder');
    if (nutTenChuong && !nutTenChuong.classList.contains('tts-chunk')) themNut(nutTenChuong, nutTenChuong.innerText);

    const cacHopNoiDung = document.querySelectorAll('.contentbox');
    cacHopNoiDung.forEach(hop => {
        const vanBanTho = hop.innerText.replace(/Đang tải nội dung chương\.\.\./gi, '').trim();
        const coNoiDungThuc = vanBanTho.length > 50;

        if (!hop.dataset.ttsPrepared) {
            if (!coNoiDungThuc) {
                return;
            }
            hop.dataset.ttsPrepared = 'true';
            hop.innerHTML = hop.innerHTML.replace(/@Bạn đang đọc bản lưu[^\n<]*/gi, '');
            let maHtml = hop.innerHTML;
            let cacPhan = maHtml.split(/<br\s*\/?>|<\/?p[^>]*>|<\/?div[^>]*>|<\/?hr[^>]*>/i);
            let maHtmlMoi = cacPhan.map((phan, i) => {
                if (phan.replace(/<[^>]*>/g, '').trim() === '') return phan;
                if (phan.includes('tts-chunk')) return phan;
                return `<span class="tts-chunk" id="tts-c-${Date.now()}-${i}">${phan}</span>`;
            }).join('<br><br>');
            hop.innerHTML = maHtmlMoi;
        }
        hop.querySelectorAll('.tts-chunk').forEach(theSpan => {
            let vanBan = theSpan.innerText || theSpan.textContent || '';
            vanBan = vanBan.replace(/Đang tải nội dung chương\.\.\./gi, '').trim();
            if (vanBan.length > 2) {
                nutDoan.push({ id: theSpan.id, text: vanBan, el: theSpan });
            }
        });
    });

    return nutDoan;
}

function noiDungDaSanSang() {
    const nut = document.querySelector('.contentbox');
    if (!nut) return false;
    const tho = nut.innerText.replace(/@Bạn đang đọc bản lưu[^\n]*/g, '').trim();
    return tho.length > 50;
}

function chiaVanBanTheoDoDaiToiDa(vanBan, doDaiToiDa) {
    const cacDoan = [];
    const cacCau = vanBan.split(/(?<=[.!?。])\s+/);
    let hienTai = '';
    for (const cau of cacCau) {
        if (!cau.trim()) continue;
        if ((hienTai + ' ' + cau).trim().length <= doDaiToiDa) {
            hienTai = (hienTai + ' ' + cau).trim();
        } else {
            if (hienTai) cacDoan.push(hienTai);
            if (cau.length > doDaiToiDa) {
                const cacPhan = cau.split(/(?<=[,;:])\s+/);
                let con = '';
                for (const phan of cacPhan) {
                    if ((con + ' ' + phan).trim().length <= doDaiToiDa) {
                        con = (con + ' ' + phan).trim();
                    } else {
                        if (con) cacDoan.push(con);
                        for (let i = 0; i < phan.length; i += doDaiToiDa) {
                            cacDoan.push(phan.slice(i, i + doDaiToiDa));
                        }
                        con = '';
                    }
                }
                if (con) cacDoan.push(con);
            } else {
                hienTai = cau.trim();
            }
        }
    }
    if (hienTai) cacDoan.push(hienTai);
    return cacDoan.length ? cacDoan : [vanBan];
}

function xayDungCacDoanDongCo(nutDoan, doDaiToiDa) {
    let cacDoanDongCo = [];
    for (const nut of nutDoan) {
        const cacDoan = chiaVanBanTheoDoDaiToiDa(nut.text, doDaiToiDa);
        for (const d of cacDoan) {
            cacDoanDongCo.push({ text: d, el: nut.el });
        }
    }
    return cacDoanDongCo;
}

function capNhatToDam(chiSo, mangCacDoan) {
    document.querySelectorAll('.tts-reading').forEach(nut => nut.classList.remove('tts-reading'));
    if (chiSo >= 0 && chiSo < mangCacDoan.length) {
        const nut = mangCacDoan[chiSo].el;
        if (nut) {
            nut.classList.add('tts-reading');
            if (dangPhat && !dangTamDung) {
                const khung = nut.getBoundingClientRect();
                const trongTamNhin = (khung.top >= 80 && khung.bottom <= window.innerHeight - 80);
                if (!trongTamNhin) nut.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
}

async function layThongTinTruyen() {
    let tieuDeTruyen = document.getElementById('booknameholder')?.innerText.trim() ||
                        document.getElementById('book_name2')?.innerText.trim() ||
                        document.querySelector('h1')?.innerText.trim() || '';
    let tieuDeChuong = document.getElementById('bookchapnameholder')?.innerText.trim() || '';
    let urlAnh = '';

    const anhBia = document.getElementById('thumb-prop');
    if (anhBia?.src) {
        urlAnh = anhBia.src;
    } else {
        for (const chon of ['img#book_img', 'img.book-cover', '.book-thumb img', 'img[src*="thumb"]', 'img[src*="cover"]']) {
            const nut = document.querySelector(chon);
            let srcTho = nut?.getAttribute('src');
            if (srcTho) {
                if (srcTho.startsWith('/')) srcTho = window.location.origin + srcTho;
                else if (!srcTho.startsWith('http')) srcTho = window.location.origin + '/' + srcTho;
                urlAnh = srcTho;
                break;
            }
        }
    }

    const dongCoHieuLuc = xacDinhDongCo();
    const tongSoDoan = dongCoHieuLuc === 'web' ? cacDoanWs.length : cacDoanAmThanh.length;
    const chiSoHienTai = dongCoHieuLuc === 'web' ? chiSoWs : chiSoAmThanh;
    const p = window.location.pathname.split('/').filter(Boolean);
    const urlTruyen = p.length >= 4 ? `${window.location.origin}/${p[0]}/${p[1]}/${p[2]}/${p[3]}/` : window.location.href;

    return {
        bookTitle: tieuDeTruyen, chapTitle: tieuDeChuong, imgUrl: urlAnh, bookUrl: urlTruyen,
        pageUrl: window.location.href,
        isPlaying: dangPhat, isPaused: dangTamDung,
        ttsEngine: dongCoHieuLuc,
        progress: tongSoDoan > 0 ? { current: chiSoHienTai + 1, total: tongSoDoan } : null
    };
}

function dungWebSpeech() {
    boTongHop.cancel();
    phatNgonHienTai = null;
    cacDoanWs = [];
    chiSoWs = 0;
    document.querySelectorAll('.tts-reading').forEach(nut => nut.classList.remove('tts-reading'));
}

function phatDoanWs() {
    if (!dangPhat || dangTamDung) return;
    if (chiSoWs >= cacDoanWs.length) {
        dangPhat = false;
        if (tuDongTiepTheo) setTimeout(nhanChuongTiepTheo, 1200);
        return;
    }
    boTongHop.cancel();
    capNhatToDam(chiSoWs, cacDoanWs);

    const doiTuongDoan = cacDoanWs[chiSoWs];
    const phatNgon = new SpeechSynthesisUtterance(doiTuongDoan.text);
    phatNgon.lang = 'vi-VN';
    phatNgon.rate = Math.min(Math.max(tocDoHienTai, 0.1), 10);
    phatNgon.volume = amLuongHienTai;

    if (chiSoGiongHienTai >= 0 && cacGiongCoSan[chiSoGiongHienTai]) {
        phatNgon.voice = cacGiongCoSan[chiSoGiongHienTai];
    } else {
        const vi = cacGiongCoSan.find(v => v.lang && v.lang.startsWith('vi'));
        if (vi) phatNgon.voice = vi;
    }
    phatNgonHienTai = phatNgon;
    phatNgon.onend = () => {
        if (phatNgonHienTai !== phatNgon) return;
        chiSoWs++;
        if (dangPhat && !dangTamDung) phatDoanWs();
    };
    phatNgon.onerror = (e) => {
        if (e.error === 'interrupted' || e.error === 'canceled') return;
        if (dangPhat && !dangTamDung) { chiSoWs++; phatDoanWs(); }
    };
    boTongHop.speak(phatNgon);
}

function batDauWebSpeech(cacNutDoan) {
    dungWebSpeech();
    dongCoTTS = 'web';
    cacDoanWs = xayDungCacDoanDongCo(cacNutDoan, 300);
    chiSoWs = 0;
    dangPhat = true;
    dangTamDung = false;
    phatDoanWs();
}

function dungAmThanh() {
    if (amThanhHienTai) {
        amThanhHienTai.pause();
        amThanhHienTai.src = '';
        amThanhHienTai = null;
    }
    cacUrlBlob.forEach(url => { try { URL.revokeObjectURL(url); } catch {} });
    cacUrlBlob = [];
    cacDoanAmThanh = [];
    chiSoAmThanh = 0;
    document.querySelectorAll('.tts-reading').forEach(nut => nut.classList.remove('tts-reading'));
}

function phatDoanAmThanh() {
    if (!dangPhat || dangTamDung) return;
    if (chiSoAmThanh >= cacDoanAmThanh.length) {
        if (dangTaiCacDoan) {
            if (dangPhat && !dangTamDung) setTimeout(phatDoanAmThanh, 500);
            return;
        }
        if (cacDoanAmThanh.length > 0) {
            dangPhat = false;
            if (tuDongTiepTheo) setTimeout(nhanChuongTiepTheo, 1200);
        }
        return;
    }
    if (amThanhHienTai) amThanhHienTai.pause();

    const doan = cacDoanAmThanh[chiSoAmThanh];
    capNhatToDam(chiSoAmThanh, cacDoanAmThanh);

    const url = doan.url || `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=${encodeURIComponent(doan.text)}`;
    const amThanh = new Audio(url);
    amThanhHienTai = amThanh;
    amThanh.volume = amLuongHienTai;
    amThanh.playbackRate = Math.min(Math.max(tocDoHienTai, 0.5), 4.0);

    amThanh.onended = () => {
        if (amThanhHienTai !== amThanh) return;
        chiSoAmThanh++;
        if (dangPhat && !dangTamDung) phatDoanAmThanh();
    };
    amThanh.onerror = () => {
        if (amThanhHienTai !== amThanh) return;
        chiSoAmThanh++;
        if (dangPhat && !dangTamDung) setTimeout(phatDoanAmThanh, 300);
    };
    amThanh.play().catch(loi => {
        if (amThanhHienTai !== amThanh) return;
        if (loi.name === 'NotAllowedError') {
            dangPhat = false;
            dangTamDung = true;
            chrome.runtime.sendMessage({ action: 'autoplayBlocked' });
            return;
        }
        chiSoAmThanh++;
        if (dangPhat && !dangTamDung) setTimeout(phatDoanAmThanh, 300);
    });
}

function batDauGoogleTTS(cacNutDoan) {
    dungAmThanh();
    dongCoTTS = 'google';
    cacDoanAmThanh = xayDungCacDoanDongCo(cacNutDoan, 150);
    chiSoAmThanh = 0;
    dangPhat = true;
    dangTamDung = false;
    dangTaiCacDoan = false;
    phatDoanAmThanh();
}

async function batDauFptTTS(cacNutDoan) {
    const khoa = cacKhoaApi.fpt_key;
    if (!khoa) { batDauWebSpeech(cacNutDoan); return; }
    dungAmThanh(); dungWebSpeech();
    dongCoTTS = 'fpt';
    dangPhat = true;
    dangTamDung = false;
    chiSoAmThanh = 0;
    cacDoanAmThanh = [];

    const cacGiongFpt = ['banmai', 'leminh', 'thuminh', 'myan', 'giahuy', 'lannhi', 'linhsan'];
    const giongDaChon = cacGiongFpt[chiSoGiongHienTai] || 'banmai';
    const cacDoanDongCo = xayDungCacDoanDongCo(cacNutDoan, 500);
    let phatLanDau = false;
    dangTaiCacDoan = true;

    for (const doan of cacDoanDongCo) {
        if (!dangPhat) break;
        try {
            const phanHoi = await fetch('https://api.fpt.ai/hmi/tts/v5', {
                method: 'POST',
                headers: { 'api-key': khoa, 'speed': '0', 'voice': giongDaChon },
                body: doan.text
            });
            if (!phanHoi.ok) continue;
            const duLieu = await phanHoi.json();
            if (duLieu.error || !duLieu.audiourl) continue;
            
            cacDoanAmThanh.push({ text: doan.text, el: doan.el, url: duLieu.audiourl });
            if (!phatLanDau) { phatLanDau = true; phatDoanAmThanh(); }
        } catch {}
    }
    dangTaiCacDoan = false;
    if (cacDoanAmThanh.length === 0) batDauWebSpeech(cacNutDoan);
}

async function batDauAzureTTS(cacNutDoan) {
    const khoa = cacKhoaApi.azure_key;
    const khuVuc = cacKhoaApi.azure_region || 'southeastasia';
    if (!khoa) { batDauWebSpeech(cacNutDoan); return; }
    dungAmThanh(); dungWebSpeech();
    dongCoTTS = 'azure';
    dangPhat = true;
    dangTamDung = false;
    chiSoAmThanh = 0;
    cacDoanAmThanh = [];

    const cacGiongAzure = ['vi-VN-HoaiMyNeural', 'vi-VN-NamMinhNeural'];
    const giongDaChon = cacGiongAzure[chiSoGiongHienTai] || 'vi-VN-HoaiMyNeural';

    const thoatXml = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const sangSSML = t =>
        `<speak version='1.0' xml:lang='vi-VN'>` +
        `<voice xml:lang='vi-VN' name='${giongDaChon}'>` +
        `<prosody rate="${tocDoHienTai >= 1 ? '+' + Math.round((tocDoHienTai-1)*100) + '%' : '-' + Math.round((1-tocDoHienTai)*100) + '%'}">` +
        thoatXml(t) + `</prosody></voice></speak>`;

    const diemCuoi = `https://${khuVuc}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const cacDoanDongCo = xayDungCacDoanDongCo(cacNutDoan, 1000);
    let phatLanDau = false;
    dangTaiCacDoan = true;

    for (const doan of cacDoanDongCo) {
        if (!dangPhat) break;
        try {
            const phanHoi = await fetch(diemCuoi, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': khoa,
                    'Content-Type': 'application/ssml+xml',
                    'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
                    'User-Agent': 'STV-Reader/1.0'
                },
                body: sangSSML(doan.text)
            });
            if (!phanHoi.ok) continue;
            const blob = await phanHoi.blob();
            const urlBlob = URL.createObjectURL(blob);
            cacUrlBlob.push(urlBlob);
            cacDoanAmThanh.push({ text: doan.text, el: doan.el, url: urlBlob });
            if (!phatLanDau) { phatLanDau = true; phatDoanAmThanh(); }
        } catch {}
    }
    dangTaiCacDoan = false;
    if (cacDoanAmThanh.length === 0) batDauWebSpeech(cacNutDoan);
}

async function batDauGcpTTS(cacNutDoan) {
    const khoa = cacKhoaApi.gcp_key;
    if (!khoa) { batDauWebSpeech(cacNutDoan); return; }
    dungAmThanh(); dungWebSpeech();
    dongCoTTS = 'gcp';
    dangPhat = true;
    dangTamDung = false;
    chiSoAmThanh = 0;
    cacDoanAmThanh = [];

    const cacDoanDongCo = xayDungCacDoanDongCo(cacNutDoan, 1500);
    let phatLanDau = false;
    dangTaiCacDoan = true;

    for (const doan of cacDoanDongCo) {
        if (!dangPhat) break;
        try {
            const phanHoi = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${khoa}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: { text: doan.text },
                    voice: { languageCode: 'vi-VN', name: 'vi-VN-Standard-A' },
                    audioConfig: { audioEncoding: 'MP3', speakingRate: tocDoHienTai }
                })
            });
            if (!phanHoi.ok) continue;
            const duLieu = await phanHoi.json();
            if (!duLieu.audioContent) continue;
            const phanHoiBlob = await fetch(`data:audio/mp3;base64,${duLieu.audioContent}`);
            const blob = await phanHoiBlob.blob();
            const urlBlob = URL.createObjectURL(blob);
            cacUrlBlob.push(urlBlob);
            cacDoanAmThanh.push({ text: doan.text, el: doan.el, url: urlBlob });
            if (!phatLanDau) { phatLanDau = true; phatDoanAmThanh(); }
        } catch {}
    }
    dangTaiCacDoan = false;
    if (cacDoanAmThanh.length === 0) batDauWebSpeech(cacNutDoan);
}

function xacDinhDongCo() {
    if (dongCoTTS === 'auto') {
        return (chiSoGiongHienTai >= 0 || coGiongTiengViet()) ? 'web' : 'google';
    }
    return dongCoTTS;
}

function batDauDoc() {
    if (!noiDungDaSanSang()) { dangPhat = false; return; }
    const cacNutDoan = chuanBiNoiDungTruyen();
    if (!cacNutDoan.length) { dangPhat = false; return; }

    switch (xacDinhDongCo()) {
        case 'web':    batDauWebSpeech(cacNutDoan); break;
        case 'google': batDauGoogleTTS(cacNutDoan); break;
        case 'fpt':    batDauFptTTS(cacNutDoan);    break;
        case 'azure':  batDauAzureTTS(cacNutDoan);  break;
        case 'gcp':    batDauGcpTTS(cacNutDoan);    break;
        default:       batDauWebSpeech(cacNutDoan);
    }
}

function chuyenDoiPhat(tuyChon = {}) {
    if (tuyChon.speed !== undefined) tocDoHienTai = tuyChon.speed;
    if (tuyChon.volume !== undefined) amLuongHienTai = tuyChon.volume;
    if (tuyChon.voiceIndex !== undefined) chiSoGiongHienTai = tuyChon.voiceIndex;
    const dongCo = xacDinhDongCo();
    if (dangPhat && !dangTamDung) {
        if (dongCo === 'web') {
            boTongHop.pause();
        } else if (amThanhHienTai) {
            amThanhHienTai.pause();
        }
        dangPhat = false;
        dangTamDung = true;
    } else if (dangTamDung) {
        if (dongCo === 'web') {
            if (boTongHop.paused) {
                boTongHop.resume();
            } else {
                phatDoanWs();
            }
            dangPhat = true;
            dangTamDung = false;
        } else if (amThanhHienTai) {
            amThanhHienTai.play().then(() => {
                dangPhat = true;
                dangTamDung = false;
            }).catch(loi => {
                if (loi.name === 'NotAllowedError') {
                    dangPhat = false;
                    dangTamDung = true;
                    chrome.runtime.sendMessage({ action: 'autoplayBlocked' });
                    return;
                }
                dangPhat = true;
                dangTamDung = false;
                phatDoanAmThanh();
            });
        } else if (cacDoanAmThanh.length > 0) {
            dangPhat = true;
            dangTamDung = false;
            phatDoanAmThanh();
        } else {
            dungTatCa();
            batDauDoc();
            return;
        }
    } else {
        dungTatCa();
        batDauDoc();
    }
    return true;
}

function dungTatCa() {
    dungWebSpeech();
    dungAmThanh();
    dangPhat = false;
    dangTamDung = false;
    giayDaQua = 0;
}

function phatLaiChuong(tuyChon = {}) {
    if (tuyChon.speed !== undefined) tocDoHienTai = tuyChon.speed;
    if (tuyChon.volume !== undefined) amLuongHienTai = tuyChon.volume;
    if (tuyChon.voiceIndex !== undefined) chiSoGiongHienTai = tuyChon.voiceIndex;
    dungTatCa();
    setTimeout(batDauDoc, 150);
}

function laySoChuongHienTai() {
    const tieuDeChuong = document.getElementById('bookchapnameholder')?.innerText.trim() || '';
    const timThayTieuDe = tieuDeChuong.match(/chương\s*(\d+)/i);
    if (timThayTieuDe) return parseInt(timThayTieuDe[1]);
    const p = window.location.pathname.split('/').filter(Boolean);
    if (p.length >= 5) { 
        const n = parseInt(p[p.length - 1]); 
        if (!isNaN(n) && n < 100000) return n; 
    }
    return NaN;
}

function nhanChuongTiepTheo() {
    dungTatCa();
    chrome.storage.local.set({
        autoStartOnLoad: true,
        savedSpeed: tocDoHienTai,
        savedVolume: amLuongHienTai,
        savedVoiceIndex: chiSoGiongHienTai,
        savedEngine: dongCoTTS
    });
    const cacNutTien = ['#navnext', '#nav_next', '#btnnext', '#btn_next', '.btn-next-chapter', 'a.next', '.chapter-next a', '[data-nav="next"]'];
    for (const chon of cacNutTien) {
        const nut = document.querySelector(chon);
        if (nut) { nut.click(); return; }
    }
    const cacTheA = document.querySelectorAll('a');
    for (const lienKet of cacTheA) {
        if (/chương\s*sau|tiếp\s*theo|next\s*chapter/i.test(lienKet.innerText)) {
            lienKet.click(); return;
        }
    }
}

function nhanChuongTruoc() {
    const soChuong = laySoChuongHienTai();
    if (!isNaN(soChuong) && soChuong <= 1) {
        hienThongBaoNoiDung('Đây là chương đầu tiên rồi!');
        return;
    }
    dungTatCa();
    const cacNutLui = ['#navprev', '#nav_prev', '#btnprev', '#btn_prev', '.btn-prev-chapter', 'a.prev', '.chapter-prev a', '[data-nav="prev"]'];
    for (const chon of cacNutLui) {
        const nut = document.querySelector(chon);
        if (nut) { nut.click(); return; }
    }
    const cacTheA = document.querySelectorAll('a');
    for (const lienKet of cacTheA) {
        if (/chương\s*trước|quay\s*lại|prev\s*chapter/i.test(lienKet.innerText)) {
            lienKet.click(); return;
        }
    }
}

function hienThongBaoNoiDung(thongDiep) {
    let thongBao = document.getElementById('stv-tts-toast');
    if (!thongBao) {
        thongBao = document.createElement('div');
        thongBao.id = 'stv-tts-toast';
        thongBao.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:var(--accent, #e8a045);color:#fff;padding:8px 16px;border-radius:20px;z-index:999999;font-size:14px;font-family:sans-serif;pointer-events:none;transition:opacity 0.3s;box-shadow:0 4px 10px rgba(0,0,0,0.3);';
        document.body.appendChild(thongBao);
    }
    thongBao.textContent = thongDiep;
    thongBao.style.opacity = '1';
    clearTimeout(thongBao.timeout);
    thongBao.timeout = setTimeout(() => { thongBao.style.opacity = '0'; }, 2000);
}

let _theHeTuDongBatDau = 0;
function tuDongBatDauKhiSanSang(soLanThu = 30) {
    const theHe = ++_theHeTuDongBatDau;
    _thucHienTuDongBatDau(theHe, soLanThu);
}
function _thucHienTuDongBatDau(theHe, soLanThu) {
    if (theHe !== _theHeTuDongBatDau) return;
    const cacNutDoan = chuanBiNoiDungTruyen();
    if (cacNutDoan.length >= 5) {
        const thongBao = document.getElementById('stv-tts-toast');
        if (thongBao) thongBao.style.opacity = '0';
        batDauDoc();
    } else if (soLanThu > 0) {
        if (soLanThu <= 28) hienThongBaoNoiDung('Hình như chương chưa tải xong! Đang chờ...');
        setTimeout(() => _thucHienTuDongBatDau(theHe, soLanThu - 1), 1000);
    } else {
        batDauDoc();
    }
}

chrome.storage.local.get(
    ['autoStartOnLoad', 'savedSpeed', 'savedVolume', 'savedVoiceIndex', 'savedEngine',
     'ttsEngine', 'fpt_key', 'azure_key', 'azure_region', 'gcp_key'],
    duLieu => {
        cacKhoaApi.fpt_key = duLieu.fpt_key || '';
        cacKhoaApi.azure_key = duLieu.azure_key || '';
        cacKhoaApi.azure_region = duLieu.azure_region || 'southeastasia';
        cacKhoaApi.gcp_key = duLieu.gcp_key || '';
        if (duLieu.savedEngine) dongCoTTS = duLieu.savedEngine;
        else if (duLieu.ttsEngine) dongCoTTS = duLieu.ttsEngine;
        if (!duLieu.autoStartOnLoad) return;
        chrome.storage.local.remove('autoStartOnLoad');
        if (duLieu.savedSpeed !== undefined) tocDoHienTai = duLieu.savedSpeed;
        if (duLieu.savedVolume !== undefined) amLuongHienTai = duLieu.savedVolume;
        if (duLieu.savedVoiceIndex !== undefined) chiSoGiongHienTai = duLieu.savedVoiceIndex;
        tuDongTiepTheo = true;
        tuDongBatDauKhiSanSang();
    }
);

window.addEventListener('beforeunload', () => { dungTatCa(); });

document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    if (!dangPhat || dangTamDung) return;
    const dongCo = xacDinhDongCo();
    if (dongCo === 'web') {
        if (boTongHop.paused) {
            boTongHop.resume();
        } else if (!boTongHop.speaking && !boTongHop.pending) {
            phatDoanWs();
        }
    } else if (amThanhHienTai) {
        if (amThanhHienTai.paused) {
            amThanhHienTai.play().catch(() => phatDoanAmThanh());
        }
    } else {
        phatDoanAmThanh();
    }
});

document.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    switch (e.key.toLowerCase()) {
        case 'k':          e.preventDefault(); chuyenDoiPhat(); break;
        case 'arrowleft':  e.preventDefault(); nhanChuongTruoc(); break;
        case 'arrowright': e.preventDefault(); nhanChuongTiepTheo(); break;
        case 'r':          e.preventDefault(); phatLaiChuong(); break;
        case 'escape':     e.preventDefault(); dungTatCa(); break;
    }
});

chrome.runtime.onMessage.addListener((yeuCau, _nguoiGui, phanHoiLai) => {
    const traLoi = (them = {}) => phanHoiLai({ isPlaying: dangPhat, isPaused: dangTamDung, ttsEngine: xacDinhDongCo(), ...them });
    switch (yeuCau.action) {
        case 'togglePlay':
            chuyenDoiPhat(yeuCau);
            traLoi();
            break;
        case 'stopPlay':
            dungTatCa();
            traLoi();
            break;
        case 'replayChap':
            phatLaiChuong(yeuCau);
            traLoi({ isPlaying: true, isPaused: false });
            break;
        case 'nextChap':
            nhanChuongTiepTheo();
            traLoi();
            break;
        case 'prevChap':
            nhanChuongTruoc();
            traLoi();
            break;
        case 'nextChunk':
            if (xacDinhDongCo() === 'web') {
                if (chiSoWs < cacDoanWs.length - 1) {
                    chiSoWs++;
                    if (dangPhat && !dangTamDung) phatDoanWs();
                    else { boTongHop.cancel(); capNhatToDam(chiSoWs, cacDoanWs); }
                }
            } else {
                if (chiSoAmThanh < cacDoanAmThanh.length - 1) {
                    chiSoAmThanh++;
                    if (dangPhat && !dangTamDung) phatDoanAmThanh();
                    else {
                        if (amThanhHienTai) { amThanhHienTai.pause(); amThanhHienTai.src = ''; amThanhHienTai = null; }
                        capNhatToDam(chiSoAmThanh, cacDoanAmThanh);
                    }
                }
            }
            traLoi();
            break;
        case 'prevChunk':
            if (xacDinhDongCo() === 'web') {
                if (chiSoWs > 0) {
                    chiSoWs--;
                    if (dangPhat && !dangTamDung) phatDoanWs();
                    else { boTongHop.cancel(); capNhatToDam(chiSoWs, cacDoanWs); }
                }
            } else {
                if (chiSoAmThanh > 0) {
                    chiSoAmThanh--;
                    if (dangPhat && !dangTamDung) phatDoanAmThanh();
                    else {
                        if (amThanhHienTai) { amThanhHienTai.pause(); amThanhHienTai.src = ''; amThanhHienTai = null; }
                        capNhatToDam(chiSoAmThanh, cacDoanAmThanh);
                    }
                }
            }
            traLoi();
            break;
        case 'setAuto':
            tuDongTiepTheo = yeuCau.value;
            traLoi();
            break;
        case 'setSpeed':
            tocDoHienTai = yeuCau.value;
            if (amThanhHienTai) amThanhHienTai.playbackRate = Math.min(Math.max(tocDoHienTai, 0.5), 4.0);
            else if (xacDinhDongCo() === 'web' && dangPhat && !dangTamDung && phatNgonHienTai) {
                phatNgonHienTai = null;
                boTongHop.cancel();
                phatDoanWs();
            }
            traLoi();
            break;
        case 'setVolume':
            amLuongHienTai = yeuCau.value;
            if (amThanhHienTai) amThanhHienTai.volume = amLuongHienTai;
            traLoi();
            break;
        case 'setVoice':
            chiSoGiongHienTai = yeuCau.value;
            if (dangPhat || dangTamDung) phatLaiChuong({ voiceIndex: chiSoGiongHienTai });
            traLoi();
            break;
        case 'setEngine':
            dongCoTTS = yeuCau.value || 'auto';
            chrome.storage.local.set({ ttsEngine: dongCoTTS });
            traLoi();
            break;
        case 'setApiKeys': {
            const d = { ...yeuCau };
            delete d.action;
            Object.assign(cacKhoaApi, d);
            chrome.storage.local.set(d);
            traLoi();
            break;
        }
        case 'getInfo':
            layThongTinTruyen().then(thongTin => phanHoiLai({ ...thongTin, elapsed: giayDaQua }));
            return true;
        case 'getVoices':
            taiCacGiong();
            let cacGiongVi = [];
            cacGiongCoSan.forEach((v, i) => {
                if (v.lang && v.lang.startsWith('vi')) cacGiongVi.push({ name: v.name, lang: v.lang, index: i });
            });
            phanHoiLai({ voices: cacGiongVi, hasVi: cacGiongVi.length > 0 });
            break;
        case 'getStatus':
            phanHoiLai({
                isPlaying: dangPhat, isPaused: dangTamDung,
                ttsEngine: xacDinhDongCo(),
                progress: {
                    current: xacDinhDongCo() === 'web' ? chiSoWs + 1 : chiSoAmThanh + 1,
                    total:   xacDinhDongCo() === 'web' ? cacDoanWs.length : cacDoanAmThanh.length
                },
                elapsed: giayDaQua
            });
            break;
    }
    return false;
});
