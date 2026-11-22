import { getElementMultiplier, getElementRelation, type ElementRelation } from './elements';
import type { BaseStats, EffectiveStats, ElementType, EquipmentState, ItemDef } from './types';

export interface DamageInput {
  attackerAtk: number;
  attackElement: ElementType;
  defenderDef: number;
  defenderElement: ElementType;
  powerMultiplier?: number;
  armorPierce?: number;
  defenderElementResist?: number;
  defenderDamageReduction?: number;
  critChance?: number;
  rng?: () => number;
}

export interface DamageResult {
  damage: number;
  relation: ElementRelation;
  elementMultiplier: number;
  isCrit: boolean;
}

export interface LevelProgress {
  level: number;
  xp: number;
}

export interface LevelUpResult {
  level: number;
  xp: number;
  levelsGained: number;
  xpToNext: number;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Công thức tính sát thương có xét:
 * - Hệ số chiêu thức (powerMultiplier)
 * - Xuyên giáp (armorPierce)
 * - Ngũ hành tương khắc (1.35x / 0.75x / 1.0x)
 * - Kháng ngũ hành từ ngọc/bùa (tối đa 50%)
 * - Khiên giảm sát thương (tối đa 75%)
 * - Chí mạng (1.5x)
 */
export function calculateDamage(input: DamageInput): DamageResult {
  const power = input.powerMultiplier ?? 1.0;
  const pierce = clamp(input.armorPierce ?? 0, 0, 1);
  const resist = clamp(input.defenderElementResist ?? 0, 0, 0.5);
  const reduction = clamp(input.defenderDamageReduction ?? 0, 0, 0.75);
  const critChance = clamp(input.critChance ?? 0.08, 0, 1);
  const roll = (input.rng ?? Math.random)();

  const effectiveDef = input.defenderDef * (1 - pierce);
  const baseDamage = Math.max(1, input.attackerAtk * power - effectiveDef * 0.55);

  const relation = getElementRelation(input.attackElement, input.defenderElement);
  const elementMultiplier = getElementMultiplier(input.attackElement, input.defenderElement);
  const isCrit = roll < critChance;
  const critMult = isCrit ? 1.5 : 1.0;

  const total = baseDamage * elementMultiplier * (1 - resist) * (1 - reduction) * critMult;
  return {
    damage: Math.max(1, Math.round(total)),
    relation,
    elementMultiplier,
    isCrit,
  };
}

export function xpRequiredForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return Math.round(60 + (safeLevel - 1) * 45 + (safeLevel - 1) * (safeLevel - 1) * 15);
}

export function applyExperience(current: LevelProgress, gainedXp: number): LevelUpResult {
  let level = Math.max(1, current.level);
  let xp = Math.max(0, current.xp) + Math.max(0, Math.floor(gainedXp));
  let levelsGained = 0;

  while (xp >= xpRequiredForLevel(level) && level < 30) {
    xp -= xpRequiredForLevel(level);
    level += 1;
    levelsGained += 1;
  }

  return {
    level,
    xp,
    levelsGained,
    xpToNext: xpRequiredForLevel(level),
  };
}

export function computeScaledBaseStats(sectBase: BaseStats, level: number): BaseStats {
  const extra = Math.max(0, level - 1);
  return {
    maxHp: sectBase.maxHp + extra * 22,
    atk: sectBase.atk + extra * 4,
    def: sectBase.def + extra * 2,
    moveSpeed: sectBase.moveSpeed,
  };
}

export function computeEffectiveStats(
  scaledBase: BaseStats,
  equipment: EquipmentState,
  itemsById: Record<string, ItemDef>,
): EffectiveStats {
  let maxHp = scaledBase.maxHp;
  let atk = scaledBase.atk;
  let def = scaledBase.def;
  let resistElement: ElementType | undefined;
  let resistBonus = 0;
  let imbueElement: ElementType | undefined;

  const equippedIds = [equipment.weapon, equipment.armor, equipment.charm];
  for (const id of equippedIds) {
    if (!id) continue;
    const item = itemsById[id];
    if (!item) continue;
    maxHp += item.hpBonus ?? 0;
    atk += item.atkBonus ?? 0;
    def += item.defBonus ?? 0;
    if (item.resistElement && item.resistBonus) {
      resistElement = item.resistElement;
      resistBonus = item.resistBonus;
    }
    if (item.imbueElement) {
      imbueElement = item.imbueElement;
    }
  }

  return {
    maxHp,
    atk,
    def,
    moveSpeed: scaledBase.moveSpeed,
    resistElement,
    resistBonus,
    imbueElement,
  };
}

/**
 * Ngọc Ngũ Hành khi trang bị sẽ truyền hệ ngũ hành vào Chiêu 1 (đòn đánh cơ bản),
 * giúp mọi môn phái (như Phổ Mộc Đường hay Hỏa Ấn Môn gặp trùm Thủy) đều có cách ứng biến khắc hệ.
 */
export function resolveSkillElement(
  skillSlot: 1 | 2 | 3 | 4,
  baseElement: ElementType,
  imbueElement?: ElementType,
): ElementType {
  if (skillSlot === 1 && imbueElement) {
    return imbueElement;
  }
  return baseElement;
}
