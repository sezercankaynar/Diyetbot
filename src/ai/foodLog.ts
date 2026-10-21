// "Öğlen yarım lahmacun ve ayran içtim" → foods from the catalogue with amounts and meals, for the user
// to check and save. Claude finds the foods with search_foods; the values are the app's.
import { getFood, type Slot } from '@/engine'
import { runAgent } from './agent'
import { AiError, type AiSettings } from './gateway'
import { searchFoodsTool } from './tools'

export interface ParsedItem {
  /** A meal of the day, or null = eaten outside meals. */
  slot: Slot | null
  foodId: string
  factor: number
  /** What the user said for it (e.g. "yarım lahmacun"). */
  said: string
}
export interface ParsedLog {
  items: ParsedItem[]
  /** Things that couldn't be matched to the catalogue. */
  unmatched: string[]
  note: string
}

const SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          meal: { type: 'string', description: 'One of the meal ids given, or "extra" for food outside meals.' },
          food_id: { type: 'string' },
          factor: { type: 'number', description: 'Multiple of the food\'s standard portion.' },
          said: { type: 'string', description: 'The words the user used for this item.' },
        },
        required: ['meal', 'food_id', 'factor', 'said'],
        additionalProperties: false,
      },
    },
    unmatched: { type: 'array', items: { type: 'string' } },
    note: { type: 'string', description: 'One short Turkish sentence for the user (e.g. an assumption made), or empty.' },
  },
  required: ['items', 'unmatched', 'note'],
  additionalProperties: false,
}

export async function parseFoodText(
  s: AiSettings,
  text: string,
  o: { meals: { slot: Slot; label: string }[]; fixedSlot?: Slot | null; hour: number; signal?: AbortSignal; onTool?: (n: string) => void },
): Promise<ParsedLog> {
  const mealList = o.meals.map((m) => `${m.slot} = ${m.label}`).join(', ')
  const system = [
    'You turn what a Turkish user writes about what they ate into foods from the app\'s catalogue.',
    'For EVERY food mentioned, call search_foods (Turkish, short queries; try a more general word if nothing fits). Use only returned food_ids. Search several foods in parallel when you can.',
    'Pick the closest match (a plain item over a combo plate unless the user described the combo). If nothing reasonable exists after 2 tries, put the words in "unmatched".',
    'Amount → factor (multiple of the food\'s standard portion): no amount = the standard portion (1). "yarım" = 0.5 of the portion. Grams → grams / grams_per_portion. ' +
      'A count in the food\'s count_unit → count × factor_per_one (e.g. 3 dilim with factor_per_one 0.5 → 1.5). "2 tane" of a 1-adet food → 2. Round to 2 decimals.',
    'Drinks without calories (water, plain tea/coffee) are fine to include if listed in the catalogue; ignore plain water.',
    o.fixedSlot
      ? `Everything belongs to the meal "${o.fixedSlot}".`
      : `Assign each item a meal from: ${mealList}, or "extra" for snacks eaten between meals. Use words like sabah/kahvaltı, öğle(n), akşam, ara öğün; without any hint use the meal closest to the current hour (${o.hour}:00).`,
    'Do not invent nutrition values. Reply only with the JSON.',
  ].join('\n')
  const run = (format: boolean) => runAgent(s, {
    model: s.logModel, system: format ? system : `${system}\nAnswer with only a JSON object of this shape: ${JSON.stringify(SCHEMA)}`,
    tools: [searchFoodsTool], maxTokens: 1500, maxRounds: 5, signal: o.signal, onTool: o.onTool,
    messages: [{ role: 'user', content: text }],
    ...(format ? { format: { type: 'json_schema' as const, schema: SCHEMA } } : {}),
  })
  let r
  try {
    r = await run(true)
  } catch (e) {
    // A model without structured output: ask for plain JSON instead.
    if (e instanceof AiError && /bad_request|invalid_request/.test(e.type)) r = await run(false)
    else throw e
  }
  let data: { items?: { meal: string; food_id: string; factor: number; said: string }[]; unmatched?: string[]; note?: string }
  try {
    const t = r.text
    data = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1))
  } catch {
    throw new Error('Yapay zekâ yanıtı okunamadı; tekrar dene.')
  }
  const slots = new Set(o.meals.map((m) => m.slot))
  const items: ParsedItem[] = []
  const unmatched = [...(data.unmatched ?? [])]
  for (const it of data.items ?? []) {
    // Only catalogue foods, sensible amounts.
    if (!getFood(it.food_id)) {
      unmatched.push(it.said)
      continue
    }
    const slot = o.fixedSlot ?? (slots.has(it.meal as Slot) ? (it.meal as Slot) : null)
    items.push({ slot, foodId: it.food_id, factor: Math.min(10, Math.max(0.1, Math.round((Number(it.factor) || 1) * 100) / 100)), said: it.said })
  }
  return { items, unmatched, note: data.note ?? '' }
}
