<script setup lang="ts">
import { AuditFeed } from '@/modules/audit/public'

import { detailText } from './messages'

defineProps<{ departmentId: string }>()
</script>

<template>
  <section
    class="t-card cd-card cd-card--aside"
    aria-labelledby="cd-feed-title"
    data-card="activity"
  >
    <h2 id="cd-feed-title" class="rp-cardtitle cd-feed__title">
      {{ detailText('coordinatorship.activity.title') }}
    </h2>
    <AuditFeed data-testid="cd-activity" :subject="{ department: [departmentId] }" />
  </section>
</template>
