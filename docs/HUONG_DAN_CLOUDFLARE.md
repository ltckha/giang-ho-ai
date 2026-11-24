# Đưa game Gọn Phố lên Cloudflare Pages (anh Kha làm 1 lần, máy tính ~10 phút)

Tài khoản: Cloudflare "Giày Hải Nancy" (cùng giayhainancy.vn, cùng Worker "gon"). Game là 1 trang Pages riêng, không gắn vào trang GỌN.

## Vì sao không lo dung lượng (nguồn Cloudflare)
- Game chỉ là file tĩnh (~16 MB, 122 file), không dùng Functions → lượt mở game **miễn phí, không giới hạn**, không trừ vào 100.000 lượt/ngày của Worker "gon": https://developers.cloudflare.com/pages/functions/pricing/
- Giới hạn gói miễn phí: 20.000 file, mỗi file ≤ 25 MiB, 500 lần dựng/tháng: https://developers.cloudflare.com/pages/platform/limits/

## Các bước
1. Vào https://dash.cloudflare.com → chọn tài khoản Giày Hải Nancy.
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
