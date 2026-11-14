<script setup lang="ts">
import { UiButton } from '@/shared/ui'

import type { RoleLoadScope } from '../../model/role/common'
import { homeText } from '../../model/messages'

/**
 * Kısmi yükleme kapsam etiketi (CX-F6-E-03, P4, ortak-kurallar §10): program geneli görev
 * listesi imleçle yüklenirken tavana (5 sayfa) dayandıysa ya da sonraki sayfa hata verdiyse,
 * istemci türevleri "ilk ‹N› görev" kapsamıyla etiketlenir; sahte toplam yoktur. Tavanda
 * "Devam et", hatada "Yeniden dene" tek sayfa daha ister (`loadMore`). `compact` yalnız etiket
 * (ikincil bölgeler; eylem birincil bölgede).
 */
defineProps<{ scope: RoleLoadScope; loaded: number; compact?: boolean }>()
const emit = defineEmits<{ more: [] }>()
</script>

<template>
  <p class="rh-note" data-scope-note :data-scope="scope">
    <template v-if="compact">{{ homeText('home.scope.short', { n: loaded }) }}</template>
    <template v-else>
      {{ homeText(`home.scope.${scope}`, { n: loaded }) }}
      <UiButton
        v-if="scope !== 'loading'"
        variant="secondary"
        size="sm"
        data-action="scope-more"
        @click="emit('more')"
      >
        {{ homeText(scope === 'failed' ? 'home.scope.retry' : 'home.scope.more') }}
      </UiButton>
    </template>
  </p>
</template>
