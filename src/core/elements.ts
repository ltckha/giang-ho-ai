import type { ElementType } from './types';

export type ElementRelation = 'counter' | 'countered' | 'neutral';

/**
 * Vòng Ngũ Hành tương khắc chuẩn:
 * Kim khắc Mộc -> Mộc khắc Thổ -> Thổ khắc Thủy -> Thủy khắc Hỏa -> Hỏa khắc Kim.
 */
export const ELEMENT_COUNTERS: Record<ElementType, ElementType> = {
  kim: 'moc',
  moc: 'tho',
  tho: 'thuy',
  thuy: 'hoa',
  hoa: 'kim',
};

/**
 * Vòng Ngũ Hành tương sinh:
 * Kim sinh Thủy -> Thủy sinh Mộc -> Mộc sinh Hỏa -> Hỏa sinh Thổ -> Thổ sinh Kim.
 */
export const ELEMENT_GENERATES: Record<ElementType, ElementType> = {
  kim: 'thuy',
  thuy: 'moc',
  moc: 'hoa',
  hoa: 'tho',
  tho: 'kim',
};

export const COUNTER_MULTIPLIER = 1.35;
export const COUNTERED_MULTIPLIER = 0.75;
export const NEUTRAL_MULTIPLIER = 1.0;

export const ELEMENT_INFO: Record<
  ElementType,
  { label: string; colorHex: string; colorInt: number; iconSymbol: string }
> = {
  kim: { label: 'Kim', colorHex: '#cbd5e1', colorInt: 0xcbd5e1, iconSymbol: '🪡' },
  moc: { label: 'Mộc', colorHex: '#59c173', colorInt: 0x59c173, iconSymbol: '🍃' },
  thuy: { label: 'Thủy', colorHex: '#38bdf8', colorInt: 0x38bdf8, iconSymbol: '💧' },
  hoa: { label: 'Hỏa', colorHex: '#ff6b4a', colorInt: 0xff6b4a, iconSymbol: '🔥' },
  tho: { label: 'Thổ', colorHex: '#d4a359', colorInt: 0xd4a359, iconSymbol: '🪨' },
};

export const ALL_ELEMENTS: readonly ElementType[] = ['kim', 'moc', 'thuy', 'hoa', 'tho'] as const;

export function getElementRelation(attacker: ElementType, defender: ElementType): ElementRelation {
  if (ELEMENT_COUNTERS[attacker] === defender) {
    return 'counter';
  }
  if (ELEMENT_COUNTERS[defender] === attacker) {
    return 'countered';
  }
  return 'neutral';
}

export function getElementMultiplier(attacker: ElementType, defender: ElementType): number {
  const relation = getElementRelation(attacker, defender);
  if (relation === 'counter') return COUNTER_MULTIPLIER;
  if (relation === 'countered') return COUNTERED_MULTIPLIER;
  return NEUTRAL_MULTIPLIER;
}

export function doesElementGenerate(source: ElementType, target: ElementType): boolean {
  return ELEMENT_GENERATES[source] === target;
}
