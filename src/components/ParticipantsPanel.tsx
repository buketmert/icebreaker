import { useState } from 'react'
import type { Participant } from '../types'
import { uid } from '../lib/random'

interface ParticipantsPanelProps {
  participants: Participant[]
  onChange: (participants: Participant[]) => void
  removedIds: string[]
  onToggleRemoved: (id: string) => void
  onRestoreRemoved: () => void
}

/** "Ayşe, Mehmet; Zeynep" ya da satır satır yazılmış isimleri ayırır. */
export function splitNames(text: string): string[] {
  return text
    .split(/[,;\n]/)
    .map((n) => n.trim())
    .filter(Boolean)
}

export function ParticipantsPanel({
  participants,
  onChange,
  removedIds,
  onToggleRemoved,
  onRestoreRemoved,
}: ParticipantsPanelProps) {
  const [name, setName] = useState('')
  const removed = new Set(removedIds)
  const waiting = participants.filter((p) => !removed.has(p.id)).length

  const add = () => {
    const existing = new Set(participants.map((p) => p.name.toLocaleLowerCase('tr')))
    const fresh = splitNames(name).filter((n) => !existing.has(n.toLocaleLowerCase('tr')))
    if (fresh.length) onChange([...participants, ...fresh.map((n) => ({ id: uid(), name: n }))])
    setName('')
  }

  return (
    <div className="panel-body">
      <div className="panel-summary">
        <span>
          {participants.length === 0 ? (
            'Henüz katılımcı yok'
          ) : (
            <>
              Sırada <strong>{waiting}</strong> / {participants.length} kişi
            </>
          )}
        </span>
        {removedIds.length > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onRestoreRemoved}>
            Herkesi geri getir
          </button>
        )}
      </div>

      <form
        className="field-row"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <input
          className="input"
          placeholder="İsim ekle (virgülle birden fazla)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onPaste={(e) => {
            // Excel/Teams listesinden çok satırlı yapıştırmayı virgüllere çevir.
            const text = e.clipboardData.getData('text')
            if (text.includes('\n')) {
              e.preventDefault()
              setName(splitNames(text).join(', '))
            }
          }}
        />
        <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
          Ekle
        </button>
      </form>

      <ul className="people-list">
        {participants.map((p) => {
          const isRemoved = removed.has(p.id)
          return (
            <li key={p.id} className={isRemoved ? 'person-done' : ''}>
              <button
                type="button"
                className="person-toggle"
                title={isRemoved ? 'Çarka geri ekle' : 'Konuştu olarak işaretle'}
                onClick={() => onToggleRemoved(p.id)}
              >
                {isRemoved ? '✓' : ''}
              </button>
              <span className="person-name">{p.name}</span>
              <button
                type="button"
                className="icon-btn"
                aria-label={`${p.name} kişisini sil`}
                onClick={() => onChange(participants.filter((x) => x.id !== p.id))}
              >
                ×
              </button>
            </li>
          )
        })}
      </ul>

      {participants.length > 0 && (
        <div className="row-end">
          <button
            type="button"
            className="btn btn-danger-ghost btn-sm"
            onClick={() => {
              if (confirm('Tüm katılımcılar silinsin mi?')) onChange([])
            }}
          >
            Listeyi temizle
          </button>
        </div>
      )}
    </div>
  )
}
