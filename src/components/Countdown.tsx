import { useEffect, useState } from 'react'
import { playTimeUp } from '../lib/sound'

interface CountdownProps {
  seconds: number
  soundOn: boolean
  /** Bileşen görünür olur olmaz saymaya başlasın mı */
  autoStart?: boolean
  label?: string
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Başlat/duraklat/sıfırla düğmeli geri sayım. Yeniden başlatmak için `key` değiştirin. */
export function Countdown({ seconds, soundOn, autoStart = false, label }: CountdownProps) {
  const [left, setLeft] = useState(seconds)
  const [running, setRunning] = useState(autoStart)

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

  const done = left === 0

  return (
    <div className={`timer ${done ? 'timer-done' : ''}`}>
      <div className="timer-bar">
        <div className="timer-fill" style={{ width: `${(left / seconds) * 100}%` }} />
      </div>
      <div className="timer-row">
        {label && <span className="timer-label">{label}</span>}
        <span className="timer-value" aria-live={done ? 'polite' : 'off'}>
          {done ? 'Süre doldu!' : formatTime(left)}
        </span>
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
