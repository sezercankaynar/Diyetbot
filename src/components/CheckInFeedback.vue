<script setup lang="ts">
import type { Feedback } from '@/engine'
defineProps<{ feedback: Feedback }>()
</script>

<template>
  <div>
    <section v-if="feedback.bodyFat" class="card">
      <h2>Vücut yağ oranı (tahmini)</h2>
      <p class="big num">%{{ feedback.bodyFat.toLocaleString('tr-TR') }}</p>
      <p class="small muted">ABD Donanması çevre ölçümü yöntemi; ±3–4 puan hata payı vardır. Asıl önemli olan haftadan haftaya yön.</p>
    </section>
    <section v-if="feedback.wins.length" class="card wins">
      <h2>İyi gidenler</h2>
      <ul><li v-for="w in feedback.wins" :key="w">✓ {{ w }}</li></ul>
    </section>
    <section v-if="feedback.focus.length" class="card focus">
      <h2>Bu haftanın odağı</h2>
      <ol><li v-for="f in feedback.focus" :key="f">{{ f }}</li></ol>
    </section>
    <section v-if="feedback.tips.length" class="card">
      <h2>Öneriler</h2>
      <ul><li v-for="t in feedback.tips" :key="t">{{ t }}</li></ul>
    </section>
    <p v-if="!feedback.wins.length && !feedback.focus.length && !feedback.tips.length" class="muted">
      Değerlendirme için yeterli veri yok; bu hafta yediklerini ve tartını kaydet.
    </p>
  </div>
</template>

<style scoped>
.big { font-size: 2rem; color: var(--accent); margin: 0; }
.wins { border-left: 5px solid var(--accent); }
.focus { border-left: 5px solid var(--warn-border); }
ol { padding-left: 1.3em; }
</style>
