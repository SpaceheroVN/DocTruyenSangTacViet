import { CauHinh } from './cau_hinh.js';
import { DieuKhienTrinhPhat, showToast } from './dieu_khien_trinh_phat.js';

export const GiaoDienCaiDat = {
    khoiTao() {
        this.khoiTaoCauHinhGiaoDien();
        this.khoiTaoTuyChon();
        this.khoiTaoTuDongDung();
        this.ganSuKienCaiDat();
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
                const cankey = ['fpt', 'azure'].includes(congcu);
                if (apiBox) apiBox.style.display = cankey ? 'block' : 'none';
                if (apiRegionInput) apiRegionInput.style.display = congcu === 'azure' ? 'block' : 'none';
                if (apiKeyInput) {
                    const placeholdermap = { fpt: 'Nhập FPT.AI API Key...', azure: 'Nhập Azure Subscription Key...' };
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
        muc.textContent = opt.textContent;
        muc.addEventListener('click', (e) => {
            e.stopPropagation();
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
        if (kieu === 'hour') this.gio_val_vt = gt;
        if (kieu === 'minute') this.phut_val_vt = gt;
        
        let displayH = this.gio_val_vt % 12;
        if (displayH === 0) displayH = 12;
        const ampm = this.gio_val_vt >= 12 ? 'PM' : 'AM';
        
        const ampmText = document.getElementById('ampm-text');
        if (ampmText) ampmText.textContent = ampm;
        
        document.querySelectorAll('#ampm-dropdown .custom-option').forEach(opt => {
            if (opt.dataset.val === ampm) opt.classList.add('selected');
            else opt.classList.remove('selected');
        });
    },

    ganSuKienAMPM() {
        const ampmContainer = document.getElementById('ampm-container');
        if (ampmContainer) {
            ampmContainer.addEventListener('click', (e) => {
                const opt = e.target.closest('.custom-option');
                if (opt) {
                    const isPM = opt.dataset.val === 'PM';
                    if (isPM && this.gio_val_vt < 12) this.gio_val_vt += 12;
                    else if (!isPM && this.gio_val_vt >= 12) this.gio_val_vt -= 12;
                    this.capNhatGiaTriVT('hour', this.gio_val_vt);
                    const dropdown = document.getElementById('ampm-dropdown');
                    if (dropdown) dropdown.classList.remove('show');
                }
            });
        }
        const hInput = document.getElementById('input-realtime-hour');
        const mInput = document.getElementById('input-realtime-min');
        if (hInput) hInput.addEventListener('change', (e) => this.capNhatGiaTriVT('hour', parseInt(e.target.value) || 0));
        if (mInput) mInput.addEventListener('change', (e) => this.capNhatGiaTriVT('minute', parseInt(e.target.value) || 0));
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
                if (n) n.style.display = 'flex';
            } else if (v === 'chapters') {
                const n = document.getElementById('group-stop-chapters');
                if (n) n.style.display = 'flex';
            } else if (v === 'realtime') {
                const n = document.getElementById('group-stop-realtime');
                if (n) {
                    n.style.display = 'flex';
                    chrome.storage.local.get('stopRealtimeTarget', d => {
                        const hInput = document.getElementById('input-realtime-hour');
                        const mInput = document.getElementById('input-realtime-min');
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
                        
                        if (hInput) {
                            let displayH = mucTieuGio % 12;
                            if(displayH === 0) displayH = 12;
                            hInput.value = displayH;
                        }
                        if (mInput) mInput.value = String(mucTieuPhut).padStart(2, '0');
                    });
                }
            } else if (v === 'custom') {
                const n = document.getElementById('group-stop-custom');
                if (n) n.style.display = 'flex';
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
        if (customLeftType) customLeftType.addEventListener('change', e => this.taoInputDieuKien('custom-left-input', e.target.value));
        if (customRightType) customRightType.addEventListener('change', e => this.taoInputDieuKien('custom-right-input', e.target.value));
    },

    taoInputDieuKien(containerid, kieu) {
        const container = document.getElementById(containerid);
        if (!container) return;
        container.innerHTML = '';
        if (kieu === 'time') container.innerHTML = `<input type="number" value="0" min="0" style="width:34px;" class="auto-stop-input cc-hours"><span class="auto-stop-unit">giờ</span><input type="number" value="30" min="0" max="59" style="width:34px;" class="auto-stop-input cc-minutes"><span class="auto-stop-unit">phút</span>`;
        else if (kieu === 'realtime') container.innerHTML = `<input type="time" class="auto-stop-input cc-time" style="width:70px; padding: 2px 4px; border: 1px solid var(--border); border-radius: 4px; background: var(--surface); color: var(--accent); outline: none;">`;
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
            const hInp = document.getElementById('input-realtime-hour');
            const mInp = document.getElementById('input-realtime-min');
            let h12 = hInp ? parseInt(hInp.value) || 12 : 12;
            let m = mInp ? parseInt(mInp.value) || 0 : 0;
            const isPM = document.getElementById('ampm-text')?.textContent === 'PM';
            
            let h24 = h12 % 12;
            if (isPM) h24 += 12;
            this.gio_val_vt = h24;
            this.phut_val_vt = m;

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
