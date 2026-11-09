<script setup lang="ts">
import './detail.css'

import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { toApiError } from '@/shared/errors/api-error'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiEmptyState, UiErrorState } from '@/shared/ui'

import { useCoordinatorships } from '../../api'
import { can, organizationFacts } from '../../model/capabilities'
import { findCoordinatorship } from '../../model/coordinatorships'
import { COORDINATORSHIPS_ROUTE } from '../../routes'
import type { CoordinatorshipDetailEmits, CoordinatorshipDetailProps } from '../index'
import DetailBody from './DetailBody.vue'
import { detailText } from './messages'

/**
 * W73 · 08b gövdesi (E-08-50…90). Tek departman okuma ucu yok (BE-049): birim, seçili programın
 * `listProgramDepartments` listesinden seçilir; şirket yöneticisinde rapor (`reportDashboard`,
 * 08 ile AYNI anahtar) aynı birleşimden istatistiği verir — birim başına istek yok (K3).
 * Listede yoksa "Bu koordinatörlük seçili programda yok" (derin bağlantı / kapsam değişimi).
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
const data = useCoordinatorships(readReport)

const view = computed(() => findCoordinatorship(data.views.value, props.departmentId))
const listError = computed(() =>
  data.departments.isError.value ? toApiError(data.departments.error.value) : null,
)
const back = { name: COORDINATORSHIPS_ROUTE.name }

function retry(): void {
  void data.departments.refetch()
}
</script>

<template>
  <section class="cd-page" data-testid="coordinatorship-detail">
    <DetailBody
      v-if="view"
      :view="view"
      :dashboard="data.dashboard.data.value ?? null"
      :dashboard-error="data.dashboard.isError.value"
      :report-loading="readReport && data.dashboard.isPending.value"
      :tab="tab"
      @update:tab="emit('update:tab', $event)"
    />
    <div v-else class="cd-state">
      <div
        v-if="data.departments.isPending.value"
        class="cd-skeleton"
        role="status"
        :aria-label="detailText('coordinatorship.page.loading')"
        data-state="loading"
      >
        <span class="cd-skel cd-skel--code" />
        <span class="cd-skel cd-skel--title" />
      </div>
      <UiErrorState
        v-else-if="listError"
        :error="listError"
        :title="detailText('coordinatorship.page.error')"
        retryable
        :retrying="data.departments.isFetching.value"
        data-state="error"
        @retry="retry"
      />
      <UiEmptyState
        v-else
        icon="coords"
        :title="detailText('coordinatorship.page.missingTitle')"
        :text="
          data.departmentsTruncated.value
            ? detailText('coordinatorship.page.truncated')
            : detailText('coordinatorship.page.missingText')
        "
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
