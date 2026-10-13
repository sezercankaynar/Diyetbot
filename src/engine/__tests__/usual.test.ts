import { describe, expect, it } from 'vitest'
import type { DiaryEntry } from '../diary'
import { buildMenuContext, generateWeekMenu, partsOf, alternativesFor } from '../menu'
import { buildPlan } from '../plan'
import { frequentFoods, usualMains, usualMeals } from '../usual'
import { profile } from './helpers'

const today = '2026-10-13'
let n = 0
const e = (date: string, foodId: string, factor = 1, menuSlot?: DiaryEntry['menuSlot']): DiaryEntry => ({ id: `e${n++}`, date, foodId, factor, menuSlot })
const tostBreakfast = (date: string) => [
  e(date, 'yl-karisik-tost', 1, 'breakfast'), e(date, 'yl-cay-sekersiz', 2, 'breakfast'), e(date, 'pc-zeytin', 6, 'breakfast'),
]

describe('what the user really eats', () => {
  const diary: DiaryEntry[] = [
    ...tostBreakfast('2026-10-10'), ...tostBreakfast('2026-10-12'),
    e('2026-10-12', 'yl-sutlu-cikolata-kare', 1), e('2026-10-11', 'yl-sutlu-cikolata-kare', 1.5),
    // A ticked menu plate: its parts don't count as picked foods.
    e('2026-10-11', 'pc-yogurt', 1, 'lunch'), e('2026-10-11', 'pc-bulgur', 6, 'lunch'),
    e('2026-10-09', 'yl-mercimek-corbasi-kase', 1, 'dinner'), e('2026-10-12', 'yl-mercimek-corbasi-kase', 1, 'dinner'),
    e('2026-08-01', 'yl-baklava', 1),
  ]

  it('menu plates the user only ticked are not "their" foods', () => {
    const ticked = [e('2026-10-12', 'yl-zy-bezelye-tabak', 1, 'lunch'), e('2026-10-11', 'yl-zy-bezelye-tabak', 1, 'lunch')].map((x) => ({ ...x, fromMenu: true }))
    expect(frequentFoods(ticked, today)).toEqual([])
    expect(usualMains(ticked, today)).toEqual([])
  })

  it('frequent foods: most logged first, last amount, no menu parts, nothing older than 30 days', () => {
    const f = frequentFoods(diary, today)
    expect(f.map((x) => x.foodId)).toEqual(expect.arrayContaining(['yl-karisik-tost', 'yl-sutlu-cikolata-kare']))
    expect(f.some((x) => x.foodId.startsWith('pc-'))).toBe(false)
    expect(f.some((x) => x.foodId === 'yl-baklava')).toBe(false)
    expect(f.find((x) => x.foodId === 'yl-sutlu-cikolata-kare')!.factor).toBe(1)
  })

  it('a breakfast eaten on 2+ days becomes a usual meal; saved meals count right away', () => {
    const own = usualMeals(diary, [], today)
    expect(own).toHaveLength(1)
    expect(own[0].slot).toBe('breakfast')
    expect(own[0].parts.map((x) => x.foodId).sort()).toEqual(['pc-zeytin', 'yl-cay-sekersiz', 'yl-karisik-tost'])
    const saved = usualMeals([], [{ id: 's', name: 'Benim kahvaltım', slot: 'breakfast', items: [{ foodId: 'yl-peynirli-tost', factor: 1 }] }], today)
    expect(saved[0].title).toBe('Benim kahvaltım')
    expect(usualMains(diary, today)).toEqual(['yl-mercimek-corbasi-kase'])
  })

  it('next menus offer the usual breakfast on some days (and in the swap list)', () => {
    const p = profile()
    const own = usualMeals(diary, [], today)
    const ctx = buildMenuContext(p, buildPlan(p), undefined, { ownMeals: own })!
    const menu = generateWeekMenu(ctx, '2026-10-19')
    const days = menu.days.filter((d) => d.items.some((i) => i.slot === 'breakfast' && partsOf(i).some((x) => x.foodId === 'yl-karisik-tost')))
    expect(days.length).toBeGreaterThanOrEqual(2)
    expect(days.length).toBeLessThanOrEqual(3)
    const other = menu.days.find((d) => !days.includes(d))!
    expect(alternativesFor(ctx, other, 'breakfast').some((i) => partsOf(i).some((x) => x.foodId === 'yl-karisik-tost'))).toBe(true)
  })
})
