<script setup lang="ts">
import { DesignStub, UiEmptyState } from '@/shared/ui'

import { homeText } from '../../model/messages'
import { RECENT_ACTIVITY } from '../../model/role/stubs'

/**
 * "Son etkinlik" (E-K1-40): audit okuma yok (BE-010; rol kapsamlı okuma BE-091) → statik nötr
 * yer tutucu; sahte akış yok (§4, P6). Eylem tetiklemez.
 */
const activity = RECENT_ACTIVITY
</script>

<template>
  <section class="t-card rh-card rh-card--aside" data-region="activity" aria-labelledby="k1-act">
    <h2 id="k1-act" class="rh-cardtitle">{{ homeText('home.k1.activity.title') }}</h2>
    <DesignStub v-if="!activity.available" id="BE-010" as="div">
      <UiEmptyState
        :title="homeText('home.k1.activity.empty')"
        :text="homeText('home.k1.activity.soon')"
        icon="clock"
      />
    </DesignStub>
  </section>
</template>
