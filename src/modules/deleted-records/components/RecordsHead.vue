<script setup lang="ts">
import { DesignStub, UiIcon } from '@/shared/ui'

import { deletedText } from '../model/messages'

/**
 * Sayfa başlığı (E-12-03/04/05/06): H1, alt başlık ("‹N› ‹tür› · yalnız yönetici görür", özet
 * sayısı kesin) ve başlık eylemleri (CSV indir, Çöpü boşalt).
 */
defineProps<{ subtitle: string }>()
</script>

<template>
  <div class="rp-head">
    <div>
      <h1 class="rp-h1">{{ deletedText('page.title') }}</h1>
      <p class="rp-sub" data-testid="dr-sub">{{ subtitle }}</p>
    </div>
    <div class="rp-actions">
      <DesignStub id="BE-116">
        <button
          type="button"
          class="t-btn t-btn--secondary"
          disabled
          data-testid="dr-csv"
          :title="deletedText('head.soonHint')"
        >
          <UiIcon name="download" size="sm" />{{ deletedText('head.csv') }}
        </button>
      </DesignStub>
      <DesignStub id="BE-115">
        <button
          type="button"
          class="t-btn t-btn--ghost dr-danger"
          disabled
          data-testid="dr-empty-trash"
          :title="deletedText('head.soonHint')"
        >
          <UiIcon name="trash" size="sm" />{{ deletedText('head.trash') }}
        </button>
      </DesignStub>
    </div>
  </div>
</template>
