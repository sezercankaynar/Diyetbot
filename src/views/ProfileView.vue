<script setup lang="ts">
import { ref, watch } from 'vue'
import { getFood, TAG_LABEL, type FoodTag, type Profile } from '@/engine'
import { useAppStore } from '@/stores/app'
import SegControl from '@/components/SegControl.vue'
import BackupPanel from '@/components/BackupPanel.vue'
import * as L from '@/content/labels'

const store = useAppStore()
const emit = defineEmits<{ done: []; go: [tab: string] }>()
const TAGS = Object.entries(TAG_LABEL) as [FoodTag, string][]
function toggleDislike(t: FoodTag) {
  const d = draft.value.dislikes
  draft.value.dislikes = d.includes(t) ? d.filter((x) => x !== t) : [...d, t]
}

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
      <h1>Profil</h1>
      <span class="sub">{{ saved ? 'kaydedildi ✓' : valid(draft) ? 'otomatik kayıt' : 'değerleri kontrol edin' }}</span>
    </header>

    <fieldset>
      <legend>Vücut</legend>
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
    </fieldset>

    <fieldset>
      <legend>Hedef</legend>
      <div class="field"><span class="label">Amaç</span>
        <SegControl v-model="draft.goal" :options="L.GOAL" label="Amaç" /></div>
      <div v-if="draft.goal === 'lose'" class="field"><span class="label">Haftalık hız (vücut ağırlığının %)</span>
        <SegControl v-model="draft.weeklyRate" :options="L.RATE" label="Haftalık hız" /></div>
    </fieldset>

    <fieldset>
      <legend>Antrenman</legend>
      <div class="field"><span class="label">Haftada antrenman günü</span>
        <SegControl v-model="draft.trainingDays" :options="L.DAYS" label="Gün" /></div>
      <div class="field"><span class="label">Deneyim</span>
        <SegControl v-model="draft.experience" :options="L.EXPERIENCE" label="Deneyim" /></div>
      <div class="field"><span class="label">Ekipman</span>
        <SegControl v-model="draft.equipment" :options="L.EQUIPMENT" label="Ekipman" /></div>
    </fieldset>

    <fieldset>
      <legend>Beslenme alışkanlıkları</legend>
      <div class="field"><span class="label">Hayvansal gıdalar</span>
        <SegControl v-model="draft.animalFoods" :options="L.ANIMAL" label="Hayvansal gıdalar" /></div>
      <div class="field"><span class="label">Ekmek-pilav-makarnaya bağlılık</span>
        <SegControl v-model="draft.carbAttachment" :options="L.LEVEL" label="Karbonhidrat bağlılığı" /></div>
      <div class="field"><span class="label">Kahvaltıyı atlayabilir misiniz?</span>
        <SegControl v-model="draft.canSkipBreakfast" :options="L.YESNO" label="Kahvaltı" /></div>
      <div class="field"><span class="label">Günde öğün sayısı</span>
        <SegControl v-model="draft.mealsPerDay" :options="L.MEALS" label="Öğün" /></div>
      <div class="field"><span class="label">Yemek pişirme süresi</span>
        <SegControl v-model="draft.cookingTime" :options="L.COOKING" label="Pişirme" /></div>
      <div class="field"><span class="label">Dışarıda yemek</span>
        <SegControl v-model="draft.eatingOut" :options="L.EATING_OUT" label="Dışarıda yemek" /></div>
      <div class="field"><span class="label">Kalori takibine istekli misiniz?</span>
        <SegControl v-model="draft.tracksCalories" :options="L.YESNO" label="Kalori takibi" /></div>
      <div class="field"><span class="label">En çok ne zaman acıkıyorsunuz?</span>
        <SegControl v-model="draft.hungerTime" :options="L.HUNGER" label="Açlık" /></div>
    </fieldset>

    <fieldset>
      <legend>Damak zevki</legend>
      <p class="small muted">Yemediğin ya da sevmediğin şeyleri işaretle; menüde hiç çıkmazlar.</p>
      <label v-for="[t, name] in TAGS" :key="t" class="check">
        <input type="checkbox" :checked="draft.dislikes.includes(t)" @change="toggleDislike(t)" />
        <span>{{ name }}</span>
      </label>
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
    </fieldset>

    <fieldset>
      <legend>Sağlık</legend>
      <label v-for="h in L.HEALTH" :key="h.key" class="check">
        <input v-model="draft.health[h.key]" type="checkbox" />
        <span>{{ h.label }}</span>
      </label>
    </fieldset>

    <div class="btn-row">
      <button class="btn" type="button" :disabled="!valid(draft)" @click="finish">Planımı göster →</button>
    </div>

    <BackupPanel />
    <p class="small"><a href="#kanit" @click.prevent="emit('go', 'kanit')">Kuralların dayandığı çalışmalar (Kanıt) →</a></p>
  </div>
</template>

<style scoped>
.pref { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 4px 0; }
</style>
