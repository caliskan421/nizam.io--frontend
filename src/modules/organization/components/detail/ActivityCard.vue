<script setup lang="ts">
import { DesignStub, UiPlaceholder } from '@/shared/ui'

import { detailText } from './messages'

/**
 * Son etkinlik (E-08-90): etkinlik/audit okuma ucu yok (BE-018; yönetici dışı BE-091) → nötr yer
 * tutucu, sahte akış yok (ortak-kurallar §4).
 */
</script>

<template>
  <section
    class="t-card cd-card cd-card--aside"
    aria-labelledby="cd-feed-title"
    data-card="activity"
  >
    <h2 id="cd-feed-title" class="rp-cardtitle cd-feed__title">
      {{ detailText('organization.coordinatorship.activity.title') }}
    </h2>
    <DesignStub id="BE-018" as="div" data-testid="cd-activity">
      <UiPlaceholder :text="detailText('organization.coordinatorship.activity.empty')" />
    </DesignStub>
  </section>
</template>
