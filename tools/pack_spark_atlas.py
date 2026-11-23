#!/usr/bin/env python3
"""Ghép hình Spark vẽ (art/spark/*.png) thành 1 tấm hình game: public/assets/spark_atlas.webp + .json.

Tên file nguồn:
  mon_<art>_b1.png, mon_<art>_b2.png, mon_<art>_b3a.png, mon_<art>_b3b.png  -> món (4 bậc)
  quai_<art>.png                                                           -> quái
Khung sinh ra (cùng kiểu tên với tấm hình chính của game):
  tower_art_<art>_<t1|t2|t3a|t3b>_f0..f2   (f1 nén, f2 giãn: dùng khi món đánh)
  enemy_art_<art>_f0..f3                   (lắc lư khi đi)
Thêm hình: bỏ file vào art/spark/ rồi chạy  python3 tools/import_spark.py <thư mục tải về>  hoặc chạy thẳng file này.
"""
import json, math, os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art', 'spark')
OUT = os.path.join(ROOT, 'public', 'assets')
CELL = 96
PAD = 2
TIER = {'b1': 't1', 'b2': 't2', 'b3a': 't3a', 'b3b': 't3b'}


def fit(im: Image.Image, box: int, sx: float = 1.0, sy: float = 1.0) -> Image.Image:
    im = im.crop(im.getbbox())
    scale = min(box / im.width, box / im.height)
    w, h = max(1, round(im.width * scale * sx)), max(1, round(im.height * scale * sy))
    im = im.resize((w, h), Image.LANCZOS)
    cell = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
    # đặt chân vật sát đáy khung (giống hình cũ: vật đứng trên ô)
    cell.alpha_composite(im, ((CELL - w) // 2, CELL - 4 - h))
    return cell


def main() -> int:
    frames: dict[str, Image.Image] = {}
    towers, enemies = {}, []
    for f in sorted(os.listdir(SRC)):
        if not f.endswith('.png'):
            continue
        im = Image.open(os.path.join(SRC, f)).convert('RGBA')
        m = re.fullmatch(r'mon_(.+)_(b1|b2|b3a|b3b)\.png', f)
        if m:
            art, b = m.group(1), m.group(2)
            towers.setdefault(art, set()).add(b)
            tk = TIER[b]
            frames[f'tower_art_{art}_{tk}_f0'] = fit(im, 86)
            frames[f'tower_art_{art}_{tk}_f1'] = fit(im, 86, 1.08, 0.9)
            frames[f'tower_art_{art}_{tk}_f2'] = fit(im, 86, 0.95, 1.06)
            continue
        m = re.fullmatch(r'quai_(.+)\.png', f)
        if m:
            art = m.group(1)
            enemies.append(art)
            for i, (sx, sy) in enumerate([(1, 1), (1.05, 0.93), (1, 1), (0.96, 1.05)]):
                frames[f'enemy_art_{art}_f{i}'] = fit(im, 80, sx, sy)
            continue
        print('bỏ qua (sai tên):', f)
    # món thiếu bậc: dùng bậc gần nhất để game không lỗi
    for art, have in towers.items():
        order = ['b1', 'b2', 'b3a', 'b3b']
        for b in order:
            if b in have:
                continue
            near = next(x for x in (order[order.index(b) - 1::-1] + order) if x in have)
            for i in range(3):
                frames[f'tower_art_{art}_{TIER[b]}_f{i}'] = frames[f'tower_art_{art}_{TIER[near]}_f{i}']
            print(f'thiếu {art} {b} -> tạm dùng {near}')
    names = sorted(frames)
    cols = max(1, math.ceil(math.sqrt(len(names))))
    rows = math.ceil(len(names) / cols)
    step = CELL + PAD
    sheet = Image.new('RGBA', (cols * step, rows * step), (0, 0, 0, 0))
    meta = {}
    for i, n in enumerate(names):
        x, y = (i % cols) * step, (i // cols) * step
        sheet.alpha_composite(frames[n], (x, y))
        meta[n] = {'frame': {'x': x, 'y': y, 'w': CELL, 'h': CELL}, 'rotated': False, 'trimmed': False,
                   'spriteSourceSize': {'x': 0, 'y': 0, 'w': CELL, 'h': CELL}, 'sourceSize': {'w': CELL, 'h': CELL}}
    sheet.save(os.path.join(OUT, 'spark_atlas.webp'), 'WEBP', quality=90, method=6)
    with open(os.path.join(OUT, 'spark_atlas.json'), 'w') as fh:
        json.dump({'frames': meta, 'meta': {'image': 'spark_atlas.webp', 'size': {'w': sheet.width, 'h': sheet.height}, 'scale': '1',
                   'arts': {'towers': sorted(towers), 'enemies': sorted(enemies)}}}, fh, ensure_ascii=False)
    print(f'{len(towers)} món, {len(enemies)} quái, {len(names)} khung, {sheet.width}x{sheet.height}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
