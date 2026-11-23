/**
 * Trận trùm phố — "Dốc Đà Lạt" (sườn Claude; Antigravity vẽ, không đổi số).
 * Mở khi đã qua cả 3 tiệm trên phố. Bản đồ là cả con phố dốc: quái vào từ đầu dốc,
 * đi ngang trước cửa tiệm giày, tiệm bánh, tiệm hoa rồi tới quầy cuối phố.
 * Người chơi được mang món của cả 3 tiệm nhưng chỉ chọn LOADOUT_SIZE loại.
 * Trùm "Bão Lốc Cuối Mùa": đổi hành đủ 5 hành theo máu, gọi bọn phá đồ của từng tiệm ra theo.
 * Máu quái (hpScale) cân theo người chơi đã có ~8 món đồ ngẫu nhiên sau 3 tiệm (anh Kha chốt: độ khó tăng dần, tính cả đồ):
 *   có đồ thực tế: đặt kín ô bừa thắng ~40%, 150 kế hoạch thua ~85%; không đồ: chỉ cách xếp tốt mới thắng sát nút.
 * Cân bằng theo người chơi có 0 đồ (tính kỹ vẫn thắng) và ~6–9 món ngẫu nhiên sau 3 tiệm
 * (đặt bừa vẫn thua phần lớn) — xem docs/review/sim_stage.ts, sim_gear.ts, tests/streetBoss.test.ts.
 */
import type { EnemyDefinition, StageDefinition, StreetBossEnemyId, TowerBranch, TowerId } from '../types';

export const STREET_LOADOUT_SIZE = 6;

export const STREET_BOSS_ENEMIES: Record<StreetBossEnemyId, EnemyDefinition> = {
  st_bao_loc: {
    id: 'st_bao_loc',
    name: 'Bão Lốc Cuối Mùa',
    element: 'thuy',
    trait: 'boss',
    traitLabel: 'Trùm phố: đổi đủ 5 hành, gọi quân từng tiệm',
    maxHp: 5200,
    speed: 20,
    armor: 0.32,
    reward: 200,
    lifeCost: 15,
    radius: 22,
    disruptRadius: 110,
    disruptIntervalSec: 6.5,
    disruptDurationSec: 2.2,
    shieldIntervalSec: 9,
    shieldDurationSec: 2.6,
    shieldReductionPct: 0.5,
    phaseElements: ['thuy', 'moc', 'hoa', 'tho', 'kim'],
    // Theo hành hiện tại: Thủy gọi Giọt Mưa, Mộc gọi Ruồi, Hỏa gọi Than Hồng, Thổ gọi Cục Bùn, Kim gọi Sương Muối
    summonIds: ['fast_metal', 'bk_fly', 'bk_ember', 'tank_earth', 'fl_frost'],
    summonIntervalSec: 7,
    summonCount: 2,
  },
};

/** Đường cả con phố: chữ S dài 3 tầng, mỗi tầng đi ngang trước cửa một tiệm */
const STREET_PATH = [
  { x: 30, y: 24 },
  { x: 30, y: 110 },
  { x: 330, y: 110 },
  { x: 330, y: 230 },
  { x: 30, y: 230 },
  { x: 30, y: 350 },
  { x: 330, y: 350 },
  { x: 330, y: 470 },
];

export const STAGE_4_DEFINITION: StageDefinition = {
  id: 'stage_4',
  stageNumber: 4,
  name: 'Trùm Phố Dốc Đà Lạt',
  subtitle: 'Qua hết 3 tiệm mới mở. Mang 6 loại món của cả phố chặn Bão Lốc Cuối Mùa qua 12 đợt',
  startingEssence: 200,
  startingLives: 20,
  towerIds: [
    'wood_tower', 'metal_tower', 'water_tower', 'fire_tower', 'earth_tower',
    'bk_swatter', 'bk_jar', 'bk_fan', 'bk_oven', 'bk_fridge',
    'fl_can', 'fl_shears', 'fl_lime', 'fl_heater', 'fl_vent',
  ],
  loadoutSize: STREET_LOADOUT_SIZE,
  // Mặc định: đủ 5 hành + 1 hỗ trợ (Dép Tông Mộc, Bốt Kim, Hũ Sành Thổ, Lò Nướng Hỏa, Bình Tưới Thủy, Quạt Thông Gió Mộc)
  defaultLoadout: ['wood_tower', 'metal_tower', 'bk_jar', 'bk_oven', 'fl_can', 'fl_vent'],
  enableSynergy: true,
  paths: [STREET_PATH],
  pads: [
    { id: 'pad_1', x: 100, y: 55 },
    { id: 'pad_2', x: 230, y: 55 },
    { id: 'pad_3', x: 80, y: 170 },
    { id: 'pad_4', x: 180, y: 170 },
    { id: 'pad_5', x: 280, y: 170 },
    { id: 'pad_6', x: 80, y: 290 },
    { id: 'pad_7', x: 180, y: 290 },
    { id: 'pad_8', x: 280, y: 290 },
    { id: 'pad_9', x: 90, y: 410 },
    { id: 'pad_10', x: 190, y: 410 },
    { id: 'pad_11', x: 265, y: 425 },
  ],
  waves: [
    { waveNumber: 1, title: 'Đợt 1: Mưa đầu dốc', mainElements: ['thuy', 'tho'], earlyBonusMax: 12, clearReward: 14, groups: [
      { enemyId: 'fast_metal', count: 8, intervalSec: 0.8, delayBeforeSec: 0, pathIndex: 0, hpScale: 1.19 },
      { enemyId: 'tank_earth', count: 2, intervalSec: 2.0, delayBeforeSec: 1.0, pathIndex: 0, hpScale: 1.19 },
    ] },
    { waveNumber: 2, title: 'Đợt 2: Ruồi bay qua tiệm bánh', mainElements: ['moc', 'hoa'], earlyBonusMax: 14, clearReward: 15, groups: [
      { enemyId: 'bk_fly', count: 6, intervalSec: 0.9, delayBeforeSec: 0, pathIndex: 0, hpScale: 1.42 },
      { enemyId: 'bk_ember', count: 4, intervalSec: 1.3, delayBeforeSec: 0.6, pathIndex: 0, hpScale: 1.42 },
    ] },
    { waveNumber: 3, title: 'Đợt 3: Ốc sên và rệp', mainElements: ['thuy', 'moc'], earlyBonusMax: 15, clearReward: 16, groups: [
      { enemyId: 'fl_snail', count: 4, intervalSec: 1.6, delayBeforeSec: 0, pathIndex: 0, hpScale: 1.6 },
      { enemyId: 'fl_aphid', count: 9, intervalSec: 0.6, delayBeforeSec: 0.4, pathIndex: 0, hpScale: 1.6 },
    ] },
    { waveNumber: 4, title: 'Đợt 4: Chuột cả phố', mainElements: ['kim', 'moc'], earlyBonusMax: 16, clearReward: 16, groups: [
      { enemyId: 'disrupt_water', count: 4, intervalSec: 1.8, delayBeforeSec: 0, pathIndex: 0, hpScale: 1.77 },
      { enemyId: 'split_fire', count: 5, intervalSec: 1.1, delayBeforeSec: 0.5, pathIndex: 0, hpScale: 1.77 },
    ] },
    { waveNumber: 5, title: 'Đợt 5: Nắng gắt giữa trưa', mainElements: ['hoa', 'tho'], earlyBonusMax: 18, clearReward: 16, groups: [
      { enemyId: 'fly_wood', count: 8, intervalSec: 0.7, delayBeforeSec: 0, pathIndex: 0, hpScale: 2.07 },
      { enemyId: 'bk_flour', count: 4, intervalSec: 1.3, delayBeforeSec: 0.4, pathIndex: 0, hpScale: 2.07 },
    ] },
    { waveNumber: 6, title: 'Đợt 6: Nấm mốc lan dọc phố', mainElements: ['moc', 'kim'], earlyBonusMax: 18, clearReward: 16, groups: [
      { enemyId: 'healer_wood', count: 2, intervalSec: 2.0, delayBeforeSec: 0, pathIndex: 0, hpScale: 2.44 },
      { enemyId: 'fl_rot', count: 2, intervalSec: 2.0, delayBeforeSec: 1.0, pathIndex: 0, hpScale: 2.44 },
      { enemyId: 'fl_frost', count: 3, intervalSec: 1.6, delayBeforeSec: 0.4, pathIndex: 0, hpScale: 2.44 },
      { enemyId: 'bk_humid', count: 8, intervalSec: 0.5, delayBeforeSec: 0.3, pathIndex: 0, hpScale: 2.44 },
    ] },
    { waveNumber: 7, title: 'Đợt 7: Bụi đất và bụi bột', mainElements: ['tho', 'hoa'], earlyBonusMax: 20, clearReward: 17, groups: [
      { enemyId: 'fl_dust', count: 6, intervalSec: 0.9, delayBeforeSec: 0, pathIndex: 0, hpScale: 2.85 },
      { enemyId: 'bk_flour', count: 4, intervalSec: 1.2, delayBeforeSec: 0.3, pathIndex: 0, hpScale: 2.85 },
      { enemyId: 'bk_ember', count: 5, intervalSec: 0.9, delayBeforeSec: 0.3, pathIndex: 0, hpScale: 2.85 },
    ] },
    { waveNumber: 8, title: 'Đợt 8: Đêm sương lạnh', mainElements: ['kim', 'thuy', 'moc'], earlyBonusMax: 20, clearReward: 17, groups: [
      { enemyId: 'fl_frost', count: 4, intervalSec: 1.4, delayBeforeSec: 0, pathIndex: 0, hpScale: 3.33 },
      { enemyId: 'fl_snail', count: 4, intervalSec: 1.2, delayBeforeSec: 0.3, pathIndex: 0, hpScale: 3.33 },
      { enemyId: 'fl_aphid', count: 10, intervalSec: 0.45, delayBeforeSec: 0.3, pathIndex: 0, hpScale: 3.33 },
    ] },
    { waveNumber: 9, title: 'Đợt 9: Cả phố loạn', mainElements: ['moc', 'hoa', 'thuy', 'tho'], earlyBonusMax: 22, clearReward: 18, groups: [
      { enemyId: 'split_fire', count: 6, intervalSec: 0.8, delayBeforeSec: 0, pathIndex: 0, hpScale: 3.8 },
      { enemyId: 'fly_wood', count: 6, intervalSec: 0.6, delayBeforeSec: 0.2, pathIndex: 0, hpScale: 3.8 },
      { enemyId: 'fast_metal', count: 10, intervalSec: 0.4, delayBeforeSec: 0.2, pathIndex: 0, hpScale: 3.8 },
      { enemyId: 'tank_earth', count: 4, intervalSec: 1.0, delayBeforeSec: 0.2, pathIndex: 0, hpScale: 3.8 },
    ] },
    { waveNumber: 10, title: 'Đợt 10: Mây đen kéo tới', mainElements: ['moc', 'kim', 'hoa', 'tho'], earlyBonusMax: 22, clearReward: 18, groups: [
      { enemyId: 'bk_mold', count: 3, intervalSec: 1.5, delayBeforeSec: 0, pathIndex: 0, hpScale: 4.28 },
      { enemyId: 'disrupt_water', count: 4, intervalSec: 1.3, delayBeforeSec: 0.2, pathIndex: 0, hpScale: 4.28 },
      { enemyId: 'bk_ember', count: 6, intervalSec: 0.8, delayBeforeSec: 0.2, pathIndex: 0, hpScale: 4.28 },
      { enemyId: 'fl_dust', count: 5, intervalSec: 0.9, delayBeforeSec: 0.2, pathIndex: 0, hpScale: 4.28 },
    ] },
    { waveNumber: 11, title: 'Đợt 11: Gió giật đầu mùa', mainElements: ['thuy', 'moc', 'hoa', 'tho', 'kim'], earlyBonusMax: 24, clearReward: 20, groups: [
      { enemyId: 'fl_snail', count: 5, intervalSec: 1.0, delayBeforeSec: 0, pathIndex: 0, hpScale: 4.75 },
      { enemyId: 'bk_fly', count: 8, intervalSec: 0.5, delayBeforeSec: 0.2, pathIndex: 0, hpScale: 4.75 },
      { enemyId: 'fl_rot', count: 3, intervalSec: 1.4, delayBeforeSec: 0.2, pathIndex: 0, hpScale: 4.75 },
      { enemyId: 'fl_frost', count: 3, intervalSec: 1.4, delayBeforeSec: 0.2, pathIndex: 0, hpScale: 4.75 },
      { enemyId: 'bk_ember', count: 5, intervalSec: 0.8, delayBeforeSec: 0.2, pathIndex: 0, hpScale: 4.75 },
    ] },
    { waveNumber: 12, title: 'Đợt 12: Trùm Bão Lốc Cuối Mùa', mainElements: ['thuy', 'moc', 'hoa', 'tho', 'kim'], earlyBonusMax: 0, clearReward: 0, groups: [
      { enemyId: 'fast_metal', count: 10, intervalSec: 0.4, delayBeforeSec: 0, pathIndex: 0, hpScale: 4.99 },
      { enemyId: 'tank_earth', count: 4, intervalSec: 1.0, delayBeforeSec: 0.2, pathIndex: 0, hpScale: 4.99 },
      { enemyId: 'st_bao_loc', count: 1, intervalSec: 1.0, delayBeforeSec: 2.0, pathIndex: 0, hpScale: 1.19 },
    ] },
  ],
};

export const STAGE_4_BOT_PLAN: { padId: string; defId: TowerId; preferredBranch: TowerBranch }[] = [
  { padId: 'pad_4', defId: 'bk_oven', preferredBranch: 'B' },
  { padId: 'pad_3', defId: 'wood_tower', preferredBranch: 'A' },
  { padId: 'pad_5', defId: 'bk_jar', preferredBranch: 'A' },
  { padId: 'pad_7', defId: 'fl_can', preferredBranch: 'A' },
  { padId: 'pad_6', defId: 'metal_tower', preferredBranch: 'A' },
  { padId: 'pad_8', defId: 'fl_vent', preferredBranch: 'B' },
  { padId: 'pad_10', defId: 'bk_oven', preferredBranch: 'A' },
  { padId: 'pad_2', defId: 'wood_tower', preferredBranch: 'B' },
];
