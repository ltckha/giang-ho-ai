import { describe, expect, it } from 'vitest';
import { runBotTurn } from '../src/core/tdBot';
import { STAGES, getStageTowerList, getTowerTierStats } from '../src/core/tdDefinitions';
import { TowerDefenseEngine } from '../src/core/tdEngine';
import type { TowerId } from '../src/core/types';

const ST = STAGES.stage_3;
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

describe('Màn 3 — Tiệm Hoa Cuối Dốc (sườn Claude)', () => {
  it('5 món tiệm hoa đủ 5 hành, 12 đợt, 2 cửa vào khác nhau, đợt cuối có trùm', () => {
    expect(new Set(getStageTowerList(ST).map((t) => t.element)).size).toBe(5);
    expect(ST.waves.length).toBe(12);
    expect(ST.paths.length).toBe(2);
    expect(ST.paths[0]![0]).not.toEqual(ST.paths[1]![0]);
    expect(ST.waves[11]!.groups.some((g) => g.enemyId === 'fl_monsoon')).toBe(true);
  });

  it('Trùm Mùa Nồm đổi hành Thủy → Mộc → Kim khi mất máu', () => {
    const e = new TowerDefenseEngine(ST);
    const boss = e.spawnEnemy('fl_monsoon', 1, 1);
    expect(boss.element).toBe('thuy');
    boss.hp = boss.maxHp * 0.6;
    const ev1 = e.step(0.01);
    expect(boss.element).toBe('moc');
    expect(ev1.some((x) => x.type === 'element_shift')).toBe(true);
    boss.hp = boss.maxHp * 0.3;
    e.step(0.01);
    expect(boss.element).toBe('kim');
  });

  it('bot chơi đúng hệ thắng cả trùm', () => {
    expect(play(runBotTurn).status).toBe('won');
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
