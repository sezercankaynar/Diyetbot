import { defaultProfile } from '../defaults'
import type { HealthFlags, Profile, WeighIn } from '../types'

export function profile(over: Partial<Omit<Profile, 'health'>> & { health?: Partial<HealthFlags> } = {}): Profile {
  const base = defaultProfile()
  const { health, ...rest } = over
  return { ...base, ...rest, health: { ...base.health, ...health } }
}

/** `days` daily logs starting at 2026-01-01, changing linearly by `perWeek` kg/week. */
export function linearLogs(start: number, perWeek: number, days = 14): WeighIn[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.UTC(2026, 0, 1 + i))
    return { date: d.toISOString().slice(0, 10), kg: start + (perWeek * i) / 7 }
  })
}
