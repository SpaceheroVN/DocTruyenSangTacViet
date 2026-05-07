# Đọc Truyện STV (Auto Đọc STV)

**Đọc Truyện STV** là một tiện ích mở rộng (Browser Extension) giúp tự động đọc truyện trên trang web Sáng Tác Việt (`sangtacviet.com`). Tiện ích mang đến trải nghiệm nghe truyện mượt mà với nhiều giọng đọc khác nhau và các tính năng hỗ trợ người dùng tối đa.

## 🌟 Tính Năng Nổi Bật

- **Tự động đọc truyện:** Tự động lấy nội dung văn bản của chương truyện và phát qua âm thanh.
- **Tự động chuyển chương:** Chuyển sang chương tiếp theo khi đọc hết chương hiện tại mà không cần thao tác tay.
- **Highlight văn bản:** Tự động đánh dấu (highlight) đoạn văn bản đang được đọc để dễ theo dõi và tự động cuộn trang.
- **Tùy chỉnh linh hoạt:** Điều chỉnh tốc độ đọc, âm lượng tùy theo sở thích cá nhân.
- **Phím tắt tiện dụng:**
  - `K` : Phát/Tạm dừng
  - `←` / `→` : Chương trước / Chương sau
  - `R` : Đọc lại từ đầu chương
  - `Esc` : Tắt/Dừng hẳn
- **Lưu danh sách truyện:** Dễ dàng lưu và quản lý danh sách các truyện đang đọc (bookmark) kèm ảnh bìa, tự động cập nhật chương mới nhất.
- **Chuyển đoạn nhanh:** Nút tiến/lùi đoạn văn bản ngay trong trình điều khiển.

## 🎙️ Các Nguồn Giọng Đọc (TTS Engines) Hỗ Trợ

Tiện ích hỗ trợ đa dạng các nguồn giọng đọc từ miễn phí có sẵn đến các API cao cấp (cần có API Key):

1. **Web Speech API (Hệ điều hành):** Sử dụng các giọng đọc có sẵn trên máy tính/trình duyệt của bạn. Miễn phí và không giới hạn.
2. **FPT.AI TTS (Việt Nam):** Giọng đọc tiếng Việt chất lượng cao, ngắt nghỉ tự nhiên (Cần API Key).
3. **Microsoft Azure TTS (Quốc Tế):** Giọng đọc AI tự nhiên nhất hiện nay của Microsoft (Cần API Key).

## 📥 Hướng Dẫn Cài Đặt (Trên Microsoft Edge)

Do đây là tiện ích cài thủ công từ mã nguồn, bạn làm theo các bước sau:

1. Tải toàn bộ mã nguồn của dự án này về máy tính.
2. Mở trình duyệt Microsoft Edge.
3. Nhập `edge://extensions/` vào thanh địa chỉ và nhấn Enter.
4. Bật **Chế độ nhà phát triển (Developer mode)** ở menu bên trái (hoặc góc dưới bên trái).
5. Nhấn vào nút **Tải phần mở rộng đã bung (Load unpacked)**.
6. Chọn thư mục chứa mã nguồn của tiện ích `DocTruyenSangTacViet`.
7. Tiện ích sẽ được cài đặt thành công. Bạn nên ghim (pin) tiện ích ra thanh công cụ của trình duyệt để dễ dàng sử dụng.

## 🔑 Hướng Dẫn Lấy API Key (Miễn phí)

Sử dụng API Key giúp giọng đọc mượt mà, ngắt nghỉ như người thật và không bị lỗi vặt.

### 1. Dành cho FPT.AI (Khuyên dùng)
FPT cung cấp **100.000 ký tự miễn phí mỗi tháng**, đủ để bạn đọc vài chục chương truyện. Hệ thống đã được tiện ích tích hợp tự động, bạn chỉ cần lấy Key dán vào là chạy.

- **Bước 1:** Truy cập [Console FPT.AI](https://console.fpt.ai) và tạo tài khoản / đăng nhập.
- **Bước 2:** Tại màn hình chính, tìm thẻ **Text to Speech** và **bấm gạt công tắc** ở góc phải cho nó chuyển sang màu xanh.
- **Bước 3:** Hệ thống sẽ hiện bảng hỏi xác nhận bật API, sau đó yêu cầu bạn **điền tên khóa** (Key name, VD: `STV`). Điền xong bấm nút tạo.
- **Bước 4:** Khóa sẽ được tự động tạo. Bạn chỉ cần nhìn sang menu bên trái, bấm vào mục **API Keys**.
- **Bước 5:** Bấm vào biểu tượng **Copy** (hình 2 tờ giấy) cạnh mã Key bạn vừa tạo.
- **Bước 6:** Mở tiện ích Auto Đọc STV > Tab **Cài đặt** > Chọn nguồn **FPT.AI TTS (Việt Nam)** > Dán mã vào ô > Bấm **Lưu API Key**.

### 2. Dành cho Microsoft Azure TTS
Giọng Azure được đánh giá là tự nhiên nhất thế giới. Microsoft tặng gói F0 miễn phí **500.000 ký tự/tháng**. Tuy nhiên, quá trình đăng ký yêu cầu thẻ VISA/Mastercard để xác minh.

- **Bước 1:** Truy cập [Portal Azure](https://portal.azure.com) để đăng ký tài khoản.
- **Bước 2:** Tìm dịch vụ **Speech Services** và tạo mới một tài nguyên (Resource).
- **Bước 3:** Chọn Pricing tier là **Free F0**.
- **Bước 4:** Sau khi tạo xong, vào mục **Keys and Endpoint**.
- **Bước 5:** Copy **KEY 1** (dán vào ô API Key trong tiện ích) và **Location/Region** (VD: `southeastasia` - dán vào ô Region của tiện ích).
- **Bước 6:** Bấm **Lưu API Key** trong tiện ích để hoàn tất.