<script setup lang="ts">
import '../styles/ui.css'
import './confirm.css'

import { nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'

import { useFocusTrap } from '../focus-trap'
import UiButton from '../UiButton.vue'
import { confirmText } from './messages'
import type { ConfirmRequest } from './use-confirm'

/**
 * Onay penceresi (`t-modal`, `role="alertdialog"`; `Toplanti-Formlar.dc.html` "Silme onayı"
 * kalıbı): başlık + açıklama, gövde paragrafları, isteğe bağlı görev listesi, altta "Vazgeç" +
 * onay düğmesi (tehlike tonunda `t-btn--danger`). Kapat simgesi yok; Esc ve perde vazgeçer.
 * İlk odak "Vazgeç"te (yanlışlıkla Enter etkili eylemi tetiklemez). İstek sürerken kapanmaz.
 */
const props = defineProps<{ request: ConfirmRequest }>()
const emit = defineEmits<{ accept: []; cancel: [] }>()

const panel = ref<HTMLElement | null>(null)
const trap = useFocusTrap(panel)
const id = `ui-confirm-${useId()}`

function cancel(): void {
  if (!props.request.busy) emit('cancel')
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    cancel()
    return
  }
  trap.onKeydown(event)
}

let pressedBackdrop = false
function onBackdropDown(event: MouseEvent): void {
  pressedBackdrop = event.target === event.currentTarget
}
function onBackdropClick(event: MouseEvent): void {
  if (pressedBackdrop && event.target === event.currentTarget) cancel()
  pressedBackdrop = false
}

onMounted(async () => {
  await nextTick()
  trap.activate()
})
onBeforeUnmount(() => trap.deactivate())
</script>

<template>
  <Teleport to="body">
    <div class="t-modal-backdrop" @mousedown="onBackdropDown" @click="onBackdropClick">
      <div
        ref="panel"
        class="t-modal"
        role="alertdialog"
        aria-modal="true"
        :aria-labelledby="`${id}-title`"
        :aria-describedby="request.options.description ? `${id}-desc` : undefined"
        :aria-busy="request.busy"
        tabindex="-1"
        data-testid="confirm-dialog"
        @keydown="onKeydown"
      >
        <header class="t-modal__head">
          <div>
            <h2 :id="`${id}-title`" class="t-modal__title">{{ request.options.title }}</h2>
            <p v-if="request.options.description" :id="`${id}-desc`" class="t-modal__desc">
              {{ request.options.description }}
            </p>
          </div>
        </header>
        <div class="t-modal__body ui-confirm__body">
          <p v-for="(text, index) in request.options.body ?? []" :key="index">{{ text }}</p>
          <template v-if="request.items.length > 0">
            <p :id="`${id}-items`" class="ui-confirm__k">
              {{ confirmText('confirm.impact.items') }}
            </p>
            <ul
              class="ui-confirm__list"
              :aria-labelledby="`${id}-items`"
              data-testid="confirm-items"
            >
              <li v-for="(item, index) in request.items" :key="index" class="rp-trunc">
                {{ item }}
              </li>
            </ul>
          </template>
        </div>
        <footer class="t-modal__foot">
          <UiButton variant="ghost" data-autofocus :disabled="request.busy" @click="cancel">
            {{ request.options.cancelLabel ?? confirmText('confirm.cancel') }}
          </UiButton>
          <UiButton
            :variant="request.options.tone === 'primary' ? 'primary' : 'danger'"
            data-testid="confirm-accept"
            :disabled="request.busy"
            @click="emit('accept')"
          >
            {{ request.options.confirmLabel }}
          </UiButton>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
