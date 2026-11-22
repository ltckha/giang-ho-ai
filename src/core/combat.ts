import { getElementMultiplier, getElementRelation, type ElementRelation } from './elements';
import { summarizeAffixes } from './equipmentGen';
import type {
  BaseStats,
  EffectiveStats,
  ElementType,
  EquipmentSlot,
  EquipmentState,
  EquippedInstancesState,
  ItemDef,
} from './types';

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
  equippedInstances?: Partial<EquippedInstancesState>,
): EffectiveStats {
  let maxHp = scaledBase.maxHp;
  let atk = scaledBase.atk;
  let def = scaledBase.def;
  let moveSpeed = scaledBase.moveSpeed;
  let resistElement: ElementType | undefined;
  let resistBonus = 0;
  let imbueElement: ElementType | undefined;
  let critChanceBonus = 0;
  let armorPierceBonus = 0;
  let allyAtkBonus = 0;
  const elementResists: Partial<Record<ElementType, number>> = {};

  const slots: EquipmentSlot[] = ['weapon', 'armor', 'charm'];
  for (const slot of slots) {
    const inst = equippedInstances?.[slot] ?? null;
    const itemId = inst ? inst.baseItemId : equipment[slot];
    if (itemId) {
      const item = itemsById[itemId];
      if (item) {
        maxHp += item.hpBonus ?? 0;
        atk += item.atkBonus ?? 0;
        def += item.defBonus ?? 0;
        if (item.resistElement && item.resistBonus) {
          resistElement = item.resistElement;
          resistBonus = item.resistBonus;
          elementResists[item.resistElement] = Math.min(
            0.5,
            (elementResists[item.resistElement] ?? 0) + item.resistBonus,
          );
        }
        if (item.imbueElement) {
          imbueElement = item.imbueElement;
        }
      }
    }

    if (inst && inst.affixes.length > 0) {
      const affixSum = summarizeAffixes(inst.affixes);
      maxHp += affixSum.hp;
      atk += affixSum.atk;
      def += affixSum.def;
      moveSpeed += affixSum.moveSpeed;
      critChanceBonus = Math.min(0.45, Math.round((critChanceBonus + affixSum.critChance) * 100) / 100);
      armorPierceBonus = Math.min(0.45, Math.round((armorPierceBonus + affixSum.armorPierce) * 100) / 100);
      allyAtkBonus = Math.min(0.5, Math.round((allyAtkBonus + affixSum.allyAtkBonus) * 100) / 100);
      for (const [elKey, val] of Object.entries(affixSum.elementResists) as Array<[ElementType, number]>) {
        if (val > 0) {
          elementResists[elKey] = Math.min(
            0.5,
            Math.round(((elementResists[elKey] ?? 0) + val) * 100) / 100,
          );
          if (!resistElement || (elementResists[elKey] ?? 0) > resistBonus) {
            resistElement = elKey;
            resistBonus = elementResists[elKey] ?? resistBonus;
          }
        }
      }
    }
  }

  return {
    maxHp,
    atk,
    def,
    moveSpeed,
    resistElement,
    resistBonus,
    imbueElement,
    critChanceBonus,
    armorPierceBonus,
    allyAtkBonus,
    elementResists,
  };
}

export function getElementResistFor(stats: EffectiveStats, incomingElement: ElementType): number {
  const mapped = stats.elementResists?.[incomingElement];
  if (mapped !== undefined) {
    return clamp(mapped, 0, 0.5);
  }
  return stats.resistElement === incomingElement ? clamp(stats.resistBonus, 0, 0.5) : 0;
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
