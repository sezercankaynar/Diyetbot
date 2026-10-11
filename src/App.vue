<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import TodayView from '@/views/TodayView.vue'
import MenuView from '@/views/MenuView.vue'
import TrackView from '@/views/TrackView.vue'
import SportView from '@/views/SportView.vue'
import MeView from '@/views/MeView.vue'

type Tab = 'bugun' | 'menu' | 'spor' | 'takip' | 'ben'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'bugun', label: 'Bugün', icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2' },
  { id: 'menu', label: 'Menü', icon: 'M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5M17 21V3c-2 1-3 4-3 8h3' },
  { id: 'spor', label: 'Spor', icon: 'M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10' },
  { id: 'takip', label: 'İlerleme', icon: 'M4 19h16M5 15l4-4 3 3 6-7' },
  { id: 'ben', label: 'Ben', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0' },
]
const ALL: Tab[] = TABS.map((t) => t.id)
/** Old links (#plan, #profil, #kanit) open the matching part of "Ben". */
const meSub = ref<'plan' | 'profil' | 'kanit' | undefined>()

const store = useAppStore()
const fromHash = (): Tab | null => {
  const h = location.hash.slice(1)
  if (h === 'plan' || h === 'profil' || h === 'kanit') {
    meSub.value = h
    return 'ben'
  }
  return ALL.includes(h as Tab) ? (h as Tab) : null
}
const tab = ref<Tab>(fromHash() ?? 'ben')
const go = (t: string) => {
  if (t === 'plan' || t === 'profil' || t === 'kanit') {
    meSub.value = t
    tab.value = 'ben'
  } else if (ALL.includes(t as Tab)) tab.value = t as Tab
}

onMounted(async () => {
  await store.load()
  if (!fromHash()) {
    if (!store.hasProfile) meSub.value = 'profil'
    tab.value = store.hasProfile ? 'bugun' : 'ben'
  }
})
watch(tab, (t) => {
  history.replaceState(null, '', `#${t}`)
  window.scrollTo(0, 0)
  if (t === 'bugun' || t === 'menu') store.ensureMenu()
})
// Coming back to the app on a new day/week: roll "today" and the menu over.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && store.loaded) {
    store.ensureMenu()
    // Keeps a week of water reminders ahead.
    if (store.waterReminder.on) store.rescheduleWater()
    if (store.stepsAuto) store.syncSteps(false)
  }
})
window.addEventListener('hashchange', () => {
  const h = fromHash()
  if (h) tab.value = h
})
</script>

<template>
  <main v-if="store.loaded">
    <TodayView v-if="tab === 'bugun'" @go="go" />
    <MenuView v-else-if="tab === 'menu'" @go="go" />
    <SportView v-else-if="tab === 'spor'" @go="go" />
    <TrackView v-else-if="tab === 'takip'" />
    <MeView v-else :initial="meSub" @go="go" @done="meSub = 'plan'; tab = 'bugun'" />
  </main>
  <div v-else class="page muted">Yükleniyor…</div>

  <nav class="tabbar" aria-label="Ana menü">
    <button
      v-for="t in TABS"
      :key="t.id"
      type="button"
      :aria-current="tab === t.id ? 'page' : undefined"
      @click="tab = t.id"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="t.icon" /></svg>
      <span>{{ t.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.tabbar {
  position: fixed;
  left: 10px;
  right: 10px;
  bottom: calc(10px + env(safe-area-inset-bottom));
  max-width: 560px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  height: var(--tabbar-h);
  padding: 6px;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 22px;
  box-shadow: 0 8px 30px rgba(10, 30, 20, 0.14);
  z-index: 10;
}
.tabbar button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: none;
  border: 0;
  border-radius: 16px;
  font: inherit;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--ink-3);
  cursor: pointer;
}
.tabbar svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.tabbar button[aria-current='page'] {
  color: var(--accent);
  background: var(--accent-soft);
  font-weight: 800;
}
</style>
