// The user's own home-cooked dishes: built from ingredients (grams) or typed-in values.
import { ingredientById } from './ingredients'
import type { Food, FoodTag, Slot } from './foods'

export interface RecipeLine {
  ingredientId: string
  grams: number
}

export interface HomeRecipeInput {
  name: string
  lines: RecipeLine[]
  /** How many portions the whole pot makes. */
  servings: number
  /** Let the weekly menu suggest it at these meals. */
  slots: Slot[]
  kind: 'light' | 'hearty'
  /** Don't suggest it in generated menus. */
  noMenu?: boolean
}

const r1 = (x: number) => Math.round(x * 10) / 10

export interface RecipeTotals {
  kcal: number
  protein: number
  carb: number
  fat: number
  grams: number
  tags: FoodTag[]
}

/** Whole-pot totals from ingredient grams (unknown ingredients are skipped). */
export function recipeTotals(lines: RecipeLine[]): RecipeTotals {
  const tags = new Set<FoodTag>()
  const t = { kcal: 0, protein: 0, carb: 0, fat: 0, grams: 0 }
  for (const l of lines) {
    const ing = ingredientById(l.ingredientId)
    if (!ing || !(l.grams > 0)) continue
    const k = l.grams / 100
    t.kcal += ing.kcal * k
    t.protein += ing.protein * k
    t.carb += ing.carb * k
    t.fat += ing.fat * k
    t.grams += l.grams
    ing.tags.forEach((x) => tags.add(x))
  }
  return { kcal: Math.round(t.kcal), protein: r1(t.protein), carb: r1(t.carb), fat: r1(t.fat), grams: Math.round(t.grams), tags: [...tags] }
}

export function validateRecipe(r: HomeRecipeInput): string[] {
  const errs: string[] = []
  if (!r.name.trim()) errs.push('Yemeğin adını yaz')
  if (!r.lines.some((l) => l.grams > 0 && ingredientById(l.ingredientId))) errs.push('En az bir malzeme ekle')
  if (!(r.servings >= 1 && r.servings <= 30)) errs.push('Porsiyon sayısı 1–30 arasında olmalı')
  return errs
}

function slug(s: string): string {
  return s.toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30)
}

/** One portion of the recipe as a Food (saved with the user's products). */
export function foodFromRecipe(r: HomeRecipeInput, uid: string): Food {
  const t = recipeTotals(r.lines)
  const n = r.servings
  return {
    id: `ev-${slug(r.name)}-${uid}`,
    name: r.name.trim(),
    portion: `1 porsiyon (≈${Math.round(t.grams / n)} g, tarifin 1/${n}'i)`,
    slots: r.slots,
    group: 'ev',
    prep: 2,
    tags: t.tags,
    kcal: Math.round(t.kcal / n),
    protein: r1(t.protein / n),
    carb: r1(t.carb / n),
    fat: r1(t.fat / n),
    kind: r.kind,
    source: 'Kendi tarifim',
    recipe: { lines: r.lines.filter((l) => l.grams > 0).map((l) => ({ ...l })), servings: n },
    ...(r.noMenu ? { noMenu: true } : {}),
  }
}

/** Quick entry when the user already knows the values of one portion. */
export function foodFromValues(
  v: { name: string; kcal: number; protein: number; carb: number; fat: number; slots: Slot[]; kind: 'light' | 'hearty'; noMenu?: boolean },
  uid: string,
): Food {
  return {
    id: `ev-${slug(v.name)}-${uid}`,
    name: v.name.trim(),
    portion: '1 porsiyon',
    slots: v.slots,
    group: 'ev',
    prep: 2,
    tags: [],
    unknownTags: true,
    kcal: Math.round(v.kcal),
    protein: r1(v.protein),
    carb: r1(v.carb),
    fat: r1(v.fat),
    kind: v.kind,
    source: 'Kendi değerlerim',
    ...(v.noMenu ? { noMenu: true } : {}),
  }
}
