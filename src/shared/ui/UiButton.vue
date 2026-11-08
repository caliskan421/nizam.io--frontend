<script setup lang="ts">
import './styles/ui.css'

import UiIcon from './UiIcon.vue'
import type { IconName } from './icons'

/** Düğme (`t-btn`): birincil / ikincil / hayalet / tehlike; sm / md / lg; tam genişlik. */
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    block?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    icon?: IconName
    iconEnd?: IconName
  }>(),
  {
    variant: 'secondary',
    size: 'md',
    block: false,
    disabled: false,
    type: 'button',
    icon: undefined,
    iconEnd: undefined,
  },
)
</script>

<template>
  <button
    class="t-btn"
    :class="[`t-btn--${variant}`, { [`t-btn--${size}`]: size !== 'md', 't-btn--block': block }]"
    :type="type"
    :disabled="disabled"
  >
    <UiIcon v-if="icon" :name="icon" size="sm" />
    <span class="rp-trunc"><slot /></span>
    <UiIcon v-if="iconEnd" :name="iconEnd" size="sm" />
  </button>
</template>
