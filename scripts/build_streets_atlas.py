#!/usr/bin/env python3
"""
Đóng gói toàn bộ bộ Sprite Trận Trùm Phố (việc 8) và 2 Phố Thật (việc 9):
- Trùm phố `st_bao_loc` "Bão Lốc Cuối Mùa": 5 màu theo hành (Thủy, Mộc, Hỏa, Thổ, Kim) × 4 khung = 20 khung
- 18 món phố thật (9 Tăng Bạt Hổ + 9 Phố Cà Phê) × 4 bậc vẽ riêng (t1, t2, t3a, t3b) × 3 khung đánh = 216 khung
- 14 quái phố thật (12 quái + 2 quái con) × 4 khung đi = 56 khung
- 2 biểu tượng giao diện (`icon_street_life`, `icon_badge_giu_tron_pho`) = 2 khung
Tổng: 294 khung nền trong suốt -> `public/assets/streets_atlas.webp` + `.json` (an toàn <= 2048x2048).
"""

from __future__ import annotations

from collections import deque
import json
import pathlib
from PIL import Image, ImageDraw, ImageEnhance

REPO_ROOT = pathlib.Path("/home/antigravity/ltckha/giang-ho-ai")
OUT_DIR = REPO_ROOT / "public" / "assets"
ART_DIR = pathlib.Path(
    "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/e32c673f-fe01-4d9d-9bfe-6f53a784515d"
)
SCRATCH_DIR = ART_DIR / "scratch"
SCRATCH_DIR.mkdir(parents=True, exist_ok=True)

SHEET_BOSS = ART_DIR / "boss_bao_loc_5el_1795421918433.jpg"
SHEET_EN_TBH = ART_DIR / "enemies_tang_bat_ho_1795421928805.jpg"
SHEET_EN_PCP = ART_DIR / "enemies_pho_ca_phe_1795421923846.jpg"
SHEET_TBH_1 = ART_DIR / "towers_tbh_sheet1_1795421983611.jpg"
SHEET_TBH_2 = ART_DIR / "towers_tbh_sheet2_1795421992745.jpg"
SHEET_TBH_3 = ART_DIR / "towers_tbh_sheet3_1795421991273.jpg"
SHEET_PCP_1 = ART_DIR / "towers_pcp_sheet1_1795422052095.jpg"
SHEET_PCP_2 = ART_DIR / "towers_pcp_sheet2_1795422059475.jpg"
SHEET_PCP_3 = ART_DIR / "towers_pcp_sheet3_1795422058524.jpg"


def remove_white_bg_floodfill(
    img: Image.Image,
    white_thresh: int = 236,
    sat_thresh: int = 22,
) -> Image.Image:
    """Tách nền trắng tinh bằng BFS flood-fill từ 4 mép + gọt halo sáng mảnh."""
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
    min_area: int = 70,
    white_thresh: int = 236,
    sat_thresh: int = 20,
    protect_rects: list[tuple[int, int, int, int]] | None = None,
) -> Image.Image:
    """Đục các lỗ nền trắng kín bên trong quai cốc, nan hoa bánh xe, vòm khung (tránh vùng mặt/kem/sữa)."""
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
                if protect_rects:
                    for x0, y0, x1, y1 in protect_rects:
                        if x0 <= cx <= x1 and y0 <= cy <= y1:
                            hits_protected = True
                            break
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
    pre_hook=None,
) -> Image.Image:
    sub = sheet.crop(box).copy()
    if pre_hook is not None:
        pre_hook(sub)
    padded = Image.new("RGB", (sub.width + 16, sub.height + 16), (255, 255, 255))
    padded.paste(sub, (8, 8))
    return remove_white_bg_floodfill(padded, white_thresh=white_thresh, sat_thresh=sat_thresh)


def trim_and_fit(img: Image.Image, box_size: int, pad: int = 5) -> Image.Image:
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


def make_tower_anim_frames(sprite_img: Image.Image, target_size: int = 84) -> list[Image.Image]:
    """3 khung hoạt ảnh đánh: f0 (đứng yên), f1 (nhún lấy đà), f2 (tung đòn sáng)."""
    fitted = trim_and_fit(sprite_img, 168, pad=8)
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


def make_enemy_walk_frames(base_img: Image.Image, target_size: int = 76, bob_px: int = 3) -> list[Image.Image]:
    """4 khung hoạt ảnh đi/bay nhún nhịp đồng nhất 3 tiệm cũ."""
    fitted = trim_and_fit(base_img, target_size, pad=4)
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


def find_grid_boxes(sheet: Image.Image, expected_rows: int = 3, expected_cols: int = 4, thresh: int = 242):
    """Tự động cắt 3x4 (hoặc RxC) ô sạch dựa theo đường rãnh trắng giữa các hình."""
    w, h = sheet.size
    px = sheet.load()
    nonwhite_y = [any(min(px[x, y]) < thresh for x in range(w)) for y in range(h)]
    ybands = []
    st = None
    for i, v in enumerate(nonwhite_y):
        if v and st is None:
            st = i
        elif not v and st is not None:
            if i - st >= 12:
                ybands.append((st, i))
            st = None
    if st is not None and h - st >= 12:
        ybands.append((st, h))
    assert len(ybands) == expected_rows, f"Expected {expected_rows} rows, got {ybands}"

    grid: list[list[tuple[int, int, int, int]]] = []
    for y0, y1 in ybands:
        nonwhite_x = [any(min(px[x, y]) < thresh for y in range(y0, y1)) for x in range(w)]
        xbands = []
        st = None
        for i, v in enumerate(nonwhite_x):
            if v and st is None:
                st = i
            elif not v and st is not None:
                if i - st >= 12:
                    xbands.append((st, i))
                st = None
        if st is not None and w - st >= 12:
            xbands.append((st, w))
        assert len(xbands) == expected_cols, f"Expected {expected_cols} cols in row {(y0, y1)}, got {xbands}"
        row_boxes = [
            (max(0, x0 - 4), max(0, y0 - 4), min(w, x1 + 4), min(h, y1 + 4))
            for x0, x1 in xbands
        ]
        grid.append(row_boxes)
    return grid


def clean_tea_text_on_shelf(sub: Image.Image):
    """Thay chữ 'TEA' nhỏ trên hũ trà ở Kệ Đặc Sản Đầy bằng chiếc lá xanh cùng nét."""
    d = ImageDraw.Draw(sub)
    w, h = sub.size
    # Hũ giữa hàng trên nằm khoảng x=41..59%, y=39..54%
    cx = int(w * 0.502)
    cy = int(h * 0.48)
    rx = int(w * 0.068)
    ry = int(h * 0.042)
    d.rectangle([cx - rx, cy - ry, cx + rx, cy + ry], fill=(238, 240, 212))
    # Vẽ hình lá trà xanh nhỏ thay chữ
    d.ellipse([cx - 7, cy - 5, cx + 7, cy + 5], fill=(92, 166, 74), outline=(43, 26, 18), width=2)
    d.line([cx - 5, cy + 2, cx + 5, cy - 2], fill=(43, 26, 18), width=2)


def add_arch_plaque_for_railing(sub: Image.Image):
    """Thêm tấm bảng gỗ kem sáng dịu trong vòm Lan Can Sắt Sân Thượng để mặt cười nổi bật trên nền tối."""
    w, h = sub.size
    # Vẽ hình chữ nhật bo góc mềm ở phía sau khuôn mặt trước khi tách nền (chỉ tô pixel trắng tinh)
    px = sub.load()
    x0, x1 = int(w * 0.23), int(w * 0.72)
    y0, y1 = int(h * 0.16), int(h * 0.56)
    cx, cy = (x0 + x1) * 0.5, (y0 + y1) * 0.5
    rx, ry = (x1 - x0) * 0.48, (y1 - y0) * 0.48
    for y in range(y0, y1):
        for x in range(x0, x1):
            nx = (x - cx) / max(1, rx)
            ny = (y - cy) / max(1, ry)
            if nx * nx + ny * ny <= 1.0:
                r, g, b = px[x, y]
                if min(r, g, b) >= 240 and (max(r, g, b) - min(r, g, b)) <= 16:
                    # Viền ấm mảnh ngoài rìa tấm biển
                    if nx * nx + ny * ny >= 0.86:
                        px[x, y] = (140, 128, 120)
                    else:
                        px[x, y] = (248, 240, 224)


def save_checkerboard_preview(samples: list[tuple[str, Image.Image]], out_path: pathlib.Path):
    cols = 8
    cell = 112
    rows = (len(samples) + cols - 1) // cols
    pw, ph = cols * cell, rows * cell
    im = Image.new("RGBA", (pw, ph), (220, 220, 220, 255))
    d = ImageDraw.Draw(im)
    sq = 14
    for y in range(0, ph, sq):
        for x in range(0, pw, sq):
            col = (232, 232, 232, 255) if ((x // sq) + (y // sq)) % 2 == 0 else (188, 188, 188, 255)
            d.rectangle([x, y, x + sq, y + sq], fill=col)
    for idx, (label, sim) in enumerate(samples):
        r, c = divmod(idx, cols)
        cx, cy = c * cell, r * cell
        fit = trim_and_fit(sim, cell - 22, pad=2)
        im.alpha_composite(fit, (cx + 11, cy + 3))
        d.rectangle([cx + 1, cy + cell - 16, cx + cell - 1, cy + cell - 1], fill=(43, 26, 18, 220))
        d.text((cx + 4, cy + cell - 14), label[:17], fill=(255, 240, 200, 255))
    im.save(out_path)


def main():
    frames: dict[str, Image.Image] = {}
    preview_items: list[tuple[str, Image.Image]] = []
    tiers = ["t1", "t2", "t3a", "t3b"]

    # 1. Toàn bộ 18 món (9 Tăng Bạt Hổ + 9 Phố Cà Phê) × 4 bậc vẽ riêng
    tower_sheets = [
        (
            SHEET_TBH_1,
            ["gt_tang_bat_ho_banh_qua", "gt_tang_bat_ho_sua_nanh", "gt_tang_bat_ho_banh_can"],
        ),
        (
            SHEET_TBH_2,
            ["gt_tang_bat_ho_goc_cay", "gt_tang_bat_ho_khach_san", "gt_tang_bat_ho_thue_xe"],
        ),
        (
            SHEET_TBH_3,
            ["gt_tang_bat_ho_bar_ham", "gt_tang_bat_ho_cafe_xe_dap", "gt_tang_bat_ho_an_vat"],
        ),
        (
            SHEET_PCP_1,
            ["gt_pho_ca_phe_cafe_som", "gt_pho_ca_phe_o_long", "gt_pho_ca_phe_kem_ly"],
        ),
        (
            SHEET_PCP_2,
            ["gt_pho_ca_phe_banh_mi_chao", "gt_pho_ca_phe_retro", "gt_pho_ca_phe_kem_bo"],
        ),
        (
            SHEET_PCP_3,
            ["gt_pho_ca_phe_cafe_xua", "gt_pho_ca_phe_san_thuong", "gt_pho_ca_phe_banh_trung"],
        ),
    ]

    # Cấu hình đục lỗ nền trắng kín cho các món có nan hoa / quai / rèm / khung vòm
    # value: list of normalized protect_rects (x0, y0, x1, y1) tránh đục vào mắt/mặt/sữa/kem
    hole_punch_map: dict[tuple[str, str], list[tuple[float, float, float, float]]] = {
        ("gt_tang_bat_ho_sua_nanh", "t1"): [(0.10, 0.25, 0.72, 0.85)],  # Ly sữa nóng (quai phải)
        ("gt_tang_bat_ho_sua_nanh", "t2"): [(0.08, 0.10, 0.76, 0.95)],  # Ca sữa đầy (quai phải)
        ("gt_tang_bat_ho_sua_nanh", "t3b"): [(0.10, 0.05, 0.80, 0.95)],  # Bình sữa ủ ấm (quai phải)
        ("gt_tang_bat_ho_khach_san", "t3a"): [(0.35, 0.0, 0.65, 0.35)],  # Rèm cửa nặng
        ("gt_tang_bat_ho_thue_xe", "t3a"): [(0.20, 0.0, 0.50, 0.45)],  # Xe số đời cũ
        ("gt_tang_bat_ho_thue_xe", "t3b"): [(0.10, 0.10, 0.42, 0.48)],  # Xe phượt
        ("gt_tang_bat_ho_cafe_xe_dap", "t1"): [(0.38, 0.38, 0.62, 0.62)],  # Bánh xe đạp thép
        ("gt_tang_bat_ho_cafe_xe_dap", "t2"): [(0.35, 0.35, 0.65, 0.65)],  # Sên xe nặng
        ("gt_tang_bat_ho_cafe_xe_dap", "t3a"): [(0.35, 0.25, 0.60, 0.55)],  # Xe đạp cổ
        ("gt_pho_ca_phe_cafe_som", "t1"): [(0.15, 0.15, 0.72, 0.92)],  # Phin nhôm (quai ly)
        ("gt_pho_ca_phe_cafe_som", "t3a"): [(0.25, 0.20, 0.78, 0.85)],  # Ấm nước sôi (quai phải)
        ("gt_pho_ca_phe_cafe_som", "t3b"): [(0.25, 0.0, 0.75, 0.30), (0.20, 0.65, 0.80, 1.0)],  # Cold drip tower
        ("gt_pho_ca_phe_o_long", "t1"): [(0.10, 0.20, 0.75, 0.90)],  # Ấm ô long (quai phải)
        ("gt_pho_ca_phe_o_long", "t2"): [(0.10, 0.15, 0.75, 0.92)],  # Bình ủ lạnh (quai phải)
        ("gt_pho_ca_phe_cafe_xua", "t1"): [(0.15, 0.20, 0.75, 0.90)],  # Ấm sành (quai phải)
        ("gt_pho_ca_phe_san_thuong", "t3a"): [(0.20, 0.14, 0.75, 0.58)],  # Lan can sắt
        ("gt_pho_ca_phe_san_thuong", "t3b"): [(0.30, 0.35, 0.70, 0.75)],  # Chuông đồng trong vòm
    }

    for sheet_path, row_ids in tower_sheets:
        sh = Image.open(sheet_path).convert("RGB")
        grid = find_grid_boxes(sh, 3, 4)
        for r_idx, tid in enumerate(row_ids):
            for c_idx, tk in enumerate(tiers):
                box = grid[r_idx][c_idx]
                hook = None
                if (tid, tk) == ("gt_tang_bat_ho_an_vat", "t3a"):
                    hook = clean_tea_text_on_shelf
                elif (tid, tk) == ("gt_pho_ca_phe_san_thuong", "t3a"):
                    hook = add_arch_plaque_for_railing
                # Bảo vệ đồ màu trắng sáng (ly sữa, kem dừa, hơi nước) bằng white_thresh cao hơn
                wt = 244 if tid in ("gt_tang_bat_ho_sua_nanh", "gt_pho_ca_phe_kem_ly", "gt_tang_bat_ho_bar_ham") else 236
                st = 14 if wt == 244 else 22
                clean = crop_clean_sprite(sh, box, white_thresh=wt, sat_thresh=st, pre_hook=hook)
                if (tid, tk) == ("gt_tang_bat_ho_thue_xe", "t2"):
                    # Làm mờ mềm dần mép phải chùm sáng đèn pha để không có cạnh cắt thẳng
                    cw, ch = clean.size
                    cpx = clean.load()
                    fade_start = int(cw * 0.68)
                    for y in range(ch):
                        for x in range(fade_start, cw):
                            r, g, b, a = cpx[x, y]
                            if a > 0:
                                k = max(0.0, 1.0 - (x - fade_start) / max(1, cw - fade_start - 8))
                                cpx[x, y] = (r, g, b, int(a * k))
                if (tid, tk) in hole_punch_map:
                    cw, ch = clean.size
                    prs = [
                        (int(cw * a), int(ch * b), int(cw * c), int(ch * d))
                        for (a, b, c, d) in hole_punch_map[(tid, tk)]
                    ]
                    clean = punch_interior_white_holes(clean, min_area=42, white_thresh=232, sat_thresh=24, protect_rects=prs)
                anim = make_tower_anim_frames(clean, target_size=84)
                for f_idx, fimg in enumerate(anim):
                    frames[f"tower_{tid}_{tk}_f{f_idx}"] = fimg
                short_name = tid.replace("gt_tang_bat_ho_", "t_").replace("gt_pho_ca_phe_", "p_") + "_" + tk
                preview_items.append((short_name, anim[0]))

    # 2. Quái Phố Tăng Bạt Hổ (7 con) + icon_street_life
    sh_etbh = Image.open(SHEET_EN_TBH).convert("RGB")
    tbh_enemy_specs = [
        # Row 1: y in 52..368 (nghiêm ngặt phía trên chữ ở y=374)
        ("ge_tang_bat_ho_1", (44, 52, 300, 368), 72, 4, 236, 22),
        ("ge_tang_bat_ho_2", (338, 52, 702, 368), 82, 2, 236, 22),
        ("ge_tang_bat_ho_3", (736, 52, 1008, 368), 76, 4, 236, 22),
        ("ge_tang_bat_ho_4", (1054, 52, 1352, 368), 80, 3, 236, 22),
        # Row 2: nghiêm ngặt phía trên chữ dưới
        ("ge_tang_bat_ho_4_nho", (46, 456, 308, 676), 58, 4, 236, 22),
        ("ge_tang_bat_ho_5", (352, 452, 696, 706), 78, 3, 238, 18),
        ("ge_tang_bat_ho_6", (704, 424, 1024, 718), 78, 3, 236, 22),
    ]
    for eid, box, esize, ebob, wt, st in tbh_enemy_specs:
        clean = crop_clean_sprite(sh_etbh, box, white_thresh=wt, sat_thresh=st)
        walk = make_enemy_walk_frames(clean, target_size=esize, bob_px=ebob)
        for f_idx, fimg in enumerate(walk):
            frames[f"enemy_{eid}_f{f_idx}"] = fimg
        preview_items.append((eid.replace("ge_tang_bat_ho_", "et_"), walk[0]))

    # Biểu tượng đèn phố Đà Lạt cho HUD mạng Trùm phố & Phố thật
    lantern_clean = crop_clean_sprite(sh_etbh, (1080, 432, 1320, 705), white_thresh=236, sat_thresh=22)
    frames["icon_street_life"] = trim_and_fit(lantern_clean, 64, pad=2)
    preview_items.append(("icon_street_life", frames["icon_street_life"]))

    # 3. Quái Phố Cà Phê (7 con) + icon_badge_giu_tron_pho
    sh_epcp = Image.open(SHEET_EN_PCP).convert("RGB")
    pcp_grid = find_grid_boxes(sh_epcp, 2, 4)
    pcp_enemy_specs = [
        ("ge_pho_ca_phe_1", pcp_grid[0][0], 72, 4, 242, 16),
        ("ge_pho_ca_phe_2", pcp_grid[0][1], 82, 2, 236, 22),
        ("ge_pho_ca_phe_3", pcp_grid[0][2], 78, 4, 236, 22),
        ("ge_pho_ca_phe_4", pcp_grid[0][3], 80, 3, 245, 14),
        ("ge_pho_ca_phe_4_nho", pcp_grid[1][0], 58, 4, 236, 22),
        ("ge_pho_ca_phe_5", pcp_grid[1][1], 78, 3, 242, 16),
        ("ge_pho_ca_phe_6", pcp_grid[1][2], 78, 3, 236, 22),
    ]
    for eid, box, esize, ebob, wt, st in pcp_enemy_specs:
        clean = crop_clean_sprite(sh_epcp, box, white_thresh=wt, sat_thresh=st)
        walk = make_enemy_walk_frames(clean, target_size=esize, bob_px=ebob)
        for f_idx, fimg in enumerate(walk):
            frames[f"enemy_{eid}_f{f_idx}"] = fimg
        preview_items.append((eid.replace("ge_pho_ca_phe_", "ep_"), walk[0]))

    # Huy hiệu vàng "Giữ trọn phố"
    medal_clean = crop_clean_sprite(sh_epcp, pcp_grid[1][3], white_thresh=236, sat_thresh=22)
    frames["icon_badge_giu_tron_pho"] = trim_and_fit(medal_clean, 72, pad=2)
    preview_items.append(("badge_giu_tron", frames["icon_badge_giu_tron_pho"]))

    # 4. Trùm Phố `st_bao_loc` "Bão Lốc Cuối Mùa" — 5 màu theo hành (Thủy, Mộc, Hỏa, Thổ, Kim)
    sh_boss = Image.open(SHEET_BOSS).convert("RGB")
    boss_specs = [
        ("st_bao_loc", (26, 22, 412, 422), 236, 22),       # Thủy (mặc định)
        ("st_bao_loc_moc", (442, 22, 828, 422), 236, 22),  # Mộc
        ("st_bao_loc_hoa", (860, 22, 1246, 422), 236, 22), # Hỏa
        ("st_bao_loc_tho", (214, 424, 616, 826), 236, 22), # Thổ
        ("st_bao_loc_kim", (652, 424, 1046, 826), 244, 14),# Kim (bạc sáng)
    ]
    for bid, box, wt, st in boss_specs:
        clean = crop_clean_sprite(sh_boss, box, white_thresh=wt, sat_thresh=st)
        walk = make_enemy_walk_frames(clean, target_size=112, bob_px=4)
        for f_idx, fimg in enumerate(walk):
            frames[f"enemy_{bid}_f{f_idx}"] = fimg
        preview_items.append((bid.replace("st_bao_loc", "boss"), walk[0]))

    # 5. Đóng gói shelf-packing vào public/assets/streets_atlas.webp + .json (<= 2048x2048!)
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

    atlas_webp = OUT_DIR / "streets_atlas.webp"
    atlas_json = OUT_DIR / "streets_atlas.json"
    atlas_im.save(atlas_webp, format="WEBP", quality=74, method=6)
    atlas_json.write_text(
        json.dumps(
            {
                "frames": json_frames,
                "meta": {
                    "app": "gon-tiem-sach-pho-streets-atlas",
                    "version": "1.0",
                    "image": "streets_atlas.webp",
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

    preview_out = SCRATCH_DIR / "streets_atlas_preview.png"
    save_checkerboard_preview(preview_items, preview_out)
    print(
        f"Packed {len(frames)} frames into streets_atlas.webp ({ATLAS_W}x{atlas_h}), "
        f"webp={atlas_webp.stat().st_size / 1024:.1f} KB, json={atlas_json.stat().st_size / 1024:.1f} KB"
    )
    print(f"Preview saved to: {preview_out}")


if __name__ == "__main__":
    main()
