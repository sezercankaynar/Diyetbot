import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  analyzeWeek,
  buildPlan,
  defaultProfile,
  sortLogs,
  type Adjustment,
  type AdjustmentOption,
  type DietId,
  type Profile,
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
    loaded.value = true
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
    await repo.saveSettings({ diet: id })
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
    load, saveProfile, upsertWeighIn, deleteWeighIn, setDiet,
    applyAdjustment, deleteAdjustment, exportBackup, importBackup,
  }
})
