<script setup lang="ts">
import { RouterLink } from 'vue-router'

import type { ApiError } from '@/shared/errors/api-error'
import { DesignStub, UiAvatar, UiButton, UiCount } from '@/shared/ui'

import { useRoleFacts } from '../../api/role/use-facts'
import { useRoleWrites } from './use-role-writes'
import { homeText } from '../../model/messages'
import { assigneeNames, type WorkRow } from '../../model/role/common'
import { taskLocation, tasksLocation } from '../../model/role/links'
import DueText from './DueText.vue'
import RegionBody from './RegionBody.vue'

/**
 * "Onay bekleyen ‹n›" (E-K1-14…18): `status = onaya_sunuldu` satırları yüklenen kümeden; sayı
 * sunucu sayacıdır. "Onayla" / "İade et" 03'ün durum geçişidir (`transitionWorkItem`, K5):
 * yetki olgudan, iyimser güncelleme yok. Kod `—` (BE-005); "gönderildi" ve "dosya" gizli
 * (BE-137: satırda alan yok, görev başına dosya listesi yasak). İade sebebi sözleşmede yoktur
 * (yalnız tamamlanmış görevi geri almada gerekçe istenir) — vaat edilmez.
 */
defineProps<{
  items: readonly WorkRow[]
  /** Sunucu sayacı; sayaç yokken kısmi kümede alt sınır ("≥N", CX-F6-E-07). */
  count: number | string
  today: string
  loading?: boolean
  error?: Pick<ApiError, 'messageKey' | 'requestId'> | null
  retrying?: boolean
}>()
const emit = defineEmits<{ retry: [] }>()

const facts = useRoleFacts()
const writes = useRoleWrites()
</script>

<template>
  <section class="t-card rh-card" data-region="approvals" aria-labelledby="k1-appr-title">
    <div class="rh-cardhead">
      <h2 id="k1-appr-title" class="rh-cardtitle">
        <span class="rh-dot rh-dot--review" aria-hidden="true" />
        {{ homeText('home.k1.approvals.title') }}
        <UiCount :value="count" />
      </h2>
      <RouterLink class="rh-link" :to="tasksLocation('onaya_sunuldu')">
        {{ homeText('home.k1.approvals.open') }}
      </RouterLink>
    </div>
    <p class="rh-note">{{ homeText('home.k1.approvals.note') }}</p>
    <RegionBody
      :loading="loading"
      :error="error"
      :retrying="retrying"
      :empty="items.length === 0 ? homeText('home.k1.approvals.empty') : null"
      @retry="emit('retry')"
    >
      <div v-for="item in items" :key="item.work_item_id" class="rh-row rh-row--appr" data-row>
        <span class="rh-dot rh-dot--review" aria-hidden="true" />
        <span class="rh-stack">
          <span class="rh-line">
            <RouterLink class="rh-title" :to="taskLocation(item.work_item_id)">
              {{ item.title }}
            </RouterLink>
            <DesignStub id="BE-005">
              <span class="rh-kicker">{{ homeText('home.k1.common.code') }}</span>
            </DesignStub>
          </span>
          <span class="rh-meta">
            <span class="rh-who">
              <UiAvatar :name="assigneeNames(item)[0] ?? '?'" size="sm" />
              {{ assigneeNames(item).join(', ') || homeText('home.k1.common.unknownPerson') }}
            </span>
            <span aria-hidden="true">·</span>
            <DueText :item="item" :today="today" />
          </span>
        </span>
        <span class="rh-btns">
          <UiButton
            v-if="facts.canMove(item, 'iade_edildi')"
            variant="ghost"
            size="sm"
            icon="undo"
            :disabled="writes.pendingId.value === item.work_item_id"
            :aria-label="homeText('home.k1.approvals.returnLabel', { title: item.title })"
            data-action="return"
            @click="writes.move(item, 'iade_edildi', 'transition', 'home.k1.write.returned')"
          >
            {{ homeText('home.k1.approvals.return') }}
          </UiButton>
          <UiButton
            v-if="facts.canMove(item, 'tamamlandi')"
            variant="primary"
            size="sm"
            icon="check"
            :disabled="writes.pendingId.value === item.work_item_id"
            :aria-label="homeText('home.k1.approvals.approveLabel', { title: item.title })"
            data-action="approve"
            @click="writes.move(item, 'tamamlandi', 'transition', 'home.k1.write.approved')"
          >
            {{ homeText('home.k1.approvals.approve') }}
          </UiButton>
        </span>
      </div>
    </RegionBody>
  </section>
</template>
