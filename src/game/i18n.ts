/**
 * Bản quốc tế "Little Shops of Dalat" — đổi chữ Việt → Anh ngay lúc hiện lên màn hình.
 *
 * Cách chạy: game vẫn viết chữ tiếng Việt như cũ. Khi chọn English, một "người phiên dịch"
 * canh toàn bộ trang (MutationObserver) và thay mỗi đoạn chữ / title / aria-label bằng bản dịch
 * trong src/i18n/en.json. Không phải sửa từng chỗ viết chữ trong game.
 *
 * Khoá từ điển: chữ đã gộp khoảng trắng. Khoá có {0}, {1}… là mẫu (chữ có số / tên chen giữa);
 * phần chen giữa cũng được dịch nếu có trong từ điển. Thêm chữ mới vào game → chạy
 * `node tools/i18n/extract.cjs` → dịch các khoá trong tools/i18n/missing.json → thêm vào en.json.
 */

import { TD_SAVE_KEY } from '../core/saveSystem';
import { currentRegion } from './region';

export type Lang = 'vi' | 'en';

const LANG_KEY = 'gonpho_lang';
export const EN_TITLE = 'Little Shops of Dalat';

const VN_RE =
  /[ạảãàáâầấậẩẫăằắặẳẵđèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹĐÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĨŨƠƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀẾỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴỶỸÝ]/;
/** Chữ Việt không dấu vẫn cần dịch (không bắt được bằng dấu) */
const ASCII_KEYS = /(?<!\p{L})(?:Kim|xu|Xu|tim|Tim|Sinh|Kem|Hoa|Atiso)(?!\p{L})/u;

let lang: Lang = 'vi';
let exact = new Map<string, string>();
/** Chữ IN HOA (code tự viết hoa tên tiệm) → bản dịch IN HOA */
let exactUpper = new Map<string, string>();
let patterns: { re: RegExp; out: string; weight: number }[] = [];
const memo = new Map<string, string>();
/** Chữ dịch xong còn dấu tiếng Việt — xem bằng window.__i18nMiss khi kiểm tra */
const misses = new Map<string, string>();
if (typeof window !== 'undefined') (window as unknown as { __i18nMiss?: Map<string, string> }).__i18nMiss = misses;
const produced = new WeakMap<Node, string>();
const producedAttr = new WeakMap<Element, Map<string, string>>();

function readStored(): string | null {
  try {
    return localStorage.getItem(LANG_KEY);
  } catch {
    return null;
  }
}

/** Chọn tiếng: ?lang= > đã chọn trước > bản VN > người chơi cũ (đã có tiến độ) > tiếng máy */
export function detectLang(): Lang {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'en' || q === 'vi') return q;
  } catch {
    /* bỏ qua */
  }
  const s = readStored();
  if (s === 'en' || s === 'vi') return s;
  if (currentRegion() === 'vn') return 'vi';
  try {
    if (localStorage.getItem(TD_SAVE_KEY)) return 'vi';
  } catch {
    /* bỏ qua */
  }
  // Chạy thử tự động / quay video / LIVE: giữ tiếng Việt (muốn tiếng Anh thì ?lang=en)
  if (typeof navigator !== 'undefined' && navigator.webdriver) return 'vi';
  try {
    const q = new URLSearchParams(location.search);
    if (q.has('quay') || q.has('live')) return 'vi';
  } catch {
    /* bỏ qua */
  }
  // Máy đặt giờ Việt Nam (kể cả điện thoại để tiếng Anh) → tiếng Việt
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (/^Asia\/(Ho_Chi_Minh|Saigon)$/.test(tz)) return 'vi';
  } catch {
    /* bỏ qua */
  }
  const nav = (typeof navigator !== 'undefined' && (navigator.languages?.[0] || navigator.language)) || 'vi';
  return /^vi\b/i.test(nav) ? 'vi' : 'en';
}

export function currentLang(): Lang {
  return lang;
}

/** Đổi tiếng rồi mở lại trang (mọi chữ hiện lại theo tiếng mới) */
export function switchLang(next: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, next);
  } catch {
    /* bỏ qua */
  }
  const u = new URL(location.href);
  u.searchParams.delete('lang');
  location.replace(u.toString());
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function loadDictionary(dict: Record<string, string>): void {
  exact = new Map();
  exactUpper = new Map();
  patterns = [];
  memo.clear();
  for (const [k, v] of Object.entries(dict)) {
    if (/\{\d+\}/.test(k)) {
      const order: number[] = [];
      const src = k
        .split(/(\{\d+\})/)
        .map((part) => {
          const m = /^\{(\d+)\}$/.exec(part);
          if (m) {
            order.push(Number(m[1]));
            return '(.*?)';
          }
          return escapeRe(part);
        })
        .join('');
      // {n} trong bản dịch → nhóm bắt số mấy
      let out = v;
      order.forEach((n, gi) => {
        out = out.split(`{${n}}`).join(`\u0000${gi + 1}\u0000`);
      });
      patterns.push({ re: new RegExp(`^${src}$`, 's'), out, weight: k.replace(/\{\d+\}/g, '').length });
    } else {
      exact.set(k, v);
      const up = k.toUpperCase();
      if (up !== k && !exactUpper.has(up)) exactUpper.set(up, v.toUpperCase());
    }
  }
  patterns.sort((a, b) => b.weight - a.weight);
}

function needs(s: string): boolean {
  return VN_RE.test(s) || ASCII_KEYS.test(s);
}

/** Dịch 1 đoạn chữ (giữ khoảng trắng đầu / cuối) — không có trong từ điển thì để nguyên */
export function tr(s: string): string {
  if (lang === 'vi' || !s || !needs(s)) return s;
  const hit = memo.get(s);
  if (hit !== undefined) return hit;
  const lead = /^\s*/.exec(s)![0];
  const tail = /\s*$/.exec(s)![0];
  const core = norm(s);
  const res = lead + translateCore(core, 0) + tail;
  // Ghi lại chữ dịch xong vẫn còn dấu tiếng Việt (tên thật hoặc chữ sót) để kiểm tra tìm chỗ sót
  if (VN_RE.test(res) && misses.size < 500) misses.set(core, res.trim());
  if (memo.size > 20000) memo.clear();
  memo.set(s, res);
  return res;
}

function translateCore(core: string, depth: number): string {
  const ex = exact.get(core);
  if (ex !== undefined) return ex;
  const exU = core === core.toUpperCase() ? exactUpper.get(core) : undefined;
  if (exU !== undefined) return exU;
  if (depth > 6) return core;
  for (const p of patterns) {
    const m = p.re.exec(core);
    if (!m) continue;
    return p.out.replace(/\u0000(\d+)\u0000/g, (_, g) => {
      const part = m[Number(g)] ?? '';
      return needs(part) ? translateCore(part.trim(), depth + 1) : part;
    });
  }
  return fallback(core, depth);
}

/** Ký hiệu / số đứng đầu, cuối ("▶ ", "1. ", " ✔") */
const AFFIX = /^([^\p{L}"“'(]*)([\s\S]*?)([^\p{L}"”')%]*)$/u;
/** Chỗ nối các mảnh code ghép bằng tay, thử từ lớn tới nhỏ: "Tên: mô tả", "Mũ (Tốt, Mộc)", "Sức 4%" */
const SEPS = [/(:\s+|\s+[·•—–-]\s+)/, /(,\s+|\s*\(|\)\s*)/, /(\s+(?=[+\-−]?\d)|(?<=\d%?)\s+)/];

/** Không có trong từ điển: bỏ ký hiệu đầu / cuối, hoặc cắt theo dấu nối rồi dịch từng mảnh */
function fallback(core: string, depth: number): string {
  if (depth > 6) return core;
  const a = AFFIX.exec(core);
  if (a && (a[1] || a[3]) && a[2]) {
    const mid = translateCore(a[2], depth + 1);
    if (mid !== a[2]) return a[1] + mid + a[3];
  }
  for (const sep of SEPS) {
    const parts = core.split(sep);
    if (parts.length < 2) continue;
    let changed = false;
    const out = parts.map((p, i) => {
      if (i % 2 === 1 || !p || !needs(p)) return p;
      const t = translateCore(p.trim(), depth + 1);
      if (t !== p.trim()) changed = true;
      return t;
    });
    if (changed) return out.join('');
  }
  return core;
}

const ATTRS = ['title', 'aria-label', 'placeholder', 'alt', 'data-tip'];

function doText(node: Text): void {
  const v = node.data;
  if (produced.get(node) === v || !needs(v)) return;
  const out = tr(v);
  produced.set(node, out);
  if (out !== v) node.data = out;
}

function doAttr(el: Element, name: string): void {
  const v = el.getAttribute(name);
  if (!v || !needs(v)) return;
  const seen = producedAttr.get(el);
  if (seen?.get(name) === v) return;
  const out = tr(v);
  (seen ?? producedAttr.set(el, new Map()).get(el)!).set(name, out);
  if (out !== v) el.setAttribute(name, out);
}

function walk(root: Node): void {
  if (root.nodeType === Node.TEXT_NODE) {
    doText(root as Text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
  const el = root as Element;
  if (el.nodeType === Node.ELEMENT_NODE) {
    const tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE') return;
    for (const a of ATTRS) if (el.hasAttribute(a)) doAttr(el, a);
  }
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n = tw.nextNode();
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) doText(n as Text);
    else for (const a of ATTRS) if ((n as Element).hasAttribute(a)) doAttr(n as Element, a);
    n = tw.nextNode();
  }
}

function patchDialogs(): void {
  const w = window as unknown as Record<string, unknown>;
  for (const name of ['alert', 'confirm'] as const) {
    const orig = window[name].bind(window) as (m?: string) => unknown;
    w[name] = (m?: string) => orig(typeof m === 'string' ? tr(m) : m);
  }
}

function applyDocumentChrome(): void {
  document.documentElement.lang = 'en';
  document.title = `${EN_TITLE} — Five Elements shop defense`;
  const man = document.querySelector('link[rel="manifest"]');
  if (man) man.setAttribute('href', './manifest.en.webmanifest');
  const apple = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (apple) apple.setAttribute('content', EN_TITLE);
}

/**
 * Gọi đầu tiên trong main.ts. Tiếng Việt: không làm gì. English: tải từ điển (tệp riêng,
 * người chơi tiếng Việt không phải tải) rồi canh trang để dịch.
 */
export async function initI18n(): Promise<Lang> {
  lang = detectLang();
  if (lang === 'vi') return lang;
  try {
    const dict = (await import('../i18n/en.json')).default as Record<string, string>;
    loadDictionary(dict);
  } catch {
    lang = 'vi';
    return lang;
  }
  applyDocumentChrome();
  patchDialogs();
  walk(document.body);
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') doText(m.target as Text);
      else if (m.type === 'attributes') doAttr(m.target as Element, m.attributeName!);
      else m.addedNodes.forEach(walk);
    }
  }).observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRS,
  });
  return lang;
}

/** Dùng trong kiểm thử: bật tiếng Anh với từ điển cho sẵn */
export function __setLangForTest(l: Lang, dict?: Record<string, string>): void {
  lang = l;
  if (dict) loadDictionary(dict);
}
