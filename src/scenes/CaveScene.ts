import { SCENE_KEYS } from '../game/sceneKeys';
import { BaseWorldScene } from './BaseWorldScene';

/**
 * Bản đồ 3: Động Tàn Cơ — đáy mỏ sâu nơi các lò đúc vứt bỏ khôi lỗi đời cũ.
 * Trùm hang: Sơ Giác — Khôi Lỗi Số Không (hệ Thủy).
 */
export class CaveScene extends BaseWorldScene {
  constructor() {
    super(SCENE_KEYS.CAVE, 'map_cave');
  }

  protected renderMapDecorations(): void {
    const g = this.add.graphics().setDepth(1);

    // Lối đi đá tối dẫn vào đấu trường Trùm
    g.fillStyle(0x232d3b, 0.72);
    g.fillRoundedRect(70, 425, 880, 115, 16);

    // Xác khôi lỗi đời cũ bị vứt bỏ rải rác dọc hành lang Động Tàn Cơ
    const scrapSpots = [
      { x: 210, y: 185 },
      { x: 270, y: 760 },
      { x: 560, y: 190 },
      { x: 610, y: 785 },
      { x: 750, y: 240 },
      { x: 1020, y: 225 },
      { x: 1320, y: 730 },
    ];
    for (const s of scrapSpots) {
      // Mảnh gỗ đồng vỡ & bánh răng cũ
      g.fillStyle(0x4f3f31, 0.8);
      g.fillRoundedRect(s.x - 16, s.y - 10, 32, 20, 4);
      g.lineStyle(1.5, 0x8b6d43, 0.7);
      g.strokeRoundedRect(s.x - 16, s.y - 10, 32, 20, 4);
      g.lineStyle(1.5, 0x4cc9f0, 0.45);
      g.strokeCircle(s.x + 18, s.y + 6, 7);
    }

    // Vòng ấn cổ quanh đấu trường Sơ Giác (tâm 1180, 480)
    g.lineStyle(3, 0x4ea8de, 0.55);
    g.strokeCircle(1180, 480, 170);
    g.lineStyle(1.5, 0x8be9fd, 0.35);
    g.strokeCircle(1180, 480, 128);
    g.strokeCircle(1180, 480, 78);

    // 4 trụ linh thạch góc đấu trường
    const pillars = [
      { x: 1015, y: 315 },
      { x: 1345, y: 315 },
      { x: 1015, y: 645 },
      { x: 1345, y: 645 },
    ];
    for (const p of pillars) {
      g.fillStyle(0x4cc9f0, 0.7);
      g.fillCircle(p.x, p.y, 10);
      const glow = this.add.circle(p.x, p.y, 34, 0x4cc9f0, 0.16).setDepth(2);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.08, to: 0.25 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
      });
    }
  }
}
