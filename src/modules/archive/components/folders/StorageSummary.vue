<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { FOLDER_SUMMARY } from '../../model/stubs'
import { formatBytes } from '../../model/mime'
import type { StorageSummaryProps } from '../index'
import './folders.css'

/**
 * Depolama özeti (E-06-22…24). Toplam dosya ve toplam boyut `totals`'tan (BE-025; okunana dek
 * `—`); dağılım çubuğu ve en büyük klasörler listesi için tür/etiket bazlı bayt alanı yok →
 * statik `—` (BE-025 kısmi, GAP-240: istemci dağılım uydurmaz), çubuk boş iz olarak durur.
 */
defineProps<StorageSummaryProps>()
const { t } = useI18n()
</script>

<template>
  <section class="t-card archive-storage" :aria-label="t('archive.folders.storage.kicker')">
    <p class="rp-kicker">{{ t('archive.folders.storage.kicker') }}</p>
    <p class="archive-storage__total" :aria-busy="loading ? 'true' : undefined">
      <span class="rp-num archive-storage__num" data-field="files">{{
        loading || totalFiles === null ? t('archive.shared.noValue') : totalFiles
      }}</span>
      <span class="rp-muted">{{ t('archive.folders.storage.files') }}</span>
    </p>
    <div
      v-if="!FOLDER_SUMMARY.storageBreakdown"
      class="rp-bar archive-storage__bar"
      role="img"
      :aria-label="t('archive.folders.storage.bar')"
    ></div>
    <dl class="rp-dl">
      <dt>{{ t('archive.folders.storage.total') }}</dt>
      <dd class="rp-mono" data-field="bytes">
        {{ loading || totalBytes === null ? t('archive.shared.noValue') : formatBytes(totalBytes) }}
      </dd>
      <template v-if="!FOLDER_SUMMARY.storageBreakdown">
        <dt>{{ t('archive.folders.storage.breakdown') }}</dt>
        <dd class="rp-mono" data-field="breakdown">{{ t('archive.shared.noValue') }}</dd>
      </template>
    </dl>
  </section>
</template>
