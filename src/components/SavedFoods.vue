<script setup lang="ts">
import { computed, ref } from 'vue'
import { getFood, itemTotals, plateName, sumTotals, type Food, type SavedMeal } from '@/engine'
import { useAppStore } from '@/stores/app'
import SheetPanel from './SheetPanel.vue'
import RecipeBuilder from './RecipeBuilder.vue'

// The user's own dishes and saved packaged products: edit or delete.
const store = useAppStore()
const own = computed(() => store.customFoods.filter((f) => f.id.startsWith('ev-') && !f.hidden).sort((a, b) => a.name.localeCompare(b.name, 'tr')))
const packaged = computed(() => store.customFoods.filter((f) => f.id.startsWith('pk-') && !f.hidden).sort((a, b) => a.name.localeCompare(b.name, 'tr')))
const editing = ref<Food | null>(null)
const adding = ref(false)
async function add(f: Food) {
  await store.saveCustomFood(f)
  adding.value = false
  msg.value = `"${f.name}" eklendi: 1 porsiyon ${f.kcal} kcal.`
}
const msg = ref('')

async function save(f: Food) {
  await store.saveCustomFood(f)
  msg.value = `"${f.name}" güncellendi.`
  editing.value = null
}
const mealKcal = (m: SavedMeal) => sumTotals(m.items.map((x) => itemTotals(x.foodId, x.factor))).kcal
const mealText = (m: SavedMeal) => m.items.map((x) => plateName(getFood(x.foodId)?.name ?? '?')).join(', ')
async function removeMeal(m: SavedMeal) {
  if (!confirm(`"${m.name}" kayıtlı öğünlerinden silinsin mi?`)) return
  await store.deleteSavedMeal(m.id)
  msg.value = `"${m.name}" silindi.`
}
async function remove(f: Food) {
  if (!confirm(`"${f.name}" silinsin mi? Aramada çıkmaz, menüde varsa yerine başka yemek gelir; geçmiş kayıtların korunur.`)) return
  await store.deleteCustomFood(f.id)
  msg.value = `"${f.name}" silindi.`
}
</script>

<template>
  <div>
    <button type="button" class="btn ghost small add" @click="adding = true">＋ {{ store.aiReady ? 'Tarifimden yemek ekle (yapay zekâ ile ya da elle)' : 'Tarifimden yemek ekle' }}</button>
    <p v-if="msg" class="ok small">{{ msg }}</p>
    <template v-if="store.savedMeals.length">
      <div class="label grp">Kayıtlı öğünlerim</div>
      <div v-for="m in store.savedMeals" :key="m.id" class="row">
        <div class="txt">
          <div class="nm">⭐ {{ m.name }}</div>
          <div class="small muted">{{ mealText(m) }} · <span class="num">{{ mealKcal(m) }} kcal</span></div>
        </div>
        <button type="button" class="btn ghost small del" :aria-label="`${m.name} sil`" @click="removeMeal(m)">Sil</button>
      </div>
    </template>
    <p v-if="!own.length && !packaged.length && !store.savedMeals.length" class="small muted">
      Henüz kayıtlı bir şey yok. Aramada bulamadığın bir yemeği "Yemek ekle" ile ya da paketli ürünü barkodla eklediğinde burada görünür.
    </p>
    <template v-for="[title, list] in ([['Kendi yemeklerim', own], ['Paketli ürünlerim', packaged]] as const)" :key="title">
      <template v-if="list.length">
        <div class="label grp">{{ title }}</div>
        <div v-for="f in list" :key="f.id" class="row">
          <div class="txt">
            <div class="nm">{{ f.brand ? `${f.brand} – ${f.name}` : f.name }}</div>
            <div class="small muted num">{{ f.portion }} · {{ f.kcal }} kcal · P {{ Math.round(f.protein) }} · K {{ Math.round(f.carb) }} · Y {{ Math.round(f.fat) }}</div>
          </div>
          <button type="button" class="btn ghost small" @click="editing = f">Düzenle</button>
          <button type="button" class="btn ghost small del" :aria-label="`${f.name} sil`" @click="remove(f)">Sil</button>
        </div>
      </template>
    </template>
    <p class="small muted">Düzenlemek geçmiş günlerdeki kayıtların toplamını da değiştirir (aynı yemeğe bağlılar).</p>
    <SheetPanel v-if="adding" title="📖 Tarifimden yemek ekle" @close="adding = false">
      <RecipeBuilder save-label="Kaydet" @save="add" @cancel="adding = false" />
    </SheetPanel>
    <SheetPanel v-if="editing" title="Kayıtlı yemeği düzenle" @close="editing = null">
      <RecipeBuilder :edit="editing" save-label="Değişiklikleri kaydet" @save="save" @cancel="editing = null" />
    </SheetPanel>
  </div>
</template>

<style scoped>
.grp { margin-top: 10px; }
.add { width: 100%; margin-bottom: 8px; }
.row { display: flex; align-items: center; gap: 6px; padding: 8px 0; border-bottom: 1px solid var(--line); }
.txt { flex: 1; min-width: 0; }
.nm { font-weight: 650; }
.del { color: var(--stop-border); }
.ok { background: var(--accent-soft); color: var(--accent); padding: 8px 10px; border-radius: 10px; }
</style>
