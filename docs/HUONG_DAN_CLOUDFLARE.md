# Đưa game Gọn Phố lên Cloudflare Pages (anh Kha làm 1 lần, máy tính ~10 phút)

## LINK CHÍNH TỪ 25/11/2026: https://gon-pho.pages.dev
Dự án Pages "gon-pho" (tài khoản Gọn, nối GitHub ltckha/giang-ho-ai). Dự án cũ "giang-ho-ai" (giang-ho-ai.pages.dev) chạy song song tới khi anh xoá.

## ĐÃ XONG 24/11/2026 (dự án cũ)
- **Link chơi công khai: https://giang-ho-ai.pages.dev** (tài khoản Cloudflare "Gọn", dự án Pages "giang-ho-ai" nối GitHub ltckha/giang-ho-ai).
- Branch control: Production branch **phat-hanh**, tự phát hành khi nhánh này đổi.
- Tên dự án tự đặt theo tên kho, không đổi được. Muốn link đẹp: gắn tên miền Gọn sau này, hoặc đổi tên kho + tạo dự án mới "gon-pho" cùng lúc.
- Tài khoản "zz Dư - không dùng" (trước tên Gọn Simpli) là tài khoản trống tạo dư — Cloudflare không cho tự xoá tài khoản phụ; KHÔNG bấm "Delete user" (xoá cả hồ sơ đăng nhập).
- Phát hành: anh nhắn "phát hành" → Claude đẩy bản đã kiểm lên nhánh phat-hanh (`git push origin <commit>:phat-hanh`) → Cloudflare tự dựng ~1 phút → Claude mở link kiểm lại.


Tài khoản: **tài khoản Cloudflare mới tên "Gọn"** (anh Kha chốt 24/11): GỌN và game Gọn Phố nằm chung, tách khỏi phần web Hiệu giày Hải Nancy. Tạo thêm tài khoản Free ngay trong cùng lần đăng nhập (tối đa 5 tài khoản thêm): https://developers.cloudflare.com/changelog/post/2026-08-04-free-dashboard-button/
Game là 1 trang Pages riêng, không gắn vào trang GỌN (trang đó có mật khẩu). Worker "gon" chuyển sang tài khoản Gọn do phiên GỌN lo, anh duyệt bên đó.

## Vì sao không lo dung lượng (nguồn Cloudflare)
- Game chỉ là file tĩnh (~16 MB, 122 file), không dùng Functions → lượt mở game **miễn phí, không giới hạn**, không trừ vào 100.000 lượt/ngày của Worker (hạn mức tính riêng từng tài khoản): https://developers.cloudflare.com/pages/functions/pricing/
- Giới hạn gói miễn phí: 20.000 file, mỗi file ≤ 25 MiB, 500 lần dựng/tháng: https://developers.cloudflare.com/pages/platform/limits/

## Các bước
0. Vào https://dash.cloudflare.com → bấm tên tài khoản góc trên trái (ô chuyển tài khoản) → **Create Account** → đặt tên **Gọn** → tạo xong thì chuyển sang tài khoản Gọn.
1. Kiểm tra góc trên trái đang là tài khoản **Gọn** (không phải Giày Hải Nancy).
2. Menu trái **Workers & Pages** → **Create application** → thẻ **Pages** → **Connect to Git**.
   (Nếu màn hình mặc định ra Workers, tìm dòng "Looking to deploy Pages? Get started".)
3. Chọn GitHub, cho phép ứng dụng Cloudflare: chọn **Only select repositories** → chọn **ltckha/giang-ho-ai** → Install & Authorize.
4. Chọn repo **giang-ho-ai** → **Begin setup**.
5. Điền:
   - Project name: **gon-pho** (link sẽ là gon-pho.pages.dev)
   - Production branch: **phat-hanh**
   - Framework preset: **None**
   - Build command: **npm run build**
   - Build output directory: **dist**
6. Bấm **Save and Deploy**, chờ 2–3 phút tới khi báo Success.
7. Tắt bản xem trước của các nhánh khác (để người ngoài không thấy bản đang làm dở):
   Vào project **gon-pho** → **Settings** → **Builds & deployments** (hoặc **Branch control**) → **Preview deployments / Automatic deployments** cho nhánh khác → chọn **None** → Save.
8. Mở **https://gon-pho.pages.dev** trên điện thoại xem chơi được chưa → nhắn Claude.

## Sau này
- Claude sửa game trên nhánh làm việc; chỉ khi anh nhắn **"phát hành"** Claude mới đẩy bản đã kiểm lên nhánh **phat-hanh** → Cloudflare tự cập nhật link.
- Mua tên miền Gọn rồi: project gon-pho → Custom domains → thêm **pho.<tên miền>**.
- Không cần đưa mật khẩu / mã khoá cho Claude.

## 🔑 Máy chủ lưu "QR chìa khoá" (D1) — anh Kha làm 1 lần (~3 phút)
Code: functions/api/luu.ts → src/server/luuHandler.ts (tự tạo bảng `luu` lần đầu). Chưa gắn D1 thì game vẫn chạy, nút QR chìa khoá báo "Máy chủ chưa bật".
1. dash.cloudflare.com → tài khoản **Gọn** → **Storage & databases** → **D1 SQL database** → **Create** → tên `gon-pho-luu` → Create.
2. **Workers & Pages** → **gon-pho** → **Settings** → **Bindings** → **Add** → **D1 database** → Variable name `DB` → chọn `gon-pho-luu` → **Save**.
3. Nhắn Claude "phát hành" (gắn D1 có hiệu lực từ lần phát hành kế).
Giới hạn miễn phí D1: 5 triệu dòng đọc / 100.000 dòng ghi mỗi ngày, 500 MB mỗi cơ sở, 10 cơ sở, 5 GB mỗi tài khoản: https://developers.cloudflare.com/d1/platform/limits
Đông người: tách nhiều cơ sở theo ký tự đầu chìa khoá (vd 0–7 → luu_a, 8–f → luu_b) hoặc lên gói Workers Paid — code chỉ đổi chỗ chọn DB.
