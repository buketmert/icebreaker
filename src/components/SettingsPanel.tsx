import { useRef } from 'react'
import type { Deck, Participant, Settings } from '../types'
import { createBackup, downloadJson, parseBackup } from '../lib/backup'

interface SettingsPanelProps {
  settings: Settings
  onChange: (settings: Settings) => void
  decks: Deck[]
  participants: Participant[]
  onImport: (data: { decks: Deck[]; participants: Participant[] }, mode: 'replace' | 'merge') => void
  onResetAll: () => void
}

const TIMER_OPTIONS = [
  { value: 0, label: 'Kapalı' },
  { value: 30, label: '30 sn' },
  { value: 60, label: '1 dk' },
  { value: 90, label: '1,5 dk' },
  { value: 120, label: '2 dk' },
  { value: 180, label: '3 dk' },
]

export function SettingsPanel({ settings, onChange, decks, participants, onImport, onResetAll }: SettingsPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => onChange({ ...settings, [key]: value })

  const handleFile = async (file: File) => {
    try {
      const data = parseBackup(await file.text())
      const replace = confirm(
        `${data.decks.length} deste ve ${data.participants.length} katılımcı bulundu.\n\n` +
          'Tamam: mevcut verinin yerine koy\nİptal: mevcut verinin sonuna ekle',
      )
      onImport(data, replace ? 'replace' : 'merge')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Dosya okunamadı.')
    }
  }

  return (
    <div className="panel-body settings">
      <section>
        <h3>Çark</h3>
        <label className="field">
          <span>
            Dönme süresi <strong>{settings.spinSeconds} sn</strong>
          </span>
          <input
            type="range"
            min={2}
            max={10}
            step={1}
            value={settings.spinSeconds}
            onChange={(e) => set('spinSeconds', Number(e.target.value))}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.removeAfterPick}
            onChange={(e) => set('removeAfterPick', e.target.checked)}
          />
          Çıkan soru/kişi varsayılan olarak çarktan çıkarılsın
        </label>
        <label className="check">
          <input type="checkbox" checked={settings.soundOn} onChange={(e) => set('soundOn', e.target.checked)} />
          Ses efektleri
        </label>
      </section>

      <section>
        <h3>Cevap süresi</h3>
        <div className="segmented" role="radiogroup" aria-label="Cevap süresi">
          {TIMER_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={settings.answerSeconds === o.value}
              className={settings.answerSeconds === o.value ? 'active' : ''}
              onClick={() => set('answerSeconds', o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3>Veri</h3>
        <p className="muted">
          Veriler yalnızca bu tarayıcıda saklanır. Soru setlerini takımla paylaşmak için dışa aktarın.
        </p>
        <div className="row-gap wrap">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => downloadJson(`buzkiran-${new Date().toISOString().slice(0, 10)}.json`, createBackup(decks, participants))}
          >
            Dışa aktar (JSON)
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
            İçe aktar
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            className="btn btn-danger-ghost btn-sm"
            onClick={() => {
              if (confirm('Tüm veriler (desteler, katılımcılar, geçmiş, ayarlar) sıfırlansın mı?')) onResetAll()
            }}
          >
            Her şeyi sıfırla
          </button>
        </div>
      </section>

      <section>
        <h3>Kısayollar</h3>
        <ul className="shortcuts">
          <li>
            <kbd>Boşluk</kbd> çarkı çevir
          </li>
          <li>
            <kbd>Esc</kbd> sonucu kapat
          </li>
          <li>
            <kbd>F</kbd> sunum modu
          </li>
        </ul>
      </section>
    </div>
  )
}
