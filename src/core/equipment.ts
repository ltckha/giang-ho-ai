/**
 * Trang bị chủ tiệm v2 (Claude) — 10 món một chủ tiệm Đà Lạt bây giờ mang theo, mặc trên người, đi tiệm nào cũng dùng.
 *
 * Mỗi món: 1 hành, tối đa 3 dòng hiện + 3 dòng ẩn (theo hạng). Tên dòng đời thường, vui nhộn.
 * Kích hoạt dòng ẩn: mỗi ô có 2 món "chống lưng" cố định — ô liền trước (A) và ô cách 6 bước (B).
 *   Mỗi món chống lưng có hành SINH ra hành của món này → sáng 1 dòng ẩn (2 món sinh → sáng 2 dòng).
 *   Dòng ẩn cuối chỉ sáng khi mặc đủ cả bộ ngũ hành (10 món, món nào cũng được cả 2 chống lưng sinh).
 *   (Kim sinh Thủy, Thủy sinh Mộc, Mộc sinh Hỏa, Hỏa sinh Thổ, Thổ sinh Kim.)
 *   Xếp 10 món theo vòng ngũ hành lặp 2 lần thì sáng được hết → Ngũ hành viên mãn.
 * Bộ đồ: mặc đủ số món trong bộ có thưởng thêm. Mọi tác dụng có trần để game vẫn khó.
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
export type GearRarity = 'thuong' | 'tot' | 'xin' | 'hieu';
export type GearStatKind =
  | 'elem_dmg'
  | 'all_dmg'
  | 'range'
  | 'speed'
  | 'start_coins'
  | 'lives'
  | 'coin_pct'
  | 'ult_cd'
  | 'ult_cost'
  | 'upgrade_discount'
  | 'build_discount'
  | 'sell_refund'
  | 'counter_dmg'
  | 'synergy_bonus'
  | 'slow_dur'
  | 'weaken_thuy'
  | 'weaken_moc'
  | 'extra_drop'
  | 'boss_dmg';

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
  visible: GearStat[];
  hidden: GearStat[];
}

export const RARITY_LABEL: Record<GearRarity, string> = { thuong: 'Thường', tot: 'Tốt', xin: 'Xịn', hieu: 'Hàng hiệu' };
export const RARITY_LINES: Record<GearRarity, number> = { thuong: 1, tot: 2, xin: 3, hieu: 3 };
const RARITY_SCALE: Record<GearRarity, number> = { thuong: 1, tot: 1.4, xin: 1.8, hieu: 2.2 };

/** Tên dòng (vui, đời thường) */
export const STAT_NAME: Record<GearStatKind, string> = {
  elem_dmg: 'Đúng gu',
  all_dmg: 'Tự tin',
  range: 'Wifi mạnh',
  speed: 'Cà phê sữa đá',
  start_coins: 'Freeship',
  lives: 'Chống nước',
  coin_pct: 'Ví đầy',
  ult_cd: 'Pin trâu',
  ult_cost: 'Sạc nhanh',
  upgrade_discount: 'Mã giảm giá',
  build_discount: 'Flash sale',
  sell_refund: 'Bảo hành 12 tháng',
  counter_dmg: 'Bắt trend',
  synergy_bonus: 'Combo',
  slow_dur: 'Gió Đà Lạt',
  weaken_thuy: 'Đi mưa không ướt',
  weaken_moc: 'Xịt côn trùng',
  extra_drop: 'Khách quen',
  boss_dmg: 'Săn trùm',
};

/** Giá trị gốc ở hạng Thường */
const BASE_VALUE: Record<GearStatKind, number> = {
  elem_dmg: 0.05,
  all_dmg: 0.025,
  range: 0.04,
  speed: 0.04,
  start_coins: 10,
  lives: 1,
  coin_pct: 0.05,
  ult_cd: 0.06,
  ult_cost: 10,
  upgrade_discount: 0.04,
  build_discount: 0.04,
  sell_refund: 0.03,
  counter_dmg: 0.06,
  synergy_bonus: 0.03,
  slow_dur: 0.08,
  weaken_thuy: 0.04,
  weaken_moc: 0.04,
  extra_drop: 1,
  boss_dmg: 0.06,
};
const INT_KINDS = new Set<GearStatKind>(['start_coins', 'lives', 'ult_cost', 'extra_drop']);

/** Trần tổng cộng (sau khi cộng mọi đồ + bộ) */
export const GEAR_CAPS: Record<GearStatKind, number> = {
  elem_dmg: 0.4, // cộng chung với all_dmg: tối đa 40% cho mỗi món đặt
  all_dmg: 0.4,
  range: 0.2,
  speed: 0.2,
  start_coins: 60,
  lives: 5,
  coin_pct: 0.2,
  ult_cd: 0.4,
  ult_cost: 50,
  upgrade_discount: 0.15,
  build_discount: 0.12,
  sell_refund: 0.15, // 70% → tối đa 85%
  counter_dmg: 0.3,
  synergy_bonus: 0.1, // +15% → tối đa +25%
  slow_dur: 0.3,
  weaken_thuy: 0.2,
  weaken_moc: 0.2,
  extra_drop: 2,
  boss_dmg: 0.3,
};

/** Dòng chính (dòng hiện đầu tiên) theo loại món */
const SLOT_MAIN: Record<GearSlotId, GearStatKind> = {
  hat: 'elem_dmg',
  glasses: 'range',
  jacket: 'lives',
  belt: 'elem_dmg',
  shoes: 'speed',
  bag: 'start_coins',
  wallet: 'coin_pct',
  watch: 'ult_cd',
  phone: 'all_dmg',
  umbrella: 'weaken_thuy',
};

/** Các dòng có thể ra thêm theo loại món (hợp lẽ đời thường) */
const SLOT_POOL: Record<GearSlotId, GearStatKind[]> = {
  hat: ['elem_dmg', 'synergy_bonus', 'weaken_moc', 'slow_dur', 'all_dmg'],
  glasses: ['range', 'counter_dmg', 'boss_dmg', 'all_dmg'],
  jacket: ['lives', 'weaken_thuy', 'elem_dmg', 'slow_dur'],
  belt: ['elem_dmg', 'all_dmg', 'boss_dmg', 'counter_dmg'],
  shoes: ['speed', 'slow_dur', 'range', 'weaken_moc'],
  bag: ['start_coins', 'extra_drop', 'build_discount', 'coin_pct'],
  wallet: ['coin_pct', 'upgrade_discount', 'sell_refund', 'build_discount', 'start_coins'],
  watch: ['ult_cd', 'speed', 'ult_cost', 'synergy_bonus'],
  phone: ['all_dmg', 'ult_cd', 'ult_cost', 'range', 'counter_dmg'],
  umbrella: ['weaken_thuy', 'lives', 'slow_dur', 'extra_drop'],
};

/** Tên mẫu theo loại × hành */
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

/** Tên đồ Hàng hiệu (vui) */
export const LEGEND_NAMES: Record<GearSlotId, string> = {
  hat: 'Mũ Len Bà Ngoại Đan',
  glasses: 'Kính Nhìn Xuyên Mưa',
  jacket: 'Áo Khoác Mặc Bốn Mùa',
  belt: 'Dây Nịt Không Bao Giờ Chật',
  shoes: 'Bốt Lội Bùn Không Dính',
  bag: 'Túi Đựng Cả Thế Giới',
  wallet: 'Ví Đầy Mã Giảm Giá',
  watch: 'Đồng Hồ Không Bao Giờ Trễ',
  phone: 'Điện Thoại Pin 3 Ngày',
  umbrella: 'Ô Dù Chống Bão Cấp 12',
};

/** Bộ đồ: mặc đủ món (đúng loại + đúng hành) */
export interface GearSet {
  id: string;
  name: string;
  pieces: { slot: GearSlotId; element: ElementType }[];
  bonuses: { count: number; stats: GearStat[] }[];
}

export const GEAR_SETS: GearSet[] = [
  {
    id: 'di_mua',
    name: 'Bộ Đi Mưa',
    pieces: [
      { slot: 'jacket', element: 'thuy' },
      { slot: 'umbrella', element: 'thuy' },
      { slot: 'shoes', element: 'thuy' },
    ],
    bonuses: [
      { count: 2, stats: [{ kind: 'lives', value: 1 }] },
      { count: 3, stats: [{ kind: 'weaken_thuy', value: 0.1 }] },
    ],
  },
  {
    id: 'phuot',
    name: 'Bộ Phượt Đà Lạt',
    pieces: [
      { slot: 'hat', element: 'moc' },
      { slot: 'jacket', element: 'moc' },
      { slot: 'bag', element: 'moc' },
      { slot: 'shoes', element: 'moc' },
    ],
    bonuses: [
      { count: 2, stats: [{ kind: 'slow_dur', value: 0.1 }] },
      { count: 4, stats: [{ kind: 'speed', value: 0.08 }] },
    ],
  },
  {
    id: 'van_phong',
    name: 'Bộ Dân Văn Phòng',
    pieces: [
      { slot: 'watch', element: 'kim' },
      { slot: 'shoes', element: 'kim' },
      { slot: 'phone', element: 'kim' },
      { slot: 'belt', element: 'kim' },
    ],
    bonuses: [
      { count: 2, stats: [{ kind: 'ult_cd', value: 0.1 }] },
      { count: 4, stats: [{ kind: 'coin_pct', value: 0.1 }] },
    ],
  },
  {
    id: 'chu_tiem_xin',
    name: 'Bộ Chủ Tiệm Xịn (đồ da)',
    pieces: [
      { slot: 'belt', element: 'tho' },
      { slot: 'wallet', element: 'tho' },
      { slot: 'shoes', element: 'tho' },
      { slot: 'bag', element: 'tho' },
    ],
    bonuses: [
      { count: 2, stats: [{ kind: 'all_dmg', value: 0.04 }] },
      { count: 4, stats: [{ kind: 'all_dmg', value: 0.06 }, { kind: 'start_coins', value: 20 }] },
    ],
  },
];

/** Thưởng thêm khi Ngũ hành viên mãn */
export const FULL_RING_BONUS: GearStat[] = [
  { kind: 'all_dmg', value: 0.15 },
  { kind: 'ult_cd', value: 0.3 },
];

function statValue(kind: GearStatKind, rarity: GearRarity): number {
  const v = BASE_VALUE[kind] * RARITY_SCALE[rarity];
  if (INT_KINDS.has(kind)) return kind === 'extra_drop' || kind === 'lives' ? Math.max(1, Math.floor(v)) : Math.round(v);
  return Math.round(v * 1000) / 1000;
}

/**
 * Tạo món. `rng` quyết định các dòng phụ (dòng hiện đầu tiên luôn là dòng chính của loại món).
 */
export function makeGearItem(slot: GearSlotId, element: ElementType, rarity: GearRarity, uid: string, rng: () => number = Math.random): GearItem {
  const n = RARITY_LINES[rarity];
  const pool = SLOT_POOL[slot];
  const pickLines = (count: number, first?: GearStatKind, avoid: GearStatKind[] = []): GearStat[] => {
    const kinds: GearStatKind[] = first ? [first] : [];
    let guard = 0;
    while (kinds.length < count && guard++ < 60) {
      const k = pool[Math.floor(rng() * pool.length)]!;
      // tránh trùng dòng hiện nếu còn lựa chọn khác
      if (kinds.includes(k)) continue;
      if (avoid.includes(k) && guard < 40 && pool.some((x) => !kinds.includes(x) && !avoid.includes(x))) continue;
      kinds.push(k);
    }
    return kinds.map((k) => ({ kind: k, value: statValue(k, rarity) }));
  };
  const visible = pickLines(n, SLOT_MAIN[slot]);
  return {
    uid,
    slot,
    name: rarity === 'hieu' ? LEGEND_NAMES[slot] : GEAR_NAMES[slot][element],
    element,
    rarity,
    visible,
    hidden: pickLines(n, undefined, visible.map((v) => v.kind)),
  };
}

export type Equipped = Partial<Record<GearSlotId, GearItem>>;

/** 2 ô "chống lưng" của ô thứ i: ô liền trước (A) và ô cách 6 bước (B) */
export function supporterSlots(slot: GearSlotId): [GearSlotId, GearSlotId] {
  const i = GEAR_SLOTS.findIndex((s) => s.id === slot);
  const n = GEAR_SLOTS.length;
  return [GEAR_SLOTS[(i + n - 1) % n]!.id, GEAR_SLOTS[(i + n - 6) % n]!.id];
}

function supportFlags(eq: Equipped): Partial<Record<GearSlotId, { a: boolean; b: boolean }>> {
  const out: Partial<Record<GearSlotId, { a: boolean; b: boolean }>> = {};
  for (const s of GEAR_SLOTS) {
    const item = eq[s.id];
    if (!item) continue;
    const [a, b] = supporterSlots(s.id);
    out[s.id] = {
      a: !!eq[a] && ELEMENT_GENERATES[eq[a]!.element] === item.element,
      b: !!eq[b] && ELEMENT_GENERATES[eq[b]!.element] === item.element,
    };
  }
  return out;
}

/** Ngũ hành viên mãn: đủ 10 món và món nào cũng được cả 2 món chống lưng sinh ra */
export function isFullRing(eq: Equipped): boolean {
  const f = supportFlags(eq);
  return GEAR_SLOTS.every((s) => eq[s.id] && f[s.id]?.a && f[s.id]?.b);
}

/**
 * Số dòng ẩn đang sáng của mỗi ô (anh Kha chốt):
 * - Mỗi món chống lưng sinh ra hành của món này → sáng 1 dòng (tối đa 2 dòng).
 * - Dòng ẩn cuối (dòng 3) chỉ sáng khi mặc đủ cả bộ ngũ hành (Ngũ hành viên mãn).
 */
export function activatedHiddenCount(eq: Equipped): Partial<Record<GearSlotId, number>> {
  const f = supportFlags(eq);
  const full = isFullRing(eq);
  const out: Partial<Record<GearSlotId, number>> = {};
  for (const s of GEAR_SLOTS) {
    const item = eq[s.id];
    if (!item) continue;
    const lines = (f[s.id]?.a ? 1 : 0) + (f[s.id]?.b ? 1 : 0) + (full ? 1 : 0);
    out[s.id] = Math.min(lines, item.hidden.length);
  }
  return out;
}

/** Ô có ít nhất 1 dòng ẩn sáng */
export function activatedSlots(eq: Equipped): Set<GearSlotId> {
  const c = activatedHiddenCount(eq);
  return new Set(GEAR_SLOTS.filter((s) => (c[s.id] ?? 0) > 0).map((s) => s.id));
}

/** Bộ đồ đang kích hoạt: [bộ, số món đang mặc] */
export function activeSets(eq: Equipped): { set: GearSet; count: number }[] {
  return GEAR_SETS.map((set) => ({
    set,
    count: set.pieces.filter((p) => eq[p.slot]?.element === p.element).length,
  })).filter((x) => x.set.bonuses.some((b) => x.count >= b.count));
}

export interface GearBonus {
  elementDmg: Partial<Record<ElementType, number>>;
  stats: Record<GearStatKind, number>;
  fullRing: boolean;
  activeLines: number;
  totalHiddenLines: number;
  sets: { id: string; name: string; count: number }[];
  // Lối tắt cho engine (đã áp trần)
  allDmg: number;
  rangePct: number;
  speedPct: number;
  startCoins: number;
  lives: number;
  coinPct: number;
  ultCdPct: number;
}

const ZERO_STATS = (): Record<GearStatKind, number> =>
  Object.fromEntries(Object.keys(BASE_VALUE).map((k) => [k, 0])) as Record<GearStatKind, number>;

export const EMPTY_GEAR_BONUS: GearBonus = {
  elementDmg: {},
  stats: ZERO_STATS(),
  fullRing: false,
  activeLines: 0,
  totalHiddenLines: 0,
  sets: [],
  allDmg: 0,
  rangePct: 0,
  speedPct: 0,
  startCoins: 0,
  lives: 0,
  coinPct: 0,
  ultCdPct: 0,
};

/** Cộng dồn tác dụng của đồ đang mặc + bộ + viên mãn (đã áp trần) */
export function computeGearBonus(eq: Equipped): GearBonus {
  const act = activatedHiddenCount(eq);
  const stats = ZERO_STATS();
  const elementDmg: Partial<Record<ElementType, number>> = {};
  let activeLines = 0;
  let totalHidden = 0;
  const add = (st: GearStat, el?: ElementType) => {
    if (st.kind === 'elem_dmg' && el) elementDmg[el] = (elementDmg[el] ?? 0) + st.value;
    else stats[st.kind] += st.value;
  };
  for (const s of GEAR_SLOTS) {
    const item = eq[s.id];
    if (!item) continue;
    item.visible.forEach((v) => add(v, item.element));
    const on = act[s.id] ?? 0;
    totalHidden += item.hidden.length;
    activeLines += on;
    item.hidden.slice(0, on).forEach((h) => add(h, item.element));
  }
  const sets = activeSets(eq);
  for (const { set, count } of sets) {
    for (const b of set.bonuses) if (count >= b.count) b.stats.forEach((st) => add(st, set.pieces[0]!.element));
  }
  const fullRing = isFullRing(eq);
  if (fullRing) FULL_RING_BONUS.forEach((st) => add(st));

  for (const k of Object.keys(stats) as GearStatKind[]) stats[k] = Math.min(stats[k], GEAR_CAPS[k]);
  for (const el of ALL_ELEMENTS) {
    if (elementDmg[el] !== undefined) elementDmg[el] = Math.max(0, Math.min(elementDmg[el]!, GEAR_CAPS.elem_dmg - stats.all_dmg));
  }
  return {
    elementDmg,
    stats,
    fullRing,
    activeLines,
    totalHiddenLines: totalHidden,
    sets: sets.map((x) => ({ id: x.set.id, name: x.set.name, count: x.count })),
    allDmg: stats.all_dmg,
    rangePct: stats.range,
    speedPct: stats.speed,
    startCoins: stats.start_coins,
    lives: stats.lives,
    coinPct: stats.coin_pct,
    ultCdPct: stats.ult_cd,
  };
}

/** Sức cộng cho 1 món đặt có hành `el` (đã áp trần chung 40%) */
export function gearDamageFor(b: GearBonus, el: ElementType): number {
  return Math.min(GEAR_CAPS.elem_dmg, b.allDmg + (b.elementDmg[el] ?? 0));
}

/** Rơi đồ khi thắng màn: số món = số sao (+ "Khách quen"). Màn sau & nhiều sao dễ ra đồ hạng cao. */
export function rollStageDrops(stageNumber: number, stars: 1 | 2 | 3, rng: () => number, uidPrefix: string, extra = 0): GearItem[] {
  const items: GearItem[] = [];
  const hieu = 0.02 + 0.02 * (stageNumber - 1) + (stars === 3 ? 0.02 : 0);
  const xin = 0.08 + 0.04 * (stageNumber - 1) + (stars === 3 ? 0.04 : 0);
  const tot = 0.3 + 0.05 * (stageNumber - 1);
  for (let i = 0; i < stars + extra; i++) {
    const slot = GEAR_SLOTS[Math.floor(rng() * GEAR_SLOTS.length)]!.id;
    const element = ALL_ELEMENTS[Math.floor(rng() * ALL_ELEMENTS.length)]!;
    const r = rng();
    const rarity: GearRarity = r < hieu ? 'hieu' : r < hieu + xin ? 'xin' : r < hieu + xin + tot ? 'tot' : 'thuong';
    items.push(makeGearItem(slot, element, rarity, `${uidPrefix}_${i}`, rng));
  }
  return items;
}

/** Bộ khởi đầu: Mũ (Mộc) + Kính (Hỏa): mũ là "chống lưng A" của kính, Mộc sinh Hỏa → kính sáng 1 dòng ẩn */
export function starterGear(): GearItem[] {
  let s = 11;
  const rng = () => ((s = (s * 1664525 + 1013904223) % 4294967296), s / 4294967296);
  return [makeGearItem('hat', 'moc', 'tot', 'starter_hat', rng), makeGearItem('glasses', 'hoa', 'tot', 'starter_glasses', rng)];
}

const SAFE_ID = /^[A-Za-z0-9_-]{1,48}$/;
function cleanStats(raw: unknown): GearStat[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is GearStat => !!x && typeof x === 'object' && (x as GearStat).kind in STAT_NAME && Number.isFinite((x as GearStat).value))
    .slice(0, 4)
    .map((x) => ({ kind: x.kind, value: Math.max(-1000, Math.min(1000, x.value)) }));
}

/**
 * Đọc 1 món đồ từ bản lưu (cả bản cũ main + hidden). Đánh giá độc lập 25/11 (C3): KHÔNG tin dữ liệu trong bản lưu —
 * ô, hành, hạng, loại chỉ số phải nằm trong danh sách cho phép; tên món tạo lại từ bảng tên (không lấy chữ trong bản lưu),
 * mã món chỉ gồm chữ / số / gạch. Món hỏng → bỏ món đó, không làm hỏng cả bản lưu.
 */
export function migrateGearItem(raw: unknown): GearItem | null {
  const it = raw as Partial<GearItem> & { main?: GearStat; rarity?: string };
  if (!it || typeof it !== 'object') return null;
  const slot = it.slot as GearSlotId;
  if (!GEAR_SLOTS.some((g) => g.id === slot)) return null;
  if (!ALL_ELEMENTS.includes(it.element as ElementType)) return null;
  if (typeof it.uid !== 'string' || !SAFE_ID.test(it.uid)) return null;
  const element = it.element as ElementType;
  const oldR = String(it.rarity);
  const rarity: GearRarity = oldR === 'quy' || oldR === 'xin' ? 'xin' : oldR === 'hieu' ? 'hieu' : oldR === 'tot' ? 'tot' : 'thuong';
  let visible = cleanStats(it.visible);
  if (!visible.length) visible = it.main ? cleanStats([it.main]) : [];
  if (!visible.length) visible = [{ kind: SLOT_MAIN[slot], value: statValue(SLOT_MAIN[slot], rarity) }];
  return {
    uid: it.uid,
    slot,
    name: rarity === 'hieu' ? LEGEND_NAMES[slot] : GEAR_NAMES[slot][element],
    element,
    rarity,
    visible,
    hidden: cleanStats(it.hidden),
  };
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
  ult_cost: (v) => `bậc 4 rẻ ${v} xu`,
  upgrade_discount: (v) => `nâng cấp rẻ ${Math.round(v * 100)}%`,
  build_discount: (v) => `đặt món rẻ ${Math.round(v * 100)}%`,
  sell_refund: (v) => `bán lại hoàn thêm ${Math.round(v * 100)}%`,
  counter_dmg: (v) => `"Trúng tủ!" mạnh thêm ${Math.round(v * 100)}%`,
  synergy_bonus: (v) => `tương sinh mạnh thêm ${Math.round(v * 100)}%`,
  slow_dur: (v) => `làm chậm lâu hơn ${Math.round(v * 100)}%`,
  weaken_thuy: (v) => `quái hành Thủy vào tiệm mất ${Math.round(v * 100)}% máu`,
  weaken_moc: (v) => `quái hành Mộc vào tiệm mất ${Math.round(v * 100)}% máu`,
  extra_drop: (v) => `thắng màn rơi thêm ${v} món`,
  boss_dmg: (v) => `+${Math.round(v * 100)}% sức đánh trùm`,
};

export function statText(st: GearStat): string {
  return `${STAT_NAME[st.kind]}: ${STAT_TEXT[st.kind](st.value)}`;
}

/* ---------- Gọn chữ cho giao diện (Claude) ---------- */

/** Biểu tượng + tên ngắn cho từng loại dòng (giao diện gọn: "🔋 Pin trâu 12%") */
export const STAT_ICON: Record<GearStatKind, string> = {
  elem_dmg: '🎯',
  all_dmg: '⚔️',
  range: '📶',
  speed: '☕',
  start_coins: '🚚',
  lives: '❤️',
  coin_pct: '👛',
  ult_cd: '🔋',
  ult_cost: '⚡',
  upgrade_discount: '🏷️',
  build_discount: '🔥',
  sell_refund: '🛡️',
  counter_dmg: '📈',
  synergy_bonus: '🔗',
  slow_dur: '🍃',
  weaken_thuy: '☔',
  weaken_moc: '🪲',
  extra_drop: '🎁',
  boss_dmg: '👑',
};

/** 1 chữ nói rõ tác dụng (đi kèm biểu tượng) — Antigravity rà 24/11: ký hiệu trơn khó hiểu */
export const STAT_WORD: Record<GearStatKind, string> = {
  elem_dmg: 'Hành', all_dmg: 'Sức', range: 'Tầm', speed: 'Tốc', start_coins: 'Vốn', lives: 'Tim',
  coin_pct: 'Xu', ult_cd: 'Chiêu', ult_cost: 'Bậc 4', upgrade_discount: 'Nâng rẻ', build_discount: 'Đặt rẻ',
  sell_refund: 'Bán', counter_dmg: 'Khắc', synergy_bonus: 'Sinh', slow_dur: 'Chậm', weaken_thuy: 'Mưa',
  weaken_moc: 'Côn trùng', extra_drop: 'Rơi đồ', boss_dmg: 'Trùm',
};

/** Giá trị ngắn: "12%", "+20", "+1" */
export function statValueShort(st: GearStat): string {
  if (INT_KINDS.has(st.kind)) return st.kind === 'ult_cost' ? `-${st.value}` : `+${st.value}`;
  return `${Math.round(st.value * 100)}%`;
}

/** Dòng gọn: "🔋 Pin trâu 12%" (câu giải thích đầy đủ dùng statText khi bấm giữ) */
export function statShort(st: GearStat): string {
  return `${STAT_ICON[st.kind]} ${STAT_NAME[st.kind]} ${statValueShort(st)}`;
}

/** Gọn nhất: chỉ biểu tượng + số (vd "🎯 8%") — câu đầy đủ xem bằng statText (anh Kha 24/11: bớt chữ) */
export function statTiny(st: GearStat): string {
  return `${STAT_ICON[st.kind]} ${STAT_WORD[st.kind] ?? ''} ${statValueShort(st)}`.replace(/\s+/g, ' ');
}

/** Chip tổng sức mạnh gọn: [{icon, value, full}] — chỉ các mục khác 0 */
export function bonusChips(b: GearBonus): { icon: string; value: string; full: string }[] {
  const out: { icon: string; value: string; full: string }[] = [];
  for (const el of ALL_ELEMENTS) {
    const v = b.elementDmg[el];
    if (v) out.push({ icon: `el:${el}`, value: `+${Math.round(v * 100)}%`, full: `${STAT_NAME.elem_dmg}: +${Math.round(v * 100)}% sức món hành này` });
  }
  for (const k of Object.keys(b.stats) as GearStatKind[]) {
    const v = b.stats[k];
    if (!v) continue;
    out.push({ icon: STAT_ICON[k], value: `${STAT_WORD[k] ?? ''} ${statValueShort({ kind: k, value: v })}`.trim(), full: statText({ kind: k, value: v }) });
  }
  return out;
}

/**
 * So sánh nhanh khi chọn đồ: mặc món này vào ô của nó thì
 * sáng thêm bao nhiêu dòng ẩn (toàn bộ), sức mọi món / theo hành đổi bao nhiêu.
 */
export function previewEquip(eq: Equipped, item: GearItem): { linesDelta: number; dmgDelta: number; fullRing: boolean } {
  const before = computeGearBonus(eq);
  const after = computeGearBonus({ ...eq, [item.slot]: item });
  const avgDmg = (b: GearBonus) => ALL_ELEMENTS.reduce((a, el) => a + gearDamageFor(b, el), 0) / ALL_ELEMENTS.length;
  return {
    linesDelta: after.activeLines - before.activeLines,
    dmgDelta: Math.round((avgDmg(after) - avgDmg(before)) * 1000) / 1000,
    fullRing: after.fullRing,
  };
}

/* ===== Gợi ý mặc đồ (Claude, anh Kha 25/11): chấm điểm tổng bộ đồ để so món mạnh / yếu hơn ===== */

/** Điểm tổng của bộ đồ: sức đánh là chính, cộng tầm, tốc, tim, xu, chiêu, dòng ẩn sáng, viên mãn */
export function gearScore(b: GearBonus): number {
  const avgDmg = ALL_ELEMENTS.reduce((a, el) => a + gearDamageFor(b, el), 0) / ALL_ELEMENTS.length;
  const st = b.stats;
  return (
    avgDmg * 100 +
    b.rangePct * 50 +
    b.speedPct * 60 +
    b.startCoins * 0.25 +
    b.lives * 2 +
    b.coinPct * 30 +
    b.ultCdPct * 25 +
    (st.counter_dmg ?? 0) * 40 +
    (st.synergy_bonus ?? 0) * 30 +
    (st.boss_dmg ?? 0) * 30 +
    (st.build_discount ?? 0) * 40 +
    (st.upgrade_discount ?? 0) * 35 +
    (st.slow_dur ?? 0) * 15 +
    ((st.weaken_thuy ?? 0) + (st.weaken_moc ?? 0)) * 15 +
    (st.extra_drop ?? 0) * 3 +
    (st.ult_cost ?? 0) * 0.05 +
    (st.sell_refund ?? 0) * 10 +
    b.activeLines * 1.5 +
    (b.fullRing ? 20 : 0)
  );
}

/** Mặc món này vào ô của nó thì điểm tổng tăng / giảm bao nhiêu (đang mặc chính món đó → 0) */
export function itemScoreDelta(eq: Equipped, item: GearItem): number {
  if (eq[item.slot]?.uid === item.uid) return 0;
  return Math.round((gearScore(computeGearBonus({ ...eq, [item.slot]: item })) - gearScore(computeGearBonus(eq))) * 10) / 10;
}

/** Ngưỡng coi là "mạnh hơn" (tránh gợi ý thay vì chênh lệch rất nhỏ) */
export const BETTER_MIN = 0.5;

/** Bộ đồ mạnh nhất từ kho (thử từng ô, lặp vài vòng vì dòng ẩn phụ thuộc ô bên cạnh) */
export function bestEquip(eq: Equipped, inventory: GearItem[]): Equipped {
  let cur: Equipped = { ...eq };
  for (let pass = 0; pass < 3; pass++) {
    let changed = false;
    for (const sl of GEAR_SLOTS) {
      let best = cur[sl.id];
      let bestScore = gearScore(computeGearBonus(cur));
      for (const it of inventory) {
        if (it.slot !== sl.id || it.uid === best?.uid) continue;
        const sc = gearScore(computeGearBonus({ ...cur, [sl.id]: it }));
        if (sc > bestScore + 0.01) {
          best = it;
          bestScore = sc;
        }
      }
      if (best && best.uid !== cur[sl.id]?.uid) {
        cur = { ...cur, [sl.id]: best };
        changed = true;
      }
    }
    if (!changed) break;
  }
  return cur;
}

/** Các ô đang có món tốt hơn trong kho */
export function slotsWithUpgrade(eq: Equipped, inventory: GearItem[]): Set<GearSlotId> {
  const out = new Set<GearSlotId>();
  for (const it of inventory) if (itemScoreDelta(eq, it) >= BETTER_MIN) out.add(it.slot);
  return out;
}
