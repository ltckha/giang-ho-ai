# Mẫu giao Spark vẽ hình cho game (anh Kha chốt 23/11/2026)

Cách dùng: Claude điền phần <…>, anh Kha dán cho Spark. Spark lưu xong → anh nhắn Claude "Spark xong" → Claude lấy hình trên Drive, ghép vào game, chụp màn hình cho anh duyệt.

- Ảnh mẫu nét vẽ: Drive `My Drive/Spark/Inbox/Game_ve_thu/mau_net_ve.png` (https://drive.google.com/file/d/1tNqYh6ZAMEzEPWbT5kQg0yBKpfuGhzQ9/view).
- Thư mục nhận hình: `My Drive/Spark/Inbox/Game_ve_thu/<đợt>/`.
- Hình đạt mẫu đầu tiên (23/11): `mon_cafe_som_mai.png`, `quai_hoi_am.png` cùng thư mục.

## Khối dán cho Spark
```
Vẽ hình cho game điện thoại "Gọn Tiệm, Sạch Phố" (giữ tiệm ở Đà Lạt).
Nét vẽ giống hệt ảnh mẫu: My Drive/Spark/Inbox/Game_ve_thu/mau_net_ve.png
và 2 hình bạn đã vẽ: mon_cafe_som_mai.png, quai_hoi_am.png (cùng thư mục).
Hoạt hình dễ thương, đồ vật có mặt, viền nâu đậm, màu ấm, nhìn chéo nhẹ từ trên xuống.

Món giữ tiệm (mỗi món 4 hình, cùng một vật, lớn dần và thêm chi tiết):
- <tên món> — <mô tả vật>, tông <màu theo hành>.
  bậc 1: <...>; bậc 2: <...>; bậc 3 nhánh A: <...>; bậc 3 nhánh B: <...>
Quái (mỗi quái 1 hình):
- <tên quái> — <mô tả>, tông <màu>, <dáng: chạy nhanh / to chậm / bay / ...>

Yêu cầu chung:
- PNG vuông 512×512, một vật ở giữa, nền trong suốt; không chữ, không khung, không bóng nền.
- 4 bậc của cùng một món phải giữ cùng màu, cùng khuôn mặt, chỉ thêm chi tiết.
- Lưu vào My Drive/Spark/Inbox/Game_ve_thu/<đợt>/
  tên file: mon_<mã>_b1.png, mon_<mã>_b2.png, mon_<mã>_b3a.png, mon_<mã>_b3b.png, quai_<mã>.png
```

## Màu theo hành
Kim: bạc / xám kim loại · Mộc: xanh lá · Thủy: xanh nước · Hỏa: đỏ cam · Thổ: nâu vàng.

## Claude kiểm khi nhận
- Nền trong suốt (góc ảnh alpha = 0); nếu nền trắng trơn thì tự xoá.
- Đặt cạnh hình cũ ở cỡ trong game (~45 điểm ảnh) xem có lệch nét không.
- 4 bậc cùng màu, cùng mặt; lệch thì nhờ Spark vẽ lại hình đó.

## Các đợt đã giao
- **Đợt 1 (23/11) — bộ chung cho phố sau:** 5 loại địa điểm ngoài ăn uống, mỗi loại 1 hành (sửa xe Kim, nhà thuốc Mộc, giặt ủi Thủy, studio ảnh Hỏa, tạp hoá Thổ) × 4 bậc = 20 hình + 6 quái chung (GENERIC_PESTS) = 26 hình. Thư mục Drive `Game_ve_thu/dot1_bo_chung/`. Không trùng việc 9 của Antigravity.
