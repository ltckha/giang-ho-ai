import Phaser from 'phaser';
import { ATLAS_KEY, STAGE1_MAP_KEY, STAGE2_MAP_KEY } from '../game/atlasIcons';
import { SCENE_KEYS } from '../game/sceneKeys';
import { generateGameTextures } from '../game/textures';

const TOWER_IDS = ['wood_tower', 'metal_tower', 'water_tower', 'fire_tower', 'earth_tower'] as const;
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
] as const;

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT });
  }

  public preload(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#231811');

    this.add
      .text(width / 2, height / 2, 'Đang mở cửa phố nhỏ Đà Lạt...', {
        fontSize: '18px',
        color: '#f5d796',
        fontFamily: "'Be Vietnam Pro', system-ui, -apple-system, sans-serif",
      })
      .setOrigin(0.5);

    this.load.atlas(ATLAS_KEY, './assets/gon_tiem_atlas.webp', './assets/gon_tiem_atlas.json');
    this.load.image(STAGE1_MAP_KEY, './assets/map_man1_tiem_giay.webp');
    this.load.image(STAGE2_MAP_KEY, './assets/map_man2_tiem_banh.webp');
  }

  public create(): void {
    generateGameTextures(this);
    this.registerSpriteAnimations();
    this.scene.start(SCENE_KEYS.TITLE);
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
        this.anims.create({
          key,
          frames: [
            { key: ATLAS_KEY, frame: `enemy_${eid}_f0` },
            { key: ATLAS_KEY, frame: `enemy_${eid}_f1` },
            { key: ATLAS_KEY, frame: `enemy_${eid}_f2` },
            { key: ATLAS_KEY, frame: `enemy_${eid}_f3` },
          ],
          frameRate: eid === 'fast_metal' || eid === 'split_fire_mini' ? 10 : 7,
          repeat: -1,
        });
      }
    }
  }
}
