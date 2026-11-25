# Quy chuẩn quay & vận hành video MXH — Gọn Phố (anh Kha gửi 26/11/2026)

Claude ghi lại theo bản anh dán, chỉnh cho khớp game Gọn Phố (thủ thành ngũ hành giữ tiệm). Thay quyết định cũ "cuối video có link + QR chơi game": **nay không gắn link chơi / tải** (Giai đoạn 1 thử nội bộ, `docs/PHAT_HANH.md`).

## 1. Công thức clip 30–45 giây
- **3 giây đầu:** khoảnh khắc cao trào nhất. Ví dụ: tung chiêu dọn cả đàn quái, trùm phố ập tới, "Trúng tủ!" liên hoàn, đợt cuối còn 1 điểm giữ tiệm.
- **Âm thanh:**
  - **Nhạc nền game là nhạc tự soạn trong code** (Claude kiểm 26/11: `src/game/music.ts` tạo nốt bằng Web Audio, 5 giai điệu ngũ cung viết tay, không có file nhạc / mẫu âm thanh nào lấy từ ngoài; tiếng hiệu ứng ở `src/game/sound.ts` cũng tự tạo). Không lo bản quyền → quay giữ nhạc game được.
  - Quay bằng `?quay=<mã màn>`: giữ nhạc game + tiếng hiệu ứng. Muốn ghép nhạc thịnh hành từ thư viện TikTok / YouTube Audio Library / Meta thì thêm `&nhac=0` (tắt nhạc game, vẫn giữ tiếng hiệu ứng).
- **Câu hỏi kéo bình luận** (không kêu gọi tải game). Hỏi về chính màn chơi:
  - "Đặt Nồi Nước Lèo ngay cửa hay để sau quầy thì giữ quán phở lâu hơn?"
  - "Quái hành Thủy tràn vào, mọi người chọn món Thổ nào để khắc?"
  - "Phố tiếp theo nên là phố nào ở Đà Lạt?"
- **Nhận diện:** chế độ quay tự hiện **logo Gọn + tên kênh @gon.simpli** mờ ở góc khung hình (anh Kha 26/11: quảng bá hệ sinh thái Gọn, không ghi tên game).

## 2. Ranh giới trên khung hình
- Không đặt link tải APK / TestFlight / link web chơi tự do / nút Download ở bio, mô tả, bình luận ghim.
- Khung hình sạch: game không có cửa hàng, nạp tiền hay gói vật phẩm. "Xu" trong màn là tiền trong trận, không mua bằng tiền thật.
- Phông chữ trong game: Be Vietnam Pro, Noto Serif (Google Fonts, OFL).
- Tên tiệm trong game là tên đặt lại (loại quán + chữ Đà Lạt), không dùng tên, biển hiệu quán thật. Bản đồ Việt Nam đang tạm ẩn.

## 3. Mẫu trả lời bình luận
- **Hỏi tên game:** "Game tên là **Gọn Phố** nhé bạn, dự án game 2D lấy cảm hứng từ góc phố Đà Lạt mình đang tự phát triển!"
- **Hỏi link / muốn chơi thử:** "Cảm ơn bạn đã quan tâm **Gọn Phố** nha! Hiện game vẫn đang trong giai đoạn mình tự hoàn thiện các màn chơi và thử nghiệm nội bộ cùng bạn bè, chưa mở tải công khai. Bạn theo dõi kênh để cập nhật tiến độ và đón bản ra mắt chính thức nhé!"
- **Tin nhắn xin file:** không gửi file `.apk` hay mã mời cho người lạ qua Zalo, Messenger, Telegram.
