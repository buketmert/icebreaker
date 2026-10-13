import type { GameId } from '../types'
import { GAMES } from '../games/catalog'

interface GameMenuProps {
  questionCount: number
  participantCount: number
  onSelect: (game: GameId) => void
}

export function GameMenu({ questionCount, participantCount, onSelect }: GameMenuProps) {
  const status: Record<GameId, { text: string; warn?: boolean }> = {
    wheel: { text: `${questionCount} soru · ${participantCount} kişi hazır` },
    boxes:
      questionCount > 0
        ? { text: `${questionCount} soru hazır` }
        : { text: 'Önce bir soru destesi seçin', warn: true },
    twoTruths:
      participantCount >= 2
        ? { text: `${participantCount} katılımcı hazır` }
        : { text: 'En az 2 katılımcı gerekli', warn: true },
  }

  return (
    <section className="stage game-menu" aria-labelledby="menu-title">
      <div className="menu-head">
        <h2 id="menu-title">Bugün ne oynuyoruz?</h2>
        <p className="muted">
          Toplantının başında birkaç dakikalık bir buz kırıcı seçin. Sorular ve katılımcı listesi tüm oyunlarda ortak
          kullanılır.
        </p>
      </div>
      <div className="game-cards">
        {GAMES.map((g) => (
          <button key={g.id} type="button" className="game-card" onClick={() => onSelect(g.id)}>
            <span className="game-emoji" aria-hidden="true">
              {g.emoji}
            </span>
            <span className="game-name">{g.name}</span>
            <span className="game-desc">{g.description}</span>
            <span className="game-meta">
              {g.meta.map((m) => (
                <span key={m} className="chip">
                  {m}
                </span>
              ))}
            </span>
            <span className={`game-status ${status[g.id].warn ? 'warn' : ''}`}>{status[g.id].text}</span>
            <span className="game-cta" aria-hidden="true">
              Oyna →
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
