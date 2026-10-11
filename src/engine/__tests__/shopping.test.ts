import { describe, expect, it } from 'vitest'
import { shoppingList, shoppingText } from '../shopping'
import { buildMenuContext, generateWeekMenu } from '../menu'
import { buildPlan } from '../plan'
import { profile } from './helpers'

describe('shopping list', () => {
  const p = profile()
  const ctx = buildMenuContext(p, buildPlan(p))!
  const m = generateWeekMenu(ctx, '2026-10-05')
  it('breaks the menu into raw ingredients, grouped, with market amounts', () => {
    const l = shoppingList(m.days)
    const all = l.groups.flatMap((g) => g.items)
    expect(l.groups.map((g) => g.category)).toContain('Sebze')
    expect(all.length).toBeGreaterThan(15)
    // cooked pilav becomes dry bulgur/pirinç; no "haşlanmış" items to buy
    expect(all.some((i) => /haşlanmış/.test(i.name) && /Bulgur|Pirinç/.test(i.name))).toBe(false)
    const egg = all.find((i) => i.id === 'yumurta')
    if (egg) expect(egg.amount).toMatch(/adet$/)
    const bread = all.find((i) => i.id === 'ekmek-tam-bugday')!
    expect(bread.amount).toMatch(/dilim$/)
  })
  it('fewer days → less to buy; text export', () => {
    const week = shoppingList(m.days).groups.flatMap((g) => g.items).reduce((a, i) => a + i.grams, 0)
    const two = shoppingList(m.days.slice(5)).groups.flatMap((g) => g.items).reduce((a, i) => a + i.grams, 0)
    expect(two).toBeLessThan(week)
    expect(shoppingText(shoppingList(m.days), 'Alışveriş')).toMatch(/^Alışveriş\n\nSebze:/)
  })
})
