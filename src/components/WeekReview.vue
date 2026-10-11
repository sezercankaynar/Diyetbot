<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { fmt } from '@/content/labels'

// Last week in numbers, with what went well and one or two things to focus on.
defineProps<{ compact?: boolean }>()
const store = useAppStore()
const s = computed(() => store.weekReview)
const short = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}`
</script>

<template>
  <section class="card">
    <div class="head">
      <h2>Haftalık özet</h2>
      <span class="small muted num">{{ short(s.from) }}–{{ short(s.to) }}</span>
    </div>
    <p v-if="!s.loggedDays && !s.avgSteps && s.weightChange === null" class="small muted">Geçen hafta için kayıt yok. Yediklerini, suyunu ve tartını kaydettikçe burada haftanın özeti çıkar.</p>
    <template v-else>
      <div class="grid">
        <div><span class="v num">{{ s.loggedDays }}/7</span><span class="k">gün kayıt</span></div>
        <div><span class="v num">{{ s.avgKcal !== null ? fmt(s.avgKcal) : '–' }}</span><span class="k">ort. kcal (hedef {{ fmt(store.plan.energy?.target ?? 0) }})</span></div>
        <div><span class="v num">{{ s.onTargetDays }}</span><span class="k">gün hedefe yakın</span></div>
        <div><span class="v num">{{ s.avgProtein ?? '–' }}</span><span class="k">ort. protein (g)</span></div>
        <div><span class="v num">{{ s.waterDays }}</span><span class="k">gün su hedefi</span></div>
        <div><span class="v num">{{ s.avgSteps !== null ? fmt(s.avgSteps) : '–' }}</span><span class="k">ort. adım</span></div>
        <div><span class="v num">{{ s.workouts }}</span><span class="k">antrenman</span></div>
        <div><span class="v num">{{ s.weightChange !== null ? `${s.weightChange > 0 ? '+' : ''}${fmt(s.weightChange, 1)}` : '–' }}</span><span class="k">kg (haftalık ort.)</span></div>
      </div>
      <ul v-if="s.wins.length" class="list small"><li v-for="w in s.wins" :key="w">✅ {{ w }}</li></ul>
      <ul v-if="s.focus.length" class="list small"><li v-for="f in s.focus" :key="f">🎯 {{ f }}</li></ul>
    </template>
  </section>
</template>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: baseline; }
.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin: 8px 0; }
.grid > div { background: var(--surface-2); border-radius: 12px; padding: 8px 10px; display: grid; }
.v { font-weight: 800; font-size: 1.05rem; }
.k { font-size: 0.75rem; color: var(--ink-3); }
.list { list-style: none; padding: 0; margin: 6px 0 0; display: grid; gap: 4px; }
</style>
