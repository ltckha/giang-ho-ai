/**
 * Hướng dẫn chơi lần đầu (Claude) — luật bước; Antigravity vẽ bong bóng lời, mũi tên, avatar chủ tiệm.
 *
 * Cách dùng trong TdStageScene (Màn 1, khi shouldShowTutorial() đúng):
 *   const tut = new TutorialController(() => markTutorialDone());
 *   - Mỗi khung hình: tut.sync(engine)  (tự sang bước khi điều kiện đạt)
 *   - Khi người chơi mở bảng đặt món ở 1 ô: tut.notify('pad_opened')
 *   - Nút "Tiếp" trong bong bóng: tut.notify('next');  nút "Bỏ qua": tut.skip()
 *   - Khi bấm Gọi đợt: tut.notify('wave_started')
 *   - tut.shouldPause(): true thì tạm dừng engine (không gọi engine.step)
 *   - tut.current(): bước đang hiện (text, target để chỉ mũi tên, showNext)
 */
import type { TowerDefenseEngine } from './tdEngine';
import type { TowerId } from './types';

export type TutorialEvent = 'pad_opened' | 'next' | 'wave_started';

export interface TutorialStep {
  id: 'tap_pad' | 'pick_tower' | 'see_wave' | 'counter' | 'upgrade_go';
  text: string;
  /** Mục tiêu mũi tên: 'pad:<padId>' | 'build:<towerId>' | 'testid:<data-testid>' | 'element_guide' */
  target: string;
  /** Hiện nút "Tiếp" (bước chỉ đọc) */
  showNext: boolean;
  /** Tạm dừng game trong bước này */
  pause: boolean;
}

/** Ô và món gợi ý cho Màn 1 */
export const TUTORIAL_PAD = 'pad_1';
export const TUTORIAL_TOWER: TowerId = 'wood_tower';

export const TUTORIAL_STEPS: TutorialStep[] = [
  { id: 'tap_pad', text: 'Chào bạn! Chạm vào ô tròn trống để đặt món giữ tiệm.', target: `pad:${TUTORIAL_PAD}`, showNext: false, pause: true },
  { id: 'pick_tower', text: 'Chọn Dép Tông — món ném nhanh, rẻ, hợp để mở màn.', target: `build:${TUTORIAL_TOWER}`, showNext: false, pause: true },
  { id: 'see_wave', text: 'Nhìn ô dưới cùng: đợt quái sắp tới thuộc hành gì.', target: 'testid:td-upcoming-box', showNext: true, pause: true },
  { id: 'counter', text: 'Đặt món khắc hành quái sẽ hiện "Trúng tủ!" — đánh mạnh gấp bội. Kim khắc Mộc, Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim.', target: 'element_guide', showNext: true, pause: true },
  { id: 'upgrade_go', text: 'Có xu thì chạm món để nâng cấp. Sẵn sàng thì bấm Gọi đợt!', target: 'testid:btn-call-wave', showNext: false, pause: false },
];

export class TutorialController {
  private index = 0;
  private finished = false;

  constructor(private readonly onDone: () => void) {}

  public isActive(): boolean {
    return !this.finished;
  }

  public current(): TutorialStep | null {
    return this.finished ? null : TUTORIAL_STEPS[this.index]!;
  }

  public stepNumber(): number {
    return this.index + 1;
  }

  public totalSteps(): number {
    return TUTORIAL_STEPS.length;
  }

  public shouldPause(): boolean {
    return !this.finished && TUTORIAL_STEPS[this.index]!.pause;
  }

  private advance(): void {
    this.index += 1;
    if (this.index >= TUTORIAL_STEPS.length) this.finish();
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.onDone();
  }

  public skip(): void {
    this.finish();
  }

  /** Tự sang bước khi điều kiện trong game đạt */
  public sync(engine: Pick<TowerDefenseEngine, 'towers' | 'waveInProgress' | 'currentWaveIndex'>): void {
    if (this.finished) return;
    const step = TUTORIAL_STEPS[this.index]!;
    if (step.id === 'pick_tower' && engine.towers.length > 0) this.advance();
    else if (step.id === 'tap_pad' && engine.towers.length > 0) {
      // người chơi đặt món ngay mà không cần mở bảng theo hướng dẫn
      this.index = 2;
    } else if (step.id === 'upgrade_go' && (engine.waveInProgress || engine.currentWaveIndex >= 0)) this.advance();
  }

  public notify(ev: TutorialEvent): void {
    if (this.finished) return;
    const step = TUTORIAL_STEPS[this.index]!;
    if (ev === 'pad_opened' && step.id === 'tap_pad') this.advance();
    else if (ev === 'next' && step.showNext) this.advance();
    else if (ev === 'wave_started') this.finish();
  }
}
