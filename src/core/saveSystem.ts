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

const ID_RE = /^[a-z0-9_]{1,64}$/;
const ids = (v: unknown): string[] | undefined => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && ID_RE.test(x)) : undefined);
function numRec(v: unknown, min: number, max: number): Record<string, number> {
  const out: Record<string, number> = {};
  if (v && typeof v === 'object') for (const [k, n] of Object.entries(v as Record<string, unknown>)) if (ID_RE.test(k) && typeof n === 'number' && n >= min && n <= max) out[k] = Math.round(n);
  return out;
}

/**
 * Đọc tiến độ. Đánh giá độc lập 25/11 (C3, V3): kiểm TỪNG phần — phần nào hỏng thì bỏ phần đó (món đồ hỏng bỏ món đó),
 * không bao giờ đổi cả bản lưu về mặc định chỉ vì 1 chỗ hỏng; mã màn / xe / huy hiệu chỉ nhận chữ thường, số, gạch dưới.
 */
export function loadTdSave(storage?: Pick<Storage, 'getItem'>): TdSaveData {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return createDefaultTdSave();
  let parsed: Partial<TdSaveData>;
  try {
    const raw = store.getItem(TD_SAVE_KEY);
    if (!raw) return createDefaultTdSave();
    parsed = JSON.parse(raw) as Partial<TdSaveData>;
    if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) return createDefaultTdSave();
  } catch {
    return createDefaultTdSave();
  }
  const safe = <T,>(f: () => T, fb: T): T => {
    try {
      return f();
    } catch {
      return fb;
    }
  };
  const inv = safe(
    () => (Array.isArray(parsed.gearInventory) ? parsed.gearInventory.map((x) => safe(() => migrateGearItem(x), null)).filter((x): x is GearItem => x !== null) : starterGear()),
    starterGear(),
  );
  const equipped = safe(() => {
    const src = parsed.gearEquipped ?? (Array.isArray(parsed.gearInventory) ? {} : { hat: 'starter_hat', glasses: 'starter_glasses' });
    const out: Record<string, string> = {};
    for (const [slot, uid] of Object.entries(src)) if (ID_RE.test(slot) && typeof uid === 'string' && inv.some((g) => g.uid === uid)) out[slot] = uid;
    return out;
  }, {});
  const vehicle = typeof parsed.vehicle === 'string' && ID_RE.test(parsed.vehicle) ? parsed.vehicle : 'di_bo';
  return {
    version: 1,
    unlockedStage: parsed.unlockedStage === 2 || parsed.unlockedStage === 3 || parsed.unlockedStage === 4 ? parsed.unlockedStage : 1,
    starsByStage: safe(() => numRec(parsed.starsByStage, 1, 3), {}) as TdSaveData['starsByStage'],
    bestLivesByStage: safe(() => numRec(parsed.bestLivesByStage, 0, 999), {}) as TdSaveData['bestLivesByStage'],
    tutorialDone: parsed.tutorialDone === true,
    badges: safe(() => ids(parsed.badges) ?? [], []),
    streetLoadout: safe(() => ids(parsed.streetLoadout) as TdSaveData['streetLoadout'], undefined),
    vehicles: safe(() => ids(parsed.vehicles) ?? ['di_bo'], ['di_bo']),
    vehicle,
    gearInventory: inv,
    gearEquipped: equipped as TdSaveData['gearEquipped'],
    hardStarsByStage: safe(() => numRec(parsed.hardStarsByStage, 1, 3), {}),
    updatedAt: typeof parsed.updatedAt === 'number' && Number.isFinite(parsed.updatedAt) ? parsed.updatedAt : Date.now(),
  };
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
  cur.gearInventory = capInventory([...(cur.gearInventory ?? []), ...drops], cur.gearEquipped ?? {});
  cur.updatedAt = Date.now();
  writeSave(store, cur);
  return drops;
}

/** Túi đồ tối đa 200 món (đánh giá độc lập V2): đầy thì bỏ món yếu nhất không đang mặc */
export const MAX_INVENTORY = 200;
const RARITY_RANK: Record<string, number> = { thuong: 0, tot: 1, xin: 2, hieu: 3 };
export function capInventory(inv: GearItem[], equipped: Partial<Record<string, string>>): GearItem[] {
  if (inv.length <= MAX_INVENTORY) return inv;
  const worn = new Set(Object.values(equipped));
  const power = (g: GearItem) => RARITY_RANK[g.rarity]! * 1000 + g.visible.reduce((a, v) => a + Math.abs(v.value), 0);
  const drop = inv.filter((g) => !worn.has(g.uid)).sort((a, b) => power(a) - power(b)).slice(0, inv.length - MAX_INVENTORY);
  const gone = new Set(drop.map((g) => g.uid));
  return inv.filter((g) => !gone.has(g.uid));
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
