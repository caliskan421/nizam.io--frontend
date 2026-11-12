<script setup lang="ts">
import { UiIcon } from '@/shared/ui'

import { deletedText } from '../model/messages'

/**
 * Satır içi bildirim: görevin koordinatörlüğü silinmiş olduğundan geri yüklenemediğinde (409
 * `work.department_unavailable`) "önce koordinatörlüğü geri yükle" yolu — Koordinatörlük
 * sekmesine bağlantı. Yüklenen sunucu metni gösterilmez.
 */
defineProps<{ message: string; departmentsLink: boolean }>()
const emit = defineEmits<{ departments: []; dismiss: [] }>()
</script>

<template>
  <div class="dr-notice" role="alert" data-testid="dr-notice">
    <UiIcon name="alert" size="sm" />
    <p class="dr-notice__text">{{ message }}</p>
    <button
      v-if="departmentsLink"
      type="button"
      class="t-btn t-btn--secondary t-btn--sm"
      data-testid="dr-open-departments"
      @click="emit('departments')"
    >
      {{ deletedText('feedback.openDepartments') }}
    </button>
    <button type="button" class="t-btn t-btn--ghost t-btn--sm" @click="emit('dismiss')">
      {{ deletedText('feedback.dismiss') }}
    </button>
  </div>
</template>
