import type { MapId } from '../core/types';

export const SCENE_KEYS = {
  BOOT: 'BootScene',
  TITLE: 'TitleScene',
  TOWN: 'TownScene',
  FOREST: 'ForestScene',
  CAVE: 'CaveScene',
  INNER_CITY: 'InnerCityScene',
  VALLEY: 'ValleyScene',
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
    case 'map_inner_city':
      return SCENE_KEYS.INNER_CITY;
    case 'map_valley':
      return SCENE_KEYS.VALLEY;
  }
}
