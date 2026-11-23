#!/usr/bin/env node
/**
 * Sinh bộ biểu tượng app (public/icons/: 512, 192, 180, favicon 32) từ logo vector
 * với phông chữ tiếng Việt offline Noto Serif & Be Vietnam Pro nhúng trực tiếp.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'public', 'icons');
const FONTS_DIR = path.join(REPO_ROOT, 'src', 'assets', 'fonts');

function resolveChromiumExecutable() {
  try {
    const p = chromium.executablePath();
    if (p && fs.existsSync(p)) return p;
  } catch {
    // fallback
  }
  const candidates = ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  for (const root of [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/ms-playwright', path.join(process.env.HOME ?? '', '.cache/ms-playwright')].filter(Boolean)) {
    if (!fs.existsSync(root)) continue;
    for (const entry of fs.readdirSync(root)) {
      if (!entry.startsWith('chromium-')) continue;
      candidates.unshift(
        path.join(root, entry, 'chrome-linux64', 'chrome'),
        path.join(root, entry, 'chrome-linux', 'chrome'),
      );
    }
  }
  return candidates.find((p) => fs.existsSync(p));
}

function fontFaceCss() {
  const loadB64 = (file) => fs.readFileSync(path.join(FONTS_DIR, file)).toString('base64');
  return `
    @font-face {
      font-family: 'Noto Serif';
      font-weight: 700;
      src: url(data:font/woff2;base64,${loadB64('noto-serif-vietnamese-700-normal.woff2')}) format('woff2');
      unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
    }
    @font-face {
      font-family: 'Noto Serif';
      font-weight: 700;
      src: url(data:font/woff2;base64,${loadB64('noto-serif-latin-700-normal.woff2')}) format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122;
    }
    @font-face {
      font-family: 'Be Vietnam Pro';
      font-weight: 700;
      src: url(data:font/woff2;base64,${loadB64('be-vietnam-pro-vietnamese-700-normal.woff2')}) format('woff2');
      unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
    }
    @font-face {
      font-family: 'Be Vietnam Pro';
      font-weight: 700;
      src: url(data:font/woff2;base64,${loadB64('be-vietnam-pro-latin-700-normal.woff2')}) format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122;
    }
  `;
}

// Đọc trực tiếp hàm vẽ logo từ src/game/brandLogo.ts để đồng nhất 100% giữa icon app và màn hình chờ
const brandSrc = fs.readFileSync(path.join(REPO_ROOT, 'src', 'game', 'brandLogo.ts'), 'utf8');
const brandJs = brandSrc
  .replace(/export interface BrandLogoOptions[\s\S]*?\}\n/, '')
  .replace(/export function renderBrandLogoSvg\(opts: BrandLogoOptions = \{\}\): string/, 'function renderBrandLogoSvg(opts = {})');
const renderBrandLogoSvg = new Function(`${brandJs}; return renderBrandLogoSvg;`)();

fs.mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { file: 'icon-512.png', size: 512, showText: true, cornerRadius: 96, omitBg: true },
  { file: 'icon-192.png', size: 192, showText: true, cornerRadius: 96, omitBg: true },
  // Apple touch icon iOS không dùng nền trong suốt (iOS tự bo góc) -> cornerRadius 0, nền đầy kín
  { file: 'apple-touch-icon-180.png', size: 180, showText: true, cornerRadius: 0, omitBg: false },
  { file: 'favicon-32.png', size: 32, showText: false, cornerRadius: 96, omitBg: true },
];

const css = fontFaceCss();
const browser = await chromium.launch({
  executablePath: resolveChromiumExecutable(),
  args: ['--disable-gpu', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });

for (const t of targets) {
  const svg = renderBrandLogoSvg({ showText: t.showText, cornerRadius: t.cornerRadius });
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(
    `<!doctype html><html><head><style>
      ${css}
      html, body { margin: 0; padding: 0; width: ${t.size}px; height: ${t.size}px; background: ${t.omitBg ? 'transparent' : '#2b1a12'}; overflow: hidden; }
      svg { display: block; width: ${t.size}px; height: ${t.size}px; }
    </style></head><body>${svg}</body></html>`,
  );
  await page.evaluate(() => document.fonts.ready);
  const outPath = path.join(OUT_DIR, t.file);
  await page.screenshot({ path: outPath, omitBackground: t.omitBg });
  const kb = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`Generated ${t.file} (${t.size}x${t.size}, ${kb} KB)`);
}

await browser.close();
