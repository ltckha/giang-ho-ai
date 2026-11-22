import { getElementRelation } from './elements';
import {
  calculateSellRefund,
  ENEMY_DEFINITIONS,
  getTowerTierStats,
  TOWER_DEFINITIONS,
} from './tdDefinitions';
import type {
  ActiveEnemy,
  ActiveTower,
  CombatEvent,
  EnemyId,
  Point2D,
  StageDefinition,
  TowerBranch,
  TowerId,
} from './types';

interface PendingSpawn {
  enemyId: EnemyId;
  spawnAtSec: number;
  pathIndex: number;
  hpScale: number;
}

export function distance2D(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function calculateStarRating(livesRemaining: number, maxLives: number): 0 | 1 | 2 | 3 {
  if (livesRemaining <= 0) return 0;
  const ratio = livesRemaining / maxLives;
  if (ratio >= 0.85) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

export class TowerDefenseEngine {
  public readonly stage: StageDefinition;
  public essence: number;
  public lives: number;
  public readonly maxLives: number;
  public currentWaveIndex = -1; // -1 = chưa gọi đợt 1
  public waveInProgress = false;
  public waveTimerSec = 0;
  public nextWaveCountdownSec = 0;
  public status: 'playing' | 'won' | 'lost' = 'playing';
  public towers: ActiveTower[] = [];
  public enemies: ActiveEnemy[] = [];
  public pendingSpawns: PendingSpawn[] = [];
  private uidCounter = 1;

  constructor(stage: StageDefinition) {
    this.stage = stage;
    this.essence = stage.startingEssence;
    this.lives = stage.startingLives;
    this.maxLives = stage.startingLives;
  }

  private nextUid(prefix: string): string {
    const id = `${prefix}_${this.uidCounter}`;
    this.uidCounter += 1;
    return id;
  }

  public getCurrentWaveNumber(): number {
    return Math.max(0, this.currentWaveIndex + 1);
  }

  public getTotalWaves(): number {
    return this.stage.waves.length;
  }

  public getUpcomingWave() {
    const nextIdx = this.currentWaveIndex + 1;
    if (nextIdx >= this.stage.waves.length) return null;
    return this.stage.waves[nextIdx] ?? null;
  }

  public canStartNextWave(): boolean {
    if (this.status !== 'playing') return false;
    const nextIdx = this.currentWaveIndex + 1;
    if (nextIdx >= this.stage.waves.length) return false;
    if (!this.waveInProgress) return true;
    // Cho phép gọi đợt sớm khi tất cả quái của đợt hiện tại đã xuất hiện hết (hoặc sau 4s)
    return this.pendingSpawns.length === 0 || this.waveTimerSec >= 4.0;
  }

  public startNextWave(isEarlyCall = false): { started: boolean; bonusEssence: number; events: CombatEvent[] } {
    const events: CombatEvent[] = [];
    if (!this.canStartNextWave()) {
      return { started: false, bonusEssence: 0, events };
    }

    const nextIdx = this.currentWaveIndex + 1;
    const waveDef = this.stage.waves[nextIdx];
    if (!waveDef) {
      return { started: false, bonusEssence: 0, events };
    }

    let bonusEssence = 0;
    if (isEarlyCall && (this.waveInProgress || this.nextWaveCountdownSec > 0)) {
      const factor = this.waveInProgress
        ? 1.0
        : Math.min(1, Math.max(0.25, this.nextWaveCountdownSec / 8));
      bonusEssence = Math.max(4, Math.round(waveDef.earlyBonusMax * factor));
      this.essence += bonusEssence;
    }

    this.currentWaveIndex = nextIdx;
    this.waveInProgress = true;
    this.waveTimerSec = 0;
    this.nextWaveCountdownSec = 0;

    let timeCursor = 0;
    for (const group of waveDef.groups) {
      timeCursor += group.delayBeforeSec;
      for (let i = 0; i < group.count; i += 1) {
        const spawnTime = timeCursor + i * group.intervalSec;
        this.pendingSpawns.push({
          enemyId: group.enemyId,
          spawnAtSec: spawnTime,
          pathIndex: group.pathIndex,
          hpScale: group.hpScale ?? 1,
        });
      }
      timeCursor += group.count * group.intervalSec;
    }

    this.pendingSpawns.sort((a, b) => a.spawnAtSec - b.spawnAtSec);

    const startPoint = this.stage.paths[0]?.[0] ?? { x: 48, y: 24 };
    events.push({
      type: 'wave_start',
      x: startPoint.x,
      y: startPoint.y,
      reward: bonusEssence,
      text: waveDef.title,
    });

    return { started: true, bonusEssence, events };
  }

  public getTowerAtPad(padId: string): ActiveTower | undefined {
    return this.towers.find((t) => t.padId === padId);
  }

  public buildTower(padId: string, defId: TowerId): ActiveTower | null {
    if (this.status !== 'playing') return null;
    const pad = this.stage.pads.find((p) => p.id === padId);
    if (!pad) return null;
    if (this.getTowerAtPad(padId)) return null;

    const def = TOWER_DEFINITIONS[defId];
    const cost = def.tier1.cost;
    if (this.essence < cost) return null;

    this.essence -= cost;
    const tower: ActiveTower = {
      uid: this.nextUid('tower'),
      padId: pad.id,
      defId,
      element: def.element,
      x: pad.x,
      y: pad.y,
      tier: 1,
      totalInvested: cost,
      cooldownRemaining: 0.1,
      disruptedRemaining: 0,
      shotsFired: 0,
      buffDamageMultiplier: 1,
      buffSpeedMultiplier: 1,
      buffRangeMultiplier: 1,
      protectedFromDisrupt: false,
      bonusKillEssence: 0,
    };

    this.towers.push(tower);
    this.recalculateSupportBuffs();
    return tower;
  }

  public upgradeTower(padId: string, branch?: TowerBranch): boolean {
    if (this.status !== 'playing') return false;
    const tower = this.getTowerAtPad(padId);
    if (!tower) return false;
    if (tower.tier >= 3) return false;

    const nextTier = (tower.tier + 1) as 2 | 3;
    const chosenBranch: TowerBranch | undefined = nextTier === 3 ? (branch ?? 'A') : undefined;
    const stats = getTowerTierStats(tower.defId, nextTier, chosenBranch);

    if (this.essence < stats.cost) return false;
    this.essence -= stats.cost;
    tower.tier = nextTier;
    tower.branch = chosenBranch;
    tower.totalInvested += stats.cost;

    this.recalculateSupportBuffs();
    return true;
  }

  public sellTower(padId: string): number {
    if (this.status !== 'playing') return 0;
    const idx = this.towers.findIndex((t) => t.padId === padId);
    if (idx === -1) return 0;
    const [removed] = this.towers.splice(idx, 1);
    if (!removed) return 0;

    const refund = calculateSellRefund(removed.totalInvested);
    this.essence += refund;
    this.recalculateSupportBuffs();
    return refund;
  }

  public recalculateSupportBuffs(): void {
    // Ngũ Hành Tương Sinh Trận: khi người chơi phối hợp đủ 5 hệ quân trên sân và có Thổ Trấn Khôi ở tâm trận (pad_4),
    // toàn bộ quân nhận cộng hưởng Ngũ Hành (+34% công & +24% tốc đánh).
    const activeElements = new Set(this.towers.filter((t) => t.disruptedRemaining <= 0).map((t) => t.element));
    const hasCentralEarthAnchor = this.towers.some(
      (t) =>
        TOWER_DEFINITIONS[t.defId].role === 'support_buff' &&
        t.disruptedRemaining <= 0 &&
        t.padId === 'pad_4',
    );
    const fiveElementHarmony = activeElements.size >= 5 && hasCentralEarthAnchor;

    for (const tower of this.towers) {
      tower.buffDamageMultiplier = fiveElementHarmony ? 1.34 : 1;
      tower.buffSpeedMultiplier = fiveElementHarmony ? 1.24 : 1;
      tower.buffRangeMultiplier = 1;
      tower.protectedFromDisrupt = false;
      tower.bonusKillEssence = 0;
    }

    const supportTowers = this.towers.filter((t) => TOWER_DEFINITIONS[t.defId].role === 'support_buff');
    for (const sup of supportTowers) {
      if (sup.disruptedRemaining > 0) continue;
      const supStats = getTowerTierStats(sup.defId, sup.tier, sup.branch);
      const radius = supStats.range;

      for (const target of this.towers) {
        if (target.uid === sup.uid) continue;
        if (distance2D(sup, target) <= radius) {
          const harmonyDmg = fiveElementHarmony ? 0.34 : 0;
          const harmonySpd = fiveElementHarmony ? 0.24 : 0;
          target.buffDamageMultiplier = Math.max(
            target.buffDamageMultiplier,
            1 + (supStats.buffDamagePct ?? 0) + harmonyDmg,
          );
          target.buffSpeedMultiplier = Math.max(
            target.buffSpeedMultiplier,
            1 + (supStats.buffSpeedPct ?? 0) + harmonySpd,
          );
          target.buffRangeMultiplier = Math.max(
            target.buffRangeMultiplier,
            1 + (supStats.buffRangePct ?? 0),
          );
          if (sup.tier === 3 && sup.branch === 'A') {
            target.protectedFromDisrupt = true;
            target.bonusKillEssence = Math.max(target.bonusKillEssence, supStats.bonusKillReward ?? 0);
          }
        }
      }
    }
  }

  public spawnEnemy(
    enemyId: EnemyId,
    pathIndex = 0,
    hpScale = 1,
    overridePos?: { x: number; y: number; waypointIndex: number; distanceTraveled: number },
  ): ActiveEnemy {
    const def = ENEMY_DEFINITIONS[enemyId];
    const path = this.stage.paths[pathIndex] ?? this.stage.paths[0]!;
    const startPt = overridePos ? { x: overridePos.x, y: overridePos.y } : path[0]!;
    const maxHp = Math.max(1, Math.round(def.maxHp * hpScale));

    const enemy: ActiveEnemy = {
      uid: this.nextUid('enemy'),
      defId: enemyId,
      element: def.element,
      trait: def.trait,
      hp: maxHp,
      maxHp,
      baseSpeed: def.speed,
      armor: def.armor,
      reward: def.reward,
      lifeCost: def.lifeCost,
      flying: Boolean(def.flying),
      pathIndex,
      waypointIndex: overridePos ? overridePos.waypointIndex : 1,
      distanceTraveled: overridePos ? overridePos.distanceTraveled : 0,
      x: startPt.x,
      y: startPt.y,
      slowPercent: 0,
      slowRemaining: 0,
      stunRemaining: 0,
      burnDps: 0,
      burnRemaining: 0,
      armorDebuffPct: 0,
      abilityTimer: 0,
      shieldRemaining: 0,
      shieldTimer: 0,
      hitFlashRemaining: 0,
    };

    this.enemies.push(enemy);
    return enemy;
  }

  public step(dtSec: number): CombatEvent[] {
    const events: CombatEvent[] = [];
    if (this.status !== 'playing' || dtSec <= 0) return events;

    // Nếu đang đếm ngược giữa hai đợt thì giảm đồng hồ
    if (!this.waveInProgress && this.currentWaveIndex >= 0 && this.nextWaveCountdownSec > 0) {
      this.nextWaveCountdownSec = Math.max(0, this.nextWaveCountdownSec - dtSec);
      if (this.nextWaveCountdownSec === 0 && this.canStartNextWave()) {
        const res = this.startNextWave(false);
        events.push(...res.events);
      }
    }

    // 1. Sinh quái từ hàng đợi đợt hiện tại
    if (this.waveInProgress) {
      this.waveTimerSec += dtSec;
      while (this.pendingSpawns.length > 0 && this.pendingSpawns[0]!.spawnAtSec <= this.waveTimerSec) {
        const item = this.pendingSpawns.shift()!;
        this.spawnEnemy(item.enemyId, item.pathIndex, item.hpScale);
      }
    }

    // 2. Cập nhật trạng thái phá bùa trên các quân & trụ Thổ giải bùa
    for (const tower of this.towers) {
      if (tower.disruptedRemaining > 0) {
        // Nếu nằm gần trụ Thổ đang hoạt động thì tốc độ giải bùa nhanh gấp 2.4 lần
        let decayRate = 1.0;
        for (const sup of this.towers) {
          const supDef = TOWER_DEFINITIONS[sup.defId];
          if (supDef.role === 'support_buff' && sup.disruptedRemaining <= 0) {
            const supStats = getTowerTierStats(sup.defId, sup.tier, sup.branch);
            if (distance2D(sup, tower) <= supStats.range) {
              decayRate = sup.tier === 3 && sup.branch === 'A' ? 10.0 : 2.4;
              break;
            }
          }
        }
        tower.disruptedRemaining = Math.max(0, tower.disruptedRemaining - dtSec * decayRate);
      }
    }
    this.recalculateSupportBuffs();

    // 3. Cập nhật quái di chuyển, hiệu ứng đốt, kỹ năng quái (phá bùa / hồi máu / khiên trùm)
    const leakedIds = new Set<string>();
    const burnKilled: ActiveEnemy[] = [];

    for (const enemy of this.enemies) {
      if (enemy.hitFlashRemaining > 0) {
        enemy.hitFlashRemaining = Math.max(0, enemy.hitFlashRemaining - dtSec);
      }
      if (enemy.slowRemaining > 0) {
        enemy.slowRemaining = Math.max(0, enemy.slowRemaining - dtSec);
        if (enemy.slowRemaining === 0) {
          enemy.slowPercent = 0;
        }
      }
      if (enemy.stunRemaining > 0) {
        enemy.stunRemaining = Math.max(0, enemy.stunRemaining - dtSec);
      }
      if (enemy.shieldRemaining > 0) {
        enemy.shieldRemaining = Math.max(0, enemy.shieldRemaining - dtSec);
      }

      // Sát thương theo thời gian (đốt / gai độc)
      if (enemy.burnRemaining > 0 && enemy.burnDps > 0) {
        enemy.burnRemaining = Math.max(0, enemy.burnRemaining - dtSec);
        const dotDmg = enemy.burnDps * dtSec;
        enemy.hp -= dotDmg;
        if (enemy.hp <= 0) {
          burnKilled.push(enemy);
          continue;
        }
      }

      // Kỹ năng đặc biệt của quái
      const def = ENEMY_DEFINITIONS[enemy.defId];
      enemy.abilityTimer += dtSec;

      // Chuột gặm món gần nó hoặc Trùm Mùa Nồm phủ ẩm làm món đứng im
      if (def.disruptIntervalSec && def.disruptRadius && def.disruptDurationSec) {
        if (enemy.abilityTimer >= def.disruptIntervalSec) {
          enemy.abilityTimer = 0;
          for (const tower of this.towers) {
            if (distance2D(enemy, tower) <= def.disruptRadius) {
              if (tower.protectedFromDisrupt) {
                events.push({
                  type: 'cleanse',
                  x: tower.x,
                  y: tower.y,
                  towerUid: tower.uid,
                  towerDefId: tower.defId,
                  text: 'Sấy Khô!',
                });
              } else {
                tower.disruptedRemaining = Math.max(tower.disruptedRemaining, def.disruptDurationSec);
                events.push({
                  type: 'disrupt',
                  x: tower.x,
                  y: tower.y,
                  towerUid: tower.uid,
                  towerDefId: tower.defId,
                  text: 'Chuột Gặm!',
                });
              }
            }
          }
        }
      }

      // Nấm Mốc hồi máu cho bầy gần đó
      if (def.healIntervalSec && def.healRadius && def.healAmount) {
        if (enemy.abilityTimer >= def.healIntervalSec) {
          enemy.abilityTimer = 0;
          for (const ally of this.enemies) {
            if (ally.hp > 0 && ally.hp < ally.maxHp && distance2D(enemy, ally) <= def.healRadius) {
              ally.hp = Math.min(ally.maxHp, ally.hp + def.healAmount);
            }
          }
          events.push({
            type: 'heal',
            x: enemy.x,
            y: enemy.y,
            enemyUid: enemy.uid,
            enemyDefId: enemy.defId,
            text: `+${def.healAmount}`,
          });
        }
      }

      // Trùm Mùa Nồm tạo màn ẩm giảm sát thương
      if (def.shieldIntervalSec && def.shieldDurationSec) {
        enemy.shieldTimer += dtSec;
        if (enemy.shieldTimer >= def.shieldIntervalSec) {
          enemy.shieldTimer = 0;
          enemy.shieldRemaining = def.shieldDurationSec;
          events.push({
            type: 'shield',
            x: enemy.x,
            y: enemy.y,
            enemyUid: enemy.uid,
            enemyDefId: enemy.defId,
            text: 'Màn Ẩm Dày!',
          });
        }
      }

      // Di chuyển dọc đường
      if (enemy.stunRemaining <= 0) {
        const effectiveSlow = enemy.flying ? 0 : Math.min(0.75, enemy.slowPercent);
        const moveDist = enemy.baseSpeed * (1 - effectiveSlow) * dtSec;
        const reachedEnd = this.advanceEnemyAlongPath(enemy, moveDist);
        if (reachedEnd) {
          leakedIds.add(enemy.uid);
        }
      }
    }

    // Xử lý quái chết vì đốt
    for (const dead of burnKilled) {
      this.handleEnemyDeath(dead, undefined, events);
    }

    // Xử lý quái lọt vào thành
    if (leakedIds.size > 0) {
      const remaining: ActiveEnemy[] = [];
      for (const enemy of this.enemies) {
        if (leakedIds.has(enemy.uid)) {
          this.lives = Math.max(0, this.lives - enemy.lifeCost);
          events.push({
            type: 'leak',
            x: enemy.x,
            y: enemy.y,
            damage: enemy.lifeCost,
            enemyUid: enemy.uid,
          });
        } else {
          remaining.push(enemy);
        }
      }
      this.enemies = remaining;

      if (this.lives <= 0) {
        this.status = 'lost';
        events.push({
          type: 'stage_lose',
          x: 180,
          y: 240,
        });
        return events;
      }
    }

    // 4. Quân ngắm bắn quái
    for (const tower of this.towers) {
      if (tower.disruptedRemaining > 0) continue;

      const stats = getTowerTierStats(tower.defId, tower.tier, tower.branch);
      const effectiveCooldown = stats.cooldownSec / tower.buffSpeedMultiplier;
      tower.cooldownRemaining -= dtSec;

      if (tower.cooldownRemaining > 0) continue;

      const effectiveRange = stats.range * tower.buffRangeMultiplier;
      const target = this.findTargetForTower(tower, effectiveRange);
      if (!target) continue;

      tower.cooldownRemaining = effectiveCooldown;
      tower.shotsFired += 1;

      this.executeTowerAttack(tower, stats, target, events);
    }

    // 5. Kiểm tra kết thúc đợt hoặc thắng màn
    if (this.waveInProgress && this.pendingSpawns.length === 0 && this.enemies.length === 0) {
      this.waveInProgress = false;
      const currentWaveDef = this.stage.waves[this.currentWaveIndex];
      const clearReward = currentWaveDef?.clearReward ?? 20;
      this.essence += clearReward;

      events.push({
        type: 'wave_clear',
        x: 180,
        y: 220,
        reward: clearReward,
        text: `Sạch Đợt ${this.currentWaveIndex + 1}! +${clearReward} Xu`,
      });

      if (this.currentWaveIndex >= this.stage.waves.length - 1) {
        this.status = 'won';
        events.push({
          type: 'stage_win',
          x: 180,
          y: 240,
        });
      } else {
        this.nextWaveCountdownSec = 7.0;
      }
    }

    return events;
  }

  private advanceEnemyAlongPath(enemy: ActiveEnemy, distance: number): boolean {
    const path = this.stage.paths[enemy.pathIndex] ?? this.stage.paths[0]!;
    let remaining = distance;

    while (remaining > 0 && enemy.waypointIndex < path.length) {
      const targetPt = path[enemy.waypointIndex]!;
      const dx = targetPt.x - enemy.x;
      const dy = targetPt.y - enemy.y;
      const segDist = Math.hypot(dx, dy);

      if (segDist <= remaining) {
        enemy.x = targetPt.x;
        enemy.y = targetPt.y;
        enemy.distanceTraveled += segDist;
        remaining -= segDist;
        enemy.waypointIndex += 1;
      } else {
        const ratio = remaining / segDist;
        enemy.x += dx * ratio;
        enemy.y += dy * ratio;
        enemy.distanceTraveled += remaining;
        remaining = 0;
      }
    }

    return enemy.waypointIndex >= path.length;
  }

  private findTargetForTower(tower: ActiveTower, range: number): ActiveEnemy | null {
    const def = TOWER_DEFINITIONS[tower.defId];
    let best: ActiveEnemy | null = null;
    let bestScore = -Infinity;

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      if (distance2D(tower, enemy) > range) continue;

      const relation = getElementRelation(tower.element, enemy.element);
      // Ưu tiên mục tiêu bị khắc hệ đang tiến xa, giúp người chơi đặt quân khắc hệ phát huy tối đa
      const counterBonus = relation === 'counter' ? 180 : relation === 'countered' ? -90 : 0;

      const score =
        def.role === 'heavy_slow'
          ? enemy.maxHp * 0.4 + enemy.distanceTraveled + counterBonus
          : enemy.distanceTraveled + counterBonus;

      if (score > bestScore) {
        bestScore = score;
        best = enemy;
      }
    }

    return best;
  }

  private executeTowerAttack(
    tower: ActiveTower,
    stats: ReturnType<typeof getTowerTierStats>,
    primaryTarget: ActiveEnemy,
    events: CombatEvent[],
  ): void {
    events.push({
      type: 'shot',
      x: tower.x,
      y: tower.y,
      targetX: primaryTarget.x,
      targetY: primaryTarget.y,
      element: tower.element,
      towerUid: tower.uid,
      towerDefId: tower.defId,
      splashRadius: stats.splashRadius,
    });

    // Xác định danh sách mục tiêu bị trúng đòn (đánh đơn, đánh xuyên, hoặc đánh lan)
    let targets: ActiveEnemy[] = [primaryTarget];

    if (stats.splashRadius && stats.splashRadius > 0) {
      targets = this.enemies.filter(
        (e) => e.hp > 0 && distance2D(primaryTarget, e) <= stats.splashRadius!,
      );
    } else if (stats.pierceCount && stats.pierceCount > 1) {
      const others = this.enemies
        .filter((e) => e.hp > 0 && e.uid !== primaryTarget.uid && distance2D(primaryTarget, e) <= 68)
        .sort((a, b) => b.distanceTraveled - a.distanceTraveled)
        .slice(0, stats.pierceCount - 1);
      targets = [primaryTarget, ...others];
    }

    for (const enemy of targets) {
      this.applyDamageAndEffects(tower, stats, enemy, events);
    }
  }

  public computeHitDamage(
    tower: ActiveTower,
    baseDamage: number,
    enemy: ActiveEnemy,
  ): { damage: number; isCounter: boolean; isCountered: boolean } {
    const relation = getElementRelation(tower.element, enemy.element);
    // Trong thủ thành, tương khắc Ngũ Hành tạo chênh lệch rõ rệt (1.75x khi khắc, 0.5x khi bị khắc)
    const elemMult =
      relation === 'counter' ? 1.75 : relation === 'countered' ? 0.5 : 1.0;

    let armorIgnore = 0;
    if (relation === 'counter') {
      armorIgnore = 0.75;
    } else if (tower.defId === 'metal_tower') {
      armorIgnore = tower.tier === 1 ? 0.25 : tower.tier === 2 ? 0.4 : 0.55;
    }

    const rawArmor = Math.max(0, enemy.armor - enemy.armorDebuffPct);
    const effectiveArmor = rawArmor * (1 - armorIgnore);

    // Quái máu trâu (Cục Bùn - Thổ) và Tia nắng (Nắng Gắt - Hỏa) kháng mạnh đòn đánh không khắc hệ
    let traitResist = 1.0;
    if (enemy.trait === 'tank' && relation !== 'counter') {
      traitResist = 0.52;
    } else if (enemy.flying && relation !== 'counter') {
      traitResist = 0.65;
    }

    let damage =
      baseDamage *
      tower.buffDamageMultiplier *
      elemMult *
      (1 - effectiveArmor) *
      traitResist;

    if (enemy.shieldRemaining > 0) {
      const def = ENEMY_DEFINITIONS[enemy.defId];
      damage *= 1 - (def.shieldReductionPct ?? 0.5);
    }

    return {
      damage: Math.max(1, Math.round(damage)),
      isCounter: relation === 'counter',
      isCountered: relation === 'countered',
    };
  }

  private applyDamageAndEffects(
    tower: ActiveTower,
    stats: ReturnType<typeof getTowerTierStats>,
    enemy: ActiveEnemy,
    events: CombatEvent[],
  ): void {
    if (enemy.hp <= 0) return;

    const { damage, isCounter, isCountered } = this.computeHitDamage(tower, stats.damage, enemy);
    enemy.hp -= damage;
    enemy.hitFlashRemaining = 0.14;

    // Làm chậm (Xịt Dưỡng Da — Thủy) — Nắng Gắt không bị làm chậm
    if (stats.slowPercent && stats.slowDurationSec && !enemy.flying) {
      if (stats.slowPercent >= enemy.slowPercent) {
        enemy.slowPercent = stats.slowPercent;
      }
      enemy.slowRemaining = Math.max(enemy.slowRemaining, stats.slowDurationSec);
    }

    // Choáng / giữ chân
    if (stats.stunDurationSec) {
      const shouldStun =
        tower.defId === 'water_tower' ? tower.shotsFired % 3 === 0 : true;
      if (shouldStun && !enemy.flying) {
        enemy.stunRemaining = Math.max(enemy.stunRemaining, stats.stunDurationSec);
      }
    }

    // Đẩy lùi nhẹ (Xịt Vòi Xoáy)
    if (stats.knockbackDist && !enemy.flying && enemy.trait !== 'boss') {
      this.knockbackEnemy(enemy, stats.knockbackDist);
    }

    // Rút máu / hút khô (Thảm Hạt Hút Khô hoặc Dép Tông Gai Bám)
    if (stats.burnDps && stats.burnDurationSec) {
      enemy.burnDps = Math.max(enemy.burnDps, stats.burnDps);
      enemy.burnRemaining = Math.max(enemy.burnRemaining, stats.burnDurationSec);
      if (tower.defId === 'wood_tower' && tower.branch === 'B') {
        enemy.armorDebuffPct = Math.max(enemy.armorDebuffPct, 0.15);
      }
    }

    events.push({
      type: 'hit',
      x: enemy.x,
      y: enemy.y,
      element: tower.element,
      damage,
      isCounter,
      isCountered,
      enemyUid: enemy.uid,
      enemyDefId: enemy.defId,
      towerUid: tower.uid,
      towerDefId: tower.defId,
    });

    if (enemy.hp <= 0) {
      this.handleEnemyDeath(enemy, tower, events);
    }
  }

  private knockbackEnemy(enemy: ActiveEnemy, dist: number): void {
    const path = this.stage.paths[enemy.pathIndex] ?? this.stage.paths[0]!;
    const prevIdx = Math.max(0, enemy.waypointIndex - 1);
    const prevPt = path[prevIdx]!;
    const dx = prevPt.x - enemy.x;
    const dy = prevPt.y - enemy.y;
    const d = Math.hypot(dx, dy);
    if (d > 1) {
      const stepBack = Math.min(d, dist);
      enemy.x += (dx / d) * stepBack;
      enemy.y += (dy / d) * stepBack;
      enemy.distanceTraveled = Math.max(0, enemy.distanceTraveled - stepBack);
    }
  }

  private handleEnemyDeath(
    enemy: ActiveEnemy,
    killerTower: ActiveTower | undefined,
    events: CombatEvent[],
  ): void {
    const idx = this.enemies.findIndex((e) => e.uid === enemy.uid);
    if (idx === -1) return;
    this.enemies.splice(idx, 1);

    const bonus = killerTower?.bonusKillEssence ?? 0;
    const totalReward = enemy.reward + bonus;
    this.essence += totalReward;

    events.push({
      type: 'kill',
      x: enemy.x,
      y: enemy.y,
      element: enemy.element,
      reward: totalReward,
      enemyUid: enemy.uid,
      enemyDefId: enemy.defId,
    });

    // Nếu là Gián chia đôi khi chết thành 2 Gián Con
    const def = ENEMY_DEFINITIONS[enemy.defId];
    if (def.splitChildId && def.splitCount && def.splitCount > 0) {
      const hpScale = enemy.maxHp / def.maxHp;
      for (let i = 0; i < def.splitCount; i += 1) {
        const offset = (i === 0 ? -1 : 1) * 8;
        this.spawnEnemy(def.splitChildId, enemy.pathIndex, hpScale, {
          x: enemy.x + offset,
          y: enemy.y + offset * 0.5,
          waypointIndex: enemy.waypointIndex,
          distanceTraveled: enemy.distanceTraveled,
        });
      }
      events.push({
        type: 'split',
        x: enemy.x,
        y: enemy.y,
        element: enemy.element,
        enemyDefId: enemy.defId,
        text: 'Tách 2 Gián!',
      });
    }
  }
}
