<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import ProfileView from '@/views/ProfileView.vue'
import PlanView from '@/views/PlanView.vue'
import TrackView from '@/views/TrackView.vue'
import EvidenceView from '@/views/EvidenceView.vue'

type Tab = 'profil' | 'plan' | 'takip' | 'kanit'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'profil', label: 'Profil', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0' },
  { id: 'plan', label: 'Plan', icon: 'M6 3h9l4 4v14H6zM9 10h7M9 14h7M9 18h4' },
  { id: 'takip', label: 'Takip', icon: 'M4 19h16M5 15l4-4 3 3 6-7' },
  { id: 'kanit', label: 'Kanıt', icon: 'M5 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H5zM19 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z' },
]

const store = useAppStore()
const fromHash = (): Tab | null => {
  const h = location.hash.slice(1) as Tab
  return TABS.some((t) => t.id === h) ? h : null
}
const tab = ref<Tab>(fromHash() ?? 'profil')

onMounted(async () => {
  await store.load()
  if (!fromHash()) tab.value = store.hasProfile ? 'plan' : 'profil'
})
watch(tab, (t) => {
  history.replaceState(null, '', `#${t}`)
  window.scrollTo(0, 0)
})
window.addEventListener('hashchange', () => {
  const h = fromHash()
  if (h) tab.value = h
})
</script>

<template>
  <main v-if="store.loaded">
    <ProfileView v-if="tab === 'profil'" @done="tab = 'plan'" />
    <PlanView v-else-if="tab === 'plan'" />
    <TrackView v-else-if="tab === 'takip'" />
    <EvidenceView v-else />
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
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  height: calc(var(--tabbar-h) + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--paper-2);
  border-top: 2px solid var(--ink);
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
  font: inherit;
  font-size: 0.75rem;
  color: var(--ink-3);
  cursor: pointer;
}
.tabbar svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.tabbar button[aria-current='page'] {
  color: var(--accent);
  font-weight: 700;
}
</style>
