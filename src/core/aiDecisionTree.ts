import type { AllyId, AllyPersonality, ElementType, Vec2 } from './types';

export type AIActionType =
  | 'charge_attack'
  | 'attack'
  | 'retreat'
  | 'heal_ally'
  | 'pickup_loot'
  | 'follow'
  | 'idle';

export interface AllyArchetypeDef {
  id: AllyId;
  personality: AllyPersonality;
  element: ElementType;
  maxHp: number;
  atk: number;
  def: number;
  moveSpeed: number;
  attackRange: number;
  attackCooldownSec: number;
  healCooldownSec: number;
  healAmount: number;
}

export const ALLY_ARCHETYPES: Record<AllyId, AllyArchetypeDef> = {
  ally_reckless: {
    id: 'ally_reckless',
    personality: 'reckless',
    element: 'hoa',
    maxHp: 130,
    atk: 19,
    def: 8,
    moveSpeed: 178,
    attackRange: 56,
    attackCooldownSec: 0.9,
    healCooldownSec: 99,
    healAmount: 0,
  },
  ally_cautious: {
    id: 'ally_cautious',
    personality: 'cautious',
    element: 'tho',
    maxHp: 115,
    atk: 13,
    def: 12,
    moveSpeed: 168,
    attackRange: 175,
    attackCooldownSec: 1.15,
    healCooldownSec: 6.0,
    healAmount: 38,
  },
  ally_greedy: {
    id: 'ally_greedy',
    personality: 'greedy',
    element: 'thuy',
    maxHp: 105,
    atk: 16,
    def: 9,
    moveSpeed: 196,
    attackRange: 62,
    attackCooldownSec: 0.85,
    healCooldownSec: 99,
    healAmount: 0,
  },
};

export interface PartyMemberSnapshot {
  id: string;
  isPlayer: boolean;
  pos: Vec2;
  hp: number;
  maxHp: number;
}

export interface EnemySnapshot {
  id: string;
  pos: Vec2;
  hp: number;
  maxHp: number;
  isBoss: boolean;
  element: ElementType;
}

export interface LootSnapshot {
  id: string;
  pos: Vec2;
  value: number;
  kind: 'silver' | 'spirit_stone' | 'item' | 'quest';
}

export interface AIDecisionContext {
  self: {
    id: AllyId;
    personality: AllyPersonality;
    pos: Vec2;
    hp: number;
    maxHp: number;
    attackRange: number;
    healCooldownRemaining: number;
    canHeal: boolean;
  };
  player: PartyMemberSnapshot;
  party: PartyMemberSnapshot[];
  enemies: EnemySnapshot[];
  lootDrops: LootSnapshot[];
  isSafeZone: boolean;
}

export interface AIAction {
  type: AIActionType;
  targetId?: string;
  targetPos?: Vec2;
  reason: string;
}

export interface DecisionNode {
  evaluate(ctx: AIDecisionContext): AIAction | null;
}

export class SelectorNode implements DecisionNode {
  private readonly children: DecisionNode[];

  constructor(children: DecisionNode[]) {
    this.children = children;
  }

  evaluate(ctx: AIDecisionContext): AIAction | null {
    for (const child of this.children) {
      const result = child.evaluate(ctx);
      if (result !== null) {
        return result;
      }
    }
    return null;
  }
}

export class ConditionActionNode implements DecisionNode {
  private readonly predicate: (ctx: AIDecisionContext) => boolean;
  private readonly act: (ctx: AIDecisionContext) => AIAction | null;

  constructor(
    predicate: (ctx: AIDecisionContext) => boolean,
    act: (ctx: AIDecisionContext) => AIAction | null,
  ) {
    this.predicate = predicate;
    this.act = act;
  }

  evaluate(ctx: AIDecisionContext): AIAction | null {
    if (!this.predicate(ctx)) {
      return null;
    }
    return this.act(ctx);
  }
}

export function distBetween(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function hpRatio(hp: number, maxHp: number): number {
  if (maxHp <= 0) return 0;
  return hp / maxHp;
}

function findNearestEnemy(pos: Vec2, enemies: EnemySnapshot[], maxDist: number): EnemySnapshot | null {
  let best: EnemySnapshot | null = null;
  let bestDist = maxDist;
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const d = distBetween(pos, enemy.pos);
    if (d <= bestDist) {
      bestDist = d;
      best = enemy;
    }
  }
  return best;
}

function findStrongestEnemyInRange(
  pos: Vec2,
  enemies: EnemySnapshot[],
  maxDist: number,
): EnemySnapshot | null {
  let best: EnemySnapshot | null = null;
  let bestScore = -Infinity;
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const d = distBetween(pos, enemy.pos);
    if (d > maxDist) continue;
    const score = (enemy.isBoss ? 500 : 0) + enemy.maxHp - d * 0.4;
    if (score > bestScore) {
      bestScore = score;
      best = enemy;
    }
  }
  return best;
}

function findWeakestEnemyInRange(
  pos: Vec2,
  enemies: EnemySnapshot[],
  maxDist: number,
): EnemySnapshot | null {
  let best: EnemySnapshot | null = null;
  let bestHp = Infinity;
  let bestDist = Infinity;
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const d = distBetween(pos, enemy.pos);
    if (d > maxDist) continue;
    if (enemy.hp < bestHp || (enemy.hp === bestHp && d < bestDist)) {
      bestHp = enemy.hp;
      bestDist = d;
      best = enemy;
    }
  }
  return best;
}

function findBestLootInRange(
  pos: Vec2,
  lootDrops: LootSnapshot[],
  maxDist: number,
): LootSnapshot | null {
  let best: LootSnapshot | null = null;
  let bestScore = -Infinity;
  for (const loot of lootDrops) {
    const d = distBetween(pos, loot.pos);
    if (d > maxDist) continue;
    const kindBonus = loot.kind === 'quest' ? 120 : loot.kind === 'item' ? 80 : loot.kind === 'spirit_stone' ? 50 : 15;
    const score = loot.value + kindBonus - d * 0.25;
    if (score > bestScore) {
      bestScore = score;
      best = loot;
    }
  }
  return best;
}

function findMostInjuredPartyMember(
  pos: Vec2,
  party: PartyMemberSnapshot[],
  thresholdRatio: number,
  maxDist: number,
): PartyMemberSnapshot | null {
  let best: PartyMemberSnapshot | null = null;
  let lowestRatio = thresholdRatio;
  for (const member of party) {
    if (member.hp <= 0 || member.maxHp <= 0) continue;
    const d = distBetween(pos, member.pos);
    if (d > maxDist) continue;
    const ratio = member.hp / member.maxHp;
    if (ratio < lowestRatio) {
      lowestRatio = ratio;
      best = member;
    }
  }
  return best;
}

function computeRetreatPoint(selfPos: Vec2, threatPos: Vec2, anchorPos: Vec2, step = 120): Vec2 {
  const dx = selfPos.x - threatPos.x;
  const dy = selfPos.y - threatPos.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.001) {
    return { x: anchorPos.x, y: anchorPos.y };
  }
  const awayX = selfPos.x + (dx / len) * step;
  const awayY = selfPos.y + (dy / len) * step;
  // Blend slightly toward player anchor so ally does not wander off the map alone
  return {
    x: Math.round(awayX * 0.7 + anchorPos.x * 0.3),
    y: Math.round(awayY * 0.7 + anchorPos.y * 0.3),
  };
}

function buildRecklessTree(): DecisionNode {
  return new SelectorNode([
    // 1. Liều: chỉ chịu lùi khi gần hỏng hẳn (< 20% HP) và có địch áp sát
    new ConditionActionNode(
      (ctx) => !ctx.isSafeZone && hpRatio(ctx.self.hp, ctx.self.maxHp) < 0.2,
      (ctx) => {
        const threat = findNearestEnemy(ctx.self.pos, ctx.enemies, 180);
        if (!threat) return null;
        return {
          type: 'retreat',
          targetId: threat.id,
          targetPos: computeRetreatPoint(ctx.self.pos, threat.pos, ctx.player.pos),
          reason: 'critical_hp_retreat',
        };
      },
    ),
    // 2. Xông thẳng vào kẻ địch mạnh/gần trong tầm nhìn rộng
    new ConditionActionNode(
      (ctx) => !ctx.isSafeZone && ctx.enemies.length > 0,
      (ctx) => {
        const target = findStrongestEnemyInRange(ctx.self.pos, ctx.enemies, 360);
        if (!target) return null;
        return {
          type: 'charge_attack',
          targetId: target.id,
          targetPos: { ...target.pos },
          reason: 'reckless_charge',
        };
      },
    ),
    // 3. Nhặt đồ rất gần khi không có địch
    new ConditionActionNode(
      (ctx) => ctx.lootDrops.length > 0,
      (ctx) => {
        const loot = findBestLootInRange(ctx.self.pos, ctx.lootDrops, 75);
        if (!loot) return null;
        return {
          type: 'pickup_loot',
          targetId: loot.id,
          targetPos: { ...loot.pos },
          reason: 'idle_pickup_nearby',
        };
      },
    ),
    // 4. Đi theo đội hình người chơi
    new ConditionActionNode(
      (ctx) => distBetween(ctx.self.pos, ctx.player.pos) > 105,
      (ctx) => ({
        type: 'follow',
        targetId: ctx.player.id,
        targetPos: { x: ctx.player.pos.x + 48, y: ctx.player.pos.y - 36 },
        reason: 'follow_player',
      }),
    ),
  ]);
}

function buildCautiousTree(): DecisionNode {
  return new SelectorNode([
    // 1. Ưu tiên cao nhất: hồi máu khi người chơi hoặc đồng đội giảm dưới 60% HP
    new ConditionActionNode(
      (ctx) => ctx.self.canHeal && ctx.self.healCooldownRemaining <= 0,
      (ctx) => {
        const injured = findMostInjuredPartyMember(ctx.self.pos, ctx.party, 0.6, 290);
        if (!injured) return null;
        return {
          type: 'heal_ally',
          targetId: injured.id,
          targetPos: { ...injured.pos },
          reason: 'cautious_heal_party',
        };
      },
    ),
    // 2. Lùi sớm khi HP dưới 45% và có kẻ địch lại gần
    new ConditionActionNode(
      (ctx) => !ctx.isSafeZone && hpRatio(ctx.self.hp, ctx.self.maxHp) < 0.45,
      (ctx) => {
        const threat = findNearestEnemy(ctx.self.pos, ctx.enemies, 210);
        if (!threat) return null;
        return {
          type: 'retreat',
          targetId: threat.id,
          targetPos: computeRetreatPoint(ctx.self.pos, threat.pos, ctx.player.pos, 145),
          reason: 'cautious_low_hp_retreat',
        };
      },
    ),
    // 3. Giữ khoảng cách an toàn (lùi khi địch áp sát quá gần < 85px)
    new ConditionActionNode(
      (ctx) => !ctx.isSafeZone && ctx.enemies.length > 0,
      (ctx) => {
        const tooClose = findNearestEnemy(ctx.self.pos, ctx.enemies, 85);
        if (!tooClose) return null;
        return {
          type: 'retreat',
          targetId: tooClose.id,
          targetPos: computeRetreatPoint(ctx.self.pos, tooClose.pos, ctx.player.pos, 125),
          reason: 'cautious_kite_distance',
        };
      },
    ),
    // 4. Đánh tầm xa an toàn hỗ trợ người chơi
    new ConditionActionNode(
      (ctx) => !ctx.isSafeZone && ctx.enemies.length > 0,
      (ctx) => {
        const threat = findNearestEnemy(ctx.player.pos, ctx.enemies, 290);
        if (!threat) return null;
        return {
          type: 'attack',
          targetId: threat.id,
          targetPos: { ...threat.pos },
          reason: 'cautious_support_attack',
        };
      },
    ),
    // 5. Bám sát người chơi
    new ConditionActionNode(
      (ctx) => distBetween(ctx.self.pos, ctx.player.pos) > 90,
      (ctx) => ({
        type: 'follow',
        targetId: ctx.player.id,
        targetPos: { x: ctx.player.pos.x - 52, y: ctx.player.pos.y + 30 },
        reason: 'follow_player',
      }),
    ),
  ]);
}

function buildGreedyTree(): DecisionNode {
  return new SelectorNode([
    // 1. Lùi nếu sắp hỏng (< 22% HP) và địch ở sát
    new ConditionActionNode(
      (ctx) => !ctx.isSafeZone && hpRatio(ctx.self.hp, ctx.self.maxHp) < 0.22,
      (ctx) => {
        const threat = findNearestEnemy(ctx.self.pos, ctx.enemies, 150);
        if (!threat) return null;
        return {
          type: 'retreat',
          targetId: threat.id,
          targetPos: computeRetreatPoint(ctx.self.pos, threat.pos, ctx.player.pos),
          reason: 'greedy_survival_retreat',
        };
      },
    ),
    // 2. Tham đồ: thấy chiến lợi phẩm trong phạm vi lớn là lao tới nhặt ngay
    new ConditionActionNode(
      (ctx) => ctx.lootDrops.length > 0,
      (ctx) => {
        const loot = findBestLootInRange(ctx.self.pos, ctx.lootDrops, 360);
        if (!loot) return null;
        return {
          type: 'pickup_loot',
          targetId: loot.id,
          targetPos: { ...loot.pos },
          reason: 'greedy_rush_loot',
        };
      },
    ),
    // 3. Ưu tiên kết liễu kẻ địch ít máu nhất để nhanh rơi đồ
    new ConditionActionNode(
      (ctx) => !ctx.isSafeZone && ctx.enemies.length > 0,
      (ctx) => {
        const weak = findWeakestEnemyInRange(ctx.self.pos, ctx.enemies, 320);
        if (!weak) return null;
        return {
          type: 'attack',
          targetId: weak.id,
          targetPos: { ...weak.pos },
          reason: 'greedy_finish_weak_enemy',
        };
      },
    ),
    // 4. Đi theo người chơi
    new ConditionActionNode(
      (ctx) => distBetween(ctx.self.pos, ctx.player.pos) > 110,
      (ctx) => ({
        type: 'follow',
        targetId: ctx.player.id,
        targetPos: { x: ctx.player.pos.x - 42, y: ctx.player.pos.y - 44 },
        reason: 'follow_player',
      }),
    ),
  ]);
}

const TREES: Record<AllyPersonality, DecisionNode> = {
  reckless: buildRecklessTree(),
  cautious: buildCautiousTree(),
  greedy: buildGreedyTree(),
};

export function evaluateAllyDecision(ctx: AIDecisionContext): AIAction {
  const tree = TREES[ctx.self.personality];
  const decision = tree.evaluate(ctx);
  if (decision) {
    return decision;
  }
  return {
    type: 'idle',
    reason: 'stand_by',
  };
}
