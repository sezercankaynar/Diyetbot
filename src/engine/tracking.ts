import { round2 } from './energy'
import type { Experience, Goal, WeeklyRate, WeighIn } from './types'

const DAY_MS = 86_400_000

export function dayIndex(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS)
}

export function sortLogs(logs: WeighIn[]): WeighIn[] {
  return [...logs].sort((a, b) => a.date.localeCompare(b.date))
}

const mean = (xs: number[]): number => xs.reduce((s, x) => s + x, 0) / xs.length

/** 7-day trailing average for every logged date (window = that date and the 6 days before). */
export function rollingAverage(logs: WeighIn[], window = 7): { date: string; avg: number }[] {
  const sorted = sortLogs(logs)
  return sorted.map((entry) => {
    const end = dayIndex(entry.date)
    const inWindow = sorted.filter((l) => {
      const d = dayIndex(l.date)
      return d <= end && d > end - window
    })
    return { date: entry.date, avg: round2(mean(inWindow.map((l) => l.kg))) }
  })
}

export const MIN_DAYS = 14

export interface AdjustmentOption {
  kcalDelta: number
  stepsDelta: number
  label: string
}

export type WeeklyAnalysis =
  | { status: 'insufficient'; daysLogged: number; daysRemaining: number }
  | {
      status: 'ready'
      lastWeekAvg: number
      prevWeekAvg: number
      /** kg/week, negative = losing. */
      weeklyRate: number
      targetRate: number
      verdict: 'keep' | 'adjust'
      message: string
      options: AdjustmentOption[]
    }

export interface AnalysisInput {
  goal: Goal
  weeklyRatePct: WeeklyRate
  experience: Experience
  weightKg: number
}

/** Target weekly change in kg (negative = loss). */
export function targetWeeklyChange(i: AnalysisInput): number {
  switch (i.goal) {
    case 'lose':
      return round2(-i.weightKg * (i.weeklyRatePct / 100))
    case 'gain':
      return i.experience === 'new' ? 0.25 : 0.15
    default:
      return 0
  }
}

export function analyzeWeek(logs: WeighIn[], input: AnalysisInput): WeeklyAnalysis {
  const sorted = sortLogs(logs)
  if (sorted.length === 0) return { status: 'insufficient', daysLogged: 0, daysRemaining: MIN_DAYS }

  const last = dayIndex(sorted[sorted.length - 1].date)
  const first = dayIndex(sorted[0].date)
  const span = last - first + 1
  const lastWeek = sorted.filter((l) => dayIndex(l.date) > last - 7).map((l) => l.kg)
  const prevWeek = sorted
    .filter((l) => {
      const d = dayIndex(l.date)
      return d <= last - 7 && d > last - 14
    })
    .map((l) => l.kg)

  if (span < MIN_DAYS || lastWeek.length === 0 || prevWeek.length === 0) {
    return { status: 'insufficient', daysLogged: span, daysRemaining: Math.max(1, MIN_DAYS - span) }
  }

  const lastAvg = mean(lastWeek)
  const prevAvg = mean(prevWeek)
  const rate = round2(lastAvg - prevAvg)
  const target = targetWeeklyChange(input)
  const keep = (message: string): WeeklyAnalysis => ({
    status: 'ready', lastWeekAvg: round2(lastAvg), prevWeekAvg: round2(prevAvg),
    weeklyRate: rate, targetRate: target, verdict: 'keep', message, options: [],
  })
  const adjust = (message: string, options: AdjustmentOption[]): WeeklyAnalysis => ({
    status: 'ready', lastWeekAvg: round2(lastAvg), prevWeekAvg: round2(prevAvg),
    weeklyRate: rate, targetRate: target, verdict: 'adjust', message, options,
  })

  if (input.goal === 'lose') {
    const loss = -rate
    const goalLoss = -target
    if (loss < 0.5 * goalLoss) {
      return adjust('Kilo kaybı hedefin yarısından yavaş.', [
        { kcalDelta: -150, stepsDelta: 0, label: 'Günlük kaloriyi 150 kcal azalt' },
        { kcalDelta: 0, stepsDelta: 2000, label: 'Günlük adımı 2.000 artır' },
      ])
    }
    if (loss > 1.5 * goalLoss) {
      return adjust('Kilo kaybı hedefin 1,5 katından hızlı; kas kaybını önlemek için biraz yavaşlatın.', [
        { kcalDelta: 150, stepsDelta: 0, label: 'Günlük kaloriyi 150 kcal artır' },
      ])
    }
    return keep('Hedef aralıktasınız, plana devam.')
  }

  if (input.goal === 'gain') {
    if (rate < 0.05) {
      return adjust('Kilo artışı çok yavaş.', [
        { kcalDelta: 150, stepsDelta: 0, label: 'Günlük kaloriyi 150 kcal artır' },
      ])
    }
    if (rate > 2 * target) {
      return adjust('Kilo artışı hedefin 2 katından hızlı; fazlası yağ olarak depolanır.', [
        { kcalDelta: -100, stepsDelta: 0, label: 'Günlük kaloriyi 100 kcal azalt' },
      ])
    }
    return keep('Hedef aralıktasınız, plana devam.')
  }

  // maintain and recomp: weight should stay roughly stable.
  if (Math.abs(rate) < 0.2) return keep('Kilonuz stabil, plana devam.')
  const size = Math.abs(rate) >= 0.4 ? 150 : 100
  return rate > 0
    ? adjust('Kilo artıyor.', [{ kcalDelta: -size, stepsDelta: 0, label: `Günlük kaloriyi ${size} kcal azalt` }])
    : adjust('Kilo azalıyor.', [{ kcalDelta: size, stepsDelta: 0, label: `Günlük kaloriyi ${size} kcal artır` }])
}

export const ADJUSTMENT_COOLDOWN_DAYS = 7

/**
 * After accepting an adjustment, wait a week of new data before suggesting another,
 * otherwise the same two-week window would keep triggering the same advice.
 * Returns the number of days left (0 = may adjust now).
 */
export function adjustmentCooldown(lastAdjustmentDate: string | undefined, todayDate: string): number {
  if (!lastAdjustmentDate) return 0
  const elapsed = dayIndex(todayDate) - dayIndex(lastAdjustmentDate)
  return Math.max(0, ADJUSTMENT_COOLDOWN_DAYS - elapsed)
}
