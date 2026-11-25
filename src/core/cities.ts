/**
 * Bản đồ nhiều tầng theo ĐỊA GIỚI MỚI (anh Kha 25/11/2026):
 * Việt Nam → 34 tỉnh/thành (NQ 202/2025/QH15, chạy từ 1/7/2025) → phường/xã (bỏ cấp huyện) → đường thật → tiệm.
 * Đà Lạt nay thuộc tỉnh Lâm Đồng mới (Lâm Đồng + Đắk Nông + Bình Thuận); "TP Đà Lạt" không còn là đơn vị hành chính,
 * thay bằng 5 phường "… - Đà Lạt" (NQ 1671/NQ-UBTVQH15). Nguồn: docs/research/dia_gioi_2025.md.
 * Mở tỉnh mới = đổi open:true + thêm bản đồ + các phố của nó.
 */
export type Region = 'bac' | 'trung' | 'nam';
export interface ProvinceDef {
  id: string;
  name: string;
  region: Region;
  /** thành phố trực thuộc trung ương */
  tw?: boolean;
  open?: boolean;
  /** chỗ chơi đang mở trong tỉnh (vd. Đà Lạt) */
  playArea?: string;
  /** vị trí trên tranh bản đồ Việt Nam (Spark đợt 36), % ngang / dọc */
  x: number;
  y: number;
}
/** Tỉnh có hình mốc Spark (đợt 36; Lâm Đồng dùng ga Đà Lạt) */
export const PROVINCE_LANDMARK = new Set(['ha_noi', 'hai_phong', 'hue', 'da_nang', 'tp_hcm', 'can_tho', 'quang_ninh', 'lao_cai', 'ninh_binh', 'khanh_hoa', 'an_giang', 'quang_tri', 'gia_lai', 'lam_dong']);

export const PROVINCES: ProvinceDef[] = [
  { id: 'ha_noi', name: 'Hà Nội', region: 'bac', tw: true, x: 41, y: 17 },
  { id: 'hai_phong', name: 'Hải Phòng', region: 'bac', tw: true, x: 58, y: 19 },
  { id: 'quang_ninh', name: 'Quảng Ninh', region: 'bac', x: 61, y: 11 },
  { id: 'bac_ninh', name: 'Bắc Ninh', region: 'bac', x: 48, y: 14 },
  { id: 'hung_yen', name: 'Hưng Yên', region: 'bac', x: 49, y: 20 },
  { id: 'ninh_binh', name: 'Ninh Bình', region: 'bac', x: 39, y: 24 },
  { id: 'cao_bang', name: 'Cao Bằng', region: 'bac', x: 42, y: 8 },
  { id: 'lang_son', name: 'Lạng Sơn', region: 'bac', x: 52, y: 10 },
  { id: 'lai_chau', name: 'Lai Châu', region: 'bac', x: 12, y: 10 },
  { id: 'dien_bien', name: 'Điện Biên', region: 'bac', x: 9, y: 16 },
  { id: 'son_la', name: 'Sơn La', region: 'bac', x: 20, y: 15 },
  { id: 'tuyen_quang', name: 'Tuyên Quang', region: 'bac', x: 34, y: 8 },
  { id: 'lao_cai', name: 'Lào Cai', region: 'bac', x: 22, y: 9 },
  { id: 'thai_nguyen', name: 'Thái Nguyên', region: 'bac', x: 40, y: 12 },
  { id: 'phu_tho', name: 'Phú Thọ', region: 'bac', x: 32, y: 16 },
  { id: 'thanh_hoa', name: 'Thanh Hóa', region: 'trung', x: 34, y: 25 },
  { id: 'nghe_an', name: 'Nghệ An', region: 'trung', x: 28, y: 30 },
  { id: 'ha_tinh', name: 'Hà Tĩnh', region: 'trung', x: 38, y: 33 },
  { id: 'quang_tri', name: 'Quảng Trị', region: 'trung', x: 43, y: 37 },
  { id: 'hue', name: 'Huế', region: 'trung', tw: true, x: 53, y: 42 },
  { id: 'da_nang', name: 'Đà Nẵng', region: 'trung', tw: true, x: 63, y: 47 },
  { id: 'quang_ngai', name: 'Quảng Ngãi', region: 'trung', x: 66, y: 52 },
  { id: 'gia_lai', name: 'Gia Lai', region: 'trung', x: 73, y: 56 },
  { id: 'dak_lak', name: 'Đắk Lắk', region: 'trung', x: 70, y: 63 },
  { id: 'khanh_hoa', name: 'Khánh Hòa', region: 'trung', x: 82, y: 66 },
  { id: 'lam_dong', name: 'Lâm Đồng', region: 'trung', open: true, playArea: 'Đà Lạt', x: 62, y: 72 },
  { id: 'tp_hcm', name: 'TP Hồ Chí Minh', region: 'nam', tw: true, x: 56, y: 79 },
  { id: 'dong_nai', name: 'Đồng Nai', region: 'nam', x: 64, y: 76 },
  { id: 'tay_ninh', name: 'Tây Ninh', region: 'nam', x: 47, y: 75 },
  { id: 'can_tho', name: 'Cần Thơ', region: 'nam', tw: true, x: 42, y: 87 },
  { id: 'vinh_long', name: 'Vĩnh Long', region: 'nam', x: 50, y: 82 },
  { id: 'dong_thap', name: 'Đồng Tháp', region: 'nam', x: 41, y: 79 },
  { id: 'ca_mau', name: 'Cà Mau', region: 'nam', x: 33, y: 92 },
  { id: 'an_giang', name: 'An Giang', region: 'nam', x: 23, y: 81 },
];
export const REGION_NAME: Record<Region, string> = { bac: 'Miền Bắc', trung: 'Miền Trung – Tây Nguyên', nam: 'Miền Nam' };

/**
 * Phố trong game ↔ đường thật. Bản đồ ghi TÊN ĐƯỜNG THẬT; trang phố giới thiệu "phố" theo đặc trưng.
 * Phường: theo bảng giá đất cũ (phường 1–6) + NQ 1671 — Hoàng Diệu (P5 cũ) → Cam Ly; còn lại → Xuân Hương.
 */
export interface StreetInfo { road: string; roads: string; ward: string; gameName: string; intro: string }
export const STREET_INFO: Record<string, StreetInfo> = {
  doc: { road: 'Phố Dốc', roads: 'Con dốc nhỏ gần chợ (phố trong game)', ward: 'Xuân Hương - Đà Lạt', gameName: 'Phố Dốc', intro: 'Ba tiệm đầu tiên: tiệm giày, tiệm bánh, tiệm hoa — học giữ tiệm ở đây' },
  street_tang_bat_ho: { road: 'Tăng Bạt Hổ', roads: 'Đường Tăng Bạt Hổ – Trương Công Định', ward: 'Xuân Hương - Đà Lạt', gameName: 'Phố Ăn Đêm', intro: 'Phố ăn đêm sau chợ và dốc phố Tây: bánh căn, sữa nóng, hostel, bar dưới hầm' },
  street_pho_ca_phe: { road: 'Nguyễn Chí Thanh', roads: 'Đường Nguyễn Chí Thanh – Lê Đại Hành', ward: 'Xuân Hương - Đà Lạt', gameName: 'Phố Cà Phê', intro: 'Con đường cà phê lên Khu Hoà Bình: quán xưa cạnh quán mới, kem bơ, sân thượng nhìn phố' },
  street_phan_dinh_phung: { road: 'Phan Đình Phùng', roads: 'Đường Phan Đình Phùng', ward: 'Xuân Hương - Đà Lạt', gameName: 'Phố Dân Sinh', intro: 'Phố cũ của dân phố núi: nhà thuốc, tiệm tóc, nhà sách, studio ảnh cưới, phở sáng, tiệm xe máy' },
  street_nguyen_van_troi: { road: 'Nguyễn Văn Trỗi', roads: 'Đường Nguyễn Văn Trỗi', ward: 'Xuân Hương - Đà Lạt', gameName: 'Phố Kem Bơ', intro: 'Phố một chiều ăn vặt ngọt: kem bơ lâu năm, chè, bánh tráng nướng, dốc chùa' },
  street_hoang_dieu: { road: 'Hoàng Diệu', roads: 'Đường Hoàng Diệu', ward: 'Cam Ly - Đà Lạt', gameName: 'Phố Lẩu Bò', intro: 'Phố lẩu bò Ba Toa: hơn 20 quán lẩu, sáng bán bánh mì xíu mại' },
  street_tran_phu: { road: 'Trần Phú', roads: 'Đường Trần Phú – Ba Tháng Hai', ward: 'Xuân Hương - Đà Lạt', gameName: 'Phố Di Sản', intro: 'Phố di sản: khách sạn thời Pháp bên hồ, tiệm bánh lâu đời, quán phở, cháo đêm' },
};

/** Ảnh tranh đầu phố (Spark đợt 35) theo id phố / 'doc' */
export function streetBannerUrl(tab: string): string {
  if (tab === 'doc') return './assets/ui/dau_pho_doc.webp';
  const key = tab.replace(/^street_/, '').replace(/^pho_ca_phe$/, 'ca_phe');
  return `./assets/ui/dau_pho_${key}.webp`;
}
