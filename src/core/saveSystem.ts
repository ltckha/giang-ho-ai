import { ALLY_ARCHETYPES } from './aiDecisionTree';
import { createInitialGuildWorld, type GuildWorldState } from './guildSystem';
import { MAPS } from './maps';
import { createInitialQuests } from './quests';
import {
  createInitialMainQuest,
  createInitialSectReputation,
  type MainQuestState,
  type SectReputationMap,
} from './reputation';
import { SECTS } from './skills';
import type { EquipmentInstance, EquippedInstancesState, SaveData, SectId } from './types';

export const LEGACY_SAVE_STORAGE_KEY_V1 = 'giang_ho_ai_save_v1';
export const SAVE_STORAGE_KEY = 'giang_ho_ai_save_v2';
export const SAVE_VERSION = 2;

const VALID_SECT_IDS: ReadonlySet<string> = new Set(['sect_open', 'sect_closed', 'sect_ban']);
const VALID_MAP_IDS: ReadonlySet<string> = new Set(['map_town', 'map_forest', 'map_cave']);
const VALID_QUEST_STATUSES: ReadonlySet<string> = new Set([
  'not_started',
  'active',
  'ready',
  'completed',
]);
const ALLY_ORDER = ['ally_reckless', 'ally_cautious', 'ally_greedy'] as const;

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createNewSave(sectId: SectId): SaveData {
  const sect = SECTS[sectId];
  const town = MAPS.map_town;
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    sectId,
    mapId: 'map_town',
    playerPos: { ...town.defaultSpawn },
    level: 1,
    xp: 0,
    hp: sect.baseStats.maxHp + 10, // bao gồm áo vải khởi đầu
    silver: 60,
    spiritStones: 2,
    equipment: {
      weapon: sect.starterWeaponId,
      armor: sect.starterArmorId,
      charm: null,
    },
    inventory: [
      { itemId: 'pot_heal_small', quantity: 3 },
      { itemId: 'pot_ally_oil', quantity: 1 },
    ],
    quests: createInitialQuests(),
    allies: [
      { id: 'ally_reckless', hp: ALLY_ARCHETYPES.ally_reckless.maxHp },
      { id: 'ally_cautious', hp: ALLY_ARCHETYPES.ally_cautious.maxHp },
      { id: 'ally_greedy', hp: ALLY_ARCHETYPES.ally_greedy.maxHp },
    ],
    bossDefeated: false,
    rolledBag: [],
    equippedInstances: { weapon: null, armor: null, charm: null },
    nextSeed: 20261122,
    guildWorld: createInitialGuildWorld(),
    sectReputation: createInitialSectReputation(sectId),
    mainQuestGd2: createInitialMainQuest(false),
  };
}

function getDefaultStorage(): KeyValueStorage | null {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

function isSupportedRawSaveObject(raw: unknown): raw is Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Record<string, unknown>;
  if (obj.version !== 1 && obj.version !== SAVE_VERSION) return false;
  if (typeof obj.sectId !== 'string' || !VALID_SECT_IDS.has(obj.sectId)) return false;
  if (typeof obj.mapId !== 'string' || !VALID_MAP_IDS.has(obj.mapId)) return false;
  if (
    typeof obj.level !== 'number' ||
    !Number.isFinite(obj.level) ||
    typeof obj.hp !== 'number' ||
    !Number.isFinite(obj.hp) ||
    typeof obj.silver !== 'number' ||
    !Number.isFinite(obj.silver)
  ) {
    return false;
  }
  if (!obj.playerPos || typeof obj.playerPos !== 'object') return false;
  const pos = obj.playerPos as Record<string, unknown>;
  if (typeof pos.x !== 'number' || typeof pos.y !== 'number') return false;
  if (!Array.isArray(obj.inventory) || !Array.isArray(obj.allies)) return false;
  if (!obj.quests || typeof obj.quests !== 'object') return false;
  return true;
}

export function isValidSaveData(raw: unknown): raw is SaveData {
  if (!isSupportedRawSaveObject(raw)) return false;
  return raw.version === SAVE_VERSION;
}

function isEquipmentInstance(v: unknown): v is EquipmentInstance {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.uid === 'string' &&
    typeof o.baseItemId === 'string' &&
    (o.slot === 'weapon' || o.slot === 'armor' || o.slot === 'charm') &&
    (o.rarity === 'common' || o.rarity === 'fine' || o.rarity === 'rare' || o.rarity === 'epic') &&
    typeof o.itemLevel === 'number' &&
    Array.isArray(o.affixes)
  );
}

function normalizeGuildWorld(raw: unknown): GuildWorldState {
  if (!raw || typeof raw !== 'object') {
    return createInitialGuildWorld();
  }
  const obj = raw as Record<string, unknown>;
  if (
    typeof obj.clockHours === 'number' &&
    typeof obj.castleOwnerId === 'string' &&
    obj.guilds &&
    typeof obj.guilds === 'object' &&
    obj.spots &&
    typeof obj.spots === 'object' &&
    obj.relations &&
    typeof obj.relations === 'object'
  ) {
    return obj as unknown as GuildWorldState;
  }
  return createInitialGuildWorld();
}

function normalizeSectReputation(raw: unknown, sectId: SectId): SectReputationMap {
  const base = createInitialSectReputation(sectId);
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;
  return {
    sect_open: typeof o.sect_open === 'number' && Number.isFinite(o.sect_open) ? o.sect_open : base.sect_open,
    sect_closed:
      typeof o.sect_closed === 'number' && Number.isFinite(o.sect_closed) ? o.sect_closed : base.sect_closed,
    sect_ban: typeof o.sect_ban === 'number' && Number.isFinite(o.sect_ban) ? o.sect_ban : base.sect_ban,
  };
}

function normalizeMainQuest(raw: unknown, bossDefeated: boolean): MainQuestState {
  if (!raw || typeof raw !== 'object') {
    return createInitialMainQuest(bossDefeated);
  }
  const o = raw as Record<string, unknown>;
  const step = typeof o.step === 'number' && Number.isFinite(o.step) ? Math.max(0, Math.floor(o.step)) : 0;
  if (step === 0 && bossDefeated) {
    return createInitialMainQuest(true);
  }
  return {
    step,
    stepProgress:
      typeof o.stepProgress === 'number' && Number.isFinite(o.stepProgress)
        ? Math.max(0, Math.floor(o.stepProgress))
        : 0,
    stepTarget:
      typeof o.stepTarget === 'number' && Number.isFinite(o.stepTarget)
        ? Math.max(1, Math.floor(o.stepTarget))
        : 1,
    choicesMade:
      o.choicesMade && typeof o.choicesMade === 'object'
        ? { ...(o.choicesMade as MainQuestState['choicesMade']) }
        : {},
    gd2BossDefeated: Boolean(o.gd2BossDefeated),
  };
}

/**
 * Chuyển đổi bản lưu Giai đoạn 1 (version 1) hoặc bản lưu hiện tại (version 2)
 * sang cấu trúc SaveData chuẩn mới nhất mà không làm mất cấp độ, trang bị, túi đồ hay nhiệm vụ.
 */
export function migrateSaveData(raw: unknown): SaveData | null {
  if (!isSupportedRawSaveObject(raw)) return null;

  const sectId = raw.sectId as SectId;
  const mapId = raw.mapId as SaveData['mapId'];
  const pos = raw.playerPos as { x: number; y: number };
  const defaults = createNewSave(sectId);
  const bossDefeated = Boolean(raw.bossDefeated);

  const rawEq = (raw.equipment && typeof raw.equipment === 'object'
    ? raw.equipment
    : {}) as Record<string, unknown>;
  const equipment: SaveData['equipment'] = {
    weapon:
      typeof rawEq.weapon === 'string'
        ? rawEq.weapon
        : rawEq.weapon === null
          ? null
          : defaults.equipment.weapon,
    armor:
      typeof rawEq.armor === 'string'
        ? rawEq.armor
        : rawEq.armor === null
          ? null
          : defaults.equipment.armor,
    charm: typeof rawEq.charm === 'string' ? rawEq.charm : null,
  };

  const inventory: SaveData['inventory'] = [];
  for (const entry of raw.inventory as unknown[]) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.itemId === 'string' && typeof e.quantity === 'number' && e.quantity > 0) {
      inventory.push({ itemId: e.itemId, quantity: Math.floor(e.quantity) });
    }
  }

  const baseQuests = createInitialQuests();
  const rawQuests = raw.quests as Record<string, unknown>;
  for (const qid of Object.keys(baseQuests) as Array<keyof typeof baseQuests>) {
    const savedQ = rawQuests[qid];
    if (savedQ && typeof savedQ === 'object') {
      const sq = savedQ as Record<string, unknown>;
      const status =
        typeof sq.status === 'string' && VALID_QUEST_STATUSES.has(sq.status)
          ? (sq.status as SaveData['quests'][typeof qid]['status'])
          : baseQuests[qid].status;
      const targetCount =
        typeof sq.targetCount === 'number' && sq.targetCount > 0
          ? Math.floor(sq.targetCount)
          : baseQuests[qid].targetCount;
      const count =
        typeof sq.count === 'number' && sq.count >= 0
          ? Math.min(targetCount, Math.floor(sq.count))
          : baseQuests[qid].count;
      baseQuests[qid] = { status, count, targetCount };
    }
  }

  const savedAlliesMap = new Map<string, number>();
  for (const entry of raw.allies as unknown[]) {
    if (!entry || typeof entry !== 'object') continue;
    const a = entry as Record<string, unknown>;
    if (typeof a.id === 'string' && typeof a.hp === 'number' && Number.isFinite(a.hp)) {
      savedAlliesMap.set(a.id, Math.max(1, Math.round(a.hp)));
    }
  }
  const allies: SaveData['allies'] = ALLY_ORDER.map((id) => ({
    id,
    hp: savedAlliesMap.get(id) ?? ALLY_ARCHETYPES[id].maxHp,
  }));

  const rolledBag: EquipmentInstance[] = Array.isArray(raw.rolledBag)
    ? (raw.rolledBag as unknown[]).filter(isEquipmentInstance)
    : [];

  const rawEquippedInst = (raw.equippedInstances && typeof raw.equippedInstances === 'object'
    ? raw.equippedInstances
    : {}) as Record<string, unknown>;
  const equippedInstances: EquippedInstancesState = {
    weapon: isEquipmentInstance(rawEquippedInst.weapon) ? rawEquippedInst.weapon : null,
    armor: isEquipmentInstance(rawEquippedInst.armor) ? rawEquippedInst.armor : null,
    charm: isEquipmentInstance(rawEquippedInst.charm) ? rawEquippedInst.charm : null,
  };

  return {
    version: SAVE_VERSION,
    savedAt: typeof raw.savedAt === 'number' ? raw.savedAt : Date.now(),
    sectId,
    mapId,
    playerPos: { x: Math.round(pos.x), y: Math.round(pos.y) },
    level: Math.max(1, Math.floor(raw.level as number)),
    xp: typeof raw.xp === 'number' && Number.isFinite(raw.xp) ? Math.max(0, Math.floor(raw.xp)) : 0,
    hp: Math.max(1, Math.round(raw.hp as number)),
    silver: Math.max(0, Math.floor(raw.silver as number)),
    spiritStones:
      typeof raw.spiritStones === 'number' && Number.isFinite(raw.spiritStones)
        ? Math.max(0, Math.floor(raw.spiritStones))
        : 0,
    equipment,
    inventory,
    quests: baseQuests,
    allies,
    bossDefeated,
    rolledBag,
    equippedInstances,
    nextSeed:
      typeof raw.nextSeed === 'number' && Number.isFinite(raw.nextSeed)
        ? Math.floor(raw.nextSeed)
        : 20261122,
    guildWorld: normalizeGuildWorld(raw.guildWorld),
    sectReputation: normalizeSectReputation(raw.sectReputation, sectId),
    mainQuestGd2: normalizeMainQuest(raw.mainQuestGd2, bossDefeated),
  };
}

export function saveGameState(data: SaveData, storage?: KeyValueStorage | null): boolean {
  const backend = storage !== undefined ? storage : getDefaultStorage();
  if (!backend) return false;
  try {
    const payload: SaveData = { ...data, version: SAVE_VERSION, savedAt: Date.now() };
    backend.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

function tryReadAndMigrate(
  backend: KeyValueStorage,
  key: string,
): { data: SaveData; migratedFromV1: boolean } | null {
  try {
    const raw = backend.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const wasV1 =
      Boolean(parsed && typeof parsed === 'object' && (parsed as Record<string, unknown>).version === 1);
    const migrated = migrateSaveData(parsed);
    if (!migrated) return null;
    return { data: migrated, migratedFromV1: wasV1 || key === LEGACY_SAVE_STORAGE_KEY_V1 };
  } catch {
    return null;
  }
}

export function loadGameState(storage?: KeyValueStorage | null): SaveData | null {
  const backend = storage !== undefined ? storage : getDefaultStorage();
  if (!backend) return null;

  // Ưu tiên bản lưu mới (v2); nếu chưa có hoặc hỏng thì tự động chuyển đổi từ bản lưu GĐ1 (v1)
  const v2 = tryReadAndMigrate(backend, SAVE_STORAGE_KEY);
  if (v2) {
    return v2.data;
  }

  const v1 = tryReadAndMigrate(backend, LEGACY_SAVE_STORAGE_KEY_V1);
  if (v1) {
    // Lưu lại sang khóa v2 để lần sau mở trực tiếp, vẫn giữ nguyên dữ liệu đã chuyển đổi
    saveGameState(v1.data, backend);
    return v1.data;
  }

  return null;
}

export function clearGameState(storage?: KeyValueStorage | null): void {
  const backend = storage !== undefined ? storage : getDefaultStorage();
  if (!backend) return;
  try {
    backend.removeItem(SAVE_STORAGE_KEY);
    backend.removeItem(LEGACY_SAVE_STORAGE_KEY_V1);
  } catch {
    // ignore storage errors
  }
}
