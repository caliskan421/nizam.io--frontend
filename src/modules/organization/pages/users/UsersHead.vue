<script setup lang="ts">
import './users-page.css'

import { DesignStub, UiButton, UiIcon } from '@/shared/ui'

import { usersText } from '../../components/users/messages'
import WorkloadReportButton from '../../components/users/WorkloadReportButton.vue'

/**
 * Başlık (E-05-02…05). Alt başlık yüklenen sayı (imleç bitmediyse "‹n›+ … yüklenen kayıtlar
 * içinde"; toplam yazılmaz — BE-011, P4). "Dışa aktar" devre dışı `designStub('BE-014')` (uç
 * yok; tık istek atmaz). İş yükü raporu düğmesi (E-13-59; `WorkloadReportButton`, yalnız ŞY) ilk eylemdir. Birincil eylem metni "Kullanıcı oluştur" (P14; e-posta daveti yok).
 */
defineProps<{ summary: string; canCreate: boolean }>()
const emit = defineEmits<{ create: [] }>()
</script>

<template>
  <div class="rp-head">
    <div>
      <h1 class="rp-h1">{{ usersText('users.title') }}</h1>
      <p class="rp-sub" data-testid="users-summary">{{ summary }}</p>
    </div>
    <div class="rp-actions">
      <WorkloadReportButton />
      <DesignStub id="BE-014">
        <button class="t-btn t-btn--secondary" type="button" disabled data-testid="users-export">
          <UiIcon name="download" size="sm" />
          <span class="rp-trunc">{{ usersText('users.export') }}</span>
        </button>
      </DesignStub>
      <UiButton
        v-if="canCreate"
        variant="primary"
        icon="user-plus"
        data-testid="users-create"
        @click="emit('create')"
      >
        {{ usersText('users.create') }}
      </UiButton>
    </div>
  </div>
</template>
