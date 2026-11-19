<script setup lang="ts">
import type { ApiError } from '@/shared/errors/api-error'
import { UiButton, UiErrorState, UiIcon } from '@/shared/ui'

import type { TableSummary } from '../model/types'

defineProps<{
  items: TableSummary[]
  pending: boolean
  fetching: boolean
  hasNext: boolean
  error: ApiError | null
  formOpen: boolean
  canCreate: boolean
}>()
defineEmits<{ blank: []; select: [source: TableSummary]; retry: []; more: [] }>()
</script>

<template>
  <section class="tables-catalog-section" aria-labelledby="table-templates-title">
    <h2 id="table-templates-title">Hızlı başlangıç</h2>
    <div class="tables-templates">
      <button
        id="tables-blank-trigger"
        type="button"
        class="t-card tables-template"
        :disabled="formOpen || !canCreate"
        @click="$emit('blank')"
      >
        <span class="tables-template-icon tables-template-icon--blank"><UiIcon name="plus" /></span>
        <span><strong>Boş tablo</strong><small>Sütunları kendin belirle</small></span>
      </button>
      <template v-if="!error">
        <button
          v-for="item in items"
          :id="'tables-template-' + item.id"
          :key="item.id"
          type="button"
          class="t-card tables-template"
          :aria-label="item.name + ' şablonundan oluştur'"
          :disabled="formOpen"
          @click="$emit('select', item)"
        >
          <span class="tables-template-icon"><UiIcon name="sheets" /></span>
          <strong>{{ item.name }}</strong>
        </button>
      </template>
    </div>
    <p v-if="pending" class="tables-muted" role="status">Şablonlar yükleniyor…</p>
    <UiErrorState
      v-else-if="error"
      :error="error"
      title="Şablonlar yüklenemedi"
      :retrying="fetching"
      :retryable="error.status !== 403 && error.status !== 404"
      @retry="$emit('retry')"
    />
    <p v-else-if="!items.length" class="tables-muted">
      Bu çalışma alanında erişilebilir şablon yok.
    </p>
    <UiButton v-if="hasNext && !error" size="sm" :disabled="fetching" @click="$emit('more')">
      Daha fazla şablon
    </UiButton>
  </section>
</template>
