import { describe, expect, it } from 'vitest'
import { reminderMinutes, upcomingReminders, waterNudge, type WaterReminder } from '../water'

const R: WaterReminder = { on: true, everyMin: 120, start: '09:00', end: '21:00' }
const at = (h: number, m = 0) => new Date(2026, 9, 10, h, m)

describe('water reminders', () => {
  it('times between start and end', () => {
    expect(reminderMinutes(R).map((m) => m / 60)).toEqual([9, 11, 13, 15, 17, 19, 21])
    expect(reminderMinutes({ ...R, everyMin: 90, end: '12:00' }).map((m) => m / 60)).toEqual([9, 10.5, 12])
    expect(reminderMinutes({ ...R, start: '22:00', end: '08:00' })).toEqual([])
  })
  it('upcoming: only future ones; today skipped when the target is reached; off → none', () => {
    const a = upcomingReminders(R, at(14), 2, false)
    expect(a[0].getHours()).toBe(15)
    expect(a).toHaveLength(4 + 7)
    expect(upcomingReminders(R, at(14), 2, true)).toHaveLength(7)
    expect(upcomingReminders({ ...R, on: false }, at(14), 2, false)).toEqual([])
  })
  it('nudge when behind or long since the last glass, quiet otherwise', () => {
    expect(waterNudge(R, at(15), 1, 10, at(14).toISOString())).toMatch(/olmalıydı/)
    expect(waterNudge(R, at(15), 5, 10, at(12, 30).toISOString())).toMatch(/Son bardaktan/)
    expect(waterNudge(R, at(15), 5, 10, at(14, 30).toISOString())).toBeNull()
    expect(waterNudge(R, at(15), 10, 10)).toBeNull()
    expect(waterNudge(R, at(7), 0, 10)).toBeNull()
    expect(waterNudge({ ...R, on: false }, at(15), 0, 10)).toBeNull()
    expect(waterNudge(R, at(10), 0, 10)).toMatch(/henüz/)
  })
})
