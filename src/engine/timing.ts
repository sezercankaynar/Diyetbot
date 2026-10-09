// Meal timing: time windows for each planned meal and simple, evidence-informed tips.
import type { SlotPlan } from './menu'
import type { MealTimes } from './types'

export const DEFAULT_MEAL_TIMES: MealTimes = {
  breakfast: '08:00', lunch: '13:00', snack: '16:30', nightSnack: '21:30', dinner: '19:30',
}

const toMin = (t: string): number => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t)
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN
}
const toTime = (min: number): string => {
  const x = ((min % 1440) + 1440) % 1440
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`
}

/** Start time of a planned meal (night snack has its own time). */
export function mealStart(sp: Pick<SlotPlan, 'slot' | 'label'>, times: MealTimes = DEFAULT_MEAL_TIMES): string {
  if (sp.slot === 'night') return times.nightSnack
  return times[sp.slot]
}

/** "08:00–09:00" style window (main meals 60 min, snacks 30 min). */
export function mealWindow(sp: Pick<SlotPlan, 'slot' | 'label'>, times: MealTimes = DEFAULT_MEAL_TIMES): string {
  const start = toMin(mealStart(sp, times))
  if (Number.isNaN(start)) return ''
  return `${toTime(start)}–${toTime(start + (sp.slot === 'snack' || sp.slot === 'night' ? 30 : 60))}`
}

/** Tips about the chosen schedule. */
export function timingTips(plan: Pick<SlotPlan, 'slot' | 'label'>[], times: MealTimes = DEFAULT_MEAL_TIMES): string[] {
  const starts = plan.map((sp) => toMin(mealStart(sp, times))).filter((x) => !Number.isNaN(x)).sort((a, b) => a - b)
  const tips: string[] = []
  if (!starts.length) return tips
  const last = starts[starts.length - 1]
  if (last >= 22 * 60) tips.push('Son öğünün 22:00 sonrasında; mümkünse uyumadan en az 2–3 saat önce yemeyi bitir.')
  for (let i = 1; i < starts.length; i++) {
    if (starts[i] - starts[i - 1] > 7 * 60) {
      tips.push(`${toTime(starts[i - 1])} ile ${toTime(starts[i])} arasında 7 saatten uzun boşluk var; aşırı acıkmamak için arada küçük bir ara öğün düşün.`)
      break
    }
  }
  const dinner = toMin(times.dinner)
  if (!Number.isNaN(dinner) && dinner >= 21 * 60) tips.push('Akşam yemeği geç: günün büyük öğününü daha erken saate almak tokluğu ve uykuyu destekleyebilir.')
  return tips
}
