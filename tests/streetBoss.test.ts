import { describe, expect, it } from 'vitest';
import { runBotTurn } from '../src/core/tdBot';
import { grantStageDrops, loadTdSave, saveStreetLoadout, saveTdProgress } from '../src/core/saveSystem';
import { isShopUnlocked, SHOP_STREET } from '../src/core/shopStreet';
import { STAGES, getStageTowerList } from '../src/core/tdDefinitions';
import { TowerDefenseEngine } from '../src/core/tdEngine';

const mem = () => { const m: Record<string, string> = {}; return { getItem: (k: string) => m[k] ?? null, setItem: (k: string, v: string) => { m[k] = v; } }; };

describe('Trận trùm phố', () => {
  it('chỉ mở khi qua cả 3 tiệm', () => {
    const st = mem();
    const boss = SHOP_STREET.find((s) => s.isBoss)!;
    saveTdProgress('stage_1', 3, 20, st);
    saveTdProgress('stage_2', 3, 20, st);
    expect(isShopUnlocked(loadTdSave(st), boss)).toBe(false);
    saveTdProgress('stage_3', 2, 12, st);
    expect(isShopUnlocked(loadTdSave(st), boss)).toBe(true);
  });

  it('mang được tối đa 6 loại món từ cả 3 tiệm; món không mang thì không đặt được', () => {
    const ST = STAGES.stage_4;
    expect(ST.towerIds!.length).toBe(15);
    const st = mem();
    const lo = saveStreetLoadout(['bk_fan', 'fl_heater', 'wood_tower', 'bk_fan', 'xxx' as never, 'fl_lime', 'metal_tower', 'bk_fridge', 'fl_can'], ST.towerIds!, 6, st);
    expect(lo.length).toBe(6);
    expect(new Set(lo).size).toBe(6);
    const e = new TowerDefenseEngine(ST, { loadout: lo });
    expect(getStageTowerList(ST, lo).map((t) => t.id)).toEqual(lo);
    expect(e.buildTower('pad_1', 'bk_fan')).not.toBeNull();
    expect(e.buildTower('pad_2', 'bk_oven')).toBeNull(); // không mang Lò Nướng
  });

  it('Bão Lốc Cuối Mùa đổi đủ 5 hành và gọi quân theo hành', () => {
    const e = new TowerDefenseEngine(STAGES.stage_4);
    const boss = e.spawnEnemy('st_bao_loc', 0, 1);
    const seen = new Set<string>([boss.element]);
    for (const frac of [0.75, 0.55, 0.35, 0.15]) {
      boss.hp = boss.maxHp * frac;
      e.step(0.01);
      seen.add(boss.element);
    }
    expect(seen.size).toBe(5);
    const before = e.enemies.length;
    for (let i = 0; i < 80; i++) e.step(0.1); // > 7 giây
    expect(e.enemies.length).toBeGreaterThan(before);
  });

  it('thắng trùm phố chắc chắn có 1 món Hàng hiệu', () => {
    const drops = grantStageDrops(4, 1, mem(), () => 0.9);
    expect(drops.some((d) => d.rarity === 'hieu')).toBe(true);
  });

  it('bot xếp tốt vẫn thắng được khi chưa có đồ', () => {
    const e = new TowerDefenseEngine(STAGES.stage_4);
    let t = 0;
    while (e.status === 'playing' && t < 3600) { runBotTurn(e); e.step(0.05); t += 0.05; }
    expect(e.status).toBe('won');
  });
});
