import { describe, expect, it } from 'vitest'
import { mealStart, mealWindow, timingTips, DEFAULT_MEAL_TIMES } from '../timing'

describe('meal timing', () => {
  it('windows per meal; night snack uses its own time', () => {
    expect(mealWindow({ slot: 'breakfast', label: 'Kahvaltı' })).toBe('08:00–09:00')
    expect(mealWindow({ slot: 'snack', label: 'Ara öğün' })).toBe('16:30–17:00')
    expect(mealStart({ slot: 'snack', label: 'Gece ara öğün' })).toBe('21:30')
    expect(mealWindow({ slot: 'dinner', label: 'Akşam' }, { ...DEFAULT_MEAL_TIMES, dinner: '23:30' })).toBe('23:30–00:30')
  })
  it('tips for late meals and long gaps', () => {
    const plan = [{ slot: 'breakfast' as const, label: 'Kahvaltı' }, { slot: 'dinner' as const, label: 'Akşam' }]
    expect(timingTips(plan).join(' ')).toMatch(/7 saatten uzun/)
    expect(timingTips(plan, { ...DEFAULT_MEAL_TIMES, dinner: '22:30' }).join(' ')).toMatch(/22:00 sonrasında/)
    expect(timingTips([{ slot: 'lunch', label: 'Öğle' }, { slot: 'dinner', label: 'Akşam' }])).toEqual([])
  })
})
