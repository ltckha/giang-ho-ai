/**
 * Bản đồ nhiều tầng (anh Kha 25/11/2026: "sau này có map các thành phố lớn, nhiều màn hơn"):
 * Việt Nam → Thành phố → Phố → Tiệm. Thêm thành phố mới = thêm 1 dòng ở đây + bản đồ + các phố của nó.
 * Vị trí xPct/yPct: chỗ ghim trên bản đồ Việt Nam (Spark vẽ sau), theo % khung dọc.
 */
export interface CityDef {
  id: string;
  name: string;
  open: boolean;
  /** câu ngắn dưới tên */
  tag: string;
  xPct: number;
  yPct: number;
}

export const CITIES: CityDef[] = [
  { id: 'da_lat', name: 'Đà Lạt', open: true, tag: 'Phố núi sương mù', xPct: 62, yPct: 74 },
  { id: 'sai_gon', name: 'Sài Gòn', open: false, tag: 'Sắp mở', xPct: 52, yPct: 84 },
  { id: 'ha_noi', name: 'Hà Nội', open: false, tag: 'Sắp mở', xPct: 40, yPct: 12 },
  { id: 'da_nang', name: 'Đà Nẵng', open: false, tag: 'Sắp mở', xPct: 64, yPct: 46 },
  { id: 'hoi_an', name: 'Hội An', open: false, tag: 'Sắp mở', xPct: 66, yPct: 50 },
  { id: 'hue', name: 'Huế', open: false, tag: 'Sắp mở', xPct: 56, yPct: 42 },
  { id: 'nha_trang', name: 'Nha Trang', open: false, tag: 'Sắp mở', xPct: 72, yPct: 70 },
  { id: 'can_tho', name: 'Cần Thơ', open: false, tag: 'Sắp mở', xPct: 40, yPct: 90 },
];

/** Ảnh tranh đầu phố (Spark đợt 35) theo id phố / 'doc' */
export function streetBannerUrl(tab: string): string {
  if (tab === 'doc') return './assets/ui/dau_pho_doc.webp';
  const key = tab.replace(/^street_/, '').replace(/^pho_ca_phe$/, 'ca_phe');
  return `./assets/ui/dau_pho_${key}.webp`;
}
