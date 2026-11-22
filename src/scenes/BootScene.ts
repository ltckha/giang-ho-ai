import Phaser from 'phaser';
import { ATLAS_KEY, GEAR_ATLAS_KEY, STAGE1_MAP_KEY, STAGE2_MAP_KEY, STAGE3_MAP_KEY } from '../game/atlasIcons';
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
    this.load.atlas(GEAR_ATLAS_KEY, './assets/gear_atlas.webp', './assets/gear_atlas.json');
    this.load.image(STAGE1_MAP_KEY, './assets/map_man1_tiem_giay.webp');
    this.load.image(STAGE2_MAP_KEY, './assets/map_man2_tiem_banh.webp');
    this.load.image(STAGE3_MAP_KEY, './assets/map_man3_tiem_hoa.webp');
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
