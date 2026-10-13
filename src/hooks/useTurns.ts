import { useMemo, useState } from 'react'
import type { Participant } from '../types'
import { random } from '../lib/random'
import { completeTurn, emptyTurns, nextTurn, passTurn, roundProgress, type Picker, type TurnState } from '../lib/turns'

/** Rastgele sayıyı updater'ın dışında üretir; böylece state güncellemeleri saf kalır. */
function freshPicker(): Picker {
  const r = random()
  return (n) => Math.floor(r * n)
}

/** Katılımcı listesi üzerinde "herkes bir kez" söz sırası. */
export function useTurns(participants: Participant[]) {
  const ids = useMemo(() => participants.map((p) => p.id), [participants])
  const [state, setState] = useState<TurnState>(emptyTurns)

  const advance = (step: (s: TurnState) => TurnState) => {
    const pick = freshPicker()
    setState((s) => nextTurn(step(s), ids, pick))
  }

  return {
    current: participants.find((p) => p.id === state.current) ?? null,
    progress: roundProgress(state, ids),
    /** Sıradaki kişi konuştu, yenisini seç */
    completeAndNext: () => advance(completeTurn),
    /** Pas: kişi turun sonuna kalır, yenisi seçilir */
    passAndNext: () => advance(passTurn),
    /** Kimse seçili değilse birini seç */
    next: () => advance((s) => s),
    /** Yeni tur başlat ve ilk kişiyi seç */
    restart: () => {
      const pick = freshPicker()
      setState(nextTurn(emptyTurns, ids, pick))
    },
  }
}
