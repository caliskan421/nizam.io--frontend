<script setup lang="ts">
import { useI18n } from 'vue-i18n'
defineProps<{
  program: string
  /** `tab_counts` (BE-021); okuma gelene dek `null`. */
  upcoming: number | null
  past: number | null
  lensText: string
  canCreate: boolean
}>()
defineEmits<{ create: [] }>()
const { t } = useI18n()
</script>
<template>
  <header class="rp-head">
    <div>
      <h1 class="rp-h1">{{ t('meetings.list.title') }}</h1>
      <p class="rp-sub">
        {{ program }} ·
        <template v-if="upcoming !== null && past !== null"
          >{{ t('meetings.list.counts', { upcoming, past }) }} ·
        </template>
        {{ lensText }}
      </p>
    </div>
    <button v-if="canCreate" class="t-btn t-btn--primary" @click="$emit('create')">
      {{ t('meetings.list.create') }}
    </button>
  </header>
</template>
