import { computeGearBonus, rollStageDrops, starterGear, type Equipped, type GearBonus, type GearItem, type GearSlotId } from './equipment';
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
    gearInventory: starterGear(),
    gearEquipped: { hat: 'starter_hat', glasses: 'starter_glasses' },
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
      gearInventory: Array.isArray(parsed.gearInventory) ? parsed.gearInventory : starterGear(),
      gearEquipped: parsed.gearEquipped ?? (Array.isArray(parsed.gearInventory) ? {} : { hat: 'starter_hat', glasses: 'starter_glasses' }),
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

function writeSave(store: Pick<Storage, 'setItem'> | undefined, data: TdSaveData): void {
  if (!store) return;
  try {
    store.setItem(TD_SAVE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors
  }
}

function resolveStore(storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  return storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
}

/** Đồ đang mặc (theo ô) từ bản lưu */
export function getEquipped(save: TdSaveData): Equipped {
  const inv = save.gearInventory ?? [];
  const eq: Equipped = {};
  for (const [slot, uid] of Object.entries(save.gearEquipped ?? {})) {
    const item = inv.find((it) => it.uid === uid && it.slot === slot);
    if (item) eq[slot as GearSlotId] = item;
  }
  return eq;
}

export function getGearBonus(save: TdSaveData): GearBonus {
  return computeGearBonus(getEquipped(save));
}

/** Mặc (uid) hoặc cởi (null) món ở một ô */
export function equipGear(slot: GearSlotId, uid: string | null, storage?: Pick<Storage, 'getItem' | 'setItem'>): TdSaveData {
  const store = resolveStore(storage);
  const cur = loadTdSave(store);
  const eq = { ...(cur.gearEquipped ?? {}) };
  if (uid === null) delete eq[slot];
  else if ((cur.gearInventory ?? []).some((it) => it.uid === uid && it.slot === slot)) eq[slot] = uid;
  cur.gearEquipped = eq;
  cur.updatedAt = Date.now();
  writeSave(store, cur);
  return cur;
}

/** Thắng màn: rơi đồ theo số sao, cất vào kho. Trả về các món vừa rơi. */
export function grantStageDrops(
  stageNumber: number,
  stars: 1 | 2 | 3,
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
  rng: () => number = Math.random,
): GearItem[] {
  const store = resolveStore(storage);
  const cur = loadTdSave(store);
  const drops = rollStageDrops(stageNumber, stars, rng, `g${Date.now().toString(36)}${Math.floor(rng() * 1e6).toString(36)}`);
  cur.gearInventory = [...(cur.gearInventory ?? []), ...drops];
  cur.updatedAt = Date.now();
  writeSave(store, cur);
  return drops;
}
