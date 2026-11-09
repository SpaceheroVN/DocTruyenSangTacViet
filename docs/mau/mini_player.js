/**
 * Trình phát thu nhỏ và xem ảnh bìa mẫu
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
    const thanh_tien_trinh = document.getElementById('stv-mp-bar-fill');
    const chu_tien_trinh = document.getElementById('stv-mp-progress-txt');
    const the_huy_hieu_dong_co = document.getElementById('stv-mp-engine-badge');

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

    // Chuyển chế độ đọc
    if (nut_che_do) {
      nut_che_do.addEventListener('click', (su_kien) => {
        su_kien.stopPropagation();
        const che_do_hien_tai = nut_che_do.textContent.trim();
        nut_che_do.style.transform = 'scale(0.92)';
        setTimeout(() => { nut_che_do.style.transform = ''; }, 150);
        nut_che_do.textContent = che_do_hien_tai === 'CHƯƠNG' ? 'ĐOẠN' : 'CHƯƠNG';
      });
    }

    // Điều khiển phát / tạm dừng
    if (nut_phat) {
      nut_phat.addEventListener('click', (su_kien) => {
        su_kien.stopPropagation();
        nut_phat.style.transform = 'scale(0.92)';
        setTimeout(() => { nut_phat.style.transform = ''; }, 150);
        gui_tin_nhan_den_he_thong('daoTrangThaiPhat');
      });
    }

    // Chuyển chương sau và chương trước
    if (nut_sau) {
      nut_sau.addEventListener('click', (su_kien) => {
        su_kien.stopPropagation();
        gui_tin_nhan_den_he_thong('chuongTiep');
      });
    }

    if (nut_truoc) {
      nut_truoc.addEventListener('click', (su_kien) => {
        su_kien.stopPropagation();
        gui_tin_nhan_den_he_thong('chuongTruoc');
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

    function ap_dung_chu_de_modal_anh(khung_mo_mo, chu_de) {
      if (!khung_mo_mo) return;
      const la_chu_de_sang = chu_de === 'light';
      khung_mo_mo.setAttribute('data-theme', chu_de);

      const cac_phan_tu = khung_mo_mo._cac_phan_tu;
      if (!cac_phan_tu) return;

      khung_mo_mo.style.background = la_chu_de_sang ? 'rgba(18, 14, 28, 0.65)' : 'rgba(8, 7, 14, 0.82)';

      if (cac_phan_tu.hop_thoai) {
        cac_phan_tu.hop_thoai.style.background = la_chu_de_sang ? 'linear-gradient(145deg, #ffffff 0%, #f6f5fb 100%)' : 'linear-gradient(145deg, #181528 0%, #100e1c 100%)';
        cac_phan_tu.hop_thoai.style.color = la_chu_de_sang ? '#1e1b2e' : '#f0edf7';
        cac_phan_tu.hop_thoai.style.border = la_chu_de_sang ? '1.5px solid rgba(234, 88, 12, 0.35)' : '1.5px solid rgba(232, 160, 69, 0.35)';
        cac_phan_tu.hop_thoai.style.boxShadow = la_chu_de_sang ? '0 28px 75px rgba(24, 21, 40, 0.28), 0 0 0 1px rgba(234, 88, 12, 0.2), 0 0 30px rgba(234, 88, 12, 0.15)' : '0 28px 75px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(232, 160, 69, 0.25), 0 0 35px rgba(232, 160, 69, 0.2)';
      }

      if (cac_phan_tu.phan_dau) {
        cac_phan_tu.phan_dau.style.background = la_chu_de_sang ? 'rgba(234, 88, 12, 0.04)' : 'rgba(232, 160, 69, 0.04)';
        cac_phan_tu.phan_dau.style.borderBottom = la_chu_de_sang ? '1px solid rgba(24, 21, 40, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)';
      }

      if (cac_phan_tu.the_tieu_de) {
        cac_phan_tu.the_tieu_de.style.color = la_chu_de_sang ? '#181528' : '#ffffff';
        const bieu_tuong_anh = cac_phan_tu.the_tieu_de.querySelector('svg');
        if (bieu_tuong_anh) bieu_tuong_anh.setAttribute('stroke', la_chu_de_sang ? '#ea580c' : '#e8a045');
      }

      if (cac_phan_tu.nut_dong) {
        cac_phan_tu.nut_dong.style.background = la_chu_de_sang ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)';
        cac_phan_tu.nut_dong.style.borderColor = la_chu_de_sang ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)';
        cac_phan_tu.nut_dong.style.color = la_chu_de_sang ? '#5a566f' : '#a09cb0';
      }

      if (cac_phan_tu.phan_than) {
        cac_phan_tu.phan_than.style.background = la_chu_de_sang ? '#ece8f5' : 'rgba(0, 0, 0, 0.45)';
      }

      if (cac_phan_tu.the_anh) {
        cac_phan_tu.the_anh.style.boxShadow = la_chu_de_sang ? '0 10px 32px rgba(24, 21, 40, 0.22)' : '0 10px 38px rgba(0, 0, 0, 0.7)';
        cac_phan_tu.the_anh.style.borderColor = la_chu_de_sang ? 'rgba(234, 88, 12, 0.2)' : 'rgba(255, 255, 255, 0.1)';
      }

      if (cac_phan_tu.phan_chan) {
        cac_phan_tu.phan_chan.style.background = la_chu_de_sang ? '#fdfcff' : '#12101e';
        cac_phan_tu.phan_chan.style.borderTop = la_chu_de_sang ? '1px solid rgba(24, 21, 40, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)';
      }

      if (cac_phan_tu.nut_mo_tab) {
        cac_phan_tu.nut_mo_tab.style.background = la_chu_de_sang ? '#ffffff' : 'rgba(255, 255, 255, 0.07)';
        cac_phan_tu.nut_mo_tab.style.color = la_chu_de_sang ? '#2e2a42' : '#d0cce0';
        cac_phan_tu.nut_mo_tab.style.border = la_chu_de_sang ? '1.5px solid #d8d3e6' : '1.5px solid rgba(255, 255, 255, 0.14)';
        cac_phan_tu.nut_mo_tab.style.boxShadow = la_chu_de_sang ? '0 2px 6px rgba(0,0,0,0.05)' : 'none';
      }

      if (cac_phan_tu.nut_tai_ve) {
        cac_phan_tu.nut_tai_ve.style.background = la_chu_de_sang ? 'linear-gradient(135deg, #ea580c 0%, #db2777 100%)' : 'linear-gradient(135deg, #e8a045 0%, #c45c8a 100%)';
        cac_phan_tu.nut_tai_ve.style.boxShadow = la_chu_de_sang ? '0 4px 16px rgba(234, 88, 12, 0.42)' : '0 4px 16px rgba(232, 160, 69, 0.45)';
      }
    }

    function ap_dung_chu_de(chu_de) {
      const chu_de_hop_le = chu_de === 'light' ? 'light' : 'dark';
      if (trinh_phat) trinh_phat.setAttribute('data-theme', chu_de_hop_le);
      if (bong_bong) bong_bong.setAttribute('data-theme', chu_de_hop_le);
      const khung_anh_hien_tai = document.getElementById('stv-image-lightbox');
      if (khung_anh_hien_tai) {
        ap_dung_chu_de_modal_anh(khung_anh_hien_tai, chu_de_hop_le);
      }
    }

    function cap_nhat_giao_dien(trang_thai) {
      const dang_phat = Boolean(trang_thai.isPlaying && !trang_thai.isPaused);
      const dang_tam_dung = Boolean(trang_thai.isPlaying && trang_thai.isPaused);

      if (bieu_tuong_phat && bieu_tuong_tam_dung) {
        bieu_tuong_phat.style.display = dang_phat ? 'none' : 'block';
        bieu_tuong_tam_dung.style.display = dang_phat ? 'block' : 'none';
      }

      if (cham_trang_thai) {
        cham_trang_thai.className = 'stv-mp-status-dot' + (dang_phat ? '' : (dang_tam_dung ? ' paused' : ' stopped'));
      }

      if (bong_bong) {
        bong_bong.classList.toggle('stv-playing', dang_phat);
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
          if (dang_phat) {
            the_muc_tieu.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      }
    }

    // Hộp thoại xem ảnh bìa truyện (Lightbox)
    function hien_thi_modal_xem_anh(duong_dan_anh, ten_truyen, chu_de) {
      if (!duong_dan_anh || duong_dan_anh.includes('icon128.png')) return;

      const cu = document.getElementById('stv-image-lightbox');
      if (cu) cu.remove();

      const la_chu_de_sang = chu_de === 'light' || (!chu_de && trinh_phat.getAttribute('data-theme') === 'light');

      const khung_mo_mo = document.createElement('div');
      khung_mo_mo.id = 'stv-image-lightbox';
      khung_mo_mo.style.cssText = `
        position: fixed; inset: 0; z-index: 2147483647;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        display: flex; align-items: center; justify-content: center;
        padding: 24px; box-sizing: border-box;
        opacity: 0; transition: opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1), background 0.24s ease;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      `;

      const hop_thoai = document.createElement('div');
      hop_thoai.style.cssText = `
        border-radius: 16px;
        max-width: 92vw;
        max-height: 92vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: scale(0.92) translateY(10px);
        transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), background 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease, color 0.24s ease;
      `;

      const tieu_de_an_toan = (ten_truyen || 'Ảnh bìa truyện').trim();

      const phan_dau = document.createElement('div');
      phan_dau.style.cssText = `
        padding: 13px 20px;
        display: flex; align-items: center; justify-content: space-between;
        gap: 16px;
        transition: background 0.24s ease, border-color 0.24s ease;
      `;

      const the_tieu_de = document.createElement('div');
      the_tieu_de.style.cssText = `
        font-size: 15px; font-weight: 700;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        display: flex; align-items: center; gap: 8px;
        transition: color 0.24s ease;
      `;
      the_tieu_de.innerHTML = `
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
          <circle cx="9" cy="9" r="2"/>
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
        </svg>
        <span style="overflow: hidden; text-overflow: ellipsis;">${tieu_de_an_toan}</span>
      `;
      phan_dau.appendChild(the_tieu_de);

      const nut_dong = document.createElement('button');
      nut_dong.title = 'Đóng (ESC)';
      nut_dong.style.cssText = `
        width: 30px; height: 30px; border-radius: 8px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s ease; flex-shrink: 0;
      `;
      nut_dong.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      nut_dong.onmouseenter = () => {
        const la_sang = khung_mo_mo.getAttribute('data-theme') === 'light';
        nut_dong.style.background = la_sang ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.14)';
        nut_dong.style.color = la_sang ? '#181528' : '#ffffff';
      };
      nut_dong.onmouseleave = () => {
        const la_sang = khung_mo_mo.getAttribute('data-theme') === 'light';
        nut_dong.style.background = la_sang ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)';
        nut_dong.style.color = la_sang ? '#5a566f' : '#a09cb0';
      };
      nut_dong.onclick = () => dong_hop_thoai();
      phan_dau.appendChild(nut_dong);
      hop_thoai.appendChild(phan_dau);

      const phan_than = document.createElement('div');
      phan_than.style.cssText = `
        padding: 20px;
        display: flex; align-items: center; justify-content: center;
        overflow: auto; flex: 1; min-height: 200px;
        transition: background 0.24s ease;
      `;

      const the_anh = document.createElement('img');
      the_anh.src = duong_dan_anh;
      the_anh.alt = tieu_de_an_toan;
      the_anh.referrerPolicy = 'no-referrer';
      the_anh.style.cssText = `
        max-height: calc(85vh - 140px);
        max-width: 100%;
        object-fit: contain;
        display: block;
        border-radius: 10px;
        transition: box-shadow 0.24s ease, border-color 0.24s ease;
      `;
      phan_than.appendChild(the_anh);
      hop_thoai.appendChild(phan_than);

      const phan_chan = document.createElement('div');
      phan_chan.style.cssText = `
        padding: 14px 20px;
        display: flex; align-items: center; justify-content: flex-end;
        gap: 12px;
        transition: background 0.24s ease, border-color 0.24s ease;
      `;

      const nut_mo_tab = document.createElement('a');
      nut_mo_tab.href = duong_dan_anh;
      nut_mo_tab.target = '_blank';
      nut_mo_tab.rel = 'noopener noreferrer';
      nut_mo_tab.style.cssText = `
        display: inline-flex; align-items: center; gap: 7px;
        padding: 9px 16px; border-radius: 9px;
        font-size: 13px; font-weight: 600;
        text-decoration: none; cursor: pointer; transition: all 0.2s ease;
      `;
      nut_mo_tab.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        Mở tab mới
      `;
      nut_mo_tab.onmouseenter = () => {
        const la_sang = khung_mo_mo.getAttribute('data-theme') === 'light';
        nut_mo_tab.style.background = la_sang ? '#f5f3fa' : 'rgba(255, 255, 255, 0.12)';
        nut_mo_tab.style.borderColor = la_sang ? '#ea580c' : 'rgba(232, 160, 69, 0.4)';
        nut_mo_tab.style.color = la_sang ? '#ea580c' : '#ffffff';
      };
      nut_mo_tab.onmouseleave = () => {
        const la_sang = khung_mo_mo.getAttribute('data-theme') === 'light';
        nut_mo_tab.style.background = la_sang ? '#ffffff' : 'rgba(255, 255, 255, 0.07)';
        nut_mo_tab.style.borderColor = la_sang ? '#d8d3e6' : 'rgba(255, 255, 255, 0.14)';
        nut_mo_tab.style.color = la_sang ? '#2e2a42' : '#d0cce0';
      };
      phan_chan.appendChild(nut_mo_tab);

      const nut_tai_ve = document.createElement('button');
      nut_tai_ve.style.cssText = `
        display: inline-flex; align-items: center; gap: 8px;
        padding: 9px 20px; border-radius: 9px;
        font-size: 13px; font-weight: 700;
        border: none; cursor: pointer;
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      `;
      nut_tai_ve.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Tải ảnh về
      `;
      nut_tai_ve.onmouseenter = () => {
        nut_tai_ve.style.transform = 'translateY(-1.5px)';
        nut_tai_ve.style.filter = 'brightness(1.08)';
      };
      nut_tai_ve.onmouseleave = () => {
        nut_tai_ve.style.transform = 'translateY(0)';
        nut_tai_ve.style.filter = 'none';
      };
      nut_tai_ve.onclick = () => {
        const the_tai = document.createElement('a');
        the_tai.href = duong_dan_anh;
        the_tai.target = '_blank';
        the_tai.download = tieu_de_an_toan.replace(/[\\/:*?"<>|]/g, '_') + '.jpg';
        document.body.appendChild(the_tai);
        the_tai.click();
        the_tai.remove();
      };
      phan_chan.appendChild(nut_tai_ve);

      hop_thoai.appendChild(phan_chan);
      khung_mo_mo.appendChild(hop_thoai);

      khung_mo_mo._cac_phan_tu = {
        hop_thoai,
        phan_dau,
        the_tieu_de,
        nut_dong,
        phan_than,
        the_anh,
        phan_chan,
        nut_mo_tab,
        nut_tai_ve
      };
      ap_dung_chu_de_modal_anh(khung_mo_mo, la_chu_de_sang ? 'light' : 'dark');

      document.body.appendChild(khung_mo_mo);

      requestAnimationFrame(() => {
        khung_mo_mo.style.opacity = '1';
        hop_thoai.style.transform = 'scale(1)';
      });

      function dong_hop_thoai() {
        khung_mo_mo.style.opacity = '0';
        hop_thoai.style.transform = 'scale(0.95)';
        setTimeout(() => {
          khung_mo_mo._cac_phan_tu = null;
          khung_mo_mo.remove();
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
      khung_mo_mo.addEventListener('click', (e) => {
        if (e.target === khung_mo_mo) dong_hop_thoai();
      });
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
