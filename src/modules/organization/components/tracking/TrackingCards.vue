<script setup lang="ts">
import { UiIcon } from '@/shared/ui'

import { trackingText } from './messages'
import type { CardView, TrackingCard } from './model'

/**
 * E-05-49…52 — dört özet kartı (`button.t-card.rp-cardbtn`, `aria-pressed` tekli seçim). Tık
 * kartın süzgecini seçer (URL `kart`); tablo, liste başlığı ve sekme sayacı aynı kümeden. Çubuk
 * doluluğu tek dinamik değer `--pt-fill` özel özelliğidir. Yüklenirken iskelet kartlar.
 */
defineProps<{ cards: readonly CardView[] | null; selected: TrackingCard }>()
const emit = defineEmits<{ select: [card: TrackingCard] }>()
</script>

<template>
  <section class="pt-cards" :aria-label="trackingText('userTracking.cards.region')">
    <template v-if="cards">
      <button
        v-for="card in cards"
        :key="card.key"
        type="button"
        class="t-card rp-cardbtn pt-card"
        :class="`pt-tone--${card.tone}`"
        :aria-pressed="selected === card.key ? 'true' : 'false'"
        :title="card.title"
        :data-card="card.key"
        @click="emit('select', card.key)"
      >
        <span class="pt-card__top">
          <span class="pt-card__name">
            <span class="rp-ichip"><UiIcon :name="card.icon" size="sm" /></span>
            <span class="rp-trunc pt-card__label">{{ card.label }}</span>
          </span>
          <UiIcon class="pt-card__go" name="arrow-up-right" size="sm" />
        </span>
        <span class="pt-card__body">
          <span
            class="rp-num pt-card__value"
            :class="{ 'pt-card__value--danger': card.danger }"
            data-card-value
            >{{ card.value }}</span
          >
          <span class="rp-bar" aria-hidden="true">
            <span class="pt-card__fill" :style="{ '--pt-fill': `${card.bar}%` }" data-card-bar />
          </span>
          <span v-if="card.note !== null" class="rp-cap rp-trunc" data-card-note>{{
            card.note
          }}</span>
        </span>
      </button>
    </template>
    <template v-else>
      <div v-for="n in 4" :key="n" class="t-card pt-card" aria-hidden="true" data-card-skeleton>
        <span class="pt-skel" />
        <span class="pt-skel pt-skel--num" />
      </div>
    </template>
  </section>
</template>
