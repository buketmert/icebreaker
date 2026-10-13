/*
 * Harici ses dosyası olmadan WebAudio ile kısa efektler üretir.
 * Tarayıcılar sesi ancak bir kullanıcı etkileşiminden sonra başlatır;
 * ilk "Çevir" tıklaması bağlamı açar.
 */

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function beep(freq: number, duration: number, volume: number, type: OscillatorType, delay = 0) {
  const ac = audio()
  if (!ac) return
  const t0 = ac.currentTime + delay
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  gain.gain.setValueAtTime(volume, t0)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(gain).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

/** Dilim sınırı geçildiğinde çıkan "tık" sesi. */
export function playTick() {
  beep(1400, 0.035, 0.06, 'square')
}

/** Çark durduğunda çalan kısa melodi. */
export function playWin() {
  ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => beep(f, 0.22, 0.12, 'triangle', i * 0.09))
}

/** Kutu açılırken. */
export function playReveal() {
  ;[660, 880].forEach((f, i) => beep(f, 0.12, 0.1, 'triangle', i * 0.07))
}

/** "Kandırıldınız": alçalan, komik bir melodi. */
export function playFooled() {
  ;[392, 370, 349, 311].forEach((f, i) => beep(f, i === 3 ? 0.45 : 0.2, 0.1, 'triangle', i * 0.2))
}

/** Cevap süresi dolduğunda. */
export function playTimeUp() {
  beep(440, 0.25, 0.15, 'sawtooth')
  beep(330, 0.35, 0.15, 'sawtooth', 0.25)
}

/** Ses bağlamını kullanıcı etkileşimi sırasında hazırlar. */
export function unlockAudio() {
  audio()
}
