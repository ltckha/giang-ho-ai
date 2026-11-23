import Phaser from 'phaser';
import type { GearSlotId } from '../core/equipment';
import type { ElementType, EnemyId, TowerId } from '../core/types';
import { ALL_ENEMY_DEFINITIONS, ALL_TOWER_DEFINITIONS } from '../core/tdDefinitions';
import sparkAtlas from '../../public/assets/spark_atlas.json';

/** Hình Spark đã ghép (món / quái có `art` mà chưa có hình thì vẫn dùng hình tạm) */
const SPARK_TOWER_ARTS = new Set<string>(sparkAtlas.meta.arts.towers);
const SPARK_ENEMY_ARTS = new Set<string>(sparkAtlas.meta.arts.enemies);

export const ATLAS_KEY = 'gon_tiem_atlas';
export const GEAR_ATLAS_KEY = 'gear_atlas';
export const STAGE1_MAP_KEY = 'map_man1_tiem_giay';
export const STAGE2_MAP_KEY = 'map_man2_tiem_banh';
export const STAGE3_MAP_KEY = 'map_man3_tiem_hoa';

const iconDataUrlCache = new Map<string, string>();

/**
 * Cắt 1 khung hình từ Texture Atlas đã nạp sẵn trong Phaser thành Data URL dùng cho HTML HUD/Modal
 * (không cần tải tệp ảnh lẻ, giữ game 100% offline).
 */
export function getAtlasFrameDataUrlFrom(
  scene: Phaser.Scene,
  atlasKey: string,
  frameName: string,
): string {
  const cacheKey = `${atlasKey}::${frameName}`;
  const cached = iconDataUrlCache.get(cacheKey);
  if (cached) return cached;

  if (!scene.textures.exists(atlasKey)) return '';
  const texture = scene.textures.get(atlasKey);
  const frame = texture.get(frameName);
  if (!frame || frame.name === '__MISSING') return '';

  // khung có thể nằm ở tấm hình phụ (hình Spark gắn thêm) -> lấy đúng ảnh nguồn của khung
  const sourceImg = (frame.source?.image ?? texture.getSourceImage()) as HTMLImageElement | HTMLCanvasElement | undefined;
  if (!sourceImg) return '';

  try {
    const canvas = document.createElement('canvas');
    canvas.width = frame.width;
    canvas.height = frame.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(
      sourceImg,
      frame.cutX,
      frame.cutY,
      frame.cutWidth,
      frame.cutHeight,
      0,
      0,
      frame.width,
      frame.height,
    );
    const url = canvas.toDataURL('image/png');
    iconDataUrlCache.set(cacheKey, url);
    return url;
  } catch {
    return '';
  }
}

export function getAtlasFrameDataUrl(scene: Phaser.Scene, frameName: string): string {
  return getAtlasFrameDataUrlFrom(scene, ATLAS_KEY, frameName);
}

export function getGearAtlasFrameDataUrl(scene: Phaser.Scene, frameName: string): string {
  return getAtlasFrameDataUrlFrom(scene, GEAR_ATLAS_KEY, frameName);
}

export function getGearIconFrameName(slot: GearSlotId, element: ElementType): string {
  return `gear_${slot}_${element}`;
}

export function getGearSetBadgeFrameName(setId: string): string {
  return `set_${setId}`;
}

export function getTowerTierKey(tier: 1 | 2 | 3, branch?: 'A' | 'B'): string {
  if (tier === 1) return 't1';
  if (tier === 2) return 't2';
  return branch === 'B' ? 't3b' : 't3a';
}

/**
 * HÌNH TẠM (Claude) cho món / quái chưa có hình riêng:
 * - món phố thật (gt_*) mượn hình món tiệm giày cùng vai; quái phố thật (ge_*) mượn hình quái cùng kiểu;
 * - trùm phố (st_bao_loc) mượn hình Trùm Mùa Nồm theo hành.
 * Antigravity thay bằng hình riêng khi vẽ (docs/YEU_CAU.md).
 */
const ROLE_FALLBACK_TOWER: Record<string, string> = {
  single_far: 'wood_tower', heavy_slow: 'metal_tower', slow_aura: 'water_tower', aoe_splash: 'fire_tower', support_buff: 'earth_tower',
};
const TRAIT_FALLBACK_ENEMY: Record<string, string> = {
  fast: 'fast_metal', tank: 'tank_earth', flying: 'fly_wood', splitter: 'split_fire', mini: 'split_fire_mini', disruptor: 'disrupt_water', healer: 'healer_wood', boss: 'fl_monsoon',
};
function placeholderTowerId(defId: string): string {
  const art = ALL_TOWER_DEFINITIONS[defId as TowerId]?.art;
  if (art && SPARK_TOWER_ARTS.has(art)) return `art_${art}`;
  if (!defId.startsWith('gt_')) return defId;
  const role = ALL_TOWER_DEFINITIONS[defId as TowerId]?.role;
  return (role && ROLE_FALLBACK_TOWER[role]) || 'wood_tower';
}
function placeholderEnemyId(enemyId: string): string {
  const art = ALL_ENEMY_DEFINITIONS[enemyId as EnemyId]?.art;
  if (art && SPARK_ENEMY_ARTS.has(art)) return `art_${art}`;
  if (enemyId === 'st_bao_loc') return 'fl_monsoon';
  if (!enemyId.startsWith('ge_')) return enemyId;
  const trait = ALL_ENEMY_DEFINITIONS[enemyId as EnemyId]?.trait;
  return (trait && TRAIT_FALLBACK_ENEMY[trait]) || 'fast_metal';
}

export function getTowerFrameName(defId: string, tier: 1 | 2 | 3, branch?: 'A' | 'B', frameIdx = 0): string {
  return `tower_${placeholderTowerId(defId)}_${getTowerTierKey(tier, branch)}_f${frameIdx}`;
}

export function getEnemyFrameName(enemyIdRaw: string, frameIdx = 0, element?: ElementType): string {
  const enemyId = placeholderEnemyId(enemyIdRaw);
  if (enemyId === 'fl_monsoon' && (element === 'moc' || element === 'kim')) {
    return `enemy_fl_monsoon_${element}_f${frameIdx}`;
  }
  return `enemy_${enemyId}_f${frameIdx}`;
}

export function getEnemyWalkAnimKey(enemyIdRaw: string, element?: ElementType): string {
  const enemyId = placeholderEnemyId(enemyIdRaw);
  if (enemyId === 'fl_monsoon' && (element === 'moc' || element === 'kim')) {
    return `anim_walk_fl_monsoon_${element}`;
  }
  return `anim_walk_${enemyId}`;
}
