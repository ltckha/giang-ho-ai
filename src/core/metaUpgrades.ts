/**
 * Nâng cấp giữa các màn bằng sao (Claude). Mỗi sao kiếm được ở các màn = 1 điểm.
 * Đổi điểm lấy bậc theo hành: mỗi bậc +6% sức cho mọi món thuộc hành đó, tối đa 3 bậc / hành.
 * Đổi lại miễn phí bất cứ lúc nào. Tối đa 9 sao (3 màn × 3) < 15 bậc → phải chọn hành.
 */
import { ALL_ELEMENTS } from './elements';
import type { ElementType, TdSaveData } from './types';

export const META_MAX_LEVEL = 3;
export const META_DAMAGE_PER_LEVEL = 0.06;

export type MetaLevels = Partial<Record<ElementType, number>>;

export function totalStars(save: Pick<TdSaveData, 'starsByStage'>): number {
  return Object.values(save.starsByStage).reduce((a, b) => a + (b ?? 0), 0);
}

export function spentPoints(levels: MetaLevels): number {
  return ALL_ELEMENTS.reduce((a, el) => a + (levels[el] ?? 0), 0);
}

export function availablePoints(save: Pick<TdSaveData, 'starsByStage'> & { metaLevels?: MetaLevels }): number {
  return totalStars(save) - spentPoints(save.metaLevels ?? {});
}

/** Tăng 1 bậc nếu còn điểm và chưa tối đa; trả về bậc mới (không đổi nếu không được) */
export function tryRaise(save: Pick<TdSaveData, 'starsByStage'> & { metaLevels?: MetaLevels }, el: ElementType): MetaLevels {
  const levels = { ...(save.metaLevels ?? {}) };
  const cur = levels[el] ?? 0;
  if (cur >= META_MAX_LEVEL) return levels;
  if (availablePoints({ ...save, metaLevels: levels }) <= 0) return levels;
  levels[el] = cur + 1;
  return levels;
}

export function lower(levels: MetaLevels, el: ElementType): MetaLevels {
  const next = { ...levels };
  next[el] = Math.max(0, (next[el] ?? 0) - 1);
  return next;
}

/** Hệ số cộng sức theo hành cho engine */
export function metaDamageBonus(levels: MetaLevels | undefined): Partial<Record<ElementType, number>> {
  const out: Partial<Record<ElementType, number>> = {};
  for (const el of ALL_ELEMENTS) {
    const lv = Math.min(META_MAX_LEVEL, Math.max(0, levels?.[el] ?? 0));
    if (lv > 0) out[el] = lv * META_DAMAGE_PER_LEVEL;
  }
  return out;
}
