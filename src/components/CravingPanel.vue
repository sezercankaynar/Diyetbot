<script setup lang="ts">
import { computed, ref } from 'vue'
import { cravingPlan } from '@/engine'
import { useAppStore } from '@/stores/app'
import SheetPanel from './SheetPanel.vue'

const emit = defineEmits<{ close: [] }>()
const store = useAppStore()
const logged = ref<string | null>(null)

const plan = computed(() => {
  const diet = store.plan.recommendedDiet?.id
  if (!diet || !store.plan.energy) return null
  return cravingPlan({
    remainingKcal: store.plan.energy.target - store.todayTotals.kcal,
    diet,
    animalFoods: store.profile.animalFoods,
    dislikes: store.profile.dislikes,
    health: store.profile.health,
    hungerTime: store.profile.hungerTime,
  })
})

async function eat(foodId: string) {
  await store.logFoods([{ foodId, factor: 1 }])
  logged.value = foodId
}
</script>

<template>
  <SheetPanel title="Tatlı krizi" @close="emit('close')">
    <template v-if="plan">
      <section class="card">
        <h2>Şimdi ne yapmalı?</h2>
        <ol class="steps"><li v-for="s in plan.steps" :key="s">{{ s }}</li></ol>
      </section>

      <p v-for="n in plan.notes" :key="n" class="note small">{{ n }}</p>

      <section class="card">
        <h2>Hafif tatlı seçenekleri</h2>
        <div v-for="o in plan.options" :key="o.foodId" class="opt">
          <div>
            <div class="name">{{ o.name }}</div>
            <div class="small muted">{{ o.portion }}</div>
          </div>
          <div class="right">
            <div class="num">{{ o.kcal }} kcal</div>
            <button type="button" class="btn ghost small" @click="eat(o.foodId)">
              {{ logged === o.foodId ? 'Kaydedildi ✓' : 'Bunu yedim' }}
            </button>
          </div>
        </div>
      </section>

      <section class="card">
        <h2>Bir dahaki sefere</h2>
        <ul><li v-for="p in plan.prevention" :key="p">{{ p }}</li></ul>
      </section>
    </template>
    <p v-else class="muted">Güvenlik durdurması olduğu için öneri gösterilmiyor.</p>
  </SheetPanel>
</template>

<style scoped>
.steps { padding-left: 1.3em; }
.steps li { margin-bottom: 6px; }
.opt { display: flex; justify-content: space-between; gap: 10px; padding: 8px 0; border-bottom: 1px dotted var(--rule); }
.opt:last-child { border-bottom: 0; }
.name { font-weight: 600; }
.right { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.note { background: var(--info-bg); color: var(--info-ink); border-left: 4px solid var(--info-border); padding: 8px 10px; border-radius: var(--radius); }
</style>
