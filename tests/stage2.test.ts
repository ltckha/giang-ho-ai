import { describe, expect, it } from 'vitest';
import { runBotTurn } from '../src/core/tdBot';
import { STAGES, getStageTowerList, getTowerTierStats } from '../src/core/tdDefinitions';
import { SYNERGY_DAMAGE_BONUS, TowerDefenseEngine } from '../src/core/tdEngine';
import type { TowerId } from '../src/core/types';

const ST = STAGES.stage_2;
const PADS = ST.pads.map((p) => p.id);
const TYPES = getStageTowerList(ST).map((t) => t.id);

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function play(policy: (e: TowerDefenseEngine) => void) {
  const e = new TowerDefenseEngine(ST);
  let t = 0;
  while (e.status === 'playing' && t < 3600) {
    policy(e);
    if (!e.waveInProgress && e.canStartNextWave()) e.startNextWave(false);
    e.step(0.05);
    t += 0.05;
  }
  return e;
}

function fillPolicy(typeForPad: (pad: string) => TowerId, branch: 'A' | 'B' = 'A') {
  return (e: TowerDefenseEngine) => {
    for (const p of PADS) {
      if (!e.getTowerAtPad(p)) {
        const d = typeForPad(p);
        if (e.essence >= getTowerTierStats(d, 1).cost) e.buildTower(p, d);
        return;
      }
    }
    for (const p of PADS) {
      const tw = e.getTowerAtPad(p)!;
      if (tw.tier < 3) {
        const next = (tw.tier + 1) as 2 | 3;
        if (e.essence >= getTowerTierStats(tw.defId, next, branch).cost) e.upgradeTower(p, next === 3 ? branch : undefined);
        return;
      }
    }
  };
}

describe('Màn 2 — Tiệm Bánh Đầu Phố (sườn Claude)', () => {
  it('có 5 món tiệm bánh đủ 5 hành, 10 đợt, 2 ngả đường', () => {
    const els = new Set(getStageTowerList(ST).map((t) => t.element));
    expect(els.size).toBe(5);
    expect(ST.waves.length).toBe(10);
    expect(ST.paths.length).toBe(2);
    const usedPaths = new Set(ST.waves.flatMap((w) => w.groups.map((g) => g.pathIndex)));
    expect(usedPaths).toEqual(new Set([0, 1]));
  });

  it('tương sinh: Quạt (Mộc) đặt cạnh Lò nướng (Hỏa) thì lò mạnh thêm 15%', () => {
    const e = new TowerDefenseEngine(ST);
    e.essence = 999;
    const oven = e.buildTower('pad_6', 'bk_oven')!;
    expect(oven.buffDamageMultiplier).toBeCloseTo(1, 5);
    e.buildTower('pad_3', 'bk_fan'); // cách pad_6 khoảng 110 → quá xa
    e.buildTower('pad_5', 'bk_fan'); // cách pad_6 khoảng 77 → cạnh nhau
    expect(oven.synergyFromUid).toBeDefined();
    expect(oven.buffDamageMultiplier).toBeCloseTo(1 + SYNERGY_DAMAGE_BONUS, 5);
  });

  it('Màn 1 không bật tương sinh (giữ cân bằng đã duyệt)', () => {
    const e = new TowerDefenseEngine(STAGES.stage_1);
    e.essence = 999;
    e.buildTower('pad_1', 'wood_tower'); // Mộc
    const fire = e.buildTower('pad_2', 'earth_tower')!; // Hỏa
    expect(fire.synergyFromUid).toBeUndefined();
  });

  it('bot chơi đúng hệ thắng nhưng phải mất mạng (không dễ 20/20)', () => {
    const e = play(runBotTurn);
    expect(e.status).toBe('won');
    expect(e.lives).toBeLessThan(20);
  });

  it('lấp toàn 1 loại món: thua cả 5 loại', () => {
    for (const ty of TYPES) expect(play(fillPolicy(() => ty)).status).toBe('lost');
  });

  it('đặt bừa 40 lần: thắng không quá 30%', () => {
    let won = 0;
    for (let s = 1; s <= 40; s++) {
      const r = rng(s);
      const map: Record<string, TowerId> = {};
      PADS.forEach((p) => (map[p] = TYPES[Math.floor(r() * TYPES.length)]!));
      if (play(fillPolicy((p) => map[p]!, r() < 0.5 ? 'A' : 'B')).status === 'won') won++;
    }
    expect(won / 40).toBeLessThanOrEqual(0.3);
  });
});

describe('Chuỗi tương sinh trên sân (Màn 2)', () => {
  it('chuỗi 3 món: cả 3 món +25%', () => {
    const e = new TowerDefenseEngine(ST);
    e.essence = 9999;
    // Thủy (tủ mát) → Mộc (quạt) → Hỏa (lò): pad_4 → pad_3 → pad_5
    const a = e.buildTower('pad_4', 'bk_fridge')!;
    const b = e.buildTower('pad_3', 'bk_fan')!;
    const c = e.buildTower('pad_5', 'bk_oven')!;
    for (const t of [b, c]) expect(t.synergyChainLength).toBe(3);
    expect(c.buffDamageMultiplier).toBeCloseTo(1.25, 5);
    expect(a.synergyChainLength).toBe(3);
  });

  it('chuỗi đủ 5 hành: Ngũ hành viên mãn trên sân, mọi món nhanh thêm 20%', () => {
    const e = new TowerDefenseEngine(ST);
    e.essence = 9999;
    // Kim → Thủy → Mộc → Hỏa → Thổ theo pad_4 → pad_3 → pad_5 → pad_6 → pad_8
    e.buildTower('pad_4', 'bk_swatter');
    e.buildTower('pad_3', 'bk_fridge');
    e.buildTower('pad_5', 'bk_fan');
    e.buildTower('pad_6', 'bk_oven');
    const last = e.buildTower('pad_8', 'bk_jar')!;
    expect(e.fullCycleActive).toBe(true);
    expect(last.synergyChainLength).toBe(5);
    expect(last.buffSpeedMultiplier).toBeGreaterThan(1.19);
  });
});
