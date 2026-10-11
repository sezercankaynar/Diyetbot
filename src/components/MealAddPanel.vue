<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { dayTotals, getFood, mealTitle, mealTotals, placeDish, portionText, searchFoods, type Food, type Slot } from '@/engine'
import { useAppStore } from '@/stores/app'
import SheetPanel from './SheetPanel.vue'
import FoodRow from './FoodRow.vue'
import RecipeBuilder from './RecipeBuilder.vue'

// Puts a dish the user searched for (or built) into one menu meal.
const props = defineProps<{ date: string; slot: Slot; title: string }>()
const emit = defineEmits<{ close: [] }>()
const store = useAppStore()

const query = ref('')
const input = ref<HTMLInputElement | null>(null)
onMounted(() => nextTick(() => input.value?.focus()))

const current = computed(() =>
  store.menu?.days.find((d) => d.date === props.date)?.items.find((i) => i.slot === props.slot),
)
const results = computed(() => {
  void store.customFoods.length // re-run when a dish is saved
  return searchFoods(query.value, 25).filter((f) => f.id !== current.value?.foodId)
})

// The picked dish in the user's portion; other meals may shrink to make room, but it's always added.
const picked = ref<string | null>(null)
const factor = ref(1)
const PORTIONS = [0.5, 0.75, 1, 1.5, 2, 3]
const isToday = computed(() => props.date === store.todayDate)
const eaten = ref(false)
// Replace the plate, or add the dish next to what's on it (so a meal can be built item by item).
const append = ref(false)
const added = ref<string[]>([])
const placed = computed(() =>
  picked.value && store.menu && store.menuCtx
    ? placeDish(store.menu, store.menuCtx, props.date, props.slot, picked.value, {
        factor: factor.value, locked: store.eatenSlotsOn(props.date), append: append.value,
      })
    : null,
)
// Day totals after adding: the menu day (meal mode) or what's eaten today (extra mode).
const after = computed(() => {
  if (!picked.value) return null
  const d = placed.value?.menu.days.find((x) => x.date === props.date)
  return d ? dayTotals(d) : null
})
const overBy = computed(() => {
  const t = after.value
  const c = store.menuCtx
  if (!t || !c || !placed.value?.over) return []
  const out: string[] = []
  if (t.kcal > c.kcal) out.push(`${t.kcal - c.kcal} kcal`)
  if (t.protein > c.proteinG) out.push(`protein ${t.protein - c.proteinG} g`)
  if (c.carbG !== undefined && t.carb > c.carbG) out.push(`karbonhidrat ${t.carb - c.carbG} g`)
  if (c.fatG !== undefined && t.fat > c.fatG) out.push(`yağ ${t.fat - c.fatG} g`)
  return out
})
function pick(id: string) {
  picked.value = id
  factor.value = getFood(id)?.defaultFactor ?? 1
  eaten.value = isToday.value
  manual.value = false
  // On a plate the user is building (or after the first dish here), the next ones join it.
  append.value = added.value.length > 0 || !!current.value?.own
}
async function confirmPick() {
  if (!picked.value || !placed.value) return
  await store.addToMenu(props.date, props.slot, picked.value, factor.value, eaten.value, append.value)
  added.value.push(getFood(picked.value)?.name ?? '')
  picked.value = null
  query.value = ''
  nextTick(() => input.value?.focus())
}

// Not in the list: build the dish from ingredients (RecipeBuilder); it's saved and picked.
const manual = ref(false)
function openManual() {
  manual.value = true
  picked.value = null
}
async function saveManual(food: Food) {
  await store.saveCustomFood(food)
  manual.value = false
  pick(food.id)
}
</script>

<template>
  <SheetPanel :title="title" @close="emit('close')">
    <p class="small muted">
      Yediğin ya da yemek istediğin şeyleri tek tek ara ve ekle; bir öğüne istediğin kadar yemek koyabilirsin. Kalorisi ve değerleri hazır gelir.
    </p>
    <div v-if="current" class="now small">
      <span class="label">Şu an bu öğünde</span>
      <div>{{ mealTitle(current) }} · <span class="num">{{ mealTotals(current).kcal }} kcal</span></div>
    </div>
    <div v-if="added.length" class="done-row">
      <span class="small ok" role="status">Eklendi ✓ Başka bir şey de ekleyebilirsin.</span>
      <button type="button" class="btn small" @click="emit('close')">Bitti</button>
    </div>

    <input ref="input" v-model="query" type="search" placeholder="Ör. tavuklu pilav, mercimek çorbası, lahmacun" aria-label="Yemek ara" @input="picked = null" />

    <section v-if="picked && placed" class="card picked">
      <FoodRow :food-id="picked" :factor="factor" />
      <div class="label" style="margin-top: 10px">Ne kadar?</div>
      <div class="chips">
        <button v-for="x in PORTIONS" :key="x" type="button" :aria-pressed="x === factor" @click="factor = x">{{ portionText(x) }}</button>
      </div>
      <div v-if="current" class="mode">
        <button type="button" :aria-pressed="!append" @click="append = false">Tabağın yerine koy</button>
        <button type="button" :aria-pressed="append" @click="append = true">Tabağa ekle</button>
      </div>
      <label v-if="isToday" class="check"><input v-model="eaten" type="checkbox" /><span>Bunu yedim (bugünün kaydına da ekle)</span></label>
      <p class="small muted">
        Gün toplamı: <strong>{{ after?.kcal }}</strong> / {{ store.menuCtx?.kcal }} kcal
        <template v-if="placed?.shrunk"> · yer açmak için günün henüz yenmemiş diğer öğünleri küçültülecek</template>
      </p>
      <p v-if="overBy.length" class="small over">
        Bu yemekle günün hedefi aşılıyor ({{ overBy.join(', ') }}). Yine de ekleyebilirsin: yediğini doğru kaydetmek önemli.
        Bir günlük aşım sorun değil; önemli olan haftalık ortalama.
      </p>
      <div class="row">
        <button type="button" class="btn ghost small" @click="picked = null">Geri</button>
        <button type="button" class="btn" @click="confirmPick">{{ overBy.length ? 'Yine de ekle' : append ? 'Tabağa ekle' : 'Menüye koy' }}</button>
      </div>
    </section>

    <template v-if="!picked && !manual">
      <ul v-if="results.length" class="results">
        <li v-for="f in results" :key="f.id">
          <button type="button" @click="pick(f.id)"><FoodRow :food-id="f.id" :factor="1" compact /></button>
        </li>
      </ul>
      <p v-else-if="query.trim()" class="small muted">Bulunamadı.</p>
      <button type="button" class="btn ghost wide" @click="openManual">＋ Yemek ekle (malzemelerden)</button>
    </template>

    <RecipeBuilder v-if="manual" :initial-name="query.trim()" :slot="slot" save-label="Kaydet ve seç" @save="saveManual" @cancel="manual = false" />
  </SheetPanel>
</template>

<style scoped>
.results { list-style: none; padding: 0; margin: 10px 0; background: var(--surface); border-radius: 14px; overflow: hidden; box-shadow: var(--shadow); }
.results li + li { border-top: 1px solid var(--line); }
.results button { width: 100%; padding: 10px 12px; background: none; border: 0; font: inherit; color: inherit; text-align: left; cursor: pointer; }
.picked { margin-top: 12px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0 10px; }
.chips button { border: 0; border-radius: 999px; padding: 6px 11px; font: inherit; font-size: 0.82rem; font-weight: 650; background: var(--surface-2); color: var(--ink-2); cursor: pointer; }
.chips button[aria-pressed='true'] { background: var(--accent); color: var(--accent-ink); }
.over { background: var(--warn-bg); color: var(--warn-ink); border-radius: 10px; padding: 8px 10px; }
.row { display: flex; justify-content: space-between; gap: 8px; margin-top: 10px; }
.wide { width: 100%; margin-top: 6px; }
.now { background: var(--surface); border-radius: 12px; padding: 8px 10px; margin: 8px 0; box-shadow: var(--shadow); }
.done-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin: 8px 0; }
.ok { color: var(--accent); font-weight: 650; }
.mode { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; }
.mode button { border: 1px solid var(--line); border-radius: 12px; padding: 8px; font: inherit; font-size: 0.82rem; font-weight: 650; background: var(--surface); color: var(--ink-2); cursor: pointer; }
.mode button[aria-pressed='true'] { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
.warn { color: var(--stop-border); }
.ing { box-shadow: none; background: var(--surface-2); }
.ing-btn { display: flex; justify-content: space-between; gap: 8px; }
.line { padding: 10px 0; border-bottom: 1px solid var(--line); }
.line-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.line-name { font-weight: 650; }
.line-ctrl { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
.line-ctrl input { max-width: 110px; }
.units { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.unit { border: 0; border-radius: 999px; padding: 4px 10px; font: inherit; font-size: 0.78rem; background: var(--accent-soft); color: var(--accent); cursor: pointer; }
.per { margin-top: 12px; background: var(--accent-soft); border-radius: 14px; padding: 12px; }
.per-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 4px; }
</style>
