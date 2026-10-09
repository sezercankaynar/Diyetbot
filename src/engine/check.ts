import { allFoods, getFood, type Food, type FoodGroup, type FoodTag } from './foods'
import { conflicts, fitsAnimal, fitsDislikes } from './foodRules'
import { itemTotals, sumTotals, type Totals } from './menu'
import type { AnimalFoods, DietId } from './types'

export interface CheckItem {
  foodId: string
  factor: number
}

export interface CheckContext {
  kcalTarget: number
  proteinTarget: number
  eaten: Totals
  diet: DietId
  animalFoods: AnimalFoods
  dislikes: FoodTag[]
}

export type Verdict = 'ok' | 'caution' | 'smaller' | 'over'

export interface Alternative {
  foodId: string
  factor: number
  kcal: number
  protein: number
}

export interface CheckResult {
  totals: Totals
  remainingBefore: number
  remainingAfter: number
  verdict: Verdict
  title: string
  reasons: string[]
  /** False when an item has only kcal (protein/carb/fat unknown). */
  macrosKnown: boolean
  /** Portion multiplier that fits the remaining budget (for verdict 'smaller'). */
  suggestedFactor?: number
  alternatives: Alternative[]
  tips: string[]
}

/** Remaining budget can be exceeded by this much and still count as "fits". */
const TOLERANCE = 50

const RELATED: Record<FoodGroup, FoodGroup[]> = {
  kebap: ['kebap', 'ana', 'salata'],
  hamur: ['hamur', 'kebap', 'ana'],
  fast: ['fast', 'kebap', 'salata'],
  tatli: ['tatli'],
  icecek: ['icecek'],
  kahvalti: ['kahvalti'],
  corba: ['corba', 'salata', 'ana'],
  ana: ['ana', 'salata', 'kebap'],
  salata: ['salata', 'ana'],
  ara: ['ara', 'tatli'],
  yan: ['yan', 'salata'],
  paket: ['paket', 'ara', 'tatli'],
  ev: ['ana', 'salata', 'corba', 'ev'],
}

const MAIN_GROUPS: FoodGroup[] = ['kebap', 'hamur', 'fast', 'ana', 'corba', 'salata', 'kahvalti', 'ev']

export function evaluateMeal(items: CheckItem[], ctx: CheckContext): CheckResult {
  const valid = items.filter((i) => getFood(i.foodId) && i.factor > 0)
  const totals = sumTotals(valid.map((i) => itemTotals(i.foodId, i.factor)))
  const remainingBefore = ctx.kcalTarget - ctx.eaten.kcal
  const remainingAfter = remainingBefore - totals.kcal

  const reasons = valid.flatMap((i) => {
    const f = getFood(i.foodId)!
    return conflicts(f, i.factor, ctx).map((c) => `${f.name}: ${c}`)
  })

  let verdict: Verdict
  let suggestedFactor: number | undefined
  if (totals.kcal <= remainingBefore + TOLERANCE) {
    verdict = reasons.length ? 'caution' : 'ok'
  } else {
    const fit = remainingBefore > 0 ? Math.floor((remainingBefore / totals.kcal) * 4) / 4 : 0
    if (fit >= 0.5) {
      verdict = 'smaller'
      suggestedFactor = fit
    } else {
      verdict = 'over'
    }
  }

  const title: Record<Verdict, string> = {
    ok: 'Yiyebilirsin',
    caution: 'Yiyebilirsin, ama dikkat',
    smaller: `Porsiyonu küçült: yaklaşık %${Math.round((suggestedFactor ?? 1) * 100)}`,
    over: 'Bugünkü bütçeni aşıyor',
  }

  const tips: string[] = []
  const groups = valid.map((i) => getFood(i.foodId)!.group)
  const isMain = groups.some((g) => MAIN_GROUPS.includes(g))
  const macrosKnown = !valid.some((i) => getFood(i.foodId)!.kcalOnly)
  if (!macrosKnown) {
    tips.push('Bu ürünün protein, karbonhidrat ve yağ değerleri yayımlanmamış ya da tutarsız; yalnızca kalorisi hesaba katıldı.')
  }
  if (isMain && macrosKnown && totals.protein < 20) {
    tips.push('Protein düşük: yanına yoğurt, ayran, yumurta veya bir porsiyon baklagil ekle.')
  }
  if (verdict !== 'over' && totals.kcal > ctx.kcalTarget * 0.35) {
    tips.push(`Büyük bir öğün: günlük hedefinin %${Math.round((totals.kcal / ctx.kcalTarget) * 100)}'i. Günün kalanında hafif ve proteinli seç.`)
  }
  if (valid.some((i) => getFood(i.foodId)!.sweet)) {
    tips.push('Tatlıyı yemekten hemen sonra, oturarak ve küçük tabakta ye; "Tatlı krizi" bölümünde daha hafif seçenekler var.')
  }
  if (verdict === 'over') {
    tips.push('Bir öğünde aşmak sorun değil; önemli olan haftalık ortalama. Yersen telafi için aç kalma, sonraki öğünde plana dön.')
  }
  if (ctx.eaten.kcal >= ctx.kcalTarget * 0.5 && ctx.eaten.protein + totals.protein < ctx.proteinTarget * 0.5) {
    tips.push('Bugün protein hedefinin gerisindesin; seçimini proteinli yap.')
  }

  const needAlternatives = verdict !== 'ok' || reasons.length > 0
  const alternatives = needAlternatives ? findAlternatives(valid, Math.max(remainingBefore, 250), ctx) : []

  return { totals, remainingBefore, remainingAfter, verdict, title: title[verdict], reasons, macrosKnown, suggestedFactor, alternatives, tips }
}

function findAlternatives(items: CheckItem[], budget: number, ctx: CheckContext, n = 3): Alternative[] {
  const main = items
    .map((i) => getFood(i.foodId)!)
    .sort((a, b) => b.kcal - a.kcal)[0]
  if (!main) return []
  const groups = RELATED[main.group]
  const chosen = new Set(items.map((i) => i.foodId))
  const ok = (f: Food) =>
    !chosen.has(f.id) &&
    // Chain/packaged items only as alternatives from the same brand (no KFC suggestion at McDonald's).
    (!f.brand || f.brand === main.brand) &&
    groups.includes(f.group) &&
    fitsAnimal(f, ctx.animalFoods) &&
    fitsDislikes(f, ctx.dislikes) &&
    conflicts(f, 1, ctx).length === 0

  const out: (Alternative & { score: number })[] = []
  for (const f of allFoods().filter(ok)) {
    const factor = [1, 0.75, 0.5].find((x) => f.kcal * x <= budget + TOLERANCE)
    if (!factor) continue
    const kcal = Math.round(f.kcal * factor)
    const protein = Math.round(f.protein * factor)
    const sameGroup = (f.group === main.group ? 0.5 : 0) + (main.brand && f.brand === main.brand ? 1 : 0)
    const score = sameGroup + (protein * 4) / Math.max(kcal, 1) + (factor === 1 ? 0.3 : 0)
    out.push({ foodId: f.id, factor, kcal, protein, score })
  }
  return out
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(({ score: _s, ...a }) => a)
}
