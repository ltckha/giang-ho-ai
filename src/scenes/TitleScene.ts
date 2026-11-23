import Phaser from 'phaser';
import { ALL_ELEMENTS, ELEMENT_INFO } from '../core/elements';
import {
  activatedHiddenCount,
  GEAR_SETS,
  GEAR_SLOTS,
  RARITY_LABEL,
  statText,
  supporterSlots,
  type GearSlotId,
  type GearStatKind,
} from '../core/equipment';
import { equipGear, getEquipped, getGearBonus, loadTdSave } from '../core/saveSystem';
import { getShopStage, isShopUnlocked, SHOP_STREET, shopStars, type ShopOnStreet } from '../core/shopStreet';
import { ALL_ENEMY_DEFINITIONS, getStageTowerList } from '../core/tdDefinitions';
import type { EnemyId } from '../core/types';
import {
  getAtlasFrameDataUrl,
  getEnemyFrameName,
  getGearAtlasFrameDataUrl,
  getGearIconFrameName,
  getGearSetBadgeFrameName,
  getTowerFrameName,
  STAGE1_MAP_KEY,
} from '../game/atlasIcons';
import {
  getEmptySlotSilhouetteSvg,
  getGeneratorElementFor,
  getSlotSupportState,
  getStatMiniIconSvg,
  RARITY_THEME,
} from '../game/gearUiHelpers';
import { getInitialReduceMotion } from '../game/preferences';
import { SCENE_KEYS } from '../game/sceneKeys';
import { renderShopkeeperAvatarSvg } from '../game/shopkeeperAvatar';
import { renderShopFacadeSvg, renderStreetExtensionSvg } from '../game/shopStreetArt';
import { sound } from '../game/sound';

const RING_SIZE = 340;
const RING_CENTER = 170;
const RING_RADIUS = 134;

function getRingSlotPos(index: number): { x: number; y: number } {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / GEAR_SLOTS.length;
  return {
    x: RING_CENTER + RING_RADIUS * Math.cos(angle),
    y: RING_CENTER + RING_RADIUS * Math.sin(angle),
  };
}

function getShopLifeIconFrame(stageId: ShopOnStreet['stageId']): string {
  if (stageId === 'stage_2') return 'icon_bread_life';
  if (stageId === 'stage_3') return 'icon_flower_life';
  return 'icon_shoe_life';
}

function getStageMainEnemies(shop: ShopOnStreet): EnemyId[] {
  const stage = getShopStage(shop);
  const seen = new Set<EnemyId>();
  for (const wave of stage.waves) {
    for (const grp of wave.groups) {
      seen.add(grp.enemyId);
    }
  }
  return Array.from(seen);
}

export class TitleScene extends Phaser.Scene {
  private overlayEl: HTMLDivElement | null = null;
  private rainLines: Array<{ x: number; y: number; len: number; speed: number }> = [];
  private weatherGfx: Phaser.GameObjects.Graphics | null = null;
  private reduceMotion = false;

  constructor() {
    super({ key: SCENE_KEYS.TITLE });
  }

  public create(): void {
    this.reduceMotion = getInitialReduceMotion();
    this.rainLines = [];
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#241811');

    // Nền tiệm giày ngày mưa mờ ấm phía sau con phố dốc Đà Lạt
    if (this.textures.exists(STAGE1_MAP_KEY)) {
      const bg = this.add.image(width * 0.5, height * 0.5, STAGE1_MAP_KEY).setAlpha(0.28);
      const scale = Math.max(width / bg.width, height / bg.height);
      bg.setScale(scale);
    }

    this.weatherGfx = this.add.graphics();
    for (let i = 0; i < 26; i += 1) {
      this.rainLines.push({
        x: Math.random() * width,
        y: Math.random() * height,
        len: 10 + Math.random() * 12,
        speed: 90 + Math.random() * 65,
      });
    }

    this.mountTitleOverlay();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unmountOverlay();
    });
  }

  public update(_time: number, deltaMs: number): void {
    if (!this.weatherGfx || this.reduceMotion) return;
    const dt = Math.min(0.05, deltaMs / 1000);
    const { width, height } = this.scale;
    this.weatherGfx.clear();
    this.weatherGfx.lineStyle(1.4, 0xc8ebff, 0.25);

    for (const r of this.rainLines) {
      r.x -= r.speed * 0.22 * dt;
      r.y += r.speed * dt;
      if (r.y > height + 16 || r.x < -16) {
        r.x = Math.random() * (width + 60);
        r.y = -14;
      }
      this.weatherGfx.lineBetween(r.x, r.y, r.x - r.len * 0.22, r.y + r.len);
    }
  }

  private mountTitleOverlay(): void {
    this.unmountOverlay();
    const container = document.getElementById('game-container');
    if (!container) return;

    const save = loadTdSave();
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const queryStage = params?.get('stage');
    const isBotBypass = params?.get('bot') === '1';

    const isUnlocked = (shop: ShopOnStreet): boolean =>
      isShopUnlocked(save, shop) || isBotBypass || queryStage === String(shop.order);

    let selectedShopId: ShopOnStreet['stageId'] =
      SHOP_STREET.find((s) => String(s.order) === queryStage)?.stageId ?? SHOP_STREET[0]!.stageId;

    const root = document.createElement('div');
    root.className = 'td-title-overlay';
    root.id = 'td-title-overlay';

    root.innerHTML = `
      <div class="td-title-card td-shoebox-panel">
        <div class="td-box-lid-label">
          <span class="td-tag-hole"></span>
          <span>CON PHỐ DỐC ĐÀ LẠT • NGŨ HÀNH GIỮ TIỆM</span>
        </div>

        <h1 class="td-title-heading">Gọn Tiệm, Sạch Phố</h1>
        <p class="td-title-sub">Ngũ hành giữ tiệm</p>
        <p class="td-title-desc">
          Chạm vào từng cửa tiệm dọc con phố dốc Đà Lạt để xem 5 món giữ tiệm &amp; bầy quái, rồi mở cửa giữ sạch phố nhé!
        </p>

        <button type="button" id="btn-jump-gear" class="td-gear-jump-pill">
          <span class="td-gear-jump-dot">✦</span>
          <span id="td-gear-jump-label">Trang bị chủ tiệm</span>
          <span class="td-gear-jump-arrow">↓</span>
        </button>

        <section class="td-street-section ${this.reduceMotion ? 'no-anim' : ''}" data-testid="shop-street">
          <div class="td-street-lane-header">
            <span class="td-street-sign-post">⛰ Dốc Đà Lạt • ${SHOP_STREET.length} tiệm</span>
            <span class="td-street-rain-tag">🌧 Mưa nhẹ • Đèn vàng</span>
          </div>
          <div class="td-street-list" id="td-street-list"></div>
          <div class="td-street-coming-soon" data-testid="street-coming-soon">
            ${renderStreetExtensionSvg()}
            <div class="td-street-more-caption">
              <strong>Con dốc còn dài...</strong>
              <span>Chừa sẵn mặt bằng nối dài phố thêm tiệm mới ở chặng sau!</span>
            </div>
          </div>
        </section>

        <div class="td-stage-tag-box td-gear-panel ${this.reduceMotion ? 'no-anim' : ''}" id="td-gear-box" data-testid="td-gear-box">
          <div class="td-gear-header-row">
            <div>
              <div class="td-stage-kicker">TRANG BỊ CHỦ TIỆM • VÒNG NGŨ HÀNH 10 MÓN</div>
              <div class="td-gear-title" id="td-gear-head"></div>
            </div>
            <div class="td-gear-bag-pill" id="td-gear-inv-count"></div>
          </div>
          <div id="td-gear-fullring-banner"></div>
          <div class="td-gear-ring-stage" id="td-gear-ring-stage"></div>
          <div class="td-gear-hint-line">
            Chạm từng ô quanh chủ tiệm để đổi đồ. <strong>2 đường nối</strong> là 2 món chống lưng sinh ra hành món này (●); đủ 10 món viên mãn sáng thêm dòng ẩn thứ 3 (✦).
          </div>
          <div id="td-gear-pick"></div>
          <div class="td-gear-sets-wrap" id="td-gear-sets"></div>
          <div class="td-gear-sum-wrap" id="td-gear-sum"></div>
        </div>

        <div class="td-element-guide" id="td-element-guide" data-testid="td-element-guide"></div>
      </div>
    `;

    container.appendChild(root);

    root.querySelector<HTMLButtonElement>('#btn-jump-gear')?.addEventListener('click', () => {
      sound.playUiClick();
      root.querySelector('#td-gear-box')?.scrollIntoView({ behavior: this.reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });

    const renderSelectedShopShowcase = (): void => {
      const guideEl = root.querySelector<HTMLDivElement>('#td-element-guide');
      if (!guideEl) return;
      const activeShop = SHOP_STREET.find((s) => s.stageId === selectedShopId) ?? SHOP_STREET[0]!;
      const activeStage = getShopStage(activeShop);
      const towers = getStageTowerList(activeStage);

      const tabsHtml = SHOP_STREET.map((shop) => {
        const isSel = shop.stageId === activeShop.stageId;
        return `<button type="button" class="td-guide-shop-tab ${isSel ? 'active' : ''}" data-guide-shop="${shop.stageId}">${shop.order}. ${shop.sign}</button>`;
      }).join('');

      const towerShowcase = towers
        .map((t) => {
          const el = ELEMENT_INFO[t.element];
          const spUrl = getAtlasFrameDataUrl(this, getTowerFrameName(t.id, 1, undefined, 0));
          const elUrl = getAtlasFrameDataUrl(this, `el_${t.element}`);
          return `
            <div class="td-showcase-item" style="border-color:${el.colorHex}">
              ${spUrl ? `<img class="td-showcase-sprite" src="${spUrl}" alt="${t.tier1.name}" />` : ''}
              <div class="td-showcase-name">${t.tier1.name}</div>
              <span class="td-showcase-el" style="background:${el.colorHex}">
                ${elUrl ? `<img class="td-badge-el-icon" src="${elUrl}" alt="" />` : ''}
                ${el.label}
              </span>
            </div>
          `;
        })
        .join('');

      guideEl.innerHTML = `
        <div class="td-guide-title">5 món của ${activeStage.name} • Vòng khắc: Kim → Mộc → Thổ → Thủy → Hỏa → Kim</div>
        <div class="td-guide-shop-tabs">${tabsHtml}</div>
        <div class="td-showcase-grid">${towerShowcase}</div>
      `;

      guideEl.querySelectorAll<HTMLButtonElement>('[data-guide-shop]').forEach((tab) => {
        tab.onclick = () => {
          const nextId = tab.dataset.guideShop as ShopOnStreet['stageId'];
          if (nextId !== selectedShopId) {
            selectedShopId = nextId;
            sound.playUiClick();
            renderStreet();
            renderSelectedShopShowcase();
          }
        };
      });
    };

    const renderStreet = (): void => {
      const listEl = root.querySelector<HTMLDivElement>('#td-street-list');
      if (!listEl) return;

      const coinUrl = getAtlasFrameDataUrl(this, 'icon_coin');

      listEl.innerHTML = SHOP_STREET.map((shop, idx) => {
        const stage = getShopStage(shop);
        const unlocked = isUnlocked(shop);
        const stars = shopStars(save, shop);
        const isSelected = selectedShopId === shop.stageId;
        const lifeUrl = getAtlasFrameDataUrl(this, getShopLifeIconFrame(shop.stageId));
        const starText = !unlocked
          ? '🔒 Khóa'
          : stars > 0
            ? '★'.repeat(stars) + '☆'.repeat(3 - stars)
            : 'Chưa qua';

        const towers = getStageTowerList(stage);
        const mainEnemies = getStageMainEnemies(shop);

        const detailHtml = isSelected
          ? `
            <div class="td-shop-detail-card" data-testid="shop-detail-${shop.order}">
              <div class="td-shop-detail-sub">${stage.subtitle}</div>
              <div class="td-shop-detail-stats">
                <span>🌊 ${stage.waves.length} đợt</span>
                <span>•</span>
                <span>${stage.startingLives} ${shop.lifeUnit}</span>
                <span>•</span>
                <span>Vốn đầu ${stage.startingEssence} xu</span>
              </div>

              <div class="td-shop-detail-block">
                <div class="td-shop-detail-label">5 món giữ tiệm của ${shop.sign}</div>
                <div class="td-shop-mini-towers">
                  ${towers
                    .map((t) => {
                      const el = ELEMENT_INFO[t.element];
                      const spUrl = getAtlasFrameDataUrl(this, getTowerFrameName(t.id, 1, undefined, 0));
                      const elUrl = getAtlasFrameDataUrl(this, `el_${t.element}`);
                      return `
                        <div class="td-shop-mini-tower" style="border-color:${el.colorHex}" title="${t.tier1.name} (${el.label}) — ${t.tier1.cost} xu">
                          ${spUrl ? `<img class="td-mini-tower-img" src="${spUrl}" alt="${t.tier1.name}" />` : ''}
                          <div class="td-mini-tower-name">${t.tier1.name}</div>
                          <div class="td-mini-tower-meta">
                            <span class="td-mini-el-pill" style="background:${el.colorHex}">
                              ${elUrl ? `<img src="${elUrl}" alt="" />` : ''}${el.label}
                            </span>
                            <span class="td-mini-cost">${t.tier1.cost}${coinUrl ? `<img class="td-mini-coin" src="${coinUrl}" alt="" />` : ''}</span>
                          </div>
                        </div>
                      `;
                    })
                    .join('')}
                </div>
              </div>

              <div class="td-shop-detail-block">
                <div class="td-shop-detail-label">Bầy quái chính kéo vào tiệm</div>
                <div class="td-shop-mini-enemies">
                  ${mainEnemies
                    .map((eid) => {
                      const edef = ALL_ENEMY_DEFINITIONS[eid];
                      const el = ELEMENT_INFO[edef.element];
                      const isBoss = edef.trait === 'boss';
                      const eUrl = getAtlasFrameDataUrl(this, getEnemyFrameName(eid, 0));
                      return `
                        <span class="td-shop-enemy-chip ${isBoss ? 'is-boss' : ''}" style="border-color:${el.colorHex}">
                          ${eUrl ? `<img src="${eUrl}" alt="${edef.name}" />` : ''}
                          <span>${isBoss ? '👑 ' : ''}${edef.name}</span>
                          <i class="td-enemy-el-dot" style="background:${el.colorHex}" title="${el.label}"></i>
                        </span>
                      `;
                    })
                    .join('')}
                </div>
              </div>
            </div>
          `
          : '';

        const slopeStepHtml =
          idx > 0
            ? `<div class="td-street-slope-connector" aria-hidden="true">
                 <span class="td-slope-line"></span>
                 <span class="td-slope-step-pill">↓ Xuống dốc • Tiệm ${shop.order}</span>
                 <span class="td-slope-line"></span>
               </div>`
            : '';

        return `
          ${slopeStepHtml}
          <article
            class="td-street-shop ${unlocked ? 'unlocked' : 'locked td-stage-locked'} ${isSelected ? 'selected' : ''}"
            data-testid="stage${shop.order}-card"
            data-shop-id="${shop.stageId}"
          >
            <div
              class="td-shop-facade-hit"
              role="button"
              tabindex="0"
              data-select-shop="${shop.stageId}"
              data-testid="street-shop-${shop.order}"
              aria-expanded="${isSelected ? 'true' : 'false'}"
              aria-label="Xem thông tin ${stage.name}"
            >
              <!-- Biển hiệu gỗ treo trên mái tiệm -->
              <div class="td-shop-signboard ${unlocked ? '' : 'locked'}">
                <div class="td-shop-sign-left">
                  <span class="td-shop-order-badge">${shop.order}</span>
                  ${lifeUrl ? `<img class="td-shop-life-ico" src="${lifeUrl}" alt="" />` : ''}
                  <div class="td-shop-sign-titles">
                    <span class="td-shop-sign-short">${shop.sign.toUpperCase()} • ${stage.waves.length} ĐỢT</span>
                    <span class="td-stage-name">${stage.name}</span>
                  </div>
                </div>
                <div class="td-stage-stars ${unlocked ? '' : 'locked'}" data-testid="stage${shop.order}-stars">${starText}</div>
              </div>

              <!-- Mặt tiền vẽ theo nét Đà Lạt ngày mưa -->
              <div class="td-shop-facade-wrap">
                ${renderShopFacadeSvg(shop, unlocked)}
                ${
                  unlocked
                    ? `<span class="td-facade-inspect-pill">${isSelected ? '▲ Đang xem chi tiết' : '▼ Chạm xem 5 món & quái'}</span>`
                    : `<span class="td-facade-lock-ribbon">🔒 Qua tiệm trước để mở</span>`
                }
              </div>
            </div>

            ${detailHtml}

            <div class="td-shop-action-bar">
              <button
                type="button"
                id="btn-start-stage-${shop.order}"
                data-testid="btn-start-stage-${shop.order}"
                data-launch-stage="${shop.stageId}"
                class="${unlocked ? 'td-btn-primary td-street-open-btn' : 'td-btn-locked td-street-open-btn'}"
                ${unlocked ? '' : 'disabled aria-disabled="true"'}
              >
                ${unlocked ? `Mở Cửa ${shop.sign}` : '🔒 Qua tiệm trước để mở'}
              </button>
            </div>
          </article>
        `;
      }).join('');

      listEl.querySelectorAll<HTMLElement>('[data-select-shop]').forEach((el) => {
        const pick = () => {
          const id = el.dataset.selectShop as ShopOnStreet['stageId'];
          if (selectedShopId !== id) {
            selectedShopId = id;
            sound.playUiClick();
            renderStreet();
            renderSelectedShopShowcase();
          }
        };
        el.onclick = pick;
        el.onkeydown = (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            pick();
          }
        };
      });

      listEl.querySelectorAll<HTMLButtonElement>('[data-launch-stage]').forEach((btn) => {
        btn.onclick = (ev) => {
          ev.stopPropagation();
          if (btn.disabled) return;
          const stageId = btn.dataset.launchStage as ShopOnStreet['stageId'];
          sound.playUiClick();
          this.unmountOverlay();
          this.scene.start(SCENE_KEYS.TD_STAGE, { stageId });
        };
      });
    };

    renderStreet();
    renderSelectedShopShowcase();

    let pickSlot: GearSlotId | null = null;

    const renderGear = (): void => {
      const cur = loadTdSave();
      const eq = getEquipped(cur);
      const act = activatedHiddenCount(eq);
      const bonus = getGearBonus(cur);
      const invLen = cur.gearInventory?.length ?? 0;
      const wornCount = GEAR_SLOTS.filter((s) => Boolean(eq[s.id])).length;

      const jumpLabel = root.querySelector<HTMLSpanElement>('#td-gear-jump-label');
      if (jumpLabel) {
        jumpLabel.textContent = bonus.fullRing
          ? `Chủ tiệm: NGŨ HÀNH VIÊN MÃN (${wornCount}/10)`
          : `Trang bị chủ tiệm: ${wornCount}/10 món • ${bonus.activeLines}/${bonus.totalHiddenLines} dòng ẩn`;
      }

      const head = root.querySelector<HTMLDivElement>('#td-gear-head');
      if (head) {
        head.textContent = bonus.fullRing
          ? `Ngũ Hành Viên Mãn! (${bonus.activeLines}/${bonus.totalHiddenLines} dòng ẩn)`
          : `Dòng ẩn sáng ${bonus.activeLines}/${bonus.totalHiddenLines}`;
      }

      const invBadge = root.querySelector<HTMLDivElement>('#td-gear-inv-count');
      if (invBadge) {
        invBadge.textContent = `Kho: ${invLen} món`;
      }

      const fullBanner = root.querySelector<HTMLDivElement>('#td-gear-fullring-banner');
      if (fullBanner) {
        fullBanner.innerHTML = bonus.fullRing
          ? `<div class="td-fullring-ribbon" data-testid="td-fullring-banner">✦ NGŨ HÀNH VIÊN MÃN! +15% sức mọi món • Tuyệt chiêu hồi nhanh 30% • Sáng đủ dòng ẩn 3 ✦</div>`
          : '';
      }

      // 1. Vòng 10 ô + 2 đường nối chống lưng + Hình chủ tiệm mặc đúng đồ ở giữa
      const ringStage = root.querySelector<HTMLDivElement>('#td-gear-ring-stage');
      if (ringStage) {
        const slotIndexMap = new Map<GearSlotId, number>(GEAR_SLOTS.map((s, idx) => [s.id, idx]));
        const selectedSupporters = pickSlot ? supporterSlots(pickSlot) : null;

        // Vẽ đường nối SVG (vòng ngoài chống lưng A = i-1 -> i, và dây sao trong chống lưng B = i-6 -> i)
        const outerLines: string[] = [];
        const innerLines: string[] = [];
        const arrows: string[] = [];

        GEAR_SLOTS.forEach((sl, idx) => {
          const st = getSlotSupportState(eq, sl.id);
          const idxA = slotIndexMap.get(st.supA)!;
          const idxB = slotIndexMap.get(st.supB)!;
          const pTarget = getRingSlotPos(idx);
          const pA = getRingSlotPos(idxA);
          const pB = getRingSlotPos(idxB);
          const isSelectedTarget = pickSlot === sl.id;

          // Đường vòng ngoài (Chống lưng A: ô liền trước -> ô này)
          if (st.aActive) {
            const col = ELEMENT_INFO[eq[st.supA]!.element].colorHex;
            outerLines.push(
              `<line x1="${pA.x.toFixed(1)}" y1="${pA.y.toFixed(1)}" x2="${pTarget.x.toFixed(1)}" y2="${pTarget.y.toFixed(1)}" stroke="${col}" stroke-width="7.5" stroke-opacity="0.32" stroke-linecap="round"/>`,
              `<line class="td-gear-beam-active" x1="${pA.x.toFixed(1)}" y1="${pA.y.toFixed(1)}" x2="${pTarget.x.toFixed(1)}" y2="${pTarget.y.toFixed(1)}" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`,
            );
            const mx = (pA.x + pTarget.x) * 0.5;
            const my = (pA.y + pTarget.y) * 0.5;
            const ang = (Math.atan2(pTarget.y - pA.y, pTarget.x - pA.x) * 180) / Math.PI;
            arrows.push(
              `<g transform="translate(${mx.toFixed(1)} ${my.toFixed(1)}) rotate(${ang.toFixed(1)})">
                 <polygon points="5,0 -3.5,-4 -1.5,0 -3.5,4" fill="${col}" stroke="#2b1a12" stroke-width="1"/>
               </g>`,
            );
          } else if (isSelectedTarget) {
            outerLines.push(
              `<line x1="${pA.x.toFixed(1)}" y1="${pA.y.toFixed(1)}" x2="${pTarget.x.toFixed(1)}" y2="${pTarget.y.toFixed(1)}" stroke="#d97706" stroke-width="2.6" stroke-dasharray="5 4" stroke-linecap="round"/>`,
            );
          } else {
            outerLines.push(
              `<line x1="${pA.x.toFixed(1)}" y1="${pA.y.toFixed(1)}" x2="${pTarget.x.toFixed(1)}" y2="${pTarget.y.toFixed(1)}" stroke="#c2a274" stroke-width="1.8" stroke-dasharray="4 4" stroke-opacity="0.65"/>`,
            );
          }

          // Đường sao bên trong (Chống lưng B: ô cách 6 bước -> ô này)
          // Vẽ cong nhẹ về tâm để thấy rõ đường sáng mà không che mặt chủ tiệm
          const midBx = (pB.x + pTarget.x) * 0.5;
          const midBy = (pB.y + pTarget.y) * 0.5;
          const ctrlX = midBx * 0.72 + RING_CENTER * 0.28;
          const ctrlY = midBy * 0.72 + RING_CENTER * 0.28;
          if (st.bActive) {
            const colB = ELEMENT_INFO[eq[st.supB]!.element].colorHex;
            innerLines.push(
              `<path d="M ${pB.x.toFixed(1)} ${pB.y.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${pTarget.x.toFixed(1)} ${pTarget.y.toFixed(1)}" fill="none" stroke="${colB}" stroke-width="5.5" stroke-opacity="0.24" stroke-linecap="round"/>`,
              `<path class="td-gear-beam-active" d="M ${pB.x.toFixed(1)} ${pB.y.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${pTarget.x.toFixed(1)} ${pTarget.y.toFixed(1)}" fill="none" stroke="${colB}" stroke-width="2.2" stroke-opacity="0.88" stroke-linecap="round"/>`,
            );
            // Mũi tên nhỏ gần ô nhận để nhận biết chiều sinh của chống lưng B
            const t = 0.72;
            const ax = (1 - t) * (1 - t) * pB.x + 2 * (1 - t) * t * ctrlX + t * t * pTarget.x;
            const ay = (1 - t) * (1 - t) * pB.y + 2 * (1 - t) * t * ctrlY + t * t * pTarget.y;
            const tx = 2 * (1 - t) * (ctrlX - pB.x) + 2 * t * (pTarget.x - ctrlX);
            const ty = 2 * (1 - t) * (ctrlY - pB.y) + 2 * t * (pTarget.y - ctrlY);
            const angB = (Math.atan2(ty, tx) * 180) / Math.PI;
            arrows.push(
              `<g transform="translate(${ax.toFixed(1)} ${ay.toFixed(1)}) rotate(${angB.toFixed(1)})">
                 <polygon points="4.5,0 -3,-3.5 -1.2,0 -3,3.5" fill="${colB}" stroke="#2b1a12" stroke-width="0.9"/>
               </g>`,
            );
          } else if (isSelectedTarget) {
            innerLines.push(
              `<path d="M ${pB.x.toFixed(1)} ${pB.y.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${pTarget.x.toFixed(1)} ${pTarget.y.toFixed(1)}" fill="none" stroke="#b45309" stroke-width="2.2" stroke-dasharray="5 4" stroke-opacity="0.85"/>`,
            );
          }
        });

        const fullRingHaloSvg = bonus.fullRing
          ? `<circle class="td-gear-full-halo" cx="${RING_CENTER}" cy="${RING_CENTER}" r="${RING_RADIUS}" fill="none" stroke="#f59e0b" stroke-width="5" stroke-opacity="0.45"/>
             <circle cx="${RING_CENTER}" cy="${RING_CENTER}" r="${RING_RADIUS + 6}" fill="none" stroke="#fde047" stroke-width="1.6" stroke-dasharray="6 6" stroke-opacity="0.85"/>`
          : '';

        const linesSvg = `
          <svg class="td-gear-ring-lines" viewBox="0 0 ${RING_SIZE} ${RING_SIZE}" aria-hidden="true">
            ${fullRingHaloSvg}
            ${innerLines.join('')}
            ${outerLines.join('')}
            ${arrows.join('')}
          </svg>
        `;

        // 10 nút ô trang bị đặt quanh vòng tròn
        const slotsHtml = GEAR_SLOTS.map((sl, idx) => {
          const pos = getRingSlotPos(idx);
          const leftPct = ((pos.x / RING_SIZE) * 100).toFixed(2);
          const topPct = ((pos.y / RING_SIZE) * 100).toFixed(2);
          const it = eq[sl.id];
          const isPicked = pickSlot === sl.id;
          const isSupA = selectedSupporters?.[0] === sl.id;
          const isSupB = selectedSupporters?.[1] === sl.id;
          const litCount = act[sl.id] ?? 0;

          if (!it) {
            const shortSlotLabel = sl.id === 'bag' ? 'Túi chéo' : sl.id === 'belt' ? 'Dây nịt' : sl.label;
            return `
              <button
                type="button"
                class="td-gear-slot-node empty ${isPicked ? 'selected' : ''} ${isSupA || isSupB ? 'is-supporter' : ''}"
                data-gear-slot="${sl.id}"
                data-testid="gear-slot-${sl.id}"
                style="left:${leftPct}%;top:${topPct}%"
                title="${sl.label} — Trống (chạm để đeo)"
              >
                ${isSupA ? '<span class="td-sup-tag">A</span>' : isSupB ? '<span class="td-sup-tag">B</span>' : ''}
                ${getEmptySlotSilhouetteSvg(sl.id)}
                <span class="td-slot-mini-label">${shortSlotLabel}</span>
              </button>
            `;
          }

          const theme = RARITY_THEME[it.rarity];
          const elInfo = ELEMENT_INFO[it.element];
          const iconUrl = getGearAtlasFrameDataUrl(this, getGearIconFrameName(sl.id, it.element));
          const elUrl = getAtlasFrameDataUrl(this, `el_${it.element}`);
          const pipsHtml = it.hidden
            .map((_, pipIdx) => {
              const isLit = pipIdx < litCount;
              const isThird = pipIdx === 2;
              return `<span class="td-slot-pip ${isLit ? 'lit' : ''} ${isThird ? 'third' : ''}">${isThird && isLit ? '✦' : isLit ? '●' : '○'}</span>`;
            })
            .join('');

          return `
            <button
              type="button"
              class="td-gear-slot-node equipped rarity-${it.rarity} ${isPicked ? 'selected' : ''} ${isSupA || isSupB ? 'is-supporter' : ''} ${litCount > 0 ? 'activated' : ''}"
              data-gear-slot="${sl.id}"
              data-testid="gear-slot-${sl.id}"
              style="left:${leftPct}%;top:${topPct}%;border-color:${theme.border};background:${theme.bg};--slot-glow:${theme.glow}"
              title="${it.name} (${RARITY_LABEL[it.rarity]}, ${elInfo.label})"
            >
              ${isSupA ? '<span class="td-sup-tag">A</span>' : isSupB ? '<span class="td-sup-tag">B</span>' : ''}
              ${it.rarity === 'hieu' ? '<span class="td-hieu-crown" aria-hidden="true">★</span>' : ''}
              ${
                iconUrl
                  ? `<img class="td-slot-gear-img" src="${iconUrl}" alt="${it.name}" />`
                  : `<span class="td-slot-fallback">${sl.label}</span>`
              }
              <span class="td-slot-el-dot" style="background:${elInfo.colorHex}" title="Hành ${elInfo.label}">
                ${elUrl ? `<img src="${elUrl}" alt="${elInfo.label}" />` : ''}
              </span>
              <span class="td-slot-pips" aria-label="Dòng ẩn sáng ${litCount}/${it.hidden.length}">${pipsHtml}</span>
            </button>
          `;
        }).join('');

        ringStage.innerHTML = `
          ${linesSvg}
          <div class="td-shopkeeper-center">
            ${renderShopkeeperAvatarSvg(eq, bonus.fullRing)}
          </div>
          ${slotsHtml}
        `;

        ringStage.querySelectorAll<HTMLButtonElement>('[data-gear-slot]').forEach((btn) => {
          btn.onclick = () => {
            const clicked = btn.dataset.gearSlot as GearSlotId;
            pickSlot = pickSlot === clicked ? null : clicked;
            sound.playUiClick();
            renderGear();
          };
        });
      }

      // 2. Bảng 4 Bộ Đồ (Đi Mưa, Phượt Đà Lạt, Dân Văn Phòng, Chủ Tiệm Xịn) với huy hiệu & đếm món
      const setsWrap = root.querySelector<HTMLDivElement>('#td-gear-sets');
      if (setsWrap) {
        const cards = GEAR_SETS.map((gs) => {
          const count = gs.pieces.filter((p) => eq[p.slot]?.element === p.element).length;
          const total = gs.pieces.length;
          const isAnyActive = gs.bonuses.some((b) => count >= b.count);
          const badgeUrl = getGearAtlasFrameDataUrl(this, getGearSetBadgeFrameName(gs.id));
          const mainEl = gs.pieces[0]!.element;
          const elColor = ELEMENT_INFO[mainEl].colorHex;
          const bonusLines = gs.bonuses
            .map((b) => {
              const on = count >= b.count;
              const txt = b.stats.map((st) => statText(st)).join(', ');
              return `<div class="td-set-bonus-line ${on ? 'on' : ''}">${on ? '✔' : '○'} ${b.count} món: ${txt}</div>`;
            })
            .join('');
          return `
            <div class="td-set-card ${isAnyActive ? 'active' : ''}" data-testid="gear-set-${gs.id}" style="${isAnyActive ? `border-color:${elColor}` : ''}">
              <div class="td-set-top">
                ${badgeUrl ? `<img class="td-set-badge-img" src="${badgeUrl}" alt="${gs.name}" />` : ''}
                <div class="td-set-meta">
                  <div class="td-set-name">${gs.name}</div>
                  <span class="td-set-count ${isAnyActive ? 'on' : ''}">${count}/${total} món</span>
                </div>
              </div>
              <div class="td-set-bonuses">${bonusLines}</div>
            </div>
          `;
        }).join('');
        setsWrap.innerHTML = `
          <div class="td-gear-section-label">Bộ đồ chủ tiệm (mặc đúng loại + đúng hành)</div>
          <div class="td-set-grid">${cards}</div>
        `;
      }

      // 3. Tóm tắt tổng sức mạnh đang có từ trang bị (có biểu tượng nhỏ 19 dòng vui)
      const sum = root.querySelector<HTMLDivElement>('#td-gear-sum');
      if (sum) {
        const chips: string[] = [];
        for (const el of ALL_ELEMENTS) {
          if (bonus.elementDmg[el]) {
            const elInfo = ELEMENT_INFO[el];
            const elUrl = getAtlasFrameDataUrl(this, `el_${el}`);
            chips.push(
              `<span class="td-sum-chip" style="border-color:${elInfo.colorHex}">${elUrl ? `<img class="td-badge-el-icon" src="${elUrl}" alt="" />` : ''}<strong>${elInfo.label}</strong> +${Math.round(bonus.elementDmg[el]! * 100)}%</span>`,
            );
          }
        }
        for (const [k, v] of Object.entries(bonus.stats)) {
          if (v) {
            const kind = k as GearStatKind;
            chips.push(
              `<span class="td-sum-chip">${getStatMiniIconSvg(kind)}<span>${statText({ kind, value: v })}</span></span>`,
            );
          }
        }
        sum.innerHTML = chips.length
          ? `<div class="td-gear-section-label">Sức mạnh đang cộng thêm (áp cho cả 3 màn)</div><div class="td-sum-chips">${chips.join('')}</div>`
          : `<div class="td-stage-sub">Chưa đeo trang bị nào. Chạm vào các ô quanh chủ tiệm để mặc đồ!</div>`;
      }

      // 4. Ngăn chọn đồ khi bấm vào 1 trong 10 ô
      const pick = root.querySelector<HTMLDivElement>('#td-gear-pick');
      if (!pick) return;
      if (!pickSlot) {
        pick.innerHTML = '';
        return;
      }

      const slotId = pickSlot;
      const slotInfo = GEAR_SLOTS.find((x) => x.id === slotId)!;
      const owned = (cur.gearInventory ?? []).filter((it) => it.slot === slotId);
      const currentItem = eq[slotId];
      const supState = getSlotSupportState(eq, slotId);
      const supLabel = (id: GearSlotId) => GEAR_SLOTS.find((x) => x.id === id)!.label;
      const setHint = GEAR_SETS.filter((st) => st.pieces.some((p) => p.slot === slotId))
        .map((st) => {
          const piece = st.pieces.find((p) => p.slot === slotId)!;
          return `${st.name} (${ELEMENT_INFO[piece.element].label})`;
        })
        .join(' • ');

      const needEl = currentItem ? getGeneratorElementFor(currentItem.element) : null;
      const supHintHtml = `
        <div class="td-sup-info-bar">
          <span class="td-sup-pill ${supState.aActive ? 'lit' : ''}">
            ${supState.aActive ? '●' : '○'} Chống lưng A: <strong>${supLabel(supState.supA)}</strong>${eq[supState.supA] ? ` (${ELEMENT_INFO[eq[supState.supA]!.element].label})` : ' (trống)'}
          </span>
          <span class="td-sup-pill ${supState.bActive ? 'lit' : ''}">
            ${supState.bActive ? '●' : '○'} Chống lưng B: <strong>${supLabel(supState.supB)}</strong>${eq[supState.supB] ? ` (${ELEMENT_INFO[eq[supState.supB]!.element].label})` : ' (trống)'}
          </span>
          ${needEl ? `<span class="td-sup-need">Cần <strong>${ELEMENT_INFO[needEl].label}</strong> sinh ra ${ELEMENT_INFO[currentItem!.element].label}</span>` : ''}
        </div>
      `;

      const listHtml =
        owned.length === 0
          ? `<div class="td-gear-empty-box">Chưa có <strong>${slotInfo.label}</strong> nào trong kho. Thắng màn để mở rương rơi thêm trang bị nhé!</div>`
          : owned
              .map((it) => {
                const theme = RARITY_THEME[it.rarity];
                const elInfo = ELEMENT_INFO[it.element];
                const on = currentItem?.uid === it.uid;
                const iconUrl = getGearAtlasFrameDataUrl(this, getGearIconFrameName(it.slot, it.element));
                const elUrl = getAtlasFrameDataUrl(this, `el_${it.element}`);
                const activeCount = on ? (act[slotId] ?? 0) : 0;

                const visRows = it.visible
                  .map(
                    (st) =>
                      `<div class="td-gear-stat-row">${getStatMiniIconSvg(st.kind)}<span>${statText(st)}</span></div>`,
                  )
                  .join('');

                const hidRows = it.hidden
                  .map((st, idx) => {
                    const isLit = on && idx < activeCount;
                    const reqTag = idx === 2 ? 'Ngũ hành viên mãn' : `Chống lưng ${idx + 1}`;
                    return `
                      <div class="td-gear-stat-row hidden ${isLit ? 'lit' : ''}">
                        <span class="td-hidden-dot">${idx === 2 && isLit ? '✦' : isLit ? '●' : '○'}</span>
                        ${getStatMiniIconSvg(st.kind)}
                        <span>${statText(st)} <em class="td-req-note">(${reqTag})</em></span>
                      </div>
                    `;
                  })
                  .join('');

                return `
                  <button
                    type="button"
                    class="td-gear-item-card ${on ? 'equipped' : ''} rarity-${it.rarity}"
                    data-gear-item="${it.uid}"
                    style="border-color:${theme.border}"
                  >
                    <div class="td-gear-card-top">
                      <div class="td-gear-card-thumb" style="background:${theme.bg};border-color:${theme.border}">
                        ${iconUrl ? `<img src="${iconUrl}" alt="${it.name}" />` : ''}
                      </div>
                      <div class="td-gear-card-info">
                        <div class="td-gear-card-name-row">
                          <strong>${it.rarity === 'hieu' ? '★ ' : ''}${it.name}</strong>
                          ${on ? '<span class="td-equipped-pill">Đang mặc</span>' : ''}
                        </div>
                        <div class="td-gear-card-badges">
                          <span class="td-rarity-pill" style="background:${theme.badgeBg};color:${theme.badgeText}">${RARITY_LABEL[it.rarity]}</span>
                          <span class="td-el-badge" style="background:${elInfo.colorHex}">
                            ${elUrl ? `<img class="td-badge-el-icon" src="${elUrl}" alt="" />` : ''}
                            ${elInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="td-gear-card-stats">
                      ${visRows}
                      <div class="td-gear-hidden-sep">Dòng ẩn kích hoạt theo vòng ngũ hành</div>
                      ${hidRows}
                    </div>
                  </button>
                `;
              })
              .join('');

      const offBtn = currentItem
        ? `<button type="button" class="td-gear-off-btn" data-gear-off="1">Cởi ${slotInfo.label}</button>`
        : '';

      pick.innerHTML = `
        <div class="td-gear-picker-drawer" data-testid="td-gear-picker">
          <div class="td-gear-picker-head">
            <strong>Ô ${slotInfo.label}</strong>
            <div class="td-gear-picker-actions">
              ${offBtn}
              <button type="button" class="td-close-btn td-picker-close" id="btn-close-gear-pick" aria-label="Đóng">✕</button>
            </div>
          </div>
          ${supHintHtml}
          ${setHint ? `<div class="td-gear-set-hint">Thuộc bộ: ${setHint}</div>` : ''}
          <div class="td-gear-item-list">${listHtml}</div>
        </div>
      `;

      pick.querySelector<HTMLButtonElement>('#btn-close-gear-pick')?.addEventListener('click', () => {
        pickSlot = null;
        sound.playUiClick();
        renderGear();
      });
      pick.querySelectorAll<HTMLButtonElement>('[data-gear-item]').forEach((b) => {
        b.onclick = () => {
          equipGear(slotId, b.dataset.gearItem!);
          sound.playBuildOrUpgrade();
          renderGear();
        };
      });
      pick.querySelector<HTMLButtonElement>('[data-gear-off]')?.addEventListener('click', () => {
        equipGear(slotId, null);
        sound.playSell();
        renderGear();
      });
    };

    renderGear();
    this.overlayEl = root;
  }

  private unmountOverlay(): void {
    if (this.overlayEl) {
      this.overlayEl.remove();
      this.overlayEl = null;
    }
  }
}
