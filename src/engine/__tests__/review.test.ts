import { describe, expect, it } from 'vitest'
import { backupDue, plateauAdvice, weekSummary, weightChange } from '../review'
import { linearLogs, profile } from './helpers'
import type { DiaryEntry } from '../diary'
import type { DailyLog } from '../coach'

const TODAY = '2026-10-12'

describe('week summary', () => {
  it('counts logged days, targets, water, steps and workouts; names wins and focus', () => {
    const dates = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']
    const diary: DiaryEntry[] = dates.slice(0, 6).map((d, k) => ({ id: `e${k}`, date: d, foodId: 'yl-etli-kuru-fasulye-tabak', factor: 5 }))
    const daily: DailyLog[] = dates.map((d, k) => ({ date: d, water: k < 5 ? 10 : 2, habits: [], steps: 4000, workout: k % 3 === 0 }))
    const s = weekSummary({ today: TODAY, diary, daily, logs: [], kcalTarget: 1900, proteinTarget: 128, waterTarget: 10, stepTarget: 9000 })
    expect(s.from).toBe('2026-10-05')
    expect(s.to).toBe('2026-10-11')
    expect(s.loggedDays).toBe(6)
    expect(s.onTargetDays).toBe(6) // 5 × 373 = 1865
    expect(s.waterDays).toBe(5)
    expect(s.workouts).toBe(3)
    expect(s.wins.join(' ')).toMatch(/6\/7 gün/)
    expect(s.focus.join(' ')).toMatch(/Adım ortalaman 4\.000/)
  })
})

describe('weight change and plateau', () => {
  it('7-day average change', () => {
    const logs = linearLogs(80, -0.5, 28)
    expect(weightChange(logs, logs.at(-1)!.date, 7)).toBeCloseTo(-0.5, 1)
  })
  it('stalled for 2+ weeks while losing → advice; losing → none', () => {
    const flat = linearLogs(80, 0, 28)
    const today = flat.at(-1)!.date
    const a = plateauAdvice(profile({ sex: 'f', sleepHours: 6 }), flat, [], [], 1800, 9000, today)!
    expect(a).not.toBeNull()
    expect(a.points.join(' ')).toMatch(/adet döngüsü/)
    expect(a.points.join(' ')).toMatch(/Uykun/)
    expect(a.points.join(' ')).toMatch(/14 günün 0/)
    expect(plateauAdvice(profile(), linearLogs(80, -0.6, 28), [], [], 1800, 9000, today)).toBeNull()
    expect(plateauAdvice(profile({ goal: 'maintain' }), flat, [], [], 1800, 9000, today)).toBeNull()
  })
})

describe('backup reminder', () => {
  it('after 30 days since the last backup, or a week of use without one', () => {
    expect(backupDue('2026-09-01T10:00:00Z', '2026-08-01', TODAY)).toBe(true)
    expect(backupDue('2026-10-01T10:00:00Z', '2026-08-01', TODAY)).toBe(false)
    expect(backupDue(undefined, '2026-10-01', TODAY)).toBe(true)
    expect(backupDue(undefined, '2026-10-10', TODAY)).toBe(false)
  })
})
