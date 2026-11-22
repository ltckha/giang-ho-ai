import { describe, expect, it } from 'vitest';
import { loadTdSave, saveTdProgress, TD_SAVE_KEY } from '../src/core/saveSystem';
import { runBotTurn } from '../src/core/tdBot';
import {
  calculateSellRefund,
  ENEMY_DEFINITIONS,
  getTowerTierStats,
  STAGE_1_DEFINITION,
  TOWER_DEFINITIONS,
} from '../src/core/tdDefinitions';
import { calculateStarRating, TowerDefenseEngine } from '../src/core/tdEngine';
import type { TowerBranch, TowerId } from '../src/core/types';

const TOWER_TYPES = Object.keys(TOWER_DEFINITIONS) as TowerId[];
const STAGE_1_PADS = STAGE_1_DEFINITION.pads.map((p) => p.id);

function makeRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function runSimulationPolicy(policy: (e: TowerDefenseEngine) => void): {
  status: 'playing' | 'won' | 'lost';
  lives: number;
  time: number;
} {
  const e = new TowerDefenseEngine(STAGE_1_DEFINITION);
  let t = 0;
  while (e.status === 'playing' && t < 3600) {
    policy(e);
    if (!e.waveInProgress && e.canStartNextWave()) {
      e.startNextWave(false);
    }
    e.step(0.05);
    t += 0.05;
  }
  return { status: e.status, lives: e.lives, time: Math.round(t) };
}

function makeGreedyPolicy(
  typeForPad: (padId: string) => TowerId,
  upgrade = true,
  branch: TowerBranch = 'A',
): (e: TowerDefenseEngine) => void {
  return (e: TowerDefenseEngine) => {
    for (const p of STAGE_1_PADS) {
      if (!e.getTowerAtPad(p)) {
        const d = typeForPad(p);
        if (e.essence >= TOWER_DEFINITIONS[d].tier1.cost) {
          e.buildTower(p, d);
        }
        return;
      }
    }
    if (!upgrade) return;
    for (const p of STAGE_1_PADS) {
      const tw = e.getTowerAtPad(p)!;
      if (tw.tier < 3) {
        const nextTier = (tw.tier + 1) as 2 | 3;
        const c = getTowerTierStats(tw.defId, nextTier, branch).cost;
        if (e.essence >= c) {
          e.upgradeTower(p, tw.tier === 2 ? branch : undefined);
        }
        return;
      }
    }
  };
}

describe('Thủ thành — Sát thương Ngũ Hành, Nâng cấp & Bán quân', () => {
  it('áp dụng chênh lệch khắc hệ rõ rệt và kháng hệ trên quái máu trâu (Thạch Giáp)', () => {
    const engine = new TowerDefenseEngine(STAGE_1_DEFINITION);
    const woodTower = engine.buildTower('pad_1', 'wood_tower')!;
    expect(woodTower).not.toBeNull();

    const earthEnemy = engine.spawnEnemy('tank_earth', 0, 1);
    const metalEnemy = engine.spawnEnemy('fast_metal', 0, 1);
    const fireEnemy = engine.spawnEnemy('split_fire', 0, 1);

    // Mộc khắc Thổ (1.75x + xuyên giáp kháng), bị Kim khắc (0.5x), trung tính với Hỏa (1.0x)
    const vsEarth = engine.computeHitDamage(woodTower, 100, earthEnemy);
    const vsMetal = engine.computeHitDamage(woodTower, 100, metalEnemy);
    const vsFire = engine.computeHitDamage(woodTower, 100, fireEnemy);

    expect(vsEarth.isCounter).toBe(true);
    expect(vsMetal.isCountered).toBe(true);
    expect(vsFire.isCounter).toBe(false);
    expect(vsFire.isCountered).toBe(false);

    expect(vsEarth.damage).toBeGreaterThan(vsFire.damage * 1.5);
    expect(vsMetal.damage).toBeLessThan(vsFire.damage * 0.65);

    // Quái máu trâu (Thạch Giáp - Thổ) kháng mạnh đòn đánh không khắc hệ (vd Hỏa Lôi Khôi bắn Thạch Giáp)
    const fireTower = engine.buildTower('pad_2', 'fire_tower')!;
    const fireVsTank = engine.computeHitDamage(fireTower, 100, earthEnemy);
    expect(vsEarth.damage).toBeGreaterThan(fireVsTank.damage * 3.0);
  });

  it('mỗi đợt trong Màn 1 đều trộn ít nhất 2 hệ Ngũ Hành để 1 loại quân không cân được hết', () => {
    for (const wave of STAGE_1_DEFINITION.waves) {
      expect(wave.mainElements.length).toBeGreaterThanOrEqual(2);
      expect(wave.groups.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('nâng cấp đủ 3 bậc, chọn 1 trong 2 nhánh ở bậc 3 và bán hoàn đúng 70% linh thạch', () => {
    const engine = new TowerDefenseEngine(STAGE_1_DEFINITION);
    engine.essence = 500;

    const t1Cost = TOWER_DEFINITIONS.fire_tower.tier1.cost;
    const t2Cost = TOWER_DEFINITIONS.fire_tower.tier2.cost;
    const t3BCost = TOWER_DEFINITIONS.fire_tower.tier3B.cost;

    const tower = engine.buildTower('pad_1', 'fire_tower')!;
    expect(tower.tier).toBe(1);
    expect(tower.totalInvested).toBe(t1Cost);

    expect(engine.upgradeTower('pad_1')).toBe(true);
    expect(tower.tier).toBe(2);
    expect(tower.totalInvested).toBe(t1Cost + t2Cost);

    expect(engine.upgradeTower('pad_1', 'B')).toBe(true);
    expect(tower.tier).toBe(3);
    expect(tower.branch).toBe('B');
    const totalInvested = t1Cost + t2Cost + t3BCost;
    expect(tower.totalInvested).toBe(totalInvested);

    expect(engine.upgradeTower('pad_1', 'A')).toBe(false);

    const beforeSell = engine.essence;
    const refund = engine.sellTower('pad_1');
    expect(refund).toBe(calculateSellRefund(totalInvested));
    expect(engine.essence).toBe(beforeSell + refund);
    expect(engine.getTowerAtPad('pad_1')).toBeUndefined();
  });
});

describe('Thủ thành — Trạng thái Làm chậm, Quái bay, Chia đôi & Phá bùa', () => {
  it('quân Thủy làm chậm quái mặt đất nhưng quái bay (Phi Dực) bỏ qua làm chậm', () => {
    const engine = new TowerDefenseEngine(STAGE_1_DEFINITION);
    engine.essence = 500;
    const waterTower = engine.buildTower('pad_1', 'water_tower')!;

    const groundEnemy = engine.spawnEnemy('fast_metal', 0, 1, {
      x: waterTower.x + 10,
      y: waterTower.y,
      waypointIndex: 1,
      distanceTraveled: 20,
    });
    const flyingEnemy = engine.spawnEnemy('fly_wood', 0, 1, {
      x: waterTower.x + 12,
      y: waterTower.y,
      waypointIndex: 1,
      distanceTraveled: 18,
    });

    engine.step(0.2);

    expect(groundEnemy.slowPercent).toBeGreaterThan(0);
    expect(groundEnemy.slowRemaining).toBeGreaterThan(0);
    expect(flyingEnemy.slowPercent).toBe(0);
  });

  it('quái Song Thể (Hỏa) chia đôi thành 2 Tiểu Hỏa Khôi khi bị tiêu diệt', () => {
    const engine = new TowerDefenseEngine(STAGE_1_DEFINITION);
    const splitter = engine.spawnEnemy('split_fire', 0, 1, {
      x: 100,
      y: 125,
      waypointIndex: 2,
      distanceTraveled: 120,
    });
    splitter.hp = 5;

    engine.buildTower('pad_1', 'water_tower');
    engine.step(0.2);

    const minis = engine.enemies.filter((e) => e.defId === 'split_fire_mini');
    expect(minis.length).toBe(2);
  });

  it('quái Phá Bùa khóa quân đứng gần và trụ Thổ giúp giảm/miễn nhiễm thời gian bị khóa', () => {
    const engine = new TowerDefenseEngine(STAGE_1_DEFINITION);
    engine.essence = 600;

    const attacker = engine.buildTower('pad_3', 'wood_tower')!;
    const disruptor = engine.spawnEnemy('disrupt_water', 0, 1, {
      x: attacker.x + 15,
      y: attacker.y,
      waypointIndex: 2,
      distanceTraveled: 50,
    });

    const interval = ENEMY_DEFINITIONS.disrupt_water.disruptIntervalSec!;
    disruptor.abilityTimer = interval - 0.05;
    engine.step(0.1);

    expect(attacker.disruptedRemaining).toBeGreaterThan(2.0);

    engine.buildTower('pad_4', 'earth_tower');
    engine.upgradeTower('pad_4');
    engine.upgradeTower('pad_4', 'A');

    engine.step(0.5);
    expect(attacker.disruptedRemaining).toBe(0);
    expect(attacker.protectedFromDisrupt).toBe(true);

    disruptor.abilityTimer = interval - 0.05;
    engine.step(0.1);
    expect(attacker.disruptedRemaining).toBe(0);
  });
});

describe('Thủ thành — Kiểm thử độ khó & cân bằng Màn 1 (theo script REVIEW_LOG)', () => {
  it('lấp toàn bộ 9 ô bằng 1 loại quân duy nhất (có hoặc không nâng cấp) đều THUA', () => {
    for (const ty of TOWER_TYPES) {
      const withUpgrade = runSimulationPolicy(makeGreedyPolicy(() => ty, true));
      const withoutUpgrade = runSimulationPolicy(makeGreedyPolicy(() => ty, false));
      expect(withUpgrade.status).toBe('lost');
      expect(withoutUpgrade.status).toBe('lost');
    }
  });

  it('chỉ đặt 1–4 quân đơn lẻ (kể cả nâng tối đa) đều THUA', () => {
    for (const n of [1, 2, 3, 4]) {
      for (const ty of ['wood_tower', 'fire_tower'] as TowerId[]) {
        const limitedPads = STAGE_1_PADS.slice(0, n);
        const policy = (e: TowerDefenseEngine) => {
          for (const p of limitedPads) {
            if (!e.getTowerAtPad(p)) {
              if (e.essence >= TOWER_DEFINITIONS[ty].tier1.cost) {
                e.buildTower(p, ty);
              }
              return;
            }
          }
          for (const p of limitedPads) {
            const tw = e.getTowerAtPad(p)!;
            if (tw.tier < 3) {
              const nextTier = (tw.tier + 1) as 2 | 3;
              const c = getTowerTierStats(tw.defId, nextTier, 'A').cost;
              if (e.essence >= c) {
                e.upgradeTower(p, tw.tier === 2 ? 'A' : undefined);
              }
              return;
            }
          }
        };
        const out = runSimulationPolicy(policy);
        expect(out.status).toBe('lost');
      }
    }
  });

  it('60 lần đặt loại quân ngẫu nhiên (seed 1..60): tỷ lệ thắng <= 30% và hầu như không 3 sao', () => {
    let won = 0;
    let threeStars = 0;

    for (let s = 1; s <= 60; s += 1) {
      const r = makeRng(s);
      const map: Record<string, TowerId> = {};
      for (const p of STAGE_1_PADS) {
        map[p] = TOWER_TYPES[Math.floor(r() * TOWER_TYPES.length)]!;
      }
      const branch: TowerBranch = r() < 0.5 ? 'A' : 'B';
      const out = runSimulationPolicy(makeGreedyPolicy((p) => map[p]!, true, branch));
      if (out.status === 'won') {
        won += 1;
        if (calculateStarRating(out.lives, STAGE_1_DEFINITION.startingLives) === 3) {
          threeStars += 1;
        }
      }
    }

    // Thắng không quá 30% (<= 18/60) và hầu như không có 3 sao (<= 2/60)
    expect(won).toBeGreaterThan(0);
    expect(won).toBeLessThanOrEqual(18);
    expect(threeStars).toBeLessThanOrEqual(2);
  });

  it('bot chơi đúng hệ phối hợp 5 loại quân sẽ THẮNG nhưng mất vài mạng (2 sao, không phải 20/20 dễ dàng)', () => {
    const out = runSimulationPolicy(runBotTurn);
    expect(out.status).toBe('won');
    expect(out.lives).toBeGreaterThanOrEqual(10);
    expect(out.lives).toBeLessThan(18);
    expect(calculateStarRating(out.lives, STAGE_1_DEFINITION.startingLives)).toBe(2);
  });

  it('lưu tiến độ màn và số sao vào khoá localStorage mới riêng biệt', () => {
    const mem = new Map<string, string>();
    const fakeStorage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v);
      },
    };

    const initial = loadTdSave(fakeStorage);
    expect(initial.unlockedStage).toBe(1);

    saveTdProgress('stage_1', 2, 11, fakeStorage);
    expect(mem.has(TD_SAVE_KEY)).toBe(true);

    const loaded = loadTdSave(fakeStorage);
    expect(loaded.unlockedStage).toBe(2);
    expect(loaded.starsByStage.stage_1).toBe(2);
    expect(loaded.bestLivesByStage.stage_1).toBe(11);
  });
});
