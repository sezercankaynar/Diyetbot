<script setup lang="ts">
import { computed, ref } from 'vue'
import { chainList, chainMenu, VENUES, venueGuide } from '@/engine'
import { useAppStore } from '@/stores/app'
import SheetPanel from './SheetPanel.vue'
import FoodRow from './FoodRow.vue'

const emit = defineEmits<{ close: [] }>()
const store = useAppStore()
const venueId = ref<string | null>(null)
const chain = ref<string | null>(null)
const chains = chainList()
const logged = ref<string | null>(null)

const remaining = computed(() => (store.plan.energy?.target ?? 0) - store.todayTotals.kcal)
const guide = computed(() => {
  const diet = store.plan.recommendedDiet?.id
  if (!venueId.value || !diet) return null
  return venueGuide(venueId.value, {
    remainingKcal: remaining.value,
    diet,
    animalFoods: store.profile.animalFoods,
    dislikes: store.profile.dislikes,
  })
})

const chainItems = computed(() => {
  const diet = store.plan.recommendedDiet?.id
  if (!chain.value || !diet) return []
  return chainMenu(chain.value, {
    remainingKcal: remaining.value,
    diet,
    animalFoods: store.profile.animalFoods,
    dislikes: store.profile.dislikes,
  })
})
const chainSource = computed(() => chains.find((c) => c.brand === chain.value)?.source ?? '')
function pickVenue(id: string) {
  venueId.value = id
  chain.value = null
  logged.value = null
}
function pickChain(brand: string) {
  chain.value = chain.value === brand ? null : brand
  venueId.value = null
  logged.value = null
}

async function eat(foodId: string, factor: number) {
  await store.logFoods([{ foodId, factor }])
  logged.value = foodId
}
</script>

<template>
  <SheetPanel title="Dışarıda yiyorum" @close="emit('close')">
    <p v-if="store.plan.energy" class="small muted">
      Bugün kalan bütçen: <strong class="num">{{ remaining }}</strong> kcal. Nerede yiyorsun?
    </p>
    <div class="venues" role="group" aria-label="Mekân türü">
      <button
        v-for="v in VENUES"
        :key="v.id"
        type="button"
        :aria-pressed="venueId === v.id"
        @click="pickVenue(v.id)"
      >
        {{ v.name }}
      </button>
    </div>

    <template v-if="chains.length">
      <h2 class="sec">Zincir restoranlar</h2>
      <p class="small muted">
        Zincirlerin kendi yayımladığı besin değerleri. "tahmini" yazanlar değer yayımlamıyor; benzer standart tariften hesaplandı.
      </p>
      <div class="venues" role="group" aria-label="Zincir">
        <button v-for="c in chains" :key="c.brand" type="button" :aria-pressed="chain === c.brand" @click="pickChain(c.brand)">
          {{ c.brand }}<span v-if="c.estimated" class="small"> · tahmini</span>
        </button>
      </div>
    </template>

    <section v-if="chain" class="card" style="margin-top: 14px">
      <h2>{{ chain }} – sana uygun sıralama</h2>
      <p class="small muted">En üstte planına uyan ve bütçene sığanlar var.</p>
      <div v-for="it in chainItems" :key="it.foodId" class="pick">
        <FoodRow :food-id="it.foodId" :factor="1" compact>
          <template #extra>
            <span v-if="store.plan.energy" class="tag" :class="{ off: !it.fitsBudget }">
              {{ it.fitsBudget ? 'bütçene uyuyor' : 'bütçeni aşar' }}
            </span>
            <div v-for="w in it.warnings" :key="w" class="small warnline">⚠ {{ w }}</div>
          </template>
        </FoodRow>
        <button type="button" class="btn ghost small" @click="eat(it.foodId, 1)">
          {{ logged === it.foodId ? 'Kaydedildi ✓' : 'Bunu yedim' }}
        </button>
      </div>
      <p class="small muted src">Kaynak: {{ chainSource }}</p>
    </section>

    <template v-if="guide">
      <section class="card" style="margin-top: 14px">
        <h2>En iyi seçenekler</h2>
        <p v-if="!guide.picks.length" class="muted small">Tercihlerine uyan bir seçenek yok; ipuçlarına göz at.</p>
        <div v-for="p in guide.picks" :key="p.foodId" class="pick">
          <FoodRow :food-id="p.foodId" :factor="p.factor" :note="p.note" compact>
            <template #extra>
              <span v-if="store.plan.energy" class="tag" :class="{ off: !p.fitsBudget }">
                {{ p.fitsBudget ? 'bütçene uyuyor' : 'bütçeni aşar' }}
              </span>
              <div v-for="w in p.warnings" :key="w" class="small warnline">⚠ {{ w }}</div>
            </template>
          </FoodRow>
          <button type="button" class="btn ghost small" @click="eat(p.foodId, p.factor)">
            {{ logged === p.foodId ? 'Kaydedildi ✓' : 'Bunu yedim' }}
          </button>
        </div>
      </section>
      <section class="card">
        <h2>İpuçları</h2>
        <ul><li v-for="t in guide.venue.tips" :key="t">{{ t }}</li></ul>
        <h3>Uzak dur</h3>
        <ul><li v-for="a in guide.venue.avoid" :key="a">{{ a }}</li></ul>
      </section>
      <p class="small muted">Menüde olmayan bir şey mi yiyeceksin? "Bunu yiyebilir miyim?" ile kontrol et.</p>
    </template>
  </SheetPanel>
</template>

<style scoped>
.venues { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
.venues button {
  min-height: 48px; font: inherit; font-size: 0.9rem; text-align: left; padding: 8px 10px;
  border: 1px solid var(--rule-strong); border-radius: var(--radius); background: var(--paper-2); color: var(--ink); cursor: pointer;
}
.venues button[aria-pressed='true'] { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
.pick { padding: 10px 0; border-bottom: 1px dotted var(--rule); }
.pick:last-child { border-bottom: 0; }
.pick > .btn { margin-top: 6px; }
.tag { margin: 4px 0 0; }
.sec { margin-top: 18px; }
.src { word-break: break-word; margin-top: 8px; }
.tag.off { border-color: var(--warn-border); color: var(--warn-ink); }
.warnline { color: var(--warn-ink); margin-top: 2px; }
</style>
