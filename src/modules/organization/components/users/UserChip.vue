<script setup lang="ts">
import './panel.css'

import { computed, nextTick, onBeforeUnmount, ref } from 'vue'

import type { TeamRole } from '@/shared/scope/standing-facts'
import { UiIcon, UiMenu, UiMenuItem } from '@/shared/ui'

import { ROLE_ORDER } from '../../model/memberships'
import { usersText } from './messages'
import { ROLE_TEXT } from './user-rows'

/**
 * E-05-32 — tek koordinatörlük çipi = (birim, rol). Rol seçici yalnız `canChangeRole` (ŞY,
 * hedef ≠ çağıran); değilse rol salt metin. X yalnız `canRemove` (kendi satırında gizli). İşlem
 * sürerken düğmeler kapalı (çift gönderim yok). Menü dışarı tık, Esc ve Tab ile kapanır.
 */
const props = defineProps<{
  name: string
  role: TeamRole
  canChangeRole: boolean
  canRemove: boolean
  busy: boolean
}>()
const emit = defineEmits<{ changeRole: [role: TeamRole]; remove: [] }>()

/** Seçili rol kümesi (değişim yoksa istek yok). */
const current = computed(() => new Set<TeamRole>([props.role]))
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)

function onDocumentClick(event: MouseEvent): void {
  if (!root.value?.contains(event.target as Node)) close(false)
}

function close(returnFocus: boolean): void {
  if (!open.value) return
  open.value = false
  document.removeEventListener('click', onDocumentClick, true)
  if (returnFocus) void nextTick(() => trigger.value?.focus())
}

function toggle(): void {
  if (open.value) return close(true)
  open.value = true
  document.addEventListener('click', onDocumentClick, true)
}

function pick(option: TeamRole): void {
  close(true)
  if (!current.value.has(option)) emit('changeRole', option)
}

onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick, true))
</script>

<template>
  <span ref="root" class="t-chip users-chip" :class="{ 't-chip--static': !canRemove }">
    <span class="rp-trunc">{{ name }}</span>
    <button
      v-if="canChangeRole"
      ref="trigger"
      type="button"
      class="users-chip__role"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-label="usersText('usersPage.panel.chips.roleMenu', { name })"
      :disabled="busy"
      data-testid="chip-role"
      @click="toggle"
    >
      {{ usersText(ROLE_TEXT[role]) }}
      <UiIcon name="chevron-down" size="sm" />
    </button>
    <span v-else class="users-chip__role users-chip__role--static" data-testid="chip-role-static">
      {{ usersText(ROLE_TEXT[role]) }}
    </span>
    <button
      v-if="canRemove"
      class="t-chip__x"
      type="button"
      :aria-label="usersText('usersPage.panel.chips.remove', { name })"
      :disabled="busy"
      data-testid="chip-remove"
      @click="emit('remove')"
    >
      <UiIcon name="close" size="sm" />
    </button>
    <UiMenu
      v-if="open"
      class="users-pop"
      :label="usersText('usersPage.panel.chips.roleMenu', { name })"
      @close="close(true)"
    >
      <UiMenuItem
        v-for="option in ROLE_ORDER"
        :key="option"
        :checked="current.has(option)"
        :data-chip-role="option"
        @select="pick(option)"
      >
        {{ usersText(ROLE_TEXT[option]) }}
      </UiMenuItem>
    </UiMenu>
  </span>
</template>
