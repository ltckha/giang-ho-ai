import { describe, expect, it } from 'vitest';
import { activatedHiddenCount, computeGearBonus, EMPTY_GEAR_BONUS, GEAR_SLOTS, gearDamageFor, isFullRing, makeGearItem, migrateGearItem, supporterSlots, type Equipped, type GearRarity, type GearSlotId } from '../src/core/equipment';
import type { ElementType } from '../src/core/types';
import { equipGear, getEquipped, grantStageDrops, loadTdSave } from '../src/core/saveSystem';
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

describe('Trang bị chủ tiệm v2: 6 dòng, 2 món chống lưng, bộ đồ', () => {
  let seed = 3;
  const rng = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296), seed / 4294967296);
  const mk = (slot: GearSlotId, el: ElementType, r: GearRarity = 'xin') => makeGearItem(slot, el, r, `${slot}_${el}_${r}`, rng);
  const CYCLE: ElementType[] = ['kim', 'thuy', 'moc', 'hoa', 'tho'];
  const fullSet = (r: GearRarity = 'xin'): Equipped => {
    const eq: Equipped = {};
    GEAR_SLOTS.forEach((s, i) => (eq[s.id] = mk(s.id, CYCLE[i % 5]!, r)));
    return eq;
  };

  it('10 loại món hiện đại; hạng quyết định số dòng hiện / ẩn', () => {
    expect(GEAR_SLOTS.map((s) => s.label)).toContain('Điện thoại');
    const it1 = mk('phone', 'hoa', 'thuong');
    const it3 = mk('phone', 'hoa', 'xin');
    expect(it1.visible.length).toBe(1);
    expect(it1.hidden.length).toBe(1);
    expect(it3.visible.length).toBe(3);
    expect(it3.hidden.length).toBe(3);
    expect(mk('umbrella', 'thuy', 'hieu').name).toBe('Ô Dù Chống Bão Cấp 12');
  });

  it('mỗi ô có 2 món chống lưng: ô liền trước và ô cách 6 bước', () => {
    expect(supporterSlots('glasses')).toEqual(['hat', 'bag']);
  });

  it('1 món chống lưng sinh → sáng 1 dòng; 2 món sinh → sáng 2 dòng; dòng cuối cần đủ bộ ngũ hành', () => {
    const glasses = mk('glasses', 'hoa');
    const one: Equipped = { glasses, hat: mk('hat', 'moc') };
    expect(activatedHiddenCount(one).glasses).toBe(1);
    const two: Equipped = { glasses, hat: mk('hat', 'moc'), bag: mk('bag', 'moc') };
    expect(activatedHiddenCount(two).glasses).toBe(2);
    expect(isFullRing(two)).toBe(false);
    const full = fullSet();
    expect(isFullRing(full)).toBe(true);
    const c = activatedHiddenCount(full);
    for (const s of GEAR_SLOTS) expect(c[s.id]).toBe(3);
  });

  it('đủ bộ ngũ hành: thưởng viên mãn, mọi tác dụng nằm trong trần', () => {
    const b = computeGearBonus(fullSet('hieu'));
    expect(b.fullRing).toBe(true);
    expect(b.activeLines).toBe(30);
    for (const el of CYCLE) expect(gearDamageFor(b, el)).toBeLessThanOrEqual(0.4 + 1e-9);
    expect(b.lives).toBeLessThanOrEqual(5);
    expect(b.stats.sell_refund).toBeLessThanOrEqual(0.15 + 1e-9);
  });

  it('bộ đồ: mặc Áo Mưa + Dù Xanh → Bộ Đi Mưa (2 món) có thêm mạng', () => {
    const eq: Equipped = { jacket: mk('jacket', 'thuy', 'thuong'), umbrella: mk('umbrella', 'thuy', 'thuong') };
    const b = computeGearBonus(eq);
    expect(b.sets.some((s) => s.id === 'di_mua' && s.count === 2)).toBe(true);
    expect(b.lives).toBeGreaterThanOrEqual(1);
  });

  it('engine áp dòng vui: giảm giá đặt / nâng cấp, quái Thủy yếu đi, bán lại hoàn thêm', () => {
    const gear = { ...EMPTY_GEAR_BONUS, stats: { ...EMPTY_GEAR_BONUS.stats, build_discount: 0.1, upgrade_discount: 0.1, weaken_thuy: 0.2, sell_refund: 0.1 } };
    const plain = new TowerDefenseEngine(STAGES.stage_1);
    const g = new TowerDefenseEngine(STAGES.stage_1, { gear });
    expect(g.getBuildCost('wood_tower')).toBeLessThan(plain.getBuildCost('wood_tower'));
    expect(g.getUpgradeCost('wood_tower', 2)).toBeLessThan(plain.getUpgradeCost('wood_tower', 2));
    expect(g.spawnEnemy('fast_metal').maxHp).toBeLessThan(plain.spawnEnemy('fast_metal').maxHp);
    expect(g.getSellRefund(100)).toBe(80);
  });

  it('đồ bản cũ đổi sang bản mới không mất; thắng màn rơi đồ; mặc / cởi lưu lại', () => {
    expect(migrateGearItem({ uid: 'x', slot: 'hat', element: 'moc', rarity: 'quy', main: { kind: 'elem_dmg', value: 0.1 }, hidden: [] })?.visible.length).toBe(1);
    const mem: Record<string, string> = {};
    const store = { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => { mem[k] = v; } };
    const fresh = loadTdSave(store);
    expect(fresh.gearInventory?.length).toBe(2);
    expect(activatedHiddenCount(getEquipped(fresh)).glasses).toBe(1);
    const drops = grantStageDrops(2, 3, store, rng);
    expect(drops.length).toBeGreaterThanOrEqual(3);
    equipGear(drops[0]!.slot, drops[0]!.uid, store);
    expect(getEquipped(loadTdSave(store))[drops[0]!.slot]?.uid).toBe(drops[0]!.uid);
  });
});
