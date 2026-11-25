# Đánh giá độc lập game Gọn Phố

Người đánh giá: Claude (phiên đánh giá độc lập, không tham gia làm game). Ngày: 25/11/2026.
Bản xem: mã nguồn ở commit `8dfc465`, bản công khai https://gon-pho.pages.dev.
Lưu ý: bản công khai được cập nhật giữa lúc em đánh giá (file chính đổi từ `index-p7mH2-tO.js` sang `index-BvOQ087s.js`, trùng với commit `8dfc465`). Các số đo hiệu năng và phần chơi thử bên dưới đều làm trên bản mới.

## Điểm tổng: 6/10

Game đẹp, chạy ổn, làm rất nhanh. Điểm bị trừ vì: có lỗi làm mất tiến độ, có lỗ hổng ở link lưu, người mới bị chặn ở Màn 3 và màn Trùm Phố Dốc, và phần pháp lý của việc phát hành game ở Việt Nam chưa được xử lý.

## 5 kết luận quan trọng nhất

1. **Chơi 2 máy bằng QR chìa khoá có thể mất tiến độ.** Em tái hiện được: máy cũ mở game lúc mạng chập chờn sẽ đè bản cũ lên máy chủ, máy mới mở lại là mất sao. Đồng hồ máy chạy sai cũng làm khoá "đóng băng". Cần sửa trước khi quảng bá tính năng này.
2. **Người mới gần như không qua được màn Trùm Phố Dốc, mà màn này là cửa duy nhất để vào phố Đà Lạt thật.** Mô phỏng 200 lượt: thắng 2–3% nếu chỉ mặc đồ khởi đầu, 12–19% nếu mặc đồ rơi từ 3 tiệm đầu. Máy đặt bừa của em chơi trên bản công khai thua 2/2 ở đợt 4/12. Trong khi đó tiệm đầu của phố thật lại dễ (thắng 3 sao ngay lần đầu). Phần hay nhất của game đang nằm sau một bức tường.
3. **Link lưu do người khác gửi có thể chạy mã lạ trong game.** Em kiểm chứng được trên bản chạy thử: máy mới mở link `#ma=…` không bị hỏi gì, vào bảng trang bị bấm một ô đồ là mã lạ chạy và đọc được chìa khoá QR. Sửa không khó (lọc dữ liệu đồ khi nạp).
4. **Rủi ro lớn nhất không nằm trong code mà ở giấy phép.** Theo bài phân tích Nghị định 147/2024/NĐ-CP em tra được, cung cấp game trên mạng (kể cả loại không tương tác) là ngành có điều kiện: phải là doanh nghiệp, có giấy chứng nhận và thông báo từng game. Kế hoạch hiện chỉ nhắc luật ở mục "game online" xa. Cần hỏi luật sư hoặc Sở trước khi đẩy mạnh video và LIVE. Em không phải luật sư và chưa đọc văn bản gốc.
5. **Kế hoạch đang làm rộng nhanh hơn kiểm chứng.** 62 màn, 6 phố, bản đồ 34 tỉnh, chế độ LIVE đã xong, nhưng chưa có số liệu người thật chơi nào trong kho. Nên dừng thêm nội dung, sửa 4 việc trên, rồi cho 5–10 người thật chơi trước mặt anh.

## Em đã kiểm những gì

| Việc | Kết quả |
|---|---|
| `npm ci`, `npm run build` | Chạy được. File chính 2.477 KB (nén gzip 518 KB), 1 khối duy nhất. |
| `npx vitest run` | 102/102 bài qua (16 file). |
| `npx playwright test --trace off` | 20/20 bài qua (1,3 phút). Đã `git checkout -- docs/screenshots`. |
| Đọc code | `src/core`, 2 màn chính, `src/game`, `src/server/luuHandler.ts`, `functions/api/luu.ts`. Một trợ lý phụ soi thêm lõi game và chạy thử nghiệm riêng; chỗ nào em chưa tự kiểm lại em ghi rõ. |
| Bộ `tools/kiemtra/` | Chạy `do_kho` và `nguoimoi` cho đủ 62 màn. Em viết thêm 1 bài mô phỏng 200 lượt cho 4 màn Phố Dốc với các mức đồ khác nhau. |
| Chơi trên bản công khai | Playwright, chạm thật vào ô và nút, cỡ 390×844. Màn 1 → 2 → 3 → Trùm, rồi 2 tiệm phố Tăng Bạt Hổ. Giao diện chụp ở 390×844, 360×640, 768×1024. |
| Máy chủ `/api/luu` | Chỉ thử bằng 2 khoá ngẫu nhiên mới tạo, dữ liệu giả vài chục ký tự. Không đọc, không ghi khoá của ai. |
| Hiệu năng | Đo dung lượng và thời gian vào game với mạng giả lập. Độ mượt: **không đo được** (xem mục Hiệu năng). |

Giới hạn: "máy đặt bừa" của em kém hơn một người chơi có suy nghĩ; nó chọn món ngẫu nhiên và không dùng tuyệt chiêu. Em không chơi tay được, nên cảm giác "vui hay không" em không chấm.

## Bảng lỗi

Cột "Kiểm": **Tự kiểm** = em chạy và thấy tận mắt; **Trợ lý chạy** = trợ lý phụ chạy thử nghiệm, em đọc lại code thấy hợp lý nhưng chưa chạy lại; **Đọc code** = chỉ suy ra từ code.

### Mức cao

| # | Chỗ nào | Chuyện gì xảy ra, cách tái hiện | Bằng chứng | Gợi ý sửa | Kiểm |
|---|---|---|---|---|---|
| C1 | Đồng bộ QR chìa khoá: `src/scenes/TitleScene.ts:161-169`, `src/game/cloudSync.ts` (`pullProgress`, `pushProgress`) | Mở game: tải bản trên máy chủ; nếu **không tải được vì bất kỳ lý do gì** thì vẫn gửi bản máy này lên. Máy B (bản cũ) mở game lúc rớt mạng 1 nhịp → đè bản cũ lên máy chủ → máy A mở lại bị thay bằng bản cũ. Em tái hiện với máy chủ giả: máy A từ 3 tiệm (3★, 2★, 3★) còn lại 1 tiệm 1★. Cùng gốc lỗi: máy A chơi lúc mất mạng rồi máy B đồng bộ trước → máy A mất phần vừa chơi. | Ảnh `anh/loi_dong_bo_may_A_mat_tien_do.jpg`. Nhật ký thử: `B GET -> rớt mạng`, `B PUT -> GHI`, `A GET -> có bản mới`, máy A còn `{"stage_1":1}`. | Chỉ gửi lên khi lần tải vừa rồi trả lời rõ ràng ("giống", "chưa có"). Khi tải về, so với tiến độ trên máy; nếu máy có phần mới chưa gửi thì **gộp** (lấy sao cao hơn, gộp túi đồ theo mã món) thay vì đè. | Tự kiểm |
| C2 | Máy chủ lưu: `src/server/luuHandler.ts` (đoạn PUT) | Thời điểm `t` do máy người chơi tự khai. Máy có đồng hồ chạy nhanh (hoặc ai đó gửi `t` rất lớn) làm khoá "đóng băng": mọi lần lưu sau bị bỏ qua nhưng máy chủ vẫn trả "ok", game báo "Đã đồng bộ". Lần mở sau, bản cũ trên máy chủ đè lại máy. Thử trên bản công khai với khoá ngẫu nhiên: gửi `t=9e15`, rồi gửi `t=bây giờ` → trả `{"ok":true}` nhưng đọc lại vẫn là bản `t=9e15`. | Kết quả lệnh curl ngày 25/11 (bước 5–7). | Máy chủ tự đóng dấu giờ của mình, hoặc từ chối `t` lệch quá vài phút so với giờ máy chủ. Trả về rõ "đã ghi" hay "bị bỏ qua" để game không báo sai. | Tự kiểm |
| C3 | Link lưu / mã lưu: `src/core/equipment.ts:481` (`migrateGearItem` trả nguyên món nếu có `visible`), các chỗ ghép tên món vào giao diện trong `TitleScene.ts` và `TdStageScene.ts` | Tên món đồ trong bản lưu không được lọc và được chèn thẳng vào trang. Người lạ gửi link `…#ma=<mã>`; máy chưa có tiến độ **không bị hỏi xác nhận** (`TitleScene.ts:175-177`). Mở bảng trang bị, bấm 1 ô đồ là mã lạ chạy; em cho nó đọc được chìa khoá QR trong máy. QR chìa khoá cũng là đường vào tương tự. | Ảnh `anh/loi_link_luu_chay_ma_la.jpg`. Kết quả thử: sau khi bấm ô áo khoác, biến đánh dấu `__xss` có giá trị. | Khi nạp bản lưu: chỉ nhận ô đồ, hành, hạng, loại chỉ số nằm trong danh sách cho phép; tên món tạo lại từ bảng tên, không lấy từ bản lưu. Luôn hỏi xác nhận khi mở link `#ma=`. Thêm chính sách chặn mã chèn (file `_headers` cho Cloudflare Pages). | Tự kiểm |
| C4 | Cân bằng: `src/core/shops/streetBoss.ts` (màn `stage_4`), `src/core/shops/flower.ts` (màn 3) | Tường chặn người mới. Mô phỏng 200 lượt mỗi ô (bảng ở mục Cân bằng): Trùm Phố Dốc thắng 2–3% với đồ khởi đầu, 12–19% khi mặc đồ rơi 2★, 28–30% khi mặc đồ rơi 3★. Máy giỏi nhất của game cũng chỉ còn 6/20 tim. Trên bản công khai: máy đặt bừa thua Màn 3 cả 4 lượt (đợt 3–6/12), thua Trùm 2/2 (đợt 4/12). Thắng Trùm mới có huy hiệu mở phố thật (`streetProgress.ts:13`). | Ảnh `anh/09_trum_pho_doc_chuan_bi_va_thua_dot_4.jpg`, `anh/10_tiem_pho_that_va_man_3.jpg`. Bộ `tools/kiemtra` tự đặt mục tiêu "trùm ~20–35%" nhưng đo ra 0% cho `stage_4`. | Chọn 1 trong 2: (a) hạ máu Trùm Phố Dốc tới khi người mới mặc đồ rơi thắng khoảng 30–40%; (b) mở phố thật ngay sau 3 tiệm, để Trùm Phố Dốc thành thử thách có thưởng. Em nghiêng về (b): ít rủi ro, không phải cân lại. Sửa luôn `tools/kiemtra` để tính đồ rơi cho `stage_4`. | Tự kiểm |

### Mức vừa

| # | Chỗ nào | Chuyện gì xảy ra | Bằng chứng | Gợi ý sửa | Kiểm |
|---|---|---|---|---|---|
| V1 | Đồ rơi: `src/core/equipment.ts:457-459`, `tools/level-maker/make-street.ts` (số màn 11–21 cho phố thật) | Tỉ lệ hạng đồ tăng thẳng theo số màn. Từ tiệm thứ 5 của phố thật trở đi không còn rơi đồ Thường, Tốt; trùm phố chỉ rơi Xịn và Hàng hiệu (khoảng 56% / 44%). Em thấy tận mắt: tiệm đầu phố Tăng Bạt Hổ rơi 3 món, 2 món Xịn. Hết lý do chơi tiếp vì đồ: vài màn là đủ đồ tốt nhất. Chế độ ★ Khó gọi rơi đồ 2 lần (`TdStageScene.ts:2043-2048`). | Bảng tỉ lệ 20.000 lượt của trợ lý; bảng thắng tiệm 1 phố thật trong ảnh `anh/10_…`. | Tách "bậc rơi đồ" khỏi số màn, chặn trần tỉ lệ. | Trợ lý chạy + em thấy 1 lần |
| V2 | Túi đồ: `src/core/saveSystem.ts` (`grantStageDrops` chỉ thêm, không có bán / giới hạn) | Túi đồ lớn mãi. Mỗi món khoảng 236–332 ký tự. Lỗi đầy bộ nhớ bị nuốt im lặng: game vẫn hiện thắng và đồ rơi nhưng không lưu. Ngưỡng thật còn xa (khoảng 1.300–3.600 lần thắng mới đầy), nhưng bảng túi đồ chậm dần (37 ms với 300 món, 185 ms với 3.000 món trên máy bàn). | Số đo của trợ lý. | Giới hạn 150–200 món, tự bỏ món yếu nhất không mặc; báo cho người chơi khi không lưu được. | Trợ lý chạy |
| V3 | Nạp bản lưu: `src/core/saveSystem.ts:31-56`, `equipment.ts:487` | Một món đồ hỏng trong bản lưu làm cả bản lưu bị coi như trống; lần thắng kế tiếp ghi đè luôn. Thử: sao từ `{stage_1:3, stage_2:3}` còn `{stage_1:1}`. | Thử nghiệm của trợ lý. | Kiểm từng món, bỏ món hỏng, giữ phần còn lại. Không bao giờ thay cả bản lưu bằng bản mặc định khi lỗi một phần. | Trợ lý chạy |
| V4 | Lõi game: `src/core/tdEngine.ts:274-287` | Còn sót luật ẩn từ bản "khôi lỗi": món hỗ trợ đặt đúng ô có mã `pad_4` + đủ 5 hành → mọi món +34% sức, +24% tốc. Không nơi nào trong game nói điều này, và ô `pad_4` ở mỗi màn nằm chỗ khác nhau. Độ khó đo bằng máy bị lệch tuỳ máy có tình cờ đặt trúng hay không. | Em đọc đoạn code (chú thích còn ghi "Thổ Trấn Khôi ở tâm trận"). Trợ lý đo: sức món từ 1,00 lên 1,34–1,90. | Bỏ luật này, hoặc biến thành luật công khai có hình chỉ dẫn. | Tự đọc + trợ lý chạy |
| V5 | Vòng lặp game: `TdStageScene.ts:860-869` | Game tính theo nhịp khung hình thay đổi, còn lúc cân độ khó dùng nhịp cố định 0,05 giây. Cùng một cách đặt, kết quả thắng / thua đổi theo nhịp: `stage_4` thua ở 1/120 giây, thắng còn 1 tim ở 1/60, còn 9 tim ở 1/30. Máy 120 Hz và máy yếu sẽ gặp độ khó khác nhau. | Bảng thử của trợ lý. | Tính game theo bước cố định (ví dụ 1/60 giây), khung hình chỉ để vẽ. | Trợ lý chạy |
| V6 | Gọi đợt sớm: `tdEngine.ts:145-168`, `:857-862` | Hướng dẫn nói "Gọi đợt sớm được thêm xu", nhưng gọi khi đợt cũ chưa xong thì mất thưởng dọn đợt cũ (ví dụ +14 rồi −14), tức không lời. | Em đọc code thấy đúng là chỉ trả thưởng cho đợt hiện tại; số do trợ lý đo. | Trả thưởng đợt cũ khi gọi sớm. | Đọc code + trợ lý chạy |
| V7 | Vào màn bằng link: `TitleScene.ts:195-198`, `:287-300` | Thêm `#stage_4` hoặc `#street_…` vào link là vào thẳng màn, không kiểm khoá, thắng vẫn lưu và rơi đồ. `?mo=1`, `?bot=1` mở hết màn cho bất kỳ ai. Game 1 người chơi nên hại ít, nhưng sẽ thành vấn đề khi có bảng xếp hạng, quà, thẻ QR. | Em dùng `?mo=1` trên bản công khai để chụp phố thật. | Chỉ bật các lối này khi chạy thử, hoặc không lưu / không rơi đồ khi vào bằng lối tắt. | Tự kiểm |
| V8 | Máy chủ lưu: `luuHandler.ts` | (a) Nhận bất kỳ chuỗi nào tới 200.000 ký tự, không cần là mã lưu → thành kho chứa miễn phí cho người lạ. (b) Không giới hạn tốc độ: 20 lệnh liền đều 200. (c) `t=1e999` làm máy chủ lỗi 500. (d) `t` âm, số lẻ vẫn nhận. (e) Không có cách xoá, không hạn dùng. | Kết quả curl trên bản công khai với khoá ngẫu nhiên. | Chỉ nhận dữ liệu bắt đầu bằng `GP1.` và đúng mã kiểm; `t` phải là số nguyên hợp lý; bật giới hạn tốc độ của Cloudflare cho `/api/luu`; xoá khoá không dùng sau N tháng. | Tự kiểm |
| V9 | Bảng nâng cấp món trong màn: `TdStageScene.ts:4081` | Nút bán món là ô màu hồng chỉ ghi "+42" và hình đồng xu, không có chữ "Bán", bấm là bán luôn không hỏi. Người mới dễ hiểu là "nhận 42 xu". | Ảnh `anh/03_bang_nang_cap_nut_ban_khong_chu.jpg`. | Ghi "Bán +42"; bấm lần 2 mới bán. | Tự kiểm |
| V10 | Bảng thắng | Thắng 3 sao rơi 3 món thì các nút "tiệm kế / chơi lại / về" bị đẩy xuống dưới, phải cuộn mới thấy (cỡ 390×844). Màn hình 640 cao còn chật hơn. | Ảnh `anh/10_tiem_pho_that_va_man_3.jpg` (khung thứ 3). | Ghim hàng nút ở đáy bảng, danh sách đồ cuộn bên trên. | Tự kiểm |
| V11 | Tiệm phố thật (phòng Spark) | Đường quái đi là dải chấm rất nhạt trên sàn gỗ, ô đặt món trong suốt. Mới vào khó biết quái đi lối nào. | Ảnh `anh/10_…` (khung 1–2). | Tăng độ đậm đường và ô trong 5 giây đầu màn, hoặc cho mũi tên chạy dọc đường trước đợt 1. | Tự kiểm |
| V12 | Bản đồ Đà Lạt trên điện thoại | Mở bản đồ ở 390 và 360 rộng: bảng tên Phố Hoàng Diệu nằm hẳn ngoài mép trái (toạ độ −86), bảng Phố Dốc bị cắt ở mép phải. Phải kéo mới thấy; không có gợi ý kéo. | Ảnh `anh/07_…`, `anh/05_…`; số đo vị trí bằng Playwright. | Lúc mở, thu nhỏ vừa đủ thấy cả 7 bảng tên. | Tự kiểm |
| V13 | Chơi không cần mạng: `vite.config.ts` (tạo `sw.js`) | Sau 20 giây, game lặng lẽ tải toàn bộ 20,2 MB (181 file, gồm cả nền Chợ Bến Thành đang cất) về máy. Người dùng 4G không được hỏi. Ngoài ra nếu có bản mới mà chưa kịp tải xong đã mất mạng thì trang mới trỏ tới file chưa có → có thể trắng màn hình (em chưa tái hiện). | `du -sb dist` = 20.246.188; nội dung `sw.js` trên bản công khai. | Chỉ lưu sẵn phần đã chơi + Phố Dốc; phần còn lại lưu khi người chơi mở phố đó. | Đo dung lượng: tự kiểm. Trắng màn: đọc code |
| V14 | Nút ★ Khó | Tạm dừng → "Chơi lại" quên chế độ Khó (`TdStageScene.ts:4549`), người chơi tưởng đang chơi Khó nhưng không được sao Khó. | — | Truyền `hard` khi chơi lại. | Đọc code (trợ lý) |

### Mức thấp

| # | Chỗ nào | Chuyện gì | Gợi ý | Kiểm |
|---|---|---|---|---|
| T1 | Nút nhỏ | Nhiều nút dưới 40 điểm: 4 nút đầu màn chính 33–34, nút FX 34×36, nút x1 50×36, "Bỏ qua" 62×32, "?" trong bảng trang bị 24×24, "Bộ đồ ▾" 55×21, chấm tỉnh trên bản đồ Việt Nam 18×22. | Vùng chạm tối thiểu 44. | Tự kiểm |
| T2 | Chữ nhỏ | Số tiệm trên bảng tên phố ("0/8") cỡ 8,5; các thẻ chỉ số trang bị cỡ 10,5. Trên máy tính bảng chữ trên bảng tên phố càng nhỏ so với màn hình. | Tối thiểu cỡ 12. | Tự kiểm |
| T3 | Chữ khó hiểu với người mới | Nút "FX"; thẻ "Sinh 4%", "Trùm 8%"; "+2 dòng ẩn"; bước 4 hướng dẫn nhồi cả 5 cặp khắc trong 1 câu; hướng dẫn nói "bấm Gọi đợt" nhưng nút ghi "Mở Đợt 1"; nút xác nhận ở bảng Chuẩn bị chỉ có hình ▶. Bảng thua luôn hiện cùng một câu mẹo. | Đổi "FX" thành hình; mẹo thua theo lý do thua (thiếu món khắc, để trống ô gần cửa…). | Tự kiểm |
| T4 | Bảng đặt món | Chỉ có hình, hành, giá. Không thấy món đánh kiểu gì (nhanh, lan, làm chậm) trừ một biểu tượng nhỏ ở góc. | Thêm 2–3 chữ vai trò dưới tên. | Tự kiểm |
| T5 | Thứ tự độ khó Phố Dốc | Màn 1 khó hơn Màn 2 (người mới thắng 48% so với 56–67%). Màn đầu tiên nên dễ nhất. | Giảm nhẹ Màn 1. | Tự kiểm (mô phỏng) |
| T6 | Bản đồ Việt Nam | 33/34 tỉnh ghi "Sắp mở". Đây là lời hứa lớn hiện trên game công khai. Quần đảo có vẽ nhưng không ghi tên. | Tạm ẩn, hoặc chỉ ghi "Đang chơi: Đà Lạt". Nhờ người rành quy định bản đồ xem lại hình. | Tự kiểm |
| T7 | Ghi nguồn bản đồ | Dòng "© OpenStreetMap contributors" có trong hình, nhưng nằm góc dưới phải; trên bản đồ lớn phải kéo tới mới thấy. | Thêm 1 dòng trong bảng Hướng dẫn. | Tự kiểm |
| T8 | Tên trong code lệch nghĩa | `fire_tower` là Túi Hút Ẩm (Thổ), `earth_tower` là Máy Sấy Giày (Hỏa). Dễ sửa nhầm. | Đổi tên khi rảnh, có bài kiểm đi kèm. | Tự kiểm |
| T9 | Rò bộ nghe sự kiện | Mỗi lần vào màn gắn thêm 1 bộ nghe "đổi cỡ màn hình" mà không gỡ (`TdStageScene.ts:542`). Chơi lâu sẽ nặng dần. | Gỡ khi rời màn. | Đọc code (trợ lý) |
| T10 | Xe | Có 6 xe để nhận nhưng 13 dịp nhận; từ dịp thứ 7 thắng không được gì. | Đổi thành quà khác. | Đọc code (trợ lý) |
| T11 | Tài liệu cũ | `CREDITS.md` còn ghi tên cũ và "không tải gì từ mạng ngoài" (nay có đếm lượt Cloudflare và máy chủ lưu); ghi hình là "CC0 / tự tạo" trong khi hình do công cụ AI vẽ. `PLAN.md` nửa sau là kế hoạch nhập vai đã bỏ. `package.json` mô tả "game kiếm hiệp". | Dọn 1 lần. | Tự kiểm |
| T12 | Đầu trang web | Không có chính sách chặn mã chèn, không chặn nhúng khung. | Thêm file `_headers`. | Tự kiểm |

## Trải nghiệm người mới (390×844)

Chỗ tốt, em ghi vì là sự thật chứ không để khen:
- Mở game là thấy ngay Phố Dốc và 1 nút chơi; 5 bước hướng dẫn làm theo thao tác thật.
- Bảng thắng có nút "Mặc ngay" cho món rơi vào ô còn trống; có nhắc đưa game ra màn hình chính sau màn đầu.
- 0 lỗi console trong toàn bộ các lượt chơi thử.
- Không tràn ngang ở cả 3 cỡ màn hình; máy tính bảng dùng được.

Hành trình máy đặt bừa trên bản công khai (tốc độ x2):

| Màn | Kết quả | Ghi chú |
|---|---|---|
| Màn 1 Tiệm Giày | Thắng lần 1, 2★, còn 10/20 | Mất 10 tim ở đợt 2–3 |
| Màn 2 Tiệm Bánh | Thắng lần 1, 2★, còn 16/20 | |
| Màn 3 Tiệm Hoa | Thua 4/4 lượt (đợt 3, 5, 6, 4 trên 12) | Hai cửa vào; đặt lệch 1 bên là thua nhanh |
| Trùm Phố Dốc (mở bằng `?mo=1`) | Thua 2/2 ở đợt 4/12 | |
| Tiệm 1 phố Tăng Bạt Hổ (mở bằng `?mo=1`, đồ khởi đầu) | Thắng lần 1, 3★, còn 20/20 | Rơi 3 món, 2 món Xịn |
| Tiệm 2 phố Tăng Bạt Hổ | Thắng lần 1, 1★, còn 8/20 | |

Ảnh: `anh/01_…` đến `anh/10_…`.

## Cân bằng

Mô phỏng 200 lượt mỗi ô, người chơi gọi đợt liên tục, chọn món ngẫu nhiên. "Mới" = ưu tiên ô gần đường; "Bừa" = ô ngẫu nhiên. Đồ: "khởi đầu" = 2 món có sẵn; "rơi 2★ / 3★" = mặc thêm đồ rơi từ các màn trước.

| Màn | Khởi đầu (mới / bừa) | Rơi 2★ (mới / bừa) | Rơi 3★ (mới / bừa) |
|---|---|---|---|
| Màn 1 | 48% / 40% | như trái | như trái |
| Màn 2 | 56% / 53% | 67% / 61% | 72% / 67% |
| Màn 3 | 65% / 39% | 75% / 55% | 85% / 64% |
| Trùm Phố Dốc | **2% / 3%** | **12% / 19%** | 28% / 30% |

Kết quả `tools/kiemtra` cho 62 màn: máy giỏi thắng 62/62. Người mới ở tiệm phố thật thắng 15–88%, phần lớn 45–70%; trùm 6 phố thật 23–33%. Vài tiệm lệch khỏi mục tiêu của chính bộ kiểm tra: Cà Phê Cóc Hồ Sương 15%, Giặt Sấy Hồ Sương 20%, Tiệm Ăn Vặt Atiso 25%, Studio Ảnh Cẩm Tú Cầu 30% (tiệm thứ 4, trước mốc mở trùm).

Nhận xét:
- Đường độ khó bị ngược: dễ (Màn 1–2) → khó (Màn 3) → tường (Trùm) → dễ lại (tiệm phố thật).
- Người mới không biết phải mở 🎒 mặc đồ thì cơ hội qua Trùm gần bằng 0. Bảng thua chỉ nói "chọn món khắc hành", không nhắc mặc đồ.
- Phần thưởng: đáng chơi ở 4 màn đầu (mỗi màn thêm 1–2 ô đồ). Từ phố thật trở đi đồ tốt rơi quá dễ (lỗi V1) nên động lực "kiếm đồ" hết sớm; còn lại là sao, xe (hết sau 6 chiếc) và xem phố mới.
- Lưu ý khi đọc số: kết quả nhạy với nhịp tính (lỗi V5) và luật ẩn `pad_4` (lỗi V4), nên sai số của các con số trên không nhỏ.

## Hiệu năng

| Đo | Kết quả |
|---|---|
| Tải tới màn chính | 6,5 MB (đo qua mạng, bản công khai mới) |
| Thời gian tới màn chính, mạng nhanh | khoảng 4,0 giây |
| Mạng 4 Mbps + CPU chậm 4 lần | khoảng 19,6 giây |
| Mạng 1,6 Mbps + CPU chậm 4 lần | khoảng 40,4 giây |
| Vào 1 màn phố (đã có sẵn trong bộ nhớ đệm) | 3,9 giây; CPU chậm 4 lần: 11,3 giây; 6 lần: 16,7 giây |
| Tải ngầm để chơi không mạng | thêm tới tổng 20,2 MB sau 20 giây |
| Bộ nhớ chương trình khi đang chơi | 22–29 MB |
| Độ mượt (khung hình/giây) | **Không đo được.** Máy thử không có card đồ hoạ (vẽ bằng phần mềm), số đo 18 khung/giây không đại diện cho điện thoại thật. Chỉ biết tương đối: làm chậm CPU 4 lần thì còn khoảng 60%, 6 lần còn khoảng 50%. |

Nhận xét:
- 6,5 MB lần đầu là nặng với khách vào từ video TikTok bằng 4G: chờ 20 giây là nhiều người thoát. Một hình ghép 3,2 MB (`spark_atlas.webp`, chứa món và quái của cả 6 phố) được tải ngay từ đầu dù người mới chỉ cần Phố Dốc. Kế hoạch ban đầu ghi "bản build ≤ 5 MB"; nay là 20 MB.
- File chính 2,5 MB gồm cả 0,8 MB dữ liệu 6 phố. Tách theo phố sẽ nhẹ hẳn.
- Cần 1 lần thử trên điện thoại Android giá rẻ thật để biết có giật không. Việc này em không làm thay được.

## Tính khả thi và hướng đi

### Một người chủ + AI có làm nổi không
Làm thì nổi: 4 ngày đã có 62 màn, 6 phố, đồ, xe, LIVE, lưu QR, 102 + 20 bài kiểm. Chỗ không nổi là **kiểm chứng và giữ cho ổn**:
- Mọi thứ anh duyệt là "nhìn thấy đẹp". Bốn lỗi mức cao ở trên đều thuộc loại không nhìn thấy được, và đều lọt qua các lần rà trước.
- Tốc độ thêm tính năng đang nhanh hơn tốc độ có người chơi thật. Lộ trình ghi "dừng thêm phố mới cho tới khi đăng video" (25/11) nhưng cùng ngày vẫn thêm bản đồ 34 tỉnh, phòng mới, và mở phiên Gọn Phố Việt.
- Kế hoạch đã bỏ bước "10–20 người quen chơi thử". Em đề nghị lấy lại ở dạng nhỏ: đây là cách rẻ nhất để biết Màn 3 và Trùm có chặn người thật không.

### Nên làm ngay (theo thứ tự)
1. Sửa C1 + C2 (đồng bộ), C3 (link lưu). Trong lúc chờ sửa, đừng quảng bá "QR chìa khoá".
2. Gỡ tường: mở phố thật sau 3 tiệm (hoặc hạ Trùm Phố Dốc). Thêm câu "Mở 🎒 mặc đồ mới" vào bảng thua.
3. Hỏi về giấy phép (mục Pháp lý bên dưới) trước khi đăng loạt video đầu.
4. Cho 5–10 người chơi trước mặt anh, không giải thích gì, ghi lại họ kẹt ở đâu.
5. Giảm lần tải đầu xuống dưới khoảng 3 MB (tách hình và dữ liệu theo phố).
6. Rồi mới đăng video.

### Nên hoãn
- **LIVE TikTok bằng bộ đọc không chính thức.** Kênh @gon.simpli cũng là kênh làm tiếp thị liên kết của anh; nếu kênh bị hạn chế thì mất nhiều hơn được. Em **không xác nhận được** chính sách chính thức của TikTok về công cụ bên thứ ba đọc quà / bình luận (tra web không ra văn bản gốc). Chế độ LIVE trong game đã xong thì để đó; chỉ bật khi có video đạt lượt xem và đã đọc kỹ quy định.
- **Bản đồ 34 tỉnh, Gọn Phố Việt, mở tỉnh mới.** Code chưa có khái niệm "tỉnh / thành phố": tất cả phố nằm chung 1 danh sách vẽ trên 1 bản đồ Đà Lạt. Mở tỉnh thứ 2 là làm lại màn chính.
- **Chế độ Vô tận, màn sự kiện, chợ ứng dụng.** Chờ có số người chơi quay lại.

### Nên bỏ (ít nhất trong năm đầu)
- Game online, tài khoản, trao đổi đồ.
- Thẻ QR có quà trong game. Thẻ tặng kèm đơn hàng chỉ để dẫn về game thì được.

### Rủi ro pháp lý và nền tảng

| Việc | Em thấy gì | Mức chắc chắn |
|---|---|---|
| Luật game ở Việt Nam (Nghị định 147/2024/NĐ-CP) | Bài phân tích trên luatvietnam.vn nêu: game G2, G3, G4 đều cần doanh nghiệp thành lập theo luật Việt Nam, có Giấy chứng nhận cung cấp dịch vụ (Sở cấp) và thông báo từng game; kèm điều kiện quản lý giờ chơi người dưới 18 tuổi, xác thực bằng số điện thoại. G4 là game tải về, không tương tác với máy chủ; có máy chủ lưu tiến độ thì có thể bị xếp G2. Gọn Phố đang công khai và chưa có các giấy này. | Nguồn thứ cấp, em chưa đọc văn bản gốc, em không phải luật sư. Cần hỏi luật sư hoặc Sở. Đây là rủi ro em xếp cao nhất. |
| Tiếp thị Shopee trong game | Nghiên cứu sẵn trong kho (22/11) hợp lý: đăng ký game là kênh trước, nút ghi rõ là quảng cáo, không thưởng vật phẩm cho việc bấm. Em không tra lại điều khoản. | Dựa trên tài liệu trong kho. |
| TikTok LIVE | Xem mục "Nên hoãn". | Không xác nhận được. |
| Dữ liệu OpenStreetMap | Đã ghi nguồn trong hình (lỗi T7 là chỗ ghi hơi khuất). Nếu sau này chia sẻ bộ dữ liệu đường đã xử lý thì phải theo giấy phép ODbL của dữ liệu đó. | Khá chắc. |
| Tên phố thật | Tên đường là tên công cộng. Tên tiệm trong game đã đặt lại (ví dụ "Lẩu Bò Nhà Gỗ Sim Tím"), có ghi nguồn tham khảo. Rủi ro còn lại: câu mô tả nào đủ để nhận ra một quán thật mà quán không thích (quái là ruồi, chuột, rác trước cửa quán). | Suy luận của em. Nên giữ nguyên tắc không dùng tên, biển hiệu thật; ai phản ánh thì đổi ngay. |
| Bản đồ Việt Nam | Hình bản đồ quốc gia đăng công khai có quy định riêng về thể hiện chủ quyền. Hình trong game có vẽ các quần đảo nhưng không ghi tên. | Em không rành quy định này; nên nhờ người biết xem, hoặc tạm ẩn bản đồ. |
| Hình do AI vẽ | `CREDITS.md` ghi "CC0 / tự tạo". Quyền với hình AI vẽ chưa rõ ràng; rủi ro thấp nhưng không nên ghi như hình tự vẽ. | Suy luận của em. |
| Quyền riêng tư | Không tài khoản, không thông tin cá nhân; đếm lượt bằng Cloudflare không dùng cookie. Chưa có dòng nào trong game nói điều này. | Tự kiểm (chỉ thấy 2 lệnh gọi ra ngoài tới cloudflareinsights). |

### Kiếm tiền có thực tế không
- **Em không có số nào để ước tính** (kho không có số người chơi, không có tỉ lệ hoa hồng). Em không đoán thành số.
- Về cách tính: tiền Shopee = số người chơi × tỉ lệ bấm nút × tỉ lệ mua × hoa hồng. Người đang chơi game thủ thành không ở tâm thế mua hàng; nút lại phải ghi nhãn quảng cáo và không được thưởng. Em cho rằng khoản này sẽ nhỏ.
- Giá trị thực tế hơn của game, theo em:
  1. Nguồn clip cho kênh Gọn (máy tự chơi quay được mọi màn, 0 đồng).
  2. Quà kèm đơn Hiệu giày Hải Nancy và Yen Handmade Leather (thẻ QR dẫn về game, tiệm của anh có mặt trong game). Cái này đo được bằng lượt quét.
  3. Về sau: tiệm thật ở Đà Lạt trả tiền để có mặt trong game. Chỉ có nghĩa khi đã có người chơi, và cần hợp đồng.
- Đề xuất mốc: chỉ làm nút Shopee khi số người mở game mỗi ngày (theo Cloudflare) đạt mức anh tự đặt và giữ được 2 tuần. Trước mốc đó, mọi giờ công nên dồn vào giữ chân người chơi.

## Chất lượng code và khả năng bảo trì

Điểm mạnh:
- Lõi game (`src/core`) tách khỏi phần vẽ, chạy được không cần trình duyệt, nên mới có bộ đo độ khó.
- Chế độ kiểm chặt của TypeScript bật; không có `any`.
- Có 102 bài kiểm lõi + 20 bài kiểm trình duyệt, có công cụ sinh phố.

Điểm yếu:
- **Hai file khổng lồ.** `TdStageScene.ts` 4.619 dòng, `TitleScene.ts` 2.101 dòng. Riêng hàm `mountTitleOverlay` dài 1.813 dòng (toàn bộ màn chính trong 1 hàm); `processCombatEvents` 904 dòng. AI sửa file cỡ này rất dễ làm hỏng chỗ khác mà không biết; phần này lại không có bài kiểm lõi.
- **Giao diện ghép bằng chuỗi HTML**, không lọc dữ liệu. Đây là gốc của lỗi C3 và sẽ lặp lại.
- **Bài kiểm chưa che chỗ nguy hiểm nhất:** nạp bản lưu hỏng, đồng bộ khi lỗi mạng, tỉ lệ rơi đồ ở phố thật, túi đồ lớn dần, gọi đợt sớm.

Chỗ dễ vỡ khi **thêm 1 phố** (trợ lý liệt kê, em kiểm lại một số): ngoài file nội dung và chạy công cụ sinh, còn phải sửa tay ở khoảng 10 nơi: `src/core/cities.ts` (thông tin phố), toạ độ ghim trong `TitleScene.ts`, 2 công cụ vẽ bản đồ có danh sách phố ghi cứng, hình nền + hình phòng + bảng tên, nhạc và "phố đêm" chọn theo mã phố trong `TdStageScene.ts`, danh sách mã trong `tests/realStreets.test.ts` và `tools/kiemtra/README.md`. Món của phố này được màn phố khác dùng, nên đổi 1 phố phải sinh lại tất cả. Thứ tự phố theo tên file.

Khi **thêm 1 tiệm vào Phố Dốc:** `unlockedStage` chỉ nhận 1–4 (`saveSystem.ts:37-38`), giá trị khác bị đưa về 1; 73 chỗ trong `TdStageScene.ts` kiểm `stage_N` ghi cứng.

Khi **thêm 1 tỉnh:** chưa có mô hình dữ liệu (xem "Nên hoãn").

Bản lưu: chỉ nhận `version: 1`, khác đi là về mặc định, chưa có đường nâng cấp bản lưu. Đổi cấu trúc lưu lần đầu sẽ xoá tiến độ mọi người chơi nếu không cẩn thận.

Đề xuất bảo trì, làm dần khi sửa lỗi (không làm lại từ đầu):
1. Một hàm lọc HTML dùng chung + một hàm kiểm bản lưu dùng chung. Sửa C3 và V3 bằng 2 hàm này.
2. Mỗi lần đụng `TitleScene` thì tách 1 phần ra file riêng (lưu / QR, trang bị, bản đồ).
3. Một file khai báo phố duy nhất để các công cụ và bài kiểm đọc chung.
4. Thêm bài kiểm cho đúng 4 lỗi mức cao trước khi sửa, để lần sau không lọt lại.

## Phụ lục: nguồn tra cứu ngoài kho

- Điều kiện cung cấp game G2, G3, G4 (bài phân tích, không phải văn bản gốc): https://luatvietnam.vn/doanh-nghiep/dieu-kien-thu-tuc-de-cung-cap-dich-vu-tro-choi-dien-tu-g2-g3-g4-561-101208-article.html
- Tổng quan Nghị định 147/2024/NĐ-CP: https://luatvietnam.vn/linh-vuc-khac/kinh-doanh-tro-choi-dien-tu-tren-mang-883-100134-article.html

Các bài thử của em (chơi thử, mô phỏng, tái hiện lỗi đồng bộ và link lưu) chạy trong thư mục tạm của phiên, không đưa vào kho. Cần lại thì em viết lại được từ mô tả trong bảng lỗi.
