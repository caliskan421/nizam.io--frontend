<script setup lang="ts">
import './styles/ui.css'

import { RouterLink, type RouteLocationRaw } from 'vue-router'

import UiIcon from './UiIcon.vue'
import type { IconName } from './icons'

/**
 * Gezinme öğesi (`t-nav`). `aria-current="page"` yalnız etkin öğede (diğerlerinde öznitelik yok).
 * `active` verilirse rota eşleşmesinin yerine geçer (ör. Görevler hem liste hem zaman çizelgesinde
 * etkin). `rail`: dar menü — yalnız simge, ad `aria-label` + `title`. `disabled`: bağlantısız,
 * odaklanamaz, `aria-disabled`. Rozetler varsayılan yuvada (dar hâlde gösterilmez).
 */
withDefaults(
  defineProps<{
    to: RouteLocationRaw
    label: string
    icon?: IconName
    active?: boolean
    rail?: boolean
    disabled?: boolean
  }>(),
  { icon: undefined, active: undefined, rail: false, disabled: false },
)
</script>

<template>
  <a v-if="disabled" class="t-nav" role="link" aria-disabled="true" :aria-label="label">
    <UiIcon v-if="icon" :name="icon" />
    <span v-if="!rail" class="t-nav__label rp-trunc">{{ label }}</span>
  </a>
  <RouterLink v-else v-slot="{ href, navigate, isActive }" :to="to" custom>
    <a
      class="t-nav"
      :href="href"
      :aria-current="(active ?? isActive) ? 'page' : undefined"
      :aria-label="rail ? label : undefined"
      :title="rail ? label : undefined"
      @click="navigate"
    >
      <UiIcon v-if="icon" :name="icon" />
      <span v-if="!rail" class="t-nav__label rp-trunc">{{ label }}</span>
      <slot v-if="!rail" />
    </a>
  </RouterLink>
</template>
