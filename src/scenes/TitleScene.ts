import { getSyncKey, newSyncKey, setSyncKey, keyLink, keyFromLocation, pushProgress, pullProgress, lastSyncedAt } from '../game/cloudSync';
import { exportSaveCode, importSaveCode, saveLink, saveQrPng, codeFromLocation, hasProgress, requestPersistentStorage, isInstalledApp, isIOS, canPromptInstall, promptInstall } from '../game/saveCode';
import { isLiveActive, startLive, stopLive } from '../game/liveMode';
import Phaser from 'phaser';
import { ALL_ELEMENTS, ELEMENT_COUNTERS, ELEMENT_GENERATES, ELEMENT_INFO } from '../core/elements';
import {
  activatedHiddenCount,
  bonusChips,
  GEAR_SETS,
  GEAR_SLOTS,
  previewEquip,
  itemScoreDelta,
  bestEquip,
  slotsWithUpgrade,
  BETTER_MIN,
  RARITY_LABEL,
  statShort,
  statTiny,
  statText,
  supporterSlots,
  type GearSlotId,
} from '../core/equipment';
import { chooseVehicle, equipGear, getEquipped, getGearBonus, getVehicle, loadTdSave, saveStreetLoadout } from '../core/saveSystem';
import { vehicleAppliesTo, VEHICLES, type VehicleId } from '../core/vehicles';
import { vehicleIconHtml } from '../game/vehicleUi';
import { FACADE_ATLAS_KEY, loadStreetAtlasesInBackground } from '../game/sparkArt';
import { BootScene } from './BootScene';
import { getShopStage, isShopUnlocked, SHOP_STREET, shopStars, type ShopOnStreet } from '../core/shopStreet';
import {
  ALL_ENEMY_DEFINITIONS,
  ALL_TOWER_DEFINITIONS,
  getStageTowerList,
  REAL_STREET_SHOPS,
  REAL_STREET_STAGES,
  STAGES,
} from '../core/tdDefinitions';
import { isStreetStageUnlocked, realStreetsOpen, streetProgress } from '../core/streetProgress';
import type { ElementType, EnemyId, StageDefinition, StageId, TowerId } from '../core/types';
import {
  getAtlasFrameDataUrl,
  getAtlasFrameDataUrlFrom,
  getEnemyFrameName,
  getGearAtlasFrameDataUrl,
  getGearIconFrameName,
  getGearSetBadgeFrameName,
  getTowerFrameName,
  STAGE1_MAP_KEY,
  ATLAS_KEY,
} from '../game/atlasIcons';
import {
  getEmptySlotSilhouetteSvg,
  getGeneratorElementFor,
  getSlotSupportState,
  RARITY_THEME,
} from '../game/gearUiHelpers';
import { music } from '../game/music';
import { getInitialReduceMotion, loadRealStreetLoadout, saveRealStreetLoadout } from '../game/preferences';
import { SCENE_KEYS } from '../game/sceneKeys';
import { renderShopkeeperAvatarSvg } from '../game/shopkeeperAvatar';
import { renderShopFacadeSvg } from '../game/shopStreetArt';
import BIG_MAP_PINS from '../core/streets/bigMapPins.json';
import { regionFlags } from '../game/region';
import { PROVINCES, PROVINCE_LANDMARK, REGION_NAME, STREET_INFO, streetBannerUrl, type Region } from '../core/cities';
import { sound } from '../game/sound';
import { tr, currentLang, switchLang } from '../game/i18n';
import SIGNS_EN from '../core/streets/signsEn.json';
import { checkForUpdate } from '../game/freshness';

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

function getShopLifeIconFrame(stageId: StageId): string {
  if (stageId === 'stage_2') return 'icon_bread_life';
  if (stageId === 'stage_3') return 'icon_flower_life';
  if (stageId === 'stage_4' || stageId.startsWith('street_')) return 'icon_street_life';
  return 'icon_shoe_life';
}

function getStageMainEnemies(stage: StageDefinition): EnemyId[] {
  const seen = new Set<EnemyId>();
  for (const wave of stage.waves) {
    for (const grp of wave.groups) {
      seen.add(grp.enemyId);
    }
  }
  return Array.from(seen);
}

/** Vị trí ghim chọn phố trên Bản đồ Đà Lạt SVG (viewBox 360×190) */
const REAL_STREET_MAP_PINS: Record<string, { leftPct: number; topPct: number; shortName: string; tag: string }> = {
  street_phan_dinh_phung: {
    leftPct: 30,
    topPct: 28,
    shortName: 'Phan Đình Phùng',
    tag: 'Cầu Quẹo • Phố tiệm dân sinh',
  },
  street_tang_bat_ho: {
    leftPct: 44,
    topPct: 58,
    shortName: 'Tăng Bạt Hổ',
    tag: 'Dốc chợ • Quán đêm • Bar hầm',
  },
  street_pho_ca_phe: {
    leftPct: 72,
    topPct: 32,
    shortName: 'Phố Cà Phê',
    tag: 'Cà phê xưa • Sân thượng • Cây xanh',
  },
  street_nguyen_van_troi: { leftPct: 60, topPct: 50, shortName: 'Phố Kem Bơ', tag: 'Kem bơ • Chè • Dốc chùa' },
  street_hoang_dieu: { leftPct: 20, topPct: 50, shortName: 'Phố Lẩu Bò', tag: 'Lẩu bò Ba Toa • Xíu mại' },
  street_tran_phu: { leftPct: 50, topPct: 80, shortName: 'Trần Phú', tag: 'Khách sạn cổ • Tiệm bánh' },
  // Phố ngoài Đà Lạt: ghim ở góc dưới phải, ghi rõ thành phố (Claude)
  street_cho_ben_thanh: {
    leftPct: 80,
    topPct: 80,
    shortName: 'Chợ Bến Thành (Sài Gòn)',
    tag: 'Sài Gòn • 4 cửa chợ • Chợ đêm',
  },
};

const SHOP_GROUPS_FOR_BOSS: Array<{ label: string; ids: TowerId[] }> = [
  { label: '👟 Tiệm Giày Hẻm Dốc', ids: ['wood_tower', 'metal_tower', 'water_tower', 'fire_tower', 'earth_tower'] },
  { label: '🥖 Tiệm Bánh Đầu Phố', ids: ['bk_swatter', 'bk_jar', 'bk_fan', 'bk_oven', 'bk_fridge'] },
  { label: '🌸 Tiệm Hoa Cuối Dốc', ids: ['fl_can', 'fl_shears', 'fl_lime', 'fl_heater', 'fl_vent'] },
];

export class TitleScene extends Phaser.Scene {
  private overlayEl: HTMLDivElement | null = null;
  private rainLines: Array<{ x: number; y: number; len: number; speed: number }> = [];
  private weatherGfx: Phaser.GameObjects.Graphics | null = null;
  private reduceMotion = false;
  private hashChangeHandler: (() => void) | null = null;
  private static liveAutoStarted = false;
  /** Bảng thắng bấm ▶ Ra phố đánh trùm: mở sẵn bảng Chuẩn bị cho màn này */
  public static pendingLoadoutStage: StageId | null = null;
  /** Trang phố đang mở (về từ màn chơi thì mở lại đúng phố đó) */
  public static lastStreetTab: string | null = null;
  private static cloudPulled = false;

  constructor() {
    super({ key: SCENE_KEYS.TITLE });
  }

  public create(): void {
    void checkForUpdate(() => true); // về màn chính: có bản mới thì tải lại cho mã game và ảnh cùng 1 bản
    // 🔑 Quét QR chìa khoá (#khoa=…): nhận chìa khoá, lấy tiến độ mới nhất từ máy chủ
    const scannedKey = keyFromLocation();
    if (scannedKey) {
      history.replaceState(null, '', location.pathname + location.search);
      if (scannedKey !== getSyncKey() && window.confirm(hasProgress() ? 'Dùng QR chìa khoá này? Tiến độ trên máy này sẽ được thay bằng tiến độ của chìa khoá.' : 'Dùng QR chìa khoá này để lấy tiến độ? (chỉ dùng QR của chính bạn)')) {
        setSyncKey(scannedKey);
        void pullProgress(true).then((r) => {
          window.alert(r === 'applied' ? '✔ Đã lấy tiến độ — từ giờ tự đồng bộ!' : r === 'none' ? '✔ Đã nhận chìa khoá (chưa có tiến độ trên máy chủ).' : '⚠️ Chưa lấy được tiến độ (mạng / máy chủ). Thử lại sau.');
          this.unmountOverlay();
          this.scene.restart();
        });
        return;
      }
    } else if (getSyncKey() && !TitleScene.cloudPulled) {
      // Mở game: máy chủ có bản mới hơn (chơi ở máy khác) → tự tải về; rồi gửi bản máy này lên
      TitleScene.cloudPulled = true;
      void pullProgress().then((r) => {
        // Chỉ gửi lên khi vừa đọc được máy chủ rõ ràng; mất mạng / lỗi thì KHÔNG gửi (đánh giá độc lập C1)
        if (r === 'applied' || r === 'same' || r === 'none') void pushProgress();
        if (r === 'applied') {
          this.unmountOverlay();
          this.scene.restart();
        }
      });
    } else if (getSyncKey()) {
      void pushProgress();
    }
    // Mở từ link mã lưu (#ma=…): hỏi rồi chuyển tiến độ sang máy này (anh Kha 25/11)
    const linkCode = codeFromLocation();
    if (linkCode) {
      history.replaceState(null, '', location.pathname + location.search);
      // Luôn hỏi trước khi nạp link lưu (đánh giá độc lập C3)
      if (window.confirm(hasProgress() ? 'Chuyển tiến độ trong link vào máy này? (tiến độ đang có trên máy này sẽ được thay)' : 'Nạp tiến độ từ link này? (chỉ dùng link của chính bạn)')) {
        void importSaveCode(linkCode).then((res) => {
          window.alert(res.ok ? '✔ Đã chuyển tiến độ — chơi tiếp nhé!' : '⚠️ Link lưu bị thiếu hoặc hỏng.');
          this.unmountOverlay();
          this.scene.restart();
        });
      }
    }
    // LIVE TikTok (Claude): ?live=1 vào thẳng; về màn chính thì tắt LIVE
    if (isLiveActive()) stopLive();
    const liveQ = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (liveQ && (liveQ.get('live') === '1' || liveQ.get('quay')) && !TitleScene.liveAutoStarted) {
      TitleScene.liveAutoStarted = true;
      // ?quay=<mã màn>: quay clip kênh Gọn — máy tự chơi, không hiện khung LIVE
      startLive(this.scene, { clean: Boolean(liveQ.get('quay')), stageId: liveQ.get('quay') ?? liveQ.get('man') ?? undefined });
      return;
    }
    // Lối vào thử phố thật / trùm phố: thêm #<mã màn> vào link (vd #street_pho_ca_phe) — Claude
    const hashStage = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    if (hashStage && hashStage in STAGES && (hashStage.startsWith('street_') || hashStage === 'stage_4')) {
      this.scene.start(SCENE_KEYS.TD_STAGE, { stageId: hashStage as StageId });
      return;
    }
    this.reduceMotion = getInitialReduceMotion();
    music.setTrack('title');
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

    if (typeof window !== 'undefined') {
      this.hashChangeHandler = () => {
        const nextHash = window.location.hash.replace('#', '');
        if (nextHash && nextHash in STAGES && (nextHash.startsWith('street_') || nextHash === 'stage_4')) {
          this.unmountOverlay();
          this.scene.start(SCENE_KEYS.TD_STAGE, { stageId: nextHash as StageId });
        }
      };
      window.addEventListener('hashchange', this.hashChangeHandler);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (typeof window !== 'undefined' && this.hashChangeHandler) {
        window.removeEventListener('hashchange', this.hashChangeHandler);
        this.hashChangeHandler = null;
      }
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

  private resolveSavedLoadoutForStage(stage: StageDefinition): TowerId[] {
    const allowed = stage.towerIds ?? [];
    const size = stage.loadoutSize ?? 6;
    const fallback = (stage.defaultLoadout ?? allowed.slice(0, size)).slice(0, size);
    // Màn tiệm: bộ món cố định của tiệm, không chọn (anh Kha 25/11)
    if (stage.shopIndex) return fallback;
    if (stage.id === 'stage_4') {
      const saved = loadTdSave().streetLoadout;
      if (saved && saved.length > 0) {
        const clean = saved.filter((id) => allowed.includes(id)).slice(0, size);
        if (clean.length === size) return clean;
      }
      return fallback;
    }
    const savedReal = loadRealStreetLoadout(stage.id, allowed, size);
    return (savedReal as TowerId[] | null) ?? fallback;
  }

  private mountTitleOverlay(): void {
    this.unmountOverlay();
    const container = document.getElementById('game-container');
    if (!container) return;

    const save = loadTdSave();
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const queryStage = params?.get('stage');
    const isBotBypass = params?.get('bot') === '1';
    // Chế độ chủ (anh Kha xem thử): link có #mo hoặc ?mo=1 → mở hết màn, nhớ trên máy; #dong để tắt
    const ownerOpenAll = (() => {
      try {
        const h = typeof window !== 'undefined' ? window.location.hash : '';
        if (h === '#mo' || params?.get('mo') === '1') localStorage.setItem('gonpho_mo_het', '1');
        if (h === '#dong') localStorage.removeItem('gonpho_mo_het');
        return localStorage.getItem('gonpho_mo_het') === '1';
      } catch {
        return false;
      }
    })();

    const curHard = (loadTdSave().hardStarsByStage ?? {}) as Record<string, number>;
    const hasStreetChampionBadge =
      Boolean(save.badges?.includes('giu_tron_pho')) || (save.starsByStage.stage_4 ?? 0) > 0;
    const isRealStreetsUnlocked = realStreetsOpen(save) || isBotBypass || ownerOpenAll;

    const isUnlocked = (shop: ShopOnStreet): boolean =>
      isShopUnlocked(save, shop) || isBotBypass || ownerOpenAll || queryStage === String(shop.order);

    let selectedShopId: ShopOnStreet['stageId'] =
      SHOP_STREET.find((s) => String(s.order) === queryStage)?.stageId ?? SHOP_STREET[0]!.stageId;
    let selectedRealStreetId: StageId = REAL_STREET_STAGES[0]?.id ?? 'street_tang_bat_ho';
    /** Màn đang chọn trong từng phố thật (tiệm hoặc màn phố) — Claude */
    const selectedStreetStage: Record<string, StageId> = {};

    const championBadgeUrl = getAtlasFrameDataUrl(this, 'icon_badge_giu_tron_pho');

    // Hướng dẫn bằng hình, tối đa 1–2 câu mỗi trang (Claude)
    const elIco = (el: ElementType) => {
      const u = getAtlasFrameDataUrl(this, `el_${el}`);
      return u ? `<img class="td-help-el" src="${u}" alt="${ELEMENT_INFO[el].label}" data-tip="${ELEMENT_INFO[el].label}" />` : `<b>${ELEMENT_INFO[el].label}</b>`;
    };
    const ring = (next: Record<ElementType, ElementType>, start: ElementType) => {
      const out: string[] = [];
      let el = start;
      for (let i = 0; i < 5; i += 1) { out.push(elIco(el)); el = next[el]; }
      out.push(elIco(start));
      return out.join('<span class="td-help-arrow">→</span>');
    };
    const helpHtml = `
      <div class="td-help-page"><div class="td-help-row">${ring(ELEMENT_COUNTERS, 'kim')}</div><p>Món <b>khắc</b> quái → đánh mạnh gần gấp đôi. Đặt sai → yếu.</p></div>
      <div class="td-help-page"><div class="td-help-row">${ring(ELEMENT_GENERATES, 'moc')}</div><p>Hai món <b>sinh</b> nhau đứng cạnh → cùng mạnh lên.</p></div>
      <div class="td-help-page"><div class="td-help-row td-help-emoji">⭕ → 🏠 → ⬆️</div><p>Chạm ô trống để đặt món, chạm món để nâng cấp. Gọi đợt sớm được thêm xu.</p></div>
      <div class="td-help-page"><div class="td-help-row td-help-emoji">🏠 🏠 🏠 → 👹</div><p>Giữ được nửa số tiệm là ra phố đánh trùm. Tiệm còn lại chơi thêm lấy sao, đồ, xe.</p></div>
      <div class="td-help-page"><div class="td-help-row td-help-emoji">🎁 → 🎒</div><p>Thắng màn rơi đồ. Mặc đồ ở nút 🎒.</p></div>
    `;

    const root = document.createElement('div');
    root.className = 'td-title-overlay';
    root.id = 'td-title-overlay';

    root.innerHTML = `
      <div class="td-title-card td-shoebox-panel">
        <div class="td-home-head">
          <h1 class="td-title-heading">Gọn Phố</h1>
          ${regionFlags().ageLabel ? `<span class="td-age-label" data-testid="age-label" title="Phân loại độ tuổi">${regionFlags().ageLabel}</span>` : ''}
          ${hasStreetChampionBadge ? `<span class="td-home-medal" data-testid="badge-giu-tron-pho" data-tip="Huy hiệu Giữ trọn phố">${championBadgeUrl ? `<img src="${championBadgeUrl}" alt="" />` : '🏆'}</span>` : ''}
          <div class="td-home-icons" data-testid="td-audio-controls">
            <button type="button" id="btn-toggle-music" data-testid="btn-toggle-music" class="td-icon-btn ${music.isMuted() ? 'muted' : ''}" aria-label="Nhạc">${music.isMuted() ? '<img class="td-ui-ico" src="./assets/ui/ui_nhac_tat.webp" alt="" />' : '<img class="td-ui-ico" src="./assets/ui/ui_nhac_bat.webp" alt="" />'}</button>
            <button type="button" id="btn-toggle-sfx" data-testid="btn-toggle-sfx" class="td-icon-btn ${sound.isMuted() ? 'muted' : ''}" aria-label="Tiếng">${sound.isMuted() ? '<img class="td-ui-ico" src="./assets/ui/ui_tieng_tat.webp" alt="" />' : '<img class="td-ui-ico" src="./assets/ui/ui_tieng_bat.webp" alt="" />'}</button>
            <button type="button" id="btn-open-gear" data-testid="btn-open-gear" class="td-icon-btn" aria-label="Trang bị"><img class="td-ui-ico" src="./assets/ui/ui_trang_bi.webp" alt="" /></button>
            <button type="button" id="btn-open-help" data-testid="btn-open-help" class="td-icon-btn" aria-label="Hướng dẫn"><img class="td-ui-ico" src="./assets/ui/ui_huong_dan.webp" alt="" /></button>
            <button type="button" id="btn-lang" data-testid="btn-lang" class="td-icon-btn td-lang-btn" aria-label="Đổi ngôn ngữ / Language">${currentLang() === 'en' ? 'VI' : 'EN'}</button>
            ${ownerOpenAll ? `<button type="button" id="btn-start-live" data-testid="btn-start-live" class="td-icon-btn" aria-label="Phát LIVE: máy tự chơi">📺</button>` : ''}
          </div>
        </div>
        <div id="td-install-nudge"></div>
        ${regionFlags().healthWarning ? `<div class="td-health-warning" data-testid="health-warning">${regionFlags().healthWarning}</div>` : ''}
        <div class="td-home-map td-bigmap" id="td-street-tabs" data-testid="street-tabs"></div>
        <div class="td-country" id="td-country" hidden>
          <div class="td-country-panel">
            <button type="button" class="td-close-btn" data-close-country aria-label="Đóng">✕</button>
            <h3>Bản đồ Việt Nam</h3>
            <p>34 tỉnh, thành theo địa giới mới (từ 1/7/2025). Đang mở: Lâm Đồng (Đà Lạt). ★ = thành phố trực thuộc trung ương.</p>
            <div class="td-country-list" id="td-country-list"></div>
          </div>
        </div>

        <section class="td-street-section td-street-page ${this.reduceMotion ? 'no-anim' : ''}" data-testid="shop-street">
          <div id="td-street-head"></div>
          <div class="td-street-list" id="td-street-list"></div>

          <!-- Việc 9: Bản đồ Đà Lạt chọn 2 phố thật (khóa đến khi thắng Trận trùm phố) -->
          <div class="td-dalat-real-section" id="td-dalat-real-streets" data-testid="dalat-real-streets"></div>

        </section>

        <div class="td-sheet-layer" id="td-gear-sheet" hidden>
          <div class="td-sheet-panel">
            <button type="button" class="td-close-btn td-sheet-close" data-close-sheet aria-label="Đóng">✕</button>
        <div class="td-stage-tag-box td-gear-panel ${this.reduceMotion ? 'no-anim' : ''}" id="td-gear-box" data-testid="td-gear-box">
          <div class="td-gear-header-row">
            <div class="td-gear-title" id="td-gear-head"></div>
            <div class="td-gear-header-right">
              <button type="button" class="td-gear-bag-pill" id="td-gear-inv-count" data-testid="btn-gear-bag" title="Mở túi đồ"></button>
              <button type="button" class="td-gear-help-btn" id="btn-gear-rules" data-testid="btn-gear-rules" aria-expanded="false" title="Xem luật trang bị">?</button>
            </div>
          </div>
          <div id="td-gear-rules-wrap"></div>
          <div id="td-gear-best"></div>
          <div id="td-gear-bag"></div>
          <div id="td-gear-fullring-banner"></div>
          <div class="td-gear-ring-stage" id="td-gear-ring-stage"></div>
          <div id="td-gear-pick"></div>
          <div class="td-gear-sets-wrap" id="td-gear-sets"></div>
          <div class="td-gear-sum-wrap" id="td-gear-sum"></div>
        </div>
          </div>
        </div>

        <div class="td-sheet-layer" id="td-help-sheet" data-testid="td-help-sheet" hidden>
          <div class="td-sheet-panel">
            <button type="button" class="td-close-btn td-sheet-close" data-close-sheet aria-label="Đóng">✕</button>
            <div class="td-save-box" data-testid="td-save-box">
              <div class="td-save-title">🔑 Lưu 1 lần — tự đồng bộ</div>
              <div class="td-save-row">
                <button type="button" class="td-save-btn primary" id="btn-key-qr" data-testid="btn-key-qr"><img class="td-ui-ico-sm" src="./assets/ui/ui_luu.webp" alt="" /> QR chìa khoá</button>
              </div>
              <div id="td-key-area"></div>
              <div class="td-save-title td-save-sub">💾 Cách khác (không cần mạng)</div>
              <div class="td-save-row">
                <button type="button" class="td-save-btn" id="btn-save-export" data-testid="btn-save-export">📤 Lấy mã</button>
                <button type="button" class="td-save-btn" id="btn-save-import-open" data-testid="btn-save-import-open">📥 Dán mã</button>
              </div>
              <div id="td-save-area"></div>
            </div>
            <div class="td-help-pages">${helpHtml}</div>
            <div class="td-element-guide" id="td-element-guide" data-testid="td-element-guide"></div>
          </div>
        </div>
        <div class="td-tip-bubble" id="td-tip-bubble" hidden></div>
      </div>
      <div id="td-loadout-modal-host"></div>
    `;

    container.appendChild(root);

    const launchStage = (stageId: StageId, loadout?: TowerId[]): void => {
      sound.playUiClick();
      this.unmountOverlay();
      this.scene.start(SCENE_KEYS.TD_STAGE, loadout ? { stageId, loadout } : { stageId });
    };

    /** Việc 8 & 9: Màn chọn bộ 6 món mang ra phố (cho Trận Trùm Phố 15→6 và 2 Phố Thật 9→6) */
    const openLoadoutPicker = (stage: StageDefinition): void => {
      const host = root.querySelector<HTMLDivElement>('#td-loadout-modal-host');
      if (!host) return;
      const limit = stage.loadoutSize ?? 6;
      const allowed = stage.towerIds ?? [];
      let chosen: TowerId[] = [...this.resolveSavedLoadoutForStage(stage)];
      const coinUrl = getAtlasFrameDataUrl(this, 'icon_coin');

      const placeByTower = new Map<string, { name: string; trait: string }>();
      for (const pl of stage.places ?? []) {
        placeByTower.set(pl.towerId, { name: pl.name, trait: pl.trait });
      }

      const renderModal = (): void => {
        const chosenDefs = chosen.map((id) => ALL_TOWER_DEFINITIONS[id]).filter(Boolean);
        const coveredEls = new Set<ElementType>(chosenDefs.map((d) => d.element));
        const hasSupport = chosenDefs.some((d) => d.role === 'support_buff');
        const ready = chosen.length === limit;

        const elCheckHtml = ALL_ELEMENTS.map((el) => {
          const info = ELEMENT_INFO[el];
          const ok = coveredEls.has(el);
          const ico = getAtlasFrameDataUrl(this, `el_${el}`);
          return `<span class="td-lo-check ${ok ? 'ok' : ''}" style="--el-c:${info.colorHex}">
            ${ico ? `<img src="${ico}" alt="" />` : ''}${info.label}${ok ? ' ✓' : ''}
          </span>`;
        }).join('');

        const renderTowerCard = (tid: TowerId): string => {
          const def = ALL_TOWER_DEFINITIONS[tid];
          if (!def) return '';
          const el = ELEMENT_INFO[def.element];
          const spUrl = getAtlasFrameDataUrl(this, getTowerFrameName(tid, 1, undefined, 0));
          const elUrl = getAtlasFrameDataUrl(this, `el_${def.element}`);
          const isSel = chosen.includes(tid);
          const placeInfo = placeByTower.get(tid);
          const roleShort =
            def.role === 'support_buff'
              ? 'Hỗ trợ'
              : def.role === 'aoe_splash'
                ? 'Đánh lan'
                : def.role === 'slow_aura'
                  ? 'Làm chậm'
                  : def.role === 'heavy_slow'
                    ? 'Đánh nặng'
                    : 'Bắn nhanh';
          return `
            <button
              type="button"
              class="td-lo-tower-card ${isSel ? 'selected' : ''}"
              data-lo-tower="${tid}"
              data-testid="loadout-pick-${tid}"
              style="--el-c:${el.colorHex}"
            >
              ${isSel ? '<span class="td-lo-tick">✓</span>' : ''}
              ${spUrl ? `<img class="td-lo-sprite" src="${spUrl}" alt="${def.tier1.name}" />` : ''}
              <div class="td-lo-name">${def.tier1.name}</div>
              ${placeInfo ? `<div class="td-lo-place">${placeInfo.name}</div>` : ''}
              <div class="td-lo-meta">
                <span class="td-mini-el-pill" style="background:${el.colorHex}">
                  ${elUrl ? `<img src="${elUrl}" alt="" />` : ''}${el.label}
                </span>
                <span class="td-lo-role">${roleShort}</span>
                <span class="td-mini-cost">${def.tier1.cost}${coinUrl ? `<img class="td-mini-coin" src="${coinUrl}" alt="" />` : ''}</span>
              </div>
            </button>
          `;
        };

        const cleanIds = stage.cleanTowerIds ?? [];
        const maxShop = stage.maxShopTowers;
        const shopChosen = chosen.filter((t) => !cleanIds.includes(t)).length;
        const groupsHtml =
          cleanIds.length > 0
            ? `<div class="td-lo-group">
                 <div class="td-lo-group-title">🧹 Đồ dọn phố</div>
                 <div class="td-lo-grid">${cleanIds.map(renderTowerCard).join('')}</div>
               </div>
               <div class="td-lo-group">
                 <div class="td-lo-group-title">🏠 Món tiệm mang theo (tối đa ${maxShop ?? 2}, đã chọn ${shopChosen})</div>
                 <div class="td-lo-grid">${allowed.filter((t) => !cleanIds.includes(t)).map(renderTowerCard).join('')}</div>
               </div>`
            : stage.id === 'stage_4'
            ? SHOP_GROUPS_FOR_BOSS.map(
                (grp) => `
                <div class="td-lo-group">
                  <div class="td-lo-group-title">${grp.label}</div>
                  <div class="td-lo-grid">${grp.ids.map(renderTowerCard).join('')}</div>
                </div>
              `,
              ).join('')
            : `<div class="td-lo-group">
                 <div class="td-lo-group-title">📍 ${allowed.length} món</div>
                 <div class="td-lo-grid">${allowed.map(renderTowerCard).join('')}</div>
               </div>`;

        host.innerHTML = `
          <div class="td-loadout-backdrop" data-testid="td-loadout-modal">
            <div class="td-loadout-sheet td-shoebox-panel">
              <div class="td-sheet-head">
                <div class="td-sheet-title-wrap">
                  <span class="td-tag-hole"></span>
                  <strong>Chuẩn bị</strong>
                </div>
                <button type="button" class="td-close-btn" id="btn-close-loadout" aria-label="Đóng">✕</button>
              </div>
              <div class="td-lo-subtitle">${stage.name}</div>
              ${vehicleAppliesTo(stage) ? `<div class="td-lo-vehicles" data-testid="vehicle-picker">${((loadTdSave().vehicles ?? ['di_bo']) as VehicleId[]).filter((v) => VEHICLES[v]).map((v) => `<button type="button" class="td-vehicle-chip ${v === getVehicle(loadTdSave()) ? 'selected' : ''}" data-vehicle="${v}" data-testid="vehicle-chip-${v}" data-tip="${VEHICLES[v].name}: ${VEHICLES[v].passiveText}. Chiêu: ${VEHICLES[v].activeName}">${vehicleIconHtml(this, VEHICLES[v])}</button>`).join('')}</div>` : ''}
              <div class="td-lo-hint-bar">

                <div class="td-lo-checks">
                  ${elCheckHtml}
                  <span class="td-lo-check ${hasSupport ? 'ok' : ''}" style="--el-c:#eab308">✨ Hỗ trợ${hasSupport ? ' ✓' : ''}</span>
                </div>
              </div>
              <div class="td-lo-scroll">${groupsHtml}</div>
              <div class="td-lo-footer">
                <button type="button" class="td-btn-secondary td-lo-reset-btn" id="btn-reset-loadout" data-testid="btn-reset-loadout">
                  ✨
                </button>
                <button
                  type="button"
                  class="${ready ? 'td-btn-primary' : 'td-btn-locked'} td-lo-confirm-btn"
                  id="btn-confirm-loadout"
                  data-testid="btn-confirm-loadout"
                  ${ready ? '' : 'disabled'}
                >
                  ${ready ? '▶' : `${chosen.length}/${limit}`}
                </button>
              </div>
            </div>
          </div>
        `;

        host.querySelector('#btn-close-loadout')?.addEventListener('click', () => {
          sound.playUiClick();
          host.innerHTML = '';
        });

        host.querySelector('#btn-reset-loadout')?.addEventListener('click', () => {
          sound.playUiClick();
          chosen = [...(stage.defaultLoadout ?? allowed.slice(0, limit))].slice(0, limit);
          renderModal();
        });

        host.querySelectorAll<HTMLButtonElement>('[data-vehicle]').forEach((btn) => {
          btn.onclick = () => {
            chooseVehicle(btn.dataset.vehicle as VehicleId);
            sound.playUiClick();
            renderModal();
          };
        });

        host.querySelectorAll<HTMLButtonElement>('[data-lo-tower]').forEach((btn) => {
          btn.onclick = () => {
            const tid = btn.dataset.loTower as TowerId;
            if (chosen.includes(tid)) {
              chosen = chosen.filter((x) => x !== tid);
              sound.playUiClick();
            } else if (
              stage.maxShopTowers !== undefined &&
              stage.cleanTowerIds &&
              !stage.cleanTowerIds.includes(tid) &&
              chosen.filter((x) => !stage.cleanTowerIds!.includes(x)).length >= stage.maxShopTowers
            ) {
              // Màn phố: đã đủ món tiệm → thay món tiệm chọn sớm nhất (không đơ)
              const oldest = chosen.find((x) => !stage.cleanTowerIds!.includes(x));
              chosen = [...chosen.filter((x) => x !== oldest), tid];
              sound.playBuildOrUpgrade();
            } else if (chosen.length < limit) {
              chosen = [...chosen, tid];
              sound.playBuildOrUpgrade();
            } else {
              // Đã đủ món: thay món chọn sớm nhất để xoay nhanh (Antigravity rà 24/11)
              chosen = [...chosen.slice(1), tid];
              sound.playBuildOrUpgrade();
            }
            renderModal();
          };
        });

        host.querySelector<HTMLButtonElement>('#btn-confirm-loadout')?.addEventListener('click', () => {
          if (chosen.length !== limit) return;
          if (stage.id === 'stage_4') {
            saveStreetLoadout(chosen, allowed, limit);
          } else {
            saveRealStreetLoadout(stage.id, chosen, allowed, limit);
          }
          host.innerHTML = '';
          launchStage(stage.id, chosen);
        });
      };

      renderModal();
    };

    const syncAudioButtons = (): void => {
      const mBtn = root.querySelector<HTMLButtonElement>('#btn-toggle-music');
      if (mBtn) {
        const mOff = music.isMuted();
        mBtn.innerHTML = `<img class="td-ui-ico" src="./assets/ui/${mOff ? 'ui_nhac_tat' : 'ui_nhac_bat'}.webp" alt="" />`;
        mBtn.classList.toggle('muted', mOff);
        mBtn.setAttribute('aria-pressed', mOff ? 'false' : 'true');
      }
      const sBtn = root.querySelector<HTMLButtonElement>('#btn-toggle-sfx');
      if (sBtn) {
        const sOff = sound.isMuted();
        sBtn.innerHTML = `<img class="td-ui-ico" src="./assets/ui/${sOff ? 'ui_tieng_tat' : 'ui_tieng_bat'}.webp" alt="" />`;
        sBtn.classList.toggle('muted', sOff);
        sBtn.setAttribute('aria-pressed', sOff ? 'false' : 'true');
      }
    };

    root.querySelector<HTMLButtonElement>('#btn-toggle-music')?.addEventListener('click', () => {
      music.toggleMute();
      sound.playUiClick();
      syncAudioButtons();
    });

    root.querySelector<HTMLButtonElement>('#btn-toggle-sfx')?.addEventListener('click', () => {
      sound.toggleMute();
      if (!sound.isMuted()) sound.playUiClick();
      syncAudioButtons();
    });

    /* ===== Màn chính gọn (Claude): bảng trang bị / hướng dẫn, chạm hình xem tên ===== */
    const openSheet = (id: string): void => {
      sound.playUiClick();
      root.querySelector<HTMLDivElement>(id)?.removeAttribute('hidden');
    };
    root.querySelector('#btn-open-gear')?.addEventListener('click', () => openSheet('#td-gear-sheet'));
    // ★ Khó (mở khi màn 3 sao): quái nhiều máu, nhanh hơn, rơi thêm đồ — anh Kha chốt 25/11
    root.addEventListener('click', (ev) => {
      const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('[data-hard-stage]');
      if (!b) return;
      ev.stopPropagation();
      sound.playUiClick();
      this.unmountOverlay();
      this.scene.start(SCENE_KEYS.TD_STAGE, { stageId: b.dataset.hardStage as StageId, hard: true });
    });

    /* ===== 💾 Mã lưu + nhắc đưa ra màn hình chính (Claude 24/11) ===== */
    requestPersistentStorage();
    const keyArea = root.querySelector<HTMLDivElement>('#td-key-area');
    const showKeyQr = (k: string, status: string): void => {
      if (!keyArea) return;
      const link = keyLink(k);
      let png = '';
      try {
        png = saveQrPng(link);
      } catch {
        /* bỏ qua */
      }
      keyArea.innerHTML = `
        ${png ? `<div class="td-save-qr-wrap"><img class="td-save-qr" data-testid="td-key-qr" src="${png}" alt="QR chìa khoá" /></div>
        <div class="td-save-row"><a class="td-save-btn" href="${png}" download="gon-pho-chia-khoa.png" data-testid="btn-key-qr-save">🖼️ Lưu ảnh QR</a></div>` : ''}
        <div class="td-save-msg" data-testid="td-key-status">${status}</div>
        <div class="td-save-msg">Lưu ảnh QR này 1 lần. Máy khác quét là chơi tiếp, các máy tự đồng bộ. Đừng đăng ảnh QR lên mạng.</div>
        <div class="td-save-row"><button type="button" class="td-save-btn" id="btn-key-new" data-testid="btn-key-new">♻️ Đổi chìa khoá mới</button></div>`;
      keyArea.querySelector('#btn-key-new')?.addEventListener('click', async () => {
        if (!window.confirm('Tạo chìa khoá mới? QR cũ sẽ không còn đồng bộ với máy này.')) return;
        const nk = newSyncKey();
        const r = await pushProgress();
        showKeyQr(nk, r === 'ok' ? '✔ Đã đồng bộ' : r === 'off' ? '⚠️ Máy chủ chưa bật — tạm lưu trên máy này' : '⚠️ Chưa đồng bộ được (mạng)');
      });
    };
    root.querySelector('#btn-key-qr')?.addEventListener('click', async () => {
      sound.playUiClick();
      const k = getSyncKey() ?? newSyncKey();
      showKeyQr(k, '⏳ Đang đồng bộ…');
      const r = await pushProgress();
      const tt = lastSyncedAt();
      showKeyQr(k, r === 'ok' ? `✔ Đã đồng bộ lúc ${new Date(tt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : r === 'off' ? '⚠️ Máy chủ chưa bật — tạm lưu trên máy này' : '⚠️ Chưa đồng bộ được (mạng)');
    });
    const saveArea = root.querySelector<HTMLDivElement>('#td-save-area');
    root.querySelector('#btn-save-export')?.addEventListener('click', async () => {
      sound.playUiClick();
      if (!saveArea) return;
      if (!hasProgress()) {
        saveArea.innerHTML = `<div class="td-save-msg">Chưa có gì để lưu — chơi 1 màn trước nhé.</div>`;
        return;
      }
      const code = await exportSaveCode();
      const link = saveLink(code);
      // Gọn (anh Kha 25/11): gửi LINK — bấm link ở máy khác là tự chuyển tiến độ
      saveArea.innerHTML = `
        <div class="td-save-row">
          ${typeof navigator.share === 'function' ? `<button type="button" class="td-save-btn primary" id="btn-save-share" data-testid="btn-save-share"><img class="td-ui-ico-sm" src="./assets/ui/ui_gui.webp" alt="" /> Gửi</button>` : ''}
          <a class="td-save-btn" id="btn-save-email" data-testid="btn-save-email" href="mailto:?subject=${encodeURIComponent(tr('Mã lưu Gọn Phố'))}&body=${encodeURIComponent(`${tr('Bấm link này trên máy khác để chơi tiếp Gọn Phố:')}\n${link}`)}"><img class="td-ui-ico-sm" src="./assets/ui/ui_email.webp" alt="" /> Email</a>
          <button type="button" class="td-save-btn" id="btn-save-copy">📋 Chép link</button>
        </div>
        <div class="td-save-qr-wrap"><img class="td-save-qr" id="td-save-qr" data-testid="td-save-qr" alt="Mã QR lưu tiến độ" /></div>
        <div class="td-save-row"><a class="td-save-btn" id="btn-save-qr" data-testid="btn-save-qr" download="gon-pho-ma-luu.png">🖼️ Lưu ảnh QR</a></div>
        <div class="td-save-msg">Máy khác quét QR hoặc mở link là chơi tiếp. iPhone: chạm giữ hình QR → Lưu vào Ảnh. Đổi máy lần nào lấy lại lần đó.</div>
        <details class="td-save-raw"><summary>Xem mã</summary><textarea class="td-save-code" id="td-save-code-out" data-testid="td-save-code-out" readonly rows="3"></textarea></details>`;
      const ta = saveArea.querySelector<HTMLTextAreaElement>('#td-save-code-out')!;
      ta.value = code;
      try {
        const png = saveQrPng(link);
        saveArea.querySelector<HTMLImageElement>('#td-save-qr')!.src = png;
        saveArea.querySelector<HTMLAnchorElement>('#btn-save-qr')!.href = png;
      } catch {
        saveArea.querySelector('.td-save-qr-wrap')?.remove();
        saveArea.querySelector('#btn-save-qr')?.remove();
      }
      saveArea.querySelector('#btn-save-share')?.addEventListener('click', () => {
        void navigator.share({ title: tr('Gọn Phố — chơi tiếp'), text: tr('Bấm link để chơi tiếp Gọn Phố:'), url: link }).catch(() => {});
      });
      saveArea.querySelector('#btn-save-copy')?.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(link);
        } catch {
          ta.value = link;
          ta.select();
          document.execCommand('copy');
          ta.value = code;
        }
        const b = saveArea.querySelector<HTMLButtonElement>('#btn-save-copy');
        if (b) b.textContent = '✔ Đã chép';
      });
    });
    root.querySelector('#btn-save-import-open')?.addEventListener('click', () => {
      sound.playUiClick();
      if (!saveArea) return;
      saveArea.innerHTML = `
        <textarea class="td-save-code" id="td-save-code-in" data-testid="td-save-code-in" rows="3" placeholder="Dán link hoặc mã GP1… vào đây"></textarea>
        <div class="td-save-row"><button type="button" class="td-save-btn primary" id="btn-save-import" data-testid="btn-save-import">✔ Dùng mã này</button></div>
        <div class="td-save-msg" id="td-save-import-msg">Tiến độ trên máy này sẽ được thay bằng tiến độ trong mã.</div>`;
      saveArea.querySelector('#btn-save-import')?.addEventListener('click', async () => {
        let raw = saveArea.querySelector<HTMLTextAreaElement>('#td-save-code-in')?.value ?? '';
        const mm = raw.match(/#ma=([^\s]+)/);
        if (mm) raw = decodeURIComponent(mm[1]!);
        const msg = saveArea.querySelector<HTMLDivElement>('#td-save-import-msg');
        if (hasProgress() && !window.confirm('Thay tiến độ trên máy này bằng mã vừa dán?')) return;
        const res = await importSaveCode(raw);
        if (!res.ok) {
          if (msg) msg.textContent = res.reason === 'broken' ? '⚠️ Mã bị thiếu hoặc sai một chữ — chép lại đủ mã nhé.' : '⚠️ Đây không phải mã lưu Gọn Phố.';
          return;
        }
        if (msg) msg.textContent = '✔ Đã chuyển tiến độ!';
        this.unmountOverlay();
        this.scene.restart();
      });
    });

    // Nhắc đưa game ra màn hình chính: sau khi thắng màn đầu, chưa cài, chưa tắt nhắc
    const nudge = root.querySelector<HTMLDivElement>('#td-install-nudge');
    const nudgeOff = (() => {
      try {
        return localStorage.getItem('gonpho_nhac_cai') === 'tat';
      } catch {
        return true;
      }
    })();
    if (nudge && !nudgeOff && !isInstalledApp() && (save.starsByStage.stage_1 ?? 0) > 0) {
      const how = canPromptInstall()
        ? `<button type="button" class="td-save-btn primary" id="btn-install-now" data-testid="btn-install-now">📲 Cài</button>`
        : isIOS()
          ? `<span class="td-nudge-how">Bấm <b>⬆︎ Chia sẻ</b> → <b>Thêm vào MH chính</b></span>`
          : `<span class="td-nudge-how">Menu <b>⋮</b> → <b>Thêm vào màn hình chính</b></span>`;
      nudge.innerHTML = `<div class="td-install-nudge" data-testid="td-install-nudge">
          <span class="td-nudge-txt">📲 Đưa game ra màn hình chính để giữ tiến độ</span>
          ${how}
          <button type="button" class="td-close-btn td-nudge-close" id="btn-nudge-close" aria-label="Tắt nhắc">✕</button>
        </div>`;
      nudge.querySelector('#btn-install-now')?.addEventListener('click', () => void promptInstall());
      nudge.querySelector('#btn-nudge-close')?.addEventListener('click', () => {
        try {
          localStorage.setItem('gonpho_nhac_cai', 'tat');
        } catch {
          /* bỏ qua */
        }
        nudge.innerHTML = '';
      });
    }
    root.querySelector('#btn-lang')?.addEventListener('click', () => {
      sound.playUiClick();
      switchLang(currentLang() === 'en' ? 'vi' : 'en');
    });
    root.querySelector('#btn-start-live')?.addEventListener('click', () => {
      sound.playUiClick();
      this.unmountOverlay();
      startLive(this.scene);
    });
    // Chế độ chủ: bấm giữ chữ "Gọn Phố" 3 giây → bật / tắt mở hết màn (Claude)
    const heading = root.querySelector<HTMLElement>('.td-title-heading');
    if (heading) {
      let holdTimer: number | undefined;
      const startHold = (ev: Event) => {
        ev.preventDefault();
        heading.classList.add('holding');
        holdTimer = window.setTimeout(() => {
          heading.classList.remove('holding');
          try {
            const on = localStorage.getItem('gonpho_mo_het') === '1';
            if (on) localStorage.removeItem('gonpho_mo_het');
            else localStorage.setItem('gonpho_mo_het', '1');
            sound.playUiClick();
            window.alert(on ? 'Đã tắt chế độ chủ' : 'Chế độ chủ: đã mở hết màn');
          } catch {
            /* trình duyệt chặn lưu */
          }
          this.unmountOverlay();
          this.scene.restart();
        }, 3000);
      };
      const stopHold = () => {
        heading.classList.remove('holding');
        window.clearTimeout(holdTimer);
      };
      heading.addEventListener('pointerdown', startHold);
      heading.addEventListener('pointerup', stopHold);
      heading.addEventListener('pointerleave', stopHold);
      heading.addEventListener('pointercancel', stopHold);
      heading.addEventListener('contextmenu', (ev) => ev.preventDefault());
    }
    root.querySelector('#btn-open-help')?.addEventListener('click', () => openSheet('#td-help-sheet'));
    root.querySelectorAll<HTMLElement>('[data-close-sheet]').forEach((b) => {
      b.addEventListener('click', () => {
        sound.playUiClick();
        b.closest('.td-sheet-layer')?.setAttribute('hidden', '');
      });
    });
    root.querySelectorAll<HTMLElement>('.td-sheet-layer').forEach((layer) => {
      layer.addEventListener('click', (ev) => {
        if (ev.target === layer) layer.setAttribute('hidden', '');
      });
    });
    let tipTimer: number | undefined;
    root.addEventListener('click', (ev) => {
      const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-tip]');
      const bubble = root.querySelector<HTMLDivElement>('#td-tip-bubble');
      if (!el || !bubble) return;
      bubble.textContent = el.dataset.tip ?? '';
      const r = el.getBoundingClientRect();
      const rr = root.getBoundingClientRect();
      bubble.style.left = `${Math.max(8, Math.min(rr.width - 220, r.left - rr.left + r.width / 2 - 110))}px`;
      bubble.style.top = `${r.top - rr.top + root.scrollTop - 44}px`;
      bubble.removeAttribute('hidden');
      window.clearTimeout(tipTimer);
      tipTimer = window.setTimeout(() => bubble.setAttribute('hidden', ''), 2200);
    });

    /* ===== Bản đồ Đà Lạt lớn kéo được + trang riêng từng phố (anh Kha "làm bản đồ" 25/11) ===== */
    let activeStreetTab: string = 'doc';
    const BM = BIG_MAP_PINS as unknown as Record<string, { leftPct: number; topPct: number }> & { _size: { w: number; h: number } };
    const mapView = { x: NaN, y: NaN, s: 0 };
    // 2 phố sát nhau (Phan Đình Phùng – Nguyễn Văn Trỗi): đẩy bảng tên ra 2 bên cho khỏi chồng
    const SIGN_NUDGE: Record<string, number> = { street_phan_dinh_phung: -3.5, street_nguyen_van_troi: 3.5 };
    const renderStreetTabs = (): void => {
      const host = root.querySelector<HTMLDivElement>('#td-street-tabs');
      if (!host) return;
      const cur = loadTdSave();
      const docStars = SHOP_STREET.reduce((n, sh) => n + shopStars(cur, sh), 0);
      type Pin = { id: string; at: { leftPct: number; topPct: number }; name: string; sub: string; open: boolean; testid: string; extra: string };
      const pins: Pin[] = [
        { id: 'doc', at: BM.stage_1!, name: STREET_INFO.doc!.road, sub: `★${docStars}`, open: true, testid: 'street-tab-doc', extra: '' },
        ...REAL_STREET_STAGES.map((st) => {
          const base = REAL_STREET_MAP_PINS[st.id] ?? { leftPct: 50, topPct: 50, shortName: st.name, tag: '' };
          const prog = streetProgress(cur, st.id);
          return {
            id: st.id, at: BM[st.id] ?? { leftPct: base.leftPct, topPct: base.topPct }, name: STREET_INFO[st.id]?.road ?? base.shortName,
            sub: isRealStreetsUnlocked ? `${prog.shopsCleared}/${prog.shopsTotal}` : '', open: isRealStreetsUnlocked,
            testid: `real-street-pin-${st.id}`, extra: `data-real-pin="${st.id}"`,
          };
        }),
      ];
      // phố đang chơi: phố Dốc khi chưa mở phố thật, sau đó phố thật đầu tiên còn tiệm chưa giữ
      const playing = !isRealStreetsUnlocked ? 'doc' : (REAL_STREET_STAGES.find((st) => !streetProgress(cur, st.id).streetWon)?.id ?? '');
      const { w, h } = BM._size;
      host.innerHTML = `
        <div class="td-bm-inner" style="width:${w}px;height:${h}px">
          ${root.classList.contains('td-in-street') ? '' : `<img class="td-bm-img" src="./assets/map_dalat_lon${currentLang() === 'en' ? '_en' : ''}.webp" alt="Bản đồ Đà Lạt" draggable="false" />`}
          ${pins.map((pp) => `
            <button type="button" class="td-bm-pin ${pp.open ? 'open' : 'locked'} ${playing === pp.id ? 'playing' : ''}"
              style="left:${pp.at.leftPct + (SIGN_NUDGE[pp.id] ?? 0)}%;top:${pp.at.topPct}%" data-street-tab="${pp.id}" data-testid="${pp.testid}" ${pp.extra}>
              ${playing === pp.id ? '<img class="td-bm-star" src="./assets/ui/bd_ghim_sao.webp" alt="" />' : ''}
              <img class="td-bm-sign" src="./assets/ui/bang_${pp.id}${currentLang() === 'en' && (SIGNS_EN as string[]).includes(pp.id) ? '_en' : ''}.webp" alt="${pp.name}" />
              <span class="td-sr">${pp.name}</span>
              ${pp.open ? (pp.sub ? `<span class="td-bm-sub">${pp.sub}</span>` : '') : '<span class="td-bm-sub">🔒</span>'}
            </button>`).join('')}
        </div>
        <button type="button" class="td-bm-country" id="btn-open-country" data-testid="btn-open-country">🇻🇳 Lâm Đồng · Đà Lạt</button>
        <div class="td-bm-zoom"><button type="button" id="btn-map-zoom-in" data-testid="btn-map-zoom-in" aria-label="Phóng to">+</button><button type="button" id="btn-map-zoom-out" data-testid="btn-map-zoom-out" aria-label="Thu nhỏ">−</button></div>
      `;
      const inner = host.querySelector<HTMLDivElement>('.td-bm-inner')!;
      const vw = host.clientWidth || 380;
      const vh = host.clientHeight || 640;
      // Phóng to / thu nhỏ (anh Kha 25/11): 2 ngón kéo giãn, con lăn chuột, nút + −
      const sMin = Math.max(vw / w, (vh / h) * 0.85);   // cho thu nhỏ thêm chút để thấy đủ các phố
      const sMax = Math.max(1.6, sMin * 2.5);
      // Lúc mở: thu vừa đủ thấy cả các bảng tên phố (đánh giá độc lập V12: bảng nằm ngoài mép màn hình)
      if (!mapView.s || Number.isNaN(mapView.x)) {
        const xs = pins.map((pp) => (pp.at.leftPct / 100) * w), ys = pins.map((pp) => (pp.at.topPct / 100) * h);
        const bw = Math.max(...xs) - Math.min(...xs) + 200, bh = Math.max(...ys) - Math.min(...ys) + 200;
        mapView.s = Math.min(sMax, Math.max(sMin, Math.min(0.85, vw / bw, vh / bh)));
      }
      const apply = () => {
        mapView.s = Math.min(sMax, Math.max(sMin, mapView.s));
        mapView.x = w * mapView.s <= vw ? (vw - w * mapView.s) / 2 : Math.min(0, Math.max(vw - w * mapView.s, mapView.x));
        mapView.y = h * mapView.s <= vh ? (vh - h * mapView.s) / 2 : Math.min(0, Math.max(vh - h * mapView.s, mapView.y));
        inner.style.transform = `translate(${mapView.x}px, ${mapView.y}px) scale(${mapView.s})`;
        // bảng tên giữ cỡ nhìn được dù phóng to hay thu nhỏ
        inner.style.setProperty('--pin-k', String(Math.min(1.7, Math.max(0.8, 1.0 / mapView.s))));
      };
      const zoomAt = (k: number, cx: number, cy: number) => {
        const s0 = mapView.s;
        const s1 = Math.min(sMax, Math.max(sMin, s0 * k));
        mapView.x = cx - ((cx - mapView.x) * s1) / s0;
        mapView.y = cy - ((cy - mapView.y) * s1) / s0;
        mapView.s = s1;
        apply();
      };
      if (Number.isNaN(mapView.x)) {
        // lần đầu: canh giữa cụm phố để thấy nhiều phố cùng lúc
        const lx = pins.map((pp) => pp.at.leftPct), ly = pins.map((pp) => pp.at.topPct);
        const cxp = (Math.min(...lx) + Math.max(...lx)) / 2;
        const cyp = (Math.min(...ly) + Math.max(...ly)) / 2;
        mapView.x = vw / 2 - (cxp / 100) * w * mapView.s;
        mapView.y = vh / 2 - (cyp / 100) * h * mapView.s;
      }
      apply();
      const pts = new Map<number, { x: number; y: number }>();
      let drag: { x0: number; y0: number; mx: number; my: number; moved: boolean } | null = null;
      let pinch: { d0: number; s0: number } | null = null;
      const rel = (ev: PointerEvent) => { const r = host.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
      host.onpointerdown = (ev) => {
        pts.set(ev.pointerId, rel(ev));
        if (pts.size === 1) drag = { x0: ev.clientX, y0: ev.clientY, mx: mapView.x, my: mapView.y, moved: false };
        if (pts.size === 2) {
          const [p1, p2] = [...pts.values()];
          pinch = { d0: Math.hypot(p1!.x - p2!.x, p1!.y - p2!.y) || 1, s0: mapView.s };
          if (drag) drag.moved = true;
          try { host.setPointerCapture(ev.pointerId); } catch { /* bỏ qua */ }
        }
      };
      host.onpointermove = (ev) => {
        if (!pts.has(ev.pointerId)) return;
        pts.set(ev.pointerId, rel(ev));
        if (pinch && pts.size >= 2) {
          const [p1, p2] = [...pts.values()];
          const d = Math.hypot(p1!.x - p2!.x, p1!.y - p2!.y);
          zoomAt((pinch.s0 * d) / pinch.d0 / mapView.s, (p1!.x + p2!.x) / 2, (p1!.y + p2!.y) / 2);
          return;
        }
        if (!drag) return;
        const dx = ev.clientX - drag.x0, dy = ev.clientY - drag.y0;
        if (!drag.moved && Math.hypot(dx, dy) > 6) { drag.moved = true; try { host.setPointerCapture(ev.pointerId); } catch { /* bỏ qua */ } host.classList.add('dragging'); }
        if (drag.moved) { mapView.x = drag.mx + dx; mapView.y = drag.my + dy; apply(); }
      };
      const endDrag = (ev: PointerEvent) => {
        if (!pts.has(ev.pointerId)) return;
        pts.delete(ev.pointerId);
        if (pts.size < 2) pinch = null;
        if (pts.size === 1) {
          // còn 1 ngón sau khi kéo giãn: tiếp tục kéo từ chỗ đó, không tính là bấm
          const [p] = [...pts.values()];
          const r = host.getBoundingClientRect();
          drag = { x0: p!.x + r.left, y0: p!.y + r.top, mx: mapView.x, my: mapView.y, moved: true };
          return;
        }
        const moved = drag?.moved;
        drag = null;
        host.classList.remove('dragging');
        if (moved) {
          const stop = (e: Event) => { e.stopPropagation(); e.preventDefault(); };
          host.addEventListener('click', stop, { capture: true, once: true });
          window.setTimeout(() => host.removeEventListener('click', stop, { capture: true }), 50);
        }
      };
      host.onpointerup = endDrag;
      host.onpointercancel = endDrag;
      host.onwheel = (ev) => {
        ev.preventDefault();
        const r = host.getBoundingClientRect();
        zoomAt(ev.deltaY < 0 ? 1.15 : 1 / 1.15, ev.clientX - r.left, ev.clientY - r.top);
      };
      host.querySelector<HTMLButtonElement>('#btn-map-zoom-in')!.onclick = (e) => { e.stopPropagation(); zoomAt(1.3, vw / 2, vh / 2); };
      host.querySelector<HTMLButtonElement>('#btn-map-zoom-out')!.onclick = (e) => { e.stopPropagation(); zoomAt(1 / 1.3, vw / 2, vh / 2); };
      host.querySelectorAll<HTMLButtonElement>('[data-street-tab]').forEach((btn) => {
        btn.onclick = () => openStreetPage(btn.dataset.streetTab!);
      });
      host.querySelector<HTMLButtonElement>('#btn-open-country')!.onclick = () => {
        sound.playUiClick();
        renderCountry();
        root.querySelector('#td-country')?.removeAttribute('hidden');
      };
    };
    const openStreetPage = (tab: string): void => {
      activeStreetTab = tab;
      TitleScene.lastStreetTab = tab;
      if (tab !== 'doc') selectedRealStreetId = tab as StageId;
      sound.playUiClick();
      root.classList.add('td-in-street');
      applyStreetTab();
      root.querySelector('.td-title-card')?.scrollTo({ top: 0 });
    };
    const closeStreetPage = (): void => {
      TitleScene.lastStreetTab = null;
      root.classList.remove('td-in-street');
      renderStreetTabs();
    };
    const renderStreetHead = (): void => {
      const head = root.querySelector<HTMLDivElement>('#td-street-head');
      if (!head) return;
      const cur = loadTdSave();
      const isDoc = activeStreetTab === 'doc';
      const st = isDoc ? undefined : STAGES[activeStreetTab as StageId];
      const info = STREET_INFO[activeStreetTab];
      const name = info?.gameName ?? (isDoc ? 'Phố Dốc' : (REAL_STREET_MAP_PINS[activeStreetTab]?.shortName ?? st?.name ?? ''));
      const sub = isDoc
        ? `${SHOP_STREET.reduce((n, sh) => n + (shopStars(cur, sh) > 0 ? 1 : 0), 0)}/${SHOP_STREET.length} tiệm đã giữ`
        : (() => { const pr = streetProgress(cur, activeStreetTab as StageId); return `${pr.shopsCleared}/${pr.shopsTotal} tiệm đã giữ${pr.streetWon ? ' · đã thắng trùm' : ''}`; })();
      head.innerHTML = `
        <div class="td-street-banner" style="background-image:url('${streetBannerUrl(activeStreetTab)}')">
          <button type="button" class="td-street-back" id="btn-street-back" data-testid="btn-street-back" aria-label="Về bản đồ">◀ Bản đồ</button>
          <div class="td-street-banner-text"><b>${name}</b><span>${sub}</span></div>
        </div>
        ${info ? `<div class="td-street-intro"><div class="td-street-road">📍 ${info.roads} · Phường ${info.ward}</div><div>${info.intro}</div></div>` : ''}`;
      head.querySelector<HTMLButtonElement>('#btn-street-back')!.onclick = () => { sound.playUiClick(); closeStreetPage(); };
    };
    const renderCountry = (): void => {
      const box = root.querySelector<HTMLDivElement>('#td-country-list');
      if (!box) return;
      // Bản đồ Việt Nam (Spark đợt 36): mốc tỉnh có hình, ghim xanh = đang chơi, ghim xám = sắp mở
      const mapHtml = `<div class="td-vn-map"><img class="td-vn-img" src="./assets/ui/bd_viet_nam.webp" alt="Bản đồ Việt Nam" />
        ${PROVINCES.map((p) => PROVINCE_LANDMARK.has(p.id)
          ? `<button type="button" class="td-vn-moc ${p.open ? 'open' : 'locked'}" style="left:${p.x}%;top:${p.y}%" data-city="${p.id}" title="${p.name}"><img src="./assets/ui/moc_${p.id}.webp" alt="" /><span>${p.name}</span></button>`
          : `<button type="button" class="td-vn-dot" style="left:${p.x}%;top:${p.y}%" data-city="${p.id}" title="${p.name}"><img src="./assets/ui/bd_ghim_tinh_${p.open ? 'mo' : 'khoa'}.webp" alt="" /></button>`).join('')}
        <div class="td-vn-tip" id="td-vn-tip" hidden></div></div>`;
      box.innerHTML = mapHtml + (['bac', 'trung', 'nam'] as Region[]).map((rg) => `
        <div class="td-region"><div class="td-region-name">${REGION_NAME[rg]}</div><div class="td-region-grid">
        ${PROVINCES.filter((p) => p.region === rg).map((p) => `
          <button type="button" class="td-city ${p.open ? 'open' : 'locked'}" data-city="${p.id}" ${p.open ? '' : 'disabled'}>
            <b>${p.name}${p.tw ? ' ★' : ''}</b><span>${p.open ? `Đang chơi: ${p.playArea}` : 'Sắp mở'}</span>
          </button>`).join('')}
        </div></div>`).join('');
      box.querySelectorAll<HTMLButtonElement>('.td-city.open').forEach((b) => {
        b.onclick = () => { sound.playUiClick(); root.querySelector('#td-country')?.setAttribute('hidden', ''); };
      });
      const tip = box.querySelector<HTMLDivElement>('#td-vn-tip');
      box.querySelectorAll<HTMLButtonElement>('.td-vn-moc, .td-vn-dot').forEach((b) => {
        b.onclick = () => {
          sound.playUiClick();
          const pv = PROVINCES.find((x) => x.id === b.dataset.city);
          if (!pv) return;
          if (pv.open) { root.querySelector('#td-country')?.setAttribute('hidden', ''); return; }
          if (tip) {
            tip.textContent = `${pv.name} · sắp mở`;
            tip.style.left = `${pv.x}%`;
            tip.style.top = `${pv.y}%`;
            tip.removeAttribute('hidden');
            window.setTimeout(() => tip.setAttribute('hidden', ''), 1600);
          }
        };
      });
    };
    const applyStreetTab = (): void => {
      root.querySelector<HTMLElement>('#td-street-list')?.toggleAttribute('hidden', activeStreetTab !== 'doc');
      root.querySelector<HTMLElement>('#td-dalat-real-streets')?.toggleAttribute('hidden', activeStreetTab === 'doc');
      renderStreetHead();
      if (activeStreetTab !== 'doc') renderRealStreetsMap();
    };

    const renderSelectedShopShowcase = (): void => {
      const guideEl = root.querySelector<HTMLDivElement>('#td-element-guide');
      if (!guideEl) return;
      const activeShop = SHOP_STREET.find((s) => s.stageId === selectedShopId) ?? SHOP_STREET[0]!;
      const activeStage = getShopStage(activeShop);
      const savedLoadout = activeStage.loadoutSize ? this.resolveSavedLoadoutForStage(activeStage) : undefined;
      const towers = getStageTowerList(activeStage, savedLoadout);

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

      const countLabel = activeStage.loadoutSize ? `Bộ ${towers.length} món mang ra phố` : `${towers.length} món của ${activeStage.name}`;
      guideEl.innerHTML = `
        <div class="td-guide-title">${countLabel} • Vòng khắc: Kim → Mộc → Thổ → Thủy → Hỏa → Kim</div>
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

        const savedLoadout = stage.loadoutSize ? this.resolveSavedLoadoutForStage(stage) : undefined;
        const towers = getStageTowerList(stage, savedLoadout);
        const mainEnemies = getStageMainEnemies(stage);

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
              ${
                shop.isBoss
                  ? `<div class="td-boss-reward-strip">
                       <span>🏆 Thắng nhận <strong>Huy hiệu "Giữ trọn phố"</strong> &amp; chắc chắn rơi <strong>1 món Hàng hiệu ★</strong>!</span>
                     </div>`
                  : ''
              }

              <div class="td-shop-detail-block">
                <div class="td-shop-detail-label">
                  ${shop.isBoss ? `Bộ ${towers.length} món mang ra phố (chọn từ 15 món của 3 tiệm)` : `5 món giữ tiệm của ${shop.sign}`}
                </div>
                <div class="td-shop-mini-towers">
                  ${towers
                    .map((t) => {
                      const el = ELEMENT_INFO[t.element];
                      const spUrl = getAtlasFrameDataUrl(this, getTowerFrameName(t.id, 1, undefined, 0));
                      const elUrl = getAtlasFrameDataUrl(this, `el_${t.element}`);
                      return `
                        <div class="td-shop-mini-tower" style="border-color:${el.colorHex}" data-tip="${t.tier1.name} • ${el.label} • ${t.tier1.cost} xu">
                          ${spUrl ? `<img class="td-mini-tower-img" src="${spUrl}" alt="${t.tier1.name}" />` : ''}
                          <div class="td-mini-tower-name">${t.tier1.name}</div>
                          <div class="td-shop-mini-tower-meta td-mini-tower-meta">
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
                <div class="td-shop-detail-label">${shop.isBoss ? 'Bầy quái cả phố & Trùm Bão Lốc Cuối Mùa' : 'Bầy quái chính kéo vào tiệm'}</div>
                <div class="td-shop-mini-enemies">
                  ${mainEnemies
                    .slice(0, shop.isBoss ? 8 : mainEnemies.length)
                    .map((eid) => {
                      const edef = ALL_ENEMY_DEFINITIONS[eid];
                      const el = ELEMENT_INFO[edef.element];
                      const isBoss = edef.trait === 'boss';
                      const eUrl = getAtlasFrameDataUrl(this, getEnemyFrameName(eid, 0));
                      return `
                        <span class="td-shop-enemy-chip ${isBoss ? 'is-boss' : ''}" style="border-color:${el.colorHex}" data-tip="${edef.name} • ${el.label}">
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
                 <span class="td-slope-step-pill">${shop.isBoss ? '⛈ Cuối Dốc • Trận Trùm Phố' : `↓ Xuống dốc • Tiệm ${shop.order}`}</span>
                 <span class="td-slope-line"></span>
               </div>`
            : '';

        const lockMsg = '🔒';
        const openBtnLabel = shop.isBoss ? '▶ Đánh Trùm Phố' : `▶ ${shop.sign}`;

        void slopeStepHtml; void lockMsg; void lifeUrl;
        // Hàng tiệm dùng chung kiểu với phố thật (Claude): hình mặt tiền · số + tên · sao · ▶
        return `
          <article class="td-shoprow ${shop.isBoss ? 'boss' : ''} ${unlocked ? 'open' : 'locked td-stage-locked'} ${isSelected ? 'selected' : ''}"
            data-testid="stage${shop.order}-card" data-shop-id="${shop.stageId}">
            <div class="td-shoprow-main">
              <div class="td-shoprow-hit" role="button" tabindex="0" data-select-shop="${shop.stageId}" data-testid="street-shop-${shop.order}" aria-expanded="${isSelected ? 'true' : 'false'}">
                <span class="td-shoprow-thumb">${({ stage_1: 'giay', stage_2: 'banh', stage_3: 'hoa' } as Record<string, string>)[shop.stageId] ? `<img class="${unlocked ? '' : 'td-thumb-locked'}" data-shutter="${unlocked ? 'open' : 'closed'}" src="./assets/ui/mat_tien_doc_${({ stage_1: 'giay', stage_2: 'banh', stage_3: 'hoa' } as Record<string, string>)[shop.stageId]}.webp" alt="" />` : renderShopFacadeSvg(shop, unlocked)}</span>
                <span class="td-shoprow-name"><b>${shop.isBoss ? '👹' : shop.order}</b><span class="td-stage-name">${stage.name}</span></span>
                <span class="td-shoprow-stars" data-testid="stage${shop.order}-stars">${!unlocked ? '🔒<span class="td-sr">Khóa</span>' : stars > 0 ? '★'.repeat(stars) : ''}</span>
              </div>
${unlocked && stars >= 3 && !STAGES[shop.stageId]?.loadoutSize ? `<button type="button" class="td-shoprow-hard" data-hard-stage="${shop.stageId}" data-testid="btn-hard-${shop.stageId}" title="Chế độ Khó: quái nhiều máu, nhanh hơn — rơi thêm đồ"><img class="td-ui-ico-sm" src="./assets/ui/ui_kho.webp" alt="★" />${(curHard[shop.stageId] ?? 0) > 0 ? '✓' : ''}</button>` : ''}
              <button type="button" class="td-shoprow-play" id="btn-start-stage-${shop.order}" data-testid="btn-start-stage-${shop.order}"
                data-launch-stage="${shop.stageId}" ${unlocked ? '' : 'disabled aria-disabled="true"'}>${unlocked ? '▶' : '🔒'}<span class="td-sr">${openBtnLabel}</span></button>
            </div>
            ${detailHtml}
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
          const stageId = btn.dataset.launchStage as StageId;
          const st = STAGES[stageId];
          if (st?.loadoutSize && !isBotBypass) {
            sound.playUiClick();
            openLoadoutPicker(st);
          } else {
            launchStage(stageId);
          }
        };
      });
    };

    /** Việc 9 bước 4: Bản đồ Đà Lạt thêm 2 điểm chọn phố thật từ REAL_STREET_STAGES */
    const renderRealStreetsMap = (): void => {
      const host = root.querySelector<HTMLDivElement>('#td-dalat-real-streets');
      if (!host) return;
      const curSave = loadTdSave();

      const activeStreet =
        REAL_STREET_STAGES.find((s) => s.id === selectedRealStreetId) ?? REAL_STREET_STAGES[0];
      if (!activeStreet) return;



      const shopStages = REAL_STREET_SHOPS[activeStreet.id] ?? [];
      const prog = streetProgress(curSave, activeStreet.id);
      const canPlay = (id: StageId) => isBotBypass || ownerOpenAll || isStreetStageUnlocked(curSave, id);
      const selId: StageId = selectedStreetStage[activeStreet.id] ?? prog.nextStageId;
      const selStage = STAGES[selId] ?? activeStreet;
      const selUnlocked = isRealStreetsUnlocked && canPlay(selStage.id);
      const bossDef = Object.values(ALL_ENEMY_DEFINITIONS).find(
        (e) => e?.trait === 'boss' && activeStreet.waves.some((w) => w.groups.some((g) => g.enemyId === e.id)),
      );
      const fTex = this.textures.exists(FACADE_ATLAS_KEY) ? this.textures.get(FACADE_ATLAS_KEY) : null;
      const facadeUrl = (st: StageDefinition): string => {
        const art = st.featuredTowerId ? ALL_TOWER_DEFINITIONS[st.featuredTowerId]?.art : undefined;
        const k = [st.facadeKey, art ? `facade_${art}` : undefined].find((x) => x && fTex?.has(x));
        return k ? getAtlasFrameDataUrlFrom(this, FACADE_ATLAS_KEY, k) : '';
      };
      const enemyChips = (stg: StageDefinition) =>
        getStageMainEnemies(stg)
          .map((eid) => {
            const edef = ALL_ENEMY_DEFINITIONS[eid];
            if (!edef) return '';
            const el = ELEMENT_INFO[edef.element];
            const eUrl = getAtlasFrameDataUrl(this, getEnemyFrameName(eid, 0));
            return `<span class="td-shop-enemy-chip" style="border-color:${el.colorHex}" data-tip="${edef.name} • ${el.label}">${eUrl ? `<img src="${eUrl}" alt="${edef.name}" />` : ''}<span>${edef.name}</span></span>`;
          })
          .join('');
      const shopRowsHtml = [...shopStages, activeStreet]
        .map((st) => {
          const isBossRow = !st.shopIndex;
          const open = isRealStreetsUnlocked && canPlay(st.id);
          const stars = curSave.starsByStage[st.id] ?? 0;
          const isSel = st.id === selStage.id;
          const thumb = isBossRow
            ? (bossDef ? getAtlasFrameDataUrl(this, getEnemyFrameName(bossDef.id, 0)) : '')
            : facadeUrl(st);
          const name = isBossRow ? (bossDef?.name ?? 'Trùm phố') : st.name;
          return `
            <div class="td-shoprow ${open ? 'open' : 'locked'} ${isSel ? 'selected' : ''} ${isBossRow ? 'boss' : ''}">
              <div class="td-shoprow-main">
                <div class="td-shoprow-hit" role="button" tabindex="0" data-real-stage="${st.id}" data-testid="real-shop-row-${st.id}">
                  <span class="td-shoprow-thumb">${thumb ? `<img src="${thumb}" alt="" />` : isBossRow ? '👹' : '🏠'}</span>
                  <span class="td-shoprow-name"><b>${isBossRow ? '👹' : st.shopIndex}</b><span>${name}</span></span>
                  <span class="td-shoprow-stars">${!open ? '🔒' : stars > 0 ? '★'.repeat(stars) : ''}</span>
                </div>
${open && stars >= 3 && !(st.loadoutSize && !st.shopIndex) ? `<button type="button" class="td-shoprow-hard" data-hard-stage="${st.id}" data-testid="btn-hard-${st.id}" title="Chế độ Khó: quái nhiều máu, nhanh hơn — rơi thêm đồ"><img class="td-ui-ico-sm" src="./assets/ui/ui_kho.webp" alt="★" />${(curHard[st.id] ?? 0) > 0 ? '✓' : ''}</button>` : ''}
                <button type="button" class="td-shoprow-play" data-play-real="${st.id}"
                  ${isSel ? `id="btn-start-${activeStreet.id}" data-testid="btn-start-${activeStreet.id}"` : `data-testid="btn-play-${st.id}"`}
                  ${open ? '' : 'disabled aria-disabled="true"'}>${open ? '▶' : '🔒'}</button>
              </div>
              ${isSel ? `<div class="td-shoprow-detail"><div class="td-shop-mini-enemies">${enemyChips(st)}</div></div>` : ''}
            </div>`;
        })
        .join('');
      const activeStars = curSave.starsByStage[activeStreet.id] ?? 0;
      const activeStarText = !isRealStreetsUnlocked
        ? '🔒 Khóa'
        : activeStars > 0
          ? '★'.repeat(activeStars) + '☆'.repeat(3 - activeStars)
          : 'Mới mở!';

      host.innerHTML = `
        <div class="td-dalat-map-card ${isRealStreetsUnlocked ? 'unlocked' : 'locked'}">
          <span class="td-dalat-lock-pill ${isRealStreetsUnlocked ? 'open' : ''}" data-testid="real-streets-status" hidden>${isRealStreetsUnlocked ? 'Đã mở khóa' : 'Giữ 3 tiệm Phố Dốc để mở'}</span>
          <div class="td-real-street-detail" data-testid="real-street-detail">
            <div class="td-real-detail-top">
              <div>
                <div class="td-real-detail-name">${activeStreet.name}</div>
                <div class="td-real-detail-sub">${activeStreet.subtitle}</div>
              </div>
              <span class="td-stage-stars ${isRealStreetsUnlocked ? '' : 'locked'}">${activeStarText}</span>
            </div>

            <div class="td-shop-detail-stats">
              <span>🌊 ${selStage.waves.length} đợt</span>
              <span>•</span>
              <span>🏠 ${shopStages.length} tiệm • mang ${selStage.loadoutSize ?? 6} món</span>
              <span>•</span>
              <span>📍 Dữ liệu OSM</span>
            </div>

            <div class="td-shop-detail-block">
              <div class="td-shop-detail-label">Giữ lần lượt ${shopStages.length} tiệm rồi ra phố đánh trùm • đã giữ ${prog.shopsCleared}/${prog.shopsTotal}</div>
              <div class="td-real-shop-progress"><i style="width:${prog.shopsTotal ? Math.round((prog.shopsCleared / prog.shopsTotal) * 100) : 0}%"></i></div>
              <div class="td-real-shop-list" data-testid="real-shop-list">${shopRowsHtml}</div>
            </div>

            </div>
          </div>
        </div>
      `;

      host.querySelectorAll<HTMLButtonElement>('[data-real-pin-old]').forEach((btn) => {
        btn.onclick = () => {
          const id = btn.dataset.realPin as StageId;
          if (id !== selectedRealStreetId) {
            selectedRealStreetId = id;
            sound.playUiClick();
            renderRealStreetsMap();
          }
        };
      });


      host.querySelectorAll<HTMLButtonElement>('[data-real-stage]').forEach((btn) => {
        btn.onclick = () => {
          selectedStreetStage[activeStreet.id] = btn.dataset.realStage as StageId;
          sound.playUiClick();
          renderRealStreetsMap();
        };
      });

      host.querySelectorAll<HTMLButtonElement>('[data-play-real]').forEach((btn) => {
        btn.onclick = () => {
          const stg = STAGES[btn.dataset.playReal as StageId];
          if (!stg || btn.disabled || !(isRealStreetsUnlocked && canPlay(stg.id))) return;
          if (stg.loadoutSize && !stg.shopIndex && !isBotBypass) {
            sound.playUiClick();
            openLoadoutPicker(stg);
          } else {
            launchStage(stg.id, this.resolveSavedLoadoutForStage(stg));
          }
        };
      });
      void selUnlocked;
    };

    renderStreet();
    renderRealStreetsMap();
    renderSelectedShopShowcase();
    // Mở lại đúng trang phố vừa chơi; người mới (chưa mở phố thật) vào thẳng Phố Dốc để bấm chơi ngay
    const startTab = TitleScene.lastStreetTab ?? (realStreetsOpen(save) || ownerOpenAll ? null : 'doc');
    if (startTab) {
      activeStreetTab = startTab;
      if (startTab !== 'doc') selectedRealStreetId = startTab as StageId;
      root.classList.add('td-in-street');
    }
    applyStreetTab();
    requestAnimationFrame(() => renderStreetTabs());
    // Hình phố Đà Lạt tải ngầm sau khi màn chính đã hiện (đánh giá độc lập: lần tải đầu nặng); xong thì vẽ lại thẻ tiệm / hình món
    // Người mới (chưa mở phố) không tải: chỉ Phố Dốc ~2 MB; hình phố tải khi đã mở phố hoặc khi vào màn phố
    if (isRealStreetsUnlocked) window.setTimeout(() => {
      loadStreetAtlasesInBackground(this, ATLAS_KEY, () => {
        BootScene.registerStreetAnims(this);
        renderStreet();
        renderRealStreetsMap();
        renderSelectedShopShowcase();
        applyStreetTab();
      });
    }, 1200);
    root.querySelector<HTMLButtonElement>('[data-close-country]')?.addEventListener('click', () => root.querySelector('#td-country')?.setAttribute('hidden', ''));

    /* ==================== VIỆC 6: GỌN CHỮ BẢNG TRANG BỊ ==================== */
    let pickSlot: GearSlotId | null = null;
    let showGearRules = false;
    let showBag = false;
    let expandAllSets = false;
    let selectedBonusChipIdx: number | null = null;
    let revealedStatKey: string | null = null;

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
          : `Trang bị chủ tiệm: ${wornCount}/10 món • ${bonus.activeLines}/${bonus.totalHiddenLines} ●`;
      }

      const head = root.querySelector<HTMLDivElement>('#td-gear-head');
      if (head) {
        // Gọn chữ (anh Kha 24/11): chỉ số + biểu tượng, chạm giữ xem tên
        head.innerHTML = `<span class="td-gear-headchip" title="Đang mặc">👕 ${wornCount}/10</span>`
          + `<span class="td-gear-headchip ${bonus.activeLines ? 'lit' : ''}" title="Dòng ẩn đang sáng">● ${bonus.activeLines}/${bonus.totalHiddenLines}</span>`
          + (bonus.fullRing ? `<span class="td-gear-headchip lit" title="Ngũ hành viên mãn">✦</span>` : '');
      }

      const invBadge = root.querySelector<HTMLDivElement>('#td-gear-inv-count');
      if (invBadge) {
        invBadge.textContent = `🎒 ${invLen} ${showBag ? '▴' : '▾'}`;
        invBadge.onclick = () => {
          showBag = !showBag;
          sound.playUiClick();
          renderGear();
        };
      }

      // ✨ Gợi ý: có món tốt hơn trong túi → nút mặc nhanh bộ mạnh nhất (anh Kha 25/11)
      const inv = cur.gearInventory ?? [];
      const upSlots = slotsWithUpgrade(eq, inv);
      const upSlotsRing = upSlots;
      const bestWrap = root.querySelector<HTMLDivElement>('#td-gear-best');
      if (bestWrap) {
        bestWrap.innerHTML = upSlots.size
          ? `<button type="button" class="td-gear-best-btn" id="btn-gear-best" data-testid="btn-gear-best">✨ Mặc đồ tốt nhất <b>▲ ${upSlots.size} ô</b></button>`
          : '';
        bestWrap.querySelector('#btn-gear-best')?.addEventListener('click', () => {
          const best = bestEquip(eq, inv);
          for (const sl of GEAR_SLOTS) if (best[sl.id] && best[sl.id]!.uid !== eq[sl.id]?.uid) equipGear(sl.id, best[sl.id]!.uid);
          sound.playBuildOrUpgrade();
          renderGear();
        });
      }

      // 🎒 Túi đồ: thấy hết đồ, xếp theo ô, ▲ mạnh hơn / ▼ yếu hơn món đang mặc, chạm để mặc
      const bagWrap = root.querySelector<HTMLDivElement>('#td-gear-bag');
      if (bagWrap) {
        if (!showBag) bagWrap.innerHTML = '';
        else {
          const groups = GEAR_SLOTS.map((sl) => {
            const items = inv.filter((it) => it.slot === sl.id);
            if (!items.length) return '';
            const cards = items
              .map((it) => {
                const on = eq[sl.id]?.uid === it.uid;
                const d = itemScoreDelta(eq, it);
                const tag = on ? '<span class="td-bag-tag on">✔</span>' : d >= BETTER_MIN ? `<span class="td-bag-tag up">▲${d}</span>` : d <= -BETTER_MIN ? `<span class="td-bag-tag down">▼</span>` : '<span class="td-bag-tag">＝</span>';
                const theme = RARITY_THEME[it.rarity];
                const ico = getGearAtlasFrameDataUrl(this, getGearIconFrameName(it.slot, it.element));
                return `<button type="button" class="td-bag-item ${on ? 'on' : ''}" data-bag-item="${it.uid}" data-bag-slot="${it.slot}" title="${it.name} (${RARITY_LABEL[it.rarity]}, ${ELEMENT_INFO[it.element].label})" style="border-color:${theme.border};background:${theme.bg}">
                  ${ico ? `<img src="${ico}" alt="" />` : ''}
                  <span class="td-bag-el" style="background:${ELEMENT_INFO[it.element].colorHex}"></span>
                  ${tag}
                </button>`;
              })
              .join('');
            return `<div class="td-bag-row"><span class="td-bag-slot">${sl.label}</span><div class="td-bag-items">${cards}</div></div>`;
          }).join('');
          bagWrap.innerHTML = `<div class="td-bag-panel" data-testid="td-gear-bag-panel">${groups || '<div class="td-stage-sub">Túi trống — thắng màn để nhận đồ.</div>'}</div>`;
          bagWrap.querySelectorAll<HTMLButtonElement>('[data-bag-item]').forEach((b) => {
            b.onclick = () => {
              equipGear(b.dataset.bagSlot as GearSlotId, b.dataset.bagItem!);
              sound.playBuildOrUpgrade();
              renderGear();
            };
          });
        }
      }

      // 1. Nút "?" mở luật đầy đủ
      const rulesBtn = root.querySelector<HTMLButtonElement>('#btn-gear-rules');
      if (rulesBtn) {
        rulesBtn.setAttribute('aria-expanded', showGearRules ? 'true' : 'false');
        rulesBtn.classList.toggle('active', showGearRules);
        rulesBtn.onclick = () => {
          showGearRules = !showGearRules;
          sound.playUiClick();
          renderGear();
        };
      }
      const rulesWrap = root.querySelector<HTMLDivElement>('#td-gear-rules-wrap');
      if (rulesWrap) {
        rulesWrap.innerHTML = showGearRules
          ? `<div class="td-gear-rules-box" data-testid="td-gear-rules-panel">
               <div class="td-gear-rules-head">
                 <strong>Luật Trang Bị Chủ Tiệm</strong>
                 <button type="button" class="td-close-btn td-picker-close" id="btn-close-gear-rules" aria-label="Đóng">✕</button>
               </div>
               <ul>
                 <li>Mỗi ô có <strong>2 món chống lưng</strong> (A = ô liền trước, B = ô cách 6 bước). Chống lưng sinh ra hành món này sẽ sáng 1 dòng ẩn <strong>●</strong>.</li>
                 <li>Vòng tương sinh: <strong>Kim → Thủy → Mộc → Hỏa → Thổ → Kim</strong>.</li>
                 <li>Đủ 10 món nối kín vòng = <strong>Ngũ hành viên mãn</strong> (sáng dòng ẩn thứ 3 <strong>✦</strong>, +15% sức mọi món &amp; hồi chiêu nhanh 30%).</li>
                 <li>4 hạng: <strong>Thường</strong> (xám) • <strong>Tốt</strong> (xanh) • <strong>Xịn</strong> (tím) • <strong>Hàng hiệu</strong> (vàng ★). Bấm giữ hoặc chạm 2 lần vào từng dòng để xem câu giải thích đầy đủ.</li>
               </ul>
             </div>`
          : '';
        rulesWrap.querySelector('#btn-close-gear-rules')?.addEventListener('click', () => {
          showGearRules = false;
          sound.playUiClick();
          renderGear();
        });
      }

      const fullBanner = root.querySelector<HTMLDivElement>('#td-gear-fullring-banner');
      if (fullBanner) {
        fullBanner.innerHTML = bonus.fullRing
          ? `<div class="td-fullring-ribbon" data-testid="td-fullring-banner">✦ NGŨ HÀNH VIÊN MÃN! +15% sức • Hồi chiêu nhanh 30% • Sáng dòng ẩn 3 ✦</div>`
          : '';
      }

      // 3. Vòng 10 ô quanh chủ tiệm: CHỈ hình đồ + chấm ●○ (không chữ dưới ô!)
      const ringStage = root.querySelector<HTMLDivElement>('#td-gear-ring-stage');
      if (ringStage) {
        const slotIndexMap = new Map<GearSlotId, number>(GEAR_SLOTS.map((s, idx) => [s.id, idx]));
        const selectedSupporters = pickSlot ? supporterSlots(pickSlot) : null;

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
            // Chỉ hình bóng đồ, KHÔNG chữ dưới ô!
            return `
              <button
                type="button"
                class="td-gear-slot-node empty ${isPicked ? 'selected' : ''} ${isSupA || isSupB ? 'is-supporter' : ''}"
                data-gear-slot="${sl.id}"
                data-testid="gear-slot-${sl.id}"
                style="left:${leftPct}%;top:${topPct}%"
                title="${sl.label} — Trống (chạm để đeo)"
                aria-label="${sl.label} trống"
              >
                ${isSupA ? '<span class="td-sup-tag">A</span>' : isSupB ? '<span class="td-sup-tag">B</span>' : ''}
              ${upSlotsRing.has(sl.id) ? '<span class="td-slot-up" title="Có món tốt hơn trong túi">▲</span>' : ''}
                ${upSlotsRing.has(sl.id) ? '<span class="td-slot-up" title="Có món tốt hơn trong túi">▲</span>' : ''}
                ${getEmptySlotSilhouetteSvg(sl.id)}
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
              aria-label="${it.name}"
            >
              ${isSupA ? '<span class="td-sup-tag">A</span>' : isSupB ? '<span class="td-sup-tag">B</span>' : ''}
              ${it.rarity === 'hieu' ? '<span class="td-hieu-crown" aria-hidden="true">★</span>' : ''}
              ${
                iconUrl
                  ? `<img class="td-slot-gear-img" src="${iconUrl}" alt="${it.name}" />`
                  : ''
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
            revealedStatKey = null;
            sound.playUiClick();
            renderGear();
          };
        });
      }

      // 5. Bộ đồ thu gọn: mặc định chỉ hiện bộ đang mặc dở ("Bộ Đi Mưa 2/3"), bấm mở đủ 4 bộ
      const setsWrap = root.querySelector<HTMLDivElement>('#td-gear-sets');
      if (setsWrap) {
        const setRows = GEAR_SETS.map((gs) => {
          const count = gs.pieces.filter((p) => eq[p.slot]?.element === p.element).length;
          const total = gs.pieces.length;
          const isAnyActive = gs.bonuses.some((b) => count >= b.count);
          return { gs, count, total, isAnyActive };
        });

        const wornSets = setRows.filter((r) => r.count > 0);

        if (!expandAllSets) {
          const compactPills = wornSets.length
            ? wornSets
                .map(({ gs, count, total, isAnyActive }) => {
                  const badgeUrl = getGearAtlasFrameDataUrl(this, getGearSetBadgeFrameName(gs.id));
                  return `<span class="td-set-compact-pill ${isAnyActive ? 'active' : ''}" data-testid="gear-set-${gs.id}">
                    ${badgeUrl ? `<img src="${badgeUrl}" alt="" />` : ''}
                    <strong>${gs.name}</strong> ${count}/${total}
                  </span>`;
                })
                .join('')
            : '';

          setsWrap.innerHTML = `
            <div class="td-set-compact-bar">
              <div class="td-set-compact-pills">${compactPills}</div>
              <button type="button" class="td-set-toggle-btn" id="btn-toggle-gear-sets" data-testid="btn-toggle-gear-sets">
                Bộ đồ ▾
              </button>
            </div>
          `;
        } else {
          const cards = setRows
            .map(({ gs, count, total, isAnyActive }) => {
              const badgeUrl = getGearAtlasFrameDataUrl(this, getGearSetBadgeFrameName(gs.id));
              const mainEl = gs.pieces[0]!.element;
              const elColor = ELEMENT_INFO[mainEl].colorHex;
              const bonusLines = gs.bonuses
                .map((b) => {
                  const on = count >= b.count;
                  const txt = b.stats.map((st) => statShort(st)).join(' · ');
                  return `<div class="td-set-bonus-line ${on ? 'on' : ''}">${on ? '✔' : '○'} ${b.count} món: ${txt}</div>`;
                })
                .join('');
              return `
                <div class="td-set-card ${isAnyActive ? 'active' : ''}" data-testid="gear-set-${gs.id}" style="${isAnyActive ? `border-color:${elColor}` : ''}">
                  <div class="td-set-top">
                    ${badgeUrl ? `<img class="td-set-badge-img" src="${badgeUrl}" alt="${gs.name}" />` : ''}
                    <div class="td-set-meta">
                      <div class="td-set-name">${gs.name}</div>
                      <span class="td-set-count ${isAnyActive ? 'on' : ''}">${count}/${total}</span>
                    </div>
                  </div>
                  <div class="td-set-bonuses">${bonusLines}</div>
                </div>
              `;
            })
            .join('');
          setsWrap.innerHTML = `
            <div class="td-set-expanded-head">
              <span class="td-gear-section-label">Bộ đồ (đúng loại + đúng hành)</span>
              <button type="button" class="td-set-toggle-btn" id="btn-toggle-gear-sets" data-testid="btn-toggle-gear-sets">
                Thu gọn ▴
              </button>
            </div>
            <div class="td-set-grid">${cards}</div>
          `;
        }

        setsWrap.querySelector<HTMLButtonElement>('#btn-toggle-gear-sets')?.addEventListener('click', () => {
          expandAllSets = !expandAllSets;
          sound.playUiClick();
          renderGear();
        });
      }

      // 6. Tổng sức mạnh: hàng chip gọn từ bonusChips(bonus); bấm chip hiện câu đầy đủ
      const sum = root.querySelector<HTMLDivElement>('#td-gear-sum');
      if (sum) {
        const chipsData = bonusChips(bonus);
        if (selectedBonusChipIdx !== null && selectedBonusChipIdx >= chipsData.length) {
          selectedBonusChipIdx = null;
        }
        if (chipsData.length === 0) {
          sum.innerHTML = '';
        } else {
          const chipsHtml = chipsData
            .map((chip, idx) => {
              const isSelected = selectedBonusChipIdx === idx;
              let iconHtml = `<span class="td-bchip-ico">${chip.icon}</span>`;
              let borderStyle = '';
              if (chip.icon.startsWith('el:')) {
                const el = chip.icon.slice(3) as ElementType;
                const elInfo = ELEMENT_INFO[el];
                const elUrl = getAtlasFrameDataUrl(this, `el_${el}`);
                borderStyle = `style="border-color:${elInfo.colorHex}"`;
                iconHtml = elUrl
                  ? `<img class="td-badge-el-icon" src="${elUrl}" alt="${elInfo.label}" />`
                  : `<span class="td-bchip-ico">${elInfo.label}</span>`;
              }
              return `
                <button
                  type="button"
                  class="td-sum-chip td-bonus-chip ${isSelected ? 'selected' : ''}"
                  data-bonus-chip="${idx}"
                  data-testid="gear-bonus-chip-${idx}"
                  ${borderStyle}
                  title="${chip.full}"
                >
                  ${iconHtml}
                  <strong>${chip.value}</strong>
                </button>
              `;
            })
            .join('');

          const activeChip = selectedBonusChipIdx !== null ? chipsData[selectedBonusChipIdx] : null;
          sum.innerHTML = `
            <div class="td-sum-chips">${chipsHtml}</div>
            ${
              activeChip
                ? `<div class="td-bonus-chip-detail" data-testid="td-bonus-chip-detail">${activeChip.full}</div>`
                : ''
            }
          `;

          sum.querySelectorAll<HTMLButtonElement>('[data-bonus-chip]').forEach((btn) => {
            btn.onclick = () => {
              const idx = Number(btn.dataset.bonusChip);
              selectedBonusChipIdx = selectedBonusChipIdx === idx ? null : idx;
              sound.playUiClick();
              renderGear();
            };
          });
        }
      }

      // 2 & 4. Ngăn chọn đồ: dòng gọn bằng statShort (bấm giữ / chạm 2 lần hiện statText) + dòng so sánh previewEquip
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
      const needEl = currentItem ? getGeneratorElementFor(currentItem.element) : null;

      // Gọn chữ: chỉ còn A●/B○ + hình hành cần (tên đầy đủ khi chạm giữ)
      const needUrl = needEl ? getAtlasFrameDataUrl(this, `el_${needEl}`) : '';
      const supHintHtml = `
        <div class="td-sup-info-bar">
          <span class="td-sup-pill ${supState.aActive ? 'lit' : ''}" title="Chống lưng A: ${supLabel(supState.supA)}">A ${supState.aActive ? '●' : '○'}</span>
          <span class="td-sup-pill ${supState.bActive ? 'lit' : ''}" title="Chống lưng B: ${supLabel(supState.supB)}">B ${supState.bActive ? '●' : '○'}</span>
          ${needEl ? `<span class="td-sup-need" title="Hai ô A, B cần mặc đồ hành ${ELEMENT_INFO[needEl].label}">⇢ ${needUrl ? `<img class="td-badge-el-icon" src="${needUrl}" alt="${ELEMENT_INFO[needEl].label}" />` : ELEMENT_INFO[needEl].label}</span>` : ''}
        </div>
      `;

      const listHtml =
        owned.length === 0
          ? `<div class="td-gear-empty-box">Chưa có <strong>${slotInfo.label}</strong> trong kho. Thắng màn để mở rương nhé!</div>`
          : owned
              .map((it) => {
                const theme = RARITY_THEME[it.rarity];
                const elInfo = ELEMENT_INFO[it.element];
                const on = currentItem?.uid === it.uid;
                const iconUrl = getGearAtlasFrameDataUrl(this, getGearIconFrameName(it.slot, it.element));
                const elUrl = getAtlasFrameDataUrl(this, `el_${it.element}`);
                const activeCount = on ? (act[slotId] ?? 0) : 0;

                // Dòng so sánh nhanh từ previewEquip(eq, it)
                let previewHtml = '';
                if (!on) {
                  const prev = previewEquip(eq, it);
                  const dmgPct = Math.round(prev.dmgDelta * 100);
                  const parts: string[] = [];
                  if (prev.linesDelta !== 0) {
                    const dots = prev.linesDelta > 0 ? '●'.repeat(Math.min(3, prev.linesDelta)) : '○';
                    parts.push(`${prev.linesDelta > 0 ? '+' : ''}${prev.linesDelta} ${dots}`);
                  }
                  if (dmgPct !== 0) {
                    parts.push(`${dmgPct > 0 ? '+' : ''}${dmgPct}% sức`);
                  }
                  const tone =
                    prev.fullRing || prev.linesDelta > 0 || (prev.linesDelta === 0 && dmgPct > 0)
                      ? 'good'
                      : prev.linesDelta < 0 || dmgPct < 0
                        ? 'bad'
                        : 'neutral';
                  const cmpText = parts.length > 0 ? `${tone === 'bad' ? '▼' : '▲'} ${parts.join(' · ')}` : '＝';
                  previewHtml = `
                    <div class="td-gear-preview ${tone}" data-testid="gear-preview-${it.uid}">
                      <span>${cmpText}</span>
                      ${prev.fullRing ? '<span class="td-preview-fullring">✦ Viên mãn!</span>' : ''}
                    </div>
                  `;
                }

                const visRows = it.visible
                  .map((st, sIdx) => {
                    const key = `${it.uid}:v:${sIdx}`;
                    const showFull = revealedStatKey === key;
                    return `<div class="td-gear-stat-row td-stat-compact" data-stat-key="${key}" title="Giữ hoặc chạm 2 lần xem chi tiết">
                      <span>${showFull ? statText(st) : statTiny(st)}</span>
                    </div>`;
                  })
                  .join('');

                const hidRows = it.hidden
                  .map((st, idx) => {
                    const key = `${it.uid}:h:${idx}`;
                    const showFull = revealedStatKey === key;
                    const isLit = on && idx < activeCount;
                    return `
                      <div class="td-gear-stat-row td-stat-compact hidden ${isLit ? 'lit' : ''}" data-stat-key="${key}" title="Giữ hoặc chạm 2 lần xem chi tiết">
                        <span class="td-hidden-dot">${idx === 2 && isLit ? '✦' : isLit ? '●' : '○'}</span>
                        <span>${showFull ? statText(st) : statTiny(st)}</span>
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
                          ${on ? '<span class="td-equipped-pill" title="Đang mặc">✔</span>' : ''}
                        </div>
                        <div class="td-gear-card-badges">
                          <span class="td-rarity-dot" style="background:${theme.badgeBg}" title="${RARITY_LABEL[it.rarity]}"></span>
                          <span class="td-el-badge" style="background:${elInfo.colorHex}" title="Hành ${elInfo.label}">
                            ${elUrl ? `<img class="td-badge-el-icon" src="${elUrl}" alt="${elInfo.label}" />` : elInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    ${previewHtml}
                    <div class="td-gear-card-stats td-compact-stats-grid">
                      ${visRows}
                      ${hidRows}
                    </div>
                  </button>
                `;
              })
              .join('');

      const offBtn = currentItem
        ? `<button type="button" class="td-gear-off-btn" data-gear-off="1" title="Cởi ${slotInfo.label}">Cởi</button>`
        : '';

      pick.innerHTML = `
        <div class="td-gear-picker-drawer" data-testid="td-gear-picker">
          <div class="td-gear-picker-head">
            <strong>${slotInfo.label}</strong>
            <div class="td-gear-picker-actions">
              ${offBtn}
              <button type="button" class="td-close-btn td-picker-close" id="btn-close-gear-pick" aria-label="Đóng">✕</button>
            </div>
          </div>
          ${supHintHtml}
          <div class="td-gear-item-list">${listHtml}</div>
        </div>
      `;

      pick.querySelector<HTMLButtonElement>('#btn-close-gear-pick')?.addEventListener('click', () => {
        pickSlot = null;
        revealedStatKey = null;
        sound.playUiClick();
        renderGear();
      });

      // Bấm giữ (>= 380ms) hoặc chạm 2 lần (dblclick) vào dòng chỉ số -> mở statText đầy đủ mà không mặc nhầm
      let suppressNextCardClick = false;
      pick.querySelectorAll<HTMLElement>('[data-stat-key]').forEach((row) => {
        let pressTimer: number | null = null;
        const key = row.dataset.statKey!;
        const reveal = () => {
          suppressNextCardClick = true;
          revealedStatKey = revealedStatKey === key ? null : key;
          sound.playUiClick();
          renderGear();
        };
        row.addEventListener('pointerdown', () => {
          pressTimer = window.setTimeout(() => {
            pressTimer = null;
            reveal();
          }, 380);
        });
        const cancelPress = () => {
          if (pressTimer !== null) {
            window.clearTimeout(pressTimer);
            pressTimer = null;
          }
        };
        row.addEventListener('pointerup', cancelPress);
        row.addEventListener('pointerleave', cancelPress);
        row.addEventListener('pointercancel', cancelPress);
        row.addEventListener('dblclick', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          cancelPress();
          reveal();
        });
      });

      pick.querySelectorAll<HTMLButtonElement>('[data-gear-item]').forEach((b) => {
        b.onclick = () => {
          if (suppressNextCardClick) {
            suppressNextCardClick = false;
            return;
          }
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
    const pendingLo = TitleScene.pendingLoadoutStage;
    TitleScene.pendingLoadoutStage = null;
    if (pendingLo && STAGES[pendingLo]) openLoadoutPicker(STAGES[pendingLo]);
  }

  private unmountOverlay(): void {
    if (this.overlayEl) {
      this.overlayEl.remove();
      this.overlayEl = null;
    }
  }
}
