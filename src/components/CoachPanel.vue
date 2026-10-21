<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { askCoach } from '@/ai/coach'
import type { MenuProposal } from '@/ai/tools'
import MealPlate from './MealPlate.vue'
import type { ChatMessage } from '@/ai/gateway'
import { useAppStore } from '@/stores/app'
import SheetPanel from './SheetPanel.vue'

const emit = defineEmits<{ close: [] }>()
const store = useAppStore()

// The conversation lasts while the app is open (closing the sheet keeps it).
const shown = chatShown
const input = ref('')
const busy = ref(false)
const status = ref('')
const error = ref('')
const list = ref<HTMLElement | null>(null)
let ctrl: AbortController | null = null
onBeforeUnmount(() => ctrl?.abort())

const STARTERS = ['Akşam ne yesem?', 'Bugün nasıl gidiyorum?', 'Bu hafta neden kilo vermedim?', 'Canım tatlı çekiyor', 'Dışarıda yiyeceğim, ne seçeyim?']
const TOOL_TEXT: Record<string, string> = {
  search_foods: 'Yemeklere bakılıyor…', check_foods: 'Bütçene göre değerlendiriliyor…', rest_of_day_plates: 'Kalan öğünlerin hesaplanıyor…',
  search_ingredients: 'Malzemeler hesaplanıyor…', create_food: 'Katalogda olmayan yemek ekleniyor…', propose_menu: 'Menü hazırlanıyor…',
}

/** Last turns only (cheaper), cut where a new user question starts so tool rounds stay whole. */
function trimmed(h: ChatMessage[]): ChatMessage[] {
  const starts = h.map((m, i) => (m.role === 'user' && typeof m.content === 'string' ? i : -1)).filter((i) => i >= 0)
  const from = starts.length > 6 ? starts[starts.length - 6] : 0
  return h.slice(from)
}
const scroll = () => nextTick(() => list.value?.scrollTo({ top: list.value.scrollHeight, behavior: 'smooth' }))

async function send(text = input.value) {
  const q = text.trim()
  if (!q || busy.value) return
  input.value = ''
  error.value = ''
  shown.value.push({ role: 'user', text: q })
  chatHistory.push({ role: 'user', content: q })
  busy.value = true
  status.value = 'Düşünüyor…'
  scroll()
  ctrl = new AbortController()
  let proposal: MenuProposal | undefined
  const created: string[] = []
  try {
    const r = await askCoach(store.ai, store, trimmed(chatHistory), {
      signal: ctrl.signal, onTool: (n) => (status.value = TOOL_TEXT[n] ?? 'Bakılıyor…'),
      onPropose: (p) => (proposal = p), onCreate: (id) => created.push(id),
    })
    chatHistory.splice(0, chatHistory.length, ...r.messages)
    shown.value.push({ role: 'assistant', text: r.text.trim() || '…', proposal, created })
  } catch (e) {
    chatHistory.pop()
    error.value = (e as Error).message
  } finally {
    busy.value = false
    status.value = ''
    scroll()
  }
}
/** Puts the coach's proposal into today's menu (the meals not eaten yet). */
async function accept(m: Shown) {
  if (!m.proposal || m.applied) return
  if (m.proposal.date !== store.todayDate) {
    error.value = 'Bu öneri dünkü güne aitti; yeniden sor.'
    return
  }
  for (const x of m.proposal.meals) await store.setMenuMeal(m.proposal.date, x.item)
  m.applied = true
}
function reset() {
  chatHistory.splice(0)
  shown.value = []
  error.value = ''
}
</script>

<script lang="ts">
import { ref as vueRef } from 'vue'
import type { ChatMessage as Msg } from '@/ai/gateway'
import type { MenuProposal as Proposal } from '@/ai/tools'
export interface Shown { role: 'user' | 'assistant'; text: string; proposal?: Proposal; created?: string[]; applied?: boolean }
const chatShown = vueRef<Shown[]>([])
const chatHistory: Msg[] = []
</script>

<template>
  <SheetPanel title="✨ Diyet koçu" @close="emit('close')">
    <div ref="list" class="chat">
      <p v-if="!shown.length" class="small muted">
        Beslenme, menün, kilo gidişatın ya da antrenmanın hakkında sor. Koç bugünkü kayıtlarını, hedeflerini ve son haftanı görür;
        sayıları uygulamanın hesabından alır. Tıbbi teşhis koymaz.
      </p>
      <template v-for="(m, i) in shown" :key="i">
        <div class="msg" :class="m.role">{{ m.text }}</div>
        <div v-if="m.proposal" class="proposal">
          <div class="label">Önerilen menü</div>
          <div v-for="x in m.proposal.meals" :key="x.slot" class="pmeal">
            <div class="small muted">{{ x.label }}</div>
            <MealPlate :item="x.item" compact />
          </div>
          <p class="small num" :class="{ over: m.proposal.day.kcal > m.proposal.target + 50 }">
            Bunlarla gün (yediklerin ve menüdeki diğer öğünlerle): <strong>{{ m.proposal.day.kcal }}</strong> / {{ m.proposal.target }} kcal · P {{ m.proposal.day.protein }} g
          </p>
          <p v-if="m.created?.length" class="small muted">Katalogda olmayan {{ m.created.length }} yemek eklendi (malzemelerinden hesaplandı).</p>
          <button v-if="!m.applied" type="button" class="btn wide" @click="accept(m)">✓ Menüme koy</button>
          <p v-else class="small ok">✓ Menüne kondu; Bugün ve Menü ekranında görünüyor.</p>
        </div>
      </template>
      <div v-if="busy" class="msg assistant typing small muted">{{ status }}</div>
    </div>
    <p v-if="error" class="small warn" role="alert">{{ error }}</p>
    <div v-if="!shown.length" class="starters">
      <button v-for="s in STARTERS" :key="s" type="button" class="chip" :disabled="busy" @click="send(s)">{{ s }}</button>
    </div>
    <form class="ask" @submit.prevent="send()">
      <input v-model="input" type="text" placeholder="Koça sor…" :disabled="busy" aria-label="Soru" />
      <button type="submit" class="btn" :disabled="busy || !input.trim()">Gönder</button>
    </form>
    <button v-if="shown.length" type="button" class="link small" @click="reset">Yeni sohbet</button>
  </SheetPanel>
</template>

<style scoped>
.chat { display: grid; gap: 8px; max-height: 58vh; overflow-y: auto; padding: 4px 0 8px; }
.msg { padding: 10px 12px; border-radius: 16px; white-space: pre-wrap; line-height: 1.4; max-width: 88%; }
.msg.user { justify-self: end; background: var(--accent); color: var(--accent-ink); border-bottom-right-radius: 4px; }
.msg.assistant { justify-self: start; background: var(--surface); box-shadow: var(--shadow); border-bottom-left-radius: 4px; }
.typing { font-style: italic; }
.proposal { justify-self: stretch; background: var(--surface); box-shadow: var(--shadow); border: 2px solid var(--accent-soft); border-radius: 16px; padding: 10px 12px; display: grid; gap: 8px; }
.pmeal + .pmeal { border-top: 1px solid var(--line); padding-top: 8px; }
.wide { width: 100%; }
.ok { color: var(--accent); font-weight: 700; }
.over { color: var(--warn-ink); }
.starters { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0 10px; }
.chip { border: 0; border-radius: 999px; padding: 7px 12px; font: inherit; font-size: 0.82rem; font-weight: 650; background: var(--accent-soft); color: var(--accent); cursor: pointer; }
.ask { display: flex; gap: 6px; }
.ask input { flex: 1; min-width: 0; }
.link { background: none; border: 0; padding: 8px 0 0; font: inherit; color: var(--ink-3); cursor: pointer; }
.warn { color: var(--warn-ink); background: var(--warn-bg); border-radius: 10px; padding: 8px 10px; }
</style>
