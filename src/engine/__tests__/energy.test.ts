import { describe, expect, it } from 'vitest'
import { bmi, bmr, calorieFloor, computeEnergy, rawDeficit, round5, tdee, waistToHeight } from '../energy'
import { profile } from './helpers'

describe('BMR (Mifflin-St Jeor)', () => {
  it('male', () => {
    expect(bmr({ sex: 'm', weightKg: 80, heightCm: 178, age: 30 })).toBeCloseTo(1767.5)
  })
  it('female', () => {
    expect(bmr({ sex: 'f', weightKg: 60, heightCm: 165, age: 35 })).toBeCloseTo(600 + 1031.25 - 175 - 161)
  })
})

describe('TDEE', () => {
  it('BMR × activity × training factor', () => {
    expect(tdee(profile())).toBeCloseTo(1767.5 * 1.375 * 1.05)
    expect(tdee(profile({ trainingDays: 6, activity: 1.725 }))).toBeCloseTo(1767.5 * 1.725 * 1.11)
  })
  it('uses the training factor table', () => {
    const factors = ([2, 3, 4, 5, 6] as const).map((d) => computeEnergy(profile({ trainingDays: d })).trainingFactor)
    expect(factors).toEqual([1.03, 1.05, 1.07, 1.09, 1.11])
  })
})

describe('goal targets', () => {
  it('lose: deficit from weekly rate', () => {
    expect(rawDeficit(80, 0.5)).toBeCloseTo(440)
    const e = computeEnergy(profile())
    expect(e.target).toBe(round5(1767.5 * 1.375 * 1.05 - 440)) // 2110
    expect(e.target).toBe(2110)
    expect(e.deficitCapped).toBe(false)
    expect(e.clamped).toBe(false)
  })

  it('lose: deficit capped at 25% of TDEE', () => {
    const p = profile({ weightKg: 120, activity: 1.55, trainingDays: 2, weeklyRate: 0.75 })
    const t = tdee(p) // 2167.5 × 1.55 × 1.03
    expect(rawDeficit(120, 0.75)).toBeGreaterThan(0.25 * t)
    const e = computeEnergy(p)
    expect(e.deficitCapped).toBe(true)
    expect(e.target).toBe(round5(t * 0.75))
    expect(e.clamped).toBe(false)
  })

  it('recomp = TDEE × 0.90, maintain = TDEE', () => {
    const t = tdee(profile())
    expect(computeEnergy(profile({ goal: 'recomp' })).target).toBe(round5(t * 0.9))
    expect(computeEnergy(profile({ goal: 'maintain' })).target).toBe(round5(t))
  })

  it('gain surplus by experience', () => {
    const t = tdee(profile())
    expect(computeEnergy(profile({ goal: 'gain', experience: 'new' })).target).toBe(round5(t + 350))
    expect(computeEnergy(profile({ goal: 'gain', experience: 'mid' })).target).toBe(round5(t + 250))
    expect(computeEnergy(profile({ goal: 'gain', experience: 'adv' })).target).toBe(round5(t + 150))
  })

  it('rounds kcal to nearest 5', () => {
    for (const goal of ['lose', 'recomp', 'maintain', 'gain'] as const) {
      expect(computeEnergy(profile({ goal })).target % 5).toBe(0)
    }
  })
})

describe('calorie floor', () => {
  it('female absolute floor of 1200', () => {
    const p = profile({ sex: 'f', weightKg: 50, heightCm: 160, age: 40, activity: 1.2, trainingDays: 2, weeklyRate: 0.75 })
    const e = computeEnergy(p)
    expect(e.unclampedTarget).toBeLessThan(1200)
    expect(e.clamped).toBe(true)
    expect(e.target).toBe(1200)
  })

  it('male absolute floor of 1500', () => {
    expect(calorieFloor('m', 1200)).toBe(1500)
    expect(calorieFloor('f', 1000)).toBe(1200)
  })

  it('BMR × 0.95 when higher than the absolute floor', () => {
    const p = profile({ weightKg: 120, activity: 1.2, trainingDays: 2, weeklyRate: 0.75 })
    const e = computeEnergy(p)
    expect(e.clamped).toBe(true)
    expect(e.target).toBe(round5(bmr(p) * 0.95)) // 2060
  })
})

describe('body indices', () => {
  it('BMI and waist-to-height', () => {
    expect(bmi(80, 200)).toBeCloseTo(20)
    expect(waistToHeight(90, 180)).toBeCloseTo(0.5)
    expect(computeEnergy(profile({ waistCm: 89, heightCm: 178 })).whtrFlag).toBe(true)
    expect(computeEnergy(profile({ waistCm: 85, heightCm: 178 })).whtrFlag).toBe(false)
  })
})
