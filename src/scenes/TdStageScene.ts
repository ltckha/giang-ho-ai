import Phaser from 'phaser';
import { ELEMENT_INFO } from '../core/elements';
import { saveTdProgress } from '../core/saveSystem';
import { runBotTurn } from '../core/tdBot';
import {
  calculateSellRefund,
  ENEMY_DEFINITIONS,
  getTowerTierStats,
  STAGE_1_DEFINITION,
  TOWER_DEFINITIONS,
  TOWER_LIST,
} from '../core/tdDefinitions';
import { calculateStarRating, TowerDefenseEngine } from '../core/tdEngine';
import type { ActiveEnemy, ActiveTower, CombatEvent, TowerBranch, TowerId } from '../core/types';
import { SCENE_KEYS } from '../game/sceneKeys';
import { sound } from '../game/sound';

const LOGICAL_WIDTH = 360;
const LOGICAL_HEIGHT = 480;

interface ProjectileVisual {
  x: number;
  y: number;
  tx: number;
  ty: number;
  color: number;
  progress: number;
}

interface ShardParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
  life: number;
  maxLife: number;
  size: number;
}

interface FlyingStone {
  x: number;
  y: number;
  tx: number;
  ty: number;
  progress: number;
}

interface FloatingLabel {
  el: Phaser.GameObjects.Text;
  vy: number;
  life: number;
}

export class TdStageScene extends Phaser.Scene {
  public engine!: TowerDefenseEngine;
  public speedMultiplier: 1 | 2 = 1;
  public paused = false;
  public autoBotEnabled = false;
  public selectedPadId: string | null = null;

  private mapGraphics!: Phaser.GameObjects.Graphics;
  private entityGraphics!: Phaser.GameObjects.Graphics;
  private fxGraphics!: Phaser.GameObjects.Graphics;

  private hudRoot: HTMLDivElement | null = null;
  private modalRoot: HTMLDivElement | null = null;
  private resultShown = false;

  private projectiles: ProjectileVisual[] = [];
  private particles: ShardParticle[] = [];
  private flyingStones: FlyingStone[] = [];
  private floatingLabels: FloatingLabel[] = [];

  private mapOffsetX = 0;
  private mapOffsetY = 58;
  private mapScale = 1;

  constructor() {
    super({ key: SCENE_KEYS.TD_STAGE });
  }

  public create(): void {
    this.engine = new TowerDefenseEngine(STAGE_1_DEFINITION);
    this.speedMultiplier = 1;
    this.paused = false;
    this.autoBotEnabled = false;
    this.selectedPadId = null;
    this.resultShown = false;
    this.projectiles = [];
    this.particles = [];
    this.flyingStones = [];
    this.floatingLabels = [];

    this.cameras.main.setBackgroundColor('#172319');

    this.mapGraphics = this.add.graphics();
    this.entityGraphics = this.add.graphics();
    this.fxGraphics = this.add.graphics();

    this.computeViewportTransform();
    this.drawStaticMap();
    this.mountHud();

    this.scale.on('resize', () => {
      this.computeViewportTransform();
      this.drawStaticMap();
      this.refreshHud();
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleCanvasTap(pointer.x, pointer.y);
    });

    // Cho phép truy cập từ trình duyệt / e2e test để kiểm tra trạng thái
    if (typeof window !== 'undefined') {
      (
        window as unknown as {
          __TD_SCENE__?: TdStageScene;
        }
      ).__TD_SCENE__ = this;
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unmountDom();
    });
  }

  private computeViewportTransform(): void {
    const { width, height } = this.scale;
    const topHudH = 54;
    const bottomHudH = 66;
    const availW = Math.max(260, width - 8);
    const availH = Math.max(300, height - topHudH - bottomHudH);

    this.mapScale = Math.min(availW / LOGICAL_WIDTH, availH / LOGICAL_HEIGHT);
    this.mapOffsetX = Math.round((width - LOGICAL_WIDTH * this.mapScale) * 0.5);
    this.mapOffsetY = Math.round(topHudH + (availH - LOGICAL_HEIGHT * this.mapScale) * 0.5);
  }

  public toScreen(lx: number, ly: number): { x: number; y: number } {
    return {
      x: this.mapOffsetX + lx * this.mapScale,
      y: this.mapOffsetY + ly * this.mapScale,
    };
  }

  public toLogical(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.mapOffsetX) / this.mapScale,
      y: (sy - this.mapOffsetY) / this.mapScale,
    };
  }

  private handleCanvasTap(screenX: number, screenY: number): void {
    if (this.engine.status !== 'playing') return;
    const pt = this.toLogical(screenX, screenY);

    // Tìm ô đặt quân gần nhất trong bán kính chạm 28 đơn vị logic
    let clickedPadId: string | null = null;
    let minDist = 28;
    for (const pad of this.engine.stage.pads) {
      const d = Math.hypot(pad.x - pt.x, pad.y - pt.y);
      if (d <= minDist) {
        minDist = d;
        clickedPadId = pad.id;
      }
    }

    if (clickedPadId) {
      sound.playUiClick();
      this.selectedPadId = clickedPadId;
      this.renderPadModal(clickedPadId);
    } else if (this.selectedPadId) {
      this.selectedPadId = null;
      this.closePadModal();
    }
  }

  public selectPadById(padId: string): void {
    this.selectedPadId = padId;
    this.renderPadModal(padId);
  }

  public tickSimulation(simDt: number): void {
    if (this.engine.status !== 'playing') return;
    if (this.autoBotEnabled) {
      runBotTurn(this.engine);
    }
    const subSteps = Math.max(1, Math.ceil(simDt / 0.05));
    const stepDt = simDt / subSteps;
    for (let i = 0; i < subSteps; i += 1) {
      const events = this.engine.step(stepDt);
      this.processCombatEvents(events);
    }
  }

  public update(_time: number, deltaMs: number): void {
    const rawDt = Math.min(0.1, deltaMs / 1000);

    if (!this.paused && this.engine.status === 'playing') {
      const simDt = rawDt * this.speedMultiplier;
      this.tickSimulation(simDt);
    }

    this.updateVisualEffects(rawDt);
    this.drawDynamicEntities();
    this.refreshHud();

    if (this.engine.status !== 'playing' && !this.resultShown) {
      this.resultShown = true;
      this.showStageResultModal();
    }
  }

  private processCombatEvents(events: CombatEvent[]): void {
    for (const ev of events) {
      const sPos = this.toScreen(ev.x, ev.y);
      if (ev.type === 'shot' && ev.targetX !== undefined && ev.targetY !== undefined) {
        const tPos = this.toScreen(ev.targetX, ev.targetY);
        const color = ev.element ? ELEMENT_INFO[ev.element].colorInt : 0xffffff;
        this.projectiles.push({
          x: sPos.x,
          y: sPos.y,
          tx: tPos.x,
          ty: tPos.y,
          color,
          progress: 0,
        });
        sound.playShoot();
      } else if (ev.type === 'hit') {
        sound.playHit(Boolean(ev.isCounter));
        const dmgText = ev.isCounter
          ? `Khắc! -${ev.damage}`
          : ev.isCountered
            ? `-${ev.damage}`
            : `-${ev.damage}`;
        const color = ev.isCounter ? '#ffd166' : ev.isCountered ? '#9ea8b0' : '#ffffff';
        this.spawnFloatingLabel(
          sPos.x + Phaser.Math.Between(-8, 8),
          sPos.y - 12,
          dmgText,
          color,
          ev.isCounter ? 13 : 11,
        );
      } else if (ev.type === 'kill') {
        sound.playEnemyDeath();
        const color = ev.element ? ELEMENT_INFO[ev.element].colorInt : 0x4cc9f0;
        // Nổ mảnh khi chết
        for (let i = 0; i < 8; i += 1) {
          const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.4;
          const speed = 35 + Math.random() * 55;
          this.particles.push({
            x: sPos.x,
            y: sPos.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color,
            life: 0.42,
            maxLife: 0.42,
            size: 3.5,
          });
        }
        // Linh thạch bay về góc trên trái (chỗ hiển thị Linh thạch)
        this.flyingStones.push({
          x: sPos.x,
          y: sPos.y,
          tx: 56,
          ty: 24,
          progress: 0,
        });
        if (ev.reward) {
          this.spawnFloatingLabel(sPos.x, sPos.y - 18, `+${ev.reward}💎`, '#4cc9f0', 11);
        }
      } else if (ev.type === 'split') {
        this.spawnFloatingLabel(sPos.x, sPos.y - 14, 'Tách Đôi!', '#ff7b54', 12);
      } else if (ev.type === 'disrupt') {
        this.spawnFloatingLabel(sPos.x, sPos.y - 16, ev.text ?? 'Phá Bùa!', '#7ad6ff', 12);
      } else if (ev.type === 'cleanse') {
        this.spawnFloatingLabel(sPos.x, sPos.y - 16, ev.text ?? 'Hộ Ấn!', '#e8c468', 12);
      } else if (ev.type === 'leak') {
        sound.playLoseLife();
        this.cameras.main.shake(180, 0.008);
        this.spawnFloatingLabel(sPos.x, sPos.y - 18, `-${ev.damage} Mạng!`, '#ff4d4f', 14);
      } else if (ev.type === 'wave_start') {
        sound.playWaveStart();
        if (ev.reward && ev.reward > 0) {
          this.spawnFloatingLabel(sPos.x, sPos.y + 12, `Gọi sớm +${ev.reward}💎`, '#4cc9f0', 13);
        }
      } else if (ev.type === 'wave_clear') {
        this.spawnFloatingLabel(
          this.scale.width * 0.5,
          this.scale.height * 0.45,
          ev.text ?? 'Qua đợt!',
          '#8aff9e',
          14,
        );
      } else if (ev.type === 'stage_win') {
        sound.playVictory();
        const stars = calculateStarRating(this.engine.lives, this.engine.maxLives);
        if (stars !== 0) {
          saveTdProgress(this.engine.stage.id, stars, this.engine.lives);
        }
      }
    }
  }

  private spawnFloatingLabel(
    x: number,
    y: number,
    text: string,
    color: string,
    fontSizePx = 12,
  ): void {
    const label = this.add
      .text(x, y, text, {
        fontSize: `${fontSizePx}px`,
        fontStyle: 'bold',
        color,
        stroke: '#101214',
        strokeThickness: 3,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      })
      .setOrigin(0.5)
      .setDepth(30);

    this.floatingLabels.push({
      el: label,
      vy: -28,
      life: 0.75,
    });
  }

  private updateVisualEffects(dt: number): void {
    // Đạn bay
    this.projectiles = this.projectiles.filter((p) => {
      p.progress += dt * 7.5;
      return p.progress < 1;
    });

    // Mảnh vỡ khi quái nổ
    this.particles = this.particles.filter((pt) => {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      return pt.life > 0;
    });

    // Linh thạch bay về góc HUD
    this.flyingStones = this.flyingStones.filter((st) => {
      st.progress += dt * 2.4;
      return st.progress < 1;
    });

    // Chữ sát thương nảy lên
    this.floatingLabels = this.floatingLabels.filter((fl) => {
      fl.el.y += fl.vy * dt;
      fl.life -= dt;
      fl.el.setAlpha(Math.max(0, Math.min(1, fl.life * 2)));
      if (fl.life <= 0) {
        fl.el.destroy();
        return false;
      }
      return true;
    });
  }

  private drawStaticMap(): void {
    const g = this.mapGraphics;
    g.clear();

    // Khung nền rừng đá Rừng Thạch Mạch
    const tl = this.toScreen(0, 0);
    const w = LOGICAL_WIDTH * this.mapScale;
    const h = LOGICAL_HEIGHT * this.mapScale;

    g.fillStyle(0x1e3022, 1);
    g.fillRoundedRect(tl.x, tl.y, w, h, 10);
    g.lineStyle(2, 0x3b533e, 0.9);
    g.strokeRoundedRect(tl.x, tl.y, w, h, 10);

    // Trang trí mạch đá linh thạch và bụi cây ven rừng
    const decorTrees = [
      { x: 24, y: 200 },
      { x: 334, y: 65 },
      { x: 22, y: 425 },
      { x: 338, y: 195 },
      { x: 182, y: 24 },
      { x: 85, y: 445 },
    ];
    for (const tr of decorTrees) {
      const sp = this.toScreen(tr.x, tr.y);
      g.fillStyle(0x28422e, 1);
      g.fillCircle(sp.x, sp.y, 14 * this.mapScale);
      g.fillStyle(0x36593d, 0.8);
      g.fillCircle(sp.x - 3, sp.y - 3, 9 * this.mapScale);
    }

    // Vẽ đường đi của quái
    for (const path of this.engine.stage.paths) {
      if (path.length < 2) continue;

      // Viền đường đá rộng
      g.lineStyle(26 * this.mapScale, 0x3a3228, 1);
      g.beginPath();
      const p0 = this.toScreen(path[0]!.x, path[0]!.y);
      g.moveTo(p0.x, p0.y);
      for (let i = 1; i < path.length; i += 1) {
        const pi = this.toScreen(path[i]!.x, path[i]!.y);
        g.lineTo(pi.x, pi.y);
      }
      g.strokePath();

      // Lòng đường đất vàng cổ trang
      g.lineStyle(18 * this.mapScale, 0x5c4d3c, 1);
      g.beginPath();
      g.moveTo(p0.x, p0.y);
      for (let i = 1; i < path.length; i += 1) {
        const pi = this.toScreen(path[i]!.x, path[i]!.y);
        g.lineTo(pi.x, pi.y);
      }
      g.strokePath();

      // Cửa mỏ quái ra (đầu đường)
      g.fillStyle(0x4cc9f0, 0.35);
      g.fillCircle(p0.x, p0.y, 16 * this.mapScale);
      g.lineStyle(2, 0x4cc9f0, 0.9);
      g.strokeCircle(p0.x, p0.y, 16 * this.mapScale);

      // Cổng Thành Lam Lư (cuối đường)
      const endPt = path[path.length - 1]!;
      const pEnd = this.toScreen(endPt.x, endPt.y);
      g.fillStyle(0xc7a45a, 0.35);
      g.fillRoundedRect(
        pEnd.x - 18 * this.mapScale,
        pEnd.y - 14 * this.mapScale,
        36 * this.mapScale,
        28 * this.mapScale,
        5,
      );
      g.lineStyle(2.5, 0xe8c468, 1);
      g.strokeRoundedRect(
        pEnd.x - 18 * this.mapScale,
        pEnd.y - 14 * this.mapScale,
        36 * this.mapScale,
        28 * this.mapScale,
        5,
      );
    }
  }

  private drawDynamicEntities(): void {
    const g = this.entityGraphics;
    g.clear();

    // 1. Vẽ các ô đặt quân (Build Pads) và Quân đang đứng
    for (const pad of this.engine.stage.pads) {
      const sp = this.toScreen(pad.x, pad.y);
      const r = 18 * this.mapScale;
      const tower = this.engine.getTowerAtPad(pad.id);
      const isSelected = this.selectedPadId === pad.id;

      if (!tower) {
        // Ô trống
        g.fillStyle(isSelected ? 0x3b4d3e : 0x263829, 0.92);
        g.fillCircle(sp.x, sp.y, r);
        g.lineStyle(isSelected ? 2.5 : 1.8, isSelected ? 0x4cc9f0 : 0x8ea88f, 0.85);
        g.strokeCircle(sp.x, sp.y, r);

        // Dấu + nhỏ ở giữa ô trống
        g.lineStyle(2, 0x9ab89c, 0.65);
        g.beginPath();
        g.moveTo(sp.x - 5 * this.mapScale, sp.y);
        g.lineTo(sp.x + 5 * this.mapScale, sp.y);
        g.moveTo(sp.x, sp.y - 5 * this.mapScale);
        g.lineTo(sp.x, sp.y + 5 * this.mapScale);
        g.strokePath();
      } else {
        this.drawTowerOnPad(g, tower, sp.x, sp.y, isSelected);
      }
    }

    // 2. Vẽ Quái trên đường
    for (const enemy of this.engine.enemies) {
      this.drawEnemyUnit(g, enemy);
    }

    // 3. Vẽ Đạn, Mảnh nổ, và Linh thạch bay
    const fx = this.fxGraphics;
    fx.clear();

    for (const p of this.projectiles) {
      const cx = p.x + (p.tx - p.x) * p.progress;
      const cy = p.y + (p.ty - p.y) * p.progress;
      fx.fillStyle(p.color, 1);
      fx.fillCircle(cx, cy, 4.5 * this.mapScale);
      fx.fillStyle(0xffffff, 0.9);
      fx.fillCircle(cx, cy, 2 * this.mapScale);
    }

    for (const pt of this.particles) {
      const alpha = Math.max(0, pt.life / pt.maxLife);
      fx.fillStyle(pt.color, alpha);
      fx.fillRect(pt.x - pt.size * 0.5, pt.y - pt.size * 0.5, pt.size, pt.size);
    }

    for (const st of this.flyingStones) {
      const t = st.progress;
      const cx = st.x + (st.tx - st.x) * t;
      const cy = st.y + (st.ty - st.y) * t - Math.sin(t * Math.PI) * 28;
      fx.fillStyle(0x4cc9f0, 1);
      fx.fillCircle(cx, cy, 4.5);
      fx.lineStyle(1.2, 0xffffff, 0.9);
      fx.strokeCircle(cx, cy, 4.5);
    }
  }

  private drawTowerOnPad(
    g: Phaser.GameObjects.Graphics,
    tower: ActiveTower,
    sx: number,
    sy: number,
    isSelected: boolean,
  ): void {
    const elInfo = ELEMENT_INFO[tower.element];
    const stats = getTowerTierStats(tower.defId, tower.tier, tower.branch);
    const r = 18 * this.mapScale;

    // Nếu đang chọn quân, vẽ vòng tầm bắn
    if (isSelected) {
      const rangePx = stats.range * tower.buffRangeMultiplier * this.mapScale;
      g.fillStyle(elInfo.colorInt, 0.11);
      g.fillCircle(sx, sy, rangePx);
      g.lineStyle(1.5, elInfo.colorInt, 0.7);
      g.strokeCircle(sx, sy, rangePx);
    }

    // Đế đồng khôi lỗi
    g.fillStyle(0x231d18, 1);
    g.fillCircle(sx, sy, r);
    g.lineStyle(2.5, elInfo.colorInt, 1);
    g.strokeCircle(sx, sy, r);

    // Vòng hào quang buff nếu đang được trụ Thổ hỗ trợ
    if (tower.buffDamageMultiplier > 1.01) {
      g.lineStyle(1.5, 0xe8c468, 0.75);
      g.strokeCircle(sx, sy, r + 3 * this.mapScale);
    }

    // Thân khôi lỗi theo bậc
    const innerR = (10 + tower.tier * 1.5) * this.mapScale;
    g.fillStyle(elInfo.colorInt, 0.88);
    g.fillRoundedRect(sx - innerR, sy - innerR, innerR * 2, innerR * 2, 4 * this.mapScale);

    // Lõi sáng ở tâm
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(sx, sy, 3.5 * this.mapScale);

    // Chấm sao chỉ bậc nâng cấp (1..3)
    for (let i = 0; i < tower.tier; i += 1) {
      const dotX = sx + (i - (tower.tier - 1) * 0.5) * 6.5 * this.mapScale;
      const dotY = sy + r - 3 * this.mapScale;
      g.fillStyle(0xffd166, 1);
      g.fillCircle(dotX, dotY, 2.3 * this.mapScale);
    }

    // Hiệu ứng bị "phá bùa" (khóa quân)
    if (tower.disruptedRemaining > 0) {
      g.fillStyle(0x4ea8de, 0.45);
      g.fillCircle(sx, sy, r);
      g.lineStyle(2, 0x9bf6ff, 1);
      g.strokeCircle(sx, sy, r + 2);
    }
  }

  private drawEnemyUnit(g: Phaser.GameObjects.Graphics, enemy: ActiveEnemy): void {
    const def = ENEMY_DEFINITIONS[enemy.defId];
    const elInfo = ELEMENT_INFO[enemy.element];
    const sp = this.toScreen(enemy.x, enemy.y);
    const r = def.radius * this.mapScale;

    // Bóng dưới chân
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(sp.x, sp.y + r * 0.75, r * 1.7, r * 0.7);

    // Thân quái (chớp trắng khi vừa trúng đạn)
    const fillColor = enemy.hitFlashRemaining > 0 ? 0xffffff : elInfo.colorInt;
    g.fillStyle(fillColor, 1);

    if (enemy.flying) {
      // Quái cánh gỗ bay: vẽ thêm đôi cánh hai bên
      g.fillTriangle(
        sp.x - r * 1.5,
        sp.y - r * 0.2,
        sp.x + r * 1.5,
        sp.y - r * 0.2,
        sp.x,
        sp.y + r,
      );
      g.fillCircle(sp.x, sp.y - r * 0.2, r * 0.85);
    } else if (enemy.trait === 'tank' || enemy.trait === 'boss') {
      g.fillRoundedRect(sp.x - r, sp.y - r, r * 2, r * 2, 4);
    } else {
      g.fillCircle(sp.x, sp.y, r);
    }

    g.lineStyle(1.8, 0x161311, 1);
    g.strokeCircle(sp.x, sp.y, r);

    // Viền xanh nếu đang bị làm chậm
    if (enemy.slowRemaining > 0) {
      g.lineStyle(2, 0x7ad6ff, 0.9);
      g.strokeCircle(sp.x, sp.y, r + 2);
    }

    // Thanh máu phía trên đầu quái
    const barW = Math.max(20, def.radius * 2) * this.mapScale;
    const barH = 4 * this.mapScale;
    const barX = sp.x - barW * 0.5;
    const barY = sp.y - r - 8 * this.mapScale;
    const hpRatio = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));

    g.fillStyle(0x141210, 0.85);
    g.fillRect(barX, barY, barW, barH);
    g.fillStyle(hpRatio > 0.4 ? 0x59c173 : 0xef6351, 1);
    g.fillRect(barX, barY, barW * hpRatio, barH);
  }

  private mountHud(): void {
    this.unmountDom();
    const container = document.getElementById('game-container');
    if (!container) return;

    const hud = document.createElement('div');
    hud.className = 'td-hud-layer';
    hud.id = 'td-hud-layer';

    const showBotBtn =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('bot') === '1';

    hud.innerHTML = `
      <div class="td-top-bar">
        <div class="td-stat-group">
          <div class="td-stat-chip" title="Linh thạch để đặt và nâng cấp quân">
            <span class="td-icon">💎</span>
            <span id="td-essence-val" data-testid="td-essence-val">${this.engine.essence}</span>
          </div>
          <div class="td-stat-chip" title="Mạng Thành Lam Lư">
            <span class="td-icon">❤️</span>
            <span id="td-lives-val" data-testid="td-lives-val">${this.engine.lives}/${this.engine.maxLives}</span>
          </div>
          <div class="td-stat-chip">
            <span>Đợt</span>
            <strong id="td-wave-val" data-testid="td-wave-val">0/${this.engine.getTotalWaves()}</strong>
          </div>
        </div>
        <div class="td-ctrl-group">
          <button id="btn-speed-toggle" data-testid="btn-speed-toggle" class="td-ctrl-btn">x1</button>
          ${showBotBtn ? `<button id="btn-bot-toggle" data-testid="btn-bot-toggle" class="td-ctrl-btn" title="Bật/Tắt Tự động đặt quân">Bot</button>` : ''}
          <button id="btn-pause-toggle" data-testid="btn-pause-toggle" class="td-ctrl-btn">⏸</button>
        </div>
      </div>

      <div class="td-bottom-bar">
        <div class="td-upcoming-box" id="td-upcoming-box" data-testid="td-upcoming-box"></div>
        <button id="btn-call-wave" data-testid="btn-call-wave" class="td-call-wave-btn">
          Bắt đầu Đợt 1
        </button>
      </div>
    `;

    container.appendChild(hud);
    this.hudRoot = hud;

    const modalHolder = document.createElement('div');
    modalHolder.className = 'td-modal-holder';
    modalHolder.id = 'td-modal-holder';
    container.appendChild(modalHolder);
    this.modalRoot = modalHolder;

    const speedBtn = hud.querySelector<HTMLButtonElement>('#btn-speed-toggle');
    if (speedBtn) {
      speedBtn.onclick = () => {
        sound.playUiClick();
        this.speedMultiplier = this.speedMultiplier === 1 ? 2 : 1;
        this.refreshHud();
      };
    }

    const botBtn = hud.querySelector<HTMLButtonElement>('#btn-bot-toggle');
    if (botBtn) {
      botBtn.onclick = () => {
        sound.playUiClick();
        this.autoBotEnabled = !this.autoBotEnabled;
        this.refreshHud();
      };
    }

    const pauseBtn = hud.querySelector<HTMLButtonElement>('#btn-pause-toggle');
    if (pauseBtn) {
      pauseBtn.onclick = () => {
        sound.playUiClick();
        this.paused = !this.paused;
        this.refreshHud();
      };
    }

    const callWaveBtn = hud.querySelector<HTMLButtonElement>('#btn-call-wave');
    if (callWaveBtn) {
      callWaveBtn.onclick = () => {
        sound.playUiClick();
        const isEarly = this.engine.currentWaveIndex >= 0;
        const res = this.engine.startNextWave(isEarly);
        if (res.started) {
          this.processCombatEvents(res.events);
          this.refreshHud();
        }
      };
    }

    this.refreshHud();
  }

  private refreshHud(): void {
    if (!this.hudRoot) return;

    const essenceEl = this.hudRoot.querySelector('#td-essence-val');
    if (essenceEl) essenceEl.textContent = String(this.engine.essence);

    const livesEl = this.hudRoot.querySelector('#td-lives-val');
    if (livesEl) livesEl.textContent = `${this.engine.lives}/${this.engine.maxLives}`;

    const waveEl = this.hudRoot.querySelector('#td-wave-val');
    if (waveEl) {
      waveEl.textContent = `${this.engine.getCurrentWaveNumber()}/${this.engine.getTotalWaves()}`;
    }

    const speedBtn = this.hudRoot.querySelector<HTMLButtonElement>('#btn-speed-toggle');
    if (speedBtn) {
      speedBtn.textContent = `x${this.speedMultiplier}`;
      speedBtn.classList.toggle('active', this.speedMultiplier === 2);
    }

    const botBtn = this.hudRoot.querySelector<HTMLButtonElement>('#btn-bot-toggle');
    if (botBtn) {
      botBtn.textContent = this.autoBotEnabled ? 'Bot: BẬT' : 'Bot';
      botBtn.classList.toggle('active', this.autoBotEnabled);
    }

    const pauseBtn = this.hudRoot.querySelector<HTMLButtonElement>('#btn-pause-toggle');
    if (pauseBtn) {
      pauseBtn.textContent = this.paused ? '▶' : '⏸';
      pauseBtn.classList.toggle('active', this.paused);
    }

    // Hiển thị biểu tượng hệ của đợt sắp tới để người chơi tính khắc chế
    const upcomingBox = this.hudRoot.querySelector('#td-upcoming-box');
    const upcoming = this.engine.getUpcomingWave();
    if (upcomingBox) {
      if (upcoming) {
        const badges = upcoming.mainElements
          .map((el) => {
            const info = ELEMENT_INFO[el];
            return `<span class="td-el-tag" style="background:${info.colorHex}">Hệ ${info.label}</span>`;
          })
          .join('');
        upcomingBox.innerHTML = `
          <div class="td-up-title">Sắp tới • ${upcoming.title}</div>
          <div class="td-up-elements">Hệ quái: ${badges}</div>
        `;
      } else {
        upcomingBox.innerHTML = `<div class="td-up-title">Đợt cuối đang diễn ra!</div>`;
      }
    }

    const callBtn = this.hudRoot.querySelector<HTMLButtonElement>('#btn-call-wave');
    if (callBtn) {
      const canCall = this.engine.canStartNextWave();
      callBtn.disabled = !canCall;
      if (!upcoming) {
        callBtn.textContent = 'Đợt Cuối';
      } else if (this.engine.currentWaveIndex === -1) {
        callBtn.textContent = 'Gọi Đợt 1';
      } else if (this.engine.waveInProgress) {
        callBtn.textContent = `Gọi Đợt ${upcoming.waveNumber} Sớm (+${upcoming.earlyBonusMax}💎)`;
      } else {
        const sec = Math.ceil(this.engine.nextWaveCountdownSec);
        callBtn.textContent =
          sec > 0 ? `Gọi Đợt ${upcoming.waveNumber} (${sec}s +💎)` : `Gọi Đợt ${upcoming.waveNumber}`;
      }
    }
  }

  private renderPadModal(padId: string): void {
    if (!this.modalRoot) return;
    const existingTower = this.engine.getTowerAtPad(padId);

    if (!existingTower) {
      const cardsHtml = TOWER_LIST.map((def) => {
        const elInfo = ELEMENT_INFO[def.element];
        const canAfford = this.engine.essence >= def.tier1.cost;
        return `
          <button
            class="td-build-option ${canAfford ? '' : 'disabled'}"
            data-tower-id="${def.id}"
            data-testid="build-${def.id}"
          >
            <div class="td-opt-head">
              <span class="td-el-dot" style="background:${elInfo.colorHex}">${elInfo.label}</span>
              <strong>${def.tier1.name}</strong>
              <span class="td-cost-badge">${def.tier1.cost}💎</span>
            </div>
            <div class="td-opt-role">${def.roleLabel} — ${def.tier1.description}</div>
          </button>
        `;
      }).join('');

      this.modalRoot.innerHTML = `
        <div class="td-sheet" data-testid="td-build-sheet">
          <div class="td-sheet-head">
            <strong>Đặt Khôi Lỗi (${padId.replace('pad_', 'Ô #')})</strong>
            <button class="td-close-btn" id="btn-close-sheet">✕</button>
          </div>
          <div class="td-build-list">${cardsHtml}</div>
        </div>
      `;

      this.modalRoot.querySelector('#btn-close-sheet')?.addEventListener('click', () => {
        this.selectedPadId = null;
        this.closePadModal();
      });

      this.modalRoot.querySelectorAll<HTMLButtonElement>('.td-build-option').forEach((btn) => {
        btn.onclick = () => {
          const defId = btn.dataset.towerId as TowerId;
          const built = this.engine.buildTower(padId, defId);
          if (built) {
            sound.playBuildOrUpgrade();
            this.selectedPadId = null;
            this.closePadModal();
            this.refreshHud();
          }
        };
      });
    } else {
      // Giao diện Nâng cấp / Bán quân đang chọn
      const def = TOWER_DEFINITIONS[existingTower.defId];
      const curStats = getTowerTierStats(
        existingTower.defId,
        existingTower.tier,
        existingTower.branch,
      );
      const elInfo = ELEMENT_INFO[existingTower.element];
      const refund = calculateSellRefund(existingTower.totalInvested);

      let upgradeSectionHtml = '';
      if (existingTower.tier === 1) {
        const t2 = def.tier2;
        const canAfford = this.engine.essence >= t2.cost;
        upgradeSectionHtml = `
          <button
            class="td-upgrade-btn ${canAfford ? '' : 'disabled'}"
            id="btn-upgrade-t2"
            data-testid="btn-upgrade-t2"
          >
            <div><strong>Lên Bậc 2: ${t2.name}</strong> (${t2.cost}💎)</div>
            <div class="td-opt-role">${t2.description}</div>
          </button>
        `;
      } else if (existingTower.tier === 2) {
        const t3A = def.tier3A;
        const t3B = def.tier3B;
        const canA = this.engine.essence >= t3A.cost;
        const canB = this.engine.essence >= t3B.cost;
        upgradeSectionHtml = `
          <div class="td-branch-grid">
            <button
              class="td-upgrade-btn ${canA ? '' : 'disabled'}"
              data-branch="A"
              data-testid="btn-upgrade-3A"
            >
              <div><strong>Nhánh A: ${t3A.name}</strong> (${t3A.cost}💎)</div>
              <div class="td-opt-role">${t3A.description}</div>
            </button>
            <button
              class="td-upgrade-btn ${canB ? '' : 'disabled'}"
              data-branch="B"
              data-testid="btn-upgrade-3B"
            >
              <div><strong>Nhánh B: ${t3B.name}</strong> (${t3B.cost}💎)</div>
              <div class="td-opt-role">${t3B.description}</div>
            </button>
          </div>
        `;
      } else {
        upgradeSectionHtml = `<div class="td-max-tier">Đã đạt Bậc 3 tối đa (Nhánh ${existingTower.branch})</div>`;
      }

      this.modalRoot.innerHTML = `
        <div class="td-sheet" data-testid="td-upgrade-sheet">
          <div class="td-sheet-head">
            <div>
              <span class="td-el-dot" style="background:${elInfo.colorHex}">${elInfo.label}</span>
              <strong>${curStats.name}</strong>
            </div>
            <button class="td-close-btn" id="btn-close-sheet">✕</button>
          </div>
          <div class="td-cur-stats">
            Công: <strong>${Math.round(curStats.damage * existingTower.buffDamageMultiplier)}</strong> •
            Tầm: <strong>${Math.round(curStats.range * existingTower.buffRangeMultiplier)}</strong> •
            Hồi: <strong>${(curStats.cooldownSec / existingTower.buffSpeedMultiplier).toFixed(2)}s</strong>
          </div>
          ${upgradeSectionHtml}
          <button class="td-sell-btn" id="btn-sell-tower" data-testid="btn-sell-tower">
            Thu hồi / Bán quân (+${refund}💎 — hoàn 70%)
          </button>
        </div>
      `;

      this.modalRoot.querySelector('#btn-close-sheet')?.addEventListener('click', () => {
        this.selectedPadId = null;
        this.closePadModal();
      });

      this.modalRoot.querySelector('#btn-upgrade-t2')?.addEventListener('click', () => {
        if (this.engine.upgradeTower(padId)) {
          sound.playBuildOrUpgrade();
          this.renderPadModal(padId);
          this.refreshHud();
        }
      });

      this.modalRoot.querySelectorAll<HTMLButtonElement>('[data-branch]').forEach((btn) => {
        btn.onclick = () => {
          const branch = btn.dataset.branch as TowerBranch;
          if (this.engine.upgradeTower(padId, branch)) {
            sound.playBuildOrUpgrade();
            this.renderPadModal(padId);
            this.refreshHud();
          }
        };
      });

      this.modalRoot.querySelector('#btn-sell-tower')?.addEventListener('click', () => {
        const got = this.engine.sellTower(padId);
        if (got > 0) {
          sound.playSell();
          this.selectedPadId = null;
          this.closePadModal();
          this.refreshHud();
        }
      });
    }
  }

  private closePadModal(): void {
    if (this.modalRoot) {
      this.modalRoot.innerHTML = '';
    }
  }

  private showStageResultModal(): void {
    if (!this.modalRoot) return;
    const isWin = this.engine.status === 'won';
    const stars = calculateStarRating(this.engine.lives, this.engine.maxLives);
    const starDisplay = isWin ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '☆☆☆';

    this.modalRoot.innerHTML = `
      <div class="td-result-modal" data-testid="td-result-modal">
        <h2 class="td-result-title">${isWin ? 'Thủ Thành Thắng Lợi!' : 'Thành Lam Lư Thất Thủ'}</h2>
        <div class="td-result-stars" data-testid="td-result-stars">${starDisplay}</div>
        <p class="td-result-desc">
          ${
            isWin
              ? `Giữ vững tiền đồn sau ${this.engine.getTotalWaves()} đợt khôi lỗi! Mạng còn lại: ${this.engine.lives}/${this.engine.maxLives}.`
              : 'Khôi lỗi vỡ bùa đã tràn qua phòng tuyến. Hãy thử phối hợp khắc hệ Ngũ Hành và đặt quân làm chậm ở khúc cua!'
          }
        </p>
        <div class="td-result-actions">
          <button id="btn-retry-stage" data-testid="btn-retry-stage" class="td-btn-primary">Chơi Lại Màn 1</button>
          <button id="btn-back-title" data-testid="btn-back-title" class="td-ctrl-btn">Về Màn Chính</button>
        </div>
      </div>
    `;

    this.modalRoot.querySelector('#btn-retry-stage')?.addEventListener('click', () => {
      sound.playUiClick();
      this.scene.restart();
    });

    this.modalRoot.querySelector('#btn-back-title')?.addEventListener('click', () => {
      sound.playUiClick();
      this.scene.start(SCENE_KEYS.TITLE);
    });
  }

  private unmountDom(): void {
    if (this.hudRoot) {
      this.hudRoot.remove();
      this.hudRoot = null;
    }
    if (this.modalRoot) {
      this.modalRoot.remove();
      this.modalRoot = null;
    }
  }
}
