<script setup lang="ts">
import './reports.css'

import { useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'

import { reportCapabilities } from '../model/capabilities'
import ReportActionButton from './ReportActionButton.vue'
import { t } from './text'

/**
 * "Görev raporu (PDF)" (03 görev ayrıntı paneli ve K3 paneli alt eylem şeridi; E-13-55/56).
 * Bağlama (KESİN 28): `work/components/detail/DetailActions.vue`. Görünürlük: ŞY ∨ görevin
 * birimini koordine eden K (`reportCapabilities`; üye göremez). Web önizlemesi YOKTUR (E-13-57,
 * P52). Silinmiş görevde panel açılmaz (E-13-58). 404 `reporting.not_found` → "Kayıt bulunamadı"
 * bildirimi + görev okumaları tazelenir (panel kendi 404 akışıyla kapanır).
 */
const props = defineProps<{ item: { work_item_id: string; department_id: string } }>()
const scope = useScopeStore()
const toast = useToast()
const client = useQueryClient()
const { standing } = useStanding()
const visible = computed(() =>
  reportCapabilities(standing.value, scope.programId).canExportTaskReport({
    departmentId: props.item.department_id,
  }),
)

function onFailed(code: string): void {
  if (code !== 'reporting.not_found') return
  toast.push({ message: t('reports.states.notFound'), tone: 'danger' })
  void client.invalidateQueries({ queryKey: queryKeys.workItems.all(scope.snapshot) })
}
</script>

<template>
  <div v-if="visible" class="report-task" data-testid="task-report">
    <ReportActionButton kind="task" :target-id="props.item.work_item_id" @failed="onFailed" />
  </div>
</template>
