import { TowerDefenseEngine } from '../../src/core/tdEngine';
import { runBotTurn } from '../../src/core/tdBot';
import { STAGE_1_DEFINITION, TOWER_DEFINITIONS, getTowerTierStats } from '../../src/core/tdDefinitions';
const TYPES = Object.keys(TOWER_DEFINITIONS) as any[];
const pads = (STAGE_1_DEFINITION as any).pads.map((p: any) => p.id);
function rng(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
function run(policy: (e: TowerDefenseEngine) => void) {
  const e = new TowerDefenseEngine(STAGE_1_DEFINITION);
  let t = 0;
  while (e.status === 'playing' && t < 3600) {
    policy(e);
    if (!e.waveInProgress && e.canStartNextWave()) e.startNextWave(false);
    e.step(0.05); t += 0.05;
  }
  return { status: e.status, lives: e.lives, time: Math.round(t) };
}
function greedy(order: () => string, typeFor: (pad: string) => any, upgrade = true, branch = 'A') {
  return (e: TowerDefenseEngine) => {
    for (const p of pads) { if (!e.getTowerAtPad(p)) { const d = typeFor(p); if (e.essence >= TOWER_DEFINITIONS[d].tier1.cost) e.buildTower(p, d); return; } }
    if (!upgrade) return;
    for (const p of pads) { const tw = e.getTowerAtPad(p)!; if (tw.tier < 3) { const c = getTowerTierStats(tw.defId, tw.tier + 1 as any, branch as any).cost; if (e.essence >= c) e.upgradeTower(p, tw.tier === 2 ? branch as any : undefined); return; } }
  };
}
console.log('pads', pads.length, 'start', (STAGE_1_DEFINITION as any).startingEssence, 'lives', (STAGE_1_DEFINITION as any).lives ?? '');
console.log('bot', JSON.stringify(run(runBotTurn)));
for (const ty of TYPES) console.log('all', ty, JSON.stringify(run(greedy(() => '', () => ty))));
for (const ty of TYPES) console.log('all-noupg', ty, JSON.stringify(run(greedy(() => '', () => ty, false))));
const res: any = { won: 0, lost: 0, lives: [] as number[] };
for (let s = 1; s <= 60; s++) { const r = rng(s); const map: any = {}; pads.forEach((p: string) => map[p] = TYPES[Math.floor(r() * TYPES.length)]); const out = run(greedy(() => '', (p) => map[p], true, r() < 0.5 ? 'A' : 'B')); out.status === 'won' ? res.won++ : res.lost++; res.lives.push(out.lives); }
console.log('random-mix 60', res.won, 'won', res.lost, 'lost', 'lives', res.lives.sort((a: number, b: number) => a - b).join(','));
const cyc = run(greedy(() => '', (p) => TYPES[pads.indexOf(p) % TYPES.length]));
console.log('cycle-5-types', JSON.stringify(cyc));
for (const n of [1, 2, 3, 4]) for (const ty of ['wood_tower', 'fire_tower']) {
  const lim = pads.slice(0, n);
  const pol = (e: TowerDefenseEngine) => { for (const p of lim) { if (!e.getTowerAtPad(p)) { if (e.essence >= TOWER_DEFINITIONS[ty].tier1.cost) e.buildTower(p, ty as any); return; } } for (const p of lim) { const tw = e.getTowerAtPad(p)!; if (tw.tier < 3) { const c = getTowerTierStats(tw.defId, tw.tier + 1 as any, 'A' as any).cost; if (e.essence >= c) e.upgradeTower(p, tw.tier === 2 ? 'A' as any : undefined); return; } } };
  console.log('limit', n, ty, JSON.stringify(run(pol)));
}
