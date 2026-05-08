window.chrome = {
  runtime: {
    getManifest: () => ({ version: "Preview" }),
    onMessage: { addListener: () => { } },
    lastError: null
  },
  tabs: {
    query: (tuyChinh, hamGoi) => {
      const tabGia = { id: 1, url: "https://sangtacviet.com/truyen/fake/1/" };
      if (typeof hamGoi === 'function') {
        hamGoi([tabGia]);
      } else {
        return Promise.resolve([tabGia]);
      }
    },
    sendMessage: (idTab, tinNhan, hamGoi) => {
      const phanHoi = {
        bookTitle: "Truyện Xem Trước Demo", chapTitle: "Chương 1: Bắt đầu",
        imgUrl: "", bookUrl: "https://sangtacviet.com/", pageUrl: "https://sangtacviet.com/",
        isPlaying: false, isPaused: false, progress: { current: 1, total: 100 },
        ttsEngine: "web", elapsed: 0
      };

      const thucHienPhanHoi = (hamNhan) => {
        setTimeout(() => {
          if (tinNhan.action === 'getInfo' || tinNhan.action === 'getStatus') {
            hamNhan(phanHoi);
          } else if (tinNhan.action === 'getVoices') {
            hamNhan({ voices: [{ name: "Giọng mẫu 1", lang: "vi-VN" }, { name: "Giọng mẫu 2", lang: "vi-VN" }] });
          } else if (tinNhan.action === 'togglePlay') {
            hamNhan({ isPlaying: true, isPaused: false });
          } else {
            hamNhan({});
          }
        }, 10);
      };

      if (typeof hamGoi === 'function') {
        thucHienPhanHoi(hamGoi);
        return true;
      } else {
        return new Promise((resolve) => thucHienPhanHoi(resolve));
      }
    },
    create: () => { }
  },
  storage: {
    local: {
      _data: {
        readingList: [
          { title: "Truyện Demo 1", chap: "Chương 10", url: "#", savedAt: "08/05/2026" }
        ],
        speed: 1.2, volume: 0.8
      },
      get: function (khoa, hamGoi) {
        return new Promise(resolve => {
          const hamNhan = hamGoi || resolve;
          setTimeout(() => {
            if (typeof khoa === 'string') { let ketQua = {}; ketQua[khoa] = this._data[khoa]; hamNhan(ketQua); }
            else if (Array.isArray(khoa)) { let ketQua = {}; khoa.forEach(k => ketQua[k] = this._data[k]); hamNhan(ketQua); }
            else hamNhan(this._data);
          }, 0);
        });
      },
      set: function (duLieu, hamGoi) {
        return new Promise(resolve => {
          const hamNhan = hamGoi || resolve;
          Object.assign(this._data, duLieu);
          setTimeout(hamNhan, 0);
        });
      },
      remove: function (khoa, hamGoi) {
        return new Promise(resolve => {
          const hamNhan = hamGoi || resolve;
          if (typeof khoa === 'string') delete this._data[khoa];
          else if (Array.isArray(khoa)) khoa.forEach(k => delete this._data[k]);
          setTimeout(hamNhan, 0);
        });
      },
      clear: function (hamGoi) {
        return new Promise(resolve => {
          const hamNhan = hamGoi || resolve;
          this._data = {};
          setTimeout(hamNhan, 0);
        });
      }
    }
  }
};