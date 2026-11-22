import { TowerDefenseEngine } from '../../src/core/tdEngine';
import { STAGE_1_DEFINITION, TOWER_DEFINITIONS, getTowerTierStats } from '../../src/core/tdDefinitions';
const TYPES = Object.keys(TOWER_DEFINITIONS) as any[];
const pads = (STAGE_1_DEFINITION as any).pads.map((p: any) => p.id);
function rng(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
function run(order: string[], map: any, br: any, early: boolean) {
  const e = new TowerDefenseEngine(STAGE_1_DEFINITION); let t = 0;
  while (e.status === 'playing' && t < 3600) {
    let acted = true;
    while (acted) { acted = false;
      for (const p of order) { const tw = e.getTowerAtPad(p); if (!tw) { if (e.essence >= TOWER_DEFINITIONS[map[p]].tier1.cost) { e.buildTower(p, map[p]); acted = true; } break; } }
      if (!acted) for (const p of order) { const tw = e.getTowerAtPad(p); if (tw && tw.tier < 3) { const c = getTowerTierStats(tw.defId, tw.tier + 1 as any, br[p]).cost; if (e.essence >= c) { e.upgradeTower(p, tw.tier === 2 ? br[p] : undefined); acted = true; } break; } }
    }
    if (!e.waveInProgress && e.canStartNextWave()) e.startNextWave(early && e.currentWaveIndex >= 0);
    e.step(0.05); t += 0.05;
  }
  return e.status === 'won' ? e.lives : -1;
}
const hist: Record<string, number> = {}; let best = -1;
for (let s = 1; s <= 400; s++) { const r = rng(s * 7 + 3); const order = [...pads].sort(() => r() - 0.5).slice(0, 5 + Math.floor(r() * 5)); const map: any = {}, br: any = {}; pads.forEach((p: string) => { map[p] = TYPES[Math.floor(r() * 4)]; br[p] = r() < 0.5 ? 'A' : 'B'; }); if (r() < 0.3) map[order[order.length - 1]] = 'earth_tower';
  const l = run(order, map, br, false); best = Math.max(best, l); const k = l < 0 ? 'thua' : l >= 17 ? '3sao' : l >= 9 ? '2sao' : '1sao'; hist[k] = (hist[k] || 0) + 1; }
console.log('400 kế hoạch ngẫu nhiên có thứ tự xây:', JSON.stringify(hist), 'tốt nhất còn', best, 'mạng');
