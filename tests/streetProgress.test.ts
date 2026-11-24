import { describe, expect, it } from 'vitest';
import { createDefaultTdSave } from '../src/core/saveSystem';
import { isStreetStageUnlocked, streetProgress } from '../src/core/streetProgress';
import { REAL_STREET_SHOPS, REAL_STREET_STAGES } from '../src/core/tdDefinitions';
import type { StageId } from '../src/core/types';

describe('Phố thật: các màn tiệm rồi mới tới màn phố', () => {
  const street = REAL_STREET_STAGES[0]!;
  const shops = REAL_STREET_SHOPS[street.id]!;

  it('mỗi phố có 8–10 màn tiệm, đúng thứ tự, chơi trong phòng tiệm (không dùng đường phố)', () => {
    for (const st of REAL_STREET_STAGES) {
      const list = REAL_STREET_SHOPS[st.id]!;
      expect(list.length).toBeGreaterThanOrEqual(8);
      list.forEach((s, i) => { expect(s.shopIndex).toBe(i + 1); expect(s.mapStageId).toBeUndefined(); expect(s.roomStyle).toBeDefined(); expect(s.paths).not.toEqual(st.paths); expect(s.featuredTowerId).toBeDefined(); });
    }
  });

  it('chưa thắng trùm phố đầu thì phố thật còn khoá', () => {
    expect(isStreetStageUnlocked(createDefaultTdSave(), shops[0]!.id)).toBe(false);
  });

  it('mở lần lượt: tiệm 1 → tiệm 2 … → màn phố', () => {
    const save = createDefaultTdSave();
    save.badges = ['giu_tron_pho'];
    expect(isStreetStageUnlocked(save, shops[0]!.id)).toBe(true);
    expect(isStreetStageUnlocked(save, shops[1]!.id)).toBe(false);
    expect(isStreetStageUnlocked(save, street.id)).toBe(false);
    // giữ được nửa số tiệm (làm tròn lên) là mở trùm phố — anh Kha chốt 25/11
    const need = Math.ceil(shops.length / 2);
    shops.slice(0, need - 1).forEach((s) => (save.starsByStage[s.id as StageId] = 1));
    expect(isStreetStageUnlocked(save, street.id)).toBe(false);
    save.starsByStage[shops[need - 1]!.id as StageId] = 1;
    expect(isStreetStageUnlocked(save, street.id)).toBe(true);
    expect(streetProgress(save, street.id).nextStageId).toBe(street.id);
    expect(isStreetStageUnlocked(save, shops[need]!.id)).toBe(true);
  });
});
