import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { addDays, onTarget, shareDay, slotPlan, stepTarget, type ShareDayData } from '@/engine'
import { loadShare, saveShare, shareApi, ShareError, type PartnerView, type ShareSettings } from '@/share/client'
import { useAppStore } from './app'

/** Following each other's day with a partner (through the diyetbot-share service). */
export const useShareStore = defineStore('share', () => {
  const app = useAppStore()
  const settings = ref<ShareSettings>(loadShare())
  const paired = computed(() => !!settings.value.key)
  const view = ref<PartnerView | null>(null)
  const invite = ref<{ code: string; expires_at: string } | null>(null)
  const error = ref('')
  const busy = ref(false)
  const lastSync = ref<string | null>(null)

  function set(patch: Partial<ShareSettings>) {
    settings.value = { ...settings.value, ...patch }
    saveShare(settings.value)
  }

  async function run<T>(fn: () => Promise<T>): Promise<T | null> {
    busy.value = true
    error.value = ''
    try {
      return await fn()
    } catch (e) {
      error.value = (e as Error).message
      // The pairing was ended (by the partner or from another phone): forget the key.
      if (e instanceof ShareError && e.type === 'share_unauthorized') forget()
      return null
    } finally {
      busy.value = false
    }
  }
  function forget() {
    set({ key: '' })
    view.value = null
    invite.value = null
  }

  /** Starts sharing and shows an invite code for the partner. */
  async function start(name: string) {
    await run(async () => {
      const r = await shareApi.invite(settings.value, name.trim())
      if (r.member_key) set({ key: r.member_key, me: name.trim() })
      invite.value = { code: r.code, expires_at: r.expires_at }
      await push()
    })
  }
  async function newCode() {
    await run(async () => {
      const r = await shareApi.invite(settings.value, settings.value.me)
      invite.value = { code: r.code, expires_at: r.expires_at }
    })
  }
  async function join(code: string, name: string) {
    return run(async () => {
      const r = await shareApi.join(settings.value, code.trim(), name.trim())
      set({ key: r.member_key, me: name.trim() })
      await push()
      await refresh()
      return r.partner.name
    })
  }
  async function leave() {
    await run(async () => {
      await shareApi.leave(settings.value)
      forget()
    })
  }
  function setPrefs(p: Partial<ShareSettings['prefs']>) {
    set({ prefs: { ...settings.value.prefs, ...p } })
    void push()
  }

  // ---------------------------------------------------------------- my days → partner
  function myDay(date: string): ShareDayData {
    const ctx = app.menuCtx
    return shareDay({
      date, diary: app.diary, log: app.daily.find((l) => l.date === date),
      target: app.dayTarget(date), proteinTarget: app.plan.macros?.proteinG ?? 0,
      waterTarget: app.waterTarget, stepTarget: stepTarget(app.profile.goal),
      meals: ctx ? slotPlan(ctx).map((s) => ({ slot: s.slot, label: s.label })) : [],
      logs: app.weighLogs, prefs: settings.value.prefs,
    })
  }
  /** Sends today and yesterday (a late entry for yesterday counts too). */
  async function push() {
    if (!paired.value || !app.hasProfile || app.plan.safety.stop) return
    const today = app.todayDate
    for (const d of [addDays(today, -1), today]) {
      try {
        await shareApi.putDay(settings.value, d, myDay(d))
      } catch (e) {
        if (e instanceof ShareError && e.type === 'share_unauthorized') return forget()
        return // offline: next change or opening the app sends it
      }
    }
    lastSync.value = new Date().toISOString()
  }
  let timer: ReturnType<typeof setTimeout> | undefined
  watch(
    () => [paired.value, app.diary, app.daily, app.weighLogs] as const,
    () => {
      clearTimeout(timer)
      if (paired.value) timer = setTimeout(() => void push(), 3000)
    },
    { deep: false },
  )

  // ---------------------------------------------------------------- partner → me
  async function refresh() {
    if (!paired.value) return
    try {
      view.value = await shareApi.partner(settings.value, 7)
      error.value = ''
    } catch (e) {
      if (e instanceof ShareError && e.type === 'share_unauthorized') forget()
      else error.value = (e as Error).message
    }
  }
  async function react(emoji: string, message?: string) {
    const day = app.todayDate
    await run(async () => {
      await shareApi.react(settings.value, day, emoji, message?.trim() || undefined)
      await refresh()
    })
  }
  async function markSeen() {
    const ids = (view.value?.reactions ?? []).filter((r) => !r.mine && !r.seen).map((r) => r.id)
    if (!ids.length) return
    try {
      await shareApi.seen(settings.value, ids)
      for (const r of view.value!.reactions) if (ids.includes(r.id)) r.seen = true
    } catch {
      // Try again next time.
    }
  }
  /** Keeps the partner's day fresh while the app is open. */
  let poll: ReturnType<typeof setInterval> | undefined
  function startSync() {
    void push()
    void refresh()
    clearInterval(poll)
    poll = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, 5 * 60_000)
  }

  const partnerToday = computed(() => view.value?.days.find((d) => d.day === app.todayDate)?.data ?? null)
  const unseen = computed(() => (view.value?.reactions ?? []).filter((r) => !r.mine && !r.seen))
  /** The last 7 days (before today) on target: me and the partner. */
  const week = computed(() => {
    const days = Array.from({ length: 7 }, (_, k) => addDays(app.todayDate, k - 7))
    const mine = days.filter((d) => onTarget(myDay(d))).length
    const theirs = days.filter((d) => {
      const x = view.value?.days.find((p) => p.day === d)?.data
      return !!x && onTarget(x)
    }).length
    return { mine, theirs }
  })

  // The partner's day, one line on the home-screen widget.
  watch(
    () => [view.value, paired.value] as const,
    () => {
      const p = view.value?.partner
      const d = partnerToday.value
      app.widgetPartner = paired.value && p
        ? `👫 ${p.name}: ${d?.logged ? `${d.kcal.toLocaleString('tr-TR')} / ${d.target.toLocaleString('tr-TR')} kcal` : 'bugün kayıt yok'}${d?.workout ? ' · 💪 ✓' : ''}`
        : null
    },
  )

  return {
    settings, paired, view, invite, error, busy, lastSync, partnerToday, unseen, week,
    start, newCode, join, leave, setPrefs, push, refresh, react, markSeen, startSync,
  }
})
