// Mô phỏng cân bằng cho một màn. Chạy:
//   npx esbuild docs/review/sim_stage.ts --bundle --platform=node --outfile=/tmp/sim.cjs && node /tmp/sim.cjs stage_2
import { TowerDefenseEngine } from '../../src/core/tdEngine';
import { runBotTurn } from '../../src/core/tdBot';
import { STAGES, getStageTowerList, getTowerTierStats } from '../../src/core/tdDefinitions';
const stageId = (process.argv[2] || 'stage_2') as 'stage_1' | 'stage_2' | 'stage_3' | 'stage_4';
const STAGE = STAGES[stageId];
const TYPES = getStageTowerList(STAGE).map((t) => t.id);
const SUPPORT = getStageTowerList(STAGE).find((t) => t.role === 'support_buff')!.id;
const ATTACK = TYPES.filter((t) => t !== SUPPORT);
const pads = STAGE.pads.map((p) => p.id);
function rng(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
function run(policy: (e: TowerDefenseEngine) => void) {
  const e = new TowerDefenseEngine(STAGE); let t = 0;
  while (e.status === 'playing' && t < 3600) { policy(e); if (!e.waveInProgress && e.canStartNextWave()) e.startNextWave(false); e.step(0.05); t += 0.05; }
  return { status: e.status, lives: e.lives, time: Math.round(t) };
}
function planPolicy(order: string[], map: Record<string, any>, br: Record<string, any>) {
  return (e: TowerDefenseEngine) => {
    let acted = true;
    while (acted) { acted = false;
      for (const p of order) { if (!e.getTowerAtPad(p)) { const d = map[p]; if (e.essence >= getTowerTierStats(d, 1).cost) { e.buildTower(p, d); acted = true; } break; } }
      if (!acted) for (const p of order) { const tw = e.getTowerAtPad(p); if (tw && tw.tier < 3) { const c = getTowerTierStats(tw.defId, (tw.tier + 1) as any, br[p]).cost; if (e.essence >= c) { e.upgradeTower(p, tw.tier === 2 ? br[p] : undefined); acted = true; } break; } }
    }
  };
}
const star = (l: number) => (l < 0 ? 'thua' : l >= 17 ? '3sao' : l >= 10 ? '2sao' : '1sao');
const out: string[] = [];
out.push(`${stageId}: ${pads.length} ô, ${STAGE.startingEssence} xu, ${STAGE.waves.length} đợt`);
const b = run(runBotTurn); out.push(`bot: ${b.status} còn ${b.lives} (${b.time}s)`);
for (const ty of TYPES) { const m: any = {}, br: any = {}; pads.forEach((p) => { m[p] = ty; br[p] = 'A'; }); const r = run(planPolicy(pads, m, br)); out.push(`toàn ${ty}: ${r.status} còn ${r.lives}`); }
for (const n of [1, 2, 3, 4]) for (const ty of ATTACK.slice(0, 2)) { const m: any = {}, br: any = {}; pads.forEach((p) => { m[p] = ty; br[p] = 'A'; }); const r = run(planPolicy(pads.slice(0, n), m, br)); out.push(`chỉ ${n} ${ty}: ${r.status} còn ${r.lives}`); }
{ let won = 0; const ls: number[] = []; for (let s = 1; s <= 60; s++) { const r = rng(s); const m: any = {}, br: any = {}; pads.forEach((p) => { m[p] = TYPES[Math.floor(r() * TYPES.length)]; br[p] = r() < 0.5 ? 'A' : 'B'; }); const o = run(planPolicy(pads, m, br)); if (o.status === 'won') { won++; ls.push(o.lives); } } out.push(`ngẫu nhiên 60: thắng ${won}, mạng khi thắng [${ls.sort((a, c) => a - c).join(',')}]`); }
{ const h: Record<string, number> = {}; let best = -1; for (let s = 1; s <= 300; s++) { const r = rng(s * 7 + 3); const order = [...pads].sort(() => r() - 0.5).slice(0, 5 + Math.floor(r() * 5)); const m: any = {}, br: any = {}; pads.forEach((p) => { m[p] = ATTACK[Math.floor(r() * ATTACK.length)]; br[p] = r() < 0.5 ? 'A' : 'B'; }); if (r() < 0.4) m[order[order.length - 1]] = SUPPORT; const l = (() => { const o = run(planPolicy(order, m, br)); return o.status === 'won' ? o.lives : -1; })(); best = Math.max(best, l); const k = star(l); h[k] = (h[k] || 0) + 1; } out.push(`300 kế hoạch có thứ tự: ${JSON.stringify(h)} tốt nhất còn ${best}`); }
console.log(out.join('\n'));
