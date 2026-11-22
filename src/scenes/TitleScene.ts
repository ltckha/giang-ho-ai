import Phaser from 'phaser';
import { ELEMENT_INFO } from '../core/elements';
import { equipGear, getEquipped, getGearBonus, loadTdSave } from '../core/saveSystem';
import { ALL_ELEMENTS } from '../core/elements';
import { activatedHiddenCount, GEAR_SETS, GEAR_SLOTS, RARITY_LABEL, statText, supporterSlots, type GearSlotId } from '../core/equipment';
import { STAGE_1_DEFINITION, STAGES, TOWER_LIST } from '../core/tdDefinitions';
import { getAtlasFrameDataUrl, getTowerFrameName, STAGE1_MAP_KEY } from '../game/atlasIcons';
import { getInitialReduceMotion } from '../game/preferences';
import { SCENE_KEYS } from '../game/sceneKeys';
import { sound } from '../game/sound';

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

    // Nền tiệm giày ngày mưa mờ ấm phía sau hộp giày mở màn
    if (this.textures.exists(STAGE1_MAP_KEY)) {
      const bg = this.add.image(width * 0.5, height * 0.5, STAGE1_MAP_KEY).setAlpha(0.32);
      const scale = Math.max(width / bg.width, height / bg.height);
      bg.setScale(scale);
    }

    this.weatherGfx = this.add.graphics();
    for (let i = 0; i < 24; i += 1) {
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
    const stage2TestBypass = params?.get('stage') === '2' || params?.get('bot') === '1';
    const stage2Unlocked = save.unlockedStage >= 2 || stage2TestBypass;
    const stage3TestBypass = params?.get('stage') === '3' || params?.get('bot') === '1';
    const stage3Unlocked = save.unlockedStage >= 3 || stage3TestBypass;

    const s1Stars = save.starsByStage.stage_1 ?? 0;
    const starText = s1Stars > 0 ? '★'.repeat(s1Stars) + '☆'.repeat(3 - s1Stars) : 'Chưa qua';
    const s2Stars = save.starsByStage.stage_2 ?? 0;
    const s2StarText = !stage2Unlocked
      ? '🔒 Khóa'
      : s2Stars > 0
        ? '★'.repeat(s2Stars) + '☆'.repeat(3 - s2Stars)
        : 'Chưa qua';
    const s3Stars = save.starsByStage.stage_3 ?? 0;
    const s3StarText = !stage3Unlocked
      ? '🔒 Khóa'
      : s3Stars > 0
        ? '★'.repeat(s3Stars) + '☆'.repeat(3 - s3Stars)
        : 'Chưa qua';

    const root = document.createElement('div');
    root.className = 'td-title-overlay';
    root.id = 'td-title-overlay';

    const shoeUrl = getAtlasFrameDataUrl(this, 'icon_shoe_life');
    const breadUrl = getAtlasFrameDataUrl(this, 'icon_bread_life');
    const flowerUrl = getAtlasFrameDataUrl(this, 'icon_flower_life');
    const towerShowcase = TOWER_LIST.map((t) => {
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
    }).join('');

    root.innerHTML = `
      <div class="td-title-card td-shoebox-panel">
        <div class="td-box-lid-label">
          <span class="td-tag-hole"></span>
          <span>PHỐ NHỎ ĐÀ LẠT MÙA MƯA • NGŨ HÀNH GIỮ TIỆM</span>
        </div>

        <h1 class="td-title-heading">Gọn Tiệm, Sạch Phố</h1>
        <p class="td-title-sub">Ngũ hành giữ tiệm</p>
        <p class="td-title-desc">
          Trời đổ mưa, bùn đất, gián và nắng gắt kéo vào cửa tiệm! Đặt 5 món đồ trong tiệm đúng vòng Ngũ Hành để giữ sạch từng cửa tiệm trên phố.
        </p>

        <div class="td-stage-tag-box">
          <div class="td-stage-header">
            <div class="td-stage-title-row">
              ${shoeUrl ? `<img class="td-stage-shoe-icon" src="${shoeUrl}" alt="" />` : ''}
              <div>
                <div class="td-stage-kicker">MÀN 1</div>
                <div class="td-stage-name">${STAGE_1_DEFINITION.name}</div>
              </div>
            </div>
            <div class="td-stage-stars" data-testid="stage1-stars">${starText}</div>
          </div>
          <div class="td-stage-sub">${STAGE_1_DEFINITION.subtitle}</div>
          <div class="td-stage-meta">
            <span>9 Đợt quái</span> • <span>20 Đôi giày</span> • <span>Trúng tủ 1.75x / Bị khắc 0.5x</span>
          </div>
          <button id="btn-start-stage-1" data-testid="btn-start-stage-1" class="td-btn-primary">
            Mở Cửa Giữ Tiệm Ngay
          </button>
        </div>

        <div class="td-stage-tag-box ${stage2Unlocked ? '' : 'td-stage-locked'}" data-testid="stage2-card">
          <div class="td-stage-header">
            <div class="td-stage-title-row">
              ${
                breadUrl
                  ? `<img class="td-stage-shoe-icon" src="${breadUrl}" alt="" />`
                  : `<span class="td-stage-emoji" aria-hidden="true">🥖</span>`
              }
              <div>
                <div class="td-stage-kicker">MÀN 2 • TƯƠNG SINH +15%</div>
                <div class="td-stage-name">${STAGES.stage_2.name}</div>
              </div>
            </div>
            <div class="td-stage-stars ${stage2Unlocked ? '' : 'locked'}" data-testid="stage2-stars">${s2StarText}</div>
          </div>
          <div class="td-stage-sub">${STAGES.stage_2.subtitle}</div>
          <div class="td-stage-meta">
            <span>10 Đợt quái</span> • <span>20 Ổ bánh</span> • <span>2 Ngả &amp; Cặp tương sinh +15%</span>
          </div>
          <button
            id="btn-start-stage-2"
            data-testid="btn-start-stage-2"
            class="${stage2Unlocked ? 'td-btn-primary' : 'td-btn-locked'}"
            ${stage2Unlocked ? '' : 'disabled aria-disabled="true"'}
          >
            ${stage2Unlocked ? 'Mở Cửa Tiệm Bánh' : '🔒 Qua Màn 1 để mở khóa'}
          </button>
        </div>

        <div class="td-stage-tag-box ${stage3Unlocked ? '' : 'td-stage-locked'}" data-testid="stage3-card">
          <div class="td-stage-header">
            <div class="td-stage-title-row">
              ${
                flowerUrl
                  ? `<img class="td-stage-shoe-icon" src="${flowerUrl}" alt="" />`
                  : `<span class="td-stage-emoji" aria-hidden="true">🌸</span>`
              }
              <div>
                <div class="td-stage-kicker">MÀN 3 • 2 CỬA &amp; TRÙM ĐỔI HÀNH</div>
                <div class="td-stage-name">${STAGES.stage_3.name}</div>
              </div>
            </div>
            <div class="td-stage-stars ${stage3Unlocked ? '' : 'locked'}" data-testid="stage3-stars">${s3StarText}</div>
          </div>
          <div class="td-stage-sub">${STAGES.stage_3.subtitle}</div>
          <div class="td-stage-meta">
            <span>12 Đợt quái</span> • <span>20 Chậu hoa</span> • <span>2 Cửa vào &amp; Trùm Mùa Nồm</span>
          </div>
          <button
            id="btn-start-stage-3"
            data-testid="btn-start-stage-3"
            class="${stage3Unlocked ? 'td-btn-primary' : 'td-btn-locked'}"
            ${stage3Unlocked ? '' : 'disabled aria-disabled="true"'}
          >
            ${stage3Unlocked ? 'Mở Cửa Tiệm Hoa' : '🔒 Qua Màn 2 để mở khóa'}
          </button>
        </div>

        <div class="td-stage-tag-box" data-testid="td-gear-box">
          <div class="td-stage-header">
            <div>
              <div class="td-stage-kicker">TRANG BỊ CHỦ TIỆM • KÍCH HOẠT NGŨ HÀNH</div>
              <div class="td-stage-name" id="td-gear-head"></div>
            </div>
          </div>
          <div class="td-stage-sub">Mỗi món có 2 món chống lưng. Món chống lưng sinh ra hành của món này thì sáng 1 dòng ẩn (●), 2 món sinh thì sáng 2 dòng. Dòng ẩn cuối chỉ sáng khi mặc đủ bộ ngũ hành 10 món. Mặc đủ bộ đồ (Đi Mưa, Phượt Đà Lạt, Dân Văn Phòng, Chủ Tiệm Xịn) có thưởng thêm. Thắng màn rơi đồ.</div>
          <div id="td-gear-sum" class="td-stage-sub"></div>
          <div id="td-gear-rows"></div>
          <div id="td-gear-pick"></div>
        </div>

        <div class="td-element-guide">
          <div class="td-guide-title">Vòng khắc: Kim → Mộc → Thổ → Thủy → Hỏa → Kim</div>
          <div class="td-showcase-grid">${towerShowcase}</div>
        </div>
      </div>
    `;

    container.appendChild(root);

    // Trang bị chủ tiệm (Claude) — giao diện tạm, Antigravity làm đẹp sau
    let pickSlot: GearSlotId | null = null;
    const renderGear = (): void => {
      const cur = loadTdSave();
      const eq = getEquipped(cur);
      const act = activatedHiddenCount(eq);
      const bonus = getGearBonus(cur);
      const head = root.querySelector<HTMLDivElement>('#td-gear-head');
      if (head) head.textContent = `Dòng ẩn sáng ${bonus.activeLines}/${bonus.totalHiddenLines}${bonus.fullRing ? ' • NGŨ HÀNH VIÊN MÃN!' : ''} • Kho ${cur.gearInventory?.length ?? 0} món`;
      const sum = root.querySelector<HTMLDivElement>('#td-gear-sum');
      if (sum) {
        const parts: string[] = [];
        for (const el of ALL_ELEMENTS) if (bonus.elementDmg[el]) parts.push(`${ELEMENT_INFO[el].label} +${Math.round(bonus.elementDmg[el]! * 100)}%`);
        for (const [k, v] of Object.entries(bonus.stats)) if (v) parts.push(statText({ kind: k as never, value: v }));
        for (const st of bonus.sets) parts.push(`${st.name} (${st.count} món)`);
        sum.textContent = parts.length ? `Đang có: ${parts.join(' • ')}` : 'Chưa mặc gì.';
      }
      const rows = root.querySelector<HTMLDivElement>('#td-gear-rows');
      if (rows) {
        const cells = GEAR_SLOTS.map((sl) => {
          const it = eq[sl.id];
          const info = it ? ELEMENT_INFO[it.element] : null;
          const border = info ? `border-color:${info.colorHex}` : '';
          const nameHtml = it && info ? `<span style="color:${info.colorHex}">${it.name}</span>` : '<span style="opacity:.6">— trống —</span>';
          return `<button class="td-ctrl-btn" data-gear-slot="${sl.id}" data-testid="gear-slot-${sl.id}" style="text-align:left;padding:6px;min-height:48px;${border}"><small>${sl.label} ${it ? '●'.repeat(act[sl.id] ?? 0) + '○'.repeat(Math.max(0, it.hidden.length - (act[sl.id] ?? 0))) : ''}</small><br>${nameHtml}</button>`;
        }).join('');
        rows.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px">${cells}</div>`;
        rows.querySelectorAll<HTMLButtonElement>('[data-gear-slot]').forEach((btn) => {
          btn.onclick = () => {
            pickSlot = pickSlot === btn.dataset.gearSlot ? null : (btn.dataset.gearSlot as GearSlotId);
            sound.playUiClick();
            renderGear();
          };
        });
      }
      const pick = root.querySelector<HTMLDivElement>('#td-gear-pick');
      if (!pick) return;
      if (!pickSlot) {
        pick.innerHTML = '';
        return;
      }
      const slotId = pickSlot;
      const label = GEAR_SLOTS.find((x) => x.id === slotId)!.label;
      const owned = (cur.gearInventory ?? []).filter((it) => it.slot === slotId);
      const list = owned.length === 0
        ? '<div class="td-stage-sub">Chưa có món nào loại này. Thắng màn để rơi đồ.</div>'
        : owned.map((it) => {
            const info = ELEMENT_INFO[it.element];
            const on = eq[slotId]?.uid === it.uid;
            return `<button class="td-ctrl-btn" data-gear-item="${it.uid}" style="display:block;width:100%;text-align:left;margin-top:4px;padding:6px;border-color:${info.colorHex}">${on ? '✔ ' : ''}<span style="color:${info.colorHex}">${it.name}</span> <small>(${RARITY_LABEL[it.rarity]}, ${info.label})</small><br><small>${it.visible.map(statText).join('<br>')}<br><i>Ẩn: ${it.hidden.map(statText).join('<br>')}</i></small></button>`;
          }).join('');
      const offBtn = eq[slotId] ? `<button class="td-ctrl-btn" data-gear-off="1" style="margin-top:4px">Cởi ${label}</button>` : '';
      const [supA, supB] = supporterSlots(slotId);
      const supLabel = (id: GearSlotId) => GEAR_SLOTS.find((x) => x.id === id)!.label;
      const setHint = GEAR_SETS.filter((st) => st.pieces.some((p) => p.slot === slotId)).map((st) => st.name).join(', ');
      pick.innerHTML = `<div style="margin-top:8px"><strong>Chọn ${label}:</strong> <small>chống lưng: ${supLabel(supA)} + ${supLabel(supB)}${setHint ? ` • có trong ${setHint}` : ''}</small></div>${list}${offBtn}`;
      pick.querySelectorAll<HTMLButtonElement>('[data-gear-item]').forEach((b) => {
        b.onclick = () => {
          equipGear(slotId, b.dataset.gearItem!);
          sound.playUiClick();
          renderGear();
        };
      });
      pick.querySelector<HTMLButtonElement>('[data-gear-off]')?.addEventListener('click', () => {
        equipGear(slotId, null);
        sound.playUiClick();
        renderGear();
      });
    };
    renderGear();
    this.overlayEl = root;

    const startBtn = root.querySelector<HTMLButtonElement>('#btn-start-stage-1');
    if (startBtn) {
      startBtn.onclick = () => {
        sound.playUiClick();
        this.unmountOverlay();
        this.scene.start(SCENE_KEYS.TD_STAGE, { stageId: 'stage_1' });
      };
    }
    const startBtn2 = root.querySelector<HTMLButtonElement>('#btn-start-stage-2');
    if (startBtn2 && stage2Unlocked) {
      startBtn2.onclick = () => {
        sound.playUiClick();
        this.unmountOverlay();
        this.scene.start(SCENE_KEYS.TD_STAGE, { stageId: 'stage_2' });
      };
    }
    const startBtn3 = root.querySelector<HTMLButtonElement>('#btn-start-stage-3');
    if (startBtn3 && stage3Unlocked) {
      startBtn3.onclick = () => {
        sound.playUiClick();
        this.unmountOverlay();
        this.scene.start(SCENE_KEYS.TD_STAGE, { stageId: 'stage_3' });
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
