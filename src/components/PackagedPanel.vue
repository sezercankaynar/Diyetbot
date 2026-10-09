<script setup lang="ts">
import { computed, ref } from 'vue'
import { foodFromLabel, validateLabel, type LabelInput } from '@/engine'
import { productByBarcode, searchProducts, type OffResult } from '@/off'
import { canScan, scanBarcode } from '@/native/barcode'
import { useAppStore } from '@/stores/app'
import SheetPanel from './SheetPanel.vue'

const emit = defineEmits<{ close: []; picked: [foodId: string] }>()
const store = useAppStore()

type Mode = 'barcode' | 'search' | 'label'
const mode = ref<Mode>(canScan() ? 'barcode' : 'search')
const busy = ref(false)
const error = ref('')
const info = ref('')

const query = ref('')
const code = ref('')
const results = ref<OffResult[]>([])

const emptyForm = (): LabelInput => ({ name: '', brand: '', kcal100: NaN, protein100: NaN, carb100: NaN, fat100: NaN, portionG: 100 })
const form = ref<LabelInput | null>(null)
const servingG = ref<number | undefined>()

async function run(fn: () => Promise<void>) {
  busy.value = true
  error.value = ''
  info.value = ''
  try {
    await fn()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    busy.value = false
  }
}

function pick(r: OffResult) {
  servingG.value = r.servingG
  form.value = { ...r, portionG: r.servingG ?? 100 }
}

const lookup = (barcode: string) =>
  run(async () => {
    const r = await productByBarcode(barcode)
    if (r) return pick(r)
    info.value = 'Bu barkod veritabanında yok ya da besin değerleri eksik. Değerleri paketin arkasındaki etiketten gir.'
    form.value = { ...emptyForm(), barcode }
    mode.value = 'label'
  })

const scan = () =>
  run(async () => {
    const c = await scanBarcode()
    if (!c) return
    code.value = c
    busy.value = false
    await lookup(c)
  })

const search = () =>
  run(async () => {
    results.value = await searchProducts(query.value)
    if (!results.value.length) info.value = 'Sonuç yok. Farklı yaz (ör. marka + ürün) ya da etiketten gir.'
  })

function manual() {
  mode.value = 'label'
  form.value = emptyForm()
}

const errors = computed(() => (form.value ? validateLabel(form.value) : []))
const preview = computed(() => (form.value && !errors.value.length ? foodFromLabel(form.value) : null))

async function save() {
  if (!preview.value) return
  await store.saveCustomFood(preview.value)
  emit('picked', preview.value.id)
  emit('close')
}
</script>

<template>
  <SheetPanel title="Paketli ürün ekle" @close="emit('close')">
    <div class="seg" role="group" aria-label="Yöntem">
      <button v-if="canScan()" type="button" :aria-pressed="mode === 'barcode'" @click="mode = 'barcode'; form = null">Barkod</button>
      <button type="button" :aria-pressed="mode === 'search'" @click="mode = 'search'; form = null">İsimle ara</button>
      <button type="button" :aria-pressed="mode === 'label'" @click="manual">Etiketten gir</button>
    </div>

    <template v-if="!form">
      <section v-if="mode === 'barcode'" class="card" style="margin-top: 12px">
        <p class="small muted">Paketin üzerindeki barkodu okut; ürün internetteki açık ürün veritabanında (Open Food Facts) aranır.</p>
        <button type="button" class="btn" :disabled="busy" @click="scan">📷 Barkodu tara</button>
        <form class="inline" @submit.prevent="lookup(code)">
          <input v-model="code" type="text" inputmode="numeric" placeholder="ya da barkod numarasını yaz" aria-label="Barkod numarası" />
          <button type="submit" class="btn ghost small" :disabled="busy || !code.trim()">Bul</button>
        </form>
      </section>

      <section v-if="mode === 'search'" class="card" style="margin-top: 12px">
        <p class="small muted">Marka ve ürün adıyla ara (ör. "Ülker çikolatalı gofret", "Sütaş ayran"). İnternet gerekir.</p>
        <form class="inline" @submit.prevent="search">
          <input v-model="query" type="text" placeholder="Ürün adı" aria-label="Ürün adı" />
          <button type="submit" class="btn small" :disabled="busy || !query.trim()">Ara</button>
        </form>
        <ul v-if="results.length" class="results">
          <li v-for="r in results" :key="r.barcode ?? r.name">
            <button type="button" @click="pick(r)">
              <span>{{ r.name }}<span v-if="r.brand" class="small muted"> · {{ r.brand }}</span></span>
              <span class="num small">{{ r.kcal100 }} kcal/100 g</span>
            </button>
          </li>
        </ul>
      </section>

      <p v-if="busy" class="small muted" role="status">Aranıyor…</p>
    </template>

    <p v-if="error" class="msg err" role="alert">{{ error }}</p>
    <p v-if="info" class="msg" role="status">{{ info }}</p>

    <section v-if="form" class="card" style="margin-top: 12px">
      <h2>Ürün bilgileri</h2>
      <p class="small muted">Değerleri paketin "Besin değerleri (100 g)" tablosuyla karşılaştırıp gerekirse düzelt.</p>
      <label class="field"><span class="label">Ürün adı</span><input v-model="form.name" type="text" /></label>
      <label class="field"><span class="label">Marka</span><input v-model="form.brand" type="text" /></label>
      <div class="row2">
        <label class="field"><span class="label">Enerji (kcal / 100 g)</span>
          <input v-model.number="form.kcal100" type="number" inputmode="decimal" step="1" min="0" /></label>
        <label class="field"><span class="label">Protein (g / 100 g)</span>
          <input v-model.number="form.protein100" type="number" inputmode="decimal" step="0.1" min="0" /></label>
        <label class="field"><span class="label">Karbonhidrat (g / 100 g)</span>
          <input v-model.number="form.carb100" type="number" inputmode="decimal" step="0.1" min="0" /></label>
        <label class="field"><span class="label">Yağ (g / 100 g)</span>
          <input v-model.number="form.fat100" type="number" inputmode="decimal" step="0.1" min="0" /></label>
      </div>
      <label class="field"><span class="label">Yediğin miktar (g)</span>
        <input v-model.number="form.portionG" type="number" inputmode="decimal" min="1" /></label>
      <div class="quick">
        <button v-if="servingG" type="button" class="btn ghost small" @click="form.portionG = servingG">1 porsiyon ({{ servingG }} g)</button>
        <button type="button" class="btn ghost small" @click="form.portionG = 100">100 g</button>
        <button type="button" class="btn ghost small" @click="form.portionG = 30">30 g</button>
      </div>

      <ul v-if="errors.length && !Number.isNaN(form.kcal100)" class="small errs">
        <li v-for="e in errors" :key="e">{{ e }}</li>
      </ul>
      <p v-if="preview" class="preview">
        <strong>{{ Math.round(form.portionG) }} g</strong> =
        <span class="num">{{ preview.kcal }} kcal</span> ·
        <span class="num">P {{ preview.protein }} · K {{ preview.carb }} · Y {{ preview.fat }}</span>
      </p>
      <div class="btn-row">
        <button type="button" class="btn" :disabled="!preview" @click="save">Kaydet ve tabağa ekle</button>
      </div>
      <p class="small muted">Kaydedilen ürünler sonra aramada da çıkar.</p>
    </section>
  </SheetPanel>
</template>

<style scoped>
.inline { display: flex; gap: 8px; margin-top: 10px; align-items: center; }
.inline input { flex: 1; font-family: var(--font-body); }
.results { list-style: none; padding: 0; margin: 10px 0 0; border: 1px solid var(--rule); border-radius: var(--radius); max-height: 50vh; overflow-y: auto; }
.results li + li { border-top: 1px dotted var(--rule); }
.results button { width: 100%; display: flex; justify-content: space-between; gap: 8px; text-align: left; background: none; border: 0; padding: 10px 12px; font: inherit; color: inherit; cursor: pointer; }
.msg { background: var(--info-bg); color: var(--info-ink); border-left: 4px solid var(--info-border); padding: 8px 10px; border-radius: var(--radius); margin-top: 10px; }
.msg.err { background: var(--stop-bg); color: var(--stop-ink); border-color: var(--stop-border); }
.quick { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.errs { color: var(--stop-border); }
.preview { margin-top: 10px; padding: 8px 10px; background: var(--accent-soft); border-radius: var(--radius); }
.field input[type='text'] { font-family: var(--font-body); }
</style>
