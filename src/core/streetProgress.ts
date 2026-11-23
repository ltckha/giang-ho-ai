/**
 * Tiến độ phố thật (Claude): mỗi phố = các màn tiệm (theo thứ tự) + 1 màn phố (trùm).
 * - Phố thật mở khi thắng Trận trùm phố đầu (huy hiệu "giu_tron_pho").
 * - Tiệm 1 mở cùng phố; tiệm k mở khi đã thắng tiệm k-1.
 * - Màn phố mở khi đã thắng hết các tiệm của phố.
 * Không cần thêm dữ liệu lưu: dùng sao đã đạt (starsByStage).
 */
import { REAL_STREET_SHOPS, STAGES } from './tdDefinitions';
import type { StageId, TdSaveData } from './types';

export function realStreetsOpen(save: TdSaveData): boolean {
  return (save.badges ?? []).includes('giu_tron_pho');
}

export function isStreetStageUnlocked(save: TdSaveData, stageId: StageId): boolean {
  const st = STAGES[stageId];
  if (!st?.streetId) return true;
  if (!realStreetsOpen(save)) return false;
  const shops = REAL_STREET_SHOPS[st.streetId] ?? [];
  const won = (id: StageId) => (save.starsByStage[id] ?? 0) > 0;
  if (st.shopIndex) return st.shopIndex === 1 || won(shops[st.shopIndex - 2]!.id);
  return shops.every((s) => won(s.id));
}

export function streetProgress(save: TdSaveData, streetId: StageId) {
  const shops = REAL_STREET_SHOPS[streetId] ?? [];
  const cleared = shops.filter((s) => (save.starsByStage[s.id] ?? 0) > 0).length;
  const next = shops.find((s) => !((save.starsByStage[s.id] ?? 0) > 0));
  return {
    shopsCleared: cleared,
    shopsTotal: shops.length,
    streetWon: (save.starsByStage[streetId] ?? 0) > 0,
    /** màn nên chơi tiếp: tiệm chưa thắng đầu tiên, hết tiệm thì màn phố */
    nextStageId: (next?.id ?? streetId) as StageId,
  };
}
