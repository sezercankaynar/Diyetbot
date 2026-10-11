<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getFood, PREF_GROUPS, PREF_KEYS, SLOT_ORDER, slotPlan, timingTips, type MealsPerDay, type PrefKey, type Profile, type Slot } from '@/engine'
import { useAppStore } from '@/stores/app'
import SegControl from '@/components/SegControl.vue'
import BackupPanel from '@/components/BackupPanel.vue'
import * as L from '@/content/labels'
import { setTheme, theme, type Theme } from '@/theme'

const store = useAppStore()
const THEMES: { value: Theme; label: string }[] = [
  { value: 'system', label: 'Sistem' },
  { value: 'light', label: '☀️ Açık' },
  { value: 'dark', label: '🌙 Koyu' },
]
const emit = defineEmits<{ done: []; go: [tab: string] }>()
const timeTips = computed(() => timingTips(slotPlan(draft.value), draft.value.mealTimes))

// ── Which meals (öğünler) ──
const MEAL_LABEL: Record<Slot, string> = { breakfast: 'Kahvaltı', lunch: 'Öğle', snack: 'Ara öğün', dinner: 'Akşam', night: 'Gece ara öğün' }
const activeSlots = computed<Slot[]>(() => slotPlan(draft.value).map((s) => s.slot))
function toggleMeal(s: Slot) {
  const cur = activeSlots.value
  const next = cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]
  if (next.length < 2) return
  draft.value.mealSlots = SLOT_ORDER.filter((x) => next.includes(x))
  draft.value.mealsPerDay = Math.min(4, Math.max(2, next.length)) as MealsPerDay
}
const TIME_KEY: Record<Slot, keyof Profile['mealTimes']> = { breakfast: 'breakfast', lunch: 'lunch', snack: 'snack', dinner: 'dinner', night: 'nightSnack' }
const STYLE_SLOTS: ('breakfast' | 'lunch' | 'dinner')[] = ['breakfast', 'lunch', 'dinner']

// ── Taste (damak zevki): tap cycles neutral → ♥ sever → ✕ yemez ──
const isDisliked = (k: PrefKey) => draft.value.dislikes.includes(k.id) || (!!k.tag && draft.value.dislikes.includes(k.tag))
const isLiked = (k: PrefKey) => (draft.value.likes ?? []).includes(k.id)
function cycle(k: PrefKey) {
  const likes = (draft.value.likes ?? []).filter((x) => x !== k.id)
  const dislikes = draft.value.dislikes.filter((x) => x !== k.id && x !== k.tag)
  if (!isLiked(k) && !isDisliked(k)) likes.push(k.id)
  else if (isLiked(k)) dislikes.push(k.id)
  draft.value.likes = likes
  draft.value.dislikes = dislikes
}
const groups = PREF_GROUPS.map((g) => ({ name: g, keys: PREF_KEYS.filter((k) => k.group === g) }))
const tasteSummary = computed(() => {
  const l = (draft.value.likes ?? []).length
  const d = draft.value.dislikes.length
  return l || d ? `${l} sever · ${d} yemez` : ''
})

const draft = ref<Profile>(JSON.parse(JSON.stringify(store.profile)))
const saved = ref(false)

// Keep the form in sync when weight changes from Takip or after an import.
watch(
  () => store.profile,
  (p) => {
    if (JSON.stringify(p) !== JSON.stringify(draft.value)) draft.value = JSON.parse(JSON.stringify(p))
  },
)

const NUM_LIMITS = {
  age: [10, 100],
  heightCm: [120, 230],
  weightKg: [30, 300],
  waistCm: [40, 200],
  sleepHours: [3, 12],
} as const

const valid = (p: Profile) =>
  (Object.keys(NUM_LIMITS) as (keyof typeof NUM_LIMITS)[]).every((k) => {
    const v = p[k]
    return typeof v === 'number' && Number.isFinite(v) && v >= NUM_LIMITS[k][0] && v <= NUM_LIMITS[k][1]
  })

let timer: ReturnType<typeof setTimeout> | undefined

// Save right away (even if nothing was changed from the defaults), then show the plan.
async function finish() {
  if (!valid(draft.value)) return
  clearTimeout(timer)
  await store.saveProfile(JSON.parse(JSON.stringify(draft.value)))
  emit('done')
}
watch(
  draft,
  (p) => {
    saved.value = false
    clearTimeout(timer)
    if (!valid(p)) return
    timer = setTimeout(async () => {
      await store.saveProfile(JSON.parse(JSON.stringify(p)))
      saved.value = true
    }, 300)
  },
  { deep: true },
)
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h2>Bilgilerin</h2>
      <span class="sub">{{ saved ? 'kaydedildi ✓' : valid(draft) ? 'otomatik kayıt' : 'değerleri kontrol edin' }}</span>
    </header>

    <div class="field theme">
      <span class="label">Görünüm (tema)</span>
      <SegControl :model-value="theme" :options="THEMES" label="Tema" @update:model-value="setTheme($event as Theme)" />
    </div>

    <details class="fold" :open="!store.hasProfile">
      <summary>Vücut <span class="hint">{{ `${draft.weightKg} kg · ${draft.heightCm} cm` }}</span></summary>
      <div class="fold-body">
      <div class="field">
        <span class="label">Cinsiyet</span>
        <SegControl v-model="draft.sex" :options="L.SEX" label="Cinsiyet" />
      </div>
      <div class="row2">
        <label class="field"><span class="label">Yaş</span>
          <input v-model.number="draft.age" type="number" inputmode="numeric" min="10" max="100" /></label>
        <label class="field"><span class="label">Boy (cm)</span>
          <input v-model.number="draft.heightCm" type="number" inputmode="decimal" min="120" max="230" /></label>
        <label class="field"><span class="label">Kilo (kg)</span>
          <input v-model.number="draft.weightKg" type="number" inputmode="decimal" step="0.1" min="30" max="300" /></label>
        <label class="field"><span class="label">Bel (cm)</span>
          <input v-model.number="draft.waistCm" type="number" inputmode="decimal" min="40" max="200" /></label>
        <label class="field"><span class="label">Ort. uyku (saat)</span>
          <input v-model.number="draft.sleepHours" type="number" inputmode="decimal" step="0.5" min="3" max="12" /></label>
      </div>
      <div class="field">
        <span class="label">Aktivite çarpanı</span>
        <SegControl v-model="draft.activity" :options="L.ACTIVITY" label="Aktivite" />
        <p class="small muted">{{ L.ACTIVITY.find((a) => a.value === draft.activity)?.hint }}</p>
      </div>
    </div>
    </details>

    <details class="fold">
      <summary>Hedef <span class="hint">{{ L.GOAL.find((g) => g.value === draft.goal)?.label }}</span></summary>
      <div class="fold-body">
      <div class="field"><span class="label">Amaç</span>
        <SegControl v-model="draft.goal" :options="L.GOAL" label="Amaç" /></div>
      <div v-if="draft.goal === 'lose'" class="field"><span class="label">Haftalık hız (vücut ağırlığının %)</span>
        <SegControl v-model="draft.weeklyRate" :options="L.RATE" label="Haftalık hız" /></div>
    </div>
    </details>

    <details class="fold">
      <summary>Antrenman <span class="hint">{{ `haftada ${draft.trainingDays} gün` }}</span></summary>
      <div class="fold-body">
      <div class="field"><span class="label">Haftada antrenman günü</span>
        <SegControl v-model="draft.trainingDays" :options="L.DAYS" label="Gün" /></div>
      <div class="field"><span class="label">Deneyim</span>
        <SegControl v-model="draft.experience" :options="L.EXPERIENCE" label="Deneyim" /></div>
      <div class="field"><span class="label">Ekipman</span>
        <SegControl v-model="draft.equipment" :options="L.EQUIPMENT" label="Ekipman" /></div>
    </div>
    </details>

    <details class="fold">
      <summary>Beslenme alışkanlıkları</summary>
      <div class="fold-body">
      <div class="field"><span class="label">Hayvansal gıdalar</span>
        <SegControl v-model="draft.animalFoods" :options="L.ANIMAL" label="Hayvansal gıdalar" /></div>
      <div class="field"><span class="label">Ekmek-pilav-makarnaya bağlılık</span>
        <SegControl v-model="draft.carbAttachment" :options="L.LEVEL" label="Karbonhidrat bağlılığı" /></div>
      <div class="field"><span class="label">Kahvaltıyı atlayabilir misiniz?</span>
        <SegControl v-model="draft.canSkipBreakfast" :options="L.YESNO" label="Kahvaltı" /></div>
      <div class="field"><span class="label">Yemek pişirme süresi</span>
        <SegControl v-model="draft.cookingTime" :options="L.COOKING" label="Pişirme" /></div>
      <div class="field"><span class="label">Dışarıda yemek</span>
        <SegControl v-model="draft.eatingOut" :options="L.EATING_OUT" label="Dışarıda yemek" /></div>
      <div class="field"><span class="label">Kalori takibine istekli misiniz?</span>
        <SegControl v-model="draft.tracksCalories" :options="L.YESNO" label="Kalori takibi" /></div>
      <div class="field"><span class="label">En çok ne zaman acıkıyorsunuz?</span>
        <SegControl v-model="draft.hungerTime" :options="L.HUNGER" label="Açlık" /></div>
    </div>
    </details>

    <details class="fold">
      <summary>Öğün düzeni</summary>
      <div class="fold-body">
      <div class="field" style="margin-top: 0">
        <span class="label">Hangi öğünleri yiyorsun?</span>
        <div class="meal-chips">
          <button
            v-for="sl in SLOT_ORDER" :key="sl" type="button" :aria-pressed="activeSlots.includes(sl)"
            @click="toggleMeal(sl)"
          >{{ activeSlots.includes(sl) ? '✓ ' : '' }}{{ MEAL_LABEL[sl] }}</button>
        </div>
        <p class="small muted">En az 2 öğün seç. Menü sadece seçtiğin öğünleri hazırlar.</p>
      </div>
      <template v-for="sl in STYLE_SLOTS" :key="sl">
        <div v-if="activeSlots.includes(sl)" class="field">
          <span class="label">{{ MEAL_LABEL[sl] }} nasıl olsun?</span>
          <SegControl v-model="draft.mealStyle[sl]" :options="L.MEAL_STYLE" :label="MEAL_LABEL[sl]" />
        </div>
      </template>
      <p class="small muted">Aynı günlük kaloride öğün dağılımı kilo kaybını değiştirmez; en iyi düzen sürdürebildiğin düzendir.</p>
      <label class="check">
        <input v-model="draft.batchCooking" type="checkbox" />
        <span>Sulu yemeği iki gün yerim: akşam pişen tencere yemeği ertesi gün de menüde olsun</span>
      </label>
      <div class="field">
        <span class="label">Öğün saatleri (başlangıç)</span>
        <div class="times">
          <label v-for="sl in activeSlots" :key="sl"><span class="small muted">{{ MEAL_LABEL[sl] }}</span>
            <input v-model="draft.mealTimes[TIME_KEY[sl]]" type="time" /></label>
        </div>
        <ul v-if="timeTips.length" class="small tips"><li v-for="t in timeTips" :key="t">{{ t }}</li></ul>
      </div>
    </div>
    </details>

    <details class="fold">
      <summary>Damak zevki <span class="hint">{{ tasteSummary }}</span></summary>
      <div class="fold-body">
      <p class="small muted">
        Dokun: <strong>bir kez ♥ severim</strong> (menüde daha sık çıkar), <strong>iki kez ✕ yemem</strong> (hiç çıkmaz), üçüncüde sıfırlanır.
      </p>
      <div v-for="g in groups" :key="g.name" class="taste-group">
        <div class="label">{{ g.name }}</div>
        <div class="taste-chips">
          <button
            v-for="k in g.keys" :key="k.id" type="button" :class="{ like: isLiked(k), no: isDisliked(k), all: !!k.tag }"
            :aria-label="`${k.label}: ${isLiked(k) ? 'severim' : isDisliked(k) ? 'yemem' : 'fark etmez'}`"
            @click="cycle(k)"
          >{{ isLiked(k) ? '♥ ' : isDisliked(k) ? '✕ ' : '' }}{{ k.label }}</button>
        </div>
      </div>
      <template v-if="store.liked.length || store.disliked.length">
        <p class="small muted" style="margin-top: 10px">Menüde işaretlediğin yemekler:</p>
        <div v-for="id in store.liked" :key="'l' + id" class="pref">
          <span>♥ {{ getFood(id)?.name }}</span>
          <button type="button" class="btn ghost small" @click="store.rateDish(id, null)">Kaldır</button>
        </div>
        <div v-for="id in store.disliked" :key="'d' + id" class="pref">
          <span>✕ {{ getFood(id)?.name }}</span>
          <button type="button" class="btn ghost small" @click="store.rateDish(id, null)">Tekrar göster</button>
        </div>
      </template>
    </div>
    </details>

    <details class="fold">
      <summary>Sağlık</summary>
      <div class="fold-body">
      <label v-for="h in L.HEALTH" :key="h.key" class="check">
        <input v-model="draft.health[h.key]" type="checkbox" />
        <span>{{ h.label }}</span>
      </label>
    </div>
    </details>

    <div class="btn-row">
      <button class="btn" type="button" :disabled="!valid(draft)" @click="finish">Planımı göster →</button>
    </div>

    <details class="fold">
      <summary>Yedekleme</summary>
      <div class="fold-body"><BackupPanel /></div>
    </details>
  </div>
</template>

<style scoped>
.theme { margin: 0 0 14px; }
.meal-chips, .taste-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.meal-chips button, .taste-chips button {
  border: 0; border-radius: 999px; padding: 8px 12px; font: inherit; font-size: 0.85rem; font-weight: 600;
  background: var(--surface-2); color: var(--ink-2); cursor: pointer;
}
.meal-chips button[aria-pressed='true'] { background: var(--accent); color: var(--accent-ink); }
.taste-chips button.all { font-weight: 800; }
.taste-chips button.like { background: var(--accent-soft); color: var(--accent); }
.taste-chips button.no { background: var(--stop-bg); color: var(--stop-border); text-decoration: line-through; }
.taste-group { margin-top: 12px; }
.taste-group .label { margin-bottom: 6px; }
.times { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.times label { display: grid; gap: 4px; }
.tips { color: var(--warn-ink); margin-top: 8px; }
.pref { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 4px 0; }
</style>
