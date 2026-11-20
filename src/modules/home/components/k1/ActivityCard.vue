<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { AUDIT_ROUTE, AuditFeed, useAuditScope } from '@/modules/audit/public'
import { useScopeStore } from '@/shared/scope/store'

import { homeText } from '../../model/messages'

const store = useScopeStore()
const { programId } = useAuditScope()
const subject = computed(() =>
  store.departmentId ? { department: [store.departmentId] } : undefined,
)
</script>

<template>
  <section class="t-card rh-card rh-card--aside" data-region="activity" aria-labelledby="k1-act">
    <div class="rp-cardhead">
      <h2 id="k1-act" class="rh-cardtitle">{{ homeText('home.k1.activity.title') }}</h2>
      <RouterLink
        v-if="programId"
        class="rp-link"
        :to="{ name: AUDIT_ROUTE.name, query: { koord: subject?.department } }"
      >
        {{ homeText('home.recent.all') }}
      </RouterLink>
    </div>
    <AuditFeed :subject="subject" />
  </section>
</template>
