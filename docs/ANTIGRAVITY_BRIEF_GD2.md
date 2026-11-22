# Lời giao Antigravity: Giai đoạn 2 — Thế giới sống

Đọc trước: docs/PLAN.md (mục Bối cảnh và Giai đoạn 2), docs/NAMES.md, docs/PROGRESS.md, và mục mới nhất trong docs/REVIEW_LOG.md. Làm trong repo này, nhánh main, không đụng repo khác. Mọi luật "Bắt buộc" của docs/ANTIGRAVITY_BRIEF.md (Giai đoạn 1) vẫn giữ nguyên: game mới hoàn toàn, không tên Võ Lâm Truyền Kỳ / Kim Dung / công ty AI có thật, Phaser 3 + TypeScript + Vite, offline, không khoá API, không quảng cáo, không theo dõi, hình / âm tự tạo hoặc CC0 ghi CREDITS.md.

## Bước 0 — Sửa phần dở của Giai đoạn 1 (làm trước, commit riêng)
1. Điện thoại cầm dọc: thu gọn bảng tổ đội và hàng nút trên cùng (vd gom vào 1 nút "≡"), để bản đồ thấy được ít nhất 2/3 màn hình; thông báo "Đã đến…" không được đè nút Linh Dịch / Dầu Chốt.
2. Thêm test chơi tự động trong trình duyệt (Playwright, chạy bằng `npm run test:e2e`, mở bản build, chặn mạng ngoài): chọn phái → vào thành → sang rừng → xuống hang → thấy trùm; không lỗi console.
3. Tiến độ đã lưu từ Giai đoạn 1 (`giang_ho_ai_save_v1`) phải mở được ở bản mới (chuyển sang bản lưu mới nếu cần, không mất cấp / đồ / nhiệm vụ). Có test cho việc này.

## Bước 1 — Tên mới, chờ Claude rà
Ghi thêm vào docs/NAMES.md một mục "Giai đoạn 2": tên 2 bản đồ mới (và các khu trong đó), các bang hội AI (ít nhất 3, mỗi bang có tính cách / lối chơi riêng), nhân vật nhiệm vụ chính, NPC và quái mới, trùm mới (nếu có), các dòng chỉ số trang bị ngẫu nhiên. Commit, rồi DỪNG phần hình và nội dung chờ Claude rà. Chỉ vẽ hình / gắn tên khi docs/REVIEW_LOG.md có dòng "NAMES GĐ2: ĐỒNG Ý". Trong lúc chờ được làm phần lõi chưa dùng tên (Bước 2 mục bang hội, trang bị).

## Bước 2 — Phạm vi Giai đoạn 2
- **2 bản đồ mới** nối với bản đồ cũ. Gợi ý theo câu chuyện: thành của phe giữ kín bí kíp, và vùng mỏ linh thạch lớn đang tranh chấp.
- **Nhiệm vụ chính** nối tiếp trùm Sơ Giác (khôi lỗi tỉnh dậy → các phái phản ứng), khoảng 5–8 bước, có lựa chọn ảnh hưởng thái độ của 3 môn phái với người chơi.
- **Ít nhất 3 nhiệm vụ phụ mới** lấy từ ánh xạ trong PLAN chưa dùng: giả giọng giả mặt lừa đảo, bí kíp bị chép trộm dạy khôi lỗi, kẻ phá bùa phong ấn. Lời thoại tiếng Việt viết sẵn.
- **Bang hội AI (thế giới sống):**
  - Mỗi bang có cấp, quân số, kho linh thạch, bãi quái đang chiếm; tự luyện cấp và tự tranh bãi quái theo giờ trong game, kể cả khi người chơi ở bản đồ khác (mô phỏng gọn, không cần vẽ từng người lúc không nhìn thấy).
  - Quyết định của bang dùng cây quyết định / chấm điểm như đồng đội Giai đoạn 1 (không dùng mô hình ngôn ngữ).
  - Người chơi có thể gia nhập 1 bang, hoặc đứng ngoài; bang gặp ngoài bản đồ thì đánh nhau / tránh nhau theo quan hệ.
  - **Công thành mỗi tuần (giờ trong game):** các bang giành 1 thành; người chơi tham gia cùng bang mình. Có bảng tin trong thành báo ai đang giữ thành, bang nào lên / xuống.
- **Trang bị chỉ số ngẫu nhiên + ghép đồ:** đồ rơi có 1–3 dòng chỉ số ngẫu nhiên theo độ hiếm; ghép 2–3 món cùng loại thành món tốt hơn ở thợ rèn (nối với Lão Bính).
- Giữ cân bằng ngũ hành; ghi cách cân bằng mới vào docs/PROGRESS.md.

## Cách nộp
- Commit nhỏ, git push lên main sau MỖI phần (không để dồn trên máy). Mỗi commit phải `npm test` và `npm run build` qua.
- Test bắt buộc thêm: quyết định bang hội, mô phỏng tranh bãi / công thành theo giờ trong game, sinh chỉ số ngẫu nhiên (dùng seed để test ổn định), ghép đồ, đọc bản lưu cũ.
- Mỗi mốc chơi được: ghi docs/PROGRESS.md (mục Giai đoạn 2) + ảnh chụp trong docs/screenshots/gd2_*.png, có ít nhất 1 ảnh điện thoại cầm dọc.
- Xong thì ghi "GĐ2 XONG" ở dòng đầu docs/PROGRESS.md.
