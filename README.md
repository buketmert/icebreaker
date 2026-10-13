# Buzkıran 🎡

Şirket içi toplantılar, sprint retrospektifleri ve takım tanışmaları için **kısa buz kırıcı oyunlar**.
Wordwall'daki "Retro Çarkı" fikrinden yola çıkıldı; üstüne kişi çarkı, cevap süresi, geçmiş,
düzenlenebilir soru desteleri ve iki oyun daha eklendi.

Sunucu ya da veritabanı gerektirmez: build çıktısı statik dosyalardır, intranet'te herhangi bir
web sunucusundan (IIS, nginx, SharePoint/Confluence ek dosyası, GitHub Pages vb.) yayınlanabilir.

## Oyunlar

Uygulama bir oyun menüsüyle açılır; sorular ve katılımcı listesi tüm oyunlarda ortaktır.
Hepsi tek ekrandan (ekran paylaşımıyla) oynanır, katılımcıların cihaz kullanması gerekmez.

| Oyun | Süre | Nasıl oynanır |
| --- | --- | --- |
| 🎡 **Çarkıfelek** | 2–10 dk | Çark rastgele bir soru ya da söz sırası seçer. |
| 🎁 **Gizemli Kutular** | 5–10 dk | Sırası gelen kişi bir kutu numarası seçer; kutudan soru ya da joker çıkar (🎯 *Devret*: soruyu o sorar, 👥 *Herkes*: herkes tek kelimeyle cevaplar). |
| 🤥 **İki Doğru Bir Yalan** | 10–15 dk | Anlatıcı kendisiyle ilgili üç şey söyler; ekip el kaldırarak yalanı tahmin eder. Düşün → Anlat → Tahmin → Açıkla adımları, süre sayaçları ve ekip skoru. |

Kutular ve İki Doğru Bir Yalan **tur modunda** çalışır: herkes bir kez konuşana kadar kimse tekrar
seçilmez, pas geçen kişi turun sonunda ikinci bir şans alır. Skor yalnızca takım düzeyindedir
(Ekip – Anlatıcılar); kişisel puan tablosu bilinçli olarak yoktur.

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
  App.tsx                 Ortak veri, oyun seçimi, yerleşim
  types.ts                Ortak tipler (Deck, Participant, Settings, GameId…)
  games/
    catalog.ts            Oyun listesi (menü kartları)
    WheelGame.tsx         Çarkıfelek
    BoxesGame.tsx         Gizemli Kutular
    boxes.ts              Kutu tahtası kurulumu + testleri
    TwoTruthsGame.tsx     İki Doğru Bir Yalan
  components/
    GameMenu.tsx          Oyun seçme ekranı
    Wheel.tsx             SVG çark + dönme animasyonu
    ResultModal.tsx       Çark sonuç penceresi
    Countdown.tsx         Geri sayım (tüm oyunlarda)
    Confetti.tsx
    DecksPanel.tsx        Soru desteleri ve düzenleyici
    ParticipantsPanel.tsx Katılımcı listesi
    HistoryPanel.tsx      Geçmiş
    SettingsPanel.tsx     Ayarlar, içe/dışa aktarma
  data/defaultDecks.ts    Varsayılan soru desteleri
  lib/
    wheelMath.ts          Çark geometrisi (açı → dilim, hedef açı) + testleri
    turns.ts              Tur modu: herkes bir kez, pas geçen sona + testleri
    backup.ts             JSON içe/dışa aktarma + testleri
    sound.ts              WebAudio ses efektleri
    random.ts             crypto tabanlı rastgelelik, karıştırma
  hooks/
    useLocalStorage.ts
    useTurns.ts           Katılımcı listesi üzerinde tur modu
```

### Yeni oyun eklemek

1. `src/games/` altına oyun bileşenini yazın (ortak `Countdown`, `Confetti`, `useTurns` hazır).
2. `src/types.ts` içindeki `GameId` tipine ve `src/games/catalog.ts` listesine ekleyin.
3. `App.tsx` içinde `game === '…'` dalını ekleyin; menü kartı otomatik görünür.

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
