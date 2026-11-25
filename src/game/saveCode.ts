/**
 * 💾 Mã lưu (Claude, anh Kha "làm" 24/11): chuyển tiến độ sang máy khác, không cần tài khoản / máy chủ.
 * Mã = "GP1." + base64url( nén deflate( JSON các khoá tiến độ ) ) + "." + 6 ký tự kiểm tra.
 * Sau này lên online: dán mã 1 lần để chuyển vào tài khoản; đồ cũ thành loại "không trao đổi" (chặn gian lận).
 */
import qrcode from 'qrcode-generator';
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

/** Link mở game + tự chuyển tiến độ (bấm ở máy khác, hoặc quét mã QR) */
export function saveLink(code: string): string {
  const base = typeof location !== 'undefined' && location.origin.startsWith('http') ? `${location.origin}${location.pathname}` : 'https://gon-pho.pages.dev/';
  return `${base}#ma=${code}`;
}

/**
 * Ảnh thẻ QR (PNG) chứa link lưu: quét bằng camera máy khác là mở game + chuyển tiến độ (anh Kha 25/11).
 * Trả về dataURL để hiện và lưu thành ảnh.
 */
export function saveQrPng(link: string): string {
  const qr = qrcode(0, 'L');
  qr.addData(link);
  qr.make();
  const n = qr.getModuleCount();
  const cell = Math.max(4, Math.floor(520 / (n + 8)));
  const qrSize = cell * (n + 8);
  const W = qrSize + 40;
  const H = qrSize + 130;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff4dc';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#4a2e1a';
  g.font = 'bold 34px system-ui, sans-serif';
  g.textAlign = 'center';
  g.fillText('Gọn Phố — chơi tiếp', W / 2, 52);
  const ox = 20;
  const oy = 74;
  g.fillStyle = '#ffffff';
  g.fillRect(ox, oy, qrSize, qrSize);
  g.fillStyle = '#2b1a12';
  for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (qr.isDark(r, col)) g.fillRect(ox + (col + 4) * cell, oy + (r + 4) * cell, cell, cell);
  g.fillStyle = '#6b4a2e';
  g.font = '22px system-ui, sans-serif';
  g.fillText('Quét bằng camera máy khác để chuyển tiến độ', W / 2, H - 22);
  return c.toDataURL('image/png');
}

/** Mã lưu trong link đang mở (#ma=…), nếu có */
export function codeFromLocation(): string | null {
  if (typeof location === 'undefined') return null;
  const m = location.hash.match(/^#ma=(.+)$/);
  return m ? decodeURIComponent(m[1]!) : null;
}

export type ImportResult = { ok: true; keys: number } | { ok: false; reason: 'format' | 'broken' | 'empty' };

/** Đọc mã; chỉ ghi khi mã hợp lệ (ghi đè tiến độ máy này) */
/** Giải mã lưu → các khoá tiến độ (không ghi vào máy). null nếu sai / hỏng */
export async function decodeSaveCode(raw: string): Promise<Record<string, string> | null> {
  const code = raw.replace(/\s+/g, '');
  if (!code.startsWith(PREFIX)) return null;
  const rest = code.slice(PREFIX.length);
  const dot = rest.lastIndexOf('.');
  if (dot < 2) return null;
  const body = rest.slice(0, dot);
  if (check(body) !== rest.slice(dot + 1)) return null;
  try {
    let bytes = fromB64url(body.slice(1));
    if (body[0] === 'z') {
      if (!canZip) return null;
      bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
    }
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as { v: number; d: Record<string, string> };
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed.d ?? {})) {
      if (typeof v === 'string' && (k === TD_SAVE_KEY || EXTRA_KEYS.includes(k) || k.startsWith(REAL_STREET_LOADOUT_PREFIX))) out[k] = v;
    }
    if (!out[TD_SAVE_KEY]) return null;
    JSON.parse(out[TD_SAVE_KEY]); // tiến độ chính phải đọc được
    return out;
  } catch {
    return null;
  }
}

/** Các khoá tiến độ đang có trên máy */
export function readLocalSaveMap(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of progressKeys()) {
    const v = localStorage.getItem(k);
    if (v !== null) out[k] = v;
  }
  return out;
}

/** Thay toàn bộ tiến độ trên máy bằng bộ khoá này */
export function writeLocalSaveMap(map: Record<string, string>): void {
  for (const k of progressKeys()) localStorage.removeItem(k);
  for (const [k, v] of Object.entries(map)) localStorage.setItem(k, v);
}

export async function importSaveCode(raw: string): Promise<ImportResult> {
  const code = raw.replace(/\s+/g, '');
  if (!code.startsWith(PREFIX)) return { ok: false, reason: 'format' };
  const map = await decodeSaveCode(code);
  if (!map) return { ok: false, reason: 'broken' };
  try {
    writeLocalSaveMap(map);
    return { ok: true, keys: Object.keys(map).length };
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
