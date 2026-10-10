import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Adjustment, CheckIn, DailyLog, DiaryEntry, DietId, Food, Profile, WaterReminder, WeekMenu, WeighIn } from '@/engine'

export interface Settings {
  /** User-chosen diet; null → use the top-scored one. */
  diet: DietId | null
  /** Menu feedback: dishes the user liked / doesn't want to see again. */
  liked?: string[]
  disliked?: string[]
  /** Habit ids the user chose to follow. */
  habits?: string[]
  /** Water reminder settings. */
  water?: WaterReminder
}

interface DiyetDB extends DBSchema {
  profile: { key: string; value: Profile }
  weighLogs: { key: string; value: WeighIn }
  adjustments: { key: string; value: Adjustment }
  settings: { key: string; value: Settings }
  diary: { key: string; value: DiaryEntry; indexes: { byDate: string } }
  menus: { key: string; value: WeekMenu }
  customFoods: { key: string; value: Food }
  checkins: { key: string; value: CheckIn }
  daily: { key: string; value: DailyLog }
}

export interface Backup {
  app: 'diyetbot'
  version: 4
  exportedAt: string
  profile: Profile | null
  weighLogs: WeighIn[]
  adjustments: Adjustment[]
  settings: Settings | null
  diary: DiaryEntry[]
  menu: WeekMenu | null
  /** Packaged products the user saved (diary entries may point to them). */
  customFoods: Food[]
  checkins: CheckIn[]
  daily: DailyLog[]
}

const DB_NAME = 'diyetbot'
const MAIN = 'main'

let dbPromise: Promise<IDBPDatabase<DiyetDB>> | null = null

export function db(): Promise<IDBPDatabase<DiyetDB>> {
  dbPromise ??= openDB<DiyetDB>(DB_NAME, 4, {
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
      if (oldVersion < 3) {
        d.createObjectStore('customFoods', { keyPath: 'id' })
      }
      if (oldVersion < 4) {
        d.createObjectStore('checkins', { keyPath: 'id' })
        d.createObjectStore('daily', { keyPath: 'date' })
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

  async listCustomFoods() {
    return (await db()).getAll('customFoods')
  },
  async putCustomFood(f: Food) {
    await (await db()).put('customFoods', plain(f))
  },
  async deleteCustomFood(id: string) {
    await (await db()).delete('customFoods', id)
  },

  async listCheckIns() {
    return (await db()).getAll('checkins')
  },
  async putCheckIn(c: CheckIn) {
    await (await db()).put('checkins', plain(c))
  },
  async deleteCheckIn(id: string) {
    await (await db()).delete('checkins', id)
  },
  async listDaily() {
    return (await db()).getAll('daily')
  },
  async putDaily(l: DailyLog) {
    await (await db()).put('daily', plain(l))
  },

  async exportAll(): Promise<Backup> {
    const d = await db()
    return {
      app: 'diyetbot',
      version: 4,
      exportedAt: new Date().toISOString(),
      profile: (await d.get('profile', MAIN)) ?? null,
      weighLogs: await d.getAll('weighLogs'),
      adjustments: await d.getAll('adjustments'),
      settings: (await d.get('settings', MAIN)) ?? null,
      diary: await d.getAll('diary'),
      menu: (await d.get('menus', MAIN)) ?? null,
      customFoods: await d.getAll('customFoods'),
      checkins: await d.getAll('checkins'),
      daily: await d.getAll('daily'),
    }
  },

  /** Replaces all data with the backup contents. */
  async importAll(b: Backup) {
    const d = await db()
    const tx = d.transaction(['profile', 'weighLogs', 'adjustments', 'settings', 'diary', 'menus', 'customFoods', 'checkins', 'daily'], 'readwrite')
    await Promise.all([
      tx.objectStore('profile').clear(),
      tx.objectStore('weighLogs').clear(),
      tx.objectStore('adjustments').clear(),
      tx.objectStore('settings').clear(),
      tx.objectStore('diary').clear(),
      tx.objectStore('menus').clear(),
      tx.objectStore('customFoods').clear(),
      tx.objectStore('checkins').clear(),
      tx.objectStore('daily').clear(),
    ])
    if (b.profile) await tx.objectStore('profile').put(b.profile, MAIN)
    if (b.settings) await tx.objectStore('settings').put(b.settings, MAIN)
    for (const w of b.weighLogs) await tx.objectStore('weighLogs').put(w)
    for (const a of b.adjustments) await tx.objectStore('adjustments').put(a)
    for (const e of b.diary) await tx.objectStore('diary').put(e)
    if (b.menu) await tx.objectStore('menus').put(b.menu, MAIN)
    for (const f of b.customFoods) await tx.objectStore('customFoods').put(f)
    for (const c of b.checkins) await tx.objectStore('checkins').put(c)
    for (const l of b.daily) await tx.objectStore('daily').put(l)
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
  if (![1, 2, 3, 4].includes(o.version as number)) fail('desteklenmeyen sürüm')
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
  const customFoods = Array.isArray(o.customFoods)
    ? (o.customFoods as unknown[]).map((x) => {
        const f = x as Food
        const ok = f && typeof f.id === 'string' && (f.id.startsWith('pk-') || f.id.startsWith('ev-')) && typeof f.name === 'string' &&
          [f.kcal, f.protein, f.carb, f.fat].every((n) => typeof n === 'number' && Number.isFinite(n))
        if (!ok) fail('hatalı paketli ürün kaydı')
        return f
      })
    : []
  const checkins = Array.isArray(o.checkins)
    ? (o.checkins as unknown[]).map((x) => {
        const c = x as CheckIn
        if (!c || typeof c.id !== 'string' || !DATE_RE.test(c.date) || typeof c.hunger !== 'number') fail('hatalı görüşme kaydı')
        return { ...c, difficulties: Array.isArray(c.difficulties) ? c.difficulties : [] }
      })
    : []
  const daily = Array.isArray(o.daily)
    ? (o.daily as unknown[]).map((x) => {
        const l = x as DailyLog
        if (!l || !DATE_RE.test(l.date) || typeof l.water !== 'number') fail('hatalı günlük takip kaydı')
        return {
          date: l.date,
          water: l.water,
          habits: Array.isArray(l.habits) ? l.habits : [],
          ...(typeof l.steps === 'number' ? { steps: l.steps } : {}),
          ...(typeof l.workout === 'boolean' ? { workout: l.workout } : {}),
        }
      })
    : []
  return {
    app: 'diyetbot',
    version: 4,
    exportedAt: typeof o.exportedAt === 'string' ? o.exportedAt : '',
    profile,
    weighLogs,
    adjustments,
    settings: (o.settings as Settings | null) ?? null,
    diary,
    menu,
    customFoods,
    checkins,
    daily,
  }
}
