import { beforeEach, describe, expect, it } from 'vitest';
import { handleLuu, resetTableFlag, type D1Like } from '../src/server/luuHandler';

/** D1 giả trong bộ nhớ: chỉ hiểu đúng 3 câu lệnh máy chủ dùng */
function fakeDb(): D1Like & { rows: Map<string, { t: number; data: string }> } {
  const rows = new Map<string, { t: number; data: string }>();
  return {
    rows,
    prepare(sql: string) {
      const exec = async (args: unknown[]) => {
        if (sql.startsWith('INSERT')) {
          const [k, t, data] = args as [string, number, string];
          const cur = rows.get(k);
          if (!cur || t > cur.t) rows.set(k, { t, data });
        }
        return {};
      };
      return {
        run: () => exec([]),
        bind: (...args: unknown[]) => ({
          run: () => exec(args),
          first: async <T,>() => (sql.startsWith('SELECT') ? ((rows.get(args[0] as string) as T) ?? null) : null),
        }),
      };
    },
  };
}

const K = 'a'.repeat(32);
const req = (method: string, k = K, body?: unknown) =>
  new Request(`https://gon-pho.pages.dev/api/luu?k=${k}`, { method, body: body === undefined ? undefined : JSON.stringify(body) });

describe('Máy chủ lưu theo QR chìa khoá', () => {
  beforeEach(() => resetTableFlag());

  it('chưa gắn cơ sở dữ liệu → 503 (game vẫn chơi bình thường)', async () => {
    expect((await handleLuu(req('GET'), undefined)).status).toBe(503);
  });

  it('chìa khoá sai dạng → 400', async () => {
    expect((await handleLuu(req('GET', 'abc'), fakeDb())).status).toBe(400);
  });

  it('ghi rồi đọc lại; bản cũ hơn không đè bản mới', async () => {
    const db = fakeDb();
    expect((await handleLuu(req('GET'), db)).status).toBe(404);
    expect((await handleLuu(req('PUT', K, { t: 200, data: 'GP1.moi' }), db)).status).toBe(200);
    await handleLuu(req('PUT', K, { t: 100, data: 'GP1.cu' }), db);
    const r = await handleLuu(req('GET'), db);
    expect(await r.json()).toEqual({ t: 200, data: 'GP1.moi' });
    expect(r.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('dữ liệu sai định dạng / quá lớn bị từ chối', async () => {
    const db = fakeDb();
    expect((await handleLuu(req('PUT', K, { t: 'x', data: 1 }), db)).status).toBe(400);
    expect((await handleLuu(req('PUT', K, { t: 1, data: 'x'.repeat(250_000) }), db)).status).toBe(413);
  });
});
