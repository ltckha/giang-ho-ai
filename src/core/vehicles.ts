/**
 * Xe chủ tiệm (Claude) — PHƯƠNG TIỆN ra phố, không phải trang bị ngũ hành.
 * - 1 ô riêng ngoài vòng 10 món (như ngựa trong Võ Lâm Truyền Kỳ), không có hành, không tính vào vòng tương sinh.
 * - Chỉ có tác dụng khi RA PHỐ: Trận trùm phố đầu (stage_4) và mọi màn trên phố thật (tiệm + màn phố).
 * - Mỗi xe: 1 tác dụng luôn bật + 1 chiêu bấm được 1 lần mỗi màn.
 * - Nhận xe: thắng lần đầu Trận trùm phố, tiệm thứ 5 của mỗi phố thật và màn phố của mỗi phố thật.
 */
import type { StageDefinition } from './types';

export type VehicleId = 'di_bo' | 'xe_dap' | 'xe_so' | 'xe_ga' | 'xe_dien' | 'xe_ba_gac' | 'xe_jeep';

export interface VehicleDef {
  id: VehicleId;
  name: string;
  /** Hình Spark (art/spark/xe_<...>.png khi có) */
  art: string;
  passiveText: string;
  activeName: string;
  activeText: string;
  passive: { coinPct?: number; earlyBonusPct?: number; buildDiscount?: number; disruptCut?: number; startCoins?: number; lives?: number };
}

export const VEHICLES: Record<VehicleId, VehicleDef> = {
  di_bo: { id: 'di_bo', name: 'Đi Bộ', art: 'xe_di_bo', passiveText: 'Không thêm gì — đi bộ cho khoẻ', activeName: 'Hít Thở Sâu', activeText: '+15 xu', passive: {} },
  xe_dap: { id: 'xe_dap', name: 'Xe Đạp Giỏ Trước', art: 'xe_dap', passiveText: 'Nhặt thêm 10% xu khi dọn quái', activeName: 'Chở Hàng Nhanh', activeText: '+40 xu ngay', passive: { coinPct: 0.1 } },
  xe_so: { id: 'xe_so', name: 'Xe Số Đời Cũ', art: 'xe_so', passiveText: 'Gọi đợt sớm được thưởng thêm 50%', activeName: 'Bóp Còi', activeText: 'Mọi quái chậm 40% trong 4 giây', passive: { earlyBonusPct: 0.5 } },
  xe_ga: { id: 'xe_ga', name: 'Xe Ga Có Cốp', art: 'xe_ga', passiveText: 'Đặt món rẻ hơn 6%', activeName: 'Cốp Xe Rộng', activeText: 'Hồi 3 tim', passive: { buildDiscount: 0.06 } },
  xe_dien: { id: 'xe_dien', name: 'Xe Điện Êm Ru', art: 'xe_dien', passiveText: 'Món bị làm đứng im ngắn hơn một nửa', activeName: 'Chạy Êm', activeText: 'Gỡ đứng im mọi món, 6 giây không bị làm đứng', passive: { disruptCut: 0.5 } },
  xe_ba_gac: { id: 'xe_ba_gac', name: 'Xe Ba Gác Chở Hàng', art: 'xe_ba_gac', passiveText: 'Thêm 30 xu vốn đầu màn', activeName: 'Chất Hàng Chắn Đường', activeText: 'Mọi quái đứng khựng 1,5 giây', passive: { startCoins: 30 } },
  xe_jeep: { id: 'xe_jeep', name: 'Xe Jeep Đồi', art: 'xe_jeep', passiveText: 'Thêm 3 tim giữ phố', activeName: 'Băng Qua Vũng', activeText: 'Mọi quái chậm 25% trong 8 giây, +20 xu', passive: { lives: 3 } },
};

/** Thứ tự nhận xe */
export const VEHICLE_UNLOCK_ORDER: VehicleId[] = ['xe_dap', 'xe_so', 'xe_ga', 'xe_dien', 'xe_ba_gac', 'xe_jeep'];

/** Xe chỉ có tác dụng khi ra phố */
export function vehicleAppliesTo(stage: Pick<StageDefinition, 'id' | 'streetId'>): boolean {
  return stage.id === 'stage_4' || Boolean(stage.streetId);
}

/** Thắng lần đầu màn này thì được nhận xe không? */
export function stageGrantsVehicle(stage: Pick<StageDefinition, 'id' | 'streetId' | 'shopIndex'>): boolean {
  if (stage.id === 'stage_4') return true;
  if (!stage.streetId) return false;
  return !stage.shopIndex || stage.shopIndex === 5;
}

export function nextVehicleToUnlock(owned: VehicleId[]): VehicleId | null {
  return VEHICLE_UNLOCK_ORDER.find((v) => !owned.includes(v)) ?? null;
}
