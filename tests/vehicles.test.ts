import { describe, expect, it } from 'vitest';
import { createDefaultTdSave, saveTdProgress } from '../src/core/saveSystem';
import { STAGES, REAL_STREET_SHOPS } from '../src/core/tdDefinitions';
import { TowerDefenseEngine } from '../src/core/tdEngine';
import { stageGrantsVehicle, vehicleAppliesTo } from '../src/core/vehicles';
import type { StageId } from '../src/core/types';

function mem() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}

describe('Xe đi phố (không phải trang bị ngũ hành)', () => {
  it('chỉ có tác dụng khi ra phố', () => {
    expect(vehicleAppliesTo(STAGES.stage_1)).toBe(false);
    expect(vehicleAppliesTo(STAGES.stage_4)).toBe(true);
    const shop = REAL_STREET_SHOPS.street_tang_bat_ho![0]!;
    expect(vehicleAppliesTo(shop)).toBe(true);
  });

  it('tác dụng luôn bật: Jeep thêm 3 tim, ba gác thêm 30 xu vốn', () => {
    const st = STAGES.stage_4;
    const base = new TowerDefenseEngine(st);
    expect(new TowerDefenseEngine(st, { vehicle: 'xe_jeep' }).maxLives).toBe(base.maxLives + 3);
    expect(new TowerDefenseEngine(st, { vehicle: 'xe_ba_gac' }).essence).toBe(base.essence + 30);
  });

  it('chiêu xe chỉ dùng được 1 lần mỗi màn', () => {
    const e = new TowerDefenseEngine(STAGES.stage_4, { vehicle: 'xe_dap' });
    const before = e.essence;
    expect(e.useVehicle()).toBe(true);
    expect(e.essence).toBe(before + 40);
    expect(e.useVehicle()).toBe(false);
  });

  it('nhận xe khi thắng lần đầu Trận trùm phố, tiệm 5 và màn phố', () => {
    expect(stageGrantsVehicle(STAGES.stage_4)).toBe(true);
    const shops = REAL_STREET_SHOPS.street_tang_bat_ho!;
    expect(stageGrantsVehicle(shops[4]!)).toBe(true);
    expect(stageGrantsVehicle(shops[0]!)).toBe(false);
    const store = mem();
    store.setItem('x', '');
    const s1 = saveTdProgress('stage_4', 3, 20, store);
    expect(s1.vehicles).toContain('xe_dap');
    expect(s1.lastVehicleUnlocked).toBe('xe_dap');
    const s2 = saveTdProgress('stage_4', 3, 20, store);
    expect(s2.lastVehicleUnlocked).toBeUndefined();
    expect(createDefaultTdSave().vehicles ?? ['di_bo']).toEqual(['di_bo']);
    const s3 = saveTdProgress('street_tang_bat_ho' as StageId, 2, 15, store);
    expect(s3.vehicles).toContain('xe_so');
  });
});
