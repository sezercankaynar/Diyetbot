// Two photos per exercise (start and end position), shown in turn so the movement can be seen.
// Source: Free Exercise DB (github.com/yuhonas/free-exercise-db), public domain (Unlicense).
// Files: public/exercises/<id>_0.webp and _1.webp (resized to 480 px).
import type { ExerciseSlot } from './exercises'

type Equipment = 'gym' | 'home'

const IMAGES: Record<ExerciseSlot, Record<Equipment, string>> = {
  squat: { gym: 'Barbell_Squat', home: 'Goblet_Squat' },
  hinge: { gym: 'Romanian_Deadlift', home: 'Stiff-Legged_Dumbbell_Deadlift' },
  hpush: { gym: 'Barbell_Bench_Press_-_Medium_Grip', home: 'Pushups' },
  vpush: { gym: 'Standing_Military_Press', home: 'Dumbbell_Shoulder_Press' },
  hpull: { gym: 'Seated_Cable_Rows', home: 'One-Arm_Dumbbell_Row' },
  vpull: { gym: 'Wide-Grip_Lat_Pulldown', home: 'Pullups' },
  lunge: { gym: 'Split_Squat_with_Dumbbells', home: 'Split_Squat_with_Dumbbells' },
  legcurl: { gym: 'Lying_Leg_Curls', home: 'Butt_Lift_Bridge' },
  calf: { gym: 'Standing_Calf_Raises', home: 'Calf_Raise_On_A_Dumbbell' },
  core: { gym: 'Plank', home: 'Dead_Bug' },
  biceps: { gym: 'Standing_Biceps_Cable_Curl', home: 'Dumbbell_Bicep_Curl' },
  triceps: { gym: 'Triceps_Pushdown', home: 'Standing_Dumbbell_Triceps_Extension' },
  lateral: { gym: 'Cable_Seated_Lateral_Raise', home: 'Side_Lateral_Raise' },
  chestfly: { gym: 'Cable_Crossover', home: 'Dumbbell_Flyes' },
}

/** Notes where the photo shows a close variant of the exercise in the plan. */
const NOTE: Partial<Record<`${ExerciseSlot}-${Equipment}`, string>> = {
  'lunge-gym': 'Fotoğrafta arka ayak yerde (split squat); Bulgarian\'da arka ayağın üstü bir sehpada durur, hareket aynı.',
  'lunge-home': 'Fotoğrafta arka ayak yerde (split squat); Bulgarian\'da arka ayağın üstü bir sandalyede durur, hareket aynı.',
  'legcurl-home': 'Fotoğraf: kalça köprüsü. Lastikli leg curl yapıyorsan yüzüstü yatıp lastiği topuğunla kalçana doğru çek.',
  'triceps-home': 'Fotoğrafta dambılla; lastikle de aynı: lastiği ayağının altına bas, ucunu başının arkasından yukarı it.',
  'hpush-home': 'Fotoğraf: şınav. Dambıl floor press\'te sırtüstü yerde yatıp dambılları göğüs hizasından yukarı it.',
  'chestfly-home': 'Fotoğrafta dambılla; lastikle aynı hareketi ayakta, lastiği arkandaki bir yere bağlayarak yap.',
  'core-gym': 'Fotoğraf: plank. Dirsekler omuzların altında, vücut başından topuğuna düz bir çizgi.',
}

export function exerciseImages(slot: ExerciseSlot, equipment: Equipment): { src: [string, string]; note?: string } {
  const id = IMAGES[slot][equipment]
  const base = `${import.meta.env.BASE_URL}exercises/${id}`
  return { src: [`${base}_0.webp`, `${base}_1.webp`], note: NOTE[`${slot}-${equipment}`] }
}
