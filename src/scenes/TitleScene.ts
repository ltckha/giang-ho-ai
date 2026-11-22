import Phaser from 'phaser';
import { ELEMENT_INFO } from '../core/elements';
import { loadTdSave } from '../core/saveSystem';
import { STAGE_1_DEFINITION, TOWER_LIST } from '../core/tdDefinitions';
import { SCENE_KEYS } from '../game/sceneKeys';
import { sound } from '../game/sound';

export class TitleScene extends Phaser.Scene {
  private overlayEl: HTMLDivElement | null = null;
  private motes: Array<{ dot: Phaser.GameObjects.Arc; speedY: number; phase: number }> = [];

  constructor() {
    super({ key: SCENE_KEYS.TITLE });
  }

  public create(): void {
    this.motes = [];
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#12100e');

    const g = this.add.graphics();
    g.lineStyle(2, 0xc7a45a, 0.14);
    g.strokeCircle(width * 0.5, height * 0.45, Math.min(width, height) * 0.36);
    g.lineStyle(1.5, 0x4cc9f0, 0.14);
    g.strokeCircle(width * 0.5, height * 0.45, Math.min(width, height) * 0.26);

    for (let i = 0; i < 22; i += 1) {
      const x = Phaser.Math.Between(16, Math.max(40, width - 16));
      const y = Phaser.Math.Between(16, Math.max(40, height - 16));
      const isCyan = i % 2 === 0;
      const dot = this.add.circle(
        x,
        y,
        Phaser.Math.FloatBetween(2, 4),
        isCyan ? 0x4cc9f0 : 0xe8c468,
        Phaser.Math.FloatBetween(0.2, 0.55),
      );
      this.motes.push({
        dot,
        speedY: Phaser.Math.FloatBetween(8, 20),
        phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
      });
    }

    this.mountTitleOverlay();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unmountOverlay();
    });
  }

  public update(time: number, deltaMs: number): void {
    const dt = deltaMs / 1000;
    const { width, height } = this.scale;
    for (const m of this.motes) {
      m.dot.y -= m.speedY * dt;
      m.dot.x += Math.sin(time * 0.001 + m.phase) * 7 * dt;
      if (m.dot.y < -10) {
        m.dot.y = height + 10;
        m.dot.x = Phaser.Math.Between(16, Math.max(32, width - 16));
      }
    }
  }

  private mountTitleOverlay(): void {
    this.unmountOverlay();
    const container = document.getElementById('game-container');
    if (!container) return;

    const save = loadTdSave();
    const s1Stars = save.starsByStage.stage_1 ?? 0;
    const starText = s1Stars > 0 ? '★'.repeat(s1Stars) + '☆'.repeat(3 - s1Stars) : 'Chưa qua';

    const root = document.createElement('div');
    root.className = 'td-title-overlay';
    root.id = 'td-title-overlay';

    const towerBadges = TOWER_LIST.map((t) => {
      const el = ELEMENT_INFO[t.element];
      return `<span class="td-pill" style="border-color:${el.colorHex};color:${el.colorHex}">Hệ ${el.label}: ${t.roleLabel}</span>`;
    }).join('');

    root.innerHTML = `
      <div class="td-title-card">
        <div class="td-title-kicker">THỦ THÀNH KHÔI LỖI • NGŨ HÀNH TƯƠNG KHẮC</div>
        <h1 class="td-title-heading">Giang Hồ AI</h1>
        <p class="td-title-desc">
          Khôi lỗi ở mỏ linh thạch bị gỡ bùa phong ấn nổi loạn kéo về Thành Lam Lư. Đặt khôi lỗi phe mình dọc đường để chặn quái và thu linh thạch nâng cấp!
        </p>

        <div class="td-stage-box">
          <div class="td-stage-header">
            <div>
              <div class="td-stage-name">${STAGE_1_DEFINITION.name}</div>
              <div class="td-stage-sub">${STAGE_1_DEFINITION.subtitle}</div>
            </div>
            <div class="td-stage-stars" data-testid="stage1-stars">${starText}</div>
          </div>
          <div class="td-stage-meta">
            <span>9 Đợt quái</span> • <span>20 Mạng thành</span> • <span>Khắc hệ 1.75x / Bị khắc 0.50x</span>
          </div>
          <button id="btn-start-stage-1" data-testid="btn-start-stage-1" class="td-btn-primary">
            Vào Màn 1 Ngay
          </button>
        </div>

        <div class="td-element-guide">
          <div class="td-guide-title">Vòng khắc Ngũ Hành: Kim → Mộc → Thổ → Thủy → Hỏa → Kim</div>
          <div class="td-pill-wrap">${towerBadges}</div>
        </div>
      </div>
    `;

    container.appendChild(root);
    this.overlayEl = root;

    const startBtn = root.querySelector<HTMLButtonElement>('#btn-start-stage-1');
    if (startBtn) {
      startBtn.onclick = () => {
        sound.playUiClick();
        this.unmountOverlay();
        this.scene.start(SCENE_KEYS.TD_STAGE);
      };
    }
  }

  private unmountOverlay(): void {
    if (this.overlayEl) {
      this.overlayEl.remove();
      this.overlayEl = null;
    }
  }
}
