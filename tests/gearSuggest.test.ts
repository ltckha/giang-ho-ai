import { describe, expect, it } from 'vitest';
import { bestEquip, BETTER_MIN, computeGearBonus, gearScore, itemScoreDelta, makeGearItem, slotsWithUpgrade, type Equipped } from '../src/core/equipment';

function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296), seed / 4294967296);
}

describe('Gợi ý mặc đồ', () => {
  it('món hàng hiệu mạnh hơn món thường cùng ô; đang mặc thì chênh 0', () => {
    const r = rng(7);
    const weak = makeGearItem('hat', 'moc', 'thuong', 'a', r);
    const strong = makeGearItem('hat', 'moc', 'hieu', 'b', r);
    const eq: Equipped = { hat: weak };
    expect(itemScoreDelta(eq, strong)).toBeGreaterThanOrEqual(BETTER_MIN);
    expect(itemScoreDelta(eq, weak)).toBe(0);
    expect(slotsWithUpgrade(eq, [weak, strong]).has('hat')).toBe(true);
  });
  it('mặc đồ tốt nhất không bao giờ làm bộ đồ yếu đi, và lấp ô trống', () => {
    const r = rng(11);
    const inv = (['hat', 'glasses', 'jacket', 'shoes'] as const).flatMap((sl, i) =>
      (['thuong', 'tot', 'xin'] as const).map((ra, j) => makeGearItem(sl, (['kim', 'moc', 'thuy', 'hoa', 'tho'] as const)[(i + j) % 5]!, ra, `${sl}${j}`, r)),
    );
    const start: Equipped = { hat: inv[0]! };
    const best = bestEquip(start, inv);
    expect(gearScore(computeGearBonus(best))).toBeGreaterThanOrEqual(gearScore(computeGearBonus(start)));
    expect(Object.keys(best).length).toBe(4);
    expect(slotsWithUpgrade(best, inv).size).toBe(0);
  });
});
