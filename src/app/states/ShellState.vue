<script setup lang="ts">
import './states.css'

import { computed } from 'vue'

import type { ShellContent } from '@/app/shell/types'
import { injectScopeLifecycle } from '@/app/shell/side/public'
import { toApiError } from '@/shared/errors/api-error'
import { UiEmptyState, UiErrorState } from '@/shared/ui'

import { statesText } from './messages'
import OpenState from './OpenState.vue'

/**
 * Kabuk ana alanında rota içeriği yerine gösterilen durum (`resolveShellContent`). Yönetici
 * olgusu mercekten bağımsızdır (P1). Hata metni koddan (sunucu `message` alanı yok); yeniden
 * deneme standing'i tazeler.
 */
const props = defineProps<{ content: Exclude<ShellContent, { kind: 'content' }> }>()
const lifecycle = injectScopeLifecycle()
const admin = computed(() => lifecycle.facts.value.companyAdmin)
const error = computed(() => toApiError(lifecycle.error.value))
const kind = computed(() => props.content.kind)
</script>

<template>
  <section class="shell-state" data-testid="shell-state" :data-kind="kind">
    <OpenState v-if="content.kind === 'open-state'" :name="content.name" :admin="admin" />
    <UiEmptyState
      v-else-if="content.kind === 'selecting'"
      icon="coords"
      :title="statesText('states.selecting.title')"
      :text="statesText('states.selecting.text')"
    />
    <UiErrorState
      v-else-if="content.kind === 'error'"
      :error="error"
      :title="statesText('states.error')"
      retryable
      @retry="lifecycle.refreshStanding()"
    />
    <div v-else class="rp-empty" role="status" aria-busy="true">
      <p class="rp-empty__text">{{ statesText('states.loading') }}</p>
    </div>
  </section>
</template>
