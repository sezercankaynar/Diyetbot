// Fine-grained taste preferences ("damak zevki"): ingredient/dish keywords matched
// against food names, plus the coarse tags. Used to exclude dislikes and favour likes.
import type { Food, FoodTag } from './foodList'

export interface PrefKey {
  id: string
  label: string
  group: string
  /** Matched against the lower-cased, accent-folded food name + portion. */
  re?: RegExp
  /** Coarse tag this option stands for (e.g. "all dairy"). */
  tag?: FoodTag
}

export const PREF_GROUPS = [
  'Et ve tavuk', 'Balık', 'Süt ürünleri ve yumurta', 'Baklagil ve soya', 'Tahıl ve hamur işi', 'Sebze', 'Kuruyemiş ve tohum', 'Yemek türü',
] as const

export const PREF_KEYS: PrefKey[] = [
  { id: 't-redmeat', label: 'Tüm kırmızı et', group: 'Et ve tavuk', tag: 'redmeat' },
  { id: 'dana-kiyma', label: 'Kıyma / köfte', group: 'Et ve tavuk', re: /kiyma|kofte|karniyarik|musakka|dolma|lahmacun|manti|izmir/ },
  { id: 'dana-et', label: 'Dana eti (kuşbaşı, sote)', group: 'Et ve tavuk', re: /dana|et sote|kusbasi|etli|biftek|roast ?beef|kebap|beyti|iskender|et doner/ },
  { id: 'islenmis', label: 'Sucuk, salam, sosis, jambon', group: 'Et ve tavuk', re: /sucuk|salam|sosis|jambon|pastirma|pepperoni|bmt/ },
  { id: 't-chicken', label: 'Tüm tavuk / hindi', group: 'Et ve tavuk', tag: 'chicken' },
  { id: 'tavuk', label: 'Tavuk', group: 'Et ve tavuk', re: /tavuk|chicken|nugget/ },
  { id: 'hindi', label: 'Hindi', group: 'Et ve tavuk', re: /hindi/ },
  { id: 'doner', label: 'Döner', group: 'Et ve tavuk', re: /doner|iskender|tombik/ },

  { id: 't-fish', label: 'Tüm balık ve deniz ürünü', group: 'Balık', tag: 'fish' },
  { id: 'yagli-balik', label: 'Somon, uskumru, hamsi', group: 'Balık', re: /somon|uskumru|hamsi/ },
  { id: 'beyaz-balik', label: 'Levrek, çipura', group: 'Balık', re: /levrek|cipura|izgara balik/ },
  { id: 'ton', label: 'Ton balığı', group: 'Balık', re: /\bton\b/ },

  { id: 't-dairy', label: 'Tüm süt ürünleri', group: 'Süt ürünleri ve yumurta', tag: 'dairy' },
  { id: 'sut', label: 'Süt (latte, sütlaç…)', group: 'Süt ürünleri ve yumurta', re: /\bsut\b|sutlu|sutlac|latte|cappuccino|muhallebi|salep|milkshake|puding/ },
  { id: 'yogurt', label: 'Yoğurt, ayran, kefir', group: 'Süt ürünleri ve yumurta', re: /yogurt|cacik|ayran|kefir/ },
  { id: 'peynir', label: 'Peynir (beyaz, kaşar, hellim)', group: 'Süt ürünleri ve yumurta', re: /peynir|kasar|hellim|cheddar|mozzarella|mozarella|cheese/ },
  { id: 'lor', label: 'Lor, labne', group: 'Süt ürünleri ve yumurta', re: /\blor|labne/ },
  { id: 't-egg', label: 'Yumurta', group: 'Süt ürünleri ve yumurta', tag: 'egg' },

  { id: 't-legume', label: 'Tüm baklagiller', group: 'Baklagil ve soya', tag: 'legume' },
  { id: 'mercimek', label: 'Mercimek', group: 'Baklagil ve soya', re: /mercimek|ezogelin/ },
  { id: 'nohut', label: 'Nohut, humus, leblebi', group: 'Baklagil ve soya', re: /nohut|humus|leblebi/ },
  { id: 'fasulye', label: 'Kuru fasulye, barbunya, piyaz', group: 'Baklagil ve soya', re: /kuru fasulye|barbunya|piyaz/ },
  { id: 'soya', label: 'Tofu, soya, edamame', group: 'Baklagil ve soya', re: /tofu|soya|edamame|tempeh/ },

  { id: 't-gluten', label: 'Buğday / gluten', group: 'Tahıl ve hamur işi', tag: 'gluten' },
  { id: 'bulgur', label: 'Bulgur, kısır', group: 'Tahıl ve hamur işi', re: /bulgur|kisir/ },
  { id: 'pirinc', label: 'Pirinç pilavı', group: 'Tahıl ve hamur işi', re: /pirinc|pilav/ },
  { id: 'makarna', label: 'Makarna, mantı', group: 'Tahıl ve hamur işi', re: /makarna|manti/ },
  { id: 'ekmek', label: 'Ekmek, sandviç, dürüm, tost', group: 'Tahıl ve hamur işi', re: /ekmek|sandvic|durum|tost|lavas|bagel|wrap|burger/ },
  { id: 'hamur', label: 'Hamur işi (börek, poğaça, pide)', group: 'Tahıl ve hamur işi', re: /borek|pogaca|acma|pide|kruvasan|simit|corek|pizza/ },
  { id: 'yulaf', label: 'Yulaf', group: 'Tahıl ve hamur işi', re: /yulaf/ },

  { id: 'patlican', label: 'Patlıcan', group: 'Sebze', re: /patlican|karniyarik|musakka/ },
  { id: 'kabak', label: 'Kabak', group: 'Sebze', re: /\bkabak (yemegi|$)|kiymali kabak|kabak yemegi/ },
  { id: 'ispanak', label: 'Ispanak', group: 'Sebze', re: /ispanak/ },
  { id: 'pirasa', label: 'Pırasa', group: 'Sebze', re: /pirasa/ },
  { id: 'bamya', label: 'Bamya', group: 'Sebze', re: /bamya/ },
  { id: 'mantar', label: 'Mantar', group: 'Sebze', re: /mantar/ },
  { id: 'karnabahar', label: 'Karnabahar, brokoli', group: 'Sebze', re: /karnabahar|brokoli/ },
  { id: 'taze-fasulye', label: 'Taze fasulye', group: 'Sebze', re: /taze fasulye/ },
  { id: 'bezelye', label: 'Bezelye', group: 'Sebze', re: /bezelye/ },
  { id: 'patates', label: 'Patates', group: 'Sebze', re: /patates/ },
  { id: 'avokado', label: 'Avokado', group: 'Sebze', re: /avokado/ },

  { id: 't-nuts', label: 'Tüm kuruyemişler', group: 'Kuruyemiş ve tohum', tag: 'nuts' },
  { id: 'ceviz', label: 'Ceviz', group: 'Kuruyemiş ve tohum', re: /ceviz/ },
  { id: 'fistik', label: 'Fıstık, fıstık ezmesi', group: 'Kuruyemiş ve tohum', re: /fistik/ },
  { id: 'findik-badem', label: 'Fındık, badem', group: 'Kuruyemiş ve tohum', re: /findik|badem/ },
  { id: 'chia', label: 'Chia, susam, tahin', group: 'Kuruyemiş ve tohum', re: /chia|susam|tahin/ },

  { id: 'corba', label: 'Çorbalar', group: 'Yemek türü', re: /corba/ },
  { id: 'zeytinyagli', label: 'Zeytinyağlılar', group: 'Yemek türü', re: /zeytinyagli|sarma/ },
  { id: 'salata', label: 'Salata tabakları', group: 'Yemek türü', re: /salata/ },
  { id: 'izgara', label: 'Izgara', group: 'Yemek türü', re: /izgara|sis\b|mangal/ },
  { id: 'kizartma', label: 'Kızartma', group: 'Yemek türü', re: /kizartma|citir|tava\b/ },
  { id: 'aci', label: 'Acı yemekler', group: 'Yemek türü', re: /acili|\badana|\bacı|aci\b/ },
]

export const PREF_BY_ID: Record<string, PrefKey> = Object.fromEntries(PREF_KEYS.map((k) => [k.id, k]))

const fold = (s: string) =>
  s.toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '')

const cache = new Map<string, string[]>()

/** Preference keys that describe a food (keyword matches + coarse tags). */
export function foodKeys(f: Food): string[] {
  const hit = cache.get(f.id)
  if (hit) return hit
  const text = fold(`${f.name} ${f.portion}`)
  const keys = PREF_KEYS.filter((k) => (k.tag ? f.tags.includes(k.tag) : k.re!.test(text))).map((k) => k.id)
  cache.set(f.id, keys)
  return keys
}

/** True when none of the user's dislikes apply to the food. Accepts coarse tags and fine keys. */
export function avoidsAll(f: Food, dislikes: readonly string[]): boolean {
  if (!dislikes.length) return true
  if (f.tags.some((t) => dislikes.includes(t))) return false
  return !foodKeys(f).some((k) => dislikes.includes(k))
}

/** How many of the user's liked keys a food matches. */
export function likeMatches(f: Food, likes: readonly string[]): number {
  if (!likes.length) return 0
  return foodKeys(f).filter((k) => likes.includes(k)).length
}
