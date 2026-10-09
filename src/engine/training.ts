import type { Equipment, Exercise, Profile, TrainingDay, TrainingPlan } from './types'

type Slot =
  | 'squat' | 'hinge' | 'hpush' | 'vpush' | 'hpull' | 'vpull' | 'lunge'
  | 'legcurl' | 'calf' | 'core' | 'biceps' | 'triceps' | 'lateral' | 'chestfly'

const EX: Record<Slot, Record<Equipment, string>> = {
  squat: { gym: 'Back squat', home: 'Goblet squat (dambıl)' },
  hinge: { gym: 'Romanian deadlift (halter)', home: 'Romanian deadlift (dambıl)' },
  hpush: { gym: 'Bench press', home: 'Şınav / dambıl floor press' },
  vpush: { gym: 'Overhead press', home: 'Dambıl omuz press' },
  hpull: { gym: 'Kablolu / halter row', home: 'Tek kol dambıl row' },
  vpull: { gym: 'Lat pulldown / barfiks', home: 'Lastikli pulldown / barfiks' },
  lunge: { gym: 'Bulgarian split squat', home: 'Bulgarian split squat (dambıl)' },
  legcurl: { gym: 'Leg curl makinesi', home: 'Lastikli leg curl / kalça köprüsü' },
  calf: { gym: 'Calf raise makinesi', home: 'Tek ayak calf raise' },
  core: { gym: 'Kablolu crunch / plank', home: 'Plank / dead bug' },
  biceps: { gym: 'Biceps curl (kablo)', home: 'Dambıl / lastik biceps curl' },
  triceps: { gym: 'Triceps pushdown', home: 'Lastikli triceps extension' },
  lateral: { gym: 'Lateral raise (kablo)', home: 'Dambıl / lastik lateral raise' },
  chestfly: { gym: 'Cable fly / pec deck', home: 'Lastikli fly' },
}

const TEMPLATES: Record<string, Slot[]> = {
  'Tüm vücut A': ['squat', 'hpush', 'hpull', 'legcurl', 'core'],
  'Tüm vücut B': ['hinge', 'vpush', 'vpull', 'lunge', 'calf'],
  'Tüm vücut C': ['lunge', 'hpush', 'vpull', 'hinge', 'lateral'],
  'Üst vücut': ['hpush', 'hpull', 'vpush', 'vpull', 'biceps', 'triceps'],
  'Alt vücut': ['squat', 'hinge', 'lunge', 'legcurl', 'calf', 'core'],
  İtiş: ['hpush', 'vpush', 'chestfly', 'lateral', 'triceps'],
  Çekiş: ['vpull', 'hpull', 'hinge', 'biceps', 'core'],
  Bacak: ['squat', 'lunge', 'legcurl', 'calf', 'core'],
}

export function splitFor(days: number): { split: string; days: string[] } {
  switch (days) {
    case 2:
      return { split: 'Tüm vücut A/B', days: ['Tüm vücut A', 'Tüm vücut B'] }
    case 3:
      return { split: 'Tüm vücut A/B/C', days: ['Tüm vücut A', 'Tüm vücut B', 'Tüm vücut C'] }
    case 4:
      return { split: 'Üst/Alt ×2', days: ['Üst vücut', 'Alt vücut', 'Üst vücut', 'Alt vücut'] }
    case 5:
      return { split: 'Üst, Alt, İtiş, Çekiş, Bacak', days: ['Üst vücut', 'Alt vücut', 'İtiş', 'Çekiş', 'Bacak'] }
    default:
      return { split: 'İtiş/Çekiş/Bacak ×2', days: ['İtiş', 'Çekiş', 'Bacak', 'İtiş', 'Çekiş', 'Bacak'] }
  }
}

export function generateTraining(p: Profile): TrainingPlan {
  const { split, days } = splitFor(p.trainingDays)
  const sets = p.experience === 'new' ? '3' : '3–4'
  const reps = '6–12'
  const trainingDays: TrainingDay[] = days.map((name, i) => ({
    name: `${i + 1}. gün – ${name}`,
    exercises: TEMPLATES[name].map<Exercise>((slot) => ({ name: EX[slot][p.equipment], sets, reps, slot })),
  }))

  const cardio =
    p.goal === 'lose'
      ? 'Haftada 2–3 × 25–35 dk zone 2 (konuşabilecek tempoda)'
      : p.goal === 'gain'
        ? 'Haftada 1–2 × 20 dk hafif kardiyo'
        : 'Haftada 2 × 25–30 dk zone 2'

  return {
    split,
    days: trainingDays,
    progression: [
      `Her egzersiz ${sets} set × ${reps} tekrar`,
      'Tükenişe 1–3 tekrar kala bırakın (RIR 1–3)',
      'Çift progresyon: tüm setlerde 12 tekrara ulaşınca ağırlığı artırın ve 6–8 tekrara dönün',
    ],
    cardio,
    steps: p.goal === 'lose' ? 'Günde 8.000–10.000 adım' : 'Günde 7.000–9.000 adım',
    sleep: 'Her gece 7–9 saat, mümkün olduğunca aynı saatte',
  }
}

// ── Weekly schedule & steps ────────────────────────────────

export type DayType = 'strength' | 'cardio' | 'walk' | 'rest'
export interface ScheduleDay {
  /** 0 = Monday … 6 = Sunday */
  weekday: number
  type: DayType
  title: string
  detail: string
  /** Index into TrainingPlan.days for strength days. */
  workout?: number
  /** Strength day that also gets a short cardio finisher. */
  plusCardio?: boolean
}

const STRENGTH_DAYS: Record<number, number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 3, 4, 5],
}

export function cardioSessions(goal: Profile['goal']): number {
  return goal === 'lose' ? 3 : goal === 'gain' ? 1 : 2
}

export function stepTarget(goal: Profile['goal']): number {
  return goal === 'lose' ? 9000 : 8000
}

/**
 * Which day is what: strength days spread through the week, cardio on free days
 * (or as a finisher after strength when there are none), one full rest day,
 * and easy walks on the others.
 */
export function weekSchedule(p: Pick<Profile, 'trainingDays' | 'goal'>, plan: TrainingPlan): ScheduleDay[] {
  const strength = STRENGTH_DAYS[p.trainingDays] ?? STRENGTH_DAYS[3]
  const days: ScheduleDay[] = Array.from({ length: 7 }, (_, weekday) => ({ weekday, type: 'walk' as DayType, title: '', detail: '' }))
  strength.forEach((wd, i) => {
    const w = plan.days[i]
    days[wd] = { weekday: wd, type: 'strength', title: w ? w.name.replace(/^\d+\. gün – /, '') : 'Ağırlık', detail: 'Ağırlık antrenmanı', workout: i }
  })
  // Sunday is the rest day unless it is a training day; then the first free day.
  const free = days.filter((d) => d.type !== 'strength').map((d) => d.weekday)
  const restDay = free.includes(6) ? 6 : free.at(-1)
  let cardioLeft = cardioSessions(p.goal)
  for (const wd of free) {
    if (wd === restDay || cardioLeft === 0) continue
    days[wd] = { weekday: wd, type: 'cardio', title: 'Kardiyo', detail: p.goal === 'gain' ? '20 dk hafif tempo' : '25–35 dk zone 2 (tempolu yürüyüş, bisiklet, yüzme)' }
    cardioLeft--
  }
  // Not enough free days: add short cardio after strength sessions.
  for (const d of days) {
    if (cardioLeft === 0) break
    if (d.type === 'strength') {
      d.plusCardio = true
      d.detail = 'Ağırlık + 15–20 dk zone 2 kardiyo'
      cardioLeft--
    }
  }
  for (const d of days) {
    if (d.weekday === restDay && d.type !== 'strength') Object.assign(d, { type: 'rest', title: 'Dinlenme', detail: 'Tam dinlenme; hafif esneme ve günlük adımlar yeterli' })
    else if (d.type === 'walk') Object.assign(d, { title: 'Aktif dinlenme', detail: '30–45 dk yürüyüş, hareketli kal' })
  }
  return days
}
