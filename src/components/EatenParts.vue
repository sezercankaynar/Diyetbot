<script setup lang="ts">
import { computed } from 'vue'
import { amountText, getFood, itemTotals, nextEatenAmount, plateName, sumTotals, type Slot } from '@/engine'
import { useAppStore } from '@/stores/app'

// What was actually eaten for a ticked meal, one line per food, each amount adjustable.
const props = defineProps<{ slot: Slot }>()
const store = useAppStore()
const entries = computed(() => store.todayDiary.filter((e) => e.menuSlot === props.slot))
const total = computed(() => sumTotals(entries.value.map((e) => itemTotals(e.foodId, e.factor))))
</script>

<template>
  <div class="eaten">
    <div class="head">
      <span class="label">Yediklerin</span>
      <span class="num small">{{ total.kcal }} kcal · P {{ total.protein }} · K {{ total.carb }} · Y {{ total.fat }}</span>
    </div>
    <p class="small muted">Farklı miktarda yediysen − / + ile düzelt; hiç yemediğini ✕ ile çıkar.</p>
    <div v-for="e in entries" :key="e.id" class="row">
      <div class="txt">
        <div class="nm">{{ plateName(getFood(e.foodId)?.name ?? '') }}</div>
        <div class="small amt">{{ amountText(e.foodId, e.factor) }} · {{ itemTotals(e.foodId, e.factor).kcal }} kcal</div>
      </div>
      <div class="ctrl">
        <button type="button" class="step" :aria-label="`${getFood(e.foodId)?.name} azalt`" @click="store.setDiaryAmount(e.id, nextEatenAmount(e.foodId, e.factor, -1))">−</button>
        <button type="button" class="step" :aria-label="`${getFood(e.foodId)?.name} artır`" @click="store.setDiaryAmount(e.id, nextEatenAmount(e.foodId, e.factor, 1))">+</button>
        <button type="button" class="step del" :aria-label="`${getFood(e.foodId)?.name} çıkar`" @click="store.setDiaryAmount(e.id, 0)">✕</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.row { display: flex; align-items: center; gap: 8px; padding: 6px 0; }
.row + .row { border-top: 1px solid var(--line); }
.txt { flex: 1; min-width: 0; }
.nm { color: var(--ink); font-weight: 600; }
.amt { color: var(--accent); font-weight: 600; }
.ctrl { display: flex; gap: 4px; flex: none; }
.step { width: 32px; height: 32px; border-radius: 50%; border: 0; background: var(--surface); color: var(--ink); font: inherit; font-weight: 800; cursor: pointer; }
.step.del { color: var(--stop-border); }
</style>
