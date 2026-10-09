import { describe, expect, it } from 'vitest'
import { avoidsAll, foodKeys, likeMatches, PREF_KEYS } from '../foodKeys'
import { getFood } from '../foods'

const f = (id: string) => getFood(id)!

describe('taste keys', () => {
  it('match dish names', () => {
    expect(foodKeys(f('karniyarik'))).toEqual(expect.arrayContaining(['patlican', 'dana-kiyma', 't-redmeat']))
    expect(foodKeys(f('ton-salata'))).toEqual(expect.arrayContaining(['ton', 't-fish', 'salata']))
    expect(foodKeys(f('mercimek-corba-yogurt'))).toEqual(expect.arrayContaining(['mercimek', 'corba', 'yogurt']))
    expect(foodKeys(f('menemen'))).toContain('t-egg')
    expect(foodKeys(f('tavuk-bulgur'))).toEqual(expect.arrayContaining(['tavuk', 'bulgur', 'izgara']))
  })
  it('dislikes accept fine keys and coarse tags', () => {
    expect(avoidsAll(f('karniyarik'), ['patlican'])).toBe(false)
    expect(avoidsAll(f('karniyarik'), ['fish'])).toBe(true)
    expect(avoidsAll(f('levrek-roka'), ['fish'])).toBe(false)
    expect(likeMatches(f('etli-turlu'), ['bulgur', 'yogurt'])).toBe(2)
  })
  it('every key is used by at least one food or is a coarse tag', async () => {
    const { allFoods } = await import('../foods')
    const used = new Set(allFoods().flatMap(foodKeys))
    const unused = PREF_KEYS.filter((k) => !k.tag && !used.has(k.id)).map((k) => k.id)
    expect(unused).toEqual([])
  })
})
