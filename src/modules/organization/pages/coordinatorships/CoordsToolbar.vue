<script setup lang="ts">
import './coordinatorships.css'

import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { DesignStub, UiButton, UiIcon, UiInput, UiMenu, UiMenuItem } from '@/shared/ui'

import { coordsText } from '../../components/coordinatorships/messages'
import CoordsGlyph from './CoordsGlyph.vue'
import type { SortDirection } from './url-state'

/**
 * Araç çubuğu (E-08-12…16). Görünüm: "Liste" basılı, "Yapı" devre dışı (BE-016). Arama yüklenen
 * kümede, URL'ye ~300 ms gecikmeyle yazılır (E-08-13). Durum (Aktif/Pasif) ve "Üst birim"
 * gizli (BE-017, BE-016). Sıralama yalnız ada göre + yön (E-08-16).
 */
const props = defineProps<{ search: string; direction: SortDirection }>()
const emit = defineEmits<{
  'update:search': [value: string]
  'update:direction': [value: SortDirection]
}>()

/** Arama URL yazım gecikmesi (E-08-13; 03 ile aynı tek sabit). */
const SEARCH_DEBOUNCE_MS = 300

const draft = ref(props.search)
let timer: ReturnType<typeof setTimeout> | undefined

function cancel(): void {
  if (timer !== undefined) clearTimeout(timer)
  timer = undefined
}

watch(draft, (value) => {
  cancel()
  if (value === props.search) return
  timer = setTimeout(() => {
    timer = undefined
    emit('update:search', value)
  }, SEARCH_DEBOUNCE_MS)
})

watch(
  () => props.search,
  (value) => {
    if (value === draft.value) return
    cancel()
    draft.value = value
  },
)

const sortOpen = ref(false)
const sortRoot = ref<HTMLElement | null>(null)

function closeSort(returnFocus: boolean): void {
  sortOpen.value = false
  if (returnFocus) {
    void nextTick(() => sortRoot.value?.querySelector<HTMLElement>('.coords-sort__btn')?.focus())
  }
}

function pickSort(direction: SortDirection): void {
  closeSort(true)
  if (direction !== props.direction) emit('update:direction', direction)
}

function onOutside(event: PointerEvent): void {
  if (sortRoot.value && !sortRoot.value.contains(event.target as Node)) closeSort(false)
}

watch(sortOpen, (open) => {
  if (open) document.addEventListener('pointerdown', onOutside, true)
  else document.removeEventListener('pointerdown', onOutside, true)
})
onBeforeUnmount(() => {
  cancel()
  document.removeEventListener('pointerdown', onOutside, true)
})
</script>

<template>
  <div class="rp-toolbar">
    <div class="rp-tgroup">
      <div class="rp-seg" role="group" :aria-label="coordsText('coordinatorships.toolbar.view')">
        <button type="button" aria-pressed="true" data-view="liste">
          <UiIcon name="list" size="sm" />{{ coordsText('coordinatorships.toolbar.list') }}
        </button>
        <DesignStub id="BE-016">
          <button type="button" aria-pressed="false" disabled data-view="yapi">
            <CoordsGlyph name="branch" />{{ coordsText('coordinatorships.toolbar.tree') }}
          </button>
        </DesignStub>
      </div>
    </div>
    <div class="rp-tgroup rp-tgroup--grow">
      <div class="coords-search">
        <UiInput
          v-model="draft"
          type="search"
          icon="search"
          size="sm"
          :aria-label="coordsText('coordinatorships.toolbar.search')"
          :placeholder="coordsText('coordinatorships.toolbar.searchPlaceholder')"
        />
      </div>
    </div>
    <div class="rp-tgroup">
      <span ref="sortRoot" class="coords-sort">
        <UiButton
          class="coords-sort__btn"
          size="sm"
          icon-end="chevron-down"
          aria-haspopup="menu"
          :aria-expanded="sortOpen ? 'true' : 'false'"
          @click="sortOpen = !sortOpen"
        >
          {{ coordsText('coordinatorships.toolbar.sort') }}
        </UiButton>
        <UiMenu
          v-if="sortOpen"
          class="coords-sort__pop"
          :label="coordsText('coordinatorships.toolbar.sortMenu')"
          @close="closeSort($event === 'escape')"
        >
          <UiMenuItem :checked="direction === 'artan'" @select="pickSort('artan')">
            {{ coordsText('coordinatorships.toolbar.asc') }}
          </UiMenuItem>
          <UiMenuItem :checked="direction === 'azalan'" @select="pickSort('azalan')">
            {{ coordsText('coordinatorships.toolbar.desc') }}
          </UiMenuItem>
        </UiMenu>
      </span>
    </div>
  </div>
</template>
