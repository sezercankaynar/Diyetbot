<script setup lang="ts">
import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const msg = ref('')
const err = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

async function doExport() {
  const data = await store.exportBackup()
  const json = JSON.stringify(data, null, 2)
  const name = `diyetbot-yedek-${data.exportedAt.slice(0, 10)}.json`
  err.value = false
  try {
    if (Capacitor.isNativePlatform()) {
      // Android app: browsers' download link doesn't work in the WebView,
      // so write the file and open the share sheet (Drive, Files, e-mail…).
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
      const { Share } = await import('@capacitor/share')
      const { uri } = await Filesystem.writeFile({ path: name, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 })
      await Share.share({ title: 'Diyetbot yedeği', files: [uri] })
      msg.value = 'Yedek hazır; kaydedeceğiniz yeri seçin.'
      return
    }
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
    msg.value = 'Yedek indirildi.'
  } catch (x) {
    // Closing the share sheet without choosing a target is not an error.
    if (/cancel/i.test((x as Error).message)) return
    err.value = true
    msg.value = 'Yedek alınamadı: ' + (x as Error).message
  }
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
      <input ref="fileInput" type="file" accept=".json,application/json,text/plain,application/octet-stream" hidden @change="onFile" />
    </div>
    <p v-if="msg" class="small" :style="{ color: err ? 'var(--stop-border)' : 'var(--accent)' }" role="status">{{ msg }}</p>
  </section>
</template>
