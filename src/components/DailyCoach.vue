<script setup lang="ts">
import { computed, ref } from 'vue'
import { dayReview, GLASS_ML, HABITS } from '@/engine'
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
    <h2>Su</h2>
    <div class="water">
      <button type="button" class="btn ghost small" aria-label="Bir bardak çıkar" @click="store.addWater(-1)">−</button>
      <div class="glasses" :aria-label="`${store.todayLog.water} / ${store.waterTarget} bardak`">
        <span v-for="i in store.waterTarget" :key="i" class="glass" :class="{ full: i <= store.todayLog.water }" />
      </div>
      <button type="button" class="btn small" aria-label="Bir bardak ekle" @click="store.addWater(1)">+</button>
    </div>
    <p class="small muted num">{{ store.todayLog.water }} / {{ store.waterTarget }} bardak ({{ GLASS_ML }} ml)</p>
  </section>

  <section class="card">
    <h2>Bu haftanın alışkanlıkları</h2>
    <template v-if="!choosing">
      <p v-if="!active.length" class="small muted">
        Diyetisyenler büyük değişiklikler yerine küçük, her gün yapılan alışkanlıklarla ilerler. 1–3 tane seç.
      </p>
      <label v-for="h in active" :key="h.id" class="check">
        <input type="checkbox" :checked="store.todayLog.habits.includes(h.id)" @change="store.toggleHabit(h.id)" />
        <span>{{ h.label }}</span>
      </label>
      <button type="button" class="btn ghost small" style="margin-top: 8px" @click="startChoosing">
        {{ active.length ? 'Alışkanlıkları değiştir' : 'Alışkanlık seç' }}
      </button>
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
    <h2>Günün değerlendirmesi</h2>
    <ul><li v-for="l in review.lines" :key="l">{{ l }}</li></ul>
  </section>
</template>

<style scoped>
.water { display: flex; align-items: center; gap: 10px; }
.glasses { flex: 1; display: flex; flex-wrap: wrap; gap: 4px; }
.glass { width: 16px; height: 22px; border: 2px solid var(--info-border); border-top-width: 1px; border-radius: 2px 2px 5px 5px; }
.glass.full { background: var(--info-border); }
.review.good { border-left: 5px solid var(--accent); }
.review.warn { border-left: 5px solid var(--warn-border); }
</style>
