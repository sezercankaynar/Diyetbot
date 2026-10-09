import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Adjustment, DietId, Profile, WeighIn } from '@/engine'

export interface Settings {
  /** User-chosen diet; null → use the top-scored one. */
  diet: DietId | null
}

interface DiyetDB extends DBSchema {
  profile: { key: string; value: Profile }
  weighLogs: { key: string; value: WeighIn }
  adjustments: { key: string; value: Adjustment }
  settings: { key: string; value: Settings }
}

export interface Backup {
  app: 'diyetbot'
  version: 1
  exportedAt: string
  profile: Profile | null
  weighLogs: WeighIn[]
  adjustments: Adjustment[]
  settings: Settings | null
}

const DB_NAME = 'diyetbot'
const MAIN = 'main'

let dbPromise: Promise<IDBPDatabase<DiyetDB>> | null = null

export function db(): Promise<IDBPDatabase<DiyetDB>> {
  dbPromise ??= openDB<DiyetDB>(DB_NAME, 1, {
    upgrade(d) {
      d.createObjectStore('profile')
      d.createObjectStore('weighLogs', { keyPath: 'date' })
      d.createObjectStore('adjustments', { keyPath: 'id' })
      d.createObjectStore('settings')
    },
  })
  return dbPromise
}

/** Vue reactive proxies can't be structured-cloned; store plain copies. */
const plain = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

export const repo = {
  async loadProfile() {
    return (await db()).get('profile', MAIN)
  },
  async saveProfile(p: Profile) {
    await (await db()).put('profile', plain(p), MAIN)
  },
  async loadSettings() {
    return (await db()).get('settings', MAIN)
  },
  async saveSettings(s: Settings) {
    await (await db()).put('settings', plain(s), MAIN)
  },
  async listWeighIns() {
    return (await db()).getAll('weighLogs')
  },
  async putWeighIn(w: WeighIn) {
    await (await db()).put('weighLogs', plain(w))
  },
  async deleteWeighIn(date: string) {
    await (await db()).delete('weighLogs', date)
  },
  async listAdjustments() {
    return (await db()).getAll('adjustments')
  },
  async putAdjustment(a: Adjustment) {
    await (await db()).put('adjustments', plain(a))
  },
  async deleteAdjustment(id: string) {
    await (await db()).delete('adjustments', id)
  },

  async exportAll(): Promise<Backup> {
    const d = await db()
    return {
      app: 'diyetbot',
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: (await d.get('profile', MAIN)) ?? null,
      weighLogs: await d.getAll('weighLogs'),
      adjustments: await d.getAll('adjustments'),
      settings: (await d.get('settings', MAIN)) ?? null,
    }
  },

  /** Replaces all data with the backup contents. */
  async importAll(b: Backup) {
    const d = await db()
    const tx = d.transaction(['profile', 'weighLogs', 'adjustments', 'settings'], 'readwrite')
    await Promise.all([
      tx.objectStore('profile').clear(),
      tx.objectStore('weighLogs').clear(),
      tx.objectStore('adjustments').clear(),
      tx.objectStore('settings').clear(),
    ])
    if (b.profile) await tx.objectStore('profile').put(b.profile, MAIN)
    if (b.settings) await tx.objectStore('settings').put(b.settings, MAIN)
    for (const w of b.weighLogs) await tx.objectStore('weighLogs').put(w)
    for (const a of b.adjustments) await tx.objectStore('adjustments').put(a)
    await tx.done
  },
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Validates an untrusted parsed JSON value as a backup. Throws a Turkish message on failure. */
export function parseBackup(raw: unknown): Backup {
  const fail = (m: string): never => {
    throw new Error(`Geçersiz yedek dosyası: ${m}`)
  }
  if (!raw || typeof raw !== 'object') fail('JSON nesnesi değil')
  const o = raw as Record<string, unknown>
  if (o.app !== 'diyetbot') fail('Diyetbot yedeği değil')
  if (o.version !== 1) fail('desteklenmeyen sürüm')
  if (!Array.isArray(o.weighLogs) || !Array.isArray(o.adjustments)) fail('eksik alanlar')
  const weighLogs = (o.weighLogs as unknown[]).map((w) => {
    const x = w as WeighIn
    if (!x || typeof x.date !== 'string' || !DATE_RE.test(x.date) || typeof x.kg !== 'number' || !Number.isFinite(x.kg)) {
      fail('hatalı tartı kaydı')
    }
    return { date: x.date, kg: x.kg }
  })
  const adjustments = (o.adjustments as unknown[]).map((a) => {
    const x = a as Adjustment
    if (!x || typeof x.id !== 'string' || typeof x.kcalDelta !== 'number') fail('hatalı düzeltme kaydı')
    return x
  })
  const profile = o.profile as Profile | null
  if (profile !== null && (typeof profile !== 'object' || typeof profile.weightKg !== 'number' || !profile.health)) {
    fail('hatalı profil')
  }
  return {
    app: 'diyetbot',
    version: 1,
    exportedAt: typeof o.exportedAt === 'string' ? o.exportedAt : '',
    profile,
    weighLogs,
    adjustments,
    settings: (o.settings as Settings | null) ?? null,
  }
}
