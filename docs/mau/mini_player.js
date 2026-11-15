/**
 * Trình phát thu nhỏ và xem ảnh bìa mẫu (phiên bản v0.4.1)
 */
(function () {
  function khoi_tao_trinh_phat_nho() {
    const trinh_phat = document.getElementById('stv-mini-player');
    const bong_bong = document.getElementById('stv-mini-bubble');
    if (!trinh_phat) return;

    const tay_nam_keo = document.getElementById('stv-mp-drag-handle');
    const cham_trang_thai = document.getElementById('stv-mp-dot');
    const nut_thu_nho = document.getElementById('stv-mp-minimize');
    const nut_che_do = document.getElementById('stv-mp-mode');
    const nut_phat = document.getElementById('stv-mp-playpause');
    const nut_truoc = document.getElementById('stv-mp-prev');
    const nut_sau = document.getElementById('stv-mp-next');
    const bieu_tuong_phat = document.getElementById('stv-mp-icon-play');
    const bieu_tuong_tam_dung = document.getElementById('stv-mp-icon-pause');
    const bieu_tuong_dang_tai = document.getElementById('stv-mp-icon-loading');
    const thanh_tien_trinh = document.getElementById('stv-mp-bar-fill');
    const chu_tien_trinh = document.getElementById('stv-mp-progress-txt');
    const the_huy_hieu_dong_co = document.getElementById('stv-mp-engine-badge');

    let che_do_mini_player = 'chapter';

    function cap_nhat_che_do() {
      if (!nut_che_do) return;
      const la_che_do_chuong = che_do_mini_player === 'chapter';
      nut_che_do.textContent = la_che_do_chuong ? 'CHƯƠNG' : 'ĐOẠN';
      nut_che_do.classList.toggle('stv-mp-mode-chapter', la_che_do_chuong);
      nut_che_do.classList.toggle('stv-mp-mode-chunk', !la_che_do_chuong);
    }

    cap_nhat_che_do();

    // Thu nhỏ và mở rộng trình phát
    if (nut_thu_nho && bong_bong) {
      nut_thu_nho.addEventListener('click', (su_kien) => {
        su_kien.stopPropagation();
        trinh_phat.classList.add('stv-mp-hidden');
        bong_bong.classList.remove('stv-mp-hidden');
      });

      bong_bong.addEventListener('click', () => {
        bong_bong.classList.add('stv-mp-hidden');
        trinh_phat.classList.remove('stv-mp-hidden');
      });
    }

    // Chuyển chế độ đọc (Chương / Đoạn)
    if (nut_che_do) {
      nut_che_do.addEventListener('click', (su_kien) => {
        su_kien.stopPropagation();
        che_do_mini_player = che_do_mini_player === 'chapter' ? 'chunk' : 'chapter';
        cap_nhat_che_do();
      });
    }

    // Điều khiển phát / tạm dừng
    if (nut_phat) {
      nut_phat.addEventListener('click', (su_kien) => {
        su_kien.stopPropagation();
        gui_tin_nhan_den_he_thong('daoTrangThaiPhat');
      });
    }

    // Chuyển chương hoặc đoạn sau/trước theo chế độ hiện tại
    if (nut_sau) {
      nut_sau.addEventListener('click', (su_kien) => {
        su_kien.stopPropagation();
        gui_tin_nhan_den_he_thong(che_do_mini_player === 'chapter' ? 'chuongTiep' : 'doanTiep');
      });
    }

    if (nut_truoc) {
      nut_truoc.addEventListener('click', (su_kien) => {
        su_kien.stopPropagation();
        gui_tin_nhan_den_he_thong(che_do_mini_player === 'chapter' ? 'chuongTruoc' : 'doanTruoc');
      });
    }

    // Kéo thả vị trí trình phát
    if (tay_nam_keo) {
      let dang_keo = false;
      let diem_bat_dau_x = 0;
      let diem_bat_dau_y = 0;
      let vi_tri_dau_trai = 0;
      let vi_tri_dau_tren = 0;

      tay_nam_keo.addEventListener('mousedown', (su_kien) => {
        if (su_kien.target.closest('#stv-mp-minimize')) return;
        dang_keo = true;
        diem_bat_dau_x = su_kien.clientX;
        diem_bat_dau_y = su_kien.clientY;
        const khung_chu = trinh_phat.getBoundingClientRect();
        vi_tri_dau_trai = khung_chu.left;
        vi_tri_dau_tren = khung_chu.top;
        trinh_phat.style.bottom = 'auto';
        trinh_phat.style.left = vi_tri_dau_trai + 'px';
        trinh_phat.style.top = vi_tri_dau_tren + 'px';
        trinh_phat.style.transition = 'none';
        document.body.style.userSelect = 'none';
      });

      window.addEventListener('mousemove', (su_kien) => {
        if (!dang_keo) return;
        const do_lech_x = su_kien.clientX - diem_bat_dau_x;
        const do_lech_y = su_kien.clientY - diem_bat_dau_y;
        const gioi_han_ngang = window.innerWidth - trinh_phat.offsetWidth - 10;
        const gioi_han_doc = window.innerHeight - trinh_phat.offsetHeight - 10;
        const toa_do_x_moi = Math.max(10, Math.min(gioi_han_ngang, vi_tri_dau_trai + do_lech_x));
        const toa_do_y_moi = Math.max(10, Math.min(gioi_han_doc, vi_tri_dau_tren + do_lech_y));
        trinh_phat.style.left = toa_do_x_moi + 'px';
        trinh_phat.style.top = toa_do_y_moi + 'px';
      });

      window.addEventListener('mouseup', () => {
        if (dang_keo) {
          dang_keo = false;
          trinh_phat.style.transition = '';
          document.body.style.userSelect = '';
        }
      });
    }

    // Bắt sự kiện chuyển chương từ liên kết bài viết
    document.addEventListener('click', (su_kien) => {
      const the_lien_ket = su_kien.target.closest('a[href]');
      if (!the_lien_ket) return;
      const duong_dan_lien_ket = the_lien_ket.getAttribute('href');
      if (duong_dan_lien_ket && duong_dan_lien_ket.includes('chuong-2.html')) {
        su_kien.preventDefault();
        gui_tin_nhan_den_he_thong('chuongTiep');
      } else if (duong_dan_lien_ket && duong_dan_lien_ket.includes('chuong-1.html')) {
        su_kien.preventDefault();
        gui_tin_nhan_den_he_thong('chuongTruoc');
      }
    }, true);

    // Đồng bộ trạng thái và sự kiện từ hệ thống
    window.addEventListener('message', (su_kien_nhan) => {
      if (!su_kien_nhan.data) return;
      if (su_kien_nhan.data.type === 'STV_PLAY_STATE_CHANGE' && su_kien_nhan.data.state) {
        cap_nhat_giao_dien(su_kien_nhan.data.state);
      }
      if (su_kien_nhan.data.type === 'STV_THEME_CHANGE' && su_kien_nhan.data.theme) {
        ap_dung_chu_de(su_kien_nhan.data.theme);
      }
      if (su_kien_nhan.data.type === 'STV_MOCK_MODAL_IMAGE') {
        hien_thi_modal_xem_anh(
          su_kien_nhan.data.duongDanAnh,
          su_kien_nhan.data.tenTruyen,
          su_kien_nhan.data.chuDe
        );
      }
    });

    function gui_tin_nhan_den_he_thong(hanh_dong) {
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'STV_MOCK_ACTION', action: hanh_dong }, '*');
        }
      } catch (_) {}
    }

    function ap_dung_chu_de(chu_de) {
      const chu_de_hop_le = chu_de === 'light' ? 'light' : 'dark';
      if (trinh_phat) trinh_phat.setAttribute('data-theme', chu_de_hop_le);
      if (bong_bong) bong_bong.setAttribute('data-theme', chu_de_hop_le);
      const khung_anh_hien_tai = document.getElementById('stv-image-lightbox');
      if (khung_anh_hien_tai) {
        khung_anh_hien_tai.setAttribute('data-theme', chu_de_hop_le);
      }
    }

    function cap_nhat_giao_dien(trang_thai) {
      const dang_tai = Boolean(trang_thai.isBuffering);
      const dang_phat_thuc_su = Boolean(trang_thai.isPlaying && !trang_thai.isPaused);
      const dang_tam_dung = Boolean(trang_thai.isPlaying && trang_thai.isPaused);

      if (bieu_tuong_phat && bieu_tuong_tam_dung) {
        if (dang_tai) {
          if (bieu_tuong_dang_tai) bieu_tuong_dang_tai.style.display = 'block';
          bieu_tuong_phat.style.display = 'none';
          bieu_tuong_tam_dung.style.display = 'none';
        } else {
          if (bieu_tuong_dang_tai) bieu_tuong_dang_tai.style.display = 'none';
          bieu_tuong_phat.style.display = dang_phat_thuc_su ? 'none' : 'block';
          bieu_tuong_tam_dung.style.display = dang_phat_thuc_su ? 'block' : 'none';
        }
      }

      if (cham_trang_thai) {
        cham_trang_thai.className = 'stv-mp-status-dot' + (dang_phat_thuc_su ? '' : (dang_tam_dung ? ' paused' : ' stopped'));
      }

      if (bong_bong) {
        bong_bong.classList.toggle('stv-playing', dang_phat_thuc_su);
      }

      const chi_so_hien_tai = trang_thai.progress ? Math.max(0, (trang_thai.progress.current || 1) - 1) : 0;
      if (nut_phat) {
        nut_phat.classList.remove('stv-mp-state-play', 'stv-mp-state-pause', 'stv-mp-state-resume');
        let lop_nut_phat = 'stv-mp-state-play';
        let nhan_nut_phat = 'Nghe';
        if (dang_tai || dang_phat_thuc_su) {
          lop_nut_phat = 'stv-mp-state-pause';
          nhan_nut_phat = 'Tạm dừng';
        } else if (dang_tam_dung || (!trang_thai.isPlaying && chi_so_hien_tai > 0)) {
          lop_nut_phat = 'stv-mp-state-resume';
          nhan_nut_phat = 'Tiếp tục';
        }
        nut_phat.classList.add(lop_nut_phat);
        nut_phat.title = nhan_nut_phat;
      }

      if (the_huy_hieu_dong_co) {
        const dong_co = (trang_thai.ttsEngine || trang_thai.engine || 'fpt').toUpperCase();
        the_huy_hieu_dong_co.textContent = dong_co;
      }

      if (trang_thai.progress && trang_thai.progress.total) {
        const phan_tram = Math.min(100, Math.round((trang_thai.progress.current / trang_thai.progress.total) * 100));
        if (thanh_tien_trinh) thanh_tien_trinh.style.width = phan_tram + '%';
        if (chu_tien_trinh) chu_tien_trinh.textContent = `${trang_thai.progress.current}/${trang_thai.progress.total}`;

        const chi_so_doan = trang_thai.progress.current;
        document.querySelectorAll('.tts-reading').forEach(phan_tu => phan_tu.classList.remove('tts-reading'));
        const the_muc_tieu = document.getElementById('tts-c-' + (chi_so_doan + 1)) || document.getElementById('tts-c-' + chi_so_doan);
        if (the_muc_tieu) {
          the_muc_tieu.classList.add('tts-reading');
          if (dang_phat_thuc_su) {
            the_muc_tieu.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      }
    }

    // Hộp thoại xem ảnh bìa truyện (Lightbox)
    function hien_thi_modal_xem_anh(duong_dan_anh, ten_truyen, chu_de) {
      if (!duong_dan_anh || duong_dan_anh.includes('icon128.png')) return;

      let url_anh_an_toan = '';
      try {
        const url_phan_tich = new URL(duong_dan_anh, window.location.origin);
        if (url_phan_tich.protocol !== 'https:' && url_phan_tich.protocol !== 'http:') return;
        url_anh_an_toan = url_phan_tich.href;
      } catch (_) {
        return;
      }

      const cu = document.getElementById('stv-image-lightbox');
      if (cu) cu.remove();

      const chu_de_hien_tai = chu_de === 'light' || chu_de === 'dark'
        ? chu_de
        : (trinh_phat.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

      const overlay = document.createElement('div');
      overlay.id = 'stv-image-lightbox';
      overlay.setAttribute('data-theme', chu_de_hien_tai);

      const dialog = document.createElement('div');
      dialog.className = 'stv-lb-dialog';

      const tieu_de_an_toan = (ten_truyen || 'Ảnh bìa truyện').trim();

      const header = document.createElement('div');
      header.className = 'stv-lb-header';

      const the_tieu_de = document.createElement('div');
      the_tieu_de.className = 'stv-lb-title';
      the_tieu_de.innerHTML = `
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
          <circle cx="9" cy="9" r="2"/>
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
        </svg>
      `;
      const the_chu_tieu_de = document.createElement('span');
      the_chu_tieu_de.style.overflow = 'hidden';
      the_chu_tieu_de.style.textOverflow = 'ellipsis';
      the_chu_tieu_de.textContent = tieu_de_an_toan;
      the_tieu_de.appendChild(the_chu_tieu_de);
      header.appendChild(the_tieu_de);

      const nut_dong = document.createElement('button');
      nut_dong.type = 'button';
      nut_dong.className = 'stv-lb-close';
      nut_dong.title = 'Đóng (ESC)';
      nut_dong.setAttribute('aria-label', 'Đóng ảnh bìa');
      nut_dong.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><g class="stv-lb-close-x"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></g></svg>';
      header.appendChild(nut_dong);
      dialog.appendChild(header);

      const body = document.createElement('div');
      body.className = 'stv-lb-body';

      const img = document.createElement('img');
      img.className = 'stv-lb-img';
      const danh_dau_da_tai = () => img.classList.add('da-tai');
      img.addEventListener('load', danh_dau_da_tai, { once: true });
      img.addEventListener('error', danh_dau_da_tai, { once: true });
      img.alt = tieu_de_an_toan;
      img.referrerPolicy = 'no-referrer';
      img.src = url_anh_an_toan;
      if (img.complete) danh_dau_da_tai();
      body.appendChild(img);
      dialog.appendChild(body);

      const footer = document.createElement('div');
      footer.className = 'stv-lb-footer';

      const nut_mo_tab = document.createElement('a');
      nut_mo_tab.className = 'stv-lb-btn-tab';
      nut_mo_tab.href = url_anh_an_toan;
      nut_mo_tab.target = '_blank';
      nut_mo_tab.rel = 'noopener noreferrer';
      nut_mo_tab.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        Mở tab mới
      `;
      footer.appendChild(nut_mo_tab);

      const nut_tai_ve = document.createElement('button');
      nut_tai_ve.type = 'button';
      nut_tai_ve.className = 'stv-lb-btn-dl';
      nut_tai_ve.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Tải ảnh về
      `;

      nut_tai_ve.addEventListener('click', async (e) => {
        e.stopPropagation();
        const bieu_tuong_goc = nut_tai_ve.innerHTML;
        nut_tai_ve.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="animation: stv-spin 1s linear infinite;">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Đang tải...
        `;
        try {
          const res = await fetch(url_anh_an_toan);
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = tieu_de_an_toan.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60) + '.jpg';
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);

          nut_tai_ve.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Đã lưu ảnh!
          `;
          setTimeout(() => { nut_tai_ve.innerHTML = bieu_tuong_goc; }, 2000);
        } catch (_) {
          const a = document.createElement('a');
          a.href = url_anh_an_toan;
          a.download = tieu_de_an_toan.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60) + '.jpg';
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          a.remove();
          nut_tai_ve.innerHTML = bieu_tuong_goc;
        }
      });

      footer.appendChild(nut_tai_ve);
      dialog.appendChild(footer);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        dialog.style.transform = 'scale(1)';
      });

      function dong_hop_thoai() {
        overlay.style.opacity = '0';
        dialog.style.transform = 'scale(0.95)';
        setTimeout(() => {
          overlay.remove();
          document.removeEventListener('keydown', xu_ly_phim);
        }, 200);
      }

      function xu_ly_phim(e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          dong_hop_thoai();
        }
      }
      document.addEventListener('keydown', xu_ly_phim);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) dong_hop_thoai();
      });
      nut_dong.addEventListener('click', dong_hop_thoai);
    }

    try {
      if (window.parent && window.parent.__trang_thai_stv_dung_chung) {
        cap_nhat_giao_dien(window.parent.__trang_thai_stv_dung_chung);
      } else if (window.parent && window.parent.__stvSharedState) {
        cap_nhat_giao_dien(window.parent.__stvSharedState);
      }
      if (window.parent && window.parent.__chu_de_hien_tai) {
        ap_dung_chu_de(window.parent.__chu_de_hien_tai);
      }
    } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', khoi_tao_trinh_phat_nho);
  } else {
    khoi_tao_trinh_phat_nho();
  }
})();
