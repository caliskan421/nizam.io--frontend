<script setup lang="ts">
import { UiIcon } from '@/shared/ui'

import { deletedText } from '../model/messages'

/**
 * Sayfa başlığı (E-12-03/04/05/06): H1, alt başlık ("‹N› ‹tür› · yalnız yönetici görür", özet
 * sayısı kesin) ve başlık eylemleri (CSV indir: bilet akışı, BE-116; Çöpü boşalt: BE-115, BE-163).
 * Çöpü boşalt her tek tür görünümünde ve `Not ve gündem`de etkindir; `Tümü`de bilerek devre dışıdır
 * (bir tür seçilir; görünüm politikası, sözleşme eksiği değil).
 */
defineProps<{
  subtitle: string
  /** Çöpü boşalt etkin görünüm mü (`Tümü` hariç hepsi). */
  purgeAllOn: boolean
  /** Çöpü boşalt paneli açık mı (`aria-expanded`; `aria-controls` yalnız açıkken). */
  purgeAllOpen: boolean
  /** Bir yazma sürüyor (çift tık kilidi). */
  busy: boolean
  /** CSV hazırlanıyor (tek uçuş). */
  exporting: boolean
}>()
const emit = defineEmits<{ purgeAll: []; exportCsv: [] }>()
</script>

<template>
  <div class="rp-head">
    <div>
      <h1 class="rp-h1">{{ deletedText('page.title') }}</h1>
      <p class="rp-sub" data-testid="dr-sub">{{ subtitle }}</p>
    </div>
    <div class="rp-actions">
      <button
        type="button"
        class="t-btn t-btn--secondary"
        :aria-disabled="exporting ? 'true' : undefined"
        :title="deletedText('export.hint')"
        data-testid="dr-csv"
        @click="!exporting && emit('exportCsv')"
      >
        <UiIcon name="download" size="sm" />{{ deletedText('head.csv') }}
      </button>
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
      <button
        v-else
        type="button"
        class="t-btn t-btn--ghost dr-danger"
        disabled
        data-testid="dr-empty-trash"
        :title="deletedText('purgeAll.pickKind')"
      >
        <UiIcon name="trash" size="sm" />{{ deletedText('head.trash') }}
      </button>
    </div>
  </div>
</template>
