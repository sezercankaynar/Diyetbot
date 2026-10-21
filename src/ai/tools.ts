// The app's functions Claude may call. Everything numeric (kcal, macros, verdicts, plates) is computed
// here by the engine; Claude only picks, matches and explains.
import {
  amountText, amountWays, evaluateMeal, foldTr, foodFromRecipe, foodFromValues, getFood, ingredientById, INGREDIENTS, itemTotals,
  mealTotals, partsOf, plateName, searchFoods, searchIngredients, suggestForRest, sumTotals,
  type CheckContext, type Food, type MenuContext, type MenuItem, type Slot, type Totals,
} from '@/engine'
import type { AiTool } from './agent'

/** A food as Claude sees it: values per standard portion and how to express other amounts. */
export function foodInfo(id: string) {
  const f = getFood(id)
  if (!f) return null
  const w = amountWays(id)
  return {
    food_id: f.id,
    name: f.brand ? `${f.brand} – ${f.name}` : f.name,
    portion: f.portion,
    kcal: f.kcal, protein: f.protein, carb: f.carb, fat: f.fat,
    ...(w.grams ? { grams_per_portion: w.grams } : {}),
    ...(w.count ? { count_unit: w.count.unit, factor_per_one: Math.round(w.count.perOne * 1000) / 1000 } : {}),
  }
}

export const searchFoodsTool: AiTool = {
  name: 'search_foods',
  description:
    'Searches the app\'s Turkish food catalogue (dishes, breakfast items, snacks, chain restaurant items, the user\'s own dishes). ' +
    'Query in Turkish, 1–3 words (e.g. "karışık tost", "mercimek çorbası", "ayran"). Returns up to 8 foods with values per standard portion. ' +
    'Only food_ids returned here may be used.',
  input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
  run: (i) => {
    const list = searchFoods(String(i.query ?? ''), 8).map((f) => foodInfo(f.id))
    return list.length ? list : { none: true, hint: 'Nothing found; try a shorter or more general Turkish word.' }
  },
}

export interface DayContext {
  menuCtx: MenuContext | null
  check: CheckContext | null
  date: string
  eaten: Totals
  openSlots: Slot[]
  avoid: string[]
  labels: Record<string, string>
  /** Today's menu plates (for meals not eaten and not in a proposal, the day counts these). */
  planned?: MenuItem[]
}

export function coachTools(d: DayContext): AiTool[] {
  return [
    searchFoodsTool,
    {
      name: 'check_foods',
      description:
        'Evaluates eating the given foods now against what is left of today\'s budget: verdict (ok / caution / smaller / over), totals, ' +
        'kcal left after, diet-rule warnings, tips and lighter alternatives. factor = multiple of the food\'s standard portion.',
      input_schema: {
        type: 'object',
        properties: { items: { type: 'array', items: { type: 'object', properties: { food_id: { type: 'string' }, factor: { type: 'number' } }, required: ['food_id', 'factor'] } } },
        required: ['items'],
      },
      run: (i) => {
        if (!d.check) return { error: 'No plan (safety stop): do not give calorie advice.' }
        const items = ((i.items as { food_id: string; factor: number }[]) ?? []).filter((x) => getFood(x.food_id))
        const r = evaluateMeal(items.map((x) => ({ foodId: x.food_id, factor: x.factor || 1 })), d.check)
        return {
          verdict: r.verdict, summary: r.title, totals: r.totals, kcal_left_before: r.remainingBefore, kcal_left_after: r.remainingAfter,
          warnings: r.reasons, tips: r.tips, ...(r.suggestedFactor ? { fitting_factor: r.suggestedFactor } : {}),
          alternatives: r.alternatives.map((a) => ({ name: getFood(a.foodId)?.name, factor: a.factor, kcal: a.kcal, protein: a.protein })),
        }
      },
    },
    {
      name: 'rest_of_day_plates',
      description:
        'Plates for the meals not eaten yet today, sized to what is really left of the day (kcal and macros) after what was logged. ' +
        'Built by the app\'s menu engine from Turkish home dishes; use these instead of inventing meals with numbers.',
      input_schema: { type: 'object', properties: {} },
      run: () => {
        if (!d.menuCtx) return { error: 'No plan.' }
        const rest = suggestForRest(d.menuCtx, d.date, d.eaten, d.openSlots, d.avoid)
        if (!rest.length) return { note: 'Nothing meaningful is left of today\'s budget (or all meals are eaten).' }
        return rest.map((r) => ({
          meal: d.labels[r.slot] ?? r.slot,
          budget: r.budget,
          options: r.options.map((o) => ({
            title: o.title, ...mealTotals(o),
            items: partsOf(o).map((x) => ({ food_id: x.foodId, factor: x.factor })),
            parts: partsOf(o).map((x) => `${amountText(x.foodId, x.factor)} ${plateName(getFood(x.foodId)?.name ?? '')}`),
          })),
        }))
      },
    },
  ]
}

/** kcal etc. of a food at a factor (for showing what Claude proposed). */
export const totalsOf = (id: string, factor: number) => itemTotals(id, factor)

// ---------------------------------------------------------------------------------------------
// Making new foods (not in the catalogue) and proposing a menu

export const searchIngredientsTool: AiTool = {
  name: 'search_ingredients',
  description:
    'Searches the raw ingredient table (per 100 g values from USDA/TürKomp) to build a new dish with create_food. ' +
    'Query in Turkish, one ingredient (e.g. "patlıcan", "dana kıyma", "zeytinyağı", "yoğurt"). Returns ingredient_ids and household units.',
  input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
  run: (i) => {
    const list = searchIngredients(String(i.query ?? ''), INGREDIENTS, 8).map((x) => ({
      ingredient_id: x.id, name: x.name, per_100g: { kcal: x.kcal, protein: x.protein, carb: x.carb, fat: x.fat }, ...(x.units?.length ? { units: x.units } : {}),
    }))
    return list.length ? list : { none: true, hint: 'Try a more basic Turkish word (e.g. "un", "şeker", "süt").' }
  },
}

const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack', 'night'] as const

/**
 * Creates a food that isn't in the catalogue and saves it with the user's own foods. Values come from
 * ingredient grams (preferred) or, for packaged products/drinks only, label values (marked as an estimate).
 */
export function createFoodTool(save: (f: Food) => Promise<void>, created: string[]): AiTool {
  return {
    name: 'create_food',
    description:
      'Creates a food or drink that is NOT in the catalogue (always search_foods first) and saves it. Prefer "ingredients": a normal Turkish home recipe ' +
      'with ingredient_ids from search_ingredients and raw grams for the whole recipe, plus "servings" (portions it makes). The app computes kcal and macros. ' +
      'Only for packaged/branded products or drinks that cannot be split into ingredients, give "values" per one serving as on the label (marked as an estimate). ' +
      'Returns the new food_id to use.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Turkish name, e.g. "Karnıyarık", "Soğuk kahve (buzlu, sütlü)".' },
        ingredients: { type: 'array', items: { type: 'object', properties: { ingredient_id: { type: 'string' }, grams: { type: 'number' } }, required: ['ingredient_id', 'grams'] } },
        servings: { type: 'number', description: 'Portions the ingredient amounts make (default 1).' },
        values: {
          type: 'object',
          properties: { portion: { type: 'string', description: 'e.g. "1 kutu (330 ml)"' }, kcal: { type: 'number' }, protein: { type: 'number' }, carb: { type: 'number' }, fat: { type: 'number' } },
          required: ['portion', 'kcal', 'protein', 'carb', 'fat'],
        },
        meals: { type: 'array', items: { type: 'string', enum: [...SLOTS] }, description: 'Meals it suits.' },
        hearty: { type: 'boolean', description: 'A full main dish (true) or light (false).' },
      },
      required: ['name'],
    },
    run: async (i) => {
      const name = String(i.name ?? '').trim()
      if (!name) return { error: 'name missing' }
      // Already there (exact name): use it.
      const same = searchFoods(name, 5).find((f) => foldTr(plateName(f.name)) === foldTr(name))
      if (same) return { exists: true, food: foodInfo(same.id) }
      const slots = ((i.meals as string[]) ?? []).filter((x): x is Slot => (SLOTS as readonly string[]).includes(x))
      const kind = i.hearty ? 'hearty' : 'light'
      const uid = Date.now().toString(36)
      let food: Food
      const lines = ((i.ingredients as { ingredient_id: string; grams: number }[]) ?? []).map((l) => ({ ingredientId: l.ingredient_id, grams: Number(l.grams) }))
      if (lines.length) {
        const unknown = lines.filter((l) => !ingredientById(l.ingredientId)).map((l) => l.ingredientId)
        if (unknown.length) return { error: `Unknown ingredient_id(s): ${unknown.join(', ')}. Use ids from search_ingredients.` }
        if (lines.some((l) => !(l.grams > 0 && l.grams < 5000))) return { error: 'Grams must be between 0 and 5000.' }
        const servings = Math.min(30, Math.max(1, Math.round(Number(i.servings) || 1)))
        food = { ...foodFromRecipe({ name, lines, servings, slots, kind, noMenu: true }, uid), source: 'Yapay zekânın tarifi; değerler malzemelerden hesaplandı' }
      } else if (i.values) {
        const v = i.values as { portion: string; kcal: number; protein: number; carb: number; fat: number }
        const kcal = Number(v.kcal), p = Number(v.protein), c = Number(v.carb), f = Number(v.fat)
        if (![kcal, p, c, f].every((x) => Number.isFinite(x) && x >= 0) || kcal > 3000) return { error: 'Values out of range.' }
        const fromMacros = p * 4 + c * 4 + f * 9
        if (kcal > 30 && Math.abs(fromMacros - kcal) / kcal > 0.25) return { error: `kcal (${kcal}) doesn't match the macros (≈${Math.round(fromMacros)}); check the values.` }
        food = {
          ...foodFromValues({ name, kcal, protein: p, carb: c, fat: f, slots, kind, noMenu: true }, uid),
          portion: String(v.portion || '1 porsiyon').slice(0, 60), estimated: true, source: 'Yapay zekâ tahmini (etiket değerlerine göre)',
        }
      } else return { error: 'Give ingredients (preferred) or values.' }
      await save(food)
      created.push(food.id)
      return { created: true, food: foodInfo(food.id) }
    },
  }
}

export interface MenuProposal {
  date: string
  meals: { slot: Slot; label: string; item: MenuItem }[]
  /** The day if this is eaten: what's logged plus the proposed meals, against the day's target. */
  day: Totals
  target: number
}

/** Claude's menu for the rest of the day, checked and totalled by the app; the user accepts it with one tap. */
export function proposeMenuTool(d: DayContext, onPropose: (p: MenuProposal) => void): AiTool {
  return {
    name: 'propose_menu',
    description:
      'Proposes concrete meals for today (meals not eaten yet) so the user can put them into their menu with one tap. Use food_ids from ' +
      'rest_of_day_plates, search_foods or create_food; factor = multiple of the standard portion. The app returns each meal\'s totals and the ' +
      'whole day (logged + proposed) against the target; if it is over, adjust and propose again. Call this whenever you recommend what to eat.',
    input_schema: {
      type: 'object',
      properties: {
        meals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              meal: { type: 'string', enum: [...SLOTS] },
              title: { type: 'string', description: 'Short Turkish name of the plate.' },
              items: { type: 'array', items: { type: 'object', properties: { food_id: { type: 'string' }, factor: { type: 'number' } }, required: ['food_id', 'factor'] } },
            },
            required: ['meal', 'items'],
          },
        },
      },
      required: ['meals'],
    },
    run: (i) => {
      if (!d.check) return { error: 'No plan (safety stop): do not propose menus.' }
      const meals: MenuProposal['meals'] = []
      const problems: string[] = []
      for (const m of (i.meals as { meal: string; title?: string; items: { food_id: string; factor: number }[] }[]) ?? []) {
        const slot = m.meal as Slot
        if (!d.labels[slot]) { problems.push(`${m.meal}: not one of the user's meals (${Object.keys(d.labels).join(', ')})`); continue }
        if (!d.openSlots.includes(slot)) { problems.push(`${d.labels[slot]}: already eaten or past; skipped`); continue }
        const parts = (m.items ?? []).filter((x) => getFood(x.food_id)).map((x) => ({ foodId: x.food_id, factor: Math.min(6, Math.max(0.25, Number(x.factor) || 1)) }))
        const bad = (m.items ?? []).filter((x) => !getFood(x.food_id)).map((x) => x.food_id)
        if (bad.length) problems.push(`unknown food_id(s): ${bad.join(', ')}`)
        if (!parts.length) continue
        const [main, ...sides] = parts
        const item: MenuItem = { slot, foodId: main.foodId, factor: main.factor, ...(sides.length ? { sides } : {}), title: m.title?.trim() || plateName(getFood(main.foodId)!.name), own: true }
        meals.push({ slot, label: d.labels[slot], item })
      }
      if (!meals.length) return { error: 'Nothing to propose.', problems }
      // The day if this is eaten: logged + proposed + the menu plates of the other meals still to come.
      const rest = (d.planned ?? []).filter((i) => d.openSlots.includes(i.slot) && !meals.some((m) => m.slot === i.slot))
      const day = sumTotals([d.eaten, ...meals.map((m) => mealTotals(m.item)), ...rest.map(mealTotals)])
      onPropose({ date: d.date, meals, day, target: d.check.kcalTarget })
      return {
        shown_to_user: true,
        meals: meals.map((m) => ({ meal: m.label, title: m.item.title, ...mealTotals(m.item) })),
        day_if_eaten: day, targets: { kcal: d.check.kcalTarget, protein: d.check.proteinTarget },
        ...(rest.length ? { also_counted: rest.map((i) => `${d.labels[i.slot]} from the menu: ${i.title ?? getFood(i.foodId)?.name} (${mealTotals(i).kcal} kcal)`) } : {}),
        fits: day.kcal <= d.check.kcalTarget + 50,
        ...(problems.length ? { problems } : {}),
      }
    },
  }
}
