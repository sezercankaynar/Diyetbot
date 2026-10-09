import type {
  ActivityMultiplier, AnimalFoods, EatingOut, Equipment, Experience, Goal, HealthFlags,
  HungerTime, Level3, MealsPerDay, MealStyle, Sex, TrainingDays, WeeklyRate,
} from '@/engine'

type Opt<T> = { value: T; label: string }[]

export const SEX: Opt<Sex> = [{ value: 'f', label: 'Kadın' }, { value: 'm', label: 'Erkek' }]

export const ACTIVITY: { value: ActivityMultiplier; label: string; hint: string }[] = [
  { value: 1.2, label: '1,2', hint: 'Masa başı, çok az hareket' },
  { value: 1.375, label: '1,375', hint: 'Hafif aktif (günlük yürüyüş)' },
  { value: 1.55, label: '1,55', hint: 'Orta aktif (ayakta iş)' },
  { value: 1.725, label: '1,725', hint: 'Çok aktif (fiziksel iş)' },
]

export const GOAL: Opt<Goal> = [
  { value: 'lose', label: 'Yağ kaybı' },
  { value: 'recomp', label: 'Rekompozisyon' },
  { value: 'maintain', label: 'Koruma' },
  { value: 'gain', label: 'Kas/kilo alma' },
]

export const RATE: Opt<WeeklyRate> = [
  { value: 0.25, label: '%0,25' },
  { value: 0.5, label: '%0,5' },
  { value: 0.75, label: '%0,75' },
]

export const DAYS: Opt<TrainingDays> = ([2, 3, 4, 5, 6] as const).map((d) => ({ value: d, label: String(d) }))

export const EXPERIENCE: Opt<Experience> = [
  { value: 'new', label: 'Yeni (0–6 ay)' },
  { value: 'mid', label: 'Orta (6 ay–2 yıl)' },
  { value: 'adv', label: 'İleri (2 yıl+)' },
]

export const EQUIPMENT: Opt<Equipment> = [
  { value: 'gym', label: 'Spor salonu' },
  { value: 'home', label: 'Ev (dambıl/lastik)' },
]

export const ANIMAL: Opt<AnimalFoods> = [
  { value: 'all', label: 'Hepsi' },
  { value: 'pescatarian', label: 'Pesketaryen' },
  { value: 'vegetarian', label: 'Vejetaryen' },
  { value: 'vegan', label: 'Vegan' },
]

export const LEVEL: Opt<Level3> = [
  { value: 'high', label: 'Yüksek' },
  { value: 'mid', label: 'Orta' },
  { value: 'low', label: 'Düşük' },
]

export const COOKING: Opt<Level3> = [
  { value: 'low', label: 'Az' },
  { value: 'mid', label: 'Orta' },
  { value: 'high', label: 'Çok' },
]

export const YESNO: Opt<boolean> = [{ value: true, label: 'Evet' }, { value: false, label: 'Hayır' }]

export const MEALS: Opt<MealsPerDay> = [
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4+' },
]

export const EATING_OUT: Opt<EatingOut> = [
  { value: 'rare', label: 'Nadiren' },
  { value: 'some', label: 'Bazen' },
  { value: 'often', label: 'Sık' },
]

export const HUNGER: Opt<HungerTime> = [
  { value: 'evening', label: 'Akşam' },
  { value: 'allday', label: 'Gün boyu' },
  { value: 'stable', label: 'Dengeli' },
]

export const HEALTH: { key: keyof HealthFlags; label: string }[] = [
  { key: 'hypertension', label: 'Yüksek tansiyon' },
  { key: 'insulinResistance', label: 'İnsülin direnci / prediyabet' },
  { key: 'highLdl', label: 'Yüksek LDL kolesterol' },
  { key: 'diabetesMeds', label: 'Diyabet ilacı veya insülin kullanıyorum' },
  { key: 'kidneyLiver', label: 'Böbrek veya karaciğer hastalığı' },
  { key: 'pregnant', label: 'Gebelik / emzirme' },
  { key: 'eatingDisorder', label: 'Yeme bozukluğu öyküsü' },
]

export const fmt = (n: number, digits = 0): string =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits })

export const MEAL_STYLE: Opt<MealStyle> = [
  { value: 'light', label: 'Hafif' },
  { value: 'normal', label: 'Normal' },
  { value: 'hearty', label: 'Doyurucu' },
]
