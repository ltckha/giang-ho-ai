import { beforeEach, describe, expect, it } from 'vitest';
import { handleLuu, resetTableFlag, type D1Like } from '../src/server/luuHandler';

/** D1 giả trong bộ nhớ: chỉ hiểu đúng các câu lệnh máy chủ dùng */
function fakeDb(): D1Like & { rows: Map<string, { t: number; data: string }> } {
  const rows = new Map<string, { t: number; data: string }>();
  return {
    rows,
    prepare(sql: string) {
      const exec = async (args: unknown[]) => {
        if (sql.startsWith('INSERT')) {
          const [k, t, data] = args as [string, number, string];
          if (!rows.has(k)) rows.set(k, { t, data });
        } else if (sql.startsWith('UPDATE')) {
          const [k, t, data, base] = args as [string, number, string, number];
          const cur = rows.get(k);
          if (cur && cur.t === base) rows.set(k, { t, data });
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

  const MA = (x: string) => `GP1.z${x.padEnd(12, 'A')}.abc123`;

  it('ghi rồi đọc lại; máy chủ tự đóng dấu giờ, không tin giờ máy gửi (đánh giá độc lập C2)', async () => {
    const db = fakeDb();
    expect((await handleLuu(req('GET'), db)).status).toBe(404);
    const w = await handleLuu(req('PUT', K, { base: 0, t: 9e15, data: MA('moi') }), db);
    expect(w.status).toBe(200);
    const { t } = (await w.json()) as { t: number };
    expect(t).toBeLessThan(Date.now() + 1000); // không nhận giờ 9e15 do máy khai
    const r = await handleLuu(req('GET'), db);
    expect(await r.json()).toEqual({ t, data: MA('moi') });
    expect(r.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('máy gửi bản dựa trên bản cũ → 409 kèm bản đang có, không đè (đánh giá độc lập C1)', async () => {
    const db = fakeDb();
    const a = (await (await handleLuu(req('PUT', K, { base: 0, data: MA('mayA') }), db)).json()) as { t: number };
    // máy B chưa từng đồng bộ (base 0) gửi bản cũ → bị từ chối, nhận bản của máy A để gộp
    const b = await handleLuu(req('PUT', K, { base: 0, data: MA('mayBcu') }), db);
    expect(b.status).toBe(409);
    expect(await b.json()).toMatchObject({ t: a.t, data: MA('mayA') });
    // gửi lại đúng base → ghi được
    expect((await handleLuu(req('PUT', K, { base: a.t, data: MA('gop') }), db)).status).toBe(200);
    expect(((await (await handleLuu(req('GET'), db)).json()) as { data: string }).data).toBe(MA('gop'));
  });

  it('chỉ nhận đúng mã lưu của game (đánh giá độc lập V8)', async () => {
    const db = fakeDb();
    expect((await handleLuu(req('PUT', K, { base: 0, data: 'kho chua do la' }), db)).status).toBe(400);
    expect((await handleLuu(req('PUT', K, { base: 0, data: '<script>x</script>' }), db)).status).toBe(400);
  });

  it('dữ liệu sai định dạng / quá lớn bị từ chối', async () => {
    const db = fakeDb();
    expect((await handleLuu(req('PUT', K, { t: 'x', data: 1 }), db)).status).toBe(400);
    expect((await handleLuu(req('PUT', K, { base: 0, data: 'x'.repeat(250_000) }), db)).status).toBe(413);
  });
});
