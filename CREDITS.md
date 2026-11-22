# CREDITS — Nguồn hình ảnh, âm thanh, phông chữ và công nghệ

Toàn bộ tài nguyên trong **Gọn Tiệm, Sạch Phố — Ngũ hành giữ tiệm** đều tự tạo hoặc sử dụng giấy phép mở (OFL / MIT / Apache-2.0), đóng gói chạy **100% offline** trong `dist/`, không tải tài nguyên từ mạng ngoài khi chơi, không sử dụng tên thương hiệu hay hình ảnh của bất kỳ trò chơi / công ty nào có thật.

---

## 1. Đồ họa (Hình ảnh & Sprite Atlas)
- **Tác giả / Công cụ:**
  - Hình vẽ gốc theo nét hoạt hình ấm cúng Đà Lạt ngày mưa được tạo bằng công cụ sinh ảnh tích hợp của Antigravity (`generate_image`), sau đó tách nền trong suốt, chỉnh chuẩn giải phẫu (Con Gián 2 râu dài thân dẹt, lồng quạt điện trong suốt), tạo khác biệt 3 bậc & 2 nhánh bậc 3, tạo hoạt ảnh 3–4 khung hình, ghép nền bản đồ Màn 1 & Màn 2 khớp chính xác toạ độ đường đi và các ô đặt món, rồi nén đóng gói thành Texture Atlas WebP bằng kịch bản [`scripts/build_art_assets.py`](scripts/build_art_assets.py), [`scripts/build_stage2_map.py`](scripts/build_stage2_map.py) và [`scripts/build_stage2_atlas.py`](scripts/build_stage2_atlas.py) (Python 3 + Pillow + SVG).
  - Các biểu tượng hành Ngũ Hành, tiền xu, chiếc ví, đôi giày lành, ổ bánh mì lành, Nắng Gắt, Nấm Mốc, Trùm Mùa Nồm và đạo cụ quầy bánh được vẽ bằng mã nguồn 4× SSAA (Pillow / SVG) theo đúng cùng nét viền nâu đậm `#2b1a12` và bảng màu.
- **Giấy phép:** CC0 / tự tạo cho dự án này.
- **Các tệp sản phẩm trong bản build:**
  - [`public/assets/gon_tiem_atlas.webp`](public/assets/gon_tiem_atlas.webp) + [`public/assets/gon_tiem_atlas.json`](public/assets/gon_tiem_atlas.json) (190 khung hình: 5 món Màn 1 + 5 món Màn 2 × 4 bậc/nhánh × 3 khung hoạt ảnh bắn, 6 quái Màn 1 + Gián Con + Trùm Mùa Nồm + 6 quái Màn 2 × 4 khung đi, 5 biểu tượng hành, thảm cói đặt món, kệ giày gỗ, kệ bánh gỗ, chiếc ví, tiền xu, đôi giày lành, ổ bánh mì lành, đạn dép tông & gói hút ẩm).
  - [`public/assets/map_man1_tiem_giay.webp`](public/assets/map_man1_tiem_giay.webp) (nền Màn 1 **Tiệm Giày Hẻm Dốc** 720×960 khớp 100% đường quái và 9 ô đặt món).
  - [`public/assets/map_man2_tiem_banh.webp`](public/assets/map_man2_tiem_banh.webp) (nền Màn 2 **Tiệm Bánh Đầu Phố** 720×1040 = 2× khung 360×520 khớp 100% 2 ngả đường vòng quanh quầy bánh và 10 ô đặt món).

---

## 2. Âm thanh
- **Tác giả:** Tự tổng hợp trực tiếp bằng Web Audio API trong [`src/game/sound.ts`](src/game/sound.ts).
- **Giấy phép:** CC0 / tự tạo cho dự án này.
- **Đặc điểm:** Không tải tệp MP3/WAV từ mạng ngoài, chạy hoàn toàn offline cho các hiệu ứng bắn, trúng đòn, "Trúng tủ!", dọn quái, bẩn giày, đặt/nâng món, gọi đợt và thắng màn.

---

## 3. Phông chữ tiếng Việt (Cài sẵn offline trong bản build)
- **Be Vietnam Pro** (Regular 400 & Bold 700 — bộ ký tự `vietnamese` + `latin`, dạng `.woff2` trong `src/assets/fonts/`):
  - Nguồn gói mở: `@fontsource/be-vietnam-pro` (tác giả: Better Studio / Be Vietnam Pro Project Authors).
  - Giấy phép: **SIL Open Font License 1.1 (OFL-1.1)**.
- **Noto Serif** (Bold 700 — bộ ký tự `vietnamese` + `latin`, dạng `.woff2` trong `src/assets/fonts/`):
  - Nguồn gói mở: `@fontsource/noto-serif` (Google Noto Fonts Project Authors).
  - Giấy phép: **SIL Open Font License 1.1 (OFL-1.1)**.

---

## 4. Thư viện mã nguồn mở
- **Phaser 3** (`phaser`) — MIT License — Engine game 2D Canvas/WebGL.
- **Vite** (`vite`) — MIT License — Công cụ đóng gói web tĩnh offline.
- **TypeScript** (`typescript`) — Apache-2.0 License.
- **Vitest** (`vitest`) — MIT License — Bộ kiểm thử đơn vị tự động.
- **Playwright** (`@playwright/test`) — Apache-2.0 License — Bộ kiểm thử trình duyệt tự động offline (`npm run test:e2e`).
