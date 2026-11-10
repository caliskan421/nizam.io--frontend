<script setup lang="ts">
import { UiButton, UiErrorState, UiField, UiModal, UiSelect } from '@/shared/ui'
import { toApiError } from '@/shared/errors/api-error'

import type { GanttTask } from '../../model/types'
import { panelText } from './messages'
import { useDependencyDialog } from './use-dependency-dialog'

/**
 * E-03C-66 — "Bağımlılık ekle" / "Bağımlılığı kaldır" (Admin + Koordinatör; çizilmemiş, P3:
 * `shared/ui` penceresi). Yalnız açıkken bağlanır (üst bileşen `v-if`): kapalıyken bağımlılık
 * okuması yoktur.
 */
const props = defineProps<{ mode: 'add' | 'remove'; task: GanttTask }>()
const open = defineModel<boolean>('open', { default: false })

const dlg = useDependencyDialog(
  () => props.task,
  () => (open.value = false),
)
const formId = 'tp-dependency-form'
</script>

<template>
  <UiModal
    v-model:open="open"
    :title="panelText(mode === 'add' ? 'dependency.addTitle' : 'dependency.removeTitle')"
    :description="
      panelText(mode === 'add' ? 'dependency.addDescription' : 'dependency.removeDescription')
    "
    :dismissible="!dlg.busy.value"
  >
    <form
      v-if="mode === 'add'"
      :id="formId"
      class="tp-form"
      novalidate
      @submit.prevent="dlg.submitAdd"
    >
      <UiField :label="panelText('dependency.predecessor')">
        <UiSelect
          v-model="dlg.selected.value"
          name="predecessor"
          :options="dlg.candidates.value"
          :placeholder="panelText('dependency.predecessorPlaceholder')"
        />
      </UiField>
      <p v-if="dlg.candidates.value.length === 0" class="tp-help">
        {{ panelText('dependency.noCandidates') }}
      </p>
    </form>
    <template v-else>
      <UiErrorState v-if="dlg.query.error.value" :error="toApiError(dlg.query.error.value)" />
      <p v-else-if="dlg.rows.value.length === 0" class="tp-help" data-testid="tp-dep-empty">
        {{ panelText('dependency.empty') }}
      </p>
      <ul v-else class="tp-deps" data-testid="tp-dep-list">
        <li v-for="row in dlg.rows.value" :key="row.dependencyId">
          <span class="tp-trunc">{{ row.title }}</span>
          <UiButton
            size="sm"
            variant="danger"
            :disabled="dlg.busy.value"
            :aria-label="panelText('dependency.removeFor', { title: row.title })"
            data-testid="tp-dep-remove"
            @click="dlg.submitRemove(row)"
          >
            {{ panelText('dependency.remove') }}
          </UiButton>
        </li>
      </ul>
    </template>
    <p v-if="dlg.error.value" class="tp-form__error" role="alert" data-testid="tp-dep-error">
      {{ dlg.error.value }}
    </p>
    <template #footer>
      <UiButton variant="ghost" :disabled="dlg.busy.value" @click="open = false">
        {{ panelText(mode === 'add' ? 'request.cancel' : 'dependency.cancel') }}
      </UiButton>
      <UiButton
        v-if="mode === 'add'"
        variant="primary"
        type="submit"
        :form="formId"
        :disabled="dlg.busy.value || dlg.selected.value === ''"
        data-testid="tp-dep-submit"
      >
        {{ panelText('dependency.submit') }}
      </UiButton>
    </template>
  </UiModal>
</template>
