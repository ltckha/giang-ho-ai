import atlasJson from '../public/assets/spark_atlas.json';
import { describe, expect, it } from 'vitest';
import { ALL_ENEMY_DEFINITIONS, ALL_TOWER_DEFINITIONS } from '../src/core/tdDefinitions';


const atlas = atlasJson as unknown as { frames: Record<string, unknown> };

describe('Hình Spark vẽ đã ghép đủ cho món / quái có dùng', () => {
  it('mỗi món có art đủ 4 bậc × 3 khung', () => {
    for (const d of Object.values(ALL_TOWER_DEFINITIONS)) {
      if (!d?.art) continue;
      for (const tk of ['t1', 't2', 't3a', 't3b']) for (const f of [0, 1, 2]) {
        expect(atlas.frames[`tower_art_${d.art}_${tk}_f${f}`], `${d.id} ${tk} f${f}`).toBeDefined();
      }
    }
  });
  it('mỗi quái có art đủ 4 khung đi', () => {
    for (const d of Object.values(ALL_ENEMY_DEFINITIONS)) {
      if (!d?.art) continue;
      for (const f of [0, 1, 2, 3]) expect(atlas.frames[`enemy_art_${d.art}_f${f}`], `${d.id} f${f}`).toBeDefined();
    }
  });
});
