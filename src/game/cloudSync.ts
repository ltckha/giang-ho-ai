/**
 * 🔑 QR chìa khoá — lưu 1 lần, tự đồng bộ (Claude, anh Kha "làm" 25/11/2026).
 * QR chứa link …#khoa=<32 ký tự ngẫu nhiên>. Tiến độ nằm trên máy chủ (Cloudflare Pages Functions + D1, src/server/luuHandler.ts).
 * - Thắng màn / về màn chính: gửi tiến độ lên (bản mới nhất thắng).
 * - Mở game: nếu máy chủ có bản mới hơn lần đồng bộ trước của máy này → tải về.
 * - App sau này (gói từ bản web) gọi cùng máy chủ qua API_BASE.
 * Không giữ thông tin cá nhân. Máy chủ chưa bật / mất mạng: game vẫn chơi bình thường, chỉ tạm không đồng bộ.
 */
import { exportSaveCode, importSaveCode } from './saveCode';

const KEY = 'gonpho_khoa';
const SYNCED_T = 'gonpho_khoa_t';
const KEY_RE = /^[a-f0-9]{32}$/;

function apiBase(): string {
  if (typeof location !== 'undefined' && /^https?:$/.test(location.protocol) && !/localhost|127\.0\.0\.1/.test(location.hostname)) return '';
  return 'https://gon-pho.pages.dev';
}

function ls(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function lsSet(k: string, v: string): void {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* bỏ qua */
  }
}

export function getSyncKey(): string | null {
  const k = ls(KEY);
  return k && KEY_RE.test(k) ? k : null;
}

export function newSyncKey(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  const k = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  lsSet(KEY, k);
  lsSet(SYNCED_T, '0');
  return k;
}

export function setSyncKey(k: string): boolean {
  if (!KEY_RE.test(k)) return false;
  lsSet(KEY, k);
  lsSet(SYNCED_T, '0');
  return true;
}

export function keyLink(k: string): string {
  const base = typeof location !== 'undefined' && location.origin.startsWith('http') && !/localhost|127\.0\.0\.1/.test(location.hostname)
    ? `${location.origin}${location.pathname}`
    : 'https://gon-pho.pages.dev/';
  return `${base}#khoa=${k}`;
}

export function keyFromLocation(): string | null {
  if (typeof location === 'undefined') return null;
  const m = location.hash.match(/^#khoa=([a-f0-9]{32})$/);
  return m ? m[1]! : null;
}

export function lastSyncedAt(): number {
  return Number(ls(SYNCED_T) ?? '0') || 0;
}

export type SyncResult = 'ok' | 'off' | 'loi';

/** Gửi tiến độ máy này lên */
export async function pushProgress(): Promise<SyncResult> {
  const k = getSyncKey();
  if (!k) return 'off';
  try {
    const t = Date.now();
    const data = await exportSaveCode();
    const r = await fetch(`${apiBase()}/api/luu?k=${k}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ t, data }) });
    if (r.status === 503 || r.status === 404) return 'off';
    if (!r.ok) return 'loi';
    lsSet(SYNCED_T, String(t));
    return 'ok';
  } catch {
    return 'loi';
  }
}

/** Tải bản trên máy chủ nếu mới hơn lần đồng bộ trước (force: lấy luôn, dùng khi vừa quét QR) */
export async function pullProgress(force = false): Promise<'applied' | 'same' | 'none' | SyncResult> {
  const k = getSyncKey();
  if (!k) return 'off';
  try {
    const r = await fetch(`${apiBase()}/api/luu?k=${k}`, { cache: 'no-store' });
    if (r.status === 404) return 'none';
    if (r.status === 503) return 'off';
    if (!r.ok) return 'loi';
    const body = (await r.json()) as { t: number; data: string };
    if (!force && body.t <= lastSyncedAt()) return 'same';
    const res = await importSaveCode(body.data);
    if (!res.ok) return 'loi';
    lsSet(SYNCED_T, String(body.t));
    return 'applied';
  } catch {
    return 'loi';
  }
}
