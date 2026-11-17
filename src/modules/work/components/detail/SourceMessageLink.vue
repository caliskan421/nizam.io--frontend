<script setup lang="ts">
import './detail.css'

import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { chatMessageLocation } from '@/modules/chat/public'
import { UiButton } from '@/shared/ui'

import { useWorkItemSourceMessage } from '../../api/source-message'
import type { WorkTarget } from '../../model/types'
import { detailText } from './messages'

/**
 * "Kaynak mesaja git" (BE-085 ters bağ, P86): görev bir sohbet mesajından açıldıysa görev
 * ayrıntısında ortak düğmeyle gösterilir; tık `/mesajlar/:chatId?mesaj=<seq>` açar (mevcut
 * `around` okuması; yeni ekran yok). `source_message: null` (bağ yok / mesaj silinmiş / sohbet
 * programda değil / okuyanın erişimi yok), yükleniyor ve hata (403/404 dahil) durumlarında hiçbir
 * şey çizilmez: sunucu kaynağın varlığını sızdırmaz, istemci tahmin etmez. Okuma görevin kendi
 * kapsamıyla yapılır; kapsam ya da oturum değişince geç yanıt bu görünüme uygulanmaz (anahtar
 * kapsamlı, `sessionBound`).
 */
const props = defineProps<{ workItemId: string; target: WorkTarget | null }>()
const router = useRouter()
const source = useWorkItemSourceMessage(
  () => props.workItemId,
  () => props.target,
)
const message = computed(() => source.data.value?.source_message ?? null)

function open(): void {
  const found = message.value
  if (found === null) return
  void router.push(chatMessageLocation(found.chat_id, found.seq))
}
</script>

<template>
  <div v-if="message" class="wd-source" data-testid="detail-source-message">
    <UiButton variant="ghost" size="sm" icon="chat-link" @click="open">
      {{ detailText('workDetail.sourceMessage') }}
    </UiButton>
  </div>
</template>
