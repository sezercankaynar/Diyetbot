<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  foodFromRecipe, INGREDIENTS, ingredientById, recipeTotals, searchIngredients, validateRecipe, type Food, type RecipeLine, type Slot,
} from '@/engine'

/**
 * Builds (or edits) a dish from ingredients and grams; kcal and macros come from the ingredient table.
 * Foods without a recipe (packaged products, typed-in values) are edited as plain values.
 */
const props = defineProps<{ edit?: Food | null; initialName?: string; slot?: Slot; saveLabel?: string }>()
const emit = defineEmits<{ save: [food: Food]; cancel: [] }>()

const byValues = !!props.edit && !props.edit.recipe
const name = ref(props.edit?.name ?? props.initialName ?? '')
const servings = ref(props.edit?.recipe?.servings ?? 1)
const lines = ref<RecipeLine[]>(props.edit?.recipe?.lines.map((l) => ({ ...l })) ?? [])
const v = ref({ kcal: props.edit?.kcal ?? NaN, protein: props.edit?.protein ?? NaN, carb: props.edit?.carb ?? NaN, fat: props.edit?.fat ?? NaN })

const iq = ref('')
const ingResults = computed(() => searchIngredients(iq.value, INGREDIENTS))
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
const foodSlot = (): Slot => (!props.slot || props.slot === 'snack' || props.slot === 'night' ? 'snack' : props.slot)
const errors = computed(() =>
  byValues
    ? [
        ...(!name.value.trim() ? ['Adını yaz'] : []),
        ...(!(v.value.kcal > 0) ? ['Kaloriyi gir'] : []),
        ...([v.value.protein, v.value.carb, v.value.fat].some((x) => !(x >= 0)) ? ['Protein, karbonhidrat ve yağı gir (bilmiyorsan 0)'] : []),
      ]
    : validateRecipe({ name: name.value, lines: lines.value, servings: servings.value, slots: [foodSlot()], kind: 'hearty' }),
)

function save() {
  if (errors.value.length) return
  const old = props.edit
  if (byValues && old) {
    emit('save', { ...old, name: name.value.trim(), kcal: Math.round(v.value.kcal), protein: v.value.protein, carb: v.value.carb, fat: v.value.fat })
    return
  }
  // Saved for search; menus don't suggest it by themselves. Editing keeps the id (diary entries stay linked).
  const made = foodFromRecipe(
    { name: name.value, lines: lines.value, servings: servings.value, slots: old?.slots.length ? old.slots : [foodSlot()], kind: old?.kind === 'light' ? 'light' : 'hearty', noMenu: old ? !!old.noMenu : true },
    Date.now().toString(36),
  )
  emit('save', old ? { ...made, id: old.id } : made)
}
</script>

<template>
  <section class="card">
    <h2>{{ edit ? 'Düzenle' : 'Yemek ekle' }}</h2>
    <p v-if="!byValues" class="small muted">Malzemeleri ve miktarlarını seç; kalori ve makrolar malzeme tablosundan (USDA / TürKomp) hesaplanır.</p>
    <label class="field"><span class="label">Adı</span><input v-model="name" type="text" placeholder="Ör. Annemin tavuklu pilavı" /></label>

    <template v-if="byValues">
      <p class="small muted">1 porsiyonun değerleri ({{ edit?.portion }}).</p>
      <div class="row2">
        <label class="field"><span class="label">Kalori (kcal)</span><input v-model.number="v.kcal" type="number" inputmode="decimal" /></label>
        <label class="field"><span class="label">Protein (g)</span><input v-model.number="v.protein" type="number" inputmode="decimal" /></label>
        <label class="field"><span class="label">Karbonhidrat (g)</span><input v-model.number="v.carb" type="number" inputmode="decimal" /></label>
        <label class="field"><span class="label">Yağ (g)</span><input v-model.number="v.fat" type="number" inputmode="decimal" /></label>
      </div>
    </template>

    <template v-else>
      <label class="field"><span class="label">Bu miktar kaç porsiyon?</span>
        <input v-model.number="servings" type="number" inputmode="numeric" min="1" max="30" /></label>
      <div class="field">
        <span class="label">Malzemeler</span>
        <input v-model="iq" type="search" placeholder="Malzeme ara: pirinç, tavuk, tereyağı…" aria-label="Malzeme ara" />
        <ul v-if="ingResults.length" class="results">
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
    </template>

    <ul v-if="errors.length && (name || lines.length)" class="small warn"><li v-for="e in errors" :key="e">{{ e }}</li></ul>
    <div class="row">
      <button type="button" class="btn ghost small" @click="emit('cancel')">Vazgeç</button>
      <button type="button" class="btn" :disabled="errors.length > 0" @click="save">{{ saveLabel ?? 'Kaydet' }}</button>
    </div>
  </section>
</template>

<style scoped>
.results { list-style: none; padding: 0; margin: 6px 0 0; background: var(--surface-2); border-radius: 12px; overflow: hidden; }
.results li + li { border-top: 1px solid var(--line); }
.ing-btn { width: 100%; display: flex; justify-content: space-between; gap: 8px; padding: 10px 12px; background: none; border: 0; font: inherit; color: inherit; text-align: left; cursor: pointer; }
.line { padding: 10px 0; border-bottom: 1px solid var(--line); }
.line-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.line-name { font-weight: 650; }
.line-ctrl { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
.line-ctrl input { max-width: 110px; }
.units { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.unit { border: 0; border-radius: 999px; padding: 4px 10px; font: inherit; font-size: 0.78rem; background: var(--accent-soft); color: var(--accent); cursor: pointer; }
.per { margin-top: 12px; background: var(--accent-soft); border-radius: 14px; padding: 12px; }
.per-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 4px; }
.row { display: flex; justify-content: space-between; gap: 8px; margin-top: 10px; }
.warn { color: var(--stop-border); }
</style>
