<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { addDays, onTarget } from '@/engine'
import { useAppStore } from '@/stores/app'
import { useShareStore } from '@/stores/share'

// The partner's day on Bugün: totals, workout, steps, what they ate, the last week, and cheers.
const app = useAppStore()
const share = useShareStore()
const open = ref(false)
const msg = ref('')
const sent = ref('')
const EMOJIS = ['👏', '💪', '🔥', '❤️']

const name = computed(() => share.view?.partner?.name ?? '')
const today = computed(() => share.partnerToday)
const updated = computed(() => {
  const d = share.view?.days.find((x) => x.day === app.todayDate)
  return d ? new Date(d.updated_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : null
})
const pct = (a: number, b: number) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0)
const last7 = computed(() =>
  Array.from({ length: 7 }, (_, k) => addDays(app.todayDate, k - 6)).map((d) => {
    const x = share.view?.days.find((p) => p.day === d)?.data
    // Today isn't over: neutral until it's on target.
    const state = !x?.logged ? 'none' : onTarget(x) ? 'on' : d === app.todayDate ? 'none' : 'off'
    return { d, label: new Date(`${d}T12:00:00`).toLocaleDateString('tr-TR', { weekday: 'short' }), state }
  }),
)
const bothGood = computed(() => share.week.mine >= 5 && share.week.theirs >= 5)
const received = computed(() => (share.view?.reactions ?? []).filter((r) => !r.mine).slice(0, 3))

async function send(emoji: string) {
  await share.react(emoji, msg.value)
  if (!share.error) {
    sent.value = `${emoji} gönderildi${msg.value.trim() ? `: “${msg.value.trim()}”` : ''}`
    msg.value = ''
  }
}
onMounted(() => void share.refresh().then(() => share.markSeen()))
watch(() => share.unseen.length, (n) => { if (n) void share.markSeen() })
</script>

<template>
  <section v-if="share.paired" class="card partner">
    <div class="head">
      <h2>👫 {{ name || 'Partnerin' }}</h2>
      <span v-if="updated" class="small muted">{{ updated }}'te güncellendi</span>
    </div>
    <p v-if="!share.view?.partner" class="small muted">Partnerinin katılmasını bekliyorsun (Ben → Profil → 👫 Partnerim'deki kodu ona gönder).</p>

    <template v-else>
      <div v-for="r in received" :key="r.id" class="cheer" :class="{ fresh: !r.seen }">
        <span class="em">{{ r.emoji }}</span>
        <span class="small"><strong>{{ name }}</strong>{{ r.message ? `: “${r.message}”` : ' sana tepki gönderdi' }}</span>
      </div>

      <p v-if="!today?.logged" class="small muted">Bugün henüz bir şey kaydetmedi.</p>
      <template v-if="today">
        <div class="kcal">
          <span class="num"><strong>{{ today.kcal }}</strong> / {{ today.target }} kcal</span>
          <span class="small muted num">P {{ today.protein }} / {{ today.proteinTarget }} g</span>
        </div>
        <div class="bar"><span :style="{ width: pct(today.kcal, today.target) + '%' }" :class="{ over: today.kcal > today.target * 1.1 }" /></div>
        <div class="chips small">
          <span :class="{ ok: today.workout }">{{ today.workout ? '💪 Antrenman ✓' : '💪 Antrenman —' }}</span>
          <span :class="{ ok: (today.steps ?? 0) >= today.stepTarget }">👣 {{ today.steps?.toLocaleString('tr-TR') ?? '—' }} adım</span>
          <span :class="{ ok: today.water >= today.waterTarget }">💧 {{ today.water }}/{{ today.waterTarget }}</span>
          <span v-if="today.weightChange !== undefined">⚖️ {{ today.weightChange > 0 ? '+' : '' }}{{ String(today.weightChange).replace('.', ',') }} kg/hafta</span>
          <span v-if="today.weightKg">{{ String(today.weightKg).replace('.', ',') }} kg</span>
        </div>
        <button v-if="today.meals?.length || today.extras?.length" type="button" class="link small" @click="open = !open">{{ open ? 'Gizle' : 'Bugün ne yedi?' }}</button>
        <ul v-if="open" class="meals small">
          <li v-for="m in today.meals" :key="m.label"><strong>{{ m.label }}</strong> · {{ m.foods.join(', ') }} <span class="muted num">({{ m.kcal }} kcal)</span></li>
          <li v-if="today.extras?.length"><strong>Öğün dışı</strong> · {{ today.extras.join(', ') }}</li>
        </ul>
      </template>

      <div class="week">
        <div class="label">Son 7 gün</div>
        <div class="dots">
          <span v-for="x in last7" :key="x.d" class="dot" :class="x.state" :title="x.d"><i />{{ x.label }}</span>
        </div>
        <p class="small">
          Hedefte geçen gün: sen <strong>{{ share.week.mine }}</strong> · {{ name }} <strong>{{ share.week.theirs }}</strong>
          <template v-if="bothGood"> — 🎉 ikiniz de harika bir hafta geçirdiniz!</template>
          <template v-else> — birlikte hedef: ikiniz de en az 5 gün.</template>
        </p>
      </div>

      <div class="send">
        <input v-model="msg" type="text" maxlength="200" placeholder="Bir şey yaz (isteğe bağlı)" aria-label="Mesaj" />
        <div class="emojis">
          <button v-for="e in EMOJIS" :key="e" type="button" :disabled="share.busy" :aria-label="`${e} gönder`" @click="send(e)">{{ e }}</button>
        </div>
      </div>
      <p v-if="sent" class="small ok" role="status">{{ sent }}</p>
    </template>
    <p v-if="share.error" class="small warn" role="alert">{{ share.error }}</p>
  </section>
</template>

<style scoped>
.partner { border-left: 4px solid #e0628a; display: grid; gap: 8px; }
.head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.cheer { display: flex; gap: 8px; align-items: center; background: var(--surface-2); border-radius: 12px; padding: 6px 10px; }
.cheer.fresh { background: #fde7ef; color: #7a1f3d; }
.em { font-size: 1.3rem; }
.kcal { display: flex; justify-content: space-between; align-items: baseline; }
.bar { height: 8px; border-radius: 99px; background: var(--surface-2); overflow: hidden; }
.bar span { display: block; height: 100%; background: var(--accent); border-radius: 99px; }
.bar span.over { background: var(--accent-2, #e07a3a); }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chips span { background: var(--surface-2); border-radius: 999px; padding: 3px 9px; color: var(--ink-2); }
.chips span.ok { background: var(--accent-soft); color: var(--accent); font-weight: 650; }
.link { background: none; border: 0; padding: 0; font: inherit; color: var(--accent); font-weight: 700; text-align: left; cursor: pointer; }
.meals { margin: 0; padding-left: 1.1em; display: grid; gap: 4px; }
.dots { display: flex; justify-content: space-between; margin: 4px 0; }
.dot { display: grid; justify-items: center; gap: 2px; font-size: 0.68rem; color: var(--ink-3); }
.dot i { width: 14px; height: 14px; border-radius: 50%; background: var(--surface-2); border: 2px solid var(--line); }
.dot.on i { background: var(--accent); border-color: var(--accent); }
.dot.off i { background: var(--warn-bg); border-color: var(--warn-border, #e0b04a); }
.send { display: grid; gap: 6px; }
.emojis { display: flex; gap: 6px; }
.emojis button { flex: 1; font-size: 1.4rem; padding: 6px 0; border: 0; border-radius: 12px; background: var(--surface-2); cursor: pointer; }
.ok { color: var(--accent); }
.warn { color: var(--warn-ink); background: var(--warn-bg); border-radius: 10px; padding: 8px 10px; }
</style>
