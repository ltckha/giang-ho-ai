import { ALL_ELEMENTS, ELEMENT_GENERATES, ELEMENT_INFO } from '../core/elements';
import {
  activatedHiddenCount,
  isFullRing,
  supporterSlots,
  type Equipped,
  type GearRarity,
  type GearSlotId,
  type GearStatKind,
} from '../core/equipment';
import type { ElementType } from '../core/types';

export interface RarityTheme {
  border: string;
  bg: string;
  badgeBg: string;
  badgeText: string;
  glow: string;
  labelShort: string;
}

/** Bảng màu theo 4 hạng trang bị v2: Thường (xám) / Tốt (xanh) / Xịn (tím) / Hàng hiệu (vàng) */
export const RARITY_THEME: Record<GearRarity, RarityTheme> = {
  thuong: {
    border: '#94a3b8',
    bg: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
    badgeBg: '#64748b',
    badgeText: '#ffffff',
    glow: 'rgba(148, 163, 184, 0.28)',
    labelShort: 'Thường',
  },
  tot: {
    border: '#38bdf8',
    bg: 'linear-gradient(180deg, #f0f9ff 0%, #cceeff 100%)',
    badgeBg: '#0284c7',
    badgeText: '#ffffff',
    glow: 'rgba(56, 189, 248, 0.35)',
    labelShort: 'Tốt',
  },
  xin: {
    border: '#a855f7',
    bg: 'linear-gradient(180deg, #faf5ff 0%, #ead5ff 100%)',
    badgeBg: '#7e22ce',
    badgeText: '#ffffff',
    glow: 'rgba(168, 85, 247, 0.38)',
    labelShort: 'Xịn',
  },
  hieu: {
    border: '#f59e0b',
    bg: 'linear-gradient(180deg, #fffbeb 0%, #fde68a 100%)',
    badgeBg: '#b45309',
    badgeText: '#fffbeb',
    glow: 'rgba(245, 158, 11, 0.55)',
    labelShort: 'Hàng hiệu',
  },
};

/** Tìm hành sinh ra targetEl (để gợi ý cho người chơi biết cần hành nào ở ô chống lưng) */
export function getGeneratorElementFor(targetEl: ElementType): ElementType {
  for (const el of ALL_ELEMENTS) {
    if (ELEMENT_GENERATES[el] === targetEl) return el;
  }
  return 'kim';
}

export interface SlotSupportState {
  supA: GearSlotId;
  supB: GearSlotId;
  aActive: boolean;
  bActive: boolean;
  activeLines: number;
  totalHidden: number;
  fullRing: boolean;
}

export function getSlotSupportState(eq: Equipped, slotId: GearSlotId): SlotSupportState {
  const [supA, supB] = supporterSlots(slotId);
  const item = eq[slotId];
  const fullRing = isFullRing(eq);
  const counts = activatedHiddenCount(eq);
  const aActive = Boolean(item && eq[supA] && ELEMENT_GENERATES[eq[supA]!.element] === item.element);
  const bActive = Boolean(item && eq[supB] && ELEMENT_GENERATES[eq[supB]!.element] === item.element);
  return {
    supA,
    supB,
    aActive,
    bActive,
    activeLines: counts[slotId] ?? 0,
    totalHidden: item ? item.hidden.length : 0,
    fullRing,
  };
}

/** Bóng mờ gợi ý loại món cho ô trống trong vòng trang bị */
export function getEmptySlotSilhouetteSvg(slot: GearSlotId): string {
  const s = 'stroke="#7b5838" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  const paths: Record<GearSlotId, string> = {
    hat: `<path d="M6 16c0-5 3-8 6-8s6 3 6 8" ${s}/><path d="M3 16h18" ${s}/><circle cx="12" cy="6" r="1.6" ${s}/>`,
    glasses: `<circle cx="7.5" cy="13" r="3.5" ${s}/><circle cx="16.5" cy="13" r="3.5" ${s}/><path d="M11 13h2M4 12l2-3M20 12l-2-3" ${s}/>`,
    jacket: `<path d="M8 5l4 3 4-3 4 4-2 3v7H6v-7L4 9z" ${s}/><line x1="12" y1="8" x2="12" y2="19" ${s}/>`,
    belt: `<ellipse cx="12" cy="12" rx="8" ry="4.5" ${s}/><rect x="6" y="12" width="5" height="4.5" rx="1" fill="#efe0c2" ${s}/>`,
    shoes: `<path d="M5 15V9h4l2 3h6a2 2 0 0 1 2 2v2H5z" ${s}/><line x1="5" y1="18" x2="19" y2="18" ${s}/>`,
    bag: `<rect x="6" y="10" width="12" height="9" rx="2" ${s}/><path d="M9 10V7a3 3 0 0 1 6 0v3" ${s}/><path d="M6 13h12" ${s}/>`,
    wallet: `<rect x="4" y="7" width="16" height="11" rx="2.5" ${s}/><path d="M15 11h5v3h-5a1.5 1.5 0 0 1 0-3z" ${s}/>`,
    watch: `<rect x="9" y="3" width="6" height="4" rx="1" ${s}/><rect x="9" y="17" width="6" height="4" rx="1" ${s}/><circle cx="12" cy="12" r="5" ${s}/><path d="M12 10v2l1.5 1" ${s}/>`,
    phone: `<rect x="7" y="3.5" width="10" height="17" rx="2" ${s}/><circle cx="12" cy="17.5" r="0.9" fill="#7b5838"/><line x1="10" y1="6" x2="14" y2="6" ${s}/>`,
    umbrella: `<path d="M4 13a8 8 0 0 1 16 0z" ${s}/><path d="M12 13v6a2 2 0 0 1-4 0" ${s}/>`,
  };
  return `<svg class="td-slot-silhouette" viewBox="0 0 24 24" aria-hidden="true">${paths[slot]}</svg>`;
}

/** 19 biểu tượng nhỏ vui cho 19 dòng thuộc tính trong STAT_NAME (equipment.ts) */
export function getStatMiniIconSvg(kind: GearStatKind): string {
  const icons: Record<GearStatKind, { bg: string; fg: string; path: string }> = {
    // Đúng gu — ngôi sao sắc nét
    elem_dmg: { bg: '#fef3c7', fg: '#b45309', path: '<path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z" fill="currentColor"/>' },
    // Tự tin — nắm đấm / tia lực
    all_dmg: { bg: '#fee2e2', fg: '#dc2626', path: '<path d="M9 1.5L3.5 9h4l-1 5.5L12.5 7h-4z" fill="currentColor"/>' },
    // Wifi mạnh — sóng wifi 3 vạch
    range: { bg: '#e0f2fe', fg: '#0284c7', path: '<path d="M2.2 6.5a8.5 8.5 0 0 1 11.6 0M4.5 9.2a5.2 5.2 0 0 1 7 0M7 12a1.6 1.6 0 0 1 2 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="8" cy="13.2" r="1.2" fill="currentColor"/>' },
    // Cà phê sữa đá — ly cà phê
    speed: { bg: '#ffedd5', fg: '#9a3412', path: '<path d="M4 5h8l-1 8H5z" fill="currentColor"/><path d="M3.5 5h9M6 3v1.5M9.5 2.5v2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' },
    // Freeship — hộp hàng giao nhanh
    start_coins: { bg: '#fef9c3', fg: '#ca8a04', path: '<rect x="3" y="5" width="10" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 8.2h10M8 5v8" stroke="currentColor" stroke-width="1.4"/>' },
    // Chống nước — khiên giọt nước
    lives: { bg: '#dbeafe', fg: '#1d4ed8', path: '<path d="M8 2L3 4.2v4c0 3.3 2.2 5.4 5 6.3 2.8-.9 5-3 5-6.3v-4z" fill="currentColor"/>' },
    // Ví đầy — đồng xu tròn
    coin_pct: { bg: '#fef3c7', fg: '#d97706', path: '<circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><text x="8" y="11" text-anchor="middle" font-size="8" font-weight="800" fill="currentColor">₫</text>' },
    // Pin trâu — viên pin đầy
    ult_cd: { bg: '#dcfce7', fg: '#15803d', path: '<rect x="2.5" y="4.5" width="9.5" height="7" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="4.5" y="6.3" width="5.5" height="3.4" fill="currentColor"/><rect x="12.5" y="6.5" width="1.6" height="3" rx="0.5" fill="currentColor"/>' },
    // Sạc nhanh — tia sét trong vòng
    ult_cost: { bg: '#fef08a', fg: '#b45309', path: '<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8.8 3.6L5.5 8.4h2.6l-.9 4 3.3-4.8H7.9z" fill="currentColor"/>' },
    // Mã giảm giá — thẻ voucher %
    upgrade_discount: { bg: '#fce7f3', fg: '#be185d', path: '<path d="M2.5 5.2h11v2a1.3 1.3 0 0 0 0 2.6v2h-11v-2a1.3 1.3 0 0 0 0-2.6z" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="6" y1="10.5" x2="10" y2="5.5" stroke="currentColor" stroke-width="1.4"/>' },
    // Flash sale — thẻ giá tia chớp
    build_discount: { bg: '#ffedd5', fg: '#ea580c', path: '<path d="M2.5 8.5L8 3h5v5l-5.5 5.5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="10.5" cy="5.5" r="1.1" fill="currentColor"/>' },
    // Bảo hành 12 tháng — dấu tích trong khiên
    sell_refund: { bg: '#e0e7ff', fg: '#4338ca', path: '<circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5.4 8.2l1.8 1.8 3.5-3.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' },
    // Bắt trend — mũi tên xu hướng tăng
    counter_dmg: { bg: '#ffe4e6', fg: '#e11d48', path: '<path d="M2.5 11.5l3.5-3.5 2.5 2 4.8-5.2M10 4.8h3.3v3.3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' },
    // Combo — 2 vòng móc nối tương sinh
    synergy_bonus: { bg: '#f3e8ff', fg: '#7e22ce', path: '<circle cx="6" cy="8" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="10" cy="8" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/>' },
    // Gió Đà Lạt — xoáy gió mát
    slow_dur: { bg: '#cffafe', fg: '#0e7490', path: '<path d="M2.5 6.2h7.5a1.8 1.8 0 1 0-1.5-2.7M2.5 9.6h9.5a1.8 1.8 0 1 1-1.4 2.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' },
    // Đi mưa không ướt — ô che mưa nhỏ
    weaken_thuy: { bg: '#e0f2fe', fg: '#0369a1', path: '<path d="M2.5 8.5a5.5 5.5 0 0 1 11 0z" fill="currentColor"/><path d="M8 8.5v4a1.4 1.4 0 0 1-2.8 0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
    // Xịt côn trùng — chiếc lá & tia xịt
    weaken_moc: { bg: '#dcfce7', fg: '#166534', path: '<path d="M4 12.5C4 7 8 4 12.5 3.5 12 8.5 9.2 12 4 12.5z" fill="currentColor"/>' },
    // Khách quen — hộp quà thưởng rơi đồ
    extra_drop: { bg: '#fef3c7', fg: '#b45309', path: '<rect x="3" y="6.5" width="10" height="6.8" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 6.5v6.8M2.5 6.5h11M8 6.5c-1.8-2.2-3.5-.5-2 0M8 6.5c1.8-2.2 3.5-.5 2 0" fill="none" stroke="currentColor" stroke-width="1.4"/>' },
    // Săn trùm — vương miện
    boss_dmg: { bg: '#fef3c7', fg: '#b91c1c', path: '<path d="M2.5 12l1.2-6 2.8 2.6L8 4.2l1.5 4.4 2.8-2.6 1.2 6z" fill="currentColor"/>' },
  };
  const ic = icons[kind];
  return `<span class="td-stat-ico" style="background:${ic.bg};color:${ic.fg}"><svg viewBox="0 0 16 16" aria-hidden="true">${ic.path}</svg></span>`;
}

export function getElementGlowColor(el: ElementType): string {
  return ELEMENT_INFO[el].colorHex;
}
