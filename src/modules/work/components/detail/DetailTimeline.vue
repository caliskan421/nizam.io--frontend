<script setup lang="ts">
import './detail.css'

import { computed } from 'vue'

import { DesignStub, UiPlaceholder } from '@/shared/ui'

import type { WorkItem } from '../../model/types'
import { timelineEvents } from './format'
import { detailText } from './messages'

/**
 * İlerleme çizgisi (E-03-51): yalnız görevin tarih alanlarından türetilen olaylar; etkinlik
 * geçmişi (durum geçişi, atama, dosya) sözleşmede yok → nötr yer tutucu, `BE-007` (yönetici dışı
 * okuma BE-091). Sahte olay üretilmez (ortak-kurallar §4).
 */
const props = defineProps<{ item: WorkItem; timeZone: string }>()
const events = computed(() => timelineEvents(props.item, props.timeZone))
</script>

<template>
  <div class="wd-progress">
    <p class="rp-kicker">{{ detailText('workDetail.timeline.title') }}</p>
    <ol v-if="events.length" class="rp-timeline">
      <li v-for="event in events" :key="event.key" :data-event="event.key">
        <span class="rp-tl-dot" :class="{ 'rp-tl-dot--alert': event.alert }" aria-hidden="true">
          <span class="rp-dot" :class="`rp-dot--${event.tone}`" />
        </span>
        <span class="wd-tl-text" :class="{ 'rp-danger-text wd-tl-text--alert': event.alert }">
          {{ event.text }}
        </span>
        <span class="rp-kicker rp-nowrap wd-tl-when">{{ event.when }}</span>
      </li>
    </ol>
    <DesignStub id="BE-007" as="div">
      <UiPlaceholder inline :text="detailText('workDetail.timeline.activity')" />
    </DesignStub>
  </div>
</template>
