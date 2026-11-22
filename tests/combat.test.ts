import { describe, expect, it } from 'vitest';
import {
  applyExperience,
  calculateDamage,
  computeEffectiveStats,
  computeScaledBaseStats,
  resolveSkillElement,
  xpRequiredForLevel,
} from '../src/core/combat';
import { ITEMS } from '../src/core/inventory';
import { SECTS } from '../src/core/skills';

describe('Tính sát thương & lên cấp', () => {
  const noCritRng = () => 0.99;
  const alwaysCritRng = () => 0.0;

  it('tăng sát thương khi khắc hệ và giảm khi bị khắc hệ', () => {
    const neutral = calculateDamage({
      attackerAtk: 30,
      attackElement: 'moc',
      defenderDef: 10,
      defenderElement: 'moc',
      rng: noCritRng,
    });
    const counter = calculateDamage({
      attackerAtk: 30,
      attackElement: 'moc',
      defenderDef: 10,
      defenderElement: 'tho',
      rng: noCritRng,
    });
    const countered = calculateDamage({
      attackerAtk: 30,
      attackElement: 'moc',
      defenderDef: 10,
      defenderElement: 'kim',
      rng: noCritRng,
    });

    expect(counter.relation).toBe('counter');
    expect(countered.relation).toBe('countered');
    expect(counter.damage).toBeGreaterThan(neutral.damage);
    expect(countered.damage).toBeLessThan(neutral.damage);
  });

  it('xuyên giáp (armorPierce) làm tăng sát thương trước kẻ địch giáp cao', () => {
    const normal = calculateDamage({
      attackerAtk: 25,
      attackElement: 'kim',
      defenderDef: 30,
      defenderElement: 'thuy',
      armorPierce: 0,
      rng: noCritRng,
    });
    const pierced = calculateDamage({
      attackerAtk: 25,
      attackElement: 'kim',
      defenderDef: 30,
      defenderElement: 'thuy',
      armorPierce: 0.6,
      rng: noCritRng,
    });

    expect(pierced.damage).toBeGreaterThan(normal.damage);
  });

  it('kháng ngũ hành và khiên giảm sát thương hoạt động đúng, tối thiểu vẫn gây 1 sát thương', () => {
    const full = calculateDamage({
      attackerAtk: 40,
      attackElement: 'thuy',
      defenderDef: 10,
      defenderElement: 'hoa',
      rng: noCritRng,
    });
    const mitigated = calculateDamage({
      attackerAtk: 40,
      attackElement: 'thuy',
      defenderDef: 10,
      defenderElement: 'hoa',
      defenderElementResist: 0.28,
      defenderDamageReduction: 0.45,
      rng: noCritRng,
    });

    expect(mitigated.damage).toBeLessThan(full.damage);

    const floorHit = calculateDamage({
      attackerAtk: 5,
      attackElement: 'moc',
      defenderDef: 100,
      defenderElement: 'kim',
      defenderElementResist: 0.5,
      defenderDamageReduction: 0.75,
      rng: noCritRng,
    });
    expect(floorHit.damage).toBe(1);
  });

  it('chí mạng nhân 1.5 sát thương', () => {
    const normal = calculateDamage({
      attackerAtk: 30,
      attackElement: 'hoa',
      defenderDef: 10,
      defenderElement: 'hoa',
      critChance: 0.1,
      rng: noCritRng,
    });
    const crit = calculateDamage({
      attackerAtk: 30,
      attackElement: 'hoa',
      defenderDef: 10,
      defenderElement: 'hoa',
      critChance: 0.1,
      rng: alwaysCritRng,
    });

    expect(normal.isCrit).toBe(false);
    expect(crit.isCrit).toBe(true);
    expect(crit.damage).toBeGreaterThan(normal.damage);
  });

  it('lên nhiều cấp khi nhận lượng kinh nghiệm lớn và cộng chỉ số trang bị đúng', () => {
    const needL1 = xpRequiredForLevel(1);
    const needL2 = xpRequiredForLevel(2);
    const res = applyExperience({ level: 1, xp: 0 }, needL1 + needL2 + 10);

    expect(res.level).toBe(3);
    expect(res.levelsGained).toBe(2);
    expect(res.xp).toBe(10);

    const scaled = computeScaledBaseStats(SECTS.sect_closed.baseStats, 3);
    const effective = computeEffectiveStats(
      scaled,
      { weapon: 'wpn_blacksmith_blade', armor: 'arm_bronze_mail', charm: 'chm_thuy' },
      ITEMS,
    );

    expect(effective.atk).toBe(scaled.atk + 18);
    expect(effective.def).toBe(scaled.def + 13 + 4);
    expect(effective.maxHp).toBe(scaled.maxHp + 15 + 45);
    expect(effective.resistElement).toBe('thuy');
    expect(effective.resistBonus).toBe(0.28);
    expect(effective.imbueElement).toBe('thuy');
  });

  it('Ngọc Ngũ Hành đổi hệ Chiêu 1 giúp phái Mộc/Hỏa khắc chế linh hoạt hơn', () => {
    expect(resolveSkillElement(1, 'hoa', 'tho')).toBe('tho');
    expect(resolveSkillElement(2, 'hoa', 'tho')).toBe('hoa');
    expect(resolveSkillElement(1, 'moc', undefined)).toBe('moc');

    // Phổ Mộc Đường có nội tại bù trừ tăng công đồng đội & hồi máu cao hơn
    expect(SECTS.sect_open.allyPassiveAtkBonus).toBeGreaterThan(0);
    expect(SECTS.sect_open.baseStats.maxHp).toBeGreaterThan(SECTS.sect_closed.baseStats.maxHp);
  });

  it('cân bằng REVIEW_LOG #2: Hỏa Ấn Môn (bị Thủy khắc) ở cấp đề xuất 4 cùng 3 đồng đội AI vẫn hạ được Trùm Sơ Giác', () => {
    // Mô phỏng theo bước 0.5s: người chơi Hỏa Ấn Môn cấp 4, mặc Đao Rèn Lão Bính + Giáp Mộc Đan + Ngọc Thủy Mạch (thưởng NV phụ 2)
    // đồng hành cùng Thiết Xung (Hỏa), Mộc Tĩnh (Thổ - khắc Sơ Giác & hồi máu), Tích Linh (Thủy).
    const scaled = computeScaledBaseStats(SECTS.sect_ban.baseStats, 4);
    const stats = computeEffectiveStats(
      scaled,
      { weapon: 'wpn_blacksmith_blade', armor: 'arm_wood_weave', charm: 'chm_thuy' },
      ITEMS,
    );

    const boss = { hp: 560, maxHp: 560, atk: 29, def: 14, element: 'thuy' as const };
    let playerHp = stats.maxHp;
    const allies = [
      { id: 'ally_reckless', hp: 130, maxHp: 130, atk: 19, def: 8, element: 'hoa' as const, cd: 0, period: 0.9 },
      { id: 'ally_cautious', hp: 115, maxHp: 115, atk: 13, def: 12, element: 'tho' as const, cd: 0, period: 1.15, healCd: 0 },
      { id: 'ally_greedy', hp: 105, maxHp: 105, atk: 16, def: 9, element: 'thuy' as const, cd: 0, period: 0.85 },
    ];

    let playerSkill1Cd = 0;
    let playerSkill2Cd = 0;
    let playerSkill4Cd = 0;
    let potionsLeft = 2;
    let bossAttackCd = 0;

    for (let t = 0; t < 60 && boss.hp > 0 && playerHp > 0; t += 0.5) {
      playerSkill1Cd = Math.max(0, playerSkill1Cd - 0.5);
      playerSkill2Cd = Math.max(0, playerSkill2Cd - 0.5);
      playerSkill4Cd = Math.max(0, playerSkill4Cd - 0.5);
      bossAttackCd = Math.max(0, bossAttackCd - 0.5);

      // Người chơi xoay vòng chiêu (Chiêu 1 mang hệ Ngọc Thủy Mạch, Chiêu 2 & 4 hệ Hỏa)
      if (playerSkill4Cd <= 0) {
        const hit = calculateDamage({
          attackerAtk: stats.atk,
          attackElement: 'hoa',
          powerMultiplier: 2.4,
          defenderDef: boss.def,
          defenderElement: boss.element,
          rng: noCritRng,
        });
        boss.hp -= hit.damage;
        playerSkill4Cd = 10.5;
      } else if (playerSkill2Cd <= 0) {
        const hit = calculateDamage({
          attackerAtk: stats.atk,
          attackElement: 'hoa',
          powerMultiplier: 1.2,
          defenderDef: boss.def,
          defenderElement: boss.element,
          rng: noCritRng,
        });
        boss.hp -= hit.damage + 22; // kèm thiêu đốt
        playerSkill2Cd = 4.5;
      } else if (playerSkill1Cd <= 0) {
        const hit = calculateDamage({
          attackerAtk: stats.atk,
          attackElement: resolveSkillElement(1, 'hoa', stats.imbueElement),
          powerMultiplier: 1.0,
          defenderDef: boss.def,
          defenderElement: boss.element,
          rng: noCritRng,
        });
        boss.hp -= hit.damage;
        playerSkill1Cd = 0.5;
      }

      // 3 Đồng đội AI đánh & Mộc Tĩnh hồi máu
      for (const ally of allies) {
        if (ally.hp <= 0) continue;
        ally.cd = Math.max(0, ally.cd - 0.5);
        if (ally.healCd !== undefined) {
          ally.healCd = Math.max(0, ally.healCd - 0.5);
          if (ally.healCd <= 0 && playerHp < stats.maxHp * 0.6) {
            playerHp = Math.min(stats.maxHp, playerHp + 38);
            ally.healCd = 6.0;
            continue;
          }
        }
        if (ally.cd <= 0 && boss.hp > 0) {
          const hit = calculateDamage({
            attackerAtk: ally.atk,
            attackElement: ally.element,
            defenderDef: boss.def,
            defenderElement: boss.element,
            rng: noCritRng,
          });
          boss.hp -= hit.damage;
          ally.cd = ally.period;
        }
      }

      // Trùm phản công xen kẽ vào Thiết Xung (tiên phong) và người chơi
      if (boss.hp > 0 && bossAttackCd <= 0) {
        const targetReckless = allies[0].hp > 0 && Math.floor(t) % 2 === 0;
        if (targetReckless) {
          const hit = calculateDamage({
            attackerAtk: boss.atk,
            attackElement: boss.element,
            defenderDef: allies[0].def,
            defenderElement: allies[0].element,
            rng: noCritRng,
          });
          allies[0].hp -= hit.damage;
        } else {
          const hit = calculateDamage({
            attackerAtk: boss.atk,
            attackElement: boss.element,
            defenderDef: stats.def,
            defenderElement: 'hoa',
            defenderElementResist: stats.resistElement === 'thuy' ? stats.resistBonus : 0,
            rng: noCritRng,
          });
          playerHp -= hit.damage;
        }
        bossAttackCd = boss.hp < boss.maxHp * 0.5 ? 1.2 : 1.5;
      }

      // Người chơi uống bình linh dịch khi dưới 45% máu
      if (playerHp > 0 && playerHp < stats.maxHp * 0.45 && potionsLeft > 0) {
        playerHp = Math.min(stats.maxHp, playerHp + 65);
        potionsLeft -= 1;
      }
    }

    expect(boss.hp).toBeLessThanOrEqual(0);
    expect(playerHp).toBeGreaterThan(0);
  });
});
