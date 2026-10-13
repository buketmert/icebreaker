import { describe, expect, it } from 'vitest'
import { completeTurn, emptyTurns, nextTurn, passTurn, roundProgress, type Picker } from './turns'

const first: Picker = () => 0
const randomPick: Picker = (n) => Math.floor(Math.random() * n)

describe('tur modu', () => {
  it('herkes bir kez seçilmeden kimse tekrar seçilmez', () => {
    const ids = ['a', 'b', 'c', 'd', 'e']
    for (let trial = 0; trial < 50; trial++) {
      let s = nextTurn(emptyTurns, ids, randomPick)
      const order: string[] = []
      while (s.current) {
        order.push(s.current)
        s = nextTurn(completeTurn(s), ids, randomPick)
      }
      expect([...order].sort()).toEqual(ids)
      expect(roundProgress(s, ids)).toEqual({ done: 5, total: 5, over: true })
    }
  })

  it('pas geçen kişi turun sonuna kalır ve ikinci şans alır', () => {
    const ids = ['a', 'b', 'c']
    let s = nextTurn(emptyTurns, ids, first) // a
    expect(s.current).toBe('a')
    s = nextTurn(passTurn(s), ids, first) // b (a pas geçti)
    expect(s.current).toBe('b')
    s = nextTurn(completeTurn(s), ids, first) // c
    expect(s.current).toBe('c')
    s = nextTurn(completeTurn(s), ids, first) // geriye yalnızca a kaldı
    expect(s.current).toBe('a')
    expect(s.passed).toEqual([])
    s = nextTurn(completeTurn(s), ids, first)
    expect(s.current).toBeNull()
    expect(roundProgress(s, ids).over).toBe(true)
  })

  it('tek kişi pas geçerse yine ona döner', () => {
    const s = nextTurn(passTurn(nextTurn(emptyTurns, ['a'], first)), ['a'], first)
    expect(s.current).toBe('a')
  })

  it('listeden silinen kişileri unutur', () => {
    const s = nextTurn({ done: ['x', 'a'], passed: ['y'], current: null }, ['a', 'b'], first)
    expect(s).toEqual({ done: ['a'], passed: [], current: 'b' })
  })

  it('kimse yoksa sıra boş kalır', () => {
    expect(nextTurn(emptyTurns, [], first).current).toBeNull()
    expect(roundProgress(emptyTurns, []).over).toBe(false)
  })
})
