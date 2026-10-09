import { bmi } from './energy'
import type { AnimalFoods, DietId, Goal, Macros, Profile } from './types'

/** Weight used for protein/fat: actual weight, or weight at BMI 25 when BMI > 30. */
export function referenceWeight(weightKg: number, heightCm: number): number {
  if (bmi(weightKg, heightCm) > 30) {
    const m = heightCm / 100
    return 25 * m * m
  }
  return weightKg
}

const PROTEIN_PER_KG: Record<Goal, number> = {
  lose: 2.0,
  recomp: 2.0,
  gain: 1.8,
  maintain: 1.6,
}

export const isPlantEater = (a: AnimalFoods): boolean => a === 'vegetarian' || a === 'vegan'

export function proteinPerKg(goal: Goal, plant: boolean): number {
  const v = PROTEIN_PER_KG[goal]
  return plant ? Math.max(1.6, v - 0.2) : v
}

export const FAT_MIN_PER_KG = 0.8

const FAT_PCT: Partial<Record<DietId, number>> = { med: 0.32, dash: 0.27 }
const DEFAULT_FAT_PCT = 0.28
export const KETO_CARBS_G = 30
export const LOWCARB_MAX_CARBS_G = 130

export function computeMacros(
  p: Pick<Profile, 'weightKg' | 'heightCm' | 'goal' | 'animalFoods'>,
  kcal: number,
  diet: DietId,
): Macros {
  const ref = referenceWeight(p.weightKg, p.heightCm)
  const plant = diet === 'plant' || isPlantEater(p.animalFoods)
  const protein = proteinPerKg(p.goal, plant) * ref
  const fatMin = FAT_MIN_PER_KG * ref
  const afterProtein = kcal - protein * 4

  let fat: number
  let carbs: number
  if (diet === 'keto') {
    carbs = KETO_CARBS_G
    fat = Math.max(fatMin, (afterProtein - carbs * 4) / 9)
  } else if (diet === 'lowcarb') {
    carbs = Math.max(0, Math.min(LOWCARB_MAX_CARBS_G, (afterProtein - fatMin * 9) / 4))
    fat = Math.max(fatMin, (afterProtein - carbs * 4) / 9)
  } else {
    const pct = FAT_PCT[diet] ?? DEFAULT_FAT_PCT
    fat = Math.max(fatMin, (kcal * pct) / 9)
    carbs = Math.max(0, (afterProtein - fat * 9) / 4)
  }

  return {
    kcal,
    proteinG: Math.round(protein),
    fatG: Math.round(fat),
    carbG: Math.round(carbs),
    fiberG: Math.round((14 * kcal) / 1000),
    waterMl: Math.round(35 * p.weightKg),
    refWeightKg: Math.round(ref * 10) / 10,
  }
}
