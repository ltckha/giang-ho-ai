/**
 * Bộ tổng hợp âm thanh Web Audio API thuần offline (không tải tệp ngoài, không gọi mạng).
 * Dùng ngũ cung cổ trang (C-D-E-G-A) cho hiệu ứng chiêu thức, hồi máu, nhặt đồ và lên cấp.
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
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  }

  public playHit(isCounter = false): void {
    if (isCounter) {
      this.playTone(440, 0.12, 'triangle', 0.14, 660);
      this.playTone(660, 0.1, 'sine', 0.1, 880, 0.04);
    } else {
      this.playTone(210, 0.09, 'sawtooth', 0.09, 110);
    }
  }

  public playSkill(slot: 1 | 2 | 3 | 4): void {
    if (slot === 1) {
      this.playTone(320, 0.09, 'triangle', 0.11, 180);
    } else if (slot === 2) {
      this.playTone(392, 0.16, 'sawtooth', 0.11, 262);
      this.playTone(523, 0.14, 'triangle', 0.08, 392, 0.05);
    } else if (slot === 3) {
      this.playTone(523, 0.18, 'sine', 0.11, 659);
      this.playTone(659, 0.22, 'triangle', 0.09, 784, 0.08);
    } else {
      // Tuyệt kỹ
      this.playTone(196, 0.32, 'sawtooth', 0.14, 98);
      this.playTone(523, 0.22, 'triangle', 0.12, 784, 0.04);
      this.playTone(784, 0.28, 'sine', 0.1, 1046, 0.12);
    }
  }

  public playHeal(): void {
    this.playTone(523, 0.18, 'sine', 0.1, 659);
    this.playTone(659, 0.2, 'sine', 0.09, 784, 0.09);
  }

  public playPickup(): void {
    this.playTone(659, 0.09, 'sine', 0.09, 880);
    this.playTone(880, 0.12, 'triangle', 0.08, 1046, 0.06);
  }

  public playLevelUp(): void {
    const notes = [523, 587, 659, 784, 1046];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.2, 'triangle', 0.12, n * 1.02, idx * 0.075);
    });
  }

  public playBossPhase(): void {
    this.playTone(130, 0.55, 'sawtooth', 0.16, 65);
    this.playTone(260, 0.45, 'square', 0.09, 140, 0.08);
  }

  public playPortal(): void {
    this.playTone(293, 0.22, 'sine', 0.1, 587);
    this.playTone(440, 0.24, 'triangle', 0.08, 880, 0.07);
  }

  public playUiClick(): void {
    this.playTone(587, 0.06, 'sine', 0.07, 659);
  }
}

export const sound = new SoundManager();
