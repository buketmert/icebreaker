import { useState } from 'react'
import type { NewHistoryEntry, Participant, Settings } from '../types'
import { useTurns } from '../hooks/useTurns'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { Countdown } from '../components/Countdown'
import { Confetti } from '../components/Confetti'
import { playFooled, playWin, unlockAudio } from '../lib/sound'

interface TwoTruthsGameProps {
  participants: Participant[]
  settings: Settings
  onLog: (entry: NewHistoryEntry) => void
  onOpenPanel: (panel: 'people') => void
}

type Phase = 'setup' | 'think' | 'tell' | 'guess' | 'reveal' | 'result'

interface TwoTruthsConfig {
  thinkSeconds: number
  tellSeconds: number
}

const THINK_OPTIONS = [
  { value: 0, label: 'Yok' },
  { value: 30, label: '30 sn' },
  { value: 60, label: '1 dk' },
]

const TELL_OPTIONS = [
  { value: 60, label: '1 dk' },
  { value: 90, label: '1,5 dk' },
  { value: 120, label: '2 dk' },
]

const STEPS: { phase: Phase; label: string }[] = [
  { phase: 'think', label: 'Düşün' },
  { phase: 'tell', label: 'Anlat' },
  { phase: 'guess', label: 'Tahmin' },
  { phase: 'reveal', label: 'Açıkla' },
]

const IDEAS = ['gittiğin bir yer', 'gizli bir yetenek', 'ilk işin', 'tuhaf bir alışkanlık', 'bir rekor', 'tanıştığın biri']

function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: number; label: string }[]
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            className={value === o.value ? 'active' : ''}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function TwoTruthsGame({ participants, settings, onLog, onOpenPanel }: TwoTruthsGameProps) {
  const [config, setConfig] = useLocalStorage<TwoTruthsConfig>('twotruths-config', () => ({
    thinkSeconds: 30,
    tellSeconds: 90,
  }))
  const [phase, setPhase] = useState<Phase>('setup')
  const [notes, setNotes] = useState(['', '', ''])
  const [guess, setGuess] = useState<number | null>(null)
  const [lie, setLie] = useState<number | null>(null)
  const [score, setScore] = useState({ team: 0, tellers: 0 })
  // Aynı kişi art arda anlatırsa sayaçların sıfırlanması için tur sayacı.
  const [round, setRound] = useState(0)
  const turns = useTurns(participants)
  const { current, progress } = turns
  const enough = participants.length >= 2

  const beginRound = () => {
    setNotes(['', '', ''])
    setGuess(null)
    setLie(null)
    setRound((r) => r + 1)
    setPhase(config.thinkSeconds > 0 ? 'think' : 'tell')
  }

  const start = () => {
    unlockAudio()
    setScore({ team: 0, tellers: 0 })
    turns.restart()
    beginRound()
  }

  const pass = () => {
    turns.passAndNext()
    beginRound()
  }

  const chooseLie = (index: number) => {
    const caught = index === guess
    setLie(index)
    setPhase('result')
    setScore((s) => (caught ? { ...s, team: s.team + 1 } : { ...s, tellers: s.tellers + 1 }))
    if (settings.soundOn) (caught ? playWin : playFooled)()
    onLog({
      mode: 'twoTruths',
      label: caught ? 'Ekip yalanı yakaladı 🎯' : 'Ekibi kandırdı 🎭',
      person: current?.name,
    })
  }

  const nextRound = () => {
    turns.completeAndNext()
    beginRound()
  }

  if (phase === 'setup') {
    const perPerson = config.thinkSeconds + config.tellSeconds + 45
    const minutes = Math.max(1, Math.round((participants.length * perPerson) / 60))
    return (
      <section className="stage game-stage" aria-label="İki Doğru Bir Yalan">
        <div className="game-setup">
          <div className="setup-hero">
            <span className="setup-emoji" aria-hidden="true">
              🤥
            </span>
            <h2>İki Doğru Bir Yalan</h2>
            <p>Takım arkadaşlarınızı ne kadar iyi tanıyorsunuz? Yalanı yakalayın!</p>
          </div>

          <ol className="rules">
            <li>
              Anlatıcı kendisiyle ilgili <strong>üç şey</strong> söyler: ikisi doğru, biri yalan.
            </li>
            <li>Ekip el kaldırarak oylar; kolaylaştırıcı çoğunluğun tahminini işaretler.</li>
            <li>Anlatıcı yalanı açıklar. Ekip bildiyse ekip, bilemediyse anlatıcılar puan alır.</li>
            <li>Herkes bir kez anlatınca oyun biter. Pas geçmek serbest.</li>
          </ol>

          <Segmented
            label="Düşünme süresi"
            options={THINK_OPTIONS}
            value={config.thinkSeconds}
            onChange={(thinkSeconds) => setConfig({ ...config, thinkSeconds })}
          />
          <Segmented
            label="Anlatma süresi"
            options={TELL_OPTIONS}
            value={config.tellSeconds}
            onChange={(tellSeconds) => setConfig({ ...config, tellSeconds })}
          />

          <p className="muted">
            {enough ? (
              <>
                <strong>{participants.length}</strong> katılımcı · tahmini süre ≈ <strong>{minutes} dk</strong>
                {participants.length > 10 && ' — büyük gruplarda birkaç anlatıcıyla yetinmek iyi olur'}
              </>
            ) : (
              'Bu oyun için en az 2 katılımcı gerekli.'
            )}
          </p>

          <div className="setup-actions">
            {enough ? (
              <button type="button" className="btn btn-spin" onClick={start}>
                Oyunu başlat
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => onOpenPanel('people')}>
                Katılımcı ekle
              </button>
            )}
          </div>
        </div>
      </section>
    )
  }

  const caught = lie != null && lie === guess
  const name = current?.name ?? 'Anlatıcı'
  const finished = progress.over && !current
  const willFinish = progress.total - progress.done <= 1

  const card = (i: number, onClick?: () => void) => {
    const isLie = phase === 'result' && lie === i
    const isTruth = phase === 'result' && lie !== i
    const content = (
      <>
        <span className="tt-num">{i + 1}</span>
        <span className="tt-note">{notes[i] || `${i + 1}. ifade`}</span>
        {guess === i && phase !== 'guess' && <span className="tt-tag">Ekibin tahmini</span>}
        {isLie && <span className="tt-verdict tt-lie">YALAN</span>}
        {isTruth && <span className="tt-verdict tt-truth">DOĞRU</span>}
      </>
    )
    const cls = `tt-card ${isLie ? 'is-lie' : ''} ${isTruth ? 'is-truth' : ''}`
    return onClick ? (
      <button key={i} type="button" className={`${cls} tt-card-pick`} onClick={onClick}>
        {content}
      </button>
    ) : (
      <div key={i} className={cls}>
        {content}
      </div>
    )
  }

  return (
    <section className="stage game-stage" aria-label="İki Doğru Bir Yalan">
      <div className="game-bar">
        <span className="chip">
          Anlatan <strong>{progress.done}</strong>/{progress.total}
        </span>
        <span className="scoreboard" aria-label={`Skor: Ekip ${score.team}, Anlatıcılar ${score.tellers}`}>
          🧠 Ekip <strong>{score.team}</strong>
          <span className="vs">–</span>
          <strong>{score.tellers}</strong> Anlatıcılar 🎭
        </span>
        <span className="game-bar-spacer" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPhase('setup')}>
          Oyunu bitir
        </button>
      </div>

      {finished ? (
        <div className="tt-stage">
          <Confetti />
          <p className="tt-kicker">Oyun bitti</p>
          <h2 className="tt-title">Herkes anlattı! 🎉</h2>
          <p className="scoreboard scoreboard-big">
            🧠 Ekip <strong>{score.team}</strong>
            <span className="vs">–</span>
            <strong>{score.tellers}</strong> Anlatıcılar 🎭
          </p>
          <p className="tt-instruction">
            {score.team > score.tellers
              ? 'Bu ekibi kandırmak zor! 🕵️'
              : score.team < score.tellers
                ? 'Ne yetenekli yalancılar! 🎭'
                : 'Berabere! 🤝'}
          </p>
          <div className="setup-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setPhase('setup')}>
              Ayarlar
            </button>
            <button type="button" className="btn btn-spin" onClick={start}>
              Yeni oyun
            </button>
          </div>
        </div>
      ) : !current ? (
        <div className="tt-stage">
          <p className="tt-instruction">Sıradaki anlatıcıyı seçin.</p>
          <button type="button" className="btn btn-spin" onClick={turns.next}>
            Anlatıcı seç
          </button>
        </div>
      ) : (
        <div className="tt-stage">
          <ol className="steps" aria-label="Tur adımları">
            {STEPS.map((s, i) => {
              const activeIndex = STEPS.findIndex((x) => x.phase === (phase === 'result' ? 'reveal' : phase))
              return (
                <li key={s.phase} className={i === activeIndex ? 'active' : i < activeIndex ? 'done' : ''}>
                  {s.label}
                </li>
              )
            })}
          </ol>

          {phase === 'think' && (
            <>
              <p className="tt-kicker">Düşünme zamanı</p>
              <h2 className="tt-title">🎤 {name}</h2>
              <p className="tt-instruction">
                Kendinle ilgili <strong>iki doğru</strong> ve <strong>bir yalan</strong> düşün. Yalan inandırıcı, doğrular
                şaşırtıcı olsun!
              </p>
              <p className="muted">Fikir: {IDEAS.join(' · ')}</p>
              <Countdown key={`think-${round}`} seconds={config.thinkSeconds} soundOn={settings.soundOn} autoStart />
              <div className="setup-actions">
                <button type="button" className="btn btn-ghost" onClick={pass}>
                  Pas geç
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setPhase('tell')}>
                  Hazırım →
                </button>
              </div>
            </>
          )}

          {phase === 'tell' && (
            <>
              <p className="tt-kicker">Anlatma zamanı</p>
              <h2 className="tt-title">🎤 {name} üç şey anlatıyor</h2>
              <div className="tt-cards">
                {[0, 1, 2].map((i) => (
                  <label key={i} className="tt-card">
                    <span className="tt-num">{i + 1}</span>
                    <input
                      className="input input-flat"
                      placeholder="Kısa not (isteğe bağlı)"
                      maxLength={80}
                      value={notes[i]}
                      onChange={(e) => setNotes(notes.map((n, j) => (j === i ? e.target.value : n)))}
                    />
                  </label>
                ))}
              </div>
              <Countdown key={`tell-${round}`} seconds={config.tellSeconds} soundOn={settings.soundOn} autoStart />
              <div className="setup-actions">
                {config.thinkSeconds === 0 && (
                  <button type="button" className="btn btn-ghost" onClick={pass}>
                    Pas geç
                  </button>
                )}
                <button type="button" className="btn btn-primary" onClick={() => setPhase('guess')}>
                  Tahmin zamanı →
                </button>
              </div>
            </>
          )}

          {phase === 'guess' && (
            <>
              <p className="tt-kicker">Tahmin zamanı</p>
              <h2 className="tt-title">Sizce hangisi yalan?</h2>
              <p className="tt-instruction">El kaldırarak oylayın, çoğunluğun seçtiği kartı işaretleyin.</p>
              <div className="tt-cards">
                {[0, 1, 2].map((i) =>
                  card(i, () => {
                    setGuess(i)
                    setPhase('reveal')
                  }),
                )}
              </div>
            </>
          )}

          {phase === 'reveal' && (
            <>
              <p className="tt-kicker">Açıklama zamanı</p>
              <h2 className="tt-title">{name}, yalan hangisiydi?</h2>
              <p className="tt-instruction">Ekibin tahmini: {guess! + 1} numara. Gerçek yalanı işaretleyin.</p>
              <div className="tt-cards">{[0, 1, 2].map((i) => card(i, () => chooseLie(i)))}</div>
              <div className="setup-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPhase('guess')}>
                  ← Tahmini değiştir
                </button>
              </div>
            </>
          )}

          {phase === 'result' && (
            <>
              {caught && <Confetti />}
              <p className={`tt-banner ${caught ? 'tt-banner-win' : 'tt-banner-lose'}`} role="status">
                {caught ? '🎯 Ekip yalanı yakaladı!' : `🎭 ${name} herkesi kandırdı!`}
              </p>
              <div className="tt-cards">{[0, 1, 2].map((i) => card(i))}</div>
              <div className="setup-actions">
                <button type="button" className="btn btn-spin" onClick={nextRound}>
                  {willFinish ? 'Sonuçları gör →' : 'Sıradaki anlatıcı →'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}
