<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { toApiError } from '@/shared/errors/api-error'
import { UiEmptyState, UiErrorState } from '@/shared/ui'
defineProps<{ loading: boolean; error: unknown; retrying: boolean }>()
defineEmits<{ retry: [] }>()
const { t } = useI18n()
</script>
<template>
  <UiEmptyState v-if="loading" :title="t('meetings.list.loading')" aria-busy="true" />
  <UiErrorState
    v-else
    :error="toApiError(error)"
    :title="t('meetings.list.error')"
    retryable
    :retrying="retrying"
    @retry="$emit('retry')"
  />
</template>
