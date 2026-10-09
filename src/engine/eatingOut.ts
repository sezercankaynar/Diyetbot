import { getFood } from './foods'
import { CHAIN_FOODS } from './chains'
import { conflicts, fitsAnimal, fitsDislikes } from './foodRules'
import type { AnimalFoods, DietId } from './types'

export interface VenuePick {
  foodId: string
  factor: number
  note?: string
}

export interface Venue {
  id: string
  name: string
  picks: VenuePick[]
  tips: string[]
  avoid: string[]
}

export const VENUES: Venue[] = [
  {
    id: 'kebap',
    name: 'Kebapçı / ocakbaşı',
    picks: [
      { foodId: 'tavuk-sis', factor: 1 },
      { foodId: 'izgara-kofte-porsiyon', factor: 1 },
      { foodId: 'adana', factor: 1, note: 'Lavaşı kenara al; yanına bol salata ve közlenmiş sebze' },
      { foodId: 'ayran', factor: 1 },
    ],
    tips: ['Önce salata, ezme ve söğüşle başla', 'Pilav ya da lavaştan birini seç, ikisini birden değil', 'Ayran, kola yerine iyi bir tercih'],
    avoid: ['İskender ve tereyağlı soslar', 'Lavaşın tamamı + pilav + kola üçlüsü', 'Künefe'],
  },
  {
    id: 'doner',
    name: 'Dönerci',
    picks: [
      { foodId: 'et-doner-porsiyon', factor: 1, note: 'Pilavsız porsiyon + salata en dengelisi' },
      { foodId: 'tavuk-doner-durum', factor: 1, note: 'Sos ve patatesi çıkarttır' },
      { foodId: 'ayran', factor: 1 },
    ],
    tips: ['Yarım ekmek yerine dürüm veya porsiyon iste', 'Patates ve mayonezli sosu çıkarttır'],
    avoid: ['Patates + kola menüsü', 'Tombik ekmek arası'],
  },
  {
    id: 'esnaf',
    name: 'Esnaf lokantası',
    picks: [
      { foodId: 'izgara-tavuk-lokanta', factor: 1 },
      { foodId: 'mercimek-corbasi', factor: 1, note: 'Çorbayla başlamak toplam yediğini azaltır' },
      { foodId: 'sebze-yemegi-lokanta', factor: 1, note: 'Yanına yoğurt veya cacık ekle' },
      { foodId: 'kuru-fasulye-pilav-lokanta', factor: 0.75, note: 'Pilavı yarım porsiyon iste' },
    ],
    tips: ['Bir protein + bir sebze yemeği + yoğurt/cacık', 'Pilav ve ekmekten birini seç'],
    avoid: ['Kızartmalar', 'Şerbetli tatlılar'],
  },
  {
    id: 'pide',
    name: 'Pide / lahmacun',
    picks: [
      { foodId: 'lahmacun', factor: 2, note: '2 adet, bol yeşillik ve limonla' },
      { foodId: 'mercimek-corbasi', factor: 1 },
      { foodId: 'kasarli-pide', factor: 0.5, note: 'Pideyi paylaş ya da yarısını paket yaptır' },
      { foodId: 'kiymali-pide', factor: 0.5, note: 'Yarısını paylaş, yanına salata' },
      { foodId: 'ayran', factor: 1 },
    ],
    tips: ['Önce çorba veya salata', 'Bütün pide tek başına bir günlük tuzun çoğunu karşılar'],
    avoid: ['Tereyağlı/yumurtalı pide', 'Pide + lahmacun birlikte'],
  },
  {
    id: 'fast',
    name: 'Fast food',
    picks: [
      { foodId: 'tavuk-burger', factor: 1 },
      { foodId: 'hamburger', factor: 1, note: 'Tek köfteli, patates yerine salata' },
      { foodId: 'sezar-salata', factor: 1, note: 'Sosu ayrı iste, yarısını kullan' },
    ],
    tips: ['Menü yerine tek ürün al', 'İçecek: su, ayran veya şekersiz'],
    avoid: ['Büyük boy menü', 'Ekstra sos ve peynir', 'Milkshake'],
  },
  {
    id: 'pizza',
    name: 'Pizzacı',
    picks: [
      { foodId: 'sebzeli-pizza-dilim', factor: 2, note: '2 dilim + büyük bir salata' },
      { foodId: 'pizza-dilim', factor: 2, note: '2 dilim + salata' },
    ],
    tips: ['İnce hamur seç', 'Önce salatayı bitir'],
    avoid: ['Kenarı peynir dolgulu hamur', 'Sarımsaklı ekmek + pizza'],
  },
  {
    id: 'balik',
    name: 'Balıkçı',
    picks: [
      { foodId: 'izgara-balik-porsiyon', factor: 1 },
      { foodId: 'balik-ekmek', factor: 1 },
    ],
    tips: ['Ara sıcak yerine salata, haydari, zeytinyağlılar', 'Tava yerine ızgara veya buğulama'],
    avoid: ['Tava balık + kızartma mezeler', 'Fazla alkol (hem kalori hem iştah açar)'],
  },
  {
    id: 'kahvalti',
    name: 'Kahvaltı salonu',
    picks: [
      { foodId: 'menemen', factor: 1 },
      { foodId: 'lorlu-omlet', factor: 1 },
      { foodId: 'serpme-kahvalti', factor: 0.75, note: 'Yumurta, peynir ve sebzeye odaklan' },
    ],
    tips: ['Yumurta + peynir + bol domates-salatalık', 'Ekmeği 1–2 dilimle sınırla, reçel/bal 1 tatlı kaşığı'],
    avoid: ['Sigara böreği, pişi', 'Sucuk + tereyağı birlikte'],
  },
  {
    id: 'kafe',
    name: 'Kafe / pastane',
    picks: [
      { foodId: 'sezar-salata', factor: 1, note: 'Sosu ayrı iste' },
      { foodId: 'latte', factor: 1, note: 'Şuruplu kahveler yerine' },
      { foodId: 'pasta-dilim', factor: 0.5, note: 'Canın çektiyse paylaş: yarım dilim' },
    ],
    tips: ['Kahveni sade veya sütlü al, şurupsuz', 'Tatlıyı paylaş'],
    avoid: ['Şuruplu/kremalı büyük kahveler', 'Kruvasan + tatlı birlikte'],
  },
]

export interface VenueGuidePick extends VenuePick {
  name: string
  portion: string
  kcal: number
  protein: number
  fitsBudget: boolean
  warnings: string[]
}

export interface VenueGuide {
  venue: Venue
  picks: VenueGuidePick[]
}

export function venueGuide(
  venueId: string,
  ctx: { remainingKcal: number; diet: DietId; animalFoods: AnimalFoods; dislikes: readonly string[] },
): VenueGuide | null {
  const venue = VENUES.find((v) => v.id === venueId)
  if (!venue) return null
  const picks: VenueGuidePick[] = []
  for (const p of venue.picks) {
    const f = getFood(p.foodId)
    if (!f || !fitsAnimal(f, ctx.animalFoods) || !fitsDislikes(f, ctx.dislikes)) continue
    const kcal = Math.round(f.kcal * p.factor)
    picks.push({
      ...p,
      name: f.name,
      portion: f.portion,
      kcal,
      protein: Math.round(f.protein * p.factor),
      fitsBudget: kcal <= ctx.remainingKcal + 50,
      warnings: conflicts(f, p.factor, ctx),
    })
  }
  // Rule-compatible and in-budget picks first.
  picks.sort((a, b) => Number(a.warnings.length > 0) - Number(b.warnings.length > 0) || Number(b.fitsBudget) - Number(a.fitsBudget))
  return { venue, picks }
}

export interface ChainItem {
  foodId: string
  /** Usual serving (per-100 g/ml items use their assumed portion). */
  factor: number
  name: string
  portion: string
  kcal: number
  protein: number
  kcalOnly: boolean
  fitsBudget: boolean
  warnings: string[]
}

export interface ChainInfo {
  brand: string
  source: string
  count: number
  /** True when the brand publishes no values and items are estimates. */
  estimated: boolean
}

/** Chains that have published nutrition values in the database. */
export function chainList(): ChainInfo[] {
  const map = new Map<string, ChainInfo>()
  for (const f of CHAIN_FOODS) {
    if (!f.brand) continue
    const c = map.get(f.brand) ?? { brand: f.brand, source: f.source ?? '', count: 0, estimated: !!f.estimated }
    c.count++
    map.set(f.brand, c)
  }
  return [...map.values()].sort((a, b) => a.brand.localeCompare(b.brand, 'tr'))
}

/**
 * A chain's menu for the user: items that fit preferences, best choices first
 * (no rule conflicts, within budget, most protein per kcal).
 */
export function chainMenu(
  brand: string,
  ctx: { remainingKcal: number; diet: DietId; animalFoods: AnimalFoods; dislikes: readonly string[] },
): ChainItem[] {
  return CHAIN_FOODS.filter((f) => f.brand === brand && fitsAnimal(f, ctx.animalFoods) && fitsDislikes(f, ctx.dislikes))
    .map((f) => {
      const factor = f.defaultFactor ?? 1
      const kcal = Math.round(f.kcal * factor)
      return {
        foodId: f.id,
        factor,
        name: f.name,
        portion: f.portion,
        kcal,
        protein: Math.round(f.protein * factor),
        kcalOnly: !!f.kcalOnly,
        fitsBudget: kcal <= ctx.remainingKcal + 50,
        warnings: conflicts(f, factor, ctx),
        density: f.kcalOnly ? 0 : (f.protein * 4) / Math.max(f.kcal, 1),
      }
    })
    .sort(
      (a, b) =>
        Number(a.warnings.length > 0) - Number(b.warnings.length > 0) ||
        Number(b.fitsBudget) - Number(a.fitsBudget) ||
        b.density - a.density ||
        a.kcal - b.kcal,
    )
    .map(({ density: _d, ...rest }) => rest)
}
