/*
 * Söz sırası ("tur modu"): herkes bir kez konuşana kadar kimse tekrar seçilmez.
 * Pas geçen kişi turdan düşmez; diğer herkes konuştuktan sonra ikinci bir şans alır.
 * Fonksiyonlar saftır; rastgelelik `pick` parametresiyle dışarıdan verilir.
 */

export interface TurnState {
  /** Bu turda konuşmuş olanlar */
  done: string[]
  /** Pas geçip turun sonuna bırakılanlar */
  passed: string[]
  /** Şu an sırası olan kişi */
  current: string | null
}

export const emptyTurns: TurnState = { done: [], passed: [], current: null }

/** [0, n) aralığında indeks seçen fonksiyon */
export type Picker = (n: number) => number

/** Sıradaki kişiyi seçer. Konuşmamış ve pas geçmemiş kimse yoksa pas geçenlere döner. */
export function nextTurn(state: TurnState, ids: string[], pick: Picker): TurnState {
  const done = state.done.filter((id) => ids.includes(id))
  const passed = state.passed.filter((id) => ids.includes(id))
  const eligible = ids.filter((id) => !done.includes(id) && id !== state.current)
  const fresh = eligible.filter((id) => !passed.includes(id))
  const pool = fresh.length ? fresh : eligible
  if (pool.length === 0) return { done, passed, current: null }
  const current = pool[pick(pool.length)]
  return { done, passed: passed.filter((id) => id !== current), current }
}

/** Sıradaki kişi konuştu. */
export function completeTurn(state: TurnState): TurnState {
  if (!state.current) return state
  return { ...state, done: [...state.done, state.current], current: null }
}

/** Sıradaki kişi pas geçti; turun sonuna kalır. */
export function passTurn(state: TurnState): TurnState {
  if (!state.current) return state
  return { ...state, passed: [...state.passed.filter((id) => id !== state.current), state.current], current: null }
}

export function roundProgress(state: TurnState, ids: string[]) {
  const done = ids.filter((id) => state.done.includes(id)).length
  return { done, total: ids.length, over: ids.length > 0 && done === ids.length }
}
