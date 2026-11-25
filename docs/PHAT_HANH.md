# Lộ trình phát hành & pháp lý — Gọn Phố (anh Kha gửi 26/11/2026)

Nguồn: bản "Lộ trình phát hành & vận hành kênh truyền thông" anh Kha dán 26/11. Claude ghi lại, kèm chỗ đã kiểm và quyết định của anh.
Không phải ý kiến luật sư: các điểm pháp lý cần luật sư / Sở xác nhận trước khi làm.

## 1. Định hướng theo giai đoạn
- **Loại game mục tiêu:** G4 (game tải về chơi đơn lẻ, không PvP, lưu tiến độ trên máy).
- **Giai đoạn 1 — nội bộ & xây cộng đồng (hiện tại)**
  - Chỉ chia sẻ cho bạn bè: TestFlight (iOS) / Internal Testing hoặc APK riêng (Android).
  - Không link tải công khai, không quảng cáo kiếm tiền, không thanh toán / nạp / chuyển khoản.
  - Quay video chơi các màn đăng TikTok, YouTube Shorts, Reels (quy chuẩn: `docs/VIDEO_QUY_CHUAN.md`). Ai hỏi tải: trả lời đang thử nghiệm nội bộ, chưa phát hành công khai.
- **Giai đoạn 2 — quốc tế:** đăng ký quyền tác giả phần mềm + bộ đồ hoạ Gọn Phố đứng tên cá nhân (Cục Bản quyền tác giả); phát hành Google Play / App Store bằng tài khoản cá nhân ở thị trường quốc tế, tắt khu vực Việt Nam.
- **Giai đoạn 3 — Việt Nam:** uỷ quyền phát hành qua đơn vị có Giấy chứng nhận cung cấp dịch vụ trò chơi điện tử G2–G4 (Nghị định 147/2024/NĐ-CP), ví dụ VNappmob. Giữ 100% quyền sở hữu trí tuệ; bản Việt Nam dùng mã gói (Package Name / Bundle ID) riêng trên tài khoản đơn vị phát hành, không đè app quốc tế.

## 2. Đã kiểm / cần sửa trong bản gốc
- TestFlight: 100 là giới hạn **người thử nội bộ** (thành viên tài khoản nhà phát triển). Người thử bên ngoài tới 10.000 nhưng bản phải qua Apple duyệt. Mỗi bản dùng 90 ngày. Google Play Internal Testing: tối đa 100 người.
- "Giữ tính chất thử nội bộ thì miễn thủ tục công ty và giấy phép": là cách hiểu luật, **chưa xác nhận** → hỏi luật sư / Sở.
- Phông chữ game: Be Vietnam Pro, Noto Serif (giấy phép OFL, dùng thương mại được). Nhạc nền tách riêng, có nút tắt độc lập.

## 3. Anh Kha chốt 26/11
- **Link web gon-pho.pages.dev:** khoá bằng **mã mời** (`src/game/invite.ts`). Người mới phải nhập mã; máy đã có tiến độ, chạy thử tự động, quay video (`?quay=`) được vào. Gửi bạn bè: `…/#moi=<MÃ>`. Mã thật anh giữ, kho chỉ lưu mã băm.
- **QR chìa khoá (máy chủ lưu tiến độ):** giữ nguyên.
- **Công tắc theo vùng** (`src/game/region.ts`): mặc định tắt; bản Việt Nam build với `VITE_REGION=vn` (xem thử `?vung=vn`) → hiện nhãn tuổi `00+` và dòng "Chơi quá 180 phút một ngày sẽ ảnh hưởng xấu đến sức khỏe".

## 4. Còn chờ
- Luật sư / Sở: web chơi thử có mã mời có cần giấy phép không; game có máy chủ lưu tiến độ có bị xếp G2 không.
- Gói thành app (Android / iOS) cho TestFlight / Internal Testing: chưa làm, chờ anh nói "làm".
