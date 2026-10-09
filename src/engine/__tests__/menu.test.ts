import { describe, expect, it } from 'vitest'
import { alternativesFor, buildMenuContext, menuOutdated, removeDish, dayTotals, generateWeekMenu, mondayOf, slotPlan, swapItem, type MenuContext } from '../menu'
import { getFood } from '../foods'
import { buildPlan } from '../plan'
import { profile } from './helpers'

function ctxFor(over: Parameters<typeof profile>[0] = {}, diet?: Parameters<typeof buildPlan>[1]) {
  const p = profile(over)
  return buildMenuContext(p, buildPlan(p, diet))!
}

const WEEK = '2026-10-05'

describe('slot plan', () => {
  it('2 meals: lunch+dinner when breakfast can be skipped, else breakfast+dinner', () => {
    expect(slotPlan({ mealsPerDay: 2, canSkipBreakfast: true, hungerTime: 'stable' }).map((s) => s.slot)).toEqual(['lunch', 'dinner'])
    expect(slotPlan({ mealsPerDay: 2, canSkipBreakfast: false, hungerTime: 'stable' }).map((s) => s.slot)).toEqual(['breakfast', 'dinner'])
  })
  it('evening hunger adds a night snack and a bigger dinner', () => {
    const sp = slotPlan({ mealsPerDay: 3, canSkipBreakfast: false, hungerTime: 'evening' })
    expect(sp.map((s) => s.slot)).toEqual(['breakfast', 'lunch', 'dinner', 'night'])
    expect(sp.at(-1)!.label).toBe('Gece ara öğün')
    expect(sp.reduce((a, s) => a + s.share, 0)).toBeCloseTo(1)
  })
  it('mondayOf', () => {
    expect(mondayOf('2026-10-09')).toBe('2026-10-05')
    expect(mondayOf('2026-10-05')).toBe('2026-10-05')
    expect(mondayOf('2026-10-11')).toBe('2026-10-05')
  })
})

describe('meal styles (öğün düzeni)', () => {
  const light = (id: string) => getFood(id)!.kind === 'light'
  const hearty = (id: string) => getFood(id)!.kind === 'hearty'

  it('light lunch + hearty dinner: smaller lunch share, light lunches, cooked dinners', () => {
    const ctx = ctxFor({ mealStyle: { breakfast: 'normal', lunch: 'light', dinner: 'hearty' } })
    const sp = slotPlan(ctx)
    const share = (s: string) => sp.find((x) => x.slot === s)!.share
    expect(share('lunch')).toBeLessThan(share('dinner') / 2)
    const m = generateWeekMenu(ctx, WEEK)
    const lunches = m.days.map((d) => d.items.find((i) => i.slot === 'lunch')!.foodId)
    const dinners = m.days.map((d) => d.items.find((i) => i.slot === 'dinner')!.foodId)
    expect(lunches.every(light)).toBe(true)
    // no fresh-fish plates as a light lunch
    expect(lunches.some((id) => ['levrek-roka', 'somon-avokado', 'levrek-bugulama', 'firin-hamsi', 'somon-sebze'].includes(id))).toBe(false)
    expect(dinners.filter(hearty).length).toBeGreaterThanOrEqual(6)
  })

  it('the opposite pattern (big lunch, light dinner) flips it', () => {
    const m = generateWeekMenu(ctxFor({ mealStyle: { breakfast: 'normal', lunch: 'hearty', dinner: 'light' } }), WEEK)
    const dinners = m.days.map((d) => d.items.find((i) => i.slot === 'dinner')!.foodId)
    expect(dinners.filter(light).length).toBeGreaterThanOrEqual(6)
  })

  it('normal days include Turkish home cooking (sulu yemek) and few salad dinners', () => {
    const m = generateWeekMenu(ctxFor(), WEEK)
    const mains = m.days.flatMap((d) => d.items.filter((i) => i.slot !== 'breakfast' && i.slot !== 'snack'))
    expect(mains.filter((i) => getFood(i.foodId)!.trad).length).toBeGreaterThanOrEqual(5)
    const dinners = m.days.map((d) => d.items.find((i) => i.slot === 'dinner')!.foodId)
    expect(dinners.filter(light).length).toBeLessThanOrEqual(2)
  })
})

describe('chosen meals (mealSlots)', () => {
  it('no lunch, afternoon snack + night snack: every chosen meal is in the menu', () => {
    const ctx = ctxFor({ mealSlots: ['breakfast', 'snack', 'dinner', 'night'] })
    expect(slotPlan(ctx).map((s) => s.slot)).toEqual(['breakfast', 'snack', 'dinner', 'night'])
    const m = generateWeekMenu(ctx, WEEK)
    for (const d of m.days) {
      expect(d.items.map((i) => i.slot)).toEqual(['breakfast', 'snack', 'dinner', 'night'])
      for (const i of d.items.filter((x) => x.slot === 'snack' || x.slot === 'night')) {
        expect(getFood(i.foodId)!.slots).toContain('snack')
      }
      // the two snacks of a day are different
      const snacks = d.items.filter((x) => x.slot === 'snack' || x.slot === 'night').map((x) => x.foodId)
      expect(new Set(snacks).size).toBe(2)
    }
  })
  it('changing the chosen meals makes the menu outdated', () => {
    const ctx = ctxFor()
    const m = generateWeekMenu(ctx, WEEK)
    expect(menuOutdated(m, { ...ctx, mealSlots: ['breakfast', 'snack', 'dinner'] })).toBe(true)
  })
})

describe('taste preferences', () => {
  it('fine-grained dislikes exclude matching dishes', () => {
    const m = generateWeekMenu(ctxFor({ dislikes: ['patlican', 'dana-kiyma', 'mercimek'] }), WEEK)
    for (const d of m.days) for (const i of d.items) {
      expect(getFood(i.foodId)!.name).not.toMatch(/patlıcan|karnıyarık|musakka|kıyma|köfte|mercimek/i)
    }
  })
  it('likes are favoured', () => {
    const count = (likes: string[]) =>
      generateWeekMenu(ctxFor({ likes }), WEEK).days.flatMap((d) => d.items).filter((i) => /çorba/i.test(getFood(i.foodId)!.name)).length
    expect(count(['corba'])).toBeGreaterThan(count([]))
  })
})

describe('weekly menu', () => {
  it('7 days, one item per slot, day kcal close to target', () => {
    const ctx = ctxFor()
    const m = generateWeekMenu(ctx, WEEK)
    expect(m.days).toHaveLength(7)
    expect(m.days[0].date).toBe(WEEK)
    expect(m.days[6].date).toBe('2026-10-11')
    for (const d of m.days) {
      expect(d.items.map((i) => i.slot)).toEqual(['breakfast', 'lunch', 'dinner'])
      const t = dayTotals(d)
      expect(Math.abs(t.kcal - ctx.kcal) / ctx.kcal).toBeLessThan(0.15)
    }
  })

  it('is deterministic for the same week and seed, different for another seed', () => {
    const ctx = ctxFor()
    expect(generateWeekMenu(ctx, WEEK)).toEqual(generateWeekMenu(ctx, WEEK))
    expect(generateWeekMenu(ctx, WEEK, 2)).not.toEqual(generateWeekMenu(ctx, WEEK, 1))
  })

  it('does not repeat a dish on consecutive days', () => {
    const m = generateWeekMenu(ctxFor(), WEEK)
    for (let d = 1; d < 7; d++) {
      const prev = new Set(m.days[d - 1].items.map((i) => i.foodId))
      for (const i of m.days[d].items) expect(prev.has(i.foodId)).toBe(false)
    }
  })

  it('the same main protein (meat, chicken, fish, tofu) rarely appears twice a day', () => {
    for (const over of [{}, { animalFoods: 'vegetarian' as const }, { animalFoods: 'pescatarian' as const }]) {
      const m = generateWeekMenu(ctxFor(over), WEEK)
      let repeats = 0
      for (const d of m.days) {
        const main = d.items.filter((i) => i.slot === 'lunch' || i.slot === 'dinner').map((i) => getFood(i.foodId)!)
        const key = (f: NonNullable<ReturnType<typeof getFood>>) => [...f.tags.filter((t) => ['redmeat', 'chicken', 'fish'].includes(t)), ...(f.soy ? ['soy'] : [])]
        if (main.length === 2 && key(main[0]).some((k) => key(main[1]).includes(k))) repeats++
      }
      expect(repeats, JSON.stringify(over)).toBeLessThanOrEqual(1)
    }
  })

  it('vegan: no animal products', () => {
    const m = generateWeekMenu(ctxFor({ animalFoods: 'vegan' }), WEEK)
    for (const d of m.days) for (const i of d.items) {
      expect(getFood(i.foodId)!.tags.some((t) => ['redmeat', 'chicken', 'fish', 'egg', 'dairy'].includes(t))).toBe(false)
    }
  })

  it('keto: every main meal ≤ 10 g carbs', () => {
    const ctx = ctxFor({}, { diet: 'keto' })
    expect(ctx.diet).toBe('keto')
    const m = generateWeekMenu(ctx, WEEK)
    for (const d of m.days) for (const i of d.items) {
      expect(getFood(i.foodId)!.carb * i.factor).toBeLessThanOrEqual(10)
    }
  })

  it('respects disliked ingredients and dishes, prefers liked ones', () => {
    const base = ctxFor({ dislikes: ['fish', 'egg'] })
    const m = generateWeekMenu(base, WEEK)
    for (const d of m.days) for (const i of d.items) {
      expect(getFood(i.foodId)!.tags.includes('fish') || getFood(i.foodId)!.tags.includes('egg')).toBe(false)
    }
    const banned = m.days[0].items[1].foodId
    const m2 = generateWeekMenu({ ...base, dislikedFoods: [banned] }, WEEK)
    expect(m2.days.flatMap((d) => d.items).some((i) => i.foodId === banned)).toBe(false)

    const liked: MenuContext = { ...base, likedFoods: ['nohut-salatasi'] }
    const count = (c: MenuContext) => generateWeekMenu(c, WEEK).days.flatMap((d) => d.items).filter((i) => i.foodId === 'nohut-salatasi').length
    expect(count(liked)).toBeGreaterThanOrEqual(count(base))
  })

  it('low cooking time prefers quick dishes', () => {
    const m = generateWeekMenu(ctxFor({ cookingTime: 'low' }), WEEK)
    for (const d of m.days) for (const i of d.items) expect(getFood(i.foodId)!.prep).toBe(1)
  })

  it('alternatives exclude the current dish and swap replaces it', () => {
    const ctx = ctxFor()
    const m = generateWeekMenu(ctx, WEEK)
    const day = m.days[2]
    const alts = alternativesFor(ctx, day, 'lunch')
    expect(alts.length).toBeGreaterThanOrEqual(3)
    expect(alts.map((a) => a.foodId)).not.toContain(day.items.find((i) => i.slot === 'lunch')!.foodId)
    const swapped = swapItem(m, day.date, 'lunch', alts[0].foodId, alts[0].factor)
    expect(swapped.days[2].items.find((i) => i.slot === 'lunch')!.foodId).toBe(alts[0].foodId)
    expect(swapped.days[1]).toBe(m.days[1])
  })

  it('removeDish replaces every occurrence', () => {
    const ctx = ctxFor()
    const m = generateWeekMenu(ctx, WEEK)
    const id = m.days[0].items[0].foodId
    const r = removeDish(m, ctx, id)
    expect(r.days.flatMap((d) => d.items).some((i) => i.foodId === id)).toBe(false)
    expect(r.days.flatMap((d) => d.items)).toHaveLength(m.days.flatMap((d) => d.items).length)
  })

  it('is outdated when the kcal target or a preference changes', () => {
    const ctx = ctxFor()
    const m = generateWeekMenu(ctx, WEEK)
    expect(menuOutdated(m, ctx)).toBe(false)
    expect(menuOutdated(m, { ...ctx, kcal: ctx.kcal + 150 })).toBe(true)
    expect(menuOutdated(m, { ...ctx, dislikes: ['fish'] })).toBe(true)
    expect(menuOutdated(m, { ...ctx, likedFoods: ['menemen'] })).toBe(false)
  })

  it('no menu context on a safety stop', () => {
    const p = profile({ age: 16 })
    expect(buildMenuContext(p, buildPlan(p))).toBeNull()
  })
})
