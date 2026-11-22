#!/usr/bin/env node
/**
 * Render danh sách tệp SVG (nền trong suốt) sang PNG độ nét cao bằng Chromium có sẵn trong Playwright.
 * Dùng cho đạo cụ bản đồ & sprite hoạt hình nét viền nâu đậm (#2b1a12) của "Gọn Tiệm, Sạch Phố".
 *
 * Cách dùng: node scripts/render_svgs.mjs <input_dir> <output_dir> [size=512]
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

function resolveChromiumExecutable() {
  try {
    const defaultPath = chromium.executablePath();
    if (defaultPath && fs.existsSync(defaultPath)) return defaultPath;
  } catch {
    // fallback
  }
  const candidates = ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  const browserRoots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    '/opt/ms-playwright',
    path.join(process.env.HOME ?? '', '.cache/ms-playwright'),
  ].filter((p) => p && fs.existsSync(p));

  for (const root of browserRoots) {
    try {
      for (const entry of fs.readdirSync(root)) {
        if (!entry.startsWith('chromium-')) continue;
        candidates.unshift(
          path.join(root, entry, 'chrome-linux64', 'chrome'),
          path.join(root, entry, 'chrome-linux', 'chrome'),
        );
      }
    } catch {
      // ignore
    }
  }
  return candidates.find((p) => fs.existsSync(p));
}

const [, , inputDir, outputDir, defaultSizeArg] = process.argv;
if (!inputDir || !outputDir) {
  console.error('Usage: node scripts/render_svgs.mjs <input_dir> <output_dir> [size]');
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });
const defaultSize = Number(defaultSizeArg || 512);
const files = fs.readdirSync(inputDir).filter((f) => f.endsWith('.svg')).sort();

const browser = await chromium.launch({
  executablePath: resolveChromiumExecutable(),
  args: ['--disable-gpu', '--no-sandbox'],
});

const page = await browser.newPage({
  viewport: { width: defaultSize, height: defaultSize },
  deviceScaleFactor: 1,
});

for (const file of files) {
  const svgRaw = fs.readFileSync(path.join(inputDir, file), 'utf8');
  const wMatch = svgRaw.match(/\bwidth="(\d+)"/);
  const hMatch = svgRaw.match(/\bheight="(\d+)"/);
  const w = wMatch ? Number(wMatch[1]) : defaultSize;
  const h = hMatch ? Number(hMatch[1]) : defaultSize;
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(
    `<!doctype html><html><head><style>
      html, body { margin: 0; padding: 0; width: ${w}px; height: ${h}px; background: transparent; overflow: hidden; }
      svg { display: block; width: ${w}px; height: ${h}px; }
    </style></head><body>${svgRaw}</body></html>`,
  );
  const outPath = path.join(outputDir, file.replace(/\.svg$/, '.png'));
  await page.screenshot({ path: outPath, omitBackground: true });
}

await browser.close();
console.log(`Rendered ${files.length} SVG files to ${outputDir}`);
