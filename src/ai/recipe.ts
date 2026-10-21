// "Annemin karnıyarığı: 6 patlıcan, 300 g kıyma …" (typed, pasted or a photo of a written recipe) →
// ingredients from the app's table with raw grams and the number of portions. The app computes the
// values; the user checks the list in the recipe builder and saves.
import { ingredientById, type RecipeLine } from '@/engine'
import { runAgent } from './agent'
import { AiError, type AiSettings } from './gateway'
import { photoContent } from './foodLog'
import type { AiImage } from './image'
import { searchIngredientsTool } from './tools'

export interface ParsedRecipe {
  name: string
  servings: number
  lines: (RecipeLine & { said: string })[]
  unmatched: string[]
  note: string
}

const SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    servings: { type: 'number' },
    lines: {
      type: 'array',
      items: {
        type: 'object',
        properties: { ingredient_id: { type: 'string' }, grams: { type: 'number' }, said: { type: 'string' } },
        required: ['ingredient_id', 'grams', 'said'],
        additionalProperties: false,
      },
    },
    unmatched: { type: 'array', items: { type: 'string' } },
    note: { type: 'string' },
  },
  required: ['name', 'servings', 'lines', 'unmatched', 'note'],
  additionalProperties: false,
}

const SYSTEM = [
  'You turn a Turkish home recipe into ingredients from the app\'s ingredient table, so the app can compute its calories.',
  'For every ingredient call search_ingredients (Turkish, one word or two; several in parallel) and use only returned ingredient_ids. Pick the closest form (raw/dry as bought: kuru fasulye (kuru), pirinç (kuru), bulgur (kuru); "kıyma" without a fat % → the %20 one).',
  'Convert every amount to RAW grams of the edible part. Use the ingredient\'s "units" when given; otherwise typical Turkish measures: 1 su bardağı ≈ 200 ml (pirinç/bulgur ≈ 170 g, un ≈ 110 g, şeker ≈ 180 g, su/süt ≈ 200 g), ' +
    '1 çay bardağı ≈ 100 ml, 1 yemek kaşığı ≈ 10 g yağ / 15 g salça / 8 g un, 1 tatlı kaşığı ≈ ⅓ yemek kaşığı, 1 orta soğan ≈ 100 g, 1 orta domates ≈ 120 g, ' +
    '1 orta patlıcan ≈ 250 g, 1 orta patates ≈ 150 g, 1 orta havuç ≈ 70 g, 1 orta kabak ≈ 200 g, 1 sivri biber ≈ 15 g, 1 yumurta ≈ 50 g, 1 diş sarımsak ≈ 4 g.',
  'Oil used for deep-frying ("kızartmak için"): count only what stays in the food, about ⅓ of it for eggplant, potato and battered foods, ¼ otherwise, and say so in "note". Oil that goes into the dish counts fully.',
  'Leave out water, salt and spices (no calories). Ingredients you cannot find in the table go to "unmatched" with their amount.',
  'servings = how many portions the recipe makes (from the text, e.g. "6 kişilik"; otherwise a sensible estimate, and say so in "note"). name = the dish\'s Turkish name as the user calls it.',
  '"note": one short Turkish sentence with any assumption (e.g. "Patlıcanları orta boy saydım."), or empty. Reply only with the JSON.',
].join('\n')

export async function parseRecipe(
  s: AiSettings, input: { text?: string; image?: AiImage }, o: { signal?: AbortSignal; onTool?: (n: string) => void } = {},
): Promise<ParsedRecipe> {
  const text = input.text?.trim() ?? ''
  const content = input.image ? photoContent(input.image, text || 'Bu tarifin malzemelerini çıkar.') : text
  const run = (format: boolean) => runAgent(s, {
    model: input.image ? s.photoModel : s.logModel,
    system: format ? SYSTEM : `${SYSTEM}\nAnswer with only a JSON object of this shape: ${JSON.stringify(SCHEMA)}`,
    tools: [searchIngredientsTool], maxTokens: 3000, maxRounds: 6, signal: o.signal, onTool: o.onTool,
    messages: [{ role: 'user', content }],
    ...(format ? { format: { type: 'json_schema' as const, schema: SCHEMA } } : {}),
  })
  let r
  try {
    r = await run(true)
  } catch (e) {
    if (e instanceof AiError && /bad_request|invalid_request/.test(e.type)) r = await run(false)
    else throw e
  }
  let data: { name?: string; servings?: number; lines?: { ingredient_id: string; grams: number; said: string }[]; unmatched?: string[]; note?: string }
  try {
    data = JSON.parse(r.text.slice(r.text.indexOf('{'), r.text.lastIndexOf('}') + 1))
  } catch {
    throw new Error('Yapay zekâ yanıtı okunamadı; tekrar dene.')
  }
  const unmatched = [...(data.unmatched ?? [])]
  const lines: ParsedRecipe['lines'] = []
  for (const l of data.lines ?? []) {
    const g = Math.round(Number(l.grams))
    if (!ingredientById(l.ingredient_id) || !(g > 0 && g < 10000)) {
      unmatched.push(l.said)
      continue
    }
    lines.push({ ingredientId: l.ingredient_id, grams: g, said: l.said })
  }
  return {
    name: (data.name ?? '').trim(),
    servings: Math.min(30, Math.max(1, Math.round(Number(data.servings) || 1))),
    lines, unmatched, note: data.note ?? '',
  }
}
