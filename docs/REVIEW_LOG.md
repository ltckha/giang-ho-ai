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

---

## 22/11/2026 — Rà Giai đoạn 2: Bước 0, tên mới, lõi (commit d2595b9 → 7385c00)

NAMES GĐ2: ĐỒNG Ý

**Kết luận:** Bước 0 đạt, danh sách tên GĐ2 đạt, phần lõi đạt. Antigravity được vẽ hình, gắn tên và làm 2 bản đồ mới.

**Đã chạy thử (máy phiên cloud):**
- `npm test`: 43/43 test qua (thêm bang hội, đồ ngẫu nhiên, thái độ môn phái, nhiệm vụ, bản lưu v2).
- `npm run build`: được.
- `npx playwright test`: 3/3 qua — đi bộ thật từ thành → rừng → hang tới thanh máu trùm Sơ Giác; điện thoại dọc bản đồ ≥ 2/3 màn hình, thông báo không đè nút; bản lưu GĐ1 mở được. Không lỗi console, không gọi mạng ngoài. Claude đã đọc test: đi bằng phím, không dùng lối tắt dịch chuyển.

**Tên GĐ2 đã kiểm:** Thành Bế Các, Lũng Đại Mạch và các khu; 4 bang (Cương Lô Hội, Mộc Khế Bang, Thủy Kính Minh, Diệm Giới Đoàn); nhân vật nhiệm vụ; 6 NPC; quái; trùm Vạn Chép; 4 bậc độ hiếm, 8 dòng chỉ số. Không thấy trùng Võ Lâm Truyền Kỳ / môn phái Kim Dung / công ty AI có thật. Ghi chú nhỏ: "Thủy Kính" là điển cố cổ (biệt hiệu một ẩn sĩ thời Tam Quốc), không phải tên game hay môn phái, giữ được. 3 nhiệm vụ phụ khớp đúng 3 ánh xạ còn lại trong PLAN; trùm Vạn Chép hệ Kim bù cho phái Hỏa — tốt.

**Ghi chú cho phần còn lại (không chặn):**
1. Bang hội chạy "kể cả khi người chơi ở bản đồ khác": khi đóng game rồi mở lại, giới hạn thời gian bù (vd tối đa 1 tuần trong game) để không nhảy quá xa; ghi rõ trong PROGRESS.md.
2. Bảng tin bang hội phải đọc được trên điện thoại dọc (thêm vào test e2e điện thoại).
3. Thêm 1 đoạn e2e: thành → Thành Bế Các → Lũng Đại Mạch → thấy trùm Vạn Chép.
4. Giữ dung lượng bản build dưới ~2 MB JS (hiện ~1,6 MB).

---

## 22/11/2026 — Rà bản "GĐ2 XONG" (commit c1d4c8b → 83b1378)

**Kết luận:** ĐẠT. Chấp nhận Giai đoạn 2.

**Đã chạy thử (máy phiên cloud):**
- `npm test`: 43/43 qua. `npm run build`: được, JS ~1,7 MB (~404 KB nén), dưới mức 2 MB.
- `npx playwright test`: 4/4 qua — đi bộ thật tới trùm Sơ Giác; đi bộ Thành Lam Lư → Rừng Thạch Mạch → Thành Bế Các → Lũng Đại Mạch tới trùm Vạn Chép; điện thoại dọc; bản lưu GĐ1. Không lỗi console, không gọi mạng ngoài.
- 4 ghi chú lần trước đã làm: giới hạn bù 168 giờ trong game khi mở lại; bảng tin đọc được trên điện thoại dọc; e2e 2 bản đồ mới; dung lượng dưới 2 MB.
- Xem ảnh chụp gd2_02 (bảng tin bang hội) và gd2_05 (điện thoại dọc): đúng tên đã duyệt, bản đồ thấy rõ.

**Việc nhỏ cho lần sau (không chặn):**
1. Bảng tin bang hội: nút "Gia nhập" lúc nằm dưới, lúc nằm bên phải — nên để cùng một chỗ.
2. Phần bản đồ / bang hội mới chưa có test đơn vị riêng (đang dựa vào e2e); thêm khi làm Giai đoạn 3.

**Bản chơi:** đăng lại cùng link https://claude.ai/artifact/6wmbRSi1j6h1rfjB58PZES (bản build từ commit này).

---

## 22/11/2026 — Rà thủ thành: tên + Màn 1 (commit 1e92244 → 5966efe)

NAMES THỦ THÀNH: ĐỒNG Ý

**Kết luận:** tên ĐẠT. Màn 1 chạy tốt nhưng **CHƯA ĐẠT "VUI" — TRẢ LẠI.** Chưa làm màn 2–3.

**Đã chạy:** `npm test` 14/14 qua, `npm run build` được. Code tuân luật (chưa gắn tên trước khi duyệt, đã bỏ phần nhập vai, không gọi mạng).

**Claude cho máy chơi Màn 1 bằng chính `TowerDefenseEngine` (script: docs/review/2026-11-22_sim_man1.ts, chạy: `npx esbuild docs/review/2026-11-22_sim_man1.ts --bundle --platform=node --outfile=/tmp/sim.cjs && node /tmp/sim.cjs`):**
| Cách chơi | Kết quả |
|---|---|
| Bot của Antigravity | Thắng, 20/20 mạng |
| Lấp 9 ô toàn 1 loại quân (Mộc / Kim / Thủy / Hỏa), có hoặc không nâng cấp | Thắng cả 8 lần, 20/20 mạng |
| 60 lần đặt loại quân ngẫu nhiên | Thắng 60/60, lần nào cũng 20/20 mạng |
| CHỈ 1 quân Mộc (nâng dần) | Thắng, 19/20 mạng |
| Chỉ 2 quân 1 loại | Thắng, 20/20 mạng |
| Lấp 9 ô toàn Thổ (quân hỗ trợ, không bắn) | Thua — hợp lý |

Nghĩa là: không cần nghĩ, không có lúc suýt thua, ngũ hành không tạo khác biệt — trượt cả 3 tiêu chí đầu. Test "chơi ẩu sẽ thua" hiện chỉ thử trường hợp giữ tiền không tiêu, chưa đủ.

**Antigravity sửa Màn 1 (chưa làm màn 2–3):**
1. **Siết độ khó** (máu quái tăng dần theo đợt, ít linh thạch khởi đầu / thưởng hơn, 2–3 đợt cuối dồn dập). Mục tiêu đo bằng script trên:
   - Lấp toàn 1 loại quân: thua, hoặc tối đa 1 sao.
   - 60 lần đặt ngẫu nhiên: thắng không quá ~30%, và hầu như không 3 sao.
   - 1–2 quân: thua.
   - Bot chơi đúng hệ: thắng nhưng mất vài mạng (2–3 sao), không phải 20/20 dễ dàng.
2. **Ngũ hành phải thấy rõ:** mỗi đợt trộn 2 hệ để 1 loại quân không cân được hết; cân nhắc tăng chênh lệch khắc (vd 1.6x / 0.6x) riêng cho thủ thành; quái máu trâu nên kháng mạnh hệ không khắc.
3. **Đưa các kiểm tra ở mục 1 thành test tự động** trong tests/ (seed cố định) để giữ cân bằng về sau.
4. **Ẩn nút "Bot"** khỏi người chơi (chỉ bật khi thêm `?bot=1` vào link, dùng cho test).
5. Ghi bảng kết quả mô phỏng mới vào docs/PROGRESS.md, push, rồi dừng chờ Claude chấm lại.
