<script setup lang="ts">
import { computed, ref } from 'vue'
import { dayReview, HABITS } from '@/engine'
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
