import { describe, expect, it } from 'vitest'
import { scoreDiets, scoreIntermittentFasting } from '../diets'
import { evaluateSafety } from '../safety'
import { profile } from './helpers'
import type { Profile } from '../types'

const order = (p: Profile) => scoreDiets(p, evaluateSafety(p).excludedDiets).map((d) => [d.id, d.score])

describe('diet scoring order', () => {
  it('default lifter who tracks calories → high-protein flexible', () => {
    expect(order(profile())).toEqual([
      ['hp', 6], ['med', 3], ['dash', 2], ['lowcarb', 1], ['plant', 1], ['keto', 0],
    ])
  })

  it('hypertension, no tracking, 2 days → DASH', () => {
    const p = profile({ trainingDays: 2, tracksCalories: false, health: { hypertension: true } })
    expect(order(p)).toEqual([
      ['dash', 6], ['med', 5], ['lowcarb', 2], ['hp', 1], ['plant', 1], ['keto', 0],
    ])
  })

  it('vegan with high LDL, loves bread, 4 days → Mediterranean then plant', () => {
    const p = profile({
      animalFoods: 'vegan', trainingDays: 4, tracksCalories: false, carbAttachment: 'high',
      health: { highLdl: true },
    })
    expect(order(p)).toEqual([
      ['med', 7], ['plant', 6], ['hp', 3], ['dash', 2], ['lowcarb', 0], ['keto', 0],
    ])
  })

  it('insulin resistance + diabetes meds + low carb attachment → low-carb, keto excluded last', () => {
    const p = profile({
      trainingDays: 2, tracksCalories: false, carbAttachment: 'low',
      health: { insulinResistance: true, diabetesMeds: true },
    })
    const scored = scoreDiets(p, evaluateSafety(p).excludedDiets)
    expect(scored.map((d) => [d.id, d.score])).toEqual([
      ['lowcarb', 6], ['med', 5], ['dash', 2], ['hp', 1], ['plant', 1], ['keto', 0],
    ])
    expect(scored[5].excluded).toBe(true)
  })

  it('busy eater-out, hungry all day, 5 days → high-protein', () => {
    const p = profile({ eatingOut: 'often', cookingTime: 'low', hungerTime: 'allday', trainingDays: 5 })
    expect(order(p)).toEqual([
      ['hp', 9], ['med', 3], ['plant', 1], ['dash', 0], ['lowcarb', 0], ['keto', 0],
    ])
  })

  it('pescatarian adds to Mediterranean', () => {
    const base = scoreDiets(profile()).find((d) => d.id === 'med')!.score
    expect(scoreDiets(profile({ animalFoods: 'pescatarian' })).find((d) => d.id === 'med')!.score).toBe(base + 1)
  })

  it('every positive adjustment has a Turkish reason; scores never negative', () => {
    const p = profile({ health: { highLdl: true, hypertension: true }, animalFoods: 'vegan', carbAttachment: 'high' })
    const scored = scoreDiets(p)
    for (const d of scored) expect(d.score).toBeGreaterThanOrEqual(0)
    const dash = scored.find((d) => d.id === 'dash')!
    expect(dash.reasons.some((r) => r.startsWith('+4') && r.includes('Hipertansiyon'))).toBe(true)
    for (const d of scored) for (const r of d.reasons) expect(r).toMatch(/^\+\d+: \S/)
  })
})

describe('intermittent fasting overlay', () => {
  it('baseline 1 → not recommended', () => {
    const r = scoreIntermittentFasting(profile())
    expect(r.score).toBe(1)
    expect(r.recommended).toBe(false)
  })
  it('skip breakfast + 2 meals → 5, recommended with the "no extra fat loss" note', () => {
    const r = scoreIntermittentFasting(profile({ canSkipBreakfast: true, mealsPerDay: 2 }))
    expect(r.score).toBe(5)
    expect(r.recommended).toBe(true)
    expect(r.note).toMatch(/ek yağ kaybı sağlamaz/)
  })
  it('skip breakfast with evening hunger → 3, still recommended (threshold)', () => {
    const r = scoreIntermittentFasting(profile({ canSkipBreakfast: true, hungerTime: 'evening' }))
    expect(r.score).toBe(3)
    expect(r.recommended).toBe(true)
  })
  it('2 meals but no breakfast skipping and evening hunger → 1', () => {
    expect(scoreIntermittentFasting(profile({ mealsPerDay: 2, hungerTime: 'evening' })).score).toBe(1)
  })
  it.each([
    [{ diabetesMeds: true }],
    [{ eatingDisorder: true }],
    [{ pregnant: true }],
  ])('disabled (−1) for %o', (health) => {
    const r = scoreIntermittentFasting(profile({ canSkipBreakfast: true, mealsPerDay: 2, health }))
    expect(r).toMatchObject({ score: -1, disabled: true, recommended: false })
  })
})
