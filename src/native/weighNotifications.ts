// Weigh-in reminders: repeating weekly notifications on the chosen weekdays (Android).
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { ScheduleResult } from './waterNotifications'

const FIRST_ID = 8000

/** `days`: 1 = Monday … 7 = Sunday; `time`: "HH:MM". Empty days → reminders off. */
export async function scheduleWeighNotifications(days: number[], time: string): Promise<ScheduleResult> {
  if (!Capacitor.isNativePlatform()) return 'web'
  const pending = await LocalNotifications.getPending()
  const ours = pending.notifications.filter((n) => n.id >= FIRST_ID && n.id < FIRST_ID + 7).map((n) => ({ id: n.id }))
  if (ours.length) await LocalNotifications.cancel({ notifications: ours })
  if (!days.length) return 'ok'
  let perm = await LocalNotifications.checkPermissions()
  if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions()
  if (perm.display !== 'granted') return 'denied'
  const [hour, minute] = time.split(':').map(Number)
  await LocalNotifications.schedule({
    notifications: days.map((d) => ({
      id: FIRST_ID + d - 1,
      title: '⚖️ Tartılma günü',
      body: 'Sabah, tuvaletten sonra, aç karnına tartıl ve İlerleme ekranına yaz.',
      // Capacitor weekdays: 1 = Sunday … 7 = Saturday.
      schedule: { on: { weekday: (d % 7) + 1, hour, minute }, allowWhileIdle: true },
      isExactNotification: false,
      smallIcon: 'ic_stat_water',
    })),
  })
  return 'ok'
}
