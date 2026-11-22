import Phaser from 'phaser';
import { gameState } from '../game/gameState';
import { SCENE_KEYS } from '../game/sceneKeys';
import { BaseWorldScene } from './BaseWorldScene';

/**
 * Bản đồ 1: Thành Lam Lư (khu an toàn).
 * Gồm Lò Đúc Chấn Cơ (lửa xanh lam linh thạch), Chợ Khôi Lỗi Bến Đá,
 * Xưởng Rèn Tắt Lửa của Lão Bính và Quảng Trường Niêm Yết 3 môn phái.
 */
export class TownScene extends BaseWorldScene {
  private forgeGlow?: Phaser.GameObjects.Arc;
  private forgeStatusLabel?: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.TOWN, 'map_town');
  }

  protected renderMapDecorations(): void {
    const g = this.add.graphics().setDepth(1);

    // Đường lát đá sáng nối quảng trường với 4 khu vực và Cổng Đông
    g.fillStyle(0x4a4035, 0.75);
    g.fillRoundedRect(250, 440, 1080, 96, 16); // Trục Đông - Tây
    g.fillRoundedRect(600, 220, 110, 520, 16); // Trục Bắc - Nam
    g.fillRoundedRect(250, 260, 110, 420, 14); // Nhánh Lò Đúc -> Xưởng Rèn
    g.fillRoundedRect(930, 260, 110, 220, 14); // Nhánh Chợ Khôi Lỗi

    // Ánh lam thâu đêm từ Lò Đúc Chấn Cơ (tây bắc)
    const furnaceGlow = this.add.circle(280, 185, 76, 0x4cc9f0, 0.25).setDepth(3);
    this.tweens.add({
      targets: furnaceGlow,
      scale: { from: 0.92, to: 1.12 },
      alpha: { from: 0.18, to: 0.36 },
      duration: 1300,
      yoyo: true,
      repeat: -1,
    });

    const furnaceCore = this.add
      .circle(280, 185, 22, 0x7ce8ff, 0.85)
      .setStrokeStyle(3, 0xffffff, 0.8)
      .setDepth(4);
    this.tweens.add({
      targets: furnaceCore,
      scale: { from: 0.9, to: 1.15 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    // Sạp Chợ Khôi Lỗi Bến Đá (đông bắc) — mái bạt đỏ-vàng & các kiện đồng
    g.fillStyle(0x9c3d3d, 0.85);
    g.fillRect(875, 222, 74, 20);
    g.fillStyle(0xc7a45a, 0.85);
    g.fillRect(956, 222, 74, 20);
    g.fillStyle(0x3a6b7c, 0.85);
    g.fillRect(1037, 222, 70, 20);

    // 3 lá cờ niêm yết của 3 môn phái (Mở / Đóng / Cấm) ở Quảng Trường
    const bannerColors = [0x59c173, 0xe8c468, 0xef6351];
    const bannerLabels = ['MỞ', 'ĐÓNG', 'CẤM'];
    bannerColors.forEach((col, i) => {
      const bx = 570 + i * 78;
      const by = 404;
      g.fillStyle(col, 0.85);
      g.fillRoundedRect(bx - 16, by - 10, 32, 20, 4);
      this.add
        .text(bx, by, bannerLabels[i], {
          fontSize: '9px',
          fontStyle: 'bold',
          color: '#141210',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        })
        .setOrigin(0.5)
        .setDepth(4);
    });

    // Xưởng Rèn Tắt Lửa (tây nam): đe sắt & lò than (đỏ lửa trở lại sau khi hoàn thành nhiệm vụ Lão Bính)
    g.fillStyle(0x2d2a28, 1);
    g.fillRoundedRect(175, 745, 52, 34, 6);
    g.lineStyle(2, 0x736b63, 1);
    g.strokeRoundedRect(175, 745, 52, 34, 6);

    const questDone = gameState.getData().quests.quest_blacksmith.status === 'completed';
    this.forgeGlow = this.add
      .circle(201, 762, 34, 0xff7b54, questDone ? 0.52 : 0.08)
      .setDepth(3);
    this.forgeStatusLabel = this.add
      .text(201, 792, questDone ? 'Lò than đỏ lửa' : 'Lò than tắt nguội', {
        fontSize: '10px',
        color: questDone ? '#ffd166' : '#a89f91',
        backgroundColor: 'rgba(18, 14, 10, 0.72)',
        padding: { x: 4, y: 1 },
        fontFamily: 'system-ui, -apple-system, sans-serif',
      })
      .setOrigin(0.5)
      .setDepth(4);

    if (questDone) {
      this.animateLitForge();
    }
  }

  private animateLitForge(): void {
    if (!this.forgeGlow) return;
    this.forgeGlow.setFillStyle(0xff7b54, 0.55);
    this.tweens.add({
      targets: this.forgeGlow,
      scale: { from: 0.9, to: 1.2 },
      alpha: { from: 0.35, to: 0.65 },
      duration: 650,
      yoyo: true,
      repeat: -1,
    });
  }

  protected override onQuestCompleted(questId: string): void {
    if (questId === 'quest_blacksmith') {
      this.forgeStatusLabel?.setText('Lò than đỏ lửa!').setColor('#ffd166');
      this.animateLitForge();
    }
  }
}
