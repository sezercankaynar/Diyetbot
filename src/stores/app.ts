import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  analyzeWeek,
  buildMenuContext,
  buildPlan,
  defaultProfile,
  diaryTotals,
  intakeStats,
  lastDays,
  habitRate,
  waterRate,
  waterGlassesTarget,
  type CoachContext,
  generateWeekMenu,
  menuOutdated as isMenuOutdated,
  mondayOf,
  removeDish,
  setExtraFoods,
  sortLogs,
  swapItem,
  type Adjustment,
  type AdjustmentOption,
  type CheckItem,
  type DiaryEntry,
  type CheckIn,
  type DailyLog,
  type Food,
  type DietId,
  type Profile,
  type Slot,
  type WeekMenu,
  type WeighIn,
} from '@/engine'
import { parseBackup, repo, type Backup } from '@/db'

export const today = (): string => {
  const d = new Date()
  const off = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - off).toISOString().slice(0, 10)
}

export const useAppStore = defineStore('app', () => {
  const loaded = ref(false)
  const hasProfile = ref(false)
  const profile = ref<Profile>(defaultProfile())
  const weighLogs = ref<WeighIn[]>([])
  const adjustments = ref<Adjustment[]>([])
  const dietChoice = ref<DietId | null>(null)
  const liked = ref<string[]>([])
  const disliked = ref<string[]>([])
  const diary = ref<DiaryEntry[]>([])
  const menu = ref<WeekMenu | null>(null)
  /** Packaged products the user saved (from barcode, search or label). */
  const customFoods = ref<Food[]>([])
  const syncExtraFoods = () => setExtraFoods(customFoods.value)
  const checkIns = ref<CheckIn[]>([])
  const daily = ref<DailyLog[]>([])
  const activeHabits = ref<string[]>([])
  const todayLog = computed<DailyLog>(
    () => daily.value.find((l) => l.date === todayDate.value) ?? { date: todayDate.value, water: 0, habits: [] },
  )
  const waterTarget = computed(() => waterGlassesTarget(plan.value.macros?.waterMl ?? 2000))
  /** Last-7-days numbers a dietitian would look at in a follow-up. */
  const coachContext = computed<CoachContext | null>(() => {
    const e = plan.value.energy
    const m = plan.value.macros
    if (!e || !m) return null
    const days = lastDays(todayDate.value, 7)
    const perDay = Object.fromEntries(days.map((d) => [d, diaryTotals(diary.value, d)]))
    const a = analysis.value
    return {
      sex: profile.value.sex,
      heightCm: profile.value.heightCm,
      goal: profile.value.goal,
      weeklyRate: a.status === 'ready' ? a.weeklyRate : undefined,
      targetRate: a.status === 'ready' ? a.targetRate : undefined,
      kcalTarget: e.target,
      proteinTarget: m.proteinG,
      ...intakeStats(perDay, days),
      habitRate: habitRate(daily.value, activeHabits.value, days),
      waterRate: waterRate(daily.value, waterTarget.value, days),
    }
  })
  const sortedCheckIns = computed(() => [...checkIns.value].sort((a, b) => b.date.localeCompare(a.date)))
  /** Refreshed when the app comes back to the foreground, so "today" rolls over at midnight. */
  const todayDate = ref(today())

  const kcalOffset = computed(() => adjustments.value.reduce((s, a) => s + a.kcalDelta, 0))
  const stepsOffset = computed(() => adjustments.value.reduce((s, a) => s + a.stepsDelta, 0))
  const plan = computed(() =>
    buildPlan(profile.value, { diet: dietChoice.value ?? undefined, kcalOffset: kcalOffset.value }),
  )
  const sortedLogs = computed(() => sortLogs(weighLogs.value))
  const analysis = computed(() =>
    analyzeWeek(weighLogs.value, {
      goal: profile.value.goal,
      weeklyRatePct: profile.value.weeklyRate,
      experience: profile.value.experience,
      weightKg: profile.value.weightKg,
    }),
  )
  const menuCtx = computed(() =>
    buildMenuContext(profile.value, plan.value, { liked: liked.value, disliked: disliked.value }),
  )
  const todayMenu = computed(() => menu.value?.days.find((d) => d.date === todayDate.value) ?? null)
  const todayDiary = computed(() => diary.value.filter((e) => e.date === todayDate.value))
  const todayTotals = computed(() => diaryTotals(diary.value, todayDate.value))
  const menuOutdated = computed(() => !!menu.value && !!menuCtx.value && isMenuOutdated(menu.value, menuCtx.value))
  const sortedAdjustments = computed(() => [...adjustments.value].sort((a, b) => b.date.localeCompare(a.date)))

  async function load() {
    const [p, logs, adj, settings] = await Promise.all([
      repo.loadProfile(),
      repo.listWeighIns(),
      repo.listAdjustments(),
      repo.loadSettings(),
    ])
    if (p) {
      // Merge with defaults so newly added fields get a value.
      const d = defaultProfile()
      profile.value = { ...d, ...p, health: { ...d.health, ...p.health } }
      hasProfile.value = true
    }
    weighLogs.value = logs
    adjustments.value = adj
    dietChoice.value = settings?.diet ?? null
    liked.value = settings?.liked ?? []
    disliked.value = settings?.disliked ?? []
    diary.value = await repo.listDiary()
    customFoods.value = await repo.listCustomFoods()
    checkIns.value = await repo.listCheckIns()
    daily.value = await repo.listDaily()
    activeHabits.value = settings?.habits ?? []
    syncExtraFoods()
    menu.value = (await repo.loadMenu()) ?? null
    loaded.value = true
    await ensureMenu()
  }

  const saveSettings = () =>
    repo.saveSettings({ diet: dietChoice.value, liked: liked.value, disliked: disliked.value, habits: activeHabits.value })

  /** Builds this week's menu if there is none yet (or it's from an earlier week). */
  async function ensureMenu() {
    todayDate.value = today()
    const ctx = menuCtx.value
    if (!ctx || !hasProfile.value) return
    const week = mondayOf(todayDate.value)
    if (menu.value?.weekStart === week) return
    menu.value = generateWeekMenu(ctx, week)
    await repo.saveMenu(menu.value)
  }

  async function regenerateMenu() {
    const ctx = menuCtx.value
    if (!ctx) return
    const week = mondayOf(todayDate.value)
    const seed = menu.value?.weekStart === week ? menu.value.seed + 1 : 1
    menu.value = generateWeekMenu(ctx, week, seed)
    await repo.saveMenu(menu.value)
  }

  async function swapMenu(date: string, slot: Slot, foodId: string, factor: number) {
    if (!menu.value) return
    menu.value = swapItem(menu.value, date, slot, foodId, factor)
    await repo.saveMenu(menu.value)
  }

  async function rateDish(foodId: string, rating: 'like' | 'dislike' | null) {
    liked.value = liked.value.filter((x) => x !== foodId)
    disliked.value = disliked.value.filter((x) => x !== foodId)
    if (rating === 'like') liked.value = [...liked.value, foodId]
    if (rating === 'dislike') {
      disliked.value = [...disliked.value, foodId]
      if (menu.value && menuCtx.value) {
        menu.value = removeDish(menu.value, menuCtx.value, foodId)
        await repo.saveMenu(menu.value)
      }
    }
    await saveSettings()
  }

  const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

  async function logFoods(items: CheckItem[], menuSlot?: Slot) {
    for (const i of items) {
      const e: DiaryEntry = { id: newId(), date: todayDate.value, foodId: i.foodId, factor: i.factor, menuSlot }
      await repo.putDiary(e)
      diary.value = [...diary.value, e]
    }
  }

  async function saveCustomFood(f: Food) {
    await repo.putCustomFood(f)
    customFoods.value = [...customFoods.value.filter((x) => x.id !== f.id), f]
    syncExtraFoods()
  }

  async function updateToday(patch: Partial<Omit<DailyLog, 'date'>>) {
    const next: DailyLog = { ...todayLog.value, ...patch }
    await repo.putDaily(next)
    daily.value = [...daily.value.filter((l) => l.date !== next.date), next]
  }
  const addWater = (delta: number) => updateToday({ water: Math.max(0, todayLog.value.water + delta) })
  function toggleHabit(id: string) {
    const h = todayLog.value.habits
    return updateToday({ habits: h.includes(id) ? h.filter((x) => x !== id) : [...h, id] })
  }
  async function setHabits(ids: string[]) {
    activeHabits.value = ids
    await saveSettings()
  }
  async function saveCheckIn(c: CheckIn) {
    await repo.putCheckIn(c)
    checkIns.value = [...checkIns.value.filter((x) => x.id !== c.id), c]
  }
  async function deleteCheckIn(id: string) {
    await repo.deleteCheckIn(id)
    checkIns.value = checkIns.value.filter((x) => x.id !== id)
  }

  async function deleteDiary(id: string) {
    await repo.deleteDiary(id)
    diary.value = diary.value.filter((e) => e.id !== id)
  }

  /** Ticks/unticks a planned menu meal for today. */
  async function toggleMenuEaten(slot: Slot) {
    const existing = todayDiary.value.find((e) => e.menuSlot === slot)
    if (existing) return deleteDiary(existing.id)
    const item = todayMenu.value?.items.find((i) => i.slot === slot)
    if (item) await logFoods([{ foodId: item.foodId, factor: item.factor }], slot)
  }

  async function saveProfile(p: Profile) {
    profile.value = p
    hasProfile.value = true
    await repo.saveProfile(p)
  }

  async function syncWeightFromLogs() {
    const latest = sortedLogs.value.at(-1)
    if (latest && latest.kg !== profile.value.weightKg) {
      await saveProfile({ ...profile.value, weightKg: latest.kg })
    }
  }

  async function upsertWeighIn(w: WeighIn, replaceDate?: string) {
    if (replaceDate && replaceDate !== w.date) {
      await repo.deleteWeighIn(replaceDate)
      weighLogs.value = weighLogs.value.filter((l) => l.date !== replaceDate)
    }
    await repo.putWeighIn(w)
    weighLogs.value = [...weighLogs.value.filter((l) => l.date !== w.date), w]
    await syncWeightFromLogs()
  }

  async function deleteWeighIn(date: string) {
    await repo.deleteWeighIn(date)
    weighLogs.value = weighLogs.value.filter((l) => l.date !== date)
    await syncWeightFromLogs()
  }

  async function setDiet(id: DietId | null) {
    dietChoice.value = id
    await saveSettings()
  }

  async function applyAdjustment(opt: AdjustmentOption, reason: string) {
    const from = plan.value.energy?.target ?? 0
    const nextOffset = kcalOffset.value + opt.kcalDelta
    const to = buildPlan(profile.value, { diet: dietChoice.value ?? undefined, kcalOffset: nextOffset }).energy?.target ?? from
    const a: Adjustment = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      date: today(),
      kcalDelta: opt.kcalDelta,
      stepsDelta: opt.stepsDelta,
      fromKcal: from,
      toKcal: to,
      reason: `${reason} → ${opt.label}`,
    }
    await repo.putAdjustment(a)
    adjustments.value = [...adjustments.value, a]
  }

  async function deleteAdjustment(id: string) {
    await repo.deleteAdjustment(id)
    adjustments.value = adjustments.value.filter((a) => a.id !== id)
  }

  async function exportBackup(): Promise<Backup> {
    return repo.exportAll()
  }

  async function importBackup(raw: unknown) {
    await repo.importAll(parseBackup(raw))
    hasProfile.value = false
    profile.value = defaultProfile()
    await load()
  }

  return {
    loaded, hasProfile, profile, weighLogs, adjustments, dietChoice,
    kcalOffset, stepsOffset, plan, sortedLogs, analysis, sortedAdjustments,
    liked, disliked, diary, menu, customFoods, saveCustomFood,
    checkIns, sortedCheckIns, coachContext, waterTarget, daily, activeHabits, todayLog, addWater, toggleHabit, setHabits, saveCheckIn, deleteCheckIn, todayDate, menuCtx, todayMenu, todayDiary, todayTotals, menuOutdated,
    load, saveProfile, upsertWeighIn, deleteWeighIn, setDiet,
    applyAdjustment, deleteAdjustment, exportBackup, importBackup,
    ensureMenu, regenerateMenu, swapMenu, rateDish, logFoods, deleteDiary, toggleMenuEaten,
  }
})
