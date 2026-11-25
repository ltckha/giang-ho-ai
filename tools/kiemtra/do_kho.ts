import { STAGES, getStageTowerList, ALL_TOWER_DEFINITIONS } from '../../src/core/tdDefinitions';
import { expectedGearForStage, pickBestPlan, simulatePlan, type LivePlan } from '../../src/core/liveBot';
import * as fs from 'fs';
const A = process.argv[2]!;
const ids: string[] = JSON.parse(fs.readFileSync(A + '/ids.json', 'utf8'));
function rng(seed: number) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
(async () => {
  const out: Record<string, unknown> = {};
  for (const id of ids) {
    const st = (STAGES as any)[id];
    const gear = expectedGearForStage(id);
    const loadout = getStageTowerList(st, st.defaultLoadout).map((t: any) => t.id);
    const best = await pickBestPlan(st, { gear, loadout: st.defaultLoadout }, 12, async () => {});
    let wins = 0, livesSum = 0; const N = 30;
    for (let k = 0; k < N; k++) {
      const r = rng(k * 101 + 7);
      const order = [...st.pads.map((p: any) => p.id)].sort(() => r() - 0.5).slice(0, Math.max(3, Math.ceil(st.pads.length * (0.5 + r() * 0.5))));
      const plan: LivePlan = { order, defs: {}, branch: {} };
      for (const p of order) { plan.defs[p] = loadout[Math.floor(r() * loadout.length)]; plan.branch[p] = r() < 0.5 ? 'A' : 'B'; }
      const res = simulatePlan(st, { gear, loadout: st.defaultLoadout }, plan);
      if (res.status === 'won') { wins++; livesSum += res.lives / res.maxLives; }
    }
    const enemies = new Set<string>(); let count = 0;
    for (const w of st.waves) for (const g of w.groups) { enemies.add(g.enemyId); count += g.count ?? 1; }
    out[id] = { name: st.name, waves: st.waves.length, pads: st.pads.length, paths: st.paths.length, loadout: loadout.join(','), enemyKinds: [...enemies].join(','), enemyCount: count,
      bot: best.expected.status, botLives: `${best.expected.lives}/${best.expected.maxLives}`, botSec: Math.round(best.expected.timeSec), randWin: Math.round(wins / N * 100), randLivesAvg: wins ? Math.round(livesSum / wins * 100) : 0 };
    console.log(id, JSON.stringify(out[id]));
    fs.writeFileSync(A + '/dokho.json', JSON.stringify(out, null, 1));
  }
})();
