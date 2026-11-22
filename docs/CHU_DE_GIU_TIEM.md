# Chủ đề: Gọn Tiệm, Sạch Phố — "Ngũ hành giữ tiệm" (anh Kha chốt 22/11/2026)

Game thủ thành trên **một con phố nhiều tiệm nhỏ ở Đà Lạt mùa mưa**. Mỗi màn là một tiệm; "bọn phá đồ" thật ngoài đời của tiệm đó kéo vào; người chơi đặt đồ dùng trong tiệm ra chặn. Khắc chế theo **ngũ hành**, mỗi cặp đều có lý do đời thật. Bản đầu 3 tiệm: **giày (Màn 1), bánh (Màn 2), hoa (Màn 3, trùm Mùa Nồm)**.

- Tên game: **Gọn Tiệm, Sạch Phố**, dòng phụ **"Ngũ hành giữ tiệm"**; chỗ chật viết "Gọn Tiệm". Dùng chung thương hiệu Gọn / kênh @gon.simpli.
- Không dùng tên thương hiệu thật (kể cả tên tiệm của anh Kha) khi anh chưa đồng ý. Không cho khách hàng hay "hàng nhái" làm quái.
- Phần chơi Màn 1 đã đạt (REVIEW_LOG "MÀN 1 VUI: ĐẠT") giữ nguyên; chỉ đổi tên, hình, gán lại hành cho món / quái, rồi thêm các lớp ở mục 4–5. Sau mỗi thay đổi chạy lại script mô phỏng, giữ mục tiêu độ khó.

## 1. Ngũ hành theo đời thường

| Hành | Bọn phá đồ thuộc hành này | Món thuộc hành này |
|---|---|---|
| **Thủy** | mưa, hơi ẩm, nồm, ốc sên (ưa ẩm) | xịt dưỡng, bình tưới, tủ mát |
| **Thổ** | bùn, bụi đất, bụi bột | gói hút ẩm, vôi bột, hũ sành |
| **Mộc** | côn trùng, rệp, nấm mốc (sinh sôi như cây cỏ) | quạt (gió thuộc Mộc), dép cao su |
| **Kim** | chuột (răng sắc), sương muối (buốt như kim châm) | bốt đế đinh, kéo tỉa, vỉ đập ruồi lưới sắt |
| **Hỏa** | nắng gắt (bạc màu, héo hoa), than hồng | máy sấy giày, lò nướng, đèn sưởi |

**Vòng khắc (giữ nguyên `src/core/elements.ts`):** Kim khắc Mộc → Mộc khắc Thổ → Thổ khắc Thủy → Thủy khắc Hỏa → Hỏa khắc Kim.
- Kim khắc Mộc: bốt đế đinh đạp gián, kéo tỉa cắt cành có rệp, vỉ sắt đập ruồi.
- Mộc khắc Thổ: dép cao su lội bùn không sợ, quạt thổi bay bụi.
- Thổ khắc Thủy: gói hút ẩm, vôi bột hút nước; hũ sành đậy kín không cho ẩm vào ("nước tới đất ngăn").
- Thủy khắc Hỏa: xịt dưỡng chống nắng làm da khô nứt; tưới nước chống héo; tủ mát dập than nóng.
- Hỏa khắc Kim: hun nóng đuổi chuột; đèn sưởi chống sương muối.
Trước mỗi đợt hiện biểu tượng hành của quái sắp tới (giọt nước, cục đất, chiếc lá, mũi kim, ngọn lửa) kèm hình con quái.

## 2. Tiệm giày (Màn 1)

| Món | Hành | Vai | Khắc |
|---|---|---|---|
| **Dép tông** (cao su) | Mộc | Ném nhanh, đánh 1 con | Thổ: bùn |
| **Bốt đế đinh** | Kim | Đạp mạnh, chậm, xuyên vỏ | Mộc: gián, nấm mốc |
| **Xịt dưỡng da** | Thủy | Phun cả vùng, làm chậm | Hỏa: nắng gắt |
| **Túi xách đầy gói hút ẩm** | Thổ | Quăng vào giữa đám, trúng cả bầy | Thủy: giọt mưa |
| **Máy sấy giày** | Hỏa | Hỗ trợ: sấy khô món bên cạnh cho khỏe hơn, gỡ món bị chuột gặm đứng im | Kim: chuột |

| Quái | Hành | Cách phá | Lý do đời thật |
|---|---|---|---|
| Giọt mưa | Thủy | Nhanh, đến thành đàn | Mưa theo chân khách vào tiệm |
| Cục bùn | Thổ | Máu trâu, đi chậm, lọt vào trừ 2 đôi | Đường đất mùa mưa |
| Gián | Mộc | Đập chết tách ra 2 gián con | Gián ăn keo và da giày |
| Nấm mốc | Mộc | Hồi máu cho quái gần | Đà Lạt ẩm, mốc lan đôi này sang đôi khác |
| Chuột | Kim | Gặm món gần nó làm món đứng im vài giây | Chuột gặm quai dép, dây giày |
| Nắng gắt | Hỏa | Tia nắng: không bị làm chậm | Nắng xuyên kính làm da bạc màu |

- **Tiền:** xu và tiền giấy rơi ra khi diệt quái, bay vào **chiếc ví** ở góc màn hình. **Mạng:** số đôi giày còn lành trên kệ (20).

## 3. Tiệm bánh (Màn 2) và tiệm hoa (Màn 3)

### Tiệm bánh
| Món | Hành | Vai | Khắc |
|---|---|---|---|
| **Vỉ đập ruồi lưới sắt** | Kim | Đập nhanh, đánh 1 con | Mộc: ruồi, mốc bánh |
| **Hũ sành kín** | Thổ | Sập nắp mạnh, chậm | Thủy: hơi ẩm |
| **Quạt điện** | Mộc | Gió làm chậm cả vùng | Thổ: bụi bột |
| **Lò nướng** | Hỏa | Hơi nóng tỏa cả vùng | Kim: chuột |
| **Tủ mát** | Thủy | Hỗ trợ: giữ lạnh món bên cạnh cho bền, khỏe | Hỏa: than hồng |

| Quái | Hành | Cách phá |
|---|---|---|
| Hơi ẩm (làm bánh ỉu) | Thủy | Nhanh, thành đàn |
| Bụi bột | Thổ | Máu trâu |
| Ruồi | Mộc | Bay, không bị làm chậm |
| Mốc bánh | Mộc | Hồi máu cho quái gần |
| Chuột | Kim | Gặm món gần nó làm đứng im |
| Than hồng văng từ lò | Hỏa | Vỡ ra 2 cục nhỏ khi bị dập |

### Tiệm hoa
| Món | Hành | Vai | Khắc |
|---|---|---|---|
| **Bình tưới** | Thủy | Tia nước nhanh, đánh 1 con | Hỏa: nắng gắt |
| **Kéo tỉa** | Kim | Cắt mạnh, chậm | Mộc: rệp, nấm thối rễ |
| **Vôi bột** | Thổ | Rắc thành vệt làm chậm | Thủy: ốc sên |
| **Đèn sưởi** | Hỏa | Hơi ấm tỏa cả vùng | Kim: sương muối |
| **Quạt thông gió** | Mộc | Hỗ trợ: thổi khô món bên cạnh cho khỏe | Thổ: bụi đất |

| Quái | Hành | Cách phá |
|---|---|---|
| Rệp | Mộc | Nhanh, thành đàn |
| Ốc sên | Thủy | Máu trâu, đi chậm |
| Nắng gắt | Hỏa | Tia nắng: không bị làm chậm |
| Bụi đất | Thổ | Vỡ ra 2 đám nhỏ |
| Sương muối | Kim | Làm món gần nó đứng im (cóng) |
| Nấm thối rễ | Mộc | Hồi máu cho quái gần |
| **Trùm Mùa Nồm** (đám mây đen ẩm) | Thủy → đổi hành giữa trận | Máu rất dày, đi chậm; mỗi khi mất 1/3 máu đổi sang hành khác (Thủy → Mộc → Kim) và đổi màu, buộc người chơi đặt lại món; định kỳ phủ hơi ẩm làm món quanh nó đứng im; lọt vào trừ 10 mạng |

## 4. Tương sinh — cặp ăn ý
Vòng sinh: Kim sinh Thủy → Thủy sinh Mộc → Mộc sinh Hỏa → Hỏa sinh Thổ → Thổ sinh Kim. Hai món **đặt cạnh nhau** (trong tầm 1 ô) mà hành sinh nhau thì món được sinh mạnh lên (gợi ý +15% sức, không cộng dồn quá 1 lần), có đường sáng nối hai món cho người chơi thấy. Ví dụ có lý:
- Quạt (Mộc) cạnh lò nướng (Hỏa): gió thổi lửa to hơn.
- Máy sấy (Hỏa) cạnh túi gói hút ẩm (Thổ): sấy khô gói hút ẩm thì hút mạnh lại (đúng ngoài đời).
- Tủ mát (Thủy) cạnh quạt (Mộc): gió mát thổi xa hơn.
Antigravity đề xuất câu giải thích ngắn cho từng cặp, hiện khi chạm vào đường sáng.

## 5. Nâng cấp sâu hơn
- **Trong màn:** bậc 1 → 2 → 3 (chọn 1 trong 2 nhánh) như hiện tại, thêm **bậc 4 "tuyệt chiêu"** cho mỗi nhánh: nút bấm kích hoạt, có thời gian hồi (vd lò nướng "Bùng lửa" cả vùng; quạt "Lốc xoáy" thổi lùi cả đám; gói hút ẩm "Hút cạn" làm quái Thủy đứng im 2 giây). Bậc 4 đắt, chỉ mở từ Màn 2 trở đi.
- **Giữa các màn (giữ lâu dài):** sao kiếm được đổi lấy điểm nâng **theo hành** (vd Hỏa +10% sức, Thổ rẻ hơn 5 xu, Thủy làm chậm lâu hơn). Đổi lại được miễn phí. Mục tiêu: người chơi muốn chơi lại lấy đủ sao. Cân bằng sao cho chơi Màn 2 không cần điểm nâng vẫn thắng được (khó hơn).

## 6. Số đợt mỗi màn
- **8–12 đợt, 6–10 phút một màn**; không quá 15 đợt. Màn 1: 9 đợt (giữ). Màn 2: ~10. Màn 3: ~12, đợt cuối trùm Mùa Nồm.
- Muốn chơi dài thì thêm màn, không kéo dài màn. Sau bản đầu có thể thêm chế độ **"Vô tận"** (quái ra mãi, đo giữ được bao nhiêu đợt).
