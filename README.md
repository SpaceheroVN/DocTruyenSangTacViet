# Tạm dừng dự án vô thời hạn. Bận!
<div align="center">
  <img src="docs/icons/logo.svg" alt="Đọc Truyện Cho Sáng Tác Việt" width="200" />
  <p>Tiện ích trình duyệt tự động đọc truyện trên <a href="https://sangtacviet.com">Sáng Tác Việt</a>, hỗ trợ nhiều engine TTS với giọng đọc tự nhiên.</p>
</div>

[![Version](https://img.shields.io/badge/version-0.3.4-orange)](#)
[![License](https://img.shields.io/badge/license-MIT-blue)](#)
[![Edge Add-on](https://img.shields.io/badge/Microsoft%20Edge-Add--on-0078d4?logo=microsoftedge)](https://microsoftedge.microsoft.com/addons/detail/mabgcghglcjheefkkicmkpmlhaooiiae)

---

## Tính năng

**Engine giọng đọc**
- **Web Speech API** — Dùng ngay, không cần cấu hình.
- **FPT.AI TTS** — Giọng Việt tự nhiên, 100.000 ký tự miễn phí/tháng. *(Khuyên dùng)*
- **Microsoft Azure TTS** — Giọng chất lượng cao nhất (Hoài My...), 500.000 ký tự miễn phí/tháng (yêu cầu thẻ VISA xác minh).
- **Google Cloud TTS** — 8 giọng Wavenet/Standard tiếng Việt, 1 triệu ký tự miễn phí/tháng (yêu cầu thẻ VISA xác minh).

**Điều khiển phát**
- Phát / Tạm dừng / Chuyển chương tự động
- Điều chỉnh tốc độ, âm lượng, giọng đọc
- Đọc tên truyện và tên chương trước khi vào nội dung
- Phím tắt bàn phím: `K` (phát/dừng), `R` (đọc lại), `←` / `→` (chuyển chương), `[` / `]` (tốc độ), `,` / `.` (nhảy đoạn)

**Tính năng nâng cao**
- **Giao diện hiện đại** — Thiết kế tiện ích đẹp mắt với các hiệu ứng tương tác (glow/hover) mượt mà.
- **Mini Player** — Thanh điều khiển thu gọn nổi trên trang, hỗ trợ chế độ CHƯƠNG / ĐOẠN
- **Tự động dừng** — Hẹn giờ theo thời lượng, giờ thực, số chương, hoặc kết hợp tùy chỉnh
- **Từ điển tùy chỉnh** — Thay thế/phát âm lại từ ngữ theo ý muốn, hỗ trợ regex Unicode
- **Danh sách đọc** — Lưu và quản lý tiến độ nhiều truyện
- **Cache âm thanh** — Lưu audio vào IndexedDB, tự dọn dẹp sau 12 giờ
- **Sao lưu & đồng bộ** — Xuất/nhập toàn bộ dữ liệu (API Key, truyện đã lưu, cài đặt) dưới dạng `.json`
- **Bỏ chặn copy** — Gỡ bỏ bảo vệ sao chép văn bản của trang

---

## Cài đặt

**Từ cửa hàng (Edge)**

Tải trực tiếp tại [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/mabgcghglcjheefkkicmkpmlhaooiiae).

**Cài thủ công (Developer Mode)**

1. Tải và giải nén source code.
2. Mở `edge://extensions` (hoặc `chrome://extensions`).
3. Bật **Developer mode**.
4. Chọn **Load unpacked** và trỏ vào thư mục vừa giải nén.

---

## Cấu hình API

Để dùng FPT.AI, Azure hoặc Google Cloud, mở popup → **Cài đặt** → chọn nguồn giọng đọc → dán API Key → **Lưu**.

Hướng dẫn lấy key chi tiết có trong tab **Hướng dẫn lấy API** ngay trong tiện ích, hoặc xem tại [trang dự án](https://spaceherovn.github.io/DocTruyenSangTacViet/).

> **Lưu ý:** Server FPT/Azure/Google đôi khi quá tải, dẫn đến lỗi hoặc nhảy đoạn đọc. Tiện ích có cơ chế tự thử lại. Nếu vẫn lỗi, hãy tạm dừng ~1 phút rồi phát lại, hoặc chuyển sang Web Speech API.

---

## Cấu trúc dự án

```
├── manifest.json
├── popup_v0.3.4.html          # Giao diện popup chính
├── chayngam_v0.3.4.js         # Service worker xử lý API nền
├── noidung/
│   ├── cau_hinh.js            # Cấu hình, cache IDB, từ điển
│   ├── xu_ly.js               # Logic phát âm thanh (Web Speech & API)
│   └── giao_dien.js           # Mini player, phím tắt, điều phối chính
├── chinh.js                   # Entry point popup
├── dieu_khien_trinh_phat.js   # Điều khiển trình phát từ popup
├── giao_dien_cai_dat.js       # Giao diện cài đặt popup
├── quan_ly_thu_vien.js        # Quản lý danh sách đọc
├── quan_ly_cau_hinh.js        # Đọc/ghi storage tập trung
├── guide_v0.3.4.html          # Trang hướng dẫn & thông tin
├── guide_v0.3.4.js            # Logic trang hướng dẫn
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## Đóng góp & Liên hệ

- 🐛 **Báo lỗi / Góp ý:** [Google Form](https://forms.gle/rcrew33xXDU144j79)
- ⭐ **Đánh giá:** [Edge Add-ons Store](https://microsoftedge.microsoft.com/addons/detail/mabgcghglcjheefkkicmkpmlhaooiiae)
- ☕ **Ủng hộ mình:** [biolink.com.vn/autostv](https://biolink.com.vn/autostv)

---

## Giấy phép

[MIT License](LICENSE) © SpaceheroVN