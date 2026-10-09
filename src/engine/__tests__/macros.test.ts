import { describe, expect, it } from 'vitest'
import { computeMacros, proteinPerKg, referenceWeight } from '../macros'
import { profile } from './helpers'

// Default profile: 80 kg, 178 cm (BMI 25.2), goal lose → 160 g protein, fat min 64 g.
const p = profile()
const KCAL = 2110

describe('reference weight', () => {
  it('is actual weight when BMI ≤ 30', () => {
    expect(referenceWeight(80, 178)).toBe(80)
  })
  it('is weight at BMI 25 when BMI > 30', () => {
    expect(referenceWeight(110, 178)).toBeCloseTo(25 * 1.78 * 1.78)
    const m = computeMacros(profile({ weightKg: 110 }), 2200, 'med')
    expect(m.proteinG).toBe(Math.round(2.0 * 25 * 1.78 * 1.78)) // 158
  })
})

describe('protein per kg', () => {
  it('by goal', () => {
    expect(proteinPerKg('lose', false)).toBe(2.0)
    expect(proteinPerKg('recomp', false)).toBe(2.0)
    expect(proteinPerKg('gain', false)).toBe(1.8)
    expect(proteinPerKg('maintain', false)).toBe(1.6)
  })
  it('plant diet: max(1.6, value − 0.2)', () => {
    expect(proteinPerKg('lose', true)).toBeCloseTo(1.8)
    expect(proteinPerKg('gain', true)).toBeCloseTo(1.6)
    expect(proteinPerKg('maintain', true)).toBeCloseTo(1.6)
  })
})

describe('macros per diet', () => {
  it('Mediterranean: 32% fat, carbs remainder', () => {
    expect(computeMacros(p, KCAL, 'med')).toMatchObject({ proteinG: 160, fatG: 75, carbG: 199 })
  })
  it('DASH: 27% fat but not below the 0.8 g/kg minimum', () => {
    // 27% of 2110 = 63.3 g < 64 g minimum
    expect(computeMacros(p, KCAL, 'dash')).toMatchObject({ proteinG: 160, fatG: 64, carbG: 224 })
  })
  it('High-protein: 28% fat', () => {
    expect(computeMacros(p, KCAL, 'hp')).toMatchObject({ proteinG: 160, fatG: 66, carbG: 220 })
  })
  it('Keto: 30 g carbs, fat is the remainder', () => {
    expect(computeMacros(p, KCAL, 'keto')).toMatchObject({ proteinG: 160, carbG: 30, fatG: 150 })
  })
  it('Low-carb: carbs capped at 130 g, fat is the remainder', () => {
    expect(computeMacros(p, KCAL, 'lowcarb')).toMatchObject({ proteinG: 160, carbG: 130, fatG: 106 })
  })
  it('Low-carb: carbs below 130 when the remainder is small', () => {
    // 1500 kcal: (1500 − 640 − 576)/4 = 71 g
    expect(computeMacros(p, 1500, 'lowcarb')).toMatchObject({ carbG: 71, fatG: 64 })
  })
  it('Plant diet lowers protein to 1.8 g/kg', () => {
    expect(computeMacros(p, KCAL, 'plant').proteinG).toBe(144)
    expect(computeMacros(profile({ animalFoods: 'vegan' }), KCAL, 'med').proteinG).toBe(144)
  })
  it('energy adds up to the kcal target (±10)', () => {
    for (const d of ['med', 'hp', 'dash', 'lowcarb', 'plant', 'keto'] as const) {
      const m = computeMacros(p, KCAL, d)
      expect(Math.abs(m.proteinG * 4 + m.carbG * 4 + m.fatG * 9 - KCAL)).toBeLessThanOrEqual(10)
    }
  })
  it('fiber 14 g/1000 kcal and water 35 ml/kg', () => {
    const m = computeMacros(p, 2000, 'med')
    expect(m.fiberG).toBe(28)
    expect(m.waterMl).toBe(2800)
  })
})
