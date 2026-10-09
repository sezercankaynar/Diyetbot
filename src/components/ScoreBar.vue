<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ score: number; max: number; highlight?: boolean }>()
const pct = computed(() => (props.max > 0 ? Math.max(0, Math.min(100, (props.score / props.max) * 100)) : 0))
</script>

<template>
  <div class="bar" role="meter" :aria-valuenow="score" aria-valuemin="0" :aria-valuemax="max">
    <div class="fill" :class="{ hl: highlight }" :style="{ width: pct + '%' }" />
  </div>
</template>

<style scoped>
.bar {
  height: 8px;
  border-radius: 4px;
  background: var(--rule);
  overflow: hidden;
}
.fill { height: 100%; background: var(--bar-dim); border-radius: 4px; }
.fill.hl { background: var(--bar); }
</style>
