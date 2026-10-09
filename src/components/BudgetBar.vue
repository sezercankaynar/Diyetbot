<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ label: string; value: number; target: number; unit: string }>()
const pct = computed(() => (props.target > 0 ? Math.min(100, (props.value / props.target) * 100) : 0))
// Within 5 % of the target counts as on target, not over.
const over = computed(() => props.value > props.target * 1.05)
</script>

<template>
  <div class="budget">
    <div class="row small">
      <span>{{ label }}</span>
      <span class="num">{{ Math.round(value) }} / {{ Math.round(target) }} {{ unit }}</span>
    </div>
    <div class="track" role="meter" :aria-valuenow="value" aria-valuemin="0" :aria-valuemax="target" :aria-label="label">
      <div class="fill" :class="{ over }" :style="{ width: pct + '%' }" />
    </div>
  </div>
</template>

<style scoped>
.budget { margin-top: 8px; }
.row { display: flex; justify-content: space-between; color: var(--ink-2); }
.track { height: 10px; border-radius: 5px; background: var(--rule); overflow: hidden; margin-top: 3px; }
.fill { height: 100%; background: var(--accent); border-radius: 5px; }
.fill.over { background: var(--warn-border); }
</style>
