import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { defaultProfile } from '@/engine'
import { parseBackup, repo } from './index'

describe('IndexedDB repo', () => {
  it('round-trips profile, weigh-ins and adjustments through export/import', async () => {
    await repo.saveProfile(defaultProfile())
    await repo.putWeighIn({ date: '2026-01-01', kg: 80 })
    await repo.putWeighIn({ date: '2026-01-01', kg: 79.5 }) // same date → overwrite
    await repo.putAdjustment({ id: 'a1', date: '2026-01-15', kcalDelta: -150, stepsDelta: 0, fromKcal: 2110, toKcal: 1960, reason: 'x' })

    await repo.putDiary({ id: 'd1', date: '2026-01-15', foodId: 'ayran', factor: 1 })
    await repo.saveMenu({ weekStart: '2026-01-12', seed: 1, days: [] })
    const backup = await repo.exportAll()
    expect(backup.weighLogs).toEqual([{ date: '2026-01-01', kg: 79.5 }])

    await repo.deleteWeighIn('2026-01-01')
    expect(await repo.listWeighIns()).toHaveLength(0)

    await repo.importAll(parseBackup(JSON.parse(JSON.stringify(backup))))
    expect(await repo.listWeighIns()).toEqual([{ date: '2026-01-01', kg: 79.5 }])
    expect((await repo.listAdjustments())[0].kcalDelta).toBe(-150)
    expect((await repo.loadProfile())?.weightKg).toBe(80)
    expect(await repo.listDiary('2026-01-15')).toHaveLength(1)
    expect(await repo.listDiary('2026-01-16')).toHaveLength(0)
    expect((await repo.loadMenu())?.weekStart).toBe('2026-01-12')
  })

  it('accepts version 1 backups (no diary/menu)', () => {
    const b = parseBackup({ app: 'diyetbot', version: 1, profile: null, weighLogs: [], adjustments: [] })
    expect(b.diary).toEqual([])
    expect(b.menu).toBeNull()
  })

  it('rejects invalid backups', () => {
    expect(() => parseBackup({ app: 'other' })).toThrow(/Geçersiz/)
    expect(() =>
      parseBackup({ app: 'diyetbot', version: 1, profile: null, weighLogs: [{ date: 'x', kg: 1 }], adjustments: [] }),
    ).toThrow(/tartı/)
  })
})
