import { bmi } from './energy'
import type { Callout, DietId, Profile, SafetyResult } from './types'

const REFERRAL =
  'Lütfen bir hekim veya diyetisyenle görüşün; bu uygulama bu durumda güvenli bir plan üretemez.'

/** Evaluated before anything else. A stop means no kcal/macro output at all. */
export function evaluateSafety(p: Profile): SafetyResult {
  const stops: Callout[] = []
  const warnings: Callout[] = []
  const excludedDiets: DietId[] = []
  let ifAllowed = true

  if (p.age < 18) {
    stops.push({
      level: 'stop',
      code: 'minor',
      title: '18 yaş altı',
      text: `Büyüme döneminde kalori kısıtlaması uzman takibi gerektirir. ${REFERRAL}`,
    })
  }
  if (p.health.pregnant) {
    stops.push({
      level: 'stop',
      code: 'pregnant',
      title: 'Gebelik / emzirme',
      text: `Bu dönemde enerji ve besin ihtiyacı değişir; kilo verme hedeflenmemelidir. ${REFERRAL}`,
    })
  }
  if (p.health.eatingDisorder) {
    stops.push({
      level: 'stop',
      code: 'eating-disorder',
      title: 'Yeme bozukluğu öyküsü',
      text: `Kalori ve kilo takibi nüksü tetikleyebilir. ${REFERRAL}`,
    })
  }
  if (p.health.kidneyLiver) {
    stops.push({
      level: 'stop',
      code: 'kidney-liver',
      title: 'Böbrek veya karaciğer hastalığı',
      text: `Protein ve sıvı hedefleri hastalığa göre ayarlanmalıdır. ${REFERRAL}`,
    })
  }
  if (bmi(p.weightKg, p.heightCm) < 18.5 && (p.goal === 'lose' || p.goal === 'recomp')) {
    stops.push({
      level: 'stop',
      code: 'underweight',
      title: 'Düşük vücut ağırlığı',
      text: `BKİ 18,5'in altındayken kilo verme veya kalori açığı önerilmez. ${REFERRAL}`,
    })
  }

  if (p.health.diabetesMeds) {
    warnings.push({
      level: 'warn',
      code: 'hypoglycemia',
      title: 'Hipoglisemi riski',
      text: 'Diyabet ilacı veya insülin kullanırken kalori/karbonhidrat azaltmak kan şekerini düşürebilir. Başlamadan önce doktorunuzla konuşun; ilaç dozunun ayarlanması gerekebilir. Ketojenik diyet ve aralıklı oruç bu nedenle önerilerden çıkarıldı.',
    })
    excludedDiets.push('keto')
    ifAllowed = false
  }
  if (p.health.eatingDisorder || p.health.pregnant) ifAllowed = false

  if (p.sleepHours < 6) {
    warnings.push({
      level: 'warn',
      code: 'sleep',
      title: 'Yetersiz uyku',
      text: '6 saatin altında uyku iştahı artırır ve kalori açığında kaybedilen kilonun daha büyük kısmının kas olmasına yol açar. Önce uykuyu 7–9 saate çıkarmayı hedefleyin.',
    })
  }

  return { stop: stops.length > 0, stops, warnings, excludedDiets, ifAllowed }
}
