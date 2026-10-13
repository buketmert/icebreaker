/*
 * Çark geometrisi. Açılar derece cinsindendir ve saat 12 yönünden saat yönünde ölçülür.
 * Dilim i, çarkın kendi koordinatlarında [i * seg, (i + 1) * seg) aralığını kaplar.
 * Gösterge (ok) `pointer` açısında sabit durur; çark `rotation` derece saat yönünde döndürülür.
 */

export const mod = (n: number, m: number) => ((n % m) + m) % m

export function segmentAngle(count: number): number {
  return 360 / count
}

/** Verilen dönüş açısında göstergenin altında kalan dilimin indeksi. */
export function indexAtRotation(rotation: number, count: number, pointer = 0): number {
  const seg = segmentAngle(count)
  // Gösterge, çarkın kendi koordinatlarında (pointer - rotation) açısına denk gelir.
  const pointerAngle = mod(pointer - rotation, 360)
  return Math.min(count - 1, Math.floor(pointerAngle / seg))
}

/**
 * `target` dilimi göstergenin altına gelecek şekilde son dönüş açısını hesaplar.
 * @param current     Şu anki toplam dönüş (birikmiş, 360'tan büyük olabilir)
 * @param extraTurns  Hedefe varmadan önce atılacak tam tur sayısı
 * @param offset      Dilim içindeki konum, 0..1 (kenarlara denk gelmemesi için ~0.15–0.85 kullanın)
 */
export function targetRotation(
  current: number,
  target: number,
  count: number,
  extraTurns: number,
  offset: number,
  pointer = 0,
): number {
  const seg = segmentAngle(count)
  const wheelAngle = (target + offset) * seg
  const desired = mod(pointer - wheelAngle, 360)
  const delta = mod(desired - mod(current, 360), 360)
  return current + extraTurns * 360 + delta
}

/** Metni kelime sınırlarından en fazla `maxLines` satıra böler; son satır gerekirse kısaltılır. */
export function wrapLabel(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (let i = 0; i < words.length; i++) {
    const candidate = current ? `${current} ${words[i]}` : words[i]
    if (candidate.length <= maxChars) {
      current = candidate
    } else if (lines.length === maxLines - 1) {
      // Son satır: kalan her şeyi bu satıra koy ve kısalt.
      lines.push(truncate([current, ...words.slice(i)].filter(Boolean).join(' '), maxChars))
      return lines
    } else if (current) {
      // Satırı kapat, aynı kelimeyi yeni satırda tekrar dene.
      lines.push(current)
      current = ''
      i--
    } else {
      // Tek kelime bile satıra sığmıyor.
      lines.push(truncate(words[i], maxChars))
    }
  }
  if (current) lines.push(current)
  return lines
}

/** Yavaşlayarak duran çark hissi için easing (easeOutQuart). */
export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

/** Kutupsal koordinatı (saat 12'den saat yönünde) kartezyene çevirir. */
export function polar(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

/** Çember diliminin SVG path'i. */
export function slicePath(cx: number, cy: number, r: number, start: number, end: number): string {
  if (end - start >= 359.999) {
    // Tek dilim: tam daire
    return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`
  }
  const [x1, y1] = polar(cx, cy, r, start)
  const [x2, y2] = polar(cx, cy, r, end)
  const largeArc = end - start > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

/** Etiketi dilime sığacak şekilde kısaltır. */
export function truncate(text: string, max: number): string {
  const clean = text.trim().replace(/\s+/g, ' ')
  if (clean.length <= max) return clean
  return clean.slice(0, Math.max(1, max - 1)).trimEnd() + '…'
}
