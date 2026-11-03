import { describe, expect, it } from 'vitest'
import type { DiaryEntry } from '../diary'
import { DEFAULT_SHARE_PREFS, onTarget, shareDay, weightTrend } from '../share'
import { itemTotals } from '../menu'
const k = (id: string) => itemTotals(id, 1).kcal

const meals = [{ slot: 'breakfast' as const, label: 'Kahvaltı' }, { slot: 'lunch' as const, label: 'Öğle' }]
const diary: DiaryEntry[] = [
  { id: '1', date: '2026-11-03', foodId: 'yl-karisik-tost', factor: 1, menuSlot: 'breakfast' },
  { id: '2', date: '2026-11-03', foodId: 'pc-ayran', factor: 1, menuSlot: 'lunch' },
  { id: '3', date: '2026-11-03', foodId: 'yl-sutlu-cikolata-kare', factor: 1 },
  { id: '4', date: '2026-11-02', foodId: 'pc-ayran', factor: 1, menuSlot: 'lunch' },
]
const logs = [
  { date: '2026-10-22', kg: 80.4 }, { date: '2026-10-25', kg: 80.2 },
  { date: '2026-10-29', kg: 79.9 }, { date: '2026-11-02', kg: 79.7 },
]
const base = { date: '2026-11-03', diary, log: { date: '2026-11-03', water: 5, habits: [], steps: 8200, workout: true }, target: 1900, proteinTarget: 110, waterTarget: 9, stepTarget: 8000, meals, logs }

describe('what is shared with the partner', () => {
  it('totals, workout, steps, water always; foods and weight trend by choice; exact weight off by default', () => {
    const d = shareDay({ ...base, prefs: DEFAULT_SHARE_PREFS })
    expect(d).toMatchObject({ logged: true, kcal: k('yl-karisik-tost') + k('pc-ayran') + k('yl-sutlu-cikolata-kare'), target: 1900, water: 5, workout: true, steps: 8200 })
    expect(d.meals).toEqual([
      { label: 'Kahvaltı', foods: ['Karışık tost (kaşar + sucuk)'], kcal: 534 },
      { label: 'Öğle', foods: ['Ayran'], kcal: k('pc-ayran') },
    ])
    expect(d.extras).toEqual(['Sütlü çikolata (2 kare)'])
    expect(d.weightChange).toBe(-0.5)
    expect(d.weightKg).toBeUndefined()
    const private_ = shareDay({ ...base, prefs: { foods: false, weightChange: false, weightExact: true } })
    expect(private_.meals).toBeUndefined()
    expect(private_.extras).toBeUndefined()
    expect(private_.weightChange).toBeUndefined()
    expect(private_.weightKg).toBe(79.7)
  })

  it('weight trend needs weigh-ins in both weeks; on target = logged and within ±10 %', () => {
    expect(weightTrend(logs.slice(2), '2026-11-03')).toBeNull()
    expect(onTarget({ logged: true, kcal: 1750, target: 1900 })).toBe(true)
    expect(onTarget({ logged: true, kcal: 2150, target: 1900 })).toBe(false)
    expect(onTarget({ logged: false, kcal: 0, target: 1900 })).toBe(false)
  })
})
