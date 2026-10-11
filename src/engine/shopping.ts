// Shopping list: the menu's dishes broken down into raw ingredients for the market.
import { getFood } from './foods'
import { ingredientById, type IngredientCategory } from './ingredients'
import { partsOf, type MenuDay } from './menu'

export interface ShoppingItem {
  id: string
  name: string
  /** Market amount, e.g. "1,2 kg", "6 adet", "1 L". */
  amount: string
  grams: number
}
export interface ShoppingGroup {
  category: string
  items: ShoppingItem[]
}
export interface ShoppingList {
  groups: ShoppingGroup[]
  /** Ready-made items without a recipe (chain items, packaged products), with how many portions. */
  ready: { id: string; name: string; count: number }[]
}

const CATEGORY_TR: Record<IngredientCategory, string> = {
  et: 'Et', 'tavuk-balik': 'Tavuk ve balık', 'sut-yumurta': 'Süt ürünleri ve yumurta', baklagil: 'Kuru baklagil',
  tahil: 'Ekmek ve tahıl', sebze: 'Sebze', meyve: 'Meyve', 'yag-kuruyemis': 'Yağ ve kuruyemiş', diger: 'Diğer',
}
const ORDER: IngredientCategory[] = ['sebze', 'meyve', 'et', 'tavuk-balik', 'sut-yumurta', 'baklagil', 'tahil', 'yag-kuruyemis', 'diger']

/** Cooked ingredients → what to buy (dry/raw), by energy (cooking adds only water). */
const RAW_OF: Record<string, string> = {
  'bulgur-haslanmis': 'bulgur', 'pirinc-haslanmis': 'pirinc', 'makarna-haslanmis': 'makarna', 'kuru-fasulye-haslanmis': 'kuru-fasulye',
  'nohut-haslanmis': 'nohut', 'mercimek-haslanmis': 'yesil-mercimek', 'barbunya-haslanmis': 'barbunya', 'patates-haslanmis': 'patates',
}
const LIQUIDS = new Set(['sut-tam', 'sut-yarim', 'ayran', 'kefir'])
const EACH: Record<string, [grams: number, unit: string]> = { yumurta: [50, 'adet'], limon: [100, 'adet'], 'ekmek-tam-bugday': [25, 'dilim'] }

const num = (x: number) => String(Math.round(x * 10) / 10).replace('.', ',')

function marketAmount(id: string, g: number): string {
  const each = EACH[id]
  if (each) return `${Math.max(1, Math.ceil(g / each[0] - 0.15))} ${each[1]}`
  if (LIQUIDS.has(id)) return g >= 1000 ? `${num(g / 1000)} L` : `${Math.ceil(g / 50) * 50} ml`
  if (id === 'zeytinyagi' || id === 'aycicek-yagi' || id === 'tereyagi') return g < 150 ? `${Math.max(1, Math.round(g / 10))} yemek kaşığı` : `${Math.round(g / 10) * 10} g`
  if (g >= 1000) return `${num(g / 1000)} kg`
  if (g < 20) return `${Math.max(1, Math.round(g))} g`
  return `${Math.round(g / 10) * 10} g`
}

/** Ingredients for the given days (e.g. from today to the end of the week). */
export function shoppingList(days: MenuDay[]): ShoppingList {
  const grams = new Map<string, number>()
  const ready = new Map<string, number>()
  for (const d of days) {
    for (const item of d.items) {
      for (const x of partsOf(item)) {
        const f = getFood(x.foodId)
        if (!f) continue
        if (!f.recipe) {
          ready.set(f.id, (ready.get(f.id) ?? 0) + x.factor)
          continue
        }
        for (const l of f.recipe.lines) {
          let id = l.ingredientId
          let g = (l.grams * x.factor) / f.recipe.servings
          const raw = RAW_OF[id]
          if (raw && ingredientById(raw) && ingredientById(id)) {
            g = (g * ingredientById(id)!.kcal) / ingredientById(raw)!.kcal
            id = raw
          }
          grams.set(id, (grams.get(id) ?? 0) + g)
        }
      }
    }
  }
  const byCat = new Map<IngredientCategory, ShoppingItem[]>()
  for (const [id, g] of grams) {
    const ing = ingredientById(id)
    if (!ing || g < 1) continue
    const list = byCat.get(ing.category) ?? []
    list.push({ id, name: ing.name, amount: marketAmount(id, g), grams: Math.round(g) })
    byCat.set(ing.category, list)
  }
  const groups = ORDER.filter((c) => byCat.has(c)).map((c) => ({
    category: CATEGORY_TR[c],
    items: byCat.get(c)!.sort((a, b) => a.name.localeCompare(b.name, 'tr')),
  }))
  return {
    groups,
    ready: [...ready].map(([id, count]) => ({ id, name: getFood(id)?.name ?? id, count })).sort((a, b) => a.name.localeCompare(b.name, 'tr')),
  }
}

/** Plain text (for sharing to WhatsApp, notes …), without what's already at home (`have`). */
export function shoppingText(list: ShoppingList, title: string, have: ReadonlySet<string> = new Set()): string {
  const lines = [title, '']
  for (const g of list.groups) {
    const items = g.items.filter((i) => !have.has(i.id))
    if (!items.length) continue
    lines.push(`${g.category}:`)
    for (const i of items) lines.push(`- ${i.name}: ${i.amount}`)
    lines.push('')
  }
  const ready = list.ready.filter((r) => !have.has(r.id))
  if (ready.length) {
    lines.push('Hazır:')
    for (const r of ready) lines.push(`- ${r.name} × ${num(r.count)}`)
  }
  return lines.length > 2 ? lines.join('\n').trim() : `${title}\n\nHer şey evde var 👍`
}
