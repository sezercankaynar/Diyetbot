<script setup lang="ts">
import { computed, ref } from 'vue'
import { allFoods, evaluateMeal, type CheckItem } from '@/engine'
import { useAppStore } from '@/stores/app'
import SheetPanel from './SheetPanel.vue'
import FoodRow from './FoodRow.vue'
import PackagedPanel from './PackagedPanel.vue'

const emit = defineEmits<{ close: [] }>()
const store = useAppStore()

const query = ref('')
const items = ref<CheckItem[]>([])
const saved = ref(false)

const norm = (s: string) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '')
const showPackaged = ref(false)
const results = computed(() => {
  void store.customFoods.length // re-run when a product is saved
  const words = norm(query.value.trim()).split(/\s+/).filter(Boolean)
  if (!words.length) return []
  return allFoods()
    .filter((f) => {
      const hay = norm(`${f.name} ${f.brand ?? ''} ${f.portion}`)
      return words.every((w) => hay.includes(w))
    })
    .slice(0, 30)
})

function add(foodId: string) {
  const existing = items.value.find((i) => i.foodId === foodId)
  if (existing) existing.factor += 1
  else items.value.push({ foodId, factor: 1 })
  query.value = ''
  saved.value = false
}
const STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3]
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
  await store.logFoods(items.value)
  saved.value = true
  items.value = []
}
</script>

<template>
  <SheetPanel title="Bunu yiyebilir miyim?" @close="emit('close')">
    <template v-if="!ctx">
      <p class="muted">Güvenlik durdurması olduğu için kalori değerlendirmesi yapılmıyor.</p>
    </template>
    <template v-else>
      <p class="small muted">Yemeğini ara ve ekle. Birden fazla şey ekleyebilir, porsiyonu değiştirebilirsin.</p>
      <input
        v-model="query"
        type="text"
        class="search"
        placeholder="Ör. lahmacun, döner, baklava…"
        aria-label="Yemek ara"
        autocomplete="off"
      />
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
      <p v-else-if="query.trim()" class="small muted">Bulunamadı. Benzer bir yemek dene (ör. "köfte", "pilav") ya da paketli ürünse aşağıdan ekle.</p>
      <button type="button" class="btn ghost small" style="margin-top: 8px" @click="showPackaged = true">
        📦 Paketli ürün ekle (barkod / arama / etiket)
      </button>

      <p v-if="saved" class="small saved" role="status">Kaydedildi ✓ Bugünkü listene eklendi.</p>

      <section v-if="items.length" class="card" style="margin-top: 12px">
        <h2>Tabağın</h2>
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
          {{ result.totals.kcal }} kcal · {{ result.totals.protein }} g protein
        </p>
        <p class="small">
          Bugün kalan: <span class="num">{{ result.remainingBefore }}</span> kcal →
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
</style>
