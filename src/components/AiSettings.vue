<script setup lang="ts">
import { ref } from 'vue'
import { AI_MODELS, testGateway, type AiSettings } from '@/ai/gateway'
import { useAppStore } from '@/stores/app'

// Gateway token, address and models for the AI features. Kept only on this phone.
const store = useAppStore()
const draft = ref<AiSettings>({ ...store.ai })
const show = ref(false)
const msg = ref<{ ok: boolean; text: string } | null>(null)
const busy = ref(false)

async function save() {
  store.setAi(draft.value)
  msg.value = null
  if (!draft.value.token.trim()) return
  busy.value = true
  const r = await testGateway(store.ai)
  busy.value = false
  if (!r.ok) {
    msg.value = { ok: false, text: `Kaydedildi ama bağlantı kurulamadı: ${r.message}` }
    return
  }
  const missing = [store.ai.logModel, store.ai.coachModel].filter((m) => r.models.length && !r.models.includes(m))
  msg.value = missing.length
    ? { ok: false, text: `Bağlandı, ama ${missing.join(', ')} bu token için izinli değil; aşağıdan başka model seç.` }
    : { ok: true, text: 'Bağlandı ✓ Yapay zekâ özellikleri Bugün ekranında.' }
}
function clear() {
  draft.value = { ...draft.value, token: '' }
  store.setAi(draft.value)
  msg.value = { ok: true, text: 'Token silindi; yapay zekâ özellikleri kapandı.' }
}
</script>

<template>
  <div class="ai">
    <p class="small muted">
      Yazarak yemek kaydı ve diyet koçu, Claude gateway'in üzerinden çalışır. Gateway panelinde oluşturduğun token'ı (cgw_…) buraya yapıştır.
      Token sadece bu telefonda saklanır, yedeğe girmez. Kalori ve makrolar her zaman uygulamanın kendi hesabından gelir; yapay zekâ sadece anlar, eşleştirir ve anlatır.
    </p>
    <label>
      <span class="small muted">Gateway token</span>
      <span class="row">
        <input v-model="draft.token" :type="show ? 'text' : 'password'" autocomplete="off" placeholder="cgw_…" spellcheck="false" />
        <button type="button" class="btn ghost small" @click="show = !show">{{ show ? 'Gizle' : 'Göster' }}</button>
      </span>
    </label>
    <label>
      <span class="small muted">Yazarak kayıt için model</span>
      <select v-model="draft.logModel"><option v-for="m in AI_MODELS" :key="m.id" :value="m.id">{{ m.label }}</option></select>
    </label>
    <label>
      <span class="small muted">Diyet koçu için model</span>
      <select v-model="draft.coachModel"><option v-for="m in AI_MODELS" :key="m.id" :value="m.id">{{ m.label }}</option></select>
    </label>
    <details class="adv">
      <summary class="small">Gateway adresi</summary>
      <input v-model="draft.url" type="url" spellcheck="false" />
    </details>
    <p v-if="msg" class="small" :class="msg.ok ? 'ok' : 'warn'" role="status">{{ msg.text }}</p>
    <div class="btns">
      <button v-if="store.aiReady" type="button" class="btn ghost small" @click="clear">Token'ı sil</button>
      <button type="button" class="btn small" :disabled="busy" @click="save">{{ busy ? 'Deneniyor…' : 'Kaydet ve dene' }}</button>
    </div>
  </div>
</template>

<style scoped>
.ai { display: grid; gap: 10px; }
label { display: grid; gap: 4px; }
.row { display: flex; gap: 6px; }
.row input { flex: 1; min-width: 0; }
.adv summary { cursor: pointer; color: var(--ink-2); margin-bottom: 6px; }
.btns { display: flex; justify-content: flex-end; gap: 8px; }
.ok { color: var(--accent); }
.warn { color: var(--warn-ink); background: var(--warn-bg); border-radius: 10px; padding: 8px 10px; }
</style>
