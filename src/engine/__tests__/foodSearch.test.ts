import { describe, expect, it } from 'vitest'
import { searchFoods, stems } from '../foodSearch'

describe('food search', () => {
  it('stems Turkish suffixes', () => {
    expect(stems('tavuklu')).toContain('tavuk')
    expect(stems('pilavi')).toContain('pilav')
  })
  it('"tavuklu pilav" finds chicken + rice dishes, generic dishes first', () => {
    const r = searchFoods('tavuklu pilav')
    const ids = r.map((f) => f.id)
    expect(ids).toContain('tavuklu-pilav')
    expect(ids).toContain('pilav-ustu-tavuk-doner')
    expect(r[0].brand).toBeUndefined()
  })
  it('ignores case and Turkish letters', () => {
    expect(searchFoods('MERCİMEK ÇORBASI').length).toBeGreaterThan(0)
    expect(searchFoods('mercimek corbasi').map((f) => f.id)).toEqual(searchFoods('Mercimek çorbası').map((f) => f.id))
  })
  it('empty query → nothing', () => {
    expect(searchFoods('  ')).toEqual([])
  })
  it('snacks by common names', () => {
    expect(searchFoods('popcorn').length).toBeGreaterThan(2)
    expect(searchFoods('cips')[0].group).toBe('ara')
    expect(searchFoods('çiğdem').length).toBeGreaterThan(0)
  })
})
