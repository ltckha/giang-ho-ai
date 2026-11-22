import type { MapId } from '../core/types';

export const SCENE_KEYS = {
  BOOT: 'BootScene',
  TITLE: 'TitleScene',
  TOWN: 'TownScene',
  FOREST: 'ForestScene',
  CAVE: 'CaveScene',
  UI: 'UIScene',
} as const;

export function getSceneKeyForMap(mapId: MapId): string {
  switch (mapId) {
    case 'map_town':
      return SCENE_KEYS.TOWN;
    case 'map_forest':
      return SCENE_KEYS.FOREST;
    case 'map_cave':
      return SCENE_KEYS.CAVE;
  }
}
