<script setup lang="ts">
/**
 * "Görev arşivine de kaydet" (E-10-103…105, BE-029): onay kutusu açılınca koordinatörlük → görev
 * (sohbetin programındaki, yükleme yetkisi olduğun görevler; `include_empty`) → etiket (kapalı
 * küme P34, varsayılan yok). Seçim tamamsa `change` `{workItemId, tag}` yayar, değilse `null`;
 * "Gönder" bu alanları `archiveChatFile`a taşır. Yükleme yetkisi/yönetici kuralı (ADR-0030)
 * SUNUCUDADIR (403 `records.not_authorized` alan altında); burada yalnız yetkisiz görev seçeneği
 * gizlenir (`archiveCapabilities.upload`, mercek ≠ yetki).
 */
import './dialogs.css'

import { computed, ref, watch } from 'vue'

import {
  ARCHIVE_TAGS,
  TAG_LABELS,
  archiveCapabilities,
  programSource,
  uploadTasks,
  useArchiveUploadTasks,
} from '@/modules/archive/public'
import { isListTruncated } from '@/shared/http/truncation'
import { useScopeStore } from '@/shared/scope/store'
import { UiCheck, UiField, UiHint, UiSelect } from '@/shared/ui'

import { chatText } from '../../messages'
import type { ArchiveSaveChoice } from './archive-save'
import { useDepartmentOptions } from './use-department-options'

const props = defineProps<{
  /** Gönderim denendi: eksik seçim hatası görünür. */
  tried: boolean
  /** Sunucu 422/403 alan hataları (`work_item_id`, `tag`). */
  fieldErrors: Readonly<Record<string, string>>
  disabled?: boolean
}>()
const enabled = defineModel<boolean>('enabled', { default: false })
const taskId = ref('')
const tag = ref('')
const emit = defineEmits<{ change: [choice: ArchiveSaveChoice | null] }>()

const store = useScopeStore()
const { options: departments, departmentId, standing } = useDepartmentOptions()

// Okuma kaynağı arşiv sayfalarıyla aynıdır: yönetici S2 program arşivi (+ birim süzgeci),
// koordinatör/üye S3 (başlık seçilen birimden).
const source = computed(() => {
  if (store.programId === null || departmentId.value === '') return null
  return standing.value?.companyAdmin
    ? programSource(store.programId, departmentId.value)
    : { programId: store.programId, departmentId: departmentId.value }
})
const list = useArchiveUploadTasks(source, enabled)
const tasks = computed(() => {
  const caps = archiveCapabilities(standing.value, store.programId)
  return uploadTasks(list.data.value?.tasks).filter((t) => caps.upload(t.departmentId))
})
const truncated = computed(() => isListTruncated(list.data.value))
const taskOptions = computed(() =>
  tasks.value.map((t) => ({ value: t.workItemId, label: t.title })),
)
const tagOptions = ARCHIVE_TAGS.map((value) => ({ value, label: TAG_LABELS[value] }))

watch(departmentId, () => {
  taskId.value = ''
})
watch([enabled, taskId, tag, tasks], () => {
  const valid =
    enabled.value && tag.value !== '' && tasks.value.some((t) => t.workItemId === taskId.value)
  emit('change', valid ? { workItemId: taskId.value, tag: tag.value } : null)
})

const taskError = computed(
  () =>
    props.fieldErrors.work_item_id ??
    (props.tried && taskId.value === '' ? chatText('chat.dialogs.share.error.task') : undefined),
)
const tagError = computed(
  () =>
    props.fieldErrors.tag ??
    (props.tried && tag.value === '' ? chatText('chat.dialogs.share.error.tag') : undefined),
)
</script>

<template>
  <div class="chat-dlg__form" data-testid="dlg-archive-save">
    <label class="chat-dlg__check">
      <UiCheck v-model="enabled" :disabled="disabled" data-testid="dlg-save-archive" />
      <span>{{ chatText('chat.dialogs.share.saveToTask') }}</span>
    </label>
    <template v-if="enabled">
      <UiSelect
        v-model="departmentId"
        name="save-department"
        :aria-label="chatText('chat.dialogs.share.department')"
        :options="departments"
        :placeholder="chatText('chat.dialogs.share.departmentPlaceholder')"
      />
      <UiField
        v-if="source !== null"
        :label="chatText('chat.dialogs.share.task')"
        :error="taskError"
      >
        <UiSelect
          v-model="taskId"
          name="save-task"
          :options="taskOptions"
          :placeholder="chatText('chat.dialogs.share.taskPlaceholder')"
        />
      </UiField>
      <UiHint v-if="source !== null && !list.isPending.value && tasks.length === 0">
        {{ chatText('chat.dialogs.share.taskEmpty') }}
      </UiHint>
      <UiHint v-if="truncated">{{ chatText('chat.dialogs.share.taskTruncated') }}</UiHint>
      <UiField :label="chatText('chat.dialogs.share.tag')" :error="tagError">
        <UiSelect
          v-model="tag"
          name="save-tag"
          :options="tagOptions"
          :placeholder="chatText('chat.dialogs.share.tagPlaceholder')"
        />
      </UiField>
    </template>
  </div>
</template>
