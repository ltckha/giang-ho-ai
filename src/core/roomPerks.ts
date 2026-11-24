/**
 * Nét riêng theo loại tiệm (Claude, 25/11 — Antigravity gợi ý): mỗi kiểu phòng 1 lợi thế nhỏ,
 * để tiệm lẩu khác tiệm sách về cách đặt món. Cộng vào phần thưởng trang bị khi vào màn.
 */
import type { GearBonus } from './equipment';
import type { StageDefinition } from './types';

export interface RoomPerk {
  icon: string;
  name: string;
  text: string;
}

export const ROOM_PERKS: Record<NonNullable<StageDefinition['roomStyle']>, RoomPerk> = {
  quan_an: { icon: '🔥', name: 'Bếp nóng', text: 'món hành Hỏa mạnh thêm 15%' },
  cafe: { icon: '☕', name: 'Mùi cà phê', text: 'mọi món đánh nhanh thêm 8%' },
  luu_tru: { icon: '🛎️', name: 'Khách quen', text: '+25 xu đầu màn' },
  tiem: { icon: '🏷️', name: 'Ngày giảm giá', text: 'đặt món rẻ hơn 8%' },
};

export function roomPerkOf(stage: StageDefinition): RoomPerk | null {
  return stage.shopIndex && stage.roomStyle ? ROOM_PERKS[stage.roomStyle] : null;
}

/** Trả về phần thưởng trang bị đã cộng lợi thế của phòng (không đổi bản gốc) */
export function applyRoomPerk(gear: GearBonus, stage: StageDefinition): GearBonus {
  if (!stage.shopIndex || !stage.roomStyle) return gear;
  const g: GearBonus = { ...gear, elementDmg: { ...gear.elementDmg }, stats: { ...gear.stats } };
  switch (stage.roomStyle) {
    case 'quan_an':
      g.elementDmg.hoa = (g.elementDmg.hoa ?? 0) + 0.15;
      break;
    case 'cafe':
      g.speedPct += 0.08;
      break;
    case 'luu_tru':
      g.startCoins += 25;
      break;
    case 'tiem':
      g.stats.build_discount += 0.08;
      break;
  }
  return g;
}
