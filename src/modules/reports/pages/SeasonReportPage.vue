<script setup lang="ts">
import '../components/preview/preview.css'

import { computed, ref } from 'vue'

import { useProgramDepartments } from '@/shared/scope/program-departments'
import { toApiError } from '@/shared/errors/api-error'
import { useInstanceStore } from '@/shared/instance/store'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiErrorState } from '@/shared/ui'

import { useReportSeason } from '../api/queries'
import ReportStateCard from '../components/ReportStateCard.vue'
import SeasonAppendix from '../components/preview/SeasonAppendix.vue'
import SeasonCover from '../components/preview/SeasonCover.vue'
import SeasonDepartment from '../components/preview/SeasonDepartment.vue'
import SeasonGantt from '../components/preview/SeasonGantt.vue'
import SeasonGeneral from '../components/preview/SeasonGeneral.vue'
import SeasonSummary from '../components/preview/SeasonSummary.vue'
import SeasonToc from '../components/preview/SeasonToc.vue'
import PreviewToolbar from '../components/preview/PreviewToolbar.vue'
import { t } from '../components/text'
import { FALLBACK_TIME_ZONE } from '../model/format'
import { paperContext } from '../model/paper-context'
import { requestFocusReturn, SEASON_RETURN_KEY } from '../model/return-focus'
import { departmentSections } from '../model/season-view'

/**
 * 01f dönem sonu raporu önizlemesi (`/arsiv/donem-raporu`; E-13-13…40). Yalnız şirket yöneticisi
 * (`ReportsGate`; sayfa gövdesi kapıdan bağımsızdır). `reportSeason` YALNIZ bu sayfa açıkken okunur
 * (`staleTime 0`, odakta/yeniden bağlanmada tazeleme yok, `reportGate` altında); kâğıtlar tek akış
 * (sayfa numarası yok, P51) ve JSON alanlarından CANLI çizilir; JSON'da olmayan bölümler statik yer
 * tutucudur (BE-123/134/136). Yükleniyor: kâğıt iskeleti + "Rapor hazırlanıyor…"; hata: bölge içi
 * metin + "Yeniden dene" (otomatik tekrar yok). "Kapat" Arşiv'e döner; odak "Önizle"ye gider.
 */
const scope = useScopeStore()
const instance = useInstanceStore()
const { programs } = useStanding()
const departments = useProgramDepartments()
const query = useReportSeason(true)
const zoom = ref(100)
const now = new Date()

const season = computed(() => query.data.value)
const context = computed(() => {
  const data = season.value
  if (!data) return null
  const program = programs.value?.find((p) => p.programId === scope.programId)
  return paperContext({
    program: data.program_name,
    shortName: program?.shortName ?? null,
    year: program?.year ?? null,
    generatedAt: data.generated_at,
    now,
    timeZone: instance.profile?.timezone ?? FALLBACK_TIME_ZONE,
  })
})
const sections = computed(() =>
  season.value
    ? departmentSections(season.value, (id) => departments.byId.value.get(id)?.code ?? null)
    : [],
)
const error = computed(() => (query.isError.value ? toApiError(query.error.value) : null))
</script>

<template>
  <section class="report-page" :aria-label="t('reports.season.title')" data-testid="season-report">
    <header class="report-page__head">
      <h1 class="report-page__title">{{ t('reports.season.title') }}</h1>
      <p class="report-page__sub">{{ t('reports.season.subtitle') }}</p>
    </header>
    <div class="report-page__body">
      <div class="report-page__col">
        <PreviewToolbar
          v-model:zoom="zoom"
          kind="season"
          :close-to="{ name: 'archive.folders' }"
          @close="requestFocusReturn(SEASON_RETURN_KEY)"
        />
        <p class="report-page__note">{{ t('reports.season.note') }}</p>
        <div v-if="error" class="report-stage">
          <UiErrorState
            :error="error"
            :title="t('reports.season.state.errorTitle')"
            :retrying="query.isFetching.value"
            retryable
            @retry="query.refetch()"
          />
        </div>
        <div v-else-if="!season || !context" class="report-stage" aria-busy="true">
          <ReportStateCard
            tone="progress"
            :title="t('reports.season.state.loadingTitle')"
            :body="t('reports.season.state.loadingBody')"
          />
          <div class="report-paper" data-theme="light" aria-hidden="true">
            <div class="report-skeleton">
              <span class="report-skeleton__band" />
              <span v-for="n in 8" :key="n" />
            </div>
          </div>
        </div>
        <div v-else class="report-stage" data-testid="season-stage">
          <div class="report-stack" :style="{ zoom: zoom / 100 }">
            <SeasonCover :ctx="context" :season="season" />
            <SeasonToc :ctx="context" :sections="sections" />
            <SeasonSummary :ctx="context" :season="season" :sections="sections" />
            <SeasonGantt :ctx="context" />
            <SeasonGeneral :ctx="context" :season="season" />
            <SeasonDepartment
              v-for="section in sections"
              :key="section.id"
              :ctx="context"
              :section="section"
            />
            <SeasonAppendix :ctx="context" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
