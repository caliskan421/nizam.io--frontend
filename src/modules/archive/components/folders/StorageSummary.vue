<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { cssVar } from '@/shared/tokens/css-var'

import { formatBytes } from '../../model/mime'
import { tagRows, typeRows, type DistributionRow } from '../../model/storage-distribution'
import type { StorageSummaryEmits, StorageSummaryProps } from '../index'
import './folders.css'

/**
 * Depolama özeti (E-06-22…24). Toplam dosya/boyut ve tür ile etiket dağılımı `totals`'tan
 * (BE-025); okunana dek `—`. Dağılım dönen dosyaların TÜR ve ETİKET kırılımıdır (klasör değil);
 * satır sırası sunucunundur, yüzde bayt oranıdır. Okunamadı (`error`) gerçek boştan ayrıdır.
 */
const props = defineProps<StorageSummaryProps>()
const emit = defineEmits<StorageSummaryEmits>()
const { t } = useI18n()

interface Axis {
  id: 'type' | 'tag'
  rows: DistributionRow[] | null
}
const axes = computed<Axis[]>(() => [
  { id: 'type', rows: typeRows(props.byType ?? undefined, props.totalBytes) },
  { id: 'tag', rows: tagRows(props.byTag ?? undefined, props.totalBytes) },
])

const failed = computed(() => props.error === true && !props.loading)
const known = (rows: DistributionRow[] | null): rows is DistributionRow[] =>
  !props.loading && !failed.value && rows !== null

const label = (row: DistributionRow): string =>
  row.label ?? t(`archive.folders.storage.types.${row.key}`, row.key)
const percentText = (row: DistributionRow): string =>
  `%${Math.round(row.percent).toLocaleString('tr-TR')}`
const summary = (row: DistributionRow): string =>
  `${label(row)} ${percentText(row)}, ${t('archive.folders.storage.rowCount', { n: row.fileCount })}, ${formatBytes(row.bytes)}`
const barLabel = (axis: Axis): string =>
  `${t(`archive.folders.storage.${axis.id}`)}: ${(axis.rows ?? []).map((row) => summary(row)).join('; ')}`
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
    <dl class="rp-dl">
      <dt>{{ t('archive.folders.storage.total') }}</dt>
      <dd class="rp-mono" data-field="bytes">
        {{ loading || totalBytes === null ? t('archive.shared.noValue') : formatBytes(totalBytes) }}
      </dd>
    </dl>
    <div v-if="failed" class="archive-storage__error" role="alert" data-field="error">
      <p class="rp-cap">{{ t('archive.folders.storage.error') }}</p>
      <button type="button" class="rp-menuitem" data-action="retry" @click="emit('retry')">
        {{ t('archive.folders.storage.retry') }}
      </button>
    </div>
    <section
      v-for="axis in axes"
      :key="axis.id"
      class="archive-storage__group"
      :data-axis="axis.id"
      :aria-label="t(`archive.folders.storage.${axis.id}`)"
    >
      <h3 class="rp-kicker">{{ t(`archive.folders.storage.${axis.id}`) }}</h3>
      <template v-if="known(axis.rows)">
        <p v-if="axis.rows.length === 0" class="rp-cap" data-field="empty">
          {{ t('archive.folders.storage.empty') }}
        </p>
        <template v-else>
          <div class="rp-bar archive-storage__bar" role="img" :aria-label="barLabel(axis)">
            <span
              v-for="row in axis.rows"
              :key="row.key"
              class="archive-storage__seg"
              :style="{ width: `${row.percent}%`, '--archive-tone': cssVar(row.tone) }"
            ></span>
          </div>
          <ul class="archive-storage__list">
            <li v-for="row in axis.rows" :key="row.key" :data-key="row.key">
              <span
                class="rp-dot archive-tags__dot"
                aria-hidden="true"
                :style="{ '--archive-tone': cssVar(row.tone) }"
              ></span>
              <span class="rp-trunc archive-storage__name">{{ label(row) }}</span>
              <span class="rp-mono archive-storage__meta">
                {{ t('archive.folders.storage.rowCount', { n: row.fileCount }) }} ·
                {{ formatBytes(row.bytes) }} · {{ percentText(row) }}
              </span>
            </li>
          </ul>
        </template>
      </template>
      <p v-else class="rp-mono" data-field="breakdown">{{ t('archive.shared.noValue') }}</p>
    </section>
  </section>
</template>
