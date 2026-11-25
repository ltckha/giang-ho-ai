/**
 * Gộp tiến độ 2 máy (đánh giá độc lập 25/11, lỗi C1): khi máy chủ và máy này lệch nhau thì GỘP, không đè.
 * - Sao, máu tốt nhất, sao ★ Khó: lấy cao hơn · màn đã mở: lấy xa hơn
 * - Huy hiệu, xe, túi đồ (theo mã món): hợp lại · đồ đang mặc, xe đang đi: theo bản sửa sau cùng
 * - Khoá phụ (món mang theo từng phố…): máy này có thì giữ, không có thì lấy của máy chủ
 */
import { TD_SAVE_KEY } from '../core/saveSystem';
import type { TdSaveData } from '../core/types';

type Map_ = Record<string, string>;

function maxRec<T extends string>(a: Partial<Record<T, number>> = {}, b: Partial<Record<T, number>> = {}): Partial<Record<T, number>> {
  const out: Partial<Record<T, number>> = { ...a };
  for (const [k, v] of Object.entries(b) as [T, number][]) if (typeof v === 'number' && !((out[k] ?? 0) >= v)) out[k] = v;
  return out;
}

export function mergeSaveData(a: TdSaveData, b: TdSaveData): TdSaveData {
  const newer = (b.updatedAt ?? 0) > (a.updatedAt ?? 0) ? b : a;
  const inv = new Map<string, NonNullable<TdSaveData['gearInventory']>[number]>();
  for (const it of [...(a.gearInventory ?? []), ...(b.gearInventory ?? [])]) if (it && typeof it.uid === 'string' && !inv.has(it.uid)) inv.set(it.uid, it);
  const union = (x?: string[], y?: string[]) => Array.from(new Set([...(x ?? []), ...(y ?? [])]));
  return {
    ...newer,
    version: 1,
    unlockedStage: Math.max(a.unlockedStage ?? 1, b.unlockedStage ?? 1) as TdSaveData['unlockedStage'],
    starsByStage: maxRec(a.starsByStage, b.starsByStage) as TdSaveData['starsByStage'],
    bestLivesByStage: maxRec(a.bestLivesByStage, b.bestLivesByStage) as TdSaveData['bestLivesByStage'],
    hardStarsByStage: maxRec(a.hardStarsByStage, b.hardStarsByStage),
    badges: union(a.badges, b.badges),
    vehicles: union(a.vehicles, b.vehicles),
    gearInventory: Array.from(inv.values()),
    tutorialDone: Boolean(a.tutorialDone || b.tutorialDone),
    updatedAt: Math.max(a.updatedAt ?? 0, b.updatedAt ?? 0),
  };
}

/** Gộp 2 bộ khoá tiến độ. Trả về bộ gộp + có khác máy này không */
export function mergeSaveMaps(local: Map_, remote: Map_): { merged: Map_; changed: boolean } {
  const merged: Map_ = { ...remote, ...local };
  const la = local[TD_SAVE_KEY];
  const rb = remote[TD_SAVE_KEY];
  if (la && rb) {
    try {
      merged[TD_SAVE_KEY] = JSON.stringify(mergeSaveData(JSON.parse(la) as TdSaveData, JSON.parse(rb) as TdSaveData));
    } catch {
      merged[TD_SAVE_KEY] = la;
    }
  }
  const changed = Object.keys(merged).some((k) => merged[k] !== local[k]);
  return { merged, changed };
}
