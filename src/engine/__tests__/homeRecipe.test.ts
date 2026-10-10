import { afterEach, describe, expect, it } from 'vitest'
import { foodFromRecipe, foodFromValues, recipeTotals, validateRecipe } from '../homeRecipe'
import { INGREDIENTS, ingredientById } from '../ingredients'
import { allFoods, getFood, setExtraFoods } from '../foods'
import { buildMenuContext, dayTotals, generateWeekMenu, placeDish, swapItem } from '../menu'
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

  it('keeps the recipe so it can be edited', () => {
    const f = foodFromRecipe({ name: 'Fasulye', lines: lines(), servings: 4, slots: ['lunch', 'snack'], kind: 'light' }, 'z')
    expect(f.recipe).toEqual({ lines: lines(), servings: 4 })
    expect(f.slots).toEqual(['lunch', 'snack'])
  })

  it('noMenu dishes are never suggested; deleted (hidden) ones vanish from search but still resolve', () => {
    const own = foodFromValues({ name: 'Ev mantısı', kcal: 520, protein: 25, carb: 60, fat: 18, slots: ['dinner'], kind: 'hearty', noMenu: true }, 'y')
    setExtraFoods([own])
    const p = profile()
    const ctx = buildMenuContext(p, buildPlan(p), { liked: [own.id], disliked: [] })!
    expect(generateWeekMenu(ctx, '2026-10-05').days.every((d) => d.items.every((i) => i.foodId !== own.id))).toBe(true)
    setExtraFoods([{ ...own, hidden: true }])
    expect(allFoods().some((f) => f.id === own.id)).toBe(false)
    expect(getFood(own.id)?.name).toBe('Ev mantısı')
  })

  it('adding a saved dish to a menu day picks a portion inside the day budget', () => {
    const own = foodFromValues({ name: 'Büyük tencere', kcal: 900, protein: 30, carb: 90, fat: 45, slots: ['dinner'], kind: 'hearty' }, 'b')
    setExtraFoods([own])
    const p = profile({ mealSlots: ['breakfast', 'dinner'] })
    const ctx = buildMenuContext(p, buildPlan(p))!
    const menu = generateWeekMenu(ctx, '2026-10-05')
    const day = menu.days[2]
    for (const slot of ['dinner', 'snack'] as const) {
      const r = placeDish(menu, ctx, day.date, slot, own.id)
      expect(r).not.toBeNull()
      const after = r!.menu.days[2]
      expect(after.items.some((i) => i.slot === slot && i.foodId === own.id)).toBe(true)
      const t = dayTotals(after)
      expect(t.kcal).toBeLessThanOrEqual(ctx.kcal)
    }
    // Too big for the day: still added (what the user ate always counts), flagged as over.
    const huge = foodFromValues({ name: 'Dev porsiyon', kcal: 2500, protein: 60, carb: 250, fat: 130, slots: ['dinner'], kind: 'hearty' }, 'h')
    setExtraFoods([own, huge])
    const r = placeDish(menu, ctx, day.date, 'dinner', huge.id)!
    expect(r.over).toBe(true)
    expect(r.factor).toBe(1)
    expect(r.menu.days[2].items.find((i) => i.slot === 'dinner')!.foodId).toBe(huge.id)
    // Locked (already eaten) meals are never shrunk.
    const bf = day.items.find((i) => i.slot === 'breakfast')!
    const r2 = placeDish(menu, ctx, day.date, 'dinner', own.id, { factor: 1.5, locked: ['breakfast'] })!
    expect(r2.menu.days[2].items.find((i) => i.slot === 'breakfast')!.factor).toBe(bf.factor)
    expect(r2.factor).toBe(1.5)
    // A meal the day didn't have is added in meal order.
    const added = swapItem(menu, day.date, 'snack', own.id, 0.5).days[2]
    expect(added.items.map((i) => i.slot)).toEqual(['breakfast', 'snack', 'dinner'])
  })
})
