import { useEffect, useRef, useState } from 'react'
import type { WheelItem, WheelMode } from '../types'
import { Confetti } from './Confetti'
import { Countdown } from './Countdown'

interface ResultModalProps {
  item: WheelItem
  mode: WheelMode
  answerSeconds: number
  soundOn: boolean
  removeAfterPick: boolean
  /** remove: true ise çıkan dilim çarktan kaldırılır */
  onClose: (remove: boolean) => void
  onSpinAgain: (remove: boolean) => void
}

export function ResultModal({ item, mode, answerSeconds, soundOn, removeAfterPick, onClose, onSpinAgain }: ResultModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [remove, setRemove] = useState(removeAfterPick)

  useEffect(() => {
    dialogRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(remove)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, remove])

  const isQuestion = mode === 'questions'

  return (
    <div className="modal-backdrop" onClick={() => onClose(remove)}>
      <Confetti />
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
        tabIndex={-1}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-kicker">
          {isQuestion ? (item.deckName ? `Soru · ${item.deckName}` : 'Soru') : 'Söz sırası'}
        </div>
        <h2 id="result-title" className={isQuestion ? 'modal-question' : 'modal-person'}>
          {isQuestion ? item.label : `🎤 ${item.label}`}
        </h2>

        {answerSeconds > 0 && <Countdown seconds={answerSeconds} soundOn={soundOn} />}

        <label className="check">
          <input type="checkbox" checked={remove} onChange={(e) => setRemove(e.target.checked)} />
          {isQuestion ? 'Bu soruyu çarktan çıkar' : 'Bu kişiyi çarktan çıkar'}
        </label>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={() => onClose(remove)}>
            Kapat
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onSpinAgain(remove)}>
            Tekrar çevir
          </button>
        </div>
      </div>
    </div>
  )
}
