import { ALLY_ARCHETYPES } from '../core/aiDecisionTree';
import {
  applyExperience,
  computeEffectiveStats,
  computeScaledBaseStats,
  xpRequiredForLevel,
} from '../core/combat';
import {
  craftEquipment,
  generateEquipmentInstance,
  getEquipmentSellPrice,
  type CraftEquipmentResult,
} from '../core/equipmentGen';
import {
  joinPlayerGuild,
  leavePlayerGuild,
  resolveWeeklySiege,
  simulateGuildWorldHours,
  type GuildId,
  type PlayerSiegeSupport,
  type SiegeResult,
} from '../core/guildSystem';
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
  advanceMainQuestProgress,
  completeMainQuestStep,
  unlockMainQuestGd2,
  type MainStoryChoiceId,
} from '../core/reputation';
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
  EquipmentInstance,
  EquipmentRarity,
  EquipmentSlot,
  MapId,
  QuestId,
  SaveData,
  SectId,
  Vec2,
} from '../core/types';
import { computeOfflineCatchupHours, decomposeWorldClock } from '../core/worldClock';

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
  bossId?: string;
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

    // Mô phỏng bù thế giới bang hội AI trong lúc đóng game (giới hạn tối đa 1 tuần = 168 giờ trong game)
    const catchupHours = computeOfflineCatchupHours(loaded.savedAt);
    if (catchupHours > 0) {
      this.advanceWorldHours(catchupHours);
      this.persist(true);
    }

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
    return computeEffectiveStats(scaled, d.equipment, ITEMS, d.equippedInstances);
  }

  public getXpToNext(): number {
    return xpRequiredForLevel(this.getData().level);
  }

  public pushToast(text: string, color = '#f4ead5'): void {
    this.toastSeq += 1;
    const id = this.toastSeq;
    this.toasts = [...this.toasts.slice(-2), { id, text, color }];
    this.notify();
    if (typeof setTimeout !== 'undefined') {
      setTimeout(() => {
        const before = this.toasts.length;
        this.toasts = this.toasts.filter((t) => t.id !== id);
        if (this.toasts.length !== before) {
          this.notify();
        }
      }, 4500);
    }
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
    const item = ITEMS[itemId];
    if (!item || (item.kind !== 'weapon' && item.kind !== 'armor' && item.kind !== 'charm')) {
      return false;
    }
    const slot: EquipmentSlot = item.kind;
    const prevRolled = d.equippedInstances[slot];
    if (prevRolled) {
      d.rolledBag = [...d.rolledBag, prevRolled];
      d.equippedInstances = { ...d.equippedInstances, [slot]: null };
      d.equipment = { ...d.equipment, [slot]: null };
    }
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

  public addRolledEquipment(
    baseItemId: string,
    itemLevel?: number,
    rarity?: EquipmentRarity,
  ): EquipmentInstance {
    const d = this.getData();
    d.nextSeed = (d.nextSeed + 1013904223) >>> 0;
    const inst = generateEquipmentInstance({
      baseItemId,
      itemLevel: itemLevel ?? Math.max(1, d.level),
      rarity,
      seed: d.nextSeed,
    });
    d.rolledBag = [...d.rolledBag, inst];
    this.persist(false);
    this.notify();
    return inst;
  }

  public equipRolledItem(uid: string): boolean {
    const d = this.getData();
    const idx = d.rolledBag.findIndex((i) => i.uid === uid);
    if (idx === -1) return false;
    const target = d.rolledBag[idx];
    const slot = target.slot;

    const nextRolledBag = d.rolledBag.filter((i) => i.uid !== uid);
    const prevRolled = d.equippedInstances[slot];
    if (prevRolled) {
      nextRolledBag.push(prevRolled);
    } else if (d.equipment[slot]) {
      d.inventory = addInventoryItem(d.inventory, d.equipment[slot]!, 1);
    }

    d.rolledBag = nextRolledBag;
    d.equippedInstances = { ...d.equippedInstances, [slot]: target };
    d.equipment = { ...d.equipment, [slot]: target.baseItemId };

    const stats = this.getEffectiveStats();
    d.hp = Math.min(d.hp, stats.maxHp);
    this.persist(true);
    this.notify();
    return true;
  }

  public sellRolledItem(uid: string): { success: boolean; gained: number } {
    const d = this.getData();
    const item = d.rolledBag.find((i) => i.uid === uid);
    if (!item) return { success: false, gained: 0 };
    const price = getEquipmentSellPrice(item);
    if (price <= 0) return { success: false, gained: 0 };
    d.rolledBag = d.rolledBag.filter((i) => i.uid !== uid);
    d.silver += price;
    this.persist(true);
    this.notify();
    return { success: true, gained: price };
  }

  public craftRolledItems(uids: string[]): CraftEquipmentResult {
    const d = this.getData();
    const inputs = uids
      .map((u) => d.rolledBag.find((i) => i.uid === u))
      .filter((i): i is EquipmentInstance => Boolean(i));

    d.nextSeed = (d.nextSeed + 1664525) >>> 0;
    const res = craftEquipment({
      inputs,
      silver: d.silver,
      spiritStones: d.spiritStones,
      seed: d.nextSeed,
    });
    if (!res.success || !res.result) {
      return res;
    }

    const consumedSet = new Set(res.consumedUids);
    d.rolledBag = [...d.rolledBag.filter((i) => !consumedSet.has(i.uid)), res.result];
    d.silver = res.silver;
    d.spiritStones = res.spiritStones;
    this.persist(true);
    this.notify();
    return res;
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
    rolledItem?: EquipmentInstance;
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
    let rolledItem: EquipmentInstance | undefined;
    if (res.reward.rolledRewardSlot && res.reward.rolledRewardRarity) {
      const baseId =
        res.reward.rolledRewardSlot === 'weapon'
          ? 'wpn_mine_spear'
          : res.reward.rolledRewardSlot === 'armor'
            ? 'arm_bronze_mail'
            : 'chm_hoa';
      rolledItem = this.addRolledEquipment(baseId, Math.max(4, d.level), res.reward.rolledRewardRarity);
    }
    const lvl = this.gainXp(res.reward.xp);
    this.persist(true);
    this.notify();
    return {
      completed: true,
      itemId: res.reward.itemId,
      rolledItem,
      silver: res.reward.silver,
      spiritStones: res.reward.spiritStones,
      xp: res.reward.xp,
      levelsGained: lvl.levelsGained,
    };
  }

  // ============ BANG HỘI AI & THẾ GIỚI SỐNG (LÕI GĐ2) ============

  public advanceWorldHours(
    deltaHours: number,
    playerSupport?: PlayerSiegeSupport | null,
  ): SiegeResult[] {
    const d = this.getData();
    d.nextSeed = (d.nextSeed + 2246822519) >>> 0;
    const sim = simulateGuildWorldHours(d.guildWorld, deltaHours, d.nextSeed, playerSupport);
    d.guildWorld = sim.world;
    this.persist(false);
    this.notify();
    return sim.siegeResults;
  }

  public joinGuild(guildId: GuildId): void {
    const d = this.getData();
    d.guildWorld = joinPlayerGuild(d.guildWorld, guildId);
    this.persist(true);
    this.notify();
  }

  public leaveGuild(): void {
    const d = this.getData();
    d.guildWorld = leavePlayerGuild(d.guildWorld);
    this.persist(true);
    this.notify();
  }

  public runWeeklySiegeNow(playerContribution = 0): SiegeResult {
    const d = this.getData();
    const clock = decomposeWorldClock(d.guildWorld.clockHours);
    const targetWeek = Math.max(clock.week, d.guildWorld.lastSiegeWeek + 1);
    const support: PlayerSiegeSupport | null =
      d.guildWorld.playerGuildId && playerContribution > 0
        ? { guildId: d.guildWorld.playerGuildId, contribution: playerContribution }
        : null;
    d.nextSeed = (d.nextSeed + 3266489917) >>> 0;
    const res = resolveWeeklySiege(d.guildWorld, targetWeek, d.nextSeed, support);
    d.guildWorld = res.world;
    this.persist(true);
    this.notify();
    return res.result;
  }

  // ============ NHIỆM VỤ CHÍNH & THÁI ĐỘ 3 MÔN PHÁI (LÕI GĐ2) ============

  public unlockMainStory(): void {
    const d = this.getData();
    d.mainQuestGd2 = unlockMainQuestGd2(d.mainQuestGd2);
    this.persist(true);
    this.notify();
  }

  public progressMainStory(delta = 1): void {
    const d = this.getData();
    d.mainQuestGd2 = advanceMainQuestProgress(d.mainQuestGd2, delta);
    this.persist(true);
    this.notify();
  }

  public advanceMainStoryStep(choiceId?: MainStoryChoiceId): boolean {
    const d = this.getData();
    const res = completeMainQuestStep(d.mainQuestGd2, d.sectReputation, choiceId);
    if (!res.advanced) return false;
    d.mainQuestGd2 = res.state;
    d.sectReputation = res.reputation;
    this.persist(true);
    this.notify();
    return true;
  }
}

export const gameState = new GameStateStore();
