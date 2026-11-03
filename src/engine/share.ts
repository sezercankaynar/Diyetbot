// What one partner shares with the other: a small summary of a day, built from the diary and the
// day's log. Only what the user allows goes in (foods, weight).
import type { DailyLog } from './coach'
import type { DiaryEntry } from './diary'
import { getFood, type Slot } from './foods'
import { itemTotals, plateName, sumTotals } from './menu'
import type { WeighIn } from './types'
import { addDays } from './menu'

export interface SharePrefs {
  /** What was eaten (meal by meal), not only the totals. */
  foods: boolean
  /** Change of the weekly weight average. */
  weightChange: boolean
  /** The weight itself. */
  weightExact: boolean
}
export const DEFAULT_SHARE_PREFS: SharePrefs = { foods: true, weightChange: true, weightExact: false }

export interface ShareDayData {
  v: 1
  logged: boolean
  kcal: number
  target: number
  protein: number
  proteinTarget: number
  carb: number
  fat: number
  meals?: { label: string; foods: string[]; kcal: number }[]
  extras?: string[]
  water: number
  waterTarget: number
  workout: boolean
  steps?: number
  stepTarget: number
  /** kg, change of the 7-day weight average against the week before. */
  weightChange?: number
  weightKg?: number
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

/** Change of the 7-day weight average vs the 7 days before (needs weigh-ins in both). */
export function weightTrend(logs: WeighIn[], date: string): number | null {
  const inRange = (from: string, to: string) => logs.filter((l) => l.date > from && l.date <= to).map((l) => l.kg)
  const now = avg(inRange(addDays(date, -7), date))
  const before = avg(inRange(addDays(date, -14), addDays(date, -7)))
  return now !== null && before !== null ? Math.round((now - before) * 10) / 10 : null
}

export function shareDay(o: {
  date: string
  diary: DiaryEntry[]
  log: DailyLog | undefined
  target: number
  proteinTarget: number
  waterTarget: number
  stepTarget: number
  meals: { slot: Slot; label: string }[]
  logs: WeighIn[]
  prefs: SharePrefs
}): ShareDayData {
  const entries = o.diary.filter((e) => e.date === o.date)
  const t = sumTotals(entries.map((e) => itemTotals(e.foodId, e.factor)))
  const name = (id: string) => plateName(getFood(id)?.name ?? '')
  const data: ShareDayData = {
    v: 1, logged: entries.length > 0,
    kcal: t.kcal, target: o.target, protein: t.protein, proteinTarget: o.proteinTarget, carb: t.carb, fat: t.fat,
    water: o.log?.water ?? 0, waterTarget: o.waterTarget, workout: !!o.log?.workout,
    ...(o.log?.steps ? { steps: o.log.steps } : {}), stepTarget: o.stepTarget,
  }
  if (o.prefs.foods) {
    data.meals = o.meals
      .map((m) => {
        const list = entries.filter((e) => e.menuSlot === m.slot)
        return { label: m.label, foods: list.map((e) => name(e.foodId)), kcal: sumTotals(list.map((e) => itemTotals(e.foodId, e.factor))).kcal }
      })
      .filter((m) => m.foods.length)
    data.extras = entries.filter((e) => !e.menuSlot).map((e) => name(e.foodId))
  }
  if (o.prefs.weightChange) {
    const w = weightTrend(o.logs, o.date)
    if (w !== null) data.weightChange = w
  }
  if (o.prefs.weightExact) {
    const last = [...o.logs].filter((l) => l.date <= o.date).sort((a, b) => a.date.localeCompare(b.date)).at(-1)
    if (last) data.weightKg = last.kg
  }
  return data
}

/** A logged day within ±10 % of its kcal target counts as "on target". */
export const onTarget = (d: Pick<ShareDayData, 'logged' | 'kcal' | 'target'>): boolean =>
  d.logged && d.target > 0 && Math.abs(d.kcal - d.target) <= d.target * 0.1
