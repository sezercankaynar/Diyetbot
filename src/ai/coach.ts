// The coach chat: Claude answers as a dietitian-style coach. It sees a short snapshot of the user's
// plan and day (computed by the app) and can call the app's tools; it never computes numbers itself.
import {
  getFood, itemTotals, mealTitle, mealTotals, mealWindow, plateName, slotPlan, sumTotals, type Slot,
} from '@/engine'
import type { useAppStore } from '@/stores/app'
import { runAgent, type AgentResult } from './agent'
import type { AiSettings, ChatMessage } from './gateway'
import { coachTools, type DayContext } from './tools'

type Store = ReturnType<typeof useAppStore>

const GOAL: Record<string, string> = { lose: 'kilo vermek', maintain: 'kiloyu korumak', gain: 'kilo almak', recomp: 'yağ yakıp kas kazanmak' }

/** What the coach knows about the user right now (all numbers from the app). */
export function coachSnapshot(store: Store) {
  const p = store.profile
  const plan = store.plan
  const ctx = store.menuCtx
  const today = store.todayDate
  const entries = store.diary.filter((e) => e.date === today)
  const eaten = sumTotals(entries.map((e) => itemTotals(e.foodId, e.factor)))
  const target = store.dayTarget(today)
  const menuDay = store.menu?.days.find((d) => d.date === today)
  const meals = (ctx ? slotPlan(ctx) : []).map((sp) => {
    const logged = entries.filter((e) => e.menuSlot === sp.slot)
    const item = menuDay?.items.find((i) => i.slot === sp.slot)
    return logged.length
      ? { meal: sp.label, status: 'eaten', foods: logged.map((e) => plateName(getFood(e.foodId)?.name ?? '')), kcal: sumTotals(logged.map((e) => itemTotals(e.foodId, e.factor))).kcal }
      : { meal: sp.label, status: 'not eaten yet', menu_plate: item ? mealTitle(item) : null, kcal: item ? mealTotals(item).kcal : null }
  })
  const extras = entries.filter((e) => !e.menuSlot).map((e) => plateName(getFood(e.foodId)?.name ?? ''))
  const w = store.weekReview
  return {
    now: new Date().toLocaleString('tr-TR', { weekday: 'long', hour: '2-digit', minute: '2-digit' }),
    safety_stop: plan.safety.stop,
    profile: { sex: p.sex === 'm' ? 'erkek' : 'kadın', age: p.age, height_cm: p.heightCm, weight_kg: p.weightKg, goal: GOAL[p.goal] ?? p.goal, training_days_per_week: p.trainingDays },
    ...(plan.safety.stop ? {} : {
      targets_today: { kcal: target, protein_g: plan.macros?.proteinG, carb_g: plan.macros?.carbG, fat_g: plan.macros?.fatG, water_glasses: store.waterTarget },
      diet_style: plan.recommendedDiet?.name,
      today: { eaten, left: { kcal: target - eaten.kcal, protein_g: (plan.macros?.proteinG ?? 0) - eaten.protein }, meals, extras, water_glasses: store.todayLog.water },
      last_7_days: { logged_days: w.loggedDays, avg_kcal: w.avgKcal, days_near_target: w.onTargetDays, avg_protein: w.avgProtein, workouts: w.workouts, avg_steps: w.avgSteps, weight_change_kg: w.weightChange },
    }),
    weigh_ins: store.sortedLogs.slice(-6).map((l) => `${l.date}: ${l.kg} kg`),
  }
}

/**
 * Meals still to come: not logged and not long past (a breakfast not logged by evening was skipped,
 * not "still open"). If every open meal is past, the last one counts.
 */
function comingSlots(store: Store, eaten: Set<Slot>, now = new Date()): Slot[] {
  const ctx = store.menuCtx
  if (!ctx) return []
  const open = slotPlan(ctx).filter((s) => !eaten.has(s.slot))
  const mins = now.getHours() * 60 + now.getMinutes()
  const coming = open.filter((sp) => {
    const end = mealWindow(sp, store.profile.mealTimes).split('–')[1]
    if (!end) return true
    const [h, m] = end.split(':').map(Number)
    return h * 60 + m + 60 >= mins
  })
  return (coming.length ? coming : open.slice(-1)).map((s) => s.slot)
}

export function coachDayContext(store: Store): DayContext {
  const ctx = store.menuCtx
  const today = store.todayDate
  const entries = store.diary.filter((e) => e.date === today)
  const eaten = sumTotals(entries.map((e) => itemTotals(e.foodId, e.factor)))
  const eatenSlots = new Set(entries.filter((e) => e.menuSlot).map((e) => e.menuSlot as Slot))
  const plan = store.plan
  const target = store.dayTarget(today)
  return {
    menuCtx: ctx ? { ...ctx, kcal: target } : null,
    check: plan.energy && plan.macros && plan.recommendedDiet
      ? { kcalTarget: target, proteinTarget: plan.macros.proteinG, eaten, diet: plan.recommendedDiet.id, animalFoods: store.profile.animalFoods, dislikes: store.profile.dislikes }
      : null,
    date: today,
    eaten,
    openSlots: comingSlots(store, eatenSlots),
    avoid: entries.map((e) => e.foodId),
    labels: Object.fromEntries((ctx ? slotPlan(ctx) : []).map((s) => [s.slot, s.label])),
  }
}

function system(snapshot: ReturnType<typeof coachSnapshot>): string {
  return [
    'Sen Diyetbot uygulamasının diyet ve antrenman koçusun. Kullanıcıyla Türkçe, sıcak, yargılamadan ve kısa konuş (genelde 2–6 cümle ya da kısa bir liste).',
    'Kurallar:',
    '- Kalori, protein ve diğer sayıları ASLA kendin hesaplama ya da uydurma. Sayılar ya aşağıdaki özetten ya da araçlardan (search_foods, check_foods, rest_of_day_plates) gelsin. Bir yiyeceğin değerini sorarlarsa search_foods kullan.',
    '- "Ne yesem / akşam ne yiyeyim" gibi sorularda rest_of_day_plates aracını kullan ve oradan 1–2 tabağı öner.',
    '- "Şunu yiyebilir miyim" sorularında yiyeceği search_foods ile bul, check_foods ile değerlendir.',
    '- Kayma olduysa suçlama; telafi için aç kalmayı önerme. Önemli olan haftalık ortalama.',
    '- Tıbbi teşhis koyma, ilaç önerme. Hastalık, gebelik, yeme bozukluğu ya da ciddi belirti söz konusuysa doktora/diyetisyene yönlendir.',
    snapshot.safety_stop ? '- Bu kullanıcı için güvenlik durdurması var: kalori hedefi ya da diyet önerme; bir sağlık profesyoneline yönlendir.' : '',
    '- Uygulamanın özelliklerine yönlendirebilirsin: Bugün ekranındaki "Kalanına göre öneri", "Ara / yiyebilir miyim?", "Tatlı krizi", Menü\'de "Değiştir", Haftalık denge.',
    '- Biçim: düz metin; madde işareti için "• " kullan, başlık ya da tablo kullanma.',
    '',
    'Kullanıcının şu anki durumu (uygulamanın hesapladığı):',
    JSON.stringify(snapshot),
  ].filter(Boolean).join('\n')
}

export async function askCoach(
  s: AiSettings, store: Store, history: ChatMessage[], o: { signal?: AbortSignal; onTool?: (name: string) => void } = {},
): Promise<AgentResult> {
  return runAgent(s, {
    model: s.coachModel, system: system(coachSnapshot(store)), messages: history,
    tools: coachTools(coachDayContext(store)), maxTokens: 1500, maxRounds: 6, ...o,
  })
}
