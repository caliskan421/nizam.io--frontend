<script setup lang="ts">
import './frame.css'

import { computed, nextTick, onBeforeUnmount, ref } from 'vue'

import { UiCount, UiIcon, UiIconButton, UiMenu, UiMenuItem, UiSegmented } from '@/shared/ui'
import type { UiChoiceOption } from '@/shared/ui'

import type {
  GanttScale,
  GanttStatusFilter,
  TimelineToolbarEmits,
  TimelineToolbarProps,
} from '../index'
import { frameText } from './messages'

/**
 * Araç çubuğu (E-03C-05…12). Koordinatörlük süzgeci yalnız Admin yüzünde ve TEK seçimdir
 * (`showDepartmentFilter`; K3, çoklu seçim yok); menü Esc / dışarı tıklama / Tab ile kapanır,
 * odak tetiğe döner. Durum süzgeci istemcide, sayaçsız. Ölçek ±: sınırda `aria-disabled` (tık
 * etkisiz). Dışa aktarım pilotla doğrulanana dek (`exportReady` false) devre dışı "yakında" —
 * istek/indirme yok. Tam ekran `aria-pressed`.
 */
const props = defineProps<TimelineToolbarProps>()
const emit = defineEmits<TimelineToolbarEmits>()

const SCALE_ORDER: readonly GanttScale[] = ['gun', 'hafta', 'ay']
const atNarrowest = computed(() => props.scale === 'gun')
const atWidest = computed(() => props.scale === 'ay')

const statusOptions = computed<UiChoiceOption<GanttStatusFilter>[]>(() => [
  { value: 'tumu', label: frameText('timeline.frame.toolbar.status.all') },
  { value: 'acik', label: frameText('timeline.frame.toolbar.status.open') },
  { value: 'geciken', label: frameText('timeline.frame.toolbar.status.overdue') },
  { value: 'biten', label: frameText('timeline.frame.toolbar.status.done') },
])

const fullscreenLabel = computed(() =>
  frameText(
    props.fullscreen
      ? 'timeline.frame.toolbar.fullscreen.exit'
      : 'timeline.frame.toolbar.fullscreen.enter',
  ),
)

function zoom(step: 1 | -1): void {
  const next = SCALE_ORDER[SCALE_ORDER.indexOf(props.scale) + step]
  if (next) emit('update:scale', next)
}

function exportTitle(key: 'pdf' | 'image'): string {
  const label = frameText(`timeline.frame.toolbar.export.${key}`)
  return props.exportReady ? label : `${label} — ${frameText('timeline.frame.toolbar.export.soon')}`
}

function onExport(kind: 'pdf' | 'image'): void {
  if (!props.exportReady) return
  if (kind === 'pdf') emit('exportPdf')
  else emit('exportImage')
}

// --- Koordinatörlük menüsü ----------------------------------------------------------------
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)

function onDocumentClick(event: MouseEvent): void {
  if (!root.value?.contains(event.target as Node)) close(false)
}

function close(returnFocus: boolean): void {
  if (!open.value) return
  open.value = false
  document.removeEventListener('click', onDocumentClick, true)
  if (returnFocus) void nextTick(() => trigger.value?.focus())
}

function toggle(): void {
  if (open.value) return close(true)
  open.value = true
  document.addEventListener('click', onDocumentClick, true)
}

function pick(departmentId: string | null): void {
  emit('update:departmentId', departmentId)
  close(true)
}

const selectedName = computed(
  () => props.departments.find((d) => d.departmentId === props.departmentId)?.displayName,
)

onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick, true))
</script>

<template>
  <div
    class="tl-toolbar"
    role="toolbar"
    :aria-label="frameText('timeline.frame.toolbar.label')"
    data-testid="timeline-toolbar"
  >
    <div class="tl-group">
      <div v-if="showDepartmentFilter" ref="root" class="tl-pop-anchor">
        <button
          ref="trigger"
          type="button"
          class="t-btn t-btn--secondary t-btn--sm"
          aria-haspopup="menu"
          :aria-expanded="open ? 'true' : 'false'"
          :title="selectedName"
          data-testid="timeline-department-filter"
          @click="toggle"
        >
          {{ frameText('timeline.frame.toolbar.department.label') }}
          <UiCount v-if="departmentId" value="1" />
          <UiIcon name="chevron-down" size="sm" />
        </button>
        <UiMenu
          v-if="open"
          class="tl-pop"
          :label="frameText('timeline.frame.toolbar.department.menu')"
          @close="close(true)"
        >
          <UiMenuItem :checked="departmentId === null" @select="pick(null)">
            {{ frameText('timeline.frame.toolbar.department.all') }}
          </UiMenuItem>
          <UiMenuItem
            v-for="d in departments"
            :key="d.departmentId"
            :checked="departmentId === d.departmentId"
            @select="pick(d.departmentId)"
          >
            {{ d.displayName }}
          </UiMenuItem>
        </UiMenu>
      </div>
      <UiSegmented
        :model-value="status"
        :options="statusOptions"
        :label="frameText('timeline.frame.toolbar.status.label')"
        @update:model-value="(v) => v && emit('update:status', v)"
      />
    </div>
    <span class="tl-grow" />
    <div class="tl-group">
      <span class="tl-scale" data-testid="timeline-scale">
        {{ frameText(`timeline.frame.toolbar.scale.${scale}`) }}
      </span>
      <!-- Uzaklaştır "−": simge kayıt defterinde yok (shared/ui/icons.ts bu işin sahipliğinde değil) -->
      <button
        type="button"
        class="t-iconbtn"
        :aria-label="frameText('timeline.frame.toolbar.scale.zoomOut')"
        :title="frameText('timeline.frame.toolbar.scale.zoomOut')"
        :aria-disabled="atWidest ? 'true' : undefined"
        data-action="zoom-out"
        @click="atWidest || zoom(1)"
      >
        <svg class="t-icon t-icon--sm" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M5 12h14" />
        </svg>
      </button>
      <UiIconButton
        icon="plus"
        :label="frameText('timeline.frame.toolbar.scale.zoomIn')"
        :aria-disabled="atNarrowest ? 'true' : undefined"
        data-action="zoom-in"
        @click="atNarrowest || zoom(-1)"
      />
    </div>
    <div class="tl-group">
      <UiIconButton
        icon="document"
        :label="exportTitle('pdf')"
        :aria-disabled="exportReady ? undefined : 'true'"
        data-action="export-pdf"
        @click="onExport('pdf')"
      />
      <UiIconButton
        icon="download"
        :label="exportTitle('image')"
        :aria-disabled="exportReady ? undefined : 'true'"
        data-action="export-image"
        @click="onExport('image')"
      />
      <button
        type="button"
        class="t-iconbtn"
        :aria-label="fullscreenLabel"
        :title="fullscreenLabel"
        :aria-pressed="fullscreen ? 'true' : 'false'"
        data-action="fullscreen"
        @click="emit('update:fullscreen', !fullscreen)"
      >
        <svg class="t-icon t-icon--sm" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
        </svg>
      </button>
    </div>
  </div>
</template>
