<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()

import { openSheet, openSheetCount } from './sheetStack'

let release: (() => void) | null = null
onMounted(() => {
  release = openSheet(() => emit('close'))
  document.body.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  release?.()
  if (openSheetCount() === 0) document.body.style.overflow = ''
})
</script>

<template>
  <div class="sheet" role="dialog" aria-modal="true" :aria-label="title">
    <header class="sheet-head">
      <h1>{{ title }}</h1>
      <button type="button" class="close" aria-label="Kapat" @click="emit('close')">✕</button>
    </header>
    <div class="sheet-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.sheet {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: var(--bg);
  display: flex;
  flex-direction: column;
}
.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: calc(12px + env(safe-area-inset-top)) 14px 10px;
  background: var(--surface);
  box-shadow: 0 1px 0 var(--line);
}
.sheet-head h1 { font-size: 1.25rem; }
.close {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 0;
  background: var(--surface-2);
  color: var(--ink);
  font-size: 1.1rem;
  cursor: pointer;
}
.sheet-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 14px calc(24px + env(safe-area-inset-bottom));
  max-width: 640px;
  width: 100%;
  margin: 0 auto;
}
</style>
