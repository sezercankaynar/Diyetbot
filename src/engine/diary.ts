import type { Slot } from './foods'
import { itemTotals, sumTotals, type Totals } from './menu'

/** One eaten item on a given day. */
export interface DiaryEntry {
  id: string
  date: string
  foodId: string
  factor: number
  /** Set when the entry came from ticking a planned menu meal. */
  menuSlot?: Slot
}

export function diaryTotals(entries: DiaryEntry[], date: string): Totals {
  return sumTotals(entries.filter((e) => e.date === date).map((e) => itemTotals(e.foodId, e.factor)))
}
