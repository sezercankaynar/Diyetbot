<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const msg = ref('')
const err = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

async function doExport() {
  const data = await store.exportBackup()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `diyetbot-yedek-${data.exportedAt.slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  err.value = false
  msg.value = 'Yedek indirildi.'
}

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!confirm('Mevcut tüm veriler yedekteki verilerle değiştirilecek. Devam edilsin mi?')) return
  try {
    await store.importBackup(JSON.parse(await file.text()))
    err.value = false
    msg.value = 'Yedek geri yüklendi.'
  } catch (x) {
    err.value = true
    msg.value = x instanceof SyntaxError ? 'Dosya JSON değil.' : (x as Error).message
  }
}
</script>

<template>
  <section class="card" style="margin-top: 18px">
    <h2>Yedekleme</h2>
    <p class="small muted">Veriler yalnızca bu cihazda (IndexedDB) saklanır. Düzenli olarak JSON yedeği alın.</p>
    <div class="btn-row">
      <button class="btn ghost" type="button" @click="doExport">JSON dışa aktar</button>
      <button class="btn ghost" type="button" @click="fileInput?.click()">JSON içe aktar</button>
      <input ref="fileInput" type="file" accept="application/json,.json" hidden @change="onFile" />
    </div>
    <p v-if="msg" class="small" :style="{ color: err ? 'var(--stop-border)' : 'var(--accent)' }" role="status">{{ msg }}</p>
  </section>
</template>
