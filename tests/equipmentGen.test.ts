import { describe, expect, it } from 'vitest';
import { computeEffectiveStats, computeScaledBaseStats, getElementResistFor } from '../src/core/combat';
import {
  RARITY_SPECS,
  computeEquipmentPowerScore,
  craftEquipment,
  createSeededRng,
  estimateCraftEquipment,
  generateEquipmentInstance,
  getEquipmentSellPrice,
  summarizeAffixes,
} from '../src/core/equipmentGen';
import { ITEMS } from '../src/core/inventory';
import { SECTS } from '../src/core/skills';

describe('Sinh chỉ số trang bị ngẫu nhiên (theo seed) & Ghép đồ', () => {
  it('tạo kết quả giống hệt nhau khi dùng cùng seed và khác nhau khi đổi seed', () => {
    const a1 = generateEquipmentInstance({
      baseItemId: 'wpn_mine_spear',
      itemLevel: 4,
      rarity: 'rare',
      seed: 20261122,
    });
    const a2 = generateEquipmentInstance({
      baseItemId: 'wpn_mine_spear',
      itemLevel: 4,
      rarity: 'rare',
      seed: 20261122,
    });
    const b = generateEquipmentInstance({
      baseItemId: 'wpn_mine_spear',
      itemLevel: 4,
      rarity: 'rare',
      seed: 99999999,
    });

    expect(a1).toEqual(a2);
    expect(a1.affixes).not.toEqual(b.affixes);
    expect(a1.slot).toBe('weapon');
  });

  it('sinh đúng 1–3 dòng chỉ số theo độ hiếm và không lặp loại chỉ số trên cùng một món', () => {
    for (const rarity of ['common', 'fine', 'rare', 'epic'] as const) {
      const spec = RARITY_SPECS[rarity];
      for (let seed = 100; seed < 120; seed++) {
        const inst = generateEquipmentInstance({
          baseItemId: 'arm_wood_weave',
          itemLevel: 5,
          rarity,
          seed,
        });
        expect(inst.affixes.length).toBeGreaterThanOrEqual(spec.minAffixes);
        expect(inst.affixes.length).toBeLessThanOrEqual(spec.maxAffixes);

        const uniqueTypes = new Set(inst.affixes.map((a) => a.type));
        expect(uniqueTypes.size).toBe(inst.affixes.length);

        for (const af of inst.affixes) {
          expect(af.value).toBeGreaterThan(0);
          if (af.type === 'elem_resist') {
            expect(af.element).toBeDefined();
          }
        }
      }
    }
  });

  it('độ hiếm cao hơn và cấp trang bị cao hơn cho tổng chỉ số và giá bán lớn hơn', () => {
    let commonSum = 0;
    let epicSum = 0;
    for (let s = 1; s <= 25; s++) {
      const c = generateEquipmentInstance({ baseItemId: 'wpn_mine_spear', itemLevel: 3, rarity: 'common', seed: s });
      const e = generateEquipmentInstance({ baseItemId: 'wpn_mine_spear', itemLevel: 5, rarity: 'epic', seed: s });
      commonSum += computeEquipmentPowerScore(c);
      epicSum += computeEquipmentPowerScore(e);
      expect(getEquipmentSellPrice(e)).toBeGreaterThan(getEquipmentSellPrice(c));
    }
    expect(epicSum).toBeGreaterThan(commonSum * 1.5);
  });

  it('cộng đầy đủ dòng chỉ số ngẫu nhiên vào chỉ số thực chiến của nhân vật', () => {
    const rolledWeapon = generateEquipmentInstance({
      baseItemId: 'wpn_mine_spear',
      itemLevel: 5,
      rarity: 'epic',
      seed: 424242,
    });
    const rolledArmor = generateEquipmentInstance({
      baseItemId: 'arm_bronze_mail',
      itemLevel: 5,
      rarity: 'rare',
      seed: 737373,
    });

    const scaled = computeScaledBaseStats(SECTS.sect_open.baseStats, 5);
    const baseOnly = computeEffectiveStats(
      scaled,
      { weapon: 'wpn_mine_spear', armor: 'arm_bronze_mail', charm: 'chm_hoa' },
      ITEMS,
    );
    const withRolled = computeEffectiveStats(
      scaled,
      { weapon: 'wpn_mine_spear', armor: 'arm_bronze_mail', charm: 'chm_hoa' },
      ITEMS,
      { weapon: rolledWeapon, armor: rolledArmor },
    );

    const sum = summarizeAffixes([...rolledWeapon.affixes, ...rolledArmor.affixes]);
    expect(withRolled.atk).toBe(baseOnly.atk + sum.atk);
    expect(withRolled.def).toBe(baseOnly.def + sum.def);
    expect(withRolled.maxHp).toBe(baseOnly.maxHp + sum.hp);
    expect(withRolled.moveSpeed).toBe(baseOnly.moveSpeed + sum.moveSpeed);
    expect(withRolled.critChanceBonus).toBe(sum.critChance);
    expect(withRolled.armorPierceBonus).toBe(sum.armorPierce);
    expect(withRolled.allyAtkBonus).toBe(sum.allyAtkBonus);
    expect(getElementResistFor(withRolled, 'hoa')).toBeGreaterThanOrEqual(0.25);
  });

  it('ghép 2 hoặc 3 món cùng loại thành món độ hiếm cao hơn, giữ phôi tốt nhất và trừ đúng tài nguyên', () => {
    const w1 = generateEquipmentInstance({ baseItemId: 'wpn_wood_staff', itemLevel: 2, rarity: 'common', seed: 11, uid: 'u1' });
    const w2 = generateEquipmentInstance({ baseItemId: 'wpn_mine_spear', itemLevel: 3, rarity: 'common', seed: 12, uid: 'u2' });
    const w3 = generateEquipmentInstance({ baseItemId: 'wpn_bronze_sword', itemLevel: 3, rarity: 'common', seed: 13, uid: 'u3' });

    const est2 = estimateCraftEquipment([w1, w2]);
    expect(est2.valid).toBe(true);
    expect(est2.targetRarity).toBe('fine');
    expect(est2.targetItemLevel).toBe(4);

    const forged2 = craftEquipment({
      inputs: [w1, w2],
      silver: 200,
      spiritStones: 5,
      seed: 555,
    });
    expect(forged2.success).toBe(true);
    expect(forged2.result).not.toBeNull();
    expect(forged2.result?.rarity).toBe('fine');
    expect(forged2.result?.baseItemId).toBe('wpn_mine_spear');
    expect(forged2.result?.itemLevel).toBe(4);
    expect(forged2.result?.crafted).toBe(true);
    expect(forged2.consumedUids).toEqual(['u1', 'u2']);
    expect(forged2.silver).toBe(200 - est2.silver);

    // Ghép 3 món cho cấp đồ +2 và lực chiến mạnh hơn phôi ban đầu
    const forged3 = craftEquipment({
      inputs: [w1, w2, w3],
      silver: 200,
      spiritStones: 5,
      seed: 777,
    });
    expect(forged3.success).toBe(true);
    expect(forged3.result?.itemLevel).toBe(5);
    expect(['fine', 'rare']).toContain(forged3.result?.rarity);
    expect(computeEquipmentPowerScore(forged3.result!)).toBeGreaterThan(computeEquipmentPowerScore(w1));
  });

  it('từ chối ghép nếu khác loại, trùng món, sai số lượng hoặc thiếu bạc / linh thạch', () => {
    const w1 = generateEquipmentInstance({ baseItemId: 'wpn_mine_spear', itemLevel: 3, rarity: 'fine', seed: 21, uid: 'w1' });
    const w2 = generateEquipmentInstance({ baseItemId: 'wpn_mine_spear', itemLevel: 3, rarity: 'fine', seed: 22, uid: 'w2' });
    const a1 = generateEquipmentInstance({ baseItemId: 'arm_wood_weave', itemLevel: 3, rarity: 'fine', seed: 23, uid: 'a1' });

    // Chỉ 1 món
    expect(craftEquipment({ inputs: [w1], silver: 500, spiritStones: 10, seed: 1 }).reason).toBe('invalid_count');
    // Khác loại vũ khí + giáp
    expect(craftEquipment({ inputs: [w1, a1], silver: 500, spiritStones: 10, seed: 1 }).reason).toBe('mismatched_slot');
    // Trùng uid
    expect(craftEquipment({ inputs: [w1, w1], silver: 500, spiritStones: 10, seed: 1 }).reason).toBe('duplicate_item');
    // Thiếu bạc
    expect(craftEquipment({ inputs: [w1, w2], silver: 10, spiritStones: 10, seed: 1 }).reason).toBe('insufficient_silver');
    // Thiếu linh thạch (ghép lên rare cần 1 linh thạch)
    expect(craftEquipment({ inputs: [w1, w2], silver: 500, spiritStones: 0, seed: 1 }).reason).toBe('insufficient_spirit_stones');

    // Kiểm tra RNG theo seed luôn trả về [0, 1)
    const rng = createSeededRng(123456);
    for (let i = 0; i < 50; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
