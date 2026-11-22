# Kế hoạch: game kiếm hiệp có nhân vật AI, chơi offline (N73)
Soạn: Điều phối, 22/11/2026. Anh Kha nói "làm" 22/11. Phiên cloud Giang Hồ AI giao Antigravity cloud và rà kết quả.

## Kết luận
- Game kiếm hiệp hoàn toàn mới, không chép Võ Lâm Truyền Kỳ. 2D nhìn từ trên xuống, chơi trên trình duyệt (điện thoại + máy tính), không cần mạng, 0 đồng.
- Đồng đội và đối thủ là nhân vật AI: tự đánh, tự nhặt đồ, theo tổ đội, có tính cách riêng.
- 3 giai đoạn; Giai đoạn 1 nhỏ để chắc có bản chơi được.

## Bối cảnh (anh Kha chốt 22/11)
- Giang hồ cổ trang, giữ cảm giác game kiếm hiệp nhập vai (môn phái, bang hội, đánh quái, công thành), nhưng thế giới có "khôi lỗi biết nghĩ": người máy gỗ và đồng chạy bằng linh thạch, là "AI" của thời cổ.
- 3 đồng đội AI là 3 khôi lỗi; tính cách (liều / cẩn thận / tham đồ) là câu chuyện riêng của từng con.
- 3 môn phái khác nhau ở cách đối xử với khôi lỗi: coi là bạn đồng hành / coi là công cụ / muốn phá hết.
- Trùm hang Giai đoạn 1: khôi lỗi đầu tiên "tỉnh dậy", đòi tự quyết mạng mình.
- Giai đoạn 3 (khôi lỗi biết trò chuyện) nối tiếp câu chuyện này.

## Giai đoạn 1 (mục tiêu 2–3 tuần)
- 1 thành, 1 rừng, 1 hang có trùm. 3 môn phái tự đặt tên, mỗi phái 4 chiêu, ngũ hành khắc chế.
- Đánh quái, lên cấp, nhặt trang bị, bán đồ ở tiệm trong thành.
- 3 đồng đội AI (liều / cẩn thận / tham đồ), cây quyết định: xông vào, lùi, hồi máu đồng đội.
- Tự lưu trên máy; điều khiển chạm + bàn phím.

## Giai đoạn 2: thế giới sống
- Thêm 2 bản đồ, nhiệm vụ chính / phụ. Bang hội AI tự luyện cấp, tranh bãi quái, công thành mỗi tuần (giờ trong game). Trang bị thuộc tính ngẫu nhiên, ghép đồ.

## Giai đoạn 3: AI biết trò chuyện
- Mô hình ngôn ngữ nhỏ chạy trong trình duyệt, không mạng, không phí API; nói tiếng Việt, nhớ chuyện cũ. Tải khoảng 1–2 GB lần đầu phải anh Kha đồng ý; máy yếu dùng lời thoại có sẵn.

## Kỹ thuật
- Phaser 3 + TypeScript + Vite, web tĩnh. Hình / âm tự tạo hoặc CC0, ghi CREDITS.md. Không đụng repo khác. Mỗi giai đoạn có danh sách kiểm + ảnh chụp để Claude rà.

## Luật bản quyền (bắt buộc)
- Không dùng tên, bản đồ, môn phái, nhân vật, hình, nhạc, giao diện của Võ Lâm Truyền Kỳ hay game khác. Tên tự đặt; Claude rà danh sách tên trước khi làm hình.

## Anh thấy gì
- 1 link mở là chơi được trên điện thoại. Chỗ xem (trang Claude riêng tư hay Cloudflare Pages anh nối repo 1 lần) anh chưa chốt: hỏi anh khi Giai đoạn 1 có bản chơi được.

## Rủi ro
- Antigravity hết lượt / làm dở: Giai đoạn 1 nhỏ, mỗi tuần 1 bản chơi được.
- AI ngớ ngẩn: cây quyết định trước, mô hình ngôn ngữ sau.
- Bản quyền: luật tên riêng, Claude rà.

## Tên game
- Tạm "Giang Hồ AI"; anh có tên khác thì đổi.
