# CREDITS — Nguồn hình ảnh, âm thanh và công nghệ

Toàn bộ tài nguyên trong **Giang Hồ AI (Giai đoạn 1)** đều tự tạo 100% bằng mã nguồn, chạy hoàn toàn offline trong trình duyệt, không sử dụng tài nguyên bản quyền từ Võ Lâm Truyền Kỳ, truyện Kim Dung hay bất kỳ trò chơi / công ty AI nào khác.

## 1. Đồ họa (Hình ảnh)
- **Tác giả:** Tự sinh hoàn toàn bằng HTML5 Canvas 2D API trong [`src/game/textures.ts`](src/game/textures.ts) khi khởi động game.
- **Giấy phép:** CC0 / tự tạo cho dự án này.
- **Bao gồm:**
  - Nền gạch Thành Lam Lư, nền cỏ rừng Rừng Thạch Mạch, nền đá hang Động Tàn Cơ.
  - Hình nhân vật 3 môn phái (Phổ Mộc Đường, Tỏa Kim Các, Hỏa Ấn Môn).
  - Hình 3 đồng đội AI khôi lỗi gỗ-đồng (Thiết Xung, Mộc Tĩnh, Tích Linh).
  - Hình 5 NPC (Lão Bính, Bách Thông, Bà Tư Chợ Đá, Chưởng Lò Tạ Nghiêm, Bùi An).
  - Hình 5 loại quái Ngũ Hành và Trùm Sơ Giác (2 trạng thái phong ấn / Vòng Cấm Tự Giải).
  - Biểu tượng bạc vụn, mảnh linh thạch, rương trang bị, quặng linh thiết và đạn Ngũ Hành.

## 2. Âm thanh
- **Tác giả:** Tự tổng hợp trực tiếp bằng Web Audio API trong [`src/game/sound.ts`](src/game/sound.ts) theo thang âm ngũ cung.
- **Giấy phép:** CC0 / tự tạo cho dự án này.
- **Đặc điểm:** Không tải tệp MP3/WAV ngoài, không gọi mạng, có nút bật/tắt tiếng trong giao diện.

## 3. Thư viện mã nguồn mở
- **Phaser 3** (`phaser`) — MIT License — Engine game 2D Canvas/WebGL.
- **Vite** (`vite`) — MIT License — Công cụ đóng gói web tĩnh offline.
- **TypeScript** (`typescript`) — Apache-2.0 License.
- **Vitest** (`vitest`) — MIT License — Bộ kiểm thử tự động.
