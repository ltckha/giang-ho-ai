import Phaser from 'phaser';
import type { GearSlotId } from '../core/equipment';
import type { ElementType } from '../core/types';

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

  const sourceImg = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
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

export function getTowerFrameName(defId: string, tier: 1 | 2 | 3, branch?: 'A' | 'B', frameIdx = 0): string {
  return `tower_${defId}_${getTowerTierKey(tier, branch)}_f${frameIdx}`;
}

export function getEnemyFrameName(enemyId: string, frameIdx = 0, element?: ElementType): string {
  if (enemyId === 'fl_monsoon' && (element === 'moc' || element === 'kim')) {
    return `enemy_fl_monsoon_${element}_f${frameIdx}`;
  }
  return `enemy_${enemyId}_f${frameIdx}`;
}

export function getEnemyWalkAnimKey(enemyId: string, element?: ElementType): string {
  if (enemyId === 'fl_monsoon' && (element === 'moc' || element === 'kim')) {
    return `anim_walk_fl_monsoon_${element}`;
  }
  return `anim_walk_${enemyId}`;
}
