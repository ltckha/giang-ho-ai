import Phaser from 'phaser';

export const ATLAS_KEY = 'gon_tiem_atlas';
export const STAGE1_MAP_KEY = 'map_man1_tiem_giay';

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

export function getTowerFrameName(defId: string, tier: 1 | 2 | 3, branch?: 'A' | 'B', frameIdx = 0): string {
  return `tower_${defId}_${getTowerTierKey(tier, branch)}_f${frameIdx}`;
}

export function getEnemyFrameName(enemyId: string, frameIdx = 0): string {
  return `enemy_${enemyId}_f${frameIdx}`;
}
