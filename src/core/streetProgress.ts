/**
 * Tiến độ phố thật (Claude): mỗi phố = các màn tiệm (theo thứ tự) + 1 màn phố (trùm).
 * - Phố thật mở khi giữ xong 3 tiệm Phố Dốc (anh Kha chốt 25/11 sau đánh giá độc lập: Trùm Phố Dốc chặn người mới,
 *   nay thành thử thách phụ có thưởng — huy hiệu "giu_tron_pho" + đồ Hàng hiệu). Ai đã có huy hiệu vẫn mở như cũ.
 * - Tiệm 1 mở cùng phố; tiệm k mở khi đã thắng tiệm k-1.
 * - Màn phố (trùm) mở khi đã giữ được nửa số tiệm (8 tiệm → 4, 9–10 tiệm → 5) — anh Kha chốt 25/11;
 *   các tiệm còn lại thành màn phụ kiếm thêm sao / đồ / xe.
 * Không cần thêm dữ liệu lưu: dùng sao đã đạt (starsByStage).
 */
import { REAL_STREET_SHOPS, STAGES } from './tdDefinitions';
import type { StageId, TdSaveData } from './types';

export function realStreetsOpen(save: TdSaveData): boolean {
  if ((save.badges ?? []).includes('giu_tron_pho')) return true;
  return (['stage_1', 'stage_2', 'stage_3'] as const).every((id) => (save.starsByStage[id] ?? 0) > 0);
}

/** Số tiệm cần giữ để mở màn trùm phố */
export function bossShopsNeeded(totalShops: number): number {
  return Math.ceil(totalShops / 2);
}

export function isStreetStageUnlocked(save: TdSaveData, stageId: StageId): boolean {
  const st = STAGES[stageId];
  if (!st?.streetId) return true;
  if (!realStreetsOpen(save)) return false;
  const shops = REAL_STREET_SHOPS[st.streetId] ?? [];
  const won = (id: StageId) => (save.starsByStage[id] ?? 0) > 0;
  if (st.shopIndex) return st.shopIndex === 1 || won(shops[st.shopIndex - 2]!.id);
  return shops.filter((s) => won(s.id)).length >= bossShopsNeeded(shops.length);
}

export function streetProgress(save: TdSaveData, streetId: StageId) {
  const shops = REAL_STREET_SHOPS[streetId] ?? [];
  const cleared = shops.filter((s) => (save.starsByStage[s.id] ?? 0) > 0).length;
  const next = shops.find((s) => !((save.starsByStage[s.id] ?? 0) > 0));
  const streetWon = (save.starsByStage[streetId] ?? 0) > 0;
  const bossReady = cleared >= bossShopsNeeded(shops.length);
  return {
    shopsCleared: cleared,
    shopsTotal: shops.length,
    streetWon,
    bossNeeded: bossShopsNeeded(shops.length),
    /** màn nên chơi tiếp: đủ tiệm mà chưa thắng trùm → màn phố; không thì tiệm chưa thắng đầu tiên */
    nextStageId: ((bossReady && !streetWon) || !next ? streetId : next.id) as StageId,
  };
}
