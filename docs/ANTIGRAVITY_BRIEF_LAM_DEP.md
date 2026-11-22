# Lời giao Antigravity: Đổi chủ đề "Giữ Kệ Giày" + làm đẹp

**Chủ đề mới:** đọc docs/CHU_DE_GIU_TIEM.md trước. Đổi toàn bộ tên, hình, câu chuyện sang tiệm giày mùa mưa, và thay vòng ngũ hành bằng bảng khắc chế đời thường trong đó (đây là thay đổi luật duy nhất được phép; chạy lại script mô phỏng và giữ mục tiêu độ khó). Bước 0: ghi tên nhánh nâng cấp và tên màn chính thức vào docs/NAMES.md, push, chờ "NAMES GIỮ KỆ GIÀY: ĐỒNG Ý" trong docs/REVIEW_LOG.md.

**Chỉ bắt đầu khi docs/REVIEW_LOG.md có dòng "MÀN 1 VUI: ĐẠT".** Không đổi luật chơi, số liệu cân bằng, đường đi hay đợt quái khi làm đẹp; test cân bằng phải vẫn qua.

Luật cũ vẫn giữ: không lấy hình / giao diện / nét vẽ của game có thật; offline; không gọi mạng lúc chơi; ghi nguồn mọi hình / âm / phông chữ trong CREDITS.md.

## Bước A — Thử nét vẽ, chờ anh Kha duyệt
1. Vẽ bằng công cụ tạo ảnh của Antigravity 3 hình mẫu cùng một nét: 1 món (Dép tông), 1 quái (Gián), 1 mảnh bản đồ Màn 1 (vỉa hè ướt mưa dẫn vào cửa tiệm giày, kệ giày ở cuối).
2. Nét gợi ý: hoạt hình vui, đồ vật có mắt và biểu cảm, tiệm giày ấm cúng ngày mưa Đà Lạt (sàn gỗ, kệ gỗ, đèn vàng, ngoài cửa mưa); nhìn từ trên xuống hơi chéo; rõ hình ở cỡ nhỏ trên điện thoại.
3. Lưu vào docs/art_samples/ (PNG), ghi vào docs/PROGRESS.md cách đã tạo (công cụ, lời nhắc). Push rồi DỪNG chờ dòng "NÉT VẼ: ĐỒNG Ý" trong docs/REVIEW_LOG.md.
4. Nếu Antigravity không tạo được ảnh: ghi rõ vào PROGRESS.md và chuyển sang làm Bước C bằng hình vẽ code, báo lại.

## Bước B — Vẽ đủ bộ (sau khi duyệt nét)
- 5 món × 3 bậc (bậc 3 mỗi nhánh có khác biệt nhìn thấy được), 6 quái + gián con + trùm Mùa Nồm, nền 3 màn, kệ giày, ô đặt món, 5 biểu tượng loại quái, tiền xu, chiếc ví, đôi giày (mạng).
- Ghép thành atlas (sprite sheet), nén PNG / WebP. **Tổng dung lượng bản build ≤ 5 MB.**
- Có hoạt ảnh tối thiểu: quân 2–3 khung khi bắn, quái 2–4 khung khi đi.

## Bước C — Hiệu ứng (bằng code)
- Đòn đánh mỗi món một kiểu: dép xoay vèo, bốt đạp có bụi, xịt phun sương trơn, túi văng gói hút ẩm, bàn chải lấp lánh bóng.
- Quân giật / lóe khi bắn; quái nhún khi đi, chớp trắng khi trúng, khi chết: giọt mưa bắn tóe, bùn vỡ vụn, gián lật ngửa, chuột chạy biến, mốc tan thành bụi.
- Mưa rơi ngoài cửa, đèn tiệm ấm, vũng nước lăn tăn.
- Trúng khắc chế: chữ "Trúng tủ!" lớn, rung nhẹ. Thắng màn: pháo sáng, sao rơi lần lượt.
- Có tuỳ chọn "Giảm hiệu ứng" cho máy yếu (và tự bật khi máy đặt giảm chuyển động).

## Bước D — Giao diện
- Khung kiểu hộp giày / thẻ giá treo cho thanh trên, bảng chọn quân, bảng nâng cấp; nút to, dễ chạm khi cầm dọc.
- Phông chữ tiếng Việt giấy phép mở (vd Be Vietnam Pro hoặc Noto Serif cho tiêu đề), cài file phông vào game, không tải từ mạng.

## Cách nộp
- Commit nhỏ, push lên main sau mỗi bước. `npm test`, `npm run build`, e2e phải qua.
- Ảnh trước / sau cùng một cảnh trong docs/screenshots/dep_*.png (điện thoại dọc).
- Xong ghi "LÀM ĐẸP XONG" đầu docs/PROGRESS.md.
