import { useState } from 'react'
import type { HistoryEntry } from '../types'

interface HistoryPanelProps {
  history: HistoryEntry[]
  onClear: () => void
}

const timeFmt = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' })
const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' })

export function historyAsText(history: HistoryEntry[]): string {
  return [...history]
    .reverse()
    .map((h) => `${timeFmt.format(h.at)}  ${h.mode === 'people' ? '🎤' : '❓'} ${h.label}`)
    .join('\n')
}

export function HistoryPanel({ history, onClear }: HistoryPanelProps) {
  const [copied, setCopied] = useState(false)

  if (history.length === 0) {
    return (
      <div className="panel-body">
        <p className="muted">Çark döndükçe çıkan sorular ve kişiler burada listelenir.</p>
      </div>
    )
  }

  // En yeni üstte; gün değiştiğinde ara başlık göster.
  let lastDay = ''

  return (
    <div className="panel-body">
      <div className="panel-summary">
        <span>
          <strong>{history.length}</strong> kayıt
        </span>
        <div className="row-gap">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(historyAsText(history))
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              } catch {
                alert('Panoya kopyalanamadı.')
              }
            }}
          >
            {copied ? 'Kopyalandı ✓' : 'Kopyala'}
          </button>
          <button
            type="button"
            className="btn btn-danger-ghost btn-sm"
            onClick={() => {
              if (confirm('Geçmiş temizlensin mi?')) onClear()
            }}
          >
            Temizle
          </button>
        </div>
      </div>

      <ul className="history-list">
        {history.map((h) => {
          const day = dateFmt.format(h.at)
          const header = day !== lastDay ? day : null
          lastDay = day
          return (
            <li key={h.id}>
              {header && <div className="history-day">{header}</div>}
              <div className="history-item">
                <span className="history-time">{timeFmt.format(h.at)}</span>
                <span className="history-icon">{h.mode === 'people' ? '🎤' : '❓'}</span>
                <span className="history-label">
                  {h.label}
                  {h.deckName && <small>{h.deckName}</small>}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
