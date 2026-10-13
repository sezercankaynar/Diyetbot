// What the user actually eats, read from the diary: frequent foods for quick adding, saved meals,
// and their usual breakfasts/snacks and main dishes, which the next menus take up.
import type { DiaryEntry } from './diary'
import { getFood, type Slot } from './foods'
import { addDays, plateName, type Part } from './menu'

/** A meal the user saved to add again with one tap ("Benim kahvaltım"). */
export interface SavedMeal {
  id: string
  name: string
  slot?: Slot
  items: Part[]
}

/** A breakfast/snack the user eats regularly (or saved): menus offer it on some days. */
export interface OwnMeal {
  slot: Slot
  title: string
  parts: Part[]
}

const usable = (id: string) => {
  const f = getFood(id)
  return !!f && !f.hidden
}
// Menu plate parts (pc-…) mostly come from ticking a menu meal, so they don't tell what the user picks.
const picked = (id: string) => !id.startsWith('pc-') && usable(id)

/** Foods the user logs most (last 30 days), recent ones a bit first, with the amount used last time. */
export function frequentFoods(diary: DiaryEntry[], today: string, limit = 10): Part[] {
  const from = addDays(today, -30)
  const recent = addDays(today, -3)
  const score = new Map<string, number>()
  const last = new Map<string, { date: string; factor: number }>()
  for (const e of diary) {
    if (e.date < from || e.date > today || !picked(e.foodId)) continue
    score.set(e.foodId, (score.get(e.foodId) ?? 0) + 1 + (e.date >= recent ? 0.5 : 0))
    const l = last.get(e.foodId)
    if (!l || e.date >= l.date) last.set(e.foodId, { date: e.date, factor: e.factor })
  }
  return [...score]
    .sort((a, b) => b[1] - a[1] || (last.get(b[0])!.date > last.get(a[0])!.date ? 1 : -1))
    .slice(0, limit)
    .map(([foodId]) => ({ foodId, factor: last.get(foodId)!.factor }))
}

const SMALL_SLOTS: Slot[] = ['breakfast', 'snack', 'night']

/**
 * Breakfasts and snacks the user eats regularly: their saved meals, and the same set of foods logged
 * for that meal on ≥ 2 days in the last 3 weeks (when it isn't just a menu plate). At most 3 per meal.
 */
export function usualMeals(diary: DiaryEntry[], saved: SavedMeal[], today: string): OwnMeal[] {
  const out: OwnMeal[] = []
  const keyOf = (ids: string[]) => [...new Set(ids)].sort().join('+')
  const seen = new Set<string>()
  for (const m of saved) {
    if (!m.slot || !SMALL_SLOTS.includes(m.slot)) continue
    const parts = m.items.filter((x) => usable(x.foodId))
    if (!parts.length) continue
    seen.add(`${m.slot}|${keyOf(parts.map((x) => x.foodId))}`)
    out.push({ slot: m.slot, title: m.name, parts })
  }
  const from = addDays(today, -21)
  const meals = new Map<string, DiaryEntry[]>()
  for (const e of diary) {
    if (!e.menuSlot || !SMALL_SLOTS.includes(e.menuSlot) || e.date < from || e.date > today) continue
    const k = `${e.date}|${e.menuSlot}`
    meals.set(k, [...(meals.get(k) ?? []), e])
  }
  const combos = new Map<string, { slot: Slot; days: number; latest: DiaryEntry[]; date: string }>()
  for (const [k, entries] of meals) {
    const [date, slot] = k.split('|') as [string, Slot]
    if (!entries.some((e) => picked(e.foodId)) || !entries.every((e) => usable(e.foodId))) continue
    const ck = `${slot}|${keyOf(entries.map((e) => e.foodId))}`
    const c = combos.get(ck)
    if (!c) combos.set(ck, { slot, days: 1, latest: entries, date })
    else {
      c.days++
      if (date > c.date) Object.assign(c, { latest: entries, date })
    }
  }
  const bySlot = new Map<Slot, number>()
  for (const m of out) bySlot.set(m.slot, (bySlot.get(m.slot) ?? 0) + 1)
  for (const [ck, c] of [...combos].sort((a, b) => b[1].days - a[1].days)) {
    if (c.days < 2 || seen.has(ck) || (bySlot.get(c.slot) ?? 0) >= 3) continue
    const parts = c.latest.map((e) => ({ foodId: e.foodId, factor: e.factor }))
    const names = parts.map((x) => plateName(getFood(x.foodId)!.name)).slice(0, 3).join(', ')
    out.push({ slot: c.slot, title: names, parts })
    bySlot.set(c.slot, (bySlot.get(c.slot) ?? 0) + 1)
  }
  return out
}

/** Dishes eaten at lunch/dinner on ≥ 2 days in the last 3 weeks: menus favour them like liked dishes. */
export function usualMains(diary: DiaryEntry[], today: string): string[] {
  const from = addDays(today, -21)
  const days = new Map<string, Set<string>>()
  for (const e of diary) {
    if ((e.menuSlot !== 'lunch' && e.menuSlot !== 'dinner') || e.date < from || e.date > today) continue
    days.set(e.foodId, (days.get(e.foodId) ?? new Set()).add(e.date))
  }
  return [...days].filter(([, d]) => d.size >= 2).map(([id]) => id)
}
