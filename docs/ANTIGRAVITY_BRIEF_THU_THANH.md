# Lời giao Antigravity: Đổi hướng — game thủ thành (đặt quân chặn quái)

Anh Kha chơi bản nhập vai (Giai đoạn 1–2) thấy không thú vị. Đổi sang game **thủ thành**: quái đi theo đường tiến về thành, người chơi đặt quân dọc đường để diệt quái. Bản nhập vai cũ nằm trong lịch sử git tại commit `23c6b31` — không cần giữ trong bản build mới.

Đọc trước: docs/PLAN.md (mục Bối cảnh và mục "Đổi hướng thủ thành"), docs/NAMES.md. Làm trong repo này, nhánh main, không đụng repo khác. Luật cũ vẫn giữ: game mới hoàn toàn, không tên / hình / màn / giao diện của bất kỳ game thủ thành hay game nào khác có thật, không tên Võ Lâm Truyền Kỳ / Kim Dung / công ty AI có thật; Phaser 3 + TypeScript + Vite; offline; không khoá API, không quảng cáo, không theo dõi; hình / âm tự tạo hoặc CC0, ghi CREDITS.md.

## Câu chuyện
Khôi lỗi bị gỡ bùa phong ấn nổi loạn, từ mỏ linh thạch kéo về Thành Lam Lư. Người chơi đặt khôi lỗi phe mình dọc đường để chặn. Tiền đặt quân là linh thạch, rơi ra khi diệt quái. Dùng lại tên đã duyệt (Thành Lam Lư, Rừng Thạch Mạch, Động Tàn Cơ, Sơ Giác, Lũng Đại Mạch, Vạn Chép…).

## Bản đầu (đủ để thử vui hay không)
- **3 màn**, mỗi màn 5–8 phút, 8–12 đợt quái, có đường đi riêng (màn 2 có 2 ngả, màn 3 có 2 cửa quái vào). Màn 3 có trùm.
- **5 loại quân (khôi lỗi phe mình), mỗi loại 1 hệ ngũ hành, vai khác nhau:** đánh đơn tầm xa, đánh lan, làm chậm, đánh mạnh chậm, hỗ trợ (tăng quân cạnh bên hoặc gỡ trạng thái). Mỗi loại nâng cấp 3 bậc; bậc 3 chọn 1 trong 2 nhánh. Bán lại được (hoàn 70%).
- **6 loại quái + 1 trùm:** có con nhanh, con máu trâu, con bay / bỏ qua làm chậm, con chia đôi khi chết, con "phá bùa" làm quân gần nó đứng im vài giây, con hồi máu cho bầy. Mỗi con 1 hệ ngũ hành.
- **Ngũ hành dùng lại `src/core/elements.ts`** (khắc 1.35x / bị khắc 0.75x). Trước mỗi đợt hiện biểu tượng hệ của đợt sắp tới để người chơi tính.
- Thành có số mạng (vd 20); quái lọt vào trừ mạng; hết mạng thì thua. Thắng màn chấm 1–3 sao theo mạng còn lại.
- Nút gọi đợt sớm (thưởng thêm linh thạch), nút tốc độ x1 / x2, tạm dừng.
- **Cảm giác đánh:** số sát thương nảy lên, chữ "Khắc!" khi đúng hệ, quái chớp sáng khi trúng, nổ mảnh khi chết, linh thạch bay về góc màn hình, rung nhẹ khi mất mạng. Âm thanh ngắn cho bắn / trúng / chết / mất mạng (Web Audio tự tạo).
- **Điện thoại cầm dọc là chính:** bản đồ chiếm phần lớn màn hình, chạm ô trống để mở vòng chọn quân, chạm quân để nâng cấp / bán. Máy tính dùng chuột. Không cần bàn phím.
- Tự lưu màn đã qua và số sao (localStorage, khoá mới, không đọc bản lưu nhập vai cũ).

## Bỏ khỏi bản build
Các scene / giao diện / test nhập vai (thành, rừng, hang đi bộ, đồng đội, túi đồ, bang hội, nhiệm vụ) — xoá khỏi main để code gọn. Giữ những gì dùng lại được (ngũ hành, sinh hình, âm thanh, lưu máy).

## Thứ tự làm
1. **Tên mới, chờ Claude rà:** ghi mục "Thủ thành" vào docs/NAMES.md: tên 5 loại quân + tên nhánh nâng cấp, 6 loại quái, 3 màn. Commit, push, rồi chờ docs/REVIEW_LOG.md có dòng "NAMES THỦ THÀNH: ĐỒNG Ý" mới gắn tên / vẽ hình. Trong lúc chờ làm lõi (đường đi, đợt quái, bắn, ngũ hành) với tên tạm.
2. **Màn 1 chơi được trước** (đủ 5 quân, 4 loại quái), push, ghi docs/PROGRESS.md + ảnh điện thoại dọc. Claude sẽ chơi thử và chấm vui trước khi làm màn 2–3.
3. Màn 2, màn 3, trùm, sao, lưu.

## Tiêu chí "vui" Claude sẽ chấm (tự chơi hết từng màn)
- Có lúc phải nghĩ nên đặt / nâng quân gì, đặt ở đâu (không có 1 loại quân thắng mọi thứ).
- Chơi bình thường có lúc suýt thua; chơi ẩu thì thua được.
- Ngũ hành tạo khác biệt thấy rõ.
- Thắng xong muốn chơi màn sau.
Màn nào không đạt sẽ bị trả lại.

## Cách nộp
- Commit nhỏ, git push lên main sau MỖI phần. Mỗi commit `npm test` và `npm run build` qua.
- Test: sát thương ngũ hành + nâng cấp, đường đi / đợt quái (seed cố định), kinh tế linh thạch (tổng linh thạch màn 1 đủ thắng nhưng không thừa), trạng thái phá bùa / làm chậm.
- e2e Playwright (điện thoại dọc): mở game → vào màn 1 → đặt quân bằng chạm → chạy hết các đợt bằng x2 → thắng; không lỗi console, không gọi mạng ngoài. Thêm 1 bot đơn giản tự đặt quân để kiểm màn thắng được.
- Xong bản đầu ghi "THỦ THÀNH BẢN 1 XONG" dòng đầu docs/PROGRESS.md.
