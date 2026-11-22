# CREDITS — Nguồn hình ảnh, âm thanh và công nghệ

Toàn bộ tài nguyên trong **Giang Hồ AI (Giai đoạn 1 & Giai đoạn 2)** đều tự tạo 100% bằng mã nguồn, chạy hoàn toàn offline trong trình duyệt, không sử dụng tài nguyên bản quyền từ Võ Lâm Truyền Kỳ, truyện Kim Dung hay bất kỳ trò chơi / công ty AI nào khác.

## 1. Đồ họa (Hình ảnh)
- **Tác giả:** Tự sinh hoàn toàn bằng HTML5 Canvas 2D API trong [`src/game/textures.ts`](src/game/textures.ts) khi khởi động game.
- **Giấy phép:** CC0 / tự tạo cho dự án này.
- **Bao gồm (Giai đoạn 1 & Giai đoạn 2):**
  - Nền 5 bản đồ: Thành Lam Lư, Rừng Thạch Mạch, Động Tàn Cơ, Thành Bế Các (Đài Bảng Tin Giang Hồ, Mật Khố Tỏa Chốt, Lò Luyện Hợp Kim, Phố Ký Gửi Ấn Tín, Sân Công Thành Bắc Môn), Lũng Đại Mạch (Bãi Mỏ Tinh Lam, Hẻm Đứt Bùa, Khe Vỡ Khung Đồng, Tế Đàn Lõi Trầm).
  - Hình nhân vật 3 môn phái (Phổ Mộc Đường, Tỏa Kim Các, Hỏa Ấn Môn).
  - Hình 3 đồng đội AI khôi lỗi gỗ-đồng (Thiết Xung, Mộc Tĩnh, Tích Linh).
  - Hình 14 NPC (Lão Bính, Bách Thông, Bà Tư Chợ Đá, Chưởng Lò Tạ Nghiêm, Bùi An, Trưởng Lão Mộc Thanh, Chấp Sự Hàn Khắc, Chưởng Ấn Nghiêm Liệt, Thư Sinh Lục Viễn, Bà Hai Quán Trà, Sư Phụ Kỷ Văn, Đạo Sĩ Tề Minh, Quản Sự Trịnh Phong, Tiểu Bính).
  - Hình cờ hiệu và đệ tử tuần tra của 4 bang hội AI (Cương Lô Hội, Mộc Khế Bang, Thủy Kính Minh, Diệm Giới Đoàn).
  - Hình 11 loại quái Ngũ Hành cùng 2 Trùm: **Sơ Giác — Khôi Lỗi Số Không (Thủy)** và **Vạn Chép — Khôi Lỗi Hợp Lõi (Kim)** (2 trạng thái thường / Mở Khóa Quá Tải khi dưới 50% máu).
  - Biểu tượng bạc vụn, mảnh linh thạch, rương trang bị, quặng linh thiết, mặt nạ gỗ, tập chép lén võ phổ, trụ bùa phong ấn và đạn Ngũ Hành.

## 2. Âm thanh
- **Tác giả:** Tự tổng hợp trực tiếp bằng Web Audio API trong [`src/game/sound.ts`](src/game/sound.ts) theo thang âm ngũ cung.
- **Giấy phép:** CC0 / tự tạo cho dự án này.
- **Đặc điểm:** Không tải tệp MP3/WAV ngoài, không gọi mạng, có nút bật/tắt tiếng trong giao diện.

## 3. Thư viện mã nguồn mở
- **Phaser 3** (`phaser`) — MIT License — Engine game 2D Canvas/WebGL.
- **Vite** (`vite`) — MIT License — Công cụ đóng gói web tĩnh offline.
- **TypeScript** (`typescript`) — Apache-2.0 License.
- **Vitest** (`vitest`) — MIT License — Bộ kiểm thử đơn vị tự động.
- **Playwright** (`@playwright/test`) — Apache-2.0 License — Bộ kiểm thử trình duyệt tự động offline (`npm run test:e2e`).
