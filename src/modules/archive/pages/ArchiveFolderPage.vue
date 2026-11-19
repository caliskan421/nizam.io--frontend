<script setup lang="ts">
import './folder/folder.css'

import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'

import { TASKS_ROUTE } from '@/modules/work/public'
import { toApiError } from '@/shared/errors/api-error'
import { usePageCrumb } from '@/shared/navigation/page-crumb'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiEmptyState, UiErrorState } from '@/shared/ui'

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
import FullFilePreview from '../components/preview/FullFilePreview.vue'
import { archiveCapabilities } from '../model/capabilities'
import FolderHead from './folder/FolderHead.vue'
import FolderSearch from './folder/FolderSearch.vue'
import { useDebouncedSearch } from './folder/use-debounced-search'
import { useFileSelection } from './folder/use-file-selection'
import { useArchiveFullscreen } from './folder/use-full-preview-history'
import { useFolderData } from './folder/use-folder-data'
import { useFolderUrl } from './folder/use-folder-url'
import { usePreviewVisibleFiles } from './folder/use-preview-visible-files'

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
/** Klasör-başlıklı eylemler (klasör ZIP'i); dosya işlemlerinin başlığı satırın `department_id`'sidir. */
const target = computed(() => ctx.target.value)
const folderDepartment = computed(() => ctx.source.value?.departmentId ?? null)
const canUpload = computed(
  () =>
    folderDepartment.value !== null &&
    caps.value.canOpenUpload &&
    caps.value.upload(folderDepartment.value),
)
const canZip = computed(() => (data.folder.value ? caps.value.folderZip(data.folder.value) : false))

const search = useDebouncedSearch(
  computed(() => url.state.value.q),
  (q) => url.update({ q, file: null }),
)
const removing = ref(false)
const fullscreenHolding = ref(false)
const previewFiles = usePreviewVisibleFiles(attachments.files, () => attachments.query.refetch())
const selection = useFileSelection({
  holding: computed(() => removing.value || fullscreenHolding.value),
  root,
  files: previewFiles.visible,
  hasMore: attachments.hasMore,
  loadMore: attachments.loadMore,
  fetchingMore: computed(() => attachments.query.isFetchingNextPage.value),
  settled: data.filesSettled,
  fileId: computed(() => url.state.value.file),
  select: (file, mode) => url.update({ file }, mode),
})

/** Seçili dosyanın S3 hedefi: başlık dosyanın departmanıdır (yönetici için de; RECORDS-K39). */
const previewTarget = computed(() => {
  const file = selection.selected.value
  return store.programId !== null && file
    ? { programId: store.programId, departmentId: file.department_id }
    : null
})
const fullscreen = useArchiveFullscreen(
  () => selection.selected.value,
  () => previewTarget.value,
  (id) => data.titles.value[id] ?? null,
  fullscreenHolding,
)
const missing = computed(() => ctx.folderMissing.value)
const folderError = computed(() =>
  ctx.folders.isError.value && !missing.value ? toApiError(ctx.folders.error.value) : null,
)
const selected = previewFiles.allowedSelection(selection.selected)
const taskCount = computed(() => (data.tasksLoading.value ? null : data.taskList.value.length))
const View = computed(() => (url.state.value.view === 'liste' ? FileList : FileGrid))

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
          <FolderSearch v-model="search.text.value" @flush="search.flush" />
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
          <section
            v-if="data.tasksFailure.value"
            class="arch-tasks"
            aria-labelledby="arch-tasks-title"
            data-testid="task-folders-error"
          >
            <h2 id="arch-tasks-title" class="arch-tasks__title">{{ folderText('tasks.title') }}</h2>
            <UiErrorState
              :error="toApiError(data.tasksFailure.value.error)"
              :title="folderText('tasks.error')"
              retryable
              :retrying="data.taskFolders.retrying.value"
              @retry="data.taskFolders.retry()"
            />
          </section>
          <TaskFolderCards
            v-else
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
              :loaded="previewFiles.visible.value.length"
              :total="data.total.value"
              @update:tag="url.update({ tag: $event, file: null })"
              @update:view="url.update({ view: $event })"
            />
            <component
              :is="View"
              :key="store.programId ?? undefined"
              :program-id="ctx.source.value?.programId"
              :files="previewFiles.visible.value"
              :task-titles="data.titles.value"
              :selected-file-id="url.state.value.file"
              :has-more="attachments.hasMore.value"
              :loading="data.filesLoading.value"
              :error="data.filesError.value"
              @select="url.update({ file: $event }, 'push')"
              @load-more="attachments.loadMore"
              @retry="attachments.query.refetch()"
            />
          </section>
        </div>
        <div v-if="selected && previewTarget" class="arch-explorer__aside">
          <FilePreview
            :file="selected"
            :position="selection.position.value"
            :total="data.total.value"
            :has-more="attachments.hasMore.value"
            :target="previewTarget"
            :task-title="data.titles.value[selected.work_item_id] ?? null"
            @fullscreen="fullscreen.open"
            @removing="removing = $event"
            @moved="selection.removed"
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
        :truncated="data.uploadsTruncated.value"
        :default-task-id="data.activeTask.value"
        @close="closeUpload"
      />
    </template>
    <FullFilePreview
      v-if="fullscreen.shown.value"
      v-bind="fullscreen.shown.value"
      @close="fullscreen.close"
      @denied="previewFiles.hide(fullscreen.shown.value?.file.file_id)"
    />
  </section>
</template>
