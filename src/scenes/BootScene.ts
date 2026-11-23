import Phaser from 'phaser';
import { mergeSparkAtlas, registerSparkAnimations, SPARK_ATLAS_KEY } from '../game/sparkArt';
import { ATLAS_KEY, GEAR_ATLAS_KEY, STAGE1_MAP_KEY, STAGE2_MAP_KEY, STAGE3_MAP_KEY } from '../game/atlasIcons';
import { renderBrandLogoSvg } from '../game/brandLogo';
import { SCENE_KEYS } from '../game/sceneKeys';
import { generateGameTextures } from '../game/textures';

const TOWER_IDS = [
  'wood_tower',
  'metal_tower',
  'water_tower',
  'fire_tower',
  'earth_tower',
  'bk_swatter',
  'bk_jar',
  'bk_fan',
  'bk_oven',
  'bk_fridge',
  'fl_can',
  'fl_shears',
  'fl_lime',
  'fl_heater',
  'fl_vent',
] as const;
const TIER_KEYS = ['t1', 't2', 't3a', 't3b'] as const;
const ENEMY_IDS = [
  'fast_metal',
  'tank_earth',
  'split_fire',
  'split_fire_mini',
  'fly_wood',
  'disrupt_water',
  'healer_wood',
  'boss_water',
  'bk_humid',
  'bk_flour',
  'bk_fly',
  'bk_mold',
  'bk_ember',
  'bk_ember_mini',
  'fl_aphid',
  'fl_snail',
  'fl_dust',
  'fl_dust_mini',
  'fl_frost',
  'fl_rot',
  'fl_monsoon',
  'fl_monsoon_moc',
  'fl_monsoon_kim',
] as const;

const FILE_STATUS_LABELS: Record<string, string> = {
  [ATLAS_KEY]: 'Đang xếp đồ giữ tiệm & bầy quái...',
  [GEAR_ATLAS_KEY]: 'Đang mở tủ trang bị chủ tiệm...',
  [STAGE1_MAP_KEY]: 'Đang lau sàn Tiệm Giày Hẻm Dốc...',
  [STAGE2_MAP_KEY]: 'Đang nhóm lò Tiệm Bánh Đầu Phố...',
  [STAGE3_MAP_KEY]: 'Đang tưới hoa Tiệm Hoa Cuối Dốc...',
};

export class BootScene extends Phaser.Scene {
  private splashEl: HTMLDivElement | null = null;

  constructor() {
    super({ key: SCENE_KEYS.BOOT });
  }

  public preload(): void {
    this.cameras.main.setBackgroundColor('#ecd8b2');
    this.mountSplashScreen();

    this.load.on('progress', (value: number) => {
      this.updateSplashProgress(value);
    });

    this.load.on('fileprogress', (file: { key?: string }) => {
      const label = file.key ? FILE_STATUS_LABELS[file.key] : undefined;
      if (label) {
        this.updateSplashStatus(label);
      }
    });

    this.load.atlas(ATLAS_KEY, './assets/gon_tiem_atlas.webp', './assets/gon_tiem_atlas.json');
    this.load.atlas(SPARK_ATLAS_KEY, './assets/spark_atlas.webp', './assets/spark_atlas.json');
    this.load.atlas(GEAR_ATLAS_KEY, './assets/gear_atlas.webp', './assets/gear_atlas.json');
    this.load.image(STAGE1_MAP_KEY, './assets/map_man1_tiem_giay.webp');
    this.load.image(STAGE2_MAP_KEY, './assets/map_man2_tiem_banh.webp');
    this.load.image(STAGE3_MAP_KEY, './assets/map_man3_tiem_hoa.webp');

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unmountSplashScreen();
    });
  }

  public create(): void {
    this.updateSplashProgress(1);
    this.updateSplashStatus('Mở cửa phố nhỏ Đà Lạt...');
    generateGameTextures(this);
    mergeSparkAtlas(this, ATLAS_KEY);
    this.registerSpriteAnimations();
    registerSparkAnimations(this, ATLAS_KEY);

    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (params?.get('splash') === '1') {
      // Chế độ xem thử màn hình chờ (cho kiểm thử / chụp ảnh)
      this.updateSplashProgress(0.76);
      this.updateSplashStatus('Đang lau sàn Tiệm Giày Hẻm Dốc...');
      return;
    }

    this.unmountSplashScreen();
    this.scene.start(SCENE_KEYS.TITLE);
  }

  private mountSplashScreen(): void {
    this.unmountSplashScreen();
    const container = document.getElementById('game-container');
    if (!container) return;

    const root = document.createElement('div');
    root.className = 'td-boot-splash';
    root.id = 'td-boot-splash';
    root.dataset.testid = 'td-boot-splash';

    root.innerHTML = `
      <div class="td-boot-card td-shoebox-panel">
        <div class="td-box-lid-label">
          <span class="td-tag-hole"></span>
          <span>PHỐ NHỎ ĐÀ LẠT MÙA MƯA</span>
        </div>
        <div class="td-boot-logo-wrap" data-testid="boot-logo">
          ${renderBrandLogoSvg({ showText: true, cornerRadius: 96 })}
        </div>
        <p class="td-boot-subtitle" data-testid="boot-subtitle">Ngũ hành giữ tiệm</p>
        <div class="td-boot-progress-wrap">
          <div
            class="td-boot-progress-bar"
            data-testid="boot-progress-bar"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="0"
          >
            <div class="td-boot-progress-fill" id="td-boot-progress-fill" data-testid="boot-progress-fill" style="width: 6%"></div>
          </div>
          <div class="td-boot-meta-row">
            <span class="td-boot-status" id="td-boot-status">Đang mở cửa phố nhỏ Đà Lạt...</span>
            <span class="td-boot-pct" id="td-boot-pct" data-testid="boot-progress-pct">0%</span>
          </div>
        </div>
      </div>
    `;

    container.appendChild(root);
    this.splashEl = root;
  }

  private updateSplashProgress(ratio: number): void {
    if (!this.splashEl) return;
    const clamped = Math.max(0, Math.min(1, ratio));
    const pct = Math.round(clamped * 100);
    const fill = this.splashEl.querySelector<HTMLDivElement>('#td-boot-progress-fill');
    if (fill) fill.style.width = `${Math.max(6, pct)}%`;
    const pctEl = this.splashEl.querySelector<HTMLSpanElement>('#td-boot-pct');
    if (pctEl) pctEl.textContent = `${pct}%`;
    const bar = this.splashEl.querySelector<HTMLDivElement>('[role="progressbar"]');
    if (bar) bar.setAttribute('aria-valuenow', String(pct));
  }

  private updateSplashStatus(text: string): void {
    if (!this.splashEl) return;
    const el = this.splashEl.querySelector<HTMLSpanElement>('#td-boot-status');
    if (el) el.textContent = text;
  }

  private unmountSplashScreen(): void {
    if (this.splashEl) {
      this.splashEl.remove();
      this.splashEl = null;
    }
  }

  private registerSpriteAnimations(): void {
    if (!this.textures.exists(ATLAS_KEY)) return;

    for (const tid of TOWER_IDS) {
      for (const tk of TIER_KEYS) {
        const key = `anim_fire_${tid}_${tk}`;
        if (!this.anims.exists(key)) {
          this.anims.create({
            key,
            frames: [
              { key: ATLAS_KEY, frame: `tower_${tid}_${tk}_f1` },
              { key: ATLAS_KEY, frame: `tower_${tid}_${tk}_f2` },
              { key: ATLAS_KEY, frame: `tower_${tid}_${tk}_f0` },
            ],
            frameRate: 14,
            repeat: 0,
          });
        }
      }
    }

    for (const eid of ENEMY_IDS) {
      const key = `anim_walk_${eid}`;
      if (!this.anims.exists(key)) {
        const isZippy =
          eid === 'fast_metal' ||
          eid === 'split_fire_mini' ||
          eid === 'bk_humid' ||
          eid === 'bk_fly' ||
          eid === 'bk_ember_mini' ||
          eid === 'fl_aphid' ||
          eid === 'fl_dust_mini';
        const isHeavy =
          eid === 'fl_snail' ||
          eid === 'fl_monsoon' ||
          eid === 'fl_monsoon_moc' ||
          eid === 'fl_monsoon_kim';
        this.anims.create({
          key,
          frames: [
            { key: ATLAS_KEY, frame: `enemy_${eid}_f0` },
            { key: ATLAS_KEY, frame: `enemy_${eid}_f1` },
            { key: ATLAS_KEY, frame: `enemy_${eid}_f2` },
            { key: ATLAS_KEY, frame: `enemy_${eid}_f3` },
          ],
          frameRate: isZippy ? 10 : isHeavy ? 5 : 7,
          repeat: -1,
        });
      }
    }
  }
}
