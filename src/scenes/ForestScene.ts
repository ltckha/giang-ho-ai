import { CONTENT } from '../core/contentRegistry';
import { isPointInRect } from '../core/maps';
import { gameState } from '../game/gameState';
import { inputBridge } from '../game/inputBridge';
import { SCENE_KEYS } from '../game/sceneKeys';
import { sound } from '../game/sound';
import { BaseWorldScene } from './BaseWorldScene';

/**
 * Bản đồ 2: Rừng Thạch Mạch.
 * Gồm Ngã Ba Sương Độc (khôi lỗi Bách Thông hay bịa đường), Bãi Mỏ Phía Đông
 * (mạch linh thạch bị tranh) và Lối Cụt Bắc (nhiệm vụ phụ "Bản Đồ Không Có Thật").
 */
export class ForestScene extends BaseWorldScene {
  private hallucinationChecked = false;

  constructor() {
    super(SCENE_KEYS.FOREST, 'map_forest');
  }

  protected renderMapDecorations(): void {
    this.hallucinationChecked = false;
    const g = this.add.graphics().setDepth(1);

    // Đường mòn đất nối Cổng Tây -> Ngã Ba -> Cổng Bắc (Thành Bế Các), Lối Cụt Đông Bắc, Bãi Mỏ & Cửa Hang Đông Nam
    g.fillStyle(0x4f4331, 0.62);
    g.fillRoundedRect(60, 510, 620, 74, 18); // Từ cổng Thành tới Ngã Ba
    g.fillRoundedRect(610, 50, 84, 480, 18); // Lên Cổng Bắc sang Thành Bế Các
    g.fillRoundedRect(650, 180, 230, 68, 16); // Nhánh rẽ sang Lối Cụt Đông Bắc (bịa đường)
    g.fillRoundedRect(680, 510, 480, 78, 18); // Sang Bãi Mỏ
    g.fillRoundedRect(1380, 560, 110, 320, 18); // Xuống Cửa Hầm Mỏ Sâu
    g.fillRoundedRect(1420, 825, 250, 76, 18); // Tới cổng Hang

    // Mạch linh thạch lộ thiên tỏa ánh xanh ở Bãi Mỏ Phía Đông
    const crystalNodes = [
      { x: 1140, y: 495 },
      { x: 1295, y: 635 },
      { x: 1435, y: 490 },
      { x: 1365, y: 660 },
      { x: 1165, y: 645 },
    ];
    for (const node of crystalNodes) {
      g.fillStyle(0x4cc9f0, 0.8);
      g.fillTriangle(node.x, node.y - 18, node.x - 11, node.y + 8, node.x + 11, node.y + 8);
      g.lineStyle(1.5, 0xc2fbff, 0.9);
      g.strokeTriangle(node.x, node.y - 18, node.x - 11, node.y + 8, node.x + 11, node.y + 8);

      const glow = this.add.circle(node.x, node.y, 26, 0x4cc9f0, 0.18).setDepth(2);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.1, to: 0.28 },
        duration: 1100 + (node.x % 400),
        yoyo: true,
        repeat: -1,
      });
    }

    // Sương mù mỏng quanh Ngã Ba Sương Độc
    const mist = this.add.ellipse(675, 545, 210, 130, 0x99d98c, 0.11).setDepth(2);
    this.tweens.add({
      targets: mist,
      alpha: { from: 0.06, to: 0.16 },
      duration: 2100,
      yoyo: true,
      repeat: -1,
    });

    // Biển gỗ chỉ đường lệch ở Ngã Ba
    g.fillStyle(0x6e4a2b, 1);
    g.fillRect(622, 505, 8, 28);
    g.fillRect(606, 507, 40, 10);

    // Đá mục tại Lối Cụt Bắc (không hề có Cổ Thụ Chín Gốc!)
    g.fillStyle(0x52524a, 0.9);
    g.fillRoundedRect(870, 145, 44, 24, 6);
    this.add
      .text(892, 135, 'Bia đá rêu (Trống không)', {
        fontSize: '10px',
        color: '#f2c14e',
        backgroundColor: 'rgba(18,16,12,0.72)',
        padding: { x: 4, y: 1 },
        fontFamily: 'system-ui, -apple-system, sans-serif',
      })
      .setOrigin(0.5)
      .setDepth(4);
  }

  protected override onPostUpdate(_dt: number): void {
    if (this.hallucinationChecked) return;
    const q = gameState.getData().quests.quest_hallucination;
    if (q.status !== 'active') return;

    const fakeZone = this.mapDef.landmarks.find((l) => l.id === 'lm_fake_landmark');
    if (fakeZone && isPointInRect({ x: this.playerX, y: this.playerY }, fakeZone)) {
      this.hallucinationChecked = true;
      const changed = gameState.progressQuest('quest_hallucination', 1);
      if (changed) {
        sound.playUiClick();
        this.refreshNpcMarkers();
        gameState.pushToast('Lối cụt! Bách Thông đã bịa ra "Cổ Thụ Chín Gốc"!', '#ffd166');
        inputBridge.openDialog({
          speaker: 'Cảnh báo — Lối Cụt Bắc',
          subtitle: CONTENT.quests.quest_hallucination.title,
          lines: [
            'Ở đây chẳng hề có "Cổ Thụ Chín Gốc" hay kho báu linh thạch nào cả — chỉ có sơn tặc và khôi lỗi đốn củi loạn mai phục!',
            'Khôi lỗi Bách Thông đã tự tin bịa đường dẫn bạn đi lạc. Hãy quay lại Ngã Ba Sương Độc đối chất với nó!',
          ],
          actionLabel: 'Quay lại chất vấn Bách Thông',
        });
      }
    }
  }
}
