import { ALL_ELEMENTS } from './elements';
import { ITEMS } from './inventory';
import type {
  AffixType,
  ElementType,
  EquipmentAffix,
  EquipmentInstance,
  EquipmentRarity,
  EquipmentSlot,
  ItemDef,
} from './types';

export interface RaritySpec {
  tier: number;
  minAffixes: number;
  maxAffixes: number;
  statScale: number;
  priceMult: number;
  colorHex: string;
}

export const RARITY_ORDER: readonly EquipmentRarity[] = ['common', 'fine', 'rare', 'epic'] as const;

export const RARITY_SPECS: Record<EquipmentRarity, RaritySpec> = {
  common: {
    tier: 0,
    minAffixes: 1,
    maxAffixes: 1,
    statScale: 1.0,
    priceMult: 1.0,
    colorHex: '#e2e8f0',
  },
  fine: {
    tier: 1,
    minAffixes: 2,
    maxAffixes: 2,
    statScale: 1.28,
    priceMult: 1.55,
    colorHex: '#59c173',
  },
  rare: {
    tier: 2,
    minAffixes: 2,
    maxAffixes: 3,
    statScale: 1.6,
    priceMult: 2.35,
    colorHex: '#4cc9f0',
  },
  epic: {
    tier: 3,
    minAffixes: 3,
    maxAffixes: 3,
    statScale: 2.0,
    priceMult: 3.5,
    colorHex: '#f59e0b',
  },
};

interface AffixRange {
  min: number;
  max: number;
  levelStep: number;
  isFloat: boolean;
}

const AFFIX_RANGES: Record<AffixType, AffixRange> = {
  atk_flat: { min: 2, max: 5, levelStep: 0.9, isFloat: false },
  def_flat: { min: 1, max: 4, levelStep: 0.65, isFloat: false },
  hp_flat: { min: 10, max: 24, levelStep: 4.5, isFloat: false },
  crit_chance: { min: 0.03, max: 0.07, levelStep: 0.005, isFloat: true },
  armor_pierce: { min: 0.05, max: 0.11, levelStep: 0.008, isFloat: true },
  move_speed: { min: 6, max: 14, levelStep: 1.2, isFloat: false },
  elem_resist: { min: 0.07, max: 0.14, levelStep: 0.008, isFloat: true },
  ally_atk_pct: { min: 0.04, max: 0.09, levelStep: 0.007, isFloat: true },
};

const SLOT_AFFIX_POOLS: Record<EquipmentSlot, readonly AffixType[]> = {
  weapon: ['atk_flat', 'crit_chance', 'armor_pierce', 'ally_atk_pct', 'hp_flat', 'move_speed'],
  armor: ['def_flat', 'hp_flat', 'elem_resist', 'move_speed', 'ally_atk_pct', 'atk_flat'],
  charm: ['elem_resist', 'ally_atk_pct', 'crit_chance', 'hp_flat', 'atk_flat', 'def_flat'],
};

/**
 * Bộ sinh số giả ngẫu nhiên Mulberry32 cố định theo seed,
 * giúp sinh chỉ số trang bị và ghép đồ hoàn toàn tái lập được trong test.
 */
export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundFloat2(val: number): number {
  return Math.round(val * 100) / 100;
}

export function getNextRarity(rarity: EquipmentRarity): EquipmentRarity {
  const idx = RARITY_ORDER.indexOf(rarity);
  if (idx < 0 || idx >= RARITY_ORDER.length - 1) return 'epic';
  return RARITY_ORDER[idx + 1];
}

export function rollEquipmentRarity(itemLevel: number, rng: () => number): EquipmentRarity {
  const lvl = Math.max(1, Math.floor(itemLevel));
  const epicChance = Math.min(0.18, 0.02 + Math.max(0, lvl - 3) * 0.025);
  const rareChance = Math.min(0.32, 0.1 + Math.max(0, lvl - 2) * 0.035);
  const fineChance = Math.min(0.42, 0.28 + Math.max(0, lvl - 1) * 0.025);

  const r = rng();
  if (r < epicChance) return 'epic';
  if (r < epicChance + rareChance) return 'rare';
  if (r < epicChance + rareChance + fineChance) return 'fine';
  return 'common';
}

export interface GenerateEquipmentOptions {
  baseItemId: string;
  itemLevel: number;
  seed: number;
  rarity?: EquipmentRarity;
  uid?: string;
  crafted?: boolean;
  minRollRatio?: number;
  itemsById?: Record<string, ItemDef>;
}

/**
 * Sinh một món trang bị với 1–3 dòng chỉ số ngẫu nhiên theo độ hiếm và cấp độ.
 * Toàn bộ phụ thuộc vào `seed` nên hoàn toàn ổn định khi kiểm thử.
 */
export function generateEquipmentInstance(opts: GenerateEquipmentOptions): EquipmentInstance {
  const catalog = opts.itemsById ?? ITEMS;
  const baseItem = catalog[opts.baseItemId];
  if (!baseItem || (baseItem.kind !== 'weapon' && baseItem.kind !== 'armor' && baseItem.kind !== 'charm')) {
    throw new Error(`Invalid equipment baseItemId: ${opts.baseItemId}`);
  }

  const slot: EquipmentSlot = baseItem.kind;
  const itemLevel = Math.max(1, Math.floor(opts.itemLevel));
  const seed = opts.seed >>> 0;
  const rng = createSeededRng(seed);

  const rarity = opts.rarity ?? rollEquipmentRarity(itemLevel, rng);
  const spec = RARITY_SPECS[rarity];
  const minRoll = Math.max(0, Math.min(0.95, opts.minRollRatio ?? 0));

  const affixCount =
    spec.minAffixes === spec.maxAffixes
      ? spec.minAffixes
      : spec.minAffixes + (rng() < 0.5 ? 0 : 1);

  const pool = [...SLOT_AFFIX_POOLS[slot]];
  const affixes: EquipmentAffix[] = [];

  for (let i = 0; i < affixCount && pool.length > 0; i++) {
    const pickIdx = Math.floor(rng() * pool.length);
    const affixType = pool.splice(pickIdx, 1)[0];
    const range = AFFIX_RANGES[affixType];

    const rollRatio = minRoll + rng() * (1 - minRoll);
    const rawMin = (range.min + (itemLevel - 1) * range.levelStep) * spec.statScale;
    const rawMax = (range.max + (itemLevel - 1) * range.levelStep) * spec.statScale;
    const rawVal = rawMin + (rawMax - rawMin) * rollRatio;

    let value: number;
    if (range.isFloat) {
      const cap = affixType === 'elem_resist' ? 0.35 : affixType === 'armor_pierce' ? 0.35 : 0.25;
      value = Math.min(cap, Math.max(0.02, roundFloat2(rawVal)));
    } else {
      value = Math.max(1, Math.round(rawVal));
    }

    const affix: EquipmentAffix = { type: affixType, value };
    if (affixType === 'elem_resist') {
      const elIdx = Math.floor(rng() * ALL_ELEMENTS.length);
      affix.element = ALL_ELEMENTS[elIdx];
    }
    affixes.push(affix);
  }

  return {
    uid: opts.uid ?? `eq_${opts.baseItemId}_${seed}`,
    baseItemId: opts.baseItemId,
    slot,
    rarity,
    itemLevel,
    affixes,
    seed,
    crafted: opts.crafted ?? false,
  };
}

export interface AffixSummary {
  atk: number;
  def: number;
  hp: number;
  critChance: number;
  armorPierce: number;
  moveSpeed: number;
  allyAtkBonus: number;
  elementResists: Partial<Record<ElementType, number>>;
}

export function summarizeAffixes(affixes: readonly EquipmentAffix[]): AffixSummary {
  const sum: AffixSummary = {
    atk: 0,
    def: 0,
    hp: 0,
    critChance: 0,
    armorPierce: 0,
    moveSpeed: 0,
    allyAtkBonus: 0,
    elementResists: {},
  };
  for (const a of affixes) {
    switch (a.type) {
      case 'atk_flat':
        sum.atk += a.value;
        break;
      case 'def_flat':
        sum.def += a.value;
        break;
      case 'hp_flat':
        sum.hp += a.value;
        break;
      case 'crit_chance':
        sum.critChance = roundFloat2(sum.critChance + a.value);
        break;
      case 'armor_pierce':
        sum.armorPierce = roundFloat2(sum.armorPierce + a.value);
        break;
      case 'move_speed':
        sum.moveSpeed += a.value;
        break;
      case 'ally_atk_pct':
        sum.allyAtkBonus = roundFloat2(sum.allyAtkBonus + a.value);
        break;
      case 'elem_resist':
        if (a.element) {
          sum.elementResists[a.element] = roundFloat2(
            (sum.elementResists[a.element] ?? 0) + a.value,
          );
        }
        break;
    }
  }
  return sum;
}

export function computeEquipmentPowerScore(
  inst: EquipmentInstance,
  itemsById: Record<string, ItemDef> = ITEMS,
): number {
  const base = itemsById[inst.baseItemId];
  const sum = summarizeAffixes(inst.affixes);
  const baseScore =
    (base?.atkBonus ?? 0) * 3 +
    (base?.defBonus ?? 0) * 2.5 +
    (base?.hpBonus ?? 0) * 0.4 +
    (base?.resistBonus ?? 0) * 80;
  const resistSum = Object.values(sum.elementResists).reduce((acc, v) => acc + (v ?? 0), 0);
  const affixScore =
    sum.atk * 3.2 +
    sum.def * 2.6 +
    sum.hp * 0.45 +
    sum.critChance * 140 +
    sum.armorPierce * 110 +
    sum.moveSpeed * 0.8 +
    sum.allyAtkBonus * 130 +
    resistSum * 90;
  return Math.round(baseScore + affixScore + RARITY_SPECS[inst.rarity].tier * 12);
}

export function getEquipmentSellPrice(
  inst: EquipmentInstance,
  itemsById: Record<string, ItemDef> = ITEMS,
): number {
  const base = itemsById[inst.baseItemId];
  if (!base || base.price <= 0) return 0;
  const spec = RARITY_SPECS[inst.rarity];
  return Math.max(5, Math.floor(base.price * 0.5 * spec.priceMult));
}

export interface CraftCostEstimate {
  valid: boolean;
  reason?: string;
  silver: number;
  spiritStones: number;
  targetRarity: EquipmentRarity;
  targetItemLevel: number;
}

export function estimateCraftEquipment(
  inputs: readonly EquipmentInstance[],
): CraftCostEstimate {
  if (inputs.length < 2 || inputs.length > 3) {
    return {
      valid: false,
      reason: 'invalid_count',
      silver: 0,
      spiritStones: 0,
      targetRarity: 'common',
      targetItemLevel: 1,
    };
  }

  const uidSet = new Set(inputs.map((i) => i.uid));
  if (uidSet.size !== inputs.length) {
    return {
      valid: false,
      reason: 'duplicate_item',
      silver: 0,
      spiritStones: 0,
      targetRarity: 'common',
      targetItemLevel: 1,
    };
  }

  const slot = inputs[0].slot;
  if (!inputs.every((i) => i.slot === slot)) {
    return {
      valid: false,
      reason: 'mismatched_slot',
      silver: 0,
      spiritStones: 0,
      targetRarity: 'common',
      targetItemLevel: 1,
    };
  }

  let maxTier = 0;
  let maxLevel = 1;
  for (const item of inputs) {
    maxTier = Math.max(maxTier, RARITY_SPECS[item.rarity].tier);
    maxLevel = Math.max(maxLevel, item.itemLevel);
  }

  const targetTier = Math.min(RARITY_ORDER.length - 1, maxTier + 1);
  const targetRarity = RARITY_ORDER[targetTier];
  const levelBoost = inputs.length === 3 ? 2 : 1;
  const silver = 25 * (targetTier + 1);
  const spiritStones = targetTier >= 2 ? targetTier - 1 : 0;

  return {
    valid: true,
    silver,
    spiritStones,
    targetRarity,
    targetItemLevel: maxLevel + levelBoost,
  };
}

export interface CraftEquipmentOptions {
  inputs: readonly EquipmentInstance[];
  silver: number;
  spiritStones: number;
  seed: number;
  uid?: string;
  itemsById?: Record<string, ItemDef>;
}

export interface CraftEquipmentResult {
  success: boolean;
  reason?: string;
  result: EquipmentInstance | null;
  consumedUids: string[];
  silver: number;
  spiritStones: number;
  criticalUpgrade: boolean;
}

/**
 * Ghép 2–3 món trang bị cùng loại (vũ khí / giáp / ngọc) thành 1 món tốt hơn.
 * - Dùng 2 món: nâng bậc hiếm lên 1 bậc (+1 cấp đồ).
 * - Dùng 3 món: nâng bậc hiếm (+2 cấp đồ), sàn chỉ số cao (tối thiểu 65% khung max),
 *   và có 20% cơ hội nhảy vọt thêm 1 bậc (nếu xuất phát từ bậc common/fine).
 */
export function craftEquipment(opts: CraftEquipmentOptions): CraftEquipmentResult {
  const catalog = opts.itemsById ?? ITEMS;
  const estimate = estimateCraftEquipment(opts.inputs);
  if (!estimate.valid) {
    return {
      success: false,
      reason: estimate.reason,
      result: null,
      consumedUids: [],
      silver: opts.silver,
      spiritStones: opts.spiritStones,
      criticalUpgrade: false,
    };
  }

  if (opts.silver < estimate.silver) {
    return {
      success: false,
      reason: 'insufficient_silver',
      result: null,
      consumedUids: [],
      silver: opts.silver,
      spiritStones: opts.spiritStones,
      criticalUpgrade: false,
    };
  }

  if (opts.spiritStones < estimate.spiritStones) {
    return {
      success: false,
      reason: 'insufficient_spirit_stones',
      result: null,
      consumedUids: [],
      silver: opts.silver,
      spiritStones: opts.spiritStones,
      criticalUpgrade: false,
    };
  }

  // Giữ phôi có giá trị nền cao nhất để trang bị ghép xong không bao giờ thụt nền
  let bestBaseId = opts.inputs[0].baseItemId;
  let bestPrice = catalog[bestBaseId]?.price ?? 0;
  for (const inp of opts.inputs) {
    const p = catalog[inp.baseItemId]?.price ?? 0;
    if (p > bestPrice) {
      bestPrice = p;
      bestBaseId = inp.baseItemId;
    }
  }

  const rng = createSeededRng((opts.seed ^ 0x9e3779b9) >>> 0);
  let finalRarity = estimate.targetRarity;
  let criticalUpgrade = false;
  if (opts.inputs.length === 3 && RARITY_SPECS[finalRarity].tier < 3 && rng() < 0.2) {
    finalRarity = getNextRarity(finalRarity);
    criticalUpgrade = true;
  }

  const minRollRatio = opts.inputs.length === 3 ? 0.65 : 0.35;
  const craftedItem = generateEquipmentInstance({
    baseItemId: bestBaseId,
    itemLevel: estimate.targetItemLevel,
    rarity: finalRarity,
    seed: opts.seed,
    uid: opts.uid ?? `craft_${bestBaseId}_${opts.seed >>> 0}`,
    crafted: true,
    minRollRatio,
    itemsById: catalog,
  });

  return {
    success: true,
    result: craftedItem,
    consumedUids: opts.inputs.map((i) => i.uid),
    silver: opts.silver - estimate.silver,
    spiritStones: opts.spiritStones - estimate.spiritStones,
    criticalUpgrade,
  };
}
