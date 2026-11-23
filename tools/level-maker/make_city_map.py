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
W, H = 720, 640
INK = (43, 26, 18)
data = json.load(open(os.path.join(ROOT, 'docs/research/streets/osm_dalat_trung_tam.json'), encoding='utf-8'))

# Phố trong game: tên OSM của các đoạn (lấy toạ độ thật)
GAME_STREETS = {
    'street_tang_bat_ho': ['Tăng Bạt Hổ', 'Trương Công Định'],
    'street_pho_ca_phe': ['Nguyễn Chí Thanh', 'Lê Đại Hành'],
    'street_phan_dinh_phung': ['Phan Đình Phùng'],
}
WAY_FILES = ['docs/research/streets/osm_ways_2026-11-23.json', 'docs/research/streets/osm_ways_pho3.json']
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
allpts = [p for r in data['roads'] for p in r['pts']] + [p for w in data['water'] for p in w['pts']]
lat0, lat1 = min(p[0] for p in allpts), max(p[0] for p in allpts)
lon0, lon1 = min(p[1] for p in allpts), max(p[1] for p in allpts)
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
        d.polygon(pts, fill=(98, 176, 222), outline=INK)
        d.line(pts + [pts[0]], fill=INK, width=5)
# đường chính
WID = {'trunk': 12, 'primary': 11, 'secondary': 9, 'tertiary': 7}
roads = sorted(data['roads'], key=lambda r: WID.get(r.get('highway'), 6))
for r in roads:
    pts = [tuple(c * S for c in P(*p)) for p in r['pts']]
    if len(pts) > 1:
        d.line(pts, fill=INK, width=(WID.get(r.get('highway'), 6) + 4) * S, joint='curve')
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
    if m.get('kind') == 'market':
        d.rounded_rectangle([(x - 14) * S, (y - 11) * S, (x + 14) * S, (y + 11) * S], 6, fill=(214, 96, 64), outline=INK, width=4)
        d.polygon([((x - 17) * S, (y - 10) * S), ((x + 17) * S, (y - 10) * S), (x * S, (y - 22) * S)], fill=(150, 70, 50), outline=INK)
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
