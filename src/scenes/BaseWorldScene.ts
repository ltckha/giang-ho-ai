import Phaser from 'phaser';
import {
  ALLY_ARCHETYPES,
  distBetween,
  evaluateAllyDecision,
  type AIAction,
  type AIDecisionContext,
  type EnemySnapshot,
  type LootSnapshot,
  type PartyMemberSnapshot,
} from '../core/aiDecisionTree';
import { calculateDamage, resolveSkillElement } from '../core/combat';
import { CONTENT } from '../core/contentRegistry';
import { ELEMENT_INFO } from '../core/elements';
import { ITEMS } from '../core/inventory';
import { ENEMIES, MAPS, isPointInRect, resolveMapMovement } from '../core/maps';
import { SECTS, getSectSkills } from '../core/skills';
import type {
  AllyId,
  ElementType,
  EnemyTemplate,
  MapDef,
  MapId,
  NpcPlacement,
  PortalDef,
  SkillDef,
  Vec2,
} from '../core/types';
import { gameState } from '../game/gameState';
import { inputBridge, type WorldActionHandlers } from '../game/inputBridge';
import { SCENE_KEYS, getSceneKeyForMap } from '../game/sceneKeys';
import { sound } from '../game/sound';

export interface ActiveEnemy {
  uid: string;
  spawnId: string;
  template: EnemyTemplate;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  respawnTimer: number;
  attackCd: number;
  slowTimer: number;
  slowFactor: number;
  burnTimer: number;
  burnDps: number;
  burnTickAccum: number;
  bossPhaseTwo: boolean;
  bossSpecialCd: number;
  bossIntroShown: boolean;
  sprite: Phaser.GameObjects.Image;
  hpBg: Phaser.GameObjects.Rectangle;
  hpBar: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

export interface ActiveAlly {
  id: AllyId;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attackCd: number;
  healCd: number;
  decisionTimer: number;
  currentAction: AIAction;
  barkTimer: number;
  sprite: Phaser.GameObjects.Image;
  hpBg: Phaser.GameObjects.Rectangle;
  hpBar: Phaser.GameObjects.Rectangle;
  nameText: Phaser.GameObjects.Text;
  barkText: Phaser.GameObjects.Text;
}

interface ActiveLoot {
  id: string;
  x: number;
  y: number;
  kind: 'silver' | 'spirit_stone' | 'item' | 'quest';
  value: number;
  itemId?: string;
  sprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
}

interface ActiveProjectile {
  fromPlayerOrAlly: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  radius: number;
  element: ElementType;
  atk: number;
  powerMultiplier: number;
  armorPierce?: number;
  burnDps?: number;
  burnDurationSec?: number;
  sprite: Phaser.GameObjects.Image;
}

interface ActiveNpc {
  def: NpcPlacement;
  sprite: Phaser.GameObjects.Image;
  nameText: Phaser.GameObjects.Text;
  markerText: Phaser.GameObjects.Text;
}

interface TelegraphZone {
  x: number;
  y: number;
  radius: number;
  remaining: number;
  maxTime: number;
  atk: number;
  element: ElementType;
  circle: Phaser.GameObjects.Arc;
  ring: Phaser.GameObjects.Arc;
}

const ACTION_LABELS: Record<string, string> = {
  charge_attack: 'Xông đánh!',
  attack: 'Tấn công',
  retreat: 'Lùi giữ tầm',
  heal_ally: 'Hồi máu đội',
  pickup_loot: 'Nhặt chiến lợi phẩm',
  follow: 'Theo đội',
  idle: 'Cảnh giới',
};

export abstract class BaseWorldScene extends Phaser.Scene {
  protected readonly mapId: MapId;
  protected mapDef!: MapDef;

  protected playerSprite!: Phaser.GameObjects.Image;
  protected playerRing!: Phaser.GameObjects.Arc;
  protected playerShieldGraphic!: Phaser.GameObjects.Arc;
  protected playerFacing: Vec2 = { x: 1, y: 0 };
  protected playerX = 0;
  protected playerY = 0;

  protected allies: ActiveAlly[] = [];
  protected enemies: ActiveEnemy[] = [];
  protected npcs: ActiveNpc[] = [];
  protected lootDrops: ActiveLoot[] = [];
  protected projectiles: ActiveProjectile[] = [];
  protected telegraphs: TelegraphZone[] = [];

  protected keys!: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    one: Phaser.Input.Keyboard.Key;
    two: Phaser.Input.Keyboard.Key;
    three: Phaser.Input.Keyboard.Key;
    four: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
    j: Phaser.Input.Keyboard.Key;
    e: Phaser.Input.Keyboard.Key;
    f: Phaser.Input.Keyboard.Key;
    q: Phaser.Input.Keyboard.Key;
    r: Phaser.Input.Keyboard.Key;
    i: Phaser.Input.Keyboard.Key;
    m: Phaser.Input.Keyboard.Key;
    h: Phaser.Input.Keyboard.Key;
  };

  private portalCooldown = 0.7;
  private autoSaveTimer = 0;
  private safeZoneHealTimer = 0;
  private hudSyncTimer = 0;
  private lootSeq = 0;
  private transitionLocked = false;
  private worldHandlers!: WorldActionHandlers;

  constructor(sceneKey: string, mapId: MapId) {
    super({ key: sceneKey });
    this.mapId = mapId;
  }

  public create(): void {
    this.mapDef = MAPS[this.mapId];
    this.allies = [];
    this.enemies = [];
    this.npcs = [];
    this.lootDrops = [];
    this.projectiles = [];
    this.telegraphs = [];
    this.portalCooldown = 0.75;
    this.transitionLocked = false;

    const save = gameState.getData();
    if (save.mapId !== this.mapId) {
      gameState.setMap(this.mapId, this.mapDef.defaultSpawn);
    }

    this.cameras.main.setBounds(0, 0, this.mapDef.width, this.mapDef.height);
    this.cameras.main.setBackgroundColor('#12100e');

    this.renderBaseTerrain();
    this.renderMapDecorations();
    this.renderObstacles();
    this.renderLandmarks();
    this.renderPortals();
    this.spawnNpcs();
    this.spawnPlayer();
    this.spawnAllies();
    this.spawnEnemies();
    this.setupKeyboard();
    this.registerInputBridge();

    this.cameras.main.startFollow(this.playerSprite, true, 0.14, 0.14);

    if (!this.scene.isActive(SCENE_KEYS.UI)) {
      this.scene.launch(SCENE_KEYS.UI);
    }

    const skills = getSectSkills(save.sectId);
    gameState.skillMaxCooldowns = [
      skills[0].cooldownSec,
      skills[1].cooldownSec,
      skills[2].cooldownSec,
      skills[3].cooldownSec,
    ];
    gameState.skillCooldowns = [0, 0, 0, 0];
    gameState.pushToast(`Đã đến ${CONTENT.maps[this.mapId].name}`, '#e8c468');
    this.syncHudState();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      inputBridge.unregisterWorld(this.worldHandlers);
    });
  }

  protected abstract renderMapDecorations(): void;
  protected onPostUpdate(_dt: number): void {
    // Hook mở rộng cho từng bản đồ (Thành / Rừng / Hang)
  }

  private renderBaseTerrain(): void {
    const tileKey =
      this.mapId === 'map_town'
        ? 'tile_town'
        : this.mapId === 'map_forest'
          ? 'tile_forest'
          : 'tile_cave';

    this.add
      .tileSprite(0, 0, this.mapDef.width, this.mapDef.height, tileKey)
      .setOrigin(0, 0)
      .setDepth(0);
  }

  private renderObstacles(): void {
    const g = this.add.graphics().setDepth(2);
    for (const obs of this.mapDef.obstacles) {
      if (this.mapId === 'map_town') {
        const isWall = obs.w > 400 || obs.h > 300;
        g.fillStyle(isWall ? 0x453b31 : 0x573b29, 1);
        g.fillRoundedRect(obs.x, obs.y, obs.w, obs.h, 6);
        g.lineStyle(3, isWall ? 0x26201a : 0x8c6239, 1);
        g.strokeRoundedRect(obs.x, obs.y, obs.w, obs.h, 6);
        if (!isWall) {
          // Mái ngói cổ trang
          g.fillStyle(0x2e211a, 0.45);
          g.fillRect(obs.x + 8, obs.y + 10, obs.w - 16, obs.h - 22);
          g.lineStyle(2, 0xc7a45a, 0.45);
          g.strokeRect(obs.x + 6, obs.y + 6, obs.w - 12, obs.h - 12);
        }
      } else if (this.mapId === 'map_forest') {
        const isBorder = obs.x === 0 || obs.y === 0 || obs.x + obs.w >= this.mapDef.width || obs.y + obs.h >= this.mapDef.height;
        g.fillStyle(isBorder ? 0x162618 : 0x2d4a31, 1);
        g.fillRoundedRect(obs.x, obs.y, obs.w, obs.h, 12);
        g.lineStyle(2, isBorder ? 0x0d170f : 0x4b734e, 1);
        g.strokeRoundedRect(obs.x, obs.y, obs.w, obs.h, 12);
        if (!isBorder) {
          // Cụm tán cổ thụ & đá mỏ
          g.fillStyle(0x1f3823, 0.9);
          g.fillCircle(obs.x + obs.w * 0.3, obs.y + obs.h * 0.45, Math.min(obs.w, obs.h) * 0.32);
          g.fillCircle(obs.x + obs.w * 0.7, obs.y + obs.h * 0.52, Math.min(obs.w, obs.h) * 0.3);
        }
      } else {
        g.fillStyle(0x28303d, 1);
        g.fillRoundedRect(obs.x, obs.y, obs.w, obs.h, 8);
        g.lineStyle(2, 0x445368, 1);
        g.strokeRoundedRect(obs.x, obs.y, obs.w, obs.h, 8);
      }
    }
  }

  private renderLandmarks(): void {
    const g = this.add.graphics().setDepth(1);
    for (const lm of this.mapDef.landmarks) {
      let color = 0xc7a45a;
      let alpha = 0.12;
      if (lm.kind === 'foundry' || lm.kind === 'mine') {
        color = 0x4cc9f0;
        alpha = 0.16;
      } else if (lm.kind === 'forge') {
        color = 0xff7b54;
        alpha = 0.14;
      } else if (lm.kind === 'boss_arena') {
        color = 0x4ea8de;
        alpha = 0.14;
      } else if (lm.kind === 'fake_landmark') {
        color = 0xf2c14e;
        alpha = 0.11;
      }

      g.fillStyle(color, alpha);
      g.fillRoundedRect(lm.x, lm.y, lm.w, lm.h, 14);
      g.lineStyle(2, color, 0.45);
      g.strokeRoundedRect(lm.x, lm.y, lm.w, lm.h, 14);

      const label = CONTENT.landmarks[lm.id];
      if (label) {
        const labelY =
          lm.kind === 'forge' || lm.kind === 'crossroads' ? lm.y + lm.h - 14 : lm.y + 18;
        this.add
          .text(lm.x + lm.w / 2, labelY, label, {
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#f4ead5',
            backgroundColor: 'rgba(18, 15, 12, 0.72)',
            padding: { x: 8, y: 3 },
            fontFamily: 'system-ui, -apple-system, sans-serif',
          })
          .setOrigin(0.5)
          .setDepth(3);
      }
    }
  }

  private renderPortals(): void {
    for (const portal of this.mapDef.portals) {
      const cx = portal.x + portal.w / 2;
      const cy = portal.y + portal.h / 2;

      const glow = this.add
        .rectangle(cx, cy, portal.w, portal.h, 0x4cc9f0, 0.22)
        .setStrokeStyle(2.5, 0x8be9fd, 0.9)
        .setDepth(3);

      this.tweens.add({
        targets: glow,
        alpha: { from: 0.18, to: 0.45 },
        duration: 900,
        yoyo: true,
        repeat: -1,
      });

      const targetName = CONTENT.maps[portal.targetMap].name;
      this.add
        .text(cx, cy, `⟶\n${targetName}`, {
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#c9f6ff',
          align: 'center',
          backgroundColor: 'rgba(12, 22, 32, 0.78)',
          padding: { x: 6, y: 4 },
          fontFamily: 'system-ui, -apple-system, sans-serif',
        })
        .setOrigin(0.5)
        .setDepth(4);
    }
  }

  private spawnNpcs(): void {
    for (const npcDef of this.mapDef.npcs) {
      const meta = CONTENT.npcs[npcDef.id];
      const sprite = this.add.image(npcDef.x, npcDef.y, npcDef.id).setDepth(10);
      const nameText = this.add
        .text(npcDef.x, npcDef.y - 32, meta?.name ?? npcDef.id, {
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#f7e5b7',
          backgroundColor: 'rgba(20, 16, 12, 0.76)',
          padding: { x: 5, y: 2 },
          fontFamily: 'system-ui, -apple-system, sans-serif',
        })
        .setOrigin(0.5)
        .setDepth(15);

      const markerText = this.add
        .text(npcDef.x, npcDef.y - 50, '', {
          fontSize: '15px',
          fontStyle: 'bold',
          color: '#ffd166',
          stroke: '#1a1410',
          strokeThickness: 3,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        })
        .setOrigin(0.5)
        .setDepth(16);

      this.npcs.push({ def: npcDef, sprite, nameText, markerText });
    }
    this.refreshNpcMarkers();
  }

  protected refreshNpcMarkers(): void {
    const quests = gameState.getData().quests;
    for (const npc of this.npcs) {
      if (npc.def.role === 'blacksmith') {
        const st = quests.quest_blacksmith.status;
        npc.markerText.setText(st === 'not_started' ? '!' : st === 'ready' ? '?' : '');
        npc.markerText.setColor(st === 'ready' ? '#59c173' : '#ffd166');
      } else if (npc.def.role === 'guide') {
        const st = quests.quest_hallucination.status;
        npc.markerText.setText(st === 'not_started' ? '!' : st === 'ready' ? '?' : '');
        npc.markerText.setColor(st === 'ready' ? '#59c173' : '#ffd166');
      } else if (npc.def.role === 'merchant') {
        npc.markerText.setText('Tiệm');
        npc.markerText.setColor('#8be9fd');
      } else {
        npc.markerText.setText('');
      }
    }
  }

  private spawnPlayer(): void {
    const save = gameState.getData();
    const pos = resolveMapMovement(save.playerPos, 18, this.mapDef);
    this.playerX = pos.x;
    this.playerY = pos.y;

    const sectEl = SECTS[save.sectId].element;
    this.playerRing = this.add
      .circle(this.playerX, this.playerY + 14, 18, ELEMENT_INFO[sectEl].colorInt, 0.16)
      .setStrokeStyle(2, ELEMENT_INFO[sectEl].colorInt, 0.7)
      .setDepth(9);

    this.playerShieldGraphic = this.add
      .circle(this.playerX, this.playerY, 27, 0xe8c468, 0.16)
      .setStrokeStyle(2.5, 0xe8c468, 0.9)
      .setDepth(13)
      .setVisible(false);

    this.playerSprite = this.add
      .image(this.playerX, this.playerY, `player_${save.sectId}`)
      .setDepth(12);
  }

  private spawnAllies(): void {
    const save = gameState.getData();
    const offsets: Vec2[] = [
      { x: 46, y: -32 },
      { x: -50, y: 26 },
      { x: -42, y: -40 },
    ];

    save.allies.forEach((allySave, idx) => {
      const arch = ALLY_ARCHETYPES[allySave.id];
      const off = offsets[idx % offsets.length];
      const pos = resolveMapMovement(
        { x: this.playerX + off.x, y: this.playerY + off.y },
        15,
        this.mapDef,
      );

      const sprite = this.add.image(pos.x, pos.y, allySave.id).setDepth(11);
      const hpBg = this.add.rectangle(pos.x, pos.y - 26, 36, 5, 0x1a1612).setDepth(15);
      const hpBar = this.add
        .rectangle(pos.x - 18, pos.y - 26, 36, 5, ELEMENT_INFO[arch.element].colorInt)
        .setOrigin(0, 0.5)
        .setDepth(16);

      const meta = CONTENT.allies[allySave.id];
      const nameText = this.add
        .text(pos.x, pos.y - 36, meta.name, {
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#e9dec7',
          stroke: '#14110e',
          strokeThickness: 3,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        })
        .setOrigin(0.5)
        .setDepth(16);

      const barkText = this.add
        .text(pos.x, pos.y - 52, '', {
          fontSize: '11px',
          color: '#fff6d6',
          backgroundColor: 'rgba(20, 17, 13, 0.84)',
          padding: { x: 5, y: 2 },
          fontFamily: 'system-ui, -apple-system, sans-serif',
        })
        .setOrigin(0.5)
        .setDepth(22)
        .setVisible(false);

      this.allies.push({
        id: allySave.id,
        x: pos.x,
        y: pos.y,
        hp: Math.max(1, Math.min(arch.maxHp, allySave.hp)),
        maxHp: arch.maxHp,
        attackCd: 0.4,
        healCd: 0,
        decisionTimer: idx * 0.08,
        currentAction: { type: 'follow', reason: 'follow_player' },
        barkTimer: 0,
        sprite,
        hpBg,
        hpBar,
        nameText,
        barkText,
      });
    });
  }

  private spawnEnemies(): void {
    const save = gameState.getData();
    for (const sp of this.mapDef.enemySpawns) {
      const tmpl = ENEMIES[sp.enemyId];
      if (!tmpl) continue;
      if (tmpl.isBoss && save.bossDefeated) {
        continue;
      }

      const sprite = this.add.image(sp.x, sp.y, tmpl.id).setDepth(tmpl.isBoss ? 13 : 11);
      const barWidth = tmpl.isBoss ? 72 : 40;
      const offsetY = tmpl.isBoss ? -46 : -28;
      const hpBg = this.add.rectangle(sp.x, sp.y + offsetY, barWidth, 6, 0x1a1512).setDepth(15);
      const hpBar = this.add
        .rectangle(
          sp.x - barWidth / 2,
          sp.y + offsetY,
          barWidth,
          6,
          tmpl.isBoss ? 0x4ea8de : 0xe05252,
        )
        .setOrigin(0, 0.5)
        .setDepth(16);

      const elLabel = ELEMENT_INFO[tmpl.element].label;
      const enemyName = CONTENT.enemies[tmpl.id] ?? tmpl.id;
      const label = this.add
        .text(sp.x, sp.y + offsetY - 12, `[${elLabel}] ${enemyName}`, {
          fontSize: tmpl.isBoss ? '12px' : '11px',
          fontStyle: 'bold',
          color: ELEMENT_INFO[tmpl.element].colorHex,
          stroke: '#14100d',
          strokeThickness: 3,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        })
        .setOrigin(0.5)
        .setDepth(16);

      this.enemies.push({
        uid: `${sp.id}_${tmpl.id}`,
        spawnId: sp.id,
        template: tmpl,
        x: sp.x,
        y: sp.y,
        homeX: sp.x,
        homeY: sp.y,
        hp: tmpl.maxHp,
        maxHp: tmpl.maxHp,
        alive: true,
        respawnTimer: 0,
        attackCd: 0.8,
        slowTimer: 0,
        slowFactor: 1,
        burnTimer: 0,
        burnDps: 0,
        burnTickAccum: 0,
        bossPhaseTwo: false,
        bossSpecialCd: 3.5,
        bossIntroShown: false,
        sprite,
        hpBg,
        hpBar,
        label,
      });
    }
  }

  private setupKeyboard(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    this.keys = {
      w: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      one: kb.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      two: kb.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      three: kb.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      four: kb.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
      space: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      j: kb.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      e: kb.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      f: kb.addKey(Phaser.Input.Keyboard.KeyCodes.F),
      q: kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      r: kb.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      i: kb.addKey(Phaser.Input.Keyboard.KeyCodes.I),
      m: kb.addKey(Phaser.Input.Keyboard.KeyCodes.M),
      h: kb.addKey(Phaser.Input.Keyboard.KeyCodes.H),
    };

    const onKeyDown = (ev: KeyboardEvent): void => {
      if (this.transitionLocked) return;
      const code = ev.code;
      if (code === 'Escape' && inputBridge.isModalOpen) {
        inputBridge.closeModals();
        return;
      }
      if (code === 'KeyI') {
        inputBridge.openBag();
        return;
      }
      if (code === 'KeyM') {
        inputBridge.openQuests();
        return;
      }
      if (code === 'KeyH') {
        inputBridge.openElementsGuide();
        return;
      }
      if (inputBridge.isModalOpen) return;

      if (code === 'Digit1' || code === 'Space' || code === 'KeyJ') {
        this.castPlayerSkill(1);
      } else if (code === 'Digit2') {
        this.castPlayerSkill(2);
      } else if (code === 'Digit3') {
        this.castPlayerSkill(3);
      } else if (code === 'Digit4') {
        this.castPlayerSkill(4);
      } else if (code === 'KeyE' || code === 'KeyF') {
        this.tryInteract();
      } else if (code === 'KeyQ') {
        this.useConsumableItem('pot_heal_small');
      } else if (code === 'KeyR') {
        this.useConsumableItem('pot_ally_oil');
      }
    };

    kb.on('keydown', onKeyDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb.off('keydown', onKeyDown);
    });
  }

  private registerInputBridge(): void {
    this.worldHandlers = {
      castSkill: (slot) => this.castPlayerSkill(slot),
      interact: () => this.tryInteract(),
      usePotion: (itemId) => this.useConsumableItem(itemId),
      returnToTown: () => this.travelToMap('map_town', MAPS.map_town.defaultSpawn),
      returnToTitle: () => {
        gameState.persist(true);
        if (this.scene.isActive(SCENE_KEYS.UI)) {
          this.scene.stop(SCENE_KEYS.UI);
        }
        this.scene.start(SCENE_KEYS.TITLE);
      },
    };
    inputBridge.registerWorld(this.worldHandlers);
  }

  public update(_time: number, deltaMs: number): void {
    const dt = Math.min(0.05, deltaMs / 1000);
    if (this.transitionLocked) return;
    if (inputBridge.isModalOpen) {
      return;
    }

    this.portalCooldown = Math.max(0, this.portalCooldown - dt);
    this.updateTimers(dt);
    this.updatePlayerMovement(dt);
    this.updateAllies(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateTelegraphs(dt);
    this.checkPlayerLootPickup();
    this.checkNearbyInteractables();
    this.checkPortals();
    this.onPostUpdate(dt);

    // Hồi máu nhẹ trong thành (khu an toàn)
    if (this.mapDef.isSafeZone) {
      this.safeZoneHealTimer += dt;
      if (this.safeZoneHealTimer >= 1.2) {
        this.safeZoneHealTimer = 0;
        const d = gameState.getData();
        const stats = gameState.getEffectiveStats();
        if (d.hp < stats.maxHp) {
          d.hp = Math.min(stats.maxHp, d.hp + 12);
        }
        for (const ally of this.allies) {
          if (ally.hp < ally.maxHp) {
            ally.hp = Math.min(ally.maxHp, ally.hp + 10);
          }
        }
      }
    }

    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= 7.5) {
      this.autoSaveTimer = 0;
      this.syncSaveFromRuntime();
      gameState.persist(false);
    }

    this.hudSyncTimer += dt;
    if (this.hudSyncTimer >= 0.12) {
      this.hudSyncTimer = 0;
      this.syncHudState();
    }
  }

  private updateTimers(dt: number): void {
    for (let i = 0; i < 4; i++) {
      gameState.skillCooldowns[i] = Math.max(0, gameState.skillCooldowns[i] - dt);
    }
    if (gameState.playerShieldRemaining > 0) {
      gameState.playerShieldRemaining = Math.max(0, gameState.playerShieldRemaining - dt);
      this.playerShieldGraphic.setVisible(gameState.playerShieldRemaining > 0);
    } else {
      this.playerShieldGraphic.setVisible(false);
    }
    if (gameState.allyAtkBuffRemaining > 0) {
      gameState.allyAtkBuffRemaining = Math.max(0, gameState.allyAtkBuffRemaining - dt);
    }
  }

  private updatePlayerMovement(dt: number): void {
    let vx = inputBridge.touchMove.x;
    let vy = inputBridge.touchMove.y;

    if (this.keys) {
      if (this.keys.a.isDown || this.keys.left.isDown) vx -= 1;
      if (this.keys.d.isDown || this.keys.right.isDown) vx += 1;
      if (this.keys.w.isDown || this.keys.up.isDown) vy -= 1;
      if (this.keys.s.isDown || this.keys.down.isDown) vy += 1;
    }

    const len = Math.hypot(vx, vy);
    if (len > 0.05) {
      const nx = vx / Math.max(1, len);
      const ny = vy / Math.max(1, len);
      this.playerFacing = { x: vx / len, y: vy / len };
      const speed = gameState.getEffectiveStats().moveSpeed;
      const next = resolveMapMovement(
        { x: this.playerX + nx * speed * dt, y: this.playerY + ny * speed * dt },
        18,
        this.mapDef,
      );
      this.playerX = next.x;
      this.playerY = next.y;
      this.playerSprite.setFlipX(this.playerFacing.x < -0.15);
    }

    this.playerSprite.setPosition(this.playerX, this.playerY);
    this.playerRing.setPosition(this.playerX, this.playerY + 14);
    this.playerShieldGraphic.setPosition(this.playerX, this.playerY);
    gameState.updatePlayerPos({ x: this.playerX, y: this.playerY });
  }

  public castPlayerSkill(slot: 1 | 2 | 3 | 4): void {
    const idx = slot - 1;
    if (gameState.skillCooldowns[idx] > 0) return;

    const save = gameState.getData();
    const skills = getSectSkills(save.sectId);
    const skill: SkillDef = skills[idx];
    const stats = gameState.getEffectiveStats();
    const attackElement = resolveSkillElement(skill.slot, skill.element, stats.imbueElement);

    gameState.skillCooldowns[idx] = skill.cooldownSec;
    sound.playSkill(slot);

    // Tự động hướng về quái gần nhất trong tầm
    const nearest = this.findNearestAliveEnemy({ x: this.playerX, y: this.playerY }, Math.max(skill.range + 90, 260));
    if (nearest) {
      const dx = nearest.x - this.playerX;
      const dy = nearest.y - this.playerY;
      const len = Math.hypot(dx, dy);
      if (len > 1) {
        this.playerFacing = { x: dx / len, y: dy / len };
        this.playerSprite.setFlipX(this.playerFacing.x < -0.15);
      }
    }

    const elColor = ELEMENT_INFO[attackElement].colorInt;

    if (skill.effect === 'heal_party') {
      const healVal = Math.round(stats.maxHp * (skill.healPercent ?? 0.35) + (skill.healFlat ?? 20));
      save.hp = Math.min(stats.maxHp, save.hp + healVal);
      this.spawnFloatingText(this.playerX, this.playerY - 28, `+${healVal} HP`, '#7bf1a8');
      this.spawnRingVfx(this.playerX, this.playerY, skill.radius ?? 220, 0x59c173);
      for (const ally of this.allies) {
        if (distBetween({ x: this.playerX, y: this.playerY }, { x: ally.x, y: ally.y }) <= (skill.radius ?? 240)) {
          const allyHeal = Math.round(ally.maxHp * (skill.healPercent ?? 0.35) + (skill.healFlat ?? 20));
          ally.hp = Math.min(ally.maxHp, ally.hp + allyHeal);
          this.spawnFloatingText(ally.x, ally.y - 26, `+${allyHeal}`, '#7bf1a8');
        }
      }
      if (skill.allyBuffDurationSec) {
        gameState.allyAtkBuffRemaining = skill.allyBuffDurationSec;
        gameState.pushToast('Tán Lục Hồi Sinh: +18% công cho 3 khôi lỗi (5s)!', '#7bf1a8');
      }
      sound.playHeal();
      return;
    }

    if (skill.effect === 'shield_self') {
      gameState.playerShieldRemaining = skill.shieldDurationSec ?? 4.5;
      this.playerShieldGraphic.setVisible(true);
      this.spawnRingVfx(this.playerX, this.playerY, 68, 0xe8c468);
      this.spawnFloatingText(this.playerX, this.playerY - 30, 'Đồng Thuẫn -45% ST', '#e8c468');
      return;
    }

    if (skill.effect === 'projectile' || skill.effect === 'burn_projectile') {
      this.spawnProjectile({
        fromPlayerOrAlly: true,
        x: this.playerX + this.playerFacing.x * 20,
        y: this.playerY + this.playerFacing.y * 20,
        dir: this.playerFacing,
        speed: 420,
        life: Math.max(0.5, skill.range / 420),
        element: attackElement,
        atk: stats.atk,
        powerMultiplier: skill.powerMultiplier,
        burnDps: skill.burnDps,
        burnDurationSec: skill.burnDurationSec,
      });
      return;
    }

    if (skill.effect === 'melee' || skill.effect === 'pierce') {
      const hitX = this.playerX + this.playerFacing.x * (skill.range * 0.55);
      const hitY = this.playerY + this.playerFacing.y * (skill.range * 0.55);
      const hitRadius = skill.effect === 'pierce' ? 66 : 58;
      this.spawnRingVfx(hitX, hitY, hitRadius, elColor);

      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        if (distBetween({ x: hitX, y: hitY }, { x: enemy.x, y: enemy.y }) <= hitRadius + (enemy.template.isBoss ? 24 : 14)) {
          this.damageEnemy(enemy, stats.atk, attackElement, skill.powerMultiplier, skill.armorPierce);
        }
      }
      return;
    }

    // Các chiêu AoE (aoe, slow_aoe, knockback_aoe)
    const radius = skill.radius ?? skill.range;
    this.spawnRingVfx(this.playerX, this.playerY, radius, elColor);
    if (slot === 4) {
      this.cameras.main.shake(140, 0.006);
    }

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const d = distBetween({ x: this.playerX, y: this.playerY }, { x: enemy.x, y: enemy.y });
      if (d <= radius + (enemy.template.isBoss ? 24 : 14)) {
        this.damageEnemy(enemy, stats.atk, attackElement, skill.powerMultiplier, skill.armorPierce);
        if (skill.effect === 'slow_aoe' && skill.slowDurationSec) {
          enemy.slowTimer = skill.slowDurationSec;
          enemy.slowFactor = 1 - (skill.slowFactor ?? 0.4);
          this.spawnFloatingText(enemy.x, enemy.y - 36, 'Làm chậm!', '#8ce99a');
        }
        if (skill.effect === 'knockback_aoe' && skill.knockbackForce) {
          const dx = enemy.x - this.playerX;
          const dy = enemy.y - this.playerY;
          const len = Math.max(1, Math.hypot(dx, dy));
          const pushed = resolveMapMovement(
            {
              x: enemy.x + (dx / len) * (enemy.template.isBoss ? 55 : skill.knockbackForce * 0.6),
              y: enemy.y + (dy / len) * (enemy.template.isBoss ? 55 : skill.knockbackForce * 0.6),
            },
            enemy.template.isBoss ? 28 : 18,
            this.mapDef,
          );
          enemy.x = pushed.x;
          enemy.y = pushed.y;
        }
      }
    }
  }

  private damageEnemy(
    enemy: ActiveEnemy,
    atk: number,
    attackElement: ElementType,
    powerMultiplier = 1.0,
    armorPierce = 0,
  ): void {
    if (!enemy.alive) return;
    const res = calculateDamage({
      attackerAtk: atk,
      attackElement,
      defenderDef: enemy.template.def,
      defenderElement: enemy.template.element,
      powerMultiplier,
      armorPierce,
    });

    enemy.hp -= res.damage;
    sound.playHit(res.relation === 'counter');

    // Nháy trắng khi trúng đòn
    enemy.sprite.setTintFill(0xffffff);
    this.time.delayedCall(75, () => {
      if (enemy.sprite.active) enemy.sprite.clearTint();
    });

    const tag =
      res.relation === 'counter'
        ? ' Khắc!'
        : res.relation === 'countered'
          ? ' Bị khắc'
          : '';
    const critTag = res.isCrit ? ' ★' : '';
    const color =
      res.relation === 'counter'
        ? '#ffd166'
        : res.relation === 'countered'
          ? '#a0aec0'
          : '#ffffff';
    this.spawnFloatingText(
      enemy.x + Phaser.Math.Between(-12, 12),
      enemy.y - 26,
      `-${res.damage}${critTag}${tag}`,
      color,
    );

    if (enemy.hp <= 0) {
      this.handleEnemyDefeated(enemy);
    }
  }

  private handleEnemyDefeated(enemy: ActiveEnemy): void {
    enemy.alive = false;
    enemy.hp = 0;
    enemy.respawnTimer = enemy.template.isBoss ? 9999 : 20;
    enemy.sprite.setVisible(false);
    enemy.hpBg.setVisible(false);
    enemy.hpBar.setVisible(false);
    enemy.label.setVisible(false);

    const lvl = gameState.gainXp(enemy.template.xpReward);
    this.spawnFloatingText(enemy.x, enemy.y - 44, `+${enemy.template.xpReward} KN`, '#90e0ef');
    if (lvl.levelsGained > 0) {
      sound.playLevelUp();
      gameState.pushToast(`Lên cấp ${lvl.newLevel}! Máu và 3 khôi lỗi đã hồi đầy!`, '#ffd166');
      this.spawnRingVfx(this.playerX, this.playerY, 95, 0xffd166);
      for (const ally of this.allies) {
        ally.hp = ally.maxHp;
      }
    }

    // Rơi bạc vụn
    const silverVal = Phaser.Math.Between(enemy.template.silverMin, enemy.template.silverMax);
    this.spawnLootDrop(enemy.x + Phaser.Math.Between(-16, 16), enemy.y + Phaser.Math.Between(-12, 12), 'silver', silverVal);

    // Rơi linh thạch
    if (Math.random() < enemy.template.spiritStoneChance) {
      this.spawnLootDrop(enemy.x + Phaser.Math.Between(-20, 20), enemy.y + Phaser.Math.Between(-16, 16), 'spirit_stone', 1);
    }

    // Rơi trang bị / bình theo bảng loot
    for (const entry of enemy.template.lootTable) {
      if (Math.random() < entry.chance) {
        this.spawnLootDrop(
          enemy.x + Phaser.Math.Between(-24, 24),
          enemy.y + Phaser.Math.Between(-18, 18),
          'item',
          ITEMS[entry.itemId]?.price ?? 40,
          entry.itemId,
        );
      }
    }

    // Rơi Mảnh Quặng Linh Thiết nếu đang làm nhiệm vụ phụ Lão Bính ngoài Rừng
    const qBlacksmith = gameState.getData().quests.quest_blacksmith;
    if (this.mapId === 'map_forest' && qBlacksmith.status === 'active') {
      this.spawnLootDrop(enemy.x, enemy.y - 16, 'quest', 120, 'qst_iron_ore');
    }

    // Nếu hạ được Trùm Sơ Giác
    if (enemy.template.isBoss) {
      const save = gameState.getData();
      save.bossDefeated = true;
      gameState.bossStatus = { active: false, hp: 0, maxHp: enemy.maxHp, phaseTwo: true };
      gameState.progressQuest('quest_boss', 1);
      const reward = gameState.turnInQuest('quest_boss');
      sound.playLevelUp();
      gameState.pushToast(
        `Đã đánh bại Sơ Giác! Nhận +${reward.silver} Bạc, +${reward.spiritStones} Linh Thạch & Binh Khí Tàn Cơ!`,
        '#ffd166',
      );
      inputBridge.openDialog({
        speaker: CONTENT.enemies.boss_awakened,
        subtitle: 'Động Tàn Cơ • Hồi kết Giai đoạn 1',
        lines: [CONTENT.bossDialog.defeated],
        actionLabel: 'Xem tổng kết Giai đoạn 1',
        onAction: () => inputBridge.openVictory(),
      });
    }
  }

  private spawnLootDrop(
    x: number,
    y: number,
    kind: 'silver' | 'spirit_stone' | 'item' | 'quest',
    value: number,
    itemId?: string,
  ): void {
    this.lootSeq += 1;
    const pos = resolveMapMovement({ x, y }, 12, this.mapDef);
    const texKey =
      kind === 'silver'
        ? 'loot_silver'
        : kind === 'spirit_stone'
          ? 'loot_spirit_stone'
          : kind === 'quest'
            ? 'loot_quest'
            : 'loot_item';

    const sprite = this.add.image(pos.x, pos.y, texKey).setDepth(8);
    const caption =
      kind === 'silver'
        ? `${value} Bạc`
        : kind === 'spirit_stone'
          ? 'Linh Thạch'
          : itemId
            ? CONTENT.items[itemId]?.name ?? itemId
            : 'Trang bị';

    const label = this.add
      .text(pos.x, pos.y + 16, caption, {
        fontSize: '10px',
        color: kind === 'quest' ? '#ffd166' : kind === 'spirit_stone' ? '#8be9fd' : '#f4ead5',
        backgroundColor: 'rgba(15, 13, 10, 0.72)',
        padding: { x: 4, y: 1 },
        fontFamily: 'system-ui, -apple-system, sans-serif',
      })
      .setOrigin(0.5)
      .setDepth(9);

    this.tweens.add({
      targets: sprite,
      y: pos.y - 5,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.lootDrops.push({
      id: `loot_${this.lootSeq}`,
      x: pos.x,
      y: pos.y,
      kind,
      value,
      itemId,
      sprite,
      label,
    });
  }

  private collectLoot(lootIndex: number, collectorName?: string): void {
    const loot = this.lootDrops[lootIndex];
    if (!loot) return;
    loot.sprite.destroy();
    loot.label.destroy();
    this.lootDrops.splice(lootIndex, 1);

    sound.playPickup();
    const prefix = collectorName ? `${collectorName} nhặt: ` : 'Nhặt: ';
    if (loot.kind === 'silver') {
      gameState.addCurrency(loot.value, 0);
      gameState.pushToast(`${prefix}+${loot.value} Bạc Vụn`, '#e8c468');
    } else if (loot.kind === 'spirit_stone') {
      gameState.addCurrency(0, loot.value);
      gameState.pushToast(`${prefix}+${loot.value} Mảnh Linh Thạch`, '#8be9fd');
    } else if (loot.itemId) {
      gameState.addItem(loot.itemId, 1);
      const itemName = CONTENT.items[loot.itemId]?.name ?? loot.itemId;
      gameState.pushToast(`${prefix}${itemName}`, loot.kind === 'quest' ? '#ffd166' : '#a7f3d0');
      this.refreshNpcMarkers();
    }
  }

  private checkPlayerLootPickup(): void {
    for (let i = this.lootDrops.length - 1; i >= 0; i--) {
      const loot = this.lootDrops[i];
      if (distBetween({ x: this.playerX, y: this.playerY }, { x: loot.x, y: loot.y }) <= 38) {
        this.collectLoot(i);
      }
    }
  }

  private updateAllies(dt: number): void {
    const save = gameState.getData();
    const stats = gameState.getEffectiveStats();
    const sectPassive = SECTS[save.sectId].allyPassiveAtkBonus;
    const activeBuff = gameState.allyAtkBuffRemaining > 0 ? 0.18 : 0;
    const allyAtkMult = 1 + sectPassive + activeBuff;

    const playerSnap: PartyMemberSnapshot = {
      id: 'player',
      isPlayer: true,
      pos: { x: this.playerX, y: this.playerY },
      hp: save.hp,
      maxHp: stats.maxHp,
    };

    const partySnaps: PartyMemberSnapshot[] = [
      playerSnap,
      ...this.allies.map((a) => ({
        id: a.id,
        isPlayer: false,
        pos: { x: a.x, y: a.y },
        hp: a.hp,
        maxHp: a.maxHp,
      })),
    ];

    const enemySnaps: EnemySnapshot[] = this.enemies
      .filter((e) => e.alive)
      .map((e) => ({
        id: e.uid,
        pos: { x: e.x, y: e.y },
        hp: e.hp,
        maxHp: e.maxHp,
        isBoss: Boolean(e.template.isBoss),
        element: e.template.element,
      }));

    const lootSnaps: LootSnapshot[] = this.lootDrops.map((l) => ({
      id: l.id,
      pos: { x: l.x, y: l.y },
      value: l.value,
      kind: l.kind,
    }));

    for (const ally of this.allies) {
      const arch = ALLY_ARCHETYPES[ally.id];
      if (ally.hp <= 0) {
        // Tự hồi phục chậm khi hỏng chốt để không biến mất vĩnh viễn
        ally.hp = Math.min(ally.maxHp, ally.hp + dt * 4);
        ally.sprite.setAlpha(0.35);
        continue;
      }
      ally.sprite.setAlpha(1);
      ally.attackCd = Math.max(0, ally.attackCd - dt);
      ally.healCd = Math.max(0, ally.healCd - dt);
      ally.decisionTimer -= dt;
      ally.barkTimer = Math.max(0, ally.barkTimer - dt);
      if (ally.barkTimer <= 0) {
        ally.barkText.setVisible(false);
      }

      if (ally.decisionTimer <= 0) {
        ally.decisionTimer = 0.25;
        const ctx: AIDecisionContext = {
          self: {
            id: ally.id,
            personality: arch.personality,
            pos: { x: ally.x, y: ally.y },
            hp: ally.hp,
            maxHp: ally.maxHp,
            attackRange: arch.attackRange,
            healCooldownRemaining: ally.healCd,
            canHeal: arch.healAmount > 0,
          },
          player: playerSnap,
          party: partySnaps,
          enemies: enemySnaps,
          lootDrops: lootSnaps,
          isSafeZone: this.mapDef.isSafeZone,
        };
        const prevType = ally.currentAction.type;
        ally.currentAction = evaluateAllyDecision(ctx);
        if (ally.currentAction.type !== prevType) {
          const bark = CONTENT.allies[ally.id].barks[ally.currentAction.type];
          if (bark) {
            ally.barkText.setText(bark).setVisible(true);
            ally.barkTimer = 2.1;
          }
        }
      }

      const act = ally.currentAction;
      if (act.type === 'heal_ally' && ally.healCd <= 0 && arch.healAmount > 0) {
        const targetId = act.targetId;
        if (targetId === 'player') {
          save.hp = Math.min(stats.maxHp, save.hp + arch.healAmount);
          this.spawnFloatingText(this.playerX, this.playerY - 30, `+${arch.healAmount} (Mộc Tĩnh)`, '#7bf1a8');
        } else {
          const other = this.allies.find((o) => o.id === targetId);
          if (other) {
            other.hp = Math.min(other.maxHp, other.hp + arch.healAmount);
            this.spawnFloatingText(other.x, other.y - 26, `+${arch.healAmount}`, '#7bf1a8');
          }
        }
        ally.healCd = arch.healCooldownSec;
        sound.playHeal();
        this.spawnRingVfx(ally.x, ally.y, 44, 0x7bf1a8);
      } else if (act.type === 'pickup_loot' && act.targetId) {
        const lIdx = this.lootDrops.findIndex((l) => l.id === act.targetId);
        if (lIdx !== -1) {
          const targetLoot = this.lootDrops[lIdx];
          this.moveEntityToward(ally, { x: targetLoot.x, y: targetLoot.y }, arch.moveSpeed, dt, 15);
          if (distBetween({ x: ally.x, y: ally.y }, { x: targetLoot.x, y: targetLoot.y }) <= 28) {
            this.collectLoot(lIdx, CONTENT.allies[ally.id].name);
          }
        }
      } else if ((act.type === 'charge_attack' || act.type === 'attack') && act.targetId) {
        const targetEnemy = this.enemies.find((e) => e.uid === act.targetId && e.alive);
        if (targetEnemy) {
          const d = distBetween({ x: ally.x, y: ally.y }, { x: targetEnemy.x, y: targetEnemy.y });
          if (d > arch.attackRange) {
            this.moveEntityToward(ally, { x: targetEnemy.x, y: targetEnemy.y }, arch.moveSpeed, dt, 15);
          } else if (ally.attackCd <= 0) {
            ally.attackCd = arch.attackCooldownSec;
            const effectiveAtk = Math.round(arch.atk * allyAtkMult);
            if (arch.attackRange > 100) {
              const dx = targetEnemy.x - ally.x;
              const dy = targetEnemy.y - ally.y;
              const len = Math.max(1, Math.hypot(dx, dy));
              this.spawnProjectile({
                fromPlayerOrAlly: true,
                x: ally.x,
                y: ally.y,
                dir: { x: dx / len, y: dy / len },
                speed: 360,
                life: 0.75,
                element: arch.element,
                atk: effectiveAtk,
                powerMultiplier: 1.0,
              });
            } else {
              this.spawnRingVfx(targetEnemy.x, targetEnemy.y, 30, ELEMENT_INFO[arch.element].colorInt);
              this.damageEnemy(targetEnemy, effectiveAtk, arch.element, 1.0, 0);
            }
          }
        }
      } else if ((act.type === 'retreat' || act.type === 'follow') && act.targetPos) {
        this.moveEntityToward(ally, act.targetPos, arch.moveSpeed, dt, 15);
      }

      ally.sprite.setPosition(ally.x, ally.y);
      ally.hpBg.setPosition(ally.x, ally.y - 26);
      ally.hpBar
        .setPosition(ally.x - 18, ally.y - 26)
        .setScale(Math.max(0, ally.hp / ally.maxHp), 1);
      ally.nameText.setPosition(ally.x, ally.y - 36);
      ally.barkText.setPosition(ally.x, ally.y - 52);
    }
  }

  private updateEnemies(dt: number): void {
    const save = gameState.getData();
    const stats = gameState.getEffectiveStats();
    let bossActive = false;

    for (const enemy of this.enemies) {
      if (!enemy.alive) {
        if (!enemy.template.isBoss) {
          enemy.respawnTimer -= dt;
          if (enemy.respawnTimer <= 0) {
            enemy.alive = true;
            enemy.hp = enemy.maxHp;
            enemy.x = enemy.homeX;
            enemy.y = enemy.homeY;
            enemy.slowTimer = 0;
            enemy.burnTimer = 0;
            enemy.sprite.setVisible(true);
            enemy.hpBg.setVisible(true);
            enemy.hpBar.setVisible(true);
            enemy.label.setVisible(true);
          }
        }
        continue;
      }

      // Thiêu đốt & làm chậm
      if (enemy.slowTimer > 0) {
        enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
        if (enemy.slowTimer <= 0) enemy.slowFactor = 1;
      }
      if (enemy.burnTimer > 0) {
        enemy.burnTimer -= dt;
        enemy.burnTickAccum += dt;
        if (enemy.burnTickAccum >= 1.0) {
          enemy.burnTickAccum -= 1.0;
          const burnDmg = Math.max(1, Math.round(enemy.burnDps));
          enemy.hp -= burnDmg;
          this.spawnFloatingText(enemy.x, enemy.y - 32, `-${burnDmg} Cháy`, '#ff7b54');
          if (enemy.hp <= 0) {
            this.handleEnemyDefeated(enemy);
            continue;
          }
        }
      }

      enemy.attackCd = Math.max(0, enemy.attackCd - dt);
      const distPlayer = distBetween({ x: enemy.x, y: enemy.y }, { x: this.playerX, y: this.playerY });

      // Trùm Sơ Giác: thoại mở đầu & Giai đoạn 2 (< 50% máu)
      if (enemy.template.isBoss) {
        if (distPlayer <= 420) {
          bossActive = true;
          gameState.bossStatus = {
            active: true,
            hp: enemy.hp,
            maxHp: enemy.maxHp,
            phaseTwo: enemy.bossPhaseTwo,
          };
          if (!enemy.bossIntroShown) {
            enemy.bossIntroShown = true;
            inputBridge.openDialog({
              speaker: CONTENT.enemies.boss_awakened,
              subtitle: 'Hệ Thủy • Khôi Lỗi Đầu Tiên Tỉnh Dậy',
              lines: [CONTENT.bossDialog.intro],
              actionLabel: 'Nghênh chiến!',
            });
          }
        }

        if (!enemy.bossPhaseTwo && enemy.hp < enemy.maxHp * 0.5) {
          enemy.bossPhaseTwo = true;
          enemy.sprite.setTexture('boss_awakened_p2');
          sound.playBossPhase();
          this.cameras.main.shake(260, 0.01);
          this.spawnRingVfx(enemy.x, enemy.y, 190, 0x6ee7ff);
          gameState.pushToast(CONTENT.bossDialog.phaseTwo, '#6ee7ff');
          // Đẩy lùi vòng cấm tự giải
          if (distPlayer < 190) {
            const dx = this.playerX - enemy.x;
            const dy = this.playerY - enemy.y;
            const len = Math.max(1, Math.hypot(dx, dy));
            const pushed = resolveMapMovement(
              { x: this.playerX + (dx / len) * 110, y: this.playerY + (dy / len) * 110 },
              18,
              this.mapDef,
            );
            this.playerX = pushed.x;
            this.playerY = pushed.y;
          }
        }
      }

      const aggroRange = enemy.template.isBoss ? 430 : 280;
      const target = this.pickEnemyTarget(enemy, aggroRange);
      if (target) {
        const d = distBetween({ x: enemy.x, y: enemy.y }, { x: target.x, y: target.y });
        const speed =
          enemy.template.moveSpeed *
          enemy.slowFactor *
          (enemy.template.isBoss && enemy.bossPhaseTwo ? 1.28 : 1.0);

        if (d > enemy.template.attackRange) {
          this.moveEntityToward(enemy, { x: target.x, y: target.y }, speed, dt, enemy.template.isBoss ? 28 : 18);
        } else if (enemy.attackCd <= 0) {
          enemy.attackCd = enemy.template.isBoss && enemy.bossPhaseTwo
            ? enemy.template.attackCooldownSec * 0.8
            : enemy.template.attackCooldownSec;
          this.applyEnemyAttack(enemy, target, save.sectId, stats);
        }

        // Kỹ năng đặc biệt của Trùm Sơ Giác
        if (enemy.template.isBoss && bossActive) {
          enemy.bossSpecialCd -= dt;
          if (enemy.bossSpecialCd <= 0) {
            enemy.bossSpecialCd = enemy.bossPhaseTwo ? 4.4 : 5.6;
            if (Math.random() < 0.52) {
              this.castBossFanWave(enemy);
            } else {
              this.castBossFallingStones(enemy);
            }
          }
        }
      } else if (distBetween({ x: enemy.x, y: enemy.y }, { x: enemy.homeX, y: enemy.homeY }) > 24) {
        this.moveEntityToward(enemy, { x: enemy.homeX, y: enemy.homeY }, enemy.template.moveSpeed * 0.7, dt, 18);
      }

      const barW = enemy.template.isBoss ? 72 : 40;
      const offY = enemy.template.isBoss ? -46 : -28;
      enemy.sprite.setPosition(enemy.x, enemy.y);
      enemy.hpBg.setPosition(enemy.x, enemy.y + offY);
      enemy.hpBar
        .setPosition(enemy.x - barW / 2, enemy.y + offY)
        .setScale(Math.max(0, enemy.hp / enemy.maxHp), 1);
      enemy.label.setPosition(enemy.x, enemy.y + offY - 12);
    }

    if (!bossActive && gameState.bossStatus.active) {
      gameState.bossStatus = { ...gameState.bossStatus, active: false };
    }
  }

  private pickEnemyTarget(
    enemy: ActiveEnemy,
    aggroRange: number,
  ): { kind: 'player' } & Vec2 | ({ kind: 'ally'; ally: ActiveAlly } & Vec2) | null {
    let bestDist = aggroRange;
    let best: ({ kind: 'player' } & Vec2) | ({ kind: 'ally'; ally: ActiveAlly } & Vec2) | null = null;

    const dp = distBetween({ x: enemy.x, y: enemy.y }, { x: this.playerX, y: this.playerY });
    if (dp <= bestDist) {
      bestDist = dp;
      best = { kind: 'player', x: this.playerX, y: this.playerY };
    }

    for (const ally of this.allies) {
      if (ally.hp <= 0) continue;
      const da = distBetween({ x: enemy.x, y: enemy.y }, { x: ally.x, y: ally.y });
      // Thiết Xung thu hút đòn tốt hơn một chút khi áp sát
      const effectiveDist = ally.id === 'ally_reckless' ? da * 0.85 : da;
      if (effectiveDist < bestDist) {
        bestDist = effectiveDist;
        best = { kind: 'ally', ally, x: ally.x, y: ally.y };
      }
    }
    return best;
  }

  private applyEnemyAttack(
    enemy: ActiveEnemy,
    target: ({ kind: 'player' } & Vec2) | ({ kind: 'ally'; ally: ActiveAlly } & Vec2),
    sectId: keyof typeof SECTS,
    stats: ReturnType<typeof gameState.getEffectiveStats>,
  ): void {
    if (target.kind === 'player') {
      const save = gameState.getData();
      const resist =
        stats.resistElement === enemy.template.element ? stats.resistBonus : 0;
      const shieldRed = gameState.playerShieldRemaining > 0 ? 0.45 : 0;
      const hit = calculateDamage({
        attackerAtk: enemy.template.atk,
        attackElement: enemy.template.element,
        defenderDef: stats.def,
        defenderElement: SECTS[sectId].element,
        defenderElementResist: resist,
        defenderDamageReduction: shieldRed,
      });
      save.hp -= hit.damage;
      this.spawnFloatingText(this.playerX, this.playerY - 26, `-${hit.damage}`, '#ff6b6b');
      this.playerSprite.setTintFill(0xff7777);
      this.time.delayedCall(90, () => {
        if (this.playerSprite.active) this.playerSprite.clearTint();
      });

      // Phản sát thương khi Tỏa Kim Các bật Đồng Thuẫn
      if (gameState.playerShieldRemaining > 0 && sectId === 'sect_closed') {
        enemy.hp -= 12;
        this.spawnFloatingText(enemy.x, enemy.y - 34, '-12 Phản', '#e8c468');
        if (enemy.hp <= 0) {
          this.handleEnemyDefeated(enemy);
          return;
        }
      }

      if (save.hp <= 0) {
        this.handlePlayerDefeated();
      }
    } else {
      const arch = ALLY_ARCHETYPES[target.ally.id];
      const hit = calculateDamage({
        attackerAtk: enemy.template.atk,
        attackElement: enemy.template.element,
        defenderDef: arch.def,
        defenderElement: arch.element,
      });
      target.ally.hp = Math.max(0, target.ally.hp - hit.damage);
      this.spawnFloatingText(target.ally.x, target.ally.y - 24, `-${hit.damage}`, '#ffa8a8');
    }
  }

  private castBossFanWave(boss: ActiveEnemy): void {
    gameState.pushToast(`Sơ Giác thi triển: ${CONTENT.bossSkills.fanWave}!`, '#6ee7ff');
    const baseAngle = Math.atan2(this.playerY - boss.y, this.playerX - boss.x);
    const count = boss.bossPhaseTwo ? 7 : 5;
    const spread = 0.24;
    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (i - (count - 1) / 2) * spread;
      this.spawnProjectile({
        fromPlayerOrAlly: false,
        x: boss.x,
        y: boss.y,
        dir: { x: Math.cos(angle), y: Math.sin(angle) },
        speed: 245,
        life: 1.9,
        element: 'thuy',
        atk: boss.template.atk,
        powerMultiplier: 0.9,
      });
    }
  }

  private castBossFallingStones(boss: ActiveEnemy): void {
    gameState.pushToast(`Sơ Giác thi triển: ${CONTENT.bossSkills.fallingStones}!`, '#6ee7ff');
    const drops: Vec2[] = [
      { x: this.playerX, y: this.playerY },
      {
        x: this.playerX + Phaser.Math.Between(-110, 110),
        y: this.playerY + Phaser.Math.Between(-90, 90),
      },
    ];
    if (boss.bossPhaseTwo) {
      drops.push({
        x: this.playerX + Phaser.Math.Between(-140, 140),
        y: this.playerY + Phaser.Math.Between(-110, 110),
      });
    }
    for (const pt of drops) {
      const clamped = resolveMapMovement(pt, 48, this.mapDef);
      const circle = this.add.circle(clamped.x, clamped.y, 56, 0x4ea8de, 0.18).setDepth(5);
      const ring = this.add.circle(clamped.x, clamped.y, 56, 0x4ea8de, 0).setStrokeStyle(2.5, 0x8be9fd, 0.9).setDepth(6);
      this.telegraphs.push({
        x: clamped.x,
        y: clamped.y,
        radius: 56,
        remaining: 1.15,
        maxTime: 1.15,
        atk: boss.template.atk,
        element: 'thuy',
        circle,
        ring,
      });
    }
  }

  private updateTelegraphs(dt: number): void {
    const save = gameState.getData();
    const stats = gameState.getEffectiveStats();
    for (let i = this.telegraphs.length - 1; i >= 0; i--) {
      const tz = this.telegraphs[i];
      tz.remaining -= dt;
      const progress = 1 - Math.max(0, tz.remaining / tz.maxTime);
      tz.circle.setScale(0.25 + progress * 0.75);
      if (tz.remaining <= 0) {
        tz.circle.destroy();
        tz.ring.destroy();
        this.telegraphs.splice(i, 1);

        this.spawnRingVfx(tz.x, tz.y, tz.radius, 0x4ea8de);
        sound.playHit(false);
        if (distBetween({ x: this.playerX, y: this.playerY }, { x: tz.x, y: tz.y }) <= tz.radius + 14) {
          const resist = stats.resistElement === tz.element ? stats.resistBonus : 0;
          const shieldRed = gameState.playerShieldRemaining > 0 ? 0.45 : 0;
          const hit = calculateDamage({
            attackerAtk: tz.atk,
            attackElement: tz.element,
            defenderDef: stats.def,
            defenderElement: SECTS[save.sectId].element,
            powerMultiplier: 1.15,
            defenderElementResist: resist,
            defenderDamageReduction: shieldRed,
          });
          save.hp -= hit.damage;
          this.spawnFloatingText(this.playerX, this.playerY - 28, `-${hit.damage}`, '#ff6b6b');
          if (save.hp <= 0) {
            this.handlePlayerDefeated();
            return;
          }
        }
      }
    }
  }

  private spawnProjectile(opts: {
    fromPlayerOrAlly: boolean;
    x: number;
    y: number;
    dir: Vec2;
    speed: number;
    life: number;
    element: ElementType;
    atk: number;
    powerMultiplier: number;
    armorPierce?: number;
    burnDps?: number;
    burnDurationSec?: number;
  }): void {
    const sprite = this.add.image(opts.x, opts.y, `proj_${opts.element}`).setDepth(14);
    this.projectiles.push({
      fromPlayerOrAlly: opts.fromPlayerOrAlly,
      x: opts.x,
      y: opts.y,
      vx: opts.dir.x * opts.speed,
      vy: opts.dir.y * opts.speed,
      life: opts.life,
      radius: 12,
      element: opts.element,
      atk: opts.atk,
      powerMultiplier: opts.powerMultiplier,
      armorPierce: opts.armorPierce,
      burnDps: opts.burnDps,
      burnDurationSec: opts.burnDurationSec,
      sprite,
    });
  }

  private updateProjectiles(dt: number): void {
    const save = gameState.getData();
    const stats = gameState.getEffectiveStats();
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.sprite.setPosition(p.x, p.y);

      let hitWall = false;
      for (const obs of this.mapDef.obstacles) {
        if (isPointInRect({ x: p.x, y: p.y }, obs)) {
          hitWall = true;
          break;
        }
      }

      if (p.life <= 0 || hitWall) {
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.fromPlayerOrAlly) {
        let consumed = false;
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const hitDist = enemy.template.isBoss ? 38 : 24;
          if (distBetween({ x: p.x, y: p.y }, { x: enemy.x, y: enemy.y }) <= hitDist) {
            this.damageEnemy(enemy, p.atk, p.element, p.powerMultiplier, p.armorPierce ?? 0);
            if (p.burnDps && p.burnDurationSec && enemy.alive) {
              enemy.burnDps = p.burnDps;
              enemy.burnTimer = p.burnDurationSec;
              enemy.burnTickAccum = 0;
              this.spawnFloatingText(enemy.x, enemy.y - 38, 'Thiêu đốt!', '#ff7b54');
            }
            consumed = true;
            break;
          }
        }
        if (consumed) {
          p.sprite.destroy();
          this.projectiles.splice(i, 1);
        }
      } else {
        if (distBetween({ x: p.x, y: p.y }, { x: this.playerX, y: this.playerY }) <= 24) {
          const resist = stats.resistElement === p.element ? stats.resistBonus : 0;
          const shieldRed = gameState.playerShieldRemaining > 0 ? 0.45 : 0;
          const hit = calculateDamage({
            attackerAtk: p.atk,
            attackElement: p.element,
            defenderDef: stats.def,
            defenderElement: SECTS[save.sectId].element,
            powerMultiplier: p.powerMultiplier,
            defenderElementResist: resist,
            defenderDamageReduction: shieldRed,
          });
          save.hp -= hit.damage;
          this.spawnFloatingText(this.playerX, this.playerY - 26, `-${hit.damage}`, '#ff6b6b');
          p.sprite.destroy();
          this.projectiles.splice(i, 1);
          if (save.hp <= 0) {
            this.handlePlayerDefeated();
            return;
          }
        }
      }
    }
  }

  private handlePlayerDefeated(): void {
    this.transitionLocked = true;
    gameState.respawnInTown();
    gameState.pushToast('Bạn đã bị đánh gục và được đưa về Thành Lam Lư hồi phục!', '#ff8787');
    this.time.delayedCall(350, () => {
      this.scene.start(SCENE_KEYS.TOWN);
    });
  }

  private useConsumableItem(itemId: 'pot_heal_small' | 'pot_ally_oil'): void {
    const res = gameState.useConsumable(itemId);
    if (!res.used) {
      gameState.pushToast(`Hết ${CONTENT.items[itemId].name}! Hãy mua tại Bà Tư Chợ Đá.`, '#ffa8a8');
      return;
    }
    sound.playHeal();
    this.spawnFloatingText(this.playerX, this.playerY - 30, `+${res.healAmount} HP`, '#7bf1a8');
    if (res.healParty) {
      for (const ally of this.allies) {
        ally.hp = Math.min(ally.maxHp, ally.hp + res.healAmount);
        this.spawnFloatingText(ally.x, ally.y - 26, `+${res.healAmount}`, '#7bf1a8');
      }
    }
  }

  private findNearestNpc(maxDist: number): ActiveNpc | null {
    let best: ActiveNpc | null = null;
    let bestD = maxDist;
    for (const npc of this.npcs) {
      const d = distBetween({ x: this.playerX, y: this.playerY }, { x: npc.def.x, y: npc.def.y });
      if (d <= bestD) {
        bestD = d;
        best = npc;
      }
    }
    return best;
  }

  private findNearestPortal(maxDist: number): PortalDef | null {
    let best: PortalDef | null = null;
    let bestD = maxDist;
    for (const portal of this.mapDef.portals) {
      const cx = portal.x + portal.w / 2;
      const cy = portal.y + portal.h / 2;
      const d = distBetween({ x: this.playerX, y: this.playerY }, { x: cx, y: cy });
      if (d <= bestD) {
        bestD = d;
        best = portal;
      }
    }
    return best;
  }

  private checkNearbyInteractables(): void {
    const npc = this.findNearestNpc(88);
    if (npc) {
      const meta = CONTENT.npcs[npc.def.id];
      gameState.nearbyInteractLabel = `Trò chuyện: ${meta?.name ?? npc.def.id}`;
      return;
    }
    const portal = this.findNearestPortal(95);
    if (portal) {
      gameState.nearbyInteractLabel = `Đi tới: ${CONTENT.maps[portal.targetMap].name}`;
      return;
    }
    gameState.nearbyInteractLabel = null;
  }

  private tryInteract(): void {
    const npc = this.findNearestNpc(92);
    if (npc) {
      sound.playUiClick();
      this.interactWithNpc(npc.def);
      return;
    }
    const portal = this.findNearestPortal(98);
    if (portal) {
      this.travelToMap(portal.targetMap, { x: portal.targetX, y: portal.targetY });
    }
  }

  private interactWithNpc(npc: NpcPlacement): void {
    const meta = CONTENT.npcs[npc.id];
    const quests = gameState.getData().quests;

    if (npc.role === 'merchant') {
      inputBridge.openDialog({
        speaker: meta.name,
        subtitle: meta.title,
        lines: [CONTENT.npcDialog.merchantGreeting],
        actionLabel: 'Mở tiệm mua / bán',
        onAction: () => inputBridge.openShop(),
      });
      return;
    }

    if (npc.role === 'foundry') {
      inputBridge.openDialog({
        speaker: meta.name,
        subtitle: meta.title,
        lines: CONTENT.npcDialog.foundry,
      });
      return;
    }

    if (npc.role === 'guard') {
      inputBridge.openDialog({
        speaker: meta.name,
        subtitle: meta.title,
        lines: CONTENT.npcDialog.guard,
      });
      return;
    }

    if (npc.role === 'blacksmith') {
      const q = quests.quest_blacksmith;
      if (q.status === 'not_started') {
        inputBridge.openDialog({
          speaker: meta.name,
          subtitle: meta.title,
          lines: CONTENT.npcDialog.blacksmithStart,
          actionLabel: 'Nhận nhiệm vụ: Lò Than Chưa Tắt',
          onAction: () => {
            gameState.acceptQuest('quest_blacksmith');
            gameState.pushToast('Đã nhận nhiệm vụ: Lò Than Chưa Tắt (0/3 Quặng Linh Thiết)', '#ffd166');
            this.refreshNpcMarkers();
          },
        });
      } else if (q.status === 'active') {
        inputBridge.openDialog({
          speaker: meta.name,
          subtitle: `${meta.title} • Tiến độ ${q.count}/${q.targetCount}`,
          lines: [CONTENT.npcDialog.blacksmithActive],
        });
      } else if (q.status === 'ready') {
        inputBridge.openDialog({
          speaker: meta.name,
          subtitle: meta.title,
          lines: CONTENT.npcDialog.blacksmithReady,
          actionLabel: 'Trả nhiệm vụ & nhận Đao Rèn Lão Bính',
          onAction: () => {
            const res = gameState.turnInQuest('quest_blacksmith');
            if (res.completed) {
              sound.playLevelUp();
              gameState.pushToast(
                `Hoàn thành "Lò Than Chưa Tắt"! Nhận Đao Rèn Lão Bính + ${res.silver} Bạc + ${res.xp} KN`,
                '#7bf1a8',
              );
              this.refreshNpcMarkers();
              this.onQuestCompleted('quest_blacksmith');
            }
          },
        });
      } else {
        inputBridge.openDialog({
          speaker: meta.name,
          subtitle: meta.title,
          lines: [CONTENT.npcDialog.blacksmithDone],
        });
      }
      return;
    }

    if (npc.role === 'guide') {
      const q = quests.quest_hallucination;
      if (q.status === 'not_started') {
        inputBridge.openDialog({
          speaker: meta.name,
          subtitle: meta.title,
          lines: CONTENT.npcDialog.guideStart,
          actionLabel: 'Tin lời Bách Thông & lên lối bắc',
          onAction: () => {
            gameState.acceptQuest('quest_hallucination');
            gameState.pushToast('Đã nhận nhiệm vụ: Bản Đồ Không Có Thật (Đi lên lối cụt phía bắc)', '#ffd166');
            this.refreshNpcMarkers();
          },
        });
      } else if (q.status === 'active') {
        inputBridge.openDialog({
          speaker: meta.name,
          subtitle: meta.title,
          lines: [CONTENT.npcDialog.guideActive],
        });
      } else if (q.status === 'ready') {
        inputBridge.openDialog({
          speaker: meta.name,
          subtitle: meta.title,
          lines: CONTENT.npcDialog.guideReady,
          actionLabel: 'Nhận Ngọc Thủy Mạch tạ lỗi',
          onAction: () => {
            const res = gameState.turnInQuest('quest_hallucination');
            if (res.completed) {
              sound.playLevelUp();
              gameState.pushToast(
                `Hoàn thành "Bản Đồ Không Có Thật"! Nhận Ngọc Thủy Mạch + ${res.silver} Bạc + ${res.xp} KN`,
                '#8be9fd',
              );
              this.refreshNpcMarkers();
            }
          },
        });
      } else {
        inputBridge.openDialog({
          speaker: meta.name,
          subtitle: meta.title,
          lines: [CONTENT.npcDialog.guideDone],
        });
      }
    }
  }

  protected onQuestCompleted(_questId: string): void {
    // Hook để TownScene thắp sáng lại Xưởng Rèn Tắt Lửa
  }

  private checkPortals(): void {
    if (this.portalCooldown > 0) return;
    for (const portal of this.mapDef.portals) {
      if (isPointInRect({ x: this.playerX, y: this.playerY }, portal)) {
        this.travelToMap(portal.targetMap, { x: portal.targetX, y: portal.targetY });
        return;
      }
    }
  }

  protected travelToMap(targetMap: MapId, targetPos: Vec2): void {
    if (this.transitionLocked) return;
    this.transitionLocked = true;
    sound.playPortal();
    this.syncSaveFromRuntime();
    gameState.setMap(targetMap, targetPos);
    this.scene.start(getSceneKeyForMap(targetMap));
  }

  private findNearestAliveEnemy(pos: Vec2, maxDist: number): ActiveEnemy | null {
    let best: ActiveEnemy | null = null;
    let bestD = maxDist;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = distBetween(pos, { x: e.x, y: e.y });
      if (d <= bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  private moveEntityToward(
    entity: { x: number; y: number },
    target: Vec2,
    speed: number,
    dt: number,
    radius: number,
  ): void {
    const dx = target.x - entity.x;
    const dy = target.y - entity.y;
    const d = Math.hypot(dx, dy);
    if (d < 4) return;
    const step = Math.min(d, speed * dt);
    const next = resolveMapMovement(
      { x: entity.x + (dx / d) * step, y: entity.y + (dy / d) * step },
      radius,
      this.mapDef,
    );
    entity.x = next.x;
    entity.y = next.y;
  }

  protected spawnRingVfx(x: number, y: number, radius: number, colorInt: number): void {
    const ring = this.add
      .circle(x, y, 14, colorInt, 0.22)
      .setStrokeStyle(3, colorInt, 0.9)
      .setDepth(18);
    this.tweens.add({
      targets: ring,
      scale: Math.max(1, radius / 14),
      alpha: 0,
      duration: 280,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  protected spawnFloatingText(x: number, y: number, text: string, color: string): void {
    const t = this.add
      .text(x, y, text, {
        fontSize: '13px',
        fontStyle: 'bold',
        color,
        stroke: '#120e0b',
        strokeThickness: 3,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      })
      .setOrigin(0.5)
      .setDepth(25);
    this.tweens.add({
      targets: t,
      y: y - 34,
      alpha: 0,
      duration: 780,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  private syncSaveFromRuntime(): void {
    const d = gameState.getData();
    d.playerPos = { x: Math.round(this.playerX), y: Math.round(this.playerY) };
    d.allies = this.allies.map((a) => ({
      id: a.id,
      hp: Math.max(1, Math.round(a.hp)),
    }));
  }

  private syncHudState(): void {
    gameState.allyStatuses = this.allies.map((a) => ({
      id: a.id,
      hp: Math.round(a.hp),
      maxHp: a.maxHp,
      actionType: a.currentAction.type,
      actionLabel: ACTION_LABELS[a.currentAction.type] ?? a.currentAction.type,
    }));
    gameState.notify();
  }
}
