/**
 * Mã mời (anh Kha 26/11/2026 — lộ trình phát hành, Giai đoạn 1 "thử nội bộ, không mở link công khai"):
 * link web vẫn chạy nhưng người mới phải nhập mã mời mới vào chơi. Mã chỉ lưu dạng băm (SHA-256), không ghi mã thật trong kho.
 * Gửi bạn bè: https://gon-pho.pages.dev/#moi=<MÃ> (tự nhận mã) hoặc đưa mã để nhập tay.
 * Được vào không cần mã: máy đã có tiến độ (người chơi cũ), máy đã nhập mã, chạy thử tự động, quay video (?quay=), máy chạy tại chỗ.
 * Thêm mã: băm chữ IN HOA bằng SHA-256, thêm vào INVITE_HASHES.
 */
import { TD_SAVE_KEY } from '../core/saveSystem';

const INVITE_HASHES = new Set([
  '4068df64607530bbdae2e48722601ad192c7a2d2ce01223808eeee8188e0164d',
  '7d66962520ce5706f419ea5127516d2ea841789d71b36054586e45ba0263c4c7',
  '9e6f3854def188545fb543638ebcc47a50ffa59c4f2ee3a85479de326330d9d2',
]);
const OK_KEY = 'gonpho_moi';

function ls(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}

/** SHA-256 viết tay: dùng khi trình duyệt không có crypto.subtle (trang không https, máy cũ) */
function sha256Js(msg: string): string {
  const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const bytes = Array.from(new TextEncoder().encode(msg));
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 7; i >= 0; i--) bytes.push(i >= 4 ? 0 : (bitLen >>> (i * 8)) & 0xff);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < bytes.length; off += 64) {
    const w = new Array<number>(64);
    for (let i = 0; i < 16; i++) w[i] = (bytes[off + i * 4]! << 24) | (bytes[off + i * 4 + 1]! << 16) | (bytes[off + i * 4 + 2]! << 8) | bytes[off + i * 4 + 3]!;
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15]!, 7) ^ rotr(w[i - 15]!, 18) ^ (w[i - 15]! >>> 3);
      const s1 = rotr(w[i - 2]!, 17) ^ rotr(w[i - 2]!, 19) ^ (w[i - 2]! >>> 10);
      w[i] = (w[i - 16]! + s0 + w[i - 7]! + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H as [number, number, number, number, number, number, number, number];
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i]! + w[i]!) | 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    [a, b, c, d, e, f, g, h].forEach((v, i) => (H[i] = (H[i]! + v) | 0));
  }
  return H.map((v) => (v >>> 0).toString(16).padStart(8, '0')).join('');
}

async function sha256(s: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    /* rơi xuống bản viết tay */
  }
  return sha256Js(s);
}

export const __sha256ForTest = sha256Js;

export async function checkInvite(code: string): Promise<boolean> {
  const c = code.trim().toUpperCase();
  if (!c) return false;
  return INVITE_HASHES.has(await sha256(c));
}

function freePass(): boolean {
  if (ls(OK_KEY) === '1' || ls(TD_SAVE_KEY)) return true;
  if (typeof navigator !== 'undefined' && navigator.webdriver) return true;
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return true;
  const q = new URLSearchParams(location.search);
  return Boolean(q.get('quay'));
}

/** Gọi trước khi mở game: có quyền thì chạy start ngay, chưa có thì hiện ô nhập mã mời */
export async function requireInvite(start: () => void): Promise<void> {
  const m = location.hash.match(/^#moi=([A-Za-z0-9-]{4,40})$/);
  if (m) {
    history.replaceState(null, '', location.pathname + location.search);
    if (await checkInvite(m[1]!)) {
      try {
        localStorage.setItem(OK_KEY, '1');
      } catch {
        /* bỏ qua */
      }
    }
  }
  if (freePass()) return start();
  const box = document.createElement('div');
  box.className = 'td-invite';
  box.innerHTML = `
    <div class="td-invite-card">
      <h1>Gọn Phố</h1>
      <p>Game đang <b>chơi thử nội bộ</b> với bạn bè, chưa phát hành công khai.</p>
      <p>Có mã mời thì nhập vào đây:</p>
      <input id="td-invite-code" autocomplete="off" autocapitalize="characters" placeholder="GONPHO-XXXXX" />
      <button type="button" id="td-invite-go">Vào chơi</button>
      <div class="td-invite-msg" id="td-invite-msg"></div>
    </div>`;
  document.body.appendChild(box);
  const input = box.querySelector<HTMLInputElement>('#td-invite-code')!;
  const msg = box.querySelector<HTMLDivElement>('#td-invite-msg')!;
  const go = async () => {
    if (await checkInvite(input.value)) {
      try {
        localStorage.setItem(OK_KEY, '1');
      } catch {
        /* bỏ qua */
      }
      box.remove();
      start();
    } else {
      msg.textContent = 'Mã chưa đúng. Kiểm tra lại giúp nhé.';
    }
  };
  box.querySelector<HTMLButtonElement>('#td-invite-go')!.onclick = () => void go();
  input.onkeydown = (e) => {
    if (e.key === 'Enter') void go();
  };
}
