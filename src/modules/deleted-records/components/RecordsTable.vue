<script setup lang="ts">
import { DesignStub, UiIcon } from '@/shared/ui'

import { deletedText } from '../model/messages'
import type { DeletedRow } from '../model/types'
import RecordRow from './RecordRow.vue'

/**
 * Silinen kayıtlar tablosu (E-12-24; 01d): `role="table"`, sütunlar tür · kayıt · silinme tarihi
 * · silen · işlemler. Seçim kutuları, "tümünü seç" ve "kalan süre" sütunu yoktur (toplu uç ve
 * saklama süresi yok; P36/P37, BE-114, BE-112). Sıralama başlığı yalnız varsayılanı gösterir
 * ("en yeni üstte", `aria-sort="descending"`); ters çevirme devre dışı statik (BE-117). Dar
 * ekranda tablo yatay kaydırılır (390 px; panel akışta aşağıdadır).
 */
defineProps<{
  rows: readonly DeletedRow[]
  selectedKey: string | null
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
}>()
</script>

<template>
  <div class="rp-dtable" data-testid="dr-table">
    <div class="rp-scroll">
      <div role="table" class="dr-grid" :aria-label="deletedText('table.label')">
        <div role="row" class="rp-tr rp-tr--head">
          <span role="columnheader">{{ deletedText('table.columns.kind') }}</span>
          <span role="columnheader">{{ deletedText('table.columns.record') }}</span>
          <span role="columnheader" aria-sort="descending">
            <DesignStub id="BE-117">
              <button
                type="button"
                class="dr-sorth"
                aria-disabled="true"
                :title="deletedText('table.sortHint')"
              >
                {{ deletedText('table.columns.deletedAt') }}
                <UiIcon name="sort" size="sm" />
              </button>
            </DesignStub>
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
