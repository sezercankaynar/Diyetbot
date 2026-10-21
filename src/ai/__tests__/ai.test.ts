import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseFoodText } from '../foodLog'
import { AiError, DEFAULT_AI, gatewayChat } from '../gateway'
import { coachTools, createFoodTool, proposeMenuTool, type MenuProposal } from '../tools'
import { getFood, itemTotals, mealTotals, setExtraFoods, type Food } from '@/engine'
import { buildMenuContext, buildPlan } from '@/engine'
import { profile } from '@/engine/__tests__/helpers'

const S = { ...DEFAULT_AI, token: 'cgw_test' }
const reply = (o: Record<string, unknown>) => ({
  ok: true, status: 200,
  json: async () => ({ id: 'm', model: 'x', content: '', content_blocks: [], tool_calls: [], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 }, ...o }),
})

afterEach(() => vi.unstubAllGlobals())

describe('food text → catalogue foods', () => {
  it('runs the search tool, sends the result back, and keeps only real foods', async () => {
    const calls: { url: string; body: Record<string, unknown>; auth: string }[] = []
    const responses = [
      reply({
        stop_reason: 'tool_use',
        content_blocks: [{ type: 'tool_use', id: 't1', name: 'search_foods', input: { query: 'karışık tost' } }],
        tool_calls: [{ id: 't1', name: 'search_foods', input: { query: 'karışık tost' } }],
      }),
      reply({
        content: JSON.stringify({
          items: [
            { meal: 'breakfast', food_id: 'yl-karisik-tost', factor: 0.5, said: 'yarım karışık tost' },
            { meal: 'nonsense', food_id: 'yl-cay-sekersiz', factor: 2, said: 'iki çay' },
            { meal: 'lunch', food_id: 'made-up-id', factor: 1, said: 'uzay yemeği' },
          ],
          unmatched: ['ejder meyvesi'],
          note: '',
        }),
      }),
    ]
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init.body)), auth: (init.headers as Record<string, string>).Authorization })
      return responses.shift()
    }))
    const r = await parseFoodText(S, 'sabah yarım karışık tost iki çay', { meals: [{ slot: 'breakfast', label: 'Kahvaltı' }, { slot: 'lunch', label: 'Öğle' }], hour: 9, save: async () => {} })
    expect(calls[0].url).toBe('https://claude-gateway-backend.vercel.app/v1/chat')
    expect(calls[0].auth).toBe('Bearer cgw_test')
    expect(calls[0].body.model).toBe('claude-haiku-5-5')
    expect((calls[0].body.tools as { name: string }[])[0].name).toBe('search_foods')
    // Round 2 carries the assistant turn unchanged and the tool result with real catalogue data.
    const msgs = calls[1].body.messages as { role: string; content: unknown }[]
    expect(msgs[1]).toEqual({ role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'search_foods', input: { query: 'karışık tost' } }] })
    const result = (msgs[2].content as { tool_use_id: string; content: string }[])[0]
    expect(result.tool_use_id).toBe('t1')
    expect(JSON.parse(result.content)[0]).toMatchObject({ food_id: 'yl-karisik-tost', kcal: 534 })
    expect(r.items).toEqual([
      { slot: 'breakfast', foodId: 'yl-karisik-tost', factor: 0.5, said: 'yarım karışık tost' },
      { slot: null, foodId: 'yl-cay-sekersiz', factor: 2, said: 'iki çay' },
    ])
    expect(r.unmatched).toEqual(['ejder meyvesi', 'uzay yemeği'])
  })

  it('turns gateway errors into Turkish messages', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401, json: async () => ({ error: { type: 'unauthorized', message: 'x' } }) })))
    await expect(gatewayChat(S, { model: 'm', messages: [{ role: 'user', content: 'a' }] })).rejects.toThrow(/Token geçersiz/)
    await expect(gatewayChat({ ...S, token: '' }, { model: 'm', messages: [{ role: 'user', content: 'a' }] })).rejects.toBeInstanceOf(AiError)
  })
})

describe('coach tools use the app\'s numbers', () => {
  it('rest-of-day plates and a food check come from the engine', () => {
    const p = profile()
    const plan = buildPlan(p)
    const ctx = buildMenuContext(p, plan)!
    const eaten = { kcal: 1100, protein: 30, carb: 130, fat: 50 }
    const tools = coachTools({
      menuCtx: ctx, date: '2026-10-21', eaten, openSlots: ['dinner'], avoid: [], labels: { dinner: 'Akşam' },
      check: { kcalTarget: ctx.kcal, proteinTarget: ctx.proteinG, eaten, diet: 'med', animalFoods: p.animalFoods, dislikes: [] },
    })
    const rest = tools.find((t) => t.name === 'rest_of_day_plates')!.run({}) as { meal: string; budget: { kcal: number }; options: { kcal: number }[] }[]
    expect(rest[0].meal).toBe('Akşam')
    expect(rest[0].budget.kcal).toBe(ctx.kcal - 1100)
    expect(rest[0].options.length).toBeGreaterThan(0)
    const check = tools.find((t) => t.name === 'check_foods')!.run({ items: [{ food_id: 'yl-karisik-tost', factor: 1 }] }) as { totals: { kcal: number }; kcal_left_after: number }
    expect(check.totals.kcal).toBe(534)
    expect(check.kcal_left_after).toBe(ctx.kcal - 1100 - 534)
  })
})

describe('foods that are not in the catalogue', () => {
  afterEach(() => setExtraFoods([]))
  const saved: Food[] = []
  const save = async (f: Food) => {
    saved.push(f)
    setExtraFoods([...saved])
  }

  it('a dish from ingredients: the app computes its values; label values must add up', async () => {
    const created: string[] = []
    const tool = createFoodTool(save, created)
    const r = await tool.run({
      name: 'Karnıyarık', servings: 2, meals: ['dinner'], hearty: true,
      ingredients: [{ ingredient_id: 'patlican', grams: 400 }, { ingredient_id: 'dana-kiyma-20', grams: 150 }, { ingredient_id: 'zeytinyagi', grams: 20 }],
    }) as { food: { food_id: string; kcal: number } }
    const f = getFood(r.food.food_id)!
    // (400 × 0.25 + 150 × 2.54 + 20 × 8.84) / 2 ≈ 329
    expect(f.kcal).toBeGreaterThan(300)
    expect(f.kcal).toBeLessThan(360)
    expect(f.estimated).toBeFalsy()
    expect(created).toEqual([f.id])
    // Same name again → the existing one.
    expect(await tool.run({ name: 'karnıyarık', ingredients: [{ ingredient_id: 'patlican', grams: 100 }] })).toMatchObject({ exists: true })
    // Unknown ingredient / values that don't add up → an error Claude can fix.
    expect(await tool.run({ name: 'X', ingredients: [{ ingredient_id: 'uydurma', grams: 100 }] })).toHaveProperty('error')
    expect(await tool.run({ name: 'Y', values: { portion: '1 kutu', kcal: 500, protein: 0, carb: 10, fat: 0 } })).toHaveProperty('error')
    const drink = await tool.run({ name: 'Enerji içeceği', values: { portion: '1 kutu (250 ml)', kcal: 112, protein: 0, carb: 27, fat: 0 } }) as { food: { food_id: string } }
    expect(getFood(drink.food.food_id)).toMatchObject({ estimated: true, portion: '1 kutu (250 ml)', kcal: 112 })
  })

  it('a proposed menu is checked and totalled by the app, only for meals still to come', () => {
    const p = profile()
    const ctx = buildMenuContext(p, buildPlan(p))!
    const eaten = { kcal: 900, protein: 40, carb: 100, fat: 35 }
    let got: MenuProposal | null = null
    const tool = proposeMenuTool({
      menuCtx: ctx, date: '2026-10-21', eaten, openSlots: ['dinner', 'snack'], avoid: [], labels: { breakfast: 'Kahvaltı', lunch: 'Öğle', dinner: 'Akşam', snack: 'Ara öğün' },
      planned: [{ slot: 'snack', foodId: 'pc-muz', factor: 1 }, { slot: 'dinner', foodId: 'yl-tavuk-sote', factor: 1 }],
      check: { kcalTarget: ctx.kcal, proteinTarget: ctx.proteinG, eaten, diet: 'med', animalFoods: p.animalFoods, dislikes: [] },
    }, (x) => (got = x))
    const r = tool.run({ meals: [
      { meal: 'lunch', items: [{ food_id: 'yl-tavuk-sote', factor: 1 }] },
      { meal: 'dinner', title: 'Tavuk sote tabağı', items: [{ food_id: 'yl-tavuk-sote', factor: 1 }, { food_id: 'pc-bulgur', factor: 6 }, { food_id: 'nope', factor: 1 }] },
    ] }) as { fits: boolean; problems: string[]; day_if_eaten: { kcal: number } }
    expect(got!.meals.map((m) => m.slot)).toEqual(['dinner'])
    expect(got!.meals[0].item).toMatchObject({ slot: 'dinner', foodId: 'yl-tavuk-sote', title: 'Tavuk sote tabağı', own: true, sides: [{ foodId: 'pc-bulgur', factor: 6 }] })
    expect(r.problems.join(' ')).toMatch(/Öğle.*already eaten|unknown food_id/)
    expect(r.day_if_eaten.kcal).toBe(got!.day.kcal)
    // Logged + proposed dinner + the snack still to come from the menu (not the replaced menu dinner).
    expect(got!.day.kcal).toBe(eaten.kcal + mealTotals(got!.meals[0].item).kcal + itemTotals('pc-muz', 1).kcal)
    expect(r.fits).toBe(got!.day.kcal <= ctx.kcal + 50)
  })
})
