<script setup lang="ts">
import './coordinatorships.css'

import { computed } from 'vue'

import type { ApiError } from '@/shared/errors/api-error'
import { UiErrorState } from '@/shared/ui'

import { coordsText } from '../../components/coordinatorships/messages'
import CoordsGlyph, { type CoordsGlyphName } from './CoordsGlyph.vue'
import type { HealthSummary } from './health'

/**
 * Yapı sağlığı şeridi (E-08-07…11; `rp-health` × 4, `auto-fit minmax(220px, 1fr)`). Sayılar
 * rapor satırlarından istemcide (tek `reportDashboard`). Koordinatörsüz kutunun notu yazılmaz
 * (iş kuralı bilinmiyor, E-08-08); sessiz kutusunun notu görev hareketine uyarlanır (E-08-11).
 * Kutular gezinmez (süzme hedefi kabul edilmedi) — tasarımın chevron'u süs olarak kalır.
 * Rapor yüklenemezse bölge içi "Yeniden dene".
 */
const props = defineProps<{
  summary: HealthSummary | null
  loading: boolean
  error: Pick<ApiError, 'messageKey' | 'requestId'> | null
  retrying: boolean
}>()
const emit = defineEmits<{ retry: [] }>()

interface Box {
  key: string
  glyph: CoordsGlyphName
  tone: 'gold' | 'muted' | 'danger'
  n: number
  label: string
  note: string | null
}

const boxes = computed<Box[]>(() => {
  const s = props.summary
  if (!s) return []
  return [
    {
      key: 'no-lead',
      glyph: 'user-x',
      tone: 'gold',
      n: s.noLead,
      label: coordsText('coordinatorships.health.noLead'),
      note: null,
    },
    {
      key: 'no-members',
      glyph: 'user-alone',
      tone: 'muted',
      n: s.noMembers,
      label: coordsText('coordinatorships.health.noMembers'),
      note: coordsText('coordinatorships.health.noMembersNote'),
    },
    {
      key: 'no-tasks',
      glyph: 'list-off',
      tone: 'muted',
      n: s.noTasks,
      label: coordsText('coordinatorships.health.noTasks'),
      note: s.noTaskNames.length ? s.noTaskNames.join(', ') : null,
    },
    {
      key: 'quiet',
      glyph: 'clock',
      tone: 'danger',
      n: s.quiet,
      label: coordsText('coordinatorships.health.quiet'),
      note: coordsText('coordinatorships.health.quietNote'),
    },
  ]
})
</script>

<template>
  <UiErrorState
    v-if="error"
    :error="error"
    :title="coordsText('coordinatorships.health.error')"
    retryable
    :retrying="retrying"
    @retry="emit('retry')"
  />
  <section
    v-else
    class="coords-health"
    :aria-label="coordsText('coordinatorships.health.region')"
    :aria-busy="loading ? 'true' : undefined"
  >
    <template v-if="loading">
      <div v-for="i in 4" :key="i" class="rp-health coords-skel" aria-hidden="true" />
    </template>
    <div
      v-for="box in boxes"
      v-else
      :key="box.key"
      class="rp-health"
      :class="`coords-health--${box.tone}`"
      :data-health="box.key"
    >
      <span class="rp-ichip" aria-hidden="true"><CoordsGlyph :name="box.glyph" /></span>
      <span class="coords-health__body">
        <span class="coords-health__line">
          <span class="rp-num" data-testid="health-n">{{ box.n }}</span>
          <span class="coords-health__label rp-trunc">{{ box.label }}</span>
        </span>
        <span v-if="box.note" class="rp-cap rp-trunc" data-testid="health-note" :title="box.note">
          {{ box.note }}
        </span>
      </span>
      <span class="coords-health__chev" aria-hidden="true"><CoordsGlyph name="chevron" /></span>
    </div>
  </section>
</template>
