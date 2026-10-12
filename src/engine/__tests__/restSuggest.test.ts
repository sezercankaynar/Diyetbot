import { describe, expect, it } from 'vitest'
import { buildMenuContext, mealTotals, suggestForRest } from '../menu'
import { buildPlan } from '../plan'
import { profile } from './helpers'

describe('suggestions for the rest of the day', () => {
  const p = profile()
  const ctx = buildMenuContext(p, buildPlan(p))!

  it('sizes the remaining meal to what is left after what was really eaten', () => {
    // A heavy, low-protein first half of the day (toast, chocolate, a pastry …).
    const eaten = { kcal: Math.round(ctx.kcal * 0.6), protein: 25, carb: 160, fat: 45 }
    const [s] = suggestForRest(ctx, '2026-10-12', eaten, ['dinner'])
    expect(s.slot).toBe('dinner')
    expect(s.budget.kcal).toBe(ctx.kcal - eaten.kcal)
    expect(s.options.length).toBeGreaterThan(0)
    for (const o of s.options) {
      const t = mealTotals(o)
      expect(t.kcal).toBeLessThanOrEqual(s.budget.kcal * 1.08)
      expect(t.kcal).toBeGreaterThan(s.budget.kcal * 0.75)
      // Protein was short: the plate leans on it.
      expect(t.protein / t.kcal).toBeGreaterThan(0.05)
    }
    // The options differ from each other.
    expect(new Set(s.options.map((o) => o.title)).size).toBe(s.options.length)
  })

  it('splits what is left over several open meals and stops when the day is full', () => {
    const eaten = { kcal: 500, protein: 20, carb: 60, fat: 20 }
    const rest = suggestForRest(ctx, '2026-10-12', eaten, ['lunch', 'dinner'])
    expect(rest.map((r) => r.slot)).toEqual(['lunch', 'dinner'])
    expect(Math.abs(rest[0].budget.kcal + rest[1].budget.kcal - (ctx.kcal - 500))).toBeLessThanOrEqual(1)
    expect(suggestForRest(ctx, '2026-10-12', { kcal: ctx.kcal, protein: 0, carb: 0, fat: 0 }, ['dinner'])).toEqual([])
  })
})
