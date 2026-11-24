/**
 * Chế độ LIVE TikTok (Claude): máy tự chơi nối tiếp các màn, khán giả thả tim / tặng quà giúp tiệm.
 * - Vào: ?live=1 trên link, hoặc nút 📺 ở màn chính khi bật chế độ chủ.
 * - Sự kiện khán giả: window.gonPhoLive.push({type, user, text, count}) — Bước 2 bộ đọc TikTok gọi vào đây,
 *   hoặc ?ws=ws://localhost:8787 để tự nối.
 * - Nút 🧪 bật khán giả THỬ (ghi rõ chữ THỬ trên màn hình) để xem trước — tắt khi phát thật.
 * Luật TikTok: LIVE cần có người thật ở cạnh; máy chỉ là phần phụ. Không vòng quay / rút thăm.
 */
import type Phaser from 'phaser';
import { STAGES, REAL_STREET_STAGES, REAL_STREET_SHOPS } from '../core/tdDefinitions';
import { expectedGearForStage, pickBestPlan, type LivePlan } from '../core/liveBot';
import type { GearBonus } from '../core/equipment';
import type { TowerDefenseEngine } from '../core/tdEngine';
import type { StageId, TowerId } from '../core/types';
import { SCENE_KEYS } from './sceneKeys';

export interface LiveEvent {
  type: 'comment' | 'like' | 'gift' | 'follow' | 'share';
  user: string;
  text?: string;
  count?: number;
}

export interface LiveStageData {
  plan: LivePlan;
  gear: GearBonus;
}

/** Màn đang chơi báo cho LIVE (TdStageScene) */
export interface LiveHost {
  scene: Phaser.Scenes.ScenePlugin;
  engine: TowerDefenseEngine;
  setLivePlan(plan: LivePlan | null): void;
  liveLabel(text: string, color: string): void;
}

const IDX_KEY = 'gonpho_live_idx';

const state = {
  active: false,
  machine: true,
  demo: false,
  wins: 0,
  losses: 0,
  index: 0,
  likeBank: 0,
  scores: new Map<string, number>(),
  host: null as LiveHost | null,
  nextTimer: 0 as number | undefined,
  demoTimer: 0 as number | undefined,
  ws: null as WebSocket | null,
  root: null as HTMLDivElement | null,
};

/** Thứ tự màn: Phố Dốc 1→4, rồi từng phố thật (các tiệm trước, màn phố sau) */
export function livePlaylist(): StageId[] {
  const ids: string[] = ['stage_1', 'stage_2', 'stage_3', 'stage_4'];
  for (const st of REAL_STREET_STAGES) {
    for (const s of REAL_STREET_SHOPS[st.id] ?? []) ids.push(s.id);
    ids.push(st.id);
  }
  return ids as StageId[];
}

export function isLiveActive(): boolean {
  return state.active;
}

export function isLiveMachine(): boolean {
  return state.active && state.machine;
}

function stageLabel(id: string): string {
  const def = STAGES[id as StageId];
  if (!def) return id;
  for (const st of REAL_STREET_STAGES) {
    const shops = REAL_STREET_SHOPS[st.id] ?? [];
    const k = shops.findIndex((s) => s.id === id);
    if (k >= 0) return `${st.name} · Tiệm ${k + 1}/${shops.length}`;
    if (st.id === id) return `${st.name} · Đánh trùm`;
  }
  return `Phố Dốc · ${def.name}`;
}

/* ---------- Giao diện phủ trên game ---------- */

function el<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return state.root?.querySelector<T>(`#${id}`) ?? null;
}

function mountOverlay(): void {
  if (state.root) return;
  const root = document.createElement('div');
  root.id = 'gp-live';
  root.setAttribute('data-testid', 'live-overlay');
  root.innerHTML = `
    <div class="gp-live-top">
      <span class="gp-live-dot" id="gp-live-dot">● LIVE</span>
      <span class="gp-live-stage" id="gp-live-stage"></span>
      <span class="gp-live-score" id="gp-live-score"></span>
    </div>
    <div class="gp-live-hint">❤️ thả tim → tiếp xu cho tiệm · 🎁 quà → bùa làm chậm quái</div>
    <div class="gp-live-board" id="gp-live-board" hidden></div>
    <div class="gp-live-feed" id="gp-live-feed"></div>
    <div class="gp-live-banner" id="gp-live-banner"></div>
    <div class="gp-live-hearts" id="gp-live-hearts"></div>
    <div class="gp-live-ctrl">
      <button type="button" id="gp-live-mode" data-testid="live-mode" aria-label="Máy / Người chơi"></button>
      <button type="button" id="gp-live-demo" data-testid="live-demo" aria-label="Khán giả thử">🧪</button>
      <button type="button" id="gp-live-exit" data-testid="live-exit" aria-label="Thoát LIVE">✕</button>
    </div>`;
  document.body.appendChild(root);
  state.root = root;
  el('gp-live-mode')?.addEventListener('click', () => setMachine(!state.machine));
  el('gp-live-demo')?.addEventListener('click', () => setDemo(!state.demo));
  el('gp-live-exit')?.addEventListener('click', () => {
    const scene = state.host?.scene;
    stopLive();
    scene?.start(SCENE_KEYS.TITLE);
  });
  refreshTop();
}

function refreshTop(): void {
  const mode = el('gp-live-mode');
  if (mode) mode.textContent = state.machine ? '🤖 Máy chơi' : '🙋 Người chơi';
  const dot = el('gp-live-dot');
  if (dot) {
    dot.textContent = state.demo ? '● THỬ (khán giả giả)' : '● LIVE';
    dot.classList.toggle('demo', state.demo);
  }
  const score = el('gp-live-score');
  if (score) score.textContent = `✅ ${state.wins}  ❌ ${state.losses}`;
  const id = state.host?.engine.stage.id;
  const stage = el('gp-live-stage');
  if (stage && id) stage.textContent = stageLabel(id);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function renderBoard(): void {
  const board = el('gp-live-board');
  if (!board) return;
  const top = [...state.scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  board.hidden = top.length === 0;
  board.innerHTML =
    `<div class="gp-live-board-title">🏆 Bạn giữ tiệm</div>` +
    top.map(([u, s], i) => `<div class="gp-live-row"><span>${['🥇', '🥈', '🥉', '4', '5'][i]}</span><b>${escapeHtml(u)}</b><i>${s}</i></div>`).join('');
}

function feed(html: string): void {
  const f = el('gp-live-feed');
  if (!f) return;
  const item = document.createElement('div');
  item.className = 'gp-live-msg';
  item.innerHTML = html;
  f.appendChild(item);
  while (f.children.length > 3) f.firstElementChild?.remove();
  window.setTimeout(() => item.remove(), 9000);
}

function banner(text: string, ms = 2600): void {
  const b = el('gp-live-banner');
  if (!b) return;
  b.textContent = text;
  b.classList.remove('show');
  void b.offsetWidth;
  b.classList.add('show');
  window.setTimeout(() => {
    if (b.textContent === text) b.classList.remove('show');
  }, ms);
}

function hearts(n: number): void {
  const h = el('gp-live-hearts');
  if (!h) return;
  for (let i = 0; i < Math.min(n, 8); i++) {
    const s = document.createElement('span');
    s.textContent = ['❤️', '💖', '💗', '🧡'][i % 4]!;
    s.style.left = `${10 + Math.random() * 60}%`;
    s.style.animationDelay = `${i * 90}ms`;
    h.appendChild(s);
    window.setTimeout(() => s.remove(), 2200 + i * 90);
  }
}

/* ---------- Khán giả ---------- */

function addScore(user: string, pts: number): void {
  state.scores.set(user, (state.scores.get(user) ?? 0) + pts);
  renderBoard();
}

export function pushLiveEvent(e: LiveEvent): void {
  if (!state.active || !e || !e.user) return;
  const user = String(e.user).slice(0, 24);
  const engine = state.host?.engine;
  const playing = engine?.status === 'playing';
  const n = Math.max(1, Math.min(999, Math.floor(e.count ?? 1)));
  switch (e.type) {
    case 'comment':
      addScore(user, 1);
      feed(`<b>${escapeHtml(user)}</b> ${escapeHtml(String(e.text ?? '').slice(0, 80))}`);
      break;
    case 'like':
      addScore(user, n);
      hearts(Math.ceil(n / 5));
      state.likeBank += n;
      while (state.likeBank >= 30) {
        state.likeBank -= 30;
        if (playing) {
          engine!.essence += 5;
          state.host?.liveLabel('❤️ +5 xu', '#ff9fb2');
        }
      }
      break;
    case 'gift': {
      addScore(user, n * 10);
      banner(`🎁 ${user} tặng quà → bùa làm chậm quái!`);
      if (playing) {
        engine!.essence += 20 * n;
        for (const q of engine!.enemies) {
          q.slowPercent = Math.max(q.slowPercent, 0.4);
          q.slowRemaining = Math.max(q.slowRemaining, 4);
        }
        state.host?.liveLabel(`🎁 +${20 * n} xu`, '#ffd76a');
      }
      break;
    }
    case 'follow':
      addScore(user, 5);
      feed(`⭐ <b>${escapeHtml(user)}</b> vừa theo dõi tiệm`);
      break;
    case 'share':
      addScore(user, 5);
      feed(`📣 <b>${escapeHtml(user)}</b> chia sẻ LIVE`);
      break;
    default:
      break;
  }
}

const DEMO_NAMES = ['Khách Thử 1', 'Khách Thử 2', 'Khách Thử 3', 'Khách Thử 4', 'Khách Thử 5', 'Khách Thử 6'];
const DEMO_TEXTS = ['đặt món Kim đi', 'quái đông quá', 'tiệm này ở đâu vậy', 'xe đẹp ghê', 'cố lên', 'phố này mình hay đi'];

function setDemo(on: boolean): void {
  state.demo = on;
  window.clearInterval(state.demoTimer);
  if (on) {
    state.demoTimer = window.setInterval(() => {
      const user = DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)]!;
      const r = Math.random();
      if (r < 0.45) pushLiveEvent({ type: 'like', user, count: 5 + Math.floor(Math.random() * 20) });
      else if (r < 0.85) pushLiveEvent({ type: 'comment', user, text: DEMO_TEXTS[Math.floor(Math.random() * DEMO_TEXTS.length)] });
      else if (r < 0.93) pushLiveEvent({ type: 'follow', user });
      else pushLiveEvent({ type: 'gift', user, count: 1 });
    }, 1800);
  }
  refreshTop();
}

function connectWs(url: string): void {
  try {
    const ws = new WebSocket(url);
    state.ws = ws;
    ws.onmessage = (m) => {
      try {
        pushLiveEvent(JSON.parse(String(m.data)) as LiveEvent);
      } catch {
        /* bỏ qua tin lạ */
      }
    };
    ws.onclose = () => {
      state.ws = null;
      if (state.active) window.setTimeout(() => connectWs(url), 5000);
    };
  } catch {
    /* không nối được thì thôi */
  }
}

/* ---------- Điều khiển màn ---------- */

async function goToStage(scene: Phaser.Scenes.ScenePlugin): Promise<void> {
  const list = livePlaylist();
  state.index = ((state.index % list.length) + list.length) % list.length;
  try {
    localStorage.setItem(IDX_KEY, String(state.index));
  } catch {
    /* bỏ qua */
  }
  const id = list[state.index]!;
  const def = STAGES[id];
  banner(`🧠 Máy đang tính nước đi… ${stageLabel(id)}`, 1800);
  const gear = expectedGearForStage(id);
  const loadout = def.defaultLoadout as TowerId[] | undefined;
  const choice = await pickBestPlan(def, { gear, loadout }, 12);
  if (!state.active) return;
  scene.start(SCENE_KEYS.TD_STAGE, { stageId: id, loadout, live: { plan: choice.plan, gear } satisfies LiveStageData });
}

/**
 * opts.clean: quay clip cho kênh Gọn — máy vẫn tự chơi nối màn nhưng ẩn hết khung LIVE (?quay=<mã màn>).
 * opts.stageId: bắt đầu từ màn này.
 */
export function startLive(scene: Phaser.Scenes.ScenePlugin, opts: { clean?: boolean; stageId?: string } = {}): void {
  state.active = true;
  state.machine = true;
  try {
    state.index = Number(localStorage.getItem(IDX_KEY) ?? '0') || 0;
  } catch {
    state.index = 0;
  }
  const at = opts.stageId ? livePlaylist().indexOf(opts.stageId as StageId) : -1;
  if (at >= 0) state.index = at;
  mountOverlay();
  state.root?.classList.toggle('gp-live-clean', Boolean(opts.clean));
  const params = new URLSearchParams(window.location.search);
  const ws = params.get('ws');
  if (ws && /^wss?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(ws.endsWith('/') ? ws : `${ws}/`)) connectWs(ws);
  if (params.get('thu') === '1') setDemo(true);
  (window as unknown as { gonPhoLive?: unknown }).gonPhoLive = { push: pushLiveEvent };
  void goToStage(scene);
}

export function stopLive(): void {
  state.active = false;
  window.clearTimeout(state.nextTimer);
  setDemo(false);
  state.ws?.close();
  state.root?.remove();
  state.root = null;
  state.host = null;
}

/** TdStageScene gọi khi tạo màn trong lúc LIVE */
export function registerLiveHost(host: LiveHost, hasPlan: boolean): void {
  state.host = host;
  window.clearTimeout(state.nextTimer);
  refreshTop();
  if (state.machine && !hasPlan) void planForCurrent();
}

async function planForCurrent(): Promise<void> {
  const host = state.host;
  if (!host) return;
  const e = host.engine;
  const choice = await pickBestPlan(e.stage, { gear: e.gear, loadout: e.loadout ?? undefined }, 8);
  if (state.host === host && state.machine) host.setLivePlan(choice.plan);
}

function setMachine(on: boolean): void {
  state.machine = on;
  refreshTop();
  const host = state.host;
  if (!host) return;
  if (!on) {
    window.clearTimeout(state.nextTimer);
    host.setLivePlan(null);
    banner('🙋 Người chơi cầm máy', 1600);
  } else {
    banner('🤖 Máy chơi tiếp', 1600);
    if (host.engine.status === 'playing') void planForCurrent();
    else scheduleNext(host.scene, 1500);
  }
}

function scheduleNext(scene: Phaser.Scenes.ScenePlugin, ms: number): void {
  window.clearTimeout(state.nextTimer);
  state.nextTimer = window.setTimeout(() => {
    if (state.active && state.machine) void goToStage(scene);
  }, ms);
}

/** TdStageScene gọi khi màn kết thúc */
export function liveOnStageEnd(won: boolean): void {
  const host = state.host;
  if (!host) return;
  if (won) state.wins++;
  else state.losses++;
  refreshTop();
  banner(won ? '🎉 Giữ tiệm thành công!' : '😵 Thua rồi — qua màn khác gỡ lại', 3000);
  const list = livePlaylist();
  const idx = list.indexOf(host.engine.stage.id);
  state.index = (idx >= 0 ? idx : state.index) + 1;
  if (state.machine) scheduleNext(host.scene, 7000);
}
