#!/usr/bin/env python3
"""
Dựng nền bản đồ Màn 2 "Tiệm Bánh Đầu Phố" (`public/assets/map_man2_tiem_banh.webp`, 720x1040 = 2x 360x520)
khớp 100% đường đi 2 ngả & 10 ô đặt món trong `src/core/shops/bakery.ts` (STAGE_2_DEFINITION).
- Cùng nét hoạt hình Đà Lạt ngày mưa viền nâu đậm (#2b1a12) của Màn 1.
- Cửa tiệm trên giữa (x=180, y=24) mở ra vỉa hè đá ướt mưa, thảm nâu sọc không chữ nước ngoài.
- Đường tách 2 ngả vòng quanh quầy bánh gỗ ở giữa (x 60..300, y 80..290) có tủ kính bánh, bột & 4 ô đặt món trong lòng quầy.
- Hợp ngả ở (180, 290) -> (180, 370) -> (300, 370) -> kệ bánh gỗ đèn vàng ấm ở (300, 460).
"""

from collections import deque
import json
import math
from pathlib import Path
import subprocess
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

REPO_ROOT = Path(__file__).resolve().parent.parent
ARTIFACT_DIR = Path(
    "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/19304d60-5004-4ace-9bc7-888771f25415"
)
SCRATCH_DIR = ARTIFACT_DIR / "scratch"
SVG_DIR = SCRATCH_DIR / "map2_svgs"
PNG_DIR = SCRATCH_DIR / "map2_pngs"
OUT_DIR = REPO_ROOT / "public" / "assets"

SVG_DIR.mkdir(parents=True, exist_ok=True)
PNG_DIR.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)

INK = (43, 26, 18, 255)
S = 2
W, H = 360 * S, 520 * S  # 720 x 1040 (đúng 2x khung logic 360x520)

# Toạ độ gốc từ STAGE_2_DEFINITION (src/core/shops/bakery.ts — KHÔNG ĐỔI SỐ)
STAGE2_PATHS = [
    [(180, 24), (180, 80), (60, 80), (60, 290), (180, 290), (180, 370), (300, 370), (300, 460)],
    [(180, 24), (180, 80), (300, 80), (300, 290), (180, 290), (180, 370), (300, 370), (300, 460)],
]
STAGE2_PADS = [
    ("pad_1", 110, 38),
    ("pad_2", 250, 38),
    ("pad_3", 180, 140),
    ("pad_4", 120, 205),
    ("pad_5", 240, 205),
    ("pad_6", 180, 250),
    ("pad_7", 105, 330),
    ("pad_8", 250, 325),
    ("pad_9", 235, 420),
    ("pad_10", 115, 425),
]

BAKERY_SHELF_RAW = ARTIFACT_DIR / "prop_bakery_shelf_raw_1795374871904.jpg"


def remove_white_bg_floodfill(im: Image.Image, white_thresh: int = 235, sat_thresh: int = 26) -> Image.Image:
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

    # Gọt nhẹ halo sáng sát biên trong suốt
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
                if lum > 208 and (max(r, g, b) - min(r, g, b)) < 36:
                    soften.append((x, y, 0))
                elif lum > 170 and (max(r, g, b) - min(r, g, b)) < 42:
                    soften.append((x, y, int(a * 0.35)))
    for x, y, na in soften:
        r, g, b, _ = pix[x, y]
        pix[x, y] = (r, g, b, na)

    return rgba


def trim_and_fit(im: Image.Image, target_w: int, target_h: int, pad: int = 4) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    cropped = im.crop(bbox)
    cw, ch = cropped.size
    scale = min((target_w - pad * 2) / cw, (target_h - pad * 2) / ch)
    nw = max(1, int(round(cw * scale)))
    nh = max(1, int(round(ch * scale)))
    rs = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    canvas.paste(rs, ((target_w - nw) // 2, (target_h - nh) // 2), rs)
    return canvas


def write_bakery_prop_svgs():
    """Tạo các đạo cụ tiệm bánh (tủ kính bánh, bao bột, giỏ bánh mì, thớt cán bột, chậu cây) cùng nét #2b1a12."""

    # 1. Tủ kính trưng bày bánh (đặt trên quầy gỗ giữa tiệm)
    pastry_case_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="280" height="190" viewBox="0 0 280 190">
  <defs>
    <linearGradient id="woodFrame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#c98648"/>
      <stop offset="100%" stop-color="#8b5126"/>
    </linearGradient>
    <linearGradient id="trayBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f5e3be"/>
      <stop offset="100%" stop-color="#dfc18d"/>
    </linearGradient>
    <linearGradient id="glassTint" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d8f6ff" stop-opacity="0.48"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#9ee2fa" stop-opacity="0.34"/>
    </linearGradient>
    <linearGradient id="breadGold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffcf6b"/>
      <stop offset="60%" stop-color="#e59535"/>
      <stop offset="100%" stop-color="#b5641b"/>
    </linearGradient>
  </defs>
  <!-- Bóng đổ nhẹ -->
  <rect x="14" y="20" width="256" height="158" rx="18" fill="#2b1a12" opacity="0.22"/>
  <!-- Khung tủ gỗ -->
  <rect x="10" y="12" width="258" height="158" rx="16" fill="url(#woodFrame)" stroke="#2b1a12" stroke-width="7"/>
  <!-- Mặt khay kem ấm bên trong tủ -->
  <rect x="24" y="26" width="230" height="130" rx="10" fill="url(#trayBg)" stroke="#2b1a12" stroke-width="5"/>
  <!-- Khay nướng inox 2 ngăn -->
  <rect x="34" y="36" width="100" height="110" rx="7" fill="#ebd4a6" stroke="#7c522c" stroke-width="3"/>
  <rect x="144" y="36" width="100" height="110" rx="7" fill="#ebd4a6" stroke="#7c522c" stroke-width="3"/>
  <!-- Bánh sừng bò (croissants) khay trái -->
  <g stroke="#2b1a12" stroke-width="4" stroke-linejoin="round">
    <path d="M46 68 Q64 44 86 48 Q108 44 122 68 Q104 82 84 80 Q64 82 46 68 Z" fill="url(#breadGold)"/>
    <path d="M68 50 Q70 66 64 78 M86 48 Q86 64 86 80 M103 52 Q100 66 105 78" fill="none" stroke="#8f4814" stroke-width="3"/>
    <path d="M46 116 Q64 92 86 96 Q108 92 122 116 Q104 130 84 128 Q64 130 46 116 Z" fill="url(#breadGold)"/>
    <path d="M68 98 Q70 114 64 126 M86 96 Q86 112 86 128 M103 100 Q100 114 105 126" fill="none" stroke="#8f4814" stroke-width="3"/>
  </g>
  <!-- Ổ bánh mì Việt Nam & bánh tròn khay phải -->
  <g stroke="#2b1a12" stroke-width="4" stroke-linejoin="round">
    <ellipse cx="194" cy="64" rx="40" ry="18" fill="url(#breadGold)" transform="rotate(-12 194 64)"/>
    <path d="M172 62 L185 55 M188 60 L201 53 M204 58 L216 52" stroke="#fff0c2" stroke-width="3.2" stroke-linecap="round"/>
    <circle cx="172" cy="116" r="20" fill="#e9a13e"/>
    <path d="M162 116 L182 116 M172 106 L172 126" stroke="#fff2cc" stroke-width="3" stroke-linecap="round"/>
    <circle cx="216" cy="116" r="20" fill="#f3b652"/>
    <circle cx="216" cy="116" r="9" fill="#d9673c" stroke="#2b1a12" stroke-width="3"/>
  </g>
  <!-- Lớp kính phản chiếu chéo -->
  <rect x="24" y="26" width="230" height="130" rx="10" fill="url(#glassTint)"/>
  <polygon points="48,28 84,28 40,154 26,154 26,90" fill="#ffffff" opacity="0.34"/>
  <polygon points="104,28 122,28 76,154 58,154" fill="#ffffff" opacity="0.24"/>
  <polygon points="186,28 214,28 168,154 140,154" fill="#ffffff" opacity="0.18"/>
  <!-- Viền kính trên -->
  <rect x="24" y="26" width="230" height="130" rx="10" fill="none" stroke="#2b1a12" stroke-width="5"/>
</svg>"""

    # 2. Bao bột mì bằng vải bố buộc dây thừng + vết bột trắng + muỗng gỗ
    flour_sack_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="260" height="240" viewBox="0 0 260 240">
  <defs>
    <radialGradient id="burlap1" cx="42%" cy="38%" r="60%">
      <stop offset="0%" stop-color="#f2dec0"/>
      <stop offset="68%" stop-color="#d5b281"/>
      <stop offset="100%" stop-color="#b18854"/>
    </radialGradient>
    <radialGradient id="burlap2" cx="40%" cy="35%" r="60%">
      <stop offset="0%" stop-color="#f7e8d0"/>
      <stop offset="70%" stop-color="#dcbe90"/>
      <stop offset="100%" stop-color="#ba925c"/>
    </radialGradient>
  </defs>
  <!-- Vết bột mì vương nhẹ trên sàn -->
  <ellipse cx="152" cy="196" rx="76" ry="26" fill="#fffaf0" opacity="0.72"/>
  <circle cx="212" cy="182" r="14" fill="#fffaf0" opacity="0.65"/>
  <circle cx="88" cy="208" r="11" fill="#fffaf0" opacity="0.6"/>
  <!-- Bóng đổ -->
  <ellipse cx="122" cy="186" rx="88" ry="30" fill="#2b1a12" opacity="0.24"/>
  <!-- Bao bột sau bên trái -->
  <g stroke="#2b1a12" stroke-width="7" stroke-linejoin="round">
    <path d="M40 94 C34 148 48 188 94 190 C140 192 156 154 148 96 C144 68 122 52 94 52 C64 52 44 68 40 94 Z" fill="url(#burlap1)"/>
    <!-- Cổ bao buộc dây -->
    <path d="M72 54 L60 26 Q94 18 126 28 L114 54 Z" fill="#dfc091"/>
    <path d="M67 54 Q94 64 120 54" fill="none" stroke="#8a4f24" stroke-width="9" stroke-linecap="round"/>
    <path d="M67 54 Q94 64 120 54" fill="none" stroke="#2b1a12" stroke-width="3.5" stroke-linecap="round"/>
  </g>
  <!-- Bao bột trước mở miệng đầy bột trắng -->
  <g stroke="#2b1a12" stroke-width="7" stroke-linejoin="round">
    <path d="M98 118 C92 170 112 206 164 206 C214 206 232 172 224 120 C220 92 200 80 162 80 C124 80 102 94 98 118 Z" fill="url(#burlap2)"/>
    <!-- Miệng bao gập viền & bột trắng mịn -->
    <ellipse cx="162" cy="96" rx="54" ry="24" fill="#e5c89b"/>
    <ellipse cx="162" cy="94" rx="44" ry="18" fill="#fffdf6" stroke="#2b1a12" stroke-width="5"/>
    <path d="M134 92 Q162 74 190 92" fill="#fffdf6" stroke="#e4d8c0" stroke-width="3"/>
    <!-- Nét vải bố khâu dọc -->
    <path d="M126 138 Q162 150 198 138" fill="none" stroke="#a67c4a" stroke-width="4" stroke-dasharray="9 7" stroke-linecap="round"/>
    <!-- Muỗng gỗ múc bột -->
    <path d="M174 86 L218 52" stroke="#8d5529" stroke-width="11" stroke-linecap="round"/>
    <path d="M174 86 L218 52" stroke="#2b1a12" stroke-width="4" stroke-linecap="round"/>
  </g>
  <!-- Nét bông lúa vẽ mộc mạc (không chữ) trên mặt bao -->
  <path d="M162 150 L162 184 M162 162 L150 154 M162 162 L174 154 M162 172 L150 164 M162 172 L174 164" stroke="#8b5a2b" stroke-width="4" stroke-linecap="round"/>
</svg>"""

    # 3. Giỏ mây đựng bánh mì Việt Nam nóng giòn (đặt góc trên phải / quầy)
    bread_basket_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
  <defs>
    <linearGradient id="loafG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffd578"/>
      <stop offset="65%" stop-color="#e39234"/>
      <stop offset="100%" stop-color="#b05e18"/>
    </linearGradient>
    <linearGradient id="wickerG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d79b57"/>
      <stop offset="100%" stop-color="#9e622b"/>
    </linearGradient>
  </defs>
  <ellipse cx="122" cy="194" rx="78" ry="26" fill="#2b1a12" opacity="0.24"/>
  <!-- 3 ổ bánh mì dài cắm trong giỏ -->
  <g stroke="#2b1a12" stroke-width="6.5" stroke-linejoin="round">
    <ellipse cx="82" cy="84" rx="22" ry="58" fill="url(#loafG)" transform="rotate(-18 82 84)"/>
    <ellipse cx="122" cy="74" rx="23" ry="62" fill="url(#loafG)" transform="rotate(2 122 74)"/>
    <ellipse cx="162" cy="88" rx="22" ry="56" fill="url(#loafG)" transform="rotate(20 162 88)"/>
    <!-- Vết rạch bánh mì vàng giòn -->
    <path d="M74 62 L85 74 M80 86 L91 98 M116 48 L128 60 M116 74 L128 86 M158 64 L166 78 M152 88 L161 100" stroke="#fff1c4" stroke-width="4" stroke-linecap="round"/>
  </g>
  <!-- Thân giỏ mây đan -->
  <g stroke="#2b1a12" stroke-width="7" stroke-linejoin="round">
    <path d="M48 118 L64 190 Q120 212 176 190 L192 118 Z" fill="url(#wickerG)"/>
    <!-- Viền miệng giỏ mây -->
    <ellipse cx="120" cy="118" rx="74" ry="18" fill="#e6b06e"/>
    <path d="M62 146 Q120 162 178 146 M68 172 Q120 186 172 172" fill="none" stroke="#6c3f18" stroke-width="4.5"/>
    <path d="M88 132 L94 196 M120 135 L120 200 M152 132 L146 196" fill="none" stroke="#6c3f18" stroke-width="4"/>
  </g>
</svg>"""

    # 4. Thớt gỗ cán bột + cây lăn bột (đặt góc dưới trái của quầy bánh)
    rolling_dough_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="220" height="160" viewBox="0 0 220 160">
  <rect x="18" y="28" width="184" height="114" rx="18" fill="#2b1a12" opacity="0.22"/>
  <rect x="14" y="22" width="184" height="112" rx="16" fill="#deb072" stroke="#2b1a12" stroke-width="6.5"/>
  <path d="M26 52 L184 52 M26 98 L184 98" stroke="#b98648" stroke-width="3" opacity="0.7"/>
  <!-- Bột mịn trắng -->
  <ellipse cx="106" cy="78" rx="64" ry="38" fill="#fffaf0" opacity="0.75"/>
  <!-- Miếng bột bánh đang cán -->
  <path d="M62 74 C60 52 92 44 120 50 C148 56 158 76 144 96 C130 114 82 112 66 96 Z" fill="#f9e6ba" stroke="#2b1a12" stroke-width="5"/>
  <!-- Cây lăn bột gỗ -->
  <g transform="rotate(-24 114 78)" stroke="#2b1a12" stroke-width="5.5" stroke-linejoin="round">
    <rect x="40" y="70" width="22" height="14" rx="6" fill="#9a5c2c"/>
    <rect x="164" y="70" width="22" height="14" rx="6" fill="#9a5c2c"/>
    <rect x="60" y="63" width="106" height="28" rx="10" fill="#c98648"/>
    <line x1="72" y1="71" x2="154" y2="71" stroke="#f0be82" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>"""

    # 5. Khay nướng bánh nhỏ dọc tường trái (hẹp ngang để không đụng đường đi)
    side_rack_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="130" height="260" viewBox="0 0 130 260">
  <rect x="14" y="18" width="104" height="228" rx="14" fill="#2b1a12" opacity="0.22"/>
  <rect x="10" y="12" width="104" height="228" rx="14" fill="#9b5f31" stroke="#2b1a12" stroke-width="6.5"/>
  <!-- 3 khay bánh mới ra lò -->
  <g stroke="#2b1a12" stroke-width="4.5">
    <rect x="22" y="26" width="80" height="58" rx="8" fill="#7c8794"/>
    <circle cx="44" cy="48" r="11" fill="#f0aa48"/>
    <circle cx="78" cy="48" r="11" fill="#f0aa48"/>
    <circle cx="44" cy="70" r="11" fill="#e69738"/>
    <circle cx="78" cy="70" r="11" fill="#e69738"/>

    <rect x="22" y="96" width="80" height="58" rx="8" fill="#7c8794"/>
    <ellipse cx="62" cy="114" rx="28" ry="10" fill="#f5b855"/>
    <ellipse cx="62" cy="138" rx="28" ry="10" fill="#eb9f3c"/>

    <rect x="22" y="166" width="80" height="58" rx="8" fill="#7c8794"/>
    <circle cx="45" cy="195" r="15" fill="#f2b24e"/>
    <circle cx="79" cy="195" r="15" fill="#e89a38"/>
  </g>
</svg>"""

    # 6. Chậu cây xanh Đà Lạt nhỏ nhắn đặt dọc tường
    potted_herb_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
  <ellipse cx="78" cy="122" rx="40" ry="15" fill="#2b1a12" opacity="0.24"/>
  <!-- Chậu đất nung -->
  <path d="M44 82 L54 124 Q75 134 96 124 L106 82 Z" fill="#c96b3b" stroke="#2b1a12" stroke-width="6" stroke-linejoin="round"/>
  <rect x="38" y="72" width="74" height="16" rx="7" fill="#df824e" stroke="#2b1a12" stroke-width="6"/>
  <!-- Tán lá xanh tươi -->
  <g stroke="#2b1a12" stroke-width="5.5" stroke-linejoin="round">
    <ellipse cx="52" cy="58" rx="22" ry="14" fill="#469e58" transform="rotate(-30 52 58)"/>
    <ellipse cx="98" cy="58" rx="22" ry="14" fill="#469e58" transform="rotate(30 98 58)"/>
    <ellipse cx="62" cy="40" rx="18" ry="22" fill="#5ec26e" transform="rotate(-15 62 40)"/>
    <ellipse cx="88" cy="40" rx="18" ry="22" fill="#5ec26e" transform="rotate(15 88 40)"/>
    <ellipse cx="75" cy="48" rx="16" ry="20" fill="#79d67f"/>
  </g>
</svg>"""

    svgs = {
        "pastry_case.svg": pastry_case_svg,
        "flour_sack.svg": flour_sack_svg,
        "bread_basket.svg": bread_basket_svg,
        "rolling_dough.svg": rolling_dough_svg,
        "side_rack.svg": side_rack_svg,
        "potted_herb.svg": potted_herb_svg,
    }
    for name, content in svgs.items():
        (SVG_DIR / name).write_text(content, encoding="utf-8")

    subprocess.run(
        ["node", str(REPO_ROOT / "scripts" / "render_svgs.mjs"), str(SVG_DIR), str(PNG_DIR)],
        check=True,
    )


def load_stage1_pad_rug() -> Image.Image:
    backup_atlas = SCRATCH_DIR / "stage1_atlas_backup" / "gon_tiem_atlas.webp"
    backup_json = SCRATCH_DIR / "stage1_atlas_backup" / "gon_tiem_atlas.json"
    atlas = Image.open(backup_atlas).convert("RGBA")
    data = json.loads(backup_json.read_text(encoding="utf-8"))
    f = data["frames"]["prop_pad_rug"]["frame"]
    return atlas.crop((f["x"], f["y"], f["x"] + f["w"], f["y"] + f["h"]))


def build_bakery_shelf_sprite() -> Image.Image:
    raw = Image.open(BAKERY_SHELF_RAW)
    clean = remove_white_bg_floodfill(raw, white_thresh=234, sat_thresh=26)
    # Cắt bỏ phần dây đèn quá dài phía trên cùng nếu cần để kệ to rõ hơn khi đặt ở góc dưới phải
    bbox = clean.getbbox()
    if bbox:
        clean = clean.crop(bbox)
    shelf_out = SCRATCH_DIR / "prop_bakery_shelf_clean.png"
    clean.save(shelf_out)
    return clean


def draw_bakery_tile_floor() -> Image.Image:
    """Nền gạch bông kem-mật ong ấm cúng cho tiệm bánh Đà Lạt (dịu mắt, nổi quái và tháp)."""
    bg = Image.new("RGBA", (W, H), (218, 174, 118, 255))
    d = ImageDraw.Draw(bg)
    tile = 48
    c1 = (223, 182, 128, 255)
    c2 = (207, 160, 105, 255)
    grout = (166, 120, 74, 255)

    for row, y in enumerate(range(0, H, tile)):
        for col, x in enumerate(range(0, W, tile)):
            fill = c1 if (row + col) % 2 == 0 else c2
            d.rectangle([x, y, x + tile, y + tile], fill=fill, outline=grout, width=2)
            if (row + col) % 2 == 0:
                d.rectangle([x + 7, y + 7, x + tile - 7, y + tile - 7], outline=(236, 202, 152, 130), width=1)
            else:
                d.ellipse([x + 20, y + 20, x + 28, y + 28], fill=(192, 145, 90, 105))

    # Dải tường gỗ ấm ở mép trên cùng của tiệm
    d.rectangle([0, 0, W, 24], fill=(122, 74, 38, 255))
    d.line([(0, 24), (W, 24)], fill=INK, width=4)
    return bg


def draw_wet_cobblestone(w: int, h: int) -> Image.Image:
    """Vẽ mảng đá vỉa hè ướt mưa Đà Lạt (xanh lam trầm + vũng nước mưa lấp lánh, không dính thảm cũ)."""
    im = Image.new("RGBA", (w, h), (78, 112, 136, 255))
    d = ImageDraw.Draw(im)
    stone_palette = [
        (104, 140, 166, 255),
        (92, 128, 154, 255),
        (114, 152, 176, 255),
        (86, 120, 146, 255),
    ]
    row_h = 20
    for row_idx, y in enumerate(range(-4, h + row_h, row_h)):
        x_off = (row_idx % 2) * 14 - 8
        for col_idx, x in enumerate(range(x_off, w + 32, 30)):
            col = stone_palette[(row_idx * 5 + col_idx * 3) % len(stone_palette)]
            d.rounded_rectangle([x + 2, y + 2, x + 27, y + row_h - 2], radius=6, fill=col, outline=(46, 70, 90, 255), width=2)
            # Bóng nước mỏng trên mặt đá ướt
            d.line([(x + 7, y + 6), (x + 17, y + 6)], fill=(172, 214, 236, 150), width=2)
    # Vũng nước mưa phản sáng ngoài cửa
    d.ellipse([w // 2 - 46, h // 2 - 14, w // 2 + 46, h // 2 + 16], fill=(138, 198, 228, 120))
    d.ellipse([w // 2 - 30, h // 2 - 6, w // 2 + 22, h // 2 + 8], fill=(198, 238, 255, 115))
    return im


def draw_rainy_entrance(bg: Image.Image, _map1: Image.Image):
    """Vỉa hè đá ướt mưa Đà Lạt + cửa kính mở ở trên giữa (x=180, y=24 -> 2x: 360, 48), không chữ nước ngoài."""
    # Cửa sổ mưa nhỏ hai bên tường trên (nhìn ra phố mưa Đà Lạt)
    win_stone = draw_wet_cobblestone(118, 34)
    bg.paste(win_stone, (16, 4))
    bg.paste(win_stone.transpose(Image.Transpose.FLIP_LEFT_RIGHT), (W - 134, 4))
    wd = ImageDraw.Draw(bg)
    for wx in (16, W - 134):
        wd.rectangle([wx, 4, wx + 118, 38], outline=INK, width=4)
        wd.line([(wx + 59, 4), (wx + 59, 38)], fill=INK, width=3)
        wd.line([(wx + 12, 12), (wx + 24, 30)], fill=(215, 244, 255, 150), width=2)
        wd.line([(wx + 76, 10), (wx + 88, 28)], fill=(215, 244, 255, 150), width=2)

    # Cổng cửa chính tiệm bánh ở giữa trên (x=284..436, y=0..82 -> hoàn toàn thoáng với pad_1=220 & pad_2=500)
    door_x1, door_x2, door_y2 = 284, 436, 82
    door_w = door_x2 - door_x1
    cobble_door = draw_wet_cobblestone(door_w, door_y2)
    bg.paste(cobble_door, (door_x1, 0))

    # Mái hiên sọc đỏ đất - kem đặc trưng tiệm bánh Đà Lạt phía trên cửa
    d = ImageDraw.Draw(bg)
    stripe_w = 19
    for idx, sx in enumerate(range(door_x1 - 8, door_x2 + 8, stripe_w)):
        col = (198, 84, 54, 255) if idx % 2 == 0 else (252, 238, 208, 255)
        d.rectangle([sx, 0, min(door_x2 + 8, sx + stripe_w), 21], fill=col, outline=INK, width=3)

    # Trụ khung cửa gỗ hai bên
    d.rectangle([door_x1 - 8, 18, door_x1 + 5, door_y2 + 2], fill=(128, 76, 38, 255), outline=INK, width=4)
    d.rectangle([door_x2 - 5, 18, door_x2 + 8, door_y2 + 2], fill=(128, 76, 38, 255), outline=INK, width=4)

    # Cánh cửa kính mở vào gọn gàng sát mép khung phải (dừng ở x=450, KHÔNG chạm pad_2 bắt đầu ở x=458)
    glass_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glass_layer)
    door_poly = [(door_x2 - 2, 22), (door_x2 + 16, 46), (door_x2 + 16, 94), (door_x2 - 2, 76)]
    gd.polygon(door_poly, fill=(198, 236, 250, 185))
    gd.line(door_poly + [door_poly[0]], fill=(124, 74, 40, 255), width=5)
    gd.line(door_poly + [door_poly[0]], fill=INK, width=2)
    gd.line([(door_x2 + 10, 58), (door_x2 + 10, 74)], fill=(238, 196, 86, 255), width=4)
    bg.alpha_composite(glass_layer)


def draw_central_bakery_counter(bg: Image.Image, props: dict[str, Image.Image]):
    """
    Vẽ QUẦY BÁNH GỖ ở giữa (giữa 2 ngả đường x 60..300, y 80..290 -> 2x: 120..600, 160..580).
    Trong lòng quầy có mặt bàn gỗ ấm, 2 tủ kính trưng bày bánh (trên-trái & trên-phải),
    thớt cán bột + giỏ bánh nhỏ ở 2 góc dưới, để trống sạch sẽ cho 4 ô đặt món pad_3..pad_6!
    """
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    # Vùng quầy bên trong 2 nhánh đường (mép trong đường ở x=150..570, y=190..550)
    x1, y1, x2, y2 = 158, 198, 562, 548

    # Bóng đổ mềm của quầy xuống sàn gạch
    d.rounded_rectangle([x1 + 5, y1 + 8, x2 + 7, y2 + 9], radius=22, fill=(43, 26, 18, 92))
    # Thân gỗ nâu trầm viền ngoài quầy
    d.rounded_rectangle([x1, y1, x2, y2], radius=20, fill=(138, 82, 42, 255), outline=INK, width=5)
    # Mặt bàn gỗ thông mật ong sáng bên trên (chừa rộng cho pad_6 ở y=500, bán kính 42 -> 542)
    d.rounded_rectangle([x1 + 9, y1 + 9, x2 - 9, y2 - 10], radius=14, fill=(216, 160, 96, 255), outline=INK, width=3)

    # Vân ván gỗ ngang tự nhiên trên mặt quầy
    for py in range(y1 + 34, y2 - 14, 26):
        d.line([(x1 + 12, py), (x2 - 12, py)], fill=(176, 120, 64, 145), width=2)
    # Ánh sáng phản chiếu nhẹ cạnh trên mặt quầy
    d.rounded_rectangle([x1 + 15, y1 + 14, x2 - 15, y1 + 26], radius=6, fill=(246, 210, 150, 108))

    # Rắc nhẹ vài đốm bột mì mờ gần góc dưới trái quầy
    d.ellipse([180, 466, 270, 528], fill=(255, 250, 236, 75))

    bg.alpha_composite(layer)

    # Dán 2 Tủ Kính Bánh ở 2 góc trên của quầy — KHÔNG chạm pad_3 (360,280), pad_4 (240,410), pad_5 (480,410)!
    case_small = trim_and_fit(props["pastry_case"], 124, 86, pad=2)
    bg.alpha_composite(case_small, (172, 212))
    bg.alpha_composite(case_small.transpose(Image.Transpose.FLIP_LEFT_RIGHT), (424, 212))

    # Góc dưới trái quầy: thớt cán bột mini (không chạm pad_4 240,410 hay pad_6 360,500)
    dough_mini = trim_and_fit(props["rolling_dough"], 108, 76, pad=2)
    bg.alpha_composite(dough_mini, (174, 462))

    # Góc dưới phải quầy: giỏ bánh mì nhỏ xinh
    basket_mini = trim_and_fit(props["bread_basket"], 84, 84, pad=2)
    bg.alpha_composite(basket_mini, (462, 454))


def draw_dual_paths(bg: Image.Image):
    """Vẽ 2 ngả đường đi khớp TUYỆT ĐỐI 100% STAGE_2_DEFINITION.paths[0] và paths[1]."""
    path_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pd = ImageDraw.Draw(path_layer)

    scaled_paths = []
    for path in STAGE2_PATHS:
        pts = [(x * S, y * S) for x, y in path]
        pts[0] = (pts[0][0], pts[0][1] + 18)
        scaled_paths.append(pts)

    # Dùng chiều rộng lẻ (67, 59, 51) khớp tròn đối xứng (33, 29, 25) để mọi khớp nối góc phẳng tuyệt đối 0px gợn!
    # 1. Bóng đổ mềm dưới lối đi
    for pts in scaled_paths:
        for i in range(len(pts) - 1):
            pd.line([pts[i], pts[i + 1]], fill=(58, 34, 18, 90), width=67)
        for x, y in pts:
            pd.ellipse([x - 33, y - 33, x + 33, y + 33], fill=(58, 34, 18, 90))

    # 2. Viền nâu đậm ngoài cùng
    for pts in scaled_paths:
        for i in range(len(pts) - 1):
            pd.line([pts[i], pts[i + 1]], fill=(74, 44, 24, 255), width=59)
        for x, y in pts:
            pd.ellipse([x - 29, y - 29, x + 29, y + 29], fill=(74, 44, 24, 255))

    # 3. Lòng đường màu kem-vàng dịu ấm (tương phản rõ cả Bụi Bột trắng lẫn Than Hồng & Ruồi)
    for pts in scaled_paths:
        for i in range(len(pts) - 1):
            pd.line([pts[i], pts[i + 1]], fill=(235, 206, 158, 255), width=51)
        for x, y in pts:
            pd.ellipse([x - 25, y - 25, x + 25, y + 25], fill=(235, 206, 158, 255))

    # 4. Chỉ viền mảnh giữa đường
    for pts in scaled_paths:
        for i in range(len(pts) - 1):
            pd.line([pts[i], pts[i + 1]], fill=(144, 96, 54, 145), width=4)

    # Dấu chân ướt / vết bột nhẹ dẫn từ cửa vào đoạn tách ngả
    for fx, fy in [(352, 96), (366, 120), (350, 144), (318, 160), (402, 160)]:
        pd.ellipse([fx - 5, fy - 7, fx + 5, fy + 7], fill=(134, 90, 52, 85))
        pd.ellipse([fx - 3, fy + 5, fx + 3, fy + 10], fill=(134, 90, 52, 75))

    bg.alpha_composite(path_layer)

    # Thảm chùi chân nâu sọc gọn sạch ở cửa vào (360, 58) — KHÔNG CHỮ NƯỚC NGOÀI!
    mat_d = ImageDraw.Draw(bg)
    mx, my = 180 * S, 24 * S + 10
    mat_d.rounded_rectangle([mx - 48, my - 20, mx + 48, my + 20], radius=8, fill=(132, 84, 44, 255), outline=INK, width=4)
    for stripe_y in range(my - 12, my + 14, 7):
        mat_d.line([(mx - 42, stripe_y), (mx + 42, stripe_y)], fill=(168, 114, 64, 255), width=3)


def main():
    write_bakery_prop_svgs()
    props = {
        "pastry_case": Image.open(PNG_DIR / "pastry_case.png").convert("RGBA"),
        "flour_sack": Image.open(PNG_DIR / "flour_sack.png").convert("RGBA"),
        "bread_basket": Image.open(PNG_DIR / "bread_basket.png").convert("RGBA"),
        "rolling_dough": Image.open(PNG_DIR / "rolling_dough.png").convert("RGBA"),
        "side_rack": Image.open(PNG_DIR / "side_rack.png").convert("RGBA"),
        "potted_herb": Image.open(PNG_DIR / "potted_herb.png").convert("RGBA"),
    }
    map1 = Image.open(OUT_DIR / "map_man1_tiem_giay.webp").convert("RGBA")
    pad_rug = load_stage1_pad_rug()
    bakery_shelf = build_bakery_shelf_sprite()

    bg = draw_bakery_tile_floor()
    draw_rainy_entrance(bg, map1)

    # Đạo cụ trang trí các góc tiệm bánh (tránh 100% đường đi và 10 ô đặt món)
    # 1. Góc trên trái: Bao bột mì (x=12..142, y=18..134 -> pad_1 ở 220,76 nên hoàn toàn thoáng)
    bg.alpha_composite(trim_and_fit(props["flour_sack"], 130, 120, pad=2), (14, 18))

    # 2. Góc trên phải: Giỏ bánh mì + chậu thảo mộc (x=578..706, y=14..132 -> pad_2 ở 500,76 thoáng)
    bg.alpha_composite(trim_and_fit(props["bread_basket"], 114, 114, pad=2), (590, 16))
    bg.alpha_composite(trim_and_fit(props["potted_herb"], 64, 64, pad=2), (552, 16))

    # 3. Tường trái giữa (x=4..82, y=260..460 — đường trái bắt đầu từ x=90)
    bg.alpha_composite(trim_and_fit(props["side_rack"], 76, 152, pad=2), (6, 290))

    # 4. Tường phải giữa (x=638..716, y=280..450 — đường phải kết thúc ở x=630)
    bg.alpha_composite(trim_and_fit(props["potted_herb"], 72, 72, pad=2), (640, 270))
    bg.alpha_composite(trim_and_fit(props["potted_herb"], 68, 68, pad=2), (642, 430))

    # 5. Góc dưới trái: Bao bột lớn + chậu cây (pad_10 ở 230,850 có đáy ở 893 -> x=14..156, y=892..1026 sạch đẹp)
    bg.alpha_composite(trim_and_fit(props["flour_sack"], 144, 134, pad=2), (16, 892))
    bg.alpha_composite(trim_and_fit(props["potted_herb"], 76, 76, pad=2), (154, 948))

    # 6. Dưới giữa (khoảng trống ấm dưới pad_9 & pad_10): giỏ bánh dự trữ
    bg.alpha_composite(trim_and_fit(props["bread_basket"], 96, 96, pad=2), (312, 924))

    # Vẽ 2 ngả đường đi & Quầy bánh ở giữa
    draw_dual_paths(bg)
    draw_central_bakery_counter(bg, props)

    # Dán 10 THẢM CÓI TRÒN (ô đặt món) khớp 100% STAGE_2_DEFINITION.pads
    pad_on_map = pad_rug.resize((84, 84), Image.Resampling.LANCZOS)
    for _, px, py in STAGE2_PADS:
        cx, cy = px * S, py * S
        sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        sd = ImageDraw.Draw(sh)
        sd.ellipse([cx - 42, cy - 40, cx + 42, cy + 44], fill=(46, 28, 16, 108))
        bg.alpha_composite(sh)
        bg.alpha_composite(pad_on_map, (cx - 42, cy - 42))

    # Ánh đèn vàng ấm & KỆ BÁNH GỖ ở cuối đường (300*2, 460*2 = 600, 920) — KHÔNG CHE pad_9 (470, 840)!
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for rad, alpha in [(136, 22), (96, 36), (60, 48)]:
        gd.ellipse([616 - rad, 920 - rad, 616 + rad, 920 + rad], fill=(255, 224, 118, alpha))
    bg.alpha_composite(glow)

    shelf_placed = trim_and_fit(bakery_shelf, 172, 186, pad=2)
    bg.alpha_composite(shelf_placed, (534, 838))

    # Khung viền gỗ trầm bo toàn tiệm
    frame_overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fd = ImageDraw.Draw(frame_overlay)
    fd.rectangle([0, 0, W - 1, H - 1], outline=(56, 34, 18, 225), width=8)
    bg.alpha_composite(frame_overlay)

    map_out = OUT_DIR / "map_man2_tiem_banh.webp"
    bg.convert("RGB").save(map_out, format="WEBP", quality=84, method=6)
    print(f"Saved Stage 2 map: {map_out} ({W}x{H}, {map_out.stat().st_size / 1024:.1f} KB)")

    # Ảnh kiểm tra khớp toạ độ đường đi + 10 ô
    chk = bg.copy()
    cd = ImageDraw.Draw(chk)
    for path in STAGE2_PATHS:
        pts = [(x * S, y * S) for x, y in path]
        for i in range(len(pts) - 1):
            cd.line([pts[i], pts[i + 1]], fill=(0, 255, 255, 220), width=3)
        for x, y in pts:
            cd.ellipse([x - 7, y - 7, x + 7, y + 7], fill=(0, 255, 255, 255))
    for pid, px, py in STAGE2_PADS:
        cx, cy = px * S, py * S
        cd.ellipse([cx - 38, cy - 38, cx + 38, cy + 38], outline=(255, 64, 255, 255), width=3)
        cd.text((cx - 16, cy - 6), pid, fill=(255, 255, 255, 255))
    chk_out = SCRATCH_DIR / "verify_map2_alignment.png"
    chk.save(chk_out)
    print(f"Saved alignment verify: {chk_out}")


if __name__ == "__main__":
    main()
