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
  private alliesBoxEl!: HTMLDivElement;
  private mapPillEl!: HTMLDivElement;
  private questPillEl!: HTMLDivElement;
  private bossBarEl!: HTMLDivElement;
  private bossTitleEl!: HTMLDivElement;
  private bossFillEl!: HTMLDivElement;
  private bossHpTextEl!: HTMLDivElement;
  private toastsEl!: HTMLDivElement;
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

  // Trạng thái cần chạm ảo
  private joystickPointerId: number | null = null;
  private joystickCenter = { x: 0, y: 0 };
  private joystickKnobEl: HTMLDivElement | null = null;

  constructor() {
    super({ key: SCENE_KEYS.UI });
  }

  public create(): void {
    this.activeModal = null;
    inputBridge.isModalOpen = false;
    this.mountHud();
    this.registerUiBridge();
    this.unsubState = gameState.subscribe(() => this.refreshHud());
    this.refreshHud();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
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
    }
    this.renderModal();
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

    // 1. Góc trên-trái: thông tin nhân vật + 3 đồng đội AI khôi lỗi
    const topLeft = document.createElement('div');
    topLeft.className = 'gh-hud-top-left';

    const playerCard = document.createElement('div');
    playerCard.className = 'gh-card';
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

    const alliesCard = document.createElement('div');
    alliesCard.className = 'gh-card gh-allies-box';
    this.alliesBoxEl = alliesCard;

    topLeft.append(playerCard, alliesCard);
    root.appendChild(topLeft);

    // 2. Giữa trên: tên bản đồ + nhiệm vụ hiện tại + thanh máu Trùm Sơ Giác
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

    topCenter.append(this.mapPillEl, this.questPillEl, this.bossBarEl);
    root.appendChild(topCenter);

    // 3. Góc trên-phải: nút tiện ích
    const topRight = document.createElement('div');
    topRight.className = 'gh-hud-top-right';

    const makeUtilBtn = (label: string, onClick: () => void): HTMLButtonElement => {
      const b = document.createElement('button');
      b.className = 'gh-icon-btn';
      b.textContent = label;
      b.onclick = () => {
        sound.playUiClick();
        onClick();
      };
      return b;
    };

    const bagBtn = makeUtilBtn('Túi đồ (I)', () => this.setModal({ kind: 'bag' }));
    const questBtn = makeUtilBtn('Nhiệm vụ (M)', () => this.setModal({ kind: 'quests' }));
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

    topRight.append(bagBtn, questBtn, elemBtn, townBtn, this.muteBtnEl, saveBtn, menuBtn);
    root.appendChild(topRight);

    // 4. Thông báo nổi (toasts)
    this.toastsEl = document.createElement('div');
    this.toastsEl.className = 'gh-toasts';
    root.appendChild(this.toastsEl);

    // 5. Góc dưới-trái: Cần điều khiển chạm ảo (Virtual Joystick)
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

    // 3 đồng đội AI khôi lỗi
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
    this.mapPillEl.textContent = CONTENT.maps[d.mapId].name;
    this.questPillEl.textContent = this.computeActiveQuestHint();

    // Thanh máu Trùm Sơ Giác
    if (gameState.bossStatus.active) {
      this.bossBarEl.style.display = 'block';
      const phaseTag = gameState.bossStatus.phaseTwo ? ' • VÒNG CẤM TỰ GIẢI!' : '';
      this.bossTitleEl.textContent = `${CONTENT.enemies.boss_awakened} [Thủy]${phaseTag}`;
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
    this.potSmallBtnEl.textContent = `Linh Dịch (Q) x${smallCount}`;
    this.potOilBtnEl.textContent = `Dầu Chốt (R) x${oilCount}`;

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

    // Cập nhật lại nội dung modal nếu đang mở túi đồ / tiệm
    if (this.activeModal && (this.activeModal.kind === 'bag' || this.activeModal.kind === 'shop')) {
      this.renderModal();
    }
  }

  private computeActiveQuestHint(): string {
    const q = gameState.getData().quests;
    if (q.quest_blacksmith.status === 'ready') {
      return '★ Về Thành Lam Lư trả nhiệm vụ cho Lão Bính!';
    }
    if (q.quest_hallucination.status === 'ready') {
      return '★ Quay lại Ngã Ba Sương Độc chất vấn Bách Thông!';
    }
    if (q.quest_blacksmith.status === 'active') {
      return `NV phụ: Lò Than Chưa Tắt (${q.quest_blacksmith.count}/3 Quặng ngoài Rừng)`;
    }
    if (q.quest_hallucination.status === 'active') {
      return 'NV phụ: Lên Lối Cụt Bắc Rừng Thạch Mạch tìm "Cổ Thụ Chín Gốc"';
    }
    if (q.quest_boss.status === 'completed') {
      return '✓ Giai đoạn 1 hoàn tất — Đã đánh bại Sơ Giác!';
    }
    return 'Mục tiêu: Luyện cấp ở Rừng Thạch Mạch, sau đó vào Động Tàn Cơ gặp Sơ Giác';
  }
}
