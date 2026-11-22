import Phaser from 'phaser';
import { ELEMENT_INFO } from '../core/elements';
import { getGearBonus, grantStageDrops, loadTdSave, saveTdProgress } from '../core/saveSystem';
import { RARITY_LABEL, statText, type GearItem } from '../core/equipment';
import { ULTIMATE_COST, ULTIMATE_MIN_STAGE, ULTIMATE_NAMES, ULTIMATE_ROLE_TEXT } from '../core/ultimates';
import { runBotTurn } from '../core/tdBot';
import {
  ALL_ENEMY_DEFINITIONS as ENEMY_DEFINITIONS,
  ALL_TOWER_DEFINITIONS as TOWER_DEFINITIONS,
  calculateSellRefund,
  getStageTowerList,
  getTowerTierStats,
  STAGES,
} from '../core/tdDefinitions';
import { calculateStarRating, TowerDefenseEngine } from '../core/tdEngine';
import type {
  ActiveEnemy,
  ActiveTower,
  CombatEvent,
  EnemyId,
  TowerBranch,
  TowerId,
} from '../core/types';
import {
  ATLAS_KEY,
  getAtlasFrameDataUrl,
  getEnemyFrameName,
  getTowerFrameName,
  getTowerTierKey,
  STAGE1_MAP_KEY,
  STAGE2_MAP_KEY,
} from '../game/atlasIcons';
import { getInitialReduceMotion, saveReduceMotion } from '../game/preferences';
import { SCENE_KEYS } from '../game/sceneKeys';
import { sound } from '../game/sound';
import { getSynergyExplanation } from '../game/synergyText';

const LOGICAL_WIDTH = 360;
const LOGICAL_HEIGHT = 480;
const STAGE2_LOGICAL_HEIGHT = 520;

interface ProjectileVisual {
  kind: TowerId;
  x: number;
  y: number;
  tx: number;
  ty: number;
  color: number;
  progress: number;
  speed: number;
  arcHeight: number;
  sprite?: Phaser.GameObjects.Image;
}

interface AreaEffectVisual {
  kind: 'stomp' | 'mist' | 'silica' | 'heat' | 'snuff' | 'swat' | 'wind' | 'oven' | 'frost';
  x: number;
  y: number;
  radius: number;
  color: number;
  life: number;
  maxLife: number;
}

interface ShardParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  color: number;
  life: number;
  maxLife: number;
  size: number;
  shape: 'circle' | 'square' | 'drop';
}

interface DyingSpriteFx {
  sprite: Phaser.GameObjects.Sprite;
  kind: 'flip_spin' | 'scurry' | 'snuff';
  vx: number;
  vy: number;
  spinSpeed: number;
  life: number;
  maxLife: number;
}

interface FlyingMoney {
  x: number;
  y: number;
  tx: number;
  ty: number;
  progress: number;
  isBill: boolean;
  sprite?: Phaser.GameObjects.Image;
}

interface FloatingLabel {
  el: Phaser.GameObjects.Text;
  vy: number;
  life: number;
  maxLife: number;
  popScale: boolean;
}

interface RainDrop {
  lx: number;
  ly: number;
  len: number;
  speed: number;
}

interface PuddleRipple {
  lx: number;
  ly: number;
  life: number;
  maxLife: number;
  maxR: number;
}

interface TowerVisualRecord {
  sprite: Phaser.GameObjects.Sprite;
  tierKey: string;
  recoilTimer: number;
  flashTimer: number;
}

interface EnemyVisualRecord {
  sprite: Phaser.GameObjects.Sprite;
  lastX: number;
  bobPhase: number;
}

export class TdStageScene extends Phaser.Scene {
  public engine!: TowerDefenseEngine;
  public speedMultiplier: 1 | 2 = 1;
  public paused = false;
  public autoBotEnabled = false;
  public reduceMotion = false;
  public selectedPadId: string | null = null;

  private mapImage: Phaser.GameObjects.Image | null = null;
  private placeholderMap: Phaser.GameObjects.Graphics | null = null;
  private padGraphics!: Phaser.GameObjects.Graphics;
  private synergyGraphics!: Phaser.GameObjects.Graphics;
  private overlayGraphics!: Phaser.GameObjects.Graphics;
  private fxGraphics!: Phaser.GameObjects.Graphics;
  private weatherGraphics!: Phaser.GameObjects.Graphics;

  private towerSprites = new Map<string, TowerVisualRecord>();
  private enemySprites = new Map<string, EnemyVisualRecord>();

  private hudRoot: HTMLDivElement | null = null;
  private modalRoot: HTMLDivElement | null = null;
  private synergyTooltipRoot: HTMLDivElement | null = null;
  private activeSynergyLinks = new Set<string>();
  private resultShown = false;
  private lastDrops: GearItem[] = [];
  private lastUpcomingWaveNum = -999;

  private projectiles: ProjectileVisual[] = [];
  private areaEffects: AreaEffectVisual[] = [];
  private particles: ShardParticle[] = [];
  private dyingSprites: DyingSpriteFx[] = [];
  private flyingMoney: FlyingMoney[] = [];
  private floatingLabels: FloatingLabel[] = [];
  private rainDrops: RainDrop[] = [];
  private ripples: PuddleRipple[] = [];
  private fireworkTimer = 0;
  private animTimeSec = 0;
  private walletBounceTimer = 0;

  private mapOffsetX = 0;
  private mapOffsetY = 58;
  private mapScale = 1;

  constructor() {
    super({ key: SCENE_KEYS.TD_STAGE });
  }

  public create(data?: { stageId?: 'stage_1' | 'stage_2' | 'stage_3' }): void {
    // Chọn màn: từ nút ở màn hình đầu, hoặc thêm ?stage=2 vào link (để thử / quay video)
    let stageId: 'stage_1' | 'stage_2' | 'stage_3' = data?.stageId ?? 'stage_1';
    if (!data?.stageId && typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('stage');
      if (q === '2') stageId = 'stage_2';
      if (q === '3') stageId = 'stage_3';
    }
    // Trang bị chủ tiệm đang mặc (lưu trên máy)
    this.engine = new TowerDefenseEngine(STAGES[stageId], { gear: getGearBonus(loadTdSave()) });
    this.lastDrops = [];
    this.speedMultiplier = 1;
    this.paused = false;
    this.autoBotEnabled = false;
    this.reduceMotion = getInitialReduceMotion();
    this.selectedPadId = null;
    this.activeSynergyLinks = new Set();
    this.resultShown = false;
    this.lastUpcomingWaveNum = -999;

    this.projectiles = [];
    this.areaEffects = [];
    this.particles = [];
    this.dyingSprites = [];
    this.flyingMoney = [];
    this.floatingLabels = [];
    this.towerSprites.clear();
    this.enemySprites.clear();
    this.animTimeSec = 0;
    this.fireworkTimer = 0;
    this.walletBounceTimer = 0;

    this.cameras.main.setBackgroundColor('#241811');

    this.computeViewportTransform();

    this.mapImage = null;
    this.placeholderMap = null;
    const mapKey =
      this.engine.stage.id === 'stage_1'
        ? STAGE1_MAP_KEY
        : this.engine.stage.id === 'stage_2'
          ? STAGE2_MAP_KEY
          : null;
    if (mapKey && this.textures.exists(mapKey)) {
      this.mapImage = this.add
        .image(this.mapOffsetX, this.mapOffsetY, mapKey)
        .setOrigin(0, 0)
        .setDepth(1);
      this.layoutMapImage();
    } else {
      this.placeholderMap = this.add.graphics().setDepth(1);
      this.layoutMapImage();
    }

    this.padGraphics = this.add.graphics().setDepth(4);
    this.synergyGraphics = this.add.graphics().setDepth(7);
    this.overlayGraphics = this.add.graphics().setDepth(22);
    this.fxGraphics = this.add.graphics().setDepth(26);
    this.weatherGraphics = this.add.graphics().setDepth(28);

    this.initRainDrops();
    this.mountHud();

    this.scale.on('resize', () => {
      this.computeViewportTransform();
      this.layoutMapImage();
      this.syncAllSpritePositions();
      this.refreshHud();
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleCanvasTap(pointer.x, pointer.y);
    });

    if (typeof window !== 'undefined') {
      (window as unknown as { __TD_SCENE__?: TdStageScene }).__TD_SCENE__ = this;
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cleanupAllSprites();
      this.unmountDom();
    });
  }

  private getLogicalHeight(): number {
    return this.engine.stage.id === 'stage_1' ? LOGICAL_HEIGHT : STAGE2_LOGICAL_HEIGHT;
  }

  private initRainDrops(): void {
    this.rainDrops = [];
    const isStage2 = this.engine.stage.id === 'stage_2';
    for (let i = 0; i < 18; i += 1) {
      this.rainDrops.push({
        lx: isStage2 ? 140 + Math.random() * 82 : Math.random() * 112,
        ly: isStage2 ? Math.random() * 42 : Math.random() * 68,
        len: 7 + Math.random() * 6,
        speed: 75 + Math.random() * 45,
      });
    }
    this.ripples = isStage2
      ? [
          { lx: 162, ly: 19, life: 0.2, maxLife: 1.4, maxR: 10 },
          { lx: 196, ly: 24, life: 0.85, maxLife: 1.5, maxR: 9 },
        ]
      : [
          { lx: 22, ly: 34, life: 0.2, maxLife: 1.4, maxR: 11 },
          { lx: 64, ly: 16, life: 0.9, maxLife: 1.5, maxR: 10 },
        ];
  }

  private layoutMapImage(): void {
    const logicalH = this.getLogicalHeight();
    if (this.placeholderMap) {
      const g = this.placeholderMap;
      g.clear();
      g.fillStyle(0x3a2a1c, 1);
      g.fillRect(this.mapOffsetX, this.mapOffsetY, LOGICAL_WIDTH * this.mapScale, logicalH * this.mapScale);
      for (const path of this.engine.stage.paths) {
        g.lineStyle(26 * this.mapScale, 0x8a6a48, 1);
        g.beginPath();
        path.forEach((pt, i) => {
          const sp = this.toScreen(pt.x, pt.y);
          if (i === 0) g.moveTo(sp.x, sp.y);
          else g.lineTo(sp.x, sp.y);
        });
        g.strokePath();
      }
      for (const path of this.engine.stage.paths) {
        const start = path[0];
        if (start) { const sp = this.toScreen(start.x, start.y); g.fillStyle(0x4ea8de, 1); g.fillCircle(sp.x, sp.y, 14 * this.mapScale); }
      }
      const end = this.engine.stage.paths[0]?.[this.engine.stage.paths[0].length - 1];
      if (end) { const sp = this.toScreen(end.x, end.y); g.fillStyle(0xe8c468, 1); g.fillRect(sp.x - 16 * this.mapScale, sp.y - 12 * this.mapScale, 32 * this.mapScale, 24 * this.mapScale); }
      return;
    }
    if (!this.mapImage) return;
    this.mapImage.setPosition(this.mapOffsetX, this.mapOffsetY);
    this.mapImage.setDisplaySize(LOGICAL_WIDTH * this.mapScale, logicalH * this.mapScale);
  }

  private computeViewportTransform(): void {
    const { width, height } = this.scale;
    const logicalH = this.getLogicalHeight();
    const topHudH = 54;
    const bottomHudH = 68;
    const availW = Math.max(260, width - 8);
    const availH = Math.max(300, height - topHudH - bottomHudH);

    this.mapScale = Math.min(availW / LOGICAL_WIDTH, availH / logicalH);
    this.mapOffsetX = Math.round((width - LOGICAL_WIDTH * this.mapScale) * 0.5);
    this.mapOffsetY = Math.round(topHudH + (availH - logicalH * this.mapScale) * 0.5);
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

  public getActiveSynergyLinks(): Array<{
    key: string;
    giver: ActiveTower;
    receiver: ActiveTower;
    midLogical: { x: number; y: number };
    midScreen: { x: number; y: number };
  }> {
    const links: Array<{
      key: string;
      giver: ActiveTower;
      receiver: ActiveTower;
      midLogical: { x: number; y: number };
      midScreen: { x: number; y: number };
    }> = [];
    for (const receiver of this.engine.towers) {
      if (!receiver.synergyFromUid) continue;
      const giver = this.engine.towers.find((t) => t.uid === receiver.synergyFromUid);
      if (!giver) continue;
      const mx = (giver.x + receiver.x) * 0.5;
      const my = (giver.y + receiver.y) * 0.5;
      links.push({
        key: `${giver.uid}->${receiver.uid}`,
        giver,
        receiver,
        midLogical: { x: mx, y: my },
        midScreen: this.toScreen(mx, my),
      });
    }
    return links;
  }

  private pointToSegmentDist(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): number {
    const vx = x2 - x1;
    const vy = y2 - y1;
    const lenSq = vx * vx + vy * vy;
    if (lenSq <= 0.0001) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * vx + (py - y1) * vy) / lenSq));
    return Math.hypot(px - (x1 + vx * t), py - (y1 + vy * t));
  }

  private handleCanvasTap(screenX: number, screenY: number): void {
    if (this.engine.status !== 'playing') return;
    const pt = this.toLogical(screenX, screenY);

    let clickedPadId: string | null = null;
    let minDist = 24;
    for (const pad of this.engine.stage.pads) {
      const d = Math.hypot(pad.x - pt.x, pad.y - pt.y);
      if (d <= minDist) {
        minDist = d;
        clickedPadId = pad.id;
      }
    }

    if (clickedPadId) {
      sound.playUiClick();
      this.closeSynergyTooltip();
      this.selectedPadId = clickedPadId;
      this.renderPadModal(clickedPadId);
      return;
    }

    // Kiểm tra người chơi có chạm vào đường sáng tương sinh không
    let tappedLink: { giver: ActiveTower; receiver: ActiveTower } | null = null;
    let minLineDist = 16;
    for (const link of this.getActiveSynergyLinks()) {
      const d = this.pointToSegmentDist(
        pt.x,
        pt.y,
        link.giver.x,
        link.giver.y,
        link.receiver.x,
        link.receiver.y,
      );
      if (d <= minLineDist) {
        minLineDist = d;
        tappedLink = link;
      }
    }

    if (tappedLink) {
      sound.playUiClick();
      if (this.selectedPadId) {
        this.selectedPadId = null;
        this.closePadModal();
      }
      this.showSynergyTooltip(tappedLink.giver, tappedLink.receiver);
      return;
    }

    this.closeSynergyTooltip();
    if (this.selectedPadId) {
      this.selectedPadId = null;
      this.closePadModal();
    }
  }

  public selectPadById(padId: string): void {
    this.closeSynergyTooltip();
    this.selectedPadId = padId;
    this.renderPadModal(padId);
  }

  public toggleReduceMotion(): void {
    this.reduceMotion = !this.reduceMotion;
    saveReduceMotion(this.reduceMotion);
    this.refreshHud();
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
    this.animTimeSec += rawDt;

    if (!this.paused && this.engine.status === 'playing') {
      const simDt = rawDt * this.speedMultiplier;
      this.tickSimulation(simDt);
    }

    if (this.engine.status === 'won' && !this.reduceMotion) {
      this.fireworkTimer -= rawDt;
      if (this.fireworkTimer <= 0) {
        this.fireworkTimer = 0.55 + Math.random() * 0.45;
        this.spawnVictoryFirework();
      }
    }

    this.syncSprites(rawDt);
    this.updateVisualEffects(rawDt);
    this.syncSynergyLinksAndDraw();
    this.drawPadHighlightsAndOverlays();
    this.drawFxAndWeather(rawDt);
    this.refreshHud();

    if (this.engine.status !== 'playing' && !this.resultShown) {
      this.resultShown = true;
      this.closeSynergyTooltip();
      if (this.engine.status === 'won' && !this.reduceMotion) {
        for (let i = 0; i < 3; i += 1) this.spawnVictoryFirework();
      }
      this.showStageResultModal();
    }
  }

  private syncAllSpritePositions(): void {
    for (const tower of this.engine.towers) {
      const rec = this.towerSprites.get(tower.uid);
      if (rec) {
        const sp = this.toScreen(tower.x, tower.y - 3);
        rec.sprite.setPosition(sp.x, sp.y);
      }
    }
    for (const enemy of this.engine.enemies) {
      const rec = this.enemySprites.get(enemy.uid);
      if (rec) {
        const sp = this.toScreen(enemy.x, enemy.y);
        rec.sprite.setPosition(sp.x, sp.y);
      }
    }
  }

  private syncSprites(dt: number): void {
    const hasAtlas = this.textures.exists(ATLAS_KEY);

    // 1. Đồng bộ Sprite các món giữ tiệm
    const activeTowerUids = new Set<string>();
    for (const tower of this.engine.towers) {
      activeTowerUids.add(tower.uid);
      const tierKey = getTowerTierKey(tower.tier, tower.branch);
      const sp = this.toScreen(tower.x, tower.y - 4);
      const baseDisplay = (tower.tier === 3 ? 47 : tower.tier === 2 ? 44 : 41) * this.mapScale;

      let rec = this.towerSprites.get(tower.uid);
      if (!rec && hasAtlas) {
        const frame = getTowerFrameName(tower.defId, tower.tier, tower.branch, 0);
        const sprite = this.add.sprite(sp.x, sp.y, ATLAS_KEY, frame).setDepth(10 + tower.y * 0.01);
        rec = { sprite, tierKey, recoilTimer: 0, flashTimer: 0 };
        this.towerSprites.set(tower.uid, rec);
      }

      if (rec) {
        if (rec.tierKey !== tierKey) {
          rec.tierKey = tierKey;
          rec.sprite.stop();
          rec.sprite.setFrame(getTowerFrameName(tower.defId, tower.tier, tower.branch, 0));
          rec.recoilTimer = 0.22;
        }

        let scaleX = 1;
        let scaleY = 1;
        let shakeX = 0;

        if (rec.recoilTimer > 0) {
          rec.recoilTimer = Math.max(0, rec.recoilTimer - dt);
          const k = Math.sin((rec.recoilTimer / 0.18) * Math.PI);
          scaleX = 1 - k * 0.12;
          scaleY = 1 + k * 0.14;
        }
        if (rec.flashTimer > 0) {
          rec.flashTimer = Math.max(0, rec.flashTimer - dt);
        }

        if (tower.disruptedRemaining > 0) {
          shakeX = Math.sin(this.animTimeSec * 40) * 2.5 * this.mapScale;
          rec.sprite.setTint(0xa8b8cc);
        } else if (rec.flashTimer > 0) {
          rec.sprite.setTint(0xfff4c2);
        } else {
          rec.sprite.clearTint();
        }

        rec.sprite.setPosition(sp.x + shakeX, sp.y);
        rec.sprite.setDisplaySize(baseDisplay * scaleX, baseDisplay * scaleY);
      }
    }

    for (const [uid, rec] of this.towerSprites.entries()) {
      if (!activeTowerUids.has(uid)) {
        rec.sprite.destroy();
        this.towerSprites.delete(uid);
      }
    }

    // 2. Đồng bộ Sprite bọn phá đồ
    const activeEnemyUids = new Set<string>();
    for (const enemy of this.engine.enemies) {
      activeEnemyUids.add(enemy.uid);
      const def = ENEMY_DEFINITIONS[enemy.defId];
      const sp = this.toScreen(enemy.x, enemy.y);
      const targetDim = Math.max(24, def.radius * 2.75) * this.mapScale;

      let rec = this.enemySprites.get(enemy.uid);
      if (!rec && hasAtlas) {
        const frame = getEnemyFrameName(enemy.defId, 0);
        const sprite = this.add.sprite(sp.x, sp.y, ATLAS_KEY, frame).setDepth(15 + enemy.y * 0.01);
        const animKey = `anim_walk_${enemy.defId}`;
        if (this.anims.exists(animKey)) {
          sprite.play(animKey);
        }
        rec = { sprite, lastX: enemy.x, bobPhase: Math.random() * Math.PI * 2 };
        this.enemySprites.set(enemy.uid, rec);
      }

      if (rec) {
        const dx = enemy.x - rec.lastX;
        if (Math.abs(dx) > 0.15) {
          // Hướng mặc định sprite: quay mặt về bên phải/trái tuỳ hướng đi
          const faceRight = dx > 0;
          const defaultFacesLeft = enemy.defId === 'split_fire' || enemy.defId === 'split_fire_mini';
          rec.sprite.setFlipX(defaultFacesLeft ? faceRight : !faceRight);
        }
        rec.lastX = enemy.x;

        const bob = this.reduceMotion
          ? 0
          : Math.abs(Math.sin(this.animTimeSec * (enemy.flying ? 7 : 9) + rec.bobPhase)) *
            (enemy.flying ? 4.2 : 2.6) *
            this.mapScale;

        rec.sprite.setPosition(sp.x, sp.y - bob - (enemy.flying ? 4 * this.mapScale : 0));
        rec.sprite.setDepth(15 + enemy.y * 0.01);
        rec.sprite.setDisplaySize(targetDim, targetDim);

        if (enemy.hitFlashRemaining > 0) {
          rec.sprite.setTintFill(0xffffff);
        } else if (enemy.stunRemaining > 0) {
          rec.sprite.setTint(0xb5f3ff);
        } else if (enemy.slowRemaining > 0) {
          rec.sprite.setTint(0x7ad6ff);
        } else {
          rec.sprite.clearTint();
        }
      }
    }

    for (const [uid, rec] of this.enemySprites.entries()) {
      if (!activeEnemyUids.has(uid)) {
        rec.sprite.destroy();
        this.enemySprites.delete(uid);
      }
    }
  }

  private processCombatEvents(events: CombatEvent[]): void {
    const hasAtlas = this.textures.exists(ATLAS_KEY);

    for (const ev of events) {
      const sPos = this.toScreen(ev.x, ev.y);
      if (ev.type === 'shot' && ev.targetX !== undefined && ev.targetY !== undefined) {
        const tPos = this.toScreen(ev.targetX, ev.targetY);
        const color = ev.element ? ELEMENT_INFO[ev.element].colorInt : 0xffffff;
        const towerDefId = ev.towerDefId ?? 'wood_tower';

        // Kích hoạt hoạt ảnh 3 khung + giật nảy + lóe sáng cho món vừa đánh
        if (ev.towerUid) {
          const trec = this.towerSprites.get(ev.towerUid);
          if (trec) {
            trec.recoilTimer = 0.18;
            trec.flashTimer = 0.12;
            const animKey = `anim_fire_${towerDefId}_${trec.tierKey}`;
            if (this.anims.exists(animKey)) {
              trec.sprite.play(animKey, true);
            }
          }
        }

        // Hiệu ứng đòn đánh RIÊNG cho từng món giữ tiệm (Màn 1 & Màn 2)
        if (towerDefId === 'wood_tower') {
          // Dép tông xoay vèo tới mục tiêu
          const sp = hasAtlas
            ? this.add
                .image(sPos.x, sPos.y, ATLAS_KEY, 'proj_dep_tong')
                .setDisplaySize(22 * this.mapScale, 22 * this.mapScale)
                .setDepth(27)
            : undefined;
          this.projectiles.push({
            kind: 'wood_tower',
            x: sPos.x,
            y: sPos.y,
            tx: tPos.x,
            ty: tPos.y,
            color,
            progress: 0,
            speed: 6.2,
            arcHeight: 16 * this.mapScale,
            sprite: sp,
          });
        } else if (towerDefId === 'metal_tower') {
          // Bốt đế đinh đạp mạnh có bụi & sóng xung kích bạc
          this.areaEffects.push({
            kind: 'stomp',
            x: tPos.x,
            y: tPos.y,
            radius: 26 * this.mapScale,
            color: ELEMENT_INFO.kim.colorInt,
            life: 0.28,
            maxLife: 0.28,
          });
          this.spawnDustBurst(tPos.x, tPos.y, 0xc9a57a, this.reduceMotion ? 3 : 6);
        } else if (towerDefId === 'water_tower') {
          // Xịt dưỡng da phun làn sương xanh dương làm chậm cả vùng
          this.projectiles.push({
            kind: 'water_tower',
            x: sPos.x,
            y: sPos.y,
            tx: tPos.x,
            ty: tPos.y,
            color: ELEMENT_INFO.thuy.colorInt,
            progress: 0,
            speed: 8.0,
            arcHeight: 0,
          });
          this.areaEffects.push({
            kind: 'mist',
            x: tPos.x,
            y: tPos.y,
            radius: (ev.splashRadius ?? 50) * this.mapScale,
            color: ELEMENT_INFO.thuy.colorInt,
            life: 0.45,
            maxLife: 0.45,
          });
        } else if (towerDefId === 'fire_tower') {
          // Túi xách quăng gói hút ẩm bay cầu vồng rồi văng hạt hút ẩm nổ cả bầy
          const sp = hasAtlas
            ? this.add
                .image(sPos.x, sPos.y, ATLAS_KEY, 'proj_silica')
                .setDisplaySize(20 * this.mapScale, 20 * this.mapScale)
                .setDepth(27)
            : undefined;
          this.projectiles.push({
            kind: 'fire_tower',
            x: sPos.x,
            y: sPos.y,
            tx: tPos.x,
            ty: tPos.y,
            color: ELEMENT_INFO.tho.colorInt,
            progress: 0,
            speed: 5.2,
            arcHeight: 34 * this.mapScale,
            sprite: sp,
          });
          this.areaEffects.push({
            kind: 'silica',
            x: tPos.x,
            y: tPos.y,
            radius: (ev.splashRadius ?? 54) * this.mapScale,
            color: ELEMENT_INFO.tho.colorInt,
            life: 0.34,
            maxLife: 0.34,
          });
        } else if (towerDefId === 'bk_swatter') {
          // Vỉ Đập Ruồi (Kim): vệt đập bạc sắc gọn (3B Vợt Điện thêm tia lửa điện xanh)
          const srcTower = ev.towerUid ? this.engine.towers.find((t) => t.uid === ev.towerUid) : undefined;
          const isElectric = srcTower?.tier === 3 && srcTower.branch === 'B';
          this.projectiles.push({
            kind: 'bk_swatter',
            x: sPos.x,
            y: sPos.y,
            tx: tPos.x,
            ty: tPos.y,
            color: isElectric ? 0x67e8f9 : ELEMENT_INFO.kim.colorInt,
            progress: 0,
            speed: 9.5,
            arcHeight: 10 * this.mapScale,
          });
          this.areaEffects.push({
            kind: 'swat',
            x: tPos.x,
            y: tPos.y,
            radius: 22 * this.mapScale,
            color: isElectric ? 0x67e8f9 : 0xe2e8f0,
            life: 0.24,
            maxLife: 0.24,
          });
          if (isElectric) {
            this.spawnDustBurst(tPos.x, tPos.y, 0x38bdf8, this.reduceMotion ? 3 : 6);
          }
        } else if (towerDefId === 'bk_jar') {
          // Hũ Sành Kín (Thổ): sập nắp nặng rúng đất & bụi gốm nâu vàng
          this.projectiles.push({
            kind: 'bk_jar',
            x: sPos.x,
            y: sPos.y,
            tx: tPos.x,
            ty: tPos.y,
            color: ELEMENT_INFO.tho.colorInt,
            progress: 0,
            speed: 6.4,
            arcHeight: 24 * this.mapScale,
          });
          this.areaEffects.push({
            kind: 'stomp',
            x: tPos.x,
            y: tPos.y,
            radius: 28 * this.mapScale,
            color: ELEMENT_INFO.tho.colorInt,
            life: 0.3,
            maxLife: 0.3,
          });
          this.spawnDustBurst(tPos.x, tPos.y, 0xd4a359, this.reduceMotion ? 3 : 7);
        } else if (towerDefId === 'bk_fan') {
          // Quạt Điện (Mộc): luồng gió xanh lá xoáy rộng làm chậm cả vùng
          this.projectiles.push({
            kind: 'bk_fan',
            x: sPos.x,
            y: sPos.y,
            tx: tPos.x,
            ty: tPos.y,
            color: ELEMENT_INFO.moc.colorInt,
            progress: 0,
            speed: 7.8,
            arcHeight: 0,
          });
          this.areaEffects.push({
            kind: 'wind',
            x: tPos.x,
            y: tPos.y,
            radius: (ev.splashRadius ?? 50) * this.mapScale,
            color: ELEMENT_INFO.moc.colorInt,
            life: 0.44,
            maxLife: 0.44,
          });
        } else if (towerDefId === 'bk_oven') {
          // Lò Nướng (Hỏa): phả hơi nóng đỏ cam bùng tỏa cả vùng
          this.projectiles.push({
            kind: 'bk_oven',
            x: sPos.x,
            y: sPos.y,
            tx: tPos.x,
            ty: tPos.y,
            color: ELEMENT_INFO.hoa.colorInt,
            progress: 0,
            speed: 6.2,
            arcHeight: 16 * this.mapScale,
          });
          this.areaEffects.push({
            kind: 'oven',
            x: tPos.x,
            y: tPos.y,
            radius: (ev.splashRadius ?? 54) * this.mapScale,
            color: ELEMENT_INFO.hoa.colorInt,
            life: 0.38,
            maxLife: 0.38,
          });
          this.spawnDustBurst(tPos.x, tPos.y, 0xff924c, this.reduceMotion ? 3 : 6);
        } else if (towerDefId === 'bk_fridge') {
          // Tủ Mát (Thủy): phả làn gió lạnh xanh dương dập than hồng & giữ lạnh món quanh tủ
          this.projectiles.push({
            kind: 'bk_fridge',
            x: sPos.x,
            y: sPos.y,
            tx: tPos.x,
            ty: tPos.y,
            color: ELEMENT_INFO.thuy.colorInt,
            progress: 0,
            speed: 7.4,
            arcHeight: 0,
          });
          this.areaEffects.push({
            kind: 'frost',
            x: sPos.x,
            y: sPos.y,
            radius: 38 * this.mapScale,
            color: ELEMENT_INFO.thuy.colorInt,
            life: 0.36,
            maxLife: 0.36,
          });
        } else {
          // Máy sấy giày / mặc định: thổi hơi ấm đỏ cam
          this.projectiles.push({
            kind: 'earth_tower',
            x: sPos.x,
            y: sPos.y,
            tx: tPos.x,
            ty: tPos.y,
            color: ELEMENT_INFO.hoa.colorInt,
            progress: 0,
            speed: 7.0,
            arcHeight: 0,
          });
          this.areaEffects.push({
            kind: 'heat',
            x: sPos.x,
            y: sPos.y,
            radius: 36 * this.mapScale,
            color: ELEMENT_INFO.hoa.colorInt,
            life: 0.32,
            maxLife: 0.32,
          });
        }
        sound.playShoot();
      } else if (ev.type === 'hit') {
        sound.playHit(Boolean(ev.isCounter));
        if (ev.isCounter) {
          this.spawnFloatingLabel(
            sPos.x + Phaser.Math.Between(-8, 8),
            sPos.y - 16,
            `Trúng tủ! -${ev.damage}`,
            '#ffe066',
            14,
            true,
          );
          if (!this.reduceMotion) {
            this.cameras.main.shake(65, 0.0022);
          }
        } else {
          const color = ev.isCountered ? '#b4bec8' : '#ffffff';
          this.spawnFloatingLabel(
            sPos.x + Phaser.Math.Between(-8, 8),
            sPos.y - 11,
            `-${ev.damage}`,
            color,
            11,
            false,
          );
        }
      } else if (ev.type === 'kill') {
        sound.playEnemyDeath();
        this.spawnEnemyDeathEffect(ev.enemyDefId ?? 'fast_metal', sPos.x, sPos.y);

        // Tiền xu & tiền giấy bay vòng về Chiếc Ví ở góc trên trái
        const isBill = (ev.reward ?? 0) >= 12;
        const coinImg = hasAtlas
          ? this.add
              .image(sPos.x, sPos.y, ATLAS_KEY, 'icon_coin')
              .setDisplaySize(16 * this.mapScale, 16 * this.mapScale)
              .setDepth(29)
          : undefined;
        this.flyingMoney.push({
          x: sPos.x,
          y: sPos.y,
          tx: 44,
          ty: 25,
          progress: 0,
          isBill,
          sprite: coinImg,
        });
        if (ev.reward) {
          this.spawnFloatingLabel(sPos.x, sPos.y - 18, `+${ev.reward} xu`, '#ffe066', 11, false);
        }
      } else if (ev.type === 'split') {
        const splitText =
          ev.text ?? (ev.enemyDefId === 'bk_ember' ? 'Vỡ 2 Than Vụn!' : 'Tách 2 Gián!');
        const splitColor = ev.enemyDefId === 'bk_ember' ? '#ffb36b' : '#8df59b';
        this.spawnFloatingLabel(sPos.x, sPos.y - 14, splitText, splitColor, 12, true);
      } else if (ev.type === 'disrupt') {
        this.spawnFloatingLabel(sPos.x, sPos.y - 16, ev.text ?? 'Chuột Gặm!', '#cbd5e1', 12, true);
      } else if (ev.type === 'cleanse') {
        const isStage2 = this.engine.stage.id === 'stage_2';
        this.spawnFloatingLabel(
          sPos.x,
          sPos.y - 16,
          ev.text ?? (isStage2 ? 'Giữ Lạnh!' : 'Sấy Khô!'),
          isStage2 ? '#7dd3fc' : '#ff9b71',
          12,
          true,
        );
      } else if (ev.type === 'leak') {
        sound.playLoseLife();
        if (!this.reduceMotion) {
          this.cameras.main.shake(180, 0.008);
        }
        const leakUnit = this.engine.stage.id === 'stage_2' ? 'ổ' : 'đôi';
        const leakPrefix = this.engine.stage.id === 'stage_2' ? 'Hỏng' : 'Bẩn';
        this.spawnFloatingLabel(
          sPos.x,
          sPos.y - 18,
          `${leakPrefix} -${ev.damage} ${leakUnit}!`,
          '#ff5c5c',
          14,
          true,
        );
      } else if (ev.type === 'wave_start') {
        sound.playWaveStart();
        if (ev.reward && ev.reward > 0) {
          this.spawnFloatingLabel(sPos.x + 26, sPos.y + 14, `Gọi sớm +${ev.reward} xu`, '#ffe066', 13, true);
        }
      } else if (ev.type === 'ultimate') {
        // Tuyệt chiêu bậc 4 (hình tạm: chữ lớn; Antigravity làm hiệu ứng riêng)
        const up = this.toScreen(ev.x, ev.y);
        this.spawnFloatingLabel(up.x, up.y - 30, `★ ${ev.text ?? 'Tuyệt chiêu'}!`, '#ffd166', 16, true);
      } else if (ev.type === 'element_shift') {
        const up = this.toScreen(ev.x, ev.y);
        this.spawnFloatingLabel(up.x, up.y - 34, ev.text ?? 'Đổi hành!', '#e0f2fe', 16, true);
      } else if (ev.type === 'wave_clear') {
        this.spawnFloatingLabel(
          this.scale.width * 0.5,
          this.scale.height * 0.45,
          ev.text ?? 'Sạch đợt!',
          '#a7f3d0',
          15,
          true,
        );
      } else if (ev.type === 'stage_win') {
        sound.playVictory();
        const stars = calculateStarRating(this.engine.lives, this.engine.maxLives);
        if (stars !== 0) {
          saveTdProgress(this.engine.stage.id, stars, this.engine.lives);
          // Rơi trang bị theo số sao (Claude)
          this.lastDrops = grantStageDrops(this.engine.stage.stageNumber, stars);
        }
      }
    }
  }

  private spawnDustBurst(sx: number, sy: number, color: number, count: number): void {
    for (let i = 0; i < count; i += 1) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const spd = 25 + Math.random() * 45;
      this.particles.push({
        x: sx,
        y: sy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 8,
        gravity: 50,
        color,
        life: 0.34,
        maxLife: 0.34,
        size: 4,
        shape: 'circle',
      });
    }
  }

  private spawnEnemyDeathEffect(enemyDefId: EnemyId, sx: number, sy: number): void {
    const count = this.reduceMotion ? 4 : 10;
    const hasAtlas = this.textures.exists(ATLAS_KEY);

    if (enemyDefId === 'fast_metal') {
      // Giọt mưa: bắn tóe các giọt nước xanh dương
      for (let i = 0; i < count; i += 1) {
        const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const spd = 42 + Math.random() * 62;
        this.particles.push({
          x: sx,
          y: sy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 20,
          gravity: 130,
          color: 0x38bdf8,
          life: 0.42,
          maxLife: 0.42,
          size: 4.5,
          shape: 'drop',
        });
      }
    } else if (enemyDefId === 'bk_humid') {
      // Hơi Ẩm: tan thành các đám hơi sương lam trắng bốc lên
      for (let i = 0; i < count; i += 1) {
        this.particles.push({
          x: sx + (Math.random() - 0.5) * 14,
          y: sy + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 34,
          vy: -32 - Math.random() * 38,
          gravity: -18,
          color: i % 2 === 0 ? 0x7dd3fc : 0xe0f2fe,
          life: 0.48,
          maxLife: 0.48,
          size: 5.5,
          shape: 'circle',
        });
      }
    } else if (enemyDefId === 'tank_earth') {
      // Cục bùn: vỡ vụn thành các mảnh bùn nâu đất đỏ
      for (let i = 0; i < count + 2; i += 1) {
        const ang = (Math.PI * 2 * i) / (count + 2) + Math.random() * 0.4;
        const spd = 30 + Math.random() * 55;
        this.particles.push({
          x: sx,
          y: sy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 28,
          gravity: 165,
          color: i % 2 === 0 ? 0x8f4e28 : 0x6b3719,
          life: 0.48,
          maxLife: 0.48,
          size: 5.5,
          shape: 'square',
        });
      }
    } else if (enemyDefId === 'bk_flour') {
      // Bụi Bột: bùng mây bụi bột trắng ngà phồng tan
      for (let i = 0; i < count + 3; i += 1) {
        const ang = (Math.PI * 2 * i) / (count + 3) + Math.random() * 0.4;
        const spd = 24 + Math.random() * 48;
        this.particles.push({
          x: sx,
          y: sy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 12,
          gravity: 22,
          color: i % 2 === 0 ? 0xfff8e7 : 0xe8d9bc,
          life: 0.54,
          maxLife: 0.54,
          size: 6.5,
          shape: 'circle',
        });
      }
    } else if (enemyDefId === 'split_fire' || enemyDefId === 'split_fire_mini' || enemyDefId === 'bk_fly') {
      // Gián / Ruồi: lật ngửa xoay tròn rồi biến mất
      if (hasAtlas) {
        const sz = enemyDefId === 'split_fire_mini' ? 22 : enemyDefId === 'bk_fly' ? 30 : 36;
        const ghost = this.add
          .sprite(sx, sy, ATLAS_KEY, getEnemyFrameName(enemyDefId, 0))
          .setDisplaySize(sz * this.mapScale, sz * this.mapScale)
          .setFlipY(true)
          .setDepth(25);
        this.dyingSprites.push({
          sprite: ghost,
          kind: 'flip_spin',
          vx: (Math.random() - 0.5) * 32,
          vy: -36,
          spinSpeed: 9.5,
          life: 0.46,
          maxLife: 0.46,
        });
      }
      this.spawnDustBurst(sx, sy, enemyDefId === 'bk_fly' ? 0x59c173 : 0x9c4c2a, Math.max(3, count - 4));
    } else if (enemyDefId === 'disrupt_water') {
      // Chuột: giật mình xoay đầu chạy biến mất
      if (hasAtlas) {
        const ghost = this.add
          .sprite(sx, sy, ATLAS_KEY, getEnemyFrameName('disrupt_water', 0))
          .setDisplaySize(34 * this.mapScale, 34 * this.mapScale)
          .setFlipX(true)
          .setDepth(25);
        this.dyingSprites.push({
          sprite: ghost,
          kind: 'scurry',
          vx: 110 * (Math.random() < 0.5 ? -1 : 1),
          vy: -24,
          spinSpeed: 0,
          life: 0.42,
          maxLife: 0.42,
        });
      }
      this.spawnDustBurst(sx, sy, 0xcbd5e1, Math.max(3, count - 4));
    } else if (enemyDefId === 'healer_wood' || enemyDefId === 'bk_mold') {
      // Nấm mốc / Mốc bánh: tan thành bụi bào tử xanh trắng + vụn bánh bay lên
      for (let i = 0; i < count; i += 1) {
        this.particles.push({
          x: sx + (Math.random() - 0.5) * 16,
          y: sy + (Math.random() - 0.5) * 12,
          vx: (Math.random() - 0.5) * 32,
          vy: -28 - Math.random() * 40,
          gravity: -15,
          color: i % 3 === 0 ? 0x86efac : i % 3 === 1 ? 0xd9f99d : 0xe4b872,
          life: 0.55,
          maxLife: 0.55,
          size: 4.8,
          shape: 'circle',
        });
      }
    } else if (enemyDefId === 'bk_ember' || enemyDefId === 'bk_ember_mini') {
      // Than Hồng / Than Vụn: bắn tóe tia lửa đỏ cam & mảnh than xám đen
      this.areaEffects.push({
        kind: 'snuff',
        x: sx,
        y: sy,
        radius: (enemyDefId === 'bk_ember' ? 28 : 18) * this.mapScale,
        color: 0xff6b4a,
        life: 0.28,
        maxLife: 0.28,
      });
      for (let i = 0; i < count + 2; i += 1) {
        const ang = (Math.PI * 2 * i) / (count + 2) + Math.random() * 0.4;
        const spd = 38 + Math.random() * 58;
        this.particles.push({
          x: sx,
          y: sy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 24,
          gravity: 130,
          color: i % 3 === 0 ? 0xff5a36 : i % 3 === 1 ? 0xffd43b : 0x4b3b34,
          life: 0.44,
          maxLife: 0.44,
          size: enemyDefId === 'bk_ember' ? 5 : 3.6,
          shape: 'square',
        });
      }
    } else {
      // Nắng gắt (hoặc khác): tia nắng thu nhỏ lóe tắt phụt
      this.areaEffects.push({
        kind: 'snuff',
        x: sx,
        y: sy,
        radius: 26 * this.mapScale,
        color: 0xffc83d,
        life: 0.3,
        maxLife: 0.3,
      });
      this.spawnDustBurst(sx, sy, 0xff9f38, Math.max(3, count - 3));
    }
  }

  private spawnVictoryFirework(): void {
    const fx = this.mapOffsetX + (45 + Math.random() * (LOGICAL_WIDTH - 90)) * this.mapScale;
    const fy = this.mapOffsetY + (60 + Math.random() * (this.getLogicalHeight() - 160)) * this.mapScale;
    const palette = [0xffe066, 0xff6b4a, 0x38bdf8, 0x59c173, 0xf472b6];
    const col = palette[Math.floor(Math.random() * palette.length)]!;
    for (let i = 0; i < 14; i += 1) {
      const ang = (Math.PI * 2 * i) / 14 + Math.random() * 0.2;
      const spd = 48 + Math.random() * 72;
      this.particles.push({
        x: fx,
        y: fy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        gravity: 90,
        color: col,
        life: 0.72,
        maxLife: 0.72,
        size: 4.5,
        shape: 'circle',
      });
    }
  }

  private spawnFloatingLabel(
    x: number,
    y: number,
    text: string,
    color: string,
    fontSizePx = 12,
    popScale = false,
  ): void {
    const label = this.add
      .text(x, y, text, {
        fontSize: `${fontSizePx}px`,
        fontStyle: 'bold',
        color,
        stroke: '#2b1a12',
        strokeThickness: popScale ? 4 : 3,
        fontFamily: "'Be Vietnam Pro', system-ui, -apple-system, sans-serif",
      })
      .setOrigin(0.5)
      .setDepth(32);

    this.floatingLabels.push({
      el: label,
      vy: popScale ? -34 : -26,
      life: popScale ? 0.88 : 0.72,
      maxLife: popScale ? 0.88 : 0.72,
      popScale,
    });
  }

  private updateVisualEffects(dt: number): void {
    // 1. Đạn bay (dép tông xoay vèo, gói hút ẩm cầu vồng, tia sương, luồng nhiệt)
    this.projectiles = this.projectiles.filter((p) => {
      p.progress += dt * p.speed;
      if (p.progress >= 1) {
        if (p.sprite) p.sprite.destroy();
        if (p.kind === 'fire_tower') {
          this.spawnDustBurst(p.tx, p.ty, 0xf5d68a, this.reduceMotion ? 3 : 7);
        }
        return false;
      }
      if (p.sprite) {
        const cx = p.x + (p.tx - p.x) * p.progress;
        const cy = p.y + (p.ty - p.y) * p.progress - Math.sin(p.progress * Math.PI) * p.arcHeight;
        p.sprite.setPosition(cx, cy);
        p.sprite.rotation += dt * (p.kind === 'wood_tower' ? 18 : 9);
      }
      return true;
    });

    // 2. Vùng hiệu ứng (đạp bốt, sương lạnh, hạt hút ẩm, hơi ấm, tắt nắng)
    this.areaEffects = this.areaEffects.filter((ef) => {
      ef.life -= dt;
      return ef.life > 0;
    });

    // 3. Hạt hiệu ứng & pháo hoa
    this.particles = this.particles.filter((pt) => {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += pt.gravity * dt;
      pt.life -= dt;
      return pt.life > 0;
    });

    // 4. Sprite quái chết (Gián lật ngửa, Chuột chạy biến)
    this.dyingSprites = this.dyingSprites.filter((ds) => {
      ds.life -= dt;
      if (ds.life <= 0) {
        ds.sprite.destroy();
        return false;
      }
      const ratio = ds.life / ds.maxLife;
      ds.sprite.x += ds.vx * dt;
      ds.sprite.y += ds.vy * dt;
      if (ds.kind === 'flip_spin') {
        ds.vy += 120 * dt;
        ds.sprite.rotation += ds.spinSpeed * dt;
        ds.sprite.setScale(ds.sprite.scaleX * (0.97), ds.sprite.scaleY * (0.97));
      }
      ds.sprite.setAlpha(Math.max(0, ratio));
      return true;
    });

    // 5. Tiền xu bay về Chiếc Ví ở góc trên trái
    this.flyingMoney = this.flyingMoney.filter((st) => {
      st.progress += dt * 2.5;
      if (st.progress >= 1) {
        if (st.sprite) st.sprite.destroy();
        this.walletBounceTimer = 0.2;
        return false;
      }
      const t = st.progress;
      const cx = st.x + (st.tx - st.x) * t;
      const cy = st.y + (st.ty - st.y) * t - Math.sin(t * Math.PI) * 34;
      if (st.sprite) {
        st.sprite.setPosition(cx, cy);
        st.sprite.rotation += dt * 6;
      }
      return true;
    });

    if (this.walletBounceTimer > 0) {
      this.walletBounceTimer = Math.max(0, this.walletBounceTimer - dt);
    }

    // 6. Chữ sát thương & "Trúng tủ!"
    this.floatingLabels = this.floatingLabels.filter((fl) => {
      fl.el.y += fl.vy * dt;
      fl.life -= dt;
      const ratio = Math.max(0, fl.life / fl.maxLife);
      fl.el.setAlpha(Math.min(1, ratio * 2.2));
      if (fl.popScale) {
        const age = 1 - ratio;
        const sc = age < 0.2 ? 0.75 + (age / 0.2) * 0.45 : Math.max(1, 1.2 - (age - 0.2) * 0.25);
        fl.el.setScale(sc);
      }
      if (fl.life <= 0) {
        fl.el.destroy();
        return false;
      }
      return true;
    });
  }

  private drawPadHighlightsAndOverlays(): void {
    const pg = this.padGraphics;
    pg.clear();

    const og = this.overlayGraphics;
    og.clear();

    // 1. Khung nhấn ô đặt món & tầm bắn của món đang chọn
    for (const pad of this.engine.stage.pads) {
      const sp = this.toScreen(pad.x, pad.y);
      const r = 19 * this.mapScale;
      const tower = this.engine.getTowerAtPad(pad.id);
      const isSelected = this.selectedPadId === pad.id;

      if (!tower) {
        const pulse = this.reduceMotion ? 0 : Math.sin(this.animTimeSec * 3.2) * 1.4;
        pg.lineStyle(isSelected ? 3 : 2, isSelected ? 0x38bdf8 : 0xffe4a3, isSelected ? 1 : 0.78);
        pg.strokeCircle(sp.x, sp.y, r + pulse);

        // Dấu + nhỏ rõ nét giữa thảm cói trống để người chơi dễ chạm
        pg.lineStyle(2.2, 0xfff3d1, 0.88);
        pg.beginPath();
        pg.moveTo(sp.x - 5.5 * this.mapScale, sp.y);
        pg.lineTo(sp.x + 5.5 * this.mapScale, sp.y);
        pg.moveTo(sp.x, sp.y - 5.5 * this.mapScale);
        pg.lineTo(sp.x, sp.y + 5.5 * this.mapScale);
        pg.strokePath();
      } else {
        this.drawTowerOverlays(pg, og, tower, sp.x, sp.y, isSelected);
      }
    }

    // 2. Thanh máu & vòng bảo vệ trên đầu quái
    for (const enemy of this.engine.enemies) {
      this.drawEnemyOverlay(og, enemy);
    }
  }

  private drawTowerOverlays(
    pg: Phaser.GameObjects.Graphics,
    og: Phaser.GameObjects.Graphics,
    tower: ActiveTower,
    sx: number,
    sy: number,
    isSelected: boolean,
  ): void {
    const elInfo = ELEMENT_INFO[tower.element];
    const stats = getTowerTierStats(tower.defId, tower.tier, tower.branch);
    const r = 19 * this.mapScale;

    if (isSelected) {
      const rangePx = stats.range * tower.buffRangeMultiplier * this.mapScale;
      pg.fillStyle(elInfo.colorInt, 0.14);
      pg.fillCircle(sx, sy, rangePx);
      pg.lineStyle(2, elInfo.colorInt, 0.85);
      pg.strokeCircle(sx, sy, rangePx);
    }

    // Vòng màu hành mảnh dưới chân món giúp nhận ra hành ngay lập tức
    pg.lineStyle(2.2, elInfo.colorInt, 0.92);
    pg.strokeCircle(sx, sy + 2 * this.mapScale, r);

    // Vòng hào quang ấm nếu đang được Máy Sấy Giày sấy khỏe
    if (tower.buffDamageMultiplier > 1.01) {
      const auraPulse = this.reduceMotion ? 0 : Math.sin(this.animTimeSec * 4) * 1.5;
      pg.lineStyle(1.8, 0xffa94d, 0.75);
      pg.strokeCircle(sx, sy + 2 * this.mapScale, r + 3.2 * this.mapScale + auraPulse);
    }

    // Chấm sao vàng chỉ bậc (1..3) ở mép dưới thảm
    for (let i = 0; i < tower.tier; i += 1) {
      const dotX = sx + (i - (tower.tier - 1) * 0.5) * 7 * this.mapScale;
      const dotY = sy + r + 1 * this.mapScale;
      og.fillStyle(0x2b1a12, 1);
      og.fillCircle(dotX, dotY, 3.6 * this.mapScale);
      og.fillStyle(0xffd43b, 1);
      og.fillCircle(dotX, dotY, 2.4 * this.mapScale);
    }

    // Vòng báo hiệu đang bị Chuột gặm đứng im
    if (tower.disruptedRemaining > 0) {
      og.lineStyle(2.5, 0xcbd5e1, 0.95);
      og.strokeCircle(sx, sy, r + 3);
    }
  }

  private drawEnemyOverlay(og: Phaser.GameObjects.Graphics, enemy: ActiveEnemy): void {
    const def = ENEMY_DEFINITIONS[enemy.defId];
    const sp = this.toScreen(enemy.x, enemy.y);
    const barW = Math.max(22, def.radius * 2.1) * this.mapScale;
    const barH = 4.5 * this.mapScale;
    const barX = sp.x - barW * 0.5;
    const barY = sp.y - def.radius * 1.55 * this.mapScale - 5 * this.mapScale;
    const hpRatio = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));

    og.fillStyle(0x2b1a12, 0.9);
    og.fillRoundedRect(barX - 1, barY - 1, barW + 2, barH + 2, 2);
    og.fillStyle(hpRatio > 0.45 ? 0x59c173 : hpRatio > 0.22 ? 0xfbbf24 : 0xef4444, 1);
    og.fillRect(barX, barY, barW * hpRatio, barH);
  }

  private syncSynergyLinksAndDraw(): void {
    const sg = this.synergyGraphics;
    sg.clear();

    const links = this.getActiveSynergyLinks();
    const nextKeys = new Set<string>();

    for (const link of links) {
      nextKeys.add(link.key);
      const giverEl = ELEMENT_INFO[link.giver.element];

      // Khi mới nối cặp tương sinh, bật chữ nhỏ "+15%" ngay giữa đường nối
      if (!this.activeSynergyLinks.has(link.key)) {
        this.spawnFloatingLabel(
          link.midScreen.x,
          link.midScreen.y - 6 * this.mapScale,
          '+15%',
          giverEl.colorHex,
          12,
          true,
        );
      }

      const p1 = this.toScreen(link.giver.x, link.giver.y);
      const p2 = this.toScreen(link.receiver.x, link.receiver.y);
      const pulse = this.reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(this.animTimeSec * 4.2);

      // Vầng sáng mềm bên ngoài (màu hành của món cho)
      sg.lineStyle(6.5 * this.mapScale, giverEl.colorInt, 0.22 + pulse * 0.12);
      sg.lineBetween(p1.x, p1.y, p2.x, p2.y);

      // Đường sáng mảnh sắc nét bên trong
      sg.lineStyle(2.2 * this.mapScale, giverEl.colorInt, 0.92);
      sg.lineBetween(p1.x, p1.y, p2.x, p2.y);

      // Lõi trắng nhẹ tạo cảm giác phát sáng
      sg.lineStyle(1 * this.mapScale, 0xfffdf2, 0.65);
      sg.lineBetween(p1.x, p1.y, p2.x, p2.y);

      // Hạt sáng trôi từ món cho -> món nhận + mũi tên nhỏ giữa đường gợi hướng & gợi chạm
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const mx = (p1.x + p2.x) * 0.5;
      const my = (p1.y + p2.y) * 0.5;

      // Dấu mũi tên nhỏ chỉ chiều sinh ở điểm giữa
      const arrowSize = 4.6 * this.mapScale;
      const px = -uy;
      const py = ux;
      sg.fillStyle(0x2b1a12, 0.72);
      sg.fillCircle(mx, my, 5.6 * this.mapScale);
      sg.fillStyle(giverEl.colorInt, 0.98);
      sg.fillTriangle(
        mx + ux * arrowSize,
        my + uy * arrowSize,
        mx - ux * arrowSize * 0.7 + px * arrowSize * 0.75,
        my - uy * arrowSize * 0.7 + py * arrowSize * 0.75,
        mx - ux * arrowSize * 0.7 - px * arrowSize * 0.75,
        my - uy * arrowSize * 0.7 - py * arrowSize * 0.75,
      );

      if (!this.reduceMotion) {
        for (let k = 0; k < 2; k += 1) {
          const t = (this.animTimeSec * 0.65 + k * 0.5) % 1;
          const bx = p1.x + dx * t;
          const by = p1.y + dy * t;
          sg.fillStyle(0xffffff, 0.85 * Math.sin(t * Math.PI));
          sg.fillCircle(bx, by, 2.6 * this.mapScale);
        }
      }
    }

    this.activeSynergyLinks = nextKeys;
  }

  private showSynergyTooltip(giver: ActiveTower, receiver: ActiveTower): void {
    if (!this.synergyTooltipRoot) return;
    const desc = getSynergyExplanation(giver.defId, giver.element, receiver.defId, receiver.element);
    const gEl = ELEMENT_INFO[giver.element];
    const rEl = ELEMENT_INFO[receiver.element];
    const gIcon = getAtlasFrameDataUrl(this, `el_${giver.element}`);
    const rIcon = getAtlasFrameDataUrl(this, `el_${receiver.element}`);

    this.synergyTooltipRoot.innerHTML = `
      <div class="td-synergy-tooltip td-shoebox-panel" data-testid="td-synergy-tooltip" style="border-color:${gEl.colorHex}">
        <div class="td-synergy-tooltip-body">
          <div class="td-synergy-tooltip-head">
            <span class="td-el-badge" style="background:${gEl.colorHex}">
              ${gIcon ? `<img class="td-badge-el-icon" src="${gIcon}" alt="" />` : ''}
              ${gEl.label}
            </span>
            <span>→</span>
            <span class="td-el-badge" style="background:${rEl.colorHex}">
              ${rIcon ? `<img class="td-badge-el-icon" src="${rIcon}" alt="" />` : ''}
              ${rEl.label}
            </span>
            <strong>${desc.title}</strong>
          </div>
          <div class="td-synergy-tooltip-desc">${desc.explanation}</div>
        </div>
        <button class="td-close-btn" id="btn-close-synergy" aria-label="Đóng chú thích tương sinh">✕</button>
      </div>
    `;

    this.synergyTooltipRoot.querySelector('#btn-close-synergy')?.addEventListener('click', () => {
      this.closeSynergyTooltip();
    });
  }

  private closeSynergyTooltip(): void {
    if (this.synergyTooltipRoot) {
      this.synergyTooltipRoot.innerHTML = '';
    }
  }

  private drawFxAndWeather(dt: number): void {
    const fx = this.fxGraphics;
    fx.clear();

    // Đạn không dùng sprite (sương xịt, hơi ấm, gió quạt, vệt vỉ đập, hơi lò, hơi tủ mát) + vệt màu hành
    for (const p of this.projectiles) {
      const cx = p.x + (p.tx - p.x) * p.progress;
      const cy = p.y + (p.ty - p.y) * p.progress - Math.sin(p.progress * Math.PI) * p.arcHeight;
      if (p.kind === 'wood_tower') {
        fx.lineStyle(2.5, p.color, 0.45);
        fx.lineBetween(p.x, p.y, cx, cy);
      } else if (p.kind === 'water_tower' || p.kind === 'bk_fridge') {
        fx.lineStyle(4 * this.mapScale, p.color, 0.55);
        fx.lineBetween(p.x, p.y, cx, cy);
        fx.fillStyle(0xc8f1ff, 0.8);
        fx.fillCircle(cx, cy, 6 * this.mapScale);
      } else if (p.kind === 'earth_tower' || p.kind === 'bk_oven') {
        fx.lineStyle(3.2 * this.mapScale, p.color, 0.65);
        fx.lineBetween(p.x, p.y, cx, cy);
        fx.fillStyle(0xffd8a8, 0.85);
        fx.fillCircle(cx, cy, 5.5 * this.mapScale);
      } else if (p.kind === 'bk_swatter') {
        fx.lineStyle(2.6 * this.mapScale, p.color, 0.85);
        fx.lineBetween(p.x, p.y, cx, cy);
        fx.fillStyle(0xffffff, 0.9);
        fx.fillCircle(cx, cy, 4 * this.mapScale);
      } else if (p.kind === 'bk_jar') {
        fx.fillStyle(0x8c5628, 0.95);
        fx.fillCircle(cx, cy, 6.2 * this.mapScale);
        fx.lineStyle(1.8, 0x2b1a12, 1);
        fx.strokeCircle(cx, cy, 6.2 * this.mapScale);
      } else if (p.kind === 'bk_fan') {
        fx.lineStyle(3.5 * this.mapScale, p.color, 0.6);
        fx.lineBetween(p.x, p.y, cx, cy);
        fx.fillStyle(0xc4f7ce, 0.8);
        fx.fillCircle(cx, cy, 5.5 * this.mapScale);
      }
    }

    // Hiệu ứng diện rộng theo món
    for (const ef of this.areaEffects) {
      const t = 1 - ef.life / ef.maxLife;
      const alpha = Math.max(0, ef.life / ef.maxLife);
      if (ef.kind === 'stomp') {
        fx.lineStyle(3.5 * this.mapScale, ef.color, alpha);
        fx.strokeCircle(ef.x, ef.y, ef.radius * (0.35 + t * 0.75));
      } else if (ef.kind === 'swat') {
        fx.lineStyle(3 * this.mapScale, ef.color, alpha);
        const r = ef.radius * (0.4 + t * 0.6);
        fx.strokeCircle(ef.x, ef.y, r);
        fx.lineBetween(ef.x - r * 0.7, ef.y - r * 0.7, ef.x + r * 0.7, ef.y + r * 0.7);
        fx.lineBetween(ef.x + r * 0.7, ef.y - r * 0.7, ef.x - r * 0.7, ef.y + r * 0.7);
      } else if (ef.kind === 'mist' || ef.kind === 'frost') {
        fx.fillStyle(ef.color, alpha * 0.25);
        fx.fillCircle(ef.x, ef.y, ef.radius * (0.55 + t * 0.45));
        fx.lineStyle(2, 0xc8f1ff, alpha * 0.75);
        fx.strokeCircle(ef.x, ef.y, ef.radius * (0.55 + t * 0.45));
      } else if (ef.kind === 'wind') {
        fx.fillStyle(ef.color, alpha * 0.18);
        fx.fillCircle(ef.x, ef.y, ef.radius * (0.5 + t * 0.5));
        fx.lineStyle(2.4, 0xbef8c8, alpha * 0.8);
        fx.strokeCircle(ef.x, ef.y, ef.radius * (0.45 + t * 0.55));
      } else if (ef.kind === 'oven') {
        fx.fillStyle(ef.color, alpha * 0.24);
        fx.fillCircle(ef.x, ef.y, ef.radius * (0.42 + t * 0.58));
        fx.lineStyle(2.6, 0xffd166, alpha * 0.85);
        fx.strokeCircle(ef.x, ef.y, ef.radius * (0.42 + t * 0.58));
      } else if (ef.kind === 'silica') {
        fx.fillStyle(ef.color, alpha * 0.22);
        fx.fillCircle(ef.x, ef.y, ef.radius * (0.4 + t * 0.6));
        fx.lineStyle(2.5, 0xffe4a3, alpha * 0.85);
        fx.strokeCircle(ef.x, ef.y, ef.radius * (0.4 + t * 0.6));
      } else if (ef.kind === 'heat') {
        fx.lineStyle(2.5, ef.color, alpha * 0.8);
        fx.strokeCircle(ef.x, ef.y, ef.radius * (0.4 + t * 0.7));
      } else if (ef.kind === 'snuff') {
        fx.fillStyle(ef.color, alpha * 0.7);
        fx.fillCircle(ef.x, ef.y, ef.radius * (1 - t * 0.85));
      }
    }

    // Hạt nổ / giọt nước / mảnh bùn / pháo sáng
    for (const pt of this.particles) {
      const alpha = Math.max(0, pt.life / pt.maxLife);
      fx.fillStyle(pt.color, alpha);
      if (pt.shape === 'square') {
        fx.fillRect(pt.x - pt.size * 0.5, pt.y - pt.size * 0.5, pt.size, pt.size);
      } else {
        fx.fillCircle(pt.x, pt.y, pt.size * 0.55);
      }
    }

    // Tiền giấy bay về ví (khi không dùng sprite xu)
    for (const fm of this.flyingMoney) {
      if (fm.isBill) {
        const t = fm.progress;
        const cx = fm.x + (fm.tx - fm.x) * t;
        const cy = fm.y + (fm.ty - fm.y) * t - Math.sin(t * Math.PI) * 34;
        fx.fillStyle(0x68ba76, 0.95);
        fx.fillRoundedRect(cx - 7, cy - 4, 14, 8, 2);
        fx.lineStyle(1.4, 0x2b1a12, 1);
        fx.strokeRoundedRect(cx - 7, cy - 4, 14, 8, 2);
      }
    }

    // Không khí tiệm ngày mưa Đà Lạt (mưa rơi ngoài cửa, vũng nước lăn tăn, đèn tiệm ấm)
    const wg = this.weatherGraphics;
    wg.clear();
    const isStage2 = this.engine.stage.id === 'stage_2';

    // Đèn vàng ấm trên kệ giày / kệ bánh cuối tiệm (nhẹ nhàng, không gây rối mắt kể cả khi giảm hiệu ứng)
    const lampPos = isStage2 ? this.toScreen(308, 456) : this.toScreen(314, 442);
    const glowPulse = this.reduceMotion ? 1 : 0.88 + Math.sin(this.animTimeSec * 2.2) * 0.12;
    wg.fillStyle(0xffe082, 0.11 * glowPulse);
    wg.fillCircle(lampPos.x, lampPos.y, 44 * this.mapScale);
    wg.fillStyle(0xffd452, 0.08 * glowPulse);
    wg.fillCircle(lampPos.x, lampPos.y, 68 * this.mapScale);

    if (!this.reduceMotion) {
      // Mưa rơi xiên ngoài vỉa hè (Màn 1: góc trên trái; Màn 2: cửa giữa trên)
      wg.lineStyle(1.4, 0xc8ebff, 0.58);
      for (const drop of this.rainDrops) {
        drop.lx -= drop.speed * 0.25 * dt;
        drop.ly += drop.speed * dt;
        if (isStage2) {
          if (drop.ly > 42 || drop.lx < 138) {
            drop.lx = 144 + Math.random() * 82;
            drop.ly = -4;
          }
        } else if (drop.ly > 64 || drop.lx < 0) {
          drop.lx = 8 + Math.random() * 102;
          drop.ly = -4;
        }
        const p1 = this.toScreen(drop.lx, drop.ly);
        const p2 = this.toScreen(drop.lx - drop.len * 0.25, drop.ly + drop.len);
        wg.lineBetween(p1.x, p1.y, p2.x, p2.y);
      }

      // Vũng nước ngoài cửa kính lăn tăn gợn sóng tròn
      for (const rp of this.ripples) {
        rp.life += dt;
        if (rp.life >= rp.maxLife) {
          rp.life = 0;
          if (isStage2) {
            rp.lx = 152 + Math.random() * 56;
            rp.ly = 10 + Math.random() * 18;
          } else {
            rp.lx = 16 + Math.random() * 58;
            rp.ly = 12 + Math.random() * 38;
          }
        }
        const t = rp.life / rp.maxLife;
        const p = this.toScreen(rp.lx, rp.ly);
        wg.lineStyle(1.3, 0xd9f3ff, (1 - t) * 0.65);
        wg.strokeEllipse(p.x, p.y, rp.maxR * 2 * t * this.mapScale, rp.maxR * 1.15 * t * this.mapScale);
      }
    }
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

    const isStage2 = this.engine.stage.id === 'stage_2';
    const walletUrl = getAtlasFrameDataUrl(this, 'icon_wallet');
    const lifeIconUrl = getAtlasFrameDataUrl(this, isStage2 ? 'icon_bread_life' : 'icon_shoe_life');
    const lifeTitle = isStage2 ? 'Số ổ bánh còn lành trên kệ' : 'Số đôi giày lành còn lại trên kệ';
    const lifeFallback = isStage2 ? '🥖' : '👟';
    const lifeAlt = isStage2 ? 'Bánh' : 'Giày';

    hud.innerHTML = `
      <div class="td-top-bar">
        <div class="td-stat-group">
          <div class="td-stat-chip td-wallet-chip" id="td-wallet-chip" title="Chiếc ví đựng tiền xu đặt món">
            ${walletUrl ? `<img class="td-hud-icon" src="${walletUrl}" alt="Ví" />` : `<span class="td-icon">👛</span>`}
            <span id="td-essence-val" data-testid="td-essence-val">${this.engine.essence}</span>
          </div>
          <div class="td-stat-chip" title="${lifeTitle}">
            ${lifeIconUrl ? `<img class="td-hud-icon" src="${lifeIconUrl}" alt="${lifeAlt}" />` : `<span class="td-icon">${lifeFallback}</span>`}
            <span id="td-lives-val" data-testid="td-lives-val">${this.engine.lives}/${this.engine.maxLives}</span>
          </div>
          <div class="td-stat-chip td-wave-chip">
            <span>Đợt</span>
            <strong id="td-wave-val" data-testid="td-wave-val">0/${this.engine.getTotalWaves()}</strong>
          </div>
        </div>
        <div class="td-ctrl-group">
          <button id="btn-speed-toggle" data-testid="btn-speed-toggle" class="td-ctrl-btn" title="Đổi tốc độ x1 / x2">x1</button>
          <button id="btn-reduce-motion" data-testid="btn-reduce-motion" class="td-ctrl-btn" title="Giảm hiệu ứng cho máy yếu">✨</button>
          ${showBotBtn ? `<button id="btn-bot-toggle" data-testid="btn-bot-toggle" class="td-ctrl-btn" title="Bật/Tắt Tự động đặt món">Bot</button>` : ''}
          <button id="btn-pause-toggle" data-testid="btn-pause-toggle" class="td-ctrl-btn" title="Tạm dừng">⏸</button>
        </div>
      </div>

      <div class="td-bottom-bar">
        <div class="td-upcoming-box" id="td-upcoming-box" data-testid="td-upcoming-box"></div>
        <button id="btn-call-wave" data-testid="btn-call-wave" class="td-call-wave-btn">
          Gọi Đợt 1
        </button>
      </div>
    `;

    container.appendChild(hud);
    this.hudRoot = hud;

    const synergyHolder = document.createElement('div');
    synergyHolder.className = 'td-synergy-holder';
    synergyHolder.id = 'td-synergy-holder';
    container.appendChild(synergyHolder);
    this.synergyTooltipRoot = synergyHolder;

    const modalHolder = document.createElement('div');
    modalHolder.className = 'td-modal-holder';
    modalHolder.id = 'td-modal-holder';
    container.appendChild(modalHolder);
    this.modalRoot = modalHolder;

    hud.querySelector<HTMLButtonElement>('#btn-speed-toggle')?.addEventListener('click', () => {
      sound.playUiClick();
      this.speedMultiplier = this.speedMultiplier === 1 ? 2 : 1;
      this.refreshHud();
    });

    hud.querySelector<HTMLButtonElement>('#btn-reduce-motion')?.addEventListener('click', () => {
      sound.playUiClick();
      this.toggleReduceMotion();
    });

    hud.querySelector<HTMLButtonElement>('#btn-bot-toggle')?.addEventListener('click', () => {
      sound.playUiClick();
      this.autoBotEnabled = !this.autoBotEnabled;
      this.refreshHud();
    });

    hud.querySelector<HTMLButtonElement>('#btn-pause-toggle')?.addEventListener('click', () => {
      sound.playUiClick();
      this.paused = !this.paused;
      this.refreshHud();
    });

    hud.querySelector<HTMLButtonElement>('#btn-call-wave')?.addEventListener('click', () => {
      sound.playUiClick();
      const isEarly = this.engine.currentWaveIndex >= 0;
      const res = this.engine.startNextWave(isEarly);
      if (res.started) {
        this.processCombatEvents(res.events);
        this.refreshHud();
      }
    });

    this.refreshHud();
  }

  private refreshHud(): void {
    if (!this.hudRoot) return;

    const essenceEl = this.hudRoot.querySelector('#td-essence-val');
    if (essenceEl) essenceEl.textContent = String(this.engine.essence);

    const walletChip = this.hudRoot.querySelector('#td-wallet-chip');
    if (walletChip) {
      walletChip.classList.toggle('wallet-pop', this.walletBounceTimer > 0 && !this.reduceMotion);
    }

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

    const rmBtn = this.hudRoot.querySelector<HTMLButtonElement>('#btn-reduce-motion');
    if (rmBtn) {
      rmBtn.textContent = this.reduceMotion ? 'Nhẹ' : 'FX';
      rmBtn.setAttribute('aria-pressed', this.reduceMotion ? 'true' : 'false');
      rmBtn.classList.toggle('active', this.reduceMotion);
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

    // Chỉ vẽ lại thanh báo đợt sắp tới khi đổi đợt để tránh DOM nhấp nháy
    const upcoming = this.engine.getUpcomingWave();
    const upcomingKey = upcoming ? upcoming.waveNumber : -1;
    if (upcomingKey !== this.lastUpcomingWaveNum) {
      this.lastUpcomingWaveNum = upcomingKey;
      const upcomingBox = this.hudRoot.querySelector('#td-upcoming-box');
      if (upcomingBox) {
        if (upcoming) {
          const uniqueEnemies = Array.from(new Set(upcoming.groups.map((g) => g.enemyId)));
          const enemyPreviews = uniqueEnemies
            .map((eid) => {
              const edef = ENEMY_DEFINITIONS[eid];
              const elInfo = ELEMENT_INFO[edef.element];
              const elIconUrl = getAtlasFrameDataUrl(this, `el_${edef.element}`);
              const enemyUrl = getAtlasFrameDataUrl(this, getEnemyFrameName(eid, 0));
              return `
                <span class="td-enemy-preview" style="border-color:${elInfo.colorHex}" title="${edef.name} — Hành ${elInfo.label}">
                  ${enemyUrl ? `<img class="td-mini-enemy" src="${enemyUrl}" alt="${edef.name}" />` : ''}
                  ${elIconUrl ? `<img class="td-mini-el" src="${elIconUrl}" alt="${elInfo.label}" />` : ''}
                  <span>${elInfo.label}</span>
                </span>
              `;
            })
            .join('');
          upcomingBox.innerHTML = `
            <div class="td-up-title">Sắp vào • ${upcoming.title}</div>
            <div class="td-up-elements">${enemyPreviews}</div>
          `;
        } else {
          upcomingBox.innerHTML = `<div class="td-up-title">Đợt cuối đang kéo vào tiệm!</div>`;
        }
      }
    }

    const callBtn = this.hudRoot.querySelector<HTMLButtonElement>('#btn-call-wave');
    if (callBtn) {
      const canCall = this.engine.canStartNextWave();
      callBtn.disabled = !canCall;
      if (!upcoming) {
        callBtn.textContent = 'Đợt Cuối';
      } else if (this.engine.currentWaveIndex === -1) {
        callBtn.textContent = 'Mở Đợt 1';
      } else if (this.engine.waveInProgress) {
        callBtn.textContent = `Gọi Đợt ${upcoming.waveNumber} (+${upcoming.earlyBonusMax} xu)`;
      } else {
        const sec = Math.ceil(this.engine.nextWaveCountdownSec);
        callBtn.textContent =
          sec > 0 ? `Gọi Đợt ${upcoming.waveNumber} (${sec}s)` : `Gọi Đợt ${upcoming.waveNumber}`;
      }
    }
  }

  private renderPadModal(padId: string): void {
    if (!this.modalRoot) return;
    const existingTower = this.engine.getTowerAtPad(padId);
    const coinUrl = getAtlasFrameDataUrl(this, 'icon_coin');
    const coinImgHtml = coinUrl ? `<img class="td-inline-coin" src="${coinUrl}" alt="xu" />` : '🪙';

    if (!existingTower) {
      const cardsHtml = getStageTowerList(this.engine.stage).map((def) => {
        const elInfo = ELEMENT_INFO[def.element];
        const canAfford = this.engine.essence >= def.tier1.cost;
        const spriteUrl = getAtlasFrameDataUrl(this, getTowerFrameName(def.id, 1, undefined, 0));
        const elIconUrl = getAtlasFrameDataUrl(this, `el_${def.element}`);
        return `
          <button
            class="td-build-option ${canAfford ? '' : 'disabled'}"
            data-tower-id="${def.id}"
            data-testid="build-${def.id}"
          >
            ${spriteUrl ? `<img class="td-opt-sprite" src="${spriteUrl}" alt="${def.tier1.name}" />` : ''}
            <div class="td-opt-body">
              <div class="td-opt-head">
                <span class="td-el-badge" style="background:${elInfo.colorHex}">
                  ${elIconUrl ? `<img class="td-badge-el-icon" src="${elIconUrl}" alt="" />` : ''}
                  ${elInfo.label}
                </span>
                <strong>${def.tier1.name}</strong>
                <span class="td-price-tag">${def.tier1.cost}${coinImgHtml}</span>
              </div>
              <div class="td-opt-role">${def.tier1.description}</div>
            </div>
          </button>
        `;
      }).join('');

      this.modalRoot.innerHTML = `
        <div class="td-sheet td-shoebox-panel" data-testid="td-build-sheet">
          <div class="td-sheet-head">
            <div class="td-sheet-title-wrap">
              <span class="td-tag-hole"></span>
              <strong>Đặt món giữ tiệm • Ô #${padId.replace('pad_', '')}</strong>
            </div>
            <button class="td-close-btn" id="btn-close-sheet" aria-label="Đóng">✕</button>
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
      const def = TOWER_DEFINITIONS[existingTower.defId];
      const curStats = getTowerTierStats(
        existingTower.defId,
        existingTower.tier,
        existingTower.branch,
      );
      const elInfo = ELEMENT_INFO[existingTower.element];
      const elIconUrl = getAtlasFrameDataUrl(this, `el_${existingTower.element}`);
      const curSpriteUrl = getAtlasFrameDataUrl(
        this,
        getTowerFrameName(existingTower.defId, existingTower.tier, existingTower.branch, 0),
      );
      const refund = calculateSellRefund(existingTower.totalInvested);

      let upgradeSectionHtml = '';
      if (existingTower.tier === 1) {
        const t2 = def.tier2;
        const canAfford = this.engine.essence >= t2.cost;
        const t2Sprite = getAtlasFrameDataUrl(this, getTowerFrameName(def.id, 2, undefined, 0));
        upgradeSectionHtml = `
          <button
            class="td-upgrade-btn ${canAfford ? '' : 'disabled'}"
            id="btn-upgrade-t2"
            data-testid="btn-upgrade-t2"
          >
            ${t2Sprite ? `<img class="td-opt-sprite" src="${t2Sprite}" alt="${t2.name}" />` : ''}
            <div class="td-opt-body">
              <div class="td-opt-head">
                <strong>Lên Bậc 2: ${t2.name}</strong>
                <span class="td-price-tag">${t2.cost}${coinImgHtml}</span>
              </div>
              <div class="td-opt-role">${t2.description}</div>
            </div>
          </button>
        `;
      } else if (existingTower.tier === 2) {
        const t3A = def.tier3A;
        const t3B = def.tier3B;
        const canA = this.engine.essence >= t3A.cost;
        const canB = this.engine.essence >= t3B.cost;
        const s3A = getAtlasFrameDataUrl(this, getTowerFrameName(def.id, 3, 'A', 0));
        const s3B = getAtlasFrameDataUrl(this, getTowerFrameName(def.id, 3, 'B', 0));
        upgradeSectionHtml = `
          <div class="td-branch-grid">
            <button
              class="td-upgrade-btn td-branch-card ${canA ? '' : 'disabled'}"
              data-branch="A"
              data-testid="btn-upgrade-3A"
            >
              <div class="td-branch-top">
                ${s3A ? `<img class="td-branch-sprite" src="${s3A}" alt="${t3A.name}" />` : ''}
                <span class="td-price-tag">${t3A.cost}${coinImgHtml}</span>
              </div>
              <strong class="td-branch-name">Nhánh A: ${t3A.name}</strong>
              <div class="td-opt-role">${t3A.description}</div>
            </button>
            <button
              class="td-upgrade-btn td-branch-card ${canB ? '' : 'disabled'}"
              data-branch="B"
              data-testid="btn-upgrade-3B"
            >
              <div class="td-branch-top">
                ${s3B ? `<img class="td-branch-sprite" src="${s3B}" alt="${t3B.name}" />` : ''}
                <span class="td-price-tag">${t3B.cost}${coinImgHtml}</span>
              </div>
              <strong class="td-branch-name">Nhánh B: ${t3B.name}</strong>
              <div class="td-opt-role">${t3B.description}</div>
            </button>
          </div>
        `;
      } else {
        // Bậc 4 tuyệt chiêu (Claude) — mở từ Màn 2
        const ultName = ULTIMATE_NAMES[existingTower.defId];
        const ultText = ULTIMATE_ROLE_TEXT[def.role];
        if (this.engine.stage.stageNumber < ULTIMATE_MIN_STAGE) {
          upgradeSectionHtml = `<div class="td-max-tier">★ Đã đạt Bậc 3 (Nhánh ${existingTower.branch}). Bậc 4 tuyệt chiêu mở từ Màn 2.</div>`;
        } else if (!existingTower.hasUltimate) {
          const canU = this.engine.essence >= ULTIMATE_COST;
          upgradeSectionHtml = `
            <button class="td-upgrade-btn ${canU ? '' : 'disabled'}" id="btn-unlock-ultimate" data-testid="btn-unlock-ultimate">
              <div class="td-opt-body">
                <div class="td-opt-head">
                  <strong>Lên Bậc 4: tuyệt chiêu "${ultName}"</strong>
                  <span class="td-price-tag">${ULTIMATE_COST}${coinImgHtml}</span>
                </div>
                <div class="td-opt-role">+20% sức luôn luôn. Bấm dùng: ${ultText} Hồi chiêu 30 giây.</div>
              </div>
            </button>`;
        } else {
          const cd = Math.ceil(existingTower.ultimateCooldownRemaining ?? 0);
          upgradeSectionHtml = `
            <button class="td-upgrade-btn ${cd > 0 ? 'disabled' : ''}" id="btn-use-ultimate" data-testid="btn-use-ultimate">
              <div class="td-opt-body">
                <div class="td-opt-head">
                  <strong>★ Dùng "${ultName}"</strong>
                  <span class="td-price-tag">${cd > 0 ? `chờ ${cd}s` : 'Sẵn sàng'}</span>
                </div>
                <div class="td-opt-role">${ultText}</div>
              </div>
            </button>`;
        }
      }

      const synergyGiver = existingTower.synergyFromUid
        ? this.engine.towers.find((t) => t.uid === existingTower.synergyFromUid)
        : undefined;
      const synergyInlineHtml = synergyGiver
        ? (() => {
            const desc = getSynergyExplanation(
              synergyGiver.defId,
              synergyGiver.element,
              existingTower.defId,
              existingTower.element,
            );
            return `<div class="td-synergy-badge-inline">✨ Tương sinh (+15% sức): ${desc.explanation}</div>`;
          })()
        : '';

      this.modalRoot.innerHTML = `
        <div class="td-sheet td-shoebox-panel" data-testid="td-upgrade-sheet">
          <div class="td-sheet-head">
            <div class="td-sheet-title-wrap">
              ${curSpriteUrl ? `<img class="td-head-sprite" src="${curSpriteUrl}" alt="" />` : ''}
              <span class="td-el-badge" style="background:${elInfo.colorHex}">
                ${elIconUrl ? `<img class="td-badge-el-icon" src="${elIconUrl}" alt="" />` : ''}
                ${elInfo.label}
              </span>
              <strong>${curStats.name}</strong>
            </div>
            <button class="td-close-btn" id="btn-close-sheet" aria-label="Đóng">✕</button>
          </div>
          <div class="td-cur-stats">
            Sức đánh: <strong>${Math.round(curStats.damage * existingTower.buffDamageMultiplier)}</strong> •
            Tầm: <strong>${Math.round(curStats.range * existingTower.buffRangeMultiplier)}</strong> •
            Nhịp: <strong>${(curStats.cooldownSec / existingTower.buffSpeedMultiplier).toFixed(2)}s</strong>
            ${synergyInlineHtml}
          </div>
          ${upgradeSectionHtml}
          <button class="td-sell-btn" id="btn-sell-tower" data-testid="btn-sell-tower">
            Cất món / Bán lại (+${refund} xu — hoàn 70%)
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

      this.modalRoot.querySelector('#btn-unlock-ultimate')?.addEventListener('click', () => {
        if (this.engine.unlockUltimate(padId)) {
          sound.playBuildOrUpgrade();
          this.renderPadModal(padId);
          this.refreshHud();
        }
      });

      this.modalRoot.querySelector('#btn-use-ultimate')?.addEventListener('click', () => {
        if (this.engine.activateUltimate(padId)) {
          sound.playBuildOrUpgrade();
          this.selectedPadId = null;
          this.closePadModal();
        }
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
    const isStage2 = this.engine.stage.id === 'stage_2';
    const stageNum = this.engine.stage.stageNumber;
    const stageName = this.engine.stage.name;
    const stars = calculateStarRating(this.engine.lives, this.engine.maxLives);
    const starsHtml = [1, 2, 3]
      .map((i) => {
        const earned = isWin && i <= stars;
        const delayMs = this.reduceMotion ? 0 : i * 260;
        return `<span class="td-star-item ${earned ? 'earned' : 'empty'}" style="animation-delay:${delayMs}ms">${earned ? '★' : '☆'}</span>`;
      })
      .join('');

    const ribbonText = isWin
      ? isStage2
        ? 'TIỆM BÁNH THƠM LỪNG!'
        : 'TIỆM SẠCH BÓNG!'
      : isStage2
        ? 'KỆ BÁNH BỊ HỎNG'
        : 'KỆ GIÀY BỊ BẨN';
    const titleText = isWin ? 'Giữ Tiệm Thành Công!' : `${stageName} Thất Thủ`;
    const unitLabel = isStage2 ? 'ổ bánh' : 'đôi giày';
    const descText = isWin
      ? `Bạn đã giữ gọn ${stageName} qua cả ${this.engine.getTotalWaves()} đợt ngày mưa! Còn lành: ${this.engine.lives}/${this.engine.maxLives} ${unitLabel}.`
      : isStage2
        ? 'Hơi ẩm, ruồi và than hồng đã tràn lên kệ bánh. Hãy ghép cặp tương sinh (+15%) và đặt món khắc chế "Trúng tủ!" nhé!'
        : 'Mưa bùn và gián đã tràn lên kệ giày. Hãy xem hành đợt sắp tới để đặt món khắc chế "Trúng tủ!" nhé!';

    this.modalRoot.innerHTML = `
      <div class="td-result-modal td-shoebox-panel" data-testid="td-result-modal">
        <div class="td-result-ribbon">${ribbonText}</div>
        <h2 class="td-result-title">${titleText}</h2>
        <div class="td-result-stars ${this.reduceMotion ? 'no-anim' : ''}" data-testid="td-result-stars">${starsHtml}</div>
        <p class="td-result-desc">${descText}</p>
        ${isWin && this.lastDrops.length > 0 ? `<div class="td-result-desc" data-testid="td-result-drops"><strong>Nhận trang bị:</strong><br>${this.lastDrops
          .map((g) => `${g.name} (${RARITY_LABEL[g.rarity]}, hệ ${ELEMENT_INFO[g.element].label}) — ${statText(g.main)}`)
          .join('<br>')}</div>` : ''}
        <div class="td-result-actions">
          <button id="btn-retry-stage" data-testid="btn-retry-stage" class="td-btn-primary">Chơi Lại Màn ${stageNum}</button>
          <button id="btn-back-title" data-testid="btn-back-title" class="td-btn-secondary">Về Màn Chính</button>
        </div>
      </div>
    `;

    this.modalRoot.querySelector('#btn-retry-stage')?.addEventListener('click', () => {
      sound.playUiClick();
      this.scene.restart({ stageId: this.engine.stage.id });
    });

    this.modalRoot.querySelector('#btn-back-title')?.addEventListener('click', () => {
      sound.playUiClick();
      this.scene.start(SCENE_KEYS.TITLE);
    });
  }

  private cleanupAllSprites(): void {
    for (const rec of this.towerSprites.values()) rec.sprite.destroy();
    this.towerSprites.clear();
    for (const rec of this.enemySprites.values()) rec.sprite.destroy();
    this.enemySprites.clear();
    for (const p of this.projectiles) p.sprite?.destroy();
    this.projectiles = [];
    for (const ds of this.dyingSprites) ds.sprite.destroy();
    this.dyingSprites = [];
    for (const fm of this.flyingMoney) fm.sprite?.destroy();
    this.flyingMoney = [];
    for (const fl of this.floatingLabels) fl.el.destroy();
    this.floatingLabels = [];
  }

  private unmountDom(): void {
    if (this.hudRoot) {
      this.hudRoot.remove();
      this.hudRoot = null;
    }
    if (this.synergyTooltipRoot) {
      this.synergyTooltipRoot.remove();
      this.synergyTooltipRoot = null;
    }
    if (this.modalRoot) {
      this.modalRoot.remove();
      this.modalRoot = null;
    }
  }
}
