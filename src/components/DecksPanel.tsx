import { useState } from 'react'
import type { Deck } from '../types'
import { uid } from '../lib/random'
import { createDefaultDecks } from '../data/defaultDecks'

interface DecksPanelProps {
  decks: Deck[]
  onChange: (decks: Deck[]) => void
  removedCount: number
  onRestoreRemoved: () => void
  activeCount: number
}

/** Metin kutusundaki her dolu satırı ayrı bir öğe olarak döndürür. */
export function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean)
}

function DeckEditor({ deck, onUpdate, onDelete }: { deck: Deck; onUpdate: (d: Deck) => void; onDelete: () => void }) {
  const [bulk, setBulk] = useState('')

  const addBulk = () => {
    const lines = splitLines(bulk)
    if (!lines.length) return
    onUpdate({ ...deck, questions: [...deck.questions, ...lines.map((text) => ({ id: uid(), text }))] })
    setBulk('')
  }

  return (
    <div className="deck-editor">
      <div className="field-row">
        <input
          className="input input-emoji"
          value={deck.emoji}
          maxLength={4}
          aria-label="Deste simgesi"
          onChange={(e) => onUpdate({ ...deck, emoji: e.target.value })}
        />
        <input
          className="input"
          value={deck.name}
          aria-label="Deste adı"
          onChange={(e) => onUpdate({ ...deck, name: e.target.value })}
        />
      </div>

      <ol className="question-list">
        {deck.questions.map((q) => (
          <li key={q.id}>
            <input
              className="input input-flat"
              value={q.text}
              aria-label="Soru"
              onChange={(e) =>
                onUpdate({
                  ...deck,
                  questions: deck.questions.map((x) => (x.id === q.id ? { ...x, text: e.target.value } : x)),
                })
              }
            />
            <button
              type="button"
              className="icon-btn"
              title="Soruyu sil"
              aria-label="Soruyu sil"
              onClick={() => onUpdate({ ...deck, questions: deck.questions.filter((x) => x.id !== q.id) })}
            >
              ×
            </button>
          </li>
        ))}
      </ol>

      <textarea
        className="input textarea"
        rows={3}
        placeholder={'Soru ekle — her satıra bir soru.\nBaşka bir listeden toplu yapıştırabilirsiniz.'}
        value={bulk}
        onChange={(e) => setBulk(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addBulk()
        }}
      />
      <div className="row-between">
        <button type="button" className="btn btn-danger-ghost btn-sm" onClick={onDelete}>
          Desteyi sil
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={addBulk} disabled={!bulk.trim()}>
          Ekle
        </button>
      </div>
    </div>
  )
}

export function DecksPanel({ decks, onChange, removedCount, onRestoreRemoved, activeCount }: DecksPanelProps) {
  const [openId, setOpenId] = useState<string | null>(null)

  const update = (deck: Deck) => onChange(decks.map((d) => (d.id === deck.id ? deck : d)))

  const addDeck = () => {
    const deck: Deck = { id: uid(), name: 'Yeni deste', emoji: '✨', enabled: true, questions: [] }
    onChange([...decks, deck])
    setOpenId(deck.id)
  }

  return (
    <div className="panel-body">
      <div className="panel-summary">
        <span>
          Çarkta <strong>{activeCount}</strong> soru var
        </span>
        {removedCount > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onRestoreRemoved}>
            Çıkanları geri getir ({removedCount})
          </button>
        )}
      </div>

      <ul className="deck-list">
        {decks.map((deck) => {
          const open = openId === deck.id
          return (
            <li key={deck.id} className={`deck ${deck.enabled ? '' : 'deck-off'}`}>
              <div className="deck-head">
                <label className="check">
                  <input
                    type="checkbox"
                    checked={deck.enabled}
                    onChange={(e) => update({ ...deck, enabled: e.target.checked })}
                  />
                  <span className="deck-emoji">{deck.emoji}</span>
                  <span className="deck-name">{deck.name || 'Adsız deste'}</span>
                </label>
                <span className="badge">{deck.questions.length}</span>
                <button
                  type="button"
                  className="icon-btn"
                  aria-expanded={open}
                  aria-label={open ? 'Desteyi kapat' : 'Desteyi düzenle'}
                  onClick={() => setOpenId(open ? null : deck.id)}
                >
                  {open ? '▾' : '✎'}
                </button>
              </div>
              {open && (
                <DeckEditor
                  deck={deck}
                  onUpdate={update}
                  onDelete={() => {
                    if (confirm(`"${deck.name}" destesi silinsin mi?`)) {
                      onChange(decks.filter((d) => d.id !== deck.id))
                      setOpenId(null)
                    }
                  }}
                />
              )}
            </li>
          )
        })}
      </ul>

      <div className="row-between">
        <button type="button" className="btn btn-ghost btn-sm" onClick={addDeck}>
          + Yeni deste
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            if (confirm('Tüm desteler varsayılan haline dönsün mü? Eklediğiniz sorular silinir.')) {
              onChange(createDefaultDecks())
              setOpenId(null)
            }
          }}
        >
          Varsayılanlara dön
        </button>
      </div>
    </div>
  )
}
