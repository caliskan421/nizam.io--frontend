<script setup lang="ts">
import { computed } from 'vue'

import { UiCard, UiIcon } from '@/shared/ui'

import { formatClock, formatDate } from '../model/format'
import { deletedText } from '../model/messages'
import type { DeletedRow } from '../model/types'
import RowParent from './RowParent.vue'

/**
 * Seçili kayıt paneli (E-12-41…54). Alanlar YALNIZ liste öğesinden gelir; satır başına ayrıntı
 * okuması yoktur (silinmiş görevde `getWorkItem` 409 `work.item_deleted`). Görevde atananlar,
 * durum yüzdesi ve "birlikte geri gelecek" (alt görev, kanıt dosyası, yorum, tarih talebi) liste
 * öğesinden dolar (BE-113); kalıcı silinme tarihi yoktur (BE-112), DOM'da çizilmez.
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
const emit = defineEmits<{ restore: []; purge: []; openParent: [] }>()

const kindKey = computed(() => props.row?.kind ?? 'unknown')
const title = computed(() => props.row?.title || deletedText('row.untitled'))
const writable = computed(() => props.row?.kind != null)
/** Çocuk türlerin liste öğesinden gelen alanları (etiket + değer; evet/hayır çevrilir). */
const facts = computed(() =>
  (props.row?.facts ?? []).map((fact) => ({
    label: deletedText(`panel.facts.${fact.label as 'size'}`),
    value:
      fact.value === 'yes' || fact.value === 'no'
        ? deletedText(`panel.facts.${fact.value}`)
        : fact.value,
  })),
)

const STATUS = ['baslanmadi', 'devam_ediyor', 'onaya_sunuldu', 'iade_edildi', 'tamamlandi'] as const
const statusLabel = computed(() => {
  const status = props.row?.status
  if (!status) return null
  const known = (STATUS as readonly string[]).includes(status)
  // Bilinmeyen değer nötr gösterilir (şemada düz string).
  const name = known ? deletedText(`panel.status.${status as (typeof STATUS)[number]}`) : status
  const progress = props.row?.task?.progress ?? null
  return progress === null ? name : `${name} · %${progress}`
})
const assignees = computed(() =>
  (props.row?.task?.assignees ?? []).map((name) => name || deletedText('panel.unknownAssignee')),
)
/** "Birlikte geri gelecek" satırları (görev): geri yüklenince dönecek sayılar. */
const together = computed(() => {
  const row = props.row
  if (!row?.task) return []
  return [
    { id: 'subtasks', icon: 'list', n: row.task.subtasks },
    { id: 'files', icon: 'file', n: row.fileCount ?? 0 },
    { id: 'notes', icon: 'messages', n: row.task.notes },
    { id: 'dateRequest', icon: 'calendar', n: row.task.dateRequest ? 1 : 0 },
  ] as const
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
        <span class="dr-logtype" :data-kind="kindKey">{{
          deletedText(`rowKinds.${kindKey}`)
        }}</span>
      </div>
      <h2 class="dr-card__title">
        <span v-if="row.code" class="dr-code">{{ row.code }}</span>
        {{ title }}
      </h2>
      <p v-if="row.subLine" class="rp-cap">{{ row.subLine }}</p>
      <p v-if="!writable" class="rp-cap">{{ deletedText('row.unknownKind') }}</p>
      <RowParent :row="row" @open="emit('openParent')" />
      <dl class="rp-dl">
        <dt>{{ deletedText('panel.fields.actor') }}</dt>
        <dd>{{ row.actor.name || deletedText('table.unknownActor') }}</dd>
        <template v-if="deletedAt">
          <dt>{{ deletedText('panel.fields.deletedAt') }}</dt>
          <dd class="dr-mono">{{ deletedAt }}</dd>
        </template>
        <template v-if="statusLabel">
          <dt>{{ deletedText('panel.fields.status') }}</dt>
          <dd>{{ statusLabel }}</dd>
        </template>
        <template v-if="assignees.length">
          <dt>{{ deletedText('panel.fields.assignees') }}</dt>
          <dd data-testid="dr-assignees">{{ assignees.join(', ') }}</dd>
        </template>
        <template v-if="row.place">
          <dt>{{ deletedText('panel.fields.place') }}</dt>
          <dd>{{ row.place }}</dd>
        </template>
        <template v-if="invite">
          <dt>{{ deletedText('panel.fields.invite') }}</dt>
          <dd>{{ invite }}</dd>
        </template>
        <template
          v-if="(row.kind === 'meetings' || row.kind === 'accounts') && row.departmentNames.length"
        >
          <dt>{{ deletedText('panel.fields.departments') }}</dt>
          <dd>{{ row.departmentNames.join(', ') }}</dd>
        </template>
        <template v-if="row.companyAdmin">
          <dt>{{ deletedText('panel.fields.admin') }}</dt>
          <dd>{{ deletedText('panel.adminValue') }}</dd>
        </template>
        <template v-for="fact in facts" :key="fact.label">
          <dt>{{ fact.label }}</dt>
          <dd>{{ fact.value }}</dd>
        </template>
        <template v-if="row.departmentKind">
          <dt>{{ deletedText('panel.fields.kind') }}</dt>
          <dd>{{ row.departmentKind }}</dd>
        </template>
        <template v-if="row.kind === 'departments' && row.code">
          <dt>{{ deletedText('panel.fields.code') }}</dt>
          <dd class="dr-mono">{{ row.code }}</dd>
        </template>
      </dl>
      <template v-if="together.length">
        <p class="dr-kicker dr-together">{{ deletedText('panel.together') }}</p>
        <ul class="dr-linked">
          <li v-for="line in together" :key="line.id" :data-linked="line.id">
            <UiIcon :name="line.icon" size="sm" />{{ deletedText(`panel.${line.id}`)
            }}<span class="rp-count">{{ line.n }}</span>
          </li>
        </ul>
      </template>
      <div class="dr-card__actions">
        <button
          v-if="canRestore && writable"
          type="button"
          class="t-btn t-btn--primary t-btn--sm"
          :aria-disabled="busy ? 'true' : undefined"
          data-action="restore"
          @click="act('restore')"
        >
          <UiIcon name="undo" size="sm" />{{ deletedText('row.restore') }}
        </button>
        <button
          v-if="canPurge && writable"
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
