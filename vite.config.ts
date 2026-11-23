import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Claude: sau khi build, tạo dist/sw.js lưu sẵn toàn bộ file game để chơi không cần mạng
 * và cài ra màn hình điện thoại như app. Không dùng thư viện ngoài.
 */
function offlineServiceWorker(): Plugin {
  return {
    name: 'gon-tiem-offline-sw',
    apply: 'build',
    closeBundle() {
      const dist = join(process.cwd(), 'dist');
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const f of readdirSync(dir)) {
          const p = join(dir, f);
          if (statSync(p).isDirectory()) walk(p);
          else if (f !== 'sw.js') files.push(relative(dist, p).split('\\').join('/'));
        }
      };
      walk(dist);
      files.sort();
      const hash = createHash('sha256');
      for (const f of files) hash.update(f).update(readFileSync(join(dist, f)));
      const version = hash.digest('hex').slice(0, 12);
      const list = JSON.stringify(['./', ...files.map((f) => './' + f)]);
      const sw = `/* Tạo tự động khi build — đừng sửa tay */
const CACHE = 'gon-tiem-${version}';
const FILES = ${list};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('gon-tiem-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).catch(() => caches.match('./'))),
  );
});
`;
      writeFileSync(join(dist, 'sw.js'), sw);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [offlineServiceWorker()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    sourcemap: false,
    chunkSizeWarningLimit: 1800,
  },
  server: {
    host: true,
    port: 5173,
  },
});
