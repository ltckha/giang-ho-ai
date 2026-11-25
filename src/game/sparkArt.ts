import Phaser from 'phaser';
import { ALL_ENEMY_DEFINITIONS, ALL_TOWER_DEFINITIONS } from '../core/tdDefinitions';

/**
 * Hình Spark vẽ (Claude ghép): public/assets/spark_atlas.* do tools/pack_spark_atlas.py tạo.
 * Lúc mở game, các khung này được gắn thêm vào tấm hình chính (ATLAS) để mọi chỗ vẽ món / quái dùng chung tên khung.
 * Món / quái có trường `art` sẽ dùng khung tower_art_<art>_* / enemy_art_<art>_*.
 */
export const SPARK_ATLAS_KEY = 'spark_atlas';
/** Mặt tiền tiệm (tools/pack_facades.py) */
export const FACADE_ATLAS_KEY = 'facade_atlas';
/** = STREETS_ATLAS_KEY (atlasIcons.ts) — ghi lại ở đây để khỏi vòng import */
const STREETS_ATLAS_KEY_LAZY = 'streets_atlas';

const TIER_KEYS = ['t1', 't2', 't3a', 't3b'] as const;

/**
 * Hình phố Đà Lạt (món / quái Spark, mặt tiền, hình phố sinh tự động) — KHÔNG tải lúc mở game (đánh giá độc lập: lần tải đầu 6,5 MB).
 * Gọi queueStreetAtlases trong preload của màn cần, hoặc loadStreetAtlasesInBackground ở màn chính.
 */
export function queueStreetAtlases(scene: Phaser.Scene): boolean {
  let queued = false;
  const add = (key: string, base: string) => {
    if (!scene.textures.exists(key)) {
      scene.load.atlas(key, `./assets/${base}.webp`, `./assets/${base}.json`);
      queued = true;
    }
  };
  add(SPARK_ATLAS_KEY, 'spark_atlas');
  add(FACADE_ATLAS_KEY, 'facade_atlas');
  add(STREETS_ATLAS_KEY_LAZY, 'streets_atlas');
  return queued;
}

/** Sau khi có hình phố: ghép vào atlas chính + tạo hoạt ảnh (gọi nhiều lần cũng được) */
export function applyStreetAtlases(scene: Phaser.Scene, mainKey: string): void {
  mergeSparkAtlas(scene, mainKey);
  registerSparkAnimations(scene, mainKey);
}

let bgLoading: Promise<void> | null = null;
/** Màn chính: tải ngầm hình phố sau khi đã hiện, xong gọi onDone (vẽ lại thẻ tiệm / hình món) */
export function loadStreetAtlasesInBackground(scene: Phaser.Scene, mainKey: string, onDone: () => void): void {
  if (scene.textures.exists(SPARK_ATLAS_KEY) && scene.textures.exists(FACADE_ATLAS_KEY) && scene.textures.exists(STREETS_ATLAS_KEY_LAZY)) return;
  if (!bgLoading) {
    bgLoading = new Promise<void>((resolve) => {
      if (!queueStreetAtlases(scene)) return resolve();
      scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        applyStreetAtlases(scene, mainKey);
        resolve();
      });
      scene.load.start();
    });
  }
  void bgLoading.then(() => {
    bgLoading = null;
    if (scene.sys.isActive()) onDone();
  });
}

export function mergeSparkAtlas(scene: Phaser.Scene, mainKey: string): void {
  const tm = scene.textures;
  if (!tm.exists(SPARK_ATLAS_KEY) || !tm.exists(mainKey)) return;
  const main = tm.get(mainKey);
  const spark = tm.get(SPARK_ATLAS_KEY);
  const src = spark.source[0];
  if (!src || main.source.includes(src)) return;
  const idx = main.source.length;
  main.source.push(src);
  for (const name of spark.getFrameNames()) {
    if (main.has(name)) continue;
    const f = spark.get(name);
    main.add(name, idx, f.cutX, f.cutY, f.cutWidth, f.cutHeight);
  }
}

export function registerSparkAnimations(scene: Phaser.Scene, mainKey: string): void {
  const main = scene.textures.exists(mainKey) ? scene.textures.get(mainKey) : null;
  if (!main) return;
  for (const def of Object.values(ALL_TOWER_DEFINITIONS)) {
    if (!def?.art) continue;
    for (const tk of TIER_KEYS) {
      const key = `anim_fire_${def.id}_${tk}`;
      const base = `tower_art_${def.art}_${tk}`;
      if (scene.anims.exists(key) || !main.has(`${base}_f0`)) continue;
      scene.anims.create({
        key,
        frames: [1, 2, 0].map((i) => ({ key: mainKey, frame: `${base}_f${i}` })),
        frameRate: 14,
        repeat: 0,
      });
    }
  }
  const arts = new Set(Object.values(ALL_ENEMY_DEFINITIONS).map((d) => d?.art).filter(Boolean) as string[]);
  for (const art of arts) {
    const key = `anim_walk_art_${art}`;
    if (scene.anims.exists(key) || !main.has(`enemy_art_${art}_f0`)) continue;
    scene.anims.create({
      key,
      frames: [0, 1, 2, 3].map((i) => ({ key: mainKey, frame: `enemy_art_${art}_f${i}` })),
      frameRate: 7,
      repeat: -1,
    });
  }
}
