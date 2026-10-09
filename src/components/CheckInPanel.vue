<script setup lang="ts">
import { computed, ref } from 'vue'
import { DIFFICULTY_LABEL, evaluateCheckIn, type CheckIn, type Difficulty } from '@/engine'
import { today, useAppStore } from '@/stores/app'
import SheetPanel from './SheetPanel.vue'
import SegControl from './SegControl.vue'
import CheckInFeedback from './CheckInFeedback.vue'

const emit = defineEmits<{ close: [] }>()
const store = useAppStore()

const last = store.sortedCheckIns[0]
const form = ref<CheckIn>({
  id: `${Date.now().toString(36)}`,
  date: today(),
  waistCm: last?.waistCm ?? store.profile.waistCm,
  hipCm: last?.hipCm,
  neckCm: last?.neckCm,
  hunger: 3,
  energy: 3,
  sleep: 3,
  adherence: 75,
  difficulties: [],
  note: '',
})
const saved = ref(false)

const scale = (labels: string[]) => labels.map((label, i) => ({ value: i + 1, label }))
const HUNGER = scale(['Yok', 'Az', 'Orta', 'Sık', 'Hep'])
const LEVEL = scale(['Çok kötü', 'Kötü', 'Orta', 'İyi', 'Çok iyi'])
const ADHERENCE = [25, 50, 75, 90, 100].map((v) => ({ value: v, label: `%${v}` }))
const DIFFS = Object.entries(DIFFICULTY_LABEL) as [Difficulty, string][]

function toggleDiff(d: Difficulty) {
  const l = form.value.difficulties
  form.value.difficulties = l.includes(d) ? l.filter((x) => x !== d) : [...l, d]
}

const clean = (v: unknown) => (typeof v === 'number' && v > 0 && v < 300 ? v : undefined)
const feedback = computed(() => {
  const ctx = store.coachContext
  if (!ctx || !saved.value) return null
  const prev = store.sortedCheckIns.find((c) => c.id !== form.value.id)
  return evaluateCheckIn(form.value, ctx, prev)
})

async function save() {
  form.value = { ...form.value, waistCm: clean(form.value.waistCm), hipCm: clean(form.value.hipCm), neckCm: clean(form.value.neckCm) }
  await store.saveCheckIn(form.value)
  saved.value = true
}
</script>

<template>
  <SheetPanel title="Haftalık görüşme" @close="emit('close')">
    <template v-if="!saved">
      <p class="small muted">
        Diyetisyen kontrolündeki gibi: ölçülerini al, haftanı değerlendir. 2 dakika sürer.
      </p>

      <section class="card">
        <h2>Ölçüler (cm)</h2>
        <p class="small muted">Sabah, aç karnına; bel göbek hizasından, boyun gırtlağın altından, kalça en geniş yerinden.</p>
        <div class="row2">
          <label class="field"><span class="label">Bel</span>
            <input v-model.number="form.waistCm" type="number" inputmode="decimal" step="0.5" /></label>
          <label class="field"><span class="label">Boyun</span>
            <input v-model.number="form.neckCm" type="number" inputmode="decimal" step="0.5" /></label>
          <label v-if="store.profile.sex === 'f'" class="field"><span class="label">Kalça</span>
            <input v-model.number="form.hipCm" type="number" inputmode="decimal" step="0.5" /></label>
        </div>
      </section>

      <section class="card">
        <h2>Bu hafta nasıldı?</h2>
        <div class="field"><span class="label">Açlık hissi</span><SegControl v-model="form.hunger" :options="HUNGER" label="Açlık" /></div>
        <div class="field"><span class="label">Enerji</span><SegControl v-model="form.energy" :options="LEVEL" label="Enerji" /></div>
        <div class="field"><span class="label">Uyku</span><SegControl v-model="form.sleep" :options="LEVEL" label="Uyku" /></div>
        <div class="field"><span class="label">Plana ne kadar uydun?</span><SegControl v-model="form.adherence" :options="ADHERENCE" label="Uyum" /></div>
      </section>

      <section class="card">
        <h2>Zorlandığın konular</h2>
        <div class="chips">
          <button v-for="[d, label] in DIFFS" :key="d" type="button" :aria-pressed="form.difficulties.includes(d)" @click="toggleDiff(d)">
            {{ label }}
          </button>
        </div>
        <label class="field"><span class="label">Not (isteğe bağlı)</span>
          <input v-model="form.note" type="text" placeholder="Bu hafta neler oldu?" /></label>
      </section>

      <div class="btn-row"><button type="button" class="btn" @click="save">Kaydet ve değerlendir</button></div>
    </template>

    <template v-else-if="feedback">
      <CheckInFeedback :feedback="feedback" />
      <div class="btn-row"><button type="button" class="btn" @click="emit('close')">Tamam</button></div>
    </template>
  </SheetPanel>
</template>

<style scoped>
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chips button {
  font: inherit; font-size: 0.85rem; padding: 6px 10px; border-radius: 999px; cursor: pointer;
  border: 1px solid var(--rule-strong); background: var(--paper); color: var(--ink);
}
.chips button[aria-pressed='true'] { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
.field input[type='text'] { font-family: var(--font-body); }
</style>
