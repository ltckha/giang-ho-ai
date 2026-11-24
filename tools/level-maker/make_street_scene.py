#!/usr/bin/env python3
"""
Nền MÀN PHỐ (đánh trùm) đồng bộ nét Spark cho mọi phố thật (Claude, 24/11/2026).
- Nền cỏ / đất đỏ Đà Lạt (ô Spark ghép liền), vỉa hè gạch dọc 2 bên đường, mặt đường nhựa + vạch giữa.
- Hai bên đường: mặt tiền CHÍNH các tiệm của phố đó (mat_tien_*, Spark vẽ) — người chơi thấy lại tiệm vừa giữ.
- Chỗ trống còn lại: đèn đường, cột điện, ghế đá, trạm xe buýt, xe đẩy, xe máy đỗ, bồn hoa, cây thông / mai anh đào.
- Tránh đường đi và ô đặt món. Lối vào lát đá cuội.
Đọc src/core/streets/generated/<phố>.json → public/assets/map_<phố>.webp (720×1040 = 2× khung 360×520).
Chạy: python3 tools/level-maker/make_street_scene.py [street_<id> ...]
"""
import glob, json, math, os, random, sys
from PIL import Image, ImageDraw, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S, W, H = 2, 360, 520
INK = (43, 26, 18)
SP = os.path.join(ROOT, 'art', 'spark')
TILES = os.path.join(ROOT, 'art', 'duong_pho')

ROAD_W, WALK_W = 40, 64      # bề rộng mặt đường / vỉa hè (đơn vị khung 360×520)
PROPS_SMALL = ['den_duong', 'cot_dien', 'ghe_da', 'thung_rac', 'bon_hoa', 'xe_may_do', 'hang_rao_sat', 'gio_hoa']
PROPS_BIG = ['tram_xe_buyt', 'xe_day_hang_rong', 'cay_thong', 'cay_mai_anh_dao', 'cay_thong']


def seg_d(p, a, b):
    ax, ay = a; bx, by = b; px, py = p; dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / ((dx * dx + dy * dy) or 1)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)


def sprite(path, px):
    if not os.path.exists(path):
        return None
    im = Image.open(path).convert('RGBA')
    im = im.crop(im.getbbox())
    im.thumbnail((px, px), Image.LANCZOS)
    return im


def tiled(name, size, tile_px=150, darken=1.0):
    t = Image.open(os.path.join(TILES, f'{name}.png')).convert('RGB').resize((tile_px, tile_px), Image.LANCZOS)
    if darken != 1.0:
        t = ImageEnhance.Brightness(t).enhance(darken)
    out = Image.new('RGB', size)
    for y in range(0, size[1], tile_px):
        for x in range(0, size[0], tile_px):
            out.paste(t, (x, y))
    return out


def stroke_mask(paths, width):
    m = Image.new('L', (W * S, H * S), 0)
    d = ImageDraw.Draw(m)
    for r in paths:
        pts = [(x * S, y * S) for x, y in r]
        d.line(pts, fill=255, width=width * S, joint='curve')
        for x, y in pts:
            d.ellipse([x - width * S / 2, y - width * S / 2, x + width * S / 2, y + width * S / 2], fill=255)
    return m


def draw(g, out):
    st = g['stage']
    rnd = random.Random(st['id'])
    paths = [[(p['x'], p['y']) for p in r] for r in st['paths']]
    pads = [(p['x'], p['y']) for p in st['pads']]
    segs = [(r[i], r[i + 1]) for r in paths for i in range(len(r) - 1)]
    size = (W * S, H * S)

    # 1. nền: cỏ ven đường pha đất đỏ thành mảng
    im = ImageEnhance.Color(tiled('nen_co_ven_duong', size, 160, darken=0.92)).enhance(0.72)   # dịu bớt cho hợp tông ấm
    dirt = tiled('nen_dat_do', size)
    blot = Image.new('L', size, 0)
    bd = ImageDraw.Draw(blot)
    for _ in range(7):
        cx, cy, r = rnd.uniform(0, W * S), rnd.uniform(0, H * S), rnd.uniform(60, 130)
        bd.ellipse([cx - r, cy - r * 0.7, cx + r, cy + r * 0.7], fill=150)
    im.paste(dirt, (0, 0), blot)

    # 2. vỉa hè gạch + viền, 3. mặt đường nhựa (tối lại cho ra màu nhựa) + viền + vạch giữa
    walk = stroke_mask(paths, WALK_W)
    edge = stroke_mask(paths, WALK_W + 4)
    im.paste(Image.new('RGB', size, (120, 86, 60)), (0, 0), edge)
    im.paste(tiled('nen_via_he_gach', size, 110), (0, 0), walk)
    curb = stroke_mask(paths, ROAD_W + 4)
    im.paste(Image.new('RGB', size, (200, 196, 186)), (0, 0), curb)
    road = stroke_mask(paths, ROAD_W)
    im.paste(tiled('nen_duong_nhua', size, 150, darken=0.62), (0, 0), road)
    d = ImageDraw.Draw(im)
    for r in paths:
        for (ax, ay), (bx, by) in zip(r, r[1:]):
            L = math.hypot(bx - ax, by - ay)
            n = int(L // 14)
            for k in range(n):
                if k % 2:
                    continue
                t0, t1 = k / max(n, 1), min(1, (k + 0.6) / max(n, 1))
                d.line([((ax + (bx - ax) * t0) * S, (ay + (by - ay) * t0) * S), ((ax + (bx - ax) * t1) * S, (ay + (by - ay) * t1) * S)],
                       fill=(250, 236, 190), width=3)

    # 4. lối vào lát đá cuội
    cobble = tiled('nen_da_cuoi', size, 90)
    for r in paths:
        sx, sy = min(max(r[0][0], 0), W), min(max(r[0][1], 0), H)
        m = Image.new('L', size, 0)
        ImageDraw.Draw(m).ellipse([(sx - 34) * S, (sy - 30) * S, (sx + 34) * S, (sy + 30) * S], fill=255)
        im.paste(cobble, (0, 0), m)

    # 5. chỗ trống: không đè đường, ô đặt món, điểm cuối (trùm vào)
    ex, ey = paths[0][-1]
    taken = []

    def free(x, y, need_road, rad):
        if x < 22 or x > W - 22 or y < 34 or y > H - 18:
            return False
        dd = min(seg_d((x, y), a, b) for a, b in segs)
        if dd < WALK_W / 2 + rad * 0.35:
            return False
        if need_road and dd > WALK_W / 2 + rad + 16:
            return False
        if any(math.hypot(x - px, y - py) < 26 + rad * 0.55 for px, py in pads):
            return False
        if any(math.hypot(x - qx, y - qy) < (rad + qr) * 0.62 for qx, qy, qr in taken):
            return False
        return math.hypot(x - ex, y - ey) > 40

    items = []
    # mặt tiền các tiệm của phố (sát vỉa hè)
    for sh in g.get('shops', []):
        key = sh['stage'].get('facadeKey')
        img = sprite(os.path.join(SP, f'{key}.png'), 80 * S) if key else None
        if img is None:
            continue
        for _ in range(500):
            x, y = rnd.uniform(26, W - 26), rnd.uniform(40, H - 30)
            if free(x, y, True, 40):
                taken.append((x, y, 40))
                items.append((y, x, img))
                break
    # đồ đường phố
    for name, px, need, tries in [(n, 52, False, 3) for n in PROPS_BIG] + [(n, 34, True, 2) for n in PROPS_SMALL] * 2:
        img = sprite(os.path.join(SP, f'deco_{name}.png'), px * S)
        if img is None:
            continue
        for _ in range(300):
            x, y = rnd.uniform(20, W - 20), rnd.uniform(36, H - 20)
            if free(x, y, need, px / 2):
                taken.append((x, y, px / 2))
                items.append((y, x, img))
                break

    # vẽ từ xa tới gần (y nhỏ trước) + bóng đổ nhẹ
    shadow = Image.new('RGBA', size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    for y, x, img in items:
        w = img.width * 0.42
        sd.ellipse([x * S - w, y * S - 6, x * S + w, y * S + 8], fill=(30, 20, 10, 70))
    im = Image.alpha_composite(im.convert('RGBA'), shadow)
    for y, x, img in sorted(items):
        im.paste(img, (int(x * S - img.width / 2), int(y * S - img.height * 0.9)), img)

    # 6. ghi nguồn bản đồ
    d = ImageDraw.Draw(im)
    txt = '© OpenStreetMap contributors'
    d.rounded_rectangle([W * S - 250, H * S - 26, W * S - 6, H * S - 4], 8, fill=(20, 14, 10, 170))
    d.text((W * S - 242, H * S - 22), txt, fill=(240, 230, 210))
    im.convert('RGB').save(out, 'WEBP', quality=84, method=6)
    return len(items)


def main():
    want = [a for a in sys.argv[1:] if a.startswith('street_')]
    for f in sorted(glob.glob(os.path.join(ROOT, 'src/core/streets/generated/*.json'))):
        g = json.load(open(f, encoding='utf-8'))
        sid = g['stage']['id']
        if want and sid not in want:
            continue
        n = draw(g, os.path.join(ROOT, 'public/assets', f'map_{sid}.webp'))
        print(f'{sid}: {n} món trang trí')


if __name__ == '__main__':
    main()
