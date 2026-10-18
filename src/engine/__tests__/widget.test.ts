import { describe, expect, it } from 'vitest'
import type { DiaryEntry } from '../diary'
import { buildMenuContext, generateWeekMenu, mealTotals } from '../menu'
import { buildPlan } from '../plan'
import { widgetDays } from '../widget'
import { profile } from './helpers'

describe('home-screen widget data', () => {
  const p = profile()
  const ctx = buildMenuContext(p, buildPlan(p))!
  const menu = generateWeekMenu(ctx, '2026-10-12')
  const day = menu.days[2]

  it('one entry per day with its meals; eaten meals show what was logged', () => {
    const diary: DiaryEntry[] = [{ id: 'a', date: day.date, foodId: 'yl-karisik-tost', factor: 1, menuSlot: 'breakfast' }]
    const w = widgetDays({ ...menu, lighter: { [day.date]: 100 } }, ctx, p.mealTimes, diary, ctx.kcal, day.date)
    expect(w).toHaveLength(7)
    const d = w[2]
    expect(d.target).toBe(ctx.kcal - 100)
    expect(d.meals.map((m) => m.label)[0]).toMatch(/Kahvaltı/)
    expect(d.meals[0]).toMatchObject({ done: true, title: 'Karışık tost (kaşar + sucuk)', kcal: 534 })
    expect(d.meals[1].done).toBe(false)
    expect(d.meals[1].kcal).toBe(mealTotals(day.items[1]).kcal)
    expect(d.meals[0].time).toMatch(/^\d\d:\d\d$/)
    expect(d.eaten).toBe(534)
    expect(w[3].eaten).toBeUndefined()
  })
})
