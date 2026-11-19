<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { AUDIT_ROUTE, AuditFeed, useAuditScope } from '@/modules/audit/public'
import { UiIcon } from '@/shared/ui'

import { homeText } from '../model/messages'

const { programId } = useAuditScope()
</script>

<template>
  <section class="t-card home-card" data-region="recent">
    <div class="rp-cardhead">
      <h2 class="rp-cardtitle">{{ homeText('home.recent.title') }}</h2>
      <RouterLink v-if="programId" class="rp-link" :to="{ name: AUDIT_ROUTE.name }" data-recent-all>
        {{ homeText('home.recent.all') }}<UiIcon name="chevron-right" size="sm" />
      </RouterLink>
    </div>
    <AuditFeed />
  </section>
</template>
