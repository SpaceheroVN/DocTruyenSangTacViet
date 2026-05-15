function layIsCh2() {
  try { return window.parent.demoCurrentChapter === 2; } catch (e) { return false; }
}

if (typeof window.chrome === 'undefined' || !window.chrome.__isEdgeMock) {
  window.chrome = {
    __isEdgeMock: true,

    runtime: {
      getManifest: () => ({ version: "0.3" }),
      onMessage: { addListener: () => { } },

      sendMessage: (tinNhan, hamGoi) => {
        const getInfo = () => {
          const isCh2 = layIsCh2();
          return {
            voices: [
              { name: "Hoai My (FPT)", value: "0", engine: "fpt" },
              { name: "Ban Mai (FPT)", value: "1", engine: "fpt" },
              { name: "Microsoft Hoai My (Azure)", value: "vi-VN-HoaiMyNeural", engine: "azure" },
              { name: "Google Tieng Viet", value: "vietnamese", engine: "web" }
            ],
            isPlaying: false, isPaused: false,
            bookTitle: "Bat dau vo han phan than, mot minh ta vay quanh toan tong mon",
            chapTitle: isCh2
              ? "Thu 2 chuong Ao lot dai quan, moi nguoi giu dung vi tri cua minh"
              : "Thu 1 chuong Khac kim cai menh, co thu nhat phan than",
            imgUrl: "https://p6-novel.byteimg.com/novel-pic/7a4843d945562c7de76f4104e5fde2b1~tplv-shrink:640:0.image"
          };
        };

        const thucHien = (cb) => {
          setTimeout(() => {
            const info = getInfo();
            if (tinNhan.action === 'getVoices') cb({ voices: info.voices });
            else if (tinNhan.action === 'getStatus' || tinNhan.action === 'getInfo') cb(info);
            else cb({});
          }, 10);
        };

        if (typeof hamGoi === 'function') { thucHien(hamGoi); return true; }
        return new Promise(r => thucHien(r));
      },

      lastError: null
    },

    tabs: {
      query: (tuyChinh, hamGoi) => {
        const isCh2 = layIsCh2();
        const urlCh = isCh2
          ? "https://sangtacviet.com/truyen/fanqie/1/7578918840482942014/7578919302108037694/"
          : "https://sangtacviet.com/truyen/fanqie/1/7578918840482942014/7578918873747964478/";
        const tabGia = {
          id: 1, url: urlCh,
          title: "Bat dau vo han phan than, mot minh ta vay quanh toan tong mon"
        };
        if (typeof hamGoi === 'function') { hamGoi([tabGia]); return; }
        return Promise.resolve([tabGia]);
      },

      sendMessage: (idTab, tinNhan, hamGoi) => window.chrome.runtime.sendMessage(tinNhan, hamGoi),
      create: (obj) => console.log("Mock tabs.create:", obj.url)
    },

    storage: {
      local: taoMockStorage({
        readingList: [{
          title: "Bat dau vo han phan than, mot minh ta vay quanh toan tong mon",
          chap: "Thu 1 chuong Khac kim cai menh...",
          url: "https://sangtacviet.com/truyen/fanqie/1/7578918840482942014/7578918873747964478/",
          imgUrl: "https://p6-novel.byteimg.com/novel-pic/7a4843d945562c7de76f4104e5fde2b1~tplv-shrink:640:0.image",
          savedAt: "15/05/2026"
        }],
        speed: 1.2, volume: 0.8, voiceIndex: "0",
        autoPlay: true, continuousRead: true, autoNext: true, maydoc: "fpt"
      }),

      sync: taoMockStorage({
        lastVoiceName: "Hoai My (FPT)",
        autoNext: true,
        speed: 1.2,
        volume: 0.8,
        maydoc: "fpt"
      })
    }
  };
}

function taoMockStorage(duLieuGoc) {
  let _data = JSON.parse(JSON.stringify(duLieuGoc));

  return {
    get: function (khoa, hamGoi) {
      const thucHien = (cb) => {
        const snapshot = JSON.parse(JSON.stringify(_data));

        if (snapshot.readingList && snapshot.readingList[0]) {
          const isCh2 = layIsCh2();
          snapshot.readingList[0].chap = isCh2
            ? "Thu 2 chuong Ao lot dai quan..."
            : "Thu 1 chuong Khac kim cai menh...";
          snapshot.readingList[0].url = isCh2
            ? "https://sangtacviet.com/truyen/fanqie/1/7578918840482942014/7578919302108037694/"
            : "https://sangtacviet.com/truyen/fanqie/1/7578918840482942014/7578918873747964478/";
        }

        let ketQua = {};
        if (typeof khoa === 'string') {
          ketQua[khoa] = snapshot[khoa];
        } else if (Array.isArray(khoa)) {
          khoa.forEach(k => { ketQua[k] = snapshot[k]; });
        } else if (khoa !== null && typeof khoa === 'object') {
          Object.keys(khoa).forEach(k => {
            ketQua[k] = snapshot[k] !== undefined ? snapshot[k] : khoa[k];
          });
        } else {
          ketQua = snapshot;
        }
        cb(ketQua);
      };

      if (typeof hamGoi === 'function') { setTimeout(() => thucHien(hamGoi), 0); return; }
      return new Promise(r => setTimeout(() => thucHien(r), 0));
    },

    set: function (duLieu, hamGoi) {
      Object.assign(_data, duLieu);
      if (typeof hamGoi === 'function') { setTimeout(hamGoi, 0); return; }
      return new Promise(r => setTimeout(r, 0));
    },

    remove: function (khoa, hamGoi) {
      if (typeof khoa === 'string') delete _data[khoa];
      else if (Array.isArray(khoa)) khoa.forEach(k => delete _data[k]);
      if (typeof hamGoi === 'function') { setTimeout(hamGoi, 0); return; }
      return new Promise(r => setTimeout(r, 0));
    },

    clear: function (hamGoi) {
      _data = {};
      if (typeof hamGoi === 'function') { setTimeout(hamGoi, 0); return; }
      return new Promise(r => setTimeout(r, 0));
    }
  };
}