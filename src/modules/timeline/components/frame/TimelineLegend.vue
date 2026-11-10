<script setup lang="ts">
import './frame.css'

import { frameText, type TimelineFrameTextKey } from './messages'

/**
 * Açıklama (E-03C-19): beş durum + "Geç bitti" + "Gecikmede" + "Tarih talebi" + "Baktığın yer".
 * Nokta renkleri çubuk paletidir (`--gp-*`, iki tema); renk tek başına anlam taşımaz — her öğenin
 * metni var. 03d açıklaması kurulmaz (E-03C-20).
 */
type Item = {
  key: string
  text: TimelineFrameTextKey
  mark: 'dot' | 'swatch' | 'swatch-request' | 'mark'
}

const ITEMS: readonly Item[] = [
  { key: 'todo', text: 'timeline.frame.legend.todo', mark: 'dot' },
  { key: 'doing', text: 'timeline.frame.legend.doing', mark: 'dot' },
  { key: 'review', text: 'timeline.frame.legend.review', mark: 'dot' },
  { key: 'back', text: 'timeline.frame.legend.back', mark: 'dot' },
  { key: 'done', text: 'timeline.frame.legend.done', mark: 'dot' },
  { key: 'doneLate', text: 'timeline.frame.legend.doneLate', mark: 'dot' },
  { key: 'overdue', text: 'timeline.frame.legend.overdue', mark: 'swatch' },
  { key: 'request', text: 'timeline.frame.legend.dateRequest', mark: 'swatch-request' },
  { key: 'here', text: 'timeline.frame.legend.here', mark: 'mark' },
]
</script>

<template>
  <ul
    class="tl-legend"
    :aria-label="frameText('timeline.frame.legend.label')"
    data-testid="timeline-legend"
  >
    <li v-for="item in ITEMS" :key="item.key" class="tl-legend__item" :data-legend="item.key">
      <span
        v-if="item.mark === 'dot'"
        class="tl-legend__dot"
        :class="`tl-legend__dot--${item.key}`"
        aria-hidden="true"
      />
      <span v-else-if="item.mark === 'mark'" class="tl-legend__mark" aria-hidden="true" />
      <span
        v-else
        class="tl-legend__swatch"
        :class="{ 'tl-legend__swatch--request': item.mark === 'swatch-request' }"
        aria-hidden="true"
      />
      {{ frameText(item.text) }}
    </li>
  </ul>
</template>
