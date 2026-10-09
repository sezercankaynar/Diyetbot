<script setup lang="ts">
defineProps<{ label: string; value: string | number; unit?: string; big?: boolean }>()
</script>

<template>
  <div class="stat" :class="{ big }">
    <div class="label">{{ label }}</div>
    <span class="value">{{ value }}</span><span v-if="unit" class="unit">{{ unit }}</span>
    <slot />
  </div>
</template>
