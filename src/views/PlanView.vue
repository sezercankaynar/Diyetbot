<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import CalloutBox from '@/components/CalloutBox.vue'
import ScoreBar from '@/components/ScoreBar.vue'
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
    <template v-if="plan.safety.stop">
      <CalloutBox v-for="c in plan.safety.stops" :key="c.code" :callout="c" />
      <p class="muted small">Güvenlik nedeniyle kalori ve makro hedefi gösterilmiyor.</p>
    </template>

    <template v-else-if="plan.energy && plan.macros">
      <section class="card target">
        <div class="label">Günlük hedefin</div>
        <div class="kcal num">{{ fmt(plan.energy.target) }} <span>kcal</span></div>
        <div class="tiles">
          <div class="tile p"><strong class="num">{{ plan.macros.proteinG }} g</strong><span>Protein</span></div>
          <div class="tile c"><strong class="num">{{ plan.macros.carbG }} g</strong><span>Karbonhidrat</span></div>
          <div class="tile f"><strong class="num">{{ plan.macros.fatG }} g</strong><span>Yağ</span></div>
        </div>
        <div class="small muted num">Lif {{ plan.macros.fiberG }} g · Su {{ fmt(plan.macros.waterMl / 1000, 1) }} L</div>
      </section>

      <CalloutBox v-for="c in plan.safety.warnings" :key="c.code" :callout="c" />
      <CalloutBox v-for="c in plan.notes" :key="c.code" :callout="c" />

      <section v-if="plan.diets && plan.recommendedDiet" class="card">
        <div class="label">Beslenme tarzın</div>
        <h2 class="diet-name">
          {{ plan.recommendedDiet.name }}
          <span class="tag">{{ plan.recommendedDiet.id === topId ? 'sana en uygun' : 'seçimin' }}</span>
        </h2>
        <ul v-if="plan.recommendedDiet.reasons.length" class="small muted reasons">
          <li v-for="r in plan.recommendedDiet.reasons" :key="r">{{ r.replace(/^\+\d+: /, '') }}</li>
        </ul>
        <details class="inner">
          <summary>Diğer seçenekler</summary>
          <ul class="diets">
            <li v-for="d in plan.diets" :key="d.id" :class="{ excluded: d.excluded }">
              <button type="button" class="diet-btn" :disabled="d.excluded" :aria-pressed="d.id === plan.recommendedDiet.id" @click="choose(d.id)">
                <span>{{ d.name }}<span v-if="d.excluded" class="small"> – kapalı</span></span>
                <span class="num small muted">{{ d.score }}</span>
              </button>
              <ScoreBar :score="d.score" :max="maxScore" :highlight="d.id === plan.recommendedDiet.id" />
            </li>
          </ul>
        </details>
      </section>

      <details v-if="plan.meals" class="fold">
        <summary>Tabak kuralları <span class="hint">öğün başı {{ plan.meals.proteinPerMealG }} g protein</span></summary>
        <div class="fold-body">
          <ol><li v-for="r in plan.meals.plateRules" :key="r">{{ r }}</li></ol>
          <template v-if="plan.meals.hungerTips.length">
            <h3>Açlık yönetimi</h3>
            <ul><li v-for="t in plan.meals.hungerTips" :key="t">{{ t }}</li></ul>
          </template>
          <h3>Protein kaynakları</h3>
          <p class="small">{{ plan.meals.proteinSources.join(' · ') }}</p>
        </div>
      </details>

      <details v-if="plan.intermittentFasting" class="fold">
        <summary>Aralıklı oruç (16:8) <span class="hint">{{ plan.intermittentFasting.disabled ? 'önerilmez' : plan.intermittentFasting.recommended ? 'uygun' : 'gerekli değil' }}</span></summary>
        <div class="fold-body small">
          <ul v-if="plan.intermittentFasting.reasons.length"><li v-for="r in plan.intermittentFasting.reasons" :key="r">{{ r }}</li></ul>
          <p>{{ plan.intermittentFasting.note }}</p>
        </div>
      </details>

      <details class="fold">
        <summary>Hesap detayları</summary>
        <div class="fold-body">
          <table class="small">
            <tbody>
              <tr><td>BMR (Mifflin-St Jeor)</td><td class="r num">{{ fmt(plan.energy.bmr) }} kcal</td></tr>
              <tr><td>Antrenman katsayısı</td><td class="r num">×{{ plan.energy.trainingFactor.toFixed(2) }}</td></tr>
              <tr><td>Günlük harcama (TDEE)</td><td class="r num">{{ fmt(plan.energy.tdee) }} kcal</td></tr>
              <tr><td>Güvenli alt sınır</td><td class="r num">{{ fmt(plan.energy.floor) }} kcal</td></tr>
              <tr><td>BKİ</td><td class="r num">{{ fmt(plan.energy.bmi, 1) }}</td></tr>
              <tr><td>Bel/boy oranı</td><td class="r num">{{ fmt(plan.energy.whtr, 2) }}{{ plan.energy.whtrFlag ? ' ⚠' : '' }}</td></tr>
            </tbody>
          </table>
        </div>
      </details>

      <button type="button" class="card link-card" @click="emit('go', 'spor')">
        <span>🏋️ Antrenman programın</span><span class="muted">Spor →</span>
      </button>
      <button type="button" class="card link-card" @click="emit('go', 'kanit')">
        <span>📚 Bu öneriler neye dayanıyor?</span><span class="muted">Kanıtlar →</span>
      </button>
    </template>
  </div>
</template>

<style scoped>
.target .kcal { font-size: 2.4rem; font-weight: 800; color: var(--accent); line-height: 1.1; margin: 2px 0 12px; }
.target .kcal span { font-size: 1rem; color: var(--ink-3); font-weight: 600; }
.tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; }
.tile { border-radius: 14px; padding: 10px; display: flex; flex-direction: column; gap: 2px; font-size: 0.78rem; font-weight: 600; color: var(--ink-2); }
.tile strong { font-size: 1.15rem; color: var(--ink); }
.tile.p { background: color-mix(in srgb, var(--c-protein) 14%, transparent); }
.tile.c { background: color-mix(in srgb, var(--c-carb) 16%, transparent); }
.tile.f { background: color-mix(in srgb, var(--c-fat) 14%, transparent); }
.diet-name { margin: 4px 0 6px; font-size: 1.3rem; }
.reasons { padding-left: 1.1em; }
details.inner summary { cursor: pointer; font-weight: 700; color: var(--accent); margin-top: 8px; }
.diets { list-style: none; padding: 0; margin: 8px 0 0; }
.diets > li { padding: 6px 0; }
.diet-btn { display: flex; justify-content: space-between; width: 100%; background: none; border: 0; padding: 4px 0 6px; font: inherit; color: inherit; cursor: pointer; text-align: left; }
.diet-btn[aria-pressed='true'] { font-weight: 800; color: var(--accent); }
.excluded { opacity: 0.5; }
.link-card { width: 100%; display: flex; justify-content: space-between; border: 0; font: inherit; font-weight: 700; color: var(--ink); cursor: pointer; text-align: left; }
</style>
