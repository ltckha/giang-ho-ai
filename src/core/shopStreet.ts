/**
 * Con phố dốc (Claude): danh sách tiệm theo thứ tự trên phố. Thêm tiệm mới = thêm 1 dòng.
 * Màn hình chọn màn (Antigravity vẽ) đọc danh sách này.
 */
import { STAGES } from './tdDefinitions';
import type { StageDefinition, TdSaveData } from './types';

export interface ShopOnStreet {
  stageId: 'stage_1' | 'stage_2' | 'stage_3';
  order: number;
  /** Tên ngắn trên biển hiệu */
  sign: string;
  /** Đơn vị "mạng" của tiệm (đôi giày / ổ bánh / chậu hoa) */
  lifeUnit: string;
  /** Gợi ý vẽ mặt tiền */
  facadeHint: string;
}

export const SHOP_STREET: ShopOnStreet[] = [
  { stageId: 'stage_1', order: 1, sign: 'Tiệm Giày', lifeUnit: 'đôi giày', facadeHint: 'mặt tiền gỗ, kệ giày sau kính, mái hiên sọc' },
  { stageId: 'stage_2', order: 2, sign: 'Tiệm Bánh', lifeUnit: 'ổ bánh', facadeHint: 'tủ kính bánh mì, bao bột, đèn vàng ấm' },
  { stageId: 'stage_3', order: 3, sign: 'Tiệm Hoa', lifeUnit: 'chậu hoa', facadeHint: 'chậu đất nung, nhà kính nhỏ, hoa nhiều màu' },
];

export function getShopStage(shop: ShopOnStreet): StageDefinition {
  return STAGES[shop.stageId];
}

/** Tiệm mở khi đã qua tiệm đứng trước (tiệm đầu luôn mở) */
export function isShopUnlocked(save: Pick<TdSaveData, 'unlockedStage'>, shop: ShopOnStreet): boolean {
  return shop.order <= save.unlockedStage;
}

export function shopStars(save: Pick<TdSaveData, 'starsByStage'>, shop: ShopOnStreet): 0 | 1 | 2 | 3 {
  return save.starsByStage[shop.stageId] ?? 0;
}
