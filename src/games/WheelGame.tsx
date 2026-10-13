import { useCallback, useEffect, useRef, useState } from 'react'
import type { NewHistoryEntry, Settings, WheelItem, WheelMode } from '../types'
import { playWin, unlockAudio } from '../lib/sound'
import { Wheel, type WheelHandle } from '../components/Wheel'
import { ResultModal } from '../components/ResultModal'
import { isTypingTarget } from '../lib/dom'

interface WheelGameProps {
  mode: WheelMode
  onModeChange: (mode: WheelMode) => void
  questionItems: WheelItem[]
  peopleItems: WheelItem[]
  /** Etkin destelerde hiç soru var mı (boş çark mesajı için) */
  hasQuestions: boolean
  removedQuestionCount: number
  participantCount: number
  settings: Settings
  onLog: (entry: NewHistoryEntry) => void
  onRemove: (mode: WheelMode, refId: string) => void
}

export function WheelGame({
  mode,
  onModeChange,
  questionItems,
  peopleItems,
  hasQuestions,
  removedQuestionCount,
  participantCount,
  settings,
  onLog,
  onRemove,
}: WheelGameProps) {
  const [result, setResult] = useState<{ item: WheelItem; mode: WheelMode; key: number } | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [pendingSpin, setPendingSpin] = useState(false)
  const wheelRef = useRef<WheelHandle>(null)

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
      onLog({ mode, label: item.label, deckName: item.deckName })
      setResult({ item, mode, key: Date.now() })
    },
    [mode, settings.soundOn, onLog],
  )

  const closeResult = (remove: boolean) => {
    if (remove && result) onRemove(result.mode, result.item.refId)
    setResult(null)
  }

  // "Tekrar çevir": sonuç kapanıp çark güncel listeyle yeniden çizildikten sonra çevir.
  useEffect(() => {
    if (pendingSpin && !result) {
      setPendingSpin(false)
      spin()
    }
  }, [pendingSpin, result, spin])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (result || isTypingTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.code === 'Space') {
        e.preventDefault()
        spin()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [result, spin])

  const emptyText =
    mode === 'questions'
      ? hasQuestions && removedQuestionCount > 0
        ? { title: 'Tüm sorular soruldu 🎉', hint: 'Sorular panelinden çıkanları geri getirebilirsiniz.' }
        : { title: 'Çarkta soru yok', hint: 'Sorular panelinden bir deste seçin ya da soru ekleyin.' }
      : participantCount > 0
        ? { title: 'Herkes konuştu 🎉', hint: 'Katılımcılar panelinden herkesi geri getirebilirsiniz.' }
        : { title: 'Çarkta kimse yok', hint: 'Katılımcılar panelinden isim ekleyin.' }

  return (
    <section className="stage" aria-label="Çarkıfelek">
      <div className="mode-tabs" role="tablist" aria-label="Çark türü">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'questions'}
          className={mode === 'questions' ? 'active' : ''}
          disabled={spinning}
          onClick={() => onModeChange('questions')}
        >
          ❓ Soru çarkı <span className="count">{questionItems.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'people'}
          className={mode === 'people' ? 'active' : ''}
          disabled={spinning}
          onClick={() => onModeChange('people')}
        >
          🎤 Kişi çarkı <span className="count">{peopleItems.length}</span>
        </button>
      </div>

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
    </section>
  )
}
