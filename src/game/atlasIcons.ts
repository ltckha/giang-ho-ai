import Phaser from 'phaser';

export const ATLAS_KEY = 'gon_tiem_atlas';
export const STAGE1_MAP_KEY = 'map_man1_tiem_giay';
export const STAGE2_MAP_KEY = 'map_man2_tiem_banh';

const iconDataUrlCache = new Map<string, string>();

/**
 * Cắt 1 khung hình từ Texture Atlas đã nạp sẵn trong Phaser thành Data URL dùng cho HTML HUD/Modal
 * (không cần tải tệp ảnh lẻ, giữ game 100% offline).
 */
export function getAtlasFrameDataUrl(scene: Phaser.Scene, frameName: string): string {
  const cached = iconDataUrlCache.get(frameName);
  if (cached) return cached;

  if (!scene.textures.exists(ATLAS_KEY)) return '';
  const texture = scene.textures.get(ATLAS_KEY);
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
    iconDataUrlCache.set(frameName, url);
    return url;
  } catch {
    return '';
  }
}

export function getTowerTierKey(tier: 1 | 2 | 3, branch?: 'A' | 'B'): string {
  if (tier === 1) return 't1';
  if (tier === 2) return 't2';
  return branch === 'B' ? 't3b' : 't3a';
}

/**
 * HÌNH TẠM Màn 3 (Claude thêm cho Tiệm Hoa chưa vẽ hình; toàn bộ Màn 2 bk_* đã có hình riêng trong atlas và đã xoá alias).
 * Xoá nốt bảng này khi vẽ xong hình Màn 3 vào atlas (docs/YEU_CAU.md).
 */
const PLACEHOLDER_FRAME_ALIAS: Record<string, string> = {
  fl_can: 'wood_tower',
  fl_shears: 'metal_tower',
  fl_lime: 'water_tower',
  fl_heater: 'fire_tower',
  fl_vent: 'earth_tower',
  fl_aphid: 'fast_metal',
  fl_snail: 'tank_earth',
  fl_dust: 'split_fire',
  fl_dust_mini: 'split_fire_mini',
  fl_frost: 'disrupt_water',
  fl_rot: 'healer_wood',
  fl_monsoon: 'boss_water',
};

export function getTowerFrameName(defId: string, tier: 1 | 2 | 3, branch?: 'A' | 'B', frameIdx = 0): string {
  const id = PLACEHOLDER_FRAME_ALIAS[defId] ?? defId;
  return `tower_${id}_${getTowerTierKey(tier, branch)}_f${frameIdx}`;
}

export function getEnemyFrameName(enemyId: string, frameIdx = 0): string {
  const id = PLACEHOLDER_FRAME_ALIAS[enemyId] ?? enemyId;
  return `enemy_${id}_f${frameIdx}`;
}
