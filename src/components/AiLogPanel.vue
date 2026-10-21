<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { getFood, itemTotals, slotPlan, sumTotals, type Slot } from '@/engine'
import { parseFoodText, type ParsedItem } from '@/ai/foodLog'
import { useAppStore } from '@/stores/app'
import SheetPanel from './SheetPanel.vue'
import FoodRow from './FoodRow.vue'
import AmountInput from './AmountInput.vue'

// "Ne yedin, yaz": Claude turns the text into catalogue foods with amounts and meals; the user checks
// and saves. Values are the app's own.
const props = defineProps<{ slot?: Slot | null }>()
const emit = defineEmits<{ close: [] }>()
const store = useAppStore()

const text = ref('')
const busy = ref(false)
const status = ref('')
const error = ref('')
const items = ref<ParsedItem[]>([])
const unmatched = ref<string[]>([])
const note = ref('')
const created = ref<string[]>([])
const saved = ref(false)
let ctrl: AbortController | null = null
onBeforeUnmount(() => ctrl?.abort())

const meals = computed(() => (store.menuCtx ? slotPlan(store.menuCtx).map((s) => ({ slot: s.slot, label: s.label })) : []))
const label = (slot: Slot | null) => (slot ? meals.value.find((m) => m.slot === slot)?.label ?? slot : 'Öğün dışı')
const total = computed(() => sumTotals(items.value.map((i) => itemTotals(i.foodId, i.factor))))
const dayWord = computed(() => (store.isViewToday ? 'bugüne' : 'o güne'))

async function understand() {
  if (!text.value.trim() || busy.value) return
  busy.value = true
  error.value = ''
  saved.value = false
  status.value = 'Okunuyor…'
  ctrl = new AbortController()
  try {
    const r = await parseFoodText(store.ai, text.value, {
      meals: meals.value, fixedSlot: props.slot ?? null, hour: new Date().getHours(), signal: ctrl.signal,
      onTool: (n) => (status.value = n === 'create_food' ? 'Katalogda olmayan yeni yemek ekleniyor…' : n === 'search_ingredients' ? 'Malzemeler hesaplanıyor…' : 'Yemekler katalogda aranıyor…'),
      save: (f) => store.saveCustomFood(f),
    })
    created.value = r.created
    items.value = r.items
    unmatched.value = r.unmatched
    note.value = r.note
    if (!r.items.length && !r.unmatched.length) error.value = 'Yazdığında bir yiyecek bulamadım; biraz daha açık yazar mısın?'
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    busy.value = false
    status.value = ''
  }
}
/** Out of the list; a food made just for it is deleted again. */
async function remove(k: number) {
  const [it] = items.value.splice(k, 1)
  if (it && created.value.includes(it.foodId) && !items.value.some((x) => x.foodId === it.foodId)) {
    await store.deleteCustomFood(it.foodId)
    created.value = created.value.filter((id) => id !== it.foodId)
  }
}
async function save() {
  const groups = new Map<Slot | null, ParsedItem[]>()
  for (const i of items.value) groups.set(i.slot, [...(groups.get(i.slot) ?? []), i])
  for (const [slot, list] of groups) await store.logFoods(list.map((i) => ({ foodId: i.foodId, factor: i.factor })), slot ?? undefined)
  saved.value = true
  items.value = []
  unmatched.value = []
  note.value = ''
  text.value = ''
}
</script>

<template>
  <SheetPanel :title="slot ? `${label(slot)}: ne yedin?` : '✨ Ne yedin, yaz'" @close="emit('close')">
    <p class="small muted">
      Yediklerini konuşur gibi yaz; uygulama katalogdaki yemeklerle eşleştirsin. Örnek: <em>“sabah 2 yumurta, 3 dilim peynir, bir simit; öğlen yarım lahmacun ve ayran; akşam üstü bir avuç fındık”</em>.
      Klavyedeki 🎤 ile konuşarak da yazabilirsin.
    </p>
    <textarea v-model="text" rows="4" placeholder="Bugün ne yedin?" :disabled="busy" />
    <div class="row">
      <span class="small muted">{{ status }}</span>
      <button type="button" class="btn" :disabled="busy || !text.trim()" @click="understand">{{ busy ? 'Bakılıyor…' : 'Anla' }}</button>
    </div>
    <p v-if="error" class="small warn" role="alert">{{ error }}</p>
    <p v-if="saved" class="small ok" role="status">Kaydedildi ✓ {{ store.isViewToday ? 'Bugünün' : 'O günün' }} öğünlerine eklendi.</p>

    <section v-if="items.length" class="card">
      <h2>Bunları buldum</h2>
      <p v-if="note" class="small muted">{{ note }}</p>
      <div v-for="(i, k) in items" :key="k" class="item">
        <div class="said small muted">
          “{{ i.said }}”
          <span v-if="created.includes(i.foodId)" class="new">yeni eklendi{{ getFood(i.foodId)?.estimated ? ' · değerler tahmini' : ' · malzemelerden hesaplandı' }}</span>
        </div>
        <FoodRow :food-id="i.foodId" :factor="i.factor" compact />
        <div class="ctrl">
          <AmountInput v-model="i.factor" :food-id="i.foodId" />
          <select v-if="!slot" v-model="i.slot" aria-label="Öğün">
            <option v-for="m in meals" :key="m.slot" :value="m.slot">{{ m.label }}</option>
            <option :value="null">Öğün dışı</option>
          </select>
          <button type="button" class="btn danger small" aria-label="Çıkar" @click="remove(k)">✕</button>
        </div>
      </div>
      <p class="small num total">Toplam: <strong>{{ total.kcal }} kcal</strong> · P {{ total.protein }} · K {{ total.carb }} · Y {{ total.fat }}</p>
      <p v-if="unmatched.length" class="small warn">
        Katalogda bulamadıklarım: {{ unmatched.join(', ') }}. Bunları “Ara / yiyebilir miyim?” ekranından elle ya da “Yemek ekle (malzemelerden)” ile ekleyebilirsin.
      </p>
      <p v-if="created.length" class="small muted">Katalogda olmayanları ekledim; sonra aramada da çıkarlar (Ben → Profil → Kayıtlı yemeklerim'den düzenleyebilir ya da silebilirsin).</p>
      <p class="small muted">Miktar ve öğün doğru mu? Değiştirebilir ya da ✕ ile çıkarabilirsin. Kaydedince {{ dayWord }} yazılır; bir öğüne yazılanlar o öğünün menüdeki tabağının yerine sayılır.</p>
      <button type="button" class="btn wide" @click="save">Kaydet</button>
    </section>
    <p v-else-if="unmatched.length" class="small warn">Katalogda bulamadıklarım: {{ unmatched.join(', ') }}.</p>
  </SheetPanel>
</template>

<style scoped>
textarea { width: 100%; font: inherit; margin-top: 8px; resize: vertical; }
.row { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin: 8px 0; }
.item { padding: 10px 0; border-bottom: 1px solid var(--line); }
.item:last-of-type { border-bottom: 0; }
.said { margin-bottom: 2px; font-style: italic; }
.new { font-style: normal; font-weight: 700; color: var(--accent); background: var(--accent-soft); border-radius: 999px; padding: 1px 8px; margin-left: 4px; }
.ctrl { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 4px; }
.ctrl select { width: auto; }
.total { margin-top: 8px; }
.wide { width: 100%; margin-top: 8px; }
.ok { color: var(--accent); }
.warn { color: var(--warn-ink); background: var(--warn-bg); border-radius: 10px; padding: 8px 10px; }
</style>
