# Kế hoạch: game kiếm hiệp có nhân vật AI, chơi offline (N73)
Soạn: Điều phối, 22/11/2026. Anh Kha nói "làm" 22/11. Phiên cloud Giang Hồ AI giao Antigravity cloud và rà kết quả.

## Đổi hướng thủ thành (anh Kha chốt 22/11)
- Bản nhập vai (Giai đoạn 1–2, commit 23c6b31) chơi thấy không thú vị → đổi sang game thủ thành: quái đi theo đường về Thành Lam Lư, người chơi đặt khôi lỗi phe mình chặn, tiền là linh thạch, ngũ hành khắc chế.
- Giữ bối cảnh, tên đã duyệt, câu chuyện AI. Lời giao: docs/ANTIGRAVITY_BRIEF_THU_THANH.md.
- Bản đầu: 3 màn, 5 loại quân, 6 loại quái, 1 trùm. Claude tự chơi và chấm "vui" từng màn, không chỉ "chạy được".
- Đổi chủ đề (anh Kha chốt 22/11): bỏ giang hồ khôi lỗi, thành "Gọn Tiệm, Sạch Phố" — đặt dép tông, bốt da, xịt chống thấm, túi xách, bàn chải chặn mưa, bùn, côn trùng, chuột, nấm mốc, trùm Mùa Nồm. Chi tiết và lý do từng cặp khắc chế: docs/CHU_DE_GIU_TIEM.md. Làm cùng lúc với bước làm đẹp.
- Ngũ hành giữ tiệm (anh Kha chốt 22/11): giữ vòng ngũ hành, gán hành cho món / quái theo đời thường; thêm tương sinh (cặp ăn ý), bậc 4 tuyệt chiêu, nâng cấp giữa màn bằng sao; mỗi màn 8–12 đợt (6–10 phút), sau này có chế độ Vô tận. Chi tiết: docs/CHU_DE_GIU_TIEM.md.
- Làm đẹp (anh Kha chốt 22/11): sau khi Màn 1 đạt vui; thử 3 hình mẫu bằng công cụ vẽ của Antigravity, anh duyệt nét rồi mới vẽ đủ bộ; thêm hiệu ứng và giao diện gỗ-đồng; bản build ≤ 5 MB. Lời giao: docs/ANTIGRAVITY_BRIEF_LAM_DEP.md.
- Các mục Giai đoạn 1–3 bên dưới là kế hoạch nhập vai cũ, chỉ để tham khảo.

## Lộ trình 6 chặng (anh Kha nói "ghi" 22/11)
Mỗi chặng có chốt kiểm; chặng trước đạt mới sang chặng sau. Antigravity làm, Claude rà và chấm, anh Kha duyệt những gì nhìn thấy (tên, nét vẽ, cảm giác chơi). Bản cũ luôn còn trong lịch sử git.

1. **Màn 1 vui + đẹp (đang làm):** đổi chủ đề tiệm giày "Ngũ hành giữ tiệm", hình mẫu → anh duyệt nét → đủ bộ hình + hiệu ứng. Chốt: anh chơi thấy thích.
2. **Bản đầu đủ 3 tiệm:** Màn 2 tiệm bánh, Màn 3 tiệm hoa + trùm Mùa Nồm đổi hành; tương sinh, bậc 4, nâng cấp giữa màn bằng sao (~30 phút chơi). Chốt: Claude chấm vui từng màn, anh chơi hết.
3. **Người thật chơi thử:** đưa lên địa chỉ công khai miễn phí (vd Cloudflare Pages), cài được ra màn hình điện thoại như app (không cần kho ứng dụng); 10–20 người quen chơi, giới thiệu qua @gon.simpli. Anh quyết có thêm bộ đếm người chơi ẩn danh hay không. Chốt: người chơi quay lại.
4. **Thêm nội dung + phố thật:** tiệm mới (cà phê, nhà sách, tạp hóa), chế độ Vô tận; màn theo phố Đà Lạt thật từ OpenStreetMap (miễn phí, ghi "© OpenStreetMap contributors", đóng gói sẵn để chơi offline; không dùng Google Maps lúc này vì cần khoá API, tài khoản thanh toán, có thể tốn tiền, cần mạng).
5. **Kiếm tiền nhẹ nhàng:** món là sản phẩm thật, chạm "Xem món này" mở link tiếp thị liên kết Shopee của anh; có thể đưa tiệm của anh vào game. Đã nghiên cứu sơ bộ (docs/research/2026-11-22_nghien_cuu_chang3-6.md): phải đăng ký game là kênh với Shopee trước; nút ghi rõ, có nhãn "Quảng cáo – link tiếp thị Shopee"; không tự mở Shopee, không thưởng vật phẩm cho việc bấm link. Anh quyết bỏ nguyên tắc "không quảng cáo". Chốt: đã có người chơi thật.
6. **Mở rộng:** người chơi tự chọn phố / thành phố của mình (xin quyền vị trí chỉ khi người chơi đồng ý); thương hiệu tài trợ (có hợp đồng, được phép dùng tên / hình); lên Google Play / App Store nếu chặng 3–5 cho thấy đáng (theo Claude biết: Google Play 25 USD một lần, Apple 99 USD mỗi năm — kiểm lại giá khi tới chặng này).

**Video kênh Gọn (anh Kha nói "ghi" 22/11):** máy tự chơi + quay màn hình dọc 9:16 (Playwright), clip 15–30 giây, chỉ dùng âm thanh trong game (không nhạc ngoài). Nội dung: "đặt sai món là thua" → chơi lại đúng hành thì thắng; khoảnh khắc "Trúng tủ!"; trùm Mùa Nồm đổi hành; ghép mẹo thật (vd mùa mưa bỏ gói hút ẩm vào giày). Đăng qua hệ thống đăng bài đang có (phiên "Thực thi · Đăng bài"), mỗi lần anh duyệt trước. Thời điểm: quay thử 3–5 clip sau chặng 1 (chưa đăng); bắt đầu đăng từ chặng 3 khi có link chơi công khai. Xen kẽ với nội dung khác của kênh, không lấn hết.

**Độ khó và trang bị (anh Kha chốt 23/11):** không giảm sức đồ ở 3 tiệm đầu. Độ khó tăng dần ở các tiệm / phố làm sau; đồ rơi cũng tốt dần theo tiến độ (màn sau, nhiều sao → hạng cao hơn). Khi thiết kế tiệm / phố mới, Claude cân độ khó theo mức đồ người chơi có thể đã có ở thời điểm đó (dùng docs/review/sim_gear.ts).

**Chia việc vẽ (anh Kha chốt 23/11):** Spark vẽ hình rời (món, quái) theo mẫu `docs/MAU_GIAO_SPARK_VE.md`, lưu Drive `Spark/Inbox/Game_ve_thu/`; Claude lấy về, ghép vào game, cho nhúc nhích bằng code, chụp màn hình cho anh duyệt. Antigravity giữ phần cần sửa code: nền phố, hiệu ứng, giao diện, cảnh. Lý do: bớt chờ Antigravity. Áp từ phố thứ 3 hoặc bộ hình chung theo loại quán; việc 9 (2 phố thật) Antigravity làm trọn. Thử 23/11: Spark vẽ phin cà phê + hơi ẩm, đúng nét, nền trong suốt.

Giữ suốt các chặng: tới chặng 5 vẫn 0 đồng và chơi offline. Thời gian: không hứa ngày; ước chặng 1–2 vài ngày tới 1–2 tuần nếu duyệt kịp (Antigravity có thể hết lượt hoặc bị trả lại vì chưa vui).

## Kết luận (kế hoạch nhập vai cũ)
- Game kiếm hiệp hoàn toàn mới, không chép Võ Lâm Truyền Kỳ. 2D nhìn từ trên xuống, chơi trên trình duyệt (điện thoại + máy tính), không cần mạng, 0 đồng.
- Đồng đội và đối thủ là nhân vật AI: tự đánh, tự nhặt đồ, theo tổ đội, có tính cách riêng.
- 3 giai đoạn; Giai đoạn 1 nhỏ để chắc có bản chơi được.

## Bối cảnh (anh Kha chốt 22/11)
Game kiếm hiệp, không cài AI thật; câu chuyện kể lại thời đại AI ngoài đời, khoác áo giang hồ cổ trang.
- Khôi lỗi biết nghĩ: người máy gỗ và đồng chạy bằng linh thạch, là "AI" của thời cổ. Người chơi là người thường có khôi lỗi đi cùng (như ai cũng dùng AI hằng ngày). 3 đồng đội AI là 3 khôi lỗi (liều / cẩn thận / tham đồ).
- Ánh xạ chuyện thật → chuyện game:
  - Đua chip → tranh mỏ linh thạch.
  - Các công ty AI lớn → các lò đúc khôi lỗi, mỗi mùa tung khôi lỗi mạnh hơn.
  - Mở / đóng / lo ngại → 3 môn phái: truyền bí kíp đúc cho mọi người / giữ kín bí kíp bán khôi lỗi / muốn cấm khôi lỗi.
  - AI làm mất việc → thợ rèn, người chép sách, tiêu cục mất việc (nhiệm vụ phụ).
  - AI bịa chuyện → khôi lỗi nói sai mà tự tin, dẫn người chơi đi lạc.
  - Giả giọng giả mặt lừa đảo → khôi lỗi đóng giả trưởng lão lừa dân.
  - Lấy dữ liệu dạy AI → bí kíp các phái bị chép trộm dạy khôi lỗi.
  - Luật an toàn AI / phá luật → bùa phong ấn trên khôi lỗi / kẻ chuyên phá phong ấn.
  - AI tự nhận thức → trùm hang là khôi lỗi đầu tiên tỉnh dậy: "Ta có được tự quyết mạng mình không?"
- Giai đoạn 1: thành có lò đúc, chợ khôi lỗi, thợ rèn mất việc; rừng là mỏ linh thạch bị tranh; hang có trùm khôi lỗi tỉnh dậy.
- Tên lò đúc, môn phái, nhân vật tự đặt mới. Không dùng tên công ty AI có thật, không lấy gì từ Võ Lâm Truyền Kỳ.

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

**Xe đi phố (anh Kha chốt 23/11):** xe là phương tiện, không phải trang bị ngũ hành — 1 ô riêng ngoài vòng 10 món, chỉ có tác dụng khi ra phố (Trận trùm phố đầu + mọi màn trên phố thật). Mỗi xe 1 tác dụng luôn bật + 1 chiêu bấm 1 lần mỗi màn. 7 xe: Đi Bộ, Xe Đạp, Xe Số, Xe Ga, Xe Điện, Xe Ba Gác, Xe Jeep. Nhận xe khi thắng lần đầu Trận trùm phố, tiệm thứ 5 và màn phố của mỗi phố thật. Luật: src/core/vehicles.ts.
**Chia việc khi Antigravity hết lượt (23/11):** Spark vẽ toàn bộ hình; Claude làm cả giao diện (màn chọn tiệm, ô xe, ghép nền).

**Đổi tên game (anh Kha chốt 23/11):** "Gọn Tiệm, Sạch Phố" → **Gọn Phố** (dòng phụ giữ "Ngũ hành giữ tiệm"). Khớp kênh Gọn. Đã đổi: màn hình chờ, màn chính, logo, biểu tượng app, ảnh chia sẻ link, tên khi cài ra màn hình điện thoại.

## Giai đoạn 4: chế độ TikTok LIVE (Điều phối đề xuất 24/11, Claude chỉnh cho khớp game hiện tại)
Làm SAU chặng 3 "Người thật chơi thử" (game đã có link công khai, có người chơi quay lại). Lý do: LIVE cần game ổn định, đẹp, đủ màn.
Phân việc: Claude làm code; Spark vẽ hình (Antigravity đang hết lượt — không giao Antigravity trừ khi có lượt lại).

Game hiện là **thủ thành Gọn Phố** (đặt món giữ tiệm, ngũ hành khắc chế), không có nhân vật chính đi bản đồ / lên cấp. Vì vậy:

1. **Khung LIVE:** trang dọc 1080×1920 chạy trên máy (localhost), gắn vào TikTok LIVE Studio bằng nguồn "Liên kết". Dùng lại chế độ quay video dọc đã có (?video=1), thêm ô hiện bình luận / quà / bảng xếp hạng.
2. **Người xem tham gia (theo kiểu thủ thành):**
   - Bình luận tên → món tiếp theo được đặt mang tên người xem (hiện tên trên món), xoay vòng tối đa vài người.
   - Bình luận gợi ý hành ("kim", "thủy"…) → máy ưu tiên đặt món hành đó; "gọi đợt" → gọi đợt sớm.
   - Thả tim → hồi tim giữ tiệm; quà nhỏ → thêm xu / mưa xu; quà lớn → bật tuyệt chiêu hoặc gọi trùm phố ra sớm.
   - Bảng xếp hạng người xem góp nhiều nhất trong buổi.
   - Đọc quà / bình luận bằng thư viện không chính thức (TikTok không có API chính thức), tách riêng 1 lớp; hỏng thì game vẫn chạy. Chỉ cần @tên kênh, không lưu mật khẩu / token trong repo.
3. **Máy chơi như người thật lúc LIVE:** dựa trên bot tự chơi đã có (src/core/tdBot.ts):
   - Tự đặt món, nâng cấp, gọi đợt, dùng tuyệt chiêu, dùng chiêu xe; chọn màn tiếp theo trên bản đồ.
   - Nhịp như tay người: lúc nhanh lúc chậm, có lúc đặt chưa tối ưu, nghỉ ngắn, không lặp y hệt giữa các ván.
   - Phản ứng bằng chữ trên màn hình (cảm ơn quà, làm theo gợi ý). Không dùng giọng AI.
   - Nút chuyển: người thật cầm / máy cầm.
4. **Chạy thử không cần TikTok:** giả lập bình luận, tim, quà.
5. **Test:** lớp đọc sự kiện giả lập; máy chơi không kẹt, không đứng yên quá lâu.

### Luật bắt buộc (nghiên cứu Hub 24/11)
- TikTok cắt LIVE và hạn chế kênh khi LIVE không người, màn hình lặp lại. Máy chơi là lớp phụ; luôn có người thật lúc LIVE.
- Không làm: vượt captcha LIVE Studio, LIVE nhiều tài khoản cùng lúc, proxy, nuôi tài khoản, vòng quay / rút thăm may mắn.
- Không đưa khoá, mật khẩu, token tài khoản cho bất kỳ phiên nào hay vào repo.
