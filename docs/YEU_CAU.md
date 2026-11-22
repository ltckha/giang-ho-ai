# Yêu cầu giữa Claude và Antigravity

Chia việc (anh Kha chốt 22/11): **Claude** giữ luật chơi và số liệu (`src/core/`, `tests/`, `docs/review/`, `tools/`); **Antigravity** giữ hình, hiệu ứng, giao diện, màn hình (`src/scenes/`, `src/ui/`, `src/game/`, `public/`, `scripts/`). Bên nào cần sửa phần của bên kia thì ghi yêu cầu ở đây, không tự sửa. Mỗi lần push: `npm test` và `npm run build` phải qua.

Ngoại lệ đã làm: để chơi thử được Màn 2, Claude sửa nhỏ trong `TdStageScene.ts` (chọn màn qua `create(data)` hoặc `?stage=2`, bảng chọn món lấy theo màn) và `TitleScene.ts` (thêm ô "Vào Màn 2"). Antigravity cứ làm lại giao diện chỗ đó theo ý mình, chỉ cần giữ: nút `data-testid="btn-start-stage-2"` gọi `this.scene.start(SCENE_KEYS.TD_STAGE, { stageId: 'stage_2' })`, và bảng chọn món dùng `getStageTowerList(this.engine.stage)`.

---

## Claude → Antigravity: vẽ Màn 2 "Tiệm Bánh Đầu Phố" (sườn đã xong, nhánh claude/antigravity-phase-1-iky8z4 → main)

Luật, số liệu, đường đi, 10 ô, 10 đợt đã có trong `src/core/shops/bakery.ts` — **không đổi số**. Chỉ vẽ và gắn hình, cùng nét đã duyệt (docs/art_samples/), nền trong suốt, đưa vào atlas.

**Nền bản đồ** `map_man2_tiem_banh` (khớp đúng đường và ô trong `STAGE_2_DEFINITION`, khung logic 360×520):
- Cửa tiệm ở trên giữa (điểm vào x=180, y=24). Đường tách 2 ngả vòng quanh **quầy bánh** ở giữa (khung x 60–300, y 80–290), hợp lại ở x=180, y=290, xuống y=370, sang phải tới **kệ bánh** ở dưới phải (x=300, y=460).
- Trong lòng quầy (giữa 2 ngả) là 4 ô đặt món; nền quầy gỗ, tủ kính bánh, bao bột.
- Ngoài cửa: phố mưa như Màn 1.

**5 món** (mỗi món: bậc 1, bậc 2, bậc 3A, bậc 3B — 4 hình; 2–3 khung khi đánh):
| Khoá | Tên bậc 1 → 2 → 3A / 3B | Hành | Gợi ý hình |
|---|---|---|---|
| bk_swatter | Vỉ Đập Ruồi → Vỉ Lưới Cán Dài → Vỉ Đập Đôi / Vợt Điện Diệt Ruồi | Kim (bạc) | vỉ lưới sắt có mắt; 3B vợt điện có tia lửa xanh |
| bk_jar | Hũ Sành Kín → Hũ Sành Nắp Nặng → Chum Sành Lớn / Hũ Lăn Dọc Quầy | Thổ (nâu vàng) | hũ gốm men nâu, nắp bập bênh |
| bk_fan | Quạt Điện → Quạt Đứng Hai Tốc → Quạt Trần Ba Cánh / Quạt Hộp Thổi Lùi | Mộc (xanh lá) | quạt bàn cánh xanh, có vệt gió |
| bk_oven | Lò Nướng → Lò Nướng Hai Tầng → Lò Đối Lưu / Lò Bánh Mì Củi | Hỏa (đỏ cam) | lò nướng có cửa kính đỏ rực |
| bk_fridge | Tủ Mát → Tủ Mát Hai Cánh → Tủ Mát Giữ Tươi / Tủ Đông Gió Lạnh | Thủy (xanh dương) | tủ mát kính, hơi lạnh tỏa |

**6 quái + 1 con nhỏ** (2–4 khung khi đi, có hình chết):
| Khoá | Tên | Hành | Gợi ý hình |
|---|---|---|---|
| bk_humid | Hơi Ẩm | Thủy | đám hơi nước nhỏ có mặt, chạy nhanh |
| bk_flour | Bụi Bột | Thổ | đám bụi bột trắng ngà to, chậm |
| bk_fly | Ruồi | Mộc | ruồi xanh bay, cánh vo ve |
| bk_mold | Mốc Bánh | Mộc | đốm mốc xanh trên mẩu bánh, tỏa vòng hồi máu |
| disrupt_water | Chuột | Kim | dùng lại hình Chuột Màn 1 |
| bk_ember | Than Hồng | Hỏa | cục than đỏ rực; chết vỡ ra 2 |
| bk_ember_mini | Than Vụn | Hỏa | mảnh than nhỏ chạy nhanh |

**Hiệu ứng mới cần có (dùng cho Màn 2 trở đi):**
1. **Đường sáng tương sinh:** khi `tower.synergyFromUid` có giá trị, vẽ đường sáng mảnh (màu hành của món cho) từ món cho → món nhận, có chữ nhỏ "+15%" lúc mới nối; chạm vào đường hiện câu giải thích ngắn (vd "Gió thổi lửa to hơn — Mộc sinh Hỏa").
2. Màn hình đầu: ô Màn 2 hiện khoá cho tới khi qua Màn 1 (dùng `unlockedStage` trong bản lưu), nhưng `?stage=2` hoặc `?bot=1` vẫn mở được để thử.

**Sửa test e2e:** `e2e/game.spec.ts` dòng ~63 còn chờ chữ "Hệ Kim" ở đợt 1 Màn 1, nhưng đợt 1 giờ là Thủy + Thổ → cập nhật cho khớp.

---

## Claude → Antigravity: vẽ Màn 3 "Tiệm Hoa Cuối Dốc" (sườn đã xong)

Luật, số liệu, đường đi, 11 ô, 12 đợt ở `src/core/shops/flower.ts` — **không đổi số**. Cùng nét, nền trong suốt, vào atlas; xoá các dòng `fl_*` trong `PLACEHOLDER_FRAME_ALIAS` khi có hình.

**Nền bản đồ** `map_man3_tiem_hoa` (khung logic 360×520, khớp `STAGE_3_DEFINITION`):
- **Cửa chính** trên trái (x=40, y=24), **cửa hông nhà kính** trên phải (x=330, y=24). Hai lối riêng vòng qua các luống / kệ hoa, **hợp lại** ở x=180, y=330, xuống y=420, sang trái tới **giàn hoa trưng bày** dưới trái (x=70, y=470).
- Không khí: tiệm hoa Đà Lạt, chậu đất nung, nhà kính, sương sớm.

**5 món** (4 hình mỗi món, 2–3 khung khi đánh):
| Khoá | Tên bậc 1 → 2 → 3A / 3B | Hành | Gợi ý hình |
|---|---|---|---|
| fl_can | Bình Tưới → Bình Tưới Vòi Sen → Vòi Xịt Tăng Áp / Bình Phun Sương Dưỡng | Thủy | bình tưới xanh dương có mắt |
| fl_shears | Kéo Tỉa → Kéo Tỉa Cán Dài → Kéo Cắt Cành Lớn / Kéo Xén Hàng Rào | Kim | kéo tỉa cán đỏ, lưỡi bạc |
| fl_lime | Vôi Bột → Vôi Bột Rắc Dày → Vòng Vôi Khép Kín / Vôi Trộn Tro Bếp | Thổ | bao vôi trắng, rắc vệt |
| fl_heater | Đèn Sưởi → Đèn Sưởi Hai Bóng → Lò Sưởi Than / Đèn Hồng Ngoại Nhà Kính | Hỏa | đèn sưởi tỏa sáng cam |
| fl_vent | Quạt Thông Gió → Quạt Thông Gió Hai Cánh → Quạt Nhà Kính / Quạt Hút Thông Thoáng | Mộc | quạt thông gió khung xanh lá |

**Quái:**
| Khoá | Tên | Hành | Gợi ý hình |
|---|---|---|---|
| fl_aphid | Rệp | Mộc | rệp xanh nhỏ, đi thành đàn |
| fl_snail | Ốc Sên | Thủy | ốc sên vỏ xoắn, chậm, để vệt nhớt |
| fly_wood | Nắng Gắt | Hỏa | dùng lại hình Nắng Gắt Màn 1 |
| fl_dust | Bụi Đất | Thổ | đám bụi đất nâu; chết vỡ ra 2 |
| fl_dust_mini | Bụi Nhỏ | Thổ | đám bụi nhỏ |
| fl_frost | Sương Muối | Kim | bông sương trắng bạc, làm món cóng |
| fl_rot | Nấm Thối Rễ | Mộc | cây nấm nâu tím, tỏa vòng hồi máu |
| fl_monsoon | Trùm Mùa Nồm | Thủy → Mộc → Kim | đám mây đen ẩm lớn; **3 màu theo hành** (xanh dương → xanh lá → bạc) |

**Hiệu ứng mới:** sự kiện `element_shift` (trùm đổi hành): đổi màu / hình trùm theo `enemy.element`, chữ lớn "Đổi hành!" kèm biểu tượng hành mới, rung nhẹ. Màn hình đầu: khoá ô Màn 3 tới khi qua Màn 2 (trừ khi `?stage=3` hoặc `?bot=1`).

---

## Claude → Antigravity: vẽ lại Màn 1 "Tiệm Giày Hẻm Dốc" theo cách Màn 2 (làm SAU khi xong Màn 3)

Anh Kha thấy Màn 2 đẹp hơn Màn 1 nhiều. Lý do (Claude đọc scripts): Màn 1 làm bậc nâng cấp từ 1 hình gốc rồi chồng chi tiết bằng code, vài quái / biểu tượng vẽ bằng khối PIL, nền cắt ghép từ ảnh mẫu; Màn 2 vẽ riêng từng hình và vẽ nền vector mới khớp đường. → Làm lại Màn 1 **đúng cách Màn 2**. **Không đổi số liệu, đường đi, ô, tên; giữ nguyên tên khung (frame) trong atlas** để code không phải sửa.

**Nền bản đồ** `map_man1_tiem_giay` vẽ mới dạng vector như `scripts/build_stage2_map.py`, khớp đúng `STAGE_1_DEFINITION` (đường chữ S qua 2 khúc cua chữ U, 9 ô), cửa kính mưa ở đầu đường, kệ giày gỗ đèn vàng ở cuối, sàn gỗ, thảm, ghế thử giày. Không chữ tiếng nước ngoài.

**5 món × 4 bậc vẽ riêng từng hình** (bậc 3A và 3B khác nhau nhìn thấy được), 3 khung khi đánh:
| Khoá | Bậc 1 → 2 → 3A / 3B |
|---|---|
| wood_tower | Dép Tông → Dép Tông Đế Dày → Dép Tông Kép / Dép Tông Gai Bám |
| metal_tower | Bốt Đế Đinh → Bốt Đinh Thép → Bốt Chốt Chì / Bốt Đinh Quét Dọc |
| water_tower | Xịt Dưỡng Da → Bình Xịt Áp Lực → Xịt Bọt Tuyết Lạnh / Xịt Vòi Xoáy |
| fire_tower | Túi Hút Ẩm → Giỏ Hút Ẩm Cỡ Đại → Thảm Hạt Hút Khô / Chùm Túi Nổ Liên Hoàn |
| earth_tower | Máy Sấy Giày → Máy Sấy Hai Vòi → Máy Sấy Khử Khuẩn / Máy Sấy Gió Nhiệt Cao |

**Quái vẽ lại riêng từng con** (4 khung đi): Giọt Mưa, Cục Bùn, Gián, Gián Con, Nấm Mốc, Chuột, Nắng Gắt (các khoá `fast_metal`, `tank_earth`, `split_fire`, `split_fire_mini`, `healer_wood`, `disrupt_water`, `fly_wood`). Chuột và Nắng Gắt dùng chung cho Màn 2–3 nên vẽ kỹ.

**Biểu tượng:** 5 hành (`el_*`), xu, ví, đôi giày (mạng) — vẽ lại cùng nét, không dùng khối PIL.

**Nộp:** ảnh trước / sau cùng cảnh trong `docs/screenshots/man1v2_*.png`; dist ≤ 5 MB; `npm test`, e2e qua. Xong ghi "MÀN 1 VẼ LẠI XONG" đầu docs/PROGRESS.md.

---

## Claude → Antigravity: làm đẹp phần nâng cấp mới (sau Màn 3 và Màn 1)

Luật đã xong (`src/core/ultimates.ts`, `src/core/metaUpgrades.ts`), giao diện Claude làm tạm — Antigravity làm đẹp, **giữ các `data-testid`**:
1. **Bậc 4 tuyệt chiêu** (từ Màn 2): trong bảng nâng cấp có nút `btn-unlock-ultimate` (150 xu) và `btn-use-ultimate`. Cần thêm: viền / hào quang cho món đã có bậc 4 (`tower.hasUltimate`); **nút tuyệt chiêu nổi ngay trên món** khi sẵn sàng (`engine.canActivateUltimate(padId)`), vòng đếm hồi chiêu (`ultimateCooldownRemaining`, 30s); hiệu ứng riêng cho sự kiện `ultimate` theo vai (bắn nhanh / đập cả vùng / giữ chân / nổ / hỗ trợ). Tên tuyệt chiêu: `ULTIMATE_NAMES`.
2. ~~Nâng cấp ngũ hành bằng sao~~ — đã bỏ, thay bằng **Trang bị chủ tiệm** (mục dưới).


---

## Claude → Antigravity: vẽ Trang bị chủ tiệm (10 món, kích hoạt ngũ hành)

Luật xong ở `src/core/equipment.ts` (10 ô, đồ 5 hành, dòng chính / dòng ẩn, vòng tương sinh, rơi đồ, trần sức cộng). Giao diện tạm ở màn hình đầu (ô `td-gear-box`, nút `gear-slot-*`) và dòng "Nhận trang bị" ở bảng kết quả (`td-result-drops`). **Giữ data-testid, không đổi số.**
1. **Hình chủ tiệm** (người Đà Lạt trẻ, thân thiện) đứng ở màn hình đầu, **mặc đúng đồ đang đeo** (ít nhất: mũ, kính, áo khoác, giày, túi, ô dù hiện trên người; ví, đồng hồ, điện thoại, dây nịt hiện ở ô bên cạnh).
2. **50 biểu tượng đồ**: 10 loại (Mũ, Kính mắt, Áo khoác, Dây nịt da, Giày, Túi đeo chéo, Ví da, Đồng hồ, Điện thoại, Ô dù) × 5 hành; tên từng mẫu trong `GEAR_NAMES`. Màu theo hành. Viền theo hạng (Thường / Tốt / Quý).
3. **Bảng trang bị**: 10 ô xếp thành **vòng tròn** quanh hình chủ tiệm, đường nối giữa các ô sáng lên khi ô sau được kích hoạt (●); đủ 10 thì hiệu ứng "Ngũ hành viên mãn".
4. **Bảng kết quả khi thắng**: hiện thẻ đồ vừa rơi (hình + hạng + hành), có hiệu ứng mở rương.
