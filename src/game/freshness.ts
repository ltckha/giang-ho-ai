/**
 * Giữ mã game và hình luôn CÙNG 1 BẢN (anh Kha 27/11: "lệch tùm lum" — game mở sẵn từ trước khi phát hành
 * chạy dữ liệu màn cũ nhưng tải ảnh phòng mới, hoặc ngược lại: bản lưu chơi-không-mạng còn ảnh cũ).
 * - Mở bản mới lần đầu: xoá các bản lưu ảnh cũ (cache gon-tiem-*) để ảnh tải lại đúng bản.
 * - Quay lại game / về màn chính: hỏi version.json; có bản mới thì xoá bản lưu cũ rồi mở lại trang.
 *   Đang chơi dở 1 màn thì chờ về màn chính mới mở lại (không cắt ngang trận).
 */
declare const __BUILD_ID__: string;
const BUILD = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev';
const KEY = 'gonpho_build';

async function clearCaches(): Promise<void> {
  try {
    if (typeof caches === 'undefined') return;
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('gon-tiem-')).map((k) => caches.delete(k)));
  } catch {
    /* bỏ qua */
  }
}

/** Gọi đầu tiên trong main.ts */
export async function purgeStaleCaches(): Promise<void> {
  if (BUILD === 'dev') return;
  let prev: string | null = null;
  try {
    prev = localStorage.getItem(KEY);
  } catch {
    return;
  }
  if (prev === BUILD) return;
  if (prev !== null) await clearCaches();
  try {
    localStorage.setItem(KEY, BUILD);
  } catch {
    /* bỏ qua */
  }
}

let checking = false;
/** Có bản mới trên mạng thì xoá bản lưu cũ và mở lại trang. `canReload`: đang ở màn chính (không giữa trận). */
export async function checkForUpdate(canReload: () => boolean): Promise<void> {
  if (BUILD === 'dev' || checking || typeof fetch === 'undefined') return;
  checking = true;
  try {
    const res = await fetch('./version.json', { cache: 'no-store' });
    if (!res.ok) return;
    const { v } = (await res.json()) as { v?: string };
    if (!v || v === BUILD || !canReload()) return;
    // mỗi bản mới chỉ tự tải lại 1 lần (phòng khi mạng còn giữ trang cũ → không tải lại mãi)
    try {
      if (sessionStorage.getItem('gonpho_reload_for') === v) return;
      sessionStorage.setItem('gonpho_reload_for', v);
    } catch {
      return;
    }
    await clearCaches();
    try {
      const regs = await navigator.serviceWorker?.getRegistrations();
      await Promise.all((regs ?? []).map((r) => r.update().catch(() => {})));
    } catch {
      /* bỏ qua */
    }
    location.reload();
  } catch {
    /* mất mạng: chơi tiếp bản đang có */
  } finally {
    checking = false;
  }
}
