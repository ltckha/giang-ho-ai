import Phaser from 'phaser';
import { CONTENT } from '../core/contentRegistry';
import { ELEMENT_INFO } from '../core/elements';
import { SECTS, getSectSkills } from '../core/skills';
import type { SectId } from '../core/types';
import { gameState } from '../game/gameState';
import { SCENE_KEYS, getSceneKeyForMap } from '../game/sceneKeys';
import { sound } from '../game/sound';

const SECT_ORDER: SectId[] = ['sect_open', 'sect_closed', 'sect_ban'];

/**
 * Màn hình khởi đầu: chọn tiếp tục bản lưu localStorage hoặc gia nhập 1 trong 3 môn phái.
 */
export class TitleScene extends Phaser.Scene {
  private overlayEl: HTMLDivElement | null = null;
  private motes: Array<{ dot: Phaser.GameObjects.Arc; speedY: number; phase: number }> = [];

  constructor() {
    super({ key: SCENE_KEYS.TITLE });
  }

  public create(): void {
    this.motes = [];
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#13110f');

    // Nền trang trí linh thạch xanh lam & vòng đồng cổ xoay nhẹ
    const g = this.add.graphics();
    g.lineStyle(2, 0xc7a45a, 0.14);
    g.strokeCircle(width * 0.5, height * 0.48, Math.min(width, height) * 0.38);
    g.lineStyle(1.5, 0x4cc9f0, 0.14);
    g.strokeCircle(width * 0.5, height * 0.48, Math.min(width, height) * 0.28);

    for (let i = 0; i < 28; i++) {
      const x = Phaser.Math.Between(20, Math.max(40, width - 20));
      const y = Phaser.Math.Between(20, Math.max(40, height - 20));
      const isCyan = i % 2 === 0;
      const dot = this.add.circle(
        x,
        y,
        Phaser.Math.FloatBetween(2, 4.5),
        isCyan ? 0x4cc9f0 : 0xe8c468,
        Phaser.Math.FloatBetween(0.18, 0.55),
      );
      this.motes.push({
        dot,
        speedY: Phaser.Math.FloatBetween(8, 22),
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
      m.dot.x += Math.sin(time * 0.001 + m.phase) * 8 * dt;
      if (m.dot.y < -10) {
        m.dot.y = height + 10;
        m.dot.x = Phaser.Math.Between(16, Math.max(32, width - 16));
      }
    }
  }

  private getTextureDataUrl(key: string): string {
    const tex = this.textures.get(key);
    const source = tex?.getSourceImage() as HTMLCanvasElement | undefined;
    if (source && typeof source.toDataURL === 'function') {
      return source.toDataURL();
    }
    return '';
  }

  private mountTitleOverlay(): void {
    this.unmountOverlay();
    const container = document.getElementById('game-container');
    if (!container) return;

    const root = document.createElement('div');
    root.className = 'gh-overlay';
    root.id = 'gh-title-overlay';

    const wrap = document.createElement('div');
    wrap.className = 'gh-title-wrap';

    // Tiêu đề game
    const header = document.createElement('div');
    header.className = 'gh-title-header';
    header.innerHTML = `
      <h1>${CONTENT.gameTitle}</h1>
      <p>Giang hồ cổ trang thời khôi lỗi biết nghĩ • 3 đồng đội AI gỗ-đồng chạy linh thạch • Chơi offline trên điện thoại &amp; máy tính</p>
    `;
    wrap.appendChild(header);

    // Thanh tiếp tục bản lưu nếu đã có trong localStorage
    const saved = gameState.peekSavedGame();
    if (saved) {
      const continueBar = document.createElement('div');
      continueBar.className = 'gh-continue-bar';
      const sectMeta = CONTENT.sects[saved.sectId];
      const mapMeta = CONTENT.maps[saved.mapId];
      continueBar.innerHTML = `
        <div class="gh-continue-meta">
          <strong>Tiếp tục hành trình đã lưu</strong><br/>
          ${sectMeta.name} • Cấp ${saved.level} • ${mapMeta.name} • ${saved.silver} Bạc • ${saved.spiritStones} Linh Thạch${saved.bossDefeated ? ' • Đã hạ Sơ Giác' : ''}
        </div>
      `;
      const btnGroup = document.createElement('div');
      btnGroup.style.display = 'flex';
      btnGroup.style.gap = '8px';

      const btnCont = document.createElement('button');
      btnCont.className = 'gh-btn gh-btn-cyan';
      btnCont.textContent = 'Tiếp tục chơi';
      btnCont.onclick = () => {
        sound.playUiClick();
        const loaded = gameState.continueSavedGame();
        if (loaded) {
          this.unmountOverlay();
          this.scene.start(getSceneKeyForMap(loaded.mapId));
        }
      };

      const btnClear = document.createElement('button');
      btnClear.className = 'gh-btn gh-btn-secondary';
      btnClear.textContent = 'Xóa bản lưu';
      btnClear.onclick = () => {
        sound.playUiClick();
        gameState.resetSave();
        this.mountTitleOverlay();
      };

      btnGroup.appendChild(btnCont);
      btnGroup.appendChild(btnClear);
      continueBar.appendChild(btnGroup);
      wrap.appendChild(continueBar);
    }

    // Lưới chọn 3 môn phái
    const grid = document.createElement('div');
    grid.className = 'gh-sect-grid';

    for (const sectId of SECT_ORDER) {
      const sectDef = SECTS[sectId];
      const sectInfo = CONTENT.sects[sectId];
      const elInfo = ELEMENT_INFO[sectDef.element];
      const skills = getSectSkills(sectId)
        .map((s) => `${s.slot}. ${CONTENT.skills[s.id].name}`)
        .join(' • ');
      const avatarSrc = this.getTextureDataUrl(`player_${sectId}`);

      const card = document.createElement('div');
      card.className = 'gh-sect-card';
      card.dataset.sectId = sectId;
      card.innerHTML = `
        <div class="gh-sect-head">
          ${avatarSrc ? `<img class="gh-sect-avatar" src="${avatarSrc}" alt="${sectInfo.name}" />` : ''}
          <div>
            <div class="gh-sect-name">${sectInfo.name}</div>
            <span class="gh-badge" style="background:${elInfo.colorHex}">Hệ ${elInfo.label}</span>
          </div>
        </div>
        <div class="gh-sect-stance">${sectInfo.stance}</div>
        <div class="gh-sect-stance" style="color:#c2b399">${sectInfo.weaponDesc}</div>
        <div class="gh-sect-bonus">${sectInfo.bonusDesc}</div>
        <div class="gh-sect-skills"><strong>4 Chiêu:</strong> ${skills}</div>
      `;

      const startBtn = document.createElement('button');
      startBtn.className = 'gh-btn';
      startBtn.style.marginTop = 'auto';
      startBtn.textContent = `Chọn ${sectInfo.name}`;
      startBtn.onclick = () => {
        sound.playUiClick();
        const fresh = gameState.startNewGame(sectId);
        this.unmountOverlay();
        this.scene.start(getSceneKeyForMap(fresh.mapId));
      };
      card.appendChild(startBtn);
      grid.appendChild(card);
    }

    wrap.appendChild(grid);

    const foot = document.createElement('div');
    foot.className = 'gh-title-foot';
    foot.textContent =
      'Phím tắt: WASD / Mũi tên di chuyển • 1-4 hoặc Space đánh chiêu • E trò chuyện/vào cổng • Q/R uống bình • I Túi đồ • M Nhiệm vụ • Điện thoại: dùng cần ảo & nút chạm.';
    wrap.appendChild(foot);

    root.appendChild(wrap);
    container.appendChild(root);
    this.overlayEl = root;
  }

  private unmountOverlay(): void {
    if (this.overlayEl) {
      this.overlayEl.remove();
      this.overlayEl = null;
    }
  }
}
