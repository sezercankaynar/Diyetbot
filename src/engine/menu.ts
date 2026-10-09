import { dayIndex } from './tracking'
import { FOODS, getFood, type Food, type FoodTag, type Slot } from './foods'
import { fitsAnimal, fitsDiet, fitsDislikes } from './foodRules'
import type { AnimalFoods, DietId, HungerTime, Level3, MealsPerDay, Plan, Profile } from './types'

export interface MenuItem {
  slot: Slot
  foodId: string
  /** Portion multiplier of the food's standard portion. */
  factor: number
}
export interface MenuDay {
  date: string
  items: MenuItem[]
}
export interface WeekMenu {
  weekStart: string
  seed: number
  /** Daily kcal target the menu was built for. */
  kcal?: number
  /** Signature of the preferences the menu was built with (see menuSignature). */
  sig?: string
  days: MenuDay[]
}

export interface MenuContext {
  kcal: number
  proteinG: number
  diet: DietId
  animalFoods: AnimalFoods
  dislikes: FoodTag[]
  dislikedFoods: string[]
  likedFoods: string[]
  cookingTime: Level3
  mealsPerDay: MealsPerDay
  canSkipBreakfast: boolean
  hungerTime: HungerTime
}

export interface SlotPlan {
  slot: Slot
  label: string
  share: number
}

const BASE_SHARE: Record<Slot, number> = { breakfast: 0.27, lunch: 0.33, dinner: 0.33, snack: 0.12 }

/** Which meals the day has, and what share of the kcal target each gets. */
export function slotPlan(ctx: Pick<MenuContext, 'mealsPerDay' | 'canSkipBreakfast' | 'hungerTime'>): SlotPlan[] {
  let slots: Slot[]
  if (ctx.mealsPerDay === 2) slots = ctx.canSkipBreakfast ? ['lunch', 'dinner'] : ['breakfast', 'dinner']
  else if (ctx.mealsPerDay === 3) slots = ctx.hungerTime === 'evening' ? ['breakfast', 'lunch', 'dinner', 'snack'] : ['breakfast', 'lunch', 'dinner']
  else slots = ['breakfast', 'lunch', 'snack', 'dinner']

  const weight = (s: Slot) => BASE_SHARE[s] + (s === 'dinner' && ctx.hungerTime === 'evening' ? 0.05 : 0)
  const total = slots.reduce((a, s) => a + weight(s), 0)
  const nightSnack = ctx.hungerTime === 'evening' && slots.at(-1) === 'snack'
  return slots.map((s) => ({
    slot: s,
    label: s === 'snack' && nightSnack ? 'Gece ara öğün' : SLOT_LABEL_TR[s],
    share: weight(s) / total,
  }))
}

const SLOT_LABEL_TR: Record<Slot, string> = { breakfast: 'Kahvaltı', lunch: 'Öğle', dinner: 'Akşam', snack: 'Ara öğün' }

const MAIN_FACTORS = [0.75, 1, 1.25, 1.5, 1.75, 2]
const SNACK_FACTORS = [1, 1.5, 2]
const MAX_PREP: Record<Level3, number> = { low: 1, mid: 2, high: 3 }

/** Deterministic PRNG so the same week + seed always gives the same menu. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function mondayOf(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  const dow = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - dow)
  return d.toISOString().slice(0, 10)
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function candidatePool(slot: Slot, ctx: MenuContext): Food[] {
  const base = FOODS.filter(
    (f) => f.slots.includes(slot) && fitsAnimal(f, ctx.animalFoods) && fitsDislikes(f, ctx.dislikes) && !ctx.dislikedFoods.includes(f.id),
  )
  const quick = base.filter((f) => f.prep <= MAX_PREP[ctx.cookingTime])
  return quick.length >= 3 ? quick : base
}

function dietBonus(f: Food, diet: DietId): number {
  switch (diet) {
    case 'med':
      return f.tags.includes('fish') || f.tags.includes('legume') ? 0.35 : f.tags.includes('redmeat') ? -0.2 : 0
    case 'dash':
      return f.tags.includes('redmeat') ? -0.2 : 0.1
    case 'plant':
      return f.tags.includes('legume') ? 0.4 : 0
    case 'hp':
      return 0
    default:
      return 0
  }
}

export interface Scored {
  foodId: string
  factor: number
  kcal: number
  protein: number
  score: number
}

/** Best portion of every candidate food for a slot, scored. */
export function scoreSlot(
  slot: Slot, target: number, ctx: MenuContext,
  recency: (foodId: string) => number = () => 0,
  noise: () => number = () => 0,
): Scored[] {
  const factors = slot === 'snack' ? SNACK_FACTORS : MAIN_FACTORS
  const pool = candidatePool(slot, ctx)
  const strict = pool.filter((f) => factors.some((x) => fitsDiet(f, ctx.diet, slot, x)))
  const foods = strict.length > 0 ? strict : pool // never leave a slot empty because of diet rules
  const enforce = strict.length > 0

  const out: Scored[] = []
  for (const f of foods) {
    let best: Scored | null = null
    for (const x of factors) {
      if (enforce && !fitsDiet(f, ctx.diet, slot, x)) continue
      const kcal = f.kcal * x
      const protein = f.protein * x
      const closeness = Math.abs(kcal - target) / target
      const proteinDensity = (protein * 4) / Math.max(kcal, 1)
      const score =
        -closeness * 3 +
        proteinDensity * (ctx.diet === 'hp' ? 1.8 : 1.0) -
        Math.abs(x - 1) * 0.3 + // prefer natural portion sizes
        (ctx.likedFoods.includes(f.id) ? 0.6 : 0) +
        (f.soy && (ctx.animalFoods === 'all' || ctx.animalFoods === 'pescatarian') ? -0.4 : 0) +
        dietBonus(f, ctx.diet) -
        recency(f.id)
      if (!best || score > best.score) best = { foodId: f.id, factor: x, kcal: Math.round(kcal), protein: Math.round(protein), score }
    }
    if (best) out.push({ ...best, score: best.score + noise() })
  }
  return out.sort((a, b) => b.score - a.score)
}

const MAIN_PROTEINS: FoodTag[] = ['redmeat', 'chicken', 'fish']
/** Meat/fish/tofu in a dish – the same one twice a day feels repetitive (köfte at lunch and dinner). */
function mainProtein(foodId: string): string[] {
  const f = getFood(foodId)
  if (!f) return []
  const out: string[] = f.tags.filter((t) => MAIN_PROTEINS.includes(t))
  if (f.soy) out.push('soy')
  return out
}

export function generateWeekMenu(ctx: MenuContext, weekStart: string, seed = 1): WeekMenu {
  const rand = rng(dayIndex(weekStart) * 7919 + seed)
  const plan = slotPlan(ctx)
  const lastUsed = new Map<string, number>()
  const useCount = new Map<string, number>()
  const days: MenuDay[] = []

  for (let d = 0; d < 7; d++) {
    const items: MenuItem[] = []
    for (const sp of plan) {
      const todaysProteins = new Set(items.flatMap((i) => mainProtein(i.foodId)))
      const recency = (id: string) => {
        const last = lastUsed.get(id)
        const gap = last === undefined ? Infinity : d - last
        const sameProteinToday = mainProtein(id).some((t) => todaysProteins.has(t)) ? 0.8 : 0
        return (gap === 0 ? 5 : gap === 1 ? 2 : gap === 2 ? 1 : 0) + (useCount.get(id) ?? 0) * 0.4 + sameProteinToday
      }
      const [pick] = scoreSlot(sp.slot, ctx.kcal * sp.share, ctx, recency, () => rand() * 0.5)
      if (!pick) continue
      items.push({ slot: sp.slot, foodId: pick.foodId, factor: pick.factor })
      lastUsed.set(pick.foodId, d)
      useCount.set(pick.foodId, (useCount.get(pick.foodId) ?? 0) + 1)
    }
    days.push({ date: addDays(weekStart, d), items })
  }
  return { weekStart, seed, kcal: ctx.kcal, sig: menuSignature(ctx), days }
}

/** Changes when a preference that shapes the menu changes (not liked/disliked dishes). */
export function menuSignature(ctx: MenuContext): string {
  return [ctx.diet, ctx.animalFoods, [...ctx.dislikes].sort().join('+'), ctx.cookingTime, ctx.mealsPerDay, ctx.canSkipBreakfast, ctx.hungerTime].join('|')
}

/** True when the menu no longer matches the current target or preferences. */
export function menuOutdated(menu: WeekMenu, ctx: MenuContext): boolean {
  return Math.abs((menu.kcal ?? 0) - ctx.kcal) > 100 || (menu.sig !== undefined && menu.sig !== menuSignature(ctx))
}

export function alternativesFor(ctx: MenuContext, day: MenuDay, slot: Slot, n = 4): Scored[] {
  const sp = slotPlan(ctx).find((s) => s.slot === slot)
  const target = ctx.kcal * (sp?.share ?? 0.3)
  const current = day.items.find((i) => i.slot === slot)?.foodId
  const sameDay = new Set(day.items.map((i) => i.foodId))
  return scoreSlot(slot, target, ctx).filter((s) => s.foodId !== current && !sameDay.has(s.foodId)).slice(0, n)
}

export function swapItem(menu: WeekMenu, date: string, slot: Slot, foodId: string, factor: number): WeekMenu {
  return {
    ...menu,
    days: menu.days.map((d) =>
      d.date !== date ? d : { ...d, items: d.items.map((i) => (i.slot === slot ? { slot, foodId, factor } : i)) },
    ),
  }
}

/** Replaces every occurrence of a dish (e.g. after "don't show again") with its best alternative. */
export function removeDish(menu: WeekMenu, ctx: MenuContext, foodId: string): WeekMenu {
  const c = { ...ctx, dislikedFoods: [...ctx.dislikedFoods, foodId] }
  let out = menu
  for (const day of menu.days) {
    for (const item of day.items) {
      if (item.foodId !== foodId) continue
      const current = out.days.find((d) => d.date === day.date)!
      const [alt] = alternativesFor(c, current, item.slot, 1)
      if (alt) out = swapItem(out, day.date, item.slot, alt.foodId, alt.factor)
    }
  }
  return out
}

export interface Totals {
  kcal: number
  protein: number
  carb: number
  fat: number
}

export function itemTotals(foodId: string, factor: number): Totals {
  const f = getFood(foodId)
  if (!f) return { kcal: 0, protein: 0, carb: 0, fat: 0 }
  return {
    kcal: Math.round(f.kcal * factor),
    protein: Math.round(f.protein * factor),
    carb: Math.round(f.carb * factor),
    fat: Math.round(f.fat * factor),
  }
}

export function sumTotals(list: Totals[]): Totals {
  return list.reduce(
    (a, t) => ({ kcal: a.kcal + t.kcal, protein: a.protein + t.protein, carb: a.carb + t.carb, fat: a.fat + t.fat }),
    { kcal: 0, protein: 0, carb: 0, fat: 0 },
  )
}

export function dayTotals(day: MenuDay): Totals {
  return sumTotals(day.items.map((i) => itemTotals(i.foodId, i.factor)))
}

export const WEEKDAY_TR = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
export const WEEKDAY_SHORT_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

/** Portion multiplier as Turkish text, e.g. 1.5 → "1,5 porsiyon". */
export function portionText(factor: number): string {
  if (factor === 1) return '1 porsiyon'
  return `${String(factor).replace('.', ',')} porsiyon`
}

/** Builds the menu context from the profile and its plan; null on a safety stop. */
export function buildMenuContext(
  p: Profile, plan: Plan, feedback: { liked: string[]; disliked: string[] } = { liked: [], disliked: [] },
): MenuContext | null {
  if (plan.safety.stop || !plan.energy || !plan.macros || !plan.recommendedDiet) return null
  return {
    kcal: plan.energy.target,
    proteinG: plan.macros.proteinG,
    diet: plan.recommendedDiet.id,
    animalFoods: p.animalFoods,
    dislikes: p.dislikes,
    dislikedFoods: feedback.disliked,
    likedFoods: feedback.liked,
    cookingTime: p.cookingTime,
    mealsPerDay: p.mealsPerDay,
    canSkipBreakfast: p.canSkipBreakfast,
    hungerTime: p.hungerTime,
  }
}
