import { describe, expect, it } from 'vitest';
import { rollWinDrops, makeGearItem } from '../src/core/equipment';

const rngOf = (seed: number) => {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296), s / 4294967296);
};
const RANK = { thuong: 0, tot: 1, xin: 2, hieu: 3 } as const;

describe('Rơi đồ "ít mà chất" (anh Kha 27/11)', () => {
  it('thắng lần đầu đúng 1 món; chơi lại khoảng 1/4 số lần có rơi', () => {
    const r = rngOf(7);
    expect(rollWinDrops({ stageNumber: 12, stars: 3, firstWin: true, boss: false }, r, 'a')).toHaveLength(1);
    let n = 0;
    for (let i = 0; i < 2000; i++) n += rollWinDrops({ stageNumber: 12, stars: 3, firstWin: false, boss: false }, r, `b${i}`).length;
    expect(n / 2000).toBeGreaterThan(0.2);
    expect(n / 2000).toBeLessThan(0.3);
  });

  it('trùm phố lần đầu tối thiểu Xịn; ★ Khó lần đầu tối thiểu Tốt và trung bình hạng cao hơn thường', () => {
    const r = rngOf(11);
    let normal = 0, hard = 0;
    for (let i = 0; i < 600; i++) {
      const b = rollWinDrops({ stageNumber: 19, stars: 1, firstWin: true, boss: true }, r, `c${i}`)[0]!;
      expect(RANK[b.rarity]).toBeGreaterThanOrEqual(2);
      const h = rollWinDrops({ stageNumber: 12, stars: 2, firstWin: true, boss: false, hard: true }, r, `h${i}`)[0]!;
      expect(RANK[h.rarity]).toBeGreaterThanOrEqual(1);
      hard += RANK[h.rarity];
      normal += RANK[rollWinDrops({ stageNumber: 12, stars: 2, firstWin: true, boss: false }, r, `n${i}`)[0]!.rarity];
    }
    expect(hard).toBeGreaterThan(normal);
  });

  it('món rơi ưu tiên ô đồ đang trống / yếu nhất', () => {
    const r = rngOf(3);
    const full = Object.fromEntries(
      (['hat', 'glasses', 'jacket', 'belt', 'shoes', 'bag', 'wallet', 'watch', 'phone'] as const).map((s, i) => [s, makeGearItem(s as never, 'kim', 'hieu', `e${i}`, r)]),
    );
    let hits = 0;
    for (let i = 0; i < 400; i++) {
      const d = rollWinDrops({ stageNumber: 12, stars: 2, firstWin: true, boss: false, equipped: full as never }, r, `w${i}`)[0]!;
      if (!(d.slot in full)) hits++;
    }
    expect(hits / 400).toBeGreaterThan(0.55);
  });
});
