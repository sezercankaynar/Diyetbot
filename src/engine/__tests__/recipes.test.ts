import { describe, expect, it } from 'vitest'
import { methodFor } from '../../content/recipes'
import { MAINS, SOUPS } from '../plateParts'
import { getFood } from '../foods'
import { DISH_RECIPES } from '../../content/dishRecipes'

describe('recipes', () => {
  it('every menu main dish and soup has a method', () => {
    for (const id of [...MAINS.map((m) => m.id), ...SOUPS, 'pc-bulgur', 'pc-pirinc', 'pc-salata', 'pc-cacik']) expect(methodFor(id), id).not.toBeNull()
  })
  it('picks the right method', () => {
    expect(methodFor('yl-etli-kuru-fasulye-tabak')!.steps[0]).toMatch(/ıslat/)
    expect(methodFor('yl-zy-pirasa-tabak')!.steps[0]).toMatch(/zeytinyağ/)
    expect(methodFor('yl-levrek-bugulama-tabak')!.steps.join(' ')).toMatch(/kapağı/i)
    expect(methodFor('yl-kabak-dolmasi')!.steps[0]).toMatch(/İç harcı/)
  })
  it('every menu main dish with a recipe and every soup has its own detailed recipe', () => {
    const ids = [...MAINS.map((m) => m.id), ...SOUPS].filter((id) => getFood(id)?.recipe)
    for (const id of ids) {
      const r = DISH_RECIPES[id]
      expect(r, id).toBeDefined()
      expect(r.steps.length, id).toBeGreaterThanOrEqual(3)
      expect(r.prep.length, id).toBeGreaterThanOrEqual(1)
    }
    // Every recipe key is a real food; liquid placeholders are well-formed.
    for (const [id, r] of Object.entries(DISH_RECIPES)) {
      expect(getFood(id), id).toBeDefined()
      for (const t of [...r.prep, ...r.steps]) expect(t.replace(/\{su:\d+\}/g, ''), id).not.toMatch(/[{}]/)
    }
  })
})
