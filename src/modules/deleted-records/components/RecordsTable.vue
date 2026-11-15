<script setup lang="ts">
import { UiIcon } from '@/shared/ui'

import { deletedText } from '../model/messages'
import type { DeletedSort, SortKey } from '../model/filters'
import type { DeletedRow } from '../model/types'
import RecordRow from './RecordRow.vue'

/**
 * Silinen kayıtlar tablosu (E-12-24; 01d): `role="table"`, sütunlar tür · kayıt · silinme tarihi
 * · silen · işlemler. "Kalan süre" sütunu yoktur (saklama süresi yok; P37, BE-112). "Kayıt" ve
 * "silinme tarihi" başlıkları sunucu sıralamasını değiştirir (`sort=name|deleted_at`, `order`;
 * BE-117); etkin eksen `aria-sort` taşır. Dar ekranda tablo yatay kaydırılır (390 px; panel
 * akışta aşağıdadır).
 */
const props = defineProps<{
  rows: readonly DeletedRow[]
  selectedKey: string | null
  sort: DeletedSort
  busy: boolean
  timezone: string
  now: Date
  canRestore: boolean
  canPurge: boolean
}>()
const emit = defineEmits<{
  select: [row: DeletedRow]
  restore: [row: DeletedRow]
  purge: [row: DeletedRow]
  sort: [key: SortKey]
}>()

function ariaSort(key: SortKey): 'ascending' | 'descending' | undefined {
  if (props.sort.key !== key) return undefined
  return props.sort.order === 'asc' ? 'ascending' : 'descending'
}
</script>

<template>
  <div class="rp-dtable" data-testid="dr-table">
    <div class="rp-scroll">
      <div role="table" class="dr-grid" :aria-label="deletedText('table.label')">
        <div role="row" class="rp-tr rp-tr--head">
          <span role="columnheader">{{ deletedText('table.columns.kind') }}</span>
          <span role="columnheader" :aria-sort="ariaSort('name')">
            <button
              type="button"
              class="dr-sorth"
              data-sort="name"
              :title="deletedText('table.sortHint')"
              @click="emit('sort', 'name')"
            >
              {{ deletedText('table.columns.record') }}
              <UiIcon name="sort" size="sm" />
            </button>
          </span>
          <span role="columnheader" :aria-sort="ariaSort('deleted_at')">
            <button
              type="button"
              class="dr-sorth"
              data-sort="deleted_at"
              :title="deletedText('table.sortHint')"
              @click="emit('sort', 'deleted_at')"
            >
              {{ deletedText('table.columns.deletedAt') }}
              <UiIcon name="sort" size="sm" />
            </button>
          </span>
          <span role="columnheader">{{ deletedText('table.columns.actor') }}</span>
          <span role="columnheader"
            ><span class="dr-sr">{{ deletedText('table.columns.actions') }}</span></span
          >
        </div>
        <RecordRow
          v-for="row in rows"
          :key="row.key"
          :row="row"
          :selected="row.key === selectedKey"
          :busy="busy"
          :timezone="timezone"
          :now="now"
          :can-restore="canRestore"
          :can-purge="canPurge"
          @select="emit('select', row)"
          @restore="emit('restore', row)"
          @purge="emit('purge', row)"
        />
      </div>
    </div>
  </div>
</template>
