<script setup lang="ts">
import { computed } from 'vue'

import { ReportActionButton } from '@/modules/reports/public'
import { useToast } from '@/shared/ui'

import { injectWorkloadSelection, workloadText } from './use-workload-selection'

/**
 * 05 başlığı "İş yükü raporu (PDF)" (E-13-59; yalnız `canExportWorkload`). Seçim yoksa bütün
 * üyeler (`memberIds` boş), seçim varsa "Seçilenlerin iş yükü (PDF) · N" (etiket ve durum
 * makinesi ortak `ReportActionButton`'dan). 422 `reporting.input_invalid` (ekip dışı/silinmiş
 * hesap): seçim yenilenir (temizlenir) ve bildirim verilir; otomatik tekrar yok. Bildirim
 * kurulumda alınan `useToast` ile (sökülmüş ekran bildirim üretmez).
 */
const selection = injectWorkloadSelection()
const toast = useToast()

const reason = computed(() =>
  selection?.programReady.value === false ? workloadText('noProgram') : undefined,
)

function failed(code: string): void {
  if (code !== 'reporting.input_invalid') return
  selection?.clear()
  toast.push({ message: workloadText('refreshed') })
}
</script>

<template>
  <span v-if="selection?.enabled.value" class="users-workload" data-testid="users-workload">
    <ReportActionButton
      kind="workload"
      :member-ids="selection.ids.value"
      :disabled-reason="reason"
      @failed="failed"
    />
  </span>
</template>
