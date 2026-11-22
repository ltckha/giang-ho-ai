import { describe, expect, it } from 'vitest';
import {
  evaluateAllyDecision,
  type AIDecisionContext,
  type EnemySnapshot,
  type LootSnapshot,
  type PartyMemberSnapshot,
} from '../src/core/aiDecisionTree';
import type { AllyId, AllyPersonality } from '../src/core/types';

function makeContext(overrides: {
  id: AllyId;
  personality: AllyPersonality;
  hp?: number;
  maxHp?: number;
  pos?: { x: number; y: number };
  canHeal?: boolean;
  healCooldownRemaining?: number;
  player?: Partial<PartyMemberSnapshot>;
  party?: PartyMemberSnapshot[];
  enemies?: EnemySnapshot[];
  lootDrops?: LootSnapshot[];
  isSafeZone?: boolean;
}): AIDecisionContext {
  const selfPos = overrides.pos ?? { x: 200, y: 200 };
  const player: PartyMemberSnapshot = {
    id: 'player',
    isPlayer: true,
    pos: { x: 180, y: 200 },
    hp: 120,
    maxHp: 120,
    ...overrides.player,
  };
  const selfMember: PartyMemberSnapshot = {
    id: overrides.id,
    isPlayer: false,
    pos: selfPos,
    hp: overrides.hp ?? 100,
    maxHp: overrides.maxHp ?? 100,
  };
  return {
    self: {
      id: overrides.id,
      personality: overrides.personality,
      pos: selfPos,
      hp: selfMember.hp,
      maxHp: selfMember.maxHp,
      attackRange: overrides.personality === 'cautious' ? 175 : 60,
      healCooldownRemaining: overrides.healCooldownRemaining ?? 0,
      canHeal: overrides.canHeal ?? overrides.personality === 'cautious',
    },
    player,
    party: overrides.party ?? [player, selfMember],
    enemies: overrides.enemies ?? [],
    lootDrops: overrides.lootDrops ?? [],
    isSafeZone: overrides.isSafeZone ?? false,
  };
}

describe('Cây quyết định 3 đồng đội AI khôi lỗi', () => {
  describe('Khôi lỗi Liều (reckless)', () => {
    it('xông vào kẻ địch mạnh nhất/trùm dù máu chỉ còn 30% và có đồ rơi bên cạnh', () => {
      const ctx = makeContext({
        id: 'ally_reckless',
        personality: 'reckless',
        hp: 30,
        maxHp: 100,
        enemies: [
          { id: 'e_small', pos: { x: 260, y: 200 }, hp: 40, maxHp: 60, isBoss: false, element: 'moc' },
          { id: 'e_boss', pos: { x: 350, y: 200 }, hp: 400, maxHp: 560, isBoss: true, element: 'thuy' },
        ],
        lootDrops: [{ id: 'loot_1', pos: { x: 210, y: 200 }, value: 50, kind: 'spirit_stone' }],
      });

      const action = evaluateAllyDecision(ctx);
      expect(action.type).toBe('charge_attack');
      expect(action.targetId).toBe('e_boss');
    });

    it('chỉ lùi khi máu cực thấp (< 20%) và có kẻ địch áp sát', () => {
      const ctx = makeContext({
        id: 'ally_reckless',
        personality: 'reckless',
        hp: 15,
        maxHp: 100,
        enemies: [{ id: 'e1', pos: { x: 240, y: 200 }, hp: 80, maxHp: 80, isBoss: false, element: 'tho' }],
      });

      const action = evaluateAllyDecision(ctx);
      expect(action.type).toBe('retreat');
      expect(action.targetPos?.x).toBeLessThan(200);
    });
  });

  describe('Khôi lỗi Cẩn thận (cautious)', () => {
    it('ưu tiên hồi máu đồng đội/người chơi khi có người xuống dưới 60% HP và hồi chiêu sẵn sàng', () => {
      const hurtPlayer: PartyMemberSnapshot = {
        id: 'player',
        isPlayer: true,
        pos: { x: 160, y: 200 },
        hp: 50,
        maxHp: 120,
      };
      const ctx = makeContext({
        id: 'ally_cautious',
        personality: 'cautious',
        hp: 110,
        maxHp: 115,
        healCooldownRemaining: 0,
        player: hurtPlayer,
        party: [
          hurtPlayer,
          { id: 'ally_reckless', isPlayer: false, pos: { x: 230, y: 200 }, hp: 90, maxHp: 130 },
          { id: 'ally_cautious', isPlayer: false, pos: { x: 200, y: 200 }, hp: 110, maxHp: 115 },
        ],
        enemies: [{ id: 'e1', pos: { x: 300, y: 200 }, hp: 90, maxHp: 90, isBoss: false, element: 'kim' }],
      });

      const action = evaluateAllyDecision(ctx);
      expect(action.type).toBe('heal_ally');
      expect(action.targetId).toBe('player');
    });

    it('chủ động lùi giữ khoảng cách khi địch áp sát quá gần hoặc HP < 45% (khi chiêu hồi máu đang hồi)', () => {
      const ctxTooClose = makeContext({
        id: 'ally_cautious',
        personality: 'cautious',
        hp: 100,
        maxHp: 115,
        healCooldownRemaining: 4,
        enemies: [{ id: 'e1', pos: { x: 250, y: 200 }, hp: 90, maxHp: 90, isBoss: false, element: 'kim' }],
      });
      expect(evaluateAllyDecision(ctxTooClose).type).toBe('retreat');

      const ctxLowHp = makeContext({
        id: 'ally_cautious',
        personality: 'cautious',
        hp: 40,
        maxHp: 115,
        healCooldownRemaining: 4,
        enemies: [{ id: 'e1', pos: { x: 360, y: 200 }, hp: 90, maxHp: 90, isBoss: false, element: 'kim' }],
      });
      expect(evaluateAllyDecision(ctxLowHp).type).toBe('retreat');
    });

    it('đánh hỗ trợ tầm xa khi cả đội đủ máu và kẻ địch ở khoảng cách an toàn', () => {
      const ctx = makeContext({
        id: 'ally_cautious',
        personality: 'cautious',
        hp: 110,
        maxHp: 115,
        enemies: [{ id: 'e1', pos: { x: 340, y: 200 }, hp: 90, maxHp: 90, isBoss: false, element: 'hoa' }],
      });

      const action = evaluateAllyDecision(ctx);
      expect(action.type).toBe('attack');
      expect(action.targetId).toBe('e1');
    });
  });

  describe('Khôi lỗi Tham đồ (greedy)', () => {
    it('ưu tiên chạy đi nhặt linh thạch / trang bị ngay cả khi đang có quái xung quanh', () => {
      const ctx = makeContext({
        id: 'ally_greedy',
        personality: 'greedy',
        hp: 85,
        maxHp: 105,
        enemies: [{ id: 'e1', pos: { x: 260, y: 200 }, hp: 80, maxHp: 80, isBoss: false, element: 'tho' }],
        lootDrops: [
          { id: 'loot_silver', pos: { x: 250, y: 220 }, value: 15, kind: 'silver' },
          { id: 'loot_item', pos: { x: 310, y: 200 }, value: 90, kind: 'item' },
        ],
      });

      const action = evaluateAllyDecision(ctx);
      expect(action.type).toBe('pickup_loot');
      expect(action.targetId).toBe('loot_item');
    });

    it('khi không có đồ rơi, ưu tiên đánh con quái ít máu nhất để mau rơi đồ', () => {
      const ctx = makeContext({
        id: 'ally_greedy',
        personality: 'greedy',
        hp: 90,
        maxHp: 105,
        enemies: [
          { id: 'e_full', pos: { x: 240, y: 200 }, hp: 100, maxHp: 100, isBoss: false, element: 'tho' },
          { id: 'e_weak', pos: { x: 330, y: 200 }, hp: 18, maxHp: 80, isBoss: false, element: 'kim' },
        ],
      });

      const action = evaluateAllyDecision(ctx);
      expect(action.type).toBe('attack');
      expect(action.targetId).toBe('e_weak');
    });

    it('đi theo người chơi khi đang ở khu an toàn và đứng xa', () => {
      const ctx = makeContext({
        id: 'ally_greedy',
        personality: 'greedy',
        isSafeZone: true,
        pos: { x: 100, y: 100 },
        player: { pos: { x: 400, y: 400 } },
        enemies: [{ id: 'e1', pos: { x: 120, y: 100 }, hp: 50, maxHp: 50, isBoss: false, element: 'kim' }],
      });

      const action = evaluateAllyDecision(ctx);
      expect(action.type).toBe('follow');
    });
  });
});
