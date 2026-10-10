// Weekly menu planner: dietitian-style Turkish plates tuned to the day's kcal and macro targets.
//
// 1. The week's lunches and dinners get a main-dish kind by a rotation that follows TÜBER: fish twice
//    a week (at dinner), dry legumes 2–3 times, mostly sulu sebze yemekleri, some chicken, little red meat.
// 2. Each meal becomes a plate: main + (soup) + pilav or bread + yoghurt/cacık/ayran + salad.
//    Breakfast and snacks come from templates (yumurta–peynir–zeytin–ekmek, meyve + ceviz, …).
// 3. Each day is tuned by changing amounts within allowed household steps (bread slices, pilav spoons,
//    yoghurt, portion size) so the day lands just under the kcal target with protein, carbs and fat close
//    to their targets, and each meal keeps roughly its share of the day.
import { getFood, isSnackSlot, type Food, type Slot } from './foods'
import { fitsAnimal, fitsDislikes } from './foodRules'
import { likeMatches } from './foodKeys'
import {
  BREAKFASTS, FRUITS, LEGUME_SOUPS, LIGHT_MAINS, MAINS, NIGHT_SNACKS, SNACKS, SOUPS, isPart, partLevels, partRole,
  type CarbSide, type MainDef, type MainKind, type Template,
} from './plateParts'
import { fitDay, itemTotals, mealTotals, slotPlan, sumTotals, type MenuContext, type MenuItem, type Part, type SlotPlan, type Totals } from './menu'

export type Rand = () => number

const DEFAULT_STYLES = { breakfast: 'normal', lunch: 'normal', dinner: 'normal' } as const

// ---------------------------------------------------------------------------------------------
// Filters

function allowed(ctx: MenuContext, id: string): boolean {
  const f = getFood(id)
  return !!f && !f.hidden && fitsAnimal(f, ctx.animalFoods) && fitsDislikes(f, ctx.dislikes) && !ctx.dislikedFoods.includes(id)
}
const lowCarb = (ctx: MenuContext) => ctx.diet === 'keto' || ctx.diet === 'lowcarb'

function mainOk(ctx: MenuContext, m: MainDef): boolean {
  if (!allowed(ctx, m.id)) return false
  const f = getFood(m.id)!
  if (ctx.diet === 'keto') return f.carb <= 15 && m.kind !== 'baklagil'
  if (ctx.diet === 'lowcarb') return m.carb !== 'kendi' || f.carb <= 30
  return true
}

/** The user's own dishes that may be suggested at lunch/dinner. */
function ownMains(ctx: MenuContext, all: Food[]): MainDef[] {
  return all
    .filter((f) => f.id.startsWith('ev-') && !f.hidden && !f.noMenu && (f.slots.includes('lunch') || f.slots.includes('dinner')))
    .filter((f) => allowed(ctx, f.id))
    .map((f) => ({ id: f.id, kind: kindOf(f), carb: 'ekmek' as CarbSide }))
}

function kindOf(f: Food): MainKind {
  if (f.tags.includes('fish')) return 'balik'
  if (f.tags.includes('legume')) return 'baklagil'
  if (f.tags.includes('chicken')) return 'tavuk'
  if (f.tags.includes('redmeat')) return 'kirmizi'
  return 'sebze'
}

// ---------------------------------------------------------------------------------------------
// Weekly rotation of main-dish kinds

interface MainSlot {
  day: number
  slot: Slot
}

/** How many of each kind the week's main meals get. */
export function kindQuota(ctx: MenuContext, n: number, available: Set<MainKind>): Map<MainKind, number> {
  const q = new Map<MainKind, number>()
  const put = (k: MainKind, c: number) => available.has(k) && c > 0 && q.set(k, c)
  const fish = ctx.animalFoods === 'pescatarian' ? 3 : 2
  put('balik', Math.min(fish, Math.floor(n / 3)))
  if (ctx.diet !== 'keto') put('baklagil', ctx.diet === 'plant' ? Math.min(4, Math.ceil(n / 3)) : n >= 12 ? 3 : n >= 4 ? 2 : 1)
  // A high protein target (≥ 25 % of kcal) needs more meat, chicken and fish meals.
  const highProtein = (ctx.proteinG * 4) / ctx.kcal >= 0.25
  const lean = ctx.diet === 'med' || ctx.diet === 'dash' || ctx.diet === 'plant'
  put('tavuk', (n >= 10 ? 3 : n >= 5 ? 2 : 1) + (highProtein && n >= 7 ? 1 : 0))
  put('kirmizi', (lean ? (n >= 10 ? 1 : 0) : n >= 10 ? 2 : 1) + (highProtein && n >= 10 && !lean ? 1 : 0))
  put('vejetaryen', !available.has('tavuk') ? Math.min(2, Math.floor(n / 4)) : 0)
  const used = [...q.values()].reduce((a, b) => a + b, 0)
  const rest = Math.max(0, n - used)
  if (available.has('sebze')) q.set('sebze', (q.get('sebze') ?? 0) + rest)
  else if (rest) {
    // No vegetable dishes left (strict dislikes): spread over what's there.
    const kinds = [...available]
    for (let i = 0; i < rest; i++) q.set(kinds[i % kinds.length], (q.get(kinds[i % kinds.length]) ?? 0) + 1)
  }
  // Sulu sebze yemekleri stay the backbone of the week (≥ 30 % of main meals): take room from red meat, then chicken.
  const sebzeMin = available.has('sebze') ? Math.round(n * 0.3) : 0
  for (const k of ['kirmizi', 'tavuk', 'kirmizi', 'tavuk'] as MainKind[]) {
    if ((q.get('sebze') ?? 0) >= sebzeMin) break
    if ((q.get(k) ?? 0) > 1) {
      q.set(k, q.get(k)! - 1)
      q.set('sebze', (q.get('sebze') ?? 0) + 1)
    }
  }
  return q
}

function assignKinds(slots: MainSlot[], quota: Map<MainKind, number>, rand: Rand): MainKind[] {
  const left = new Map(quota)
  const out: MainKind[] = []
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i]
    const sameDay = slots.map((x, j) => (j < i && x.day === s.day ? out[j] : null)).filter(Boolean)
    const prevSameSlot = slots.findIndex((x) => x.day === s.day - 1 && x.slot === s.slot)
    const remainingSlots = slots.length - i
    let best: MainKind | null = null
    let bestScore = -Infinity
    for (const [k, c] of left) {
      if (c <= 0) continue
      let score = c / remainingSlots + rand() * 0.3 // spread kinds over the week
      if (sameDay.includes(k) && k !== 'sebze') score -= 3
      if (prevSameSlot >= 0 && out[prevSameSlot] === k && k !== 'sebze') score -= 1
      if (k === 'balik' && s.slot !== 'dinner') score -= 1.5
      if (score > bestScore) {
        bestScore = score
        best = k
      }
    }
    const k = best ?? 'sebze'
    out.push(k)
    left.set(k, (left.get(k) ?? 1) - 1)
  }
  return out
}

// ---------------------------------------------------------------------------------------------
// Plates

interface PlatePart {
  foodId: string
  amount: number
  levels: number[]
}
interface Plate {
  slot: Slot
  title?: string
  parts: PlatePart[]
}

/** Most bread a meal gets: 2 slices (3 at breakfast, the main bread meal of a Turkish day). */
const MAX_BREAD = 2
const MAX_BREAD_BREAKFAST = 3

/** A plate part. Parts put in with an amount stay in (≥ 1 step); amount 0 marks an optional part. */
function part(foodId: string, amount: number, levels?: number[], maxBread = MAX_BREAD): PlatePart {
  let lv = levels ?? partLevels(foodId)
  if (foodId === 'pc-ekmek') lv = lv.filter((l) => l <= maxBread)
  if (amount > 0) lv = lv.filter((l) => l > 0)
  return { foodId, amount: lv.includes(amount) ? amount : nearest(lv, amount), levels: lv }
}
const nearest = (lv: number[], x: number) => lv.reduce((a, b) => (Math.abs(b - x) < Math.abs(a - x) ? b : a))
const pick = <T>(list: T[], rand: Rand): T => list[Math.floor(rand() * list.length)]

/** Least used so far this week, random among equals (and counted). */
function pickLeastUsed(list: string[], used: Map<string, number> | undefined, rand: Rand): string {
  if (!used) return pick(list, rand)
  const min = Math.min(...list.map((x) => used.get(x) ?? 0))
  const x = pick(list.filter((y) => (used.get(y) ?? 0) === min), rand)
  used.set(x, (used.get(x) ?? 0) + 1)
  return x
}

function mainPlate(
  ctx: MenuContext, sp: SlotPlan, main: MainDef, rand: Rand, opts: { soup?: boolean; fruit?: string; used?: Map<string, number> } = {},
): Plate {
  const parts: PlatePart[] = [part(main.id, sp.style === 'hearty' ? 1.25 : 1)]
  const isFish = main.kind === 'balik'
  const soupChance = sp.style === 'hearty' ? 0.8 : sp.slot === 'lunch' ? 0.5 : 0.3
  const wantSoup = opts.soup ?? rand() < soupChance
  if (wantSoup) {
    const soups = SOUPS.filter((id) => allowed(ctx, id) && !(main.kind === 'baklagil' && LEGUME_SOUPS.includes(id)))
      .filter((id) => !lowCarb(ctx) || getFood(id)!.carb <= 12)
    // The main stays first (it names the plate); the soup is listed right after it.
    if (soups.length) parts.push(part(pickLeastUsed(soups, opts.used, rand), 1, [1]))
  }
  if (!(ctx.diet === 'keto')) {
    if (main.carb === 'pilav') {
      // Kuru fasulye and nohut traditionally come with pirinç pilavı; most others with bulgur.
      const rice = main.kind === 'baklagil' && /fasulye|nohut/.test(main.id) ? 0.7 : 0.3
      const grain = rand() < rice ? 'pc-pirinc' : 'pc-bulgur'
      if (allowed(ctx, grain)) parts.push(part(grain, 6))
      // Optional slice of bread next to the pilav.
      if (allowed(ctx, 'pc-ekmek')) parts.push(part('pc-ekmek', allowed(ctx, grain) ? 0 : 1, allowed(ctx, grain) ? [0, 1] : undefined))
    } else {
      if (allowed(ctx, 'pc-ekmek')) parts.push(part('pc-ekmek', main.carb === 'kendi' ? 0 : 1))
      // Optional bulgur pilavı with vegetable dishes (not with dishes that have their own rice/potato).
      if (main.carb === 'ekmek' && main.kind !== 'balik' && allowed(ctx, 'pc-bulgur')) parts.push(part('pc-bulgur', 0, [0, 4, 6]))
    }
  }
  // Fish isn't served with yoghurt in Turkish cooking.
  if (!isFish) {
    const dairy = ['pc-yogurt', 'pc-cacik', 'pc-ayran'].filter((id) => allowed(ctx, id))
    const r = rand()
    const d = r < 0.5 ? dairy[0] : r < 0.8 ? (dairy[1] ?? dairy[0]) : (dairy[2] ?? dairy[0])
    if (d) parts.push(part(d, 1))
  }
  const salads = isFish ? ['pc-roka', 'pc-salata'] : ['pc-salata', 'pc-coban']
  const salad = salads.find((id, i) => allowed(ctx, id) && (i > 0 || rand() < 0.6)) ?? salads.find((id) => allowed(ctx, id))
  if (salad) parts.push(part(salad, 1))
  // Optional fruit after the meal (TÜBER: 2–3 portions of fruit a day).
  if (opts.fruit && ctx.diet !== 'keto' && allowed(ctx, opts.fruit)) parts.push(part(opts.fruit, 0, [0, 1]))
  return { slot: sp.slot, title: getFood(main.id)?.name, parts }
}

function lightPlate(ctx: MenuContext, sp: SlotPlan, rand: Rand, avoid: Set<string>, used?: Map<string, number>): Plate {
  const mains = LIGHT_MAINS.filter((id) => allowed(ctx, id) && !avoid.has(id) && (!lowCarb(ctx) || getFood(id)!.carb <= 20))
  const soups = SOUPS.filter((id) => allowed(ctx, id) && (!lowCarb(ctx) || getFood(id)!.carb <= 12))
  const useSoup = soups.length && (rand() < 0.5 || !mains.length)
  const parts: PlatePart[] = []
  let title: string | undefined
  if (useSoup) {
    const soup = pickLeastUsed(soups, used, rand)
    parts.push(part(soup, 1, [1]))
    title = `${getFood(soup)!.name.replace(/ \(1 kase\)/, '')} + yoğurt`
    if (allowed(ctx, 'pc-yogurt')) parts.push(part('pc-yogurt', 1))
  } else if (mains.length) {
    const m = pick(mains, rand)
    parts.push(part(m, 1, [0.75, 1, 1.25]))
    title = getFood(m)!.name
    const fish = getFood(m)!.tags.includes('fish')
    if (!fish && allowed(ctx, 'pc-ayran')) parts.push(part('pc-ayran', 1, [1]))
  }
  if (ctx.diet !== 'keto' && allowed(ctx, 'pc-ekmek')) parts.push(part('pc-ekmek', 1))
  if (useSoup && allowed(ctx, 'pc-salata')) parts.push(part('pc-salata', 1))
  return { slot: sp.slot, title, parts }
}

function templatePlate(ctx: MenuContext, sp: SlotPlan, t: Template, fruit: string): Plate {
  const parts: PlatePart[] = []
  for (const tp of t.parts) {
    let id = tp.id
    if (partRole(id) === 'fruit' && t.id !== 'b-yulaf') id = fruit
    if (!allowed(ctx, id)) continue
    // Parts the template starts with stay in (≥ 1 unit); optional ones (amount 0) may be added.
    // Optional extras stay small (an egg next to oats, a few walnuts).
    const levels = !isPart(id) ? [1, 1.5] : tp.amount === 0 ? partLevels(id).slice(0, 2) : undefined
    parts.push(part(id, tp.amount, levels, sp.slot === 'breakfast' ? MAX_BREAD_BREAKFAST : MAX_BREAD))
  }
  return { slot: sp.slot, title: t.title, parts }
}

function pickTemplate(ctx: MenuContext, list: Template[], used: Map<string, number>, rand: Rand, avoid?: string): Template | null {
  const ok = list.filter((t) => {
    if (lowCarb(ctx) && !t.lowCarb) return false
    if (t.maxPerWeek !== undefined && (used.get(t.id) ?? 0) >= t.maxPerWeek) return false
    // The template's first part is its core (eggs, oats, fruit …): it must be allowed.
    return allowed(ctx, t.parts[0].id) && t.id !== avoid
  })
  if (!ok.length) return null
  // Least used first, random among equals.
  const min = Math.min(...ok.map((t) => used.get(t.id) ?? 0))
  const t = pick(ok.filter((x) => (used.get(x.id) ?? 0) === min), rand)
  used.set(t.id, (used.get(t.id) ?? 0) + 1)
  return t
}

// ---------------------------------------------------------------------------------------------
// Tuning amounts to the day's targets

export function plateTotals(p: Plate): Totals {
  return sumTotals(p.parts.map((x) => itemTotals(x.foodId, x.amount)))
}

/** How far a day is from its targets (lower is better). Going over the kcal target is not allowed. */
export function dayLoss(plates: Plate[], ctx: MenuContext, shares: Map<Slot, number>): number {
  const meals = plates.map(plateTotals)
  const t = sumTotals(meals)
  const K = ctx.kcal
  let loss = 0
  if (t.kcal > K) loss += 100 + (t.kcal - K) / 10
  const under = Math.max(0, K - t.kcal) / K
  // Filling the day matters most: a list that leaves the person hungry won't be followed.
  loss += 150 * under * under + (under > 0.03 ? 10 * (under - 0.03) : 0)
  const rel = (x: number, target: number | undefined) => (target ? (x - target) / target : 0)
  const p = rel(t.protein, ctx.proteinG)
  loss += (p < 0 ? 40 : 12) * p * p
  const c = rel(t.carb, ctx.carbG)
  loss += (c > 0 ? 25 : 10) * c * c
  const f = rel(t.fat, ctx.fatG)
  loss += (f > 0 ? 40 : 10) * f * f
  // Each meal keeps roughly its share (light lunch stays light, hearty dinner stays hearty).
  plates.forEach((pl, i) => {
    const share = shares.get(pl.slot) ?? 0
    const d = (meals[i].kcal - share * K) / K
    loss += 80 * d * d
  })
  // Prefer the usual amounts (small nudge).
  for (const pl of plates) for (const x of pl.parts) loss += 0.0005 * Math.abs(x.levels.indexOf(x.amount) - x.levels.indexOf(nearest(x.levels, 1)))
  return loss
}

/** Coordinate descent over the allowed amounts of the given plates' parts (others stay as they are). */
export function tunePlates(plates: Plate[], ctx: MenuContext, shares: Map<Slot, number>, free: Set<Slot> | null = null): Plate[] {
  const cur = plates.map((p) => ({ ...p, parts: p.parts.map((x) => ({ ...x })) }))
  let best = dayLoss(cur, ctx, shares)
  for (let pass = 0; pass < 12; pass++) {
    let improved = false
    for (const pl of cur) {
      if (free && !free.has(pl.slot)) continue
      for (const x of pl.parts) {
        let bestLv = x.amount
        for (const lv of x.levels) {
          if (lv === bestLv) continue
          x.amount = lv
          const l = dayLoss(cur, ctx, shares)
          if (l < best - 1e-9) {
            best = l
            bestLv = lv
            improved = true
          }
        }
        x.amount = bestLv
      }
    }
    if (!improved) break
  }
  return cur
}

function toItem(p: Plate): MenuItem | null {
  const parts: Part[] = p.parts.filter((x) => x.amount > 0).map((x) => ({ foodId: x.foodId, factor: x.amount }))
  if (!parts.length) return null
  const [main, ...sides] = parts
  return { slot: p.slot, foodId: main.foodId, factor: main.factor, ...(sides.length ? { sides } : {}), ...(p.title ? { title: p.title } : {}) }
}

/** A menu item back into a tunable plate. */
export function toPlate(i: MenuItem): Plate {
  const parts = [{ foodId: i.foodId, factor: i.factor }, ...(i.sides ?? [])]
  return {
    slot: i.slot,
    title: i.title,
    parts: parts.map((x) => {
      const lv = SOUPS.includes(x.foodId) ? [1] : partLevels(x.foodId)
      return { foodId: x.foodId, amount: x.factor, levels: lv.includes(x.factor) ? lv : [...lv, x.factor].sort((a, b) => a - b) }
    }),
  }
}

export function sharesOf(ctx: MenuContext): Map<Slot, number> {
  return new Map(slotPlan(ctx).map((s) => [s.slot, s.share]))
}

// ---------------------------------------------------------------------------------------------
// The week

export function planWeek(ctx: MenuContext, all: Food[], rand: Rand): MenuItem[][] {
  const plan = slotPlan({ ...ctx, mealStyle: ctx.mealStyle ?? DEFAULT_STYLES })
  const shares = sharesOf(ctx)
  const styleOf = (sp: SlotPlan) => sp.style

  const mainSlots: MainSlot[] = []
  for (let d = 0; d < 7; d++) for (const sp of plan) if ((sp.slot === 'lunch' || sp.slot === 'dinner') && styleOf(sp) !== 'light') mainSlots.push({ day: d, slot: sp.slot })

  const mains = [...MAINS.filter((m) => mainOk(ctx, m)), ...ownMains(ctx, all)]
  const byKind = new Map<MainKind, MainDef[]>()
  for (const m of mains) byKind.set(m.kind, [...(byKind.get(m.kind) ?? []), m])
  const quota = kindQuota(ctx, mainSlots.length, new Set(byKind.keys()))
  const kinds = assignKinds(mainSlots, quota, rand)

  const usedMains = new Map<string, number>()
  const usedTemplates = new Map<string, number>()
  const usedLight = new Set<string>()
  const usedSoups = new Map<string, number>()
  const week: MenuItem[][] = []
  let fruitIdx = Math.floor(rand() * FRUITS.length)
  const nextFruit = () => {
    const ok = FRUITS.filter((id) => allowed(ctx, id))
    if (!ok.length) return FRUITS[0]
    fruitIdx++
    return ok[fruitIdx % ok.length]
  }

  for (let d = 0; d < 7; d++) {
    const plates: Plate[] = []
    let lastSnack: string | undefined
    for (const sp of plan) {
      if (sp.slot === 'breakfast') {
        const t = pickTemplate(ctx, BREAKFASTS, usedTemplates, rand)
        if (t) plates.push(templatePlate(ctx, sp, t, nextFruit()))
      } else if (isSnackSlot(sp.slot)) {
        const list = sp.slot === 'night' ? NIGHT_SNACKS : SNACKS
        const t = pickTemplate(ctx, list, usedTemplates, rand, lastSnack) ?? pickTemplate(ctx, list, new Map(), rand)
        if (t) {
          lastSnack = t.id
          plates.push(templatePlate(ctx, sp, t, nextFruit()))
        }
      } else if (styleOf(sp) === 'light') {
        const pl = lightPlate(ctx, sp, rand, usedLight, usedSoups)
        const main = pl.parts[0]?.foodId
        if (main && LIGHT_MAINS.includes(main)) usedLight.add(main)
        if (usedLight.size >= LIGHT_MAINS.length) usedLight.clear()
        plates.push(pl)
      } else {
        const idx = mainSlots.findIndex((m) => m.day === d && m.slot === sp.slot)
        const kind = kinds[idx]
        const todays = new Set(plates.map((p) => p.parts[0]?.foodId))
        const main = chooseMain(ctx, byKind.get(kind) ?? mains, usedMains, todays, rand) ?? chooseMain(ctx, mains, usedMains, todays, rand)
        if (!main) continue
        usedMains.set(main.id, (usedMains.get(main.id) ?? 0) + 1)
        plates.push(mainPlate(ctx, sp, main, rand, { fruit: nextFruit(), used: usedSoups }))
      }
    }
    const tuned = tunePlates(plates, ctx, shares)
    const items = tuned.map(toItem).filter((x): x is MenuItem => !!x)
    // Never over the kcal target: if the plates' smallest sensible amounts still are, trim further.
    const kcalOnly = { kcal: ctx.kcal, protein: Infinity, carb: Infinity, fat: Infinity }
    week.push(sumTotals(items.map(mealTotals)).kcal > ctx.kcal ? fitDay(items, kcalOnly) : items)
  }
  return week
}

function mainScore(ctx: MenuContext, m: MainDef, used: Map<string, number>): number {
  const f = getFood(m.id)!
  return (
    -3 * (used.get(m.id) ?? 0) +
    (ctx.likedFoods.includes(m.id) ? 1.2 : 0) +
    Math.min(2, likeMatches(f, ctx.likes ?? [])) * 0.5 +
    (m.id.startsWith('ev-') ? 0.4 : 0) +
    (ctx.cookingTime === 'low' ? (m.quick ? 2 : 0) : ctx.cookingTime === 'mid' && m.quick ? 0.3 : 0)
  )
}

function chooseMain(ctx: MenuContext, pool: MainDef[], used: Map<string, number>, today: Set<string | undefined>, rand: Rand): MainDef | null {
  const ok = pool.filter((m) => !today.has(m.id))
  if (!ok.length) return null
  let best: MainDef | null = null
  let bestScore = -Infinity
  for (const m of ok) {
    const s = mainScore(ctx, m, used) + rand() * 0.8
    if (s > bestScore) {
      bestScore = s
      best = m
    }
  }
  return best
}

// ---------------------------------------------------------------------------------------------
// Alternatives for one meal of a day

export function alternativePlates(ctx: MenuContext, day: MenuItem[], slot: Slot, n: number, rand: Rand): MenuItem[] {
  const sp = slotPlan(ctx).find((s) => s.slot === slot) ?? { slot, label: '', share: 0.3, style: 'normal' as const }
  const shares = sharesOf(ctx)
  const others = day.filter((i) => i.slot !== slot).map(toPlate)
  const current = day.find((i) => i.slot === slot)
  const inDay = new Set(day.map((i) => i.foodId))
  const candidates: Plate[] = []
  if (slot === 'breakfast' || isSnackSlot(slot)) {
    const list = slot === 'breakfast' ? BREAKFASTS : slot === 'night' ? NIGHT_SNACKS : SNACKS
    for (const t of list) {
      if (lowCarb(ctx) && !t.lowCarb) continue
      if (!allowed(ctx, t.parts[0].id) || current?.title === t.title) continue
      candidates.push(templatePlate(ctx, sp, t, FRUITS[candidates.length % FRUITS.length]))
    }
  } else if (sp.style === 'light') {
    for (let k = 0; k < 8; k++) candidates.push(lightPlate(ctx, sp, rand, new Set([...inDay])))
  } else {
    const mains = [...MAINS.filter((m) => mainOk(ctx, m)), ...ownMains(ctx, [])].filter((m) => !inDay.has(m.id))
    const curKind = current ? MAINS.find((m) => m.id === current.foodId)?.kind : undefined
    const sorted = mains
      .map((m) => ({ m, s: mainScore(ctx, m, new Map()) + (m.kind === curKind ? 0.5 : 0) + rand() }))
      .sort((a, b) => b.s - a.s)
    // A mix: a couple of the same kind, then other kinds.
    const seen = new Map<MainKind, number>()
    for (const { m } of sorted) {
      if ((seen.get(m.kind) ?? 0) >= 2) continue
      seen.set(m.kind, (seen.get(m.kind) ?? 0) + 1)
      const hadSoup = !!current?.sides?.some((x) => SOUPS.includes(x.foodId)) || (!!current && SOUPS.includes(current.foodId))
      candidates.push(mainPlate(ctx, sp, m, rand, { soup: hadSoup, fruit: FRUITS[candidates.length % FRUITS.length] }))
      if (candidates.length >= n * 2) break
    }
  }
  const scored = candidates.map((c) => {
    const tuned = tunePlates([...others, c], ctx, shares, new Set([slot]))
    const plate = tuned[tuned.length - 1]
    return { item: toItem(plate), loss: dayLoss(tuned, ctx, shares) }
  })
  return scored
    .filter((x): x is { item: MenuItem; loss: number } => !!x.item && x.item.title !== current?.title)
    .sort((a, b) => a.loss - b.loss)
    .slice(0, n)
    .map((x) => x.item)
}
