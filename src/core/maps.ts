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
      // Viền rừng (mở lối Tây về Thành, mở lối Đông Nam vào Hang)
      { x: 0, y: 0, w: 1760, h: 48 },
      { x: 0, y: 1112, w: 1760, h: 48 },
      { x: 0, y: 0, w: 48, h: 458 },
      { x: 0, y: 630, w: 48, h: 530 },
      { x: 1712, y: 0, w: 48, h: 788 },
      { x: 1712, y: 940, w: 48, h: 220 },
      // Rặng đá & cây chắn tạo 3 nhánh: bãi mỏ phía đông, ngã ba, lối cụt phía bắc (nhiệm vụ bịa đường)
      { x: 420, y: 280, w: 150, h: 120 },
      { x: 420, y: 690, w: 170, h: 140 },
      { x: 900, y: 440, w: 180, h: 110 },
      { x: 1240, y: 180, w: 130, h: 180 },
      { x: 1080, y: 760, w: 190, h: 120 },
    ],
    landmarks: [
      { id: 'lm_crossroads', x: 580, y: 460, w: 220, h: 180, kind: 'crossroads' },
      { id: 'lm_mine', x: 1080, y: 440, w: 420, h: 270, kind: 'mine' },
      { id: 'lm_fake_landmark', x: 740, y: 90, w: 300, h: 180, kind: 'fake_landmark' },
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
    npcs: [{ id: 'npc_guide', role: 'guide', x: 660, y: 530 }],
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
