// Water reminders as Android notifications (Capacitor Local Notifications). On the web there are no
// scheduled notifications; the Bugün screen shows an in-app nudge instead.
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

const FIRST_ID = 7000
const MAX = 60
const ACTION_TYPE = 'WATER'
let listening = false

export type ScheduleResult = 'ok' | 'denied' | 'web'

/** Replaces all pending water reminders with these times. */
export async function scheduleWaterNotifications(times: Date[], target: number, onDrank: () => void): Promise<ScheduleResult> {
  if (!Capacitor.isNativePlatform()) return 'web'
  let perm = await LocalNotifications.checkPermissions()
  if (perm.display !== 'granted' && times.length) perm = await LocalNotifications.requestPermissions()
  await cancelWaterNotifications()
  if (!times.length) return 'ok'
  if (perm.display !== 'granted') return 'denied'
  if (!listening) {
    listening = true
    await LocalNotifications.registerActionTypes({
      types: [{ id: ACTION_TYPE, actions: [{ id: 'drank', title: 'İçtim (+1 bardak)' }] }],
    })
    await LocalNotifications.addListener('localNotificationActionPerformed', (a) => {
      if (a.actionId === 'drank' && a.notification.id >= FIRST_ID && a.notification.id < FIRST_ID + MAX) onDrank()
    })
  }
  await LocalNotifications.schedule({
    notifications: times.slice(0, MAX).map((at, i) => ({
      id: FIRST_ID + i,
      title: '💧 Su vakti',
      body: `Bir bardak su iç. Günlük hedefin ${target} bardak.`,
      schedule: { at, allowWhileIdle: true },
      // A reminder doesn't need to the minute; inexact alarms need no extra permission.
      isExactNotification: false,
      smallIcon: 'ic_stat_water',
      actionTypeId: ACTION_TYPE,
    })),
  })
  return 'ok'
}

export async function cancelWaterNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  const pending = await LocalNotifications.getPending()
  const ids = pending.notifications.filter((n) => n.id >= FIRST_ID && n.id < FIRST_ID + MAX).map((n) => ({ id: n.id }))
  if (ids.length) await LocalNotifications.cancel({ notifications: ids })
}
