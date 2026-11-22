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
