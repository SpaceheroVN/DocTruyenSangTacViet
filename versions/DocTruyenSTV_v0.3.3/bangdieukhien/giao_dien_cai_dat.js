import { CauHinh } from './cau_hinh.js';
import { DieuKhienTrinhPhat, showToast } from './dieu_khien_trinh_phat.js';

export const GiaoDienCaiDat = {
    khoiTao() {
        this.khoiTaoCauHinhGiaoDien();
        this.khoiTaoTuyChon();
        this.khoiTaoTuDongDung();
        this.khoiTaoDongHoTron();
        this.ganSuKienCaiDat();
        this.ganSuKienPhimTat();
    },

    khoiTaoCauHinhGiaoDien() {
        const dienGiaTri = (id, khoa, laDongBo = true, loai = 'value') => {
            const giaTri = CauHinh.lay(khoa, laDongBo);
            const phanTu = document.getElementById(id);
            if (!phanTu || giaTri === undefined) return;
            if (loai === 'value') phanTu.value = giaTri;
            else if (loai === 'checked') phanTu.checked = giaTri;
        };

        dienGiaTri('speed-slider', 'speed', true);
        dienGiaTri('vol-slider', 'volume', true);
        dienGiaTri('engine-select', 'maydoc', true);
        dienGiaTri('voice-select', 'voiceIndex', true);
        dienGiaTri('chk-auto-next', 'tudongchuyenchuong', true, 'checked');
        dienGiaTri('chk-shortcuts', 'batphimtat', true, 'checked');
        dienGiaTri('chk-read-book', 'doctentruyen', true, 'checked');
        dienGiaTri('chk-read-chap', 'doctenchuong', true, 'checked');
        dienGiaTri('pause-comma', 'smartPauses', true);

        dienGiaTri('fpt-key', 'fpt_key', false);
        dienGiaTri('azure-key', 'azure_key', false);
        dienGiaTri('azure-region', 'azure_region', false);
        
        const speedVal = document.getElementById('speed-val');
        const speedSlider = document.getElementById('speed-slider');
        if (speedVal && speedSlider) speedVal.textContent = speedSlider.value + 'x';
        
        const volVal = document.getElementById('vol-val');
        const volSlider = document.getElementById('vol-slider');
        if (volVal && volSlider) volVal.textContent = Math.round(volSlider.value * 100) + '%';
    },

    ganSuKienCaiDat() {
        const ganDauVao = (id, khoa, laDongBo = true, loai = 'value') => {
            const phanTu = document.getElementById(id);
            if (!phanTu) return;
            phanTu.addEventListener('change', (e) => {
                const giaTri = loai === 'checked' ? e.target.checked : (loai === 'number' ? parseFloat(e.target.value) : e.target.value);
                CauHinh.dat(khoa, giaTri, laDongBo);
                DieuKhienTrinhPhat.guiLenh('capNhatCaiDat');
            });
        };

        const theTocDo = document.getElementById('speed-slider');
        const theAmLuong = document.getElementById('vol-slider');

        if (theTocDo) {
            theTocDo.addEventListener('input', (e) => {
                document.getElementById('speed-val').textContent = e.target.value + 'x';
            });
            theTocDo.addEventListener('change', (e) => {
                CauHinh.dat('speed', parseFloat(e.target.value), true);
                DieuKhienTrinhPhat.guiLenh('capNhatCaiDat');
            });
        }
        
        if (theAmLuong) {
            theAmLuong.addEventListener('input', (e) => {
                document.getElementById('vol-val').textContent = Math.round(e.target.value * 100) + '%';
            });
            theAmLuong.addEventListener('change', (e) => {
                CauHinh.dat('volume', parseFloat(e.target.value), true);
                DieuKhienTrinhPhat.guiLenh('capNhatCaiDat');
            });
        }

        ganDauVao('voice-select', 'voiceIndex', true, 'number');
        ganDauVao('chk-auto-next', 'tudongchuyenchuong', true, 'checked');
        ganDauVao('chk-shortcuts', 'batphimtat', true, 'checked');
        ganDauVao('chk-read-book', 'doctentruyen', true, 'checked');
        ganDauVao('chk-read-chap', 'doctenchuong', true, 'checked');
        ganDauVao('pause-comma', 'smartPauses', true, 'number');
        
        const engineSelect = document.getElementById('engine-select');
        const apiBox = document.getElementById('api-settings-box');
        const apiKeyInput = document.getElementById('api-key-input');
        const apiRegionInput = document.getElementById('api-region-input');
        
        const xoaDuLieuRong = () => { if (apiKeyInput) apiKeyInput.value = ''; };
        
        if (engineSelect) {
            engineSelect.addEventListener('change', (e) => {
                const congcu = e.target.value;
                const cankey = ['fpt', 'azure', 'gcp'].includes(congcu);
                if (apiBox) apiBox.style.display = cankey ? 'block' : 'none';
                if (apiRegionInput) apiRegionInput.style.display = congcu === 'azure' ? 'block' : 'none';
                if (apiKeyInput) {
                    const placeholdermap = { fpt: 'Nhập FPT.AI API Key...', azure: 'Nhập Azure Subscription Key...', gcp: 'Nhập Google Cloud API Key...' };
                    if (placeholdermap[congcu]) apiKeyInput.placeholder = placeholdermap[congcu];
                    if (cankey) apiKeyInput.value = CauHinh.lay(congcu + '_key', false) || '';
                }
                if (apiRegionInput && congcu === 'azure') {
                    apiRegionInput.value = CauHinh.lay('azure_region', false) || 'southeastasia';
                }
                if (!cankey) {
                    CauHinh.dat('maydoc', congcu, true);
                    DieuKhienTrinhPhat.guiLenh('capNhatCaiDat');
                }
                
                const volSlider = document.getElementById('vol-slider');
                if (volSlider) {
                    const maxVol = congcu === 'web' ? 1.0 : 2.0;
                    volSlider.max = maxVol;
                    if (parseFloat(volSlider.value) > maxVol) {
                        volSlider.value = maxVol;
                        const volVal = document.getElementById('vol-val');
                        if (volVal) volVal.textContent = Math.round(maxVol * 100) + '%';
                        CauHinh.dat('volume', maxVol, true);
                        DieuKhienTrinhPhat.guiLenh('capNhatCaiDat');
                    }
                }
            });
            setTimeout(() => {
                engineSelect.value = CauHinh.lay('maydoc', true) || 'web';
                engineSelect.dispatchEvent(new Event('change'));
            }, 100);
        }

        const btnSaveApi = document.getElementById('btn-save-api');
        if (btnSaveApi) {
            btnSaveApi.addEventListener('click', (e) => {
                if (!engineSelect || !apiKeyInput) return;
                const congcu = engineSelect.value;
                const key = apiKeyInput.value.trim();
                const region = apiRegionInput ? apiRegionInput.value.trim() : '';
                
                if (!key) {
                    showToast('Vui lòng nhập API Key', 'warning');
                    xoaDuLieuRong();
                    return;
                }
                
                CauHinh.dat('maydoc', congcu, true);
                CauHinh.dat(congcu + '_key', key, false);
                if (congcu === 'azure') CauHinh.dat('azure_region', region || 'southeastasia', false);
                
                DieuKhienTrinhPhat.guiLenh('capNhatCaiDat');

                const nut = e.currentTarget;
                nut.classList.add('saved');
                nut.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Đã lưu';
                showToast('Đã lưu cấu hình API', 'success');
                setTimeout(() => {
                    nut.classList.remove('saved');
                    nut.innerHTML = '<svg id="btn-save-api-icon" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: text-top;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg><span id="btn-save-api-text">Lưu API Key</span>';
                }, 2000);
            });
        }
        
        const btnTestApi = document.getElementById('btn-test-api');
        if (btnTestApi) {
            btnTestApi.addEventListener('click', async (e) => {
                if (!engineSelect || !apiKeyInput) return;
                const congcu = engineSelect.value;
                const key = apiKeyInput.value.trim();
                const region = apiRegionInput ? apiRegionInput.value.trim() : '';
                if (!key) { 
                    showToast('Vui lòng nhập API Key để thử', 'warning'); 
                    xoaDuLieuRong();
                    return; 
                }
                
                const nut = e.currentTarget;
                const nutGoc = nut.innerHTML;
                nut.disabled = true;
                nut.textContent = 'Đang thử...';
                
                try {
                    let thanhcong = false;
                    if (congcu === 'fpt') {
                        const r = await fetch('https://api.fpt.ai/hmi/tts/v5', { method: 'POST', headers: { 'api-key': key }, body: 'Kiểm tra' });
                        thanhcong = r.ok;
                    } else if (congcu === 'azure') {
                        const REGION_PATTERN = /^[a-z0-9-]{2,30}$/;
                        const regionVal = REGION_PATTERN.test(region) ? region : 'southeastasia';
                        const r = await fetch(`https://${regionVal}.tts.speech.microsoft.com/cognitiveservices/v1`, {
                            method: 'POST',
                            headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3' },
                            body: `<speak version='1.0' xml:lang='vi-VN'><voice xml:lang='vi-VN' name='vi-VN-HoaiMyNeural'>Kiểm tra</voice></speak>`
                        });
                        thanhcong = r.ok;
                    } else if (congcu === 'gcp') {
                        const r = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${key}`);
                        thanhcong = r.ok;
                    }
                    if (thanhcong) {
                        showToast('API Key hợp lệ!', 'success');
                        if (btnSaveApi) btnSaveApi.click();
                    } else {
                        showToast('API Key KHÔNG hợp lệ!', 'warning');
                        xoaDuLieuRong();
                    }
                } catch(err) {
                    showToast('Lỗi kết nối khi thử Key!', 'warning');
                    xoaDuLieuRong();
                }
                nut.disabled = false;
                nut.innerHTML = nutGoc;
            });
        }
        
        const btnMute = document.getElementById('btn-mute');
        if (btnMute && theAmLuong) {
            btnMute.addEventListener('click', () => {
                if (parseFloat(theAmLuong.value) > 0) {
                    this.amLuongTruoc = parseFloat(theAmLuong.value);
                    theAmLuong.value = 0;
                } else {
                    theAmLuong.value = this.amLuongTruoc || 1;
                }
                theAmLuong.dispatchEvent(new Event('input'));
                theAmLuong.dispatchEvent(new Event('change'));
            });
        }

        document.querySelectorAll('.pause-step-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = document.getElementById(btn.dataset.target);
                if (!input) return;
                const delta = parseInt(btn.dataset.delta, 10);
                input.value = Math.max(0, (parseInt(input.value, 10) || 0) + delta);
                input.dispatchEvent(new Event('change'));
            });
        });

        const btnNote = document.getElementById('btn-show-pause-note');
        const noteContent = document.getElementById('pause-note-content');
        if (btnNote && noteContent) {
            btnNote.addEventListener('click', (e) => {
                e.stopPropagation();
                const isHidden = noteContent.style.display === 'none';
                noteContent.style.display = isHidden ? 'block' : 'none';
                btnNote.textContent = isHidden ? 'Ẩn lưu ý' : 'Xem lưu ý';
            });
        }
    },

    khoiTaoTuyChon() {
        document.addEventListener('click', (e) => {
            const trongVung = e.target.closest('.custom-select-container');
            if (!trongVung) {
                document.querySelectorAll('.custom-select-dropdown').forEach(d => d.classList.remove('show'));
                return;
            }
            const nutBam = e.target.closest('.custom-select-trigger');
            if (nutBam) {
                const hopChua = nutBam.closest('.custom-select-container');
                const danhSach = hopChua.querySelector('.custom-select-dropdown');
                document.querySelectorAll('.custom-select-dropdown').forEach(d => {
                    if (d !== danhSach) d.classList.remove('show');
                });
                if (danhSach) danhSach.classList.toggle('show');
            }
        });

        this.caiDatOChonTinh('custom-left-type', 'text-left-type', 'dropdown-left-type');
        this.caiDatOChonTinh('custom-right-type', 'text-right-type', 'dropdown-right-type');
        this.caiDatOChonTinh('custom-operator', 'text-operator', 'dropdown-operator');
        
        this.caiDatOChonTinh('engine-select', 'custom-engine-text', 'custom-engine-dropdown', true);
        this.caiDatOChonTinh('select-auto-stop', 'custom-autostop-text', 'custom-autostop-dropdown', true);
        this.caiDatOChonTinh('voice-select', 'custom-voice-text', 'custom-voice-dropdown', true);
    },

    caiDatOChonTinh(idChonGoc, idVanBan, idKhungChon, themIdVanBan = false) {
        const oChonGoc = document.getElementById(idChonGoc);
        const khungChon = document.getElementById(idKhungChon);
        let vanBanHienThi = document.getElementById(idVanBan);
        
        if (themIdVanBan && !vanBanHienThi && oChonGoc && khungChon) {
            const hopChua = khungChon.closest('.custom-select-container');
            if (hopChua) {
                const trigger = hopChua.querySelector('.custom-select-trigger');
                if (trigger) {
                    if (trigger.querySelector('span')) vanBanHienThi = trigger.querySelector('span');
                    else {
                        trigger.innerHTML = `<span id="${idVanBan}"></span>`;
                        vanBanHienThi = document.getElementById(idVanBan);
                    }
                }
            }
        }

        if (!oChonGoc || !khungChon || !vanBanHienThi) return;

        const capNhat = () => {
            khungChon.innerHTML = '';
            const luaChonDaChon = oChonGoc.options[oChonGoc.selectedIndex];
            if (luaChonDaChon) vanBanHienThi.textContent = luaChonDaChon.textContent;
            
            Array.from(oChonGoc.children).forEach(con => {
                if (con.tagName === 'OPTGROUP') {
                    const nhom = document.createElement('div');
                    nhom.className = 'custom-optgroup';
                    nhom.textContent = con.label;
                    khungChon.appendChild(nhom);
                    Array.from(con.children).forEach(opt => {
                        khungChon.appendChild(this.taoMuc(opt, true, oChonGoc, khungChon));
                    });
                } else if (con.tagName === 'OPTION') {
                    khungChon.appendChild(this.taoMuc(con, false, oChonGoc, khungChon));
                }
            });
        };

        oChonGoc.addEventListener('change', capNhat);
        oChonGoc._capNhatGiaoDien = capNhat; 
        capNhat();
    },

    taoMuc(opt, coThutLe, oChonGoc, khungChon) {
        const muc = document.createElement('div');
        muc.className = 'custom-option';
        if (coThutLe) muc.style.paddingLeft = '24px';
        if (opt.selected) muc.classList.add('selected');
        if (opt.disabled) muc.classList.add('disabled');
        muc.textContent = opt.textContent;
        muc.addEventListener('click', (e) => {
            e.stopPropagation();
            if (opt.disabled) return;
            oChonGoc.value = opt.value;
            oChonGoc.dispatchEvent(new Event('change'));
            khungChon.classList.remove('show');
        });
        return muc;
    },

    capNhatGiaoDien(idChonGoc) {
        const oChonGoc = document.getElementById(idChonGoc);
        if (oChonGoc && typeof oChonGoc._capNhatGiaoDien === 'function') {
            oChonGoc._capNhatGiaoDien();
        }
    },

    khoiTaoTuDongDung() {
        this.gio_val_vt = 0;
        this.phut_val_vt = 0;
        this.laDauCong = true;
        this.boQuaThongBao = false;

        this.ganSuKienAMPM();
        this.ganSuKienMenuAutoStop();
        this.ganSuKienCacNutApDung();
        this.ganSuKienPhimNhanh();
        
        const nutDauHieu = document.getElementById('btn-toggle-sign');
        if (nutDauHieu) {
            nutDauHieu.addEventListener('click', () => {
                this.laDauCong = !this.laDauCong;
                nutDauHieu.textContent = this.laDauCong ? '+' : '-';
                nutDauHieu.style.color = this.laDauCong ? 'var(--accent)' : 'var(--danger)';
                nutDauHieu.style.borderColor = this.laDauCong ? 'var(--accent)' : 'var(--danger)';
            });
        }

        this.taoInputDieuKien('custom-left-input', '');
        this.taoInputDieuKien('custom-right-input', '');
        
        this.taiLaiDuLieuTuDongDung();
    },

    taiLaiDuLieuMayDoc() {
        const engineSelect = document.getElementById('engine-select');
        if (engineSelect) {
            engineSelect.value = CauHinh.lay('maydoc', true) || 'web';
            engineSelect.dispatchEvent(new Event('change'));
            
            const customText = document.getElementById('custom-engine-text');
            if (customText) {
                const opt = engineSelect.options[engineSelect.selectedIndex];
                if (opt) customText.textContent = opt.text;
            }
        }
    },

    taiLaiDuLieuTuDongDung() {
        chrome.storage.local.get(['stopTime', 'stopRealtimeTarget', 'stopAfterChapters', 'customStopConfig'], data => {
            const selectAutoStop = document.getElementById('select-auto-stop');
            if (!selectAutoStop) return;
            
            if (data.stopRealtimeTarget) selectAutoStop.value = 'realtime';
            else if (data.stopAfterChapters) selectAutoStop.value = 'chapters';
            else if (data.customStopConfig) selectAutoStop.value = 'custom';
            else if (data.stopTime) selectAutoStop.value = 'time';
            else selectAutoStop.value = 'off';
            
            this.capNhatGiaoDien('select-auto-stop');
            
            this.boQuaThongBao = true;
            selectAutoStop.dispatchEvent(new Event('change'));
            this.boQuaThongBao = false;
        });
    },

    capNhatGiaTriVT(kieu, gt) {
        if (kieu === 'hour') this.gio_val_vt = Math.min(23, Math.max(0, gt));
        if (kieu === 'minute') this.phut_val_vt = Math.min(59, Math.max(0, gt));
        
        const nutgio = document.getElementById('hour-handle');
        const nutphut = document.getElementById('minute-handle');
        const sogio = document.getElementById('digit-hours');
        const sophut = document.getElementById('digit-minutes');
        const tientringio = document.getElementById('hour-progress');
        const tientrinphut = document.getElementById('minute-progress');
        if (!nutgio || !nutphut) return;
        const CENTER = 120, bankingio = 94, bankinhphut = 60;

        function setvitri(handle, banhkinh, deg) {
            const rad = (deg - 90) * (Math.PI / 180);
            handle.setAttribute('cx', CENTER + banhkinh * Math.cos(rad));
            handle.setAttribute('cy', CENTER + banhkinh * Math.sin(rad));
        }
        function settientrinhtronh(progress, banhkinh, deg) {
            const c = 2 * Math.PI * banhkinh;
            progress.style.strokeDasharray = `${c * (deg / 360)}, ${c}`;
        }

        const lay12gio = (h24) => { const h = h24 % 12; return h === 0 ? 12 : h; };

        if (kieu === 'hour') {
            if (sogio) {
                const hienthi = lay12gio(this.gio_val_vt);
                sogio.textContent = String(hienthi).padStart(2, '0');
            }
            const deg = (360 / 12) * (lay12gio(this.gio_val_vt) % 12);
            setvitri(nutgio, bankingio, deg);
            settientrinhtronh(tientringio, bankingio, deg);
        } else {
            if (sophut) sophut.textContent = String(this.phut_val_vt).padStart(2, '0');
            const deg = (360 / 60) * this.phut_val_vt;
            setvitri(nutphut, bankinhphut, deg);
            settientrinhtronh(tientrinphut, bankinhphut, deg);
        }

        const ampm = this.gio_val_vt >= 12 ? 'CH' : 'SA';
        const ampmText = document.getElementById('ampm-text');
        if (ampmText) ampmText.textContent = ampm;
        document.querySelectorAll('#ampm-dropdown .custom-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.val === ampm);
        });
    },

    khoiTaoDongHoTron() {
        const nutgio = document.getElementById('hour-handle');
        const nutphut = document.getElementById('minute-handle');
        if (!nutgio || !nutphut) return;

        const CENTER = 120, HOUR_R = 94, MIN_R = 60;
        const nhomgioch = document.getElementById('hour-ticks');
        if (nhomgioch) {
            nhomgioch.innerHTML = '';
            for (let i = 0; i < 60; i++) {
                const deg = i * 6 - 90, rad = deg * Math.PI / 180;
                const lon = i % 5 === 0;
                const outer = HOUR_R + 5, inner = HOUR_R - (lon ? 7 : 4);
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', CENTER + outer * Math.cos(rad));
                line.setAttribute('y1', CENTER + outer * Math.sin(rad));
                line.setAttribute('x2', CENTER + inner * Math.cos(rad));
                line.setAttribute('y2', CENTER + inner * Math.sin(rad));
                line.setAttribute('class', 'tick-mark' + (lon ? ' major' : ''));
                nhomgioch.appendChild(line);
            }
        }
        const nhomphut = document.getElementById('minute-ticks');
        if (nhomphut) {
            nhomphut.innerHTML = '';
            for (let i = 0; i < 60; i++) {
                const deg = i * 6 - 90, rad = deg * Math.PI / 180;
                const lon = i % 15 === 0;
                const outer = MIN_R + 4, inner = MIN_R - (lon ? 6 : 3);
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', CENTER + outer * Math.cos(rad));
                line.setAttribute('y1', CENTER + outer * Math.sin(rad));
                line.setAttribute('x2', CENTER + inner * Math.cos(rad));
                line.setAttribute('y2', CENTER + inner * Math.sin(rad));
                line.setAttribute('class', 'tick-mark' + (lon ? ' major' : ''));
                nhomphut.appendChild(line);
            }
        }

        const lay12gio = (h24) => { const h = h24 % 12; return h === 0 ? 12 : h; };
        const doi24gio = (h12, ampm) => {
            if (ampm === 'SA') return h12 === 12 ? 0 : h12;
            return h12 === 12 ? 12 : h12 + 12;
        };
        const layampmhientai = () => document.getElementById('ampm-text')?.textContent || 'SA';

        const sogio = document.getElementById('digit-hours');
        const sophut = document.getElementById('digit-minutes');
        if (sogio && sophut) {
            const batdaunhap = (digitEl, type) => {
                digitEl.classList.add('editing');
                let dem = '';
                const xulyban = (e) => {
                    const key = e.key;
                    if (key >= '0' && key <= '9') {
                        dem += key;
                        digitEl.textContent = dem.length === 1 ? '0' + key : dem.slice(-2);
                        if (dem.length >= 2) {
                            let num = parseInt(dem.slice(-2));
                            if (type === 'hour') {
                                num = Math.max(1, Math.min(12, num));
                                this.capNhatGiaTriVT('hour', doi24gio(num, layampmhientai()));
                            } else {
                                num = Math.min(59, num);
                                this.capNhatGiaTriVT('minute', num);
                            }
                            dem = '';
                            digitEl.classList.remove('editing');
                            if (type === 'hour') setTimeout(() => batdaunhap(sophut, 'minute'), 60);
                            document.removeEventListener('keydown', xulyban);
                            document.removeEventListener('mousedown', nhanrangoai);
                        }
                    } else if (key === 'Backspace') {
                        dem = dem.slice(0, -1);
                        if (!dem) digitEl.textContent = type === 'hour'
                            ? String(lay12gio(this.gio_val_vt)).padStart(2, '0')
                            : String(this.phut_val_vt).padStart(2, '0');
                    } else if (['Enter', 'Tab', 'Escape'].includes(key)) {
                        const num = dem ? parseInt(dem) : (type === 'hour' ? lay12gio(this.gio_val_vt) : this.phut_val_vt);
                        if (type === 'hour') this.capNhatGiaTriVT('hour', doi24gio(Math.max(1, Math.min(12, num)), layampmhientai()));
                        else this.capNhatGiaTriVT('minute', Math.min(59, num));
                        dem = '';
                        digitEl.classList.remove('editing');
                        document.removeEventListener('keydown', xulyban);
                        document.removeEventListener('mousedown', nhanrangoai);
                    }
                };
                const nhanrangoai = (e) => {
                    if (e.target !== digitEl) {
                        const num = dem ? parseInt(dem) : (type === 'hour' ? lay12gio(this.gio_val_vt) : this.phut_val_vt);
                        if (type === 'hour') this.capNhatGiaTriVT('hour', doi24gio(Math.max(1, Math.min(12, num)), layampmhientai()));
                        else this.capNhatGiaTriVT('minute', Math.min(59, num));
                        dem = '';
                        digitEl.classList.remove('editing');
                        document.removeEventListener('keydown', xulyban);
                        document.removeEventListener('mousedown', nhanrangoai);
                    }
                };
                document.addEventListener('keydown', xulyban);
                setTimeout(() => document.addEventListener('mousedown', nhanrangoai), 0);
            };
            sogio.addEventListener('click', () => batdaunhap(sogio, 'hour'));
            sophut.addEventListener('click', () => batdaunhap(sophut, 'minute'));
            sogio.addEventListener('wheel', (e) => {
                e.preventDefault();
                const cur12h = lay12gio(this.gio_val_vt);
                const next12h = ((cur12h - 1 + (e.deltaY < 0 ? 1 : -1) + 12) % 12) + 1;
                this.capNhatGiaTriVT('hour', doi24gio(next12h, layampmhientai()));
            }, { passive: false });
            sophut.addEventListener('wheel', (e) => {
                e.preventDefault();
                this.capNhatGiaTriVT('minute', (this.phut_val_vt + (e.deltaY < 0 ? 1 : -1) + 60) % 60);
            }, { passive: false });
        }

        function laygoctoadochuot(clientX, clientY, svgEl, cx, cy) {
            const r = svgEl.getBoundingClientRect();
            const sx = 240 / r.width, sy = 240 / r.height;
            const mx = (clientX - r.left) * sx, my = (clientY - r.top) * sy;
            return (Math.atan2(my - cy, mx - cx) * (180 / Math.PI) + 90 + 360) % 360;
        }

        const khoitaokeonut = (handle, loaivong) => {
            let dangkeo = false;
            const svgEl = handle.ownerSVGElement;
            const khididichcuyen = (clientX, clientY) => {
                const deg = laygoctoadochuot(clientX, clientY, svgEl, CENTER, CENTER);
                if (loaivong === 'hour') {
                    const step = Math.round(deg / (360 / 12));
                    const h12 = step === 0 ? 12 : step;
                    this.capNhatGiaTriVT('hour', doi24gio(h12, layampmhientai()));
                } else {
                    this.capNhatGiaTriVT('minute', Math.round(deg / (360 / 60)) % 60);
                }
            };
            handle.addEventListener('mousedown', (e) => { dangkeo = true; handle.classList.add('dragging'); e.preventDefault(); });
            window.addEventListener('mousemove', (e) => { if (dangkeo) khididichcuyen(e.clientX, e.clientY); });
            window.addEventListener('mouseup', () => { dangkeo = false; handle.classList.remove('dragging'); });
            handle.addEventListener('touchstart', (e) => { dangkeo = true; handle.classList.add('dragging'); e.preventDefault(); }, { passive: false });
            window.addEventListener('touchmove', (e) => { if (dangkeo) khididichcuyen(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
            window.addEventListener('touchend', () => { dangkeo = false; handle.classList.remove('dragging'); });
        };

        khoitaokeonut(nutgio, 'hour');
        khoitaokeonut(nutphut, 'minute');
        this.capNhatGiaTriVT('hour', this.gio_val_vt);
        this.capNhatGiaTriVT('minute', this.phut_val_vt);
    },

    ganSuKienAMPM() {
        const ampmContainer = document.getElementById('ampm-container');
        if (ampmContainer) {
            ampmContainer.addEventListener('click', (e) => {
                const opt = e.target.closest('.custom-option');
                if (opt) {
                    const isPM = opt.dataset.val === 'CH';
                    if (isPM && this.gio_val_vt < 12) this.gio_val_vt += 12;
                    else if (!isPM && this.gio_val_vt >= 12) this.gio_val_vt -= 12;
                    this.capNhatGiaTriVT('hour', this.gio_val_vt);
                    const dropdown = document.getElementById('ampm-dropdown');
                    if (dropdown) dropdown.classList.remove('show');
                }
            });
        }
    },

    anTatNhomTuDongDung() {
        const cacNhom = [
            document.getElementById('group-stop-time'),
            document.getElementById('group-stop-realtime'),
            document.getElementById('group-stop-chapters'),
            document.getElementById('group-stop-custom')
        ];
        cacNhom.forEach(nhom => { if (nhom) nhom.style.display = 'none'; });
    },

    ganSuKienMenuAutoStop() {
        const selectAutoStop = document.getElementById('select-auto-stop');
        if (!selectAutoStop) return;

        selectAutoStop.addEventListener('change', (e) => {
            const v = e.target.value;
            this.anTatNhomTuDongDung();

            if (v === 'time') {
                const n = document.getElementById('group-stop-time');
                if (n) {
                    n.style.display = 'flex';
                    chrome.storage.local.get('stopTime', d => {
                        let h = 0, m = 30;
                        if (d.stopTime) {
                            h = Math.floor(d.stopTime / 60);
                            m = d.stopTime % 60;
                        }
                        const hInput = document.getElementById('input-stop-hours');
                        const mInput = document.getElementById('input-stop-minutes');
                        if (hInput) hInput.value = h;
                        if (mInput) mInput.value = m;
                    });
                }
            } else if (v === 'chapters') {
                const n = document.getElementById('group-stop-chapters');
                if (n) {
                    n.style.display = 'flex';
                    chrome.storage.local.get('stopAfterChapters', d => {
                        const cInput = document.getElementById('input-stop-chapters');
                        if (cInput) cInput.value = d.stopAfterChapters || 1;
                    });
                }
            } else if (v === 'realtime') {
                const n = document.getElementById('group-stop-realtime');
                if (n) {
                    n.style.display = 'flex';
                    chrome.storage.local.get('stopRealtimeTarget', d => {
                        let mucTieuGio = 12, mucTieuPhut = 0;
                        if (d.stopRealtimeTarget) {
                            const [hStr, mStr] = d.stopRealtimeTarget.split(':');
                            mucTieuGio = parseInt(hStr) || 12;
                            mucTieuPhut = parseInt(mStr) || 0;
                        } else {
                            const bayGio = new Date();
                            mucTieuGio = bayGio.getHours();
                            mucTieuPhut = bayGio.getMinutes();
                        }
                        this.capNhatGiaTriVT('hour', mucTieuGio);
                        this.capNhatGiaTriVT('minute', mucTieuPhut);
                        
                    });
                }
            } else if (v === 'custom') {
                const n = document.getElementById('group-stop-custom');
                if (n) {
                    n.style.display = 'flex';
                    chrome.storage.local.get('customStopConfig', d => {
                        if (d.customStopConfig) {
                            const op = document.getElementById('custom-operator');
                            if (op) op.value = d.customStopConfig.operator || 'AND';
                            const lt = document.getElementById('custom-left-type');
                            if (lt) { lt.value = d.customStopConfig.left?.type || 'time'; lt.dispatchEvent(new Event('change')); }
                            const rt = document.getElementById('custom-right-type');
                            if (rt) { rt.value = d.customStopConfig.right?.type || 'chapters'; rt.dispatchEvent(new Event('change')); }
                            setTimeout(() => {
                                const li = document.getElementById('custom-left-input');
                                const ri = document.getElementById('custom-right-input');
                                const fill = (container, conf) => {
                                    if (!container || !conf) return;
                                    if (conf.type === 'time') {
                                        const hc = container.querySelector('.cc-hours');
                                        const mc = container.querySelector('.cc-minutes');
                                        if (hc) hc.value = Math.floor(conf.minutes / 60);
                                        if (mc) mc.value = conf.minutes % 60;
                                    } else if (conf.type === 'realtime') {
                                        const tc = container.querySelector('.cc-time');
                                        if (tc) tc.value = conf.displayTime;
                                    } else if (conf.type === 'chapters') {
                                        const cc = container.querySelector('.cc-chapters');
                                        if (cc) cc.value = conf.count;
                                    }
                                };
                                fill(li, d.customStopConfig.left);
                                fill(ri, d.customStopConfig.right);
                            }, 50);
                        }
                    });
                }
            } else if (v === 'off') {
                DieuKhienTrinhPhat.guiLenh('henGioNgu', { minutes: 0 });
                DieuKhienTrinhPhat.guiLenh('dungSauChuong', { count: 0 });
                DieuKhienTrinhPhat.guiLenh('dungTuyChinh', { config: null });
                chrome.storage.local.remove(['stopTime', 'sleepTargetTimestamp', 'stopRealtimeTarget', 'customStopConfig', 'stopAfterChapters']);
                if (!this.boQuaThongBao) showToast('Đã tắt tự động dừng', 'info');
            }
        });

        const customLeftType = document.getElementById('custom-left-type');
        const customRightType = document.getElementById('custom-right-type');
        
        const capNhatKhoaTuyChinh = () => {
            if (!customLeftType || !customRightType) return;
            const leftVal = customLeftType.value;
            const rightVal = customRightType.value;
            
            Array.from(customLeftType.options).forEach(opt => {
                if (opt.value && opt.value !== '' && opt.value === rightVal) opt.disabled = true;
                else opt.disabled = false;
            });
            Array.from(customRightType.options).forEach(opt => {
                if (opt.value && opt.value !== '' && opt.value === leftVal) opt.disabled = true;
                else opt.disabled = false;
            });
            
            if (customLeftType._capNhatGiaoDien) customLeftType._capNhatGiaoDien();
            if (customRightType._capNhatGiaoDien) customRightType._capNhatGiaoDien();
        };

        if (customLeftType) customLeftType.addEventListener('change', e => {
            this.taoInputDieuKien('custom-left-input', e.target.value);
            capNhatKhoaTuyChinh();
        });
        if (customRightType) customRightType.addEventListener('change', e => {
            this.taoInputDieuKien('custom-right-input', e.target.value);
            capNhatKhoaTuyChinh();
        });
    },

    ganSuKienPhimTat() {
        const btnSettings = document.getElementById('btn-shortcuts-settings');
        const dropdown = document.getElementById('shortcuts-dropdown');
        if (btnSettings && dropdown) {
            btnSettings.addEventListener('click', () => {
                dropdown.style.display = dropdown.style.display === 'none' ? 'flex' : 'none';
            });
            
            const defaultShortcuts = {
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
            
            const inputs = {
                playPause: document.getElementById('shortcut-play-pause'),
                replay: document.getElementById('shortcut-replay'),
                prevChap: document.getElementById('shortcut-prev-chap'),
                nextChap: document.getElementById('shortcut-next-chap'),
                volUp: document.getElementById('shortcut-vol-up'),
                volDown: document.getElementById('shortcut-vol-down'),
                speedUp: document.getElementById('shortcut-speed-up'),
                speedDown: document.getElementById('shortcut-speed-down'),
                nextSeg: document.getElementById('shortcut-next-seg'),
                prevSeg: document.getElementById('shortcut-prev-seg')
            };

            const renderKey = (key) => {
                if (!key) return '';
                if (key === 'ArrowUp') return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;
                if (key === 'ArrowDown') return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>`;
                if (key === 'ArrowLeft') return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`;
                if (key === 'ArrowRight') return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
                if (key === ',' || key === '.') {
                    return `<span style="font-size: 15px; font-weight: 900; line-height: 1; padding-bottom: 4px; display: inline-block;">${key}</span>`;
                }
                return key;
            };

            chrome.storage.local.get('customShortcuts', data => {
                const shortcuts = data.customShortcuts || defaultShortcuts;
                if (inputs.playPause) { inputs.playPause.dataset.key = shortcuts.playPause || defaultShortcuts.playPause; inputs.playPause.innerHTML = renderKey(inputs.playPause.dataset.key); }
                if (inputs.replay) { inputs.replay.dataset.key = shortcuts.replay || defaultShortcuts.replay; inputs.replay.innerHTML = renderKey(inputs.replay.dataset.key); }
                if (inputs.prevChap) { inputs.prevChap.dataset.key = shortcuts.prevChap || defaultShortcuts.prevChap; inputs.prevChap.innerHTML = renderKey(inputs.prevChap.dataset.key); }
                if (inputs.nextChap) { inputs.nextChap.dataset.key = shortcuts.nextChap || defaultShortcuts.nextChap; inputs.nextChap.innerHTML = renderKey(inputs.nextChap.dataset.key); }
                if (inputs.volUp) { inputs.volUp.dataset.key = shortcuts.volUp || defaultShortcuts.volUp; inputs.volUp.innerHTML = renderKey(inputs.volUp.dataset.key); }
                if (inputs.volDown) { inputs.volDown.dataset.key = shortcuts.volDown || defaultShortcuts.volDown; inputs.volDown.innerHTML = renderKey(inputs.volDown.dataset.key); }
                if (inputs.speedUp) { inputs.speedUp.dataset.key = shortcuts.speedUp || defaultShortcuts.speedUp; inputs.speedUp.innerHTML = renderKey(inputs.speedUp.dataset.key); }
                if (inputs.speedDown) { inputs.speedDown.dataset.key = shortcuts.speedDown || defaultShortcuts.speedDown; inputs.speedDown.innerHTML = renderKey(inputs.speedDown.dataset.key); }
                if (inputs.nextSeg) { inputs.nextSeg.dataset.key = shortcuts.nextSeg || defaultShortcuts.nextSeg; inputs.nextSeg.innerHTML = renderKey(inputs.nextSeg.dataset.key); }
                if (inputs.prevSeg) { inputs.prevSeg.dataset.key = shortcuts.prevSeg || defaultShortcuts.prevSeg; inputs.prevSeg.innerHTML = renderKey(inputs.prevSeg.dataset.key); }
            });

            const setupInput = (keyName) => {
                const el = inputs[keyName];
                if (!el) return;
                
                el.addEventListener('focus', () => {
                    el.innerHTML = '...';
                });
                
                el.addEventListener('blur', () => {
                    el.innerHTML = renderKey(el.dataset.key);
                });

                el.addEventListener('keydown', e => {
                    e.preventDefault();
                    let key = e.key;
                    if (key === 'Escape') {
                        el.blur();
                        return;
                    }
                    if (key === ' ') key = 'Space';
                    if (key.length === 1) key = key.toUpperCase();
                    if (['Control', 'Alt', 'Shift', 'Meta', 'Tab'].includes(key)) return;
                    
                    el.dataset.key = key;
                    el.innerHTML = renderKey(key);
                    el.blur();
                    
                    chrome.storage.local.get('customShortcuts', data => {
                        const shortcuts = data.customShortcuts || defaultShortcuts;
                        shortcuts[keyName] = key;
                        chrome.storage.local.set({ customShortcuts: shortcuts }, () => {
                            if (typeof window.showToast === 'function') {
                                window.showToast('Đã lưu phím tắt', 'success');
                            }
                        });
                    });
                });
            };

            setupInput('playPause');
            setupInput('replay');
            setupInput('prevChap');
            setupInput('nextChap');
            setupInput('volUp');
            setupInput('volDown');
            setupInput('speedUp');
            setupInput('speedDown');
            setupInput('nextSeg');
            setupInput('prevSeg');
        }
    },

    taoInputDieuKien(containerid, kieu) {
        const container = document.getElementById(containerid);
        if (!container) return;
        container.innerHTML = '';
        if (kieu === 'time') container.innerHTML = `<input type="number" value="0" min="0" style="width:34px;" class="auto-stop-input cc-hours"><span class="auto-stop-unit">giờ</span><input type="number" value="30" min="0" max="59" style="width:34px;" class="auto-stop-input cc-minutes"><span class="auto-stop-unit">phút</span>`;
        else if (kieu === 'realtime') container.innerHTML = `<input type="time" class="auto-stop-input cc-time" style="width:105px; padding: 2px 4px; border: 1px solid var(--border); border-radius: 4px; background: var(--surface); color: var(--accent); outline: none; font-size: 11px;">`;
        else if (kieu === 'chapters') container.innerHTML = `<input type="number" value="1" min="1" style="width:46px;" class="auto-stop-input cc-chapters"><span class="auto-stop-unit">chương</span>`;
    },

    docGiaTriDieuKien(prefix) {
        const kieuElem = document.getElementById(`custom-${prefix}-type`);
        const kieu = kieuElem ? kieuElem.value : null;
        const container = document.getElementById(`custom-${prefix}-input`);
        
        if (!kieu || !container) return null;
        if (kieu === 'time') {
            const gio = parseInt(container.querySelector('.cc-hours')?.value) || 0;
            const phut = parseInt(container.querySelector('.cc-minutes')?.value) || 0;
            const total = gio * 60 + phut;
            return total > 0 ? { type: 'time', minutes: total } : null;
        } else if (kieu === 'realtime') {
            const val = container.querySelector('.cc-time')?.value;
            if (!val) return null;
            const [h, m] = val.split(':').map(Number);
            const target = new Date();
            target.setHours(h, m, 0, 0);
            if (target <= new Date()) target.setDate(target.getDate() + 1);
            const totalMins = Math.ceil((target - new Date()) / 60000);
            return { type: 'realtime', displayTime: val, minutes: totalMins };
        } else if (kieu === 'chapters') {
            const c = parseInt(container.querySelector('.cc-chapters')?.value);
            return c > 0 ? { type: 'chapters', count: c } : null;
        }
        return null;
    },

    ganSuKienPhimNhanh() {
        document.querySelectorAll('.preset-time').forEach(btn => {
            btn.addEventListener('click', () => {
                const luongThoiGian = parseInt(btn.dataset.min) || 0;
                let gio = parseInt(document.getElementById('input-stop-hours').value) || 0;
                let phut = parseInt(document.getElementById('input-stop-minutes').value) || 0;
                let tongPhut = gio * 60 + phut;
                
                if (this.laDauCong) tongPhut += luongThoiGian; 
                else { tongPhut -= luongThoiGian; if (tongPhut < 0) tongPhut = 0; }
                
                document.getElementById('input-stop-hours').value = Math.floor(tongPhut / 60);
                document.getElementById('input-stop-minutes').value = tongPhut % 60;
            });
        });
    },

    ganSuKienCacNutApDung() {
        const btnTime = document.getElementById('btn-apply-stop-time');
        if (btnTime) btnTime.addEventListener('click', () => {
            const gio = parseInt(document.getElementById('input-stop-hours').value) || 0;
            const phut = parseInt(document.getElementById('input-stop-minutes').value) || 0;
            const tongPhut = gio * 60 + phut;
            if (tongPhut <= 0) { showToast('Vui lòng nhập thời gian lớn hơn 0', 'warning'); return; }
            chrome.storage.local.remove(['stopRealtimeTarget', 'stopAfterChapters', 'customStopConfig'], () => {
                DieuKhienTrinhPhat.guiLenh('henGioNgu', { minutes: tongPhut });
                DieuKhienTrinhPhat.guiLenh('dungSauChuong', { count: 0 });
                chrome.storage.local.set({ stopTime: tongPhut });
                const moTa = gio > 0 ? `${gio}g${phut > 0 ? ` ${phut}p` : ''}` : `${phut} phút`;
                showToast(`Sẽ dừng sau ${moTa}`, 'success');
            });
        });

        const btnRealtime = document.getElementById('btn-apply-stop-realtime');
        if (btnRealtime) btnRealtime.addEventListener('click', () => {
            let h24 = this.gio_val_vt;
            let m = this.phut_val_vt;
            const gioTruc = `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            const bayGio = new Date();
            const mucTieu = new Date();
            mucTieu.setHours(h24, m, 0, 0);
            if (mucTieu <= bayGio) mucTieu.setDate(mucTieu.getDate() + 1);
            
            const tongPhut = Math.ceil((mucTieu - bayGio) / 60000);
            chrome.storage.local.remove(['stopTime', 'stopAfterChapters', 'customStopConfig'], () => {
                DieuKhienTrinhPhat.guiLenh('henGioNgu', { minutes: tongPhut });
                DieuKhienTrinhPhat.guiLenh('dungSauChuong', { count: 0 });
                chrome.storage.local.set({ stopRealtimeTarget: gioTruc, stopTime: tongPhut });
                showToast(`Sẽ dừng lúc ${gioTruc}`, 'success');
            });
        });

        const btnChapters = document.getElementById('btn-apply-stop-chapters');
        if (btnChapters) btnChapters.addEventListener('click', () => {
            const soChuong = parseInt(document.getElementById('input-stop-chapters').value);
            if (isNaN(soChuong) || soChuong <= 0) return;
            chrome.storage.local.remove(['stopTime', 'stopRealtimeTarget', 'customStopConfig'], () => {
                DieuKhienTrinhPhat.guiLenh('henGioNgu', { minutes: 0 });
                DieuKhienTrinhPhat.guiLenh('dungSauChuong', { count: soChuong });
                chrome.storage.local.set({ stopAfterChapters: soChuong });
                showToast(`Sẽ dừng sau ${soChuong} chương nữa`, 'success');
            });
        });

        const btnCustom = document.getElementById('btn-apply-stop-custom');
        if (btnCustom) btnCustom.addEventListener('click', () => {
            const trai = this.docGiaTriDieuKien('left');
            const phai = this.docGiaTriDieuKien('right');
            const opElem = document.getElementById('custom-operator');
            const op = opElem ? opElem.value : 'or';
            
            if (!trai && !phai) { showToast('Vui lòng chọn ít nhất một điều kiện hợp lệ', 'warning'); return; }
            if (trai && phai && trai.type === phai.type) { showToast('Vui lòng chọn 2 điều kiện khác loại nhau', 'warning'); return; }
            
            const config = { operator: op, left: trai, right: phai };
            chrome.storage.local.remove(['stopTime', 'stopRealtimeTarget', 'stopAfterChapters'], () => {
                DieuKhienTrinhPhat.guiLenh('dungTuyChinh', { config });
                const cacDk = [trai, phai].filter(Boolean);
                const dkTime = cacDk.find(c => c.type === 'time' || c.type === 'realtime');
                const dkChuong = cacDk.find(c => c.type === 'chapters');
                
                DieuKhienTrinhPhat.guiLenh('henGioNgu', { minutes: dkTime ? dkTime.minutes : 0 });
                DieuKhienTrinhPhat.guiLenh('dungSauChuong', { count: dkChuong ? dkChuong.count : 0 });
                
                const moTa = cacDk.map(c => {
                    if (c.type === 'time') { 
                        const g = Math.floor(c.minutes / 60);
                        const p = c.minutes % 60; 
                        return g > 0 ? `${g}g${p > 0 ? ` ${p}p` : ''}` : `${p}p`; 
                    }
                    if (c.type === 'realtime') return `lúc ${c.displayTime}`;
                    if (c.type === 'chapters') return `${c.count} chương`;
                    return '';
                }).join(op === 'and' ? ' VÀ ' : ' HOẶC ');
                
                showToast(`Sẽ dừng: ${moTa}`, 'success');
                chrome.storage.local.set({ customStopConfig: config });
            });
        });
    }
};
