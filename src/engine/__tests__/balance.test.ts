import { describe, expect, it } from 'vitest'
import { amountWays, applyBalance, buildMenuContext, dayTotals, generateWeekMenu, weekBalance } from '../menu'
import { buildPlan } from '../plan'
import { profile } from './helpers'

describe('weekly balance', () => {
  const p = profile()
  const plan = buildPlan(p)
  const ctx = buildMenuContext(p, plan)!
  const menu = generateWeekMenu(ctx, '2026-10-12') // Monday
  const T = ctx.kcal
  const floor = plan.energy!.floor

  it('spreads days over the target over the remaining days, at most 200 a day', () => {
    const eaten = (d: string) => (d === '2026-10-12' ? T + 500 : d === '2026-10-13' ? T + 100 : null)
    const b = weekBalance(menu, T, floor, eaten, '2026-10-14')
    expect(b.pending).toBe(600)
    expect(b.overDays.map((d) => d.date)).toEqual(['2026-10-12', '2026-10-13'])
    expect(b.plan.map((x) => x.date)).toEqual(['2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18'])
    expect(b.plan.every((x) => x.add === 150)).toBe(true)
    // Applied: those days' menus fit the lighter target and the offer is used up.
    const m = applyBalance(menu, T, b.plan)
    for (const x of b.plan) expect(dayTotals(m.days.find((d) => d.date === x.date)!).kcal).toBeLessThanOrEqual(T - 150)
    expect(weekBalance(m, T, floor, eaten, '2026-10-14').pending).toBe(0)
  })

  it('under-target days give no extra food; a big over is capped per day', () => {
    expect(weekBalance(menu, T, floor, () => T - 400, '2026-10-14').pending).toBe(0)
    const b = weekBalance(menu, T, floor, (d) => (d === '2026-10-12' ? T + 3000 : null), '2026-10-16')
    expect(b.plan.every((x) => x.add <= 200)).toBe(true)
  })
})

describe('amount in grams or pieces', () => {
  it('reads the portion weight and countable units', () => {
    expect(amountWays('yl-tavuklu-pilav-sade').grams).toBe(300)
    expect(amountWays('pc-ekmek')).toEqual({ grams: 25, count: { unit: 'dilim', perOne: 1 } })
    expect(amountWays('yl-pankek').count).toEqual({ unit: 'adet', perOne: 1 / 3 })
    // A description of several things has no single count.
    expect(amountWays('kasarli-tost').count).toBeUndefined()
  })
})
