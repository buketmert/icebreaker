import type { WheelItem } from '../types'
import { shuffle } from '../lib/random'

export type JokerKind = 'delegate' | 'everyone'

export interface Box {
  /** Ekranda yazan numara (1'den başlar) */
  id: number
  kind: 'question' | JokerKind
  item?: WheelItem
  /** "Herkes cevaplasın" jokerinin sorusu */
  prompt?: string
  opened: boolean
}

export const JOKERS: Record<JokerKind, { emoji: string; title: string; text: string }> = {
  delegate: {
    emoji: '🎯',
    title: 'Devret!',
    text: 'Bu kez soran sensin: takımdan birini seç ve ona merak ettiğin bir soruyu sor.',
  },
  everyone: {
    emoji: '👥',
    title: 'Herkes cevaplasın',
    text: 'Bu soruyu sırayla herkes tek kelimeyle cevaplasın:',
  },
}

const EVERYONE_PROMPTS = [
  'Bu haftanı tek kelimeyle anlat.',
  'Şu anki enerjin 1 ile 5 arasında kaç?',
  'Bugün seni gülümseten tek bir şey?',
  'Bu sprint bir hava durumu olsaydı ne olurdu?',
  'Şu an canın en çok ne yemek istiyor?',
  'Bu toplantıdan tek kelimelik beklentin ne?',
]

export const BOARD_SIZES = [6, 9, 12, 16] as const

export function jokerCount(size: number, withJokers: boolean): number {
  return withJokers ? Math.max(1, Math.floor(size / 6)) : 0
}

/**
 * Kutu tahtasını hazırlar. Sorular tekrarsızdır; yeterli soru yoksa tahta küçülür.
 * Jokerler (varsa) sorular arasına rastgele dağıtılır.
 */
export function buildBoard(items: WheelItem[], size: number, withJokers: boolean): Box[] {
  const jokers = jokerCount(size, withJokers)
  const questions = shuffle(items).slice(0, Math.max(0, size - jokers))
  const prompts = shuffle(EVERYONE_PROMPTS)

  const boxes: Omit<Box, 'id'>[] = [
    ...questions.map((item) => ({ kind: 'question' as const, item, opened: false })),
    ...Array.from({ length: jokers }, (_, i) => {
      const kind: JokerKind = i % 2 === 0 ? 'everyone' : 'delegate'
      return { kind, prompt: kind === 'everyone' ? prompts[i % prompts.length] : undefined, opened: false }
    }),
  ]

  return shuffle(boxes).map((box, i) => ({ ...box, id: i + 1 }))
}

/** Tahta için sütun sayısı: kutular olabildiğince kare bir ızgaraya yerleşir. */
export function boardColumns(count: number): number {
  if (count <= 4) return 2
  if (count <= 9) return 3
  return 4
}
