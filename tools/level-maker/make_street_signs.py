#!/usr/bin/env python3
"""
Bảng tên phố trên bản đồ (anh Kha 25/11: "đưa tên vô cái bảng cho đàng hoàng"):
khắc sẵn tên đường lên tấm ván (hình Spark bd_bang_pho), ván tự dài theo tên, cọc ở giữa.
Ra: public/assets/ui/bang_<id>.webp. Tên lấy từ STREET_INFO.road (src/core/cities.ts) — thêm phố thì thêm vào NAMES.
Chạy: python3 tools/level-maker/make_street_signs.py
"""
import json, os, re, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
src = open(os.path.join(ROOT, 'src/core/cities.ts'), encoding='utf-8').read()
NAMES = {k: v for k, v in re.findall(r"^\s+(\w+): \{ road: '([^']+)'", src, re.M)}
# Bản tiếng Anh: `python3 tools/level-maker/make_street_signs.py en` → bang_<id>_en.webp cho tên được dịch khác
# (tên đường thật giữ nguyên nên không cần bảng riêng) + src/core/streets/signsEn.json
EN = len(sys.argv) > 1 and sys.argv[1] == 'en'
if EN:
    dict_en = json.load(open(os.path.join(ROOT, 'src/i18n/en.json'), encoding='utf-8'))
    NAMES = {k: dict_en[v] for k, v in NAMES.items() if dict_en.get(v, v) != v}
    json.dump(sorted(NAMES), open(os.path.join(ROOT, 'src/core/streets/signsEn.json'), 'w'), indent=1)
art = Image.open(os.path.join(ROOT, 'art/ban_do/bd_bang_pho.png')).convert('RGBA')
art = art.crop(art.getbbox())                      # 310×480
plank = art.crop((0, 58, 310, 162))                # tấm ván trên (có đầu nhọn bên phải)
post = art.crop((126, 400, 186, 480))              # cọc ngắn: tấm ván chiếm phần lớn bảng, chữ to
L, R = 46, 64                                      # đầu trái / phải giữ nguyên, khúc giữa kéo dài
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf', 40)
os.makedirs(os.path.join(ROOT, 'public/assets/ui'), exist_ok=True)
for key, name in NAMES.items():
    tmp = ImageDraw.Draw(Image.new('RGBA', (10, 10)))
    tw = int(tmp.textlength(name, font=font))
    W = max(240, tw + L + R + 20)
    mid = plank.crop((L, 0, plank.width - R, plank.height)).resize((W - L - R, plank.height), Image.LANCZOS)
    board = Image.new('RGBA', (W, plank.height))
    board.alpha_composite(plank.crop((0, 0, L, plank.height)), (0, 0))
    board.alpha_composite(mid, (L, 0))
    board.alpha_composite(plank.crop((plank.width - R, 0, plank.width, plank.height)), (W - R, 0))
    d = ImageDraw.Draw(board)
    bb = d.textbbox((0, 0), name, font=font)
    tx = L + 10 + (W - L - R - 20 - (bb[2] - bb[0])) / 2 - bb[0]
    ty = (plank.height - (bb[3] - bb[1])) / 2 - bb[1] + 2
    d.text((tx, ty + 2), name, font=font, fill=(245, 222, 176))            # ánh sáng mép khắc
    d.text((tx, ty), name, font=font, fill=(58, 32, 16))                    # chữ khắc nâu đậm
    out = Image.new('RGBA', (W, plank.height + post.height - 14))
    out.alpha_composite(post, ((W - post.width) // 2 - 8, plank.height - 14))
    out.alpha_composite(board, (0, 0))
    out = out.resize((out.width // 2, out.height // 2), Image.LANCZOS)
    fid = 'doc' if key == 'doc' else key
    out.save(os.path.join(ROOT, f'public/assets/ui/bang_{fid}{"_en" if EN else ""}.webp'), quality=88)
    print(fid, out.size)
