<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { alternativesFor, dayTotals, getFood, mealWindow, slotPlan, WEEKDAY_SHORT_TR, WEEKDAY_TR, type Slot } from '@/engine'
import { useAppStore } from '@/stores/app'
import CalloutBox from '@/components/CalloutBox.vue'
import FoodRow from '@/components/FoodRow.vue'
import MacroBars from '@/components/MacroBars.vue'
import MealAddPanel from '@/components/MealAddPanel.vue'

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
const windows = computed(() =>
  Object.fromEntries((store.menuCtx ? slotPlan(store.menuCtx) : []).map((s) => [s.slot, mealWindow(s, store.profile.mealTimes)])),
)
const openSlot = ref<Slot | null>(null)
const addSlot = ref<Slot | null>(null)
const alternatives = computed(() =>
  store.menuCtx && day.value && openSlot.value ? alternativesFor(store.menuCtx, day.value, openSlot.value) : [],
)
watch(dayIdx, () => {
  openSlot.value = null
  addSlot.value = null
})

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
        <button class="btn" type="button" @click="emit('go', 'profil')">Başla →</button>
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

      <section class="card summary">
        <div class="sum-head">
          <h2>{{ WEEKDAY_TR[dayIdx] }}</h2>
          <span class="num"><strong>{{ totals.kcal }}</strong> / {{ store.plan.energy?.target ?? 0 }} kcal</span>
        </div>
        <MacroBars
          :protein="totals.protein" :carb="totals.carb" :fat="totals.fat"
          :protein-t="store.plan.macros?.proteinG ?? 0" :carb-t="store.plan.macros?.carbG ?? 0" :fat-t="store.plan.macros?.fatG ?? 0"
        />
      </section>

      <section v-for="item in day.items" :key="item.slot" class="card meal">
        <div class="meal-top">
          <span class="label">{{ labels[item.slot] }}</span>
          <span class="time num">{{ windows[item.slot] }}</span>
        </div>
        <FoodRow :food-id="item.foodId" :factor="item.factor" />
        <div class="acts">
          <button type="button" class="act" :aria-expanded="openSlot === item.slot" @click="openSlot = openSlot === item.slot ? null : item.slot">
            ↻ {{ openSlot === item.slot ? 'Kapat' : 'Değiştir' }}
          </button>
          <button type="button" class="act" :aria-pressed="store.liked.includes(item.foodId)" @click="toggleLike(item.foodId)">
            {{ store.liked.includes(item.foodId) ? '♥ Beğendim' : '♡ Beğen' }}
          </button>
          <button type="button" class="act plus" :aria-label="`${labels[item.slot]}: başka bir yemek ara ve ekle`" @click="addSlot = item.slot">＋</button>
          <button type="button" class="act no" @click="dislike(item.foodId)">✕ Gösterme</button>
        </div>
        <div v-if="openSlot === item.slot" class="alts">
          <div v-for="a in alternatives" :key="a.foodId" class="alt">
            <FoodRow :food-id="a.foodId" :factor="a.factor" compact />
            <button type="button" class="btn small" @click="choose(a.foodId, a.factor)">Seç</button>
          </div>
        </div>
      </section>

      <p class="small muted">
        Her gün kalori, protein, karbonhidrat ve yağ hedefini aşmayacak şekilde hazırlanır; “Değiştir” seçenekleri de buna uyar. Beğendiğin yemekler sonraki menülerde daha sık çıkar. Değerler yaklaşık porsiyonlara göredir.
      </p>
      <div class="btn-row">
        <button type="button" class="btn ghost" @click="regenerate">Haftayı yeniden oluştur</button>
      </div>
    </template>
    <MealAddPanel
      v-if="addSlot && day" :date="day.date" :slot="addSlot" :title="`${labels[addSlot]}: yemek ekle`"
      @close="addSlot = null"
    />
  </div>
</template>

<style scoped>
.days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; margin-bottom: 14px; }
.days button {
  display: flex; flex-direction: column; align-items: center; padding: 8px 0; min-height: 52px;
  font: inherit; font-size: 0.8rem; font-weight: 700; background: var(--surface); color: var(--ink-2);
  border: 0; border-radius: 14px; box-shadow: var(--shadow); cursor: pointer;
}
.days button.today { color: var(--accent); }
.days button[aria-selected='true'] { background: var(--accent); color: var(--accent-ink); }
.days button[aria-selected='true'] .small { color: var(--accent-ink); }
.sum-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
.meal-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
.time { font-size: 0.82rem; font-weight: 700; color: var(--accent); }
.acts { display: flex; gap: 6px; margin-top: 12px; flex-wrap: wrap; }
.act { border: 0; border-radius: 999px; padding: 7px 12px; font: inherit; font-size: 0.82rem; font-weight: 700; background: var(--surface-2); color: var(--ink-2); cursor: pointer; }
.act[aria-pressed='true'] { background: var(--stop-bg); color: var(--stop-border); }
.act.no { margin-left: auto; color: var(--ink-3); }
.act.plus { background: var(--accent); color: var(--accent-ink); font-size: 1rem; padding: 4px 14px; }
.alts { margin-top: 10px; background: var(--surface-2); border-radius: 14px; padding: 4px 12px; }
.alt { display: flex; gap: 8px; align-items: center; padding: 10px 0; }
.alt + .alt { border-top: 1px solid var(--line); }
.alt :deep(.food-row) { flex: 1; }
.outdated {
  background: var(--info-bg); color: var(--info-ink); border-radius: 14px; padding: 12px;
  margin-bottom: 12px; display: flex; gap: 10px; align-items: center; justify-content: space-between;
}
</style>
