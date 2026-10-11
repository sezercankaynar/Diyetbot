// Daily steps from Health Connect (Android). Read-only, steps only; nothing leaves the phone.
import { Capacitor } from '@capacitor/core'

export type StepsResult = { ok: true; days: Record<string, number> } | { ok: false; reason: 'web' | 'unavailable' | 'denied' | 'error' }

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const stepsSupported = (): boolean => Capacitor.getPlatform() === 'android'

/** Steps per day for the last `days` days (today included). Asks for permission the first time. */
export async function readSteps(days = 7, ask = true): Promise<StepsResult> {
  if (!stepsSupported()) return { ok: false, reason: 'web' }
  try {
    const { Health } = await import('@capgo/capacitor-health')
    const av = await Health.isAvailable()
    if (!av.available) return { ok: false, reason: 'unavailable' }
    const status = ask
      ? await Health.requestAuthorization({ read: ['steps'], write: [] })
      : await Health.checkAuthorization({ read: ['steps'], write: [] })
    if (!status.readAuthorized.includes('steps')) return { ok: false, reason: 'denied' }
    const end = new Date()
    const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - (days - 1))
    const r = await Health.queryAggregated({ dataType: 'steps', startDate: start.toISOString(), endDate: end.toISOString(), bucket: 'day', aggregation: 'sum' })
    const out: Record<string, number> = {}
    for (const s of r.samples) out[ymd(new Date(s.startDate))] = Math.round(s.value)
    return { ok: true, days: out }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

export async function openHealthConnect(): Promise<void> {
  if (!stepsSupported()) return
  const { Health } = await import('@capgo/capacitor-health')
  await Health.openHealthConnectSettings()
}
