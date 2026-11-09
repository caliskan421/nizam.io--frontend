<script setup lang="ts">
import './skeleton-page.css'

import { useRoute } from 'vue-router'

import { UiPlaceholder } from '@/shared/ui'

/**
 * İSKELET yer tutucu sayfa (W71): F2 geçişinde rotalar canlı, gövdeler O2b'de (W72–W76) kendi
 * sayfa dosyalarında kurulur. Boş ama bozuk değil: başlık katalogdan (`meta.title`), nötr
 * "Yakında" yer tutucusu; sahte veri yok (ortak-kurallar §4), istek yok.
 */
defineProps<{ name: string }>()
const route = useRoute()
</script>

<template>
  <section class="org-skeleton-page" :data-skeleton-page="name">
    <div class="rp-head">
      <h1 class="rp-h1">{{ route.meta.title }}</h1>
    </div>
    <div class="org-skeleton-page__body">
      <UiPlaceholder kind="soon" />
    </div>
  </section>
</template>
