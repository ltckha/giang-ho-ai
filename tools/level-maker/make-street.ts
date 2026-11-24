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
import { STREET_BOSS_ENEMIES } from '../../src/core/shops/streetBoss';
import { TowerDefenseEngine } from '../../src/core/tdEngine';
import type { ElementType, EnemyDefinition, EnemyTrait, StageDefinition, TowerDefinition, TowerRole, WaveDefinition } from '../../src/core/types';

const ROOT = process.cwd();
/** Món người chơi đã có sau Phố 1 (3 tiệm đầu) — dùng chung cho mọi phố thật */
const BASE_POOL = Object.keys(ALL_TOWER_DEFINITIONS).filter((id) => !id.startsWith('gt_')) as string[];
/** Đồ dọn phố (màn phố) — content/street_clean_tools.json */
const CLEAN = JSON.parse(readFileSync(join(ROOT, 'content/street_clean_tools.json'), 'utf8')) as { tools: { key: string; art: string; element: ElementType; role: TowerRole; names: [string, string, string, string]; ult: string; why: string }[] };
function buildCleanTowers(): Record<string, TowerDefinition> {
  return buildTowers({ id: 'street_don', places: CLEAN.tools.map((t) => ({ key: t.key, art: t.art, name: t.names[0], type: 'Đồ dọn phố', trait: t.why.toLowerCase(), tower: { element: t.element, role: t.role, names: t.names, ult: t.ult, why: t.why } })) } as unknown as StreetSpec);
}
const GEO = JSON.parse(readFileSync(join(ROOT, 'src/core/streets/realStreets.generated.json'), 'utf8'));
/** Bố cục phòng trong tiệm (tools/level-maker/make_rooms.py) — màn tiệm chơi bên trong tiệm */
const ROOMS = JSON.parse(readFileSync(join(ROOT, 'src/core/streets/rooms.generated.json'), 'utf8')) as { id: string; paths: { x: number; y: number }[][]; pads: { id: string; x: number; y: number }[] }[];
/** Kiểu nội thất theo loại địa điểm */
function roomStyleOf(type: string, name: string): 'luu_tru' | 'quan_an' | 'cafe' | 'tiem' {
  const t = `${type} ${name}`.toLowerCase();
  if (/khách sạn|homestay|hostel|nhà nghỉ/.test(t)) return 'luu_tru';
  if (/cà phê|trà|kem|chè|yaourt|sữa/.test(t)) return 'cafe';
  if (/quán|lẩu|phở|cơm|bánh căn|bánh mì|cháo|nướng|pizza|bánh tráng|ăn/.test(t)) return 'quan_an';
  return 'tiem';
}

interface PlaceSpec {
  key: string; name: string; type: string; trait: string; art?: string;
  /** Nghiên cứu: link nguồn (≥ 2) và mức tin cậy */
  sources?: string[]; confidence?: 'chac' | 'nen_kiem' | 'da_dong';
  tower: { element: ElementType; role: TowerRole; names: [string, string, string, string]; ult: string; why: string };
}
interface PestSpec { art?: string; name: string; element: ElementType; trait: Exclude<EnemyTrait, 'mini' | 'boss'>; reason: string }
interface StreetSpec {
  id: `street_${string}`; name: string; subtitle: string; geometry: string; waves: number;
  startingEssence: number; startingLives: number; loadoutSize: number;
  difficulty: { gearTier: 'none' | 'after_street_1'; targetRandomWin: number };
  places: PlaceSpec[]; pests: PestSpec[];
  /** Trùm phố (màn phố) — đổi hành theo máu, gọi quân của phố */
  boss?: { name: string; art?: string; phases: ElementType[] };
  /** Quái của màn phố: chuyện ngoài đường (rác, bụi, nước đọng, khói xe…), khác quái trong tiệm */
  streetPests?: PestSpec[];
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

function buildEnemies(spec: StreetSpec, list: PestSpec[] = spec.pests, tag = ''): { enemies: Record<string, EnemyDefinition>; ids: string[] } {
  const enemies: Record<string, EnemyDefinition> = {};
  const ids: string[] = [];
  list.forEach((p, i) => {
    const base = TRAIT_TEMPLATE[p.trait]!;
    const id = `ge_${shortId(spec.id)}_${tag}${i + 1}` as const;
    const def: EnemyDefinition = { ...base, id, ...(p.art ? { art: p.art } : {}), name: p.name, element: p.element, trait: p.trait, traitLabel: TRAIT_LABEL[p.trait]! };
    if (p.trait === 'splitter') {
      const mini = ENEMY_DEFINITIONS.split_fire_mini;
      const miniId = `ge_${shortId(spec.id)}_${tag}${i + 1}_nho` as const;
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

function buildWaves(spec: StreetSpec, enemyIds: string[], enemies: Record<string, EnemyDefinition>, routes: number, k: number, waveCount = spec.waves, bossId?: string): WaveDefinition[] {
  const waves: WaveDefinition[] = [];
  // thứ tự giới thiệu quái: nhanh, trâu trước; bay, vỡ đôi; làm đứng im, hồi máu sau
  const order = ['fast', 'tank', 'flying', 'splitter', 'disruptor', 'healer'];
  const byTrait = (t: string) => enemyIds.filter((id) => enemies[id]!.trait === t);
  const intro = order.flatMap(byTrait);
  for (let i = 0; i < waveCount; i++) {
    const unlocked = intro.slice(0, Math.min(intro.length, 2 + Math.floor(i * 0.6)));
    const nGroups = Math.min(unlocked.length, 2 + Math.floor(i / 4));
    const picks: string[] = [];
    for (let g = 0; g < nGroups; g++) picks.push(unlocked[(i + g * 2) % unlocked.length]!);
    const uniq = Array.from(new Set(picks));
    const last = i === waveCount - 1;
    const list = last ? intro : uniq;
    const scale = Math.round((HP_CURVE[Math.min(i, HP_CURVE.length - 1)]! * k) * 100) / 100;
    waves.push({
      waveNumber: i + 1,
      title: last && bossId ? `Đợt ${i + 1}: ${enemies[bossId]!.name} ập tới` : last ? `Đợt ${i + 1}: Giờ cao điểm cả phố` : `Đợt ${i + 1}: ${list.map((id) => enemies[id]!.name).join(' & ')}`,
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
      }).concat(last && bossId ? [{ enemyId: bossId as never, count: 1, intervalSec: 1, delayBeforeSec: 3, pathIndex: 0, hpScale: Math.round(k * 0.6 * 100) / 100 }] : []),
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

/** Tìm mức máu quái cho "đặt bừa thắng" gần target nhất, người tính kỹ vẫn thắng thoải mái */
function tune(label: string, build: (k: number) => StageDefinition, loadout: string[], tier: StreetSpec['difficulty']['gearTier'], target: number, kStart: number) {
  const seeds = [1001, 2002, 3003];
  let best: { k: number; report: ReturnType<typeof evaluate> } | null = null;
  for (let k = kStart; k <= 3.0001; k += 0.1) {
    const kk = Math.round(k * 100) / 100;
    const ev = evaluate(build(kk), loadout, seeds, tier);
    if (ev.botWinRate < 1 || ev.botLives < 6) break; // người tính kỹ bắt đầu thua → dừng
    if (!best || Math.abs(ev.randomWin - target) < Math.abs(best.report.randomWin - target)) best = { k: kk, report: ev };
    if (ev.randomWin < target - 0.08) break;
  }
  if (!best) best = { k: kStart, report: evaluate(build(kStart), loadout, seeds, tier) };
  console.log(`  ${label}: máu ×${best.k}, đặt bừa thắng ${(best.report.randomWin * 100).toFixed(0)}% (mục tiêu ${(target * 100).toFixed(0)}%), tính kỹ còn ${best.report.botLives.toFixed(1)}`);
  return best;
}

/** Chỗ trống rộng nhất (xa đường đi và ô đặt món) để đặt mặt tiền tiệm chính */
function findFacadeSpot(paths: { x: number; y: number }[][], pads: { x: number; y: number }[]) {
  const segs: [{ x: number; y: number }, { x: number; y: number }][] = [];
  for (const r of paths) for (let i = 0; i < r.length - 1; i++) segs.push([r[i]!, r[i + 1]!]);
  const segD = (x: number, y: number, a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(x - a.x - t * dx, y - a.y - t * dy);
  };
  let best = { x: 300, y: 60, size: 70, score: -1 };
  for (let y = 40; y <= 470; y += 6) for (let x = 40; x <= 320; x += 6) {
    const dPath = Math.min(...segs.map(([a, b]) => segD(x, y, a, b))) - 22;
    const dPad = Math.min(...pads.map((p) => Math.hypot(x - p.x, y - p.y))) - 22;
    const dEdge = Math.min(x, 360 - x, y, 500 - y);
    const r = Math.min(dPath, dPad, dEdge, 60);
    if (r > best.score) best = { x, y, size: Math.round(r * 2), score: r };
  }
  return { x: best.x, y: best.y, size: best.size };
}

/** Quái của màn tiệm: con bị món tiệm khắc + vài con khác của phố, tăng dần theo thứ tự tiệm */
function shopPests(spec: StreetSpec, ids: string[], enemies: Record<string, EnemyDefinition>, featuredEl: ElementType, idx: number, n: number): string[] {
  const want = idx <= Math.ceil(n / 3) ? 3 : idx <= Math.ceil((2 * n) / 3) ? 4 : 5;
  const first = ids.find((id) => enemies[id]!.element === ELEMENT_COUNTERS[featuredEl]) ?? ids[idx % ids.length]!;
  const out = [first];
  for (let j = 0; out.length < Math.min(want, ids.length); j++) {
    const c = ids[(idx + j) % ids.length]!;
    if (!out.includes(c)) out.push(c);
  }
  return out;
}

function makeBoss(spec: StreetSpec, ids: string[], enemies: Record<string, EnemyDefinition>): EnemyDefinition {
  const t = STREET_BOSS_ENEMIES.st_bao_loc;
  const phases = spec.boss?.phases ?? ['thuy', 'moc', 'hoa', 'tho', 'kim'];
  const summon = phases.map((el) => ids.find((id) => enemies[id]!.element === el) ?? ids[0]!);
  return {
    ...t,
    id: `ge_${shortId(spec.id)}_trum` as never,
    ...(spec.boss?.art ? { art: spec.boss.art } : {}),
    name: spec.boss?.name ?? `Trùm ${spec.name}`,
    element: phases[0]!,
    traitLabel: 'Trùm phố: đổi hành theo máu, gọi quân của phố',
    phaseElements: phases,
    summonIds: summon as never,
  };
}

function make(id: string) {
  const spec: StreetSpec = JSON.parse(readFileSync(join(ROOT, 'content/streets', `${id}.json`), 'utf8'));
  // Kiểm nghiên cứu: địa điểm đã đóng thì không làm; thiếu nguồn thì cảnh báo
  for (const p of spec.places) {
    if (p.confidence === 'da_dong') throw new Error(`${p.name}: địa điểm đã đóng / dời — bỏ khỏi danh sách rồi làm lại`);
    if ((p.sources?.length ?? 0) < 2) console.log(`  ⚠ ${p.name}: chưa đủ 2 nguồn${p.confidence === 'nen_kiem' ? ' (nên kiểm)' : ''}`);
  }
  const geo = GEO[spec.geometry];
  if (!geo) throw new Error(`Chưa có đường đi cho ${spec.geometry} — chạy tools/osm_street_to_stage.py`);
  const towers = buildTowers(spec);
  const { enemies, ids } = buildEnemies(spec);
  // màn phố: quái đường phố riêng (nếu có), không dùng quái trong tiệm
  const street = spec.streetPests?.length ? buildEnemies(spec, spec.streetPests, 'p') : { enemies: {}, ids };
  Object.assign(enemies, street.enemies);
  const streetIds = street.ids;
  const boss = makeBoss(spec, streetIds, enemies);
  enemies[boss.id] = boss;
  Object.assign(ALL_TOWER_DEFINITIONS, towers);
  Object.assign(ALL_ENEMY_DEFINITIONS, enemies);
  const streetTowerIds = Object.keys(towers);
  const places = spec.places.map((p) => ({ key: p.key, name: p.name, type: p.type, trait: p.trait, towerId: `gt_${shortId(spec.id)}_${p.key}` as never }));
  const n = spec.places.length;
  const poolTowers = (ids2: string[]) => Object.fromEntries(ids2.map((t) => [t, ALL_TOWER_DEFINITIONS[t as never]!])) as Record<string, TowerDefinition>;

  /* ---- Màn tiệm: mỗi địa điểm 1 màn ---- */
  const shops: { hpMultiplier: number; balance: object; stage: StageDefinition }[] = [];
  spec.places.forEach((p, i) => {
    const idx = i + 1;
    const featured = `gt_${shortId(spec.id)}_${p.key}`;
    const pool = [...BASE_POOL, ...streetTowerIds.slice(0, idx)];
    const pestIds = shopPests(spec, ids, enemies, p.tower.element, idx, n);
    const pestDefs = Object.fromEntries(pestIds.map((e) => [e, enemies[e]!]));
    const rest = chooseLoadout(poolTowers(pool.filter((t) => t !== featured)), pestDefs, spec.loadoutSize - 1);
    const loadout = [featured, ...rest];
    let hsh = 0;
    for (const ch of spec.id) hsh = (hsh * 31 + ch.charCodeAt(0)) % 997;
    const room = ROOMS[(idx - 1 + hsh) % ROOMS.length]!;
    const build = (k: number): StageDefinition => {
      const stage: StageDefinition = {
        id: `${spec.id}_t${idx}` as never, stageNumber: 10 + idx, name: p.name, subtitle: `${spec.name} · tiệm ${idx}/${n}: ${p.type}`,
        startingEssence: spec.startingEssence, startingLives: spec.startingLives,
        paths: room.paths, pads: room.pads,
        waves: buildWaves(spec, pestIds, enemies, room.paths.length, k, 8),
        towerIds: pool as never, loadoutSize: spec.loadoutSize, defaultLoadout: loadout as never,
        enableSynergy: true, attribution: geo.attribution, places,
        streetId: spec.id as never, shopIndex: idx, featuredTowerId: featured as never,
        facadeKey: `mat_tien_${p.key}`, roomStyle: roomStyleOf(p.type, p.name), roomLayout: room.id,
      };
      stage.botPlan = makeBotPlan(stage, loadout, ALL_TOWER_DEFINITIONS as never) as never;
      return stage;
    };
    // độ khó tăng dần: tiệm đầu dễ (đặt bừa vẫn hay thắng), tiệm cuối khó gần bằng màn phố
    const target = 0.65 - (0.3 * (idx - 1)) / Math.max(1, n - 1);
    const { k, report } = tune(`tiệm ${idx} ${p.name}`, build, loadout, spec.difficulty.gearTier, target, 0.3);
    shops.push({ hpMultiplier: k, balance: { randomWinWithExpectedGear: report.randomWin, botWinRate: report.botWinRate, botLivesAvg: report.botLives, target }, stage: build(k) });
  });

  /* ---- Màn phố: cả con phố + trùm — mang 4 đồ dọn phố + tối đa 2 món tiệm ---- */
  const clean = buildCleanTowers();
  Object.assign(towers, clean);
  Object.assign(ALL_TOWER_DEFINITIONS, clean);
  const cleanIds = Object.keys(clean);
  const shopPool = [...BASE_POOL, ...streetTowerIds];
  const pool = [...cleanIds, ...shopPool];
  const streetPestDefs = Object.fromEntries(streetIds.map((e) => [e, enemies[e]!]));
  const cleanPick = chooseLoadout(clean, streetPestDefs, 4);
  const shopPick = chooseLoadout(poolTowers(shopPool), streetPestDefs, 2);
  const loadout = [...cleanPick, ...shopPick];
  const baseStage = (k: number): StageDefinition => {
    const stage: StageDefinition = {
      id: spec.id, stageNumber: 10 + n + 1, name: spec.name, subtitle: `Màn phố: ${boss.name} — ${spec.subtitle}`,
      startingEssence: spec.startingEssence, startingLives: spec.startingLives,
      paths: geo.paths, pads: geo.pads,
      waves: buildWaves(spec, streetIds, enemies, geo.paths.length, k, spec.waves, boss.id),
      towerIds: pool as never, loadoutSize: spec.loadoutSize, defaultLoadout: loadout as never,
      enableSynergy: true, attribution: geo.attribution, places,
      streetId: spec.id as never, cleanTowerIds: cleanIds as never, maxShopTowers: 2,
    };
    stage.botPlan = makeBotPlan(stage, loadout, ALL_TOWER_DEFINITIONS as never) as never;
    return stage;
  };
  const { k: chosenK, report } = tune(`màn phố (trùm ${boss.name})`, baseStage, loadout, spec.difficulty.gearTier, Math.min(0.3, spec.difficulty.targetRandomWin), 0.5);
  const out = {
    generatedBy: 'tools/level-maker/make-street.ts',
    hpMultiplier: chosenK,
    balance: { randomWinWithExpectedGear: report.randomWin, botWinRate: report.botWinRate, botLivesAvg: report.botLives, gearTier: spec.difficulty.gearTier },
    stage: baseStage(chosenK), shops, towers, enemies,
  };
  const dir = join(ROOT, 'src/core/streets/generated');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${id}.json`), JSON.stringify(out, null, 1));
  console.log(`✔ ${spec.name}: ${n} màn tiệm + 1 màn phố`);
}

function writeIndex() {
  const dir = join(ROOT, 'src/core/streets/generated');
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
  const lines = [
    '/* Tạo tự động bởi tools/level-maker/make-street.ts — đừng sửa tay */',
    "import type { EnemyDefinition, StageDefinition, TowerDefinition } from '../../types';",
    ...files.map((f, i) => `import s${i} from './${f}';`),
    '',
    'export interface GeneratedShop { hpMultiplier: number; balance: { randomWinWithExpectedGear: number; botWinRate: number; botLivesAvg: number; target: number }; stage: StageDefinition }',
    'export interface GeneratedStreet { hpMultiplier: number; stage: StageDefinition; shops: GeneratedShop[]; towers: Record<string, TowerDefinition>; enemies: Record<string, EnemyDefinition> }',
    `export const GENERATED_STREETS: GeneratedStreet[] = [${files.map((_, i) => `s${i} as unknown as GeneratedStreet`).join(', ')}];`,
    '',
  ];
  writeFileSync(join(dir, 'index.ts'), lines.join('\n'));
}

const arg = process.argv[2];
const ids = arg ? [arg] : readdirSync(join(ROOT, 'content/streets')).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
for (const id of ids) { console.log(`Làm màn: ${id}`); make(id); }
writeIndex();
