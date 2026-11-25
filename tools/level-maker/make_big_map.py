#!/usr/bin/env python3
"""
BẢN ĐỒ ĐÀ LẠT LỚN — kéo được ở màn chính (Claude, anh Kha "làm bản đồ" 25/11/2026).
- Đường thật OpenStreetMap (docs/research/streets/osm_dalat_trung_tam.json), tỉ lệ 0,4 điểm/mét: phố gần nhất cách ~120 điểm, bảng tên không đè nhau.
- Nền / mốc / mây: hình Spark đợt 35 (art/ban_do/), cây & nhà: art/spark/deco_*.
- Vùng ngoài khu đang chơi phủ sương (chỗ để mở phố sau này).
Ra: public/assets/map_dalat_lon.webp + src/core/streets/bigMapPins.json (ghim theo % khung).
Chạy: python3 tools/level-maker/make_big_map.py
"""
import json, math, os, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BD = os.path.join(ROOT, 'art', 'ban_do')
SP = os.path.join(ROOT, 'art', 'spark')
INK = (43, 26, 18)
PX_PER_M = 0.4
data = json.load(open(os.path.join(ROOT, 'docs/research/streets/osm_dalat_trung_tam.json'), encoding='utf-8'))

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
# Phố Dốc (3 tiệm đầu) là phố tưởng tượng: đặt ở dốc gần chợ
PHO_DOC = (11.9419, 108.4398)
# Mốc (Spark đợt 35): tên hình, vĩ độ, kinh độ, cỡ (điểm)
LANDMARKS = [
    ('moc_cho_da_lat', 11.94342, 108.43721, 150),
    ('moc_nha_tho_con_ga', 11.93632, 108.43775, 140),
    ('moc_quang_truong', 11.93884, 108.44501, 140),
    ('moc_ga_da_lat', 11.94180, 108.45470, 160),
    ('moc_vuon_hoa', 11.95020, 108.44930, 140),
    ('moc_doi_che', 11.93400, 108.45250, 170),         # đồi chè phía đông nam (vẽ cho vui, Cầu Đất xa hơn)
    ('moc_rung_thong', 11.95450, 108.42200, 160),
    ('moc_rung_thong', 11.93450, 108.42350, 150),
]


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


lat0, lat1 = 11.9300, 11.9590
lon0, lon1 = 108.4180, 108.4580
kx = math.cos(math.radians((lat0 + lat1) / 2))
M = 111320.0
W = int((lon1 - lon0) * kx * M * PX_PER_M)
H = int((lat1 - lat0) * M * PX_PER_M)


def P(lat, lon):
    return ((lon - lon0) * kx * M * PX_PER_M, (lat1 - lat) * M * PX_PER_M)


def load(path, size=None):
    if not os.path.exists(path):
        return None
    im = Image.open(path).convert('RGBA')
    bb = im.getbbox()
    if bb:
        im = im.crop(bb)
    if size:
        im.thumbnail((size, size), Image.LANCZOS)
    return im


def tiled(name, tile=256):
    t = Image.open(os.path.join(BD, f'{name}.png')).convert('RGBA').resize((tile, tile), Image.LANCZOS)
    out = Image.new('RGBA', (W, H))
    for y in range(0, H, tile):
        for x in range(0, W, tile):
            out.paste(t, (x, y))
    return out


rnd = random.Random(35)
# 1. nền cỏ + mảng đất đỏ đồi
im = tiled('nen_bd_co_thong', 240)
dirt = tiled('nen_bd_dat_doi', 240)
mask = Image.new('L', (W, H), 0)
md = ImageDraw.Draw(mask)
for _ in range(26):
    cx, cy, r = rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(90, 200)
    md.ellipse([cx - r, cy - r * 0.7, cx + r, cy + r * 0.7], fill=170)
mask = mask.filter(ImageFilter.GaussianBlur(30))
im.paste(dirt, (0, 0), mask)
d = ImageDraw.Draw(im)

# 2. mặt nước (hồ) bằng hình nước Spark
water = tiled('nen_bd_nuoc_ho', 200)
wm = Image.new('L', (W, H), 0)
wd = ImageDraw.Draw(wm)
lake_pts = []
for w in data['water']:
    pts = [P(*p) for p in w['pts']]
    if len(pts) >= 3:
        wd.polygon(pts, fill=255)
        lake_pts += pts
        d.line(pts + [pts[0]], fill=INK, width=8)
im.paste(water, (0, 0), wm)
d = ImageDraw.Draw(im)
for w in data['water']:
    pts = [P(*p) for p in w['pts']]
    if len(pts) >= 3:
        d.line(pts + [pts[0]], fill=INK, width=5)

# 3. đường
WID = {'trunk': 20, 'primary': 18, 'secondary': 15, 'tertiary': 12}
roads = sorted(data['roads'], key=lambda r: WID.get(r.get('highway'), 10))
for r in roads:
    pts = [P(*p) for p in r['pts']]
    if len(pts) > 1:
        d.line(pts, fill=(112, 86, 60), width=WID.get(r.get('highway'), 10) + 6, joint='curve')
for r in roads:
    pts = [P(*p) for p in r['pts']]
    if len(pts) > 1:
        d.line(pts, fill=(246, 234, 206), width=WID.get(r.get('highway'), 10), joint='curve')

# 4. phố trong game: tô vàng + ghim giữa phố
pins = {}
gw = game_ways()
for sid, names in GAME_STREETS.items():
    segs = [pts for n, pts in gw if n in names]
    for pts in segs:
        q = [P(*p) for p in pts]
        d.line(q, fill=INK, width=24, joint='curve')
        d.line(q, fill=(246, 196, 72), width=17, joint='curve')
    allp = [p for pts in segs for p in pts]
    cx = sum(P(*p)[0] for p in allp) / len(allp)
    cy = sum(P(*p)[1] for p in allp) / len(allp)
    pins[sid] = (cx, cy)
pins['stage_1'] = P(*PHO_DOC)
# Phố Dốc: con dốc nhỏ vẽ tay
px, py = pins['stage_1']
dd = [(px - 70, py + 50), (px - 20, py + 10), (px + 30, py - 10), (px + 80, py - 50)]
d.line(dd, fill=INK, width=24, joint='curve')
d.line(dd, fill=(246, 196, 72), width=17, joint='curve')

# 5. trang trí: nhà ven đường, cây thông xa đường, tránh hồ / ghim / mốc
road_segs = []
for r in data['roads']:
    q = [P(*p) for p in r['pts']]
    road_segs += list(zip(q, q[1:]))


def segd(p, a, b):
    ax, ay = a; bx, by = b; qx, qy = p; dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((qx - ax) * dx + (qy - ay) * dy) / ((dx * dx + dy * dy) or 1)))
    return math.hypot(qx - ax - t * dx, qy - ay - t * dy)


def near_road(p):
    ds = [segd(p, a, b) for a, b in road_segs if abs(a[0] - p[0]) < 120 and abs(a[1] - p[1]) < 120]
    return min(ds) if ds else 999


in_lake = lambda p: wm.getpixel((int(min(max(p[0], 0), W - 1)), int(min(max(p[1], 0), H - 1)))) > 0
lm_pts = [P(la, lo) for _, la, lo, _ in LANDMARKS]
pin_pts = list(pins.values())
houses = [load(os.path.join(SP, f'deco_{n}.png'), 52) for n in ['nha_dalat_1', 'nha_dalat_2', 'nha_pho_1', 'nha_pho_2', 'nha_pho_3']]
houses = [h for h in houses if h]
tree = load(os.path.join(SP, 'deco_cay_thong.png'), 60)
sakura = load(os.path.join(SP, 'deco_cay_mai_anh_dao.png'), 58)
items, placed = [], []
for _ in range(14000):
    p = (rnd.uniform(20, W - 20), rnd.uniform(30, H - 20))
    if in_lake(p) or any(math.hypot(p[0] - q[0], p[1] - q[1]) < 40 for q in placed):
        continue
    if any(math.hypot(p[0] - q[0], p[1] - q[1]) < 110 for q in pin_pts + lm_pts):
        continue
    dr = near_road(p)
    if 22 < dr < 40 and houses and sum(1 for i in items if i[2] == 'h') < 260:
        items.append((p, rnd.choice(houses), 'h')); placed.append(p)
    elif dr > 55 and tree and sum(1 for i in items if i[2] == 't') < 340:
        items.append((p, sakura if (sakura is not None and rnd.random() < 0.15) else tree, 't')); placed.append(p)
for name, la, lo, size in LANDMARKS:
    img = load(os.path.join(BD, f'{name}.png'), size)
    if img is not None:
        items.append((P(la, lo), img, 'm'))
for p, img, _k in sorted(items, key=lambda t: t[0][1]):
    im.alpha_composite(img, (int(p[0] - img.width / 2), int(p[1] - img.height * 0.8)))

# 6. sương ngoài khu đang chơi (chỗ để phố sau này)
fog = tiled('nen_bd_suong', 300)
fm = Image.new('L', (W, H), 0)
fd = ImageDraw.Draw(fm)
xs = [p[0] for p in pin_pts]; ys = [p[1] for p in pin_pts]
cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
rx, ry = (max(xs) - min(xs)) / 2 + 560, (max(ys) - min(ys)) / 2 + 500
for y in range(0, H, 6):
    for x in range(0, W, 6):
        k = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
        if k > 1:
            fd.rectangle([x, y, x + 6, y + 6], fill=int(min(230, (k - 1) * 520)))
fm = fm.filter(ImageFilter.GaussianBlur(24))
fog_full = Image.new('RGBA', (W, H), (246, 244, 238, 255))
fog_full.alpha_composite(fog)
im.paste(fog_full, (0, 0), fm)
cloud = load(os.path.join(BD, 'bd_dam_may.png'), 190)
if cloud is not None:
    for _ in range(9):
        for _t in range(60):
            x, y = rnd.uniform(0, W), rnd.uniform(0, H)
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 1.25:
                im.alpha_composite(cloud, (int(x - cloud.width / 2), int(y - cloud.height / 2)))
                break

# 7. chữ Hồ Xuân Hương + ghi nguồn
d = ImageDraw.Draw(im)
# 6b. TÊN ĐƯỜNG THẬT dọc theo đường (anh Kha 25/11: "bản đồ thực tế, ghi đúng tên đường")
try:
    road_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
    area_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 24)
except OSError:
    road_font = area_font = ImageFont.load_default()
named = {}
for r in data['roads']:
    if r.get('name'):
        named.setdefault(r['name'], []).append([P(*p) for p in r['pts']])
for n, pts in gw:
    if n:
        named.setdefault(n, []).append([P(*p) for p in pts])
labels = []
for name, lines in named.items():
    if name.startswith('Bùng binh') or name.startswith('Công trường') or name == 'Khu Hòa Bình':
        continue
    # chỗ giữa theo chiều dài của nhánh dài nhất; góc lấy theo 2 điểm cách giữa ±45 điểm
    q = max(lines, key=lambda z: sum(math.hypot(u[0] - v[0], u[1] - v[1]) for u, v in zip(z, z[1:])))
    dens = []
    for u, v in zip(q, q[1:]):
        n_ = max(1, int(math.hypot(v[0] - u[0], v[1] - u[1]) / 4))
        dens += [(u[0] + (v[0] - u[0]) * i / n_, u[1] + (v[1] - u[1]) * i / n_) for i in range(n_)]
    if len(dens) < 40:
        continue
    L = len(dens) * 4
    mid = len(dens) // 2
    mx, my = dens[mid]
    a = dens[max(0, mid - 11)]; b = dens[min(len(dens) - 1, mid + 11)]
    if not (30 < mx < W - 30 and 30 < my < H - 30):
        continue
    if fm.getpixel((int(mx), int(my))) > 120:      # trong sương thì thôi
        continue
    if any(math.hypot(mx - q2[0], my - q2[1]) < 70 for q2 in pin_pts) or any(math.hypot(mx - q2[0], my - q2[1]) < 85 for q2 in lm_pts) or any(math.hypot(mx - q2[0], my - q2[1]) < 80 for q2 in labels):
        continue
    tw = int(d.textlength(name, font=road_font)) + 12
    if tw > L * 1.2:
        continue
    t = Image.new('RGBA', (tw, 26), (0, 0, 0, 0))
    ImageDraw.Draw(t).text((6, 3), name, font=road_font, fill=(58, 38, 22), stroke_width=3, stroke_fill=(255, 248, 228))
    ang = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))
    if ang > 90: ang -= 180
    if ang < -90: ang += 180
    t = t.rotate(-ang, expand=True, resample=Image.BICUBIC)
    im.alpha_composite(t, (int(mx - t.width / 2), int(my - t.height / 2)))
    labels.append((mx, my))
# tên phường mới (địa giới từ 1/7/2025, NQ 1671/NQ-UBTVQH15): chữ nhạt, lớp riêng để pha trong
area = Image.new('RGBA', (W, H), (0, 0, 0, 0))
ad = ImageDraw.Draw(area)
for txt_, (la, lo) in [('PHƯỜNG XUÂN HƯƠNG - ĐÀ LẠT', (11.9505, 108.4420)), ('PHƯỜNG CAM LY - ĐÀ LẠT', (11.9350, 108.4225))]:
    x, y = P(la, lo)
    tw = ad.textlength(txt_, font=area_font)
    ad.text((x - tw / 2, y - 20), txt_, font=area_font, fill=(255, 250, 235, 120), stroke_width=2, stroke_fill=(70, 50, 30, 90))
im.alpha_composite(area)
d = ImageDraw.Draw(im)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
    small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
except OSError:
    font = small = ImageFont.load_default()
for w in data['water']:
    if 'Xuân Hương' in (w.get('name') or ''):
        q = [P(*p) for p in w['pts']]
        lx = sum(p[0] for p in q) / len(q); ly = sum(p[1] for p in q) / len(q)
        t = 'Hồ Xuân Hương'; tw = d.textlength(t, font=font)
        d.text((lx - tw / 2, ly - 16), t, fill=(255, 255, 255), font=font, stroke_width=4, stroke_fill=(40, 90, 130))
txt = '© OpenStreetMap contributors'
tw = d.textlength(txt, font=small)
d.rounded_rectangle([W - tw - 26, H - 36, W - 6, H - 8], 8, fill=INK)
d.text((W - tw - 16, H - 33), txt, fill=(250, 244, 226), font=small)

im.convert('RGB').save(os.path.join(ROOT, 'public/assets/map_dalat_lon.webp'), 'WEBP', quality=78, method=6)
out = {k: {'leftPct': round(v[0] / W * 100, 2), 'topPct': round(v[1] / H * 100, 2)} for k, v in pins.items()}
out['_size'] = {'w': W, 'h': H}
json.dump(out, open(os.path.join(ROOT, 'src/core/streets/bigMapPins.json'), 'w'), ensure_ascii=False, indent=1)
print('bản đồ', W, 'x', H, '· ghim:', {k: (round(v[0]), round(v[1])) for k, v in pins.items()})
