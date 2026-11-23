// Trùm phố với đồ "thực tế" sau 3 tiệm: bộ khởi đầu + đồ rơi ngẫu nhiên (2 sao mỗi tiệm), mặc vào ô trống bất kỳ.
// Chạy: npx esbuild docs/review/sim_streetboss_gear.ts --bundle --platform=node --outfile=/tmp/sb.cjs && node /tmp/sb.cjs
import { computeGearBonus, rollStageDrops, starterGear, type Equipped } from '../../src/core/equipment';
import { runBotTurn } from '../../src/core/tdBot';
import { STAGES, getStageTowerList } from '../../src/core/tdDefinitions';
import { TowerDefenseEngine } from '../../src/core/tdEngine';
function rng(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
const ST = STAGES.stage_4; const pads = ST.pads.map((p) => p.id); const TYPES = getStageTowerList(ST).map((t) => t.id);
const ATT = TYPES.filter((t) => t !== 'fl_vent');
const results: string[] = [];
for (const [label, seeds] of [['không đồ', 0], ['đồ thực tế (8 món ngẫu nhiên)', 5]] as const) {
  let rw = 0, tot = 0; const h: Record<string, number> = { thua: 0, '1sao': 0, '2sao': 0, '3sao': 0 }; let botL = 0;
  for (let g = 0; g < Math.max(1, seeds); g++) {
    let gear;
    if (seeds) { const r = rng(1000 + g); const inv = [...starterGear(), ...rollStageDrops(1, 2, r, 'a'), ...rollStageDrops(2, 2, r, 'b'), ...rollStageDrops(3, 2, r, 'c')]; const eq: Equipped = {}; for (const it of inv) if (!eq[it.slot]) eq[it.slot] = it; gear = computeGearBonus(eq); }
    const run = (pol: (e: TowerDefenseEngine) => void) => { const e = new TowerDefenseEngine(ST, { gear }); let t = 0; while (e.status === 'playing' && t < 3600) { pol(e); if (!e.waveInProgress && e.canStartNextWave()) e.startNextWave(false); e.step(0.05); t += 0.05; } return { l: e.status === 'won' ? e.lives : -1, max: e.maxLives }; };
    const plan = (order: string[], m: any, br: any) => (e: TowerDefenseEngine) => { let a = true; while (a) { a = false; for (const p of order) { if (!e.getTowerAtPad(p)) { if (e.essence >= e.getBuildCost(m[p])) { e.buildTower(p, m[p]); a = true; } break; } } if (!a) for (const p of order) { const tw = e.getTowerAtPad(p); if (tw && tw.tier < 3) { if (e.essence >= e.getUpgradeCost(tw.defId, (tw.tier + 1) as 2 | 3, br[p])) { e.upgradeTower(p, tw.tier === 2 ? br[p] : undefined); a = true; } break; } } } };
    botL += run(runBotTurn).l;
    for (let s = 1; s <= 30; s++) { const r = rng(s + g * 100); const m: any = {}, br: any = {}; pads.forEach((p) => { m[p] = TYPES[Math.floor(r() * TYPES.length)]; br[p] = r() < 0.5 ? 'A' : 'B'; }); tot++; if (run(plan(pads, m, br)).l >= 0) rw++; }
    for (let s = 1; s <= 40; s++) { const r = rng(s * 7 + 3 + g * 1000); const order = [...pads].sort(() => r() - 0.5).slice(0, 5 + Math.floor(r() * 5)); const m: any = {}, br: any = {}; pads.forEach((p) => { m[p] = ATT[Math.floor(r() * ATT.length)]; br[p] = r() < 0.5 ? 'A' : 'B'; }); if (r() < 0.4) m[order[order.length - 1]] = 'fl_vent'; const o = run(plan(order, m, br)); const k = o.l < 0 ? 'thua' : o.l / o.max >= 0.85 ? '3sao' : o.l / o.max >= 0.5 ? '2sao' : '1sao'; h[k]!++; }
  }
  results.push(`${label}: bot TB còn ${(botL / Math.max(1, seeds)).toFixed(1)} · đặt bừa thắng ${rw}/${tot} · kế hoạch ${JSON.stringify(h)}`);
}
console.log(results.join('\n'));
