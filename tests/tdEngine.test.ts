import { describe, expect, it } from 'vitest';
import { loadTdSave, saveTdProgress, TD_SAVE_KEY } from '../src/core/saveSystem';
import { runBotTurn } from '../src/core/tdBot';
import {
  calculateSellRefund,
  ENEMY_DEFINITIONS,
  getTowerTierStats,
  STAGE_1_DEFINITION,
  TOWER_DEFINITIONS,
} from '../src/core/tdDefinitions';
import { calculateStarRating, TowerDefenseEngine } from '../src/core/tdEngine';

describe('Thủ thành — Sát thương Ngũ Hành, Nâng cấp & Bán quân', () => {
  it('áp dụng đúng hệ số khắc 1.35x và bị khắc 0.75x khi quân bắn quái', () => {
    const engine = new TowerDefenseEngine(STAGE_1_DEFINITION);
    const woodTower = engine.buildTower('pad_1', 'wood_tower')!;
    expect(woodTower).not.toBeNull();

    const earthEnemy = engine.spawnEnemy('tank_earth', 0, 1);
    const metalEnemy = engine.spawnEnemy('fast_metal', 0, 1);
    const fireEnemy = engine.spawnEnemy('split_fire', 0, 1);

    // Mộc khắc Thổ (1.35x), bị Kim khắc (0.75x), trung tính với Hỏa (1.0x)
    const vsEarth = engine.computeHitDamage(woodTower, 100, earthEnemy);
    const vsMetal = engine.computeHitDamage(woodTower, 100, metalEnemy);
    const vsFire = engine.computeHitDamage(woodTower, 100, fireEnemy);

    expect(vsEarth.isCounter).toBe(true);
    expect(vsMetal.isCountered).toBe(true);
    expect(vsFire.isCounter).toBe(false);
    expect(vsFire.isCountered).toBe(false);

    // So sánh tỷ lệ sát thương sau khi tính giáp
    expect(vsEarth.damage).toBeGreaterThan(vsFire.damage);
    expect(vsMetal.damage).toBeLessThan(vsFire.damage);
  });

  it('nâng cấp đủ 3 bậc, chọn 1 trong 2 nhánh ở bậc 3 và bán hoàn đúng 70% linh thạch', () => {
    const engine = new TowerDefenseEngine(STAGE_1_DEFINITION);
    engine.essence = 500;

    const t1Cost = TOWER_DEFINITIONS.fire_tower.tier1.cost;
    const t2Cost = TOWER_DEFINITIONS.fire_tower.tier2.cost;
    const t3BCost = TOWER_DEFINITIONS.fire_tower.tier3B.cost;

    const tower = engine.buildTower('pad_1', 'fire_tower')!;
    expect(tower.tier).toBe(1);
    expect(tower.totalInvested).toBe(t1Cost);

    expect(engine.upgradeTower('pad_1')).toBe(true);
    expect(tower.tier).toBe(2);
    expect(tower.totalInvested).toBe(t1Cost + t2Cost);

    expect(engine.upgradeTower('pad_1', 'B')).toBe(true);
    expect(tower.tier).toBe(3);
    expect(tower.branch).toBe('B');
    const totalInvested = t1Cost + t2Cost + t3BCost;
    expect(tower.totalInvested).toBe(totalInvested);

    // Không thể nâng cấp quá bậc 3
    expect(engine.upgradeTower('pad_1', 'A')).toBe(false);

    const beforeSell = engine.essence;
    const refund = engine.sellTower('pad_1');
    expect(refund).toBe(calculateSellRefund(totalInvested));
    expect(engine.essence).toBe(beforeSell + refund);
    expect(engine.getTowerAtPad('pad_1')).toBeUndefined();
  });
});

describe('Thủ thành — Trạng thái Làm chậm, Quái bay, Chia đôi & Phá bùa', () => {
  it('quân Thủy làm chậm quái mặt đất nhưng quái bay (Phi Dực) bỏ qua làm chậm', () => {
    const engine = new TowerDefenseEngine(STAGE_1_DEFINITION);
    engine.essence = 500;
    const waterTower = engine.buildTower('pad_1', 'water_tower')!;

    // Đặt quái mặt đất và quái bay ngay cạnh trụ Thủy
    const groundEnemy = engine.spawnEnemy('fast_metal', 0, 1, {
      x: waterTower.x + 10,
      y: waterTower.y,
      waypointIndex: 1,
      distanceTraveled: 20,
    });
    const flyingEnemy = engine.spawnEnemy('fly_wood', 0, 1, {
      x: waterTower.x + 12,
      y: waterTower.y,
      waypointIndex: 1,
      distanceTraveled: 18,
    });

    engine.step(0.2);

    expect(groundEnemy.slowPercent).toBeGreaterThan(0);
    expect(groundEnemy.slowRemaining).toBeGreaterThan(0);
    expect(flyingEnemy.slowPercent).toBe(0);
  });

  it('quái Song Thể (Hỏa) chia đôi thành 2 Tiểu Hỏa Khôi khi bị tiêu diệt', () => {
    const engine = new TowerDefenseEngine(STAGE_1_DEFINITION);
    const splitter = engine.spawnEnemy('split_fire', 0, 1, {
      x: 100,
      y: 125,
      waypointIndex: 2,
      distanceTraveled: 120,
    });
    splitter.hp = 5;

    // Đặt trụ Thủy bắn kết liễu
    engine.buildTower('pad_1', 'water_tower');
    engine.step(0.2);

    const minis = engine.enemies.filter((e) => e.defId === 'split_fire_mini');
    expect(minis.length).toBe(2);
  });

  it('quái Phá Bùa khóa quân đứng gần và trụ Thổ giúp giảm/miễn nhiễm thời gian bị khóa', () => {
    const engine = new TowerDefenseEngine(STAGE_1_DEFINITION);
    engine.essence = 600;

    const attacker = engine.buildTower('pad_3', 'wood_tower')!;
    const disruptor = engine.spawnEnemy('disrupt_water', 0, 1, {
      x: attacker.x + 15,
      y: attacker.y,
      waypointIndex: 2,
      distanceTraveled: 50,
    });

    const interval = ENEMY_DEFINITIONS.disrupt_water.disruptIntervalSec!;
    disruptor.abilityTimer = interval - 0.05;
    engine.step(0.1);

    // Quân Mộc bị khóa không thể bắn
    expect(attacker.disruptedRemaining).toBeGreaterThan(2.0);

    // Đặt trụ Thổ cạnh bên và nâng lên 3A (Khu Ấn bảo hộ miễn nhiễm phá bùa)
    engine.buildTower('pad_4', 'earth_tower');
    engine.upgradeTower('pad_4');
    engine.upgradeTower('pad_4', 'A');

    // Với trụ Thổ 3A cạnh bên, thời gian khóa bị giải cực nhanh và lần phá bùa sau được miễn nhiễm
    engine.step(0.5);
    expect(attacker.disruptedRemaining).toBe(0);
    expect(attacker.protectedFromDisrupt).toBe(true);

    disruptor.abilityTimer = interval - 0.05;
    engine.step(0.1);
    expect(attacker.disruptedRemaining).toBe(0);
  });
});

describe('Thủ thành — Kinh tế Linh thạch & Cân bằng Màn 1', () => {
  it('tổng linh thạch Màn 1 nằm trong ngưỡng chặt chẽ (đủ thắng khi phối hợp nhưng không thừa mứa)', () => {
    let totalEnemyReward = 0;
    let totalClearReward = 0;

    for (const wave of STAGE_1_DEFINITION.waves) {
      totalClearReward += wave.clearReward;
      for (const grp of wave.groups) {
        const def = ENEMY_DEFINITIONS[grp.enemyId];
        let rewardPerUnit = def.reward;
        if (def.splitChildId && def.splitCount) {
          rewardPerUnit += ENEMY_DEFINITIONS[def.splitChildId].reward * def.splitCount;
        }
        totalEnemyReward += rewardPerUnit * grp.count;
      }
    }

    const totalStageEssence =
      STAGE_1_DEFINITION.startingEssence + totalEnemyReward + totalClearReward;

    // Chi phí nâng tối đa toàn bộ 9 ô lên bậc 3 là ~2100 linh thạch;
    // tổng linh thạch màn 1 (~1400-1750) chỉ đủ xây và nâng có chọn lọc (~65-78% số ô).
    const maxAllPadsTier3Cost =
      STAGE_1_DEFINITION.pads.length *
      (getTowerTierStats('fire_tower', 1).cost +
        getTowerTierStats('fire_tower', 2).cost +
        getTowerTierStats('fire_tower', 3, 'A').cost);

    expect(totalStageEssence).toBeGreaterThan(1100);
    expect(totalStageEssence).toBeLessThan(maxAllPadsTier3Cost * 0.85);
  });

  it('chơi ẩu (chỉ đặt 1 loại quân duy nhất hoặc đặt quá ít ở cuối đường) sẽ THUA Màn 1', () => {
    const engine = new TowerDefenseEngine(STAGE_1_DEFINITION);
    // Chỉ đặt 2 trụ Mộc bậc 1 ở cuối đường và không nâng cấp/phối hợp
    engine.buildTower('pad_8', 'wood_tower');
    engine.buildTower('pad_9', 'wood_tower');

    engine.startNextWave(false);
    let safetySteps = 0;
    while (engine.status === 'playing' && safetySteps < 20000) {
      if (!engine.waveInProgress && engine.canStartNextWave()) {
        engine.startNextWave(false);
      }
      engine.step(0.1);
      safetySteps += 1;
    }

    expect(engine.status).toBe('lost');
    expect(engine.lives).toBe(0);
  });

  it('bot phối hợp 5 hệ quân và nâng cấp hợp lý sẽ THẮNG Màn 1', () => {
    const engine = new TowerDefenseEngine(STAGE_1_DEFINITION);

    let safetySteps = 0;
    while (engine.status === 'playing' && safetySteps < 30000) {
      runBotTurn(engine);
      engine.step(0.1);
      safetySteps += 1;
    }

    expect(engine.status).toBe('won');
    expect(engine.lives).toBeGreaterThan(0);
    expect(calculateStarRating(engine.lives, engine.maxLives)).toBeGreaterThanOrEqual(1);
    // Kiểm tra linh thạch dư cuối màn không quá thừa thãi
    expect(engine.essence).toBeLessThan(450);
  });

  it('lưu tiến độ màn và số sao vào khoá localStorage mới riêng biệt', () => {
    const mem = new Map<string, string>();
    const fakeStorage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v);
      },
    };

    const initial = loadTdSave(fakeStorage);
    expect(initial.unlockedStage).toBe(1);

    saveTdProgress('stage_1', 3, 19, fakeStorage);
    expect(mem.has(TD_SAVE_KEY)).toBe(true);

    const loaded = loadTdSave(fakeStorage);
    expect(loaded.unlockedStage).toBe(2);
    expect(loaded.starsByStage.stage_1).toBe(3);
    expect(loaded.bestLivesByStage.stage_1).toBe(19);
  });
});
