#!/usr/bin/env python3
"""
Vẽ lại hoàn toàn mới nền bản đồ Màn 1 "Tiệm Giày Hẻm Dốc" (720x960 = 2x khung logic 360x480)
dạng vector SVG (render qua Playwright Chromium `scripts/render_svgs.mjs`) + ghép Pillow,
đúng phương pháp Màn 2 & Màn 3 — KHÔNG cắt ghép từ ảnh mẫu cũ.
Khớp TUYỆT ĐỐI 100% đường chữ S (2 khúc cua chữ U) và 9 ô đặt món trong `STAGE_1_DEFINITION`.
Không chữ tiếng nước ngoài.
"""

from __future__ import annotations

import pathlib
import subprocess
from PIL import Image, ImageDraw

REPO_ROOT = pathlib.Path("/home/antigravity/ltckha/giang-ho-ai")
OUT_DIR = REPO_ROOT / "public" / "assets"
SCRATCH_DIR = pathlib.Path(
    "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/f27c1771-a6ca-4307-ac45-cbf7e4715aff/scratch"
)
SVG_DIR = SCRATCH_DIR / "stage1_v2_map_svgs"
PNG_DIR = SCRATCH_DIR / "stage1_v2_map_pngs"

SVG_DIR.mkdir(parents=True, exist_ok=True)
PNG_DIR.mkdir(parents=True, exist_ok=True)

S = 2
W, H = 360 * S, 480 * S  # 720 x 960
INK = (43, 26, 18, 255)  # #2b1a12

# Đúng 100% STAGE_1_DEFINITION trong src/core/tdDefinitions.ts
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


def trim_and_fit(im: Image.Image, target_w: int, target_h: int, pad: int = 2) -> Image.Image:
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


def write_shoe_shop_svgs():
    """Vẽ toàn bộ đạo cụ Tiệm Giày Hẻm Dốc Đà Lạt dạng vector SVG sắc nét cùng nét #2b1a12."""

    # 1. Kệ giày gỗ 3 tầng trưng bày dưới ánh đèn vàng ấm (cuối đường 304, 455 -> 608, 910)
    shoe_shelf_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="300" height="290" viewBox="0 0 300 290">
  <defs>
    <linearGradient id="shelfWood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d49354"/>
      <stop offset="100%" stop-color="#8f5324"/>
    </linearGradient>
    <linearGradient id="shelfBack" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#693b1a"/>
      <stop offset="100%" stop-color="#4b2912"/>
    </linearGradient>
    <linearGradient id="lampCone" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff0a8" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#ffd452" stop-opacity="0.0"/>
    </linearGradient>
  </defs>
  <!-- Bóng đổ dưới kệ -->
  <ellipse cx="150" cy="268" rx="124" ry="18" fill="#2b1a12" opacity="0.28"/>
  <!-- Mái đèn vàng ấm treo trên nóc kệ -->
  <polygon points="94,46 206,46 260,152 40,152" fill="url(#lampCone)"/>
  <!-- Thân tủ kệ gỗ 3 tầng -->
  <g stroke="#2b1a12" stroke-width="6.5" stroke-linejoin="round">
    <rect x="26" y="44" width="248" height="220" rx="14" fill="url(#shelfWood)"/>
    <!-- 3 hộc tủ tối ấm bên trong -->
    <rect x="42" y="60" width="216" height="58" rx="6" fill="url(#shelfBack)"/>
    <rect x="42" y="128" width="216" height="58" rx="6" fill="url(#shelfBack)"/>
    <rect x="42" y="196" width="216" height="54" rx="6" fill="url(#shelfBack)"/>
    <!-- Chụp đèn đồng vàng ấm phía trên kệ -->
    <path d="M114 44 Q150 12 186 44 Z" fill="#f0b63e"/>
    <ellipse cx="150" cy="44" rx="22" ry="8" fill="#fff3b0"/>
    <rect x="144" y="8" width="12" height="16" rx="4" fill="#8f5324"/>
  </g>
  <!-- Tầng 1 (trên): Đôi giày thể thao đỏ-kem & Đôi giày xanh lam gọn gàng -->
  <g stroke="#2b1a12" stroke-width="4.5" stroke-linejoin="round">
    <!-- Giày đỏ trái -->
    <path d="M56 106 L58 84 Q72 80 86 90 L104 92 Q112 96 112 106 Z" fill="#e85242"/>
    <rect x="54" y="104" width="60" height="9" rx="4" fill="#fff7e2"/>
    <line x1="78" y1="88" x2="88" y2="94" stroke="#fff7e2" stroke-width="3"/>
    <!-- Giày xanh lam giữa -->
    <path d="M126 106 L128 84 Q142 80 156 90 L174 92 Q182 96 182 106 Z" fill="#3b9be8"/>
    <rect x="124" y="104" width="60" height="9" rx="4" fill="#fff7e2"/>
    <!-- Giày vàng chanh phải -->
    <path d="M196 106 L198 86 Q210 82 222 90 L240 93 Q246 97 246 106 Z" fill="#f5c036"/>
    <rect x="194" y="104" width="54" height="9" rx="4" fill="#fff7e2"/>
  </g>
  <!-- Tầng 2 (giữa): Đôi bốt da nâu & Đôi giày vải xanh lá & Giày hồng -->
  <g stroke="#2b1a12" stroke-width="4.5" stroke-linejoin="round">
    <!-- Bốt da nâu -->
    <path d="M56 176 L58 140 L82 140 L86 160 L108 164 Q114 168 114 176 Z" fill="#b5652c"/>
    <rect x="54" y="174" width="62" height="9" rx="3" fill="#462b1a"/>
    <!-- Giày xanh lá -->
    <path d="M128 176 L130 154 Q144 150 158 159 L176 162 Q184 166 184 176 Z" fill="#52b365"/>
    <rect x="126" y="174" width="60" height="9" rx="4" fill="#fff7e2"/>
    <!-- Giày da trắng kem -->
    <path d="M196 176 L198 154 Q212 150 226 159 L242 162 Q248 166 248 176 Z" fill="#f7e6c4"/>
    <rect x="194" y="174" width="56" height="9" rx="4" fill="#c98952"/>
  </g>
  <!-- Tầng 3 (dưới): Hộp giày gọn gàng & Đôi dép ấm -->
  <g stroke="#2b1a12" stroke-width="4.5" stroke-linejoin="round">
    <rect x="56" y="212" width="62" height="32" rx="5" fill="#e6be82"/>
    <rect x="52" y="206" width="70" height="12" rx="4" fill="#f4d59f"/>
    <circle cx="87" cy="228" r="5" fill="#7c4720"/>

    <path d="M134 242 L136 222 Q150 218 164 226 L180 229 Q186 233 186 242 Z" fill="#e8794c"/>
    <rect x="132" y="238" width="56" height="8" rx="4" fill="#fff7e2"/>

    <path d="M198 242 L200 220 L218 220 L222 230 L242 232 Q246 236 246 242 Z" fill="#8b62a8"/>
    <rect x="196" y="238" width="52" height="8" rx="4" fill="#fff7e2"/>
  </g>
  <!-- Ngôi sao sáng bóng trên kệ -->
  <polygon points="244,44 248,54 258,58 248,62 244,72 240,62 230,58 240,54" fill="#ffe680" stroke="#2b1a12" stroke-width="3"/>
</svg>"""

    # 2. Ghế đôn thử giày bọc nệm cam-kem ấm cúng
    fitting_stool_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="180" height="160" viewBox="0 0 180 160">
  <ellipse cx="92" cy="134" rx="62" ry="18" fill="#2b1a12" opacity="0.24"/>
  <!-- 4 chân gỗ -->
  <g stroke="#2b1a12" stroke-width="6" stroke-linejoin="round">
    <rect x="38" y="84" width="18" height="48" rx="6" fill="#8c5224"/>
    <rect x="124" y="84" width="18" height="48" rx="6" fill="#8c5224"/>
    <rect x="56" y="96" width="16" height="44" rx="5" fill="#75421b"/>
    <rect x="108" y="96" width="16" height="44" rx="5" fill="#75421b"/>
    <!-- Khung gỗ mặt ghế -->
    <rect x="26" y="64" width="128" height="30" rx="10" fill="#b87338"/>
    <!-- Đệm vải ấm có nút giữa -->
    <rect x="22" y="34" width="136" height="46" rx="18" fill="#f3b664"/>
    <path d="M40 46 Q90 38 140 46" fill="none" stroke="#ffe0a3" stroke-width="5" stroke-linecap="round"/>
    <circle cx="90" cy="56" r="7" fill="#c97236"/>
  </g>
</svg>"""

    # 3. Giỏ mây đựng ô dù nhiều màu ngày mưa Đà Lạt
    umbrella_stand_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="170" height="210" viewBox="0 0 170 210">
  <ellipse cx="86" cy="184" rx="52" ry="15" fill="#2b1a12" opacity="0.24"/>
  <g stroke="#2b1a12" stroke-width="6" stroke-linejoin="round">
    <!-- 3 chiếc ô nhiều màu cắm gọn -->
    <!-- Ô xanh lam nghiêng trái -->
    <path d="M46 36 C36 22 24 30 30 46" fill="none" stroke="#8c5224" stroke-width="9" stroke-linecap="round"/>
    <path d="M46 36 C36 22 24 30 30 46" fill="none" stroke="#2b1a12" stroke-width="3.5" stroke-linecap="round"/>
    <polygon points="44,44 68,40 78,128 58,128" fill="#3b9be8"/>
    <!-- Ô đỏ ở giữa -->
    <path d="M88 22 C88 8 106 8 106 24" fill="none" stroke="#c98642" stroke-width="9" stroke-linecap="round"/>
    <path d="M88 22 C88 8 106 8 106 24" fill="none" stroke="#2b1a12" stroke-width="3.5" stroke-linecap="round"/>
    <polygon points="76,34 102,34 98,128 80,128" fill="#e65345"/>
    <!-- Ô vàng xanh bên phải -->
    <path d="M126 42 C136 28 148 36 140 50" fill="none" stroke="#8c5224" stroke-width="9" stroke-linecap="round"/>
    <path d="M126 42 C136 28 148 36 140 50" fill="none" stroke="#2b1a12" stroke-width="3.5" stroke-linecap="round"/>
    <polygon points="104,48 128,54 112,128 96,128" fill="#52b365"/>
    <!-- Giỏ mây đan tròn -->
    <path d="M42 112 L52 180 Q86 194 120 180 L130 112 Z" fill="#cb8b48"/>
    <ellipse cx="86" cy="112" rx="46" ry="14" fill="#e3aa66"/>
    <path d="M48 136 Q86 148 124 136 M52 160 Q86 172 120 160" fill="none" stroke="#78461c" stroke-width="4.5"/>
  </g>
</svg>"""

    # 4. Bàn trưng bày hộp giày & hộp xi đánh giày + bàn chải gỗ (đặt khoảng trống rộng giữa trái)
    shoebox_bench_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="260" height="175" viewBox="0 0 260 175">
  <rect x="16" y="24" width="232" height="132" rx="16" fill="#2b1a12" opacity="0.22"/>
  <rect x="12" y="18" width="232" height="130" rx="14" fill="#b8743c" stroke="#2b1a12" stroke-width="6.5"/>
  <rect x="24" y="30" width="208" height="106" rx="9" fill="#dfb074" stroke="#2b1a12" stroke-width="4.5"/>
  <!-- Chồng hộp giày kraft trái -->
  <g stroke="#2b1a12" stroke-width="5" stroke-linejoin="round">
    <rect x="36" y="42" width="84" height="52" rx="6" fill="#f3d8a8"/>
    <rect x="32" y="36" width="92" height="15" rx="5" fill="#fae7c2"/>
    <circle cx="78" cy="68" r="7" fill="#8f5324"/>
    <rect x="44" y="88" width="76" height="38" rx="5" fill="#e8ba74"/>
    <rect x="40" y="82" width="84" height="13" rx="4" fill="#f5cf90"/>
    <!-- Hộp xi đánh giày tròn & bàn chải gỗ bên phải -->
    <circle cx="164" cy="66" r="24" fill="#3a4c5e"/>
    <circle cx="164" cy="64" r="16" fill="#e65540"/>
    <circle cx="164" cy="64" r="7" fill="#ffd966"/>
    <!-- Bàn chải đánh giày gỗ -->
    <g transform="rotate(-18 190 108)">
      <rect x="148" y="96" width="74" height="26" rx="11" fill="#c98042"/>
      <line x1="160" y1="106" x2="210" y2="106" stroke="#f0be82" stroke-width="4" stroke-linecap="round"/>
    </g>
  </g>
</svg>"""

    # 5. Ghế dài thử giày + giỏ dép sạch (đặt góc dưới trái thoáng rộng)
    bench_corner_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="250" height="170" viewBox="0 0 250 170">
  <!-- Thảm chữ nhật xanh-kem đặt dưới ghế thử giày -->
  <rect x="14" y="18" width="222" height="136" rx="16" fill="#528a68" stroke="#2b1a12" stroke-width="5.5"/>
  <rect x="26" y="30" width="198" height="112" rx="10" fill="#6da882" stroke="#e8e2c5" stroke-width="3.5" stroke-dasharray="10 7"/>
  <!-- Ghế dài bọc đệm vàng mật ong -->
  <g stroke="#2b1a12" stroke-width="6" stroke-linejoin="round">
    <rect x="34" y="42" width="182" height="62" rx="14" fill="#a86430"/>
    <rect x="42" y="48" width="166" height="48" rx="11" fill="#f2b862"/>
    <circle cx="88" cy="72" r="6" fill="#c47234"/>
    <circle cx="162" cy="72" r="6" fill="#c47234"/>
    <line x1="125" y1="48" x2="125" y2="96" stroke="#c47234" stroke-width="3.5"/>
    <!-- Một đôi giày thử sạch gọn trước ghế -->
    <ellipse cx="96" cy="126" rx="22" ry="11" fill="#e65345"/>
    <ellipse cx="148" cy="126" rx="22" ry="11" fill="#e65345"/>
    <ellipse cx="96" cy="124" rx="11" ry="5" fill="#fff6de"/>
    <ellipse cx="148" cy="124" rx="11" ry="5" fill="#fff6de"/>
  </g>
</svg>"""

    # 6. Chậu cây xanh góc tiệm giày
    potted_plant_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
  <ellipse cx="76" cy="124" rx="40" ry="14" fill="#2b1a12" opacity="0.24"/>
  <g stroke="#2b1a12" stroke-width="6" stroke-linejoin="round">
    <path d="M44 82 L54 124 Q75 134 96 124 L106 82 Z" fill="#cb6738"/>
    <rect x="38" y="72" width="74" height="16" rx="7" fill="#e38252"/>
    <ellipse cx="52" cy="58" rx="22" ry="14" fill="#469e58" transform="rotate(-30 52 58)"/>
    <ellipse cx="98" cy="58" rx="22" ry="14" fill="#469e58" transform="rotate(30 98 58)"/>
    <ellipse cx="62" cy="40" rx="18" ry="22" fill="#5ec26e" transform="rotate(-15 62 40)"/>
    <ellipse cx="88" cy="40" rx="18" ry="22" fill="#5ec26e" transform="rotate(15 88 40)"/>
    <ellipse cx="75" cy="48" rx="16" ry="20" fill="#79d67f"/>
  </g>
</svg>"""

    # 7. Thảm cói tròn đan xoắn ốc đặt món (dùng luôn cho prop_pad_rug trong atlas Màn 1 v2!)
    pad_rug_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
  <defs>
    <radialGradient id="strawG" cx="45%" cy="40%" r="58%">
      <stop offset="0%" stop-color="#f8e5b8"/>
      <stop offset="68%" stop-color="#dfb874"/>
      <stop offset="100%" stop-color="#b88846"/>
    </radialGradient>
  </defs>
  <ellipse cx="70" cy="75" rx="58" ry="55" fill="#2b1a12" opacity="0.28"/>
  <circle cx="70" cy="70" r="57" fill="url(#strawG)" stroke="#2b1a12" stroke-width="6.5"/>
  <circle cx="70" cy="70" r="46" fill="none" stroke="#9e6d32" stroke-width="3.5" stroke-dasharray="10 6"/>
  <circle cx="70" cy="70" r="34" fill="none" stroke="#b07c3c" stroke-width="3" stroke-dasharray="8 6"/>
  <circle cx="70" cy="70" r="22" fill="none" stroke="#c79552" stroke-width="2.5"/>
  <circle cx="70" cy="70" r="8" fill="#e8c888" stroke="#9e6d32" stroke-width="2.5"/>
</svg>"""

    svgs = {
        "shoe_shelf.svg": shoe_shelf_svg,
        "fitting_stool.svg": fitting_stool_svg,
        "umbrella_stand.svg": umbrella_stand_svg,
        "shoebox_bench.svg": shoebox_bench_svg,
        "bench_corner.svg": bench_corner_svg,
        "potted_plant.svg": potted_plant_svg,
        "pad_rug.svg": pad_rug_svg,
    }
    for name, content in svgs.items():
        (SVG_DIR / name).write_text(content, encoding="utf-8")

    subprocess.run(
        ["node", str(REPO_ROOT / "scripts" / "render_svgs.mjs"), str(SVG_DIR), str(PNG_DIR)],
        check=True,
    )


def draw_wood_plank_floor() -> Image.Image:
    """Sàn gỗ thông Đà Lạt ấm áp, vân gỗ mềm mịn alpha-composite chuẩn (không gợn, nổi bật món & quái)."""
    bg = Image.new("RGBA", (W, H), (194, 146, 94, 255))
    d = ImageDraw.Draw(bg)
    plank_h = 44
    tones = [
        (202, 154, 102, 255),
        (192, 144, 92, 255),
        (198, 150, 98, 255),
        (186, 138, 88, 255),
    ]
    detail = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dd = ImageDraw.Draw(detail)

    for row, y in enumerate(range(0, H, plank_h)):
        col = tones[row % len(tones)]
        d.rectangle([0, y, W, y + plank_h], fill=col)
        # Khe ván ngang ấm trầm
        d.line([(0, y), (W, y)], fill=(138, 92, 50, 255), width=2)
        # Mạch ván dọc so le tự nhiên
        joint_x = (row * 163 + 84) % (W - 140) + 70
        dd.line([(joint_x, y + 2), (joint_x, y + plank_h - 1)], fill=(124, 80, 42, 165), width=2)
        # Vân gỗ mềm và ánh phản chiếu rất nhẹ trên từng tấm ván
        dd.line([(16, y + 13), (W - 16, y + 13)], fill=(232, 192, 138, 52), width=2)
        dd.line([(28, y + 28), (W - 28, y + 28)], fill=(154, 106, 62, 52), width=2)

    bg.alpha_composite(detail)

    # Tường gỗ nâu trầm mép trên cùng tiệm giày
    d = ImageDraw.Draw(bg)
    d.rectangle([0, 0, W, 24], fill=(116, 70, 36, 255))
    d.line([(0, 24), (W, 24)], fill=INK, width=4)
    return bg


def draw_wet_cobblestone(w: int, h: int) -> Image.Image:
    """Vỉa hè đá ướt mưa hẻm dốc Đà Lạt ngoài cửa kính (xanh lam trầm + vũng nước phản sáng)."""
    im = Image.new("RGBA", (w, h), (78, 112, 136, 255))
    d = ImageDraw.Draw(im)
    palette = [
        (104, 140, 166, 255),
        (92, 128, 154, 255),
        (114, 152, 176, 255),
        (86, 120, 146, 255),
    ]
    row_h = 20
    for r_i, y in enumerate(range(-4, h + row_h, row_h)):
        x_off = (r_i % 2) * 14 - 8
        for c_i, x in enumerate(range(x_off, w + 30, 28)):
            col = palette[(r_i * 5 + c_i * 3) % len(palette)]
            d.rounded_rectangle([x + 2, y + 2, x + 25, y + row_h - 2], radius=5, fill=col, outline=(46, 70, 90, 255), width=2)
            d.line([(x + 6, y + 6), (x + 16, y + 6)], fill=(176, 218, 240, 145), width=2)
    # Vũng nước mưa phản sáng ngoài cửa
    d.ellipse([w // 2 - 42, h // 2 - 14, w // 2 + 42, h // 2 + 16], fill=(142, 202, 232, 118))
    d.ellipse([w // 2 - 24, h // 2 - 5, w // 2 + 20, h // 2 + 8], fill=(202, 240, 255, 110))
    return im


def draw_rainy_door_and_window(bg: Image.Image):
    """
    Vẽ cửa kính mưa ở đầu đường (48, 24 -> 96, 48) và cửa sổ mưa nhìn ra hẻm dốc Đà Lạt.
    KHÔNG có chữ tiếng nước ngoài (không WELCOME)!
    """
    # 1. Cửa kính chính góc trên trái (x=20..168, y=0..86 -> dừng ở 168, cách pad_1 trái=182 sạch thoáng!)
    dx1, dx2, dy2 = 22, 164, 84
    bg.paste(draw_wet_cobblestone(dx2 - dx1, dy2), (dx1, 0))

    d = ImageDraw.Draw(bg)
    # Mái hiên sọc đỏ gạch - kem ấm đặc trưng tiệm giày hẻm dốc
    stripe_w = 18
    for idx, sx in enumerate(range(dx1 - 6, dx2 + 6, stripe_w)):
        col = (192, 78, 52, 255) if idx % 2 == 0 else (252, 240, 210, 255)
        d.rectangle([sx, 0, min(dx2 + 6, sx + stripe_w), 21], fill=col, outline=INK, width=3)

    # Khung cửa gỗ chắc chắn
    d.rectangle([dx1 - 6, 18, dx1 + 5, dy2 + 2], fill=(122, 72, 36, 255), outline=INK, width=4)
    d.rectangle([dx2 - 5, 18, dx2 + 6, dy2 + 2], fill=(122, 72, 36, 255), outline=INK, width=4)

    # Cánh cửa kính mở vào bên phải khung (dừng ở x=178, KHÔNG chạm pad_1 ở x=224 bán kính 42 -> 182!)
    glass = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glass)
    poly = [(dx2 - 2, 22), (dx2 + 14, 44), (dx2 + 14, 92), (dx2 - 2, 78)]
    gd.polygon(poly, fill=(198, 238, 252, 190))
    gd.line(poly + [poly[0]], fill=(122, 74, 38, 255), width=5)
    gd.line(poly + [poly[0]], fill=INK, width=2)
    gd.line([(dx2 + 9, 58), (dx2 + 9, 72)], fill=(242, 198, 86, 255), width=4)
    bg.alpha_composite(glass)

    # 2. Cửa sổ kính mưa nhìn ra hẻm dốc (x=280..410 và x=550..692)
    for wx1, wx2 in [(274, 408), (546, 692)]:
        bg.paste(draw_wet_cobblestone(wx2 - wx1, 32), (wx1, 4))
        d.rectangle([wx1, 4, wx2, 36], outline=INK, width=4)
        mid = (wx1 + wx2) // 2
        d.line([(mid, 4), (mid, 36)], fill=INK, width=3)
        d.line([(wx1 + 14, 10), (wx1 + 26, 28)], fill=(224, 248, 255, 165), width=2)
        d.line([(mid + 14, 10), (mid + 26, 28)], fill=(224, 248, 255, 165), width=2)


def draw_s_curve_path(bg: Image.Image):
    """Vẽ đường chữ S qua 2 khúc cua chữ U khớp TUYỆT ĐỐI 100% STAGE_1_DEFINITION.paths[0]."""
    path_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pd = ImageDraw.Draw(path_layer)

    pts = [(x * S, y * S) for x, y in STAGE1_PATH]
    pts[0] = (pts[0][0], pts[0][1] + 16)

    # Kích thước lẻ đối xứng (67, 59, 51) -> bán kính (33, 29, 25) để mọi khúc cua U phẳng tuyệt đối!
    # 1. Bóng đổ mềm dưới đường
    for i in range(len(pts) - 1):
        pd.line([pts[i], pts[i + 1]], fill=(54, 32, 18, 90), width=67)
    for x, y in pts:
        pd.ellipse([x - 33, y - 33, x + 33, y + 33], fill=(54, 32, 18, 90))

    # 2. Viền nâu đậm ngoài cùng
    for i in range(len(pts) - 1):
        pd.line([pts[i], pts[i + 1]], fill=(74, 44, 24, 255), width=59)
    for x, y in pts:
        pd.ellipse([x - 29, y - 29, x + 29, y + 29], fill=(74, 44, 24, 255))

    # 3. Lòng đường thảm dẫn màu kem-vàng dịu ấm (tương phản rõ cả Giọt Mưa, Cục Bùn, Gián, Chuột, Nắng Gắt!)
    for i in range(len(pts) - 1):
        pd.line([pts[i], pts[i + 1]], fill=(238, 214, 170, 255), width=51)
    for x, y in pts:
        pd.ellipse([x - 25, y - 25, x + 25, y + 25], fill=(238, 214, 170, 255))

    # 4. Đường chỉ dẫn giữa lối đi
    for i in range(len(pts) - 1):
        pd.line([pts[i], pts[i + 1]], fill=(154, 108, 64, 140), width=4)

    # Vài dấu chân ướt nhỏ nhắn từ cửa vào hướng theo đường
    for fx, fy in [(90, 114), (102, 146), (92, 182), (168, 246), (256, 252)]:
        pd.ellipse([fx - 5, fy - 7, fx + 5, fy + 7], fill=(138, 94, 54, 82))
        pd.ellipse([fx - 3, fy + 5, fx + 3, fy + 10], fill=(138, 94, 54, 72))

    bg.alpha_composite(path_layer)

    # Thảm chùi chân sọc nâu sạch ở cửa vào (96, 56) — KHÔNG chữ tiếng nước ngoài!
    md = ImageDraw.Draw(bg)
    mx, my = 48 * S, 24 * S + 10
    md.rounded_rectangle([mx - 48, my - 19, mx + 48, my + 19], radius=8, fill=(132, 84, 44, 255), outline=INK, width=4)
    for sy in range(my - 11, my + 13, 7):
        md.line([(mx - 42, sy), (mx + 42, sy)], fill=(172, 118, 66, 255), width=3)


def main():
    write_shoe_shop_svgs()
    props = {
        "shoe_shelf": Image.open(PNG_DIR / "shoe_shelf.png").convert("RGBA"),
        "fitting_stool": Image.open(PNG_DIR / "fitting_stool.png").convert("RGBA"),
        "umbrella_stand": Image.open(PNG_DIR / "umbrella_stand.png").convert("RGBA"),
        "shoebox_bench": Image.open(PNG_DIR / "shoebox_bench.png").convert("RGBA"),
        "bench_corner": Image.open(PNG_DIR / "bench_corner.png").convert("RGBA"),
        "potted_plant": Image.open(PNG_DIR / "potted_plant.png").convert("RGBA"),
        "pad_rug": Image.open(PNG_DIR / "pad_rug.png").convert("RGBA"),
    }

    bg = draw_wood_plank_floor()
    draw_rainy_door_and_window(bg)

    # Đạo cụ tiệm giày Đà Lạt đặt gọn trong các khoảng trống — ZERO chồng lấn đường đi và 9 ô!
    # 1. Góc trên phải (x=526..708, y=42..204 -> pad_2 phải=506, path y=250 trên=217)
    bg.alpha_composite(trim_and_fit(props["fitting_stool"], 98, 90, pad=2), (528, 74))
    bg.alpha_composite(trim_and_fit(props["umbrella_stand"], 86, 112, pad=2), (624, 52))

    # 2. Giữa tường trái (x=12..232, y=296..446 -> dưới path y=250+33=283, trên path y=490-33=457, trái pad_3=248!)
    bg.alpha_composite(trim_and_fit(props["shoebox_bench"], 198, 134, pad=2), (24, 304))

    # 3. Dọc mép phải đoạn cua U trên (x=644..712, y=296..452)
    bg.alpha_composite(trim_and_fit(props["potted_plant"], 68, 68, pad=2), (646, 336))

    # 4. Dọc mép trái đoạn cua U dưới (x=6..76, y=540..692 — path trái ở x=112-33=79)
    bg.alpha_composite(trim_and_fit(props["potted_plant"], 68, 68, pad=2), (6, 574))

    # 5. Góc dưới trái (x=14..246, y=772..946 -> dưới path y=730+33=763, trái pad_8=258!)
    bg.alpha_composite(trim_and_fit(props["bench_corner"], 220, 152, pad=2), (18, 782))

    # 6. Chậu cây nhỏ trang trí góc trên giữa (x=312..376, y=44..110 — giữa pad_1=224 và pad_2=464)
    bg.alpha_composite(trim_and_fit(props["potted_plant"], 72, 72, pad=2), (308, 44))

    # Vẽ đường chữ S qua 2 khúc cua chữ U
    draw_s_curve_path(bg)

    # Dán 9 THẢM CÓI TRÒN vector sắc nét khớp 100% STAGE_1_DEFINITION.pads
    pad_on_map = trim_and_fit(props["pad_rug"], 84, 84, pad=1)
    for _, px, py in STAGE1_PADS:
        cx, cy = px * S, py * S
        bg.alpha_composite(pad_on_map, (cx - 42, cy - 42))

    # Ánh đèn vàng ấm & KỆ GIÀY GỖ 3 TẦNG ở cuối đường (304*2, 455*2 = 608, 910) — giữ x >= 534 để KHÔNG chạm pad_9 (488, 840 -> phải 530)!
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for rad, alpha in [(136, 22), (96, 36), (60, 50)]:
        gd.ellipse([618 - rad, 876 - rad, 618 + rad, 876 + rad], fill=(255, 226, 120, alpha))
    bg.alpha_composite(glow)

    shelf_placed = trim_and_fit(props["shoe_shelf"], 172, 168, pad=2)
    bg.alpha_composite(shelf_placed, (538, 786))

    # Viền khung gỗ trầm bo toàn tiệm
    frame = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fd = ImageDraw.Draw(frame)
    fd.rectangle([0, 0, W - 1, H - 1], outline=(54, 32, 18, 225), width=8)
    bg.alpha_composite(frame)

    map_out = OUT_DIR / "map_man1_tiem_giay.webp"
    bg.convert("RGB").save(map_out, format="WEBP", quality=84, method=6)
    print(f"Saved Stage 1 v2 map: {map_out} ({W}x{H}, {map_out.stat().st_size / 1024:.1f} KB)")

    # Ảnh kiểm tra khớp 100% toạ độ đường chữ S + 9 ô
    chk = bg.copy()
    cd = ImageDraw.Draw(chk)
    pts = [(x * S, y * S) for x, y in STAGE1_PATH]
    for i in range(len(pts) - 1):
        cd.line([pts[i], pts[i + 1]], fill=(0, 255, 255, 230), width=3)
    for x, y in pts:
        cd.ellipse([x - 7, y - 7, x + 7, y + 7], fill=(0, 255, 255, 255))
    for pid, px, py in STAGE1_PADS:
        cx, cy = px * S, py * S
        cd.ellipse([cx - 38, cy - 38, cx + 38, cy + 38], outline=(255, 64, 255, 255), width=3)
        cd.text((cx - 16, cy - 6), pid, fill=(255, 255, 255, 255))
    chk_out = SCRATCH_DIR / "verify_map1v2_alignment.png"
    chk.save(chk_out)
    print(f"Saved alignment verify: {chk_out}")


if __name__ == "__main__":
    main()
