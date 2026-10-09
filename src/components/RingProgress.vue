<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ value: number; target: number; size?: number }>()
const R = 52
const C = 2 * Math.PI * R
const pct = computed(() => (props.target > 0 ? Math.min(1, props.value / props.target) : 0))
const over = computed(() => props.value > props.target * 1.05)
</script>

<template>
  <svg :width="size ?? 136" :height="size ?? 136" viewBox="0 0 120 120" class="ring" aria-hidden="true">
    <circle cx="60" cy="60" :r="R" class="track" />
    <circle
      cx="60" cy="60" :r="R" class="fill" :class="{ over }"
      :stroke-dasharray="`${C * pct} ${C}`" transform="rotate(-90 60 60)"
    />
  </svg>
</template>

<style scoped>
.ring circle { fill: none; stroke-width: 11; stroke-linecap: round; }
.track { stroke: var(--surface-2); }
.fill { stroke: var(--accent); transition: stroke-dasharray 0.4s ease; }
.fill.over { stroke: var(--accent-2); }
</style>
