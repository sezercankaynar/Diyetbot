<script setup lang="ts">
import { DISCLAIMER, STUDIES } from '@/content/evidence'
import { TRAINING_EVIDENCE } from '@/content/exercises'
const ALL = [...STUDIES, ...TRAINING_EVIDENCE]
</script>

<template>
  <div class="page">
    <p class="muted small">Uygulamadaki beslenme ve antrenman kurallarının dayandığı {{ ALL.length }} çalışma.</p>

    <article v-for="s in ALL" :key="s.id" class="card">
      <h2>{{ s.title }}</h2>
      <p class="cite mono small">{{ s.citation }}</p>
      <p>{{ s.summary }}</p>
      <p class="rule small"><span class="label">Uygulamadaki kural</span><br />{{ s.rule }}</p>
    </article>

    <footer class="disclaimer" role="note">
      <strong>Yasal uyarı.</strong> {{ DISCLAIMER }}
    </footer>
  </div>
</template>

<style scoped>
.cite { color: var(--ink-3); margin-top: -4px; }
.rule { border-top: 1px dashed var(--rule-strong); padding-top: 8px; margin-top: 10px; }
.disclaimer {
  border: 1px solid var(--warn-border);
  background: var(--warn-bg);
  color: var(--warn-ink);
  border-radius: var(--radius);
  padding: 12px;
  font-size: 0.9rem;
}
</style>
