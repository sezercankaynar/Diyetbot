<script setup lang="ts">
import { computed, ref } from 'vue'
import { adjustmentCooldown, MIN_DAYS, type AdjustmentOption } from '@/engine'
import { today, useAppStore } from '@/stores/app'
import WeightChart from '@/components/WeightChart.vue'
import StatBox from '@/components/StatBox.vue'
import CoachSection from '@/components/CoachSection.vue'
import { fmt } from '@/content/labels'

const store = useAppStore()

const date = ref(today())
const kg = ref<number | null>(store.sortedLogs.at(-1)?.kg ?? store.profile.weightKg)
const editing = ref<string | null>(null)
const valid = computed(() => /^\d{4}-\d{2}-\d{2}$/.test(date.value) && kg.value !== null && kg.value >= 30 && kg.value <= 300)

async function save() {
  if (!valid.value || kg.value === null) return
  await store.upsertWeighIn({ date: date.value, kg: Math.round(kg.value * 10) / 10 }, editing.value ?? undefined)
  editing.value = null
  date.value = today()
}
function edit(d: string, w: number) {
  editing.value = d
  date.value = d
  kg.value = w
}
function cancelEdit() {
  editing.value = null
  date.value = today()
}
async function remove(d: string) {
  if (confirm(`${d} tarihli kayıt silinsin mi?`)) await store.deleteWeighIn(d)
}

const a = computed(() => store.analysis)
const cooldown = computed(() => adjustmentCooldown(store.sortedAdjustments[0]?.date, today()))
const recentLogs = computed(() => [...store.sortedLogs].reverse())
const showAll = ref(false)

const fmtRate = (r: number) => `${r > 0 ? '+' : ''}${fmt(r, 2)}`

async function apply(o: AdjustmentOption) {
  if (a.value.status !== 'ready') return
  await store.applyAdjustment(o, a.value.message)
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1>Takip</h1>
      <span class="sub">{{ store.sortedLogs.length }} kayıt</span>
    </header>

    <section class="card">
      <h2>{{ editing ? 'Kaydı düzenle' : 'Bugünkü tartı' }}</h2>
      <form class="weigh" @submit.prevent="save">
        <label class="field"><span class="label">Tarih</span>
          <input v-model="date" type="date" :max="today()" required /></label>
        <label class="field"><span class="label">Kilo (kg)</span>
          <input v-model.number="kg" type="number" inputmode="decimal" step="0.1" min="30" max="300" required /></label>
        <div class="btn-row">
          <button class="btn" type="submit" :disabled="!valid">{{ editing ? 'Güncelle' : 'Kaydet' }}</button>
          <button v-if="editing" class="btn ghost" type="button" @click="cancelEdit">Vazgeç</button>
        </div>
      </form>
      <p class="small muted">Her sabah, tuvaletten sonra, aynı koşullarda tartılın. Son kayıt profil kilonuzu günceller.</p>
    </section>

    <section class="card">
      <h2>Trend</h2>
      <WeightChart :logs="store.weighLogs" />
    </section>

    <section class="card">
      <h2>Haftalık değerlendirme</h2>
      <template v-if="store.plan.safety.stop">
        <p class="muted">Güvenlik durdurması olduğu için kalori düzeltmesi önerilmiyor.</p>
      </template>
      <template v-else-if="a.status === 'insufficient'">
        <p>
          Değerlendirme için en az <span class="num">{{ MIN_DAYS }}</span> günlük veri gerekiyor.
          <strong><span class="num">{{ a.daysRemaining }}</span> gün kaldı.</strong>
        </p>
        <div class="progress"><div :style="{ width: Math.min(100, (a.daysLogged / MIN_DAYS) * 100) + '%' }" /></div>
      </template>
      <template v-else>
        <div class="stats">
          <StatBox label="Son 7 gün ort." :value="fmt(a.lastWeekAvg, 2)" unit="kg" />
          <StatBox label="Önceki 7 gün" :value="fmt(a.prevWeekAvg, 2)" unit="kg" />
          <StatBox label="Haftalık değişim" :value="fmtRate(a.weeklyRate)" unit="kg" />
          <StatBox label="Hedef" :value="fmtRate(a.targetRate)" unit="kg/hf" />
        </div>
        <p style="margin-top: 10px"><strong>{{ a.message }}</strong></p>
        <template v-if="a.verdict === 'adjust'">
          <p v-if="cooldown > 0" class="small muted">
            Son düzeltmenin etkisini görmek için <span class="num">{{ cooldown }}</span> gün daha veri toplayın.
          </p>
          <div v-else class="options">
            <div v-for="o in a.options" :key="o.label" class="option">
              <span>{{ o.label }}</span>
              <button class="btn small" type="button" @click="apply(o)">Uygula</button>
            </div>
          </div>
        </template>
      </template>
    </section>

    <CoachSection v-if="!store.plan.safety.stop" />

    <section v-if="store.sortedAdjustments.length" class="card">
      <h2>Düzeltme geçmişi</h2>
      <table class="small">
        <thead><tr><th>Tarih</th><th>Değişiklik</th><th class="r">kcal</th><th></th></tr></thead>
        <tbody>
          <tr v-for="adj in store.sortedAdjustments" :key="adj.id">
            <td class="num">{{ adj.date }}</td>
            <td>{{ adj.reason }}</td>
            <td class="r num">{{ adj.kcalDelta ? `${adj.fromKcal}→${adj.toKcal}` : `+${adj.stepsDelta} adım` }}</td>
            <td class="r"><button class="btn danger small" type="button" @click="store.deleteAdjustment(adj.id)">Geri al</button></td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-if="recentLogs.length" class="card">
      <h2>Kayıtlar</h2>
      <table>
        <thead><tr><th>Tarih</th><th class="r">kg</th><th></th></tr></thead>
        <tbody>
          <tr v-for="l in showAll ? recentLogs : recentLogs.slice(0, 14)" :key="l.date">
            <td class="num">{{ l.date }}</td>
            <td class="r num">{{ fmt(l.kg, 1) }}</td>
            <td class="r actions">
              <button class="btn ghost small" type="button" @click="edit(l.date, l.kg)">Düzenle</button>
              <button class="btn danger small" type="button" :aria-label="`${l.date} sil`" @click="remove(l.date)">Sil</button>
            </td>
          </tr>
        </tbody>
      </table>
      <button v-if="recentLogs.length > 14 && !showAll" class="btn ghost small" style="margin-top: 8px" type="button" @click="showAll = true">
        Tümünü göster ({{ recentLogs.length }})
      </button>
    </section>
  </div>
</template>

<style scoped>
.weigh { display: grid; grid-template-columns: 1fr 1fr; gap: 0 10px; }
.weigh .btn-row { grid-column: 1 / -1; }
.progress { height: 8px; background: var(--rule); border-radius: 4px; overflow: hidden; margin-top: 8px; }
.progress > div { height: 100%; background: var(--accent); }
.options { display: grid; gap: 8px; margin-top: 8px; }
.option {
  display: flex; justify-content: space-between; align-items: center; gap: 10px;
  border: 1px solid var(--rule); border-radius: var(--radius); padding: 8px 10px; background: var(--paper);
}
.actions { white-space: nowrap; }
.actions .btn + .btn { margin-left: 4px; }
</style>
