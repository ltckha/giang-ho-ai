import fs from 'node:fs';
import path from 'node:path';
import { chromium, defineConfig } from '@playwright/test';

function resolveChromiumExecutable(): string | undefined {
  try {
    const defaultPath = chromium.executablePath();
    if (defaultPath && fs.existsSync(defaultPath)) {
      return defaultPath;
    }
  } catch {
    // Fallback to system browsers below
  }

  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];

  // Quét thư mục Playwright cài sẵn trên máy cloud nếu khác mã bản dựng
  const browserRoots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    '/opt/ms-playwright',
    path.join(process.env.HOME ?? '', '.cache/ms-playwright'),
  ].filter((p): p is string => Boolean(p && fs.existsSync(p)));

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
      // Ignore unreadable directories
    }
  }

  return candidates.find((p) => fs.existsSync(p));
}

const executablePath = resolveChromiumExecutable();

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    launchOptions: {
      executablePath,
      args: [
        '--disable-gpu',
        '--disable-webgl',
        '--disable-webgl2',
        '--no-sandbox',
      ],
    },
  },
  webServer: {
    command: 'npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
