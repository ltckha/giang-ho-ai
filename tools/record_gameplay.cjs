// Quay video máy tự chơi (dọc 9:16) để làm clip cho kênh Gọn.
// Không phải code game: chỉ mở bản build trong dist/, bật bot, quay màn hình.
// Cách chạy: npm run build && node tools/record_gameplay.cjs [số giây, mặc định 40] [thư mục ra, mặc định video_out] [màn 1|2|3]
// Cần: Playwright + Chromium (đã có trong máy phiên cloud), ffmpeg để đổi sang mp4.
const http = require('http'), fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
// Ưu tiên Playwright cài sẵn trong máy (khớp trình duyệt và ffmpeg quay video); không có thì dùng bản của dự án
let chromium;
try { chromium = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright')).chromium; }
catch { chromium = require('playwright').chromium; }
const seconds = Number(process.argv[2] || 40);
const outDir = path.resolve(process.argv[3] || 'video_out');
const skipSec = Number(process.argv[5] || 3); // bỏ bớt mấy giây đầu (màn hình tải, chọn tiệm)
const stageNo = ['2', '3'].includes(process.argv[4]) ? Number(process.argv[4]) : 1; // màn cần quay (1, 2 hoặc 3)
const root = path.resolve(__dirname, '..', 'dist');
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { let p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html'; fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const port = srv.address().port;
  // Dùng Chromium có sẵn nếu bản Playwright của dự án không tìm thấy trình duyệt của nó
  let browser;
  try { browser = await chromium.launch(); }
  catch (e) {
    const fallback = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium/chrome-linux/chrome';
    const alt = ['/opt/pw-browsers/chromium', fallback].find(p => fs.existsSync(p));
    if (!alt) throw e;
    browser = await chromium.launch({ executablePath: alt });
  }
  // Quay ở 540x960 (khung điện thoại), ffmpeg phóng lên 1080x1920 khi xuất
  const ctx = await browser.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, recordVideo: { dir: outDir, size: { width: 540, height: 960 } } });
  const page = await ctx.newPage();
  await page.route('**/*', rt => rt.request().url().startsWith(`http://localhost:${port}`) ? rt.continue() : rt.abort());
  // Bỏ qua hướng dẫn lần đầu, mở sẵn đủ 3 tiệm (chỉ trong trình duyệt quay, không đụng máy người chơi)
  await page.addInitScript(() => {
    try {
      localStorage.setItem('giang_ho_ai_thu_thanh_save_v1', JSON.stringify({ version: 1, unlockedStage: 3, starsByStage: {}, bestLivesByStage: {}, tutorialDone: true, updatedAt: Date.now() }));
    } catch (e) {}
  });
  // ?video=1&bot=1: bot tự chơi, tốc độ x2, ẩn nút gỡ lỗi (Antigravity làm)
  await page.goto(`http://localhost:${port}/?bot=1&video=1`);
  await page.waitForTimeout(2500);
  await page.getByTestId(`btn-start-stage-${stageNo}`).click();
  await page.waitForTimeout(800);
  await page.getByTestId('btn-call-wave').click().catch(() => {});
  await page.waitForTimeout(seconds * 1000);
  const video = page.video();
  await ctx.close(); await browser.close(); srv.close();
  const webm = await video.path();
  const mp4 = path.join(outDir, `gameplay_man${stageNo}_${new Date().toISOString().replace(/[:.]/g, '-')}.mp4`);
  // bỏ 2 giây đầu (màn hình tải), xuất mp4 H.264 dọc 1080x1920, 30 khung/giây
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(skipSec), '-i', webm, '-vf', 'fps=30,scale=1080:1920:flags=lanczos', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
  fs.unlinkSync(webm);
  console.log('Đã quay:', mp4);
})();
