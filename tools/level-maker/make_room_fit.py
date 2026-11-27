#!/usr/bin/env python3
"""
Xếp đường đi + chỗ đặt món KHỚP TỪNG PHÒNG Spark vẽ theo khuôn (anh Kha 26/11: "đường đi và chỗ đặt món
bị đè lên ảnh Spark vẽ tiệm" → Spark vẽ lại phòng theo khuôn: sàn giữa trống 2/3 bề ngang, đợt 41–43).

Cách làm: dò sàn trống trong ảnh (màu sàn lan từ giữa phòng, chỉ trong khuôn giữa 2 dải đồ sát tường, dưới quầy)
→ hình chữ nhật sàn lớn nhất → đường chữ chi từ cửa (dưới) lên quầy (trên) → chỗ đặt món chỉ trên sàn, cách đường 44–90.
Mỗi phòng ra vài bố cục; các tiệm dùng chung 1 phòng trong cùng phố lấy bố cục khác nhau.

Ra: src/core/streets/roomFit.generated.json  {stageId: {room, paths, pads}} — make-street.ts dùng thay bố cục chung.
Chạy: python3 tools/level-maker/make_room_fit.py [--xem <ảnh.png>]   (rồi npm run make:street, make_room_map.py)
Chỉ phòng có trong art/phong_khuon mới xếp theo kiểu này; phòng cũ giữ bố cục chung (rooms.generated.json).
"""
import glob, json, math, os, re, sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_room_map as RM  # noqa: E402

W, H = 360, 520
PAD_R = 20          # bán kính ô đặt món (đơn vị màn)
# Phòng máy dò sàn sai (sàn quá nhạt / nhiều màu): khung sàn chỉnh tay (x0, y0, x1, y1)
FLOOR_FIX = {
    'phong_kem_che': (64, 150, 296, 478),
    'phong_sua_nong': (68, 128, 292, 438),
    'phong_khach_san_phap': (68, 162, 292, 486),
    'phong_hostel': (106, 132, 266, 452),   # giường tầng màu gần giống sàn gỗ
    'phong_lau': (78, 140, 272, 470),
    'phong_tiem_toc': (92, 135, 268, 458),  # ghế cắt tóc đặt lấn vào giữa sàn       # bàn lẩu + khách sát tường phải lấn vào sàn
}


def _flood(ok, seed):
    m = np.zeros(ok.shape, bool)
    q = deque([seed])
    while q:
        y, x = q.popleft()
        if 0 <= y < H and 0 <= x < W and ok[y, x] and not m[y, x]:
            m[y, x] = True
            q.extend([(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)])
    return m


def _close(m):
    mi = Image.fromarray((m * 255).astype('uint8')).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(9))
    return np.asarray(mi) > 128


def _ok_for(b, c, mad):
    return np.abs(b - c).sum(axis=2) < max(36, 3.0 * mad + 18)


def mask_single(b):
    """Sàn 1 màu: lan từ giữa phòng"""
    p = b[int(H * .55):int(H * .75), int(W * .4):int(W * .6)].reshape(-1, 3)
    c = np.median(p, axis=0)
    return _close(_flood(_ok_for(b, c, np.median(np.abs(p - c).sum(axis=1))), (int(H * .65), W // 2)))


def mask_multi(b):
    """Sàn nhiều mảng (thảm gỗ + gạch): gieo hạt khắp giữa khuôn, giữ mảng lớn (đồ đạc là mảng nhỏ)"""
    U = np.zeros((H, W), bool)
    for sy in range(int(H * .35), int(H * .92), 26):
        for sx in range(int(W * .25), int(W * .76), 26):
            if U[sy, sx]:
                continue
            p = b[max(0, sy - 8):sy + 8, max(0, sx - 8):sx + 8].reshape(-1, 3)
            c = np.median(p, axis=0)
            m = _flood(_ok_for(b, c, np.median(np.abs(p - c).sum(axis=1))), (sy, sx))
            if m.sum() > 0.04 * W * H:
                U |= m
    return _close(U)


def clamp(m):
    """Chỉ giữ sàn trong khuôn: giữa 2 dải đồ sát tường (mỗi dải ~1/6 bề ngang), dưới quầy"""
    m = m.copy()
    m[:, :int(W / 6) + 4] = False          # khuôn: dãy đồ sát tường rộng 1/6 → sàn bắt đầu từ đó (soát 26/11: +14 bị lấn kệ, ghế)
    m[:, int(W * 5 / 6) - 4:] = False
    m[:int(H * 0.17), :] = False
    return m


def largest_rect(m):
    best = (0, None)
    hgt = np.zeros(W, int)
    for y in range(H):
        hgt = np.where(m[y], hgt + 1, 0)
        st = []
        for x in range(W + 1):
            h = hgt[x] if x < W else 0
            s = x
            while st and st[-1][1] >= h:
                s, hh = st.pop()
                if hh * (x - s) > best[0]:
                    best = (hh * (x - s), (s, y - hh + 1, x - 1, y))
            st.append((s, h))
    return best[1]


def floors(png, room):
    """Các ứng viên (mặt nạ sàn, khung sàn) của 1 phòng"""
    if room in FLOOR_FIX:
        x0, y0, x1, y1 = FLOOR_FIX[room]
        m = np.zeros((H, W), bool)
        m[y0:y1 + 1, x0:x1 + 1] = True
        return [(m, FLOOR_FIX[room])]
    b = np.asarray(Image.open(png).convert('RGB').resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(6))).astype(float)
    out = []
    for fn in (mask_single, mask_multi):
        m = clamp(fn(b))
        r = largest_rect(m)
        if r is not None and (r[2] - r[0]) * (r[3] - r[1]) > 0.12 * W * H:
            out.append((m, tuple(int(v) for v in r)))
    return out


def seg_d(p, a, b):
    ax, ay = a; bx, by = b; px, py = p; dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / ((dx * dx + dy * dy) or 1)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)


def make(rect, m, flip, step):
    """Đường chữ chi trong khung sàn: vào từ cửa (giữa cạnh dưới), các nhánh ngang cách nhau `step`, ra ở quầy"""
    x0, y0, x1, y1 = rect
    L, R = x0 + 24, x1 - 24
    top, bot = y0 + 24, y1
    a, b = (L, R) if flip else (R, L)
    cx = (x0 + x1) // 2
    n = max(2, int((bot - 40 - top) // step))
    st = (bot - 40 - top) / n
    P = [(cx, H), (cx, bot - 40), (a, bot - 40)]
    y = bot - 40
    side = 0
    xs = (a, b)
    for _ in range(n):
        y -= st
        P.append((xs[side], y))
        side ^= 1
        P.append((xs[side], y))
    P += [(cx, y), (cx, y0 - 2)]
    Q = [P[0]] + [p for i, p in enumerate(P[1:], 1) if p != P[i - 1]]
    P = [(int(round(x)), int(round(y))) for x, y in Q]
    segs = list(zip(P, P[1:]))
    er = np.asarray(Image.fromarray((m * 255).astype('uint8')).filter(ImageFilter.MinFilter(2 * PAD_R + 1))) > 128
    dp = lambda p: min(seg_d(p, s0, s1) for s0, s1 in segs)
    cands = [(x, yy) for yy in range(y0 + PAD_R, y1 - 10, 5) for x in range(x0 + PAD_R, x1 - PAD_R + 1, 5)
             if er[yy, x] and 44 <= dp((x, yy)) <= 90]
    cover = lambda p: sum(1 for s0, s1 in segs for t in range(11)
                          if math.hypot(p[0] - (s0[0] + (s1[0] - s0[0]) * t / 10), p[1] - (s0[1] + (s1[1] - s0[1]) * t / 10)) <= 110)
    cands.sort(key=lambda p: (-cover(p), p[1], p[0]))
    pads = []
    for gap in (52, 48, 46):
        pads = []
        for p in cands:
            if all(math.hypot(p[0] - q[0], p[1] - q[1]) >= gap for q in pads):
                pads.append(p)
            if len(pads) >= 11:
                break
        if len(pads) >= 9:
            break
    return P, pads


def layouts_for(png, room):
    """Các bố cục tốt nhất của 1 phòng (khác nhau), tốt nhất trước"""
    res = []
    for m, rect in floors(png, room):
        for step in (84, 90, 96, 104):
            for flip in (False, True):
                P, pads = make(rect, m, flip, step)
                L = sum(math.hypot(a[0] - b[0], a[1] - b[1]) for a, b in zip(P, P[1:]))
                res.append((len(pads) * 100 + L * 0.1, P, pads, flip))
    res.sort(key=lambda t: -t[0])
    # phòng hẹp (sàn < 2/3 bề ngang) không đủ 7 chỗ: nhận bố cục ít chỗ hơn (máy cân độ khó bù lại)
    need = 7 if any(len(t[2]) >= 7 for t in res) else 5
    out, seen = [], set()
    for sc, P, pads, flip in res:
        key = tuple(P)
        if key in seen or len(pads) < need:
            continue
        seen.add(key)
        out.append({'paths': [[{'x': x, 'y': y} for x, y in P]],
                    'pads': [{'id': f'pad_{i + 1}', 'x': x, 'y': y} for i, (x, y) in enumerate(pads)]})
    return out


def main():
    cache = {}
    result = {}
    for f in sorted(glob.glob(os.path.join(ROOT, 'content/streets/*.json'))):
        spec = json.load(open(f, encoding='utf-8'))
        used = {}
        for i, p in enumerate(spec.get('places', [])):
            sid = f"{spec['id']}_t{i + 1}"
            png = RM.full_room_of({'id': sid, 'name': p['name']})
            if not png or os.sep + 'phong_khuon' + os.sep not in png:
                continue
            room = os.path.basename(png)[:-4]
            if room not in cache:
                cache[room] = layouts_for(png, room)
            ls = cache[room]
            if not ls:
                print('⚠ không xếp được', room)
                continue
            k = used.get(room, 0)
            used[room] = k + 1
            lay = ls[k % len(ls)]
            result[sid] = {'room': room, **lay}
    out = os.path.join(ROOT, 'src/core/streets/roomFit.generated.json')
    json.dump(result, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('xếp theo phòng:', len(result), 'tiệm ·', {r: len(v[0]['pads']) if v else 0 for r, v in cache.items()})


if __name__ == '__main__':
    main()
