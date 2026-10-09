<script setup lang="ts">
import { computed, ref } from 'vue'
import { cravingPlan } from '@/engine'
import { SWEET_RECIPES } from '@/content/sweetRecipes'
import { useAppStore } from '@/stores/app'
import SheetPanel from './SheetPanel.vue'

const emit = defineEmits<{ close: [] }>()
const store = useAppStore()
const logged = ref<string | null>(null)
const open = ref<string | null>(null)
type Filter = 'all' | 'recipe' | 'quick' | 'ready'
const filter = ref<Filter>('all')

const plan = computed(() => {
  const diet = store.plan.recommendedDiet?.id
  if (!diet || !store.plan.energy) return null
  return cravingPlan({
    remainingKcal: store.plan.energy.target - store.todayTotals.kcal,
    diet,
    animalFoods: store.profile.animalFoods,
    dislikes: store.profile.dislikes,
    health: store.profile.health,
    hungerTime: store.profile.hungerTime,
  })
})
const recipe = (id?: string) => (id ? SWEET_RECIPES.find((r) => r.id === id) : undefined)
const options = computed(() =>
  (plan.value?.options ?? []).filter((o) => {
    const r = recipe(o.recipeId)
    if (filter.value === 'recipe') return !!r
    if (filter.value === 'quick') return r ? r.noCook || r.minutes <= 10 : true
    if (filter.value === 'ready') return !r
    return true
  }),
)
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Hepsi' },
  { id: 'quick', label: '10 dk / pişirmeden' },
  { id: 'recipe', label: 'Tarifler' },
  { id: 'ready', label: 'Hazır' },
]

async function eat(foodId: string) {
  await store.logFoods([{ foodId, factor: 1 }])
  logged.value = foodId
}
</script>

<template>
  <SheetPanel title="Tatlı krizi" @close="emit('close')">
    <template v-if="plan">
      <details class="fold" open>
        <summary>Şimdi ne yapmalı?</summary>
        <div class="fold-body">
          <ol class="steps"><li v-for="s in plan.steps" :key="s">{{ s }}</li></ol>
        </div>
      </details>

      <p v-for="n in plan.notes" :key="n" class="note small">{{ n }}</p>

      <div class="filters" role="group" aria-label="Filtre">
        <button v-for="f in FILTERS" :key="f.id" type="button" :aria-pressed="filter === f.id" @click="filter = f.id">{{ f.label }}</button>
      </div>

      <section class="card">
        <h2>Hafif tatlılar <span class="tag">{{ options.length }}</span></h2>
        <div v-for="o in options" :key="o.foodId" class="opt">
          <button type="button" class="opt-head" :aria-expanded="open === o.foodId" @click="open = open === o.foodId ? null : o.foodId">
            <div class="opt-text">
              <div class="name">{{ o.name }}</div>
              <div class="small muted">
                <template v-if="recipe(o.recipeId)">🧑‍🍳 Tarif · {{ recipe(o.recipeId)!.minutes }} dk<template v-if="recipe(o.recipeId)!.noCook"> · pişirmeden</template></template>
                <template v-else>{{ o.portion }}</template>
              </div>
            </div>
            <div class="right">
              <div class="num kcal">{{ o.kcal }} <span class="small muted">kcal</span></div>
              <div class="small muted num">P {{ Math.round(o.protein) }} g</div>
            </div>
          </button>

          <div v-if="open === o.foodId" class="opt-body small">
            <template v-if="recipe(o.recipeId)">
              <p class="why">{{ recipe(o.recipeId)!.why }}</p>
              <h3>Malzemeler <span class="muted">({{ recipe(o.recipeId)!.servings }} porsiyon)</span></h3>
              <ul>
                <li v-for="ing in recipe(o.recipeId)!.ingredients" :key="ing.name">
                  {{ ing.measure ? `${ing.measure} ` : '' }}{{ ing.name }}<span v-if="ing.grams" class="muted"> ({{ ing.grams }} g)</span>
                </li>
              </ul>
              <h3>Yapılışı</h3>
              <ol><li v-for="s in recipe(o.recipeId)!.steps" :key="s">{{ s }}</li></ol>
              <p class="muted">1 porsiyon: {{ o.kcal }} kcal (yaklaşık)</p>
            </template>
            <button type="button" class="btn small" @click="eat(o.foodId)">
              {{ logged === o.foodId ? '✓ Kaydedildi' : '1 porsiyon yedim' }}
            </button>
          </div>
        </div>
      </section>

      <details class="fold">
        <summary>Bir dahaki sefere</summary>
        <div class="fold-body"><ul><li v-for="p in plan.prevention" :key="p">{{ p }}</li></ul></div>
      </details>
    </template>
    <p v-else class="muted">Güvenlik durdurması olduğu için öneri gösterilmiyor.</p>
  </SheetPanel>
</template>

<style scoped>
.steps { padding-left: 1.3em; }
.steps li { margin-bottom: 6px; }
.filters { display: flex; gap: 6px; overflow-x: auto; margin: 4px 0 12px; padding-bottom: 2px; }
.filters button {
  flex: none; border: 0; border-radius: 999px; padding: 8px 14px; font: inherit; font-size: 0.85rem; font-weight: 700;
  background: var(--surface); color: var(--ink-2); box-shadow: var(--shadow); cursor: pointer;
}
.filters button[aria-pressed='true'] { background: var(--accent); color: var(--accent-ink); }
.opt + .opt { border-top: 1px solid var(--line); }
.opt-head { width: 100%; display: flex; justify-content: space-between; gap: 10px; padding: 12px 0; background: none; border: 0; font: inherit; color: inherit; text-align: left; cursor: pointer; }
.opt-text { min-width: 0; }
.name { font-weight: 650; }
.right { text-align: right; white-space: nowrap; }
.kcal { font-weight: 700; }
.opt-body { background: var(--surface-2); border-radius: 12px; padding: 10px 12px; margin-bottom: 12px; }
.opt-body ul, .opt-body ol { padding-left: 1.2em; }
.why { color: var(--accent); font-weight: 600; }
.note { background: var(--info-bg); color: var(--info-ink); padding: 10px 12px; border-radius: 12px; }
</style>
