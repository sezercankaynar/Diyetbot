import type { Profile } from './types'

export function defaultProfile(): Profile {
  return {
    sex: 'm',
    age: 30,
    heightCm: 178,
    weightKg: 80,
    waistCm: 88,
    sleepHours: 7,
    activity: 1.375,
    goal: 'lose',
    weeklyRate: 0.5,
    trainingDays: 3,
    experience: 'new',
    equipment: 'gym',
    animalFoods: 'all',
    carbAttachment: 'mid',
    canSkipBreakfast: false,
    mealsPerDay: 3,
    cookingTime: 'mid',
    eatingOut: 'some',
    tracksCalories: true,
    hungerTime: 'stable',
    dislikes: [],
    mealStyle: { breakfast: 'normal', lunch: 'normal', dinner: 'normal' },
    mealTimes: { breakfast: '08:00', lunch: '13:00', snack: '16:30', nightSnack: '21:30', dinner: '19:30' },
    health: {
      hypertension: false,
      insulinResistance: false,
      highLdl: false,
      diabetesMeds: false,
      kidneyLiver: false,
      pregnant: false,
      eatingDisorder: false,
    },
  }
}
