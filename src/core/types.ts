export type ElementType = 'kim' | 'moc' | 'thuy' | 'hoa' | 'tho';

export type TowerRole = 'single_far' | 'heavy_slow' | 'slow_aura' | 'aoe_splash' | 'support_buff';

export type ShoeTowerId = 'wood_tower' | 'metal_tower' | 'water_tower' | 'fire_tower' | 'earth_tower';

/** Món tiệm bánh (Màn 2) — Claude làm sườn, xem src/core/shops/bakery.ts */
export type BakeryTowerId = 'bk_swatter' | 'bk_jar' | 'bk_fan' | 'bk_oven' | 'bk_fridge';

export type TowerId = ShoeTowerId | BakeryTowerId;

export type TowerTier = 1 | 2 | 3;

export type TowerBranch = 'A' | 'B';

export interface TowerTierStats {
  name: string;
  cost: number;
  damage: number;
  range: number;
  cooldownSec: number;
  splashRadius?: number;
  slowPercent?: number;
  slowDurationSec?: number;
  pierceCount?: number;
  burnDps?: number;
  burnDurationSec?: number;
  stunDurationSec?: number;
  knockbackDist?: number;
  buffDamagePct?: number;
  buffSpeedPct?: number;
  buffRangePct?: number;
  cleanseDisrupt?: boolean;
  bonusKillReward?: number;
  description: string;
}

export interface TowerDefinition {
  id: TowerId;
  element: ElementType;
  role: TowerRole;
  roleLabel: string;
  tier1: TowerTierStats;
  tier2: TowerTierStats;
  tier3A: TowerTierStats;
  tier3B: TowerTierStats;
}

/** Quái tiệm bánh (Màn 2). Chuột dùng lại 'disrupt_water'. */
export type BakeryEnemyId = 'bk_humid' | 'bk_flour' | 'bk_fly' | 'bk_mold' | 'bk_ember' | 'bk_ember_mini';

export type EnemyId = ShoeEnemyId | BakeryEnemyId;

export type ShoeEnemyId =
  | 'fast_metal'
  | 'tank_earth'
  | 'fly_wood'
  | 'split_fire'
  | 'split_fire_mini'
  | 'disrupt_water'
  | 'healer_wood'
  | 'boss_water';

export type EnemyTrait = 'fast' | 'tank' | 'flying' | 'splitter' | 'mini' | 'disruptor' | 'healer' | 'boss';

export interface EnemyDefinition {
  id: EnemyId;
  name: string;
  element: ElementType;
  trait: EnemyTrait;
  traitLabel: string;
  maxHp: number;
  speed: number; // đơn vị toạ độ chuẩn / giây
  armor: number; // % giảm sát thương cơ bản (0..0.5)
  reward: number; // linh thạch rơi ra
  lifeCost: number; // số mạng thành bị trừ khi lọt qua
  radius: number;
  flying?: boolean;
  splitChildId?: EnemyId;
  splitCount?: number;
  disruptRadius?: number;
  disruptIntervalSec?: number;
  disruptDurationSec?: number;
  healRadius?: number;
  healIntervalSec?: number;
  healAmount?: number;
  shieldIntervalSec?: number;
  shieldDurationSec?: number;
  shieldReductionPct?: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface BuildPad {
  id: string;
  x: number;
  y: number;
}

export interface WaveSpawnGroup {
  enemyId: EnemyId;
  count: number;
  intervalSec: number;
  delayBeforeSec: number;
  pathIndex: number;
  hpScale?: number;
}

export interface WaveDefinition {
  waveNumber: number;
  title: string;
  mainElements: ElementType[];
  earlyBonusMax: number;
  clearReward: number;
  groups: WaveSpawnGroup[];
}

export interface StageDefinition {
  id: 'stage_1' | 'stage_2' | 'stage_3';
  stageNumber: 1 | 2 | 3;
  name: string;
  subtitle: string;
  startingEssence: number;
  startingLives: number;
  paths: Point2D[][]; // toạ độ trong khung logic chuẩn 360 x 520
  pads: BuildPad[];
  waves: WaveDefinition[];
  /** 5 món của tiệm này (mặc định: 5 món tiệm giày) */
  towerIds?: TowerId[];
  /** Bật tương sinh: món đặt cạnh món sinh ra hành của nó được +15% sức (từ Màn 2) */
  enableSynergy?: boolean;
}

export interface ActiveTower {
  uid: string;
  padId: string;
  defId: TowerId;
  element: ElementType;
  x: number;
  y: number;
  tier: TowerTier;
  branch?: TowerBranch;
  totalInvested: number;
  cooldownRemaining: number;
  disruptedRemaining: number;
  shotsFired: number;
  buffDamageMultiplier: number;
  buffSpeedMultiplier: number;
  buffRangeMultiplier: number;
  protectedFromDisrupt: boolean;
  bonusKillEssence: number;
  /** uid món đang tương sinh cho món này (để vẽ đường sáng), nếu có */
  synergyFromUid?: string;
}

export interface ActiveEnemy {
  uid: string;
  defId: EnemyId;
  element: ElementType;
  trait: EnemyTrait;
  hp: number;
  maxHp: number;
  baseSpeed: number;
  armor: number;
  reward: number;
  lifeCost: number;
  flying: boolean;
  pathIndex: number;
  waypointIndex: number;
  distanceTraveled: number;
  x: number;
  y: number;
  slowPercent: number;
  slowRemaining: number;
  stunRemaining: number;
  burnDps: number;
  burnRemaining: number;
  armorDebuffPct: number;
  abilityTimer: number;
  shieldRemaining: number;
  shieldTimer: number;
  hitFlashRemaining: number;
}

export interface CombatEvent {
  type:
    | 'shot'
    | 'hit'
    | 'kill'
    | 'split'
    | 'leak'
    | 'disrupt'
    | 'cleanse'
    | 'heal'
    | 'shield'
    | 'wave_start'
    | 'wave_clear'
    | 'stage_win'
    | 'stage_lose';
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  element?: ElementType;
  damage?: number;
  isCounter?: boolean;
  isCountered?: boolean;
  reward?: number;
  enemyUid?: string;
  enemyDefId?: EnemyId;
  towerUid?: string;
  towerDefId?: TowerId;
  splashRadius?: number;
  text?: string;
}

export interface TdSaveData {
  version: 1;
  unlockedStage: 1 | 2 | 3;
  starsByStage: Partial<Record<'stage_1' | 'stage_2' | 'stage_3', 1 | 2 | 3>>;
  bestLivesByStage: Partial<Record<'stage_1' | 'stage_2' | 'stage_3', number>>;
  updatedAt: number;
}
