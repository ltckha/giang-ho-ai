#!/usr/bin/env python3
"""
Bố cục PHÒNG TRONG TIỆM cho màn tiệm phố thật (Claude, 24/11/2026).
Màn tiệm chơi bên trong tiệm (như Phố Dốc), không phải ngoài đường.
Sinh 8 bố cục (4 mẫu × lật trái/phải): đường đi từ cửa tiệm (dưới) vòng qua phòng tới quầy (trên),
ô đặt món tự tính cách đường 38–70 đơn vị. Ghi src/core/streets/rooms.generated.json
"""
import json, math, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
W, H = 360, 520
T = {
    'zigzag': [[(180, 520), (180, 430), (64, 430), (64, 300), (296, 300), (296, 170), (64, 170), (64, 60), (180, 60)]],
    'chu_u': [[(60, 520), (60, 120), (180, 120), (180, 380), (300, 380), (300, 60)]],
    'xoan': [[(180, 520), (180, 450), (300, 450), (300, 90), (60, 90), (60, 330), (200, 330), (200, 210)]],
    'hai_cua': [[(70, 520), (70, 360), (180, 300), (180, 70)], [(290, 520), (290, 360), (180, 300), (180, 70)]],
}
def seg_d(p, a, b):
    ax, ay = a; bx, by = b; px, py = p; dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / ((dx * dx + dy * dy) or 1)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)
def pads_for(routes):
    segs = [(r[i], r[i + 1]) for r in routes for i in range(len(r) - 1)]
    dpath = lambda p: min(seg_d(p, a, b) for a, b in segs)
    cands = [(x, y) for x in range(30, W - 29, 10) for y in range(40, H - 39, 10) if 40 <= dpath((x, y)) <= 66]
    cover = lambda p: sum(1 for a, b in segs for t in range(11) if math.hypot(p[0] - (a[0] + (b[0] - a[0]) * t / 10), p[1] - (a[1] + (b[1] - a[1]) * t / 10)) <= 110)
    cands.sort(key=lambda p: -cover(p))
    pads = []
    for p in cands:
        if all(math.hypot(p[0] - q[0], p[1] - q[1]) >= 62 for q in pads):
            pads.append(p)
        if len(pads) >= 11:
            break
    return pads
out = []
for name, routes in T.items():
    for flip in (False, True):
        rr = [[(W - x, y) if flip else (x, y) for x, y in r] for r in routes]
        out.append({'id': f'{name}{"_lat" if flip else ""}',
                    'paths': [[{'x': x, 'y': y} for x, y in r] for r in rr],
                    'pads': [{'id': f'pad_{i + 1}', 'x': x, 'y': y} for i, (x, y) in enumerate(pads_for(rr))]})
json.dump(out, open(os.path.join(ROOT, 'src/core/streets/rooms.generated.json'), 'w'), indent=1)
print([(o['id'], len(o['pads'])) for o in out])
