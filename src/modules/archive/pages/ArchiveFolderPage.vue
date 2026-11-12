<script setup lang="ts">
import './folder/folder.css'

import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'

import { TASKS_ROUTE } from '@/modules/work/public'
import { toApiError } from '@/shared/errors/api-error'
import { usePageCrumb } from '@/shared/navigation/page-crumb'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiEmptyState, UiErrorState, UiInput } from '@/shared/ui'

import {
  FileFilterBar,
  FileGrid,
  FileList,
  FilePreview,
  FolderTree,
  TaskFolderCards,
  UploadDialog,
} from '../components'
import { folderText } from '../components/files/messages'
import { archiveCapabilities } from '../model/capabilities'
import FolderHead from './folder/FolderHead.vue'
import { useDebouncedSearch } from './folder/use-debounced-search'
import { useFileSelection } from './folder/use-file-selection'
import { useFolderData } from './folder/use-folder-data'
import { useFolderUrl } from './folder/use-folder-url'

/**
 * 07 Arşiv › Klasör (`/arsiv/:klasorId`, S3; W123). Sayfa gövdesi: ağaç | (başlık, görev
 * klasörleri, dosya araç çubuğu + ızgara/liste) | önizleme (`?dosya`). Komşu bileşenler bağlanır:
 * `FilePreview` (W124), `FolderZipButton` (W126, `FolderHead` içinde), `UploadDialog` (W125,
 * `defaultTaskId` = `?gorev`). Durum URL'de (`gorev`, `etiket`, `gorunum`, `dosya`, `q`);
 * hiçbiri depoya yazılmaz. Klasör yok/erişim kaybı ve geçersiz kimlik tek "bulunamadı" durumu.
 */
const router = useRouter()
const store = useScopeStore()
const { standing } = useStanding()

const root = ref<HTMLElement | null>(null)
const uploading = ref(false)
const head = ref<{ focusUpload: () => void } | null>(null)

let admin: () => boolean | null = () => null
const url = useFolderUrl(() => {
  uploading.value = false
  if (admin() === false) {
    void router.replace(url.archiveHome)
    return true
  }
})
const data = useFolderData(url.folderId, url.state)
admin = () => data.ctx.admin.value
const { ctx, attachments } = data

usePageCrumb(() => data.folder.value?.name ?? null)

const caps = computed(() => archiveCapabilities(standing.value, store.programId))
const target = computed(() => ctx.target.value)
const canUpload = computed(
  () =>
    target.value !== null &&
    caps.value.canOpenUpload &&
    caps.value.upload(target.value.departmentId),
)
const canZip = computed(() => (data.folder.value ? caps.value.folderZip(data.folder.value) : false))

const search = useDebouncedSearch(
  computed(() => url.state.value.q),
  (q) => url.update({ q, file: null }),
)
const searchDisabled = computed(() => data.needsTask.value)

const removing = ref(false)
const selection = useFileSelection({
  holding: removing,
  root,
  files: attachments.files,
  hasMore: attachments.hasMore,
  loadMore: attachments.loadMore,
  fetchingMore: computed(() => attachments.query.isFetchingNextPage.value),
  settled: data.filesSettled,
  fileId: computed(() => url.state.value.file),
  select: (file, mode) => url.update({ file }, mode),
})

const missing = computed(() => ctx.folderMissing.value)
const folderError = computed(() =>
  ctx.folders.isError.value && !missing.value ? toApiError(ctx.folders.error.value) : null,
)
const taskCount = computed(() => (data.tasksLoading.value ? null : data.taskList.value.length))
const View = computed(() => (url.state.value.view === 'liste' ? FileList : FileGrid))

/** Devam yoksa toplam yüklenen sayıdır (son dosyada "sonraki" ölü kalmaz). */
const previewTotal = computed(() =>
  attachments.hasMore.value ? data.total.value : attachments.files.value.length,
)

function closeUpload(): void {
  uploading.value = false
  void nextTick(() => head.value?.focusUpload())
}

function openTask(workItemId: string): void {
  void router.push({ name: TASKS_ROUTE.name, query: { gorev: workItemId } })
}
</script>

<template>
  <section ref="root" class="arch-page" data-testid="archive-folder-page">
    <UiEmptyState
      v-if="missing"
      icon="archive"
      :title="folderText('folder.missing.title')"
      :text="folderText('folder.missing.text')"
      data-testid="folder-missing"
    >
      <template #action>
        <UiButton size="sm" @click="router.push(url.archiveHome)">
          {{ folderText('folder.missing.back') }}
        </UiButton>
      </template>
    </UiEmptyState>
    <UiErrorState
      v-else-if="folderError"
      :error="folderError"
      :title="folderText('folder.error')"
      retryable
      :retrying="ctx.folders.isFetching.value"
      @retry="ctx.folders.refetch()"
    />
    <template v-else>
      <div class="arch-explorer">
        <div class="arch-explorer__tree">
          <FolderTree
            :folders="data.treeFolders.value"
            :active-folder-id="url.folderId.value ?? ''"
            :tasks="data.taskList.value"
            :selected-task-id="data.activeTask.value"
            :truncated="data.taskFolders.folders.value.truncated"
            :loading-tasks="data.tasksLoading.value"
            @select-folder="url.openFolder"
            @select-task="url.update({ task: $event, file: null }, 'push')"
          />
        </div>
        <div class="arch-explorer__main">
          <div class="arch-search">
            <UiInput
              v-model="search.text.value"
              type="search"
              icon="search"
              size="sm"
              :disabled="searchDisabled"
              :aria-label="folderText('folder.search.label')"
              :placeholder="
                searchDisabled
                  ? folderText('folder.search.needsTask')
                  : folderText('folder.search.placeholder')
              "
              data-testid="folder-search"
              @keydown.enter="search.flush"
            />
          </div>
          <FolderHead
            ref="head"
            :folder="data.folder.value ?? null"
            :target="target"
            :task-count="taskCount"
            :tasks-truncated="data.taskFolders.folders.value.truncated"
            :can-zip="canZip"
            :can-upload="canUpload"
            @upload="uploading = true"
          />
          <TaskFolderCards
            :tasks="data.taskList.value"
            :selected-task-id="data.activeTask.value"
            :truncated="data.taskFolders.folders.value.truncated"
            :loading="data.tasksLoading.value"
            @select="url.update({ task: $event, file: null }, 'push')"
          />
          <section class="arch-files" aria-labelledby="arch-files-title">
            <FileFilterBar
              :tag="url.state.value.tag"
              :view="url.state.value.view"
              :loaded="attachments.files.value.length"
              :total="data.total.value"
              :has-more="attachments.hasMore.value"
              @update:tag="url.update({ tag: $event, file: null })"
              @update:view="url.update({ view: $event })"
            />
            <component
              :is="View"
              :files="attachments.files.value"
              :task-titles="data.titles.value"
              :selected-file-id="url.state.value.file"
              :has-more="attachments.hasMore.value"
              :loading="data.filesLoading.value"
              :error="data.filesError.value"
              :needs-task="data.needsTask.value"
              @select="url.update({ file: $event }, 'push')"
              @load-more="attachments.loadMore"
              @retry="attachments.query.refetch()"
            />
          </section>
        </div>
        <div v-if="selection.selected.value && target" class="arch-explorer__aside">
          <FilePreview
            :file="selection.selected.value"
            :position="selection.position.value"
            :total="previewTotal"
            :has-more="attachments.hasMore.value"
            :target="target"
            :task-title="data.titles.value[selection.selected.value.work_item_id] ?? null"
            @removing="removing = $event"
            @close="selection.close"
            @previous="selection.previous"
            @next="selection.next"
            @deleted="selection.removed"
            @open-task="openTask"
          />
        </div>
      </div>
      <UploadDialog
        v-if="uploading"
        :tasks="data.uploads.value"
        :default-task-id="data.activeTask.value"
        @close="closeUpload"
      />
    </template>
  </section>
</template>
