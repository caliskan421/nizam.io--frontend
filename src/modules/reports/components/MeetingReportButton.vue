<script setup lang="ts">
import './reports.css'

import { useQueryClient } from '@tanstack/vue-query'
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import { queryKeys } from '@/shared/http/query-keys'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiIcon, useToast } from '@/shared/ui'

import { reportCapabilities } from '../model/capabilities'
import { meetingReturnKey, takeFocusReturn } from '../model/return-focus'
import { REPORT_MEETING_ROUTE } from '../routes'
import ReportActionButton from './ReportActionButton.vue'
import { t } from './text'

/**
 * "Toplantı raporu (PDF)" (09b başlığı ve K7; E-13-41…45) + "Önizle" bağlantısı (01g; yalnız ŞY).
 * Bağlama (KESİN 28): `meetings/pages/MeetingDetailPage.vue` başlık eylemleri ("Düzenle"nin
 * solunda). Düğme toplantı yüklenince HER ZAMAN çizilir (not/gündem sayısından bağımsız, P50);
 * görünürlük `reportCapabilities` (ŞY ∨ toplantının sahip/dahil birimini koordine eden K). K'de
 * yalnız PDF vardır (`reportMeetingDetail` K'ye 403). Silinmiş toplantı bu sayfada açılmaz
 * (silinenler görünümü salt okunur; E-13-45). 404 `reporting.not_found` → "Kayıt bulunamadı"
 * bildirimi + toplantı okumaları tazelenir (sayfa kendi kayıp akışını işletir).
 */
const props = defineProps<{
  meeting: {
    meeting_id: string
    owner_department_id: string
    departments: readonly { department_id: string }[]
  }
}>()
const scope = useScopeStore()
const toast = useToast()
const client = useQueryClient()
const { standing } = useStanding()
const caps = computed(() => reportCapabilities(standing.value, scope.programId))
const meetingId = computed(() => props.meeting.meeting_id)
const canExport = computed(() =>
  caps.value.canExportMeetingReport({
    departmentIds: [
      ...new Set([
        props.meeting.owner_department_id,
        ...props.meeting.departments.map((d) => d.department_id),
      ]),
    ],
  }),
)

const previewLink = ref<{ $el: HTMLElement } | null>(null)
// Önizlemeden "Kapat" ile dönüşte odak "Önizle" bağlantısına gelir (KESİN 27).
watch(
  previewLink,
  (link) => {
    if (link && takeFocusReturn(meetingReturnKey(meetingId.value))) link.$el.focus()
  },
  { flush: 'post' },
)

function onFailed(code: string): void {
  if (code !== 'reporting.not_found') return
  toast.push({ message: t('reports.states.notFound'), tone: 'danger' })
  void client.invalidateQueries({ queryKey: queryKeys.meetings.all(scope.snapshot) })
}
</script>

<template>
  <div v-if="canExport" class="report-meeting" data-testid="meeting-report">
    <ReportActionButton
      kind="meeting"
      :target-id="meetingId"
      :title="t('reports.meeting.actions.hint')"
      @failed="onFailed"
    />
    <RouterLink
      v-if="caps.canPreviewMeeting()"
      ref="previewLink"
      class="report-link"
      :to="{ name: REPORT_MEETING_ROUTE.name, params: { meetingId } }"
      data-action="preview-meeting"
    >
      <UiIcon name="external" size="sm" />
      {{ t('reports.meeting.actions.preview') }}
    </RouterLink>
  </div>
</template>
