/**
 * MÁY LÀM MÀN (Claude) — biến 1 file phố (content/streets/<id>.json) thành màn chơi đã cân độ khó.
 *
 * Chạy:  npm run make:street -- street_tang_bat_ho      (hoặc không đối số = làm hết các phố)
 * Đầu vào:
 *   - content/streets/<id>.json: tên phố, các địa điểm (món của từng nơi), bọn phá đồ, số đợt, mức độ khó
 *   - src/core/streets/realStreets.generated.json: đường đi + ô đặt món theo phố thật (tools/osm_street_to_stage.py)
 * Đầu ra:
 *   - src/core/streets/generated/<id>.json: màn chơi (đường, ô, đợt), món, quái, kế hoạch bot, hệ số độ khó
 *   - src/core/streets/generated/index.ts: danh sách màn sinh ra (game tự nạp)
 * Cân bằng: thử nhiều mức máu quái, chọn mức nhỏ nhất mà người có "đồ thực tế" ở giai đoạn đó
 * đặt kín ô bừa thắng ≤ targetRandomWin, đồng thời bot xếp tốt (có đồ) vẫn thắng.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { computeGearBonus, rollStageDrops, starterGear, makeGearItem, GEAR_SLOTS, type Equipped, type GearBonus } from '../../src/core/equipment';
import { ALL_ELEMENTS, ELEMENT_COUNTERS } from '../../src/core/elements';
import { ALL_ENEMY_DEFINITIONS, ALL_TOWER_DEFINITIONS, ENEMY_DEFINITIONS, TOWER_DEFINITIONS } from '../../src/core/tdDefinitions';
import { TowerDefenseEngine } from '../../src/core/tdEngine';
import type { ElementType, EnemyDefinition, EnemyTrait, StageDefinition, TowerDefinition, TowerRole, WaveDefinition } from '../../src/core/types';

const ROOT = process.cwd();
const GEO = JSON.parse(readFileSync(join(ROOT, 'src/core/streets/realStreets.generated.json'), 'utf8'));

interface PlaceSpec {
  key: string; name: string; type: string; trait: string; art?: string;
  tower: { element: ElementType; role: TowerRole; names: [string, string, string, string]; ult: string; why: string };
}
interface PestSpec { art?: string; name: string; element: ElementType; trait: Exclude<EnemyTrait, 'mini' | 'boss'>; reason: string }
interface StreetSpec {
  id: `street_${string}`; name: string; subtitle: string; geometry: string; waves: number;
  startingEssence: number; startingLives: number; loadoutSize: number;
  difficulty: { gearTier: 'none' | 'after_street_1'; targetRandomWin: number };
  places: PlaceSpec[]; pests: PestSpec[];
}

/* ---- Khuôn số liệu đã cân bằng (3 tiệm đầu) ---- */
const ROLE_TEMPLATE: Record<TowerRole, TowerDefinition> = {
  single_far: TOWER_DEFINITIONS.wood_tower,
  heavy_slow: TOWER_DEFINITIONS.metal_tower,
  slow_aura: TOWER_DEFINITIONS.water_tower,
  aoe_splash: TOWER_DEFINITIONS.fire_tower,
  support_buff: TOWER_DEFINITIONS.earth_tower,
};
const TRAIT_TEMPLATE: Record<string, EnemyDefinition> = {
  fast: ENEMY_DEFINITIONS.fast_metal,
  tank: ENEMY_DEFINITIONS.tank_earth,
  flying: ENEMY_DEFINITIONS.fly_wood,
  splitter: ENEMY_DEFINITIONS.split_fire,
  disruptor: ENEMY_DEFINITIONS.disrupt_water,
  healer: ENEMY_DEFINITIONS.healer_wood,
};
const TRAIT_LABEL: Record<string, string> = {
  fast: 'Nhanh, thành đàn', tank: 'Máu trâu, đi chậm', flying: 'Bay (không bị làm chậm)',
  splitter: 'Vỡ ra 2 con nhỏ', disruptor: 'Làm món gần nó đứng im', healer: 'Hồi máu cho quái gần',
};
const ELEMENT_LABEL: Record<ElementType, string> = { kim: 'Kim', moc: 'Mộc', thuy: 'Thủy', hoa: 'Hỏa', tho: 'Thổ' };
const HP_CURVE = [1.0, 1.15, 1.3, 1.45, 1.7, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0, 4.3, 4.6];

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function shortId(street: string) {
  return street.replace(/^street_/, '');
}

function buildTowers(spec: StreetSpec): Record<string, TowerDefinition> {
  const out: Record<string, TowerDefinition> = {};
  for (const p of spec.places) {
    const t = ROLE_TEMPLATE[p.tower.role];
    const id = `gt_${shortId(spec.id)}_${p.key}` as const;
    const [n1, n2, n3a, n3b] = p.tower.names;
    const khac = ELEMENT_LABEL[ELEMENT_COUNTERS[p.tower.element]];
    out[id] = {
      id,
      ...(p.art ? { art: p.art } : {}),
      element: p.tower.element,
      role: p.tower.role,
      roleLabel: t.roleLabel,
      ultimateName: p.tower.ult,
      tier1: { ...t.tier1, name: n1, description: `${p.name}: ${p.trait}. Khắc ${khac}: ${p.tower.why}.` },
      tier2: { ...t.tier2, name: n2, description: `${n2}: mạnh hơn, xa hơn.` },
      tier3A: { ...t.tier3A, name: n3a, description: t.tier3A.description },
      tier3B: { ...t.tier3B, name: n3b, description: t.tier3B.description },
    };
  }
  return out;
}

function buildEnemies(spec: StreetSpec): { enemies: Record<string, EnemyDefinition>; ids: string[] } {
  const enemies: Record<string, EnemyDefinition> = {};
  const ids: string[] = [];
  spec.pests.forEach((p, i) => {
    const base = TRAIT_TEMPLATE[p.trait]!;
    const id = `ge_${shortId(spec.id)}_${i + 1}` as const;
    const def: EnemyDefinition = { ...base, id, ...(p.art ? { art: p.art } : {}), name: p.name, element: p.element, trait: p.trait, traitLabel: TRAIT_LABEL[p.trait]! };
    if (p.trait === 'splitter') {
      const mini = ENEMY_DEFINITIONS.split_fire_mini;
      const miniId = `ge_${shortId(spec.id)}_${i + 1}_nho` as const;
      enemies[miniId] = { ...mini, id: miniId, ...(p.art ? { art: p.art } : {}), name: `${p.name} Nhỏ`, element: p.element, traitLabel: 'Tản ra chạy nhanh' };
      def.splitChildId = miniId;
    }
    enemies[id] = def;
    ids.push(id);
  });
  return { enemies, ids };
}

const COUNT: Record<string, (i: number) => number> = {
  fast: (i) => 6 + Math.floor(i / 2), tank: (i) => 2 + Math.floor(i / 3), flying: (i) => 4 + Math.floor(i / 3),
  splitter: (i) => 3 + Math.floor(i / 3), disruptor: (i) => 2 + Math.floor(i / 4), healer: (i) => 1 + Math.floor(i / 4),
};
const INTERVAL: Record<string, number> = { fast: 0.6, tank: 1.6, flying: 0.85, splitter: 1.2, disruptor: 1.8, healer: 2.0 };

function buildWaves(spec: StreetSpec, enemyIds: string[], enemies: Record<string, EnemyDefinition>, routes: number, k: number): WaveDefinition[] {
  const waves: WaveDefinition[] = [];
  // thứ tự giới thiệu quái: nhanh, trâu trước; bay, vỡ đôi; làm đứng im, hồi máu sau
  const order = ['fast', 'tank', 'flying', 'splitter', 'disruptor', 'healer'];
  const byTrait = (t: string) => enemyIds.filter((id) => enemies[id]!.trait === t);
  const intro = order.flatMap(byTrait);
  for (let i = 0; i < spec.waves; i++) {
    const unlocked = intro.slice(0, Math.min(intro.length, 2 + Math.floor(i * 0.6)));
    const nGroups = Math.min(unlocked.length, 2 + Math.floor(i / 4));
    const picks: string[] = [];
    for (let g = 0; g < nGroups; g++) picks.push(unlocked[(i + g * 2) % unlocked.length]!);
    const uniq = Array.from(new Set(picks));
    const last = i === spec.waves - 1;
    const list = last ? intro : uniq;
    const scale = Math.round((HP_CURVE[Math.min(i, HP_CURVE.length - 1)]! * k) * 100) / 100;
    waves.push({
      waveNumber: i + 1,
      title: last ? `Đợt ${i + 1}: Giờ cao điểm cả phố` : `Đợt ${i + 1}: ${list.map((id) => enemies[id]!.name).join(' & ')}`,
      mainElements: Array.from(new Set(list.map((id) => enemies[id]!.element))),
      earlyBonusMax: last ? 0 : 12 + i,
      clearReward: last ? 0 : 14 + Math.floor(i / 2),
      groups: list.map((id, g) => {
        const t = enemies[id]!.trait;
        return {
          enemyId: id as never,
          count: COUNT[t]!(i),
          intervalSec: INTERVAL[t]!,
          delayBeforeSec: g === 0 ? 0 : 0.4,
          pathIndex: (g + i) % routes,
          hpScale: scale,
        };
      }),
    });
  }
  return waves;
}

/** Chọn bộ món mang theo: ưu tiên món khắc được nhiều quái, đủ hành, có 1 hỗ trợ */
function chooseLoadout(towers: Record<string, TowerDefinition>, enemies: Record<string, EnemyDefinition>, size: number): string[] {
  const enemyEls = Object.values(enemies).filter((e) => e.trait !== 'mini').map((e) => e.element);
  const score = (t: TowerDefinition) => enemyEls.filter((el) => ELEMENT_COUNTERS[t.element] === el).length + (t.role === 'support_buff' ? 1.5 : 0);
  const list = Object.values(towers).sort((a, b) => score(b) - score(a));
  const chosen: TowerDefinition[] = [];
  for (const el of ALL_ELEMENTS) {
    const t = list.find((x) => x.element === el && !chosen.includes(x));
    if (t && chosen.length < size) chosen.push(t);
  }
  for (const t of list) if (chosen.length < size && !chosen.includes(t)) chosen.push(t);
  return chosen.map((t) => t.id);
}

function padCoverage(stage: StageDefinition, pad: { x: number; y: number }) {
  let c = 0;
  for (const path of stage.paths) for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]!, b = path[i + 1]!;
    for (let s = 0; s <= 10; s++) {
      const x = a.x + ((b.x - a.x) * s) / 10, y = a.y + ((b.y - a.y) * s) / 10;
      if (Math.hypot(x - pad.x, y - pad.y) <= 110) c++;
    }
  }
  return c;
}

function makeBotPlan(stage: StageDefinition, loadout: string[], towers: Record<string, TowerDefinition>) {
  const pads = [...stage.pads].sort((a, b) => padCoverage(stage, b) - padCoverage(stage, a));
  const attackers = loadout.filter((id) => towers[id]!.role !== 'support_buff');
  const support = loadout.find((id) => towers[id]!.role === 'support_buff');
  const plan: { padId: string; defId: string; preferredBranch: 'A' | 'B' }[] = [];
  pads.forEach((p, i) => {
    const defId = i === 2 && support ? support : attackers[i % attackers.length]!;
    plan.push({ padId: p.id, defId, preferredBranch: i % 2 === 0 ? 'A' : 'B' });
  });
  return plan;
}

/** Đồ "thực tế" theo giai đoạn: khởi đầu + đồ rơi các màn trước */
function expectedGear(tier: StreetSpec['difficulty']['gearTier'], seed: number): GearBonus | undefined {
  if (tier === 'none') return undefined;
  const r = rng(seed);
  const inv = [
    ...starterGear(),
    ...rollStageDrops(1, 2, r, 'a'), ...rollStageDrops(2, 2, r, 'b'), ...rollStageDrops(3, 2, r, 'c'), ...rollStageDrops(4, 2, r, 'd'),
    makeGearItem(GEAR_SLOTS[Math.floor(r() * 10)]!.id, ALL_ELEMENTS[Math.floor(r() * 5)]!, 'hieu', 'h', r),
  ];
  const eq: Equipped = {};
  for (const it of inv) if (!eq[it.slot]) eq[it.slot] = it;
  return computeGearBonus(eq);
}

function evaluate(stage: StageDefinition, loadout: string[], gearSeeds: number[], tier: StreetSpec['difficulty']['gearTier']) {
  let randomWins = 0, randomTotal = 0, botWins = 0, botLives = 0;
  for (const gs of gearSeeds) {
    const gear = expectedGear(tier, gs);
    const run = (policy: (e: TowerDefenseEngine) => void) => {
      const e = new TowerDefenseEngine(stage, { gear, loadout: loadout as never });
      let t = 0;
      while (e.status === 'playing' && t < 3600) {
        policy(e);
        if (!e.waveInProgress && e.canStartNextWave()) e.startNextWave(false);
        e.step(0.05); t += 0.05;
      }
      return e;
    };
    const pads = stage.pads.map((p) => p.id);
    // "Người chơi tính kỹ": đặt theo kế hoạch (ô phủ đường nhiều nhất trước, món khắc quái, có hỗ trợ), nâng dần
    const plan = stage.botPlan ?? [];
    const order = plan.map((x) => x.padId);
    const pm: Record<string, string> = {}; const pb: Record<string, 'A' | 'B'> = {};
    plan.forEach((x) => { pm[x.padId] = x.defId; pb[x.padId] = x.preferredBranch; });
    const b = run((en) => {
      let acted = true;
      while (acted) {
        acted = false;
        for (const p of order) { if (!en.getTowerAtPad(p)) { if (en.essence >= en.getBuildCost(pm[p] as never)) { en.buildTower(p, pm[p] as never); acted = true; } break; } }
        if (!acted) for (const p of order) { const tw = en.getTowerAtPad(p); if (tw && tw.tier < 3) { const nt = (tw.tier + 1) as 2 | 3; if (en.essence >= en.getUpgradeCost(tw.defId, nt, pb[p])) { en.upgradeTower(p, nt === 3 ? pb[p] : undefined); acted = true; } break; } }
      }
    });
    let bestLives = b.status === 'won' ? b.lives : 0;
    for (let s = 1; s <= 16; s++) {
      const r = rng(s * 31 + gs);
      const m: Record<string, string> = {}; const br: Record<string, 'A' | 'B'> = {};
      pads.forEach((p) => { m[p] = loadout[Math.floor(r() * loadout.length)]!; br[p] = r() < 0.5 ? 'A' : 'B'; });
      const e = run((en) => {
        let acted = true;
        while (acted) {
          acted = false;
          for (const p of pads) { if (!en.getTowerAtPad(p)) { if (en.essence >= en.getBuildCost(m[p] as never)) { en.buildTower(p, m[p] as never); acted = true; } break; } }
          if (!acted) for (const p of pads) { const tw = en.getTowerAtPad(p); if (tw && tw.tier < 3) { const nt = (tw.tier + 1) as 2 | 3; if (en.essence >= en.getUpgradeCost(tw.defId, nt, br[p])) { en.upgradeTower(p, nt === 3 ? br[p] : undefined); acted = true; } break; } }
        }
      });
      randomTotal++;
      if (e.status === 'won') { randomWins++; bestLives = Math.max(bestLives, e.lives); }
    }
    // "Người tính kỹ" = cách tốt nhất trong các cách đã thử (kế hoạch + 16 cách đặt)
    if (bestLives >= 6) { botWins++; botLives += bestLives; }
  }
  return { randomWin: randomWins / randomTotal, botWinRate: botWins / gearSeeds.length, botLives: botWins ? botLives / botWins : 0 };
}

function make(id: string) {
  const spec: StreetSpec = JSON.parse(readFileSync(join(ROOT, 'content/streets', `${id}.json`), 'utf8'));
  const geo = GEO[spec.geometry];
  if (!geo) throw new Error(`Chưa có đường đi cho ${spec.geometry} — chạy tools/osm_street_to_stage.py`);
  const towers = buildTowers(spec);
  const { enemies, ids } = buildEnemies(spec);
  Object.assign(ALL_TOWER_DEFINITIONS, towers);
  Object.assign(ALL_ENEMY_DEFINITIONS, enemies);
  const loadout = chooseLoadout(towers, enemies, spec.loadoutSize);

  const baseStage = (k: number): StageDefinition => {
    const stage: StageDefinition = {
      id: spec.id, stageNumber: 10, name: spec.name, subtitle: spec.subtitle,
      startingEssence: spec.startingEssence, startingLives: spec.startingLives,
      paths: geo.paths, pads: geo.pads,
      waves: buildWaves(spec, ids, enemies, geo.paths.length, k),
      towerIds: Object.keys(towers) as never, loadoutSize: spec.loadoutSize, defaultLoadout: loadout as never,
      enableSynergy: true, attribution: geo.attribution,
      places: spec.places.map((p) => ({ key: p.key, name: p.name, type: p.type, trait: p.trait, towerId: `gt_${shortId(spec.id)}_${p.key}` as never })),
    };
    stage.botPlan = makeBotPlan(stage, loadout, towers) as never;
    return stage;
  };

  const seeds = [1001, 2002, 3003];
  let chosenK = 0.8, report = evaluate(baseStage(0.8), loadout, seeds, spec.difficulty.gearTier);
  for (let k = 0.8; k <= 3.0001; k += 0.1) {
    const st = baseStage(Math.round(k * 100) / 100);
    const ev = evaluate(st, loadout, seeds, spec.difficulty.gearTier);
    console.log(`  thử máu ×${k.toFixed(1)}: đặt bừa thắng ${(ev.randomWin * 100).toFixed(0)}%, bot thắng ${(ev.botWinRate * 100).toFixed(0)}% (còn ${ev.botLives.toFixed(1)})`);
    if (ev.botWinRate < 1 || ev.botLives < 6) break; // khó quá: người tính kỹ bắt đầu thua / suýt thua → giữ mức trước
    chosenK = Math.round(k * 100) / 100; report = ev;
    if (ev.randomWin <= spec.difficulty.targetRandomWin) break;
  }
  const stage = baseStage(chosenK);
  const out = {
    generatedBy: 'tools/level-maker/make-street.ts',
    hpMultiplier: chosenK,
    balance: { randomWinWithExpectedGear: report.randomWin, botWinRate: report.botWinRate, botLivesAvg: report.botLives, gearTier: spec.difficulty.gearTier },
    stage, towers, enemies,
  };
  const dir = join(ROOT, 'src/core/streets/generated');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${id}.json`), JSON.stringify(out, null, 1));
  console.log(`✔ ${spec.name}: máu ×${chosenK}, đặt bừa thắng ${(report.randomWin * 100).toFixed(0)}%, bot còn ${report.botLives.toFixed(1)}/${spec.startingLives}`);
}

function writeIndex() {
  const dir = join(ROOT, 'src/core/streets/generated');
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
  const lines = [
    '/* Tạo tự động bởi tools/level-maker/make-street.ts — đừng sửa tay */',
    "import type { EnemyDefinition, StageDefinition, TowerDefinition } from '../../types';",
    ...files.map((f, i) => `import s${i} from './${f}';`),
    '',
    'export interface GeneratedStreet { hpMultiplier: number; stage: StageDefinition; towers: Record<string, TowerDefinition>; enemies: Record<string, EnemyDefinition> }',
    `export const GENERATED_STREETS: GeneratedStreet[] = [${files.map((_, i) => `s${i} as unknown as GeneratedStreet`).join(', ')}];`,
    '',
  ];
  writeFileSync(join(dir, 'index.ts'), lines.join('\n'));
}

const arg = process.argv[2];
const ids = arg ? [arg] : readdirSync(join(ROOT, 'content/streets')).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
for (const id of ids) { console.log(`Làm màn: ${id}`); make(id); }
writeIndex();
