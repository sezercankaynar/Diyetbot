<script setup lang="ts">
import { computed, ref } from 'vue'
import DishRecipe from './DishRecipe.vue'
import { methodFor } from '@/content/recipes'
import { amountText, getFood, itemTotals, mealTitle, mealTotals, partsOf, plateName, type MenuItem } from '@/engine'

// A menu meal as a dietitian writes it: one line per food with its household amount.
const props = defineProps<{ item: MenuItem; compact?: boolean }>()
const t = computed(() => mealTotals(props.item))
const rows = computed(() =>
  partsOf(props.item).map((x) => ({
    id: x.foodId,
    name: plateName(getFood(x.foodId)?.name ?? ''),
    amount: amountText(x.foodId, x.factor),
    kcal: itemTotals(x.foodId, x.factor).kcal,
    est: !!getFood(x.foodId)?.estimated,
    factor: x.factor,
    // Dishes with a recipe open it (pilav, soups, sulu yemek …).
    recipe: !!getFood(x.foodId)?.recipe && !!methodFor(x.foodId),
  })),
)
const open = ref<{ id: string; factor: number } | null>(null)
</script>

<template>
  <div class="plate" :class="{ compact }">
    <div class="head">
      <div class="title">{{ mealTitle(item) }}</div>
      <div class="nums">
        <div class="num kcal">{{ t.kcal }}<span class="unit"> kcal</span></div>
        <div class="num small muted">P {{ t.protein }} · K {{ t.carb }} · Y {{ t.fat }}</div>
      </div>
    </div>
    <ul class="parts">
      <li v-for="r in rows" :key="r.id">
        <span class="amt">{{ r.amount }}</span>
        <button v-if="r.recipe" type="button" class="nm rc" @click="open = { id: r.id, factor: r.factor }">{{ r.name }} <span class="rl">tarif</span></button>
        <span v-else class="nm">{{ r.name }}<span v-if="r.est" class="est"> · tahmini</span></span>
        <span class="num small muted">{{ r.kcal }}</span>
      </li>
    </ul>
    <DishRecipe v-if="open" :food-id="open.id" :factor="open.factor" @close="open = null" />
  </div>
</template>

<style scoped>
.head { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
.title { font-weight: 700; }
.nums { text-align: right; flex: none; }
.kcal { font-weight: 700; }
.unit { font-weight: 500; font-size: 0.8rem; color: var(--ink-3); }
.parts { list-style: none; padding: 0; margin: 8px 0 0; display: grid; gap: 4px; }
.parts li { display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: baseline; font-size: 0.86rem; }
.amt { color: var(--accent); font-weight: 650; white-space: nowrap; max-width: 46vw; overflow: hidden; text-overflow: ellipsis; }
.nm { min-width: 0; }
.rc { background: none; border: 0; padding: 0; font: inherit; color: inherit; text-align: left; cursor: pointer; }
.rl { font-size: 0.7rem; font-weight: 700; color: var(--accent); background: var(--accent-soft); border-radius: 999px; padding: 1px 6px; }
.est { color: var(--warn-ink); font-size: 0.75rem; }
.compact .parts li { font-size: 0.8rem; }
</style>
