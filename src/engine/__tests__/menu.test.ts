import { describe, expect, it } from 'vitest'
import { alternativesFor, buildMenuContext, menuOutdated, removeDish, dayTotals, sumTotals, generateWeekMenu, mealTitle, mealTotals, plateName, mondayOf, partsOf, setMeal, slotPlan, type MenuItem, type WeekMenu } from '../menu'
import { LIGHT_MAINS, MAINS, SOUPS, partShort } from '../plateParts'
import type { Slot } from '../foods'
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

const mainOf = (d: { items: MenuItem[] }, slot: string) => d.items.find((i) => i.slot === slot)!
const kindOf = (id: string) => MAINS.find((m) => m.id === id)?.kind
const allParts = (m: WeekMenu) => m.days.flatMap((d) => d.items.flatMap(partsOf))

describe('meal styles (öğün düzeni)', () => {
  it('light lunch + hearty dinner: small lunches (soup or light plate), full cooked dinners', () => {
    const ctx = ctxFor({ mealStyle: { breakfast: 'normal', lunch: 'light', dinner: 'hearty' } })
    const sp = slotPlan(ctx)
    const share = (s: string) => sp.find((x) => x.slot === s)!.share
    expect(share('lunch')).toBeLessThan(share('dinner') / 2)
    const m = generateWeekMenu(ctx, WEEK)
    for (const d of m.days) {
      const lunch = mainOf(d, 'lunch')
      expect(SOUPS.includes(lunch.foodId) || LIGHT_MAINS.includes(lunch.foodId)).toBe(true)
      // light lunches are never fish plates
      expect(getFood(lunch.foodId)!.tags.includes('fish') && !lunch.foodId.includes('ton')).toBe(false)
      expect(mealTotals(lunch).kcal).toBeLessThan(mealTotals(mainOf(d, 'dinner')).kcal)
      expect(kindOf(mainOf(d, 'dinner').foodId)).toBeDefined()
    }
  })

  it('the opposite pattern (big lunch, light dinner) flips it', () => {
    const m = generateWeekMenu(ctxFor({ mealStyle: { breakfast: 'normal', lunch: 'hearty', dinner: 'light' } }), WEEK)
    for (const d of m.days) expect(mealTotals(mainOf(d, 'dinner')).kcal).toBeLessThan(mealTotals(mainOf(d, 'lunch')).kcal)
  })
})

describe('dietitian-style week (TÜBER frequencies)', () => {
  const ctx = ctxFor()
  const weeks = [1, 2, 3].map((seed) => generateWeekMenu(ctx, WEEK, seed))
  const mains = (m: WeekMenu) => m.days.flatMap((d) => d.items.filter((i) => i.slot === 'lunch' || i.slot === 'dinner')).map((i) => i.foodId)

  it('fish at most twice a week, never at lunch on a normal day', () => {
    for (const m of weeks) {
      expect(mains(m).filter((id) => kindOf(id) === 'balik').length).toBeLessThanOrEqual(2)
      expect(m.days.filter((d) => kindOf(mainOf(d, 'lunch').foodId) === 'balik')).toHaveLength(0)
    }
  })
  it('dry legumes 2–3 times, mostly sulu sebze yemekleri, little red meat', () => {
    for (const m of weeks) {
      const k = mains(m).map(kindOf)
      const n = (x: string) => k.filter((y) => y === x).length
      expect(n('baklagil')).toBeGreaterThanOrEqual(2)
      expect(n('baklagil')).toBeLessThanOrEqual(3)
      expect(n('sebze') + n('baklagil')).toBeGreaterThanOrEqual(6)
      expect(n('kirmizi')).toBeLessThanOrEqual(3)
    }
  })
  it('no main dish twice in a week; never the same kind twice a day (except vegetable dishes)', () => {
    for (const m of weeks) {
      const ids = mains(m)
      expect(new Set(ids).size).toBe(ids.length)
      for (const d of m.days) {
        const a = kindOf(mainOf(d, 'lunch').foodId)
        const b = kindOf(mainOf(d, 'dinner').foodId)
        if (a !== 'sebze') expect(a).not.toBe(b)
      }
    }
  })
  it('main meals are full plates: grain or bread, yoghurt (not with fish), salad; soup only some days', () => {
    for (const m of weeks) {
      let soups = 0
      for (const d of m.days) for (const slot of ['lunch', 'dinner']) {
        const i = mainOf(d, slot)
        const ids = partsOf(i).map((x) => x.foodId)
        const fish = kindOf(i.foodId) === 'balik'
        expect(ids.some((id) => ['pc-salata', 'pc-coban', 'pc-roka'].includes(id))).toBe(true)
        expect(ids.some((id) => ['pc-yogurt', 'pc-cacik', 'pc-ayran'].includes(id))).toBe(!fish)
        if (ids.some((id) => SOUPS.includes(id))) soups++
      }
      // Soup is added when the day needs it, not every day.
      expect(soups).toBeLessThanOrEqual(5)
    }
  })
  it('breakfasts are Turkish breakfast plates; snacks are fruit + nuts or dairy (no odd pairs)', () => {
    const m = generateWeekMenu(ctxFor({ mealSlots: ['breakfast', 'lunch', 'snack', 'dinner'] }), WEEK)
    for (const d of m.days) {
      const b = partsOf(mainOf(d, 'breakfast')).map((x) => x.foodId)
      expect(b.some((id) => ['pc-yumurta', 'yl-menemen-yalniz', 'yl-kasarli-omlet', 'yl-sebzeli-omlet', 'pc-yulaf', 'pc-lor', 'pc-yogurt'].includes(id))).toBe(true)
      const s = partsOf(mainOf(d, 'snack')).map((x) => x.foodId)
      expect(s.every((id) => id.startsWith('pc-'))).toBe(true)
      expect(s).not.toEqual(['pc-lor', 'pc-sogus'])
    }
  })
  it('same pot, two days: with batch cooking a dinner pot dish comes back the next day', () => {
    const m = generateWeekMenu(ctxFor({ batchCooking: true }), WEEK)
    let carried = 0
    for (let d = 1; d < 7; d++) {
      for (const i of m.days[d].items.filter((x) => x.leftover)) {
        carried++
        expect(mainOf(m.days[d - 1], 'dinner').foodId).toBe(i.foodId)
        expect(['sebze', 'baklagil']).toContain(kindOf(i.foodId))
        expect(mealTitle(i)).toMatch(/dünkü tencereden/)
      }
      // never twice on the same day
      const mains = m.days[d].items.filter((x) => x.slot === 'lunch' || x.slot === 'dinner').map((x) => x.foodId)
      expect(new Set(mains).size).toBe(mains.length)
    }
    expect(carried).toBeGreaterThanOrEqual(2)
    expect(generateWeekMenu(ctxFor(), WEEK).days.flatMap((d) => d.items).some((i) => i.leftover)).toBe(false)
  })
  it('seasonal: no strawberries, okra or çoban salata in winter; no leek or spinach dishes in summer', () => {
    const winter = allParts(generateWeekMenu(ctxFor({ mealSlots: ['breakfast', 'lunch', 'snack', 'dinner'] }), '2027-01-11'))
    for (const id of ['pc-cilek', 'pc-karpuz', 'pc-uzum', 'yl-etli-bamya-tabak', 'yl-etli-taze-fasulye', 'pc-coban']) expect(winter.map((x) => x.foodId), id).not.toContain(id)
    const summer = allParts(generateWeekMenu(ctxFor({ mealSlots: ['breakfast', 'lunch', 'snack', 'dinner'] }), '2027-07-12'))
    for (const id of ['yl-zy-pirasa-tabak', 'yl-kiymali-ispanak-tabak', 'pc-portakal', 'pc-mandalina']) expect(summer.map((x) => x.foodId), id).not.toContain(id)
  })
  it('plate titles match what is on the plate', () => {
    for (const over of [{}, { mealSlots: ['breakfast', 'lunch', 'snack', 'dinner', 'night'] as Slot[] }, { mealStyle: { breakfast: 'normal' as const, lunch: 'light' as const, dinner: 'normal' as const } }]) {
      for (const seed of [1, 2]) {
        for (const d of generateWeekMenu(ctxFor(over), WEEK, seed).days) {
          for (const i of d.items) {
            const title = mealTitle(i).toLocaleLowerCase('tr')
            // every named part is in the title …
            for (const x of partsOf(i)) {
              const n = partShort(x.foodId)
              const plain = ['pc-ekmek', 'pc-sogus'].includes(x.foodId) && i.slot === 'breakfast'
              if (n && !plain && (i.slot === 'breakfast' || i.slot === 'snack' || i.slot === 'night')) expect(title, title).toContain(n)
            }
            // … and a main dish's plate is named after its main dish
            if (i.slot === 'lunch' || i.slot === 'dinner') expect(title).toContain(plateName(getFood(i.foodId)!.name).toLocaleLowerCase('tr'))
          }
        }
      }
    }
  })
  it('no dish twice on one day (e.g. menemen at breakfast and lunch)', () => {
    const m = generateWeekMenu(ctxFor({ mealStyle: { breakfast: 'normal', lunch: 'light', dinner: 'normal' } }), WEEK)
    for (const d of m.days) {
      const dishes = d.items.flatMap(partsOf).map((x) => x.foodId).filter((id) => !id.startsWith('pc-'))
      expect(new Set(dishes).size).toBe(dishes.length)
    }
  })
  it('the next week (and a rebuilt week) brings other main dishes', () => {
    const ctx = ctxFor()
    const a = generateWeekMenu(ctx, WEEK)
    const b = generateWeekMenu(ctx, '2026-10-12', 1, a)
    const mainsOf = (m: WeekMenu) => new Set(m.days.flatMap((d) => d.items.filter((i) => i.slot === 'lunch' || i.slot === 'dinner').map((i) => i.foodId)))
    const shared = [...mainsOf(b)].filter((id) => mainsOf(a).has(id)).length
    expect(shared).toBeLessThanOrEqual(5)
  })
  it('bread: at most 2 slices per meal (3 at breakfast)', () => {
    for (const m of weeks) for (const d of m.days) for (const i of d.items) for (const x of partsOf(i)) {
      if (x.foodId === 'pc-ekmek') expect(x.factor).toBeLessThanOrEqual(i.slot === 'breakfast' ? 3 : 2)
    }
  })
})

describe('chosen meals (mealSlots)', () => {
  it('no lunch, afternoon snack + night snack: every chosen meal is in the menu', () => {
    const ctx = ctxFor({ mealSlots: ['breakfast', 'snack', 'dinner', 'night'] })
    expect(slotPlan(ctx).map((s) => s.slot)).toEqual(['breakfast', 'snack', 'dinner', 'night'])
    const m = generateWeekMenu(ctx, WEEK)
    for (const d of m.days) {
      expect(d.items.map((i) => i.slot)).toEqual(['breakfast', 'snack', 'dinner', 'night'])
      expect(mainOf(d, 'snack').title).not.toBe(mainOf(d, 'night').title)
    }
  })
  it('changing the chosen meals makes the menu outdated', () => {
    const ctx = ctxFor()
    const m = generateWeekMenu(ctx, WEEK)
    expect(menuOutdated(m, { ...ctx, mealSlots: ['breakfast', 'snack', 'dinner'] })).toBe(true)
  })
})

describe('taste preferences', () => {
  it('fine-grained dislikes exclude matching dishes and parts', () => {
    const m = generateWeekMenu(ctxFor({ dislikes: ['patlican', 'dana-kiyma', 'mercimek'] }), WEEK)
    for (const x of allParts(m)) expect(getFood(x.foodId)!.name).not.toMatch(/patlıcan|karnıyarık|imam|kıyma|köfte|mercimek|ezogelin/i)
  })
  it('likes are favoured', () => {
    const count = (likes: string[]) => {
      let n = 0
      for (const seed of [1, 2, 3]) n += allParts(generateWeekMenu(ctxFor({ likes }), WEEK, seed)).filter((x) => /fasulye/i.test(getFood(x.foodId)!.name)).length
      return n
    }
    expect(count(['fasulye'])).toBeGreaterThan(count([]))
  })
  it('no dairy: plates come without yoghurt and cheese', () => {
    const m = generateWeekMenu(ctxFor({ dislikes: ['t-dairy'] }), WEEK)
    for (const x of allParts(m)) expect(getFood(x.foodId)!.tags).not.toContain('dairy')
  })
})

describe('weekly menu', () => {
  it('7 days, every chosen meal, the day just under the kcal target', () => {
    const ctx = ctxFor()
    const m = generateWeekMenu(ctx, WEEK)
    expect(m.days).toHaveLength(7)
    expect(m.days[0].date).toBe(WEEK)
    expect(m.days[6].date).toBe('2026-10-11')
    for (const d of m.days) {
      expect(d.items.map((i) => i.slot)).toEqual(['breakfast', 'lunch', 'dinner'])
      const t = dayTotals(d)
      expect(t.kcal).toBeLessThanOrEqual(ctx.kcal)
      expect(t.kcal).toBeGreaterThanOrEqual(ctx.kcal * 0.93)
    }
  })

  it('is deterministic for the same week and seed, different for another seed', () => {
    const ctx = ctxFor()
    expect(generateWeekMenu(ctx, WEEK)).toEqual(generateWeekMenu(ctx, WEEK))
    expect(generateWeekMenu(ctx, WEEK, 2)).not.toEqual(generateWeekMenu(ctx, WEEK, 1))
  })

  it('vegetarian and pescatarian plates respect the choice', () => {
    for (const a of ['vegetarian', 'pescatarian'] as const) {
      for (const x of allParts(generateWeekMenu(ctxFor({ animalFoods: a }), WEEK))) {
        const t = getFood(x.foodId)!.tags
        expect(t.includes('redmeat') || t.includes('chicken') || (a === 'vegetarian' && t.includes('fish'))).toBe(false)
      }
    }
  })

  it('vegan: no animal products', () => {
    const m = generateWeekMenu(ctxFor({ animalFoods: 'vegan' }), WEEK)
    for (const x of allParts(m)) expect(getFood(x.foodId)!.tags.some((t) => ['redmeat', 'chicken', 'fish', 'egg', 'dairy'].includes(t))).toBe(false)
  })

  it('keto: every main meal ≤ 10 g carbs', () => {
    const ctx = ctxFor({}, { diet: 'keto' })
    expect(ctx.diet).toBe('keto')
    const m = generateWeekMenu(ctx, WEEK)
    for (const d of m.days) for (const i of d.items) expect(mealTotals(i).carb).toBeLessThanOrEqual(10)
  })

  it('respects disliked ingredients and dishes', () => {
    const base = ctxFor({ dislikes: ['fish', 'egg'] })
    const m = generateWeekMenu(base, WEEK)
    for (const x of allParts(m)) expect(getFood(x.foodId)!.tags.includes('fish') || getFood(x.foodId)!.tags.includes('egg')).toBe(false)
    const banned = mainOf(m.days[0], 'lunch').foodId
    const m2 = generateWeekMenu({ ...base, dislikedFoods: [banned] }, WEEK)
    expect(allParts(m2).some((x) => x.foodId === banned)).toBe(false)
  })

  it('low cooking time prefers quick dishes', () => {
    const m = generateWeekMenu(ctxFor({ cookingTime: 'low' }), WEEK)
    const mains = m.days.flatMap((d) => [mainOf(d, 'lunch'), mainOf(d, 'dinner')]).map((i) => MAINS.find((x) => x.id === i.foodId))
    expect(mains.filter((x) => x?.quick).length).toBeGreaterThanOrEqual(8)
  })

  it('alternatives are other plates, tuned to the day; setMeal puts one in', () => {
    const ctx = ctxFor()
    const m = generateWeekMenu(ctx, WEEK)
    const day = m.days[2]
    for (const slot of ['breakfast', 'lunch', 'dinner'] as const) {
      const alts = alternativesFor(ctx, day, slot)
      expect(alts.length, slot).toBeGreaterThanOrEqual(3)
      expect(alts.map((a) => a.title)).not.toContain(mainOf(day, slot).title)
      for (const a of alts) {
        const t = dayTotals(setMeal(m, day.date, a).days[2])
        expect(t.kcal).toBeLessThanOrEqual(ctx.kcal)
        expect(t.kcal).toBeGreaterThan(ctx.kcal * 0.85)
      }
    }
    const alt = alternativesFor(ctx, day, 'lunch')[0]
    const swapped = setMeal(m, day.date, alt)
    expect(mainOf(swapped.days[2], 'lunch')).toEqual(alt)
    expect(swapped.days[1]).toBe(m.days[1])
  })

  it('removeDish replaces every meal built on it', () => {
    const ctx = ctxFor()
    const m = generateWeekMenu(ctx, WEEK)
    const id = mainOf(m.days[0], 'lunch').foodId
    const r = removeDish(m, ctx, id)
    expect(allParts(r).some((x) => x.foodId === id)).toBe(false)
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

describe('daily targets', () => {
  const cases: [string, Parameters<typeof profile>[0], Parameters<typeof buildPlan>[1]?][] = [
    ['default', {}],
    ['light lunch, hearty dinner', { mealStyle: { breakfast: 'normal', lunch: 'light', dinner: 'hearty' } }],
    ['4 meals', { mealSlots: ['breakfast', 'lunch', 'snack', 'dinner'] }],
    ['two meals', { mealSlots: ['lunch', 'dinner'] }],
    ['low carb', {}, { diet: 'lowcarb' }],
    ['mediterranean', {}, { diet: 'med' }],
    ['vegetarian', { animalFoods: 'vegetarian' }],
    ['small woman', { sex: 'f', weightKg: 62, heightCm: 158, age: 45 }],
  ]
  for (const [name, over, diet] of cases) {
    it(`${name}: never over the kcal target, on average ≥ 93 % of it, carbs close`, () => {
      const ctx = ctxFor(over, diet)
      const kc: number[] = []
      const cb: number[] = []
      for (const seed of [1, 2, 3]) {
        for (const day of generateWeekMenu(ctx, WEEK, seed).days) {
          const t = dayTotals(day)
          expect(t.kcal).toBeLessThanOrEqual(ctx.kcal)
          kc.push(t.kcal / ctx.kcal)
          cb.push(t.carb / ctx.carbG!)
        }
      }
      const avg = (a: number[]) => a.reduce((x, y) => x + y) / a.length
      expect(avg(kc)).toBeGreaterThanOrEqual(0.93)
      expect(Math.min(...kc)).toBeGreaterThanOrEqual(0.8)
      expect(avg(cb)).toBeGreaterThan(0.75)
      expect(avg(cb)).toBeLessThan(1.2)
    })
  }
})

describe('Ramazan', () => {
  it('sahur, iftar (soup + date, the main meal) and a light snack after iftar', () => {
    const ctx = ctxFor({ ramadan: true })
    expect(slotPlan(ctx).map((s) => s.label)).toEqual(['Sahur', 'İftar', 'İftar sonrası'])
    const m = generateWeekMenu(ctx, WEEK)
    for (const d of m.days) {
      expect(d.items.map((i) => i.slot)).toEqual(['breakfast', 'dinner', 'night'])
      const iftar = d.items.find((i) => i.slot === 'dinner')!
      const ids = partsOf(iftar).map((x) => x.foodId)
      expect(ids.some((id) => SOUPS.includes(id))).toBe(true)
      expect(ids).toContain('pc-hurma')
      expect(mealTotals(iftar).kcal).toBeGreaterThan(mealTotals(d.items[2]).kcal)
      expect(dayTotals(d).kcal).toBeLessThanOrEqual(ctx.kcal)
    }
    expect(menuOutdated(m, { ...ctx, ramadan: false })).toBe(true)
  })
})

describe('special day', () => {
  it('the evening is free, the day and the rest of the week are lighter, weekly total stays on target', () => {
    const ctx = ctxFor()
    const m = generateWeekMenu(ctx, WEEK, 1, null, ['2026-10-09'])
    expect(m.special).toEqual(['2026-10-09'])
    const day = m.days[4]
    const dinner = mainOf(day, 'dinner')
    expect(dinner.foodId).toBe('ozel-davet')
    const others = day.items.filter((i) => i.slot !== 'dinner')
    expect(others.length).toBe(2)
    expect(sumTotals(others.map(mealTotals)).kcal).toBeLessThanOrEqual(ctx.kcal - 1000)
    const normal = m.days.filter((_, i) => i !== 4).map((d) => dayTotals(d).kcal)
    for (const k of normal) expect(k).toBeLessThan(ctx.kcal)
    const week = m.days.reduce((a, d) => a + dayTotals(d).kcal, 0)
    expect(week).toBeLessThanOrEqual(ctx.kcal * 7)
  })
})
