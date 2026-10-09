<script setup lang="ts">
import { computed, ref } from 'vue'
import { checkInDue, evaluateCheckIn, navyBodyFat, type CheckIn } from '@/engine'
import { today, useAppStore } from '@/stores/app'
import CheckInPanel from './CheckInPanel.vue'
import CheckInFeedback from './CheckInFeedback.vue'

const store = useAppStore()
const open = ref(false)
const expanded = ref<string | null>(null)

const due = computed(() => checkInDue(store.sortedCheckIns[0]?.date, today()))
const history = computed(() => store.sortedCheckIns)

function feedbackFor(c: CheckIn, i: number) {
  const ctx = store.coachContext
  return ctx ? evaluateCheckIn(c, ctx, history.value[i + 1]) : null
}
const bf = (c: CheckIn) =>
  c.neckCm && c.waistCm ? navyBodyFat(store.profile.sex, store.profile.heightCm, c.neckCm, c.waistCm, c.hipCm) : null

// Waist trend (oldest → newest) for a tiny sparkline.
const waist = computed(() => [...history.value].reverse().filter((c) => c.waistCm).map((c) => ({ date: c.date, v: c.waistCm! })))
const spark = computed(() => {
  const pts = waist.value
  if (pts.length < 2) return ''
  const min = Math.min(...pts.map((p) => p.v)) - 1
  const max = Math.max(...pts.map((p) => p.v)) + 1
  return pts.map((p, i) => `${(i / (pts.length - 1)) * 300},${60 - ((p.v - min) / (max - min)) * 60}`).join(' ')
})
async function remove(id: string) {
  if (confirm('Bu görüşme kaydı silinsin mi?')) await store.deleteCheckIn(id)
}
</script>

<template>
  <section class="card">
    <h2>Haftalık görüşme</h2>
    <p v-if="due === 0">
      <strong>Görüşme zamanı.</strong> Ölçülerini al ve haftanı değerlendir; sana özel geri bildirim hazırlayayım.
    </p>
    <p v-else class="small muted">Sonraki görüşmeye <span class="num">{{ due }}</span> gün var. İstersen erken de yapabilirsin.</p>
    <button type="button" class="btn" :class="{ ghost: due > 0 }" @click="open = true">Görüşmeyi başlat</button>

    <div v-if="waist.length >= 2" class="trend">
      <div class="label">Bel ölçüsü (cm)</div>
      <svg viewBox="-4 -4 308 68" role="img" aria-label="Bel ölçüsü değişimi">
        <polyline :points="spark" fill="none" stroke="var(--chart-line)" stroke-width="2" stroke-linejoin="round" />
      </svg>
      <div class="small muted num">
        {{ waist[0].v }} → {{ waist[waist.length - 1].v }} cm
        ({{ (waist[waist.length - 1].v - waist[0].v > 0 ? '+' : '') + (Math.round((waist[waist.length - 1].v - waist[0].v) * 10) / 10).toLocaleString('tr-TR') }})
      </div>
    </div>
  </section>

  <section v-if="history.length" class="card">
    <h2>Görüşme geçmişi</h2>
    <div v-for="(c, i) in history" :key="c.id" class="hist">
      <button type="button" class="hist-head" :aria-expanded="expanded === c.id" @click="expanded = expanded === c.id ? null : c.id">
        <span class="num">{{ c.date }}</span>
        <span class="small muted">
          <template v-if="c.waistCm">bel {{ c.waistCm }} cm · </template>
          <template v-if="bf(c)">yağ %{{ bf(c)!.toLocaleString('tr-TR') }} · </template>
          uyum %{{ c.adherence }}
        </span>
      </button>
      <div v-if="expanded === c.id" class="hist-body">
        <p v-if="c.note" class="small">“{{ c.note }}”</p>
        <CheckInFeedback v-if="feedbackFor(c, i)" :feedback="feedbackFor(c, i)!" />
        <button type="button" class="btn danger small" @click="remove(c.id)">Sil</button>
      </div>
    </div>
  </section>

  <CheckInPanel v-if="open" @close="open = false" />
</template>

<style scoped>
.trend { margin-top: 14px; }
.trend svg { width: 100%; height: 70px; display: block; }
.hist { border-bottom: 1px dotted var(--rule); }
.hist-head { width: 100%; display: flex; justify-content: space-between; gap: 8px; background: none; border: 0; padding: 10px 0; font: inherit; color: inherit; cursor: pointer; text-align: left; }
.hist-body { padding-bottom: 10px; }
</style>
