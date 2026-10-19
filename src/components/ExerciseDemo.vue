<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { exerciseImages } from '@/content/exerciseImages'
import type { ExerciseSlot } from '@/content/exercises'

// The movement as two photos (start ↔ end position) shown in turn; tap to pause or go on.
const props = defineProps<{ slot: ExerciseSlot; equipment: 'gym' | 'home'; name: string }>()
const img = computed(() => exerciseImages(props.slot, props.equipment))
const frame = ref(0)
const playing = ref(true)
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => {
    if (playing.value) frame.value = 1 - frame.value
  }, 1200)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <figure class="demo">
    <button type="button" class="frames" :aria-label="playing ? 'Durdur' : 'Oynat'" @click="playing = !playing">
      <img v-for="(src, i) in img.src" :key="src" :src="src" :alt="`${name}: ${i ? 'bitiş' : 'başlangıç'} pozisyonu`" :class="{ on: frame === i }" loading="lazy" />
      <span class="badge">{{ frame ? 'bitiş' : 'başlangıç' }}{{ playing ? '' : ' · durdu' }}</span>
    </button>
    <figcaption class="small muted">
      <template v-if="img.note">{{ img.note }} </template>Dokununca durur. Fotoğraflar: Free Exercise DB (kamu malı).
    </figcaption>
  </figure>
</template>

<style scoped>
.demo { margin: 4px 0 10px; }
.frames { position: relative; display: block; width: 100%; aspect-ratio: 3 / 2; padding: 0; border: 0; border-radius: 12px; overflow: hidden; background: #000; cursor: pointer; }
.frames img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.35s ease; }
.frames img.on { opacity: 1; }
.badge { position: absolute; left: 8px; bottom: 8px; background: rgba(0, 0, 0, 0.6); color: #fff; font-size: 0.72rem; font-weight: 700; border-radius: 999px; padding: 3px 9px; }
figcaption { margin-top: 4px; }
</style>
