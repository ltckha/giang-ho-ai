/**
 * Bộ tổng hợp âm thanh Web Audio API thuần offline (không tải tệp ngoài, không gọi mạng).
 * Dùng âm sắc ngũ cung cổ trang cho bắn, trúng đích, khắc hệ, quái nổ, mất mạng, nâng cấp.
 */
class SoundManager {
  private ctx: AudioContext | null = null;
  private muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      try {
        this.ctx = new AudioCtx();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  private playTone(
    freq: number,
    durationSec: number,
    type: OscillatorType,
    volume: number,
    freqEnd?: number,
    delaySec = 0,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), now + durationSec);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  }

  public playShoot(): void {
    this.playTone(360, 0.06, 'triangle', 0.07, 220);
  }

  public playHit(isCounter = false): void {
    if (isCounter) {
      this.playTone(523, 0.09, 'triangle', 0.12, 784);
      this.playTone(784, 0.08, 'sine', 0.09, 1046, 0.03);
    } else {
      this.playTone(230, 0.07, 'sawtooth', 0.07, 130);
    }
  }

  public playEnemyDeath(): void {
    this.playTone(180, 0.11, 'sawtooth', 0.09, 75);
    this.playTone(660, 0.09, 'sine', 0.08, 880, 0.03);
  }

  public playLoseLife(): void {
    this.playTone(150, 0.25, 'sawtooth', 0.16, 65);
    this.playTone(110, 0.3, 'square', 0.12, 55, 0.06);
  }

  public playBuildOrUpgrade(): void {
    this.playTone(440, 0.09, 'triangle', 0.1, 587);
    this.playTone(659, 0.12, 'sine', 0.09, 880, 0.05);
  }

  public playSell(): void {
    this.playTone(587, 0.08, 'sine', 0.08, 440);
  }

  public playWaveStart(): void {
    this.playTone(293, 0.18, 'triangle', 0.11, 440);
    this.playTone(440, 0.22, 'sine', 0.1, 587, 0.08);
  }

  public playVictory(): void {
    const notes = [523, 587, 659, 784, 1046];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.2, 'triangle', 0.12, n * 1.02, idx * 0.08);
    });
  }

  public playBossShift(): void {
    this.playTone(220, 0.24, 'triangle', 0.14, 440);
    this.playTone(330, 0.28, 'sine', 0.12, 660, 0.06);
    this.playTone(587, 0.22, 'triangle', 0.11, 880, 0.13);
  }

  public playChestOpen(): void {
    this.playTone(280, 0.08, 'triangle', 0.11, 380);
    const notes = [587, 784, 988, 1175];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.16, 'sine', 0.09, n * 1.03, 0.05 + idx * 0.055);
    });
  }

  public playUiClick(): void {
    this.playTone(587, 0.05, 'sine', 0.06, 659);
  }
}

export const sound = new SoundManager();
