import { describe, expect, it } from 'vitest'
import { checkInDue, dayReview, evaluateCheckIn, habitRate, navyBodyFat, waterGlassesTarget, waterRate, type CheckIn, type CoachContext } from '../coach'

const ctx: CoachContext = { sex: 'm', heightCm: 178, goal: 'lose', kcalTarget: 2100, proteinTarget: 160, daysLogged: 6, avg: { kcal: 2050, protein: 150, carb: 200, fat: 70 } }
const ci = (over: Partial<CheckIn> = {}): CheckIn => ({ id: 'c', date: '2026-10-09', hunger: 2, energy: 4, sleep: 4, adherence: 85, difficulties: [], ...over })

describe('Navy body fat', () => {
  it('male and female formulas give plausible values', () => {
    expect(navyBodyFat('m', 178, 38, 88)).toBeCloseTo(18.7, 0)
    expect(navyBodyFat('f', 165, 32, 75, 98)).toBeCloseTo(28.9, 0)
  })
  it('invalid inputs → null', () => {
    expect(navyBodyFat('m', 178, 40, 39)).toBeNull()
    expect(navyBodyFat('f', 165, 32, 75)).toBeNull()
    expect(navyBodyFat('m', 0, 38, 88)).toBeNull()
  })
})

describe('weekly check-in feedback', () => {
  it('celebrates wins: waist down, logging, protein, adherence', () => {
    const f = evaluateCheckIn(ci({ waistCm: 88, neckCm: 38 }), { ...ctx, weeklyRate: -0.4, targetRate: -0.4 }, ci({ waistCm: 90 }))
    expect(f.waistChange).toBe(-2)
    expect(f.wins.join(' ')).toMatch(/Bel ölçün 2 cm azaldı/)
    expect(f.wins.join(' ')).toMatch(/0,4 kg azaldı/)
    expect(f.wins.join(' ')).toMatch(/Protein hedefini/)
    expect(f.bodyFat).toBeCloseTo(18.7, 0)
    expect(f.focus).toHaveLength(0)
  })
  it('turns problems into at most 3 focus points + tips per difficulty', () => {
    const f = evaluateCheckIn(
      ci({ hunger: 5, sleep: 1, adherence: 30, difficulties: ['aksam-atistirma', 'tatli'] }),
      { ...ctx, daysLogged: 2, avg: { kcal: 2500, protein: 90, carb: 0, fat: 0 } },
    )
    expect(f.focus.length).toBeLessThanOrEqual(3)
    // self-reported hunger/sleep/adherence outrank log-based points
    expect(f.focus[0]).toMatch(/Açlık yüksek/)
    expect(f.focus.join(' ')).toMatch(/Uyku/)
    expect(f.tips.join(' ')).toMatch(/gece öğünü/)
    expect(f.tips.join(' ')).toMatch(/Tatlıyı yasaklama/)
    expect(f.tips.join(' ')).toMatch(/100–150 kcal/)
  })
  it('flags low protein and very low intake', () => {
    const f = evaluateCheckIn(ci(), { ...ctx, avg: { kcal: 1400, protein: 90, carb: 0, fat: 0 } })
    expect(f.focus.join(' ')).toMatch(/Protein ortalaman 90 g/)
    expect(f.focus.join(' ')).toMatch(/çok altında/)
  })
  it('check-in is due weekly', () => {
    expect(checkInDue(undefined, '2026-10-09')).toBe(0)
    expect(checkInDue('2026-10-05', '2026-10-09')).toBe(3)
    expect(checkInDue('2026-10-01', '2026-10-09')).toBe(0)
  })
})

describe('habits, water and day review', () => {
  const logs = [
    { date: '2026-10-08', water: 8, habits: ['protein', 'adim'] },
    { date: '2026-10-09', water: 4, habits: ['protein'] },
  ]
  it('habit and water rates', () => {
    expect(habitRate(logs, ['protein', 'adim'], ['2026-10-08', '2026-10-09'])).toBeCloseTo(0.75)
    expect(habitRate(logs, [], ['2026-10-08'])).toBeUndefined()
    expect(waterRate(logs, 8, ['2026-10-08', '2026-10-09'])).toBeCloseTo(0.75)
    expect(waterGlassesTarget(2800)).toBe(11)
    expect(waterGlassesTarget(1000)).toBe(6)
  })
  it('day review', () => {
    expect(dayReview({ kcal: 0, protein: 0, carb: 0, fat: 0 }, 2000, 150, 0, 8).lines[0]).toMatch(/henüz/)
    const good = dayReview({ kcal: 1950, protein: 150, carb: 0, fat: 0 }, 2000, 150, 8, 8)
    expect(good.tone).toBe('good')
    const over = dayReview({ kcal: 2600, protein: 80, carb: 0, fat: 0 }, 2000, 150, 2, 8)
    expect(over.tone).toBe('warn')
    expect(over.lines.join(' ')).toMatch(/600 kcal aştın/)
  })
})

describe('stats helpers', () => {
  it('lastDays and intakeStats', async () => {
    const { lastDays, intakeStats } = await import('../coach')
    expect(lastDays('2026-10-09', 3)).toEqual(['2026-10-07', '2026-10-08', '2026-10-09'])
    const s = intakeStats({ '2026-10-08': { kcal: 2000, protein: 100, carb: 0, fat: 0 }, '2026-10-09': { kcal: 1000, protein: 50, carb: 0, fat: 0 } }, lastDays('2026-10-09', 7))
    expect(s.daysLogged).toBe(2)
    expect(s.avg!.kcal).toBe(1500)
    expect(intakeStats({}, ['2026-10-09']).daysLogged).toBe(0)
  })
})
