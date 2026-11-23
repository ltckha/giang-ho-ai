import { ELEMENT_INFO } from '../core/elements';
import { ALL_TOWER_DEFINITIONS } from '../core/tdDefinitions';
import type { ElementType, TowerId } from '../core/types';

export interface SynergyDescription {
  title: string;
  explanation: string;
  elementPairLabel: string;
}

const SPECIFIC_PAIR_EXPLANATIONS: Partial<Record<`${TowerId}->${TowerId}`, string>> = {
  // Màn 2 — Tiệm Bánh Đầu Phố (5 cặp tương sinh Ngũ Hành)
  'bk_fan->bk_oven': 'Gió thổi lửa to hơn — Mộc sinh Hỏa',
  'bk_oven->bk_jar': 'Hơi ấm lò nung hũ sành khô chắc hơn — Hỏa sinh Thổ',
  'bk_jar->bk_swatter': 'Hũ sành vững làm điểm tựa đập mạnh hơn — Thổ sinh Kim',
  'bk_swatter->bk_fridge': 'Khung sắt giữ cửa tủ kín hơi lạnh — Kim sinh Thủy',
  'bk_fridge->bk_fan': 'Gió mát từ tủ thổi xa hơn — Thủy sinh Mộc',

  // Tiệm Giày & Tiệm Hoa (dùng chung cho mọi màn bật tương sinh)
  'earth_tower->fire_tower': 'Sấy khô gói hút ẩm thì hút mạnh lại — Hỏa sinh Thổ',
  'fl_can->fl_vent': 'Hơi ẩm mát giúp quạt thông gió dịu hơn — Thủy sinh Mộc',
  'fl_vent->fl_heater': 'Gió thông thoáng giúp đèn sưởi lan đều — Mộc sinh Hỏa',
  'fl_heater->fl_lime': 'Hơi ấm giữ vôi bột khô tơi hơn — Hỏa sinh Thổ',
  'fl_lime->fl_shears': 'Vôi khô giữ lưỡi kéo sạch sắc hơn — Thổ sinh Kim',
  'fl_shears->fl_can': 'Cắt tỉa gọn cho tia nước tưới thấm đều — Kim sinh Thủy',
};

export function getSynergyChainBonusPct(chainLength: number): number {
  if (chainLength >= 4) return 40;
  if (chainLength === 3) return 25;
  if (chainLength === 2) return 15;
  return 0;
}

export function getSynergyExplanation(
  giverDefId: TowerId,
  giverElement: ElementType,
  receiverDefId: TowerId,
  receiverElement: ElementType,
  chainLength = 2,
): SynergyDescription {
  const gEl = ELEMENT_INFO[giverElement];
  const rEl = ELEMENT_INFO[receiverElement];
  const gName = ALL_TOWER_DEFINITIONS[giverDefId].tier1.name;
  const rName = ALL_TOWER_DEFINITIONS[receiverDefId].tier1.name;
  const elementPairLabel = `${gEl.label} sinh ${rEl.label}`;
  const specific = SPECIFIC_PAIR_EXPLANATIONS[`${giverDefId}->${receiverDefId}`];
  const bonusPct = getSynergyChainBonusPct(Math.max(2, chainLength));
  const chainTag =
    chainLength >= 5
      ? `Chuỗi 5 • +${bonusPct}% & Viên mãn`
      : chainLength >= 3
        ? `Chuỗi ${chainLength} • +${bonusPct}% sức`
        : `+${bonusPct}% sức`;

  return {
    title: `${gName} → ${rName} (${chainTag})`,
    explanation: specific ?? `${gName} tiếp sức cho ${rName} — ${elementPairLabel}`,
    elementPairLabel,
  };
}
