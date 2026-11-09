<script setup lang="ts">
import './coordinatorships.css'

import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { DesignStub, UiButton, UiIconButton, UiMenu, UiMenuItem } from '@/shared/ui'

import { coordsText } from '../../components/coordinatorships/messages'
import CoordsGlyph from './CoordsGlyph.vue'

/**
 * 08 başlığı (E-08-02…06). Alt satır: "‹N› koordinatörlük" (kesilmede "sınıra ulaşmış olabilir"),
 * "‹N› kişi" (`total_users`, yöneticiler dahil ipucu; rapor yoksa parça yok), "‹YYYY› sezonu"
 * (program kaydında yıl yoksa parça yok); "üst birim" parçası çizilmez (P16). "Yapıyı düzenle"
 * BE-016 stub; "Yeni koordinatörlük" yetkide; "Diğer işlemler" menüsünde yalnız "Sezona kopyala"
 * devre dışı + açıklama (P17; görev aktarımı başlatmaz, "Roller" çizilmez).
 */
const props = defineProps<{
  count: number | null
  truncated: boolean
  people: number | null
  year: number | null
  canCreate: boolean
  canMore: boolean
}>()
const emit = defineEmits<{ create: [] }>()

const parts = computed(() => {
  const out: { key: string; text: string; title?: string }[] = []
  if (props.count !== null) {
    const key = props.truncated ? 'countTruncated' : 'count'
    out.push({ key: 'count', text: coordsText(`coordinatorships.head.${key}`, { n: props.count }) })
  }
  if (props.people !== null) {
    out.push({
      key: 'people',
      text: coordsText('coordinatorships.head.people', { n: props.people }),
      title: coordsText('coordinatorships.head.peopleHint'),
    })
  }
  if (props.year !== null) {
    out.push({
      key: 'season',
      text: coordsText('coordinatorships.head.season', { year: props.year }),
    })
  }
  return out
})

const moreOpen = ref(false)
const moreRoot = ref<HTMLElement | null>(null)

function closeMore(returnFocus: boolean): void {
  moreOpen.value = false
  if (returnFocus) {
    void nextTick(() => moreRoot.value?.querySelector<HTMLElement>('.coords-more__btn')?.focus())
  }
}

function onOutside(event: PointerEvent): void {
  if (moreRoot.value && !moreRoot.value.contains(event.target as Node)) closeMore(false)
}

watch(moreOpen, (open) => {
  if (open) document.addEventListener('pointerdown', onOutside, true)
  else document.removeEventListener('pointerdown', onOutside, true)
})
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside, true))
</script>

<template>
  <div class="rp-head">
    <div>
      <h1 class="rp-h1">{{ coordsText('coordinatorships.head.title') }}</h1>
      <p v-if="parts.length" class="rp-sub" data-testid="coords-sub">
        <template v-for="(part, i) in parts" :key="part.key">
          <span v-if="i > 0" aria-hidden="true"> · </span>
          <span :data-part="part.key" :title="part.title">{{ part.text }}</span>
        </template>
      </p>
    </div>
    <div class="rp-actions">
      <DesignStub id="BE-016">
        <UiButton disabled data-testid="edit-structure">
          <CoordsGlyph name="branch" />
          {{ coordsText('coordinatorships.head.editStructure') }}
        </UiButton>
      </DesignStub>
      <UiButton v-if="canCreate" variant="primary" icon="plus" @click="emit('create')">
        {{ coordsText('coordinatorships.head.create') }}
      </UiButton>
      <span
        v-if="canMore"
        ref="moreRoot"
        class="coords-more"
        @keydown.escape="moreOpen && closeMore(true)"
      >
        <UiIconButton
          class="coords-more__btn"
          icon="more"
          size="md"
          :label="coordsText('coordinatorships.head.more')"
          aria-haspopup="menu"
          :aria-expanded="moreOpen ? 'true' : 'false'"
          @click="moreOpen = !moreOpen"
        />
        <UiMenu
          v-if="moreOpen"
          class="coords-more__pop"
          :label="coordsText('coordinatorships.head.more')"
          :autofocus="false"
          @close="closeMore($event === 'escape')"
        >
          <UiMenuItem disabled data-testid="copy-season">
            {{ coordsText('coordinatorships.head.copySeason') }}
          </UiMenuItem>
          <p class="rp-cap coords-more__note">
            {{ coordsText('coordinatorships.head.copySeasonNote') }}
          </p>
        </UiMenu>
      </span>
    </div>
  </div>
</template>
