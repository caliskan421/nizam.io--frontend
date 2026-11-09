<script setup lang="ts">
import './program.css'

import { computed } from 'vue'

import { useCatalogDepartments } from '@/modules/organization/public'
import { toApiError } from '@/shared/errors/api-error'
import type { ProgramOption } from '@/shared/scope/standing-facts'
import { UiBadge, UiButton, UiCard, UiErrorState, UiHint } from '@/shared/ui'

import { useTransferHistory } from '../api'
import { programText } from '../model/messages'

/**
 * Aktarım geçmişi (`listTransfers`, imleçli; P4 "Daha fazla yükle"). Program adı `['programs']`
 * listesinden, departman adı şirket kataloğundan (S1; programdan bağımsız); bulunamayan ad için
 * nötr metin (sahte ad yok). Ters aktarım rozetle işaretlenir.
 */
const props = defineProps<{ programs: readonly ProgramOption[] }>()

const history = useTransferHistory()
const catalog = useCatalogDepartments()
const dateFormat = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })

const programName = (id: string) =>
  props.programs.find((p) => p.programId === id)?.name ?? programText('history.unknownProgram')
const departmentNames = computed(
  () => new Map(catalog.departments.value.map((d) => [d.department_id, d.name])),
)
const rows = computed(() =>
  history.transfers.value.map((t) => ({
    id: t.transfer_id,
    route: programText('history.row', {
      source: programName(t.source_program_id),
      target: programName(t.target_program_id),
    }),
    department:
      departmentNames.value.get(t.department_id) ?? programText('history.unknownDepartment'),
    counts: programText('history.items', { n: t.moved_item_count, files: t.moved_file_count }),
    date: dateFormat.format(new Date(t.created_at)),
    reverse: Boolean(t.reverses_transfer_id),
  })),
)
const error = computed(() =>
  history.query.isError.value && rows.value.length === 0
    ? toApiError(history.query.error.value)
    : null,
)
</script>

<template>
  <UiCard class="pg-card" :title="programText('history.title')" data-testid="pg-history">
    <UiErrorState
      v-if="error"
      :error="error"
      :title="programText('history.loadError')"
      retryable
      :retrying="history.query.isFetching.value"
      @retry="history.query.refetch()"
    />
    <UiHint v-else-if="history.query.isPending.value">
      {{ programText('history.loading') }}
    </UiHint>
    <UiHint v-else-if="rows.length === 0">{{ programText('history.empty') }}</UiHint>
    <ul v-else class="pg-list">
      <li v-for="row in rows" :key="row.id" class="pg-list__row" :data-transfer="row.id">
        <div class="pg-list__main">
          <span class="pg-list__name rp-trunc">{{ row.route }}</span>
          <span class="pg-cap">{{ row.department }} · {{ row.counts }}</span>
        </div>
        <UiBadge v-if="row.reverse" tone="gold">{{ programText('history.reverse') }}</UiBadge>
        <span class="pg-cap">{{ row.date }}</span>
      </li>
    </ul>
    <div v-if="history.query.hasNextPage.value" class="pg-actions">
      <UiButton
        size="sm"
        :disabled="history.query.isFetchingNextPage.value"
        @click="history.query.fetchNextPage()"
      >
        {{ programText('history.more') }}
      </UiButton>
    </div>
  </UiCard>
</template>
