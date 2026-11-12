<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { ARCHIVE_FOLDER_ROUTE } from '../../routes'
import type { FolderCardEmits, FolderCardProps } from '../index'
import './folders.css'
import { FOLDER_SUMMARY } from '../../model/stubs'

/**
 * Klasör kartı (E-06-10…15). Sayılar `null` iken statik `—` (yönetici, BE-072/BE-025); boyut ve
 * son yükleme alanı yokken (BE-025) her zaman `—`: örnek boyut/tarih üretilmez. "grup" rozeti yok
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
  props.card.fileCount === null
    ? t('archive.shared.noValue')
    : empty.value
      ? t('archive.folders.card.emptyFolder')
      : t('archive.folders.card.files', { count: props.card.fileCount }),
)

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
        <span
          v-if="!FOLDER_SUMMARY.totalBytes"
          class="rp-mono rp-trunc"
          data-field="size"
          :title="t('archive.folders.card.size')"
          >{{ t('archive.shared.noValue') }}</span
        >
        <span
          v-if="!FOLDER_SUMMARY.lastUploadedAt"
          class="rp-kicker rp-nowrap archive-folder__rel"
          data-field="last"
          :title="t('archive.folders.card.lastUpload')"
          >{{ t('archive.shared.noValue') }}</span
        >
      </span>
    </span>
  </a>
</template>
