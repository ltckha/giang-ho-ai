import { describe, expect, it } from 'vitest';
import { STAGES } from '../src/core/tdDefinitions';
import { HARD_HP, HARD_SPEED, TowerDefenseEngine } from '../src/core/tdEngine';
import { saveHardWin, loadTdSave } from '../src/core/saveSystem';

describe('Chế độ ★ Khó', () => {
  it('quái nhiều máu và nhanh hơn, màn thường không đổi', () => {
    const st = STAGES.stage_1;
    const normal = new TowerDefenseEngine(st);
    const hard = new TowerDefenseEngine(st, { hard: true });
    const eid = st.waves[0]!.groups[0]!.enemyId;
    const a = normal.spawnEnemy(eid);
    const b = hard.spawnEnemy(eid);
    expect(b.maxHp).toBe(Math.round(a.maxHp * HARD_HP));
    expect(b.baseSpeed).toBeCloseTo(a.baseSpeed * HARD_SPEED);
  });
  it('ghi sao Khó riêng, giữ mức cao nhất', () => {
    const mem = new Map<string, string>();
    const store = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    saveHardWin('stage_1', 2, store);
    saveHardWin('stage_1', 1, store);
    expect(loadTdSave(store).hardStarsByStage?.stage_1).toBe(2);
  });
});
