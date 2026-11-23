// Kiểm độ khó khi có trang bị: không đồ / đồ trung bình / đồ mạnh nhất (viên mãn hàng hiệu).
// Chạy: npx esbuild docs/review/sim_gear.ts --bundle --platform=node --outfile=/tmp/simg.cjs && node /tmp/simg.cjs
import { computeGearBonus, GEAR_SLOTS, makeGearItem, type Equipped, type GearBonus } from '../../src/core/equipment';
import { runBotTurn } from '../../src/core/tdBot';
import { STAGES, getStageTowerList, getTowerTierStats } from '../../src/core/tdDefinitions';
import { TowerDefenseEngine } from '../../src/core/tdEngine';
import type { ElementType } from '../../src/core/types';

function rng(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
const CYCLE: ElementType[] = ['kim', 'thuy', 'moc', 'hoa', 'tho'];
const r0 = rng(99);
const full: Equipped = {}; GEAR_SLOTS.forEach((s, i) => (full[s.id] = makeGearItem(s.id, CYCLE[i % 5]!, 'hieu', 'f' + i, r0)));
const mid: Equipped = {}; GEAR_SLOTS.slice(0, 6).forEach((s, i) => (mid[s.id] = makeGearItem(s.id, CYCLE[i % 5]!, 'tot', 'm' + i, r0)));
const GEARS: [string, GearBonus | undefined][] = [['không đồ', undefined], ['đồ trung bình (6 món Tốt)', computeGearBonus(mid)], ['đồ mạnh nhất (viên mãn Hàng hiệu)', computeGearBonus(full)]];

for (const id of ['stage_1', 'stage_2', 'stage_3'] as const) {
  const ST = STAGES[id]; const pads = ST.pads.map((p) => p.id); const TYPES = getStageTowerList(ST).map((t) => t.id);
  const SUP = getStageTowerList(ST).find((t) => t.role === 'support_buff')!.id; const ATT = TYPES.filter((t) => t !== SUP);
  for (const [label, gear] of GEARS) {
    const run = (pol: (e: TowerDefenseEngine) => void) => { const e = new TowerDefenseEngine(ST, { gear }); let t = 0; while (e.status === 'playing' && t < 3600) { pol(e); if (!e.waveInProgress && e.canStartNextWave()) e.startNextWave(false); e.step(0.05); t += 0.05; } return e.status === 'won' ? e.lives : -1; };
    const plan = (order: string[], m: any, br: any) => (e: TowerDefenseEngine) => { let a = true; while (a) { a = false; for (const p of order) { if (!e.getTowerAtPad(p)) { if (e.essence >= e.getBuildCost(m[p])) { e.buildTower(p, m[p]); a = true; } break; } } if (!a) for (const p of order) { const tw = e.getTowerAtPad(p); if (tw && tw.tier < 3) { if (e.essence >= e.getUpgradeCost(tw.defId, (tw.tier + 1) as 2 | 3, br[p])) { e.upgradeTower(p, tw.tier === 2 ? br[p] : undefined); a = true; } break; } } } };
    const bot = run(runBotTurn);
    let rw = 0; for (let s = 1; s <= 40; s++) { const r = rng(s); const m: any = {}, br: any = {}; pads.forEach((p) => { m[p] = TYPES[Math.floor(r() * TYPES.length)]; br[p] = r() < 0.5 ? 'A' : 'B'; }); if (run(plan(pads, m, br)) >= 0) rw++; }
    const h: Record<string, number> = { thua: 0, '1sao': 0, '2sao': 0, '3sao': 0 }; const maxL = ST.startingLives + (gear?.lives ?? 0);
    for (let s = 1; s <= 150; s++) { const r = rng(s * 7 + 3); const order = [...pads].sort(() => r() - 0.5).slice(0, 5 + Math.floor(r() * 5)); const m: any = {}, br: any = {}; pads.forEach((p) => { m[p] = ATT[Math.floor(r() * ATT.length)]; br[p] = r() < 0.5 ? 'A' : 'B'; }); if (r() < 0.4) m[order[order.length - 1]] = SUP; const l = run(plan(order, m, br)); const k = l < 0 ? 'thua' : l / maxL >= 0.85 ? '3sao' : l / maxL >= 0.5 ? '2sao' : '1sao'; h[k]!++; }
    console.log(`${id} | ${label}: bot còn ${bot}/${maxL} · đặt bừa thắng ${rw}/40 · 150 kế hoạch ${JSON.stringify(h)}`);
  }
}
