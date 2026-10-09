import { describe, expect, it } from 'vitest'
import { adjustmentCooldown, analyzeWeek, rollingAverage, targetWeeklyChange } from '../tracking'
import type { AnalysisInput, WeeklyAnalysis } from '../tracking'
import { linearLogs } from './helpers'

const lose: AnalysisInput = { goal: 'lose', weeklyRatePct: 0.5, experience: 'mid', weightKg: 80 }
const gainNew: AnalysisInput = { goal: 'gain', weeklyRatePct: 0.5, experience: 'new', weightKg: 70 }
const gainMid: AnalysisInput = { ...gainNew, experience: 'mid' }
const maintain: AnalysisInput = { goal: 'maintain', weeklyRatePct: 0.5, experience: 'mid', weightKg: 75 }

function ready(a: WeeklyAnalysis) {
  if (a.status !== 'ready') throw new Error('expected ready analysis')
  return a
}

describe('rolling average', () => {
  it('7-day trailing mean, handles gaps', () => {
    const r = rollingAverage([
      { date: '2026-01-03', kg: 82 },
      { date: '2026-01-01', kg: 80 },
      { date: '2026-01-10', kg: 90 },
    ])
    expect(r).toEqual([
      { date: '2026-01-01', avg: 80 },
      { date: '2026-01-03', avg: 81 },
      { date: '2026-01-10', avg: 90 }, // 01-03 is outside the 7-day window
    ])
  })
})

describe('weekly analysis – insufficient data', () => {
  it('reports remaining days before 14', () => {
    expect(analyzeWeek(linearLogs(80, -0.5, 10), lose)).toEqual({
      status: 'insufficient', daysLogged: 10, daysRemaining: 4,
    })
    expect(analyzeWeek([], lose)).toMatchObject({ status: 'insufficient', daysRemaining: 14 })
  })
  it('weekly rate = mean(last 7) − mean(previous 7)', () => {
    const a = ready(analyzeWeek(linearLogs(80, -0.4), lose))
    expect(a.weeklyRate).toBeCloseTo(-0.4)
  })
})

describe('weekly analysis – lose', () => {
  it('target = −weight × rate%', () => {
    expect(targetWeeklyChange(lose)).toBeCloseTo(-0.4)
  })
  it('on track → keep', () => {
    expect(ready(analyzeWeek(linearLogs(80, -0.4), lose)).verdict).toBe('keep')
  })
  it('slower than 50% → −150 kcal or +2000 steps', () => {
    const a = ready(analyzeWeek(linearLogs(80, -0.1), lose))
    expect(a.verdict).toBe('adjust')
    expect(a.options.map((o) => [o.kcalDelta, o.stepsDelta])).toEqual([[-150, 0], [0, 2000]])
  })
  it('faster than 150% → +150 kcal', () => {
    const a = ready(analyzeWeek(linearLogs(80, -0.7), lose))
    expect(a.options.map((o) => o.kcalDelta)).toEqual([150])
  })
})

describe('weekly analysis – gain', () => {
  it('targets 0.25 (new) / 0.15 kg/wk', () => {
    expect(targetWeeklyChange(gainNew)).toBe(0.25)
    expect(targetWeeklyChange(gainMid)).toBe(0.15)
  })
  it('< 0.05 kg/wk → +150', () => {
    expect(ready(analyzeWeek(linearLogs(70, 0.02), gainNew)).options[0].kcalDelta).toBe(150)
  })
  it('> 2× target → −100', () => {
    expect(ready(analyzeWeek(linearLogs(70, 0.35), gainMid)).options[0].kcalDelta).toBe(-100)
    expect(ready(analyzeWeek(linearLogs(70, 0.6), gainNew)).options[0].kcalDelta).toBe(-100)
  })
  it('in range → keep', () => {
    expect(ready(analyzeWeek(linearLogs(70, 0.2), gainNew)).verdict).toBe('keep')
  })
})

describe('weekly analysis – maintain', () => {
  it('|rate| < 0.2 → keep', () => {
    expect(ready(analyzeWeek(linearLogs(75, 0.1), maintain)).verdict).toBe('keep')
    expect(ready(analyzeWeek(linearLogs(75, -0.15), maintain)).verdict).toBe('keep')
  })
  it('gaining → −100/−150', () => {
    expect(ready(analyzeWeek(linearLogs(75, 0.3), maintain)).options[0].kcalDelta).toBe(-100)
    expect(ready(analyzeWeek(linearLogs(75, 0.5), maintain)).options[0].kcalDelta).toBe(-150)
  })
  it('losing → +100/+150', () => {
    expect(ready(analyzeWeek(linearLogs(75, -0.3), maintain)).options[0].kcalDelta).toBe(100)
    expect(ready(analyzeWeek(linearLogs(75, -0.5), maintain)).options[0].kcalDelta).toBe(150)
  })
  it('recomp is treated like maintain', () => {
    expect(ready(analyzeWeek(linearLogs(75, 0.1), { ...maintain, goal: 'recomp' })).verdict).toBe('keep')
  })
})

describe('adjustment cooldown', () => {
  it('waits 7 days after an accepted adjustment', () => {
    expect(adjustmentCooldown(undefined, '2026-01-20')).toBe(0)
    expect(adjustmentCooldown('2026-01-15', '2026-01-15')).toBe(7)
    expect(adjustmentCooldown('2026-01-15', '2026-01-20')).toBe(2)
    expect(adjustmentCooldown('2026-01-15', '2026-01-22')).toBe(0)
  })
})
