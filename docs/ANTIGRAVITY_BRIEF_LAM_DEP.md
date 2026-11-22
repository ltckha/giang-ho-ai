# Lời giao Antigravity: Làm đẹp game thủ thành

**Chỉ bắt đầu khi docs/REVIEW_LOG.md có dòng "MÀN 1 VUI: ĐẠT".** Không đổi luật chơi, số liệu cân bằng, đường đi hay đợt quái khi làm đẹp; test cân bằng phải vẫn qua.

Luật cũ vẫn giữ: không lấy hình / giao diện / nét vẽ của game có thật; offline; không gọi mạng lúc chơi; ghi nguồn mọi hình / âm / phông chữ trong CREDITS.md.

## Bước A — Thử nét vẽ, chờ anh Kha duyệt
1. Vẽ bằng công cụ tạo ảnh của Antigravity 3 hình mẫu cùng một nét: 1 quân (Hỏa Lôi Khôi), 1 quái (Thạch Giáp Khôi Lỗi), 1 mảnh bản đồ Màn 1 (đường đất qua rừng, có mạch linh thạch phát sáng xanh lam).
2. Nét gợi ý: giang hồ cổ trang, khôi lỗi gỗ trầm + khớp đồng, chạy bằng linh thạch xanh; nhìn từ trên xuống hơi chéo; màu ấm, rõ hình ở cỡ nhỏ trên điện thoại.
3. Lưu vào docs/art_samples/ (PNG), ghi vào docs/PROGRESS.md cách đã tạo (công cụ, lời nhắc). Push rồi DỪNG chờ dòng "NÉT VẼ: ĐỒNG Ý" trong docs/REVIEW_LOG.md.
4. Nếu Antigravity không tạo được ảnh: ghi rõ vào PROGRESS.md và chuyển sang làm Bước C bằng hình vẽ code, báo lại.

## Bước B — Vẽ đủ bộ (sau khi duyệt nét)
- 5 quân × 3 bậc (bậc 3 mỗi nhánh có khác biệt nhìn thấy được), 6 quái + quái con chia đôi + trùm Sơ Giác, nền 3 màn, cổng thành, ô đặt quân, biểu tượng 5 hệ, linh thạch, mạng.
- Ghép thành atlas (sprite sheet), nén PNG / WebP. **Tổng dung lượng bản build ≤ 5 MB.**
- Có hoạt ảnh tối thiểu: quân 2–3 khung khi bắn, quái 2–4 khung khi đi.

## Bước C — Hiệu ứng (bằng code)
- Đạn có vệt sáng theo hệ (Hỏa đỏ cam, Thủy xanh, Mộc xanh lá, Kim vàng, Thổ nâu).
- Quân giật / lóe khi bắn; quái nhún khi đi, chớp trắng khi trúng, vỡ mảnh gỗ-đồng khi chết.
- Mạch linh thạch lấp lánh, bóng cây lay nhẹ trên bản đồ.
- Trúng hệ khắc: chữ "Khắc!" lớn hơn, rung nhẹ. Thắng màn: pháo sáng, sao rơi lần lượt.
- Có tuỳ chọn "Giảm hiệu ứng" cho máy yếu (và tự bật khi máy đặt giảm chuyển động).

## Bước D — Giao diện
- Khung gỗ khắc viền đồng cho thanh trên, bảng chọn quân, bảng nâng cấp; nút to, dễ chạm khi cầm dọc.
- Phông chữ tiếng Việt giấy phép mở (vd Be Vietnam Pro hoặc Noto Serif cho tiêu đề), cài file phông vào game, không tải từ mạng.

## Cách nộp
- Commit nhỏ, push lên main sau mỗi bước. `npm test`, `npm run build`, e2e phải qua.
- Ảnh trước / sau cùng một cảnh trong docs/screenshots/dep_*.png (điện thoại dọc).
- Xong ghi "LÀM ĐẸP XONG" đầu docs/PROGRESS.md.
