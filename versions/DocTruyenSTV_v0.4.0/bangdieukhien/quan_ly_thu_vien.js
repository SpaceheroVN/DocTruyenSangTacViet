import { DieuKhienTrinhPhat } from './dieu_khien_trinh_phat.js';
import { showToast, showConfirm } from './tien_ich.js';

export const QuanLyThuVien = {
    danhSachDoc: [],
    cheDoSapXep: 'recent',

    urlAnToan(url) {
        if (!url || typeof url !== 'string') return '';
        try {
            const parsed = new URL(url.trim());
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href;
            return '';
        } catch(e) { return ''; }
    },

    khoiTao() {
        this.taiDanhSachDoc();
        this.ganSuKienThuVien();
        this.capNhatDungLuong();
    },

    sapXepDanhSach(danhSach) {
        const mang = [...danhSach];
        if (this.cheDoSapXep === 'az') mang.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'vi'));
        else if (this.cheDoSapXep === 'chapters') mang.sort((a, b) => (b.chunkTotal || 0) - (a.chunkTotal || 0));
        else mang.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        return mang;
    },

    taiDanhSachDoc() {
        chrome.storage.local.get('readingList', d => {
            this.danhSachDoc = d.readingList || [];
            this.hienThiDanhSach(this.sapXepDanhSach(this.danhSachDoc));
            const soLuong = document.getElementById('info-count');
            if (soLuong) soLuong.textContent = `${this.danhSachDoc.length} truyện`;
        });
    },

    hienThiDanhSach(danhSach) {
        const vungDanhSach = document.getElementById('list-container');
        if (!vungDanhSach) return;
        if (!danhSach.length) {
            vungDanhSach.innerHTML = '<div class="list-empty">Chưa có truyện nào được lưu.</div>';
            return;
        }

        const ANH_KHUYET = 'icons/icon128.png';

        const fragment = document.createDocumentFragment();

        danhSach.forEach((m, index) => {
            let mauNgay = 'var(--text-muted)';
            let textNgay = m.savedAt || '';
            if (m.timestamp) {
                const soNgay = (Date.now() - m.timestamp) / (1000 * 60 * 60 * 24);
                if (soNgay > 60) mauNgay = '#888888';
                else if (soNgay > 30) mauNgay = 'var(--danger)';
                else if (soNgay > 15) mauNgay = 'var(--warning)';
                if (!textNgay) textNgay = new Date(m.timestamp).toLocaleDateString('vi-VN');
            }
            
            const anhAnToan = this.urlAnToan(m.imgUrl) || ANH_KHUYET;
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'list-item';
            itemDiv.dataset.url = m.url || '';
            itemDiv.id = `list-item-${index}`;
            itemDiv.title = 'Nhấn để mở';

            const img = document.createElement('img');
            img.className = 'list-thumb';
            img.src = anhAnToan;
            img.alt = '';
            img.referrerPolicy = 'no-referrer';
            itemDiv.appendChild(img);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'list-info';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'list-name';
            nameDiv.textContent = m.title;
            infoDiv.appendChild(nameDiv);

            const chapDiv = document.createElement('div');
            chapDiv.className = 'list-chap';
            chapDiv.textContent = m.chap || '...';
            if (m.chunkIndex) {
                const span = document.createElement('span');
                span.style.color = 'var(--accent)';
                span.textContent = ` (Đoạn ${m.chunkIndex})`;
                chapDiv.appendChild(span);
            }
            infoDiv.appendChild(chapDiv);

            itemDiv.appendChild(infoDiv);

            if (textNgay) {
                const dateSpan = document.createElement('span');
                dateSpan.style.color = mauNgay;
                dateSpan.style.fontSize = '9px';
                dateSpan.style.marginRight = '6px';
                dateSpan.textContent = textNgay;
                itemDiv.appendChild(dateSpan);
            }

            const btnRemove = document.createElement('button');
            btnRemove.className = 'btn-remove';
            btnRemove.dataset.title = m.title || '';
            btnRemove.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
            itemDiv.appendChild(btnRemove);

            fragment.appendChild(itemDiv);
        });

        vungDanhSach.replaceChildren(fragment);

        if (!this._daGanSuKienDanhSach) {
            this._daGanSuKienDanhSach = true;
            vungDanhSach.addEventListener('click', (e) => {
                const btnRemove = e.target.closest('.btn-remove');
                if (btnRemove) {
                    e.stopPropagation();
                    this.xoaKhoiDanhSach(btnRemove.dataset.title);
                    return;
                }
                const item = e.target.closest('.list-item');
                if (item) {
                    const url = item.dataset.url;
                    if (url && /^https?:\/\//.test(url)) window.open(url, '_blank');
                }
            });
        }
    },

    xoaKhoiDanhSach(tieuDe) {
        chrome.storage.local.get('readingList', d => {
            let mang = d.readingList || [];
            const viTri = mang.findIndex(m => m.title === tieuDe);
            if (viTri !== -1) mang.splice(viTri, 1);
            chrome.storage.local.set({ readingList: mang }, () => {
                this.danhSachDoc = mang;
                this.taiDanhSachDoc();
                if (DieuKhienTrinhPhat.thongTinTruyenHienTai &&
                    (DieuKhienTrinhPhat.thongTinTruyenHienTai.bookTitle || '').trim().toLowerCase() === (tieuDe || '').trim().toLowerCase()) {
                    DieuKhienTrinhPhat.datTrangThaiLuu(false);
                }
                showToast('Đã xóa khỏi thư viện', 'success');
            });
        });
    },

    capNhatDungLuong() {
        if (!chrome.storage.local.getBytesInUse) return;
        chrome.storage.local.getBytesInUse(null, bytes => {
            const kb = (bytes / 1024).toFixed(1);
            const dungLuongElem = document.getElementById('info-size');
            if (dungLuongElem) dungLuongElem.textContent = `${kb} KB`;
        });
    },

    xuatDuLieu() {
        chrome.storage.local.get(null, dl => {
            const copy = { ...dl };
            delete copy.fpt_key;
            delete copy.azure_key;
            delete copy.gcp_key;
            const blob = new Blob([JSON.stringify(copy, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DocTruyenSTV_Backup_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Đã xuất dữ liệu sao lưu', 'success');
        });
    },

    nhapDuLieu(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const CAC_KHOA_HOP_LE = ['readingList', 'customDict', 'fpt_key', 'azure_key', 'azure_region', 'gcp_key', 'miniPlayerMode', 'isMiniPlayerMinimized'];
        
        file.text().then(text => {
            try {
                const dulieu = JSON.parse(text);
                if (typeof dulieu !== 'object' || dulieu === null) throw new Error('File hỏng');
                
                const duLieuSach = {};
                for (const khoa of CAC_KHOA_HOP_LE) {
                    if (dulieu[khoa] !== undefined) duLieuSach[khoa] = dulieu[khoa];
                }
                if (duLieuSach.readingList && !Array.isArray(duLieuSach.readingList)) {
                    delete duLieuSach.readingList;
                }
                
                if (Object.keys(duLieuSach).length === 0) {
                    showToast('File không chứa dữ liệu hợp lệ', 'warning');
                    e.target.value = '';
                    return;
                }
                
                chrome.storage.local.set(duLieuSach, () => {
                    this.taiDanhSachDoc();
                    showToast('Đã phục hồi dữ liệu thành công!', 'success');
                });
            } catch (err) {
                showToast('File không hợp lệ', 'error');
            }
            e.target.value = '';
        }).catch(() => {
            showToast('Lỗi đọc file', 'error');
            e.target.value = '';
        });
    },

    ganSuKienThuVien() {
        const listSearch = document.getElementById('list-search');
        if (listSearch) {
            let searchTimeout = null;
            listSearch.addEventListener('input', e => {
                if (searchTimeout) clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    const tuKhoa = e.target.value.trim().toLowerCase();
                    const vungDanhSach = document.getElementById('list-container');
                    if (!vungDanhSach) return;
                    const cacMuc = vungDanhSach.querySelectorAll('.list-item');
                    if (!tuKhoa) {
                        cacMuc.forEach(muc => muc.style.display = 'flex');
                        return;
                    }
                    cacMuc.forEach(muc => {
                        const ten = (muc.querySelector('.list-name')?.textContent || '').toLowerCase();
                        const chuong = (muc.querySelector('.list-chap')?.textContent || '').toLowerCase();
                        if (ten.includes(tuKhoa) || chuong.includes(tuKhoa)) {
                            muc.style.display = 'flex';
                            muc.classList.remove('hidden-by-search');
                        } else {
                            muc.style.display = 'none';
                            muc.classList.add('hidden-by-search');
                        }
                    });
                }, 200);
            });
        }

        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.cheDoSapXep = btn.dataset.sort;
                this.hienThiDanhSach(this.sapXepDanhSach(this.danhSachDoc));
            });
        });

        const btnExport = document.getElementById('btn-export-data');
        if (btnExport) btnExport.addEventListener('click', () => this.xuatDuLieu());

        const fileInput = document.getElementById('import-file-input');
        if (fileInput) fileInput.addEventListener('change', (e) => this.nhapDuLieu(e));

        const btnImport = document.getElementById('btn-import-data');
        if (btnImport && fileInput) btnImport.addEventListener('click', () => fileInput.click());

        const btnClear = document.getElementById('btn-clear-all');
        if (btnClear) btnClear.addEventListener('click', () => {
            showConfirm(
                'Xác nhận xóa toàn bộ dữ liệu',
                'Hành động này sẽ xóa vĩnh viễn:\n• Danh sách truyện đã lưu\n• Từ điển tùy chỉnh\n• Toàn bộ cài đặt\n\n(API Key của bạn vẫn sẽ được giữ lại!)\n\nKhông thể hoàn tác!',
                () => {
                    const keysToRemove = [
                        'readingList', 'customDict', 'stopTime', 'stopRealtimeTarget', 
                        'stopAfterChapters', 'customStopConfig', 'sleepTargetTimestamp',
                        'last_active_state', 'miniPlayerMode', 'isMiniPlayerMinimized', 'customShortcuts'
                    ];
                    chrome.storage.local.remove(keysToRemove, () => {
                        this.taiDanhSachDoc();
                        showToast('Đã xóa trắng dữ liệu', 'success');
                    });
                }
            );
        });
    }
};
