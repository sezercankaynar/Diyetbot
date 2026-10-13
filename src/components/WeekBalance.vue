<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

// Days that went over are made up for by the rest of the week, a little each day.
const store = useAppStore()
const offer = computed(() => store.balanceOffer)
const DAY = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
const dayName = (iso: string) => DAY[new Date(`${iso}T12:00:00`).getDay()]
const per = computed(() => (offer.value ? Math.max(...offer.value.plan.map((x) => x.add)) : 0))
const covered = computed(() => (offer.value ? offer.value.plan.reduce((a, x) => a + x.add, 0) : 0))
const lighterToday = computed(() => store.menu?.lighter?.[store.todayDate] ?? 0)
// After making the rest of the week lighter: how much, from which day.
const lighterNext = computed(() => {
  const l = store.menu?.lighter ?? {}
  const next = Object.keys(l).filter((d) => d > store.todayDate).sort()
  return next.length ? { from: next[0], kcal: Math.max(...next.map((d) => l[d])) } : null
})
</script>

<template>
  <section v-if="offer" class="card bal">
    <h2>Haftalık denge</h2>
    <p class="small">
      Bu hafta hedefinin <strong class="num">{{ offer.pending }} kcal</strong> üstündesin
      ({{ offer.overDays.map((d) => `${dayName(d.date)} +${Math.round(d.over)}`).join(', ') }}). Önemli olan haftalık ortalama:
      kalan {{ offer.plan.length }} günün menüsünü günde <strong class="num">≈{{ per }} kcal</strong> hafifletirsem haftayı hedefinde kapatırsın.
    </p>
    <p class="small muted">
      Aç kalmazsın: öğünler atlanmaz, sadece pilav, ekmek gibi porsiyonlar biraz küçülür. Günlük güvenli alt sınırın altına inilmez.
      <template v-if="offer.pending - covered >= 100"> Bir günde en fazla 200 kcal hafifletiliyor; kalan {{ offer.pending - covered }} kcal'i dert etme, bir kerelik fazla kilonu değiştirmez.</template>
    </p>
    <div class="row">
      <button type="button" class="btn ghost small" @click="store.dismissWeekBalance()">Gerek yok</button>
      <button type="button" class="btn small" @click="store.applyWeekBalance()">Kalan günleri hafiflet</button>
    </div>
  </section>
  <p v-else-if="lighterToday" class="small note">⚖️ Haftalık denge: bugünkü hedefin {{ lighterToday }} kcal daha hafif, menün buna göre.</p>
  <p v-else-if="lighterNext" class="small note">⚖️ Haftalık denge: {{ dayName(lighterNext.from) }} gününden itibaren menün günde ≈{{ lighterNext.kcal }} kcal daha hafif.</p>
</template>

<style scoped>
.bal { border-left: 4px solid var(--info-border); }
.row { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.note { background: var(--info-bg); color: var(--info-ink); border-radius: 12px; padding: 8px 12px; margin: 0 0 12px; }
</style>
