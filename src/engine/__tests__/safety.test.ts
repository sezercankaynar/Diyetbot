import { describe, expect, it } from 'vitest'
import { evaluateSafety } from '../safety'
import { buildPlan } from '../plan'
import { profile } from './helpers'

describe('safety hard stops', () => {
  const cases = [
    ['minor', profile({ age: 17 })],
    ['pregnant', profile({ sex: 'f', health: { pregnant: true } })],
    ['eating-disorder', profile({ health: { eatingDisorder: true } })],
    ['kidney-liver', profile({ health: { kidneyLiver: true } })],
    ['underweight', profile({ weightKg: 55, heightCm: 178, goal: 'lose' })],
    ['underweight', profile({ weightKg: 55, heightCm: 178, goal: 'recomp' })],
  ] as const

  for (const [code, p] of cases) {
    it(`${code} stops with no kcal/macro output`, () => {
      const s = evaluateSafety(p)
      expect(s.stop).toBe(true)
      expect(s.stops.map((c) => c.code)).toContain(code)
      expect(s.stops.every((c) => c.level === 'stop' && c.text.length > 0)).toBe(true)

      const plan = buildPlan(p)
      expect(plan.energy).toBeUndefined()
      expect(plan.macros).toBeUndefined()
      expect(plan.diets).toBeUndefined()
      expect(plan.training).toBeUndefined()
    })
  }

  it('age 18 is allowed', () => {
    expect(evaluateSafety(profile({ age: 18 })).stop).toBe(false)
  })

  it('underweight with goal gain/maintain is not a stop', () => {
    expect(evaluateSafety(profile({ weightKg: 55, goal: 'gain' })).stop).toBe(false)
    expect(evaluateSafety(profile({ weightKg: 55, goal: 'maintain' })).stop).toBe(false)
  })
})

describe('safety warnings', () => {
  it('diabetes meds: hypoglycemia warning, keto and IF removed, plan still shown', () => {
    const p = profile({ canSkipBreakfast: true, mealsPerDay: 2, health: { diabetesMeds: true } })
    const s = evaluateSafety(p)
    expect(s.stop).toBe(false)
    expect(s.warnings.map((w) => w.code)).toContain('hypoglycemia')
    expect(s.excludedDiets).toContain('keto')
    expect(s.ifAllowed).toBe(false)

    const plan = buildPlan(p, { diet: 'keto' })
    expect(plan.energy).toBeDefined()
    expect(plan.recommendedDiet?.id).not.toBe('keto')
    expect(plan.diets?.find((d) => d.id === 'keto')?.excluded).toBe(true)
    expect(plan.intermittentFasting?.recommended).toBe(false)
    expect(plan.intermittentFasting?.disabled).toBe(true)
  })

  it('sleep < 6 h warning', () => {
    expect(evaluateSafety(profile({ sleepHours: 5.5 })).warnings.map((w) => w.code)).toEqual(['sleep'])
    expect(evaluateSafety(profile({ sleepHours: 6 })).warnings).toHaveLength(0)
  })
})
