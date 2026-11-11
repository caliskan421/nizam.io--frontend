<script setup lang="ts">
import { useI18n } from 'vue-i18n'
defineProps<{
  program: string
  upcoming: number
  past: number
  complete: boolean
  lensText: string
  filtered: boolean
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
        {{ program }} · {{ complete ? '' : t('meetings.list.atLeast') }}
        {{ t('meetings.list.counts', { upcoming, past }) }} · {{ lensText }}
        <template v-if="filtered">· {{ t('meetings.list.loaded') }}</template>
      </p>
    </div>
    <button v-if="canCreate" class="t-btn t-btn--primary" @click="$emit('create')">
      {{ t('meetings.list.create') }}
    </button>
  </header>
</template>
