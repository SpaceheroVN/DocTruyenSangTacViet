let khoaapi = { fpt_key: '', azure_key: '', azure_region: 'southeastasia' };

chrome.storage.local.get(['fpt_key', 'azure_key', 'azure_region'], data => {
    Object.assign(khoaapi, data);
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        if (changes.fpt_key) khoaapi.fpt_key = changes.fpt_key.newValue;
        if (changes.azure_key) khoaapi.azure_key = changes.azure_key.newValue;
        if (changes.azure_region) khoaapi.azure_region = changes.azure_region.newValue;
    }
});

async function layamthanhtuapi(vanban, maydoc, chisogiong, tocdo) {
    if (maydoc === 'fpt') {
        const giong = ['banmai', 'leminh', 'thuminh', 'myan', 'giahuy', 'lannhi', 'linhsan'][chisogiong] || 'banmai';
        const thamotocdo = tocdo > 1 ? 1 : (tocdo < 1 ? -1 : 0);
        const ketqua = await fetch('https://api.fpt.ai/hmi/tts/v5', {
            method: 'POST',
            headers: { 'api-key': khoaapi.fpt_key, 'voice': giong, 'speed': thamotocdo.toString() },
            body: vanban
        });
        if (!ketqua.ok) throw new Error('Lỗi FPT');
        const dulieu = await ketqua.json();
        if (dulieu.error) throw new Error(dulieu.message);
        
        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 1500));
            try {
                const kiemtra = await fetch(dulieu.async);
                if (kiemtra.ok) {
                    const contentType = kiemtra.headers.get('Content-Type') || '';
                    if (contentType.includes('audio')) return await kiemtra.blob();
                }
            } catch(e) {}
        }
        throw new Error('FPT Timeout');
    } else if (maydoc === 'azure') {
        const giong = ['vi-VN-HoaiMyNeural', 'vi-VN-NamMinhNeural'][chisogiong] || 'vi-VN-HoaiMyNeural';
        const vanbanthoat = String(vanban).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const ssml = `<speak version='1.0' xml:lang='vi-VN'><voice name='${giong}'><prosody rate='${tocdo}'>${vanbanthoat}</prosody></voice></speak>`;
        const REGION_PATTERN = /^[a-z0-9-]{2,30}$/;
        const khuvucyeucau = REGION_PATTERN.test(khoaapi.azure_region) ? khoaapi.azure_region : 'southeastasia';
        
        const ketqua = await fetch(`https://${khuvucyeucau}.tts.speech.microsoft.com/cognitiveservices/v1`, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': khoaapi.azure_key,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
            },
            body: ssml
        });
        if (!ketqua.ok) throw new Error('Lỗi Azure');
        return await ketqua.blob();
    }
    throw new Error('Công cụ đọc không hợp lệ');
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'fetchAudio') {
        const { vanban, maydoc, chisogiong, tocdo, mayeucau } = msg;
        layamthanhtuapi(vanban, maydoc, chisogiong, tocdo)
            .then(dulieublob => {
                const docdulieu = new FileReader();
                docdulieu.onloadend = () => {
                    sendResponse({ dulieublob: docdulieu.result, mayeucau });
                };
                docdulieu.readAsDataURL(dulieublob);
            })
            .catch(err => sendResponse({ error: err.message, mayeucau }));
        return true;
    }
});
