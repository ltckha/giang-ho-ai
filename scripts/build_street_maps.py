#!/usr/bin/env python3
"""
Vẽ 3 nền bản đồ vector SVG + ghép Pillow (720x1040 = 2x khung logic 360x520):
1. `public/assets/map_trum_pho.webp` (Việc 8 — Trận trùm phố Dốc Đà Lạt, khớp `STAGE_4_DEFINITION`)
2. `public/assets/map_street_tang_bat_ho.webp` (Việc 9 — Phố Tăng Bạt Hổ – Trương Công Định, khớp `street_tang_bat_ho.json`)
3. `public/assets/map_street_pho_ca_phe.webp` (Việc 9 — Phố Cà Phê Nguyễn Chí Thanh – Lê Đại Hành, khớp `street_pho_ca_phe.json`)

Cả 2 phố thật đều ghi rõ "© OpenStreetMap contributors" ở góc dưới nền.
Tất cả đạo cụ render từ vector SVG viền nâu đậm (#2b1a12) bằng `scripts/render_svgs.mjs`.
"""

from __future__ import annotations

import json
import math
import pathlib
import subprocess
from PIL import Image, ImageDraw, ImageFont

REPO_ROOT = pathlib.Path("/home/antigravity/ltckha/giang-ho-ai")
OUT_DIR = REPO_ROOT / "public" / "assets"
SCRATCH_DIR = pathlib.Path(
    "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/e32c673f-fe01-4d9d-9bfe-6f53a784515d/scratch"
)
SVG_DIR = SCRATCH_DIR / "street_maps_svgs"
PNG_DIR = SCRATCH_DIR / "street_maps_pngs"
SVG_DIR.mkdir(parents=True, exist_ok=True)
PNG_DIR.mkdir(parents=True, exist_ok=True)

S = 2
W, H = 360 * S, 520 * S  # 720 x 1040
INK = (43, 26, 18, 255)  # #2b1a12

# Đúng 100% STAGE_4_DEFINITION trong src/core/shops/streetBoss.ts
STAGE4_PATHS = [
    [(30, 24), (30, 110), (330, 110), (330, 230), (30, 230), (30, 350), (330, 350), (330, 470)]
]
STAGE4_PADS = [
    ("pad_1", 100, 55),
    ("pad_2", 230, 55),
    ("pad_3", 80, 170),
    ("pad_4", 180, 170),
    ("pad_5", 280, 170),
    ("pad_6", 80, 290),
    ("pad_7", 180, 290),
    ("pad_8", 280, 290),
    ("pad_9", 90, 410),
    ("pad_10", 190, 410),
    ("pad_11", 265, 425),
]


def load_street_json(filename: str):
    data = json.loads((REPO_ROOT / "src" / "core" / "streets" / "generated" / filename).read_text(encoding="utf-8"))
    st = data["stage"]
    paths = [[(pt["x"], pt["y"]) for pt in path] for path in st["paths"]]
    pads = [(p["id"], p["x"], p["y"]) for p in st["pads"]]
    return paths, pads


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


def write_map_prop_svgs():
    """Tạo toàn bộ đạo cụ kiến trúc Đà Lạt cho 3 bản đồ (viền #2b1a12 đồng nhất Màn 1-3)."""
    svgs: dict[str, str] = {}

    # 1. Ô đặt món lát đá viền ấm (dùng chung cho Trùm phố & Tăng Bạt Hổ)
    svgs["street_pad_night"] = """<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="63" r="49" fill="#181210" opacity="0.42"/>
      <circle cx="60" cy="60" r="48" fill="#4f4238" stroke="#2b1a12" stroke-width="5"/>
      <circle cx="60" cy="60" r="40" fill="#e9cfa0" stroke="#7d5836" stroke-width="3.5"/>
      <circle cx="60" cy="60" r="32" fill="#f5e3be" stroke="#c7a069" stroke-width="2" stroke-dasharray="8 6"/>
      <circle cx="60" cy="60" r="22" fill="#faeed4" opacity="0.65"/>
    </svg>"""

    # 2. Ô đặt món thảm gỗ ấm cho Phố Cà Phê
    svgs["street_pad_cafe"] = """<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="63" r="49" fill="#2b1a12" opacity="0.3"/>
      <circle cx="60" cy="60" r="48" fill="#8b5a34" stroke="#2b1a12" stroke-width="5"/>
      <circle cx="60" cy="60" r="40" fill="#ecd5ab" stroke="#6c4524" stroke-width="3"/>
      <circle cx="60" cy="60" r="31" fill="#f7e8ca" stroke="#b68a52" stroke-width="2.2" stroke-dasharray="9 6"/>
      <circle cx="60" cy="60" r="19" fill="#fff4dd" opacity="0.65"/>
    </svg>"""

    # 3. Mặt tiền Tiệm Giày mini (cho tầng 1 Trùm Phố)
    svgs["mini_shoe_shop"] = """<svg xmlns="http://www.w3.org/2000/svg" width="200" height="130" viewBox="0 0 200 130">
      <rect x="14" y="14" width="172" height="104" rx="10" fill="#2b1a12" opacity="0.32"/>
      <rect x="12" y="10" width="172" height="98" rx="8" fill="#8f4628" stroke="#2b1a12" stroke-width="5"/>
      <path d="M18 22 L178 22 M18 36 L178 36 M18 50 L178 50" stroke="#5e2a16" stroke-width="2.5" opacity="0.65"/>
      <!-- Mái hiên sọc đỏ-kem -->
      <path d="M8 66 L188 66 L194 94 L2 94 Z" fill="#faf0da" stroke="#2b1a12" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M24 66 L20 94 L46 94 L48 66 Z M74 66 L72 94 L98 94 L100 66 Z M124 66 L126 94 L152 94 L148 66 Z M172 66 L176 94 L190 94 L184 66 Z" fill="#c94a38"/>
      <!-- Cửa kính vàng ấm & đôi giày nhỏ -->
      <rect x="38" y="94" width="120" height="18" rx="4" fill="#ffd97d" stroke="#2b1a12" stroke-width="3.5"/>
      <ellipse cx="74" cy="103" rx="14" ry="5" fill="#59c173" stroke="#2b1a12" stroke-width="2"/>
      <ellipse cx="122" cy="103" rx="14" ry="5" fill="#e53935" stroke="#2b1a12" stroke-width="2"/>
      <!-- Biển tròn chiếc dép -->
      <circle cx="98" cy="40" r="18" fill="#fff2cc" stroke="#2b1a12" stroke-width="4"/>
      <ellipse cx="98" cy="40" rx="10" ry="6" transform="rotate(-18 98 40)" fill="#59c173" stroke="#2b1a12" stroke-width="2.5"/>
    </svg>"""

    # 4. Mặt tiền Tiệm Bánh mini (cho tầng 2 Trùm Phố)
    svgs["mini_bakery_shop"] = """<svg xmlns="http://www.w3.org/2000/svg" width="180" height="120" viewBox="0 0 180 120">
      <rect x="12" y="14" width="156" height="94" rx="10" fill="#2b1a12" opacity="0.32"/>
      <rect x="10" y="10" width="156" height="88" rx="8" fill="#a85e2a" stroke="#2b1a12" stroke-width="5"/>
      <rect x="132" y="18" width="22" height="22" rx="4" fill="#6d3e22" stroke="#2b1a12" stroke-width="3.5"/>
      <!-- Mái hiên sọc vàng mật -->
      <path d="M6 62 L170 62 L175 88 L2 88 Z" fill="#fff3d1" stroke="#2b1a12" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M22 62 L18 88 L44 88 L46 62 Z M72 62 L70 88 L96 88 L98 62 Z M122 62 L124 88 L150 88 L146 62 Z" fill="#d98726"/>
      <!-- Tủ bánh sáng -->
      <rect x="30" y="88" width="116" height="16" rx="4" fill="#ffe08a" stroke="#2b1a12" stroke-width="3.5"/>
      <ellipse cx="64" cy="96" rx="13" ry="5" fill="#e89a38" stroke="#2b1a12" stroke-width="2"/>
      <ellipse cx="112" cy="96" rx="13" ry="5" fill="#f0b04c" stroke="#2b1a12" stroke-width="2"/>
      <!-- Biển ổ bánh -->
      <circle cx="84" cy="36" r="17" fill="#fff5d6" stroke="#2b1a12" stroke-width="4"/>
      <ellipse cx="84" cy="36" rx="11" ry="6" fill="#e59735" stroke="#2b1a12" stroke-width="2.5"/>
    </svg>"""

    # 5. Mái nhà kính Tiệm Hoa mini (cho tầng 3 Trùm Phố)
    svgs["mini_flower_shop"] = """<svg xmlns="http://www.w3.org/2000/svg" width="180" height="120" viewBox="0 0 180 120">
      <rect x="12" y="14" width="156" height="94" rx="10" fill="#2b1a12" opacity="0.32"/>
      <rect x="10" y="10" width="156" height="82" rx="8" fill="#9cd3c2" stroke="#2b1a12" stroke-width="5"/>
      <path d="M46 10 L46 92 M88 10 L88 92 M130 10 L130 92 M10 48 L166 48" stroke="#2f6659" stroke-width="3.5"/>
      <path d="M18 18 L70 18 L52 44 L18 44 Z" fill="#ffffff" opacity="0.32"/>
      <!-- Bồn hoa rực rỡ trước hiên -->
      <rect x="18" y="84" width="140" height="22" rx="6" fill="#b86035" stroke="#2b1a12" stroke-width="4"/>
      <circle cx="44" cy="84" r="12" fill="#4ea353" stroke="#2b1a12" stroke-width="3"/>
      <circle cx="44" cy="81" r="6" fill="#60a5fa"/>
      <circle cx="88" cy="84" r="13" fill="#4ea353" stroke="#2b1a12" stroke-width="3"/>
      <circle cx="88" cy="80" r="6.5" fill="#fb7185"/>
      <circle cx="132" cy="84" r="12" fill="#4ea353" stroke="#2b1a12" stroke-width="3"/>
      <circle cx="132" cy="81" r="6" fill="#facc15"/>
    </svg>"""

    # 6. Quầy cuối phố có đèn vàng ấm (Đích Trùm Phố & Tăng Bạt Hổ)
    svgs["end_street_stall"] = """<svg xmlns="http://www.w3.org/2000/svg" width="180" height="150" viewBox="0 0 180 150">
      <ellipse cx="90" cy="126" rx="74" ry="18" fill="#18100d" opacity="0.45"/>
      <!-- Đèn vàng tỏa sáng -->
      <circle cx="90" cy="64" r="60" fill="#ffe082" opacity="0.22"/>
      <!-- Quầy gỗ -->
      <rect x="26" y="72" width="128" height="54" rx="8" fill="#8b4e26" stroke="#2b1a12" stroke-width="5"/>
      <rect x="36" y="84" width="108" height="32" rx="4" fill="#c9894b" stroke="#2b1a12" stroke-width="3"/>
      <!-- Các giỏ đồ/hàng trên quầy -->
      <circle cx="58" cy="96" r="10" fill="#59c173" stroke="#2b1a12" stroke-width="2.5"/>
      <circle cx="90" cy="96" r="10" fill="#f59e0b" stroke="#2b1a12" stroke-width="2.5"/>
      <circle cx="122" cy="96" r="10" fill="#fb7185" stroke="#2b1a12" stroke-width="2.5"/>
      <!-- Cột mái -->
      <rect x="30" y="34" width="10" height="42" fill="#6b3a1b" stroke="#2b1a12" stroke-width="3.5"/>
      <rect x="140" y="34" width="10" height="42" fill="#6b3a1b" stroke="#2b1a12" stroke-width="3.5"/>
      <!-- Mái sọc vàng đỏ -->
      <path d="M14 48 L30 18 L150 18 L166 48 Z" fill="#fff0c9" stroke="#2b1a12" stroke-width="5" stroke-linejoin="round"/>
      <path d="M46 18 L38 48 L66 48 L70 18 Z M94 18 L92 48 L118 48 L116 18 Z M138 18 L142 48 L162 48 L150 18 Z" fill="#c94a38"/>
      <!-- Đèn lồng treo giữa -->
      <circle cx="90" cy="58" r="12" fill="#ffe066" stroke="#2b1a12" stroke-width="3.5"/>
      <circle cx="90" cy="58" r="6" fill="#fff9db"/>
    </svg>"""

    # 7. Quán ăn đêm Tăng Bạt Hổ (bánh căn, sữa nóng, đèn lồng, ghế đẩu)
    svgs["night_food_stall"] = """<svg xmlns="http://www.w3.org/2000/svg" width="230" height="190" viewBox="0 0 230 190">
      <rect x="16" y="18" width="200" height="156" rx="14" fill="#120c10" opacity="0.4"/>
      <!-- Mái tôn quán đêm ấm áp -->
      <rect x="14" y="14" width="196" height="84" rx="10" fill="#7c3526" stroke="#2b1a12" stroke-width="5"/>
      <path d="M14 34 L210 34 M14 54 L210 54 M14 74 L210 74" stroke="#532117" stroke-width="3" opacity="0.65"/>
      <!-- Mái hiên sọc đỏ vàng sáng đèn -->
      <path d="M10 82 L214 82 L220 112 L4 112 Z" fill="#fff2cc" stroke="#2b1a12" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M28 82 L24 112 L54 112 L56 82 Z M84 82 L82 112 L112 112 L114 82 Z M140 82 L142 112 L172 112 L168 82 Z M194 82 L198 112 L216 112 L210 82 Z" fill="#d94f30"/>
      <!-- Bếp than bánh căn + nồi sữa nóng trước hiên -->
      <rect x="20" y="118" width="184" height="54" rx="8" fill="#46352d" stroke="#2b1a12" stroke-width="4"/>
      <!-- Bếp bánh căn tròn đỏ lửa -->
      <circle cx="64" cy="144" r="21" fill="#b85a32" stroke="#2b1a12" stroke-width="4"/>
      <circle cx="58" cy="139" r="5" fill="#ffd43b"/>
      <circle cx="70" cy="139" r="5" fill="#ffd43b"/>
      <circle cx="64" cy="150" r="5" fill="#ffd43b"/>
      <!-- Nồi sữa nóng bốc hơi -->
      <circle cx="122" cy="144" r="18" fill="#7dd3fc" stroke="#2b1a12" stroke-width="4"/>
      <circle cx="122" cy="144" r="12" fill="#fff7e6"/>
      <!-- Hai ghế nhựa nhỏ & bàn ăn đêm -->
      <rect x="156" y="128" width="38" height="28" rx="5" fill="#d99a52" stroke="#2b1a12" stroke-width="3.5"/>
      <circle cx="168" cy="142" r="5" fill="#fff7e6"/>
      <circle cx="182" cy="142" r="5" fill="#fde047"/>
      <!-- Đèn lồng đỏ vàng treo hiên -->
      <circle cx="48" cy="112" r="10" fill="#ff9f43" stroke="#2b1a12" stroke-width="3"/>
      <circle cx="112" cy="112" r="11" fill="#ffe066" stroke="#2b1a12" stroke-width="3"/>
      <circle cx="176" cy="112" r="10" fill="#ff9f43" stroke="#2b1a12" stroke-width="3"/>
    </svg>"""

    # 8. Hostel Phố Tây + dàn xe máy cho thuê (Tăng Bạt Hổ – Trương Công Định)
    svgs["hostel_block"] = """<svg xmlns="http://www.w3.org/2000/svg" width="230" height="190" viewBox="0 0 230 190">
      <rect x="16" y="16" width="200" height="160" rx="14" fill="#120c10" opacity="0.4"/>
      <!-- Mái nhà dốc kiểu Đà Lạt (ngói xám xanh & gác gỗ) -->
      <rect x="14" y="12" width="196" height="106" rx="10" fill="#4f6070" stroke="#2b1a12" stroke-width="5"/>
      <path d="M14 65 L210 65" stroke="#2b1a12" stroke-width="4"/>
      <path d="M40 12 L40 65 M80 12 L80 65 M120 12 L120 65 M160 12 L160 65 M190 12 L190 65" stroke="#364452" stroke-width="2.5"/>
      <path d="M36 65 L36 118 M76 65 L76 118 M116 65 L116 118 M156 65 L156 118 M192 65 L192 118" stroke="#364452" stroke-width="2.5"/>
      <!-- Ống khói & cửa sổ tầng áp mái sáng đèn vàng -->
      <rect x="30" y="26" width="46" height="28" rx="5" fill="#ffe082" stroke="#2b1a12" stroke-width="3.5"/>
      <line x1="53" y1="26" x2="53" y2="54" stroke="#2b1a12" stroke-width="2.5"/>
      <rect x="146" y="26" width="46" height="28" rx="5" fill="#ffd166" stroke="#2b1a12" stroke-width="3.5"/>
      <line x1="169" y1="26" x2="169" y2="54" stroke="#2b1a12" stroke-width="2.5"/>
      <!-- Sân trước hostel & 3 xe máy xếp hàng -->
      <rect x="18" y="120" width="188" height="52" rx="8" fill="#5e5955" stroke="#2b1a12" stroke-width="4"/>
      <!-- 3 xe máy nhìn từ trên xuống -->
      <g stroke="#2b1a12" stroke-width="3">
        <rect x="36" y="132" width="22" height="32" rx="7" fill="#38bdf8"/>
        <line x1="30" y1="138" x2="64" y2="138" stroke-width="4" stroke-linecap="round"/>
        <rect x="96" y="132" width="22" height="32" rx="7" fill="#ef4444"/>
        <line x1="90" y1="138" x2="124" y2="138" stroke-width="4" stroke-linecap="round"/>
        <rect x="156" y="132" width="22" height="32" rx="7" fill="#facc15"/>
        <line x1="150" y1="138" x2="184" y2="138" stroke-width="4" stroke-linecap="round"/>
      </g>
    </svg>"""

    # 9. Bar Dưới Hầm (bậc thang đá xuống hầm ánh đèn neon ấm + tím-xanh, Tăng Bạt Hổ)
    svgs["basement_bar"] = """<svg xmlns="http://www.w3.org/2000/svg" width="220" height="160" viewBox="0 0 220 160">
      <rect x="14" y="14" width="194" height="132" rx="14" fill="#0d0914" opacity="0.45"/>
      <!-- Tường đá cổ Đà Lạt bao quanh hầm -->
      <rect x="12" y="10" width="192" height="130" rx="12" fill="#463b52" stroke="#2b1a12" stroke-width="5"/>
      <!-- Hào quang neon bar dưới hầm -->
      <ellipse cx="108" cy="96" rx="76" ry="38" fill="#a855f7" opacity="0.28"/>
      <ellipse cx="108" cy="100" rx="54" ry="26" fill="#38bdf8" opacity="0.24"/>
      <!-- Bậc thang đá đi xuống cửa hầm tối huyền bí -->
      <rect x="28" y="26" width="102" height="98" rx="8" fill="#261f33" stroke="#2b1a12" stroke-width="4"/>
      <rect x="34" y="34" width="90" height="14" fill="#6b5e7a" stroke="#2b1a12" stroke-width="2.5"/>
      <rect x="34" y="50" width="90" height="14" fill="#584b66" stroke="#2b1a12" stroke-width="2.5"/>
      <rect x="34" y="66" width="90" height="14" fill="#453a54" stroke="#2b1a12" stroke-width="2.5"/>
      <rect x="34" y="82" width="90" height="14" fill="#342b42" stroke="#2b1a12" stroke-width="2.5"/>
      <!-- Cửa vòm hầm phát ánh sáng ấm cam-tím -->
      <rect x="36" y="98" width="86" height="22" rx="4" fill="#f59e0b" stroke="#2b1a12" stroke-width="3"/>
      <!-- Biển ly cocktail neon (không chữ!) bên phải -->
      <circle cx="164" cy="76" r="28" fill="#1e162b" stroke="#38bdf8" stroke-width="4"/>
      <polygon points="150,64 178,64 164,80" fill="#38bdf8" stroke="#e0f2fe" stroke-width="2.5"/>
      <line x1="164" y1="80" x2="164" y2="94" stroke="#e0f2fe" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="154" y1="94" x2="174" y2="94" stroke="#e0f2fe" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="174" cy="64" r="5" fill="#84cc16"/>
    </svg>"""

    # 10. Quán Cà Phê Xưa (Phố Cà Phê — mái ngói đỏ cổ, tường vàng Đà Lạt, ghế gỗ, ly phin)
    svgs["vintage_cafe_house"] = """<svg xmlns="http://www.w3.org/2000/svg" width="290" height="210" viewBox="0 0 290 210">
      <rect x="16" y="18" width="260" height="176" rx="16" fill="#2b1a12" opacity="0.28"/>
      <!-- Mái ngói đỏ xưa kiểu biệt thự cổ Đà Lạt -->
      <rect x="12" y="12" width="260" height="114" rx="12" fill="#a8482c" stroke="#2b1a12" stroke-width="5.5"/>
      <path d="M12 69 L272 69" stroke="#692817" stroke-width="5"/>
      <path d="M44 12 L44 126 M84 12 L84 126 M124 12 L124 126 M164 12 L164 126 M204 12 L204 126 M244 12 L244 126" stroke="#7d311c" stroke-width="2.5" opacity="0.7"/>
      <!-- Cửa sổ mái & ống khói gỗ -->
      <rect x="214" y="24" width="32" height="28" rx="5" fill="#7c4720" stroke="#2b1a12" stroke-width="4"/>
      <rect x="40" y="26" width="52" height="30" rx="6" fill="#ffe699" stroke="#2b1a12" stroke-width="4"/>
      <!-- Hiên gỗ & bàn ghế gỗ cà phê xưa -->
      <rect x="18" y="126" width="248" height="62" rx="10" fill="#d9b27c" stroke="#2b1a12" stroke-width="5"/>
      <path d="M22 146 L262 146 M22 166 L262 166" stroke="#b0844e" stroke-width="2.2"/>
      <!-- 2 bộ bàn gỗ tròn + ly cà phê phin -->
      <circle cx="72" cy="158" r="19" fill="#8b5528" stroke="#2b1a12" stroke-width="3.5"/>
      <circle cx="67" cy="154" r="5" fill="#fff8eb" stroke="#2b1a12" stroke-width="2"/>
      <circle cx="78" cy="162" r="5" fill="#fff8eb" stroke="#2b1a12" stroke-width="2"/>
      <circle cx="152" cy="158" r="19" fill="#8b5528" stroke="#2b1a12" stroke-width="3.5"/>
      <circle cx="152" cy="158" r="6" fill="#fff8eb" stroke="#2b1a12" stroke-width="2"/>
      <!-- Chậu hoa cúc họa mi trên hiên -->
      <circle cx="228" cy="156" r="20" fill="#4ea353" stroke="#2b1a12" stroke-width="3.5"/>
      <circle cx="222" cy="150" r="6" fill="#fffef0"/>
      <circle cx="235" cy="152" r="6" fill="#fffef0"/>
      <circle cx="228" cy="162" r="6" fill="#fffef0"/>
      <circle cx="222" cy="150" r="2.5" fill="#facc15"/>
      <circle cx="235" cy="152" r="2.5" fill="#facc15"/>
      <circle cx="228" cy="162" r="2.5" fill="#facc15"/>
    </svg>"""

    # 11. Cà Phê Sân Thượng (Phố Cà Phê — sàn gỗ sân thượng, dù che nắng, dây đèn, chậu cây xanh)
    svgs["rooftop_terrace_cafe"] = """<svg xmlns="http://www.w3.org/2000/svg" width="220" height="250" viewBox="0 0 220 250">
      <rect x="16" y="18" width="192" height="218" rx="14" fill="#2b1a12" opacity="0.28"/>
      <!-- Sàn gỗ sân thượng ấm -->
      <rect x="12" y="12" width="192" height="216" rx="12" fill="#cfa26b" stroke="#2b1a12" stroke-width="5.5"/>
      <path d="M16 42 L200 42 M16 72 L200 72 M16 102 L200 102 M16 132 L200 132 M16 162 L200 162 M16 192 L200 192" stroke="#a67944" stroke-width="2.5"/>
      <!-- Lan can sắt đen quanh sân thượng -->
      <rect x="20" y="20" width="176" height="200" rx="8" fill="none" stroke="#3c4048" stroke-width="4.5" stroke-dasharray="12 6"/>
      <!-- Dù cà phê tròn kem-xanh rực rỡ trên -->
      <circle cx="108" cy="82" r="46" fill="#2b1a12" opacity="0.2"/>
      <circle cx="104" cy="76" r="44" fill="#faf0da" stroke="#2b1a12" stroke-width="4.5"/>
      <path d="M104 76 L104 32 A44 44 0 0 1 142 54 Z" fill="#4f9e5a"/>
      <path d="M104 76 L142 98 A44 44 0 0 1 104 120 Z" fill="#4f9e5a"/>
      <path d="M104 76 L66 98 A44 44 0 0 1 66 54 Z" fill="#4f9e5a"/>
      <circle cx="104" cy="76" r="7" fill="#c9894b" stroke="#2b1a12" stroke-width="3"/>
      <!-- Dù cà phê thứ 2 dưới phải -->
      <circle cx="136" cy="176" r="36" fill="#fff4d6" stroke="#2b1a12" stroke-width="4"/>
      <path d="M136 176 L136 140 A36 36 0 0 1 168 158 Z" fill="#d97706"/>
      <path d="M136 176 L168 194 A36 36 0 0 1 136 212 Z" fill="#d97706"/>
      <path d="M136 176 L104 194 A36 36 0 0 1 104 158 Z" fill="#d97706"/>
      <circle cx="136" cy="176" r="6" fill="#8b5528" stroke="#2b1a12" stroke-width="2.5"/>
      <!-- Bồn cây xanh & dây đèn vàng -->
      <circle cx="46" cy="170" r="22" fill="#45944d" stroke="#2b1a12" stroke-width="3.5"/>
      <circle cx="42" cy="165" r="12" fill="#68bf6a"/>
      <circle cx="52" cy="178" r="5" fill="#fb7185"/>
      <!-- Dây đèn ấm -->
      <path d="M24 30 Q108 56 192 30" fill="none" stroke="#2b1a12" stroke-width="2"/>
      <circle cx="58" cy="39" r="5" fill="#ffe066"/>
      <circle cx="108" cy="43" r="5" fill="#ffe066"/>
      <circle cx="158" cy="39" r="5" fill="#ffe066"/>
    </svg>"""

    # 12. Cụm thông xanh Đà Lạt (tán lá nhiều lớp tươi mát)
    svgs["pine_cluster"] = """<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
      <circle cx="92" cy="98" r="68" fill="#2b1a12" opacity="0.22"/>
      <circle cx="62" cy="108" r="44" fill="#2f7044" stroke="#2b1a12" stroke-width="5"/>
      <circle cx="118" cy="112" r="42" fill="#3a824f" stroke="#2b1a12" stroke-width="5"/>
      <circle cx="88" cy="70" r="48" fill="#48995a" stroke="#2b1a12" stroke-width="5"/>
      <circle cx="80" cy="60" r="26" fill="#6cc276"/>
      <circle cx="116" cy="102" r="22" fill="#5cb368"/>
      <circle cx="54" cy="100" r="20" fill="#4ea35c"/>
      <!-- Vài bông hoa cẩm tú cầu / mimosa vàng nhỏ xen giữa -->
      <circle cx="122" cy="78" r="8" fill="#ffd43b" stroke="#2b1a12" stroke-width="2"/>
      <circle cx="134" cy="86" r="7" fill="#ffe066" stroke="#2b1a12" stroke-width="2"/>
      <circle cx="48" cy="126" r="9" fill="#74c0fc" stroke="#2b1a12" stroke-width="2"/>
    </svg>"""

    # 13. Cây thông đơn tròn (dùng rải rác ven dốc)
    svgs["pine_single"] = """<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <circle cx="62" cy="66" r="44" fill="#2b1a12" opacity="0.24"/>
      <circle cx="60" cy="60" r="42" fill="#367a49" stroke="#2b1a12" stroke-width="5"/>
      <circle cx="52" cy="50" r="25" fill="#52a862"/>
      <circle cx="68" cy="68" r="18" fill="#429153"/>
      <circle cx="46" cy="44" r="10" fill="#7ad183"/>
    </svg>"""

    # 14. Quầy cà phê đích (bên trái Phố Cà Phê tại 30, 296)
    svgs["cafe_end_veranda"] = """<svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 130 130">
      <circle cx="65" cy="65" r="56" fill="#ffe082" opacity="0.22"/>
      <rect x="16" y="18" width="98" height="94" rx="14" fill="#7c4720" stroke="#2b1a12" stroke-width="5"/>
      <rect x="24" y="26" width="82" height="78" rx="10" fill="#e5b87a" stroke="#2b1a12" stroke-width="3.5"/>
      <!-- Biểu tượng ly cà phê nóng lớn ở trung tâm -->
      <circle cx="65" cy="65" r="24" fill="#fff8e7" stroke="#2b1a12" stroke-width="4"/>
      <circle cx="65" cy="65" r="16" fill="#5c3317"/>
      <path d="M58 60 Q65 55 72 60" stroke="#d9a574" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="96" cy="36" r="8" fill="#ffe066" stroke="#2b1a12" stroke-width="2.5"/>
    </svg>"""

    for name, content in svgs.items():
        (SVG_DIR / f"{name}.svg").write_text(content, encoding="utf-8")

    subprocess.run(
        ["node", str(REPO_ROOT / "scripts" / "render_svgs.mjs"), str(SVG_DIR), str(PNG_DIR), "256"],
        check=True,
    )


def draw_osm_attribution(bg: Image.Image, text: str = "© OpenStreetMap contributors", align: str = "right"):
    """Ghi nguồn bản đồ OpenStreetMap rõ nét, trang nhã ở góc dưới nền."""
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 17)
    except Exception:
        font = ImageFont.load_default()
    bbox = od.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pad_x, pad_y = 12, 6
    by1 = H - th - pad_y * 2 - 12
    by2 = H - 12
    if align == "left":
        bx1 = 14
        bx2 = bx1 + tw + pad_x * 2
    else:
        bx1 = W - tw - pad_x * 2 - 14
        bx2 = W - 14
    od.rounded_rectangle([bx1, by1, bx2, by2], radius=9, fill=(28, 20, 16, 200), outline=(245, 224, 178, 165), width=2)
    od.text((bx1 + pad_x, by1 + pad_y - 2), text, fill=(255, 245, 224, 245), font=font)
    bg.alpha_composite(overlay)


def draw_polyline_road(
    bg: Image.Image,
    paths: list[list[tuple[int, int]]],
    road_w: int,
    border_col: tuple[int, int, int, int],
    fill_col: tuple[int, int, int, int],
    dash_col: tuple[int, int, int, int],
    shadow_col: tuple[int, int, int, int] = (20, 14, 12, 95),
    entrance_col: tuple[int, int, int, int] = (86, 180, 232, 220),
):
    """Vẽ mặt đường uốn lượn khớp 100% stage.paths với bo tròn khớp nối & vạch kẻ giữa."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    scaled_paths = [[(x * S, y * S) for x, y in path] for path in paths]

    sw = road_w + 14
    bw = road_w + 6
    fw = road_w

    # 1. Bóng mềm dưới đường
    for pts in scaled_paths:
        for i in range(len(pts) - 1):
            d.line([pts[i], pts[i + 1]], fill=shadow_col, width=sw)
        r = sw // 2
        for x, y in pts:
            d.ellipse([x - r, y - r, x + r, y + r], fill=shadow_col)

    # 2. Bó vỉa / viền đường
    for pts in scaled_paths:
        for i in range(len(pts) - 1):
            d.line([pts[i], pts[i + 1]], fill=border_col, width=bw)
        r = bw // 2
        for x, y in pts:
            d.ellipse([x - r, y - r, x + r, y + r], fill=border_col)

    # 3. Mặt đường chính
    for pts in scaled_paths:
        for i in range(len(pts) - 1):
            d.line([pts[i], pts[i + 1]], fill=fill_col, width=fw)
        r = fw // 2
        for x, y in pts:
            d.ellipse([x - r, y - r, x + r, y + r], fill=fill_col)

    # 4. Vạch kẻ tâm đường đứt nét & mũi tên chỉ hướng dốc
    for pts in scaled_paths:
        for i in range(len(pts) - 1):
            x1, y1 = pts[i]
            x2, y2 = pts[i + 1]
            seg = math.hypot(x2 - x1, y2 - y1)
            if seg < 10:
                continue
            ux, uy = (x2 - x1) / seg, (y2 - y1) / seg
            dist = 10.0
            while dist + 14 < seg:
                ax, ay = x1 + ux * dist, y1 + uy * dist
                bx, by = x1 + ux * (dist + 14), y1 + uy * (dist + 14)
                d.line([(ax, ay), (bx, by)], fill=dash_col, width=4)
                dist += 30.0

    # 5. Dấu cửa vào (mũi tên dẫn nhẹ ở đầu mỗi path)
    for pts in scaled_paths:
        if len(pts) < 2:
            continue
        x0, y0 = pts[0]
        x1, y1 = pts[1]
        ang = math.atan2(y1 - y0, x1 - x0)
        d.ellipse([x0 - 20, y0 - 20, x0 + 20, y0 + 20], fill=entrance_col, outline=INK, width=4)
        # Mũi tên chỉ hướng đi vào
        tip = (x0 + math.cos(ang) * 11, y0 + math.sin(ang) * 11)
        left = (x0 + math.cos(ang + 2.35) * 9, y0 + math.sin(ang + 2.35) * 9)
        right = (x0 + math.cos(ang - 2.35) * 9, y0 + math.sin(ang - 2.35) * 9)
        d.polygon([tip, left, right], fill=(255, 250, 232, 245))

    bg.alpha_composite(layer)


def save_verify(bg: Image.Image, paths, pads, name: str):
    chk = bg.copy()
    cd = ImageDraw.Draw(chk)
    for idx, path in enumerate(paths):
        pts = [(x * S, y * S) for x, y in path]
        col = (0, 255, 255, 230) if idx == 0 else (255, 230, 0, 230)
        for i in range(len(pts) - 1):
            cd.line([pts[i], pts[i + 1]], fill=col, width=3)
        for x, y in pts:
            cd.ellipse([x - 6, y - 6, x + 6, y + 6], fill=col)
    for pid, px, py in pads:
        cx, cy = px * S, py * S
        cd.ellipse([cx - 38, cy - 38, cx + 38, cy + 38], outline=(255, 64, 255, 255), width=3)
        cd.text((cx - 16, cy - 6), pid, fill=(255, 255, 255, 255))
    chk.save(SCRATCH_DIR / f"verify_{name}.png")


def build_stage4_boss_map(props: dict[str, Image.Image]):
    """Việc 8: Nền bản đồ Trận trùm phố Dốc Đà Lạt (map_trum_pho.webp)."""
    bg = Image.new("RGBA", (W, H), (44, 48, 60, 255))
    d = ImageDraw.Draw(bg)

    # Nền dốc đá Đà Lạt trời bão tối (3 tầng dốc chuyển sắc từ xanh bão lạnh -> nâu trầm ấm ở cuối phố)
    for y in range(H):
        t = y / H
        r = int(46 + t * 26)
        g = int(52 + t * 18)
        b = int(66 + t * 6)
        d.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Gạch đá lát vỉa hè dốc đều tăm tắp (nhẹ mắt để nổi rõ tháp & quái)
    tile_w, tile_h = 40, 26
    for r_i, y in enumerate(range(0, H + tile_h, tile_h)):
        x_off = (r_i % 2) * 20
        for c_i, x in enumerate(range(-20 + x_off, W + tile_w, tile_w)):
            shade = ((r_i * 7 + c_i * 3) % 3) * 5 - 5
            base = bg.getpixel((max(0, min(W - 1, x + 10)), max(0, min(H - 1, y + 10))))
            col = (max(0, base[0] + shade), max(0, base[1] + shade), max(0, base[2] + shade), 255)
            d.rounded_rectangle([x + 2, y + 2, x + tile_w - 2, y + tile_h - 2], radius=4, fill=col, outline=(32, 34, 44, 150), width=1)

    # Mây bão đen xoáy ở đầu dốc trên trái (30*2=60, 24*2=48)
    storm = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(storm)
    for cx, cy, rx, ry, col in [
        (78, 36, 125, 42, (26, 32, 48, 175)),
        (160, 22, 95, 32, (32, 42, 60, 145)),
        (42, 62, 68, 34, (22, 28, 42, 165)),
    ]:
        sd.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=col)
    bg.alpha_composite(storm)

    # 3 TẦNG PHỐ — đặt các mặt tiền 3 tiệm gọn gàng KHÔNG chạm bất kỳ pad hay đường nào!
    # Tầng 1 (Tiệm Giày, trên đường y=220): khoảng trống giữa pad_1(200,110) và pad_2(460,110) là x=255..405, y=10..150, và bên phải pad_2 x=520..706, y=10..165
    bg.alpha_composite(trim_and_fit(props["mini_shoe_shop"], 150, 102, pad=2), (256, 14))
    bg.alpha_composite(trim_and_fit(props["mini_shoe_shop"], 166, 112, pad=2), (534, 18))

    # Tầng 2 (Tiệm Bánh, giữa đường y=220 và y=460): pad_3(160,340), pad_4(360,340), pad_5(560,340)
    # Các khe ngang rộng thoáng: x=206..314, x=406..514, và mép trái x=12..108
    bg.alpha_composite(trim_and_fit(props["mini_bakery_shop"], 108, 76, pad=2), (206, 260))
    bg.alpha_composite(trim_and_fit(props["mini_bakery_shop"], 108, 76, pad=2), (406, 260))
    bg.alpha_composite(trim_and_fit(props["pine_single"], 76, 76, pad=2), (22, 294))

    # Tầng 3 (Tiệm Hoa, giữa đường y=460 và y=700): pad_6(160,580), pad_7(360,580), pad_8(560,580)
    bg.alpha_composite(trim_and_fit(props["mini_flower_shop"], 108, 76, pad=2), (206, 502))
    bg.alpha_composite(trim_and_fit(props["mini_flower_shop"], 108, 76, pad=2), (406, 502))
    bg.alpha_composite(trim_and_fit(props["pine_single"], 76, 76, pad=2), (628, 540))

    # Ven dưới trái (dưới đường y=700, bên trái pad_9(180,820) và dưới pad_9/10 y=890..1020)
    bg.alpha_composite(trim_and_fit(props["pine_cluster"], 132, 128, pad=2), (10, 888))
    bg.alpha_composite(trim_and_fit(props["pine_single"], 86, 86, pad=2), (250, 922))
    bg.alpha_composite(trim_and_fit(props["pine_single"], 82, 82, pad=2), (382, 928))

    # Vẽ đường phố dốc chữ S 3 tầng khớp 100% STAGE4_PATHS
    draw_polyline_road(
        bg,
        STAGE4_PATHS,
        road_w=46,
        border_col=(36, 28, 24, 255),
        fill_col=(186, 174, 152, 255),
        dash_col=(118, 102, 82, 150),
        entrance_col=(56, 158, 218, 235),
    )

    # Lá cây bị gió lốc cuốn bay nhẹ dọc con dốc
    leaves = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(leaves)
    for lx, ly, col in [
        (140, 214, (132, 186, 92, 200)),
        (296, 226, (214, 148, 64, 195)),
        (476, 210, (132, 186, 92, 200)),
        (600, 452, (214, 148, 64, 195)),
        (430, 466, (112, 174, 86, 195)),
        (230, 458, (226, 166, 72, 190)),
        (170, 696, (120, 182, 90, 195)),
        (468, 706, (214, 148, 64, 195)),
    ]:
        ld.ellipse([lx - 9, ly - 4, lx + 9, ly + 4], fill=col, outline=INK, width=2)
    bg.alpha_composite(leaves)

    # Dán 11 ô đặt món khớp 100% STAGE4_PADS
    pad_im = trim_and_fit(props["street_pad_night"], 78, 78, pad=1)
    for _, px, py in STAGE4_PADS:
        bg.alpha_composite(pad_im, (px * S - 39, py * S - 39))

    # Quầy cuối phố có đèn vàng ấm tại (330*2=660, 470*2=940) — giữ x>=582 để cách pad_11(530,850) thật thoáng!
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for rad, a in [(112, 28), (74, 42), (44, 54)]:
        gd.ellipse([644 - rad, 956 - rad, 644 + rad, 956 + rad], fill=(255, 220, 110, a))
    bg.alpha_composite(glow)
    stall = trim_and_fit(props["end_street_stall"], 136, 118, pad=2)
    bg.alpha_composite(stall, (576, 898))

    # Viền trầm bao quanh bản đồ
    fd = ImageDraw.Draw(bg)
    fd.rectangle([0, 0, W - 1, H - 1], outline=(34, 24, 18, 235), width=8)

    out_path = OUT_DIR / "map_trum_pho.webp"
    bg.convert("RGB").save(out_path, format="WEBP", quality=80, method=6)
    save_verify(bg, STAGE4_PATHS, STAGE4_PADS, "map_trum_pho")
    print(f"Saved {out_path.name}: {out_path.stat().st_size / 1024:.1f} KB")


def build_tang_bat_ho_map(props: dict[str, Image.Image]):
    """Việc 9: Phố Tăng Bạt Hổ – Trương Công Định (dốc gần chợ, quán ăn đêm, hostel, bar dưới hầm)."""
    paths, pads = load_street_json("street_tang_bat_ho.json")

    bg = Image.new("RGBA", (W, H), (42, 46, 62, 255))
    d = ImageDraw.Draw(bg)

    # Nền phố đêm Đà Lạt: sắc xanh tím đêm dịu, ấm dần về khu chợ & quán ăn đêm
    for y in range(H):
        t = y / H
        r = int(42 + t * 22)
        g = int(46 + t * 14)
        b = int(66 - t * 8)
        d.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Gạch vỉa hè & đường đồng mức dốc Đà Lạt
    for r_i, y in enumerate(range(0, H + 32, 32)):
        x_off = (r_i % 2) * 22
        for c_i, x in enumerate(range(-22 + x_off, W + 44, 44)):
            shade = ((r_i * 5 + c_i * 3) % 3) * 4 - 4
            base = bg.getpixel((max(0, min(W - 1, x + 12)), max(0, min(H - 1, y + 12))))
            col = (max(0, base[0] + shade), max(0, base[1] + shade), max(0, base[2] + shade), 255)
            d.rounded_rectangle([x + 2, y + 2, x + 41, y + 29], radius=5, fill=col, outline=(30, 32, 46, 130), width=1)

    # Đường đồng mức dốc mềm (gợi địa hình dốc chợ -> phố Tây)
    contour = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cd = ImageDraw.Draw(contour)
    for cy in (190, 390, 610, 820):
        cd.arc([-160, cy - 110, W + 160, cy + 110], 10, 170, fill=(132, 152, 186, 40), width=3)
    bg.alpha_composite(contour)

    # Quầng đèn vàng ấm khu quán ăn đêm & neon bar dưới hầm ở nửa phải thoáng rộng (x=470..708, y=380..950)
    lights = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lights)
    for lx, ly, rad, col in [
        (595, 505, 110, (255, 190, 88, 34)),   # Đèn quán ăn đêm
        (595, 695, 96, (255, 212, 112, 28)),   # Đèn cửa sổ hostel
        (595, 865, 95, (168, 85, 247, 36)),    # Ánh neon bar dưới hầm
        (386, 904, 115, (255, 214, 102, 38)),  # Đèn quầy cuối phố
    ]:
        ld.ellipse([lx - rad, ly - rad, lx + rad, ly + rad], fill=col)
    bg.alpha_composite(lights)

    # ĐẠO CỤ PHỐ TĂNG BẠT HỔ – TRƯƠNG CÔNG ĐỊNH (kiểm tra kỹ KHÔNG đè 11 pad & 2 đường!)
    # 1. Dốc gần chợ phía trên-giữa & trên-trái:
    #    - Khe trên-trái: x=8..106, y=10..150 (pad_6 ở 156,84; pad_7 ở 84,228 -> góc (8,8) cỡ 90x72 sạch!)
    bg.alpha_composite(trim_and_fit(props["pine_single"], 86, 86, pad=2), (10, 14))
    #    - Trong lòng vòng cua trên (giữa y=110..205, x=230..340): nhỏ gọn không chạm pad_1(396,228)
    bg.alpha_composite(trim_and_fit(props["mini_bakery_shop"], 114, 78, pad=2), (232, 116))
    # 2. Dãy phố ăn đêm + Hostel + Bar dưới hầm dọc sườn phải (x=475..704, y=386..962 — hoàn toàn thoáng!)
    #    (pad_5 ở 444,348; pad_8 ở 564,300; pad_10 ở 396,468 -> từ x>=486, y>=390 trở xuống trống 100%!)
    bg.alpha_composite(trim_and_fit(props["night_food_stall"], 214, 174, pad=2), (490, 396))
    bg.alpha_composite(trim_and_fit(props["hostel_block"], 214, 174, pad=2), (490, 588))
    bg.alpha_composite(trim_and_fit(props["basement_bar"], 206, 152, pad=2), (494, 782))
    # 3. Cây thông xanh góc dưới trái gần cửa vào 2 (pad_11 ở 228,708; path1 ở x=72..100, y=756..980 -> khoảng x=136..270, y=790..950 thoáng!)
    bg.alpha_composite(trim_and_fit(props["pine_cluster"], 122, 122, pad=2), (144, 818))
    bg.alpha_composite(trim_and_fit(props["pine_single"], 74, 74, pad=2), (628, 254))

    # Vẽ 2 nhánh đường khớp 100% street_tang_bat_ho.json
    draw_polyline_road(
        bg,
        paths,
        road_w=42,
        border_col=(36, 28, 26, 255),
        fill_col=(188, 178, 162, 255),
        dash_col=(110, 96, 80, 155),
        entrance_col=(72, 176, 236, 235),
    )

    # Dán 11 ô đặt món khớp 100% stage.pads
    pad_im = trim_and_fit(props["street_pad_night"], 76, 76, pad=1)
    for _, px, py in pads:
        bg.alpha_composite(pad_im, (px * S - 38, py * S - 38))

    # Quầy đích ấm áp cuối đường (193*2=386, 448*2=896)
    stall = trim_and_fit(props["end_street_stall"], 128, 112, pad=2)
    bg.alpha_composite(stall, (322, 858))

    # Viền khung + dòng ghi nguồn OSM ở góc dưới
    fd = ImageDraw.Draw(bg)
    fd.rectangle([0, 0, W - 1, H - 1], outline=(34, 24, 18, 235), width=8)
    draw_osm_attribution(bg, "© OpenStreetMap contributors", align="right")

    out_path = OUT_DIR / "map_street_tang_bat_ho.webp"
    bg.convert("RGB").save(out_path, format="WEBP", quality=80, method=6)
    save_verify(bg, paths, pads, "map_tang_bat_ho")
    print(f"Saved {out_path.name}: {out_path.stat().st_size / 1024:.1f} KB")


def build_pho_ca_phe_map(props: dict[str, Image.Image]):
    """Việc 9: Phố Cà Phê Nguyễn Chí Thanh – Lê Đại Hành (quán cà phê xưa, sân thượng, nhiều cây xanh)."""
    paths, pads = load_street_json("street_pho_ca_phe.json")

    bg = Image.new("RGBA", (W, H), (104, 134, 96, 255))
    d = ImageDraw.Draw(bg)

    # Nền đồi cà phê Đà Lạt buổi sớm: cỏ xanh rêu dịu chuyển sắc ấm mềm
    for y in range(H):
        t = y / H
        r = int(112 + t * 20)
        g = int(146 - t * 12)
        b = int(102 - t * 8)
        d.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Ô lát sân vườn đá xen cỏ dịu mắt
    for r_i, y in enumerate(range(0, H + 40, 40)):
        x_off = (r_i % 2) * 24
        for c_i, x in enumerate(range(-24 + x_off, W + 48, 48)):
            shade = ((r_i * 3 + c_i * 5) % 3) * 5 - 5
            base = bg.getpixel((max(0, min(W - 1, x + 12)), max(0, min(H - 1, y + 12))))
            col = (max(0, base[0] + shade), max(0, base[1] + shade), max(0, base[2] + shade), 255)
            d.rounded_rectangle([x + 3, y + 3, x + 44, y + 36], radius=8, fill=col, outline=(74, 102, 70, 120), width=1)

    # Đường đồng mức đồi thông Khu Hoà Bình
    contour = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cd = ImageDraw.Draw(contour)
    for cy in (160, 380, 650, 900):
        cd.arc([-140, cy - 110, W + 140, cy + 110], 12, 168, fill=(224, 240, 206, 52), width=3)
    bg.alpha_composite(contour)

    # ĐẠO CỤ PHỐ CÀ PHÊ (quán cà phê xưa, sân thượng, rất nhiều cây xanh — KHÔNG đè 11 pad & 2 đường!)
    # 1. Góc trên trái cực rộng (x=10..380, y=10..390 — gần nhất là pad_5 ở 444,156 và path0 ở 262,446!):
    #    -> Đặt Quán Cà Phê Xưa mái ngói đỏ + bàn ghế gỗ & vườn thông xanh rợp bóng!
    bg.alpha_composite(trim_and_fit(props["vintage_cafe_house"], 270, 196, pad=2), (24, 20))
    bg.alpha_composite(trim_and_fit(props["pine_cluster"], 164, 164, pad=2), (16, 224))
    bg.alpha_composite(trim_and_fit(props["pine_single"], 108, 108, pad=2), (202, 232))
    bg.alpha_composite(trim_and_fit(props["pine_single"], 92, 92, pad=2), (314, 18))

    # 2. Sườn giữa phải thoáng rộng (x=485..706, y=390..700 — dưới pad_7(540,324), trên pad_10(564,780), phải pad_8(420,660)!):
    #    -> Đặt Cà Phê Sân Thượng nhìn xuống phố có dù che nắng & dây đèn ấm!
    bg.alpha_composite(trim_and_fit(props["rooftop_terrace_cafe"], 204, 236, pad=2), (500, 412))
    bg.alpha_composite(trim_and_fit(props["pine_single"], 92, 92, pad=2), (384, 418))

    # 3. Góc dưới trái đầy cây xanh (chừa mép dưới cho nguồn OSM)
    bg.alpha_composite(trim_and_fit(props["pine_cluster"], 156, 156, pad=2), (18, 822))
    bg.alpha_composite(trim_and_fit(props["pine_single"], 86, 86, pad=2), (192, 892))
    # Một cây thông xinh ở mép phải trên góc (x=626, y=268)
    bg.alpha_composite(trim_and_fit(props["pine_single"], 86, 86, pad=2), (620, 260))

    # Vẽ 2 lối phố cà phê uốn lượn khớp 100% street_pho_ca_phe.json
    draw_polyline_road(
        bg,
        paths,
        road_w=42,
        border_col=(82, 56, 36, 255),
        fill_col=(236, 220, 188, 255),
        dash_col=(166, 134, 96, 155),
        entrance_col=(72, 176, 236, 235),
    )

    # Dán 11 ô đặt món thảm gỗ ấm khớp 100% stage.pads
    pad_im = trim_and_fit(props["street_pad_cafe"], 76, 76, pad=1)
    for _, px, py in pads:
        bg.alpha_composite(pad_im, (px * S - 38, py * S - 38))

    # Quầy Cà Phê đích ở cuối đường (30*2=60, 296*2=592) — giữ y <= 638 để cách xa pad_4(60,684) và pad_3(132,492)!
    veranda = trim_and_fit(props["cafe_end_veranda"], 82, 82, pad=2)
    bg.alpha_composite(veranda, (16, 550))

    # Viền khung + dòng ghi nguồn OSM ở góc dưới trái (tránh cửa vào ở dưới phải)
    fd = ImageDraw.Draw(bg)
    fd.rectangle([0, 0, W - 1, H - 1], outline=(54, 34, 20, 230), width=8)
    draw_osm_attribution(bg, "© OpenStreetMap contributors", align="left")

    out_path = OUT_DIR / "map_street_pho_ca_phe.webp"
    bg.convert("RGB").save(out_path, format="WEBP", quality=80, method=6)
    save_verify(bg, paths, pads, "map_pho_ca_phe")
    print(f"Saved {out_path.name}: {out_path.stat().st_size / 1024:.1f} KB")


def main():
    write_map_prop_svgs()
    props = {p.stem: Image.open(p).convert("RGBA") for p in sorted(PNG_DIR.glob("*.png"))}
    build_stage4_boss_map(props)
    build_tang_bat_ho_map(props)
    build_pho_ca_phe_map(props)


if __name__ == "__main__":
    main()
