// Hiển thị thông báo nổi trên giao diện popup
export function hien_thong_bao(tin_nhan, loai_thong_bao = 'info') {
    let the_thong_bao = document.getElementById('stv-toast-singleton');
    if (!the_thong_bao) {
        the_thong_bao = document.createElement('div');
        the_thong_bao.id = 'stv-toast-singleton';
        the_thong_bao.className = 'toast';
        document.body.appendChild(the_thong_bao);
    }
    
    // Tự động nhận diện ngữ cảnh lưu / bỏ lưu truyện để hiển thị biểu tượng chính xác nhất
    let loai = loai_thong_bao;
    const chu_thuong = (tin_nhan || '').toLowerCase();
    if (chu_thuong.includes('bỏ lưu') || chu_thuong.includes('xóa khỏi thư viện')) {
        loai = 'unsave';
    } else if (chu_thuong.includes('đã lưu') && loai === 'success') {
        loai = 'save-success';
    }

    the_thong_bao.className = `toast show toast-${loai === 'save-success' ? 'success' : loai}`;
    
    let bieu_tuong = '';
    if (loai === 'save-success') {
        // Biểu tượng bookmark đã lưu với dấu check chuẩn tỉ lệ
        bieu_tuong = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            <path d="m9 10 2 2 4-4"></path>
        </svg>`;
    } else if (loai === 'unsave') {
        // Biểu tượng bỏ lưu (Bookmark có dấu X rõ ràng ở giữa)
        bieu_tuong = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            <line x1="9.5" y1="8.5" x2="14.5" y2="13.5"></line>
            <line x1="14.5" y1="8.5" x2="9.5" y2="13.5"></line>
        </svg>`;
    } else if (loai === 'success') {
        // Dấu tick chuẩn cân đối tuyệt đối bên trong vòng tròn
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
        // Thông tin chung (info)
        bieu_tuong = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>`;
    }

    the_thong_bao.innerHTML = `<div class="toast-icon">${bieu_tuong}</div><div class="toast-message">${tin_nhan}</div>`;
    
    clearTimeout(the_thong_bao.id_hen_gio);
    the_thong_bao.id_hen_gio = setTimeout(() => {
        the_thong_bao.classList.remove('show');
    }, 3000);
}

// Hiển thị hộp thoại xác nhận hành động
export function hien_xac_nhan(tieu_de, noi_dung, hanh_dong_xac_nhan) {
    const khung_hop_thoai = document.getElementById('confirm-modal');
    const the_tieu_de = document.getElementById('modal-title');
    const the_noi_dung = document.getElementById('modal-body');
    const nut_xac_nhan = document.getElementById('modal-confirm');
    const nut_huy_bo = document.getElementById('modal-cancel');
    
    if (!khung_hop_thoai || !the_tieu_de || !the_noi_dung || !nut_xac_nhan || !nut_huy_bo) {
        if (confirm(`${tieu_de}\n${noi_dung}`)) {
            if (typeof hanh_dong_xac_nhan === 'function') hanh_dong_xac_nhan();
        }
        return;
    }

    the_tieu_de.textContent = tieu_de;
    the_noi_dung.style.whiteSpace = 'pre-line';
    the_noi_dung.textContent = noi_dung;

    const bo_huy = new AbortController();
    const tin_hieu = bo_huy.signal;
    
    const dong_hop_thoai = () => {
        khung_hop_thoai.classList.remove('show');
        bo_huy.abort();
    };
    
    nut_xac_nhan.addEventListener('click', () => {
        dong_hop_thoai();
        if (typeof hanh_dong_xac_nhan === 'function') hanh_dong_xac_nhan();
    }, { signal: tin_hieu, once: true });

    nut_huy_bo.addEventListener('click', dong_hop_thoai, { signal: tin_hieu, once: true });
    
    khung_hop_thoai.addEventListener('click', (su_kien) => {
        if (su_kien.target === khung_hop_thoai) dong_hop_thoai();
    }, { signal: tin_hieu, once: true });
    
    khung_hop_thoai.classList.add('show');
}
