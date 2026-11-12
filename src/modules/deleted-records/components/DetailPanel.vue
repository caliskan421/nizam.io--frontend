<script setup lang="ts">
import { computed } from 'vue'

import { UiCard, UiIcon } from '@/shared/ui'

import { formatClock, formatDate } from '../model/format'
import { deletedText } from '../model/messages'
import type { DeletedRow } from '../model/types'

/**
 * Seçili kayıt paneli (E-12-41…54). Alanlar YALNIZ liste öğesinden gelir; satır başına ayrıntı
 * okuması yoktur (silinmiş görevde `getWorkItem` 409 `work.item_deleted`). Veri olmayan satır
 * (atananlar, ilerleme %, kalıcı silinme tarihi, alt görev/yorum/tarih talebi sayıları)
 * DOM'da yoktur (BE-113, BE-112); "birlikte geri gelecek" yalnız görevde `file_count` ile canlıdır.
 */
const props = defineProps<{
  row: DeletedRow | null
  /** `kayit` URL'de var ama yüklenen sayfalarda yok. */
  missing: boolean
  busy: boolean
  timezone: string
  canRestore: boolean
  canPurge: boolean
}>()
const emit = defineEmits<{ restore: []; purge: [] }>()

const STATUS = ['baslanmadi', 'devam_ediyor', 'onaya_sunuldu', 'iade_edildi', 'tamamlandi'] as const
const statusLabel = computed(() => {
  const status = props.row?.status
  if (!status) return null
  const known = (STATUS as readonly string[]).includes(status)
  // Bilinmeyen değer nötr gösterilir (şemada düz string).
  return known ? deletedText(`panel.status.${status as (typeof STATUS)[number]}`) : status
})
const deletedAt = computed(() => {
  const date = formatDate(props.row?.deletedAt, props.timezone)
  return date ? `${date} · ${formatClock(props.row?.deletedAt, props.timezone)}` : null
})
const invite = computed(() => {
  const mode = props.row?.inviteMode
  if (mode === 'coordinatorship') return deletedText('panel.invite.coordinatorship')
  if (mode === 'person') return deletedText('panel.invite.person')
  return null
})
function act(action: 'restore' | 'purge'): void {
  if (props.busy) return
  if (action === 'restore') emit('restore')
  else emit('purge')
}
</script>

<template>
  <UiCard class="dr-card" data-testid="dr-panel">
    <template v-if="row">
      <div class="dr-card__head">
        <span class="dr-kicker">{{ deletedText('panel.title') }}</span>
        <span class="dr-logtype" :data-kind="row.kind">{{ deletedText(`kinds.${row.kind}`) }}</span>
      </div>
      <h2 class="dr-card__title">
        <span v-if="row.code" class="dr-code">{{ row.code }}</span>
        {{ row.title }}
      </h2>
      <p v-if="row.subLine" class="rp-cap">{{ row.subLine }}</p>
      <dl class="rp-dl">
        <template v-if="row.actor">
          <dt>{{ deletedText('panel.fields.actor') }}</dt>
          <dd>{{ row.actor.name || deletedText('table.unknownActor') }}</dd>
        </template>
        <template v-if="deletedAt">
          <dt>{{ deletedText('panel.fields.deletedAt') }}</dt>
          <dd class="dr-mono">{{ deletedAt }}</dd>
        </template>
        <template v-if="statusLabel">
          <dt>{{ deletedText('panel.fields.status') }}</dt>
          <dd>{{ statusLabel }}</dd>
        </template>
        <template v-if="row.place">
          <dt>{{ deletedText('panel.fields.place') }}</dt>
          <dd>{{ row.place }}</dd>
        </template>
        <template v-if="invite">
          <dt>{{ deletedText('panel.fields.invite') }}</dt>
          <dd>{{ invite }}</dd>
        </template>
        <template v-if="row.kind === 'toplanti' && row.departmentNames.length">
          <dt>{{ deletedText('panel.fields.departments') }}</dt>
          <dd>{{ row.departmentNames.join(', ') }}</dd>
        </template>
        <template v-if="row.departmentKind">
          <dt>{{ deletedText('panel.fields.kind') }}</dt>
          <dd>{{ row.departmentKind }}</dd>
        </template>
        <template v-if="row.kind === 'koordinatorluk' && row.code">
          <dt>{{ deletedText('panel.fields.code') }}</dt>
          <dd class="dr-mono">{{ row.code }}</dd>
        </template>
      </dl>
      <template v-if="row.fileCount !== null">
        <p class="dr-kicker dr-together">{{ deletedText('panel.together') }}</p>
        <ul class="dr-linked">
          <li>
            <UiIcon name="file" size="sm" />{{ deletedText('panel.files')
            }}<span class="rp-count">{{ row.fileCount }}</span>
          </li>
        </ul>
      </template>
      <div class="dr-card__actions">
        <button
          v-if="canRestore"
          type="button"
          class="t-btn t-btn--primary t-btn--sm"
          :aria-disabled="busy ? 'true' : undefined"
          data-action="restore"
          @click="act('restore')"
        >
          <UiIcon name="undo" size="sm" />{{ deletedText('row.restore') }}
        </button>
        <button
          v-if="canPurge"
          type="button"
          class="t-btn t-btn--ghost t-btn--sm dr-danger"
          :aria-disabled="busy ? 'true' : undefined"
          data-action="purge"
          @click="act('purge')"
        >
          {{ deletedText('row.purge') }}
        </button>
      </div>
    </template>
    <template v-else>
      <div class="dr-card__head">
        <span class="dr-kicker">{{ deletedText('panel.title') }}</span>
      </div>
      <p class="rp-cap" role="status">
        {{ missing ? deletedText('panel.missing') : deletedText('panel.empty') }}
      </p>
    </template>
  </UiCard>
</template>
