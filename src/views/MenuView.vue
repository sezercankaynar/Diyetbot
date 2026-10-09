<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { alternativesFor, dayTotals, getFood, slotPlan, WEEKDAY_SHORT_TR, WEEKDAY_TR, type Slot } from '@/engine'
import { useAppStore } from '@/stores/app'
import CalloutBox from '@/components/CalloutBox.vue'
import FoodRow from '@/components/FoodRow.vue'
import BudgetBar from '@/components/BudgetBar.vue'

const emit = defineEmits<{ go: [tab: string] }>()
const store = useAppStore()

const dayIdx = ref(0)
watch(
  () => store.menu?.weekStart,
  () => {
    const i = store.menu?.days.findIndex((d) => d.date === store.todayDate) ?? -1
    dayIdx.value = i >= 0 ? i : 0
  },
  { immediate: true },
)

const day = computed(() => store.menu?.days[dayIdx.value] ?? null)
const totals = computed(() => (day.value ? dayTotals(day.value) : null))
const labels = computed(() =>
  Object.fromEntries((store.menuCtx ? slotPlan(store.menuCtx) : []).map((s) => [s.slot, s.label])),
)
const openSlot = ref<Slot | null>(null)
const alternatives = computed(() =>
  store.menuCtx && day.value && openSlot.value ? alternativesFor(store.menuCtx, day.value, openSlot.value) : [],
)
watch(dayIdx, () => (openSlot.value = null))

const shortDate = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}`

async function choose(foodId: string, factor: number) {
  if (!day.value || !openSlot.value) return
  await store.swapMenu(day.value.date, openSlot.value, foodId, factor)
  openSlot.value = null
}
async function dislike(foodId: string) {
  if (confirm(`"${getFood(foodId)?.name ?? ''}" bir daha menüde gösterilmesin mi? Bu haftaki yerleri otomatik değiştirilecek.`)) {
    await store.rateDish(foodId, 'dislike')
  }
}
function toggleLike(foodId: string) {
  store.rateDish(foodId, store.liked.includes(foodId) ? null : 'like')
}
async function regenerate() {
  if (confirm('Bu haftanın menüsü baştan oluşturulsun mu? Yaptığın değişiklikler kaybolur.')) await store.regenerateMenu()
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1>Haftalık menü</h1>
      <span v-if="store.menu" class="sub">{{ shortDate(store.menu.days[0].date) }}–{{ shortDate(store.menu.days[6].date) }}</span>
    </header>

    <template v-if="!store.hasProfile">
      <section class="card">
        <p>Menü için önce profilini doldur.</p>
        <button class="btn" type="button" @click="emit('go', 'profil')">Profile git →</button>
      </section>
    </template>
    <template v-else-if="store.plan.safety.stop">
      <CalloutBox v-for="c in store.plan.safety.stops" :key="c.code" :callout="c" />
    </template>

    <template v-else-if="store.menu && day && totals">
      <div v-if="store.menuOutdated" class="outdated small">
        Hedefin veya tercihlerin değişti. Menüyü bunlara göre yenilemek için dokun.
        <button type="button" class="btn small" @click="store.regenerateMenu()">Yenile</button>
      </div>

      <div class="days" role="tablist" aria-label="Gün">
        <button
          v-for="(d, i) in store.menu.days"
          :key="d.date"
          type="button"
          role="tab"
          :aria-selected="i === dayIdx"
          :class="{ today: d.date === store.todayDate }"
          @click="dayIdx = i"
        >
          <span>{{ WEEKDAY_SHORT_TR[i] }}</span>
          <span class="num small">{{ shortDate(d.date) }}</span>
        </button>
      </div>

      <section class="card">
        <h2>{{ WEEKDAY_TR[dayIdx] }}</h2>
        <BudgetBar label="Menü kalorisi" :value="totals.kcal" :target="store.plan.energy?.target ?? 0" unit="kcal" />
        <BudgetBar label="Protein" :value="totals.protein" :target="store.plan.macros?.proteinG ?? 0" unit="g" />
        <BudgetBar label="Karbonhidrat" :value="totals.carb" :target="store.plan.macros?.carbG ?? 0" unit="g" />
        <BudgetBar label="Yağ" :value="totals.fat" :target="store.plan.macros?.fatG ?? 0" unit="g" />
      </section>

      <section v-for="item in day.items" :key="item.slot" class="card meal">
        <div class="label">{{ labels[item.slot] }}</div>
        <FoodRow :food-id="item.foodId" :factor="item.factor" />
        <div class="btn-row">
          <button type="button" class="btn ghost small" :aria-expanded="openSlot === item.slot" @click="openSlot = openSlot === item.slot ? null : item.slot">
            {{ openSlot === item.slot ? 'Kapat' : 'Alternatifler' }}
          </button>
          <button
            type="button"
            class="btn ghost small"
            :aria-pressed="store.liked.includes(item.foodId)"
            @click="toggleLike(item.foodId)"
          >
            {{ store.liked.includes(item.foodId) ? '♥ Beğendim' : '♡ Beğen' }}
          </button>
          <button type="button" class="btn danger small" @click="dislike(item.foodId)">Bir daha gösterme</button>
        </div>
        <div v-if="openSlot === item.slot" class="alts">
          <div v-for="a in alternatives" :key="a.foodId" class="alt">
            <FoodRow :food-id="a.foodId" :factor="a.factor" compact />
            <button type="button" class="btn small" @click="choose(a.foodId, a.factor)">Seç</button>
          </div>
        </div>
      </section>

      <p class="small muted">
        Beğendiğin yemekler sonraki menülerde daha sık çıkar. Değerler yaklaşık porsiyonlara göredir.
      </p>
      <div class="btn-row">
        <button type="button" class="btn ghost" @click="regenerate">Haftayı yeniden oluştur</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 14px; }
.days button {
  display: flex; flex-direction: column; align-items: center; padding: 6px 0; min-height: 50px;
  font: inherit; font-size: 0.8rem; background: var(--paper-2); color: var(--ink);
  border: 1px solid var(--rule-strong); border-radius: var(--radius); cursor: pointer;
}
.days button.today { border-color: var(--accent); border-width: 2px; }
.days button[aria-selected='true'] { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
.days button[aria-selected='true'] .small { color: var(--accent-ink); }
.meal .label { margin-bottom: 4px; }
.btn-row .btn[aria-pressed='true'] { color: var(--stop-border); border-color: var(--stop-border); }
.alts { margin-top: 10px; border-top: 1px dashed var(--rule-strong); }
.alt { display: flex; gap: 8px; align-items: center; padding: 8px 0; border-bottom: 1px dotted var(--rule); }
.alt :deep(.food-row) { flex: 1; }
.outdated {
  background: var(--info-bg); color: var(--info-ink); border-left: 4px solid var(--info-border);
  border-radius: var(--radius); padding: 10px; margin-bottom: 12px; display: flex; gap: 10px; align-items: center; justify-content: space-between;
}
</style>
