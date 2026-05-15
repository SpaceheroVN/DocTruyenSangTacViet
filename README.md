<div align="center">
  <img src="docs/icons/logo.svg" alt="Auto Đọc STV" width="200" />
  <p>Tiện ích trình duyệt tự động đọc truyện trên <a href="https://sangtacviet.com">Sáng Tác Việt</a>, hỗ trợ nhiều engine TTS với giọng đọc tự nhiên.</p>
</div>

[![Version](https://img.shields.io/badge/version-0.3-orange)](#)
[![License](https://img.shields.io/badge/license-MIT-blue)](#)
[![Edge Add-on](https://img.shields.io/badge/Microsoft%20Edge-Add--on-0078d4?logo=microsoftedge)](https://microsoftedge.microsoft.com/addons/detail/mabgcghglcjheefkkicmkpmlhaooiiae)

---

## Tính năng

**Engine giọng đọc**
- **Web Speech API** — Dùng ngay, không cần cấu hình.
- **FPT.AI TTS** — Giọng Việt tự nhiên, 100.000 ký tự miễn phí/tháng. *(Khuyên dùng)*
- **Microsoft Azure TTS** — Giọng chất lượng cao nhất (Hoài My...), 500.000 ký tự miễn phí/tháng (yêu cầu thẻ VISA xác minh).

**Điều khiển phát**
- Phát / Tạm dừng / Chuyển chương tự động
- Điều chỉnh tốc độ, âm lượng, giọng đọc
- Đọc tên truyện và tên chương trước khi vào nội dung
- Phím tắt bàn phím: `K` (phát/dừng), `R` (đọc lại), `←` / `→` (chuyển chương)

**Tính năng nâng cao**
- **Mini Player** — Thanh điều khiển thu gọn nổi trên trang
- **Tự động dừng** — Hẹn giờ theo thời lượng, giờ thực, số chương, hoặc kết hợp tùy chỉnh
- **Từ điển tùy chỉnh** — Thay thế/phát âm lại từ ngữ theo ý muốn
- **Danh sách đọc** — Lưu và quản lý tiến độ nhiều truyện
- **Cache âm thanh** — Lưu audio (FPT/Azure) vào IndexedDB để tải lại nhanh hơn
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

Để dùng FPT.AI hoặc Azure, mở popup → **Cài đặt** → chọn nguồn giọng đọc → dán API Key → **Lưu**.

Hướng dẫn lấy key chi tiết có trong tab **Hướng dẫn lấy API** ngay trong tiện ích, hoặc xem tại [trang dự án](https://spaceherovn.github.io/DocTruyenSangTacViet/).

> **Lưu ý:** Server FPT/Azure đôi khi quá tải, dẫn đến lỗi hoặc nhảy đoạn đọc. Tiện ích có cơ chế tự thử lại. Nếu vẫn lỗi, hãy tạm dừng ~1 phút rồi phát lại, hoặc chuyển sang Web Speech API.

---

## Cấu trúc dự án (extension đang làm)

```
├── manifest.json
├── popup_v0.3.1.html      # Giao diện popup chính
├── popup_v0.3.1.js        # Logic popup
├── background_v0.3.1.js   # Service worker xử lý API nền (Bảo mật key)
├── content_v0.3.1.js      # Content script (chạy trên trang STV)
├── guide_v0.3.1.html      # Trang hướng dẫn & thông tin
├── guide_v0.3.1.js        # Logic trang hướng dẫn
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
