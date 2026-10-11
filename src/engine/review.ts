// Week in review, plateau explanation and backup reminder: rule-based, from what the user logged.
import { addDays } from './menu'
import { dayIndex, rollingAverage, sortLogs } from './tracking'
import { diaryTotals, type DiaryEntry } from './diary'
import type { DailyLog } from './coach'
import type { Profile, WeighIn } from './types'

export interface WeekSummary {
  from: string
  to: string
  /** Days with anything logged as eaten. */
  loggedDays: number
  avgKcal: number | null
  /** Logged days within ±10 % of the kcal target. */
  onTargetDays: number
  avgProtein: number | null
  waterDays: number
  avgSteps: number | null
  stepDays: number
  workouts: number
  /** Change of the 7-day weight average over the week (kg), when there's data at both ends. */
  weightChange: number | null
  wins: string[]
  focus: string[]
}

export interface SummaryInput {
  today: string
  diary: DiaryEntry[]
  daily: DailyLog[]
  logs: WeighIn[]
  kcalTarget: number
  proteinTarget: number
  waterTarget: number
  stepTarget: number
}

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null)

/** The 7 days before today. */
export function weekSummary(i: SummaryInput): WeekSummary {
  const days = Array.from({ length: 7 }, (_, k) => addDays(i.today, k - 7))
  const logged = days.filter((d) => i.diary.some((e) => e.date === d))
  const totals = logged.map((d) => diaryTotals(i.diary, d))
  const logs = days.map((d) => i.daily.find((l) => l.date === d))
  const steps = logs.map((l) => l?.steps).filter((x): x is number => typeof x === 'number' && x > 0)
  const s: WeekSummary = {
    from: days[0],
    to: days[6],
    loggedDays: logged.length,
    avgKcal: avg(totals.map((t) => t.kcal)),
    onTargetDays: totals.filter((t) => Math.abs(t.kcal - i.kcalTarget) <= i.kcalTarget * 0.1).length,
    avgProtein: avg(totals.map((t) => t.protein)),
    waterDays: logs.filter((l) => (l?.water ?? 0) >= i.waterTarget).length,
    avgSteps: avg(steps),
    stepDays: steps.filter((x) => x >= i.stepTarget).length,
    workouts: logs.filter((l) => l?.workout).length,
    weightChange: weightChange(i.logs, days[6], 7),
    wins: [],
    focus: [],
  }
  if (s.loggedDays >= 6) s.wins.push(`${s.loggedDays}/7 gün yediklerini kaydettin; düzenli kayıt kilo vermenin en güçlü alışkanlıklarından.`)
  if (s.onTargetDays >= 5) s.wins.push(`${s.onTargetDays} gün kalori hedefine yakındın.`)
  if (s.weightChange !== null && s.weightChange < 0) s.wins.push(`Haftalık ortalaman ${Math.abs(s.weightChange).toLocaleString('tr-TR')} kg azaldı.`)
  if (s.workouts >= 2) s.wins.push(`${s.workouts} antrenman yaptın.`)
  if (s.waterDays >= 5) s.wins.push(`${s.waterDays} gün su hedefine ulaştın.`)
  if (s.stepDays >= 4) s.wins.push(`${s.stepDays} gün adım hedefini geçtin.`)

  if (s.loggedDays < 4) s.focus.push('Bu hafta en az 5 gün yediklerini kaydetmeye çalış; kaydedilmeyen günler sonucu görmeyi zorlaştırır.')
  else if (s.avgKcal !== null && s.avgKcal > i.kcalTarget * 1.1) s.focus.push(`Ortalama ${s.avgKcal} kcal yedin, hedefin ${i.kcalTarget}. Porsiyonları menüdeki ölçülere yaklaştır.`)
  if (s.avgProtein !== null && s.loggedDays >= 4 && s.avgProtein < i.proteinTarget * 0.8) s.focus.push(`Protein ortalaman ${s.avgProtein} g (hedef ${i.proteinTarget} g): her öğüne yoğurt, yumurta, et ya da baklagil ekle.`)
  if (s.avgSteps !== null && s.avgSteps < i.stepTarget * 0.75) s.focus.push(`Adım ortalaman ${s.avgSteps.toLocaleString('tr-TR')}; günde 15–20 dakikalık bir yürüyüş farkı kapatır.`)
  if (s.waterDays <= 2 && i.daily.some((l) => l.water > 0)) s.focus.push('Su hedefine çoğu gün ulaşamadın; su hatırlatıcısını aç.')
  s.focus = s.focus.slice(0, 2)
  return s
}

/** Change of the 7-day average from `days` before `to` until `to` (null without data at both ends). */
export function weightChange(logs: WeighIn[], to: string, days: number): number | null {
  const avgs = rollingAverage(logs)
  const end = avgs.filter((a) => a.date <= to).at(-1)
  const start = avgs.filter((a) => dayIndex(a.date) <= dayIndex(to) - days).at(-1)
  if (!end || !start || dayIndex(end.date) - dayIndex(start.date) < days - 2 || dayIndex(to) - dayIndex(end.date) > 3) return null
  return Math.round((end.avg - start.avg) * 10) / 10
}

export interface PlateauAdvice {
  weeks: number
  points: string[]
}

/**
 * Losing weight but the 7-day average hasn't moved for ≥ 2 weeks: explain what's normal and what to
 * check before cutting calories. Null otherwise.
 */
export function plateauAdvice(p: Profile, logs: WeighIn[], diary: DiaryEntry[], daily: DailyLog[], kcalTarget: number, stepGoal: number, today: string): PlateauAdvice | null {
  if (p.goal !== 'lose') return null
  const sorted = sortLogs(logs)
  const last = sorted.at(-1)
  if (!last || dayIndex(today) - dayIndex(last.date) > 7) return null
  const change14 = weightChange(sorted, last.date, 14)
  if (change14 === null || change14 < -0.2) return null
  const change21 = weightChange(sorted, last.date, 21)
  const weeks = change21 !== null && change21 > -0.3 ? 3 : 2
  const days = Array.from({ length: 14 }, (_, k) => addDays(today, k - 14))
  const logged = days.filter((d) => diary.some((e) => e.date === d))
  const avgKcal = avg(logged.map((d) => diaryTotals(diary, d).kcal))
  const steps = days.map((d) => daily.find((l) => l.date === d)?.steps).filter((x): x is number => !!x)
  const avgSteps = avg(steps)

  const points = [
    'Tartı günden güne 1–2 kg oynar: su, tuz, karbonhidrat, bağırsak içeriği' + (p.sex === 'f' ? ' ve adet döngüsü' : '') +
      '. Yağ kaybı bu dalgalanmanın altında sürebilir; bu yüzden tek tartıya değil haftalık ortalamaya bakıyoruz.',
  ]
  if (logged.length < 10) points.push(`Son 14 günün ${logged.length} gününü kaydetmişsin. Kaydedilmeyen günler çoğu zaman planın dışına çıkılan günlerdir; önce 2 hafta eksiksiz kayıt.`)
  else if (avgKcal !== null && avgKcal > kcalTarget * 1.05) points.push(`Kayıtlı günlerde ortalama ${avgKcal} kcal yemişsin (hedef ${kcalTarget}). Porsiyon ve yağ ölçülerine dikkat; göz kararı yağ en sık gizli kaynak.`)
  else points.push('Kayıtların hedefe uygun görünüyor. Gizli kalorileri kontrol et: yemek yağı, içecekler, atıştırmalar, ölçülmeyen porsiyonlar.')
  if (avgSteps !== null && avgSteps < stepGoal * 0.8) points.push(`Adım ortalaman ${avgSteps.toLocaleString('tr-TR')}. Diyet sürdükçe gün içi hareket farkında olmadan azalır; adım hedefine dön.`)
  if (p.sleepHours < 7) points.push('Uykun 7 saatin altında; az uyku açlığı artırır ve kilo vermeyi zorlaştırır.')
  points.push('Kilo verdikçe harcaman da azalır; hedefi küçültmeden önce bu kontrolleri 1–2 hafta uygula. Ortalama yine durursa aşağıdaki haftalık değerlendirmenin önerisini (150 kcal azaltma ya da +2.000 adım) uygula.')
  return { weeks, points }
}

/** Remind to back up when there's data and no backup for 30 days (or never, after a week of use). */
export function backupDue(lastBackupAt: string | undefined, firstUse: string | undefined, today: string): boolean {
  if (lastBackupAt) return dayIndex(today) - dayIndex(lastBackupAt.slice(0, 10)) >= 30
  return !!firstUse && dayIndex(today) - dayIndex(firstUse) >= 7
}
