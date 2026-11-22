import { describe, expect, it } from 'vitest';
import { availablePoints, lower, META_MAX_LEVEL, metaDamageBonus, totalStars, tryRaise } from '../src/core/metaUpgrades';
import { loadTdSave, saveMetaLevels } from '../src/core/saveSystem';
import { STAGES } from '../src/core/tdDefinitions';
import { TowerDefenseEngine } from '../src/core/tdEngine';
import { ULTIMATE_COOLDOWN_SEC, ULTIMATE_COST } from '../src/core/ultimates';

function towerAt3(engine: TowerDefenseEngine, pad: string, id: Parameters<TowerDefenseEngine['buildTower']>[1]) {
  engine.buildTower(pad, id);
  engine.upgradeTower(pad);
  engine.upgradeTower(pad, 'A');
  return engine.getTowerAtPad(pad)!;
}

describe('Bậc 4 tuyệt chiêu', () => {
  it('Màn 1 không mở bậc 4; Màn 2 mở được, trừ đúng xu, +20% sức bị động', () => {
    const e1 = new TowerDefenseEngine(STAGES.stage_1);
    e1.essence = 9999;
    towerAt3(e1, 'pad_1', 'wood_tower');
    expect(e1.unlockUltimate('pad_1')).toBe(false);

    const e2 = new TowerDefenseEngine(STAGES.stage_2);
    e2.essence = 9999;
    const t = towerAt3(e2, 'pad_1', 'bk_swatter');
    const before = t.buffDamageMultiplier;
    const money = e2.essence;
    expect(e2.unlockUltimate('pad_1')).toBe(true);
    expect(e2.essence).toBe(money - ULTIMATE_COST);
    expect(t.buffDamageMultiplier).toBeCloseTo(before * 1.2, 5);
  });

  it('Hũ sành (đánh mạnh) dùng tuyệt chiêu: đánh mọi quái trong tầm, rồi phải chờ hồi chiêu', () => {
    const e = new TowerDefenseEngine(STAGES.stage_2);
    e.essence = 9999;
    const t = towerAt3(e, 'pad_3', 'bk_jar');
    e.unlockUltimate('pad_3');
    const a = e.spawnEnemy('bk_humid', 0, 1, { x: t.x + 20, y: t.y, waypointIndex: 2, distanceTraveled: 100 });
    const b = e.spawnEnemy('bk_humid', 1, 1, { x: t.x - 20, y: t.y, waypointIndex: 2, distanceTraveled: 100 });
    const far = e.spawnEnemy('bk_humid', 1, 1, { x: t.x + 300, y: t.y, waypointIndex: 2, distanceTraveled: 100 });
    expect(e.activateUltimate('pad_3')).toBe(true);
    expect(a.hp).toBeLessThan(a.maxHp);
    expect(b.hp).toBeLessThan(b.maxHp);
    expect(far.hp).toBe(far.maxHp);
    expect(e.activateUltimate('pad_3')).toBe(false);
    const ev = e.step(0.01);
    expect(ev.some((x) => x.type === 'ultimate')).toBe(true);
    for (let i = 0; i < Math.ceil(ULTIMATE_COOLDOWN_SEC / 0.5) + 1; i++) e.step(0.5);
    expect(e.canActivateUltimate('pad_3')).toBe(true);
  });

  it('Quạt (làm chậm) dùng tuyệt chiêu giữ chân cả con bay', () => {
    const e = new TowerDefenseEngine(STAGES.stage_2);
    e.essence = 9999;
    const t = towerAt3(e, 'pad_3', 'bk_fan');
    e.unlockUltimate('pad_3');
    const fly = e.spawnEnemy('bk_fly', 0, 1, { x: t.x + 10, y: t.y, waypointIndex: 2, distanceTraveled: 100 });
    e.activateUltimate('pad_3');
    expect(fly.stunRemaining).toBeGreaterThan(1.5);
  });
});

describe('Nâng cấp theo hành bằng sao', () => {
  it('tính điểm, tối đa 3 bậc / hành, không vượt số sao', () => {
    const save = { starsByStage: { stage_1: 3, stage_2: 1 } as const, metaLevels: {} };
    expect(totalStars(save)).toBe(4);
    let lv = tryRaise(save, 'hoa');
    lv = tryRaise({ ...save, metaLevels: lv }, 'hoa');
    lv = tryRaise({ ...save, metaLevels: lv }, 'hoa');
    lv = tryRaise({ ...save, metaLevels: lv }, 'hoa');
    expect(lv.hoa).toBe(META_MAX_LEVEL);
    lv = tryRaise({ ...save, metaLevels: lv }, 'thuy');
    lv = tryRaise({ ...save, metaLevels: lv }, 'thuy');
    expect(lv.thuy).toBe(1);
    expect(availablePoints({ ...save, metaLevels: lv })).toBe(0);
    expect(lower(lv, 'hoa').hoa).toBe(2);
  });

  it('engine cộng sức cho món đúng hành', () => {
    const plain = new TowerDefenseEngine(STAGES.stage_1);
    const boosted = new TowerDefenseEngine(STAGES.stage_1, { elementDamageBonus: metaDamageBonus({ moc: 2 }) });
    plain.buildTower('pad_1', 'wood_tower');
    boosted.buildTower('pad_1', 'wood_tower');
    expect(boosted.getTowerAtPad('pad_1')!.buffDamageMultiplier).toBeCloseTo(plain.getTowerAtPad('pad_1')!.buffDamageMultiplier * 1.12, 5);
  });

  it('lưu và đọc lại bậc nâng cấp', () => {
    const mem: Record<string, string> = {};
    const store = { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => { mem[k] = v; } };
    saveMetaLevels({ kim: 2 }, store);
    expect(loadTdSave(store).metaLevels?.kim).toBe(2);
  });
});
