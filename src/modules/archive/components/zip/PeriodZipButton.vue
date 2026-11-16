<script setup lang="ts">
import './zip.css'

import { computed, onBeforeUnmount, ref } from 'vue'

import { authSession } from '@/shared/http'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiButton } from '@/shared/ui'

import { archiveCapabilities } from '../../model/capabilities'
import { zipText } from './messages'
import PeriodZipDialog from './PeriodZipDialog.vue'
import { usePeriodZip } from './use-period-zip'

/**
 * E-06-04 — dönem arşivi "Dönem arşivi (ZIP)" (06; yalnız ŞY, RECORDS-K24). Düğme onay penceresini
 * açar (E-13-10); "Hazırla ve indir" `programArchiveZip`'i (S2, yalnız program başlığı; BE-120) raporlu
 * (`include_reports=true`, BE-124) bilet hedefiyle indirir. Departman seçimi gerekmez. Yetkisiz
 * hesapta düğme gizlidir (gizleme güvenlik değildir, sunucu 403 verir). Metinler `zip-status.ts`;
 * otomatik tekrar yok. `Retry-After` taşıyan 429/503'te "Bekleyin (N s)" sayacı çalışır, düğme
 * `aria-disabled` olur (odak kaybolmaz) ve süre bitince açılır (CX-F8-Ö-01). Program/oturum değişince açık pencere kapanır (bayat bağlam yazma başlatmaz).
 */
const store = useScopeStore()
const { standing } = useStanding()
const visible = computed(() => archiveCapabilities(standing.value, store.programId).periodZip())
const zip = usePeriodZip(() => store.programId)

const confirming = ref(false)
const waiting = computed(() => zip.cooldown.value > 0)
const noteText = computed(() => {
  if (waiting.value) return zipText('cooldown', { seconds: zip.cooldown.value })
  if (zip.phase.value === 'busy') return zipText('period.busy')
  if (zip.phase.value === 'saved') {
    return zip.truncated.value ? zipText('period.truncated') : zipText('period.saved')
  }
  return zip.error.value
})

function onConfirm(): void {
  confirming.value = false
  void zip.start()
}

function closeDialog(): void {
  confirming.value = false
}
const stopScope = store.onChange(closeDialog)
let generation = authSession.generation
let account = authSession.snapshot.accountId
const stopSession = authSession.subscribe((snapshot) => {
  if (generation !== authSession.generation || account !== snapshot.accountId) closeDialog()
  generation = authSession.generation
  account = snapshot.accountId
})
onBeforeUnmount(() => {
  stopScope()
  stopSession()
})
</script>

<template>
  <span v-if="visible" class="zip" data-testid="period-zip">
    <UiButton
      variant="secondary"
      icon="download"
      :aria-busy="zip.busy.value"
      :aria-describedby="noteText ? 'period-zip-note' : undefined"
      aria-haspopup="dialog"
      :aria-disabled="waiting ? 'true' : undefined"
      data-testid="period-zip-button"
      @click="confirming = !waiting"
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
    <PeriodZipDialog v-model:open="confirming" @confirm="onConfirm" />
  </span>
</template>
