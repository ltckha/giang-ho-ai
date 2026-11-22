# Kế hoạch: game kiếm hiệp có nhân vật AI, chơi offline (N73)
Soạn: Điều phối, 22/11/2026. Anh Kha nói "làm" 22/11. Phiên cloud Giang Hồ AI giao Antigravity cloud và rà kết quả.

## Đổi hướng thủ thành (anh Kha chốt 22/11)
- Bản nhập vai (Giai đoạn 1–2, commit 23c6b31) chơi thấy không thú vị → đổi sang game thủ thành: quái đi theo đường về Thành Lam Lư, người chơi đặt khôi lỗi phe mình chặn, tiền là linh thạch, ngũ hành khắc chế.
- Giữ bối cảnh, tên đã duyệt, câu chuyện AI. Lời giao: docs/ANTIGRAVITY_BRIEF_THU_THANH.md.
- Bản đầu: 3 màn, 5 loại quân, 6 loại quái, 1 trùm. Claude tự chơi và chấm "vui" từng màn, không chỉ "chạy được".
- Đổi chủ đề (anh Kha chốt 22/11): bỏ giang hồ khôi lỗi, thành "Gọn Tiệm, Sạch Phố" — đặt dép tông, bốt da, xịt chống thấm, túi xách, bàn chải chặn mưa, bùn, côn trùng, chuột, nấm mốc, trùm Mùa Nồm. Chi tiết và lý do từng cặp khắc chế: docs/CHU_DE_GIU_TIEM.md. Làm cùng lúc với bước làm đẹp.
- Làm đẹp (anh Kha chốt 22/11): sau khi Màn 1 đạt vui; thử 3 hình mẫu bằng công cụ vẽ của Antigravity, anh duyệt nét rồi mới vẽ đủ bộ; thêm hiệu ứng và giao diện gỗ-đồng; bản build ≤ 5 MB. Lời giao: docs/ANTIGRAVITY_BRIEF_LAM_DEP.md.
- Các mục Giai đoạn 1–3 bên dưới là kế hoạch nhập vai cũ, chỉ để tham khảo.

## Lộ trình dài hạn (anh Kha nêu 22/11, làm dần — chưa làm ngay)
Nguyên tắc: game vui trước, có người chơi rồi mới gắn bản đồ và quảng cáo.
1. **Đang làm:** game thủ thành vui + đẹp, chủ đề phố nhiều tiệm (bản đầu 3 tiệm: giày, bánh, hoa; trùm chung Mùa Nồm).
2. **Màn theo phố Đà Lạt thật:** dùng dữ liệu OpenStreetMap (miễn phí, giấy phép ODbL, phải ghi "© OpenStreetMap contributors"), lấy hình dạng đường phố thật làm đường đi của quái, dữ liệu đóng gói sẵn để chơi offline. Không dùng Google Maps lúc này (cần khoá API, tài khoản thanh toán, có thể tốn tiền, cần mạng).
3. **Món là sản phẩm thật + link tiếp thị liên kết Shopee của anh Kha:** chạm món → nút "Xem món này" mở link. Trước khi làm phải: đọc điều khoản Shopee Affiliate (có cho đặt link trong game không), kiểm quy định ghi nhãn quảng cáo ở Việt Nam, và anh Kha quyết bỏ nguyên tắc "không quảng cáo".
4. **Người chơi tự chọn phố / thành phố của mình** để game dựng màn (dùng OpenStreetMap; xin quyền vị trí chỉ khi người chơi đồng ý). **Thương hiệu tài trợ** đặt món / tiệm vào màn — khi đã có người chơi thật, có hợp đồng và được phép dùng tên / hình.

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
