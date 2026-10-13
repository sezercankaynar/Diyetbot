<script setup lang="ts">
import { computed, ref } from 'vue'
import { evaluateMeal, getFood, itemTotals, plateName, searchFoods, sumTotals, type CheckItem, type Food, type SavedMeal, type Slot } from '@/engine'
import { useAppStore } from '@/stores/app'
import SheetPanel from './SheetPanel.vue'
import FoodRow from './FoodRow.vue'
import PackagedPanel from './PackagedPanel.vue'
import RecipeBuilder from './RecipeBuilder.vue'

// With a slot, what's saved is logged as that meal (what was eaten instead of / on top of the menu plate).
const props = defineProps<{ title?: string; slot?: Slot }>()
const emit = defineEmits<{ close: [] }>()
const store = useAppStore()

const query = ref('')
const items = ref<CheckItem[]>([])
const saved = ref(false)

const showPackaged = ref(false)
// Not in the list: build it from ingredients; it's saved and put on the plate.
const building = ref(false)
async function saveBuilt(f: Food) {
  await store.saveCustomFood(f)
  building.value = false
  add(f.id)
}
const results = computed(() => {
  void store.customFoods.length // re-run when a product is saved
  return searchFoods(query.value, 30)
})

function add(foodId: string, factor?: number) {
  const existing = items.value.find((i) => i.foodId === foodId)
  const usual = factor ?? getFood(foodId)?.defaultFactor ?? 1
  if (existing) existing.factor += usual
  else items.value.push({ foodId, factor: usual })
  query.value = ''
  saved.value = false
}
// Empty search: saved meals (this meal's first) and the foods the user logs most, one tap each.
const savedList = computed(() =>
  [...store.savedMeals].sort((a, b) => Number(b.slot === props.slot) - Number(a.slot === props.slot)),
)
const mealKcal = (m: SavedMeal) => sumTotals(m.items.map((x) => itemTotals(x.foodId, x.factor))).kcal
function addMeal(m: SavedMeal) {
  for (const x of m.items) if (getFood(x.foodId)) add(x.foodId, x.factor)
}
const quick = computed(() => store.frequent.filter((x) => !items.value.some((i) => i.foodId === x.foodId)))
const shortName = (id: string) => plateName(getFood(id)?.name ?? '')
const mealSaved = ref(false)
async function saveAsMeal() {
  const def = props.slot ? DEFAULT_NAMES[props.slot] : 'Öğünüm'
  const name = prompt('Bu tabağa bir ad ver (sonra tek dokunuşla eklersin):', def)
  if (name === null) return
  await store.saveMeal(name, items.value, props.slot)
  mealSaved.value = true
}
const DEFAULT_NAMES: Record<Slot, string> = {
  breakfast: 'Benim kahvaltım', lunch: 'Benim öğle yemeğim', dinner: 'Benim akşam yemeğim', snack: 'Ara öğünüm', night: 'Gece atıştırmam',
}

const STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 5, 6]
function step(i: CheckItem, dir: 1 | -1) {
  const idx = STEPS.findIndex((x) => x >= i.factor)
  const next = STEPS[Math.max(0, Math.min(STEPS.length - 1, (idx === -1 ? STEPS.length - 1 : idx) + dir))]
  i.factor = next
}
function remove(idx: number) {
  items.value.splice(idx, 1)
}

const ctx = computed(() => {
  const plan = store.plan
  if (!plan.energy || !plan.macros || !plan.recommendedDiet) return null
  return {
    kcalTarget: plan.energy.target,
    proteinTarget: plan.macros.proteinG,
    eaten: store.todayTotals,
    diet: plan.recommendedDiet.id,
    animalFoods: store.profile.animalFoods,
    dislikes: store.profile.dislikes,
  }
})
const result = computed(() => (ctx.value && items.value.length ? evaluateMeal(items.value, ctx.value) : null))

const tone = computed(() => {
  const v = result.value?.verdict
  return v === 'ok' ? 'good' : v === 'over' ? 'bad' : 'warn'
})

function useSmaller() {
  const f = result.value?.suggestedFactor
  if (!f) return
  items.value = items.value.map((i) => ({ ...i, factor: Math.round(i.factor * f * 4) / 4 || 0.25 }))
}
function useAlternative(foodId: string, factor: number) {
  items.value = [{ foodId, factor }]
}
async function eat() {
  await store.logFoods(items.value, props.slot)
  saved.value = true
  items.value = []
  mealSaved.value = false
}
</script>

<template>
  <SheetPanel :title="title ?? 'Ara, değerlendir, kaydet'" @close="emit('close')">
    <template v-if="!ctx">
      <p class="muted">Güvenlik durdurması olduğu için kalori değerlendirmesi yapılmıyor.</p>
    </template>
    <template v-else>
      <p class="small muted">
        <template v-if="slot">Bu öğünde yediklerini tek tek ara ve tabağa ekle (porsiyonu − / + ile değiştir), sonra "Yedim, kaydet" de. Menüdeki tabak yerine bunlar sayılır.</template>
        <template v-else>Yemeğini ara ve tabağa ekle (birden fazla olabilir, porsiyonu − / + ile değiştir). Uygulama yiyip yiyemeyeceğini söyler;
        yediysen "Yedim, kaydet" de.</template>
      </p>
      <input
        v-model="query"
        type="text"
        class="search"
        placeholder="Ör. lahmacun, döner, baklava…"
        aria-label="Yemek ara"
        autocomplete="off"
      />
      <template v-if="!query.trim()">
        <div v-if="savedList.length" class="quick">
          <div class="label">Kayıtlı öğünlerin</div>
          <div class="chips">
            <button v-for="m in savedList" :key="m.id" type="button" class="chip meal" @click="addMeal(m)">
              ⭐ {{ m.name }} <span class="num">· {{ mealKcal(m) }} kcal</span>
            </button>
          </div>
        </div>
        <div v-if="quick.length" class="quick">
          <div class="label">Sık yediklerin</div>
          <div class="chips">
            <button v-for="x in quick" :key="x.foodId" type="button" class="chip" @click="add(x.foodId, x.factor)">＋ {{ shortName(x.foodId) }}</button>
          </div>
        </div>
      </template>
      <ul v-if="results.length" class="results">
        <li v-for="f in results" :key="f.id">
          <button type="button" @click="add(f.id)">
            <span>
              <span v-if="f.brand && f.group !== 'paket'" class="brand">{{ f.brand }}</span>
              {{ f.name }} <span class="small muted">· {{ f.portion }}</span>
            </span>
            <span class="num small">{{ f.kcal }} kcal</span>
          </button>
        </li>
      </ul>
      <p v-else-if="query.trim()" class="small muted">Bulunamadı. Benzer bir yemek dene (ör. "köfte", "pilav") ya da aşağıdan ekle.</p>
      <div class="add-row">
        <button type="button" class="btn ghost small" @click="building = true">＋ Yemek ekle (malzemelerden)</button>
        <button type="button" class="btn ghost small" @click="showPackaged = true">📦 Paketli ürün (barkod / etiket)</button>
      </div>
      <RecipeBuilder v-if="building" :initial-name="query.trim()" save-label="Kaydet ve tabağa ekle" @save="saveBuilt" @cancel="building = false" />

      <p v-if="saved" class="small saved" role="status">Kaydedildi ✓ {{ slot ? 'Bu öğüne eklendi; başka bir şey de ekleyebilirsin.' : `${store.isViewToday ? 'Bugünkü' : 'O günkü'} listene eklendi.` }}</p>

      <section v-if="items.length" class="card" style="margin-top: 12px">
        <div class="plate-head">
          <h2>Tabağın</h2>
          <button v-if="!mealSaved" type="button" class="link" @click="saveAsMeal">⭐ Öğün olarak kaydet</button>
          <span v-else class="small saved">Kaydedildi ⭐</span>
        </div>
        <div v-for="(i, idx) in items" :key="i.foodId" class="item">
          <FoodRow :food-id="i.foodId" :factor="i.factor" compact />
          <div class="item-actions">
            <button type="button" class="btn ghost small" aria-label="Porsiyonu azalt" @click="step(i, -1)">−</button>
            <button type="button" class="btn ghost small" aria-label="Porsiyonu artır" @click="step(i, 1)">+</button>
            <button type="button" class="btn danger small" @click="remove(idx)">Çıkar</button>
          </div>
        </div>
      </section>

      <section v-if="result" class="verdict" :class="tone" role="status">
        <h2>{{ result.title }}</h2>
        <p class="num">
          {{ result.totals.kcal }} kcal ·
          {{ result.macrosKnown ? `${result.totals.protein} g protein` : 'protein bilinmiyor' }}
        </p>
        <p class="small">
          {{ store.isViewToday ? 'Bugün' : 'O gün' }} kalan: <span class="num">{{ result.remainingBefore }}</span> kcal →
          yersen <span class="num">{{ result.remainingAfter }}</span> kcal
        </p>
        <ul v-if="result.reasons.length" class="small">
          <li v-for="r in result.reasons" :key="r">{{ r }}</li>
        </ul>
        <button v-if="result.verdict === 'smaller'" type="button" class="btn small" @click="useSmaller">
          Porsiyonu buna göre küçült
        </button>
      </section>

      <section v-if="result?.tips.length" class="card">
        <h2>İpuçları</h2>
        <ul><li v-for="t in result.tips" :key="t">{{ t }}</li></ul>
      </section>

      <section v-if="result?.alternatives.length" class="card">
        <h2>Bunun yerine</h2>
        <div v-for="a in result.alternatives" :key="a.foodId" class="alt">
          <FoodRow :food-id="a.foodId" :factor="a.factor" compact />
          <button type="button" class="btn ghost small" @click="useAlternative(a.foodId, a.factor)">Bunu seç</button>
        </div>
      </section>

      <div v-if="items.length" class="btn-row">
        <button type="button" class="btn" @click="eat">Yedim, kaydet</button>
      </div>
      <p class="small muted" style="margin-top: 12px">Değerler yaklaşık porsiyonlara göredir.</p>
    </template>
    <PackagedPanel v-if="showPackaged" @close="showPackaged = false" @picked="add" />
  </SheetPanel>
</template>

<style scoped>
.search { font-family: var(--font-body); }
.brand { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--accent); margin-right: 4px; }
.results { list-style: none; padding: 0; margin: 8px 0 0; border: 1px solid var(--rule); border-radius: var(--radius); background: var(--paper-2); max-height: 50vh; overflow-y: auto; }
.results li + li { border-top: 1px dotted var(--rule); }
.results button {
  width: 100%; display: flex; justify-content: space-between; gap: 8px; text-align: left;
  background: none; border: 0; padding: 10px 12px; font: inherit; color: inherit; cursor: pointer;
}
.item, .alt { padding: 8px 0; border-bottom: 1px dotted var(--rule); }
.item:last-child, .alt:last-child { border-bottom: 0; }
.item-actions, .alt .btn { margin-top: 6px; }
.item-actions { display: flex; gap: 6px; }
.verdict { border: 1px solid; border-left-width: 6px; border-radius: var(--radius); padding: 12px; margin-bottom: 14px; }
.verdict.good { background: var(--accent-soft); border-color: var(--accent); }
.verdict.warn { background: var(--warn-bg); border-color: var(--warn-border); color: var(--warn-ink); }
.verdict.bad { background: var(--stop-bg); border-color: var(--stop-border); color: var(--stop-ink); }
.verdict h2 { margin-bottom: 4px; }
.saved { color: var(--accent); margin-top: 8px; }
.quick { margin-top: 10px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.chip { border: 0; border-radius: 999px; padding: 7px 12px; font: inherit; font-size: 0.82rem; font-weight: 650; background: var(--surface); color: var(--ink); box-shadow: var(--shadow); cursor: pointer; }
.chip.meal { background: var(--accent-soft); color: var(--accent); }
.plate-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.link { background: none; border: 0; padding: 0; font: inherit; font-size: 0.85rem; font-weight: 700; color: var(--accent); cursor: pointer; }
.add-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
</style>
