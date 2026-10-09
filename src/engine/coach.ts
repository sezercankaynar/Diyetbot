// Close follow-up ("diyetisyen takibi"): weekly check-ins, body measurements,
// habits and water, and rule-based feedback. Pure functions only.
import { dayIndex } from './tracking'
import type { Totals } from './menu'
import type { Goal, Sex } from './types'

// ── Body measurements ──────────────────────────────────────

/**
 * U.S. Navy circumference method (Hodgdon & Beckett, 1984), metric form.
 * Returns body-fat % or null when the inputs can't give a valid value.
 */
export function navyBodyFat(
  sex: Sex, heightCm: number, neckCm: number, waistCm: number, hipCm?: number,
): number | null {
  if (!(heightCm > 0 && neckCm > 0 && waistCm > 0)) return null
  let bf: number
  if (sex === 'm') {
    if (waistCm - neckCm <= 0) return null
    bf = 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450
  } else {
    if (!hipCm || waistCm + hipCm - neckCm <= 0) return null
    bf = 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.221 * Math.log10(heightCm)) - 450
  }
  if (!Number.isFinite(bf) || bf < 2 || bf > 70) return null
  return Math.round(bf * 10) / 10
}

// ── Check-ins ──────────────────────────────────────────────

export type Difficulty =
  | 'aksam-atistirma' | 'hafta-sonu' | 'disarida' | 'tatli' | 'zaman' | 'motivasyon' | 'aclik' | 'stres'

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  'aksam-atistirma': 'Akşam atıştırmaları',
  'hafta-sonu': 'Hafta sonu kontrolü',
  disarida: 'Dışarıda yemek',
  tatli: 'Tatlı isteği',
  zaman: 'Yemek hazırlamaya vakit yok',
  motivasyon: 'Motivasyon düşüklüğü',
  aclik: 'Sürekli açlık',
  stres: 'Stres / duygusal yeme',
}

/** Weekly self-report, like a dietitian's follow-up questions. Scales are 1 (bad) – 5 (good) except hunger. */
export interface CheckIn {
  id: string
  date: string
  waistCm?: number
  hipCm?: number
  neckCm?: number
  /** 1 = not hungry at all, 5 = hungry all the time. */
  hunger: number
  energy: number
  sleep: number
  /** Self-rated plan adherence, %. */
  adherence: number
  difficulties: Difficulty[]
  note?: string
}

export interface CoachContext {
  sex: Sex
  heightCm: number
  goal: Goal
  /** Weekly weight change kg (negative = loss) when known. */
  weeklyRate?: number
  targetRate?: number
  kcalTarget: number
  proteinTarget: number
  /** Diary days of the last 7 with at least one entry. */
  daysLogged: number
  /** Average daily intake over logged days. */
  avg?: Totals
  /** 0–1 share of ticked habits over the last 7 days (undefined if none chosen). */
  habitRate?: number
  /** 0–1 share of water target reached (average) over the last 7 days. */
  waterRate?: number
}

export interface Feedback {
  wins: string[]
  focus: string[]
  tips: string[]
  bodyFat?: number | null
  waistChange?: number
}

const TIPS: Record<Difficulty, string> = {
  'aksam-atistirma': 'Akşam için planlı bir gece öğünü ayır (yoğurt, lor, kefir) ve yemekten sonra mutfağı "kapat": diş fırçala, bitki çayı iç.',
  'hafta-sonu': 'Hafta sonunu önceden planla: bir öğünü serbest bırak, diğer öğünleri proteinli ve sebzeli tut; alkol ve atıştırmalığı sınırla.',
  disarida: '"Dışarıda yiyorum" bölümünden mekâna göre en iyi seçimi önceden belirle; ekmek/pilav/patatesten birini seç.',
  tatli: 'Tatlıyı yasaklama, planla: haftada 2–3 kez 150 kcal\'lik porsiyon. Kriz anında "Tatlı krizi" adımlarını uygula.',
  zaman: 'Pazar günü 1 saat ayır: 2 ana yemek + haşlanmış yumurta + doğranmış sebze hazırla. Menüde "az pişirme" seçeneğini kullan.',
  motivasyon: 'Tartı dışı başarılara bak (bel ölçüsü, enerji, kıyafetler). Haftaya tek ve küçük bir hedef koy.',
  aclik: 'Her öğüne protein (en az 25–30 g) ve bol sebze ekle; su iç. Açlık sürerse günlük açığı küçültmeyi düşün.',
  stres: 'Yemekten önce 5 dakika dur: aç mıyım, yoksa stresli mi? Yürüyüş, nefes egzersizi veya biriyle konuşmak gibi bir alternatif belirle.',
}

/** Rule-based weekly feedback. The numbers come from the engine; this only interprets them. */
export function evaluateCheckIn(c: CheckIn, ctx: CoachContext, previous?: CheckIn): Feedback {
  const wins: string[] = []
  // What the person reports comes first; what we infer from the logs second.
  const selfFocus: string[] = []
  const focus: string[] = []
  const tips: string[] = []

  // Measurements
  let waistChange: number | undefined
  if (c.waistCm && previous?.waistCm) {
    waistChange = Math.round((c.waistCm - previous.waistCm) * 10) / 10
    if (waistChange <= -0.5) wins.push(`Bel ölçün ${Math.abs(waistChange).toLocaleString('tr-TR')} cm azaldı.`)
    if (waistChange >= 1 && ctx.goal !== 'gain') focus.push('Bel ölçün arttı; bu hafta kalori ve akşam atıştırmalarına dikkat et.')
  }
  const bodyFat = c.neckCm && c.waistCm ? navyBodyFat(ctx.sex, ctx.heightCm, c.neckCm, c.waistCm, c.hipCm) : undefined

  // Weight trend vs target
  if (ctx.weeklyRate !== undefined && ctx.targetRate !== undefined) {
    if (ctx.goal === 'lose' && ctx.weeklyRate < 0 && -ctx.weeklyRate >= -ctx.targetRate * 0.5) {
      wins.push(`Haftalık ortalama kilon ${Math.abs(ctx.weeklyRate).toLocaleString('tr-TR')} kg azaldı.`)
    }
    if (ctx.goal === 'gain' && ctx.weeklyRate > 0.05) wins.push('Kilo alma hedefinde ilerliyorsun.')
  }

  // Logging & intake
  if (ctx.daysLogged >= 5) wins.push(`Son 7 günün ${ctx.daysLogged}'inde yediklerini kaydettin.`)
  else focus.push('Yediklerini haftada en az 5 gün kaydet; değerlendirme ancak böyle doğru olur.')
  if (ctx.avg && ctx.daysLogged >= 3) {
    const pRatio = ctx.avg.protein / ctx.proteinTarget
    if (pRatio >= 0.9) wins.push('Protein hedefini büyük ölçüde tutturdun.')
    else focus.push(`Protein ortalaman ${Math.round(ctx.avg.protein)} g (hedef ${ctx.proteinTarget} g). Her öğüne bir protein kaynağı ekle.`)
    const kRatio = ctx.avg.kcal / ctx.kcalTarget
    if (kRatio > 1.1) focus.push('Kayıtlı günlerde kalori hedefinin %10\'undan fazla üzerindesin; porsiyonlara ve içeceklere bak.')
    if (kRatio < 0.75 && ctx.goal !== 'gain') focus.push('Kalori hedefinin çok altında kalıyorsun; aşırı kısıtlama açlığı ve kas kaybını artırır.')
  }

  // Habits & water
  if (ctx.habitRate !== undefined) {
    if (ctx.habitRate >= 0.7) wins.push(`Alışkanlık hedeflerinin %${Math.round(ctx.habitRate * 100)}'ini tamamladın.`)
    else if (ctx.habitRate < 0.4) focus.push('Alışkanlık hedeflerini zorlanıyorsan teke indir; küçük ama her gün.')
  }
  if (ctx.waterRate !== undefined && ctx.waterRate < 0.6) focus.push('Su hedefinin gerisindesin; yanında şişe taşı, her öğünle bir bardak iç.')

  // Self-report
  if (c.hunger >= 4) {
    selfFocus.push('Açlık yüksek: protein ve lifi artır, öğün saatlerini düzenle.')
    if (ctx.goal === 'lose') tips.push('Açlık 2 haftadan uzun sürerse "Takip" bölümünde günlük kaloriyi 100–150 kcal artırmayı düşün; sürdürülebilirlik hızdan önemlidir.')
  }
  if (c.sleep <= 2) selfFocus.push('Uyku kalitesi düşük: yatma saatini sabitle, akşam kafeini ve ekranı azalt. Kötü uyku iştahı artırır.')
  if (c.energy <= 2) tips.push('Enerjin düşük: kahvaltı/öğle öğününe karbonhidrat ekle, antrenman günlerinde öğünü antrenmana yakın planla.')
  if (c.adherence >= 80) wins.push(`Plana uyumun %${c.adherence}; harika gidiyorsun.`)
  else if (c.adherence < 50) selfFocus.push('Plana uyum düşük: menüyü basitleştir (Profil → yemek pişirme süresi "Az"), sadece bir hedefe odaklan.')

  for (const d of c.difficulties) tips.push(TIPS[d])

  return { wins, focus: [...selfFocus, ...focus].slice(0, 3), tips, bodyFat, waistChange }
}

/** Days until the next weekly check-in is due (0 = due now). */
export function checkInDue(last: string | undefined, today: string): number {
  if (!last) return 0
  return Math.max(0, 7 - (dayIndex(today) - dayIndex(last)))
}

// ── Habits & water ─────────────────────────────────────────

export interface Habit {
  id: string
  label: string
}

export const HABITS: Habit[] = [
  { id: 'protein', label: 'Her öğünde bir protein kaynağı' },
  { id: 'sebze', label: 'Günde en az 2 öğünde sebze/salata' },
  { id: 'adim', label: 'Adım hedefini tamamla' },
  { id: 'gece', label: 'Akşam yemeğinden sonra plansız atıştırma yok' },
  { id: 'yavas', label: 'Yavaş ye (öğün en az 15–20 dakika)' },
  { id: 'sekerli-icecek', label: 'Şekerli içecek yok' },
  { id: 'uyku', label: '7+ saat uyku' },
  { id: 'kayit', label: 'Yediklerimin hepsini kaydettim' },
]

export interface DailyLog {
  date: string
  water: number
  habits: string[]
  /** Steps walked (entered by the user). */
  steps?: number
  /** The planned workout/cardio was done. */
  workout?: boolean
}

export const GLASS_ML = 250

export function waterGlassesTarget(waterMl: number): number {
  return Math.max(6, Math.round(waterMl / GLASS_ML))
}

/** Share of chosen habits ticked over the given days (undefined if none chosen). */
export function habitRate(logs: DailyLog[], active: string[], days: string[]): number | undefined {
  if (!active.length || !days.length) return undefined
  let done = 0
  for (const d of days) {
    const log = logs.find((l) => l.date === d)
    done += log ? log.habits.filter((h) => active.includes(h)).length : 0
  }
  return done / (active.length * days.length)
}

export function waterRate(logs: DailyLog[], target: number, days: string[]): number | undefined {
  if (!days.length || target <= 0) return undefined
  const sum = days.reduce((a, d) => a + Math.min(1, (logs.find((l) => l.date === d)?.water ?? 0) / target), 0)
  return sum / days.length
}

// ── End-of-day review ──────────────────────────────────────

export interface DayReview {
  tone: 'good' | 'ok' | 'warn'
  lines: string[]
}

export function dayReview(t: Totals, kcalTarget: number, proteinTarget: number, water: number, waterTarget: number): DayReview {
  const lines: string[] = []
  let score = 0
  if (t.kcal === 0) return { tone: 'ok', lines: ['Bugün henüz bir şey kaydetmedin. Yediğin öğünleri işaretle.'] }
  const k = t.kcal / kcalTarget
  if (k >= 0.9 && k <= 1.05) { lines.push('Kalori hedefin tam yerinde.'); score++ }
  else if (k < 0.9) lines.push(`Hedefe ${Math.round(kcalTarget - t.kcal)} kcal var; aç kalma, proteinli bir öğünle tamamla.`)
  else { lines.push(`Hedefi ${Math.round(t.kcal - kcalTarget)} kcal aştın; sorun değil, yarın plana dön.`); score-- }
  if (t.protein >= proteinTarget * 0.9) { lines.push('Protein hedefi tamam 💪'); score++ }
  else lines.push(`Proteine ${Math.round(proteinTarget - t.protein)} g daha ihtiyacın var (ör. 200 g süzme yoğurt ≈ 20 g).`)
  if (water >= waterTarget) { lines.push('Su hedefi tamam.'); score++ }
  else lines.push(`${waterTarget - water} bardak daha su iç.`)
  return { tone: score >= 2 ? 'good' : score >= 0 ? 'ok' : 'warn', lines }
}

/** The n dates ending with `today` (oldest first). */
export function lastDays(today: string, n: number): string[] {
  const end = dayIndex(today)
  return Array.from({ length: n }, (_, i) => new Date((end - n + 1 + i) * 86_400_000).toISOString().slice(0, 10))
}

/** Logged days and average intake over the given dates (only days with entries count). */
export function intakeStats(perDay: Record<string, Totals>, days: string[]): { daysLogged: number; avg?: Totals } {
  const logged = days.map((d) => perDay[d]).filter((t): t is Totals => !!t && t.kcal > 0)
  if (!logged.length) return { daysLogged: 0 }
  const sum = logged.reduce((a, t) => ({ kcal: a.kcal + t.kcal, protein: a.protein + t.protein, carb: a.carb + t.carb, fat: a.fat + t.fat }))
  const n = logged.length
  return { daysLogged: n, avg: { kcal: sum.kcal / n, protein: sum.protein / n, carb: sum.carb / n, fat: sum.fat / n } }
}
