<script setup lang="ts">
import { computed } from 'vue'

import { UiInput, UiSegmented, type UiChoiceOption } from '@/shared/ui'

import { COORD_FILTERS, type CoordFilter, type CoordSortKey } from '../model/coordinatorships'
import { homeText } from '../model/messages'
import CoordSortMenu from './CoordSortMenu.vue'

/**
 * Koordinatörlük araç çubuğu (E-01-23…26; `rp-toolbar`): arama (kutu metni üstte, gecikmeli
 * süzme `useCoordControls`'ta), durum süzgeci (sayılar aramadan bağımsız) ve sıralama menüsü.
 */
const props = defineProps<{
  counts: Readonly<Record<CoordFilter, number>>
  sortKey: CoordSortKey
  reversed: boolean
}>()
const text = defineModel<string>('text', { required: true })
const filter = defineModel<CoordFilter>('filter', { required: true })
const emit = defineEmits<{ pick: [key: CoordSortKey]; flip: [] }>()

/** `UiSegmented` boş seçime izin vermez (`allowEmpty` yok); `null` gelirse mevcut değer kalır. */
const segment = computed<CoordFilter | null>({
  get: () => filter.value,
  set: (value) => {
    if (value !== null) filter.value = value
  },
})

const options = computed<UiChoiceOption<CoordFilter>[]>(() =>
  COORD_FILTERS.map((value) => ({
    value,
    label: homeText(`home.coords.filter.${value}`),
    count: props.counts[value],
  })),
)
</script>

<template>
  <div class="rp-toolbar" data-region="coords-toolbar">
    <div class="rp-tgroup">
      <div class="home-search">
        <UiInput
          v-model="text"
          type="search"
          icon="search"
          size="sm"
          :placeholder="homeText('home.coords.search')"
          :aria-label="homeText('home.coords.search')"
        />
      </div>
      <UiSegmented
        v-model="segment"
        :options="options"
        :label="homeText('home.coords.statusFilter')"
        :parens="false"
      />
    </div>
    <span class="rp-grow" />
    <div class="rp-tgroup">
      <CoordSortMenu
        :sort-key="sortKey"
        :reversed="reversed"
        @pick="emit('pick', $event)"
        @flip="emit('flip')"
      />
    </div>
  </div>
</template>
