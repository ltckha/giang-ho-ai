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

NT = os.path.join(ROOT, 'art', 'noi_that')
TILE = {'luu_tru': 'nen_san_tham', 'quan_an': 'nen_san_xi_mang', 'cafe': 'nen_san_go', 'tiem': 'nen_san_da'}
WALL = {'luu_tru': 'nen_tuong_go', 'quan_an': 'nen_tuong_voi', 'cafe': 'nen_tuong_go', 'tiem': 'nen_tuong_voi'}
COUNTER = {'luu_tru': 'noi_quay_le_tan', 'quan_an': 'noi_bep_quan', 'cafe': 'noi_quay_pha_che', 'tiem': 'noi_quay_thu_ngan'}
FURN = {
    'luu_tru': ['noi_giuong_doi', 'noi_giuong_doi', 'noi_giuong_tang', 'noi_sofa', 'noi_ban_tra', 'noi_tu_quan_ao', 'noi_chau_cay_lon', 'noi_tham_tron'],
    'quan_an': ['noi_ban_quan', 'noi_ban_quan', 'noi_ban_quan', 'noi_ban_go_dai', 'noi_tu_lanh', 'noi_chau_cay_lon'],
    'cafe': ['noi_ban_cafe', 'noi_ban_cafe', 'noi_ban_cafe', 'noi_ghe_banh', 'noi_ke_ly', 'noi_chau_cay_lon', 'noi_tham_tron'],
    'tiem': ['noi_ke_hang', 'noi_ke_hang', 'noi_tu_kinh', 'noi_gio_hang', 'noi_thung_hang', 'noi_chau_cay_lon'],
}
def nt(name, px):
    return sprite(os.path.join(NT, f'{name}.png'), px)
def tile_fill(im, name, box):
    f = os.path.join(NT, f'{name}.png')
    if not os.path.exists(f): return False
    t = Image.open(f).convert('RGB').resize((160, 160), Image.LANCZOS)
    x0, y0, x1, y1 = box
    for y in range(y0, y1, 160):
        for x in range(x0, x1, 160):
            im.paste(t.crop((0, 0, min(160, x1 - x), min(160, y1 - y))), (x, y))
    return True

def draw(stage, out):
    style = stage.get('roomStyle', 'tiem'); st = STYLE[style]
    rnd = random.Random(stage['id'])
    paths = [[(p['x'], p['y']) for p in r] for r in stage['paths']]
    pads = [(p['x'], p['y']) for p in stage['pads']]
    segs = [(r[i], r[i + 1]) for r in paths for i in range(len(r) - 1)]
    im = Image.new('RGB', (W * S, H * S), st['floor']); d = ImageDraw.Draw(im)
    if not tile_fill(im, TILE[style], (0, 0, W * S, H * S)):
        floor(d, st, style)
    d = ImageDraw.Draw(im)
    # tường trên + 2 bên, cửa sổ
    if not tile_fill(im, WALL[style], (0, 0, W * S, 40 * S)):
        d.rectangle([0, 0, W * S, 40 * S], fill=st['wall'])
    d = ImageDraw.Draw(im)
    d.line([0, 40 * S, W * S, 40 * S], fill=INK, width=6)
    win = nt('noi_cua_so', 34 * S); pic = nt('noi_tranh_tuong', 26 * S); clk = nt('noi_dong_ho_tuong', 22 * S)
    for i, x in enumerate(range(40, W - 20, 80)):
        it = [win, pic, win, clk][i % 4] or win
        if it is not None:
            im.paste(it, (int(x * S - it.width / 2), int(20 * S - it.height / 2)), it)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 8 * S, H * S], fill=st['wall']); d.rectangle([(W - 8) * S, 0, W * S, H * S], fill=st['wall'])
    # thảm đường đi
    for r in paths:
        pts = [(x * S, y * S) for x, y in r]
        d.line(pts, fill=INK, width=60, joint='curve'); d.line(pts, fill=st['rug'], width=52, joint='curve')
        for p in pts: d.ellipse([p[0] - 26, p[1] - 26, p[0] + 26, p[1] + 26], fill=st['rug'])
        d.line(pts, fill=tuple(max(0, c - 30) for c in st['rug']), width=6, joint='curve')
    # quầy ở cuối đường (nơi quái muốn tới)
    ex, ey = paths[0][-1]
    ctr = nt(COUNTER[style], 84 * S)
    if ctr is not None:
        im.paste(ctr, (int(ex * S - ctr.width / 2), int((ey - 6) * S - ctr.height * 0.85)), ctr)
        d = ImageDraw.Draw(im)
    else:
        d.rounded_rectangle([(ex - 44) * S, (ey - 20) * S, (ex + 44) * S, (ey + 4) * S], 10, fill=(126, 84, 52), outline=INK, width=5)
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
    pool = FURN[style][:]
    rnd.shuffle(pool)
    items = []
    for _ in range(900):
        x, y = rnd.uniform(44, W - 44), rnd.uniform(78, H - 44)
        if min(seg_d((x, y), a, b) for a, b in segs) < 52: continue
        if any(math.hypot(x - px, y - py) < 42 for px, py in pads): continue
        if any(math.hypot(x - qx, y - qy) < 70 for qx, qy in placed): continue
        if math.hypot(x - ex, y - ey) < 60: continue
        placed.append((x, y))
        name = pool[len(items) % len(pool)]
        size = 74 if name in ('noi_giuong_doi', 'noi_giuong_tang', 'noi_ban_go_dai', 'noi_sofa', 'noi_ke_hang') else 60
        img = nt(name, size * S)
        if img is None:
            furniture(d, im, style, x, y, rnd, []); d = ImageDraw.Draw(im); continue
        items.append((x, y, img, decos[len(items) % len(decos)] if decos and name in ('noi_ban_quan', 'noi_ban_cafe', 'noi_ban_tra', 'noi_ke_hang', 'noi_tu_kinh') else None))
        if len(placed) >= 8: break
    for x, y, img, dz in sorted(items, key=lambda t: t[1]):
        im.paste(img, (int(x * S - img.width / 2), int(y * S - img.height * 0.7)), img)
        if dz is not None:
            dz2 = dz.copy(); dz2.thumbnail((30 * S, 30 * S))
            im.paste(dz2, (int(x * S - dz2.width / 2), int(y * S - img.height * 0.7 - dz2.height * 0.4)), dz2)
    d = ImageDraw.Draw(im)
    # chậu cây góc phòng
    plant = nt('noi_chau_cay_lon', 40 * S)
    if plant:
        for x, y in [(24, 64), (W - 24, 64)]:
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
