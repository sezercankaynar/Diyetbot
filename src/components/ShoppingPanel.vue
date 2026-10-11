<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import { shoppingList, shoppingText } from '@/engine'
import { useAppStore } from '@/stores/app'
import SheetPanel from './SheetPanel.vue'

const emit = defineEmits<{ close: [] }>()
const store = useAppStore()

const range = ref<'rest' | 'week'>('rest')
const days = computed(() => (store.menu?.days ?? []).filter((d) => range.value === 'week' || d.date >= store.todayDate))
const list = computed(() => shoppingList(days.value))

// Ticks are kept on this device per week (a convenience, not data worth backing up).
const key = computed(() => `diyetbot-shopping-${store.menu?.weekStart ?? ''}`)
const ticked = ref<string[]>(load())
function load(): string[] {
  try {
    return JSON.parse(localStorage.getItem(`diyetbot-shopping-${store.menu?.weekStart ?? ''}`) ?? '[]')
  } catch {
    return []
  }
}
watch(ticked, (v) => {
  try {
    localStorage.setItem(key.value, JSON.stringify(v))
  } catch {
    // storage unavailable: ticks last for this session only
  }
})
function toggle(id: string) {
  ticked.value = ticked.value.includes(id) ? ticked.value.filter((x) => x !== id) : [...ticked.value, id]
}

const msg = ref('')
async function share() {
  // What's ticked (already at home) stays out of the shared list.
  const text = shoppingText(list.value, `Alışveriş listesi (${range.value === 'week' ? 'tüm hafta' : 'bugünden hafta sonuna'})`, new Set(ticked.value))
  try {
    if (Capacitor.isNativePlatform()) {
      const { Share } = await import('@capacitor/share')
      await Share.share({ title: 'Alışveriş listesi', text })
    } else if (navigator.share) {
      await navigator.share({ title: 'Alışveriş listesi', text })
    } else {
      await navigator.clipboard.writeText(text)
      msg.value = 'Liste panoya kopyalandı.'
    }
  } catch {
    // closing the share sheet is not an error
  }
}
</script>

<template>
  <SheetPanel title="Alışveriş listesi" @close="emit('close')">
    <div class="seg" role="group" aria-label="Aralık" style="margin-bottom: 10px">
      <button type="button" :aria-pressed="range === 'rest'" @click="range = 'rest'">Bugünden hafta sonuna</button>
      <button type="button" :aria-pressed="range === 'week'" @click="range = 'week'">Tüm hafta</button>
    </div>
    <p class="small muted">
      Menüdeki yemeklerin malzemeleri, çiğ ve kuru hâliyle (pişmiş pilav yerine kuru bulgur gibi). Miktarlar senin porsiyonlarına göre.
      Evde olanları işaretle; paylaştığın listede sadece alınacaklar olur.
    </p>
    <p v-if="msg" class="ok small">{{ msg }}</p>
    <section v-for="g in list.groups" :key="g.category" class="card grp">
      <h2>{{ g.category }}</h2>
      <label v-for="i in g.items" :key="i.id" class="item" :class="{ done: ticked.includes(i.id) }">
        <input type="checkbox" :checked="ticked.includes(i.id)" @change="toggle(i.id)" />
        <span class="nm">{{ i.name }}</span>
        <span class="amt num">{{ i.amount }}</span>
      </label>
    </section>
    <section v-if="list.ready.length" class="card grp">
      <h2>Hazır ürünler</h2>
      <label v-for="r in list.ready" :key="r.id" class="item" :class="{ done: ticked.includes(r.id) }">
        <input type="checkbox" :checked="ticked.includes(r.id)" @change="toggle(r.id)" />
        <span class="nm">{{ r.name }}</span><span class="amt num">× {{ String(r.count).replace('.', ',') }}</span>
      </label>
    </section>
    <p v-if="!list.groups.length" class="muted">Bu aralıkta menü yok.</p>
    <button type="button" class="btn wide" @click="share">Listeyi paylaş{{ ticked.length ? ' (işaretliler hariç)' : '' }}</button>
  </SheetPanel>
</template>

<style scoped>
.grp h2 { margin: 0 0 6px; font-size: 1rem; }
.item { display: flex; align-items: center; gap: 10px; padding: 7px 0; }
.item + .item { border-top: 1px solid var(--line); }
.nm { flex: 1; }
.amt { color: var(--accent); font-weight: 650; white-space: nowrap; }
.done .nm, .done .amt { text-decoration: line-through; color: var(--ink-3); }
.wide { width: 100%; margin-top: 8px; }
.ok { background: var(--accent-soft); color: var(--accent); padding: 8px 10px; border-radius: 10px; }
</style>
