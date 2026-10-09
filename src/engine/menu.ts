import { dayIndex } from './tracking'
import { allFoods, getFood, isSnackSlot, type Food, type FoodTag, type Slot } from './foods'
import { fitsAnimal, fitsDiet, fitsDislikes } from './foodRules'
import { likeMatches } from './foodKeys'
import type { AnimalFoods, DietId, HungerTime, Level3, MealsPerDay, MealStyle, MealStyles, Plan, Profile } from './types'

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
  /** Daily carb/fat targets; when set, a day's menu never goes over them. */
  carbG?: number
  fatG?: number
  diet: DietId
  animalFoods: AnimalFoods
  dislikes: readonly string[]
  /** Liked taste keys (foodKeys.ts) – favoured in menus. */
  likes?: readonly string[]
  /** Meals the user eats (when set explicitly). */
  mealSlots?: Slot[]
  dislikedFoods: string[]
  likedFoods: string[]
  cookingTime: Level3
  mealsPerDay: MealsPerDay
  canSkipBreakfast: boolean
  hungerTime: HungerTime
  mealStyle: MealStyles
}

export interface SlotPlan {
  slot: Slot
  label: string
  share: number
  style: MealStyle
}

/** Relative size of a meal by style (light ≈ snack-like plate, hearty ≈ full home-cooked meal). */
export const STYLE_WEIGHT: Record<MealStyle, number> = { light: 0.6, normal: 1, hearty: 1.4 }
const DEFAULT_STYLES: MealStyles = { breakfast: 'normal', lunch: 'normal', dinner: 'normal' }

const BASE_SHARE: Record<Slot, number> = { breakfast: 0.27, lunch: 0.33, dinner: 0.33, snack: 0.12, night: 0.1 }
/** Canonical order of the day's meals. */
export const SLOT_ORDER: Slot[] = ['breakfast', 'lunch', 'snack', 'dinner', 'night']

/** Which meals the day has, and what share of the kcal target each gets. */
export function slotPlan(
  ctx: Pick<MenuContext, 'mealsPerDay' | 'canSkipBreakfast' | 'hungerTime'> & { mealStyle?: MealStyles; mealSlots?: Slot[] },
): SlotPlan[] {
  const styles = ctx.mealStyle ?? DEFAULT_STYLES
  const styleOf = (s: Slot): MealStyle => (isSnackSlot(s) ? 'normal' : styles[s as keyof MealStyles])
  let slots: Slot[]
  if (ctx.mealSlots && ctx.mealSlots.length >= 2) {
    // The user picked exactly which meals they eat.
    slots = SLOT_ORDER.filter((s) => ctx.mealSlots!.includes(s))
  } else if (ctx.mealsPerDay === 2) slots = ctx.canSkipBreakfast ? ['lunch', 'dinner'] : ['breakfast', 'dinner']
  else if (ctx.mealsPerDay === 3) slots = ctx.hungerTime === 'evening' ? ['breakfast', 'lunch', 'dinner', 'night'] : ['breakfast', 'lunch', 'dinner']
  else slots = ['breakfast', 'lunch', 'snack', 'dinner']

  const weight = (s: Slot) =>
    (BASE_SHARE[s] + (s === 'dinner' && ctx.hungerTime === 'evening' ? 0.05 : 0)) * STYLE_WEIGHT[styleOf(s)]
  const total = slots.reduce((a, s) => a + weight(s), 0)
  return slots.map((s) => ({
    slot: s,
    label: SLOT_LABEL_TR[s],
    share: weight(s) / total,
    style: styleOf(s),
  }))
}

const SLOT_LABEL_TR: Record<Slot, string> = { breakfast: 'Kahvaltı', lunch: 'Öğle', dinner: 'Akşam', snack: 'Ara öğün', night: 'Gece ara öğün' }

const MAIN_FACTORS = [0.75, 1, 1.25, 1.5, 1.75, 2]
const SNACK_FACTORS = [1, 1.5, 2]
/** Smaller portions allowed only to stay inside the daily budget. */
const SMALL_FACTORS = [0.5]
const ALL_FACTORS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
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
  // Built-in dishes plus the user's own recipes that they allowed in menus (chains have no slots).
  const all = allFoods().filter(
    (f) => !f.noMenu && f.slots.includes(isSnackSlot(slot) ? 'snack' : slot) && fitsAnimal(f, ctx.animalFoods) && fitsDislikes(f, ctx.dislikes) && !ctx.dislikedFoods.includes(f.id),
  )
  // A light lunch/dinner means a quick, snack-like plate – only light dishes qualify.
  const style = isSnackSlot(slot) ? 'normal' : (ctx.mealStyle ?? DEFAULT_STYLES)[slot as keyof MealStyles]
  const lightOnly = style === 'light' && slot !== 'breakfast' ? all.filter((f) => f.kind === 'light') : all
  const base = lightOnly.length >= 3 ? lightOnly : all
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
/** Light/hearty fit for the meal's style; traditional dishes get a small bonus at main meals. */
function styleBonus(f: Food, slot: Slot, style: MealStyle): number {
  if (isSnackSlot(slot)) return 0
  const trad = f.trad && slot !== 'breakfast' ? 0.25 : 0
  if (style === 'light') {
    // Quick plates; fish dishes feel out of place as a light lunch.
    return trad / 2 + (f.kind === 'light' ? 0.7 : f.kind === 'hearty' ? -1.2 : 0) + (f.prep === 1 ? 0.3 : 0) - (f.tags.includes('fish') ? 0.6 : 0)
  }
  // Breakfast-type plates only make sense as a light lunch/dinner.
  const breakfastPlate = f.group === 'kahvalti' && slot !== 'breakfast' ? -0.6 : 0
  if (style === 'hearty') return breakfastPlate + trad + (f.kind === 'hearty' ? 0.7 : f.kind === 'light' ? -0.8 : 0)
  // normal: Turkish habit – lunch either way, dinner leans to a cooked meal
  return breakfastPlate + trad + (slot === 'dinner' ? (f.kind === 'hearty' ? 0.3 : f.kind === 'light' ? -0.3 : 0) : 0)
}

export function scoreSlot(
  slot: Slot, target: number, ctx: MenuContext,
  recency: (foodId: string) => number = () => 0,
  noise: () => number = () => 0,
  /** Upper limit for this meal (what's left of the day's budget); portions over it are skipped. */
  cap?: Totals,
): Scored[] {
  const style: MealStyle = isSnackSlot(slot) ? 'normal' : (ctx.mealStyle ?? DEFAULT_STYLES)[slot as keyof MealStyles]
  const base = isSnackSlot(slot) ? SNACK_FACTORS : MAIN_FACTORS
  const factors = cap ? [...SMALL_FACTORS, ...base] : base
  const pool = candidatePool(slot, ctx)
  const strict = pool.filter((f) => factors.some((x) => fitsDiet(f, ctx.diet, slot, x)))
  const foods = strict.length > 0 ? strict : pool // never leave a slot empty because of diet rules
  const enforce = strict.length > 0

  // Foods whose carb/fat share is far above the day's targets crowd out the other meals.
  const limit = dayLimit(ctx)
  const shareOf = target / ctx.kcal
  const imbalance = (t: Totals) =>
    (['carb', 'fat'] as const).reduce((a, k) => a + Math.max(0, t[k] / limit[k] - t.kcal / limit.kcal), 0) / Math.max(shareOf, 0.05)
  const out: Scored[] = []
  for (const f of foods) {
    let best: Scored | null = null
    for (const x of factors) {
      if (enforce && !fitsDiet(f, ctx.diet, slot, x)) continue
      if (cap && !within(itemTotals(f.id, x), cap)) continue
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
        dietBonus(f, ctx.diet) +
        styleBonus(f, slot, style) +
        Math.min(2, likeMatches(f, ctx.likes ?? [])) * 0.35 -
        imbalance(itemTotals(f.id, x)) * 1.5 -
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
  const limit = dayLimit(ctx)
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
      // Leave room for the meals still to come, so the day as a whole stays inside the budget.
      const left = minus(limit, sumTotals(items.map((i) => itemTotals(i.foodId, i.factor))))
      const later = plan.slice(plan.indexOf(sp) + 1).reduce((a, s) => a + s.share, 0)
      const cap = minus(left, scale(limit, later * RESERVE))
      const noise = () => rand() * 0.5
      const target = ctx.kcal * sp.share
      const [pick] = [
        ...scoreSlot(sp.slot, target, ctx, recency, noise, cap),
        ...scoreSlot(sp.slot, target, ctx, recency, noise, left),
        ...scoreSlot(sp.slot, target, ctx, recency, noise),
      ]
      if (!pick) continue
      items.push({ slot: sp.slot, foodId: pick.foodId, factor: pick.factor })
      lastUsed.set(pick.foodId, d)
      useCount.set(pick.foodId, (useCount.get(pick.foodId) ?? 0) + 1)
    }
    days.push({ date: addDays(weekStart, d), items: fillDay(fitDay(items, limit), limit, ctx.diet) })
  }
  return { weekStart, seed, kcal: ctx.kcal, sig: menuSignature(ctx), days }
}

/** Bumped when the generator's rules change, so older menus get flagged for a refresh. */
const MENU_VERSION = 'v2'

/** Changes when a preference that shapes the menu changes (not liked/disliked dishes). */
export function menuSignature(ctx: MenuContext): string {
  const st = ctx.mealStyle ?? DEFAULT_STYLES
  return [
    MENU_VERSION, ctx.diet, ctx.animalFoods, [...ctx.dislikes].sort().join('+'), [...(ctx.likes ?? [])].sort().join('+'), ctx.cookingTime,
    slotPlan(ctx).map((s) => s.slot).join('+'), ctx.hungerTime, st.breakfast, st.lunch, st.dinner,
  ].join('|')
}

/** True when the menu no longer matches the current target or preferences. */
export function menuOutdated(menu: WeekMenu, ctx: MenuContext): boolean {
  return Math.abs((menu.kcal ?? 0) - ctx.kcal) > 100 || (menu.sig !== undefined && menu.sig !== menuSignature(ctx))
}

/** Alternatives for one meal that keep the day inside its kcal and macro budget. */
export function alternativesFor(ctx: MenuContext, day: MenuDay, slot: Slot, n = 4): Scored[] {
  const sp = slotPlan(ctx).find((s) => s.slot === slot)
  const target = ctx.kcal * (sp?.share ?? 0.3)
  const current = day.items.find((i) => i.slot === slot)?.foodId
  const sameDay = new Set(day.items.map((i) => i.foodId))
  const others = sumTotals(day.items.filter((i) => i.slot !== slot).map((i) => itemTotals(i.foodId, i.factor)))
  const ok = (s: Scored) => s.foodId !== current && !sameDay.has(s.foodId)
  const fitting = scoreSlot(slot, target, ctx, undefined, undefined, minus(dayLimit(ctx), others)).filter(ok)
  // Only when the rest of the day already uses up the budget: show the closest options anyway.
  return (fitting.length ? fitting : scoreSlot(slot, target, ctx).filter(ok)).slice(0, n)
}

/** Puts a dish into a day's meal (replacing what's there, or adding the meal if the day lacks it). */
export function swapItem(menu: WeekMenu, date: string, slot: Slot, foodId: string, factor: number): WeekMenu {
  return {
    ...menu,
    days: menu.days.map((d) => {
      if (d.date !== date) return d
      const items = d.items.some((i) => i.slot === slot)
        ? d.items.map((i) => (i.slot === slot ? { slot, foodId, factor } : i))
        : [...d.items, { slot, foodId, factor }].sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot))
      return { ...d, items }
    }),
  }
}

/**
 * Portion of a dish that fits a day's meal without the day going over any target:
 * the preferred portion if it fits, else the largest smaller one; null when even half a portion doesn't fit.
 */
export function fitPortion(ctx: MenuContext, day: MenuDay, slot: Slot, foodId: string, prefer = 1): number | null {
  const others = sumTotals(day.items.filter((i) => i.slot !== slot).map((i) => itemTotals(i.foodId, i.factor)))
  const cap = minus(dayLimit(ctx), others)
  return ALL_FACTORS.filter((x) => x <= prefer).reverse().find((x) => within(itemTotals(foodId, x), cap)) ?? null
}

/**
 * Puts a dish into a day's meal while keeping the day inside every target. The chosen dish keeps a
 * full portion when possible – first as is, then by making the day's other meals smaller; only if
 * that fails does the dish itself get a smaller portion. Null when it can't fit at all.
 */
export function placeDish(
  menu: WeekMenu, ctx: MenuContext, date: string, slot: Slot, foodId: string,
): { menu: WeekMenu; factor: number; shrunk: boolean } | null {
  const day = menu.days.find((d) => d.date === date)
  if (!day) return null
  const factor = fitPortion(ctx, day, slot, foodId)
  if (factor === 1) return { menu: swapItem(menu, date, slot, foodId, 1), factor, shrunk: false }
  const limit = minus(dayLimit(ctx), itemTotals(foodId, 1))
  const fitted = fitDay(day.items.filter((i) => i.slot !== slot), limit)
  if (within(sumTotals(fitted.map((i) => itemTotals(i.foodId, i.factor))), limit)) {
    const next = { ...menu, days: menu.days.map((d) => (d.date === date ? { ...d, items: fitted } : d)) }
    return { menu: swapItem(next, date, slot, foodId, 1), factor: 1, shrunk: true }
  }
  return factor === null ? null : { menu: swapItem(menu, date, slot, foodId, factor), factor, shrunk: false }
}

/** Shrinks portions on days that went over the budget (e.g. after a saved dish was edited). */
export function refitMenu(menu: WeekMenu, ctx: MenuContext): WeekMenu {
  const limit = dayLimit(ctx)
  return { ...menu, days: menu.days.map((d) => (within(dayTotals(d), limit) ? d : { ...d, items: fitDay(d.items, limit) })) }
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

/** The day's upper limits: kcal plus protein/carb/fat targets (unknown ones are unlimited). */
export function dayLimit(ctx: Pick<MenuContext, 'kcal' | 'proteinG' | 'carbG' | 'fatG'>): Totals {
  return { kcal: ctx.kcal, protein: ctx.proteinG, carb: ctx.carbG ?? Infinity, fat: ctx.fatG ?? Infinity }
}

/** Share of later meals' budget held back while picking an earlier meal. */
const RESERVE = 0.7

const KEYS = ['kcal', 'protein', 'carb', 'fat'] as const
export function within(t: Totals, cap: Totals): boolean {
  return KEYS.every((k) => t[k] <= cap[k])
}
function minus(a: Totals, b: Totals): Totals {
  return { kcal: a.kcal - b.kcal, protein: a.protein - b.protein, carb: a.carb - b.carb, fat: a.fat - b.fat }
}
function scale(a: Totals, x: number): Totals {
  return { kcal: a.kcal * x, protein: a.protein * x, carb: a.carb * x, fat: a.fat * x }
}

/** Shrinks portions until the day is inside every limit (safety net after picking meals). */
export function fitDay(items: MenuItem[], limit: Totals): MenuItem[] {
  let out = items
  for (let guard = 0; guard < 40; guard++) {
    const t = sumTotals(out.map((i) => itemTotals(i.foodId, i.factor)))
    const over = KEYS.filter((k) => t[k] > limit[k])
    if (!over.length) return out
    // Worst overshoot (relative), then shrink the item that contributes most to it.
    const k = over.sort((a, b) => t[b] / limit[b] - t[a] / limit[a])[0]
    const shrinkable = out.filter((i) => ALL_FACTORS.some((x) => x < i.factor))
    if (!shrinkable.length) return out
    const worst = shrinkable.sort((a, b) => itemTotals(b.foodId, b.factor)[k] - itemTotals(a.foodId, a.factor)[k])[0]
    const next = [...ALL_FACTORS].reverse().find((x) => x < worst.factor)!
    out = out.map((i) => (i === worst ? { ...i, factor: next } : i))
  }
  return out
}

/** Enlarges portions step by step while the day stays inside every limit, to get close to the kcal target. */
export function fillDay(items: MenuItem[], limit: Totals, diet?: DietId): MenuItem[] {
  let out = items
  for (let guard = 0; guard < 40; guard++) {
    const t = sumTotals(out.map((i) => itemTotals(i.foodId, i.factor)))
    if (t.kcal >= limit.kcal * 0.97) return out
    let best: { item: MenuItem; factor: number; gain: number } | null = null
    for (const i of out) {
      const next = ALL_FACTORS.find((x) => x > i.factor)
      const f = getFood(i.foodId)
      if (!next || !f || (diet && !fitsDiet(f, diet, i.slot, next))) continue
      const added = minus(itemTotals(i.foodId, next), itemTotals(i.foodId, i.factor))
      if (!within(sumTotals([t, added]), limit)) continue
      // Prefer growing protein-rich items, then the larger kcal step.
      const gain = added.kcal + added.protein * 8
      if (!best || gain > best.gain) best = { item: i, factor: next, gain }
    }
    if (!best) return out
    const b = best
    out = out.map((i) => (i === b.item ? { ...i, factor: b.factor } : i))
  }
  return out
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
    carbG: plan.macros.carbG,
    fatG: plan.macros.fatG,
    diet: plan.recommendedDiet.id,
    animalFoods: p.animalFoods,
    dislikes: p.dislikes,
    dislikedFoods: feedback.disliked,
    likedFoods: feedback.liked,
    cookingTime: p.cookingTime,
    mealsPerDay: p.mealsPerDay,
    canSkipBreakfast: p.canSkipBreakfast,
    hungerTime: p.hungerTime,
    mealStyle: p.mealStyle ?? DEFAULT_STYLES,
    mealSlots: p.mealSlots,
    likes: p.likes ?? [],
  }
}
