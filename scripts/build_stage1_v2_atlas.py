#!/usr/bin/env python3
"""
Vẽ lại toàn bộ bộ Sprite Màn 1 "Tiệm Giày Hẻm Dốc" theo đúng chuẩn Màn 2 & Màn 3:
- 5 món × 4 bậc (t1, t2, t3a, t3b) vẽ RIÊNG TỪNG HÌNH (20 hình gốc riêng biệt) × 3 khung đánh = 60 khung.
- 7 quái Màn 1 vẽ riêng từng con × 4 khung đi (Chuột & Nắng Gắt vẽ kỹ dùng chung Màn 2–3) + làm mới boss_water = 32 khung.
- Toàn bộ 5 biểu tượng Ngũ Hành (el_*), xu, ví, đôi giày, đạn dép tông, đạn gói hút ẩm, thảm cói & kệ giày gỗ vector = 12 khung.
- GIỮ NGUYÊN 100% tên khung (frame) trong atlas & bảo toàn nguyên vẹn toàn bộ khung Màn 2 (86) và Màn 3 (98)!
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
BACKUP_AFTER_S3 = SCRATCH_DIR / "atlas_backup_after_stage3" / "frames"

SHEET_T12 = ART_DIR / "s1v2_towers_t1_t2_1795379538597.jpg"
SHEET_T3 = ART_DIR / "s1v2_towers_t3a_t3b_1795379622856.jpg"
SHEET_EN = ART_DIR / "s1v2_enemies_1795379668521.jpg"
SHEET_ICONS = ART_DIR / "s1v2_icons_1795379668152.jpg"
PAD_RUG_PNG = SCRATCH_DIR / "stage1_v2_map_pngs" / "pad_rug.png"
SHOE_SHELF_PNG = SCRATCH_DIR / "stage1_v2_map_pngs" / "shoe_shelf.png"


def remove_white_bg_floodfill(
    img: Image.Image,
    white_thresh: int = 236,
    sat_thresh: int = 22,
) -> Image.Image:
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
    white_thresh: int = 238,
    sat_thresh: int = 18,
    protect_rect: tuple[int, int, int, int] | None = None,
) -> Image.Image:
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
) -> Image.Image:
    sub = sheet.crop(box)
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
    fitted = trim_and_fit(sprite_img, 184, pad=10)
    frames: list[Image.Image] = []

    frames.append(fitted.resize((target_size, target_size), Image.Resampling.LANCZOS))

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
        c.alpha_composite(rs, ((target_size - rs.width) // 2, (target_size - rs.height) // 2 + dy))
        frames.append(c)
    return frames


def save_checkerboard_preview(samples: list[tuple[str, Image.Image]], out_path: pathlib.Path):
    cols = 7
    cell = 124
    rows = (len(samples) + cols - 1) // cols
    pw, ph = cols * cell, rows * cell
    im = Image.new("RGBA", (pw, ph), (220, 220, 220, 255))
    d = ImageDraw.Draw(im)
    sq = 16
    for y in range(0, ph, sq):
        for x in range(0, pw, sq):
            col = (232, 232, 232, 255) if ((x // sq) + (y // sq)) % 2 == 0 else (188, 188, 188, 255)
            d.rectangle([x, y, x + sq, y + sq], fill=col)
    for idx, (label, sim) in enumerate(samples):
        r, c = divmod(idx, cols)
        cx, cy = c * cell, r * cell
        fit = trim_and_fit(sim, cell - 24, pad=2)
        im.alpha_composite(fit, (cx + 12, cy + 4))
        d.rectangle([cx + 2, cy + cell - 18, cx + cell - 2, cy + cell - 2], fill=(43, 26, 18, 215))
        d.text((cx + 5, cy + cell - 15), label[:17], fill=(255, 240, 200, 255))
    im.save(out_path)


def main():
    # 1. Nạp toàn bộ 288 khung hiện có (bảo toàn 100% khung Màn 2 & Màn 3 lossless!)
    frames: dict[str, Image.Image] = {}
    for p in sorted(BACKUP_AFTER_S3.glob("*.png")):
        frames[p.stem] = Image.open(p).convert("RGBA")
    original_keys = set(frames.keys())

    sh_t12 = Image.open(SHEET_T12).convert("RGB")
    sh_t3 = Image.open(SHEET_T3).convert("RGB")
    sh_en = Image.open(SHEET_EN).convert("RGB")
    sh_ic = Image.open(SHEET_ICONS).convert("RGB")

    preview_items: list[tuple[str, Image.Image]] = []

    # 2. Thay thế toàn bộ 5 món × 4 bậc vẽ RIÊNG TỪNG HÌNH (giữ nguyên 100% tên khung!)
    # Cắt nghiêm ngặt phía trên chữ nhãn: T12 row0 y<=306, row1 y<=718; T3 row0 y<=312, row1 y<=682
    tower_specs: dict[tuple[str, str], tuple] = {
        # --- Tier 1 ---
        ("wood_tower", "t1"): (sh_t12, (26, 20, 294, 306), 236, 22, None),
        ("metal_tower", "t1"): (sh_t12, (306, 20, 560, 306), 236, 22, None),
        ("water_tower", "t1"): (sh_t12, (608, 20, 816, 306), 244, 14, None),
        ("fire_tower", "t1"): (sh_t12, (848, 20, 1074, 306), 245, 14, None),
        ("earth_tower", "t1"): (sh_t12, (1102, 20, 1354, 306), 236, 22, None),

        # --- Tier 2 ---
        ("wood_tower", "t2"): (sh_t12, (18, 392, 294, 718), 236, 22, None),
        ("metal_tower", "t2"): (sh_t12, (302, 392, 554, 718), 236, 22, None),
        ("water_tower", "t2"): (sh_t12, (582, 392, 832, 718), 244, 14, (0.34, 0.34, 0.78, 0.90)),
        ("fire_tower", "t2"): (sh_t12, (830, 392, 1102, 718), 245, 14, None),
        ("earth_tower", "t2"): (sh_t12, (1106, 392, 1360, 718), 222, 42, None),

        # --- Tier 3A ---
        ("wood_tower", "t3a"): (sh_t3, (22, 18, 288, 312), 236, 22, (0.0, 0.0, 0.0, 0.0)),
        ("metal_tower", "t3a"): (sh_t3, (298, 18, 554, 312), 236, 22, None),
        ("water_tower", "t3a"): (sh_t3, (578, 18, 790, 312), 245, 13, None),
        ("fire_tower", "t3a"): (sh_t3, (800, 18, 1094, 312), 242, 16, None),
        ("earth_tower", "t3a"): (sh_t3, (1098, 18, 1350, 312), 232, 28, None),

        # --- Tier 3B ---
        ("wood_tower", "t3b"): (sh_t3, (20, 408, 288, 682), 236, 22, None),
        ("metal_tower", "t3b"): (sh_t3, (290, 408, 534, 682), 236, 22, None),
        ("water_tower", "t3b"): (sh_t3, (554, 408, 814, 682), 244, 14, None),
        ("fire_tower", "t3b"): (sh_t3, (826, 408, 1076, 682), 244, 14, None),
        ("earth_tower", "t3b"): (sh_t3, (1076, 408, 1356, 682), 232, 26, None),
    }

    for (tid, tier), (sheet, box, wt, st, hole_prot) in tower_specs.items():
        clean = crop_clean_sprite(sheet, box, white_thresh=wt, sat_thresh=st)
        if hole_prot is not None:
            cw, ch = clean.size
            pr = (
                int(cw * hole_prot[0]),
                int(ch * hole_prot[1]),
                int(cw * hole_prot[2]),
                int(ch * hole_prot[3]),
            )
            clean = punch_interior_white_holes(clean, min_area=70, white_thresh=238, sat_thresh=18, protect_rect=pr)
        anim = make_tower_anim_frames(clean, target_size=92)
        for idx, fimg in enumerate(anim):
            frames[f"tower_{tid}_{tier}_f{idx}"] = fimg
        preview_items.append((f"{tid}_{tier}", anim[0]))

    # 3. Thay thế toàn bộ 7 quái Màn 1 vẽ riêng từng con (cắt nghiêm ngặt trên chữ nhãn: row0 y<=314, row1 y<=698!)
    # Lưu ý: TdStageScene.ts đặt defaultFacesLeft=true cho split_fire & split_fire_mini nên lật ngang 2 con gián
    # để chúng luôn chạy hướng đầu về phía trước đúng như code đang có mà không cần sửa code!
    enemy_specs = [
        ("fast_metal", (54, 34, 326, 314), 74, 4, 240, 18, False),
        ("tank_earth", (366, 34, 688, 314), 86, 2, 236, 22, False),
        ("split_fire", (738, 34, 1030, 314), 86, 3, 236, 22, True),
        ("split_fire_mini", (1096, 34, 1304, 314), 62, 4, 236, 22, True),
        ("healer_wood", (106, 394, 448, 698), 86, 3, 226, 38, False),
        ("disrupt_water", (528, 394, 892, 698), 86, 3, 238, 18, False),
        ("fly_wood", (964, 394, 1290, 698), 86, 4, 224, 42, False),
    ]
    for eid, box, esize, ebob, wt, st, flip_h in enemy_specs:
        clean = crop_clean_sprite(sh_en, box, white_thresh=wt, sat_thresh=st)
        if flip_h:
            clean = clean.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        walk = make_enemy_walk_frames(clean, target_size=esize, bob_px=ebob)
        for idx, fimg in enumerate(walk):
            frames[f"enemy_{eid}_f{idx}"] = fimg
        preview_items.append((eid, walk[0]))

    # Làm mới cả enemy_boss_water bằng bản Trùm Mùa Nồm Thủy sắc nét mới (xoá sạch tàn tích PIL cũ)
    for idx in range(4):
        frames[f"enemy_boss_water_f{idx}"] = frames[f"enemy_fl_monsoon_f{idx}"].copy()

    # 4. Thay thế toàn bộ 5 biểu tượng Ngũ Hành, xu, ví, đôi giày, đạn dép tông, đạn hút ẩm (KHÔNG dùng khối PIL!)
    icon_specs = [
        ("el_kim", (60, 54, 250, 330), 64, 244, 14),
        ("el_moc", (316, 54, 530, 330), 64, 236, 22),
        ("el_thuy", (584, 54, 792, 330), 64, 240, 18),
        ("el_hoa", (840, 54, 1072, 330), 64, 236, 22),
        ("el_tho", (1096, 54, 1346, 330), 64, 236, 22),
        ("icon_coin", (32, 414, 278, 678), 64, 236, 22),
        ("icon_wallet", (300, 414, 544, 678), 64, 236, 22),
        ("icon_shoe_life", (562, 414, 814, 678), 64, 240, 18),
        ("proj_dep_tong", (834, 414, 1078, 678), 56, 236, 22),
        ("proj_silica", (1104, 414, 1336, 678), 56, 245, 14),
    ]
    for iname, box, isize, wt, st in icon_specs:
        clean = crop_clean_sprite(sh_ic, box, white_thresh=wt, sat_thresh=st)
        fit = trim_and_fit(clean, isize, pad=2)
        frames[iname] = fit
        preview_items.append((iname, fit))

    # Thảm cói & kệ giày gỗ từ vector SVG Màn 1 v2
    if PAD_RUG_PNG.exists():
        frames["prop_pad_rug"] = trim_and_fit(Image.open(PAD_RUG_PNG).convert("RGBA"), 96, pad=2)
        preview_items.append(("prop_pad_rug", frames["prop_pad_rug"]))
    if SHOE_SHELF_PNG.exists():
        frames["prop_shoe_shelf"] = trim_and_fit(Image.open(SHOE_SHELF_PNG).convert("RGBA"), 136, pad=4)
        preview_items.append(("prop_shoe_shelf", frames["prop_shoe_shelf"]))

    # Kiểm tra GIỮ NGUYÊN 100% tên khung trong atlas!
    assert set(frames.keys()) == original_keys, (
        f"Frame keys mismatch! missing={original_keys - set(frames.keys())}, "
        f"extra={set(frames.keys()) - original_keys}"
    )

    # 5. Đóng gói lại toàn bộ 288 khung vào Texture Atlas chung (ATLAS_W = 1536, height <= 2048)
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

    atlas_h = ((cur_y + row_h + PADDING + 15) // 16) * 16
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
                    "version": "3.1-stage1-v2",
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

    preview_out = SCRATCH_DIR / "stage1_v2_atlas_preview.png"
    save_checkerboard_preview(preview_items, preview_out)

    print(
        f"Repacked ALL {len(frames)} frames (exact keys preserved!) -> "
        f"{ATLAS_W}x{atlas_h}, webp={atlas_webp.stat().st_size / 1024:.1f} KB, "
        f"json={atlas_json.stat().st_size / 1024:.1f} KB"
    )
    print(f"Saved preview: {preview_out}")


if __name__ == "__main__":
    main()
