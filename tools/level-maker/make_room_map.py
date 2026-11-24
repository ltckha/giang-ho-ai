#!/usr/bin/env python3
"""
Vẽ nền PHÒNG TRONG TIỆM cho từng màn tiệm phố thật (Claude, 24/11/2026).
Đọc src/core/streets/generated/*.json (shops: paths, pads, roomStyle, featuredTowerId) →
public/assets/rooms/map_<shopId>.webp (720×1040). Nội thất theo kiểu: luu_tru / quan_an / cafe / tiem;
bày món của chính tiệm (hình Spark mon_<art>_*.png) làm đồ trang trí.
Chạy: python3 tools/level-maker/make_room_map.py
"""
import glob, json, math, os, random
from PIL import Image, ImageDraw, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S, W, H = 2, 360, 520
INK = (43, 26, 18)
STYLE = {
    'luu_tru': {'floor': (140, 52, 48), 'floor2': (124, 44, 42), 'rug': (232, 200, 140), 'wall': (98, 70, 52)},
    'quan_an': {'floor': (232, 222, 200), 'floor2': (206, 192, 166), 'rug': (176, 140, 98), 'wall': (120, 84, 56)},
    'cafe':    {'floor': (170, 120, 78), 'floor2': (150, 104, 66), 'rug': (232, 214, 176), 'wall': (86, 60, 44)},
    'tiem':    {'floor': (212, 178, 128), 'floor2': (196, 160, 112), 'rug': (150, 186, 140), 'wall': (104, 74, 54)},
}
def seg_d(p, a, b):
    ax, ay = a; bx, by = b; px, py = p; dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / ((dx * dx + dy * dy) or 1)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)
def sprite(path, px):
    if not os.path.exists(path): return None
    im = Image.open(path).convert('RGBA'); im = im.crop(im.getbbox()); im.thumbnail((px, px), Image.LANCZOS); return im

def floor(d, st, style):
    if style == 'quan_an':
        for y in range(0, H * S, 40):
            for x in range(0, W * S, 40):
                d.rectangle([x, y, x + 39, y + 39], fill=st['floor'] if ((x + y) // 40) % 2 == 0 else st['floor2'])
    elif style == 'luu_tru':
        d.rectangle([0, 0, W * S, H * S], fill=st['floor'])
        for y in range(20, H * S, 60):
            for x in range(20 + (y // 60 % 2) * 30, W * S, 60):
                d.ellipse([x - 6, y - 6, x + 6, y + 6], fill=st['floor2'])
    else:
        for y in range(0, H * S, 34):
            off = (y // 34 % 3) * 50
            d.rectangle([0, y, W * S, y + 33], fill=st['floor'] if y // 34 % 2 == 0 else st['floor2'])
            for x in range(-off, W * S, 150):
                d.line([x, y, x, y + 33], fill=st['floor2'], width=3)

def furniture(d, im, style, x, y, rnd, decos):
    X, Y = x * S, y * S
    K = 1.8
    def R(a, b, c, e): return [X + a * K, Y + b * K, X + c * K, Y + e * K]
    if style == 'luu_tru':
        if rnd.random() < 0.5:   # giường
            d.rounded_rectangle(R(-34, -24, +34, +24), 8, fill=(246, 238, 222), outline=INK, width=4)
            d.rounded_rectangle(R(-30, -20, +30, -4), 6, fill=(255, 255, 255), outline=INK, width=3)
            d.rectangle(R(-34, +4, +34, +24), fill=(122, 160, 196), outline=INK, width=4)
        else:                    # sofa
            d.rounded_rectangle(R(-30, -14, +30, +16), 10, fill=(196, 130, 74), outline=INK, width=4)
            d.rounded_rectangle(R(-30, -22, +30, -6), 8, fill=(170, 108, 60), outline=INK, width=4)
    elif style == 'quan_an' or style == 'cafe':   # bàn tròn + ghế
        for a in range(0, 360, 90):
            cx, cy = X + 30 * K * math.cos(math.radians(a + 45)), Y + 30 * K * math.sin(math.radians(a + 45))
            d.ellipse([cx - 9 * K, cy - 9 * K, cx + 9 * K, cy + 9 * K], fill=(214, 92, 64) if style == 'quan_an' else (120, 84, 56), outline=INK, width=3)
        d.ellipse(R(-22, -22, +22, +22), fill=(250, 244, 230), outline=INK, width=4)
    else:                         # kệ hàng
        d.rounded_rectangle(R(-32, -18, +32, +18), 6, fill=(150, 104, 66), outline=INK, width=4)
        for i in range(4):
            c = rnd.choice([(232, 96, 72), (92, 170, 210), (246, 196, 72), (110, 180, 110)])
            d.rectangle(R(-26 + i * 14, -12, -16 + i * 14, 2), fill=c, outline=INK, width=2)
    if decos:
        dz = rnd.choice(decos)
        im.paste(dz, (int(X - dz.width / 2), int(Y - dz.height * 0.7)), dz)

def draw(stage, out):
    style = stage.get('roomStyle', 'tiem'); st = STYLE[style]
    rnd = random.Random(stage['id'])
    paths = [[(p['x'], p['y']) for p in r] for r in stage['paths']]
    pads = [(p['x'], p['y']) for p in stage['pads']]
    segs = [(r[i], r[i + 1]) for r in paths for i in range(len(r) - 1)]
    im = Image.new('RGB', (W * S, H * S), st['floor']); d = ImageDraw.Draw(im)
    floor(d, st, style)
    # tường trên + 2 bên, cửa sổ
    d.rectangle([0, 0, W * S, 36 * S], fill=st['wall'])
    for x in range(30, W, 80):
        d.rounded_rectangle([x * S, 8 * S, (x + 40) * S, 30 * S], 6, fill=(186, 220, 236), outline=INK, width=4)
    d.rectangle([0, 0, 8 * S, H * S], fill=st['wall']); d.rectangle([(W - 8) * S, 0, W * S, H * S], fill=st['wall'])
    # thảm đường đi
    for r in paths:
        pts = [(x * S, y * S) for x, y in r]
        d.line(pts, fill=INK, width=60, joint='curve'); d.line(pts, fill=st['rug'], width=52, joint='curve')
        for p in pts: d.ellipse([p[0] - 26, p[1] - 26, p[0] + 26, p[1] + 26], fill=st['rug'])
        d.line(pts, fill=tuple(max(0, c - 30) for c in st['rug']), width=6, joint='curve')
    # quầy ở cuối đường (nơi quái muốn tới)
    ex, ey = paths[0][-1]
    d.rounded_rectangle([(ex - 44) * S, (ey - 20) * S, (ex + 44) * S, (ey + 4) * S], 10, fill=(126, 84, 52), outline=INK, width=5)
    d.rectangle([(ex - 40) * S, (ey - 24) * S, (ex + 40) * S, (ey - 16) * S], fill=(176, 126, 80))
    # thảm chùi chân ở cửa
    for r in paths:
        sx, sy = r[0]
        d.rounded_rectangle([(sx - 26) * S, (min(sy, H) - 14) * S, (sx + 26) * S, min(sy, H) * S], 6, fill=(110, 140, 90), outline=INK, width=4)
    # món của tiệm làm đồ trang trí
    art = stage.get('_art')
    decos = []
    if art:
        for t in ['b1', 'b2', 'b3a', 'b3b']:
            sp = sprite(os.path.join(ROOT, 'art', 'spark', f'mon_{art}_{t}.png'), 40 * S)
            if sp: decos.append(sp)
    placed = []
    for _ in range(600):
        x, y = rnd.uniform(40, W - 40), rnd.uniform(64, H - 40)
        if min(seg_d((x, y), a, b) for a, b in segs) < 50: continue
        if any(math.hypot(x - px, y - py) < 40 for px, py in pads): continue
        if any(math.hypot(x - qx, y - qy) < 66 for qx, qy in placed): continue
        placed.append((x, y))
        furniture(d, im, style, x, y, rnd, decos if rnd.random() < 0.6 else [])
        d = ImageDraw.Draw(im)
        if len(placed) >= 8: break
    # chậu cây góc phòng
    plant = sprite(os.path.join(ROOT, 'art', 'spark', 'deco_bon_hoa.png'), 36 * S)
    if plant:
        for x, y in [(24, 52), (W - 24, 52)]:
            if all(math.hypot(x - px, y - py) > 30 for px, py in pads):
                im.paste(plant, (int(x * S - plant.width / 2), int(y * S - plant.height / 2)), plant)
    im.save(out, 'WEBP', quality=80, method=6)

os.makedirs(os.path.join(ROOT, 'public/assets/rooms'), exist_ok=True)
n = 0
for f in sorted(glob.glob(os.path.join(ROOT, 'src/core/streets/generated/*.json'))):
    g = json.load(open(f, encoding='utf-8'))
    for sh in g.get('shops', []):
        st = sh['stage']
        feat = g['towers'].get(st.get('featuredTowerId', ''), {})
        st['_art'] = feat.get('art')
        draw(st, os.path.join(ROOT, 'public/assets/rooms', f"map_{st['id']}.webp")); n += 1
print('vẽ phòng:', n)
