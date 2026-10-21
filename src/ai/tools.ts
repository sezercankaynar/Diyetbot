// The app's functions Claude may call. Everything numeric (kcal, macros, verdicts, plates) is computed
// here by the engine; Claude only picks, matches and explains.
import {
  amountText, amountWays, evaluateMeal, getFood, itemTotals, mealTotals, partsOf, plateName, searchFoods,
  suggestForRest, type CheckContext, type MenuContext, type Slot, type Totals,
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
            parts: partsOf(o).map((x) => `${amountText(x.foodId, x.factor)} ${plateName(getFood(x.foodId)?.name ?? '')}`),
          })),
        }))
      },
    },
  ]
}

/** kcal etc. of a food at a factor (for showing what Claude proposed). */
export const totalsOf = (id: string, factor: number) => itemTotals(id, factor)
