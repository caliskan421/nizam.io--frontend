<script setup lang="ts">
import { computed, nextTick, onScopeDispose, ref, watch, type ComponentPublicInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import { SeasonReportActions } from '@/modules/reports/public'
import { authSession } from '@/shared/http'
import { isListTruncated } from '@/shared/http/truncation'
import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiCount, UiEmptyState } from '@/shared/ui'

import { useArchiveContext } from '../api/context'
import { useFolderCards } from '../api/cards'
import { useArchiveUploadTasks } from '../api/queries'
import {
  ArchiveSearchBar,
  FileList,
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
import { useArchiveSearch } from './use-archive-search'
import { useStorageTotals } from './use-storage-totals'

/**
 * 06 Arşiv (E-06-01…24; F5, F8). Koordinatör/üye `/arsiv`'e girince kendi klasörüne yönlenir (P40);
 * ızgara yalnız yöneticide: `programArchiveFolders` (S2, BE-072/BE-025) kartları. Yönetici araması
 * program geneli (`programArchiveAttachments`, yalnız dosya adı): süzgeç doluyken sonuç listesi
 * ızgaranın yerine gelir. Süzgeçler URL'de (`q`, `tur`, `sirala`). Bağlama (KESİN 28):
 * `PeriodZipButton` (W126; `target` yöneticide `null` → devre dışı, BE-120) ve `UploadDialog`
 * (W125; görevler `include_empty=true` ile dosyasızlar dahil, BE-121; başlık seçeneğin
 * `department_id`'si). */
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
function retry(): void {
  void context.folders.refetch()
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
const storage = useStorageTotals(context)

// Yükleme: seçici `include_empty=true` (dosyasızlar dahil, BE-121), yönetici bütün programı görür;
// yönlendirilen roller (P40) 06'da görev okumaz (07 kendi okumasını açar).
const gridActive = computed(() => context.entry.value.kind === 'grid')
const uploadTaskList = useArchiveUploadTasks(context.source, gridActive)
const uploadList = computed(() => uploadTasks(uploadTaskList.data.value?.tasks))
const uploadTruncated = computed(() => isListTruncated(uploadTaskList.data.value))
const uploading = ref(false)
const uploadButton = ref<ComponentPublicInstance | null>(null)
const uploadDisabled = computed(() => uploadList.value.length === 0)

// Arama (yönetici, program geneli): süzgeç doluyken sonuç listesi ızgaranın yerine geçer.
const {
  searching,
  results,
  titles: resultTitles,
  openResult,
} = useArchiveSearch(context, { q, kind, adminGrid })
function closeUpload(): void {
  const wasOpen = uploading.value
  uploading.value = false
  // Kapanınca odak tetikleyiciye döner (KESİN 27); kapsam/oturum değişiminde (sahip aynı) da.
  if (wasOpen) void nextTick(() => (uploadButton.value?.$el as HTMLElement | undefined)?.focus())
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
        <SeasonReportActions />
        <PeriodZipButton v-if="capabilities.periodZip()" />
        <UiButton
          v-if="capabilities.canOpenUpload"
          ref="uploadButton"
          variant="primary"
          icon="upload"
          :disabled="uploadDisabled"
          :title="uploadDisabled ? t('archive.folders.actions.uploadNoTasks') : undefined"
          data-action="upload"
          @click="uploading = true"
        >
          {{ t('archive.folders.actions.upload') }}
        </UiButton>
      </div>
    </header>
    <div class="rp-body">
      <template v-if="adminGrid">
        <div class="archive-main">
          <ArchiveSearchBar
            :q="q"
            :kind="kind"
            @update:q="setQuery('q', $event)"
            @update:kind="setKind"
          />
        </div>
        <div class="rp-col">
          <section
            v-if="searching"
            class="archive-results"
            :aria-label="t('archive.folders.search.results')"
            data-testid="archive-search-results"
          >
            <h2 class="rp-cardtitle">
              {{ t('archive.folders.search.results') }}
              <UiCount :value="String(results.total.value ?? results.files.value.length)" />
            </h2>
            <FileList
              :files="results.files.value"
              :task-titles="resultTitles"
              :selected-file-id="null"
              :has-more="results.hasMore.value"
              :loading="results.query.isPending.value || results.query.isFetchingNextPage.value"
              :error="results.query.isError.value"
              @select="openResult"
              @load-more="results.loadMore"
              @retry="results.query.refetch()"
            />
          </section>
          <FolderGrid
            v-else
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
          <StorageSummary v-bind="storage" @retry="retry" />
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
      :truncated="uploadTruncated"
      @close="closeUpload"
    />
  </section>
</template>
