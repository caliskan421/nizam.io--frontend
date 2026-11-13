<script setup lang="ts">
import './reports.css'

import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiIcon, UiIconButton } from '@/shared/ui'

import { reportCapabilities } from '../model/capabilities'
import { SEASON_RETURN_KEY, takeFocusReturn } from '../model/return-focus'
import { REPORT_SEASON_ROUTE } from '../routes'
import ReportActionButton from './ReportActionButton.vue'
import SectionPickerDialog from './SectionPickerDialog.vue'
import { t } from './text'

/**
 * 06 Arşiv başlığındaki dönem sonu raporu eylemleri (01i hücre A, E-13-01…08, 12): "Dönem sonu
 * raporu (PDF)" + bitişik "Bölüm seç…" (tek parça) ve altında "Önizle" bağlantısı (01f). Bağlama
 * (KESİN 28): `ArchivePage.vue` başlık eylem şeridi. Yalnız şirket yöneticisi görür (`reportCapabilities`,
 * mercek değil olgu); "Dönem arşivi (ZIP)" `PeriodZipButton`'ın (F5, BE-120 stub) işidir. "Bölüm seç…"
 * penceresi statiktir (BE-122); hepsi seçiliyken "Seçilenleri indir" aynı düğmenin durumunda
 * düz indirmeyi başlatır. Pencere kapanınca odak "Bölüm seç…" düğmesine döner (UiModal; indirme
 * başlayınca kart ana düğmede görünür). 390'da düğme tam genişlik, yığılı.
 */
const scope = useScopeStore()
const { standing, programs } = useStanding()
const capabilities = computed(() => reportCapabilities(standing.value, scope.programId))
const pickerOpen = ref(false)
const previewLink = ref<{ $el: HTMLElement } | null>(null)
const download = ref<{ start: () => Promise<void> } | null>(null)

const programLabel = computed(() => {
  const program = programs.value?.find((p) => p.programId === scope.programId)
  if (!program) return ''
  return program.year === null
    ? program.name
    : t('reports.season.picker.kicker', { program: program.name, year: program.year })
})

// Önizlemeden "Kapat" ile dönüşte odak "Önizle" bağlantısına gelir (E-13-17, KESİN 27).
watch(
  previewLink,
  (link) => {
    if (link && takeFocusReturn(SEASON_RETURN_KEY)) link.$el.focus()
  },
  { flush: 'post' },
)

function startFullDownload(): void {
  void nextTick(() => download.value?.start())
}
</script>

<template>
  <div v-if="capabilities.canExportSeason()" class="report-season" data-testid="season-actions">
    <ReportActionButton ref="download" kind="season">
      <template #trailing>
        <UiIconButton
          icon="list"
          size="md"
          data-action="pick-sections"
          :label="t('reports.season.actions.pickTitle')"
          @click="pickerOpen = true"
        />
      </template>
    </ReportActionButton>
    <RouterLink
      v-if="capabilities.canPreviewSeason()"
      ref="previewLink"
      class="report-link"
      :to="{ name: REPORT_SEASON_ROUTE.name }"
      data-action="preview-season"
    >
      <UiIcon name="external" size="sm" />
      {{ t('reports.season.actions.preview') }}
    </RouterLink>
    <SectionPickerDialog
      v-model:open="pickerOpen"
      :program-label="programLabel"
      @download="startFullDownload"
    />
  </div>
</template>
