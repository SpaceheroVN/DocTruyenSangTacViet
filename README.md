# Auto Đọc STV

Tiện ích mở rộng (Extension) hỗ trợ chuyển đổi văn bản thành giọng nói (Text-to-Speech) dành riêng cho website sangtacviet.com. Công cụ này giúp người dùng nghe truyện tự động với nhiều tùy chỉnh cá nhân hóa và khả năng xử lý các rào cản kỹ thuật từ phía website.

## Các tính năng chính

* **Đa dạng nguồn giọng đọc (TTS Engines):** Tích hợp Web Speech API (mặc định), FPT.AI và Microsoft Azure TTS.
* **Vượt rào mã hóa:** Tự động phát hiện và cảnh báo các chương truyện bị khóa bằng custom font để tránh lỗi đọc ký tự lạ.
* **Tự động chuyển chương:** Tự động nhận diện và kích hoạt trình đọc khi sang chương mới.
* **Lưu tiến độ đọc chi tiết:** Ghi nhớ chính xác vị trí đến từng đoạn văn (chunk) đang đọc dở.
* **Hẹn giờ dừng tự động:** Cho phép thiết lập dừng đọc sau một khoảng thời gian nhất định hoặc sau một số lượng chương cụ thể.
* **Hệ thống phím tắt:** Hỗ trợ điều khiển nhanh bằng bàn phím.

## Hướng dẫn cài đặt

1. Tải bộ mã nguồn về máy tính.
2. Mở trình duyệt và truy cập trang quản lý tiện ích (Chrome: `chrome://extensions/` | Edge: `edge://extensions/`).
3. Kích hoạt **Developer mode (Chế độ dành cho nhà phát triển)**.
4. Chọn **Load unpacked (Tải tiện ích đã giải nén)** và tìm đến thư mục chứa mã nguồn.

## Hướng dẫn sử dụng

### Điều khiển cơ bản
* Truy cập chương truyện trên Sáng Tác Việt và nhấn **Nghe** trên giao diện tiện ích.
* Sử dụng thanh trượt để điều chỉnh **Tốc độ** và **Âm lượng**.

### Phím tắt hỗ trợ
* **K**: Phát / Tạm dừng.
* **R**: Đọc lại chương hiện tại từ đầu.
* **Esc**: Dừng hẳn quá trình đọc.
* **Mũi tên Trái / Phải**: Chuyển chương Trước / Sau.

## Cấu hình API Key (Tùy chọn)

Để trải nghiệm giọng đọc chất lượng cao, người dùng có thể tự đăng ký API Key cá nhân:
* **FPT.AI:** Miễn phí 100.000 ký tự mỗi tháng.
* **Microsoft Azure:** Miễn phí 500.000 ký tự mỗi tháng với gói F0.

Hướng dẫn chi tiết quy trình lấy mã Key có thể xem tại tệp `guide.html` đi kèm.

## Trình quản lý tiến độ (Bookmark)

Tiện ích cung cấp hệ thống quản lý truyện thông minh tại tab **Danh sách đọc**:
* Tự động cập nhật URL, tên chương và vị trí đoạn văn đang đọc vào bookmark.
* Cho phép người dùng tiếp tục nghe ngay tại vị trí đã dừng trước đó khi mở lại truyện.

---
**Phiên bản hiện tại:** 0.2