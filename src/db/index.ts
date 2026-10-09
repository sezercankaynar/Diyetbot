import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Adjustment, DiaryEntry, DietId, Profile, WeekMenu, WeighIn } from '@/engine'

export interface Settings {
  /** User-chosen diet; null → use the top-scored one. */
  diet: DietId | null
  /** Menu feedback: dishes the user liked / doesn't want to see again. */
  liked?: string[]
  disliked?: string[]
}

interface DiyetDB extends DBSchema {
  profile: { key: string; value: Profile }
  weighLogs: { key: string; value: WeighIn }
  adjustments: { key: string; value: Adjustment }
  settings: { key: string; value: Settings }
  diary: { key: string; value: DiaryEntry; indexes: { byDate: string } }
  menus: { key: string; value: WeekMenu }
}

export interface Backup {
  app: 'diyetbot'
  version: 2
  exportedAt: string
  profile: Profile | null
  weighLogs: WeighIn[]
  adjustments: Adjustment[]
  settings: Settings | null
  diary: DiaryEntry[]
  menu: WeekMenu | null
}

const DB_NAME = 'diyetbot'
const MAIN = 'main'

let dbPromise: Promise<IDBPDatabase<DiyetDB>> | null = null

export function db(): Promise<IDBPDatabase<DiyetDB>> {
  dbPromise ??= openDB<DiyetDB>(DB_NAME, 2, {
    upgrade(d, oldVersion) {
      if (oldVersion < 1) {
        d.createObjectStore('profile')
        d.createObjectStore('weighLogs', { keyPath: 'date' })
        d.createObjectStore('adjustments', { keyPath: 'id' })
        d.createObjectStore('settings')
      }
      if (oldVersion < 2) {
        d.createObjectStore('diary', { keyPath: 'id' }).createIndex('byDate', 'date')
        d.createObjectStore('menus')
      }
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

  async listDiary(date?: string) {
    const d = await db()
    return date ? d.getAllFromIndex('diary', 'byDate', date) : d.getAll('diary')
  },
  async putDiary(e: DiaryEntry) {
    await (await db()).put('diary', plain(e))
  },
  async deleteDiary(id: string) {
    await (await db()).delete('diary', id)
  },
  async loadMenu() {
    return (await db()).get('menus', MAIN)
  },
  async saveMenu(m: WeekMenu) {
    await (await db()).put('menus', plain(m), MAIN)
  },

  async exportAll(): Promise<Backup> {
    const d = await db()
    return {
      app: 'diyetbot',
      version: 2,
      exportedAt: new Date().toISOString(),
      profile: (await d.get('profile', MAIN)) ?? null,
      weighLogs: await d.getAll('weighLogs'),
      adjustments: await d.getAll('adjustments'),
      settings: (await d.get('settings', MAIN)) ?? null,
      diary: await d.getAll('diary'),
      menu: (await d.get('menus', MAIN)) ?? null,
    }
  },

  /** Replaces all data with the backup contents. */
  async importAll(b: Backup) {
    const d = await db()
    const tx = d.transaction(['profile', 'weighLogs', 'adjustments', 'settings', 'diary', 'menus'], 'readwrite')
    await Promise.all([
      tx.objectStore('profile').clear(),
      tx.objectStore('weighLogs').clear(),
      tx.objectStore('adjustments').clear(),
      tx.objectStore('settings').clear(),
      tx.objectStore('diary').clear(),
      tx.objectStore('menus').clear(),
    ])
    if (b.profile) await tx.objectStore('profile').put(b.profile, MAIN)
    if (b.settings) await tx.objectStore('settings').put(b.settings, MAIN)
    for (const w of b.weighLogs) await tx.objectStore('weighLogs').put(w)
    for (const a of b.adjustments) await tx.objectStore('adjustments').put(a)
    for (const e of b.diary) await tx.objectStore('diary').put(e)
    if (b.menu) await tx.objectStore('menus').put(b.menu, MAIN)
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
  if (o.version !== 1 && o.version !== 2) fail('desteklenmeyen sürüm')
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
  // Version 1 backups have no diary/menu.
  const diary = Array.isArray(o.diary)
    ? (o.diary as unknown[]).map((e) => {
        const x = e as DiaryEntry
        if (!x || typeof x.id !== 'string' || typeof x.foodId !== 'string' || !DATE_RE.test(x.date) || typeof x.factor !== 'number') {
          fail('hatalı günlük kaydı')
        }
        return x
      })
    : []
  const menu = o.menu && typeof o.menu === 'object' && Array.isArray((o.menu as WeekMenu).days) ? (o.menu as WeekMenu) : null
  return {
    app: 'diyetbot',
    version: 2,
    exportedAt: typeof o.exportedAt === 'string' ? o.exportedAt : '',
    profile,
    weighLogs,
    adjustments,
    settings: (o.settings as Settings | null) ?? null,
    diary,
    menu,
  }
}
