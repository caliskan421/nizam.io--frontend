<script setup lang="ts">
import './picker.css'
import './reports.css'

import { computed, ref, watch } from 'vue'

import { useProgramDepartments } from '@/modules/work/public'
import { DesignStub, UiButton, UiModal } from '@/shared/ui'

import {
  allSections,
  isChild,
  isFullSelection,
  sectionState,
  SECTION_IDS,
  toggleSection,
  type SectionId,
} from '../model/sections'
import { t } from './text'

/**
 * "Bölüm seç…" penceresi (01i hücre B, E-13-04…06; STATİK, BE-122): hepsi seçili açılır; kilitli
 * "Kapak ve içindekiler"; 4 ana + 4 girintili alt kutu (ana kutu alt kutuları toplu işaretler,
 * kısmi seçimde `mixed`); koordinatörlük çipleri çizilir ama devre dışı "yakında" (çip kaynağı
 * `listProgramDepartments`: kod, yoksa ad); koordinatörlük sayısı canlı, sayfa tahmini yok
 * (E-13-06). Hepsi seçiliyken "Seçilenleri indir" = düz tam rapor (`download` olayı; indirmeyi
 * ana düğme yapar); bir kutu kaldırılınca devre dışı + açıklama (sahte kısmi PDF yok). Seçim
 * açılışlar arasında hatırlanmaz. Kapanışta odak tetikleyiciye `UiModal` ile döner.
 */
const props = defineProps<{ programLabel: string }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ download: [] }>()

const selected = ref<Set<SectionId>>(allSections())
watch(open, (isOpen) => {
  if (isOpen) selected.value = allSections()
})

const departments = useProgramDepartments(open)
const list = computed(() => departments.query.data.value?.departments ?? [])
const count = computed(() => (departments.query.data.value ? list.value.length : null))
const full = computed(() => isFullSelection(selected.value))
const summary = computed(() =>
  [
    count.value === null ? '' : t('reports.season.picker.count', { n: count.value }),
    t('reports.season.picker.meta'),
  ]
    .filter(Boolean)
    .join(' · '),
)

function confirm(): void {
  if (!full.value) return
  open.value = false
  emit('download')
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
        <DesignStub id="BE-122">
          <span class="report-soon">{{ t('reports.season.picker.soon') }}</span>
        </DesignStub>
      </div>
      <div class="report-picker__chips">
        <button type="button" class="report-chip" aria-pressed="true" disabled>
          {{ t('reports.season.picker.all') }}
        </button>
        <button
          v-for="department in list"
          :key="department.department_id"
          type="button"
          class="report-chip"
          aria-pressed="true"
          disabled
        >
          {{ department.code ?? department.display_name }}
        </button>
      </div>
      <p v-if="!full" class="report-picker__hint" role="status">
        {{ t('reports.season.picker.partial') }}
      </p>
    </div>
    <template #footer>
      <span class="report-picker__summary">{{ summary }}</span>
      <div class="report-picker__buttons">
        <UiButton variant="ghost" data-action="cancel" @click="open = false">
          {{ t('reports.season.picker.cancel') }}
        </UiButton>
        <DesignStub v-if="!full" id="BE-122">
          <UiButton variant="primary" icon="download" disabled data-action="confirm">
            {{ t('reports.season.picker.download') }}
          </UiButton>
          <span class="report-soon">{{ t('reports.season.picker.soon') }}</span>
        </DesignStub>
        <UiButton v-else variant="primary" icon="download" data-action="confirm" @click="confirm">
          {{ t('reports.season.picker.download') }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>
