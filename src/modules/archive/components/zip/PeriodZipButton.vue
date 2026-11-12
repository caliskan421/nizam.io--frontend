<script setup lang="ts">
import './zip.css'

import { computed } from 'vue'

import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiButton } from '@/shared/ui'

import { archiveCapabilities } from '../../model/capabilities'
import type { PeriodZipButtonProps } from '../index'
import { zipText } from './messages'
import { useZipDownload } from './use-zip-download'

/**
 * E-06-04 — dönem ZIP'i "Tümünü indir" (06; yalnız ŞY, RECORDS-K24). `target` `null` (yönetici
 * `/arsiv`'te departman başlığı yok; `archiveFullZip` S3 — BE-120) → düğme devre dışı + açıklama;
 * keyfî departman başlığı UYDURULMAZ, ağ isteği yok. Yetkisiz hesapta düğme gizlidir. Metinler
 * `zip-status.ts`; otomatik tekrar yok.
 */
const props = defineProps<PeriodZipButtonProps>()

const store = useScopeStore()
const { standing } = useStanding()
const visible = computed(() => archiveCapabilities(standing.value, store.programId).periodZip())
const zip = useZipDownload('period', () => (props.target ? JSON.stringify(props.target) : ''))

const unavailable = computed(() => props.target === null)
const noteText = computed(() => {
  if (unavailable.value) return zipText('period.unavailable')
  if (zip.phase.value === 'busy') return zipText('period.busy')
  if (zip.phase.value === 'saved') return zipText('period.saved')
  return zip.error.value
})

function onClick(): void {
  if (props.target === null) return
  void zip.start({ target: props.target, kind: 'period', fallbackName: 'arsiv.zip' })
}
</script>

<template>
  <span v-if="visible" class="zip" data-testid="period-zip">
    <UiButton
      variant="secondary"
      icon="download"
      :disabled="unavailable"
      :aria-busy="zip.busy.value"
      :aria-describedby="noteText ? 'period-zip-note' : undefined"
      data-testid="period-zip-button"
      @click="onClick"
    >
      {{ zipText('period.label') }}
    </UiButton>
    <span
      v-if="noteText"
      id="period-zip-note"
      class="zip__note"
      :class="{ 'zip__note--error': zip.phase.value === 'failed' }"
      :role="zip.phase.value === 'failed' ? 'alert' : 'status'"
      data-testid="period-zip-note"
    >
      {{ noteText }}
    </span>
  </span>
</template>
