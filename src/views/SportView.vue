<script setup lang="ts">
import { computed, ref } from 'vue'
import { lastDays, stepTarget, weekSchedule, WEEKDAY_SHORT_TR, WEEKDAY_TR, type DayType } from '@/engine'
import { CARDIO_TYPES, COOLDOWN, EXERCISE_GUIDES, TRAINING_EVIDENCE, WARMUP, type ExerciseSlot } from '@/content/exercises'
import { useAppStore } from '@/stores/app'
import { stepsSupported } from '@/native/steps'
import CalloutBox from '@/components/CalloutBox.vue'
import { fmt } from '@/content/labels'

const emit = defineEmits<{ go: [tab: string] }>()
const store = useAppStore()

const training = computed(() => store.plan.training)
const schedule = computed(() => (training.value ? weekSchedule(store.profile, training.value) : []))
const todayIdx = computed(() => (new Date(`${store.todayDate}T12:00:00`).getDay() + 6) % 7)
const selected = ref<number | null>(null)
const dayIdx = computed(() => selected.value ?? todayIdx.value)
const day = computed(() => schedule.value[dayIdx.value])
const workout = computed(() => (day.value?.workout !== undefined ? training.value?.days[day.value.workout] : undefined))
const openEx = ref<string | null>(null)

const ICON: Record<DayType, string> = { strength: '🏋️', cardio: '🚴', walk: '🚶', rest: '😴' }
const guide = (slot?: string) => (slot ? EXERCISE_GUIDES[slot as ExerciseSlot] : undefined)

// Steps
const target = computed(() => stepTarget(store.profile.goal))
const stepsInput = ref<number | null>(store.todayLog.steps ?? null)
function saveSteps() {
  if (stepsInput.value !== null && stepsInput.value >= 0) store.setSteps(stepsInput.value)
}
const week = computed(() =>
  lastDays(store.todayDate, 7).map((d) => ({
    date: d,
    steps: store.daily.find((l) => l.date === d)?.steps ?? 0,
    wd: WEEKDAY_SHORT_TR[(new Date(`${d}T12:00:00`).getDay() + 6) % 7],
  })),
)
const maxSteps = computed(() => Math.max(target.value * 1.2, ...week.value.map((w) => w.steps)))
const avgSteps = computed(() => {
  const logged = week.value.filter((w) => w.steps > 0)
  return logged.length ? Math.round(logged.reduce((a, w) => a + w.steps, 0) / logged.length) : 0
})
// Health Connect (Android): steps are read automatically once allowed.
const syncing = ref(false)
const hcMsg = ref('')
const hcWarn = ref(false)
async function sync() {
  syncing.value = true
  const r = await store.syncSteps(true)
  syncing.value = false
  hcWarn.value = !r.ok
  if (r.ok) {
    stepsInput.value = store.todayLog.steps ?? null
    hcMsg.value = 'Son 7 günün adımları alındı. Uygulama açıldıkça kendiliğinden güncellenir.'
  } else if (r.reason === 'unavailable') {
    hcMsg.value = "Telefonda Health Connect yok. Play Store'dan \"Health Connect\" uygulamasını kur (Android 14 ve sonrasında hazır gelir); adım sayan uygulamanın (ör. Google Fit, Samsung Health) Health Connect'e yazmasına da izin ver."
  } else if (r.reason === 'denied') {
    hcMsg.value = 'Adım okuma izni verilmedi. İstersen tekrar dene ya da Health Connect ayarlarından izin ver.'
  } else hcMsg.value = 'Adımlar okunamadı. Adımları aşağıdan elle girebilirsin.'
}
const restText = (slot?: string) => {
  const g = guide(slot)
  if (!g) return ''
  const [a, b] = g.restSec
  const m = (x: number) => (x / 60).toLocaleString('tr-TR', { maximumFractionDigits: 1 })
  return a >= 60 ? `${m(a)}–${m(b)} dk` : `${a}–${b} sn`
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1>Spor</h1>
      <span v-if="training" class="sub">{{ training.split }}</span>
    </header>

    <template v-if="!store.hasProfile">
      <section class="card">
        <p>Antrenman planı için önce profilini doldur.</p>
        <button class="btn" type="button" @click="emit('go', 'ben')">Başla →</button>
      </section>
    </template>
    <template v-else-if="store.plan.safety.stop">
      <CalloutBox v-for="c in store.plan.safety.stops" :key="c.code" :callout="c" />
    </template>

    <template v-else-if="training && day">
      <div class="week" role="tablist" aria-label="Hafta">
        <button
          v-for="d in schedule" :key="d.weekday" type="button" role="tab"
          :aria-selected="d.weekday === dayIdx" :class="[d.type, { today: d.weekday === todayIdx }]"
          @click="selected = d.weekday"
        >
          <span class="wd">{{ WEEKDAY_SHORT_TR[d.weekday] }}</span>
          <span class="ic" aria-hidden="true">{{ ICON[d.type] }}</span>
        </button>
      </div>

      <section class="card day-card" :class="day.type">
        <div class="day-head">
          <span class="big-ic" aria-hidden="true">{{ ICON[day.type] }}</span>
          <div>
            <div class="label">{{ dayIdx === todayIdx ? 'Bugün' : WEEKDAY_TR[dayIdx] }}</div>
            <h2>{{ day.title }}</h2>
            <div class="small muted">{{ day.detail }}</div>
          </div>
        </div>

        <template v-if="workout">
          <p class="small muted" style="margin-top: 10px">
            Her harekette <strong>{{ workout.exercises[0]?.sets }} set × {{ workout.exercises[0]?.reps }} tekrar</strong>.
            Son setlerde 1–3 tekrar daha yapabilecek kadar güç bırak. Harekete dokun, nasıl yapılır gör.
          </p>
          <div v-for="(e, i) in workout.exercises" :key="e.name + i" class="ex">
            <button type="button" class="ex-head" :aria-expanded="openEx === e.name" @click="openEx = openEx === e.name ? null : e.name">
              <span class="n">{{ i + 1 }}</span>
              <span class="ex-name">{{ e.name }}</span>
              <span class="small muted num">{{ e.sets }}×{{ e.reps }}</span>
            </button>
            <div v-if="openEx === e.name && guide(e.slot)" class="ex-body small">
              <p class="muted">{{ guide(e.slot)!.muscles }}</p>
              <ol><li v-for="s in guide(e.slot)!.steps" :key="s">{{ s }}</li></ol>
              <div class="cues">
                <div v-for="c in guide(e.slot)!.cues" :key="c">⚠️ {{ c }}</div>
              </div>
              <p><strong>Dinlenme:</strong> {{ restText(e.slot) }}</p>
              <p><strong>Kolaylaştır:</strong> {{ guide(e.slot)!.easier }}</p>
              <p><strong>Zorlaştır:</strong> {{ guide(e.slot)!.harder }}</p>
            </div>
          </div>
        </template>

        <button
          v-if="dayIdx === todayIdx && day.type !== 'rest'" type="button" class="btn done-btn"
          :class="{ ghost: !store.todayLog.workout }" @click="store.toggleWorkout()"
        >
          {{ store.todayLog.workout ? '✓ Tamamlandı' : 'Tamamladım' }}
        </button>
      </section>

      <section class="card">
        <div class="steps-head">
          <h2>Adımlar</h2>
          <span class="small muted num">hedef {{ fmt(target) }}/gün</span>
        </div>
        <div v-if="stepsSupported()" class="hc">
          <button type="button" class="btn ghost small" :disabled="syncing" @click="sync">
            {{ store.stepsAuto ? '↻ Adımları güncelle' : '📲 Adımları telefondan al (Health Connect)' }}
          </button>
          <p v-if="hcMsg" class="small" :class="{ warn: hcWarn }">{{ hcMsg }}</p>
        </div>
        <form class="steps-form" @submit.prevent="saveSteps">
          <input v-model.number="stepsInput" type="number" inputmode="numeric" min="0" placeholder="Bugünkü adım sayın" aria-label="Bugünkü adım" />
          <button type="submit" class="btn">Kaydet</button>
        </form>
        <svg class="bars" viewBox="0 0 280 90" role="img" aria-label="Son 7 gün adım">
          <line x1="0" x2="280" :y1="80 - (target / maxSteps) * 70" :y2="80 - (target / maxSteps) * 70" class="goal" />
          <g v-for="(w, i) in week" :key="w.date">
            <rect :x="i * 40 + 8" :y="80 - (w.steps / maxSteps) * 70" width="24" :height="(w.steps / maxSteps) * 70" rx="5" :class="{ hit: w.steps >= target }" />
            <text :x="i * 40 + 20" y="90" text-anchor="middle">{{ w.wd }}</text>
          </g>
        </svg>
        <p class="small muted">
          7 gün ortalaması: <strong class="num">{{ fmt(avgSteps) }}</strong> adım. Günlük adım, kardiyodan bağımsız olarak harcamanı artırmanın en kolay yolu.
        </p>
      </section>

      <details class="fold">
        <summary>Hangisi: yürüyüş mü, ağırlık mı, kardiyo mu?</summary>
        <div class="fold-body small">
          <p><strong>Ağırlık antrenmanı</strong> haftada {{ store.profile.trainingDays }} gün: kalori açığında kas kaybını önler, metabolizmayı ve şekli korur. Programın temeli budur.</p>
          <p><strong>Kardiyo</strong> kalp sağlığı ve ek harcama içindir. Tempolu yürüyüş, bisiklet ya da yüzme (zone 2) yeterli; aralıklı yüksek tempo (HIIT) aynı sonucu daha kısa sürede verir.</p>
          <p><strong>Günlük adım</strong> ise her gün: hareketsiz geçen saatleri azaltır ve toplam harcamaya en çok katkıyı yapar.</p>
          <div v-for="c in CARDIO_TYPES" :key="c.id" class="cardio">
            <strong>{{ c.name }}</strong>
            <div>{{ c.what }}</div>
            <div class="muted">Yoğunluk: {{ c.howHard }}</div>
            <div class="muted">En iyisi: {{ c.bestFor }}</div>
          </div>
        </div>
      </details>

      <details class="fold">
        <summary>Isınma ve soğuma</summary>
        <div class="fold-body small">
          <h3>Isınma (5–8 dk)</h3>
          <ol><li v-for="w in WARMUP" :key="w">{{ w }}</li></ol>
          <h3>Soğuma</h3>
          <ol><li v-for="c in COOLDOWN" :key="c">{{ c }}</li></ol>
        </div>
      </details>

      <details class="fold">
        <summary>Nasıl ilerlerim?</summary>
        <div class="fold-body small">
          <ul><li v-for="p in training.progression" :key="p">{{ p }}</li></ul>
          <p>{{ training.sleep }}</p>
        </div>
      </details>

      <details class="fold">
        <summary>Neden böyle? <span class="hint">{{ TRAINING_EVIDENCE.length }} çalışma</span></summary>
        <div class="fold-body small">
          <div v-for="e in TRAINING_EVIDENCE" :key="e.id" class="ev">
            <strong>{{ e.title }}</strong>
            <div class="muted">{{ e.citation }}</div>
            <p>{{ e.summary }}</p>
            <p class="rule">→ {{ e.rule }}</p>
          </div>
        </div>
      </details>
    </template>
  </div>
</template>

<style scoped>
.week { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; margin-bottom: 14px; }
.week button {
  display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 0;
  border: 0; border-radius: 14px; background: var(--surface); box-shadow: var(--shadow);
  font: inherit; font-size: 0.75rem; font-weight: 700; color: var(--ink-2); cursor: pointer;
}
.week button.today { color: var(--accent); }
.week button[aria-selected='true'] { background: var(--accent); color: var(--accent-ink); }
.week .ic { font-size: 1.1rem; }
.day-head { display: flex; gap: 12px; align-items: center; }
.big-ic { font-size: 2rem; width: 52px; height: 52px; border-radius: 16px; background: var(--surface-2); display: flex; align-items: center; justify-content: center; flex: none; }
.ex + .ex { border-top: 1px solid var(--line); }
.ex-head { width: 100%; display: flex; align-items: center; gap: 10px; padding: 12px 0; background: none; border: 0; font: inherit; color: inherit; text-align: left; cursor: pointer; }
.n { width: 26px; height: 26px; border-radius: 50%; background: var(--accent-soft); color: var(--accent); font-weight: 800; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; flex: none; }
.ex-name { flex: 1; font-weight: 650; }
.ex-body { background: var(--surface-2); border-radius: 12px; padding: 10px 12px; margin-bottom: 10px; }
.ex-body ol { padding-left: 1.2em; }
.cues { display: grid; gap: 4px; margin: 6px 0; }
.done-btn { width: 100%; margin-top: 12px; }
.steps-head { display: flex; justify-content: space-between; align-items: baseline; }
.hc { margin: 8px 0 4px; }
.warn { color: var(--stop-border); }
.steps-form { display: flex; gap: 8px; margin: 8px 0 12px; }
.bars { width: 100%; height: 100px; display: block; }
.bars rect { fill: color-mix(in srgb, var(--accent) 40%, var(--surface-2)); }
.bars rect.hit { fill: var(--accent); }
.bars text { font-size: 9px; fill: var(--ink-3); }
.bars .goal { stroke: var(--accent-2); stroke-dasharray: 4 4; stroke-width: 1.5; }
.cardio { background: var(--surface-2); border-radius: 12px; padding: 10px 12px; margin-top: 8px; }
.ev + .ev { border-top: 1px solid var(--line); padding-top: 10px; margin-top: 10px; }
.rule { color: var(--accent); font-weight: 600; }
</style>
