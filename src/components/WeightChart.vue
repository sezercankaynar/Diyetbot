<script setup lang="ts">
import { computed, ref } from 'vue'
import { dayIndex, rollingAverage, sortLogs, type WeighIn } from '@/engine'

const props = defineProps<{ logs: WeighIn[] }>()

const W = 360
const H = 200
const PAD = { l: 38, r: 10, t: 12, b: 24 }

const sorted = computed(() => sortLogs(props.logs))
const avg = computed(() => rollingAverage(props.logs))

const scale = computed(() => {
  const xs = sorted.value.map((l) => dayIndex(l.date))
  const ys = sorted.value.map((l) => l.kg)
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs, x0 + 1)
  let y0 = Math.min(...ys)
  let y1 = Math.max(...ys)
  const pad = Math.max(0.5, (y1 - y0) * 0.15)
  y0 = Math.floor((y0 - pad) * 2) / 2
  y1 = Math.ceil((y1 + pad) * 2) / 2
  const x = (d: string) => PAD.l + ((dayIndex(d) - x0) / (x1 - x0)) * (W - PAD.l - PAD.r)
  const y = (kg: number) => PAD.t + (1 - (kg - y0) / (y1 - y0)) * (H - PAD.t - PAD.b)
  return { x, y, y0, y1 }
})

const ticks = computed(() => {
  const { y0, y1 } = scale.value
  const step = (y1 - y0) / 4
  return Array.from({ length: 5 }, (_, i) => Math.round((y0 + step * i) * 10) / 10)
})

const avgPath = computed(() =>
  avg.value.map((p, i) => `${i ? 'L' : 'M'}${scale.value.x(p.date).toFixed(1)},${scale.value.y(p.avg).toFixed(1)}`).join(' '),
)

const fmtDate = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}`

// Hover / tap: snap to the nearest logged date.
const active = ref<number | null>(null)
const svgEl = ref<SVGSVGElement | null>(null)
function onMove(e: PointerEvent) {
  const el = svgEl.value
  if (!el || sorted.value.length === 0) return
  const rect = el.getBoundingClientRect()
  const px = ((e.clientX - rect.left) / rect.width) * W
  let best = 0
  let bestDist = Infinity
  sorted.value.forEach((l, i) => {
    const d = Math.abs(scale.value.x(l.date) - px)
    if (d < bestDist) { bestDist = d; best = i }
  })
  active.value = best
}
const activePoint = computed(() => {
  if (active.value === null) return null
  const l = sorted.value[active.value]
  const a = avg.value[active.value]
  if (!l || !a) return null
  const x = scale.value.x(l.date)
  return { x, y: scale.value.y(l.kg), l, a, left: x > W / 2 }
})
</script>

<template>
  <figure class="chart">
    <div v-if="sorted.length < 2" class="empty muted small">Grafik için en az 2 tartı kaydı gerekli.</div>
    <template v-else>
      <svg
        ref="svgEl"
        :viewBox="`0 0 ${W} ${H}`"
        role="img"
        aria-label="Günlük tartı ve 7 günlük ortalama grafiği"
        @pointermove="onMove"
        @pointerdown="onMove"
        @pointerleave="active = null"
      >
        <g class="grid">
          <g v-for="t in ticks" :key="t">
            <line :x1="PAD.l" :x2="W - PAD.r" :y1="scale.y(t)" :y2="scale.y(t)" />
            <text :x="PAD.l - 6" :y="scale.y(t) + 3" text-anchor="end">{{ t.toFixed(1) }}</text>
          </g>
          <text :x="PAD.l" :y="H - 6">{{ fmtDate(sorted[0].date) }}</text>
          <text :x="W - PAD.r" :y="H - 6" text-anchor="end">{{ fmtDate(sorted[sorted.length - 1].date) }}</text>
        </g>
        <circle v-for="l in sorted" :key="l.date" class="pt" :cx="scale.x(l.date)" :cy="scale.y(l.kg)" r="4" />
        <path class="avg" :d="avgPath" />
        <g v-if="activePoint" class="hover">
          <line :x1="activePoint.x" :x2="activePoint.x" :y1="PAD.t" :y2="H - PAD.b" />
          <circle :cx="activePoint.x" :cy="scale.y(activePoint.a.avg)" r="4.5" class="avg-dot" />
        </g>
      </svg>
      <div
        v-if="activePoint"
        class="tip"
        :style="{ left: (activePoint.x / W) * 100 + '%', transform: activePoint.left ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)' }"
      >
        <div class="mono">{{ fmtDate(activePoint.l.date) }}</div>
        <div>Tartı <span class="num">{{ activePoint.l.kg.toFixed(1) }}</span> kg</div>
        <div>7 gün ort. <span class="num">{{ activePoint.a.avg.toFixed(2) }}</span> kg</div>
      </div>
      <figcaption class="legend small">
        <span><i class="sw pt-sw" /> Günlük tartı</span>
        <span><i class="sw line-sw" /> 7 günlük ortalama</span>
      </figcaption>
    </template>
  </figure>
</template>

<style scoped>
.chart { position: relative; margin: 0; }
svg { width: 100%; height: auto; display: block; touch-action: pan-y; }
.grid line { stroke: var(--rule); stroke-width: 1; }
.grid text { fill: var(--ink-3); font: 10px var(--font-mono); font-variant-numeric: tabular-nums; }
.pt { fill: var(--chart-point); opacity: 0.35; stroke: var(--paper-2); stroke-width: 1.5; }
.avg { fill: none; stroke: var(--chart-line); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.hover line { stroke: var(--ink-3); stroke-dasharray: 3 3; }
.avg-dot { fill: var(--chart-line); stroke: var(--paper-2); stroke-width: 2; }
.tip {
  position: absolute;
  top: 8px;
  pointer-events: none;
  background: var(--paper-2);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  padding: 6px 8px;
  font-size: 0.8rem;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}
.legend { display: flex; gap: 16px; color: var(--ink-2); margin-top: 6px; }
.sw { display: inline-block; vertical-align: middle; margin-right: 4px; }
.pt-sw { width: 8px; height: 8px; border-radius: 50%; background: var(--chart-point); opacity: 0.5; }
.line-sw { width: 16px; height: 2px; background: var(--chart-line); }
.empty { padding: 24px 0; text-align: center; }
</style>
