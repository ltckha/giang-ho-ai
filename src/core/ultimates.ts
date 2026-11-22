/**
 * Bậc 4 "tuyệt chiêu" (Claude): mở từ Màn 2. Món đã lên bậc 3 trả thêm xu để có tuyệt chiêu:
 * - Bị động: +20% sức đánh.
 * - Chủ động: bấm dùng, hồi chiêu ULTIMATE_COOLDOWN_SEC giây. Hiệu ứng theo vai của món.
 */
import type { TowerId, TowerRole } from './types';

export const ULTIMATE_COST = 150;
export const ULTIMATE_COOLDOWN_SEC = 30;
export const ULTIMATE_PASSIVE_DAMAGE_BONUS = 0.2;
export const ULTIMATE_MIN_STAGE = 2;

/** Thông số hiệu ứng theo vai */
export const ULTIMATE_EFFECT = {
  /** Ném / đập nhanh: bắn nhanh gấp 2.5 trong 5 giây */
  single_far: { durationSec: 5, speedMultiplier: 2.5 },
  /** Đánh mạnh: đánh tất cả quái trong tầm ×3 sức, choáng 1s (trùm 0.5s) */
  heavy_slow: { damageMultiplier: 3, stunSec: 1, bossStunSec: 0.5 },
  /** Làm chậm: giữ chân mọi quái trong tầm 2s (trùm 1s), kể cả con bay */
  slow_aura: { stunSec: 2, bossStunSec: 1 },
  /** Đánh lan: nổ cả tầm ×2.5 sức, đốt thêm 4s */
  aoe_splash: { damageMultiplier: 2.5, burnSec: 4 },
  /** Hỗ trợ: món trong tầm bắn nhanh thêm 60% trong 6s, gỡ ngay trạng thái đứng im */
  support_buff: { durationSec: 6, speedBonus: 0.6 },
} as const;

export const ULTIMATE_ROLE_TEXT: Record<TowerRole, string> = {
  single_far: 'Bắn nhanh gấp 2,5 lần trong 5 giây.',
  heavy_slow: 'Đánh mọi quái trong tầm, sức ×3, choáng 1 giây.',
  slow_aura: 'Giữ chân mọi quái trong tầm 2 giây, kể cả con bay.',
  aoe_splash: 'Nổ cả vùng tầm đánh, sức ×2,5, đốt thêm 4 giây.',
  support_buff: 'Món quanh nó nhanh thêm 60% trong 6 giây, gỡ ngay món đang đứng im.',
};

export const ULTIMATE_NAMES: Record<TowerId, string> = {
  wood_tower: 'Mưa Dép',
  metal_tower: 'Cú Dậm Sấm',
  water_tower: 'Màn Sương Đặc',
  fire_tower: 'Bão Hút Ẩm',
  earth_tower: 'Sấy Toàn Tiệm',
  bk_swatter: 'Đập Liên Hồi',
  bk_jar: 'Úp Cả Mẻ',
  bk_fan: 'Lốc Xoáy',
  bk_oven: 'Bùng Lửa',
  bk_fridge: 'Khí Lạnh Bao Trùm',
  fl_can: 'Mưa Rào Tưới Đẫm',
  fl_shears: 'Tỉa Sạch Một Đường',
  fl_lime: 'Vòng Vôi Khóa Chặt',
  fl_heater: 'Hơi Ấm Bùng Lên',
  fl_vent: 'Gió Lùa Thông Thoáng',
};
