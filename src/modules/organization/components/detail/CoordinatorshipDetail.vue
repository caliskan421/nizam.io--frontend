<script setup lang="ts">
import './detail.css'

import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { toApiError } from '@/shared/errors/api-error'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiEmptyState, UiErrorState } from '@/shared/ui'

import { useOrganizationDashboard, useProgramDepartment } from '../../api'
import { can, organizationFacts } from '../../model/capabilities'
import type { CoordinatorshipView } from '../../model/types'
import { COORDINATORSHIPS_ROUTE } from '../../routes'
import type { CoordinatorshipDetailEmits, CoordinatorshipDetailProps } from '../index'
import DetailBody from './DetailBody.vue'
import { detailText } from './messages'

/**
 * W73 · 08b gövdesi (E-08-50…90). Birim `readProgramDepartment` ile TEK istekte okunur (BE-049,
 * v0.14: programdaki ad, kod, açıklama, tür; liste 200 tavanına ve listenin yüklenmesine bağlı
 * değil); şirket yöneticisinde rapor (`reportDashboard`, 08 ile AYNI anahtar) istatistiği verir —
 * birim başına rapor isteği yok (K3). 404 `program.department_not_found` ya da kapsam değişimi:
 * "Bu koordinatörlük seçili programda yok" (derin bağlantı).
 * Birimin ekibi ve görevleri (`listMembers`, `listProgramWorkItems?department_id=`) yalnız birim
 * bulunduktan sonra `DetailBody` içinde okunur (bulunamayan birim için istek yok).
 */
const props = withDefaults(defineProps<CoordinatorshipDetailProps>(), { tab: 'genel' })
const emit = defineEmits<CoordinatorshipDetailEmits>()

const store = useScopeStore()
const { standing } = useStanding()
const facts = computed(() =>
  organizationFacts(standing.value, store.programId, { departmentId: props.departmentId }),
)
const readReport = computed(() => can('readReport', facts.value))
const detail = useProgramDepartment(() => props.departmentId)
const report = useOrganizationDashboard(readReport)

const view = computed<CoordinatorshipView | null>(() => {
  const department = detail.department.value
  if (!department) return null
  const stat =
    report.data.value?.coordinatorship_stats?.find(
      (s) => s.department_id === department.department_id,
    ) ?? null
  return {
    departmentId: department.department_id,
    displayName: department.display_name,
    code: department.code ?? null,
    description: department.description ?? null,
    stat,
  }
})
const loadError = computed(() =>
  detail.query.isError.value && !detail.missing.value ? toApiError(detail.query.error.value) : null,
)
const back = { name: COORDINATORSHIPS_ROUTE.name }

function retry(): void {
  void detail.query.refetch()
}
</script>

<template>
  <section class="cd-page" data-testid="coordinatorship-detail">
    <DetailBody
      v-if="view"
      :view="view"
      :dashboard="report.data.value ?? null"
      :dashboard-error="report.isError.value"
      :report-loading="readReport && report.isPending.value"
      :tab="tab"
      @update:tab="emit('update:tab', $event)"
    />
    <div v-else class="cd-state">
      <div
        v-if="detail.query.isPending.value"
        class="cd-skeleton"
        role="status"
        :aria-label="detailText('coordinatorship.page.loading')"
        data-state="loading"
      >
        <span class="cd-skel cd-skel--code" />
        <span class="cd-skel cd-skel--title" />
      </div>
      <UiErrorState
        v-else-if="loadError"
        :error="loadError"
        :title="detailText('coordinatorship.page.error')"
        retryable
        :retrying="detail.query.isFetching.value"
        data-state="error"
        @retry="retry"
      />
      <UiEmptyState
        v-else
        icon="coords"
        :title="detailText('coordinatorship.page.missingTitle')"
        :text="detailText('coordinatorship.page.missingText')"
        data-state="missing"
      >
        <template #action>
          <RouterLink class="t-btn t-btn--secondary t-btn--sm" :to="back" data-action="back">
            {{ detailText('coordinatorship.page.back') }}
          </RouterLink>
        </template>
      </UiEmptyState>
    </div>
  </section>
</template>
