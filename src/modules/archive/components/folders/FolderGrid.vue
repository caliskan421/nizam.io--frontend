<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { UiButton, UiEmptyState } from '@/shared/ui'

import { FOLDER_CARD_PAGE, pageCards } from '../../model/folder-cards'
import type { FolderGridEmits, FolderGridProps } from '../index'
import FolderCard from './FolderCard.vue'
import './folders.css'
import FolderSortMenu from './FolderSortMenu.vue'

/**
 * Koordinatörlük ızgarası (E-06-08/09/10/16). Başlıkta kart sayısı (aynı kaynaktan), sıra düğmesi
 * (yalnız ad/dosya sayısı), ilk 12 kart + "‹N› koordinatörlük daha" (yerinde istemci genişletmesi,
 * ayrı sayfa yok; aynı düğme "Daha az göster" olur, odak kaybolmaz). Yükleniyor / boş / hata
 * durumları ortak bileşenlerle en sade (P3, K7).
 */
const props = defineProps<FolderGridProps>()
const emit = defineEmits<FolderGridEmits>()
const { t } = useI18n()

const expanded = ref(false)
const page = computed(() => pageCards(props.cards, expanded.value))
const hasCounts = computed(() => props.cards.some((card) => card.fileCount !== null))
const collapsible = computed(() => props.cards.length > FOLDER_CARD_PAGE)
</script>

<template>
  <section class="archive-coords" aria-labelledby="archive-coords-title">
    <div class="rp-cardhead archive-coords__head">
      <h2 id="archive-coords-title" class="rp-cardtitle">
        {{ t('archive.folders.coordinatorships.title') }}
        <span v-if="!loading && !error" class="rp-count archive-coords__count">{{
          cards.length
        }}</span>
      </h2>
      <div class="rp-actions">
        <FolderSortMenu
          :field="sortField"
          :direction="sortDirection"
          :has-counts="hasCounts"
          @update:sort="(field, direction) => emit('update:sort', field, direction)"
        />
      </div>
    </div>
    <p v-if="loading" class="rp-cap" role="status">
      {{ t('archive.folders.coordinatorships.loading') }}
    </p>
    <UiEmptyState
      v-else-if="error"
      icon="alert"
      :title="t('archive.folders.coordinatorships.error')"
      :text="t('archive.folders.coordinatorships.errorText')"
    >
      <template #action>
        <UiButton size="sm" @click="emit('retry')">
          {{ t('archive.folders.coordinatorships.retry') }}
        </UiButton>
      </template>
    </UiEmptyState>
    <UiEmptyState
      v-else-if="cards.length === 0"
      icon="archive"
      :title="t('archive.folders.coordinatorships.empty')"
      :text="t('archive.folders.coordinatorships.emptyText')"
    />
    <template v-else>
      <div class="archive-grid">
        <FolderCard
          v-for="card in page.shown"
          :key="card.folderId"
          :card="card"
          @open="emit('open', $event)"
        />
      </div>
      <button
        v-if="collapsible"
        type="button"
        class="rp-link archive-more"
        :aria-expanded="expanded ? 'true' : 'false'"
        @click="expanded = !expanded"
      >
        {{
          expanded
            ? t('archive.folders.coordinatorships.less')
            : t('archive.folders.coordinatorships.more', { count: page.remaining })
        }}
      </button>
    </template>
  </section>
</template>
