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

describe('Gọn Tiệm, Sạch Phố — Ngũ Hành Tiệm Giày, Nâng cấp & Bán món', () => {
  it('áp dụng đúng 5 cặp khắc chế đời thường của Tiệm Giày Hẻm Dốc và kháng hệ trên Cục Bùn', () => {
    const engine = new TowerDefenseEngine(STAGE_1_DEFINITION);
    engine.essence = 1000;

    const depTong = engine.buildTower('pad_1', 'wood_tower')!; // Mộc — khắc Thổ (Cục Bùn)
    const botDinh = engine.buildTower('pad_2', 'metal_tower')!; // Kim — khắc Mộc (Gián, Nấm Mốc)
    const xitDa = engine.buildTower('pad_3', 'water_tower')!; // Thủy — khắc Hỏa (Nắng Gắt)
    const tuiHutAm = engine.buildTower('pad_4', 'fire_tower')!; // Thổ — khắc Thủy (Giọt Mưa)
    const maySay = engine.buildTower('pad_5', 'earth_tower')!; // Hỏa — khắc Kim (Chuột)

    const cucBun = engine.spawnEnemy('tank_earth', 0, 1); // Thổ
    const gian = engine.spawnEnemy('split_fire', 0, 1); // Mộc
    const nangGat = engine.spawnEnemy('fly_wood', 0, 1); // Hỏa
    const giotMua = engine.spawnEnemy('fast_metal', 0, 1); // Thủy
    const chuot = engine.spawnEnemy('disrupt_water', 0, 1); // Kim

    // 5 cặp "Trúng tủ!" (khắc 1.75x)
    expect(engine.computeHitDamage(depTong, 100, cucBun).isCounter).toBe(true);
    expect(engine.computeHitDamage(botDinh, 100, gian).isCounter).toBe(true);
    expect(engine.computeHitDamage(xitDa, 100, nangGat).isCounter).toBe(true);
    expect(engine.computeHitDamage(tuiHutAm, 100, giotMua).isCounter).toBe(true);
    expect(engine.computeHitDamage(maySay, 100, chuot).isCounter).toBe(true);

    // Bị khắc (0.5x): Dép Tông (Mộc) bắn Chuột (Kim)
    const depVsChuot = engine.computeHitDamage(depTong, 100, chuot);
    const depVsBun = engine.computeHitDamage(depTong, 100, cucBun);
    const depVsGiotMua = engine.computeHitDamage(depTong, 100, giotMua);
    expect(depVsChuot.isCountered).toBe(true);
    expect(depVsBun.damage).toBeGreaterThan(depVsGiotMua.damage * 1.5);
    expect(depVsChuot.damage).toBeLessThan(depVsGiotMua.damage * 0.65);

    // Cục Bùn (Thổ) kháng mạnh món không phải Mộc (vd Túi Hút Ẩm hành Thổ đánh Cục Bùn)
    const tuiVsBun = engine.computeHitDamage(tuiHutAm, 100, cucBun);
    expect(depVsBun.damage).toBeGreaterThan(tuiVsBun.damage * 3.0);
  });

  it('mỗi đợt trong Màn 1 Tiệm Giày Hẻm Dốc đều trộn ít nhất 2 hành Ngũ Hành', () => {
    expect(STAGE_1_DEFINITION.name).toBe('Tiệm Giày Hẻm Dốc');
    for (const wave of STAGE_1_DEFINITION.waves) {
      expect(wave.mainElements.length).toBeGreaterThanOrEqual(2);
      expect(wave.groups.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('nâng cấp đủ 3 bậc, chọn 1 trong 2 nhánh ở bậc 3 và bán hoàn đúng 70% tiền xu', () => {
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

describe('Gọn Tiệm, Sạch Phố — Làm chậm, Nắng Gắt, Gián tách đôi & Chuột gặm', () => {
  it('Xịt Dưỡng Da làm chậm Giọt Mưa nhưng tia Nắng Gắt không bị làm chậm', () => {
    const engine = new TowerDefenseEngine(STAGE_1_DEFINITION);
    engine.essence = 500;
    const xitDa = engine.buildTower('pad_1', 'water_tower')!;

    const giotMua = engine.spawnEnemy('fast_metal', 0, 1, {
      x: xitDa.x + 10,
      y: xitDa.y,
      waypointIndex: 1,
      distanceTraveled: 20,
    });
    const nangGat = engine.spawnEnemy('fly_wood', 0, 1, {
      x: xitDa.x + 12,
      y: xitDa.y,
      waypointIndex: 1,
      distanceTraveled: 18,
    });

    engine.step(0.2);

    expect(giotMua.slowPercent).toBeGreaterThan(0);
    expect(giotMua.slowRemaining).toBeGreaterThan(0);
    expect(nangGat.slowPercent).toBe(0);
  });

  it('Gián (Mộc) khi bị đập chết tách ra 2 Gián Con chạy nhanh', () => {
    const engine = new TowerDefenseEngine(STAGE_1_DEFINITION);
    const gian = engine.spawnEnemy('split_fire', 0, 1, {
      x: 100,
      y: 125,
      waypointIndex: 2,
      distanceTraveled: 120,
    });
    gian.hp = 5;

    engine.buildTower('pad_1', 'metal_tower');
    engine.step(0.2);

    const gianCon = engine.enemies.filter((e) => e.defId === 'split_fire_mini');
    expect(gianCon.length).toBe(2);
  });

  it('Chuột gặm món gần nó làm đứng im và Máy Sấy Giày gỡ nhanh / bảo hộ', () => {
    const engine = new TowerDefenseEngine(STAGE_1_DEFINITION);
    engine.essence = 600;

    const depTong = engine.buildTower('pad_3', 'wood_tower')!;
    const chuot = engine.spawnEnemy('disrupt_water', 0, 1, {
      x: depTong.x + 15,
      y: depTong.y,
      waypointIndex: 2,
      distanceTraveled: 50,
    });

    const interval = ENEMY_DEFINITIONS.disrupt_water.disruptIntervalSec!;
    chuot.abilityTimer = interval - 0.05;
    engine.step(0.1);

    expect(depTong.disruptedRemaining).toBeGreaterThan(2.0);

    engine.buildTower('pad_4', 'earth_tower');
    engine.upgradeTower('pad_4');
    engine.upgradeTower('pad_4', 'A');

    engine.step(0.5);
    expect(depTong.disruptedRemaining).toBe(0);
    expect(depTong.protectedFromDisrupt).toBe(true);

    chuot.abilityTimer = interval - 0.05;
    engine.step(0.1);
    expect(depTong.disruptedRemaining).toBe(0);
  });
});

describe('Gọn Tiệm, Sạch Phố — Kiểm thử độ khó & cân bằng Màn 1 sau gán lại hành', () => {
  it('lấp toàn bộ 9 ô bằng 1 loại món duy nhất (có hoặc không nâng cấp) đều THUA', () => {
    for (const ty of TOWER_TYPES) {
      const withUpgrade = runSimulationPolicy(makeGreedyPolicy(() => ty, true));
      const withoutUpgrade = runSimulationPolicy(makeGreedyPolicy(() => ty, false));
      expect(withUpgrade.status).toBe('lost');
      expect(withoutUpgrade.status).toBe('lost');
    }
  });

  it('chỉ đặt 1–4 món đơn lẻ (kể cả nâng tối đa) đều THUA', () => {
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

  it('60 lần đặt loại món ngẫu nhiên (seed 1..60): tỷ lệ thắng <= 30% và hầu như không 3 sao', () => {
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

    expect(won).toBeGreaterThan(0);
    expect(won).toBeLessThanOrEqual(18);
    expect(threeStars).toBeLessThanOrEqual(2);
  });

  it('bot phối hợp đủ 5 món theo vòng khắc sẽ THẮNG nhưng mất vài đôi giày (2–3 sao, không phải 20/20 dễ dàng)', () => {
    const out = runSimulationPolicy(runBotTurn);
    expect(out.status).toBe('won');
    expect(out.lives).toBeGreaterThanOrEqual(10);
    expect(out.lives).toBeLessThan(20);
    expect(calculateStarRating(out.lives, STAGE_1_DEFINITION.startingLives)).toBeGreaterThanOrEqual(2);
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

    saveTdProgress('stage_1', 3, 17, fakeStorage);
    expect(mem.has(TD_SAVE_KEY)).toBe(true);

    const loaded = loadTdSave(fakeStorage);
    expect(loaded.unlockedStage).toBe(2);
    expect(loaded.starsByStage.stage_1).toBe(3);
    expect(loaded.bestLivesByStage.stage_1).toBe(17);
  });
});
