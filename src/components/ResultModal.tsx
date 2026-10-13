import { useEffect, useMemo, useRef, useState } from 'react'
import type { WheelItem, WheelMode } from '../types'
import { playTimeUp } from '../lib/sound'

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

const CONFETTI_COLORS = ['#ef476f', '#ffd166', '#06a77d', '#118ab2', '#6a4c93', '#f78c35']

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.6 + Math.random() * 1.4,
        rotate: Math.random() * 360,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    [],
  )
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            rotate: `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  )
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function AnswerTimer({ seconds, soundOn }: { seconds: number; soundOn: boolean }) {
  const [left, setLeft] = useState(seconds)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    return () => window.clearInterval(id)
  }, [running])

  useEffect(() => {
    if (running && left === 0) {
      setRunning(false)
      if (soundOn) playTimeUp()
    }
  }, [running, left, soundOn])

  const progress = left / seconds
  const done = left === 0

  return (
    <div className={`timer ${done ? 'timer-done' : ''}`}>
      <div className="timer-bar">
        <div className="timer-fill" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="timer-row">
        <span className="timer-value">{done ? 'Süre doldu!' : formatTime(left)}</span>
        {!done && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRunning((r) => !r)}>
            {running ? 'Duraklat' : left === seconds ? 'Süreyi başlat' : 'Devam et'}
          </button>
        )}
        {left !== seconds && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setRunning(false)
              setLeft(seconds)
            }}
          >
            Sıfırla
          </button>
        )}
      </div>
    </div>
  )
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

        {answerSeconds > 0 && <AnswerTimer seconds={answerSeconds} soundOn={soundOn} />}

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
