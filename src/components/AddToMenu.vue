<script setup lang="ts">
import { computed, ref } from 'vue'
import { dayTotals, getFood, isSnackSlot, itemTotals, placeDish, portionText, slotPlan, WEEKDAY_SHORT_TR, type Slot } from '@/engine'
import { useAppStore } from '@/stores/app'

const props = defineProps<{ foodId: string }>()
const emit = defineEmits<{ done: [text: string] }>()
const store = useAppStore()

const days = computed(() => store.menu?.days ?? [])
const plan = computed(() => (store.menuCtx ? slotPlan(store.menuCtx) : []))
const startIdx = Math.max(0, days.value.findIndex((d) => d.date === store.todayDate))
const dayIdx = ref(startIdx)
const day = computed(() => days.value[dayIdx.value])

const food = computed(() => getFood(props.foodId))
const suits = (s: Slot) => !!food.value?.slots.includes(isSnackSlot(s) ? 'snack' : s)
const slot = ref<Slot | null>(plan.value.find((p) => suits(p.slot))?.slot ?? plan.value[0]?.slot ?? null)

const placed = computed(() =>
  store.menu && store.menuCtx && day.value && slot.value ? placeDish(store.menu, store.menuCtx, day.value.date, slot.value, props.foodId) : null,
)
const factor = computed(() => placed.value?.factor ?? null)
const after = computed(() => {
  const d = placed.value?.menu.days.find((x) => x.date === day.value?.date)
  return d ? dayTotals(d) : null
})
const replaced = computed(() => {
  const cur = day.value?.items.find((i) => i.slot === slot.value)
  return cur && cur.foodId !== props.foodId ? getFood(cur.foodId)?.name : undefined
})
const per = computed(() => (factor.value !== null ? itemTotals(props.foodId, factor.value) : null))
const label = (i: number) => (days.value[i]?.date === store.todayDate ? 'Bugün' : WEEKDAY_SHORT_TR[i])

async function add() {
  if (!day.value || !slot.value) return
  const r = await store.addToMenu(day.value.date, slot.value, props.foodId)
  if (!r) return
  const p = plan.value.find((x) => x.slot === slot.value)
  emit('done', `${food.value?.name} → ${label(dayIdx.value)}, ${p?.label ?? ''} (${portionText(r.factor)})${r.shrunk ? '; diğer öğünler küçültüldü' : ''}`)
}
</script>

<template>
  <div class="atm">
    <p v-if="!store.menu" class="small muted">Önce bir haftalık menü oluşmalı (Menü sekmesi).</p>
    <template v-else>
      <div class="label">Hangi gün?</div>
      <div class="chips">
        <button v-for="(d, i) in days" :key="d.date" type="button" :aria-pressed="i === dayIdx" @click="dayIdx = i">{{ label(i) }}</button>
      </div>
      <div class="label">Hangi öğün?</div>
      <div class="chips">
        <button v-for="p in plan" :key="p.slot" type="button" :aria-pressed="p.slot === slot" @click="slot = p.slot">{{ p.label }}</button>
      </div>
      <p v-if="factor === null" class="small warn">
        Bu yemek o günün kalori/makro hedefine sığmıyor. Başka bir gün ya da öğün seç.
      </p>
      <template v-else-if="per && after">
        <p class="small">
          <strong>{{ portionText(factor) }}</strong> · {{ per.kcal }} kcal · P {{ per.protein }} · K {{ per.carb }} · Y {{ per.fat }}
          <span v-if="factor < 1" class="muted"> (günün hedefini aşmaması için küçültüldü)</span>
          <span v-if="placed?.shrunk" class="muted"> · sığması için günün diğer öğünleri biraz küçültülecek</span>
        </p>
        <p class="small muted">
          Gün toplamı: {{ after.kcal }}/{{ store.menuCtx?.kcal }} kcal<template v-if="replaced"> · yerine geçeceği: {{ replaced }}</template>
        </p>
        <button type="button" class="btn small" @click="add">Menüye ekle</button>
      </template>
    </template>
  </div>
</template>

<style scoped>
.atm { background: var(--surface-2); border-radius: 12px; padding: 10px 12px; margin: 6px 0 4px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0 10px; }
.chips button { border: 0; border-radius: 999px; padding: 6px 11px; font: inherit; font-size: 0.82rem; font-weight: 650; background: var(--surface); color: var(--ink-2); cursor: pointer; }
.chips button[aria-pressed='true'] { background: var(--accent); color: var(--accent-ink); }
.warn { color: var(--stop-border); }
</style>
