import Phaser from 'phaser';
import { CONTENT } from '../core/contentRegistry';
import { gameState } from '../game/gameState';
import { SCENE_KEYS } from '../game/sceneKeys';
import { BaseWorldScene } from './BaseWorldScene';

/**
 * Bản đồ 4 (Giai đoạn 2): Thành Bế Các — đại bản doanh giữ kín bí kíp của Tỏa Kim Các.
 * Gồm Mật Khố Tỏa Chốt, Đài Bảng Tin Giang Hồ (niêm yết bang giữ thành & thứ hạng),
 * Lò Luyện Hợp Kim (Tiểu Bính ghép đồ 2-3 món), Phố Ký Gửi Ấn Tín (Bà Hai Quán Trà)
 * và Sân Công Thành Bắc Môn (nơi 4 bang hội AI tranh thành mỗi tuần).
 */
export class InnerCityScene extends BaseWorldScene {
  private castleOwnerBannerText?: Phaser.GameObjects.Text;
  private lastOwnerId = '';

  constructor() {
    super(SCENE_KEYS.INNER_CITY, 'map_inner_city');
  }

  protected renderMapDecorations(): void {
    const g = this.add.graphics().setDepth(1);

    // Trục đại lộ lát đá xám viền đồng nối Cổng Nam -> Đài Bảng Tin -> Sân Công Thành Bắc & Cổng Đông
    g.fillStyle(0x3a4250, 0.78);
    g.fillRoundedRect(640, 120, 120, 790, 14); // Trục Bắc - Nam
    g.fillRoundedRect(240, 440, 1170, 100, 14); // Trục Đông - Tây
    g.fillRoundedRect(240, 220, 96, 460, 12); // Nhánh Mật Khố -> Lò Luyện Hợp Kim
    g.fillRoundedRect(1020, 440, 96, 260, 12); // Nhánh Phố Ký Gửi Ấn Tín

    // Vòng khóa đồng niêm phong trước Mật Khố Tỏa Chốt (tây bắc)
    g.lineStyle(3, 0xe8c468, 0.65);
    g.strokeCircle(280, 225, 58);
    g.lineStyle(1.5, 0x4cc9f0, 0.45);
    g.strokeCircle(280, 225, 40);

    // Lửa hợp kim đỏ vàng tại Lò Luyện Hợp Kim của Tiểu Bính (tây nam)
    const forgeGlow = this.add.circle(265, 745, 42, 0xff9f1c, 0.35).setDepth(3);
    this.tweens.add({
      targets: forgeGlow,
      scale: { from: 0.9, to: 1.15 },
      alpha: { from: 0.25, to: 0.5 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Cờ đại kỳ tại Sân Công Thành Bắc Môn & Đài Bảng Tin Giang Hồ báo bang đang giữ Thành Bế Các
    const gw = gameState.getData().guildWorld;
    const ownerMeta = CONTENT.guilds[gw.castleOwnerId];
    this.lastOwnerId = gw.castleOwnerId;

    g.fillStyle(0x1e242d, 0.9);
    g.fillRoundedRect(575, 115, 250, 42, 8);
    g.lineStyle(2, 0xe8c468, 0.85);
    g.strokeRoundedRect(575, 115, 250, 42, 8);

    this.castleOwnerBannerText = this.add
      .text(700, 136, `Đại Kỳ Thành Bế Các: ${ownerMeta.name}`, {
        fontSize: '12px',
        fontStyle: 'bold',
        color: ownerMeta.bannerColor,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      })
      .setOrigin(0.5)
      .setDepth(5);
  }

  protected override onPostUpdate(_dt: number): void {
    const ownerId = gameState.getData().guildWorld.castleOwnerId;
    if (ownerId !== this.lastOwnerId && this.castleOwnerBannerText) {
      this.lastOwnerId = ownerId;
      const meta = CONTENT.guilds[ownerId];
      this.castleOwnerBannerText
        .setText(`Đại Kỳ Thành Bế Các: ${meta.name}`)
        .setColor(meta.bannerColor);
    }
  }
}
