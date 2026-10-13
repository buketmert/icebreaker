/** [0, 1) aralığında, mümkünse kriptografik kaynaktan rastgele sayı. */
export function random(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    return buf[0] / 2 ** 32
  }
  return Math.random()
}

/** [0, max) aralığında tam sayı. */
export function randomInt(max: number): number {
  return Math.floor(random() * max)
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`
}
