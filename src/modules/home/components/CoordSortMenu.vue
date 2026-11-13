<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'

import { DesignStub, UiButton, UiMenu, UiMenuItem } from '@/shared/ui'

import { COORD_SORT_KEYS, coordSortDisabled, type CoordSortKey } from '../model/coordinatorships'
import { homeText } from '../model/messages'

/**
 * "Sırala" düğmesi + sıralama menüsü (E-01-25/26; `mekanizma.md` §3). Etiket "Sırala: ‹ölçüt› ↓"
 * (ters sırada ↑). Menü: altı ölçüt (`menuitemradio`, ipucu satırlı), ayraç, "Sırayı ters çevir".
 * Ölçüt seçimi `reversed=false` yapar ve menüyü kapatır; ters çevirme de kapatır; Esc ve öğe
 * seçimi odağı düğmeye döndürür, dışarı tıklama ve Tab döndürmez (KESİN 27). "Son yükleme"
 * BE-025'e dek devre dışıdır (tıklanmaz). Menü yokken `aria-controls` verilmez.
 */
defineProps<{ sortKey: CoordSortKey; reversed: boolean }>()
const emit = defineEmits<{ pick: [key: CoordSortKey]; flip: [] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const menuId = `home-sort-${useId()}`

function close(returnFocus: boolean): void {
  if (!open.value) return
  open.value = false
  if (returnFocus) {
    void nextTick(() => root.value?.querySelector<HTMLElement>('.home-sort__btn')?.focus())
  }
}

function pick(key: CoordSortKey): void {
  close(true)
  emit('pick', key)
}

function flip(): void {
  close(true)
  emit('flip')
}

function onOutside(event: PointerEvent): void {
  if (root.value && !root.value.contains(event.target as Node)) close(false)
}

watch(open, (isOpen) => {
  if (isOpen) document.addEventListener('pointerdown', onOutside, true)
  else document.removeEventListener('pointerdown', onOutside, true)
})
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside, true))
</script>

<template>
  <span ref="root" class="home-sort">
    <UiButton
      class="home-sort__btn"
      size="sm"
      icon="sort"
      icon-end="chevron-down"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="open ? menuId : undefined"
      @click="open = !open"
    >
      {{
        homeText('home.coords.sortButton', { label: homeText(`home.coords.sort.${sortKey}.label`) })
      }}
      {{ reversed ? homeText('home.coords.sortUp') : homeText('home.coords.sortDown') }}
    </UiButton>
    <UiMenu
      v-if="open"
      :id="menuId"
      class="home-sort__pop"
      :label="homeText('home.coords.sortMenu')"
      @close="close($event === 'escape')"
    >
      <template v-for="key in COORD_SORT_KEYS" :key="key">
        <DesignStub v-if="coordSortDisabled(key)" id="BE-025" as="div">
          <UiMenuItem :checked="false" disabled :data-sort="key">
            <span class="home-sort__text">
              <span>{{ homeText(`home.coords.sort.${key}.label`) }}</span>
              <span class="rp-cap rp-trunc">{{ homeText('home.coords.lastUploadOff') }}</span>
            </span>
          </UiMenuItem>
        </DesignStub>
        <UiMenuItem v-else :checked="sortKey === key" :data-sort="key" @select="pick(key)">
          <span class="home-sort__text">
            <span>{{ homeText(`home.coords.sort.${key}.label`) }}</span>
            <span class="rp-cap rp-trunc">{{ homeText(`home.coords.sort.${key}.hint`) }}</span>
          </span>
        </UiMenuItem>
      </template>
      <div class="rp-menudiv" role="separator" />
      <UiMenuItem icon="sort" data-sort="flip" @select="flip">
        {{ homeText('home.coords.flip') }}
      </UiMenuItem>
    </UiMenu>
  </span>
</template>
