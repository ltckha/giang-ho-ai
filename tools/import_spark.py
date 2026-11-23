#!/usr/bin/env python3
"""Nhận hình Spark tải từ Drive: cắt nền thừa, thu về tối đa 192 điểm ảnh, lưu art/spark/, rồi ghép lại tấm hình game.
Dùng: python3 tools/import_spark.py <thư mục chứa mon_*.png / quai_*.png>
"""
import os, re, subprocess, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST = os.path.join(ROOT, 'art', 'spark')

def main(src: str) -> int:
    os.makedirs(DST, exist_ok=True)
    n = 0
    for f in sorted(os.listdir(src)):
        if not re.fullmatch(r'(mon_.+_(b1|b2|b3a|b3b)|quai_.+|xe_.+|mat_tien_.+|facade_.+|deco_.+)\.png', f):
            continue
        im = Image.open(os.path.join(src, f)).convert('RGBA')
        if im.getpixel((1, 1))[3] != 0:
            # nền trắng trơn -> xoá nền (chỉ điểm gần trắng nối với viền)
            from PIL import ImageDraw
            for corner in [(0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)]:
                ImageDraw.floodfill(im, corner, (0, 0, 0, 0), thresh=24)
        im = im.crop(im.getbbox())
        im.thumbnail((256, 256) if f.startswith(('mat_tien_', 'facade_', 'deco_')) else (192, 192), Image.LANCZOS)
        im.save(os.path.join(DST, f), optimize=True)
        n += 1
    print(f'nhận {n} hình')
    rc = subprocess.call([sys.executable, os.path.join(ROOT, 'tools', 'pack_spark_atlas.py')])
    return rc or subprocess.call([sys.executable, os.path.join(ROOT, 'tools', 'pack_facades.py')])

if __name__ == '__main__':
    sys.exit(main(sys.argv[1]))
