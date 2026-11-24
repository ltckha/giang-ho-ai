import { describe, expect, it } from 'vitest';
import { STAGES, REAL_STREET_STAGES } from '../src/core/tdDefinitions';
import { expectedGearForStage, pickBestPlan } from '../src/core/liveBot';
import { livePlaylist } from '../src/game/liveMode';

describe('Máy tự chơi LIVE', () => {
  it('danh sách màn LIVE có đủ Phố Dốc và các phố thật', () => {
    const list = livePlaylist();
    expect(list.slice(0, 4)).toEqual(['stage_1', 'stage_2', 'stage_3', 'stage_4']);
    for (const st of REAL_STREET_STAGES) expect(list).toContain(st.id);
    expect(new Set(list).size).toBe(list.length);
  });

  it.each(['stage_1', 'stage_4', 'street_tang_bat_ho_t3', 'street_tran_phu'])('máy thắng %s khi mặc đồ đúng giai đoạn', async (id) => {
    const def = STAGES[id as never];
    const c = await pickBestPlan(def, { gear: expectedGearForStage(id), loadout: def.defaultLoadout }, 12, async () => {});
    expect(c.expected.status).toBe('won');
  }, 60000);
});
