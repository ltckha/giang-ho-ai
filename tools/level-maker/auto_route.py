#!/usr/bin/env python3
"""
Tự dựng tuyến đường đi cho 1 phố bất kỳ từ dữ liệu OpenStreetMap (Claude, 23/11/2026).

Đầu vào: file JSON dạng Overpass (`[out:json]` ... `out geom;`) — các đoạn đường (way) mang tên phố cần làm.
  Lấy bằng công cụ đọc web (shell không vào được overpass-api.de), truy vấn mẫu:
    [out:json][timeout:60];
    area["name"="<Thành phố>"]["boundary"="administrative"]->.a;
    way["highway"]["name"~"^(<Tên phố 1>|<Tên phố 2>)$"](area.a);
    out geom;
  Không có area thì thay (area.a) bằng khung toạ độ (nam,tây,bắc,đông).

Cách làm:
  1. Nối mọi đoạn thành đồ thị (điểm trùng nhau = nối).
  2. Lối ra = đầu xa nhất của phố chính (--main, mặc định phố đầu tiên).
  3. Lối vào = các đầu cụt khác, lấy tối đa 2 lối có đường đi tới lối ra dài nhất và ít trùng nhau.
  4. Ghi content/streets/geometry/<id>.json → tools/osm_street_to_stage.py đọc và ra đường đi + ô đặt món.

Chạy: python3 tools/level-maker/auto_route.py <overpass.json> <id> "<Tên hiển thị>" [--main "<Tên phố chính>"]
"""
import heapq, json, math, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def load_ways(path):
    d = json.load(open(path, encoding='utf-8'))
    ways = []
    if 'elements' in d:
        for e in d['elements']:
            if e.get('type') == 'way' and e.get('geometry'):
                ways.append((e.get('tags', {}).get('name', ''), [(g['lat'], g['lon']) for g in e['geometry']]))
    elif 'ways' in d:  # dạng cũ {ways: {ten_id: [[lat, lon], ...]}}
        for k, pts in d['ways'].items():
            ways.append((k.rsplit('_', 1)[0], [tuple(p) for p in pts]))
    return ways


def dist_m(a, b):
    k = 111320
    return math.hypot((a[1] - b[1]) * k * math.cos(math.radians(a[0])), (a[0] - b[0]) * k)


def key(p):
    return (round(p[0], 6), round(p[1], 6))


def build_graph(ways):
    adj, owner = {}, {}
    for name, pts in ways:
        for i in range(len(pts) - 1):
            a, b = key(pts[i]), key(pts[i + 1])
            w = dist_m(a, b)
            adj.setdefault(a, {})[b] = w
            adj.setdefault(b, {})[a] = w
            owner.setdefault(a, set()).add(name); owner.setdefault(b, set()).add(name)
    return adj, owner


def dijkstra(adj, src):
    d, prev, pq = {src: 0.0}, {}, [(0.0, src)]
    while pq:
        du, u = heapq.heappop(pq)
        if du > d[u]:
            continue
        for v, w in adj[u].items():
            nd = du + w
            if nd < d.get(v, 1e18):
                d[v], prev[v] = nd, u
                heapq.heappush(pq, (nd, v))
    return d, prev


def path_to(prev, src, dst):
    out = [dst]
    while out[-1] != src:
        out.append(prev[out[-1]])
    return out[::-1]


def main():
    args = sys.argv[1:]
    if len(args) < 3:
        print(__doc__); sys.exit(1)
    src_file, sid, display = args[0], args[1], args[2]
    main_name = args[args.index('--main') + 1] if '--main' in args else None
    ways = load_ways(src_file)
    if not ways:
        sys.exit('Không có đoạn đường nào trong file — kiểm tra lại truy vấn / tên phố')
    main_name = main_name or ways[0][0]
    adj, owner = build_graph(ways)
    leaves = [n for n, nb in adj.items() if len(nb) == 1]
    main_leaves = [n for n in leaves if any(main_name.lower() in o.lower() for o in owner[n])]
    if not main_leaves:
        sys.exit(f'Không thấy đầu cụt nào của phố chính "{main_name}" (phố có thể là vòng kín)')
    # lối ra: đầu của phố chính xa trung tâm các đầu cụt khác nhất (đường đi dài nhất)
    best = None
    for exit_n in main_leaves:
        d, prev = dijkstra(adj, exit_n)
        cands = sorted([(d[n], n) for n in leaves if n != exit_n and n in d], reverse=True)
        if cands and (best is None or cands[0][0] > best[0]):
            best = (cands[0][0], exit_n, d, prev, cands)
    if best is None:
        sys.exit('Các đoạn đường không nối được với nhau — cần thêm phố nối vào truy vấn')
    _, exit_n, d, prev, cands = best
    routes = []
    for length, ent in cands:
        if length < 150:  # tuyến ngắn hơn 150 m: bỏ
            break
        p = path_to(prev, exit_n, ent)[::-1]  # từ lối vào → lối ra
        if routes:
            # lối vào thứ 2 phải có đoạn riêng (chưa trùng tuyến 1) dài ít nhất 40 m (lối rẽ vào)
            used = set(routes[0])
            own = sum(dist_m(p[i], p[i + 1]) for i in range(len(p) - 1) if not (p[i] in used and p[i + 1] in used))
            if own < 40:
                continue
        routes.append(p)
        if len(routes) == 2:
            break
    if not routes:
        sys.exit('Phố quá ngắn (dưới 150 m) để làm màn')
    out = {
        'id': sid, 'name': display, 'source': os.path.relpath(src_file, ROOT),
        'routes': [[list(n) for n in r] for r in routes],
        'routeLengthsM': [round(sum(dist_m(r[i], r[i + 1]) for i in range(len(r) - 1))) for r in routes],
    }
    os.makedirs(os.path.join(ROOT, 'content/streets/geometry'), exist_ok=True)
    json.dump(out, open(os.path.join(ROOT, 'content/streets/geometry', f'{sid}.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    print(f'{sid}: {len(routes)} lối vào, dài {out["routeLengthsM"]} m → content/streets/geometry/{sid}.json')


if __name__ == '__main__':
    main()
