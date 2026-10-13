import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Deck, HistoryEntry, Participant, Settings, WheelItem, WheelMode } from './types'
import { createDefaultDecks } from './data/defaultDecks'
import { useLocalStorage } from './hooks/useLocalStorage'
import { uid } from './lib/random'
import { playWin, unlockAudio } from './lib/sound'
import { Wheel, type WheelHandle } from './components/Wheel'
import { ResultModal } from './components/ResultModal'
import { DecksPanel } from './components/DecksPanel'
import { ParticipantsPanel } from './components/ParticipantsPanel'
import { HistoryPanel } from './components/HistoryPanel'
import { SettingsPanel } from './components/SettingsPanel'

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

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)
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

  const [result, setResult] = useState<{ item: WheelItem; mode: WheelMode; key: string } | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [pendingSpin, setPendingSpin] = useState(false)
  const [presenting, setPresenting] = useState(false)
  const wheelRef = useRef<WheelHandle>(null)

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

  const items = mode === 'questions' ? questionItems : peopleItems

  const spin = useCallback(() => {
    if (result) return
    unlockAudio()
    wheelRef.current?.spin()
  }, [result])

  const handleResult = useCallback(
    (item: WheelItem) => {
      setSpinning(false)
      if (settings.soundOn) playWin()
      const entry: HistoryEntry = { id: uid(), mode, label: item.label, deckName: item.deckName, at: Date.now() }
      setHistory((h) => [entry, ...h].slice(0, MAX_HISTORY))
      setResult({ item, mode, key: entry.id })
    },
    [mode, settings.soundOn, setHistory],
  )

  const closeResult = (remove: boolean) => {
    if (remove && result) {
      const add = (list: string[]) => (list.includes(result.item.refId) ? list : [...list, result.item.refId])
      if (result.mode === 'questions') setRemovedQuestions(add)
      else setRemovedPeople(add)
    }
    setResult(null)
  }

  // "Tekrar çevir": sonuç kapanıp çark güncel listeyle yeniden çizildikten sonra çevir.
  useEffect(() => {
    if (pendingSpin && !result) {
      setPendingSpin(false)
      spin()
    }
  }, [pendingSpin, result, spin])

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
      if (result || isTypingTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.code === 'Space') {
        e.preventDefault()
        spin()
      } else if (e.key === 'f' || e.key === 'F') {
        togglePresenting()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [result, spin, togglePresenting])

  const switchMode = (next: WheelMode) => {
    setMode(next)
    // Çarkla ilgili paneli öne getir.
    if (next === 'people' && panel === 'decks') setPanel('people')
    if (next === 'questions' && panel === 'people') setPanel('decks')
  }

  const emptyText =
    mode === 'questions'
      ? decks.some((d) => d.enabled && d.questions.length) && removedQuestionCount > 0
        ? { title: 'Tüm sorular soruldu 🎉', hint: 'Sorular panelinden çıkanları geri getirebilirsiniz.' }
        : { title: 'Çarkta soru yok', hint: 'Sorular panelinden bir deste seçin ya da soru ekleyin.' }
      : participants.length > 0
        ? { title: 'Herkes konuştu 🎉', hint: 'Katılımcılar panelinden herkesi geri getirebilirsiniz.' }
        : { title: 'Çarkta kimse yok', hint: 'Katılımcılar panelinden isim ekleyin.' }

  return (
    <div className={`app ${presenting ? 'presenting' : ''}`}>
      <header className="topbar">
        <div className="brand">
          <Logo />
          <div>
            <h1>Buzkıran</h1>
            <p>Toplantılar için buz kırıcı çark</p>
          </div>
        </div>

        <div className="mode-tabs" role="tablist" aria-label="Çark türü">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'questions'}
            className={mode === 'questions' ? 'active' : ''}
            disabled={spinning}
            onClick={() => switchMode('questions')}
          >
            ❓ Soru çarkı <span className="count">{questionItems.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'people'}
            className={mode === 'people' ? 'active' : ''}
            disabled={spinning}
            onClick={() => switchMode('people')}
          >
            🎤 Kişi çarkı <span className="count">{peopleItems.length}</span>
          </button>
        </div>

        <button type="button" className="btn btn-ghost" onClick={togglePresenting}>
          {presenting ? 'Sunumdan çık' : 'Sunum modu'}
        </button>
      </header>

      <main className="layout">
        <section className="stage" aria-label="Çark">
          <Wheel
            ref={wheelRef}
            items={items}
            spinSeconds={settings.spinSeconds}
            soundOn={settings.soundOn}
            emptyTitle={emptyText.title}
            emptyHint={emptyText.hint}
            onSpinStart={() => setSpinning(true)}
            onResult={handleResult}
          />
          <button type="button" className="btn btn-spin" onClick={spin} disabled={spinning || items.length === 0}>
            {spinning ? 'Dönüyor…' : 'Çarkı çevir'}
          </button>
          <p className="stage-hint">
            <kbd>Boşluk</kbd> ile çevir · <kbd>F</kbd> ile sunum modu
          </p>
        </section>

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

      {result && (
        <ResultModal
          key={result.key}
          item={result.item}
          mode={result.mode}
          answerSeconds={settings.answerSeconds}
          soundOn={settings.soundOn}
          removeAfterPick={settings.removeAfterPick}
          onClose={closeResult}
          onSpinAgain={(remove) => {
            closeResult(remove)
            setPendingSpin(true)
          }}
        />
      )}
    </div>
  )
}
