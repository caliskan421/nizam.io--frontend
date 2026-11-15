<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { UiIconButton, UiMenu, UiMenuItem } from '@/shared/ui'

import { ARCHIVE_TAGS, tagView } from '../../model/tags'
import type { ArchiveTag } from '../../model/types'
import TagDot from '../files/TagDot.vue'
import { previewText } from './messages'

/**
 * E-06-58/64 — "Etiketi değiştir" menüsü (`retagFile`, BE-074): kapalı kümenin altı etiketi
 * (P34 adları/renkleri; `TagDot` ile aynı sözlük), geçerli etiket işaretli. Seçim `select` yayar
 * (aynı etiket de yayılır: sunucu 200 "değişiklik yok" döner, yazma kuralları çağıranda). Esc ve
 * seçim menüyü kapatır ve odağı tetikleyiciye döndürür; dışarı tık odağı taşımaz (KESİN 27).
 * Menü yokken `aria-controls` verilmez. Yazma süresince tetikleyici devre dışı BIRAKILMAZ (odak
 * geri dönebilsin, KESİN 27): `busy` yalnız `aria-busy` işaretler, ikinci seçim çağıranda yok sayılır.
 */
defineProps<{ current: string; busy: boolean }>()
const emit = defineEmits<{ select: [tag: ArchiveTag] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const MENU_ID = 'af-retag-menu'

function focusTrigger(): void {
  void nextTick(() => root.value?.querySelector<HTMLElement>('button')?.focus())
}
function close(returnFocus: boolean): void {
  if (!open.value) return
  open.value = false
  if (returnFocus) focusTrigger()
}
function pick(tag: ArchiveTag): void {
  close(true)
  emit('select', tag)
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
  <span ref="root" class="af-retag">
    <UiIconButton
      icon="tag"
      :label="previewText('archive.actions.retag')"
      :aria-busy="busy ? 'true' : undefined"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="open ? MENU_ID : undefined"
      data-testid="file-retag"
      @click="open ? close(true) : (open = true)"
    />
    <UiMenu
      v-if="open"
      :id="MENU_ID"
      class="af-retag__pop"
      :label="previewText('archive.actions.retagMenu')"
      @close="close($event === 'escape')"
    >
      <UiMenuItem
        v-for="tag in ARCHIVE_TAGS"
        :key="tag"
        :checked="current === tag"
        :data-retag="tag"
        @select="pick(tag)"
      >
        <TagDot :tag="tag" aria-hidden="true" />{{ tagView(tag).label }}
      </UiMenuItem>
    </UiMenu>
  </span>
</template>
