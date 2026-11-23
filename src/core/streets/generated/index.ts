/* Tạo tự động bởi tools/level-maker/make-street.ts — đừng sửa tay */
import type { EnemyDefinition, StageDefinition, TowerDefinition } from '../../types';
import s0 from './street_hoang_dieu.json';
import s1 from './street_nguyen_van_troi.json';
import s2 from './street_phan_dinh_phung.json';
import s3 from './street_pho_ca_phe.json';
import s4 from './street_tang_bat_ho.json';
import s5 from './street_tran_phu.json';

export interface GeneratedShop { hpMultiplier: number; balance: { randomWinWithExpectedGear: number; botWinRate: number; botLivesAvg: number; target: number }; stage: StageDefinition }
export interface GeneratedStreet { hpMultiplier: number; stage: StageDefinition; shops: GeneratedShop[]; towers: Record<string, TowerDefinition>; enemies: Record<string, EnemyDefinition> }
export const GENERATED_STREETS: GeneratedStreet[] = [s0 as unknown as GeneratedStreet, s1 as unknown as GeneratedStreet, s2 as unknown as GeneratedStreet, s3 as unknown as GeneratedStreet, s4 as unknown as GeneratedStreet, s5 as unknown as GeneratedStreet];
