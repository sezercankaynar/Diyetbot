import type { Slot } from './foods'
import { itemTotals, sumTotals, type Totals } from './menu'

/** One eaten item on a given day. */
export interface DiaryEntry {
  id: string
  date: string
  foodId: string
  factor: number
  /** The meal it was eaten as (ticked menu meal, or what was eaten instead of it). */
  menuSlot?: Slot
  /** Logged by ticking the menu plate (not picked by the user). */
  fromMenu?: boolean
}

export function diaryTotals(entries: DiaryEntry[], date: string): Totals {
  return sumTotals(entries.filter((e) => e.date === date).map((e) => itemTotals(e.foodId, e.factor)))
}
