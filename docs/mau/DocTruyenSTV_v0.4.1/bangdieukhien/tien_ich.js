// Toast nổi và hộp thoại xác nhận cho popup

// === Thông báo nổi ===

// Hiện toast popup, giữ khi hover và xem tooltip
export function hien_thong_bao(tin_nhan, loai_thong_bao = 'info') {
    let the_thong_bao = document.getElementById('stv-toast-singleton');
    if (!the_thong_bao) {
        the_thong_bao = document.createElement('div');
        the_thong_bao.id = 'stv-toast-singleton';
        the_thong_bao.className = 'toast';
        document.body.appendChild(the_thong_bao);
    }

    if (!the_thong_bao.da_gan_su_kien_chuot) {
        the_thong_bao.da_gan_su_kien_chuot = true;
        the_thong_bao.dang_re_chuot = false;
        the_thong_bao.addEventListener('mouseenter', () => {
            the_thong_bao.dang_re_chuot = true;
            clearTimeout(the_thong_bao.id_hen_gio);
        });
        the_thong_bao.addEventListener('mouseleave', () => {
            the_thong_bao.dang_re_chuot = false;
            if (!the_thong_bao.classList.contains('show')) return;
            clearTimeout(the_thong_bao.id_hen_gio);
            the_thong_bao.id_hen_gio = setTimeout(() => {
                if (!the_thong_bao.dang_re_chuot) {
                    the_thong_bao.classList.remove('show');
                }
            }, 1500);
        });
    }
    
    // Chọn biểu tượng theo ngữ cảnh thông báo
    let loai = loai_thong_bao;
    const noi_dung_day_du = String(tin_nhan || '').trim();
    const chu_thuong = noi_dung_day_du.toLowerCase();
    if (chu_thuong.includes('bỏ lưu') || chu_thuong.includes('xóa khỏi thư viện')) {
        loai = 'unsave';
    } else if (chu_thuong.includes('đã lưu') && loai === 'success') {
        loai = 'save-success';
    }

    the_thong_bao.className = `toast show toast-${loai === 'save-success' ? 'success' : loai}`;
    the_thong_bao.setAttribute('title', noi_dung_day_du);
    
    let bieu_tuong = '';
    if (loai === 'save-success') {
        // Biểu tượng đã lưu
        bieu_tuong = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            <path d="m9 10 2 2 4-4"></path>
        </svg>`;
    } else if (loai === 'unsave') {
        // Biểu tượng bỏ lưu
        bieu_tuong = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            <line x1="9.5" y1="8.5" x2="14.5" y2="13.5"></line>
            <line x1="14.5" y1="8.5" x2="9.5" y2="13.5"></line>
        </svg>`;
    } else if (loai === 'success') {
        // Biểu tượng thành công
        bieu_tuong = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="m9 12 2 2 4-4"></path>
        </svg>`;
    } else if (loai === 'error') {
        bieu_tuong = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>`;
    } else if (loai === 'warning') {
        bieu_tuong = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>`;
    } else {
        // Biểu tượng thông tin chung
        bieu_tuong = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>`;
    }

    const khung_icon = document.createElement('div');
    khung_icon.className = 'toast-icon';
    khung_icon.innerHTML = bieu_tuong;
    const khung_chu = document.createElement('div');
    khung_chu.className = 'toast-message';
    khung_chu.textContent = tin_nhan || '';
    khung_chu.setAttribute('title', noi_dung_day_du);
    the_thong_bao.replaceChildren(khung_icon, khung_chu);
    
    clearTimeout(the_thong_bao.id_hen_gio);
    if (!the_thong_bao.dang_re_chuot) {
        the_thong_bao.id_hen_gio = setTimeout(() => {
            if (!the_thong_bao.dang_re_chuot) {
                the_thong_bao.classList.remove('show');
            }
        }, 3000);
    }
}

// === Hộp thoại xác nhận ===

// Mở hộp thoại xác nhận hành động
export function hien_xac_nhan(tieu_de, noi_dung, hanh_dong_xac_nhan, tuy_chon = null) {
    const khung_hop_thoai = document.getElementById('confirm-modal');
    const the_tieu_de = document.getElementById('modal-title');
    const the_noi_dung = document.getElementById('modal-body');
    const nut_xac_nhan = document.getElementById('modal-confirm');
    const nut_huy_bo = document.getElementById('modal-cancel');
    const khung_tich = document.getElementById('modal-checkbox-row');
    const o_tich = document.getElementById('modal-checkbox');
    const nhan_tich = document.getElementById('modal-checkbox-text');
    const ghi_chu_chan = document.getElementById('modal-footer-note');
    
    if (!khung_hop_thoai || !the_tieu_de || !the_noi_dung || !nut_xac_nhan || !nut_huy_bo) {
        if (confirm(`${tieu_de}\n${noi_dung}`)) {
            if (typeof hanh_dong_xac_nhan === 'function') {
                hanh_dong_xac_nhan({ da_tich: tuy_chon?.checkboxChecked !== false });
            }
        }
        return;
    }

    the_tieu_de.textContent = tieu_de;
    the_noi_dung.style.whiteSpace = 'pre-line';
    the_noi_dung.textContent = noi_dung;

    if (khung_tich && o_tich && nhan_tich) {
        if (tuy_chon && tuy_chon.checkboxLabel) {
            o_tich.checked = tuy_chon.checkboxChecked !== false;
            nhan_tich.textContent = tuy_chon.checkboxLabel;
            khung_tich.style.display = 'flex';
            khung_hop_thoai.classList.add('has-checkbox');
        } else {
            o_tich.checked = false;
            khung_tich.style.display = 'none';
            khung_hop_thoai.classList.remove('has-checkbox');
        }
    }

    if (ghi_chu_chan) {
        if (tuy_chon && tuy_chon.footerWarning) {
            ghi_chu_chan.textContent = tuy_chon.footerWarning;
            ghi_chu_chan.style.display = 'inline-block';
        } else {
            ghi_chu_chan.textContent = '';
            ghi_chu_chan.style.display = 'none';
        }
    }

    const bo_huy = new AbortController();
    const tin_hieu = bo_huy.signal;
    
    const dong_hop_thoai = () => {
        khung_hop_thoai.classList.remove('show', 'has-checkbox');
        if (khung_tich) khung_tich.style.display = 'none';
        if (ghi_chu_chan) ghi_chu_chan.style.display = 'none';
        bo_huy.abort();
    };
    
    nut_xac_nhan.addEventListener('click', () => {
        const ket_qua = { da_tich: o_tich ? Boolean(o_tich.checked) : false };
        dong_hop_thoai();
        if (typeof hanh_dong_xac_nhan === 'function') hanh_dong_xac_nhan(ket_qua);
    }, { signal: tin_hieu, once: true });

    nut_huy_bo.addEventListener('click', dong_hop_thoai, { signal: tin_hieu, once: true });
    
    khung_hop_thoai.addEventListener('click', (su_kien) => {
        if (su_kien.target === khung_hop_thoai) dong_hop_thoai();
    }, { signal: tin_hieu });

    document.addEventListener('keydown', (su_kien) => {
        if (su_kien.key === 'Escape') dong_hop_thoai();
    }, { signal: tin_hieu });

    khung_hop_thoai.classList.add('show');
}
