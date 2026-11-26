# Bản quốc tế: Little Shops of Dalat

Anh Kha chốt ngày 26/11/2026: làm bước 1 và đặt tên tiếng Anh hẳn là **Little Shops of Dalat**. Trước khi chọn, đã tìm trên mạng và không thấy game nào trùng tên.

## Người chơi thấy gì
- Cùng 1 game, cùng 1 link. Nút **EN / VI** ở góc trên màn chính đổi tiếng; đổi xong trang mở lại theo tiếng mới.
- Lần đầu mở, game tự chọn tiếng (`src/game/i18n.ts` → `detectLang`). Thứ tự xét như sau, gặp điều kiện nào trước thì dùng điều kiện đó:
  1. Link có `?lang=en` hoặc `?lang=vi`.
  2. Tiếng người chơi đã chọn trước đó.
  3. Bản Việt Nam (`VITE_REGION=vn`).
  4. Máy đã có tiến độ chơi (người chơi cũ).
  5. Máy chạy thử tự động, đang quay video hoặc LIVE.
  6. Máy để giờ Việt Nam.

  Các trường hợp 3–6 đều cho **tiếng Việt**. Không rơi vào trường hợp nào thì dùng **tiếng của máy**: máy tiếng Việt ra tiếng Việt, còn lại ra tiếng Anh.
- Tên đường, phường thật và tên món ăn Việt giữ chữ Việt có dấu. Tên tiệm, phố, quái, đồ, chiêu do game tự đặt thì dịch sang tiếng Anh.
- Chữ vẽ sẵn trên ảnh (bảng tên phố, nhãn bản đồ Đà Lạt) giữ tiếng Việt vì đó là tên đường thật.
- Người chơi tiếng Việt không phải tải thêm gì. Từ điển tiếng Anh (khoảng 48 kB nén) là tệp riêng, chỉ tải khi chọn English.

## Cách chạy (cho người sửa code)
- Game vẫn viết chữ tiếng Việt như cũ. Khi chọn English, `src/game/i18n.ts` canh toàn trang và thay mỗi đoạn chữ, `title`, `aria-label`, hộp `alert` / `confirm` bằng bản dịch trong `src/i18n/en.json`. Chữ không nằm trên trang (vẽ lên ảnh QR, chia sẻ, email) thì bọc `tr('…')`.
- Khoá có `{0}`, `{1}` là mẫu cho chữ có số hoặc tên chen giữa. Phần chen giữa cũng được dịch.
- Chữ code tự ghép bằng tay (`'Tên: ' + mô tả`, `Mũ (Tốt, Mộc)`, `Sức 4%`) được cắt theo dấu nối rồi dịch từng mảnh.
- Chữ Việt không dấu (Kim, Xu, Tim, Sinh, Kem, Hoa, Atiso) nằm trong danh sách riêng, `ASCII_KEYS` trong i18n.ts và `ASCII_VN` trong extract.cjs; thêm chữ mới phải sửa cả hai chỗ.

## Thêm chữ mới / phố mới
1. `node tools/i18n/extract.cjs` để in số khoá còn thiếu và ghi `tools/i18n/missing.json`.
2. Dịch theo `tools/i18n/GLOSSARY.md`; cùng 1 tên luôn dịch giống nhau. Thêm vào `src/i18n/en.json`.
3. `npx vitest run`: còn thiếu bản dịch hoặc bản dịch mất `{0}` thì báo lỗi.
4. Xem thử với `?lang=en`. Quét chữ sót bằng cách mở các màn với `?lang=en`, gom chữ còn dấu tiếng Việt.

## Bước tiếp (chưa làm)
- Bước 2: 3–5 người nước ngoài chơi thử bằng mã mời.
- Bước 3: đóng gói app quốc tế (giai đoạn 2 trong `docs/PHAT_HANH.md`), với tên cửa hàng, ảnh, mô tả tiếng Anh và nhãn tuổi (IARC trên Google Play, bảng hỏi riêng của Apple).
- Thẻ chia sẻ mạng xã hội (`og:` trong index.html) vẫn bằng tiếng Việt. Khi có link riêng cho bản quốc tế thì làm thêm bản tiếng Anh.
