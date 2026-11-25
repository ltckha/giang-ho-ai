#!/usr/bin/env python3
"""
Bố cục PHÒNG TRONG TIỆM cho màn tiệm phố thật (Claude, 24/11/2026).
Màn tiệm chơi bên trong tiệm (như Phố Dốc), không phải ngoài đường.
Sinh 10 bố cục (5 mẫu "trong quán" × lật trái/phải): đường đi từ cửa tiệm (dưới) vòng qua phòng tới quầy (trên),
ô đặt món tự tính cách đường 38–70 đơn vị. Ghi src/core/streets/rooms.generated.json
"""
import json, math, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
W, H = 360, 520
# Bố cục "TRONG QUÁN" (anh Kha 26/11: phòng Spark vẽ nguyên căn → xếp màn cho khớp):
# đường quái chỉ đi trên SÀN TRỐNG giữa quán (x 105–255), từ cửa (cạnh dưới) lên tới quầy (trên, y≈105);
# ô đặt món hai bên đường, kể cả dải bàn ghế / kệ sát tường (như đặt món lên bàn, lên kệ).
T = {
    'zigzag3': [[(180, 520), (180, 455), (250, 455), (250, 350), (110, 350), (110, 250), (250, 250), (250, 165), (180, 165), (180, 105)]],
    'zigzag2': [[(250, 520), (250, 405), (110, 405), (110, 245), (250, 245), (250, 160), (180, 160), (180, 105)]],
    'hai_cua': [[(115, 520), (115, 340), (180, 290), (180, 105)], [(245, 520), (245, 340), (180, 290), (180, 105)]],
    'bac_thang': [[(110, 520), (110, 410), (250, 410), (250, 290), (110, 290), (110, 175), (180, 175), (180, 105)]],
    'zigzag4': [[(180, 520), (180, 482), (110, 482), (110, 405), (250, 405), (250, 325), (110, 325), (110, 245), (250, 245), (250, 165), (180, 165), (180, 105)]],
}
def seg_d(p, a, b):
    ax, ay = a; bx, by = b; px, py = p; dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / ((dx * dx + dy * dy) or 1)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)
def pads_for(routes):
    segs = [(r[i], r[i + 1]) for r in routes for i in range(len(r) - 1)]
    dpath = lambda p: min(seg_d(p, a, b) for a, b in segs)
    cands = [(x, y) for x in range(30, W - 29, 10) for y in range(125, H - 30, 10) if 38 <= dpath((x, y)) <= 66]   # y ≥ 125: chừa quầy phía trên   # y ≥ 70: ô không đè dải tường trên (kiểm tra 26/11)
    cover = lambda p: sum(1 for a, b in segs for t in range(11) if math.hypot(p[0] - (a[0] + (b[0] - a[0]) * t / 10), p[1] - (a[1] + (b[1] - a[1]) * t / 10)) <= 110)
    cands.sort(key=lambda p: -cover(p))
    for gap in (62, 58, 54):          # đủ 11 ô; chật thì cho ô gần nhau hơn chút
        pads = []
        for p in cands:
            if all(math.hypot(p[0] - q[0], p[1] - q[1]) >= gap for q in pads):
                pads.append(p)
            if len(pads) >= 11:
                break
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
