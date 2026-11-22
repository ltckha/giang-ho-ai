# CREDITS — Nguồn hình ảnh, âm thanh và công nghệ

Toàn bộ tài nguyên trong **Giang Hồ AI (Bản Thủ Thành)** đều tự tạo 100% bằng mã nguồn, chạy hoàn toàn offline trong trình duyệt, không sử dụng tài nguyên bản quyền từ Võ Lâm Truyền Kỳ, truyện Kim Dung hay bất kỳ trò chơi thủ thành / công ty AI nào khác.

## 1. Đồ họa (Hình ảnh)
- **Tác giả:** Tự vẽ hoàn toàn bằng HTML5 Canvas 2D API và Phaser Graphics trong [`src/game/textures.ts`](src/game/textures.ts) và [`src/scenes/TdStageScene.ts`](src/scenes/TdStageScene.ts).
- **Giấy phép:** CC0 / tự tạo cho dự án này.
- **Bao gồm:**
  - Bản đồ đường mòn, các khúc cua chữ U, cửa mỏ linh thạch, cổng Thành Lam Lư, cây rừng và các ô đặt quân.
  - Hình khôi lỗi phe mình theo 5 hệ Ngũ Hành (Mộc, Kim, Thủy, Hỏa, Thổ), 3 bậc nâng cấp, vòng tầm bắn, vòng cộng hưởng hỗ trợ và hiệu ứng bị phá bùa.
  - Hình các loại quái khôi lỗi nổi loạn (chạy nhanh, giáp đá máu trâu, cánh gỗ bay, song lõi chia đôi, phá bùa, hồi máu, trùm), hiệu ứng chớp sáng khi trúng đạn, nổ mảnh khi chết và hạt linh thạch bay về góc màn hình.

## 2. Âm thanh
- **Tác giả:** Tự tổng hợp trực tiếp bằng Web Audio API trong [`src/game/sound.ts`](src/game/sound.ts) theo thang âm ngũ cung.
- **Giấy phép:** CC0 / tự tạo cho dự án này.
- **Đặc điểm:** Âm thanh ngắn cho bắn, trúng đích, khắc hệ, quái nổ, mất mạng thành, đặt/nâng cấp quân và gọi đợt quái; không tải tệp MP3/WAV ngoài, không gọi mạng.

## 3. Thư viện mã nguồn mở
- **Phaser 3** (`phaser`) — MIT License — Engine game 2D Canvas/WebGL.
- **Vite** (`vite`) — MIT License — Công cụ đóng gói web tĩnh offline.
- **TypeScript** (`typescript`) — Apache-2.0 License.
- **Vitest** (`vitest`) — MIT License — Bộ kiểm thử đơn vị tự động.
- **Playwright** (`@playwright/test`) — Apache-2.0 License — Bộ kiểm thử trình duyệt tự động offline (`npm run test:e2e`).
