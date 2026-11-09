<script setup lang="ts">
import './detail.css'

import { computed } from 'vue'

import { DesignStub, UiIconButton, useToast } from '@/shared/ui'

import {
  canManageWorkItem,
  canRequestDateChange,
  canUploadFile,
  type WorkActorFacts,
} from '../../model/capabilities'
import type { WorkItem } from '../../model/types'
import { taskLink } from '../../routes'
import DeleteTaskAction from '../forms/DeleteTaskAction.vue'
import { detailText } from './messages'

/**
 * Görev düzeyi eylem satırı (`rp-iconrow--icons`; E-03-52…56). Yetkisiz eylem gizlenir (P1,
 * `capabilities.ts`); BE kaynaklı eksik eylem devre dışı + stub.
 *  - Kanıt yükle (s.148; yönetici gizli) → `upload` (çağıran `FileUploadDialog`'u açar).
 *  - Hatırlat: uç yok → devre dışı, `BE-008`.
 *  - Tarih değişikliği iste (s.151; bekleyen talep varken gizli): F3'e kadar devre dışı, faz
 *    notu (stub değil, P5).
 *  - Kopyala (P7): görev bağlantısı panoya + bildirim; yazma isteği yok.
 *  - Görevi sil (s.139): `DeleteTaskAction` (W45; istemci onayı).
 */
const props = defineProps<{ item: WorkItem; facts: WorkActorFacts }>()
const emit = defineEmits<{ upload: []; deleted: [workItemId: string] }>()

const t = detailText
const toast = useToast()
const canUpload = computed(() => canUploadFile(props.facts))
const canManage = computed(() => canManageWorkItem(props.facts))
const canDateRequest = computed(() =>
  canRequestDateChange({
    ...props.facts,
    pendingDateRequest: props.item.pending_date_request !== null,
  }),
)

async function copyLink(): Promise<void> {
  try {
    await navigator.clipboard.writeText(taskLink(window.location.origin, props.item.work_item_id))
    toast.push({ message: t('workDetail.actions.copied') })
  } catch {
    toast.push({ message: t('workDetail.actions.copyFailed'), tone: 'danger' })
  }
}
</script>

<template>
  <div class="wd-actions" role="group" :aria-label="t('workDetail.actions.label')">
    <UiIconButton
      v-if="canUpload"
      class="wd-upbtn"
      icon="file-upload"
      size="md"
      icon-size="md"
      data-action="upload"
      :label="t('workDetail.actions.upload')"
      @click="emit('upload')"
    />
    <DesignStub id="BE-008">
      <UiIconButton
        icon="bell"
        size="md"
        data-action="remind"
        :label="t('workDetail.actions.remind')"
        disabled
      />
    </DesignStub>
    <UiIconButton
      v-if="canDateRequest"
      icon="calendar"
      size="md"
      data-action="date-request"
      :label="t('workDetail.actions.dateRequest')"
      disabled
    />
    <UiIconButton
      icon="copy"
      size="md"
      data-action="copy"
      :label="t('workDetail.actions.copy')"
      @click="copyLink"
    />
    <DeleteTaskAction v-if="canManage" :item="item" @deleted="(id) => emit('deleted', id)" />
  </div>
</template>
