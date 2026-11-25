// Синтезированные звуки (без файлов). Свои файлы: sound.setFile('win', '/sounds/win.mp3')
export type SoundName = 'select' | 'start' | 'tick' | 'stop' | 'win' | 'clover' | 'fail'
type Step = [freq: number, dur: number, delay?: number, type?: OscillatorType, vol?: number]
const P: Record<SoundName, Step[]> = {
  select: [[660, .06, 0, 'sine', .05]],
  start: [[220, .25, 0, 'triangle', .06], [330, .25, .08, 'triangle', .05]],
  tick: [[1400, .015, 0, 'square', .015]],
  stop: [[140, .18, 0, 'sine', .09]],
  win: [[523, .12, 0, 'sine', .06], [659, .12, .1, 'sine', .06], [784, .24, .2, 'sine', .06]],
  clover: [[523, .1, 0, 'sine', .06], [659, .1, .08, 'sine', .06], [784, .1, .16, 'sine', .06], [1046, .1, .24, 'sine', .06], [1318, .35, .34, 'sine', .05]],
  fail: [[330, .2, 0, 'sine', .05], [247, .3, .16, 'sine', .05]],
}
class Sound {
  enabled = localStorage.getItem('sc.sound') !== '0'
  private ctx?: AudioContext
  private files: Partial<Record<SoundName, string>> = {}
  setFile(n: SoundName, url: string) { this.files[n] = url }
  setEnabled(v: boolean) { this.enabled = v; localStorage.setItem('sc.sound', v ? '1' : '0') }
  play(n: SoundName) {
    if (!this.enabled) return
    try {
      const f = this.files[n]; if (f) { const a = new Audio(f); a.volume = .5; void a.play(); return }
      const ctx = (this.ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)())
      if (ctx.state === 'suspended') void ctx.resume()
      for (const [freq, dur, delay = 0, type = 'sine', vol = .05] of P[n]) {
        const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain()
        o.type = type; o.frequency.value = freq
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur)
        o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + .02)
      }
    } catch { /* аудио недоступно */ }
  }
}
export const sound = new Sound()
