<script setup lang="ts">
import './picker.css'
import './reports.css'

import { computed, ref, watch } from 'vue'

import { useProgramDepartments } from '@/shared/scope/program-departments'
import { UiButton, UiModal } from '@/shared/ui'

import {
  allSections,
  departmentsForRequest,
  isChild,
  isEmptySelection,
  sectionsForRequest,
  sectionState,
  SECTION_IDS,
  toggleDepartment,
  toggleSection,
  type SectionId,
} from '../model/sections'
import type { SeasonSelection } from '../model/types'
import { t } from './text'

/**
 * "Bölüm seç…" penceresi (01i hücre B, E-13-04…06; CANLI, BE-122/BE-127 kısmı): hepsi seçili açılır;
 * kilitli "Kapak ve içindekiler"; 4 ana + 4 girintili alt kutu (ana kutu alt kutuları toplu
 * işaretler, kısmi seçimde `mixed`); koordinatörlük çipleri (kaynak `listProgramDepartments`: kod,
 * yoksa ad): "Tümü" açıkken bir çip süzgeci o koordinatörlüğe daraltır, sonraki basışlar
 * ekler/çıkarır, son çip çıkınca "Tümü"ne dönülür. Koordinatörlük sayısı canlı (süzgeçle seçili
 * sayı), sayfa tahmini yok (E-13-06). "Seçilenleri indir" seçimi (`download` olayı: `sections` /
 * `departmentIds`; hepsi seçiliyse ilgili alan YOK = parametresiz tam eksen) yayar; indirmeyi ana
 * düğme yapar. Hiçbir bölüm seçili değilken düğme devre dışıdır (sunucu boş seçimi "hepsi" sayar:
 * beklenmedik tam rapor inmesin). Seçim açılışlar arasında hatırlanmaz. Kapanışta odak
 * tetikleyiciye `UiModal` ile döner.
 */
const props = defineProps<{ programLabel: string }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ download: [selection: SeasonSelection] }>()

const selected = ref<Set<SectionId>>(allSections())
const only = ref<Set<string>>(new Set())
watch(open, (isOpen) => {
  if (isOpen) {
    selected.value = allSections()
    only.value = new Set()
  }
})

const departments = useProgramDepartments(open)
const list = computed(() => departments.query.data.value?.departments ?? [])
const count = computed(() =>
  departments.query.data.value ? (only.value.size > 0 ? only.value.size : list.value.length) : null,
)
const empty = computed(() => isEmptySelection(selected.value))
const summary = computed(() =>
  [
    count.value === null ? '' : t('reports.season.picker.count', { n: count.value }),
    t('reports.season.picker.meta'),
  ]
    .filter(Boolean)
    .join(' · '),
)

function confirm(): void {
  if (empty.value) return
  const sections = sectionsForRequest(selected.value)
  const departmentIds = departmentsForRequest(
    only.value,
    list.value.map((d) => d.department_id),
  )
  open.value = false
  emit('download', {
    ...(sections ? { sections } : {}),
    ...(departmentIds ? { departmentIds } : {}),
  })
}
</script>

<template>
  <UiModal
    v-model:open="open"
    :title="t('reports.season.picker.title')"
    :description="t('reports.season.picker.description')"
  >
    <div class="report-picker">
      <p v-if="props.programLabel" class="report-picker__kicker">{{ props.programLabel }}</p>
      <p class="report-picker__label">{{ t('reports.season.picker.sections') }}</p>
      <div class="report-picker__list" role="group" :aria-label="t('reports.season.picker.list')">
        <label class="report-picker__row report-picker__row--locked">
          <span class="t-checkwrap">
            <input class="t-check" type="checkbox" checked disabled />
            <svg class="t-check__mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m6 12.5 4 4 8-9" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span>{{ t('reports.season.picker.section.cover') }}</span>
          <span class="report-picker__always">{{ t('reports.season.picker.always') }}</span>
        </label>
        <label
          v-for="id in SECTION_IDS"
          :key="id"
          class="report-picker__row"
          :class="{ 'report-picker__row--sub': isChild(id) }"
        >
          <span class="t-checkwrap">
            <input
              class="t-check"
              type="checkbox"
              :data-section="id"
              :checked="sectionState(selected, id) !== 'off'"
              :aria-checked="sectionState(selected, id) === 'mixed' ? 'mixed' : undefined"
              @change="selected = toggleSection(selected, id)"
            />
            <svg class="t-check__mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                :d="sectionState(selected, id) === 'mixed' ? 'M7 12h10' : 'm6 12.5 4 4 8-9'"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span>{{ t(`reports.season.picker.section.${id}`) }}</span>
        </label>
      </div>
      <hr class="report-picker__rule" />
      <div class="report-picker__head">
        <p class="report-picker__label">{{ t('reports.season.picker.departments') }}</p>
      </div>
      <div class="report-picker__chips">
        <button
          type="button"
          class="report-chip"
          data-chip="all"
          :aria-pressed="only.size === 0"
          @click="only = new Set()"
        >
          {{ t('reports.season.picker.all') }}
        </button>
        <button
          v-for="department in list"
          :key="department.department_id"
          type="button"
          class="report-chip"
          :data-chip="department.department_id"
          :aria-pressed="only.has(department.department_id)"
          @click="only = toggleDepartment(only, department.department_id)"
        >
          {{ department.code ?? department.display_name }}
        </button>
      </div>
      <p v-if="empty" class="report-picker__hint" role="status">
        {{ t('reports.season.picker.empty') }}
      </p>
    </div>
    <template #footer>
      <span class="report-picker__summary">{{ summary }}</span>
      <div class="report-picker__buttons">
        <UiButton variant="ghost" data-action="cancel" @click="open = false">
          {{ t('reports.season.picker.cancel') }}
        </UiButton>
        <UiButton
          variant="primary"
          icon="download"
          data-action="confirm"
          :disabled="empty"
          @click="confirm"
        >
          {{ t('reports.season.picker.download') }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>
