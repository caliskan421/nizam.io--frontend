<script setup lang="ts">
import './styles/ui.css'

import { computed } from 'vue'

import UiIcon from './UiIcon.vue'
import type { IconName } from './icons'

/**
 * Menü satırı (`rp-menuitem`). `checked` verilirse `menuitemradio` (`multiple` ise `menuitemcheckbox`) olur ve seçili satırda sağda
 * onay işareti çıkar. Odak menü tarafından yönetilir (`tabindex="-1"`). Tıklama `select` yayar.
 */
const props = withDefaults(
  defineProps<{
    icon?: IconName
    checked?: boolean
    danger?: boolean
    disabled?: boolean
    /** Çoklu seçim: `menuitemcheckbox` (varsayılan `menuitemradio`). */
    multiple?: boolean
  }>(),
  { icon: undefined, checked: undefined, danger: false, disabled: false, multiple: false },
)
const emit = defineEmits<{ select: [] }>()
const radio = computed(() => props.checked !== undefined)
</script>

<template>
  <button
    class="rp-menuitem"
    :class="{ 'rp-menuitem--danger': danger }"
    type="button"
    :role="radio ? (multiple ? 'menuitemcheckbox' : 'menuitemradio') : 'menuitem'"
    :aria-checked="radio ? (checked ? 'true' : 'false') : undefined"
    tabindex="-1"
    :disabled="disabled"
    @click="emit('select')"
  >
    <UiIcon v-if="icon" :name="icon" size="sm" />
    <span class="rp-menuitem__label rp-trunc"><slot /></span>
    <slot name="end" />
    <UiIcon v-if="checked" name="check" size="sm" />
  </button>
</template>
