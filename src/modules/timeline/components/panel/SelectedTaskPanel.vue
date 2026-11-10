<script setup lang="ts">
import './panel.css'

import { computed, nextTick, ref, useId } from 'vue'

import { UiErrorState } from '@/shared/ui'
import { ConflictDialog } from '@/shared/ui/conflict'

import { retryTransient } from '../../api'
import type { SelectedTaskPanelEmits, SelectedTaskPanelProps } from '../index'
import DateRequestForm from './DateRequestForm.vue'
import DependencyDialog from './DependencyDialog.vue'
import PanelActions, { type PanelAction } from './PanelActions.vue'
import PanelDates from './PanelDates.vue'
import PanelHead from './PanelHead.vue'
import PanelSummary from './PanelSummary.vue'
import { checkDraft } from './date-input'
import { panelText } from './messages'
import { useDateActions } from './use-date-actions'
import { usePanelLifecycle } from './use-focus-return'
import { useTaskPanel } from './use-task-panel'

/**
 * W94 · E-03C-42, 54…66 — seçili görev paneli (sağ alt). Açılışta taze `getWorkItem` + dosya
 * sayısı; tarih girdileri yüze göre: Admin "Kaydet" (+ bekleyen talepte "Onayla/Reddet"),
 * Koordinatör "Tarih talebi gönder" (`DateRequestForm`), Üye salt okuma (P8/P18; yönetici her
 * yüzde yetkisini korur, P1). Kapat + Esc; odak çubuğa döner (KESİN 27).
 */
const props = defineProps<SelectedTaskPanelProps>()
const emit = defineEmits<SelectedTaskPanelEmits>()

const root = ref<HTMLElement | null>(null)
const titleId = `tp-title-${useId()}`
const panel = useTaskPanel(() => props)
const actions = useDateActions(panel)
usePanelLifecycle(root, () => emit('close'))

const requestOpen = ref(false)
const dependencyMode = ref<'add' | 'remove' | null>(null)
const dependencyOpen = computed({
  get: () => dependencyMode.value !== null,
  set: (open: boolean) => {
    if (!open) dependencyMode.value = null
  },
})

const request = computed(() => {
  const value = checkDraft(panel.start.value, panel.end.value).value
  const source = panel.item.value ?? props.task
  return { startOn: value?.startOn ?? source.start_on, endOn: value?.endOn ?? source.end_on }
})

function onEdit(): void {
  panel.dirty.value = true
  actions.reset()
}

async function onAction(action: PanelAction): Promise<void> {
  if (action === 'openInList') return emit('openInList', props.task.work_item_id)
  await nextTick()
  dependencyMode.value = action === 'addDependency' ? 'add' : 'remove'
}

const help = computed(() =>
  panel.policy.value === 'none'
    ? null
    : panelText(panel.policy.value === 'direct' ? 'help.direct' : 'help.request'),
)
</script>

<template>
  <section
    ref="root"
    class="tp"
    tabindex="-1"
    :aria-labelledby="titleId"
    :aria-busy="!panel.item.value && !panel.error.value ? 'true' : undefined"
    :data-face="face"
    data-testid="timeline-panel"
  >
    <PanelHead
      :kicker="panel.kicker.value"
      :title="task.title"
      :title-id="titleId"
      @close="emit('close')"
      @open-in-list="emit('openInList', task.work_item_id)"
    />
    <UiErrorState
      v-if="panel.error.value"
      :error="panel.error.value"
      :retryable="retryTransient(0, panel.error.value)"
      @retry="panel.retry"
    />
    <template v-else>
      <PanelDates
        v-model:start="panel.start.value"
        v-model:end="panel.end.value"
        :planned-end="panel.plannedNote.value"
        :editable="panel.can.value.edit"
        :late="task.lateness.is_overdue"
        :start-error="actions.errors.value.start"
        :end-error="actions.errors.value.end"
        @edit="onEdit"
      />
      <PanelSummary
        :task="task"
        :item="panel.item.value"
        :files="panel.files.value"
        :see-pending="panel.can.value.seePending"
        :can-review="panel.can.value.review"
        :busy="actions.busy.value"
        @decide="actions.decide"
      />
      <p v-if="help" class="tp-help" data-testid="tp-help">{{ help }}</p>
      <p v-if="actions.formError.value" class="tp-error" role="alert" data-testid="tp-error">
        {{ actions.formError.value }}
      </p>
    </template>
    <PanelActions
      :can-save="panel.can.value.save"
      :can-request="panel.can.value.request"
      :can-manage="panel.can.value.manage"
      :busy="actions.busy.value"
      @save="actions.save"
      @request="requestOpen = true"
      @action="onAction"
    />
    <DateRequestForm
      v-if="panel.can.value.request"
      v-model:open="requestOpen"
      :work-item-id="task.work_item_id"
      :target="panel.target.value"
      :start-on="request.startOn"
      :end-on="request.endOn"
    />
    <DependencyDialog
      v-if="dependencyMode"
      v-model:open="dependencyOpen"
      :mode="dependencyMode"
      :task="task"
    />
    <ConflictDialog
      v-model:open="actions.conflict.open.value"
      :fields="actions.conflict.fields.value"
      @resolve="actions.conflict.choose"
      @cancel="actions.conflict.dismiss"
    />
  </section>
</template>
