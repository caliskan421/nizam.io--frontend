<script setup lang="ts">
import '../components/preview/preview.css'

import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { toApiError } from '@/shared/errors/api-error'
import { useInstanceStore } from '@/shared/instance/store'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiErrorState } from '@/shared/ui'

import { NOT_FOUND_CODE, useMeetingGone } from '../api/meeting-gone'
import { useReportMeetingDetail } from '../api/queries'
import MeetingPaper from '../components/preview/MeetingPaper.vue'
import PreviewToolbar from '../components/preview/PreviewToolbar.vue'
import ReportStateCard from '../components/ReportStateCard.vue'
import { t } from '../components/text'
import { coordinatorships } from '../model/meeting-view'
import { FALLBACK_TIME_ZONE, instantDate } from '../model/format'
import { paperContext } from '../model/paper-context'
import { meetingReturnKey, requestFocusReturn } from '../model/return-focus'

/**
 * 01g toplantı raporu önizlemesi (`/toplantilar/:meetingId/rapor`; E-13-46…53). Yalnız şirket
 * yöneticisi (`ReportsGate`); `reportMeetingDetail` hafif okumadır. Kırıntı/"Kapat"/"Toplantıya
 * git" toplantı detayına döner (P47: "Raporlar" bağlantısı yok); "Tetikleyiciler" kartı tasarım notudur,
 * çizilmez (E-13-54 ret; W142 KUSUR 2). Bitiş saati ve not yazarı yoktur; "Sayfa 1 / 1" gizli.
 */
const route = useRoute()
const scope = useScopeStore()
const instance = useInstanceStore()
const { programs } = useStanding()
const meetingId = computed(() =>
  typeof route.params.meetingId === 'string' ? route.params.meetingId : null,
)
const query = useReportMeetingDetail(meetingId)
const zoom = ref(100)
const now = new Date()

const detail = computed(() => query.data.value)
const timeZone = computed(() => instance.profile?.timezone ?? FALLBACK_TIME_ZONE)
const context = computed(() => {
  const program = programs.value?.find((p) => p.programId === scope.programId)
  return paperContext({
    program: program?.name ?? '',
    shortName: program?.shortName ?? null,
    year: program?.year ?? null,
    generatedAt: null,
    now,
    timeZone: timeZone.value,
  })
})
const target = computed(() =>
  meetingId.value
    ? { name: 'collaboration.meeting', params: { meetingId: meetingId.value } }
    : { name: 'collaboration.meetings' },
)
const subtitle = computed(() => {
  const d = detail.value
  if (!d) return ''
  return t('reports.meeting.subtitle', {
    title: d.meeting.title,
    date: instantDate(d.meeting.meeting_date, timeZone.value) ?? '',
    coordinatorships: coordinatorships(d)
      .map((c) => c.name)
      .join(' · '),
  })
})
const error = computed(() => (query.isError.value ? toApiError(query.error.value) : null))
// 404 `reporting.not_found` (silinmiş/kapsam dışı): önizleme kapanır, liste tazelenir, tek bildirim
// (CX-F6-E-06). Geçici hatalardan (5xx/ağ) ayrıdır: onlar bölge içi "Yeniden dene" olarak kalır.
const gone = useMeetingGone()
watch(
  () => [meetingId.value, error.value?.code] as const,
  ([id, code]) => {
    if (id && code === NOT_FOUND_CODE) gone(id)
  },
  { immediate: true },
)
function onPdfFailed(code: string): void {
  if (meetingId.value && code === NOT_FOUND_CODE) gone(meetingId.value)
}
function onClose(): void {
  if (meetingId.value) requestFocusReturn(meetingReturnKey(meetingId.value))
}
</script>

<template>
  <section
    class="report-page"
    :aria-label="t('reports.meeting.title')"
    data-testid="meeting-report-page"
  >
    <header class="report-page__head">
      <h1 class="report-page__title">{{ t('reports.meeting.title') }}</h1>
      <p v-if="subtitle" class="report-page__sub">{{ subtitle }}</p>
    </header>
    <div class="report-page__body">
      <div class="report-page__col">
        <PreviewToolbar
          v-model:zoom="zoom"
          kind="meeting"
          :target-id="meetingId ?? undefined"
          :close-to="target"
          :go-to="target"
          :lead="
            detail ? t('reports.meeting.toolbar.label', { title: detail.meeting.title }) : undefined
          "
          @close="onClose"
          @failed="onPdfFailed"
        />
        <UiErrorState
          v-if="error"
          :error="error"
          :title="t('reports.meeting.state.errorTitle')"
          :retrying="query.isFetching.value"
          retryable
          @retry="query.refetch()"
        />
        <div v-else-if="!detail" class="report-stage" aria-busy="true">
          <ReportStateCard tone="progress" :title="t('reports.meeting.state.loadingTitle')" />
          <div class="report-paper" data-theme="light" aria-hidden="true">
            <div class="report-skeleton">
              <span class="report-skeleton__band" />
              <span v-for="n in 6" :key="n" />
            </div>
          </div>
        </div>
        <div v-else class="report-stage" data-testid="meeting-stage">
          <div class="report-stack" :style="{ zoom: zoom / 100 }">
            <MeetingPaper :ctx="context" :detail="detail" />
          </div>
        </div>
      </div>
      <aside class="report-page__aside" :aria-label="t('reports.meeting.aside.label')">
        <section class="t-card report-aside-card">
          <p>{{ t('reports.meeting.aside.audit') }}</p>
          <p>{{ t('reports.meeting.aside.times') }}</p>
        </section>
      </aside>
    </div>
  </section>
</template>
