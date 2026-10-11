import { describe, expect, it } from 'vitest'
import { methodFor } from '../../content/recipes'
import { MAINS, SOUPS } from '../plateParts'

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
})
