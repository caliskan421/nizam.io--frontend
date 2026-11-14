<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { TIMELINE_ROUTE } from '@/modules/timeline/public'
import type { ApiError } from '@/shared/errors/api-error'
import { UiErrorState, UiIcon } from '@/shared/ui'

import { homeText } from '../../model/messages'
import type { RoleLoadScope } from '../../model/role/common'
import type { UnitSummary } from '../../model/k1/summary'
import { tasksLocation } from '../../model/role/links'
import ScopeNote from './ScopeNote.vue'

/**
 * Birim satırı + "Birim özeti" şeridi (E-K1-05…13). Altı kutu tek yüklemden: açık / geciken /
 * onay bekleyen / iade sunucu sayaçları; atanmamış istemci türetimi (küme tam değilse "≥",
 * P4). Kutu tıklaması 03'ü `durum` süzgeciyle (03c: tarih talebi) açar. "Birimim →" F6 dışı:
 * açıklamalı devre dışı (`designStub` yok; faz ertelemesi). Bölge hatası bölge içinde.
 */
const props = defineProps<{
  unit: string
  summary: UnitSummary | null
  loading?: boolean
  error?: Pick<ApiError, 'messageKey' | 'requestId'> | null
  retrying?: boolean
  /** Kısmi yükleme (`null` = tam): "ilk N görev" etiketi + devam/yeniden deneme (CX-F6-E-03). */
  scope?: RoleLoadScope | null
  loaded?: number
}>()
const emit = defineEmits<{ retry: []; more: [] }>()

interface Cell {
  key: 'open' | 'overdue' | 'pending' | 'returned' | 'unassigned' | 'dateRequests'
  value: string
  note: string
  danger: boolean
  to: object
}

const cells = computed<Cell[]>(() => {
  const s = props.summary
  if (!s) return []
  const returnedNote =
    s.returnedNote.kind === 'none'
      ? homeText('home.k1.notes.none')
      : s.returnedNote.kind === 'one' && s.returnedNote.names.length > 0
        ? s.returnedNote.names.join(', ')
        : homeText('home.k1.notes.returnedMany', { n: s.returned })
  const longest =
    s.longestOverdue === null
      ? homeText('home.k1.notes.none')
      : homeText(s.partial ? 'home.k1.notes.longestAtLeast' : 'home.k1.notes.longest', {
          n: s.longestOverdue,
        })
  return [
    {
      key: 'open',
      value: String(s.open),
      note: homeText('home.k1.notes.open', { doing: s.doing, todo: s.notStarted }),
      danger: false,
      to: tasksLocation(),
    },
    {
      key: 'overdue',
      value: String(s.overdue),
      note: longest,
      danger: true,
      to: tasksLocation('geciken'),
    },
    {
      key: 'pending',
      value: String(s.pending),
      note: homeText('home.k1.notes.pending'),
      danger: false,
      to: tasksLocation('onaya_sunuldu'),
    },
    {
      key: 'returned',
      value: String(s.returned),
      note: returnedNote,
      danger: false,
      to: tasksLocation('iade_edildi'),
    },
    {
      key: 'unassigned',
      value: s.partial ? `≥${s.unassigned}` : String(s.unassigned),
      note: homeText('home.k1.notes.unassigned'),
      danger: false,
      to: tasksLocation(),
    },
    {
      key: 'dateRequests',
      value: String(s.dateRequests),
      note: homeText('home.k1.notes.dateRequests'),
      danger: false,
      to: { path: TIMELINE_ROUTE.path },
    },
  ]
})
</script>

<template>
  <div class="rh-top" data-region="unit">
    <div class="rh-top-row">
      <p class="rh-kicker" data-testid="k1-kicker">
        {{ homeText('home.k1.kicker', { unit, n: summary?.total ?? '…' }) }}
      </p>
      <span
        class="rh-link"
        aria-disabled="true"
        :title="homeText('home.k1.later')"
        data-testid="k1-unit-link"
      >
        {{ homeText('home.k1.unitLink') }}
        <UiIcon name="arrow-right" size="sm" />
      </span>
    </div>
    <UiErrorState
      v-if="error"
      :error="error"
      :title="homeText('home.k1.error')"
      retryable
      :retrying="retrying"
      @retry="emit('retry')"
    />
    <section
      v-else
      class="rh-strip"
      :aria-label="homeText('home.k1.region')"
      :aria-busy="loading || !summary ? 'true' : undefined"
    >
      <template v-if="summary && !loading">
        <RouterLink
          v-for="cell in cells"
          :key="cell.key"
          class="rh-kpi"
          :to="cell.to"
          :data-cell="cell.key"
        >
          <p class="rh-kicker rh-trunc">{{ homeText(`home.k1.cells.${cell.key}`) }}</p>
          <p class="rh-num rh-kpi__value" :class="{ 'rh-danger': cell.danger }" data-value>
            {{ cell.value }}
          </p>
          <p class="rh-cap rh-trunc">{{ cell.note }}</p>
        </RouterLink>
      </template>
      <template v-else>
        <div v-for="n in 6" :key="n" class="rh-kpi" data-skeleton>
          <span class="rh-skel" />
          <span class="rh-skel" />
        </div>
      </template>
    </section>
    <!-- Kapsam etiketi + devam/yeniden deneme sayaç başarısından BAĞIMSIZ (CX-F6-E-07). -->
    <template v-if="scope || (summary?.partial && !loading && !error)">
      <ScopeNote
        v-if="scope"
        :scope="scope"
        :loaded="loaded ?? 0"
        data-partial
        @more="emit('more')"
      />
      <p v-else class="rh-cap" data-partial>{{ homeText('home.k1.partial') }}</p>
    </template>
  </div>
</template>
