import { afterEach, describe, expect, it } from 'vitest'
import { foodFromLabel, labelFromOff, validateLabel } from '../packaged'
import { allFoods, getFood, setExtraFoods } from '../foods'
import { evaluateMeal } from '../check'

const label = { name: 'Çikolatalı gofret', brand: 'Ülker', barcode: '8690504016700', kcal100: 569, protein100: 6.5, carb100: 59.2, fat100: 33.8, sugar100: 40, salt100: 0.3, portionG: 36 }

afterEach(() => setExtraFoods([]))

describe('packaged products', () => {
  it('scales label values to the portion and keeps label kcal', () => {
    const f = foodFromLabel(label)
    expect(f.kcal).toBe(Math.round(569 * 0.36))
    expect(f.protein).toBeCloseTo(2.3, 1)
    expect(f.fat).toBeCloseTo(12.2, 1)
    expect(f.sweet).toBe(true)
    expect(f.salty).toBeUndefined()
    expect(f.group).toBe('paket')
    expect(f.name).toBe('Çikolatalı gofret (Ülker)')
    expect(f.id).toBe('pk-8690504016700-36')
  })

  it('validates label input', () => {
    expect(validateLabel(label)).toEqual([])
    expect(validateLabel({ ...label, name: ' ', kcal100: -1 })).toHaveLength(2)
    expect(validateLabel({ ...label, protein100: 50, carb100: 40, fat100: 20 }).join()).toMatch(/100 g/)
    expect(validateLabel({ ...label, portionG: 0 }).join()).toMatch(/Porsiyon/)
  })

  it('parses an Open Food Facts product, falling back to kJ', () => {
    const l = labelFromOff({
      code: '123', product_name: 'Ayran', brands: 'Sütaş, X', serving_quantity: '200',
      nutriments: { 'energy-kj_100g': 167.4, proteins_100g: 1.7, carbohydrates_100g: 2.1, fat_100g: 1.7, salt_100g: 0.6 },
    })!
    expect(l).toMatchObject({ name: 'Ayran', brand: 'Sütaş', barcode: '123', kcal100: 40, servingG: 200 })
    expect(labelFromOff({ product_name: 'X', nutriments: { 'energy-kcal_100g': 100 } })).toBeNull()
    expect(labelFromOff({ product_name: 'Gofret', brands: ['Ülker'], nutriments: { 'energy-kcal_100g': 500, proteins_100g: 5, carbohydrates_100g: 60, fat_100g: 25 } })!.brand).toBe('Ülker')
    expect(labelFromOff(null)).toBeNull()
  })

  it('saved products become searchable and checkable; unknown animal content is flagged', () => {
    const f = foodFromLabel(label)
    setExtraFoods([f])
    expect(getFood(f.id)).toBe(f)
    expect(allFoods().at(-1)).toBe(f)
    const r = evaluateMeal([{ foodId: f.id, factor: 1 }], {
      kcalTarget: 2000, proteinTarget: 150, eaten: { kcal: 0, protein: 0, carb: 0, fat: 0 }, diet: 'hp', animalFoods: 'vegan', dislikes: [],
    })
    expect(r.totals.kcal).toBe(f.kcal)
    expect(r.reasons.join()).toMatch(/hayvansal içerik bilinmiyor/)
  })
})
