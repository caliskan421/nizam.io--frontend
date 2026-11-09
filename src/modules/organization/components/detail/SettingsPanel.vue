<script setup lang="ts">
import { UiButton } from '@/shared/ui'

import type { CoordinatorshipView } from '../../model/types'
import { detailText } from './messages'

/**
 * Ayarlar sekmesi (E-08-63; yalnız `editDepartment`): programdaki ad, katalog kodu ve açıklaması
 * salt gösterim + "Düzenle" → W74 `DepartmentForm` (programdaki ad `renameDepartmentLink`,
 * katalog alanları `updateDepartment` "tüm sezonlarda geçerli"; form açılışta taze okur).
 * Görünürlük ayarı çizilmez (BE-018).
 */
defineProps<{ view: CoordinatorshipView }>()
const emit = defineEmits<{ edit: [] }>()
</script>

<template>
  <section
    class="t-card cd-card cd-narrow"
    aria-labelledby="cd-settings-title"
    data-card="settings"
  >
    <div class="rp-cardhead cd-cardhead">
      <h2 id="cd-settings-title" class="rp-cardtitle">
        {{ detailText('organization.coordinatorship.settings.label') }}
      </h2>
      <UiButton size="sm" data-action="settings-edit" @click="emit('edit')">
        {{ detailText('organization.coordinatorship.settings.edit') }}
      </UiButton>
    </div>
    <dl class="rp-dl cd-dl">
      <dt>{{ detailText('organization.coordinatorship.settings.name') }}</dt>
      <dd data-setting="name">{{ view.displayName }}</dd>
      <dt>{{ detailText('organization.coordinatorship.settings.code') }}</dt>
      <dd class="rp-mono" data-setting="code">
        {{ view.code ?? detailText('organization.coordinatorship.settings.none') }}
      </dd>
      <dt>{{ detailText('organization.coordinatorship.settings.description') }}</dt>
      <dd class="cd-wrap" data-setting="description">
        {{ view.stat?.description || detailText('organization.coordinatorship.settings.none') }}
      </dd>
    </dl>
  </section>
</template>
