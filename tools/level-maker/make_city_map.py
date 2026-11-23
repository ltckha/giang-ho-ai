#!/usr/bin/env python3
"""
Vẽ bản đồ màn chính theo dữ liệu thật OpenStreetMap (Claude, 23/11/2026).
Đầu vào: docs/research/streets/osm_dalat_trung_tam.json (đường chính, mặt nước, mốc)
         + hình các phố trong game (docs/research/streets/osm_ways_*.json, osm_ways_pho3.json) để tô nổi bật và đặt ghim đúng chỗ.
Đầu ra:  public/assets/map_dalat_home.webp (khung 720×640) và src/core/streets/homeMapPins.json (vị trí ghim theo %).
Chạy:    python3 tools/level-maker/make_city_map.py
"""
import json, math, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
W, H = 720, 820
INK = (43, 26, 18)
data = json.load(open(os.path.join(ROOT, 'docs/research/streets/osm_dalat_trung_tam.json'), encoding='utf-8'))

# Phố trong game: tên OSM của các đoạn (lấy toạ độ thật)
GAME_STREETS = {
    'street_tang_bat_ho': ['Tăng Bạt Hổ', 'Trương Công Định'],
    'street_pho_ca_phe': ['Nguyễn Chí Thanh', 'Lê Đại Hành'],
    'street_phan_dinh_phung': ['Phan Đình Phùng'],
    'street_nguyen_van_troi': ['Nguyễn Văn Trỗi'],
    'street_hoang_dieu': ['Hoàng Diệu'],
    'street_tran_phu': ['Trần Phú', 'Ba Tháng Hai'],
}
WAY_FILES = ['docs/research/streets/osm_ways_2026-11-23.json', 'docs/research/streets/osm_ways_pho3.json', 'docs/research/streets/osm_nguyen_van_troi.json', 'docs/research/streets/osm_hoang_dieu.json', 'docs/research/streets/osm_tran_phu.json']
KEY2NAME = {'tang_bat_ho': 'Tăng Bạt Hổ', 'truong_cong_dinh': 'Trương Công Định', 'nguyen_chi_thanh': 'Nguyễn Chí Thanh', 'le_dai_hanh': 'Lê Đại Hành'}


def game_ways():
    out = []
    for f in WAY_FILES:
        d = json.load(open(os.path.join(ROOT, f), encoding='utf-8'))
        if 'ways' in d:
            for k, pts in d['ways'].items():
                out.append((KEY2NAME.get(k.rsplit('_', 1)[0], k), [tuple(p) for p in pts]))
        for e in d.get('elements', []):
            if e.get('geometry'):
                out.append((e.get('tags', {}).get('name', ''), [(g['lat'], g['lon']) for g in e['geometry']]))
    return out


# khung: theo dữ liệu đường chính, nới nhẹ
# khung: phóng vào các phố trong game + Hồ Xuân Hương (để ghim không chồng nhau)
_focus = [p for n, pts in game_ways() for p in pts if any(n in v for v in GAME_STREETS.values())]
_focus += [p for w in data['water'] if 'Xuân Hương' in (w.get('name') or '') for p in w['pts']]
lat0, lat1 = min(p[0] for p in _focus), max(p[0] for p in _focus)
lon0, lon1 = min(p[1] for p in _focus), max(p[1] for p in _focus)
_pl, _po = (lat1 - lat0) * 0.22, (lon1 - lon0) * 0.30
lat0, lat1, lon0, lon1 = lat0 - _pl, lat1 + _pl, lon0 - _po, lon1 + _po
kx = math.cos(math.radians((lat0 + lat1) / 2))
spanx, spany = (lon1 - lon0) * kx, (lat1 - lat0)
scale = min((W - 40) / spanx, (H - 40) / spany)
ox = (W - spanx * scale) / 2; oy = (H - spany * scale) / 2


def P(lat, lon):
    return (ox + (lon - lon0) * kx * scale, oy + (lat1 - lat) * scale)


S = 2
im = Image.new('RGB', (W * S, H * S), (176, 204, 150))
d = ImageDraw.Draw(im)
# đồi / rừng thông: chấm tròn nhạt ngẫu nhiên cố định
import random
rnd = random.Random(7)
for _ in range(140):
    x, y, r = rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(14, 40)
    d.ellipse([(x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S], fill=rnd.choice([(166, 196, 140), (186, 212, 160), (158, 188, 132)]))
im = im.filter(ImageFilter.GaussianBlur(10))
d = ImageDraw.Draw(im)
# mặt nước
for w in data['water']:
    pts = [tuple(c * S for c in P(*p)) for p in w['pts']]
    if len(pts) >= 3:
        d.polygon(pts, fill=(104, 186, 230), outline=INK)
        d.line(pts + [pts[0]], fill=INK, width=5)
# đường chính
WID = {'trunk': 12, 'primary': 11, 'secondary': 9, 'tertiary': 7}
roads = sorted(data['roads'], key=lambda r: WID.get(r.get('highway'), 6))
for r in roads:
    pts = [tuple(c * S for c in P(*p)) for p in r['pts']]
    if len(pts) > 1:
        d.line(pts, fill=(120, 96, 70), width=(WID.get(r.get('highway'), 6) + 3) * S, joint='curve')
for r in roads:
    pts = [tuple(c * S for c in P(*p)) for p in r['pts']]
    if len(pts) > 1:
        d.line(pts, fill=(246, 234, 206), width=WID.get(r.get('highway'), 6) * S, joint='curve')
# phố trong game: tô vàng nổi bật + ghim ở giữa phố
pins = {}
gw = game_ways()
for sid, names in GAME_STREETS.items():
    segs = [pts for n, pts in gw if n in names]
    for pts in segs:
        q = [tuple(c * S for c in P(*p)) for p in pts]
        d.line(q, fill=INK, width=14 * S, joint='curve')
        d.line(q, fill=(246, 196, 72), width=10 * S, joint='curve')
    allp = [p for pts in segs for p in pts]
    if allp:
        cx = sum(P(*p)[0] for p in allp) / len(allp); cy = sum(P(*p)[1] for p in allp) / len(allp)
        pins[sid] = {'leftPct': round(cx / W * 100, 1), 'topPct': round(cy / H * 100, 1)}
# ===== trang trí bằng hình Spark (cây thông, nhà Đà Lạt, khu chợ) =====
import random as _r
DECO = os.path.join(ROOT, 'art', 'spark')
def deco(name, size):
    f = os.path.join(DECO, f'deco_{name}.png')
    if not os.path.exists(f):
        return None
    im2 = Image.open(f).convert('RGBA'); im2 = im2.crop(im2.getbbox()); im2.thumbnail((size * S, size * S), Image.LANCZOS)
    return im2
road_segs = []
for r in data['roads']:
    q = [P(*p) for p in r['pts']]
    road_segs += [(q[i], q[i + 1]) for i in range(len(q) - 1)]
lake = []
for w in data['water']:
    lake += [P(*p) for p in w['pts']]
def segd(p, a, b):
    ax, ay = a; bx, by = b; px, py = p; dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / ((dx * dx + dy * dy) or 1)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)
def near_road(p):
    return min(segd(p, a, b) for a, b in road_segs if abs(a[0] - p[0]) < 80 and abs(a[1] - p[1]) < 80) if any(abs(a[0] - p[0]) < 80 and abs(a[1] - p[1]) < 80 for a, b in road_segs) else 999
def in_lake(p):
    return any(math.hypot(p[0] - q[0], p[1] - q[1]) < 18 for q in lake)
pin_pts = [(v['leftPct'] / 100 * W, v['topPct'] / 100 * H) for v in pins.values()]
rng = _r.Random(11)
placed = []
items = []
houses = [deco(n, 30) for n in ['nha_dalat_1', 'nha_dalat_2', 'nha_pho_1', 'nha_pho_2', 'nha_pho_3']]
houses = [h for h in houses if h]
tree = deco('cay_thong', 34)
for _ in range(2600):
    p = (rng.uniform(16, W - 16), rng.uniform(16, H - 30))
    if in_lake(p) or any(math.hypot(p[0] - q[0], p[1] - q[1]) < 26 for q in placed):
        continue
    if any(math.hypot(p[0] - q[0], p[1] - q[1]) < 46 for q in pin_pts):
        continue
    dr = near_road(p)
    if 13 < dr < 24 and houses and len([i for i in items if i[2] == 'h']) < 70:
        items.append((p, rng.choice(houses), 'h')); placed.append(p)
    elif dr > 34 and tree and len([i for i in items if i[2] == 't']) < 60:
        items.append((p, tree, 't')); placed.append(p)
for p, img, _k in sorted(items, key=lambda t: t[0][1]):
    im.paste(img, (int(p[0] * S - img.width / 2), int(p[1] * S - img.height * 0.8)), img)
cho = deco('khu_cho', 56)
for m in data.get('landmarks', []):
    if cho is not None and m['name'] == 'Chợ Đà Lạt':
        x, y = P(m['lat'], m['lon'])
        im.paste(cho, (int(x * S - cho.width / 2), int(y * S - cho.height * 0.8)), cho)
        break
d = ImageDraw.Draw(im)
# mốc
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
    small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
except OSError:
    font = small = ImageFont.load_default()
for m in data.get('landmarks', []):
    x, y = P(m['lat'], m['lon'])
    if not (10 < x < W - 10 and 10 < y < H - 10):
        continue
    pass
for w in data['water']:
    if 'Xuân Hương' in (w.get('name') or ''):
        xs = [P(*p) for p in w['pts']]
        cx = sum(p[0] for p in xs) / len(xs); cy = sum(p[1] for p in xs) / len(xs)
        t = 'Hồ Xuân Hương'; tw = d.textlength(t, font=font)
        d.text((cx * S - tw / 2, cy * S - 12), t, fill=(255, 255, 255), font=font, stroke_width=3, stroke_fill=(40, 90, 130))
txt = '© OpenStreetMap contributors'
tw = d.textlength(txt, font=small)
d.rounded_rectangle([W * S - tw - 26, H * S - 36, W * S - 6, H * S - 8], 8, fill=INK)
d.text((W * S - tw - 16, H * S - 33), txt, fill=(250, 244, 226), font=small)
im = im.resize((W, H), Image.LANCZOS)
im.save(os.path.join(ROOT, 'public/assets/map_dalat_home.webp'), 'WEBP', quality=84, method=6)
json.dump(pins, open(os.path.join(ROOT, 'src/core/streets/homeMapPins.json'), 'w'), ensure_ascii=False, indent=1)
print('ghim:', pins)
