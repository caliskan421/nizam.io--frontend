<script setup lang="ts">
import './preview.css'

import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

import { UiIcon, UiIconButton } from '@/shared/ui'

import ReportActionButton from '../ReportActionButton.vue'
import { t } from '../text'

/**
 * Önizleme araç çubuğu (01f, 01g; E-13-15…17, 47): yakınlaştırma (yalnız CSS ölçek; %50–%200,
 * adım %25), "PDF indir" (sayfanın PDF eylemiyle AYNI düğme ve durum makinesi), isteğe bağlı
 * "Toplantıya git" ve "Kapat". "Sayfa x / y", dosya adı/boyut ve "Yazdır" yoktur (E-13-15).
 * "Kapat" tıklanınca `onClose` hedef ekranın "Önizle" bağlantısına odak dönüşünü ister.
 */
const props = defineProps<{
  kind: 'season' | 'meeting'
  targetId?: string
  closeTo: RouteLocationRaw
  goTo?: RouteLocationRaw
  lead?: string
}>()
const emit = defineEmits<{ close: [] }>()
const zoom = defineModel<number>('zoom', { default: 100 })

const STEP = 25
const MIN = 50
const MAX = 200
const small = computed(() => props.kind === 'meeting')
function change(delta: number): void {
  zoom.value = Math.min(MAX, Math.max(MIN, zoom.value + delta))
}
</script>

<template>
  <div class="report-toolbar" role="toolbar" :aria-label="t('reports.season.toolbar.label')">
    <span v-if="lead" class="report-toolbar__lead"
      ><UiIcon name="file" size="sm" /><span class="rp-trunc">{{ lead }}</span></span
    >
    <div class="report-zoom" role="group" :aria-label="t('reports.season.toolbar.zoom')">
      <UiIconButton
        icon="minus"
        :label="t('reports.season.toolbar.zoomOut')"
        :disabled="zoom <= MIN"
        data-action="zoom-out"
        @click="change(-STEP)"
      />
      <span
        class="report-zoom__value"
        data-testid="zoom-value"
        :aria-label="t('reports.season.toolbar.zoomValue', { n: zoom })"
        >%{{ zoom }}</span
      >
      <UiIconButton
        icon="plus"
        :label="t('reports.season.toolbar.zoomIn')"
        :disabled="zoom >= MAX"
        data-action="zoom-in"
        @click="change(STEP)"
      />
    </div>
    <span class="report-toolbar__grow" />
    <div class="report-toolbar__group">
      <ReportActionButton
        :kind="kind"
        :target-id="targetId"
        variant="primary"
        :size="small ? 'sm' : 'md'"
        data-testid="preview-pdf"
        >{{ t('reports.season.toolbar.pdf') }}</ReportActionButton
      >
      <RouterLink
        v-if="goTo"
        class="t-btn t-btn--secondary t-btn--sm"
        :to="goTo"
        data-action="go-to"
      >
        <UiIcon name="arrow-up-right" size="sm" />{{ t('reports.meeting.toolbar.goTo') }}
      </RouterLink>
      <RouterLink
        class="t-btn t-btn--ghost"
        :class="{ 't-btn--sm': small }"
        :to="closeTo"
        data-action="close"
        @click="emit('close')"
      >
        <UiIcon name="close" size="sm" />{{ t('reports.season.toolbar.close') }}
      </RouterLink>
    </div>
  </div>
</template>
