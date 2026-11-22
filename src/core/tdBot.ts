import { getTowerTierStats, TOWER_DEFINITIONS } from './tdDefinitions';
import type { TowerDefenseEngine } from './tdEngine';
import type { TowerBranch, TowerId } from './types';

interface BotPlanItem {
  padId: string;
  defId: TowerId;
  preferredBranch: TowerBranch;
}

/**
 * Bot tự động chơi thông minh để kiểm thử cân bằng Màn 1 "Tiệm Giày Hẻm Dốc".
 * Phối hợp đủ 5 món giữ tiệm theo đúng vòng khắc Ngũ Hành (docs/CHU_DE_GIU_TIEM.md).
 */
const STAGE_1_PLAN: BotPlanItem[] = [
  { padId: 'pad_1', defId: 'fire_tower', preferredBranch: 'A' }, // Túi Hút Ẩm (Thổ) đầu đường — khắc Giọt Mưa (Thủy)
  { padId: 'pad_3', defId: 'wood_tower', preferredBranch: 'A' }, // Dép Tông (Mộc) giữa khúc cua 1 — khắc Cục Bùn (Thổ)
  { padId: 'pad_2', defId: 'metal_tower', preferredBranch: 'A' }, // Bốt Đế Đinh (Kim) đoạn trên — xuyên vỏ & khắc Gián (Mộc)
  { padId: 'pad_5', defId: 'water_tower', preferredBranch: 'A' }, // Xịt Dưỡng Da (Thủy) khúc cua giữa — làm chậm & khắc Nắng Gắt (Hỏa)
  { padId: 'pad_4', defId: 'earth_tower', preferredBranch: 'B' }, // Máy Sấy Giày (Hỏa) tâm trận — hỗ trợ quanh tâm
  { padId: 'pad_6', defId: 'fire_tower', preferredBranch: 'A' }, // Túi Hút Ẩm (Thổ) khúc cua dưới
  { padId: 'pad_8', defId: 'metal_tower', preferredBranch: 'B' }, // Bốt Đế Đinh (Kim) chốt chặn cuối
  { padId: 'pad_9', defId: 'wood_tower', preferredBranch: 'B' }, // Dép Tông (Mộc) dọn Cục Bùn cuối đường
];

export function runBotTurn(engine: TowerDefenseEngine): void {
  if (engine.status !== 'playing') return;

  // 1. Ưu tiên đặt đủ 5 loại món giữ tiệm (5 hành) trước
  for (const item of STAGE_1_PLAN.slice(0, 5)) {
    if (!engine.getTowerAtPad(item.padId)) {
      const cost = TOWER_DEFINITIONS[item.defId].tier1.cost;
      if (engine.essence >= cost) {
        engine.buildTower(item.padId, item.defId);
      }
      if (!engine.waveInProgress && engine.canStartNextWave()) {
        engine.startNextWave(engine.currentWaveIndex >= 0);
      }
      return;
    }
  }

  // 2. Nâng cấp các món chủ lực lên bậc 2
  for (const item of STAGE_1_PLAN.slice(0, 5)) {
    const tower = engine.getTowerAtPad(item.padId);
    if (tower && tower.tier === 1) {
      const cost = getTowerTierStats(tower.defId, 2).cost;
      if (engine.essence >= cost) {
        engine.upgradeTower(item.padId);
      }
    }
  }

  // 3. Đặt thêm quân chốt chặn cuối và nâng lên bậc 3
  for (const item of STAGE_1_PLAN) {
    const existing = engine.getTowerAtPad(item.padId);
    if (!existing) {
      const cost = TOWER_DEFINITIONS[item.defId].tier1.cost;
      if (engine.essence >= cost) {
        engine.buildTower(item.padId, item.defId);
      }
    } else if (existing.tier === 2) {
      const cost = getTowerTierStats(existing.defId, 3, item.preferredBranch).cost;
      if (engine.essence >= cost) {
        engine.upgradeTower(item.padId, item.preferredBranch);
      }
    } else if (existing.tier === 1) {
      const cost = getTowerTierStats(existing.defId, 2).cost;
      if (engine.essence >= cost) {
        engine.upgradeTower(item.padId);
      }
    }
  }

  // 4. Tự gọi đợt nếu chưa bắt đầu
  if (!engine.waveInProgress && engine.canStartNextWave()) {
    engine.startNextWave(engine.currentWaveIndex >= 0);
  }
}
