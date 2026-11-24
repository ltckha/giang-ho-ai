/**
 * Máy chủ lưu tiến độ theo "chìa khoá QR" (Claude, anh Kha "làm" 25/11/2026).
 * Chạy trong Cloudflare Pages Functions (functions/api/luu.ts), cơ sở dữ liệu D1 gắn tên DB.
 * - Chỉ giữ tiến độ game (sao, đồ, xe…) theo chìa khoá ngẫu nhiên 32 ký tự; không giữ thông tin cá nhân.
 * - GET  /api/luu?k=<khoá>  → { t, data } hoặc 404
 * - PUT  /api/luu?k=<khoá>  body { t, data } → ghi nếu mới hơn bản đang có (bản mới nhất thắng)
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
    const text = await request.text();
    if (text.length > MAX_BYTES) return json({ loi: 'qua_lon' }, 413);
    let body: { t?: unknown; data?: unknown };
    try {
      body = JSON.parse(text) as { t?: unknown; data?: unknown };
    } catch {
      return json({ loi: 'sai_dinh_dang' }, 400);
    }
    if (typeof body.t !== 'number' || typeof body.data !== 'string') return json({ loi: 'sai_dinh_dang' }, 400);
    // Bản mới nhất thắng: chỉ ghi khi t mới hơn bản đang có
    await db
      .prepare('INSERT INTO luu (khoa, t, data) VALUES (?1, ?2, ?3) ON CONFLICT(khoa) DO UPDATE SET t = excluded.t, data = excluded.data WHERE excluded.t > luu.t')
      .bind(khoa, body.t, body.data)
      .run();
    return json({ ok: true });
  }

  return json({ loi: 'khong_ho_tro' }, 405);
}
