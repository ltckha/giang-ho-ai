#!/usr/bin/env python3
"""
Vẽ nền bản đồ Màn 3 "Tiệm Hoa Cuối Dốc" (720x1040 = 2x khung logic 360x520)
dạng vector SVG (render qua Playwright Chromium `scripts/render_svgs.mjs`) + ghép Pillow,
khớp TUYỆT ĐỐI 100% 2 cửa vào, 2 lối đi hợp ngả và 11 ô đặt món trong `src/core/shops/flower.ts`.
Không chữ tiếng nước ngoài.
"""

from __future__ import annotations

import json
import pathlib
import subprocess
from PIL import Image, ImageDraw

REPO_ROOT = pathlib.Path("/home/antigravity/ltckha/giang-ho-ai")
OUT_DIR = REPO_ROOT / "public" / "assets"
SCRATCH_DIR = pathlib.Path(
    "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/f27c1771-a6ca-4307-ac45-cbf7e4715aff/scratch"
)
SVG_DIR = SCRATCH_DIR / "stage3_map_svgs"
PNG_DIR = SCRATCH_DIR / "stage3_map_pngs"
BACKUP_DIR = SCRATCH_DIR / "atlas_backup_pre_stage3"

SVG_DIR.mkdir(parents=True, exist_ok=True)
PNG_DIR.mkdir(parents=True, exist_ok=True)

S = 2
W, H = 360 * S, 520 * S  # 720 x 1040
INK = (43, 26, 18, 255)  # #2b1a12

# Đúng 100% STAGE_3_DEFINITION trong src/core/shops/flower.ts
JOIN_AND_END = [(180, 330), (180, 420), (70, 420), (70, 470)]
STAGE3_PATHS = [
    [(40, 24), (40, 150), (140, 150), (140, 330), *JOIN_AND_END],
    [(330, 24), (330, 110), (230, 110), (230, 240), (300, 240), (300, 330), *JOIN_AND_END],
]
STAGE3_PADS = [
    ("pad_1", 95, 90),
    ("pad_2", 275, 60),
    ("pad_3", 188, 180),
    ("pad_4", 85, 235),
    ("pad_5", 280, 180),
    ("pad_6", 188, 280),
    ("pad_7", 255, 290),
    ("pad_8", 105, 372),
    ("pad_9", 240, 385),
    ("pad_10", 130, 465),
    ("pad_11", 25, 362),
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


def write_flower_shop_svgs():
    """Tạo toàn bộ đạo cụ Tiệm Hoa Đà Lạt (giàn hoa, luống cẩm tú cầu, nhà kính, chậu đất nung, bao đất, thảm cói vườn)."""

    # 1. Giàn hoa trưng bày cuối đường (dưới trái 70, 470 -> 140, 940) — đích cần giữ 20 chậu hoa!
    flower_rack_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="320" height="270" viewBox="0 0 320 270">
  <defs>
    <linearGradient id="woodRack" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#c98952"/>
      <stop offset="100%" stop-color="#874f24"/>
    </linearGradient>
    <linearGradient id="terracotta" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e37c4d"/>
      <stop offset="100%" stop-color="#b54f25"/>
    </linearGradient>
    <linearGradient id="awningLeaf" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#70c27d"/>
      <stop offset="100%" stop-color="#3e8c4f"/>
    </linearGradient>
  </defs>
  <!-- Bóng đổ ấm -->
  <ellipse cx="160" cy="242" rx="136" ry="20" fill="#2b1a12" opacity="0.28"/>
  <!-- Chân giàn gỗ bậc thang 3 tầng -->
  <g stroke="#2b1a12" stroke-width="6.5" stroke-linejoin="round">
    <rect x="34" y="56" width="18" height="184" rx="7" fill="#7c4720"/>
    <rect x="268" y="56" width="18" height="184" rx="7" fill="#7c4720"/>
    <!-- Tầng sau trên -->
    <rect x="24" y="64" width="272" height="24" rx="8" fill="url(#woodRack)"/>
    <!-- Tầng giữa -->
    <rect x="18" y="132" width="284" height="24" rx="8" fill="url(#woodRack)"/>
    <!-- Tầng dưới -->
    <rect x="12" y="202" width="296" height="26" rx="9" fill="url(#woodRack)"/>
  </g>
  <!-- Tầng trên: Hoa Cẩm Tú Cầu xanh lam & Hoa Hồng đỏ Đà Lạt -->
  <g stroke="#2b1a12" stroke-width="5" stroke-linejoin="round">
    <!-- Chậu 1 trái: Cẩm tú cầu xanh -->
    <path d="M52 66 L58 92 L92 92 L98 66 Z" fill="url(#terracotta)"/>
    <ellipse cx="56" cy="54" rx="18" ry="11" fill="#4aa157" transform="rotate(-24 56 54)"/>
    <ellipse cx="94" cy="54" rx="18" ry="11" fill="#4aa157" transform="rotate(24 94 54)"/>
    <circle cx="64" cy="40" r="16" fill="#74c0fc"/>
    <circle cx="84" cy="40" r="16" fill="#5c9ce6"/>
    <circle cx="74" cy="28" r="16" fill="#a5d8ff"/>
    <circle cx="74" cy="42" r="11" fill="#91c7ff"/>
    <!-- Chậu 2 giữa: Hướng dương rực rỡ -->
    <path d="M136 66 L142 92 L178 92 L184 66 Z" fill="url(#terracotta)"/>
    <ellipse cx="140" cy="54" rx="16" ry="10" fill="#52ad5e" transform="rotate(-20 140 54)"/>
    <ellipse cx="180" cy="54" rx="16" ry="10" fill="#52ad5e" transform="rotate(20 180 54)"/>
    <circle cx="160" cy="34" r="24" fill="#ffd43b"/>
    <circle cx="160" cy="34" r="11" fill="#7a441e"/>
    <!-- Chậu 3 phải: Hoa Hồng phấn & đỏ -->
    <path d="M222 66 L228 92 L262 92 L268 66 Z" fill="url(#terracotta)"/>
    <ellipse cx="226" cy="54" rx="17" ry="10" fill="#4aa157" transform="rotate(-22 226 54)"/>
    <ellipse cx="264" cy="54" rx="17" ry="10" fill="#4aa157" transform="rotate(22 264 54)"/>
    <circle cx="236" cy="42" r="14" fill="#ff6b81"/>
    <circle cx="256" cy="42" r="14" fill="#f03e5a"/>
    <circle cx="246" cy="28" r="14" fill="#ff8fa3"/>
  </g>
  <!-- Tầng giữa: 4 chậu hoa cúc vàng, oải hương tím, tulip hồng, cẩm tú cầu -->
  <g stroke="#2b1a12" stroke-width="5" stroke-linejoin="round">
    <!-- Oải hương tím -->
    <path d="M36 134 L42 162 L76 162 L82 134 Z" fill="url(#terracotta)"/>
    <ellipse cx="48" cy="112" rx="9" ry="20" fill="#9775fa" transform="rotate(-14 48 112)"/>
    <ellipse cx="60" cy="106" rx="9" ry="23" fill="#b197fc"/>
    <ellipse cx="72" cy="113" rx="9" ry="19" fill="#845ef7" transform="rotate(14 72 113)"/>
    <!-- Cúc họa mi trắng-vàng -->
    <path d="M104 134 L110 162 L144 162 L150 134 Z" fill="url(#terracotta)"/>
    <ellipse cx="127" cy="124" rx="26" ry="12" fill="#4aa157"/>
    <circle cx="114" cy="112" r="12" fill="#fff9db"/>
    <circle cx="114" cy="112" r="5" fill="#fab005"/>
    <circle cx="138" cy="110" r="13" fill="#fff9db"/>
    <circle cx="138" cy="110" r="5" fill="#fab005"/>
    <!-- Hoa hồng cam đào -->
    <path d="M172 134 L178 162 L212 162 L218 134 Z" fill="url(#terracotta)"/>
    <ellipse cx="195" cy="124" rx="26" ry="12" fill="#479b54"/>
    <circle cx="184" cy="112" r="13" fill="#ff922b"/>
    <circle cx="204" cy="110" r="14" fill="#ff7a45"/>
    <circle cx="194" cy="100" r="12" fill="#ffc078"/>
    <!-- Cẩm tú cầu tím hồng -->
    <path d="M238 134 L244 162 L278 162 L284 134 Z" fill="url(#terracotta)"/>
    <circle cx="250" cy="114" r="14" fill="#da77f2"/>
    <circle cx="270" cy="114" r="14" fill="#cc5de8"/>
    <circle cx="260" cy="102" r="15" fill="#eebefa"/>
  </g>
  <!-- Tầng dưới: 3 chậu đất nung lớn đầy hoa & lá xanh -->
  <g stroke="#2b1a12" stroke-width="5.5" stroke-linejoin="round">
    <path d="M36 204 L44 236 L94 236 L102 204 Z" fill="url(#terracotta)"/>
    <ellipse cx="69" cy="192" rx="34" ry="15" fill="url(#awningLeaf)"/>
    <circle cx="54" cy="186" r="12" fill="#ffd43b"/>
    <circle cx="72" cy="180" r="13" fill="#ff6b6b"/>
    <circle cx="88" cy="188" r="11" fill="#74c0fc"/>

    <path d="M126 204 L134 236 L186 236 L194 204 Z" fill="url(#terracotta)"/>
    <ellipse cx="160" cy="192" rx="36" ry="16" fill="url(#awningLeaf)"/>
    <circle cx="144" cy="184" r="13" fill="#ff8fa3"/>
    <circle cx="162" cy="178" r="14" fill="#ffe066"/>
    <circle cx="178" cy="186" r="12" fill="#b197fc"/>

    <path d="M218 204 L226 236 L276 236 L284 204 Z" fill="url(#terracotta)"/>
    <ellipse cx="251" cy="192" rx="34" ry="15" fill="url(#awningLeaf)"/>
    <circle cx="236" cy="184" r="12" fill="#74c0fc"/>
    <circle cx="254" cy="180" r="13" fill="#ff922b"/>
    <circle cx="268" cy="188" r="11" fill="#fff3bf"/>
  </g>
</svg>"""

    # 2. Luống hoa cẩm tú cầu & hồng Đà Lạt trong khung gỗ (đặt giữa trên & cạnh trái)
    flower_bed_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="260" height="170" viewBox="0 0 260 170">
  <rect x="14" y="20" width="236" height="136" rx="18" fill="#2b1a12" opacity="0.22"/>
  <rect x="10" y="14" width="236" height="134" rx="16" fill="#a86a3a" stroke="#2b1a12" stroke-width="6.5"/>
  <rect x="24" y="28" width="208" height="106" rx="10" fill="#5c3b24" stroke="#2b1a12" stroke-width="4.5"/>
  <!-- Tán lá xanh mướt -->
  <g stroke="#2b1a12" stroke-width="4.5" stroke-linejoin="round">
    <ellipse cx="64" cy="82" rx="34" ry="28" fill="#469e58"/>
    <ellipse cx="128" cy="78" rx="40" ry="30" fill="#52b365"/>
    <ellipse cx="192" cy="84" rx="34" ry="26" fill="#469e58"/>
    <ellipse cx="96" cy="98" rx="28" ry="22" fill="#63c274"/>
    <ellipse cx="164" cy="98" rx="28" ry="22" fill="#63c274"/>
    <!-- Bông cẩm tú cầu xanh lam -->
    <circle cx="56" cy="68" r="15" fill="#74c0fc"/>
    <circle cx="72" cy="76" r="14" fill="#a5d8ff"/>
    <circle cx="60" cy="86" r="13" fill="#5c9ce6"/>
    <!-- Hoa hồng phấn ở giữa -->
    <circle cx="122" cy="64" r="15" fill="#ff6b81"/>
    <circle cx="140" cy="76" r="14" fill="#ff8fa3"/>
    <circle cx="118" cy="88" r="13" fill="#f03e5a"/>
    <!-- Hoa cúc vàng cam bên phải -->
    <circle cx="186" cy="68" r="15" fill="#ffd43b"/>
    <circle cx="186" cy="68" r="6" fill="#8f4d1e"/>
    <circle cx="204" cy="86" r="14" fill="#ff922b"/>
    <circle cx="204" cy="86" r="5" fill="#7a3e14"/>
    <circle cx="176" cy="96" r="12" fill="#ffe066"/>
    <circle cx="176" cy="96" r="4.5" fill="#8f4d1e"/>
  </g>
</svg>"""

    # 3. Kệ nhà kính (bàn trồng cây kính sáng với chậu lan & hoa mầm) đặt góc dưới phải
    greenhouse_bench_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="230" height="260" viewBox="0 0 230 260">
  <defs>
    <linearGradient id="glassPane" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e3f8ff" stop-opacity="0.52"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#b4e8f8" stop-opacity="0.40"/>
    </linearGradient>
  </defs>
  <rect x="16" y="18" width="202" height="230" rx="18" fill="#2b1a12" opacity="0.22"/>
  <!-- Khung sắt trắng xanh nhà kính -->
  <rect x="12" y="12" width="202" height="228" rx="16" fill="#dcece4" stroke="#2b1a12" stroke-width="6.5"/>
  <rect x="24" y="24" width="178" height="204" rx="10" fill="#c98e54" stroke="#2b1a12" stroke-width="4.5"/>
  <!-- Đường ván bàn trồng hoa -->
  <line x1="24" y1="92" x2="202" y2="92" stroke="#8c5a2c" stroke-width="3.5"/>
  <line x1="24" y1="160" x2="202" y2="160" stroke="#8c5a2c" stroke-width="3.5"/>
  <!-- Chậu hoa hồng, hoa lan tím, cây giống xanh -->
  <g stroke="#2b1a12" stroke-width="4.5" stroke-linejoin="round">
    <!-- Hàng 1 -->
    <circle cx="62" cy="58" r="22" fill="#d97241"/>
    <circle cx="62" cy="54" r="16" fill="#4ba35c"/>
    <circle cx="56" cy="50" r="8" fill="#ff6b81"/>
    <circle cx="68" cy="56" r="8" fill="#ff8fa3"/>

    <circle cx="114" cy="58" r="22" fill="#d97241"/>
    <circle cx="114" cy="54" r="16" fill="#52b365"/>
    <circle cx="114" cy="52" r="10" fill="#ffd43b"/>
    <circle cx="114" cy="52" r="4" fill="#7a441e"/>

    <circle cx="164" cy="58" r="22" fill="#d97241"/>
    <circle cx="164" cy="54" r="16" fill="#469e58"/>
    <circle cx="158" cy="50" r="9" fill="#74c0fc"/>
    <circle cx="170" cy="56" r="8" fill="#a5d8ff"/>

    <!-- Hàng 2: khay ươm mầm -->
    <rect x="38" y="104" width="70" height="44" rx="7" fill="#6b4428"/>
    <circle cx="56" cy="118" r="8" fill="#74d680"/>
    <circle cx="74" cy="118" r="8" fill="#59c173"/>
    <circle cx="92" cy="118" r="8" fill="#74d680"/>
    <circle cx="56" cy="136" r="8" fill="#59c173"/>
    <circle cx="74" cy="136" r="8" fill="#74d680"/>
    <circle cx="92" cy="136" r="8" fill="#59c173"/>

    <circle cx="154" cy="126" r="26" fill="#d97241"/>
    <circle cx="154" cy="122" r="20" fill="#4ba35c"/>
    <circle cx="146" cy="116" r="10" fill="#da77f2"/>
    <circle cx="162" cy="122" r="10" fill="#eebefa"/>

    <!-- Hàng 3: chậu oải hương & hoa trắng -->
    <circle cx="68" cy="194" r="24" fill="#d97241"/>
    <circle cx="68" cy="190" r="18" fill="#4ba35c"/>
    <circle cx="62" cy="184" r="9" fill="#b197fc"/>
    <circle cx="74" cy="192" r="9" fill="#9775fa"/>

    <circle cx="146" cy="194" r="26" fill="#d97241"/>
    <circle cx="146" cy="190" r="19" fill="#52b365"/>
    <circle cx="138" cy="184" r="9" fill="#fff9db"/>
    <circle cx="154" cy="186" r="9" fill="#fff9db"/>
    <circle cx="146" cy="196" r="9" fill="#ffd43b"/>
  </g>
  <!-- Ánh kính nhà kính phủ xiên nhẹ -->
  <rect x="24" y="24" width="178" height="204" rx="10" fill="url(#glassPane)"/>
  <polygon points="44,24 80,24 24,148 24,104" fill="#ffffff" opacity="0.28"/>
  <polygon points="122,24 146,24 62,228 38,228" fill="#ffffff" opacity="0.20"/>
  <rect x="24" y="24" width="178" height="204" rx="10" fill="none" stroke="#2b1a12" stroke-width="4.5"/>
</svg>"""

    # 4. Chồng chậu đất nung & xẻng nhỏ làm vườn
    terracotta_stack_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="220" height="170" viewBox="0 0 220 170">
  <ellipse cx="110" cy="140" rx="88" ry="22" fill="#2b1a12" opacity="0.24"/>
  <!-- Bao đất trồng cây -->
  <g stroke="#2b1a12" stroke-width="6" stroke-linejoin="round">
    <path d="M108 62 C104 108 118 140 162 140 C198 140 208 112 204 66 C200 44 184 36 156 36 C128 36 112 44 108 62 Z" fill="#8b5d3b"/>
    <ellipse cx="156" cy="48" rx="34" ry="14" fill="#633e24"/>
    <ellipse cx="156" cy="48" rx="22" ry="9" fill="#462b19"/>
    <!-- Chậu đất nung xếp chồng bên trái -->
    <path d="M26 88 L36 138 Q62 148 88 138 L98 88 Z" fill="#d46b3b"/>
    <rect x="20" y="76" width="84" height="17" rx="7" fill="#e68250"/>
    <!-- Chậu thứ 2 nghiêng nhẹ -->
    <g transform="rotate(-14 64 62)">
      <path d="M34 42 L42 78 Q64 86 86 78 L94 42 Z" fill="#cb6132"/>
      <rect x="28" y="32" width="72" height="15" rx="6" fill="#ea8a5a"/>
    </g>
    <!-- Xẻng làm vườn mini -->
    <path d="M98 130 L122 106" stroke="#c98952" stroke-width="10" stroke-linecap="round"/>
    <path d="M98 130 L122 106" stroke="#2b1a12" stroke-width="4" stroke-linecap="round"/>
    <path d="M118 110 C128 96 146 92 152 102 C156 110 140 124 126 122 Z" fill="#cbd5e1"/>
  </g>
</svg>"""

    # 5. Chậu cẩm tú cầu đơn (đặt khe nhỏ trang trí)
    pot_hydrangea_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
  <ellipse cx="76" cy="126" rx="40" ry="14" fill="#2b1a12" opacity="0.24"/>
  <g stroke="#2b1a12" stroke-width="6" stroke-linejoin="round">
    <path d="M44 82 L54 126 Q75 136 96 126 L106 82 Z" fill="#d46b3b"/>
    <rect x="38" y="72" width="74" height="16" rx="7" fill="#e88654"/>
    <ellipse cx="48" cy="64" rx="22" ry="13" fill="#469e58" transform="rotate(-24 48 64)"/>
    <ellipse cx="102" cy="64" rx="22" ry="13" fill="#469e58" transform="rotate(24 102 64)"/>
    <circle cx="58" cy="48" r="19" fill="#74c0fc"/>
    <circle cx="92" cy="48" r="19" fill="#5c9ce6"/>
    <circle cx="75" cy="34" r="21" fill="#a5d8ff"/>
    <circle cx="75" cy="52" r="15" fill="#91c7ff"/>
  </g>
</svg>"""

    # 6. Chậu hoa hồng & cúc vàng đơn
    pot_rose_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
  <ellipse cx="76" cy="126" rx="40" ry="14" fill="#2b1a12" opacity="0.24"/>
  <g stroke="#2b1a12" stroke-width="6" stroke-linejoin="round">
    <path d="M44 82 L54 126 Q75 136 96 126 L106 82 Z" fill="#d46b3b"/>
    <rect x="38" y="72" width="74" height="16" rx="7" fill="#e88654"/>
    <ellipse cx="50" cy="64" rx="20" ry="13" fill="#4ba35c" transform="rotate(-24 50 64)"/>
    <ellipse cx="100" cy="64" rx="20" ry="13" fill="#4ba35c" transform="rotate(24 100 64)"/>
    <circle cx="58" cy="48" r="17" fill="#ff6b81"/>
    <circle cx="92" cy="48" r="17" fill="#ffd43b"/>
    <circle cx="92" cy="48" r="6" fill="#8c4c1e"/>
    <circle cx="75" cy="34" r="18" fill="#ff8fa3"/>
  </g>
</svg>"""

    # 7. Thảm cói / đĩa đất nung đặt món Màn 3 (sắc nét vector)
    garden_pad_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <defs>
    <radialGradient id="padStone" cx="46%" cy="42%" r="54%">
      <stop offset="0%" stop-color="#f7e8c4"/>
      <stop offset="68%" stop-color="#e1c186"/>
      <stop offset="100%" stop-color="#bd9254"/>
    </radialGradient>
  </defs>
  <ellipse cx="60" cy="64" rx="50" ry="48" fill="#2b1a12" opacity="0.28"/>
  <circle cx="60" cy="60" r="49" fill="url(#padStone)" stroke="#2b1a12" stroke-width="6"/>
  <circle cx="60" cy="60" r="39" fill="none" stroke="#9e6d36" stroke-width="3" stroke-dasharray="9 6"/>
  <circle cx="60" cy="60" r="28" fill="none" stroke="#c89b5d" stroke-width="2.5" opacity="0.7"/>
  <!-- 4 chấm lá nhỏ 4 hướng -->
  <circle cx="60" cy="18" r="3.5" fill="#59a864"/>
  <circle cx="60" cy="102" r="3.5" fill="#59a864"/>
  <circle cx="18" cy="60" r="3.5" fill="#59a864"/>
  <circle cx="102" cy="60" r="3.5" fill="#59a864"/>
</svg>"""

    svgs = {
        "flower_rack.svg": flower_rack_svg,
        "flower_bed.svg": flower_bed_svg,
        "greenhouse_bench.svg": greenhouse_bench_svg,
        "terracotta_stack.svg": terracotta_stack_svg,
        "pot_hydrangea.svg": pot_hydrangea_svg,
        "pot_rose.svg": pot_rose_svg,
        "garden_pad.svg": garden_pad_svg,
    }
    for name, content in svgs.items():
        (SVG_DIR / name).write_text(content, encoding="utf-8")

    subprocess.run(
        ["node", str(REPO_ROOT / "scripts" / "render_svgs.mjs"), str(SVG_DIR), str(PNG_DIR)],
        check=True,
    )


def draw_flower_shop_floor() -> Image.Image:
    """
    Nền sân gạch đất nung & sàn đá nhà kính vườn hoa Đà Lạt ấm dịu,
    chia sắc hài hoà giữa khu tiệm gỗ bên trái và khu nhà kính sáng mát bên phải.
    """
    bg = Image.new("RGBA", (W, H), (186, 150, 112, 255))
    d = ImageDraw.Draw(bg)
    detail = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dd = ImageDraw.Draw(detail)

    tile = 48
    left_c1 = (196, 158, 118, 255)
    left_c2 = (183, 145, 105, 255)
    gh_c1 = (170, 186, 158, 255)  # Nền đá mát khu nhà kính bên phải
    gh_c2 = (158, 174, 146, 255)
    grout_left = (138, 103, 70, 255)
    grout_gh = (114, 134, 106, 255)

    for row, y in enumerate(range(0, H, tile)):
        for col, x in enumerate(range(0, W, tile)):
            in_gh = x >= 432 and y < 700
            if in_gh:
                fill = gh_c1 if (row + col) % 2 == 0 else gh_c2
                grout = grout_gh
            else:
                fill = left_c1 if (row + col) % 2 == 0 else left_c2
                grout = grout_left
            d.rectangle([x, y, x + tile, y + tile], fill=fill, outline=grout, width=2)
            # Nét phản chiếu mềm trên mặt gạch (alpha-composite đúng chuẩn!)
            if (row + col) % 2 == 0:
                dd.rectangle(
                    [x + 6, y + 6, x + tile - 6, y + tile - 6],
                    outline=(244, 224, 192, 68) if not in_gh else (228, 244, 226, 74),
                    width=1,
                )
            else:
                # Hạt chấm nhẹ ở tâm viên gạch xen kẽ (kiểu gạch bông Đà Lạt cổ)
                dd.ellipse(
                    [x + 21, y + 21, x + 27, y + 27],
                    fill=(160, 122, 86, 72) if not in_gh else (130, 152, 122, 72),
                )

    bg.alpha_composite(detail)

    # Khung kính nhẹ phủ khu nhà kính bên phải (sương sớm trong lành)
    gh_frame = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gfd = ImageDraw.Draw(gh_frame)
    gfd.rectangle([432, 24, W, 684], fill=(214, 244, 252, 26))
    for gy in range(88, 660, 140):
        gfd.line([(432, gy), (W, gy)], fill=(238, 252, 248, 52), width=3)
    # Dải viền phân khu sàn nhà kính với sàn gạch tiệm hoa
    gfd.line([(432, 24), (432, 684)], fill=(104, 134, 108, 125), width=5)
    gfd.line([(432, 684), (W, 684)], fill=(104, 134, 108, 125), width=5)
    bg.alpha_composite(gh_frame)

    # Tường trên cùng của tiệm hoa (trái gỗ ấm, phải khung nhà kính xanh trắng)
    d = ImageDraw.Draw(bg)
    d.rectangle([0, 0, 432, 24], fill=(116, 72, 42, 255))
    d.rectangle([432, 0, W, 24], fill=(166, 200, 184, 255))
    d.line([(0, 24), (W, 24)], fill=INK, width=4)
    return bg


def draw_wet_cobblestone(w: int, h: int, misty: bool = False) -> Image.Image:
    """Đá vỉa hè ướt sương sớm Đà Lạt ngoài 2 cửa tiệm hoa."""
    base_col = (94, 126, 140, 255) if misty else (82, 114, 134, 255)
    im = Image.new("RGBA", (w, h), base_col)
    d = ImageDraw.Draw(im)
    palette = (
        [(118, 152, 166, 255), (106, 140, 156, 255), (130, 164, 176, 255)]
        if misty
        else [(104, 140, 162, 255), (92, 126, 148, 255), (114, 150, 172, 255)]
    )
    row_h = 18
    for r_i, y in enumerate(range(-4, h + row_h, row_h)):
        x_off = (r_i % 2) * 14 - 8
        for c_i, x in enumerate(range(x_off, w + 30, 28)):
            col = palette[(r_i * 5 + c_i * 3) % len(palette)]
            d.rounded_rectangle([x + 2, y + 2, x + 25, y + row_h - 2], radius=5, fill=col, outline=(48, 72, 88, 255), width=2)
            d.line([(x + 6, y + 6), (x + 16, y + 6)], fill=(192, 228, 244, 145), width=2)
    # Vũng sương/nước sáng nhẹ
    d.ellipse([w // 2 - 34, h // 2 - 12, w // 2 + 34, h // 2 + 12], fill=(164, 214, 236, 110))
    return im


def draw_two_entrances(bg: Image.Image):
    """
    Vẽ 2 cửa vào độc lập khớp STAGE_3_DEFINITION:
    1) Cửa chính trên trái: x=40, y=24 -> 2x: (80, 48), rộng x=26..134
    2) Cửa hông nhà kính trên phải: x=330, y=24 -> 2x: (660, 48), rộng x=604..710
    Cửa sổ sương sớm giữa tường trên: x=266..420.
    Không chữ tiếng nước ngoài!
    """
    d = ImageDraw.Draw(bg)

    # Cửa sổ kính mờ sương sớm nhìn ra đồi thông Đà Lạt (giữa trên tường gỗ)
    win_x1, win_x2 = 264, 412
    win_bg = draw_wet_cobblestone(win_x2 - win_x1, 30, misty=True)
    bg.paste(win_bg, (win_x1, 4))
    d.rectangle([win_x1, 4, win_x2, 34], outline=INK, width=4)
    d.line([(win_x1 + 74, 4), (win_x1 + 74, 34)], fill=INK, width=3)
    d.line([(win_x1 + 16, 10), (win_x1 + 28, 26)], fill=(230, 250, 255, 170), width=2)
    d.line([(win_x1 + 92, 10), (win_x1 + 104, 26)], fill=(230, 250, 255, 170), width=2)

    # 1. CỬA CHÍNH TIỆM HOA (trên trái: tâm x=80, y=48)
    d1_x1, d1_x2, d1_y2 = 24, 136, 78
    bg.paste(draw_wet_cobblestone(d1_x2 - d1_x1, d1_y2, misty=False), (d1_x1, 0))
    # Mái hiên sọc xanh lá vườn - kem ấm
    stripe_w = 16
    for idx, sx in enumerate(range(d1_x1 - 6, d1_x2 + 6, stripe_w)):
        col = (66, 146, 86, 255) if idx % 2 == 0 else (252, 242, 214, 255)
        d.rectangle([sx, 0, min(d1_x2 + 6, sx + stripe_w), 20], fill=col, outline=INK, width=3)
    # Khung cửa gỗ hai bên
    d.rectangle([d1_x1 - 6, 18, d1_x1 + 5, d1_y2 + 2], fill=(122, 74, 38, 255), outline=INK, width=4)
    d.rectangle([d1_x2 - 5, 18, d1_x2 + 6, d1_y2 + 2], fill=(122, 74, 38, 255), outline=INK, width=4)

    # 2. CỬA HÔNG NHÀ KÍNH (trên phải: tâm x=660, y=48; dừng x >= 604 để cách xa pad_2 ở x=550!)
    d2_x1, d2_x2, d2_y2 = 606, 712, 78
    bg.paste(draw_wet_cobblestone(d2_x2 - d2_x1, d2_y2, misty=True), (d2_x1, 0))
    # Mái vòm kính khung trắng-xanh nhà kính
    gh_top = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gtd = ImageDraw.Draw(gh_top)
    gtd.rectangle([d2_x1 - 4, 0, d2_x2 + 4, 22], fill=(208, 240, 248, 220), outline=INK, width=3)
    for gx in range(d2_x1 + 18, d2_x2, 22):
        gtd.line([(gx, 0), (gx, 22)], fill=(92, 134, 118, 255), width=3)
    gtd.line([(d2_x1 + 6, 6), (d2_x2 - 6, 6)], fill=(255, 255, 255, 185), width=3)
    bg.alpha_composite(gh_top)
    # Khung cửa trượt nhà kính màu xanh sage-trắng
    d.rectangle([d2_x1 - 5, 18, d2_x1 + 5, d2_y2 + 2], fill=(220, 238, 230, 255), outline=INK, width=4)
    d.rectangle([d2_x2 - 5, 18, d2_x2 + 4, d2_y2 + 2], fill=(220, 238, 230, 255), outline=INK, width=4)


def draw_dual_garden_paths(bg: Image.Image):
    """Vẽ 2 lối đi sỏi đá vườn hoa khớp TUYỆT ĐỐI 100% STAGE_3_DEFINITION.paths[0..1]."""
    path_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pd = ImageDraw.Draw(path_layer)

    scaled_paths = []
    for path in STAGE3_PATHS:
        pts = [(x * S, y * S) for x, y in path]
        pts[0] = (pts[0][0], pts[0][1] + 14)
        scaled_paths.append(pts)

    # Dùng kích thước lẻ đối xứng (63, 55, 47) -> bán kính (31, 27, 23) khớp góc phẳng tuyệt đối & không chạm pad_3 (dx=84px)
    # 1. Bóng mềm viền lối đi
    for pts in scaled_paths:
        for i in range(len(pts) - 1):
            pd.line([pts[i], pts[i + 1]], fill=(52, 34, 22, 85), width=63)
        for x, y in pts:
            pd.ellipse([x - 31, y - 31, x + 31, y + 31], fill=(52, 34, 22, 85))

    # 2. Viền đá nâu trầm ngoài cùng
    for pts in scaled_paths:
        for i in range(len(pts) - 1):
            pd.line([pts[i], pts[i + 1]], fill=(78, 52, 34, 255), width=55)
        for x, y in pts:
            pd.ellipse([x - 27, y - 27, x + 27, y + 27], fill=(78, 52, 34, 255))

    # 3. Lòng lối đi màu cát kem sáng ấm (tương phản rõ cả Rệp xanh, Ốc Sên lam, Bụi Đất nâu, Sương Muối bạc, Nấm tím & Trùm!)
    for pts in scaled_paths:
        for i in range(len(pts) - 1):
            pd.line([pts[i], pts[i + 1]], fill=(238, 222, 188, 255), width=47)
        for x, y in pts:
            pd.ellipse([x - 23, y - 23, x + 23, y + 23], fill=(238, 222, 188, 255))

    # 4. Chỉ dẫn tâm đường & sỏi bước nhỏ xinh
    for pts in scaled_paths:
        for i in range(len(pts) - 1):
            pd.line([pts[i], pts[i + 1]], fill=(166, 134, 96, 130), width=4)

    # Mũi tên đá nhỏ gọn ở điểm hợp ngả (360, 660) dẫn xuống giàn hoa
    pd.ellipse([360 - 16, 660 - 16, 360 + 16, 660 + 16], fill=(220, 198, 156, 255), outline=(140, 108, 72, 180), width=2)
    pd.polygon([(360, 671), (350, 655), (370, 655)], fill=(138, 102, 66, 165))

    # Vài phiến sỏi nhỏ rải nhẹ trên lối đi
    for sx, sy in [
        (80, 140), (80, 226), (174, 300), (280, 420), (280, 560),
        (660, 148), (558, 220), (460, 340), (532, 480), (600, 568), (470, 660),
        (360, 750), (252, 840),
    ]:
        pd.ellipse([sx - 10, sy - 6, sx + 10, sy + 6], fill=(214, 192, 154, 155), outline=(168, 140, 102, 130), width=2)

    bg.alpha_composite(path_layer)

    # Hai tấm thảm chùi chân sạch (KHÔNG chữ nước ngoài!) ở 2 cửa vào
    md = ImageDraw.Draw(bg)
    # Cửa chính (80, 54)
    md.rounded_rectangle([38, 38, 122, 70], radius=7, fill=(136, 86, 46, 255), outline=INK, width=4)
    for sy in (46, 54, 62):
        md.line([(44, sy), (116, sy)], fill=(176, 120, 68, 255), width=3)
    # Cửa nhà kính (660, 54)
    md.rounded_rectangle([620, 38, 700, 70], radius=7, fill=(112, 154, 122, 255), outline=INK, width=4)
    for sy in (46, 54, 62):
        md.line([(626, sy), (694, sy)], fill=(154, 196, 162, 255), width=3)


def main():
    write_flower_shop_svgs()
    props = {
        "flower_rack": Image.open(PNG_DIR / "flower_rack.png").convert("RGBA"),
        "flower_bed": Image.open(PNG_DIR / "flower_bed.png").convert("RGBA"),
        "greenhouse_bench": Image.open(PNG_DIR / "greenhouse_bench.png").convert("RGBA"),
        "terracotta_stack": Image.open(PNG_DIR / "terracotta_stack.png").convert("RGBA"),
        "pot_hydrangea": Image.open(PNG_DIR / "pot_hydrangea.png").convert("RGBA"),
        "pot_rose": Image.open(PNG_DIR / "pot_rose.png").convert("RGBA"),
        "garden_pad": Image.open(PNG_DIR / "garden_pad.png").convert("RGBA"),
    }

    bg = draw_flower_shop_floor()
    draw_two_entrances(bg)

    # Đạo cụ Tiệm Hoa Đà Lạt đặt gọn ở các khoảng trống, KHÔNG chạm bất kỳ đường đi hay 11 ô nào!
    # 1. Luống hoa cẩm tú cầu & hồng ở giữa trên (x=250..422, y=58..180 -> pad_1 phải=229, pad_2 trái=511, path1 y=192)
    bg.alpha_composite(trim_and_fit(props["flower_bed"], 166, 114, pad=2), (252, 62))
    bg.alpha_composite(trim_and_fit(props["pot_hydrangea"], 66, 66, pad=2), (432, 34))

    # 2. Luống hoa & chậu đất nung dọc tường trái (x=10..124, y=350..662 -> dưới path0 y=328, trái pad_4=131, trên pad_11=685)
    bg.alpha_composite(trim_and_fit(props["flower_bed"], 114, 90, pad=2), (10, 356))
    bg.alpha_composite(trim_and_fit(props["terracotta_stack"], 116, 94, pad=2), (10, 462))
    bg.alpha_composite(trim_and_fit(props["pot_rose"], 76, 76, pad=2), (24, 574))

    # 3. Hai chậu nhỏ xinh kẹp giữa pad_3 (376,360) và pad_6 (376,560): y=424..496 sạch sẽ!
    bg.alpha_composite(trim_and_fit(props["pot_hydrangea"], 66, 66, pad=2), (344, 428))

    # 4. Dọc mép nhà kính bên phải (x=634..714, y=260..446 -> phải pad_5=599, dưới path1 y=248, trên path1 y=452)
    bg.alpha_composite(trim_and_fit(props["pot_rose"], 74, 74, pad=2), (636, 272))
    bg.alpha_composite(trim_and_fit(props["pot_hydrangea"], 74, 74, pad=2), (636, 360))

    # 5. Khu vườn nhà kính góc dưới phải (rộng thoáng: x=538..708, y=700..1026 & x=330..536, y=886..1026)
    bg.alpha_composite(trim_and_fit(props["greenhouse_bench"], 166, 186, pad=2), (540, 704))
    bg.alpha_composite(trim_and_fit(props["flower_bed"], 180, 122, pad=2), (528, 900))
    bg.alpha_composite(trim_and_fit(props["terracotta_stack"], 164, 126, pad=2), (350, 898))

    # 6. Chậu hoa nhỏ giữa pad_4 (170,470) và pad_8 (210,744): x=138..236, y=546..676
    bg.alpha_composite(trim_and_fit(props["flower_bed"], 108, 86, pad=2), (136, 560))

    # Vẽ 2 lối đi sỏi kem hợp ngả
    draw_dual_garden_paths(bg)

    # Dán 11 ĐĨA ĐÁ / THẢM CÓI ĐẶT MÓN khớp 100% STAGE_3_DEFINITION.pads
    pad_on_map = trim_and_fit(props["garden_pad"], 78, 78, pad=1)
    for _, px, py in STAGE3_PADS:
        cx, cy = px * S, py * S
        bg.alpha_composite(pad_on_map, (cx - 39, cy - 39))

    # Ánh đèn vàng ấm & GIÀN HOA TRƯNG BÀY ở cuối đường (70*2, 470*2 = 140, 940) — giữ x <= 212 để KHÔNG đè pad_10 (260, 930)!
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for rad, alpha in [(126, 22), (88, 36), (54, 48)]:
        gd.ellipse([116 - rad, 954 - rad, 116 + rad, 954 + rad], fill=(255, 228, 124, alpha))
    bg.alpha_composite(glow)

    rack_placed = trim_and_fit(props["flower_rack"], 194, 166, pad=2)
    bg.alpha_composite(rack_placed, (18, 868))

    # Sương sớm Đà Lạt mỏng nhẹ ở dải mép trên (tạo không khí sáng sớm trong lành)
    mist = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    md = ImageDraw.Draw(mist)
    for mx, my, rx, ry, a in [
        (160, 32, 95, 22, 34),
        (520, 28, 110, 24, 42),
        (650, 92, 68, 22, 30),
    ]:
        md.ellipse([mx - rx, my - ry, mx + rx, my + ry], fill=(238, 250, 255, a))
    bg.alpha_composite(mist)

    # Viền gỗ trầm bo toàn tiệm
    frame = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fd = ImageDraw.Draw(frame)
    fd.rectangle([0, 0, W - 1, H - 1], outline=(54, 34, 20, 225), width=8)
    bg.alpha_composite(frame)

    map_out = OUT_DIR / "map_man3_tiem_hoa.webp"
    bg.convert("RGB").save(map_out, format="WEBP", quality=84, method=6)
    print(f"Saved Stage 3 map: {map_out} ({W}x{H}, {map_out.stat().st_size / 1024:.1f} KB)")

    # Ảnh kiểm tra khớp toạ độ đường đi + 11 ô
    chk = bg.copy()
    cd = ImageDraw.Draw(chk)
    for idx, path in enumerate(STAGE3_PATHS):
        pts = [(x * S, y * S) for x, y in path]
        col = (0, 255, 255, 225) if idx == 0 else (255, 240, 0, 225)
        for i in range(len(pts) - 1):
            cd.line([pts[i], pts[i + 1]], fill=col, width=3)
        for x, y in pts:
            cd.ellipse([x - 7, y - 7, x + 7, y + 7], fill=col)
    for pid, px, py in STAGE3_PADS:
        cx, cy = px * S, py * S
        cd.ellipse([cx - 38, cy - 38, cx + 38, cy + 38], outline=(255, 64, 255, 255), width=3)
        cd.text((cx - 16, cy - 6), pid, fill=(255, 255, 255, 255))
    chk_out = SCRATCH_DIR / "verify_map3_alignment.png"
    chk.save(chk_out)
    print(f"Saved alignment verify: {chk_out}")


if __name__ == "__main__":
    main()
