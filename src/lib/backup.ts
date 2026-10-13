import type { Deck, Participant } from '../types'
import { uid } from './random'

/*
 * Desteleri ve katılımcıları JSON dosyası olarak dışa/içe aktarma.
 * Takımlar soru setlerini bu dosya ile birbirleriyle paylaşabilir.
 */

export interface Backup {
  app: 'buzkiran'
  version: 1
  exportedAt: string
  decks: Deck[]
  participants: Participant[]
}

export function createBackup(decks: Deck[], participants: Participant[]): Backup {
  return { app: 'buzkiran', version: 1, exportedAt: new Date().toISOString(), decks, participants }
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback)

/**
 * Dışarıdan gelen JSON'u doğrular ve temizler. Geçersizse anlaşılır bir hata fırlatır.
 * Yalnızca soru listesi içeren basit bir dizi (["Soru 1", "Soru 2"]) de kabul edilir.
 */
export function parseBackup(raw: string): { decks: Deck[]; participants: Participant[] } {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error('Dosya geçerli bir JSON değil.')
  }

  if (Array.isArray(data) && data.every((x) => typeof x === 'string')) {
    const questions = data.map((text) => ({ id: uid(), text: text.trim() })).filter((q) => q.text)
    return { decks: [{ id: uid(), name: 'İçe aktarılan', emoji: '📥', enabled: true, questions }], participants: [] }
  }

  if (!data || typeof data !== 'object' || !Array.isArray((data as Backup).decks)) {
    throw new Error('Dosyada deste listesi bulunamadı.')
  }

  const src = data as { decks: unknown[]; participants?: unknown[] }
  const decks: Deck[] = src.decks.flatMap((d) => {
    if (!d || typeof d !== 'object') return []
    const deck = d as Record<string, unknown>
    const questions = Array.isArray(deck.questions)
      ? deck.questions.flatMap((q) => {
          const text = typeof q === 'string' ? q : str((q as Record<string, unknown>)?.text)
          return text.trim() ? [{ id: uid(), text: text.trim() }] : []
        })
      : []
    return [
      {
        id: uid(),
        name: str(deck.name, 'Adsız deste'),
        emoji: str(deck.emoji, '📋'),
        enabled: deck.enabled !== false,
        questions,
      },
    ]
  })

  const participants: Participant[] = Array.isArray(src.participants)
    ? src.participants.flatMap((p) => {
        const name = typeof p === 'string' ? p : str((p as Record<string, unknown>)?.name)
        return name.trim() ? [{ id: uid(), name: name.trim() }] : []
      })
    : []

  return { decks, participants }
}
