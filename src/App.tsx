import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Deck, GameId, HistoryEntry, NewHistoryEntry, Participant, Settings, WheelItem, WheelMode } from './types'
import { createDefaultDecks } from './data/defaultDecks'
import { useLocalStorage } from './hooks/useLocalStorage'
import { uid } from './lib/random'
import { isTypingTarget } from './lib/dom'
import { GameMenu } from './components/GameMenu'
import { DecksPanel } from './components/DecksPanel'
import { ParticipantsPanel } from './components/ParticipantsPanel'
import { HistoryPanel } from './components/HistoryPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { WheelGame } from './games/WheelGame'
import { BoxesGame } from './games/BoxesGame'
import { TwoTruthsGame } from './games/TwoTruthsGame'
import { GAME_BY_ID } from './games/catalog'

type PanelId = 'decks' | 'people' | 'history' | 'settings'

const DEFAULT_SETTINGS: Settings = {
  spinSeconds: 5,
  removeAfterPick: false,
  soundOn: true,
  answerSeconds: 60,
}

const PANELS: { id: PanelId; label: string }[] = [
  { id: 'decks', label: 'Sorular' },
  { id: 'people', label: 'Katılımcılar' },
  { id: 'history', label: 'Geçmiş' },
  { id: 'settings', label: 'Ayarlar' },
]

const MAX_HISTORY = 300

function Logo() {
  return (
    <svg viewBox="0 0 64 64" className="logo" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <path d="M32 32 L32 2 A30 30 0 0 1 58 17 Z" fill="#ef476f" />
      <path d="M32 32 L58 17 A30 30 0 0 1 58 47 Z" fill="#ffd166" />
      <path d="M32 32 L58 47 A30 30 0 0 1 32 62 Z" fill="#06a77d" />
      <path d="M32 32 L32 62 A30 30 0 0 1 6 47 Z" fill="#118ab2" />
      <path d="M32 32 L6 47 A30 30 0 0 1 6 17 Z" fill="#6a4c93" />
      <path d="M32 32 L6 17 A30 30 0 0 1 32 2 Z" fill="#f78c35" />
      <circle cx="32" cy="32" r="7" fill="#fff" stroke="currentColor" strokeWidth="3" />
    </svg>
  )
}

export default function App() {
  const [decks, setDecks] = useLocalStorage<Deck[]>('decks', createDefaultDecks)
  const [participants, setParticipants] = useLocalStorage<Participant[]>('participants', () => [])
  const [storedSettings, setSettings] = useLocalStorage<Settings>('settings', () => DEFAULT_SETTINGS)
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>('history', () => [])
  const [removedQuestions, setRemovedQuestions] = useLocalStorage<string[]>('removed-questions', () => [])
  const [removedPeople, setRemovedPeople] = useLocalStorage<string[]>('removed-people', () => [])
  const [mode, setMode] = useLocalStorage<WheelMode>('mode', () => 'questions')
  const [panel, setPanel] = useLocalStorage<PanelId>('panel', () => 'decks')
  const [game, setGame] = useLocalStorage<GameId | null>('game', () => null)
  const [presenting, setPresenting] = useState(false)

  // Eski sürümden kalan ayarlarda eksik alan varsa varsayılanla tamamla.
  const settings = useMemo(() => ({ ...DEFAULT_SETTINGS, ...storedSettings }), [storedSettings])

  const questionItems = useMemo<WheelItem[]>(() => {
    const removed = new Set(removedQuestions)
    return decks
      .filter((d) => d.enabled)
      .flatMap((d) =>
        d.questions
          .filter((q) => q.text.trim() && !removed.has(q.id))
          .map((q) => ({ refId: q.id, label: q.text.trim(), deckName: d.name })),
      )
  }, [decks, removedQuestions])

  const peopleItems = useMemo<WheelItem[]>(() => {
    const removed = new Set(removedPeople)
    return participants.filter((p) => !removed.has(p.id)).map((p) => ({ refId: p.id, label: p.name }))
  }, [participants, removedPeople])

  const removedQuestionCount = useMemo(() => {
    const ids = new Set(decks.flatMap((d) => d.questions.map((q) => q.id)))
    return removedQuestions.filter((id) => ids.has(id)).length
  }, [decks, removedQuestions])

  const log = useCallback(
    (entry: NewHistoryEntry) => {
      const full: HistoryEntry = { ...entry, id: uid(), at: Date.now() }
      setHistory((h) => [full, ...h].slice(0, MAX_HISTORY))
    },
    [setHistory],
  )

  const removeFromWheel = useCallback(
    (wheel: WheelMode, refId: string) => {
      const add = (list: string[]) => (list.includes(refId) ? list : [...list, refId])
      if (wheel === 'questions') setRemovedQuestions(add)
      else setRemovedPeople(add)
    },
    [setRemovedQuestions, setRemovedPeople],
  )

  /** Bir oyun eksik veri istediğinde ilgili paneli açar (mobilde panele kaydırır). */
  const openPanel = useCallback(
    (id: PanelId) => {
      setPanel(id)
      requestAnimationFrame(() => document.querySelector('.side')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
    },
    [setPanel],
  )

  const togglePresenting = useCallback(() => {
    if (!presenting) {
      setPresenting(true)
      document.documentElement.requestFullscreen?.().catch(() => {})
    } else {
      setPresenting(false)
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }, [presenting])

  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement) setPresenting(false)
    }
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) return
      if (document.querySelector('[role="dialog"]')) return
      if (e.key === 'f' || e.key === 'F') togglePresenting()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePresenting])

  const switchMode = (next: WheelMode) => {
    setMode(next)
    // Çarkla ilgili paneli öne getir.
    if (next === 'people' && panel === 'decks') setPanel('people')
    if (next === 'questions' && panel === 'people') setPanel('decks')
  }

  const selectGame = (next: GameId) => {
    setGame(next)
    if (next === 'twoTruths' && panel === 'decks') setPanel('people')
  }

  const currentGame = game ? GAME_BY_ID[game] : null

  return (
    <div className={`app ${presenting ? 'presenting' : ''}`}>
      <header className="topbar">
        <div className="brand">
          <button type="button" className="brand-home" onClick={() => setGame(null)} aria-label="Oyun menüsü">
            <Logo />
          </button>
          <div>
            <h1>Buzkıran</h1>
            <p>Toplantılar için buz kırıcı oyunlar</p>
          </div>
        </div>

        {currentGame && (
          <nav className="crumbs" aria-label="Konum">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setGame(null)}>
              ← Oyunlar
            </button>
            <span className="crumb-title">
              {currentGame.emoji} {currentGame.name}
            </span>
          </nav>
        )}

        <span className="topbar-spacer" />
        <button type="button" className="btn btn-ghost" onClick={togglePresenting}>
          {presenting ? 'Sunumdan çık' : 'Sunum modu'}
        </button>
      </header>

      <main className="layout">
        {game === null && (
          <GameMenu questionCount={questionItems.length} participantCount={participants.length} onSelect={selectGame} />
        )}
        {game === 'wheel' && (
          <WheelGame
            mode={mode}
            onModeChange={switchMode}
            questionItems={questionItems}
            peopleItems={peopleItems}
            hasQuestions={decks.some((d) => d.enabled && d.questions.length > 0)}
            removedQuestionCount={removedQuestionCount}
            participantCount={participants.length}
            settings={settings}
            onLog={log}
            onRemove={removeFromWheel}
          />
        )}
        {game === 'boxes' && (
          <BoxesGame
            questionItems={questionItems}
            participants={participants}
            settings={settings}
            onLog={log}
            onOpenPanel={openPanel}
          />
        )}
        {game === 'twoTruths' && (
          <TwoTruthsGame participants={participants} settings={settings} onLog={log} onOpenPanel={openPanel} />
        )}

        <aside className="side">
          <div className="side-tabs" role="tablist" aria-label="Paneller">
            {PANELS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={panel === p.id}
                className={panel === p.id ? 'active' : ''}
                onClick={() => setPanel(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {panel === 'decks' && (
            <DecksPanel
              decks={decks}
              onChange={setDecks}
              activeCount={questionItems.length}
              removedCount={removedQuestionCount}
              onRestoreRemoved={() => setRemovedQuestions([])}
            />
          )}
          {panel === 'people' && (
            <ParticipantsPanel
              participants={participants}
              onChange={setParticipants}
              removedIds={removedPeople}
              onToggleRemoved={(id) =>
                setRemovedPeople((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))
              }
              onRestoreRemoved={() => setRemovedPeople([])}
            />
          )}
          {panel === 'history' && <HistoryPanel history={history} onClear={() => setHistory([])} />}
          {panel === 'settings' && (
            <SettingsPanel
              settings={settings}
              onChange={setSettings}
              decks={decks}
              participants={participants}
              onImport={(data, how) => {
                if (how === 'replace') {
                  setDecks(data.decks)
                  setParticipants(data.participants)
                  setRemovedQuestions([])
                  setRemovedPeople([])
                } else {
                  setDecks((d) => [...d, ...data.decks])
                  setParticipants((ps) => {
                    const names = new Set(ps.map((p) => p.name.toLocaleLowerCase('tr')))
                    return [...ps, ...data.participants.filter((p) => !names.has(p.name.toLocaleLowerCase('tr')))]
                  })
                }
              }}
              onResetAll={() => {
                setDecks(createDefaultDecks())
                setParticipants([])
                setSettings(DEFAULT_SETTINGS)
                setHistory([])
                setRemovedQuestions([])
                setRemovedPeople([])
              }}
            />
          )}
        </aside>
      </main>
    </div>
  )
}
