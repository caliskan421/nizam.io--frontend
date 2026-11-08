<script setup lang="ts">
import './styles/ui.css'

import { computed } from 'vue'

import type { ApiError } from '@/shared/errors/api-error'
import { errorText } from '@/shared/i18n'

import { uiText } from './messages'
import UiButton from './UiButton.vue'
import UiIcon from './UiIcon.vue'

/**
 * Hata durumu: metin yalnız hata kodundan (i18n `messageKey`; sunucu `message` alanı yok),
 * altında destek için istek kimliği (`X-Request-Id`). `retryable` iken "Yeniden dene" → `retry`.
 */
const props = withDefaults(
  defineProps<{
    error: Pick<ApiError, 'messageKey' | 'requestId'>
    title?: string
    retryable?: boolean
    retrying?: boolean
  }>(),
  { title: undefined, retryable: false, retrying: false },
)
const emit = defineEmits<{ retry: [] }>()
const message = computed(() => errorText(props.error))
</script>

<template>
  <div class="rp-empty ui-error" role="alert">
    <UiIcon name="alert" size="lg" />
    <p v-if="title" class="rp-empty__title">{{ title }}</p>
    <p class="rp-empty__text">{{ message }}</p>
    <p v-if="error.requestId" class="rp-empty__text">
      {{ uiText('ui.error.requestId') }}:
      <code class="ui-error__rid">{{ error.requestId }}</code>
    </p>
    <UiButton v-if="retryable" size="sm" :disabled="retrying" @click="emit('retry')">
      {{ uiText('ui.error.retry') }}
    </UiButton>
  </div>
</template>
