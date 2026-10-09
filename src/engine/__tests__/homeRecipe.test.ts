import { afterEach, describe, expect, it } from 'vitest'
import { foodFromRecipe, foodFromValues, recipeTotals, validateRecipe } from '../homeRecipe'
import { INGREDIENTS, ingredientById } from '../ingredients'
import { setExtraFoods } from '../foods'
import { buildMenuContext, generateWeekMenu } from '../menu'
import { buildPlan } from '../plan'
import { profile } from './helpers'

afterEach(() => setExtraFoods([]))

describe('ingredient database', () => {
  it('unique ids, sane values', () => {
    expect(new Set(INGREDIENTS.map((i) => i.id)).size).toBe(INGREDIENTS.length)
    expect(INGREDIENTS.length).toBeGreaterThan(100)
    for (const i of INGREDIENTS) {
      expect(i.kcal, i.id).toBeGreaterThanOrEqual(0)
      expect(i.protein + i.carb + i.fat, i.id).toBeLessThanOrEqual(101)
      const k = i.protein * 4 + i.carb * 4 + i.fat * 9
      if (i.kcal > 50) expect(Math.abs(k - i.kcal) / i.kcal, i.id).toBeLessThanOrEqual(0.2)
    }
  })
})

describe('home recipes', () => {
  const pick = (name: RegExp) => INGREDIENTS.find((i) => name.test(i.name))!.id
  const lines = () => [
    { ingredientId: pick(/^Kuru fasulye/i), grams: 500 },
    { ingredientId: pick(/^Zeytinyağı/i), grams: 30 },
    { ingredientId: pick(/^Soğan/i), grams: 100 },
  ]

  it('sums ingredients and divides by servings', () => {
    const t = recipeTotals(lines())
    const manual = lines().reduce((a, l) => a + (ingredientById(l.ingredientId)!.kcal * l.grams) / 100, 0)
    expect(t.kcal).toBe(Math.round(manual))
    expect(t.tags).toContain('legume')
    const f = foodFromRecipe({ name: 'Annemin fasulyesi', lines: lines(), servings: 4, slots: ['dinner'], kind: 'hearty' }, 'x1')
    expect(f.kcal).toBe(Math.round(t.kcal / 4))
    expect(f.id).toBe('ev-annemin-fasulyesi-x1')
    expect(f.group).toBe('ev')
  })

  it('validation', () => {
    expect(validateRecipe({ name: '', lines: [], servings: 0, slots: [], kind: 'hearty' })).toHaveLength(3)
    expect(validateRecipe({ name: 'X', lines: lines(), servings: 4, slots: [], kind: 'hearty' })).toEqual([])
  })

  it('quick values entry and menu inclusion', () => {
    const own = foodFromValues({ name: 'Ev mantısı', kcal: 520, protein: 25, carb: 60, fat: 18, slots: ['dinner'], kind: 'hearty' }, 'y')
    setExtraFoods([own])
    const p = profile({ mealStyle: { breakfast: 'normal', lunch: 'light', dinner: 'hearty' } })
    const ctx = buildMenuContext(p, buildPlan(p), { liked: [own.id], disliked: [] })!
    const m = generateWeekMenu(ctx, '2026-10-05')
    expect(m.days.some((d) => d.items.some((i) => i.foodId === own.id))).toBe(true)
  })
})
