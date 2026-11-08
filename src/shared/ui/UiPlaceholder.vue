<script setup lang="ts">
import './styles/ui.css'

import { computed } from 'vue'

import { uiText } from './messages'

/**
 * Statik öğe için nötr yer tutucu (ortak-kurallar §4): "Henüz veri yok" / "Yakında" ya da
 * çağıranın kısa açıklaması. Sahte kişi adı, tarih, sayı ya da işlem metni üretmez; içerik
 * yuvası yoktur. `inline`: satır içi (ör. sayı yerine), aksi hâlde `rp-empty` blok.
 */
const props = withDefaults(
  defineProps<{ kind?: 'empty' | 'soon'; text?: string; inline?: boolean }>(),
  { kind: 'empty', text: undefined, inline: false },
)
const label = computed(() => props.text ?? uiText(`ui.placeholder.${props.kind}`))
</script>

<template>
  <span v-if="inline" class="ui-placeholder" data-placeholder>{{ label }}</span>
  <div v-else class="rp-empty" data-placeholder>
    <p class="rp-empty__text">{{ label }}</p>
  </div>
</template>
