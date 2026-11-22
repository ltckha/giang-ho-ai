import type { TdSaveData } from './types';

/**
 * Khoá lưu trữ mới riêng cho bản Thủ Thành — tuyệt đối không đọc bản lưu nhập vai cũ.
 */
export const TD_SAVE_KEY = 'giang_ho_ai_thu_thanh_save_v1';

export function createDefaultTdSave(): TdSaveData {
  return {
    version: 1,
    unlockedStage: 1,
    starsByStage: {},
    bestLivesByStage: {},
    updatedAt: Date.now(),
  };
}

export function loadTdSave(storage?: Pick<Storage, 'getItem'>): TdSaveData {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return createDefaultTdSave();

  try {
    const raw = store.getItem(TD_SAVE_KEY);
    if (!raw) return createDefaultTdSave();
    const parsed = JSON.parse(raw) as Partial<TdSaveData>;
    if (parsed.version !== 1) return createDefaultTdSave();
    return {
      version: 1,
      unlockedStage:
        parsed.unlockedStage === 2 || parsed.unlockedStage === 3 ? parsed.unlockedStage : 1,
      starsByStage: parsed.starsByStage ?? {},
      bestLivesByStage: parsed.bestLivesByStage ?? {},
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return createDefaultTdSave();
  }
}

export function saveTdProgress(
  stageId: 'stage_1' | 'stage_2' | 'stage_3',
  stars: 1 | 2 | 3,
  livesRemaining: number,
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
): TdSaveData {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  const current = loadTdSave(store);

  const prevStars = current.starsByStage[stageId] ?? 0;
  if (stars > prevStars) {
    current.starsByStage[stageId] = stars;
  }

  const prevLives = current.bestLivesByStage[stageId] ?? 0;
  if (livesRemaining > prevLives) {
    current.bestLivesByStage[stageId] = livesRemaining;
  }

  if (stageId === 'stage_1' && current.unlockedStage < 2) {
    current.unlockedStage = 2;
  } else if (stageId === 'stage_2' && current.unlockedStage < 3) {
    current.unlockedStage = 3;
  }

  current.updatedAt = Date.now();

  if (store) {
    try {
      store.setItem(TD_SAVE_KEY, JSON.stringify(current));
    } catch {
      // Ignore quota errors
    }
  }

  return current;
}
