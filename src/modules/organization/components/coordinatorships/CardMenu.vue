<script setup lang="ts">
import './coordinatorships.css'

import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { DesignStub, UiIconButton, UiMenu, UiMenuItem } from '@/shared/ui'

import { coordinatorshipLocation } from '../../routes'
import { coordsText } from './messages'

/**
 * E-08-38 kart işlem menüsü (`rp-pop`, düğmenin üstünde sağa hizalı). "Sayfasını aç" → 08b,
 * "Ayarları düzenle" → 08b `sekme=ayarlar`, "Görev ata" → `createTask` (yetkiye göre gizli);
 * "Üst birimi değiştir" (BE-016) ve "Pasifleştir" (BE-017) devre dışı + stub. Esc menüyü kapatıp
 * odağı tetiğe döndürür; dışarı tık ve seçim de kapatır. Tek menü açık (her kart kendi durumunu
 * tutar; açılan menü dışarı tıklamayla diğerini kapatır).
 */
const props = defineProps<{
  departmentId: string
  name: string
  canEdit: boolean
  canCreateTask: boolean
}>()
const emit = defineEmits<{ createTask: [departmentId: string] }>()

const router = useRouter()
const open = ref(false)
const root = ref<HTMLElement | null>(null)

function focusTrigger(): void {
  void nextTick(() => root.value?.querySelector<HTMLElement>('.coords-menu__btn')?.focus())
}

function close(returnFocus = false): void {
  open.value = false
  if (returnFocus) focusTrigger()
}

function onOutside(event: PointerEvent): void {
  if (root.value && !root.value.contains(event.target as Node)) close()
}

watch(open, (value) => {
  if (value) document.addEventListener('pointerdown', onOutside, true)
  else document.removeEventListener('pointerdown', onOutside, true)
})
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside, true))

function go(sekme?: string): void {
  close()
  void router.push(coordinatorshipLocation(props.departmentId, sekme))
}

function createTask(): void {
  close()
  emit('createTask', props.departmentId)
}
</script>

<template>
  <span ref="root" class="coords-menu">
    <UiIconButton
      class="coords-menu__btn"
      icon="more"
      :label="coordsText('coordinatorships.card.actions', { name })"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      @click="open = !open"
    />
    <UiMenu
      v-if="open"
      class="coords-menu__pop"
      :label="coordsText('coordinatorships.card.actions', { name })"
      @close="close($event === 'escape')"
    >
      <UiMenuItem @select="go()">{{ coordsText('coordinatorships.card.open') }}</UiMenuItem>
      <UiMenuItem v-if="canEdit" @select="go('ayarlar')">
        {{ coordsText('coordinatorships.card.settings') }}
      </UiMenuItem>
      <UiMenuItem v-if="canCreateTask" @select="createTask">
        {{ coordsText('coordinatorships.card.createTask') }}
      </UiMenuItem>
      <DesignStub id="BE-016" as="div">
        <UiMenuItem disabled>{{ coordsText('coordinatorships.card.parent') }}</UiMenuItem>
      </DesignStub>
      <div class="rp-menudiv" role="separator" />
      <DesignStub id="BE-017" as="div">
        <UiMenuItem disabled>{{ coordsText('coordinatorships.card.deactivate') }}</UiMenuItem>
      </DesignStub>
    </UiMenu>
  </span>
</template>
