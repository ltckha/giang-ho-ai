import { getInitialMusicMuted, saveMusicMuted } from './preferences';

export type BgmTrackId = 'title' | 'stage_1' | 'stage_2' | 'stage_3' | 'boss';

interface BgmTrackSpec {
  id: BgmTrackId;
  label: string;
  /** Thời lượng mỗi nhịp 1/8 (giây) */
  stepSec: number;
  /** Giai điệu ngũ cung 16 bước (Hz, 0 = nghỉ) */
  melody: number[];
  /** Đệm trầm êm 16 bước (Hz, 0 = nghỉ) */
  bass: number[];
  melodyWave: OscillatorType;
  bassWave: OscillatorType;
  /** Âm lượng chuẩn hóa (sau masterGain 0.032 -> nhỏ hơn tiếng hiệu ứng SFX) */
  melodyGain: number;
  bassGain: number;
  /** Có nhịp trống trầm dồn (dành cho trận Trùm Mùa Nồm) */
  pulseBeat?: boolean;
}

// Bảng tần số nốt nhạc chuẩn (A4 = 440Hz)
const N = {
  G2: 98.0,
  A2: 110.0,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  Fs4: 369.99,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
};

/**
 * 5 giai điệu ngũ cung tự tạo 100% bằng Web Audio API (không tệp nhạc ngoài):
 * - title: Phố nhỏ Đà Lạt chiều mưa (D ngũ cung, êm dịu, 76 BPM)
 * - stage_1: Tiệm Giày Hẻm Dốc (C ngũ cung, ấm áp, 88 BPM)
 * - stage_2: Tiệm Bánh Đầu Phố (G ngũ cung, vui tươi, 104 BPM)
 * - stage_3: Tiệm Hoa Cuối Dốc (F ngũ cung, trong trẻo, 84 BPM)
 * - boss: Trận Trùm Mùa Nồm (A thứ ngũ cung, nhịp dồn, 138 BPM)
 */
const BGM_TRACKS: Record<BgmTrackId, BgmTrackSpec> = {
  title: {
    id: 'title',
    label: 'Phố Dốc Chiều Mưa',
    stepSec: 0.395,
    melody: [
      N.D4, 0, N.Fs4, N.A4, N.B4, 0, N.A4, 0,
      N.D5, 0, N.B4, N.A4, N.Fs4, 0, N.E4, 0,
    ],
    bass: [
      N.D3, 0, 0, 0, N.A2, 0, 0, 0,
      N.B3 * 0.5, 0, 0, 0, N.A2, 0, 0, 0,
    ],
    melodyWave: 'sine',
    bassWave: 'triangle',
    melodyGain: 0.55,
    bassGain: 0.34,
  },
  stage_1: {
    id: 'stage_1',
    label: 'Tiệm Giày Ấm Áp',
    stepSec: 0.34,
    melody: [
      N.C4, N.E4, N.G4, 0, N.A4, N.G4, N.E4, 0,
      N.D4, N.E4, N.G4, N.A4, N.G4, 0, N.E4, N.D4,
    ],
    bass: [
      N.C3, 0, 0, 0, N.A2, 0, 0, 0,
      N.G2, 0, 0, 0, N.C3, 0, N.G2, 0,
    ],
    melodyWave: 'triangle',
    bassWave: 'sine',
    melodyGain: 0.52,
    bassGain: 0.36,
  },
  stage_2: {
    id: 'stage_2',
    label: 'Tiệm Bánh Vui Tươi',
    stepSec: 0.288,
    melody: [
      N.G4, N.A4, N.B4, N.D5, N.E5, 0, N.D5, N.B4,
      N.A4, N.B4, N.D5, N.B4, N.A4, N.G4, N.E4, 0,
    ],
    bass: [
      N.G3, 0, N.D3, 0, N.E3, 0, N.D3, 0,
      N.C3, 0, N.G2, 0, N.D3, 0, N.G2, 0,
    ],
    melodyWave: 'triangle',
    bassWave: 'triangle',
    melodyGain: 0.5,
    bassGain: 0.32,
  },
  stage_3: {
    id: 'stage_3',
    label: 'Tiệm Hoa Trong Trẻo',
    stepSec: 0.357,
    melody: [
      N.F4, 0, N.A4, N.C5, N.D5, 0, N.C5, N.A4,
      N.G4, N.A4, N.C5, 0, N.F5, N.D5, N.C5, 0,
    ],
    bass: [
      N.F3, 0, 0, 0, N.C3, 0, 0, 0,
      N.D3, 0, 0, 0, N.C3, 0, 0, 0,
    ],
    melodyWave: 'sine',
    bassWave: 'sine',
    melodyGain: 0.56,
    bassGain: 0.3,
  },
  boss: {
    id: 'boss',
    label: 'Trận Trùm Mùa Nồm',
    stepSec: 0.217,
    melody: [
      N.A4, 0, N.A4, N.C5, N.D5, N.C5, N.A4, N.G4,
      N.E4, 0, N.G4, N.A4, N.C5, N.A4, N.G4, N.E4,
    ],
    bass: [
      N.A2, N.A2, 0, N.A2, N.C3, 0, N.D3, 0,
      N.E3, N.E3, 0, N.D3, N.C3, 0, N.G2, 0,
    ],
    melodyWave: 'triangle',
    bassWave: 'sawtooth',
    melodyGain: 0.52,
    bassGain: 0.24,
    pulseBeat: true,
  },
};

const MASTER_BGM_GAIN = 0.036;

/**
 * Trình phát nhạc nền nhẹ thuần Web Audio API:
 * - Âm lượng nhỏ hơn tiếng hiệu ứng SFX (masterGain 0.036 qua lọc thông thấp 1700Hz).
 * - Chỉ khởi chạy sau lần chạm / click / phím đầu tiên để tuân thủ luật chặn tự phát của trình duyệt.
 * - Có nút tắt nhạc riêng, nhớ lựa chọn qua localStorage.
 */
class BgmManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private lowpass: BiquadFilterNode | null = null;
  private muted = getInitialMusicMuted();
  private unlocked = false;
  private currentTrack: BgmTrackId | null = null;
  private stepIndex = 0;
  private timerId: number | null = null;
  private gestureBound = false;

  constructor() {
    this.bindUnlockListeners();
  }

  private bindUnlockListeners(): void {
    if (typeof window === 'undefined' || this.gestureBound) return;
    this.gestureBound = true;

    const handleGesture = () => {
      this.unlockFromGesture();
    };

    window.addEventListener('pointerdown', handleGesture, { passive: true });
    window.addEventListener('keydown', handleGesture, { passive: true });
    window.addEventListener('click', handleGesture, { passive: true });

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stopScheduler();
          if (this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend().catch(() => {});
          }
        } else if (this.unlocked && !this.muted && this.currentTrack) {
          this.ensureAudioGraph();
          this.startScheduler();
        }
      });
    }
  }

  private ensureAudioGraph(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      try {
        this.ctx = new AudioCtx();
        this.lowpass = this.ctx.createBiquadFilter();
        this.lowpass.type = 'lowpass';
        this.lowpass.frequency.value = 1750;
        this.lowpass.Q.value = 0.7;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0.0001 : MASTER_BGM_GAIN;

        this.lowpass.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended' && !this.muted) {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlockFromGesture(): void {
    if (this.unlocked) {
      if (this.ctx && this.ctx.state === 'suspended' && !this.muted) {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    this.unlocked = true;
    if (!this.muted && this.currentTrack) {
      this.ensureAudioGraph();
      this.startScheduler();
    }
  }

  public isUnlocked(): boolean {
    return this.unlocked;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public getCurrentTrack(): BgmTrackId | null {
    return this.currentTrack;
  }

  public getTrackLabel(trackId?: BgmTrackId | null): string {
    const id = trackId ?? this.currentTrack;
    return id ? BGM_TRACKS[id].label : '';
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    saveMusicMuted(muted);
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(muted ? 0.0001 : MASTER_BGM_GAIN, now, 0.06);
    }
    if (muted) {
      this.stopScheduler();
    } else {
      this.unlocked = true;
      this.ensureAudioGraph();
      if (this.currentTrack) {
        this.startScheduler();
      }
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public setTrack(trackId: BgmTrackId): void {
    if (this.currentTrack === trackId) return;
    this.currentTrack = trackId;
    this.stepIndex = 0;

    if (this.unlocked && !this.muted) {
      this.ensureAudioGraph();
      this.stopScheduler();
      this.startScheduler();
    }
  }

  public stop(): void {
    this.stopScheduler();
    this.currentTrack = null;
  }

  private stopScheduler(): void {
    if (this.timerId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private startScheduler(): void {
    if (typeof window === 'undefined' || !this.currentTrack || this.muted || !this.unlocked) return;
    if (this.timerId !== null) return;

    const spec = BGM_TRACKS[this.currentTrack];
    this.playStep(spec);
    this.timerId = window.setInterval(() => {
      if (!this.currentTrack || this.muted) {
        this.stopScheduler();
        return;
      }
      this.playStep(BGM_TRACKS[this.currentTrack]);
    }, Math.round(spec.stepSec * 1000));
  }

  private playStep(spec: BgmTrackSpec): void {
    const ctx = this.ensureAudioGraph();
    if (!ctx || !this.lowpass || ctx.state !== 'running') return;

    const idx = this.stepIndex % spec.melody.length;
    this.stepIndex = (idx + 1) % spec.melody.length;
    const now = ctx.currentTime + 0.015;

    const melFreq = spec.melody[idx] ?? 0;
    if (melFreq > 0) {
      this.scheduleNote(ctx, melFreq, spec.stepSec * 1.45, spec.melodyWave, spec.melodyGain, now);
    }

    const bassFreq = spec.bass[idx] ?? 0;
    if (bassFreq > 0) {
      this.scheduleNote(ctx, bassFreq, spec.stepSec * 1.9, spec.bassWave, spec.bassGain, now);
    }

    // Nhịp trống trầm nhẹ tăng kịch tính cho trận Trùm Mùa Nồm
    if (spec.pulseBeat && idx % 2 === 0) {
      this.scheduleDrumPulse(ctx, idx % 4 === 0 ? 102 : 78, now);
    }
  }

  private scheduleNote(
    ctx: AudioContext,
    freq: number,
    durSec: number,
    type: OscillatorType,
    peakGain: number,
    startTime: number,
  ): void {
    if (!this.lowpass) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durSec);

    osc.connect(gain);
    gain.connect(this.lowpass);
    osc.start(startTime);
    osc.stop(startTime + durSec + 0.03);
  }

  private scheduleDrumPulse(ctx: AudioContext, startFreq: number, startTime: number): void {
    if (!this.lowpass) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(42, startTime + 0.11);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(0.45, startTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.12);

    osc.connect(gain);
    gain.connect(this.lowpass);
    osc.start(startTime);
    osc.stop(startTime + 0.14);
  }
}

export const music = new BgmManager();
