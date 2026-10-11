<script setup lang="ts">
import { DISCLAIMER, STUDIES } from '@/content/evidence'
import { TRAINING_EVIDENCE } from '@/content/exercises'

// Studies grouped by topic, each group folded so the page stays short.
const ALL = [...STUDIES, ...TRAINING_EVIDENCE]
const TOPICS: { title: string; ids: string[] }[] = [
  { title: 'Beslenme rehberleri ve diyet türleri', ids: ['tuber', 'predimed', 'dash', 'dietfits', 'hall', 'dpp'] },
  { title: 'Enerji, protein ve su', ids: ['msj', 'morton', 'water'] },
  { title: 'Öğün düzeni, uyku ve kayıt tutma', ids: ['meal-timing', 'late-eating', 'tre', 'sleep', 'self-monitoring'] },
]
const placed = new Set(TOPICS.flatMap((t) => t.ids))
const groups = [
  ...TOPICS.map((t) => ({ title: t.title, items: ALL.filter((s) => t.ids.includes(s.id)) })),
  { title: 'Spor ve hareket', items: ALL.filter((s) => !placed.has(s.id)) },
].filter((g) => g.items.length)
</script>

<template>
  <div class="page">
    <p class="muted small">Uygulamadaki beslenme ve antrenman kurallarının dayandığı {{ ALL.length }} çalışma ve rehber. Bir konuya dokun.</p>

    <details v-for="g in groups" :key="g.title" class="fold">
      <summary>{{ g.title }} <span class="hint">{{ g.items.length }}</span></summary>
      <div class="fold-body">
        <article v-for="s in g.items" :key="s.id" class="study">
          <h3>{{ s.title }}</h3>
          <p class="cite small">{{ s.citation }}</p>
          <p class="small">{{ s.summary }}</p>
          <p class="rule small"><span class="label">Uygulamadaki kural</span><br />{{ s.rule }}</p>
        </article>
      </div>
    </details>

    <footer class="disclaimer" role="note">
      <strong>Yasal uyarı.</strong> {{ DISCLAIMER }}
    </footer>
  </div>
</template>

<style scoped>
.study + .study { border-top: 1px solid var(--line); margin-top: 12px; padding-top: 12px; }
.study h3 { margin: 0 0 4px; font-size: 1rem; }
.cite { color: var(--ink-3); margin-top: 0; }
.rule { border-top: 1px dashed var(--rule-strong); padding-top: 8px; margin-top: 8px; }
.disclaimer {
  border: 1px solid var(--warn-border);
  background: var(--warn-bg);
  color: var(--warn-ink);
  border-radius: var(--radius);
  padding: 12px;
  font-size: 0.9rem;
  margin-top: 14px;
}
</style>
