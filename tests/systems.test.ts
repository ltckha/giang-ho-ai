import { describe, expect, it } from 'vitest';
import {
  addInventoryItem,
  buyItem,
  countInventoryItem,
  equipItem,
  sellItem,
} from '../src/core/inventory';
import { MAPS, resolveMapMovement } from '../src/core/maps';
import {
  advanceQuestProgress,
  completeQuest,
  createInitialQuests,
  startQuest,
} from '../src/core/quests';
import {
  clearGameState,
  createNewSave,
  loadGameState,
  saveGameState,
  type KeyValueStorage,
} from '../src/core/saveSystem';

function createMemoryStorage(): KeyValueStorage {
  const store = new Map<string, string>();
  return {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => {
      store.set(k, v);
    },
    removeItem: (k) => {
      store.delete(k);
    },
  };
}

describe('Túi đồ, tiệm mua bán, nhiệm vụ, bản đồ và tự lưu', () => {
  it('mua đồ, mặc trang bị (trả đồ cũ về túi) và bán đồ đúng giá', () => {
    const save = createNewSave('sect_open');
    let silver = 200;
    let inv = save.inventory;
    let eq = save.equipment;

    const bought = buyItem(silver, inv, 'wpn_mine_spear');
    expect(bought.success).toBe(true);
    silver = bought.silver;
    inv = bought.inventory;
    expect(silver).toBe(110);
    expect(countInventoryItem(inv, 'wpn_mine_spear')).toBe(1);

    const equipped = equipItem(inv, eq, 'wpn_mine_spear');
    expect(equipped.equipped).toBe(true);
    inv = equipped.inventory;
    eq = equipped.equipment;
    expect(eq.weapon).toBe('wpn_mine_spear');
    expect(countInventoryItem(inv, 'wpn_wood_staff')).toBe(1);

    const sold = sellItem(silver, inv, 'wpn_wood_staff');
    expect(sold.success).toBe(true);
    expect(sold.gained).toBe(12);
    expect(sold.silver).toBe(122);
    expect(countInventoryItem(sold.inventory, 'wpn_wood_staff')).toBe(0);
  });

  it('không cho bán vật phẩm nhiệm vụ', () => {
    const inv = addInventoryItem([], 'qst_iron_ore', 2);
    const sold = sellItem(50, inv, 'qst_iron_ore');
    expect(sold.success).toBe(false);
    expect(sold.silver).toBe(50);
  });

  it('vòng đời 2 nhiệm vụ phụ và mục tiêu trùm hang', () => {
    let quests = createInitialQuests();
    quests = startQuest(quests, 'quest_blacksmith');
    expect(quests.quest_blacksmith.status).toBe('active');

    quests = advanceQuestProgress(quests, 'quest_blacksmith', 2);
    expect(quests.quest_blacksmith.status).toBe('active');

    quests = advanceQuestProgress(quests, 'quest_blacksmith', 1);
    expect(quests.quest_blacksmith.status).toBe('ready');

    const completed = completeQuest(quests, 'quest_blacksmith');
    expect(completed.reward?.itemId).toBe('wpn_blacksmith_blade');
    expect(completed.quests.quest_blacksmith.status).toBe('completed');

    let q2 = startQuest(completed.quests, 'quest_hallucination');
    q2 = advanceQuestProgress(q2, 'quest_hallucination', 1);
    const q2Done = completeQuest(q2, 'quest_hallucination');
    expect(q2Done.reward?.itemId).toBe('chm_thuy');
  });

  it('xử lý va chạm tường và vật cản trong bản đồ', () => {
    const town = MAPS.map_town;
    const clamped = resolveMapMovement({ x: 10, y: 10 }, 18, town);
    expect(clamped.x).toBeGreaterThanOrEqual(48 + 18);
    expect(clamped.y).toBeGreaterThanOrEqual(48 + 18);
  });

  it('tự lưu, đọc lại và chống dữ liệu hỏng trong localStorage', () => {
    const storage = createMemoryStorage();
    const initial = createNewSave('sect_ban');
    initial.level = 4;
    initial.silver = 185;
    initial.mapId = 'map_forest';

    expect(saveGameState(initial, storage)).toBe(true);
    const loaded = loadGameState(storage);
    expect(loaded).not.toBeNull();
    expect(loaded?.sectId).toBe('sect_ban');
    expect(loaded?.level).toBe(4);
    expect(loaded?.mapId).toBe('map_forest');

    storage.setItem('giang_ho_ai_save_v1', '{broken json');
    expect(loadGameState(storage)).toBeNull();

    clearGameState(storage);
    expect(loadGameState(storage)).toBeNull();
  });
});
