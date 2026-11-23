#!/usr/bin/env python3
"""
Chuyển đường phố thật (OpenStreetMap) thành đường đi + ô đặt món trong khung logic 360x520 của game.
- Đọc docs/research/streets/osm_ways_2026-11-23.json
- Mỗi "phố" gồm các tuyến (đầu vào → … → cuối), ghép từ các đoạn way (có thể đảo chiều).
- Xoay để vừa khung dọc nhất, co giãn đều, giản lược điểm, tự đặt ô cách đường 38–70 đơn vị.
- Ghi src/core/streets/realStreets.generated.json và ảnh xem trước docs/research/streets/<id>.png
Chạy: python3 tools/osm_street_to_stage.py
"""
import json, math, os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WAYS = json.load(open(os.path.join(ROOT, 'docs/research/streets/osm_ways_2026-11-23.json'), encoding='utf-8'))['ways']
# phố thêm sau (Overpass dạng elements/geometry)
_p3 = os.path.join(ROOT, 'docs/research/streets/osm_ways_pho3.json')
if os.path.exists(_p3):
    for _e in json.load(open(_p3, encoding='utf-8'))['elements']:
        if _e.get('type') == 'way' and _e.get('geometry'):
            _n = (_e.get('tags', {}).get('name', 'way').lower()
                  .replace('đ', 'd').replace('ì', 'i').replace('ù', 'u').replace(' ', '_'))
            WAYS[f"{_n}_{_e['id']}"] = [[g['lat'], g['lon']] for g in _e['geometry']]
W, H, MARGIN = 360, 520, 30

def seq(*parts):
    pts = []
    for name, rev in parts:
        p = WAYS[name][::-1] if rev else WAYS[name]
        pts += p if not pts else p[1:]
    return pts

STREETS = {
    'pho_phan_dinh_phung': {
        'name': 'Phố Phan Đình Phùng (Cầu Quẹo)',
        'routes': [seq(('phan_dinh_phung_125315462', False))],
    },
    'pho_tang_bat_ho': {
        'name': 'Phố Tăng Bạt Hổ – Trương Công Định',
        'routes': [
            seq(('truong_cong_dinh_1073349601', True), ('tang_bat_ho_99660934', False)),   # vào từ đầu bắc Trương Công Định
            seq(('truong_cong_dinh_99661165', False), ('tang_bat_ho_99660934', False)),    # vào từ đầu nam Trương Công Định
        ],
    },
    'pho_ca_phe': {
        'name': 'Phố Cà Phê Nguyễn Chí Thanh – Lê Đại Hành',
        'routes': [
            seq(('nguyen_chi_thanh_125313856', True), ('le_dai_hanh_99660929', False), ('le_dai_hanh_1504433334', False)),
            seq(('nguyen_chi_thanh_1215271180', False), ('le_dai_hanh_99660929', False), ('le_dai_hanh_1504433334', False)),
        ],
    },
}

def to_m(pts):
    lat0 = 11.942; k = 111320
    return [((lo - 108.436) * k * math.cos(math.radians(lat0)), -(la - lat0) * k) for la, lo in pts]

def rot(pts, a):
    c, s = math.cos(a), math.sin(a)
    return [(x * c - y * s, x * s + y * c) for x, y in pts]

def dp(pts, eps):
    if len(pts) < 3: return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dmax, idx = 0, 0
    for i in range(1, len(pts) - 1):
        x0, y0 = pts[i]
        num = abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1); den = math.hypot(x2 - x1, y2 - y1) or 1
        if num / den > dmax: dmax, idx = num / den, i
    if dmax > eps: return dp(pts[:idx + 1], eps)[:-1] + dp(pts[idx:], eps)
    return [pts[0], pts[-1]]

def seg_d(p, a, b):
    ax, ay = a; bx, by = b; px, py = p; dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / ((dx * dx + dy * dy) or 1)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)

def build(sid, spec):
    routes_m = [to_m(r) for r in spec['routes']]
    allp = [p for r in routes_m for p in r]
    best = None
    for deg in range(0, 180, 3):
        a = math.radians(deg); rp = rot(allp, a)
        xs = [p[0] for p in rp]; ys = [p[1] for p in rp]
        sw, sh = max(xs) - min(xs) or 1, max(ys) - min(ys) or 1
        scale = min((W - 2 * MARGIN) / sw, (H - 2 * MARGIN) / sh)
        if not best or scale > best[0]: best = (scale, a, min(xs), min(ys), sw, sh)
    scale, a, mx, my, sw, sh = best
    ox = (W - sw * scale) / 2; oy = (H - sh * scale) / 2
    def place(r):
        return [(round((x - mx) * scale + ox), round((y - my) * scale + oy)) for x, y in rot(r, a)]
    routes = [dp(place(r), 3.0) for r in routes_m]
    # Cửa vào ở phía trên: nếu điểm đầu tuyến 1 nằm dưới điểm cuối thì lật dọc
    if routes[0][0][1] > routes[0][-1][1]:
        routes = [[(x, H - y) for x, y in r] for r in routes]
    segs = [(r[i], r[i + 1]) for r in routes for i in range(len(r) - 1)]
    def dpath(p): return min(seg_d(p, a, b) for a, b in segs)
    cands = [(x, y) for x in range(30, W - 29, 12) for y in range(30, H - 29, 12) if 38 <= dpath((x, y)) <= 70]
    def cover(p): return sum(1 for a, b in segs for t in range(11) if math.hypot(p[0] - (a[0] + (b[0] - a[0]) * t / 10), p[1] - (a[1] + (b[1] - a[1]) * t / 10)) <= 110)
    cands.sort(key=lambda p: -cover(p))
    pads = []
    for p in cands:
        if all(math.hypot(p[0] - q[0], p[1] - q[1]) >= 62 for q in pads): pads.append(p)
        if len(pads) >= 11: break
    meters_per_unit = 1 / scale
    return {
        'id': sid, 'name': spec['name'],
        'paths': [[{'x': x, 'y': y} for x, y in r] for r in routes],
        'pads': [{'id': f'pad_{i + 1}', 'x': x, 'y': y} for i, (x, y) in enumerate(pads)],
        'metersPerUnit': round(meters_per_unit, 3),
        'routeLengthsM': [round(sum(math.hypot(r[i + 1][0] - r[i][0], r[i + 1][1] - r[i][1]) for i in range(len(r) - 1)) * meters_per_unit) for r in routes],
        'attribution': '© OpenStreetMap contributors (ODbL)',
    }

def preview(st, path):
    S = 2; im = Image.new('RGB', (W * S, H * S), (58, 42, 28)); d = ImageDraw.Draw(im)
    for r in st['paths']:
        d.line([(p['x'] * S, p['y'] * S) for p in r], fill=(214, 186, 140), width=26 * S // 2 * 2, joint='curve')
    for r in st['paths']:
        p0 = r[0]; d.ellipse([(p0['x'] - 12) * S, (p0['y'] - 12) * S, (p0['x'] + 12) * S, (p0['y'] + 12) * S], fill=(78, 168, 222))
    e = st['paths'][0][-1]; d.rectangle([(e['x'] - 16) * S, (e['y'] - 12) * S, (e['x'] + 16) * S, (e['y'] + 12) * S], fill=(232, 196, 104))
    for p in st['pads']:
        d.ellipse([(p['x'] - 16) * S, (p['y'] - 16) * S, (p['x'] + 16) * S, (p['y'] + 16) * S], outline=(255, 255, 255), width=3)
    im.save(path)

out = {}
for sid, spec in STREETS.items():
    st = build(sid, spec); out[sid] = st
    preview(st, os.path.join(ROOT, f'docs/research/streets/{sid}.png'))
    print(sid, 'tuyến (m):', st['routeLengthsM'], 'ô:', len(st['pads']), 'm/đơn vị:', st['metersPerUnit'], 'điểm:', [len(p) for p in st['paths']])
os.makedirs(os.path.join(ROOT, 'src/core/streets'), exist_ok=True)
json.dump(out, open(os.path.join(ROOT, 'src/core/streets/realStreets.generated.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
