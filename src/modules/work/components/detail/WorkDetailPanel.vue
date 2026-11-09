<script setup lang="ts">
import './detail.css'

import { computed, ref, useId, watch } from 'vue'

import { UiErrorState, UiTabs, type UiChoiceOption } from '@/shared/ui'

import { canUploadFile } from '../../model/capabilities'
import FileUploadDialog from '../files/FileUploadDialog.vue'
import FilesTab from '../files/FilesTab.vue'
import NotesTab from '../notes/NotesTab.vue'
import SubtaskTab from '../subtasks/SubtaskTab.vue'
import type { WorkDetailPanelEmits, WorkDetailPanelProps, WorkDetailTab } from '../index'
import DetailActions from './DetailActions.vue'
import DetailHead from './DetailHead.vue'
import DetailStatus from './DetailStatus.vue'
import DetailSummary from './DetailSummary.vue'
import { detailText } from './messages'
import { useDetailPanel } from './use-detail-panel'

/**
 * W43 — görev ayrıntı paneli (E-03-19, E-03-41…51, E-03-53…55, E-03-43; `mekanizma.md` §4).
 * Üst bilgi + kapat, durum yeri (W45 `StatusMenu` ya da salt okunur etiket), sekme kabı
 * Özet · Alt görevler · Dosyalar · Notlar (sekme bellekte, görev değişince açılış sekmesi;
 * içerikler W44/W46/W47), eylem satırı. 404 / kapsam bilinmiyor → `close('not_found')` +
 * bildirim; silme → `close('deleted')`; kapat → `close('user')`. Çağıran URL `gorev`'i siler.
 */
const props = withDefaults(defineProps<WorkDetailPanelProps>(), { initialTab: 'summary' })
const emit = defineEmits<WorkDetailPanelEmits>()

const panel = useDetailPanel(
  () => props.workItemId,
  (reason) => emit('close', reason),
)
const { item, facts, error, kicker, files, notesTotal, timeZone } = panel
const titleId = `wd-title-${useId()}`

const tab = ref<WorkDetailTab>(props.initialTab)
const uploadOpen = ref(false)
watch(
  () => [props.workItemId, props.initialTab] as const,
  ([, initial]) => {
    tab.value = initial
    uploadOpen.value = false
  },
)

const tabs = computed<UiChoiceOption<WorkDetailTab>[]>(() => [
  { value: 'summary', label: detailText('workDetail.tabs.summary') },
  {
    value: 'subtasks',
    label: detailText('workDetail.tabs.subtasks'),
    count: item.value?.subtask_counts.total,
  },
  { value: 'files', label: detailText('workDetail.tabs.files'), count: files.value?.length },
  { value: 'notes', label: detailText('workDetail.tabs.notes'), count: notesTotal.value },
])

const canUpload = computed(() => facts.value !== null && canUploadFile(facts.value))
function openUpload(): void {
  if (canUpload.value) uploadOpen.value = true
}
</script>

<template>
  <section
    class="rp-sheet wd"
    :aria-labelledby="item ? titleId : undefined"
    :aria-label="item ? undefined : detailText('workDetail.panel')"
    :aria-busy="!item && !error ? 'true' : undefined"
    data-testid="work-detail"
  >
    <DetailHead
      :kicker="kicker"
      :title="item?.title ?? null"
      :title-id="titleId"
      @close="panel.close('user')"
    />
    <template v-if="item && facts">
      <DetailStatus :item="item" :facts="facts" @request-evidence="openUpload" />
      <UiTabs
        v-model="tab"
        class="wd-tabs"
        :options="tabs"
        :label="detailText('workDetail.tabs.label')"
      >
        <template #default="{ value }">
          <DetailSummary
            v-if="value === 'summary'"
            :item="item"
            :files="files"
            :time-zone="timeZone"
          />
          <SubtaskTab v-else-if="value === 'subtasks'" :item="item" />
          <FilesTab v-else-if="value === 'files'" :item="item" />
          <NotesTab v-else :item="item" />
        </template>
      </UiTabs>
      <DetailActions
        :item="item"
        :facts="facts"
        @upload="openUpload"
        @deleted="panel.close('deleted')"
      />
      <FileUploadDialog v-if="canUpload" v-model:open="uploadOpen" :item="item" />
    </template>
    <UiErrorState
      v-else-if="error"
      :error="error"
      :retryable="panel.retryable.value"
      @retry="panel.retry"
    />
    <div v-else class="wd-skeleton" data-testid="detail-loading">
      <span class="rp-sr">{{ detailText('workDetail.loading') }}</span>
      <span v-for="n in 5" :key="n" class="wd-skeleton__line" aria-hidden="true" />
    </div>
  </section>
</template>
