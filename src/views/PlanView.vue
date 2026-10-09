<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import CalloutBox from '@/components/CalloutBox.vue'
import ScoreBar from '@/components/ScoreBar.vue'
import StatBox from '@/components/StatBox.vue'
import { fmt } from '@/content/labels'
import type { DietId } from '@/engine'

const store = useAppStore()
const emit = defineEmits<{ go: [tab: string] }>()
const plan = computed(() => store.plan)
const maxScore = computed(() => Math.max(1, ...(plan.value.diets ?? []).map((d) => d.score)))
const topId = computed(() => plan.value.diets?.find((d) => !d.excluded)?.id)

function choose(id: DietId) {
  store.setDiet(id === topId.value ? null : id)
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1>Plan</h1>
      <a href="#kanit" class="sub" @click.prevent="emit('go', 'kanit')">Kanıtlar →</a>
    </header>

    <template v-if="plan.safety.stop">
      <CalloutBox v-for="c in plan.safety.stops" :key="c.code" :callout="c" />
      <p class="muted small">Güvenlik nedeniyle kalori ve makro hedefi gösterilmiyor.</p>
    </template>

    <template v-else-if="plan.energy && plan.macros">
      <CalloutBox v-for="c in plan.safety.warnings" :key="c.code" :callout="c" />
      <CalloutBox v-for="c in plan.notes" :key="c.code" :callout="c" />

      <section class="card">
        <h2>Enerji ve makrolar</h2>
        <div class="stats">
          <StatBox big label="Kalori hedefi" :value="fmt(plan.energy.target)" unit="kcal/gün" />
          <StatBox label="Protein" :value="plan.macros.proteinG" unit="g" />
          <StatBox label="Yağ" :value="plan.macros.fatG" unit="g" />
          <StatBox label="Karbonhidrat" :value="plan.macros.carbG" unit="g" />
          <StatBox label="Lif" :value="plan.macros.fiberG" unit="g" />
          <StatBox label="Su" :value="fmt(plan.macros.waterMl / 1000, 1)" unit="L" />
        </div>
        <table class="small" style="margin-top: 12px">
          <tbody>
            <tr><td>BMR (Mifflin-St Jeor)</td><td class="r num">{{ fmt(plan.energy.bmr) }} kcal</td></tr>
            <tr><td>Antrenman katsayısı</td><td class="r num">×{{ plan.energy.trainingFactor.toFixed(2) }}</td></tr>
            <tr><td>TDEE</td><td class="r num">{{ fmt(plan.energy.tdee) }} kcal</td></tr>
            <tr><td>Güvenli alt sınır</td><td class="r num">{{ fmt(plan.energy.floor) }} kcal</td></tr>
            <tr><td>BKİ</td><td class="r num">{{ fmt(plan.energy.bmi, 1) }}</td></tr>
            <tr>
              <td>Bel/boy oranı</td>
              <td class="r num" :style="{ color: plan.energy.whtrFlag ? 'var(--warn-border)' : undefined }">
                {{ fmt(plan.energy.whtr, 2) }}{{ plan.energy.whtrFlag ? ' ⚠' : '' }}
              </td>
            </tr>
            <tr v-if="plan.macros.refWeightKg !== store.profile.weightKg">
              <td>Referans kilo (BKİ 25)</td><td class="r num">{{ fmt(plan.macros.refWeightKg, 1) }} kg</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-if="plan.diets && plan.recommendedDiet" class="card">
        <h2>Diyet önerisi</h2>
        <p>
          <strong>{{ plan.recommendedDiet.name }}</strong>
          <span v-if="plan.recommendedDiet.id === topId" class="tag">önerilen</span>
          <span v-else class="tag">seçiminiz</span>
        </p>
        <p class="small muted">Başka bir diyeti seçmek için dokunun; makrolar yeniden hesaplanır.</p>
        <ul class="diets">
          <li v-for="d in plan.diets" :key="d.id" :class="{ excluded: d.excluded }">
            <button
              type="button"
              class="diet-btn"
              :disabled="d.excluded"
              :aria-pressed="d.id === plan.recommendedDiet.id"
              @click="choose(d.id)"
            >
              <span class="dname">{{ d.name }}<span v-if="d.excluded" class="small"> – güvenlik nedeniyle kapalı</span></span>
              <span class="num">{{ d.score }}</span>
            </button>
            <ScoreBar :score="d.score" :max="maxScore" :highlight="d.id === plan.recommendedDiet.id" />
            <ul v-if="d.reasons.length" class="reasons small muted">
              <li v-for="r in d.reasons" :key="r">{{ r }}</li>
            </ul>
          </li>
        </ul>
      </section>

      <section v-if="plan.intermittentFasting" class="card">
        <h2>Aralıklı oruç (16:8)</h2>
        <p v-if="plan.intermittentFasting.disabled">
          <strong>Önerilmez.</strong> <span class="muted">Sağlık durumunuz nedeniyle zaman kısıtlı beslenme kapalı.</span>
        </p>
        <template v-else>
          <p>
            Skor <span class="num">{{ plan.intermittentFasting.score }}</span> –
            <strong>{{ plan.intermittentFasting.recommended ? 'Uygun' : 'Gerekli değil' }}</strong>
          </p>
          <ul v-if="plan.intermittentFasting.reasons.length" class="small muted">
            <li v-for="r in plan.intermittentFasting.reasons" :key="r">{{ r }}</li>
          </ul>
          <p class="small">{{ plan.intermittentFasting.note }}</p>
        </template>
      </section>

      <section v-if="plan.meals" class="card">
        <h2>Öğün kuralları</h2>
        <div class="stats">
          <StatBox label="Öğün" :value="plan.meals.meals === 4 ? '4+' : plan.meals.meals" />
          <StatBox label="Öğün başı protein" :value="plan.meals.proteinPerMealG" unit="g" />
        </div>
        <h3 style="margin-top: 12px">Tabak kuralları</h3>
        <ol>
          <li v-for="r in plan.meals.plateRules" :key="r">{{ r }}</li>
        </ol>
        <template v-if="plan.meals.hungerTips.length">
          <h3>Açlık yönetimi</h3>
          <ul><li v-for="t in plan.meals.hungerTips" :key="t">{{ t }}</li></ul>
        </template>
        <h3>Protein kaynakları</h3>
        <p class="small">{{ plan.meals.proteinSources.join(' · ') }}</p>
      </section>

      <section v-if="plan.training" class="card">
        <h2>Antrenman haftası</h2>
        <p><span class="tag">{{ plan.training.split }}</span></p>
        <details v-for="d in plan.training.days" :key="d.name" class="day">
          <summary>{{ d.name }}</summary>
          <table class="small">
            <thead><tr><th>Egzersiz</th><th class="r">Set</th><th class="r">Tekrar</th></tr></thead>
            <tbody>
              <tr v-for="e in d.exercises" :key="e.name">
                <td>{{ e.name }}</td><td class="r num">{{ e.sets }}</td><td class="r num">{{ e.reps }}</td>
              </tr>
            </tbody>
          </table>
        </details>
        <h3 style="margin-top: 12px">İlerleme</h3>
        <ul><li v-for="p in plan.training.progression" :key="p">{{ p }}</li></ul>
        <h3>Kardiyo, adım, uyku</h3>
        <ul>
          <li>{{ plan.training.cardio }}</li>
          <li>
            {{ plan.training.steps }}
            <span v-if="store.stepsOffset > 0" class="tag">+{{ fmt(store.stepsOffset) }} düzeltme</span>
          </li>
          <li>{{ plan.training.sleep }}</li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.diets { list-style: none; padding: 0; margin: 8px 0 0; }
.diets > li { padding: 8px 0; border-bottom: 1px dotted var(--rule); }
.diets > li:last-child { border-bottom: 0; }
.diet-btn {
  display: flex; justify-content: space-between; align-items: baseline; width: 100%;
  background: none; border: 0; padding: 4px 0 6px; font: inherit; color: inherit; cursor: pointer; text-align: left;
}
.diet-btn[aria-pressed='true'] .dname { font-weight: 700; color: var(--accent); }
.excluded { opacity: 0.55; }
.reasons { margin-top: 6px; }
.day { border: 1px solid var(--rule); border-radius: var(--radius); padding: 8px 10px; margin: 8px 0; background: var(--paper); }
.day summary { cursor: pointer; font-weight: 600; }
ol { padding-left: 1.4em; }
</style>
