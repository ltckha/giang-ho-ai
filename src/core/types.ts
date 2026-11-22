export type ElementType = 'kim' | 'moc' | 'thuy' | 'hoa' | 'tho';

export type SectId = 'sect_open' | 'sect_closed' | 'sect_ban';

export type MapId = 'map_town' | 'map_forest' | 'map_cave';

export type AllyPersonality = 'reckless' | 'cautious' | 'greedy';

export type AllyId = 'ally_reckless' | 'ally_cautious' | 'ally_greedy';

export type EquipmentSlot = 'weapon' | 'armor' | 'charm';

export type ItemKind = EquipmentSlot | 'consumable' | 'quest';

export type QuestId = 'quest_blacksmith' | 'quest_hallucination' | 'quest_boss';

export type QuestStatus = 'not_started' | 'active' | 'ready' | 'completed';

export type SkillEffectType =
  | 'melee'
  | 'projectile'
  | 'pierce'
  | 'aoe'
  | 'slow_aoe'
  | 'heal_party'
  | 'shield_self'
  | 'knockback_aoe'
  | 'burn_projectile';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BaseStats {
  maxHp: number;
  atk: number;
  def: number;
  moveSpeed: number;
}

export type EquipmentRarity = 'common' | 'fine' | 'rare' | 'epic';

export type AffixType =
  | 'atk_flat'
  | 'def_flat'
  | 'hp_flat'
  | 'crit_chance'
  | 'armor_pierce'
  | 'move_speed'
  | 'elem_resist'
  | 'ally_atk_pct';

export interface EquipmentAffix {
  type: AffixType;
  value: number;
  element?: ElementType;
}

export interface EquipmentInstance {
  uid: string;
  baseItemId: string;
  slot: EquipmentSlot;
  rarity: EquipmentRarity;
  itemLevel: number;
  affixes: EquipmentAffix[];
  seed: number;
  crafted?: boolean;
}

export interface EffectiveStats extends BaseStats {
  resistElement?: ElementType;
  resistBonus: number;
  imbueElement?: ElementType;
  critChanceBonus?: number;
  armorPierceBonus?: number;
  allyAtkBonus?: number;
  elementResists?: Partial<Record<ElementType, number>>;
}

export interface SkillDef {
  id: string;
  sectId: SectId;
  slot: 1 | 2 | 3 | 4;
  element: ElementType;
  effect: SkillEffectType;
  powerMultiplier: number;
  cooldownSec: number;
  range: number;
  radius?: number;
  armorPierce?: number;
  slowFactor?: number;
  slowDurationSec?: number;
  healPercent?: number;
  healFlat?: number;
  allyAtkBuff?: number;
  allyBuffDurationSec?: number;
  shieldReduction?: number;
  shieldDurationSec?: number;
  thornsDamage?: number;
  burnDps?: number;
  burnDurationSec?: number;
  knockbackForce?: number;
}

export interface SectDef {
  id: SectId;
  element: ElementType;
  baseStats: BaseStats;
  allyPassiveAtkBonus: number;
  skillIds: [string, string, string, string];
  starterWeaponId: string;
  starterArmorId: string;
}

export interface ItemDef {
  id: string;
  kind: ItemKind;
  price: number;
  atkBonus?: number;
  defBonus?: number;
  hpBonus?: number;
  resistElement?: ElementType;
  resistBonus?: number;
  imbueElement?: ElementType;
  healAmount?: number;
  healParty?: boolean;
  minLevel?: number;
}

export interface InventoryEntry {
  itemId: string;
  quantity: number;
}

export interface EquipmentState {
  weapon: string | null;
  armor: string | null;
  charm: string | null;
}

export interface EquippedInstancesState {
  weapon: EquipmentInstance | null;
  armor: EquipmentInstance | null;
  charm: EquipmentInstance | null;
}

export interface QuestProgress {
  status: QuestStatus;
  count: number;
  targetCount: number;
}

export type QuestStateMap = Record<QuestId, QuestProgress>;

export interface EnemyTemplate {
  id: string;
  element: ElementType;
  maxHp: number;
  atk: number;
  def: number;
  moveSpeed: number;
  attackRange: number;
  attackCooldownSec: number;
  xpReward: number;
  silverMin: number;
  silverMax: number;
  spiritStoneChance: number;
  lootTable: Array<{ itemId: string; chance: number }>;
  isBoss?: boolean;
}

export interface SpawnPointDef {
  id: string;
  enemyId: string;
  x: number;
  y: number;
  respawnSec: number;
}

export interface PortalDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  targetMap: MapId;
  targetX: number;
  targetY: number;
}

export interface NpcPlacement {
  id: string;
  role: 'blacksmith' | 'guide' | 'merchant' | 'foundry' | 'guard';
  x: number;
  y: number;
}

export interface LandmarkZone {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'foundry' | 'market' | 'forge' | 'plaza' | 'mine' | 'crossroads' | 'fake_landmark' | 'boss_arena';
}

export interface MapDef {
  id: MapId;
  width: number;
  height: number;
  isSafeZone: boolean;
  defaultSpawn: Vec2;
  obstacles: Rect[];
  landmarks: LandmarkZone[];
  portals: PortalDef[];
  npcs: NpcPlacement[];
  enemySpawns: SpawnPointDef[];
}

export interface AllySaveState {
  id: AllyId;
  hp: number;
}

export interface SaveData {
  version: number;
  savedAt: number;
  sectId: SectId;
  mapId: MapId;
  playerPos: Vec2;
  level: number;
  xp: number;
  hp: number;
  silver: number;
  spiritStones: number;
  equipment: EquipmentState;
  inventory: InventoryEntry[];
  quests: QuestStateMap;
  allies: AllySaveState[];
  bossDefeated: boolean;
}
