import { describe, expect, it } from 'vitest'
import { CHAIN_FOODS, MACRO_MISMATCH } from '../chains'
import { chainList, chainMenu } from '../eatingOut'
import { allFoods, getFood } from '../foods'
import { evaluateMeal } from '../check'

describe('chain menus', () => {
  it('unique ids, brand + source on every item, reachable via getFood/allFoods', () => {
    expect(new Set(CHAIN_FOODS.map((f) => f.id)).size).toBe(CHAIN_FOODS.length)
    for (const f of CHAIN_FOODS) {
      expect(f.brand).toBeTruthy()
      expect(f.source).toBeTruthy()
      expect(f.kcal).toBeGreaterThan(0)
      expect(getFood(f.id)).toBe(f)
      expect(f.slots).toEqual([]) // never used in generated home menus
    }
    expect(allFoods().length).toBeGreaterThan(CHAIN_FOODS.length)
  })

  it('macros are kept only when they add up to the published kcal', () => {
    for (const f of CHAIN_FOODS.filter((x) => !x.kcalOnly && !x.estimated && x.kcal >= 20)) {
      const k = f.protein * 4 + f.carb * 4 + f.fat * 9
      expect(Math.abs(k - f.kcal) / f.kcal, f.id).toBeLessThanOrEqual(MACRO_MISMATCH)
    }
    // Burger King Whopper's published fat doesn't add up → kcal only.
    expect(getFood('ch-burgerking-whopper')!.kcalOnly).toBe(true)
    expect(getFood('ch-burgerking-kofteburger')!.kcalOnly).toBeUndefined()
  })

  it('lists chains and ranks a chain menu for the user', () => {
    const brands = chainList().map((c) => c.brand)
    expect(brands).toContain("McDonald's")
    expect(brands).toContain('Komagene')
    const ctx = { remainingKcal: 450, diet: 'hp' as const, animalFoods: 'all' as const, dislikes: [] }
    const menu = chainMenu("McDonald's", ctx)
    expect(menu.length).toBeGreaterThan(10)
    const firstOver = menu.findIndex((m) => !m.fitsBudget)
    expect(menu.slice(firstOver).every((m) => !m.fitsBudget || m.warnings.length > 0)).toBe(true)
    // vegetarian: no meat/chicken items left at a burger chain except sides
    for (const m of chainMenu("McDonald's", { ...ctx, animalFoods: 'vegetarian' })) {
      expect(getFood(m.foodId)!.tags).not.toContain('redmeat')
      expect(getFood(m.foodId)!.tags).not.toContain('chicken')
    }
  })

  it('kcal-only items: verdict uses kcal and explains missing macros', () => {
    const r = evaluateMeal([{ foodId: 'ch-starbucks-latte-grande', factor: 1 }], {
      kcalTarget: 2000, proteinTarget: 150, eaten: { kcal: 0, protein: 0, carb: 0, fat: 0 }, diet: 'keto', animalFoods: 'all', dislikes: [],
    })
    expect(r.totals.kcal).toBe(215)
    expect(r.macrosKnown).toBe(false)
    expect(r.tips.join()).toMatch(/yalnızca kalorisi/)
    expect(r.reasons.join()).toMatch(/karbonhidrat değeri bilinmiyor/)
  })

  it('alternatives for a chain item stay within the same chain', () => {
    const r = evaluateMeal([{ foodId: 'ch-mcdonalds-double-big-mac', factor: 1 }], {
      kcalTarget: 2000, proteinTarget: 150, eaten: { kcal: 1600, protein: 80, carb: 0, fat: 0 }, diet: 'hp', animalFoods: 'all', dislikes: [],
    })
    for (const a of r.alternatives) {
      const f = getFood(a.foodId)!
      expect(f.brand === undefined || f.brand === "McDonald's").toBe(true)
    }
    expect(r.alternatives.some((a) => getFood(a.foodId)!.brand === "McDonald's")).toBe(true)
  })
})
