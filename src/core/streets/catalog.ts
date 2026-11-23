/**
 * Danh mục loại địa điểm cho máy làm màn (Claude).
 * Mỗi loại: món đặt (hành + vai + tên 4 bậc + tuyệt chiêu + lý do khắc chế) và vài "bọn phá đồ" ngoài đời của loại đó.
 * Số liệu món lấy theo khuôn vai đã cân bằng ở 3 tiệm đầu; máy làm màn chỉnh độ khó bằng máu quái.
 * Thêm loại mới = thêm 1 mục ở đây (tên đời thường, lý do có thật).
 */
import type { ElementType, EnemyTrait, TowerRole } from '../types';

export interface PestTemplate {
  name: string;
  element: ElementType;
  trait: Exclude<EnemyTrait, 'mini' | 'boss'>;
  reason: string;
}

export interface PlaceType {
  label: string;
  tower: {
    element: ElementType;
    role: TowerRole;
    names: [string, string, string, string]; // bậc 1, bậc 2, bậc 3A, bậc 3B
    ult: string;
    why: string; // vì sao khắc hành bị khắc
  };
  pests: PestTemplate[];
}

export const PLACE_TYPES: Record<string, PlaceType> = {
  quan_pho: {
    label: 'Quán phở',
    tower: { element: 'hoa', role: 'aoe_splash', names: ['Nồi Nước Lèo', 'Nồi Nước Lèo Lớn', 'Bếp Than Liu Riu', 'Nồi Hầm Xương Đêm'], ult: 'Sôi Sùng Sục', why: 'Hơi nóng nồi nước lèo xua chuột' },
    pests: [
      { name: 'Ruồi Bếp', element: 'moc', trait: 'flying', reason: 'Ruồi bu quanh quầy thịt' },
      { name: 'Chuột Cống', element: 'kim', trait: 'disruptor', reason: 'Chuột cắn bao bánh phở' },
    ],
  },
  banh_can: {
    label: 'Quán bánh căn',
    tower: { element: 'hoa', role: 'single_far', names: ['Khuôn Bánh Căn', 'Khuôn Đất Nung Đôi', 'Khuôn Bảy Lỗ', 'Khuôn Than Hồng'], ult: 'Đổ Bánh Liên Tay', why: 'Khuôn nóng hun lùi bọn gặm' },
    pests: [
      { name: 'Kiến Đường', element: 'moc', trait: 'fast', reason: 'Kiến bò vào chén nước chấm' },
      { name: 'Khói Bếp', element: 'hoa', trait: 'splitter', reason: 'Khói bếp than tản ra khắp quán' },
    ],
  },
  banh_uot: {
    label: 'Quán bánh ướt lòng gà',
    tower: { element: 'thuy', role: 'slow_aura', names: ['Nồi Hấp Bánh', 'Nồi Hấp Hai Tầng', 'Khăn Hấp Mỏng', 'Hơi Hấp Mù Mịt'], ult: 'Mây Hơi Nước', why: 'Hơi nước dập lửa khói' },
    pests: [
      { name: 'Ruồi Xanh', element: 'moc', trait: 'flying', reason: 'Ruồi bu đĩa lòng gà' },
      { name: 'Mèo Hoang', element: 'kim', trait: 'disruptor', reason: 'Mèo hoang rình lục đồ' },
    ],
  },
  banh_mi: {
    label: 'Lò bánh mì',
    tower: { element: 'tho', role: 'heavy_slow', names: ['Lò Gạch Bánh Mì', 'Lò Gạch Hai Cửa', 'Lò Củi Cổ', 'Xẻng Gỗ Ra Lò'], ult: 'Mẻ Bánh Nóng Hổi', why: 'Lò gạch khô ráo hút sạch hơi ẩm' },
    pests: [
      { name: 'Bụi Bột', element: 'tho', trait: 'tank', reason: 'Bao bột rách tung bụi' },
      { name: 'Mốc Bánh', element: 'moc', trait: 'healer', reason: 'Mốc lan từ ổ này sang ổ khác' },
    ],
  },
  cafe: {
    label: 'Quán cà phê',
    tower: { element: 'thuy', role: 'slow_aura', names: ['Phin Nhỏ Giọt', 'Phin Đôi', 'Bình Ủ Lạnh', 'Ấm Rót Cổ Ngỗng'], ult: 'Giọt Đắng Chậm Rãi', why: 'Nước pha xua cái nóng khét' },
    pests: [
      { name: 'Hơi Ẩm Hạt', element: 'thuy', trait: 'fast', reason: 'Hơi ẩm làm hạt cà phê mất mùi' },
      { name: 'Mốc Hạt Cà Phê', element: 'moc', trait: 'healer', reason: 'Bao hạt để ẩm là lên mốc' },
      { name: 'Kiến Bu Đường', element: 'moc', trait: 'fast', reason: 'Kiến bu hũ đường' },
    ],
  },
  may_xay: {
    label: 'Quán cà phê rang xay',
    tower: { element: 'kim', role: 'heavy_slow', names: ['Máy Xay Hạt', 'Máy Xay Cối Thép', 'Máy Rang Trống Quay', 'Cối Xay Tay Cổ'], ult: 'Xay Một Mẻ', why: 'Lưỡi thép nghiền nát mọt và mốc' },
    pests: [
      { name: 'Mọt Hạt', element: 'kim', trait: 'disruptor', reason: 'Mọt đục hạt trong kho' },
      { name: 'Khói Rang Khét', element: 'hoa', trait: 'splitter', reason: 'Rang quá lửa khói tản cả quán' },
    ],
  },
  tra: {
    label: 'Tiệm trà',
    tower: { element: 'moc', role: 'support_buff', names: ['Ấm Trà Gốm', 'Ấm Trà Tử Sa', 'Khay Trà Đạo', 'Ấm Ủ Hoa Nhài'], ult: 'Hương Trà Lan Toả', why: 'Hương trà thanh, gió thoảng thổi bay bụi' },
    pests: [{ name: 'Bụi Lá Khô', element: 'tho', trait: 'splitter', reason: 'Lá trà vụn tung bụi' }],
  },
  kem: {
    label: 'Tiệm kem',
    tower: { element: 'thuy', role: 'single_far', names: ['Muỗng Kem', 'Muỗng Kem Đôi', 'Ly Kem Bơ', 'Que Kem Lạnh Buốt'], ult: 'Mưa Kem Tuyết', why: 'Kem lạnh dập cái nóng' },
    pests: [{ name: 'Nắng Trưa', element: 'hoa', trait: 'flying', reason: 'Nắng làm kem chảy' }],
  },
  homestay: {
    label: 'Homestay',
    tower: { element: 'tho', role: 'support_buff', names: ['Chăn Len Ấm', 'Lò Sưởi Gạch', 'Giường Gỗ Thông', 'Bếp Củi Chung'], ult: 'Đêm Đà Lạt Ấm Áp', why: 'Nhà gạch khô ráo chặn hơi ẩm' },
    pests: [
      { name: 'Muỗi Đêm', element: 'moc', trait: 'flying', reason: 'Muỗi bay vào phòng' },
      { name: 'Sương Đêm', element: 'thuy', trait: 'fast', reason: 'Sương lùa qua khe cửa' },
    ],
  },
  sua_xe: {
    label: 'Tiệm sửa xe',
    tower: { element: 'kim', role: 'heavy_slow', names: ['Cờ Lê Thép', 'Mỏ Lết To', 'Búa Gò', 'Máy Bơm Hơi'], ult: 'Siết Ốc Liên Hoàn', why: 'Thép cứng gõ bay gỉ mục' },
    pests: [
      { name: 'Nhớt Tràn', element: 'tho', trait: 'tank', reason: 'Nhớt cũ đọng thành vũng' },
      { name: 'Gỉ Sét', element: 'kim', trait: 'healer', reason: 'Gỉ lan từ con ốc này sang con ốc khác' },
    ],
  },
  tiem_toc: {
    label: 'Tiệm tóc',
    tower: { element: 'kim', role: 'single_far', names: ['Kéo Cắt Tóc', 'Kéo Tỉa Mỏng', 'Tông Đơ Điện', 'Dao Cạo Bạc'], ult: 'Cắt Tóc Thần Tốc', why: 'Kéo bén tỉa gọn mọi thứ rối' },
    pests: [{ name: 'Tóc Rối', element: 'moc', trait: 'splitter', reason: 'Tóc rụng rối thành búi, gỡ ra lại tách đôi' }],
  },
  nha_thuoc: {
    label: 'Nhà thuốc',
    tower: { element: 'moc', role: 'support_buff', names: ['Tủ Thuốc Nam', 'Tủ Thuốc Hai Ngăn', 'Bình Dầu Gió', 'Cối Giã Thảo Dược'], ult: 'Thuốc Bổ Cả Phố', why: 'Thảo dược trị cái bệnh bụi bặm' },
    pests: [{ name: 'Vi Khuẩn Cảm Lạnh', element: 'thuy', trait: 'healer', reason: 'Trời lạnh ẩm dễ lây cảm' }],
  },
  tiem_may: {
    label: 'Tiệm may',
    tower: { element: 'kim', role: 'slow_aura', names: ['Kim Chỉ', 'Máy May Đạp Chân', 'Thước Dây Quấn', 'Kéo Cắt Vải Lớn'], ult: 'Khâu Một Đường Dài', why: 'Kim thép ghim chặt bọn phá vải' },
    pests: [{ name: 'Nhậy Ăn Vải', element: 'moc', trait: 'fast', reason: 'Nhậy cắn vải trong tủ' }],
  },
  tiem_hoa: {
    label: 'Tiệm hoa',
    tower: { element: 'thuy', role: 'single_far', names: ['Bình Tưới Hoa', 'Vòi Sen Nhỏ', 'Bình Phun Sương', 'Thùng Ngâm Hoa'], ult: 'Tưới Đẫm Cả Kệ', why: 'Tưới nước chống héo nắng' },
    pests: [
      { name: 'Rệp Đọt', element: 'moc', trait: 'fast', reason: 'Rệp bám đọt non' },
      { name: 'Nắng Gắt', element: 'hoa', trait: 'flying', reason: 'Nắng làm hoa héo' },
    ],
  },
  nha_sach: {
    label: 'Nhà sách / tiệm sách cũ',
    tower: { element: 'moc', role: 'slow_aura', names: ['Chồng Sách Dày', 'Kệ Sách Gỗ', 'Bộ Từ Điển', 'Thùng Sách Cũ'], ult: 'Đọc Chậm Lại', why: 'Gáy sách gỗ chặn bụi đất' },
    pests: [
      { name: 'Mối Mọt Sách', element: 'kim', trait: 'disruptor', reason: 'Mối đục kệ, mọt ăn giấy' },
      { name: 'Ẩm Giấy', element: 'thuy', trait: 'tank', reason: 'Sách để ẩm phồng giấy' },
    ],
  },
  giat_ui: {
    label: 'Tiệm giặt ủi',
    tower: { element: 'thuy', role: 'aoe_splash', names: ['Máy Giặt Lồng', 'Máy Giặt Công Nghiệp', 'Bàn Ủi Hơi', 'Xô Bọt Xà Phòng'], ult: 'Giặt Sạch Cả Phố', why: 'Nước và bọt dập vết cháy khét' },
    pests: [
      { name: 'Vết Bẩn Dai', element: 'tho', trait: 'tank', reason: 'Vết bùn bám áo khó giặt' },
      { name: 'Bọt Tràn', element: 'thuy', trait: 'splitter', reason: 'Bọt xà phòng tràn ra tách đôi' },
    ],
  },
  thue_xe: {
    label: 'Cho thuê xe máy',
    tower: { element: 'kim', role: 'single_far', names: ['Còi Xe Bíp', 'Đèn Pha', 'Xe Số Đời Cũ', 'Xe Ga Mới Cứng'], ult: 'Rồ Ga Một Vòng Phố', why: 'Khung thép chạy xuyên mọi vật cản' },
    pests: [{ name: 'Bùn Đường Dốc', element: 'tho', trait: 'tank', reason: 'Bùn bắn lên xe mùa mưa' }],
  },
  studio_anh: {
    label: 'Studio ảnh',
    tower: { element: 'hoa', role: 'slow_aura', names: ['Đèn Flash', 'Đèn Flash Đôi', 'Ô Phản Sáng', 'Máy Ảnh Phim'], ult: 'Chớp Một Phát', why: 'Ánh đèn nóng làm lùi bọn gặm kim loại' },
    pests: [{ name: 'Bụi Ống Kính', element: 'tho', trait: 'fast', reason: 'Bụi bám ống kính' }],
  },
  quan_bar: {
    label: 'Quán bar / quán nhạc',
    tower: { element: 'hoa', role: 'aoe_splash', names: ['Loa Thùng', 'Loa Đôi', 'Đèn Nháy Sân Khấu', 'Ban Nhạc Đêm'], ult: 'Nhạc Lên Cao Trào', why: 'Đèn nóng, loa rung xua bọn gặm' },
    pests: [{ name: 'Muỗi Đèn', element: 'moc', trait: 'flying', reason: 'Muỗi bu quanh đèn sân khấu' }],
  },
  tap_hoa: {
    label: 'Tiệm tạp hoá',
    tower: { element: 'tho', role: 'heavy_slow', names: ['Bao Gạo', 'Thùng Mì Gói', 'Két Nước Ngọt', 'Kệ Hàng Chất Đầy'], ult: 'Xếp Hàng Một Lèo', why: 'Đồ khô chất đống chặn hơi ẩm' },
    pests: [{ name: 'Chuột Kho', element: 'kim', trait: 'disruptor', reason: 'Chuột cắn bao hàng' }],
  },
  banh_ngot: {
    label: 'Tiệm bánh ngọt',
    tower: { element: 'hoa', role: 'aoe_splash', names: ['Lò Nướng Bánh', 'Lò Nướng Đối Lưu', 'Khay Bánh Vừa Ra Lò', 'Đèn Khò Đường'], ult: 'Thơm Lừng Cả Phố', why: 'Hơi nóng lò xua chuột' },
    pests: [{ name: 'Kiến Kem Bơ', element: 'moc', trait: 'fast', reason: 'Kiến bu lớp kem' }],
  },
};

/** Quái chung khi phố thiếu loại / thiếu hành */
export const GENERIC_PESTS: PestTemplate[] = [
  { name: 'Giọt Mưa Phố', element: 'thuy', trait: 'fast', reason: 'Mưa Đà Lạt' },
  { name: 'Bùn Lề Đường', element: 'tho', trait: 'tank', reason: 'Bùn đất mùa mưa' },
  { name: 'Lá Khô Gió Cuốn', element: 'moc', trait: 'flying', reason: 'Gió cuốn lá vào tiệm' },
  { name: 'Than Khói Đường Phố', element: 'hoa', trait: 'splitter', reason: 'Khói bếp than vỉa hè' },
  { name: 'Chuột Hẻm', element: 'kim', trait: 'disruptor', reason: 'Chuột chạy dọc hẻm' },
  { name: 'Rêu Mốc Tường', element: 'moc', trait: 'healer', reason: 'Tường ẩm lên rêu' },
];

/**
 * Phong cách đặt tên địa điểm trong game: "<loại ngắn> <tên cây / hoa / cảnh Đà Lạt>".
 * Không dùng tên quán thật (trừ tiệm của anh Kha). Máy làm màn chọn lần lượt, không trùng trong 1 phố.
 */
export const DALAT_NAME_WORDS = [
  'Mimosa', 'Dã Quỳ', 'Cẩm Tú Cầu', 'Mai Anh Đào', 'Thông Ba Lá', 'Sương Mai', 'Cúc Hoạ Mi', 'Atiso',
  'Bằng Lăng', 'Lan Hài', 'Sim Tím', 'Đồi Chè', 'Phố Núi', 'Mây Ngàn', 'Hồ Sương', 'Cỏ Hồng',
];

export const PLACE_SHORT: Record<string, string> = {
  quan_pho: 'Phở', banh_can: 'Bánh Căn', banh_uot: 'Bánh Ướt', banh_mi: 'Bánh Mì', cafe: 'Cà Phê', may_xay: 'Rang Xay',
  tra: 'Trà', kem: 'Kem', homestay: 'Homestay', sua_xe: 'Sửa Xe', tiem_toc: 'Tóc', nha_thuoc: 'Nhà Thuốc',
  tiem_may: 'May Đo', tiem_hoa: 'Hoa', nha_sach: 'Sách', giat_ui: 'Giặt Ủi', thue_xe: 'Thuê Xe', studio_anh: 'Studio',
  quan_bar: 'Quán Nhạc', tap_hoa: 'Tạp Hoá', banh_ngot: 'Bánh Ngọt',
};
