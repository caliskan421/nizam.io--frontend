<script setup lang="ts">
import './styles/ui.css'

import { onBeforeUnmount, watch } from 'vue'

import { uiText } from './messages'
import UiIcon from './UiIcon.vue'
import { useToast } from './use-toast'

/**
 * Bildirim yuvası (`rp-toast`): kuyruğun başındaki bildirimi gösterir, süresi dolunca kapatır.
 * Kabukta bir kez yerleştirilir. Canlı bölge her zaman DOM'dadır (ekran okuyucu duyurusu için);
 * tehlike tonu `role="alert"`, diğerleri `role="status"`.
 */
const { current, dismiss } = useToast()
let timer: ReturnType<typeof setTimeout> | undefined

function stopTimer(): void {
  if (timer !== undefined) clearTimeout(timer)
  timer = undefined
}

watch(
  current,
  (toast) => {
    stopTimer()
    if (toast && toast.timeout > 0) {
      const id = toast.id
      timer = setTimeout(() => dismiss(id), toast.timeout)
    }
  },
  { immediate: true },
)

onBeforeUnmount(stopTimer)
</script>

<template>
  <div aria-live="polite">
    <div
      v-if="current"
      :key="current.id"
      class="rp-toast"
      :class="{ 'rp-toast--danger': current.tone === 'danger' }"
      :role="current.tone === 'danger' ? 'alert' : 'status'"
    >
      <span>{{ current.message }}</span>
      <button
        class="rp-toast__x"
        type="button"
        :aria-label="uiText('ui.toast.dismiss')"
        @click="dismiss(current.id)"
      >
        <UiIcon name="close" size="sm" />
      </button>
    </div>
  </div>
</template>
