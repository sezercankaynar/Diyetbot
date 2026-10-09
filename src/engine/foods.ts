// Lookup across built-in dishes, chain menus and saved packaged products.
// (The data lives in foodList.ts / chains.ts so chains can build on built-in foods.)
import { FOODS, type Food, type FoodTag, type Slot } from './foodList'
import { CHAIN_FOODS } from './chains'

export * from './foodList'

export const FOOD_BY_ID: Record<string, Food> = Object.fromEntries([...FOODS, ...CHAIN_FOODS].map((x) => [x.id, x]))

// The user's saved packaged products. Set at start-up and when one is saved.
let extra: Food[] = []
let extraById: Record<string, Food> = {}

export function setExtraFoods(list: Food[]): void {
  extra = list
  extraById = Object.fromEntries(list.map((x) => [x.id, x]))
}

/** Built-in + chain + saved foods (minus deleted ones) – what search and "can I eat this?" see. */
export function allFoods(): Food[] {
  return [...FOODS, ...CHAIN_FOODS, ...extra.filter((x) => !x.hidden)]
}

export function getFood(id: string): Food | undefined {
  return FOOD_BY_ID[id] ?? extraById[id]
}

export const SLOT_LABEL: Record<Slot, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle',
  dinner: 'Akşam',
  snack: 'Ara öğün',
  night: 'Gece ara öğün',
}

export const TAG_LABEL: Record<FoodTag, string> = {
  redmeat: 'Kırmızı et',
  chicken: 'Tavuk',
  fish: 'Balık',
  egg: 'Yumurta',
  dairy: 'Süt ürünleri',
  legume: 'Baklagil / soya',
  gluten: 'Buğday / gluten',
  nuts: 'Kuruyemiş',
  eggplant: 'Patlıcan',
}
