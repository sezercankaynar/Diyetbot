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
    await repo.putCustomFood({ id: 'pk-1-30', name: 'Gofret', portion: '30 g', slots: [], group: 'paket', prep: 1, tags: [], protein: 2, carb: 18, fat: 10, kcal: 170 })
    await repo.putCheckIn({ id: 'c1', date: '2026-01-15', hunger: 3, energy: 3, sleep: 3, adherence: 70, difficulties: ['tatli'], waistCm: 88 })
    await repo.putDaily({ date: '2026-01-15', water: 6, habits: ['protein'] })
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
    expect((await repo.listCustomFoods())[0].name).toBe('Gofret')
    expect((await repo.listCheckIns())[0].waistCm).toBe(88)
    expect((await repo.listDaily())[0].habits).toEqual(['protein'])
  })

  it('accepts version 1 backups (no diary/menu)', () => {
    const b = parseBackup({ app: 'diyetbot', version: 1, profile: null, weighLogs: [], adjustments: [] })
    expect(b.diary).toEqual([])
    expect(b.menu).toBeNull()
    expect(b.customFoods).toEqual([])
    expect(b.checkins).toEqual([])
    expect(b.daily).toEqual([])
  })

  it('rejects invalid backups', () => {
    expect(() => parseBackup({ app: 'other' })).toThrow(/Geçersiz/)
    expect(() =>
      parseBackup({ app: 'diyetbot', version: 1, profile: null, weighLogs: [{ date: 'x', kg: 1 }], adjustments: [] }),
    ).toThrow(/tartı/)
  })
})
