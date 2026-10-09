import { FOODS, type FoodTag } from './foods'
import { fitsAnimal, fitsDislikes } from './foodRules'
import type { AnimalFoods, DietId, HealthFlags, HungerTime } from './types'

export interface CravingOption {
  foodId: string
  recipeId?: string
  name: string
  portion: string
  kcal: number
  protein: number
  fitsBudget: boolean
}

export interface CravingPlan {
  steps: string[]
  options: CravingOption[]
  prevention: string[]
  notes: string[]
}

const MAX_KCAL = 230

export function cravingPlan(ctx: {
  remainingKcal: number
  diet: DietId
  animalFoods: AnimalFoods
  dislikes: FoodTag[]
  health: HealthFlags
  hungerTime: HungerTime
}): CravingPlan {
  const bloodSugar = ctx.health.diabetesMeds || ctx.health.insulinResistance
  const carbCap = ctx.diet === 'keto' ? 10 : bloodSugar ? 20 : Infinity

  const options = FOODS.filter(
    (f) =>
      f.sweet &&
      !f.treat &&
      f.group === 'tatli' &&
      f.kcal <= MAX_KCAL &&
      f.carb <= carbCap &&
      fitsAnimal(f, ctx.animalFoods) &&
      fitsDislikes(f, ctx.dislikes),
  )
    .map((f) => ({
      foodId: f.id,
      recipeId: f.recipeId,
      name: f.name,
      portion: f.portion,
      kcal: f.kcal,
      protein: f.protein,
      fitsBudget: f.kcal <= Math.max(ctx.remainingKcal, 0) + 50,
    }))
    // In-budget first, then the most filling (protein), then lighter.
    .sort((a, b) => Number(b.fitsBudget) - Number(a.fitsBudget) || b.protein - a.protein || a.kcal - b.kcal)

  const steps = [
    '10–15 dakika bekle: bir bardak su ya da bitki çayı (ıhlamur, papatya, tarçınlı çay) iç. İstek bir dalga gibidir, çoğu zaman geçer.',
    'Kendine sor: gerçekten aç mıyım, yoksa yorgun, sıkılmış ya da stresli miyim? Açsan proteinli bir şey seç (yoğurt, lor, kefir).',
    'Hâlâ istiyorsan yasaklama: aşağıdaki küçük, planlı seçeneklerden birini seç. Tabağa koy, oturarak ve tadını çıkararak ye.',
    'Paketi masaya getirme, ekran karşısında yeme. Yedikten sonra dişlerini fırçalamak "mutfak kapandı" sinyali verir.',
  ]

  const prevention = [
    'Akşam yemeğinde yeterli protein ve sebze/lif al.',
    'Gün içinde öğün atlayıp aşırı acıkma; akşam isteği büyür.',
    'Uykusuzluk tatlı isteğini artırır: 7–9 saat uyumaya çalış.',
    'Evde paketli tatlı bulundurma; canın çekerse dışarı çıkıp tek porsiyon al.',
  ]
  if (ctx.hungerTime === 'evening') {
    prevention.unshift('Akşamları zorlanıyorsun: gün içinde 150–200 kcal\'lik planlı bir gece atıştırmalığı payı bırak.')
  }

  const notes: string[] = []
  if (ctx.remainingKcal < 100) {
    notes.push('Bugünkü bütçen dolmak üzere. Küçük bir tatlı haftalık ortalamayı bozmaz; suçluluk duymadan ye ve yarın plana devam et.')
  }
  if (bloodSugar) {
    notes.push('Kan şekeri hassasiyetin olduğu için yüksek şekerli seçenekler listeden çıkarıldı.')
  }
  if (ctx.diet === 'keto') {
    notes.push('Ketojenik plan nedeniyle yalnızca çok düşük karbonhidratlı seçenekler gösteriliyor.')
  }

  return { steps, options, prevention, notes }
}
