# Lộ trình Gọn Phố (bản chép từ trang lộ trình, cập nhật 24/11/2026 (khuya))

Game công khai: https://giang-ho-ai.pages.dev · Kế hoạch chi tiết: docs/PLAN.md · Các lần rà: docs/REVIEW_LOG.md


## Chặng 1: Nền tảng game
_Thủ thành ngũ hành giữ tiệm, chơi được trên điện thoại._

- ✅ Xong — Phố Dốc: 3 tiệm (giày, bánh, hoa) + trùm Bão Lốc · Claude + Antigravity
- ✅ Xong — Ngũ hành khắc chế, tương sinh, chuỗi, tuyệt chiêu bậc 4 · Claude + Antigravity
- ✅ Xong — Trang bị chủ tiệm 10 món, 4 bộ đồ · Claude + Antigravity
- ✅ Xong — Xe đi phố: 7 xe, tác dụng + chiêu 1 lần mỗi màn · Claude + Spark
- ✅ Xong — Cài ra màn hình điện thoại như app, chơi không cần mạng · Claude
- ✅ Xong — Đổi tên game thành Gọn Phố · Anh Kha chốt

## Chặng 2: Phố Đà Lạt thật
_Mỗi phố: các màn tiệm rồi màn phố đánh trùm. Tập trung Đà Lạt._

- ✅ Xong — Tăng Bạt Hổ (10 tiệm), Phố Cà Phê (8), Phan Đình Phùng (8) + 3 màn phố · Claude + Spark + Antigravity
- ✅ Xong — Màn phố: quái ngoài đường + đồ dọn phố · Claude + Spark
- ✅ Xong — Nguồn cho từng tiệm (12 chắc, 14 nên kiểm) · Claude
- ⬜ Chưa làm — Chụp biển tiệm khi đi ngang để xác nhận 14 tiệm nên kiểm · Anh Kha
- ✅ Xong — 3 phố mới: Kem Bơ Nguyễn Văn Trỗi (9 tiệm), Lẩu Bò Hoàng Diệu (9), Trần Phú – Ba Tháng Hai (8) + 3 màn phố · Claude
- ✅ Xong — Agent tạo màn: tên phố → màn đã cân độ khó, có nguồn, tự vẽ nền · Claude
- ✅ Xong — Hình riêng cho 3 trùm mới + món đặc sản (đợt 17–20) · Spark
- ✅ Xong — 52 tiệm chơi trong phòng, 18 kiểu phòng theo loại tiệm (nội thất Spark đợt 25–29) · Claude + Spark
- ✅ Xong — Chiêu thức đẹp, đa dạng hơn (ráp 15 hình hiệu ứng Spark) · Claude + Spark
- ✅ Xong — 6 món + 11 mặt tiền tiệm còn thiếu hình (đợt 30) · Spark
- 🟡 Đang làm — Màn phố (đánh trùm) 6 phố đồng bộ nét Spark: đường liền mạch, mặt tiền chính các tiệm của phố dọc 2 bên · Claude + Spark (đợt 31)
- 🟡 Đang làm — Hiệu ứng chiêu xe (7 xe) · Spark đợt 31 + Claude

## Chặng 3: Gọn giao diện cho người mới
_Nhìn vào là chơi ngay, ít chữ, cần thì bấm ?._

- ✅ Xong — Màn chính: bản đồ Đà Lạt thật, ghim đúng vị trí phố · Claude
- ✅ Xong — Nút biểu tượng (nhạc, tiếng, 🎒, ?), chạm hình xem tên · Claude
- ✅ Xong — Hướng dẫn bằng hình (5 trang, mỗi trang 1–2 câu) · Claude
- ✅ Xong — Bước Chuẩn bị: chọn xe + 6 món cùng lúc · Claude
- ✅ Xong — Gọn chữ trong màn chơi · Claude
- ✅ Xong — Biểu tượng nút + hình góc phố trên bản đồ (đợt 16) · Spark
- ✅ Xong — Mẹo 1 dòng khi gặp thứ mới lần đầu · Claude
- ✅ Xong — Bản đồ sinh động (rừng thông, nhà, khu chợ, thẻ góc phố) + hàng tiệm đồng bộ · Claude + Spark
- ✅ Xong — Bấm giữ chữ Gọn Phố 3 giây: mở hết màn để xem thử · Claude
- ✅ Xong — Bảng trang bị gọn chữ (chỉ hình + số) · Claude
- ✅ Xong — Bảng thắng / thua gọn (▶ tiệm kế, ↻, 🏠), chỉ số món bằng biểu tượng, nền phủ kín màn hình dài · Claude
- ⏳ Chờ anh — Antigravity đánh giá lại game + lộ trình · Anh Kha gửi khối

## Chặng 4: Người thật chơi thử
_Có link công khai; người chơi đến dần qua video và LIVE, góp ý qua bình luận._

- ✅ Xong — Đưa game lên Cloudflare Pages: giang-ho-ai.pages.dev (tài khoản Gọn) · Anh Kha + Claude
- ✅ Xong — Chỉ phát hành khi anh nhắn "phát hành" (nhánh phat-hanh) · Claude
- ✅ Xong — Góp ý lấy từ bình luận video và LIVE · Anh Kha chốt
- ⏳ Chờ anh — Đếm người chơi ẩn danh · Anh Kha
- ✅ Xong — 💾 Mã lưu chuyển máy + nhắc đưa ra màn hình chính · Claude

## Chặng 5: Video kênh Gọn
_Làm sau khi game hoàn thiện (anh Kha chốt 24/11). Clip 15–30 giây máy tự chơi, anh duyệt từng bài._

- ✅ Xong — Công cụ quay video máy tự chơi + 3 clip thử · Claude
- ✅ Xong — Quay được mọi màn (62 màn), máy tự chơi thắng 62/62 · Claude
- ⬜ Chưa làm — Clip có tiếng trong game · Claude
- ⬜ Chưa làm — Bắt đầu đăng lên @gon.simpli (đã có link chơi công khai) · Anh Kha duyệt

## Chặng 6: LIVE TikTok @gon.simpli
_Sau khi đăng video một thời gian, kênh ổn mới lên LIVE. Luôn có người thật lúc LIVE._

- ✅ Xong — Chế độ LIVE trong game: máy tự chơi nối màn, tim / quà giúp tiệm, bảng người xem, nút Máy / Người · Claude
- ⏳ Chờ anh — Bộ đọc tim, quà, bình luận thật (máy Mac của anh) · Chờ kênh ổn, anh nói làm
- ⬜ Chưa làm — Hướng dẫn gắn vào LIVE Studio / OBS · Claude
- ⬜ Chưa làm — Kênh đủ điều kiện LIVE (có mục LIVE khi bấm ＋) · Anh Kha xem

## Chặng 7: Kiếm tiền nhẹ nhàng
_Món là sản phẩm thật, nút Xem món này ra link Shopee của anh._

- ✅ Xong — Nghiên cứu điều khoản Shopee + luật quảng cáo · Claude
- ⬜ Chưa làm — Đăng ký game là kênh tiếp thị với Shopee · Anh Kha
- ⬜ Chưa làm — Nút Xem món này + nhãn quảng cáo · Claude
- ⬜ Chưa làm — Trang bị theo mẫu thật Hải Nancy, Yen Handmade Leather · Anh Kha quyết

## Chặng 8: Mở rộng
_Thành phố khác, màn theo thời sự, chợ ứng dụng._

- ⏳ Chờ anh — Phố Chợ Bến Thành (Sài Gòn): làm xong, đang cất · Anh Kha mở lại khi muốn
- ⬜ Chưa làm — Màn sự kiện theo thời sự (bão, ngập, nắng nóng, lễ hội) · Claude + Spark, anh duyệt
- ⬜ Chưa làm — Chế độ Vô tận · Claude
- ⬜ Chưa làm — Lên Google Play / App Store · Anh Kha quyết
- ⬜ Chưa làm — Game online, tài khoản, trao đổi đồ — hỏi luật sư trước (Nghị định 147/2024 cấm mua bán vật phẩm ảo giữa người chơi; game online cần giấy phép) · Anh Kha quyết
