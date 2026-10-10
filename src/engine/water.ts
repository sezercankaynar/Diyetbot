// Water reminders: when to remind, and a gentle in-app nudge when the day falls behind.
// Spreading water over the day (rather than catching up at night) is the usual advice; the app only
// reminds – it never counts a glass the user didn't add.

export interface WaterReminder {
  on: boolean
  /** Minutes between reminders. */
  everyMin: number
  /** First and last reminder of the day, "HH:MM". */
  start: string
  end: string
}

export const DEFAULT_WATER_REMINDER: WaterReminder = { on: false, everyMin: 120, start: '09:00', end: '21:00' }
export const REMINDER_INTERVALS = [60, 90, 120, 180]

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Reminder times of a day, as minutes after midnight. */
export function reminderMinutes(r: WaterReminder): number[] {
  const a = toMin(r.start)
  const b = toMin(r.end)
  if (!(r.everyMin > 0) || b < a) return []
  const out: number[] = []
  for (let t = a; t <= b; t += r.everyMin) out.push(t)
  return out
}

/**
 * Reminders from `now` for the next `days` days (today included). When today's target is already
 * reached, today's remaining reminders are left out.
 */
export function upcomingReminders(r: WaterReminder, now: Date, days: number, todayDone: boolean): Date[] {
  if (!r.on) return []
  const out: Date[] = []
  for (let d = 0; d < days; d++) {
    if (d === 0 && todayDone) continue
    for (const m of reminderMinutes(r)) {
      const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, Math.floor(m / 60), m % 60)
      if (t.getTime() > now.getTime()) out.push(t)
    }
  }
  return out
}

/**
 * In-app nudge: the glasses the day should have by now (spread evenly from start to end) versus
 * what was added, and how long since the last glass. Null when there is nothing to say.
 */
export function waterNudge(r: WaterReminder, now: Date, glasses: number, target: number, lastAt?: string): string | null {
  if (!r.on || glasses >= target) return null
  const m = now.getHours() * 60 + now.getMinutes()
  const a = toMin(r.start)
  const b = toMin(r.end)
  if (m < a || m > b + 60) return null
  const expected = Math.min(target, Math.floor(((m - a) / Math.max(1, b - a)) * target) + 1)
  const since = lastAt ? (now.getTime() - new Date(lastAt).getTime()) / 60000 : Infinity
  const behind = expected - glasses
  if (behind >= 2) return `Su içme zamanı: bu saate kadar yaklaşık ${expected} bardak olmalıydı, şu an ${glasses}. Bir bardak iç.`
  if (since >= r.everyMin && m >= a + 30 && (lastAt || glasses === 0)) {
    return lastAt ? `Son bardaktan bu yana ${Math.floor(since / 60)} saat${since % 60 >= 30 ? ' 30 dk' : ''} geçti. Bir bardak su iç.` : 'Bugün henüz su eklemedin. Bir bardakla başla.'
  }
  return null
}
