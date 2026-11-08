import { CauHinh } from './quan_ly_cau_hinh.js';
import { DieuKhienTrinhPhat } from './dieu_khien_trinh_phat.js';
import { showToast, showConfirm } from './tien_ich.js';

export const GiaoDienCaiDat = {
    khoiTao() {
        this.khoiTaoCauHinhGiaoDien();
        this.khoiTaoTuyChon();
        this.khoiTaoTuDongDung();
        this.khoiTaoDongHoTron();
        this.khoiTaoTuDien();
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
        dienGiaTri('select-auto-fallback', 'thayNhanhWeb', true);
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
                let giaTri = loai === 'checked' ? e.target.checked : (loai === 'number' ? parseFloat(e.target.value) : e.target.value);
                if (loai === 'number' && giaTri < 0) { giaTri = 0; e.target.value = 0; }
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
        const voiceSelect = document.getElementById('voice-select');
        if (voiceSelect) {
            voiceSelect.addEventListener('change', (e) => {
                const theThongTin = document.getElementById('info-voice');
                if (theThongTin) {
                    const selectedOpt = e.target.options[e.target.selectedIndex];
                    theThongTin.textContent = selectedOpt ? selectedOpt.text : 'Mặc định';
                }
            });
        }
        ganDauVao('chk-auto-next', 'tudongchuyenchuong', true, 'checked');
        ganDauVao('chk-shortcuts', 'batphimtat', true, 'checked');
        ganDauVao('chk-read-book', 'doctentruyen', true, 'checked');
        ganDauVao('chk-read-chap', 'doctenchuong', true, 'checked');
        ganDauVao('select-auto-fallback', 'thayNhanhWeb', true);
        ganDauVao('pause-comma', 'smartPauses', true, 'number');

        const engineSelect = document.getElementById('engine-select');
        const apiBox = document.getElementById('api-settings-box');
        const apiKeyInput = document.getElementById('api-key-input');
        const apiRegionInput = document.getElementById('api-region-input');

        if (apiBox && !document.getElementById('api-warning-container')) {
            const container = document.createElement('div');
            container.id = 'api-warning-container';
            container.style.cssText = 'margin-top: 10px;';

            const btn = document.createElement('button');
            btn.className = 'btn-ctrl btn-sm';
            btn.style.cssText = 'width: 100%; height: 30px; font-size: 11px; border-color: var(--accent); color: var(--accent); background: transparent; border-radius: 6px;';
            btn.textContent = 'Xem lưu ý bảo mật';

            const content = document.createElement('div');
            content.style.cssText = 'display: none; font-size: 11.5px; margin-top: 8px; line-height: 1.4; padding: 10px; border: 1px dashed #ff9800; border-radius: 8px; background: rgba(255, 152, 0, 0.05); text-align: left;';
            content.innerHTML = `<span style="color: #ff9800;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-4px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> <b>Bảo mật:</b></span> <span style="color: var(--text);">API Key của bạn được lưu cục bộ trên máy tính này. Vui lòng không chia sẻ máy tính hoặc để lộ khóa cho người khác.</span>`;

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const isHidden = content.style.display === 'none';
                content.style.display = isHidden ? 'block' : 'none';
                btn.textContent = isHidden ? 'Ẩn lưu ý bảo mật' : 'Xem lưu ý bảo mật';
            });

            container.appendChild(btn);
            container.appendChild(content);
            apiBox.appendChild(container);
        }

        if (engineSelect) {
            engineSelect.addEventListener('change', (e) => {
                const congcu = e.target.value;
                CauHinh.dat('maydoc', congcu, true);
                DieuKhienTrinhPhat.guiLenh('capNhatCaiDat');
                DieuKhienTrinhPhat.capNhatGiaoDienEngine(congcu);

                const volSlider = document.getElementById('vol-slider');
                if (volSlider) {
                    const maxVol = (congcu === 'web' || congcu === 'auto') ? 1.0 : 2.0;
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

    hienThiTuDien() {
        const dictList = document.getElementById('dict-list');
        if (!dictList) return;
        const dict = CauHinh.lay('customDict') || [];
        dictList.innerHTML = '';
        if (dict.length === 0) {
            dictList.innerHTML = '<div style="font-size: 11px; color: var(--text-muted); text-align: center; padding: 10px 0; font-style: italic;">Chưa có quy tắc nào</div>';
            return;
        }

        dict.forEach((item, index) => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.gap = '6px';
            div.style.padding = '4px 8px';
            div.style.background = 'rgba(255,255,255,0.02)';
            div.style.border = '1px solid rgba(255,255,255,0.05)';
            div.style.borderRadius = '6px';
            const esc = (s) => (s || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
            div.innerHTML = `
                <div style="flex: 1; min-width: 0; font-size: 11px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600;" title="${esc(item[0])}">${esc(item[0])}</div>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; opacity: 0.7;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                <div style="flex: 1; min-width: 0; font-size: 11px; color: var(--accent2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600;" title="${esc(item[1])}">${esc(item[1])}</div>
                <div style="width: 44px; display: flex; justify-content: flex-end; flex-shrink: 0;">
                    <button class="btn-ctrl btn-sm btn-del-dict" data-idx="${index}" style="height: 24px; width: 28px; padding: 0; display: flex; align-items: center; justify-content: center; background: rgba(224, 92, 110, 0.1); color: #e05c6e; border: none; border-radius: 4px;" title="Xóa">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                </div>
            `;
            dictList.appendChild(div);
        });

        dictList.querySelectorAll('.btn-del-dict').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
                let currentDict = CauHinh.lay('customDict') || [];
                currentDict.splice(idx, 1);
                CauHinh.luuTuDien(currentDict);
                this.hienThiTuDien();
                showToast('Đã xóa quy tắc!', 'success');
            });
        });
    },

    khoiTaoTuDien() {
        this.hienThiTuDien();
        const btnAddDict = document.getElementById('btn-add-dict');
        if (btnAddDict) {
            btnAddDict.addEventListener('click', () => {
                const originEl = document.getElementById('dict-origin');
                const replaceEl = document.getElementById('dict-replace');
                if (!originEl || !replaceEl) return;
                const origin = originEl.value.trim();
                const replace = replaceEl.value.trim();
                if (!origin) {
                    showToast('Vui lòng nhập từ lỗi cần sửa!', 'warning');
                    return;
                }
                let dict = CauHinh.lay('customDict') || [];
                const idx = dict.findIndex(item => item[0].toLowerCase() === origin.toLowerCase());
                if (idx !== -1) dict[idx][1] = replace;
                else dict.push([origin, replace]);

                CauHinh.luuTuDien(dict);
                originEl.value = '';
                replaceEl.value = '';
                this.hienThiTuDien();
                showToast('Đã lưu quy tắc thành công!', 'success');
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

        const engineSelect = document.getElementById('engine-select');
        if (engineSelect) {
            engineSelect.addEventListener('change', () => this.renderDanhSachEngine());
            engineSelect._capNhatGiaoDien = () => this.renderDanhSachEngine();
        }
        this.renderDanhSachEngine();
        this.caiDatOChonTinh('select-auto-stop', 'custom-autostop-text', 'custom-autostop-dropdown', true);
        this.caiDatOChonTinh('voice-select', 'custom-voice-text', 'custom-voice-dropdown', true);
        const fallbackSeg = document.getElementById('fallback-seg');
        const selectFallback = document.getElementById('select-auto-fallback');
        if (fallbackSeg && selectFallback) {
            const capNhatSeg = () => {
                const val = selectFallback.value;
                fallbackSeg.setAttribute('data-val', val);
                fallbackSeg.querySelectorAll('.seg-item').forEach(item => {
                    if (item.dataset.val === val) item.classList.add('active');
                    else item.classList.remove('active');
                });
            };
            selectFallback.addEventListener('change', capNhatSeg);
            selectFallback._capNhatGiaoDien = capNhatSeg;
            
            fallbackSeg.querySelectorAll('.seg-item').forEach(item => {
                item.addEventListener('click', () => {
                    selectFallback.value = item.dataset.val;
                    selectFallback.dispatchEvent(new Event('change'));
                });
            });
            setTimeout(capNhatSeg, 50);
        }
        
        const btnDeleteEngine = document.getElementById('btn-delete-engine');
        if (btnDeleteEngine) {
            btnDeleteEngine.addEventListener('click', () => this.xoaEngineHienTai());
        }
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

    renderDanhSachEngine() {
        const engineSelect = document.getElementById('engine-select');
        const khungChon = document.getElementById('custom-engine-dropdown');
        let vanBanHienThi = document.getElementById('custom-engine-text');

        if (!engineSelect || !khungChon) return;

        if (!vanBanHienThi) {
            const hopChua = khungChon.closest('.custom-select-container');
            if (hopChua) {
                const trigger = hopChua.querySelector('.custom-select-trigger');
                if (trigger) {
                    if (trigger.querySelector('span')) vanBanHienThi = trigger.querySelector('span');
                    else {
                        trigger.innerHTML = `<span id="custom-engine-text"></span>`;
                        vanBanHienThi = document.getElementById('custom-engine-text');
                    }
                }
            }
        }

        khungChon.innerHTML = '';
        
        const customEngines = CauHinh.lay('customEngines', false) || [];
        customEngines.forEach(engine => {
            if (!Array.from(engineSelect.options).find(o => o.value === engine.id)) {
                const opt = document.createElement('option');
                opt.value = engine.id;
                opt.textContent = engine.isQuotaExceeded ? `${engine.name} - Đã hết` : engine.name;
                engineSelect.appendChild(opt);
            }
        });

        const luaChonDaChon = engineSelect.options[engineSelect.selectedIndex];
        if (luaChonDaChon && vanBanHienThi) vanBanHienThi.textContent = luaChonDaChon.textContent;

        const btnDelete = document.getElementById('btn-delete-engine');
        if (btnDelete) {
            btnDelete.style.display = (engineSelect.value && engineSelect.value !== 'web') ? 'flex' : 'none';
        }

        Array.from(engineSelect.children).forEach(con => {
            if (con.tagName === 'OPTGROUP') {
                const nhom = document.createElement('div');
                nhom.className = 'custom-optgroup';
                nhom.textContent = con.label;
                khungChon.appendChild(nhom);
                Array.from(con.children).forEach(opt => {
                    khungChon.appendChild(this.taoMuc(opt, true, engineSelect, khungChon));
                });
            } else if (con.tagName === 'OPTION' && !con.value.startsWith('khac_')) {
                khungChon.appendChild(this.taoMuc(con, false, engineSelect, khungChon));
            }
        });

        const trueCustomEngines = customEngines.filter(e => e.id.startsWith('khac_'));
        if (trueCustomEngines.length > 0) {
            const nhomCustom = document.createElement('div');
            nhomCustom.className = 'custom-optgroup';
            nhomCustom.textContent = 'Nguồn đọc khác';
            khungChon.appendChild(nhomCustom);

            trueCustomEngines.forEach(engine => {
                const opt = Array.from(engineSelect.options).find(o => o.value === engine.id);
                if (opt) khungChon.appendChild(this.taoMuc(opt, true, engineSelect, khungChon));
            });
        }

        const btnAdd = document.createElement('div');
        btnAdd.className = 'custom-option';
        btnAdd.style.color = 'var(--accent)';
        btnAdd.style.fontWeight = 'bold';
        btnAdd.style.textAlign = 'center';
        btnAdd.style.marginTop = '6px';
        btnAdd.style.paddingTop = '10px';
        btnAdd.style.borderTop = '1px solid rgba(232, 160, 69, 0.2)';
        btnAdd.style.display = 'flex';
        btnAdd.style.alignItems = 'center';
        btnAdd.style.justifyContent = 'center';
        btnAdd.style.gap = '6px';
        btnAdd.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Thêm Nguồn Đọc Mới';
        btnAdd.addEventListener('click', (e) => {
            e.stopPropagation();
            khungChon.classList.remove('show');
            this.hienBangThemEngine();
        });
        khungChon.appendChild(btnAdd);
    },

    hienBangThemEngine() {
        let panel = document.getElementById('modal-add-engine');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'modal-add-engine';
            panel.className = 'modal-overlay';
            panel.innerHTML = `
                <div class="modal">
                    <div class="modal-title" style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Thêm Nguồn Đọc API</span>
                        <a href="guide_v0.4.0.html" target="_blank" title="Xem Hướng dẫn cấu hình API" style="color: var(--accent); opacity: 0.8; transition: opacity 0.2s; display: flex; align-items: center;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.8">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        </a>
                    </div>
                    <div class="modal-body" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                        <div id="ce-type-container" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 4px; scroll-behavior: smooth;">
                            <style>
                                #ce-type-container::-webkit-scrollbar { height: 4px; }
                                #ce-type-container::-webkit-scrollbar-track { background: var(--surface); border-radius: 4px; }
                                #ce-type-container::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
                                #ce-type-container::-webkit-scrollbar-thumb:hover { background: var(--accent); }
                                .ce-type-btn { flex: 0 0 auto; padding: 6px 14px; font-size: 11px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface2); color: var(--text); cursor: pointer; white-space: nowrap; transition: all 0.2s; }
                                .ce-type-btn:hover:not(.active) { border-color: var(--accent); color: var(--accent); }
                                #ce-btn-save:hover { background: var(--accent) !important; color: #ffffff !important; }
                                .ce-input { width: 100%; padding: 8px 12px; font-size: 11px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text); outline: none; transition: all 0.2s; box-sizing: border-box; }
                                input.ce-input { text-overflow: ellipsis; }
                                .ce-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(232, 160, 69, 0.2); text-overflow: clip; }
                                input[type="password"]::-ms-reveal, input[type="password"]::-ms-clear { display: none !important; }
                            </style>
                            <div class="ce-type-btn active" data-type="fpt" style="border-color: var(--accent); background: rgba(232, 160, 69, 0.1); color: var(--accent);">FPT.AI TTS</div>
                            <div class="ce-type-btn" data-type="azure">Microsoft Azure</div>
                            <div class="ce-type-btn" data-type="gcp">Google Cloud</div>
                            <div class="ce-type-btn" data-type="custom">Khác</div>
                        </div>
                        <input type="hidden" id="ce-type" value="fpt">
                        <input type="text" id="ce-name" class="ce-input" placeholder="Tên Nguồn (VD: Zalo TTS)" title="Tên Nguồn (VD: Zalo TTS)">
                        
                        <!-- Dành cho Custom -->
                        <div id="ce-custom-fields" style="display: flex; flex-direction: column; gap: 8px;">
                            <input type="text" id="ce-url" class="ce-input" placeholder="API URL" title="API URL">
                            <div class="custom-select-container" style="width: 100%;">
                                <select id="ce-method" style="display: none;">
                                    <option value="POST">POST</option>
                                    <option value="GET">GET</option>
                                </select>
                                <div class="custom-select-trigger ce-input" style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; margin: 0;">
                                    <span id="ce-method-text">POST</span>
                                    <div class="arrow"></div>
                                </div>
                                <div class="custom-select-dropdown" id="ce-method-dropdown" style="width: 100%;"></div>
                            </div>
                            <textarea id="ce-headers" class="ce-input" placeholder="Headers JSON" title='Ví dụ: {"Authorization": "Bearer XXX"}' style="height: 34px; min-height: 34px; resize: none; font-family: monospace; overflow: hidden;"></textarea>
                            <textarea id="ce-body" class="ce-input" placeholder="Body Template" title='Ví dụ: {"text": "{{van_ban}}"}' style="height: 34px; min-height: 34px; resize: none; font-family: monospace; overflow: hidden;"></textarea>
                            <input type="text" id="ce-audiopath" class="ce-input" placeholder="Audio Path (Để trống = Blob)" title="Đường dẫn đến file Audio trong JSON trả về (VD: data.audioUrl). Để trống nếu API trả trực tiếp file Blob.">
                        </div>
                        
                        <!-- Dành cho Premium API -->
                        <div id="ce-premium-fields" style="display: none; flex-direction: column; gap: 8px;">
                            <div style="position: relative; width: 100%;">
                                <input type="password" id="ce-api-key" class="ce-input" placeholder="Nhập API Key vào đây..." title="Nhập API Key vào đây..." style="width: 100%; padding-right: 32px;">
                                <div id="ce-toggle-key-visibility" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center;" title="Hiện/Ẩn API Key">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                </div>
                            </div>
                            <input type="text" id="ce-api-region" class="ce-input" placeholder="Azure Region (VD: southeastasia)" title="Azure Region (VD: southeastasia)" style="display: none;">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="ce-btn-cancel" class="btn-ctrl btn-sm" style="flex: 1; height: 28px; font-size: 11px;">Hủy</button>
                        <button id="ce-btn-save" class="btn-ctrl btn-sm" style="flex: 1; height: 28px; font-size: 11px; color: var(--accent); border-color: var(--accent);">Thêm</button>
                    </div>
                </div>
            `;
            document.body.appendChild(panel);
            
            const toggleKey = document.getElementById('ce-toggle-key-visibility');
            const keyInputEl = document.getElementById('ce-api-key');
            if (toggleKey && keyInputEl) {
                toggleKey.addEventListener('click', () => {
                    const t = keyInputEl.getAttribute('type') === 'password' ? 'text' : 'password';
                    keyInputEl.setAttribute('type', t);
                    if (t === 'text') {
                        toggleKey.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
                    } else {
                        toggleKey.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
                    }
                });
            }

            this.caiDatOChonTinh('ce-method', 'ce-method-text', 'ce-method-dropdown');
            
            ['ce-headers', 'ce-body'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.addEventListener('input', function() {
                        this.style.height = '34px';
                        this.style.height = (this.scrollHeight + 2) + 'px';
                    });
                }
            });
            
            const typeContainer = document.getElementById('ce-type-container');
            if (typeContainer) {
                typeContainer.addEventListener('wheel', (e) => {
                    if (e.deltaY !== 0) {
                        e.preventDefault();
                        typeContainer.scrollLeft += e.deltaY;
                    }
                });
            }

            const typeBtns = panel.querySelectorAll('.ce-type-btn');
            const hiddenType = document.getElementById('ce-type');
            
            const updateTypeSelection = (type) => {
                hiddenType.value = type;
                
                typeBtns.forEach(btn => {
                    if (btn.dataset.type === type) {
                        btn.classList.add('active');
                        btn.style.borderColor = 'var(--accent)';
                        btn.style.background = 'rgba(232, 160, 69, 0.1)';
                        btn.style.color = 'var(--accent)';
                        try {
                            const container = document.getElementById('ce-type-container');
                            const relativeLeft = btn.getBoundingClientRect().left - container.getBoundingClientRect().left + container.scrollLeft;
                            const scrollPos = relativeLeft - (container.clientWidth / 2) + (btn.clientWidth / 2);
                            const start = container.scrollLeft;
                            const change = scrollPos - start;
                            const duration = 250;
                            let startTime = null;
                            const animateScroll = (currentTime) => {
                                if (!startTime) startTime = currentTime;
                                const timeElapsed = currentTime - startTime;
                                const progress = Math.min(timeElapsed / duration, 1);
                                const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                                container.scrollLeft = start + change * ease;
                                if (timeElapsed < duration) requestAnimationFrame(animateScroll);
                            };
                            requestAnimationFrame(animateScroll);
                        } catch(e) {}
                    } else {
                        btn.classList.remove('active');
                        btn.style.borderColor = 'var(--border)';
                        btn.style.background = 'var(--surface2)';
                        btn.style.color = 'var(--text)';
                    }
                });

                const customFields = document.getElementById('ce-custom-fields');
                const premiumFields = document.getElementById('ce-premium-fields');
                const nameInput = document.getElementById('ce-name');
                const regionInput = document.getElementById('ce-api-region');
                const keyInput = document.getElementById('ce-api-key');
                
                if (type === 'custom') {
                    customFields.style.display = 'flex';
                    premiumFields.style.display = 'none';
                    nameInput.value = '';
                } else {
                    customFields.style.display = 'none';
                    premiumFields.style.display = 'flex';
                    if (type === 'fpt') { nameInput.value = 'FPT.AI TTS'; keyInput.placeholder = 'Nhập FPT API Key...'; keyInput.value = ''; }
                    if (type === 'azure') { nameInput.value = 'Microsoft Azure TTS'; keyInput.placeholder = 'Nhập Azure Subscription Key...'; keyInput.value = ''; }
                    if (type === 'gcp') { nameInput.value = 'Google Cloud TTS'; keyInput.placeholder = 'Nhập Google Cloud API Key...'; keyInput.value = ''; }
                    regionInput.style.display = type === 'azure' ? 'block' : 'none';
                    if (type === 'azure') regionInput.value = '';
                }
            };

            typeBtns.forEach(btn => {
                btn.addEventListener('click', () => updateTypeSelection(btn.dataset.type));
            });

            hiddenType.addEventListener('change', () => updateTypeSelection(hiddenType.value));
            
            document.getElementById('ce-btn-cancel').addEventListener('click', () => panel.classList.remove('show'));
            document.getElementById('ce-btn-save').addEventListener('click', () => this.xacNhanThemEngine());
        }
        document.getElementById('ce-api-key').value = '';
        document.getElementById('ce-api-region').value = '';
        document.getElementById('ce-url').value = '';
        document.getElementById('ce-headers').value = '';
        document.getElementById('ce-body').value = '';
        document.getElementById('ce-audiopath').value = '';

        panel.classList.add('show');
        document.getElementById('ce-type').value = 'fpt';
        document.getElementById('ce-type').dispatchEvent(new Event('change'));
        document.getElementById('ce-api-key').focus();
    },

    async xacNhanThemEngine() {
        const type = document.getElementById('ce-type').value;
        const name = document.getElementById('ce-name').value.trim();
        const customEngines = CauHinh.lay('customEngines', false) || [];
        const btnSave = document.getElementById('ce-btn-save');
        
        let engineId = '';

        if (!name) {
            showToast('Vui lòng nhập Tên nguồn đọc', 'warning');
            return;
        }

        if (customEngines.find(e => e.name.toLowerCase() === name.toLowerCase() && e.id !== type)) {
            showToast('Tên nguồn đọc đã tồn tại', 'warning');
            return;
        }

        if (type === 'custom') {
            const url = document.getElementById('ce-url').value.trim();
            const method = document.getElementById('ce-method').value;
            const headers = document.getElementById('ce-headers').value.trim();
            const bodyTemplate = document.getElementById('ce-body').value.trim();
            const audioPath = document.getElementById('ce-audiopath').value.trim();

            if (!url) {
                showToast('Vui lòng nhập URL', 'warning');
                return;
            }

            if (headers) {
                try { JSON.parse(headers); } catch (e) {
                    showToast('Headers phải là JSON hợp lệ', 'warning');
                    return;
                }
            }

            engineId = 'khac_' + Date.now().toString();
            const engine = {
                id: engineId,
                name, url, method, headers, bodyTemplate, audioPath, type: 'custom'
            };
            customEngines.push(engine);
        } else {
            const key = document.getElementById('ce-api-key').value.trim();
            if (!key) {
                showToast('Vui lòng nhập API Key', 'warning');
                return;
            }
            
            const region = type === 'azure' ? (document.getElementById('ce-api-region').value.trim() || 'southeastasia') : '';
            
            btnSave.disabled = true;
            btnSave.textContent = 'Đang kiểm tra...';
            try {
                let isValid = false;
                if (type === 'fpt') {
                    const res = await fetch('https://api.fpt.ai/hmi/tts/v5', {
                        method: 'POST',
                        headers: { 'api-key': key, 'voice': 'banmai', 'speed': '0' },
                        body: 'kiểm tra'
                    });
                    if (res.ok) isValid = true;
                } else if (type === 'azure') {
                    const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
                        method: 'POST',
                        headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3' },
                        body: `<speak version='1.0' xml:lang='vi-VN'><voice name='vi-VN-HoaiMyNeural'><prosody rate='1'>kiểm tra</prosody></voice></speak>`
                    });
                    if (res.ok) isValid = true;
                } else if (type === 'gcp') {
                    const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key },
                        body: JSON.stringify({ input: { text: "kiểm tra" }, voice: { languageCode: 'vi-VN', name: 'vi-VN-Wavenet-A' }, audioConfig: { audioEncoding: 'MP3', speakingRate: 1 } })
                    });
                    if (res.ok) isValid = true;
                }

                if (!isValid) {
                    showToast('API Key không hợp lệ hoặc đã hết hạn ngạch', 'warning');
                    btnSave.disabled = false;
                    btnSave.textContent = 'Thêm';
                    return;
                }
            } catch(e) {
                showToast('Lỗi kết nối kiểm tra API Key', 'warning');
                btnSave.disabled = false;
                btnSave.textContent = 'Thêm';
                return;
            }
            
            btnSave.disabled = false;
            btnSave.textContent = 'Thêm';
            
            engineId = type + '_' + Date.now().toString();
            const engine = { id: engineId, name, type, apiKey: key };

            if (type === 'azure') {
                engine.region = region;
            }
            
            customEngines.push(engine);
        }

        CauHinh.dat('customEngines', customEngines, false);

        document.getElementById('modal-add-engine').classList.remove('show');
        
        this.renderDanhSachEngine();
        
        const engineSelect = document.getElementById('engine-select');
        engineSelect.value = engineId;
        engineSelect.dispatchEvent(new Event('change'));
        
        showToast('Đã thêm nguồn đọc mới', 'success');
    },

    xoaEngineHienTai() {
        const engineSelect = document.getElementById('engine-select');
        const idXoa = engineSelect.value;
        if (!idXoa || idXoa === 'web') return;

        showConfirm('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa nguồn đọc này không?', () => {
            let customEngines = CauHinh.lay('customEngines', false) || [];
            customEngines = customEngines.filter(e => e.id !== idXoa);
            CauHinh.dat('customEngines', customEngines, false);

            if (idXoa.startsWith('fpt_')) CauHinh.dat('fpt_key', '', false);
            else if (idXoa.startsWith('azure_')) { CauHinh.dat('azure_key', '', false); CauHinh.dat('azure_region', '', false); }
            else if (idXoa.startsWith('gcp_')) CauHinh.dat('gcp_key', '', false);

            const optNode = Array.from(engineSelect.options).find(o => o.value === idXoa);
            if (optNode) optNode.remove();

            engineSelect.value = 'web';
            engineSelect.dispatchEvent(new Event('change'));
            showToast('Đã xóa nguồn đọc', 'success');
        });
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

            const onMouseMove = (e) => khididichcuyen(e.clientX, e.clientY);
            const onMouseUp = () => {
                handle.classList.remove('dragging');
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };

            handle.addEventListener('mousedown', (e) => {
                handle.classList.add('dragging');
                e.preventDefault();
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            });

            const onTouchMove = (e) => khididichcuyen(e.touches[0].clientX, e.touches[0].clientY);
            const onTouchEnd = () => {
                handle.classList.remove('dragging');
                window.removeEventListener('touchmove', onTouchMove);
                window.removeEventListener('touchend', onTouchEnd);
            };

            handle.addEventListener('touchstart', (e) => {
                handle.classList.add('dragging');
                e.preventDefault();
                window.addEventListener('touchmove', onTouchMove, { passive: false });
                window.addEventListener('touchend', onTouchEnd);
            }, { passive: false });
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
                
                const parts = key.split('+');
                return parts.map((part, index) => {
                    let kHtml = '';
                    if (part === 'ArrowUp') kHtml = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;
                    else if (part === 'ArrowDown') kHtml = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>`;
                    else if (part === 'ArrowLeft') kHtml = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`;
                    else if (part === 'ArrowRight') kHtml = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
                    else {
                        kHtml = part;
                        if (part === ',' || part === '.') {
                            return `<span style="font-size: 15px; font-weight: 900; line-height: 1; padding-bottom: 4px; display: inline-block;">${kHtml}</span>`;
                        }
                    }
                    if (index < parts.length - 1) return `<span>${kHtml}</span> <span style="font-size:11px; opacity:0.6">+</span> `;
                    return `<span>${kHtml}</span>`;
                }).join('');
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
                    
                    let keyStr = key;
                    if (e.ctrlKey) keyStr = 'Ctrl+' + keyStr;
                    if (e.altKey) keyStr = 'Alt+' + keyStr;
                    if (e.shiftKey && keyStr.length > 1 && !keyStr.includes('+')) keyStr = 'Shift+' + keyStr;

                    el.dataset.key = keyStr;
                    el.innerHTML = renderKey(keyStr);
                    el.blur();

                    chrome.storage.local.get('customShortcuts', data => {
                        const shortcuts = data.customShortcuts || defaultShortcuts;
                        shortcuts[keyName] = key;
                        chrome.storage.local.set({ customShortcuts: shortcuts }, () => {
                            showToast('Đã lưu phím tắt', 'success');
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
            const op = opElem ? opElem.value.toLowerCase() : 'or';

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
