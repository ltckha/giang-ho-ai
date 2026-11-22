import Phaser from 'phaser';
import { resolveSkillElement } from '../core/combat';
import { CONTENT } from '../core/contentRegistry';
import { ELEMENT_INFO } from '../core/elements';
import { countInventoryItem } from '../core/inventory';
import { SECTS, getSectSkills } from '../core/skills';
import { gameState } from '../game/gameState';
import { inputBridge, type DialogRequest, type UiModalHandlers } from '../game/inputBridge';
import { SCENE_KEYS } from '../game/sceneKeys';
import { sound } from '../game/sound';
import { renderModalContent, type ActiveModal } from '../ui/modals';

/**
 * Scene giao diện song song (HUD, trạng thái 3 đồng đội AI, thanh máu Trùm,
 * cần điều khiển chạm ảo, 4 nút chiêu thức và các cửa sổ Tiệm / Túi đồ / Đối thoại / Nhiệm vụ).
 */
export class UIScene extends Phaser.Scene {
  private rootEl: HTMLDivElement | null = null;
  private modalHostEl: HTMLDivElement | null = null;
  private activeModal: ActiveModal = null;
  private unsubState: (() => void) | null = null;
  private uiHandlers!: UiModalHandlers;

  // Tham chiếu nhanh để cập nhật HUD mượt không giật
  private playerHeaderEl!: HTMLDivElement;
  private playerHpFillEl!: HTMLDivElement;
  private playerHpTextEl!: HTMLDivElement;
  private playerXpFillEl!: HTMLDivElement;
  private currencyEl!: HTMLDivElement;
  private alliesWrapEl!: HTMLDivElement;
  private alliesToggleBtnEl!: HTMLButtonElement;
  private alliesBoxEl!: HTMLDivElement;
  private mapPillEl!: HTMLDivElement;
  private mobileMapPillEl!: HTMLDivElement;
  private questPillEl!: HTMLDivElement;
  private bossBarEl!: HTMLDivElement;
  private bossTitleEl!: HTMLDivElement;
  private bossFillEl!: HTMLDivElement;
  private bossHpTextEl!: HTMLDivElement;
  private toastsEl!: HTMLDivElement;
  private utilBarEl!: HTMLDivElement;
  private menuToggleBtnEl!: HTMLButtonElement;
  private interactBtnEl!: HTMLButtonElement;
  private potSmallBtnEl!: HTMLButtonElement;
  private potOilBtnEl!: HTMLButtonElement;
  private muteBtnEl!: HTMLButtonElement;
  private skillBtns: Array<{
    btn: HTMLButtonElement;
    elDot: HTMLSpanElement;
    nameEl: HTMLSpanElement;
    cdEl: HTMLDivElement;
  }> = [];

  // Trạng thái thu gọn cho màn hình điện thoại cầm dọc
  private alliesExpanded = true;
  private mobileMenuOpen = false;
  private lastViewportNarrow = false;
  private resizeListener: (() => void) | null = null;

  // Trạng thái cần chạm ảo
  private joystickPointerId: number | null = null;
  private joystickCenter = { x: 0, y: 0 };
  private joystickKnobEl: HTMLDivElement | null = null;

  constructor() {
    super({ key: SCENE_KEYS.UI });
  }

  private isNarrowViewport(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 680;
  }

  public create(): void {
    this.activeModal = null;
    inputBridge.isModalOpen = false;
    this.lastViewportNarrow = this.isNarrowViewport();
    this.alliesExpanded = !this.lastViewportNarrow;
    this.mobileMenuOpen = false;
    this.mountHud();
    this.registerUiBridge();
    this.unsubState = gameState.subscribe(() => this.refreshHud());
    this.refreshHud();

    this.resizeListener = () => {
      const narrow = this.isNarrowViewport();
      if (narrow !== this.lastViewportNarrow) {
        this.lastViewportNarrow = narrow;
        this.alliesExpanded = !narrow;
        this.mobileMenuOpen = false;
        this.syncCollapsibleState();
      }
    };
    window.addEventListener('resize', this.resizeListener);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.resizeListener) {
        window.removeEventListener('resize', this.resizeListener);
        this.resizeListener = null;
      }
      if (this.unsubState) {
        this.unsubState();
        this.unsubState = null;
      }
      inputBridge.unregisterUi(this.uiHandlers);
      inputBridge.clearTouchMove();
      inputBridge.isModalOpen = false;
      if (this.rootEl) {
        this.rootEl.remove();
        this.rootEl = null;
      }
    });
  }

  public update(): void {
    // Cập nhật vòng hồi chiêu mượt mỗi khung hình
    const cds = gameState.skillCooldowns;
    for (let i = 0; i < 4; i++) {
      const slot = this.skillBtns[i];
      if (!slot) continue;
      if (cds[i] > 0.05) {
        slot.cdEl.style.display = 'flex';
        slot.cdEl.textContent = cds[i] >= 1 ? `${Math.ceil(cds[i])}` : cds[i].toFixed(1);
      } else {
        slot.cdEl.style.display = 'none';
      }
    }
  }

  private registerUiBridge(): void {
    this.uiHandlers = {
      openDialog: (req: DialogRequest) => this.setModal({ kind: 'dialog', req }),
      openShop: () => this.setModal({ kind: 'shop', tab: 'buy' }),
      openBag: () => this.setModal({ kind: 'bag' }),
      openForge: () => this.setModal({ kind: 'forge', slot: 'weapon', selectedUids: [] }),
      openGuildBoard: () => this.setModal({ kind: 'guild_board', tab: 'ranks' }),
      openQuests: () => this.setModal({ kind: 'quests' }),
      openElementsGuide: () => this.setModal({ kind: 'elements' }),
      openVictory: () => this.setModal({ kind: 'victory' }),
      closeAll: () => this.setModal(null),
    };
    inputBridge.registerUi(this.uiHandlers);
  }

  private setModal(modal: ActiveModal): void {
    this.activeModal = modal;
    inputBridge.isModalOpen = modal !== null;
    if (modal !== null) {
      inputBridge.clearTouchMove();
      if (this.mobileMenuOpen) {
        this.mobileMenuOpen = false;
        this.syncCollapsibleState();
      }
    }
    this.renderModal();
  }

  private syncCollapsibleState(): void {
    if (this.alliesWrapEl) {
      this.alliesWrapEl.classList.toggle('gh-collapsed', !this.alliesExpanded);
    }
    if (this.alliesToggleBtnEl) {
      this.alliesToggleBtnEl.setAttribute('aria-expanded', String(this.alliesExpanded));
    }
    if (this.utilBarEl) {
      this.utilBarEl.classList.toggle('gh-open', this.mobileMenuOpen);
    }
    if (this.menuToggleBtnEl) {
      this.menuToggleBtnEl.setAttribute('aria-expanded', String(this.mobileMenuOpen));
      this.menuToggleBtnEl.textContent = this.mobileMenuOpen ? '✕' : '≡';
    }
  }

  private renderModal(): void {
    if (!this.modalHostEl) return;
    renderModalContent(this.modalHostEl, this.activeModal, (next) => this.setModal(next));
  }

  private mountHud(): void {
    if (this.rootEl) this.rootEl.remove();
    const container = document.getElementById('game-container');
    if (!container) return;

    const root = document.createElement('div');
    root.className = 'gh-overlay';
    root.id = 'gh-hud-overlay';

    // 1. Góc trên-trái: thông tin nhân vật + 3 đồng đội AI khôi lỗi (thu gọn được trên màn hình hẹp)
    const topLeft = document.createElement('div');
    topLeft.className = 'gh-hud-top-left';

    const playerCard = document.createElement('div');
    playerCard.className = 'gh-card gh-player-card';
    this.playerHeaderEl = document.createElement('div');
    this.playerHeaderEl.className = 'gh-row';

    const hpTrack = document.createElement('div');
    hpTrack.className = 'gh-bar-track';
    this.playerHpFillEl = document.createElement('div');
    this.playerHpFillEl.className = 'gh-bar-fill';
    this.playerHpFillEl.style.background = 'linear-gradient(90deg, #d94848, #ff6b6b)';
    hpTrack.appendChild(this.playerHpFillEl);

    this.playerHpTextEl = document.createElement('div');
    this.playerHpTextEl.className = 'gh-bar-text';

    const xpTrack = document.createElement('div');
    xpTrack.className = 'gh-bar-track';
    xpTrack.style.height = '5px';
    this.playerXpFillEl = document.createElement('div');
    this.playerXpFillEl.className = 'gh-bar-fill';
    this.playerXpFillEl.style.background = '#4cc9f0';
    xpTrack.appendChild(this.playerXpFillEl);

    this.currencyEl = document.createElement('div');
    this.currencyEl.className = 'gh-currency-row';

    playerCard.append(
      this.playerHeaderEl,
      hpTrack,
      this.playerHpTextEl,
      xpTrack,
      this.currencyEl,
    );

    this.alliesWrapEl = document.createElement('div');
    this.alliesWrapEl.className = 'gh-allies-wrap';

    this.alliesToggleBtnEl = document.createElement('button');
    this.alliesToggleBtnEl.type = 'button';
    this.alliesToggleBtnEl.className = 'gh-allies-toggle';
    this.alliesToggleBtnEl.dataset.testid = 'allies-toggle';
    this.alliesToggleBtnEl.onclick = () => {
      sound.playUiClick();
      this.alliesExpanded = !this.alliesExpanded;
      this.syncCollapsibleState();
      this.refreshHud();
    };

    const alliesCard = document.createElement('div');
    alliesCard.className = 'gh-card gh-allies-box';
    alliesCard.dataset.testid = 'allies-box';
    this.alliesBoxEl = alliesCard;

    this.alliesWrapEl.append(this.alliesToggleBtnEl, alliesCard);
    topLeft.append(playerCard, this.alliesWrapEl);
    root.appendChild(topLeft);

    // 2. Giữa trên: tên bản đồ + nhiệm vụ hiện tại + thanh máu Trùm + thông báo nổi (không đè nút bình)
    const topCenter = document.createElement('div');
    topCenter.className = 'gh-hud-top-center';

    this.mapPillEl = document.createElement('div');
    this.mapPillEl.className = 'gh-map-pill';
    this.questPillEl = document.createElement('div');
    this.questPillEl.className = 'gh-quest-pill';

    this.bossBarEl = document.createElement('div');
    this.bossBarEl.className = 'gh-boss-bar';
    this.bossBarEl.style.display = 'none';
    this.bossTitleEl = document.createElement('div');
    this.bossTitleEl.style.fontSize = '12.5px';
    this.bossTitleEl.style.fontWeight = '700';
    this.bossTitleEl.style.color = '#8be9fd';
    const bossTrack = document.createElement('div');
    bossTrack.className = 'gh-bar-track';
    bossTrack.style.height = '11px';
    this.bossFillEl = document.createElement('div');
    this.bossFillEl.className = 'gh-bar-fill';
    this.bossFillEl.style.background = 'linear-gradient(90deg, #2b8cbe, #6ee7ff)';
    bossTrack.appendChild(this.bossFillEl);
    this.bossHpTextEl = document.createElement('div');
    this.bossHpTextEl.className = 'gh-bar-text';
    this.bossBarEl.append(this.bossTitleEl, bossTrack, this.bossHpTextEl);

    this.toastsEl = document.createElement('div');
    this.toastsEl.className = 'gh-toasts';

    topCenter.append(this.mapPillEl, this.questPillEl, this.bossBarEl, this.toastsEl);
    root.appendChild(topCenter);

    // 3. Góc trên-phải: nút tiện ích (gom vào nút "≡" trên màn hình hẹp)
    const topRight = document.createElement('div');
    topRight.className = 'gh-hud-top-right';

    const mobileTopControls = document.createElement('div');
    mobileTopControls.className = 'gh-mobile-top-controls';

    this.mobileMapPillEl = document.createElement('div');
    this.mobileMapPillEl.className = 'gh-map-pill gh-map-pill-mobile';

    this.menuToggleBtnEl = document.createElement('button');
    this.menuToggleBtnEl.type = 'button';
    this.menuToggleBtnEl.className = 'gh-icon-btn gh-menu-toggle-btn';
    this.menuToggleBtnEl.dataset.testid = 'mobile-menu-toggle';
    this.menuToggleBtnEl.setAttribute('aria-label', 'Mở thực đơn');
    this.menuToggleBtnEl.textContent = '≡';
    this.menuToggleBtnEl.onclick = () => {
      sound.playUiClick();
      this.mobileMenuOpen = !this.mobileMenuOpen;
      this.syncCollapsibleState();
    };
    mobileTopControls.append(this.mobileMapPillEl, this.menuToggleBtnEl);

    this.utilBarEl = document.createElement('div');
    this.utilBarEl.className = 'gh-util-bar';
    this.utilBarEl.dataset.testid = 'util-bar';

    const makeUtilBtn = (label: string, onClick: () => void): HTMLButtonElement => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'gh-icon-btn';
      b.textContent = label;
      b.onclick = () => {
        sound.playUiClick();
        if (this.mobileMenuOpen) {
          this.mobileMenuOpen = false;
          this.syncCollapsibleState();
        }
        onClick();
      };
      return b;
    };

    const bagBtn = makeUtilBtn('Túi đồ (I)', () => this.setModal({ kind: 'bag' }));
    const questBtn = makeUtilBtn('Nhiệm vụ (M)', () => this.setModal({ kind: 'quests' }));
    const guildBtn = makeUtilBtn('Bang Hội (G)', () =>
      this.setModal({ kind: 'guild_board', tab: 'ranks' }),
    );
    const elemBtn = makeUtilBtn('Ngũ Hành (H)', () => this.setModal({ kind: 'elements' }));
    const townBtn = makeUtilBtn('Về Thành', () => inputBridge.triggerReturnToTown());
    this.muteBtnEl = makeUtilBtn('Âm: Bật', () => {
      const muted = sound.toggleMute();
      this.muteBtnEl.textContent = muted ? 'Âm: Tắt' : 'Âm: Bật';
    });
    const saveBtn = makeUtilBtn('Lưu', () => {
      const ok = gameState.persist(true);
      gameState.pushToast(ok ? 'Đã lưu tiến độ vào máy!' : 'Không thể lưu lúc này.', '#7bf1a8');
    });
    const menuBtn = makeUtilBtn('Menu', () => inputBridge.triggerReturnToTitle());

    this.utilBarEl.append(
      bagBtn,
      questBtn,
      guildBtn,
      elemBtn,
      townBtn,
      this.muteBtnEl,
      saveBtn,
      menuBtn,
    );
    topRight.append(mobileTopControls, this.utilBarEl);
    root.appendChild(topRight);

    // 4. Góc dưới-trái: Cần điều khiển chạm ảo (Virtual Joystick)
    const joyZone = document.createElement('div');
    joyZone.className = 'gh-joystick-zone';
    joyZone.setAttribute('aria-label', 'Cần di chuyển cảm ứng');
    const knob = document.createElement('div');
    knob.className = 'gh-joystick-knob';
    const hint = document.createElement('div');
    hint.className = 'gh-joystick-hint';
    hint.textContent = 'Kéo di chuyển • WASD';
    joyZone.append(knob, hint);
    this.joystickKnobEl = knob;
    this.bindJoystick(joyZone);
    root.appendChild(joyZone);

    this.syncCollapsibleState();

    // 6. Góc dưới-phải: Tương tác, Bình hồi máu & 4 nút chiêu thức
    const controlsRight = document.createElement('div');
    controlsRight.className = 'gh-controls-right';

    const actionRow = document.createElement('div');
    actionRow.className = 'gh-action-row';

    this.interactBtnEl = document.createElement('button');
    this.interactBtnEl.className = 'gh-interact-btn';
    this.interactBtnEl.style.display = 'none';
    this.interactBtnEl.onclick = () => inputBridge.triggerInteract();

    this.potSmallBtnEl = document.createElement('button');
    this.potSmallBtnEl.className = 'gh-potion-btn';
    this.potSmallBtnEl.onclick = () => inputBridge.triggerPotion('pot_heal_small');

    this.potOilBtnEl = document.createElement('button');
    this.potOilBtnEl.className = 'gh-potion-btn';
    this.potOilBtnEl.onclick = () => inputBridge.triggerPotion('pot_ally_oil');

    actionRow.append(this.interactBtnEl, this.potSmallBtnEl, this.potOilBtnEl);

    const skillsRow = document.createElement('div');
    skillsRow.className = 'gh-skills-row';
    this.skillBtns = [];

    for (let i = 0; i < 4; i++) {
      const slotNum = (i + 1) as 1 | 2 | 3 | 4;
      const btn = document.createElement('button');
      btn.className = 'gh-skill-btn';
      btn.dataset.skillSlot = String(slotNum);

      const keyEl = document.createElement('span');
      keyEl.className = 'gh-skill-key';
      keyEl.textContent = String(slotNum);

      const elDot = document.createElement('span');
      elDot.className = 'gh-skill-el';

      const nameEl = document.createElement('span');
      nameEl.className = 'gh-skill-name';

      const cdEl = document.createElement('div');
      cdEl.className = 'gh-skill-cd';
      cdEl.style.display = 'none';

      btn.append(keyEl, elDot, nameEl, cdEl);
      btn.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        inputBridge.triggerSkill(slotNum);
      });

      skillsRow.appendChild(btn);
      this.skillBtns.push({ btn, elDot, nameEl, cdEl });
    }

    controlsRight.append(actionRow, skillsRow);
    root.appendChild(controlsRight);

    // 7. Vùng chứa Modal
    this.modalHostEl = document.createElement('div');
    root.appendChild(this.modalHostEl);

    container.appendChild(root);
    this.rootEl = root;
  }

  private bindJoystick(zone: HTMLDivElement): void {
    const maxRadius = 36;

    const updateKnob = (clientX: number, clientY: number): void => {
      const dx = clientX - this.joystickCenter.x;
      const dy = clientY - this.joystickCenter.y;
      const dist = Math.hypot(dx, dy);
      const clamped = Math.min(maxRadius, dist);
      const nx = dist > 2 ? (dx / dist) * (clamped / maxRadius) : 0;
      const ny = dist > 2 ? (dy / dist) * (clamped / maxRadius) : 0;
      inputBridge.setTouchMove(nx, ny);
      if (this.joystickKnobEl) {
        this.joystickKnobEl.style.transform = `translate(${nx * maxRadius}px, ${ny * maxRadius}px)`;
      }
    };

    const resetKnob = (): void => {
      this.joystickPointerId = null;
      inputBridge.clearTouchMove();
      if (this.joystickKnobEl) {
        this.joystickKnobEl.style.transform = 'translate(0px, 0px)';
      }
    };

    zone.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      if (this.joystickPointerId !== null) return;
      this.joystickPointerId = ev.pointerId;
      zone.setPointerCapture(ev.pointerId);
      const rect = zone.getBoundingClientRect();
      this.joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      updateKnob(ev.clientX, ev.clientY);
    });

    zone.addEventListener('pointermove', (ev) => {
      if (ev.pointerId !== this.joystickPointerId) return;
      ev.preventDefault();
      updateKnob(ev.clientX, ev.clientY);
    });

    zone.addEventListener('pointerup', (ev) => {
      if (ev.pointerId !== this.joystickPointerId) return;
      resetKnob();
    });

    zone.addEventListener('pointercancel', (ev) => {
      if (ev.pointerId !== this.joystickPointerId) return;
      resetKnob();
    });
  }

  private refreshHud(): void {
    if (!this.rootEl) return;
    const d = gameState.getData();
    const stats = gameState.getEffectiveStats();
    const sectDef = SECTS[d.sectId];
    const sectInfo = CONTENT.sects[d.sectId];
    const elInfo = ELEMENT_INFO[sectDef.element];
    const imbueLabel = stats.imbueElement
      ? ` • C1:${ELEMENT_INFO[stats.imbueElement].label}`
      : '';

    this.playerHeaderEl.innerHTML = `
      <span class="gh-player-name">${sectInfo.name} (Cấp ${d.level})</span>
      <span class="gh-badge" style="background:${elInfo.colorHex}">${elInfo.label}${imbueLabel}</span>
    `;

    const hpPct = Math.max(0, Math.min(100, (d.hp / stats.maxHp) * 100));
    this.playerHpFillEl.style.width = `${hpPct}%`;
    this.playerHpTextEl.textContent = `Máu: ${Math.max(0, Math.round(d.hp))}/${stats.maxHp} • Công ${stats.atk} • Thủ ${stats.def}`;

    const xpNeed = gameState.getXpToNext();
    const xpPct = Math.max(0, Math.min(100, (d.xp / xpNeed) * 100));
    this.playerXpFillEl.style.width = `${xpPct}%`;

    this.currencyEl.innerHTML = `
      <span style="color:#e8c468">Bạc: ${d.silver}</span>
      <span style="color:#8be9fd">Linh Thạch: ${d.spiritStones}</span>
    `;

    // 3 đồng đội AI khôi lỗi + thanh thu gọn tổ đội
    const miniBars = gameState.allyStatuses
      .map((ally) => {
        const pct = Math.max(0, Math.min(100, (ally.hp / ally.maxHp) * 100));
        const col = pct > 55 ? '#59c173' : pct > 25 ? '#ffd166' : '#ef6351';
        return `<span class="gh-ally-mini-track"><span class="gh-ally-mini-fill" style="width:${pct}%;background:${col}"></span></span>`;
      })
      .join('');
    this.alliesToggleBtnEl.innerHTML = `
      <span class="gh-allies-toggle-label">Tổ đội (${gameState.allyStatuses.length})</span>
      <span class="gh-allies-mini-bars">${miniBars}</span>
      <span class="gh-allies-chevron">${this.alliesExpanded ? '▴' : '▾'}</span>
    `;

    this.alliesBoxEl.innerHTML = gameState.allyStatuses
      .map((ally) => {
        const meta = CONTENT.allies[ally.id];
        const pct = Math.max(0, Math.min(100, (ally.hp / ally.maxHp) * 100));
        return `
          <div class="gh-ally-row">
            <div class="gh-row">
              <strong>${meta.name}</strong>
              <span class="gh-ally-action">${ally.actionLabel}</span>
            </div>
            <div class="gh-bar-track" style="height:5px;margin-top:1px">
              <div class="gh-bar-fill" style="width:${pct}%;background:#59c173"></div>
            </div>
          </div>
        `;
      })
      .join('');

    // Bản đồ & nhiệm vụ nổi bật
    const mapName = CONTENT.maps[d.mapId].name;
    this.mapPillEl.textContent = mapName;
    this.mobileMapPillEl.textContent = mapName;
    this.questPillEl.textContent = this.computeActiveQuestHint();

    // Thanh máu Trùm (Sơ Giác hệ Thủy hoặc Vạn Chép hệ Kim)
    if (gameState.bossStatus.active) {
      this.bossBarEl.style.display = 'block';
      const isVanChep = gameState.bossStatus.bossId === 'boss_van_chep';
      const bossName = isVanChep ? CONTENT.enemies.boss_van_chep : CONTENT.enemies.boss_awakened;
      const elemTag = isVanChep ? '[Kim]' : '[Thủy]';
      const phaseTag = gameState.bossStatus.phaseTwo
        ? isVanChep
          ? ' • MỞ KHÓA QUÁ TẢI!'
          : ' • VÒNG CẤM TỰ GIẢI!'
        : '';
      this.bossTitleEl.textContent = `${bossName} ${elemTag}${phaseTag}`;
      this.bossTitleEl.style.color = isVanChep ? '#ffd166' : '#8be9fd';
      this.bossFillEl.style.background = isVanChep
        ? 'linear-gradient(90deg, #c79c44, #ffd166)'
        : 'linear-gradient(90deg, #2b8cbe, #6ee7ff)';
      const bpct = Math.max(
        0,
        Math.min(100, (gameState.bossStatus.hp / gameState.bossStatus.maxHp) * 100),
      );
      this.bossFillEl.style.width = `${bpct}%`;
      this.bossHpTextEl.textContent = `HP: ${Math.max(0, Math.round(gameState.bossStatus.hp))}/${gameState.bossStatus.maxHp}`;
    } else {
      this.bossBarEl.style.display = 'none';
    }

    // Nút tương tác gần NPC / cổng
    if (gameState.nearbyInteractLabel) {
      this.interactBtnEl.style.display = 'inline-block';
      this.interactBtnEl.textContent = `${gameState.nearbyInteractLabel} (E)`;
    } else {
      this.interactBtnEl.style.display = 'none';
    }

    // Số lượng bình hồi máu
    const smallCount = countInventoryItem(d.inventory, 'pot_heal_small');
    const oilCount = countInventoryItem(d.inventory, 'pot_ally_oil');
    this.potSmallBtnEl.innerHTML = `Linh Dịch<span class="gh-key-hint"> (Q)</span> x${smallCount}`;
    this.potOilBtnEl.innerHTML = `Dầu Chốt<span class="gh-key-hint"> (R)</span> x${oilCount}`;

    // Cập nhật 4 nút chiêu thức + hệ Ngũ Hành (có tính Ngọc đổi hệ Chiêu 1)
    const skills = getSectSkills(d.sectId);
    skills.forEach((sk, idx) => {
      const slot = this.skillBtns[idx];
      if (!slot) return;
      const activeEl = resolveSkillElement(sk.slot, sk.element, stats.imbueElement);
      slot.elDot.style.background = ELEMENT_INFO[activeEl].colorHex;
      slot.nameEl.textContent = CONTENT.skills[sk.id].name;
      slot.btn.title = `${CONTENT.skills[sk.id].name} (${ELEMENT_INFO[activeEl].label}): ${CONTENT.skills[sk.id].desc}`;
    });

    // Thông báo nổi
    this.toastsEl.innerHTML = gameState.toasts
      .slice(-2)
      .map(
        (t) => `<div class="gh-toast" style="color:${t.color ?? '#f4ead5'}">${t.text}</div>`,
      )
      .join('');

    // Cập nhật lại nội dung modal nếu đang mở túi đồ / tiệm / lò rèn
    if (
      this.activeModal &&
      (this.activeModal.kind === 'bag' ||
        this.activeModal.kind === 'shop' ||
        this.activeModal.kind === 'forge')
    ) {
      this.renderModal();
    }
  }

  private computeActiveQuestHint(): string {
    const d = gameState.getData();
    const q = d.quests;
    if (q.quest_blacksmith.status === 'ready') {
      return '★ Về Thành Lam Lư trả nhiệm vụ cho Lão Bính!';
    }
    if (q.quest_hallucination.status === 'ready') {
      return '★ Quay lại Ngã Ba Sương Độc chất vấn Bách Thông!';
    }
    if (q.quest_fake_elder.status === 'ready') {
      return '★ Về Thành Bế Các trả Mặt Nạ Giả Thanh cho Bà Hai Quán Trà!';
    }
    if (q.quest_stolen_manual.status === 'ready') {
      return '★ Về Thành Bế Các trả 3 Tập Võ Phổ cho Sư Phụ Kỷ Văn!';
    }
    if (q.quest_seal_breaker.status === 'ready') {
      return '★ Quay lại Cửa Tây Lũng Đại Mạch báo cho Đạo Sĩ Tề Minh!';
    }
    if (d.mainQuestGd2.step >= 1 && d.mainQuestGd2.step <= 6) {
      const stepMeta = CONTENT.mainQuestGd2.steps[d.mainQuestGd2.step];
      return `★ ${stepMeta.title}: ${stepMeta.summary}`;
    }
    if (q.quest_blacksmith.status === 'active') {
      return `NV phụ: Lò Than Chưa Tắt (${q.quest_blacksmith.count}/3 Quặng ngoài Rừng)`;
    }
    if (q.quest_hallucination.status === 'active') {
      return 'NV phụ: Lên Lối Cụt Bắc Rừng Thạch Mạch tìm "Cổ Thụ Chín Gốc"';
    }
    if (q.quest_boss.status === 'completed') {
      return '★ Lên Cổng Bắc Rừng Thạch Mạch vào Thành Bế Các & Lũng Đại Mạch!';
    }
    return 'Mục tiêu: Luyện cấp ở Rừng Thạch Mạch, vào Động Tàn Cơ hoặc lên Thành Bế Các';
  }
}
