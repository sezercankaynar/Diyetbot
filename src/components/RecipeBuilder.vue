<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  foodFromRecipe, INGREDIENTS, ingredientById, recipeTotals, searchIngredients, validateRecipe, type Food, type RecipeLine, type Slot,
} from '@/engine'
import { useAppStore } from '@/stores/app'
import { parseRecipe } from '@/ai/recipe'
import { fileToImage, type AiImage } from '@/ai/image'

/**
 * Builds (or edits) a dish from ingredients and grams; kcal and macros come from the ingredient table.
 * Foods without a recipe (packaged products, typed-in values) are edited as plain values.
 */
const props = defineProps<{ edit?: Food | null; initialName?: string; slot?: Slot; saveLabel?: string }>()
const emit = defineEmits<{ save: [food: Food]; cancel: [] }>()

const byValues = !!props.edit && !props.edit.recipe
const name = ref(props.edit?.name ?? props.initialName ?? '')
const servings = ref(props.edit?.recipe?.servings ?? 1)
// `said`: what the recipe said for a line Claude filled in (shown under it; not saved).
const lines = ref<(RecipeLine & { said?: string })[]>(props.edit?.recipe?.lines.map((l) => ({ ...l })) ?? [])

// AI: fill the ingredient list from a typed/pasted recipe or a photo of a written one.
const store = useAppStore()
const aiText = ref('')
const aiImage = ref<AiImage | null>(null)
const aiBusy = ref(false)
const aiStatus = ref('')
const aiMsg = ref<{ ok: boolean; text: string } | null>(null)
const aiOpen = ref(!props.edit)
async function onRecipePhoto(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  input.value = ''
  if (!f) return
  try {
    aiImage.value = await fileToImage(f, 1600)
  } catch (err) {
    aiMsg.value = { ok: false, text: (err as Error).message }
  }
}
async function fillFromAi() {
  if ((!aiText.value.trim() && !aiImage.value) || aiBusy.value) return
  aiBusy.value = true
  aiMsg.value = null
  aiStatus.value = aiImage.value ? 'Tarif okunuyor…' : 'Malzemeler çıkarılıyor…'
  try {
    const r = await parseRecipe(store.ai, { text: aiText.value, ...(aiImage.value ? { image: aiImage.value } : {}) }, {
      onTool: () => (aiStatus.value = 'Malzemeler tabloda aranıyor…'),
    })
    if (!r.lines.length) {
      aiMsg.value = { ok: false, text: 'Tarifte malzeme bulamadım; malzemeleri ve miktarlarını yazar mısın?' }
      return
    }
    if (r.name && !name.value.trim()) name.value = r.name
    servings.value = r.servings
    lines.value = r.lines.map((l) => ({ ingredientId: l.ingredientId, grams: l.grams, said: l.said }))
    aiMsg.value = {
      ok: true,
      text: [
        `${r.lines.length} malzeme dolduruldu; gramları kontrol et.`,
        r.note,
        r.unmatched.length ? `Tabloda bulamadıklarım (yukarıdan elle ekle ya da çıkar): ${r.unmatched.join(', ')}.` : '',
      ].filter(Boolean).join(' '),
    }
    aiOpen.value = false
  } catch (e) {
    aiMsg.value = { ok: false, text: (e as Error).message }
  } finally {
    aiBusy.value = false
    aiStatus.value = ''
  }
}
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
    { name: name.value, lines: lines.value.map((l) => ({ ingredientId: l.ingredientId, grams: l.grams })), servings: servings.value, slots: old?.slots.length ? old.slots : [foodSlot()], kind: old?.kind === 'light' ? 'light' : 'hearty', noMenu: old ? !!old.noMenu : true },
    Date.now().toString(36),
  )
  emit('save', old ? { ...made, id: old.id } : made)
}
</script>

<template>
  <section class="card">
    <h2>{{ edit ? 'Düzenle' : 'Yemek ekle' }}</h2>
    <p v-if="!byValues" class="small muted">Malzemeleri ve miktarlarını seç; kalori ve makrolar malzeme tablosundan (USDA / TürKomp) hesaplanır.</p>
    <div v-if="store.aiReady && !byValues" class="ai">
      <button type="button" class="ai-head" :aria-expanded="aiOpen" @click="aiOpen = !aiOpen">✨ Tarifini yaz ya da fotoğrafını çek, malzemeleri yapay zekâ doldursun</button>
      <template v-if="aiOpen">
        <textarea
          v-model="aiText" rows="4" :disabled="aiBusy"
          placeholder="Ör. Annemin karnıyarığı, 6 kişilik: 6 patlıcan, 300 g kıyma, 2 soğan, 3 domates, 1 yemek kaşığı salça, yarım çay bardağı zeytinyağı"
        />
        <div class="ai-row">
          <label class="btn ghost small"><input type="file" accept="image/*" capture="environment" hidden @change="onRecipePhoto" />📷 Tarifin fotoğrafı</label>
          <label class="btn ghost small"><input type="file" accept="image/*" hidden @change="onRecipePhoto" />🖼 Galeriden</label>
        </div>
        <div v-if="aiImage" class="ai-img">
          <img :src="aiImage.preview" alt="Tarifin fotoğrafı" />
          <button type="button" class="btn ghost small" @click="aiImage = null">✕</button>
        </div>
        <div class="ai-row end">
          <span class="small muted">{{ aiStatus }}</span>
          <button type="button" class="btn small" :disabled="aiBusy || (!aiText.trim() && !aiImage)" @click="fillFromAi">{{ aiBusy ? 'Bakılıyor…' : 'Malzemeleri doldur' }}</button>
        </div>
      </template>
      <p v-if="aiMsg" class="small" :class="aiMsg.ok ? 'ok' : 'warn'" role="status">{{ aiMsg.text }}</p>
    </div>
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
          <span class="line-name">{{ ingredientById(l.ingredientId)?.name }}<span v-if="l.said" class="said small muted"> · “{{ l.said }}”</span></span>
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
.ai { background: var(--accent-soft); border-radius: 14px; padding: 10px 12px; margin-bottom: 10px; display: grid; gap: 8px; }
.ai-head { background: none; border: 0; padding: 0; font: inherit; font-weight: 700; color: var(--accent); text-align: left; cursor: pointer; }
.ai textarea { width: 100%; font: inherit; resize: vertical; }
.ai-row { display: flex; gap: 8px; align-items: center; }
.ai-row .btn { cursor: pointer; }
.ai-row.end { justify-content: space-between; }
.ai-img { display: flex; gap: 8px; align-items: flex-start; }
.ai-img img { max-width: 70%; max-height: 160px; border-radius: 10px; object-fit: cover; }
.said { font-weight: 400; font-style: italic; }
.ok { color: var(--accent); }
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
