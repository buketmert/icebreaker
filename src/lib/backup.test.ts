import { describe, expect, it } from 'vitest'
import { createBackup, parseBackup } from './backup'

describe('parseBackup', () => {
  it('dışa aktarılan dosyayı geri okur', () => {
    const backup = createBackup(
      [{ id: 'a', name: 'Retro', emoji: '🔁', enabled: false, questions: [{ id: 'q', text: 'Nasıldı?' }] }],
      [{ id: 'p', name: 'Ayşe' }],
    )
    const { decks, participants } = parseBackup(JSON.stringify(backup))
    expect(decks).toHaveLength(1)
    expect(decks[0]).toMatchObject({ name: 'Retro', emoji: '🔁', enabled: false })
    expect(decks[0].questions.map((q) => q.text)).toEqual(['Nasıldı?'])
    expect(participants.map((p) => p.name)).toEqual(['Ayşe'])
  })

  it('düz soru dizisini tek deste olarak alır', () => {
    const { decks } = parseBackup(JSON.stringify(['Bir', '  ', 'İki']))
    expect(decks[0].questions.map((q) => q.text)).toEqual(['Bir', 'İki'])
  })

  it('boş ve hatalı kayıtları atlar', () => {
    const { decks, participants } = parseBackup(
      JSON.stringify({ decks: [null, { questions: ['', 'Soru', { text: 'Diğer' }, 5] }], participants: ['', { name: 'Can' }] }),
    )
    expect(decks).toHaveLength(1)
    expect(decks[0].name).toBe('Adsız deste')
    expect(decks[0].questions.map((q) => q.text)).toEqual(['Soru', 'Diğer'])
    expect(participants.map((p) => p.name)).toEqual(['Can'])
  })

  it('geçersiz dosyada anlaşılır hata verir', () => {
    expect(() => parseBackup('{bozuk')).toThrow('geçerli bir JSON')
    expect(() => parseBackup('{"foo":1}')).toThrow('deste listesi')
  })
})
