# Buzkıran 🎡

Şirket içi toplantılar, sprint retrospektifleri ve takım tanışmaları için **icebreaker çarkı**.
Wordwall'daki "Retro Çarkı" fikrinden yola çıkıldı; üstüne kişi çarkı, cevap süresi, geçmiş ve
düzenlenebilir soru desteleri eklendi.

Sunucu ya da veritabanı gerektirmez: build çıktısı statik dosyalardır, intranet'te herhangi bir
web sunucusundan (IIS, nginx, SharePoint/Confluence ek dosyası, GitHub Pages vb.) yayınlanabilir.

## Özellikler

- **Soru çarkı** – birden çok deste (Sprint Retro, Tanışalım, Hayal Gücü, Çalışma Tarzı, Hızlı Seçim) açılıp kapatılabilir
- **Kişi çarkı** – söz sırasını rastgele belirler; konuşanlar işaretlenir
- **Çarktan çıkarma** – çıkan soru/kişi bir sonraki turda gelmez, tek tıkla geri getirilir
- **Cevap süresi** – sonuç penceresinde isteğe bağlı geri sayım (30 sn – 3 dk)
- **Geçmiş** – çıkan sorular saatleriyle listelenir, retro notlarına kopyalanabilir
- **Deste düzenleyici** – soru ekleme/düzenleme/silme, başka listeden toplu yapıştırma
- **İçe/dışa aktarma** – soru setlerini JSON dosyasıyla takımlar arasında paylaşma
- **Sunum modu** – tam ekran, yalnızca çark (ekran paylaşımı için); `F` kısayolu
- Ses efektleri (WebAudio, harici dosya yok), konfeti, açık/koyu tema, mobil uyumlu
- Tüm veriler tarayıcının `localStorage`'ında tutulur

## Başlarken

Gereksinim: Node.js 20+

```bash
npm install
npm run dev        # http://localhost:5173
```

| Komut               | Açıklama                                   |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Geliştirme sunucusu                        |
| `npm run build`     | Tip kontrolü + üretim build'i (`dist/`)    |
| `npm run preview`   | Build çıktısını yerelde sunar              |
| `npm test`          | Birim testleri (Vitest)                    |
| `npm run typecheck` | Yalnızca TypeScript kontrolü               |

## Proje yapısı

```
src/
  App.tsx                 Uygulama durumu, yerleşim, klavye kısayolları
  types.ts                Ortak tipler (Deck, Participant, Settings…)
  components/
    Wheel.tsx             SVG çark + dönme animasyonu
    ResultModal.tsx       Sonuç penceresi, sayaç, konfeti
    DecksPanel.tsx        Soru desteleri ve düzenleyici
    ParticipantsPanel.tsx Katılımcı listesi
    HistoryPanel.tsx      Geçmiş
    SettingsPanel.tsx     Ayarlar, içe/dışa aktarma
  data/defaultDecks.ts    Varsayılan soru desteleri
  lib/
    wheelMath.ts          Çark geometrisi (açı → dilim, hedef açı) + testleri
    backup.ts             JSON içe/dışa aktarma + testleri
    sound.ts              WebAudio ses efektleri
    random.ts             crypto tabanlı rastgelelik
  hooks/useLocalStorage.ts
```

### Çark nasıl seçim yapıyor?

Kazanan dilim dönüş başlamadan `crypto.getRandomValues` ile **eşit olasılıkla** seçilir; ardından
çarkın tam o dilimde duracağı açı hesaplanıp animasyon oraya yavaşlayarak gider
(`lib/wheelMath.ts`). Böylece animasyon süresi ya da kare hızı sonucu etkilemez.

## Kendi sorularınızı eklemek

- **Arayüzden:** Sorular → bir destenin ✎ simgesi → metin kutusuna her satıra bir soru yapıştırın.
- **Varsayılanları değiştirmek için:** `src/data/defaultDecks.ts` dosyasını düzenleyin.
- **Dosyayla:** Ayarlar → İçe aktar. Tam yedek dosyası ya da düz bir dizi kabul edilir:

```json
["Bu sprinti bir şarkıyla anlatsan hangisi olurdu?", "Bu hafta seni ne gülümsetti?"]
```

## Yayınlama

```bash
npm run build
```

`dist/` klasörünü olduğu gibi bir web sunucusuna kopyalamak yeterli. `vite.config.ts` içinde
`base: './'` ayarlı olduğundan alt dizinlerde de çalışır.

## Yol haritası fikirleri

- Ortak oda: bir kişi çevirir, herkes kendi ekranında görür (WebSocket / Supabase / Firebase)
- Microsoft Teams / Slack uygulaması olarak paketleme
- Şirket SSO'su ile giriş ve takım bazlı ortak soru setleri
- Anonim soru önerme ve oylama
