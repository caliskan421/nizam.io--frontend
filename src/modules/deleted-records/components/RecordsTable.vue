<script setup lang="ts">
import { UiCheck, UiIcon } from '@/shared/ui'

import { deletedText } from '../model/messages'
import type { DeletedSort, SortKey } from '../model/filters'
import type { DeletedRow } from '../model/types'
import RecordRow from './RecordRow.vue'

/**
 * Silinen kayıtlar tablosu (E-12-22/23/24; 01d): `role="table"`, sütunlar seçim · tür · kayıt ·
 * silinme tarihi · silen · işlemler (başlıkta "tümünü seç"; BE-114). "Kalan süre" sütunu yoktur (saklama süresi yok; P37, BE-112). "Kayıt" ve
 * "silinme tarihi" başlıkları sunucu sıralamasını değiştirir (`sort=name|deleted_at`, `order`;
 * BE-117); etkin eksen `aria-sort` taşır. Dar ekranda tablo yatay kaydırılır (390 px; panel
 * akışta aşağıdadır).
 */
const props = defineProps<{
  rows: readonly DeletedRow[]
  selectedKey: string | null
  /** Toplu işlem için onay kutusu işaretli kimlikler (BE-114). */
  checkedIds: ReadonlySet<string>
  allChecked: boolean
  someChecked: boolean
  sort: DeletedSort
  /** Birleşik görünümlerde sıra yalnız sunucudadır (silinme anı azalan): başlıklar pasif. */
  sortLocked?: boolean
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
  toggle: [row: DeletedRow]
  toggleAll: []
  openParent: [row: DeletedRow]
}>()

function ariaSort(key: SortKey): 'ascending' | 'descending' | undefined {
  if (props.sortLocked === true || props.sort.key !== key) return undefined
  return props.sort.order === 'asc' ? 'ascending' : 'descending'
}
</script>

<template>
  <div class="rp-dtable" data-testid="dr-table">
    <div class="rp-scroll">
      <div role="table" class="dr-grid" :aria-label="deletedText('table.label')">
        <div role="row" class="rp-tr rp-tr--head">
          <span role="columnheader" class="dr-check">
            <UiCheck
              :model-value="allChecked"
              :indeterminate="someChecked"
              :label="deletedText('bulk.selectAll')"
              data-testid="dr-select-all"
              @update:model-value="emit('toggleAll')"
            />
          </span>
          <span role="columnheader">{{ deletedText('table.columns.kind') }}</span>
          <span role="columnheader" :aria-sort="ariaSort('name')">
            <button
              v-if="!sortLocked"
              type="button"
              class="dr-sorth"
              data-sort="name"
              :title="deletedText('table.sortHint')"
              @click="emit('sort', 'name')"
            >
              {{ deletedText('table.columns.record') }}
              <UiIcon name="sort" size="sm" />
            </button>
            <template v-else>{{ deletedText('table.columns.record') }}</template>
          </span>
          <span role="columnheader" :aria-sort="ariaSort('deleted_at')">
            <button
              v-if="!sortLocked"
              type="button"
              class="dr-sorth"
              data-sort="deleted_at"
              :title="deletedText('table.sortHint')"
              @click="emit('sort', 'deleted_at')"
            >
              {{ deletedText('table.columns.deletedAt') }}
              <UiIcon name="sort" size="sm" />
            </button>
            <template v-else>{{ deletedText('table.columns.deletedAt') }}</template>
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
          :checked="checkedIds.has(row.key)"
          :busy="busy"
          :timezone="timezone"
          :now="now"
          :can-restore="canRestore"
          :can-purge="canPurge"
          @select="emit('select', row)"
          @restore="emit('restore', row)"
          @purge="emit('purge', row)"
          @toggle="emit('toggle', row)"
          @open-parent="emit('openParent', row)"
        />
      </div>
    </div>
  </div>
</template>
