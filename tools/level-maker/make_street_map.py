#!/usr/bin/env python3
"""
Máy tự vẽ nền cho phố thật (Claude, 23/11/2026) — dùng khi chưa có nền vẽ tay.
Đọc src/core/streets/realStreets.generated.json (đường đi + ô) và content/streets/*.json (mapTheme),
vẽ public/assets/map_street_<id>.webp (720×1040 = 2× khung 360×520):
  nền vỉa hè lát gạch, đường theo đúng tuyến (viền + vạch giữa), dãy nhà / mái / cây ở chỗ trống
  (tránh đường và ô đặt món), lối vào / lối ra, dòng "© OpenStreetMap contributors".
Phố đã có nền vẽ tay thì bỏ qua (trừ khi chạy với --force <id>).
Chạy: python3 tools/level-maker/make_street_map.py [--force street_<id>]
"""
import json, math, os, random, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S, W, H = 2, 360, 520
INK = (43, 26, 18)

THEMES = {
    'dalat': {'ground': (120, 132, 104), 'tile': (108, 120, 94), 'road': (214, 200, 168), 'edge': (150, 128, 96),
              'walls': [(236, 222, 196), (226, 206, 170), (240, 230, 210), (214, 196, 168)],
              'roofs': [(176, 84, 62), (150, 70, 58), (92, 120, 96), (120, 92, 70), (70, 96, 120)],
              'tree': [(66, 128, 76), (52, 110, 64), (84, 146, 84)]},
    'saigon': {'ground': (150, 140, 128), 'tile': (138, 128, 116), 'road': (96, 96, 102), 'edge': (60, 60, 66),
               'walls': [(244, 224, 170), (236, 210, 150), (230, 232, 226), (240, 200, 160)],
               'roofs': [(190, 90, 60), (160, 70, 50), (120, 110, 100), (60, 110, 140), (200, 150, 70)],
               'tree': [(70, 140, 80), (56, 120, 70), (96, 150, 76)]},
}


def seg_d(p, a, b):
    ax, ay = a; bx, by = b; px, py = p; dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / ((dx * dx + dy * dy) or 1)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)


def draw(sid, geo, theme_name, out_path):
    th = THEMES.get(theme_name, THEMES['dalat'])
    rnd = random.Random(sid)
    im = Image.new('RGB', (W * S, H * S), th['ground'])
    d = ImageDraw.Draw(im)
    # gạch lát vỉa hè
    for y in range(0, H * S, 24):
        off = 12 if (y // 24) % 2 else 0
        for x in range(-off, W * S, 24):
            d.rectangle([x + 1, y + 1, x + 22, y + 22], outline=th['tile'])
    paths = [[(p['x'], p['y']) for p in r] for r in geo['paths']]
    pads = [(p['x'], p['y']) for p in geo['pads']]
    segs = [(r[i], r[i + 1]) for r in paths for i in range(len(r) - 1)]

    def clear(x, y, rx, ry):
        # khối nhà tâm (x,y) nửa rộng rx, nửa cao ry: không đè đường, ô, mép
        if x - rx < 4 or x + rx > W - 4 or y - ry < 4 or y + ry > H - 22:
            return False
        r = math.hypot(rx, ry)
        if min(seg_d((x, y), a, b) for a, b in segs) < r + 18:
            return False
        if any(math.hypot(x - px, y - py) < r + 24 for px, py in pads):
            return False
        return True

    # nhà
    placed = []
    cells = [(x, y) for y in range(20, H - 20, 8) for x in range(20, W - 20, 8)]
    rnd.shuffle(cells)
    for x, y in cells:
        rx, ry = rnd.choice([(22, 16), (18, 14), (26, 18), (16, 16)])
        if not clear(x, y, rx, ry):
            continue
        if any(abs(x - qx) < rx + qrx + 4 and abs(y - qy) < ry + qry + 4 for qx, qy, qrx, qry in placed):
            continue
        placed.append((x, y, rx, ry))
    for x, y, rx, ry in sorted(placed, key=lambda b: b[1]):
        wall = rnd.choice(th['walls']); roof = rnd.choice(th['roofs'])
        x0, y0, x1, y1 = (x - rx) * S, (y - ry) * S, (x + rx) * S, (y + ry) * S
        d.rounded_rectangle([x0 + 6, y0 + 8, x1 + 6, y1 + 8], 10, fill=(0, 0, 0))  # bóng
        d.rounded_rectangle([x0, y0, x1, y1], 10, fill=wall, outline=INK, width=4)
        rh = (y1 - y0) * 0.42
        d.rounded_rectangle([x0 - 4, y0 - 4, x1 + 4, y0 + rh], 10, fill=roof, outline=INK, width=4)
        # cửa sổ + cửa
        n = max(1, int((x1 - x0) / 34))
        for i in range(n):
            wx = x0 + (i + 0.5) * (x1 - x0) / n
            d.rounded_rectangle([wx - 9, y0 + rh + 10, wx + 9, y0 + rh + 26], 4, fill=(250, 214, 120), outline=INK, width=3)
        # mái hiên sọc
        aw_y = y1 - 16
        for i, sx in enumerate(range(int(x0) + 6, int(x1) - 6, 14)):
            d.rectangle([sx, aw_y - 10, min(sx + 14, int(x1) - 6), aw_y], fill=(232, 72, 60) if i % 2 == 0 else (250, 246, 236))
        d.line([x0 + 6, aw_y, x1 - 6, aw_y], fill=INK, width=3)
    # cây ở chỗ trống nhỏ
    trees = 0
    for x, y in cells:
        if trees > 26:
            break
        if not clear(x, y, 9, 9):
            continue
        if any(abs(x - qx) < qrx + 12 and abs(y - qy) < qry + 12 for qx, qy, qrx, qry in placed):
            continue
        placed.append((x, y, 6, 6)); trees += 1
        c = rnd.choice(th['tree'])
        d.ellipse([(x - 11) * S + 6, (y - 11) * S + 8, (x + 11) * S + 6, (y + 11) * S + 8], fill=(0, 0, 0))
        d.ellipse([(x - 11) * S, (y - 11) * S, (x + 11) * S, (y + 11) * S], fill=c, outline=INK, width=4)
        d.ellipse([(x - 5) * S, (y - 7) * S, (x + 1) * S, (y - 2) * S], fill=tuple(min(255, v + 40) for v in c))
    im = Image.blend(im, im.filter(ImageFilter.GaussianBlur(0)), 1)
    d = ImageDraw.Draw(im)
    # đường
    for r in paths:
        pts = [(x * S, y * S) for x, y in r]
        d.line(pts, fill=INK, width=58, joint='curve')
        d.line(pts, fill=th['edge'], width=52, joint='curve')
        d.line(pts, fill=th['road'], width=44, joint='curve')
        for p in pts:
            d.ellipse([p[0] - 22, p[1] - 22, p[0] + 22, p[1] + 22], fill=th['road'])
    for r in paths:  # vạch giữa đứt quãng
        for i in range(len(r) - 1):
            (ax, ay), (bx, by) = r[i], r[i + 1]
            L = math.hypot(bx - ax, by - ay)
            for t in range(0, int(L), 14):
                t2 = min(L, t + 7)
                d.line([(ax + (bx - ax) * t / L) * S, (ay + (by - ay) * t / L) * S, (ax + (bx - ax) * t2 / L) * S, (ay + (by - ay) * t2 / L) * S], fill=(250, 244, 226), width=4)
    # chữ bản quyền
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
    except OSError:
        font = ImageFont.load_default()
    txt = '© OpenStreetMap contributors'
    tw = d.textlength(txt, font=font)
    d.rounded_rectangle([W * S - tw - 30, H * S - 40, W * S - 8, H * S - 10], 10, fill=(43, 26, 18))
    d.text((W * S - tw - 19, H * S - 36), txt, fill=(250, 244, 226), font=font)
    im.save(out_path, 'WEBP', quality=82, method=6)


def main():
    force = sys.argv[sys.argv.index('--force') + 1] if '--force' in sys.argv else None
    geo_all = json.load(open(os.path.join(ROOT, 'src/core/streets/realStreets.generated.json'), encoding='utf-8'))
    cdir = os.path.join(ROOT, 'content/streets')
    for f in sorted(os.listdir(cdir)):
        if not f.endswith('.json'):
            continue
        spec = json.load(open(os.path.join(cdir, f), encoding='utf-8'))
        sid = spec['id']
        out = os.path.join(ROOT, 'public/assets', f'map_{sid}.webp')
        if os.path.exists(out) and force != sid:
            continue
        geo = geo_all.get(spec['geometry'])
        if not geo:
            print('thiếu đường đi:', sid); continue
        draw(sid, geo, spec.get('mapTheme', 'dalat'), out)
        print('vẽ nền:', out)


if __name__ == '__main__':
    main()
