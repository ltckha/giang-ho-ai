import { ALLY_ARCHETYPES } from '../core/aiDecisionTree';
import {
  applyExperience,
  computeEffectiveStats,
  computeScaledBaseStats,
  xpRequiredForLevel,
} from '../core/combat';
import {
  ITEMS,
  addInventoryItem,
  buyItem,
  countInventoryItem,
  equipItem,
  removeInventoryItem,
  sellItem,
} from '../core/inventory';
import { MAPS } from '../core/maps';
import { advanceQuestProgress, completeQuest, startQuest } from '../core/quests';
import {
  clearGameState,
  createNewSave,
  loadGameState,
  saveGameState,
} from '../core/saveSystem';
import { SECTS } from '../core/skills';
import type {
  AllyId,
  EffectiveStats,
  MapId,
  QuestId,
  SaveData,
  SectId,
  Vec2,
} from '../core/types';

export interface AllyHudStatus {
  id: AllyId;
  hp: number;
  maxHp: number;
  actionType: string;
  actionLabel: string;
}

export interface BossHudStatus {
  active: boolean;
  hp: number;
  maxHp: number;
  phaseTwo: boolean;
}

export interface ToastNotice {
  id: number;
  text: string;
  color?: string;
}

type Listener = () => void;

/**
 * Trạng thái phiên chơi tập trung, bọc toàn bộ lõi src/core và tự lưu vào localStorage.
 */
class GameStateStore {
  private data: SaveData | null = null;
  private listeners = new Set<Listener>();
  private lastSaveTs = 0;
  private toastSeq = 0;

  public skillCooldowns: [number, number, number, number] = [0, 0, 0, 0];
  public skillMaxCooldowns: [number, number, number, number] = [0.5, 4.5, 7, 10];
  public allyStatuses: AllyHudStatus[] = [];
  public bossStatus: BossHudStatus = { active: false, hp: 0, maxHp: 560, phaseTwo: false };
  public nearbyInteractLabel: string | null = null;
  public toasts: ToastNotice[] = [];
  public playerShieldRemaining = 0;
  public allyAtkBuffRemaining = 0;

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public hasSavedGame(): boolean {
    return loadGameState() !== null;
  }

  public peekSavedGame(): SaveData | null {
    return loadGameState();
  }

  public startNewGame(sectId: SectId): SaveData {
    this.data = createNewSave(sectId);
    this.resetTransientState();
    this.persist(true);
    this.notify();
    return this.data;
  }

  public continueSavedGame(): SaveData | null {
    const loaded = loadGameState();
    if (!loaded) return null;
    this.data = loaded;
    this.resetTransientState();
    this.notify();
    return this.data;
  }

  public resetSave(): void {
    clearGameState();
    this.data = null;
    this.notify();
  }

  private resetTransientState(): void {
    this.skillCooldowns = [0, 0, 0, 0];
    this.playerShieldRemaining = 0;
    this.allyAtkBuffRemaining = 0;
    this.bossStatus = { active: false, hp: 0, maxHp: 560, phaseTwo: false };
    this.nearbyInteractLabel = null;
    this.toasts = [];
    if (this.data) {
      this.allyStatuses = this.data.allies.map((a) => ({
        id: a.id,
        hp: a.hp,
        maxHp: ALLY_ARCHETYPES[a.id].maxHp,
        actionType: 'follow',
        actionLabel: 'Theo đội',
      }));
    }
  }

  public getData(): SaveData {
    if (!this.data) {
      this.data = createNewSave('sect_open');
      this.resetTransientState();
    }
    return this.data;
  }

  public getEffectiveStats(): EffectiveStats {
    const d = this.getData();
    const scaled = computeScaledBaseStats(SECTS[d.sectId].baseStats, d.level);
    return computeEffectiveStats(scaled, d.equipment, ITEMS);
  }

  public getXpToNext(): number {
    return xpRequiredForLevel(this.getData().level);
  }

  public pushToast(text: string, color = '#f4ead5'): void {
    this.toastSeq += 1;
    this.toasts = [...this.toasts.slice(-3), { id: this.toastSeq, text, color }];
    this.notify();
  }

  public persist(force = false): boolean {
    if (!this.data) return false;
    const now = Date.now();
    if (!force && now - this.lastSaveTs < 2500) {
      return false;
    }
    this.lastSaveTs = now;
    return saveGameState(this.data);
  }

  public updatePlayerPos(pos: Vec2): void {
    const d = this.getData();
    d.playerPos = { x: Math.round(pos.x), y: Math.round(pos.y) };
  }

  public setMap(mapId: MapId, spawnPos: Vec2): void {
    const d = this.getData();
    d.mapId = mapId;
    d.playerPos = { x: Math.round(spawnPos.x), y: Math.round(spawnPos.y) };
    this.bossStatus = { active: false, hp: 0, maxHp: 560, phaseTwo: false };
    this.persist(true);
    this.notify();
  }

  public healPlayerAndPartyFull(): void {
    const d = this.getData();
    const stats = this.getEffectiveStats();
    d.hp = stats.maxHp;
    d.allies = d.allies.map((a) => ({
      id: a.id,
      hp: ALLY_ARCHETYPES[a.id].maxHp,
    }));
    this.allyStatuses = this.allyStatuses.map((s) => ({
      ...s,
      hp: s.maxHp,
    }));
    this.notify();
  }

  public respawnInTown(): void {
    const d = this.getData();
    const town = MAPS.map_town;
    d.mapId = 'map_town';
    d.playerPos = { ...town.defaultSpawn };
    this.healPlayerAndPartyFull();
    this.persist(true);
    this.notify();
  }

  public gainXp(amount: number): { levelsGained: number; newLevel: number } {
    const d = this.getData();
    const res = applyExperience({ level: d.level, xp: d.xp }, amount);
    d.level = res.level;
    d.xp = res.xp;
    if (res.levelsGained > 0) {
      const stats = this.getEffectiveStats();
      d.hp = stats.maxHp;
      this.healPlayerAndPartyFull();
      this.persist(true);
    }
    this.notify();
    return { levelsGained: res.levelsGained, newLevel: res.level };
  }

  public addCurrency(silver: number, spiritStones = 0): void {
    const d = this.getData();
    d.silver += Math.max(0, Math.floor(silver));
    d.spiritStones += Math.max(0, Math.floor(spiritStones));
    this.persist(false);
    this.notify();
  }

  public addItem(itemId: string, amount = 1): void {
    const d = this.getData();
    d.inventory = addInventoryItem(d.inventory, itemId, amount);
    if (itemId === 'qst_iron_ore' && d.quests.quest_blacksmith.status === 'active') {
      const totalOre = countInventoryItem(d.inventory, 'qst_iron_ore');
      const neededDelta = Math.max(0, totalOre - d.quests.quest_blacksmith.count);
      if (neededDelta > 0) {
        d.quests = advanceQuestProgress(d.quests, 'quest_blacksmith', neededDelta);
      }
    }
    this.persist(false);
    this.notify();
  }

  public buyShopItem(itemId: string): boolean {
    const d = this.getData();
    const res = buyItem(d.silver, d.inventory, itemId);
    if (!res.success) return false;
    d.silver = res.silver;
    d.inventory = res.inventory;
    this.persist(true);
    this.notify();
    return true;
  }

  public sellBagItem(itemId: string): { success: boolean; gained: number } {
    const d = this.getData();
    const res = sellItem(d.silver, d.inventory, itemId);
    if (!res.success) return { success: false, gained: 0 };
    d.silver = res.silver;
    d.inventory = res.inventory;
    this.persist(true);
    this.notify();
    return { success: true, gained: res.gained };
  }

  public equipBagItem(itemId: string): boolean {
    const d = this.getData();
    const res = equipItem(d.inventory, d.equipment, itemId);
    if (!res.equipped) return false;
    d.inventory = res.inventory;
    d.equipment = res.equipment;
    const stats = this.getEffectiveStats();
    d.hp = Math.min(d.hp, stats.maxHp);
    this.persist(true);
    this.notify();
    return true;
  }

  public useConsumable(itemId: string): { used: boolean; healAmount: number; healParty: boolean } {
    const item = ITEMS[itemId];
    if (!item || item.kind !== 'consumable' || !item.healAmount) {
      return { used: false, healAmount: 0, healParty: false };
    }
    const d = this.getData();
    const removal = removeInventoryItem(d.inventory, itemId, 1);
    if (!removal.removed) {
      return { used: false, healAmount: 0, healParty: false };
    }
    d.inventory = removal.inventory;
    const stats = this.getEffectiveStats();
    d.hp = Math.min(stats.maxHp, d.hp + item.healAmount);
    if (item.healParty) {
      d.allies = d.allies.map((a) => ({
        id: a.id,
        hp: Math.min(ALLY_ARCHETYPES[a.id].maxHp, a.hp + item.healAmount!),
      }));
    }
    this.persist(false);
    this.notify();
    return { used: true, healAmount: item.healAmount, healParty: Boolean(item.healParty) };
  }

  public acceptQuest(questId: QuestId): void {
    const d = this.getData();
    d.quests = startQuest(d.quests, questId);
    // Nếu đã nhặt sẵn quặng linh thiết trước khi nói chuyện với Lão Bính
    if (questId === 'quest_blacksmith') {
      const oreCount = countInventoryItem(d.inventory, 'qst_iron_ore');
      if (oreCount > 0) {
        d.quests = advanceQuestProgress(d.quests, 'quest_blacksmith', oreCount);
      }
    }
    this.persist(true);
    this.notify();
  }

  public progressQuest(questId: QuestId, delta = 1): boolean {
    const d = this.getData();
    const before = d.quests[questId];
    d.quests = advanceQuestProgress(d.quests, questId, delta);
    const after = d.quests[questId];
    const changed = before.count !== after.count || before.status !== after.status;
    if (changed) {
      this.persist(true);
      this.notify();
    }
    return changed;
  }

  public turnInQuest(questId: QuestId): {
    completed: boolean;
    itemId?: string;
    silver: number;
    spiritStones: number;
    xp: number;
    levelsGained: number;
  } {
    const d = this.getData();
    const res = completeQuest(d.quests, questId);
    if (!res.reward) {
      return { completed: false, silver: 0, spiritStones: 0, xp: 0, levelsGained: 0 };
    }
    d.quests = res.quests;
    if (questId === 'quest_blacksmith') {
      const rem = removeInventoryItem(d.inventory, 'qst_iron_ore', 3);
      d.inventory = rem.inventory;
    }
    d.silver += res.reward.silver;
    d.spiritStones += res.reward.spiritStones;
    if (res.reward.itemId) {
      d.inventory = addInventoryItem(d.inventory, res.reward.itemId, 1);
    }
    const lvl = this.gainXp(res.reward.xp);
    this.persist(true);
    this.notify();
    return {
      completed: true,
      itemId: res.reward.itemId,
      silver: res.reward.silver,
      spiritStones: res.reward.spiritStones,
      xp: res.reward.xp,
      levelsGained: lvl.levelsGained,
    };
  }
}

export const gameState = new GameStateStore();
