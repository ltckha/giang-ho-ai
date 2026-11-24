/**
 * Máy tự chơi cho chế độ LIVE (Claude).
 * Trước mỗi màn máy "chơi nháp" nhiều cách đặt món (engine không có ngẫu nhiên nên nháp ≈ thật),
 * chọn cách thắng còn nhiều máu nhất, rồi chơi thật với nhịp như người (mỗi lần nghĩ chỉ làm 1 việc).
 */
import type { TowerDefenseEngine } from './tdEngine';
import { TowerDefenseEngine as Engine, distance2D } from './tdEngine';
import { ALL_ENEMY_DEFINITIONS, ALL_TOWER_DEFINITIONS } from './tdDefinitions';
import { computeGearBonus, rollStageDrops, starterGear, makeGearItem, GEAR_SLOTS, type Equipped, type GearBonus } from './equipment';
import { ALL_ELEMENTS } from './elements';
import { STAGE_1_PLAN } from './tdBot';
import { STAGE_2_BOT_PLAN } from './shops/bakery';
import { STAGE_3_BOT_PLAN } from './shops/flower';
import { STAGE_4_BOT_PLAN } from './shops/streetBoss';

const FIXED_PLANS: Record<string, { padId: string; defId: TowerId; preferredBranch: TowerBranch }[]> = {
  stage_1: STAGE_1_PLAN,
  stage_2: STAGE_2_BOT_PLAN,
  stage_3: STAGE_3_BOT_PLAN,
  stage_4: STAGE_4_BOT_PLAN,
};
import type { StageDefinition, TowerBranch, TowerId } from './types';
import type { VehicleId } from './vehicles';

export interface LivePlan {
  order: string[];
  defs: Record<string, TowerId>;
  branch: Record<string, TowerBranch>;
}

export interface LiveAction {
  kind: 'build' | 'upgrade' | 'ult_unlock' | 'ult' | 'vehicle';
  padId?: string;
  defId?: TowerId;
}

export interface EngineOptions {
  gear?: GearBonus;
  loadout?: TowerId[];
  vehicle?: VehicleId;
}

/** Giây (trong game) giữa 2 lần máy "nghĩ" — như người bấm */
export let LIVE_THINK_SEC = 0.8;
export function setLiveThinkSec(s: number) { LIVE_THINK_SEC = s; }

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Bộ đồ "người chơi thật" có ở giai đoạn đó — đúng như lúc cân độ khó (tools/level-maker/make-street.ts, expectedGear).
 * Phố Dốc: đồ khởi đầu; phố thật: khởi đầu + đồ rơi 4 màn Phố Dốc + 1 món hiếm.
 */
export function expectedGearForStage(stageId: string, seed = 1001): GearBonus {
  let sd = seed;
  const r = () => {
    sd = (sd * 1664525 + 1013904223) % 4294967296;
    return sd / 4294967296;
  };
  const inv = stageId.startsWith('street_')
    ? [
        ...starterGear(),
        ...rollStageDrops(1, 2, r, 'a'), ...rollStageDrops(2, 2, r, 'b'), ...rollStageDrops(3, 2, r, 'c'), ...rollStageDrops(4, 2, r, 'd'),
        makeGearItem(GEAR_SLOTS[Math.floor(r() * 10)]!.id, ALL_ELEMENTS[Math.floor(r() * 5)]!, 'hieu', 'h', r),
      ]
    : starterGear();
  const eq: Equipped = {};
  for (const it of inv) if (!eq[it.slot]) eq[it.slot] = it;
  return computeGearBonus(eq);
}

function bossOnField(engine: TowerDefenseEngine): boolean {
  return engine.enemies.some((e) => e.hp > 0 && ALL_ENEMY_DEFINITIONS[e.defId]?.trait === 'boss');
}

/** Mỗi lần nghĩ: làm tối đa 1 việc (đặt / nâng / chiêu), luôn tự gọi đợt kế */
export function liveBotAct(engine: TowerDefenseEngine, plan: LivePlan): LiveAction | null {
  if (engine.status !== 'playing') return null;
  let action: LiveAction | null = null;

  // Chiêu xe: khi trùm ra sân hoặc máu còn ít
  if (engine.canUseVehicle() && (bossOnField(engine) || engine.lives <= engine.maxLives * 0.4)) {
    if (engine.useVehicle()) action = { kind: 'vehicle' };
  }

  // Tuyệt chiêu: dùng khi có ≥3 quái hoặc trùm trong tầm
  if (!action) {
    for (const t of engine.towers) {
      if (!engine.canActivateUltimate(t.padId)) continue;
      const near = engine.enemies.filter((e) => e.hp > 0 && distance2D(t, e) <= 130);
      const hasBoss = near.some((e) => ALL_ENEMY_DEFINITIONS[e.defId]?.trait === 'boss');
      if (near.length >= 3 || hasBoss) {
        if (engine.activateUltimate(t.padId)) {
          action = { kind: 'ult', padId: t.padId, defId: t.defId };
          break;
        }
      }
    }
  }

  if (!action) {
    // 1) Đặt món vào ô kế tiếp theo kế hoạch
    const nextEmpty = plan.order.find((p) => !engine.getTowerAtPad(p));
    if (nextEmpty) {
      const defId = plan.defs[nextEmpty]!;
      if (engine.essence >= engine.getBuildCost(defId) && engine.buildTower(nextEmpty, defId)) {
        action = { kind: 'build', padId: nextEmpty, defId };
      }
    } else {
      // 2) Nâng dần theo thứ tự
      for (const p of plan.order) {
        const tw = engine.getTowerAtPad(p);
        if (!tw || tw.tier >= 3) continue;
        const nt = (tw.tier + 1) as 2 | 3;
        if (engine.essence >= engine.getUpgradeCost(tw.defId, nt, plan.branch[p])) {
          if (engine.upgradeTower(p, nt === 3 ? plan.branch[p] : undefined)) action = { kind: 'upgrade', padId: p, defId: tw.defId };
        }
        break;
      }
      // 3) Đủ bậc 3 hết thì mở tuyệt chiêu
      if (!action) {
        for (const p of plan.order) {
          if (engine.canUnlockUltimate(p) && engine.unlockUltimate(p)) {
            action = { kind: 'ult_unlock', padId: p, defId: engine.getTowerAtPad(p)!.defId };
            break;
          }
        }
      }
    }
  }

  if (!engine.waveInProgress && engine.canStartNextWave()) engine.startNextWave(false);
  return action;
}

/** Chơi nháp 1 kế hoạch đến hết màn (không vẽ) */
export function simulatePlan(stage: StageDefinition, opts: EngineOptions, plan: LivePlan) {
  const e = new Engine(stage, opts);
  let t = 0;
  let nextThink = 0;
  while (e.status === 'playing' && t < 3600) {
    if (t >= nextThink) {
      liveBotAct(e, plan);
      nextThink = t + LIVE_THINK_SEC;
    }
    e.step(0.05);
    t += 0.05;
  }
  return { status: e.status, lives: e.lives, maxLives: e.maxLives, timeSec: t };
}

function padCoverage(stage: StageDefinition, pad: { x: number; y: number }): number {
  let c = 0;
  for (const path of stage.paths) for (const pt of path) if (Math.hypot(pt.x - pad.x, pt.y - pad.y) <= 110) c++;
  return c;
}

/** Các kế hoạch ứng viên: kế hoạch sẵn của màn + xếp ô theo độ phủ đường với món xoay vòng + vài cách ngẫu nhiên */
export function candidatePlans(stage: StageDefinition, loadout: TowerId[], tries = 24): LivePlan[] {
  const plans: LivePlan[] = [];
  const fixed = stage.botPlan?.length ? stage.botPlan : FIXED_PLANS[stage.id];
  if (fixed?.length) {
    const p: LivePlan = { order: [], defs: {}, branch: {} };
    for (const x of fixed) {
      if (!loadout.includes(x.defId)) continue;
      p.order.push(x.padId);
      p.defs[x.padId] = x.defId;
      p.branch[x.padId] = x.preferredBranch;
    }
    if (p.order.length) plans.push(p);
  }
  const byCover = [...stage.pads].sort((a, b) => padCoverage(stage, b) - padCoverage(stage, a)).map((p) => p.id);
  const attackers = loadout.filter((id) => ALL_TOWER_DEFINITIONS[id]?.role !== 'support_buff');
  const pool = attackers.length ? attackers : loadout;
  for (let s = 1; plans.length < tries; s++) {
    const r = rng(s * 7919 + stage.pads.length);
    const order = s % 3 === 0 ? [...byCover].sort(() => r() - 0.5) : byCover;
    const p: LivePlan = { order: [...order], defs: {}, branch: {} };
    const offset = Math.floor(r() * pool.length);
    order.forEach((pad, i) => {
      p.defs[pad] = s % 2 === 0 ? pool[(i + offset) % pool.length]! : loadout[Math.floor(r() * loadout.length)]!;
      p.branch[pad] = r() < 0.5 ? 'A' : 'B';
    });
    plans.push(p);
    if (s > tries * 3) break;
  }
  return plans;
}

export interface PlanChoice {
  plan: LivePlan;
  expected: { status: 'playing' | 'won' | 'lost'; lives: number; maxLives: number; timeSec: number };
}

/** Thử lần lượt (chia nhỏ để màn hình không đứng), trả kế hoạch tốt nhất */
export async function pickBestPlan(
  stage: StageDefinition,
  opts: EngineOptions,
  tries = 24,
  yieldFn: () => Promise<void> = () => new Promise((r) => setTimeout(r, 0)),
): Promise<PlanChoice> {
  const loadout = (opts.loadout ?? stage.towerIds ?? Object.keys(ALL_TOWER_DEFINITIONS)) as TowerId[];
  const engineLoadout = stage.loadoutSize ? loadout : (stage.towerIds as TowerId[] | undefined) ?? loadout;
  let best: PlanChoice | null = null;
  for (const plan of candidatePlans(stage, engineLoadout, tries)) {
    const res = simulatePlan(stage, opts, plan);
    const score = (res.status === 'won' ? 1000 : 0) + res.lives - (res.status === 'won' ? 0 : -res.timeSec / 100);
    const bestScore = best
      ? (best.expected.status === 'won' ? 1000 : 0) + best.expected.lives - (best.expected.status === 'won' ? 0 : -best.expected.timeSec / 100)
      : -Infinity;
    if (score > bestScore) best = { plan, expected: res };
    await yieldFn();
  }
  return best!;
}
