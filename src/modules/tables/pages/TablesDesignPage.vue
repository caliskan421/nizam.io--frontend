<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import {
  DEFAULT_PREVIEW,
  designPreviews,
  renderDesignPreview,
  type DesignPreviewKey,
} from '../design-preview/catalog'
import { TABLE_DESIGN_ROUTE, TABLES_ROUTE } from '../routes'

import './tables.css'

const route = useRoute()
const host = ref<HTMLElement | null>(null)
const selected = computed(() => {
  const key = route.query.ornek
  return typeof key === 'string' && Object.hasOwn(designPreviews, key)
    ? (key as DesignPreviewKey)
    : DEFAULT_PREVIEW
})

watch(
  [host, selected],
  ([element, key], _, clean) => {
    if (!element) return
    const stop = renderDesignPreview(element, key)
    clean(() => stop?.())
  },
  { flush: 'post' },
)
</script>

<template>
  <section class="tables-page" aria-labelledby="tables-design-title">
    <header class="tables-head">
      <div>
        <RouterLink class="tables-link" :to="{ name: TABLES_ROUTE.name }">← Tablolar</RouterLink>
        <h1 id="tables-design-title">Tasarım önizlemesi</h1>
      </div>
    </header>
    <p>Önizlemeler örnek verilerle çalışır. Buradaki işlemler uygulama tablolarına yansımaz.</p>
    <nav class="tables-segment" aria-label="Tablo tasarımları">
      <RouterLink
        v-for="(preview, key) in designPreviews"
        :key="key"
        :to="{ name: TABLE_DESIGN_ROUTE.name, query: { ornek: key } }"
        :aria-current="selected === key ? 'page' : undefined"
      >
        {{ preview.title }}
      </RouterLink>
    </nav>
    <div ref="host" class="tables-preview-host"></div>
  </section>
</template>

<style scoped>
.tables-preview-host {
  display: block;
  min-width: 0;
  overflow: auto;
  border: var(--ui-hairline) solid var(--border-subtle);
  border-radius: var(--radius-md);
}
</style>
