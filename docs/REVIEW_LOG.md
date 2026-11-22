# Nhật ký rà soát (phiên cloud Claude "Giang Hồ AI")

Mỗi lần rà ghi một mục: ngày, rà cái gì (commit), kết luận, việc Antigravity cần sửa.

---

## 22/11/2026 — Rà danh sách tên (docs/NAMES.md, commit 95b5b3a)

NAMES: ĐỒNG Ý

**Kết luận:** danh sách tên đạt. Antigravity được vẽ hình và gắn tên chính thức.

**Đã kiểm:**
- Không trùng tên môn phái, thành, nhân vật của Võ Lâm Truyền Kỳ (10 phái Thiếu Lâm, Thiên Vương, Đường Môn, Ngũ Độc, Nga My, Thúy Yên, Cái Bang, Thiên Nhẫn, Võ Đang, Côn Lôn; các thành Biện Kinh, Phượng Tường, Thành Đô, Đại Lý, Tương Dương, Dương Châu, Lâm An).
- Không thấy trùng tên môn phái trong tiểu thuyết Kim Dung.
- Không có tên công ty / sản phẩm AI có thật.
- Đúng bối cảnh PLAN: 3 phái mở / đóng / cấm; thành có lò đúc, chợ khôi lỗi, thợ rèn mất việc; rừng mỏ linh thạch; trùm khôi lỗi tỉnh dậy; 2 nhiệm vụ phụ (mất việc, bịa chuyện); 3 đồng đội liều / cẩn thận / tham đồ.
- Tên game giữ "Giang Hồ AI" cho tới khi anh Kha chọn (đề xuất: Mộc Cơ Giang Hồ / Khôi Lỗi Ký / Linh Thạch Hành).

**Ghi chú cho Antigravity (không chặn, xử lý khi làm phần sát thương):**
1. Cân bằng ngũ hành giữa 3 phái lệch: Kim khắc Mộc, Hỏa khắc Kim, nhưng không phái nào khắc Hỏa, còn Mộc không khắc phái nào. Ngoài phần quái, nên cho Phổ Mộc Đường bù thêm (vd hồi máu mạnh hơn, hoặc ngọc ngũ hành đổi hệ chiêu) để phái Mộc không yếu nhất. Ghi cách cân bằng vào PROGRESS.md.
2. Trùm Sơ Giác hệ Thủy khắc Hỏa Ấn Môn; chỉ Mộc Tĩnh (Thổ) khắc trùm. Chấp nhận được, nhưng test phải có trường hợp người chơi phái Hỏa vẫn hạ được trùm ở cấp đề xuất.
3. Chỉ một phiên Antigravity được đẩy lên main. Nếu có phiên thứ hai đang chạy Giai đoạn 1, phiên đó dừng, hoặc làm trên nhánh riêng và không ghi đè docs/NAMES.md.

---

## 22/11/2026 — Rà lõi game (commit 719adbd)

**Kết luận:** CHƯA CHƠI ĐƯỢC. Phần lõi (luật chơi) tốt, nhưng chưa có màn hình game. Antigravity làm tiếp, chưa phải sửa lại gì.

**Đã chạy thử (máy phiên cloud):**
- `npm ci`: được.
- `npx vitest run`: 25/25 test qua (AI đồng đội 8, sát thương 7, ngũ hành 5, túi đồ/nhiệm vụ/lưu máy 5).
- `npx tsc --noEmit`: không lỗi.
- `npm run build`: HỎNG — index.html gọi `src/main.ts` nhưng file chưa có (chưa có Phaser scene nào). Chưa có docs/PROGRESS.md, CREDITS.md, ảnh chụp.

**Tốt:**
- Ngũ hành đúng vòng khắc (1.35x / 0.75x). Ghi chú cân bằng lần trước đã xử lý: ngọc ngũ hành đổi hệ chiêu 1, giúp phái Mộc / phái Hỏa đánh trùm Thủy.
- Cây quyết định 3 khôi lỗi rõ ràng, có lý do cho từng hành động (dễ hiện chữ "đang lùi vì máu thấp" sau này).
- Không gọi mạng, không khoá API, không theo dõi; lưu bằng localStorage.

**Antigravity cần làm tiếp:**
1. Thêm `src/main.ts` + các scene Phaser (thành, rừng, hang, giao diện, điều khiển chạm + bàn phím) để `npm run build` chạy được.
2. Ghi docs/PROGRESS.md + ảnh chụp trong docs/screenshots/ khi có bản chơi được; thêm CREDITS.md khi có hình / âm thanh.
3. Tiêu đề index.html đang là "Giang Hồ AI — Mộc Cơ Giang Hồ": anh Kha chưa chọn tên game, để "Giang Hồ AI" cho tới khi chốt.
4. Cần thêm 1 test: người chơi phái Hỏa Ấn Môn (có ngọc đổi hệ) hạ được trùm Sơ Giác ở cấp đề xuất (ghi chú 2 lần trước).

---

## 22/11/2026 — Rà bản "GĐ1 XONG" (commit ed44c44)

**Kết luận:** ĐẠT — có bản chơi được. Chấp nhận Giai đoạn 1, kèm 3 việc nhỏ dưới đây (không chặn).

**Đã chạy thử (máy phiên cloud):**
- `npm ci`, `npm test`: 26/26 test qua (có test phái Hỏa Ấn Môn hạ Sơ Giác ở cấp 4).
- `npm run build`: được, ra dist/ (~1,6 MB JS, ~376 KB nén).
- Mở bản build bằng trình duyệt tự động, chặn mọi mạng ngoài: máy tính 1280×720, iPhone dọc, iPhone ngang. Không lỗi console, không gọi mạng ngoài.
- Chơi thử: chọn Hỏa Ấn Môn → vào Thành Lam Lư, 3 khôi lỗi đi theo, đi bằng WASD, dùng chiêu, mở túi đồ; tự lưu có dữ liệu trong localStorage. Giao diện chạm (cần ảo + 4 nút chiêu + 2 nút bình) hiện đủ trên điện thoại.
- Rừng, hang, trùm: Claude chưa tự đi tới; chỉ xem qua ảnh chụp của Antigravity (docs/screenshots/04, 05) và test tự động.
- CREDITS.md có; hình và âm thanh đều sinh bằng code, không tải file ngoài.

**Việc nhỏ cho lần sau (không chặn):**
1. Điện thoại cầm dọc: bảng tổ đội và nút trên cùng che gần nửa bản đồ; thông báo "Đã đến…" đè lên nút Linh Dịch / Dầu Chốt. Nên thu gọn bảng tổ đội khi màn hình hẹp và đẩy thông báo lên trên.
2. Mở thẳng file dist/index.html (bấm đúp) không chạy (trình duyệt chặn script từ file). Không sao nếu xem qua link web; nếu cần mở file trực tiếp thì gộp JS/CSS vào index.html.
3. Nên thêm 1 test chơi tự động trong trình duyệt (đi từ thành → rừng → hang) để lần sau rà nhanh hơn.

**Chờ anh Kha:** chọn chỗ xem bản chơi (theo PLAN mục "Anh thấy gì").

**Chỗ xem (anh Kha chọn 22/11):** trang Claude riêng tư — https://claude.ai/artifact/6wmbRSi1j6h1rfjB58PZES (bản build từ commit 8a679e8). Bản mới: phiên Claude "Giang Hồ AI" build và đăng lại cùng link.
