import { describe, expect, it } from 'vitest'
import { LIBRARY_DISHES, LIBRARY_FOODS } from '../dishLibrary'
import { ingredientById } from '../ingredients'
import { FOOD_BY_ID, allFoods } from '../foods'
import { searchFoods } from '../foodSearch'

describe('dish library', () => {
  it('every ingredient exists, ids are unique and new', () => {
    for (const d of LIBRARY_DISHES) for (const [id] of d.lines) expect(ingredientById(id), `${d.id}: ${id}`).toBeDefined()
    expect(new Set(LIBRARY_FOODS.map((f) => f.id)).size).toBe(LIBRARY_FOODS.length)
    for (const f of LIBRARY_FOODS) expect(FOOD_BY_ID[f.id]).toBe(f)
  })
  it('values are sane and add up', () => {
    for (const f of LIBRARY_FOODS) {
      expect(f.kcal, f.name).toBeGreaterThan(60)
      expect(f.kcal, f.name).toBeLessThan(1100)
      const fromMacros = f.protein * 4 + f.carb * 4 + f.fat * 9
      expect(Math.abs(fromMacros - f.kcal) / f.kcal, f.name).toBeLessThan(0.15)
    }
  })
  it('library dishes are searchable but not offered by generated menus', () => {
    expect(searchFoods('tavuklu pilav').slice(0, 4).map((f) => f.id)).toEqual(expect.arrayContaining(['yl-tavuklu-pilav-nohutlu', 'yl-tavuklu-pilav-sade']))
    expect(allFoods().filter((f) => f.id.startsWith('yl-')).every((f) => f.slots.length === 0)).toBe(true)
  })
})
