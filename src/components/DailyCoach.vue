<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { dayReview, HABITS, REMINDER_INTERVALS, waterNudge, type WaterReminder } from '@/engine'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const choosing = ref(false)
const picked = ref<string[]>([])
const MAX_HABITS = 3

const review = computed(() => {
  const e = store.plan.energy
  const m = store.plan.macros
  if (!e || !m) return null
  return dayReview(store.todayTotals, e.target, m.proteinG, store.todayLog.water, store.waterTarget)
})
const active = computed(() => HABITS.filter((h) => store.activeHabits.includes(h.id)))

// Water reminder: in-app nudge (checked every minute) and the notification settings.
const now = ref(new Date())
const timer = setInterval(() => (now.value = new Date()), 60_000)
onBeforeUnmount(() => clearInterval(timer))
const nudge = computed(() =>
  waterNudge(store.waterReminder, now.value, store.todayLog.water, store.waterTarget, store.todayLog.lastWaterAt),
)
const editing = ref(false)
const draft = ref<WaterReminder>({ ...store.waterReminder })
function openSettings() {
  draft.value = { ...store.waterReminder, on: true }
  editing.value = true
}
async function saveReminder(on: boolean) {
  await store.setWaterReminder({ ...draft.value, on })
  editing.value = false
}
const intervalText = (m: number) => (m % 60 ? `${Math.floor(m / 60)},5 saat` : `${m / 60} saat`)

function startChoosing() {
  picked.value = [...store.activeHabits]
  choosing.value = true
}
function togglePick(id: string) {
  picked.value = picked.value.includes(id)
    ? picked.value.filter((x) => x !== id)
    : picked.value.length < MAX_HABITS ? [...picked.value, id] : picked.value
}
async function savePicks() {
  await store.setHabits(picked.value)
  choosing.value = false
}
</script>

<template>
  <section class="card">
    <div class="row-head">
      <h2>Su</h2>
      <span class="small muted num">{{ store.todayLog.water }} / {{ store.waterTarget }} bardak</span>
    </div>
    <div class="water">
      <button type="button" class="round" aria-label="Bir bardak çıkar" @click="store.addWater(-1)">−</button>
      <div class="glasses" :aria-label="`${store.todayLog.water} / ${store.waterTarget} bardak`">
        <span v-for="i in store.waterTarget" :key="i" class="drop" :class="{ full: i <= store.todayLog.water }" />
      </div>
      <button type="button" class="round add" aria-label="Bir bardak ekle" @click="store.addWater(1)">+</button>
    </div>
    <p v-if="nudge" class="nudge small" role="status">💧 {{ nudge }}</p>
    <div class="remind">
      <button type="button" class="link small" :aria-expanded="editing" @click="editing ? (editing = false) : openSettings()">
        🔔 Su hatırlatıcısı: <strong>{{ store.waterReminder.on ? `açık · ${intervalText(store.waterReminder.everyMin)}te bir, ${store.waterReminder.start}–${store.waterReminder.end}` : 'kapalı (açmak için dokun)' }}</strong>
      </button>
      <p v-if="store.waterReminder.on && store.waterNotify === 'denied'" class="small warn">
        Telefon bildirimlere izin vermiyor; hatırlatma sadece uygulama açıkken burada görünür. Ayarlar → Uygulamalar → Diyetbot → Bildirimler'den açabilirsin.
      </p>
      <div v-if="editing" class="remind-form">
        <div class="label">Ne sıklıkla?</div>
        <div class="chips">
          <button v-for="m in REMINDER_INTERVALS" :key="m" type="button" :aria-pressed="draft.everyMin === m" @click="draft.everyMin = m">{{ intervalText(m) }}</button>
        </div>
        <div class="times">
          <label><span class="small muted">İlk hatırlatma</span><input v-model="draft.start" type="time" /></label>
          <label><span class="small muted">Son hatırlatma</span><input v-model="draft.end" type="time" /></label>
        </div>
        <p class="small muted">Telefona bildirim gelir; bildirimdeki "İçtim" düğmesi bir bardak ekler. Günlük hedefe ulaşınca o günün kalan hatırlatmaları gelmez.</p>
        <div class="remind-btns">
          <button v-if="store.waterReminder.on" type="button" class="btn ghost small" @click="saveReminder(false)">Kapat</button>
          <button type="button" class="btn small" @click="saveReminder(true)">Kaydet ve aç</button>
        </div>
      </div>
    </div>
  </section>

  <section class="card">
    <div class="row-head">
      <h2>Alışkanlıklar</h2>
      <a v-if="!choosing" href="#" @click.prevent="startChoosing">{{ active.length ? 'Değiştir' : 'Seç' }}</a>
    </div>
    <template v-if="!choosing">
      <p v-if="!active.length" class="small muted">
        Küçük ama her gün yapılan alışkanlıklar büyük değişikliklerden daha kalıcıdır. 1–3 tane seç.
      </p>
      <div class="chips">
        <button
          v-for="h in active" :key="h.id" type="button" class="chip"
          :aria-pressed="store.todayLog.habits.includes(h.id)" @click="store.toggleHabit(h.id)"
        >
          <span class="dot">{{ store.todayLog.habits.includes(h.id) ? '✓' : '' }}</span>{{ h.label }}
        </button>
      </div>
    </template>
    <template v-else>
      <p class="small muted">En fazla {{ MAX_HABITS }} tane seç.</p>
      <label v-for="h in HABITS" :key="h.id" class="check">
        <input type="checkbox" :checked="picked.includes(h.id)" :disabled="!picked.includes(h.id) && picked.length >= MAX_HABITS" @change="togglePick(h.id)" />
        <span>{{ h.label }}</span>
      </label>
      <div class="btn-row">
        <button type="button" class="btn small" @click="savePicks">Kaydet</button>
        <button type="button" class="btn ghost small" @click="choosing = false">Vazgeç</button>
      </div>
    </template>
  </section>

  <section v-if="review" class="card review" :class="review.tone">
    <h2>Günün özeti</h2>
    <ul><li v-for="l in review.lines" :key="l">{{ l }}</li></ul>
  </section>
</template>

<style scoped>
.row-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
.row-head a { font-size: 0.85rem; }
.water { display: flex; align-items: center; gap: 10px; }
.nudge { margin: 10px 0 0; background: color-mix(in srgb, var(--c-water) 14%, var(--surface)); border-radius: 12px; padding: 8px 10px; }
.remind { margin-top: 10px; }
.link { background: none; border: 0; padding: 0; font: inherit; color: var(--ink-2); text-align: left; cursor: pointer; }
.remind-form { margin-top: 8px; background: var(--surface-2); border-radius: 12px; padding: 10px 12px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0 10px; }
.chips button { border: 0; border-radius: 999px; padding: 6px 11px; font: inherit; font-size: 0.82rem; font-weight: 650; background: var(--surface); color: var(--ink-2); cursor: pointer; }
.chips button[aria-pressed='true'] { background: var(--accent); color: var(--accent-ink); }
.times { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.remind-btns { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.warn { color: var(--stop-border); }
.round { width: 38px; height: 38px; border-radius: 50%; border: 0; background: var(--surface-2); color: var(--ink); font-size: 1.3rem; font-weight: 700; cursor: pointer; flex: none; }
.round.add { background: var(--c-water); color: #fff; }
.glasses { flex: 1; display: flex; flex-wrap: wrap; gap: 5px; justify-content: center; }
.drop { width: 14px; height: 18px; border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%; background: var(--surface-2); }
.drop.full { background: var(--c-water); }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  display: flex; align-items: center; gap: 8px; text-align: left;
  border: 0; border-radius: 14px; padding: 10px 12px; font: inherit; font-size: 0.88rem; font-weight: 600;
  background: var(--surface-2); color: var(--ink); cursor: pointer;
}
.chip .dot { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--line); display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; flex: none; }
.chip[aria-pressed='true'] { background: var(--accent-soft); }
.chip[aria-pressed='true'] .dot { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
.review.good { background: var(--accent-soft); }
.review.warn { background: var(--warn-bg); }
.review ul { padding-left: 1.1em; }
</style>
