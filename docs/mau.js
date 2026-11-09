function lay_la_chuong_2() {
  try {
    return window.parent.demoCurrentChapter === 2 || window.parent.chuong_hien_tai_mau === 2;
  } catch (_) {
    return false;
  }
}

function lay_trang_thai_cha() {
  let doi_tuong_dich = window;
  try {
    if (window.parent && window.parent !== window) {
      doi_tuong_dich = window.parent;
    }
  } catch (_) {}

  if (!doi_tuong_dich.__trang_thai_stv_dung_chung) {
    doi_tuong_dich.__trang_thai_stv_dung_chung = {
      isPlaying: false,
      isPaused: false,
      isBuffering: false,
      elapsed: 0,
      progress: { current: 1, total: 148 },
      engine: 'fpt',
      ttsEngine: 'fpt',
      dinh_thoi_id: null
    };
    doi_tuong_dich.__stvSharedState = doi_tuong_dich.__trang_thai_stv_dung_chung;
  }
  return doi_tuong_dich.__trang_thai_stv_dung_chung;
}

const danh_sach_lang_nghe_tin_nhan = [];
const danh_sach_lang_nghe_luu_tru = [];

function phat_tin_hieu_thay_doi(trang_thai) {
  if (trang_thai) {
    trang_thai.engine = trang_thai.engine || 'fpt';
    trang_thai.ttsEngine = trang_thai.ttsEngine || 'fpt';
  }
  const tin_nhan = {
    hanhDong: 'thayDoiTrangThai',
    action: 'statusChanged',
    trangThai: trang_thai
  };
  danh_sach_lang_nghe_tin_nhan.forEach(ham_xu_ly => {
    try { ham_xu_ly(tin_nhan, { id: 'mock-sender' }, () => {}); } catch (_) {}
  });

  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'STV_PLAY_STATE_CHANGE', state: trang_thai }, '*');
    }
  } catch (_) {}
}

function bat_dau_dem_thoi_gian() {
  const trang_thai = lay_trang_thai_cha();
  if (trang_thai.dinh_thoi_id) clearInterval(trang_thai.dinh_thoi_id);
  trang_thai.dinh_thoi_id = setInterval(() => {
    if (trang_thai.isPlaying && !trang_thai.isPaused) {
      trang_thai.elapsed++;
      if (trang_thai.progress.current < trang_thai.progress.total) {
        trang_thai.progress.current++;
      }
      phat_tin_hieu_thay_doi({
        isPlaying: trang_thai.isPlaying,
        isPaused: trang_thai.isPaused,
        isBuffering: false,
        elapsed: trang_thai.elapsed,
        progress: trang_thai.progress
      });
    }
  }, 1000);
}

function lay_thong_tin_mau() {
  const la_chuong_2 = lay_la_chuong_2();
  const trang_thai = lay_trang_thai_cha();
  const duong_dan_chuong = la_chuong_2
    ? "https://sangtacviet.com/truyen/fanqie/1/7578918840482942014/7578919302108037694/"
    : "https://sangtacviet.com/truyen/fanqie/1/7578918840482942014/7578918873747964478/";
  return {
    voices: [
      { name: "Ban Mai (Nữ miền Bắc)", value: "0", index: 0, engine: "fpt" },
      { name: "Lê Minh (Nam miền Bắc)", value: "1", index: 1, engine: "fpt" },
      { name: "Thu Minh (Nữ miền Bắc)", value: "2", index: 2, engine: "fpt" },
      { name: "Microsoft Hoài My (Azure)", value: "vi-VN-HoaiMyNeural", index: 3, engine: "azure" },
      { name: "Google Tiếng Việt", value: "vietnamese", index: 4, engine: "web" }
    ],
    isPlaying: trang_thai.isPlaying,
    isPaused: trang_thai.isPaused,
    isBuffering: trang_thai.isBuffering,
    bookTitle: "Bắt đầu vô hạn phân thân, một mình ta vây quanh toàn tông môn",
    chapTitle: la_chuong_2
      ? "Thứ 2 chương Áo lót đại quân, mỗi người giữ đúng vị trí của mình"
      : "Thứ 1 chương Khắc kim cải mệnh, cỗ thứ nhất phân thân",
    imgUrl: "https://p6-novel.byteimg.com/novel-pic/7a4843d945562c7de76f4104e5fde2b1~tplv-shrink:640:0.image",
    pageUrl: duong_dan_chuong,
    ttsEngine: "fpt",
    engine: "fpt",
    elapsed: trang_thai.elapsed,
    coDocDo: false,
    progress: trang_thai.progress,
    stats: {
      read: "32.5k",
      like: "1.2k",
      status: "Còn tiếp"
    }
  };
}

function xu_ly_tin_nhan(tin_nhan, ham_goi) {
  const ham_thuc_hien = (phan_hoi_lai) => {
    setTimeout(() => {
      const thong_tin = lay_thong_tin_mau();
      const trang_thai = lay_trang_thai_cha();
      const hanh_dong = typeof tin_nhan === 'string' ? tin_nhan : (tin_nhan.action || tin_nhan.hanhDong || '');

      if (hanh_dong === 'getVoices' || hanh_dong === 'layGiongDoc') {
        phan_hoi_lai({ voices: thong_tin.voices });
      } else if (hanh_dong === 'getStatus' || hanh_dong === 'getInfo' || hanh_dong === 'layThongTin') {
        phan_hoi_lai(thong_tin);
      } else if (hanh_dong === 'daoTrangThaiPhat' || hanh_dong === 'toggle' || hanh_dong === 'togglePlay' || hanh_dong === 'playPause') {
        const thoi_gian_hien_tai = Date.now();
        if (trang_thai._thoi_gian_doi_cuoi && (thoi_gian_hien_tai - trang_thai._thoi_gian_doi_cuoi) < 250) {
          phan_hoi_lai({ success: true, isPlaying: trang_thai.isPlaying, isPaused: trang_thai.isPaused });
          return;
        }
        trang_thai._thoi_gian_doi_cuoi = thoi_gian_hien_tai;

        if (!trang_thai.isPlaying) {
          trang_thai.isPlaying = true;
          trang_thai.isPaused = false;
          bat_dau_dem_thoi_gian();
        } else if (!trang_thai.isPaused) {
          trang_thai.isPaused = true;
        } else {
          trang_thai.isPaused = false;
        }
        phat_tin_hieu_thay_doi({
          isPlaying: trang_thai.isPlaying,
          isPaused: trang_thai.isPaused,
          isBuffering: false,
          elapsed: trang_thai.elapsed,
          progress: trang_thai.progress
        });
        phan_hoi_lai({ success: true, isPlaying: trang_thai.isPlaying, isPaused: trang_thai.isPaused });
      } else if (hanh_dong === 'moModalXemAnh') {
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'STV_MOCK_MODAL_IMAGE',
              duongDanAnh: tin_nhan.duongDanAnh,
              tenTruyen: tin_nhan.tenTruyen,
              chuDe: tin_nhan.chuDe
            }, '*');
          }
        } catch (_) {}
        phan_hoi_lai({ success: true });
      } else if (hanh_dong === 'dungPhat' || hanh_dong === 'stop' || hanh_dong === 'stopPlay') {
        trang_thai.isPlaying = false;
        trang_thai.isPaused = false;
        trang_thai.elapsed = 0;
        trang_thai.progress.current = 1;
        phat_tin_hieu_thay_doi({
          isPlaying: false,
          isPaused: false,
          isBuffering: false,
          elapsed: 0,
          progress: trang_thai.progress
        });
        phan_hoi_lai({ success: true });
      } else if (hanh_dong === 'chuongTiep' || hanh_dong === 'next' || hanh_dong === 'nextChap') {
        trang_thai.elapsed = 0;
        trang_thai.progress.current = 1;
        try {
          if (window.parent && typeof window.parent.setDemoChapter === 'function') {
            window.parent.setDemoChapter(2);
          } else if (window.parent && typeof window.parent.dat_chuong_mau === 'function') {
            window.parent.dat_chuong_mau(2);
          }
        } catch (_) {}
        phat_tin_hieu_thay_doi({
          isPlaying: trang_thai.isPlaying,
          isPaused: trang_thai.isPaused,
          isBuffering: false,
          elapsed: 0,
          progress: trang_thai.progress
        });
        phan_hoi_lai({ success: true });
      } else if (hanh_dong === 'chuongTruoc' || hanh_dong === 'prev' || hanh_dong === 'prevChap') {
        trang_thai.elapsed = 0;
        trang_thai.progress.current = 1;
        try {
          if (window.parent && typeof window.parent.setDemoChapter === 'function') {
            window.parent.setDemoChapter(1);
          } else if (window.parent && typeof window.parent.dat_chuong_mau === 'function') {
            window.parent.dat_chuong_mau(1);
          }
        } catch (_) {}
        phat_tin_hieu_thay_doi({
          isPlaying: trang_thai.isPlaying,
          isPaused: trang_thai.isPaused,
          isBuffering: false,
          elapsed: 0,
          progress: trang_thai.progress
        });
        phan_hoi_lai({ success: true });
      } else if (hanh_dong === 'nextChunk') {
        if (trang_thai.progress.current < trang_thai.progress.total) trang_thai.progress.current++;
        phat_tin_hieu_thay_doi({
          isPlaying: trang_thai.isPlaying,
          isPaused: trang_thai.isPaused,
          isBuffering: false,
          elapsed: trang_thai.elapsed,
          progress: trang_thai.progress
        });
        phan_hoi_lai({ success: true, progress: trang_thai.progress });
      } else if (hanh_dong === 'prevChunk') {
        if (trang_thai.progress.current > 1) trang_thai.progress.current--;
        phat_tin_hieu_thay_doi({
          isPlaying: trang_thai.isPlaying,
          isPaused: trang_thai.isPaused,
          isBuffering: false,
          elapsed: trang_thai.elapsed,
          progress: trang_thai.progress
        });
        phan_hoi_lai({ success: true, progress: trang_thai.progress });
      } else if (hanh_dong === 'phatLai' || hanh_dong === 'replay' || hanh_dong === 'replayChap') {
        trang_thai.elapsed = 0;
        trang_thai.progress.current = 1;
        trang_thai.isPlaying = true;
        trang_thai.isPaused = false;
        bat_dau_dem_thoi_gian();
        phat_tin_hieu_thay_doi({
          isPlaying: true,
          isPaused: false,
          isBuffering: false,
          elapsed: 0,
          progress: trang_thai.progress
        });
        phan_hoi_lai({ success: true });
      } else {
        phan_hoi_lai({ success: true });
      }
    }, 10);
  };

  if (typeof ham_goi === 'function') { ham_thuc_hien(ham_goi); return true; }
  return new Promise(giai_quyet => ham_thuc_hien(giai_quyet));
}

// Đồng bộ lệnh từ trang truyện mẫu
window.addEventListener('message', (su_kien_nhan) => {
  if (!su_kien_nhan.data) return;
  if (su_kien_nhan.data.type === 'STV_MOCK_ACTION') {
    xu_ly_tin_nhan({ hanhDong: su_kien_nhan.data.action }, () => {});
  }
});

if (!navigator.locks) {
  navigator.locks = {
    request: (ten, ham_goi) => ham_goi()
  };
}

if (typeof window.chrome === 'undefined' || !window.chrome.__isEdgeMock) {
  window.chrome = {
    __isEdgeMock: true,

    runtime: {
      id: 'mock-dtstv-extension-id',
      getManifest: () => {
        try {
          const phien_ban = window.parent && (window.parent.__phien_ban_xem_truoc || window.parent.__previewVersion);
          if (phien_ban) return { version: phien_ban.replace('v', '') };
        } catch (_) {}
        return { version: "0.4.1" };
      },
      getPlatformInfo: () => Promise.resolve({ os: 'win', arch: 'x86-64' }),
      onInstalled: { addListener: () => {} },
      onStartup: { addListener: () => {} },
      onMessage: {
        addListener: (ham_xu_ly) => {
          if (typeof ham_xu_ly === 'function' && !danh_sach_lang_nghe_tin_nhan.includes(ham_xu_ly)) {
            danh_sach_lang_nghe_tin_nhan.push(ham_xu_ly);
          }
        },
        removeListener: (ham_xu_ly) => {
          const vi_tri = danh_sach_lang_nghe_tin_nhan.indexOf(ham_xu_ly);
          if (vi_tri >= 0) danh_sach_lang_nghe_tin_nhan.splice(vi_tri, 1);
        }
      },
      sendMessage: (tin_nhan, ham_goi) => {
        danh_sach_lang_nghe_tin_nhan.forEach(ham_xu_ly => {
          try { ham_xu_ly(tin_nhan, { id: 'mock-runtime' }, () => {}); } catch (_) {}
        });
        return xu_ly_tin_nhan(tin_nhan, ham_goi);
      },
      lastError: null
    },

    tabs: {
      onRemoved: { addListener: () => {} },
      onUpdated: { addListener: () => {} },
      query: (tuy_chinh, ham_goi) => {
        const la_chuong_2 = lay_la_chuong_2();
        const duong_dan_chuong = la_chuong_2
          ? "https://sangtacviet.com/truyen/fanqie/1/7578918840482942014/7578919302108037694/"
          : "https://sangtacviet.com/truyen/fanqie/1/7578918840482942014/7578918873747964478/";
        const tab_gia = {
          id: 1,
          url: duong_dan_chuong,
          title: "Bắt đầu vô hạn phân thân, một mình ta vây quanh toàn tông môn",
          active: true
        };
        if (typeof ham_goi === 'function') { ham_goi([tab_gia]); return; }
        return Promise.resolve([tab_gia]);
      },

      sendMessage: (id_tab, tin_nhan, ham_goi) => xu_ly_tin_nhan(tin_nhan, ham_goi),
      create: (doi_tuong) => {
        try { window.open(doi_tuong.url, '_blank'); } catch (_) {}
      }
    },

    storage: {
      onChanged: {
        addListener: (ham_xu_ly) => {
          if (typeof ham_xu_ly === 'function' && !danh_sach_lang_nghe_luu_tru.includes(ham_xu_ly)) {
            danh_sach_lang_nghe_luu_tru.push(ham_xu_ly);
          }
        },
        removeListener: (ham_xu_ly) => {
          const vi_tri = danh_sach_lang_nghe_luu_tru.indexOf(ham_xu_ly);
          if (vi_tri >= 0) danh_sach_lang_nghe_luu_tru.splice(vi_tri, 1);
        }
      },

      local: tao_mock_storage({
        readingList: [{
          title: "Bắt đầu vô hạn phân thân, một mình ta vây quanh toàn tông môn",
          chap: "Thứ 1 chương Khắc kim cải mệnh...",
          url: "https://sangtacviet.com/truyen/fanqie/1/7578918840482942014/7578918873747964478/",
          imgUrl: "https://p6-novel.byteimg.com/novel-pic/7a4843d945562c7de76f4104e5fde2b1~tplv-shrink:640:0.image",
          savedAt: "15/05/2026"
        }],
        customEngines: [
          { id: "fpt", name: "FPT.AI TTS", type: "fpt", key: "mock_fpt_api_key" }
        ],
        speed: 1.2,
        volume: 0.8,
        voiceIndex: "0",
        voiceName: "Ban Mai (Nữ miền Bắc)",
        lastVoiceName: "Ban Mai (Nữ miền Bắc)",
        autoPlay: true,
        continuousRead: true,
        autoNext: true,
        maydoc: "fpt",
        fpt_key: "mock_fpt_api_key",
        phien_ban_du_lieu: "0.4.1",
        giao_dien_chu_de: "dark"
      }, 'local'),

      sync: tao_mock_storage({
        lastVoiceName: "Ban Mai (Nữ miền Bắc)",
        voiceIndex: "0",
        voiceName: "Ban Mai (Nữ miền Bắc)",
        autoNext: true,
        speed: 1.2,
        volume: 0.8,
        maydoc: "fpt"
      }, 'sync')
    }
  };
}

function tao_mock_storage(du_lieu_goc, vung_chon = 'local') {
  let du_lieu_noi_bo = JSON.parse(JSON.stringify(du_lieu_goc));

  const doi_tuong_luu_tru = {
    QUOTA_BYTES: vung_chon === 'sync' ? 102400 : 5242880,

    getBytesInUse: function (khoa, ham_goi) {
      const dung_luong_byte = Math.round(JSON.stringify(du_lieu_noi_bo).length * 1.5) + 32000;
      if (typeof ham_goi === 'function') { setTimeout(() => ham_goi(dung_luong_byte), 0); return; }
      return Promise.resolve(dung_luong_byte);
    },

    get: function (khoa, ham_goi) {
      const ham_thuc_hien = (phan_hoi_lai) => {
        const anh_chup = JSON.parse(JSON.stringify(du_lieu_noi_bo));

        if (anh_chup.readingList && anh_chup.readingList[0]) {
          const la_chuong_2 = lay_la_chuong_2();
          anh_chup.readingList[0].chap = la_chuong_2
            ? "Thứ 2 chương Áo lót đại quân..."
            : "Thứ 1 chương Khắc kim cải mệnh...";
          anh_chup.readingList[0].url = la_chuong_2
            ? "https://sangtacviet.com/truyen/fanqie/1/7578918840482942014/7578919302108037694/"
            : "https://sangtacviet.com/truyen/fanqie/1/7578918840482942014/7578918873747964478/";
        }

        let ket_qua = {};
        if (typeof khoa === 'string') {
          ket_qua[khoa] = anh_chup[khoa];
        } else if (Array.isArray(khoa)) {
          khoa.forEach(k => { ket_qua[k] = anh_chup[k]; });
        } else if (khoa !== null && typeof khoa === 'object') {
          Object.keys(khoa).forEach(k => {
            ket_qua[k] = anh_chup[k] !== undefined ? anh_chup[k] : khoa[k];
          });
        } else {
          ket_qua = anh_chup;
        }
        phan_hoi_lai(ket_qua);
      };

      if (typeof ham_goi === 'function') { setTimeout(() => ham_thuc_hien(ham_goi), 0); return; }
      return new Promise(giai_quyet => setTimeout(() => ham_thuc_hien(giai_quyet), 0));
    },

    set: function (du_lieu, ham_goi) {
      const thay_doi = {};
      for (const [khoa, gia_tri] of Object.entries(du_lieu)) {
        thay_doi[khoa] = { oldValue: du_lieu_noi_bo[khoa], newValue: gia_tri };
      }
      Object.assign(du_lieu_noi_bo, du_lieu);

      danh_sach_lang_nghe_luu_tru.forEach(ham_xu_ly => {
        try { ham_xu_ly(thay_doi, vung_chon); } catch (_) {}
      });

      if (du_lieu && du_lieu.giao_dien_chu_de) {
        try {
          if (window.parent && window.parent !== window) {
            window.parent.__chu_de_hien_tai = du_lieu.giao_dien_chu_de;
            window.parent.postMessage({
              type: 'STV_THEME_CHANGE',
              theme: du_lieu.giao_dien_chu_de
            }, '*');
          }
        } catch (_) {}
      }

      if (typeof ham_goi === 'function') { setTimeout(ham_goi, 0); return; }
      return new Promise(giai_quyet => setTimeout(giai_quyet, 0));
    },

    remove: function (khoa, ham_goi) {
      const danh_sach_khoa = Array.isArray(khoa) ? khoa : [khoa];
      const thay_doi = {};
      danh_sach_khoa.forEach(k => {
        thay_doi[k] = { oldValue: du_lieu_noi_bo[k], newValue: undefined };
        delete du_lieu_noi_bo[k];
      });

      danh_sach_lang_nghe_luu_tru.forEach(ham_xu_ly => {
        try { ham_xu_ly(thay_doi, vung_chon); } catch (_) {}
      });

      if (typeof ham_goi === 'function') { setTimeout(ham_goi, 0); return; }
      return new Promise(giai_quyet => setTimeout(giai_quyet, 0));
    },

    clear: function (ham_goi) {
      du_lieu_noi_bo = {};
      if (typeof ham_goi === 'function') { setTimeout(ham_goi, 0); return; }
      return new Promise(giai_quyet => setTimeout(giai_quyet, 0));
    }
  };

  return doi_tuong_luu_tru;
}

// Đảm bảo hiển thị giao diện mẫu không bị ẩn độ mờ
if (typeof document !== 'undefined') {
  const hien_thi_than_trang = () => {
    if (document.body) document.body.style.opacity = '1';
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hien_thi_than_trang);
  } else {
    hien_thi_than_trang();
  }
  setTimeout(hien_thi_than_trang, 50);
}
