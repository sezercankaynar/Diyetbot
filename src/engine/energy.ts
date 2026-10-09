import type { Energy, Experience, Profile, TrainingDays } from './types'

export const round5 = (x: number): number => Math.round(x / 5) * 5
export const round1 = (x: number): number => Math.round(x * 10) / 10
export const round2 = (x: number): number => Math.round(x * 100) / 100

/** Mifflin-St Jeor. */
export function bmr(p: Pick<Profile, 'sex' | 'weightKg' | 'heightCm' | 'age'>): number {
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'm' ? 5 : -161)
}

export const TRAINING_FACTOR: Record<TrainingDays, number> = {
  2: 1.03,
  3: 1.05,
  4: 1.07,
  5: 1.09,
  6: 1.11,
}

export const GAIN_SURPLUS: Record<Experience, number> = { new: 350, mid: 250, adv: 150 }

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100
  return weightKg / (m * m)
}

export function waistToHeight(waistCm: number, heightCm: number): number {
  return waistCm / heightCm
}

export function tdee(p: Profile): number {
  return bmr(p) * p.activity * TRAINING_FACTOR[p.trainingDays]
}

/** Daily deficit for a weekly loss rate (% bodyweight), uncapped. */
export function rawDeficit(weightKg: number, ratePct: number): number {
  return (weightKg * (ratePct / 100) * 7700) / 7
}

export function calorieFloor(sex: Profile['sex'], bmrValue: number): number {
  return Math.max(sex === 'm' ? 1500 : 1200, bmrValue * 0.95)
}

export function computeEnergy(p: Profile): Energy {
  const b = bmr(p)
  const tf = TRAINING_FACTOR[p.trainingDays]
  const t = b * p.activity * tf

  let target: number
  let deficitCapped = false
  switch (p.goal) {
    case 'lose': {
      const raw = rawDeficit(p.weightKg, p.weeklyRate)
      const cap = 0.25 * t
      deficitCapped = raw > cap
      target = t - Math.min(raw, cap)
      break
    }
    case 'recomp':
      target = t * 0.9
      break
    case 'maintain':
      target = t
      break
    case 'gain':
      target = t + GAIN_SURPLUS[p.experience]
      break
  }

  const floor = calorieFloor(p.sex, b)
  const clamped = target < floor
  const final = clamped ? floor : target
  const bmiV = bmi(p.weightKg, p.heightCm)
  const whtr = waistToHeight(p.waistCm, p.heightCm)

  return {
    bmr: Math.round(b),
    trainingFactor: tf,
    tdee: Math.round(t),
    target: round5(final),
    unclampedTarget: round5(target),
    floor: round5(floor),
    clamped,
    deficitCapped,
    bmi: round1(bmiV),
    whtr: round2(whtr),
    whtrFlag: whtr >= 0.5,
  }
}
