/**
 * Máy chủ lưu tiến độ theo "chìa khoá QR" (Claude, anh Kha "làm" 25/11/2026).
 * Chạy trong Cloudflare Pages Functions (functions/api/luu.ts), cơ sở dữ liệu D1 gắn tên DB.
 * - Chỉ giữ tiến độ game (sao, đồ, xe…) theo chìa khoá ngẫu nhiên 32 ký tự; không giữ thông tin cá nhân.
 * - GET  /api/luu?k=<khoá>  → { t, data } hoặc 404
 * - PUT  /api/luu?k=<khoá>  body { base, data } → ghi khi base = giờ bản đang có; máy chủ tự đóng dấu giờ. Lệch → 409 { t, data }
 * Viết thuần (Request → Response) để kiểm thử được bằng vitest với DB giả.
 */

export interface D1Like {
  prepare(sql: string): {
    bind(...v: unknown[]): { first<T = unknown>(): Promise<T | null>; run(): Promise<unknown> };
    run(): Promise<unknown>;
  };
}

export const KEY_RE = /^[a-f0-9]{32}$/;
export const MAX_BYTES = 200_000;
/** Chỉ nhận mã lưu của game (GP1.<z|j><base64url>.<6 ký tự kiểm>) — không làm kho chứa đồ lạ */
export const SAVE_RE = /^GP1\.[zj][A-Za-z0-9_-]{8,}\.[0-9a-z]{6}$/;

/** Cho phép app (gói từ bản web, chạy ở địa chỉ khác) gọi cùng máy chủ — chìa khoá là bí mật nên mở mọi nguồn được */
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, PUT, OPTIONS', 'access-control-allow-headers': 'content-type' };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...CORS },
  });

let tableReady = false;
async function ensureTable(db: D1Like): Promise<void> {
  if (tableReady) return;
  await db.prepare('CREATE TABLE IF NOT EXISTS luu (khoa TEXT PRIMARY KEY, t INTEGER NOT NULL, data TEXT NOT NULL)').run();
  tableReady = true;
}

/** Cho kiểm thử: làm như lần chạy đầu */
export function resetTableFlag(): void {
  tableReady = false;
}

export async function handleLuu(request: Request, db: D1Like | undefined): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (!db) return json({ loi: 'chua_bat_may_chu' }, 503);
  const url = new URL(request.url);
  const khoa = url.searchParams.get('k') ?? '';
  if (!KEY_RE.test(khoa)) return json({ loi: 'khoa_sai' }, 400);
  await ensureTable(db);

  if (request.method === 'GET') {
    const row = await db.prepare('SELECT t, data FROM luu WHERE khoa = ?1').bind(khoa).first<{ t: number; data: string }>();
    return row ? json({ t: row.t, data: row.data }) : json({ loi: 'khong_co' }, 404);
  }

  if (request.method === 'PUT') {
    // Đánh giá độc lập 25/11 (C2, V8): máy chủ tự đóng dấu giờ, không tin giờ máy người chơi;
    // chỉ nhận đúng mã lưu GP1; ghi khi máy gửi đã thấy đúng bản đang có (base) — lệch thì trả 409 kèm bản hiện có để máy gộp rồi gửi lại.
    const text = await request.text();
    if (text.length > MAX_BYTES) return json({ loi: 'qua_lon' }, 413);
    let body: { base?: unknown; data?: unknown };
    try {
      body = JSON.parse(text) as { base?: unknown; data?: unknown };
    } catch {
      return json({ loi: 'sai_dinh_dang' }, 400);
    }
    if (typeof body.data !== 'string' || !SAVE_RE.test(body.data)) return json({ loi: 'sai_dinh_dang' }, 400);
    const base = typeof body.base === 'number' && Number.isSafeInteger(body.base) && body.base >= 0 ? body.base : null;
    const row = await db.prepare('SELECT t, data FROM luu WHERE khoa = ?1').bind(khoa).first<{ t: number; data: string }>();
    if (row && base !== row.t) return json({ loi: 'lech', t: row.t, data: row.data }, 409);
    const t = Math.max(Date.now(), (row?.t ?? 0) + 1);
    if (row) {
      await db.prepare('UPDATE luu SET t = ?2, data = ?3 WHERE khoa = ?1 AND t = ?4').bind(khoa, t, body.data, row.t).run();
    } else {
      await db.prepare('INSERT INTO luu (khoa, t, data) VALUES (?1, ?2, ?3) ON CONFLICT(khoa) DO NOTHING').bind(khoa, t, body.data).run();
    }
    // máy khác vừa ghi chen giữa → báo lệch
    const now = await db.prepare('SELECT t, data FROM luu WHERE khoa = ?1').bind(khoa).first<{ t: number; data: string }>();
    if (!now || now.t !== t) return json({ loi: 'lech', t: now?.t ?? 0, data: now?.data ?? '' }, 409);
    return json({ ok: true, t });
  }

  return json({ loi: 'khong_ho_tro' }, 405);
}
