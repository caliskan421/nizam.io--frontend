<script setup lang="ts">
import { computed } from 'vue'

import { UiAvatar, UiIcon } from '@/shared/ui'

import { formatClock, formatDate, formatLong, isToday } from '../model/format'
import { deletedText } from '../model/messages'
import type { DeletedRow } from '../model/types'

/**
 * Tablo satırı (E-12-24…37; 01d). Tür rozeti, kayıt (kod + başlık + alt satır), silinme tarihi
 * (gg.aa.yyyy + SS:DD + "bugün"), silen (yalnız toplantıda dolu; diğerlerinde "—") ve işlemler.
 * Seçim kutusu, uyarı rozeti ve kalan süre yoktur (toplu uç ve saklama süresi yok; P36/P37).
 * Tıklama ya da Enter/Boşluk satırı seçer; ↑/↓ komşu satıra geçer. Uçuşta eylem düğmeleri
 * `aria-disabled` olur (odak kaybolmaz).
 */
const props = defineProps<{
  row: DeletedRow
  selected: boolean
  busy: boolean
  timezone: string
  now: Date
  canRestore: boolean
  canPurge: boolean
}>()
const emit = defineEmits<{ select: []; restore: []; purge: [] }>()

const date = computed(() => formatDate(props.row.deletedAt, props.timezone))
const clock = computed(() => formatClock(props.row.deletedAt, props.timezone))
const today = computed(() => isToday(props.row.deletedAt, props.now, props.timezone))
const long = computed(() => formatLong(props.row.deletedAt, props.timezone) ?? undefined)
const actorName = computed(() =>
  props.row.actor ? props.row.actor.name || deletedText('table.unknownActor') : null,
)

function onKeydown(event: KeyboardEvent): void {
  if (event.target !== event.currentTarget) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('select')
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    const el = event.currentTarget as HTMLElement
    const next = event.key === 'ArrowDown' ? el.nextElementSibling : el.previousElementSibling
    if (next instanceof HTMLElement && next.dataset.recordKey) {
      event.preventDefault()
      next.focus()
    }
  }
}
function act(action: 'restore' | 'purge'): void {
  if (props.busy) return
  if (action === 'restore') emit('restore')
  else emit('purge')
}
</script>

<template>
  <div
    role="row"
    class="rp-tr rp-tr--body"
    :class="{ 'rp-sel': selected }"
    tabindex="0"
    :aria-current="selected ? 'true' : undefined"
    :data-record-key="row.key"
    :data-kind="row.kind"
    @click="emit('select')"
    @keydown="onKeydown"
  >
    <span role="cell">
      <span class="dr-logtype" :data-kind="row.kind">{{ deletedText(`kinds.${row.kind}`) }}</span>
    </span>
    <span role="cell" class="dr-record">
      <span class="dr-record__line">
        <span v-if="row.code" class="dr-code">{{ row.code }}</span>
        <span class="dr-title rp-trunc">{{ row.title }}</span>
      </span>
      <span v-if="row.subLine" class="rp-cap rp-trunc">{{ row.subLine }}</span>
    </span>
    <span role="cell" class="dr-dt" :title="long">
      <template v-if="date">
        <span class="dr-dt__d"
          >{{ date
          }}<span v-if="today" class="dr-today">{{ deletedText('table.today') }}</span></span
        >
        <span class="dr-dt__t">{{ clock }}</span>
      </template>
      <span v-else class="dr-faint">{{ deletedText('table.none') }}</span>
    </span>
    <span role="cell" class="dr-actor">
      <template v-if="actorName">
        <UiAvatar v-if="row.actor?.name" :name="row.actor.name" size="sm" />
        <span class="rp-trunc">{{ actorName }}</span>
      </template>
      <span v-else class="dr-faint">{{ deletedText('table.none') }}</span>
    </span>
    <span role="cell" class="dr-rowact">
      <button
        v-if="canRestore"
        type="button"
        class="t-btn t-btn--secondary t-btn--sm"
        :aria-disabled="busy ? 'true' : undefined"
        data-action="restore"
        @click.stop="act('restore')"
      >
        {{ deletedText('row.restore') }}
      </button>
      <button
        v-if="canPurge"
        type="button"
        class="t-iconbtn dr-danger"
        :aria-label="deletedText('row.purgeOf', { title: row.title })"
        :title="deletedText('row.purge')"
        :aria-disabled="busy ? 'true' : undefined"
        data-action="purge"
        @click.stop="act('purge')"
      >
        <UiIcon name="trash" size="sm" />
      </button>
    </span>
  </div>
</template>
