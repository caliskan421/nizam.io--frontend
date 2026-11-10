<script setup lang="ts">
import './snack.css'

import { computed, onBeforeUnmount, ref } from 'vue'

import { UiIcon } from '@/shared/ui'

import { dragText, formatRange } from '../../composables/drag-messages'
import { EXTEND_DAYS_MAX, EXTEND_DAYS_MIN } from '../../model/capabilities'
import { rangeDelta } from '../../model/date-change'
import type { DateChangeSnackEmits, DateChangeSnackProps } from '../index'

/**
 * W95 · E-03C-67…72 — tarih değişimi bildirimi (`rp-snack`, `role="status"`): eski → yeni
 * aralık, fark rozeti, "İptal et" (süre içinde isteği HİÇ göndermez) ve ✕ (yalnız bildirimi
 * kapatır; gönderim sürer). Geri sayım çubuğu `remainingMs/totalMs` oranıdır; azaltılmış
 * harekette geçiş ve giriş animasyonu kapalı (CSS). `face`, YAZMA YOLUNU taşır: `admin` =
 * doğrudan (uzatıldı / tarihleri değişti), `coordinator` = talep. Gönderim, süre ve iptal
 * mantığı `useDelayedSend`'dedir; bileşen yalnız gösterir.
 *
 * Odak (KESİN 27): bildirim içinde odak varken kapanırsa (İptal et, ✕, Esc, süre dolumu, söküm)
 * odak bildirime girmeden önceki öğeye döner; o yoksa gövdeye düşmez (aşağıda).
 */
const props = defineProps<DateChangeSnackProps>()
const emit = defineEmits<DateChangeSnackEmits>()

const root = ref<HTMLElement | null>(null)
let returnTo: HTMLElement | null = null

const delta = computed(() => rangeDelta(props.before, props.after))
const signed = (n: number): string => (n > 0 ? `+${n}` : String(n))

const title = computed(() => {
  if (props.face === 'coordinator')
    return dragText('timeline.snack.title.request', { title: props.title })
  const d = delta.value
  const extended =
    d !== null && d.start === 0 && d.end >= EXTEND_DAYS_MIN && d.end <= EXTEND_DAYS_MAX
  return extended
    ? dragText('timeline.snack.title.extended', { title: props.title, days: d.end })
    : dragText('timeline.snack.title.changed', { title: props.title })
})

const badges = computed(() => {
  const d = delta.value
  if (!d) return []
  const out: string[] = []
  if (d.start !== 0) out.push(dragText('timeline.snack.delta.start', { delta: signed(d.start) }))
  if (d.end !== 0) out.push(dragText('timeline.snack.delta.end', { delta: signed(d.end) }))
  return out
})

/** Geri sayım oranı 0–1 (CSS değişkeni `--snack-left`). */
const left = computed(() =>
  props.totalMs > 0 ? Math.min(1, Math.max(0, props.remainingMs / props.totalMs)) : 0,
)

function rememberFocus(event: FocusEvent): void {
  const from = event.relatedTarget
  if (from instanceof HTMLElement && !root.value?.contains(from)) returnTo = from
}

function restoreFocus(): void {
  const el = returnTo
  returnTo = null
  if (el && el.isConnected) el.focus()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return
  event.stopPropagation()
  emit('dismiss')
}

onBeforeUnmount(() => {
  // Odak bildirimin içindeyken kapanırsa (her yol) tetikleyiciye dön.
  if (root.value && root.value.contains(document.activeElement)) restoreFocus()
})
</script>

<template>
  <div
    ref="root"
    class="rp-snack"
    role="status"
    data-testid="date-change-snack"
    @focusin="rememberFocus"
    @keydown="onKeydown"
  >
    <span class="rp-snack__ic" aria-hidden="true">
      <UiIcon name="step-forward" size="sm" />
    </span>
    <span class="rp-snack__body">
      <span class="rp-trunc rp-snack__title">{{ title }}</span>
      <span class="rp-snack__range">
        <span class="rp-snack__old">{{ formatRange(before) }}</span>
        <UiIcon name="arrow-right" size="sm" class="rp-snack__arrow" />
        <span class="rp-snack__new">{{ formatRange(after) }}</span>
        <span v-for="badge in badges" :key="badge" class="rp-snack__delta">{{ badge }}</span>
      </span>
      <span v-if="face === 'coordinator'" class="rp-snack__note">
        {{ dragText('timeline.snack.requestNote') }}
      </span>
    </span>
    <button class="rp-snack__undo" type="button" @click="emit('cancel')">
      {{ dragText('timeline.snack.cancel') }}
    </button>
    <button
      class="rp-snack__x"
      type="button"
      :aria-label="dragText('timeline.snack.dismiss')"
      @click="emit('dismiss')"
    >
      <UiIcon name="close" size="sm" />
    </button>
    <span class="rp-snack__bar" aria-hidden="true" :style="{ '--snack-left': String(left) }" />
  </div>
</template>
