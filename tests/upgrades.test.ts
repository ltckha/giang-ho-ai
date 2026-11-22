import { describe, expect, it } from 'vitest';
import { activatedSlots, computeGearBonus, GEAR_SLOTS, gearDamageFor, isFullRing, makeGearItem, type Equipped } from '../src/core/equipment';
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

describe('Trang bị chủ tiệm 10 món + kích hoạt ngũ hành', () => {
  const mk = (slot: Parameters<typeof makeGearItem>[0], el: Parameters<typeof makeGearItem>[1], r: Parameters<typeof makeGearItem>[2] = 'thuong') =>
    makeGearItem(slot, el, r, `${slot}_${el}_${r}`);

  it('đủ 10 loại món, mỗi loại có đủ 5 hành', () => {
    expect(GEAR_SLOTS.length).toBe(10);
    expect(new Set(GEAR_SLOTS.map((s) => s.id)).size).toBe(10);
  });

  it('món ô trước sinh ra hành món ô sau thì món sau sáng dòng ẩn', () => {
    const eq: Equipped = { hat: mk('hat', 'moc'), glasses: mk('glasses', 'hoa'), jacket: mk('jacket', 'kim') };
    const act = activatedSlots(eq);
    expect(act.has('glasses')).toBe(true); // Mộc sinh Hỏa
    expect(act.has('jacket')).toBe(false); // Hỏa không sinh Kim
    expect(act.has('hat')).toBe(false); // ô trước (Ô dù) trống
  });

  it('xếp đủ vòng 10 món tương sinh → Ngũ hành viên mãn, có trần sức cộng', () => {
    const cycle = ['kim', 'thuy', 'moc', 'hoa', 'tho'] as const;
    const eq: Equipped = {};
    GEAR_SLOTS.forEach((s, i) => (eq[s.id] = mk(s.id, cycle[i % 5]!, 'quy')));
    expect(isFullRing(eq)).toBe(true);
    const b = computeGearBonus(eq);
    expect(b.fullRing).toBe(true);
    expect(b.activeCount).toBe(10);
    for (const el of cycle) expect(gearDamageFor(b, el)).toBeLessThanOrEqual(0.4 + 1e-9);
    expect(b.lives).toBeLessThanOrEqual(5);
  });

  it('engine áp trang bị: xu đầu màn, mạng, sức món cùng hành', () => {
    const eq: Equipped = { bag: mk('bag', 'tho'), umbrella: mk('umbrella', 'thuy'), hat: mk('hat', 'moc') };
    const b = computeGearBonus(eq);
    const plain = new TowerDefenseEngine(STAGES.stage_1);
    const geared = new TowerDefenseEngine(STAGES.stage_1, { gear: b });
    expect(geared.essence).toBe(plain.essence + b.startCoins);
    expect(geared.lives).toBe(plain.lives + b.lives);
    plain.buildTower('pad_1', 'wood_tower');
    geared.buildTower('pad_1', 'wood_tower');
    expect(geared.getTowerAtPad('pad_1')!.buffDamageMultiplier).toBeGreaterThan(plain.getTowerAtPad('pad_1')!.buffDamageMultiplier);
  });

  it('thắng màn rơi số món = số sao, lưu vào kho; mặc / cởi lưu lại được; người mới có bộ khởi đầu', () => {
    const mem: Record<string, string> = {};
    const store = { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => { mem[k] = v; } };
    const fresh = loadTdSave(store);
    expect(fresh.gearInventory?.length).toBe(2);
    expect(activatedSlots(getEquipped(fresh)).has('glasses')).toBe(true);
    let seed = 7;
    const rng = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296), seed / 4294967296);
    const drops = grantStageDrops(2, 3, store, rng);
    expect(drops.length).toBe(3);
    const saved = loadTdSave(store);
    expect(saved.gearInventory?.length).toBe(5);
    equipGear(drops[0]!.slot, drops[0]!.uid, store);
    expect(getEquipped(loadTdSave(store))[drops[0]!.slot]?.uid).toBe(drops[0]!.uid);
    equipGear(drops[0]!.slot, null, store);
    expect(getEquipped(loadTdSave(store))[drops[0]!.slot]).toBeUndefined();
  });
});
