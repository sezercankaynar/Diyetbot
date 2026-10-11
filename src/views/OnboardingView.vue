<script setup lang="ts">
import { computed, ref } from 'vue'
import { defaultProfile, SLOT_ORDER, type Profile, type Slot } from '@/engine'
import { useAppStore } from '@/stores/app'
import SegControl from '@/components/SegControl.vue'
import SheetPanel from '@/components/SheetPanel.vue'
import BackupPanel from '@/components/BackupPanel.vue'
import * as L from '@/content/labels'

// First run: a few questions, one screen at a time. Everything else has sensible defaults and can be
// changed later in Ben → Profil.
const store = useAppStore()

const d = defaultProfile()
// Body numbers start empty (no misleading defaults).
const empty = undefined as unknown as number
const p = ref<Profile>({ ...d, age: empty, heightCm: empty, weightKg: empty, waistCm: empty })
const waistKnown = ref<number | null>(null)
const step = ref(0)
const restore = ref(false)
const STEPS = 6

const num = (x: number, lo: number, hi: number) => typeof x === 'number' && Number.isFinite(x) && x >= lo && x <= hi
const okStep = computed(() => {
  switch (step.value) {
    case 1: return num(p.value.age, 10, 100)
    case 2: return num(p.value.heightCm, 120, 230) && num(p.value.weightKg, 30, 300) && (waistKnown.value === null || num(waistKnown.value, 40, 200))
    case 4: return (p.value.mealSlots ?? []).length >= 2
    default: return true
  }
})

const MEAL_LABEL: Record<Slot, string> = { breakfast: 'Kahvaltı', lunch: 'Öğle', snack: 'Ara öğün', dinner: 'Akşam', night: 'Gece ara öğün' }
p.value.mealSlots = ['breakfast', 'lunch', 'dinner']
function toggleMeal(s: Slot) {
  const cur = p.value.mealSlots ?? []
  p.value.mealSlots = SLOT_ORDER.filter((x) => (x === s ? !cur.includes(s) : cur.includes(x)))
}
const kgPerWeek = (rate: number) => (num(p.value.weightKg, 30, 300) ? ((p.value.weightKg * rate) / 100).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) : '?')
const RATES = computed(() => [
  { value: 0.25 as const, label: `Yavaş (~${kgPerWeek(0.25)} kg/hafta)` },
  { value: 0.5 as const, label: `Orta (~${kgPerWeek(0.5)} kg/hafta)` },
  { value: 0.75 as const, label: `Hızlı (~${kgPerWeek(0.75)} kg/hafta)` },
])
const GOALS = [
  { value: 'lose' as const, label: 'Kilo vermek' },
  { value: 'maintain' as const, label: 'Kilomu korumak' },
  { value: 'recomp' as const, label: 'Yağ yakıp kas yapmak' },
  { value: 'gain' as const, label: 'Kilo / kas almak' },
]

async function finish() {
  const n = (p.value.mealSlots ?? []).length
  const profile: Profile = {
    ...p.value,
    // Waist unknown: a neutral estimate (half the height); it can be measured later.
    waistCm: waistKnown.value ?? Math.round(p.value.heightCm / 2),
    mealsPerDay: (n <= 2 ? 2 : n >= 4 ? 4 : 3) as Profile['mealsPerDay'],
  }
  await store.saveProfile(JSON.parse(JSON.stringify(profile)))
}
</script>

<template>
  <div class="page onboard">
    <div class="dots" aria-hidden="true"><span v-for="i in STEPS" :key="i" :class="{ on: i - 1 <= step }" /></div>

    <section v-if="step === 0" class="card">
      <h1>Merhaba 👋</h1>
      <p>Diyetbot sana göre bir kalori hedefi, Türk mutfağından haftalık bir menü ve antrenman planı hazırlar.</p>
      <p class="small muted">Birkaç soru soracağım (1–2 dakika). Verilerin sadece bu telefonda kalır.</p>
      <div class="field"><span class="label">Cinsiyet</span><SegControl v-model="p.sex" :options="L.SEX" label="Cinsiyet" /></div>
      <button type="button" class="link small" @click="restore = true">Yedeğin var mı? Geri yükle</button>
    </section>
    <SheetPanel v-if="restore" title="Yedekten geri yükle" @close="restore = false"><BackupPanel /></SheetPanel>

    <section v-else-if="step === 1" class="card">
      <h2>Kaç yaşındasın?</h2>
      <label class="field"><span class="label">Yaş</span><input v-model.number="p.age" type="number" inputmode="numeric" min="10" max="100" placeholder="Ör. 35" /></label>
      <p v-if="num(p.age, 10, 17.99)" class="small warn">18 yaş altında kalori kısıtlaması önerilmez; uygulama sana kilo vermek için plan yapmayacak.</p>
    </section>

    <section v-else-if="step === 2" class="card">
      <h2>Boy ve kilo</h2>
      <div class="row2">
        <label class="field"><span class="label">Boy (cm)</span><input v-model.number="p.heightCm" type="number" inputmode="decimal" placeholder="Ör. 170" /></label>
        <label class="field"><span class="label">Kilo (kg)</span><input v-model.number="p.weightKg" type="number" inputmode="decimal" step="0.1" placeholder="Ör. 82,5" /></label>
      </div>
      <label class="field"><span class="label">Bel çevresi (cm) – biliyorsan</span>
        <input :value="waistKnown ?? ''" type="number" inputmode="decimal" placeholder="Göbek hizasından, nefes verirken" @input="waistKnown = ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : null" /></label>
      <p class="small muted">Bel ölçüsü sağlık riskini kiloya göre daha iyi gösterir; şimdi bilmiyorsan sonra Profil'den ekleyebilirsin.</p>
    </section>

    <section v-else-if="step === 3" class="card">
      <h2>Hedefin ne?</h2>
      <div class="field"><SegControl v-model="p.goal" :options="GOALS" label="Hedef" /></div>
      <div v-if="p.goal === 'lose'" class="field">
        <span class="label">Ne hızla?</span>
        <SegControl v-model="p.weeklyRate" :options="RATES" label="Hız" />
        <p class="small muted">Orta hız çoğu kişi için en sürdürülebiliridir; hızlı kayıpta kas kaybı ve açlık artar.</p>
      </div>
      <div class="field"><span class="label">Günlük hareketin</span><SegControl v-model="p.activity" :options="L.ACTIVITY" label="Aktivite" />
        <p class="small muted">{{ L.ACTIVITY.find((a) => a.value === p.activity)?.hint }}</p></div>
      <div class="field"><span class="label">Haftada kaç gün spor yapabilirsin?</span><SegControl v-model="p.trainingDays" :options="L.DAYS" label="Gün" /></div>
    </section>

    <section v-else-if="step === 4" class="card">
      <h2>Nasıl yiyorsun?</h2>
      <div class="field">
        <span class="label">Hangi öğünleri yiyorsun?</span>
        <div class="chips">
          <button v-for="s in SLOT_ORDER" :key="s" type="button" :aria-pressed="(p.mealSlots ?? []).includes(s)" @click="toggleMeal(s)">
            {{ (p.mealSlots ?? []).includes(s) ? '✓ ' : '' }}{{ MEAL_LABEL[s] }}
          </button>
        </div>
      </div>
      <div class="field"><span class="label">Hayvansal ürünler</span><SegControl v-model="p.animalFoods" :options="L.ANIMAL" label="Hayvansal" /></div>
      <div class="field"><span class="label">Yemek yapmaya ne kadar vaktin var?</span><SegControl v-model="p.cookingTime" :options="L.COOKING" label="Pişirme" /></div>
      <p class="small muted">Sevmediğin yiyecekleri ve öğün saatlerini sonra Ben → Profil'den seçebilirsin.</p>
    </section>

    <section v-else class="card">
      <h2>Sağlık durumu</h2>
      <p class="small muted">Varsa işaretle; plan buna göre güvenli hâle getirilir (bazı durumlarda kalori kısıtlaması yapılmaz ve hekime yönlendirilir).</p>
      <label v-for="h in L.HEALTH" :key="h.key" class="check"><input v-model="p.health[h.key]" type="checkbox" /><span>{{ h.label }}</span></label>
      <p class="small muted">Bu uygulama tanı koymaz ve diyetisyenin yerini tutmaz.</p>
    </section>

    <div class="btns">
      <button v-if="step > 0" type="button" class="btn ghost" @click="step--">Geri</button>
      <span v-else />
      <button v-if="step < STEPS - 1" type="button" class="btn" :disabled="!okStep" @click="step++">Devam</button>
      <button v-else type="button" class="btn" @click="finish">Planımı hazırla →</button>
    </div>
  </div>
</template>

<style scoped>
.onboard { padding-bottom: 40px; }
.dots { display: flex; gap: 6px; justify-content: center; margin: 8px 0 16px; }
.dots span { width: 28px; height: 5px; border-radius: 3px; background: var(--line); }
.dots span.on { background: var(--accent); }
h1 { margin-top: 0; }
.btns { display: flex; justify-content: space-between; gap: 10px; margin-top: 16px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chips button { border: 0; border-radius: 999px; padding: 7px 12px; font: inherit; font-size: 0.85rem; font-weight: 650; background: var(--surface-2); color: var(--ink-2); cursor: pointer; }
.chips button[aria-pressed='true'] { background: var(--accent); color: var(--accent-ink); }
.warn { color: var(--stop-border); }
.link { background: none; border: 0; padding: 0; margin-top: 12px; font: inherit; color: var(--accent); cursor: pointer; text-decoration: underline; }
</style>
