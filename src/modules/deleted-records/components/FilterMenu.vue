<script setup lang="ts" generic="V extends string | null">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'

import { UiIcon, UiMenu, UiMenuItem } from '@/shared/ui'
import type { IconName } from '@/shared/ui'

/**
 * Süzgeç açılır menüsü (E-12-17/18/19): tetikleyici düğme + `UiMenu` (`menuitemradio`). Odak
 * dönüşü (KESİN 27): Esc ve seçim sonrası odak tetikleyiciye döner; Tab ve dış tıklamada kapanır,
 * odak kullanıcının gittiği yerde kalır. Menü kapalıyken `aria-controls` verilmez.
 */
const props = withDefaults(
  defineProps<{
    /** Menünün erişilebilir adı. */
    label: string
    /** Tetikleyicideki görünür metin. */
    trigger: string
    options: ReadonlyArray<{ value: V; label: string }>
    modelValue: V
    disabled?: boolean
    icon?: IconName
    /** Devre dışı nedeni (ipucu). */
    hint?: string
  }>(),
  { disabled: false, icon: undefined, hint: undefined },
)
const emit = defineEmits<{ 'update:modelValue': [value: V] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const button = ref<HTMLButtonElement | null>(null)
const menuId = `dr-menu-${useId()}`

function focusTrigger(): void {
  void nextTick(() => button.value?.focus())
}

function close(restoreFocus: boolean): void {
  if (!open.value) return
  open.value = false
  if (restoreFocus) focusTrigger()
}

function pick(value: V): void {
  emit('update:modelValue', value)
  close(true)
}

function onOutside(event: PointerEvent): void {
  if (open.value && !root.value?.contains(event.target as Node)) close(false)
}

watch(open, (value) => {
  if (value) document.addEventListener('pointerdown', onOutside)
  else document.removeEventListener('pointerdown', onOutside)
})
watch(
  () => props.disabled,
  (value) => {
    if (value) close(false)
  },
)
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside))
</script>

<template>
  <div ref="root" class="dr-pop-anchor">
    <button
      ref="button"
      class="t-btn t-btn--secondary t-btn--sm dr-menubtn"
      type="button"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="open ? menuId : undefined"
      :disabled="disabled"
      :title="disabled ? hint : undefined"
      @click="open = !open"
    >
      <UiIcon v-if="icon" :name="icon" size="sm" />
      <span class="rp-trunc">{{ trigger }}</span>
      <UiIcon name="chevron-down" size="sm" />
    </button>
    <UiMenu
      v-if="open"
      :id="menuId"
      class="dr-pop"
      :label="label"
      @close="(reason) => close(reason === 'escape')"
    >
      <UiMenuItem
        v-for="option in options"
        :key="option.value ?? '_all'"
        :checked="modelValue === option.value"
        @select="pick(option.value)"
      >
        {{ option.label }}
      </UiMenuItem>
    </UiMenu>
  </div>
</template>
