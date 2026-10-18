// What the Android home-screen widget shows: each day of the week's menu with its meals (time, title,
// kcal, eaten). The widget picks today's day itself, so it stays right even when the app isn't opened.
import type { DiaryEntry } from './diary'
import { getFood } from './foods'
import { itemTotals, mealTitle, mealTotals, partsOf, plateName, slotPlan, sumTotals, type MenuContext, type WeekMenu } from './menu'
import { mealWindow } from './timing'
import type { MealTimes } from './types'

export interface WidgetMeal {
  label: string
  time: string
  title: string
  kcal: number
  done: boolean
}
export interface WidgetDay {
  date: string
  target: number
  /** kcal logged that day, when known (days up to the sync day). */
  eaten?: number
  meals: WidgetMeal[]
}

export function widgetDays(
  menu: WeekMenu, ctx: MenuContext, times: MealTimes | undefined, diary: DiaryEntry[], target: number, today: string,
): WidgetDay[] {
  const plan = slotPlan(ctx)
  return menu.days.map((d) => {
    const logged = diary.filter((e) => e.date === d.date)
    const meals = plan.flatMap((sp) => {
      const item = d.items.find((i) => i.slot === sp.slot)
      if (!item) return []
      const eaten = logged.filter((e) => e.menuSlot === sp.slot)
      const done = eaten.length > 0
      // Eaten: what was logged (when it isn't the menu plate), with its kcal.
      const plate = partsOf(item).map((x) => x.foodId)
      const same = eaten.length === plate.length && eaten.every((e) => plate.includes(e.foodId))
      const title = done && !same ? eaten.map((e) => plateName(getFood(e.foodId)?.name ?? '')).join(', ') : mealTitle(item)
      const kcal = done ? sumTotals(eaten.map((e) => itemTotals(e.foodId, e.factor))).kcal : mealTotals(item).kcal
      return [{ label: sp.label, time: mealWindow(sp, times).split('–')[0], title, kcal, done }]
    })
    const out: WidgetDay = { date: d.date, target: target - (menu.lighter?.[d.date] ?? 0), meals }
    if (d.date <= today && logged.length) out.eaten = sumTotals(logged.map((e) => itemTotals(e.foodId, e.factor))).kcal
    return out
  })
}
