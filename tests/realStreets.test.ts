import { describe, expect, it } from 'vitest';
import { GENERATED_STREETS } from '../src/core/streets/generated';
import { ALL_ENEMY_DEFINITIONS, ALL_TOWER_DEFINITIONS, getStageTowerList, STAGES } from '../src/core/tdDefinitions';
import { TowerDefenseEngine } from '../src/core/tdEngine';

describe('Phố thật do máy làm màn sinh ra', () => {
  it('có đủ các phố thật', () => {
    const ids = GENERATED_STREETS.map((g) => g.stage.id).sort();
    expect(ids).toEqual(['street_cho_ben_thanh', 'street_phan_dinh_phung', 'street_pho_ca_phe', 'street_tang_bat_ho']);
  });

  for (const g of GENERATED_STREETS) {
    describe(g.stage.name, () => {
      it('đã nạp vào game: màn, món, quái', () => {
        expect(STAGES[g.stage.id]).toBeDefined();
        for (const id of Object.keys(g.towers)) expect(ALL_TOWER_DEFINITIONS[id as never]).toBeDefined();
        for (const id of Object.keys(g.enemies)) expect(ALL_ENEMY_DEFINITIONS[id as never]).toBeDefined();
      });

      it('8–10 địa điểm, món đủ 5 hành, mang theo 6 món, quái đủ 5 hành', () => {
        const st = g.stage;
        expect(st.places!.length).toBeGreaterThanOrEqual(8);
        expect(st.places!.length).toBeLessThanOrEqual(10);
        expect(new Set(Object.values(g.towers).map((t) => t.element)).size).toBe(5);
        expect(getStageTowerList(st).length).toBe(6);
        expect(Object.values(g.enemies).some((e) => e.trait === 'boss')).toBe(true);
        expect(new Set(Object.values(g.enemies).map((e) => e.element)).size).toBe(5);
      });

      it('độ khó đã cân: có đồ thực tế đặt bừa thắng ≤ 35%, người tính kỹ vẫn thắng', () => {
        const meta = g as unknown as { balance: { randomWinWithExpectedGear: number; botWinRate: number } };
        expect(meta.balance.randomWinWithExpectedGear).toBeLessThanOrEqual(0.35);
        for (const sh of g.shops) {
          expect(sh.balance.botWinRate).toBe(1);
          expect(sh.balance.randomWinWithExpectedGear).toBeLessThanOrEqual(0.85);
        }
        expect(meta.balance.botWinRate).toBe(1);
      });

      it('đường đi theo phố thật nằm gọn trong khung, ô không đè lên đường', () => {
        const st = g.stage;
        for (const path of st.paths) for (const p of path) {
          expect(p.x).toBeGreaterThanOrEqual(0); expect(p.x).toBeLessThanOrEqual(360);
          expect(p.y).toBeGreaterThanOrEqual(0); expect(p.y).toBeLessThanOrEqual(520);
        }
        const e = new TowerDefenseEngine(st);
        expect(e.buildTower(st.pads[0]!.id, st.defaultLoadout![0]!)).not.toBeNull();
      });
    });
  }
});

describe('Màn phố dùng đồ dọn phố', () => {
  it('mỗi màn phố có 5 đồ dọn phố đủ 5 hành, bộ gợi ý 4 đồ dọn + tối đa 2 món tiệm', () => {
    for (const g of GENERATED_STREETS) {
      const st = g.stage;
      expect(st.cleanTowerIds?.length).toBe(5);
      expect(new Set(st.cleanTowerIds!.map((id) => ALL_TOWER_DEFINITIONS[id]!.element)).size).toBe(5);
      const shop = st.defaultLoadout!.filter((id) => !st.cleanTowerIds!.includes(id));
      expect(shop.length).toBeLessThanOrEqual(st.maxShopTowers!);
    }
  });
  it('mang quá 2 món tiệm thì máy đổi về bộ gợi ý', () => {
    const st = GENERATED_STREETS[0]!.stage;
    const shopIds = st.towerIds!.filter((id) => !st.cleanTowerIds!.includes(id)).slice(0, 6);
    const e = new TowerDefenseEngine(st, { loadout: shopIds });
    expect(e.loadout).toEqual(st.defaultLoadout);
  });
});
