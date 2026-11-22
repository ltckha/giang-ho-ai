#!/usr/bin/env python3
"""
Trình dựng bộ tài sản hình ảnh & Texture Atlas cho "Gọn Tiệm, Sạch Phố — Ngũ hành giữ tiệm" (Màn 1: Tiệm Giày Hẻm Dốc).
- Tách nền trong suốt sạch (BFS flood-fill từ 4 biên + làm mượt biên chống viền trắng).
- Sửa chuẩn 2 râu cho ảnh Con Gián thân dẹt bầu dục (theo góp ý 2 của REVIEW_LOG).
- Sinh 4 bậc nâng cấp (T1, T2, T3A, T3B) x 3 khung hoạt ảnh bắn cho 5 món giữ tiệm.
- Sinh 4 khung hoạt ảnh di chuyển cho 6 quái Màn 1 + Gián Con + Trùm Mùa Nồm.
- Ghép bản đồ Màn 1 (720x960 = 2x khung 360x480) khớp chính xác từng khúc cua đường quái đi & 9 ô đặt món, bỏ chữ WELCOME.
- Đóng gói tất cả vào Texture Atlas WebP (Phaser 3 JSON Hash) + nền bản đồ WebP giữ dung lượng bản build <= 5 MB.
"""

from collections import deque
import json
import math
import os
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter

REPO_ROOT = Path(__file__).resolve().parent.parent
ARTIFACT_DIR = Path(
    "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/f27c1771-a6ca-4307-ac45-cbf7e4715aff"
)
SCRATCH_DIR = ARTIFACT_DIR / "scratch"
OUT_DIR = REPO_ROOT / "public" / "assets"
OUT_DIR.mkdir(parents=True, exist_ok=True)
SCRATCH_DIR.mkdir(parents=True, exist_ok=True)

INK = (43, 26, 18, 255)  # Nét viền nâu đậm thống nhất

SRC_IMAGES = {
    "dep_tong": ARTIFACT_DIR / "tower_dep_tong_1795359070685.jpg",
    "bot_dinh": ARTIFACT_DIR / "tower_bot_dinh_1795359071425.jpg",
    "xit_da": ARTIFACT_DIR / "tower_xit_da_1795359072825.jpg",
    "tui_hut_am": ARTIFACT_DIR / "tower_tui_hut_am_1795359072973.jpg",
    "may_say": ARTIFACT_DIR / "tower_may_say_1795359077115.jpg",
    "giot_mua": ARTIFACT_DIR / "enemy_giot_mua_1795359122385.jpg",
    "cuc_bun": ARTIFACT_DIR / "enemy_cuc_bun_1795359126429.jpg",
    "con_gian": ARTIFACT_DIR / "enemy_con_gian_v2_1795359126424.jpg",
    "chuot": ARTIFACT_DIR / "enemy_chuot_1795359128710.jpg",
    "map_raw": ARTIFACT_DIR / "map_tiem_giay_man1_1795359084972.jpg",
}

# Đường đi & 9 ô đặt món chuẩn từ STAGE_1_DEFINITION (360 x 480)
STAGE1_PATH = [
    (48, 24),
    (48, 125),
    (304, 125),
    (304, 245),
    (56, 245),
    (56, 365),
    (304, 365),
    (304, 455),
]
STAGE1_PADS = [
    ("pad_1", 112, 76),
    ("pad_2", 232, 76),
    ("pad_3", 145, 185),
    ("pad_4", 242, 185),
    ("pad_5", 118, 305),
    ("pad_6", 215, 305),
    ("pad_7", 312, 305),
    ("pad_8", 150, 420),
    ("pad_9", 244, 420),
]


def remove_white_bg_floodfill(im: Image.Image, white_thresh: int = 236, sat_thresh: int = 24) -> Image.Image:
    """Tách nền trắng bằng BFS flood-fill từ 4 biên + làm mềm mép ngoài chống viền trắng."""
    rgba = im.convert("RGBA")
    w, h = rgba.size
    pix = rgba.load()

    def is_bg_pixel(r: int, g: int, b: int) -> bool:
        mx = max(r, g, b)
        mn = min(r, g, b)
        return mn >= white_thresh and (mx - mn) <= sat_thresh

    visited = bytearray(w * h)
    q = deque()

    for x in range(w):
        for y in (0, h - 1):
            r, g, b, _ = pix[x, y]
            if is_bg_pixel(r, g, b):
                idx = y * w + x
                if not visited[idx]:
                    visited[idx] = 1
                    q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            r, g, b, _ = pix[x, y]
            if is_bg_pixel(r, g, b):
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
                    if is_bg_pixel(r, g, b):
                        visited[idx] = 1
                        q.append((nx, ny))

    # Gọt nhẹ 1 vòng bán trong suốt trên các pixel rất sáng sát biên trong suốt để không bị halo trắng
    edge_soften = []
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
                if lum > 205 and (max(r, g, b) - min(r, g, b)) < 35:
                    edge_soften.append((x, y, 0))
                elif lum > 165 and (max(r, g, b) - min(r, g, b)) < 40:
                    edge_soften.append((x, y, int(a * 0.35)))
    for x, y, new_a in edge_soften:
        r, g, b, _ = pix[x, y]
        pix[x, y] = (r, g, b, new_a)

    return rgba


def trim_and_fit(im: Image.Image, box_size: int, pad: int = 8) -> Image.Image:
    """Cắt sát bounding box phần không trong suốt và đặt cân giữa vào khung vuông box_size."""
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


def load_clean_cockroach() -> Image.Image:
    """Xóa sạch chiếc râu thừa thứ 3 bên trái của ảnh gián để giữ đúng 2 râu dài cong chuẩn."""
    im = Image.open(SRC_IMAGES["con_gian"]).convert("RGB")
    d = ImageDraw.Draw(im)
    # Quét trắng đúng chiếc râu ngoài cùng bên trái (không chạm mắt trái x>=245, y>=512)
    d.polygon(
        [(90, 140), (315, 140), (315, 315), (236, 480), (242, 610), (90, 610)],
        fill=(255, 255, 255),
    )
    return remove_white_bg_floodfill(im, white_thresh=232, sat_thresh=26)


def draw_cartoon_eye(d: ImageDraw.ImageDraw, cx: int, cy: int, r: int, look_dx: int = 2, look_dy: int = 1):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 252, 242, 255), outline=INK, width=max(3, r // 4))
    pr = int(r * 0.56)
    px, py = cx + look_dx, cy + look_dy
    d.ellipse([px - pr, py - pr, px + pr, py + pr], fill=(56, 30, 18, 255))
    hr = max(2, int(r * 0.24))
    d.ellipse([px - pr // 2 - hr // 2, py - pr // 2 - hr // 2, px - pr // 2 + hr, py - pr // 2 + hr], fill=(255, 255, 255, 255))


def draw_enemy_nang_gat(size: int = 256) -> Image.Image:
    """Vẽ Nắng Gắt (Hỏa — tia nắng chói đeo kính râm tinh quái) ở 4x SSAA."""
    s = 512
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx, cy = s // 2, s // 2

    # 10 tia nắng nhọn xung quanh có viền nâu đậm
    num_rays = 10
    for i in range(num_rays):
        ang = (math.pi * 2 * i) / num_rays - math.pi / 2
        r_outer = 228 if i % 2 == 0 else 198
        r_base = 128
        spread = 0.24
        p1 = (cx + math.cos(ang - spread) * r_base, cy + math.sin(ang - spread) * r_base)
        p2 = (cx + math.cos(ang) * r_outer, cy + math.sin(ang) * r_outer)
        p3 = (cx + math.cos(ang + spread) * r_base, cy + math.sin(ang + spread) * r_base)
        fill_c = (255, 148, 42, 255) if i % 2 == 0 else (255, 198, 56, 255)
        d.polygon([p1, p2, p3], fill=fill_c, outline=INK)
        d.line([p1, p2, p3], fill=INK, width=11, joint="curve")

    # Lõi mặt trời tròn vàng cam rực
    r = 136
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 186, 52, 255), outline=INK, width=14)
    d.ellipse([cx - r + 18, cy - r + 16, cx + r - 28, cy + r - 30], fill=(255, 224, 96, 255))
    # Bóng sáng tròn
    d.ellipse([cx - 88, cy - 92, cx - 32, cy - 48], fill=(255, 252, 215, 230))

    # Kính râm đen siêu ngầu + ánh chói trắng
    d.rounded_rectangle([cx - 104, cy - 38, cx - 8, cy + 28], radius=20, fill=(36, 28, 32, 255), outline=INK, width=10)
    d.rounded_rectangle([cx + 8, cy - 38, cx + 104, cy + 28], radius=20, fill=(36, 28, 32, 255), outline=INK, width=10)
    d.line([(cx - 12, cy - 12), (cx + 12, cy - 12)], fill=INK, width=12)
    # Vệt bóng kính
    d.line([(cx - 84, cy + 8), (cx - 52, cy - 22)], fill=(255, 244, 180, 230), width=10)
    d.line([(cx + 28, cy + 8), (cx + 60, cy - 22)], fill=(255, 244, 180, 230), width=10)

    # Má hồng & nụ cười nhếch mép tinh quái
    d.ellipse([cx - 102, cy + 36, cx - 64, cy + 58], fill=(255, 112, 74, 190))
    d.ellipse([cx + 64, cy + 36, cx + 102, cy + 58], fill=(255, 112, 74, 190))
    d.arc([cx - 46, cy + 24, cx + 46, cy + 82], start=10, end=165, fill=INK, width=11)

    return trim_and_fit(im, size, pad=6)


def draw_enemy_nam_moc(size: int = 256) -> Image.Image:
    """Vẽ Nấm Mốc (Mộc — đám nấm mốc ẩm hồi máu bầy) ở 4x SSAA."""
    s = 512
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    # Cụm bông mốc xanh rêu - kem mềm mại
    puffs = [
        (165, 310, 95, (112, 168, 92, 255)),
        (345, 315, 92, (104, 158, 86, 255)),
        (256, 225, 118, (134, 196, 108, 255)),
        (256, 328, 112, (152, 212, 122, 255)),
    ]
    # Viền tổng ngoài
    for x, y, r, _ in puffs:
        d.ellipse([x - r - 12, y - r - 12, x + r + 12, y + r + 12], fill=INK)
    for x, y, r, col in puffs:
        d.ellipse([x - r, y - r, x + r, y + r], fill=col)

    # Đốm bào tử kem nhạt trên thân
    for x, y, r in [(180, 220, 22), (326, 210, 20), (252, 148, 24), (368, 300, 18), (144, 316, 16)]:
        d.ellipse([x - r, y - r, x + r, y + r], fill=(230, 245, 200, 255), outline=INK, width=6)

    # Cây nấm nhỏ mọc trên đỉnh đầu
    d.rounded_rectangle([292, 120, 326, 188], radius=10, fill=(244, 232, 202, 255), outline=INK, width=9)
    d.pieslice([254, 70, 364, 152], start=180, end=360, fill=(84, 176, 114, 255), outline=INK, width=10)
    d.line([(254, 111), (364, 111)], fill=INK, width=10)

    # Đôi mắt lim dim dễ thương + má hồng
    draw_cartoon_eye(d, 206, 294, 34, look_dx=4, look_dy=4)
    draw_cartoon_eye(d, 306, 294, 34, look_dx=-4, look_dy=4)
    # Mí mắt ngái ngủ
    d.pieslice([170, 256, 242, 300], start=180, end=360, fill=(134, 196, 108, 255), outline=INK, width=8)
    d.pieslice([270, 256, 342, 300], start=180, end=360, fill=(134, 196, 108, 255), outline=INK, width=8)
    d.arc([232, 332, 280, 364], start=10, end=170, fill=INK, width=9)

    # 3 hạt bào tử sáng hồi máu bay quanh
    for x, y, r in [(92, 178, 18), (420, 162, 16), (432, 246, 12)]:
        d.ellipse([x - r, y - r, x + r, y + r], fill=(168, 255, 138, 255), outline=INK, width=7)

    return trim_and_fit(im, size, pad=6)


def draw_enemy_boss_mua_nom(size: int = 256) -> Image.Image:
    """Vẽ Trùm Mùa Nồm (đám mây đen ẩm đội vương miện đồng nhỏ) ở 4x SSAA."""
    s = 512
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    # Giọt mưa lơ lửng dưới bụng mây
    for dx in (-110, -36, 44, 116):
        rx, ry = 256 + dx, 422 + (14 if dx % 70 == 0 else 0)
        d.polygon([(rx, ry - 32), (rx - 18, ry + 6), (rx + 18, ry + 6)], fill=(76, 198, 248, 255))
        d.ellipse([rx - 18, ry - 6, rx + 18, ry + 26], fill=(76, 198, 248, 255), outline=INK, width=8)

    # Thân mây đen ẩm bồng bềnh
    blobs = [
        (140, 295, 92, (58, 76, 104, 255)),
        (372, 295, 92, (58, 76, 104, 255)),
        (195, 215, 105, (72, 94, 126, 255)),
        (320, 215, 102, (72, 94, 126, 255)),
        (256, 286, 122, (66, 86, 116, 255)),
    ]
    for x, y, r, _ in blobs:
        d.ellipse([x - r - 14, y - r - 14, x + r + 14, y + r + 14], fill=INK)
    for x, y, r, col in blobs:
        d.ellipse([x - r, y - r, x + r, y + r], fill=col)

    # Vương miện mưa đồng nhỏ trên đỉnh mây
    crown = [(202, 132), (190, 62), (232, 96), (256, 44), (280, 96), (322, 62), (310, 132)]
    d.polygon(crown, fill=(240, 194, 78, 255), outline=INK)
    d.line(crown + [crown[0]], fill=INK, width=10, joint="curve")
    d.ellipse([246, 88, 266, 108], fill=(76, 206, 255, 255), outline=INK, width=5)

    # Mắt gầm gừ dễ thương & mày cau
    draw_cartoon_eye(d, 202, 272, 36, look_dx=5, look_dy=3)
    draw_cartoon_eye(d, 310, 272, 36, look_dx=-5, look_dy=3)
    d.line([(160, 224), (238, 248)], fill=INK, width=14)
    d.line([(352, 224), (274, 248)], fill=INK, width=14)
    d.arc([208, 318, 304, 372], start=195, end=345, fill=INK, width=12)

    return trim_and_fit(im, size, pad=6)


def draw_element_icon(el: str, size: int = 64) -> Image.Image:
    """5 biểu tượng hành Ngũ Hành (giọt nước, cục đất, chiếc lá, mũi kim, ngọn lửa) nét hoạt hình đồng nhất."""
    s = 256
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx, cy = 128, 128

    if el == "thuy":  # Giọt nước xanh dương
        d.polygon([(128, 20), (54, 146), (202, 146)], fill=(56, 189, 248, 255))
        d.ellipse([52, 92, 204, 236], fill=(56, 189, 248, 255))
        # Vẽ viền sắc nét
        pts = [(128, 22)]
        for a in range(-25, 206, 10):
            rad = math.radians(a)
            pts.append((128 + math.cos(rad) * 76, 162 + math.sin(rad) * 74))
        pts.append((128, 22))
        d.polygon(pts, fill=(56, 189, 248, 255))
        d.line(pts, fill=INK, width=14, joint="curve")
        d.ellipse([82, 118, 112, 166], fill=(220, 248, 255, 230))
    elif el == "tho":  # Cục đất nâu vàng
        pts = [(56, 182), (42, 124), (84, 62), (168, 56), (214, 116), (198, 192), (112, 212)]
        d.polygon(pts, fill=(212, 163, 89, 255))
        d.line(pts + [pts[0]], fill=INK, width=14, joint="curve")
        d.polygon([(88, 72), (162, 68), (188, 112), (108, 116)], fill=(238, 198, 128, 255))
        d.ellipse([80, 144, 104, 164], fill=(148, 102, 48, 255))
        d.ellipse([146, 152, 174, 176], fill=(148, 102, 48, 255))
    elif el == "moc":  # Chiếc lá xanh lá
        pts = [(46, 204), (56, 98), (126, 40), (212, 46), (200, 138), (134, 200)]
        d.polygon(pts, fill=(89, 193, 115, 255))
        d.line(pts + [pts[0]], fill=INK, width=14, joint="curve")
        d.line([(40, 212), (180, 74)], fill=INK, width=11)
        d.line([(106, 148), (102, 104)], fill=INK, width=8)
        d.line([(138, 116), (178, 116)], fill=INK, width=8)
    elif el == "kim":  # Mũi kim bạc sắc bén
        pts = [(208, 36), (168, 112), (92, 188), (38, 218), (68, 164), (144, 88)]
        d.polygon(pts, fill=(203, 213, 225, 255))
        d.line(pts + [pts[0]], fill=INK, width=14, joint="curve")
        d.line([(178, 66), (78, 166)], fill=(255, 255, 255, 235), width=10)
        d.ellipse([166, 56, 192, 82], fill=(255, 255, 255, 255), outline=INK, width=6)
    else:  # Hỏa: ngọn lửa đỏ cam
        pts = [
            (128, 22),
            (168, 84),
            (196, 68),
            (206, 138),
            (184, 202),
            (128, 226),
            (72, 202),
            (50, 138),
            (76, 86),
            (96, 102),
        ]
        d.polygon(pts, fill=(255, 107, 74, 255))
        d.line(pts + [pts[0]], fill=INK, width=14, joint="curve")
        inner = [(128, 104), (162, 152), (150, 198), (128, 210), (106, 198), (94, 152)]
        d.polygon(inner, fill=(255, 214, 78, 255))

    return trim_and_fit(im, size, pad=4)


def draw_icon_coin(size: int = 48) -> Image.Image:
    s = 192
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([16, 16, 176, 176], fill=(246, 192, 58, 255), outline=INK, width=12)
    d.ellipse([36, 36, 156, 156], fill=(255, 222, 98, 255), outline=(182, 126, 28, 255), width=8)
    d.rectangle([76, 76, 116, 116], fill=(214, 150, 32, 255), outline=INK, width=6)
    d.ellipse([54, 48, 86, 70], fill=(255, 252, 225, 230))
    return trim_and_fit(im, size, pad=2)


def draw_icon_wallet(size: int = 64) -> Image.Image:
    """Chiếc ví da nâu ấm có đồng xu vàng nhô lên ở góc màn hình."""
    s = 256
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # Tờ tiền xanh & đồng xu vàng ló ra miệng ví
    d.rounded_rectangle([54, 44, 176, 116], radius=12, fill=(104, 186, 118, 255), outline=INK, width=10)
    d.ellipse([156, 36, 218, 98], fill=(250, 200, 64, 255), outline=INK, width=10)
    # Thân ví da nâu cổ điển
    d.rounded_rectangle([26, 86, 224, 218], radius=26, fill=(166, 98, 52, 255), outline=INK, width=12)
    # Đường khâu chỉ vàng quanh viền ví
    d.rounded_rectangle([40, 100, 210, 204], radius=18, outline=(242, 206, 134, 220), width=5)
    # Quai bấm khóa ví
    d.rounded_rectangle([162, 130, 234, 178], radius=18, fill=(138, 76, 38, 255), outline=INK, width=10)
    d.ellipse([180, 144, 202, 166], fill=(246, 206, 94, 255), outline=INK, width=6)
    return trim_and_fit(im, size, pad=3)


def draw_icon_shoe_life(size: int = 64) -> Image.Image:
    """Đôi giày lành gọn sạch làm biểu tượng mạng thành trên thanh HUD."""
    s = 256
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # Chiếc giày sneaker màu kem-đỏ gọn xinh
    body = [(36, 174), (42, 96), (98, 86), (138, 126), (214, 140), (224, 178), (36, 188)]
    d.polygon(body, fill=(235, 92, 72, 255))
    d.line(body + [body[0]], fill=INK, width=12, joint="curve")
    # Mũi giày kem & đế trắng sạch bóng
    d.chord([166, 136, 228, 184], start=250, end=90, fill=(252, 242, 222, 255), outline=INK, width=10)
    d.rounded_rectangle([30, 172, 228, 204], radius=12, fill=(252, 246, 234, 255), outline=INK, width=11)
    # Dây giày trắng
    d.line([(98, 108), (124, 114)], fill=(255, 252, 245, 255), width=9)
    d.line([(114, 122), (140, 128)], fill=(255, 252, 245, 255), width=9)
    # Ngôi sao sạch bóng lấp lánh
    d.polygon([(194, 62), (202, 82), (222, 90), (202, 98), (194, 118), (186, 98), (166, 90), (186, 82)], fill=(255, 226, 96, 255), outline=INK)
    return trim_and_fit(im, size, pad=3)


def draw_proj_silica_packet(size: int = 44) -> Image.Image:
    """Gói hút ẩm nhỏ bay vèo khi Túi Hút Ẩm quăng ra."""
    s = 160
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([24, 34, 136, 126], radius=12, fill=(248, 238, 212, 255), outline=INK, width=10)
    d.line([(24, 52), (136, 52)], fill=(208, 182, 134, 255), width=5)
    d.line([(24, 108), (136, 108)], fill=(208, 182, 134, 255), width=5)
    for x, y in [(60, 80), (80, 74), (100, 84), (72, 92), (90, 68)]:
        d.ellipse([x - 6, y - 6, x + 6, y + 6], fill=(212, 163, 89, 255))
    return trim_and_fit(im, size, pad=2)


def make_tower_tier_variant(base: Image.Image, tower_id: str, tier: str) -> Image.Image:
    """
    Tạo khác biệt nhìn thấy rõ ở cỡ nhỏ điện thoại cho Bậc 1, Bậc 2, Bậc 3A và Bậc 3B của mỗi món.
    """
    sz = 192
    canvas = Image.new("RGBA", (sz, sz), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)

    if tier == "t1":
        sp = trim_and_fit(base, sz, pad=18)
        canvas.alpha_composite(sp)
        return canvas

    if tier == "t2":
        # Bậc 2: sáng rực hơn + đế viền vàng ấm + phụ kiện nâng cấp rõ rệt
        sp = trim_and_fit(base, sz, pad=14)
        sp = ImageEnhance.Color(sp).enhance(1.16)
        sp = ImageEnhance.Contrast(sp).enhance(1.06)
        # Vòng đệm hào quang vàng nhạt sau lưng
        d.ellipse([22, 132, 170, 178], fill=(246, 204, 88, 110), outline=(196, 138, 34, 220), width=4)
        canvas.alpha_composite(sp)
        if tower_id == "water_tower":
            # Đồng hồ áp suất nhỏ bên hông
            d.ellipse([134, 72, 178, 116], fill=(255, 250, 236, 255), outline=INK, width=5)
            d.line([(156, 94), (168, 80)], fill=(224, 54, 48, 255), width=5)
        elif tower_id == "earth_tower":
            # Vòi sấy phụ thứ 2 (Máy Sấy Hai Vòi)
            d.ellipse([122, 114, 172, 164], fill=(226, 78, 42, 255), outline=INK, width=6)
            d.ellipse([132, 124, 162, 154], fill=(255, 212, 84, 255))
        elif tower_id == "metal_tower":
            # Ánh thép sáng trên hàng đinh
            for sx in (52, 84, 116, 148):
                d.ellipse([sx - 7, 148, sx + 7, 162], fill=(238, 248, 255, 255), outline=INK, width=3)
        elif tower_id == "wood_tower":
            # Đế cao su dày xanh-vàng nổi bật
            d.arc([44, 132, 150, 176], start=10, end=170, fill=(248, 210, 74, 255), width=10)
        elif tower_id == "fire_tower":
            # Quai giỏ viền vàng đồng
            d.arc([52, 24, 140, 108], start=190, end=350, fill=(246, 198, 72, 255), width=8)
        return canvas

    if tier == "t3a":
        if tower_id == "wood_tower":
            # Dép Tông Kép: HAI chiếc dép tông đặt song hành chữ V cực chiến!
            small = trim_and_fit(base, 148, pad=6)
            left_s = small.rotate(18, resample=Image.Resampling.BICUBIC, expand=True)
            right_s = small.transpose(Image.Transpose.FLIP_LEFT_RIGHT).rotate(-18, resample=Image.Resampling.BICUBIC, expand=True)
            d.ellipse([18, 132, 174, 180], fill=(89, 193, 115, 110), outline=(46, 136, 72, 230), width=4)
            canvas.alpha_composite(left_s, (-8, 12))
            canvas.alpha_composite(right_s, (36, 12))
            return canvas
        elif tower_id == "metal_tower":
            # Bốt Chốt Chì: bốt đậm nặng + vòng khóa vàng đồng đại + hào quang bạc
            sp = trim_and_fit(base, sz, pad=10)
            d.ellipse([14, 126, 178, 182], fill=(203, 213, 225, 130), outline=(92, 108, 128, 240), width=5)
            canvas.alpha_composite(sp)
            d.rounded_rectangle([118, 86, 172, 132], radius=10, fill=(246, 198, 72, 255), outline=INK, width=6)
            d.ellipse([136, 100, 154, 118], fill=INK)
            return canvas
        elif tower_id == "water_tower":
            # Xịt Bọt Tuyết Lạnh: vòng băng xanh sáng + tinh thể tuyết lấp lánh
            sp = trim_and_fit(base, sz, pad=12)
            d.ellipse([16, 126, 176, 180], fill=(125, 228, 255, 135), outline=(56, 189, 248, 240), width=5)
            canvas.alpha_composite(sp)
            for fx, fy, fr in [(36, 56, 16), (156, 70, 18), (146, 140, 12)]:
                for a in range(0, 180, 60):
                    rad = math.radians(a)
                    d.line(
                        [(fx - math.cos(rad) * fr, fy - math.sin(rad) * fr), (fx + math.cos(rad) * fr, fy + math.sin(rad) * fr)],
                        fill=(235, 252, 255, 255),
                        width=5,
                    )
            return canvas
        elif tower_id == "fire_tower":
            # Thảm Hạt Hút Khô: vầng hạt silica vàng óng rực dưới chân & miệng túi
            sp = trim_and_fit(base, sz, pad=12)
            d.ellipse([14, 124, 178, 182], fill=(252, 210, 96, 145), outline=(194, 132, 34, 240), width=5)
            canvas.alpha_composite(sp)
            for bx, by in [(34, 154), (62, 166), (128, 168), (158, 152), (48, 72), (146, 68)]:
                d.ellipse([bx - 8, by - 8, bx + 8, by + 8], fill=(255, 236, 136, 255), outline=INK, width=3)
            return canvas
        else:
            # Máy Sấy Khử Khuẩn: vòng khí ấm tím-vàng bảo vệ + ngôi sao lấp lánh
            sp = trim_and_fit(base, sz, pad=12)
            d.ellipse([14, 18, 178, 178], outline=(216, 148, 255, 210), width=7)
            d.ellipse([22, 26, 170, 170], fill=(255, 218, 120, 65))
            canvas.alpha_composite(sp)
            for sx, sy in [(38, 42), (156, 46), (160, 138)]:
                d.polygon([(sx, sy - 14), (sx + 5, sy - 5), (sx + 14, sy), (sx + 5, sy + 5), (sx, sy + 14), (sx - 5, sy + 5), (sx - 14, sy), (sx - 5, sy - 5)], fill=(255, 242, 132, 255), outline=INK)
            return canvas

    # tier == "t3b"
    if tower_id == "wood_tower":
        # Dép Tông Gai Bám: đế gai xanh đậm mạnh mẽ + lá sắc 2 bên
        sp = trim_and_fit(base, sz, pad=12)
        sp = ImageEnhance.Color(sp).enhance(1.3)
        d.ellipse([16, 126, 176, 180], fill=(54, 152, 76, 135), outline=(28, 92, 46, 240), width=5)
        canvas.alpha_composite(sp)
        for gx, gy in [(44, 136), (72, 154), (118, 154), (146, 136)]:
            d.polygon([(gx, gy - 14), (gx - 9, gy + 8), (gx + 9, gy + 8)], fill=(156, 255, 134, 255), outline=INK)
        return canvas
    elif tower_id == "metal_tower":
        # Bốt Đinh Quét Dọc: mũi đinh thép dài sáng loáng hướng về phía trước
        sp = trim_and_fit(base, sz, pad=12)
        d.ellipse([14, 126, 178, 182], fill=(148, 194, 232, 125), outline=(72, 108, 146, 240), width=5)
        canvas.alpha_composite(sp)
        for sy in (112, 134, 154):
            d.polygon([(14, sy), (48, sy - 10), (48, sy + 10)], fill=(238, 248, 255, 255), outline=INK)
        return canvas
    elif tower_id == "water_tower":
        # Xịt Vòi Xoáy: vòng xoáy nước xanh lam mạnh quanh chân & 2 tia xịt
        sp = trim_and_fit(base, sz, pad=12)
        d.arc([12, 114, 180, 182], start=0, end=310, fill=(56, 189, 248, 235), width=10)
        d.arc([26, 126, 166, 172], start=40, end=340, fill=(214, 246, 255, 240), width=6)
        canvas.alpha_composite(sp)
        return canvas
    elif tower_id == "fire_tower":
        # Chùm Túi Nổ Liên Hoàn: 2 túi nhỏ kẹp 2 bên tạo thành chùm 3 túi!
        mini = trim_and_fit(base, 106, pad=4)
        main = trim_and_fit(base, 148, pad=6)
        d.ellipse([14, 128, 178, 180], fill=(212, 163, 89, 135), outline=(146, 98, 38, 240), width=5)
        canvas.alpha_composite(mini.rotate(14, resample=Image.Resampling.BICUBIC, expand=True), (-6, 54))
        canvas.alpha_composite(mini.rotate(-14, resample=Image.Resampling.BICUBIC, expand=True), (80, 54))
        canvas.alpha_composite(main, (22, 16))
        return canvas
    else:
        # Máy Sấy Gió Nhiệt Cao: vòng lửa cam vàng rực cháy sau thân máy
        sp = trim_and_fit(base, sz, pad=12)
        sp = ImageEnhance.Color(sp).enhance(1.25)
        for i in range(12):
            ang = (math.pi * 2 * i) / 12
            p1 = (96 + math.cos(ang - 0.18) * 68, 96 + math.sin(ang - 0.18) * 68)
            p2 = (96 + math.cos(ang) * 90, 96 + math.sin(ang) * 90)
            p3 = (96 + math.cos(ang + 0.18) * 68, 96 + math.sin(ang + 0.18) * 68)
            d.polygon([p1, p2, p3], fill=(255, 176, 52, 235), outline=INK)
        canvas.alpha_composite(sp)
        return canvas


def make_tower_anim_frames(tier_img: Image.Image, target_size: int = 96) -> list[Image.Image]:
    """Tạo 3 khung hoạt ảnh cho mỗi món giữ tiệm: f0 (đứng yên), f1 (lấy đà ép xuống), f2 (tung đòn bật lên)."""
    frames = []
    # f0: idle chuẩn
    f0 = tier_img.resize((target_size, target_size), Image.Resampling.LANCZOS)
    frames.append(f0)

    # f1: windup — hơi ép thấp & nghiêng -5 độ lấy đà
    c1 = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    sq = tier_img.resize((int(target_size * 1.06), int(target_size * 0.90)), Image.Resampling.LANCZOS)
    sq = sq.rotate(5, resample=Image.Resampling.BICUBIC, expand=True)
    c1.alpha_composite(sq, ((target_size - sq.width) // 2, target_size - sq.height + 2))
    frames.append(c1)

    # f2: fire — bật vươn lên + sáng nhẹ + nghiêng +6 độ
    c2 = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    st = tier_img.resize((int(target_size * 0.93), int(target_size * 1.06)), Image.Resampling.LANCZOS)
    st = ImageEnhance.Brightness(st).enhance(1.14)
    st = st.rotate(-6, resample=Image.Resampling.BICUBIC, expand=True)
    c2.alpha_composite(st, ((target_size - st.width) // 2, max(0, (target_size - st.height) // 2 - 4)))
    frames.append(c2)
    return frames


def make_enemy_walk_frames(base_img: Image.Image, target_size: int = 80, bob_px: int = 4) -> list[Image.Image]:
    """Tạo 4 khung hoạt ảnh bước đi / lướt nhún nhịp cho từng loại quái."""
    fitted = trim_and_fit(base_img, target_size, pad=8)
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


def extract_map_props_and_build_stage1():
    """
    Trích xuất sàn gỗ thông, thảm cói tròn, cửa kính ngày mưa, kệ giày gỗ & phụ kiện từ ảnh đã duyệt,
    sau đó dựng nền bản đồ Màn 1 (720x960 = đúng 2x 360x480) khớp TUYỆT ĐỐI 100% đường quái đi & 9 ô đặt món.
    """
    raw = Image.open(SRC_IMAGES["map_raw"]).convert("RGBA")

    # 1. Trích xuất thảm cói tròn (tâm ~(361, 463), hộp 298..424, 400..526 trong ảnh 896x1200)
    rug_crop = raw.crop((298, 400, 424, 526))
    rw, rh = rug_crop.size
    mask = Image.new("L", (rw, rh), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse([3, 3, rw - 4, rh - 4], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(1.2))
    pad_rug = Image.new("RGBA", (rw, rh), (0, 0, 0, 0))
    pad_rug.paste(rug_crop, (0, 0), mask)
    pad_rug_sprite = trim_and_fit(pad_rug, 88, pad=4)

    # 2. Trích xuất kệ giày gỗ ở góc dưới phải (x=582..890, y=725..1190) bỏ nền sàn gỗ xung quanh
    shelf_crop = raw.crop((582, 725, 892, 1188))
    sw, sh = shelf_crop.size
    # Dùng đa giác ôm sát kệ giày (cả chậu cây & giỏ trên mặt kệ) để cắt sạch khỏi sàn gỗ
    smask = Image.new("L", (sw, sh), 0)
    smd = ImageDraw.Draw(smask)
    smd.polygon(
        [
            (4, 96),
            (54, 40),
            (108, 0),
            (142, 42),
            (256, 108),
            (296, 134),
            (308, 174),
            (304, 434),
            (254, 460),
            (226, 444),
            (8, 326),
            (4, 106),
        ],
        fill=255,
    )
    smask = smask.filter(ImageFilter.GaussianBlur(1.0))
    shoe_shelf = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    shoe_shelf.paste(shelf_crop, (0, 0), smask)
    shoe_shelf_sprite = trim_and_fit(shoe_shelf, 136, pad=4)

    # 3. Dựng nền sàn gỗ thông ấm Đà Lạt kích thước chuẩn 720x960 (đúng 2x khung logic 360x480)
    # Cắt dải ván gỗ sạch ở x=392..526 (tránh hoàn toàn viền khung cửa ở x=364) để không có đường dọc lặp
    W, H = 720, 960
    S = 2
    plank_tile = raw.crop((392, 0, 526, 180))
    bg = Image.new("RGBA", (W, H), (186, 128, 72, 255))
    tw, th = plank_tile.size
    for row_idx, y in enumerate(range(0, H, th)):
        x_shift = (row_idx % 2) * (tw // 2)
        for x in range(-x_shift, W, tw):
            bg.paste(plank_tile, (x, y))

    # Vẽ thêm các khớp nối ván gỗ mảnh rải tự nhiên bằng lớp overlay riêng (không ghi đè alpha)
    joint_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    plank_d = ImageDraw.Draw(joint_layer)
    for idx, y in enumerate(range(0, H, 36)):
        jx = ((idx * 173 + 95) % (W - 80)) + 40
        plank_d.line([(jx, y), (jx, min(H, y + 36))], fill=(104, 62, 30, 115), width=2)
    bg.alpha_composite(joint_layer)

    # 4. Dán góc vỉa hè đá ướt mưa + cửa kính mở ở góc trên trái (không chữ WELCOME!)
    door_crop = raw.crop((0, 0, 368, 218))
    dw, dh = door_crop.size
    dmask = Image.new("L", (dw, dh), 255)
    dmd = ImageDraw.Draw(dmask)
    for i in range(22):
        alpha = int(255 * (i / 22))
        dmd.line([(0, dh - 1 - i), (dw, dh - 1 - i)], fill=alpha)
        dmd.line([(dw - 1 - i, 0), (dw - 1 - i, dh)], fill=alpha)
    door_resized = door_crop.resize((226, 134), Image.Resampling.LANCZOS)
    dmask_r = dmask.resize((226, 134), Image.Resampling.LANCZOS)
    bg.paste(door_resized, (0, 0), dmask_r)

    # 5. Dán ghế thử giày & giỏ ô (dù) góc trên phải — tách mềm bằng mask hòa nền sàn gỗ
    tr_crop = raw.crop((700, 0, 896, 178)).resize((150, 136), Image.Resampling.LANCZOS)
    tr_mask = Image.new("L", tr_crop.size, 255)
    trd = ImageDraw.Draw(tr_mask)
    for i in range(24):
        a = int(255 * (i / 24))
        trd.line([(i, 0), (i, tr_crop.height)], fill=a)
        trd.line([(0, tr_crop.height - 1 - i), (tr_crop.width, tr_crop.height - 1 - i)], fill=a)
    bg.paste(tr_crop, (W - 150, 0), tr_mask)

    # 6. Dán ghế đệm & chậu cây góc dưới trái
    bl_crop = raw.crop((0, 1012, 196, 1200)).resize((146, 140), Image.Resampling.LANCZOS)
    bl_mask = Image.new("L", bl_crop.size, 255)
    bld = ImageDraw.Draw(bl_mask)
    for i in range(24):
        a = int(255 * (i / 24))
        bld.line([(bl_crop.width - 1 - i, 0), (bl_crop.width - 1 - i, bl_crop.height)], fill=a)
        bld.line([(0, i), (bl_crop.width, i)], fill=a)
    bg.paste(bl_crop, (0, H - 140), bl_mask)

    # Thêm chậu cây nhỏ góc trái giữa tường (x=0..102, y=335..452) vào khoảng trống bên trái đường đi
    plant_crop = raw.crop((0, 338, 98, 452)).resize((72, 84), Image.Resampling.LANCZOS)
    pmask = Image.new("L", plant_crop.size, 255)
    pmd = ImageDraw.Draw(pmask)
    for i in range(14):
        a = int(255 * (i / 14))
        pmd.line([(plant_crop.width - 1 - i, 0), (plant_crop.width - 1 - i, plant_crop.height)], fill=a)
        pmd.line([(0, i), (plant_crop.width, i)], fill=a)
        pmd.line([(0, plant_crop.height - 1 - i), (plant_crop.width, plant_crop.height - 1 - i)], fill=a)
    bg.paste(plant_crop, (0, 315), pmask)

    # 7. VẼ ĐƯỜNG ĐI CỦA QUÁI KHỚP TUYỆT ĐỐI 100% STAGE_1_DEFINITION.paths[0]
    path_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pd = ImageDraw.Draw(path_layer)
    pts = [(x * S, y * S) for x, y in STAGE1_PATH]
    # Điểm bắt đầu hình đường chạy từ ngay dưới mép thảm chùi chân (96, 62) để không lòi tròn phía trên thảm
    draw_pts = [(pts[0][0], pts[0][1] + 18)] + pts[1:]

    # Bóng đổ mềm dưới tấm thảm lối đi
    for i in range(len(draw_pts) - 1):
        pd.line([draw_pts[i], draw_pts[i + 1]], fill=(58, 34, 18, 95), width=68)
    for x, y in draw_pts:
        pd.ellipse([x - 34, y - 34, x + 34, y + 34], fill=(58, 34, 18, 95))

    # Viền nâu đậm ngoài cùng của lối đi
    for i in range(len(draw_pts) - 1):
        pd.line([draw_pts[i], draw_pts[i + 1]], fill=(74, 44, 24, 255), width=60)
    for x, y in draw_pts:
        pd.ellipse([x - 30, y - 30, x + 30, y + 30], fill=(74, 44, 24, 255))

    # Lòng đường màu gỗ kem ấm giống bản mẫu (độ tương phản cực tốt cho cả quái tối lẫn sáng)
    for i in range(len(draw_pts) - 1):
        pd.line([draw_pts[i], draw_pts[i + 1]], fill=(241, 218, 174, 255), width=52)
    for x, y in draw_pts:
        pd.ellipse([x - 26, y - 26, x + 26, y + 26], fill=(241, 218, 174, 255))

    # Đường chỉ viền giữa chạy dọc theo từng đoạn (giống hệt tấm thảm chạy trong ảnh mẫu)
    for i in range(len(draw_pts) - 1):
        pd.line([draw_pts[i], draw_pts[i + 1]], fill=(138, 92, 52, 175), width=4)

    # Vệt dấu chân bùn nhẹ từ cửa vào (gợi chuyện bọn phá đồ kéo từ ngoài mưa vào tiệm)
    for fx, fy in [(94, 102), (104, 134), (90, 168), (102, 204), (132, 246), (174, 256)]:
        pd.ellipse([fx - 5, fy - 7, fx + 5, fy + 7], fill=(128, 88, 52, 85))
        pd.ellipse([fx - 3, fy + 6, fx + 3, fy + 11], fill=(128, 88, 52, 75))

    bg.alpha_composite(path_layer)

    # 8. Vẽ thảm chùi chân nâu sọc gọn gàng ngay cửa vào (48*2, 24*2) — TUYỆT ĐỐI KHÔNG CÓ CHỮ "WELCOME"!
    mat_d = ImageDraw.Draw(bg)
    mx, my = 48 * S, 24 * S + 10
    mat_d.rounded_rectangle([mx - 44, my - 22, mx + 44, my + 22], radius=8, fill=(132, 84, 44, 255), outline=INK, width=4)
    for stripe_y in range(my - 14, my + 16, 7):
        mat_d.line([(mx - 38, stripe_y), (mx + 38, stripe_y)], fill=(166, 112, 62, 255), width=3)

    # 9. Dán 9 THẢM CÓI TRÒN (Ô ĐẶT MÓN) tại ĐÚNG TỌA ĐỘ 9 PAD TRONG STAGE_1_DEFINITION!
    pad_on_map = pad_rug_sprite.resize((86, 86), Image.Resampling.LANCZOS)
    for _, px, py in STAGE1_PADS:
        cx, cy = px * S, py * S
        sh_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        sd = ImageDraw.Draw(sh_layer)
        sd.ellipse([cx - 43, cy - 41, cx + 43, cy + 45], fill=(46, 28, 16, 110))
        bg.alpha_composite(sh_layer)
        bg.alpha_composite(pad_on_map, (cx - 43, cy - 43))

    # 10. Ánh đèn vàng ấm & Kệ giày gỗ ở cuối đường (304*2, 455*2 = 608, 910) — KHÔNG CHE PAD 7 hay PAD 9!
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for rad, alpha in [(120, 22), (86, 34), (54, 46)]:
        gd.ellipse([634 - rad, 880 - rad, 634 + rad, 880 + rad], fill=(255, 224, 118, alpha))
    bg.alpha_composite(glow)

    shelf_placed = shoe_shelf_sprite.resize((142, 142), Image.Resampling.LANCZOS)
    bg.alpha_composite(shelf_placed, (568, 814))

    # Viền gỗ tối bo khung tiệm cho gọn mắt
    frame_overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fd = ImageDraw.Draw(frame_overlay)
    fd.rectangle([0, 0, W - 1, H - 1], outline=(56, 34, 18, 220), width=8)
    bg.alpha_composite(frame_overlay)

    # Lưu nền bản đồ nén WebP gọn nhẹ
    map_out = OUT_DIR / "map_man1_tiem_giay.webp"
    bg.convert("RGB").save(map_out, format="WEBP", quality=84, method=6)
    print(f"Saved map: {map_out} ({map_out.stat().st_size / 1024:.1f} KB)")

    # Xuất ảnh kiểm tra khớp tọa độ vào scratch/verify_map_alignment.png
    chk = bg.copy()
    cd = ImageDraw.Draw(chk)
    for i in range(len(pts) - 1):
        cd.line([pts[i], pts[i + 1]], fill=(0, 255, 255, 220), width=3)
    for x, y in pts:
        cd.ellipse([x - 7, y - 7, x + 7, y + 7], fill=(0, 255, 255, 255))
    for pid, px, py in STAGE1_PADS:
        cx, cy = px * S, py * S
        cd.ellipse([cx - 36, cy - 36, cx + 36, cy + 36], outline=(255, 64, 255, 255), width=3)
        cd.text((cx - 18, cy - 6), pid, fill=(255, 255, 255, 255))
    chk.save(SCRATCH_DIR / "verify_map_alignment.png")

    return pad_rug_sprite, shoe_shelf_sprite


def build_atlas(pad_rug_sprite: Image.Image, shoe_shelf_sprite: Image.Image):
    """Tạo toàn bộ khung hình (tháp 4 bậc x 3 khung, quái 4 khung, biểu tượng) và đóng gói thành 1 Atlas WebP + JSON."""
    frames: dict[str, Image.Image] = {}

    # 1. Tách nền trong suốt 5 món giữ tiệm
    tower_map = {
        "wood_tower": SRC_IMAGES["dep_tong"],
        "metal_tower": SRC_IMAGES["bot_dinh"],
        "water_tower": SRC_IMAGES["xit_da"],
        "fire_tower": SRC_IMAGES["tui_hut_am"],
        "earth_tower": SRC_IMAGES["may_say"],
    }
    clean_towers: dict[str, Image.Image] = {}
    for tid, path in tower_map.items():
        clean = remove_white_bg_floodfill(Image.open(path), white_thresh=235, sat_thresh=24)
        clean_towers[tid] = clean
        # Đạn dép tông xoay cho wood_tower
        if tid == "wood_tower":
            frames["proj_dep_tong"] = trim_and_fit(clean, 44, pad=2)
        for tier in ("t1", "t2", "t3a", "t3b"):
            variant = make_tower_tier_variant(clean, tid, tier)
            anim_frames = make_tower_anim_frames(variant, target_size=92)
            for idx, fimg in enumerate(anim_frames):
                frames[f"tower_{tid}_{tier}_f{idx}"] = fimg

    # 2. Tách nền & vẽ 6 quái Màn 1 + Gián Con + Trùm Mùa Nồm (4 khung đi mỗi con)
    clean_giot_mua = remove_white_bg_floodfill(Image.open(SRC_IMAGES["giot_mua"]), white_thresh=234, sat_thresh=24)
    clean_cuc_bun = remove_white_bg_floodfill(Image.open(SRC_IMAGES["cuc_bun"]), white_thresh=234, sat_thresh=24)
    clean_con_gian = load_clean_cockroach()
    clean_chuot = remove_white_bg_floodfill(Image.open(SRC_IMAGES["chuot"]), white_thresh=234, sat_thresh=24)
    clean_nang_gat = draw_enemy_nang_gat(256)
    clean_nam_moc = draw_enemy_nam_moc(256)
    clean_boss = draw_enemy_boss_mua_nom(256)

    enemy_bases = {
        "fast_metal": (clean_giot_mua, 74, 4),
        "tank_earth": (clean_cuc_bun, 86, 3),
        "split_fire": (clean_con_gian, 82, 3),
        "split_fire_mini": (clean_con_gian, 56, 4),
        "fly_wood": (clean_nang_gat, 78, 5),
        "disrupt_water": (clean_chuot, 80, 4),
        "healer_wood": (clean_nam_moc, 80, 3),
        "boss_water": (clean_boss, 112, 4),
    }
    for eid, (eimg, esize, ebob) in enemy_bases.items():
        walk_frames = make_enemy_walk_frames(eimg, target_size=esize, bob_px=ebob)
        for idx, fimg in enumerate(walk_frames):
            frames[f"enemy_{eid}_f{idx}"] = fimg

    # 3. Các đạo cụ & biểu tượng HUD
    frames["prop_pad_rug"] = pad_rug_sprite
    frames["prop_shoe_shelf"] = shoe_shelf_sprite
    frames["icon_coin"] = draw_icon_coin(44)
    frames["icon_wallet"] = draw_icon_wallet(64)
    frames["icon_shoe_life"] = draw_icon_shoe_life(64)
    frames["proj_silica"] = draw_proj_silica_packet(44)
    for el in ("kim", "moc", "thuy", "hoa", "tho"):
        frames[f"el_{el}"] = draw_element_icon(el, 56)

    # 4. Đóng gói shelf-packing gọn vào Atlas kích thước tối ưu (chiều rộng 1024)
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

    atlas_h = cur_y + row_h + PADDING
    # Làm tròn chiều cao lên bội số của 16
    atlas_h = ((atlas_h + 15) // 16) * 16

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
    atlas_img.save(atlas_webp, format="WEBP", quality=86, method=6)
    with open(atlas_json, "w", encoding="utf-8") as f:
        json.dump(
            {
                "frames": json_frames,
                "meta": {
                    "app": "Gọn Tiệm, Sạch Phố Atlas Builder",
                    "version": "1.0",
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
        f"Saved atlas: {atlas_webp} ({ATLAS_W}x{atlas_h}, {len(json_frames)} frames, {atlas_webp.stat().st_size / 1024:.1f} KB)"
    )
    print(f"Saved atlas JSON: {atlas_json} ({atlas_json.stat().st_size / 1024:.1f} KB)")

    # Lưu ảnh kiểm tra độ trong suốt trên nền caro vào scratch/verify_atlas_preview.png
    checker = Image.new("RGBA", (ATLAS_W, atlas_h), (220, 220, 220, 255))
    cd = ImageDraw.Draw(checker)
    tile = 24
    for y in range(0, atlas_h, tile):
        for x in range(0, ATLAS_W, tile):
            if ((x // tile) + (y // tile)) % 2 == 1:
                cd.rectangle([x, y, x + tile, y + tile], fill=(182, 182, 182, 255))
    checker.alpha_composite(atlas_img)
    checker.save(SCRATCH_DIR / "verify_atlas_preview.png")


if __name__ == "__main__":
    pad_rug, shoe_shelf = extract_map_props_and_build_stage1()
    build_atlas(pad_rug, shoe_shelf)
