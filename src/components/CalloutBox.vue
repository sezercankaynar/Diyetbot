<script setup lang="ts">
import type { Callout } from '@/engine'
defineProps<{ callout: Callout }>()
const ICON = { stop: '⛔', warn: '⚠', info: 'ℹ' } as const
</script>

<template>
  <div class="callout" :class="callout.level" :role="callout.level === 'info' ? 'note' : 'alert'">
    <div class="head"><span aria-hidden="true">{{ ICON[callout.level] }}</span> {{ callout.title }}</div>
    <p>{{ callout.text }}</p>
  </div>
</template>

<style scoped>
.callout {
  border: 1px solid;
  border-left-width: 5px;
  border-radius: var(--radius);
  padding: 10px 12px;
  margin-bottom: 10px;
}
.callout p { margin: 4px 0 0; font-size: 0.92rem; }
.head { font-weight: 700; }
.warn { background: var(--warn-bg); border-color: var(--warn-border); color: var(--warn-ink); }
.stop { background: var(--stop-bg); border-color: var(--stop-border); color: var(--stop-ink); }
.info { background: var(--info-bg); border-color: var(--info-border); color: var(--info-ink); }
</style>
