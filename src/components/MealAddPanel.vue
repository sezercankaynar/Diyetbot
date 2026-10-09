<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import {
  dayTotals, foldTr, foodFromRecipe, getFood, INGREDIENTS, ingredientById, isSnackSlot, placeDish, portionText, recipeTotals,
  searchFoods, stems, validateRecipe, type RecipeLine, type Slot,
} from '@/engine'
import { useAppStore } from '@/stores/app'
import SheetPanel from './SheetPanel.vue'
import FoodRow from './FoodRow.vue'

const props = defineProps<{ date: string; slot: Slot; title: string }>()
const emit = defineEmits<{ close: [] }>()
const store = useAppStore()

const query = ref('')
const input = ref<HTMLInputElement | null>(null)
onMounted(() => nextTick(() => input.value?.focus()))

const current = computed(() => store.menu?.days.find((d) => d.date === props.date)?.items.find((i) => i.slot === props.slot))
const results = computed(() => {
  void store.customFoods.length // re-run when a dish is saved
  return searchFoods(query.value, 25).filter((f) => f.id !== current.value?.foodId)
})

// The picked dish, placed so the day stays inside its targets.
const picked = ref<string | null>(null)
const placed = computed(() =>
  picked.value && store.menu && store.menuCtx ? placeDish(store.menu, store.menuCtx, props.date, props.slot, picked.value) : null,
)
const after = computed(() => {
  const d = placed.value?.menu.days.find((x) => x.date === props.date)
  return d ? dayTotals(d) : null
})
function pick(id: string) {
  picked.value = id
  manual.value = false
}
async function confirmPick() {
  if (!picked.value || !placed.value) return
  await store.addToMenu(props.date, props.slot, picked.value)
  emit('close')
}

// Not in the list: build the dish from ingredients and amounts; values are computed from the ingredient table.
const manual = ref(false)
const name = ref('')
const servings = ref(1)
const lines = ref<RecipeLine[]>([])
const iq = ref('')
const ingResults = computed(() => {
  const words = foldTr(iq.value.trim()).split(/\s+/).filter(Boolean)
  if (!words.length) return []
  return INGREDIENTS.filter((i) => {
    const n = foldTr(i.name)
    return words.every((w) => stems(w).some((x) => n.includes(x)))
  }).slice(0, 12)
})
function addIng(id: string) {
  const ing = ingredientById(id)
  lines.value.push({ ingredientId: id, grams: ing?.units?.[0]?.grams ?? 100 })
  iq.value = ''
}
const totals = computed(() => recipeTotals(lines.value))
const per = computed(() => {
  const n = Math.max(1, servings.value || 1)
  const t = totals.value
  return { kcal: Math.round(t.kcal / n), protein: Math.round(t.protein / n), carb: Math.round(t.carb / n), fat: Math.round(t.fat / n) }
})
const foodSlot = (): Slot => (isSnackSlot(props.slot) ? 'snack' : props.slot)
const recipeErrors = computed(() => validateRecipe({ name: name.value, lines: lines.value, servings: servings.value, slots: [foodSlot()], kind: 'hearty' }))
function openManual() {
  manual.value = true
  picked.value = null
  name.value = query.value.trim()
  lines.value = []
  servings.value = 1
}
async function saveManual() {
  if (recipeErrors.value.length) return
  // Saved for search: menus won't suggest it by themselves.
  const food = foodFromRecipe(
    { name: name.value, lines: lines.value, servings: servings.value, slots: [foodSlot()], kind: 'hearty', noMenu: true },
    Date.now().toString(36),
  )
  await store.saveCustomFood(food)
  manual.value = false
  pick(food.id)
}
</script>

<template>
  <SheetPanel :title="title" @close="emit('close')">
    <p class="small muted">
      Menü dışında yemek istediğin bir şeyi ara ve seç. Kalorisi ve değerleri hazır gelir.
      <template v-if="current"> Seçtiğin yemek <strong>{{ getFood(current.foodId)?.name }}</strong> yerine geçer.</template>
    </p>

    <input ref="input" v-model="query" type="search" placeholder="Ör. tavuklu pilav, mercimek çorbası, lahmacun" aria-label="Yemek ara" @input="picked = null" />

    <section v-if="picked && placed" class="card picked">
      <FoodRow :food-id="picked" :factor="placed.factor" />
      <p class="small muted">
        Gün toplamı: <strong>{{ after?.kcal }}</strong> / {{ store.menuCtx?.kcal }} kcal
        <template v-if="placed.factor < 1"> · günün hedefini aşmaması için {{ portionText(placed.factor) }}</template>
        <template v-if="placed.shrunk"> · sığması için günün diğer öğünleri biraz küçültülecek</template>
      </p>
      <div class="row">
        <button type="button" class="btn ghost small" @click="picked = null">Geri</button>
        <button type="button" class="btn" @click="confirmPick">Menüye koy</button>
      </div>
    </section>
    <p v-else-if="picked" class="small warn">Bu yemek o günün kalori/makro hedefine sığmıyor. Daha hafif bir şey seç.</p>

    <template v-if="!picked && !manual">
      <ul v-if="results.length" class="results">
        <li v-for="f in results" :key="f.id">
          <button type="button" @click="pick(f.id)"><FoodRow :food-id="f.id" :factor="1" compact /></button>
        </li>
      </ul>
      <p v-else-if="query.trim()" class="small muted">Bulunamadı.</p>
      <button type="button" class="btn ghost wide" @click="openManual">＋ Yemek ekle (malzemelerden)</button>
    </template>

    <section v-if="manual" class="card">
      <h2>Yemek ekle</h2>
      <p class="small muted">Malzemeleri ve miktarlarını seç; kalori ve makrolar malzeme tablosundan (USDA / TürKomp) hesaplanır. Yemek kaydedilir, sonraki aramalarda da çıkar.</p>
      <label class="field"><span class="label">Yemeğin adı</span><input v-model="name" type="text" placeholder="Ör. Annemin tavuklu pilavı" /></label>
      <label class="field"><span class="label">Bu miktar kaç porsiyon?</span>
        <input v-model.number="servings" type="number" inputmode="numeric" min="1" max="30" /></label>
      <div class="field">
        <span class="label">Malzemeler</span>
        <input v-model="iq" type="search" placeholder="Malzeme ara: pirinç, tavuk, tereyağı…" aria-label="Malzeme ara" />
        <ul v-if="ingResults.length" class="results ing">
          <li v-for="i in ingResults" :key="i.id">
            <button type="button" class="ing-btn" @click="addIng(i.id)">
              <span>{{ i.name }}</span><span class="small muted num">{{ i.kcal }} kcal/100 g</span>
            </button>
          </li>
        </ul>
      </div>
      <div v-for="(l, idx) in lines" :key="idx" class="line">
        <div class="line-top">
          <span class="line-name">{{ ingredientById(l.ingredientId)?.name }}</span>
          <button type="button" class="btn danger small" :aria-label="`${ingredientById(l.ingredientId)?.name} çıkar`" @click="lines.splice(idx, 1)">✕</button>
        </div>
        <div class="line-ctrl">
          <input v-model.number="l.grams" type="number" inputmode="decimal" min="0" :aria-label="`${ingredientById(l.ingredientId)?.name} gram`" />
          <span class="small muted">g</span>
          <span class="small muted num">{{ Math.round(((ingredientById(l.ingredientId)?.kcal ?? 0) * (l.grams || 0)) / 100) }} kcal</span>
        </div>
        <div v-if="ingredientById(l.ingredientId)?.units?.length" class="units">
          <button v-for="u in ingredientById(l.ingredientId)!.units" :key="u.label" type="button" class="unit" @click="l.grams = u.grams">{{ u.label }}</button>
        </div>
      </div>
      <div v-if="lines.length" class="per">
        <div class="label">1 porsiyon</div>
        <div class="per-row num">
          <strong>{{ per.kcal }} kcal</strong>
          <span>P {{ per.protein }} g</span><span>K {{ per.carb }} g</span><span>Y {{ per.fat }} g</span>
        </div>
      </div>
      <ul v-if="recipeErrors.length && (name || lines.length)" class="small warn"><li v-for="e in recipeErrors" :key="e">{{ e }}</li></ul>
      <div class="row">
        <button type="button" class="btn ghost small" @click="manual = false">Vazgeç</button>
        <button type="button" class="btn" :disabled="recipeErrors.length > 0" @click="saveManual">Kaydet ve seç</button>
      </div>
    </section>
  </SheetPanel>
</template>

<style scoped>
.results { list-style: none; padding: 0; margin: 10px 0; background: var(--surface); border-radius: 14px; overflow: hidden; box-shadow: var(--shadow); }
.results li + li { border-top: 1px solid var(--line); }
.results button { width: 100%; padding: 10px 12px; background: none; border: 0; font: inherit; color: inherit; text-align: left; cursor: pointer; }
.picked { margin-top: 12px; }
.row { display: flex; justify-content: space-between; gap: 8px; margin-top: 10px; }
.wide { width: 100%; margin-top: 6px; }
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
