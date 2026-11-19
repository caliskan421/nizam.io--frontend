<script setup lang="ts">
import { computed, ref } from 'vue'

import { UiEmptyState, UiIcon } from '@/shared/ui'

import type { TableSummary } from '../model/types'
import { TABLE_ROUTE } from '../routes'

const props = defineProps<{
  items: TableSummary[]
  accountId: string | null
  unit: boolean
  hasNext: boolean
}>()

const filters = { all: 'Tümü', own: 'Oluşturduklarım', shared: 'Benimle paylaşılanlar' } as const
type Filter = keyof typeof filters
const filter = ref<Filter>('all')
const search = ref('')
const text = computed(() => search.value.trim().toLocaleLowerCase('tr'))
const filtering = computed(() => Boolean(text.value) || filter.value !== 'all')
const visible = computed(() =>
  props.items.filter((item) => {
    const owner = item.owner_id === props.accountId
    if (filter.value === 'own' && !owner) return false
    if (filter.value === 'shared' && owner) return false
    return item.name.toLocaleLowerCase('tr').includes(text.value)
  }),
)
</script>

<template>
  <section class="tables-catalog-section" aria-labelledby="tables-catalog-title">
    <h2 id="tables-catalog-title">Tablolar</h2>
    <div class="tables-catalog-controls">
      <div class="tables-segment" role="group" aria-label="Tablo filtresi">
        <button
          v-for="(label, value) in filters"
          :key="value"
          type="button"
          :disabled="value !== 'all' && !accountId"
          :aria-pressed="filter === value"
          @click="filter = value"
        >
          {{ label }}
        </button>
      </div>
      <label class="tables-field">
        Tablo ara
        <input v-model="search" class="t-input" type="search" />
      </label>
    </div>
    <UiEmptyState
      v-if="!visible.length"
      :title="
        hasNext
          ? 'Yüklenen tablolarda eşleşme yok'
          : filtering
            ? 'Bu filtrede tablo yok'
            : 'Henüz tablo yok'
      "
      :text="hasNext ? 'Aramaya devam etmek için daha fazla tablo yükleyin.' : undefined"
      icon="sheets"
    />
    <ul v-else class="tables-cards">
      <li v-for="item in visible" :key="item.id">
        <RouterLink
          class="t-card tables-card"
          :to="{
            name: TABLE_ROUTE.name,
            params: { tableId: item.id },
            query: unit ? { alan: 'birim' } : {},
          }"
        >
          <span class="tables-card-icon"><UiIcon name="sheets" /></span>
          <span class="tables-card-details">
            <strong>{{ item.name }}</strong>
            <span v-if="item.owner_id === accountId" class="tables-chip">Sahip</span>
            <span v-if="item.is_template" class="tables-chip">Şablon</span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
