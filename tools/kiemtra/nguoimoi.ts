import { STAGES, getStageTowerList } from '../../src/core/tdDefinitions';
import { expectedGearForStage, simulatePlan, type LivePlan } from '../../src/core/liveBot';
import * as fs from 'fs';
const A = process.argv[2]!; const N = 40;
const ids: string[] = JSON.parse(fs.readFileSync(A + '/ids.json', 'utf8'));
function rng(seed: number) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const out: Record<string, number> = {};
for (const id of ids) {
  const st = (STAGES as any)[id];
  const gear = expectedGearForStage(id);
  const loadout = getStageTowerList(st, st.defaultLoadout).map((t: any) => t.id);
  const cov = (p: any) => { let c = 0; for (const path of st.paths) for (const pt of path) if (Math.hypot(pt.x - p.x, pt.y - p.y) <= 110) c++; return c; };
  let wins = 0;
  for (let k = 0; k < N; k++) {
    const r = rng(k * 977 + 13);
    // người mới: ưu tiên ô gần đường (có lệch ngẫu nhiên), món chọn bừa, nhánh bừa
    const order = st.pads.map((p: any) => ({ id: p.id, s: cov(p) * (0.5 + r()) })).sort((a: any, b: any) => b.s - a.s).map((x: any) => x.id);
    const plan: LivePlan = { order, defs: {}, branch: {} };
    for (const p of order) { plan.defs[p] = loadout[Math.floor(r() * loadout.length)]; plan.branch[p] = r() < 0.5 ? 'A' : 'B'; }
    if (simulatePlan(st, { gear, loadout: st.defaultLoadout }, plan).status === 'won') wins++;
  }
  out[id] = Math.round(wins / N * 100);
  console.log(id, out[id]);
}
fs.writeFileSync(A + '/nguoimoi.json', JSON.stringify(out, null, 1));
