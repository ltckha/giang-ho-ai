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

**Cập nhật trang bị v2 (Claude, 22/11):** mỗi món tối đa 3 dòng hiện + 3 dòng ẩn; 4 hạng Thường (xám) / Tốt (xanh) / Xịn (tím) / Hàng hiệu (vàng, tên riêng trong `LEGEND_NAMES`); mỗi ô có **2 món chống lưng** (`supporterSlots`: ô liền trước + ô cách 6 bước) — vẽ 2 đường nối tới 2 ô đó, sáng khi món chống lưng sinh ra hành món này; dòng ẩn thứ 3 chỉ sáng khi **Ngũ hành viên mãn**. **Bộ đồ** (`GEAR_SETS`: Đi Mưa, Phượt Đà Lạt, Dân Văn Phòng, Chủ Tiệm Xịn) cần huy hiệu bộ và đếm số món. Tên dòng vui ở `STAT_NAME` (Pin trâu, Wifi mạnh, Freeship, Bảo hành 12 tháng…) — có thể vẽ biểu tượng nhỏ cho từng dòng.

---

## Claude → Antigravity: chuẩn bị cho người lạ chơi (chặng 3) — 5 việc, làm theo thứ tự

**Không đổi số liệu trong `src/core/`; giữ các data-testid đang có (btn-start-stage-1/2/3, td-gear-box, gear-slot-*…) để test chạy.** Mỗi việc xong: commit + push, ảnh chụp điện thoại dọc trong `docs/screenshots/c3_*.png`. Dist vẫn ≤ 5 MB.

### 1. Màn chọn màn "Con phố dốc"
- **Sườn Claude đã có:** `src/core/shopStreet.ts` — `SHOP_STREET` (thứ tự, biển hiệu, đơn vị mạng, gợi ý mặt tiền), `isShopUnlocked(save, shop)`, `shopStars(save, shop)`, `getShopStage(shop)`. Vẽ con phố bằng cách lặp qua `SHOP_STREET` (thêm tiệm sau này chỉ thêm dòng ở đó).
- Thay 3 ô chữ chọn màn bằng **một con phố dốc Đà Lạt** (cuộn dọc trên điện thoại): mặt tiền **Tiệm Giày Hẻm Dốc → Tiệm Bánh Đầu Phố → Tiệm Hoa Cuối Dốc**, cùng nét đã duyệt, trời mưa nhẹ, đèn vàng.
- Tiệm chưa mở: cửa kéo xuống + ổ khóa + dòng "Qua tiệm trước để mở" (dùng `unlockedStage`; `?stage=` / `?bot=1` vẫn mở được như hiện tại). Tiệm đã qua: số sao trên biển hiệu.
- Chạm tiệm → thẻ thông tin: tên, số đợt, 5 món của **chính tiệm đó** (`getStageTowerList(STAGES[id])`), các quái chính, nút "Mở cửa" (giữ testid `btn-start-stage-N`).
- Bảng giới thiệu món ở màn hình đầu hiện món theo tiệm đang chọn (không chỉ tiệm giày).
- Chừa chỗ để sau này nối dài phố thêm tiệm.

### 2. Hướng dẫn chơi lần đầu
- **Sườn Claude đã có:** `src/core/tutorial.ts` — `TutorialController` (5 bước, tự sang bước theo thao tác thật, tạm dừng theo bước, bỏ qua), `TUTORIAL_STEPS` (lời thoại + mục tiêu mũi tên: `pad:`, `build:`, `testid:`, `element_guide`), `TUTORIAL_PAD`, `TUTORIAL_TOWER`; cách gắn vào scene ghi ở đầu file. Cùng `shouldShowTutorial()` / `markTutorialDone()` trong `src/core/saveSystem.ts`. **Antigravity chỉ vẽ** bong bóng lời, mũi tên chỉ đúng mục tiêu, avatar, nút Tiếp / Bỏ qua, và gọi các hàm theo hướng dẫn trong file — không tự viết lại luật bước. Lời thoại sửa trong `TUTORIAL_STEPS` nếu cần (ghi vào YEU_CAU để Claude biết).
- Khi vào Màn 1 mà `shouldShowTutorial()` đúng: hình **chủ tiệm** (dùng lại avatar) hiện ở góc, bong bóng lời + mũi tên chỉ, 5 bước, **game tạm dừng** trong lúc hướng dẫn:
  1. "Chạm vào ô tròn trống để đặt món" (chỉ vào 1 ô gần đường).
  2. "Chọn Dép Tông — món ném nhanh" (chỉ vào thẻ món).
  3. "Nhìn hành của đợt sắp tới ở dưới" (chỉ thanh đợt sắp tới).
  4. "Đặt món khắc hành quái sẽ ra Trúng tủ! — đánh mạnh gấp bội" (chỉ vòng ngũ hành).
  5. "Có xu thì chạm món để nâng cấp. Bấm Gọi đợt để bắt đầu!"
- Có nút **Bỏ qua** ở mọi bước. Xong / bỏ qua đều gọi `markTutorialDone()`.
- Có nút "Xem lại hướng dẫn" trong menu (⏸).
- Thêm 1 e2e: người mới vào Màn 1 thấy hướng dẫn, bấm Bỏ qua thì không thấy lại.

### 3. Biểu tượng app + màn hình chờ
- Logo **"Gọn Tiệm, Sạch Phố"** (chữ Việt rõ, có hình chiếc dép tông / mái tiệm), bản vuông.
- Biểu tượng app: 512×512, 192×192, 180×180 (iPhone), favicon 32×32 — đặt trong `public/icons/`, khai báo trong `index.html` (`<link rel="icon">`, `apple-touch-icon`). (File manifest cài app để Claude làm ở chặng 3.)
- **Màn hình chờ** lúc tải (BootScene): nền màu hộp giày, logo, thanh tải chạy theo tiến độ tải hình; dòng phụ "Ngũ hành giữ tiệm".

### 4. Nhạc nền nhẹ (tự tạo bằng Web Audio, không dùng file nhạc ngoài)
- Mỗi tiệm 1 giai điệu ngắn lặp lại, âm giai ngũ cung, nhịp chậm, êm (giày: ấm áp; bánh: vui tươi; hoa: trong trẻo), màn hình đầu 1 giai điệu riêng. Trận trùm Mùa Nồm: nhịp dồn hơn.
- Âm lượng nhỏ hơn tiếng hiệu ứng; chỉ bắt đầu sau lần chạm đầu tiên (trình duyệt chặn tự phát).
- Nút tắt **nhạc** riêng với nút tắt **tiếng**; nhớ lựa chọn trên máy.
- Ghi vào CREDITS.md là tự tạo.

### 5. Ảnh cho kênh Gọn và khi chia sẻ link
- 3 mẫu **ảnh bìa video dọc** 1080×1920 trong `docs/marketing/` (vd "Đặt sai món là thua!", "Trúng tủ!", "Trùm Mùa Nồm đổi hành"), chữ Việt to, có logo.
- 1 **ảnh chia sẻ link** 1200×630 (`public/og-image.png`) + thẻ `og:title`, `og:description`, `og:image` trong `index.html`.
- 1 **logo vuông** 1080×1080 cho ảnh đại diện / bài đăng.

Xong cả 5 ghi "CHẶNG 3 CHUẨN BỊ XONG" ở dòng đầu docs/PROGRESS.md.

---

## Claude → Antigravity: việc 6 và 7 (làm SAU 5 việc chặng 3)

### 6. Gọn chữ bảng trang bị (anh Kha thấy rối vì nhiều chữ)
Hàm đã có trong `src/core/equipment.ts`: `statShort(st)` → "🔋 Pin trâu 12%", `STAT_ICON`, `statValueShort`, `bonusChips(bonus)` → chip [biểu tượng, số, câu đầy đủ], `previewEquip(eq, item)` → { linesDelta, dmgDelta, fullRing }.
1. Bỏ đoạn giải thích dài đầu bảng → 1 dòng "Món chống lưng đúng hành sẽ sáng dòng ẩn ●" + nút **?** mở luật đầy đủ.
2. Dòng của món hiện bằng `statShort`; bấm giữ (hoặc chạm 2 lần) mới hiện `statText`.
3. Vòng 10 ô quanh chủ tiệm: chỉ hình đồ + chấm ●○, không chữ dưới ô.
4. Danh sách chọn đồ: mỗi món 1 dòng so sánh từ `previewEquip`, vd "Mặc vào: +2 ●● · +6% sức" (xanh nếu lợi, đỏ nếu thiệt); có huy hiệu "Viên mãn!" nếu `fullRing`.
5. Bộ đồ thu gọn: chỉ hiện bộ đang mặc dở ("Bộ Đi Mưa 2/3"), bấm mở đủ 4 bộ.
6. Tổng sức mạnh: hàng chip từ `bonusChips` (biểu tượng + số; `icon` dạng `el:<hành>` thì dùng biểu tượng hành); bấm chip hiện câu đầy đủ.

### 7. Hiện chuỗi tương sinh trên sân
Luật mới trong engine (Claude): 2 món → món sau +15%; **chuỗi 3 món đúng vòng sinh → cả chuỗi +25%; chuỗi 4–5 → +40%**; **chuỗi đủ 5 hành = Ngũ hành viên mãn trên sân → mọi món nhanh thêm 20%** (`engine.fullCycleActive`). Mỗi món có `tower.synergyChainLength` (1 = không chuỗi), `tower.synergyFromUid` (món sinh ra nó).
- Đường sáng nối các món trong chuỗi dày / sáng dần theo độ dài; nhãn nhỏ "Chuỗi 3 +25%", "Chuỗi 4 +40%".
- Khi `fullCycleActive` bật: banner "Ngũ hành viên mãn!" + vòng 5 màu chạy quanh các món trong chuỗi.
- Trong bảng nâng cấp món: dòng "Chuỗi tương sinh: 3 món (+25%)".
- Gợi ý xếp chuỗi được (khoảng cách ≤ 105 đơn vị logic): Màn 2 pad_4 → pad_3 → pad_5 → pad_6 → pad_8; Màn 3 pad_5 → pad_3 → pad_6 → pad_7 → pad_9.

---

## Claude → Antigravity: vẽ Trận trùm phố "Dốc Đà Lạt" (việc 8, sau việc 6–7)

Luật xong ở `src/core/shops/streetBoss.ts` (đường chữ S dài 3 tầng, 11 ô, 12 đợt), trùm `st_bao_loc` "Bão Lốc Cuối Mùa", bộ món mang theo (`loadoutSize` 6, `defaultLoadout`), `saveStreetLoadout()`, `SHOP_STREET` có thêm dòng `stage_4` (`isBoss: true`, nút `btn-start-stage-4` đã tự hiện trên con phố). **Không đổi số.**
1. **Nền bản đồ** `map_trum_pho` (360×520 logic, khớp `STAGE_4_DEFINITION`): cả con phố dốc, 3 tầng đường — tầng trên đi ngang **mặt tiền tiệm giày**, tầng giữa **tiệm bánh**, tầng dưới **tiệm hoa**, cuối dốc là quầy cuối phố. Trời tối hơn, mây đen xoáy, gió cuốn lá.
2. **Trùm Bão Lốc Cuối Mùa**: đám mây lốc lớn, **5 màu theo hành** (Thủy → Mộc → Hỏa → Thổ → Kim, `phaseElements`), chữ "Đổi hành!" khi đổi; hiệu ứng **"Gọi quân!"** (sự kiện `split` với text "Gọi quân!") khi gọi bọn phá đồ của từng tiệm.
3. **Màn chọn món mang ra phố** (trước khi vào trận): lưới 15 món của 3 tiệm, chọn đúng 6, gợi ý "đủ 5 hành + 1 hỗ trợ"; lưu bằng `saveStreetLoadout(chosen, STAGES.stage_4.towerIds, 6)`; scene đã đọc `loadTdSave().streetLoadout`.
4. **Mặt tiền trùm phố trên con phố**: biển "Trùm Phố", khoá cho tới khi qua cả 3 tiệm; thắng thì **huy hiệu "Giữ trọn phố"** (`save.badges` có `'giu_tron_pho'`) và thẻ đồ Hàng hiệu chắc chắn rơi.
5. Kết quả trận: chữ riêng cho trùm phố (thắng: "PHỐ SẠCH BÓNG!", thua: "PHỐ BỊ BÃO CUỐN").

## Claude → Antigravity: vẽ 2 phố thật (việc 9, sau việc 8)
Sườn đã xong: `src/core/streets/generated/*.json` (máy làm màn sinh ra), thử bằng `/#street_tang_bat_ho` và `/#street_pho_ca_phe`. Hiện dùng hình tạm (món tiệm giày, quái tiệm giày, nền màn tạm).
1. **Nền 2 phố** bám đúng đường đi (`stage.paths`): Tăng Bạt Hổ – Trương Công Định (dốc chợ, quán đêm, hostel, bar hầm), Phố Cà Phê (quán xưa, sân thượng, cây xanh). Chừa ô đặt (`stage.pads`). Góc dưới ghi "© OpenStreetMap contributors".
2. **18 món** (9 địa điểm mỗi phố, tên + 4 tên bậc trong file JSON) và **12 quái + quái con** (tên trong file). Phong cách như 3 tiệm cũ.
3. Khi có hình: xoá lối tạm trong `src/game/atlasIcons.ts` (ROLE_FALLBACK_TOWER, TRAIT_FALLBACK_ENEMY).
4. **Chọn phố trên bản đồ Đà Lạt** sau Trận trùm phố: thêm 2 điểm phố thật (khoá đến khi thắng trùm phố). Danh sách: `REAL_STREET_STAGES` trong `src/core/tdDefinitions.ts`.
Không sửa `src/core/` (luật, số) — cần đổi số thì ghi ở đây.

## Claude → Antigravity: việc 10 — nền Phố Phan Đình Phùng (sau việc 9)
Rà việc 6–9: đạt (xem REVIEW_LOG 23/11). Phố 3 `street_phan_dinh_phung` đã chơi được, món và quái dùng hình Spark (art/spark → public/assets/spark_atlas.*), **chỉ còn thiếu nền**.
1. Vẽ `public/assets/map_street_phan_dinh_phung.webp` bám `stage.paths` / `stage.pads` trong `src/core/streets/generated/street_phan_dinh_phung.json`, cùng kiểu 2 phố thật trước. Phố cũ xóm Cầu Quẹo: dãy nhà phố cũ, nhà thuốc, salon tóc, nhà sách, studio ảnh cưới, quán phở sáng, tiệm xe máy. Góc trái dưới đang trống → đặt cảnh (dãy nhà, cây thông, chợ nhỏ). Ghi "© OpenStreetMap contributors".
2. Thêm khoá vào `STREET_MAP_KEYS` và điểm phố 3 trên bản đồ chọn phố (`REAL_STREET_MAP_PINS`).
3. Không vẽ lại món / quái phố 3 (đã có hình Spark). Không sửa `src/core/`, `art/spark/`, `public/assets/spark_atlas.*`.
