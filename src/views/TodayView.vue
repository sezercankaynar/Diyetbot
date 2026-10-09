<script setup lang="ts">
import { computed, ref } from 'vue'
import { slotPlan } from '@/engine'
import { useAppStore } from '@/stores/app'
import CalloutBox from '@/components/CalloutBox.vue'
import BudgetBar from '@/components/BudgetBar.vue'
import FoodRow from '@/components/FoodRow.vue'
import CheckPanel from '@/components/CheckPanel.vue'
import EatOutPanel from '@/components/EatOutPanel.vue'
import CravingPanel from '@/components/CravingPanel.vue'
import DailyCoach from '@/components/DailyCoach.vue'
import { fmt } from '@/content/labels'

const emit = defineEmits<{ go: [tab: string] }>()
const store = useAppStore()
const sheet = ref<null | 'check' | 'out' | 'craving'>(null)

const dateLabel = computed(() =>
  new Date(`${store.todayDate}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }),
)
const target = computed(() => store.plan.energy?.target ?? 0)
const proteinTarget = computed(() => store.plan.macros?.proteinG ?? 0)
const remaining = computed(() => target.value - store.todayTotals.kcal)

const meals = computed(() => {
  const ctx = store.menuCtx
  const day = store.todayMenu
  if (!ctx || !day) return []
  return slotPlan(ctx)
    .map((sp) => ({ ...sp, item: day.items.find((i) => i.slot === sp.slot) }))
    .filter((m) => m.item)
})
const eatenSlots = computed(() => new Set(store.todayDiary.filter((e) => e.menuSlot).map((e) => e.menuSlot)))
const extras = computed(() => store.todayDiary.filter((e) => !e.menuSlot))
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1>Bugün</h1>
      <span class="sub">{{ dateLabel }}</span>
    </header>

    <template v-if="!store.hasProfile">
      <section class="card">
        <p>Başlamak için önce profilini doldur.</p>
        <button class="btn" type="button" @click="emit('go', 'profil')">Profile git →</button>
      </section>
    </template>

    <template v-else-if="store.plan.safety.stop">
      <CalloutBox v-for="c in store.plan.safety.stops" :key="c.code" :callout="c" />
    </template>

    <template v-else>
      <section class="card budget-card">
        <div class="label">Bugün kalan</div>
        <div class="big num" :class="{ neg: remaining < 0 }">
          {{ fmt(remaining) }}<span class="unit"> kcal</span>
        </div>
        <BudgetBar label="Kalori" :value="store.todayTotals.kcal" :target="target" unit="kcal" />
        <BudgetBar label="Protein" :value="store.todayTotals.protein" :target="proteinTarget" unit="g" />
        <BudgetBar label="Karbonhidrat" :value="store.todayTotals.carb" :target="store.plan.macros?.carbG ?? 0" unit="g" />
        <BudgetBar label="Yağ" :value="store.todayTotals.fat" :target="store.plan.macros?.fatG ?? 0" unit="g" />
      </section>

      <div class="actions">
        <button type="button" class="action" @click="sheet = 'check'">
          <span class="ico" aria-hidden="true">🍽</span>Bunu yiyebilir miyim?
        </button>
        <button type="button" class="action" @click="sheet = 'out'">
          <span class="ico" aria-hidden="true">🏪</span>Dışarıda yiyorum
        </button>
        <button type="button" class="action" @click="sheet = 'craving'">
          <span class="ico" aria-hidden="true">🍫</span>Tatlı krizi
        </button>
      </div>

      <section class="card">
        <h2>Bugünün menüsü</h2>
        <p v-if="!meals.length" class="muted small">Menü hazırlanıyor…</p>
        <label v-for="m in meals" :key="m.slot" class="meal" :class="{ done: eatenSlots.has(m.slot) }">
          <input type="checkbox" :checked="eatenSlots.has(m.slot)" @change="store.toggleMenuEaten(m.slot)" />
          <div class="meal-body">
            <div class="label">{{ m.label }}</div>
            <FoodRow :food-id="m.item!.foodId" :factor="m.item!.factor" compact />
          </div>
        </label>
        <p class="small muted" style="margin-top: 8px">Yediğin öğünü işaretle. Değiştirmek istersen:</p>
        <button type="button" class="btn ghost small" @click="emit('go', 'menu')">Haftalık menüye git →</button>
      </section>

      <DailyCoach />

      <section v-if="extras.length" class="card">
        <h2>Menü dışı yediklerin</h2>
        <div v-for="e in extras" :key="e.id" class="extra">
          <FoodRow :food-id="e.foodId" :factor="e.factor" compact />
          <button type="button" class="btn danger small" @click="store.deleteDiary(e.id)">Sil</button>
        </div>
      </section>
    </template>

    <CheckPanel v-if="sheet === 'check'" @close="sheet = null" />
    <EatOutPanel v-if="sheet === 'out'" @close="sheet = null" />
    <CravingPanel v-if="sheet === 'craving'" @close="sheet = null" />
  </div>
</template>

<style scoped>
.budget-card .big { font-size: 2.2rem; color: var(--accent); line-height: 1.1; }
.budget-card .big.neg { color: var(--warn-border); }
.unit { font-size: 0.9rem; color: var(--ink-3); }
.actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
.action {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  min-height: 84px; padding: 8px 6px; font: inherit; font-size: 0.82rem; font-weight: 600; line-height: 1.2;
  text-align: center; color: var(--ink); background: var(--paper-2);
  border: 1px solid var(--rule-strong); border-radius: var(--radius); cursor: pointer;
}
.ico { font-size: 1.5rem; }
.meal { display: flex; gap: 10px; align-items: flex-start; padding: 10px 0; border-bottom: 1px dotted var(--rule); cursor: pointer; }
.meal input { width: 22px; height: 22px; margin-top: 18px; accent-color: var(--accent); flex: none; }
.meal-body { flex: 1; min-width: 0; }
.meal.done .meal-body { opacity: 0.55; }
.extra { display: flex; justify-content: space-between; gap: 8px; align-items: center; padding: 8px 0; border-bottom: 1px dotted var(--rule); }
.extra :deep(.food-row) { flex: 1; }
</style>
