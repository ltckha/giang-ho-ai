#!/usr/bin/env node
/**
 * Sinh bộ ảnh cho kênh Gọn & chia sẻ link (Chặng 3 — việc 5):
 * 1. docs/marketing/logo_vuong_1080.png         (1080×1080) — Logo vuông ảnh đại diện / bài đăng
 * 2. public/og-image.png                        (1200×630)  — Ảnh chia sẻ link (Open Graph)
 * 3. docs/marketing/cover_01_dat_sai_mon.png    (1080×1920) — Ảnh bìa video dọc: "Đặt sai món là thua!"
 * 4. docs/marketing/cover_02_trung_tu.png       (1080×1920) — Ảnh bìa video dọc: "Trúng tủ!"
 * 5. docs/marketing/cover_03_trum_doi_hanh.png  (1080×1920) — Ảnh bìa video dọc: "Trùm Mùa Nồm đổi hành!"
 *
 * Dùng 100% tài nguyên tự tạo trong repo (logo vector, phông chữ tiếng Việt offline,
 * sprite cắt từ gon_tiem_atlas.webp & ảnh chụp màn chơi thật).
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const MARKETING_DIR = path.join(REPO_ROOT, 'docs', 'marketing');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');
const FONTS_DIR = path.join(REPO_ROOT, 'src', 'assets', 'fonts');
const SCREENSHOTS_DIR = path.join(REPO_ROOT, 'docs', 'screenshots');
const ATLAS_IMG_PATH = path.join(REPO_ROOT, 'public', 'assets', 'gon_tiem_atlas.webp');
const ATLAS_JSON_PATH = path.join(REPO_ROOT, 'public', 'assets', 'gon_tiem_atlas.json');

fs.mkdirSync(MARKETING_DIR, { recursive: true });

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

function fileDataUrl(absPath, mime) {
  return `data:${mime};base64,${fs.readFileSync(absPath).toString('base64')}`;
}

function fontFaceCss() {
  const b64 = (f) => fs.readFileSync(path.join(FONTS_DIR, f)).toString('base64');
  return `
    @font-face {
      font-family: 'Noto Serif';
      font-weight: 700;
      src: url(data:font/woff2;base64,${b64('noto-serif-vietnamese-700-normal.woff2')}) format('woff2');
      unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
    }
    @font-face {
      font-family: 'Noto Serif';
      font-weight: 700;
      src: url(data:font/woff2;base64,${b64('noto-serif-latin-700-normal.woff2')}) format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122;
    }
    @font-face {
      font-family: 'Be Vietnam Pro';
      font-weight: 400;
      src: url(data:font/woff2;base64,${b64('be-vietnam-pro-vietnamese-400-normal.woff2')}) format('woff2');
      unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
    }
    @font-face {
      font-family: 'Be Vietnam Pro';
      font-weight: 400;
      src: url(data:font/woff2;base64,${b64('be-vietnam-pro-latin-400-normal.woff2')}) format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122;
    }
    @font-face {
      font-family: 'Be Vietnam Pro';
      font-weight: 700;
      src: url(data:font/woff2;base64,${b64('be-vietnam-pro-vietnamese-700-normal.woff2')}) format('woff2');
      unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
    }
    @font-face {
      font-family: 'Be Vietnam Pro';
      font-weight: 700;
      src: url(data:font/woff2;base64,${b64('be-vietnam-pro-latin-700-normal.woff2')}) format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122;
    }
  `;
}

// Đọc hàm renderBrandLogoSvg từ src/game/brandLogo.ts
const brandSrc = fs.readFileSync(path.join(REPO_ROOT, 'src', 'game', 'brandLogo.ts'), 'utf8');
const brandJs = brandSrc
  .replace(/export interface BrandLogoOptions[\s\S]*?\}\n/, '')
  .replace(/export function renderBrandLogoSvg\(opts: BrandLogoOptions = \{\}\): string/, 'function renderBrandLogoSvg(opts = {})');
const renderBrandLogoSvg = new Function(`${brandJs}; return renderBrandLogoSvg;`)();

const atlasJson = JSON.parse(fs.readFileSync(ATLAS_JSON_PATH, 'utf8'));
const atlasDataUrl = fileDataUrl(ATLAS_IMG_PATH, 'image/webp');

const shotStreet = fileDataUrl(path.join(REPO_ROOT, 'docs', 'marketing', 'home_gon_pho.png'), 'image/png');
const shotCombat1 = fileDataUrl(path.join(SCREENSHOTS_DIR, 'man1v2_03_sau_combat.png'), 'image/png');
const shotCombat2 = fileDataUrl(path.join(SCREENSHOTS_DIR, 'man2_03_combat.png'), 'image/png');
const shotUlt = fileDataUrl(path.join(SCREENSHOTS_DIR, 'ult_03_cast_and_cd.png'), 'image/png');
const shotBoss = fileDataUrl(path.join(SCREENSHOTS_DIR, 'man3_03_boss_shift.png'), 'image/png');

const browser = await chromium.launch({
  executablePath: resolveChromiumExecutable(),
  args: ['--disable-gpu', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });

// Cắt sẵn các sprite sắc nét từ gon_tiem_atlas.webp sang PNG data URL
const neededFrames = [
  'el_kim', 'el_moc', 'el_tho', 'el_thuy', 'el_hoa',
  'tower_wood_tower_t1_f0', 'tower_wood_tower_t3a_f0',
  'tower_water_tower_t1_f0',
  'tower_metal_tower_t3a_f0', 'tower_fire_tower_t3b_f0',
  'tower_bk_oven_t3b_f0', 'tower_fl_shears_t3a_f0', 'tower_fl_heater_t3b_f0',
  'enemy_fast_metal_f0', 'enemy_tank_earth_f0', 'enemy_split_fire_f0',
  'enemy_fl_monsoon_f0', 'enemy_fl_monsoon_moc_f0', 'enemy_fl_monsoon_kim_f0',
  'icon_shoe_life', 'icon_bread_life', 'icon_flower_life',
];

await page.setContent(`<!doctype html><html><body><img id="atlas" src="${atlasDataUrl}" /></body></html>`);
const sprites = await page.evaluate(
  async ({ framesMap, keys }) => {
    const img = document.getElementById('atlas');
    await img.decode();
    const out = {};
    for (const k of keys) {
      const f = framesMap[k]?.frame;
      if (!f) continue;
      const c = document.createElement('canvas');
      c.width = f.w;
      c.height = f.h;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
      out[k] = c.toDataURL('image/png');
    }
    return out;
  },
  { framesMap: atlasJson.frames, keys: neededFrames },
);

const cssFonts = fontFaceCss();
const logoSvg = renderBrandLogoSvg({ showText: true, cornerRadius: 96 });

async function renderHtmlToPng(html, width, height, outPath) {
  await page.setViewportSize({ width, height });
  await page.setContent(`<!doctype html><html lang="vi"><head><meta charset="UTF-8"><style>
    ${cssFonts}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: ${width}px; height: ${height}px; overflow: hidden; font-family: 'Be Vietnam Pro', sans-serif; }
  </style></head><body>${html}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: outPath });
  const kb = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`Rendered ${path.relative(REPO_ROOT, outPath)} (${width}×${height}, ${kb} KB)`);
}

// =========================================================================
// 1. LOGO VUÔNG 1080×1080 (docs/marketing/logo_vuong_1080.png)
// =========================================================================
const squareLogoHtml = `
  <div style="
    width:1080px;height:1080px;position:relative;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:28px;
    background:
      radial-gradient(circle at 50% 42%, #fff6d9 0%, #ecd6a8 56%, #cfa86e 100%);
    border: 24px solid #3c2414;
  ">
    <div style="
      position:absolute;inset:26px;border:5px dashed rgba(123,78,43,0.45);border-radius:36px;pointer-events:none;
    "></div>
    <div style="
      background:#382112;color:#fde6a6;border:4px solid #d49b46;border-radius:999px;
      padding:12px 36px;font-size:28px;font-weight:700;letter-spacing:0.12em;
      box-shadow:0 8px 20px rgba(43,26,18,0.28);
    ">PHỐ NHỎ ĐÀ LẠT MÙA MƯA</div>
    <div style="width:740px;height:740px;filter:drop-shadow(0 24px 36px rgba(43,26,18,0.42));">
      ${logoSvg.replace('width="512" height="512"', 'width="740" height="740"')}
    </div>
    <div style="
      font-family:'Noto Serif',serif;font-size:48px;font-weight:700;color:#4a2b16;
      letter-spacing:0.04em;text-shadow:0 3px 0 rgba(255,255,255,0.75);
    ">Ngũ hành giữ tiệm</div>
  </div>
`;
await renderHtmlToPng(squareLogoHtml, 1080, 1080, path.join(MARKETING_DIR, 'logo_vuong_1080.png'));

// =========================================================================
// 2. ẢNH CHIA SẺ LINK 1200×630 (public/og-image.png)
// =========================================================================
const ogHtml = `
  <div style="
    width:1200px;height:630px;position:relative;overflow:hidden;
    background:linear-gradient(135deg, #2d1c12 0%, #442a19 42%, #293848 100%);
    display:flex;align-items:center;justify-content:space-between;padding:42px 54px;
    border:14px solid #c68e46;
  ">
    <!-- Mưa nhẹ phía sau -->
    <svg style="position:absolute;inset:0;width:1200px;height:630px;opacity:0.22;pointer-events:none" viewBox="0 0 1200 630">
      <g stroke="#d4f1ff" stroke-width="3" stroke-linecap="round">
        <line x1="120" y1="20" x2="90" y2="95"/><line x1="340" y1="40" x2="310" y2="120"/>
        <line x1="590" y1="10" x2="560" y2="90"/><line x1="820" y1="30" x2="790" y2="115"/>
        <line x1="1040" y1="20" x2="1010" y2="95"/><line x1="1140" y1="160" x2="1110" y2="240"/>
      </g>
    </svg>

    <!-- Cột trái: Logo + Tiêu đề lớn + 5 hành + CTA -->
    <div style="position:relative;z-index:2;width:620px;display:flex;flex-direction:column;gap:20px;">
      <div style="display:flex;align-items:center;gap:20px;">
        <div style="width:146px;height:146px;flex-shrink:0;filter:drop-shadow(0 12px 22px rgba(0,0,0,0.55));">
          ${logoSvg.replace('width="512" height="512"', 'width="146" height="146"')}
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0;">
          <span style="
            align-self:flex-start;background:#59341a;color:#fde6a6;border:2px solid #e6a938;
            border-radius:999px;padding:5px 15px;font-size:16px;font-weight:700;letter-spacing:0.06em;
          ">THỦ THÀNH NGŨ HÀNH ĐÀ LẠT</span>
          <h1 style="
            font-family:'Noto Serif',serif;font-size:42px;line-height:1.1;color:#fff6dc;white-space:nowrap;
            text-shadow:0 4px 0 #2b1a12, 0 10px 24px rgba(0,0,0,0.45);
          ">Gọn Phố</h1>
          <div style="font-size:19px;font-weight:700;color:#ffd359;white-space:nowrap;">Ngũ hành giữ tiệm • Chơi ngay trên web</div>
        </div>
      </div>

      <p style="font-size:21px;line-height:1.45;color:#f4e3c1;">
        Giữ sạch <strong>Tiệm Giày, Tiệm Bánh, Tiệm Hoa</strong> giữa cơn mưa Đà Lạt! Đặt món khắc hệ ra <strong>Trúng tủ ×1.75</strong>, nối cặp tương sinh &amp; gom trang bị chủ tiệm.
      </p>

      <!-- 5 hành Ngũ Hành -->
      <div style="display:flex;align-items:center;gap:10px;">
        ${[
          ['el_kim', 'Kim', '#cbd5e1'],
          ['el_moc', 'Mộc', '#59c173'],
          ['el_tho', 'Thổ', '#d4a359'],
          ['el_thuy', 'Thủy', '#38bdf8'],
          ['el_hoa', 'Hỏa', '#ff6b4a'],
        ]
          .map(
            ([k, label, col]) => `
            <span style="
              display:inline-flex;align-items:center;gap:7px;padding:7px 14px;border-radius:12px;
              background:rgba(255,248,232,0.12);border:2.5px solid ${col};color:#fff8e7;
              font-size:18px;font-weight:700;
            ">
              <img src="${sprites[k]}" style="width:24px;height:24px;object-fit:contain;" />
              ${label}
            </span>`,
          )
          .join('')}
      </div>

      <div style="display:flex;align-items:center;gap:16px;margin-top:4px;">
        <div style="
          background:linear-gradient(180deg,#40b365 0%,#267740 100%);color:#fffdf6;
          border:3px solid #164424;border-radius:16px;padding:13px 28px;
          font-size:22px;font-weight:700;box-shadow:0 5px 0 #164424,0 10px 24px rgba(0,0,0,0.4);
        ">▶ Mở Cửa Giữ Tiệm Ngay</div>
        <span style="font-size:18px;color:#e7cfa4;font-weight:700;">100% Miễn phí • Chơi offline</span>
      </div>
    </div>

    <!-- Cột phải: 2 khung điện thoại gameplay nổi bật + huy hiệu Trúng tủ -->
    <div style="position:relative;z-index:2;width:440px;height:540px;">
      <!-- Khung phố dốc nghiêng nhẹ phía sau -->
      <div style="
        position:absolute;left:0;top:44px;width:230px;height:470px;border-radius:26px;overflow:hidden;
        border:6px solid #f4d698;box-shadow:0 18px 36px rgba(0,0,0,0.55);transform:rotate(-5deg);
      ">
        <img src="${shotStreet}" style="width:100%;height:100%;object-fit:cover;object-position:top;" />
      </div>
      <!-- Khung giao tranh phía trước -->
      <div style="
        position:absolute;right:8px;top:16px;width:255px;height:508px;border-radius:28px;overflow:hidden;
        border:6px solid #ffd24d;box-shadow:0 22px 44px rgba(0,0,0,0.65);transform:rotate(3deg);
      ">
        <img src="${shotCombat1}" style="width:100%;height:100%;object-fit:cover;" />
      </div>
      <!-- Nhãn nổ Trúng tủ -->
      <div style="
        position:absolute;left:-12px;bottom:34px;transform:rotate(-6deg);
        background:linear-gradient(180deg,#fde047 0%,#f59e0b 100%);color:#2b1404;
        border:4px solid #2b1a12;border-radius:18px;padding:10px 20px;
        font-family:'Noto Serif',serif;font-size:28px;font-weight:700;
        box-shadow:0 8px 20px rgba(0,0,0,0.55);
      ">💥 TRÚNG TỦ! ×1.75</div>
      <!-- Sprite Dép Tông bay nổi -->
      <img src="${sprites.tower_wood_tower_t1_f0}" style="
        position:absolute;right:-14px;top:-8px;width:112px;height:112px;object-fit:contain;
        transform:rotate(14deg);filter:drop-shadow(0 8px 14px rgba(0,0,0,0.55));
      " />
    </div>
  </div>
`;
const ogRawPath = path.join(PUBLIC_DIR, 'og-image.png');
await renderHtmlToPng(ogHtml, 1200, 630, ogRawPath);

// Nén tối ưu public/og-image.png bằng Pillow (giữ nguyên 1200×630 sắc nét, giảm mạnh dung lượng trong dist/)
execFileSync('python3', [
  '-c',
  `from PIL import Image; im = Image.open(${JSON.stringify(ogRawPath)}).convert('RGB').quantize(colors=256, method=Image.Quantize.MEDIANCUT); im.save(${JSON.stringify(ogRawPath)}, optimize=True)`,
]);
console.log(`Optimized public/og-image.png -> ${(fs.statSync(ogRawPath).size / 1024).toFixed(1)} KB`);

// Helper khung chung cho 3 ảnh bìa video dọc 1080×1920
function buildVerticalCover({
  bgCss,
  kicker,
  headlineLine1,
  headlineLine2,
  headlineColor2,
  subPill,
  centerHtml,
  footerLine,
}) {
  return `
    <div style="
      width:1080px;height:1920px;position:relative;overflow:hidden;
      background:${bgCss};
      display:flex;flex-direction:column;align-items:center;justify-content:space-between;
      padding:78px 54px 72px;border:18px solid #d49b46;
    ">
      <!-- Khối tiêu đề cực to dễ đọc trên feed điện thoại -->
      <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:20px;text-align:center;z-index:3;">
        <div style="
          background:#2b1a12;color:#fde6a6;border:4px solid #f5b942;border-radius:999px;
          padding:12px 34px;font-size:30px;font-weight:700;letter-spacing:0.08em;
          box-shadow:0 8px 20px rgba(0,0,0,0.45);
        ">${kicker}</div>

        <h1 style="
          font-family:'Noto Serif',serif;font-size:94px;line-height:1.06;color:#fff8e4;
          -webkit-text-stroke:4px #2b1a12;paint-order:stroke fill;
          text-shadow:0 10px 0 #2b1a12, 0 18px 34px rgba(0,0,0,0.65);
        ">${headlineLine1}</h1>

        <div style="
          font-family:'Noto Serif',serif;font-size:98px;line-height:1.04;font-weight:700;
          color:${headlineColor2};-webkit-text-stroke:4px #2b1a12;paint-order:stroke fill;
          text-shadow:0 10px 0 #2b1a12, 0 18px 34px rgba(0,0,0,0.65);margin-top:-10px;
        ">${headlineLine2}</div>

        <div style="
          background:rgba(36,21,12,0.88);color:#fff2cc;border:3px solid #e6a938;
          border-radius:22px;padding:14px 32px;font-size:32px;font-weight:700;
          box-shadow:0 8px 20px rgba(0,0,0,0.4);
        ">${subPill}</div>
      </div>

      <!-- Khung trung tâm khoảnh khắc gameplay + sprite thật -->
      <div style="position:relative;width:100%;flex:1;display:flex;align-items:center;justify-content:center;z-index:2;margin:26px 0;">
        ${centerHtml}
      </div>

      <!-- Dải chân trang có Logo bản vuông & kêu gọi chơi -->
      <div style="
        width:100%;background:linear-gradient(180deg,#faf0da 0%,#ead09c 100%);
        border:6px solid #3c2414;border-radius:36px;padding:24px 32px;
        display:flex;align-items:center;gap:28px;z-index:3;
        box-shadow:0 14px 36px rgba(0,0,0,0.55);
      ">
        <div style="width:176px;height:176px;flex-shrink:0;filter:drop-shadow(0 8px 14px rgba(43,26,18,0.35));">
          ${logoSvg.replace('width="512" height="512"', 'width="176" height="176"')}
        </div>
        <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
          <div style="font-family:'Noto Serif',serif;font-size:48px;font-weight:700;color:#3c2414;line-height:1.1;">
            Gọn Phố
          </div>
          <div style="font-size:29px;font-weight:700;color:#8c4a18;">${footerLine}</div>
          <div style="
            align-self:flex-start;margin-top:4px;background:#2d8a4e;color:#fffaf0;
            border:3px solid #194d2b;border-radius:14px;padding:8px 22px;font-size:24px;font-weight:700;
          ">▶ Chơi miễn phí trên điện thoại</div>
        </div>
      </div>
    </div>
  `;
}

// =========================================================================
// 3. ẢNH BÌA VIDEO DỌC #1: "ĐẶT SAI MÓN LÀ THUA!"
// =========================================================================
await renderHtmlToPng(
  buildVerticalCover({
    bgCss: 'radial-gradient(circle at 50% 34%, #6e2618 0%, #3a1a12 52%, #1d120c 100%)',
    kicker: '⚠ MẸO GIỮ TIỆM ĐÀ LẠT',
    headlineLine1: 'ĐẶT SAI MÓN',
    headlineLine2: 'LÀ THUA NGAY!',
    headlineColor2: '#ff6b4a',
    subPill: 'Bị khắc chỉ còn 0.5× sức đánh — Đúng hành ×1.75!',
    footerLine: 'Ngũ hành giữ tiệm • Đừng đặt bừa 1 món!',
    centerHtml: `
      <div style="position:relative;width:820px;height:940px;display:flex;align-items:center;justify-content:center;">
        <!-- Khung ảnh giao tranh Màn 1 -->
        <div style="
          width:500px;height:900px;border-radius:42px;overflow:hidden;
          border:10px solid #f5d28c;box-shadow:0 24px 54px rgba(0,0,0,0.68);
        ">
          <img src="${shotCombat1}" style="width:100%;height:100%;object-fit:cover;" />
        </div>

        <!-- Thẻ Đỏ SAI bên trái (Thủy bị Thổ khắc = 0.5× thật theo luật Ngũ Hành) -->
        <div style="
          position:absolute;left:-36px;top:90px;width:356px;transform:rotate(-7deg);
          background:#fff5f3;border:7px solid #dc2626;border-radius:28px;padding:18px 18px;
          box-shadow:0 16px 32px rgba(0,0,0,0.55);display:flex;flex-direction:column;align-items:center;gap:10px;
        ">
          <div style="background:#dc2626;color:#fff;padding:7px 18px;border-radius:999px;font-size:25px;font-weight:700;white-space:nowrap;">✗ BỊ KHẮC 0.5×</div>
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="${sprites.tower_water_tower_t1_f0}" style="width:96px;height:96px;object-fit:contain;" />
            <span style="font-size:36px;font-weight:700;color:#dc2626;">VS</span>
            <img src="${sprites.enemy_tank_earth_f0}" style="width:96px;height:96px;object-fit:contain;" />
          </div>
          <div style="font-size:23px;font-weight:700;color:#7f1d1d;white-space:nowrap;">Thủy gặp Cục Bùn Thổ!</div>
        </div>

        <!-- Thẻ Xanh ĐÚNG bên phải (Thổ khắc Thủy = 1.75× Trúng tủ) -->
        <div style="
          position:absolute;right:-36px;bottom:95px;width:366px;transform:rotate(6deg);
          background:#f0fdf4;border:7px solid #16a34a;border-radius:28px;padding:18px 18px;
          box-shadow:0 16px 32px rgba(0,0,0,0.55);display:flex;flex-direction:column;align-items:center;gap:10px;
        ">
          <div style="background:#16a34a;color:#fff;padding:7px 18px;border-radius:999px;font-size:25px;font-weight:700;white-space:nowrap;">✓ TRÚNG TỦ 1.75×</div>
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="${sprites.tower_fire_tower_t3b_f0}" style="width:96px;height:96px;object-fit:contain;" />
            <span style="font-size:36px;font-weight:700;color:#16a34a;">⚡</span>
            <img src="${sprites.enemy_fast_metal_f0}" style="width:94px;height:94px;object-fit:contain;" />
          </div>
          <div style="font-size:23px;font-weight:700;color:#14532d;white-space:nowrap;">Thổ hút sạch Giọt Mưa!</div>
        </div>
      </div>
    `,
  }),
  1080,
  1920,
  path.join(MARKETING_DIR, 'cover_01_dat_sai_mon.png'),
);

// =========================================================================
// 4. ẢNH BÌA VIDEO DỌC #2: "TRÚNG TỦ!"
// =========================================================================
await renderHtmlToPng(
  buildVerticalCover({
    bgCss: 'radial-gradient(circle at 50% 35%, #8a4b12 0%, #44250f 52%, #1e120a 100%)',
    kicker: '💥 COMBO NGŨ HÀNH ĐÃ TAY',
    headlineLine1: 'TRÚNG TỦ! ×1.75',
    headlineLine2: 'QUÉT SẠCH PHỐ!',
    headlineColor2: '#fde047',
    subPill: 'Tương sinh +15% • Tung Tuyệt chiêu Bậc 4!',
    footerLine: '3 tiệm Đà Lạt • 15 món nâng cấp rẽ nhánh!',
    centerHtml: `
      <div style="position:relative;width:900px;height:940px;display:flex;align-items:center;justify-content:center;">
        <!-- Ảnh Tiệm Bánh bên trái -->
        <div style="
          position:absolute;left:20px;top:40px;width:440px;height:820px;border-radius:38px;overflow:hidden;
          border:9px solid #f5d28c;box-shadow:0 22px 48px rgba(0,0,0,0.62);transform:rotate(-4deg);
        ">
          <img src="${shotCombat2}" style="width:100%;height:100%;object-fit:cover;" />
        </div>
        <!-- Ảnh Tuyệt chiêu bậc 4 bên phải -->
        <div style="
          position:absolute;right:20px;bottom:20px;width:455px;height:840px;border-radius:38px;overflow:hidden;
          border:10px solid #fde047;box-shadow:0 26px 56px rgba(0,0,0,0.72);transform:rotate(4deg);
        ">
          <img src="${shotUlt}" style="width:100%;height:100%;object-fit:cover;" />
        </div>

        <!-- Vòng 5 biểu tượng Ngũ Hành nổi ở giữa dưới -->
        <div style="
          position:absolute;bottom:48px;left:50%;transform:translateX(-50%);
          background:rgba(36,20,10,0.94);border:5px solid #fde047;border-radius:999px;
          padding:16px 32px;display:flex;align-items:center;gap:16px;
          box-shadow:0 16px 36px rgba(0,0,0,0.7);
        ">
          ${['el_kim', 'el_moc', 'el_tho', 'el_thuy', 'el_hoa']
            .map((k, i) => `<img src="${sprites[k]}" style="width:62px;height:62px;object-fit:contain;" />${i < 4 ? '<span style="color:#fde047;font-size:36px;font-weight:700;">→</span>' : ''}`)
            .join('')}
        </div>

        <!-- 2 món Bậc 3 cực ngầu bay hai bên -->
        <img src="${sprites.tower_bk_oven_t3b_f0}" style="
          position:absolute;left:-20px;top:-16px;width:168px;height:168px;object-fit:contain;
          filter:drop-shadow(0 12px 18px rgba(0,0,0,0.65));transform:rotate(-10deg);
        " />
        <img src="${sprites.tower_metal_tower_t3a_f0}" style="
          position:absolute;right:-16px;top:4px;width:168px;height:168px;object-fit:contain;
          filter:drop-shadow(0 12px 18px rgba(0,0,0,0.65));transform:rotate(10deg);
        " />
      </div>
    `,
  }),
  1080,
  1920,
  path.join(MARKETING_DIR, 'cover_02_trung_tu.png'),
);

// =========================================================================
// 5. ẢNH BÌA VIDEO DỌC #3: "TRÙM MÙA NỒM ĐỔI HÀNH!"
// =========================================================================
await renderHtmlToPng(
  buildVerticalCover({
    bgCss: 'radial-gradient(circle at 50% 34%, #1b4d6e 0%, #1d3640 50%, #141c24 100%)',
    kicker: '👑 THỬ THÁCH MÀN 3 • 2 CỬA VÀO',
    headlineLine1: 'TRÙM MÙA NỒM',
    headlineLine2: 'ĐỔI 3 HÀNH!',
    headlineColor2: '#7dd3fc',
    subPill: 'Thủy 💧 → Mộc 🌿 → Kim ⚔ • Giữ nổi 20 chậu hoa?',
    footerLine: 'Tiệm Hoa Cuối Dốc • 12 đợt quái siêu căng!',
    centerHtml: `
      <div style="position:relative;width:920px;height:940px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;">
        <!-- 3 dạng đổi hành thật của Trùm Mùa Nồm -->
        <div style="display:flex;align-items:center;justify-content:center;gap:18px;width:100%;">
          ${[
            ['enemy_fl_monsoon_f0', 'THỦY', '#38bdf8', '#0c4a6e'],
            ['enemy_fl_monsoon_moc_f0', 'MỘC', '#59c173', '#14532d'],
            ['enemy_fl_monsoon_kim_f0', 'KIM', '#cbd5e1', '#334155'],
          ]
            .map(
              ([sp, name, border, bg], idx) => `
              <div style="
                background:${bg};border:6px solid ${border};border-radius:28px;padding:14px 20px;
                display:flex;flex-direction:column;align-items:center;gap:6px;
                box-shadow:0 14px 28px rgba(0,0,0,0.55);
              ">
                <img src="${sprites[sp]}" style="width:154px;height:154px;object-fit:contain;" />
                <span style="font-size:28px;font-weight:700;color:#fff8e7;">HÀNH ${name}</span>
              </div>
              ${idx < 2 ? '<span style="font-size:46px;font-weight:700;color:#fde047;">➜</span>' : ''}`,
            )
            .join('')}
        </div>

        <!-- Khung chụp khoảnh khắc Đổi hành! trong Màn 3 -->
        <div style="
          width:520px;height:660px;border-radius:38px;overflow:hidden;position:relative;
          border:10px solid #7dd3fc;box-shadow:0 24px 54px rgba(0,0,0,0.72);
        ">
          <img src="${shotBoss}" style="width:100%;height:100%;object-fit:cover;object-position:top;" />
        </div>

        <img src="${sprites.tower_fl_shears_t3a_f0}" style="
          position:absolute;left:18px;bottom:64px;width:156px;height:156px;object-fit:contain;
          filter:drop-shadow(0 10px 18px rgba(0,0,0,0.65));transform:rotate(-12deg);
        " />
        <img src="${sprites.tower_fl_heater_t3b_f0}" style="
          position:absolute;right:18px;bottom:64px;width:156px;height:156px;object-fit:contain;
          filter:drop-shadow(0 10px 18px rgba(0,0,0,0.65));transform:rotate(12deg);
        " />
      </div>
    `,
  }),
  1080,
  1920,
  path.join(MARKETING_DIR, 'cover_03_trum_doi_hanh.png'),
);

await browser.close();
console.log('Done generating all 5 marketing & share assets!');
