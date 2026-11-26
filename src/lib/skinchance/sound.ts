class Sfx {
  enabled = true;
  private ctx: AudioContext | null = null;

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  tick() {
    this.tone(880, 0.03, "square", 0.03);
  }
  select() {
    this.tone(520, 0.06, "triangle", 0.04);
  }
  win() {
    this.tone(523, 0.1, "triangle", 0.06);
    setTimeout(() => this.tone(784, 0.14, "triangle", 0.05), 90);
  }
  fail() {
    this.tone(180, 0.18, "sawtooth", 0.04);
  }
  click() {
    this.tone(340, 0.04, "square", 0.03);
  }
}

export const sound = new Sfx();
