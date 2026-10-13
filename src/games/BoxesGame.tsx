import { useEffect, useRef, useState } from 'react'
import type { NewHistoryEntry, Participant, Settings, WheelItem } from '../types'
import { BOARD_SIZES, JOKERS, boardColumns, buildBoard, jokerCount, type Box } from './boxes'
import { useTurns } from '../hooks/useTurns'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { Countdown } from '../components/Countdown'
import { Confetti } from '../components/Confetti'
import { playReveal, playWin, unlockAudio } from '../lib/sound'

interface BoxesGameProps {
  questionItems: WheelItem[]
  participants: Participant[]
  settings: Settings
  onLog: (entry: NewHistoryEntry) => void
  onOpenPanel: (panel: 'decks' | 'people') => void
}

interface BoxesConfig {
  size: number
  jokers: boolean
}

const BOX_COLORS = ['#ef476f', '#f78c35', '#d99a00', '#06a77d', '#118ab2', '#6a4c93', '#e56b9f', '#0f9d9a']

function boxSummary(box: Box): string {
  if (box.kind === 'question') return box.item?.label ?? ''
  const joker = JOKERS[box.kind]
  return `${joker.emoji} ${joker.title}${box.prompt ? `: ${box.prompt}` : ''}`
}

function BoxReveal({
  box,
  person,
  settings,
  onDone,
  onPass,
}: {
  box: Box
  person: string | null
  settings: Settings
  onDone: () => void
  onPass: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDone()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])

  const joker = box.kind === 'question' ? null : JOKERS[box.kind]

  return (
    <div className="modal-backdrop">
      <div
        className="modal box-reveal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="box-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="modal-kicker">
          Kutu {box.id}
          {box.item?.deckName ? ` · ${box.item.deckName}` : ''}
          {joker ? ' · Joker' : ''}
        </div>
        {person && <p className="reveal-person">🎤 {person}</p>}

        {joker ? (
          <>
            <h2 id="box-title" className="modal-question">
              {joker.emoji} {joker.title}
            </h2>
            <p className="joker-text">{joker.text}</p>
            {box.prompt && <p className="joker-prompt">“{box.prompt}”</p>}
          </>
        ) : (
          <h2 id="box-title" className="modal-question">
            {box.item?.label}
          </h2>
        )}

        {settings.answerSeconds > 0 && !joker && <Countdown seconds={settings.answerSeconds} soundOn={settings.soundOn} />}

        <div className="modal-actions">
          {person && (
            <button type="button" className="btn btn-ghost" onClick={onPass} title="Kutu kapanır, sıra sonraki kişiye geçer">
              Pas geç
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onDone}>
            Tamam
          </button>
        </div>
      </div>
    </div>
  )
}

export function BoxesGame({ questionItems, participants, settings, onLog, onOpenPanel }: BoxesGameProps) {
  const [config, setConfig] = useLocalStorage<BoxesConfig>('boxes-config', () => ({ size: 9, jokers: true }))
  const [board, setBoard] = useState<Box[] | null>(null)
  const [openId, setOpenId] = useState<number | null>(null)
  const turns = useTurns(participants)
  const hasPeople = participants.length > 0

  const start = () => {
    unlockAudio()
    setBoard(buildBoard(questionItems, config.size, config.jokers))
    setOpenId(null)
    if (hasPeople) turns.restart()
  }

  const openBox = (box: Box) => {
    if (box.opened) return
    unlockAudio()
    if (settings.soundOn) playReveal()
    setOpenId(box.id)
  }

  const finishBox = () => {
    if (!board || openId == null) return
    const box = board.find((b) => b.id === openId)
    if (!box) return
    const next = board.map((b) => (b.id === openId ? { ...b, opened: true } : b))
    setBoard(next)
    setOpenId(null)
    onLog({ mode: 'questions', label: boxSummary(box), deckName: box.item?.deckName, person: turns.current?.name })
    if (hasPeople) turns.completeAndNext()
    if (next.every((b) => b.opened) && settings.soundOn) playWin()
  }

  const passBox = () => {
    setOpenId(null)
    turns.passAndNext()
  }

  if (!board) {
    const jokers = jokerCount(config.size, config.jokers)
    const shortBy = config.size - jokers - questionItems.length
    return (
      <section className="stage game-stage" aria-label="Gizemli Kutular">
        <div className="game-setup">
          <div className="setup-hero">
            <span className="setup-emoji" aria-hidden="true">
              🎁
            </span>
            <h2>Gizemli Kutular</h2>
            <p>Her kutunun içinde bir soru saklı. Hangisini açacağına sırası gelen kişi karar verir.</p>
          </div>

          <ol className="rules">
            <li>Sırası gelen kişi bir kutu numarası söyler, kolaylaştırıcı o kutuyu açar.</li>
            <li>Kutudan çıkan soruyu cevaplar. İstemezse pas geçer; kutu kapanır, kendisi turun sonuna kalır.</li>
            {config.jokers && (
              <li>
                Joker kutular: <strong>🎯 Devret</strong> (soruyu sen sorarsın) ve <strong>👥 Herkes</strong> (herkes tek
                kelimeyle cevaplar).
              </li>
            )}
          </ol>

          <div className="field">
            <span>Kutu sayısı</span>
            <div className="segmented" role="radiogroup" aria-label="Kutu sayısı">
              {BOARD_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={config.size === size}
                  className={config.size === size ? 'active' : ''}
                  onClick={() => setConfig({ ...config, size })}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <label className="check">
            <input type="checkbox" checked={config.jokers} onChange={(e) => setConfig({ ...config, jokers: e.target.checked })} />
            Joker kutuları ekle ({jokerCount(config.size, true)} adet)
          </label>

          <p className="muted">
            Seçili destelerde <strong>{questionItems.length}</strong> soru var
            {shortBy > 0 && questionItems.length > 0 && ` — tahta ${questionItems.length + jokers} kutuyla kurulacak`}.{' '}
            {hasPeople
              ? `${participants.length} katılımcı sırayla oynayacak.`
              : 'Katılımcı eklerseniz söz sırası otomatik belirlenir.'}
          </p>

          <div className="setup-actions">
            {!hasPeople && (
              <button type="button" className="btn btn-ghost" onClick={() => onOpenPanel('people')}>
                Katılımcı ekle
              </button>
            )}
            {questionItems.length === 0 ? (
              <button type="button" className="btn btn-primary" onClick={() => onOpenPanel('decks')}>
                Soru destesi seç
              </button>
            ) : (
              <button type="button" className="btn btn-spin" onClick={start}>
                Tahtayı hazırla
              </button>
            )}
          </div>
        </div>
      </section>
    )
  }

  const openedCount = board.filter((b) => b.opened).length
  const allOpened = openedCount === board.length
  const openBoxData = openId != null ? board.find((b) => b.id === openId) : undefined
  const { current, progress } = turns

  return (
    <section className="stage game-stage" aria-label="Gizemli Kutular">
      <div className="game-bar">
        <span className="chip">
          Açılan <strong>{openedCount}</strong>/{board.length}
        </span>
        {hasPeople && (
          <span className="chip">
            Konuşan <strong>{progress.done}</strong>/{progress.total}
          </span>
        )}
        <span className="game-bar-spacer" />
        {current && !allOpened && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={turns.passAndNext} title="Sıradaki kişi pas geçer">
            Pas / başkası
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBoard(null)}>
          Yeni tahta
        </button>
      </div>

      <p className="turn-callout" aria-live="polite">
        {allOpened ? (
          'Tüm kutular açıldı! 🎉'
        ) : current ? (
          <>
            🎤 <strong>{current.name}</strong>, bir kutu numarası söyle!
          </>
        ) : hasPeople && progress.over ? (
          <>
            Herkes bir kutu açtı 🎉{' '}
            <button type="button" className="btn btn-primary btn-sm" onClick={turns.restart}>
              Yeni tur
            </button>
          </>
        ) : hasPeople ? (
          <button type="button" className="btn btn-primary btn-sm" onClick={turns.next}>
            Sıradaki kişiyi seç
          </button>
        ) : (
          'Bir kutu seçin!'
        )}
      </p>

      <div className="box-grid" style={{ gridTemplateColumns: `repeat(${boardColumns(board.length)}, minmax(0, 1fr))` }}>
        {board.map((box, i) => (
          <button
            key={box.id}
            type="button"
            className={`box ${box.opened ? 'box-opened' : ''}`}
            style={box.opened ? undefined : { background: BOX_COLORS[i % BOX_COLORS.length] }}
            onClick={() => openBox(box)}
            disabled={box.opened}
            aria-label={box.opened ? `Kutu ${box.id}, açıldı: ${boxSummary(box)}` : `Kutu ${box.id}`}
          >
            {box.opened ? (
              <>
                <span className="box-check" aria-hidden="true">
                  ✓ {box.id}
                </span>
                <span className="box-text">{boxSummary(box)}</span>
              </>
            ) : (
              <span className="box-number">{box.id}</span>
            )}
          </button>
        ))}
      </div>

      {allOpened && (
        <>
          <Confetti />
          <button type="button" className="btn btn-spin" onClick={start}>
            Yeni tahta kur
          </button>
        </>
      )}

      {openBoxData && (
        <BoxReveal
          key={openBoxData.id}
          box={openBoxData}
          person={current?.name ?? null}
          settings={settings}
          onDone={finishBox}
          onPass={passBox}
        />
      )}
    </section>
  )
}
