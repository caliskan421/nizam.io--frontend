<script setup lang="ts">
import { DesignStub, UiIcon } from '@/shared/ui'

import { deletedText } from '../model/messages'

/**
 * Sayfa başlığı (E-12-03/04/05/06): H1, alt başlık ("‹N› ‹tür› · yalnız yönetici görür", özet
 * sayısı kesin) ve başlık eylemleri (CSV indir, Çöpü boşalt). Çöpü boşalt görev, toplantı ve
 * kullanıcıda etkindir; koordinatörlükte devre dışı kalır (uç şirket geneli çalışır ve programa
 * bağlı silinmişleri silemez: sekme kümesiyle örtüşmez; kalan stub BE-115).
 */
defineProps<{
  subtitle: string
  /** Çöpü boşalt etkin tür mü (görev, toplantı, kullanıcı; BE-115). */
  purgeAllOn: boolean
  /** Çöpü boşalt paneli açık mı (`aria-expanded`; `aria-controls` yalnız açıkken). */
  purgeAllOpen: boolean
  /** Bir yazma sürüyor (çift tık kilidi). */
  busy: boolean
}>()
const emit = defineEmits<{ purgeAll: [] }>()
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
      <button
        v-if="purgeAllOn"
        type="button"
        class="t-btn t-btn--ghost dr-danger"
        :aria-expanded="purgeAllOpen ? 'true' : 'false'"
        :aria-controls="purgeAllOpen ? 'dr-purgeall' : undefined"
        :aria-disabled="busy ? 'true' : undefined"
        data-testid="dr-empty-trash"
        @click="!busy && emit('purgeAll')"
      >
        <UiIcon name="trash" size="sm" />{{ deletedText('head.trash') }}
      </button>
      <DesignStub v-else id="BE-115">
        <button
          type="button"
          class="t-btn t-btn--ghost dr-danger"
          disabled
          data-testid="dr-empty-trash"
          :title="deletedText('purgeAll.unsupported')"
        >
          <UiIcon name="trash" size="sm" />{{ deletedText('head.trash') }}
        </button>
      </DesignStub>
    </div>
  </div>
</template>
