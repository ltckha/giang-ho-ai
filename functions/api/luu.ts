// Cloudflare Pages Functions: /api/luu — lưu tiến độ theo chìa khoá QR (code chính ở src/server/luuHandler.ts)
import { handleLuu, type D1Like } from '../../src/server/luuHandler';

export const onRequest = async (context: { request: Request; env: { DB?: D1Like } }): Promise<Response> =>
  handleLuu(context.request, context.env.DB);
