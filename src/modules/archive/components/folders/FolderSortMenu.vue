<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { DesignStub, UiButton, UiMenu, UiMenuItem } from '@/shared/ui'

import type { FolderSortDirection, FolderSortField } from '../../model/types'
import './folders.css'
import { FOLDER_SORT_OPTIONS, sortKey } from './sort-param'

/**
 * "Sırala" düğmesi + menü (E-06-09). Seçenekler yalnız ada/dosya sayısına göre; "Son yükleme"
 * alan yokken devre dışı (BE-025). Dosya sayısı bilinmiyorsa (yönetici ızgarası, BE-072) sayı
 * seçenekleri devre dışı. Esc, Tab, seçim ve dışarı tık menüyü kapatır; Esc/seçimde odak tetikleyiciye döner.
 */
const props = defineProps<{
  field: FolderSortField
  direction: FolderSortDirection
  hasCounts: boolean
}>()
const emit = defineEmits<{
  'update:sort': [field: FolderSortField, direction: FolderSortDirection]
}>()
const { t } = useI18n()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const current = computed(() => sortKey({ field: props.field, direction: props.direction }))

function focusTrigger(): void {
  void nextTick(() => root.value?.querySelector<HTMLElement>('.archive-sort__btn')?.focus())
}

function close(returnFocus: boolean): void {
  if (!open.value) return
  open.value = false
  if (returnFocus) focusTrigger()
}

function pick(field: FolderSortField, direction: FolderSortDirection): void {
  close(true)
  if (field !== props.field || direction !== props.direction) emit('update:sort', field, direction)
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
  <span ref="root" class="archive-sort">
    <UiButton
      class="archive-sort__btn"
      size="sm"
      icon-end="chevron-down"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="open ? 'archive-sort-menu' : undefined"
      @click="open ? close(true) : (open = true)"
    >
      {{ t('archive.folders.sort.button', { field: t(`archive.folders.sort.short.${current}`) }) }}
    </UiButton>
    <UiMenu
      v-if="open"
      id="archive-sort-menu"
      class="archive-sort__pop"
      :label="t('archive.folders.sort.menu')"
      @close="close($event === 'escape')"
    >
      <UiMenuItem
        v-for="option in FOLDER_SORT_OPTIONS"
        :key="option.key"
        :checked="current === option.key"
        :disabled="option.field === 'dosya' && !hasCounts"
        :data-sort="option.key"
        @select="pick(option.field, option.direction)"
      >
        {{ t(`archive.folders.sort.${option.key}`) }}
      </UiMenuItem>
      <DesignStub id="BE-025" as="div">
        <UiMenuItem :checked="false" disabled data-sort="sonYukleme">
          {{ t('archive.folders.sort.sonYukleme') }}
        </UiMenuItem>
      </DesignStub>
    </UiMenu>
  </span>
</template>
