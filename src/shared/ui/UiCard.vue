<script setup lang="ts">
import './styles/ui.css'

/** Kart (`t-card`): varsayılan, iç (`inset`), mor, altın. Başlık ve alt satır isteğe bağlı. */
withDefaults(
  defineProps<{
    variant?: 'default' | 'inset' | 'violet' | 'gold'
    title?: string
    meta?: string
    as?: 'section' | 'div' | 'article'
  }>(),
  { variant: 'default', title: undefined, meta: undefined, as: 'section' },
)
</script>

<template>
  <component :is="as" class="t-card" :class="{ [`t-card--${variant}`]: variant !== 'default' }">
    <h3 v-if="title" class="t-card__title">{{ title }}</h3>
    <p v-if="meta" class="t-card__meta">{{ meta }}</p>
    <slot />
  </component>
</template>
