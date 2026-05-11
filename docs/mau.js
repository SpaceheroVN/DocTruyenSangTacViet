window.chrome = {
  runtime: {
    getManifest: () => ({ version: "0.3" }),
    onMessage: { addListener: () => { } },
    sendMessage: (tinNhan, hamGoi) => {
      const phanHoiGia = {
        voices: [
          { name: "Hoài My (FPT)", value: "0", engine: "fpt" },
          { name: "Ban Mai (FPT)", value: "1", engine: "fpt" },
          { name: "Microsoft Hoài My (Azure)", value: "vi-VN-HoaiMyNeural", engine: "azure" },
          { name: "Google Tiếng Việt", value: "vietnamese", engine: "web" }
        ],
        isPlaying: false, isPaused: false,
        bookTitle: "Truyện Xem Trước Demo", chapTitle: "Chương 1: Bắt đầu"
      };
      const thucHien = (cb) => {
        setTimeout(() => {
          if (tinNhan.action === 'getVoices') cb({ voices: phanHoiGia.voices });
          else if (tinNhan.action === 'getStatus' || tinNhan.action === 'getInfo') cb(phanHoiGia);
          else cb({});
        }, 10);
      };
      if (typeof hamGoi === 'function') { thucHien(hamGoi); return true; }
      else return new Promise(r => thucHien(r));
    },
    lastError: null
  },
  tabs: {
    query: (tuyChinh, hamGoi) => {
      const tabGia = { id: 1, url: "https://sangtacviet.pro/truyen/demo/", title: "Truyện Demo Hay" };
      if (typeof hamGoi === 'function') { hamGoi([tabGia]); }
      else return Promise.resolve([tabGia]);
    },
    sendMessage: (idTab, tinNhan, hamGoi) => {
      return window.chrome.runtime.sendMessage(tinNhan, hamGoi);
    },
    create: (obj) => { console.log("Mock tabs.create:", obj.url); }
  },
  storage: {
    local: taoMockStorage({
      readingList: [{ title: "Truyện Demo 1", chap: "Chương 10", url: "#", savedAt: "08/05/2026" }],
      speed: 1.2, volume: 0.8, voiceIndex: "0", autoPlay: true, continuousRead: true,
      autoNext: true, maydoc: "fpt"
    }),
    sync: taoMockStorage({
      lastVoiceName: "Hoài My (FPT)",
      autoNext: true,
      speed: 1.2,
      volume: 0.8,
      maydoc: "fpt"
    })
  }
};

function taoMockStorage(duLieuGoc) {
  let _data = duLieuGoc;
  return {
    get: function (khoa, hamGoi) {
      const thucHien = (cb) => {
        let ketQua = {};
        if (typeof khoa === 'string') { ketQua[khoa] = _data[khoa]; }
        else if (Array.isArray(khoa)) { khoa.forEach(k => ketQua[k] = _data[k]); }
        else if (typeof khoa === 'object') {
          Object.keys(khoa).forEach(k => { ketQua[k] = _data[k] !== undefined ? _data[k] : khoa[k]; });
        } else { ketQua = _data; }
        cb(ketQua);
      };
      if (typeof hamGoi === 'function') { setTimeout(() => thucHien(hamGoi), 0); }
      else return new Promise(r => setTimeout(() => thucHien(r), 0));
    },
    set: function (duLieu, hamGoi) {
      Object.assign(_data, duLieu);
      if (typeof hamGoi === 'function') { setTimeout(hamGoi, 0); }
      else return new Promise(r => setTimeout(r, 0));
    },
    remove: function (khoa, hamGoi) {
      if (typeof khoa === 'string') delete _data[khoa];
      else if (Array.isArray(khoa)) khoa.forEach(k => delete _data[k]);
      if (typeof hamGoi === 'function') { setTimeout(hamGoi, 0); }
      else return new Promise(r => setTimeout(r, 0));
    },
    clear: function (hamGoi) {
      _data = {};
      if (typeof hamGoi === 'function') { setTimeout(hamGoi, 0); }
      else return new Promise(r => setTimeout(r, 0));
    }
  };
}