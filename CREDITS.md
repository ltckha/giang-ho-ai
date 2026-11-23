# CREDITS — Nguồn hình ảnh, âm thanh, phông chữ và công nghệ

Toàn bộ tài nguyên trong **Gọn Tiệm, Sạch Phố — Ngũ hành giữ tiệm** đều tự tạo hoặc sử dụng giấy phép mở (OFL / MIT / Apache-2.0), đóng gói chạy **100% offline** trong `dist/`, không tải tài nguyên từ mạng ngoài khi chơi, không sử dụng tên thương hiệu hay hình ảnh của bất kỳ trò chơi / công ty nào có thật.

---

## 1. Đồ họa (Hình ảnh & Sprite Atlas)
- **Tác giả / Công cụ:**
  - Toàn bộ hình vẽ gốc theo nét hoạt hình ấm cúng Đà Lạt ngày mưa được tạo bằng công cụ sinh ảnh tích hợp của Antigravity (`generate_image`), sau đó tách nền trong suốt, vẽ riêng từng bậc nâng cấp (20 hình riêng cho Màn 1 + 20 hình cho Màn 3 + bộ nâng cấp Màn 2), vẽ riêng từng quái & toàn bộ biểu tượng Ngũ Hành / xu / ví / đôi giày / ổ bánh mì / chậu hoa, ghép nền bản đồ vector SVG cho cả 3 màn khớp chính xác toạ độ đường đi và các ô đặt món, rồi nén đóng gói thành Texture Atlas WebP bằng các kịch bản [`scripts/build_stage1_v2_map.py`](scripts/build_stage1_v2_map.py), [`scripts/build_stage1_v2_atlas.py`](scripts/build_stage1_v2_atlas.py), [`scripts/build_stage2_map.py`](scripts/build_stage2_map.py), [`scripts/build_stage2_atlas.py`](scripts/build_stage2_atlas.py), [`scripts/build_stage3_map.py`](scripts/build_stage3_map.py), [`scripts/build_stage3_atlas.py`](scripts/build_stage3_atlas.py) và [`scripts/build_gear_atlas.py`](scripts/build_gear_atlas.py) (Python 3 + Pillow + SVG render qua Playwright Chromium `scripts/render_svgs.mjs`).
  - Các đạo cụ bản đồ (kệ giày gỗ 3 tầng đèn vàng, ghế thử giày, giỏ ô, bàn hộp giày, tủ kính bánh, bao bột, giỏ bánh mì, luống hoa cẩm tú cầu, kệ nhà kính, giàn hoa trưng bày, thảm cói đặt món), hình **Chủ tiệm Đà Lạt mặc đúng trang bị** ([`src/game/shopkeeperAvatar.ts`](src/game/shopkeeperAvatar.ts)), 19 biểu tượng dòng thuộc tính vui ([`src/game/gearUiHelpers.ts`](src/game/gearUiHelpers.ts)), 2 hình rương quà & 4 huy hiệu bộ đồ được vẽ vector SVG theo cùng nét viền nâu đậm `#2b1a12` và bảng màu ấm.
- **Giấy phép:** CC0 / tự tạo cho dự án này.
- **Các tệp sản phẩm trong bản build:**
  - [`public/assets/gon_tiem_atlas.webp`](public/assets/gon_tiem_atlas.webp) + [`public/assets/gon_tiem_atlas.json`](public/assets/gon_tiem_atlas.json) (288 khung hình: 5 món Màn 1 + 5 món Màn 2 + 5 món Màn 3 × 4 bậc/nhánh × 3 khung hoạt ảnh đánh, 7 quái Màn 1 + 6 quái Màn 2 + 6 quái Màn 3 + Trùm Mùa Nồm 3 màu theo hành Thủy/Mộc/Kim × 4 khung đi, 5 biểu tượng hành `el_*`, thảm cói, kệ giày, kệ bánh, giàn hoa, chiếc ví, tiền xu, đôi giày, ổ bánh mì, chậu hoa, đạn dép tông & gói hút ẩm).
  - [`public/assets/gear_atlas.webp`](public/assets/gear_atlas.webp) + [`public/assets/gear_atlas.json`](public/assets/gear_atlas.json) (56 khung hình: 50 biểu tượng trang bị chủ tiệm 10 loại × 5 hành khớp `GEAR_NAMES`, 2 hình rương quà đóng/mở khi thắng màn và 4 huy hiệu bộ đồ `set_di_mua`, `set_phuot`, `set_van_phong`, `set_chu_tiem_xin`).
  - [`public/assets/map_man1_tiem_giay.webp`](public/assets/map_man1_tiem_giay.webp) (nền vector vẽ lại Màn 1 **Tiệm Giày Hẻm Dốc** 720×960 khớp 100% đường chữ S và 9 ô đặt món).
  - [`public/assets/map_man2_tiem_banh.webp`](public/assets/map_man2_tiem_banh.webp) (nền vector Màn 2 **Tiệm Bánh Đầu Phố** 720×1040 = 2× khung 360×520 khớp 100% 2 ngả đường vòng quanh quầy bánh và 10 ô đặt món).
  - [`public/assets/map_man3_tiem_hoa.webp`](public/assets/map_man3_tiem_hoa.webp) (nền vector Màn 3 **Tiệm Hoa Cuối Dốc** 720×1040 = 2× khung 360×520 khớp 100% 2 cửa vào độc lập, lối hợp ngả, giàn hoa trưng bày và 11 ô đặt món).
  - [`public/assets/streets_atlas.webp`](public/assets/streets_atlas.webp) + [`public/assets/streets_atlas.json`](public/assets/streets_atlas.json) (294 khung hình sinh từ [`scripts/build_streets_atlas.py`](scripts/build_streets_atlas.py): 18 món đặc trưng × 4 bậc × 3 khung đánh + 14 quái phố thật × 4 khung đi cho Phố Tăng Bạt Hổ – Trương Công Định và Phố Cà Phê, Trùm Bão Lốc Cuối Mùa 5 hành × 4 khung đi, biểu tượng đèn phố `icon_street_life` và huy hiệu vàng `icon_badge_giu_tron_pho`).
  - [`public/assets/map_trum_pho.webp`](public/assets/map_trum_pho.webp) (nền vector Trận Trùm Phố **Dốc Đà Lạt** 720×1040 đi qua 3 tiệm, trời giông tối), [`public/assets/map_street_tang_bat_ho.webp`](public/assets/map_street_tang_bat_ho.webp), [`public/assets/map_street_pho_ca_phe.webp`](public/assets/map_street_pho_ca_phe.webp) và [`public/assets/map_street_phan_dinh_phung.webp`](public/assets/map_street_phan_dinh_phung.webp) (3 nền vector phố thật Đà Lạt 720×1040 sinh từ [`scripts/build_street_maps.py`](scripts/build_street_maps.py), bám đúng hình học đường phố từ dữ liệu **© OpenStreetMap contributors** — ODbL).
  - [`src/game/shopStreetArt.ts`](src/game/shopStreetArt.ts) & [`src/game/brandLogo.ts`](src/game/brandLogo.ts) (mặt tiền Con phố dốc Đà Lạt, Trùm Phố, Bản đồ Đà Lạt chọn 2 phố thật, cửa cuốn khóa & logo bản vuông **"Gọn Tiệm, Sạch Phố"** tự vẽ vector SVG).
  - [`public/icons/`](public/icons/) (`icon-512.png`, `icon-192.png`, `apple-touch-icon-180.png`, `favicon-32.png`) sinh từ [`scripts/build_icons.mjs`](scripts/build_icons.mjs).
  - [`public/og-image.png`](public/og-image.png) (ảnh chia sẻ link 1200×630) và [`docs/marketing/`](docs/marketing/) (`logo_vuong_1080.png` 1080×1080 + 3 ảnh bìa video dọc 1080×1920 `cover_01_dat_sai_mon.png`, `cover_02_trung_tu.png`, `cover_03_trum_doi_hanh.png`) sinh từ [`scripts/build_marketing_assets.mjs`](scripts/build_marketing_assets.mjs).

---

## 2. Âm thanh & Nhạc nền
- **Tác giả:** 100% tự tạo, tổng hợp trực tiếp bằng Web Audio API trong [`src/game/sound.ts`](src/game/sound.ts) (tiếng hiệu ứng) và [`src/game/music.ts`](src/game/music.ts) (nhạc nền nhẹ âm giai ngũ cung).
- **Giấy phép:** CC0 / tự tạo cho dự án này.
- **Đặc điểm:** Không dùng bất kỳ tệp nhạc hay âm thanh ngoài (MP3/WAV/OGG) nào, chạy 100% offline:
  - **Nhạc nền nhẹ Web Audio (5 giai điệu ngũ cung riêng):** Màn hình đầu Con phố dốc (*Phố Dốc Chiều Mưa*), Tiệm Giày (*ấm áp*), Tiệm Bánh (*vui tươi*), Tiệm Hoa (*trong trẻo*) và Trận Trùm Mùa Nồm (*nhịp dồn kịch tính*). Âm lượng nhỏ hơn tiếng hiệu ứng, chỉ phát sau lần chạm đầu tiên của người chơi, có nút tắt **Nhạc** riêng với nút tắt **Tiếng** và lưu trên máy.
  - **Tiếng hiệu ứng (SFX):** bắn, trúng đòn, "Trúng tủ!", dọn quái, Trùm đổi hành, mất mạng, đặt/nâng món, gọi đợt, mở khóa & tung 5 tuyệt chiêu Bậc 4 theo vai, mở rương trang bị và thắng màn.

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
