import type { Food, FoodTag, Slot } from './foods'
import type { AnimalFoods, DietId } from './types'

const ANIMAL_EXCLUDES: Record<AnimalFoods, FoodTag[]> = {
  all: [],
  pescatarian: ['redmeat', 'chicken'],
  vegetarian: ['redmeat', 'chicken', 'fish'],
  vegan: ['redmeat', 'chicken', 'fish', 'egg', 'dairy'],
}

export function fitsAnimal(food: Food, a: AnimalFoods): boolean {
  return !food.tags.some((t) => ANIMAL_EXCLUDES[a].includes(t))
}

export function fitsDislikes(food: Food, dislikes: FoodTag[]): boolean {
  return !food.tags.some((t) => dislikes.includes(t))
}

/** Per-portion carb ceilings that keep the day within the diet's carb budget. */
export function carbLimit(diet: DietId, slot: Slot): number | null {
  if (diet === 'keto') return slot === 'snack' ? 6 : 10
  if (diet === 'lowcarb') return slot === 'snack' ? 15 : slot === 'breakfast' ? 30 : 40
  return null
}

/** Hard diet rules (as opposed to soft preferences used in scoring). */
export function fitsDiet(food: Food, diet: DietId, slot: Slot, factor = 1): boolean {
  const lim = carbLimit(diet, slot)
  if (lim !== null && food.carb * factor > lim) return false
  if (diet === 'dash' && food.salty) return false
  if (diet === 'plant' && food.tags.some((t) => t === 'redmeat' || t === 'chicken' || t === 'fish')) return false
  return true
}

/** Human-readable reasons a food conflicts with the user's rules (empty = fine). */
export function conflicts(
  food: Food, factor: number, ctx: { diet: DietId; animalFoods: AnimalFoods; dislikes: FoodTag[] },
): string[] {
  const out: string[] = []
  if (!fitsAnimal(food, ctx.animalFoods)) out.push('beslenme tercihinize (hayvansal gıda) uymuyor')
  if (food.unknownTags && ctx.animalFoods !== 'all') out.push('hayvansal içerik bilinmiyor; etiketteki içindekiler listesini kontrol edin')
  if (food.kcalOnly && (ctx.diet === 'keto' || ctx.diet === 'lowcarb')) out.push('karbonhidrat değeri yayımlanmamış; planınıza uygunluğu kontrol edilemedi')
  if (ctx.diet === 'keto' && food.carb * factor > 10) out.push(`ketojenik plan için karbonhidratı yüksek (${Math.round(food.carb * factor)} g)`)
  if (ctx.diet === 'lowcarb' && food.carb * factor > 40) out.push(`düşük karbonhidrat planı için karbonhidratı yüksek (${Math.round(food.carb * factor)} g)`)
  if (ctx.diet === 'dash' && food.salty) out.push('tuzu yüksek; DASH planında sınırlı tutulmalı')
  if (ctx.diet === 'plant' && food.tags.some((t) => t === 'redmeat' || t === 'chicken' || t === 'fish')) out.push('bitki temelli planınızda et/balık yok')
  return out
}
