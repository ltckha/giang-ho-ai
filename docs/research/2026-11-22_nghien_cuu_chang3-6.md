# Nghiên cứu chuẩn bị chặng 3–6 (22/11/2026)

Tra trên web ngày 22/11/2026. Chỗ nào chưa xác nhận được thì ghi rõ. Không có số nào là đoán.

## 1. Điều khoản Shopee Affiliate (bản 15/09/2026) — https://help.shopee.vn/portal/10/article/206429
- Được đặt link trong website / ứng dụng của mình (Điều 1.16 "Phương Tiện TTLK" gồm website, ứng dụng, bản tin).
- **Phải đăng ký kênh với Shopee và được chấp thuận trước** (Điều 3.5) → đăng ký game là một kênh trước khi gắn link.
- Người chơi phải **tự bấm, tự nguyện, có ý thức** (Điều 3.25). **Cấm:** pop-up, pop-under, iframe, tự chuyển hướng, ép cài app, nút gây hiểu nhầm. → Nút "Xem món này" ghi rõ, không tự mở Shopee.
- Không dùng tên / logo Shopee hay giả làm Shopee (Điều 3.4).
- **Thưởng vật phẩm trong game cho mỗi lần bấm link:** không thấy điều khoản nói thẳng, nhưng trái tinh thần "bấm tự nguyện" và Điều 3.30 (cấm khuyến khích bấm) → coi là rủi ro cao, **không làm**. (Phần cuối văn bản chưa đọc hết.)
- Công khai được tài trợ: Điều 3.32 bắt buộc cho livestream; Điều 3.21 yêu cầu tuân luật quảng cáo.

## 2. Luật Việt Nam về ghi nhãn quảng cáo
- Luật Quảng cáo sửa đổi số 75/2025/QH15, hiệu lực 01/01/2026 (tóm tắt: https://luatvietnam.vn/linh-vuc-khac/diem-moi-cua-luat-quang-cao-sua-doi-2025-883-102813-article.html).
  - Điều 23 khoản 2: quảng cáo trên mạng phải có dấu hiệu nhận diện rõ ràng (chữ, ký hiệu, hình, âm thanh) để phân biệt với nội dung khác.
  - Điều 15a khoản 3: người có ảnh hưởng phải thông báo rõ việc quảng cáo ngay trước và trong khi quảng cáo.
- Nghị định 342/2025/NĐ-CP hướng dẫn (ban hành 26/12/2025, phần quảng cáo trên mạng áp dụng từ 15/02/2026) — chưa đọc được văn bản gốc: https://thuvienphapluat.vn/van-ban/Thuong-mai/Nghi-dinh-342-2025-ND-CP-huong-dan-Luat-Quang-cao-687658.aspx
- **Chưa xác nhận:** luật không quy định đúng chữ phải ghi; chưa rõ link tiếp thị trong game của chính mình có tính là "quảng cáo" không. **Cách an toàn:** ghi nhãn ngay cạnh nút, vd "Quảng cáo – link tiếp thị Shopee". Cần chắc chắn thì hỏi luật sư.

## 3. Cloudflare Pages miễn phí
- 500 lần build / tháng, 1 build cùng lúc, tối đa 20 phút; tối đa 20.000 file; mỗi file ≤ 25 MiB: https://developers.cloudflare.com/pages/platform/limits/
- Băng thông: tài liệu không ghi giới hạn — chưa xác nhận.
- Hỗ trợ repo GitHub riêng tư: https://developers.cloudflare.com/pages/get-started/git-integration/
- Cài đặt build: lệnh `npm run build`, thư mục `dist`: https://developers.cloudflare.com/pages/configuration/build-configuration/
- Địa chỉ `<tên-dự-án>.pages.dev` tạo theo tên dự án; không thấy ghi thu phí (tài liệu không nói thẳng "miễn phí").

## 4. Cài ra màn hình điện thoại + chơi offline (PWA)
- Điều kiện Chrome cho cài: HTTPS + manifest (`name`/`short_name`, icon 192 và 512 px, `start_url`, `display`): https://web.dev/articles/install-criteria
- Chơi offline cần service worker lưu sẵn file (kiến thức chung).
- vite-plugin-pwa bản 2.0.0 (03/10/2026), giấy phép MIT, cần Node ≥ 20.19: https://registry.npmjs.org/vite-plugin-pwa — https://github.com/vite-pwa/vite-plugin-pwa

## 5. Lên chợ ứng dụng
- Google Play: 25 USD một lần: https://support.google.com/googleplay/android-developer/answer/6112435
- Apple: 99 USD / năm (có thể khác theo khu vực): https://developer.apple.com/support/enrollment/
- Đóng gói web game thành app Android: TWA / Bubblewrap: https://developer.chrome.com/docs/android/trusted-web-activity/quick-start ; iOS + Android: Capacitor (mã nguồn mở, chưa xác nhận loại giấy phép): https://capacitorjs.com/docs

## Rút ra cho lộ trình
- Chặng 3: Cloudflare Pages (nối repo riêng tư, `npm run build` → `dist`) + PWA bằng vite-plugin-pwa → 0 đồng.
- Chặng 5: đăng ký game là kênh với Shopee trước; nút ghi rõ + nhãn "Quảng cáo – link tiếp thị Shopee"; không thưởng vật phẩm cho việc bấm link; không tự mở Shopee.
