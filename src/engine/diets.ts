import type { DietId, DietScore, IfScore, Profile } from './types'

export const DIET_NAMES: Record<DietId, string> = {
  med: 'Akdeniz',
  hp: 'Yüksek proteinli esnek',
  dash: 'DASH',
  lowcarb: 'Ilımlı düşük karbonhidrat',
  plant: 'Bitki temelli',
  keto: 'Ketojenik',
}

/** Order also acts as the tie-breaker when scores are equal. */
export const DIET_ORDER: DietId[] = ['med', 'hp', 'dash', 'lowcarb', 'plant', 'keto']

const BASE: Record<DietId, number> = { med: 3, hp: 2, dash: 2, lowcarb: 1, plant: 1, keto: 0 }

export function scoreDiets(p: Profile, excluded: DietId[] = []): DietScore[] {
  const score = { ...BASE }
  const reasons: Record<DietId, string[]> = {
    med: [], hp: [], dash: [], lowcarb: [], plant: [], keto: [],
  }
  const adj = (id: DietId, delta: number, reason: string) => {
    score[id] += delta
    if (delta > 0) reasons[id].push(`+${delta}: ${reason}`)
  }

  const h = p.health
  if (h.highLdl) {
    adj('med', 2, 'Yüksek LDL – zeytinyağı ve kuruyemiş ağırlıklı beslenme LDL ve kardiyovasküler riski azaltır')
    adj('plant', 1, 'Yüksek LDL – doymuş yağı düşük, lifi yüksek')
    adj('keto', -3, '')
  }
  if (h.hypertension) {
    adj('dash', 4, 'Hipertansiyon – DASH ve tuz kısıtlaması tansiyonu en çok düşüren diyet')
    adj('med', 1, 'Hipertansiyon – sebze/meyve ağırlığı tansiyona olumlu')
  }
  if (h.insulinResistance) {
    adj('lowcarb', 2, 'İnsülin direnci – rafine karbonhidrat azaltımı kan şekeri dalgalanmasını düşürür')
    adj('med', 1, 'İnsülin direnci – Akdeniz tipi beslenme diyabet riskini azaltır')
  }
  if (p.tracksCalories) {
    adj('hp', 2, 'Kalori takibine istekli – esnek plan sayım ile en iyi çalışır')
  } else {
    adj('med', 1, 'Kalori saymadan uygulanabilir tabak kuralları')
    adj('lowcarb', 1, 'Kalori saymadan iştahı doğal olarak sınırlar')
    adj('hp', -1, '')
  }
  if (p.trainingDays >= 3) {
    adj('hp', 2, 'Haftada 3+ antrenman – yüksek protein kas korumayı/gelişimini destekler')
  }
  if (p.trainingDays >= 4) {
    adj('keto', -2, '')
    adj('lowcarb', -1, '')
  }
  if (p.carbAttachment === 'low') {
    adj('lowcarb', 2, 'Ekmek-pilav-makarnaya bağlılık düşük – kısıtlama zor gelmez')
    adj('keto', 1, 'Ekmek-pilav-makarnaya bağlılık düşük')
  } else if (p.carbAttachment === 'high') {
    adj('lowcarb', -2, '')
    adj('keto', -3, '')
    adj('med', 1, 'Ekmek-pilav-makarnaya bağlılık yüksek – tam tahıllı karbonhidratlara yer var')
  }
  if (p.animalFoods === 'vegetarian' || p.animalFoods === 'vegan') {
    adj('plant', 4, p.animalFoods === 'vegan' ? 'Vegan beslenme tercihi' : 'Vejetaryen beslenme tercihi')
    adj('keto', -3, '')
    if (p.animalFoods === 'vegan') adj('lowcarb', -1, '')
  }
  if (p.animalFoods === 'pescatarian') {
    adj('med', 1, 'Pesketaryen – balık ağırlıklı Akdeniz modeline çok uygun')
  }
  if (p.eatingOut === 'often') {
    adj('hp', 1, 'Sık dışarıda yemek – "önce protein" kuralı her menüde uygulanabilir')
    adj('keto', -1, '')
    adj('dash', -1, '')
  }
  if (p.cookingTime === 'low') {
    adj('hp', 1, 'Az yemek pişirme süresi – hazır protein kaynaklarıyla kolay')
    adj('dash', -1, '')
  }
  if (p.hungerTime === 'allday') {
    adj('hp', 1, 'Gün boyu açlık – protein en tok tutan makro besin')
  }
  if (h.diabetesMeds) {
    adj('keto', -10, '')
  }

  const result: DietScore[] = DIET_ORDER.map((id) => ({
    id,
    name: DIET_NAMES[id],
    score: Math.max(0, score[id]),
    reasons: reasons[id],
    excluded: excluded.includes(id),
  }))

  // Stable sort: descending score, excluded last, ties keep DIET_ORDER.
  return result.sort((a, b) => {
    if (a.excluded !== b.excluded) return a.excluded ? 1 : -1
    return b.score - a.score
  })
}

export const IF_THRESHOLD = 3
export const IF_NOTE =
  'Aynı kalori alımında 16:8 aralıklı oruç ek yağ kaybı sağlamaz; yalnızca açığı uygulamayı kolaylaştırabilir.'

/** 16:8 time-restricted eating, scored separately as a timing overlay. */
export function scoreIntermittentFasting(p: Profile): IfScore {
  const reasons: string[] = []
  const h = p.health
  if (h.diabetesMeds || h.eatingDisorder || h.pregnant) {
    return {
      score: -1,
      disabled: true,
      recommended: false,
      reasons: ['Sağlık durumu nedeniyle aralıklı oruç önerilmez'],
      note: IF_NOTE,
    }
  }
  let s = 1
  if (p.canSkipBreakfast) {
    s += 3
    reasons.push('+3: Kahvaltıyı atlayabiliyorsunuz')
  }
  if (p.mealsPerDay === 2) {
    s += 1
    reasons.push('+1: Zaten günde 2 öğün yiyorsunuz')
  }
  if (p.hungerTime === 'evening') s -= 1
  return { score: s, disabled: false, recommended: s >= IF_THRESHOLD, reasons, note: IF_NOTE }
}
