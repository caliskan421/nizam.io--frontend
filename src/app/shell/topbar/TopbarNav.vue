<script setup lang="ts">
import { useRouter } from 'vue-router'

import { UiIcon } from '@/shared/ui'

import { topbarText } from './messages'
import { useNavHistory } from './nav-history'

/** Geri / İleri (E-00-33/34): uygulama içi gezinme yığını yoksa devre dışı. */
const { canBack, canForward, back, forward } = useNavHistory(useRouter())
</script>

<template>
  <div class="rp-navbtns" role="group" :aria-label="topbarText('topbar.history')">
    <button
      type="button"
      data-testid="topbar-back"
      :aria-label="topbarText('topbar.back')"
      :title="topbarText('topbar.back')"
      :disabled="!canBack"
      @click="back"
    >
      <UiIcon name="back" />
    </button>
    <button
      type="button"
      data-testid="topbar-forward"
      :aria-label="topbarText('topbar.forward')"
      :title="topbarText('topbar.forward')"
      :disabled="!canForward"
      @click="forward"
    >
      <UiIcon name="forward" />
    </button>
  </div>
</template>
