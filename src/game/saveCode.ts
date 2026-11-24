/**
 * 💾 Mã lưu (Claude, anh Kha "làm" 24/11): chuyển tiến độ sang máy khác, không cần tài khoản / máy chủ.
 * Mã = "GP1." + base64url( nén deflate( JSON các khoá tiến độ ) ) + "." + 6 ký tự kiểm tra.
 * Sau này lên online: dán mã 1 lần để chuyển vào tài khoản; đồ cũ thành loại "không trao đổi" (chặn gian lận).
 */
import { TD_SAVE_KEY } from '../core/saveSystem';
import { REAL_STREET_LOADOUT_PREFIX } from './preferences';

const PREFIX = 'GP1.';
const EXTRA_KEYS = ['gonpho_da_gap'];

function progressKeys(): string[] {
  const keys = [TD_SAVE_KEY, ...EXTRA_KEYS];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(REAL_STREET_LOADOUT_PREFIX)) keys.push(k);
  }
  return keys;
}

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

/** Mã kiểm tra ngắn để báo sớm khi dán thiếu / sai */
function check(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(36).padStart(6, '0').slice(-6);
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const res = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

const canZip = typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

export function hasProgress(): boolean {
  try {
    return Boolean(localStorage.getItem(TD_SAVE_KEY));
  } catch {
    return false;
  }
}

export async function exportSaveCode(): Promise<string> {
  const data: Record<string, string> = {};
  for (const k of progressKeys()) {
    const v = localStorage.getItem(k);
    if (v !== null) data[k] = v;
  }
  const json = new TextEncoder().encode(JSON.stringify({ v: 1, t: Date.now(), d: data }));
  const body = canZip ? 'z' + b64url(await pipe(json, new CompressionStream('deflate-raw'))) : 'j' + b64url(json);
  return `${PREFIX}${body}.${check(body)}`;
}

export type ImportResult = { ok: true; keys: number } | { ok: false; reason: 'format' | 'broken' | 'empty' };

/** Đọc mã; chỉ ghi khi mã hợp lệ (ghi đè tiến độ máy này) */
export async function importSaveCode(raw: string): Promise<ImportResult> {
  const code = raw.replace(/\s+/g, '');
  if (!code.startsWith(PREFIX)) return { ok: false, reason: 'format' };
  const rest = code.slice(PREFIX.length);
  const dot = rest.lastIndexOf('.');
  if (dot < 2) return { ok: false, reason: 'format' };
  const body = rest.slice(0, dot);
  if (check(body) !== rest.slice(dot + 1)) return { ok: false, reason: 'broken' };
  try {
    let bytes = fromB64url(body.slice(1));
    if (body[0] === 'z') {
      if (!canZip) return { ok: false, reason: 'broken' };
      bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
    }
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as { v: number; d: Record<string, string> };
    const entries = Object.entries(parsed.d ?? {}).filter(
      ([k, v]) => typeof v === 'string' && (k === TD_SAVE_KEY || EXTRA_KEYS.includes(k) || k.startsWith(REAL_STREET_LOADOUT_PREFIX)),
    );
    if (!entries.some(([k]) => k === TD_SAVE_KEY)) return { ok: false, reason: 'empty' };
    JSON.parse(parsed.d[TD_SAVE_KEY]!); // tiến độ chính phải đọc được
    for (const k of progressKeys()) localStorage.removeItem(k);
    for (const [k, v] of entries) localStorage.setItem(k, v);
    return { ok: true, keys: entries.length };
  } catch {
    return { ok: false, reason: 'broken' };
  }
}

/** Xin trình duyệt giữ dữ liệu lâu dài (Chrome / Android chấp nhận khi game được cài hoặc hay mở) */
export function requestPersistentStorage(): void {
  try {
    void navigator.storage?.persist?.();
  } catch {
    /* không hỗ trợ thì thôi */
  }
}

export function isInstalledApp(): boolean {
  return (
    (typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches) ||
    Boolean((navigator as unknown as { standalone?: boolean }).standalone)
  );
}

export function isIOS(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Nhớ lời mời cài của Chrome / Android để bấm nút "Cài" */
let deferredInstall: { prompt: () => Promise<void> } | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e as unknown as { prompt: () => Promise<void> };
  });
}

export function canPromptInstall(): boolean {
  return deferredInstall !== null;
}

export async function promptInstall(): Promise<void> {
  const d = deferredInstall;
  deferredInstall = null;
  await d?.prompt();
}
