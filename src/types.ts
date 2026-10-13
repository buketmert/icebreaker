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

export type GameId = 'wheel' | 'boxes' | 'twoTruths'

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
  /** Kaydın türü: soru, söz sırası ya da bir "İki Doğru Bir Yalan" turu */
  mode: WheelMode | 'twoTruths'
  label: string
  /** Sorunun ait olduğu destenin adı (kişi çarkında boş) */
  deckName?: string
  /** Soruyu cevaplayan / turu oynayan kişi */
  person?: string
  at: number
}

export type NewHistoryEntry = Omit<HistoryEntry, 'id' | 'at'>

/** Çarktaki tek bir dilim. `refId` soru ya da katılımcı kimliğidir. */
export interface WheelItem {
  refId: string
  label: string
  deckName?: string
}
