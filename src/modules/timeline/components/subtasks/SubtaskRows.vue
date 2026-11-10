<script setup lang="ts">
import './subtasks.css'

import { toApiError } from '@/shared/errors/api-error'
import { UiErrorState, UiIcon } from '@/shared/ui'

import type { SubtaskRowsProps } from '../index'
import { subtaskText } from './messages'
import { subtaskDateLabel } from './subtask-format'
import { useSubtaskSummary } from './use-subtask-summary'

/**
 * 03d açılmış satırın alt görev satırları (E-03C-33, 48…53). Kapalıyken HİÇBİR şey çizmez ve
 * istek atmaz (K3, E-03C-73). Açılınca o görev için tek `listWorkItemSubtasks` (görevin kendi
 * kapsamıyla): ağaç çizgisi (48), durum dairesi (49, salt okuma), başlık (50; biten üstü çizili),
 * tarih yazısı (52) ya da "Tarih yok" (53). Tarihli alt görev için ince çubuk/elmas ÇİZİLMEZ
 * (E-03C-45/51; ADR-0024: Gantt yanıtında yok, §4 sahte çubuk yok). Satırlar üst `treegrid`in
 * `aria-level=2` çocuklarıdır; iki sütun (etiket + iz) üst ızgaradan `--tl-label-col` /
 * `--tl-track-col` ile gelir, yoksa makul varsayılan.
 */
const props = defineProps<SubtaskRowsProps>()

const { query, subtasks } = useSubtaskSummary(() => props)
</script>

<template>
  <div
    v-if="open"
    class="tl-subs"
    role="rowgroup"
    :aria-busy="query.isPending.value ? 'true' : 'false'"
    data-testid="subtask-rows"
  >
    <div v-if="query.isPending.value" class="tl-sub" role="row" aria-level="2">
      <div class="tl-sub__label tl-sub__label--span" role="gridcell" aria-colspan="2">
        <span class="tl-sub__note" role="status">{{ subtaskText('loading') }}</span>
      </div>
    </div>
    <div v-else-if="query.isError.value" class="tl-sub" role="row" aria-level="2">
      <div class="tl-sub__label tl-sub__label--span" role="gridcell" aria-colspan="2">
        <UiErrorState
          :error="toApiError(query.error.value)"
          retryable
          :retrying="query.isFetching.value"
          @retry="query.refetch()"
        />
      </div>
    </div>
    <div v-else-if="subtasks.length === 0" class="tl-sub" role="row" aria-level="2">
      <div class="tl-sub__label tl-sub__label--span" role="gridcell" aria-colspan="2">
        <span class="tl-sub__note" data-testid="subtask-empty">{{ subtaskText('empty') }}</span>
      </div>
    </div>
    <template v-else>
      <div
        v-for="(subtask, index) in subtasks"
        :key="subtask.subtask_id"
        class="tl-sub"
        role="row"
        aria-level="2"
        data-testid="subtask-row"
      >
        <div class="tl-sub__label" role="gridcell">
          <span
            class="tl-sub__tree"
            :class="{ 'tl-sub__tree--last': index === subtasks.length - 1 }"
            aria-hidden="true"
          />
          <span
            class="tl-sub__state"
            :class="{ 'tl-sub__state--done': subtask.done }"
            role="img"
            :aria-label="subtaskText(subtask.done ? 'statusDone' : 'statusOpen')"
            data-testid="subtask-state"
          >
            <UiIcon v-if="subtask.done" name="check" size="sm" bold />
          </span>
          <span
            class="tl-sub__title"
            :class="{ 'tl-sub__title--done': subtask.done }"
            data-testid="subtask-title"
          >
            {{ subtask.title }}
          </span>
        </div>
        <div class="tl-sub__track" role="gridcell">
          <span v-if="subtaskDateLabel(subtask)" class="tl-sub__date" data-testid="subtask-date">
            {{ subtaskDateLabel(subtask) }}
          </span>
          <span v-else class="tl-sub__nodate" data-testid="subtask-nodate">
            {{ subtaskText('noDate') }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
