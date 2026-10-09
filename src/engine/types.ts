// Pure domain types. No UI or browser dependencies.

export type Sex = 'm' | 'f'
export type ActivityMultiplier = 1.2 | 1.375 | 1.55 | 1.725
export type Goal = 'lose' | 'recomp' | 'maintain' | 'gain'
/** Weekly rate as % of bodyweight. */
export type WeeklyRate = 0.25 | 0.5 | 0.75
export type TrainingDays = 2 | 3 | 4 | 5 | 6
export type Experience = 'new' | 'mid' | 'adv'
export type Equipment = 'gym' | 'home'
export type AnimalFoods = 'all' | 'pescatarian' | 'vegetarian' | 'vegan'
export type Level3 = 'high' | 'mid' | 'low'
export type MealsPerDay = 2 | 3 | 4
export type EatingOut = 'rare' | 'some' | 'often'
export type HungerTime = 'evening' | 'allday' | 'stable'

export interface HealthFlags {
  hypertension: boolean
  insulinResistance: boolean
  highLdl: boolean
  diabetesMeds: boolean
  kidneyLiver: boolean
  pregnant: boolean
  eatingDisorder: boolean
}

export interface Profile {
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
  waistCm: number
  sleepHours: number
  activity: ActivityMultiplier
  goal: Goal
  weeklyRate: WeeklyRate
  trainingDays: TrainingDays
  experience: Experience
  equipment: Equipment
  animalFoods: AnimalFoods
  carbAttachment: Level3
  canSkipBreakfast: boolean
  mealsPerDay: MealsPerDay
  cookingTime: Level3
  eatingOut: EatingOut
  tracksCalories: boolean
  hungerTime: HungerTime
  health: HealthFlags
}

export type DietId = 'med' | 'hp' | 'dash' | 'lowcarb' | 'plant' | 'keto'

export interface DietScore {
  id: DietId
  name: string
  score: number
  reasons: string[]
  /** Excluded for safety (e.g. keto with diabetes meds). */
  excluded: boolean
}

export interface IfScore {
  score: number
  disabled: boolean
  recommended: boolean
  reasons: string[]
  note: string
}

export interface Energy {
  bmr: number
  trainingFactor: number
  tdee: number
  target: number
  /** Raw target before the floor was applied. */
  unclampedTarget: number
  floor: number
  clamped: boolean
  deficitCapped: boolean
  bmi: number
  whtr: number
  whtrFlag: boolean
}

export interface Macros {
  kcal: number
  proteinG: number
  fatG: number
  carbG: number
  fiberG: number
  waterMl: number
  refWeightKg: number
}

export type CalloutLevel = 'stop' | 'warn' | 'info'
export interface Callout {
  level: CalloutLevel
  code: string
  title: string
  text: string
}

export interface SafetyResult {
  stop: boolean
  stops: Callout[]
  warnings: Callout[]
  /** Diets not allowed for this profile. */
  excludedDiets: DietId[]
  ifAllowed: boolean
}

export interface MealGuide {
  meals: number
  proteinPerMealG: number
  proteinSources: string[]
  plateRules: string[]
  hungerTips: string[]
}

export interface Exercise {
  name: string
  sets: string
  reps: string
}
export interface TrainingDay {
  name: string
  exercises: Exercise[]
}
export interface TrainingPlan {
  split: string
  days: TrainingDay[]
  progression: string[]
  cardio: string
  steps: string
  sleep: string
}

export interface Plan {
  safety: SafetyResult
  /** Absent when a safety stop applies. */
  energy?: Energy
  macros?: Macros
  diets?: DietScore[]
  recommendedDiet?: DietScore
  intermittentFasting?: IfScore
  meals?: MealGuide
  training?: TrainingPlan
  notes: Callout[]
}

export interface WeighIn {
  date: string // YYYY-MM-DD
  kg: number
}

export interface Adjustment {
  id: string
  date: string
  kcalDelta: number
  stepsDelta: number
  fromKcal: number
  toKcal: number
  reason: string
}
