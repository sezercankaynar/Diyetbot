<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { dayTotals, foodFromValues, getFood, isSnackSlot, placeDish, portionText, searchFoods, type Slot } from '@/engine'
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

// Not in the list: type the values of one portion.
const manual = ref(false)
const v = ref({ name: '', kcal: NaN, protein: NaN, carb: NaN, fat: NaN })
const manualOk = computed(
  () => v.value.name.trim() !== '' && v.value.kcal > 0 && [v.value.protein, v.value.carb, v.value.fat].every((x) => x >= 0),
)
function openManual() {
  manual.value = true
  picked.value = null
  v.value = { name: query.value.trim(), kcal: NaN, protein: NaN, carb: NaN, fat: NaN }
}
async function saveManual() {
  if (!manualOk.value) return
  const slot: Slot = isSnackSlot(props.slot) ? 'snack' : props.slot
  // Saved for search only: menus won't suggest it by themselves.
  const food = foodFromValues({ ...v.value, slots: [slot], kind: 'hearty', noMenu: true }, Date.now().toString(36))
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
      <button v-if="query.trim()" type="button" class="btn ghost wide" @click="openManual">Listede yok mu? Değerlerini kendin gir</button>
    </template>

    <section v-if="manual" class="card">
      <p class="small muted">Bir porsiyonun değerlerini yaz (ör. paketin etiketi ya da başka bir uygulama). Sonraki aramalarda da çıkar.</p>
      <label class="field"><span class="label">Yemeğin adı</span><input v-model="v.name" type="text" /></label>
      <div class="row2">
        <label class="field"><span class="label">Kalori (kcal)</span><input v-model.number="v.kcal" type="number" inputmode="decimal" /></label>
        <label class="field"><span class="label">Protein (g)</span><input v-model.number="v.protein" type="number" inputmode="decimal" /></label>
        <label class="field"><span class="label">Karbonhidrat (g)</span><input v-model.number="v.carb" type="number" inputmode="decimal" /></label>
        <label class="field"><span class="label">Yağ (g)</span><input v-model.number="v.fat" type="number" inputmode="decimal" /></label>
      </div>
      <div class="row">
        <button type="button" class="btn ghost small" @click="manual = false">Vazgeç</button>
        <button type="button" class="btn" :disabled="!manualOk" @click="saveManual">Kaydet ve seç</button>
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
</style>
