<script setup lang="ts">
import { computed } from 'vue'
import { getFood, itemTotals, portionText } from '@/engine'

const props = defineProps<{ foodId: string; factor: number; note?: string; compact?: boolean }>()
const food = computed(() => getFood(props.foodId))
const t = computed(() => itemTotals(props.foodId, props.factor))
</script>

<template>
  <div v-if="food" class="food-row">
    <div class="main">
      <div class="name">{{ food.brand && food.group !== 'paket' ? `${food.brand} – ${food.name}` : food.name }}</div>
      <div class="small muted">
        {{ factor === 1 ? food.portion : `${portionText(factor)} (1 porsiyon: ${food.portion})` }}
      </div>
      <div v-if="note" class="small note">{{ note }}</div>
      <slot name="extra" />
    </div>
    <div class="nums">
      <div class="num kcal">{{ t.kcal }}<span class="unit"> kcal</span></div>
      <div v-if="food.kcalOnly" class="small muted">makro yok</div>
      <div v-else-if="!compact" class="num small muted">P {{ t.protein }} · K {{ t.carb }} · Y {{ t.fat }}</div>
      <div v-else class="num small muted">P {{ t.protein }} g</div>
    </div>
  </div>
</template>

<style scoped>
.food-row { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
.main { min-width: 0; }
.name { font-weight: 600; }
.note { color: var(--accent); margin-top: 2px; }
.nums { text-align: right; white-space: nowrap; }
.kcal { font-size: 1.05rem; }
.unit { font-size: 0.75rem; color: var(--ink-3); }
</style>
