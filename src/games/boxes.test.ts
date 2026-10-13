import { describe, expect, it } from 'vitest'
import { boardColumns, buildBoard, jokerCount } from './boxes'

const items = Array.from({ length: 20 }, (_, i) => ({ refId: `q${i}`, label: `Soru ${i}` }))

describe('buildBoard', () => {
  it('istenen sayıda kutu üretir ve numaraları 1..n sırasıyla verir', () => {
    const board = buildBoard(items, 12, true)
    expect(board).toHaveLength(12)
    expect(board.map((b) => b.id)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1))
    expect(board.every((b) => !b.opened)).toBe(true)
  })

  it('aynı soruyu iki kutuya koymaz', () => {
    const board = buildBoard(items, 16, false)
    const ids = board.map((b) => b.item?.refId)
    expect(new Set(ids).size).toBe(16)
  })

  it('joker sayısını tahta boyutuna göre ayarlar', () => {
    expect(jokerCount(6, true)).toBe(1)
    expect(jokerCount(12, true)).toBe(2)
    expect(jokerCount(16, false)).toBe(0)
    const board = buildBoard(items, 12, true)
    expect(board.filter((b) => b.kind !== 'question')).toHaveLength(2)
    expect(board.find((b) => b.kind === 'everyone')?.prompt).toBeTruthy()
  })

  it('yeterli soru yoksa tahtayı küçültür', () => {
    const board = buildBoard(items.slice(0, 3), 9, true)
    expect(board).toHaveLength(3 + 1)
    expect(buildBoard([], 9, false)).toHaveLength(0)
  })

  it('sütun sayısını seçer', () => {
    expect(boardColumns(4)).toBe(2)
    expect(boardColumns(9)).toBe(3)
    expect(boardColumns(16)).toBe(4)
  })
})
