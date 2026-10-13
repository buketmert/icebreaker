import type { GameId } from '../types'

export interface GameInfo {
  id: GameId
  emoji: string
  name: string
  description: string
  meta: string[]
}

export const GAMES: GameInfo[] = [
  {
    id: 'wheel',
    emoji: '🎡',
    name: 'Çarkıfelek',
    description: 'Çarkı çevirin; rastgele bir soru ya da söz sırası çıksın. Retro ve tanışma desteleriyle.',
    meta: ['⏱ 2–10 dk', '👥 Her boyut', '🗂 Soru desteleri'],
  },
  {
    id: 'boxes',
    emoji: '🎁',
    name: 'Gizemli Kutular',
    description:
      'Sırası gelen kişi bir kutu numarası seçer; içinden soru ya da sürpriz joker çıkar. Seçim hakkı, çekingen katılımcıları rahatlatır.',
    meta: ['⏱ 5–10 dk', '👥 3–12 kişi', '🗂 Soru desteleri'],
  },
  {
    id: 'twoTruths',
    emoji: '🤥',
    name: 'İki Doğru Bir Yalan',
    description:
      'Anlatıcı kendisiyle ilgili üç şey söyler; biri yalandır. Ekip el kaldırarak tahmin eder, anlatıcı açıklar.',
    meta: ['⏱ 10–15 dk', '👥 3–10 kişi', '🙋 Katılımcı listesi'],
  },
]

export const GAME_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g])) as Record<GameId, GameInfo>
