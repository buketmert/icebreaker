import type { Deck } from '../types'

type DeckSeed = Omit<Deck, 'questions'> & { questions: string[] }

const seeds: DeckSeed[] = [
  {
    id: 'retro',
    name: 'Sprint Retro',
    emoji: '🔁',
    enabled: true,
    questions: [
      'Bu sprint bir film türü olsaydı hangisi olurdu?',
      'Bu sprinti tek bir emojiyle anlatsan hangisini seçerdin?',
      'Bu sprintte seni en çok ne şaşırttı?',
      'Bu sprintte öğrendiğin en faydalı şey neydi?',
      'Bir sonraki sprintte bırakmamız gereken bir alışkanlık var mı?',
      'Bu sprintte takımda teşekkür etmek istediğin biri var mı? Neden?',
      'Sprint boyunca seni en çok yavaşlatan şey neydi?',
      'Zamanı geri alabilseydin sprintte neyi farklı yapardın?',
      'Takımın bu sprintteki hali bir hava durumu olsaydı nasıl olurdu?',
      'Bir sonraki sprint için kendine koyduğun küçük bir hedef nedir?',
      'Bu sprintte en çok gurur duyduğun iş hangisiydi?',
      'Kontrolümüz dışında bizi etkileyen bir şey oldu mu?',
    ],
  },
  {
    id: 'tanisma',
    name: 'Tanışalım',
    emoji: '👋',
    enabled: true,
    questions: [
      'Çocukken büyüyünce ne olmak isterdin?',
      'Takımdakilerin senin hakkında bilmediği ilginç bir şey anlat.',
      'En sevdiğin hafta sonu rutini nedir?',
      'Son zamanlarda okuduğun, izlediğin ya da dinlediğin ve önerebileceğin bir şey var mı?',
      'Hayatında öğrendiğin en tuhaf beceri nedir?',
      'Memleketinden mutlaka denenmesi gereken bir lezzet söyle.',
      'Bugüne kadar aldığın en iyi tavsiye neydi?',
      'İlk işin neydi? Oradan aklında kalan bir anı var mı?',
      'Gitmek için sabırsızlandığın bir yer var mı?',
      'Boş bir günün olsa onu nasıl geçirirdin?',
      'Seni gülümseten küçük bir alışkanlığın nedir?',
      'Hangi konuda yarım saatlik hazırlıksız bir sunum yapabilirsin?',
    ],
  },
  {
    id: 'hayal',
    name: 'Hayal Gücü',
    emoji: '🦄',
    enabled: true,
    questions: [
      'Bir süper gücün olsaydı ne olmasını isterdin?',
      'Ofise her girişinde bir giriş müziği çalsa hangi şarkı olurdu?',
      'Bir film karakteriyle bir gün yer değiştirebilsen kim olurdu?',
      'Bir sporun tek bir kuralını değiştirebilseydin ne yapardın?',
      'Takımımız bir müzik grubu olsaydı adı ne olurdu?',
      'Bildiğin en gereksiz ama en sevdiğin bilgi nedir?',
      'Zamanda bir kez yolculuk yapabilseydin hangi döneme giderdin?',
      'Bir hayvanla konuşabilseydin hangisini seçerdin?',
      'Hayatın bir dizi olsaydı bu sezonun adı ne olurdu?',
      'Yeni bir tatil günü icat etsen neyi kutlardık?',
      'Issız bir adaya yanında sadece üç şey götürebilseydin neler olurdu?',
      'Bir robot asistanın olsa ilk ona hangi işi devrederdin?',
    ],
  },
  {
    id: 'calisma',
    name: 'Çalışma Tarzı',
    emoji: '💼',
    enabled: false,
    questions: [
      'Gün içinde en verimli olduğun saat hangisi?',
      'Odaklanmak için kullandığın bir yöntem var mı?',
      'İş ve özel hayat dengesini nasıl kuruyorsun?',
      'Uzaktan mı ofisten mi çalışmak? Neden?',
      'Toplantıların daha iyi geçmesi için bir önerin var mı?',
      'Vazgeçemediğin bir uygulama ya da araç hangisi?',
      'Geri bildirim almayı en çok nasıl seversin?',
      'Seni motive eden bir iş anını anlat.',
      'Yeni bir şey öğrenirken nasıl bir yol izlersin?',
      'Takımda daha çok yapmamız gereken bir şey nedir?',
    ],
  },
  {
    id: 'hizli',
    name: 'Hızlı Seçim',
    emoji: '⚡',
    enabled: false,
    questions: [
      'Çay mı kahve mi?',
      'Sabahçı mı gececi mi?',
      'Deniz mi dağ mı?',
      'Kitap mı dizi mi?',
      'Kedi mi köpek mi?',
      'Tatlı mı tuzlu mu?',
      'Yaz mı kış mı?',
      'Klavye kısayolu mu fare mi?',
      'Erken gelip erken çıkmak mı, geç gelip geç çıkmak mı?',
      'Sessiz çalışma mı arka planda müzik mi?',
    ],
  },
]

export function createDefaultDecks(): Deck[] {
  return seeds.map((deck) => ({
    ...deck,
    questions: deck.questions.map((text, i) => ({ id: `${deck.id}-${i + 1}`, text })),
  }))
}
