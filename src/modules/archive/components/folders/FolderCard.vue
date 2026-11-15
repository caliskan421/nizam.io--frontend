<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { useInstanceStore } from '@/shared/instance/store'

import { formatBytes } from '../../model/mime'
import { daysSince } from '../../model/relative-days'
import { ARCHIVE_FOLDER_ROUTE } from '../../routes'
import type { FolderCardEmits, FolderCardProps } from '../index'
import './folders.css'

/**
 * Klasör kartı (E-06-10…15). Hepsi sunucudandır (K/Ü `archiveFolders`, yönetici
 * `programArchiveFolders`, BE-072/BE-025): "‹N› dosya · ‹M› görev" (dosyasızda "Henüz dosya yok"),
 * boyut ("0 B" boş klasörde) ve son yükleme göreli gün (kurulum saat diliminde; yükleme yoksa `—`). "grup" rozeti yok
 * (P39). Boş klasör (`fileCount === 0`) soluk ama listede. Gerçek bağlantıdır (yeni sekmede
 * açılır); düz sol tık `open` yayar.
 */
const props = defineProps<FolderCardProps>()
const emit = defineEmits<FolderCardEmits>()
const { t } = useI18n()
const router = useRouter()

const href = computed(
  () =>
    router.resolve({ name: ARCHIVE_FOLDER_ROUTE.name, params: { klasorId: props.card.folderId } })
      .href,
)
const empty = computed(() => props.card.fileCount === 0)
const meta = computed(() =>
  empty.value
    ? t('archive.folders.card.emptyFolder')
    : t('archive.folders.card.filesAndTasks', {
        count: props.card.fileCount,
        tasks: props.card.taskCount,
      }),
)
const instance = useInstanceStore()
const last = computed(() => {
  const days = daysSince(props.card.lastUploadedAt, new Date(), instance.profile?.timezone)
  if (days === null) return t('archive.shared.noValue')
  if (days === 0) return t('archive.folders.card.today')
  return days === 1
    ? t('archive.folders.card.yesterday')
    : t('archive.folders.card.daysAgo', { n: days })
})

function onClick(event: MouseEvent): void {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  emit('open', props.card.folderId)
}
</script>

<template>
  <a
    class="rp-folder archive-folder"
    :class="{ 'archive-folder--empty': empty }"
    :href="href"
    :data-folder-id="card.folderId"
    @click="onClick"
  >
    <span class="rp-folder__icon" aria-hidden="true"></span>
    <span class="rp-clamp2 archive-folder__name">{{ card.name }}</span>
    <span class="archive-folder__foot">
      <span class="rp-cap rp-trunc" data-field="meta">{{ meta }}</span>
      <span class="archive-folder__row">
        <span class="rp-mono rp-trunc" data-field="size" :title="t('archive.folders.card.size')">{{
          formatBytes(card.totalBytes)
        }}</span>
        <span
          class="rp-kicker rp-nowrap archive-folder__rel"
          data-field="last"
          :title="t('archive.folders.card.lastUpload')"
          >{{ last }}</span
        >
      </span>
    </span>
  </a>
</template>
