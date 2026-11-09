<script setup lang="ts" generic="V extends string">
import './styles/ui.css'

import { ref } from 'vue'

import { rovingTarget } from './roving'
import type { UiChoiceOption } from './types'
import UiCount from './UiCount.vue'
import UiIcon from './UiIcon.vue'

/**
 * Segment denetimi (`rp-seg`, `role="group"`, düğmelerde `aria-pressed`). Tek seçim; `allowEmpty`
 * iken basılı düğmeye yeniden basmak seçimi kaldırır (tekli aç/kapa süzgeci). Sayaç biçimi
 * tasarım kaynağına göre: varsayılan parantezli (`Gorevler-Liste.dc.html` "Tümü (263)"),
 * `parens=false` ile parantezsiz (`Kullanicilar.dc.html` / `Koordinatorlukler.dc.html` "Tümü 185").
 * Klavye: ←/→, Home/End odağı taşır; Enter/Boşluk seçer (yerel düğme).
 */
const props = withDefaults(
  defineProps<{
    options: readonly UiChoiceOption<V>[]
    label: string
    allowEmpty?: boolean
    disabled?: boolean
    parens?: boolean
  }>(),
  { allowEmpty: false, disabled: false, parens: true },
)
const model = defineModel<V | null>({ default: null })
const root = ref<HTMLElement | null>(null)

function pick(value: V): void {
  model.value = props.allowEmpty && model.value === value ? null : value
}

function onKeydown(event: KeyboardEvent): void {
  const buttons = [...(root.value?.querySelectorAll<HTMLElement>('button') ?? [])]
  rovingTarget(event, buttons, 'horizontal')
}
</script>

<template>
  <div ref="root" class="rp-seg" role="group" :aria-label="label" @keydown="onKeydown">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :aria-pressed="model === option.value ? 'true' : 'false'"
      :disabled="disabled || option.disabled"
      @click="pick(option.value)"
    >
      <UiIcon v-if="option.icon" :name="option.icon" size="sm" />
      {{ option.label }}
      <UiCount v-if="option.count !== undefined" :value="option.count" :parens="parens" />
    </button>
  </div>
</template>
