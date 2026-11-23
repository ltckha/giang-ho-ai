# Dữ liệu tiệm Đà Lạt trên OpenStreetMap (23/11/2026)

Nguồn: Overpass API (OpenStreetMap), khung trung tâm Đà Lạt 11.90–11.98 N, 108.40–108.48 E, lấy qua công cụ đọc web (phiên Claude không vào thẳng được overpass-api.de). Số đếm thủ công từ bản CSV nên có thể lệch vài đơn vị. Không lưu tên từng quán.

## Số điểm theo loại (~371)
| Loại | Số |
|---|---|
| Cà phê | ~276 |
| Tạp hóa / cửa hàng tiện lợi | 51 |
| Tiệm bánh (bakery + pastry) | 24 |
| Quần áo | 11 |
| Tiệm hoa (florist + garden centre) | 6 |
| Tiệm giày | 2 |
| Nhà sách | 1 |

Chỉ ~114 điểm có ghi tên đường; một số ghi sai / ghi cả địa chỉ.

## Đường có nhiều điểm nhất (có ghi tên đường)
Hoàng Hoa Thám 5 (cà phê), Khu Hòa Bình 5 (4 cà phê, 1 quần áo), Hai Bà Trưng 5 (cà phê), Phan Đình Phùng 4 (cà phê), Bùi Thị Xuân 4 (2 cà phê, 2 bánh), Yersin 4 (cà phê), Triệu Việt Vương 4 (1 cà phê, 3 bánh), Nguyễn Trãi 3, Thông Thiên Học 3, Hoàng Văn Thụ 3 (cà phê, tạp hóa, bánh).

## Rút ra
- OpenStreetMap ở Đà Lạt **vẽ đường rất đủ nhưng ghi tiệm rất thiếu** (cả thành phố chỉ 2 tiệm giày, 6 tiệm hoa được ghi). Không đủ để dựng "phố thật có đúng tiệm thật".
- Dùng được: **hình dạng con phố thật** (đường đi của quái) + **loại tiệm phổ biến** (cà phê nhiều nhất → hợp làm "Phố Cà Phê"; Triệu Việt Vương / Bùi Thị Xuân có tiệm bánh).
- Tiệm trong game vẫn đặt tên chung ("tiệm giày", "tiệm bánh"), không dùng tên quán thật khi chưa được phép.
- Google Maps có nhiều tiệm hơn nhưng cần khoá API, tài khoản thanh toán → chưa dùng.

## Phố thật đầu tiên (anh Kha chọn 23/11)
1. **Phố Tăng Bạt Hổ – Trương Công Định** (tiệm): 2 cửa vào (đầu bắc và đầu nam Trương Công Định) gặp nhau ở ngã Tăng Bạt Hổ, chạy hết Tăng Bạt Hổ. Mỗi tuyến ~325–330 m thật.
2. **Phố Cà Phê Nguyễn Chí Thanh – Lê Đại Hành**: vào từ đầu Nguyễn Chí Thanh (tuyến dài ~940 m) và nhánh ngắn Nguyễn Chí Thanh gần ngã ba (~370 m), gặp nhau ở ngã ba với Lê Đại Hành, chạy xuống Lê Đại Hành.
- Dữ liệu đường: `docs/research/streets/osm_ways_2026-11-23.json`; chuyển sang đường đi game bằng `tools/osm_street_to_stage.py` → `src/core/streets/realStreets.generated.json` (+ ảnh xem trước `docs/research/streets/*.png`). Ghi nguồn © OpenStreetMap contributors.

## Tiệm tiêu biểu trên 2 phố (tra web 23/11) — chỉ dùng LOẠI tiệm, không dùng tên quán thật trong game
- **Tăng Bạt Hổ:** quán phở; quán bánh ướt lòng gà (bài gợi ý món ngon Đà Lạt). **Trương Công Định:** 1 quán ăn được liệt kê, không rõ món. (vinwonders.com, wanderlog.com)
- **Khu Hòa Bình / Lê Đại Hành / Nguyễn Chí Thanh:** quán cà phê lâu đời phong cách cổ điển (Khu Hòa Bình, theo VnExpress); quán cà phê nhiều cây xanh, góc chụp ảnh (Lê Đại Hành); quán cà phê bình dân giữa trung tâm (Lê Đại Hành); quán cà phê hoài cổ (Nguyễn Chí Thanh). (vinwonders.com, vnexpress.net, foody.vn)
- OpenStreetMap không trả về tiệm nào trong 40 m quanh 4 đường (dữ liệu tiệm ở Đà Lạt rất thiếu) → nguồn chính là bài viết trên web; chưa kiểm chứng quán còn mở.
- Quy tắc: tên tiệm trong game đặt chung theo loại; chỉ tiệm của anh Kha (Hiệu giày Hải Nancy, Yen Handmade Leather) mới dùng tên thật; tránh tên gợi đến thương hiệu quán có thật.
