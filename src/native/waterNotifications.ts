// Water reminders as Android notifications (Capacitor Local Notifications). On the web there are no
// scheduled notifications; the Bugün screen shows an in-app nudge instead.
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

const FIRST_ID = 7000
const MAX = 60
const TEST_ID = FIRST_ID + MAX
const ACTION_TYPE = 'WATER'
/** Own channel: high importance, so reminders pop up on screen (the default channel only lands in the shade). */
const CHANNEL = 'su-hatirlatma'
let listening = false
let channelReady = false

async function ensureChannel() {
  if (channelReady) return
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL, name: 'Su hatırlatıcısı', description: 'Gün içinde su içmeyi hatırlatır',
      importance: 4, visibility: 1, vibration: true, lights: true,
    })
    channelReady = true
  } catch {
    // Older Android: no channels.
  }
}

export type ScheduleResult = 'ok' | 'denied' | 'web'

/** What happened when the reminders were set up, so the screen can say it (never silently). */
export interface WaterStatus {
  result: ScheduleResult | 'error'
  /** Reminders waiting on the phone, and the next one. */
  pending?: number
  next?: string
  /** Delivered on time (exact alarms allowed) or within about an hour (inexact). */
  exact?: boolean
  error?: string
}

async function exactAllowed(): Promise<boolean> {
  try {
    return (await LocalNotifications.checkExactNotificationSetting()).exact_alarm === 'granted'
  } catch {
    return false
  }
}

async function ensureListening(onDrank: () => void) {
  await ensureChannel()
  if (listening) return
  listening = true
  await LocalNotifications.registerActionTypes({
    types: [{ id: ACTION_TYPE, actions: [{ id: 'drank', title: 'İçtim (+1 bardak)' }] }],
  })
  await LocalNotifications.addListener('localNotificationActionPerformed', (a) => {
    if (a.actionId === 'drank' && a.notification.id >= FIRST_ID && a.notification.id <= TEST_ID + 1) onDrank()
  })
}

/** Asks for the notification permission when it hasn't been decided yet. */
async function permitted(): Promise<boolean> {
  let perm = await LocalNotifications.checkPermissions()
  if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions()
  return perm.display === 'granted'
}

/** Replaces all pending water reminders with these times. */
export async function scheduleWaterNotifications(times: Date[], target: number, onDrank: () => void): Promise<WaterStatus> {
  if (!Capacitor.isNativePlatform()) return { result: 'web' }
  try {
    if (times.length && !(await permitted())) {
      await cancelWaterNotifications()
      return { result: 'denied' }
    }
    await cancelWaterNotifications()
    if (!times.length) return { result: 'ok', pending: 0 }
    await ensureListening(onDrank)
    // On time when the phone allows exact alarms; otherwise inexact (Android may delay up to ~1 hour).
    const exact = await exactAllowed()
    await LocalNotifications.schedule({
      notifications: times.slice(0, MAX).map((at, i) => ({
        id: FIRST_ID + i,
        title: '💧 Su vakti',
        body: `Bir bardak su iç. Günlük hedefin ${target} bardak.`,
        schedule: { at, allowWhileIdle: true },
        isExactNotification: exact,
        smallIcon: 'ic_stat_water',
        channelId: CHANNEL,
        actionTypeId: ACTION_TYPE,
      })),
    })
    return { ...(await waterPending()), result: 'ok', exact }
  } catch (e) {
    return { result: 'error', error: e instanceof Error ? e.message : String(e) }
  }
}

/** How many water reminders the phone has waiting, and when the next one is. */
export async function waterPending(): Promise<Pick<WaterStatus, 'pending' | 'next'>> {
  const list = (await LocalNotifications.getPending()).notifications.filter((n) => n.id >= FIRST_ID && n.id < FIRST_ID + MAX)
  const times = list.map((n) => n.schedule?.at).filter((x): x is Date => !!x).map((x) => new Date(x).getTime()).filter((t) => t > Date.now())
  return { pending: list.length, ...(times.length ? { next: new Date(Math.min(...times)).toISOString() } : {}) }
}

/**
 * Test in two steps: a notification shown right now (does the phone display them at all?) and one
 * through a timed alarm in 1 minute (do scheduled reminders fire?).
 */
export async function sendTestWater(onDrank: () => void): Promise<{ result: WaterStatus['result']; error?: string }> {
  if (!Capacitor.isNativePlatform()) return { result: 'web' }
  try {
    if (!(await permitted())) return { result: 'denied' }
    await ensureListening(onDrank)
    const base = { smallIcon: 'ic_stat_water', channelId: CHANNEL, actionTypeId: ACTION_TYPE }
    await LocalNotifications.schedule({
      notifications: [{ ...base, id: TEST_ID, title: '💧 Deneme 1/2: bildirim', body: 'Bunu görüyorsan telefon Diyetbot bildirimlerini gösteriyor.' }],
    })
    await LocalNotifications.schedule({
      notifications: [{
        ...base, id: TEST_ID + 1, title: '💧 Deneme 2/2: zamanlanmış hatırlatma',
        body: 'Bu da geldiyse su hatırlatmaları çalışır. "İçtim" bir bardak ekler.',
        schedule: { at: new Date(Date.now() + 60_000), allowWhileIdle: true }, isExactNotification: false,
      }],
    })
    return { result: 'ok' }
  } catch (e) {
    return { result: 'error', error: e instanceof Error ? e.message : String(e) }
  }
}

/** Opens the phone's "Alarms & reminders" setting, so reminders come on time. */
export async function askExactAlarms(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    return (await LocalNotifications.changeExactNotificationSetting()).exact_alarm === 'granted'
  } catch {
    return false
  }
}

export async function cancelWaterNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  const pending = await LocalNotifications.getPending()
  const ids = pending.notifications.filter((n) => n.id >= FIRST_ID && n.id < FIRST_ID + MAX).map((n) => ({ id: n.id }))
  if (ids.length) await LocalNotifications.cancel({ notifications: ids })
}
