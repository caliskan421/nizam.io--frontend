<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { UiButton } from '@/shared/ui'

import { useMemoryQueries } from '../model/queries'

const props = defineProps<{ title: string; department: string }>()
const selected = defineModel<string[]>({ required: true })
const queries = useMemoryQueries()
const settled = ref('')
watch(
  () => [props.title, props.department],
  ([title], _, cleanup) => {
    settled.value = ''
    selected.value = []
    const timer = setTimeout(() => {
      settled.value = title ?? ''
    }, 300)
    cleanup(() => clearTimeout(timer))
  },
  { immediate: true },
)
const results = queries.related(
  () => settled.value.slice(0, 200),
  () => props.department,
)
const matches = computed(() => (results.isError.value ? [] : (results.data.value?.items ?? [])))
function toggle(id: string) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((entry) => entry !== id)
    : [...selected.value, id].slice(0, 3)
}
</script>

<template>
  <section
    v-if="matches.length"
    class="t-card wf-memory-suggestions"
    aria-label="Hafızada ilgili deneyimler"
  >
    <strong>Hafızada {{ matches.length }} ilgili deneyim</strong>
    <ul>
      <li v-for="item in matches" :key="item.id">
        <strong>{{ item.title }}</strong>
        <p>{{ item.suggestion || item.impact }}</p>
        <UiButton size="sm" :aria-pressed="selected.includes(item.id)" @click="toggle(item.id)">
          {{ selected.includes(item.id) ? 'Ekleme seçildi' : 'Göreve not olarak ekle' }}
        </UiButton>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.wf-memory-suggestions {
  padding: var(--space-4);
  overflow-wrap: anywhere;
}
.wf-memory-suggestions ul {
  margin-block-end: 0;
  padding-inline-start: var(--space-5);
}
.wf-memory-suggestions li + li {
  margin-block-start: var(--space-3);
}
.wf-memory-suggestions p {
  margin-block: var(--space-1);
}
</style>
