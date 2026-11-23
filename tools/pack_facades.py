#!/usr/bin/env python3
"""Ghép mặt tiền tiệm Spark vẽ (art/spark/mat_tien_*.png) → public/assets/facade_atlas.webp + .json (khung mat_tien_<key>, 160×160)."""
import json, math, os
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art', 'spark'); OUT = os.path.join(ROOT, 'public', 'assets'); C = 160
files = sorted(f for f in os.listdir(SRC) if (f.startswith('mat_tien_') or f.startswith('facade_')) and f.endswith('.png'))
cols = max(1, math.ceil(math.sqrt(len(files)))); rows = max(1, math.ceil(len(files) / cols))
sheet = Image.new('RGBA', (cols * C, rows * C), (0, 0, 0, 0)); frames = {}
for i, f in enumerate(files):
    im = Image.open(os.path.join(SRC, f)).convert('RGBA'); im = im.crop(im.getbbox()); im.thumbnail((C - 4, C - 4), Image.LANCZOS)
    x, y = (i % cols) * C, (i // cols) * C
    sheet.alpha_composite(im, (x + (C - im.width) // 2, y + C - 2 - im.height))
    frames[f[:-4]] = {'frame': {'x': x, 'y': y, 'w': C, 'h': C}, 'rotated': False, 'trimmed': False,
                      'spriteSourceSize': {'x': 0, 'y': 0, 'w': C, 'h': C}, 'sourceSize': {'w': C, 'h': C}}
sheet.save(os.path.join(OUT, 'facade_atlas.webp'), 'WEBP', quality=86, method=6)
json.dump({'frames': frames, 'meta': {'image': 'facade_atlas.webp', 'size': {'w': sheet.width, 'h': sheet.height}, 'scale': '1'}}, open(os.path.join(OUT, 'facade_atlas.json'), 'w'))
print(len(files), 'mặt tiền')
