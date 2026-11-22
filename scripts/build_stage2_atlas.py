#!/usr/bin/env python3
"""
Đóng gói toàn bộ Sprite Màn 2 "Tiệm Bánh Đầu Phố" cùng 104 khung Màn 1 vào Texture Atlas chung:
- Giữ nguyên 100% 104 khung Màn 1 (lấy từ bản sao gốc trước khi gộp để không nén lại nhiều lần).
- Tách nền trong suốt sạch (BFS flood-fill + gọt halo + đục thoáng khe lồng quạt) cho:
  + 5 món Tiệm Bánh x 4 bậc (t1, t2, t3a, t3b) x 3 khung hoạt ảnh bắn = 60 khung hình.
  + 6 quái mới (Hơi Ẩm, Bụi Bột, Ruồi, Mốc Bánh, Than Hồng, Than Vụn) x 4 khung đi = 24 khung hình.
    (Chuột disrupt_water dùng lại hình Màn 1 đã có trong atlas.)
  + Biểu tượng ổ bánh mì (`icon_bread_life`) & kệ bánh gỗ (`prop_bakery_shelf`).
- Nén ra `public/assets/gon_tiem_atlas.webp` + `public/assets/gon_tiem_atlas.json`, giữ tổng `dist/` <= 5 MB.
- Xuất ảnh kiểm tra nền trong suốt trên nền caro vào scratch/verify_stage2_atlas_preview.png.
"""

from collections import deque
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance

REPO_ROOT = Path(__file__).resolve().parent.parent
ARTIFACT_DIR = Path(
    "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/19304d60-5004-4ace-9bc7-888771f25415"
)
SCRATCH_DIR = ARTIFACT_DIR / "scratch"
BACKUP_DIR = SCRATCH_DIR / "stage1_atlas_backup"
OUT_DIR = REPO_ROOT / "public" / "assets"

INK = (43, 26, 18, 255)

TOWERS_SHEET = ARTIFACT_DIR / "stage2_bakery_towers_sheet_1795375948278.jpg"
T3_SHEET = ARTIFACT_DIR / "stage2_bakery_t3_sheet_1795376018733.jpg"
ENEMIES_SHEET = ARTIFACT_DIR / "stage2_bakery_enemies_sheet_1795375981579.jpg"
SHELF_CLEAN = SCRATCH_DIR / "prop_bakery_shelf_clean.png"


def remove_white_bg_floodfill(im: Image.Image, white_thresh: int = 235, sat_thresh: int = 24) -> Image.Image:
    """Tách nền trắng bằng BFS flood-fill từ 4 biên + gọt halo sáng sát mép ngoài."""
    rgba = im.convert("RGBA")
    w, h = rgba.size
    pix = rgba.load()

    def is_bg(r: int, g: int, b: int) -> bool:
        return min(r, g, b) >= white_thresh and (max(r, g, b) - min(r, g, b)) <= sat_thresh

    visited = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            r, g, b, _ = pix[x, y]
            if is_bg(r, g, b):
                idx = y * w + x
                if not visited[idx]:
                    visited[idx] = 1
                    q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            r, g, b, _ = pix[x, y]
            if is_bg(r, g, b):
                idx = y * w + x
                if not visited[idx]:
                    visited[idx] = 1
                    q.append((x, y))

    while q:
        cx, cy = q.popleft()
        pix[cx, cy] = (0, 0, 0, 0)
        for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
            if 0 <= nx < w and 0 <= ny < h:
                idx = ny * w + nx
                if not visited[idx]:
                    r, g, b, _ = pix[nx, ny]
                    if is_bg(r, g, b):
                        visited[idx] = 1
                        q.append((nx, ny))

    # Gọt nhẹ 1 vòng bán trong suốt trên pixel quá sáng sát mép trong suốt
    soften = []
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            r, g, b, a = pix[x, y]
            if a == 0:
                continue
            if (
                pix[x - 1, y][3] == 0
                or pix[x + 1, y][3] == 0
                or pix[x, y - 1][3] == 0
                or pix[x, y + 1][3] == 0
            ):
                lum = (r + g + b) // 3
                if lum > 206 and (max(r, g, b) - min(r, g, b)) < 36:
                    soften.append((x, y, 0))
                elif lum > 168 and (max(r, g, b) - min(r, g, b)) < 42:
                    soften.append((x, y, int(a * 0.35)))
    for x, y, na in soften:
        r, g, b, _ = pix[x, y]
        pix[x, y] = (r, g, b, na)

    return rgba


def punch_interior_white_holes(
    rgba: Image.Image,
    min_area: int = 80,
    white_thresh: int = 236,
    sat_thresh: int = 22,
    protect_rect: tuple[int, int, int, int] | None = None,
) -> Image.Image:
    """Đục sạch các mảng trắng khép kín lớn (vd khe hở trong lồng quạt điện), bảo vệ vùng mắt."""
    im = rgba.copy()
    w, h = im.size
    pix = im.load()
    visited = bytearray(w * h)

    def is_white(r: int, g: int, b: int, a: int) -> bool:
        return a > 0 and min(r, g, b) >= white_thresh and (max(r, g, b) - min(r, g, b)) <= sat_thresh

    for y in range(h):
        for x in range(w):
            idx = y * w + x
            if visited[idx]:
                continue
            r, g, b, a = pix[x, y]
            if not is_white(r, g, b, a):
                continue
            # BFS vùng trắng khép kín
            comp = []
            q = deque([(x, y)])
            visited[idx] = 1
            hits_protected = False
            while q:
                cx, cy = q.popleft()
                comp.append((cx, cy))
                if protect_rect is not None:
                    px0, py0, px1, py1 = protect_rect
                    if px0 <= cx <= px1 and py0 <= cy <= py1:
                        hits_protected = True
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        nidx = ny * w + nx
                        if not visited[nidx]:
                            nr, ng, nb, na = pix[nx, ny]
                            if is_white(nr, ng, nb, na):
                                visited[nidx] = 1
                                q.append((nx, ny))
            if len(comp) >= min_area and not hits_protected:
                for cx, cy in comp:
                    pix[cx, cy] = (0, 0, 0, 0)

    return im


def trim_and_fit(im: Image.Image, box_size: int, pad: int = 8) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return Image.new("RGBA", (box_size, box_size), (0, 0, 0, 0))
    cropped = im.crop(bbox)
    cw, ch = cropped.size
    avail = max(1, box_size - pad * 2)
    scale = min(avail / cw, avail / ch)
    nw = max(1, int(round(cw * scale)))
    nh = max(1, int(round(ch * scale)))
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (box_size, box_size), (0, 0, 0, 0))
    canvas.paste(resized, ((box_size - nw) // 2, (box_size - nh) // 2), resized)
    return canvas


def crop_clean_sprite(
    sheet: Image.Image,
    box: tuple[int, int, int, int],
    white_thresh: int = 235,
    sat_thresh: int = 24,
) -> Image.Image:
    sub = sheet.crop(box)
    # Thêm viền trắng 6px quanh 4 cạnh trước khi flood-fill để đảm bảo tách liền mạch
    padded = Image.new("RGB", (sub.width + 12, sub.height + 12), (255, 255, 255))
    padded.paste(sub, (6, 6))
    return remove_white_bg_floodfill(padded, white_thresh=white_thresh, sat_thresh=sat_thresh)


def draw_icon_bread_life(size: int = 64) -> Image.Image:
    """Ổ bánh mì Việt Nam vàng giòn lấp lánh làm biểu tượng mạng thành Màn 2 trên HUD."""
    s = 256
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    # Thân ổ bánh mì nghiêng ấm áp
    body = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    bd = ImageDraw.Draw(body)
    bd.ellipse([24, 72, 232, 186], fill=(238, 162, 58, 255), outline=INK, width=14)
    # Phần vỏ bánh sáng bên trên
    bd.ellipse([42, 82, 214, 148], fill=(255, 206, 102, 255))
    # 3 đường rạch vỏ bánh mì giòn rụm
    for sx in (78, 124, 170):
        bd.line([(sx - 12, 134), (sx + 16, 98)], fill=INK, width=10)
        bd.line([(sx - 8, 132), (sx + 14, 104)], fill=(255, 240, 194, 255), width=5)
    body = body.rotate(24, resample=Image.Resampling.BICUBIC, expand=False)
    im.alpha_composite(body)

    # Ngôi sao vàng thơm giòn lấp lánh góc trên phải
    d.polygon(
        [(198, 42), (206, 64), (228, 72), (206, 80), (198, 102), (190, 80), (168, 72), (190, 64)],
        fill=(255, 230, 102, 255),
        outline=INK,
    )
    return trim_and_fit(im, size, pad=3)


def make_bakery_tower_tier_variant(
    base: Image.Image,
    t3_special: Image.Image,
    tower_id: str,
    tier: str,
) -> Image.Image:
    """
    Tạo khác biệt nhìn thấy rõ ở cỡ nhỏ điện thoại cho 4 bậc (t1, t2, t3a, t3b) của 5 món Tiệm Bánh.
    """
    sz = 192
    canvas = Image.new("RGBA", (sz, sz), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)

    if tier == "t1":
        sp = trim_and_fit(base, sz, pad=18)
        canvas.alpha_composite(sp)
        return canvas

    if tier == "t2":
        # Bậc 2: sáng sắc nét hơn + vòng đệm vàng ấm + chi tiết nâng cấp đặc trưng từng món
        d.ellipse([20, 134, 172, 178], fill=(246, 204, 88, 115), outline=(196, 138, 34, 225), width=4)
        if tower_id == "bk_swatter":
            # Vỉ Lưới Cán Dài: cán vươn dài sáng thép + viền khung ánh bạc
            sp = trim_and_fit(base, sz, pad=10)
            sp = ImageEnhance.Contrast(sp).enhance(1.1)
            canvas.alpha_composite(sp)
            # Đai thép vàng-bạc ở cổ cán & ánh lấp lánh bên mép khung lưới (không che mắt)
            d.rounded_rectangle([83, 98, 109, 112], radius=4, fill=(246, 204, 82, 255), outline=INK, width=4)
            for sx, sy in [(42, 34), (150, 42)]:
                d.polygon([(sx, sy - 11), (sx + 4, sy - 4), (sx + 11, sy), (sx + 4, sy + 4), (sx, sy + 11), (sx - 4, sy + 4), (sx - 11, sy), (sx - 4, sy - 4)], fill=(242, 250, 255, 255), outline=INK)
        elif tower_id == "bk_jar":
            # Hũ Sành Nắp Nặng: nắp đồng vàng nổi bật & đai gốm gia cường
            sp = trim_and_fit(base, sz, pad=13)
            sp = ImageEnhance.Color(sp).enhance(1.14)
            canvas.alpha_composite(sp)
            d.arc([44, 42, 148, 86], start=190, end=350, fill=(246, 196, 76, 255), width=9)
            d.arc([40, 118, 152, 166], start=15, end=165, fill=(238, 186, 68, 255), width=7)
        elif tower_id == "bk_fan":
            # Quạt Đứng Hai Tốc: nâng cao chân đế + vệt gió xanh sáng hai bên
            sp = trim_and_fit(base, 174, pad=6)
            sp = ImageEnhance.Color(sp).enhance(1.18)
            d.rounded_rectangle([62, 152, 130, 172], radius=8, fill=(72, 158, 92, 255), outline=INK, width=5)
            canvas.alpha_composite(sp, (9, 2))
            d.arc([10, 34, 62, 112], start=110, end=240, fill=(138, 245, 162, 235), width=7)
            d.arc([130, 34, 182, 112], start=300, end=70, fill=(138, 245, 162, 235), width=7)
        elif tower_id == "bk_oven":
            # Lò Nướng Hai Tầng: ghép thêm tầng lò lửa thứ 2 ở trên rõ rệt!
            bot = trim_and_fit(base, 152, pad=4)
            top = trim_and_fit(base, 126, pad=4)
            top = ImageEnhance.Brightness(top).enhance(1.06)
            canvas.alpha_composite(bot, (20, 44))
            canvas.alpha_composite(top, (33, 6))
        else:
            # Tủ Mát Hai Cánh: tủ rộng hơn + khung 2 cánh kính nổi bật + hơi lạnh sáng
            wide = trim_and_fit(base, 176, pad=6)
            wide = wide.resize((180, 156), Image.Resampling.LANCZOS)
            wide = ImageEnhance.Color(wide).enhance(1.15)
            canvas.alpha_composite(wide, (6, 16))
            d.line([(96, 36), (96, 126)], fill=INK, width=6)
            d.line([(87, 74), (87, 94)], fill=(238, 248, 255, 255), width=4)
            d.line([(105, 74), (105, 94)], fill=(238, 248, 255, 255), width=4)
        return canvas

    if tier == "t3a":
        if tower_id == "bk_swatter":
            # Vỉ Đập Đôi: HAI chiếc vỉ sắt bắt chéo chữ V cực đã mắt!
            d.ellipse([16, 130, 176, 182], fill=(203, 213, 225, 130), outline=(100, 116, 139, 240), width=5)
            s = trim_and_fit(base, 146, pad=4)
            left_s = s.rotate(24, resample=Image.Resampling.BICUBIC, expand=True)
            right_s = s.transpose(Image.Transpose.FLIP_LEFT_RIGHT).rotate(-24, resample=Image.Resampling.BICUBIC, expand=True)
            canvas.alpha_composite(left_s, (-14, 4))
            canvas.alpha_composite(right_s, (34, 4))
            return canvas
        elif tower_id == "bk_jar":
            # Chum Sành Lớn: hình vẽ riêng Chum Sành uy nghi viền hoa văn vàng!
            d.ellipse([14, 128, 178, 182], fill=(212, 163, 89, 135), outline=(146, 98, 38, 240), width=5)
            sp = trim_and_fit(t3_special, sz, pad=10)
            canvas.alpha_composite(sp)
            return canvas
        elif tower_id == "bk_fan":
            # Quạt Trần Ba Cánh: vòng gió lốc xanh ngọc xoáy quanh thân quạt rực rỡ
            d.ellipse([12, 16, 180, 180], fill=(89, 193, 115, 70), outline=(46, 152, 74, 235), width=6)
            d.arc([20, 24, 172, 172], start=20, end=155, fill=(162, 255, 184, 240), width=8)
            d.arc([20, 24, 172, 172], start=200, end=335, fill=(162, 255, 184, 240), width=8)
            sp = trim_and_fit(base, 168, pad=6)
            sp = ImageEnhance.Color(sp).enhance(1.26)
            canvas.alpha_composite(sp, (12, 12))
            return canvas
        elif tower_id == "bk_oven":
            # Lò Đối Lưu: vòng khí nóng xoáy tròn đỏ-vàng rực rỡ & đốm lửa quanh lò
            d.ellipse([14, 128, 178, 182], fill=(255, 107, 74, 130), outline=(204, 62, 28, 240), width=5)
            d.arc([10, 12, 182, 176], start=195, end=345, fill=(255, 164, 52, 235), width=9)
            sp = trim_and_fit(base, 166, pad=6)
            sp = ImageEnhance.Color(sp).enhance(1.22)
            canvas.alpha_composite(sp, (13, 16))
            # Cánh quạt đối lưu rực sáng trong cửa kính lò
            cx, cy = 88, 118
            d.ellipse([cx - 22, cy - 22, cx + 22, cy + 22], outline=(255, 236, 132, 235), width=5)
            for a in (0, 120, 240):
                rad = math.radians(a)
                d.line([(cx, cy), (cx + math.cos(rad) * 18, cy + math.sin(rad) * 18)], fill=(255, 244, 176, 245), width=6)
            for ex, ey in [(26, 48), (166, 44), (164, 130)]:
                d.ellipse([ex - 8, ey - 8, ex + 8, ey + 8], fill=(255, 206, 74, 255), outline=INK, width=3)
            return canvas
        else:
            # Tủ Mát Giữ Tươi: hào quang lam bảo hộ chống chuột + ngôi sao vàng thưởng xu!
            d.ellipse([14, 18, 178, 178], fill=(56, 189, 248, 72), outline=(125, 228, 255, 235), width=7)
            sp = trim_and_fit(base, 164, pad=6)
            sp = ImageEnhance.Brightness(sp).enhance(1.06)
            canvas.alpha_composite(sp, (14, 16))
            for sx, sy in [(32, 40), (160, 40), (162, 138)]:
                d.polygon([(sx, sy - 14), (sx + 5, sy - 5), (sx + 14, sy), (sx + 5, sy + 5), (sx, sy + 14), (sx - 5, sy + 5), (sx - 14, sy), (sx - 5, sy - 5)], fill=(255, 232, 112, 255), outline=INK)
            return canvas

    # tier == "t3b"
    if tower_id == "bk_swatter":
        # Vợt Điện Diệt Ruồi: hình vẽ riêng vợt điện có tia lửa xanh!
        d.ellipse([14, 128, 178, 182], fill=(56, 189, 248, 120), outline=(14, 165, 233, 240), width=5)
        sp = trim_and_fit(t3_special, sz, pad=8)
        canvas.alpha_composite(sp)
        return canvas
    elif tower_id == "bk_jar":
        # Hũ Lăn Dọc Quầy: nghiêng lăn vèo với vòng bụi nâu vàng & vệt tốc độ!
        d.ellipse([12, 128, 180, 182], fill=(212, 163, 89, 130), outline=(138, 86, 32, 235), width=5)
        sp = trim_and_fit(base, 160, pad=6)
        sp = ImageEnhance.Color(sp).enhance(1.22)
        rolled = sp.rotate(-26, resample=Image.Resampling.BICUBIC, expand=True)
        canvas.alpha_composite(rolled, ((sz - rolled.width) // 2 + 8, (sz - rolled.height) // 2 + 2))
        # 3 vệt gió lăn tốc độ phía sau hũ
        for ly, lx2 in [(58, 54), (92, 42), (124, 52)]:
            d.line([(12, ly), (lx2, ly)], fill=(255, 224, 130, 240), width=7)
            d.line([(12, ly), (lx2, ly)], fill=INK, width=2)
        return canvas
    elif tower_id == "bk_fan":
        # Quạt Hộp Thổi Lùi: hình vẽ riêng quạt hộp vuông thổi gió!
        d.ellipse([14, 128, 178, 182], fill=(89, 193, 115, 125), outline=(42, 132, 66, 240), width=5)
        sp = trim_and_fit(t3_special, sz, pad=10)
        canvas.alpha_composite(sp)
        return canvas
    elif tower_id == "bk_oven":
        # Lò Bánh Mì Củi: hình vẽ riêng lò gạch vòm củi rực lửa!
        d.ellipse([14, 130, 178, 182], fill=(255, 118, 64, 135), outline=(196, 58, 24, 240), width=5)
        sp = trim_and_fit(t3_special, sz, pad=8)
        canvas.alpha_composite(sp)
        return canvas
    else:
        # Tủ Đông Gió Lạnh: hình vẽ riêng tủ đông hai cánh phủ băng tuyết!
        d.ellipse([14, 130, 178, 182], fill=(56, 189, 248, 135), outline=(14, 132, 206, 240), width=5)
        sp = trim_and_fit(t3_special, sz, pad=8)
        canvas.alpha_composite(sp)
        return canvas


def make_tower_anim_frames(tier_img: Image.Image, target_size: int = 92) -> list[Image.Image]:
    """3 khung hoạt ảnh bắn đồng nhất Màn 1: f0 (đứng yên), f1 (lấy đà), f2 (tung đòn bật sáng)."""
    frames = []
    f0 = tier_img.resize((target_size, target_size), Image.Resampling.LANCZOS)
    frames.append(f0)

    c1 = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    sq = tier_img.resize((int(target_size * 1.06), int(target_size * 0.90)), Image.Resampling.LANCZOS)
    sq = sq.rotate(5, resample=Image.Resampling.BICUBIC, expand=True)
    c1.alpha_composite(sq, ((target_size - sq.width) // 2, target_size - sq.height + 2))
    frames.append(c1)

    c2 = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    st = tier_img.resize((int(target_size * 0.93), int(target_size * 1.06)), Image.Resampling.LANCZOS)
    st = ImageEnhance.Brightness(st).enhance(1.14)
    st = st.rotate(-6, resample=Image.Resampling.BICUBIC, expand=True)
    c2.alpha_composite(st, ((target_size - st.width) // 2, max(0, (target_size - st.height) // 2 - 4)))
    frames.append(c2)
    return frames


def make_enemy_walk_frames(base_img: Image.Image, target_size: int = 80, bob_px: int = 4) -> list[Image.Image]:
    """4 khung hoạt ảnh đi / bay nhún nhịp đồng nhất Màn 1."""
    fitted = trim_and_fit(base_img, target_size, pad=6)
    specs = [
        (1.0, 1.0, 0, 0),
        (1.06, 0.93, -5, bob_px),
        (0.96, 1.05, 0, -bob_px),
        (1.05, 0.94, 5, bob_px),
    ]
    frames = []
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


def unpack_stage1_frames() -> dict[str, Image.Image]:
    atlas = Image.open(BACKUP_DIR / "gon_tiem_atlas.webp").convert("RGBA")
    data = json.loads((BACKUP_DIR / "gon_tiem_atlas.json").read_text(encoding="utf-8"))
    out: dict[str, Image.Image] = {}
    for name, meta in data["frames"].items():
        f = meta["frame"]
        out[name] = atlas.crop((f["x"], f["y"], f["x"] + f["w"], f["y"] + f["h"]))
    return out


def main():
    # 1. Nạp lại toàn bộ 104 khung Màn 1 nguyên vẹn
    frames = unpack_stage1_frames()
    stage1_count = len(frames)

    # 2. Cắt & tách nền trong suốt 5 món Tiệm Bánh gốc + 5 bản nâng cấp Bậc 3 đặc biệt
    sh_base = Image.open(TOWERS_SHEET).convert("RGB")
    sh_t3 = Image.open(T3_SHEET).convert("RGB")
    sh_en = Image.open(ENEMIES_SHEET).convert("RGB")

    base_towers = {
        "bk_swatter": crop_clean_sprite(sh_base, (90, 10, 360, 465), white_thresh=236, sat_thresh=22),
        "bk_jar": crop_clean_sprite(sh_base, (420, 10, 780, 465), white_thresh=234, sat_thresh=24),
        "bk_fan": crop_clean_sprite(sh_base, (800, 10, 1170, 465), white_thresh=234, sat_thresh=24),
        "bk_oven": crop_clean_sprite(sh_base, (120, 480, 610, 886), white_thresh=234, sat_thresh=24),
        "bk_fridge": crop_clean_sprite(sh_base, (640, 480, 1090, 886), white_thresh=234, sat_thresh=24),
    }
    # Đục thoáng các khe hở trắng bên trong lồng quạt điện (bảo vệ vùng tâm mắt)
    fan = base_towers["bk_fan"]
    fw, fh = fan.size
    base_towers["bk_fan"] = punch_interior_white_holes(
        fan,
        min_area=70,
        white_thresh=232,
        sat_thresh=26,
        protect_rect=(int(fw * 0.34), int(fh * 0.30), int(fw * 0.62), int(fh * 0.56)),
    )

    t3_specials = {
        "bk_swatter": crop_clean_sprite(sh_t3, (20, 10, 415, 445), white_thresh=236, sat_thresh=20),
        "bk_jar": crop_clean_sprite(sh_t3, (415, 10, 790, 445), white_thresh=234, sat_thresh=24),
        "bk_fan": crop_clean_sprite(sh_t3, (790, 10, 1190, 445), white_thresh=234, sat_thresh=22),
        "bk_oven": crop_clean_sprite(sh_t3, (50, 435, 550, 892), white_thresh=234, sat_thresh=24),
        "bk_fridge": crop_clean_sprite(sh_t3, (620, 435, 1185, 892), white_thresh=236, sat_thresh=20),
    }

    stage2_frames_preview: dict[str, Image.Image] = {}

    for tid in ("bk_swatter", "bk_jar", "bk_fan", "bk_oven", "bk_fridge"):
        for tier in ("t1", "t2", "t3a", "t3b"):
            variant = make_bakery_tower_tier_variant(base_towers[tid], t3_specials[tid], tid, tier)
            anim_frames = make_tower_anim_frames(variant, target_size=92)
            for idx, fimg in enumerate(anim_frames):
                fname = f"tower_{tid}_{tier}_f{idx}"
                frames[fname] = fimg
                stage2_frames_preview[fname] = fimg

    # 3. Cắt & tách nền trong suốt 6 quái Tiệm Bánh (cắt trên dòng chữ chú thích 100%)
    enemy_crops = {
        "bk_humid": ((10, 40, 385, 360), 74, 4, 236, 18),
        "bk_flour": ((400, 20, 795, 386), 88, 3, 238, 16),
        "bk_fly": ((810, 30, 1190, 362), 78, 5, 235, 20),
        "bk_mold": ((10, 455, 390, 802), 82, 3, 236, 18),
        "bk_ember": ((405, 455, 795, 802), 82, 3, 234, 22),
        "bk_ember_mini": ((815, 500, 1185, 800), 58, 4, 234, 22),
    }
    for eid, (box, esize, ebob, wt, st) in enemy_crops.items():
        clean = crop_clean_sprite(sh_en, box, white_thresh=wt, sat_thresh=st)
        walk_frames = make_enemy_walk_frames(clean, target_size=esize, bob_px=ebob)
        for idx, fimg in enumerate(walk_frames):
            fname = f"enemy_{eid}_f{idx}"
            frames[fname] = fimg
            stage2_frames_preview[fname] = fimg

    # 4. Biểu tượng ổ bánh mì & kệ bánh gỗ
    frames["icon_bread_life"] = draw_icon_bread_life(64)
    stage2_frames_preview["icon_bread_life"] = frames["icon_bread_life"]

    if SHELF_CLEAN.exists():
        shelf_im = Image.open(SHELF_CLEAN).convert("RGBA")
        frames["prop_bakery_shelf"] = trim_and_fit(shelf_im, 136, pad=4)
        stage2_frames_preview["prop_bakery_shelf"] = frames["prop_bakery_shelf"]

    # 5. Đóng gói shelf-packing gọn vào Atlas chung (chiều rộng 1024)
    ATLAS_W = 1024
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
    atlas_img = Image.new("RGBA", (ATLAS_W, atlas_h), (0, 0, 0, 0))
    json_frames = {}
    for name, x, y, fw, fh, fim in placements:
        atlas_img.paste(fim, (x, y), fim)
        json_frames[name] = {
            "frame": {"x": x, "y": y, "w": fw, "h": fh},
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": fw, "h": fh},
            "sourceSize": {"w": fw, "h": fh},
        }

    atlas_webp = OUT_DIR / "gon_tiem_atlas.webp"
    atlas_json = OUT_DIR / "gon_tiem_atlas.json"
    atlas_img.save(atlas_webp, format="WEBP", quality=85, method=6)
    with open(atlas_json, "w", encoding="utf-8") as f:
        json.dump(
            {
                "frames": json_frames,
                "meta": {
                    "app": "Gọn Tiệm, Sạch Phố Atlas Builder (Màn 1 + Màn 2)",
                    "version": "2.0",
                    "image": "gon_tiem_atlas.webp",
                    "format": "RGBA8888",
                    "size": {"w": ATLAS_W, "h": atlas_h},
                    "scale": "1",
                },
            },
            f,
            ensure_ascii=False,
            separators=(",", ":"),
        )

    print(
        f"Saved combined atlas: {atlas_webp} ({ATLAS_W}x{atlas_h}, {stage1_count} Màn 1 + {len(frames) - stage1_count} Màn 2 = {len(frames)} frames, {atlas_webp.stat().st_size / 1024:.1f} KB)"
    )
    print(f"Saved atlas JSON: {atlas_json} ({atlas_json.stat().st_size / 1024:.1f} KB)")

    # 6. Lưu ảnh kiểm tra độ trong suốt RIÊNG bộ Màn 2 trên nền caro xám-trắng
    p_items = sorted(stage2_frames_preview.items(), key=lambda kv: kv[0])
    PW = 1024
    p_placements = []
    px, py, prh = 6, 6, 0
    for name, fim in p_items:
        fw, fh = fim.size
        if px + fw + 6 > PW:
            px = 6
            py += prh + 6
            prh = 0
        p_placements.append((name, px, py, fim))
        px += fw + 6
        prh = max(prh, fh)
    PH = py + prh + 8
    checker = Image.new("RGBA", (PW, PH), (218, 218, 218, 255))
    cd = ImageDraw.Draw(checker)
    tile = 20
    for yy in range(0, PH, tile):
        for xx in range(0, PW, tile):
            if ((xx // tile) + (yy // tile)) % 2 == 1:
                cd.rectangle([xx, yy, xx + tile, yy + tile], fill=(176, 176, 176, 255))
    for _, x, y, fim in p_placements:
        checker.alpha_composite(fim, (x, y))
    preview_out = SCRATCH_DIR / "verify_stage2_atlas_preview.png"
    checker.save(preview_out)
    print(f"Saved Stage 2 checkerboard preview: {preview_out} ({PW}x{PH})")


if __name__ == "__main__":
    main()
