import type { EnemyTemplate, MapDef, MapId, Rect, Vec2 } from './types';

export const ENEMIES: Record<string, EnemyTemplate> = {
  enemy_mine_guard: {
    id: 'enemy_mine_guard',
    element: 'tho',
    maxHp: 95,
    atk: 15,
    def: 10,
    moveSpeed: 96,
    attackRange: 52,
    attackCooldownSec: 1.35,
    xpReward: 34,
    silverMin: 12,
    silverMax: 22,
    spiritStoneChance: 0.45,
    lootTable: [
      { itemId: 'pot_heal_small', chance: 0.22 },
      { itemId: 'chm_tho', chance: 0.1 },
    ],
  },
  enemy_mine_bandit: {
    id: 'enemy_mine_bandit',
    element: 'kim',
    maxHp: 78,
    atk: 17,
    def: 7,
    moveSpeed: 124,
    attackRange: 48,
    attackCooldownSec: 1.05,
    xpReward: 30,
    silverMin: 15,
    silverMax: 28,
    spiritStoneChance: 0.35,
    lootTable: [
      { itemId: 'pot_heal_small', chance: 0.2 },
      { itemId: 'arm_wood_weave', chance: 0.1 },
    ],
  },
  enemy_rogue_logger: {
    id: 'enemy_rogue_logger',
    element: 'moc',
    maxHp: 84,
    atk: 16,
    def: 8,
    moveSpeed: 112,
    attackRange: 54,
    attackCooldownSec: 1.15,
    xpReward: 32,
    silverMin: 11,
    silverMax: 20,
    spiritStoneChance: 0.4,
    lootTable: [
      { itemId: 'pot_ally_oil', chance: 0.2 },
      { itemId: 'chm_moc', chance: 0.1 },
    ],
  },
  enemy_furnace_golem: {
    id: 'enemy_furnace_golem',
    element: 'hoa',
    maxHp: 130,
    atk: 22,
    def: 11,
    moveSpeed: 108,
    attackRange: 64,
    attackCooldownSec: 1.25,
    xpReward: 48,
    silverMin: 20,
    silverMax: 34,
    spiritStoneChance: 0.6,
    lootTable: [
      { itemId: 'arm_fire_ward', chance: 0.14 },
      { itemId: 'chm_hoa', chance: 0.12 },
    ],
  },
  enemy_cave_sentry: {
    id: 'enemy_cave_sentry',
    element: 'thuy',
    maxHp: 125,
    atk: 21,
    def: 12,
    moveSpeed: 114,
    attackRange: 95,
    attackCooldownSec: 1.3,
    xpReward: 50,
    silverMin: 22,
    silverMax: 36,
    spiritStoneChance: 0.65,
    lootTable: [
      { itemId: 'pot_ally_oil', chance: 0.28 },
      { itemId: 'chm_thuy', chance: 0.14 },
    ],
  },
  boss_awakened: {
    id: 'boss_awakened',
    element: 'thuy',
    maxHp: 560,
    atk: 29,
    def: 14,
    moveSpeed: 105,
    attackRange: 95,
    attackCooldownSec: 1.5,
    xpReward: 220,
    silverMin: 120,
    silverMax: 160,
    spiritStoneChance: 1.0,
    lootTable: [{ itemId: 'wpn_cave_relic', chance: 1.0 }],
    isBoss: true,
  },
  // Quái mới & Trùm mới Giai đoạn 2 (đã được Claude duyệt trong REVIEW_LOG.md)
  enemy_bronze_guard: {
    id: 'enemy_bronze_guard',
    element: 'kim',
    maxHp: 150,
    atk: 24,
    def: 15,
    moveSpeed: 108,
    attackRange: 54,
    attackCooldownSec: 1.25,
    xpReward: 62,
    silverMin: 26,
    silverMax: 42,
    spiritStoneChance: 0.65,
    lootTable: [
      { itemId: 'wpn_inner_sword', chance: 0.16 },
      { itemId: 'chm_kim', chance: 0.14 },
    ],
  },
  enemy_copy_scribe: {
    id: 'enemy_copy_scribe',
    element: 'moc',
    maxHp: 135,
    atk: 23,
    def: 11,
    moveSpeed: 120,
    attackRange: 105,
    attackCooldownSec: 1.2,
    xpReward: 58,
    silverMin: 22,
    silverMax: 38,
    spiritStoneChance: 0.55,
    lootTable: [
      { itemId: 'wpn_valley_staff', chance: 0.16 },
      { itemId: 'pot_ally_oil', chance: 0.25 },
    ],
  },
  enemy_unsealed_golem: {
    id: 'enemy_unsealed_golem',
    element: 'hoa',
    maxHp: 145,
    atk: 27,
    def: 11,
    moveSpeed: 132,
    attackRange: 58,
    attackCooldownSec: 1.0,
    xpReward: 65,
    silverMin: 28,
    silverMax: 45,
    spiritStoneChance: 0.7,
    lootTable: [
      { itemId: 'wpn_unseal_rod', chance: 0.16 },
      { itemId: 'arm_talisman_robe', chance: 0.14 },
    ],
  },
  enemy_stone_colossus: {
    id: 'enemy_stone_colossus',
    element: 'tho',
    maxHp: 185,
    atk: 25,
    def: 17,
    moveSpeed: 94,
    attackRange: 62,
    attackCooldownSec: 1.45,
    xpReward: 70,
    silverMin: 30,
    silverMax: 48,
    spiritStoneChance: 0.75,
    lootTable: [
      { itemId: 'arm_stone_vein', chance: 0.18 },
      { itemId: 'chm_tho', chance: 0.14 },
    ],
  },
  enemy_voice_mimic: {
    id: 'enemy_voice_mimic',
    element: 'thuy',
    maxHp: 140,
    atk: 24,
    def: 12,
    moveSpeed: 118,
    attackRange: 110,
    attackCooldownSec: 1.15,
    xpReward: 60,
    silverMin: 25,
    silverMax: 40,
    spiritStoneChance: 0.6,
    lootTable: [
      { itemId: 'chm_thuy', chance: 0.16 },
      { itemId: 'pot_heal_small', chance: 0.25 },
    ],
  },
  enemy_siege_defender: {
    id: 'enemy_siege_defender',
    element: 'kim',
    maxHp: 175,
    atk: 26,
    def: 16,
    moveSpeed: 110,
    attackRange: 60,
    attackCooldownSec: 1.2,
    xpReward: 75,
    silverMin: 32,
    silverMax: 52,
    spiritStoneChance: 0.8,
    lootTable: [{ itemId: 'arm_siege_armor', chance: 0.2 }],
  },
  boss_van_chep: {
    id: 'boss_van_chep',
    element: 'kim',
    maxHp: 860,
    atk: 36,
    def: 18,
    moveSpeed: 112,
    attackRange: 100,
    attackCooldownSec: 1.4,
    xpReward: 340,
    silverMin: 210,
    silverMax: 260,
    spiritStoneChance: 1.0,
    lootTable: [
      { itemId: 'wpn_fused_core', chance: 1.0 },
      { itemId: 'chm_awakened_core', chance: 1.0 },
    ],
    isBoss: true,
  },
};

export const MAPS: Record<MapId, MapDef> = {
  map_town: {
    id: 'map_town',
    width: 1400,
    height: 960,
    isSafeZone: true,
    defaultSpawn: { x: 640, y: 520 },
    obstacles: [
      // Tường bao trên/dưới/trái/phải (trừ cổng Đông sang Rừng)
      { x: 0, y: 0, w: 1400, h: 48 },
      { x: 0, y: 912, w: 1400, h: 48 },
      { x: 0, y: 0, w: 48, h: 960 },
      { x: 1352, y: 0, w: 48, h: 398 },
      { x: 1352, y: 560, w: 48, h: 400 },
      // Mái nhà Lò đúc khôi lỗi (tây bắc)
      { x: 140, y: 120, w: 280, h: 120 },
      // Mái sạp Chợ khôi lỗi (đông bắc)
      { x: 860, y: 120, w: 260, h: 110 },
      // Xưởng rèn tắt lửa (tây nam)
      { x: 140, y: 690, w: 230, h: 120 },
      // Trụ cáo thị giữa quảng trường
      { x: 620, y: 370, w: 56, h: 56 },
    ],
    landmarks: [
      { id: 'lm_foundry', x: 120, y: 110, w: 330, h: 240, kind: 'foundry' },
      { id: 'lm_market', x: 830, y: 110, w: 330, h: 240, kind: 'market' },
      { id: 'lm_forge', x: 120, y: 640, w: 300, h: 210, kind: 'forge' },
      { id: 'lm_plaza', x: 520, y: 340, w: 280, h: 220, kind: 'plaza' },
    ],
    portals: [
      {
        id: 'portal_town_to_forest',
        x: 1320,
        y: 410,
        w: 64,
        h: 140,
        targetMap: 'map_forest',
        targetX: 110,
        targetY: 540,
      },
    ],
    npcs: [
      { id: 'npc_foundry', role: 'foundry', x: 300, y: 290 },
      { id: 'npc_merchant', role: 'merchant', x: 980, y: 285 },
      { id: 'npc_blacksmith', role: 'blacksmith', x: 265, y: 640 },
      { id: 'npc_guard', role: 'guard', x: 1240, y: 420 },
      { id: 'npc_open_rep', role: 'sect_open_rep', x: 555, y: 455 },
    ],
    enemySpawns: [],
  },

  map_forest: {
    id: 'map_forest',
    width: 1760,
    height: 1160,
    isSafeZone: false,
    defaultSpawn: { x: 120, y: 540 },
    obstacles: [
      // Viền rừng (mở lối Tây về Thành Lam Lư, mở Cổng Bắc lên Thành Bế Các, mở lối Đông Nam vào Động Tàn Cơ)
      { x: 0, y: 0, w: 560, h: 48 },
      { x: 740, y: 0, w: 1020, h: 48 },
      { x: 0, y: 1112, w: 1760, h: 48 },
      { x: 0, y: 0, w: 48, h: 458 },
      { x: 0, y: 630, w: 48, h: 530 },
      { x: 1712, y: 0, w: 48, h: 788 },
      { x: 1712, y: 940, w: 48, h: 220 },
      // Rặng đá & cây chắn tạo các nhánh: cổng Bắc lên Thành Bế Các, lối cụt Đông Bắc (bịa đường), bãi mỏ, cửa hang
      { x: 420, y: 280, w: 150, h: 120 },
      { x: 420, y: 690, w: 170, h: 140 },
      { x: 900, y: 440, w: 180, h: 110 },
      { x: 1240, y: 180, w: 130, h: 180 },
      { x: 1080, y: 760, w: 190, h: 120 },
    ],
    landmarks: [
      { id: 'lm_crossroads', x: 580, y: 460, w: 220, h: 180, kind: 'crossroads' },
      { id: 'lm_mine', x: 1080, y: 440, w: 420, h: 270, kind: 'mine' },
      { id: 'lm_fake_landmark', x: 760, y: 90, w: 290, h: 180, kind: 'fake_landmark' },
    ],
    portals: [
      {
        id: 'portal_forest_to_town',
        x: 16,
        y: 470,
        w: 56,
        h: 150,
        targetMap: 'map_town',
        targetX: 1260,
        targetY: 480,
      },
      {
        id: 'portal_forest_to_inner_city',
        x: 575,
        y: 12,
        w: 150,
        h: 56,
        targetMap: 'map_inner_city',
        targetX: 700,
        targetY: 850,
      },
      {
        id: 'portal_forest_to_cave',
        x: 1664,
        y: 795,
        w: 64,
        h: 140,
        targetMap: 'map_cave',
        targetX: 120,
        targetY: 480,
      },
    ],
    npcs: [
      { id: 'npc_guide', role: 'guide', x: 660, y: 530 },
      { id: 'npc_ban_rep', role: 'sect_ban_rep', x: 545, y: 130 },
    ],
    enemySpawns: [
      { id: 'sp_f_1', enemyId: 'enemy_rogue_logger', x: 350, y: 500, respawnSec: 18 },
      { id: 'sp_f_2', enemyId: 'enemy_mine_bandit', x: 760, y: 780, respawnSec: 18 },
      { id: 'sp_f_3', enemyId: 'enemy_mine_guard', x: 1220, y: 560, respawnSec: 20 },
      { id: 'sp_f_4', enemyId: 'enemy_mine_guard', x: 1380, y: 510, respawnSec: 20 },
      { id: 'sp_f_5', enemyId: 'enemy_mine_bandit', x: 1450, y: 780, respawnSec: 20 },
      // Ổ quái tại lối cụt nhiệm vụ bịa đường
      { id: 'sp_f_ambush_1', enemyId: 'enemy_rogue_logger', x: 840, y: 175, respawnSec: 22 },
      { id: 'sp_f_ambush_2', enemyId: 'enemy_mine_bandit', x: 950, y: 185, respawnSec: 22 },
    ],
  },

  map_cave: {
    id: 'map_cave',
    width: 1500,
    height: 960,
    isSafeZone: false,
    defaultSpawn: { x: 120, y: 480 },
    obstacles: [
      // Tường hang (lối ra Tây về Rừng)
      { x: 0, y: 0, w: 1500, h: 52 },
      { x: 0, y: 908, w: 1500, h: 52 },
      { x: 0, y: 0, w: 52, h: 402 },
      { x: 0, y: 560, w: 52, h: 400 },
      { x: 1448, y: 0, w: 52, h: 960 },
      // Vách đá chia hành lang vào đấu trường trùm
      { x: 420, y: 52, w: 90, h: 280 },
      { x: 420, y: 610, w: 90, h: 298 },
      { x: 820, y: 140, w: 80, h: 160 },
      { x: 820, y: 660, w: 80, h: 160 },
    ],
    landmarks: [{ id: 'lm_boss_arena', x: 910, y: 180, w: 500, h: 600, kind: 'boss_arena' }],
    portals: [
      {
        id: 'portal_cave_to_forest',
        x: 16,
        y: 410,
        w: 56,
        h: 140,
        targetMap: 'map_forest',
        targetX: 1580,
        targetY: 865,
      },
    ],
    npcs: [],
    enemySpawns: [
      { id: 'sp_c_1', enemyId: 'enemy_furnace_golem', x: 330, y: 460, respawnSec: 25 },
      { id: 'sp_c_2', enemyId: 'enemy_cave_sentry', x: 660, y: 360, respawnSec: 25 },
      { id: 'sp_c_3', enemyId: 'enemy_furnace_golem', x: 660, y: 580, respawnSec: 25 },
      { id: 'sp_c_boss', enemyId: 'boss_awakened', x: 1180, y: 480, respawnSec: 9999 },
    ],
  },

  map_inner_city: {
    id: 'map_inner_city',
    width: 1480,
    height: 980,
    isSafeZone: true,
    defaultSpawn: { x: 700, y: 840 },
    obstacles: [
      // Tường thành đồng (mở Cổng Nam về Rừng Thạch Mạch, mở Cổng Đông sang Lũng Đại Mạch)
      { x: 0, y: 0, w: 1480, h: 48 },
      { x: 0, y: 932, w: 605, h: 48 },
      { x: 795, y: 932, w: 685, h: 48 },
      { x: 0, y: 0, w: 48, h: 980 },
      { x: 1432, y: 0, w: 48, h: 410 },
      { x: 1432, y: 570, w: 48, h: 410 },
      // Mật Khố Tỏa Chốt (tây bắc)
      { x: 140, y: 120, w: 260, h: 110 },
      // Lò Luyện Hợp Kim (tây nam)
      { x: 140, y: 690, w: 230, h: 110 },
      // Phố Ký Gửi Ấn Tín (đông nam)
      { x: 960, y: 690, w: 250, h: 110 },
      // Bia đồng Đài Bảng Tin Giang Hồ
      { x: 672, y: 452, w: 56, h: 56 },
    ],
    landmarks: [
      { id: 'lm_vault', x: 120, y: 105, w: 320, h: 230, kind: 'vault' },
      { id: 'lm_siege_gate', x: 520, y: 78, w: 360, h: 195, kind: 'siege_gate' },
      { id: 'lm_board', x: 530, y: 360, w: 340, h: 230, kind: 'board' },
      { id: 'lm_alloy_forge', x: 120, y: 640, w: 290, h: 210, kind: 'forge' },
      { id: 'lm_seal_street', x: 930, y: 640, w: 320, h: 210, kind: 'market' },
    ],
    portals: [
      {
        id: 'portal_inner_to_forest',
        x: 620,
        y: 904,
        w: 160,
        h: 60,
        targetMap: 'map_forest',
        targetX: 650,
        targetY: 115,
      },
      {
        id: 'portal_inner_to_valley',
        x: 1400,
        y: 420,
        w: 64,
        h: 140,
        targetMap: 'map_valley',
        targetX: 120,
        targetY: 500,
      },
    ],
    npcs: [
      { id: 'npc_guild_master', role: 'guild_board', x: 755, y: 445 },
      { id: 'npc_scholar', role: 'scholar', x: 635, y: 445 },
      { id: 'npc_closed_rep', role: 'sect_closed_rep', x: 280, y: 270 },
      { id: 'npc_martial_master', role: 'master', x: 410, y: 295 },
      { id: 'npc_apprentice_smith', role: 'apprentice_smith', x: 265, y: 635 },
      { id: 'npc_teahouse', role: 'teahouse', x: 1085, y: 635 },
    ],
    enemySpawns: [],
  },

  map_valley: {
    id: 'map_valley',
    width: 1860,
    height: 1180,
    isSafeZone: false,
    defaultSpawn: { x: 120, y: 500 },
    obstacles: [
      // Viền thung lũng (mở Cổng Tây về Thành Bế Các)
      { x: 0, y: 0, w: 1860, h: 48 },
      { x: 0, y: 1132, w: 1860, h: 48 },
      { x: 0, y: 0, w: 48, h: 420 },
      { x: 0, y: 580, w: 48, h: 600 },
      { x: 1812, y: 0, w: 48, h: 1180 },
      // Vách đá chia 3 bãi quái tranh chấp & Tế Đàn Lõi Trầm (Trùm Vạn Chép)
      { x: 540, y: 280, w: 140, h: 110 },
      { x: 540, y: 740, w: 150, h: 130 },
      { x: 1020, y: 460, w: 140, h: 120 },
      { x: 1220, y: 160, w: 110, h: 180 },
    ],
    landmarks: [
      { id: 'lm_spot_west', x: 220, y: 620, w: 300, h: 260, kind: 'mine' },
      { id: 'lm_spot_north', x: 660, y: 90, w: 480, h: 240, kind: 'crossroads' },
      { id: 'lm_spot_east', x: 1080, y: 240, w: 420, h: 240, kind: 'foundry' },
      { id: 'lm_altar_boss', x: 1260, y: 580, w: 510, h: 470, kind: 'boss_arena' },
    ],
    portals: [
      {
        id: 'portal_valley_to_inner',
        x: 16,
        y: 430,
        w: 56,
        h: 140,
        targetMap: 'map_inner_city',
        targetX: 1330,
        targetY: 490,
      },
    ],
    npcs: [
      { id: 'npc_taoist', role: 'taoist', x: 210, y: 430 },
      { id: 'npc_seal_breaker', role: 'seal_breaker_npc', x: 890, y: 175 },
    ],
    enemySpawns: [
      // Bãi Mỏ Tinh Lam (bãi tranh chấp 1 — spot_west)
      { id: 'sp_v_w1', enemyId: 'enemy_voice_mimic', x: 350, y: 730, respawnSec: 18 },
      { id: 'sp_v_w2', enemyId: 'enemy_stone_colossus', x: 440, y: 810, respawnSec: 22 },
      // Hẻm Đứt Bùa (bãi tranh chấp 2 — spot_north)
      { id: 'sp_v_n1', enemyId: 'enemy_unsealed_golem', x: 760, y: 205, respawnSec: 18 },
      { id: 'sp_v_n2', enemyId: 'enemy_unsealed_golem', x: 980, y: 210, respawnSec: 18 },
      // Khe Vỡ Khung Đồng (bãi tranh chấp 3 — spot_east)
      { id: 'sp_v_e1', enemyId: 'enemy_copy_scribe', x: 1180, y: 340, respawnSec: 18 },
      { id: 'sp_v_e2', enemyId: 'enemy_bronze_guard', x: 1360, y: 360, respawnSec: 20 },
      // Trùm GĐ2 Vạn Chép tại Tế Đàn Lõi Trầm
      { id: 'sp_v_boss', enemyId: 'boss_van_chep', x: 1540, y: 815, respawnSec: 9999 },
    ],
  },
};

export function isPointInRect(p: Vec2, r: Rect): boolean {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

export function resolveCircleRectCollision(
  pos: Vec2,
  radius: number,
  rect: Rect,
  bounds?: { width: number; height: number },
): Vec2 {
  const closestX = Math.max(rect.x, Math.min(pos.x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(pos.y, rect.y + rect.h));
  const dx = pos.x - closestX;
  const dy = pos.y - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq >= radius * radius) {
    return pos;
  }

  if (distSq < 0.0001) {
    const candidates: Array<{ p: Vec2; pen: number }> = [
      { p: { x: rect.x - radius, y: pos.y }, pen: pos.x - rect.x },
      { p: { x: rect.x + rect.w + radius, y: pos.y }, pen: rect.x + rect.w - pos.x },
      { p: { x: pos.x, y: rect.y - radius }, pen: pos.y - rect.y },
      { p: { x: pos.x, y: rect.y + rect.h + radius }, pen: rect.y + rect.h - pos.y },
    ];
    const valid = bounds
      ? candidates.filter(
          (c) =>
            c.p.x >= radius &&
            c.p.x <= bounds.width - radius &&
            c.p.y >= radius &&
            c.p.y <= bounds.height - radius,
        )
      : candidates;
    const pool = valid.length > 0 ? valid : candidates;
    pool.sort((a, b) => a.pen - b.pen);
    return pool[0].p;
  }

  const dist = Math.sqrt(distSq);
  const overlap = radius - dist;
  return {
    x: pos.x + (dx / dist) * overlap,
    y: pos.y + (dy / dist) * overlap,
  };
}

export function resolveMapMovement(pos: Vec2, radius: number, map: MapDef): Vec2 {
  const bounds = { width: map.width, height: map.height };
  let next: Vec2 = {
    x: Math.max(radius, Math.min(map.width - radius, pos.x)),
    y: Math.max(radius, Math.min(map.height - radius, pos.y)),
  };
  for (let pass = 0; pass < 2; pass++) {
    for (const obs of map.obstacles) {
      next = resolveCircleRectCollision(next, radius, obs, bounds);
    }
    next = {
      x: Math.max(radius, Math.min(map.width - radius, next.x)),
      y: Math.max(radius, Math.min(map.height - radius, next.y)),
    };
  }
  return next;
}
