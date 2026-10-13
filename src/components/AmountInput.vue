<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { amountWays } from '@/engine'

// Amount as a number in the unit the user thinks in: portions, grams, or a count (dilim, adet …).
const props = defineProps<{ foodId: string; modelValue: number }>()
const emit = defineEmits<{ 'update:modelValue': [factor: number] }>()

const ways = computed(() => amountWays(props.foodId))
const units = computed(() => {
  const u: { id: string; label: string; perOne: number }[] = []
  if (ways.value.count) u.push({ id: 'count', label: ways.value.count.unit, perOne: ways.value.count.perOne })
  if (ways.value.grams) u.push({ id: 'g', label: 'gram', perOne: 1 / ways.value.grams })
  if (!u.some((x) => Math.abs(x.perOne - 1) < 1e-9)) u.push({ id: 'p', label: 'porsiyon', perOne: 1 })
  return u
})
const unit = ref(units.value[0]?.id ?? 'p')
watch(units, (u) => {
  if (!u.some((x) => x.id === unit.value)) unit.value = u[0]?.id ?? 'p'
})
const cur = computed(() => units.value.find((x) => x.id === unit.value) ?? units.value[0])
const round = (x: number) => (unit.value === 'g' ? Math.round(x) : Math.round(x * 100) / 100)
const shown = computed(() => (cur.value ? round(props.modelValue / cur.value.perOne) : props.modelValue))
function set(v: string) {
  const n = Number(String(v).replace(',', '.'))
  if (!cur.value || !Number.isFinite(n) || n <= 0) return
  emit('update:modelValue', Math.round(n * cur.value.perOne * 1000) / 1000)
}
</script>

<template>
  <div v-if="units.length > 1 || unit !== 'p'" class="amount">
    <input
      type="number" inputmode="decimal" min="0" :step="unit === 'g' ? 10 : 0.5" :value="shown" aria-label="Miktar"
      @change="set(($event.target as HTMLInputElement).value)"
    />
    <select v-model="unit" aria-label="Birim">
      <option v-for="u in units" :key="u.id" :value="u.id">{{ u.label }}</option>
    </select>
  </div>
</template>

<style scoped>
.amount { display: flex; gap: 6px; align-items: center; margin-top: 6px; }
.amount input { width: 90px; }
.amount select { width: auto; min-width: 0; }
</style>
