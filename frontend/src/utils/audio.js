class SoundEffects {
  constructor() {
    this.ctx = null;
  }

  getContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playSend() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Audio catch
    }
  }

  playReceive(mood) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      let freq1 = 440;
      let freq2 = 660;

      switch (mood) {
        case 'happy':
          freq1 = 587.33; // D5
          freq2 = 880;    // A5
          break;
        case 'sad':
          freq1 = 329.63; // E4
          freq2 = 261.63; // C4
          break;
        case 'angry':
          freq1 = 220;    // A3
          freq2 = 185;    // F#3
          break;
        case 'mother':
          freq1 = 392;    // G4
          freq2 = 523.25; // C5
          break;
        case 'drama':
          freq1 = 659.25; // E5
          freq2 = 830.61; // G#5
          break;
        default:
          freq1 = 440;
          freq2 = 660;
          break;
      }

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(freq1, now);
      osc2.frequency.setValueAtTime(freq2, now + 0.06);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.06);
      osc1.stop(now + 0.23);
      osc2.stop(now + 0.23);
    } catch {
      // Audio catch
    }
  }
}

export const soundEffects = new SoundEffects();
