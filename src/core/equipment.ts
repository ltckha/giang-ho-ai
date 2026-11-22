/**
 * Trang bị chủ tiệm (Claude) — 10 món một chủ tiệm Đà Lạt bây giờ mang theo, mỗi món một loại.
 * Đi tiệm nào cũng mang theo (mặc trên người), thay cho "nâng cấp ngũ hành bằng sao".
 *
 * Mỗi món: 1 hành, 1 dòng chính (luôn có), 1–2 dòng ẩn (chỉ sáng khi được kích hoạt ngũ hành).
 * Kích hoạt: 10 ô nối thành vòng 1→2→…→10→1. Món ở ô trước SINH ra hành của món ô sau
 * (Kim sinh Thủy, Thủy sinh Mộc, Mộc sinh Hỏa, Hỏa sinh Thổ, Thổ sinh Kim) thì dòng ẩn món ô sau sáng.
 * Sáng đủ 10 → "Ngũ hành viên mãn". Tổng sức cộng từ đồ có trần để game vẫn khó.
 */
import { ALL_ELEMENTS, ELEMENT_GENERATES } from './elements';
import type { ElementType } from './types';

export const GEAR_SLOTS = [
  { id: 'hat', label: 'Mũ' },
  { id: 'glasses', label: 'Kính mắt' },
  { id: 'jacket', label: 'Áo khoác' },
  { id: 'belt', label: 'Dây nịt da' },
  { id: 'shoes', label: 'Giày' },
  { id: 'bag', label: 'Túi đeo chéo' },
  { id: 'wallet', label: 'Ví da' },
  { id: 'watch', label: 'Đồng hồ' },
  { id: 'phone', label: 'Điện thoại' },
  { id: 'umbrella', label: 'Ô dù' },
] as const;

export type GearSlotId = (typeof GEAR_SLOTS)[number]['id'];
export type GearRarity = 'thuong' | 'tot' | 'quy';
export type GearStatKind = 'elem_dmg' | 'all_dmg' | 'range' | 'speed' | 'start_coins' | 'lives' | 'coin_pct' | 'ult_cd';

export interface GearStat {
  kind: GearStatKind;
  value: number;
}

export interface GearItem {
  uid: string;
  slot: GearSlotId;
  name: string;
  element: ElementType;
  rarity: GearRarity;
  main: GearStat;
  hidden: GearStat[];
}

export const RARITY_LABEL: Record<GearRarity, string> = { thuong: 'Thường', tot: 'Tốt', quy: 'Quý' };
const RARITY_SCALE: Record<GearRarity, number> = { thuong: 1, tot: 1.5, quy: 2 };

/** Tên mẫu theo loại × hành (đủ 5 hành mỗi loại để luôn xếp được vòng tương sinh) */
export const GEAR_NAMES: Record<GearSlotId, Record<ElementType, string>> = {
  hat: { moc: 'Mũ Len Xanh Rêu', kim: 'Nón Bảo Hiểm Bạc', thuy: 'Mũ Bucket Vải Dù', hoa: 'Mũ Lưỡi Trai Đỏ', tho: 'Mũ Cói' },
  glasses: { hoa: 'Kính Râm Tròng Cam', kim: 'Kính Gọng Kim Loại', moc: 'Kính Gọng Tre', thuy: 'Kính Tròng Xanh Biển', tho: 'Kính Gọng Sừng' },
  jacket: { thuy: 'Áo Mưa Trong', tho: 'Áo Khoác Dạ Nâu', moc: 'Áo Khoác Kaki Xanh', hoa: 'Áo Phao Đỏ', kim: 'Áo Gió Bạc' },
  belt: { tho: 'Dây Nịt Da Bò', kim: 'Dây Nịt Khóa Đồng', moc: 'Dây Nịt Vải Bố', thuy: 'Dây Nịt Da Xanh Than', hoa: 'Dây Nịt Da Đỏ Đô' },
  shoes: { tho: 'Bốt Da Nâu', moc: 'Giày Vải', thuy: 'Sandal Quai Hậu', hoa: 'Giày Thể Thao Đỏ', kim: 'Giày Tây Mũi Bạc' },
  bag: { tho: 'Túi Da Đeo Chéo', moc: 'Túi Vải Canvas', thuy: 'Túi Chống Nước', hoa: 'Túi Đeo Hông Đỏ', kim: 'Túi Khóa Kim Loại' },
  wallet: { kim: 'Ví Gập Khóa Bấm', thuy: 'Ví Dài Xanh Đậm', tho: 'Ví Da Thủ Công', moc: 'Ví Vải Thêu', hoa: 'Ví Da Đỏ' },
  watch: { kim: 'Đồng Hồ Dây Kim Loại', tho: 'Đồng Hồ Dây Da', moc: 'Đồng Hồ Mặt Gỗ', thuy: 'Đồng Hồ Chống Nước', hoa: 'Đồng Hồ Mặt Đỏ' },
  phone: { hoa: 'Điện Thoại Ốp Đỏ', thuy: 'Điện Thoại Ốp Xanh', kim: 'Điện Thoại Vỏ Nhôm', moc: 'Điện Thoại Ốp Gỗ', tho: 'Điện Thoại Ốp Da' },
  umbrella: { thuy: 'Dù Gấp Xanh', moc: 'Dù Cán Gỗ', kim: 'Dù Khung Thép', hoa: 'Dù Đỏ', tho: 'Dù Vải Nâu' },
};

/** Dòng chính theo loại (giá trị ở hạng Thường) — elem_dmg áp cho món đặt cùng hành với trang bị */
const SLOT_MAIN: Record<GearSlotId, GearStat> = {
  hat: { kind: 'elem_dmg', value: 0.06 },
  glasses: { kind: 'range', value: 0.04 },
  jacket: { kind: 'elem_dmg', value: 0.06 },
  belt: { kind: 'elem_dmg', value: 0.05 },
  shoes: { kind: 'speed', value: 0.04 },
  bag: { kind: 'start_coins', value: 12 },
  wallet: { kind: 'coin_pct', value: 0.05 },
  watch: { kind: 'ult_cd', value: 0.08 },
  phone: { kind: 'all_dmg', value: 0.03 },
  umbrella: { kind: 'lives', value: 1 },
};

/** Dòng ẩn theo hành của món (sáng khi được tương sinh) */
const ELEMENT_HIDDEN: Record<ElementType, GearStat> = {
  kim: { kind: 'all_dmg', value: 0.03 },
  moc: { kind: 'speed', value: 0.03 },
  thuy: { kind: 'lives', value: 1 },
  hoa: { kind: 'elem_dmg', value: 0.05 },
  tho: { kind: 'start_coins', value: 10 },
};
/** Dòng ẩn thứ 2 cho đồ Quý */
const SLOT_HIDDEN_2: Record<GearSlotId, GearStat> = {
  hat: { kind: 'range', value: 0.03 },
  glasses: { kind: 'all_dmg', value: 0.02 },
  jacket: { kind: 'lives', value: 1 },
  belt: { kind: 'speed', value: 0.03 },
  shoes: { kind: 'range', value: 0.03 },
  bag: { kind: 'coin_pct', value: 0.04 },
  wallet: { kind: 'start_coins', value: 10 },
  watch: { kind: 'speed', value: 0.03 },
  phone: { kind: 'ult_cd', value: 0.06 },
  umbrella: { kind: 'all_dmg', value: 0.02 },
};

/** Trần tổng cộng từ đồ */
export const GEAR_CAPS: Record<GearStatKind, number> = {
  elem_dmg: 0.4, // cộng với all_dmg, tính chung trần 40% cho mỗi món đặt
  all_dmg: 0.4,
  range: 0.2,
  speed: 0.2,
  start_coins: 60,
  lives: 5,
  coin_pct: 0.2,
  ult_cd: 0.4,
};

/** Ngũ hành viên mãn: đủ 10 món và cả 10 đều sáng */
export const FULL_RING_BONUS = { allDmg: 0.15, ultCd: 0.3 };

function scaleStat(st: GearStat, rarity: GearRarity): GearStat {
  const v = st.value * RARITY_SCALE[rarity];
  const isInt = st.kind === 'start_coins' || st.kind === 'lives';
  return { kind: st.kind, value: isInt ? Math.round(v) : Math.round(v * 1000) / 1000 };
}

export function makeGearItem(slot: GearSlotId, element: ElementType, rarity: GearRarity, uid: string): GearItem {
  const hidden = [scaleStat(ELEMENT_HIDDEN[element], rarity)];
  if (rarity === 'quy') hidden.push(scaleStat(SLOT_HIDDEN_2[slot], rarity));
  return { uid, slot, name: GEAR_NAMES[slot][element], element, rarity, main: scaleStat(SLOT_MAIN[slot], rarity), hidden };
}

export type Equipped = Partial<Record<GearSlotId, GearItem>>;

/** Ô nào đang sáng dòng ẩn */
export function activatedSlots(eq: Equipped): Set<GearSlotId> {
  const out = new Set<GearSlotId>();
  GEAR_SLOTS.forEach((s, i) => {
    const prev = GEAR_SLOTS[(i + GEAR_SLOTS.length - 1) % GEAR_SLOTS.length]!;
    const cur = eq[s.id];
    const before = eq[prev.id];
    if (cur && before && ELEMENT_GENERATES[before.element] === cur.element) out.add(s.id);
  });
  return out;
}

export function isFullRing(eq: Equipped): boolean {
  return GEAR_SLOTS.every((s) => eq[s.id]) && activatedSlots(eq).size === GEAR_SLOTS.length;
}

export interface GearBonus {
  elementDmg: Partial<Record<ElementType, number>>;
  allDmg: number;
  rangePct: number;
  speedPct: number;
  startCoins: number;
  lives: number;
  coinPct: number;
  ultCdPct: number;
  fullRing: boolean;
  activeCount: number;
}

export const EMPTY_GEAR_BONUS: GearBonus = {
  elementDmg: {}, allDmg: 0, rangePct: 0, speedPct: 0, startCoins: 0, lives: 0, coinPct: 0, ultCdPct: 0, fullRing: false, activeCount: 0,
};

/** Cộng dồn tác dụng của đồ đang mặc (đã áp trần) */
export function computeGearBonus(eq: Equipped): GearBonus {
  const act = activatedSlots(eq);
  const b: GearBonus = { ...EMPTY_GEAR_BONUS, elementDmg: {}, activeCount: act.size };
  const add = (st: GearStat, item: GearItem) => {
    switch (st.kind) {
      case 'elem_dmg': b.elementDmg[item.element] = (b.elementDmg[item.element] ?? 0) + st.value; break;
      case 'all_dmg': b.allDmg += st.value; break;
      case 'range': b.rangePct += st.value; break;
      case 'speed': b.speedPct += st.value; break;
      case 'start_coins': b.startCoins += st.value; break;
      case 'lives': b.lives += st.value; break;
      case 'coin_pct': b.coinPct += st.value; break;
      case 'ult_cd': b.ultCdPct += st.value; break;
    }
  };
  for (const s of GEAR_SLOTS) {
    const item = eq[s.id];
    if (!item) continue;
    add(item.main, item);
    if (act.has(s.id)) item.hidden.forEach((h) => add(h, item));
  }
  b.fullRing = isFullRing(eq);
  if (b.fullRing) {
    b.allDmg += FULL_RING_BONUS.allDmg;
    b.ultCdPct += FULL_RING_BONUS.ultCd;
  }
  // Trần
  b.allDmg = Math.min(b.allDmg, GEAR_CAPS.all_dmg);
  for (const el of ALL_ELEMENTS) {
    if (b.elementDmg[el] !== undefined) b.elementDmg[el] = Math.min(b.elementDmg[el]!, GEAR_CAPS.elem_dmg - b.allDmg);
  }
  b.rangePct = Math.min(b.rangePct, GEAR_CAPS.range);
  b.speedPct = Math.min(b.speedPct, GEAR_CAPS.speed);
  b.startCoins = Math.min(b.startCoins, GEAR_CAPS.start_coins);
  b.lives = Math.min(b.lives, GEAR_CAPS.lives);
  b.coinPct = Math.min(b.coinPct, GEAR_CAPS.coin_pct);
  b.ultCdPct = Math.min(b.ultCdPct, GEAR_CAPS.ult_cd);
  return b;
}

/** Sức cộng cho 1 món đặt có hành `el` (đã áp trần chung 40%) */
export function gearDamageFor(b: GearBonus, el: ElementType): number {
  return Math.min(GEAR_CAPS.elem_dmg, b.allDmg + (b.elementDmg[el] ?? 0));
}

/**
 * Rơi đồ khi thắng màn: số món = số sao (1–3). Hạng: màn sau & nhiều sao dễ ra đồ tốt hơn.
 */
export function rollStageDrops(stageNumber: number, stars: 1 | 2 | 3, rng: () => number, uidPrefix: string): GearItem[] {
  const items: GearItem[] = [];
  const quyChance = 0.05 + 0.05 * (stageNumber - 1) + (stars === 3 ? 0.05 : 0);
  const totChance = 0.3 + 0.05 * (stageNumber - 1);
  for (let i = 0; i < stars; i++) {
    const slot = GEAR_SLOTS[Math.floor(rng() * GEAR_SLOTS.length)]!.id;
    const element = ALL_ELEMENTS[Math.floor(rng() * ALL_ELEMENTS.length)]!;
    const r = rng();
    const rarity: GearRarity = r < quyChance ? 'quy' : r < quyChance + totChance ? 'tot' : 'thuong';
    items.push(makeGearItem(slot, element, rarity, `${uidPrefix}_${i}`));
  }
  return items;
}

/** Bộ khởi đầu: mũ Mộc + kính Hỏa (Mộc sinh Hỏa → kính sáng dòng ẩn, để người chơi thấy cách kích hoạt) */
export function starterGear(): GearItem[] {
  return [makeGearItem('hat', 'moc', 'thuong', 'starter_hat'), makeGearItem('glasses', 'hoa', 'thuong', 'starter_glasses')];
}

const STAT_TEXT: Record<GearStatKind, (v: number) => string> = {
  elem_dmg: (v) => `+${Math.round(v * 100)}% sức món cùng hành`,
  all_dmg: (v) => `+${Math.round(v * 100)}% sức mọi món`,
  range: (v) => `+${Math.round(v * 100)}% tầm đánh`,
  speed: (v) => `+${Math.round(v * 100)}% tốc độ đánh`,
  start_coins: (v) => `+${v} xu đầu màn`,
  lives: (v) => `+${v} mạng`,
  coin_pct: (v) => `+${Math.round(v * 100)}% xu rơi ra`,
  ult_cd: (v) => `tuyệt chiêu hồi nhanh ${Math.round(v * 100)}%`,
};

export function statText(st: GearStat): string {
  return STAT_TEXT[st.kind](st.value);
}
