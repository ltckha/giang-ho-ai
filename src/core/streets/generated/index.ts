/* Tạo tự động bởi tools/level-maker/make-street.ts — đừng sửa tay */
import type { EnemyDefinition, StageDefinition, TowerDefinition } from '../../types';
import s0 from './street_pho_ca_phe.json';
import s1 from './street_tang_bat_ho.json';

export interface GeneratedStreet { hpMultiplier: number; stage: StageDefinition; towers: Record<string, TowerDefinition>; enemies: Record<string, EnemyDefinition> }
export const GENERATED_STREETS: GeneratedStreet[] = [s0 as unknown as GeneratedStreet, s1 as unknown as GeneratedStreet];
