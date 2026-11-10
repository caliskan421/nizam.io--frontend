<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { DesignStub, UiButton, UiIconButton, UiMenu, UiMenuItem } from '@/shared/ui'

import { panelText } from './messages'

export type PanelAction = 'addDependency' | 'removeDependency' | 'openInList'

/**
 * E-03C-64…66 — eylem satırı. "Kaydet" (Admin, doğrudan) ve "Tarih talebi gönder" (Koordinatör;
 * bekleyen talep varken gizli) yetkiye göre; Hatırlat devre dışı + `BE-008` stub; "Diğer işlemler"
 * menüsü (Admin + Koordinatör; Üye'de yok): bağımlılık ekle/kaldır, Liste görünümünde aç. Menü
 * kapanınca odak tetikleyiciye döner (Esc, seçim, dışarı tıklama).
 */
defineProps<{ canSave: boolean; canRequest: boolean; canManage: boolean; busy: boolean }>()
const emit = defineEmits<{ save: []; request: []; action: [action: PanelAction] }>()

const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLElement | null>(null)
const menuOpen = ref(false)

function onOutside(event: PointerEvent): void {
  if (root.value && !root.value.contains(event.target as Node)) menuOpen.value = false
}
watch(menuOpen, (isOpen) => {
  if (isOpen) document.addEventListener('pointerdown', onOutside)
  else document.removeEventListener('pointerdown', onOutside)
})
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside))

async function closeMenu(): Promise<void> {
  menuOpen.value = false
  await nextTick()
  trigger.value?.querySelector<HTMLElement>('button')?.focus()
}

async function pick(action: PanelAction): Promise<void> {
  await closeMenu()
  emit('action', action)
}
</script>

<template>
  <div ref="root" class="tp-actions">
    <div class="tp-actions__main">
      <UiButton
        v-if="canSave"
        variant="primary"
        :disabled="busy"
        data-testid="tp-save"
        @click="emit('save')"
      >
        {{ panelText('actions.save') }}
      </UiButton>
      <UiButton
        v-if="canRequest"
        :variant="canSave ? 'secondary' : 'primary'"
        :disabled="busy"
        data-testid="tp-request"
        @click="emit('request')"
      >
        {{ panelText('actions.requestDate') }}
      </UiButton>
    </div>
    <div v-if="canManage" class="tp-actions__icons">
      <DesignStub id="BE-008">
        <UiIconButton
          icon="bell"
          :label="panelText('actions.remind')"
          disabled
          data-testid="tp-remind"
        />
      </DesignStub>
      <span ref="trigger" class="tp-actions__trigger">
        <UiIconButton
          icon="more"
          :label="panelText('actions.more')"
          aria-haspopup="menu"
          :aria-expanded="menuOpen ? 'true' : 'false'"
          data-testid="tp-more"
          @click="menuOpen = !menuOpen"
        />
      </span>
      <UiMenu v-if="menuOpen" class="tp-menu" :label="panelText('actions.menu')" @close="closeMenu">
        <UiMenuItem data-action="addDependency" @select="pick('addDependency')">
          {{ panelText('actions.addDependency') }}
        </UiMenuItem>
        <UiMenuItem data-action="removeDependency" @select="pick('removeDependency')">
          {{ panelText('actions.removeDependency') }}
        </UiMenuItem>
        <UiMenuItem data-action="openInList" @select="pick('openInList')">
          {{ panelText('openInList') }}
        </UiMenuItem>
      </UiMenu>
    </div>
  </div>
</template>
