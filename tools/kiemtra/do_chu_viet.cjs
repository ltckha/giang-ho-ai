/**
 * Dò chữ tiếng Việt còn sót ở bản tiếng Anh (Little Shops of Dalat).
 * Mở game ?lang=en, bấm lần lượt từng nút ở màn chính / bản đồ / từng phố / trong màn chơi / bảng kết quả,
 * gom: chữ trên trang còn dấu tiếng Việt, chữ trong hộp thông báo, và window.__i18nMiss (chữ dịch xong vẫn còn dấu).
 * Chữ còn dấu nhưng là tên thật (đường, phường, món ăn) có sẵn trong bản dịch thì bỏ qua.
 *
 * Cần: npm run build && npx vite preview --port 4179
 * Chạy: node tools/kiemtra/do_chu_viet.cjs <thư mục ra> [phần] [số phần]   → <thư mục ra>/chu_sot_<phần>.json + ảnh
 *   (chạy song song: for i in 0 1 2; do node tools/kiemtra/do_chu_viet.cjs <ra> $i 3 & done; wait)
 */
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const pw = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright'));

const OUT = process.argv[2] || '.';
const SHARD = +(process.argv[3] || 0);
const NSHARD = +(process.argv[4] || 1);
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:4179/?lang=en&bot=1';
const VN = /[ạảãàáâầấậẩẫăằắặẳẵđèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹĐÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĨŨƠƯ]/;
const ASCII_VN = /(?<!\p{L})(?:Kim|xu|Xu|tim|Tim|Sinh|Kem|Hoa|Atiso)(?!\p{L})/u;
const dict = JSON.parse(fs.readFileSync(path.join(__dirname, '../../src/i18n/en.json'), 'utf8'));
// Từ có dấu được phép (xuất hiện trong bản dịch: tên đường, phường, món ăn)
const okWords = new Set();
for (const v of Object.values(dict)) for (const w of v.split(/[^\p{L}]+/u)) if (VN.test(w)) okWords.add(w);
const isLeft = (s) => s.split(/[^\p{L}]+/u).some((w) => VN.test(w) && !okWords.has(w)) || ASCII_VN.test(s);

const found = new Map(); // chữ → nơi thấy
const note = (s, where) => {
  s = s.replace(/\s+/g, ' ').trim();
  if (s && isLeft(s) && !found.has(s)) found.set(s, where);
};

async function scan(p, where) {
  await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    const o = [];
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) {
      const el = n.parentElement;
      if (el && el.offsetParent !== null && n.data.trim()) o.push(n.data);
    }
    document.querySelectorAll('[title],[aria-label],[placeholder],img[alt]').forEach((e) =>
      ['title', 'aria-label', 'placeholder', 'alt'].forEach((a) => { const v = e.getAttribute(a); if (v) o.push(v); }));
    const miss = window.__i18nMiss ? [...window.__i18nMiss.values()] : [];
    // chữ vẽ trên màn chơi (Phaser)
    const g = window.__GIANG_HO_GAME__;
    const canvasTexts = [];
    try { for (const sc of g.scene.getScenes(true)) for (const c of sc.children.list) if (c.type === 'Text') canvasTexts.push(c.text); } catch { /* */ }
    return { o, miss, canvasTexts };
  });
  for (const s of r.o) note(s, where);
  for (const s of r.miss) note(s, where + ' (dịch sót)');
  for (const s of r.canvasTexts) note(s, where + ' (chữ trên màn chơi)');
}

/** Các nút bấm được đang hiện (trừ nút đổi tiếng / link ra ngoài / tải tệp) */
async function clickables(p) {
  return p.evaluate(() => {
    const els = [...document.querySelectorAll('button, [role=button], summary, a, .td-bm-pin, [data-testid^="pad-"], .td-chip, [data-testid^="gear-slot-"], [data-testid^="gear-preview-"], [data-testid^="vehicle-chip-"], [data-testid^="loadout-pick-"]')];
    const seen = new Set();
    const out = [];
    els.forEach((e, i) => {
      if (e.offsetParent === null || e.disabled) return;
      const id = e.getAttribute('data-testid') || e.id || '';
      if (/btn-lang|btn-start-live/.test(id)) return;
      if (e.tagName === 'A' && (/^(mailto|http)/.test(e.getAttribute('href') || '') || e.hasAttribute('download'))) return;
      const key = id ? `#${id}` : `${e.tagName}:${(e.textContent || '').trim().slice(0, 30)}:${i}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ i, key, label: (e.textContent || e.getAttribute('aria-label') || id).trim().slice(0, 40) });
    });
    return out;
  });
}
async function clickIndex(p, i) {
  await p.evaluate((idx) => {
    const els = [...document.querySelectorAll('button, [role=button], summary, a, .td-bm-pin, [data-testid^="pad-"], .td-chip, [data-testid^="gear-slot-"], [data-testid^="gear-preview-"], [data-testid^="vehicle-chip-"], [data-testid^="loadout-pick-"]')];
    els[idx]?.click();
  }, i);
}

async function skipTutorial(p) {
  for (let k = 0; k < 10; k++) {
    const sk = p.getByText(/^(Skip|Next →)$/).first();
    if (await sk.isVisible().catch(() => false)) { await sk.click().catch(() => {}); await p.waitForTimeout(250); } else break;
  }
}

/** Đi tới 1 trạng thái từ đầu (mở lại trang) */
async function goState(p, st) {
  await p.goto(BASE);
  await p.locator('.td-title-heading').waitFor({ timeout: 20000 });
  await p.waitForTimeout(600);
  if (st.kind === 'home') return;
  const bk = p.getByTestId('btn-street-back');
  if (await bk.isVisible()) { await bk.click(); await p.waitForTimeout(400); }
  if (st.kind === 'map') return;
  if (st.pin) { await p.getByTestId(st.pin).click({ force: true }); await p.waitForTimeout(600); }
  if (st.kind === 'street') return;
  // màn chơi
  await p.getByTestId(st.play).click({ force: true });
  await p.waitForFunction(() => window.__TD_SCENE__?.engine, null, { timeout: 30000 });
  await p.waitForTimeout(1500);
  if (st.tutorial) return;
  await skipTutorial(p);
  if (st.kind === 'stage') return;
  const cw = p.getByTestId('btn-call-wave');
  if (await cw.isVisible().catch(() => false)) await cw.click();
  if (st.kind === 'combat') { await p.getByTestId('btn-bot-toggle').click().catch(() => {}); await p.waitForTimeout(3000); return; }
  if (st.kind === 'win') {
    await p.getByTestId('btn-bot-toggle').click().catch(() => {});
    await p.evaluate(() => { const s = window.__TD_SCENE__; let g = 0; while (s.engine.status === 'playing' && g < 40000) { s.tickSimulation(0.05); g++; } });
  }
  if (st.kind === 'lose') {
    await p.evaluate(() => { const s = window.__TD_SCENE__; let g = 0; while (s.engine.status === 'playing' && g < 40000) { s.tickSimulation(0.05); g++; } });
  }
  await p.waitForTimeout(1500);
}

(async () => {
  const b = await pw.chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => localStorage.setItem('gonpho_mo_het', '1'));
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  let where = '';
  p.on('dialog', async (d) => { note(d.message(), where + ' (hộp thông báo)'); await d.dismiss().catch(() => {}); });

  // Danh sách trạng thái
  await goState(p, { kind: 'map' });
  const pins = await p.locator('[data-testid^="real-street-pin-"], [data-testid="street-tab-doc"]').evaluateAll((es) => es.map((e) => e.getAttribute('data-testid')));
  const states = [{ kind: 'home', name: 'man-chinh' }, { kind: 'map', name: 'ban-do' }];
  for (const pin of pins) states.push({ kind: 'street', pin, name: pin });
  // màn chơi: màn 1 (có hướng dẫn), 1 tiệm + trùm mỗi phố thật
  states.push({ kind: 'stage', tutorial: true, pin: 'street-tab-doc', play: 'btn-start-stage-1', name: 'man1-huongdan' });
  for (const k of ['stage', 'combat', 'win']) states.push({ kind: k, pin: 'street-tab-doc', play: 'btn-start-stage-1', name: 'man1-' + k });
  states.push({ kind: 'lose', pin: 'street-tab-doc', play: 'btn-start-stage-3', name: 'man3-thua' });
  for (const pin of pins.filter((x) => x.startsWith('real-'))) {
    const sid = pin.replace('real-street-pin-', '');
    await goState(p, { kind: 'street', pin });
    const plays = await p.locator('[data-testid^="btn-play-"]').evaluateAll((es) => es.map((e) => e.getAttribute('data-testid')));
    for (const k of ['combat', 'win']) states.push({ kind: k, pin, play: plays[plays.length - 1], name: `${sid}-tiem-${k}` });
    states.push({ kind: 'combat', pin, play: `btn-start-${sid}`, name: `${sid}-trum` });
    states.push({ kind: 'lose', pin, play: `btn-start-${sid}`, name: `${sid}-trum-thua` });
  }

  const save = () => fs.writeFileSync(`${OUT}/chu_sot_${SHARD}.json`, JSON.stringify([...found].map(([s, w]) => ({ chu: s, o: w })), null, 1));
  for (const st of states.filter((_, i) => i % NSHARD === SHARD)) {
    where = st.name;
    try {
      await goState(p, st);
    } catch (e) {
      console.log('không vào được', st.name, String(e).slice(0, 80));
      continue;
    }
    await scan(p, st.name);
    await p.screenshot({ path: `${OUT}/${st.name}.png` });
    const list = await clickables(p);
    // trạng thái đông (bản đồ, trận đánh): bấm vài nút chính; còn lại bấm hết
    const max = st.kind === 'map' ? 0 : st.kind === 'combat' ? 12 : 25;
    for (const c of list.slice(0, max)) {
      where = `${st.name} › ${c.label}`;
      try {
        await clickIndex(p, c.i);
        await scan(p, where);
        // bấm thêm 1 lớp trong bảng vừa mở (tối đa 12 nút mới)
        const after = await clickables(p);
        const fresh = after.filter((a) => !list.some((x) => x.key === a.key)).slice(0, 8);
        for (const f of fresh) {
          where = `${st.name} › ${c.label} › ${f.label}`;
          await clickIndex(p, f.i);
          await scan(p, where);
        }
        await goState(p, st);
      } catch (e) {
        await goState(p, st).catch(() => {});
      }
    }
    console.log('xong', st.name, '| chữ sót đến giờ:', found.size);
    save();
  }
  save();
  console.log('TỔNG chữ sót:', found.size, '| lỗi trang:', errs.length, errs.slice(0, 3));
  await b.close();
})();
