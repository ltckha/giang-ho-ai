import type Phaser from 'phaser';
import type { VehicleDef } from '../core/vehicles';
import { getAtlasFrameDataUrl } from './atlasIcons';

const FALLBACK: Record<string, string> = {
  di_bo: '🩴', xe_dap: '🚲', xe_so: '🏍', xe_ga: '🛵', xe_dien: '⚡', xe_ba_gac: '🛻', xe_jeep: '🚙',
};

/** Hình xe (Spark vẽ: khung vehicle_<id> trong spark_atlas) hoặc biểu tượng tạm */
export function vehicleIconHtml(scene: Phaser.Scene, v: VehicleDef): string {
  const url = getAtlasFrameDataUrl(scene, `vehicle_${v.id}`);
  return url ? `<img class="td-vehicle-ico" src="${url}" alt="${v.name}" />` : `<span class="td-vehicle-ico">${FALLBACK[v.id] ?? '🛵'}</span>`;
}
