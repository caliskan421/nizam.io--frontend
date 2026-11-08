<script setup lang="ts">
import { pilot, applyTheme, cancelPending, type Face, type Scale } from './state'
import { GANTT_CAP } from './mock'

defineProps<{ title: string; taskCount: number; note?: string }>()

const scales: { v: Scale; l: string }[] = [
  { v: 'gun', l: 'Gün' },
  { v: 'hafta', l: 'Hafta' },
]
const faces: { v: Face; l: string }[] = [
  { v: 'admin', l: 'Admin' },
  { v: 'koordinator', l: 'Koordinatör' },
  { v: 'uye', l: 'Üye' },
]
const legend = [
  ['Başlamadı', '--gp-todo'],
  ['Devam ediyor', '--gp-doing'],
  ['Onay bekliyor', '--gp-review'],
  ['Geri gönderildi', '--gp-back'],
  ['Tamamlandı', '--gp-done'],
  ['Gecikme / geç bitiş', '--gp-late'],
] as const
applyTheme(pilot.theme)
</script>

<template>
  <div class="shell">
    <header class="bar">
      <strong>{{ title }}</strong>
      <div class="seg" role="group" aria-label="Ölçek">
        <button
          v-for="s in scales"
          :key="s.v"
          type="button"
          :aria-pressed="pilot.scale === s.v"
          @click="pilot.scale = s.v"
        >
          {{ s.l }}
        </button>
      </div>
      <div class="seg" role="group" aria-label="Yüz (pilot denetimi)">
        <button
          v-for="f in faces"
          :key="f.v"
          type="button"
          :aria-pressed="pilot.face === f.v"
          @click="pilot.face = f.v"
        >
          {{ f.l }}
        </button>
      </div>
      <button
        type="button"
        class="btn"
        @click="applyTheme(pilot.theme === 'dark' ? 'light' : 'dark')"
      >
        Tema: {{ pilot.theme }}
      </button>
      <ul class="legend" aria-label="Açıklama">
        <li v-for="[l, v] in legend" :key="v">
          <span class="sw" :class="`sw-${v.slice(5)}`" />{{ l }}
        </li>
      </ul>
    </header>
    <p v-if="taskCount >= GANTT_CAP" class="warn" role="status">
      {{ taskCount }} kalem yüklendi — sunucu ilk {{ GANTT_CAP }} kalemi döndürür; liste sınıra
      ulaşmış olabilir (BE-019).
    </p>
    <p v-if="note" class="note">{{ note }}</p>
    <main class="stage"><slot /></main>
    <aside class="log" aria-live="polite">
      <div v-for="p in pilot.pending" :key="p.id" class="snack">
        <span>{{ p.text }}</span
        ><button type="button" class="btn" @click="cancelPending(p.id)">İptal et</button>
      </div>
      <ol>
        <li v-for="(l, i) in pilot.log.slice(0, 6)" :key="i">{{ l }}</li>
      </ol>
    </aside>
  </div>
</template>

<style>
html,
body {
  margin: 0;
  background: var(--bg-base);
  color: var(--ink);
  font-family: var(--font-sans);
}
.shell {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  height: 100vh;
  box-sizing: border-box;
}
.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}
.seg {
  display: inline-flex;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.seg button,
.btn {
  background: var(--bg-raised);
  color: var(--ink);
  border: 0;
  padding: var(--space-1) var(--space-3);
  font: inherit;
  cursor: pointer;
}
.btn {
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
}
.seg button[aria-pressed='true'] {
  background: var(--bg-overlay);
  color: var(--accent-text);
}
.legend {
  display: flex;
  gap: var(--space-3);
  list-style: none;
  margin: 0;
  padding: 0;
  color: var(--ink-muted);
}
.legend li {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.sw {
  display: inline-block;
  width: var(--space-3);
  height: var(--space-3);
  border-radius: var(--radius-xs);
}
.sw-todo {
  background: var(--gp-todo);
}
.sw-doing {
  background: var(--gp-doing);
}
.sw-review {
  background: var(--gp-review);
}
.sw-back {
  background: var(--gp-back);
}
.sw-done {
  background: var(--gp-done);
}
.sw-late {
  background: var(--gp-late);
}
.warn {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--bg-raised);
  color: var(--gold);
}
.note {
  margin: 0;
  color: var(--ink-muted);
}
.stage {
  flex: 1;
  min-height: 0;
  position: relative;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  overflow: hidden;
}
.log {
  color: var(--ink-muted);
  font-family: var(--font-mono);
  max-height: calc(var(--space-16) * 2);
  overflow: auto;
}
.log ol {
  margin: 0;
  padding-left: var(--space-5);
}
.snack {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  color: var(--ink);
}
</style>
