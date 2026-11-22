import { ALLY_ARCHETYPES } from './aiDecisionTree';
import { MAPS } from './maps';
import { createInitialQuests } from './quests';
import { SECTS } from './skills';
import type { SaveData, SectId } from './types';

export const SAVE_STORAGE_KEY = 'giang_ho_ai_save_v1';
export const SAVE_VERSION = 1;

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

export function isValidSaveData(raw: unknown): raw is SaveData {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Record<string, unknown>;
  if (obj.version !== SAVE_VERSION) return false;
  if (obj.sectId !== 'sect_open' && obj.sectId !== 'sect_closed' && obj.sectId !== 'sect_ban') {
    return false;
  }
  if (obj.mapId !== 'map_town' && obj.mapId !== 'map_forest' && obj.mapId !== 'map_cave') {
    return false;
  }
  if (typeof obj.level !== 'number' || typeof obj.hp !== 'number' || typeof obj.silver !== 'number') {
    return false;
  }
  if (!obj.playerPos || typeof obj.playerPos !== 'object') return false;
  if (!Array.isArray(obj.inventory) || !Array.isArray(obj.allies)) return false;
  if (!obj.quests || typeof obj.quests !== 'object') return false;
  return true;
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

export function loadGameState(storage?: KeyValueStorage | null): SaveData | null {
  const backend = storage !== undefined ? storage : getDefaultStorage();
  if (!backend) return null;
  try {
    const raw = backend.getItem(SAVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidSaveData(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearGameState(storage?: KeyValueStorage | null): void {
  const backend = storage !== undefined ? storage : getDefaultStorage();
  if (!backend) return;
  try {
    backend.removeItem(SAVE_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}
