import { describe, expect, it } from 'vitest'
import { buildPlan } from '../plan'
import { generateTraining } from '../training'
import { mealGuide, proteinSources } from '../meals'
import { profile } from './helpers'

describe('buildPlan', () => {
  it('produces a full plan for a normal profile', () => {
    const plan = buildPlan(profile())
    expect(plan.safety.stop).toBe(false)
    expect(plan.energy?.target).toBe(2110)
    expect(plan.recommendedDiet?.id).toBe('hp')
    expect(plan.macros?.kcal).toBe(2110)
    expect(plan.meals?.proteinPerMealG).toBe(Math.round(160 / 3))
    expect(plan.training?.days).toHaveLength(3)
  })

  it('honours a user-chosen diet', () => {
    const plan = buildPlan(profile(), { diet: 'keto' })
    expect(plan.recommendedDiet?.id).toBe('keto')
    expect(plan.macros?.carbG).toBe(30)
  })

  it('applies accepted kcal offset but never below the floor', () => {
    expect(buildPlan(profile(), { kcalOffset: -150 }).energy?.target).toBe(1960)
    const floored = buildPlan(profile(), { kcalOffset: -5000 })
    expect(floored.energy?.target).toBe(floored.energy?.floor)
  })

  it('adds a floor note when clamped', () => {
    const p = profile({ sex: 'f', weightKg: 50, heightCm: 160, age: 40, activity: 1.2, trainingDays: 2, weeklyRate: 0.75 })
    expect(buildPlan(p).notes.map((n) => n.code)).toContain('floor')
  })
})

describe('training generator', () => {
  it('splits by days', () => {
    expect(generateTraining(profile({ trainingDays: 2 })).days.map((d) => d.name)).toEqual([
      '1. gün – Tüm vücut A', '2. gün – Tüm vücut B',
    ])
    expect(generateTraining(profile({ trainingDays: 4 })).split).toBe('Üst/Alt ×2')
    expect(generateTraining(profile({ trainingDays: 5 })).days).toHaveLength(5)
    expect(generateTraining(profile({ trainingDays: 6 })).days.map((d) => d.name.split(' – ')[1])).toEqual([
      'İtiş', 'Çekiş', 'Bacak', 'İtiş', 'Çekiş', 'Bacak',
    ])
  })
  it('home equipment swaps exercises', () => {
    const gym = generateTraining(profile({ equipment: 'gym' })).days[0].exercises[0].name
    const home = generateTraining(profile({ equipment: 'home' })).days[0].exercises[0].name
    expect(gym).toBe('Back squat')
    expect(home).toMatch(/dambıl/)
  })
  it('sets, cardio and steps by profile', () => {
    expect(generateTraining(profile({ experience: 'new' })).days[0].exercises[0].sets).toBe('3')
    expect(generateTraining(profile({ experience: 'adv' })).days[0].exercises[0].sets).toBe('3–4')
    expect(generateTraining(profile({ goal: 'lose' })).steps).toMatch(/8\.000–10\.000/)
    expect(generateTraining(profile({ goal: 'gain' })).cardio).toMatch(/1–2 × 20/)
    expect(generateTraining(profile({ goal: 'maintain' })).steps).toMatch(/7\.000–9\.000/)
  })
})

describe('meal guide', () => {
  it('filters protein sources by animal-food preference', () => {
    const vegan = proteinSources('vegan')
    expect(vegan).toContain('Mercimek')
    expect(vegan).not.toContain('Yumurta')
    expect(proteinSources('vegetarian')).toContain('Yumurta')
    expect(proteinSources('vegetarian')).not.toContain('Ton balığı')
    expect(proteinSources('pescatarian')).toContain('Ton balığı')
    expect(proteinSources('pescatarian')).not.toContain('Tavuk göğsü')
  })
  it('3 plate rules per diet and evening-hunger tips', () => {
    const g = mealGuide(profile({ hungerTime: 'evening', mealsPerDay: 4 }), 'dash', 160)
    expect(g.plateRules).toHaveLength(3)
    expect(g.proteinPerMealG).toBe(40)
    expect(g.hungerTips.join(' ')).toMatch(/yoğurt veya lor/)
  })
})
