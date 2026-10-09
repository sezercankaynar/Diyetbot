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
    exercises: TEMPLATES[name].map<Exercise>((slot) => ({ name: EX[slot][p.equipment], sets, reps })),
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
