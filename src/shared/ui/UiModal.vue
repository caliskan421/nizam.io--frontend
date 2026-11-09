<script setup lang="ts">
import './styles/ui.css'

import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'

import { useFocusTrap } from './focus-trap'
import { uiText } from './messages'
import { useModalLayer } from './modal-layer'
import UiIconButton from './UiIconButton.vue'

/**
 * Pencere (`t-modal`): `role="dialog"` + `aria-modal="true"`, başlık/açıklama bağlı, odak tuzağı,
 * kapanınca odak tetiğe döner. `dismissible` iken Esc, perde tıklaması ve kapat düğmesi kapatır;
 * değilse (ör. işlem sürerken) yalnız çağıran kapatır. Gövde varsayılan yuva, düğmeler `footer`.
 * Odak gönderimde (`disabled` düğme) `BODY`'ye düşse de Esc/Tab pencerede kalır ve odak geri
 * alınır (`modal-layer.ts`, W83).
 */
const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    dismissible?: boolean
    closeLabel?: string
  }>(),
  { description: undefined, dismissible: true, closeLabel: undefined },
)
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)
const trap = useFocusTrap(panel)
const layer = useModalLayer(panel, dismiss)
const id = `ui-modal-${useId()}`

function dismiss(): void {
  if (!props.dismissible) return
  open.value = false
  emit('close')
}

// Perde yalnız basma ve bırakma ikisi de perdedeyse kapatır (pencere içinden sürükleyip
// dışarıda bırakmak — ör. metin seçimi — kapatmaz).
let pressedBackdrop = false
function onBackdropDown(event: MouseEvent): void {
  pressedBackdrop = event.target === event.currentTarget
}
function onBackdropClick(event: MouseEvent): void {
  if (pressedBackdrop && event.target === event.currentTarget) dismiss()
  pressedBackdrop = false
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    dismiss()
    return
  }
  trap.onKeydown(event)
}

watch(
  open,
  async (isOpen, wasOpen) => {
    if (isOpen) {
      await nextTick()
      if (!open.value) return
      trap.activate()
      layer.enter()
    } else if (wasOpen) {
      layer.leave()
      trap.deactivate()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  layer.leave()
  if (open.value) trap.deactivate()
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="t-modal-backdrop" @mousedown="onBackdropDown" @click="onBackdropClick">
      <div
        ref="panel"
        class="t-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`${id}-title`"
        :aria-describedby="description ? `${id}-desc` : undefined"
        tabindex="-1"
        @keydown="onKeydown"
      >
        <header class="t-modal__head">
          <div>
            <h2 :id="`${id}-title`" class="t-modal__title">{{ title }}</h2>
            <p v-if="description" :id="`${id}-desc`" class="t-modal__desc">{{ description }}</p>
          </div>
          <UiIconButton
            v-if="dismissible"
            icon="close"
            :label="closeLabel ?? uiText('ui.modal.close')"
            @click="dismiss"
          />
        </header>
        <div class="t-modal__body"><slot /></div>
        <footer v-if="$slots.footer" class="t-modal__foot"><slot name="footer" /></footer>
      </div>
    </div>
  </Teleport>
</template>
