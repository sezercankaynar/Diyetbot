<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  foodFromRecipe, foodFromValues, INGREDIENTS, ingredientById, recipeTotals, validateRecipe,
  type RecipeLine, type Slot,
} from '@/engine'
import { useAppStore } from '@/stores/app'
import SheetPanel from './SheetPanel.vue'
import SegControl from './SegControl.vue'

const emit = defineEmits<{ close: [] }>()
const store = useAppStore()

const mode = ref<'recipe' | 'values'>('recipe')
const name = ref('')
const servings = ref(4)
const lines = ref<RecipeLine[]>([])
const kind = ref<'light' | 'hearty'>('hearty')
const inMenu = ref(true)
const eatNow = ref<number>(1) // portions eaten now (0 = just save)
const saved = ref('')

// Quick values
const v = ref({ kcal: NaN, protein: NaN, carb: NaN, fat: NaN })

// Ingredient search
const q = ref('')
const norm = (x: string) => x.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '')
const results = computed(() => {
  const words = norm(q.value.trim()).split(/\s+/).filter(Boolean)
  if (!words.length) return []
  return INGREDIENTS.filter((i) => words.every((w) => norm(i.name).includes(w))).slice(0, 12)
})
function addIng(id: string) {
  const ing = ingredientById(id)
  lines.value.push({ ingredientId: id, grams: ing?.units?.[0]?.grams ?? 100 })
  q.value = ''
}

const totals = computed(() => recipeTotals(lines.value))
const per = computed(() => {
  const n = Math.max(1, servings.value || 1)
  const t = totals.value
  return { kcal: Math.round(t.kcal / n), protein: Math.round(t.protein / n), carb: Math.round(t.carb / n), fat: Math.round(t.fat / n) }
})
const slots = computed<Slot[]>(() => (inMenu.value ? ['lunch', 'dinner'] : []))
const errors = computed(() =>
  mode.value === 'recipe'
    ? validateRecipe({ name: name.value, lines: lines.value, servings: servings.value, slots: slots.value, kind: kind.value })
    : [
        ...(!name.value.trim() ? ['Yemeğin adını yaz'] : []),
        ...(!(v.value.kcal > 0) ? ['Kaloriyi gir'] : []),
        ...([v.value.protein, v.value.carb, v.value.fat].some((x) => !(x >= 0)) ? ['Protein, karbonhidrat ve yağı gir (bilmiyorsan 0)'] : []),
      ],
)

async function save() {
  if (errors.value.length) return
  const uid = Date.now().toString(36)
  const food =
    mode.value === 'recipe'
      ? foodFromRecipe({ name: name.value, lines: lines.value, servings: servings.value, slots: slots.value, kind: kind.value }, uid)
      : foodFromValues({ name: name.value, ...v.value, slots: slots.value, kind: kind.value }, uid)
  await store.saveCustomFood(food)
  if (inMenu.value) await store.rateDish(food.id, 'like')
  if (eatNow.value > 0) await store.logFoods([{ foodId: food.id, factor: eatNow.value }])
  saved.value = `"${food.name}" kaydedildi${eatNow.value > 0 ? ' ve bugüne eklendi' : ''}.`
}

const KIND = [{ value: 'hearty' as const, label: 'Doyurucu ana yemek' }, { value: 'light' as const, label: 'Hafif' }]
const EAT = [{ value: 0, label: 'Sadece kaydet' }, { value: 1, label: '1 porsiyon yedim' }, { value: 1.5, label: '1,5' }, { value: 2, label: '2' }]
const myFoods = computed(() => store.customFoods.filter((f) => f.id.startsWith('ev-')))
</script>

<template>
  <SheetPanel title="Kendi yemeğim" @close="emit('close')">
    <p v-if="saved" class="ok" role="status">✓ {{ saved }}</p>

    <div class="seg" role="group" aria-label="Yöntem" style="margin-bottom: 12px">
      <button type="button" :aria-pressed="mode === 'recipe'" @click="mode = 'recipe'">Malzemelerden hesapla</button>
      <button type="button" :aria-pressed="mode === 'values'" @click="mode = 'values'">Değerleri biliyorum</button>
    </div>

    <section class="card">
      <label class="field"><span class="label">Yemeğin adı</span>
        <input v-model="name" type="text" placeholder="Ör. Annemin kuru fasulyesi" /></label>

      <template v-if="mode === 'recipe'">
        <label class="field"><span class="label">Tencerenin tamamı kaç porsiyon?</span>
          <input v-model.number="servings" type="number" inputmode="numeric" min="1" max="30" /></label>

        <div class="field">
          <span class="label">Malzemeler</span>
          <input v-model="q" type="text" placeholder="Malzeme ara: kıyma, soğan, bulgur…" aria-label="Malzeme ara" />
          <ul v-if="results.length" class="results">
            <li v-for="i in results" :key="i.id">
              <button type="button" @click="addIng(i.id)">
                <span>{{ i.name }}</span><span class="small muted num">{{ i.kcal }} kcal/100 g</span>
              </button>
            </li>
          </ul>
        </div>

        <div v-for="(l, idx) in lines" :key="idx" class="line">
          <div class="line-name">{{ ingredientById(l.ingredientId)?.name }}</div>
          <div class="line-ctrl">
            <input v-model.number="l.grams" type="number" inputmode="decimal" min="0" :aria-label="`${ingredientById(l.ingredientId)?.name} gram`" />
            <span class="small muted">g</span>
            <button type="button" class="btn danger small" aria-label="Çıkar" @click="lines.splice(idx, 1)">✕</button>
          </div>
          <div v-if="ingredientById(l.ingredientId)?.units?.length" class="units">
            <button
              v-for="u in ingredientById(l.ingredientId)!.units" :key="u.label" type="button" class="unit"
              @click="l.grams = u.grams"
            >{{ u.label }}</button>
          </div>
        </div>

        <div v-if="lines.length" class="per">
          <div class="label">1 porsiyon</div>
          <div class="per-row num">
            <strong>{{ per.kcal }} kcal</strong>
            <span class="macro-p">P {{ per.protein }} g</span>
            <span class="macro-c">K {{ per.carb }} g</span>
            <span class="macro-f">Y {{ per.fat }} g</span>
          </div>
          <div class="small muted">Tencerenin tamamı: {{ totals.kcal }} kcal · {{ totals.grams }} g çiğ malzeme</div>
        </div>
      </template>

      <template v-else>
        <p class="small muted">Bir porsiyonun değerlerini yaz (ör. başka bir uygulamadan ya da tariften).</p>
        <div class="row2">
          <label class="field"><span class="label">Kalori (kcal)</span><input v-model.number="v.kcal" type="number" inputmode="decimal" /></label>
          <label class="field"><span class="label">Protein (g)</span><input v-model.number="v.protein" type="number" inputmode="decimal" /></label>
          <label class="field"><span class="label">Karbonhidrat (g)</span><input v-model.number="v.carb" type="number" inputmode="decimal" /></label>
          <label class="field"><span class="label">Yağ (g)</span><input v-model.number="v.fat" type="number" inputmode="decimal" /></label>
        </div>
      </template>
    </section>

    <section class="card">
      <div class="field" style="margin-top: 0"><span class="label">Bu yemek</span><SegControl v-model="kind" :options="KIND" label="Tür" /></div>
      <label class="check" style="margin-top: 8px">
        <input v-model="inMenu" type="checkbox" />
        <span>Haftalık menülerimde de öner</span>
      </label>
      <div class="field"><span class="label">Şimdi</span><SegControl v-model="eatNow" :options="EAT" label="Şimdi" /></div>
    </section>

    <ul v-if="errors.length && (name || lines.length)" class="errs small"><li v-for="e in errors" :key="e">{{ e }}</li></ul>
    <button type="button" class="btn wide" :disabled="errors.length > 0" @click="save">Kaydet</button>

    <section v-if="myFoods.length" class="card" style="margin-top: 16px">
      <h2>Kayıtlı yemeklerim</h2>
      <div v-for="f in myFoods" :key="f.id" class="mine">
        <div>
          <div class="line-name">{{ f.name }}</div>
          <div class="small muted num">{{ f.kcal }} kcal · P {{ Math.round(f.protein) }} · K {{ Math.round(f.carb) }} · Y {{ Math.round(f.fat) }}</div>
        </div>
        <button type="button" class="btn ghost small" @click="store.logFoods([{ foodId: f.id, factor: 1 }]); saved = `${f.name} bugüne eklendi.`">Yedim</button>
      </div>
      <p class="small muted">Kayıtlı yemeklerin "Yiyebilir miyim?" aramasında da çıkar.</p>
    </section>
  </SheetPanel>
</template>

<style scoped>
.results { list-style: none; padding: 0; margin: 6px 0 0; background: var(--surface-2); border-radius: 12px; overflow: hidden; }
.results button { width: 100%; display: flex; justify-content: space-between; gap: 8px; padding: 10px 12px; background: none; border: 0; font: inherit; color: inherit; text-align: left; cursor: pointer; }
.results li + li { border-top: 1px solid var(--line); }
.line { padding: 10px 0; border-bottom: 1px solid var(--line); }
.line-name { font-weight: 650; }
.line-ctrl { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
.line-ctrl input { max-width: 110px; }
.units { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.unit { border: 0; border-radius: 999px; padding: 4px 10px; font: inherit; font-size: 0.78rem; background: var(--accent-soft); color: var(--accent); cursor: pointer; }
.per { margin-top: 12px; background: var(--accent-soft); border-radius: 14px; padding: 12px; }
.per-row { display: flex; flex-wrap: wrap; gap: 12px; margin: 4px 0; }
.wide { width: 100%; }
.errs { color: var(--stop-border); }
.ok { background: var(--accent-soft); color: var(--accent); font-weight: 700; padding: 10px 12px; border-radius: 12px; }
.mine { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 8px 0; }
.mine + .mine { border-top: 1px solid var(--line); }
</style>
