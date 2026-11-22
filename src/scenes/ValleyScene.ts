import Phaser from 'phaser';
import { distBetween } from '../core/aiDecisionTree';
import { CONTENT } from '../core/contentRegistry';
import {
  ALL_SPOT_IDS,
  getEncounterBehavior,
  type GuildId,
  type HuntingSpotId,
} from '../core/guildSystem';
import { gameState } from '../game/gameState';
import { SCENE_KEYS } from '../game/sceneKeys';
import { BaseWorldScene } from './BaseWorldScene';

interface SpotGuildSquadVisual {
  spotId: HuntingSpotId;
  anchorX: number;
  anchorY: number;
  bannerText: Phaser.GameObjects.Text;
  agentSprite: Phaser.GameObjects.Image;
  statusText: Phaser.GameObjects.Text;
  phase: number;
}

/**
 * Bản đồ 5 (Giai đoạn 2): Lũng Đại Mạch — vùng mỏ linh thạch lớn nhất giang hồ đang bị tranh chấp.
 * Gồm 3 bãi mỏ tranh chấp (Bãi Mỏ Tinh Lam, Hẻm Đứt Bùa, Khe Vỡ Khung Đồng) có cờ & đội tuần tra
 * của các Bang Hội AI phản ứng theo quan hệ (đồng minh / tránh nhau / giao tranh),
 * cùng Tế Đàn Lõi Trầm ở góc đông nam — nơi giam giữ Trùm Vạn Chép — Khôi Lỗi Hợp Lõi (Hệ Kim).
 */
export class ValleyScene extends BaseWorldScene {
  private spotSquads: SpotGuildSquadVisual[] = [];
  private skirmishCooldown = 0;

  constructor() {
    super(SCENE_KEYS.VALLEY, 'map_valley');
  }

  protected renderMapDecorations(): void {
    this.spotSquads = [];
    this.skirmishCooldown = 0;
    const g = this.add.graphics().setDepth(1);

    // Đường mòn thung lũng nối Cổng Tây -> 3 bãi mỏ -> Tế Đàn Lõi Trầm
    g.fillStyle(0x41382d, 0.68);
    g.fillRoundedRect(60, 460, 920, 82, 18); // Trục chính Tây - Đông
    g.fillRoundedRect(320, 500, 95, 290, 16); // Xuống Bãi Mỏ Tinh Lam (Tây Nam)
    g.fillRoundedRect(790, 180, 95, 310, 16); // Lên Hẻm Đứt Bùa (Bắc)
    g.fillRoundedRect(950, 320, 420, 82, 16); // Sang Khe Vỡ Khung Đồng (Đông Bắc)
    g.fillRoundedRect(1220, 360, 100, 480, 18); // Xuống Tế Đàn Lõi Trầm (Đông Nam)

    // Cụm tinh thể linh thạch lớn tỏa sáng ở 3 bãi mỏ
    const crystals = [
      { x: 310, y: 740 },
      { x: 420, y: 690 },
      { x: 740, y: 155 },
      { x: 960, y: 150 },
      { x: 1190, y: 295 },
      { x: 1380, y: 310 },
    ];
    for (const c of crystals) {
      g.fillStyle(0x4cc9f0, 0.85);
      g.fillTriangle(c.x, c.y - 20, c.x - 12, c.y + 9, c.x + 12, c.y + 9);
      g.lineStyle(1.5, 0xffffff, 0.85);
      g.strokeTriangle(c.x, c.y - 20, c.x - 12, c.y + 9, c.x + 12, c.y + 9);
    }

    // Vòng trận pháp hợp lõi Kim - Mộc - Hỏa tại Tế Đàn Lõi Trầm (tâm 1540, 815)
    g.lineStyle(3, 0xe8c468, 0.6);
    g.strokeCircle(1540, 815, 175);
    g.lineStyle(2, 0x59c173, 0.42);
    g.strokeCircle(1540, 815, 128);
    g.lineStyle(2, 0xef6351, 0.42);
    g.strokeCircle(1540, 815, 82);

    // Dựng cờ & đại diện Bang Hội AI đang chiếm đóng tại 3 bãi mỏ
    const spotAnchors: Record<HuntingSpotId, { x: number; y: number }> = {
      spot_west: { x: 370, y: 665 },
      spot_north: { x: 840, y: 145 },
      spot_east: { x: 1270, y: 290 },
    };

    for (const sid of ALL_SPOT_IDS) {
      const anchor = spotAnchors[sid];
      const bannerText = this.add
        .text(anchor.x, anchor.y - 40, '', {
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#ffd166',
          backgroundColor: 'rgba(16, 14, 12, 0.84)',
          padding: { x: 6, y: 2 },
          fontFamily: 'system-ui, -apple-system, sans-serif',
        })
        .setOrigin(0.5)
        .setDepth(14);

      const agentSprite = this.add
        .image(anchor.x, anchor.y, 'guild_agent_guild_guardian')
        .setDepth(11);

      const statusText = this.add
        .text(anchor.x, anchor.y + 26, '', {
          fontSize: '10px',
          color: '#e2e8f0',
          backgroundColor: 'rgba(14, 12, 10, 0.76)',
          padding: { x: 4, y: 1 },
          fontFamily: 'system-ui, -apple-system, sans-serif',
        })
        .setOrigin(0.5)
        .setDepth(14);

      this.spotSquads.push({
        spotId: sid,
        anchorX: anchor.x,
        anchorY: anchor.y,
        bannerText,
        agentSprite,
        statusText,
        phase: sid === 'spot_west' ? 0 : sid === 'spot_north' ? 2.1 : 4.2,
      });
    }

    this.refreshSpotSquadVisuals();
  }

  private refreshSpotSquadVisuals(): void {
    const gw = gameState.getData().guildWorld;
    for (const sq of this.spotSquads) {
      const spot = gw.spots[sq.spotId];
      const spotMeta = CONTENT.huntingSpots[sq.spotId];
      const ownerId: GuildId | null = spot.ownerGuildId;

      if (!ownerId) {
        sq.bannerText.setText(`⚑ ${spotMeta.name}: Bãi Vô Chủ`).setColor('#cbd5e0');
        sq.agentSprite.setVisible(false);
        sq.statusText.setText('Các bang đang dò xét').setColor('#a0aec0');
        continue;
      }

      const gMeta = CONTENT.guilds[ownerId];
      const gState = gw.guilds[ownerId];
      const behavior = getEncounterBehavior(gw.playerGuildId, ownerId, gw, true);
      const relLabel =
        behavior === 'friendly'
          ? 'Đồng minh hỗ trợ'
          : behavior === 'attack'
            ? 'Thù địch canh bãi!'
            : 'Trung lập giữ khoảng cách';
      const relColor =
        behavior === 'friendly' ? '#7bf1a8' : behavior === 'attack' ? '#ff6b6b' : '#ffe8a3';

      sq.bannerText
        .setText(`⚑ ${gMeta.name} chiếm giữ (Cấp ${gState.level})`)
        .setColor(gMeta.bannerColor);
      sq.agentSprite.setTexture(`guild_agent_${ownerId}`).setVisible(true);
      sq.statusText.setText(`${relLabel} • ${CONTENT.guildActions[gState.lastAction]}`).setColor(relColor);
    }
  }

  protected override onPostUpdate(dt: number): void {
    this.skirmishCooldown = Math.max(0, this.skirmishCooldown - dt);
    this.refreshSpotSquadVisuals();

    const gw = gameState.getData().guildWorld;
    for (const sq of this.spotSquads) {
      const ownerId = gw.spots[sq.spotId].ownerGuildId;
      if (!ownerId) continue;

      sq.phase += dt * 1.8;
      const dPlayer = distBetween(
        { x: this.playerX, y: this.playerY },
        { x: sq.anchorX, y: sq.anchorY },
      );
      const behavior = getEncounterBehavior(gw.playerGuildId, ownerId, gw, dPlayer <= 165);

      let offsetX = Math.cos(sq.phase) * 18;
      let offsetY = Math.sin(sq.phase) * 10;

      if (dPlayer <= 150) {
        if (behavior === 'avoid') {
          // Bang trung lập chủ động lùi nhẹ tránh đụng độ với người chơi
          const dx = sq.anchorX - this.playerX;
          const dy = sq.anchorY - this.playerY;
          const len = Math.max(1, Math.hypot(dx, dy));
          offsetX += (dx / len) * 26;
          offsetY += (dy / len) * 26;
        } else if (behavior === 'attack' && this.skirmishCooldown <= 0) {
          // Bang thù địch hoặc bang hiếu chiến giữ bãi cảnh cáo / giao tranh
          this.skirmishCooldown = 4.0;
          const nearestEnemy = this.enemies.find(
            (e) =>
              e.alive &&
              distBetween({ x: e.x, y: e.y }, { x: sq.anchorX, y: sq.anchorY }) <= 220,
          );
          if (nearestEnemy) {
            this.spawnRingVfx(sq.anchorX, sq.anchorY, 52, 0xef6351);
          }
          this.spawnFloatingText(
            sq.anchorX,
            sq.anchorY - 52,
            `${CONTENT.guilds[ownerId].name}: Cấm xâm phạm bãi mỏ!`,
            '#ff8787',
          );
        } else if (behavior === 'friendly' && this.skirmishCooldown <= 0) {
          // Cùng bang: hỗ trợ hồi nhẹ máu khi đi ngang qua bãi của bang mình
          this.skirmishCooldown = 5.0;
          const save = gameState.getData();
          const maxHp = gameState.getEffectiveStats().maxHp;
          if (save.hp < maxHp) {
            save.hp = Math.min(maxHp, save.hp + 14);
            this.spawnFloatingText(this.playerX, this.playerY - 28, '+14 HP (Bang hội trợ chiến)', '#7bf1a8');
          }
        }
      }

      sq.agentSprite.setPosition(sq.anchorX + offsetX, sq.anchorY + offsetY);
    }
  }
}
