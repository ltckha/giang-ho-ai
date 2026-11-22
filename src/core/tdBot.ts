import { getTowerTierStats, TOWER_DEFINITIONS } from './tdDefinitions';
import type { TowerDefenseEngine } from './tdEngine';
import type { TowerBranch, TowerId } from './types';

interface BotPlanItem {
  padId: string;
  defId: TowerId;
  preferredBranch: TowerBranch;
}

/**
 * Bot tự động chơi thông minh để kiểm thử cân bằng màn chơi (và chạy trong test / e2e).
 * Phối hợp đủ 5 hệ quân ở các khúc cua để khắc chế 4 loại quái Màn 1.
 */
const STAGE_1_PLAN: BotPlanItem[] = [
  { padId: 'pad_1', defId: 'fire_tower', preferredBranch: 'A' }, // Khắc Kim (quái nhanh đợt 1, 2, 5, 7)
  { padId: 'pad_3', defId: 'wood_tower', preferredBranch: 'A' }, // Khắc Thổ (quái giáp đá đợt 2, 5, 7, 8)
  { padId: 'pad_4', defId: 'earth_tower', preferredBranch: 'B' }, // Hỗ trợ tăng công & tốc bắn khúc giữa
  { padId: 'pad_2', defId: 'metal_tower', preferredBranch: 'A' }, // Khắc Mộc (quái cánh gỗ bay đợt 3, 6, 8)
  { padId: 'pad_5', defId: 'water_tower', preferredBranch: 'A' }, // Làm chậm & khắc Hỏa (quái chia đôi đợt 4, 6, 8)
  { padId: 'pad_6', defId: 'fire_tower', preferredBranch: 'B' }, // Đánh lan khúc cua dưới
  { padId: 'pad_8', defId: 'metal_tower', preferredBranch: 'B' }, // Chốt chặn cuối phá giáp
  { padId: 'pad_9', defId: 'wood_tower', preferredBranch: 'B' }, // Bắn tỉa khóa sổ cuối đường
];

export function runBotTurn(engine: TowerDefenseEngine): void {
  if (engine.status !== 'playing') return;

  // 1. Ưu tiên đặt đủ 5 loại quân chủ lực trước
  for (const item of STAGE_1_PLAN.slice(0, 6)) {
    if (!engine.getTowerAtPad(item.padId)) {
      const cost = TOWER_DEFINITIONS[item.defId].tier1.cost;
      if (engine.essence >= cost) {
        engine.buildTower(item.padId, item.defId);
      }
      break;
    }
  }

  // 2. Nâng cấp các quân ở khúc giữa lên bậc 2
  for (const item of STAGE_1_PLAN.slice(0, 6)) {
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
