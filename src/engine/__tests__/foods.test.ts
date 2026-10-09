import { describe, expect, it } from 'vitest'
import { FOODS, type Slot } from '../foods'
import { fitsAnimal, fitsDiet } from '../foodRules'
import type { AnimalFoods, DietId } from '../types'

describe('food database', () => {
  it('has unique ids and kcal consistent with macros', () => {
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length)
    for (const f of FOODS) {
      expect(Math.abs(f.kcal - (f.protein * 4 + f.carb * 4 + f.fat * 9))).toBeLessThanOrEqual(5)
      expect(f.kcal).toBeGreaterThan(0)
    }
  })

  const slots: Slot[] = ['breakfast', 'lunch', 'dinner', 'snack']
  const animals: AnimalFoods[] = ['all', 'pescatarian', 'vegetarian', 'vegan']
  const diets: DietId[] = ['med', 'hp', 'dash', 'lowcarb', 'plant']

  it('every slot has ≥ 3 options for every animal preference × diet (keto: ≥ 2)', () => {
    for (const a of animals) for (const d of [...diets, 'keto' as DietId]) for (const s of slots) {
      const n = FOODS.filter((f) => f.slots.includes(s) && fitsAnimal(f, a) && [1, 1.5, 2, 0.75].some((x) => fitsDiet(f, d, s, x))).length
      const min = d === 'keto' ? 2 : 3
      expect(n, `${a}/${d}/${s}`).toBeGreaterThanOrEqual(min)
    }
  })
})
