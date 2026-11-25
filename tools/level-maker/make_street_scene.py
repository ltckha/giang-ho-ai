#!/usr/bin/env python3
"""
Nền MÀN PHỐ (đánh trùm) đồng bộ nét Spark cho mọi phố thật (Claude, 24/11/2026).
- Nền cỏ / đất đỏ Đà Lạt (ô Spark ghép liền), vỉa hè gạch dọc 2 bên đường, mặt đường nhựa + vạch giữa.
- Hai bên đường: mặt tiền CHÍNH các tiệm của phố đó (mat_tien_*, Spark vẽ) — người chơi thấy lại tiệm vừa giữ.
- Chỗ trống còn lại: đèn đường, cột điện, ghế đá, trạm xe buýt, xe đẩy, xe máy đỗ, bồn hoa, cây thông / mai anh đào.
- Tránh đường đi và ô đặt món. Lối vào lát đá cuội.
Đọc src/core/streets/generated/<phố>.json → public/assets/map_<phố>.webp (720×1040 = 2× khung 360×520).
Chạy: python3 tools/level-maker/make_street_scene.py [street_<id> ...]
"""
import glob, json, math, os, random, sys
from PIL import Image, ImageDraw, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S, W, H = 2, 360, 520
INK = (43, 26, 18)
SP = os.path.join(ROOT, 'art', 'spark')
TILES = os.path.join(ROOT, 'art', 'duong_pho')

ROAD_W, WALK_W = 40, 64      # bề rộng mặt đường / vỉa hè (đơn vị khung 360×520)
PROPS_SMALL = ['den_duong', 'cot_dien', 'ghe_da', 'thung_rac', 'bon_hoa', 'xe_may_do', 'hang_rao_sat', 'gio_hoa']
PROPS_BIG = ['tram_xe_buyt', 'xe_day_hang_rong', 'cay_thong', 'cay_mai_anh_dao', 'cay_thong']


def seg_d(p, a, b):
    ax, ay = a; bx, by = b; px, py = p; dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / ((dx * dx + dy * dy) or 1)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)


def sprite(path, px):
    if not os.path.exists(path):
        return None
    im = Image.open(path).convert('RGBA')
    im = im.crop(im.getbbox())
    im.thumbnail((px, px), Image.LANCZOS)
    return im


def tiled(name, size, tile_px=150, darken=1.0):
    t = Image.open(os.path.join(TILES, f'{name}.png')).convert('RGB').resize((tile_px, tile_px), Image.LANCZOS)
    if darken != 1.0:
        t = ImageEnhance.Brightness(t).enhance(darken)
    out = Image.new('RGB', size)
    for y in range(0, size[1], tile_px):
        for x in range(0, size[0], tile_px):
            out.paste(t, (x, y))
    return out


def stroke_mask(paths, width):
    m = Image.new('L', (W * S, H * S), 0)
    d = ImageDraw.Draw(m)
    for r in paths:
        pts = [(x * S, y * S) for x, y in r]
        d.line(pts, fill=255, width=width * S, joint='curve')
        for x, y in pts:
            d.ellipse([x - width * S / 2, y - width * S / 2, x + width * S / 2, y + width * S / 2], fill=255)
    return m


def box_d(box, pt):
    x0, y0, x1, y1 = box
    return math.hypot(max(x0 - pt[0], 0, pt[0] - x1), max(y0 - pt[1], 0, pt[1] - y1))


def dense(r, step=8):
    out = []
    for (ax, ay), (bx, by) in zip(r, r[1:]):
        n = max(1, int(math.hypot(bx - ax, by - ay) / step))
        out += [(ax + (bx - ax) * i / n, ay + (by - ay) * i / n) for i in range(n)]
    return out + [r[-1]]


def draw(g, out):
    st = g['stage']
    rnd = random.Random(st['id'])
    paths = [[(p['x'], p['y']) for p in r] for r in st['paths']]
    pads = [(p['x'], p['y']) for p in st['pads']]
    segs = [(r[i], r[i + 1]) for r in paths for i in range(len(r) - 1)]
    size = (W * S, H * S)

    # 1. nền: cỏ ven đường pha đất đỏ thành mảng
    im = ImageEnhance.Color(tiled('nen_co_ven_duong', size, 160, darken=0.92)).enhance(0.72)   # dịu bớt cho hợp tông ấm
    dirt = tiled('nen_dat_do', size)
    blot = Image.new('L', size, 0)
    bd = ImageDraw.Draw(blot)
    for _ in range(7):
        cx, cy, r = rnd.uniform(0, W * S), rnd.uniform(0, H * S), rnd.uniform(60, 130)
        bd.ellipse([cx - r, cy - r * 0.7, cx + r, cy + r * 0.7], fill=150)
    im.paste(dirt, (0, 0), blot)

    # 2. vỉa hè gạch + viền, 3. mặt đường nhựa (tối lại cho ra màu nhựa) + viền + vạch giữa
    walk = stroke_mask(paths, WALK_W)
    edge = stroke_mask(paths, WALK_W + 4)
    im.paste(Image.new('RGB', size, (120, 86, 60)), (0, 0), edge)
    im.paste(tiled('nen_via_he_gach', size, 110), (0, 0), walk)
    curb = stroke_mask(paths, ROAD_W + 4)
    im.paste(Image.new('RGB', size, (200, 196, 186)), (0, 0), curb)
    road = stroke_mask(paths, ROAD_W)
    im.paste(tiled('nen_duong_nhua', size, 150, darken=0.62), (0, 0), road)
    d = ImageDraw.Draw(im)
    for r in paths:
        for (ax, ay), (bx, by) in zip(r, r[1:]):
            L = math.hypot(bx - ax, by - ay)
            n = int(L // 14)
            for k in range(n):
                if k % 2:
                    continue
                t0, t1 = k / max(n, 1), min(1, (k + 0.6) / max(n, 1))
                d.line([((ax + (bx - ax) * t0) * S, (ay + (by - ay) * t0) * S), ((ax + (bx - ax) * t1) * S, (ay + (by - ay) * t1) * S)],
                       fill=(250, 236, 190), width=3)

    # 4. lối vào lát đá cuội
    cobble = tiled('nen_da_cuoi', size, 90)
    # lát đá cả lối vào lẫn điểm cuối (nơi quái muốn tới) — kiểm tra thực tế 24/11: cuối đường không có dấu gì
    for r in paths + [[pp[-1]] for pp in paths]:
        sx, sy = min(max(r[0][0], 0), W), min(max(r[0][1], 0), H)
        m = Image.new('L', size, 0)
        ImageDraw.Draw(m).ellipse([(sx - 34) * S, (sy - 30) * S, (sx + 34) * S, (sy + 30) * S], fill=255)
        im.paste(cobble, (0, 0), m)

    # 4b. đế đá dưới mỗi ô đặt món: trước đây chỉ có vòng trắng mảnh trên cỏ, khó thấy (kiểm tra thực tế 24/11)
    for px_, py_ in pads:
        R = 21 * S
        d.ellipse([px_ * S - R - 3, py_ * S - R * 0.86 + 6, px_ * S + R + 3, py_ * S + R * 0.86 + 10], fill=(70, 56, 44))
        d.ellipse([px_ * S - R, py_ * S - R * 0.86, px_ * S + R, py_ * S + R * 0.86], fill=(176, 160, 136), outline=INK, width=4)
        d.ellipse([px_ * S - R + 7, py_ * S - R * 0.86 + 6, px_ * S + R - 7, py_ * S + R * 0.86 - 6], outline=(214, 200, 176), width=3)

    # 5. chỗ trống: không đè đường, ô đặt món, điểm cuối (trùm vào)
    ex, ey = paths[0][-1]
    taken = []

    def free(x, y, need_road, rad):
        if x < 22 or x > W - 22 or y < 34 or y > H - 18:
            return False
        dd = min(seg_d((x, y), a, b) for a, b in segs)
        if dd < WALK_W / 2 + rad * 0.35:
            return False
        if need_road and dd > WALK_W / 2 + rad + 16:
            return False
        # hình vẽ nhô lên trên điểm đặt (~2×rad): né ô theo tâm thân hình, không chỉ chân hình
        if any(math.hypot(x - px, (y - rad * 0.9) - py) < 24 + rad * 0.95 for px, py in pads):
            return False
        if any(math.hypot(x - px, y - py) < 26 for px, py in pads):
            return False
        if any(math.hypot(x - qx, y - qy) < (rad + qr) * 0.62 for qx, qy, qr in taken):
            return False
        return math.hypot(x - ex, y - ey) > 40

    road_pts = [pt for r in paths for pt in dense(r)]

    def box_ok(x, y, img):
        # Cả khung hình (nhà cao nhô lên trên) không được đè mặt đường / ô đặt món
        # — kiểm tra thực tế 24/11: nhà che đường, quái đi khuất sau nhà.
        hw, hh = img.width / S / 2, img.height / S
        box = (x - hw * 0.8, y - hh * 0.9, x + hw * 0.8, y + hh * 0.1)
        if any(box_d(box, pt) < ROAD_W / 2 + 2 for pt in road_pts):
            return False
        return all(box_d(box, pd) >= 22 for pd in pads)

    items = []
    # mặt tiền các tiệm của phố (sát vỉa hè)
    for sh in g.get('shops', []):
        key = sh['stage'].get('facadeKey')
        img = sprite(os.path.join(SP, f'{key}.png'), 80 * S) if key else None
        if img is None:
            continue
        for _ in range(500):
            x, y = rnd.uniform(26, W - 26), rnd.uniform(40, H - 30)
            if free(x, y, True, 40) and box_ok(x, y, img):
                taken.append((x, y, 40))
                items.append((y, x, img))
                break
    # đồ đường phố
    # vòng 2 cây / xe đẩy để lấp mảng cỏ trống xa đường (kiểm tra thực tế 24/11: nửa bản đồ trống trơn)
    for name, px, need, tries in [(n, 52, False, 3) for n in PROPS_BIG] * 2 + [(n, 34, True, 2) for n in PROPS_SMALL] * 2 + [(n, 44, False, 2) for n in PROPS_BIG]:
        img = sprite(os.path.join(SP, f'deco_{name}.png'), px * S)
        if img is None:
            continue
        for _ in range(300):
            x, y = rnd.uniform(20, W - 20), rnd.uniform(36, H - 20)
            if free(x, y, need, px / 2) and box_ok(x, y, img):
                taken.append((x, y, px / 2))
                items.append((y, x, img))
                break

    # vẽ từ xa tới gần (y nhỏ trước) + bóng đổ nhẹ
    shadow = Image.new('RGBA', size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    for y, x, img in items:
        w = img.width * 0.42
        sd.ellipse([x * S - w, y * S - 6, x * S + w, y * S + 8], fill=(30, 20, 10, 70))
    im = Image.alpha_composite(im.convert('RGBA'), shadow)
    for y, x, img in sorted(items):
        im.paste(img, (int(x * S - img.width / 2), int(y * S - img.height * 0.9)), img)

    # 6. ghi nguồn bản đồ
    d = ImageDraw.Draw(im)
    if st.get('_no_osm'):      # phố tưởng tượng (Trùm Phố Dốc): không ghi nguồn bản đồ
        im.convert('RGB').save(out, 'WEBP', quality=84, method=6)
        return len(items)
    txt = '© OpenStreetMap contributors'
    # ghi nguồn ở góc dưới không vướng đầu/cuối đường
    ends = [r[0] for r in paths] + [r[-1] for r in paths]
    right_busy = any(x > W - 140 and y > H - 60 for x, y in ends)
    x0 = 6 if right_busy else W * S - 250
    d.rounded_rectangle([x0, H * S - 26, x0 + 244, H * S - 4], 8, fill=(20, 14, 10, 170))
    d.text((x0 + 8, H * S - 22), txt, fill=(240, 230, 210))
    im.convert('RGB').save(out, 'WEBP', quality=84, method=6)
    return len(items)


def main():
    want = [a for a in sys.argv[1:] if a.startswith('street_')]
    # Trùm Phố Dốc (stage_4): cùng cách vẽ, mặt tiền 3 tiệm Phố Dốc — kiểm tra thực tế 24/11: ô đặt món nằm trên mái sạp
    if not want or 'stage_4' in sys.argv[1:]:
        st = json.load(open(os.path.join(ROOT, 'content/scenes/stage_4.json'), encoding='utf-8'))
        st['_no_osm'] = True
        g = {'stage': st, 'shops': [{'stage': {'facadeKey': k}} for k in ('mat_tien_doc_giay', 'mat_tien_doc_banh', 'mat_tien_doc_hoa')]}
        n = draw(g, os.path.join(ROOT, 'public/assets/map_trum_pho.webp'))
        print(f'stage_4: {n} món trang trí')
        if 'stage_4' in sys.argv[1:] and not want:
            return
    for f in sorted(glob.glob(os.path.join(ROOT, 'src/core/streets/generated/*.json'))):
        g = json.load(open(f, encoding='utf-8'))
        sid = g['stage']['id']
        if want and sid not in want:
            continue
        n = draw(g, os.path.join(ROOT, 'public/assets', f'map_{sid}.webp'))
        print(f'{sid}: {n} món trang trí')


if __name__ == '__main__':
    main()
