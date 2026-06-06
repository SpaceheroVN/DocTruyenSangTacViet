import { CauHinh } from './quan_ly_cau_hinh.js';
import { QuanLyThuVien } from './quan_ly_thu_vien.js';
import { GiaoDienCaiDat } from './giao_dien_cai_dat.js';
import { showToast, showConfirm } from './tien_ich.js';

export const DieuKhienTrinhPhat = {
    idTabHienTai: null,
    thongTinTruyenHienTai: null,

    async khoiTao() {
        const versionBadge = document.getElementById('version-badge');
        if (versionBadge) versionBadge.textContent = 'v' + chrome.runtime.getManifest().version;

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const coverImg = document.getElementById('cover-img');
        if (coverImg) {
            coverImg.addEventListener('error', function() {
                if (this.src !== 'icons/icon128.png') {
                    this.src = 'icons/icon128.png';
                }
            });
        }

        if (tab && tab.url && tab.url.includes('sangtacviet.com')) {
            this.idTabHienTai = tab.id;
            this.yeuCauTrangThaiBanDau();
        } else {
            const btnOpenStv = document.getElementById('btn-open-stv');
            if (btnOpenStv) btnOpenStv.addEventListener('click', () => chrome.tabs.create({ url: 'https://sangtacviet.com/' }));
            
            const bookEmptyState = document.getElementById('book-empty-state');
            if (bookEmptyState) bookEmptyState.style.display = 'block';
            const bookMeta = document.getElementById('book-meta');
            if (bookMeta) bookMeta.style.display = 'none';
            const coverImg = document.getElementById('cover-img');
            if (coverImg) coverImg.style.display = 'none';
            const controls = document.querySelector('.controls');
            if (controls) controls.style.display = 'none';
            const statusBar = document.querySelector('.status-bar');
            if (statusBar) statusBar.style.display = 'none';
        }

        this.ganSuKien();
        
        chrome.runtime.onMessage.addListener((tinNhan) => {
            if (tinNhan.hanhDong === 'thayDoiTrangThai' && tinNhan.trangThai) {
                this.capNhatTrangThaiPhat(tinNhan.trangThai);
            } else if (tinNhan.hanhDong === 'capNhatAnhBia' && tinNhan.imgUrl) {
                const coverImg = document.getElementById('cover-img');
                if (coverImg) coverImg.src = tinNhan.imgUrl;
                if (this.thongTinTruyenHienTai) {
                    this.thongTinTruyenHienTai.imgUrl = tinNhan.imgUrl;
                }
            }
        });

        document.body.style.opacity = '1';
    },

    capNhatDanhSachGiong(engineId) {
        const theChon = document.getElementById('voice-select');
        const theThongTin = document.getElementById('info-voice');
        if (!theChon) return;
        const giaTriCu = CauHinh.lay('voiceIndex', true) || 0;

        const taoOptions = (cacGiong) => {
            theChon.innerHTML = cacGiong.map((ten, index) => {
                const tenAnToan = ten.replace(/[&<>"'`=\/]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[s]));
                return `<option value="${index}" ${index == giaTriCu ? 'selected' : ''}>${tenAnToan}</option>`;
            }).join('');
            GiaoDienCaiDat.capNhatGiaoDien('voice-select');
            if (theThongTin) {
                const selectedOpt = theChon.options[theChon.selectedIndex];
                theThongTin.textContent = selectedOpt ? selectedOpt.text : 'Mặc định';
            }
        };

        if (engineId === 'web') {
            if (!this.idTabHienTai) return;
            chrome.tabs.sendMessage(this.idTabHienTai, { hanhDong: 'layGiongDoc' }, phanHoi => {
                if (chrome.runtime.lastError) return;
                if (phanHoi && phanHoi.voices) {
                    theChon.innerHTML = phanHoi.voices.map(v => {
                        let ten = v.name.replace(/ - Vietnamese \(Vietnam\)/i, '').replace(/ \(Vietnam\)/i, '').replace(/Microsoft /i, 'MS ').replace(/Google /i, 'GG ');
                        if (ten.length > 22) ten = ten.substring(0, 20) + '...';
                        const tenAnToan = ten.replace(/[&<>"'`=\/]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[s]));
                        const anToanIndex = String(v.index).replace(/[^0-9]/g, '');
                        return `<option value="${anToanIndex}" ${anToanIndex == giaTriCu ? 'selected' : ''}>${tenAnToan}</option>`;
                    }).join('');
                    GiaoDienCaiDat.capNhatGiaoDien('voice-select');
                    if (theThongTin) {
                        const selectedOpt = theChon.options[theChon.selectedIndex];
                        theThongTin.textContent = selectedOpt ? selectedOpt.text : 'Mặc định';
                    }
                }
            });
        } else if (engineId.startsWith('fpt_')) {
            taoOptions(['Ban Mai (Nữ miền Bắc)', 'Lê Minh (Nam miền Bắc)', 'Thu Minh (Nữ miền Bắc)', 'Mỹ An (Nữ miền Trung)', 'Gia Huy (Nam miền Trung)', 'Lan Nhi (Nữ miền Nam)', 'Linh San (Nữ miền Nam)']);
        } else if (engineId.startsWith('azure_')) {
            taoOptions(['Hoài My (Nữ)', 'Nam Minh (Nam)']);
        } else if (engineId.startsWith('gcp_')) {
            taoOptions(['Neural2 A (Nữ)', 'Neural2 D (Nam)', 'Wavenet A (Nữ)', 'Wavenet B (Nam)', 'Wavenet C (Nữ)', 'Wavenet D (Nam)', 'Standard A (Nữ)', 'Standard B (Nam)', 'Standard C (Nữ)', 'Standard D (Nam)']);
        } else {
            if (theThongTin) theThongTin.textContent = 'Mặc định';
        }
    },

    yeuCauTrangThaiBanDau() {
        if (!this.idTabHienTai) return;
        chrome.tabs.sendMessage(this.idTabHienTai, { hanhDong: 'layThongTin' }, phanHoi => {
            if (chrome.runtime.lastError) {
                showToast('Không thể kết nối đến trang', 'warning');
                return;
            }
            if (phanHoi) this.capNhatThongTinTruyen(phanHoi);
        });
        
        const engineHienTai = CauHinh.lay('maydoc') || 'web';
        this.capNhatDanhSachGiong(engineHienTai);
    },

    guiLenh(hanhDong, thamSoThem = {}) {
        if (!this.idTabHienTai) return;
        chrome.tabs.sendMessage(this.idTabHienTai, { hanhDong: hanhDong, ...thamSoThem }, () => {
            if (chrome.runtime.lastError) {  }
        });
    },

    capNhatGiaoDienEngine(engineId) {
        if (!engineId) return;
        const badge = document.getElementById('tts-badge');
        const footerEngine = document.getElementById('footer-engine');
        const voiceTrigger = document.getElementById('custom-voice-trigger');
        
        let engineName = 'Web Speech API';
        let isWeb = true;
        let hasVoiceList = true;

        if (engineId === 'web') {
            engineName = 'Web TTS';
            if(footerEngine) footerEngine.textContent = 'Web Speech API';
        } else {
            isWeb = false;
            const customEngines = CauHinh.lay('customEngines') || [];
            const matched = customEngines.find(e => e.id === engineId);
            if (matched) {
                engineName = matched.name;
            } else if (engineId.startsWith('fpt_')) {
                engineName = 'FPT.AI TTS';
            } else if (engineId.startsWith('azure_')) {
                engineName = 'Azure TTS';
            } else if (engineId.startsWith('gcp_')) {
                engineName = 'GCP TTS';
            } else {
                engineName = 'Custom TTS';
            }
            if(footerEngine) footerEngine.textContent = engineName;

            if (!engineId.startsWith('fpt_') && !engineId.startsWith('azure_') && !engineId.startsWith('gcp_')) {
                hasVoiceList = false;
            }
        }

        if (badge) badge.textContent = engineName;

        if (voiceTrigger && voiceTrigger.parentElement) {
            voiceTrigger.parentElement.style.display = hasVoiceList ? 'block' : 'none';
            const optionsRow = voiceTrigger.parentElement.parentElement;
            if (optionsRow && optionsRow.classList.contains('options-row')) {
                optionsRow.style.justifyContent = hasVoiceList ? 'flex-start' : 'flex-end';
            }
        }

        const engineSelect = document.getElementById('engine-select');
        if (engineSelect && engineSelect.value !== engineId) {
            engineSelect.value = engineId;
            if (window.GiaoDienCaiDat && typeof GiaoDienCaiDat.capNhatGiaoDien === 'function') {
                GiaoDienCaiDat.capNhatGiaoDien('engine-select');
            }
        }

        const volSlider = document.getElementById('vol-slider');
        if (volSlider) {
            const maxVol = engineId === 'web' ? 1.0 : 2.0;
            volSlider.max = maxVol;
            if (parseFloat(volSlider.value) > maxVol) {
                volSlider.value = maxVol;
                const volVal = document.getElementById('vol-val');
                if (volVal) volVal.textContent = Math.round(maxVol * 100) + '%';
                if (window.CauHinh) CauHinh.dat('volume', maxVol, true);
                this.guiLenh('capNhatCaiDat');
            }
            if (window.GiaoDienCaiDat && typeof GiaoDienCaiDat.capNhatGiaoDien === 'function') {
                GiaoDienCaiDat.capNhatGiaoDien('vol-slider');
            }
        }

        this.capNhatDanhSachGiong(engineId);
    },

    capNhatTrangThaiPhat(trangThai) {
        if (!trangThai) return;

        const dangPhat = trangThai.isPlaying;
        const dangTamDung = trangThai.isPaused;
        const isBuffering = trangThai.isBuffering;
        const dangHoatDong = dangPhat && !dangTamDung;

        const elapsed = trangThai.elapsed || 0;
        const ptGio = Math.floor(elapsed / 3600);
        const ptPhut = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
        const ptGiay = (elapsed % 60).toString().padStart(2, '0');
        const timerText = document.getElementById('timer-text');
        if (timerText) {
            timerText.textContent = ptGio > 0 ? `${ptGio}:${ptPhut}:${ptGiay}` : `${ptPhut}:${ptGiay}`;
        }

        const bieuTuong = document.getElementById('btn-play-icon');
        const vanBanNut = document.getElementById('btn-play-text');
        
        const SVG_PHAT = '<polygon points="5 3 19 12 5 21 5 3"/>';
        const SVG_TAMDUNG = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';

        const chamTrangThai = document.getElementById('status-dot');
        const chuTrangThai = document.getElementById('status-text');

        if (!bieuTuong || !vanBanNut || !chamTrangThai || !chuTrangThai) return;
        
        if (isBuffering) {
            bieuTuong.innerHTML = SVG_TAMDUNG;
            vanBanNut.textContent = 'Dừng';
            chamTrangThai.className = 'status-dot paused';
            chuTrangThai.textContent = 'Đang tải audio...';
            chuTrangThai.style.color = 'var(--warning)';
        } else if (dangHoatDong) {
            bieuTuong.innerHTML = SVG_TAMDUNG;
            vanBanNut.textContent = 'Dừng';
            chamTrangThai.className = 'status-dot playing';
            chuTrangThai.textContent = 'Đang đọc...';
            chuTrangThai.style.color = 'var(--success)';
        } else if (dangPhat && dangTamDung) {
            bieuTuong.innerHTML = SVG_PHAT;
            vanBanNut.textContent = 'Tiếp tục';
            chamTrangThai.className = 'status-dot paused';
            chuTrangThai.textContent = 'Đang tạm dừng';
            chuTrangThai.style.color = 'var(--accent)';
        } else {
            bieuTuong.innerHTML = SVG_PHAT;
            vanBanNut.textContent = trangThai.coDocDo ? 'Tiếp tục' : 'Nghe';
            chamTrangThai.className = 'status-dot';
            chuTrangThai.textContent = trangThai.coDocDo ? 'Đã lưu vị trí' : 'Sẵn sàng';
            chuTrangThai.style.color = 'var(--text-muted)';
        }

        if (trangThai.progress) {
            const input = document.getElementById('progress-input');
            const total = document.getElementById('progress-total');
            const bar = document.getElementById('progress-bar-fill') || document.getElementById('progress-bar');
            const percent = document.getElementById('progress-percent');
            if(input && !input.dataset.dangSua) input.value = trangThai.progress.current;
            if(total) total.textContent = trangThai.progress.total;
            if(bar && percent) {
                const phanTram = Math.round((trangThai.progress.current / trangThai.progress.total) * 100);
                bar.style.width = '100%';
                bar.style.transformOrigin = 'left';
                bar.style.transform = `scaleX(${trangThai.progress.current / trangThai.progress.total})`;
                percent.textContent = phanTram + '%';
            }
        }

        if (trangThai.engine) {
            this.capNhatGiaoDienEngine(trangThai.engine);
        }
    },

    capNhatThongTinTruyen(thongTin) {
        if (!thongTin) return;
        this.thongTinTruyenHienTai = thongTin;
        
        const laTrangChu = thongTin.pageUrl && !thongTin.pageUrl.includes('/truyen/');
        
        if (thongTin.bookTitle) {
            document.getElementById('current-title').textContent = thongTin.bookTitle;
            document.getElementById('current-chap').style.display = 'block';
            document.getElementById('cover-img').style.display = 'block';
            document.getElementById('btn-save').style.display = 'flex';
            
            const controls = document.querySelector('.controls');
            if (controls) controls.style.display = thongTin.progress ? 'flex' : 'none';
            const statusBar = document.querySelector('.status-bar');
            if (statusBar) statusBar.style.display = thongTin.progress ? 'flex' : 'none';
        } else if (laTrangChu) {
            document.getElementById('current-title').textContent = 'Đang ở trang chủ / tìm kiếm';
            document.getElementById('current-chap').style.display = 'none';
            document.getElementById('cover-img').style.display = 'none';
            document.getElementById('btn-save').style.display = 'none';
            
            const controls = document.querySelector('.controls');
            if (controls) controls.style.display = 'none';
            const statusBar = document.querySelector('.status-bar');
            if (statusBar) statusBar.style.display = 'none';
        }
        
        const chapEl = document.getElementById('current-chap');
        if (thongTin.chapTitle) {
            chapEl.textContent = thongTin.chapTitle;
        } else if (thongTin.stats) {
            const container = document.createElement('div');
            container.style.cssText = 'display: flex; align-items: center; justify-content: flex-start; color: var(--text-muted); font-size: 11px;';
            
            if (thongTin.stats.view) {
                const span = document.createElement('span');
                span.style.cssText = 'margin-right: 12px; display: inline-flex; align-items: center;';
                span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
                const text = document.createTextNode(thongTin.stats.view);
                span.appendChild(text);
                container.appendChild(span);
            }
            if (thongTin.stats.like) {
                const span = document.createElement('span');
                span.style.cssText = 'margin-right: 12px; display: inline-flex; align-items: center;';
                span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>';
                const text = document.createTextNode(thongTin.stats.like);
                span.appendChild(text);
                container.appendChild(span);
            }
            if (thongTin.stats.status) {
                const span = document.createElement('span');
                if (thongTin.stats.status === 'Còn tiếp') {
                    span.style.cssText = 'display: inline-flex; align-items: center; color: var(--accent);';
                    span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
                } else {
                    span.style.cssText = 'display: inline-flex; align-items: center; color: #10b981;';
                    span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                }
                const text = document.createTextNode(thongTin.stats.status);
                span.appendChild(text);
                container.appendChild(span);
            }
            chapEl.innerHTML = '';
            chapEl.appendChild(container);
        } else {
            chapEl.textContent = '—';
        }
        
        if (thongTin.imgUrl) {
            document.getElementById('cover-img').src = thongTin.imgUrl;
        }
        
        if (QuanLyThuVien.danhSachDoc) {
            navigator.locks.request('stv_readingList_lock', () => {
                return new Promise(moKhoa => {
                    chrome.storage.local.get('readingList', duLieu => {
                        const danhSach = duLieu.readingList || [];
                        const vt = danhSach.findIndex(i => (i.title || '').trim().toLowerCase() === (thongTin.bookTitle || '').trim().toLowerCase());
                        
                        if (!thongTin.imgUrl && vt !== -1 && danhSach[vt].imgUrl) {
                            document.getElementById('cover-img').src = danhSach[vt].imgUrl;
                        }

                        if (vt !== -1) {
                            this.datTrangThaiLuu(true);
                            let daCapNhat = false;
                            const docHienTai = danhSach[vt];
                            if (thongTin.pageUrl && docHienTai.url !== thongTin.pageUrl) { docHienTai.url = thongTin.pageUrl; daCapNhat = true; }
                            if (thongTin.chapTitle && docHienTai.chap !== thongTin.chapTitle) { docHienTai.chap = thongTin.chapTitle; daCapNhat = true; }
                            if (thongTin.imgUrl && docHienTai.imgUrl !== thongTin.imgUrl) {
                                let safeImg = thongTin.imgUrl;
                                if (safeImg.startsWith('data:')) safeImg = '';
                                if (safeImg.toLowerCase().startsWith('http://')) safeImg = 'https://' + safeImg.substring(7);
                                docHienTai.imgUrl = safeImg;
                                daCapNhat = true;
                            }
                            const chunkMoi = (thongTin.absoluteProgress && thongTin.absoluteProgress.current)
                                ? thongTin.absoluteProgress.current
                                : (thongTin.progress && thongTin.progress.current ? thongTin.progress.current : null);
                            if (chunkMoi !== null && docHienTai.chunkIndex !== chunkMoi) {
                                docHienTai.chunkIndex = chunkMoi;
                                daCapNhat = true;
                            }
                            if (daCapNhat) {
                                chrome.storage.local.set({ readingList: danhSach }, () => {
                                    QuanLyThuVien.danhSachDoc = danhSach;
                                    QuanLyThuVien.hienThiDanhSach(QuanLyThuVien.sapXepDanhSach(danhSach));
                                    moKhoa();
                                });
                            } else {
                                moKhoa();
                            }
                        } else {
                            this.datTrangThaiLuu(false);
                            moKhoa();
                        }
                    });
                });
            });
        }
        
        this.capNhatTrangThaiPhat({
            isPlaying: thongTin.isPlaying,
            isPaused: thongTin.isPaused,
            isBuffering: thongTin.isBuffering,
            engine: thongTin.ttsEngine,
            elapsed: thongTin.elapsed || 0,
            progress: thongTin.progress
        });
    },

    datTrangThaiLuu(daLuu) {
        const nut = document.getElementById('btn-save');
        if (!nut) return;
        nut.className = `btn-save${daLuu ? ' saved' : ''}`;
        nut.innerHTML = daLuu ? 
            '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path><polyline points="9 11 12 14 22 4"></polyline></svg>Đã lưu' : 
            '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>Lưu';
    },

    ganSuKien() {
        document.getElementById('btn-play')?.addEventListener('click', () => {
            this.guiLenh('daoTrangThaiPhat');
            const btnPlay = document.getElementById('btn-play');
            if (btnPlay) {
                btnPlay.classList.add('active');
                setTimeout(() => btnPlay.classList.remove('active'), 200);
            }
        });
        document.getElementById('btn-stop')?.addEventListener('click', () => this.guiLenh('dungPhat'));
        document.getElementById('btn-next')?.addEventListener('click', () => this.guiLenh('chuongTiep'));
        document.getElementById('btn-prev')?.addEventListener('click', () => this.guiLenh('chuongTruoc'));
        document.getElementById('btn-replay')?.addEventListener('click', () => this.guiLenh('phatLai'));

        const btnSave = document.getElementById('btn-save');
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                const hienTai = this.thongTinTruyenHienTai;
                if (!hienTai || !hienTai.bookTitle) {
                    showToast('Không có truyện nào đang mở', 'warning');
                    return;
                }
                
                navigator.locks.request('stv_readingList_lock', () => {
                    return new Promise(moKhoa => {
                        chrome.storage.local.get('readingList', duLieu => {
                            const danhSach = duLieu.readingList || [];
                            const vitri = danhSach.findIndex(i => (i.title || '').trim().toLowerCase() === hienTai.bookTitle.trim().toLowerCase());
                            
                            if (vitri !== -1) {
                                danhSach.splice(vitri, 1);
                                chrome.storage.local.set({ readingList: danhSach }, () => {
                                    QuanLyThuVien.danhSachDoc = danhSach;
                                    QuanLyThuVien.hienThiDanhSach(QuanLyThuVien.sapXepDanhSach(danhSach));
                                    this.datTrangThaiLuu(false);
                                    const infoCount = document.getElementById('info-count');
                                    if (infoCount) infoCount.textContent = `${danhSach.length} truyện`;
                                    showToast('Đã bỏ lưu truyện', 'info');
                                    moKhoa();
                                });
                            } else {
                                if (danhSach.length >= 50) danhSach.shift();
                                let safeImg = hienTai.imgUrl || '';
                                if (safeImg.startsWith('data:')) safeImg = '';
                                if (safeImg.toLowerCase().startsWith('http://')) safeImg = 'https://' + safeImg.substring(7);
                                danhSach.push({
                                    title: hienTai.bookTitle,
                                    url: hienTai.pageUrl || hienTai.bookUrl,
                                    imgUrl: safeImg,
                                    timestamp: Date.now(),
                                    savedAt: new Date().toLocaleDateString('vi-VN'),
                                    chap: hienTai.chapTitle || 'Chưa đọc chương nào',
                                    chunkIndex: (hienTai.absoluteProgress && hienTai.absoluteProgress.current) ? hienTai.absoluteProgress.current : ((hienTai.progress && hienTai.progress.current) ? hienTai.progress.current : 0)
                                });
                                chrome.storage.local.set({ readingList: danhSach }, () => {
                                    QuanLyThuVien.danhSachDoc = danhSach;
                                    QuanLyThuVien.hienThiDanhSach(QuanLyThuVien.sapXepDanhSach(danhSach));
                                    this.datTrangThaiLuu(true);
                                    const infoCount = document.getElementById('info-count');
                                    if (infoCount) infoCount.textContent = `${danhSach.length} truyện`;
                                    showToast('Đã lưu truyện thành công!', 'success');
                                    moKhoa();
                                });
                            }
                        });
                    });
                });
            });
        }

        document.querySelectorAll('.tab').forEach(nut => {
            nut.addEventListener('click', (e) => {
                const engineSelect = document.getElementById('engine-select');
                if (engineSelect && ['fpt', 'azure'].includes(engineSelect.value)) {
                    if (engineSelect.value !== CauHinh.lay('maydoc', true)) {
                        engineSelect.value = CauHinh.lay('maydoc', true) || 'web';
                        engineSelect.dispatchEvent(new Event('change'));
                    }
                }
                
                const dangActive = e.currentTarget.classList.contains('active');
                const laTabMain = e.currentTarget.dataset.tab === 'main';
                
                document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
                
                if (dangActive && !laTabMain) {
                    const nutMain = document.querySelector('.tab[data-tab="main"]');
                    if (nutMain) nutMain.classList.add('active');
                    const panelMain = document.getElementById('panel-main');
                    if (panelMain) panelMain.classList.add('active');
                } else {
                    e.currentTarget.classList.add('active');
                    const panel = document.getElementById('panel-' + e.currentTarget.dataset.tab);
                    if (panel) panel.classList.add('active');
                }
                
                GiaoDienCaiDat.taiLaiDuLieuTuDongDung();
                GiaoDienCaiDat.taiLaiDuLieuMayDoc();
            });
        });

        const modal = document.getElementById('confirm-modal');
        if (modal) {
            modal.addEventListener('click', e => { if(e.target === modal) modal.classList.remove('show'); });
        }

        document.addEventListener('contextmenu', e => { if (e.target.tagName !== 'INPUT') e.preventDefault(); });
        document.addEventListener('dragstart', e => { if (e.target.tagName !== 'INPUT') e.preventDefault(); });

        const btnNextChunk = document.getElementById('btn-next-chunk');
        if (btnNextChunk) btnNextChunk.addEventListener('click', () => this.guiLenh('doanTiep'));
        const btnPrevChunk = document.getElementById('btn-prev-chunk');
        if (btnPrevChunk) btnPrevChunk.addEventListener('click', () => this.guiLenh('doanTruoc'));

        const progressInput = document.getElementById('progress-input');
        if (progressInput) {
            progressInput.addEventListener('focus', () => { progressInput.dataset.dangSua = '1'; });
            progressInput.addEventListener('blur', () => { progressInput.dataset.dangSua = ''; });
            progressInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const val = parseInt(progressInput.value);
                    const total = parseInt(document.getElementById('progress-total')?.textContent || '0');
                    if (val >= 1 && val <= total) {
                        this.guiLenh('nhayDenDoan', { chiSo: val - 1 });
                    }
                    progressInput.blur();
                }
            });
        }
    }
};