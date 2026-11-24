import { computeGearBonus, migrateGearItem, rollStageDrops, starterGear, type Equipped, type GearBonus, type GearItem, type GearSlotId } from './equipment';
import type { StageId, TdSaveData, TowerId } from './types';
import { makeGearItem as makeGear, GEAR_SLOTS as SLOTS } from './equipment';
import { ALL_ELEMENTS as ELS } from './elements';

/**
 * Khoá lưu trữ mới riêng cho bản Thủ Thành — tuyệt đối không đọc bản lưu nhập vai cũ.
 */
import { STAGES } from './tdDefinitions';
import { nextVehicleToUnlock, stageGrantsVehicle, type VehicleId } from './vehicles';

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
        parsed.unlockedStage === 2 || parsed.unlockedStage === 3 || parsed.unlockedStage === 4 ? parsed.unlockedStage : 1,
      starsByStage: parsed.starsByStage ?? {},
      bestLivesByStage: parsed.bestLivesByStage ?? {},
      tutorialDone: parsed.tutorialDone === true,
      badges: Array.isArray(parsed.badges) ? parsed.badges : [],
      streetLoadout: Array.isArray(parsed.streetLoadout) ? parsed.streetLoadout : undefined,
      vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : ['di_bo'],
      vehicle: typeof parsed.vehicle === 'string' ? parsed.vehicle : 'di_bo',
      gearInventory: Array.isArray(parsed.gearInventory)
        ? parsed.gearInventory.map(migrateGearItem).filter((x): x is GearItem => x !== null)
        : starterGear(),
      gearEquipped: parsed.gearEquipped ?? (Array.isArray(parsed.gearInventory) ? {} : { hat: 'starter_hat', glasses: 'starter_glasses' }),
      hardStarsByStage: parsed.hardStarsByStage && typeof parsed.hardStarsByStage === 'object' ? parsed.hardStarsByStage : {},
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return createDefaultTdSave();
  }
}

export function saveTdProgress(
  stageId: StageId,
  stars: 1 | 2 | 3,
  livesRemaining: number,
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
): TdSaveData {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  const current = loadTdSave(store);

  current.lastVehicleUnlocked = undefined;
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
  } else if (stageId === 'stage_3' && current.unlockedStage < 4) {
    current.unlockedStage = 4; // mở trận trùm phố
  } else if (stageId === 'stage_4') {
    current.badges = Array.from(new Set([...(current.badges ?? []), 'giu_tron_pho']));
  }

  // Xe: thắng lần đầu màn ra phố đặc biệt → nhận xe kế tiếp (vehicles.ts)
  const st = STAGES[stageId];
  if (prevStars === 0 && st && stageGrantsVehicle(st)) {
    const owned = (current.vehicles ?? ['di_bo']) as VehicleId[];
    const nv = nextVehicleToUnlock(owned);
    if (nv) {
      current.vehicles = [...owned, nv];
      current.lastVehicleUnlocked = nv;
    }
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
/** Ghi sao chế độ ★ Khó */
export function saveHardWin(stageId: StageId, stars: 1 | 2 | 3, storage?: Pick<Storage, 'getItem' | 'setItem'>): void {
  const store = resolveStore(storage);
  const cur = loadTdSave(store);
  cur.hardStarsByStage = { ...(cur.hardStarsByStage ?? {}) };
  if (stars > (cur.hardStarsByStage[stageId] ?? 0)) cur.hardStarsByStage[stageId] = stars;
  writeSave(store, cur);
}

export function grantStageDrops(
  stageNumber: number,
  stars: 1 | 2 | 3,
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
  rng: () => number = Math.random,
): GearItem[] {
  const store = resolveStore(storage);
  const cur = loadTdSave(store);
  const extra = getGearBonus(cur).stats.extra_drop; // "Khách quen"
  const prefix = `g${Date.now().toString(36)}${Math.floor(rng() * 1e6).toString(36)}`;
  const drops = rollStageDrops(stageNumber, stars, rng, prefix, extra);
  if (stageNumber === 4) {
    // Thắng trùm phố: chắc chắn 1 món Hàng hiệu
    const slot = SLOTS[Math.floor(rng() * SLOTS.length)]!.id;
    const el = ELS[Math.floor(rng() * ELS.length)]!;
    drops.push(makeGear(slot, el, 'hieu', `${prefix}_hieu`, rng));
  }
  cur.gearInventory = [...(cur.gearInventory ?? []), ...drops];
  cur.updatedAt = Date.now();
  writeSave(store, cur);
  return drops;
}

/** Hướng dẫn chơi lần đầu: chỉ hiện khi chưa xem và chưa từng thắng màn nào */
export function shouldShowTutorial(storage?: Pick<Storage, 'getItem' | 'setItem'>): boolean {
  const cur = loadTdSave(resolveStore(storage));
  return !cur.tutorialDone && Object.keys(cur.starsByStage).length === 0;
}

export function markTutorialDone(storage?: Pick<Storage, 'getItem' | 'setItem'>): void {
  const store = resolveStore(storage);
  const cur = loadTdSave(store);
  cur.tutorialDone = true;
  cur.updatedAt = Date.now();
  writeSave(store, cur);
}

/** Bộ món mang ra trận trùm phố (lưu trên máy). Trả về bộ đã lọc hợp lệ. */
export function saveStreetLoadout(loadout: TowerId[], allowed: TowerId[], size: number, storage?: Pick<Storage, 'getItem' | 'setItem'>): TowerId[] {
  const clean = Array.from(new Set(loadout.filter((id) => allowed.includes(id)))).slice(0, size);
  const store = resolveStore(storage);
  const cur = loadTdSave(store);
  cur.streetLoadout = clean;
  cur.updatedAt = Date.now();
  writeSave(store, cur);
  return clean;
}

/** Chọn xe đi phố */
export function chooseVehicle(id: VehicleId, storage?: Pick<Storage, 'getItem' | 'setItem'>): TdSaveData {
  const store = resolveStore(storage);
  const cur = loadTdSave(store);
  if ((cur.vehicles ?? ['di_bo']).includes(id)) cur.vehicle = id;
  writeSave(store, cur);
  return cur;
}

/** Xe đang đi (luôn hợp lệ) */
export function getVehicle(save: TdSaveData): VehicleId {
  const v = (save.vehicle ?? 'di_bo') as VehicleId;
  return (save.vehicles ?? ['di_bo']).includes(v) ? v : 'di_bo';
}
