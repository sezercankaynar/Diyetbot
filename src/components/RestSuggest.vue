<script setup lang="ts">
import { computed, ref } from 'vue'
import { mealTotals, slotPlan, suggestForRest, sumTotals, type Slot } from '@/engine'
import { useAppStore } from '@/stores/app'
import MealPlate from './MealPlate.vue'

// When the day went off the menu (other foods eaten, extras), plates for the meals still to come,
// sized to what's actually left of the day.
const store = useAppStore()
// The day's target after the weekly balance.
const ctx = computed(() => (store.menuCtx ? { ...store.menuCtx, kcal: store.dayTarget(store.viewDate) } : null))
const logged = computed(() => store.todayDiary)
const eatenSlots = computed(() => new Set(logged.value.filter((e) => e.menuSlot).map((e) => e.menuSlot as Slot)))
const plan = computed(() => (ctx.value ? slotPlan(ctx.value) : []))
const open = computed(() => plan.value.map((s) => s.slot).filter((s) => !eatenSlots.value.has(s)))
const labels = computed(() => Object.fromEntries(plan.value.map((s) => [s.slot, s.label])))

// Off the menu: extras, or eaten meals that differ from their menu plates by more than a little.
const offMenu = computed(() => {
  const day = store.todayMenu
  if (!day) return false
  if (logged.value.some((e) => !e.menuSlot)) return true
  const planned = sumTotals(day.items.filter((i) => eatenSlots.value.has(i.slot)).map(mealTotals))
  return Math.abs(planned.kcal - store.todayTotals.kcal) > 80 || Math.abs(planned.protein - store.todayTotals.protein) > 10
})
const rest = computed(() =>
  ctx.value && offMenu.value && open.value.length
    ? suggestForRest(ctx.value, store.viewDate, store.todayTotals, open.value, logged.value.map((e) => e.foodId))
    : [],
)
const left = computed(() => {
  const c = ctx.value
  const t = store.todayTotals
  return c ? { kcal: c.kcal - t.kcal, protein: c.proteinG - t.protein, carb: (c.carbG ?? 0) - t.carb, fat: (c.fatG ?? 0) - t.fat } : null
})
const pick = ref<Record<string, number>>({})
const optionOf = (slot: Slot, n: number) => (pick.value[slot] ?? 0) % n
function next(slot: Slot) {
  pick.value = { ...pick.value, [slot]: (pick.value[slot] ?? 0) + 1 }
}
const inMenu = (slot: Slot, title?: string) => store.todayMenu?.items.find((i) => i.slot === slot)?.title === title
const busy = ref(false)
async function put(slot: Slot, k: number) {
  const s = rest.value.find((r) => r.slot === slot)
  if (!s || busy.value) return
  busy.value = true
  await store.setMenuMeal(store.viewDate, s.options[k])
  busy.value = false
}
const g = (x: number) => Math.max(0, Math.round(x))
</script>

<template>
  <section v-if="offMenu && open.length && left && store.menuCtx?.diet !== 'keto'" class="card rest">
    <h2>Kalanına göre öneri</h2>
    <p class="small">
      Bugün menünün dışında yedin; sorun değil. Günün geri kalanı için kalan:
      <strong class="num">{{ g(left.kcal) }} kcal</strong> ·
      <span class="num macro-p">P {{ g(left.protein) }}</span> · <span class="num macro-c">K {{ g(left.carb) }}</span> · <span class="num macro-f">Y {{ g(left.fat) }}</span>
    </p>
    <p v-if="!rest.length" class="small muted">
      Günün hedefi doldu. Kalan öğünü atlayabilir ya da çok hafif tutabilirsin (salata, ayran, bir meyve). Bir günlük aşım sorun değil; önemli olan haftalık ortalama.
    </p>
    <div v-for="s in rest" :key="s.slot" class="slot">
      <div class="slot-head">
        <span class="label">{{ labels[s.slot] }}</span>
        <span class="small muted num">bu öğüne ≈{{ s.budget.kcal }} kcal</span>
      </div>
      <template v-if="s.options.length">
        <MealPlate :item="s.options[optionOf(s.slot, s.options.length)]" compact />
        <div class="row">
          <button v-if="s.options.length > 1" type="button" class="btn ghost small" @click="next(s.slot)">↻ Başka öneri</button>
          <span v-if="inMenu(s.slot, s.options[optionOf(s.slot, s.options.length)].title)" class="small ok">✓ Menünde</span>
          <button v-else type="button" class="btn small" :disabled="busy" @click="put(s.slot, optionOf(s.slot, s.options.length))">Menüme koy</button>
        </div>
      </template>
      <p v-else class="small muted">Bu bütçeye uyan bir tabak bulunamadı; hafif bir salata ve ayran yeterli.</p>
    </div>
    <p v-if="left.protein > 25 && rest.length" class="small muted">Proteinin geride kaldığı için öneriler et, tavuk, yoğurt ya da baklagile ağırlık veriyor.</p>
  </section>
</template>

<style scoped>
.rest { border-left: 4px solid var(--accent); }
.slot { padding: 10px 0; }
.slot + .slot { border-top: 1px solid var(--line); }
.slot-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
.row { display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 8px; }
.ok { color: var(--accent); font-weight: 700; }
</style>
