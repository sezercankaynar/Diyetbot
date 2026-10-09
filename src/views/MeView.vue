<script setup lang="ts">
import { ref, watch } from 'vue'
import PlanView from './PlanView.vue'
import ProfileView from './ProfileView.vue'
import EvidenceView from './EvidenceView.vue'
import { useAppStore } from '@/stores/app'

const props = defineProps<{ initial?: 'plan' | 'profil' | 'kanit' }>()
const emit = defineEmits<{ go: [tab: string]; done: [] }>()
const store = useAppStore()
const sub = ref<'plan' | 'profil' | 'kanit'>(props.initial ?? (store.hasProfile ? 'plan' : 'profil'))
watch(() => props.initial, (v) => v && (sub.value = v))
watch(sub, () => window.scrollTo(0, 0))
const TABS = [
  { id: 'plan', label: 'Planım' },
  { id: 'profil', label: 'Profil' },
  { id: 'kanit', label: 'Kanıtlar' },
] as const
</script>

<template>
  <div>
    <div class="subtabs-wrap">
      <div class="subtabs" role="tablist">
        <button
          v-for="t in TABS" :key="t.id" type="button" role="tab"
          :aria-selected="sub === t.id" @click="sub = t.id"
        >{{ t.label }}</button>
      </div>
    </div>
    <PlanView v-if="sub === 'plan'" @go="(t) => (t === 'kanit' ? (sub = 'kanit') : emit('go', t))" />
    <ProfileView v-else-if="sub === 'profil'" @done="sub = 'plan'; emit('done')" @go="(t) => (t === 'kanit' ? (sub = 'kanit') : emit('go', t))" />
    <EvidenceView v-else />
  </div>
</template>

<style scoped>
.subtabs-wrap { max-width: 640px; margin: 0 auto; padding: calc(14px + env(safe-area-inset-top)) 16px 0; }
.subtabs { display: flex; gap: 4px; background: var(--surface-2); border-radius: 14px; padding: 4px; }
.subtabs button {
  flex: 1; border: 0; background: none; padding: 9px 0; border-radius: 11px;
  font: inherit; font-weight: 700; font-size: 0.9rem; color: var(--ink-2); cursor: pointer;
}
.subtabs button[aria-selected='true'] { background: var(--surface); color: var(--ink); box-shadow: var(--shadow); }
:deep(.page) { padding-top: 12px; }
</style>
