import { describe, expect, it } from 'vitest';
import { REAL_STREET_SHOPS, REAL_STREET_STAGES, STAGES } from '../src/core/tdDefinitions';
import { EMPTY_GEAR_BONUS } from '../src/core/equipment';
import { applyRoomPerk, roomPerkOf } from '../src/core/roomPerks';
import { TowerDefenseEngine } from '../src/core/tdEngine';

const shops = REAL_STREET_STAGES.flatMap((st) => REAL_STREET_SHOPS[st.id] ?? []);

describe('Nét riêng theo loại tiệm', () => {
  it('mọi màn tiệm có lợi thế; màn phố / Phố Dốc thì không', () => {
    for (const s of shops) expect(roomPerkOf(s)).not.toBeNull();
    expect(roomPerkOf(STAGES.stage_1)).toBeNull();
    expect(roomPerkOf(REAL_STREET_STAGES[0]!)).toBeNull();
  });
  it('khách quen: +25 xu đầu màn; ngày giảm giá: đặt món rẻ hơn', () => {
    const inn = shops.find((s) => s.roomStyle === 'luu_tru')!;
    const base = new TowerDefenseEngine(inn);
    const perk = new TowerDefenseEngine(inn, { gear: applyRoomPerk(EMPTY_GEAR_BONUS, inn) });
    expect(perk.essence - base.essence).toBe(25);
    const shop = shops.find((s) => s.roomStyle === 'tiem')!;
    const t = shop.towerIds![0]!;
    const b2 = new TowerDefenseEngine(shop);
    const p2 = new TowerDefenseEngine(shop, { gear: applyRoomPerk(EMPTY_GEAR_BONUS, shop) });
    expect(p2.getBuildCost(t)).toBeLessThan(b2.getBuildCost(t));
  });
  it('không đổi bản phần thưởng gốc', () => {
    const food = shops.find((s) => s.roomStyle === 'quan_an')!;
    applyRoomPerk(EMPTY_GEAR_BONUS, food);
    expect(EMPTY_GEAR_BONUS.elementDmg.hoa).toBeUndefined();
  });
});
