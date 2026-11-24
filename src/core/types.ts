export type ElementType = 'kim' | 'moc' | 'thuy' | 'hoa' | 'tho';

/** Mã màn: 3 tiệm + trận trùm phố */
export type StageId = 'stage_1' | 'stage_2' | 'stage_3' | 'stage_4' | `street_${string}`;

export type TowerRole = 'single_far' | 'heavy_slow' | 'slow_aura' | 'aoe_splash' | 'support_buff';

export type ShoeTowerId = 'wood_tower' | 'metal_tower' | 'water_tower' | 'fire_tower' | 'earth_tower';

/** Món tiệm bánh (Màn 2) — Claude làm sườn, xem src/core/shops/bakery.ts */
export type BakeryTowerId = 'bk_swatter' | 'bk_jar' | 'bk_fan' | 'bk_oven' | 'bk_fridge';

/** Món tiệm hoa (Màn 3) — xem src/core/shops/flower.ts */
export type FlowerTowerId = 'fl_can' | 'fl_shears' | 'fl_lime' | 'fl_heater' | 'fl_vent';

/** Món sinh ra bởi máy làm màn (phố thật) */
export type GeneratedTowerId = `gt_${string}`;

export type TowerId = ShoeTowerId | BakeryTowerId | FlowerTowerId | GeneratedTowerId;

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
  /** Hình Spark vẽ theo loại địa điểm (art/spark/mon_<art>_b*.png) — game dùng thay hình tạm */
  art?: string;
  /** Tên tuyệt chiêu bậc 4 (món sinh tự động) */
  ultimateName?: string;
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

/** Quái tiệm hoa (Màn 3). Nắng Gắt dùng lại 'fly_wood'. */
export type FlowerEnemyId = 'fl_aphid' | 'fl_snail' | 'fl_dust' | 'fl_dust_mini' | 'fl_frost' | 'fl_rot' | 'fl_monsoon';

/** Trùm phố (Màn trùm phố) */
export type StreetBossEnemyId = 'st_bao_loc';

/** Quái sinh ra bởi máy làm màn (phố thật) */
export type GeneratedEnemyId = `ge_${string}`;

export type EnemyId = ShoeEnemyId | BakeryEnemyId | FlowerEnemyId | StreetBossEnemyId | GeneratedEnemyId;

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
  /** Hình Spark vẽ (art/spark/quai_<art>.png) */
  art?: string;
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
  /** Trùm đổi hành: mỗi khi mất 1 phần máu bằng nhau thì sang hành kế tiếp trong danh sách */
  phaseElements?: ElementType[];
  /** Trùm gọi quân: mỗi summonIntervalSec giây gọi summonCount con; loại quân theo hành hiện tại (cùng chỉ số với phaseElements) */
  summonIds?: EnemyId[];
  summonIntervalSec?: number;
  summonCount?: number;
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
  id: StageId;
  stageNumber: number;
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
  /** Trận trùm phố: chỉ mang được bấy nhiêu loại món (chọn từ towerIds) */
  loadoutSize?: number;
  /** Bộ món mang theo mặc định nếu người chơi chưa chọn */
  defaultLoadout?: TowerId[];
  /** Kế hoạch cho bot (màn sinh tự động) */
  botPlan?: { padId: string; defId: TowerId; preferredBranch: TowerBranch }[];
  /** Phố thật: ghi nguồn bản đồ */
  attribution?: string;
  /** Phố thật: danh sách địa điểm dọc phố (tên trong game) */
  places?: { key: string; name: string; type: string; trait: string; towerId: TowerId }[];
  /** Phố thật: màn này thuộc phố nào (id màn trùm của phố) */
  streetId?: StageId;
  /** Phố thật: màn tiệm thứ mấy (1..n); không có = màn phố (trùm) */
  shopIndex?: number;
  /** Dùng nền / ảnh bản đồ của màn khác (màn tiệm dùng nền phố) */
  mapStageId?: StageId;
  /** Món của tiệm chính trong màn tiệm */
  featuredTowerId?: TowerId;
  /** Màn tiệm: mặt tiền tiệm chính (khung trong facade_atlas) và chỗ đặt trên nền (toạ độ khung 360×520) */
  facadeKey?: string;
  facadeSpot?: { x: number; y: number; size: number };
  /** Màn tiệm phố thật: kiểu nội thất + bố cục phòng (nền map_<id>.webp do make_room_map.py vẽ) */
  roomStyle?: 'luu_tru' | 'quan_an' | 'cafe' | 'tiem';
  roomLayout?: string;
  /** Màn phố: đồ dọn phố (luôn được mang) và số món tiệm tối đa được mang thêm */
  cleanTowerIds?: TowerId[];
  maxShopTowers?: number;
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
  /** Độ dài chuỗi tương sinh dài nhất đi qua món này (1 = không có chuỗi) */
  synergyChainLength?: number;
  /** Bậc 4: đã có tuyệt chiêu */
  hasUltimate?: boolean;
  /** Bậc 4: còn bao nhiêu giây mới dùng lại được */
  ultimateCooldownRemaining?: number;
  /** Bậc 4: hiệu ứng kéo dài (bắn nhanh / hỗ trợ) còn bao nhiêu giây */
  ultimateActiveRemaining?: number;
  /** Đang được món hỗ trợ dùng tuyệt chiêu tăng tốc: còn bao nhiêu giây */
  ultimateHasteRemaining?: number;
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
  /** Trùm gọi quân: đếm giờ */
  summonTimer?: number;
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
    | 'element_shift'
    | 'ultimate'
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
  unlockedStage: 1 | 2 | 3 | 4;
  starsByStage: Partial<Record<StageId, 1 | 2 | 3>>;
  bestLivesByStage: Partial<Record<StageId, number>>;
  /** Huy hiệu (vd 'giu_tron_pho') */
  badges?: string[];
  /** Bộ món mang ra trận trùm phố */
  streetLoadout?: TowerId[];
  /** Xe đã có (vehicles.ts) và xe đang đi */
  vehicles?: string[];
  vehicle?: string;
  /** Xe vừa nhận ở lần thắng gần nhất (để màn kết quả báo) */
  lastVehicleUnlocked?: string;
  /** Kho trang bị chủ tiệm (equipment.ts) */
  gearInventory?: import('./equipment').GearItem[];
  /** Đã xem / bỏ qua hướng dẫn chơi lần đầu */
  tutorialDone?: boolean;
  /** Món đang mặc theo ô: uid trong kho */
  gearEquipped?: Partial<Record<import('./equipment').GearSlotId, string>>;
  updatedAt: number;
}
