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
    'dalat': {'ground': (150, 184, 120), 'tile': (222, 208, 176), 'road': (214, 200, 168), 'edge': (150, 128, 96),
              'walls': [(236, 222, 196), (226, 206, 170), (240, 230, 210), (214, 196, 168)],
              'roofs': [(176, 84, 62), (150, 70, 58), (92, 120, 96), (120, 92, 70), (70, 96, 120)],
              'tree': [(66, 128, 76), (52, 110, 64), (84, 146, 84)]},
    'saigon': {'ground': (168, 176, 140), 'tile': (214, 204, 186), 'road': (96, 96, 102), 'edge': (60, 60, 66),
               'walls': [(244, 224, 170), (236, 210, 150), (230, 232, 226), (240, 200, 160)],
               'roofs': [(190, 90, 60), (160, 70, 50), (120, 110, 100), (60, 110, 140), (200, 150, 70)],
               'tree': [(70, 140, 80), (56, 120, 70), (96, 150, 76)]},
}


def seg_d(p, a, b):
    ax, ay = a; bx, by = b; px, py = p; dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / ((dx * dx + dy * dy) or 1)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)


def _deco(name, px):
    f = os.path.join(ROOT, 'art', 'spark', f'deco_{name}.png')
    if not os.path.exists(f):
        return None
    im = Image.open(f).convert('RGBA'); im = im.crop(im.getbbox()); im.thumbnail((px, px), Image.LANCZOS)
    return im


def facade_spot(paths, pads):
    """Giống findFacadeSpot trong make-street.ts: chỗ trống rộng nhất để đặt mặt tiền tiệm."""
    segs = [(r[i], r[i + 1]) for r in paths for i in range(len(r) - 1)]
    best = (300, 60, -1)
    for y in range(40, 471, 6):
        for x in range(40, 321, 6):
            dpath = min(seg_d((x, y), a, b) for a, b in segs) - 22
            dpad = min(math.hypot(x - px, y - py) for px, py in pads) - 22
            r = min(dpath, dpad, x, 360 - x, y, 500 - y, 60)
            if r > best[2]:
                best = (x, y, r)
    return best


def draw(sid, geo, theme_name, out_path):
    th = THEMES.get(theme_name, THEMES['dalat'])
    rnd = random.Random(sid)
    paths = [[(p['x'], p['y']) for p in r] for r in geo['paths']]
    pads = [(p['x'], p['y']) for p in geo['pads']]
    segs = [(r[i], r[i + 1]) for r in paths for i in range(len(r) - 1)]
    fx, fy, fr = facade_spot(paths, pads)
    # nền cỏ mịn, vài mảng đậm nhạt
    im = Image.new('RGB', (W * S, H * S), th['ground'])
    d = ImageDraw.Draw(im)
    for _ in range(60):
        x, y, r = rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(20, 60)
        c = tuple(max(0, min(255, v + rnd.randint(-8, 8))) for v in th['ground'])
        d.ellipse([(x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S], fill=c)
    im = im.filter(ImageFilter.GaussianBlur(14))
    d = ImageDraw.Draw(im)
    # vỉa hè hai bên đường (dải sáng rộng) rồi tới mặt đường
    for r in paths:
        pts = [(x * S, y * S) for x, y in r]
        d.line(pts, fill=th['tile'], width=96, joint='curve')
        for p in pts:
            d.ellipse([p[0] - 48, p[1] - 48, p[0] + 48, p[1] + 48], fill=th['tile'])
    for r in paths:
        pts = [(x * S, y * S) for x, y in r]
        d.line(pts, fill=INK, width=58, joint='curve')
        d.line(pts, fill=th['road'], width=50, joint='curve')
        for p in pts:
            d.ellipse([p[0] - 25, p[1] - 25, p[0] + 25, p[1] + 25], fill=th['road'])
    for r in paths:
        for i in range(len(r) - 1):
            (ax, ay), (bx, by) = r[i], r[i + 1]
            L = math.hypot(bx - ax, by - ay) or 1
            for t in range(0, int(L), 16):
                t2 = min(L, t + 8)
                d.line([(ax + (bx - ax) * t / L) * S, (ay + (by - ay) * t / L) * S, (ax + (bx - ax) * t2 / L) * S, (ay + (by - ay) * t2 / L) * S], fill=(250, 244, 226), width=4)
    # sân nhỏ chừa cho mặt tiền tiệm
    pr = -100  # màn phố không đặt mặt tiền tiệm → không chừa sân
    # dãy nhà ngay ngắn dọc đường
    names = ['nha_dalat_1', 'nha_dalat_2', 'nha_pho_1', 'nha_pho_2', 'nha_pho_3'] if theme_name != 'saigon' else ['nha_saigon_1', 'nha_saigon_2', 'nha_pho_1', 'nha_pho_2', 'nha_pho_3']
    houses = [h for h in (_deco(n, 40 * S) for n in names) if h]
    tree_names = ['cay_thong', 'cay_mai_anh_dao'] if theme_name != 'saigon' else ['cay_me', 'cay_bang', 'bon_hoa']
    trees = [t for t in (_deco(n, 30 * S) for n in tree_names) if t]
    placed = []
    def free(x, y, rad):
        if x < 16 or x > W - 16 or y < 18 or y > H - 26:
            return False
        if min(seg_d((x, y), a, b) for a, b in segs) < 30:
            return False
        if any(math.hypot(x - px, y - py) < 30 for px, py in pads):
            return False
        if math.hypot(x - fx, y - fy) < pr + 18:
            return False
        return all(math.hypot(x - qx, y - qy) >= rad + qr for qx, qy, qr in placed)
    items = []
    for r in paths:
        for i in range(len(r) - 1):
            (ax, ay), (bx, by) = r[i], r[i + 1]
            L = math.hypot(bx - ax, by - ay) or 1
            nx, ny = -(by - ay) / L, (bx - ax) / L
            for t in range(0, int(L), 34):
                cx, cy = ax + (bx - ax) * t / L, ay + (by - ay) * t / L
                for off in (44, 82):
                    for side in (1, -1):
                        x, y = cx + nx * off * side, cy + ny * off * side
                        if houses and free(x, y, 17):
                            placed.append((x, y, 17)); items.append((x, y, rnd.choice(houses)))
    for _ in range(400):
        if len([1 for it in items if it[2] in trees]) >= 14 or not trees:
            break
        x, y = rnd.uniform(16, W - 16), rnd.uniform(18, H - 26)
        if free(x, y, 22):
            placed.append((x, y, 22)); items.append((x, y, rnd.choice(trees)))
    for x, y, img in sorted(items, key=lambda it: it[1]):
        im.paste(img, (int(x * S - img.width / 2), int(y * S - img.height * 0.75)), img)
    d = ImageDraw.Draw(im)
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
    except OSError:
        font = ImageFont.load_default()
    txt = '© OpenStreetMap contributors'
    tw = d.textlength(txt, font=font)
    d.rounded_rectangle([W * S - tw - 30, H * S - 40, W * S - 8, H * S - 10], 10, fill=(43, 26, 18))
    d.text((W * S - tw - 19, H * S - 36), txt, fill=(250, 244, 226), font=font)
    im.save(out_path, 'WEBP', quality=84, method=6)


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
