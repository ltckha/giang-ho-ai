# Bàn giao: BẢN ĐỒ PHỐ VIỆT NAM (ý tưởng anh Kha, 25/11/2026)

Ý tưởng sinh ra từ game Gọn Phố. Anh Kha muốn làm thành **sản phẩm riêng**, ở kho riêng, có phiên Claude riêng phát triển.

## Sản phẩm là gì
- Bản đồ **thực tế**: ghi **đúng tên đường thật** (OpenStreetMap). Kéo đi được trên điện thoại.
- Mỗi con đường nổi bật có một **trang "phố"** kiểu trong game. Trang này giới thiệu đặc trưng của đường: phố cà phê, phố lẩu bò, phố di sản… kèm tranh đầu phố và các địa điểm tiêu biểu.
- Chia theo **địa giới mới** (từ 1/7/2025): Việt Nam → 34 tỉnh/thành → phường/xã → đường → địa điểm.
- Bắt đầu với Lâm Đồng · Đà Lạt (đã có 6 phố nghiên cứu kỹ), mở dần ra các tỉnh khác.
- Game Gọn Phố sau này lấy dữ liệu từ sản phẩm này (tên đường, phường, giới thiệu), không làm ngược lại.

## Đã có sẵn (kho ltckha/giang-ho-ai, chỉ đọc)
- **Nghiên cứu địa giới:** `docs/research/dia_gioi_2025.md`.
  - Gồm NQ 202/2025/QH15, Luật 72/2025/QH15, NQ 1671/NQ-UBTVQH15, có link nguồn.
  - Đã ghép 9 đường của Đà Lạt vào phường mới; 4 đường còn ghi "chưa kiểm".
- **Danh sách 34 tỉnh/thành và thông tin phố:** `src/core/cities.ts`.
  - `PROVINCES` có miền và đánh dấu thành phố trực thuộc trung ương.
  - `STREET_INFO` cho mỗi phố: tên đường thật, phường, tên phố, câu giới thiệu.
- **Dữ liệu đường OpenStreetMap của Đà Lạt:** `docs/research/streets/`.
  - `osm_dalat_trung_tam.json`: đường chính, mặt nước, mốc.
  - `osm_ways_*.json`, `osm_nguyen_van_troi.json`, `osm_hoang_dieu.json`, `osm_tran_phu.json`.
  - Mỗi địa điểm trong `content/streets/*.json` có tên, loại, đặc trưng, nguồn (≥2) và độ tin cậy.
- **Công cụ vẽ bản đồ:** `tools/level-maker/make_big_map.py`.
  - Dùng đường thật, tỉ lệ 0,4 điểm/mét, có tên đường chạy dọc đường, tên phường, mốc, sương ở vùng chưa mở.
  - Ra file `public/assets/map_dalat_lon.webp` và `src/core/streets/bigMapPins.json`.
- **Giao diện kéo bản đồ và trang phố** (cách làm tham khảo): `src/scenes/TitleScene.ts`.
  - `renderStreetTabs`: kéo bằng 1 ngón, kéo quá 6 điểm thì không tính là bấm.
  - `renderStreetHead`: tranh đầu phố, đường, phường, giới thiệu.
- **Hình Spark** (cùng một nét vẽ hoạt hình ấm, viền nâu): `art/ban_do/`.
  - Mốc Đà Lạt, nền cỏ/nước/sương/đất, bảng tên phố, ghim, 7 tranh đầu phố.
  - Đợt 36 đã giao Spark (bản đồ Việt Nam, mốc 6 thành phố trực thuộc trung ương và các tỉnh du lịch, nền cho thành phố sau): `docs/spark/dot36_viet_nam.md`, thư mục Drive `Spark/Inbox/Game_ve_thu/dot36_viet_nam/`.

## Luật làm việc với anh Kha
- Luật chung nằm ở `~/Developer/Ecosystem-Hub/docs/SHARED_RULES.md`.
- **Cách nói chuyện:**
  - Xưng em, gọi anh; tiếng Việt thường ngày.
  - Tin ngắn, kết luận trước; việc anh phải làm để cuối tin.
  - Hỏi dạng trắc nghiệm có "(Đề xuất)".
- **Khi nào phải chờ anh nói "làm":** việc mới, việc tốn tiền, tải phần mềm, hay đụng hệ thống đang chạy. Soạn kế hoạch ngắn rồi chờ. Nghiên cứu thì cứ làm.
- **Số liệu:** số thật, có nguồn; không biết thì nói không biết.
- **Bí mật:** không đưa khoá, mật khẩu, token vào kho.
- **Chỗ đưa lên mạng:** tài khoản Cloudflare "Gọn" (không phải "Giày Hải Nancy"), Cloudflare Pages.
- **Nhờ Spark (Gemini) vẽ:** soạn 1 khối để anh dán, câu mở đầu là "nét vẽ y hệt đợt trước". Đừng bắt Spark mở Drive xem mẫu, Spark không mở được.

## Bước 1 gợi ý (soạn kế hoạch, chờ anh "làm")
1. Trang web điện thoại: bản đồ Lâm Đồng · Đà Lạt kéo được, có tên đường thật, bấm đường thì ra trang phố.
2. Dữ liệu tách thành file JSON theo tầng: tỉnh → phường → đường → địa điểm. Mỗi mục có nguồn.
3. Kiểm 4 đường còn "chưa kiểm" phường.
4. Ráp hình Spark đợt 36 khi anh báo "Spark xong 36".
