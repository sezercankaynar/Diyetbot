<script setup lang="ts">
const props = defineProps<{
  protein: number; carb: number; fat: number
  proteinT: number; carbT: number; fatT: number
}>()
const rows = [
  { key: 'protein', label: 'Protein', cls: 'p' },
  { key: 'carb', label: 'Karbonhidrat', cls: 'c' },
  { key: 'fat', label: 'Yağ', cls: 'f' },
] as const
const val = (k: 'protein' | 'carb' | 'fat') => props[k]
const tgt = (k: 'protein' | 'carb' | 'fat') => (k === 'protein' ? props.proteinT : k === 'carb' ? props.carbT : props.fatT)
const pct = (k: 'protein' | 'carb' | 'fat') => (tgt(k) > 0 ? Math.min(100, (val(k) / tgt(k)) * 100) : 0)
</script>

<template>
  <div class="macros">
    <div v-for="r in rows" :key="r.key" class="m">
      <div class="top">
        <span class="name">{{ r.label }}</span>
        <span class="v num"><strong>{{ Math.round(val(r.key)) }}</strong>/{{ Math.round(tgt(r.key)) }} g</span>
      </div>
      <div class="bar"><div class="fill" :class="r.cls" :style="{ width: pct(r.key) + '%' }" /></div>
    </div>
  </div>
</template>

<style scoped>
.macros { display: grid; gap: 10px; }
.top { display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--ink-2); }
.top strong { color: var(--ink); font-weight: 700; }
.bar { height: 7px; border-radius: 4px; background: var(--surface-2); overflow: hidden; margin-top: 4px; }
.fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
.p { background: var(--c-protein); }
.c { background: var(--c-carb); }
.f { background: var(--c-fat); }
</style>
