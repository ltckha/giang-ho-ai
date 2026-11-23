import { ALL_ELEMENTS, ELEMENT_INFO } from '../core/elements';
import { getEquipped, getGearBonus, loadTdSave } from '../core/saveSystem';
import { TUTORIAL_PAD, type TutorialController, type TutorialStep } from '../core/tutorial';
import type { ElementType } from '../core/types';
import { renderShopkeeperAvatarSvg } from './shopkeeperAvatar';

export interface TutorialRenderContext {
  container: HTMLElement;
  controller: TutorialController;
  reduceMotion: boolean;
  getPadScreenPos: (padId: string) => { x: number; y: number } | null;
  getElementIconUrl: (el: ElementType) => string;
  onNext: () => void;
  onSkip: () => void;
}

const COUNTER_RING_ORDER: ElementType[] = ['kim', 'moc', 'tho', 'thuy', 'hoa'];

function renderArrowSvg(direction: 'down' | 'up'): string {
  const rot = direction === 'up' ? 'transform="rotate(180 22 22)"' : '';
  return `
    <svg class="td-tut-arrow-svg" viewBox="0 0 44 44" aria-hidden="true">
      <g ${rot}>
        <path
          d="M22 40 L6 22 L15 22 L15 5 L29 5 L29 22 L38 22 Z"
          fill="#fde047"
          stroke="#2b1a12"
          stroke-width="3.6"
          stroke-linejoin="round"
        />
        <path
          d="M22 33 L13 24 L18 24 L18 10 L26 10 L26 24 L31 24 Z"
          fill="#fff9db"
          opacity="0.55"
        />
      </g>
    </svg>
  `;
}

function renderElementGuideWheel(getElementIconUrl: (el: ElementType) => string): string {
  const nodes = COUNTER_RING_ORDER.map((el, idx) => {
    const info = ELEMENT_INFO[el];
    const iconUrl = getElementIconUrl(el);
    const arrow = idx < COUNTER_RING_ORDER.length - 1 ? '<span class="td-tut-el-arrow">→</span>' : '';
    return `
      <span class="td-tut-el-chip" style="border-color:${info.colorHex};background:${info.colorHex}26">
        ${iconUrl ? `<img src="${iconUrl}" alt="${info.label}" />` : ''}
        <strong>${info.label}</strong>
      </span>
      ${arrow}
    `;
  }).join('');

  // Keep ALL_ELEMENTS referenced cleanly for type sanity
  const count = ALL_ELEMENTS.length;
  return `
    <div class="td-tut-el-guide" data-testid="td-tutorial-element-guide" data-elements="${count}">
      <div class="td-tut-el-badge">💥 TRÚNG TỦ! ×1.75 SỨC ĐÁNH</div>
      <div class="td-tut-el-cycle">
        ${nodes}
        <span class="td-tut-el-arrow">↺</span>
      </div>
      <div class="td-tut-el-hint">Đặt món có hành đứng trước để khắc quái có hành đứng sau!</div>
    </div>
  `;
}

/**
 * Lớp giao diện hướng dẫn chơi lần đầu:
 * Chỉ vẽ avatar chủ tiệm, bong bóng lời, mũi tên chỉ mục tiêu & nút Tiếp / Bỏ qua.
 * Toàn bộ luật bước do TutorialController (src/core/tutorial.ts) giữ.
 */
export class TutorialOverlayView {
  private root: HTMLDivElement;
  private lastStepKey = '';
  private lastAnchorKey = '';

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'td-tutorial-layer';
    this.root.id = 'td-tutorial-layer';
    this.root.dataset.testid = 'td-tutorial-overlay';
    this.root.style.display = 'none';
    container.appendChild(this.root);
  }

  public sync(ctx: TutorialRenderContext): void {
    const step = ctx.controller.current();
    if (!ctx.controller.isActive() || !step) {
      if (this.root.style.display !== 'none') {
        this.root.style.display = 'none';
        this.root.innerHTML = '';
        this.lastStepKey = '';
        this.lastAnchorKey = '';
      }
      return;
    }

    if (this.root.style.display === 'none') {
      this.root.style.display = 'block';
    }

    const stepNum = ctx.controller.stepNumber();
    const total = ctx.controller.totalSteps();
    const stepKey = `${step.id}:${stepNum}:${ctx.reduceMotion ? '1' : '0'}`;

    if (stepKey !== this.lastStepKey) {
      this.lastStepKey = stepKey;
      this.lastAnchorKey = '';
      this.renderStepShell(step, stepNum, total, ctx);
    }

    this.positionTargetPointer(step, ctx);
  }

  private renderStepShell(
    step: TutorialStep,
    stepNum: number,
    total: number,
    ctx: TutorialRenderContext,
  ): void {
    const save = loadTdSave();
    const eq = getEquipped(save);
    const fullRing = getGearBonus(save).fullRing;
    const avatarSvg = renderShopkeeperAvatarSvg(eq, fullRing);

    const dotsHtml = Array.from({ length: total }, (_, idx) => {
      const state = idx + 1 < stepNum ? 'done' : idx + 1 === stepNum ? 'now' : '';
      return `<span class="td-tut-dot ${state}"></span>`;
    }).join('');

    const posClass =
      step.target.startsWith('build:')
        ? 'pos-top'
        : step.target === 'element_guide'
          ? 'pos-center'
          : step.target.startsWith('testid:')
            ? 'pos-above-bottom'
            : 'pos-lower';

    this.root.dataset.tutStep = step.id;
    this.root.className = `td-tutorial-layer ${ctx.reduceMotion ? 'no-anim' : ''}`;

    this.root.innerHTML = `
      <div class="td-tut-spotlight" id="td-tut-spotlight" style="display:none"></div>
      <div class="td-tut-arrow" id="td-tut-arrow" data-testid="td-tutorial-arrow" style="display:none"></div>

      <div class="td-tut-dock ${posClass}">
        ${step.target === 'element_guide' ? renderElementGuideWheel(ctx.getElementIconUrl) : ''}
        <div class="td-tut-bubble td-shoebox-panel" data-testid="td-tutorial-bubble">
          <div class="td-tut-avatar-frame" data-testid="td-tutorial-avatar" aria-hidden="true">
            ${avatarSvg}
          </div>
          <div class="td-tut-content">
            <div class="td-tut-top-row">
              <span class="td-tut-speaker">Chủ tiệm Đà Lạt</span>
              <span class="td-tut-step-pill" data-testid="td-tutorial-step-count">Bước ${stepNum}/${total}</span>
            </div>
            <div class="td-tut-dots" aria-hidden="true">${dotsHtml}</div>
            <p class="td-tut-text" data-testid="td-tutorial-text">${step.text}</p>
            <div class="td-tut-actions">
              <button type="button" class="td-tut-skip-btn" id="btn-tut-skip" data-testid="btn-tut-skip">
                Bỏ qua
              </button>
              ${
                step.showNext
                  ? `<button type="button" class="td-tut-next-btn" id="btn-tut-next" data-testid="btn-tut-next">
                       Tiếp →
                     </button>`
                  : `<span class="td-tut-action-hint">👆 Làm theo mũi tên</span>`
              }
            </div>
          </div>
        </div>
      </div>
    `;

    this.root.querySelector<HTMLButtonElement>('#btn-tut-skip')?.addEventListener('click', (ev) => {
      ev.stopPropagation();
      ctx.onSkip();
    });
    this.root.querySelector<HTMLButtonElement>('#btn-tut-next')?.addEventListener('click', (ev) => {
      ev.stopPropagation();
      ctx.onNext();
    });
  }

  private positionTargetPointer(step: TutorialStep, ctx: TutorialRenderContext): void {
    const spotEl = this.root.querySelector<HTMLDivElement>('#td-tut-spotlight');
    const arrowEl = this.root.querySelector<HTMLDivElement>('#td-tut-arrow');
    if (!spotEl || !arrowEl) return;

    const containerRect = ctx.container.getBoundingClientRect();
    let box: { x: number; y: number; w: number; h: number; round?: boolean; arrowDir?: 'down' | 'up' } | null = null;

    if (step.target.startsWith('pad:')) {
      const padId = step.target.slice('pad:'.length);
      const sp = ctx.getPadScreenPos(padId);
      if (sp) {
        const size = 56;
        box = { x: sp.x - size / 2, y: sp.y - size / 2, w: size, h: size, round: true, arrowDir: 'down' };
      }
    } else if (step.target.startsWith('build:')) {
      const towerId = step.target.slice('build:'.length);
      const targetEl = ctx.container.querySelector<HTMLElement>(`[data-testid="build-${towerId}"]`);
      if (targetEl) {
        const r = targetEl.getBoundingClientRect();
        box = {
          x: r.left - containerRect.left - 3,
          y: r.top - containerRect.top - 3,
          w: r.width + 6,
          h: r.height + 6,
          round: false,
          arrowDir: 'down',
        };
      } else {
        // Nếu người chơi lỡ đóng bảng đặt món trước khi chọn, chỉ lại vào ô trống gợi ý
        const sp = ctx.getPadScreenPos(TUTORIAL_PAD);
        if (sp) {
          const size = 56;
          box = { x: sp.x - size / 2, y: sp.y - size / 2, w: size, h: size, round: true, arrowDir: 'down' };
        }
      }
    } else if (step.target.startsWith('testid:')) {
      const tid = step.target.slice('testid:'.length);
      const targetEl = ctx.container.querySelector<HTMLElement>(`[data-testid="${tid}"]`);
      if (targetEl) {
        const r = targetEl.getBoundingClientRect();
        box = {
          x: r.left - containerRect.left - 3,
          y: r.top - containerRect.top - 3,
          w: r.width + 6,
          h: r.height + 6,
          round: false,
          arrowDir: 'down',
        };
      }
    } else if (step.target === 'element_guide') {
      const guideEl = this.root.querySelector<HTMLElement>('[data-testid="td-tutorial-element-guide"]');
      if (guideEl) {
        const r = guideEl.getBoundingClientRect();
        box = {
          x: r.left - containerRect.left - 2,
          y: r.top - containerRect.top - 2,
          w: r.width + 4,
          h: r.height + 4,
          round: false,
          arrowDir: 'down',
        };
      }
    }

    if (!box) {
      if (this.lastAnchorKey !== 'none') {
        this.lastAnchorKey = 'none';
        spotEl.style.display = 'none';
        arrowEl.style.display = 'none';
      }
      return;
    }

    const dir: 'down' | 'up' = box.y < 94 ? 'up' : (box.arrowDir ?? 'down');
    const ax = Math.round(Math.max(24, Math.min(containerRect.width - 24, box.x + box.w / 2)));
    const ay = dir === 'down' ? Math.round(Math.max(54, box.y - 24)) : Math.round(box.y + box.h + 24);
    const anchorKey = `${Math.round(box.x)},${Math.round(box.y)},${Math.round(box.w)},${Math.round(box.h)},${dir}`;
    if (anchorKey === this.lastAnchorKey) return;
    this.lastAnchorKey = anchorKey;

    spotEl.style.display = 'block';
    spotEl.style.left = `${Math.round(box.x)}px`;
    spotEl.style.top = `${Math.round(box.y)}px`;
    spotEl.style.width = `${Math.round(box.w)}px`;
    spotEl.style.height = `${Math.round(box.h)}px`;
    spotEl.classList.toggle('round', Boolean(box.round));

    arrowEl.style.display = 'flex';
    arrowEl.style.left = `${ax}px`;
    arrowEl.style.top = `${ay}px`;
    arrowEl.classList.toggle('point-up', dir === 'up');
    arrowEl.innerHTML = renderArrowSvg(dir);
  }

  public destroy(): void {
    this.root.remove();
  }
}
