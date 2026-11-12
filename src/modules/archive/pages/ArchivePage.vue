<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import { useProgramDepartments } from '@/modules/work/public'
import { authSession } from '@/shared/http'
import { useScopeStore } from '@/shared/scope/store'
import { DesignStub, UiButton, UiEmptyState } from '@/shared/ui'

import { useArchiveTaskFolders } from '../api/admin-tasks'
import { useArchiveContext } from '../api/context'
import { useFolderCards } from '../api/cards'
import {
  ArchiveSearchBar,
  FolderGrid,
  PeriodZipButton,
  StorageSummary,
  TagLegend,
  UploadDialog,
} from '../components'
import '../components/folders/folders.css'
import {
  formatFolderSort,
  parseFolderSort,
  type FolderSort,
} from '../components/folders/sort-param'
import { archiveCapabilities } from '../model/capabilities'
import { isArchiveKind } from '../model/mime'
import { uploadTasks } from '../model/tasks'
import type { ArchiveKind } from '../model/types'
import { ARCHIVE_FOLDER_ROUTE } from '../routes'

/**
 * 06 Arşiv (E-06-01…24; F5). Koordinatör/üye `/arsiv`'e girince kendi klasörüne yönlenir (P40);
 * ızgara yalnız yöneticide görünür (P33): koordinatörlük adları `listProgramDepartments`'tan,
 * sayılar `—` (BE-072/BE-025) ve arama/tür segmenti statik ("Görev klasörü seçin"). Süzgeçler URL'de
 * (`q`, `tur`, `sirala`). Bağlama (KESİN 28): `PeriodZipButton` (W126; ŞY, `target` yöneticide
 * `null` → devre dışı, BE-120) ve `UploadDialog` (W125; `tasks` = `uploadTasks`, görev seçici
 * arşivdeki dosyalı görevlerle sınırlı, BE-121). Etiket kartı yalnız açıklayıcıdır (06'da
 * gidilecek klasör bağlamı yok); depolama yalnız dosya adedi.
 */
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const scope = useScopeStore()
const context = useArchiveContext(() => null)

const text = (key: string): string => {
  const value = route.query[key]
  return typeof value === 'string' ? value : ''
}
const q = computed(() => text('q'))
const kind = computed<ArchiveKind>(() =>
  isArchiveKind(text('tur')) ? (text('tur') as ArchiveKind) : 'tumu',
)
const sort = computed(() => parseFolderSort(route.query.sirala))

function setQuery(key: string, value: string | undefined): void {
  void router.replace({ query: { ...route.query, [key]: value || undefined } })
}
function setSort(field: FolderSort['field'], direction: FolderSort['direction']): void {
  setQuery('sirala', formatFolderSort({ field, direction }))
}
function setKind(next: ArchiveKind): void {
  setQuery('tur', next === 'tumu' ? undefined : next)
}
function open(folderId: string): void {
  void router.push({ name: ARCHIVE_FOLDER_ROUTE.name, params: { klasorId: folderId } })
}

const folders = useFolderCards(
  context,
  () => sort.value.field,
  () => sort.value.direction,
)
const departments = useProgramDepartments(() => context.admin.value === true)
function retry(): void {
  void (context.admin.value ? departments.query.refetch() : context.folders.refetch())
}
const entry = computed(() => context.entry.value)
const adminGrid = computed(() => entry.value.kind === 'grid')

// P40: koordinatör/üye 06'yı atlar; arama metni 07'ye taşınır.
watch(
  entry,
  (decision) => {
    if (decision.kind !== 'redirect') return
    void router.replace({
      name: ARCHIVE_FOLDER_ROUTE.name,
      params: { klasorId: decision.folderId },
      query: q.value ? { q: q.value } : {},
    })
  },
  { immediate: true },
)

const capabilities = computed(() => archiveCapabilities(context.standing.value, scope.programId))
const totalFiles = computed(() =>
  context.admin.value === true
    ? null
    : (context.folderList.value ?? []).reduce((sum, f) => sum + f.file_count, 0),
)

// Yükleme: görev seçicisi arşivdeki (dosyalı) görevlerle sınırlıdır (BE-121).
// Yönlendirilen roller (P40) 06'da görev okumaz: 07 kendi okumasını açar (W121 temizliği).
const taskFolders = useArchiveTaskFolders(context, () => context.entry.value.kind === 'grid')
const uploadList = computed(() =>
  uploadTasks(taskFolders.folders.value.tasks, context.target.value?.departmentId ?? null),
)
const uploading = ref(false)
const needsFolder = computed(() => context.access.value.mode === 'admin-overview')
const uploadDisabled = computed(() => uploadList.value.length === 0)
const uploadHint = computed(() =>
  needsFolder.value
    ? t('archive.folders.actions.uploadNeedsFolder')
    : uploadDisabled.value
      ? t('archive.folders.actions.uploadNoTasks')
      : undefined,
)
function closeUpload(): void {
  uploading.value = false
}
const stopScope = scope.onChange(closeUpload)
let generation = authSession.generation
let account = authSession.snapshot.accountId
const stopSession = authSession.subscribe((snapshot) => {
  if (generation !== authSession.generation || account !== snapshot.accountId) closeUpload()
  generation = authSession.generation
  account = snapshot.accountId
})
onScopeDispose(() => {
  stopScope()
  stopSession()
})
</script>

<template>
  <section class="archive-page" :aria-label="t('archive.page.title')">
    <header class="rp-head">
      <div>
        <h1 class="rp-h1">{{ t('archive.page.title') }}</h1>
        <p class="rp-sub">{{ t('archive.page.subtitle') }}</p>
      </div>
      <div class="rp-actions">
        <PeriodZipButton v-if="capabilities.periodZip()" :target="context.target.value" />
        <component
          :is="needsFolder ? DesignStub : 'span'"
          v-if="capabilities.canOpenUpload"
          v-bind="needsFolder ? { id: 'BE-072' } : {}"
        >
          <UiButton
            variant="primary"
            icon="upload"
            :disabled="uploadDisabled"
            :title="uploadHint"
            data-action="upload"
            @click="uploading = true"
          >
            {{ t('archive.folders.actions.upload') }}
          </UiButton>
        </component>
      </div>
    </header>
    <div class="rp-body">
      <template v-if="adminGrid">
        <div class="archive-main">
          <ArchiveSearchBar
            :q="q"
            :kind="kind"
            :disabled="context.admin.value === true"
            @update:q="setQuery('q', $event)"
            @update:kind="setKind"
          />
        </div>
        <div class="rp-col">
          <p v-if="folders.truncated.value" class="rp-cap" role="status">
            {{ t('archive.folders.coordinatorships.truncated') }}
          </p>
          <FolderGrid
            :cards="folders.cards.value"
            :sort-field="sort.field"
            :sort-direction="sort.direction"
            :loading="folders.loading.value"
            :error="folders.error.value"
            @open="open"
            @update:sort="setSort"
            @retry="retry"
          />
        </div>
        <aside class="rp-aside" :aria-label="t('archive.folders.tags.title')">
          <TagLegend />
          <StorageSummary :total-files="totalFiles" :loading="folders.loading.value" />
        </aside>
      </template>
      <UiEmptyState
        v-else-if="entry.kind === 'empty'"
        class="archive-state"
        icon="archive"
        :title="t('archive.folders.noFolders')"
        :text="t('archive.folders.noFoldersText')"
      />
      <UiEmptyState
        v-else-if="context.folders.isError.value"
        class="archive-state"
        icon="alert"
        :title="t('archive.folders.coordinatorships.error')"
        :text="t('archive.folders.coordinatorships.errorText')"
      >
        <template #action>
          <UiButton size="sm" @click="context.folders.refetch()">
            {{ t('archive.folders.coordinatorships.retry') }}
          </UiButton>
        </template>
      </UiEmptyState>
      <p v-else class="rp-cap archive-state" role="status">
        {{ t('archive.folders.redirecting') }}
      </p>
    </div>
    <UploadDialog
      v-if="uploading && capabilities.canOpenUpload"
      :tasks="uploadList"
      @close="closeUpload"
    />
  </section>
</template>
