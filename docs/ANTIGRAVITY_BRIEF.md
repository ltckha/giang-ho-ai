# Lời giao Antigravity: Giai đoạn 1

Đọc docs/PLAN.md trước (nhất là mục Bối cảnh: giang hồ cổ trang có khôi lỗi biết nghĩ). Làm Giai đoạn 1 trong repo này, không đụng repo nào khác.

## Bắt buộc
1. Game mới hoàn toàn. Không dùng tên, bản đồ, môn phái, nhân vật, hình, nhạc, giao diện của Võ Lâm Truyền Kỳ hay bất kỳ game nào khác. Không dùng tên môn phái có trong tiểu thuyết Kim Dung.
2. Trước khi vẽ hình: ghi danh sách tên (game, 3 môn phái, thành, vùng, trùm, 3 đồng đội AI, chiêu thức) vào docs/NAMES.md, commit, rồi chờ Claude rà. Chỉ vẽ hình khi docs/REVIEW_LOG.md có dòng "NAMES: ĐỒNG Ý"; trong lúc chờ được làm phần khung code chưa dùng tên.
3. Kỹ thuật: Phaser 3 + TypeScript + Vite, build ra web tĩnh trong dist/ (mở offline được, không gọi mạng lúc chơi).
4. Hình / âm thanh tự tạo hoặc CC0, ghi nguồn trong CREDITS.md.
5. Không thêm khoá API, dịch vụ trả phí, quảng cáo, theo dõi người chơi.

## Phạm vi Giai đoạn 1
- 1 thành, 1 rừng, 1 hang có trùm.
- 3 môn phái, mỗi phái 4 chiêu, ngũ hành khắc chế. Mỗi phái một cách đối xử với khôi lỗi (bạn đồng hành / công cụ / muốn phá hết).
- Trùm hang: khôi lỗi đầu tiên tỉnh dậy, đòi tự quyết mạng mình.
- Đánh quái, lên cấp, nhặt trang bị, bán đồ.
- 3 đồng đội AI là 3 khôi lỗi (người máy gỗ và đồng, chạy bằng linh thạch), tính cách khác nhau (liều / cẩn thận / tham đồ), hành vi bằng cây quyết định: xông vào, lùi, hồi máu đồng đội, nhặt đồ.
- Tự lưu tiến độ (localStorage), điều khiển chạm + bàn phím.

## Cách nộp
- Commit nhỏ, thường xuyên; mỗi mốc chơi được thì ghi docs/PROGRESS.md: làm được gì, cách chạy (npm install && npm run build), ảnh chụp màn hình trong docs/screenshots/.
- Có test cho phần AI đồng đội và phần tính sát thương / ngũ hành.
- Xong Giai đoạn 1 thì ghi "GĐ1 XONG" đầu docs/PROGRESS.md.
