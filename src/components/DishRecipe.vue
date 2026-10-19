<script setup lang="ts">
import { computed, ref } from 'vue'
import { getFood, ingredientById, itemTotals, plateName } from '@/engine'
import { methodFor } from '@/content/recipes'
import { DISH_RECIPES } from '@/content/dishRecipes'
import SheetPanel from './SheetPanel.vue'

// Recipe of a menu dish: its ingredient list (what the kcal is computed from) and the method.
const props = defineProps<{ foodId: string; factor: number }>()
const emit = defineEmits<{ close: [] }>()
const food = computed(() => getFood(props.foodId))
const method = computed(() => methodFor(props.foodId))
// The dish's own detailed recipe (falls back to the general method of its kind).
const detail = computed(() => DISH_RECIPES[props.foodId] ?? null)
/** {su:200} = 200 ml per portion → amount for the chosen portions, in su bardağı when that's handy. */
function fill(text: string): string {
  const k = props.factor * n.value
  return text.replace(/\{su:(\d+)\}/g, (_, ml) => {
    const v = Number(ml) * k
    if (v < 150) return `${Math.max(10, Math.round(v / 10) * 10)} ml`
    const glasses = Math.round((v / 200) * 2) / 2
    return `${String(glasses).replace('.', ',')} su bardağı (≈${Math.round(v / 50) * 50} ml)`
  })
}
const totalTime = computed(() => (detail.value ? detail.value.time.prep + detail.value.time.cook : 0))
const SERVINGS = [1, 2, 4, 6]
const n = ref(1)

/** "2 yemek kaşığı (20 g)" when a household measure fits, else grams. */
function household(id: string, g: number): string {
  const units = ingredientById(id)?.units ?? []
  // Whole measures first ("1 tatlı kaşığı" rather than "0,5 yemek kaşığı").
  for (const steps of [[1, 1.5, 2, 2.5, 3, 4, 5, 6, 8], [0.5]]) {
    for (const u of units) {
      const r = g / u.grams
      const nice = steps.find((x) => Math.abs(r - x) / x < 0.12)
      if (nice) return `${String(nice).replace('.', ',')} × ${u.label.replace(/^1 /, '')} (${Math.round(g)} g)`
    }
  }
  return g >= 1000 ? `${String(Math.round(g / 100) / 10).replace('.', ',')} kg` : `${Math.round(g)} g`
}
const lines = computed(() => {
  const f = food.value
  if (!f?.recipe) return []
  const k = (props.factor * n.value) / f.recipe.servings
  return f.recipe.lines.map((l) => ({ id: l.ingredientId, name: ingredientById(l.ingredientId)?.name ?? l.ingredientId, amount: household(l.ingredientId, l.grams * k) }))
})
const t = computed(() => itemTotals(props.foodId, props.factor))
</script>

<template>
  <SheetPanel :title="plateName(food?.name ?? 'Tarif')" @close="emit('close')">
    <p class="small muted">Menüdeki porsiyon: {{ t.kcal }} kcal · P {{ t.protein }} · K {{ t.carb }} · Y {{ t.fat }}. Kalori aşağıdaki ölçülerden hesaplandı.</p>
    <div class="seg" role="group" aria-label="Kaç kişilik" style="margin: 10px 0">
      <button v-for="s in SERVINGS" :key="s" type="button" :aria-pressed="n === s" @click="n = s">{{ s === 1 ? 'Benim porsiyonum' : `${s} porsiyon` }}</button>
    </div>
    <section v-if="lines.length" class="card">
      <h2>Malzemeler</h2>
      <ul class="ings">
        <li v-for="l in lines" :key="l.id"><span>{{ l.name }}</span><span class="amt num">{{ l.amount }}</span></li>
      </ul>
      <p class="small muted">Tuz, baharat ve su ölçüye dahil değil (kalorisi yok).</p>
    </section>
    <template v-if="detail">
      <section class="card">
        <div class="meta small">
          <span>⏱ Hazırlık {{ detail.time.prep }} dk</span>
          <span v-if="detail.time.cook">🔥 Pişirme {{ detail.time.cook }} dk</span>
          <span>Toplam ≈{{ totalTime }} dk</span>
        </div>
        <p v-if="detail.tools" class="small muted">🍳 {{ detail.tools }}</p>
      </section>
      <section class="card">
        <h2>Hazırlık</h2>
        <ul class="prep"><li v-for="s in detail.prep" :key="s">{{ fill(s) }}</li></ul>
      </section>
      <section class="card">
        <h2>Yapılışı</h2>
        <ol class="steps"><li v-for="s in detail.steps" :key="s">{{ fill(s) }}</li></ol>
        <p v-if="detail.serve" class="small"><strong>Servis:</strong> {{ detail.serve }}</p>
        <p v-if="detail.keeps" class="small muted"><strong>Saklama:</strong> {{ detail.keeps }}</p>
        <p v-for="t in detail.tips ?? []" :key="t" class="tip small">💡 {{ t }}</p>
      </section>
    </template>
    <section v-else-if="method" class="card">
      <h2>Yapılışı</h2>
      <ol class="steps"><li v-for="s in method.steps" :key="s">{{ s }}</li></ol>
      <p v-if="method.tip" class="tip small">💡 {{ method.tip }}</p>
    </section>
  </SheetPanel>
</template>

<style scoped>
.ings { list-style: none; padding: 0; margin: 0; }
.ings li { display: flex; justify-content: space-between; gap: 10px; padding: 6px 0; }
.ings li + li { border-top: 1px solid var(--line); }
.amt { color: var(--accent); font-weight: 650; text-align: right; }
.steps { padding-left: 1.2em; display: grid; gap: 6px; }
.prep { padding-left: 1.1em; display: grid; gap: 6px; }
.meta { display: flex; flex-wrap: wrap; gap: 6px 14px; font-weight: 650; }
.tip { margin-top: 8px; }
.tip { background: var(--accent-soft); border-radius: 10px; padding: 8px 10px; }
</style>
