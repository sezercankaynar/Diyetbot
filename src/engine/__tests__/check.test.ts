import { describe, expect, it } from 'vitest'
import { evaluateMeal, type CheckContext } from '../check'
import { venueGuide } from '../eatingOut'
import { cravingPlan } from '../cravings'
import { getFood } from '../foods'
import { diaryTotals } from '../diary'
import { profile } from './helpers'

const base: CheckContext = {
  kcalTarget: 2000,
  proteinTarget: 150,
  eaten: { kcal: 0, protein: 0, carb: 0, fat: 0 },
  diet: 'hp',
  animalFoods: 'all',
  dislikes: [],
}
const eaten = (kcal: number) => ({ ...base, eaten: { kcal, protein: 60, carb: 0, fat: 0 } })

describe('"Can I eat this?"', () => {
  it('ok when it fits the remaining budget', () => {
    const r = evaluateMeal([{ foodId: 'tavuk-sis', factor: 1 }], eaten(1000))
    expect(r.verdict).toBe('ok')
    expect(r.remainingAfter).toBe(1000 - getFood('tavuk-sis')!.kcal)
    expect(r.alternatives).toHaveLength(0)
  })

  it('suggests a smaller portion when it is a bit over', () => {
    // İskender ≈ 805 kcal, 500 kcal left → 0.5 portion
    const r = evaluateMeal([{ foodId: 'iskender', factor: 1 }], eaten(1500))
    expect(r.verdict).toBe('smaller')
    expect(r.suggestedFactor).toBe(0.5)
    expect(r.alternatives.length).toBeGreaterThan(0)
    for (const a of r.alternatives) expect(a.kcal).toBeLessThanOrEqual(550)
  })

  it('over budget with alternatives from related groups', () => {
    const r = evaluateMeal([{ foodId: 'kiymali-pide', factor: 1 }], eaten(1800))
    expect(r.verdict).toBe('over')
    expect(r.tips.join(' ')).toMatch(/haftalık ortalama/)
    for (const a of r.alternatives) expect(['hamur', 'kebap', 'ana']).toContain(getFood(a.foodId)!.group)
  })

  it('flags diet conflicts: keto carbs, DASH salt, vegan animal foods', () => {
    expect(evaluateMeal([{ foodId: 'pilav', factor: 1 }], { ...base, diet: 'keto' }).verdict).toBe('caution')
    const dash = evaluateMeal([{ foodId: 'lahmacun', factor: 1 }], { ...base, diet: 'dash' })
    expect(dash.reasons.join(' ')).toMatch(/tuz/)
    const vegan = evaluateMeal([{ foodId: 'menemen', factor: 1 }], { ...base, animalFoods: 'vegan' })
    expect(vegan.verdict).toBe('caution')
    for (const a of vegan.alternatives) expect(getFood(a.foodId)!.tags).not.toContain('egg')
  })

  it('a big single meal gets a "keep the rest light" tip', () => {
    expect(evaluateMeal([{ foodId: 'kiymali-pide', factor: 1 }], base).tips.join(' ')).toMatch(/Büyük bir öğün/)
  })

  it('low-protein main meal gets a protein tip', () => {
    const r = evaluateMeal([{ foodId: 'makarna', factor: 1 }], base)
    expect(r.tips.join(' ')).toMatch(/Protein düşük/)
  })

  it('sums multiple items with portions', () => {
    const r = evaluateMeal([{ foodId: 'lahmacun', factor: 2 }, { foodId: 'ayran', factor: 1 }], base)
    expect(r.totals.kcal).toBe(getFood('lahmacun')!.kcal * 2 + getFood('ayran')!.kcal)
  })
})

describe('eating out', () => {
  it('filters picks by animal preference and marks budget fit', () => {
    const g = venueGuide('kebap', { remainingKcal: 300, diet: 'hp', animalFoods: 'all', dislikes: [] })!
    expect(g.picks.length).toBeGreaterThan(2)
    expect(g.picks.find((p) => p.foodId === 'tavuk-sis')!.fitsBudget).toBe(true)
    expect(g.picks.find((p) => p.foodId === 'izgara-kofte-porsiyon')!.fitsBudget).toBe(false)
    const veg = venueGuide('pide', { remainingKcal: 800, diet: 'plant', animalFoods: 'vegetarian', dislikes: [] })!
    expect(veg.picks.map((p) => p.foodId)).not.toContain('lahmacun')
    expect(veg.picks.map((p) => p.foodId)).toContain('kasarli-pide')
  })
  it('DASH: salty picks are listed after compatible ones with a warning', () => {
    const g = venueGuide('doner', { remainingKcal: 800, diet: 'dash', animalFoods: 'all', dislikes: [] })!
    expect(g.picks.every((p) => p.warnings.length > 0)).toBe(true)
  })
})

describe('sweet cravings', () => {
  const p = profile()
  const ctx = { remainingKcal: 300, diet: 'hp' as const, animalFoods: p.animalFoods, dislikes: [], health: p.health, hungerTime: p.hungerTime }
  it('gives steps and light sweet options ≤ 220 kcal', () => {
    const c = cravingPlan(ctx)
    expect(c.steps.length).toBeGreaterThanOrEqual(3)
    expect(c.options.length).toBeGreaterThanOrEqual(5)
    for (const o of c.options) expect(o.kcal).toBeLessThanOrEqual(220)
    expect(c.options.map((o) => o.foodId)).not.toContain('sutlu-cikolata')
  })
  it('vegan, keto and blood-sugar filters', () => {
    for (const o of cravingPlan({ ...ctx, animalFoods: 'vegan' }).options) expect(getFood(o.foodId)!.tags).not.toContain('dairy')
    for (const o of cravingPlan({ ...ctx, diet: 'keto' }).options) expect(getFood(o.foodId)!.carb).toBeLessThanOrEqual(10)
    const ir = cravingPlan({ ...ctx, health: { ...p.health, insulinResistance: true } })
    for (const o of ir.options) expect(getFood(o.foodId)!.carb).toBeLessThanOrEqual(20)
    expect(ir.notes.join(' ')).toMatch(/Kan şekeri/)
  })
  it('evening hunger adds a planning tip; low budget adds a no-guilt note', () => {
    expect(cravingPlan({ ...ctx, hungerTime: 'evening' }).prevention[0]).toMatch(/gece atıştırmalığı/)
    expect(cravingPlan({ ...ctx, remainingKcal: 50 }).notes.join(' ')).toMatch(/suçluluk/)
  })
})

describe('diary', () => {
  it('totals only the given day', () => {
    const t = diaryTotals(
      [
        { id: '1', date: '2026-10-09', foodId: 'ayran', factor: 2 },
        { id: '2', date: '2026-10-08', foodId: 'ayran', factor: 1 },
      ],
      '2026-10-09',
    )
    expect(t.kcal).toBe(getFood('ayran')!.kcal * 2)
  })
})
