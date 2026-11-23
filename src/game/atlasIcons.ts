import Phaser from 'phaser';
import type { GearSlotId } from '../core/equipment';
import { ALL_ENEMY_DEFINITIONS, ALL_TOWER_DEFINITIONS, REAL_STREET_STAGES, STAGES } from '../core/tdDefinitions';
import type { ElementType, EnemyId, StageId, TowerId } from '../core/types';
import sparkAtlas from '../../public/assets/spark_atlas.json';
import streetsAtlas from '../../public/assets/streets_atlas.json';

/** Hình Spark đã ghép (món / quái có trường `art` trong spark_atlas.json) */
const SPARK_TOWER_ARTS = new Set<string>(sparkAtlas.meta.arts.towers);
const SPARK_ENEMY_ARTS = new Set<string>(sparkAtlas.meta.arts.enemies);
const STREETS_ATLAS_FRAMES = new Set<string>(Object.keys((streetsAtlas as { frames: Record<string, unknown> }).frames));

export const ATLAS_KEY = 'gon_tiem_atlas';
export const STREETS_ATLAS_KEY = 'streets_atlas';
export const GEAR_ATLAS_KEY = 'gear_atlas';
export const STAGE1_MAP_KEY = 'map_man1_tiem_giay';
export const STAGE2_MAP_KEY = 'map_man2_tiem_banh';
export const STAGE3_MAP_KEY = 'map_man3_tiem_hoa';
export const STAGE4_MAP_KEY = 'map_trum_pho';
/** Nền mỗi phố thật: public/assets/map_<id>.webp (vẽ tay hoặc tools/level-maker/make_street_map.py) */
export const STREET_MAP_KEYS: Record<string, string> = Object.fromEntries(
  REAL_STREET_STAGES.map((st) => [st.id, `map_${st.id}`]),
);

const iconDataUrlCache = new Map<string, string>();

export function getStageMapKey(stageId: StageId): string | undefined {
  if (stageId === 'stage_1') return STAGE1_MAP_KEY;
  if (stageId === 'stage_2') return STAGE2_MAP_KEY;
  if (stageId === 'stage_3') return STAGE3_MAP_KEY;
  if (stageId === 'stage_4') return STAGE4_MAP_KEY;
  return STREET_MAP_KEYS[STAGES[stageId]?.mapStageId ?? stageId];
}

function getSparkTowerArt(defId: string): string | null {
  const art = ALL_TOWER_DEFINITIONS[defId as TowerId]?.art;
  return art && SPARK_TOWER_ARTS.has(art) ? art : null;
}

function getSparkEnemyArt(enemyId: string): string | null {
  const art = ALL_ENEMY_DEFINITIONS[enemyId as EnemyId]?.art;
  return art && SPARK_ENEMY_ARTS.has(art) ? art : null;
}

/** Món sinh tự động chưa có hình (Spark chưa vẽ) → mượn hình món tiệm giày cùng vai (Claude) */
const ROLE_STAND_IN: Record<string, string> = {
  single_far: 'wood_tower', heavy_slow: 'metal_tower', slow_aura: 'water_tower', aoe_splash: 'fire_tower', support_buff: 'earth_tower',
};
function towerStandIn(defId: string): string {
  if (!defId.startsWith('gt_') || getSparkTowerArt(defId) || STREETS_ATLAS_FRAMES.has(`tower_${defId}_t1_f0`)) return defId;
  return ROLE_STAND_IN[ALL_TOWER_DEFINITIONS[defId as TowerId]?.role ?? ''] ?? 'wood_tower';
}
const TRAIT_STAND_IN: Record<string, string> = {
  fast: 'fast_metal', tank: 'tank_earth', flying: 'fly_wood', splitter: 'split_fire', mini: 'split_fire_mini', disruptor: 'disrupt_water', healer: 'healer_wood',
};

export function getTowerAtlasKey(defIdRaw: string): string {
  const defId = towerStandIn(defIdRaw);
  if (getSparkTowerArt(defId)) return ATLAS_KEY;
  if (STREETS_ATLAS_FRAMES.has(`tower_${defId}_t1_f0`)) return STREETS_ATLAS_KEY;
  return ATLAS_KEY;
}

/** Trùm phố thật chưa có hình riêng → tạm mượn hình Trùm Bão Lốc (Claude) */
function bossStandIn(enemyId: string): string {
  if (!enemyId.startsWith('ge_') || getSparkEnemyArt(enemyId) || STREETS_ATLAS_FRAMES.has(`enemy_${enemyId}_f0`)) return enemyId;
  const trait = ALL_ENEMY_DEFINITIONS[enemyId as EnemyId]?.trait ?? '';
  return trait === 'boss' ? 'st_bao_loc' : TRAIT_STAND_IN[trait] ?? 'fast_metal';
}

export function getEnemyAtlasKey(enemyIdRaw: string): string {
  const enemyId = bossStandIn(enemyIdRaw);
  if (getSparkEnemyArt(enemyId)) return ATLAS_KEY;
  if (enemyId === 'st_bao_loc' || STREETS_ATLAS_FRAMES.has(`enemy_${enemyId}_f0`)) return STREETS_ATLAS_KEY;
  return ATLAS_KEY;
}

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
  if (!texture.has(frameName)) return '';
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
  const primary = getAtlasFrameDataUrlFrom(scene, ATLAS_KEY, frameName);
  if (primary) return primary;
  return getAtlasFrameDataUrlFrom(scene, STREETS_ATLAS_KEY, frameName);
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

export function getTowerFrameName(defIdRaw: string, tier: 1 | 2 | 3, branch?: 'A' | 'B', frameIdx = 0): string {
  const defId = towerStandIn(defIdRaw);
  const sparkArt = getSparkTowerArt(defId);
  const keyPart = sparkArt ? `art_${sparkArt}` : defId;
  return `tower_${keyPart}_${getTowerTierKey(tier, branch)}_f${frameIdx}`;
}

export function getEnemyFrameName(enemyIdRaw: string, frameIdx = 0, element?: ElementType): string {
  const enemyId = bossStandIn(enemyIdRaw);
  const sparkArt = getSparkEnemyArt(enemyId);
  if (sparkArt) return `enemy_art_${sparkArt}_f${frameIdx}`;
  if (enemyId === 'fl_monsoon' && (element === 'moc' || element === 'kim')) {
    return `enemy_fl_monsoon_${element}_f${frameIdx}`;
  }
  if (
    enemyId === 'st_bao_loc' &&
    (element === 'moc' || element === 'hoa' || element === 'tho' || element === 'kim')
  ) {
    return `enemy_st_bao_loc_${element}_f${frameIdx}`;
  }
  return `enemy_${enemyId}_f${frameIdx}`;
}

export function getEnemyWalkAnimKey(enemyIdRaw: string, element?: ElementType): string {
  const enemyId = bossStandIn(enemyIdRaw);
  const sparkArt = getSparkEnemyArt(enemyId);
  if (sparkArt) return `anim_walk_art_${sparkArt}`;
  if (enemyId === 'fl_monsoon' && (element === 'moc' || element === 'kim')) {
    return `anim_walk_fl_monsoon_${element}`;
  }
  if (
    enemyId === 'st_bao_loc' &&
    (element === 'moc' || element === 'hoa' || element === 'tho' || element === 'kim')
  ) {
    return `anim_walk_st_bao_loc_${element}`;
  }
  return `anim_walk_${enemyId}`;
}
