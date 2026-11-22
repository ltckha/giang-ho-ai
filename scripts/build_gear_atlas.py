#!/usr/bin/env python3
"""
Tạo Texture Atlas riêng cho Trang bị chủ tiệm (public/assets/gear_atlas.webp + gear_atlas.json):
- 50 biểu tượng đồ (10 loại × 5 hành) khớp 100% GEAR_NAMES trong src/core/equipment.ts:
  * 20 món (hat, glasses, shoes, bag × 5 hành) từ tranh sinh sẵn trên nền trắng sạch, tách nền trong suốt & đục lỗ quai túi/gọng kính.
  * 30 món (jacket, belt, wallet, watch, phone, umbrella × 5 hành) vẽ vector SVG hoạt hình nét viền #2b1a12 + tô cel-shading đa tầng, render 256×256 qua Playwright Chromium (scripts/render_svgs.mjs).
- 2 hình rương quà mở đồ khi thắng màn (gear_chest_closed, gear_chest_open).
- 4 huy hiệu bộ đồ (set_di_mua, set_phuot, set_van_phong, set_chu_tiem_xin).
Tổng cộng: 56 khung hình trong suốt sắc nét, KHÔNG đụng chạm gon_tiem_atlas.webp (giữ nguyên 288 khung của 3 màn).
"""

from __future__ import annotations

from collections import deque
import json
import pathlib
import subprocess
from PIL import Image, ImageDraw

REPO_ROOT = pathlib.Path("/home/antigravity/ltckha/giang-ho-ai")
OUT_DIR = REPO_ROOT / "public" / "assets"
ART_DIR = pathlib.Path(
    "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/95b741c0-c2ce-49c9-a448-bbd79db506aa"
)
SCRATCH_DIR = ART_DIR / "scratch"
SVG_DIR = SCRATCH_DIR / "gear_svgs"
PNG_DIR = SCRATCH_DIR / "gear_pngs"

SHEET_1 = ART_DIR / "gear_sheet_1_hat_glasses_1795381248184.jpg"
SHEET_3 = ART_DIR / "gear_sheet_3_shoes_bag_1795381251288.jpg"

INK = "#2b1a12"


# ---------------------------------------------------------------------------
# Background removal & sprite normalization (matching Stage 1 v2 / Stage 3)
# ---------------------------------------------------------------------------

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
                    border_halo.append((x, y, 125))
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


def crop_clean(
    sheet: Image.Image,
    box: tuple[int, int, int, int],
    white_thresh: int = 236,
    sat_thresh: int = 22,
    punch_holes: bool = False,
    punch_min_area: int = 120,
    protect_frac: tuple[float, float, float, float] | None = None,
) -> Image.Image:
    sub = sheet.crop(box)
    padded = Image.new("RGB", (sub.width + 16, sub.height + 16), (255, 255, 255))
    padded.paste(sub, (8, 8))
    im = remove_white_bg_floodfill(padded, white_thresh=white_thresh, sat_thresh=sat_thresh)
    if punch_holes:
        cw, ch = im.size
        pr = None
        if protect_frac is not None:
            pr = (
                int(cw * protect_frac[0]),
                int(ch * protect_frac[1]),
                int(cw * protect_frac[2]),
                int(ch * protect_frac[3]),
            )
        im = punch_interior_white_holes(im, min_area=punch_min_area, white_thresh=236, sat_thresh=18, protect_rect=pr)
    return im


def trim_and_fit(img: Image.Image, box_size: int, pad: int = 4) -> Image.Image:
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


# ---------------------------------------------------------------------------
# Rich Cel-Shaded Cartoon SVG Generators (matching generated sprite sheets!)
# ---------------------------------------------------------------------------

def wrap_svg(body: str, size: int = 256) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 240 240">'
        f"{body}</svg>"
    )


def svg_jacket(el: str) -> str:
    # Distinct jacket silhouettes per GEAR_NAMES:
    # kim: Áo Gió Bạc (hooded silver windbreaker)
    # moc: Áo Khoác Kaki Xanh (olive khaki field jacket with flap pockets)
    # thuy: Áo Mưa Trong (translucent sky-blue hooded raincoat)
    # hoa: Áo Phao Đỏ (puffy quilted crimson puffer jacket)
    # tho: Áo Khoác Dạ Nâu (warm brown wool trench overcoat with lapels & wood buttons)
    if el == "kim":
        return wrap_svg(f"""
        <defs>
          <linearGradient id="jk_kim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f1f5f9"/>
            <stop offset="48%" stop-color="#cbd5e1"/>
            <stop offset="100%" stop-color="#8b99ab"/>
          </linearGradient>
          <linearGradient id="jk_kim_dark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#94a3b8"/>
            <stop offset="100%" stop-color="#5d6b7d"/>
          </linearGradient>
        </defs>
        <!-- Hood behind collar -->
        <path d="M84 56 C86 26, 154 26, 156 56 C158 70, 144 78, 120 78 C96 78, 82 70, 84 56 Z"
              fill="url(#jk_kim)" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
        <path d="M98 56 C100 40, 140 40, 142 56 C138 68, 102 68, 98 56 Z"
              fill="#475569" stroke="{INK}" stroke-width="4.5"/>
        <!-- Sleeves -->
        <path d="M78 66 L36 112 C28 122, 26 146, 30 176 L58 180 L76 122 Z"
              fill="url(#jk_kim)" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
        <path d="M162 66 L204 112 C212 122, 214 146, 210 176 L182 180 L164 122 Z"
              fill="url(#jk_kim_dark)" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
        <!-- Cuffs -->
        <rect x="28" y="168" width="32" height="14" rx="5" transform="rotate(8 44 175)"
              fill="#475569" stroke="{INK}" stroke-width="5"/>
        <rect x="180" y="168" width="32" height="14" rx="5" transform="rotate(-8 196 175)"
              fill="#475569" stroke="{INK}" stroke-width="5"/>
        <!-- Torso -->
        <path d="M74 62 L166 62 L176 196 C154 206, 86 206, 64 196 Z"
              fill="url(#jk_kim)" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
        <!-- Dark metallic shoulder stripe -->
        <path d="M74 66 L104 82 L94 96 L68 84 Z" fill="#64748b" opacity="0.5"/>
        <path d="M166 66 L136 82 L146 96 L172 84 Z" fill="#64748b" opacity="0.5"/>
        <!-- Center zipper & trim -->
        <line x1="120" y1="74" x2="120" y2="201" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>
        <line x1="120" y1="78" x2="120" y2="196" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="4 4"/>
        <!-- Collar & drawcords -->
        <path d="M84 58 Q120 82 156 58 L150 78 Q120 94 90 78 Z"
              fill="#e2e8f0" stroke="{INK}" stroke-width="5.5" stroke-linejoin="round"/>
        <path d="M106 82 L103 108" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>
        <path d="M134 82 L137 108" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>
        <circle cx="103" cy="110" r="4" fill="#334155" stroke="{INK}" stroke-width="2.5"/>
        <circle cx="137" cy="110" r="4" fill="#334155" stroke="{INK}" stroke-width="2.5"/>
        <!-- Zip pockets -->
        <line x1="80" y1="146" x2="104" y2="162" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>
        <line x1="160" y1="146" x2="136" y2="162" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>
        <!-- Glossy metallic highlights -->
        <path d="M82 94 C88 86, 102 88, 106 98" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.85"/>
        <path d="M48 118 L40 150" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" opacity="0.75"/>
        """)

    if el == "moc":
        return wrap_svg(f"""
        <defs>
          <linearGradient id="jk_moc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#87b863"/>
            <stop offset="55%" stop-color="#5c8f47"/>
            <stop offset="100%" stop-color="#3f6b32"/>
          </linearGradient>
        </defs>
        <!-- Sleeves -->
        <path d="M74 66 L34 114 C28 124, 26 150, 32 180 L60 184 L78 124 Z"
              fill="url(#jk_moc)" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
        <path d="M166 66 L206 114 C212 124, 214 150, 208 180 L180 184 L162 124 Z"
              fill="#487538" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
        <!-- Torso -->
        <path d="M72 60 L168 60 L176 202 C152 208, 88 208, 64 202 Z"
              fill="url(#jk_moc)" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
        <!-- Khaki shirt collar -->
        <path d="M90 48 Q120 42 150 48 L154 64 Q120 74 86 64 Z"
              fill="#3d612d" stroke="{INK}" stroke-width="5.5"/>
        <path d="M86 52 L116 74 L92 86 L74 64 Z" fill="#9bc974" stroke="{INK}" stroke-width="5.5" stroke-linejoin="round"/>
        <path d="M154 52 L124 74 L148 86 L166 64 Z" fill="#81b35d" stroke="{INK}" stroke-width="5.5" stroke-linejoin="round"/>
        <!-- Center placket & buttons -->
        <rect x="113" y="72" width="14" height="131" fill="#4f7f3c" stroke="{INK}" stroke-width="4.5"/>
        <circle cx="120" cy="96" r="4.5" fill="#d4a359" stroke="{INK}" stroke-width="2.5"/>
        <circle cx="120" cy="126" r="4.5" fill="#d4a359" stroke="{INK}" stroke-width="2.5"/>
        <circle cx="120" cy="156" r="4.5" fill="#d4a359" stroke="{INK}" stroke-width="2.5"/>
        <circle cx="120" cy="184" r="4.5" fill="#d4a359" stroke="{INK}" stroke-width="2.5"/>
        <!-- Chest flap pockets -->
        <rect x="78" y="96" width="28" height="28" rx="4" fill="#6b9f52" stroke="{INK}" stroke-width="4.5"/>
        <path d="M78 96 L106 96 L104 108 L92 112 L80 108 Z" fill="#89bd68" stroke="{INK}" stroke-width="4"/>
        <rect x="134" y="96" width="28" height="28" rx="4" fill="#598a43" stroke="{INK}" stroke-width="4.5"/>
        <path d="M134 96 L162 96 L160 108 L148 112 L136 108 Z" fill="#73a657" stroke="{INK}" stroke-width="4"/>
        <!-- Lower patch pockets -->
        <rect x="75" y="146" width="31" height="34" rx="5" fill="#6b9f52" stroke="{INK}" stroke-width="4.5"/>
        <rect x="134" y="146" width="31" height="34" rx="5" fill="#598a43" stroke="{INK}" stroke-width="4.5"/>
        <!-- Highlight -->
        <path d="M48 118 L41 154" stroke="#bce39a" stroke-width="4.5" stroke-linecap="round" opacity="0.7"/>
        """)

    if el == "thuy":
        return wrap_svg(f"""
        <defs>
          <linearGradient id="jk_thuy" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#bae6fd" stop-opacity="0.92"/>
            <stop offset="52%" stop-color="#5ec2f7" stop-opacity="0.88"/>
            <stop offset="100%" stop-color="#0ea5e9" stop-opacity="0.92"/>
          </linearGradient>
        </defs>
        <!-- Translucent inner lining hint -->
        <path d="M76 74 L164 74 L170 198 L70 198 Z" fill="#e0f2fe" opacity="0.6"/>
        <!-- Hood -->
        <path d="M84 56 C84 22, 156 22, 156 56 C156 72, 140 80, 120 80 C100 80, 84 72, 84 56 Z"
              fill="url(#jk_thuy)" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
        <path d="M98 54 C100 38, 140 38, 142 54 C138 66, 102 66, 98 54 Z"
              fill="#e0f2fe" stroke="{INK}" stroke-width="4.5" opacity="0.85"/>
        <!-- Sleeves -->
        <path d="M74 66 L32 114 C25 124, 24 150, 29 180 L58 184 L76 126 Z"
              fill="url(#jk_thuy)" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
        <path d="M166 66 L208 114 C215 124, 216 150, 211 180 L182 184 L164 126 Z"
              fill="url(#jk_thuy)" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
        <!-- Long flared raincoat body -->
        <path d="M72 62 L168 62 L182 206 C152 214, 88 214, 58 206 Z"
              fill="url(#jk_thuy)" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
        <!-- Center placket & white snap buttons -->
        <line x1="120" y1="74" x2="120" y2="210" stroke="{INK}" stroke-width="5.5"/>
        <circle cx="120" cy="96" r="5" fill="#ffffff" stroke="{INK}" stroke-width="3"/>
        <circle cx="120" cy="126" r="5" fill="#ffffff" stroke="{INK}" stroke-width="3"/>
        <circle cx="120" cy="156" r="5" fill="#ffffff" stroke="{INK}" stroke-width="3"/>
        <circle cx="120" cy="186" r="5" fill="#ffffff" stroke="{INK}" stroke-width="3"/>
        <!-- Diagonal rain pockets -->
        <path d="M76 144 L106 154 L102 178 L72 168 Z" fill="#7dd3fc" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>
        <path d="M164 144 L134 154 L138 178 L168 168 Z" fill="#38bdf8" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>
        <!-- Glossy translucent raincoat shine streaks & water drop -->
        <path d="M84 90 L98 116" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.88"/>
        <path d="M98 86 L106 102" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.75"/>
        <path d="M46 122 L39 156" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.82"/>
        <path d="M150 94 C150 94, 159 108, 159 113 A9 9 0 0 1 141 113 C141 108, 150 94, 150 94 Z"
              fill="#e0f2fe" stroke="{INK}" stroke-width="3.2"/>
        """)

    if el == "hoa":
        return wrap_svg(f"""
        <defs>
          <linearGradient id="jk_hoa" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ff7a59"/>
            <stop offset="50%" stop-color="#e53935"/>
            <stop offset="100%" stop-color="#a81d1d"/>
          </linearGradient>
        </defs>
        <!-- Puffy stand-up collar -->
        <path d="M84 48 C96 36, 144 36, 156 48 L160 72 C142 82, 98 82, 80 72 Z"
              fill="#d9322b" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
        <!-- Puffy sleeves -->
        <path d="M74 64 C48 76, 30 108, 24 148 C22 162, 28 176, 38 180 L64 174 C66 154, 72 132, 80 116 Z"
              fill="url(#jk_hoa)" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
        <path d="M166 64 C192 76, 210 108, 216 148 C218 162, 212 176, 202 180 L176 174 C174 154, 168 132, 160 116 Z"
              fill="#c62828" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
        <!-- Sleeve baffle quilting -->
        <path d="M40 104 Q56 108 69 114" fill="none" stroke="{INK}" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M30 136 Q48 140 66 144" fill="none" stroke="{INK}" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M200 104 Q184 108 171 114" fill="none" stroke="{INK}" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M210 136 Q192 140 174 144" fill="none" stroke="{INK}" stroke-width="4.5" stroke-linecap="round"/>
        <!-- Puffy torso -->
        <path d="M70 62 C64 88, 60 148, 64 196 C88 208, 152 208, 176 196 C180 148, 176 88, 170 62 Z"
              fill="url(#jk_hoa)" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
        <!-- Horizontal quilted puffer ribs -->
        <path d="M68 102 Q120 110 172 102" fill="none" stroke="{INK}" stroke-width="5"/>
        <path d="M65 138 Q120 146 175 138" fill="none" stroke="{INK}" stroke-width="5"/>
        <path d="M65 172 Q120 180 175 172" fill="none" stroke="{INK}" stroke-width="5"/>
        <!-- Dark zipper -->
        <line x1="120" y1="68" x2="120" y2="202" stroke="{INK}" stroke-width="6.5" stroke-linecap="round"/>
        <rect x="115" y="76" width="10" height="14" rx="3" fill="#ffd166" stroke="{INK}" stroke-width="3"/>
        <!-- Glossy highlights on puffer segments -->
        <path d="M80 82 Q96 86 108 84" fill="none" stroke="#ffb39c" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
        <path d="M78 118 Q94 122 106 120" fill="none" stroke="#ffb39c" stroke-width="5" stroke-linecap="round" opacity="0.72"/>
        <path d="M78 154 Q94 158 106 156" fill="none" stroke="#ffb39c" stroke-width="4.5" stroke-linecap="round" opacity="0.65"/>
        """)

    # tho: Áo Khoác Dạ Nâu (cozy Đà Lạt wool overcoat)
    return wrap_svg(f"""
    <defs>
      <linearGradient id="jk_tho" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#d69c5c"/>
        <stop offset="55%" stop-color="#a86d36"/>
        <stop offset="100%" stop-color="#7c4a21"/>
      </linearGradient>
    </defs>
    <!-- Sleeves -->
    <path d="M74 64 L34 114 C27 124, 26 152, 32 182 L60 186 L78 124 Z"
          fill="url(#jk_tho)" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
    <path d="M166 64 L206 114 C213 124, 214 152, 208 182 L180 186 L162 124 Z"
          fill="#8c5729" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
    <!-- Inner sweater V peek -->
    <path d="M98 54 L142 54 L120 108 Z" fill="#fff3d6" stroke="{INK}" stroke-width="5"/>
    <!-- Coat body -->
    <path d="M72 58 L98 54 L120 104 L142 54 L168 58 L178 206 C150 214, 90 214, 62 206 Z"
          fill="url(#jk_tho)" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
    <!-- Wide wool lapels -->
    <path d="M94 52 L118 104 L92 108 L74 74 Z" fill="#e0ab6c" stroke="{INK}" stroke-width="5.5" stroke-linejoin="round"/>
    <path d="M146 52 L122 104 L148 108 L166 74 Z" fill="#c48749" stroke="{INK}" stroke-width="5.5" stroke-linejoin="round"/>
    <!-- Center overlap line & double-breasted wooden buttons -->
    <line x1="120" y1="104" x2="120" y2="210" stroke="{INK}" stroke-width="5"/>
    <circle cx="104" cy="126" r="5.5" fill="#4f2c14" stroke="{INK}" stroke-width="3"/>
    <circle cx="136" cy="126" r="5.5" fill="#4f2c14" stroke="{INK}" stroke-width="3"/>
    <circle cx="104" cy="156" r="5.5" fill="#4f2c14" stroke="{INK}" stroke-width="3"/>
    <circle cx="136" cy="156" r="5.5" fill="#4f2c14" stroke="{INK}" stroke-width="3"/>
    <!-- Flap pockets -->
    <path d="M74 166 L102 172" stroke="{INK}" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M166 166 L138 172" stroke="{INK}" stroke-width="5.5" stroke-linecap="round"/>
    <!-- Cozy highlight -->
    <path d="M46 118 L39 156" stroke="#f2c98e" stroke-width="4.5" stroke-linecap="round" opacity="0.7"/>
    """)


def svg_belt(el: str) -> str:
    palettes = {
        "kim": ("#64748b", "#334155", "#fef08a", "#d4a359", "#e2e8f0", "solid"),
        "moc": ("#6fa650", "#457031", "#e2e8f0", "#94a3b8", "#b4dc8f", "weave"),
        "thuy": ("#2b6cb0", "#1a3f73", "#bae6fd", "#60a5fa", "#7dd3fc", "solid"),
        "hoa": ("#b8252a", "#781317", "#fde047", "#eab308", "#fca5a5", "stitch"),
        "tho": ("#c67b3c", "#8a4c1d", "#f5cb5c", "#c9922c", "#f5d7a1", "stitch"),
    }
    main, dark, b_hi, b_mid, accent, style = palettes[el]
    weave_lines = ""
    if style == "weave":
        weave_lines = "".join(
            f'<line x1="{x}" y1="136" x2="{x+10}" y2="164" stroke="{dark}" stroke-width="3" opacity="0.5"/>'
            for x in range(60, 178, 12)
        )
    elif style == "stitch":
        weave_lines = f'<path d="M52 138 Q120 170 188 138" fill="none" stroke="{accent}" stroke-width="2.6" stroke-dasharray="6 5" opacity="0.8"/>'

    buckle_svg = (
        # Double D-ring for moc canvas belt
        f"""
        <ellipse cx="76" cy="144" rx="18" ry="24" fill="none" stroke="{INK}" stroke-width="11"/>
        <ellipse cx="76" cy="144" rx="18" ry="24" fill="none" stroke="{b_hi}" stroke-width="5.5"/>
        <ellipse cx="88" cy="146" rx="18" ry="24" fill="none" stroke="{INK}" stroke-width="11"/>
        <ellipse cx="88" cy="146" rx="18" ry="24" fill="none" stroke="{b_mid}" stroke-width="5.5"/>
        """
        if el == "moc"
        else f"""
        <!-- Classic shiny rectangular buckle -->
        <rect x="44" y="114" width="54" height="58" rx="11" fill="url(#bk_{el})" stroke="{INK}" stroke-width="6.5"/>
        <rect x="58" y="128" width="26" height="30" rx="5" fill="#fff8eb" fill-opacity="0.18" stroke="{INK}" stroke-width="5"/>
        <line x1="60" y1="143" x2="94" y2="143" stroke="{INK}" stroke-width="7.5" stroke-linecap="round"/>
        <line x1="62" y1="143" x2="91" y2="143" stroke="{b_hi}" stroke-width="3" stroke-linecap="round"/>
        <path d="M52 124 L68 124" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.85"/>
        """
    )

    return wrap_svg(f"""
    <defs>
      <linearGradient id="blt_{el}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="{main}"/>
        <stop offset="100%" stop-color="{dark}"/>
      </linearGradient>
      <linearGradient id="bk_{el}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="{b_hi}"/>
        <stop offset="100%" stop-color="{b_mid}"/>
      </linearGradient>
    </defs>
    <!-- Back loop of coiled belt -->
    <path d="M32 104 C32 56, 208 56, 208 104 L208 134 C208 88, 32 88, 32 134 Z"
          fill="{dark}" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
    <!-- Inner visible back band -->
    <path d="M46 102 C56 76, 184 76, 194 102 C180 120, 60 120, 46 102 Z"
          fill="{main}" opacity="0.45"/>
    <!-- Front strap body -->
    <path d="M32 104 C32 146, 208 146, 208 104 L208 140 C208 184, 32 184, 32 140 Z"
          fill="url(#blt_{el})" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
    {weave_lines}
    <!-- Tail strap poking out right -->
    <path d="M168 134 L216 146 C222 152, 220 170, 210 176 L160 166 Z"
          fill="url(#blt_{el})" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>
    <!-- Belt holes -->
    <circle cx="176" cy="151" r="3.4" fill="{INK}"/>
    <circle cx="192" cy="155" r="3.4" fill="{INK}"/>
    <circle cx="206" cy="159" r="3.4" fill="{INK}"/>
    <!-- Keeper loop -->
    <rect x="104" y="124" width="18" height="48" rx="6" fill="{dark}" stroke="{INK}" stroke-width="5.5"/>
    {buckle_svg}
    <!-- Top rim highlight -->
    <path d="M62 72 Q120 60 178 72" fill="none" stroke="{accent}" stroke-width="4" stroke-linecap="round" opacity="0.65"/>
    """)


def svg_wallet(el: str) -> str:
    # kim: Ví Gập Khóa Bấm (silver bifold with snap clasp)
    # moc: Ví Vải Thêu (moss fabric wallet with embroidered leaf & flower)
    # thuy: Ví Dài Xanh Đậm (deep blue long zip clutch)
    # hoa: Ví Da Đỏ (vibrant red leather wallet with gold corner)
    # tho: Ví Da Thủ Công (handmade stitched brown leather wallet)
    if el == "thuy":
        return wrap_svg(f"""
        <defs>
          <linearGradient id="wl_thuy" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="48%" stop-color="#1d6fa5"/>
            <stop offset="100%" stop-color="#133d6e"/>
          </linearGradient>
        </defs>
        <g transform="rotate(-8 120 124)">
          <!-- Long clutch back -->
          <rect x="20" y="76" width="198" height="96" rx="18" fill="#0f3159" stroke="{INK}" stroke-width="6.5"/>
          <!-- Main body -->
          <rect x="24" y="84" width="194" height="92" rx="16" fill="url(#wl_thuy)" stroke="{INK}" stroke-width="6.5"/>
          <!-- Stitching -->
          <rect x="34" y="94" width="174" height="72" rx="11" fill="none" stroke="#bae6fd" stroke-width="2.6" stroke-dasharray="6 5" opacity="0.7"/>
          <!-- Metallic zipper pull -->
          <line x1="208" y1="100" x2="224" y2="108" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>
          <rect x="214" y="102" width="18" height="32" rx="6" fill="#cbd5e1" stroke="{INK}" stroke-width="4.5"/>
          <circle cx="223" cy="112" r="3" fill="{INK}"/>
          <!-- Glossy shine & droplet emblem -->
          <path d="M44 102 L126 102" stroke="#e0f2fe" stroke-width="5.5" stroke-linecap="round" opacity="0.6"/>
          <path d="M120 114 C120 114, 130 128, 130 134 A10 10 0 0 1 110 134 C110 128, 120 114, 120 114 Z"
                fill="#7dd3fc" stroke="{INK}" stroke-width="3.5"/>
        </g>
        """)

    cfg = {
        "kim": ("#cbd5e1", "#64748b", "#f1f5f9", "#94a3b8"),
        "moc": ("#6aa854", "#3d6b31", "#9ed47f", "#d9f99d"),
        "hoa": ("#e53935", "#991b1b", "#ff7a6b", "#fde047"),
        "tho": ("#c97b3a", "#7c4217", "#e8a866", "#fef0c7"),
    }[el]
    c1, c2, hi, stitch = cfg

    extra = ""
    if el == "kim":
        extra = f"""
        <rect x="148" y="114" width="58" height="36" rx="12" fill="#e2e8f0" stroke="{INK}" stroke-width="6"/>
        <circle cx="168" cy="132" r="9.5" fill="#94a3b8" stroke="{INK}" stroke-width="4"/>
        <circle cx="165" cy="129" r="3" fill="#ffffff"/>
        """
    elif el == "moc":
        extra = f"""
        <!-- Embroidered leaf & tiny flower -->
        <path d="M96 150 C92 124, 118 108, 138 112 C140 132, 124 154, 96 150 Z"
              fill="#a3e635" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>
        <path d="M98 148 Q116 132 134 116" fill="none" stroke="{INK}" stroke-width="3.2" stroke-linecap="round"/>
        <circle cx="152" cy="144" r="7" fill="#fef08a" stroke="{INK}" stroke-width="3.2"/>
        <circle cx="152" cy="144" r="2.5" fill="#f97316"/>
        """
    elif el == "hoa":
        extra = f"""
        <!-- Gold corner guard -->
        <path d="M168 84 L192 84 C202 84, 206 90, 206 100 L206 122 L190 122 L190 100 L168 100 Z"
              fill="#fbbf24" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>
        <rect x="150" y="118" width="54" height="30" rx="10" fill="#b91c1c" stroke="{INK}" stroke-width="5.5"/>
        <circle cx="168" cy="133" r="6" fill="#fde047" stroke="{INK}" stroke-width="3"/>
        """
    else:  # tho handmade leather
        extra = f"""
        <rect x="148" y="118" width="56" height="30" rx="10" fill="#a85e24" stroke="{INK}" stroke-width="5.5"/>
        <circle cx="168" cy="133" r="7" fill="#f5cb5c" stroke="{INK}" stroke-width="3.5"/>
        <!-- Embossed craft mark -->
        <path d="M74 134 L86 122 L98 134 L86 146 Z" fill="none" stroke="{INK}" stroke-width="3.5" opacity="0.55"/>
        """

    return wrap_svg(f"""
    <defs>
      <linearGradient id="wl_{el}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="{hi}"/>
        <stop offset="45%" stop-color="{c1}"/>
        <stop offset="100%" stop-color="{c2}"/>
      </linearGradient>
    </defs>
    <g transform="rotate(-7 120 124)">
      <!-- Cash bill peeking out top -->
      <path d="M52 80 L176 58 L184 96 L56 106 Z" fill="#6ee7b7" stroke="{INK}" stroke-width="5.5" stroke-linejoin="round"/>
      <path d="M68 82 L162 66" stroke="#059669" stroke-width="4" stroke-linecap="round"/>
      <!-- Back wallet fold -->
      <rect x="34" y="72" width="166" height="114" rx="18" fill="{c2}" stroke="{INK}" stroke-width="6.5"/>
      <!-- Front wallet face -->
      <rect x="36" y="84" width="168" height="106" rx="18" fill="url(#wl_{el})" stroke="{INK}" stroke-width="6.5"/>
      <!-- Hand stitching -->
      <rect x="47" y="95" width="146" height="84" rx="12" fill="none" stroke="{stitch}" stroke-width="2.8" stroke-dasharray="6 5" opacity="0.8"/>
      <!-- Shine -->
      <path d="M54 102 L124 102" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.45"/>
      {extra}
    </g>
    """)


def svg_watch(el: str) -> str:
    # kim: Đồng Hồ Dây Kim Loại
    # moc: Đồng Hồ Mặt Gỗ
    # thuy: Đồng Hồ Chống Nước
    # hoa: Đồng Hồ Mặt Đỏ
    # tho: Đồng Hồ Dây Da
    cfg = {
        "kim": ("#cbd5e1", "#64748b", "#e2e8f0", "#f8fafc", "#334155", True),
        "moc": ("#5c9447", "#366128", "#b9844c", "#d9a76a", "#2f5722", False),
        "thuy": ("#0ea5e9", "#0369a1", "#1d4ed8", "#e0f2fe", "#0284c7", False),
        "hoa": ("#991b1b", "#641212", "#ef4444", "#dc2626", "#fef08a", False),
        "tho": ("#a8642d", "#6e3b14", "#eab308", "#fff6dc", "#4f2c14", False),
    }[el]
    strap1, strap2, bezel, dial, hand_col, is_metal = cfg

    strap_detail = ""
    if is_metal:
        strap_detail = """
        <line x1="88" y1="36" x2="152" y2="36" stroke="#2b1a12" stroke-width="4.5"/>
        <line x1="88" y1="54" x2="152" y2="54" stroke="#2b1a12" stroke-width="4.5"/>
        <line x1="88" y1="186" x2="152" y2="186" stroke="#2b1a12" stroke-width="4.5"/>
        <line x1="88" y1="204" x2="152" y2="204" stroke="#2b1a12" stroke-width="4.5"/>
        <line x1="110" y1="20" x2="110" y2="68" stroke="#2b1a12" stroke-width="3.5"/>
        <line x1="130" y1="20" x2="130" y2="68" stroke="#2b1a12" stroke-width="3.5"/>
        <line x1="110" y1="172" x2="110" y2="220" stroke="#2b1a12" stroke-width="3.5"/>
        <line x1="130" y1="172" x2="130" y2="220" stroke="#2b1a12" stroke-width="3.5"/>
        """
    elif el == "thuy":
        strap_detail = """
        <line x1="94" y1="38" x2="146" y2="38" stroke="#075985" stroke-width="5" stroke-linecap="round"/>
        <line x1="94" y1="52" x2="146" y2="52" stroke="#075985" stroke-width="5" stroke-linecap="round"/>
        <line x1="94" y1="188" x2="146" y2="188" stroke="#075985" stroke-width="5" stroke-linecap="round"/>
        <line x1="94" y1="202" x2="146" y2="202" stroke="#075985" stroke-width="5" stroke-linecap="round"/>
        """
    else:
        strap_detail = """
        <line x1="96" y1="28" x2="96" y2="66" stroke="#fff3d6" stroke-width="2.4" stroke-dasharray="5 4" opacity="0.65"/>
        <line x1="144" y1="28" x2="144" y2="66" stroke="#fff3d6" stroke-width="2.4" stroke-dasharray="5 4" opacity="0.65"/>
        <circle cx="120" cy="192" r="3.5" fill="#2b1a12"/>
        <circle cx="120" cy="206" r="3.5" fill="#2b1a12"/>
        """

    dial_extra = ""
    if el == "moc":
        dial_extra = f"""
        <path d="M84 114 Q120 106 156 114" fill="none" stroke="#9e6b38" stroke-width="3" opacity="0.5"/>
        <path d="M84 134 Q120 142 156 134" fill="none" stroke="#9e6b38" stroke-width="3" opacity="0.5"/>
        <path d="M120 88 C126 88, 130 94, 126 100 C120 100, 114 96, 120 88 Z" fill="#59c173" stroke="{INK}" stroke-width="2.5"/>
        """
    elif el == "thuy":
        dial_extra = f"""
        <circle cx="120" cy="120" r="46" fill="none" stroke="#38bdf8" stroke-width="5" stroke-dasharray="7 7"/>
        """
    elif el == "hoa":
        dial_extra = f"""
        <circle cx="120" cy="120" r="32" fill="none" stroke="#fca5a5" stroke-width="2.5" opacity="0.7"/>
        """

    return wrap_svg(f"""
    <defs>
      <linearGradient id="wt_s_{el}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="{strap1}"/>
        <stop offset="100%" stop-color="{strap2}"/>
      </linearGradient>
    </defs>
    <!-- Top & bottom strap -->
    <rect x="86" y="18" width="68" height="204" rx="14" fill="url(#wt_s_{el})" stroke="{INK}" stroke-width="6.5"/>
    {strap_detail}
    <!-- Side crown button -->
    <rect x="172" y="108" width="16" height="24" rx="5" fill="{bezel}" stroke="{INK}" stroke-width="5"/>
    <!-- Watch bezel -->
    <circle cx="120" cy="120" r="56" fill="{bezel}" stroke="{INK}" stroke-width="6.5"/>
    <!-- Dial face -->
    <circle cx="120" cy="120" r="43" fill="{dial}" stroke="{INK}" stroke-width="5"/>
    {dial_extra}
    <!-- Hour ticks -->
    <line x1="120" y1="84" x2="120" y2="92" stroke="{hand_col}" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="120" y1="148" x2="120" y2="156" stroke="{hand_col}" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="84" y1="120" x2="92" y2="120" stroke="{hand_col}" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="148" y1="120" x2="156" y2="120" stroke="{hand_col}" stroke-width="4.5" stroke-linecap="round"/>
    <!-- Clock hands (10:10 happy time!) -->
    <line x1="120" y1="120" x2="101" y2="104" stroke="{hand_col}" stroke-width="6" stroke-linecap="round"/>
    <line x1="120" y1="120" x2="144" y2="103" stroke="{hand_col}" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="120" cy="120" r="5.5" fill="{INK}"/>
    <circle cx="120" cy="120" r="2.2" fill="#ffffff"/>
    <!-- Glass reflection -->
    <path d="M90 100 C98 86, 114 82, 128 84" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
    """)


def svg_phone(el: str) -> str:
    # hoa: Điện Thoại Ốp Đỏ
    # thuy: Điện Thoại Ốp Xanh
    # kim: Điện Thoại Vỏ Nhôm
    # moc: Điện Thoại Ốp Gỗ
    # tho: Điện Thoại Ốp Da
    cfg = {
        "kim": ("#f1f5f9", "#cbd5e1", "#8b9ab0", "#475569", "#ffffff"),
        "moc": ("#a6d975", "#659e48", "#3f6e2d", "#5c3d22", "#d9f99d"),
        "thuy": ("#7dd3fc", "#2aa5eb", "#0c6ca8", "#075985", "#e0f2fe"),
        "hoa": ("#ff7a6b", "#e53935", "#991b1b", "#fbbf24", "#ffd1c7"),
        "tho": ("#dfa05e", "#b06d32", "#75421a", "#f5cb5c", "#f5d7a1"),
    }[el]
    hi, mid, dark, cam_accent, shine = cfg

    back_art = ""
    if el == "moc":
        back_art = f"""
        <path d="M74 114 Q120 104 166 114" fill="none" stroke="#3f6e2d" stroke-width="3.5" opacity="0.45"/>
        <path d="M74 146 Q120 156 166 146" fill="none" stroke="#3f6e2d" stroke-width="3.5" opacity="0.45"/>
        <path d="M120 156 C100 144, 102 118, 124 112 C138 126, 138 148, 120 156 Z"
              fill="#bef264" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>
        <path d="M120 154 L123 120" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>
        """
    elif el == "thuy":
        back_art = f"""
        <!-- Rugged corner bumpers & water drops -->
        <path d="M122 122 C122 122, 134 138, 134 146 A12 12 0 0 1 110 146 C110 138, 122 122, 122 122 Z"
              fill="#e0f2fe" stroke="{INK}" stroke-width="4"/>
        <circle cx="144" cy="128" r="6" fill="#bae6fd" stroke="{INK}" stroke-width="3"/>
        """
    elif el == "tho":
        back_art = f"""
        <!-- Stitched leather card pocket -->
        <path d="M76 124 L164 124 L164 196 C164 202, 158 206, 150 206 L90 206 C82 206, 76 202, 76 196 Z"
              fill="#915321" stroke="{INK}" stroke-width="4.5"/>
        <path d="M84 132 L156 132 L156 198 L84 198 Z" fill="none" stroke="#f5d7a1" stroke-width="2.5" stroke-dasharray="6 5" opacity="0.8"/>
        <circle cx="120" cy="144" r="5" fill="#f5cb5c" stroke="{INK}" stroke-width="2.8"/>
        """
    elif el == "hoa":
        back_art = f"""
        <!-- Sporty racing stripe -->
        <rect x="108" y="28" width="24" height="184" fill="#b91c1c" opacity="0.5"/>
        <circle cx="120" cy="136" r="14" fill="#fde047" stroke="{INK}" stroke-width="4"/>
        <path d="M120 126 L125 136 L120 146 L115 136 Z" fill="#ef4444"/>
        """
    else:  # kim brushed aluminum
        back_art = f"""
        <path d="M72 150 L166 96" stroke="#ffffff" stroke-width="14" opacity="0.45"/>
        <circle cx="120" cy="136" r="13" fill="#e2e8f0" stroke="{INK}" stroke-width="4"/>
        """

    return wrap_svg(f"""
    <defs>
      <linearGradient id="ph_{el}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="{hi}"/>
        <stop offset="50%" stop-color="{mid}"/>
        <stop offset="100%" stop-color="{dark}"/>
      </linearGradient>
    </defs>
    <g transform="rotate(8 120 120)">
      <!-- Side thickness -->
      <rect x="60" y="24" width="114" height="192" rx="24" fill="{dark}" stroke="{INK}" stroke-width="6.5"/>
      <!-- Phone case back -->
      <rect x="66" y="22" width="112" height="192" rx="22" fill="url(#ph_{el})" stroke="{INK}" stroke-width="6.5"/>
      {back_art}
      <!-- Camera island -->
      <rect x="78" y="34" width="46" height="54" rx="12" fill="#1e293b" stroke="{INK}" stroke-width="4.5"/>
      <circle cx="94" cy="50" r="9" fill="#475569" stroke="{cam_accent}" stroke-width="3"/>
      <circle cx="92" cy="48" r="3" fill="#7dd3fc"/>
      <circle cx="94" cy="72" r="9" fill="#475569" stroke="{cam_accent}" stroke-width="3"/>
      <circle cx="92" cy="70" r="3" fill="#7dd3fc"/>
      <circle cx="112" cy="61" r="4.5" fill="#fef08a" stroke="{INK}" stroke-width="2"/>
      <!-- Side buttons -->
      <line x1="181" y1="74" x2="181" y2="100" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>
      <!-- Edge shine -->
      <path d="M164 42 L164 114" stroke="{shine}" stroke-width="4.5" stroke-linecap="round" opacity="0.72"/>
    </g>
    """)


def svg_umbrella(el: str) -> str:
    # thuy: Dù Gấp Xanh
    # moc: Dù Cán Gỗ
    # kim: Dù Khung Thép
    # hoa: Dù Đỏ
    # tho: Dù Vải Nâu
    cfg = {
        "kim": ("#e2e8f0", "#94a3b8", "#64748b", "#cbd5e1", "#475569"),
        "moc": ("#86d46b", "#4fa647", "#2f6e2d", "#b57234", "#7a4419"),
        "thuy": ("#7dd3fc", "#38bdf8", "#0284c7", "#334155", "#1e293b"),
        "hoa": ("#ff8066", "#e53935", "#a31b1b", "#f59e0b", "#b45309"),
        "tho": ("#e0a968", "#b37438", "#7a481e", "#8a4c1d", "#522a0e"),
    }[el]
    c_hi, c_mid, c_dark, h_col, h_dark = cfg

    handle_svg = (
        # Compact straight folding handle with wrist loop for thuy
        f"""
        <rect x="112" y="182" width="16" height="32" rx="7" fill="{h_col}" stroke="{INK}" stroke-width="5.5"/>
        <path d="M114 206 C94 212, 92 226, 114 224" fill="none" stroke="{INK}" stroke-width="4.5" stroke-linecap="round"/>
        """
        if el == "thuy"
        else f"""
        <!-- Classic curved J-handle -->
        <path d="M120 184 L120 202 C120 220, 92 220, 92 202" fill="none" stroke="{INK}" stroke-width="15" stroke-linecap="round"/>
        <path d="M120 184 L120 202 C120 220, 92 220, 92 202" fill="none" stroke="{h_col}" stroke-width="7.5" stroke-linecap="round"/>
        """
    )

    droplets = (
        f"""
        <path d="M76 74 C76 74, 83 84, 83 88 A7 7 0 0 1 69 88 C69 84, 76 74, 76 74 Z" fill="#e0f2fe" stroke="{INK}" stroke-width="2.6"/>
        <path d="M168 82 C168 82, 174 91, 174 95 A6 6 0 0 1 162 95 C162 91, 168 82, 168 82 Z" fill="#e0f2fe" stroke="{INK}" stroke-width="2.6"/>
        """
        if el == "thuy"
        else ""
    )

    return wrap_svg(f"""
    <defs>
      <linearGradient id="um_{el}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="{c_hi}"/>
        <stop offset="55%" stop-color="{c_mid}"/>
        <stop offset="100%" stop-color="{c_dark}"/>
      </linearGradient>
    </defs>
    <g transform="rotate(-14 120 120)">
      <!-- Shaft & ferrule tip -->
      <line x1="120" y1="26" x2="120" y2="190" stroke="{INK}" stroke-width="11" stroke-linecap="round"/>
      <line x1="120" y1="28" x2="120" y2="188" stroke="{h_col}" stroke-width="4.5" stroke-linecap="round"/>
      <!-- Under-canopy shadow -->
      <path d="M24 122 Q120 96 216 122 Q188 134 156 126 Q120 136 84 126 Q52 134 24 122 Z"
            fill="{c_dark}" stroke="{INK}" stroke-width="5"/>
      <!-- Main dome canopy -->
      <path d="M22 122 C26 56, 76 38, 120 38 C164 38, 214 56, 218 122
               Q188 112 162 124 Q140 112 120 124 Q100 112 78 124 Q52 112 22 122 Z"
            fill="url(#um_{el})" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
      <!-- Ribbed panels -->
      <path d="M120 38 C98 58, 84 88, 78 123" fill="none" stroke="{INK}" stroke-width="4.5"/>
      <path d="M120 38 C142 58, 156 88, 162 123" fill="none" stroke="{INK}" stroke-width="4.5"/>
      <line x1="120" y1="38" x2="120" y2="123" stroke="{INK}" stroke-width="4.5"/>
      <!-- Highlight panel -->
      <path d="M62 66 C76 52, 94 46, 108 46" fill="none" stroke="#ffffff" stroke-width="5.5" stroke-linecap="round" opacity="0.72"/>
      {droplets}
      {handle_svg}
    </g>
    """)


def svg_chest(opened: bool) -> str:
    if not opened:
        return wrap_svg(f"""
        <defs>
          <linearGradient id="ch_wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#c97d3c"/>
            <stop offset="100%" stop-color="#7c4119"/>
          </linearGradient>
          <linearGradient id="ch_gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="55%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#b45309"/>
          </linearGradient>
        </defs>
        <!-- Chest base -->
        <rect x="34" y="106" width="172" height="96" rx="14" fill="url(#ch_wood)" stroke="{INK}" stroke-width="6.5"/>
        <!-- Wood plank lines -->
        <line x1="38" y1="142" x2="202" y2="142" stroke="{INK}" stroke-width="3.5" opacity="0.45"/>
        <line x1="38" y1="172" x2="202" y2="172" stroke="{INK}" stroke-width="3.5" opacity="0.45"/>
        <!-- Domed lid -->
        <path d="M30 112 C32 62, 66 44, 120 44 C174 44, 208 62, 210 112 Z"
              fill="#d9914c" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
        <!-- Brass straps -->
        <rect x="54" y="52" width="22" height="148" rx="4" fill="url(#ch_gold)" stroke="{INK}" stroke-width="5"/>
        <rect x="164" y="52" width="22" height="148" rx="4" fill="url(#ch_gold)" stroke="{INK}" stroke-width="5"/>
        <!-- Lid rim -->
        <rect x="28" y="102" width="184" height="18" rx="6" fill="url(#ch_gold)" stroke="{INK}" stroke-width="5.5"/>
        <!-- Center clasp lock -->
        <rect x="102" y="96" width="36" height="40" rx="8" fill="url(#ch_gold)" stroke="{INK}" stroke-width="5.5"/>
        <circle cx="120" cy="113" r="5" fill="{INK}"/>
        <path d="M118 115 L122 115 L124 127 L116 127 Z" fill="{INK}"/>
        <!-- Highlights -->
        <path d="M84 62 Q120 52 156 62" fill="none" stroke="#ffe7b8" stroke-width="5" stroke-linecap="round" opacity="0.75"/>
        """)

    # Opened glowing chest!
    return wrap_svg(f"""
    <defs>
      <radialGradient id="ch_glow" cx="50%" cy="46%" r="52%">
        <stop offset="0%" stop-color="#fffbeb" stop-opacity="1"/>
        <stop offset="45%" stop-color="#fde047" stop-opacity="0.92"/>
        <stop offset="85%" stop-color="#f59e0b" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="ch_wood2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#c97d3c"/>
        <stop offset="100%" stop-color="#7c4119"/>
      </linearGradient>
      <linearGradient id="ch_gold2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="55%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#b45309"/>
      </linearGradient>
    </defs>
    <!-- Golden light burst behind lid -->
    <circle cx="120" cy="96" r="88" fill="url(#ch_glow)"/>
    <!-- Open lid tilted back -->
    <path d="M36 96 L48 44 C64 28, 176 28, 192 44 L204 96 Z"
          fill="#8a4b1d" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
    <path d="M54 88 L62 50 C80 38, 160 38, 178 50 L186 88 Z"
          fill="#4f260b" stroke="{INK}" stroke-width="4.5"/>
    <!-- Light rays bursting out -->
    <polygon points="120,108 66,24 96,20" fill="#fef08a" opacity="0.82"/>
    <polygon points="120,108 110,12 134,12" fill="#fffbeb" opacity="0.92"/>
    <polygon points="120,108 148,20 176,28" fill="#fef08a" opacity="0.82"/>
    <!-- Bright interior -->
    <ellipse cx="120" cy="116" rx="74" ry="20" fill="#fef08a" stroke="{INK}" stroke-width="5.5"/>
    <!-- Chest bottom front -->
    <rect x="34" y="116" width="172" height="90" rx="14" fill="url(#ch_wood2)" stroke="{INK}" stroke-width="6.5"/>
    <rect x="54" y="116" width="22" height="90" rx="4" fill="url(#ch_gold2)" stroke="{INK}" stroke-width="5"/>
    <rect x="164" y="116" width="22" height="90" rx="4" fill="url(#ch_gold2)" stroke="{INK}" stroke-width="5"/>
    <rect x="28" y="110" width="184" height="16" rx="6" fill="url(#ch_gold2)" stroke="{INK}" stroke-width="5.5"/>
    <rect x="104" y="118" width="32" height="28" rx="7" fill="url(#ch_gold2)" stroke="{INK}" stroke-width="5"/>
    <circle cx="120" cy="132" r="4.5" fill="{INK}"/>
    <!-- Cute floating sparkles -->
    <path d="M56 54 L60 42 L64 54 L76 58 L64 62 L60 74 L56 62 L44 58 Z" fill="#fffbeb" stroke="#d97706" stroke-width="2.5"/>
    <path d="M180 48 L183 38 L186 48 L196 51 L186 54 L183 64 L180 54 L170 51 Z" fill="#fffbeb" stroke="#d97706" stroke-width="2.5"/>
    <circle cx="120" cy="48" r="5" fill="#ffffff"/>
    """)


def svg_set_badge(set_id: str) -> str:
    if set_id == "set_di_mua":
        return wrap_svg(f"""
        <defs>
          <radialGradient id="sb_rain" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#e0f2fe"/>
            <stop offset="55%" stop-color="#38bdf8"/>
            <stop offset="100%" stop-color="#0369a1"/>
          </radialGradient>
        </defs>
        <circle cx="120" cy="120" r="98" fill="#0c4a6e" stroke="{INK}" stroke-width="7"/>
        <circle cx="120" cy="120" r="84" fill="url(#sb_rain)" stroke="#bae6fd" stroke-width="5"/>
        <!-- Mini umbrella -->
        <path d="M58 118 C64 74, 176 74, 182 118 Q154 110 138 118 Q120 110 102 118 Q84 110 58 118 Z"
              fill="#0284c7" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>
        <path d="M120 72 L120 162 C120 176, 100 176, 100 162" fill="none" stroke="{INK}" stroke-width="7.5" stroke-linecap="round"/>
        <path d="M120 118 L120 162 C120 176, 100 176, 100 162" fill="none" stroke="#fef08a" stroke-width="3" stroke-linecap="round"/>
        <!-- Raindrops -->
        <path d="M74 140 C74 140, 84 154, 84 160 A10 10 0 0 1 64 160 C64 154, 74 140, 74 140 Z" fill="#e0f2fe" stroke="{INK}" stroke-width="4"/>
        <path d="M164 134 C164 134, 173 147, 173 153 A9 9 0 0 1 155 153 C155 147, 164 134, 164 134 Z" fill="#e0f2fe" stroke="{INK}" stroke-width="4"/>
        """)
    if set_id == "set_phuot":
        return wrap_svg(f"""
        <defs>
          <radialGradient id="sb_phuot" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#dcfce7"/>
            <stop offset="55%" stop-color="#59c173"/>
            <stop offset="100%" stop-color="#1e6b36"/>
          </radialGradient>
        </defs>
        <circle cx="120" cy="120" r="98" fill="#1b4d2b" stroke="{INK}" stroke-width="7"/>
        <circle cx="120" cy="120" r="84" fill="url(#sb_phuot)" stroke="#bbf7d0" stroke-width="5"/>
        <!-- Dalat misty mountains & pine trees -->
        <path d="M46 154 L94 88 L134 138 L156 106 L194 154 Z" fill="#2d7a47" stroke="{INK}" stroke-width="5.5" stroke-linejoin="round"/>
        <path d="M78 156 L96 122 L114 156 Z" fill="#1f5c34" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>
        <path d="M132 158 L152 116 L172 158 Z" fill="#1f5c34" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>
        <!-- Warm sunrise dot & mist -->
        <circle cx="152" cy="74" r="14" fill="#fef08a" stroke="{INK}" stroke-width="4"/>
        <ellipse cx="120" cy="164" rx="54" ry="12" fill="#f0fdf4" opacity="0.82"/>
        """)
    if set_id == "set_van_phong":
        return wrap_svg(f"""
        <defs>
          <radialGradient id="sb_vp" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#f8fafc"/>
            <stop offset="55%" stop-color="#cbd5e1"/>
            <stop offset="100%" stop-color="#475569"/>
          </radialGradient>
        </defs>
        <circle cx="120" cy="120" r="98" fill="#334155" stroke="{INK}" stroke-width="7"/>
        <circle cx="120" cy="120" r="84" fill="url(#sb_vp)" stroke="#f1f5f9" stroke-width="5"/>
        <!-- Coffee cup & sleek tie/watch motif -->
        <path d="M74 102 L152 102 L144 166 C142 174, 84 174, 82 166 Z" fill="#ffffff" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>
        <path d="M150 114 C174 114, 174 148, 147 148" fill="none" stroke="{INK}" stroke-width="11" stroke-linecap="round"/>
        <path d="M150 114 C174 114, 174 148, 147 148" fill="none" stroke="#e2e8f0" stroke-width="4.5" stroke-linecap="round"/>
        <rect x="78" y="122" width="70" height="22" fill="#94a3b8" stroke="{INK}" stroke-width="4"/>
        <!-- Steam curls -->
        <path d="M96 86 Q102 74 96 64" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>
        <path d="M116 84 Q122 72 116 60" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>
        <path d="M134 86 Q140 74 134 64" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>
        """)
    # set_chu_tiem_xin: Golden crown + brown leather badge
    return wrap_svg(f"""
    <defs>
      <radialGradient id="sb_ct" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#fef3c7"/>
        <stop offset="55%" stop-color="#e5a347"/>
        <stop offset="100%" stop-color="#8a4b1d"/>
      </radialGradient>
    </defs>
    <circle cx="120" cy="120" r="98" fill="#5c2e0e" stroke="{INK}" stroke-width="7"/>
    <circle cx="120" cy="120" r="84" fill="url(#sb_ct)" stroke="#fde68a" stroke-width="5"/>
    <!-- Crown -->
    <path d="M56 154 L68 88 L100 118 L120 76 L140 118 L172 88 L184 154 Z"
          fill="#fbbf24" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
    <rect x="58" y="148" width="124" height="20" rx="7" fill="#b45309" stroke="{INK}" stroke-width="5.5"/>
    <circle cx="120" cy="74" r="8" fill="#fef08a" stroke="{INK}" stroke-width="3.5"/>
    <circle cx="68" cy="86" r="7" fill="#fef08a" stroke="{INK}" stroke-width="3.5"/>
    <circle cx="172" cy="86" r="7" fill="#fef08a" stroke="{INK}" stroke-width="3.5"/>
    <circle cx="120" cy="134" r="8" fill="#ef4444" stroke="{INK}" stroke-width="3.5"/>
    """)


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
            col = (234, 234, 234, 255) if ((x // sq) + (y // sq)) % 2 == 0 else (192, 192, 192, 255)
            d.rectangle([x, y, x + sq, y + sq], fill=col)
    for idx, (label, sim) in enumerate(samples):
        r, c = divmod(idx, cols)
        cx, cy = c * cell, r * cell
        fit = trim_and_fit(sim, cell - 24, pad=2)
        im.alpha_composite(fit, (cx + 12, cy + 4))
        d.rectangle([cx + 2, cy + cell - 18, cx + cell - 2, cy + cell - 2], fill=(43, 26, 18, 220))
        d.text((cx + 5, cy + cell - 15), label[:16], fill=(255, 240, 200, 255))
    im.save(out_path)


def main():
    SVG_DIR.mkdir(parents=True, exist_ok=True)
    PNG_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Write 36 SVG files (30 gear items + 2 chests + 4 set badges)
    elements = ["kim", "moc", "thuy", "hoa", "tho"]
    svg_generators = {
        "jacket": svg_jacket,
        "belt": svg_belt,
        "wallet": svg_wallet,
        "watch": svg_watch,
        "phone": svg_phone,
        "umbrella": svg_umbrella,
    }
    svg_names: list[str] = []
    for slot, fn in svg_generators.items():
        for el in elements:
            name = f"gear_{slot}_{el}"
            (SVG_DIR / f"{name}.svg").write_text(fn(el), encoding="utf-8")
            svg_names.append(name)

    (SVG_DIR / "gear_chest_closed.svg").write_text(svg_chest(False), encoding="utf-8")
    (SVG_DIR / "gear_chest_open.svg").write_text(svg_chest(True), encoding="utf-8")
    svg_names.extend(["gear_chest_closed", "gear_chest_open"])

    for sid in ["set_di_mua", "set_phuot", "set_van_phong", "set_chu_tiem_xin"]:
        (SVG_DIR / f"{sid}.svg").write_text(svg_set_badge(sid), encoding="utf-8")
        svg_names.append(sid)

    # 2. Render SVGs via Playwright Chromium (256x256 transparent PNGs)
    subprocess.run(
        ["node", str(REPO_ROOT / "scripts" / "render_svgs.mjs"), str(SVG_DIR), str(PNG_DIR), "256"],
        check=True,
    )

    frames: dict[str, Image.Image] = {}

    # 3. Load & clean 20 generated sprites from Sheet 1 (hat, glasses) & Sheet 3 (shoes, bag)
    sh1 = Image.open(SHEET_1).convert("RGB")
    sh3 = Image.open(SHEET_3).convert("RGB")

    # Sheet 1 exact islands:
    # row 0 (hat): y 77..302
    # row 1 (glasses): y 504..617
    sheet1_specs = [
        # (frame_name, box, white_thresh, sat_thresh, punch_holes, protect_frac)
        ("gear_hat_kim", (38, 70, 285, 312), 236, 22, False, None),
        ("gear_hat_moc", (312, 66, 538, 312), 236, 22, False, None),
        ("gear_hat_thuy", (560, 102, 818, 286), 236, 22, False, None),
        ("gear_hat_hoa", (826, 98, 1078, 288), 236, 22, False, None),
        ("gear_hat_tho", (1084, 98, 1348, 286), 236, 22, False, None),
        # Glasses: punch interior white gap between arm & frame, keep lenses slightly tinted!
        ("gear_glasses_kim", (36, 494, 289, 628), 240, 18, False, None),
        ("gear_glasses_moc", (300, 494, 554, 628), 238, 20, True, None),
        ("gear_glasses_thuy", (564, 494, 815, 628), 238, 20, True, None),
        ("gear_glasses_hoa", (824, 494, 1078, 628), 238, 20, True, None),
        ("gear_glasses_tho", (1086, 494, 1344, 628), 238, 20, True, None),
    ]
    for name, box, wt, st, punch, prot in sheet1_specs:
        clean = crop_clean(sh1, box, white_thresh=wt, sat_thresh=st, punch_holes=punch, punch_min_area=90, protect_frac=prot)
        frames[name] = trim_and_fit(clean, 84, pad=3)

    # Sheet 3 exact islands:
    # row 0 (shoes): y 62..279
    # row 1 (bag): y 363..707 (MUST punch strap loops!)
    sheet3_specs = [
        ("gear_shoes_kim", (30, 54, 280, 290), 236, 22, False, None),
        ("gear_shoes_moc", (294, 54, 540, 290), 236, 22, False, None),
        ("gear_shoes_thuy", (562, 54, 814, 290), 236, 22, True, None),
        ("gear_shoes_hoa", (832, 54, 1084, 290), 238, 20, False, None),
        ("gear_shoes_tho", (1100, 54, 1350, 290), 236, 22, False, None),
        ("gear_bag_kim", (46, 355, 266, 716), 238, 18, True, (0.05, 0.56, 0.95, 0.96)),
        ("gear_bag_moc", (318, 355, 524, 716), 236, 22, True, (0.05, 0.56, 0.95, 0.96)),
        ("gear_bag_thuy", (568, 355, 808, 716), 236, 22, True, (0.15, 0.48, 0.85, 0.96)),
        ("gear_bag_hoa", (832, 490, 1080, 712), 236, 22, True, (0.12, 0.45, 0.88, 0.95)),
        ("gear_bag_tho", (1100, 355, 1348, 718), 236, 22, True, (0.10, 0.56, 0.92, 0.96)),
    ]
    for name, box, wt, st, punch, prot in sheet3_specs:
        clean = crop_clean(sh3, box, white_thresh=wt, sat_thresh=st, punch_holes=punch, punch_min_area=120, protect_frac=prot)
        frames[name] = trim_and_fit(clean, 84, pad=3)

    # 4. Load the 36 rendered SVG PNGs
    for name in svg_names:
        raw = Image.open(PNG_DIR / f"{name}.png").convert("RGBA")
        target = 96 if (name.startswith("gear_chest_") or name.startswith("set_")) else 84
        frames[name] = trim_and_fit(raw, target, pad=3)

    # Sanity check all 50 gear items exist!
    all_slots = ["hat", "glasses", "jacket", "belt", "shoes", "bag", "wallet", "watch", "phone", "umbrella"]
    for sl in all_slots:
        for el in elements:
            assert f"gear_{sl}_{el}" in frames, f"Missing gear_{sl}_{el}"
    assert len(frames) == 56, f"Expected 56 frames, got {len(frames)}"

    # 5. Pack into public/assets/gear_atlas.webp + gear_atlas.json
    ATLAS_W = 768
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

    atlas_webp = OUT_DIR / "gear_atlas.webp"
    atlas_json = OUT_DIR / "gear_atlas.json"
    atlas_im.save(atlas_webp, format="WEBP", quality=85, method=6)
    atlas_json.write_text(
        json.dumps(
            {
                "frames": json_frames,
                "meta": {
                    "app": "gon-tiem-sach-pho-gear-atlas",
                    "version": "1.0",
                    "image": "gear_atlas.webp",
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

    # Save visual verification contact sheet grouped cleanly by slot & element
    ordered_preview: list[tuple[str, Image.Image]] = []
    for sl in all_slots:
        for el in elements:
            k = f"gear_{sl}_{el}"
            ordered_preview.append((f"{sl}_{el}", frames[k]))
    for extra_k in ["gear_chest_closed", "gear_chest_open", "set_di_mua", "set_phuot", "set_van_phong", "set_chu_tiem_xin"]:
        ordered_preview.append((extra_k.replace("gear_", ""), frames[extra_k]))

    preview_out = SCRATCH_DIR / "gear_atlas_preview.png"
    save_checkerboard_preview(ordered_preview, preview_out)

    print(
        f"Built gear_atlas with {len(frames)} frames -> {ATLAS_W}x{atlas_h}, "
        f"webp={atlas_webp.stat().st_size / 1024:.1f} KB, json={atlas_json.stat().st_size / 1024:.1f} KB"
    )
    print(f"Preview saved: {preview_out}")


if __name__ == "__main__":
    main()
