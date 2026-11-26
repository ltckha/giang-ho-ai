#!/usr/bin/env python3
"""
Vẽ nền PHÒNG TRONG TIỆM cho từng màn tiệm phố thật (Claude, 24/11/2026).
Đọc src/core/streets/generated/*.json (shops: paths, pads, roomStyle, featuredTowerId) →
public/assets/rooms/map_<shopId>.webp (720×1040). Nội thất theo kiểu: luu_tru / quan_an / cafe / tiem;
bày món của chính tiệm (hình Spark mon_<art>_*.png) làm đồ trang trí.
Chạy: python3 tools/level-maker/make_room_map.py
"""
import glob, json, math, os, random
from PIL import Image, ImageDraw, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S, W, H = 2, 360, 520
INK = (43, 26, 18)
STYLE = {
    'luu_tru': {'floor': (140, 52, 48), 'floor2': (124, 44, 42), 'rug': (232, 200, 140), 'wall': (98, 70, 52)},
    'quan_an': {'floor': (232, 222, 200), 'floor2': (206, 192, 166), 'rug': (176, 140, 98), 'wall': (120, 84, 56)},
    'cafe':    {'floor': (170, 120, 78), 'floor2': (150, 104, 66), 'rug': (232, 214, 176), 'wall': (86, 60, 44)},
    'tiem':    {'floor': (212, 178, 128), 'floor2': (196, 160, 112), 'rug': (150, 186, 140), 'wall': (104, 74, 54)},
}
def seg_d(p, a, b):
    ax, ay = a; bx, by = b; px, py = p; dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / ((dx * dx + dy * dy) or 1)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)
def sprite(path, px):
    if not os.path.exists(path): return None
    im = Image.open(path).convert('RGBA'); im = im.crop(im.getbbox()); im.thumbnail((px, px), Image.LANCZOS); return im

def floor(d, st, style):
    if style == 'quan_an':
        for y in range(0, H * S, 40):
            for x in range(0, W * S, 40):
                d.rectangle([x, y, x + 39, y + 39], fill=st['floor'] if ((x + y) // 40) % 2 == 0 else st['floor2'])
    elif style == 'luu_tru':
        d.rectangle([0, 0, W * S, H * S], fill=st['floor'])
        for y in range(20, H * S, 60):
            for x in range(20 + (y // 60 % 2) * 30, W * S, 60):
                d.ellipse([x - 6, y - 6, x + 6, y + 6], fill=st['floor2'])
    else:
        for y in range(0, H * S, 34):
            off = (y // 34 % 3) * 50
            d.rectangle([0, y, W * S, y + 33], fill=st['floor'] if y // 34 % 2 == 0 else st['floor2'])
            for x in range(-off, W * S, 150):
                d.line([x, y, x, y + 33], fill=st['floor2'], width=3)

def furniture(d, im, style, x, y, rnd, decos):
    X, Y = x * S, y * S
    K = 1.8
    def R(a, b, c, e): return [X + a * K, Y + b * K, X + c * K, Y + e * K]
    if style == 'luu_tru':
        if rnd.random() < 0.5:   # giường
            d.rounded_rectangle(R(-34, -24, +34, +24), 8, fill=(246, 238, 222), outline=INK, width=4)
            d.rounded_rectangle(R(-30, -20, +30, -4), 6, fill=(255, 255, 255), outline=INK, width=3)
            d.rectangle(R(-34, +4, +34, +24), fill=(122, 160, 196), outline=INK, width=4)
        else:                    # sofa
            d.rounded_rectangle(R(-30, -14, +30, +16), 10, fill=(196, 130, 74), outline=INK, width=4)
            d.rounded_rectangle(R(-30, -22, +30, -6), 8, fill=(170, 108, 60), outline=INK, width=4)
    elif style == 'quan_an' or style == 'cafe':   # bàn tròn + ghế
        for a in range(0, 360, 90):
            cx, cy = X + 30 * K * math.cos(math.radians(a + 45)), Y + 30 * K * math.sin(math.radians(a + 45))
            d.ellipse([cx - 9 * K, cy - 9 * K, cx + 9 * K, cy + 9 * K], fill=(214, 92, 64) if style == 'quan_an' else (120, 84, 56), outline=INK, width=3)
        d.ellipse(R(-22, -22, +22, +22), fill=(250, 244, 230), outline=INK, width=4)
    else:                         # kệ hàng
        d.rounded_rectangle(R(-32, -18, +32, +18), 6, fill=(150, 104, 66), outline=INK, width=4)
        for i in range(4):
            c = rnd.choice([(232, 96, 72), (92, 170, 210), (246, 196, 72), (110, 180, 110)])
            d.rectangle(R(-26 + i * 14, -12, -16 + i * 14, 2), fill=c, outline=INK, width=2)
    if decos:
        dz = rnd.choice(decos)
        im.paste(dz, (int(X - dz.width / 2), int(Y - dz.height * 0.7)), dz)

NT = os.path.join(ROOT, 'art', 'noi_that')
SOFTEN = {'nen_gach_caro': 0.62, 'nen_gach_bong': 0.35}
TILE = {'luu_tru': 'nen_san_tham', 'quan_an': 'nen_san_xi_mang', 'cafe': 'nen_san_go', 'tiem': 'nen_san_da'}
WALL = {'luu_tru': 'nen_tuong_go', 'quan_an': 'nen_tuong_voi', 'cafe': 'nen_tuong_go', 'tiem': 'nen_tuong_voi'}
COUNTER = {'luu_tru': 'noi_quay_le_tan', 'quan_an': 'noi_bep_quan', 'cafe': 'noi_quay_pha_che', 'tiem': 'noi_quay_thu_ngan'}
FURN = {
    'luu_tru': ['noi_giuong_doi', 'noi_giuong_doi', 'noi_giuong_tang', 'noi_sofa', 'noi_ban_tra', 'noi_tu_quan_ao', 'noi_chau_cay_lon', 'noi_tham_tron'],
    'quan_an': ['noi_ban_quan', 'noi_ban_quan', 'noi_ban_quan', 'noi_ban_go_dai', 'noi_tu_lanh', 'noi_chau_cay_lon'],
    'cafe': ['noi_ban_cafe', 'noi_ban_cafe', 'noi_ban_cafe', 'noi_ghe_banh', 'noi_ke_ly', 'noi_chau_cay_lon', 'noi_tham_tron'],
    'tiem': ['noi_ke_hang', 'noi_ke_hang', 'noi_tu_kinh', 'noi_gio_hang', 'noi_thung_hang', 'noi_chau_cay_lon'],
}
_NT_CACHE = {}
def nt(name, px):
    # nhớ hình đã thu nhỏ: bày phòng thử hàng nghìn chỗ, không đọc lại file mỗi lần
    k = (name, px)
    if k not in _NT_CACHE:
        _NT_CACHE[k] = sprite(os.path.join(NT, f'{name}.png'), px)
    return _NT_CACHE[k]
def tile_fill(im, name, box):
    f = os.path.join(NT, f'{name}.png')
    if not os.path.exists(f): return False
    t = Image.open(f).convert('RGB').resize((160, 160), Image.LANCZOS)
    if name in SOFTEN:   # nền nhiều hoa văn: pha màu kem cho dịu, ô đặt món vẫn nổi
        t = Image.blend(t, Image.new('RGB', t.size, (246, 236, 214)), SOFTEN[name])
    x0, y0, x1, y1 = box
    for y in range(y0, y1, 160):
        for x in range(x0, x1, 160):
            im.paste(t.crop((0, 0, min(160, x1 - x), min(160, y1 - y))), (x, y))
    return True

# ===== 17 kiểu phòng theo loại tiệm (Claude 24/11) =====
# Mỗi ô có thể ghi "a|b": dùng hình a, chưa có thì dùng b (chờ Spark vẽ đợt sau).
KINDS = [
    # (mã, mẫu tên, kiểu gốc, nền, tường, quầy, đồ trong phòng, đồ treo tường trên)
    ('tiem_giay',  r'tiệm giày|giày dép',           'tiem',    'nen_san_go', 'nen_tuong_giay_hoa|nen_tuong_go', 'noi_quay_tiem_giay',
        ['noi_ke_giay', 'noi_ghe_thu_giay', 'noi_guong_dung', 'noi_ke_giay', 'noi_chong_hop_giay', 'noi_gio_dep'], None),
    ('bar',        r'bar|cocktail',                  'cafe',    'nen_san_go_toi|nen_san_go', 'nen_tuong_gach_the|nen_tuong_go', 'noi_quay_bar',
        ['noi_sofa_da', 'noi_sofa_da', 'noi_ke_chai', 'noi_ban_ghe_cao', 'noi_ban_cafe'], 'noi_den_neon'),
    ('khach_san',  r'khách sạn',                     'luu_tru', 'nen_san_tham', 'nen_tuong_giay_hoa|nen_tuong_go', 'noi_quay_le_tan',
        ['noi_ghe_sanh', 'noi_xe_hanh_ly', 'noi_tham_do', 'noi_sofa', 'noi_chau_cay_lon', 'noi_ban_tra', 'noi_ghe_sanh'], 'noi_den_chum'),
    ('homestay',   r'homestay|hostel|nhà nghỉ',      'luu_tru', 'nen_san_go_thong|nen_san_go', 'nen_tuong_go_thong|nen_tuong_go', 'noi_quay_le_tan',
        ['noi_giuong_tang', 'noi_tu_khoa', 'noi_ke_mu_bao_hiem', 'noi_lo_suoi', 'noi_ban_den_long', 'noi_giuong_tang'], None),
    ('lau_nuong',  r'lẩu|nướng phố|quán nướng',      'quan_an', 'nen_san_xi_mang', 'nen_tuong_gach_the|nen_tuong_voi', 'noi_quay_lau',
        ['noi_ban_lau', 'noi_ban_lau', 'noi_bep_nuong_than', 'noi_ban_lau', 'noi_ke_rau_nam', 'noi_tu_lanh'], None),
    ('tiem_banh',  r'tiệm bánh|pizza',               'tiem',    'nen_gach_caro|nen_san_da', 'nen_tuong_giay_hoa|nen_tuong_voi', 'noi_tu_banh_ngot',
        ['noi_ke_banh_mi', 'noi_lo_nuong', 'noi_ban_nhoi_bot', 'noi_ke_banh_mi', 'noi_ban_tron_nho'], None),
    ('tra',        r'trà',                           'cafe',    'nen_san_go', 'nen_tuong_xanh_reu|nen_tuong_go', 'noi_quay_tra_sua',
        ['noi_ban_ghe_cao', 'noi_ke_hu_tra', 'noi_ban_ghe_cao', 'noi_ban_tra', 'noi_chau_cay_lon'], None),
    ('kem_che',    r'kem|chè|yaourt|sữa nóng',       'cafe',    'nen_gach_bong|nen_san_da', 'nen_tuong_giay_hoa|nen_tuong_voi', 'noi_tu_kem',
        ['noi_ban_tron_nho', 'noi_ban_tron_nho', 'noi_quay_che', 'noi_noi_sua_nong', 'noi_ban_tron_nho', 'noi_chau_cay_lon'], None),
    ('san_thuong', r'sân thượng',                    'cafe',    'nen_san_thuong', 'nen_tuong_go_thong|nen_tuong_go', 'noi_quay_pha_che',
        ['noi_du_san_thuong', 'noi_lan_can_san_thuong', 'noi_du_san_thuong', 'noi_chau_cay_lon', 'noi_du_san_thuong', 'noi_lan_can_san_thuong'], None),
    ('ca_phe_coc', r'cóc',                           'cafe',    'nen_via_he_coc', 'nen_tuong_voi', 'noi_quay_phin',
        ['noi_ghe_nhua_thap', 'noi_ghe_nhua_thap', 'noi_ghe_nhua_thap', 'noi_chau_cay_lon', 'noi_ghe_nhua_thap'], None),
    ('cafe_tre',   r'sân thượng|xe đạp|cóc',         'cafe',    'nen_san_go_thong|nen_san_go', 'nen_tuong_go_thong|nen_tuong_go', 'noi_quay_pha_che',
        ['noi_ban_ban_cong', 'noi_xe_dap_cu', 'noi_ban_ban_cong', 'noi_day_den', 'noi_chau_cay_lon', 'noi_ban_cafe'], None),
    ('cafe_xua',   r'cà phê',                        'cafe',    'nen_san_go_toi|nen_san_go', 'nen_tuong_gach_the|nen_tuong_go', 'noi_quay_phin',
        ['noi_ban_go_thap', 'noi_may_hat_dia', 'noi_ban_go_thap', 'noi_ke_do_co', 'noi_ban_go_thap', 'noi_ghe_banh'], None),
    ('pho_com',    r'phở|cơm|cháo|bún',              'quan_an', 'nen_gach_bong|nen_san_da', 'nen_tuong_voi', 'noi_quay_nuoc_leo',
        ['noi_ban_inox', 'noi_ban_inox', 'noi_khay_rau_thom', 'noi_ban_inox', 'noi_tu_com', 'noi_tu_lanh'], None),
    ('an_sang',    r'bánh mì|bánh căn|bánh tráng|quán sáng|ăn vặt|xíu mại', 'quan_an', 'nen_san_xi_mang', 'nen_tuong_xanh_reu|nen_tuong_voi', 'noi_xe_banh_mi',
        ['noi_ban_ghe_dau', 'noi_ban_ghe_dau', 'noi_bep_banh_can', 'noi_bep_banh_trang', 'noi_ban_ghe_dau', 'noi_ban_quan'], None),
    ('nha_thuoc',  r'nhà thuốc',                     'tiem',    'nen_san_gach_men|nen_san_da', 'nen_tuong_voi', 'noi_quay_thuoc|noi_quay_thu_ngan',
        ['noi_tu_kinh_thuoc|noi_tu_kinh', 'noi_ke_hang', 'noi_tu_kinh_thuoc|noi_tu_kinh', 'noi_chau_cay_lon'], None),
    ('tiem_toc',   r'tóc|móng',                      'tiem',    'nen_gach_caro|nen_san_da', 'nen_tuong_giay_hoa|nen_tuong_voi', 'noi_quay_thu_ngan',
        ['noi_ghe_cat_toc|noi_ghe_banh', 'noi_giuong_goi|noi_sofa', 'noi_ghe_cat_toc|noi_ghe_banh', 'noi_ban_lam_mong|noi_ban_tra', 'noi_chau_cay_lon'], None),
    ('nha_sach',   r'nhà sách|sách',                 'tiem',    'nen_san_go', 'nen_tuong_go', 'noi_quay_thu_ngan',
        ['noi_ke_sach_cao|noi_ke_hang', 'noi_ban_doc|noi_ban_go_dai', 'noi_ke_sach_cao|noi_ke_hang', 'noi_goc_thieu_nhi|noi_tham_tron', 'noi_ke_sach_cao|noi_ke_hang'], None),
    ('studio_anh', r'studio|ảnh',                    'tiem',    'nen_san_go_toi|nen_san_go', 'nen_tuong_voi', 'noi_quay_le_tan',
        ['noi_phong_chup|noi_tham_tron', 'noi_moc_vay_cuoi|noi_tu_quan_ao', 'noi_may_anh_chan|noi_den_cay', 'noi_sofa', 'noi_chau_cay_lon'], None),
    ('sua_xe',     r'xe máy|sửa xe',                 'tiem',    'nen_san_be_tong|nen_san_xi_mang', 'nen_tuong_gach_the|nen_tuong_voi', 'noi_quay_tinh_tien',
        ['noi_xe_tren_bang|noi_thung_hang', 'noi_thung_do_nghe|noi_ke_hang', 'noi_chong_lop|noi_thung_hang', 'noi_ke_mu_bao_hiem', 'noi_thung_hang'], None),
    ('tap_hoa',    r'tạp hoá|tạp hóa',               'tiem',    'nen_san_da', 'nen_tuong_voi', 'noi_quay_tinh_tien',
        ['noi_ke_hang', 'noi_tu_mat|noi_tu_lanh', 'noi_ke_hang', 'noi_bao_gao|noi_thung_hang', 'noi_gio_hang', 'noi_thung_hang'], None),
    ('giat_say',   r'giặt',                          'tiem',    'nen_san_gach_men|nen_san_da', 'nen_tuong_voi', 'noi_quay_thu_ngan',
        ['noi_may_giat_say|noi_tu_lanh', 'noi_may_giat_say|noi_tu_lanh', 'noi_ban_gap_do|noi_ban_go_dai', 'noi_gio_do|noi_gio_hang', 'noi_ke_hang'], None),
]
BIG = {'noi_giuong_doi', 'noi_giuong_tang', 'noi_ban_go_dai', 'noi_sofa', 'noi_ke_hang', 'noi_ban_lau', 'noi_sofa_da', 'noi_ghe_sanh',
       'noi_tham_do', 'noi_ke_sach_cao', 'noi_phong_chup', 'noi_xe_tren_bang', 'noi_may_giat_say', 'noi_ban_ban_cong', 'noi_ban_inox',
       'noi_ke_banh_mi', 'noi_ke_chai', 'noi_lo_suoi', 'noi_tu_khoa', 'noi_ban_ghe_dau'}
TABLES = ('noi_ban_', 'noi_ke_hang', 'noi_tu_kinh', 'noi_ke_banh_mi')
SHELVES = ('noi_ke_', 'noi_tu_', 'noi_quay_')
# Bàn ghế / cây / thảm dùng chung mọi tiệm — chỉ để lấp chỗ trống
GENERIC = {'noi_ban_quan', 'noi_ban_cafe', 'noi_ban_tron_nho', 'noi_ban_go_thap', 'noi_ban_go_dai', 'noi_ban_ghe_dau', 'noi_ban_ghe_cao',
           'noi_ban_inox', 'noi_ban_tra', 'noi_chau_cay_lon', 'noi_tham_tron', 'noi_ban_ban_cong', 'noi_ghe_banh', 'noi_sofa', 'noi_tham_do'}

# Quầy riêng theo món chính của tiệm (đè quầy chung của kiểu phòng)
COUNTER_BY_NAME = [(r'phở', 'noi_quay_pho_trong'), (r'cơm', 'noi_quay_com_trong'), (r'cháo', 'noi_quay_chao'), (r'lẩu', 'noi_quay_lau_trong'),
                   (r'bánh căn', 'noi_bep_banh_can'), (r'bánh tráng', 'noi_bep_banh_trang'), (r'chè|sữa nóng', 'noi_quay_che'),
                   (r'quán nướng', 'noi_bep_nuong_than')]

# Đồ treo tường riêng theo loại phòng (Spark đợt 34) — hết cảnh phòng nào cũng tranh + đồng hồ giống hệt
WALL_BY_KIND = {
    'tiem_giay': ['noi_tuong_khung_anh', 'noi_dong_ho_tuong'],
    'lau_nuong': ['noi_tuong_den_long', 'noi_tuong_menu'], 'pho_com': ['noi_tuong_menu', 'noi_tuong_den_long'],
    'an_sang': ['noi_tuong_menu', 'noi_dong_ho_tuong'], 'tiem_banh': ['noi_tuong_menu', 'noi_tranh_tuong'],
    'kem_che': ['noi_tuong_menu', 'noi_tranh_tuong'], 'tra': ['noi_tuong_ke_sach', 'noi_tuong_menu'],
    'cafe_xua': ['noi_tuong_ke_sach', 'noi_tranh_tuong'], 'cafe_tre': ['noi_tuong_ke_sach', 'noi_tuong_menu'],
    'khach_san': ['noi_tuong_moc_khoa', 'noi_tranh_tuong'], 'homestay': ['noi_tuong_moc_khoa', 'noi_tuong_mu_bao_hiem'],
    'nha_thuoc': ['noi_tuong_tu_thuoc', 'noi_dong_ho_tuong'], 'tiem_toc': ['noi_tuong_guong_salon', 'noi_tuong_guong_salon'],
    'nha_sach': ['noi_tuong_ke_sach', 'noi_tuong_ke_sach'], 'studio_anh': ['noi_tuong_khung_anh', 'noi_tuong_khung_anh'],
    'sua_xe': ['noi_tuong_mu_bao_hiem', 'noi_dong_ho_tuong'], 'tap_hoa': ['noi_tuong_menu', 'noi_dong_ho_tuong'],
    'giat_say': ['noi_dong_ho_tuong', 'noi_tranh_tuong'],
    'san_thuong': ['noi_tuong_den_long', 'noi_tuong_menu'], 'ca_phe_coc': ['noi_tuong_menu', 'noi_dong_ho_tuong'],
}

def pick(names):
    for n in (names or '').split('|'):
        if n and os.path.exists(os.path.join(NT, f'{n}.png')): return n
    return None

def kind_of(name):
    import re
    t = (name or '').lower()
    for k in KINDS:
        if re.search(k[1], t): return k
    return None

def box_d(box, pt):
    """Khoảng cách từ 1 điểm tới khung chữ nhật (0 nếu nằm trong)"""
    x0, y0, x1, y1 = box
    dx = max(x0 - pt[0], 0, pt[0] - x1); dy = max(y0 - pt[1], 0, pt[1] - y1)
    return math.hypot(dx, dy)


def dense(r, step=8):
    """Các điểm dày dọc đường đi"""
    out = []
    for (ax, ay), (bx, by) in zip(r, r[1:]):
        n = max(1, int(math.hypot(bx - ax, by - ay) / step))
        out += [(ax + (bx - ax) * i / n, ay + (by - ay) * i / n) for i in range(n)]
    return out + [r[-1]]


ROOM_BY_NAME = [
    (r'bánh căn', 'phong_banh_can'), (r'bánh tráng', 'phong_banh_trang'), (r'xíu mại', 'phong_banh_mi_xiu_mai'),
    (r'ăn vặt', 'phong_an_vat'), (r'quán sáng', 'phong_quan_sang'), (r'quán chè', 'phong_che'), (r'yaourt', 'phong_yaourt'),
    (r'sữa nóng', 'phong_sua_nong'), (r'khách sạn (cổ|bên hồ)', 'phong_khach_san_phap'), (r'khách sạn (mini|nhỏ)', 'phong_khach_san_mini'),
    (r'nướng', 'phong_nuong'), (r'cháo', 'phong_chao'), (r'cơm tấm', 'phong_com_tam'), (r'pizza', 'phong_pizza'),
    (r'bánh quà', 'phong_banh_qua'), (r'trà sữa', 'phong_tra_sua'), (r'hostel', 'phong_hostel'),
    (r'ngắm hồ', 'phong_cafe_view_ho'), (r'hoài cổ', 'phong_cafe_retro'),
]


def full_room_of(stage):
    """Nguyên phòng Spark vẽ (đợt 38–39) theo loại tiệm; chưa có hình thì trả None (dùng cách ghép cũ)"""
    if not str(stage.get('id', '')).startswith('street_'):   # Phố Dốc giữ bố cục riêng
        return None
    nm = stage.get('name', '').lower()
    import re
    # phòng riêng theo đúng loại quán (Spark đợt 40) — có hình thì dùng trước phòng chung của nhóm
    for pat, f in ROOM_BY_NAME:
        pth = room_png(f)
        if re.search(pat, nm) and pth:
            return pth
    kd = kind_of(stage.get('name', ''))
    k = kd[0] if kd else None
    if k == 'pho_com':
        f = 'phong_pho' if 'phở' in nm else 'phong_com'
    elif k == 'lau_nuong':
        f = 'phong_lau'
    elif k:
        f = f'phong_{k}'
    else:
        return None
    return room_png(f)


def room_png(f):
    """Phòng vẽ theo khuôn (art/phong_khuon, đợt 41–43: sàn giữa trống 2/3) dùng trước phòng cũ (art/phong)"""
    for d in ('phong_khuon', 'phong'):
        p_ = os.path.join(ROOT, 'art', d, f'{f}.png')
        if os.path.exists(p_):
            return p_
    return None


def draw_path_and_pads(im, paths, pads, st, strong=False):
    """Lối đi NHẸ (anh Kha 26/11): dải sáng mờ + viền chấm 2 bên + mũi tên chỉ hướng quái đi — vẫn thấy phòng bên dưới.
    Chỗ đặt món: vòng kem mờ, viền chấm mảnh, dấu + nhỏ — không che bàn ghế / khách."""
    lay = Image.new('RGBA', im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for r in paths:
        P = [(x * S, y * S) for x, y in r]
        al = 165 if strong else 95      # phòng theo khuôn: sàn gạch bông nhiều hoa văn → đường đậm hơn chút cho dễ thấy
        d.line(P, fill=(255, 248, 225, al), width=46, joint='curve')
        for q in P: d.ellipse([q[0] - 23, q[1] - 23, q[0] + 23, q[1] + 23], fill=(255, 248, 225, al))
        for (ax, ay), (bx, by) in zip(P, P[1:]):
            L = math.hypot(bx - ax, by - ay) or 1
            ux, uy = (bx - ax) / L, (by - ay) / L; nx, ny = -uy, ux
            for k in range(0, int(L), 18):
                cx, cy = ax + ux * k, ay + uy * k
                for s_ in (-23, 23): d.ellipse([cx + nx * s_ - 3, cy + ny * s_ - 3, cx + nx * s_ + 3, cy + ny * s_ + 3], fill=(120, 80, 40, 200))
            for k in range(30, int(L) - 10, 70):
                cx, cy = ax + ux * k, ay + uy * k
                d.polygon([(cx + ux * 9, cy + uy * 9), (cx - ux * 6 + nx * 7, cy - uy * 6 + ny * 7), (cx - ux * 6 - nx * 7, cy - uy * 6 - ny * 7)], fill=(150, 100, 50, 170))
    for px_, py_ in pads:
        cx, cy, R = px_ * S, py_ * S, 20 * S
        d.ellipse([cx - R, cy - R * 0.86, cx + R, cy + R * 0.86], fill=(255, 246, 220, 120))
        for k in range(24):                           # viền chấm
            t = k / 24 * 2 * math.pi
            ex_, ey_ = cx + math.cos(t) * R, cy + math.sin(t) * R * 0.86
            d.ellipse([ex_ - 3, ey_ - 3, ex_ + 3, ey_ + 3], fill=(110, 72, 36, 220))
        d.line([cx - 9, cy, cx + 9, cy], fill=(110, 72, 36, 200), width=4)
        d.line([cx, cy - 8, cx, cy + 8], fill=(110, 72, 36, 200), width=4)
    im.paste(lay, (0, 0), lay)


def draw(stage, out):
    global H
    H = stage.get('_H', 520)   # Phố Dốc Màn 1 cao 480
    style = stage.get('roomStyle', 'tiem')
    kd = kind_of(stage.get('name', ''))
    if kd:
        style = kd[2]
        tile_name, wall_name, ctr_name, furn, top = pick(kd[3]), pick(kd[4]), pick(kd[5]), [pick(x) for x in kd[6]], pick(kd[7]) if kd[7] else None
        furn = [x for x in furn if x] or FURN[style]
        import re
        for pat, cn in COUNTER_BY_NAME:
            if re.search(pat, stage.get('name', '').lower()) and pick(cn):
                furn = [x if x != cn else 'noi_ban_quan' for x in furn]
                ctr_name = cn
                break
    else:
        tile_name, wall_name, ctr_name, furn, top = TILE[style], WALL[style], COUNTER[style], FURN[style], None
    st = STYLE[style]
    stage['_kind'] = kd[0] if kd else style
    rnd = random.Random(stage['id'])
    paths = [[(p['x'], p['y']) for p in r] for r in stage['paths']]
    pads = [(p['x'], p['y']) for p in stage['pads']]
    segs = [(r[i], r[i + 1]) for r in paths for i in range(len(r) - 1)]
    im = Image.new('RGB', (W * S, H * S), st['floor']); d = ImageDraw.Draw(im)
    # NGUYÊN PHÒNG Spark vẽ (đợt 38, anh Kha chọn 26/11): quán thật nhìn từ trên xuống; game chỉ vẽ đường + ô lên trên
    full = full_room_of(stage)
    if full:
        bg = Image.open(full).convert('RGB').resize((W * S, H * S), Image.LANCZOS)
        im.paste(bg, (0, 0))
        draw_path_and_pads(im, paths, pads, st, strong=os.sep + 'phong_khuon' + os.sep in full)
        im.save(out, 'WEBP', quality=82, method=6)
        stage['_kind'] = 'phong_' + os.path.basename(full)[6:-4]
        return
    if not tile_fill(im, tile_name or '', (0, 0, W * S, H * S)):
        floor(d, st, style)
    d = ImageDraw.Draw(im)
    # BỨC TƯỜNG SAU QUẦY bày đầy hàng đặc trưng (Spark đợt 37) — anh Kha 26/11: nhìn 1 giây biết tiệm gì
    back = os.path.join(NT, f'tuong_{kd[0]}.png') if kd else ''
    if back and os.path.exists(back):
        bw = Image.open(back).convert('RGBA')
        bh = int(W * S * bw.height / bw.width)
        bw = bw.resize((W * S, bh), Image.LANCZOS)
        y0 = 54 * S - bh                      # thấy phần dưới bức tường (quầy, kệ thấp), mép dưới ở y = 54
        im.paste(bw, (0, y0), bw)
        d = ImageDraw.Draw(im)
        d.line([0, 54 * S, W * S, 54 * S], fill=INK, width=6)
        stage['_backwall'] = True
    elif not tile_fill(im, wall_name or '', (0, 0, W * S, 40 * S)):
        d.rectangle([0, 0, W * S, 40 * S], fill=st['wall'])
    d = ImageDraw.Draw(im)
    if not stage.get('_backwall'):
        d.line([0, 40 * S, W * S, 40 * S], fill=INK, width=6)
    win = nt('noi_cua_so', 34 * S); pic = nt('noi_tranh_tuong', 26 * S); clk = nt('noi_dong_ho_tuong', 22 * S)
    wall_items = [nt(n, 30 * S) for n in WALL_BY_KIND.get(kd[0] if kd else '', [])]
    wall_items = [w for w in wall_items if w is not None]
    for i, x in enumerate(range(40, W - 20, 80) if not stage.get('_backwall') else []):
        it = [win, pic, win, clk][i % 4] or win
        if wall_items and i % 2 == 1:
            it = wall_items[(i // 2) % len(wall_items)]
        if top and i % 2 == 1 and i % 4 == 3:
            it = nt(top, 34 * S) or it
        if it is not None:
            im.paste(it, (int(x * S - it.width / 2), int(20 * S - it.height / 2)), it)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 8 * S, H * S], fill=st['wall']); d.rectangle([(W - 8) * S, 0, W * S, H * S], fill=st['wall'])
    # thảm đường đi
    for r in paths:
        pts = [(x * S, y * S) for x, y in r]
        d.line(pts, fill=INK, width=60, joint='curve'); d.line(pts, fill=st['rug'], width=52, joint='curve')
        for p in pts: d.ellipse([p[0] - 26, p[1] - 26, p[0] + 26, p[1] + 26], fill=st['rug'])
        d.line(pts, fill=tuple(max(0, c - 30) for c in st['rug']), width=6, joint='curve')
    # quầy ở cuối đường (nơi quái muốn tới)
    ex, ey = paths[0][-1]
    # quầy nhỏ dần nếu đè lên ô đặt món (kiểm tra thực tế 24/11: quầy bar / lễ tân che ô)
    ctr = None
    for csz in (84, 76, 68, 60, 54):
        ctr = nt(ctr_name or COUNTER[style], csz * S)
        if ctr is None: break
        cb = (ex - ctr.width / S / 2, ey - 6 - ctr.height / S * 0.85, ex + ctr.width / S / 2, ey - 6 + ctr.height / S * 0.15)
        if all(box_d(cb, pd) >= 22 for pd in pads): break
    if ctr is not None:
        im.paste(ctr, (int(ex * S - ctr.width / 2), int((ey - 6) * S - ctr.height * 0.85)), ctr)
        d = ImageDraw.Draw(im)
        # bày món của tiệm lên mặt quầy
        art0 = stage.get('_art')
        prod = sprite(os.path.join(ROOT, 'art', 'spark', f'mon_{art0}_b2.png'), 26 * S) if art0 else None
        if prod is not None:
            im.paste(prod, (int(ex * S - prod.width / 2 + 14 * S), int((ey - 6) * S - ctr.height * 0.85 + 4 * S)), prod)
            d = ImageDraw.Draw(im)
    else:
        d.rounded_rectangle([(ex - 44) * S, (ey - 20) * S, (ex + 44) * S, (ey + 4) * S], 10, fill=(126, 84, 52), outline=INK, width=5)
    # Bảng cờ đích cạnh quầy (Spark đợt 35): người mới biết quái chạy về đâu
    flag = nt('noi_bang_dich', 30 * S)
    if flag is not None:
        for fx_ in (ex + 46, ex - 46, ex + 30):
            fb = (fx_ - 12, ey - 34, fx_ + 12, ey)
            if 12 < fx_ < W - 12 and all(box_d(fb, pd) >= 20 for pd in pads):
                im.paste(flag, (int(fx_ * S - flag.width / 2), int(ey * S - flag.height)), flag)
                d = ImageDraw.Draw(im)
                break
    # đế gỗ dưới mỗi ô đặt món: ô nổi rõ trên mọi nền (gạch caro, gạch bông…) — Antigravity rà 24/11
    for px_, py_ in pads:
        R = 21 * S
        d.ellipse([px_ * S - R - 3, py_ * S - R * 0.86 + 6, px_ * S + R + 3, py_ * S + R * 0.86 + 10], fill=(60, 40, 24))
        d.ellipse([px_ * S - R, py_ * S - R * 0.86, px_ * S + R, py_ * S + R * 0.86], fill=(150, 104, 62), outline=INK, width=4)
        d.ellipse([px_ * S - R + 7, py_ * S - R * 0.86 + 6, px_ * S + R - 7, py_ * S + R * 0.86 - 6], outline=(196, 150, 98), width=3)
    # thảm chùi chân ở cửa
    for r in paths:
        sx, sy = r[0]
        if sx <= 8 or sx >= W - 8:      # cửa bên (vào từ mép trái / phải) — kiểm tra 26/11: thiếu cửa
            ex0 = 0 if sx <= 8 else W - 14
            d.rounded_rectangle([ex0 * S, (sy - 26) * S, (ex0 + 14) * S, (sy + 26) * S], 6, fill=(110, 140, 90), outline=INK, width=4)
        else:
            d.rounded_rectangle([(sx - 26) * S, (min(sy, H) - 14) * S, (sx + 26) * S, min(sy, H) * S], 6, fill=(110, 140, 90), outline=INK, width=4)
    # món của tiệm làm đồ trang trí
    art = stage.get('_art')
    decos = []
    if art:
        for t in ['b1', 'b2', 'b3a', 'b3b']:
            sp = sprite(os.path.join(ROOT, 'art', 'spark', f'mon_{art}_{t}.png'), 40 * S)
            if sp: decos.append(sp)
    # Bày phòng (anh Kha 26/11: "món hàng trong tiệm chưa rõ, chưa đặc trưng"):
    # 1) ĐỒ ĐẶC TRƯNG của loại tiệm đặt trước, to, sát 2 bên tường (như tiệm thật), mỗi món tới 2 cái
    # 2) bàn ghế chung chỉ lấp chỗ trống; 3) hàng của chính tiệm bày lên bàn, kệ, tủ
    placed, items = [], []
    sig = [n for n in dict.fromkeys(furn) if n not in GENERIC]
    gen = [n for n in furn if n in GENERIC] or ['noi_chau_cay_lon']
    cands = [(rnd.uniform(40, W - 40), rnd.uniform(74, H - 30)) for _ in range(5000)]
    def fits(name, x, y, sizes, gap):
        if any(math.hypot(x - qx, y - qy) < gap for qx, qy in placed): return None
        if abs(x - ex) < 62 and -95 < y - ey < 30: return None   # chỗ quầy
        for size in sizes:
            img = nt(name, size * S)
            if img is None: return None
            hw, top_, bot_ = img.width / S / 2, img.height / S * 0.7, img.height / S * 0.3
            box = (x - hw, y - top_, x + hw, y + bot_)
            if box[1] < (58 if stage.get('_backwall') else 44) or box[0] < 9 or box[2] > W - 9 or box[3] > H - 4: continue
            if any(box_d(box, (px, py)) < 22 for px, py in pads): continue
            if any(box_d(box, pt) < 26 for r in paths for pt in dense(r)): continue
            return img
        return None
    def put(name, img, x, y, shelf):
        placed.append((x, y))
        holds = decos and (name.startswith(TABLES) or shelf) and name not in ('noi_ban_lau', 'noi_ban_nhoi_bot')
        items.append((x, y, img, decos[len(items) % len(decos)] if holds else None))
    wall = sorted(cands, key=lambda c: min(c[0], W - c[0]))          # sát tường trái / phải trước
    for rep in range(2):
        for name in sig:
            for x, y in wall:
                img = fits(name, x, y, (86, 76, 66, 58, 50) if name in BIG else (76, 66, 58, 50, 44), 64)
                if img is not None:
                    put(name, img, x, y, name.startswith(SHELVES)); break
            if len(placed) >= 8: break
    for k in range(40):
        if len(placed) >= 11: break
        name = gen[k % len(gen)]
        for x, y in cands[k * 120:(k + 1) * 120]:
            img = fits(name, x, y, (60, 52, 44, 38), 58)
            if img is not None:
                put(name, img, x, y, False); break
    for x, y, img, dz in sorted(items, key=lambda t: t[1]):
        im.paste(img, (int(x * S - img.width / 2), int(y * S - img.height * 0.7)), img)
        if dz is not None:
            dz2 = dz.copy(); dz2.thumbnail((30 * S, 30 * S))
            im.paste(dz2, (int(x * S - dz2.width / 2), int(y * S - img.height * 0.7 - dz2.height * 0.4)), dz2)
    d = ImageDraw.Draw(im)
    # chậu cây góc phòng
    plant = nt('noi_chau_cay_lon', 40 * S)
    if plant:
        for x, y in ([] if stage.get('_backwall') else [(24, 64), (W - 24, 64)]):
            if all(math.hypot(x - px, y - py) > 46 for px, py in pads):
                im.paste(plant, (int(x * S - plant.width / 2), int(y * S - plant.height / 2)), plant)
    if stage['_kind'] == 'bar':   # bar dưới hầm: tối hơn, ánh tím ấm
        im = Image.blend(im, Image.new('RGB', im.size, (40, 20, 60)), 0.28)
    im.save(out, 'WEBP', quality=80, method=6)

def main():
    os.makedirs(os.path.join(ROOT, 'public/assets/rooms'), exist_ok=True)
    n = 0
    kinds_used = {}
    for f in sorted(glob.glob(os.path.join(ROOT, 'src/core/streets/generated/*.json'))):
        g = json.load(open(f, encoding='utf-8'))
        for sh in g.get('shops', []):
            st = sh['stage']
            feat = g['towers'].get(st.get('featuredTowerId', ''), {})
            st['_art'] = feat.get('art')
            draw(st, os.path.join(ROOT, 'public/assets/rooms', f"map_{st['id']}.webp")); n += 1
            kinds_used[st['_kind']] = kinds_used.get(st['_kind'], 0) + 1
    print('vẽ phòng:', n, '· kiểu phòng:', len(kinds_used), kinds_used)

    # Phố Dốc Màn 1 Tiệm Giày (anh Kha "làm hết" 25/11): vẽ lại phòng tiệm giày bằng đồ Spark đợt 34 — hết bếp ga, cán bột
    for f in sorted(glob.glob(os.path.join(ROOT, 'content/rooms/*.json'))):
        st = json.load(open(f, encoding='utf-8'))
        draw(st, os.path.join(ROOT, st['_out']))
        print('vẽ phòng Phố Dốc:', st['id'], st['_kind'])


if __name__ == '__main__':
    main()
