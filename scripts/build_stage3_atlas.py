#!/usr/bin/env python3
"""
Đóng gói toàn bộ bộ Sprite Màn 3 "Tiệm Hoa Cuối Dốc" (5 món × 4 bậc vẽ riêng × 3 khung,
6 quái × 4 khung, Trùm Mùa Nồm 3 màu theo hành Thủy/Mộc/Kim × 4 khung, biểu tượng chậu hoa & giàn hoa)
ghép cùng toàn bộ khung Màn 1 + Màn 2 đã có vào `public/assets/gon_tiem_atlas.webp` + `.json`.
"""

from __future__ import annotations

from collections import deque
import json
import pathlib
from PIL import Image, ImageDraw, ImageEnhance

REPO_ROOT = pathlib.Path("/home/antigravity/ltckha/giang-ho-ai")
OUT_DIR = REPO_ROOT / "public" / "assets"
ART_DIR = pathlib.Path(
    "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/f27c1771-a6ca-4307-ac45-cbf7e4715aff"
)
SCRATCH_DIR = ART_DIR / "scratch"
BACKUP_FRAMES_DIR = SCRATCH_DIR / "atlas_backup_pre_stage3" / "frames"

SHEET_T1_T2 = ART_DIR / "s3_towers_t1_t2_1795377919282.jpg"
SHEET_T3 = ART_DIR / "s3_towers_t3a_t3b_1795377971449.jpg"
SHEET_ENEMIES = ART_DIR / "s3_enemies_boss_1795377965362.jpg"
FLOWER_RACK_PNG = SCRATCH_DIR / "stage3_map_pngs" / "flower_rack.png"


def remove_white_bg_floodfill(
    img: Image.Image,
    white_thresh: int = 236,
    sat_thresh: int = 22,
) -> Image.Image:
    """Tách nền trắng tinh bằng BFS flood-fill từ 4 mép + làm mềm halo nhẹ, không ăn vào chi tiết sáng bên trong."""
    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()

    def is_bg_like(r: int, g: int, b: int) -> bool:
        mn, mx = min(r, g, b), max(r, g, b)
        return mn >= white_thresh and (mx - mn) <= sat_thresh

    visited = bytearray(w * h)
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        for y in (0, h - 1):
            r, g, b, _ = px[x, y]
            if is_bg_like(r, g, b):
                idx = y * w + x
                if not visited[idx]:
                    visited[idx] = 1
                    q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            r, g, b, _ = px[x, y]
            if is_bg_like(r, g, b):
                idx = y * w + x
                if not visited[idx]:
                    visited[idx] = 1
                    q.append((x, y))

    while q:
        cx, cy = q.popleft()
        px[cx, cy] = (0, 0, 0, 0)
        for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                nidx = ny * w + nx
                if not visited[nidx]:
                    r, g, b, _ = px[nx, ny]
                    if is_bg_like(r, g, b):
                        visited[nidx] = 1
                        q.append((nx, ny))

    # Gọt 1 vòng halo sáng mảnh sát nền trong suốt
    border_halo: list[tuple[int, int, int]] = []
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if (
                px[x - 1, y][3] == 0
                or px[x + 1, y][3] == 0
                or px[x, y - 1][3] == 0
                or px[x, y + 1][3] == 0
            ):
                lum = (r + g + b) // 3
                sat = max(r, g, b) - min(r, g, b)
                if lum >= white_thresh - 16 and sat <= sat_thresh + 10:
                    border_halo.append((x, y, 0))
                elif lum >= white_thresh - 34 and sat <= sat_thresh + 14:
                    border_halo.append((x, y, 130))
    for x, y, na in border_halo:
        r, g, b, _ = px[x, y]
        px[x, y] = (r, g, b, na)

    return rgba


def punch_interior_white_holes(
    rgba: Image.Image,
    min_area: int = 80,
    white_thresh: int = 236,
    sat_thresh: int = 20,
    protect_rect: tuple[int, int, int, int] | None = None,
) -> Image.Image:
    """Đục các lỗ nền trắng kín bên trong quai bình / lồng quạt (tránh vùng mặt/mắt)."""
    im = rgba.copy()
    w, h = im.size
    px = im.load()
    seen = bytearray(w * h)

    def is_white(r: int, g: int, b: int, a: int) -> bool:
        if a < 180:
            return False
        return min(r, g, b) >= white_thresh and (max(r, g, b) - min(r, g, b)) <= sat_thresh

    for y in range(1, h - 1):
        for x in range(1, w - 1):
            idx = y * w + x
            if seen[idx]:
                continue
            r, g, b, a = px[x, y]
            if not is_white(r, g, b, a):
                continue
            comp: list[tuple[int, int]] = []
            q = deque([(x, y)])
            seen[idx] = 1
            hits_protected = False
            while q:
                cx, cy = q.popleft()
                comp.append((cx, cy))
                if protect_rect is not None:
                    x0, y0, x1, y1 = protect_rect
                    if x0 <= cx <= x1 and y0 <= cy <= y1:
                        hits_protected = True
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        nidx = ny * w + nx
                        if not seen[nidx]:
                            nr, ng, nb, na = px[nx, ny]
                            if is_white(nr, ng, nb, na):
                                seen[nidx] = 1
                                q.append((nx, ny))
            if len(comp) >= min_area and not hits_protected:
                for cx, cy in comp:
                    px[cx, cy] = (0, 0, 0, 0)
    return im


def crop_clean_sprite(
    sheet: Image.Image,
    box: tuple[int, int, int, int],
    white_thresh: int = 236,
    sat_thresh: int = 22,
    mask_rects: list[tuple[int, int, int, int]] | None = None,
) -> Image.Image:
    """Cắt ô sprite, che gọn góc thừa (nếu có) bằng màu trắng, thêm viền trắng 8px rồi tách nền BFS."""
    sub = sheet.crop(box).copy()
    if mask_rects:
        md = ImageDraw.Draw(sub)
        for rx0, ry0, rx1, ry1 in mask_rects:
            md.rectangle([rx0, ry0, rx1, ry1], fill=(255, 255, 255))
    padded = Image.new("RGB", (sub.width + 16, sub.height + 16), (255, 255, 255))
    padded.paste(sub, (8, 8))
    return remove_white_bg_floodfill(padded, white_thresh=white_thresh, sat_thresh=sat_thresh)


def trim_and_fit(img: Image.Image, box_size: int, pad: int = 6) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return Image.new("RGBA", (box_size, box_size), (0, 0, 0, 0))
    cropped = img.crop(bbox)
    cw, ch = cropped.size
    scale = min((box_size - pad * 2) / cw, (box_size - pad * 2) / ch)
    nw = max(1, int(round(cw * scale)))
    nh = max(1, int(round(ch * scale)))
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (box_size, box_size), (0, 0, 0, 0))
    canvas.paste(resized, ((box_size - nw) // 2, (box_size - nh) // 2), resized)
    return canvas


def make_tower_anim_frames(sprite_img: Image.Image, target_size: int = 92) -> list[Image.Image]:
    """3 khung hoạt ảnh đánh: f0 (đứng yên), f1 (lấy đà nhún nhẹ), f2 (tung đòn vươn sáng)."""
    fitted = trim_and_fit(sprite_img, 184, pad=10)
    frames: list[Image.Image] = []

    f0 = fitted.resize((target_size, target_size), Image.Resampling.LANCZOS)
    frames.append(f0)

    c1 = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    sq = fitted.resize((int(target_size * 1.06), int(target_size * 0.90)), Image.Resampling.LANCZOS)
    sq = sq.rotate(5, resample=Image.Resampling.BICUBIC, expand=True)
    c1.alpha_composite(sq, ((target_size - sq.width) // 2, target_size - sq.height + 2))
    frames.append(c1)

    c2 = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    st = fitted.resize((int(target_size * 0.94), int(target_size * 1.06)), Image.Resampling.LANCZOS)
    st = ImageEnhance.Brightness(st).enhance(1.13)
    st = st.rotate(-6, resample=Image.Resampling.BICUBIC, expand=True)
    c2.alpha_composite(st, ((target_size - st.width) // 2, max(0, (target_size - st.height) // 2 - 4)))
    frames.append(c2)
    return frames


def make_enemy_walk_frames(base_img: Image.Image, target_size: int = 80, bob_px: int = 4) -> list[Image.Image]:
    """4 khung hoạt ảnh đi / bay nhún nhịp đồng nhất Màn 1 & Màn 2."""
    fitted = trim_and_fit(base_img, target_size, pad=5)
    specs = [
        (1.0, 1.0, 0, 0),
        (1.06, 0.93, -5, bob_px),
        (0.96, 1.05, 0, -bob_px),
        (1.05, 0.94, 5, bob_px),
    ]
    frames: list[Image.Image] = []
    for sx, sy, rot, dy in specs:
        c = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
        nw = max(1, int(round(target_size * sx)))
        nh = max(1, int(round(target_size * sy)))
        rs = fitted.resize((nw, nh), Image.Resampling.LANCZOS).rotate(rot, resample=Image.Resampling.BICUBIC, expand=True)
        ox = (target_size - rs.width) // 2
        oy = (target_size - rs.height) // 2 + dy
        c.alpha_composite(rs, (ox, oy))
        frames.append(c)
    return frames


def load_backup_frames() -> dict[str, Image.Image]:
    out: dict[str, Image.Image] = {}
    for p in sorted(BACKUP_FRAMES_DIR.glob("*.png")):
        out[p.stem] = Image.open(p).convert("RGBA")
    return out


def save_checkerboard_preview(stage3_samples: list[tuple[str, Image.Image]], out_path: pathlib.Path):
    cols = 6
    cell = 128
    rows = (len(stage3_samples) + cols - 1) // cols
    pw, ph = cols * cell, rows * cell
    im = Image.new("RGBA", (pw, ph), (220, 220, 220, 255))
    d = ImageDraw.Draw(im)
    sq = 16
    for y in range(0, ph, sq):
        for x in range(0, pw, sq):
            col = (232, 232, 232, 255) if ((x // sq) + (y // sq)) % 2 == 0 else (188, 188, 188, 255)
            d.rectangle([x, y, x + sq, y + sq], fill=col)
    for idx, (label, sim) in enumerate(stage3_samples):
        r, c = divmod(idx, cols)
        cx, cy = c * cell, r * cell
        fit = trim_and_fit(sim, cell - 24, pad=2)
        im.alpha_composite(fit, (cx + 12, cy + 4))
        d.rectangle([cx + 2, cy + cell - 18, cx + cell - 2, cy + cell - 2], fill=(43, 26, 18, 215))
        d.text((cx + 6, cy + cell - 15), label[:18], fill=(255, 240, 200, 255))
    im.save(out_path)


def main():
    frames = load_backup_frames()
    existing_count = len(frames)

    sh_t12 = Image.open(SHEET_T1_T2).convert("RGB")
    sh_t3 = Image.open(SHEET_T3).convert("RGB")
    sh_en = Image.open(SHEET_ENEMIES).convert("RGB")

    # 1. Toàn bộ 5 món × 4 bậc vẽ RIÊNG TỪNG HÌNH (20 hình gốc hoàn toàn khác nhau!)
    # (sheet, box, white_thresh, sat_thresh, mask_rects, punch_holes_protect_frac)
    tower_specs: dict[tuple[str, str], tuple] = {
        # --- Tier 1 (row 0 of SHEET_T1_T2) ---
        ("fl_can", "t1"): (sh_t12, (46, 26, 330, 266), 236, 22, None, (0.20, 0.35, 0.72, 0.85)),
        ("fl_shears", "t1"): (sh_t12, (342, 26, 530, 266), 236, 22, None, None),
        ("fl_lime", "t1"): (sh_t12, (598, 26, 790, 266), 245, 14, None, None),
        ("fl_heater", "t1"): (sh_t12, (860, 26, 1044, 266), 218, 48, None, None),
        ("fl_vent", "t1"): (sh_t12, (1110, 26, 1340, 266), 236, 22, None, (0.34, 0.45, 0.68, 0.78)),

        # --- Tier 2 (row 1 of SHEET_T1_T2) ---
        # Tách sạch đầu vòi bình tưới & đầu cán kéo (góc dưới phải bình tưới che 16px đầu cán kéo)
        ("fl_can", "t2"): (sh_t12, (16, 460, 326, 744), 236, 22, [(304, 196, 310, 284)], (0.18, 0.36, 0.70, 0.86)),
        ("fl_shears", "t2"): (sh_t12, (310, 366, 520, 744), 236, 22, [(0, 120, 14, 250)], None),
        ("fl_lime", "t2"): (sh_t12, (534, 480, 818, 744), 245, 14, None, None),
        ("fl_heater", "t2"): (sh_t12, (812, 444, 1118, 744), 236, 22, None, None),
        ("fl_vent", "t2"): (sh_t12, (1116, 346, 1362, 744), 236, 22, None, (0.30, 0.38, 0.70, 0.62)),

        # --- Tier 3A (row 0 of SHEET_T3) ---
        # Tách sạch tia nước của Vòi Xịt Tăng Áp và cán Kéo Cắt Cành Lớn ở khoảng x=298..330
        ("fl_can", "t3a"): (sh_t3, (24, 34, 336, 354), 236, 22, [(276, 150, 312, 320)], (0.20, 0.35, 0.65, 0.86)),
        ("fl_shears", "t3a"): (sh_t3, (296, 52, 548, 354), 236, 22, [(0, 0, 42, 70)], None),
        ("fl_lime", "t3a"): (sh_t3, (568, 56, 808, 354), 246, 12, None, None),
        ("fl_heater", "t3a"): (sh_t3, (828, 34, 1078, 354), 236, 22, None, None),
        ("fl_vent", "t3a"): (sh_t3, (1104, 34, 1370, 354), 236, 22, None, None),

        # --- Tier 3B (row 1 of SHEET_T3) ---
        ("fl_can", "t3b"): (sh_t3, (46, 444, 290, 720), 236, 22, None, (0.14, 0.56, 0.66, 0.90)),
        ("fl_shears", "t3b"): (sh_t3, (296, 422, 542, 722), 236, 22, None, None),
        ("fl_lime", "t3b"): (sh_t3, (564, 448, 814, 718), 245, 14, None, None),
        ("fl_heater", "t3b"): (sh_t3, (842, 424, 1070, 718), 236, 22, None, None),
        ("fl_vent", "t3b"): (sh_t3, (1106, 446, 1368, 722), 236, 22, None, None),
    }

    preview_items: list[tuple[str, Image.Image]] = []
    stage3_added = 0

    for (tid, tier), (sheet, box, wt, st, masks, hole_prot) in tower_specs.items():
        clean = crop_clean_sprite(sheet, box, white_thresh=wt, sat_thresh=st, mask_rects=masks)
        if hole_prot is not None:
            cw, ch = clean.size
            pr = (
                int(cw * hole_prot[0]),
                int(ch * hole_prot[1]),
                int(cw * hole_prot[2]),
                int(ch * hole_prot[3]),
            )
            clean = punch_interior_white_holes(clean, min_area=90, white_thresh=234, sat_thresh=22, protect_rect=pr)
        anim_frames = make_tower_anim_frames(clean, target_size=92)
        for idx, fimg in enumerate(anim_frames):
            frames[f"tower_{tid}_{tier}_f{idx}"] = fimg
            stage3_added += 1
        preview_items.append((f"{tid}_{tier}", anim_frames[0]))

    # 2. Quái Màn 3 (6 con thường + Trùm Mùa Nồm 3 màu theo hành Thủy / Mộc / Kim!)
    # Cắt nghiêm ngặt phía trên chữ nhãn (row 0: y <= 290, row 1: y <= 686)
    enemy_specs = [
        ("fl_aphid", (46, 44, 240, 290), 70, 4, 236, 20),
        ("fl_snail", (296, 44, 544, 290), 86, 2, 236, 20),
        ("fl_dust", (560, 44, 834, 290), 86, 3, 236, 20),
        ("fl_dust_mini", (868, 44, 1074, 290), 62, 4, 236, 20),
        ("fl_frost", (1116, 44, 1344, 290), 84, 4, 246, 12),
        ("fl_rot", (18, 384, 266, 686), 84, 3, 236, 20),
        # Trùm Mùa Nồm 3 màu theo hành: Thủy (mặc định), Mộc, Kim
        ("fl_monsoon", (276, 384, 554, 688), 112, 3, 236, 20),
        ("fl_monsoon_moc", (558, 384, 836, 688), 112, 3, 236, 20),
        ("fl_monsoon_kim", (842, 384, 1120, 688), 112, 3, 246, 12),
    ]
    for eid, box, esize, ebob, wt, st in enemy_specs:
        clean = crop_clean_sprite(sh_en, box, white_thresh=wt, sat_thresh=st)
        walk = make_enemy_walk_frames(clean, target_size=esize, bob_px=ebob)
        for idx, fimg in enumerate(walk):
            frames[f"enemy_{eid}_f{idx}"] = fimg
            stage3_added += 1
        preview_items.append((eid, walk[0]))

    # 3. Biểu tượng Chậu Hoa (HUD mạng Màn 3) & Đạo cụ Giàn Hoa Trưng Bày
    pot_clean = crop_clean_sprite(sh_en, (1132, 388, 1354, 686), white_thresh=238, sat_thresh=18)
    frames["icon_flower_life"] = trim_and_fit(pot_clean, 64, pad=2)
    stage3_added += 1
    preview_items.append(("icon_flower_life", frames["icon_flower_life"]))

    if FLOWER_RACK_PNG.exists():
        rack_im = Image.open(FLOWER_RACK_PNG).convert("RGBA")
        frames["prop_flower_rack"] = trim_and_fit(rack_im, 136, pad=4)
        stage3_added += 1
        preview_items.append(("prop_flower_rack", frames["prop_flower_rack"]))

    # 4. Đóng gói shelf-packing (ATLAS_W = 1536 để chiều cao <= 1700, an toàn tuyệt đối <= 2048x2048 trên mọi GPU di động!)
    ATLAS_W = 1536
    PADDING = 3
    sorted_items = sorted(frames.items(), key=lambda kv: (-kv[1].height, -kv[1].width, kv[0]))

    placements: list[tuple[str, int, int, int, int, Image.Image]] = []
    cur_x, cur_y, row_h = PADDING, PADDING, 0
    for name, fim in sorted_items:
        fw, fh = fim.size
        if cur_x + fw + PADDING > ATLAS_W:
            cur_x = PADDING
            cur_y += row_h + PADDING
            row_h = 0
        placements.append((name, cur_x, cur_y, fw, fh, fim))
        cur_x += fw + PADDING
        row_h = max(row_h, fh)

    atlas_h = cur_y + row_h + PADDING
    atlas_h = ((atlas_h + 15) // 16) * 16
    assert atlas_h <= 2048, f"Atlas height {atlas_h} exceeds 2048!"

    atlas_im = Image.new("RGBA", (ATLAS_W, atlas_h), (0, 0, 0, 0))
    json_frames: dict[str, dict] = {}
    for name, x, y, w, h, fim in placements:
        atlas_im.paste(fim, (x, y), fim)
        json_frames[name] = {
            "frame": {"x": x, "y": y, "w": w, "h": h},
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": w, "h": h},
            "sourceSize": {"w": w, "h": h},
        }

    atlas_webp = OUT_DIR / "gon_tiem_atlas.webp"
    atlas_json = OUT_DIR / "gon_tiem_atlas.json"
    atlas_im.save(atlas_webp, format="WEBP", quality=82, method=6)
    atlas_json.write_text(
        json.dumps(
            {
                "frames": json_frames,
                "meta": {
                    "app": "gon-tiem-sach-pho-atlas",
                    "version": "3.0",
                    "image": "gon_tiem_atlas.webp",
                    "format": "RGBA8888",
                    "size": {"w": ATLAS_W, "h": atlas_h},
                    "scale": "1",
                },
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    # Lưu bản sao lossless PNG của atlas Màn 1+2+3 (phòng bước Màn 1 redraw tái sử dụng khung Màn 2 & 3!)
    s3_bak = SCRATCH_DIR / "atlas_backup_after_stage3"
    s3_bak.mkdir(parents=True, exist_ok=True)
    (s3_bak / "frames").mkdir(exist_ok=True)
    for name, fim in frames.items():
        fim.save(s3_bak / "frames" / f"{name}.png")

    preview_out = SCRATCH_DIR / "stage3_atlas_preview.png"
    save_checkerboard_preview(preview_items, preview_out)

    print(
        f"Packed {len(frames)} frames ({existing_count} prev + {stage3_added} stage3) -> "
        f"{ATLAS_W}x{atlas_h}, webp={atlas_webp.stat().st_size / 1024:.1f} KB, "
        f"json={atlas_json.stat().st_size / 1024:.1f} KB"
    )
    print(f"Saved preview: {preview_out}")


if __name__ == "__main__":
    main()
