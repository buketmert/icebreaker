export interface Question {
  id: string
  text: string
}

export interface Deck {
  id: string
  name: string
  emoji: string
  enabled: boolean
  questions: Question[]
}

export interface Participant {
  id: string
  name: string
}

export type WheelMode = 'questions' | 'people'

export interface Settings {
  /** Çarkın dönme süresi (saniye) */
  spinSeconds: number
  /** Çıkan dilim bir sonraki turda çarktan çıkarılsın mı */
  removeAfterPick: boolean
  soundOn: boolean
  /** Cevap süresi (saniye); 0 ise sayaç kapalı */
  answerSeconds: number
}

export interface HistoryEntry {
  id: string
  mode: WheelMode
  label: string
  /** Sorunun ait olduğu destenin adı (kişi çarkında boş) */
  deckName?: string
  at: number
}

/** Çarktaki tek bir dilim. `refId` soru ya da katılımcı kimliğidir. */
export interface WheelItem {
  refId: string
  label: string
  deckName?: string
}
