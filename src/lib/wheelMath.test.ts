import { describe, expect, it } from 'vitest'
import { indexAtRotation, mod, targetRotation, truncate, wrapLabel } from './wheelMath'

describe('indexAtRotation', () => {
  it('dönüş yokken göstergenin altında ilk dilim olur', () => {
    expect(indexAtRotation(0, 8)).toBe(0)
  })

  it('saat yönünde dönüş, göstergeyi önceki dilimlere taşır', () => {
    // 8 dilim, her biri 45°. Çark 10° dönünce göstergede wheel açısı 350° -> son dilim.
    expect(indexAtRotation(10, 8)).toBe(7)
    expect(indexAtRotation(-10, 8)).toBe(0)
    expect(indexAtRotation(-50, 8)).toBe(1)
  })

  it('birikmiş (360 üstü) açıları doğru işler', () => {
    expect(indexAtRotation(360 * 5 + 10, 8)).toBe(7)
  })
})

describe('targetRotation', () => {
  it('her hedef dilim için doğru dilimde durur', () => {
    for (const count of [1, 2, 3, 7, 16, 41]) {
      for (let target = 0; target < count; target++) {
        for (const current of [0, 123.4, -77, 3600 + 12]) {
          const end = targetRotation(current, target, count, 5, 0.5)
          expect(indexAtRotation(end, count)).toBe(target)
          expect(end).toBeGreaterThanOrEqual(current + 5 * 360)
          expect(end).toBeLessThan(current + 6 * 360)
        }
      }
    }
  })

  it('dilim içi ofsetin kenarları da aynı dilimde kalır', () => {
    for (const offset of [0.15, 0.85]) {
      const end = targetRotation(42, 3, 10, 4, offset)
      expect(indexAtRotation(end, 10)).toBe(3)
    }
  })

  it('gösterge sağdayken (90°) de doğru dilimde durur', () => {
    for (let target = 0; target < 12; target++) {
      const end = targetRotation(17, target, 12, 6, 0.3, 90)
      expect(indexAtRotation(end, 12, 90)).toBe(target)
    }
  })
})

describe('wrapLabel', () => {
  it('kısa metni tek satırda bırakır', () => {
    expect(wrapLabel('Çay mı kahve mi?', 20, 2)).toEqual(['Çay mı kahve mi?'])
  })

  it('kelime sınırından böler ve son satırı kısaltır', () => {
    expect(wrapLabel('Bir iki üç dört beş', 7, 2)).toEqual(['Bir iki', 'üç dör…'])
  })

  it('satıra sığmayan tek kelimeyi kısaltır', () => {
    expect(wrapLabel('Muvaffakiyetsizleştiricileştiriveremeyebileceklerimizdenmişsinizcesine evet', 10, 2)).toEqual([
      'Muvaffaki…',
      'evet',
    ])
  })

  it('tek satır sınırında her şeyi tek satıra sığdırır', () => {
    expect(wrapLabel('Bir sonraki sprint için hedefin', 12, 1)).toEqual(['Bir sonraki…'])
  })
})

describe('yardımcılar', () => {
  it('mod negatif sayılarda pozitif sonuç döner', () => {
    expect(mod(-30, 360)).toBe(330)
  })

  it('truncate uzun metni üç nokta ile kısaltır', () => {
    expect(truncate('Merhaba dünya', 50)).toBe('Merhaba dünya')
    expect(truncate('Merhaba   dünya nasılsın', 10)).toBe('Merhaba d…')
  })
})
