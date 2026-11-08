<script setup lang="ts">
import './styles/ui.css'

import { computed, provide, useId } from 'vue'

import { FIELD_CONTEXT } from './field-context'
import UiHint from './UiHint.vue'
import UiLabel from './UiLabel.vue'

/**
 * Form alanı (`rp-field`): etiket + denetim + açıklama/hata. İçteki `UiInput`/`UiSelect`/`UiCheck`
 * kimliği, `aria-describedby`'ı ve `aria-invalid`'i buradan alır. Metinler i18n'den çevrilmiş gelir.
 */
const props = defineProps<{ label: string; hint?: string; error?: string }>()

const id = `ui-field-${useId()}`
const hintId = `${id}-hint`
const describedBy = computed(() => (props.error || props.hint ? hintId : undefined))
const invalid = computed(() => Boolean(props.error))

provide(FIELD_CONTEXT, { id, describedBy, invalid })
</script>

<template>
  <div class="rp-field">
    <UiLabel :for="id">{{ label }}</UiLabel>
    <slot :id="id" :described-by="describedBy" :invalid="invalid" />
    <UiHint v-if="error" :id="hintId" error>{{ error }}</UiHint>
    <UiHint v-else-if="hint" :id="hintId">{{ hint }}</UiHint>
  </div>
</template>
