<script setup lang="ts">
import './forms.css'

import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { UiButton, UiMenu, UiMenuItem } from '@/shared/ui'

import type { StatusMenuEmits, StatusMenuProps } from '../index'
import { formsText, statusLabel } from './messages'
import RevertReasonDialog from './RevertReasonDialog.vue'
import { STATUS_DOT, useStatusTransition } from './use-status-transition'

/**
 * W45 · E-03-44 → E-03-58 — durum seçici (tasarım `rp-selbtn` + `rp-status`; açılır menü P3
 * en sade `rp-pop`). Yetkisiz ya da hedefi olmayan aktörde salt okunur durum etiketi (yönetici
 * tek başına aktör değildir, s.141). Menü yalnız §5 matrisindeki hedefleri listeler.
 */
const props = defineProps<StatusMenuProps>()
const emit = defineEmits<StatusMenuEmits>()

const { targets, reasonFor, choose, submitReason, isPending } = useStatusTransition(
  () => props.item,
  {
    transitioned: (result) => emit('transitioned', result),
    requestEvidence: () => emit('requestEvidence'),
  },
)

const root = ref<HTMLElement | null>(null)
const menuOpen = ref(false)
const reasonOpen = computed({
  get: () => reasonFor.value !== null,
  set: (value: boolean) => {
    if (!value) reasonFor.value = null
  },
})

function onOutside(event: PointerEvent): void {
  if (root.value && !root.value.contains(event.target as Node)) menuOpen.value = false
}

watch(menuOpen, (isOpen) => {
  if (isOpen) document.addEventListener('pointerdown', onOutside)
  else document.removeEventListener('pointerdown', onOutside)
})
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside))

function closeMenu(returnFocus: boolean): void {
  menuOpen.value = false
  if (returnFocus) void nextTick(() => root.value?.querySelector<HTMLElement>('button')?.focus())
}

function pick(to: (typeof targets.value)[number]): void {
  closeMenu(true)
  void choose(to)
}
</script>

<template>
  <div ref="root" class="wf-status">
    <span v-if="targets.length === 0" class="rp-status" data-testid="wf-status-label">
      <span class="rp-dot" :class="STATUS_DOT[item.status]" aria-hidden="true" />
      {{ statusLabel(item.status) }}
    </span>
    <template v-else>
      <UiButton
        size="sm"
        class="rp-selbtn"
        icon-end="chevron-down"
        aria-haspopup="menu"
        :aria-expanded="menuOpen ? 'true' : 'false'"
        :aria-label="
          formsText('workForms.transition.current', { status: statusLabel(item.status) })
        "
        :disabled="isPending"
        data-testid="wf-status-trigger"
        @click="menuOpen = !menuOpen"
      >
        <span class="rp-status">
          <span class="rp-dot" :class="STATUS_DOT[item.status]" aria-hidden="true" />
          {{ statusLabel(item.status) }}
        </span>
      </UiButton>
      <UiMenu
        v-if="menuOpen"
        class="wf-status__pop"
        :label="formsText('workForms.transition.menu')"
        @close="closeMenu(true)"
      >
        <UiMenuItem v-for="to in targets" :key="to" :data-to="to" @select="pick(to)">
          <span class="rp-status">
            <span class="rp-dot" :class="STATUS_DOT[to]" aria-hidden="true" />
            {{ statusLabel(to) }}
          </span>
        </UiMenuItem>
      </UiMenu>
    </template>
    <RevertReasonDialog v-model:open="reasonOpen" :pending="isPending" @submit="submitReason" />
  </div>
</template>
