import { computed, type ComputedRef, type MaybeRefOrGetter } from 'vue'

import { i18n } from '@/shared/i18n'
import { useWorkItemSubtasks, type WorkTarget } from '@/modules/work/public'
import { hasErrorCode } from '@/shared/scope/authority-loss'
import type { UiSelectOption } from '@/shared/ui'

/**
 * Seçili görevin alt görev seçenekleri (W125; `listWorkItemSubtasks` yalnız görev seçiliyken).
 * 403 `work.not_assigned` nötrdür (hata değil: yalnız "Alt görev yok" kalır); başka hata kısa
 * bilgi gösterir ve dosya göreve eklenir.
 */
export function useSubtaskOptions(
  workItemId: MaybeRefOrGetter<string | null>,
  target: MaybeRefOrGetter<WorkTarget | null>,
): {
  options: ComputedRef<UiSelectOption[]>
  loading: ComputedRef<boolean>
  unavailable: ComputedRef<boolean>
} {
  const subtasks = useWorkItemSubtasks(workItemId, target)
  return {
    options: computed(() => [
      { value: '', label: i18n.global.t('archive.upload.subtask.none') },
      ...(subtasks.data.value?.subtasks ?? []).map((s) => ({
        value: s.subtask_id,
        label: s.title,
      })),
    ]),
    loading: computed(() => subtasks.isFetching.value),
    unavailable: computed(
      () => subtasks.isError.value && !hasErrorCode(subtasks.error.value, 'work.not_assigned'),
    ),
  }
}
