<script setup lang="ts">
import './files.css'

import { computed, ref } from 'vue'

import { toApiError } from '@/shared/errors/api-error'
import { UiButton, UiEmptyState, UiErrorState, UiIcon } from '@/shared/ui'

import { useWorkItemFiles } from '../../api'
import { targetOf } from '../../model/target'
import type { FilesTabProps } from '../index'
import FileRow from './FileRow.vue'
import FileUploadDialog from './FileUploadDialog.vue'
import { filesText } from './messages'
import { evidenceFileName } from './model'
import { useFileAccess } from './use-file-access'

/**
 * W46 · E-03-61, E-03-50 — panel "Dosyalar" sekmesi (P3: `shared/ui` ile en sade).
 *  - Liste `listWorkItemFiles` (S3, görevin kendi kapsamı; sayfasız). Anahtar
 *    `queryKeys.workItems.files` — 03c ve 06 ile ORTAK (ortak-kurallar §6); attachFile /
 *    renameFile / deleteFile / deleteWorkItemSubtask yeniden okutur. İyimser güncelleme yok.
 *  - E-03-50: son dosyanın adı ya da "Yok" (herhangi dosya kanıttır); arşiv klasörü bağlantısı
 *    faz dışı → devre dışı + "F5'te" notu (§5; stub değil, §3).
 *  - Eylemler `istemci-akislari` §4: yükle s.148 (yönetici gizli), ad s.149, sil s.150.
 */
const props = defineProps<FilesTabProps>()

const files = useWorkItemFiles(
  () => props.item.work_item_id,
  () => targetOf(props.item),
)
const access = useFileAccess(() => props.item)
const list = computed(() => files.data.value?.files ?? [])
const evidence = computed(() => evidenceFileName(list.value))
const loadError = computed(() =>
  files.error.value && !files.data.value ? toApiError(files.error.value) : null,
)
const uploadOpen = ref(false)
const archivePhase = filesText('workFiles.tab.archivePhase')
</script>

<template>
  <section class="wf-tab" data-testid="files-tab" :aria-label="filesText('workFiles.tab.title')">
    <div class="wf-head">
      <dl class="wf-evidence" data-testid="files-evidence">
        <dt>{{ filesText('workFiles.tab.evidence') }}</dt>
        <dd>
          <span class="rp-trunc" data-testid="files-evidence-name">
            {{ evidence ?? filesText('workFiles.tab.none') }}
          </span>
          <span v-if="item.completion_evidence_required" class="wf-req">
            {{ filesText('workFiles.tab.evidenceRequired') }}
          </span>
          <button
            type="button"
            class="wf-linkbtn"
            data-testid="files-archive-link"
            disabled
            :title="archivePhase"
          >
            {{ filesText('workFiles.tab.archive') }}
            <span class="rp-sr">{{ archivePhase }}</span>
            <UiIcon name="chevron-right" size="sm" />
          </button>
        </dd>
      </dl>
      <UiButton
        v-if="access.canUpload.value"
        size="sm"
        variant="primary"
        icon="file-upload"
        data-testid="files-upload"
        @click="uploadOpen = true"
      >
        {{ filesText('workFiles.tab.upload') }}
      </UiButton>
    </div>

    <UiErrorState
      v-if="loadError"
      :error="loadError"
      retryable
      :retrying="files.isFetching.value"
      @retry="files.refetch()"
    />
    <p v-else-if="files.isPending.value" class="wf-status" role="status">
      {{ filesText('workFiles.tab.loading') }}
    </p>
    <UiEmptyState
      v-else-if="list.length === 0"
      icon="file"
      :title="filesText('workFiles.tab.empty')"
      :text="filesText('workFiles.tab.emptyText')"
    />
    <ul v-else class="wf-list" data-testid="files-list">
      <FileRow
        v-for="file in list"
        :key="file.file_id"
        :item="item"
        :file="file"
        :can-rename="access.canRename(file)"
        :can-delete="access.canDelete(file)"
      />
    </ul>

    <FileUploadDialog v-if="access.canUpload.value" v-model:open="uploadOpen" :item="item" />
  </section>
</template>
