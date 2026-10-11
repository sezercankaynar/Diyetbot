<script setup lang="ts">
import { computed, ref } from 'vue'
import { getFood, itemTotals, mealTitle, mealTotals, mealWindow, slotPlan, sumTotals, type Slot } from '@/engine'
import { useAppStore } from '@/stores/app'
import CalloutBox from '@/components/CalloutBox.vue'
import FoodRow from '@/components/FoodRow.vue'
import MealPlate from '@/components/MealPlate.vue'
import EatenParts from '@/components/EatenParts.vue'
import CheckPanel from '@/components/CheckPanel.vue'
import EatOutPanel from '@/components/EatOutPanel.vue'
import MealAddPanel from '@/components/MealAddPanel.vue'
import WeekReview from '@/components/WeekReview.vue'
import SheetPanel from '@/components/SheetPanel.vue'
import BackupPanel from '@/components/BackupPanel.vue'
import CravingPanel from '@/components/CravingPanel.vue'
import DailyCoach from '@/components/DailyCoach.vue'
import RingProgress from '@/components/RingProgress.vue'
import MacroBars from '@/components/MacroBars.vue'
import { fmt } from '@/content/labels'

const emit = defineEmits<{ go: [tab: string] }>()
const store = useAppStore()
const sheet = ref<null | 'check' | 'out' | 'craving' | 'extra' | 'backup'>(null)
const isMonday = computed(() => new Date(`${store.todayDate}T12:00:00`).getDay() === 1)
const daysAgo = (iso: string) => Math.max(0, Math.round((Date.parse(`${store.todayDate}T12:00:00`) - Date.parse(iso)) / 86_400_000))
const openMeal = ref<Slot | null>(null)

const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 11 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar'
})
const dateLabel = computed(() =>
  new Date(`${store.todayDate}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }),
)
const target = computed(() => store.plan.energy?.target ?? 0)
const remaining = computed(() => target.value - store.todayTotals.kcal)

const meals = computed(() => {
  const ctx = store.menuCtx
  const day = store.todayMenu
  if (!ctx || !day) return []
  return slotPlan(ctx)
    .map((sp) => {
      const item = day.items.find((i) => i.slot === sp.slot)
      return {
        ...sp,
        item,
        food: item ? getFood(item.foodId) : undefined,
        title: item ? mealTitle(item) : '',
        // Once eaten, show what was actually logged (amounts may have been corrected).
        totals: !item ? undefined : eatenSlots.value.has(sp.slot)
          ? sumTotals(store.todayDiary.filter((e) => e.menuSlot === sp.slot).map((e) => itemTotals(e.foodId, e.factor)))
          : mealTotals(item),
        window: mealWindow(sp, store.profile.mealTimes),
      }
    })
    .filter((m) => m.item && m.food)
})
const eatenSlots = computed(() => new Set(store.todayDiary.filter((e) => e.menuSlot).map((e) => e.menuSlot)))
const extras = computed(() => store.todayDiary.filter((e) => !e.menuSlot))

const ACTIONS = [
  { id: 'check', icon: '🍽️', label: 'Yiyebilir miyim?' },
  { id: 'out', icon: '🏪', label: 'Dışarıda' },
  { id: 'craving', icon: '🍫', label: 'Tatlı krizi' },
] as const
</script>

<template>
  <div class="page">
    <header class="hello">
      <div>
        <div class="sub">{{ dateLabel }}</div>
        <h1>{{ greeting }}</h1>
      </div>
    </header>

    <template v-if="!store.hasProfile">
      <section class="card">
        <p>Başlamak için birkaç soruyu yanıtla; sana özel planını hazırlayayım.</p>
        <button class="btn" type="button" @click="emit('go', 'ben')">Başla →</button>
      </section>
    </template>

    <template v-else-if="store.plan.safety.stop">
      <CalloutBox v-for="c in store.plan.safety.stops" :key="c.code" :callout="c" />
    </template>

    <template v-else>
      <section class="card hero">
        <div class="ring-wrap">
          <RingProgress :value="store.todayTotals.kcal" :target="target" />
          <div class="ring-center">
            <div class="big num" :class="{ neg: remaining < 0 }">{{ fmt(Math.abs(remaining)) }}</div>
            <div class="small muted">{{ remaining >= 0 ? 'kcal kaldı' : 'kcal fazla' }}</div>
          </div>
        </div>
        <div class="hero-side">
          <div class="small muted num">{{ fmt(store.todayTotals.kcal) }} / {{ fmt(target) }} kcal</div>
          <MacroBars
            :protein="store.todayTotals.protein" :carb="store.todayTotals.carb" :fat="store.todayTotals.fat"
            :protein-t="store.plan.macros?.proteinG ?? 0" :carb-t="store.plan.macros?.carbG ?? 0" :fat-t="store.plan.macros?.fatG ?? 0"
          />
        </div>
      </section>

      <div class="actions">
        <button v-for="a in ACTIONS" :key="a.id" type="button" class="action" @click="sheet = a.id">
          <span class="ico" aria-hidden="true">{{ a.icon }}</span>
          <span>{{ a.label }}</span>
        </button>
      </div>

      <section class="card">
        <div class="sec-head">
          <h2>Bugünün öğünleri</h2>
          <a href="#menu" @click.prevent="emit('go', 'menu')">Değiştir</a>
        </div>
        <p v-if="!meals.length" class="muted small">Menü hazırlanıyor…</p>
        <div v-for="m in meals" :key="m.slot" class="meal" :class="{ done: eatenSlots.has(m.slot) }">
          <button type="button" class="meal-main" :aria-expanded="openMeal === m.slot" @click="openMeal = openMeal === m.slot ? null : m.slot">
            <div class="time num">{{ m.window.split('–')[0] }}</div>
            <div class="meal-text">
              <div class="label">{{ m.label }}</div>
              <div class="dish">{{ m.title }}</div>
              <div class="small muted num">
                {{ m.totals!.kcal }} kcal · <span class="macro-p">P {{ m.totals!.protein }}</span> ·
                <span class="macro-c">K {{ m.totals!.carb }}</span> · <span class="macro-f">Y {{ m.totals!.fat }}</span>
              </div>
            </div>
          </button>
          <button
            type="button" class="tick" :aria-pressed="eatenSlots.has(m.slot)"
            :aria-label="eatenSlots.has(m.slot) ? 'Yemedim olarak işaretle' : 'Yedim olarak işaretle'"
            @click="store.toggleMenuEaten(m.slot)"
          >✓</button>
          <div v-if="openMeal === m.slot" class="meal-more small muted">
            <EatenParts v-if="eatenSlots.has(m.slot)" :slot="m.slot" />
            <template v-else>
              <MealPlate :item="m.item!" />
              <button type="button" class="btn ghost small" @click="store.toggleMenuEaten(m.slot)">Yedim, miktarları düzelteceğim</button>
            </template>
            <div>Önerilen saat: <span class="num">{{ m.window }}</span></div>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="sec-head">
          <h2>Öğün dışı yediklerin</h2>
          <button type="button" class="btn small" @click="sheet = 'extra'">＋ Ekle</button>
        </div>
        <p v-if="!extras.length" class="small muted">Cips, patlamış mısır, kuruyemiş, tatlı… Öğünler dışında yediklerini buraya ekle, günün toplamına yazılsın.</p>
        <div v-for="e in extras" :key="e.id" class="extra">
          <FoodRow :food-id="e.foodId" :factor="e.factor" compact />
          <button type="button" class="btn danger small" aria-label="Sil" @click="store.deleteDiary(e.id)">✕</button>
        </div>
      </section>

      <WeekReview v-if="isMonday" />

      <section v-if="store.backupReminder" class="card backup">
        <h2>💾 Yedek alma zamanı</h2>
        <p class="small">
          Verilerin sadece bu telefonda duruyor{{ store.lastBackupAt ? `; son yedek ${daysAgo(store.lastBackupAt)} gün önce` : ' ve hiç yedek alınmadı' }}.
          Telefon kaybolur ya da uygulama silinirse hepsi gider. Yedeği Drive'a ya da kendine e-postayla gönder.
        </p>
        <button type="button" class="btn small" @click="sheet = 'backup'">Yedek al</button>
      </section>

      <DailyCoach />
    </template>

    <CheckPanel v-if="sheet === 'check'" @close="sheet = null" />
    <EatOutPanel v-if="sheet === 'out'" @close="sheet = null" />
    <CravingPanel v-if="sheet === 'craving'" @close="sheet = null" />
    <SheetPanel v-if="sheet === 'backup'" title="Yedekleme" @close="sheet = null"><BackupPanel /></SheetPanel>
    <MealAddPanel v-if="sheet === 'extra'" :date="store.todayDate" title="Öğün dışı ekle" @close="sheet = null" />
  </div>
</template>

<style scoped>
.hello { margin: 4px 2px 14px; }
.hello .sub { color: var(--ink-3); font-size: 0.85rem; font-weight: 500; text-transform: capitalize; }
.hero { display: flex; gap: 16px; align-items: center; }
.ring-wrap { position: relative; flex: none; }
.ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.big { font-size: 1.9rem; font-weight: 800; line-height: 1; color: var(--ink); }
.big.neg { color: var(--accent-2); }
.hero-side { flex: 1; min-width: 0; display: grid; gap: 8px; }
.actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
.action {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  min-height: 76px; padding: 8px 4px; font: inherit; font-size: 0.74rem; font-weight: 700; line-height: 1.15;
  text-align: center; color: var(--ink); background: var(--surface); box-shadow: var(--shadow);
  border: 0; border-radius: 16px; cursor: pointer;
}
.ico { font-size: 1.45rem; }
.sec-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
.sec-head a { font-size: 0.85rem; }
.meal { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px; padding: 10px 0; }
.meal + .meal { border-top: 1px solid var(--line); }
.meal-main { display: flex; gap: 12px; align-items: flex-start; background: none; border: 0; padding: 0; font: inherit; color: inherit; text-align: left; cursor: pointer; min-width: 0; }
.time { width: 46px; flex: none; font-weight: 700; color: var(--accent); padding-top: 14px; font-size: 0.9rem; }
.meal-text { min-width: 0; }
.dish { font-weight: 650; line-height: 1.3; }
.tick {
  width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--line); background: var(--surface);
  color: transparent; font-size: 1.1rem; font-weight: 800; cursor: pointer;
}
.tick[aria-pressed='true'] { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
.meal.done .meal-text { opacity: 0.5; }
.meal-more { grid-column: 1 / -1; background: var(--surface-2); border-radius: 12px; padding: 10px 12px; margin-left: 58px; display: grid; gap: 6px; }
.extra { display: flex; justify-content: space-between; gap: 8px; align-items: center; padding: 8px 0; }
.extra + .extra { border-top: 1px solid var(--line); }
.extra :deep(.food-row) { flex: 1; }
@media (max-width: 360px) { .hero { flex-direction: column; } }
.backup { border-left: 4px solid var(--info-border); }
</style>
