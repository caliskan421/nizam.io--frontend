<script setup lang="ts">
import { nextTick, ref } from 'vue'

import { DesignStub, UiCheck, UiIconButton, UiMenu, UiMenuItem } from '@/shared/ui'

import { subtaskText } from './messages'

/**
 * Alt görev menüsü (E-03-36; `ozellikler.md` §3-C): `rp-pop` `role="menu"`, sağa yaslı.
 * "zorunlu alanlar" üç kutusu STATİK — devre dışı, işaretsiz, `DesignStub` BE-006 (P5: yeni
 * zorunluluk bayrağı yok; uç/alan yok). "Başlığı düzenle" (E-03-32 başlık yazması; çizilmemiş,
 * P3 minimum) ve "Alt görevi sil" (istemci onayı, E-03-64) canlı. Yalnız s.146 yetkisinde
 * görünür (çağıran). Esc / Tab / odağın menüden çıkması kapatır.
 */
const props = defineProps<{ title: string; open: boolean; busy: boolean }>()
const emit = defineEmits<{ open: [value: boolean]; rename: []; remove: [] }>()

const root = ref<HTMLElement | null>(null)

function focusTrigger(): void {
  void nextTick(() => root.value?.querySelector<HTMLElement>('.rp-stask__menu')?.focus())
}

function onClose(reason: 'escape' | 'tab'): void {
  emit('open', false)
  if (reason === 'escape') focusTrigger()
}

function choose(action: 'rename' | 'remove'): void {
  emit('open', false)
  if (action === 'rename') emit('rename')
  else {
    focusTrigger()
    emit('remove')
  }
}

function onFocusOut(event: FocusEvent): void {
  const next = event.relatedTarget as Node | null
  if (props.open && next && !root.value?.contains(next)) emit('open', false)
}
</script>

<template>
  <div ref="root" class="sub-cell sub-menu" @focusout="onFocusOut">
    <UiIconButton
      class="rp-stask__menu"
      icon="more"
      :label="subtaskText('subtasks.row.menu', { title })"
      :aria-expanded="open ? 'true' : 'false'"
      aria-haspopup="menu"
      :disabled="busy"
      data-testid="subtask-menu"
      @click="emit('open', !open)"
    />
    <UiMenu
      v-if="open"
      class="sub-pop sub-pop--menu"
      :label="subtaskText('subtasks.row.menu', { title })"
      @close="onClose"
    >
      <p class="rp-thpop__title">{{ subtaskText('subtasks.menu.required') }}</p>
      <DesignStub id="BE-006" as="div" data-testid="subtask-required-flags">
        <label class="sub-flag">
          <UiCheck disabled />
          {{ subtaskText('subtasks.menu.person') }}
        </label>
        <label class="sub-flag">
          <UiCheck disabled />
          {{ subtaskText('subtasks.menu.dates') }}
        </label>
        <label class="sub-flag">
          <UiCheck disabled />
          {{ subtaskText('subtasks.menu.evidence') }}
        </label>
      </DesignStub>
      <div class="sub-sep" role="separator" />
      <UiMenuItem data-testid="subtask-rename" @select="choose('rename')">
        {{ subtaskText('subtasks.menu.rename') }}
      </UiMenuItem>
      <UiMenuItem danger data-testid="subtask-remove" @select="choose('remove')">
        {{ subtaskText('subtasks.menu.remove') }}
      </UiMenuItem>
    </UiMenu>
  </div>
</template>
