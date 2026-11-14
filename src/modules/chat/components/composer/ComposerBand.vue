<script setup lang="ts">
import './composer.css'

import { UiIconButton } from '@/shared/ui'

import { chatText } from '../../messages'

/**
 * Bağlam şeridi (E-10-51): yanıt ("<Ad Soyad> kişisine yanıt" + tek satır alıntı + Vazgeç) ya da
 * düzenleme ("Düzenleniyor" + Vazgeç; tasarımda çizilmemiş, P3 — yanıt şeridinin kalıbı).
 */
defineProps<{ title: string; text: string }>()
const emit = defineEmits<{ cancel: [] }>()
</script>

<template>
  <div class="chat-composer__ctx" data-testid="chat-composer-band">
    <span class="chat-composer__mark" aria-hidden="true" />
    <span class="chat-composer__what">
      <strong>{{ title }}</strong>
      <span>{{ text }}</span>
    </span>
    <UiIconButton icon="close" :label="chatText('chat.composer.cancel')" @click="emit('cancel')" />
  </div>
</template>
