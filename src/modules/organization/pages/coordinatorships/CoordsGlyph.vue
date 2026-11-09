<script setup lang="ts">
/**
 * 08 tasarımına özgü çizgi simgeleri (Koordinatorlukler.dc.html yol verileri): ortak simge
 * kümesinde (`shared/ui/icons.ts`) karşılığı olmayanlar. Görünüm `t-icon` sınıfından (ortak
 * stil); süs simgesidir — erişim adı simgeyi taşıyan denetimde durur.
 */
const PATHS = {
  branch:
    'M6 3v12M18 9v12M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM18 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 15c0-4 12-2 12-6',
  'user-x': 'M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM3 21a7 7 0 0 1 13-3.5M16 16l5 5M21 16l-5 5',
  'user-alone': 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0',
  'list-off': 'M4 6l1.5 1.5L8 5M11 6h9M4 12h16M4 18h16',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  chevron: 'M9 6l6 6-6 6',
} as const

export type CoordsGlyphName = keyof typeof PATHS

defineProps<{ name: CoordsGlyphName }>()
</script>

<template>
  <svg class="t-icon t-icon--sm" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path :d="PATHS[name]" />
  </svg>
</template>
