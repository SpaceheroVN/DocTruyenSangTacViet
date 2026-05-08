# Auto Đọc STV - Trình đọc truyện Text-to-Speech cho sangtacviet.com

<p align="center">
  <img src="docs/icons/logo.svg" width="240" alt="Logo">
</p>

[![Version](https://img.shields.io/badge/version-0.2-blue.svg)](https://github.com/SpaceheroVN/DocTruyenSangTacViet)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Edge-lightgrey.svg)](#)

**Auto Đọc STV** là một tiện ích mở rộng mạnh mẽ giúp chuyển đổi văn bản thành giọng nói (Text-to-Speech) được tối ưu hóa riêng cho website [sangtacviet.com](https://sangtacviet.com). Đừng để việc đọc truyện làm mỏi mắt bạn, hãy để chúng tôi "kể" truyện cho bạn nghe!

---

## Tính năng nổi bật

- **Đa dạng nguồn giọng đọc:** Tích hợp các Engine như **Web Speech API**, **FPT.AI** và **Microsoft Azure TTS**.
- **Vượt rào mã hóa:** Tự động phát hiện và xử lý các chương truyện bị khóa (chặn đọc, hiện tại là thế, thiếu kinh phí ,=, ).
- **Tự động chuyển chương:** Tự động nhận diện và đọc chương tiếp theo khi kết thúc chương hiện tại.
- **Ghi nhớ tiến độ:** Lưu chính xác vị trí đến từng đoạn văn (chunk).
- **Hẹn giờ thông minh:** Thiết lập dừng đọc sau một khoảng thời gian hoặc số lượng chương nhất định.
- **Điều khiển nhanh:** Hệ thống phím tắt linh hoạt để thao tác nhanh chóng.

---
## Hướng dẫn cài đặt

1. **Tải về:** [Tải bộ DocTruyenSTV_v.x](https://github.com/SpaceheroVN/DocTruyenSangTacViet/releases) và giải nén.
2. **Mở quản lý tiện ích:** Truy cập `chrome://extensions/` (Chrome) hoặc `edge://extensions/` (Edge).
3. **Chế độ nhà phát triển:** Bật công tắc **Developer mode** ở góc trên bên phải.
4. **Cài đặt:** Chọn **Load unpacked** (Tải tiện ích đã giải nén) và chọn thư mục vừa giải nén.

---

## Hướng dẫn sử dụng

### Điều khiển cơ bản
- Mở một chương truyện bất kỳ trên Sáng Tác Việt.
- Nhấn biểu tượng tiện ích và chọn **Nghe**.
- Tùy chỉnh **Tốc độ** và **Âm lượng** theo ý thích.

### Phím tắt hỗ trợ

| Phím tắt | Chức năng |
| :--- | :--- |
| **K** | Phát / Tạm dừng |
| **R** | Đọc lại chương hiện tại từ đầu |
| **Esc** | Dừng hẳn quá trình đọc |
| **Mũi tên Trái** | Quay lại chương trước |
| **Mũi tên Phải** | Chuyển sang chương sau |

---

## Cấu hình API Key (Tùy chọn)

Để sử dụng các giọng đọc chất lượng cao (FPT.AI, Azure), bạn cần cấu hình API Key cá nhân trong phần cài đặt:
- **FPT.AI:** Miễn phí 100.000 ký tự/tháng.
- **Microsoft Azure:** Miễn phí 500.000 ký tự/tháng (Gói F0).

> [!TIP]
> Xem hướng dẫn chi tiết cách lấy API Key tại tệp `guide_v0.2.html` trong thư mục tiện ích.

---

## Trình quản lý Bookmark

Tiện ích tích hợp tab **Danh sách đọc** giúp bạn quản lý kho truyện cá nhân:
- Tự động lưu tên truyện, chương và vị trí đang đọc.
- Đồng bộ hóa tiến độ nghe trên mọi chương truyện.

---

## Giấy phép

Dự án này được phát hành dưới giấy phép **MIT**. Xem tệp [LICENSE](LICENSE) để biết thêm chi tiết.

---
**Phiên bản hiện tại:** `0.2` - Phát triển bởi [SpaceheroVN](https://github.com/SpaceheroVN)
