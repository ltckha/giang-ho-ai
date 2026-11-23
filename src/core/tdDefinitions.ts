import type {
  EnemyDefinition,
  ShoeEnemyId,
  StageDefinition,
  TowerBranch,
  TowerDefinition,
  ShoeTowerId,
  TowerId,
  TowerTier,
  TowerTierStats,
} from './types';

import { BAKERY_ENEMIES, BAKERY_TOWERS, STAGE_2_DEFINITION } from './shops/bakery';
import { FLOWER_ENEMIES, FLOWER_TOWERS, STAGE_3_DEFINITION } from './shops/flower';
import { STAGE_4_DEFINITION, STREET_BOSS_ENEMIES } from './shops/streetBoss';
import { GENERATED_STREETS } from './streets/generated';
import type { EnemyId } from './types';

export const SELL_REFUND_RATE = 0.7;

/**
 * Định nghĩa 5 món giữ tiệm Màn 1 "Tiệm Giày Hẻm Dốc" (chủ đề "Gọn Tiệm, Sạch Phố — Ngũ hành giữ tiệm").
 * Tên chính thức & phân bổ Ngũ Hành đã được Claude duyệt ("NAMES GỌN TIỆM: ĐỒNG Ý").
 * Lưu ý: giữ nguyên 5 khoá nội bộ (wood_tower, metal_tower, water_tower, fire_tower, earth_tower)
 * theo thứ tự 4 món đánh + 1 món hỗ trợ để tương thích với các script mô phỏng trong docs/review/.
 */
export const TOWER_DEFINITIONS: Record<ShoeTowerId, TowerDefinition> = {
  wood_tower: {
    id: 'wood_tower',
    element: 'moc',
    role: 'single_far',
    roleLabel: 'Ném nhanh 1 con tầm xa',
    tier1: {
      name: 'Dép Tông',
      cost: 55,
      damage: 19,
      range: 122,
      cooldownSec: 0.74,
      description: 'Ném dép cao su nhanh tầm xa. Khắc Thổ (Cục Bùn): dép cao su lội bùn không sợ.',
    },
    tier2: {
      name: 'Dép Tông Đế Dày',
      cost: 70,
      damage: 32,
      range: 134,
      cooldownSec: 0.62,
      description: 'Đế cao su dày ném mạnh hơn, nhanh hơn và xa hơn.',
    },
    tier3A: {
      name: 'Dép Tông Kép',
      cost: 105,
      damage: 46,
      range: 144,
      cooldownSec: 0.48,
      pierceCount: 2,
      description: 'Ném liên hoàn siêu nhanh, dép văng xuyên thêm 1 mục tiêu sát sau.',
    },
    tier3B: {
      name: 'Dép Tông Gai Bám',
      cost: 105,
      damage: 42,
      range: 140,
      cooldownSec: 0.54,
      burnDps: 18,
      burnDurationSec: 3.0,
      description: 'Đế gai ma sát quét sạch vỏ bùn cứng, phá 15% giáp và rỉ máu liên tục.',
    },
  },
  metal_tower: {
    id: 'metal_tower',
    element: 'kim',
    role: 'heavy_slow',
    roleLabel: 'Đạp mạnh, chậm, xuyên vỏ',
    tier1: {
      name: 'Bốt Đế Đinh',
      cost: 70,
      damage: 54,
      range: 100,
      cooldownSec: 1.32,
      description: 'Cú đạp đế đinh cực nặng xuyên vỏ. Khắc Mộc (Gián, Nấm Mốc).',
    },
    tier2: {
      name: 'Bốt Đinh Thép',
      cost: 85,
      damage: 92,
      range: 108,
      cooldownSec: 1.18,
      description: 'Đinh thép tôi cứng tăng mạnh lực đạp và độ xuyên vỏ.',
    },
    tier3A: {
      name: 'Bốt Chốt Chì',
      cost: 120,
      damage: 152,
      range: 115,
      cooldownSec: 1.08,
      stunDurationSec: 0.6,
      description: 'Cú dẫm cực nặng gây choáng 0.6s cho quái máu dày.',
    },
    tier3B: {
      name: 'Bốt Đinh Quét Dọc',
      cost: 115,
      damage: 115,
      range: 122,
      cooldownSec: 1.0,
      pierceCount: 3,
      description: 'Đá trượt hàng đinh sắt xuyên thẳng tối đa 3 con trên đường đi.',
    },
  },
  water_tower: {
    id: 'water_tower',
    element: 'thuy',
    role: 'slow_aura',
    roleLabel: 'Phun sương làm chậm',
    tier1: {
      name: 'Xịt Dưỡng Da',
      cost: 60,
      damage: 15,
      range: 102,
      cooldownSec: 0.92,
      splashRadius: 50,
      slowPercent: 0.34,
      slowDurationSec: 2.2,
      description: 'Phun sương dưỡng ẩm làm chậm 34% cả vùng. Khắc Hỏa (Nắng Gắt).',
    },
    tier2: {
      name: 'Bình Xịt Áp Lực',
      cost: 75,
      damage: 26,
      range: 110,
      cooldownSec: 0.84,
      splashRadius: 58,
      slowPercent: 0.45,
      slowDurationSec: 2.6,
      description: 'Mở rộng làn sương dưỡng và tăng làm chậm lên 45%.',
    },
    tier3A: {
      name: 'Xịt Bọt Tuyết Lạnh',
      cost: 105,
      damage: 44,
      range: 118,
      cooldownSec: 0.78,
      splashRadius: 64,
      slowPercent: 0.54,
      slowDurationSec: 2.8,
      stunDurationSec: 1.0,
      description: 'Làm chậm 54% và mỗi phát xịt thứ 3 phủ bọt mát giữ chân quái 1.0s.',
    },
    tier3B: {
      name: 'Xịt Vòi Xoáy',
      cost: 105,
      damage: 38,
      range: 116,
      cooldownSec: 0.8,
      splashRadius: 72,
      slowPercent: 0.48,
      slowDurationSec: 2.7,
      knockbackDist: 14,
      description: 'Luồng phun xoáy rộng làm chậm 48% và đẩy lùi nhẹ bầy quái.',
    },
  },
  fire_tower: {
    id: 'fire_tower',
    element: 'tho',
    role: 'aoe_splash',
    roleLabel: 'Quăng gói hút ẩm đánh lan',
    tier1: {
      name: 'Túi Hút Ẩm',
      cost: 65,
      damage: 27,
      range: 102,
      cooldownSec: 1.15,
      splashRadius: 54,
      description: 'Túi xách đầy gói hút ẩm quăng nổ cả bầy. Khắc Thủy (Giọt Mưa).',
    },
    tier2: {
      name: 'Giỏ Hút Ẩm Cỡ Đại',
      cost: 80,
      damage: 46,
      range: 112,
      cooldownSec: 1.04,
      splashRadius: 64,
      description: 'Tăng bán kính tung gói hút ẩm và sát thương diện rộng.',
    },
    tier3A: {
      name: 'Thảm Hạt Hút Khô',
      cost: 115,
      damage: 66,
      range: 118,
      cooldownSec: 0.96,
      splashRadius: 72,
      burnDps: 22,
      burnDurationSec: 3.0,
      description: 'Rải lớp hạt hút khô trên sàn tiếp tục rút máu quái 22/giây trong 3s.',
    },
    tier3B: {
      name: 'Chùm Túi Nổ Liên Hoàn',
      cost: 115,
      damage: 84,
      range: 120,
      cooldownSec: 0.94,
      splashRadius: 80,
      description: 'Túi bung nhiều gói nhỏ nổ lan cực rộng với sát thương bùng phát cao.',
    },
  },
  earth_tower: {
    id: 'earth_tower',
    element: 'hoa',
    role: 'support_buff',
    roleLabel: 'Hỗ trợ sấy khỏe & xua chuột',
    tier1: {
      name: 'Máy Sấy Giày',
      cost: 55,
      damage: 13,
      range: 108,
      cooldownSec: 1.25,
      buffDamagePct: 0.18,
      buffSpeedPct: 0.14,
      buffRangePct: 0.06,
      cleanseDisrupt: true,
      description: 'Sấy ấm tăng 18% sức, 14% tốc cho món cạnh bên & gỡ nhanh món bị chuột gặm. Khắc Kim (Chuột).',
    },
    tier2: {
      name: 'Máy Sấy Hai Vòi',
      cost: 70,
      damage: 22,
      range: 120,
      cooldownSec: 1.1,
      buffDamagePct: 0.26,
      buffSpeedPct: 0.2,
      buffRangePct: 0.1,
      cleanseDisrupt: true,
      description: 'Tăng 26% sức, 20% tốc đánh và xua chuột phá rối nhanh hơn.',
    },
    tier3A: {
      name: 'Máy Sấy Khử Khuẩn',
      cost: 95,
      damage: 36,
      range: 132,
      cooldownSec: 1.0,
      buffDamagePct: 0.3,
      buffSpeedPct: 0.22,
      buffRangePct: 0.12,
      cleanseDisrupt: true,
      bonusKillReward: 2,
      description: 'Bảo hộ món quanh máy không bị chuột gặm đứng im & thưởng +2 xu mỗi quái dọn được.',
    },
    tier3B: {
      name: 'Máy Sấy Gió Nhiệt Cao',
      cost: 100,
      damage: 42,
      range: 136,
      cooldownSec: 0.95,
      buffDamagePct: 0.4,
      buffSpeedPct: 0.3,
      buffRangePct: 0.16,
      cleanseDisrupt: true,
      description: 'Cộng hưởng nhiệt mạnh: tăng 40% sức, 30% tốc đánh và 16% tầm cho món cạnh bên.',
    },
  },
};

export const TOWER_LIST: TowerDefinition[] = [
  TOWER_DEFINITIONS.wood_tower,
  TOWER_DEFINITIONS.metal_tower,
  TOWER_DEFINITIONS.water_tower,
  TOWER_DEFINITIONS.fire_tower,
  TOWER_DEFINITIONS.earth_tower,
];

export function getTowerTierStats(
  defId: TowerId,
  tier: TowerTier,
  branch?: TowerBranch,
): TowerTierStats {
  const def = ALL_TOWER_DEFINITIONS[defId];
  if (tier === 1) return def.tier1;
  if (tier === 2) return def.tier2;
  return branch === 'B' ? def.tier3B : def.tier3A;
}

export function calculateSellRefund(totalInvested: number): number {
  return Math.round(totalInvested * SELL_REFUND_RATE);
}

/**
 * Định nghĩa 6 bọn phá đồ Tiệm Giày + Gián Con + Trùm Mùa Nồm (đủ 5 hành Ngũ Hành theo docs/CHU_DE_GIU_TIEM.md).
 */
export const ENEMY_DEFINITIONS: Record<ShoeEnemyId, EnemyDefinition> = {
  fast_metal: {
    id: 'fast_metal',
    name: 'Giọt Mưa',
    element: 'thuy',
    trait: 'fast',
    traitLabel: 'Nhanh, thành đàn',
    maxHp: 96,
    speed: 63,
    armor: 0.1,
    reward: 7,
    lifeCost: 1,
    radius: 11,
  },
  tank_earth: {
    id: 'tank_earth',
    name: 'Cục Bùn',
    element: 'tho',
    trait: 'tank',
    traitLabel: 'Máu trâu • Trừ 2 đôi',
    maxHp: 335,
    speed: 32,
    armor: 0.32,
    reward: 13,
    lifeCost: 2,
    radius: 15,
  },
  fly_wood: {
    id: 'fly_wood',
    name: 'Nắng Gắt',
    element: 'hoa',
    trait: 'flying',
    traitLabel: 'Tia nắng (Không bị làm chậm)',
    maxHp: 165,
    speed: 50,
    armor: 0.12,
    reward: 10,
    lifeCost: 1,
    radius: 12,
    flying: true,
  },
  split_fire: {
    id: 'split_fire',
    name: 'Gián',
    element: 'moc',
    trait: 'splitter',
    traitLabel: 'Đập chết tách 2 Gián Con',
    maxHp: 185,
    speed: 41,
    armor: 0.12,
    reward: 9,
    lifeCost: 2,
    radius: 14,
    splitChildId: 'split_fire_mini',
    splitCount: 2,
  },
  split_fire_mini: {
    id: 'split_fire_mini',
    name: 'Gián Con',
    element: 'moc',
    trait: 'mini',
    traitLabel: 'Tách ra chạy nhanh',
    maxHp: 64,
    speed: 58,
    armor: 0.04,
    reward: 2,
    lifeCost: 1,
    radius: 8,
  },
  disrupt_water: {
    id: 'disrupt_water',
    name: 'Chuột',
    element: 'kim',
    trait: 'disruptor',
    traitLabel: 'Gặm món đứng im',
    maxHp: 280,
    speed: 36,
    armor: 0.15,
    reward: 15,
    lifeCost: 2,
    radius: 13,
    disruptRadius: 96,
    disruptIntervalSec: 4.2,
    disruptDurationSec: 2.5,
  },
  healer_wood: {
    id: 'healer_wood',
    name: 'Nấm Mốc',
    element: 'moc',
    trait: 'healer',
    traitLabel: 'Hồi máu cho quái gần',
    maxHp: 260,
    speed: 37,
    armor: 0.12,
    reward: 14,
    lifeCost: 2,
    radius: 13,
    healRadius: 90,
    healIntervalSec: 2.6,
    healAmount: 42,
  },
  boss_water: {
    id: 'boss_water',
    name: 'Trùm Mùa Nồm',
    element: 'thuy',
    trait: 'boss',
    traitLabel: 'Trùm: Hơi ẩm & Đổi hành',
    maxHp: 2800,
    speed: 23,
    armor: 0.3,
    reward: 120,
    lifeCost: 10,
    radius: 20,
    disruptRadius: 108,
    disruptIntervalSec: 5.5,
    disruptDurationSec: 2.4,
    shieldIntervalSec: 8.0,
    shieldDurationSec: 2.8,
    shieldReductionPct: 0.55,
  },
};

/**
 * Màn 1: Tiệm Giày Hẻm Dốc — giữ nguyên đường đi, 9 ô đặt món và cấu trúc 9 đợt đã đạt chuẩn cân bằng.
 * Hành quái gán theo docs/CHU_DE_GIU_TIEM.md: Giọt Mưa (Thủy), Cục Bùn (Thổ), Gián (Mộc), Nắng Gắt (Hỏa).
 */
export const STAGE_1_DEFINITION: StageDefinition = {
  id: 'stage_1',
  stageNumber: 1,
  name: 'Tiệm Giày Hẻm Dốc',
  subtitle: 'Giữ sạch 20 đôi giày lành trên kệ qua 9 đợt mưa bùn Đà Lạt',
  startingEssence: 160,
  startingLives: 20,
  paths: [
    [
      { x: 48, y: 24 },
      { x: 48, y: 125 },
      { x: 304, y: 125 },
      { x: 304, y: 245 },
      { x: 56, y: 245 },
      { x: 56, y: 365 },
      { x: 304, y: 365 },
      { x: 304, y: 455 },
    ],
  ],
  pads: [
    { id: 'pad_1', x: 112, y: 76 },
    { id: 'pad_2', x: 232, y: 76 },
    { id: 'pad_3', x: 145, y: 185 },
    { id: 'pad_4', x: 242, y: 185 },
    { id: 'pad_5', x: 118, y: 305 },
    { id: 'pad_6', x: 215, y: 305 },
    { id: 'pad_7', x: 312, y: 305 },
    { id: 'pad_8', x: 150, y: 420 },
    { id: 'pad_9', x: 244, y: 420 },
  ],
  waves: [
    {
      waveNumber: 1,
      title: 'Đợt 1: Giọt Mưa & Cục Bùn',
      mainElements: ['thuy', 'tho'],
      earlyBonusMax: 12,
      clearReward: 14,
      groups: [
        {
          enemyId: 'fast_metal',
          count: 5,
          intervalSec: 1.0,
          delayBeforeSec: 0,
          pathIndex: 0,
          hpScale: 0.9,
        },
        {
          enemyId: 'tank_earth',
          count: 2,
          intervalSec: 1.9,
          delayBeforeSec: 0.9,
          pathIndex: 0,
          hpScale: 0.9,
        },
      ],
    },
    {
      waveNumber: 2,
      title: 'Đợt 2: Cục Bùn & Nắng Gắt',
      mainElements: ['tho', 'hoa'],
      earlyBonusMax: 14,
      clearReward: 15,
      groups: [
        {
          enemyId: 'tank_earth',
          count: 3,
          intervalSec: 1.8,
          delayBeforeSec: 0,
          pathIndex: 0,
          hpScale: 1.0,
        },
        {
          enemyId: 'fly_wood',
          count: 5,
          intervalSec: 1.1,
          delayBeforeSec: 0.7,
          pathIndex: 0,
          hpScale: 1.0,
        },
      ],
    },
    {
      waveNumber: 3,
      title: 'Đợt 3: Gián Đàn & Giọt Mưa',
      mainElements: ['moc', 'thuy'],
      earlyBonusMax: 15,
      clearReward: 16,
      groups: [
        {
          enemyId: 'split_fire',
          count: 4,
          intervalSec: 1.4,
          delayBeforeSec: 0,
          pathIndex: 0,
          hpScale: 1.1,
        },
        {
          enemyId: 'fast_metal',
          count: 6,
          intervalSec: 0.85,
          delayBeforeSec: 0.6,
          pathIndex: 0,
          hpScale: 1.1,
        },
      ],
    },
    {
      waveNumber: 4,
      title: 'Đợt 4: Nắng Gắt & Gián Bò',
      mainElements: ['hoa', 'moc'],
      earlyBonusMax: 16,
      clearReward: 15,
      groups: [
        {
          enemyId: 'fly_wood',
          count: 6,
          intervalSec: 0.96,
          delayBeforeSec: 0,
          pathIndex: 0,
          hpScale: 1.32,
        },
        {
          enemyId: 'split_fire',
          count: 4,
          intervalSec: 1.3,
          delayBeforeSec: 0.6,
          pathIndex: 0,
          hpScale: 1.32,
        },
      ],
    },
    {
      waveNumber: 5,
      title: 'Đợt 5: Bùn Dày & Mưa Rào',
      mainElements: ['tho', 'thuy'],
      earlyBonusMax: 18,
      clearReward: 15,
      groups: [
        {
          enemyId: 'tank_earth',
          count: 4,
          intervalSec: 1.5,
          delayBeforeSec: 0,
          pathIndex: 0,
          hpScale: 1.72,
        },
        {
          enemyId: 'fast_metal',
          count: 8,
          intervalSec: 0.65,
          delayBeforeSec: 0.5,
          pathIndex: 0,
          hpScale: 1.72,
        },
      ],
    },
    {
      waveNumber: 6,
      title: 'Đợt 6: Gián, Nắng & Cục Bùn',
      mainElements: ['moc', 'hoa', 'tho'],
      earlyBonusMax: 18,
      clearReward: 15,
      groups: [
        {
          enemyId: 'split_fire',
          count: 5,
          intervalSec: 1.08,
          delayBeforeSec: 0,
          pathIndex: 0,
          hpScale: 2.32,
        },
        {
          enemyId: 'fly_wood',
          count: 6,
          intervalSec: 0.78,
          delayBeforeSec: 0.4,
          pathIndex: 0,
          hpScale: 2.35,
        },
        {
          enemyId: 'tank_earth',
          count: 3,
          intervalSec: 1.28,
          delayBeforeSec: 0.35,
          pathIndex: 0,
          hpScale: 2.32,
        },
      ],
    },
    {
      waveNumber: 7,
      title: 'Đợt 7: Mưa Xối, Bùn & Nắng Chói',
      mainElements: ['thuy', 'tho', 'hoa'],
      earlyBonusMax: 20,
      clearReward: 16,
      groups: [
        {
          enemyId: 'fast_metal',
          count: 10,
          intervalSec: 0.48,
          delayBeforeSec: 0,
          pathIndex: 0,
          hpScale: 2.85,
        },
        {
          enemyId: 'tank_earth',
          count: 5,
          intervalSec: 1.12,
          delayBeforeSec: 0.3,
          pathIndex: 0,
          hpScale: 2.9,
        },
        {
          enemyId: 'fly_wood',
          count: 6,
          intervalSec: 0.66,
          delayBeforeSec: 0.3,
          pathIndex: 0,
          hpScale: 2.88,
        },
      ],
    },
    {
      waveNumber: 8,
      title: 'Đợt 8: Tứ Bề Kéo Tới',
      mainElements: ['tho', 'moc', 'hoa', 'thuy'],
      earlyBonusMax: 20,
      clearReward: 17,
      groups: [
        {
          enemyId: 'tank_earth',
          count: 5,
          intervalSec: 1.05,
          delayBeforeSec: 0,
          pathIndex: 0,
          hpScale: 3.45,
        },
        {
          enemyId: 'split_fire',
          count: 6,
          intervalSec: 0.85,
          delayBeforeSec: 0.25,
          pathIndex: 0,
          hpScale: 3.4,
        },
        {
          enemyId: 'fly_wood',
          count: 7,
          intervalSec: 0.62,
          delayBeforeSec: 0.25,
          pathIndex: 0,
          hpScale: 3.45,
        },
        {
          enemyId: 'fast_metal',
          count: 8,
          intervalSec: 0.42,
          delayBeforeSec: 0.25,
          pathIndex: 0,
          hpScale: 3.4,
        },
      ],
    },
    {
      waveNumber: 9,
      title: 'Đợt 9: Cơn Mưa Dầm Tổng Lực',
      mainElements: ['tho', 'moc', 'hoa', 'thuy'],
      earlyBonusMax: 22,
      clearReward: 20,
      groups: [
        {
          enemyId: 'tank_earth',
          count: 6,
          intervalSec: 0.98,
          delayBeforeSec: 0,
          pathIndex: 0,
          hpScale: 4.05,
        },
        {
          enemyId: 'split_fire',
          count: 7,
          intervalSec: 0.8,
          delayBeforeSec: 0.2,
          pathIndex: 0,
          hpScale: 3.95,
        },
        {
          enemyId: 'fly_wood',
          count: 8,
          intervalSec: 0.56,
          delayBeforeSec: 0.2,
          pathIndex: 0,
          hpScale: 4.05,
        },
        {
          enemyId: 'fast_metal',
          count: 10,
          intervalSec: 0.38,
          delayBeforeSec: 0.2,
          pathIndex: 0,
          hpScale: 4.0,
        },
      ],
    },
  ],
};

/* ---- Nhiều tiệm (Claude, sườn Màn 2) ---- */
export const ALL_TOWER_DEFINITIONS: Record<TowerId, TowerDefinition> = { ...TOWER_DEFINITIONS, ...BAKERY_TOWERS, ...FLOWER_TOWERS };
export const ALL_ENEMY_DEFINITIONS: Record<EnemyId, EnemyDefinition> = { ...ENEMY_DEFINITIONS, ...BAKERY_ENEMIES, ...FLOWER_ENEMIES, ...STREET_BOSS_ENEMIES };

/** 5 món của một màn (theo tiệm) */
export function getStageTowerList(stage: StageDefinition, loadout?: TowerId[]): TowerDefinition[] {
  // Trận trùm phố: chỉ hiện các món đã chọn mang theo (hoặc bộ mặc định)
  if (stage.loadoutSize) {
    const ids = (loadout && loadout.length ? loadout : stage.defaultLoadout ?? []).slice(0, stage.loadoutSize);
    return ids.map((id) => ALL_TOWER_DEFINITIONS[id]);
  }
  return stage.towerIds ? stage.towerIds.map((id) => ALL_TOWER_DEFINITIONS[id]) : TOWER_LIST;
}

export const STAGES: Record<import('./types').StageId, StageDefinition> = {
  stage_1: STAGE_1_DEFINITION,
  stage_2: STAGE_2_DEFINITION,
  stage_3: STAGE_3_DEFINITION,
  stage_4: STAGE_4_DEFINITION,
};

/* ---- Phố thật do máy làm màn sinh ra (tools/level-maker) ---- */
for (const gs of GENERATED_STREETS) {
  Object.assign(ALL_TOWER_DEFINITIONS, gs.towers);
  Object.assign(ALL_ENEMY_DEFINITIONS, gs.enemies);
  STAGES[gs.stage.id] = gs.stage;
  for (const sh of gs.shops ?? []) STAGES[sh.stage.id] = sh.stage;
}

/** Danh sách phố thật (để màn chọn phố hiển thị) */
export const REAL_STREET_STAGES: StageDefinition[] = GENERATED_STREETS.map((g) => g.stage);
/** Các màn tiệm của từng phố thật (theo thứ tự), key = id màn phố */
export const REAL_STREET_SHOPS: Record<string, StageDefinition[]> = Object.fromEntries(
  GENERATED_STREETS.map((g) => [g.stage.id, (g.shops ?? []).map((s) => s.stage)]),
);
